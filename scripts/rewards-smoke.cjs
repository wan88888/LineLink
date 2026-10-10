const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const url = process.env.TEST_URL || 'http://127.0.0.1:5726';

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Shanghai', reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.install({ time: new Date('2026-10-10T23:59:58+08:00') });
    await page.clock.pauseAt(new Date('2026-10-10T23:59:58+08:00'));
    await page.goto(url);
    assert.equal(await page.locator('#settings-btn svg').count(), 1);
    assert.equal(await page.locator('.reward-day').count(), 7);
    for (const [width, height] of [[390, 844], [320, 568], [844, 390], [1280, 900]]) {
      await page.setViewportSize({ width, height });
      for (const selector of ['#play-btn', '#home-help-btn', '#select-btn', '#claim-btn']) {
        const box = await page.locator(selector).boundingBox();
        assert(box.y >= 0 && box.y + box.height <= height, `${selector} clipped at ${width}x${height}`);
      }
      assert(await page.locator('#home-page').evaluate(el => el.scrollWidth <= el.clientWidth), 'horizontal overflow');
      await page.screenshot({ path: `/tmp/linelink-rewards-${width}.png` });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    const second = await context.newPage();
    await second.clock.install({ time: new Date('2026-10-10T23:59:58+08:00') });
    await second.clock.pauseAt(new Date('2026-10-10T23:59:58+08:00'));
    await second.goto(url);
    await Promise.all([page, second].map(tab => tab.locator('#claim-btn').evaluate(button => button.click())));
    await page.waitForFunction(() => document.querySelector('#ink-balance').textContent === '10');
    await second.waitForFunction(() => document.querySelector('#ink-balance').textContent === '10');
    assert(await page.locator('#claim-btn').isDisabled());
    assert.equal(await page.locator('#star-value').innerText(), '0', 'daily rewards must not change level stars');
    await page.reload();
    assert.equal(await page.locator('#ink-balance').innerText(), '10');
    assert(await page.locator('#claim-btn').isDisabled());
    await page.clock.fastForward(3000);
    await page.waitForFunction(() => !document.querySelector('#claim-btn').disabled);
    assert.match(await page.locator('#claim-btn').innerText(), /15/);
    await page.locator('#claim-btn').click();
    await page.waitForFunction(() => document.querySelector('#ink-balance').textContent === '25');
    await second.close();

    await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('linelink-daily-v1'));
      state.balance = 100;
      localStorage.setItem('linelink-daily-v1', JSON.stringify(state));
      window.dispatchEvent(new Event('focus'));
    });
    await page.locator('#settings-btn').click();
    await page.locator('#amber-theme-btn').click();
    await page.waitForFunction(() => document.documentElement.dataset.homeTheme === 'amber');
    assert.equal(await page.locator('#ink-balance').innerText(), '0');
    await page.locator('#mint-theme-btn').click();
    await page.waitForFunction(() => document.documentElement.dataset.homeTheme === 'mint');
    await page.locator('#amber-theme-btn').click();
    await page.getByRole('button', { name: '完成', exact: true }).click();
    await page.reload();
    assert.equal(await page.locator('html').getAttribute('data-home-theme'), 'amber');
    assert.equal(await page.locator('#ink-balance').innerText(), '0');
    await page.screenshot({ path: '/tmp/linelink-rewards-amber.png' });
    assert.deepEqual(errors, []);
    console.log('PASS: SVG gear, responsive home, cross-tab single claim, saved rewards, midnight refresh, separate stars, theme purchase and persistence');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
