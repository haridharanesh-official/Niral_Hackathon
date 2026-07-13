import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    try {
      await this.$connect();
    } catch {
      // Allow API boot without DB during Phase 1 scaffolding
      console.warn(
        'Prisma: database unavailable — continuing without connection',
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
