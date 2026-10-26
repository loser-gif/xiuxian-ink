#!/usr/bin/env node
'use strict';
// Browser layout regression. Uses an isolated test character, not a natural full playthrough.
// PLAYWRIGHT_MODULE may point to an existing installation; no game dependency is added.
const fs = require('fs'), path = require('path'), http = require('http'), assert = require('assert');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const out = path.resolve(process.argv[2] || path.join(root, 'desktop-checks'));
fs.mkdirSync(out, { recursive: true });
const checks = [], errors = [];
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.join(root, rel === '/' ? 'index.html' : rel);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
});
function check(name, ok, detail) {
  checks.push({ name, ok: !!ok, detail });
  if (!ok) console.error('FAIL', name, JSON.stringify(detail));
}
async function shot(page, name) {
  await page.waitForTimeout(550); // Let paper/ink entry transitions settle before recording evidence.
  await page.screenshot({ path: path.join(out, name + '.jpg'), type: 'jpeg', quality: 82 });
}
async function ready(page) {
  await page.waitForFunction(() => window.__moxian && !__moxian.busy, null, { timeout: 8000 });
}
async function rect(page, selector) {
  return page.locator(selector).evaluate(e => {
    const r = e.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom, right: r.right, sh: e.scrollHeight, ch: e.clientHeight };
  });
}
async function fixture(page) {
  await page.locator('#btn-new').click();
  await page.locator('#inp-name').waitFor();
  await page.evaluate(() => {
    __moxian.newGame('验收客', { lg: LINGGEN.find(x => x.id === 'san'), els: ['金', '木', '火'], wx: 5, luck: 1 }, { id: 'dx' }, 'qingshi');
    __moxian.S.flags.guide = 0;
    Life.setGoal(__moxian.S, 'wendao', false);
    __moxian.render(); __moxian.save();
  });
  await ready(page);
  await page.waitForFunction(() => document.body.dataset.screen === 'main', null, { timeout: 10000 });
  await page.waitForTimeout(650);
}
async function duelGeometry(page, label) {
  const g = await page.evaluate(() => {
    const d = document.getElementById('duel');
    const names = ['duel-oname', 'duel-tell', 'duel-mname', 'duel-moves'];
    return { scroll: d.scrollTop, height: d.clientHeight, scrollHeight: d.scrollHeight,
      parts: names.map(id => { const r = document.getElementById(id).getBoundingClientRect(); return { id, top: r.top, bottom: r.bottom, height: r.height }; }),
      shade: document.querySelector('.duel-shade').getBoundingClientRect().bottom };
  });
  check(label, g.scroll === 0 && g.scrollHeight <= g.height + 2 && g.parts.every(r => r.top >= 0 && r.bottom <= g.height + 1) && g.shade >= g.height, g);
}
async function fight(page, label, full) {
  await page.evaluate(() => {
    const tell = __moxian.Core.duelTell;
    __moxian.Core.duelTell = d => { const result = tell(d); window.__testDuelNext = d.next; return result; };
    __moxian.startDabi();
  });
  await page.locator('#duel-moves.on').waitFor({ timeout: 10000 });
  await duelGeometry(page, label + '-initial');
  await page.keyboard.press('ArrowRight');
  await duelGeometry(page, label + '-keyboard');
  // Reproduces the old automation/focus-scroll report; do not call this mouse-only reproduction.
  await page.locator('#duel-moves [data-m="gong"]').evaluate(e => e.scrollIntoView({ block: 'center' }));
  await duelGeometry(page, label + '-center-scroll');
  await shot(page, label + '-duel');
  if (!full) return;
  let nextMatches = 0;
  for (let n = 0; n < 30; n++) {
    await page.waitForFunction(() => document.querySelector('#duel').hidden || !document.querySelector('#duel-next').hidden || document.querySelector('#duel-moves').classList.contains('on'), null, { timeout: 10000 });
    if (await page.locator('#duel').evaluate(e => e.hidden)) break;
    if (await page.locator('#duel-next').isVisible()) {
      const again = (await page.locator('#duel-next').innerText()).includes('再战');
      await shot(page, label + '-result-' + nextMatches);
      await page.locator('#duel-next').click();
      if (again) {
        nextMatches++;
        await page.locator('#duel-moves.on').waitFor({ timeout: 10000 });
        await duelGeometry(page, label + '-next-' + nextMatches);
      } else {
        await page.locator('#duel').waitFor({ state: 'hidden', timeout: 5000 });
        break;
      }
    } else {
      // White-box layout test: select the counter to exercise multiple matches without a long playthrough.
      const move = await page.evaluate(() => ({ gong: 'shou', shou: 'shu', shu: 'gong', qi: 'gong' }[window.__testDuelNext]));
      await page.locator('#duel-moves [data-m="' + move + '"]').click();
    }
  }
  check(label + '-tournament-returns', await page.locator('#duel').evaluate(e => e.hidden), { nextMatches });
  await ready(page);
  check(label + '-tournament-recorded', await page.evaluate(() => __moxian.S.sect.dabiN > 0));
}
async function smoke(page, label, size) {
  const main = await rect(page, '#scr-main');
  check(label + '-main-width', main.right <= size.width + 1, main);
  await shot(page, label + '-main');
  if (size.width < 1000) {
    // The mobile summary tabs expose the same live panels as the desktop side column.
    for (const [tab, panel, title] of [['cult', 'side-cult', '功法'], ['sect', 'side-sect', '丹霞谷']]) {
      await page.locator('#play-tab-' + tab).click();
      check(label + '-tab-' + tab, await page.locator('#' + panel).isVisible());
      await page.locator('#' + panel).click();
      await page.locator('#sheet.open').waitFor();
      check(label + '-panel-' + tab, (await page.locator('#sheet-title').innerText()) === title);
      await page.keyboard.press('Escape');
      await page.locator('#sheet').waitFor({ state: 'hidden' });
    }
    await page.locator('#play-tab-trace').click();
    await page.locator('#play-traces').click();
    await page.locator('#sheet.open').waitFor();
    check(label + '-trace-panel', (await page.locator('#sheet-title').innerText()) === '行迹');
    await page.keyboard.press('Escape');
    await page.locator('#sheet').waitFor({ state: 'hidden' });
    await page.locator('#play-tab-log').click();
    await page.locator('#play-tab-log').focus();
    await page.keyboard.press('ArrowRight');
    check(label + '-keyboard-tab', (await page.locator('#play-tab-cult').getAttribute('aria-selected')) === 'true');
    await page.keyboard.press('Home');
    await page.locator('#hud-toggle').click();
    check(label + '-details-expand', await page.locator('#next-line').isVisible());
    await shot(page, label + '-details');
    await page.locator('#hud-toggle').click();
    await page.locator('#play-settings').click();
    await page.locator('#sheet.open').waitFor();
    check(label + '-settings', (await page.locator('#sheet-title').innerText()) === '纸墨');
    await page.keyboard.press('Escape');
    await page.locator('#sheet').waitFor({ state: 'hidden' });
  }
  await page.locator('.act[data-act="bag"]').click();
  await page.locator('#sheet.open').waitFor();
  await page.waitForTimeout(650);
  const bag = await rect(page, '.sheet-panel');
  check(label + '-bag-bounds', bag.y >= -1 && bag.bottom <= size.height + 1, bag);
  await shot(page, label + '-bag');
  await page.keyboard.press('Escape');
  await page.locator('#sheet').waitFor({ state: 'hidden' });
  await ready(page);
  // Long content is a test fixture. Check actual wheel scrolling, not only box dimensions.
  await page.evaluate(() => {
    Object.keys(ITEM_VAL).forEach(key => { __moxian.S.items[key] = 2; });
    for (let i = 0; i < 45; i++) __moxian.pushLog({ text: '山泉冷冷，与呼吸同律。一年一月光阴，在一吸一呼间流走。' });
    __moxian.render();
  });
  await page.locator('.act[data-act="bag"]').click();
  await page.waitForTimeout(650);
  await page.locator('#sheet-body').hover();
  await page.mouse.wheel(0, 12000);
  await page.waitForTimeout(400);
  const inv = await page.locator('#sheet-body').evaluate(e => ({ top: e.scrollTop, height: e.clientHeight, scroll: e.scrollHeight }));
  check(label + '-long-bag-scrolls', inv.top > 0 && inv.top + inv.height >= inv.scroll - 2, inv);
  await shot(page, label + '-bag-long');
  await page.keyboard.press('Escape');
  await page.locator('#sheet').waitFor({ state: 'hidden' });
  await page.locator('#log').hover();
  await page.mouse.wheel(0, -20000);
  await page.waitForTimeout(400);
  check(label + '-journal-start-reachable', (await page.locator('#log').evaluate(e => e.scrollTop)) === 0);
  await page.mouse.wheel(0, 20000);
  await page.waitForTimeout(400);
  const log = await page.locator('#log').evaluate(e => ({ top: e.scrollTop, height: e.clientHeight, scroll: e.scrollHeight }));
  check(label + '-journal-end-reachable', log.top > 0 && log.top + log.height >= log.scroll - 2, log);
  const oldLocation = await page.evaluate(() => __moxian.S.loc);
  await page.locator('.act[data-act="youli"]').click();
  await page.locator('.map-tag').first().waitFor();
  const map = await rect(page, '.map-scroll-wrap');
  check(label + '-map-not-collapsed', map.width > Math.min(300, size.width - 40), map);
  await page.locator('.map-tag').nth(1).click();
  await shot(page, label + '-map');
  await page.locator('.mc-btn.on').click();
  await page.locator('#map').waitFor({ state: 'hidden' });
  await ready(page);
  check(label + '-travel-changes-location', (await page.evaluate(() => __moxian.S.loc)) !== oldLocation);
  // Use the existing wish picker to check scroll reachability and its fixed confirmation footer.
  await page.evaluate(() => { __moxian.openGoalPicker(); });
  await page.locator('#goal-opts .path-opt').last().click();
  const wish = await rect(page, '#goal-confirm');
  check(label + '-wish-confirm-reachable', wish.y >= 0 && wish.bottom <= size.height, wish);
  await shot(page, label + '-wish');
  await page.locator('#goal-confirm').click();
  await page.waitForFunction(() => document.querySelector('#goal-cer').hidden, null, { timeout: 5000 });
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXE || undefined, env: { ...process.env, TEMP: out, TMP: out } });
  try {
    const base = 'http://127.0.0.1:' + server.address().port;
    const sizes = process.env.QUICK ? [[1280, 720]] : [[1280, 720], [1366, 768], [1920, 1080], [1280, 800], [1440, 900], [440, 956, 3], [390, 844], [375, 812]];
    for (const [width, height, dpr] of sizes) for (const theme of (process.env.QUICK ? ['day'] : ['day', 'night'])) {
      const label = width + 'x' + height + '-' + theme;
      console.log('CHECK', label);
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr || 1, serviceWorkers: 'block' });
      await context.addInitScript(theme => localStorage.setItem('moxian.look', JSON.stringify({ theme, font: 'md', motion: 'full' })), theme);
      const page = await context.newPage(); page.setDefaultTimeout(10000);
      page.on('pageerror', e => errors.push({ label, message: e.message }));
      try {
        await page.goto(base);
        await page.waitForFunction(() => window.__moxian && document.body.classList.contains('voyage-live'), null, { timeout: 15000 });
        // The intro deliberately swallows the gesture which skipped it, for 480 ms after it ends.
        await page.waitForTimeout(600);
        await page.evaluate(() => document.fonts.ready);
        await shot(page, label + '-title');
        await fixture(page);
        await smoke(page, label, { width, height });
        await fight(page, label, width >= 1280 && [720, 768, 1080].includes(height) && theme === 'day');
      } catch (e) { check(label + '-flow', false, e.stack); await shot(page, label + '-failure'); }
      await context.close();
    }
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
  check('no-browser-exceptions', !errors.length, errors);
  fs.writeFileSync(path.join(out, 'checks.json'), JSON.stringify({ checks, errors }, null, 2));
  console.log(checks.filter(c => c.ok).length + '/' + checks.length + ' passed');
  assert(checks.every(c => c.ok), 'Desktop regression failed; see checks.json');
})().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
