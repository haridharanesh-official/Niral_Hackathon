import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Request } from 'express';
import { UserRole } from '@hackos/shared';
const payload = {
  sub: 'unit-user',
  email: 'unit@example.test',
  role: UserRole.ADMIN,
};
const request = { headers: { authorization: 'Bearer unit-bearer' } } as Request;
function setup() {
  const prisma = { session: { findUnique: jest.fn() } };
  prisma.session.findUnique.mockResolvedValue({
    userId: 'unit-user',
    expires: new Date(Date.now() + 10000),
    revokedAt: null,
    user: {
      id: 'unit-user',
      email: 'unit@example.test',
      role: 'PARTICIPANT',
      emailVerified: new Date(),
      accountStatus: 'ACTIVE',
      twoFactorEnabled: false,
    },
  });
  return {
    prisma,
    strategy: new JwtStrategy(
      new ConfigService({ NODE_ENV: 'test' }),
      prisma as unknown as PrismaService,
    ),
  };
}
describe('Live session authorization', () => {
  it('uses the database role instead of stale or forged role claims', async () => {
    expect(await setup().strategy.validate(request, payload)).toMatchObject({
      role: 'PARTICIPANT',
    });
  });
  it('rejects unknown session records', async () => {
    const t = setup();
    t.prisma.session.findUnique.mockResolvedValue(null);
    await expect(t.strategy.validate(request, payload)).rejects.toThrow(
      'Session expired',
    );
  });
  it.each([
    { revokedAt: new Date() },
    { expires: new Date(0) },
    { userId: 'someone-else' },
  ])('rejects revoked, expired and misowned sessions %j', async (patch) => {
    const t = setup();
    const current = (await t.prisma.session.findUnique()) as {
      userId: string;
      expires: Date;
      revokedAt: Date | null;
      user: {
        id: string;
        email: string;
        role: string;
        emailVerified: Date | null;
        accountStatus: string;
        twoFactorEnabled: boolean;
      };
    };
    t.prisma.session.findUnique.mockResolvedValue({ ...current, ...patch });
    await expect(t.strategy.validate(request, payload)).rejects.toThrow(
      'Session expired',
    );
  });
  it.each([
    { accountStatus: 'SUSPENDED' },
    { emailVerified: null },
    { twoFactorEnabled: true },
  ])('rejects unsafe live account states %j', async (patch) => {
    const t = setup();
    const current = (await t.prisma.session.findUnique()) as {
      userId: string;
      expires: Date;
      revokedAt: Date | null;
      user: {
        id: string;
        email: string;
        role: string;
        emailVerified: Date | null;
        accountStatus: string;
        twoFactorEnabled: boolean;
      };
    };
    t.prisma.session.findUnique.mockResolvedValue({
      ...current,
      user: { ...current.user, ...patch },
    });
    await expect(t.strategy.validate(request, payload)).rejects.toThrow(
      'Session expired',
    );
  });
  it('requires a configured secret in production', () => {
    expect(
      () =>
        new JwtStrategy(
          {
            get: (key: string) =>
              key === 'NODE_ENV' ? 'production' : undefined,
          } as unknown as ConfigService,
          {} as PrismaService,
        ),
    ).toThrow('JWT_SECRET');
  });
});
