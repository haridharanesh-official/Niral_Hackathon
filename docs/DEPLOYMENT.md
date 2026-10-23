# NIRAL Hackathon 2026 — Deployment Guide

This document outlines environment requirements, database migrations, and operational guidelines for deploying NIRAL 2026.

---

## 1. Environment Configuration

Copy the example environment configuration:
```bash
cp .env.example .env
```

### Critical Environment Variables

| Variable | Description | Production Guidance |
|---|---|---|
| `NODE_ENV` | Application environment | Set to `production` |
| `DATABASE_URL` | PostgreSQL connection string with pooling | Managed PostgreSQL instance with SSL enabled (`sslmode=require`) |
| `DIRECT_URL` | Direct PostgreSQL connection string | Used by Prisma for running migrations |
| `REDIS_URL` | Redis instance URL | Managed Redis (Upstash, AWS ElastiCache, or Redis Enterprise) |
| `JWT_SECRET` | Secret key for signing backend access tokens | Generate high-entropy 256-bit secret |
| `JWT_REFRESH_SECRET` | Secret key for signing backend refresh tokens | Generate distinct high-entropy 256-bit secret |
| `NEXTAUTH_SECRET` | Secret key for NextAuth session encryption | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Canonical public URL for NextAuth callbacks | e.g., `https://niralhackathon.com` |
| `NEXT_PUBLIC_API_URL` | Base URL for NestJS backend | e.g., `https://api.niralhackathon.com/api` |
| `SEED_DEMO_USERS` | Controls whether demo accounts are seeded | **MUST be `false` or unset in production** |
| `SEED_ADMIN_EMAIL` | Bootstrap admin email address | Dedicated organizer administrator email |
| `SEED_ADMIN_PASSWORD` | Bootstrap admin password | Strong password injected via CI/CD secrets |
| `SMTP_HOST` / `SMTP_PORT` | Transactional email host and port | Production SMTP / Gmail Relay / SendGrid |
| `SMTP_USER` / `SMTP_PASS` | Transactional email credentials | Securely managed via secret manager |
| `EMAIL_FROM` | Default outgoing sender address | `noreply@niralhackathon.com` |

---

## 2. Infrastructure Services

### Local / Development Mode
```bash
# Start Postgres, Redis, and MailHog
npm run docker:up

# Tear down services
npm run docker:down
```

### Container Endpoints:
- **PostgreSQL:** `localhost:5432` (db: `niral_hackathon`, user: `postgres`)
- **Redis:** `localhost:6379`
- **MailHog Web UI:** [http://localhost:8025](http://localhost:8025)
- **MailHog SMTP:** `localhost:1025`

---

## 3. Database Migrations

Prisma schema migrations must always be executed forward-only.

### In Development:
```bash
npm run db:generate
npm run db:migrate
```

### In Production / Staging:
Never execute `prisma migrate reset` in production environments. Execute forward deploy:
```bash
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
```

### Phase 1 Migration File:
`apps/api/prisma/migrations/20261023_phase1_niral_event_configuration.sql`  
Applies idempotent `ADD COLUMN IF NOT EXISTS` for all authoritative NIRAL event settings, enum types (`EventStatus`, `EventMode`), and audit constraints.

---

## 4. Bootstrapping the Admin Account

In production, run the seed script with explicitly supplied environment secrets to bootstrap the authoritative event and initial admin account:
```bash
SEED_ADMIN_EMAIL="admin@niralhackathon.com" \
SEED_ADMIN_PASSWORD="<STRONG_VAULT_GENERATED_PASSWORD>" \
SEED_DEMO_USERS="false" \
npx prisma db seed --schema=apps/api/prisma/schema.prisma
```

---

## 5. Reverse Proxy & SSL Termination

When hosting behind NGINX, Cloudflare, or AWS ALB:
1. Terminate TLS at the reverse proxy.
2. Ensure `X-Forwarded-For` and `X-Forwarded-Proto` headers are preserved.
3. Configure rate limiting on authentication routes (`/api/auth/*`).
4. Route `/api/*` to NestJS (Port 4000) and all other traffic to Next.js (Port 3000).
