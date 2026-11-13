import { test, expect } from '@playwright/test';

// These scenarios need a real browser: jsdom always resolves window.top to the
// same window object, so it can't exercise genuine cross-origin/cross-window
// trust decisions the way these tests do.

const ORIGIN_A = 'http://localhost:5101';
const ORIGIN_B = 'http://localhost:5102';

test('a same-window message (extension bridge) is trusted', async ({ page }) => {
    await page.goto(`${ORIGIN_A}/e2e/fixtures/host.html`);

    await page.evaluate(() => window.__triggerSelfMessage('proctorKickedOut', { offset: 1, legit: true }));

    await expect(page.locator('#log')).toContainText('proctorKickedOut:{"offset":1,"legit":true}');
});

test('a cross-origin window reference is rejected, legitimate origin still works', async ({ page }) => {
    await page.goto(`${ORIGIN_B}/e2e/fixtures/attacker.html`);

    const popupPromise = page.waitForEvent('popup');
    await page.evaluate((url) => window.__openTarget(url), `${ORIGIN_A}/e2e/fixtures/host.html`);
    const popup = await popupPromise;
    await popup.waitForLoadState();

    await page.evaluate(() => window.__attack('proctorKickedOut', { offset: 999, injected: true }));

    // Give the (would-be) handler a moment to fire, then confirm it didn't.
    await popup.waitForTimeout(200);
    await expect(popup.locator('#log')).not.toContainText('injected');

    // The legitimate same-window path on this very same page still works.
    await popup.evaluate(() => window.__triggerSelfMessage('proctorKickedOut', { offset: 1, legit: true }));
    await expect(popup.locator('#log')).toContainText('legit');
});

test('an embedded cross-origin iframe trusts its configured parentOrigin', async ({ page }) => {
    const childSrc = `${ORIGIN_B}/e2e/fixtures/iframe-child.html?parentOrigin=${encodeURIComponent(ORIGIN_A)}`;
    await page.goto(`${ORIGIN_A}/e2e/fixtures/iframe-host.html?childSrc=${encodeURIComponent(childSrc)}`);

    // The connectionInit broadcast (500ms interval) reaches the real top frame.
    await expect(page.locator('#log')).toContainText(`connectionInit(${ORIGIN_B})`, { timeout: 2000 });

    // The proctorio_status handshake round-trips through the real window.top.
    // (childSrc is itself embedded in the parent page's own URL as a query
    // param, so excluding the main frame avoids matching that instead.)
    const childFrame = page.frames().find((frame) => frame !== page.mainFrame() && frame.url().includes('iframe-child'));
    await childFrame.waitForLoadState('load');
    await childFrame.evaluate(() => window.__requestStatus());

    await expect(page.frameLocator('#child').locator('#log')).toContainText('"active":true');
});

test('an embedded cross-origin iframe without parentOrigin throws instead of silently broadcasting to itself', async ({ page }) => {
    const childSrc = `${ORIGIN_B}/e2e/fixtures/iframe-child-no-origin.html`;
    await page.goto(`${ORIGIN_A}/e2e/fixtures/iframe-host.html?childSrc=${encodeURIComponent(childSrc)}`);

    await expect(page.frameLocator('#child').locator('#log')).toContainText('threw:');

    // The connectionInit interval must never have started broadcasting to its
    // own (wrong) origin - give it more than one 500ms tick to prove that.
    await page.waitForTimeout(600);
    await expect(page.locator('#log')).not.toContainText('connectionInit');
});
