# NIRAL Phase 2.5 — local database and email verification

The local PostgreSQL/Redis/email blockers recorded during the UI phase are resolved. Frontend designs and styles are unchanged. Google account sign-in remains unavailable; Gmail sending is a separate backend integration.

## Local runtime

Docker was absent on this Windows host. An isolated `NIRAL-Local` WSL2 distribution was imported from the official Alpine 3.22.7 minirootfs after SHA-256 verification. Docker Engine 28.3.3 and Compose 2.36.2 run inside it. Runtime data is under ignored `D:\Hackathon\tmp\niral-services`; no system-wide Docker Desktop installation or production connection was used.

Verified Compose services: `postgres` (PostgreSQL 16), `redis` (Redis 7), `mailhog` (SMTP capture). All published development ports now bind to loopback. API container configuration points SMTP to the `mailhog` service. A separate native Node API can use localhost services.

```powershell
# This host (Docker engine must be running inside NIRAL-Local):
& C:\Windows\System32\wsl.exe -d NIRAL-Local -- docker compose -f /mnt/d/Hackathon/docker/docker-compose.yml up -d postgres redis mailhog
& C:\Windows\System32\wsl.exe -d NIRAL-Local -- docker compose -f /mnt/d/Hackathon/docker/docker-compose.yml ps
# On a host with Docker available directly:
docker compose -f docker/docker-compose.yml up -d postgres redis mailhog
```

If the isolated engine has stopped, start it in a hidden background process rather than opening an interactive window:

```powershell
Start-Process C:\Windows\System32\wsl.exe -ArgumentList '-d','NIRAL-Local','--','dockerd','--host=unix:///var/run/docker.sock' -WindowStyle Hidden
```

Mail capture UI: http://localhost:8025. SMTP: localhost:1025. PostgreSQL: localhost:5432. Redis: localhost:6379. Containers persist across API restarts. Do not use `down -v` or reset any database.

## Migrations applied

The development database `hackos` was confirmed empty before initialization. The separate database `niral_integration_test` was newly created for real integration verification. These three migrations were applied in order to both:

1. `20261001000000_initial_schema` — newly added missing create-only baseline. Generated from the existing schema with the columns/enums belonging to subsequent migrations excluded. Includes the legacy tables, indexes and foreign keys previously represented only by schema/manual scripts.
2. `20261023120000_phase1_niral_event_configuration` — existing additive event configuration.
3. `20261027090000_auth_application_v2` — existing additive application/consent fields, decision states and future PENDING defaults.

Migration records show all completed without rollback. A live database-to-schema diff is empty. No data reset, destructive alteration, baseline resolve, seeding of official event facts or production operation occurred. The loose historical `manual_*_module.sql` files were not executed separately; their tables are represented in the create-only baseline.

**Existing installations:** do not blindly run this new initial migration on a populated database originally created using `db push` or manual SQL. Review its actual schema and migration history, reconcile/baseline through the normal reviewed process, and back up before any production migration. The fresh-local success does not authorize production migration.

## Real verification

`apps/api/scripts/verify-local-integration.cjs` starts the compiled real Nest API with an explicitly supplied local `*_test` database, refuses an occupied API port, and never uses the development database as a fallback. Set `NIRAL_EVIDENCE_DIR` outside tracked source. It creates clearly named isolated test identities/events in that test database through real registration and Prisma operations; no mocked response or persistence is used. These are test fixtures, not official participants or event configuration. Test rows remain in the isolated database as evidence; repeating the probe uses unique identifiers.

```powershell
# Set NIRAL_TEST_DATABASE_URL in ignored .env to a dedicated migrated local *_test database.
# Set NIRAL_EVIDENCE_DIR to an absolute directory for sanitized evidence.
# Stop the development API first: the probe reserves port 4000 for its isolated API.
# Optionally set NIRAL_VERIFY_WEB=true with the Next app already on localhost:3000.
npm run test:integration:local -w @hackos/api
```

The probe verifies account creation, bcrypt storage, duplicate email denial, unverified sign-in denial, a captured single-use verification link hashed at rest, login/session persistence, two simultaneous submissions producing one 201 and one 409, unique registration ID, independent-connection persistence, consent, status retrieval, the direct database unique constraint, authorized/forbidden roles, irreversible decision transitions, neutral recovery, captured reset and password-change messages, old-password rejection, session revocation and encrypted completed queue jobs. Optional web checks use actual NextAuth session cookies and twenty role/alias combinations plus anonymous redirects and content API authorization.

All five previously skipped PostgreSQL tests now pass with real local SMTP/queue transport. The full API suite passes 87 tests with zero skips. Unit tests remain explicitly mocked where appropriate and are not used as evidence of actual email delivery. Real queue outage/restoration was separately exercised: stopping MailHog yields a failed delivery result, restarting it yields a captured message.

## Queue and delivery

Set `MAIL_QUEUE_ENABLED=true`, `REDIS_URL`, and a distinct `MAIL_QUEUE_KEY` (base64 encoding of 32 cryptographically random bytes). Keep the key only in ignored local configuration or deployment secrets. Do not reuse JWT/auth secrets. Retain the same key across worker restarts; drain pending jobs before planned key rotation.

BullMQ stores AES-256-GCM encrypted message payloads in Redis. Queue processing runs in the API process; at least one API worker must be running. The producer waits for actual worker delivery before returning acceptance. Failed jobs have no automatic retry; users can retry/resend through existing flows. Jobs older than 60 seconds are refused. Completed/failed job history is bounded to 100 records/one hour. Provider acceptance is not a guarantee of external inbox delivery. Redis persistence must be operated reliably before production rollout. SMTP cannot offer exactly-once delivery if a process dies around acceptance; application uniqueness is independently enforced transactionally by PostgreSQL.

Verification/recovery bearer tokens never enter API responses, application logs or plaintext Redis payloads. Login intentionally returns the existing authenticated access JWT; this is not a verification/reset token. Raw message contents remain visible in the local capture mailbox, so keep its ports loopback-only and never export its contents containing usable links. Evidence files contain IDs/subjects/timestamps only.

## Gmail preparation — no real sends performed

Local `EMAIL_PROVIDER=smtp` is restricted to capture hosts outside production. The optional production-only `EMAIL_PROVIDER=gmail` uses Gmail API `messages.send`, not broad SMTP mailbox permissions. Configure environment secrets `GMAIL_SEND_CLIENT_ID`, `GMAIL_SEND_CLIENT_SECRET`, `GMAIL_SEND_REFRESH_TOKEN`, and `EMAIL_FROM`. Use a dedicated organizer sending account and a separate OAuth consent grant with **only** `https://www.googleapis.com/auth/gmail.send`. The adapter refuses missing, extra or broader scopes in the refreshed token response. `EMAIL_FROM` must be the account or an authorized sending alias.

The deployment owner must enable Gmail API, configure consent and authorized redirect URIs, obtain offline consent securely, and store the resulting refresh token in deployment secrets. Do not paste tokens into source, logs or chat. No client-secret attachment was read or repurposed. Do not use the interactive Google sign-in client/session as a sending identity. Google sign-in remains disabled until independently configured and verified end-to-end.

No Gmail credentials were supplied or tested; no Gmail authorization or delivery is claimed. A future controlled mailbox acceptance test requires explicit authorized recipients and must precede participant sends. Google treats `gmail.send` as a sensitive send-only scope; applicable consent/verification requirements still apply.

References: [Google scope documentation](https://developers.google.com/workspace/gmail/api/auth/scopes), [Gmail message sending](https://developers.google.com/workspace/gmail/api/guides/sending), [BullMQ connections](https://docs.bullmq.io/guide/connections), [Microsoft WSL import](https://learn.microsoft.com/windows/wsl/use-custom-distro), [official Alpine releases](https://dl-cdn.alpinelinux.org/alpine/v3.22/releases/x86_64/).

## Correctness and release review

Real PostgreSQL exposed a Prisma `void` deserialization failure in advisory-lock acquisition during registration. The result is now cast to text; the real registration/recovery flow verifies the fix.

Review of all 47 prior lint errors found an unauthenticated `/api/content` read/update/reset endpoint. It is now ADMIN-only with same-origin checks on mutations and generic errors; real-cookie negative tests pass. Its two unsafe `any` error catches were removed. No public page styling changed.

A remaining release-blocking privacy risk exists in `apps/web/src/components/dashboard/command-center/hooks.ts`: offline fallback stores team/enrollment/notification data under a shared, unscoped localStorage key (`hackos.dashboard.summary.cache`). On a shared browser, a later user's failed fetch can recover the earlier user's summary. This was identified from source during the requested lint review; it is not fixed by API role checks. Scope/remove this cache and test account switching before release. Dashboard timeline constants also retain unconfirmed July/August dates; reconcile those through authoritative configuration rather than inventing replacements. No broad dashboard refactor was performed in this backend phase.

The other lint findings involve effect-driven state synchronization, compiler memoization/dependency checks, render-time dates and untyped legacy data. They remain quality/correctness debt; lint alone does not establish an authorization flaw. Review raw findings and the release triage in the phase evidence. This was a scoped correctness review, not a full repository security audit.

## Native API and repeatable tests

After building, `npm run start:local -w @hackos/api` starts the compiled API with the development configuration. `npm run test:local -w @hackos/api` loads ignored root `.env` so the explicitly configured local integration database and capture settings are available to all tests. The normal `npm test` intentionally retains opt-in database behavior when that variable is absent. Do not point the test URL at `hackos` or any production database.

The local development database has no invented official event or administrator seed. Registration can be exercised locally, but opening real event applications requires legitimate event configuration and authorized administrator provisioning. Integration events/accounts are confined to `niral_integration_test`.
