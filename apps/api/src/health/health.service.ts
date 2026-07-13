import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async check() {
    let database: 'up' | 'down' = 'down';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'up';
    } catch {
      database = 'down';
    }

    const cache = await this.redis.ping();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        api: 'up',
        database,
        redis: cache,
      },
    };
  }
}
