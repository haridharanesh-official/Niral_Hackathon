# HackOS

Complete Hackathon Management Platform — GitHub + Discord + Devpost + LeetCode energy for IoT + AI hackathons.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4, Framer Motion, NextAuth |
| Backend | NestJS, Prisma, PostgreSQL, Redis, Socket.IO, JWT |
| Shared | `@hackos/shared` types & constants |
| Infra | Docker Compose (Postgres, Redis, Mailhog, optional full stack) |

## Quick start

```bash
npm install
cp .env.example .env
npm run docker:up
npm run build -w @hackos/shared
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev:api
npm run dev:web
```

- Web: http://localhost:3000
- API: http://localhost:4000/api
- Health: http://localhost:4000/api/health

### Demo accounts (after seed)

| Email | Password | Role |
| --- | --- | --- |
| admin@hackos.app | Admin123! | ADMIN |
| demo@hackos.app | Participant123! | PARTICIPANT |

## What's included

- Landing page with countdown, particles, challenges, sponsors, FAQ
- Auth: register/login/reset/verify/2FA + Google/GitHub hooks
- Dashboards for participants, teams, mentors, judges, volunteers, organizers
- Mini games arena (12 games, 5 playable demos)
- Quiz arena with XP
- Live leaderboard + scorecard rubric
- Admin console
- AI Copilot Lab
- Socket.IO realtime gateway
- Docker deployment profiles

See `docs/PHASES.md` and `docs/DEPLOYMENT.md`.

## License

UNLICENSED — Hackathon project.
