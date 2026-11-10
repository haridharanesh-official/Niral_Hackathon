const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const base = process.argv[2] || 'origin/main';
const files = [...new Set([
  ...execFileSync('git', ['diff', '--name-only', `${base}...HEAD`, '-z']).toString().split('\0'),
  ...execFileSync('git', ['diff', '--name-only', 'HEAD', '-z']).toString().split('\0'),
  ...execFileSync('git', ['ls-files', '--others', '--exclude-standard', '-z']).toString().split('\0'),
])].filter(p => /\.(ts|tsx)$/.test(p) && fs.existsSync(p));
fs.mkdirSync('tmp', { recursive: true });
for (const area of ['api', 'web']) {
  const root = path.resolve('apps', area), prefix = `apps/${area}/`;
  const scoped = files.filter(p => p.startsWith(prefix)).map(p => p.slice(prefix.length));
  if (!scoped.length) continue;
  const eslint = path.join(path.dirname(require.resolve('eslint/package.json', { paths: [root] })), 'bin/eslint.js');
  const output = path.resolve(`tmp/changed-${area}-lint.json`);
  const result = spawnSync(process.execPath, [eslint, ...scoped, '--format', 'json', '--output-file', output], { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) process.exitCode = 1;
  const report = JSON.parse(fs.readFileSync(output));
  console.log(`${area}: ${scoped.length} files, ${report.reduce((n,x) => n+x.errorCount,0)} errors, ${report.reduce((n,x) => n+x.warningCount,0)} warnings`);
}
