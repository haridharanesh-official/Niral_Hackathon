import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const isProduction = process.env.NODE_ENV === 'production';
  const allowDevSeeding = process.env.ALLOW_DEV_SEEDING === 'true' || !isProduction;

  // 1. Authoritative Event Configuration for NIRAL Hackathon 2026
  const event = await prisma.event.upsert({
    where: { slug: 'niral-2026' },
    update: {
      name: 'NIRAL Hackathon 2026',
      publicDescription:
        'NIRAL Hackathon 2026 is an innovation-driven IoT and emerging technologies hackathon bringing together students, researchers, makers, and innovators.',
      tagline: 'The Future of Innovation Starts Here',
      timezone: 'Asia/Kolkata',
      startsAt: new Date('2026-12-03T00:00:00.000Z'),
      endsAt: new Date('2026-12-04T23:59:59.000Z'),
      hasExactTimes: false, // exact timings to be confirmed by organizers
      eventMode: 'HYBRID',
      registrationEnabled: false, // Initial safe state: Coming Soon
      minTeamSize: 2,
      maxTeamSize: 4,
      status: 'DRAFT',
      isPublished: true,
      isActive: true,
    },
    create: {
      name: 'NIRAL Hackathon 2026',
      slug: 'niral-2026',
      publicDescription:
        'NIRAL Hackathon 2026 is an innovation-driven IoT and emerging technologies hackathon bringing together students, researchers, makers, and innovators.',
      tagline: 'The Future of Innovation Starts Here',
      timezone: 'Asia/Kolkata',
      startsAt: new Date('2026-12-03T00:00:00.000Z'),
      endsAt: new Date('2026-12-04T23:59:59.000Z'),
      hasExactTimes: false,
      eventMode: 'HYBRID',
      registrationEnabled: false,
      minTeamSize: 2,
      maxTeamSize: 4,
      status: 'DRAFT',
      isPublished: true,
      isActive: true,
      settings: {
        theme: 'cyber',
        submission: {
          allowEditAfterSubmit: false,
          maxFileSizeMb: 50,
        },
      },
    },
  });

  // 2. Permission Definitions (Always seeded)
  const permissionDefs = [
    { key: 'profile.view', description: 'View profile', category: 'User' },
    { key: 'profile.edit', description: 'Edit profile', category: 'User' },
    { key: 'profile.upload_resume', description: 'Upload resume', category: 'User' },
    { key: 'team.create', description: 'Create team', category: 'Team' },
    { key: 'team.invite', description: 'Invite member', category: 'Team' },
    { key: 'team.remove_member', description: 'Remove member', category: 'Team' },
    { key: 'team.submit', description: 'Submit project', category: 'Team' },
    { key: 'judge.view_submissions', description: 'View submissions', category: 'Judge' },
    { key: 'judge.evaluate', description: 'Submit evaluations', category: 'Judge' },
    { key: 'event.create', description: 'Create events', category: 'Organizer' },
    { key: 'event.announce', description: 'Publish announcements', category: 'Organizer' },
    { key: 'event.manage_users', description: 'Manage event users', category: 'Organizer' },
    { key: 'event.manage_settings', description: 'Configure event parameters', category: 'Organizer' },
    { key: 'admin.manage_users', description: 'Manage all users', category: 'Admin' },
    { key: 'audit.view', description: 'View audit logs', category: 'Admin' },
  ];

  for (const perm of permissionDefs) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: { description: perm.description, category: perm.category },
      create: perm,
    });
  }

  // 3. Role Definitions (Always seeded)
  const roleDefs = [
    { key: 'PARTICIPANT', description: 'Hackathon participant', priority: 10 },
    { key: 'TEAM_LEADER', description: 'Team leader', priority: 20 },
    { key: 'MENTOR', description: 'Mentor', priority: 30 },
    { key: 'JUDGE', description: 'Judge', priority: 40 },
    { key: 'VOLUNTEER', description: 'Volunteer', priority: 15 },
    { key: 'SPONSOR', description: 'Sponsor', priority: 25 },
    { key: 'ORGANIZER', description: 'Event organizer', priority: 80 },
    { key: 'ADMIN', description: 'System administrator', priority: 100 },
  ];

  for (const role of roleDefs) {
    await prisma.roleDefinition.upsert({
      where: { key: role.key },
      update: { description: role.description, priority: role.priority },
      create: role,
    });
  }

  // 4. System Achievements
  const achievements = [
    {
      code: 'FIRST_LOGIN',
      title: 'First Signal',
      description: 'Logged into NIRAL 2026 for the first time',
      icon: 'zap',
      xpReward: 10,
    },
    {
      code: 'TEAM_JOINED',
      title: 'Squad Up',
      description: 'Joined or created a team',
      icon: 'users',
      xpReward: 25,
    },
    {
      code: 'QUIZ_MASTER',
      title: 'Quiz Master',
      description: 'Scored 90%+ on any quiz',
      icon: 'trophy',
      xpReward: 50,
    },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { code: achievement.code },
      update: achievement,
      create: achievement,
    });
  }

  // 5. Account Seeding (Development only — NEVER create fixed password accounts in production)
  if (!isProduction && allowDevSeeding) {
    const devAdminEmail = process.env.DEV_ADMIN_EMAIL || 'admin@niralhackathon.com';
    const devAdminPass = process.env.DEV_ADMIN_PASSWORD || 'NiralAdmin2026!';
    const adminHash = await bcrypt.hash(devAdminPass, 12);

    const admin = await prisma.user.upsert({
      where: { email: devAdminEmail },
      update: {
        role: UserRole.ADMIN,
        accountStatus: 'ACTIVE',
        emailVerified: new Date(),
      },
      create: {
        email: devAdminEmail,
        name: 'NIRAL 2026 Admin',
        role: UserRole.ADMIN,
        emailVerified: new Date(),
        passwordHash: adminHash,
        accountStatus: 'ACTIVE',
        xp: 0,
      },
    });

    const devParticipantEmail = 'demo@niralhackathon.com';
    const participantHash = await bcrypt.hash('Participant2026!', 12);
    const participant = await prisma.user.upsert({
      where: { email: devParticipantEmail },
      update: {
        accountStatus: 'ACTIVE',
        emailVerified: new Date(),
      },
      create: {
        email: devParticipantEmail,
        name: 'Demo Participant',
        role: UserRole.PARTICIPANT,
        emailVerified: new Date(),
        passwordHash: participantHash,
        accountStatus: 'ACTIVE',
        college: 'Innovation Institute',
        department: 'Computer Science & Engineering',
        xp: 120,
      },
    });

    await prisma.userProfile.upsert({
      where: { userId: participant.id },
      update: {
        displayName: 'Demo Participant',
        institution: 'Innovation Institute',
        department: 'Computer Science & Engineering',
      },
      create: {
        userId: participant.id,
        displayName: 'Demo Participant',
        institution: 'Innovation Institute',
        department: 'Computer Science & Engineering',
        preferredLanguage: 'EN',
        timezone: 'Asia/Kolkata',
      },
    });

    console.log('Development seed complete:', {
      event: event.slug,
      admin: admin.email,
      participant: participant.email,
      permissions: permissionDefs.length,
    });
  } else if (isProduction) {
    // In production, ensure no unauthenticated admin accounts are created without explicit bootstrap
    console.log('Production mode detected: Skipped test user accounts. Event & permission definitions synced.');
  }
}

main()
  .catch((error) => {
    console.error('Seed failure:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
