import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    userId: string,
    query?: { page?: number; pageSize?: number; status?: 'all' | 'read' | 'unread' },
  ) {
    const page = Math.max(1, Number(query?.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(query?.pageSize ?? 20)));
    const status = query?.status ?? 'all';
    const where = {
      userId,
      ...(status === 'read' ? { read: true } : {}),
      ...(status === 'unread' ? { read: false } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async recent(userId: string, limit = 50) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markRead(userId: string, id: string) {
    const note = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!note) throw new NotFoundException('Notification not found');
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { message: 'All notifications marked as read' };
  }

  async create(input: {
    userId: string;
    title: string;
    body: string;
    type?: string;
    link?: string;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        body: input.body,
        type: input.type ?? 'info',
        link: input.link,
      },
    });
  }
}
