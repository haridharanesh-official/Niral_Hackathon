# Gmail Read-only Reconciliation Setup and Validation

Reviewed 8 November 2026. This procedure configures the existing integration; it does not enable public collection. No real Google OAuth client or permitted mailbox grant has been configured or tested in this workspace. The root environment is missing the dedicated client ID, client secret, redirect, mailbox allowlist, label and reconciliation encryption key. Do not reuse sign-in or send-only Gmail credentials.

## Exact Google Cloud Console setup

1. Sign in to [Google Cloud Console](https://console.cloud.google.com/) as the account authorized to administer the integration. Create/select a dedicated NIRAL reconciliation project.
2. Open **APIs & Services > Library**, find **Gmail API**, and enable it for that project.
3. Open **Google Auth platform > Branding**. Enter the application name, support email and developer contact. Use real organizer-approved information; do not invent legal/policy URLs.
4. Under **Audience**, use Internal only if the permitted mailbox belongs to the applicable Google Workspace organization. Otherwise select External and keep the app in **Testing**. Add the exact permitted test mailbox under Test users. Testing is not approval for public commercial use.
5. Under **Data Access**, add only `https://www.googleapis.com/auth/gmail.readonly`. Do not request gmail.modify, gmail.send, full mail access, or mailbox passwords. A dedicated client avoids a previously combined broader grant being returned.
6. Under **Clients**, create an OAuth client of type **Web application**. Set the exact authorized redirect URI to:

   `http://localhost:3000/admin/payments`

   Match scheme, host, port, path and trailing-slash behavior exactly. Do not substitute the API URL/port 4100, `/api/auth/callback/google`, localhost with 127.0.0.1, or an arbitrary OAuth playground callback. JavaScript origins are not needed for this server-side code exchange; no Google browser SDK or API key is used.
7. Store the dedicated client ID and secret in the backend's local secret environment. Never commit downloaded credential JSON, paste secrets into chat, or expose them through NEXT_PUBLIC variables. Keep the OAuth app in Testing for controlled validation.
8. In the permitted Gmail account, create a label named **NIRAL Payment Alerts**. Add a controlled filter or manually label only authorized test alerts. A sender filter is organization, not authentication. The application reads only the configured label, but Google's read-only grant itself covers mailbox reading; use a dedicated mailbox where possible.

Google documents the current [Auth platform setup](https://developers.google.com/workspace/gmail/api/quickstart/nodejs) and [server-side authorization](https://developers.google.com/workspace/gmail/api/auth/web-server). `gmail.readonly` is a restricted scope; external distribution can require verification and applicable security review. See [Gmail scopes](https://developers.google.com/workspace/gmail/api/auth/scopes). External apps in Testing generally receive refresh tokens that expire after seven days for these scopes, so reconnecting during testing is expected. See [OAuth token expiration](https://developers.google.com/identity/protocols/oauth2).

## Local backend configuration

Configure these values in secret storage/local `.env`; placeholders below are deliberately not credentials:

```dotenv
GMAIL_RECONCILIATION_ENABLED=false
GMAIL_RECONCILIATION_CLIENT_ID=<dedicated-web-client-id>
GMAIL_RECONCILIATION_CLIENT_SECRET=<dedicated-client-secret>
GMAIL_RECONCILIATION_REDIRECT_URI=http://localhost:3000/admin/payments
GMAIL_RECONCILIATION_ALLOWED_MAILBOXES=<explicit-authorized-mailbox>
GMAIL_RECONCILIATION_LABEL_NAME=NIRAL Payment Alerts
GMAIL_RECONCILIATION_LABEL_ID=
GMAIL_RECONCILIATION_ALLOWED_SENDERS=
UPI_RECONCILIATION_KEY=<separately-generated-base64-32-byte-key>
UPI_RECONCILIATION_WORKER_ENABLED=false
GMAIL_RECONCILIATION_FAMAPP_TEMPLATE_ENABLED=false
GMAIL_RECONCILIATION_BENEFICIARIES={}
GMAIL_RECONCILIATION_BENEFICIARY_VERIFIED=false
```

Generate and securely back up a dedicated encryption key locally. Changing it requires re-encryption/re-indexing of existing tokens and transaction fingerprints. Do not replace a key associated with retained financial records. No key is generated into the production configuration by this procedure.

Run `node scripts/check-gmail-reconciliation-config.cjs` from `D:\Hackathon`. It prints configured/missing checks without credential or mailbox values. Exit code 2 means configuration is incomplete, not a passing live integration check.

After the owner has explicitly authorized the mailbox and consent setup, enable only GMAIL_RECONCILIATION_ENABLED in a controlled local environment and restart the backend. Keep the polling worker disabled. Sign in as an active, verified Master and open `/admin/payments`:

1. Click **Connect read-only Gmail**, authorize the dedicated permitted account, and return to the exact redirect. The server validates a one-time actor-bound state, PKCE, narrow scope and mailbox identity, then encrypts the refresh token. Callback parameters are removed from the browser URL.
2. Click **Find configured label ID**. Only the configured label name is returned; other label names are not exposed. Set the returned ID in GMAIL_RECONCILIATION_LABEL_ID and restart the backend. OAuth/label discovery does not require a label ID beforehand.
3. Click **Check Gmail connection**. This forces token refresh, checks the receiving mailbox identity and validates that the configured label is readable. It imports no messages and confirms no payment.
4. Independently inspect Gmail's original message/authentication details for an authorized test alert. Check aligned SPF, DKIM and DMARC results added by Gmail. The displayed `no-reply@famapp.in` address supplied by the owner is not independently authenticated. Leave the sender allowlist empty until the actual sender is verified.
5. Establish and independently check the mailbox-to-receiving-UPI binding. The body provides a recipient display name, not a UPI ID. Configure GMAIL_RECONCILIATION_BENEFICIARIES as a JSON mapping of lower-case permitted mailbox email to its authorized test @fam destination. Only then set GMAIL_RECONCILIATION_BENEFICIARY_VERIFIED=true and opt into the FamApp template flag.
6. Label one redacted/synthetic or expressly authorized personal-test message and click **Read permitted alerts**. Review the candidate queue and repeat the read to verify deduplication. No payment becomes VERIFIED from this action. Record only masked provider/message references in test reports.
7. Test invalid/revoked access, delayed messages, duplicate deliveries, changed amounts, wrong beneficiary mappings, and unsupported templates. Only after these pass should background polling be considered for the authorized development mailbox. Public payment collection remains disabled regardless.

The test-only bootstrap `scripts/start-local-payment-qa.cjs` intentionally forces Gmail and polling off. Use a separately reviewed local backend process for a deliberate live OAuth test; do not weaken the QA bootstrap safeguards.

## Refresh, health and failure behavior

Access tokens are held only in bounded-lifetime process memory. Refresh tokens remain AES-GCM encrypted. The service validates mailbox identity on refresh, supports rotated refresh tokens using compare-and-update storage, retries an expired access token once, rejects excess scopes, and invalidates cached tokens on disconnect/failure. Refresh changes cannot overwrite a disconnected or replaced grant. A revoked grant or identity mismatch disables the connection and requires fresh consent; transient network/rate/API failures remain retryable without payment changes.

Polling uses a mailbox lease, persistent page cursor, Gmail-message/delivery deduplication and a 30-day lookback. Credit matching and email delivery are separate from settlement. An alert alone never activates enrollment.

## What is actually validated

The supplied FamApp body structure is tested with synthetic names, UTRs and transaction IDs in plain text, HTML tables and equivalent MIME alternatives. Controlled Google API protocol fixtures exercise token refresh/rotation, mailbox identity, configured label discovery, polling, repeat reads, candidate matching and revoked grants against isolated PostgreSQL. These are not live Google OAuth validation, authenticated FamApp emails, actual bank credits or wallet transfers. Live consent, sender authentication and receiving-account verification remain outstanding until authorized credentials and actual records are supplied.
