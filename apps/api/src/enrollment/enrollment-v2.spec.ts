import { EnrollmentService } from './enrollment.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { EnrollEventDto } from './dto/enroll.dto';
import { Prisma } from '@prisma/client';
const event = {
  id: 'unit-event',
  name: 'Unit Event',
  slug: 'unit-test',
  updatedAt: new Date(),
  registrationPaymentMode: 'FREE',
  paymentProvider: 'FAMAPP_SANDBOX',
  registrationEnabled: true,
  isActive: true,
  isPublished: true,
  status: 'REGISTRATION_OPEN',
  registrationStartsAt: null,
  registrationEndsAt: null,
  eventMode: 'OFFLINE',
  maxCapacity: null,
  settings: {},
};
const dto: EnrollEventDto = {
  eventId: event.id,
  mode: 'ONSITE',
  rulesAccepted: true,
  eligibilityConfirmed: true,
  privacyAccepted: true,
  codeOfConductAccepted: true,
  application: {
    institution: 'Test institute',
    department: 'Test',
    degree: 'B.E. / B.Tech',
    yearOfStudy: 'Third year',
    phone: '+91 9876543210',
    interests: ['Testing'],
    technologies: ['TypeScript'],
  },
};
function setup() {
  const db = {
    user: { findUnique: jest.fn() },
    event: { findUnique: jest.fn(), findFirst: jest.fn() },
    eventEnrollment: {
      findUnique: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    userProfile: { upsert: jest.fn() },
    auditLog: { create: jest.fn() },
    notification: { create: jest.fn() },
    announcement: { findFirst: jest.fn() },
    paymentNotification: {
      create: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    $transaction: jest.fn(),
  };
  db.$transaction.mockImplementation(
    (fn: (tx: typeof db) => Promise<unknown>) => fn(db),
  );
  db.user.findUnique.mockResolvedValue({
    id: 'unit-user',
    role: 'PARTICIPANT',
    email: 'unit@example.test',
    name: 'Unit Test',
    emailVerified: new Date(),
    accountStatus: 'ACTIVE',
  });
  db.event.findUnique.mockResolvedValue(event);
  db.event.findFirst.mockResolvedValue(event);
  db.eventEnrollment.create.mockImplementation(
    ({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({
        ...data,
        id: 'unit-enrollment',
      }),
  );
  const mail = { send: jest.fn(() => Promise.resolve({ success: true })) };
  return {
    db,
    mail,
    service: new EnrollmentService(
      db as unknown as PrismaService,
      mail as unknown as MailService,
    ),
  };
}
describe('Event application V2 contracts (mocked persistence)', () => {
  it('rejects disabled registration even when legacy settings claim open', async () => {
    const t = setup();
    t.db.event.findUnique.mockResolvedValue({
      ...event,
      registrationEnabled: false,
      settings: { registrationOpen: true },
    });
    await expect(t.service.enroll('unit-user', dto)).rejects.toThrow(
      'not open',
    );
  });
  it.each([
    { registrationStartsAt: new Date(Date.now() + 100000) },
    { registrationEndsAt: new Date(0) },
    { status: 'DRAFT' },
  ])('validates the configured registration window %j', async (patch) => {
    const t = setup();
    t.db.event.findUnique.mockResolvedValue({ ...event, ...patch });
    await expect(t.service.enroll('unit-user', dto)).rejects.toThrow(
      'not open',
    );
  });
  it('requires a verified account', async () => {
    const t = setup();
    t.db.user.findUnique.mockResolvedValue({ emailVerified: null });
    await expect(t.service.enroll('unit-user', dto)).rejects.toThrow(
      'verified active',
    );
  });
  it('does not give staff participant application privileges', async () => {
    const t = setup();
    t.db.user.findUnique.mockResolvedValue({
      role: 'JUDGE',
      accountStatus: 'ACTIVE',
      emailVerified: new Date(),
    });
    await expect(t.service.enroll('unit-user', dto)).rejects.toThrow(
      'Only participant',
    );
  });
  it('requires rules and eligibility consent', async () => {
    await expect(
      setup().service.enroll('unit-user', { ...dto, rulesAccepted: false }),
    ).rejects.toThrow('declaration');
  });
  it('confirms free enrollment with real ID generation and consent snapshot', async () => {
    const t = setup();
    const result = await t.service.enroll('unit-user', dto);
    expect(result.status).toBe('CONFIRMED');
    expect(
      (
        t.db.eventEnrollment.create.mock.calls[0] as unknown as [
          { data: { consentAcceptedAt: Date } },
        ]
      )[0].data.consentAcceptedAt,
    ).toBeInstanceOf(Date);
    expect(result.registrationId).toMatch(/^NIRAL-[A-F0-9]{16}$/);
    expect(
      (
        t.db.eventEnrollment.create.mock.calls[0] as unknown as [
          { data: Record<string, unknown> },
        ]
      )[0].data,
    ).toMatchObject({
      userId: 'unit-user',
      eventId: event.id,
      confirmationStatus: 'CONFIRMED',
      paymentProviderSnapshot: 'FAMAPP_SANDBOX',
      applicationData: {
        institution: 'Test institute',
        email: 'unit@example.test',
      },
    });
    expect(t.db.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
    expect(t.db.auditLog.create).toHaveBeenCalled();
    expect(t.db.userProfile.upsert).toHaveBeenCalled();
  });
  it('rejects duplicates without changing historical statuses', async () => {
    const t = setup();
    t.db.eventEnrollment.findUnique.mockResolvedValue({
      id: 'history',
      status: 'CONFIRMED',
    });
    await expect(t.service.enroll('unit-user', dto)).rejects.toThrow(
      'already exists',
    );
    expect(t.db.eventEnrollment.create).not.toHaveBeenCalled();
    expect(t.db.eventEnrollment.updateMany).not.toHaveBeenCalled();
  });
  it('validates capacity', async () => {
    const t = setup();
    t.db.event.findUnique.mockResolvedValue({ ...event, maxCapacity: 1 });
    t.db.eventEnrollment.count.mockResolvedValue(1);
    await expect(t.service.enroll('unit-user', dto)).rejects.toThrow(
      'capacity',
    );
  });
  it('rejects an unsupported participation mode', async () => {
    await expect(
      setup().service.enroll('unit-user', { ...dto, mode: 'ONLINE' }),
    ).rejects.toThrow('mode supported');
  });
  it('retries serialization conflicts', async () => {
    const t = setup();
    t.db.$transaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('conflict', {
        code: 'P2034',
        clientVersion: 'unit',
      }),
    );
    await t.service.enroll('unit-user', dto);
    expect(t.db.$transaction).toHaveBeenCalledTimes(2);
  });
  it('converts database uniqueness conflicts to a duplicate application error', async () => {
    const t = setup();
    t.db.$transaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'unit',
      }),
    );
    await expect(t.service.enroll('unit-user', dto)).rejects.toThrow(
      'already exists',
    );
  });
  it('retrieves status using authenticated ownership only', async () => {
    const t = setup();
    await t.service.myEnrollment('unit-user');
    expect(t.db.eventEnrollment.findUnique).toHaveBeenCalledWith({
      where: { userId_eventId: { userId: 'unit-user', eventId: event.id } },
    });
    expect(
      (
        t.db.announcement.findFirst.mock.calls[0] as unknown as [
          { where: Record<string, unknown> },
        ]
      )[0].where,
    ).toMatchObject({
      published: true,
    });
  });
  it('rejects unauthorized status changes', async () => {
    await expect(
      setup().service.transition('unit-record', 'CONFIRMED', 'unit-user'),
    ).rejects.toThrow('Organizer authorization');
  });
  it('rejects invalid status transitions', async () => {
    const t = setup();
    t.db.user.findUnique.mockResolvedValue({
      role: 'ORGANIZER',
      accountStatus: 'ACTIVE',
    });
    t.db.eventEnrollment.findUnique.mockResolvedValue({ status: 'REJECTED' });
    await expect(
      t.service.transition('unit-record', 'CONFIRMED', 'organizer'),
    ).rejects.toThrow('not permitted');
  });
  it('records authorized transitions with optimistic status checks and audit', async () => {
    const t = setup();
    t.db.user.findUnique.mockResolvedValue({
      role: 'ORGANIZER',
      accountStatus: 'ACTIVE',
    });
    t.db.eventEnrollment.findUnique.mockResolvedValue({
      status: 'PENDING',
      eventId: event.id,
      userId: 'unit-user',
    });
    t.db.eventEnrollment.updateMany.mockResolvedValue({ count: 1 });
    await t.service.transition('unit-record', 'CONFIRMED', 'organizer');
    expect(t.db.eventEnrollment.updateMany).toHaveBeenCalledWith({
      where: { id: 'unit-record', status: 'PENDING' },
      data: { status: 'CONFIRMED', confirmationStatus: 'CONFIRMED' },
    });
    expect(t.db.auditLog.create).toHaveBeenCalled();
  });
});
