# NIRAL Hackathon 2026 — Platform Architecture

NIRAL 2026 is an enterprise-grade hackathon management and automation platform built inside a high-performance npm workspaces + Turborepo monorepo.

---

## High-Level Topology

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│                                                             │
│   Next.js 16 (App Router + React 19 + Tailwind CSS v4)      │
│   Cyber Glassmorphism UI · Public Landing · Admin Panel      │
│   Dashboard Modules (Participant, Team, Judge, Organizer)   │
└──────────────┬──────────────────────────────┬───────────────┘
               │ HTTP / JSON                  │ WSS / Socket.IO
               ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                       │
│                                                             │
│   NestJS Modular Backend (/api, Versioned, JWT Protected)   │
│   ├── EventsModule (Authoritative Configuration & State)   │
│   ├── AuthModule (RBAC, Single-Use Tokens, Mail Service)    │
│   ├── TeamsModule (Strict Safe Projections, Member Limits) │
│   ├── AuditModule (Tamper-Resistant Operational History)    │
│   └── MailModule (Transactional Email Delivery Service)     │
└──────────────┬──────────────────────────────┬───────────────┘
               │ Prisma ORM                   │ Redis Commands
               ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Persistence & Infra                      │
│                                                             │
│   PostgreSQL (Authoritative Relational Store)               │
│   Redis (Cache, Realtime Pub/Sub, Future Queue Engine)      │
│   MailHog / SMTP Relay (Transactional Messaging)            │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Workspace Structure

```
.
├── apps/
│   ├── api/                          # NestJS Backend API Service
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Data models with Phase 1 event extensions
│   │   │   ├── migrations/           # Idempotent forward-only SQL migrations
│   │   │   └── seed.ts               # Production-safe database seeder
│   │   └── src/
│   │       ├── auth/                 # Hardened JWT auth & RBAC guards
│   │       ├── events/               # Authoritative event configuration engine
│   │       ├── teams/                # Sanitized team & member APIs
│   │       ├── mail/                 # Transactional mail delivery abstraction
│   │       ├── audit/                # Structured event logging
│   │       └── common/events/        # Typed automation event signatures
│   │
│   └── web/                          # Next.js 16 Frontend Web Application
│       └── src/
│           ├── app/
│           │   ├── page.tsx          # Rebranded landing page (Dec 3–4, 2026)
│           │   ├── admin/            # Organizer administration consoles
│           │   │   └── event-settings/ # Centralized event configuration panel
│           │   └── dashboard/        # Participant, team, judge dashboards
│           ├── components/           # Reusable glassmorphic UI components
│           └── lib/content-store.ts  # Verified neutral landing content
│
└── packages/
    └── shared/                       # Shared contracts, DTOs & constants
        └── src/index.ts              # NiralEventConfig, enums, AUTOMATION_EVENTS
```

---

## Key Subsystems

### 1. Authoritative Event Configuration (`EventsModule`)
Provides the single source of truth for NIRAL 2026:
- Persistent in PostgreSQL (`Event` table).
- Dynamic lifecycle resolution (`DRAFT`, `REGISTRATION_OPEN`, `REGISTRATION_CLOSED`, `UPCOMING`, `LIVE`, `COMPLETED`, `ARCHIVED`).
- Public read endpoints (`/api/events/current`, `/api/events/:slug`) cacheable by CDN/reverse proxies.
- Protected update endpoint (`PATCH /api/events/admin/:id`) guarded by `JwtAuthGuard` and `RolesGuard(['ORGANIZER', 'ADMIN'])`.
- Full audit recording on every configuration update.

### 2. Security & Identity (`AuthModule`)
- **Token Security:** One-time verification and password reset tokens are strictly delivered via `MailService`. They are never returned in JSON HTTP response bodies and never rendered in frontend DOM elements.
- **Account Linking:** Automatic OAuth account linking without email verification has been disabled to prevent account takeover attacks.
- **Role-Based Access Control:** Enforced server-side using NestJS `@Roles()` decorators and `PermissionsGuard`. Clients cannot manipulate roles.

### 3. Data Exposure Prevention (`TeamsModule`)
- Unrestricted nested Prisma user queries (`include: { user: true }`) have been replaced with explicit safe selections:
  ```typescript
  export const SAFE_TEAM_MEMBER_USER_SELECT = {
    id: true,
    email: true,
    name: true,
    avatarUrl: true,
    role: true,
  } as const;
  ```
- Sensitive fields like `passwordHash`, `twoFactorSecret`, and OAuth tokens are completely prevented from escaping the database boundary.

### 4. Mail & Transactional Event Abstraction (`MailModule`)
- Clean `IMailService` interface.
- Includes a development testing adapter logging delivery events safely to console/MailHog.
- Fails safely in production without exposing sensitive credentials or reset tokens.

---

## Scalability & Extensibility

The Phase 1 architecture directly prepares for:
1. **Phase 2 (Registration Engine):** User account registration is decoupled from approved event participation.
2. **Phase 3 (Transactional Email Automation):** Outbox event payloads are pre-typed to stream directly into BullMQ Redis queues.
3. **Phase 4 (Team Collaboration):** Team size boundaries (`minTeamSize`, `maxTeamSize`) are stored authoritatively on the Event model.
4. **Phase 5 (Event Operations & Check-in):** Logical event state tracking distinguishes physical dates from manual organizer activation.
