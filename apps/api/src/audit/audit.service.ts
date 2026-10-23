import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: {
    userId?: string | null;
    action: string;
    resource?: string;
    metadata?: Record<string, unknown>;
    ip?: string | null;
    outcome?: 'success' | 'failure';
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: input.userId ?? undefined,
          action: input.action,
          resource: input.resource ?? 'auth',
          ip: input.ip ?? undefined,
          metadata: {
            outcome: input.outcome ?? 'success',
            ...(input.metadata ?? {}),
          } as Prisma.InputJsonValue,
        },
      });
    } catch {
      // Audit must never block the primary flow
    }
  }
}
