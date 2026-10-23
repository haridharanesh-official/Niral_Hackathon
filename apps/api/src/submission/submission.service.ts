import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ComplianceDeclaration,
  SubmissionStatus,
} from '@hackos/shared';
import {
  ComplianceDeclaration as PrismaCompliance,
  Prisma,
  UserRole,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { TeamsService } from '../teams/teams.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway } from '../events/events.gateway';
import { SubmissionValidationService } from './submission-validation.service';
import {
  AcceptComplianceDto,
  AddDeliverableDto,
  CreateVersionDto,
  SubmitProjectDto,
  UpdateDeliverableDto,
  UpdateSubmissionDetailsDto,
} from './dto/submission.dto';

const SUBMISSION_INCLUDE = {
  files: { orderBy: { createdAt: 'desc' as const } },
  compliance: true,
  versions: { orderBy: { versionNumber: 'desc' as const }, take: 10 },
  team: {
    include: {
      members: { include: { user: { select: { id: true, name: true, image: true } } } },
      leader: { select: { id: true, name: true, image: true } },
      event: true,
    },
  },
} satisfies Prisma.SubmissionInclude;

@Injectable()
export class SubmissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly teams: TeamsService,
    private readonly validation: SubmissionValidationService,
    private readonly notifications: NotificationsService,
    private readonly events: EventsGateway,
  ) {}

  private async resolveTeam(userId: string) {
    const team = await this.teams.getMyTeam(userId);
    if (!team) {
      throw new ForbiddenException(
        'Join or create a team to access the submission workspace',
      );
    }
    return team;
  }

  private async getOrCreateSubmission(teamId: string, teamName: string) {
    let submission = await this.prisma.submission.findUnique({
      where: { teamId },
      include: SUBMISSION_INCLUDE,
    });

    if (!submission) {
      submission = await this.prisma.submission.create({
        data: {
          teamId,
          title: teamName,
          status: SubmissionStatus.DRAFT,
        },
        include: SUBMISSION_INCLUDE,
      });
    }

    return submission;
  }

  private assertEditable(submission: { status: string; lockedAt: Date | null }) {
    if (this.validation.isLocked(submission.status)) {
      throw new BadRequestException(
        'Submission is locked and cannot be edited',
      );
    }
  }

  private async refreshValidation(submissionId: string) {
    const submission = await this.prisma.submission.findUniqueOrThrow({
      where: { id: submissionId },
      include: SUBMISSION_INCLUDE,
    });

    const config = this.validation.getEventConfig(submission.team.event?.settings);
    const report = this.validation.buildReport(submission, config);
    const status = this.validation.deriveStatus(submission, report);

    return this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        readinessScore: report.readinessScore,
        validationReport: report as unknown as Prisma.InputJsonValue,
        status,
        lastSavedAt: new Date(),
      },
      include: SUBMISSION_INCLUDE,
    });
  }

  async getWorkspace(userId: string) {
    const team = await this.resolveTeam(userId);
    let submission = await this.getOrCreateSubmission(team.id, team.name);
    submission = await this.refreshValidation(submission.id);

    const config = this.validation.getEventConfig(submission.team.event?.settings);
    const report = submission.validationReport as Record<string, unknown> | null;
    const deadline =
      config.submissionDeadline ?? submission.team.event?.endsAt?.toISOString();

    return {
      submission: this.formatSubmission(submission),
      team: {
        id: submission.team.id,
        name: submission.team.name,
        slug: submission.team.slug,
        theme: submission.team.theme,
        members: submission.team.members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          image: m.user.image,
          role: m.role,
        })),
        leader: submission.team.leader,
      },
      event: submission.team.event
        ? {
            id: submission.team.event.id,
            name: submission.team.event.name,
            slug: submission.team.event.slug,
            endsAt: submission.team.event.endsAt,
          }
        : null,
      config,
      validation: report,
      deadline,
      checklist: this.buildReadinessChecklist(submission, config),
    };
  }

  private buildReadinessChecklist(
    submission: Awaited<ReturnType<typeof this.getOrCreateSubmission>>,
    config: ReturnType<SubmissionValidationService['getEventConfig']>,
  ) {
    const requirements = config.requirements ?? [];
    return requirements.map((req) => {
      const hasFile = submission.files.some(
        (f) => f.requirementKey === req.key,
      );
      const hasLink =
        (req.key === 'source_code' && !!submission.githubUrl) ||
        (req.key === 'demo_video' && !!submission.demoUrl) ||
        (req.key === 'presentation' && !!submission.slidesUrl);
      return {
        key: req.key,
        label: req.label,
        mandatory: req.mandatory,
        complete: hasFile || hasLink,
      };
    });
  }

  async updateDetails(userId: string, dto: UpdateSubmissionDetailsDto) {
    const team = await this.resolveTeam(userId);
    const submission = await this.getOrCreateSubmission(team.id, team.name);
    this.assertEditable(submission);

    const updated = await this.prisma.submission.update({
      where: { id: submission.id },
      data: {
        ...dto,
        lastSavedAt: new Date(),
        status:
          submission.status === SubmissionStatus.DRAFT
            ? SubmissionStatus.IN_PROGRESS
            : submission.status,
      },
      include: SUBMISSION_INCLUDE,
    });

    await this.refreshValidation(updated.id);
    this.events.emitDashboardEvent('submission:updated', userId, {
      teamId: team.id,
      submissionId: updated.id,
    });

    const fresh = await this.prisma.submission.findUniqueOrThrow({
      where: { id: updated.id },
      include: SUBMISSION_INCLUDE,
    });

    return this.formatSubmission(fresh);
  }

  async addDeliverable(userId: string, dto: AddDeliverableDto) {
    const team = await this.resolveTeam(userId);
    const submission = await this.getOrCreateSubmission(team.id, team.name);
    this.assertEditable(submission);

    const config = this.validation.getEventConfig(submission.team.event?.settings);
    const requirement = config.requirements?.find((r) => r.key === dto.requirementKey);
    const fileValidation = this.validation.validateFile(
      dto,
      requirement,
      config.maxFileSizeMb ?? 50,
    );

    const file = await this.prisma.submissionFile.create({
      data: {
        submissionId: submission.id,
        name: dto.name,
        url: dto.url,
        mimeType: dto.mimeType,
        size: dto.size,
        category: dto.category,
        requirementKey: dto.requirementKey,
        validationStatus: fileValidation.status,
        validationMessage: fileValidation.message,
        versionNumber: submission.currentVersion,
        uploadedById: userId,
      },
    });

    await this.refreshValidation(submission.id);

    return file;
  }

  async updateDeliverable(userId: string, fileId: string, dto: UpdateDeliverableDto) {
    const team = await this.resolveTeam(userId);
    const submission = await this.getOrCreateSubmission(team.id, team.name);
    this.assertEditable(submission);

    const existing = await this.prisma.submissionFile.findFirst({
      where: { id: fileId, submissionId: submission.id },
    });
    if (!existing) throw new NotFoundException('Deliverable not found');

    const merged = { ...existing, ...dto };
    const config = this.validation.getEventConfig(submission.team.event?.settings);
    const requirement = config.requirements?.find(
      (r) => r.key === (dto.requirementKey ?? existing.requirementKey ?? undefined),
    );
    const fileValidation = this.validation.validateFile(
      merged,
      requirement,
      config.maxFileSizeMb ?? 50,
    );

    const file = await this.prisma.submissionFile.update({
      where: { id: fileId },
      data: {
        ...dto,
        validationStatus: fileValidation.status,
        validationMessage: fileValidation.message,
      },
    });

    await this.refreshValidation(submission.id);
    return file;
  }

  async removeDeliverable(userId: string, fileId: string) {
    const team = await this.resolveTeam(userId);
    const submission = await this.getOrCreateSubmission(team.id, team.name);
    this.assertEditable(submission);

    const existing = await this.prisma.submissionFile.findFirst({
      where: { id: fileId, submissionId: submission.id },
    });
    if (!existing) throw new NotFoundException('Deliverable not found');

    await this.prisma.submissionFile.delete({ where: { id: fileId } });
    await this.refreshValidation(submission.id);
    return { deleted: true };
  }

  async acceptCompliance(userId: string, dto: AcceptComplianceDto) {
    const team = await this.resolveTeam(userId);
    const submission = await this.getOrCreateSubmission(team.id, team.name);
    this.assertEditable(submission);

    const record = await this.prisma.submissionCompliance.upsert({
      where: {
        submissionId_declaration: {
          submissionId: submission.id,
          declaration: dto.declaration as PrismaCompliance,
        },
      },
      create: {
        submissionId: submission.id,
        declaration: dto.declaration as PrismaCompliance,
        accepted: dto.accepted,
        acceptedById: dto.accepted ? userId : null,
        acceptedAt: dto.accepted ? new Date() : null,
      },
      update: {
        accepted: dto.accepted,
        acceptedById: dto.accepted ? userId : null,
        acceptedAt: dto.accepted ? new Date() : null,
      },
    });

    await this.refreshValidation(submission.id);
    return record;
  }

  async runValidation(userId: string) {
    const team = await this.resolveTeam(userId);
    const submission = await this.getOrCreateSubmission(team.id, team.name);
    const refreshed = await this.refreshValidation(submission.id);
    return refreshed.validationReport;
  }

  async listVersions(userId: string) {
    const team = await this.resolveTeam(userId);
    const submission = await this.getOrCreateSubmission(team.id, team.name);

    return this.prisma.submissionVersion.findMany({
      where: { submissionId: submission.id },
      orderBy: { versionNumber: 'desc' },
      include: {
        author: { select: { id: true, name: true } },
      },
    });
  }

  async createVersion(userId: string, dto: CreateVersionDto) {
    const team = await this.resolveTeam(userId);
    const submission = await this.getOrCreateSubmission(team.id, team.name);
    this.assertEditable(submission);

    const nextVersion = submission.currentVersion + 1;
    const modifiedDeliverables = submission.files.map((f) => f.name);

    const version = await this.prisma.submissionVersion.create({
      data: {
        submissionId: submission.id,
        versionNumber: nextVersion,
        authorId: userId,
        changeSummary: dto.changeSummary ?? `Version ${nextVersion}`,
        snapshot: this.validation.snapshotSubmission(submission),
        modifiedDeliverables,
      },
    });

    await this.prisma.submission.update({
      where: { id: submission.id },
      data: { currentVersion: nextVersion },
    });

    return version;
  }

  async restoreVersion(userId: string, versionNumber: number) {
    const team = await this.resolveTeam(userId);
    const submission = await this.getOrCreateSubmission(team.id, team.name);
    this.assertEditable(submission);

    const version = await this.prisma.submissionVersion.findUnique({
      where: {
        submissionId_versionNumber: {
          submissionId: submission.id,
          versionNumber,
        },
      },
    });
    if (!version) throw new NotFoundException('Version not found');

    const snap = version.snapshot as Record<string, unknown>;
    await this.prisma.submission.update({
      where: { id: submission.id },
      data: {
        title: (snap.title as string) ?? submission.title,
        description: (snap.description as string) ?? null,
        category: (snap.category as string) ?? null,
        executiveSummary: (snap.executiveSummary as string) ?? null,
        problemStatement: (snap.problemStatement as string) ?? null,
        objectives: (snap.objectives as string) ?? null,
        innovationSummary: (snap.innovationSummary as string) ?? null,
        solutionSummary: (snap.solutionSummary as string) ?? null,
        expectedImpact: (snap.expectedImpact as string) ?? null,
        technologies: (snap.technologies as string[]) ?? [],
        githubUrl: (snap.githubUrl as string) ?? null,
        demoUrl: (snap.demoUrl as string) ?? null,
        slidesUrl: (snap.slidesUrl as string) ?? null,
        logoUrl: (snap.logoUrl as string) ?? null,
        teamPhotoUrl: (snap.teamPhotoUrl as string) ?? null,
        repositoryType: (snap.repositoryType as string) ?? null,
        lastSavedAt: new Date(),
      },
    });

    await this.refreshValidation(submission.id);
    return { restored: versionNumber };
  }

  async getPreview(userId: string) {
    const workspace = await this.getWorkspace(userId);
    return {
      ...workspace,
      judgeView: true,
    };
  }

  async submitProject(userId: string, dto: SubmitProjectDto) {
    if (!dto.confirm) {
      throw new BadRequestException('Submission confirmation is required');
    }

    const team = await this.resolveTeam(userId);
    const submission = await this.getOrCreateSubmission(team.id, team.name);
    this.assertEditable(submission);

    const config = this.validation.getEventConfig(submission.team.event?.settings);
    const report = this.validation.buildReport(submission, config);

    if (!report.canSubmit) {
      await this.prisma.submission.update({
        where: { id: submission.id },
        data: {
          status: SubmissionStatus.VALIDATION,
          validationReport: report as unknown as Prisma.InputJsonValue,
        },
      });
      throw new BadRequestException({
        message: 'Validation failed — resolve all required items before submitting',
        validation: report,
      });
    }

    const nextVersion = submission.currentVersion;
    const receiptId = `SUB-${randomBytes(4).toString('hex').toUpperCase()}`;
    const now = new Date();

    await this.prisma.submissionVersion.create({
      data: {
        submissionId: submission.id,
        versionNumber: nextVersion,
        authorId: userId,
        changeSummary: dto.changeSummary ?? 'Final submission',
        snapshot: this.validation.snapshotSubmission(submission),
        modifiedDeliverables: submission.files.map((f) => f.name),
      },
    });

    const updated = await this.prisma.submission.update({
      where: { id: submission.id },
      data: {
        status: SubmissionStatus.SUBMITTED,
        submittedAt: now,
        lockedAt: now,
        receiptId,
        readinessScore: report.readinessScore,
        validationReport: report as unknown as Prisma.InputJsonValue,
      },
      include: SUBMISSION_INCLUDE,
    });

    await this.prisma.team.update({
      where: { id: team.id },
      data: { status: 'SUBMITTED' },
    });

    this.events.emitDashboardEvent('submission:submitted', userId, {
      teamId: team.id,
      submissionId: updated.id,
      receiptId,
    });

    const organizers = await this.prisma.user.findMany({
      where: { role: { in: [UserRole.ORGANIZER, UserRole.ADMIN] } },
      select: { id: true },
    });

    await Promise.all(
      organizers.map((org) =>
        this.notifications.create({
          userId: org.id,
          title: 'New project submission',
          body: `${team.name} submitted "${updated.title}" for review.`,
          type: 'submission',
          link: '/dashboard/organizer',
        }),
      ),
    );

    return this.getReceipt(updated.id);
  }

  async getReceipt(submissionId: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        team: { include: { event: true } },
      },
    });
    if (!submission) throw new NotFoundException('Submission not found');

    return {
      receiptId: submission.receiptId,
      submissionId: submission.id,
      timestamp: submission.submittedAt?.toISOString() ?? null,
      version: submission.currentVersion,
      eventName: submission.team.event?.name ?? 'Hackathon Event',
      projectName: submission.title,
      teamName: submission.team.name,
      status: submission.status,
      message: 'Your project has been successfully submitted and locked for review.',
    };
  }

  async getReceiptForUser(userId: string) {
    const team = await this.resolveTeam(userId);
    const submission = await this.prisma.submission.findUnique({
      where: { teamId: team.id },
    });
    if (!submission?.receiptId) {
      throw new NotFoundException('No submission receipt found');
    }
    return this.getReceipt(submission.id);
  }

  async getShowcase(teamSlug: string) {
    const team = await this.prisma.team.findUnique({
      where: { slug: teamSlug },
      include: {
        submission: { include: { files: true } },
        members: { include: { user: { select: { id: true, name: true, image: true } } } },
        leader: { select: { id: true, name: true, image: true } },
        event: true,
      },
    });

    if (!team?.submission) throw new NotFoundException('Showcase not available');

    const config = this.validation.getEventConfig(team.event?.settings);
    if (
      config.showcaseVisibility === 'private' &&
      !this.validation.isLocked(team.submission.status)
    ) {
      throw new NotFoundException('Showcase not yet published');
    }

    const sub = team.submission;
    return {
      banner: sub.logoUrl,
      team: {
        name: team.name,
        theme: team.theme,
        members: team.members.map((m) => ({
          name: m.user.name,
          image: m.user.image,
        })),
        leader: team.leader,
      },
      project: {
        title: sub.title,
        executiveSummary: sub.executiveSummary,
        description: sub.description,
        technologies: sub.technologies,
        problemStatement: sub.problemStatement,
        innovationSummary: sub.innovationSummary,
        expectedImpact: sub.expectedImpact,
      },
      media: {
        logo: sub.logoUrl,
        teamPhoto: sub.teamPhotoUrl,
        demoUrl: sub.demoUrl,
        images: sub.files.filter((f) => f.category === 'IMAGES'),
      },
      links: {
        repository: sub.githubUrl,
        demo: sub.demoUrl,
        slides: sub.slidesUrl,
      },
      documentation: sub.files.filter((f) => f.category === 'DOCUMENTS'),
      submittedAt: sub.submittedAt,
      status: sub.status,
    };
  }

  private formatSubmission(
    submission: Awaited<ReturnType<typeof this.getOrCreateSubmission>>,
  ) {
    return {
      id: submission.id,
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
      readinessScore: submission.readinessScore,
      currentVersion: submission.currentVersion,
      status: submission.status,
      submittedAt: submission.submittedAt,
      lockedAt: submission.lockedAt,
      lastSavedAt: submission.lastSavedAt,
      receiptId: submission.receiptId,
      files: submission.files,
      compliance: submission.compliance,
      versions: submission.versions.map((v) => ({
        versionNumber: v.versionNumber,
        changeSummary: v.changeSummary,
        createdAt: v.createdAt,
        modifiedDeliverables: v.modifiedDeliverables,
      })),
    };
  }
}
