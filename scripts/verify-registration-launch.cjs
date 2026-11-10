// Real HTTP/PostgreSQL/SMTP/browser checks. UPI credits and statements are explicit synthetic fixtures; no money moves.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
require('dotenv').config({ path: process.env.NIRAL_QA_ENV_FILE || '.env', quiet: true });
const { PrismaClient } = require('@prisma/client');
const base = 'http://localhost:4100/api';
const output = path.resolve(__dirname, '../tmp/launch-http-qa');
fs.mkdirSync(output, { recursive: true });
const database = new URL(process.env.NIRAL_TEST_DATABASE_URL || 'http://invalid');
if (
  !['localhost', '127.0.0.1'].includes(database.hostname) ||
  !database.pathname.endsWith('_test')
)
  throw Error('Dedicated local *_test database required.');
if (process.env.SMTP_HOST !== 'localhost' || !['1025', '51025'].includes(process.env.SMTP_PORT))
  throw Error('Local SMTP capture required.');
const captureOrigin = process.env.MAIL_CAPTURE_URL || 'http://localhost:8025';
if (!['http://localhost:8025', 'http://localhost:58025'].includes(captureOrigin)) throw Error('Local-only SMTP capture origin required');
const db = new PrismaClient({ datasources: { db: { url: database.toString() } } });
const upiQa = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../tmp/upi-local-qa.json'), 'utf8'),
);
const marker = `launch-qa-${upiQa.runId}`,
  password = `Isolated!${randomUUID()}`;
const users = [],
  events = [],
  checks = [],
  errors = [];
let browser;
const check = (name, condition = true) => {
  assert.ok(condition, name);
  checks.push(name);
  console.log('PASS', name);
};
// Respect the unchanged 8-login/minute IP budget across direct and browser calls.
const loginAttempts = [];
async function reserveLoginAttempt() {
  while (loginAttempts.length && loginAttempts[0] <= Date.now() - 61_000) loginAttempts.shift();
  if (loginAttempts.length >= 8) {
    console.log('QA pacing login attempts to respect the real IP limit');
    await new Promise(resolve => setTimeout(resolve, Math.max(1, 61_000 - (Date.now() - loginAttempts[0]))));
    return reserveLoginAttempt();
  }
  loginAttempts.push(Date.now());
}
async function request(route, body, bearer, method) {
  if (route === '/auth/login') await reserveLoginAttempt();
  const response = await fetch(base + route, {
    method: method ?? (body === undefined ? 'GET' : 'POST'),
    headers: {
      'Content-Type': 'application/json',
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(55000),
  });
  return { status: response.status, data: await response.json().catch(() => ({})) };
}
async function tokenFromCapture(email, subject, purpose) {
  const list = await (
    await fetch(captureOrigin + '/api/v2/messages?limit=300')
  ).json();
  const message = list.items.find(
    (m) =>
      m.Content.Headers.Subject?.[0] === subject &&
      m.To.some((t) => `${t.Mailbox}@${t.Domain}` === email),
  );
  assert(message, 'Actual SMTP message was not captured');
  const text = JSON.stringify(message)
    .replace(/=\\r\\n/g, '')
    .replace(/=\r?\n/g, '')
    .replace(/=3D/g, '=');
  const token = text.match(new RegExp(`${purpose}\\.[a-f0-9]{64}`))?.[0];
  assert(token, 'One-time link missing in capture');
  return token;
}
const student = {
  firstName: 'Local',
  lastName: 'Student',
  displayName: 'Local Builder',
  phone: '+919876543210',
  institution: 'Isolated Test College',
  department: 'ECE',
  degree: 'B.E. / B.Tech',
  yearOfStudy: 'Third year',
  skills: ['Python'],
  rulesAccepted: true,
  privacyAccepted: true,
  codeOfConductAccepted: true,
  eligibilityConfirmed: true,
};
async function account(label) {
  const email = `${marker}-${label}@example.test`;
  const result = await request('/auth/register', {
    name: 'Local Student',
    email,
    password,
    accountPolicyAccepted: true,
    student,
  });
  assert.equal(result.status, 201);
  assert.equal(result.data.emailDelivery, 'accepted');
  const user = await db.user.findUniqueOrThrow({ where: { email } });
  users.push(user.id);
  assert.equal((await request('/auth/login', { email, password })).status, 403);
  const token = await tokenFromCapture(
    email,
    'Verify your NIRAL 2026 account',
    'email-verify',
  );
  assert.equal((await request('/auth/verify-email', { token })).status, 201);
  assert.equal((await request('/auth/verify-email', { token })).status, 400);
  const login = await request('/auth/login', { email, password });
  assert.equal(login.status, 201);
  assert(login.data.accessToken);
  return { ...user, email, bearer: login.data.accessToken };
}
async function event(mode, label = mode) {
  const value = await db.event.create({
    data: {
      slug: `${marker}-${label}`,
      name: `ISOLATED LOCAL QA · ${mode}`,
      startsAt: new Date('2026-12-03T00:00:00.000Z'),
      endsAt: new Date('2026-12-04T23:59:59.000Z'),
      isActive: true,
      isPublished: true,
      status: 'REGISTRATION_OPEN',
      registrationEnabled: true,
      registrationPaymentMode: mode,
      maxCapacity: 1,
      eventMode: 'OFFLINE',
      ...(mode === 'PAID'
        ? {
            feeAmountMinor: 10000,
            feeApprovedAt: new Date(),
            receiptIssuer: 'QA FIXTURE ONLY',
            paymentPolicyUrl: 'https://example.test/terms',
            refundPolicyUrl: 'https://example.test/refunds',
            cancellationPolicyUrl: 'https://example.test/cancellation',
          }
        : {}),
    },
  });
  events.push(value.id);
  return value;
}
function application(eventId) {
  return {
    eventId,
    mode: 'ONSITE',
    rulesAccepted: true,
    privacyAccepted: true,
    codeOfConductAccepted: true,
    eligibilityConfirmed: true,
    application: {
      institution: student.institution,
      department: student.department,
      degree: student.degree,
      yearOfStudy: student.yearOfStudy,
      phone: student.phone,
      interests: [],
      technologies: [],
    },
  };
}
async function main() {
  await db.$connect();
  const health = await request('/health');
  check(
    'real API, PostgreSQL and Redis health',
    health.status === 200 &&
      health.data.services.database === 'up' &&
      health.data.services.redis === 'up',
  );
  const a = await account('a'),
    b = await account('b');
  check(
    'two real student accounts, captured verification emails, single-use verification and login',
  );
  const profile = await db.userProfile.findUniqueOrThrow({ where: { userId: a.id } });
  check(
    'student names, display name, academics and phone persist in PostgreSQL',
    profile.firstName === student.firstName &&
      profile.displayName === student.displayName &&
      profile.degree === student.degree &&
      profile.phoneNumber === student.phone,
  );
  check(
    'versioned required consents persist separately from editable profile data',
    (await db.registrationConsent.count({
      where: {
        userId: a.id,
        rulesAccepted: true,
        privacyAccepted: true,
        codeOfConductAccepted: true,
        eligibilityConfirmed: true,
      },
    })) === 1,
  );
  check(
    'duplicate identity rejected',
    (
      await request('/auth/register', {
        name: 'Local Student',
        email: a.email,
        password,
        accountPolicyAccepted: true,
        student,
      })
    ).status === 409,
  );
  check(
    'non-student program rejected by HTTP validation',
    (
      await request('/auth/register', {
        name: 'Invalid Student',
        email: `${marker}-invalid@example.test`,
        password,
        accountPolicyAccepted: true,
        student: { ...student, degree: 'Professional employment' },
      })
    ).status === 400,
  );
  check(
    'invalid authentication token rejected',
    (await request('/payments/me', undefined, 'not-a-valid-token')).status === 401,
  );
  const free = await event('FREE');
  const enrolled = await request('/enrollment', application(free.id), a.bearer);
  check(
    'real free enrollment confirms without a payment order',
    enrolled.status === 201 &&
      enrolled.data.status === 'CONFIRMED' &&
      (await db.paymentOrder.count({ where: { enrollmentId: enrolled.data.id } })) === 0,
  );
  check(
    'duplicate enrollment rejected',
    (await request('/enrollment', application(free.id), a.bearer)).status === 409,
  );
  check(
    'capacity enforced',
    (await request('/enrollment', application(free.id), b.bearer)).status === 409,
  );
  const team = await request(
    '/teams',
    {
      eventId: free.id,
      name: `${marker}-team`,
      description: 'Isolated team integration check for confirmed enrollment.',
      theme: 'AI + IoT',
    },
    a.bearer,
  );
  check('team creation succeeds only after confirmed enrollment', team.status === 201);
  check(
    'unconfirmed participant cannot join a team',
    (await request('/teams/join', { inviteCode: team.data.inviteCode }, b.bearer))
      .status === 403,
  );
  await db.user.update({ where: { id: b.id }, data: { role: 'ADMIN' } });
  const publish = {
    mode: 'PAID',
    amountMinor: 10000,
    taxAmountMinor: 0,
    currency: 'INR',
    feeScope: 'PARTICIPANT',
    expectedVersion: 0,
    expectedOldAmountMinor: 0,
    confirmPublish: true,
    feeApproved: true,
    receiptIssuer: 'QA FIXTURE ONLY',
    paymentPolicyUrl: 'https://example.test/terms',
    refundPolicyUrl: 'https://example.test/refunds',
    cancellationPolicyUrl: 'https://example.test/cancellation',
  };
  check(
    'participant cannot publish payment settings',
    (
      await request(
        `/master/events/${free.id}/payment-settings`,
        publish,
        a.bearer,
        'PATCH',
      )
    ).status === 403,
  );
  check(
    'Master cannot enable paid collection without authorized test configuration',
    (
      await request(
        `/master/events/${free.id}/payment-settings`,
        publish,
        b.bearer,
        'PATCH',
      )
    ).status === 503,
  );
  await db.event.update({
    where: { id: free.id },
    data: { registrationPaymentMode: 'DISABLED' },
  });
  check(
    'disabled enrollment blocks new applicants',
    (await request('/enrollment', application(free.id), a.bearer)).status === 400,
  );
  const paid = await event('PAID');
  const pending = await request('/enrollment', application(paid.id), a.bearer);
  check(
    'paid event enrollment remains pending before capture',
    pending.status === 201 && pending.data.status === 'PENDING',
  );
  check(
    'disabled custom checkout creates no payment order',
    (await request('/payments/orders', { enrollmentId: pending.data.id }, a.bearer))
      .status === 503 &&
      (await db.paymentOrder.count({ where: { enrollmentId: pending.data.id } })) === 0,
  );
  // A pending database fixture permits status/ownership/UI checks. It is not a provider order or a successful payment.
  const order = await db.paymentOrder.create({
    data: {
      userId: a.id,
      eventId: paid.id,
      enrollmentId: pending.data.id,
      amountMinor: 10000,
      currency: 'INR',
      environment: 'test',
      paymentMode: 'PAID',
      status: 'PENDING',
      policySnapshot: pending.data.paymentPolicySnapshot,
      upiCase: { create: { beneficiary: 'synthetic-test-only@upi' } },
    },
  });
  check(
    'another account cannot read a payment record',
    (await request(`/payments/orders/${order.id}/status`, undefined, b.bearer)).status ===
      404,
  );
  check(
    'pending payment cannot issue a receipt',
    (await request(`/payments/${order.id}/receipt`, undefined, a.bearer)).status === 409,
  );
  check(
    'removed payment callback route is absent',
    (await request('/payments/verify', {}, a.bearer)).status === 404,
  );
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  browser = await chromium.launch({ headless: true });
  async function loginPage(user) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.setDefaultNavigationTimeout(120000);
    page.setDefaultTimeout(120000);
    page.on('pageerror', (error) => {
      errors.push(error.message);
      console.log('BROWSERERROR', error.message);
    });
    await page.goto('http://localhost:3000/login');
    await page.getByLabel('Email address', { exact: true }).fill(user.email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await reserveLoginAttempt();
    await page.getByRole('button', { name: /Sign In →/ }).click();
    await page.waitForURL((url) =>
      ['/dashboard', '/master', '/admin'].includes(url.pathname),
    );
    if (user.id === a.id) await page.locator('#niral-dashboard-main').waitFor();
    return page;
  }
  const page = await loginPage(a);
  check('real NextAuth session opens the participant dashboard');
  await page.route('**/api/payments/me', route => route.fulfill({status: 503, contentType: 'application/json', body: JSON.stringify({message: 'Synthetic temporary payment service outage.'})}));
  await page.goto('http://localhost:3000/dashboard/payments/' + order.id);
  await page.getByRole('button', {name: 'Retry loading payment records'}).waitFor();
  check('payment load failure offers retry without a false ownership denial', !(await page.locator('body').innerText()).includes('No payment record belongs') && !(await page.locator('body').innerText()).includes('No matching enrollment belongs'));
  await page.unroute('**/api/payments/me');
  await page.getByRole('button', {name: 'Retry loading payment records'}).click();
  await page.getByRole('heading', {name: 'Check your payment status.'}).waitFor();
  check('payment records recover after the temporary service outage');
  await page.goto(`http://localhost:3000/dashboard/payments/${order.id}`);
  await page.getByRole('heading', { name: 'Check your payment status.' }).waitFor();
  check(
    'participant UI shows real pending payment rather than success',
    (await page.locator('body').innerText()).includes('PENDING') &&
      (await page.getByText('Payment verified.', { exact: true }).count()) === 0,
  );
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    check(
      `payment UI has no overflow at ${width}px`,
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    );
    await page.screenshot({
      path: path.join(output, `payment-${width}.png`),
      fullPage: true,
    });
  }
  await page.getByRole('button', { name: 'Show authorized test QR' }).click();
  await page
    .getByText('Custom UPI is disabled. Production collection is not available.', {
      exact: true,
    })
    .waitFor();
  check('checkout UI reports disabled custom collection without success');
  const masterPage = await loginPage(b);
  await masterPage.goto('http://localhost:3000/admin/payments');
  await masterPage
    .getByRole('heading', { name: 'Registration & payment controls' })
    .waitFor();
  await masterPage
    .getByText('Production collection disabled', {
      exact: false,
    })
    .waitFor();
  check('Master panel reads actual collection flags and event settings');
  await masterPage.screenshot({
    path: path.join(output, 'master-desktop.png'),
    fullPage: true,
  });
  await page.goto('http://localhost:3000/admin/payments');
  await page.waitForURL((url) => url.pathname === '/dashboard');
  check('participant cannot open Master payment controls');

  const custom = await event('PAID', 'CUSTOM-UPI');
  await db.event.update({
    where: { id: custom.id },
    data: { paymentProvider: 'FAMAPP_SANDBOX', feeAmountMinor: 100 },
  });
  const enrollment = await request('/enrollment', application(custom.id), a.bearer);
  check(
    'custom UPI enrollment uses immutable server amount and remains pending',
    enrollment.status === 201 &&
      enrollment.data.status === 'PENDING' &&
      enrollment.data.feeAmountSnapshot === 100,
  );
  await page.goto(
    `http://localhost:3000/dashboard/payments/checkout/${enrollment.data.id}`,
  );
  await page.getByRole('button', { name: 'Continue to UPI checkout' }).click();
  await page.getByRole('button', { name: 'Show authorized test QR' }).click();
  await page.getByAltText('Authorized personal test UPI QR').waitFor();
  const appLink = await page
    .getByRole('link', { name: 'Open authorized personal test in a UPI app' })
    .getAttribute('href');
  check(
    'authorized sandbox checkout creates order before QR and uses exact one-rupee synthetic amount',
    new URL(appLink).searchParams.get('am') === '1.00' &&
      new URL(appLink).searchParams.get('pa') === 'synthetic-test-only@fam',
  );
  const customOrder = await db.paymentOrder.findUniqueOrThrow({
    where: { enrollmentId: enrollment.data.id },
  });
  check(
    'ordinary participant cannot verify receiving credit',
    (
      await request(
        `/master/upi/${customOrder.id}/verify`,
        {
          decision: 'VERIFY',
          reason: 'Synthetic unauthorized attempt',
          evidenceType: 'RECEIVING_ACCOUNT_STATEMENT',
          evidenceReference: 'SYNTHETIC-ONLY',
          utr: '123456789012',
          beneficiary: 'synthetic-test-only@fam',
          amountMinor: 100,
          creditedAt: new Date().toISOString(),
          independentlyChecked: true,
        },
        a.bearer,
      )
    ).status === 403,
  );
  const syntheticUtr = '7' + Date.now().toString().slice(-11);
  await page
    .getByLabel('UPI transaction reference / UTR', { exact: true })
    .fill(syntheticUtr);
  await page.getByRole('button', { name: 'Submit claim for verification' }).click();
  await page.getByText('CLAIM SUBMITTED', { exact: true }).waitFor();
  check(
    'participant UTR submission cannot activate enrollment',
    (await db.eventEnrollment.findUniqueOrThrow({ where: { id: enrollment.data.id } }))
      .status === 'PENDING',
  );
  const { ConfigService } = require('@nestjs/config');
  const { UpiConfig } = require('../apps/api/dist/src/payments/upi/upi-config');
  const { UpiService } = require('../apps/api/dist/src/payments/upi/upi.service');
  const config = new UpiConfig(
    new ConfigService({
      NODE_ENV: 'development',
      UPI_SYNTHETIC_MODE: 'true',
      UPI_RECONCILIATION_KEY: upiQa.key,
      GMAIL_RECONCILIATION_ALLOWED_SENDERS: 'alerts@example.test',
    }),
  );
  const importer = new UpiService(db, {}, config);
  const creditedAt = new Date().toISOString();
  await importer.ingest({
    mailboxId: marker,
    messageId: marker + '-synthetic',
    headers: [
      { name: 'From', value: 'alerts@example.test' },
      {
        name: 'Authentication-Results',
        value:
          'mx.google.com; spf=pass; dkim=pass header.i=@example.test; dmarc=pass header.from=example.test',
      },
    ],
    text: `NIRAL SYNTHETIC CREDIT V1\nAmount: 1.00\nUTR: ${syntheticUtr}\nBeneficiary: synthetic-test-only@fam\nDirection: CREDIT\nStatus: SUCCESS\nTimestamp: ${creditedAt}`,
    receivedAt: new Date(),
  });
  await page.getByRole('button', { name: 'Refresh claim status' }).click();
  await page.getByText('AWAITING CREDIT VERIFICATION', { exact: true }).waitFor();
  check(
    'synthetic email match remains unverified and no full UTR is shown',
    (await db.eventEnrollment.findUniqueOrThrow({ where: { id: enrollment.data.id } }))
      .status === 'PENDING' &&
      !(await page.locator('body').innerText()).includes(syntheticUtr),
  );
  await page.setViewportSize({ width: 390, height: 1000 });
  check(
    'custom UPI checkout has no mobile overflow',
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  );
  await page.screenshot({ path: path.join(output, 'upi-mobile.png'), fullPage: true });
  await masterPage.reload();
  const caseCard = masterPage
    .getByRole('heading', { name: enrollment.data.registrationId, exact: true })
    .first()
    .locator('..');
  await caseCard.getByRole('button', { name: 'Review payment details' }).click();
  await masterPage
    .getByLabel('Audit reason', { exact: true })
    .fill('SYNTHETIC statement fixture independently checked');
  await masterPage
    .getByLabel('Independent statement / transfer record reference', { exact: true })
    .fill(marker + '-statement');
  await masterPage
    .getByLabel('UTR from receiving statement (or outgoing refund)', { exact: true })
    .fill(syntheticUtr);
  await masterPage
    .getByLabel('Beneficiary from receiving-account record', { exact: true })
    .fill('synthetic-test-only@fam');
  await masterPage
    .getByLabel('Actual transaction timestamp (ISO 8601 with timezone)', { exact: true })
    .fill(creditedAt);
  await masterPage
    .getByRole('checkbox', { name: /I independently checked actual/ })
    .check();
  masterPage.once('dialog', (d) => d.accept());
  await masterPage
    .getByRole('button', { name: 'Verify receiving-account credit' })
    .click();
  await masterPage
    .getByText(
      'Review recorded. The database and notification outbox were updated atomically.',
      { exact: true },
    )
    .waitFor();
  check(
    'Master independent statement review activates paid enrollment',
    (await db.eventEnrollment.findUniqueOrThrow({ where: { id: enrollment.data.id } }))
      .status === 'CONFIRMED',
  );
  await page.goto(`http://localhost:3000/dashboard/payments/${customOrder.id}`);
  await page.getByRole('heading', { name: 'Payment verified.', exact: true }).waitFor();
  check(
    'verified participant receives receipt access',
    (await page.getByRole('link', { name: 'Download verified receipt' }).count()) === 1,
  );
  await page
    .getByRole('region', { name: 'Custom UPI checkout' })
    .getByText('VERIFIED', { exact: true })
    .waitFor();
  await page.screenshot({
    path: path.join(output, 'upi-verified-mobile.png'),
    fullPage: true,
  });
  await masterPage
    .getByRole('heading', { name: enrollment.data.registrationId, exact: true })
    .first()
    .locator('..')
    .getByRole('button', { name: 'Review payment details' })
    .click();
  await masterPage
    .getByLabel('Audit reason', { exact: true })
    .fill('SYNTHETIC full refund approved');
  masterPage.once('dialog', (d) => d.accept());
  await masterPage.getByRole('button', { name: 'Reserve full manual refund' }).click();
  await masterPage
    .getByText(
      'Refund reserved. Send funds outside this website, then record verified outgoing evidence.',
      { exact: true },
    )
    .waitFor();
  check(
    'refund reservation does not claim an outgoing transfer',
    (
      await db.upiManualRefund.findFirstOrThrow({
        where: { reconciliation: { orderId: customOrder.id } },
      })
    ).status === 'PENDING',
  );
  await masterPage
    .getByRole('heading', { name: enrollment.data.registrationId, exact: true })
    .first()
    .locator('..')
    .getByRole('button', { name: 'Review payment details' })
    .click();
  await masterPage
    .getByLabel('Audit reason', { exact: true })
    .fill('SYNTHETIC outgoing transfer record checked');
  await masterPage
    .getByLabel('Independent statement / transfer record reference', { exact: true })
    .fill(marker + '-refund');
  await masterPage
    .getByLabel('UTR from receiving statement (or outgoing refund)', { exact: true })
    .fill('8' + Date.now().toString().slice(-11));
  await masterPage
    .getByLabel('Actual transaction timestamp (ISO 8601 with timezone)', { exact: true })
    .fill(new Date().toISOString());
  await masterPage
    .getByRole('checkbox', { name: /I independently checked actual/ })
    .check();
  masterPage.once('dialog', (d) => d.accept());
  await masterPage
    .getByRole('button', { name: 'Record verified outgoing refund' })
    .click();
  await masterPage
    .getByText(
      'Review recorded. The database and notification outbox were updated atomically.',
      { exact: true },
    )
    .waitFor();
  check(
    'verified synthetic outgoing evidence records refund and withdraws enrollment',
    (await db.eventEnrollment.findUniqueOrThrow({ where: { id: enrollment.data.id } }))
      .status === 'WITHDRAWN',
  );
  await masterPage.screenshot({
    path: path.join(output, 'upi-master-desktop.png'),
    fullPage: true,
  });
  await masterPage.screenshot({
    path: path.join(output, 'upi-master-viewport.png'),
    fullPage: false,
  });
  await masterPage.setViewportSize({ width: 390, height: 1000 });
  check(
    'Master UPI controls have no mobile overflow',
    await masterPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  );
  await masterPage.screenshot({
    path: path.join(output, 'upi-master-mobile.png'),
    fullPage: true,
  });
  check(
    'same-origin bridge rejects mutations without an Origin header',
    (
      await page.request.post('http://localhost:3000/api/payments/orders', {
        data: { enrollmentId: enrollment.data.id },
      })
    ).status() === 403,
  );
  const queueRegion = masterPage.getByRole('region', { name: 'UPI payment management' });
  await queueRegion
    .getByLabel('Search exact UTR (masked results)', { exact: true })
    .fill(syntheticUtr);
  await queueRegion
    .getByRole('button', { name: 'Search transactions', exact: true })
    .click();
  await queueRegion.getByText('Search completed.', { exact: true }).waitFor();
  check(
    'Master exact UTR search returns masked matching records',
    (await queueRegion
      .getByRole('button', { name: 'Review payment details' })
      .count()) === 1 && !(await queueRegion.innerText()).includes(syntheticUtr),
  );
  const downloadPromise = masterPage.waitForEvent('download');
  await queueRegion
    .getByRole('button', { name: 'Export full financial audit', exact: true })
    .click();
  const download = await downloadPromise;
  await download.saveAs(path.join(output, 'upi-financial-audit.csv'));
  const exported = fs.readFileSync(path.join(output, 'upi-financial-audit.csv'), 'utf8');
  check(
    'full paged audit export includes review history without UTR or encrypted evidence',
    exported.includes('UPI_CREDIT_INDEPENDENTLY_VERIFIED') &&
      !exported.includes(syntheticUtr) &&
      !exported.includes('Encrypted'),
  );
  await queueRegion.getByRole('button', { name: 'Connect read-only Gmail' }).click();
  await queueRegion
    .getByText('Authorized read-only Gmail reconciliation is not configured.', {
      exact: true,
    })
    .waitFor();
  check(
    'unconfigured Gmail connection fails closed without leaving Master page',
    masterPage.url().includes('/admin/payments'),
  );
  // Exercise the real notification sender against local SMTP capture. No recipient is external.
  const { MailService } = require('../apps/api/dist/src/mail/mail.service');
  const { PaymentsService } = require('../apps/api/dist/src/payments/payments.service');
  const { ConfigService: Config } = require('@nestjs/config');
  const sender = new MailService(
    new Config({ ...process.env, MAIL_QUEUE_ENABLED: 'false' }),
  );
  const payments = new PaymentsService(db, config, sender);
  for (let i = 0; i < 8; i++) await payments.sendNotifications();
  check(
    'verified-payment notification delivered to local SMTP capture',
    (
      await db.paymentNotification.findFirstOrThrow({
        where: { userId: a.id, eventType: 'payment.upi.verified' },
      })
    ).status === 'SENT',
  );
  await sender.onModuleDestroy?.();
  // Shared team-fee journey: real HTTP/database/browser, independent evidence remains synthetic.
  const c = await account('c');
  check(
    'additional team participant verifies through actual local SMTP capture',
    !!c.bearer,
  );
  check(
    'unbilled team can be left before forming the paid roster',
    (await request('/teams/leave', {}, a.bearer)).status === 201,
  );
  const teamEvent = await event('PAID', 'LOCKED-TEAM');
  await db.event.update({
    where: { id: teamEvent.id },
    data: {
      feeScope: 'TEAM',
      paymentProvider: 'FAMAPP_SANDBOX',
      feeAmountMinor: 100,
      maxCapacity: 4,
    },
  });
  const aTeam = await request('/enrollment', application(teamEvent.id), a.bearer),
    cTeam = await request('/enrollment', application(teamEvent.id), c.bearer);
  check(
    'team-priced enrollment remains pending for both members',
    aTeam.data.status === 'PENDING' && cTeam.data.status === 'PENDING',
  );
  const newTeam = await request(
    '/teams',
    {
      eventId: teamEvent.id,
      name: marker + '-paid-team',
      description:
        'Synthetic fixed team-fee validation for a verified two-student roster.',
      theme: 'AI + IoT',
    },
    a.bearer,
  );
  check(
    'pending team-priced participants can form their roster',
    newTeam.status === 201 &&
      (await request('/teams/join', { inviteCode: newTeam.data.inviteCode }, c.bearer))
        .status === 201,
  );
  await page.goto(`http://localhost:3000/dashboard/payments/checkout/${aTeam.data.id}`);
  await page.getByRole('button', { name: 'Continue to UPI checkout' }).click();
  await page.getByRole('button', { name: 'Show authorized test QR' }).waitFor();
  const teamOrder = await db.paymentOrder.findUniqueOrThrow({
    where: { enrollmentId: aTeam.data.id },
    include: { coveredEnrollments: true },
  });
  check(
    'leader creates one fixed-amount order covering the two-person roster',
    teamOrder.amountMinor === 100 && teamOrder.coveredEnrollments.length === 2,
  );
  check(
    'repeated checkout returns the same team order',
    (await request('/payments/orders', { enrollmentId: aTeam.data.id }, a.bearer)).data
      .id === teamOrder.id,
  );
  check(
    'billed roster cannot change through the team API',
    (await request('/teams/leave', {}, c.bearer)).status === 409,
  );
  check(
    'covered member cannot submit the payer UTR',
    (
      await request(
        `/payments/upi/${teamOrder.id}/claim`,
        { utr: '999999999999' },
        c.bearer,
      )
    ).status === 403,
  );
  const teamUtr = '6' + Date.now().toString().slice(-11);
  await request(`/payments/upi/${teamOrder.id}/claim`, { utr: teamUtr }, a.bearer);
  const teamProof = {
    decision: 'VERIFY',
    reason: 'SYNTHETIC team receiving-account record checked',
    evidenceType: 'RECEIVING_ACCOUNT_STATEMENT',
    evidenceReference: marker + '-team-statement',
    utr: teamUtr,
    beneficiary: 'synthetic-test-only@fam',
    amountMinor: 100,
    creditedAt: new Date().toISOString(),
    independentlyChecked: true,
  };
  check(
    'wrong team credit amount cannot confirm either enrollment',
    (
      await request(
        `/master/upi/${teamOrder.id}/verify`,
        { ...teamProof, amountMinor: 101 },
        b.bearer,
      )
    ).status === 409 &&
      (await db.eventEnrollment.count({
        where: { id: { in: [aTeam.data.id, cTeam.data.id] }, status: 'CONFIRMED' },
      })) === 0,
  );
  check(
    'authenticated independent review confirms exactly the locked team',
    (await request(`/master/upi/${teamOrder.id}/verify`, teamProof, b.bearer)).status ===
      201 &&
      (await db.eventEnrollment.count({
        where: { id: { in: [aTeam.data.id, cTeam.data.id] }, status: 'CONFIRMED' },
      })) === 2,
  );
  for (let i = 0; i < 4; i++) await payments.sendNotifications();
  check(
    'each covered team member receives a local confirmation notification',
    (await db.paymentNotification.count({
      where: {
        userId: { in: [a.id, c.id] },
        eventType: 'payment.upi.verified',
        status: 'SENT',
        body: { contains: teamOrder.id },
      },
    })) === 2,
  );
  const memberPage = await loginPage(c);
  await memberPage.goto(`http://localhost:3000/dashboard/payments/${teamOrder.id}`);
  await memberPage
    .getByRole('heading', { name: 'Payment verified.', exact: true })
    .waitFor();
  check(
    'covered member sees shared receipt without payer checkout controls',
    (await memberPage
      .getByRole('link', { name: 'Download verified receipt' })
      .count()) === 1 &&
      (await memberPage
        .getByRole('button', { name: 'Show authorized test QR' })
        .count()) === 0,
  );
  await memberPage.setViewportSize({ width: 390, height: 1000 });
  check(
    'shared team payment has no mobile overflow',
    await memberPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  );
  await memberPage.screenshot({
    path: path.join(output, 'team-payment-mobile.png'),
    fullPage: true,
  });
  await request(
    `/master/upi/${teamOrder.id}/refunds`,
    { reason: 'SYNTHETIC team refund approved', confirm: true },
    b.bearer,
  );
  const teamRefund = await request(
    `/master/upi/${teamOrder.id}/refunds/complete`,
    {
      reason: 'SYNTHETIC outgoing team refund checked',
      confirm: true,
      evidenceReference: marker + '-team-refund',
      utr: '5' + Date.now().toString().slice(-11),
      amountMinor: 100,
      completedAt: new Date().toISOString(),
      direction: 'DEBIT',
      independentlyChecked: true,
    },
    b.bearer,
  );
  check(
    'recorded full team refund withdraws both covered registrations',
    teamRefund.status === 201 &&
      (await db.eventEnrollment.count({
        where: { id: { in: [aTeam.data.id, cTeam.data.id] }, status: 'WITHDRAWN' },
      })) === 2,
  );
  const recovery = await request('/auth/forgot-password', { email: a.email });
  check('real password recovery request accepted', recovery.status === 201);
  const resetToken = await tokenFromCapture(
    a.email,
    'Reset your NIRAL 2026 password',
    'password-reset',
  );
  const newPassword = `Changed!${randomUUID()}`;
  check(
    'real reset link changes password',
    (await request('/auth/reset-password', { token: resetToken, password: newPassword }))
      .status === 201,
  );
  check(
    'reset revokes earlier API sessions',
    (await request('/auth/me', undefined, a.bearer)).status === 401,
  );
  await page.goto('http://localhost:3000/dashboard/payments');
  await page.waitForURL((url) => ['/session-expired', '/login'].includes(url.pathname));
  check('revoked NextAuth session cannot retain dashboard access');
  check('no browser runtime or hydration errors', errors.length === 0);
  fs.writeFileSync(
    path.join(output, 'results.json'),
    JSON.stringify(
      {
        checks,
        errors,
        realWalletTransfersExecuted: 0,
        note: 'Real local HTTP/PostgreSQL/SMTP/NextAuth/browser flows; UPI credits and receiving/outgoing statements are synthetic fixtures. No actual wallet transfers or live Gmail reads occurred.',
      },
      null,
      2,
    ),
  );
}
main()
  .catch((error) => {
    fs.writeFileSync(
      path.join(output, 'failure.json'),
      JSON.stringify({ checks, errors }, null, 2),
    );
    console.error(errors);
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await browser?.close();
    const orders = await db.paymentOrder.findMany({ where: { eventId: { in: events } } });
    await db.paymentNotification.deleteMany({ where: { userId: { in: users } } });
    await db.upiCreditDelivery.deleteMany({ where: { mailboxId: marker } });
    await db.upiCreditNotification.deleteMany({ where: { mailboxId: marker } });
    await db.upiManualRefund.deleteMany({
      where: { reconciliation: { order: { eventId: { in: events } } } },
    });
    await db.upiReconciliation.deleteMany({
      where: { order: { eventId: { in: events } } },
    });
    await db.paymentTransaction.deleteMany({
      where: { paymentOrderId: { in: orders.map((o) => o.id) } },
    });
    await db.paymentCoverage.deleteMany({
      where: { order: { eventId: { in: events } } },
    });
    await db.paymentOrder.deleteMany({ where: { eventId: { in: events } } });
    await db.team.deleteMany({ where: { eventId: { in: events } } });
    await db.eventEnrollment.deleteMany({ where: { eventId: { in: events } } });
    await db.event.deleteMany({ where: { id: { in: events } } });
    await db.registrationConsent.deleteMany({ where: { userId: { in: users } } });
    await db.auditLog.deleteMany({
      where: {
        OR: [
          { userId: { in: users } },
          ...orders.map((o) => ({
            resource: 'upi',
            metadata: { path: ['orderId'], equals: o.id },
          })),
          { resource: 'upi', metadata: { path: ['mailboxId'], equals: marker } },
        ],
      },
    });
    await db.user.deleteMany({ where: { id: { in: users } } });
    await db.$disconnect();
  });
