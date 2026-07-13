import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@hackos.app' },
    update: {
      passwordHash,
      role: UserRole.ADMIN,
    },
    create: {
      email: 'admin@hackos.app',
      name: 'HackOS Admin',
      role: UserRole.ADMIN,
      emailVerified: new Date(),
      passwordHash,
      xp: 0,
    },
  });

  const demoHash = await bcrypt.hash('Participant123!', 12);
  const participant = await prisma.user.upsert({
    where: { email: 'demo@hackos.app' },
    update: { passwordHash: demoHash },
    create: {
      email: 'demo@hackos.app',
      name: 'Demo Participant',
      role: UserRole.PARTICIPANT,
      emailVerified: new Date(),
      passwordHash: demoHash,
      college: 'HackOS University',
      department: 'Computer Science',
      xp: 120,
    },
  });

  const event = await prisma.event.upsert({
    where: { slug: 'hackos-2026' },
    update: {},
    create: {
      name: 'HackOS 2026',
      slug: 'hackos-2026',
      description:
        'The flagship IoT + AI hackathon. Build, compete, and ship production-grade projects.',
      startsAt: new Date('2026-08-15T09:00:00Z'),
      endsAt: new Date('2026-08-17T18:00:00Z'),
      location: 'Hybrid — Campus + Online',
      isActive: true,
      settings: {
        maxTeamSize: 4,
        registrationOpen: true,
        theme: 'cyber',
      },
    },
  });

  const achievements = [
    {
      code: 'FIRST_LOGIN',
      title: 'First Signal',
      description: 'Logged into HackOS for the first time',
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

  console.log('Seed complete:', {
    admin: admin.email,
    participant: participant.email,
    event: event.slug,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
