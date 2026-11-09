#!/usr/bin/env node
/* 命格绘卷的页面回归。视口是无头 Chrome 模拟，不是 iPhone 真机。 */
'use strict';
const fs = require('fs');
const path = require('path');
const puppeteer = require('/tmp/pwcore/node_modules/puppeteer-core');

const URL = process.env.MINGGE_URL || 'http://127.0.0.1:8765/';
const OUT = process.env.MINGGE_OUT || '/opt/cursor/artifacts';
const fail = [];
function check(name, ok, extra) {
  if (!ok) fail.push(name + (extra != null ? ' ' + JSON.stringify(extra) : ''));
  else console.log('ok', name);
}

async function shot(page, name) {
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, name + '.jpg');
  await page.screenshot({ path: file, type: 'jpeg', quality: 60, fullPage: false });
  return file;
}
async function boot(page) {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate(async () => {
    if (!navigator.serviceWorker) return;
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.unregister()));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#intro-skip', { timeout: 20000 });
  await page.evaluate(() => document.getElementById('intro-skip').click());
  await page.waitForFunction(() => {
    const b = document.getElementById('btn-new');
    return b && !b.disabled && !document.body.classList.contains('hold') && document.body.innerText.indexOf('开卷') >= 0;
  }, { timeout: 20000 });
  await new Promise(r => setTimeout(r, 500));
}
async function press(page, id) {
  await page.evaluate(sel => {
    const el = document.querySelector(sel);
    if (!el) throw new Error('missing ' + sel);
    el.click();
  }, id);
}
async function leavePrologue(page) {
  const which = await page.evaluate(() => {
    const cancel = document.getElementById('mg-cancel');
    if (cancel && !cancel.hidden) return '#mg-cancel';
    return '#mg-back';
  });
  await press(page, which);
  await page.waitForFunction(() => !document.getElementById('mingge'));
}
async function openPrologue(page) {
  await press(page, '#btn-new');
  await page.waitForSelector('#mingge .mg-body', { timeout: 10000 });
}
async function pick(page, label) {
  const found = await page.evaluate(text => {
    const b = [...document.querySelectorAll('#mingge .mg-opt')].find(x => x.textContent.indexOf(text) >= 0);
    if (!b || b.classList.contains('is-block')) return false;
    b.click();
    return true;
  }, label);
  if (!found) throw new Error('missing option ' + label);
  await press(page, '#mg-ok');
}
async function ink(page) {
  return page.evaluate(() => {
    const p = document.querySelector('#mingge .mg-body p');
    const s = getComputedStyle(p);
    const host = document.getElementById('mingge');
    return {
      color: s.color,
      imgs: host.querySelectorAll('img').length,
      overflow: host.scrollWidth <= host.clientWidth + 2,
      text: p.textContent,
    };
  });
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--font-render-hinting=none'],
  });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(20000);
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

    await boot(page);
    await openPrologue(page);
    const birth = await ink(page);
    check('birth-ink', birth.color === 'rgb(74, 67, 58)' && birth.imgs === 0 && birth.overflow, birth);
    check('birth-copy', birth.text.indexOf('落墨成命') >= 0, birth.text);
    await shot(page, 'desktop-birth');
    await leavePrologue(page);
    const afterCancel = await page.evaluate(() => ({
      screen: document.body.dataset.screen,
      audio: window.__minggeAudio || '',
      slots: JSON.parse(localStorage.getItem('moxian.slots') || '{"slots":[null,null,null]}').slots.filter(Boolean).length,
    }));
    check('cancel-no-create', afterCancel.screen === 'title' && afterCancel.slots === 0 && afterCancel.audio === 'off', afterCancel);

    await openPrologue(page);
    await page.evaluate(() => { window.__minggeFxFrames = 0; });
    await press(page, '#mg-ok');
    await new Promise(r => setTimeout(r, 120));
    const stageStyle = await page.evaluate(() => {
      const p = document.querySelector('#mingge .mg-body p');
      const cs = getComputedStyle(p);
      const nodes = [...p.childNodes].map(n => n.nodeType === 1 ? getComputedStyle(n).opacity : 'text');
      return {
        color: cs.color,
        opacity: cs.opacity,
        fontSize: cs.fontSize,
        nodes: nodes,
        frames: window.__minggeFxFrames || 0,
        ink: document.getElementById('mingge').classList.contains('is-ink'),
        choices: document.querySelectorAll('#mingge .mg-opt').length,
      };
    });
    fs.writeFileSync(path.join(OUT, 'computed-style.json'), JSON.stringify(stageStyle, null, 2));
    check('stage-ink-and-ink-color', stageStyle.color === 'rgb(74, 67, 58)' && stageStyle.opacity === '1' && stageStyle.frames > 0 && stageStyle.choices === 2 && stageStyle.nodes.every(n => n === 'text' || n === '1'), stageStyle);
    await shot(page, 'desktop-stage-ink');
    await pick(page, '是个男孩');
    await press(page, '#mg-back');
    const sexBack = await page.evaluate(() => {
      const on = document.querySelector('#mingge .mg-opt.on');
      return on ? on.textContent : '';
    });
    check('sex-back-keeps-pick', sexBack.indexOf('是个男孩') >= 0, sexBack);
    await press(page, '#mg-ok');
    await pick(page, '抓住断剑');
    await press(page, '#mg-back');
    await press(page, '#mg-ok');
    await pick(page, '接过无字天书');
    await pick(page, '买下放生');
    await pick(page, '走向火海');
    await shot(page, 'desktop-path');
    await pick(page, '升仙大会');
    const sectPicked = await page.evaluate(() => {
      const names = ['青冥宗', '散修盟'];
      for (const text of names) {
        const b = [...document.querySelectorAll('#mingge .mg-opt')].find(x => x.textContent.indexOf(text) >= 0);
        if (b) { b.click(); return text; }
      }
      return '';
    });
    if (!sectPicked) throw new Error('no sect');
    await press(page, '#mg-ok');
    await page.evaluate(() => { document.getElementById('mg-name').value = '沈试'; });
    await shot(page, 'desktop-book');
    const bookInk = await page.evaluate(() => getComputedStyle(document.querySelector('#mingge .mg-verse')).color);
    check('book-ink', bookInk === 'rgb(27, 24, 20)' || bookInk === 'rgb(74, 67, 58)', bookInk);
    await press(page, '#mg-ok');
    await page.waitForFunction(() => document.body.dataset.screen === 'main' && !document.getElementById('mingge'), { timeout: 15000 });
    await page.waitForSelector('#goal-opts .path-opt', { timeout: 8000 }).catch(() => {});
    const state = await page.evaluate(() => {
      const s = window.__moxian.S;
      return {
        name: s.name, sex: s.who && s.who.sex, origin: s.origin, life: s.lifeBonus,
        els: s.lgEls, lg: s.lg && s.lg.id, sword: s.gfs && s.gfs.tiejian && s.gfs.tiejian.lv,
        fox: (s.life.deeds || []).some(d => d.id === 'mingfox'),
        on: s.ming && s.ming.on, org: s.sect && s.sect.org, rank: s.sect && s.sect.rank,
        created: window.__minggeDraft && window.__minggeDraft._created,
        seals: window.__minggeStats && window.__minggeStats.seals,
        log: (s.log || []).map(e => e.title + (e.text || '')).join('\n'),
      };
    });
    check('seal-once', state.seals === 1 && state.created === 1 && state.name === '沈试', state);
    check('male-effects', state.sex === 'm' && state.origin === 'hanmen' && state.life === 0 && state.sword === 1 && state.els[0] === '火' && state.fox && state.on === 1 && (state.org === 'qm' || state.org === 'sx'), state);
    check('log-has-ming', state.log.indexOf('命册') >= 0 && state.log.indexOf('小伤不入骨') >= 0 && state.log.indexOf('体魄可挡一层伤') >= 0, state.log);
    await page.evaluate(() => window.__moxian.openEvent('ming_qian'));
    await page.waitForFunction(() => (document.getElementById('ev-title').textContent || '').indexOf('元阳') >= 0);
    const qianUi = await page.evaluate(() => ({
      title: document.getElementById('ev-title').textContent,
      choices: [...document.querySelectorAll('#ev-choices button')].map(b => b.textContent),
    }));
    check('qian-ui', qianUi.title.indexOf('元阳') >= 0 && qianUi.choices.some(t => t.indexOf('双修') >= 0), qianUi);
    await page.evaluate(() => { const m = document.getElementById('modal'); if (m) m.hidden = true; });
    if (await page.$('#goal-opts .path-opt')) {
      await press(page, '#goal-opts .path-opt');
      await press(page, '#goal-confirm');
      await page.waitForFunction(() => document.getElementById('goal-cer').hidden);
    }
    await shot(page, 'desktop-main');

    await page.evaluate(async () => {
      if (!navigator.serviceWorker) return;
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#intro-skip', { timeout: 20000 });
    await press(page, '#intro-skip');
    await page.waitForFunction(() => {
      const b = document.getElementById('btn-continue');
      return b && !b.hidden && !b.disabled && !document.body.classList.contains('hold') && document.body.innerText.indexOf('开卷') >= 0;
    }, { timeout: 20000 });
    await new Promise(r => setTimeout(r, 800));
    await press(page, '#btn-continue');
    try {
      await page.waitForFunction(() => document.body.dataset.screen === 'main' && !document.getElementById('mingge'), { timeout: 8000 });
    } catch (e) {
      await press(page, '#btn-continue');
      await page.waitForFunction(() => document.body.dataset.screen === 'main' && !document.getElementById('mingge'), { timeout: 15000 });
    }
    const cont = await page.evaluate(() => window.__moxian.S && window.__moxian.S.name);
    check('continue-skips-prologue', cont === '沈试', cont);
    await shot(page, 'desktop-continue');

    await boot(page);
    await openPrologue(page);
    await press(page, '#mg-ok');
    await pick(page, '是个女孩');
    await pick(page, '抓住古玉');
    await pick(page, '讨要糖丸');
    await pick(page, '冷眼旁观');
    const leiBlocked = await page.evaluate(() => {
      const b = [...document.querySelectorAll('#mingge .mg-opt')].find(x => x.textContent.indexOf('引天雷') >= 0);
      return !!(b && b.classList.contains('is-block'));
    });
    check('lei-open-with-pill', leiBlocked === false);
    await page.evaluate(() => {
      [...document.querySelectorAll('#mingge .mg-opt')].find(x => x.textContent.indexOf('引天雷') >= 0).click();
    });
    await press(page, '#mg-ok');
    await press(page, '#mg-back');
    const leiText = await page.evaluate(() => document.querySelector('#mingge .mg-body').textContent);
    await page.evaluate(() => {
      [...document.querySelectorAll('#mingge .mg-opt')].find(x => x.textContent.indexOf('引天雷') >= 0).click();
    });
    await press(page, '#mg-ok');
    await press(page, '#mg-back');
    const leiText2 = await page.evaluate(() => document.querySelector('#mingge .mg-body').textContent);
    check('lei-frozen', leiText === leiText2 && (leiText.indexOf('雷根醒了') >= 0 || leiText.indexOf('雷未入体') >= 0), leiText);
    await press(page, '#mg-ok');
    await pick(page, '红尘奇遇');
    await page.evaluate(() => { document.getElementById('mg-name').value = '苏试'; });
    await press(page, '#mg-ok');
    await page.waitForFunction(() => document.body.dataset.screen === 'main' && !document.getElementById('mingge'));
    const female = await page.evaluate(() => {
      const s = window.__moxian.S;
      return {
        sex: s.who.sex, origin: s.origin, ls: s.ls, shen: s.ming.shen, dust: s.ming.dust,
        fabao: s.fabao && s.fabao.name, life: s.lifeBonus, el: s.lgEls[0], free: s.sect.free,
        lei: s.ming.leiTried, ok: s.ming.leiOk, id: s.lg.id, inj: s.inj,
        lifeSpan: s.lifespan, dustDue: s.ming.dustDue, lifted: s.ming.dustLifted,
      };
    });
    check('female-effects', female.sex === 'f' && female.origin === 'shijia' && female.ls === 108 && female.shen === 8 && female.dust === 1 && female.fabao && female.life === 0 && female.free === true, female);
    check('lei-applied', female.lei === 1 && ((female.ok === 1 && female.id === 'yi' && female.el === '雷' && female.inj === 0) || (female.ok === 0 && female.inj === 2)), female);
    check('female-dust-cap', female.lifeSpan === 80 && female.dustDue === 80, female);
    await page.evaluate(() => window.__moxian.openEvent('ming_kun'));
    await page.waitForFunction(() => (document.getElementById('ev-title').textContent || '').indexOf('坤灵') >= 0);
    const kunUi = await page.evaluate(() => ({
      title: document.getElementById('ev-title').textContent,
      choices: [...document.querySelectorAll('#ev-choices button')].map(b => b.textContent),
    }));
    check('kun-ui', kunUi.choices.some(t => t.indexOf('听她讲') >= 0), kunUi);
    await page.evaluate(() => { const m = document.getElementById('modal'); if (m) m.hidden = true; });

    await boot(page);
    await press(page, '#btn-trial');
    await page.waitForSelector('.trial-brief .ask-ok');
    await press(page, '.trial-brief .ask-ok');
    await page.waitForFunction(() => document.body.dataset.screen === 'create' && !document.getElementById('mingge'));
    const trial = await page.evaluate(() => ({
      n: [...document.querySelectorAll('#who-pick [data-k="sex"]')].map(b => b.textContent).join(''),
      locked: document.getElementById('who-pick').classList.contains('sex-locked'),
    }));
    check('trial-keeps-buyan', trial.n.indexOf('不言') >= 0 && !trial.locked, trial);
    await shot(page, 'trial-create');

    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await boot(page);
    await openPrologue(page);
    await press(page, '#mg-ok');
    await pick(page, '是个女孩');
    const mobile = await ink(page);
    check('mobile-ink', mobile.color === 'rgb(74, 67, 58)' && mobile.overflow && mobile.imgs === 0, mobile);
    await shot(page, 'mobile-sex');
    await leavePrologue(page);

    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await boot(page);
    await openPrologue(page);
    const reduced = await page.evaluate(() => {
      const fx = document.getElementById('mg-fx');
      const p = document.querySelector('#mingge .mg-body p');
      return { hidden: !fx || getComputedStyle(fx).display === 'none' || fx.hidden, text: p.textContent, color: getComputedStyle(p).color };
    });
    check('reduced-readable', reduced.hidden && reduced.text.indexOf('落墨成命') >= 0 && reduced.color === 'rgb(74, 67, 58)', reduced);
    await page.evaluate(() => { window.__minggeFxFrames = 0; });
    await press(page, '#mg-ok');
    const reducedStep = await page.evaluate(() => ({
      frames: window.__minggeFxFrames || 0,
      choices: document.querySelectorAll('#mingge .mg-opt').length,
      color: getComputedStyle(document.querySelector('#mingge .mg-body p')).color,
      opacity: getComputedStyle(document.querySelector('#mingge .mg-body p')).opacity,
    }));
    check('reduced-does-not-skip-choice', reducedStep.frames === 0 && reducedStep.choices === 2 && reducedStep.opacity === '1' && reducedStep.color === 'rgb(74, 67, 58)', reducedStep);
    await shot(page, 'reduced-birth');
    await leavePrologue(page);

    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    await page.evaluateOnNewDocument(() => { document.documentElement.dataset.theme = 'night'; });
    await boot(page);
    await page.evaluate(() => { document.documentElement.dataset.theme = 'night'; });
    await openPrologue(page);
    const night = await ink(page);
    check('night-ink', night.color === 'rgb(74, 67, 58)', night);
    await shot(page, 'night-birth');
    await leavePrologue(page);

    await page.evaluate(() => {
      const box = window.__moxian.Slots.loadBox();
      const row = box.slots.find(s => s && s.data) || { at: 1, sum: { name: '甲', dead: false, ascended: false }, data: { v: 16, name: '甲' } };
      box.slots = [row, Object.assign({}, row, { at: 2 }), Object.assign({}, row, { at: 3 })];
      window.__moxian.Slots.saveBox(box);
    });
    await press(page, '#btn-new');
    await page.waitForSelector('.ask .ask-no');
    check('slots-full-dialog', true);
    await press(page, '.ask .ask-no');
    await new Promise(r => setTimeout(r, 400));
    const full = await page.evaluate(() => !document.getElementById('mingge') && document.body.dataset.screen === 'title');
    check('slots-full-cancel', full);

    const sw = await page.evaluate(async () => {
      if (!navigator.serviceWorker) return { found: false, reason: 'no-sw' };
      await navigator.serviceWorker.register('./sw.js?v=143');
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise(resolve => setTimeout(() => resolve(null), 12000)),
      ]);
      if (!reg) return { found: false, reason: 'no-reg' };
      await new Promise(resolve => setTimeout(resolve, 1500));
      const keys = await caches.keys();
      let found = false;
      const names = [];
      for (const k of keys) {
        const cache = await caches.open(k);
        const reqs = await cache.keys();
        reqs.forEach(r => { if (r.url.indexOf('mingge') >= 0) names.push(r.url); });
        if (reqs.some(r => r.url.indexOf('mingge.js') >= 0 && r.url.indexOf('v=143') >= 0)) found = true;
      }
      return { found, keys, names };
    });
    check('sw-has-mingge', sw.found === true, sw);
  } catch (err) {
    fail.push(String(err && err.stack || err));
    try {
      const pages = await browser.pages();
      if (pages[0]) await shot(pages[0], 'failure');
    } catch (e) {}
  } finally {
    await browser.close();
  }
  if (fail.length) {
    console.error(fail.join('\n\n'));
    process.exit(1);
  }
  console.log('browser ok');
})();
