import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis | null;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('REDIS_URL');

    if (!url) {
      this.client = null;
      this.logger.warn('REDIS_URL not set — Redis disabled');
      return;
    }

    try {
      this.client = new Redis(url, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        enableOfflineQueue: false,
      });
    } catch {
      this.client = null;
      this.logger.warn('Redis client failed to initialize');
    }
  }

  async ping(): Promise<'up' | 'down' | 'disabled'> {
    if (!this.client) return 'disabled';

    try {
      if (this.client.status !== 'ready') {
        await this.client.connect();
      }
      const result = await this.client.ping();
      return result === 'PONG' ? 'up' : 'down';
    } catch {
      return 'down';
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => undefined);
    }
  }
}
