import { Injectable } from '@nestjs/common';
import { EnrollmentService } from '../enrollment/enrollment.service';
import { EventsGateway } from '../events/events.gateway';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { TeamsService } from '../teams/teams.service';
import {
  NotificationsQueryDto,
  TaskUpdateDto,
  WidgetConfigDto,
} from './dto/dashboard.dto';

type DashboardTask = {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  due: string;
  effort: string;
  href: string;
  done: boolean;
};

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly teams: TeamsService,
    private readonly enrollment: EnrollmentService,
    private readonly notifications: NotificationsService,
    private readonly leaderboard: LeaderboardService,
    private readonly events: EventsGateway,
  ) {}

  async summary(userId: string) {
    const [user, team, enrollment, notes, activeEvent] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          role: true,
          xp: true,
          profile: true,
          notificationPrefs: true,
        },
      }),
      this.teams.getMyTeam(userId),
      this.enrollment.myEnrollment(userId),
      this.notifications.list(userId, { page: 1, pageSize: 8, status: 'all' }),
      this.enrollment.getActiveEvent(),
    ]);

    const tasks = this.readTasks(user?.profile).slice(0, 12);
    return {
      userSummary: user,
      event: enrollment.event ?? activeEvent,
      enrollment: enrollment.enrollment,
      teamOverview: team,
      progressMetrics: {
        completedTasks: tasks.filter((t) => t.done).length,
        totalTasks: tasks.length,
        xp: user?.xp ?? 0,
      },
      upcomingDeadlines: tasks.filter((t) => !t.done).slice(0, 5),
      notifications: notes.items,
      widgetConfig: this.readWidgetConfig(user?.profile),
      generatedAt: new Date().toISOString(),
    };
  }

  notificationsFeed(userId: string, query: NotificationsQueryDto) {
    return this.notifications.list(userId, query);
  }

  async tasks(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profile: true },
    });
    return this.readTasks(user?.profile);
  }

  async upsertTask(userId: string, dto: TaskUpdateDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profile: true },
    });
    const tasks = this.readTasks(user?.profile);
    const idx = tasks.findIndex((t) => t.id === dto.id);
    const base: DashboardTask = {
      id: dto.id,
      title: dto.title ?? 'Untitled task',
      priority: dto.priority ?? 'medium',
      due: dto.due ?? 'Today',
      effort: dto.effort ?? '15 min',
      href: dto.href ?? '/dashboard',
      done: Boolean(dto.done),
    };
    const next = idx >= 0 ? tasks.map((t, i) => (i === idx ? { ...t, ...dto } : t)) : [base, ...tasks];
    await this.persistProfileTasks(userId, user?.profile, next);
    this.events.emitDashboardEvent('task.updated', userId, { id: dto.id, done: dto.done });
    return next;
  }

  async updateWidgetConfig(userId: string, dto: WidgetConfigDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profile: true },
    });
    const existing = (user?.profile as Record<string, unknown> | null) ?? {};
    const dashboard = (existing.dashboard as Record<string, unknown> | null) ?? {};
    const widgetConfig = {
      ...(dashboard.widgetConfig as Record<string, unknown> | null),
      ...dto,
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        profile: {
          ...existing,
          dashboard: {
            ...dashboard,
            widgetConfig,
          },
        },
      },
    });

    this.events.emitDashboardEvent('dashboard.widget_config.updated', userId, {
      widgetConfig,
    });
    return { widgetConfig };
  }

  async teamOverview(userId: string) {
    return this.teams.getMyTeam(userId);
  }

  async calendar(userId: string) {
    const enrollment = await this.enrollment.myEnrollment(userId);
    if (!enrollment.event) return [];
    const event = enrollment.event;
    return [
      {
        id: `${event.id}:kickoff`,
        title: 'Event kickoff',
        type: 'workshop',
        startsAt: event.startsAt,
      },
      {
        id: `${event.id}:deadline`,
        title: 'Final submission deadline',
        type: 'deadline',
        startsAt: event.endsAt,
      },
    ];
  }

  async activityFeed(userId: string) {
    return this.prisma.auditLog.findMany({
      where: { OR: [{ userId }, { userId: null }] },
      orderBy: { createdAt: 'desc' },
      take: 40,
      select: {
        id: true,
        action: true,
        resource: true,
        createdAt: true,
        metadata: true,
      },
    });
  }

  async leaderboardSnapshot() {
    const [overall, team] = await Promise.all([
      this.leaderboard.get('overall'),
      this.leaderboard.get('team'),
    ]);
    return { overall: overall.slice(0, 10), team: team.slice(0, 10) };
  }

  private readTasks(profile: unknown): DashboardTask[] {
    const p = (profile as Record<string, unknown> | null) ?? {};
    const tasks = (p.dashboard as Record<string, unknown> | undefined)?.tasks;
    return Array.isArray(tasks) ? (tasks as DashboardTask[]) : [];
  }

  private readWidgetConfig(profile: unknown) {
    const p = (profile as Record<string, unknown> | null) ?? {};
    return (p.dashboard as Record<string, unknown> | undefined)?.widgetConfig ?? null;
  }

  private async persistProfileTasks(userId: string, profile: unknown, tasks: DashboardTask[]) {
    const existing = (profile as Record<string, unknown> | null) ?? {};
    const dashboard = (existing.dashboard as Record<string, unknown> | null) ?? {};
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        profile: {
          ...existing,
          dashboard: {
            ...dashboard,
            tasks,
          },
        },
      },
    });
  }
}
