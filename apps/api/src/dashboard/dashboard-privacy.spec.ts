import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { DashboardService } from './dashboard.service';
import { TeamsService } from '../teams/teams.service';
import { EnrollmentService } from '../enrollment/enrollment.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { EventsGateway } from '../events/events.gateway';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';

const databaseUrl = process.env.NIRAL_TEST_DATABASE_URL;
const databaseTests = databaseUrl ? describe : describe.skip;

databaseTests(
  'Participant Privacy and Two-Account Isolation (PostgreSQL)',
  () => {
    let prisma: PrismaClient;
    let dashboardService: DashboardService;
    let teamsService: TeamsService;

    const userAId = `privacy-a-${randomUUID()}`;
    const userBId = `privacy-b-${randomUUID()}`;
    const emailA = `${userAId}@example.test`;
    const emailB = `${userBId}@example.test`;
    const eventId = `event-priv-${randomUUID()}`;

    beforeAll(async () => {
      const url = new URL(databaseUrl!);
      if (
        !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
        !url.pathname.endsWith('_test')
      ) {
        throw new Error(
          'Integration tests require a dedicated local *_test database.',
        );
      }

      prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
      await prisma.$connect();

      const prismaService = prisma as unknown as PrismaService;
      const auditService = new AuditService(prismaService);
      const mailService = new MailService(
        new ConfigService({
          EMAIL_PROVIDER: 'smtp',
          SMTP_HOST: 'localhost',
          SMTP_PORT: 1025,
          EMAIL_FROM: 'test@niral.example.test',
        }),
      );

      teamsService = new TeamsService(prismaService, auditService, mailService);

      const enrollmentService = new EnrollmentService(
        prismaService,
        mailService,
      );
      const notificationsService = new NotificationsService(prismaService);
      const leaderboardService = new LeaderboardService(prismaService);
      const eventsGateway = {
        emitDashboardEvent: jest.fn(),
      } as unknown as EventsGateway;

      dashboardService = new DashboardService(
        prismaService,
        teamsService,
        enrollmentService,
        notificationsService,
        leaderboardService,
        eventsGateway,
      );

      // Create Event Fixture
      await prisma.event.create({
        data: {
          id: eventId,
          name: 'NIRAL Hackathon 2026 Isolation Test',
          slug: eventId,
          startsAt: new Date('2026-12-03T00:00:00.000Z'),
          endsAt: new Date('2026-12-04T23:59:59.000Z'),
          isActive: true,
          isPublished: true,
          registrationEnabled: true,
          status: 'REGISTRATION_OPEN',
          eventMode: 'OFFLINE',
          minTeamSize: 2,
          maxTeamSize: 4,
        },
      });

      // Create User A
      await prisma.user.create({
        data: {
          id: userAId,
          email: emailA,
          name: 'Participant Alice',
          role: 'PARTICIPANT',
          accountStatus: 'ACTIVE',
          emailVerified: new Date(),
          college: 'Engineering College Alpha',
          department: 'Computer Science',
          profile: {
            bio: 'Alice Bio',
            skills: { typescript: 'expert', react: 'advanced' },
            interests: ['AI & Smart Automation'],
          },
        },
      });

      // Create User B
      await prisma.user.create({
        data: {
          id: userBId,
          email: emailB,
          name: 'Participant Bob',
          role: 'PARTICIPANT',
          accountStatus: 'ACTIVE',
          emailVerified: new Date(),
          college: 'Technology Institute Beta',
          department: 'Electronics',
          profile: {
            bio: 'Bob Bio',
            skills: { python: 'expert', iot: 'advanced' },
            interests: ['Cyber Physical Systems & IoT'],
          },
        },
      });

      // Enroll User A with specific Registration ID
      await prisma.eventEnrollment.create({
        data: {
          userId: userAId,
          eventId,
          registrationId: `NIRAL-ALICE-${randomUUID().slice(0, 6).toUpperCase()}`,
          mode: 'ONSITE',
          status: 'CONFIRMED',
          applicationData: {
            institution: 'Engineering College Alpha',
            department: 'Computer Science',
            degree: 'B.E',
            yearOfStudy: '3rd Year',
            phone: '+91 9876543210',
          },
          consentAcceptedAt: new Date(),
        },
      });
    });

    afterAll(async () => {
      try {
        await prisma.teamMember.deleteMany({
          where: { userId: { in: [userAId, userBId] } },
        });
        await prisma.eventEnrollment.deleteMany({
          where: { userId: { in: [userAId, userBId] } },
        });
        await prisma.user.deleteMany({
          where: { id: { in: [userAId, userBId] } },
        });
        await prisma.event.deleteMany({ where: { id: eventId } });
      } catch {
        /* ignore cleanup */
      }
      await prisma.$disconnect();
    });

    it('proves strict data isolation between two independent accounts in dashboard summary', async () => {
      const summaryA = await dashboardService.summary(userAId);
      const summaryB = await dashboardService.summary(userBId);

      // Summary A must strictly belong to Alice
      expect(summaryA.userSummary?.id).toBe(userAId);
      expect(summaryA.userSummary?.name).toBe('Participant Alice');
      expect(summaryA.enrollment?.registrationId).toMatch(/^NIRAL-ALICE-/);

      // Summary B must strictly belong to Bob
      expect(summaryB.userSummary?.id).toBe(userBId);
      expect(summaryB.userSummary?.name).toBe('Participant Bob');
      // Bob has not enrolled, must be null
      expect(summaryB.enrollment).toBeNull();

      // Verify no cross-user contamination
      expect(summaryA.userSummary?.id).not.toBe(summaryB.userSummary?.id);
      expect(summaryB.userSummary?.name).not.toBe(summaryA.userSummary?.name);
      expect(summaryB.enrollment).not.toEqual(summaryA.enrollment);
    });

    it('prevents non-leader teammates from viewing private join requests and invitations', async () => {
      // Alice creates Team Alpha
      const team = await teamsService.create(userAId, {
        name: `Squad-Alpha-${randomUUID().slice(0, 8)}`,
        description:
          'Alpha squad developing high-performance edge computing solutions for smart agriculture and IoT applications.',
        theme: 'Cyber Physical Systems & IoT',
        visibility: 'PUBLIC',
        recruitmentStatus: 'OPEN',
        eventId,
      });

      expect(team).toBeDefined();
      expect(team.leaderId).toBe(userAId);

      // Paid/free enrollment must be confirmed before Bob can join a team.
      await prisma.eventEnrollment.create({
        data: {
          userId: userBId,
          eventId,
          registrationId: `NIRAL-BOB-${randomUUID()}`,
          status: 'CONFIRMED',
          paymentModeSnapshot: 'FREE',
        },
      });
      // Bob joins Alice's team
      const joinedTeam = await teamsService.join(userBId, team.inviteCode);
      expect(joinedTeam).toBeDefined();
      expect(joinedTeam?.members).toHaveLength(2);

      // Leader Alice creates an invitation for an external email
      await teamsService.inviteMember(userAId, {
        teamId: team.id,
        email: 'prospective-member@example.test',
      });

      // Leader Alice views team: should see invitations
      const aliceTeamView = await teamsService.getMyTeam(userAId);
      expect(aliceTeamView).toBeDefined();
      expect(aliceTeamView?.invitations).toBeDefined();
      expect(aliceTeamView?.invitations.length).toBeGreaterThanOrEqual(1);
      expect(aliceTeamView?.invitations[0].invitedEmail).toBe(
        'prospective-member@example.test',
      );

      // PRIVACY ENFORCEMENT: Member Bob views team: joinRequests and invitations MUST be empty
      const bobTeamView = await teamsService.getMyTeam(userBId);
      expect(bobTeamView).toBeDefined();
      expect(bobTeamView?.invitations).toEqual([]);
      expect(bobTeamView?.joinRequests).toEqual([]);
    });

    it('strips participant emails in public team discovery', async () => {
      const publicList = await teamsService.listPublic(userAId);
      expect(Array.isArray(publicList)).toBe(true);

      for (const item of publicList) {
        for (const m of item.members) {
          // Public member views must NEVER expose participant emails
          expect(m.user).not.toHaveProperty('email');
          expect(m.user.name).toBeDefined();
        }
      }
    });

    it('enforces isolated read/unread announcement states per participant in PostgreSQL', async () => {
      const announcementsBefore = await dashboardService.announcements(userAId);
      expect(announcementsBefore.length).toBeGreaterThan(0);
      const targetId = announcementsBefore[0].id;

      // Alice marks announcement as read
      await dashboardService.markAnnouncementRead(userAId, targetId);

      const aliceList = await dashboardService.announcements(userAId);
      const bobList = await dashboardService.announcements(userBId);

      const aliceItem = aliceList.find((a) => a.id === targetId);
      const bobItem = bobList.find((a) => a.id === targetId);

      // Alice has read the announcement
      expect(aliceItem?.read).toBe(true);

      // Bob has NOT read the announcement (user isolation in PostgreSQL)
      expect(bobItem?.read).toBe(false);
    });

    it('prevents duplicate team membership and handles leave team with leadership transfer', async () => {
      // Bob tries to create another team while in Team Alpha -> must be rejected
      await expect(
        teamsService.create(userBId, {
          name: `Bob-Duplicate-${randomUUID().slice(0, 8)}`,
          description:
            'Duplicate team attempt that should be rejected by duplicate membership check.',
          eventId,
        }),
      ).rejects.toThrow('You already belong to a team');

      // Alice (Leader) leaves the team -> leadership should transfer to Bob
      const leaveResult = await teamsService.leaveTeam(userAId);
      expect(leaveResult.message).toContain('Leadership transferred');

      // Verify Bob is now the leader
      const bobNewTeamView = await teamsService.getMyTeam(userBId);
      expect(bobNewTeamView?.leaderId).toBe(userBId);
      expect(bobNewTeamView?.members).toHaveLength(1);
      expect(bobNewTeamView?.members[0].userId).toBe(userBId);
      expect(bobNewTeamView?.members[0].role).toBe('LEADER');

      // Alice is now free to join or create another team
      const aliceNewTeam = await teamsService.create(userAId, {
        name: `Alice-New-${randomUUID().slice(0, 8)}`,
        description:
          'Alice new team formed after successfully transferring previous team leadership.',
        eventId,
      });
      expect(aliceNewTeam.id).toBeDefined();

      // Alice disbands her solo team by leaving
      const disbandResult = await teamsService.leaveTeam(userAId);
      expect(disbandResult.message).toContain('Team disbanded');
    });
  },
);
