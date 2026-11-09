# NIRAL UPI Email Reconciliation — Offline Proof of Concept

This package demonstrates parsing a **synthetic** Gmail-like credit alert and comparing a participant's claimed UTR and amount with a simulated independently confirmed receiving-account credit record.

**No real payments, Gmail access, FamApp access, credentials, production enrollment writes, or automatic confirmation are included.** Do not use as a production payment verifier.

## Windows setup

Requires Node.js 20 or later, no npm install.

In PowerShell:

```powershell
cd path\to\niral-upi-reconciliation-prototype
node .\test.mjs
node .\demo.mjs
```

Expected outcome:

- Email-only match: `ALERT_MATCHED_PENDING_CREDIT`
- With a *synthetic independent account credit* record: `SIMULATED_VERIFIED`
- Reused UTR: `REJECTED_DUPLICATE`

## Synthetic example format

```
Amount: ₹1.00
UTR: 123456789012
Payee: demo@fam
Status: Credited
```

`demo@fam` and `alerts@example.test` are fictitious placeholders.

## What to inspect in the real private email (do not copy unredacted data into code)

- Gmail message ID; timestamp; sender address and sender authentication (SPF/DKIM/DMARC)
- Subject, direction (`credited` versus `debited`), amount and currency
- UTR/UPI transaction reference, recipient/payee, transaction date/time and status
- Whether the email actually includes the full UTR (often not guaranteed)
- Check *receiving account* transaction history separately

Email sender, headers, a screenshot and the participant-provided UTR are **not authoritative proof of money received**. Production verification requires a supported bank/issuer credit record or an authorized settlement API. Do not implement Gmail confirmation as direct registration activation.

## Integrating later into the NIRAL NestJS/Prisma app

1. Add PaymentOrder, PaymentClaim, PaymentAlertCandidate, AccountCreditRecord and PaymentAudit models.
2. Order amount and receiving UPI should be server-sourced, never set by a participant request.
3. Configure Gmail OAuth read-only and a scoped mailbox; persist Gmail message IDs for idempotency, store minimal redacted data, use encryption and short retention.
4. Implement a parser for actual **redacted** email format; fail closed when any key field is missing.
5. Match by UTR + exact integer-paise amount + beneficiary + credit direction + time window; unique index on confirmed UTR + beneficiary; manual review for conflicts.
6. Verify from a receiving-account record independently, respecting FamApp's personal-use terms and written authorization for event collections.
7. Keep real enrollment CONFIRMED only after authoritative verification or authorized admin review with audit trail.

This is an education/development tool, not a regulated payment gateway.
