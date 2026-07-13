import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TeamStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/team.dto';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.team.create({
      data: {
        name: dto.name,
        slug: `${slug}-${Date.now().toString(36)}`,
        description: dto.description,
        status: TeamStatus.FORMING,
        leaderId: userId,
        members: {
          create: {
            userId,
            role: 'LEADER',
          },
        },
      },
      include: {
        members: { include: { user: true } },
      },
    });
  }

  async join(userId: string, inviteCode: string) {
    const team = await this.prisma.team.findUnique({
      where: { inviteCode },
      include: { members: true },
    });

    if (!team) throw new NotFoundException('Invalid invite code');
    if (team.members.length >= 4) {
      throw new BadRequestException('Team is full');
    }
    if (team.members.some((m) => m.userId === userId)) {
      throw new ConflictException('Already a member');
    }

    await this.prisma.teamMember.create({
      data: { teamId: team.id, userId, role: 'MEMBER' },
    });

    return this.getMyTeam(userId);
  }

  async getMyTeam(userId: string) {
    const membership = await this.prisma.teamMember.findFirst({
      where: { userId },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    xp: true,
                    role: true,
                  },
                },
              },
            },
            submission: true,
            sharedNotes: { orderBy: { updatedAt: 'desc' }, take: 10 },
          },
        },
      },
    });

    return membership?.team ?? null;
  }

  async list() {
    return this.prisma.team.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        members: true,
        leader: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
