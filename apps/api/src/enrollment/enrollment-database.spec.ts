import { PrismaClient } from '@prisma/client';
import { EnrollmentService } from './enrollment.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
// Real PostgreSQL tests are opt-in and may only target a dedicated local *_test database.
const databaseUrl = process.env.NIRAL_TEST_DATABASE_URL;
const databaseTests = databaseUrl ? describe : describe.skip;
databaseTests(
  'PostgreSQL application integration (BLOCKED unless NIRAL_TEST_DATABASE_URL is configured)',
  () => {
    let prisma: PrismaClient;
    let service: EnrollmentService;
    let mail: MailService;
    const userId = `qa-${randomUUID()}`,
      eventId = `qa-${randomUUID()}`;
    const dto = {
      eventId,
      mode: 'ONSITE' as const,
      rulesAccepted: true,
      eligibilityConfirmed: true,
      privacyAccepted: true,
      codeOfConductAccepted: true,
      application: {
        institution: 'Isolated test fixture',
        department: 'Test',
        degree: 'B.E. / B.Tech',
        yearOfStudy: 'Third year',
        phone: '+91 9876543210',
        interests: ['Test'],
        technologies: ['Test'],
      },
    };
    beforeAll(async () => {
      const url = new URL(databaseUrl!);
      if (
        !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
        !url.pathname.endsWith('_test')
      )
        throw new Error(
          'Integration tests require a dedicated local *_test database.',
        );
      prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
      await prisma.$connect();
      // Test fixtures exist only in the explicitly selected isolated test database.
      await prisma.user.create({
        data: {
          id: userId,
          email: `${userId}@example.test`,
          name: 'Isolated integration fixture',
          emailVerified: new Date(),
          accountStatus: 'ACTIVE',
        },
      });
      await prisma.event.create({
        data: {
          id: eventId,
          name: 'Isolated integration fixture',
          slug: eventId,
          startsAt: new Date(Date.now() + 86400000),
          endsAt: new Date(Date.now() + 172800000),
          isActive: true,
          isPublished: true,
          status: 'REGISTRATION_OPEN',
          registrationPaymentMode: 'FREE',
          registrationEnabled: true,
          eventMode: 'OFFLINE',
        },
      });
      // Real local capture and queue; no transport test double in this database suite.
      if (
        process.env.SMTP_HOST !== 'localhost' ||
        process.env.SMTP_PORT !== '1025'
      )
        throw new Error('Database integration requires local email capture.');
      mail = new MailService(new ConfigService(process.env));
      await mail.onModuleInit();
      service = new EnrollmentService(prisma as PrismaService, mail);
    });
    afterAll(async () => {
      if (!prisma) return;
      await prisma.paymentNotification.deleteMany({ where: { userId } });
      await prisma.event.deleteMany({ where: { id: eventId } });
      await prisma.user.deleteMany({ where: { id: userId } });
      await prisma.$disconnect();
      await mail?.onModuleDestroy();
    });
    it('allows one winner during simultaneous submissions', async () => {
      const results = await Promise.allSettled([
        service.enroll(userId, dto),
        service.enroll(userId, dto),
      ]);
      expect(results.filter((x) => x.status === 'fulfilled')).toHaveLength(1);
      expect(
        await prisma.eventEnrollment.count({ where: { userId, eventId } }),
      ).toBe(1);
    });
    it('persists the application, unique ID, confirmed free status and consent', async () => {
      const saved = await prisma.eventEnrollment.findUniqueOrThrow({
        where: { userId_eventId: { userId, eventId } },
      });
      expect(saved.status).toBe('CONFIRMED');
      expect(saved.registrationId).toMatch(/^NIRAL-[A-F0-9]{16}$/);
      expect(saved.consentAcceptedAt).not.toBeNull();
      expect(saved.applicationData).toMatchObject(dto.application);
    });
    it('records a status audit trail', async () => {
      expect(
        await prisma.auditLog.count({
          where: { userId, action: 'EVENT_APPLICATION_SUBMITTED' },
        }),
      ).toBe(1);
    });
    it('cannot retrieve another account application', async () => {
      expect(
        await prisma.eventEnrollment.findUnique({
          where: { userId_eventId: { userId: 'other-account', eventId } },
        }),
      ).toBeNull();
    });
    it('does not overwrite historical enrollments on a repeated submission', async () => {
      const saved = await prisma.eventEnrollment.findUniqueOrThrow({
        where: { userId_eventId: { userId, eventId } },
      });
      await expect(service.enroll(userId, dto)).rejects.toThrow(
        'already exists',
      );
      expect(
        (
          await prisma.eventEnrollment.findUniqueOrThrow({
            where: { id: saved.id },
          })
        ).registrationId,
      ).toBe(saved.registrationId);
    });
  },
);
