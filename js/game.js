/* 墨仙录 · 主逻辑 */
'use strict';
(() => {
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const SAVE_KEY = 'moxian.v1';
const root = document.documentElement;

/* ================= 视觉初始化 ================= */
const svgURL = svg => `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
function brushImg(w, h, seed, fill) {
  return svgURL(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path d="${Ink.brushPath(w, h, seed)}" fill="${fill}"/></svg>`);
}
function brushBtnImg(seed, fill, alpha) {
  // 双层笔触：浓淡相叠，像一笔扫过
  const w = 300, h = 90;
  const p1 = Ink.brushPath(w, h * 0.78, seed), p2 = Ink.brushPath(w * 0.96, h * 0.5, seed + 9);
  return svgURL(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><g fill="${fill}"><path d="${p1}" transform="translate(0 ${h * 0.11})" opacity="${alpha}"/><path d="${p2}" transform="translate(8 ${h * 0.3}) rotate(-1.2)" opacity="${alpha * 0.5}"/></g></svg>`);
}
const MTN = [
  { seed: 11, rgb: [104, 120, 130], alpha: 0.55, base: 0.98, amp: 0.82, peaks: 4, width: 0.09, sharp: 2.3, fade: 0.5, wash: 0.26, cun: 0.05, cunLen: 0.6, folds: 1, line: 0, hero: 1 },
  { seed: 23, rgb: [74, 82, 86], alpha: 0.62, base: 1.0, amp: 0.62, peaks: 3, width: 0.12, sharp: 2.4, fade: 0.6, wash: 0.3, cun: 0.12, cunLen: 0.8, folds: 2, line: 0.6, dots: 0.03, hero: 2 },
  { seed: 41, rgb: [44, 46, 46], alpha: 0.78, base: 1.0, amp: 0.5, peaks: 3, width: 0.15, sharp: 2.0, fade: 0.7, wash: 0.32, cun: 0.18, cunLen: 1, folds: 2, line: 1.0, dots: 0.06, trees: 2, treeSize: 0.7 },
  { seed: 57, rgb: [26, 25, 23], alpha: 0.92, base: 1.08, amp: 0.62, peaks: 2, hero: 0, width: 0.2, sharp: 1.8, fade: 0.9, wash: 0.42, cun: 0.25, cunLen: 1.2, folds: 2, line: 1.5, dots: 0.1, trees: 3, treeSize: 1, bottomFade: false },
];
let lastW = 0;
function drawMountains(force) {
  const w = window.innerWidth;
  if (!force && Math.abs(w - lastW) < 2) return;
  lastW = w;
  $$('.mtn').forEach((cv, i) => Ink.mountainLayer(cv, MTN[i]));
  if (wallpaperOn) Wallpaper.rebuild();
}
let wallpaperOn = false;
async function initVisuals() {
  root.style.setProperty('--brush-img', brushBtnImg(5, '#1b1814', 0.95));
  root.style.setProperty('--brush-img-light', brushBtnImg(12, '#1b1814', 0.14));
  root.style.setProperty('--brush-img-paper', brushBtnImg(19, '#f3ead6', 0.95));
  root.style.setProperty('--brush-img-zhu-l', brushBtnImg(23, '#b3302a', 0.13));
  root.style.setProperty('--brush-img-zhu', brushBtnImg(27, '#b3302a', 0.92));
  root.style.setProperty('--brush-img-ink-l', brushBtnImg(31, '#1b1814', 0.1));
  root.style.setProperty('--brush-img-night', brushBtnImg(35, '#efe4cc', 0.15));
  root.style.setProperty('--brush-line', brushImg(400, 12, 3, '#1b1814'));
  root.style.setProperty('--brush-bar', brushImg(400, 26, 8, '#1b1814'));
  root.style.setProperty('--brush-bar-zhu', brushImg(400, 26, 8, '#b3302a'));
  drawMountains(true);
  const [paper, mist, b1, b2, b3, b4, stone, big, scene] = await Promise.all([
    Ink.paperTile(512), Ink.mistSprite(),
    Ink.inkBlot(160, 3, { core: 0.32, rough: 0.08, splatter: 6, alpha: 0.95 }),
    Ink.inkBlot(160, 8, { core: 0.31, rough: 0.08, splatter: 5, alpha: 0.95 }),
    Ink.inkBlot(160, 15, { core: 0.33, rough: 0.08, splatter: 7, alpha: 0.95 }),
    Ink.inkBlot(160, 22, { core: 0.3, rough: 0.08, splatter: 4, alpha: 0.95 }),
    Ink.inkBlot(420, 31, { core: 0.3, rough: 0.04, splatter: 14, alpha: 0.92, halo: 0.18 }),
    Ink.inkBlot(1000, 77, { core: 0.3, rough: 0.05, splatter: 70, alpha: 0.97, halo: 0.3, rgb: [16, 14, 12] }),
    Ink.scene(800, 220),
  ]);
  root.style.setProperty('--mtn-img', `url(${scene})`);
  root.style.setProperty('--paper-img', `url(${paper})`);
  root.style.setProperty('--mist-img', `url(${mist})`);
  root.style.setProperty('--blot', `url(${b1})`); root.style.setProperty('--blot2', `url(${b2})`);
  root.style.setProperty('--blot3', `url(${b3})`); root.style.setProperty('--blot4', `url(${b4})`);
  root.style.setProperty('--blot-stone', `url(${stone})`); root.style.setProperty('--blot-big', `url(${big})`);
  try { Wallpaper.init(); wallpaperOn = true; } catch (e) { console.warn(e); }
  root.style.setProperty('--grain-img', `url(${grainTile()})`);
  try { InkGL.init(); InkGL.setPaper(paper); } catch (e) { console.warn(e); }
}
function grainTile() {
  const s = 180, cv = document.createElement('canvas'); cv.width = cv.height = s; const c = cv.getContext('2d');
  const img = c.createImageData(s, s), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const v = Math.random(); const dark = v < .5; d[i] = d[i + 1] = d[i + 2] = dark ? 20 : 255; d[i + 3] = Math.pow(Math.random(), 3) * 120; }
  c.putImageData(img, 0, 0); return cv.toDataURL();
}
let resizeT;
window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => drawMountains(false), 250); });

/* 触感：墨晕涟漪 */
document.addEventListener('pointerdown', e => {
  const t = e.target.closest('button'); if (!t || t.disabled) return;
  const r = document.createElement('div'); r.className = 'ripple';
  r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px';
  document.body.appendChild(r); setTimeout(() => r.remove(), 950);
}, { passive: true });
// 阻止 iOS 捏合缩放（双击缩放已由 touch-action: manipulation 处理）
document.addEventListener('gesturestart', e => e.preventDefault());

/* ================= 墨晕文字 ================= */
const PUNCT = '，。、；：？！”’）》」…—·';
let inkBusyUntil = 0;
function inkWrite(el, text, opt = {}) {
  const now = performance.now();
  const backlog = Math.max(0, inkBusyUntil - now);
  const start = opt.immediate ? 0 : Math.min(backlog, 1400);
  const step = opt.step || (backlog > 1200 ? 9 : 22);
  const frag = document.createDocumentFragment();
  const units = [];
  for (const ch of text) {
    if (units.length && (PUNCT.includes(ch) || ch === ' ')) units[units.length - 1] += ch;
    else if (units.length && '“‘（《「'.includes(units[units.length - 1].slice(-1))) units[units.length - 1] += ch;
    else units.push(ch);
  }
  units.forEach((u, i) => {
    const sp = document.createElement('span'); sp.className = 'ink-ch'; sp.textContent = u;
    sp.style.animationDelay = (start + i * step) + 'ms'; frag.appendChild(sp);
  });
  el.textContent = ''; el.appendChild(frag);
  const total = start + units.length * step + 1100;
  inkBusyUntil = now + start + units.length * step + 200;
  setTimeout(() => { if (el.isConnected && el.querySelector('.ink-ch')) el.textContent = text; }, total + 50);
  return start + units.length * step;
}

/* ================= 状态 ================= */
let S = null;
const sync = (s = S) => Core.sync(s);
const R = () => REALMS[S.realm];
const req = (s = S) => Core.req(s);
const unit = (s = S) => Core.unit(s);
const isLast = (s = S) => Core.isLast(s);
const bottleneck = (s = S) => Core.bottleneck(s);
const realmStr = (s = S) => Core.realmStr(s);
const timeLabel = (s = S) => Core.timeLabel(s);
const fmtNum = Core.fmtNum;
const K = Core.K;
const LEGACY_KEY = 'moxian.legacy';
// 收集规则层的旁白，待主条目落笔后再依次写出
const buffer = () => { const B = []; return { emit: e => B.push(e), flush: () => { B.forEach(pushLog); B.length = 0; } }; };

function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
function load() { try { return Core.migrate(JSON.parse(localStorage.getItem(SAVE_KEY))); } catch (e) { console.warn(e); } return null; }

/* ================= 屏幕切换（卷轴） ================= */
let curScreen = 'title';
function setScreen(id) {
  $$('.screen').forEach(el => el.hidden = el.id !== 'scr-' + id);
  document.body.dataset.screen = id; curScreen = id;
}
let lastTap = null;
document.addEventListener('pointerdown', e => { lastTap = [e.clientX, e.clientY]; }, { passive: true, capture: true });
async function unrollTo(id) {
  const t = lastTap; lastTap = null;
  await FX.wash(async () => { setScreen(id); await sleep(60); }, t && t[0], t && t[1]);
}

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 1900);
}

/* ================= 卷首 ================= */
function initTitle() {
  const s = load();
  if (s && !s.dead && !s.ascended) {
    $('#btn-continue').hidden = false;
    $('#continue-sub').textContent = `${s.name} · ${realmStr(s)}`;
  }
  FX.setSeason(s && !s.dead && !s.ascended ? Math.floor((s.months % 12) / 3) : 0); FX.setGold(0);
  $('#btn-new').onclick = async () => {
    FX.requestTilt();
    if (s && !s.dead && !s.ascended && !(await inkConfirm('另开新卷，旧卷将被覆盖。', '另开', true))) return;
    resetCreate(); unrollTo('create');
  };
  $('#btn-continue').onclick = () => { FX.requestTilt(); S = load(); if (!S) return; enterMain(true); };
}

/* ================= 墨笺问询：替代原生 confirm ================= */
let askOpen = null;
function inkConfirm(text, ok = '确定', danger = false) {
  return new Promise(res => {
    const el = document.createElement('div'); el.className = 'ask'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = `<div class="ask-shade"></div><div class="ask-card"><p class="ask-text"></p><p class="ask-sub">确定么？</p>
      <div class="ask-btns"><button class="brush-btn small ask-no"><span class="bb-ink"></span><span class="bb-text">且慢</span></button>
      <button class="brush-btn small ask-ok${danger ? ' danger' : ''}" id="ask-ok"><span class="bb-ink"></span><span class="bb-text"></span></button></div></div>`;
    el.querySelector('.ask-text').textContent = text; el.querySelector('.ask-ok .bb-text').textContent = ok;
    document.body.appendChild(el);
    const done = v => { if (!askOpen) return; askOpen = null; el.classList.remove('open'); setTimeout(() => el.remove(), 320); res(v); };
    askOpen = done;
    el.querySelector('.ask-ok').onclick = () => done(true);
    el.querySelector('.ask-no').onclick = () => done(false);
    el.querySelector('.ask-shade').onclick = () => done(false);
    requestAnimationFrame(() => { el.classList.add('open'); el.querySelector('.ask-ok').focus({ preventScroll: true }); });
  });
}

/* ================= 入道 ================= */
let roll = null, rerolls = 2, testing = false;
function resetCreate() {
  roll = null; rerolls = 2; testing = false;
  $('#inp-name').value = '';
  $('#lg-name').textContent = ''; $('#lg-stats').textContent = '';
  const f = $('#lg-flavor'); f.textContent = '以指触石，可知灵根。'; f.className = 'lg-flavor dim';
  $('#btn-test').querySelector('.bb-text').textContent = '测灵根'; $('#btn-test').disabled = false;
  $('#btn-start').hidden = true;
  $$('.el').forEach(e => e.classList.remove('on'));
  $('#stone-center').textContent = '测'; $('#stone-glow').style.opacity = 0;
}
function randName() { return pick(NAMES_XING) + pick(NAMES_MING); }
function rollLinggen() {
  const tot = LINGGEN.reduce((a, b) => a + b.w, 0); let r = Math.random() * tot, lg = LINGGEN[LINGGEN.length - 1];
  for (const l of LINGGEN) { if ((r -= l.w) < 0) { lg = l; break; } }
  const sh = [...ELEMENTS].sort(() => Math.random() - 0.5);
  const n = { tian: 1, shuang: 2, san: 3, si: 4, wei: 5 }[lg.id];
  const els = lg.id === 'yi' ? [pick(['雷', '风', '冰'])] : sh.slice(0, n).sort((a, b) => ELEMENTS.indexOf(a) - ELEMENTS.indexOf(b));
  const wx = clamp(3 + Math.floor(Math.random() * 5) + (Math.random() < 0.12 ? 2 : 0), 1, 10);
  return { lg, els, wx, luck: Math.floor(Math.random() * 6) };
}
async function doTest() {
  if (testing) return; testing = true;
  const btn = $('#btn-test'); btn.disabled = true; $('#btn-start').hidden = true;
  const stone = $('#stone'), glow = $('#stone-glow'), center = $('#stone-center');
  $$('.el').forEach(e => e.classList.remove('on'));
  glow.style.opacity = 0; center.style.opacity = 0.3;
  $('#lg-name').textContent = ''; $('#lg-stats').textContent = '';
  const fl = $('#lg-flavor'); fl.className = 'lg-flavor dim'; fl.textContent = '灵气入石……';
  stone.classList.remove('testing'); void stone.offsetWidth; stone.classList.add('testing');
  const els = $$('.el');
  for (let i = 0; i < 10; i++) {
    const e = els[i % 5]; e.style.setProperty('--c', EL_HEX[e.textContent]); e.classList.add('on');
    await sleep(110); e.classList.remove('on');
  }
  roll = rollLinggen();
  const col = EL_HEX[roll.els[0]];
  els.forEach(e => { if (roll.els.includes(e.textContent)) { e.style.setProperty('--c', EL_HEX[e.textContent]); e.classList.add('on'); } });
  glow.style.background = `radial-gradient(circle, ${col}cc, ${col}00 70%)`; glow.style.opacity = roll.lg.id === 'wei' ? 0.25 : 0.85;
  center.style.opacity = 1;
  center.textContent = roll.lg.id === 'yi' || roll.lg.id === 'tian' ? roll.els[0] : roll.lg.id === 'wei' ? '杂' : cn(roll.els.length);
  const nm = $('#lg-name');
  nm.innerHTML = `<span class="lg-el"></span><span class="lg-n"></span>`;
  nm.querySelector('.lg-el').textContent = roll.lg.id === 'wei' ? '' : roll.els.join('');
  inkWrite(nm.querySelector('.lg-n'), roll.lg.name, { immediate: true, step: 120 });
  fl.className = 'lg-flavor';
  const d = inkWrite(fl, linggenFlavor(roll.lg, roll.els), { immediate: true, step: 16 });
  setTimeout(() => {
    $('#lg-stats').innerHTML = `<span>资质 <b>${roll.lg.word}</b></span><span>悟性 <b>${cn(roll.wx)}</b> · ${wuxingWord(roll.wx)}</span>`;
    $('#lg-stats').classList.add('bleed-in');
  }, Math.min(d, 1600));
  await sleep(900);
  testing = false;
  $('#btn-start').hidden = false;
  if (rerolls > 0) { btn.disabled = false; btn.querySelector('.bb-text').textContent = `再测·余${cn(rerolls)}`; }
  else { btn.querySelector('.bb-text').textContent = '天意已定'; }
}
function initCreate() {
  $('#btn-randname').onclick = () => { $('#inp-name').value = randName(); };
  $('#btn-test').onclick = () => { if (roll) { if (rerolls <= 0) return; rerolls--; } doTest(); };
  $('#btn-start').onclick = () => {
    if (!roll) return;
    let name = $('#inp-name').value.trim().replace(/\s+/g, '');
    if (!name) { name = randName(); $('#inp-name').value = name; }
    newGame(name, roll);
  };
  $('#inp-name').addEventListener('keydown', e => { if (e.key === 'Enter') e.target.blur(); });
}

function newGame(name, r) {
  let legacy = null;
  try { legacy = JSON.parse(localStorage.getItem(LEGACY_KEY)); localStorage.removeItem(LEGACY_KEY); } catch (e) {}
  S = Core.newState(name, r, legacy);
  const lgDesc = (r.lg.id === 'wei' ? '' : r.els.join('')) + r.lg.name;
  const sectLine = {
    tian: `测得${lgDesc}，满堂皆惊。宗主亲自下山，将你收为真传弟子。同来的少年们望着你，目光里有羡慕，也有别的什么。`,
    yi: `测得${lgDesc}，执事长老当场将你收入内门。同来的少年们望着你，目光里有羡慕，也有别的什么。`,
    shuang: `测得${lgDesc}，你被收入内门，赐下一枚青玉腰牌。`,
    san: `测得${lgDesc}，你被分入外门，领了一套灰布道袍、一卷《青冥引气诀》。`,
    si: `测得${lgDesc}，你被分去药园做杂役，每日浇水除草，夜里才能偷偷打坐。`,
    wei: '测得伪灵根，青冥宗不收。你在山门外站了一夜，第二天清早，独自往深山里去了。',
  }[r.lg.id];
  pushLog({ text: `大衍历三千七百二十一年，春。青冥宗开山收徒。你名${name}，青石镇人氏，年方十六。`, cls: 'sys' });
  pushLog({ text: sectLine });
  if (legacy) pushLog({ text: '入山那夜，你梦见一柄断剑沉在云海深处，剑身上刻着一个陌生的名字。醒来时，许多道理竟像早已懂得。', tags: [{ t: '前世残念 · 悟性 +1', c: 'up' }], cls: 'gold' });
  pushLog({ text: '山门之外，云海翻涌。此去长生，不问归期。', cls: 'gold', div: true });
  save();
  enterMain(false);
}

/* ================= 主界面 ================= */
function enterMain(fromSave) {
  $('#log').innerHTML = '';
  const logs = S.log.slice(-30);
  unrollTo('main').then(() => {
    // 先铺陈旧事，最后三条以墨晕写出
    render();
    logs.forEach((e, i) => renderEntry(e, fromSave ? i >= logs.length - 2 : true));
    scrollLog();
    if (typeof JHUI !== 'undefined') setTimeout(JHUI.resume, 700);
  });
  render();
}
function pushLog(e) {
  e.time = timeLabel();
  S.log.push(e); if (S.log.length > 60) S.log.splice(0, S.log.length - 60);
  if (curScreen === 'main' && !document.getElementById('scr-main').hidden) { renderEntry(e, true); scrollLog(); }
}
function renderEntry(e, animate) {
  const log = $('#log');
  if (e.div && log.children.length) {
    const d = document.createElement('div'); d.className = 'entry-div';
    d.innerHTML = Ink.brushSVG(300, 10, (log.children.length * 7) % 97 + 1); log.appendChild(d);
  }
  const el = document.createElement('div'); el.className = 'entry ' + (e.cls || '');
  const t = document.createElement('div'); t.className = 'entry-time'; t.textContent = e.time || ''; el.appendChild(t);
  if (e.title) { const h = document.createElement('div'); h.className = 'entry-title'; h.textContent = e.title; el.appendChild(h); }
  const p = document.createElement('div'); p.className = 'entry-text'; el.appendChild(p);
  log.appendChild(el);
  let delay = 0;
  if (animate) { delay = inkWrite(p, e.text); t.classList.add('bleed-in'); } else p.textContent = e.text;
  if (e.tags && e.tags.length) {
    const tg = document.createElement('div'); tg.className = 'entry-tags';
    tg.innerHTML = e.tags.map(x => `<span class="${x.c || ''}">${x.t}</span>`).join('');
    if (animate) { tg.style.opacity = 0; setTimeout(() => { tg.style.opacity = ''; tg.classList.add('bleed-in'); }, delay); }
    el.appendChild(tg);
  }
  while (log.children.length > 80) log.removeChild(log.firstChild);
}
function scrollLog() { const l = $('#log'); requestAnimationFrame(() => l.scrollTop = l.scrollHeight); }

// 单行自适应：放不下就逐级缩小字号，绝不折行
function fitLine(el, max, min) {
  if (!el || !el.clientWidth) return;
  let f = max; el.style.fontSize = f + 'px'; el.style.letterSpacing = '';
  while (el.scrollWidth > el.clientWidth + 0.5 && f > min) { f -= 0.5; el.style.fontSize = f + 'px'; el.style.letterSpacing = '0.02em'; }
}
const prev = {};
const tweens = {};
function setText(sel, v) {
  const el = $(sel); if (!el) return; v = String(v);
  if (prev[sel] === v) return;
  const old = prev[sel]; prev[sel] = v;
  if (old === undefined || FX.reduced() || document.body.dataset.screen !== 'main') { el.textContent = v; return; }
  // 阿拉伯数字（如 修为 31 / 160）：数值滚动递增
  const na = old.match(/^(\d+)( \/ .*)$/), nb = v.match(/^(\d+)( \/ .*)$/);
  if (na && nb && na[2] === nb[2]) {
    const a = +na[1], b = +nb[1], t0 = performance.now(), D = 900;
    cancelAnimationFrame(tweens[sel]);
    const step = now => { const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(a + (b - a) * e) + nb[2]; if (k < 1) tweens[sel] = requestAnimationFrame(step); };
    tweens[sel] = requestAnimationFrame(step); return;
  }
  // 汉字数值：自下而上翻入
  el.innerHTML = ''; const sp = document.createElement('span'); sp.className = 'roll-in'; sp.textContent = v; el.appendChild(sp);
}
function render() {
  if (!S) return; sync();
  const r = R();
  setText('#h-realm', r.name); setText('#h-stage', r.stages[S.stage]);
  setText('#h-name', S.name); setText('#h-sub', `${Core.rankName(S)} · ${S.lg.id === 'wei' ? '' : S.lgEls.join('')}${S.lg.name}`);
  const so = Core.org(S); $('#sect-seal-t').textContent = so ? so.seal : '游';
  $('#btn-sect').classList.toggle('ready', !!(so && Core.canPromote(S).ok)); fitLine($('#h-sub'), 11.5, 9);
  const rq = req(); if (S.xw > rq && isLast()) S.xw = rq; const p = clamp(S.xw / rq, 0, 1);
  const fill = $('#xw-fill'); fill.parentElement.style.setProperty('--p', (p * 100).toFixed(1) + '%');
  fill.classList.toggle('full', bottleneck());
  setText('#xw-num', `${fmtNum(S.xw)} / ${fmtNum(rq)}`);
  const lifeLeft = clamp((S.lifespan - S.age) / (S.lifespan - 16 || 1), 0, 1);
  const inc = $('.incense'); inc.style.setProperty('--life', (Math.max(0.02, lifeLeft) * 100).toFixed(1) + '%');
  setText('#life-num', `${S.age} / ${S.lifespan}`);
  const lowLife = S.lifespan - S.age <= Math.max(6, (S.lifespan - 16) * 0.12);
  $('.bar-life').classList.toggle('low', lowLife);
  const season = Math.floor((S.months % 12) / 3);
  setText('#c-age', cn(S.age)); setText('#c-season', ['春', '夏', '秋', '冬'][season]);
  FX.setSeason(season); FX.setGold(S.realm || 0);
  document.body.dataset.realm = S.ascended ? 5 : S.realm;
  setText('#c-wx', cn(S.wx)); setText('#c-xj', xinjingWord(S.xj)); setText('#c-ls', S.ls > 9999 ? fmtNum(S.ls) : cn(S.ls));
  const tm = Core.gt(S, 'time', 1);
  setText('#dur-tuna', cnDur(Math.round(r.T * K.tunaMonths * tm))); setText('#dur-biguan', cnDur(Math.round(r.T * K.biguanMonths * tm)));
  const cnt = Object.values(S.items).reduce((a, b) => a + b, 0);
  setText('#bag-count', cnt ? `${cn(cnt)}物` : '空');
  if (typeof JHUI !== 'undefined') setText('#youli-sub', JHUI.youliSub());
  $('#btn-break').hidden = !bottleneck() || S.dead || S.ascended;
  const st = $('#status-line'); st.classList.remove('zhu');
  let msg = '';
  if (bottleneck()) { msg = '瓶颈已至 · 可破境'; st.classList.add('zhu'); }
  else if (S.inj > 0) { msg = `伤势未愈 · 修炼减半`; st.classList.add('zhu'); }
  else if (S.buff) msg = `灵脉加持 · 余${cn(S.buff.n)}次`;
  else if (lowLife) { msg = '寿元无多'; st.classList.add('zhu'); }
  else if (S.xj < 15) { msg = '心境动摇 · 恐生心魔'; st.classList.add('zhu'); }
  else if (S.gf && GONGFA[S.gf].mo) msg = `魔功在身 · ${GONGFA[S.gf].name}`;
  st.textContent = msg;
  renderSide();
}
// 宽屏右栏：功法 / 宗门 / 行囊 / 行迹 一览（窄屏隐藏时不渲染）
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function renderSide() {
  const side = $('#side'); if (!side || !side.offsetParent || !S) return;
  const g = S.gf && GONGFA[S.gf];
  $('#sd-gf').innerHTML = g ? `<b class="sd-name">《${esc(g.name)}》</b><span class="sd-row"><em>${GF_GRADE[g.grade]}</em>${S.gfs[S.gf].lv >= GF_LAYERS ? '大成' : '第' + cn(S.gfs[S.gf].lv) + '层'} · 行功×${Core.gfSpeed(S).toFixed(2)}</span>`
    : '<span class="sd-empty">胸中尚无功法</span>';
  const o = Core.org(S);
  $('#sd-sect').innerHTML = o ? `<b class="sd-name">${esc(o.name)}</b><span class="sd-row">${esc(Core.rankName(S))} · 贡献 ${fmtNum(S.sect.gx)}</span>`
    : `<b class="sd-name">${esc(Core.rankName(S))}</b><span class="sd-row">无门无派，来去自由</span>`;
  const items = Object.entries(S.items).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  $('#sd-bag').innerHTML = items.length ? `<ul class="sd-list">${items.slice(0, 5).map(([k, n]) => `<li><span>${esc(k)}</span><i>${cn(n)}</i></li>`).join('')}</ul>${items.length > 5 ? `<span class="sd-more">另有${cn(items.length - 5)}种</span>` : ''}`
    : '<span class="sd-empty">囊中空空</span>';
  const loc = typeof LOCS !== 'undefined' && LOCS.find(l => l.id === S.loc);
  const notes = [];
  if (S.dan) notes.push(`丹道 ${cn(S.dan.lv)}重`);
  if (typeof JHUI !== 'undefined' && JHUI.aucWindow()) notes.push('<span class="zhu">听雨楼拍卖将开</span>');
  if (typeof Jianghu !== 'undefined' && S.mj) { const open = Jianghu.mjAll ? Object.keys(S.mj).filter(id => Jianghu.mjOpen(S, id)) : []; if (open.length) notes.push(`<span class="zhu">秘境现世 · ${open.map(id => esc(MIJING[id].name)).join('、')}</span>`); }
  $('#sd-loc').innerHTML = `<b class="sd-name">${loc ? esc(loc.name) : '山中'}</b><span class="sd-row">${notes.join('<br>') || '暂无风声'}</span>`;
}

/* ================= 行动 ================= */
let busy = false;
function lock(ms) { busy = true; $$('.act').forEach(b => b.classList.add('busy')); setTimeout(() => { busy = false; $$('.act').forEach(b => b.classList.remove('busy')); }, ms); }
function act(kind) {
  if (busy || !S || S.dead || S.ascended) return;
  if (kind === 'bag') return openBag();
  const r = R();
  if (kind === 'tuna') {
    lock(1500);
    const B = buffer(), o = Core.tuna(S, B.emit);
    save();
    // 灵气旋入丹田之后，才落笔记下这一季
    const done = () => {
      if (!S) return;
      pushLog({ text: o.text, tags: o.tags }); B.flush(); Core.afterGain(S, o.ups, pushLog); render(); save(); checkEnd();
      const bx = $('.bar-xw'); bx.classList.remove('gain'); void bx.offsetWidth; bx.classList.add('gain');
      clearTimeout(act.gt); act.gt = setTimeout(() => bx.classList.remove('gain'), 1500);
    };
    if (typeof InkGL !== 'undefined' && InkGL.qi) InkGL.qi($('.scroll-paper'), { cy: .5, onSink: done });
    else { const sp = $('.scroll-paper').getBoundingClientRect(); FX.qiSwirl(sp.left + sp.width / 2, sp.top + sp.height * 0.55, done); }
    return;
  } else if (kind === 'biguan') {
    lock(1100);
    FX.cave();
    const B = buffer(), o = Core.biguan(S, B.emit);
    pushLog({ text: o.text, tags: o.tags, cls: o.cls }); B.flush();
    Core.afterGain(S, o.ups, pushLog);
  } else if (kind === 'youli' && typeof JHUI !== 'undefined') {
    return JHUI.openMap();
  } else if (kind === 'youli') {
    Core.passTime(S, r.T * K.youliMonths, pushLog);
    if (S.dead) { render(); save(); return checkEnd(); }
    const ev = Core.pickEvent(S);
    render(); save();
    busy = true; $$('.act').forEach(b => b.classList.add('busy'));
    // 先把卷上的字推上去，空出卷底的远山，山路只画在空白处
    const log = $('#log'), paperR = $('.scroll-paper').getBoundingClientRect();
    const spacer = document.createElement('div'); spacer.className = 'log-spacer'; spacer.style.height = Math.round(paperR.height * 0.44) + 'px';
    log.appendChild(spacer); log.scrollTo({ top: log.scrollHeight, behavior: FX.reduced() ? 'auto' : 'smooth' });
    sleep(FX.reduced() ? 0 : 520).then(() => FX.inkPath(paperR)).then(() => {
      busy = false; $$('.act').forEach(b => b.classList.remove('busy'));
      openEvent(ev);
      setTimeout(() => spacer.remove(), 900);
    });
    return;
  }
  render(); save(); checkEnd();
}
let endT = 0;
function checkEnd() {
  if (S && S.dead && !endT) endT = setTimeout(() => { endT = 0; if (S && S.dead) showEnd(S.ending || 'zuohua'); }, 1800);
  else if (S && !S.dead && S.sect && S.sect.dabiDue) setTimeout(dabiInvite, 1400);
}

/* ================= 奇遇卷轴 ================= */
const modal = $('#modal');
async function openModal() {
  modal.hidden = false;
  const hs = $('#hscroll');
  hs.style.setProperty('--half', (hs.offsetWidth / 2 - 10) + 'px');
  $('.ev-main').scrollTop = 0;
  await sleep(30);
  modal.classList.add('open');
}
async function closeModal() {
  modal.classList.remove('open');
  await sleep(850);
  modal.hidden = true;
}
function openEvent(ev) {
  FX.vtext($('#ev-title'), ev.title);
  $('#ev-seal').textContent = ev.seal || pick(['缘', '遇', '奇', '机']);
  const text = ev.text(S);
  $('#ev-result').innerHTML = '';
  const box = $('#ev-choices'); box.innerHTML = ''; box.className = 'ev-choices';
  openModal();
  const d = inkWrite($('#ev-text'), text, { immediate: true, step: 20 });
  const startAt = 650 + d * 0.55;
  ev.choices(S).forEach((c, i) => {
    const b = document.createElement('button'); b.className = 'choice'; b.disabled = !!c.disabled;
    b.style.animationDelay = (startAt + i * 120) + 'ms';
    b.innerHTML = `<span></span><small></small>`; b.firstChild.textContent = c.label; b.lastChild.textContent = c.sub || '';
    b.onclick = () => choose(ev, c, b, text);
    box.appendChild(b);
  });
}
function choose(ev, c, btn, evText) {
  const box = $('#ev-choices'); if (box.classList.contains('chosen')) return;
  btn.classList.add('picked'); box.classList.add('chosen');
  const res = Core.resolveChoice(S, c);
  const B = buffer(), { tags, ups } = Core.applyFx(S, res.fx || {}, B.emit);
  if (res.fx && res.fx.gf) FX.goldMotes && setTimeout(() => { const t = $('#ev-result').getBoundingClientRect(); FX.goldMotes(t.left + t.width / 2, t.top + 20); }, 900);
  const out = $('#ev-result');
  const p = document.createElement('p'); p.className = 'r-text'; out.appendChild(p);
  const d = inkWrite(p, res.text, { immediate: true, step: 20 });
  const tg = document.createElement('div'); tg.className = 'entry-tags'; tg.style.opacity = 0;
  tg.innerHTML = tags.map(x => `<span class="${x.c || ''}">${x.t}</span>`).join('') || '<span>无事发生</span>';
  out.appendChild(tg);
  const close = document.createElement('button'); close.className = 'brush-btn small'; close.style.opacity = 0;
  close.innerHTML = '<span class="bb-ink"></span><span class="bb-text">收卷</span>';
  out.appendChild(close);
  setTimeout(() => { tg.style.opacity = ''; tg.classList.add('bleed-in'); close.style.opacity = ''; close.classList.add('bleed-in');
    const m = $('.ev-main'); m.scrollTo({ top: m.scrollHeight, behavior: 'smooth' }); }, Math.min(d, 2200) + 200);
  setTimeout(() => { const m = $('.ev-main'); m.scrollTo({ top: m.scrollHeight, behavior: 'smooth' }); }, 400);
  close.onclick = async () => {
    await closeModal();
    pushLog({ title: ev.title, text: `${c.label.replace(/[“”]/g, '')}——${res.text}`, tags, cls: 'event', div: true });
    B.flush(); Core.afterGain(S, ups, pushLog);
    render(); save(); checkEnd();
    if (res.after && !S.dead) res.after();
  };
  render(); save();
}

/* ================= 破境 ================= */
const btChance = usePill => Core.btChance(S, usePill);
const chanceWord = p => { const n = Math.round(p * 10); return n <= 1 ? '九死一生' : n >= 9 ? '十拿九稳' : `约莫${cn(n)}成`; };
function openBreak() {
  if (!bottleneck() || busy) return;
  const r = R(), next = NEXT_REALM_NAME[S.realm], pill = r.pill, has = S.items[pill] > 0;
  FX.vtext($('#ev-title'), S.realm === 4 ? '渡劫' : '破境');
  $('#ev-seal').textContent = '劫';
  $('#ev-result').innerHTML = '';
  const box = $('#ev-choices'); box.innerHTML = ''; box.className = 'ev-choices';
  let t = `你已至${r.name}${r.stages[r.stages.length - 1]}，${S.realm === 4 ? '天劫将临' : '关隘就在眼前'}。欲${S.realm === 4 ? '渡劫飞升' : '破' + next}，以你此刻的心境与根骨，把握${chanceWord(btChance(false))}。`;
  if (has) t += `囊中尚有${pill}一枚，服之可增二成把握。`;
  if (S.inj > 0) t += '你身上伤势未愈，此时破境，凶险倍增。';
  if (S.fails) t += `此前已败${cn(S.fails)}次，屡败屡战，心志愈坚。`;
  const help = Core.npcHelp(S).who.map(id => NPCS[id].name);
  if (help.length) t += `${help.join('、')}${help.length > 1 ? '皆' : ''}在洞府外为你护法。`;
  if (K.btDeath[S.realm]) t += S.items['兵解玉符'] > 0 ? '此境破关，败则有身死之虞。好在袖中玉符温润，似在低语：纵使身殒，道不必绝。' : '此境破关，已非儿戏——一旦失手，便有身死道消之虞。';
  if (S.gf && GONGFA[S.gf].mo && S.xj < 15) t += '魔功反噬在即，心神摇摇欲坠，此时破关，凶多吉少。';
  openModal();
  const d = inkWrite($('#ev-text'), t, { immediate: true, step: 20 });
  const opts = [];
  if (has) opts.push({ label: `服${pill}，破境`, sub: chanceWord(btChance(true)), go: true, pill: true });
  opts.push({ label: has ? '不服丹，强行破境' : '凝神静气，破境', sub: chanceWord(btChance(false)), go: true, pill: false });
  opts.push({ label: '暂缓，再积累些时日', sub: '', go: false });
  opts.forEach((o, i) => {
    const b = document.createElement('button'); b.className = 'choice'; b.style.animationDelay = (500 + d * 0.5 + i * 120) + 'ms';
    b.innerHTML = '<span></span><small></small>'; b.firstChild.textContent = o.label; b.lastChild.textContent = o.sub;
    b.onclick = async () => {
      if (box.classList.contains('chosen')) return; box.classList.add('chosen'); b.classList.add('picked');
      await closeModal();
      if (o.go) runBreak(o.pill);
    };
    box.appendChild(b);
  });
}
async function runBreak(usePill) {
  busy = true;
  const r = R(), B = buffer(), res = Core.resolveBreak(S, usePill, B.emit), from = res.from, ok = res.ok;
  save();
  const bt = $('#bt'); bt.className = 'bt'; bt.hidden = false;
  const lines = $('#bt-lines'), big = $('#bt-big'), a = $('#bt-a'), b = $('#bt-b'), txt = $('#bt-text'), close = $('#bt-close');
  lines.innerHTML = ''; txt.textContent = ''; close.hidden = true;
  const target = NEXT_REALM_NAME[from];
  a.textContent = b.textContent = target;
  $('#bt-stamp-t').textContent = ok ? '成' : '败';
  await sleep(30); bt.classList.add('go');
  if (InkGL.spreadOk && !FX.reduced()) {   // 浓墨以扭曲的边缘自中心洇满全屏
    const cv = $('#inkfx'); cv.classList.remove('fade'); bt.insertBefore(cv, $('#bt-ink')); bt.classList.add('gl');
    InkGL.spread({ mode: 1, y: innerHeight * .44, from: 0, to: 1.08, dur: 2600, ease: 'inOut', scale: .5, z: 'auto' });
  }
  await sleep(1000);
  const l1 = document.createElement('div'); lines.appendChild(l1);
  inkWrite(l1, usePill ? `服下${r.pill}，凝神静气` : '凝神静气，抱元守一', { immediate: true, step: 60 });
  await sleep(1100);
  bt.classList.add('charge');
  const l2 = document.createElement('div'); lines.appendChild(l2);
  inkWrite(l2, from === 4 ? '劫云压顶……' : '引天地灵气，冲击瓶颈……', { immediate: true, step: 70 });
  await sleep(1900);
  bt.classList.remove('charge');
  bt.classList.add('reveal');
  if (ok) {
    await sleep(500); bt.classList.add('glory');
    const bb = $('#bt-big').getBoundingClientRect(); FX.goldMotes(bb.left + bb.width / 2, bb.top + bb.height / 2);
    await sleep(800);
  } else await sleep(1300);
  if (!ok) { bt.classList.add('fail', 'crack'); bt.classList.add('shake'); await sleep(500); }
  bt.classList.add('stamped');
  await sleep(500);
  // 结算（规则层已算定，这里只落笔）
  const logText = res.text;
  if (res.ending) bt.classList.add('end-' + res.ending);
  inkWrite(txt, logText, { immediate: true, step: 26 });
  save();
  await sleep(1600);
  close.hidden = false; close.classList.add('bleed-in');
  close.onclick = async () => {
    bt.classList.add('leave'); await sleep(900); bt.hidden = true; bt.className = 'bt';
    const cv = $('#inkfx'); if (cv.parentNode === bt) { InkGL.hide(); document.body.insertBefore(cv, $('#grain')); }
    busy = false;
    const ttl = ok ? (from === 4 ? '飞升' : `破境 · ${NEXT_REALM_NAME[from]}`) : { bingjie: '兵解', yunluo: '身殒', rumo: '入魔' }[res.ending] || '破境未果';
    pushLog({ title: ttl, text: logText, cls: ok ? 'gold' : 'warn', div: true });
    B.flush(); render(); save();
    if (S.ascended) setTimeout(() => showEnd('ascend'), 1600); else checkEnd();
  };
}

/* ================= 宗门 ================= */
const TOKEN_MAT = {
  木: ['#8a6744', '#4e3622', '#efdfbd'], 青玉: ['#7fa896', '#3d6556', '#f2f7f0'], 白玉: ['#f6f2e6', '#d3ccb8', '#2a2622'],
  墨玉: ['#34312c', '#100f0d', '#d4b06a'], 赤金: ['#c87a44', '#7a2f18', '#f8e6b8'], 紫金: ['#e0c06e', '#94702e', '#3a2a10'],
  铁: ['#6a6a66', '#2c2c2a', '#e6e2d8'], 青铜: ['#7d9474', '#3b5040', '#eef2e6'], 乌金: ['#3c3732', '#161412', '#d4b06a'],
  玄铁: ['#39414b', '#11151a', '#d8dde2'], 赤铜: ['#b8683e', '#6a2a18', '#f8e6c8'], 紫铜: ['#a56452', '#5a2a24', '#f8e2d2'],
};
let tokenSeq = 0;
function tokenSVG(orgId, rank, big) {
  const o = ORGS[orgId], mat = TOKEN_MAT[o.token[rank]] || TOKEN_MAT['木'], id = 'tk' + (++tokenSeq);
  const name = o.ranks[rank].replace('弟子', ''), chars = [...name], n = chars.length;
  const fs = n <= 2 ? 44 : 34, y0 = n <= 2 ? 150 : 128, gap = n <= 2 ? 52 : 40;
  const txt = chars.map((c, i) => `<text x="70" y="${y0 + i * gap}" text-anchor="middle" font-size="${fs}" class="seal-font" fill="${mat[2]}">${c}</text>`).join('');
  const shape = 'M22 70 Q20 40 46 36 Q54 10 70 10 Q86 10 94 36 Q120 40 118 70 L118 262 Q118 276 104 276 L36 276 Q22 276 22 262 Z';
  return `<svg viewBox="0 0 140 340" class="token-svg${big ? ' big' : ''}"><defs>
    <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${mat[0]}"/><stop offset="1" stop-color="${mat[1]}"/></linearGradient>
    <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <clipPath id="${id}c"><path d="${shape}"/></clipPath></defs>
    <path class="tk-cord" d="M70 22 L70 -40" />
    <path d="${shape}" fill="url(#${id}g)" stroke="rgba(0,0,0,.35)" stroke-width="1.5"/>
    <path d="M30 74 Q30 48 50 44 Q58 20 70 20 Q82 20 90 44 Q110 48 110 74 L110 258 Q110 268 100 268 L40 268 Q30 268 30 258 Z" fill="none" stroke="${mat[2]}" stroke-opacity=".45" stroke-width="1.4"/>
    <circle cx="70" cy="30" r="5" fill="rgba(0,0,0,.45)"/>
    <text x="70" y="${n <= 2 ? 92 : 88}" text-anchor="middle" font-size="15" letter-spacing="4" class="seal-font" fill="${mat[2]}" opacity=".8">${o.short}</text>
    ${txt}
    <g clip-path="url(#${id}c)"><rect class="tk-sheen" x="-160" y="-20" width="90" height="400" fill="url(#${id}s)" transform="rotate(18 70 170)"/></g>
    <g class="tk-tassel"><path d="M70 276 L70 300" stroke="#9e2a22" stroke-width="3"/><circle cx="70" cy="302" r="5" fill="#9e2a22"/>
    ${[-7, -3.5, 0, 3.5, 7].map(dx => `<path d="M${70 + dx * .4} 306 Q${70 + dx} 320 ${70 + dx * 1.3} 338" stroke="#b3302a" stroke-width="1.6" fill="none"/>`).join('')}</g></svg>`;
}
const gradeNames = ['凡', '灵', '地', '天'];
function openSect(tab) {
  const o = Core.org(S);
  const tabs = o ? [['home', o.id === 'qm' ? '宗门' : '盟中'], ['task', '任务'], ['lib', o.id === 'qm' ? '藏经' : '秘库'], ['npc', '人物']] : [['home', '散修'], ['npc', '人物']];
  tab = tab && tabs.find(t => t[0] === tab) ? tab : tabs[0][0];
  const wrap = document.createElement('div'); wrap.className = 'bag-wrap sect-wrap';
  wrap.innerHTML = `<div class="sheet-tabs">${tabs.map((t, i) => `${i ? '<i class="stab-dot"></i>' : ''}<button class="stab" data-t="${t[0]}">${t[1]}</button>`).join('')}</div><div class="tab-body"></div>`;
  const body = wrap.querySelector('.tab-body');
  const title = t => ({ home: o ? o.name : '散修', task: o && o.id === 'sx' ? '盟中悬赏' : '宗门任务', lib: o ? o.lib : '', npc: '人物' })[t];
  const show = t => {
    wrap.querySelectorAll('.stab').forEach(b => b.classList.toggle('on', b.dataset.t === t));
    $('#sheet-title').textContent = title(t);
    body.innerHTML = ''; body.appendChild({ home: sectHome, task: sectTasks, lib: sectLib, npc: sectNpc }[t]());
    body.classList.remove('tab-in'); void body.offsetWidth; body.classList.add('tab-in');
    $('#sheet-body').scrollTop = 0;
  };
  wrap.querySelector('.sheet-tabs').onclick = e => { const t = e.target.closest('.stab'); if (t) show(t.dataset.t); };
  openSheet(title(tab), wrap);
  show(tab);
}
function sectHome() {
  const w = document.createElement('div'); w.className = 'sect-home';
  const o = Core.org(S), sc = S.sect;
  if (!o) {
    w.innerHTML = `<div class="sect-card free"><div class="sect-card-v">${[...(sc.free ? '逍遥' : '散修')].map(c => `<i>${c}</i>`).join('')}</div>
      <div class="sect-card-info"><div class="sect-org">无门无派</div><p class="sect-note">${sc.free ? '你谢绝了宗门的招揽。山高水长，无人管束，游历之中，机缘自会寻上门来。' : '伪灵根不入宗门之眼。可天下之大，总有一扇门，会为肯走路的人打开。'}</p>
      <div class="perk"><b>${sc.free ? '逍遥' : '机缘'}</b><span>${sc.free ? '游历机缘更盛，所得修为更丰' : '筑基之后，或有宗门来招；坊市之中，亦有散修结盟'}</span></div></div></div>`;
    return w;
  }
  const r = sc.rank, cp = Core.canPromote(S), libCap = RANK_LIB[r];
  const pay = Math.round(o.ls[r] * REALMS[S.realm].lsScale);
  w.innerHTML = `<div class="sect-card"><div class="sect-token">${tokenSVG(o.id, r)}</div>
    <div class="sect-card-info"><div class="sect-org">${o.name}</div><div class="sect-rank">${o.ranks[r]}</div>
    <div class="sect-gx"><span>可用贡献 <b>${fmtNum(sc.gx)}</b></span><span>累计 <b>${fmtNum(sc.gxTotal)}</b></span></div></div></div>
    <div class="perks">
      <div class="perk"><b>俸禄</b><span>每${cn(K.payYears * R().T)}年 灵石${cn(pay)}${r >= 2 ? ' · 时有丹药' : ''}${K.stipendPill[r] ? ' · 偶赐破境丹' : ''}</span></div>
      <div class="perk"><b>灵脉</b><span>${o.cave[r] > 1 ? `闭关修为 +${Math.round((o.cave[r] - 1) * 100)}%` : '杂役居所，灵气稀薄'}</span></div>
      <div class="perk"><b>${o.lib.slice(0, 2)}</b><span>${libCap < 0 ? '杂役不得入阁' : `可入${gradeNames.slice(0, libCap + 1).join('、')}品诸层`}</span></div>
      ${(() => { const h = Core.npcHelp(S).who; return h.length ? `<div class="perk"><b>护法</b><span>${h.map(id => NPCS[id].name).join('、')} · 破境把握更增</span></div>` : ''; })()}
    </div>
    ${r < 6 ? `<div class="promo">
      <div class="promo-h"><span>晋升</span><em>${o.ranks[r + 1]}</em></div>
      <div class="req ${cp.gxOk ? 'ok' : ''}"><span>累计贡献</span><div class="req-bar"><i style="width:${Math.min(100, sc.gxTotal / cp.need.gx * 100).toFixed(1)}%"></i></div><b>${fmtNum(sc.gxTotal)} / ${fmtNum(cp.need.gx)}</b></div>
      <div class="req ${cp.realmOk ? 'ok' : ''}"><span>境界</span><div class="req-word">${REALMS[cp.need.realm].name}${cp.need.stage ? REALMS[cp.need.realm].stages[cp.need.stage] : ''}以上</div><b>${cp.realmOk ? '已足' : '未足'}</b></div>
      <button class="brush-btn small promo-btn" ${cp.ok ? '' : 'disabled'}><span class="bb-ink"></span><span class="bb-text">请升${o.ranks[r + 1].replace('弟子', '')}</span></button>
    </div>` : '<div class="sect-note center">位极一宗，再无可升。</div>'}
    <div class="dabi-line">${r <= 3 ? `下届${o.dabi} · 约${cn(Math.max(1, Math.ceil((sc.dabiAt - S.months) / 12)))}年后` : `${o.dabi} · 你已列席观礼`}${sc.dabiBest >= 0 ? `<br>最佳名次 · ${DABI_PLACE[sc.dabiBest]}` : ''}</div>`;
  const pb = w.querySelector('.promo-btn');
  if (pb) pb.onclick = async () => { if (!Core.canPromote(S).ok) return; await closeSheet(); const res = Core.promote(S, pushLog); if (res) runRite(res); };
  return w;
}
function sectTasks() {
  const w = document.createElement('div'); w.className = 'tasks';
  const ms = Core.ensureMissions(S); save();
  if (!ms.length) { w.innerHTML = '<div class="empty">近来无事可领</div>'; return w; }
  ms.forEach(mi => {
    const info = Core.missionInfo(S, mi);
    const c = document.createElement('div'); c.className = 'task r' + Math.min(3, Math.floor(info.risk / 0.12));
    c.innerHTML = `<span class="task-seal">${info.m.seal}</span><div class="task-info"><div class="task-name">${info.name}</div><p class="task-brief"></p>
      <div class="task-meta"><span>耗时 ${cnDur(info.months)}</span><span class="risk">${info.riskWord}</span></div>
      <div class="task-pay">酬 · 贡献 ${fmtNum(info.gx)} · 灵石 ${fmtNum(info.ls)}</div></div><button class="item-use">接令</button>`;
    c.querySelector('.task-brief').textContent = info.brief;
    c.querySelector('button').onclick = async () => { await closeSheet(); const ev = Core.missionEvent(S, mi.uid); if (ev) openEvent(ev); };
    w.appendChild(c);
  });
  const every = 12 * R().T * K.mYears, left = Math.max(1, Math.ceil((S.sect.mAt + every - S.months) / 12));
  const f = document.createElement('div'); f.className = 'sect-note center'; f.textContent = `执事堂的告示，约${cn(left)}年一换`; w.appendChild(f);
  return w;
}
function sectLib() {
  const w = document.createElement('div'); w.className = 'lib';
  const o = Core.org(S);
  w.innerHTML = `<div class="lib-h"><span>${o.lib}</span><em>可用贡献 ${fmtNum(S.sect.gx)}</em></div>`;
  let lastG = -1;
  Core.libList(S).forEach(it => {
    if (it.g.grade !== lastG) { lastG = it.g.grade; const h = document.createElement('div'); h.className = 'lib-floor'; h.textContent = `${gradeNames[lastG]}品 · ${['一', '二', '三', '顶'][lastG]}层`; w.appendChild(h); }
    const row = document.createElement('div'); row.className = 'gf-row lib-row g' + it.g.grade + (it.open ? '' : ' locked') + (it.known ? ' known' : '');
    const needRank = RANK_LIB.findIndex(x => x >= it.g.grade);
    row.innerHTML = `<span class="gf-seal">${GF_GRADE[it.g.grade]}</span><div class="gf-row-info"><div class="gf-row-name">${it.g.name}</div>
      <div class="gf-row-sub">${gfElWord(it.id)} · ×${Core.gfSpeed(S, it.id).toFixed(2)}</div><div class="gf-row-trait">${it.g.trait}</div>
      <div class="gf-cost">耗贡献 ${fmtNum(it.cost)}，录入胸中</div></div>
      <button class="item-use" ${!it.open || it.known || S.sect.gx < it.cost ? 'disabled' : ''}>${it.known ? '已习' : !it.open ? `需${o.ranks[needRank].replace('弟子', '')}` : `${fmtNum(it.cost)}`}</button>`;
    const btn = row.querySelector('button');
    btn.onclick = () => {
      if (!row.classList.contains('confirm')) { w.querySelectorAll('.lib-row.confirm').forEach(r => { r.classList.remove('confirm'); }); row.classList.add('confirm'); btn.textContent = '研习'; return; }
      const res = Core.learnLib(S, it.id, pushLog); if (res.err) { toast(res.err); return; }
      pushLog({ title: o.lib, text: `你在${o.lib}中静坐三日，将《${it.g.name}》一字一句抄录于心。合上书页时，窗外的松影已移过了半面墙。`, tags: res.tags, cls: 'event', div: true });
      render(); save(); const body = w.parentNode; body.innerHTML = ''; body.appendChild(sectLib()); toast(`得《${it.g.name}》`);
    };
    w.appendChild(row);
  });
  return w;
}
function sectNpc() {
  const w = document.createElement('div'); w.className = 'npcs';
  Object.keys(NPCS).forEach(id => {
    const n = NPCS[id], st = S.npc[id], c = document.createElement('div');
    const isMaster = id === 'shifu';
    const known = st.met && (!isMaster || S.sect.master);
    c.className = 'npc' + (known ? '' : ' unmet') + (st.a < -10 ? ' foe' : st.a >= 50 ? ' close' : '');
    if (!known) {
      c.innerHTML = `<span class="npc-seal">？</span><div class="npc-info"><div class="npc-name">${isMaster && S.sect.org === 'qm' ? '师父' : '未曾相识'}</div><div class="npc-title">${isMaster && S.sect.org === 'qm' ? '晋内门弟子，方可拜师' : '萍水未逢'}</div></div>`;
    } else {
      const pct = (st.a + 100) / 2;
      c.innerHTML = `<span class="npc-seal">${n.seal}</span><div class="npc-info"><div class="npc-name">${n.name}<em>${Core.npcWord(st.a)}</em></div>
        <div class="npc-title">${n.title}</div><div class="npc-trait">${n.trait}</div>
        <div class="npc-aff"><i style="left:${Math.min(50, pct)}%;width:${Math.abs(pct - 50)}%" class="${st.a < 0 ? 'neg' : ''}"></i><b></b></div>
        <p class="npc-line"></p></div>`;
      c.querySelector('.npc-line').textContent = Core.npcLine(S, id);
    }
    w.appendChild(c);
  });
  return w;
}
/* 晋升：令牌显现 */
async function runRite(res) {
  busy = true;
  const el = $('#rite'), o = Core.org(S);
  el.className = 'rite'; el.hidden = false;
  $('#rite-token').innerHTML = tokenSVG(o.id, res.rank, true);
  $('#rite-title').innerHTML = `<span>晋</span>${res.name}`;
  $('#rite-text').textContent = ''; $('#rite-tags').innerHTML = ''; $('#rite-close').hidden = true;
  await sleep(30); el.classList.add('go');
  if (typeof InkGL !== 'undefined' && InkGL.spreadOk && !FX.reduced()) {
    const cv = $('#inkfx'); cv.classList.remove('fade'); el.insertBefore(cv, $('#rite-token')); el.classList.add('gl');
    InkGL.spread({ mode: 1, y: innerHeight * .4, from: 0, to: 1.08, dur: 2400, ease: 'inOut', scale: .5, z: 'auto' });
  }
  await sleep(FX.reduced() ? 100 : 1300);
  el.classList.add('show');
  await sleep(FX.reduced() ? 100 : 1900);
  el.classList.add('stamped');
  await sleep(500);
  const d = inkWrite($('#rite-text'), res.text, { immediate: true, step: 24 });
  $('#rite-tags').innerHTML = res.tags.map(x => `<span class="${x.c || ''}">${x.t}</span>`).join('');
  await sleep(Math.min(d, 2400) + 300);
  $('#rite-tags').classList.add('bleed-in');
  const close = $('#rite-close'); close.hidden = false; close.classList.add('bleed-in');
  close.onclick = async () => {
    el.classList.add('leave'); await sleep(900); el.hidden = true; el.className = 'rite';
    const cv = $('#inkfx'); if (cv.parentNode === el) { InkGL.hide(); document.body.insertBefore(cv, $('#grain')); }
    busy = false;
    pushLog({ title: `晋升 · ${res.name}`, text: res.text, tags: res.tags, cls: 'gold', div: true });
    render(); save(); checkEnd();
  };
}
/* 大比 */
let dabiOpen = false;
function dabiInvite() {
  if (!S || S.dead || !S.sect.dabiDue || busy || dabiOpen || !modal.hidden || !sheet.hidden || !$('#bt').hidden || !$('#rite').hidden) return;
  const o = Core.org(S); if (!o) { S.sect.dabiDue = false; return; }
  dabiOpen = true;
  const ev = { id: 'dabi', title: o.dabi, seal: '比',
    text: () => o.id === 'qm' ? `${o.dabi}，${cn(K.dabiYears * R().T)}年一度。演武台上的青石被扫得发亮，八名弟子的名牌挂在台前，其中一块，写着你的名字。台下人山人海，执事堂的老执事敲了三下铜锣。` : `${o.dabi}开擂，散修们从四面八方涌来，坊市里的赌档早早开了盘口。擂台边的木牌上，你的名字排在第七。`,
    choices: () => [
      { label: '登台', sub: '三战定名次', act: () => ({ text: '你整了整衣袍，一步步走上演武台。台下的喧哗声，忽然都远了。', fx: {}, after: startDabi }) },
      { label: '托病不出', sub: '贡献 · 心境稍减', act: s => { s.sect.dabiDue = false; return { text: '你递了一张告假条。那块写着你名字的名牌，被执事默默摘了下来。', fx: { gx: -2, xj: -2 } }; } },
    ] };
  openEvent(ev);
  setTimeout(() => { dabiOpen = false; }, 1500);
}
const DM = Object.fromEntries(DUEL_MOVES.map(m => [m.id, m]));
let duelState = null;
function hpPips(n, lost) { return Array.from({ length: 3 }, (_, i) => `<i class="${i >= n ? 'lost' : ''}${lost && i === n ? ' hit' : ''}"></i>`).join(''); }
async function startDabi() {
  busy = true;
  const t = Core.dabiNew(S), o = Core.org(S), el = $('#duel');
  el.className = 'duel'; el.hidden = false;
  $('#duel-ttl').textContent = o.dabi;
  $('#duel-mname').textContent = S.name;
  $('#duel-mstyle').textContent = `${REALMS[S.realm].name}${REALMS[S.realm].stages[S.stage]}${S.gf ? ' · 《' + GONGFA[S.gf].name + '》' : ''}`;
  await sleep(30); el.classList.add('go');
  const beat = []; let place = 0;
  for (let r = 0; r < 3; r++) {
    const won = await runDuel(t, r);
    if (won) { place = r + 1; if (t.opps[r].npc) beat.push(t.opps[r].npc); } else break;
  }
  const res = Core.dabiFinish(S, place, beat);
  await sleep(300);
  el.classList.add('leave'); await sleep(900); el.hidden = true; el.className = 'duel';
  busy = false;
  pushLog({ title: `${o.dabi} · ${DABI_PLACE[place]}`, text: res.text, tags: res.tags, cls: place >= 2 ? 'gold' : 'event', div: true });
  render(); save(); checkEnd();
}
function runDuel(t, r, o = {}) {
  return new Promise(async resolve => {
    const opp = t.opps[r], d = Core.duelNew(S, opp); duelState = d;
    const el = $('#duel');
    el.classList.remove('over', 'won', 'lost', 'strike', 'clash-on', 'hit-me', 'hit-o');
    $('#duel-rd').textContent = o.rd || DABI_ROUND[r];
    $('#duel-oname').textContent = opp.name.replace(/^.* · /, '');
    $('#duel-ostyle').textContent = (o.title || (opp.npc ? NPCS[opp.npc].title : opp.name.split(' · ')[0] + '弟子')) + ' · ' + STYLE_WORD[opp.style];
    $('#duel-ohp').innerHTML = hpPips(3); $('#duel-mhp').innerHTML = hpPips(3);
    $('#duel-round').textContent = ''; $('#duel-text').textContent = ''; $('#duel-tell').textContent = '';
    $('#duel-next').hidden = true; $('#duel-stamp').className = 'duel-stamp';
    el.classList.add('intro');
    const moves = $('#duel-moves');
    moves.innerHTML = DUEL_MOVES.map(m => `<button class="dmove" data-m="${m.id}"><span class="dm-ink"></span><b>${m.ch}</b><small>${m.hint}</small></button>`).join('');
    moves.classList.remove('on');
    const intro = o.intro || (opp.npc ? DUEL_INTRO[opp.npc] : pick(DUEL_INTRO._).replace('对手', opp.name.replace(/^.* · /, '')));
    await sleep(r === 0 ? 900 : 300);
    const di = inkWrite($('#duel-tell'), intro, { immediate: true, step: 22 });
    await sleep(Math.min(di, 1800) + 900);
    el.classList.remove('intro');
    const roundLoop = async () => {
      const tl = Core.duelTell(d);
      $('#duel-round').textContent = `第${cn(d.round + 1)}合`;
      $('#duel-round').classList.remove('bleed-in'); void $('#duel-round').offsetWidth; $('#duel-round').classList.add('bleed-in');
      $('#duel-text').textContent = '';
      inkWrite($('#duel-tell'), tl.line, { immediate: true, step: 18 });
      moves.querySelectorAll('.dmove').forEach(b => { b.disabled = b.dataset.m === 'qi' && !d.qi[0]; b.classList.remove('picked'); });
      moves.classList.add('on');
      moves.onclick = async e => {
        const b = e.target.closest('.dmove'); if (!b || b.disabled || !moves.classList.contains('on')) return;
        moves.classList.remove('on'); b.classList.add('picked');
        const res = Core.duelRound(S, d, b.dataset.m);
        await playClash(res, d);
        if (d.over) {
          el.classList.add('over', d.over === 'win' ? 'won' : 'lost');
          $('#duel-stamp-t').textContent = d.over === 'win' ? '胜' : '负';
          await sleep(500); $('#duel-stamp').classList.add('on');
          await sleep(900);
          const nx = $('#duel-next'); nx.hidden = false; nx.classList.remove('bleed-in'); void nx.offsetWidth; nx.classList.add('bleed-in');
          nx.querySelector('.bb-text').textContent = o.last ? (d.over === 'win' ? '收剑' : '退走') : d.over === 'win' && r < 2 ? '再战' : '下台';
          nx.onclick = () => { nx.onclick = null; resolve(d.over === 'win'); };
        } else { await sleep(500); roundLoop(); }
      };
    };
    roundLoop();
  });
}
const SLASH_SEED = { gong: 3, shou: 11, shu: 17, qi: 29 };
async function playClash(res, d) {
  const el = $('#duel'), svg = $('#duel-slash'), sp = $('#duel-splash');
  $('#dc-o').textContent = DM[res.o].ch; $('#dc-m').textContent = DM[res.m].ch;
  el.classList.remove('clash-on', 'strike', 'hit-me', 'hit-o', 'big'); void el.offsetWidth;
  el.classList.add('clash-on');
  await sleep(FX.reduced() ? 60 : 520);
  // 笔锋：胜者一笔斩向败者
  const toO = res.dmg[0] > 0, toM = res.dmg[1] > 0, stall = !toO && !toM;
  const mk = (seed, flip, color, delay) => {
    const p = Ink.brushPath(420, 34, seed);
    return `<g transform="translate(195 130) rotate(${flip ? 152 : -28}) translate(-210 -17)"><path class="sl" d="${p}" fill="${color}" style="animation-delay:${delay}s"/></g>`;
  };
  svg.innerHTML = stall ? mk(SLASH_SEED[res.m], false, 'rgba(239,230,211,.55)', 0) + mk(SLASH_SEED[res.o] + 5, true, 'rgba(239,230,211,.4)', .08)
    : toO ? mk(SLASH_SEED[res.m], false, '#efe6d3', 0) : mk(SLASH_SEED[res.o] + 5, true, '#b3302a', 0);
  el.classList.add('strike'); if (Math.max(...res.dmg) >= 2) el.classList.add('big');
  if (!stall) {
    sp.className = 'duel-splash ' + (toO ? 'to-o' : 'to-m'); void sp.offsetWidth; sp.classList.add('on');
    if (typeof InkGL !== 'undefined' && InkGL.spreadOk && !FX.reduced() && Math.max(...res.dmg) >= 2) {}
  }
  await sleep(FX.reduced() ? 60 : 380);
  if (toO) { $('#duel-ohp').innerHTML = hpPips(d.hp[1], true); el.classList.add('hit-o'); }
  if (toM) { $('#duel-mhp').innerHTML = hpPips(d.hp[0], true); el.classList.add('hit-me'); if (navigator.vibrate) try { navigator.vibrate(12); } catch (e) {} }
  const t = inkWrite($('#duel-text'), res.text, { immediate: true, step: 18 });
  await sleep(Math.min(t, 1500) + 650);
}

/* ================= 行囊 / 卷首菜单 ================= */
const sheet = $('#sheet');
async function openSheet(title, body) {
  $('#sheet-title').textContent = title; const sb = $('#sheet-body'); sb.innerHTML = ''; sb.appendChild(body);
  sheet.hidden = false; await sleep(20); sheet.classList.add('open');
}
async function closeSheet() { sheet.classList.remove('open'); await sleep(500); sheet.hidden = true; }
$('.sheet-shade').onclick = closeSheet;
function openBag(tab = 'bag') {
  const wrap = document.createElement('div'); wrap.className = 'bag-wrap';
  const hasDan = typeof JHUI !== 'undefined' && S.dan;
  wrap.innerHTML = '<div class="sheet-tabs"><button class="stab" data-t="bag">行囊</button><i class="stab-dot"></i><button class="stab" data-t="gf">功法</button>' + (hasDan ? '<i class="stab-dot"></i><button class="stab" data-t="dan">丹炉</button>' : '') + '</div><div class="tab-body"></div>';
  const body = wrap.querySelector('.tab-body');
  const TT = { gf: '功法', bag: '行囊', dan: '丹炉' };
  const show = t => {
    wrap.querySelectorAll('.stab').forEach(b => b.classList.toggle('on', b.dataset.t === t));
    $('#sheet-title').textContent = TT[t];
    body.innerHTML = ''; body.appendChild(t === 'gf' ? gfPage() : t === 'dan' ? JHUI.danPage() : bagPage());
    body.classList.remove('tab-in'); void body.offsetWidth; body.classList.add('tab-in');
  };
  wrap.querySelector('.sheet-tabs').onclick = e => { const t = e.target.closest('.stab'); if (t) show(t.dataset.t); };
  openSheet(TT[tab] || '行囊', wrap);
  show(tab);
}
function bagPage() {
  const wrap = document.createElement('div');
  const keys = Object.keys(S.items).filter(k => S.items[k] > 0);
  if (!keys.length) wrap.innerHTML = '<div class="empty">行囊空空，唯有清风两袖</div>';
  keys.forEach(k => {
    const it = document.createElement('div'); it.className = 'item';
    it.innerHTML = `<div class="item-info"><div class="item-name"></div><div class="item-desc"></div></div>`;
    it.querySelector('.item-name').innerHTML = `${k}<em>×${S.items[k]}</em>`;
    it.querySelector('.item-desc').textContent = PILLS[k] ? PILLS[k].desc : '';
    if (PILLS[k] && PILLS[k].use) {
      const b = document.createElement('button'); b.className = 'item-use'; b.textContent = '服用';
      b.onclick = () => { if (useItem(k)) closeSheet(); };
      it.appendChild(b);
    }
    wrap.appendChild(it);
  });
  return wrap;
}
const layerDots = lv => Array.from({ length: GF_LAYERS }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('');
const gfElWord = (id) => { const g = GONGFA[id]; return (g.el ? (g.el === '五行' ? '五行' : g.el + '行') : '无属') + ' · ' + Core.gfMatchWord(S, id); };
function gfPage() {
  const wrap = document.createElement('div'); wrap.className = 'gf-page';
  if (!S.gf) {
    wrap.innerHTML = `<div class="gf-scroll gf-none"><div class="gf-vname">${[...'无法可依'].map(c => `<i>${c}</i>`).join('')}</div>
      <div class="gf-info"><p class="gf-desc">胸中尚无一部功法。你只凭本能吐纳，像在夜里摸索山路——走得动，却走不快。</p>
      <div class="gf-speed">行功之速 <b>×${K.noGf.toFixed(2)}</b></div><div class="gf-src">游历、宗门、坊市，皆可遇得功法。</div></div></div>`;
  } else {
    const g = GONGFA[S.gf], e = S.gfs[S.gf];
    const card = document.createElement('div'); card.className = 'gf-scroll g' + g.grade + (g.mo ? ' mo' : '');
    card.innerHTML = `<div class="gf-vname">${[...g.name].map(c => `<i>${c}</i>`).join('')}</div>
      <div class="gf-info">
        <div class="gf-meta"><span class="gf-seal">${GF_GRADE[g.grade]}</span><span class="gf-el">${gfElWord(S.gf)}</span></div>
        <div class="gf-layers">${layerDots(e.lv)}<em>${e.lv >= GF_LAYERS ? '大成' : '第' + cn(e.lv) + '层'}</em></div>
        <div class="gf-speed">行功之速 <b>×${Core.gfSpeed(S).toFixed(2)}</b></div>
        <div class="gf-trait">${g.trait}</div>
        <p class="gf-desc"></p>
        <div class="gf-src">得自 · ${g.src}</div>
      </div>`;
    card.querySelector('.gf-desc').textContent = g.desc;
    wrap.appendChild(card);
  }
  const others = Object.keys(S.gfs).filter(id => id !== S.gf);
  const h = document.createElement('div'); h.className = 'gf-list-h'; h.innerHTML = `<span>胸中所藏</span><em>${cn(Object.keys(S.gfs).length)}部</em>`;
  wrap.appendChild(h);
  if (!others.length) { const em = document.createElement('div'); em.className = 'empty small'; em.textContent = '别无他法 · 机缘未至'; wrap.appendChild(em); }
  others.sort((a, b) => GONGFA[b].grade - GONGFA[a].grade).forEach(id => {
    const g = GONGFA[id], e = S.gfs[id];
    const row = document.createElement('div'); row.className = 'gf-row g' + g.grade + (g.mo ? ' mo' : '');
    row.innerHTML = `<span class="gf-seal">${GF_GRADE[g.grade]}</span>
      <div class="gf-row-info"><div class="gf-row-name">${g.name}<em>${e.lv >= GF_LAYERS ? '大成' : cn(e.lv) + '层'}</em></div>
      <div class="gf-row-sub">${gfElWord(id)} · ×${Core.gfSpeed(S, id).toFixed(2)}</div><div class="gf-row-trait">${g.trait}</div>
      <div class="gf-cost">${(c => `散功转修：${c.lose ? `修为 −${fmtNum(c.lose)} · ` : ''}心境 −${c.xj} · 耗时${cnDur(c.months + c.extra)}${c.extra ? `（修为不足，以${cnDur(c.extra)}苦功补足）` : ''}${c.layer ? ` · 《${GONGFA[S.gf].name}》跌一层` : ''}`)(Core.switchCost(S, id))}</div></div>
      <button class="item-use">转修</button>`;
    const btn = row.querySelector('button');
    btn.onclick = async () => {
      if (!row.classList.contains('confirm')) { wrap.querySelectorAll('.gf-row.confirm').forEach(r => { r.classList.remove('confirm'); r.querySelector('button').textContent = '转修'; }); row.classList.add('confirm'); btn.textContent = '确定'; return; }
      await closeSheet();
      Core.switchGf(S, id, pushLog); render(); save(); checkEnd();
    };
    wrap.appendChild(row);
  });
  return wrap;
}
function useItem(k) {
  const o = Core.useItem(S, k);
  if (o.err) { toast(o.err); return false; }
  pushLog({ text: o.text, tags: o.tags, cls: 'sys' }); Core.afterGain(S, o.ups, pushLog); render(); save(); checkEnd();
  return true;
}
function openMenu() {
  const w = document.createElement('div'); w.className = 'menu-list';
  w.innerHTML = `<div class="menu-note">${S.name} · ${realmStr()} · ${cn(S.age)}岁<br>此卷随笔随存，合上亦不失。</div>
    <button class="menu-item" data-m="resume">继续修行</button>
    <button class="menu-item" data-m="title">回到卷首</button>
    ${Core.canRetire(S) ? '<button class="menu-item" data-m="retire">归隐山林<small>放下长生，此卷即终</small></button>' : ''}
    <button class="menu-item danger" data-m="reset">焚卷重来</button>`;
  w.onclick = async e => {
    const m = e.target.dataset.m; if (!m) return;
    await closeSheet();
    if (m === 'title') { save(); initTitle(); unrollTo('title'); }
    if (m === 'retire' && await inkConfirm('此去不问长生。归隐之后，此卷即终。', '归隐')) {
      Core.retire(S); pushLog({ title: '归隐', text: '你解下腰牌，放在洞府石案上，转身下山。山道上的石阶，你走了许多年，今日才觉出它这样长。', cls: 'event', div: true });
      render(); save(); setTimeout(() => showEnd('guiyin'), 900);
    }
    if (m === 'reset' && await inkConfirm('焚去此卷，前尘尽忘。', '焚卷', true)) { localStorage.removeItem(SAVE_KEY); S = null; resetCreate(); unrollTo('create'); }
  };
  openSheet('卷首', w);
}

/* ================= 终卷 ================= */
const END_ART = {
  ascend: `<svg viewBox="0 0 320 120"><g class="ea-rays">${Array.from({ length: 13 }, (_, i) => { const a = (-90 + (i - 6) * 13) * Math.PI / 180; return `<path d="M160 118 L${(160 + Math.cos(a) * 190).toFixed(1)} ${(118 + Math.sin(a) * 190).toFixed(1)}" />`; }).join('')}</g><circle class="ea-sun" cx="160" cy="118" r="34"/></svg>`,
  zuohua: `<svg viewBox="0 0 320 120"><path class="ea-smoke" d="M160 104 C150 86 172 74 160 58 C148 42 170 32 162 14"/><path class="ea-smoke s2" d="M160 104 C168 90 150 80 158 66 C166 52 150 44 156 28"/><rect class="ea-stick" x="158.6" y="100" width="2.8" height="20" rx="1"/><circle class="ea-ember" cx="160" cy="100" r="2.2"/></svg>`,
  rumo: `<svg viewBox="0 0 320 120"><g class="ea-drips">${[[92, 26, 2.2, 6], [121, 64, 4.5, 2], [150, 18, 1.6, 10], [174, 48, 3.2, 0], [207, 82, 5.5, 4], [236, 34, 2.6, 12]].map(([x, h, w, y0], i) => `<path d="M${x - w} ${y0} C${x - w * .6} ${y0 + h * .55} ${x - w * .9} ${y0 + h} ${x} ${y0 + h + w * 1.6} C${x + w * .9} ${y0 + h} ${x + w * .6} ${y0 + h * .55} ${x + w} ${y0}Z" style="animation-delay:${(.4 + i * .19).toFixed(2)}s"/>`).join('')}</g></svg>`,
  guiyin: `<svg viewBox="0 0 320 120"><circle class="ea-moon" cx="244" cy="30" r="16"/><g class="ea-boat"><path d="M96 80 Q160 98 226 77 L214 88 Q160 104 108 90Z"/><path class="ea-pole" d="M146 84 L198 26"/></g><g class="ea-boat ea-refl"><path d="M96 98 Q160 84 226 100 L214 93 Q160 80 108 92Z"/></g><g class="ea-waves"><path d="M30 96 Q60 92 90 96 T150 96 T210 96 T290 96"/><path d="M70 108 Q100 104 130 108 T190 108 T250 108"/></g></svg>`,
  bingjie: `<svg viewBox="0 0 320 120"><g class="ea-sword"><path class="ea-blade1" d="M104 92 L168 52 Q172 51 173 55 L110 97Z"/><path class="ea-blade2" d="M180 46 L236 12 Q240 12 239 16 L186 52Z"/><path class="ea-guard" d="M92 82 Q98 80 116 104 Q112 108 108 104 Q100 92 90 86Z"/><path class="ea-hilt" d="M100 100 L80 116"/></g><g class="ea-motes">${Array.from({ length: 16 }, (_, i) => `<circle cx="${176 + (i * 37) % 64 - 20}" cy="${50 - (i * 23) % 42}" r="${1 + (i % 3) * .8}" style="animation-delay:${(i * .19).toFixed(2)}s"/>`).join('')}</g></svg>`,
  yunluo: `<svg viewBox="0 0 320 120"><path class="ea-bolt" d="M184 -4 L156 42 L172 44 L142 92 L160 94 L132 124 L166 88 L150 86 L182 38 L166 36 L192 -4Z"/><path class="ea-bolt thin" d="M156 42 L134 58 L140 64 L116 86 L146 60 L140 56 L162 44Z"/></svg>`,
};
function showEnd(kind) {
  if (!S) return;
  kind = kind || S.ending || 'zuohua';
  const e = $('#end'); e.hidden = false;
  e.className = 'end end-' + kind;
  let art = e.querySelector('.end-art');
  if (!art) { art = document.createElement('div'); art.className = 'end-art'; e.querySelector('.end-paper').prepend(art); }
  art.innerHTML = END_ART[kind] || '';
  const age = cn(S.age), rs = realmStr(), evs = S.events ? '历奇遇' + cn(S.events) + '桩' : '一生未逢奇遇';
  const T = {
    ascend: ['飞升', `${S.name}，以${S.lg.name}之资，历${age}载春秋，终渡九重天劫，白日飞升。青冥山下的樵夫说，那一日，满山松涛都静了一瞬。`],
    zuohua: ['坐化', `${age}岁那年冬天，你在洞府中静静合上了眼。生前修至${rs}，${evs}。山风穿过石门，吹散了案上未写完的手札。` + pick(['青山不语，白云自去。', '一生求长生，长生终未得。', '此身原是客，何处不归途。'])],
    rumo: ['入魔', `${age}岁那年，${S.gf && GONGFA[S.gf].mo ? '《' + GONGFA[S.gf].name + '》在你体内' : '心魔在你识海中'}日夜低语，终于有一夜，你再也分不清哪一个声音是自己。后来有人在血雾谷见过一个赤瞳之人，修为通天，却认不得任何一位故人。` + pick(['一念成魔，万劫难复。', '墨落成血，再难洗白。'])],
    guiyin: ['归隐', `${S.name}修至${rs}，于${age}岁那年放下了长生。此后青冥山中少了一位修士，桃花溪上多了一叶扁舟。有渔人说，常见一个老者在江心垂钓，钓线上从不挂饵；后来，连那舟也不见了，只剩空船自横。`],
    bingjie: ['兵解', `${rs}破关之际，天威如山，肉身寸寸崩解。袖中兵解玉符应声而碎，一缕真灵遁出，没入茫茫轮回。此生修为尽散，道心未绝——来世入道之时，或可忆起今日。`],
    yunluo: ['身殒', `${rs}破关失利，经脉寸断，${age}载苦修化作山间一缕青烟。同门在你的洞府前立了一块无字碑，碑前的野草，年年都长得很高。` + pick(['大道无情，从不等人。', '天道之下，众生皆刍狗。'])],
  }[kind] || ['坐化', ''];
  $('#end-title').textContent = T[0];
  $('#end-epitaph').textContent = T[1];
  const lab = { ascend: '境界 <b>飞升</b>', guiyin: `境界 <b>${rs}</b>　归隐 <b>${age}岁</b>` }[kind] || `境界 <b>${rs}</b>　享年 <b>${age}</b>`;
  const gfl = S.gf ? `<br>主修 <b>《${GONGFA[S.gf].name}》</b>` : '';
  const leg = kind === 'bingjie' ? '<br><span class="end-legacy">前世残念 · 来世悟性 +1</span>' : '';
  $('#end-stats').innerHTML = `${S.name} · ${S.lg.id === 'wei' ? '' : S.lgEls.join('')}${S.lg.name}<br>${lab}${gfl}<br>悟性 <b>${cn(S.wx)}</b>　心境 <b>${xinjingWord(S.xj)}</b>${leg}`;
  if (kind === 'bingjie') try { localStorage.setItem(LEGACY_KEY, JSON.stringify({ wx: 1 })); } catch (er) {}
  save();
  $('#btn-reborn').onclick = () => { localStorage.removeItem(SAVE_KEY); e.hidden = true; S = null; resetCreate(); unrollTo('create'); };
}

/* ================= 江湖界面 ================= */
const JHUI = typeof makeJHUI === 'function' ? makeJHUI({ get S() { return S; }, get busy() { return busy; }, set busy(v) { busy = v; },
  $, sleep, pick, render, save, pushLog, openEvent, openSheet, closeSheet, toast, inkWrite, buffer, checkEnd, runDuel, realmStr, fmtNum, K, chanceWord }) : undefined;

/* ================= 启动 ================= */
$$('.act').forEach(b => b.addEventListener('click', () => {
  b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse'); setTimeout(() => b.classList.remove('pulse'), 500);
  act(b.dataset.act);
}));
$('#btn-break').onclick = openBreak;
$('#btn-menu').onclick = openMenu;
$('#btn-sect').onclick = () => { if (!busy && S && !S.dead && !S.ascended) openSect(); };
FX.initPress(); FX.initParallax();
$('#side').onclick = e => {
  const c = e.target.closest('.side-card'); if (!c || busy || !S || S.dead || S.ascended) return;
  const k = c.dataset.open; if (k === 'gf') openBag('gf'); else if (k === 'bag') openBag(); else if (k === 'sect') openSect(); else act('youli');
};
addEventListener('resize', () => { if (document.body.dataset.screen === 'main') renderSide(); });

/* ================= 键盘：1-4 行动 · Esc 收起 · Enter 确认 · 方向键（地图/斗法） ================= */
const vis = el => !!el && !el.hidden && el.offsetParent !== null && !el.disabled;
const firstVis = (root, sel) => [...root.querySelectorAll(sel)].find(vis);
function topLayer() {
  const ask = document.querySelector('.ask'); if (ask) return ask;
  for (const id of ['end', 'rite', 'dan', 'auc', 'duel', 'bt', 'modal', 'sheet', 'mj', 'map']) { const el = $('#' + id); if (el && !el.hidden) return el; }
  return null;
}
addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
  const tgt = e.target; if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA')) { if (e.key === 'Enter' && tgt.id === 'inp-name') tgt.blur(); return; }
  const L = topLayer(), k = e.key;
  const click = el => { if (vis(el)) { e.preventDefault(); el.click(); return true; } return false; };
  if (k === 'Escape') {
    if (!L) return;
    if (L.classList.contains('ask')) return click(L.querySelector('.ask-no'));
    if (L.id === 'sheet') { e.preventDefault(); return closeSheet(); }
    if (L.id === 'map') return click($('#map-close'));
    if (L.id === 'dan') return click($('#dan-close'));
    return;
  }
  const digit = /^[1-9]$/.test(k) ? +k : 0;
  if (!L) {
    if (document.body.dataset.screen !== 'main') { if (k === 'Enter' && !(tgt && tgt.tagName === 'BUTTON')) click(firstVis(document.querySelector('.screen:not([hidden])') || document.body, '.brush-btn')); return; }
    if (digit >= 1 && digit <= 4) return click($$('.act')[digit - 1]);
    if (k === 'Enter' && !(tgt && tgt.tagName === 'BUTTON')) return click($('#btn-break'));
    return;
  }
  // 斗法：方向键在招式间移动，数字直接出招
  if (L.id === 'duel') {
    const ms = [...L.querySelectorAll('.dmove')].filter(b => !b.disabled);
    if (digit && ms[digit - 1]) return click(ms[digit - 1]);
    if (k === 'ArrowLeft' || k === 'ArrowRight') { e.preventDefault(); const i = ms.indexOf(document.activeElement); const n = ms[(i < 0 ? 0 : i + (k === 'ArrowRight' ? 1 : -1) + ms.length) % ms.length]; n && n.focus(); return; }
  }
  // 地图：方向键换地点，Enter 行动
  if (L.id === 'map' && typeof JHUI !== 'undefined') {
    if (k === 'ArrowLeft' || k === 'ArrowRight') { e.preventDefault(); return JHUI.mapKey(k === 'ArrowRight' ? 1 : -1); }
    if (k === 'Enter' && !(tgt && tgt.tagName === 'BUTTON' && L.contains(tgt))) return click(firstVis(L, '.mc-btn.on') || firstVis(L, '.mc-btn'));
  }
  // 奇遇：数字选择
  if (L.id === 'modal' && digit) { const cs = [...L.querySelectorAll('.choice')].filter(vis); if (cs[digit - 1]) return click(cs[digit - 1]); }
  if (k === 'Enter') {
    if (tgt && tgt.tagName === 'BUTTON' && L.contains(tgt) && vis(tgt)) return;   // 焦点在按钮上，交给浏览器
    if (L.classList.contains('ask')) return click(L.querySelector('.ask-ok'));
    if (L.id === 'sheet') return;
    return click(firstVis(L, '.brush-btn:not(.ask-no)'));
  }
});
setScreen('title');
initTitle(); initCreate();
// 视觉素材与字体都就绪后再开卷，避免字体替换造成的半截状态
Promise.all([
  initVisuals(),
  Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), sleep(2500)]),
]).catch(() => {}).then(() => {
  requestAnimationFrame(() => document.body.classList.add('go'));
  setTimeout(() => document.body.classList.add('intro-done'), 4200);
});
window.__moxian = { get S() { return S; }, set S(v) { S = v; }, get busy() { return busy; }, set busy(v) { busy = v; }, save, render, act, openBreak, openBag, showEnd, openEvent: id => openEvent(EVENTS.find(e => e.id === id)), Core, openSect, runRite, startDabi, dabiInvite, openMission: uid => openEvent(Core.missionEvent(S, uid)), JHUI };
})();
