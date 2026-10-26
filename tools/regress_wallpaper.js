#!/usr/bin/env node
'use strict';
// Pass a served game URL and an output directory. Uses an isolated test character.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = process.argv[2] || 'http://127.0.0.1:8766/';
const out = path.resolve(process.argv[3] || 'wallpaper-checks');
fs.mkdirSync(out, { recursive: true });
const checks = [], errors = [];
function check(name, ok, detail) { checks.push({ name, ok: !!ok, detail }); if (!ok) console.error('FAIL', name); }
async function snap(p) {
  const data = await p.evaluate(() => {
    const cv = document.querySelector('.play-mist'), r = document.querySelector('#log').getBoundingClientRect();
    return { fog: cv.toDataURL(), bitmap: [cv.width, cv.height], live: document.documentElement.dataset.liveWallpaper,
      boat: getComputedStyle(document.querySelector('.play-boat-track')).transform,
      branch: getComputedStyle(document.querySelector('.journal-head'), '::before').transform,
      rect: [r.x, r.y, r.width, r.height] };
  });
  data.fog = crypto.createHash('sha256').update(data.fog).digest('hex'); return data;
}
async function frozen(p, label) {
  await p.waitForTimeout(150); const a = await snap(p); await p.waitForTimeout(400); const b = await snap(p);
  check(label, b.live === 'off' && a.fog === b.fog && a.boat === b.boat && a.branch === b.branch, { a, b });
}
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXE,
    env: { ...process.env, TEMP: out, TMP: out }, args: ['--disable-http2', '--disable-quic'] });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
    await ctx.addInitScript(() => localStorage.setItem('moxian.look', JSON.stringify({ theme: 'day', motion: 'full', font: 'md' })));
    const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.goto(url, { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => window.__moxian && document.body.classList.contains('voyage-live'));
    await p.waitForTimeout(1000); await p.locator('#btn-new').click(); await p.locator('#inp-name').waitFor();
    await p.evaluate(() => {
      __moxian.newGame('山水客', { lg: LINGGEN.find(x => x.id === 'san'), els: ['金', '木', '火'], wx: 5, luck: 1 }, { id: 'dx' }, 'qingshi');
      __moxian.S.flags.guide = 0; Life.setGoal(__moxian.S, 'wendao', false); __moxian.render(); __moxian.save();
    });
    await p.waitForFunction(() => document.body.dataset.screen === 'main' && !__moxian.busy);
    await p.waitForTimeout(7000); // Let initial ink-writing finish before checking text geometry.
    const a = await snap(p); await p.waitForTimeout(1200); const b = await snap(p);
    check('fog-boat-branch-move', a.fog !== b.fog && a.boat !== b.boat && a.branch !== b.branch && b.live === 'on');
    check('reading-area-stable', JSON.stringify(a.rect) === JSON.stringify(b.rect));
    await p.evaluate(() => __moxian.applyLook({ motion: 'lite' })); await frozen(p, 'lite-freezes');
    await p.evaluate(() => __moxian.applyLook({ motion: 'full' }));
    await p.emulateMedia({ reducedMotion: 'reduce' }); await frozen(p, 'system-reduce-freezes');
    await p.emulateMedia({ reducedMotion: 'no-preference' });
    await p.evaluate(() => { document.documentElement.dataset.fx = 'thin'; }); await frozen(p, 'automatic-thin-freezes');
    await p.evaluate(() => __moxian.applyLook({ motion: 'full' }));
    // Synthetic visibility event exercises the hidden-tab handler without freezing the test runner.
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await frozen(p, 'hidden-handler-freezes');
    await p.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
    await p.waitForFunction(() => document.documentElement.dataset.liveWallpaper === 'on');
    await p.locator('#play-menu').click(); await p.locator('[data-m="title"]').click();
    await p.waitForFunction(() => document.body.dataset.screen === 'title'); await frozen(p, 'return-to-title-freezes-main');
    check('title-wallpaper-preserved', await p.locator('#scenery .boat').isVisible());
    await p.locator('#btn-continue').click(); await p.waitForFunction(() => document.body.dataset.screen === 'main' && !__moxian.busy);
    await p.waitForFunction(() => document.documentElement.dataset.liveWallpaper === 'on');
    const resumed = await snap(p); await p.waitForTimeout(400);
    check('resume-restarts-fog', resumed.fog !== (await snap(p)).fog);
    for (const [w, h] of [[1440, 900], [1280, 720], [440, 956], [375, 812], [844, 390]]) {
      await p.setViewportSize({ width: w, height: h });
      for (const theme of ['day', 'night']) {
        await p.evaluate(theme => __moxian.applyLook({ theme }), theme); await p.waitForTimeout(500);
        const g = await p.evaluate(() => ({ width: innerWidth, height: innerHeight, sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight,
          bitmap: [document.querySelector('.play-mist').width, document.querySelector('.play-mist').height],
          blocked: document.elementFromPoint(innerWidth / 2, innerHeight / 2).closest('.play-landscape') !== null,
          actions: [...document.querySelectorAll('.act')].map(e => { const r = e.getBoundingClientRect(); return [r.top, r.bottom]; }) }));
        check(w + 'x' + h + '-' + theme, g.sw <= w && g.sh <= h && g.bitmap[0] <= 512 && !g.blocked && g.actions.every(r => r[0] >= 0 && r[1] <= h), g);
        if (w === 1440 || w === 440) await p.screenshot({ path: path.join(out, w + '-' + theme + '.jpg'), type: 'jpeg', quality: 82 });
      }
    }
    await p.setViewportSize({ width: 440, height: 956 });
    await p.locator('#play-tab-cult').click(); await p.locator('#side-cult').click(); await p.locator('#sheet.open').waitFor();
    check('mobile-cult-operable', await p.locator('#sheet-title').innerText() === '功法');
    await p.keyboard.press('Escape'); await p.locator('#sheet').waitFor({ state: 'hidden' });
    await p.locator('#play-tab-log').click(); await p.locator('#hud-toggle').click();
    check('mobile-details-operable', await p.locator('#hud-toggle').getAttribute('aria-expanded') === 'true');
    await p.locator('#hud-toggle').click(); await p.locator('.act[data-act="bag"]').click(); await p.locator('#sheet.open').waitFor();
    check('bag-operable', await p.locator('#sheet-body').isVisible());
    const high = await browser.newContext({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 3, serviceWorkers: 'block', storageState: await ctx.storageState() });
    const hp = await high.newPage(); hp.on('pageerror', e => errors.push(e.message)); await hp.goto(url);
    await hp.waitForFunction(() => window.__moxian && document.body.classList.contains('voyage-live')); await hp.waitForTimeout(1000);
    await hp.locator('#btn-continue').click(); await hp.waitForFunction(() => document.body.dataset.screen === 'main'); await hp.waitForTimeout(500);
    const hi = await snap(hp); check('DPR3-canvas-budget', hi.bitmap[0] === 110 && hi.bitmap[1] === 239, hi.bitmap);
    check('no-page-errors', errors.length === 0, errors);
    await high.close(); await ctx.close();
  } finally {
    await browser.close(); fs.writeFileSync(path.join(out, 'checks.json'), JSON.stringify({ checks, errors }, null, 2));
  }
  console.log(checks.filter(x => x.ok).length + '/' + checks.length + ' checks passed');
  if (checks.some(x => !x.ok) || errors.length) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
