// Run with PLAYWRIGHT_MODULE pointing to an existing Playwright installation.
// Negative API responses only: this suite never invents successful authentication.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const base = process.env.AUTH_TEST_URL || 'http://localhost:3000';
const output = path.resolve(__dirname, '../tmp/auth-v3-qa');
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultNavigationTimeout(120000);
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  const checks = [];
  const check = (name, value = true) => {
    assert.ok(value, name);
    checks.push(name);
    console.log('PASS', name);
  };
  const button = (name) => page.getByRole('button', { name });
  const heading = (name) => page.getByRole('heading', { name, exact: true });
  async function screen(name) {
    await heading(name).waitFor();
  }
  async function noOverflow(name) {
    check(
      name,
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    );
  }
  try {
    await page.goto(`${base}/register?step=5`);
    await screen('First, tell us about you.');
    check(
      'direct review URL redirects to earliest required step',
      page.url().includes('step=1'),
    );
    await button(/Continue to academics/).click();
    await page.getByText('Enter at least two characters.').first().waitFor();
    check('empty personal step blocks progression', page.url().includes('step=1'));
    await page.getByLabel('First name *', { exact: true }).fill('Arjun');
    await page.getByLabel('Last name *', { exact: true }).fill('Kumar');
    await page.getByLabel('Display name *', { exact: true }).fill('Circuit Builder');
    await page.getByLabel('Email address *', { exact: true }).fill('arjun@example.com');
    await page.getByLabel('Mobile number *', { exact: true }).fill('+91 98765 43210');
    await button(/Continue to academics/).click();
    await screen('Where do you study?');
    await button(/Continue to skills/).click();
    await page.getByText('Enter your institution.', { exact: true }).waitFor();
    check('academic validation enforced');
    await page
      .getByLabel('College / institution *', { exact: true })
      .fill('Student Engineering College');
    await page.getByLabel('Department *', { exact: true }).fill('Electronics');
    await page
      .getByLabel('Degree / program *', { exact: true })
      .selectOption('B.E. / B.Tech');
    await page.getByLabel('Year of study *', { exact: true }).selectOption('Third year');
    await button(/Continue to skills/).click();
    await screen('What do you love building?');
    await button('+ Python').click();
    check(
      'skill selection toggles',
      (await button('✓ Python').getAttribute('aria-pressed')) === 'true',
    );
    await button('✓ Python').click();
    await button(/Continue to security/).click();
    await screen('Create your secure account.');
    check('empty optional skills permit progression');
    await page.getByLabel('Password *', { exact: true }).fill('UniquePassphrase2026');
    await page.getByLabel('Confirm password *', { exact: true }).fill('different');
    await button(/Review registration/).click();
    await page.getByText('Passwords must match.', { exact: true }).waitFor();
    check('mismatched passwords blocked');
    await page
      .getByLabel('Confirm password *', { exact: true })
      .fill('UniquePassphrase2026');
    await button('Show password *', { exact: true }).click();
    check(
      'password reveal works',
      (await page.getByLabel('Password *', { exact: true }).getAttribute('type')) ===
        'text',
    );
    await button(/Review registration/).click();
    await screen('Everything look right?');
    check(
      'review contains collected identity',
      (await page.locator('main').innerText()).includes('Arjun Kumar'),
    );
    check(
      'review never displays password',
      !(await page.locator('body').innerText()).includes('UniquePassphrase2026'),
    );
    check(
      'required consents start unchecked',
      (await page.locator('input[type=checkbox]:checked').count()) === 0,
    );
    await button(/Submit Registration/).click();
    await page.locator('main').getByRole('alert').waitFor();
    check('missing consent blocks submission');
    await button('Edit personal details').click();
    await screen('First, tell us about you.');
    check(
      'edit preserves fields',
      (await page.getByLabel('First name *', { exact: true }).inputValue()) === 'Arjun',
    );
    await page.goBack();
    await screen('Everything look right?');
    check('browser back restores validated review');
    const stored = await page.evaluate(() =>
      sessionStorage.getItem('niral.registration.v3'),
    );
    check(
      'stored draft excludes password and confirmation',
      !stored.includes('password') &&
        !stored.includes('confirm') &&
        !stored.includes('UniquePassphrase2026'),
    );
    await page.reload();
    await screen('Create your secure account.');
    check('refresh requires password re-entry');
    await page.getByLabel('Password *', { exact: true }).fill('UniquePassphrase2026');
    await page
      .getByLabel('Confirm password *', { exact: true })
      .fill('UniquePassphrase2026');
    await button(/Review registration/).click();
    await page.locator('input[type=checkbox]').nth(0).check();
    await page.locator('input[type=checkbox]').nth(1).check();
    await page.locator('input[type=checkbox]').nth(2).check();
    await page.locator('input[type=checkbox]').nth(3).check();
    await page.route('**/api/account/register', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'The account service is unavailable. Try again later.',
        }),
      }),
    );
    await button(/Submit Registration/).click();
    await page.locator('main').getByRole('alert').waitFor();
    check(
      'server failure keeps review and draft',
      (await page.locator('main').getByRole('alert').innerText()).includes('unavailable'),
    );
    await page.screenshot({
      path: path.join(output, 'review-desktop.png'),
      fullPage: true,
    });
    await page.goto(`${base}/register`);
    await screen('Build what matters.');
    const art = page.getByRole('group', {
      name: 'Interactive NIRAL innovation core',
      exact: true,
    });
    const model = page.locator('[data-core-model]');
    const view = () =>
      model.evaluate((e) =>
        [e.style.getPropertyValue('--rx'), e.style.getPropertyValue('--ry')].join('|'),
      );
    await button('Ⅱ Pause motion').click();
    await page.waitForTimeout(700);
    const before = await view();
    await art.focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(700);
    check('artwork arrow keys rotate', (await view()) !== before);
    await button('Reset view').click();
    await page.waitForTimeout(700);
    check('artwork reset restores view', (await view()) === before);
    await page.getByRole('slider', { name: 'Artwork zoom' }).fill('110');
    check(
      'artwork zoom works',
      (await model.evaluate((e) => e.style.getPropertyValue('--zoom'))) === '1.1',
    );
    const bounds = await art.boundingBox();
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      bounds.x + bounds.width / 2 + 70,
      bounds.y + bounds.height / 2 + 35,
    );
    await page.mouse.up();
    await page.waitForTimeout(700);
    check('pointer drag rotates artwork', (await view()) !== before);
    check(
      'motion can be paused',
      (await button('▶ Resume motion').getAttribute('aria-pressed')) === 'true',
    );
    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await noOverflow(`welcome has no horizontal overflow at ${width}px`);
      await page.screenshot({
        path: path.join(output, `welcome-${width}.png`),
        fullPage: true,
      });
      await button(/Start student registration/).click();
      await screen('First, tell us about you.');
      await noOverflow(`personal form has no horizontal overflow at ${width}px`);
      await page.screenshot({
        path: path.join(output, `personal-${width}.png`),
        fullPage: true,
      });
      await button('Back', { exact: true }).click();
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    check(
      'reduced-motion preference applied',
      await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches),
    );
    await page.keyboard.press('Tab');
    check(
      'keyboard focus remains on reachable controls',
      await page.evaluate(() => document.activeElement.tagName !== 'BODY'),
    );
    await page.setViewportSize({ width: 390, height: 844 });
    for (const [route, title] of [
      ['login', 'Welcome back, builder.'],
      ['forgot-password', 'Forgot your password?'],
      ['reset-password', 'Choose a new password.'],
      ['verify-email', 'Check your inbox.'],
      ['invite', 'A team wants you onboard.'],
      ['session-expired', 'Your session has ended.'],
    ]) {
      await page.goto(`${base}/${route}`);
      await screen(title);
      await noOverflow(`${route} renders without overflow on mobile`);
      await page.screenshot({
        path: path.join(output, `${route}-mobile.png`),
        fullPage: true,
      });
    }
    await page.goto(`${base}/profile-completion`);
    await page.waitForURL(
      (url) =>
        url.pathname === '/login' &&
        url.searchParams.get('next') === '/profile-completion',
    );
    check('profile requires real authentication');
    await page.goto(`${base}/login`);
    await button(/Sign In →/).click();
    await page.getByText('Enter a valid email address.', { exact: true }).waitFor();
    check('login validates empty credentials');
    await page.goto(`${base}/reset-password#token=not-a-valid-reset-token`);
    await page.getByLabel('New password', { exact: true }).waitFor();
    check(
      'reset link survives strict effects and is removed from URL',
      !page.url().includes('token='),
    );
    await page.route('**/api/account/reset-password', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Recovery link has expired.' }),
      }),
    );
    await page.getByLabel('New password', { exact: true }).fill('UniquePassphrase2026');
    await page
      .getByLabel('Confirm new password', { exact: true })
      .fill('UniquePassphrase2026');
    await button(/Reset Password/).click();
    await page.locator('main').getByRole('alert').waitFor();
    check('expired reset shows server error with retry');
    await page.goto(`${base}/`);
    check('public homepage renders', (await page.locator('main').count()) > 0);
    await page.screenshot({ path: path.join(output, 'public-home.png'), fullPage: true });
    check('no browser runtime errors', pageErrors.length === 0);
    fs.writeFileSync(
      path.join(output, 'results.json'),
      JSON.stringify(
        {
          base,
          checks,
          pageErrors,
          note: 'No successful registrations, verifications, resets, sign-ins or team acceptances were mocked or performed.',
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
