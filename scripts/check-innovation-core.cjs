const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const output = path.resolve(__dirname, '../tmp/core-v4-qa');
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    hasTouch: true,
  });
  page.setDefaultNavigationTimeout(120000);
  const errors = [],
    consoleErrors = [],
    failedResponses = [],
    checks = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('response', (response) => {
    if (response.status() >= 400)
      failedResponses.push({ url: response.url(), status: response.status() });
  });
  const check = (name, condition = true) => {
    assert.ok(condition, name);
    checks.push(name);
    console.log('PASS', name);
  };
  const button = (name) => page.getByRole('button', { name, exact: true });
  const root = page.locator('[data-selected][data-variant]');
  const scene = page.getByRole('group', {
    name: 'Interactive NIRAL innovation core',
    exact: true,
  });
  const model = page.locator('[data-core-model]');
  const view = () =>
    model.evaluate((e) =>
      [e.style.getPropertyValue('--rx'), e.style.getPropertyValue('--ry')].join('|'),
    );
  async function stable() {
    await page.waitForTimeout(700);
  }
  try {
    await page.goto('http://localhost:3000/register');
    await scene.waitFor();
    await button('Ⅱ Pause motion').click();
    await stable();
    check(
      'correct page and title',
      page.url().includes('/register') && (await page.title()).includes('Create Account'),
    );
    check(
      'V4 core replaces flat composition',
      (await page.getByText('BUILD', { exact: true }).count()) === 0 &&
        (await page.locator('[class*="pcb-traces"]').count()) === 1,
    );
    check(
      'pause stops ambient motion',
      (await root.getAttribute('data-running')) === 'false',
    );
    const before = await view();
    await page.waitForTimeout(1400);
    check('paused rotation remains stationary', (await view()) === before);
    await button('AI Engine').click();
    check(
      'AI hotspot updates panel',
      (await root.getByRole('status').innerText()).includes('AI ENGINE'),
    );
    check(
      'AI module visibly highlights',
      await root
        .locator('[class*="module-ai"]')
        .evaluate((e) => getComputedStyle(e).outlineStyle === 'solid'),
    );
    check('hotspot click does not drag', (await view()) === before);
    await button('IoT Sensors').click();
    check(
      'IoT hotspot updates panel',
      (await root.getByRole('status').innerText()).includes('IoT SENSORS'),
    );
    await button('Core Processor').click();
    check(
      'core hotspot updates panel',
      (await root.getByRole('status').innerText()).includes('NIRAL CORE'),
    );
    await button('Rotate right').click();
    await stable();
    check('rotation button changes orientation', (await view()) !== before);
    await button('Reset view').click();
    await stable();
    check('reset restores default orientation', (await view()) === before);
    await scene.focus();
    await page.keyboard.press('ArrowLeft');
    await stable();
    check('keyboard rotation works', (await view()) !== before);
    await button('Reset view').click();
    await stable();
    const bounds = await scene.boundingBox();
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      bounds.x + bounds.width / 2 + 90,
      bounds.y + bounds.height / 2 + 25,
      { steps: 12 },
    );
    await page.mouse.up();
    await stable();
    check('pointer drag changes orientation', (await view()) !== before);
    await button('Reset view').click();
    await stable();
    const chip = root.locator('[class*="chip-body"]');
    const assembled = await chip.evaluate((e) => getComputedStyle(e).transform);
    await button('✳ Explode').click();
    await stable();
    check(
      'explode visibly separates processor layers',
      (await chip.evaluate((e) => getComputedStyle(e).transform)) !== assembled,
    );
    await button('✳ Assemble').click();
    await stable();
    check(
      'assemble restores processor layer',
      (await chip.evaluate((e) => getComputedStyle(e).transform)) === assembled,
    );
    await page.getByRole('slider', { name: 'Artwork zoom' }).fill('115');
    check(
      'zoom updates model scale',
      (await model.evaluate((e) => e.style.getPropertyValue('--zoom'))) === '1.15',
    );
    await button('Reset view').click();
    check(
      'reset restores zoom',
      (await page.getByRole('slider', { name: 'Artwork zoom' }).inputValue()) === '100',
    );
    await button('▶ Resume motion').click();
    await page.waitForTimeout(1600);
    const moving = await view();
    await page.waitForTimeout(400);
    check('resume restarts automatic rotation', (await view()) !== moving);
    await button('Ⅱ Pause motion').click();
    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await scene.scrollIntoViewIfNeeded();
      await button('Reset view').click();
      await stable();
      check(
        `no page overflow at ${width}px`,
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      );
      const stage = await scene.boundingBox();
      check(`model visible at ${width}px`, stage.width > 250 && stage.height >= 270);
      const board = await root.locator('[class*="board-surface"]').boundingBox();
      check(
        `complete board fits at ${width}px`,
        board.x >= stage.x &&
          board.x + board.width <= stage.x + stage.width &&
          board.y >= stage.y &&
          board.y + board.height <= stage.y + stage.height,
      );
      check(
        `controls have touch targets at ${width}px`,
        await root
          .locator('button')
          .evaluateAll((items) =>
            items.every((b) => b.getBoundingClientRect().height >= 44),
          ),
      );
      await scene.screenshot({ path: path.join(output, `core-${width}.png`) });
      await page.screenshot({
        path: path.join(output, `auth-${width}.png`),
        fullPage: true,
      });
      await button('✳ Explode').click();
      await page.getByRole('slider', { name: 'Artwork zoom' }).fill('115');
      await stable();
      const expanded = await root.locator('[class*="board-surface"]').boundingBox();
      const expandedStage = await scene.boundingBox();
      check(
        `exploded board fits at maximum zoom at ${width}px`,
        expanded.x >= expandedStage.x &&
          expanded.x + expanded.width <= expandedStage.x + expandedStage.width &&
          expanded.y >= expandedStage.y &&
          expanded.y + expanded.height <= expandedStage.y + expandedStage.height,
      );
      for (const part of ['module-ai', 'module-sensor', 'module-cloud']) {
        const moduleBounds = await root.locator(`[class*="${part}"]`).boundingBox();
        check(
          `${part} fits exploded viewport at ${width}px`,
          moduleBounds.x >= expandedStage.x &&
            moduleBounds.x + moduleBounds.width <=
              expandedStage.x + expandedStage.width &&
            moduleBounds.y >= expandedStage.y &&
            moduleBounds.y + moduleBounds.height <=
              expandedStage.y + expandedStage.height,
        );
      }
      await scene.screenshot({ path: path.join(output, `exploded-${width}.png`) });
      await button('Reset view').click();
    }
    await scene.scrollIntoViewIfNeeded();
    await stable();
    const touchBefore = await view(),
      touchBounds = await scene.boundingBox();
    const client = await page.context().newCDPSession(page);
    const x = touchBounds.x + touchBounds.width / 2,
      y = touchBounds.y + touchBounds.height / 2;
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y }],
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: x + 60, y: y + 20 }],
    });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await stable();
    check('touch dragging rotates the model', (await view()) !== touchBefore);
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y }],
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchCancel',
      touchPoints: [],
    });
    check(
      'pointer cancellation clears dragging',
      !(await scene.getAttribute('class')).includes('dragging'),
    );
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await stable();
    check(
      'reduced motion turns ambient animation off',
      (await root.getAttribute('data-reduced')) === 'true' &&
        (await root.getAttribute('data-running')) === 'false',
    );
    check(
      'floating layers stop for reduced motion',
      await root
        .locator('[class*="model-float"]')
        .evaluate((e) => getComputedStyle(e).animationName === 'none'),
    );
    await button('Reset view').click();
    const reducedBefore = await view();
    await button('Rotate left').click();
    await stable();
    check(
      'manual controls still work with reduced motion',
      (await view()) !== reducedBefore,
    );
    await page.getByRole('button', { name: /Start student registration/ }).click();
    await page.getByRole('heading', { name: 'First, tell us about you.' }).waitFor();
    check('registration navigation preserved');
    await page.getByLabel('First name *', { exact: true }).fill('Arjun');
    await page.getByLabel('Display name *', { exact: true }).fill('Arjun');
    await page.getByLabel('Last name *', { exact: true }).fill('Kumar');
    await page.getByLabel('Email address *', { exact: true }).fill('arjun@example.com');
    await page.getByLabel('Mobile number *', { exact: true }).fill('+91 98765 43210');
    await page.getByRole('button', { name: /Continue to academics/ }).click();
    await page.getByRole('heading', { name: 'Where do you study?' }).waitFor();
    check('form entry and Continue remain functional');
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(1200);
    check(
      'public homepage renders without innovation core',
      (await root.count()) === 0 && (await page.locator('main').count()) > 0,
    );
    check('no browser runtime or hydration exceptions', errors.length === 0);
    const unexpected = consoleErrors.filter(
      (s) => !s.includes('401') && !s.includes('Failed to load resource'),
    );
    check('no unexpected console errors', unexpected.length === 0);
    fs.writeFileSync(
      path.join(output, 'results.json'),
      JSON.stringify({ checks, errors, consoleErrors, failedResponses }, null, 2),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
