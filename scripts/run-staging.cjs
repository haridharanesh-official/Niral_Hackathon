const fs = require('node:fs'),
  path = require('node:path'),
  { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..'),
  envFile = path.join(root, 'tmp/staging/local.env');
if (!fs.existsSync(envFile)) throw Error('Run node scripts/init-staging.cjs first');
const env = { ...process.env, ...require('dotenv').parse(fs.readFileSync(envFile)) };
const u = new URL(env.DATABASE_URL);
if (
  u.hostname !== 'localhost' ||
  u.port !== '55432' ||
  u.pathname !== '/niral_staging_test'
)
  throw Error('Local staging database only');
Object.assign(env, {
  NIRAL_QA_ENV_FILE: envFile,
  SMTP_USER: '',
  SMTP_PASS: '',
  GMAIL_RECONCILIATION_ENABLED: 'false',
  UPI_RECONCILIATION_WORKER_ENABLED: 'false',
  PAYMENT_WORKER_ENABLED: 'false',
  NODE_OPTIONS: '--max-old-space-size=1536',
});
const command = process.argv[2];
const jobs = {
  api: [
    [
      'scripts/start-local-payment-qa.cjs',
      ...(process.argv.includes('--synthetic-upi') ? ['--synthetic-upi'] : []),
    ],
    root,
  ],
  web: [[require.resolve('next/dist/bin/next'), 'dev'], path.join(root, 'apps/web')],
  'api-tests': [
    [
      require.resolve('jest/bin/jest'),
      '--runInBand',
      '--testTimeout=30000',
      '--json',
      '--outputFile=../../tmp/phase8-api-tests.json',
    ],
    path.join(root, 'apps/api'),
  ],
  payment: [['scripts/verify-registration-launch.cjs'], root],
  migrate: [['scripts/validate-local-migrations.cjs'], root],
};
if (!jobs[command])
  throw Error('Use api [--synthetic-upi], web, api-tests, payment or migrate');
console.log('LOCAL isolated staging: Gmail/background polling off; SMTP capture only.');
const [args, cwd] = jobs[command],
  child = spawn(process.execPath, args, { cwd, env, stdio: 'inherit' });
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
