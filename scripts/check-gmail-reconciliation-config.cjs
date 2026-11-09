// Read-only configuration preflight. Never prints credential or mailbox values.
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
const required = [
  'GMAIL_RECONCILIATION_CLIENT_ID',
  'GMAIL_RECONCILIATION_CLIENT_SECRET',
  'GMAIL_RECONCILIATION_REDIRECT_URI',
  'GMAIL_RECONCILIATION_ALLOWED_MAILBOXES',
  'UPI_RECONCILIATION_KEY',
];
const missing = required.filter((key) => !process.env[key]?.trim());
let validKey = false,
  validRedirect = false;
try {
  validKey =
    Buffer.from(process.env.UPI_RECONCILIATION_KEY ?? '', 'base64').length === 32;
} catch {}
try {
  const url = new URL(process.env.GMAIL_RECONCILIATION_REDIRECT_URI);
  validRedirect =
    (url.protocol === 'https:' ||
      (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) &&
    url.pathname === '/admin/payments' &&
    !url.search &&
    !url.hash &&
    !url.username &&
    !url.password;
} catch {}
const pollingMissing = [
  'GMAIL_RECONCILIATION_LABEL_ID',
  'GMAIL_RECONCILIATION_ALLOWED_SENDERS',
].filter((key) => !process.env[key]?.trim());
const result = {
  readyForOAuth: missing.length === 0 && validKey && validRedirect,
  missing,
  validEncryptionKey: validKey,
  validRedirect,
  pollingMissing,
  gmailEnabled: process.env.GMAIL_RECONCILIATION_ENABLED === 'true',
  workerEnabled: process.env.UPI_RECONCILIATION_WORKER_ENABLED === 'true',
  famappTemplateEnabled:
    process.env.GMAIL_RECONCILIATION_FAMAPP_TEMPLATE_ENABLED === 'true',
  beneficiaryMappingVerified:
    process.env.GMAIL_RECONCILIATION_BENEFICIARY_VERIFIED === 'true',
  expectedDevelopmentRedirect: 'http://localhost:3000/admin/payments',
  publicCollectionEnabled: false,
};
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.readyForOAuth ? 0 : 2;
