# Architecture

HackOS is an npm workspaces + Turborepo monorepo.

```
Browser (Next.js)
    │  REST + Socket.IO
    ▼
NestJS API
    ├── Prisma → PostgreSQL
    ├── Redis (cache / sessions / pub-sub)
    └── Socket.IO gateways
```

## Apps

- `apps/web` — App Router UI, design system, future NextAuth
- `apps/api` — Feature modules, RBAC, realtime, Prisma

## Packages

- `packages/shared` — enums, DTOs, constants consumed by web + api

## Phase 1 deliverables

- Monorepo tooling
- Docker Compose for Postgres, Redis, Mailhog
- Prisma schema covering users, teams, quizzes, submissions, scoring
- NestJS health + root info endpoints
- Cyber glassmorphism design tokens on the web app
