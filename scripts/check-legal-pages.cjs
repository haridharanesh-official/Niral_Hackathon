// Local browser checks only. No production writes, account creation or mailbox access.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.LEGAL_TEST_URL || 'http://localhost:3000';
const expectedOrigin = new URL(process.env.EXPECTED_SITE_ORIGIN || 'https://niralhackathon.dpdns.org').origin;
const output = path.resolve(__dirname, '../output/playwright/legal-pages');
fs.mkdirSync(output, { recursive: true });
const checks = [],
  errors = [];
const check = (name, value) => {
  assert.ok(value, name);
  checks.push(name);
};
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    page.on('pageerror', (e) => errors.push(e.message));
    page.setDefaultNavigationTimeout(120000);
    for (const [route, title] of [
      ['privacy-policy', 'Privacy Policy'],
      ['terms-of-service', 'Terms of Service'],
    ]) {
      for (const width of [1440, 768, 390, 320]) {
        await page.setViewportSize({ width, height: 1000 });
        const response = await page.goto(`${base}/${route}`, {
          waitUntil: 'networkidle',
        });
        check(
          `${route} ${width}: anonymous HTTP 200`,
          response.status() === 200 && page.url() === `${base}/${route}`,
        );
        check(
          `${route} ${width}: one titled h1`,
          (await page
            .getByRole('heading', { level: 1, name: title, exact: true })
            .count()) === 1,
        );
        check(
          `${route} ${width}: no horizontal overflow`,
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        );
        check(
          `${route} ${width}: draft and unapproved effective date visible`,
          (await page
            .getByText('Draft for organizer and legal review', { exact: true })
            .isVisible()) &&
            (await page.getByText('Pending approval', { exact: true }).isVisible()),
        );
        await page.addScriptTag({
          path: require.resolve('axe-core/axe.min.js'),
        });
        const axe = await page.evaluate(() =>
          window.axe.run(document, {
            runOnly: {
              type: 'tag',
              values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
            },
          }),
        );
        fs.writeFileSync(
          path.join(output, `${route}-${width}-axe.json`),
          JSON.stringify(axe, null, 2),
        );
        check(
          `${route} ${width}: axe WCAG A/AA no violations`,
          axe.violations.length === 0,
        );
        if (width === 1440 || width === 390)
          await page.screenshot({
            path: path.join(output, `${route}-${width}.png`),
            fullPage: false,
          });
      }
      const links = await page
        .getByRole('navigation', { name: `${title} contents` })
        .locator('a')
        .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('href')));
      check(
        `${route}: all contents anchors resolve once`,
        await page.evaluate(
          (hrefs) => hrefs.every((h) => document.querySelectorAll(h).length === 1),
          links,
        ),
      );
      await page
        .getByRole('navigation', { name: `${title} contents` })
        .locator('a')
        .last()
        .click();
      check(`${route}: anchor navigation`, new URL(page.url()).hash === '#updates');
      await page.locator('summary').filter({ hasText: 'On this page' }).click();
      check(
        `${route}: contents collapses`,
        !(await page.getByRole('navigation', { name: `${title} contents` }).isVisible()),
      );
      await page.locator('summary').filter({ hasText: 'On this page' }).focus();
      await page.keyboard.press('Enter');
      check(
        `${route}: keyboard expands contents`,
        await page.getByRole('navigation', { name: `${title} contents` }).isVisible(),
      );
      check(
        `${route}: canonical matches configured deployment origin`,
        (await page.locator('link[rel="canonical"]').getAttribute('href')) ===
          `${expectedOrigin}/${route}`,
      );
      check(
        `${route}: reduced motion disables document animation`,
        (await page
          .locator('article')
          .evaluate(
            (n) => getComputedStyle(n.parentElement.parentElement).animationName,
          )) === 'none',
      );
      await page.setViewportSize({ width: 1440, height: 1000 });
      check(
        `${route}: desktop navigation visible before print`,
        await page.getByRole('navigation', { name: 'Main navigation' }).isVisible(),
      );
      await page.emulateMedia({ media: 'print' });
      check(
        `${route}: print hides site navigation`,
        !(await page.getByRole('navigation', { name: 'Main navigation' }).isVisible()),
      );
      check(
        `${route}: print retains document title`,
        await page.getByRole('heading', { level: 1 }).isVisible(),
      );
      await page.pdf({
        path: path.join(output, `${route}.pdf`),
        format: 'A4',
        printBackground: false,
      });
      await page.emulateMedia({ media: 'screen' });
    }
    await page.setViewportSize({ width: 320, height: 1000 });
    for (const route of ['/', '/about', '/login', '/register']) {
      await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
      check(
        `${route}: accessible privacy link`,
        await page
          .getByRole('link', { name: /Privacy Policy/ })
          .first()
          .isVisible(),
      );
      check(
        `${route}: accessible terms link`,
        await page
          .getByRole('link', { name: /Terms of Service/ })
          .first()
          .isVisible(),
      );
      check(
        `${route}: footer links fit mobile`,
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      );
    }
    await page.goto(`${base}/privacy-policy`, { waitUntil: 'networkidle' });
    const publicLinks = await page
      .locator('a[href^="/"]')
      .evaluateAll((nodes) => [...new Set(nodes.map((n) => n.getAttribute('href')))]);
    for (const href of publicLinks) {
      const response = await page.request.get(`${base}${href}`);
      check(
        `public link ${href}: HTTP 200 without sign-in redirect`,
        response.status() === 200 &&
          new URL(response.url()).pathname === new URL(href, base).pathname,
      );
    }
    const robots = await (await page.request.get(`${base}/robots.txt`)).text();
    const sitemap = await (await page.request.get(`${base}/sitemap.xml`)).text();
    check(
      'robots does not disallow legal routes',
      !/Disallow:.*(?:privacy-policy|terms-of-service)/.test(robots),
    );
    check(
      'sitemap includes both policies',
      sitemap.includes('/privacy-policy') && sitemap.includes('/terms-of-service'),
    );
    check('no browser page errors', errors.length === 0);
    fs.writeFileSync(
      path.join(output, 'results.json'),
      JSON.stringify(
        {
          passed: checks.length,
          checks,
          errors,
          mode: 'Local development; no live OAuth or payment collection',
        },
        null,
        2,
      ),
    );
    console.log(`${checks.length} legal page browser checks passed.`);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  fs.writeFileSync(
    path.join(output, 'failure.json'),
    JSON.stringify({ checks, errors, failure: e.message }, null, 2),
  );
  console.error(e);
  process.exitCode = 1;
});
