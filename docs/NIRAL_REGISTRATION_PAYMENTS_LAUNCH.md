# NIRAL Registration and Payments — Validation Report

Latest audit: 9 November 2026. **Production readiness: NO-GO.** See [Phase 6 findings and current failed checks](NIRAL_PHASE_6_PRE_RELEASE_AUDIT.md) before using the earlier validation totals below. The feature commit was pushed on 9 November; this audit performed no merge, deployment, public collection or production credential change.

## Outcome

The existing custom UPI infrastructure was extended and validated while retaining working authentication, registration, dashboards and NIRAL styling. Razorpay remains absent from active code; historical financial records remain preserved.

The owner supplied the FamApp credit-email body structure and confirmed one fixed fee per locked team. This validation adds that parser, safe Gmail refresh/health/label handling, shared-team pricing and coverage, cancellation policies, roster locking, and per-member confirmation/refund notifications. Email matches remain candidate evidence only.

## Actual results

| Check                                              | Result                                                | Evidence                                                           |
| -------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------ |
| Full API suite                                     | 160 passed, 14 suites, zero failed/skipped            | tmp/upi-validation-api-final.json                                  |
| FamApp template parser                             | 21 passed, included in API total                      | famapp-parser.spec.ts                                              |
| Real HTTP/PostgreSQL/SMTP/NextAuth/browser journey | 63 passed, zero runtime errors                        | tmp/launch-http-qa/results.json                                    |
| Authentication browser regressions                 | 41 passed                                             | tmp/auth-v3-qa/results.json                                        |
| Interactive artwork regressions                    | 52 passed, no unexpected console errors               | tmp/core-v4-qa/results.json                                        |
| Registration model tests                           | 5 passed                                              | scripts/test-auth-v3.cjs                                           |
| API Nest production build                          | Passed, exit 0                                        | Local build output                                                 |
| Frontend Next.js webpack production build          | Passed, exit 0; TypeScript and all 54 pages generated | Local build output                                                 |
| Payment/frontend scoped lint                       | Zero errors/warnings                                  | tmp/upi-validation-api-lint.json; tmp/upi-validation-web-lint.json |
| Live Gmail configuration preflight                 | BLOCKED: readyForOAuth=false                          | tmp/gmail-validation-preflight.json                                |

The previous 136 API/49 journey baseline was inspected and rerun with added coverage. Tests include missing/duplicate UTRs, changed amounts, wrong beneficiaries, spoofed/invalid authentication, repeated Gmail messages/provider references, conflicting HTML/text, delayed alerts, revoked grants, role/ownership denial, transactional rollback, independent statement review, receipts and refund audit trails.

The real browser flow verifies registration persistence, actual local SMTP verification/reset links, free enrollment/capacity, pending paid enrollment, Master permissions, CSRF denial, audit export, session revocation and the shared team flow. Pending team-priced participants can form a roster; the leader creates one fixed-amount order; repeated checkout returns it; roster changes and member claims are blocked; incorrect credit amounts confirm nobody; independent authenticated review confirms exactly the covered roster; both members receive local confirmation notifications; members have read-only shared receipts; full refund evidence withdraws both registrations.

Payment views passed 1440/768/390-pixel checks; shared checkout and Master controls passed 390-pixel overflow checks. The installed Playwright Chromium runtime was used. Screenshots include tmp/launch-http-qa/team-payment-mobile.png, upi-mobile.png, upi-verified-mobile.png and upi-master-mobile.png. The existing theme, registration interactions and artwork controls remain covered.

An inconsistent generated Next.js development type file and a missing shared-member source type were caught. The source type was corrected; only the verified generated development-type cache was removed/regenerated with the dev server stopped. Production type checking/build then passed. A team test fixture also violated the existing minimum description length; the fixture was corrected and the complete journey rerun. Full-repository lint was not rerun; previous unrelated lint failures are not represented as fixed.

**No real wallet transfers, actual refunds, live Google OAuth grants or live Gmail reads occurred.** Google protocol responses/authentication headers and receiving/outgoing statement data are explicitly synthetic fixtures. The local application, database, browser, authentication and SMTP-capture flow is real. Fixture success does not prove sender authentication, merchant permission or bank settlement.

## Gmail validation and outstanding configuration

The owner-supplied body is parsed as plain text and HTML tables. Tests cover Unicode/entities, integer paise, leading-zero UTR strings, separate provider transaction ID, masked names and IST normalization. Updated Balance is informational and never used as the credited amount. Equivalent MIME alternatives create one record; conflicting alternatives are quarantined. Message IDs, provider transaction fingerprints and UTRs prevent duplicate credit processing.

The displayed no-reply@famapp.in sender is not independently authenticated and the subject is unknown. Candidate eligibility requires a configured sender and aligned Gmail SPF/DKIM/DMARC results. The body lacks a UPI ID, so a verified server-side permitted-mailbox-to-beneficiary mapping is mandatory. The parser/mapping flags remain off by default. Even a matched candidate never calls the VERIFIED/enrollment-confirmation path.

Controlled protocol tests with actual PostgreSQL cover token refresh/rotation, cached access/early-expiry retry, mailbox identity, configured label discovery/readability, polling and repeated reads, candidate matching, role denial and invalid_grant reconnection. Live consent/refresh/polling has not been validated.

Missing backend configuration: dedicated reconciliation client ID/secret, redirect, expressly permitted mailbox grant, reconciliation encryption key, label ID, authenticated sender evidence and verified beneficiary binding. Expected development callback:

`http://localhost:3000/admin/payments`

Follow [NIRAL_GMAIL_SETUP.md](NIRAL_GMAIL_SETUP.md) for exact Google Cloud Console, consent/test-user, restricted-scope, local secret, label-discovery and health-check steps. Do not paste credentials into chat or commit credential JSON. Keep Gmail polling disabled until permission/configuration are verified.

## Pricing, policies and independent verification

Master supports participant pricing or one fixed charge/tax per locked team. Publication requires active verified Master access, approved terms, explicit confirmation, old amount/version checks, issuer and HTTPS payment/refund/cancellation URLs without embedded credentials. Actual policy content/public availability still needs organizer review. No real fee, tax or policy has been invented.

Each enrollment freezes scope, fee/tax/currency/provider, policies/version and team-size terms. Shared checkout requires matching verified pending enrollments, a complete roster and the authorized leader. Unique coverage/order keys and PostgreSQL roster guards prevent duplicate allocation or post-checkout membership/leader/event changes. Covered members have read access; only the payer can claim/pay. Changing settings does not reprice existing orders.

Only an active verified non-self Master can record independent receiving-account credit with a reason, nonblank evidence reference, exact amount/beneficiary/UTR and valid timestamp. Confirmation atomically updates the financial record, covered enrollments, audit and per-member outbox. The reviewer attests to actual account records outside the website; this is not an invented bank-verification API.

Full manual refund reservations do not transfer funds. Staff make the outgoing transfer outside the website, then record independently checked DEBIT evidence. Completion withdraws all covered confirmed enrollments and retains audit/notification history. No action pretends funds were sent automatically.

## Files, endpoints and migration

- Parser/spec: apps/api/src/payments/upi/famapp-parser.ts and .spec.ts.
- Gmail health/refresh/polling: gmail-reconciliation.service.ts, payments.controller.ts and the authenticated Next.js bridge.
- Team billing: existing payment services/DTOs/rules, enrollment.service.ts and targeted teams.service.ts guards; shared ownership, receipts and notifications.
- UI: existing participant/Master payment components, pricing/policy fields, read-only covered-member views and Gmail health/label controls.
- Configuration/QA: .env.example; check-gmail-reconciliation-config.cjs; start-local-payment-qa.cjs; extended verify-registration-launch.cjs.
- Additive migration: 20261107220000_upi_team_pricing adds cancellation policy, scope snapshots, coverage, billing lock, provider metadata/delivery deduplication and roster triggers.

New Master endpoints include POST /api/master/upi/gmail/:id/health and /labels. Existing order, claim, reconciliation, verification, refund, search/export and Gmail OAuth routes remain. See [NIRAL_CUSTOM_UPI_SYSTEM.md](NIRAL_CUSTOM_UPI_SYSTEM.md) for the full model/endpoint description.

Only the guarded localhost database ending in _test was migrated. Existing container volumes were preserved while restoring local PostgreSQL/Redis/SMTP capture. Main development and production databases were not migrated. Recovery should disable features and preserve additive financial tables, not delete history.

## Production gates

Legal-page follow-up (8 November 2026): `/privacy-policy` and `/terms-of-service` are local review drafts, with no approved effective date. Their production HTTPS URLs still returned 404 during this review. See [NIRAL_LEGAL_PAGES_REVIEW.md](NIRAL_LEGAL_PAGES_REVIEW.md) for current test evidence and the separate approval checklist. Add legal operator/privacy contact, retention/deletion, age/guardian enforcement and accepted legal text to the gates below. Public browsing remains open; real paid completion remains disabled for all users until those gates are resolved. The pages do not establish Google verification or commercial collection permission.

Executed follow-up results: 160 API tests / 14 suites, 63 actual local registration/payment journey checks, 41 authentication browser checks, 52 existing artwork/theme checks (rerun after an initial timing-sensitive reset assertion), 5 registration-model tests and 87 new legal-page checks passed. The legal pages had zero axe A/AA violations across eight page/viewport combinations. Both production builds, both TypeScript checks and scoped lint passed. The corrected CSS build failure and production-mode localhost authentication guard are documented in the legal review; no assertion of live Gmail or production acceptance is made.

1. Finalize fee amount, taxes, issuer and published payment/refund/cancellation policies. The fixed-team model is confirmed; the actual amount remains unspecified.
2. Configure dedicated read-only Google credentials and an authorized mailbox/test user, then validate actual consent, refresh, health and polling.
3. Independently authenticate original sender headers and the receiving-account binding; validate actual original HTML/plain variants and operational exceptions.
4. Provide an authorized commercial collection account and provider permission. A personal @fam wallet is not a hackathon merchant account.
5. Validate actual receiving/outgoing records and finance procedures, including late/rejected payments and billed-roster corrections.
6. Verify production HTTPS API, database/Redis/workers, inbox delivery, monitoring, backups and approved migration/recovery procedures.
7. Obtain explicit organizer deployment/release authorization. Development flags are not a production release mechanism.

The local preview is restored after checks with collection and Gmail polling disabled. Nothing was deployed.

> **Latest assessment — 9 November 2026:** [Phase 6 pre-release audit](NIRAL_PHASE_6_PRE_RELEASE_AUDIT.md) supersedes earlier green totals for release decisions. Backend160 tests, builds, TypeScript, auth41 and artwork52 pass, but current changed-file lint fails (API168 errors/31 warnings; web24/20), legal print fails under Turbopack, and the payment journey fails after48 checks at team checkout. npm audit reports46 affected package entries (6critical/18high). Exact-commit Vercel preview is READY and policies return200 through authorized access, but anonymous access redirects to SSO; backend runtime reports event API unconfigured and authentication URLs point at production. **Production NO-GO.** No merge/deployment, live collection or Gmail polling authorized by this audit.
