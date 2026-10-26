/** NIRAL public UI smoke tests. Requires @playwright/test and running web server.
 * e.g. $env:BASE_URL='http://localhost:3000'; npx playwright test public-ui-qa.spec.ts
 * Copy into existing Playwright test tree, or run via your current config.
 */
import { test, expect } from '@playwright/test';

const routes = ['/', '/about', '/participate', '/tracks', '/problems', '/schedule', '/rules', '/updates', '/faq', '/contact'];
const widths = [1440, 1024, 768, 390, 360];
const baseURL = process.env.BASE_URL || 'http://localhost:3000';

for (const width of widths) {
  test.describe(`public routes at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });
    for (const route of routes) {
      test(`${route}: loads and fits viewport`, async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(e.message));
        const response = await page.goto(`${baseURL}${route}`, { waitUntil: 'domcontentloaded' });
        expect(response?.status(), `HTTP status for ${route}`).toBeLessThan(400);
        await expect(page.locator('main').first()).toBeVisible();
        await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `Horizontal overflow on ${route} at ${width}px`).toBeLessThanOrEqual(2);
        expect(errors, `Uncaught JS errors on ${route}`).toEqual([]);
        await page.screenshot({ path: `test-results/niral-${route === '/' ? 'home' : route.slice(1)}-${width}.png`, fullPage: true });
      });
    }
  });
}

test('About illustration labels remain visible and on top', async ({ page }) => {
  await page.goto(`${baseURL}/about`, { waitUntil: 'domcontentloaded' });
  for (const label of ['Ideas', 'Build', 'Innovate', 'Collaborate']) {
    const badge = page.getByRole('button', { name: label, exact: true }).first();
    await badge.scrollIntoViewIfNeeded();
    await expect(badge).toBeVisible();
    const hit = await badge.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const target = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      return target === node || (target instanceof Node && node.contains(target));
    });
    expect(hit, `${label} is covered by an overlapping element`).toBe(true);
    await badge.click();
    await expect(badge).toHaveAttribute('aria-pressed', 'true');
  }
});
