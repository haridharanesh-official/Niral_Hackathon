import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DEFAULT_MILESTONE_TITLES,
  KANBAN_COLUMNS,
} from '@hackos/shared';
import {
  KanbanStatus,
  MilestoneStatus,
  Prisma,
  SprintStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TeamsService } from '../teams/teams.service';
import {
  AssignSprintTasksDto,
  CreateDeliverableDto,
  CreateDependencyDto,
  CreateIssueDto,
  CreateMilestoneDto,
  CreateRiskDto,
  CreateSprintDto,
  SprintRetrospectiveDto,
  SprintReviewDto,
  UpdateDeliverableDto,
  UpdateIssueDto,
  UpdateMilestoneDto,
  UpdateRiskDto,
  UpdateSprintDto,
} from './dto/execution.dto';

@Injectable()
export class ExecutionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly teams: TeamsService,
  ) {}

  private async resolveTeam(userId: string) {
    const team = await this.teams.getMyTeam(userId);
    if (!team) {
      throw new ForbiddenException(
        'Join or create a team to access the project workspace',
      );
    }
    return team;
  }

  async assertCanCompleteTask(
    taskId: string,
    force = false,
  ): Promise<{ blocked: boolean; blockers: string[] }> {
    if (force) return { blocked: false, blockers: [] };

    const deps = await this.prisma.taskDependency.findMany({
      where: { taskId },
      include: {
        dependsOnTask: { select: { id: true, title: true, status: true } },
      },
    });

    const blockers = deps
      .filter((d) => d.dependsOnTask.status !== KanbanStatus.COMPLETED)
      .map((d) => d.dependsOnTask.title);

    return { blocked: blockers.length > 0, blockers };
  }

  private async detectCircularDependency(
    taskId: string,
    dependsOnTaskId: string,
  ) {
    if (taskId === dependsOnTaskId) {
      throw new BadRequestException('A task cannot depend on itself');
    }

    const visited = new Set<string>();
    const queue = [dependsOnTaskId];

    while (queue.length) {
      const current = queue.shift()!;
      if (current === taskId) {
        throw new BadRequestException('Circular dependency detected');
      }
      if (visited.has(current)) continue;
      visited.add(current);

      const upstream = await this.prisma.taskDependency.findMany({
        where: { taskId: current },
        select: { dependsOnTaskId: true },
      });
      for (const edge of upstream) {
        queue.push(edge.dependsOnTaskId);
      }
    }
  }

  private sprintMetrics(tasks: Array<{ status: KanbanStatus; isBlocked: boolean }>) {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
    const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const blocked = tasks.filter((t) => t.isBlocked || t.status === 'READY').length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    return { total, completed, inProgress, blocked, progress };
  }

  private timeRemaining(endDate: Date) {
    const ms = endDate.getTime() - Date.now();
    if (ms <= 0) return { hours: 0, minutes: 0, label: 'Ended' };
    const hours = Math.floor(ms / 3_600_000);
    const minutes = Math.floor((ms % 3_600_000) / 60_000);
    return {
      hours,
      minutes,
      label: `${hours} Hours ${minutes} Minutes`,
    };
  }

  async executionDashboard(userId: string) {
    const team = await this.resolveTeam(userId);
    const [
      activeSprint,
      sprints,
      milestones,
      deliverables,
      risks,
      issues,
      tasks,
      members,
      dependencies,
    ] = await Promise.all([
      this.prisma.sprint.findFirst({
        where: { teamId: team.id, status: SprintStatus.ACTIVE },
        include: {
          sprintLead: { select: { id: true, name: true } },
          tasks: {
            include: {
              assignee: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.sprint.findMany({
        where: { teamId: team.id },
        orderBy: { startDate: 'desc' },
        include: { _count: { select: { tasks: true } } },
      }),
      this.prisma.projectMilestone.findMany({
        where: { teamId: team.id },
        orderBy: { position: 'asc' },
        include: {
          _count: { select: { tasks: true, deliverables: true } },
        },
      }),
      this.prisma.deliverable.findMany({
        where: { teamId: team.id },
        orderBy: { deadline: 'asc' },
      }),
      this.prisma.projectRisk.findMany({
        where: { teamId: team.id },
        orderBy: { createdAt: 'desc' },
        include: { owner: { select: { id: true, name: true } } },
      }),
      this.prisma.projectIssue.findMany({
        where: { teamId: team.id },
        orderBy: { createdAt: 'desc' },
        include: {
          assignee: { select: { id: true, name: true } },
          reporter: { select: { id: true, name: true } },
        },
      }),
      this.prisma.projectTask.findMany({
        where: { teamId: team.id },
        include: {
          assignee: { select: { id: true, name: true } },
        },
      }),
      this.prisma.teamMember.findMany({
        where: { teamId: team.id },
        include: { user: { select: { id: true, name: true, image: true } } },
      }),
      this.prisma.taskDependency.findMany({
        where: { task: { teamId: team.id } },
        include: {
          task: { select: { id: true, title: true, status: true } },
          dependsOnTask: { select: { id: true, title: true, status: true } },
        },
      }),
    ]);

    const workload = members.map((m) => ({
      member: m.user,
      taskCount: tasks.filter((t) => t.assigneeId === m.user.id).length,
      completed: tasks.filter(
        (t) => t.assigneeId === m.user.id && t.status === 'COMPLETED',
      ).length,
    }));

    const activeMetrics = activeSprint
      ? this.sprintMetrics(activeSprint.tasks)
      : null;

    return {
      team: { id: team.id, name: team.name },
      members: members.map((m) => m.user),
      activeSprint: activeSprint
        ? {
            ...activeSprint,
            metrics: activeMetrics,
            timeRemaining: this.timeRemaining(activeSprint.endDate),
          }
        : null,
      sprints,
      milestones,
      deliverables,
      risks,
      issues,
      dependencies,
      workload,
      analytics: await this.buildAnalytics(team.id, activeSprint?.id),
      ai: await this.buildAiRecommendations(team.id, tasks, workload, activeSprint),
      predictions: await this.buildDeadlinePredictions(milestones, tasks),
    };
  }

  async listSprints(userId: string) {
    const team = await this.resolveTeam(userId);
    return this.prisma.sprint.findMany({
      where: { teamId: team.id },
      orderBy: { startDate: 'desc' },
      include: {
        sprintLead: { select: { id: true, name: true } },
        _count: { select: { tasks: true } },
      },
    });
  }

  async getSprint(userId: string, sprintId: string) {
    const team = await this.resolveTeam(userId);
    const sprint = await this.prisma.sprint.findFirst({
      where: { id: sprintId, teamId: team.id },
      include: {
        sprintLead: { select: { id: true, name: true } },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, image: true } },
            _count: { select: { comments: true, attachments: true } },
          },
          orderBy: [{ position: 'asc' }, { priority: 'asc' }],
        },
        reviews: { orderBy: { createdAt: 'desc' }, take: 5 },
        retrospectives: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!sprint) throw new NotFoundException('Sprint not found');

    return {
      ...sprint,
      metrics: this.sprintMetrics(sprint.tasks),
      timeRemaining: this.timeRemaining(sprint.endDate),
      columns: KANBAN_COLUMNS.map((col) => ({
        ...col,
        tasks: sprint.tasks.filter((t) => t.status === col.key),
      })),
    };
  }

  async createSprint(userId: string, dto: CreateSprintDto) {
    const team = await this.resolveTeam(userId);

    const sprint = await this.prisma.sprint.create({
      data: {
        teamId: team.id,
        name: dto.name,
        description: dto.description,
        goal: dto.goal,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        sprintLeadId: dto.sprintLeadId ?? userId,
        capacityHours: dto.capacityHours,
        memberIds: dto.memberIds ?? [],
        plannedDeliverables: dto.plannedDeliverables ?? [],
      },
    });

    if (dto.taskIds?.length) {
      await this.assignTasksToSprint(userId, sprint.id, {
        taskIds: dto.taskIds,
      });
    }

    return this.getSprint(userId, sprint.id);
  }

  async updateSprint(userId: string, sprintId: string, dto: UpdateSprintDto) {
    const team = await this.resolveTeam(userId);
    const existing = await this.prisma.sprint.findFirst({
      where: { id: sprintId, teamId: team.id },
    });
    if (!existing) throw new NotFoundException('Sprint not found');

    if (dto.status === SprintStatus.ACTIVE) {
      await this.prisma.sprint.updateMany({
        where: { teamId: team.id, status: SprintStatus.ACTIVE, id: { not: sprintId } },
        data: { status: SprintStatus.PLANNED },
      });
    }

    await this.prisma.sprint.update({
      where: { id: sprintId },
      data: {
        name: dto.name,
        description: dto.description,
        goal: dto.goal,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        sprintLeadId: dto.sprintLeadId === null ? null : dto.sprintLeadId,
        capacityHours: dto.capacityHours,
        memberIds: dto.memberIds,
        plannedDeliverables: dto.plannedDeliverables,
        status: dto.status,
      },
    });

    if (dto.taskIds) {
      await this.prisma.projectTask.updateMany({
        where: { teamId: team.id, sprintId },
        data: { sprintId: null, sprint: null },
      });
      await this.assignTasksToSprint(userId, sprintId, { taskIds: dto.taskIds });
    }

    return this.getSprint(userId, sprintId);
  }

  async activateSprint(userId: string, sprintId: string) {
    return this.updateSprint(userId, sprintId, { status: SprintStatus.ACTIVE });
  }

  async assignTasksToSprint(
    userId: string,
    sprintId: string,
    dto: AssignSprintTasksDto,
  ) {
    const team = await this.resolveTeam(userId);
    const sprint = await this.prisma.sprint.findFirst({
      where: { id: sprintId, teamId: team.id },
    });
    if (!sprint) throw new NotFoundException('Sprint not found');

    await this.prisma.projectTask.updateMany({
      where: { id: { in: dto.taskIds }, teamId: team.id },
      data: { sprintId: sprint.id, sprint: sprint.name },
    });

    return this.getSprint(userId, sprintId);
  }

  async listMilestones(userId: string) {
    const team = await this.resolveTeam(userId);
    const milestones = await this.prisma.projectMilestone.findMany({
      where: { teamId: team.id },
      orderBy: { position: 'asc' },
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            assignee: { select: { id: true, name: true } },
          },
        },
        deliverables: true,
      },
    });
    return milestones;
  }

  async createMilestone(userId: string, dto: CreateMilestoneDto) {
    const team = await this.resolveTeam(userId);
    const position = await this.prisma.projectMilestone.count({
      where: { teamId: team.id },
    });

    const milestone = await this.prisma.projectMilestone.create({
      data: {
        teamId: team.id,
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        ownerIds: dto.ownerIds ?? [],
        position,
      },
    });

    if (dto.taskIds?.length) {
      await this.prisma.projectTask.updateMany({
        where: { id: { in: dto.taskIds }, teamId: team.id },
        data: { milestoneId: milestone.id, milestone: milestone.title },
      });
      await this.syncMilestoneProgress(milestone.id);
    }

    return milestone;
  }

  async updateMilestone(
    userId: string,
    milestoneId: string,
    dto: UpdateMilestoneDto,
  ) {
    const team = await this.resolveTeam(userId);
    const existing = await this.prisma.projectMilestone.findFirst({
      where: { id: milestoneId, teamId: team.id },
    });
    if (!existing) throw new NotFoundException('Milestone not found');

    const milestone = await this.prisma.projectMilestone.update({
      where: { id: milestoneId },
      data: {
        title: dto.title,
        description: dto.description,
        dueDate:
          dto.dueDate === null ? null : dto.dueDate ? new Date(dto.dueDate) : undefined,
        status: dto.status,
        progress: dto.progress,
        ownerIds: dto.ownerIds,
      },
    });

    if (dto.taskIds) {
      await this.prisma.projectTask.updateMany({
        where: { teamId: team.id, milestoneId },
        data: { milestoneId: null, milestone: null },
      });
      await this.prisma.projectTask.updateMany({
        where: { id: { in: dto.taskIds }, teamId: team.id },
        data: { milestoneId, milestone: milestone.title },
      });
      await this.syncMilestoneProgress(milestoneId);
    }

    return milestone;
  }

  async syncMilestoneProgress(milestoneId: string) {
    const tasks = await this.prisma.projectTask.findMany({
      where: { milestoneId },
      select: { status: true, progress: true },
    });
    if (!tasks.length) return;

    const progress = Math.round(
      tasks.reduce((sum, t) => {
        if (t.status === 'COMPLETED') return sum + 100;
        return sum + t.progress;
      }, 0) / tasks.length,
    );

    const status =
      progress >= 100
        ? MilestoneStatus.COMPLETED
        : progress > 0
          ? MilestoneStatus.IN_PROGRESS
          : MilestoneStatus.PENDING;

    await this.prisma.projectMilestone.update({
      where: { id: milestoneId },
      data: { progress, status },
    });
  }

  async seedMilestones(userId: string) {
    const team = await this.resolveTeam(userId);
    const count = await this.prisma.projectMilestone.count({
      where: { teamId: team.id },
    });
    if (count > 0) return { seeded: false };

    await this.prisma.projectMilestone.createMany({
      data: DEFAULT_MILESTONE_TITLES.map((title, position) => ({
        teamId: team.id,
        title,
        position,
        progress: position < 3 ? 100 : position === 3 ? 70 : position === 4 ? 40 : 0,
        status:
          position < 3
            ? MilestoneStatus.COMPLETED
            : position === 3 || position === 4
              ? MilestoneStatus.IN_PROGRESS
              : MilestoneStatus.PENDING,
      })),
    });

    return { seeded: true, count: DEFAULT_MILESTONE_TITLES.length };
  }

  async listDeliverables(userId: string) {
    const team = await this.resolveTeam(userId);
    return this.prisma.deliverable.findMany({
      where: { teamId: team.id },
      orderBy: { deadline: 'asc' },
      include: { milestone: { select: { id: true, title: true } } },
    });
  }

  async createDeliverable(userId: string, dto: CreateDeliverableDto) {
    const team = await this.resolveTeam(userId);
    return this.prisma.deliverable.create({
      data: {
        teamId: team.id,
        title: dto.title,
        format: dto.format,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
        milestoneId: dto.milestoneId,
        fileUrl: dto.fileUrl,
      },
    });
  }

  async updateDeliverable(
    userId: string,
    id: string,
    dto: UpdateDeliverableDto,
  ) {
    const team = await this.resolveTeam(userId);
    const existing = await this.prisma.deliverable.findFirst({
      where: { id, teamId: team.id },
    });
    if (!existing) throw new NotFoundException('Deliverable not found');

    return this.prisma.deliverable.update({
      where: { id },
      data: {
        title: dto.title,
        format: dto.format,
        deadline:
          dto.deadline === null ? null : dto.deadline ? new Date(dto.deadline) : undefined,
        reviewStatus: dto.reviewStatus,
        fileUrl: dto.fileUrl,
        milestoneId: dto.milestoneId === null ? null : dto.milestoneId,
        version: dto.reviewStatus === 'APPROVED' ? existing.version + 1 : undefined,
      },
    });
  }

  async listDependencies(userId: string) {
    const team = await this.resolveTeam(userId);
    return this.prisma.taskDependency.findMany({
      where: { task: { teamId: team.id } },
      include: {
        task: { select: { id: true, title: true, status: true, taskNumber: true } },
        dependsOnTask: {
          select: { id: true, title: true, status: true },
        },
      },
    });
  }

  async createDependency(userId: string, dto: CreateDependencyDto) {
    const team = await this.resolveTeam(userId);
    const [task, dependsOn] = await Promise.all([
      this.prisma.projectTask.findFirst({
        where: { id: dto.taskId, teamId: team.id },
      }),
      this.prisma.projectTask.findFirst({
        where: { id: dto.dependsOnTaskId, teamId: team.id },
      }),
    ]);
    if (!task || !dependsOn) throw new NotFoundException('Task not found');

    await this.detectCircularDependency(dto.taskId, dto.dependsOnTaskId);

    const dep = await this.prisma.taskDependency.create({
      data: {
        taskId: dto.taskId,
        dependsOnTaskId: dto.dependsOnTaskId,
      },
      include: {
        task: { select: { id: true, title: true, status: true } },
        dependsOnTask: { select: { id: true, title: true, status: true } },
      },
    });

    const incomplete = dependsOn.status !== KanbanStatus.COMPLETED;
    if (incomplete) {
      await this.prisma.projectTask.update({
        where: { id: dto.taskId },
        data: { isBlocked: true },
      });
    }

    return dep;
  }

  async deleteDependency(userId: string, id: string) {
    const team = await this.resolveTeam(userId);
    const dep = await this.prisma.taskDependency.findFirst({
      where: { id, task: { teamId: team.id } },
    });
    if (!dep) throw new NotFoundException('Dependency not found');

    await this.prisma.taskDependency.delete({ where: { id } });

    const remaining = await this.prisma.taskDependency.count({
      where: {
        taskId: dep.taskId,
        dependsOnTask: { status: { not: KanbanStatus.COMPLETED } },
      },
    });

    if (remaining === 0) {
      await this.prisma.projectTask.update({
        where: { id: dep.taskId },
        data: { isBlocked: false },
      });
    }

    return { deleted: true };
  }

  async listRisks(userId: string) {
    const team = await this.resolveTeam(userId);
    return this.prisma.projectRisk.findMany({
      where: { teamId: team.id },
      orderBy: { createdAt: 'desc' },
      include: { owner: { select: { id: true, name: true } } },
    });
  }

  async createRisk(userId: string, dto: CreateRiskDto) {
    const team = await this.resolveTeam(userId);
    return this.prisma.projectRisk.create({
      data: {
        teamId: team.id,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        probability: dto.probability,
        impact: dto.impact,
        ownerId: dto.ownerId ?? userId,
        mitigation: dto.mitigation,
      },
      include: { owner: { select: { id: true, name: true } } },
    });
  }

  async updateRisk(userId: string, id: string, dto: UpdateRiskDto) {
    const team = await this.resolveTeam(userId);
    const existing = await this.prisma.projectRisk.findFirst({
      where: { id, teamId: team.id },
    });
    if (!existing) throw new NotFoundException('Risk not found');

    return this.prisma.projectRisk.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        probability: dto.probability,
        impact: dto.impact,
        ownerId: dto.ownerId,
        mitigation: dto.mitigation,
        status: dto.status,
      },
      include: { owner: { select: { id: true, name: true } } },
    });
  }

  async listIssues(userId: string) {
    const team = await this.resolveTeam(userId);
    return this.prisma.projectIssue.findMany({
      where: { teamId: team.id },
      orderBy: { createdAt: 'desc' },
      include: {
        assignee: { select: { id: true, name: true } },
        reporter: { select: { id: true, name: true } },
        linkedTask: { select: { id: true, title: true } },
        linkedMilestone: { select: { id: true, title: true } },
      },
    });
  }

  async createIssue(userId: string, dto: CreateIssueDto) {
    const team = await this.resolveTeam(userId);
    return this.prisma.projectIssue.create({
      data: {
        teamId: team.id,
        title: dto.title,
        description: dto.description,
        severity: dto.severity,
        reporterId: userId,
        assigneeId: dto.assigneeId,
        reproductionSteps: dto.reproductionSteps,
        linkedTaskId: dto.linkedTaskId,
        linkedMilestoneId: dto.linkedMilestoneId,
      },
    });
  }

  async updateIssue(userId: string, id: string, dto: UpdateIssueDto) {
    const team = await this.resolveTeam(userId);
    const existing = await this.prisma.projectIssue.findFirst({
      where: { id, teamId: team.id },
    });
    if (!existing) throw new NotFoundException('Issue not found');

    return this.prisma.projectIssue.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        severity: dto.severity,
        status: dto.status,
        assigneeId: dto.assigneeId === null ? null : dto.assigneeId,
        reproductionSteps: dto.reproductionSteps,
        resolutionNotes: dto.resolutionNotes,
        linkedTaskId: dto.linkedTaskId === null ? null : dto.linkedTaskId,
        linkedMilestoneId:
          dto.linkedMilestoneId === null ? null : dto.linkedMilestoneId,
      },
    });
  }

  async recordSprintReview(
    userId: string,
    sprintId: string,
    dto: SprintReviewDto,
  ) {
    const team = await this.resolveTeam(userId);
    const sprint = await this.prisma.sprint.findFirst({
      where: { id: sprintId, teamId: team.id },
    });
    if (!sprint) throw new NotFoundException('Sprint not found');

    return this.prisma.sprintReview.create({
      data: {
        sprintId,
        authorId: userId,
        plannedWork: dto.plannedWork,
        completedWork: dto.completedWork,
        incompleteWork: dto.incompleteWork,
        blockers: dto.blockers,
        lessonsLearned: dto.lessonsLearned,
        actionItems: dto.actionItems,
      },
    });
  }

  async recordSprintRetrospective(
    userId: string,
    sprintId: string,
    dto: SprintRetrospectiveDto,
  ) {
    const team = await this.resolveTeam(userId);
    const sprint = await this.prisma.sprint.findFirst({
      where: { id: sprintId, teamId: team.id },
    });
    if (!sprint) throw new NotFoundException('Sprint not found');

    return this.prisma.sprintRetrospective.create({
      data: {
        sprintId,
        authorId: userId,
        wentWell: dto.wentWell,
        couldImprove: dto.couldImprove,
        actionItems: dto.actionItems,
      },
    });
  }

  private async buildAnalytics(teamId: string, activeSprintId?: string) {
    const sprintFilter: Prisma.ProjectTaskWhereInput = activeSprintId
      ? { sprintId: activeSprintId }
      : { teamId };

    const tasks = await this.prisma.projectTask.findMany({
      where: sprintFilter,
      select: {
        status: true,
        storyPoints: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
    const remaining = total - completed;

    const burndownIdeal = total === 0 ? [] : [total, ...Array.from({ length: 6 }, (_, i) => Math.round(total * (1 - (i + 1) / 7)))];
    const burndownActual = total === 0 ? [] : [total, ...Array.from({ length: 6 }, (_, i) => Math.max(0, Math.round(remaining * (1 - i * 0.15))))];

    const completedSprints = await this.prisma.sprint.findMany({
      where: { teamId, status: SprintStatus.COMPLETED },
      include: { _count: { select: { tasks: true } } },
    });

    const velocity =
      completedSprints.length === 0
        ? { tasksPerSprint: 0, label: 'Not enough sprint history' }
        : {
            tasksPerSprint: Math.round(
              completedSprints.reduce((s, sp) => s + sp._count.tasks, 0) /
                completedSprints.length,
            ),
            label: 'Average tasks completed per sprint (estimate)',
          };

    const capacityHours = 8 * 4;
    const assignedEffort = tasks.filter((t) => t.status !== 'COMPLETED').length * 2;

    return {
      burndown: {
        ideal: burndownIdeal,
        actual: burndownActual,
        explanation:
          'Burndown compares remaining tasks to an ideal completion path. Rising actual lines suggest delays.',
      },
      burnup: {
        totalScope: total,
        completed,
        explanation:
          'Burnup shows completed work against total scope. Scope jumps indicate new tasks added mid-sprint.',
      },
      velocity,
      capacity: {
        availableHours: capacityHours,
        assignedHours: assignedEffort,
        completedTasks: completed,
        remainingTasks: remaining,
        explanation:
          'Capacity is advisory — use it to decide whether to accept more scope.',
      },
    };
  }

  private async buildAiRecommendations(
    teamId: string,
    tasks: Array<{
      id: string;
      title: string;
      status: KanbanStatus;
      isBlocked: boolean;
      assigneeId: string | null;
      priority: string;
    }>,
    workload: Array<{ member: { id: string; name: string }; taskCount: number }>,
    activeSprint: { id: string; name: string; capacityHours: number | null; tasks: unknown[] } | null,
  ) {
    const recommendations: Array<{
      type: string;
      title: string;
      explanation: string;
      optional: true;
    }> = [];

    if (workload.length) {
      const avg = workload.reduce((s, w) => s + w.taskCount, 0) / workload.length;
      const overloaded = workload.filter((w) => w.taskCount > avg + 2);
      for (const w of overloaded) {
        recommendations.push({
          type: 'workload',
          title: `Redistribute tasks from ${w.member.name}`,
          explanation: `${w.member.name} has ${w.taskCount} tasks vs team average ${avg.toFixed(1)}. Consider reassigning lower-priority items.`,
          optional: true,
        });
      }
    }

    const blocked = tasks.filter((t) => t.isBlocked);
    for (const t of blocked.slice(0, 3)) {
      recommendations.push({
        type: 'blocker',
        title: `Unblock "${t.title}"`,
        explanation:
          'This task has unresolved dependencies. Complete prerequisite work or review the dependency chain.',
        optional: true,
      });
    }

    if (activeSprint && activeSprint.capacityHours) {
      const openTasks = tasks.filter(
        (t) => t.status !== 'COMPLETED' && t.status !== 'BACKLOG',
      ).length;
      if (openTasks * 2 > activeSprint.capacityHours) {
        recommendations.push({
          type: 'scope',
          title: 'Sprint scope may exceed capacity',
          explanation: `Estimated ${openTasks * 2}h of work vs ${activeSprint.capacityHours}h capacity. Consider deferring low-priority tasks.`,
          optional: true,
        });
      }
    }

    const criticalOpen = tasks.filter(
      (t) => t.priority === 'CRITICAL' && t.status !== 'COMPLETED',
    );
    if (criticalOpen.length) {
      recommendations.push({
        type: 'priority',
        title: 'Focus on critical tasks first',
        explanation: `${criticalOpen.length} critical task(s) remain open. Reorder sprint backlog to address these before optional work.`,
        optional: true,
      });
    }

    return recommendations;
  }

  private async buildDeadlinePredictions(
    milestones: Array<{
      id: string;
      title: string;
      progress: number;
      dueDate: Date | null;
      status: MilestoneStatus;
    }>,
    tasks: Array<{ milestoneId: string | null; status: KanbanStatus; progress: number }>,
  ) {
    return milestones
      .filter((m) => m.status !== MilestoneStatus.COMPLETED)
      .map((m) => {
        const linked = tasks.filter((t) => t.milestoneId === m.id);
        const taskProgress =
          linked.length === 0
            ? m.progress
            : Math.round(
                linked.reduce(
                  (s, t) =>
                    s + (t.status === 'COMPLETED' ? 100 : t.progress),
                  0,
                ) / linked.length,
              );

        let confidence = taskProgress;
        if (m.dueDate) {
          const daysLeft =
            (m.dueDate.getTime() - Date.now()) / 86_400_000;
          if (daysLeft < 1 && taskProgress < 80) confidence -= 20;
          if (daysLeft > 3 && taskProgress > 50) confidence += 10;
        }
        confidence = Math.max(15, Math.min(95, confidence));

        const factors: string[] = [];
        if (linked.length) factors.push(`${linked.length} linked tasks`);
        factors.push(`${taskProgress}% task completion`);
        if (m.dueDate) {
          factors.push(
            m.dueDate < new Date() ? 'Past due date' : 'Due date on track',
          );
        }

        return {
          milestoneId: m.id,
          title: m.title,
          confidence,
          explanation: factors.join(' · '),
        };
      });
  }

  async seedExecutionDemo(userId: string) {
    const team = await this.resolveTeam(userId);

    await this.seedMilestones(userId);

    const sprintCount = await this.prisma.sprint.count({
      where: { teamId: team.id },
    });

    if (sprintCount === 0) {
      const now = new Date();
      const end = new Date(now.getTime() + 9 * 3_600_000);
      const sprint = await this.prisma.sprint.create({
        data: {
          teamId: team.id,
          name: 'Sprint 2 – Prototype Development',
          goal: 'Assemble and validate all hardware components.',
          description: 'Focused execution on prototype milestone.',
          startDate: now,
          endDate: end,
          sprintLeadId: userId,
          capacityHours: 32,
          status: SprintStatus.ACTIVE,
          plannedDeliverables: ['Working prototype', 'Architecture diagram'],
        },
      });

      await this.prisma.projectTask.updateMany({
        where: { teamId: team.id },
        data: { sprintId: sprint.id, sprint: sprint.name },
      });
    }

    const riskCount = await this.prisma.projectRisk.count({
      where: { teamId: team.id },
    });
    if (riskCount === 0) {
      await this.prisma.projectRisk.createMany({
        data: [
          {
            teamId: team.id,
            title: 'Sensor delivery delay',
            category: 'Hardware',
            probability: 'MEDIUM',
            impact: 'HIGH',
            mitigation: 'Prepare alternative sensor',
            ownerId: userId,
          },
          {
            teamId: team.id,
            title: 'AI model accuracy below target',
            category: 'AI',
            probability: 'MEDIUM',
            impact: 'HIGH',
            mitigation: 'Collect additional training data',
            ownerId: userId,
          },
        ],
      });
    }

    const deliverableCount = await this.prisma.deliverable.count({
      where: { teamId: team.id },
    });
    if (deliverableCount === 0) {
      await this.prisma.deliverable.createMany({
        data: [
          { teamId: team.id, title: 'Architecture Diagram', format: 'PDF' },
          { teamId: team.id, title: 'Demonstration Video', format: 'MP4' },
          { teamId: team.id, title: 'Research Report', format: 'DOCX' },
        ],
      });
    }

    return { seeded: true };
  }
}
