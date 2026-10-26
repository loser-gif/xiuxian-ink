#!/usr/bin/env node
'use strict';
// Real browser regression for intro timing, input safety and persistent paper.
const fs = require('fs'), path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = process.argv[2] || 'http://127.0.0.1:8766/';
const out = path.resolve(process.argv[3] || 'opening-checks');
fs.mkdirSync(out, { recursive: true });
const checks = [], errors = [];
function check(name, ok, detail) { checks.push({ name, ok: !!ok, detail }); if (!ok) console.error('FAIL', name, detail); }
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXE,
    env: { ...process.env, TEMP: out, TMP: out }, args: ['--disable-http2', '--disable-quic'] });
  async function make(opts = {}) {
    const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1440, height: 900 }, serviceWorkers: 'block', reducedMotion: opts.reduce ? 'reduce' : 'no-preference' });
    await ctx.addInitScript(opts => {
      try { localStorage.setItem('moxian.look', JSON.stringify({ theme: opts.theme || 'day', motion: opts.lite ? 'lite' : 'full', font: 'md' })); } catch (e) {}
      if (opts.blockStorage) {
        Storage.prototype.getItem = Storage.prototype.setItem = () => { throw new DOMException('Storage blocked', 'SecurityError'); };
      }
      window.__introTimes = {};
      const watch = new MutationObserver(() => {
        if (!document.body) return;
        if (document.body.classList.contains('ink-opening') && !window.__introTimes.start) window.__introTimes.start = performance.now();
        if (document.body.classList.contains('voyage-live') && !window.__introTimes.end) window.__introTimes.end = performance.now();
      });
      watch.observe(document, { subtree: true, attributes: true, attributeFilter: ['class'] });
    }, opts);
    const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.goto(url, { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => window.__introTimes.start);
    return { ctx, p };
  }
  async function done(p) {
    await p.waitForFunction(() => document.body.classList.contains('voyage-live'));
    return p.evaluate(() => ({ ms: __introTimes.end - __introTimes.start, mode: document.documentElement.dataset.openingMode,
      screen: document.body.dataset.screen, busy: document.querySelector('#scr-title').getAttribute('aria-busy'), disabled: document.querySelector('#btn-new').disabled,
      skip: document.querySelector('#intro-skip').hidden, seen: (() => { try { return localStorage.getItem('moxian.openingSeen'); } catch (e) { return null; } })() }));
  }
  try {
    const { ctx, p } = await make();
    await p.waitForTimeout(250);
    const early = await p.evaluate(() => ({ title: getComputedStyle(document.querySelector('.tch b')).opacity, menu: getComputedStyle(document.querySelector('.title-menu')).opacity, seal: getComputedStyle(document.querySelector('.seal-title')).opacity, disabled: document.querySelector('#btn-new').disabled, skip: !document.querySelector('#intro-skip').hidden }));
    check('paper-before-title-menu-seal', early.title === '0' && early.menu === '0' && early.seal === '0' && early.disabled && early.skip, early);
    await p.screenshot({ path: path.join(out, '01-paper.jpg'), type: 'jpeg', quality: 85 });
    await p.waitForFunction(() => performance.now() - __introTimes.start >= 2400);
    const mid = await p.evaluate(() => ({ title: +getComputedStyle(document.querySelector('.tch b')).opacity, menu: +getComputedStyle(document.querySelector('.title-menu')).opacity, seal: +getComputedStyle(document.querySelector('.seal-title')).opacity, mountain: +getComputedStyle(document.querySelector('.mtn')).opacity }));
    check('mountains-and-title-before-seal-menu', mid.title > .5 && mid.mountain > .5 && mid.menu === 0 && mid.seal === 0, mid);
    await p.screenshot({ path: path.join(out, '02-ink.jpg'), type: 'jpeg', quality: 85 });
    const first = await done(p);
    check('first-5.6s-unlocks-and-remembers', first.ms >= 5500 && first.ms < 6900 && first.mode === 'first' && !first.disabled && first.busy === 'false' && first.skip && first.seen === '1', first);
    await p.screenshot({ path: path.join(out, '03-menu.jpg'), type: 'jpeg', quality: 85 });
    await p.evaluate(() => { window.__paper = document.querySelector('#paper canvas'); window.__washCount = 0; const old = FX.wash; FX.wash = (...args) => { __washCount++; return old(...args); }; });
    await p.locator('#btn-new').click(); await p.locator('#inp-name').waitFor();
    check('menu-to-create-same-paper-no-wash', await p.evaluate(() => __paper === document.querySelector('#paper canvas') && __washCount === 0));
    await p.evaluate(() => { __moxian.newGame('听山', { lg: LINGGEN.find(x => x.id === 'san'), els: ['金', '木', '火'], wx: 5, luck: 1 }, { id: 'dx' }, 'qingshi'); __moxian.S.flags.guide = 0; Life.setGoal(__moxian.S, 'wendao', false); __moxian.render(); __moxian.save(); });
    await p.waitForFunction(() => document.body.dataset.screen === 'main' && !__moxian.busy); await p.waitForTimeout(500);
    check('create-to-main-same-paper-no-wash', await p.evaluate(() => __paper === document.querySelector('#paper canvas') && __washCount === 0 && !document.body.classList.contains('paper-turning')));
    await p.reload(); await p.waitForFunction(() => window.__introTimes.start); const again = await done(p);
    check('return-under-1.5s', again.mode === 'return' && again.ms >= 800 && again.ms < 1500, again);
    await p.locator('#btn-continue').click(); await p.waitForFunction(() => document.body.dataset.screen === 'main' && !__moxian.busy);
    check('saved-character-continues', await p.evaluate(() => __moxian.S.name === '听山' && __moxian.S.v === 16));
    await ctx.close();
    for (const key of ['pointer', 'Enter', 'Escape', 'Space', 'accessible-click']) {
      const {ctx, p} = await make();
      if (key === 'pointer') { const r = await p.locator('#btn-new').boundingBox(); await p.mouse.click(r.x + r.width / 2, r.y + r.height / 2); }
      else if (key === 'accessible-click') await p.locator('#intro-skip').evaluate(el => { el.focus(); el.click(); });
      else await p.keyboard.press(key);
      const state = await done(p); await p.waitForTimeout(350);
      check('skip-' + key + '-no-click-through', state.ms < 1500 && state.screen === 'title' && !state.disabled && state.skip && await p.evaluate(() => document.body.dataset.screen === 'title'), state);
      if (key === 'accessible-click') check('skip-focus-returns-to-menu', await p.locator('#btn-new').evaluate(el => el === document.activeElement));
      await p.locator('#btn-new').click(); await p.locator('#inp-name').waitFor();
      check('skip-' + key + '-next-click-works', await p.evaluate(() => document.body.dataset.screen === 'create'));
      await ctx.close();
    }
    for (const opt of [{reduce:true}, {lite:true}, {blockStorage:true}]) {
      const {ctx, p} = await make(opt);
      if (opt.blockStorage) await p.keyboard.press('Escape');
      const state = await done(p);
      check('quiet-or-storage-' + Object.keys(opt)[0], state.ms < 1500 && !state.disabled && state.skip && (opt.blockStorage || state.mode === 'quiet'), state);
      if (!opt.blockStorage) {
        const a = await p.locator('#scenery .cam').evaluate(el => getComputedStyle(el).transform); await p.waitForTimeout(300);
        check('quiet-camera-still-' + Object.keys(opt)[0], a === await p.locator('#scenery .cam').evaluate(el => getComputedStyle(el).transform));
      }
      await ctx.close();
    }
    for (const why of ['hidden', 'reduce']) {
      const {ctx, p} = await make();
      if (why === 'hidden') await p.evaluate(() => { Object.defineProperty(document, 'hidden', {configurable:true,value:true}); document.dispatchEvent(new Event('visibilitychange')); });
      else await p.emulateMedia({reducedMotion:'reduce'});
      const state = await done(p); check('interrupt-' + why + '-unlocks', state.ms < 1500 && !state.disabled && state.skip, state); await ctx.close();
    }
    for (const theme of ['day', 'night']) {
      const {ctx, p} = await make({viewport:{width:440,height:956}, theme});
      await p.waitForTimeout(1000); await p.setViewportSize({width:375,height:812}); await p.waitForTimeout(500); await p.setViewportSize({width:440,height:956});
      await done(p); await p.waitForTimeout(200);
      const bounds = await p.evaluate(() => ({ w:innerWidth, sw:document.documentElement.scrollWidth,h:innerHeight,sh:document.documentElement.scrollHeight,buttons:[...document.querySelectorAll('.title-menu button')].filter(e=>!e.hidden).map(e=>{const r=e.getBoundingClientRect();return[r.x,r.y,r.right,r.bottom];}) }));
      check('mobile-' + theme + '-resize-stable', bounds.sw <= bounds.w && bounds.sh <= bounds.h && bounds.buttons.every(r=>r[0]>=0&&r[1]>=0&&r[2]<=bounds.w&&r[3]<=bounds.h), bounds);
      await p.screenshot({path:path.join(out,'mobile-'+theme+'.jpg'),type:'jpeg',quality:88}); await ctx.close();
    }
    check('no-page-errors', errors.length === 0, errors);
  } finally { await browser.close(); fs.writeFileSync(path.join(out,'checks.json'), JSON.stringify({checks,errors},null,2)); }
  console.log(checks.filter(c=>c.ok).length + '/' + checks.length + ' checks passed');
  if (checks.some(c=>!c.ok)||errors.length) process.exitCode=1;
})().catch(e => { console.error(e); process.exitCode=1; });
