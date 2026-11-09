const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const filename = path.resolve(
  __dirname,
  '../apps/web/src/components/auth/register/v3-model.ts',
);
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const model = new Module(filename, module);
model.filename = filename;
model.paths = Module._nodeModulePaths(path.dirname(filename));
model._compile(compiled, filename);
const {
  blankRegistration: blank,
  validateStep,
  guardedStep,
  registrationDraft,
  restoreRegistration,
  degrees,
  years,
} = model.exports;
const valid = {
  ...blank,
  firstName: 'Arjun',
  displayName: 'Arjun',
  lastName: 'Kumar',
  email: 'arjun@example.com',
  mobile: '+91 98765 43210',
  institution: 'Engineering College',
  department: 'ECE',
  degree: degrees[0],
  year: years[0],
  password: 'UniquePassphrase2026',
  confirm: 'UniquePassphrase2026',
};
test('direct navigation cannot bypass required identity, academic or security fields', () => {
  assert.equal(guardedStep(5, blank), 1);
  assert.equal(guardedStep(5, { ...valid, institution: '' }), 2);
  assert.equal(guardedStep(5, { ...valid, password: '' }), 4);
  assert.equal(guardedStep(5, valid), 5);
  assert.equal(guardedStep(NaN, valid), 0);
});
test('student academics require supported degree and year; roll ID remains optional', () => {
  assert.deepEqual(validateStep(2, valid), {});
  assert.ok(validateStep(2, { ...valid, degree: 'Professional' }).degree);
  assert.ok(validateStep(2, { ...valid, year: '' }).year);
});
test('optional skills, experience and track never block registration', () => {
  assert.deepEqual(validateStep(3, valid), {});
  assert.ok(validateStep(3, { ...valid, github: 'javascript:alert(1)' }).github);
});
test('password policy and matching confirmation use the shared server policy', () => {
  assert.deepEqual(validateStep(4, valid), {});
  assert.ok(validateStep(4, { ...valid, password: 'short' }).password);
  assert.ok(validateStep(4, { ...valid, confirm: 'different' }).confirm);
});
test('draft roundtrip preserves fields and excludes credentials, tokens and consents', () => {
  const unsafe = { ...valid, token: 'secret-token', consent: true };
  const draft = registrationDraft(unsafe);
  assert.equal('password' in draft, false);
  assert.equal('confirm' in draft, false);
  assert.equal('token' in draft, false);
  assert.equal('consent' in draft, false);
  const restored = restoreRegistration({
    ...draft,
    password: 'injected',
    confirm: 'injected',
    skills: ['Python', 'unsupported'],
  });
  assert.equal(restored.password, '');
  assert.equal(restored.confirm, '');
  assert.equal(restored.institution, valid.institution);
  assert.deepEqual(restored.skills, ['Python']);
});
