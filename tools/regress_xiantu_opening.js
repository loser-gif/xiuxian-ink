#!/usr/bin/env node
'use strict';
// Real Chrome checks for the mountain-gate opening. Viewports are emulated, not a physical iPhone.
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');

const url = process.argv[2] || 'http://127.0.0.1:8765/';
const out = path.resolve(process.argv[3] || '/opt/cursor/artifacts/xiantu');
fs.mkdirSync(out, { recursive: true });
const checks = [];
const errors = [];
function check(name, ok, detail) {
  checks.push({ name, ok: !!ok, detail: detail === undefined ? null : detail });
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail === undefined ? '' : ' ' + JSON.stringify(detail).slice(0, 400)));
  if (!ok) errors.push(name);
}

const roll = () => ({ lg: global.LINGGEN.find(x => x.id === 'san'), els: ['金', '木', '火'], wx: 5, luck: 1 });

async function boot(browser, opts) {
  const ctx = await browser.newContext({
    viewport: opts.viewport,
    isMobile: !!opts.mobile,
    hasTouch: !!opts.touch,
    deviceScaleFactor: 1,
    serviceWorkers: opts.sw ? 'allow' : 'block',
    reducedMotion: opts.reduce ? 'reduce' : 'no-preference',
    colorScheme: opts.night ? 'dark' : 'light'
  });
  await ctx.addInitScript(night => {
    localStorage.setItem('moxian.look', JSON.stringify({ theme: night ? 'night' : 'day', motion: 'lite', font: 'md' }));
  }, !!opts.night);
  const page = await ctx.newPage();
  const navs = [];
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) navs.push(frame.url()); });
  page.on('pageerror', err => errors.push('pageerror:' + err.message));
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.body && document.body.classList.contains('voyage'), null, { timeout: 20000 });
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.body.classList.contains('voyage-live'), null, { timeout: 20000 });
  // Skip swallows the next click for a third of a second.
  await page.waitForTimeout(500);
  return { ctx, page, navs };
}

async function openFilm(page) {
  await page.locator('#btn-new').click();
  const el = await page.waitForSelector('#xiantu-host.ready iframe', { timeout: 15000 });
  const frame = await el.contentFrame();
  if (!frame) throw new Error('opening frame missing');
  await frame.waitForSelector('#start');
  return frame;
}

async function shot(page, name) {
  const file = path.join(out, name + '.png');
  await page.screenshot({ path: file, type: 'png' });
  return file;
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.BROWSER_EXE || '/usr/local/bin/google-chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required']
  });
  const version = await browser.version();
  const report = {
    browser: version,
    url,
    viewportNote: 'Desktop Chrome with emulated CSS viewports. Not a physical iPhone or iOS Safari.',
    runtime: 'Cloud agent browser automation. Codex CLI was not installed or used.',
    saveV: 16,
    cache: 'moxian-v142'
  };
  try {
    const html = fs.readFileSync(path.join(__dirname, '../opening/xiantu.html'), 'utf8');
    check('opening-has-no-external-url', !/https?:\/\//.test(html));
    check('opening-has-no-writing-mode', html.indexOf('writing-mode') < 0);
    check('opening-keeps-cart-caption', html.indexOf('你托起车轴') >= 0 && html.indexOf('还来得及么') >= 0 && html.indexOf('来得及。') >= 0);

    // Font regression: ordinary ink stays one color; dense emphasis stays darker.
    {
      const { ctx, page } = await boot(browser, { viewport: { width: 390, height: 844 }, mobile: true, touch: true });
      const colors = await page.evaluate(() => {
        const el = document.createElement('div');
        el.className = 'ink-cadence';
        el.innerHTML = '<span class="ink-ch ink-dry">甲</span><span class="ink-ch ink-press">乙</span><span class="ink-ch">丙</span><span class="ink-ch ink-dense">丁</span>';
        document.body.appendChild(el);
        const cs = [...el.children].map(n => getComputedStyle(n).color);
        el.remove();
        return cs;
      });
      check('v141-ordinary-ink-one-color', colors[0] === colors[1] && colors[1] === colors[2] && colors[0] === 'rgb(74, 67, 58)', colors);
      check('v141-dense-emphasis-kept', colors[3] === 'rgb(16, 14, 12)' && colors[3] !== colors[0], colors);
      await ctx.close();
    }

    // No save: gender does not start playback; dismiss; repeat entry.
    {
      const { ctx, page, navs } = await boot(browser, { viewport: { width: 390, height: 844 }, mobile: true, touch: true });
      const before = await page.evaluate(() => Object.keys(localStorage).slice());
      const frame = await openFilm(page);
      await shot(page, 'phone-gender-select');
      const idle = await frame.evaluate(() => ({ playing: demoDebug.playing, started: demoDebug.started, audio: demoDebug.audioState, skip: document.querySelector('#skip').disabled }));
      check('select-screen-does-not-play', idle.playing === false && idle.started === false && idle.audio === 'not-created' && idle.skip === true, idle);
      await frame.click('#female');
      await page.waitForTimeout(250);
      const picked = await frame.evaluate(() => ({ gender: demoDebug.gender, playing: demoDebug.playing, started: demoDebug.started, pressed: document.querySelector('#female').getAttribute('aria-pressed') }));
      check('female-tap-does-not-start', picked.gender === 'female' && picked.playing === false && picked.started === false && picked.pressed === 'true', picked);
      await shot(page, 'phone-female-selected-not-playing');
      const targets = await frame.evaluate(() => ['#back', '#mute', '#skip', '#start', '#female', '#male'].map(sel => {
        const r = document.querySelector(sel).getBoundingClientRect();
        return { sel, w: r.width, h: r.height };
      }));
      check('touch-targets-48', targets.every(t => t.w >= 48 && t.h >= 48), targets);
      await frame.click('#back');
      await page.waitForFunction(() => !document.getElementById('xiantu-host') && document.body.dataset.screen === 'title');
      const afterDismiss = await page.evaluate(() => ({
        screen: document.body.dataset.screen,
        arrivals: window.__xiantuStats.arrivals,
        dismisses: window.__xiantuStats.dismisses,
        v1: localStorage.getItem('moxian.v1'),
        slots: localStorage.getItem('moxian.slots')
      }));
      check('dismiss-returns-without-complete', afterDismiss.screen === 'title' && afterDismiss.arrivals === 0 && afterDismiss.dismisses === 1 && !afterDismiss.v1, afterDismiss);
      check('dismiss-does-not-write-character', !afterDismiss.slots || JSON.parse(afterDismiss.slots).slots.every(s => !s), afterDismiss.slots);
      const navCount = navs.length;
      const frame2 = await openFilm(page);
      const hosts = await page.locator('#xiantu-host').count();
      check('repeat-entry-one-host', hosts === 1 && await frame2.evaluate(() => demoDebug.runId === 0 && demoDebug.playing === false));
      await frame2.click('#male');
      await frame2.click('#start');
      await frame2.evaluate(() => document.querySelector('#start').click());
      const once = await frame2.evaluate(() => ({ runId: demoDebug.runId, playing: demoDebug.playing }));
      check('double-start-one-run', once.runId === 1 && once.playing === true, once);
      await frame2.evaluate(() => {
        const orig = window.onXiantuOpeningComplete;
        window.onXiantuOpeningComplete = result => { orig(result); orig(result); };
      });
      await frame2.click('#skip');
      await page.waitForFunction(() => document.body.dataset.screen === 'create' && !document.getElementById('xiantu-host'));
      const handed = await page.evaluate(() => ({
        arrivals: window.__xiantuStats.arrivals,
        ignored: window.__xiantuStats.ignored,
        sex: window.__who && window.__who.sex,
        locked: document.querySelector('#who-pick').classList.contains('sex-locked'),
        fixed: document.querySelector('.who-fixed').textContent,
        sexButtons: [...document.querySelectorAll('#who-pick [data-k="sex"]')].filter(b => getComputedStyle(b).display !== 'none').length,
        mate: [...document.querySelectorAll('#who-pick [data-k="mate"]')].filter(b => getComputedStyle(b).display !== 'none').map(b => b.dataset.v),
        last: window.__xiantuLast,
        screen: document.body.dataset.screen
      }));
      check('male-skip-enters-create-once', handed.arrivals === 1 && handed.sex === 'm' && handed.locked && handed.fixed === '男' && handed.sexButtons === 0 && handed.mate.join(',') === 'f,m,any', handed);
      check('audio-closed-on-handoff', handed.last && handed.last.audioState === 'not-created' && handed.last.sources === 0 && handed.last.status === 'skipped', handed.last);
      check('skip-does-not-reload', navs.length === navCount, { before: navCount, after: navs.length });
      await shot(page, 'phone-create-male-skipped');
      await ctx.close();
    }

    // Old save continues, and a full slot confirm still gates the film.
    {
      const { ctx, page } = await boot(browser, { viewport: { width: 1280, height: 800 } });
      await page.evaluate(() => {
        window.__slotTarget = 0;
        window.__who = { sex: 'f', mate: 'any' };
        __moxian.newGame('旧卷客', { lg: LINGGEN.find(x => x.id === 'san'), els: ['金', '木', '火'], wx: 5, luck: 1 }, { id: 'qm' }, 'qingshi');
      });
      await page.waitForFunction(() => document.body.dataset.screen === 'main');
      const saved = await page.evaluate(() => localStorage.getItem('moxian.slots'));
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.body.classList.contains('voyage'));
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.body.classList.contains('voyage-live') && !document.querySelector('#btn-continue').hidden);
      await page.waitForTimeout(500);
      await page.locator('#btn-continue').click();
      await page.waitForFunction(() => document.body.dataset.screen === 'main');
      await page.waitForTimeout(400);
      const cont = await page.evaluate(raw => {
        const now = localStorage.getItem('moxian.slots');
        const a = JSON.parse(raw).slots[0].data;
        const b = JSON.parse(now).slots[0].data;
        return {
          host: !!document.getElementById('xiantu-host'),
          name: b.name,
          sex: b.who && b.who.sex,
          v: b.v,
          sameCore: a.name === b.name && a.v === b.v && JSON.stringify(a.who) === JSON.stringify(b.who) && a.xw === b.xw
        };
      }, saved);
      check('continue-skips-opening', cont.host === false && cont.name === '旧卷客' && cont.v === 16 && cont.sameCore, cont);
      await shot(page, 'desktop-continue-no-opening');
      await ctx.close();
    }

    {
      const { ctx, page } = await boot(browser, { viewport: { width: 390, height: 844 }, mobile: true, touch: true });
      await page.evaluate(() => {
        const roll = { lg: LINGGEN.find(x => x.id === 'san'), els: ['金', '木', '火'], wx: 5, luck: 1 };
        for (let i = 0; i < 3; i++) {
          window.__slotTarget = i;
          window.__who = { sex: 'm', mate: 'any' };
          __moxian.newGame('存' + i, roll, { id: 'qm' }, 'qingshi');
        }
      });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.body.classList.contains('voyage'));
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.body.classList.contains('voyage-live'));
      await page.waitForTimeout(500);
      const before = await page.evaluate(() => localStorage.getItem('moxian.slots'));
      await page.locator('#btn-new').click();
      await page.waitForSelector('.ask');
      const ask = await page.locator('.ask-text').innerText();
      check('full-slots-still-confirm', ask.indexOf('三卷皆满') >= 0 && ask.indexOf('覆盖') >= 0, ask);
      await page.locator('.ask-no').click();
      await page.waitForTimeout(400);
      check('confirm-cancel-does-not-open', await page.evaluate(() => !document.getElementById('xiantu-host') && document.body.dataset.screen === 'title'));
      await page.locator('#btn-new').click();
      await page.locator('.ask-ok').click();
      const el = await page.waitForSelector('#xiantu-host.ready iframe');
      const frame = await el.contentFrame();
      await frame.click('#back');
      await page.waitForFunction(() => !document.getElementById('xiantu-host'));
      const same = await page.evaluate(raw => {
        const names = box => JSON.parse(box).slots.map(s => s && s.data && s.data.name);
        return JSON.stringify(names(raw)) === JSON.stringify(names(localStorage.getItem('moxian.slots')));
      }, before);
      check('confirm-then-dismiss-does-not-overwrite', same);
      await ctx.close();
    }

    // Trial still uses the old create screen, including 不言.
    {
      const { ctx, page } = await boot(browser, { viewport: { width: 390, height: 844 }, mobile: true, touch: true });
      await page.locator('#btn-trial').click();
      await page.locator('.ask-no').click();
      await page.waitForTimeout(300);
      check('trial-cancel-no-opening', await page.evaluate(() => !document.getElementById('xiantu-host') && document.body.dataset.screen === 'title'));
      await page.locator('#btn-trial').click();
      await page.locator('.ask-ok').click();
      await page.waitForFunction(() => document.body.dataset.screen === 'create', null, { timeout: 8000 });
      const trial = await page.evaluate(() => ({
        host: !!document.getElementById('xiantu-host'),
        unspoken: !!document.querySelector('#who-pick [data-v="n"]'),
        locked: document.querySelector('#who-pick').classList.contains('sex-locked')
      }));
      check('trial-skips-film-keeps-sex-choice', trial.host === false && trial.unspoken === true && trial.locked === false, trial);
      await ctx.close();
    }

    // Mute, hide/resume, reduced motion, landscape.
    {
      const { ctx, page } = await boot(browser, { viewport: { width: 844, height: 390 }, touch: true });
      const frame = await openFilm(page);
      await shot(page, 'landscape-gender-select');
      await frame.click('#start');
      await frame.waitForFunction(() => demoDebug.playing && demoDebug.actTime > -9);
      const sub = await frame.evaluate(() => ({ color: getComputedStyle(document.querySelector('#subtitle')).color, text: demoDebug.subtitle }));
      check('subtitle-uniform-ink', sub.color === 'rgb(48, 43, 37)' && sub.text.indexOf('襁褓') >= 0, sub);
      await frame.click('#mute');
      await page.waitForTimeout(200);
      const muted = await frame.evaluate(() => ({ muted: demoDebug.muted, playing: demoDebug.playing, sources: demoDebug.activeSources }));
      check('mute-keeps-story-clears-sources', muted.muted === true && muted.playing === true && muted.sources === 0, muted);
      const t0 = await frame.evaluate(() => demoDebug.actTime);
      const hidden = await frame.evaluate(() => {
        const proto = Document.prototype;
        const desc = Object.getOwnPropertyDescriptor(proto, 'hidden');
        let ok = false;
        try {
          Object.defineProperty(proto, 'hidden', { configurable: true, get() { return true; } });
          document.dispatchEvent(new Event('visibilitychange'));
          ok = true;
        } catch (e) { ok = false; }
        return { ok, paused: demoDebug.hiddenPaused, restored: !!desc };
      });
      await page.waitForTimeout(400);
      const t1 = await frame.evaluate(() => demoDebug.actTime);
      check('hidden-pauses-clock', hidden.ok && hidden.paused === true && Math.abs(t1 - t0) < 0.05, { hidden, t0, t1 });
      await frame.evaluate(() => {
        Object.defineProperty(Document.prototype, 'hidden', { configurable: true, get() { return false; } });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await frame.waitForFunction(t => demoDebug.actTime > t + 0.05, t1, { timeout: 3000 });
      check('visible-resumes', true);
      await frame.click('#skip');
      await page.waitForFunction(() => document.body.dataset.screen === 'create' && !document.getElementById('xiantu-host'));
      await ctx.close();
    }

    {
      const { ctx, page } = await boot(browser, { viewport: { width: 390, height: 844 }, mobile: true, touch: true, reduce: true });
      const frame = await openFilm(page);
      const reduced = await frame.evaluate(() => demoDebug.reducedMotion);
      check('reduced-motion-flag', reduced === true, reduced);
      await frame.click('#female');
      await frame.click('#start');
      await frame.waitForFunction(() => (demoDebug.subtitle || '').indexOf('襁褓') >= 0);
      await shot(page, 'phone-reduced-motion');
      await frame.click('#skip');
      await page.waitForFunction(() => document.body.dataset.screen === 'create');
      const sex = await page.evaluate(() => window.__who.sex);
      check('reduced-skip-female-create', sex === 'f');
      await ctx.close();
    }

    // Female completed, with growth and cart frames, then the real create flow.
    {
      const { ctx, page, navs } = await boot(browser, { viewport: { width: 390, height: 844 }, mobile: true, touch: true });
      const navCount = navs.length;
      const frame = await openFilm(page);
      await frame.click('#female');
      await frame.click('#start');
      const beat = async (pred, name) => {
        await frame.waitForFunction(pred, null, { timeout: 20000 });
        await shot(page, name);
        return frame.evaluate(() => ({ gender: demoDebug.gender, t: demoDebug.actTime, sub: demoDebug.subtitle, shot: demoDebug.shot }));
      };
      const infant = await beat(() => demoDebug.actTime >= -9.4, 'phone-growth-infant');
      const child = await beat(() => demoDebug.actTime >= -6.4, 'phone-growth-child');
      const youth = await beat(() => demoDebug.actTime >= -3.8, 'phone-growth-youth');
      const adult = await beat(() => demoDebug.actTime >= -1.2, 'phone-growth-adult');
      const cart = await beat(() => demoDebug.shot === 'wheel-and-hands', 'phone-female-cart');
      const ask = await beat(() => (demoDebug.subtitle || '').indexOf('还来得及么') >= 0, 'phone-gate-question');
      check('female-growth-order', infant.sub.indexOf('襁褓') >= 0 && child.sub.indexOf('檐下') >= 0 && youth.sub.indexOf('劳作') >= 0 && adult.sub.indexOf('推门') >= 0, { infant, child, youth, adult });
      check('female-pushes-cart', cart.gender === 'female' && cart.shot === 'wheel-and-hands' && (cart.sub.indexOf('托起车轴') >= 0 || cart.sub.indexOf('我来抬') >= 0), cart);
      check('gate-question-kept', ask.sub.indexOf('还来得及么') >= 0, ask);
      await frame.waitForFunction(() => (demoDebug.subtitle || '').indexOf('先说说') >= 0, null, { timeout: 25000 });
      await frame.waitForFunction(() => !demoDebug.playing && demoDebug.endReason === 'completed', null, { timeout: 30000 });
      await page.waitForFunction(() => document.body.dataset.screen === 'create' && !document.getElementById('xiantu-host'), null, { timeout: 8000 });
      const created = await page.evaluate(() => ({
        sex: window.__who.sex,
        fixed: document.querySelector('.who-fixed').textContent,
        status: window.__xiantuLast.status,
        arrivals: window.__xiantuStats.arrivals
      }));
      check('female-completed-enters-create', created.sex === 'f' && created.fixed === '女' && created.status === 'completed' && created.arrivals === 1, created);
      check('completed-does-not-reload', navs.length === navCount, navs);
      await shot(page, 'phone-create-female');
      await page.locator('#inp-name').fill('听雨');
      await page.locator('#btn-test').click();
      await page.waitForSelector('#btn-start:not([hidden])', { timeout: 20000 });
      await page.locator('#btn-start').click();
      await page.waitForSelector('#origin-cer:not([hidden])');
      await page.waitForTimeout(800);
      await shot(page, 'phone-origin');
      const origin = await page.evaluate(() => ({
        title: document.querySelector('#origin-title').textContent,
        sexAsked: [...document.querySelectorAll('#origin-cer button')].some(b => /男|女|不言/.test(b.textContent))
      }));
      check('origin-does-not-reask-sex', origin.title === '出身' && origin.sexAsked === false, origin);
      await page.locator('#origin-opts .path-opt').first().click();
      await page.locator('#origin-confirm').click();
      await page.waitForSelector('#baishan:not([hidden])');
      await page.locator('#baishan-opts .path-opt').first().click();
      await page.locator('#baishan-confirm').click();
      await page.waitForFunction(() => document.body.dataset.screen === 'main' && window.__moxian && __moxian.S && __moxian.S.name === '听雨', null, { timeout: 15000 });
      await page.waitForSelector('#goal-cer:not([hidden])', { timeout: 8000 });
      const life = await page.evaluate(() => ({
        name: __moxian.S.name,
        sex: __moxian.S.who && __moxian.S.who.sex,
        origin: __moxian.S.origin,
        v: __moxian.S.v,
        goal: document.querySelector('#goal-title').textContent,
        arrivals: window.__xiantuStats.arrivals
      }));
      check('create-flow-keeps-sex-origin-goal', life.name === '听雨' && life.sex === 'f' && !!life.origin && life.v === 16 && life.goal === '此生所求' && life.arrivals === 1, life);
      await shot(page, 'phone-goal');
      await ctx.close();
    }

    // Male completed on a desktop viewport, including the cart.
    {
      const { ctx, page } = await boot(browser, { viewport: { width: 1440, height: 900 } });
      const frame = await openFilm(page);
      await shot(page, 'desktop-gender-select');
      await frame.click('#male');
      await frame.click('#start');
      await frame.waitForFunction(() => demoDebug.shot === 'wheel-and-hands' && demoDebug.gender === 'male', null, { timeout: 35000 });
      const cart = await frame.evaluate(() => ({ gender: demoDebug.gender, sub: demoDebug.subtitle }));
      await shot(page, 'desktop-male-cart');
      check('male-pushes-cart', cart.gender === 'male' && (cart.sub.indexOf('托起车轴') >= 0 || cart.sub.indexOf('我来抬') >= 0), cart);
      await frame.waitForFunction(() => demoDebug.endReason === 'completed', null, { timeout: 50000 });
      await page.waitForFunction(() => document.body.dataset.screen === 'create');
      const male = await page.evaluate(() => ({ sex: window.__who.sex, fixed: document.querySelector('.who-fixed').textContent, status: window.__xiantuLast.status }));
      check('male-completed-enters-create', male.sex === 'm' && male.fixed === '男' && male.status === 'completed', male);
      await shot(page, 'desktop-create-male');
      await ctx.close();
    }

    // Female skipped, separate from the completed run.
    {
      const { ctx, page } = await boot(browser, { viewport: { width: 1440, height: 900 } });
      const frame = await openFilm(page);
      await frame.click('#female');
      await frame.click('#start');
      await frame.waitForFunction(() => demoDebug.playing);
      await frame.click('#skip');
      await page.waitForFunction(() => document.body.dataset.screen === 'create');
      const skipped = await page.evaluate(() => ({ sex: window.__who.sex, status: window.__xiantuLast.status, arrivals: window.__xiantuStats.arrivals }));
      check('female-skipped-enters-create', skipped.sex === 'f' && skipped.status === 'skipped' && skipped.arrivals === 1, skipped);
      await ctx.close();
    }

    // Offline shell contains the opening document.
    {
      const { ctx, page } = await boot(browser, { viewport: { width: 390, height: 844 }, mobile: true, sw: true });
      await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, { timeout: 20000 }).catch(() => null);
      if (!(await page.evaluate(() => !!(navigator.serviceWorker && navigator.serviceWorker.controller)))) {
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 20000 });
      }
      const cached = await page.evaluate(async () => {
        const keys = await caches.keys();
        const found = [];
        for (const key of keys) {
          const cache = await caches.open(key);
          const reqs = await cache.keys();
          reqs.forEach(r => { if (r.url.indexOf('xiantu.html') >= 0 || r.url.indexOf('moxian-v') >= 0) found.push(key + ' ' + r.url); });
        }
        return { keys, found };
      });
      const hasOpening = cached.found.some(x => x.indexOf('xiantu.html') >= 0 && x.indexOf('moxian-v142') >= 0);
      check('sw-precache-includes-opening', hasOpening, cached);
      if (hasOpening) {
        await ctx.setOffline(true);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => document.body && document.body.classList.contains('voyage'), null, { timeout: 20000 });
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => document.body.classList.contains('voyage-live'), null, { timeout: 20000 });
        await page.waitForTimeout(500);
        const frame = await openFilm(page);
        check('offline-opening-starts', await frame.evaluate(() => !!document.querySelector('#start') && demoDebug.playing === false));
        await shot(page, 'phone-offline-select');
      }
      await ctx.close();
    }
  } catch (err) {
    console.error(err);
    checks.push({ name: 'runner', ok: false, detail: String(err && err.stack || err) });
    errors.push('runner');
  } finally {
    await browser.close();
    const failed = checks.filter(c => !c.ok);
    const summary = { browser: report.browser, passed: checks.length - failed.length, failed: failed.length, checks, errors, note: report };
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(summary, null, 2));
    console.log(JSON.stringify({ browser: report.browser, passed: summary.passed, failed: summary.failed }));
    if (failed.length) process.exitCode = 1;
  }
})();
