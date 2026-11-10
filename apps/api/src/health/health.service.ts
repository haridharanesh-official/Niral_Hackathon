import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private async bounded<T>(operation: Promise<T>, fallback: T): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        operation.catch(() => fallback),
        new Promise<T>((resolve) => {
          timer = setTimeout(() => resolve(fallback), 2000);
          timer.unref();
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }

  async check() {
    const [database, cache] = await Promise.all([
      this.bounded<'up' | 'down'>(
        this.prisma.$queryRaw`SELECT 1`.then(() => 'up' as const),
        'down',
      ),
      this.bounded<'up' | 'down' | 'disabled'>(this.redis.ping(), 'down'),
    ]);

    return {
      status: database === 'up' && cache === 'up' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        api: 'up',
        database,
        redis: cache,
      },
    };
  }
}
