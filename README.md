# NIRAL Hackathon 2026

Official Event Management & Automation Platform for NIRAL 2026.

**Event Dates:** December 3–4, 2026  
**Timezone:** Asia/Kolkata (IST)  
**Slug:** `niral-2026`  
**Branding:** NIRAL 2026 (Built on HackOS Core)

---

## Technology Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4, Framer Motion, NextAuth |
| **Backend** | NestJS, TypeScript, Prisma ORM, PostgreSQL, Redis, Socket.IO, JWT Auth, Class Validator |
| **Shared** | `@hackos/shared` — typed contracts, event configurations, and automation signatures |
| **Infrastructure** | Docker Compose (PostgreSQL, Redis, MailHog) |

---

## Architecture & Quick Start

### 1. Prerequisites
- Node.js 20+
- Docker & Docker Compose
- npm workspaces

### 2. Environment Setup
```bash
cp .env.example .env
```
Ensure database connection parameters and JWT secrets are configured.

### 3. Local Infrastructure
```bash
npm run docker:up
```
Starts PostgreSQL (5432), Redis (6379), and MailHog (1025/8025).

### 4. Build & Seed
```bash
npm run build -w @hackos/shared
npm run db:generate
npm run db:migrate
npm run db:seed
```

> **Security Note:** Demo credentials are only seeded when `SEED_DEMO_USERS=true` or in development mode. Fixed credentials are strictly blocked in production.

### 5. Running the Application
```bash
# Terminal 1 — NestJS Backend API
npm run dev:api

# Terminal 2 — Next.js Web Frontend
npm run dev:web
```

- **Web Frontend:** [http://localhost:3000](http://localhost:3000)
- **API Server:** [http://localhost:4000/api](http://localhost:4000/api)
- **API Health:** [http://localhost:4000/api/health](http://localhost:4000/api/health)
- **Admin Settings:** [http://localhost:3000/admin/event-settings](http://localhost:3000/admin/event-settings)
- **MailHog UI:** [http://localhost:8025](http://localhost:8025)

---

## Phase 1 Feature Highlights

- **Centralized Event Authority:** PostgreSQL-backed authoritative event settings (`/api/events/current`, `/api/events/admin/:id`).
- **NIRAL 2026 Rebranding:** Consistent public identity across landing, metadata, navigation, hero, and SEO.
- **Removed Misleading Demo Info:** Purged fabricated live counters, synthetic jitter, unconfirmed prize claims, and fake corporate sponsors. Honest countdown to December 3–4, 2026.
- **Admin Event Settings:** Full-featured organizer control panel at `/admin/event-settings` with lifecycle transitions and audit logging.
- **Security Hardening:**
  - Token disclosure eliminated: verification and password reset tokens are delivered via `MailService`, never returned in API payloads or rendered in forms.
  - Team API data exposure sealed: Prisma user inclusions sanitized with strict safe projection (`id`, `name`, `email`, `role`, `avatarUrl`). Password hashes, 2FA secrets, and OAuth tokens are strictly stripped.
  - Safe OAuth account linking enforced.
- **Automation Foundation:** Typed event definitions (`AUTOMATION_EVENTS`) and transactional email abstraction ready for Phase 2–5 queues.

---

## Documentation Index

- [Architecture Overview](file:///d:/Hackathon/docs/ARCHITECTURE.md)
- [Event Configuration System](file:///d:/Hackathon/docs/NIRAL_EVENT_CONFIG.md)
- [Automation & Event Engine Architecture](file:///d:/Hackathon/docs/NIRAL_AUTOMATION_ARCHITECTURE.md)
- [Phase 1 Implementation Report](file:///d:/Hackathon/docs/PHASE1_IMPLEMENTATION_REPORT.md)
- [Development Roadmap & Phases](file:///d:/Hackathon/docs/PHASES.md)
- [Deployment Guide](file:///d:/Hackathon/docs/DEPLOYMENT.md)

---

## License

UNLICENSED — NIRAL Hackathon 2026 Internal Engineering.
