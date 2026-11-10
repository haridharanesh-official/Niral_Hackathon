# NIRAL public legal pages — organizer review

Audit follow-up: 9 November 2026; legal text last updated 8 November. Document version: 0.1, review draft. Effective date: **not approved**. [Phase 6](NIRAL_PHASE_6_PRE_RELEASE_AUDIT.md) records the current preview evidence and failed Turbopack print check; earlier successful browser results below are historical.

## Implemented routes and presentation

- `/privacy-policy`: information inventory, purposes, authentication, Google API Data Access and Limited Use, payment evidence, sharing, retention, security, browser storage, children, requests and contact.
- `/terms-of-service`: organizer, eligibility, account declarations, teams, conduct, submissions/IP, judging/prizes, fees, verification, refunds, schedule, availability, content, suspension, disputes and updates.
- Both use the existing white/coral public shell, typography and navigation. Shared server-rendered content, native collapsible/sticky contents, section anchors, keyboard focus, reduced-motion behavior, reading column and print layout. No new dependency.
- Linked from public footer, homepage and authentication footer. Registration links to the privacy draft and terms without recording acceptance of unapproved terms or changing historical consent versions. Existing checkboxes remain unchecked.
- Canonical URL fallback, robots sitemap URL and sitemap now use the supplied production domain. Legal routes are outside the authentication proxy matcher and allowed by robots. Deployment-specific environment overrides still require verification.

## Functionality inspected / data-processing inventory

| Area / evidence                                            | Actual handling                                                                                                                                                                                | Retention / deletion limitation                                                                                                                         |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.ts`, auth DTOs/services, Prisma User/Profile/Session | Credentials-only active Auth.js provider; 30-minute JWT session, backend checks; names, email, password hash, verification, roles, academic/contact details, optional profile fields and links | Token expiry is not deletion; no approved account/auth retention or complete self-service erasure                                                       |
| V3 registration/model, RegistrationConsent                 | Required identity/academic fields, optional student ID/interests/GitHub, versioned declarations; session-storage draft excludes passwords, tokens and consent                                  | Browser draft can be cleared; server retention and withdrawal procedure pending                                                                         |
| Team, submission and judging modules/schema                | Membership/invitations, project collaboration/files/versions, assigned judging records and scores                                                                                              | Submission/IP permissions, showcasing, results publicity and retention need approval                                                                    |
| Payment/enrollment/UPI modules                             | Exact amounts, team coverage/locked roster, unique UTR, independent manual credit evidence, non-self review, full manual refund evidence and audit                                             | Financial history intentionally preserved; no blanket deletion or approved financial retention                                                          |
| Gmail reconciliation/parser/config                         | Separate `gmail.readonly` flow; allowlisted authorized mailbox + configured label; bounded polling; headers/text/HTML processed transiently; candidate notifications only                      | No stored raw body in module; parsed metadata/hash/masked/encrypted references retained without approved schedule; 30-day query window is not retention |
| ReconciliationMailbox / OAuth state                        | Encrypted refresh token; server-memory access token, expiry/rotation/invalid-grant handling; one-use actor-bound PKCE state                                                                    | Disconnect clears local refresh token, not existing metadata or Google grant; expired state cleanup schedule not established                            |
| Mail queue / Gmail sender                                  | Encrypted queued content; optional separate send-only Gmail adapter (`gmail.send`)                                                                                                             | Completed/failed jobs configured age 3,600 seconds + count 100, operational cleanup not delivered-email/backup retention                                |
| Public analytics helper                                    | In-memory `dataLayer`, development console                                                                                                                                                     | No remote transport in helper; future host tags not audited                                                                                             |
| Dashboard analytics helper                                 | Local storage up to 200 events unless preference `denied`                                                                                                                                      | No remote transport in helper; clear site storage to remove; do not describe as opt-in tracking                                                         |
| Submission draft/content sync                              | Local-storage draft and synchronization metadata                                                                                                                                               | Browser clearing available; no server retention inference                                                                                               |
| Infrastructure and audit                                   | PostgreSQL, Redis/BullMQ, SMTP and role/audit workflows                                                                                                                                        | Production providers, locations, processor agreements, backup lifecycle and incident procedures unconfirmed                                             |

Google Sign-In is **disabled**, not an existing profile-data grant. Do not reuse schema Account fields or a downloaded client JSON as evidence of a working OAuth integration. The finance mailbox grant is separate. No live mailbox permission, production sender authentication, commercial receiving account or bank integration has been established. Gmail data has no advertising, unrelated analytics or model-training destination in the reviewed path; this is scoped code evidence, not an organization-wide certification.

## Under-18 enrollment and future consent mechanism

Public pages remain accessible without age-gating. No minimum age or guardian policy is approved, and college attendance is not age assurance. Real paid completion is blocked for **all** applicants, including children and unknown ages: `UpiConfig.status().productionCollection` is hard false; production `ensure` rejects both custom providers even with all synthetic flags enabled. Independent-credit finalization also calls `ensure`; administrators cannot simply confirm a PAID enrollment through the ordinary status path. Existing regression tests cover these boundaries.

Only explicit local synthetic fixture accounts can exercise payment tests; those tests are not an age-permitted real enrollment. No DOB, guardian identity document or cosmetic adult checkbox was added without an approved purpose. Before enabling real collection, introduce a reviewed server-side eligibility policy: a versioned eligibility decision for **every** covered team member, unknown/unapproved minors fail closed, verified guardian permission where required, withdrawal/audit handling, and rechecks at order creation and final credit confirmation. Keep this separate from the existing student/rules declaration. A frontend-only checkbox or Master-panel switch is insufficient. Standalone age verification remains **not implemented**, and collection must stay disabled until this work and approval are complete.

## Organizer approval checklist (separate from public commitments)

- [ ] **Legal operator identity — PENDING ORGANIZER / INSTITUTIONAL APPROVAL.** IoT Club at SIET, Coimbatore, Tamil Nadu, India is the supplied public organizer identity; SIET has not authorized identification as the responsible legal data fiduciary or contracting entity. Confirm full legal name, address and accountable representative.
- [ ] **Formal privacy/grievance contact — PENDING ORGANIZER APPROVAL.** `iotclub.siet@gmail.com` is the existing general event inbox only. Confirm formal authority, officer if required, identity verification, request routing, escalation and applicable response periods.
- [ ] **Retention — PENDING ORGANIZER / LEGAL APPROVAL.** Set periods and deletion/exception procedures for registration, authentication, OAuth state/tokens, Gmail reconciliation metadata, payment/refund records, audits, event submissions, queues and backups. Do not invent 30/90/365-day periods.
- [ ] **Minimum age / guardian consent — PENDING ORGANIZER / LEGAL APPROVAL.** Resolve eligible categories, age assurance, verifiable permission and guardian rights where required. No presumption that every student is 18; no automatic educational exemption.
- [ ] **Refund / cancellation — PENDING ORGANIZER APPROVAL.** Approve eligibility, deadlines, fees/taxes, cancellation/postponement remedies, handling of roster disputes and refund completion notices.
- [ ] **Collection account — PENDING AUTHORIZED COMMERCIAL-USE ACCOUNT.** Confirm ownership, beneficiary, merchant/commercial permission, fee/tax/receipt issuer and independent credit source. Personal FamApp is not an approved launch option.
- [ ] Final event rules: broader provisional public eligibility vs student-only flow, AI tools, submission requirements/deadlines, misconduct notice/review/appeals, final judging rubric/conflicts, prize and certificate conditions.
- [ ] IP/evaluation/showcasing permission, no unapproved assignment or unlimited promotional license; legal review of availability, suspension, law/jurisdiction and disputes. No invented liability cap or compulsory arbitration.
- [ ] Production processor/location/transfer inventory, access review, security/incident procedures, Google data policies and any required verification/security assessment.
- [ ] Approve actual legal text, effective date, versions and acceptance/change-notice mechanism. New drafts do not retroactively change prior consent records.

## Indian privacy-law review (8 November 2026)

The [official commencement notification G.S.R. 843(E)](https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf) stages commencement: specified institutional provisions immediately, section 6(9) and section 27(1)(d) after one year, and core processing/rights/children provisions after eighteen months from Gazette publication. The [final Rules G.S.R. 846(E), rule 1](https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf) similarly stages rules; rule 4 after one year, rules 3, 5–16, 22–23 after eighteen months. Notifications are dated 13 November 2025 and bear 14 November electronic Gazette publication identifiers. As of this review date, neither later interval has elapsed; core duties are due in May 2027. Counsel must confirm operative publication dates and any amendments before launch. Do not represent every DPDP right/duty as already fully in force.

The [DPDP Act](https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf) defines children as under 18. Section 9 and final rule 10 address parental consent; applicability, educational exceptions and other current law need professional review. Phased commencement does not establish a safe-to-launch exemption. No claim of legal compliance is made by these pages.

## Google OAuth Branding and domain checklist

Prepared values (do **not** enter until approved pages are actually public):

| Field            | URL                                               | Current evidence                                          |
| ---------------- | ------------------------------------------------- | --------------------------------------------------------- |
| Homepage         | https://niralhackathon.dpdns.org                  | Existing identity; new footer links verified locally only |
| Privacy Policy   | https://niralhackathon.dpdns.org/privacy-policy   | Read-only HTTPS request on 8 Nov: **404**, not deployed   |
| Terms of Service | https://niralhackathon.dpdns.org/terms-of-service | Read-only HTTPS request on 8 Nov: **404**, not deployed   |

The [official Google brand-verification guide](https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification) requires public app identity and privacy disclosures, homepage policy links, and ownership verification of associated top-private domains by an account associated with the Cloud project. Branding approval is separate from Gmail restricted-scope approval. The [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy) requires accurate access/use/storage/sharing disclosures and Limited Use restrictions. Review operations and all providers before publishing an unconditional compliance assertion.

The [official Public Suffix List](https://publicsuffix.org/list/public_suffix_list.dat) includes `dpdns.org` in its private section. Therefore the inferred top-private-domain target is **niralhackathon.dpdns.org**, rather than the shared provider’s `dpdns.org`. This is an inference from Google guidance + PSL, not proof that Google has accepted this domain. A free subdomain is not automatically disqualified. Actual DNS/TXT control, Search Console property ownership and Google acceptance were **not verified**.

1. Authorized owner confirms control of the hostname/DNS and creates the appropriate Search Console property. Prefer DNS TXT verification at `niralhackathon.dpdns.org` if the DNS provider permits it. Use Google’s exact supplied value; none was generated here. Review [Search Console verification options](https://support.google.com/webmasters/answer/9008080).
2. Verify through the Google account associated as project Owner/Editor. A URL-prefix verification method, if used, must satisfy Google’s accepted ownership evidence; a browser screenshot is insufficient. If DNS/provider access prevents verification or Google rejects the domain, use an organizer-controlled registrable domain and revise canonical/redirect URLs consistently.
3. After separately authorized deployment, fetch homepage and both policies anonymously over HTTPS: require HTTP 200, no auth/interstitial/robots block, correct title/canonical, visible homepage links and exact approved policy text. The current production 404s are a launch blocker.
4. Only then configure approved Branding URLs, support/developer contacts and authorized domain; do not publish branding or apply for production approval based on this local draft.
5. Finance read-only client stays separate from participant authentication. Local callback remains `http://localhost:3000/admin/payments`; future production callback must be explicitly registered after deployment/security review. Follow `docs/NIRAL_GMAIL_SETUP.md`; missing credential/grant/label/beneficiary/authentication and independent-credit blockers remain.

## Validation results

Results executed for this change (8 November 2026):

| Check                                             | Actual result / evidence                                                                                                                                                                                                                            |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API regression                                    | **160 passed, 14 suites, zero failed/skipped**; `tmp/legal-pages-api.json`, includes auth, registration, payment/Gmail fixtures, permissions, duplicate/mismatched/replayed transaction evidence and refund audit cases                             |
| New legal-page browser suite                      | **87 passed** against local production build; `output/playwright/legal-pages/results.json`                                                                                                                                                          |
| Accessibility                                     | Both routes at 320 / 390 / 768 / 1440 pixels: **zero axe WCAG 2 A/AA and 2.1 A/AA violations**; eight per-route/viewport JSON files. Automated checks do not certify full accessibility                                                             |
| Keyboard / responsive / print                     | Verified contents toggling by keyboard, anchor targets, no overflow, public navigation/footer links at mobile widths, desktop navigation hidden in print while title stays visible; screenshot/PDF artifacts under `output/playwright/legal-pages/` |
| Public route/link checks                          | Anonymous local HTTP 200, no sign-in redirects, all linked local public routes resolve, official canonical URLs, sitemap entries and no policy robots disallow                                                                                      |
| Scoped lint                                       | **11 source files; zero errors/warnings**; `tmp/legal-pages-lint.json`                                                                                                                                                                              |
| TypeScript                                        | API and web `tsc --noEmit` passed; web production-build TypeScript also passed                                                                                                                                                                      |
| Production builds                                 | Nest build passed; Next webpack build passed with **56 static pages**, including both policies                                                                                                                                                      |
| Registration model tests                          | **5 passed**; `node scripts/test-auth-v3.cjs`                                                                                                                                                                                                       |
| Authentication / registration browser             | **41 passed**, no runtime errors; `tmp/auth-v3-qa/results.json`                                                                                                                                                                                     |
| Actual local registration/payment/session journey | **63 passed**, no browser errors; `tmp/launch-http-qa/results.json`; real HTTP/PostgreSQL/local SMTP/Auth.js, synthetic financial evidence only                                                                                                     |
| Existing innovation artwork/theme browser suite   | **52 passed** on rerun, no runtime/hydration or unexpected console errors; `tmp/core-v4-qa/results.json`. Expected anonymous content-endpoint 401 messages are retained in the evidence                                                             |

The initial production build failed on an impure CSS-module global selector accepted by the dev server. Corrected to scoped `:has()` selectors; the successful build and final production-browser run include the correction. An OS resource interruption ended an earlier browser process without a final result; it was rerun successfully. An attempted authenticated HTTP journey against the production build stopped at sign-in because `apiOrigin()` intentionally rejects HTTP localhost in production; this is an environment guard, not an authorization to weaken that rule. Authenticated integration runs use the development preview and isolated test API. No production deployment, Cloud Console changes, mailbox reads or real payment transfers were performed.

The first existing artwork-suite run failed its strict reset-equals-paused-starting-angle assertion. The suite was rerun after startup and passed all 52 checks without changing artwork or its test. The assertion can be sensitive to ambient rotation before the initial pause; timing is the suspected cause, not a conclusively established root cause. Do not omit this first-run failure or describe it as a fixed artwork bug.

After journey tests the API preview is restored without `--synthetic-upi`: real and synthetic checkout, Gmail polling and reconciliation/payment workers disabled. Only localhost test database/container services were used; production and main development data were not migrated or erased.

### Changed files for this task

- `apps/web/src/app/privacy-policy/page.tsx`
- `apps/web/src/app/terms-of-service/page.tsx`
- `apps/web/src/components/niral/legal-content.ts`
- `apps/web/src/components/niral/legal-page.tsx`
- `apps/web/src/components/niral/legal.module.css`
- `apps/web/src/components/niral/public-page-shell.tsx`
- `apps/web/src/components/niral/niral-home.tsx`
- `apps/web/src/components/niral-auth/auth-layout.tsx`
- `apps/web/src/components/auth/register/v3-registration.tsx`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/robots.ts`
- `apps/web/src/app/sitemap.ts`
- `scripts/check-legal-pages.cjs`
- `.gitignore` (generated local Playwright artifacts only)
- `docs/NIRAL_LEGAL_PAGES_REVIEW.md`
- `docs/NIRAL_CUSTOM_UPI_SYSTEM.md`
- `docs/NIRAL_REGISTRATION_PAYMENTS_LAUNCH.md`

No API implementation, schema, financial history, credential or collection flags were changed for these pages. Existing unrelated staged/unstaged work was preserved.

## Production assessment

**NO-GO.** The two legal pages are local review drafts, not approved operative policies. Production 404s, operator/grievance designation, age/guardian policy and enforcement, retention/deletion, processor review, payment/refund approvals, commercial account, Google ownership/scope verification and independent credit operations remain blockers. Real collections and Gmail polling stay disabled.

> **9 November 2026 follow-up:** See [Phase 6 pre-release audit](NIRAL_PHASE_6_PRE_RELEASE_AUDIT.md). The new exact-commit Vercel preview serves both policy drafts with authorized HTTP200, homepage links and noindex; anonymous requests hit Vercel SSO, so public Google Branding readiness is not established. The current Turbopack browser run fails because the printed legal title is hidden by CSS specificity; the earlier87-check webpack result is historical. Sponsor collateral proposes participant-email sharing that requires separate privacy/publication approval. Operator, grievance, retention, under-18, commercial collection and final policy approvals remain pending. No legal text was approved or deployment protection disabled.
