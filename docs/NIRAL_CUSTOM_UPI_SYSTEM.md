# NIRAL Custom UPI System — Implementation and Validation

Updated 8 November 2026. **Production: NO-GO. No public collection or deployment authorized/enabled.**

## Current scope

The existing custom UPI module is retained and extended. Active Razorpay integration remains removed; historical financial/provider/refund records remain preserved. This validation adds the owner-supplied FamApp notification format, safer Gmail refresh/health handling, fixed team pricing, explicit cancellation policies and shared-roster coverage. No private FamApp API, scraping, merchant API or payment gateway is used.

MANUAL_UPI and FAMAPP_SANDBOX remain opt-in development methods. Both are blocked under NODE_ENV=production. Development checkout additionally requires exact participant email allowlisting; FamApp requires its personal-test flag. A personal @fam wallet is not an authorized hackathon collection account. No real transfer, refund, live Gmail grant or authenticated FamApp delivery was exercised.

## Pricing, authorization and enrollment

Master settings support PARTICIPANT pricing and **one fixed fee per locked TEAM**, as confirmed by the owner. Amounts and configured taxes are integer paise; a team fee/tax is charged once, not multiplied by roster size. Master publication requires a verified active ADMIN, approved fee/issuer, explicit confirmation and matching old amount/version. Payment, refund and cancellation URLs must be HTTPS and contain no embedded credentials. This validates configuration; actual policy publication/content still requires organizer review. No real fee, tax, issuer or policy has been invented.

Each enrollment freezes its price, tax, currency, provider, fee scope, policy URLs/version and team-size rules. Changing event settings does not reprice old registrations. Team-priced participants can form/join a team while their own verified enrollment is pending. Participant-priced applicants retain the confirmed-enrollment prerequisite for team membership.

Only the team leader can create a shared order. Every member must be an active verified participant with matching pending enrollment terms; the roster must meet its approved size range. One unique billing team/order and unique enrollment-coverage rows prevent a second allocation. Checkout freezes the roster under a database lock. PostgreSQL triggers prohibit subsequent member/leader/event changes and team deletion while the shared order exists. Roster corrections after billing require finance review; ordinary member actions do not reopen it, including after refunds.

Only the authorized payer can display QR checkout or submit UTRs. Covered members can read the shared status and receipt; unrelated accounts cannot. QR/amount/UPI app links are server-generated after order creation. UTR submission never activates enrollment.

State flow: PENDING -> CLAIM_SUBMITTED -> ALERT_MATCHED -> AWAITING_CREDIT_VERIFICATION -> VERIFIED. ALERT_MATCHED is recorded before awaiting review. NEEDS_REVIEW, REJECTED, EXPIRED, REFUND_PENDING and REFUNDED are also supported. The retained financial ledger uses CAPTURED for an independently verified credit. The UI shows the UPI case state.

Independent receiving-account verification requires an authenticated, active, verified Master, an audit reason, a nonblank statement reference, exact amount/UTR/beneficiary and a valid transaction time. Self-review by the payer or a covered member is rejected. Every covered enrollment must still be eligible. Verification atomically records credit evidence, the financial transaction, all covered enrollment confirmations, reviewer audit and per-member notification outbox records. A manually entered statement is an authorized human attestation, not an official bank API response.

UTRs retain their string representation (including leading zeros). They are encrypted with AES-256-GCM and matched through keyed fingerprints. Normal views expose masked suffixes. Independent evidence, provider transaction references and OAuth refresh tokens are encrypted; raw notification bodies and full personal names are not persisted/logged. Back up UPI_RECONCILIATION_KEY separately. Rotation requires a reviewed re-encryption/re-indexing migration.

## FamApp notification parser

Source: the owner supplied this incoming-credit body structure. The subject is unknown. The displayed sender `no-reply@famapp.in` has **not** been independently authenticated; its appearance is not proof of authenticity and does not automatically populate the allowlist.

```text
Hey [RECIPIENT_NAME],

You have successfully received

₹1.0

from [SENDER_NAME]

Transaction ID : [FAMAPP_TRANSACTION_ID]
Date : 12:31 PM IST, 27 October 2026
Updated Balance : ₹1.0
UTR : [12_DIGIT_UTR]

Best, Fam.
```

Implementation: apps/api/src/payments/upi/famapp-parser.ts. The parser supports text and HTML-table representations of this structure, whitespace/Unicode normalization, rupee/numeric HTML entities and received amounts such as ₹1, ₹1.0 and ₹1.00. Decimal conversion avoids floating-point rounding and stays within the stored integer range. Updated Balance is extracted separately as informational balanceMinor and never used as the credited amount. Sender/recipient display names are masked. Provider transaction ID and UTR are distinct fields; UTR is never coerced into a number.

IST is interpreted as Asia/Kolkata (UTC+05:30). The supplied example becomes 2026-10-27T07:01:00.000Z. Invalid dates/times, missing/invalid UTRs, unknown layouts, debit/failed wording, oversized or ambiguous bodies are rejected. Equivalent HTML/text MIME alternatives create one candidate; conflicting alternatives are quarantined, and attachments are not accepted as the notification body. These are fixtures based on the supplied text structure, not a validation of an actual raw HTML email from Gmail.

The body does not identify the receiving UPI account. A recipient display name is insufficient. Candidate eligibility therefore requires an explicitly permitted mailbox and an independently checked server-side GMAIL_RECONCILIATION_BENEFICIARIES mapping, with GMAIL_RECONCILIATION_BENEFICIARY_VERIFIED=true. Without that mapping, the record is BENEFICIARY_UNVERIFIED and cannot match. The FamApp parser is additionally opt-in via GMAIL_RECONCILIATION_FAMAPP_TEMPLATE_ENABLED; it remains off in the default environment.

Sender checks require an exact configured sender and aligned SPF/DKIM/DMARC pass results from the first Gmail mx.google.com Authentication-Results header. The sender address alone never qualifies. Tests fabricate clearly labelled authentication headers to validate this logic; they do not authenticate the real sender.

Deduplication uses Gmail Message ID per mailbox, a keyed provider transaction fingerprint and UTR. Separate delivery rows retain repeated message identities while compatible repeated FamApp alerts share one credit candidate. Conflicting provider/UTR/amount records enter NEEDS_REVIEW. Matching requires exact expected amount, bound beneficiary, unique UTR, credit direction/success and transaction time within the order window (at most five minutes pre-order clock tolerance). Delayed email delivery does not change the actual credit time. An old credit cannot be assigned to a newly created order outside that window.

**No parser, email import, match, QR action or UTR claim calls the VERIFIED/enrollment-confirmation path.** Synthetic-v1 remains supported for existing regression fixtures. Real receiving-account evidence is still required even when a FamApp candidate matches.

## Gmail configuration and health

Follow the exact [Google Cloud and local setup procedure](NIRAL_GMAIL_SETUP.md). Expected development callback:

`http://localhost:3000/admin/payments`

Use a dedicated Web application OAuth client and gmail.readonly only, separate from sign-in/send-only credentials. Configure the permitted mailbox and label. Initial OAuth and label discovery can run before a label ID is known; health and polling require the configured ID. Label discovery returns only the configured label name.

The server validates one-time actor-bound state, PKCE, narrow grant scope and mailbox identity. Refresh tokens are encrypted and updated with compare-and-update protection. Access tokens are cached only for their usable bounded lifetime, with single-flight refresh and one refresh retry for an early expired access token. Rotated refresh tokens are retained safely. Disconnect/reconnect races cannot restore a revoked grant. Revoked refresh grants, excess scopes or mailbox mismatch require reconnection; transient failures remain retryable without financial changes. Health forces refresh and checks mailbox identity and label readability without importing messages.

Polling is opt-in and lease-protected, reads only explicit mailboxes/one configured label, retains pagination and uses a 30-day lookback. Imported deliveries are durable and deduplicated. A reconciliation sweep repairs interrupted candidate matching. Poll errors retain a sanitized connection error; no payment is confirmed from an error or retry. The local QA bootstrap always forces Gmail/polling off.

Current live blockers: no dedicated client ID/secret, permitted mailbox grant, encryption key, label ID, authenticated sender evidence or verified mailbox-beneficiary binding is configured. The read-only preflight script reports this without printing values. Controlled protocol fixtures cover refresh, expiry retry, identity/label checks, actual database import/dedup and revoked grants; **live Google OAuth/polling remains untested**.

## Master, participant and refund controls

Existing /dashboard/payments checkout/history/detail and /admin/payments controls remain in the NIRAL white/coral theme. Master can publish scope/fee/policies, search exact UTRs, inspect candidates/unmatched/duplicate alerts, perform independent statement review, track refunds and export paged masked payment/audit data. Normal lists are latest 200, participant histories latest 100; totals aggregate all records. Full exports use 500-row pages and omit OAuth tokens, raw UTRs and encrypted evidence. Exports are operational reports; records may change during export.

Custom refunds are full manual refunds only. A reservation does not transfer funds. Staff perform a transfer outside the website, then an authorized non-self reviewer records checked outgoing DEBIT evidence, amount, reference and timestamp. Unique outgoing UTR/evidence and transactional state protect against duplicate recording. Completion withdraws every covered confirmed enrollment, records audit history and notifies each covered participant. Historical gateway partial refunds remain readable.

Authenticated participant routes: POST /payments/orders; GET /payments/me; GET /payments/orders/:id/status; POST /payments/orders/:id/refresh; GET /payments/upi/:id; POST /payments/upi/:id/checkout and /claim; GET /payments/:id/receipt. NestJS routes have /api prefix. The Next.js bridge enforces session authorization and same-origin mutation checks.

Master routes: existing /master/payments, /summary and audited event payment-settings; GET /master/upi; POST /master/upi/search, /export, /:id/verify, /reject, /refunds and /refunds/complete. Gmail routes: GET /master/upi/gmail/status; POST /connect, /complete, /poll, /:id/health, /:id/labels and /:id/disconnect. Financial actions and health/polling are rate limited; only active verified Master access is accepted.

## Additive migration and recovery

20261107220000_upi_team_pricing adds cancellation policy, fee-scope snapshots, shared payment coverage, team billing lock and notification delivery/provider metadata. It preserves existing financial data and defaults old enrollments to participant pricing. PostgreSQL guards freeze billed rosters. Applied only to the existing guarded localhost *_test database; the main and production databases were not migrated.

Recovery means disabling collection/workers and preserving additive financial tables. Do not drop coverage/evidence/delivery records or remove constraints after financial data exists. Production migration requires backup, review and explicit release authorization.

## Verification and readiness

### Legal-page review — 8 November 2026

Public `/privacy-policy` and `/terms-of-service` review drafts now explain the disabled collection and separate Gmail candidate-evidence workflow. See [NIRAL_LEGAL_PAGES_REVIEW.md](NIRAL_LEGAL_PAGES_REVIEW.md) for the processing inventory, Google Branding/domain checks and organizer approval checklist. Neither draft is an approved payment/refund policy or an authorization to enable collection. Legal operator, formal grievance contact, retention, age/guardian safeguards and payment policies remain pending. Real paid completion stays blocked for every applicant, including children and unknown ages; there is no approved standalone age-verification mechanism yet.

See [the launch report](NIRAL_REGISTRATION_PAYMENTS_LAUNCH.md) for final counts and evidence. The baseline was 136 API tests/49 journey checks. The validation suite adds 21 template parser checks and database-backed Gmail/team cases. Financial and Google responses used in those tests are explicitly synthetic; registration, PostgreSQL, SMTP capture, NextAuth and browser interactions are real local integration checks.

Production remains NO-GO until actual fee/tax/policy details, an authorized commercial account/provider permission, a permitted Gmail grant, authenticated original sender evidence, verified beneficiary binding and real independent receiving/outgoing procedures are validated. The owner approved the fixed-team pricing model, not an undisclosed fee amount. No production collection, deployment, credential change or push occurred.
