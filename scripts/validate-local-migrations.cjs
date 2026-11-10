const path = require('node:path');
const { spawnSync } = require('node:child_process');
require('dotenv').config({ quiet: true });
const database = new URL(process.env.NIRAL_TEST_DATABASE_URL || 'http://invalid');
if (
  !['localhost', '127.0.0.1'].includes(database.hostname) ||
  !database.pathname.endsWith('_test')
)
  throw Error(
    'Dedicated localhost *_test database required; production migrations prohibited.',
  );
const prisma = path.join(
  path.dirname(require.resolve('prisma/package.json')),
  'build/index.js',
);
const env = { ...process.env, DATABASE_URL: database.toString() };
for (const args of [
  ['migrate', 'deploy', '--schema', 'apps/api/prisma/schema.prisma'],
  [
    'migrate',
    'diff',
    '--from-schema-datasource',
    'apps/api/prisma/schema.prisma',
    '--to-schema-datamodel',
    'apps/api/prisma/schema.prisma',
    '--exit-code',
  ],
]) {
  const result = spawnSync(process.execPath, [prisma, ...args], {
    env,
    stdio: 'inherit',
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
