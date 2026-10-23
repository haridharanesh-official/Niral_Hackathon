import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DEFAULT_JUDGE_RUBRIC,
  EVALUATION_PROGRESS_SECTIONS,
  EventEvaluationConfig,
  SubmissionStatus,
} from '@hackos/shared';
import {
  EvaluationStatus,
  JudgeAssignmentStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

const ASSIGNMENT_INCLUDE = {
  submission: {
    include: {
      files: true,
      team: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  college: true,
                  department: true,
                },
              },
            },
          },
          leader: { select: { id: true, name: true, image: true } },
          event: true,
        },
      },
    },
  },
  event: true,
  notes: true,
  bookmarks: true,
} satisfies Prisma.JudgeAssignmentInclude;

@Injectable()
export class JudgeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private getEvaluationConfig(settings: unknown): EventEvaluationConfig {
    const raw = (settings as Record<string, unknown> | null) ?? {};
    const evaluation = (raw.evaluation as EventEvaluationConfig | undefined) ?? {};
    return {
      currentRound: evaluation.currentRound ?? 'Technical Evaluation',
      anonymousJudging: evaluation.anonymousJudging ?? false,
      allowDownloads: evaluation.allowDownloads ?? false,
      rubric: evaluation.rubric ?? DEFAULT_JUDGE_RUBRIC,
    };
  }

  private async assertJudgeAccess(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ForbiddenException('User not found');

    const allowed: UserRole[] = [UserRole.JUDGE, UserRole.ORGANIZER, UserRole.ADMIN];
    if (!allowed.includes(user.role)) {
      throw new ForbiddenException('Judge access required');
    }
    return user;
  }

  private async getAssignmentForJudge(judgeId: string, assignmentId: string) {
    const assignment = await this.prisma.judgeAssignment.findFirst({
      where: { id: assignmentId, judgeId },
      include: ASSIGNMENT_INCLUDE,
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    return assignment;
  }

  private computeProgress(
    score: {
      innovation: number;
      technical: number;
      presentation: number;
      scalability: number;
      impact: number;
      ui: number;
      business: number;
      comments: string | null;
    },
    sectionsCompleted?: string[],
  ) {
    const completed = new Set(sectionsCompleted ?? []);
    if (score.innovation > 0) completed.add('innovation');
    if (score.technical > 0) completed.add('technical');
    if (score.presentation > 0) completed.add('presentation');
    if (score.comments?.trim()) completed.add('feedback');

    const hasScores =
      score.innovation > 0 &&
      score.technical > 0 &&
      score.presentation > 0;
    if (hasScores) completed.add('final_score');

    const total = EVALUATION_PROGRESS_SECTIONS.length;
    const percent = Math.round((completed.size / total) * 100);
    return { completed: [...completed], percent };
  }

  async getDashboard(judgeId: string) {
    await this.assertJudgeAccess(judgeId);
    const judge = await this.prisma.user.findUniqueOrThrow({
      where: { id: judgeId },
    });

    const assignments = await this.prisma.judgeAssignment.findMany({
      where: { judgeId },
      include: {
        submission: {
          select: {
            title: true,
            currentVersion: true,
            team: { select: { name: true, theme: true } },
          },
        },
      },
      orderBy: { timeSlot: 'asc' },
    });

    const reviewed = assignments.filter((a) => a.status === 'REVIEWED').length;
    const pending = assignments.length - reviewed;

    const scores = await this.prisma.judgeScore.findMany({
      where: {
        judgeId,
        status: EvaluationStatus.SUBMITTED,
        startedAt: { not: null },
        submittedAt: { not: null },
      },
      select: { startedAt: true, submittedAt: true },
    });

    let avgReviewMinutes = 0;
    if (scores.length > 0) {
      const totalMs = scores.reduce((sum, s) => {
        if (!s.startedAt || !s.submittedAt) return sum;
        return sum + (s.submittedAt.getTime() - s.startedAt.getTime());
      }, 0);
      avgReviewMinutes = Math.round(totalMs / scores.length / 60_000);
    }

    const event = assignments[0]?.eventId
      ? await this.prisma.event.findUnique({ where: { id: assignments[0].eventId } })
      : null;
    const config = this.getEvaluationConfig(event?.settings);

    const todaySchedule = assignments
      .filter((a) => a.timeSlot)
      .slice(0, 5)
      .map((a) => ({
        id: a.id,
        time: a.timeSlot,
        projectTitle: a.submission.title,
        teamName: a.submission.team.name,
      }));

    return {
      judge: { id: judge.id, name: judge.name },
      stats: {
        assigned: assignments.length,
        reviewed,
        pending,
        avgReviewMinutes,
        currentRound: config.currentRound,
      },
      schedule: todaySchedule,
    };
  }

  async listAssignments(
    judgeId: string,
    query?: { status?: JudgeAssignmentStatus; sort?: string },
  ) {
    await this.assertJudgeAccess(judgeId);

    const assignments = await this.prisma.judgeAssignment.findMany({
      where: {
        judgeId,
        ...(query?.status ? { status: query.status } : {}),
      },
      include: {
        submission: {
          include: {
            team: { select: { id: true, name: true, theme: true, slug: true } },
            scores: { where: { judgeId }, take: 1 },
          },
        },
        bookmarks: true,
      },
    });

    const sorted = [...assignments].sort((a, b) => {
      switch (query?.sort) {
        case 'theme':
          return (a.submission.team.theme ?? '').localeCompare(
            b.submission.team.theme ?? '',
          );
        case 'priority':
          return b.priority - a.priority;
        case 'status':
          return a.status.localeCompare(b.status);
        case 'team':
          return a.submission.team.name.localeCompare(b.submission.team.name);
        case 'time':
        default:
          return (
            (a.timeSlot?.getTime() ?? 0) - (b.timeSlot?.getTime() ?? 0)
          );
      }
    });

    return sorted.map((a) => {
      const evaluation = a.submission.scores[0];
      return {
        id: a.id,
        projectId: a.submissionId,
        projectTitle: a.submission.title,
        teamName: a.submission.team.name,
        theme: a.submission.team.theme,
        timeSlot: a.timeSlot,
        status: a.status,
        submissionVersion: a.submission.currentVersion,
        reviewProgress: a.reviewProgress,
        evaluationStatus: evaluation?.status ?? EvaluationStatus.NOT_STARTED,
        bookmarks: a.bookmarks.map((b) => b.label),
        round: a.round,
        priority: a.priority,
      };
    });
  }

  async getAssignmentWorkspace(judgeId: string, assignmentId: string) {
    const assignment = await this.getAssignmentForJudge(judgeId, assignmentId);
    const config = this.getEvaluationConfig(
      assignment.event?.settings ?? assignment.submission.team.event?.settings,
    );

    let evaluation = await this.prisma.judgeScore.findUnique({
      where: {
        submissionId_judgeId: {
          submissionId: assignment.submissionId,
          judgeId,
        },
      },
    });

    if (!evaluation) {
      evaluation = await this.prisma.judgeScore.create({
        data: {
          submissionId: assignment.submissionId,
          judgeId,
          status: EvaluationStatus.NOT_STARTED,
        },
      });
      await this.audit.record({
        userId: judgeId,
        action: 'evaluation.started',
        resource: 'judge_evaluation',
        metadata: {
          submissionId: assignment.submissionId,
          assignmentId,
        },
      });
    }

    if (!evaluation.startedAt && evaluation.status === EvaluationStatus.NOT_STARTED) {
      evaluation = await this.prisma.judgeScore.update({
        where: { id: evaluation.id },
        data: {
          startedAt: new Date(),
          status: EvaluationStatus.IN_PROGRESS,
        },
      });
      await this.prisma.judgeAssignment.update({
        where: { id: assignmentId },
        data: { status: JudgeAssignmentStatus.IN_PROGRESS },
      });
    }

    const note = assignment.notes.find((n) => n.judgeId === judgeId);
    const sub = assignment.submission;
    const team = sub.team;
    const anonymous = config.anonymousJudging ?? false;

    const historyLogs = await this.prisma.auditLog.findMany({
      where: {
        userId: judgeId,
        action: { startsWith: 'evaluation.' },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    const history = historyLogs.filter((h) => {
      const meta = h.metadata as Record<string, unknown> | null;
      return meta?.submissionId === assignment.submissionId;
    });

    return {
      assignment: {
        id: assignment.id,
        status: assignment.status,
        round: assignment.round,
        timeSlot: assignment.timeSlot,
        reviewProgress: assignment.reviewProgress,
      },
      project: {
        id: sub.id,
        title: sub.title,
        category: sub.category,
        executiveSummary: sub.executiveSummary,
        problemStatement: sub.problemStatement,
        innovationSummary: sub.innovationSummary,
        solutionSummary: sub.solutionSummary,
        expectedImpact: sub.expectedImpact,
        description: sub.description,
        technologies: sub.technologies,
        submittedAt: sub.submittedAt,
        version: sub.currentVersion,
        githubUrl: sub.githubUrl,
        demoUrl: sub.demoUrl,
        slidesUrl: sub.slidesUrl,
        logoUrl: sub.logoUrl,
        files: sub.files,
      },
      team: {
        name: team.name,
        theme: team.theme,
        members: anonymous
          ? team.members.map((m, i) => ({
              id: `anon-${i}`,
              name: `Member ${i + 1}`,
              college: null,
              department: null,
            }))
          : team.members.map((m) => ({
              id: m.user.id,
              name: m.user.name,
              college: m.user.college,
              department: m.user.department,
            })),
        leader: anonymous ? null : team.leader,
        mentorId: team.mentorId,
      },
      evaluation: {
        id: evaluation.id,
        innovation: evaluation.innovation,
        technical: evaluation.technical,
        presentation: evaluation.presentation,
        scalability: evaluation.scalability,
        impact: evaluation.impact,
        ui: evaluation.ui,
        business: evaluation.business,
        comments: evaluation.comments,
        status: evaluation.status,
        progressPercent: evaluation.progressPercent,
        sectionsCompleted: evaluation.sectionsCompleted,
        lastSavedAt: evaluation.lastSavedAt,
        submittedAt: evaluation.submittedAt,
      },
      note: note?.content ?? '',
      bookmarks: assignment.bookmarks
        .filter((b) => b.judgeId === judgeId)
        .map((b) => b.label),
      rubric: config.rubric ?? DEFAULT_JUDGE_RUBRIC,
      config: {
        anonymousJudging: anonymous,
        allowDownloads: config.allowDownloads ?? false,
      },
      history: history.map((h) => ({
        at: h.createdAt,
        action: h.action,
        metadata: h.metadata,
      })),
    };
  }

  async saveEvaluation(
    judgeId: string,
    assignmentId: string,
    dto: {
      innovation?: number;
      technical?: number;
      presentation?: number;
      scalability?: number;
      impact?: number;
      ui?: number;
      business?: number;
      comments?: string;
      sectionsCompleted?: string[];
    },
  ) {
    const assignment = await this.getAssignmentForJudge(judgeId, assignmentId);
    if (assignment.status === JudgeAssignmentStatus.REVIEWED) {
      throw new ForbiddenException('Evaluation is already submitted');
    }

    const existing = await this.prisma.judgeScore.findUniqueOrThrow({
      where: {
        submissionId_judgeId: {
          submissionId: assignment.submissionId,
          judgeId,
        },
      },
    });

    const merged = { ...existing, ...dto };
    const { completed, percent } = this.computeProgress(
      merged,
      dto.sectionsCompleted,
    );

    const evaluation = await this.prisma.judgeScore.update({
      where: { id: existing.id },
      data: {
        ...dto,
        status: EvaluationStatus.IN_PROGRESS,
        progressPercent: percent,
        sectionsCompleted: completed,
        lastSavedAt: new Date(),
        draftData: dto as Prisma.InputJsonValue,
        startedAt: existing.startedAt ?? new Date(),
      },
    });

    await this.prisma.judgeAssignment.update({
      where: { id: assignmentId },
      data: {
        reviewProgress: percent,
        status: JudgeAssignmentStatus.IN_PROGRESS,
      },
    });

    await this.audit.record({
      userId: judgeId,
      action: 'evaluation.autosaved',
      resource: 'judge_evaluation',
      metadata: {
        submissionId: assignment.submissionId,
        assignmentId,
        progressPercent: percent,
      },
    });

    return evaluation;
  }

  async submitEvaluation(
    judgeId: string,
    assignmentId: string,
    confirm: boolean,
  ) {
    if (!confirm) {
      throw new ForbiddenException('Confirmation required');
    }

    const assignment = await this.getAssignmentForJudge(judgeId, assignmentId);
    const evaluation = await this.prisma.judgeScore.findUniqueOrThrow({
      where: {
        submissionId_judgeId: {
          submissionId: assignment.submissionId,
          judgeId,
        },
      },
    });

    if (evaluation.status === EvaluationStatus.SUBMITTED) {
      throw new ForbiddenException('Evaluation already submitted');
    }

    const { percent } = this.computeProgress(evaluation);
    const now = new Date();

    const updated = await this.prisma.judgeScore.update({
      where: { id: evaluation.id },
      data: {
        status: EvaluationStatus.SUBMITTED,
        progressPercent: Math.max(percent, 100),
        sectionsCompleted: EVALUATION_PROGRESS_SECTIONS.map((s) => s.key),
        submittedAt: now,
        lastSavedAt: now,
        draftData: Prisma.JsonNull,
      },
    });

    await this.prisma.judgeAssignment.update({
      where: { id: assignmentId },
      data: {
        status: JudgeAssignmentStatus.REVIEWED,
        reviewProgress: 100,
      },
    });

    await this.prisma.submission.update({
      where: { id: assignment.submissionId },
      data: { status: SubmissionStatus.UNDER_REVIEW },
    });

    await this.audit.record({
      userId: judgeId,
      action: 'evaluation.submitted',
      resource: 'judge_evaluation',
      metadata: {
        submissionId: assignment.submissionId,
        assignmentId,
        scores: {
          innovation: updated.innovation,
          technical: updated.technical,
          presentation: updated.presentation,
          impact: updated.impact,
        },
      },
    });

    return updated;
  }

  async updateNote(judgeId: string, assignmentId: string, content: string) {
    await this.getAssignmentForJudge(judgeId, assignmentId);

    return this.prisma.judgeNote.upsert({
      where: {
        assignmentId_judgeId: { assignmentId, judgeId },
      },
      create: { assignmentId, judgeId, content },
      update: { content },
    });
  }

  async toggleBookmark(
    judgeId: string,
    assignmentId: string,
    label: string,
  ) {
    await this.getAssignmentForJudge(judgeId, assignmentId);

    const existing = await this.prisma.judgeBookmark.findUnique({
      where: {
        assignmentId_judgeId_label: {
          assignmentId,
          judgeId,
          label: label as never,
        },
      },
    });

    if (existing) {
      await this.prisma.judgeBookmark.delete({ where: { id: existing.id } });
      return { active: false, label };
    }

    await this.prisma.judgeBookmark.create({
      data: {
        assignmentId,
        judgeId,
        label: label as never,
      },
    });

    await this.audit.record({
      userId: judgeId,
      action: 'evaluation.bookmarked',
      resource: 'judge_evaluation',
      metadata: { assignmentId, label },
    });

    return { active: true, label };
  }

  async getRubric(judgeId: string) {
    await this.assertJudgeAccess(judgeId);
    const assignment = await this.prisma.judgeAssignment.findFirst({
      where: { judgeId },
      include: { event: true },
    });
    const config = this.getEvaluationConfig(assignment?.event?.settings);
    return config.rubric ?? DEFAULT_JUDGE_RUBRIC;
  }

  async getAnalytics(judgeId: string) {
    await this.assertJudgeAccess(judgeId);

    const assignments = await this.prisma.judgeAssignment.groupBy({
      by: ['status'],
      where: { judgeId },
      _count: true,
    });

    const scores = await this.prisma.judgeScore.findMany({
      where: { judgeId, status: EvaluationStatus.SUBMITTED },
    });

    const avgByCriterion = DEFAULT_JUDGE_RUBRIC.map((c) => {
      const key = c.key as keyof typeof scores[0];
      const values = scores.map((s) => Number(s[key as keyof typeof s] ?? 0));
      const avg =
        values.length > 0
          ? values.reduce((a, b) => a + b, 0) / values.length
          : 0;
      return { key: c.key, label: c.label, average: Math.round(avg * 10) / 10 };
    });

    return {
      byStatus: assignments.map((a) => ({
        status: a.status,
        count: a._count,
      })),
      submittedEvaluations: scores.length,
      averageScores: avgByCriterion,
    };
  }

  async createAssignment(
    actorId: string,
    dto: {
      judgeId: string;
      submissionId: string;
      eventId?: string;
      round?: string;
      timeSlot?: string;
      priority?: number;
    },
  ) {
    const actor = await this.prisma.user.findUniqueOrThrow({
      where: { id: actorId },
    });
    if (!([UserRole.ORGANIZER, UserRole.ADMIN] as UserRole[]).includes(actor.role)) {
      throw new ForbiddenException('Organizer access required');
    }

    const submission = await this.prisma.submission.findUniqueOrThrow({
      where: { id: dto.submissionId },
      include: { team: true },
    });

    const assignment = await this.prisma.judgeAssignment.create({
      data: {
        judgeId: dto.judgeId,
        submissionId: dto.submissionId,
        eventId: dto.eventId ?? submission.team.eventId,
        round: dto.round ?? 'Technical Evaluation',
        timeSlot: dto.timeSlot ? new Date(dto.timeSlot) : undefined,
        priority: dto.priority ?? 0,
      },
    });

    await this.audit.record({
      userId: actorId,
      action: 'judge.assignment_created',
      resource: 'judge_assignment',
      metadata: {
        assignmentId: assignment.id,
        judgeId: dto.judgeId,
        submissionId: dto.submissionId,
      },
    });

    return assignment;
  }
}
