import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DEFAULT_MAX_TEAM_SIZE,
  DEFAULT_MIN_TEAM_SIZE,
} from '@hackos/shared';
import { TeamStatus } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto, InviteMemberDto, RequestJoinDto } from './dto/team.dto';
import { AuditService } from '../audit/audit.service';

const SAFE_TEAM_MEMBER_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
  role: true,
  college: true,
  department: true,
  xp: true,
} as const;

const SAFE_LEADER_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
  role: true,
  college: true,
  department: true,
} as const;

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private async maxTeamSize(eventId?: string | null, teamMax?: number | null) {
    if (teamMax && teamMax >= DEFAULT_MIN_TEAM_SIZE) return teamMax;
    if (!eventId) return DEFAULT_MAX_TEAM_SIZE;
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    const settings = (event?.settings as Record<string, unknown> | null) ?? {};
    const size = Number(settings.maxTeamSize);
    return Number.isFinite(size) && size >= DEFAULT_MIN_TEAM_SIZE
      ? size
      : DEFAULT_MAX_TEAM_SIZE;
  }

  async create(userId: string, dto: CreateTeamDto) {
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48);

    const existingMembership = await this.prisma.teamMember.findFirst({
      where: { userId },
    });
    if (existingMembership) {
      throw new ConflictException('You already belong to a team');
    }

    const activeEvent = dto.eventId
      ? await this.prisma.event.findUnique({ where: { id: dto.eventId } })
      : await this.prisma.event.findFirst({ where: { isActive: true } });

    if (activeEvent) {
      const nameClash = await this.prisma.team.findFirst({
        where: {
          eventId: activeEvent.id,
          name: { equals: dto.name, mode: 'insensitive' },
        },
      });
      if (nameClash) {
        throw new ConflictException('Team name must be unique within the event');
      }
    }

    const maxMembers = await this.maxTeamSize(activeEvent?.id);

    const team = await this.prisma.team.create({
      data: {
        name: dto.name,
        slug: `${slug}-${Date.now().toString(36)}`,
        description: dto.description,
        theme: dto.theme,
        logoUrl: dto.logoUrl,
        visibility: dto.visibility ?? 'PUBLIC',
        recruitmentStatus: dto.recruitmentStatus ?? 'OPEN',
        status: TeamStatus.FORMING,
        leaderId: userId,
        eventId: activeEvent?.id,
        maxMembers,
        members: {
          create: {
            userId,
            role: 'LEADER',
            invitationStatus: 'ACCEPTED',
          },
        },
      },
      include: {
        members: {
          include: {
            user: { select: SAFE_TEAM_MEMBER_USER_SELECT },
          },
        },
        leader: { select: SAFE_LEADER_SELECT },
      },
    });

    await this.prisma.notification.create({
      data: {
        userId,
        title: 'Team created',
        body: `${team.name} is ready. Share your invite code to recruit teammates.`,
        type: 'success',
        link: '/dashboard/team',
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { role: 'TEAM_LEADER' },
    });

    await this.audit.record({
      userId,
      action: 'TEAM_CREATED',
      resource: 'team',
      metadata: { teamId: team.id },
    });

    return team;
  }

  async inviteMember(leaderId: string, dto: InviteMemberDto) {
    const team = await this.prisma.team.findUnique({
      where: { id: dto.teamId },
      include: { members: true },
    });
    if (!team) throw new NotFoundException('Team not found');
    if (team.leaderId !== leaderId) {
      throw new ForbiddenException('Only the team leader can invite');
    }

    const max = await this.maxTeamSize(team.eventId, team.maxMembers);
    if (team.members.length >= max) {
      throw new BadRequestException('Team is full');
    }

    const token = randomBytes(32).toString('hex');
    const invitation = await this.prisma.teamInvitation.create({
      data: {
        teamId: team.id,
        invitedEmail: dto.email.toLowerCase(),
        invitationToken: createHash('sha256').update(token).digest('hex'),
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60_000),
        invitedById: leaderId,
      },
    });

    await this.audit.record({
      userId: leaderId,
      action: 'TEAM_INVITATION_SENT',
      resource: 'team',
      metadata: { teamId: team.id, email: dto.email },
    });

    return {
      invitationId: invitation.id,
      // Raw token returned once for shareable link (hashed at rest)
      invitationToken: token,
      expiresAt: invitation.expiresAt,
      message: 'Invitation created. Share the token or link securely.',
    };
  }

  async acceptInvite(userId: string, rawToken: string) {
    const hashed = createHash('sha256').update(rawToken).digest('hex');
    const invitation = await this.prisma.teamInvitation.findUnique({
      where: { invitationToken: hashed },
      include: { team: { include: { members: true } } },
    });

    if (!invitation || invitation.status !== 'PENDING') {
      throw new BadRequestException('Invitation is invalid or already used');
    }
    if (invitation.expiresAt < new Date()) {
      await this.prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('Invitation has expired');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.email.toLowerCase() !== invitation.invitedEmail) {
      throw new ForbiddenException('Invitation email does not match this account');
    }

    const existing = await this.prisma.teamMember.findFirst({ where: { userId } });
    if (existing) throw new ConflictException('You already belong to a team');

    const max = await this.maxTeamSize(
      invitation.team.eventId,
      invitation.team.maxMembers,
    );
    if (invitation.team.members.length >= max) {
      throw new BadRequestException('Team is full');
    }

    await this.prisma.$transaction([
      this.prisma.teamMember.create({
        data: {
          teamId: invitation.teamId,
          userId,
          role: 'MEMBER',
          invitationStatus: 'ACCEPTED',
        },
      }),
      this.prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      }),
    ]);

    await this.audit.record({
      userId,
      action: 'INVITATION_ACCEPTED',
      resource: 'team',
      metadata: { teamId: invitation.teamId },
    });

    return this.getMyTeam(userId);
  }

  async join(userId: string, inviteCode: string) {
    const team = await this.prisma.team.findUnique({
      where: { inviteCode },
      include: { members: true },
    });

    if (!team) throw new NotFoundException('Invalid invite code');
    if (team.recruitmentStatus === 'CLOSED') {
      throw new BadRequestException('This team is not accepting members');
    }

    const max = await this.maxTeamSize(team.eventId, team.maxMembers);
    if (team.members.length >= max) {
      throw new BadRequestException('Team is full');
    }
    if (team.members.some((m) => m.userId === userId)) {
      throw new ConflictException('Already a member');
    }

    const existingMembership = await this.prisma.teamMember.findFirst({
      where: { userId },
    });
    if (existingMembership) {
      throw new ConflictException('You already belong to a team');
    }

    await this.prisma.teamMember.create({
      data: { teamId: team.id, userId, role: 'MEMBER' },
    });

    if (team.leaderId) {
      await this.prisma.notification.create({
        data: {
          userId: team.leaderId,
          title: 'Invitation accepted',
          body: 'A participant joined your team via invite code.',
          type: 'info',
          link: '/dashboard/team',
        },
      });
    }

    await this.prisma.notification.create({
      data: {
        userId,
        title: 'Joined team',
        body: `Welcome to ${team.name}`,
        type: 'success',
        link: '/dashboard/team',
      },
    });

    return this.getMyTeam(userId);
  }

  async requestJoin(userId: string, dto: RequestJoinDto) {
    const team = await this.prisma.team.findUnique({
      where: { id: dto.teamId },
      include: { members: true },
    });
    if (!team) throw new NotFoundException('Team not found');
    if (team.visibility !== 'PUBLIC' || team.recruitmentStatus !== 'OPEN') {
      throw new BadRequestException('Team is not open for requests');
    }

    const existingMembership = await this.prisma.teamMember.findFirst({
      where: { userId },
    });
    if (existingMembership) {
      throw new ConflictException('You already belong to a team');
    }

    const request = await this.prisma.teamJoinRequest.upsert({
      where: { teamId_userId: { teamId: team.id, userId } },
      create: {
        teamId: team.id,
        userId,
        message: dto.message,
        status: 'PENDING',
      },
      update: {
        message: dto.message,
        status: 'PENDING',
      },
    });

    if (team.leaderId) {
      await this.prisma.notification.create({
        data: {
          userId: team.leaderId,
          title: 'Join request received',
          body: 'Someone requested to join your team.',
          type: 'info',
          link: '/dashboard/team',
        },
      });
    }

    return request;
  }

  async respondJoin(leaderId: string, requestId: string, accept: boolean) {
    const request = await this.prisma.teamJoinRequest.findUnique({
      where: { id: requestId },
      include: { team: { include: { members: true } } },
    });
    if (!request) throw new NotFoundException('Request not found');
    if (request.team.leaderId !== leaderId) {
      throw new ForbiddenException('Only the team leader can respond');
    }

    if (!accept) {
      return this.prisma.teamJoinRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' },
      });
    }

    const max = await this.maxTeamSize(request.team.eventId);
    if (request.team.members.length >= max) {
      throw new BadRequestException('Team is full');
    }

    const already = await this.prisma.teamMember.findFirst({
      where: { userId: request.userId },
    });
    if (already) throw new ConflictException('User already in a team');

    await this.prisma.$transaction([
      this.prisma.teamMember.create({
        data: {
          teamId: request.teamId,
          userId: request.userId,
          role: 'MEMBER',
        },
      }),
      this.prisma.teamJoinRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' },
      }),
    ]);

    await this.prisma.notification.create({
      data: {
        userId: request.userId,
        title: 'Invitation accepted',
        body: `You were accepted into ${request.team.name}`,
        type: 'success',
        link: '/dashboard/team',
      },
    });

    return this.getMyTeam(leaderId);
  }

  async getMyTeam(userId: string) {
    const membership = await this.prisma.teamMember.findFirst({
      where: { userId },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: { select: SAFE_TEAM_MEMBER_USER_SELECT },
              },
            },
            submission: true,
            sharedNotes: { orderBy: { updatedAt: 'desc' }, take: 10 },
            joinRequests: {
              where: { status: 'PENDING' },
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
            leader: { select: SAFE_LEADER_SELECT },
          },
        },
      },
    });

    return membership?.team ?? null;
  }

  async listPublic(userId?: string) {
    const teams = await this.prisma.team.findMany({
      where: {
        visibility: 'PUBLIC',
        recruitmentStatus: 'OPEN',
        status: { in: [TeamStatus.FORMING, TeamStatus.ACTIVE] },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        members: {
          include: {
            user: { select: SAFE_TEAM_MEMBER_USER_SELECT },
          },
        },
        leader: { select: SAFE_LEADER_SELECT },
      },
    });

    if (!userId) return teams.map((t) => ({ ...t, matchReasons: [] as string[] }));

    const me = await this.prisma.user.findUnique({ where: { id: userId } });
    const profile = (me?.profile as Record<string, unknown> | null) ?? {};
    const interests = (profile.interests as string[] | undefined) ?? [];
    const skills = Object.keys(
      (profile.skills as Record<string, string> | undefined) ?? {},
    );

    return teams.map((team) => {
      const reasons: string[] = [];
      if (team.theme && interests.some((i) => team.theme?.includes(i) || i.includes(team.theme ?? ''))) {
        reasons.push(`Matches your interest in ${team.theme}`);
      }
      if (team.theme && skills.length) {
        reasons.push('Complements your listed technical skills');
      }
      if (team.members.length < DEFAULT_MAX_TEAM_SIZE) {
        reasons.push('Has open seats');
      }
      return { ...team, matchReasons: reasons.slice(0, 3) };
    });
  }

  async list() {
    return this.prisma.team.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        members: {
          include: {
            user: { select: SAFE_TEAM_MEMBER_USER_SELECT },
          },
        },
        leader: { select: SAFE_LEADER_SELECT },
      },
    });
  }
}
