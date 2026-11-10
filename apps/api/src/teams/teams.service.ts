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
  SUBMISSION_LOCKED_STATUSES,
} from '@hackos/shared';
import { TeamStatus, Prisma } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto, InviteMemberDto, RequestJoinDto } from './dto/team.dto';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { escapeHtml } from '../payments/payment-rules';

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

const PUBLIC_TEAM_MEMBER_USER_SELECT = {
  id: true,
  name: true,
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

// Discovery is not an invitation or private-workspace API. Never return secrets,
// contact details, billing state, submissions or invitation records here.
const DISCOVERY_TEAM_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  theme: true,
  logoUrl: true,
  visibility: true,
  recruitmentStatus: true,
  status: true,
  maxMembers: true,
  createdAt: true,
  eventId: true,
  leaderId: true,
  members: {
    select: {
      id: true,
      userId: true,
      role: true,
      joinedAt: true,
      user: { select: PUBLIC_TEAM_MEMBER_USER_SELECT },
    },
  },
  leader: { select: PUBLIC_TEAM_MEMBER_USER_SELECT },
} satisfies Prisma.TeamSelect;

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly mail?: MailService,
  ) {}

  private async requireEnrollment(
    tx: Prisma.TransactionClient,
    userId: string,
    eventId?: string | null,
  ) {
    if (!eventId)
      throw new ForbiddenException(
        'A published event and confirmed enrollment are required.',
      );
    const user = await tx.user.findUnique({ where: { id: userId } });
    const enrollment = await tx.eventEnrollment.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (
      !user?.emailVerified ||
      user.accountStatus !== 'ACTIVE' ||
      !['PARTICIPANT', 'TEAM_LEADER'].includes(user.role) ||
      !(
        enrollment?.status === 'CONFIRMED' ||
        (enrollment?.status === 'PENDING' &&
          enrollment.paymentModeSnapshot === 'PAID' &&
          enrollment.feeScopeSnapshot === 'TEAM')
      )
    )
      throw new ForbiddenException(
        'Verify your account and confirm event enrollment before creating or joining a team.',
      );
  }

  private async maxTeamSize(eventId?: string | null, teamMax?: number | null) {
    if (teamMax && teamMax >= DEFAULT_MIN_TEAM_SIZE) return teamMax;
    if (!eventId) return DEFAULT_MAX_TEAM_SIZE;
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    const settings = (event?.settings as Record<string, unknown> | null) ?? {};
    const size = Number(settings.maxTeamSize);
    return Number.isFinite(size) && size >= DEFAULT_MIN_TEAM_SIZE
      ? size
      : DEFAULT_MAX_TEAM_SIZE;
  }

  async create(userId: string, dto: CreateTeamDto) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user || user.accountStatus !== 'ACTIVE') {
        throw new ForbiddenException(
          'An active account is required to create a team.',
        );
      }

      const existingMembership = await tx.teamMember.findFirst({
        where: { userId },
      });
      if (existingMembership) {
        throw new ConflictException('You already belong to a team');
      }

      const slug = dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 48);

      const activeEvent = dto.eventId
        ? await tx.event.findUnique({ where: { id: dto.eventId } })
        : await tx.event.findFirst({ where: { isActive: true } });

      await this.requireEnrollment(tx, userId, activeEvent?.id);
      if (activeEvent) {
        const nameClash = await tx.team.findFirst({
          where: {
            eventId: activeEvent.id,
            name: { equals: dto.name, mode: 'insensitive' },
          },
        });
        if (nameClash) {
          throw new ConflictException(
            'Team name must be unique within the event',
          );
        }
      }

      const maxMembers = await this.maxTeamSize(activeEvent?.id);

      const team = await tx.team.create({
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

      await tx.notification.create({
        data: {
          userId,
          title: 'Team created',
          body: `${team.name} is ready. Share your invite code to recruit teammates.`,
          type: 'success',
          link: '/dashboard/team',
        },
      });

      await tx.user.update({
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
    });
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

    if (this.mail) {
      void this.mail
        .send({
          to: dto.email.toLowerCase(),
          subject: `You're invited to join team ${team.name} for NIRAL Hackathon 2026`,
          eventType: 'team.invitation',
          html: `<p>You have been invited to join team <strong>${escapeHtml(team.name)}</strong> for NIRAL Hackathon 2026.</p><p>Use this invitation token to join: <code>${escapeHtml(token)}</code></p>`,
        })
        .catch(() => undefined);
    }

    return {
      invitationId: invitation.id,
      invitationToken: token,
      expiresAt: invitation.expiresAt,
      message: 'Invitation created. Share the token or link securely.',
    };
  }

  async cancelInvitation(leaderId: string, invitationId: string) {
    return this.prisma.$transaction(async (tx) => {
      const invitation = await tx.teamInvitation.findUnique({
        where: { id: invitationId },
        include: { team: true },
      });
      if (!invitation) throw new NotFoundException('Invitation not found');
      if (invitation.team.leaderId !== leaderId) {
        throw new ForbiddenException(
          'Only the team leader can cancel invitations',
        );
      }

      await tx.teamInvitation.update({
        where: { id: invitationId },
        data: { status: 'REVOKED' },
      });

      await this.audit.record({
        userId: leaderId,
        action: 'TEAM_INVITATION_REVOKED',
        resource: 'team',
        metadata: { invitationId, teamId: invitation.teamId },
      });

      return { message: 'Invitation cancelled' };
    });
  }

  async getMyInvitations(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return [];
    return this.prisma.teamInvitation.findMany({
      where: {
        invitedEmail: user.email.toLowerCase(),
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        teamId: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        team: {
          select: {
            id: true,
            name: true,
            theme: true,
            description: true,
          },
        },
      },
    });
  }

  async acceptInvite(userId: string, rawToken: string) {
    const hashed = createHash('sha256').update(rawToken).digest('hex');

    return this.prisma.$transaction(async (tx) => {
      const invitation = await tx.teamInvitation.findUnique({
        where: { invitationToken: hashed },
        include: { team: { include: { members: true } } },
      });

      if (!invitation || invitation.status !== 'PENDING') {
        throw new BadRequestException('Invitation is invalid or already used');
      }
      if (invitation.expiresAt < new Date()) {
        await tx.teamInvitation.update({
          where: { id: invitation.id },
          data: { status: 'EXPIRED' },
        });
        throw new BadRequestException('Invitation has expired');
      }

      if (invitation.team.billingLocked)
        throw new ConflictException('The paid team roster is locked.');
      await this.requireEnrollment(tx, userId, invitation.team.eventId);
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user || user.email.toLowerCase() !== invitation.invitedEmail) {
        throw new ForbiddenException(
          'Invitation email does not match this account',
        );
      }

      const existing = await tx.teamMember.findFirst({ where: { userId } });
      if (existing) throw new ConflictException('You already belong to a team');

      const max = await this.maxTeamSize(
        invitation.team.eventId,
        invitation.team.maxMembers,
      );
      if (invitation.team.members.length >= max) {
        throw new BadRequestException('Team is full');
      }

      await tx.teamMember.create({
        data: {
          teamId: invitation.teamId,
          userId,
          role: 'MEMBER',
          invitationStatus: 'ACCEPTED',
        },
      });

      await tx.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      });

      await this.audit.record({
        userId,
        action: 'INVITATION_ACCEPTED',
        resource: 'team',
        metadata: { teamId: invitation.teamId },
      });

      return this.getMyTeam(userId, tx);
    });
  }

  async join(userId: string, inviteCode: string) {
    return this.prisma.$transaction(async (tx) => {
      const team = await tx.team.findUnique({
        where: { inviteCode },
        include: { members: true },
      });

      if (!team) throw new NotFoundException('Invalid invite code');
      if (team.billingLocked)
        throw new ConflictException(
          'The paid team roster is locked. Contact finance for corrections.',
        );
      await this.requireEnrollment(tx, userId, team.eventId);
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

      const existingMembership = await tx.teamMember.findFirst({
        where: { userId },
      });
      if (existingMembership) {
        throw new ConflictException('You already belong to a team');
      }

      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user || user.accountStatus !== 'ACTIVE') {
        throw new ForbiddenException('Active account required to join a team');
      }

      await tx.teamMember.create({
        data: { teamId: team.id, userId, role: 'MEMBER' },
      });

      if (team.leaderId) {
        await tx.notification.create({
          data: {
            userId: team.leaderId,
            title: 'Teammate joined',
            body: `${user.name || 'A participant'} joined ${team.name} via invite code.`,
            type: 'info',
            link: '/dashboard/team',
          },
        });
      }

      await tx.notification.create({
        data: {
          userId,
          title: 'Joined team',
          body: `Welcome to ${team.name}`,
          type: 'success',
          link: '/dashboard/team',
        },
      });

      await this.audit.record({
        userId,
        action: 'TEAM_JOINED',
        resource: 'team',
        metadata: { teamId: team.id },
      });

      return this.getMyTeam(userId, tx);
    });
  }

  async leaveTeam(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const membership = await tx.teamMember.findFirst({
        where: { userId },
        include: {
          team: {
            include: {
              members: { orderBy: { joinedAt: 'asc' } },
              submission: true,
            },
          },
        },
      });

      if (!membership) {
        throw new NotFoundException('You do not belong to any team');
      }

      const team = membership.team;
      if (team.billingLocked)
        throw new ConflictException('The paid team roster is locked.');
      if (
        team.submission &&
        SUBMISSION_LOCKED_STATUSES.includes(team.submission.status as any)
      ) {
        throw new ForbiddenException(
          'Cannot leave team after submission has been locked or submitted',
        );
      }

      const user = await tx.user.findUnique({ where: { id: userId } });
      const isLeader = team.leaderId === userId || membership.role === 'LEADER';

      if (!isLeader) {
        // Regular member leaving
        await tx.teamMember.delete({ where: { id: membership.id } });

        if (team.leaderId) {
          await tx.notification.create({
            data: {
              userId: team.leaderId,
              title: 'Teammate left',
              body: `${user?.name || 'A participant'} has left your team.`,
              type: 'warning',
              link: '/dashboard/team',
            },
          });
        }

        await this.audit.record({
          userId,
          action: 'TEAM_MEMBER_LEFT',
          resource: 'team',
          metadata: { teamId: team.id },
        });

        return { message: 'Successfully left the team' };
      }

      // Leader leaving
      const remaining = team.members.filter((m) => m.userId !== userId);
      if (remaining.length > 0) {
        // Promote next oldest remaining member to leader
        const nextLeader = remaining[0];
        await tx.teamMember.update({
          where: { id: nextLeader.id },
          data: { role: 'LEADER' },
        });
        await tx.team.update({
          where: { id: team.id },
          data: { leaderId: nextLeader.userId },
        });
        await tx.user.update({
          where: { id: nextLeader.userId },
          data: { role: 'TEAM_LEADER' },
        });
        await tx.teamMember.delete({ where: { id: membership.id } });
        await tx.user.update({
          where: { id: userId },
          data: { role: 'PARTICIPANT' },
        });

        await tx.notification.create({
          data: {
            userId: nextLeader.userId,
            title: 'You are now Team Leader',
            body: `Leadership of ${team.name} has been transferred to you.`,
            type: 'info',
            link: '/dashboard/team',
          },
        });

        await this.audit.record({
          userId,
          action: 'TEAM_LEADERSHIP_TRANSFERRED',
          resource: 'team',
          metadata: { teamId: team.id, newLeaderId: nextLeader.userId },
        });

        return { message: 'Left team. Leadership transferred to next member.' };
      } else {
        // Sole member disbanding team
        await tx.teamMember.delete({ where: { id: membership.id } });
        await tx.teamJoinRequest.deleteMany({ where: { teamId: team.id } });
        await tx.teamInvitation.deleteMany({ where: { teamId: team.id } });
        await tx.team.delete({ where: { id: team.id } });
        await tx.user.update({
          where: { id: userId },
          data: { role: 'PARTICIPANT' },
        });

        await this.audit.record({
          userId,
          action: 'TEAM_DISBANDED',
          resource: 'team',
          metadata: { teamId: team.id },
        });

        return { message: 'Team disbanded successfully' };
      }
    });
  }

  async removeMember(leaderId: string, memberId: string) {
    return this.prisma.$transaction(async (tx) => {
      const leaderMembership = await tx.teamMember.findFirst({
        where: { userId: leaderId, role: 'LEADER' },
        include: { team: { include: { submission: true } } },
      });

      if (!leaderMembership) {
        throw new ForbiddenException('Only the team leader can remove members');
      }

      const team = leaderMembership.team;
      if (
        team.submission &&
        SUBMISSION_LOCKED_STATUSES.includes(team.submission.status as any)
      ) {
        throw new ForbiddenException(
          'Cannot remove members after submission is locked',
        );
      }

      if (leaderId === memberId) {
        throw new BadRequestException(
          'Team leader cannot remove themselves. Use leave team instead.',
        );
      }

      if (leaderMembership.team.billingLocked)
        throw new ConflictException('The paid team roster is locked.');
      const targetMembership = await tx.teamMember.findFirst({
        where: { teamId: team.id, userId: memberId },
        include: { user: { select: { name: true } } },
      });

      if (!targetMembership) {
        throw new NotFoundException('Member not found in your team');
      }

      await tx.teamMember.delete({ where: { id: targetMembership.id } });

      await tx.notification.create({
        data: {
          userId: memberId,
          title: 'Removed from team',
          body: `You were removed from ${team.name} by the team leader.`,
          type: 'warning',
          link: '/dashboard/team',
        },
      });

      await this.audit.record({
        userId: leaderId,
        action: 'TEAM_MEMBER_REMOVED',
        resource: 'team',
        metadata: { teamId: team.id, removedUserId: memberId },
      });

      return {
        message: `${targetMembership.user?.name || 'Member'} removed from team`,
      };
    });
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
    if (request.team.billingLocked)
      throw new ConflictException('The paid team roster is locked.');

    const max = await this.maxTeamSize(request.team.eventId);
    if (request.team.members.length >= max) {
      throw new BadRequestException('Team is full');
    }

    await this.requireEnrollment(
      this.prisma,
      request.userId,
      request.team.eventId,
    );
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

  async getMyTeam(
    userId: string,
    client: Pick<Prisma.TransactionClient, 'teamMember'> = this.prisma,
  ) {
    const membership = await client.teamMember.findFirst({
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
            invitations: {
              where: { status: 'PENDING' },
              select: {
                id: true,
                invitedEmail: true,
                status: true,
                expiresAt: true,
                createdAt: true,
              },
            },
            leader: { select: SAFE_LEADER_SELECT },
          },
        },
      },
    });

    if (!membership?.team) return null;

    const team = membership.team;
    const isLeader = team.leaderId === userId;

    // PRIVACY ENFORCEMENT: Join requests and invitations are strictly visible to the team leader only
    return {
      ...team,
      joinRequests: isLeader ? team.joinRequests : [],
      invitations: isLeader ? team.invitations : [],
    };
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
      select: DISCOVERY_TEAM_SELECT,
    });

    if (!userId)
      return teams.map((t) => ({ ...t, matchReasons: [] as string[] }));

    const me = await this.prisma.user.findUnique({ where: { id: userId } });
    const profile = (me?.profile as Record<string, unknown> | null) ?? {};
    const interests = (profile.interests as string[] | undefined) ?? [];
    const skills = Object.keys(
      (profile.skills as Record<string, string> | undefined) ?? {},
    );

    return teams.map((team) => {
      const reasons: string[] = [];
      if (
        team.theme &&
        interests.some(
          (i) => team.theme?.includes(i) || i.includes(team.theme ?? ''),
        )
      ) {
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

  async list(userId: string) {
    return this.prisma.team.findMany({
      where: {
        OR: [{ visibility: 'PUBLIC' }, { members: { some: { userId } } }],
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: DISCOVERY_TEAM_SELECT,
    });
  }
}
