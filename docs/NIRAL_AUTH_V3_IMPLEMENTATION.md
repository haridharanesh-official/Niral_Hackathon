# NIRAL authentication V3 frontend

The V3 frontend extends the existing Next.js App Router, NextAuth credentials provider and same-origin account API bridge. No NestJS, database, public-page source, production environment file, dependency or deployment changes were made for this work. Existing staged changes were preserved.

## Screen coverage and validation limits

| Screen | Entry | Implementation / verification |
| --- | --- | --- |
| Welcome | `/register` | V3 introduction, student eligibility, checklist, resume and sign-in; desktop/tablet/mobile checked |
| Personal | `/register?step=1` | Required names, one email and mobile, optional display name; validation and preservation checked |
| Academic | `?step=2` | Institution, department, supported degree/year, optional student ID; required-field validation checked |
| Skills | `?step=3` | Searchable toggle chips, optional experience/track/GitHub; empty selections and chip toggles checked |
| Security | `?step=4` | Shared password policy, strength guidance, confirmation and reveal; mismatch/reveal checked |
| Review | `?step=5` | Full non-secret summary, edit actions, three unchecked mandatory consents; consent enforcement and 503 state checked |
| Verification | `/verify-email` | Existing real one-time link verification/resend, masked email, cooldown and retry; initial mobile layout checked |
| Account verified | Successful server response on `/verify-email` | Confirmation, masked registration email, next steps and profile/login links; real success remains untested |
| Login | `/login` | Existing NextAuth role routing, optional remembered email, errors, loading, unavailable Google; initial/empty validation checked |
| Forgot password | `/forgot-password` | Existing account-safe request and confirmation with 60-second retry interval; initial mobile layout checked |
| Reset password | `/reset-password#token=…` | Memory-only link token, shared password policy, mismatch/reveal, real submit; missing-link and expired rejection checks |
| Recovery result | Within forgot/reset flows | Requested, changed, expired, invalid and generic failure component variants; server-confirmed success remains untested |
| Profile completion | `/profile-completion` | Server-authenticated entry, existing GET/PATCH profile, optional fields, preview and URL image; auth redirect checked; authenticated form not exercised |
| Invitation | `/invite#token=…` | Auth-required entry, real pending invitations and existing acceptance endpoint; login-required layout checked; authenticated states not exercised |
| Session expired | `/session-expired` | Generic secure notice, login/recovery/home; no previous participant details; mobile layout checked |

The screens with untested authenticated or successful states are implemented but are **not signed off as complete**. Verification, recovery, sign-in, profile-save and team-acceptance success must be checked against an isolated configured test backend and verified test account. No successful authentication responses were fabricated.

## Components and existing functionality

New components under `apps/web/src/components/auth/`: `RegistrationExperience`, `Interactive3DArtwork`, `ProfileCompletion`, `InvitationAcceptance`, and `RecoveryResult`; `register/v3-model.ts` provides shared client validation, step guards and draft allowlisting.

Reused: `AuthLayout`, `AuthHeading`, `TactileField`, `PasswordStrength`, `PopButton`, public `Logo`, existing NIRAL scoped tokens, shared password policy, NextAuth session handling and `accountRequest`. Existing registration exports delegate to the V3 wizard. The old terminal component remains available for existing consumers.

The layered artwork supports mouse/touch pointer capture, arrow keys, explicit rotation buttons, reset, zoom, pause, floating layers and reduced motion. On small screens form content comes first and artwork follows it.

## Data boundaries

- Password and confirmation are memory-only. Reloading a review URL returns to security for password re-entry.
- The registration draft uses an explicit field allowlist in session storage. It excludes passwords, tokens and consent. Consent always requires fresh user action after a reload.
- The current registration payload stays compatible: `name`, `email`, `password`, `college`, `department`, `accountPolicyAccepted`. Unsupported fields are not hidden in `bio` or silently claimed as saved. The review explains the limitation.
- Remembering a login saves only the email, after successful sign-in, when explicitly selected. Session duration remains the existing server policy.
- Verification, reset and invitation tokens are read into memory and removed from the URL. They are never stored in local/session storage. The read survives React Strict Mode effect replay.
- Profile draft prefill is limited to a matching authenticated account email.
- The account API bridge and NextAuth credentials integration return unavailable when no backend URL is configured outside development. Their existing local development fallback remains available. No environment configuration was edited.
- Protected routes distinguish an absent session from a failed existing session cookie, directing the latter to the session-expiry notice. Server authentication and role checks remain intact.

## Deferred API requirements

1. Extend the registration contract with structured first/last/display name, phone, degree/year/student ID, interests, experience, track and portfolio fields. Persist them transactionally with account creation. The current frontend preserves unsupported fields only in the session draft.
2. Record each mandatory consent with policy version and server timestamp. Support optional newsletter consent independently. Newsletter opt-in is disabled until storage is supported. Confirm and publish the organizers' full privacy and retention policy; the UI currently explains actual data handling and links to existing rules.
3. Add an authenticated image upload contract with supported types, size limits and durable URL. Currently an upload is a local preview; a supplied image URL can be saved through the existing profile contract.
4. Add a secure invitation-preview endpoint bound to a link token and authenticated identity. The current invitations list cannot identify which team a token represents when several invitations are pending; acceptance is explicitly unavailable in that case. Add server-recorded decline. Current Decline / Back only leaves the invitation pending and says so.
5. Return typed invalid/expired/used/rate-limit codes and retry intervals consistently for account actions. Continue to enforce verification, eligibility, membership and team capacity on the server.
6. Verify OAuth account linking before enabling Google sign-in. Add a server-controlled remember-session preference only if desired; the present option remembers email only.

Event enrollment and organizer approval remain the existing separate authenticated flow. Team creation and joining remain after authentication; account creation does not imply event approval.

## Checks and evidence

- `node --test scripts/test-auth-v3.cjs`: five tests for direct-navigation guards, student fields, optional skills/links, shared password policy and secret-free drafts.
- `node node_modules/typescript/bin/tsc --noEmit --project apps/web/tsconfig.json`: passes after regenerating an existing malformed development route cache.
- Scoped ESLint: authentication changes pass. Full web ESLint reports 57 errors and 71 warnings in other existing files. Detailed output: `tmp/auth-v3-eslint.json`.
- `scripts/check-auth-v3-browser.cjs` uses an existing Playwright installation through `PLAYWRIGHT_MODULE`; browser binaries can be located with `PLAYWRIGHT_BROWSERS_PATH`. No packages were installed. Local browser access required sandbox approval.
- Browser evidence: `tmp/auth-v3-qa/`. The suite records registration guards, edit/browser navigation, password exclusion, refresh, consent, negative server responses, artwork controls, reduced-motion preference, keyboard reachability and responsive overflow. It never performs or invents successful authentication.
- Visual comparison used the supplied local HTML preview. Production UI omits the design-inspector chrome and prototype-only actions. Mobile puts forms before artwork. The live reference URL could not be fetched by the web tool.
- No public-page component or global stylesheet was edited. A current homepage render can establish a smoke check, but does not establish pixel-identical regression against a pre-change screenshot.

## Files changed for V3

Modified existing frontend files:

- `apps/web/src/components/niral-auth/auth-forms.tsx`
- `apps/web/src/components/niral-auth/auth-layout.tsx`
- `apps/web/src/components/niral-auth/auth.module.css`
- `apps/web/src/app/api/account/[action]/route.ts`
- `apps/web/src/auth.ts`
- `apps/web/src/proxy.ts`

Added:

- `apps/web/src/components/auth/register/v3-model.ts`
- `apps/web/src/components/auth/register/v3-registration.tsx`
- `apps/web/src/components/auth/interactive-3d-artwork.tsx`
- `apps/web/src/components/auth/profile-completion.tsx`
- `apps/web/src/components/auth/invitation-acceptance.tsx`
- `apps/web/src/components/auth/recovery-result.tsx`
- `apps/web/src/app/profile-completion/page.tsx`
- `apps/web/src/app/invite/page.tsx`
- `apps/web/src/app/session-expired/page.tsx`
- `scripts/test-auth-v3.cjs`
- `scripts/check-auth-v3-browser.cjs`
- This implementation report.

## Final browser results

The Playwright suite passed **41 assertions**. Results are in `tmp/auth-v3-qa/results.json`. No browser runtime exceptions occurred. The existing global content provider requests `/api/content` while unauthenticated and receives 401 responses; that behavior is outside these authentication edits. Framer Motion emits its expected reduced-motion development notice. A public-homepage screenshot caused a transient development hydration warning involving Playwright's injected caret-hiding styles; this is not evidence of a clean public-page visual regression test.

The public homepage rendered successfully, but a pre-change pixel baseline and a configured authenticated test account were unavailable. Full keyboard traversal, screen-reader testing, real touch-device testing, all authenticated states, mail delivery and live backend success paths remain unverified.

## Build

The default Turbopack production build stalled during compilation and was stopped. A Webpack production build initially hit a sandbox `EPERM` creating generated `.next/server/app/api/home` output. Its approved rerun outside the sandbox **passed with exit code 0**, including compilation, TypeScript, all 53 static pages, optimization and build traces. Command: `node ../../node_modules/next/dist/bin/next build --webpack` from `apps/web`.
