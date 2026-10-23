import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { KanbanStatus, Prisma, TaskPriority, TaskType } from '@prisma/client';
import { KANBAN_COLUMNS } from '@hackos/shared';
import { PrismaService } from '../prisma/prisma.service';
import { TeamsService } from '../teams/teams.service';
import { EventsGateway } from '../events/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateAttachmentDto,
  CreateChecklistItemDto,
  CreateCommentDto,
  CreateTaskDto,
  MoveTaskDto,
  TaskQueryDto,
  UpdateChecklistItemDto,
  UpdateTaskDto,
} from './dto/project.dto';
import { ExecutionService } from './execution.service';
import { CollaborationService } from './collaboration.service';

const taskInclude = {
  assignee: { select: { id: true, name: true, image: true } },
  reporter: { select: { id: true, name: true } },
  reviewer: { select: { id: true, name: true } },
  _count: { select: { comments: true, attachments: true, checklist: true } },
} satisfies Prisma.ProjectTaskInclude;

const taskDetailInclude = {
  ...taskInclude,
  checklist: { orderBy: { position: 'asc' as const } },
  comments: {
    orderBy: { createdAt: 'asc' as const },
    include: { author: { select: { id: true, name: true, image: true } } },
  },
  attachments: { orderBy: { createdAt: 'desc' as const } },
  history: {
    orderBy: { createdAt: 'desc' as const },
    take: 50,
    include: { actor: { select: { id: true, name: true } } },
  },
} satisfies Prisma.ProjectTaskInclude;

@Injectable()
export class ProjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly teams: TeamsService,
    private readonly events: EventsGateway,
    private readonly notifications: NotificationsService,
    private readonly execution: ExecutionService,
    private readonly collaboration: CollaborationService,
  ) {}

  private async resolveTeam(userId: string) {
    const team = await this.teams.getMyTeam(userId);
    if (!team) {
      throw new ForbiddenException('Join or create a team to access the project workspace');
    }
    return team;
  }

  private async assertTeamMember(userId: string, teamId: string) {
    const member = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this team');
  }

  private async nextTaskNumber(teamId: string) {
    const last = await this.prisma.projectTask.findFirst({
      where: { teamId },
      orderBy: { taskNumber: 'desc' },
      select: { taskNumber: true },
    });
    return (last?.taskNumber ?? 0) + 1;
  }

  private async recordHistory(
    taskId: string,
    actorId: string | null,
    action: string,
    detail?: string,
    metadata?: Record<string, unknown>,
  ) {
    await this.prisma.taskHistory.create({
      data: {
        taskId,
        actorId: actorId ?? undefined,
        action,
        detail,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  private async syncProgressFromChecklist(taskId: string) {
    const items = await this.prisma.taskChecklistItem.findMany({
      where: { taskId },
      select: { completed: true },
    });
    if (!items.length) return;
    const progress = Math.round(
      (items.filter((i) => i.completed).length / items.length) * 100,
    );
    await this.prisma.projectTask.update({
      where: { id: taskId },
      data: { progress },
    });
  }

  private formatTask(task: Prisma.ProjectTaskGetPayload<{ include: typeof taskInclude }>) {
    return {
      ...task,
      displayId: `T-${String(task.taskNumber).padStart(3, '0')}`,
      commentCount: task._count.comments,
      attachmentCount: task._count.attachments,
      checklistCount: task._count.checklist,
      _count: undefined,
    };
  }

  private buildWhere(teamId: string, query: TaskQueryDto): Prisma.ProjectTaskWhereInput {
    const where: Prisma.ProjectTaskWhereInput = { teamId };
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.type) where.type = query.type;
    if (query.assigneeId) where.assigneeId = query.assigneeId;
    if (query.sprint) where.sprint = query.sprint;
    if (query.label) where.labels = { has: query.label };
    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  private columnStats(tasks: Array<{ status: KanbanStatus }>) {
    return KANBAN_COLUMNS.map((col) => ({
      ...col,
      count: tasks.filter((t) => t.status === col.key).length,
    }));
  }

  async workspace(userId: string) {
    const team = await this.resolveTeam(userId);
    const [tasks, members] = await Promise.all([
      this.prisma.projectTask.findMany({
        where: { teamId: team.id },
        include: taskInclude,
        orderBy: [{ status: 'asc' }, { position: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.teamMember.findMany({
        where: { teamId: team.id },
        include: { user: { select: { id: true, name: true, image: true } } },
      }),
    ]);

    const formatted = tasks.map((t) => this.formatTask(t));
    const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
    const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const blocked = tasks.filter(
      (t) => t.priority === TaskPriority.CRITICAL && t.status !== 'COMPLETED',
    ).length;

    return {
      team: { id: team.id, name: team.name },
      columns: this.columnStats(tasks),
      members: members.map((m) => m.user),
      stats: {
        total: tasks.length,
        completed,
        inProgress,
        blocked,
        health:
          tasks.length === 0
            ? 0
            : Math.round((completed / tasks.length) * 100),
      },
      tasks: formatted,
      labels: [...new Set(tasks.flatMap((t) => t.labels))].sort(),
      sprints: [...new Set(tasks.map((t) => t.sprint).filter(Boolean))].sort(),
    };
  }

  async listTasks(userId: string, query: TaskQueryDto) {
    const team = await this.resolveTeam(userId);
    const tasks = await this.prisma.projectTask.findMany({
      where: this.buildWhere(team.id, query),
      include: taskInclude,
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    });
    return tasks.map((t) => this.formatTask(t));
  }

  async getTask(userId: string, taskId: string) {
    const team = await this.resolveTeam(userId);
    const task = await this.prisma.projectTask.findFirst({
      where: { id: taskId, teamId: team.id },
      include: taskDetailInclude,
    });
    if (!task) throw new NotFoundException('Task not found');
    return {
      ...this.formatTask(task),
      checklist: task.checklist,
      comments: task.comments,
      attachments: task.attachments,
      history: task.history,
    };
  }

  async createTask(userId: string, dto: CreateTaskDto) {
    const team = await this.resolveTeam(userId);
    const taskNumber = await this.nextTaskNumber(team.id);
    const status = dto.status ?? KanbanStatus.BACKLOG;
    const position = await this.prisma.projectTask.count({
      where: { teamId: team.id, status },
    });

    const task = await this.prisma.projectTask.create({
      data: {
        teamId: team.id,
        taskNumber,
        title: dto.title,
        description: dto.description,
        status,
        type: dto.type,
        priority: dto.priority,
        assigneeId: dto.assigneeId,
        reporterId: userId,
        reviewerId: dto.reviewerId,
        sprint: dto.sprint,
        milestone: dto.milestone,
        labels: dto.labels ?? [],
        category: dto.category,
        acceptanceCriteria: dto.acceptanceCriteria,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        estimatedEffort: dto.estimatedEffort,
        position,
      },
      include: taskInclude,
    });

    await this.recordHistory(task.id, userId, 'created', `${task.title} created`);

    await this.collaboration.recordTimeline(
      team.id,
      userId,
      'TASK',
      `Created task "${task.title}"`,
      { targetType: 'task', targetId: task.id },
    );

    if (dto.assigneeId && dto.assigneeId !== userId) {
      await this.notifications.create({
        userId: dto.assigneeId,
        title: 'Task assigned',
        body: `You were assigned "${task.title}"`,
        type: 'info',
        link: '/dashboard/project',
      });
    }

    this.events.emitDashboardEvent('project:task-created', userId, {
      teamId: team.id,
      taskId: task.id,
    });

    return this.formatTask(task);
  }

  async updateTask(userId: string, taskId: string, dto: UpdateTaskDto) {
    const team = await this.resolveTeam(userId);
    const existing = await this.prisma.projectTask.findFirst({
      where: { id: taskId, teamId: team.id },
    });
    if (!existing) throw new NotFoundException('Task not found');

    const changes: string[] = [];
    if (dto.priority && dto.priority !== existing.priority) {
      changes.push(`Priority ${existing.priority} → ${dto.priority}`);
    }
    if (dto.assigneeId !== undefined && dto.assigneeId !== existing.assigneeId) {
      changes.push('Assignee updated');
    }

    const task = await this.prisma.projectTask.update({
      where: { id: taskId },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        type: dto.type,
        priority: dto.priority,
        assigneeId: dto.assigneeId === null ? null : dto.assigneeId,
        reviewerId: dto.reviewerId === null ? null : dto.reviewerId,
        sprint: dto.sprint,
        milestone: dto.milestone,
        labels: dto.labels,
        category: dto.category,
        acceptanceCriteria: dto.acceptanceCriteria,
        dueDate:
          dto.dueDate === null ? null : dto.dueDate ? new Date(dto.dueDate) : undefined,
        estimatedEffort: dto.estimatedEffort,
        actualEffort: dto.actualEffort,
        progress: dto.progress,
      },
      include: taskInclude,
    });

    for (const change of changes) {
      await this.recordHistory(taskId, userId, 'updated', change);
    }

    if (
      dto.assigneeId &&
      dto.assigneeId !== existing.assigneeId &&
      dto.assigneeId !== userId
    ) {
      await this.notifications.create({
        userId: dto.assigneeId,
        title: 'Task assigned',
        body: `You were assigned "${task.title}"`,
        type: 'info',
        link: '/dashboard/project',
      });
    }

    this.events.emitDashboardEvent('project:task-updated', userId, {
      teamId: team.id,
      taskId,
    });

    return this.formatTask(task);
  }

  async moveTask(userId: string, taskId: string, dto: MoveTaskDto) {
    const team = await this.resolveTeam(userId);
    const existing = await this.prisma.projectTask.findFirst({
      where: { id: taskId, teamId: team.id },
    });
    if (!existing) throw new NotFoundException('Task not found');

    if (dto.status === KanbanStatus.COMPLETED) {
      const { blocked, blockers } = await this.execution.assertCanCompleteTask(
        taskId,
        dto.forceComplete,
      );
      if (blocked) {
        throw new BadRequestException(
          `Unresolved dependencies: ${blockers.join(', ')}. Use forceComplete to override.`,
        );
      }
    }

    const position =
      dto.position ??
      (await this.prisma.projectTask.count({
        where: { teamId: team.id, status: dto.status },
      }));

    const task = await this.prisma.projectTask.update({
      where: { id: taskId },
      data: {
        status: dto.status,
        position,
        progress: dto.status === KanbanStatus.COMPLETED ? 100 : undefined,
      },
      include: taskInclude,
    });

    if (dto.status === KanbanStatus.COMPLETED) {
      await this.unblockDependentTasks(taskId);
      if (existing.milestoneId) {
        await this.execution.syncMilestoneProgress(existing.milestoneId);
      }
    }

    const column = KANBAN_COLUMNS.find((c) => c.key === dto.status);
    await this.recordHistory(
      taskId,
      userId,
      'moved',
      `Moved to ${column?.label ?? dto.status}`,
      { from: existing.status, to: dto.status },
    );

    await this.collaboration.recordTimeline(
      team.id,
      userId,
      'TASK',
      `Moved "${task.title}" to ${column?.label ?? dto.status}`,
      { targetType: 'task', targetId: taskId },
    );

    if (existing.assigneeId && existing.assigneeId !== userId) {
      await this.notifications.create({
        userId: existing.assigneeId,
        title: 'Task moved',
        body: `"${task.title}" moved to ${column?.label ?? dto.status}`,
        type: 'info',
        link: '/dashboard/project',
      });
    }

    this.events.emitDashboardEvent('project:task-moved', userId, {
      teamId: team.id,
      taskId,
      status: dto.status,
    });

    return this.formatTask(task);
  }

  async addComment(userId: string, taskId: string, dto: CreateCommentDto) {
    const team = await this.resolveTeam(userId);
    const task = await this.prisma.projectTask.findFirst({
      where: { id: taskId, teamId: team.id },
      select: { id: true, title: true, assigneeId: true },
    });
    if (!task) throw new NotFoundException('Task not found');

    const comment = await this.prisma.taskComment.create({
      data: { taskId, authorId: userId, body: dto.body },
      include: { author: { select: { id: true, name: true, image: true } } },
    });

    await this.recordHistory(taskId, userId, 'commented', 'Added a comment');

    if (task.assigneeId && task.assigneeId !== userId) {
      await this.notifications.create({
        userId: task.assigneeId,
        title: 'New comment',
        body: `Comment on "${task.title}"`,
        type: 'info',
        link: '/dashboard/project',
      });
    }

    return comment;
  }

  async addChecklistItem(userId: string, taskId: string, dto: CreateChecklistItemDto) {
    const team = await this.resolveTeam(userId);
    const task = await this.prisma.projectTask.findFirst({
      where: { id: taskId, teamId: team.id },
      select: { id: true },
    });
    if (!task) throw new NotFoundException('Task not found');

    const position = await this.prisma.taskChecklistItem.count({
      where: { taskId },
    });

    const item = await this.prisma.taskChecklistItem.create({
      data: { taskId, title: dto.title, position },
    });

    await this.syncProgressFromChecklist(taskId);
    await this.recordHistory(taskId, userId, 'checklist_added', dto.title);

    return item;
  }

  async updateChecklistItem(
    userId: string,
    taskId: string,
    itemId: string,
    dto: UpdateChecklistItemDto,
  ) {
    const team = await this.resolveTeam(userId);
    const task = await this.prisma.projectTask.findFirst({
      where: { id: taskId, teamId: team.id },
      select: { id: true },
    });
    if (!task) throw new NotFoundException('Task not found');

    const existing = await this.prisma.taskChecklistItem.findFirst({
      where: { id: itemId, taskId },
    });
    if (!existing) throw new NotFoundException('Checklist item not found');

    const item = await this.prisma.taskChecklistItem.update({
      where: { id: itemId },
      data: {
        title: dto.title,
        completed: dto.completed,
      },
    });

    await this.syncProgressFromChecklist(taskId);

    if (dto.completed !== undefined && dto.completed !== existing.completed) {
      await this.recordHistory(
        taskId,
        userId,
        'checklist_toggled',
        `${item.title} ${dto.completed ? 'completed' : 'reopened'}`,
      );
    }

    return item;
  }

  async deleteChecklistItem(userId: string, taskId: string, itemId: string) {
    const team = await this.resolveTeam(userId);
    const task = await this.prisma.projectTask.findFirst({
      where: { id: taskId, teamId: team.id },
      select: { id: true },
    });
    if (!task) throw new NotFoundException('Task not found');

    const existing = await this.prisma.taskChecklistItem.findFirst({
      where: { id: itemId, taskId },
    });
    if (!existing) throw new NotFoundException('Checklist item not found');

    await this.prisma.taskChecklistItem.delete({ where: { id: itemId } });
    await this.syncProgressFromChecklist(taskId);
    await this.recordHistory(taskId, userId, 'checklist_removed', existing.title);

    return { deleted: true };
  }

  async addAttachment(userId: string, taskId: string, dto: CreateAttachmentDto) {
    const team = await this.resolveTeam(userId);
    const task = await this.prisma.projectTask.findFirst({
      where: { id: taskId, teamId: team.id },
      select: { id: true, title: true },
    });
    if (!task) throw new NotFoundException('Task not found');

    const attachment = await this.prisma.taskAttachment.create({
      data: {
        taskId,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        uploaderId: userId,
      },
    });

    await this.recordHistory(taskId, userId, 'attachment_added', dto.fileName);
    return attachment;
  }

  private async unblockDependentTasks(completedTaskId: string) {
    const dependents = await this.prisma.taskDependency.findMany({
      where: { dependsOnTaskId: completedTaskId },
      select: { taskId: true },
    });

    for (const dep of dependents) {
      const openBlockers = await this.prisma.taskDependency.count({
        where: {
          taskId: dep.taskId,
          dependsOnTask: { status: { not: KanbanStatus.COMPLETED } },
        },
      });
      if (openBlockers === 0) {
        await this.prisma.projectTask.update({
          where: { id: dep.taskId },
          data: { isBlocked: false },
        });
      }
    }
  }

  async seedDemoTasks(userId: string) {
    const team = await this.resolveTeam(userId);
    const count = await this.prisma.projectTask.count({
      where: { teamId: team.id },
    });
    if (count > 0) return { seeded: false, reason: 'Tasks already exist' };

    const demos = [
      {
        title: 'MQTT Sensor Integration',
        description: 'Connect ESP32 to broker and publish telemetry.',
        status: KanbanStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        labels: ['ESP32', 'MQTT'],
        sprint: 'Sprint 2',
        progress: 70,
        estimatedEffort: '6h',
      },
      {
        title: 'Architecture diagram',
        description: 'System overview for judges and documentation.',
        status: KanbanStatus.DOCUMENTATION,
        type: TaskType.DOCUMENTATION,
        priority: TaskPriority.MEDIUM,
        labels: ['Documentation'],
        progress: 40,
      },
      {
        title: 'Wi-Fi reconnection handler',
        status: KanbanStatus.READY,
        priority: TaskPriority.HIGH,
        labels: ['ESP32', 'Firmware'],
        acceptanceCriteria: 'Device recovers within 30s of outage.',
      },
      {
        title: 'Demo video script',
        status: KanbanStatus.BACKLOG,
        priority: TaskPriority.LOW,
        labels: ['Presentation'],
      },
    ];

    for (const [index, demo] of demos.entries()) {
      const taskNumber = index + 1;
      const task = await this.prisma.projectTask.create({
        data: {
          teamId: team.id,
          taskNumber,
          reporterId: userId,
          title: demo.title,
          description: demo.description,
          status: demo.status,
          type: demo.type,
          priority: demo.priority,
          labels: demo.labels ?? [],
          sprint: demo.sprint,
          progress: demo.progress ?? 0,
          estimatedEffort: demo.estimatedEffort,
          acceptanceCriteria: demo.acceptanceCriteria,
          position: index,
        },
      });

      if (demo.title === 'MQTT Sensor Integration') {
        await this.prisma.taskChecklistItem.createMany({
          data: [
            { taskId: task.id, title: 'Configure Wi-Fi', completed: true, position: 0 },
            { taskId: task.id, title: 'Connect MQTT Broker', completed: true, position: 1 },
            { taskId: task.id, title: 'Publish Sensor Data', completed: false, position: 2 },
            { taskId: task.id, title: 'Handle Reconnection', completed: false, position: 3 },
          ],
        });
      }

      await this.recordHistory(task.id, userId, 'created', `${demo.title} created`);
    }

    return { seeded: true, count: demos.length };
  }
}
