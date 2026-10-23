import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export type SessionDeviceMeta = {
  deviceName?: string;
  browser?: string;
  operatingSystem?: string;
  ipAddress?: string;
  approximateLocation?: string;
  userAgent?: string;
};

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(
    userId: string,
    accessToken: string,
    meta: SessionDeviceMeta = {},
    ttlDays = 30,
  ) {
    const sessionToken = this.hashToken(accessToken);
    const expires = new Date(Date.now() + ttlDays * 24 * 60 * 60_000);

    return this.prisma.session.create({
      data: {
        userId,
        sessionToken,
        expires,
        deviceName: meta.deviceName ?? 'Unknown device',
        browser: meta.browser,
        operatingSystem: meta.operatingSystem,
        ipAddress: meta.ipAddress,
        approximateLocation: meta.approximateLocation ?? 'Approximate',
        userAgent: meta.userAgent,
        loginAt: new Date(),
        lastActivityAt: new Date(),
      },
    });
  }

  async listForUser(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, revokedAt: null, expires: { gt: new Date() } },
      orderBy: { lastActivityAt: 'desc' },
      select: {
        id: true,
        deviceName: true,
        browser: true,
        operatingSystem: true,
        approximateLocation: true,
        ipAddress: true,
        loginAt: true,
        lastActivityAt: true,
        expires: true,
      },
    });
  }

  async touch(sessionTokenHash: string) {
    await this.prisma.session.updateMany({
      where: { sessionToken: sessionTokenHash, revokedAt: null },
      data: { lastActivityAt: new Date() },
    });
  }

  async revoke(userId: string, sessionId: string) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException('Session not found');
    return this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  async revokeOthers(userId: string, keepTokenHash?: string) {
    await this.prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(keepTokenHash ? { sessionToken: { not: keepTokenHash } } : {}),
      },
      data: { revokedAt: new Date() },
    });
    return { message: 'Other sessions revoked' };
  }

  async revokeAll(userId: string) {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'All sessions revoked' };
  }

  hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  generateInviteToken() {
    return randomBytes(32).toString('hex');
  }
}
