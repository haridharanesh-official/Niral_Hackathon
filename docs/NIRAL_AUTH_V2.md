# NIRAL Authentication & Registration V2

**Phase 2.5 update:** local database, Redis queue and capture email verification is now complete; see [current integration results and runtime instructions](NIRAL_PHASE_2_5.md). The unavailable-service observations below describe the earlier UI phase. Gmail production delivery and remaining Figma comparisons are still unverified.

This change reuses NextAuth, NestJS, Prisma/PostgreSQL, the existing enrollment table, password policy, audit/session services, logo and Vengeance-derived PopButton. Public-page components and global styles are unchanged.

## Routes and workflow

- `/login`: one email/password sign-in for all roles. The NestJS-validated account role determines its destination. OAuth is deliberately unavailable: the previous provider callback did not map provider identity to a backend authorization/session record.
- `/register`: name, normalized email, password/confirmation and declaration; participant accounts only. Academic information belongs in `/apply`.
- `/verify-email`: one-click verification links, accurate SMTP acceptance/failure feedback, resend cooldown and invalid/expired/used states. `/register/verify` redirects here. No code input exists.
- `/forgot-password`, `/reset-password`: neutral request response, purpose-scoped single-use links, server password policy, session revocation and return to sign-in.
- `/apply`: verified identity, academics, interests and final review/declaration. Drafts are scoped to the account and event in browser session storage. No password is stored there.
- `/dashboard/application`: actual saved application and decision. The old `/dashboard/enrollment` entry redirects here rather than continuing a second enrollment implementation.
- Form feedback is reusable across these routes; it is not a separate public registration system.

Participant/team leader destinations retain participant workspaces. Volunteer, judge, organizer and administrator login destinations are `/volunteer`, `/judge`, `/organizer` and `/master`; guarded aliases lead to the existing role workspaces. `ADMIN` remains the existing master-administrator role. No role-selection UI grants permissions.

## Backend contracts

- `POST /api/auth/register`, `/login`, `/verify-email`, `/forgot-password`, `/reset-password` remain the existing entry points.
- `POST /api/auth/resend-verification`, `/confirm-transition`, `/logout` add real link resend, deliberate legacy security transition, and current-session revocation.
- `GET /api/auth/me` now depends on live session/account validation. JWT roles do not override the database role. Revoked/expired/suspended/unverified/legacy-transition sessions fail closed.
- `GET /api/enrollment/event`, `/me` expose published event configuration and the authenticated user's application. Internal event settings are filtered.
- `POST /api/enrollment` validates registration enablement, published/active state, status/window, participation mode, verified participant identity, consent and capacity. A serializable transaction saves the application snapshot, profile information, unique ID, pending decision, declaration version/time, notification and audit record. Repeated requests never rewrite a previous decision. PostgreSQL uniqueness resolves simultaneous submissions; serialization conflicts are retried.
- `PATCH /api/enrollment/:id/status` requires organizer/admin authorization and a live active actor. Transitions are explicit and audited; terminal rejected/withdrawn records cannot be silently resubmitted or reapproved.
- Same-origin `/api/account/[action]` handlers forward only a fixed allowlist, enforce Origin on mutations and use the NextAuth session for enrollment ownership. They do not create an alternate auth backend.

## Email and secrets

Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`/`SMTP_PASS` where needed, `EMAIL_FROM`, and `WEB_URL` (or the existing `NEXTAUTH_URL`). Use HTTPS for the public production URL. SMTP uses TLS/STARTTLS with certificate validation outside local capture hosts.

Development email must go to a local Mailpit/MailHog capture service. A missing provider is a failure, never a simulated success. SMTP acceptance is not a claim of inbox delivery. Password-recovery responses remain neutral even when delivery fails. Password-change and application-submission notifications report failures without rolling back an already completed password change or application.

Bearer links use fragments so tokens do not enter HTTP access logs/referrers; the UI removes them from browser history after reading. Tokens are hashed at rest, expire, and are consumed atomically with their account update. Tokens never appear in account-registration/recovery responses. Link issuance is serialized by inbox/purpose with PostgreSQL advisory locks and enforces a resend cooldown.

Set strong environment-managed `JWT_SECRET` and `AUTH_SECRET`/`NEXTAUTH_SECRET`. `.env.example` is documentation only. No existing secrets or the untracked Google client-secret JSON are read or changed by this implementation. Do not commit that secret file.

## Legacy authenticator transition

No bulk updates remove existing authenticator flags. Existing enabled accounts cannot obtain a session using password alone. After the correct password and existing verified email, sign-in requests a short-lived, single-use transition link. Its confirmation explicitly clears the old authenticator settings, revokes all sessions, and writes an audit event. Password recovery also invalidates outstanding transition links. New authenticator setup/enable/disable/backup-code endpoints return Gone; obsolete profile controls and supported-login code fields are removed. Existing schema columns remain for a safe transition and inventory.

**Operational gate:** inventory existing enabled accounts and confirm mail delivery before rollout. This workspace had no local PostgreSQL or mail-capture service, so account inventory and transition delivery could not be verified. Nothing was deployed and no existing account security record was changed.

## Schema and local integration gate

The additive migration `20261027090000_auth_application_v2` adds application JSON and consent columns, extends decision states, and changes defaults for future enrollments to `PENDING`. It does not rewrite historical enrollments. Prisma Client was regenerated; the migration was not applied to any database.

Use an explicitly confirmed local database, review/baseline the repository's existing migration history, then apply the migration through the normal project workflow. Never reset a production database. Full end-to-end readiness remains blocked until this is done and local mail capture is configured.

`npm run test -w @hackos/api -- --runInBand` runs the service/HTTP contracts. PostgreSQL integration tests are skipped unless `NIRAL_TEST_DATABASE_URL` points to a dedicated local database whose name ends in `_test`. Those tests create and clean only isolated test fixtures and require the updated schema; they never use `DATABASE_URL` as an implicit test target. Unit/HTTP mocks do not prove PostgreSQL persistence or SMTP delivery.

## Design and QA limits

Figma file `IPjL591kLf31ocZZVro9zd`: Sign In `2:2` and Create Account `2:277` were retrieved with design context/screenshots. The Figma Starter MCP limit blocked the other seven references. Their implementation extends the available approved auth system and the supplied functional brief; exact comparison to those seven frames remains outstanding.

Browser screenshots for authenticated application/review/status states use an isolated, localhost-only, non-persistent UI fixture adapter. Its displayed registration ID is explicitly `UI-FIXTURE-NOT-A-REGISTRATION`. It creates no real account, enrollment or email, and is not part of the application or deployment. These screenshots prove rendered UI behavior only. Real PostgreSQL and mail delivery tests remain blocked.
