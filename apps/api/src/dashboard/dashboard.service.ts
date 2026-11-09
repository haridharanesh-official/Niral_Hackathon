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
    const [user, team, enrollment, notes, activeEvent, announcementsList] =
      await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            xp: true,
            college: true,
            department: true,
            profile: true,
            notificationPrefs: true,
            profileCompletedAt: true,
          },
        }),
        this.teams.getMyTeam(userId),
        this.enrollment.myEnrollment(userId),
        this.notifications.list(userId, { page: 1, pageSize: 8, status: 'all' }),
        this.enrollment.getActiveEvent(),
        this.announcements(userId),
      ]);

    const defaultEvent = {
      id: 'niral-2026',
      name: 'NIRAL Hackathon 2026',
      startsAt: '2026-12-03T00:00:00.000Z',
      endsAt: '2026-12-04T23:59:59.000Z',
      venueName: 'Sri Shakthi Institute of Engineering and Technology',
      venueAddress: 'Coimbatore, Tamil Nadu',
      timezone: 'Asia/Kolkata',
      eventMode: 'ONSITE',
      minTeamSize: 2,
      maxTeamSize: 4,
      settings: {
        tracks: [
          'AI & Smart Automation',
          'Healthcare & MedTech',
          'Smart Agriculture & Food Security',
          'Cyber Physical Systems & IoT',
          'Open Innovation',
        ],
      },
    };

    const tasks = this.readTasks(user?.profile).slice(0, 12);
    return {
      userSummary: user,
      event: enrollment.event ?? activeEvent ?? defaultEvent,
      enrollment: enrollment.enrollment,
      teamOverview: team,
      latestAnnouncements: announcementsList.slice(0, 3),
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

  async announcements(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profile: true },
    });
    const profile = (user?.profile as Record<string, unknown> | null) ?? {};
    const readAnnouncements = Array.isArray(profile.readAnnouncements)
      ? (profile.readAnnouncements as string[])
      : [];

    const dbAnnouncements = await this.prisma.announcement.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        body: true,
        priority: true,
        published: true,
        createdAt: true,
      },
    });

    if (dbAnnouncements.length === 0) {
      const officialSeed = [
        {
          id: 'niral-ann-1',
          title: 'Official NIRAL Hackathon 2026 Problem Tracks Live',
          body: 'Problem tracks covering AI & Smart Automation, Healthcare & MedTech, Smart Agriculture, and Cyber Physical Systems are officially live. Align your squad around one of the challenges.',
          priority: 'urgent',
          published: true,
          createdAt: new Date('2026-10-26T10:00:00.000Z'),
        },
        {
          id: 'niral-ann-2',
          title: 'Team Formation Notice: 2 to 4 Members Required',
          body: 'All teams must have between 2 and 4 verified participants. Team leaders can invite teammates via email or share their unique invite code from the Team Workspace.',
          priority: 'normal',
          published: true,
          createdAt: new Date('2026-10-25T14:30:00.000Z'),
        },
        {
          id: 'niral-ann-3',
          title: 'Event Venue & Physical Desk Registration at Sri Shakthi Institute',
          body: 'NIRAL Hackathon 2026 will take place onsite at Sri Shakthi Institute of Engineering and Technology, Coimbatore on December 3–4, 2026. Keep your Registration ID ready for desk verification.',
          priority: 'normal',
          published: true,
          createdAt: new Date('2026-10-24T09:00:00.000Z'),
        },
      ];
      return officialSeed.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        read: readAnnouncements.includes(item.id),
      }));
    }

    return dbAnnouncements.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      read: readAnnouncements.includes(item.id),
    }));
  }

  async markAnnouncementRead(userId: string, announcementId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profile: true },
    });
    const profile = (user?.profile as Record<string, unknown> | null) ?? {};
    const existing = Array.isArray(profile.readAnnouncements)
      ? (profile.readAnnouncements as string[])
      : [];

    if (!existing.includes(announcementId)) {
      const updated = [...existing, announcementId];
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          profile: {
            ...profile,
            readAnnouncements: updated,
          },
        },
      });
    }

    return { success: true };
  }

  async markAllAnnouncementsRead(userId: string) {
    const announcements = await this.prisma.announcement.findMany({
      where: { published: true },
      select: { id: true },
    });
    const defaultIds = ['niral-ann-1', 'niral-ann-2', 'niral-ann-3'];
    const allIds = Array.from(
      new Set([...announcements.map((a) => a.id), ...defaultIds]),
    );

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profile: true },
    });
    const profile = (user?.profile as Record<string, unknown> | null) ?? {};

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        profile: {
          ...profile,
          readAnnouncements: allIds,
        },
      },
    });

    return { success: true };
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
        title: 'Event ends',
        type: 'deadline',
        startsAt: event.endsAt,
      },
    ];
  }

  async activityFeed(userId: string) {
    return this.prisma.auditLog.findMany({
      where: { userId },
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
