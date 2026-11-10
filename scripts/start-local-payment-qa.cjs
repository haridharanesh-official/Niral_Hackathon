// Local-only API bootstrap. Never points at the main or production database.
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID, randomBytes } = require('node:crypto');
const root = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.join(root, '.env'), quiet: true });
const url = new URL(process.env.NIRAL_TEST_DATABASE_URL || 'http://invalid');
if (!['localhost', '127.0.0.1'].includes(url.hostname) || !url.pathname.endsWith('_test'))
  throw Error('Dedicated local *_test database required.');
if (process.env.SMTP_HOST !== 'localhost' || process.env.SMTP_PORT !== '1025')
  throw Error('Local SMTP capture required.');
const synthetic = process.argv.includes('--synthetic-upi');
Object.assign(process.env, {
  DATABASE_URL: url.toString(),
  EMAIL_PROVIDER: 'smtp',
  MAIL_QUEUE_ENABLED: 'false',
  SMTP_USER: '',
  SMTP_PASS: '',
  API_PORT: '4100',
  NODE_ENV: 'development',
  WEB_URL: 'http://localhost:3000',
  MANUAL_UPI_ENABLED: 'false',
  FAMAPP_SANDBOX_ENABLED: 'false',
  FAMAPP_PERSONAL_TEST_AUTHORIZED: 'false',
  UPI_SYNTHETIC_MODE: 'false',
  UPI_TEST_PARTICIPANT_EMAILS: '',
  GMAIL_RECONCILIATION_ENABLED: 'false',
  UPI_RECONCILIATION_WORKER_ENABLED: 'false',
  PAYMENT_WORKER_ENABLED: 'false',
});
if (synthetic) {
  const filename = path.join(root, 'tmp', 'upi-local-qa.json');
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  if (!fs.existsSync(filename))
    fs.writeFileSync(
      filename,
      JSON.stringify({ runId: randomUUID(), key: randomBytes(32).toString('base64') }),
    );
  const qa = JSON.parse(fs.readFileSync(filename, 'utf8'));
  if (!/^[a-f0-9-]{36}$/.test(qa.runId) || Buffer.from(qa.key, 'base64').length !== 32)
    throw Error('Invalid synthetic QA configuration.');
  Object.assign(process.env, {
    UPI_SYNTHETIC_MODE: 'true',
    FAMAPP_SANDBOX_ENABLED: 'true',
    FAMAPP_PERSONAL_TEST_AUTHORIZED: 'true',
    FAMAPP_TEST_UPI_ID: 'synthetic-test-only@fam',
    UPI_RECONCILIATION_KEY: qa.key,
    UPI_TEST_PARTICIPANT_EMAILS: `launch-qa-${qa.runId}-a@example.test,launch-qa-${qa.runId}-c@example.test`,
  });
}
console.log(
  `Isolated local QA API. Custom UPI: ${synthetic ? 'synthetic fixture account only' : 'disabled'}. Gmail polling: disabled.`,
);
require(path.join(root, 'apps/api/dist/src/main.js'));
