# HackOS Authentication Architecture (Part 4)

## Module map

```
Client apps (Web / Mobile / Admin / Judge / Mentor / Organizer)
        │
        ▼
Authentication Gateway (NestJS `/api` · X-API-Version: 1)
        │
 ┌──────┴──────────────────────────────────────────┐
 │ Auth Service · User/Profile · Teams · Enrollment │
 │ Notifications · Audit · Sessions · RBAC          │
 └──────────────────────┬───────────────────────────┘
                        ▼
                 PostgreSQL (+ Redis)
```

## Data model (auth-related)

| Entity | Table | Notes |
|--------|-------|-------|
| Users | `users` | `accountStatus`, `lastLoginAt`, bcrypt hash, primary `role` |
| Profiles | `user_profiles` | Extended personal / academic / portfolio fields |
| Roles | `role_definitions` | Metadata + priority; runtime checks use shared matrix |
| Permissions | `permissions` + `role_permissions` | Granular keys (`team.create`, …) |
| Sessions | `sessions` | Device, browser, OS, IP (policy), location, revoke |
| OAuth | `accounts` | Provider link + `linkedAt` / `lastLoginAt` |
| Event registration | `event_enrollments` | Mode, rules, registration ID |
| Teams | `teams` | Theme, visibility, `maxMembers` |
| Membership | `team_members` | Role + invitation status |
| Invitations | `team_invitations` | Hashed token, expiry, single-use |
| Audit | `audit_logs` | Actor, action, outcome, metadata |

## API surface (v1)

| Area | Endpoints |
|------|-----------|
| Registration | `POST /auth/register`, `verify-email` |
| Auth | `POST /auth/login` (rate-limited), JWT Bearer |
| Password | `forgot-password`, `reset-password` |
| Profile | `GET/PATCH /auth/me`, `GET /auth/onboarding` |
| Sessions | `GET /sessions`, `DELETE /sessions/:id`, revoke-others/all |
| Teams | create/join/invite/accept-invite/discover |
| Event | `GET/POST /enrollment` |
| Notifications | `GET /notifications` |

Responses include header `X-API-Version: 1`. Shared helpers `okResponse` / `errorResponse` available for envelope style.

## Security controls

- Passwords: bcrypt cost **12** (SRS allows Argon2id or bcrypt)
- HTTPS / Helmet / CORS / ValidationPipe whitelist
- ThrottlerGuard global + stricter auth limits
- Web CSP + security headers (`next.config.ts`)
- Email verification → `accountStatus: ACTIVE`
- Optional TOTP 2FA + backup codes
- Password reset invalidates sessions
- RBAC via `RolesGuard` + `PermissionsGuard` + `@hackos/shared` matrix
- Audit service for security-sensitive actions

## Performance targets

| Operation | Target |
|-----------|--------|
| Login | &lt; 500 ms (excl. OAuth) |
| Session list / validation | &lt; 100–200 ms |
| Profile GET | &lt; 200 ms |
| Registration | &lt; 2 s |

Indexes: `users.email` (unique), `users.role`, `sessions(userId, revokedAt)`, enrollment/team uniques.

## Testing

- Unit: `auth-security.spec.ts` — password policy, RBAC matrix, token hashing
- Integration / e2e: extend with registration → verify → login → team create
- Security: throttling on login, generic invalid-credential messages, invitation expiry

## Acceptance checklist

- [x] Registration + email verification
- [x] Login / invalid credentials handling
- [x] Password recovery + session revoke on reset
- [x] Team create + secure invitations
- [x] Event enrollment recorded
- [x] RBAC guards wired
- [x] Audit logs generated
- [ ] Full e2e suite under load (follow-up)
- [ ] Argon2id migration option (follow-up)
