#!/usr/bin/env node
/* Full-page Chrome check for the town opening. Not a substitute for looking at the pictures.
   Run from the repo root while a static server serves this directory:
     python3 -m http.server 8765 --bind 127.0.0.1
     node tools/regress_school_page.js
   MX_BASE overrides the origin. MX_OUT overrides the evidence directory.
   Requires Playwright and a local Chrome. Audio is not asserted. */
'use strict';
const fs = require('fs');
const path = require('path');
const BASE = process.env.MX_BASE || 'http://127.0.0.1:8765/index.html';
const OUT = process.env.MX_OUT || path.join('/opt/cursor/artifacts', 'v147-page');
function playwrightPath() {
  const candidates = [
    'playwright',
    '/home/ubuntu/.npm/_npx/e41f203b7505f1fb/node_modules/playwright'
  ];
  for (const name of candidates) {
    try { return require.resolve(name); } catch (e) {}
  }
  throw new Error('playwright is not installed');
}
const { chromium } = require(playwrightPath());
fs.mkdirSync(OUT, { recursive: true });
const lines = [];
const note = (k, m) => { const s = '[' + k + '] ' + m; lines.push(s); console.log(s); };
function attach(page, tag) {
  const bag = { errors: [], failed: [] };
  page.on('pageerror', e => { const t = String(e && e.stack || e); bag.errors.push(t); note(tag + '.pageerror', t.slice(0, 500)); });
  page.on('requestfailed', req => { const t = req.url() + ' ' + ((req.failure() && req.failure().errorText) || ''); bag.failed.push(t); note(tag + '.netfail', t); });
  return bag;
}
async function skipSplash(page) {
  await page.waitForSelector('#btn-new', { timeout: 25000 });
  await page.mouse.click(24, 24);
  await page.waitForFunction(() => {
    const b = document.getElementById('btn-new');
    const splash = document.getElementById('splash');
    return b && !b.disabled && (!splash || splash.hidden);
  }, null, { timeout: 25000 });
  await page.waitForTimeout(500);
}
async function clickMap(page, re) {
  const loc = page.locator('#map button').filter({ hasText: re }).first();
  await loc.waitFor({ state: 'visible', timeout: 10000 });
  await loc.click();
}
async function clickText(page, re) {
  const loc = page.locator('.school-screen').last().locator('button', { hasText: re }).first();
  await loc.waitFor({ state: 'visible', timeout: 10000 });
  await loc.click();
}
async function state(page) {
  return page.evaluate(() => {
    const S = window.__moxian && window.__moxian.S;
    const v = S && S.school;
    const hidden = id => { const el = document.getElementById(id); return !el || el.hidden; };
    return {
      realm: (document.getElementById('h-realm') || {}).textContent || '',
      journal: (document.getElementById('journal-title') || {}).textContent || '',
      status: (document.getElementById('status-line') || {}).textContent || '',
      acts: Array.from(document.querySelectorAll('.actions .act-t')).map(el => el.textContent),
      subs: Array.from(document.querySelectorAll('.actions small')).map(el => el.textContent),
      cal: !hidden('dali-open'),
      map: !hidden('dali-map'),
      log: (document.getElementById('log') || {}).innerText || '',
      age: S && S.age, loc: S && S.loc, xw: S && S.xw,
      school: v ? { almanac: v.almanac, chart: v.chart, road: v.road, affair: v.affair, choice: v.affairChoice, days: v.days, food: Math.floor(v.food), letters: Math.floor(v.letters), entered: v.entered, gf: S.gf } : null
    };
  });
}
async function quietKeys(page, label) {
  const before = await state(page);
  for (const key of ['1', '2', '3', '4']) await page.keyboard.press(key);
  await page.waitForTimeout(200);
  const after = await state(page);
  const still = await page.locator('.school-screen, #map.map-school.open, #sheet.open, #sheet:not([hidden])').count();
  note(label, JSON.stringify({
    days: [before.school && before.school.days, after.school && after.school.days],
    food: [before.school && before.school.food, after.school && after.school.food],
    choice: [before.school && before.school.choice, after.school && after.school.choice],
    loc: [before.loc, after.loc],
    layer: still
  }));
  if (!after.school || after.school.days !== before.school.days || after.school.food !== before.school.food || after.school.choice !== before.school.choice || after.loc !== before.loc) {
    throw new Error(label + ' changed the save');
  }
  if (!still) throw new Error(label + ' closed the layer');
  return after;
}
async function settle(page) {
  await page.waitForFunction(() => {
    const nodes = document.querySelectorAll('#log .ink-ch');
    if (!nodes.length) return true;
    const last = nodes[nodes.length - 1];
    return parseFloat(getComputedStyle(last).opacity) > 0.95;
  }, null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(250);
}
async function enroll(page, name, girl, slow, keys) {
  await skipSplash(page);
  await page.click('#btn-new');
  await page.waitForSelector('.school-screen');
  if (slow) { await page.waitForTimeout(900); await page.screenshot({ path: path.join(OUT, '01-town-intro.png') }); }
  await clickText(page, /继续/);
  if (slow) await page.waitForTimeout(700);
  await clickText(page, /继续/);
  if (slow) await page.waitForTimeout(700);
  await clickText(page, /去书塾/);
  await page.waitForSelector('.school-name');
  if (slow) { await page.screenshot({ path: path.join(OUT, '02-name-sex.png') }); }
  await page.fill('.school-name', name);
  if (keys) {
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => /先生记下了/.test(document.body.innerText));
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => /我是儿子/.test(document.body.innerText));
  } else {
    await clickText(page, /告诉先生/);
    await clickText(page, /先生记下了/);
  }
  if (slow) await page.screenshot({ path: path.join(OUT, '02b-sex.png') });
  if (keys) {
    if (!girl) await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => /位子上坐下/.test(document.body.innerText));
    await page.keyboard.press('Enter');
  } else {
    await clickText(page, girl ? /女儿/ : /儿子/);
    await clickText(page, /位子上坐下/);
  }
  await page.waitForFunction(() => document.body.dataset.screen === 'main' && document.body.classList.contains('school-mortal'), null, { timeout: 12000 });
  await page.waitForTimeout(slow ? 900 : 400);
}

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME || '/usr/bin/google-chrome-stable',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const desktop = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'zh-CN',
    recordVideo: { dir: path.join(OUT, 'video'), size: { width: 1280, height: 800 } }
  });
  const page = await desktop.newPage();
  const bag = attach(page, 'desk');
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await enroll(page, '听雨', true, true);
  let s = await state(page);
  note('entered', JSON.stringify(s));
  await settle(page);
  await page.screenshot({ path: path.join(OUT, '03-child-hud.png') });
  if (s.realm !== '村塾' || s.cal || s.map || /炼气/.test(s.realm)) throw new Error('first day is not a mortal without calendar');
  await page.click('.act[data-act="tuna"]');
  await settle(page);
  s = await state(page);
  note('studied', JSON.stringify(s.school));
  if (!s.school.almanac || !s.cal) throw new Error('teacher did not give the almanac in the main log');
  await page.click('#dali-open');
  await page.waitForSelector('.almanac-screen h2');
  await page.screenshot({ path: path.join(OUT, '04-almanac.png') });
  await quietKeys(page, 'almanac-keys');
  const today = await page.locator('.almanac-page h2').innerText();
  if (today !== '1月') throw new Error('almanac is not a month: ' + today);
  const lookDays = (await state(page)).school.days;
  await page.locator('.almanac-day', { hasText: /^2$/ }).click();
  await page.screenshot({ path: path.join(OUT, '04b-almanac-day.png') });
  const detail = await page.locator('.almanac-detail').innerText();
  await clickText(page, /下一月/);
  const next = await page.locator('.almanac-page h2').innerText();
  await clickText(page, /回今日/);
  const back = await page.locator('.almanac-page h2').innerText();
  const afterLook = (await state(page)).school.days;
  note('almanac', today + ' -> ' + next + ' -> ' + back + ' ' + detail.replace(/\s+/g, ' '));
  if (!/1月2日/.test(detail) || next === today || back !== today || afterLook !== lookDays) throw new Error('month calendar changed the day or the save');
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => document.activeElement && document.activeElement.textContent);
  if (!focused || !/上一月|下一月|回今日|合上历本/.test(focused)) throw new Error('tab left the almanac: ' + focused);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('.school-screen'));
  const held = await state(page);
  await page.keyboard.press('1');
  await settle(page);
  const resumedKeys = await state(page);
  note('keys-restored', JSON.stringify({ before: held.school.days, after: resumedKeys.school.days }));
  if (resumedKeys.school.days <= held.school.days) throw new Error('shortcut did not return after the almanac closed');
  await page.click('.act[data-act="biguan"]');
  await settle(page);
  let guard = 0;
  while (guard++ < 6) {
    s = await state(page);
    if (s.map && s.school.affair === 1) break;
    await page.click('.act[data-act="youli"]');
    await settle(page);
  }
  s = await state(page);
  note('before-choice', JSON.stringify(s.school));
  if (!s.map || s.school.affair !== 1) throw new Error('town map or the desk affair did not appear');
  await page.click('#dali-map');
  await page.waitForSelector('#map.map-school .map-tag');
  await page.waitForFunction(() => document.getElementById('map').classList.contains('ready'), null, { timeout: 8000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, '05-realm-map.png') });
  const mapText = await page.locator('#map').innerText();
  if (!/九州/.test(mapText) || !/青州/.test(mapText)) throw new Error('realm map is missing');
  if (/沿镇东小路/.test(mapText)) throw new Error('the east road opened before the choice');
  await quietKeys(page, 'map-keys');
  if (!/九州/.test(await page.locator('#map-where, .map-ttl').first().innerText()) && !/九州/.test(await page.locator('#map').innerText())) throw new Error('digits drilled the map');
  await clickMap(page, /^青州$/);
  await page.screenshot({ path: path.join(OUT, '05b-province.png') });
  const province = await page.locator('#map-card').innerText();
  if (!/青石镇/.test(province) || /沿镇东小路/.test(province)) throw new Error('town scroll offered a closed road');
  await page.screenshot({ path: path.join(OUT, '05c-town.png') });
  await clickMap(page, /返回九州/);
  await clickMap(page, /^云州$/);
  const rumor = await page.locator('#map-card').innerText();
  if (!/传闻/.test(rumor) || /沿镇东小路|走回青石/.test(rumor)) throw new Error('a rumor offered travel');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.getElementById('map').hidden);
  await page.click('.act[data-act="biguan"]');
  await settle(page);
  s = await state(page);
  note('helped-maker', JSON.stringify(s.school));
  await page.screenshot({ path: path.join(OUT, '06-affair.png') });
  if (s.school.choice !== 'maker' || s.school.road !== 1) throw new Error('helping the maker did not open the road');
  if (!/塾门|抬木/.test(s.log)) throw new Error('the affair text is not in the journal');
  const foodBeforeTrip = s.school.food;
  const daysBeforeTrip = s.school.days;
  await page.click('#dali-map');
  await page.waitForSelector('#map.map-school .map-tag');
  await clickMap(page, /^青州$/);
  await clickMap(page, /沿镇东小路/);
  await settle(page);
  s = await state(page);
  note('left-town', JSON.stringify({ loc: s.loc, journal: s.journal, days: s.school.days, food: [foodBeforeTrip, s.school.food] }));
  if (s.school.food !== foodBeforeTrip - 6 || s.school.days !== daysBeforeTrip + 6) throw new Error('the road did not cost six days of food');
  await page.screenshot({ path: path.join(OUT, '07-left-town.png') });
  if (s.loc !== 'taohua' || s.school.days < 10) throw new Error('leaving town did not take days');
  const days = s.school.days;
  await page.reload({ waitUntil: 'domcontentloaded' });
  await skipSplash(page);
  await page.click('#btn-continue');
  await page.waitForFunction(() => document.body.dataset.screen === 'main', null, { timeout: 12000 });
  await page.waitForTimeout(500);
  s = await state(page);
  note('reload', JSON.stringify({ loc: s.loc, days: s.school.days, choice: s.school.choice }));
  if (s.loc !== 'taohua' || s.school.days !== days || s.school.choice !== 'maker') throw new Error('reload reset the road');
  const returnFood = s.school.food;
  await page.click('#dali-map');
  await page.waitForSelector('#map.map-school .map-tag');
  await clickMap(page, /^青州$/);
  await clickMap(page, /走回青石村/);
  await settle(page);
  s = await state(page);
  note('return-town', JSON.stringify({ loc: s.loc, food: s.school.food, was: returnFood }));
  if (s.loc !== 'qingshi' || s.school.food !== returnFood - 6) throw new Error('the walk home did not cost the same road');
  await page.evaluate(() => { window.__moxian.S.school.food = 2; window.__moxian.save(); window.__moxian.render(); });
  await page.click('#dali-map');
  await page.waitForSelector('#map.map-school .map-tag');
  await clickMap(page, /^青州$/);
  await clickMap(page, /沿镇东小路/);
  await page.waitForTimeout(300);
  s = await state(page);
  const toast = await page.locator('#toast').innerText();
  note('poor-road', JSON.stringify({ loc: s.loc, food: s.school.food, toast: toast }));
  if (s.loc !== 'qingshi' || s.school.food !== 2 || !/口粮/.test(toast)) throw new Error('a failed departure spent food');
  await page.click('#play-menu');
  await page.waitForSelector('.menu-list');
  const menu = await page.locator('#sheet-body').innerText();
  if (!/云岳坊/.test(menu) || /data-m="shop"|补记/.test(menu)) throw new Error('mortal menu still opens a shop shell');
  const shopCount = await page.locator('.menu-item[data-m="shop"], .menu-item[data-m="path"]').count();
  if (shopCount) throw new Error('mortal menu still has shop or path buttons');
  await quietKeys(page, 'menu-keys');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.getElementById('sheet').hidden);
  if (await page.locator('.school-life').count()) throw new Error('menu opened the stub life page');
  await desktop.close();

  const narrow = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'zh-CN', hasTouch: true, isMobile: true });
  const mp = await narrow.newPage();
  attach(mp, 'mobile');
  await mp.goto(BASE, { waitUntil: 'domcontentloaded' });
  await enroll(mp, '小禾', false, false);
  await mp.screenshot({ path: path.join(OUT, '08-mobile-hud.png') });
  const ms = await state(mp);
  if (ms.realm !== '村塾' || ms.cal) throw new Error('mobile first day is wrong');
  await mp.tap('.act[data-act="tuna"]');
  await settle(mp);
  await mp.screenshot({ path: path.join(OUT, '08b-mobile-after.png') });
  await narrow.close();

  const other = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'zh-CN', reducedMotion: 'reduce' });
  const op = await other.newPage();
  const kinBag = attach(op, 'kin');
  await op.addInitScript(() => {
    try { localStorage.setItem('moxian.look', JSON.stringify({ theme: 'auto', font: 'md', motion: 'lite', seasonPlate: 'on' })); } catch (e) {}
  });
  await op.goto(BASE, { waitUntil: 'domcontentloaded' });
  await op.evaluate(() => { document.documentElement.dataset.motion = 'lite'; });
  await enroll(op, '青禾', false, false, true);
  await op.click('.act[data-act="tuna"]');
  await op.click('.act[data-act="biguan"]');
  for (let i = 0; i < 6; i++) {
    const now = await state(op);
    if (now.school.affair === 1) break;
    await op.click('.act[data-act="youli"]');
  }
  await op.click('.act[data-act="youli"]');
  const kin = await state(op);
  note('helped-kin', JSON.stringify(kin.school));
  if (kin.school.choice !== 'kin') throw new Error('the second path did not stay with family');
  note('adult-fixture', 'age set to 16 in the live save; not clicked day by day from age 6');
  await op.evaluate(() => {
    const S = window.__moxian.S;
    S.months = 16 * 12;
    S.school.letters = 40;
    S.school.craft = 20;
    S.school.farm = 20;
    S.school.people.maker = 2;
    S.school.people.teacher = 2;
    S.school.people.kin = 2;
    S.school.food = 40;
    S.school.copper = 20;
    S.school.road = 1;
    S.school.chart = 1;
    S.school.almanac = true;
    S.school.affair = 2;
    S.school.clue = 0;
    S.school.practice = 0;
    S.school.entered = false;
    S.school.intent = '';
    S.school.health = 100;
    S.school.work = '';
    S.loc = 'qingshi';
    S.xw = 0;
    S.gf = null;
    Core.sync(S);
    const q = Dali.today(S);
    S.school.seasonAt = q.year * 4 + q.season;
    S.school.pending = null;
    if (!window.__moxian.save()) throw new Error('fixture save');
    window.__moxian.render();
  });
  const grown = await state(op);
  if (grown.age < 16 || grown.realm === '炼气' || !grown.acts.includes('做活')) throw new Error('adult fixture did not stay mortal');
  let spins = 0;
  while (spins++ < 6) {
    const sub = await op.locator('.act[data-act="biguan"] small').innerText();
    if (sub === '抄书') break;
    await op.locator('.act[data-act="biguan"] small').click();
  }
  const moneyBefore = await op.evaluate(() => window.__moxian.S.school.copper);
  const daysBefore = (await state(op)).school.days;
  await op.click('.act[data-act="biguan"]');
  await settle(op);
  const copied = await state(op);
  const moneyAfter = await op.evaluate(() => window.__moxian.S.school.copper);
  note('adult-copy', JSON.stringify({ sub: copied.subs[1], moneyBefore, moneyAfter, days: copied.school.days }));
  if (copied.subs[1] !== '抄书' || moneyAfter <= moneyBefore || copied.school.days <= daysBefore) throw new Error('adult copy work did not pay');
  await op.click('#dali-map');
  await op.waitForSelector('#map.map-school .map-tag');
  await clickMap(op, /^青州$/);
  await clickMap(op, /沿镇东小路/);
  await settle(op);
  await op.locator('.act[data-act="youli"] small').click();
  let seeks = 0;
  while (seeks++ < 10) {
    const now = await state(op);
    if (now.school && now.school.letters >= 0 && (await op.evaluate(() => window.__moxian.S.school.clue)) >= 4) break;
    const pending = await op.evaluate(() => window.__moxian.S.school.pending !== null);
    if (!pending) {
      const mode = await op.locator('.act[data-act="youli"] small').innerText();
      if (mode !== '寻访') await op.locator('.act[data-act="youli"] small').click();
    }
    await op.click('.act[data-act="youli"]');
    await settle(op);
  }
  const clue = await op.evaluate(() => window.__moxian.S.school.clue);
  note('adult-seek', String(clue));
  if (clue < 4) throw new Error('voluntary questions did not finish the clue');
  await op.locator('.act[data-act="bag"] small').click();
  for (let i = 0; i < 3; i++) {
    await op.click('.act[data-act="bag"]');
    await settle(op);
  }
  const cultivator = await state(op);
  note('adult-enter', JSON.stringify({ realm: cultivator.realm, acts: cultivator.acts, entered: cultivator.school && cultivator.school.entered, gf: cultivator.school && cultivator.school.gf }));
  if (!cultivator.acts.includes('吐纳') || cultivator.realm === '村塾' || !cultivator.school.gf) throw new Error('voluntary entry did not restore cultivation');
  if (await op.locator('#school-home').isVisible()) throw new Error('the creek offers a free return home');
  const creekFood = cultivator.school.food;
  await op.click('#dali-map');
  await op.waitForSelector('#map.map-school .map-tag');
  await clickMap(op, /^青州$/);
  await clickMap(op, /走回青石村/);
  await settle(op);
  const walked = await state(op);
  if (walked.loc !== 'qingshi' || walked.school.food !== creekFood - 4 || walked.acts.includes('读书')) throw new Error('walking home did not restore the place');
  await op.click('#school-home');
  await settle(op);
  const home = await state(op);
  if (home.loc !== 'qingshi') throw new Error('village days moved the place');
  if (!home.acts.includes('读书')) throw new Error('return home did not restore village actions');
  const foodHome = home.school.food;
  await op.locator('.act[data-act="biguan"] small').click();
  let backFarm = 0;
  while (backFarm++ < 6) {
    const sub = await op.locator('.act[data-act="biguan"] small').innerText();
    if (sub === '田里') break;
    await op.locator('.act[data-act="biguan"] small').click();
  }
  await op.click('.act[data-act="biguan"]');
  await settle(op);
  const farmed = await state(op);
  note('adult-home', JSON.stringify({ food: farmed.school.food, was: foodHome, acts: farmed.acts }));
  if (farmed.school.food <= foodHome) throw new Error('field work at home did not bring food');
  await op.click('#school-home');
  const returned = await state(op);
  if (!returned.acts.includes('吐纳')) throw new Error('leaving home did not restore cultivation');
  await op.evaluate(() => {
    const r = { lg: LINGGEN.find(l => l.id === 'san'), els: ['金', '木', '土'], wx: 5, luck: 2, free: true, origin: 'qingshi' };
    const cult = Core.newState('旧修士', r, null);
    cult.months = 553.5; cult.xw = 123; cult.flags.legacy = 1;
    Core.sync(cult);
    const child = Core.newState('旧村童', r, null);
    child.village = { version: 1, talent: 8, material: 4, basic: 12, goal: true };
    child.ls = 22;
    const box = Slots.loadBox();
    // keep the living school slot, add the two old saves beside it
    if (!Slots.createEmpty(1, cult, null).ok) throw new Error('cult slot');
    if (!Slots.createEmpty(2, child, null).ok) throw new Error('child slot');
  });
  await op.evaluate(() => { Slots.setActive(1); });
  await op.reload({ waitUntil: 'domcontentloaded' });
  await skipSplash(op);
  await op.click('#btn-continue');
  await op.waitForFunction(() => document.body.dataset.screen === 'main', null, { timeout: 12000 });
  const oldc = await state(op);
  note('old-cult', JSON.stringify({ realm: oldc.realm, age: oldc.age, xw: oldc.xw, school: oldc.school }));
  if (oldc.school || oldc.age !== 46 || oldc.xw !== 123 || oldc.realm === '村塾') throw new Error('old cultivator changed');
  await op.evaluate(() => window.__moxian.JHUI.openMap());
  await op.waitForSelector('#map.ready', { timeout: 12000 });
  await op.waitForTimeout(900);
  await op.screenshot({ path: path.join(OUT, '09-cult-map.png') });
  await op.keyboard.press('Escape');
  await other.close();

  const legacy = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'zh-CN' });
  const lp = await legacy.newPage();
  const oldBag = attach(lp, 'v145');
  await lp.goto(BASE, { waitUntil: 'domcontentloaded' });
  await skipSplash(lp);
  await lp.evaluate(() => {
    localStorage.clear();
    const r = { lg: LINGGEN.find(l => l.id === 'san'), els: ['金', '木', '土'], wx: 5, luck: 2, free: true, origin: 'qingshi' };
    const s = Core.newState('旧报名', r, null);
    s.months = 72;
    s.school = { v: 1, entered: false, food: 30, copper: 12, letters: 0, farm: 0, craft: 0, health: 100, family: 50, teacher: 20, neighbor: 20, days: 0, seasonAt: 0, pending: null, clue: 0, proof: 0, practice: 0, pausedSearch: false, job: '未定', roll: 1 };
    s.who = { sex: 'f', mate: 'any' };
    s.xw = 0; s.gf = null; s.loc = 'qingshi';
    s.calendar = { birthYear: 95, birthMonth: 1, birthDay: 1, seed: 1, unlocked: true };
    Core.sync(s);
    const made = Slots.createEmpty(0, s, null);
    if (!made.ok) throw new Error(made.err || 'v145 slot');
  });
  await lp.reload({ waitUntil: 'domcontentloaded' });
  await skipSplash(lp);
  await lp.click('#btn-continue');
  await lp.waitForFunction(() => document.body.dataset.screen === 'main', null, { timeout: 12000 });
  const resumed = await state(lp);
  note('v145-resume', JSON.stringify({ realm: resumed.realm, cal: resumed.cal, age: resumed.age, days: resumed.school && resumed.school.days }));
  if (!resumed.school || resumed.realm !== '村塾' || resumed.cal || resumed.age !== 6) throw new Error('v145 enrolled save did not resume as a child');
  const heldDays = resumed.school.days;
  await lp.evaluate(() => {
    const orig = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function () { throw new Error('quota'); };
    window.__mxSetItem = orig;
  });
  await lp.click('.act[data-act="tuna"]');
  await lp.waitForTimeout(400);
  const failed = await state(lp);
  const failToast = await lp.locator('#toast').innerText();
  note('write-fail', JSON.stringify({ days: failed.school && failed.school.days, toast: failToast }));
  if (!failed.school || failed.school.days !== heldDays || !/未存/.test(failToast)) throw new Error('a failed write moved the day');
  await lp.evaluate(() => { localStorage.setItem = window.__mxSetItem; });
  await lp.click('.act[data-act="tuna"]');
  await settle(lp);
  const recovered = await state(lp);
  note('write-retry', JSON.stringify({ days: recovered.school.days, almanac: recovered.school.almanac }));
  if (recovered.school.days <= heldDays) throw new Error('retry after a failed write did not advance');
  await legacy.close();

  const videoDir = path.join(OUT, 'video');
  const clips = fs.existsSync(videoDir) ? fs.readdirSync(videoDir).filter(n => n.endsWith('.webm')).map(n => ({ n, t: fs.statSync(path.join(videoDir, n)).mtimeMs })) : [];
  clips.sort((a, b) => b.t - a.t);
  if (clips[0]) fs.copyFileSync(path.join(videoDir, clips[0].n), path.join(OUT, 'opening.webm'));
  fs.writeFileSync(path.join(OUT, 'log.txt'), lines.join('\n'));
  fs.writeFileSync(path.join(OUT, 'errors.json'), JSON.stringify({ desk: bag.errors, kin: kinBag.errors, v145: oldBag.errors, net: bag.failed.concat(kinBag.failed, oldBag.failed) }, null, 2));
  const store = '/cursor/stores/self/artifacts/v148-ink';
  fs.mkdirSync(store, { recursive: true });
  for (const name of fs.readdirSync(OUT)) {
    const from = path.join(OUT, name);
    if (fs.statSync(from).isFile()) fs.copyFileSync(from, path.join(store, name));
  }
  await browser.close();
  if (bag.errors.length || kinBag.errors.length || oldBag.errors.length) throw new Error('page errors');
  console.log('PAGE FLOW PASS');
})().catch(err => {
  try { fs.writeFileSync(path.join(OUT, 'log.txt'), lines.join('\n') + '\nFAIL\n' + (err.stack || err)); } catch (e) {}
  console.error(err);
  process.exit(1);
});
