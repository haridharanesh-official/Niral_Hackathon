import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async get(type: string) {
    if (type === 'quiz') {
      const attempts = await this.prisma.quizAttempt.findMany({
        take: 20,
        orderBy: [{ score: 'desc' }, { completedAt: 'asc' }],
        include: {
          user: { select: { id: true, name: true, image: true, xp: true } },
          quiz: { select: { title: true } },
        },
      });

      return attempts.map((attempt, index) => ({
        rank: index + 1,
        userId: attempt.user.id,
        name: attempt.user.name,
        score: attempt.score,
        xp: attempt.user.xp,
        meta: attempt.quiz.title,
        avatarUrl: attempt.user.image,
      }));
    }

    if (type === 'team') {
      const teams = await this.prisma.team.findMany({
        take: 20,
        include: {
          members: { include: { user: { select: { xp: true } } } },
        },
      });

      return teams
        .map((team) => ({
          teamId: team.id,
          name: team.name,
          score: team.members.reduce((sum, m) => sum + m.user.xp, 0),
        }))
        .sort((a, b) => b.score - a.score)
        .map((row, index) => ({ ...row, rank: index + 1 }));
    }

    const users = await this.prisma.user.findMany({
      take: 25,
      orderBy: { xp: 'desc' },
      select: {
        id: true,
        name: true,
        xp: true,
        image: true,
        college: true,
        department: true,
      },
    });

    return users.map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      name: user.name,
      score: user.xp,
      xp: user.xp,
      avatarUrl: user.image,
      college: user.college,
      department: user.department,
      type,
    }));
  }
}
