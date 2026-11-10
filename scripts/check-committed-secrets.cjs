// Deliberately reports paths/rule names only, never the matching values.
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const files = execFileSync('git', ['ls-files', '-z']).toString().split('\0').filter(Boolean);
const patterns = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['Google OAuth secret', /GOCSPX-[A-Za-z0-9_-]{15,}/],
  ['GitHub token', /(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,})/],
  ['AWS access key', /AKIA[0-9A-Z]{16}/],
  ['OpenAI token', /sk-(?:proj-)?[A-Za-z0-9_-]{30,}/],
];
const findings = [];
for (const file of files) {
  if (/(?:^|\/)\.env(?:$|\.(?!example$))|(?:^|\/)client_secret_.*\.json$|(?:^|\/)credentials.*\.json$/.test(file)) findings.push(`${file}: credential file`);
  if (!fs.existsSync(file)) continue;
  const body = fs.readFileSync(file);
  if (body.includes(0)) continue;
  for (const [name, pattern] of patterns) if (pattern.test(body.toString('utf8'))) findings.push(`${file}: ${name}`);
}
if (findings.length) { console.error(findings.join('\n')); process.exitCode = 1; }
else console.log(`PASS secret-pattern scan of ${files.length} tracked paths (not a full history/entropy scan).`);
