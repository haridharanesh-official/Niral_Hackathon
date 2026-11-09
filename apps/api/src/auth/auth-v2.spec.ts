import { createHash } from 'crypto';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuditService } from '../audit/audit.service';
import { SessionService } from '../session/session.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import type { EmailPayload } from '../mail/mail.interface';
import * as bcrypt from 'bcrypt';
jest.mock('bcrypt', () => ({
  hash: jest.fn(() => Promise.resolve('$hashed-password')),
  compare: jest.fn(() => Promise.resolve(true)),
}));
const user = {
  id: 'unit-user',
  name: 'Unit Test',
  email: 'unit@example.test',
  passwordHash: '$hashed-password',
  role: 'PARTICIPANT',
  emailVerified: new Date(),
  accountStatus: 'ACTIVE',
  twoFactorEnabled: false,
};
function setup() {
  const db = {
    user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    verificationToken: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    session: { updateMany: jest.fn() },
    paymentNotification: { upsert: jest.fn() },
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  };
  db.$transaction.mockImplementation(
    (fn: (tx: typeof db) => Promise<unknown>) => fn(db),
  );
  db.user.findUnique.mockResolvedValue({ ...user });
  db.user.create.mockResolvedValue({
    ...user,
    emailVerified: null,
    accountStatus: 'PENDING',
  });
  db.user.update.mockResolvedValue({ ...user });
  db.verificationToken.deleteMany.mockResolvedValue({ count: 1 });
  const jwt = {
    signAsync: jest.fn((payload: Record<string, unknown>) => {
      void payload;
      return Promise.resolve('unit-bearer');
    }),
  };
  const audit = { record: jest.fn() };
  const sessions = { createSession: jest.fn() };
  const mail = {
    send: jest.fn((payload: EmailPayload) => {
      void payload;
      return Promise.resolve({ success: true });
    }),
  };
  const service = new AuthService(
    db as unknown as PrismaService,
    jwt as unknown as JwtService,
    audit as unknown as AuditService,
    sessions as unknown as SessionService,
    mail as unknown as MailService,
    new ConfigService({ WEB_URL: 'http://localhost:3000', NODE_ENV: 'test' }),
  );
  return { db, jwt, audit, sessions, mail, service };
}
const registration: RegisterDto = {
  student: {
    firstName: 'Unit',
    lastName: 'Test',
    displayName: 'Unit Test',
    phone: '+91 9876543210',
    institution: 'Test College',
    department: 'ECE',
    degree: 'B.E. / B.Tech',
    yearOfStudy: 'Third year',
    skills: [],
    rulesAccepted: true,
    privacyAccepted: true,
    codeOfConductAccepted: true,
    eligibilityConfirmed: true,
  },
  name: 'Unit Test',
  email: ' UNIT@EXAMPLE.TEST ',
  password: 'StrongPassword123',
  accountPolicyAccepted: true,
};
describe('Auth V2 service contracts (mocked persistence, not database integration)', () => {
  beforeEach(() =>
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never),
  );
  it('requires account declaration', async () => {
    await expect(
      setup().service.register({
        ...registration,
        accountPolicyAccepted: false,
      }),
    ).rejects.toThrow('Accept the account declaration');
  });
  it('rejects weak passwords', async () => {
    await expect(
      setup().service.register({ ...registration, password: 'weak' }),
    ).rejects.toThrow('Password');
  });
  it('rejects duplicate email', async () => {
    await expect(setup().service.register(registration)).rejects.toThrow(
      'Email already registered',
    );
  });
  it('normalizes email, creates participant only and never returns link tokens', async () => {
    const t = setup();
    t.db.user.findUnique.mockResolvedValue(null);
    const result = await t.service.register(registration);
    expect(
      (
        t.db.user.create.mock.calls[0] as unknown as [
          { data: Record<string, unknown> },
        ]
      )[0].data,
    ).toMatchObject({
      email: 'unit@example.test',
      role: 'PARTICIPANT',
      accountStatus: 'PENDING',
      passwordHash: '$hashed-password',
    });
    expect(result).not.toHaveProperty('token');
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(result.emailDelivery).toBe('accepted');
    const message = t.mail.send.mock.calls[0][0] as unknown as { html: string };
    expect(message.html).toContain('/verify-email#token=email-verify.');
    expect(message.html).not.toContain('<code>');
  });
  it('reports verification delivery failure without claiming sent', async () => {
    const t = setup();
    t.db.user.findUnique.mockResolvedValue(null);
    t.mail.send.mockResolvedValue({ success: false });
    const result = await t.service.register(registration);
    expect(result.emailDelivery).toBe('failed');
    expect(result.message).toContain('could not be sent');
  });
  it('signs in verified users with unique token ID and sanitized user', async () => {
    const t = setup();
    const result = await t.service.login({
      email: user.email,
      password: 'password',
    });
    expect(result).toMatchObject({
      accessToken: 'unit-bearer',
      user: { role: 'PARTICIPANT' },
    });
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(t.jwt.signAsync.mock.calls[0][0]).toHaveProperty('jti');
    expect(t.sessions.createSession).toHaveBeenCalled();
  });
  it('rejects unknown credentials', async () => {
    const t = setup();
    t.db.user.findUnique.mockResolvedValue(null);
    await expect(
      t.service.login({ email: user.email, password: 'bad' }),
    ).rejects.toThrow('Invalid credentials');
  });
  it('rejects invalid passwords', async () => {
    jest.mocked(bcrypt.compare).mockResolvedValue(false as never);
    await expect(
      setup().service.login({ email: user.email, password: 'bad' }),
    ).rejects.toThrow('Invalid credentials');
  });
  it.each(['SUSPENDED', 'ARCHIVED'])('rejects %s accounts', async (status) => {
    const t = setup();
    t.db.user.findUnique.mockResolvedValue({ ...user, accountStatus: status });
    await expect(
      t.service.login({ email: user.email, password: 'password' }),
    ).rejects.toThrow('Account is not active');
  });
  it('requires email ownership before login', async () => {
    const t = setup();
    t.db.user.findUnique.mockResolvedValue({ ...user, emailVerified: null });
    await expect(
      t.service.login({ email: user.email, password: 'password' }),
    ).rejects.toThrow('Verify your email');
    expect(t.jwt.signAsync).not.toHaveBeenCalled();
  });
  it('never silently bypasses existing authenticator protection', async () => {
    const t = setup();
    t.db.user.findUnique.mockResolvedValue({ ...user, twoFactorEnabled: true });
    await expect(
      t.service.login({ email: user.email, password: 'password' }),
    ).rejects.toThrow('transition link');
    expect(t.jwt.signAsync).not.toHaveBeenCalled();
    expect(t.db.user.update).not.toHaveBeenCalled();
  });
  it('retired authenticator actions fail closed', () => {
    expect(() => setup().service.obsoleteAuthenticatorAction()).toThrow(
      'Authenticator enrollment is retired',
    );
  });
  it('rejects an invalid verification purpose', async () => {
    await expect(
      setup().service.verifyEmail('password-reset.invalid'),
    ).rejects.toThrow('Invalid token');
  });
  it('rejects expired verification links', async () => {
    const t = setup();
    t.db.verificationToken.findUnique.mockResolvedValue({
      identifier: 'email-verify:' + user.email,
      expires: new Date(0),
    });
    await expect(t.service.verifyEmail('email-verify.unit')).rejects.toThrow(
      'expired',
    );
    expect(t.db.user.update).not.toHaveBeenCalled();
  });
  it('rejects reused verification links', async () => {
    const t = setup();
    t.db.verificationToken.findUnique.mockResolvedValue({
      identifier: 'email-verify:' + user.email,
      expires: new Date(Date.now() + 10000),
    });
    t.db.verificationToken.deleteMany.mockResolvedValue({ count: 0 });
    await expect(t.service.verifyEmail('email-verify.unit')).rejects.toThrow(
      'already used',
    );
  });
  it('activates an eligible email using an atomic consumed link', async () => {
    const t = setup();
    t.db.verificationToken.findUnique.mockResolvedValue({
      identifier: 'email-verify:' + user.email,
      expires: new Date(Date.now() + 10000),
    });
    await t.service.verifyEmail('email-verify.unit');
    expect(
      (
        t.db.user.update.mock.calls[0] as unknown as [
          { data: { emailVerified: Date } },
        ]
      )[0].data.emailVerified,
    ).toBeInstanceOf(Date);
    expect(t.db.user.update).toHaveBeenCalledWith({
      where: { id: user.id, accountStatus: user.accountStatus },
      data: {
        emailVerified: (
          t.db.user.update.mock.calls[0] as unknown as [
            { data: { emailVerified: Date } },
          ]
        )[0].data.emailVerified,
        accountStatus: 'ACTIVE',
      },
    });
  });
  it('cannot reactivate a suspended user through verification', async () => {
    const t = setup();
    t.db.user.findUnique.mockResolvedValue({
      ...user,
      accountStatus: 'SUSPENDED',
    });
    t.db.verificationToken.findUnique.mockResolvedValue({
      identifier: 'email-verify:' + user.email,
      expires: new Date(Date.now() + 10000),
    });
    await expect(t.service.verifyEmail('email-verify.unit')).rejects.toThrow(
      'cannot be activated',
    );
    expect(t.db.user.update).not.toHaveBeenCalled();
  });
  it('enforces resend cooldown inside a transaction', async () => {
    const t = setup();
    t.db.user.findUnique.mockResolvedValue({ ...user, emailVerified: null });
    t.db.verificationToken.findFirst.mockResolvedValue({
      expires: new Date(Date.now() + 86400000),
    });
    await expect(t.service.resendVerification(user.email)).rejects.toThrow(
      '60 seconds',
    );
    expect(t.db.$queryRaw).toHaveBeenCalled();
  });
  it('keeps recovery responses neutral for unknown accounts and delivery failures', async () => {
    const a = setup();
    a.db.user.findUnique.mockResolvedValue(null);
    const unknown = await a.service.forgotPassword('unknown@example.test');
    const b = setup();
    b.mail.send.mockResolvedValue({ success: false });
    expect(await b.service.forgotPassword(user.email)).toEqual(unknown);
    expect(unknown).not.toHaveProperty('token');
  });
  it('keeps recovery cooldown response neutral', async () => {
    const a = setup();
    a.db.user.findUnique.mockResolvedValue(null);
    const b = setup();
    b.db.verificationToken.findFirst.mockResolvedValue({});
    expect(await b.service.forgotPassword(user.email)).toEqual(
      await a.service.forgotPassword('unknown@example.test'),
    );
  });
  it.each(['invalid', 'expired', 'used'])(
    'rejects %s recovery links',
    async (state) => {
      const t = setup();
      if (state !== 'invalid')
        t.db.verificationToken.findUnique.mockResolvedValue({
          identifier: 'password-reset:' + user.email,
          expires: new Date(state === 'expired' ? 0 : Date.now() + 10000),
        });
      if (state === 'used')
        t.db.verificationToken.deleteMany.mockResolvedValue({ count: 0 });
      await expect(
        t.service.resetPassword('password-reset.unit', 'StrongPassword123'),
      ).rejects.toThrow();
      expect(t.db.user.update).not.toHaveBeenCalled();
    },
  );
  it('resets passwords and revokes sessions in the same transaction', async () => {
    const t = setup();
    t.db.verificationToken.findUnique.mockResolvedValue({
      identifier: 'password-reset:' + user.email,
      expires: new Date(Date.now() + 10000),
    });
    const result = await t.service.resetPassword(
      'password-reset.unit',
      'StrongPassword123',
    );
    const revoked = (
      t.db.session.updateMany.mock.calls[0] as unknown as [
        {
          where: { userId: string; revokedAt: null };
          data: { revokedAt: Date };
        },
      ]
    )[0];
    expect(revoked.where).toEqual({ userId: user.id, revokedAt: null });
    expect(revoked.data.revokedAt).toBeInstanceOf(Date);
    expect(result).not.toHaveProperty('accessToken');
    expect(t.mail.send).toHaveBeenCalled();
  });
  it('transition consumes a password-authorized email link and revokes existing sessions', async () => {
    const t = setup();
    t.db.verificationToken.findUnique.mockResolvedValue({
      identifier: 'auth-transition:' + user.email,
      expires: new Date(Date.now() + 10000),
    });
    await t.service.completeTransition('auth-transition.unit');
    expect(t.db.user.update).toHaveBeenCalledWith({
      where: { id: user.id, accountStatus: user.accountStatus },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    });
    expect(t.db.session.updateMany).toHaveBeenCalled();
  });
  it.each(['Bearer', 'bearer'])(
    'logout revokes the presented %s session hash',
    async (scheme) => {
      const t = setup();
      await t.service.logout(`${scheme} unit-bearer`);
      const call = (
        t.db.session.updateMany.mock.calls[0] as unknown as [
          { where: { sessionToken: string } },
        ]
      )[0];
      expect(call.where.sessionToken).toBe(
        createHash('sha256').update('unit-bearer').digest('hex'),
      );
      expect(call.where.sessionToken).not.toEqual('unit-bearer');
    },
  );
});
