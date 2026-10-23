import { Injectable } from '@nestjs/common';
import {
  ComplianceDeclaration,
  DEFAULT_SUBMISSION_REQUIREMENTS,
  DeliverableCategory,
  EventSubmissionConfig,
  SUBMISSION_LOCKED_STATUSES,
  SubmissionRequirement,
  SubmissionStatus,
} from '@hackos/shared';
import {
  ComplianceDeclaration as PrismaCompliance,
  DeliverableCategory as PrismaCategory,
  FileValidationStatus,
  Prisma,
  Submission,
  SubmissionCompliance,
  SubmissionFile,
  Team,
} from '@prisma/client';

export interface ValidationItem {
  key: string;
  category: 'required_files' | 'metadata' | 'team' | 'compliance';
  label: string;
  passed: boolean;
  message?: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationReport {
  passed: boolean;
  items: ValidationItem[];
  readinessScore: number;
  canSubmit: boolean;
  checkedAt: string;
}

type SubmissionWithRelations = Submission & {
  files: SubmissionFile[];
  compliance: SubmissionCompliance[];
  team: Team & {
    members: { userId: string }[];
    leaderId: string | null;
  };
};

const MIME_BY_CATEGORY: Partial<Record<DeliverableCategory, RegExp>> = {
  [DeliverableCategory.DOCUMENTS]: /\.(pdf|docx?|txt)$/i,
  [DeliverableCategory.IMAGES]: /\.(png|jpe?g|svg|webp|gif)$/i,
  [DeliverableCategory.VIDEOS]: /\.(mp4|webm|mov)$/i,
  [DeliverableCategory.PRESENTATION]: /\.(pdf|pptx?)$/i,
};

@Injectable()
export class SubmissionValidationService {
  getEventConfig(settings: unknown): EventSubmissionConfig {
    const raw = (settings as Record<string, unknown> | null) ?? {};
    const submission = (raw.submission as EventSubmissionConfig | undefined) ?? {};
    return {
      submissionDeadline: submission.submissionDeadline,
      allowEditAfterSubmit: submission.allowEditAfterSubmit ?? false,
      maxFileSizeMb: submission.maxFileSizeMb ?? 50,
      requirements: submission.requirements ?? DEFAULT_SUBMISSION_REQUIREMENTS,
      showcaseVisibility: submission.showcaseVisibility ?? 'judges',
    };
  }

  validateFile(
    file: Pick<SubmissionFile, 'name' | 'url' | 'mimeType' | 'size' | 'category'>,
    requirement: SubmissionRequirement | undefined,
    maxSizeMb: number,
  ): { status: FileValidationStatus; message?: string } {
    const maxBytes = (requirement?.maxSizeMb ?? maxSizeMb) * 1024 * 1024;
    if (file.size > maxBytes) {
      return {
        status: FileValidationStatus.INVALID,
        message: `File exceeds maximum size of ${requirement?.maxSizeMb ?? maxSizeMb} MB`,
      };
    }

    if (requirement?.allowedMimeTypes?.length) {
      const ok = requirement.allowedMimeTypes.some(
        (t) => file.mimeType === t || file.name.toLowerCase().endsWith(t.replace('*', '')),
      );
      if (!ok) {
        return {
          status: FileValidationStatus.INVALID,
          message: `File type not allowed. Expected: ${requirement.allowedMimeTypes.join(', ')}`,
        };
      }
    }

    const categoryPattern = MIME_BY_CATEGORY[file.category as DeliverableCategory];
    if (categoryPattern && !categoryPattern.test(file.name) && !file.url.match(categoryPattern)) {
      return {
        status: FileValidationStatus.INVALID,
        message: `File format may not match category ${file.category}`,
      };
    }

    if (!file.url.trim()) {
      return { status: FileValidationStatus.INVALID, message: 'File URL is required' };
    }

    return { status: FileValidationStatus.VALID };
  }

  buildReport(
    submission: SubmissionWithRelations,
    config: EventSubmissionConfig,
  ): ValidationReport {
    const items: ValidationItem[] = [];
    const requirements = config.requirements ?? DEFAULT_SUBMISSION_REQUIREMENTS;

    for (const req of requirements) {
      const hasFile = submission.files.some(
        (f) =>
          f.requirementKey === req.key ||
          (f.category === (req.category as PrismaCategory) && !f.requirementKey),
      );
      const hasLink =
        (req.key === 'source_code' && !!submission.githubUrl) ||
        (req.key === 'demo_video' && !!submission.demoUrl) ||
        (req.key === 'presentation' && !!submission.slidesUrl);

      const passed = hasFile || hasLink;
      if (req.mandatory) {
        items.push({
          key: req.key,
          category: 'required_files',
          label: req.label,
          passed,
          severity: passed ? 'info' : 'error',
          message: passed ? undefined : `${req.label} is required`,
        });
      }
    }

    const metadataChecks: Array<{ key: string; label: string; passed: boolean; message?: string }> = [
      {
        key: 'title',
        label: 'Project title present',
        passed: submission.title.trim().length >= 3,
        message: 'Project title must be at least 3 characters',
      },
      {
        key: 'description',
        label: 'Description complete',
        passed: (submission.description?.trim().length ?? 0) >= 20,
        message: 'Detailed description should be at least 20 characters',
      },
      {
        key: 'executive_summary',
        label: 'Executive summary complete',
        passed: (submission.executiveSummary?.trim().length ?? 0) >= 30,
        message: 'Executive summary should be at least 30 characters',
      },
      {
        key: 'technologies',
        label: 'Technologies selected',
        passed: submission.technologies.length >= 1,
        message: 'Select at least one technology',
      },
      {
        key: 'problem_statement',
        label: 'Problem statement provided',
        passed: (submission.problemStatement?.trim().length ?? 0) >= 20,
        message: 'Problem statement is required',
      },
    ];

    for (const check of metadataChecks) {
      items.push({
        ...check,
        category: 'metadata',
        severity: check.passed ? 'info' : 'error',
      });
    }

    const minMembers = 1;
    const hasLeader = !!submission.team.leaderId;
    items.push({
      key: 'team_size',
      category: 'team',
      label: 'Minimum team members',
      passed: submission.team.members.length >= minMembers,
      severity: submission.team.members.length >= minMembers ? 'info' : 'error',
      message:
        submission.team.members.length >= minMembers
          ? undefined
          : `Team must have at least ${minMembers} member(s)`,
    });
    items.push({
      key: 'team_leader',
      category: 'team',
      label: 'Team leader assigned',
      passed: hasLeader,
      severity: hasLeader ? 'info' : 'error',
      message: hasLeader ? undefined : 'Assign a team leader before submitting',
    });

    const mandatoryDeclarations = [
      ComplianceDeclaration.ORIGINAL_WORK,
      ComplianceDeclaration.EVENT_RULES,
      ComplianceDeclaration.REQUIRED_DOCUMENTS,
      ComplianceDeclaration.TEAM_VERIFIED,
      ComplianceDeclaration.IP_DECLARATION,
    ] as PrismaCompliance[];

    for (const decl of mandatoryDeclarations) {
      const record = submission.compliance.find((c) => c.declaration === decl);
      const passed = record?.accepted === true;
      items.push({
        key: decl,
        category: 'compliance',
        label: decl.replace(/_/g, ' ').toLowerCase(),
        passed,
        severity: passed ? 'info' : 'error',
        message: passed ? undefined : 'Mandatory declaration not accepted',
      });
    }

    const invalidFiles = submission.files.filter(
      (f) => f.validationStatus === FileValidationStatus.INVALID,
    );
    if (invalidFiles.length > 0) {
      items.push({
        key: 'file_validation',
        category: 'required_files',
        label: 'All uploads validated',
        passed: false,
        severity: 'error',
        message: `${invalidFiles.length} file(s) failed validation`,
      });
    }

    const errors = items.filter((i) => !i.passed && i.severity === 'error');
    const totalChecks = items.length;
    const passedChecks = items.filter((i) => i.passed).length;
    const readinessScore =
      totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

    return {
      passed: errors.length === 0,
      items,
      readinessScore,
      canSubmit: errors.length === 0,
      checkedAt: new Date().toISOString(),
    };
  }

  isLocked(status: SubmissionStatus | string): boolean {
    return SUBMISSION_LOCKED_STATUSES.includes(status as SubmissionStatus);
  }

  deriveStatus(
    submission: SubmissionWithRelations,
    report: ValidationReport,
  ): SubmissionStatus {
    if (this.isLocked(submission.status)) {
      return submission.status as SubmissionStatus;
    }

    const hasAnyContent =
      submission.files.length > 0 ||
      !!submission.description ||
      !!submission.executiveSummary;

    if (!hasAnyContent) return SubmissionStatus.DRAFT;
    if (report.canSubmit) return SubmissionStatus.READY_FOR_SUBMISSION;
    if (report.readinessScore >= 50) return SubmissionStatus.IN_PROGRESS;
    return SubmissionStatus.IN_PROGRESS;
  }

  snapshotSubmission(submission: SubmissionWithRelations): Prisma.InputJsonValue {
    return {
      title: submission.title,
      description: submission.description,
      category: submission.category,
      executiveSummary: submission.executiveSummary,
      problemStatement: submission.problemStatement,
      objectives: submission.objectives,
      innovationSummary: submission.innovationSummary,
      solutionSummary: submission.solutionSummary,
      expectedImpact: submission.expectedImpact,
      technologies: submission.technologies,
      githubUrl: submission.githubUrl,
      demoUrl: submission.demoUrl,
      slidesUrl: submission.slidesUrl,
      logoUrl: submission.logoUrl,
      teamPhotoUrl: submission.teamPhotoUrl,
      repositoryType: submission.repositoryType,
      files: submission.files.map((f) => ({
        id: f.id,
        name: f.name,
        url: f.url,
        category: f.category,
        requirementKey: f.requirementKey,
      })),
      compliance: submission.compliance.map((c) => ({
        declaration: c.declaration,
        accepted: c.accepted,
      })),
    };
  }
}
