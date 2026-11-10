import { HealthService } from './health.service';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import type { Response } from 'express';
function fixture(
  query = Promise.resolve<unknown>([{ value: 1 }]),
  cache: 'up' | 'down' | 'disabled' = 'up',
) {
  const db = { $queryRaw: jest.fn().mockReturnValue(query) };
  const redis = {
    ping: jest
      .fn<Promise<'up' | 'down' | 'disabled'>, []>()
      .mockResolvedValue(cache),
  };
  const service = new HealthService(
    db as unknown as PrismaService,
    redis as unknown as RedisService,
  );
  return { service, controller: new HealthController(service), db, redis };
}
describe('Staging liveness/readiness and dependency failures', () => {
  it('reports ready only with both dependencies available', async () => {
    expect((await fixture().service.check()).status).toBe('ok');
  });
  it('keeps liveness independent of a database outage', async () => {
    const t = fixture(Promise.reject(new Error('synthetic DB unavailable')));
    expect(t.controller.live().status).toBe('ok');
    expect((await t.service.check()).services.database).toBe('down');
  });
  it.each(['down', 'disabled'] as const)(
    'returns readiness 503 when Redis is %s',
    async (state) => {
      const t = fixture(Promise.resolve([]), state),
        status = jest.fn();
      expect(
        (await t.controller.check({ status } as unknown as Response)).status,
      ).toBe('degraded');
      expect(status).toHaveBeenCalledWith(503);
    },
  );
  it('bounds hung database and Redis probes without exposing errors or secrets', async () => {
    jest.useFakeTimers();
    try {
      const t = fixture(new Promise(() => undefined));
      t.redis.ping.mockReturnValue(new Promise(() => undefined));
      const probe = t.service.check();
      await jest.advanceTimersByTimeAsync(2001);
      expect((await probe).services).toEqual({
        api: 'up',
        database: 'down',
        redis: 'down',
      });
    } finally {
      jest.useRealTimers();
    }
  });
});
