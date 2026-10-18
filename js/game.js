/* 墨仙录 · 主逻辑 */
'use strict';
(() => {
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const SAVE_KEY = 'moxian.v1';
const LIFE_SCALE = [1, 1.5, 2.5, 4, 6];
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
function sync(s = S) {
  s.age = Math.floor(s.months / 12);
  s.lifespan = Math.round(REALMS[s.realm].life + s.lifeBonus);
}
const R = () => REALMS[S.realm];
const req = (s = S) => Math.round(REALMS[s.realm].scale * REALMS[s.realm].reqBase * (1 + REALMS[s.realm].reqGrow * s.stage));
const unit = (s = S) => 100 * REALMS[s.realm].scale * s.lg.mult * (1 + (s.wx - 5) * 0.06);
const isLast = (s = S) => s.stage === REALMS[s.realm].stages.length - 1;
const bottleneck = (s = S) => isLast(s) && s.xw >= req(s);
const realmStr = (s = S) => REALMS[s.realm].name + REALMS[s.realm].stages[s.stage];
const timeLabel = (s = S) => `${cn(s.age)}岁 · ${['春', '夏', '秋', '冬'][Math.floor((s.months % 12) / 3)]}`;
const fmtNum = n => n >= 100000 ? (n / 10000).toFixed(1) + '万' : String(Math.floor(n));

function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
function load() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.v === 1) { sync(s); return s; } } catch (e) {} return null; }

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
  $('#btn-new').onclick = () => {
    FX.requestTilt();
    if (s && !s.dead && !s.ascended && !confirm('另开新卷，旧卷将被覆盖。确定么？')) return;
    resetCreate(); unrollTo('create');
  };
  $('#btn-continue').onclick = () => { FX.requestTilt(); S = load(); if (!S) return; enterMain(true); };
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
  S = { v: 1, name, lg: { id: r.lg.id, name: r.lg.name, mult: r.lg.mult, bt: r.lg.bt, sect: r.lg.sect }, lgEls: r.els,
    wx: r.wx, xj: 50, luck: r.luck, ls: 10, realm: 0, stage: 0, xw: 0, months: 16 * 12, lifeBonus: 0,
    inj: 0, buff: null, items: {}, flags: {}, fails: 0, events: 0, log: [], warned: {}, dead: false, ascended: false, bnLogged: false };
  sync();
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
  setText('#h-name', S.name); setText('#h-sub', `${S.lg.sect} · ${S.lg.id === 'wei' ? '' : S.lgEls.join('')}${S.lg.name}`); fitLine($('#h-sub'), 11.5, 9);
  const rq = req(); if (S.xw > rq && isLast()) S.xw = rq; const p = clamp(S.xw / rq, 0, 1);
  const fill = $('#xw-fill'); fill.parentElement.style.setProperty('--p', (p * 100).toFixed(1) + '%');
  fill.classList.toggle('full', bottleneck());
  setText('#xw-num', `${fmtNum(S.xw)} / ${fmtNum(rq)}`);
  const lifeLeft = clamp((S.lifespan - S.age) / (S.lifespan - 16 || 1), 0, 1);
  const inc = $('.incense'); inc.style.setProperty('--life', (Math.max(0.02, lifeLeft) * 100).toFixed(1) + '%');
  setText('#life-num', `${S.age} / ${S.lifespan}`);
  $('.bar-life').classList.toggle('low', S.lifespan - S.age <= Math.max(6, r.life * 0.12));
  const season = Math.floor((S.months % 12) / 3);
  setText('#c-age', cn(S.age)); setText('#c-season', ['春', '夏', '秋', '冬'][season]);
  FX.setSeason(season); FX.setGold(S.realm || 0);
  document.body.dataset.realm = S.ascended ? 5 : S.realm;
  setText('#c-wx', cn(S.wx)); setText('#c-xj', xinjingWord(S.xj)); setText('#c-ls', S.ls > 9999 ? fmtNum(S.ls) : cn(S.ls));
  setText('#dur-tuna', cnDur(r.T * 3)); setText('#dur-biguan', cnDur(r.T * 12));
  const cnt = Object.values(S.items).reduce((a, b) => a + b, 0);
  setText('#bag-count', cnt ? `${cn(cnt)}物` : '空');
  $('#btn-break').hidden = !bottleneck() || S.dead || S.ascended;
  const st = $('#status-line'); st.classList.remove('zhu');
  let msg = '';
  if (bottleneck()) { msg = '瓶颈已至 · 可破境'; st.classList.add('zhu'); }
  else if (S.inj > 0) { msg = `伤势未愈 · 修炼减半`; st.classList.add('zhu'); }
  else if (S.buff) msg = `灵脉加持 · 余${cn(S.buff.n)}次`;
  else if (S.lifespan - S.age <= Math.max(6, r.life * 0.12)) { msg = '寿元无多'; st.classList.add('zhu'); }
  st.textContent = msg;
}

/* ================= 数值变化 ================= */
function addXw(amount, tags) {
  if (amount < 0) { S.xw = Math.max(0, S.xw + amount); tags && tags.push({ t: `修为 −${fmtNum(-amount)}`, c: 'down' }); return; }
  if (bottleneck()) { tags && tags.push({ t: '修为已满', c: '' }); return; }
  tags && tags.push({ t: `修为 +${fmtNum(amount)}`, c: 'up' });
  S.xw += amount;
  const ups = [];
  while (S.xw >= req() && !isLast()) { S.xw -= req(); S.stage++; ups.push(realmStr()); }
  if (isLast() && S.xw >= req()) S.xw = req();
  return ups;
}
function afterGain(ups) {
  (ups || []).forEach(r => pushLog({ text: pick(TEXT.stageUp).replace('{r}', r), cls: 'gold' }));
  if (bottleneck() && !S.bnLogged) { S.bnLogged = true; pushLog({ text: TEXT.bottleneck.replace('{r}', R().name + '圆满'.replace('圆满', S.realm === 0 ? '九层' : '圆满')), cls: 'warn' }); }
}
function applyFx(fx) {
  const tags = []; let ups = [];
  if (fx.xw) ups = addXw(Math.round(fx.xw * req()), tags) || [];
  if (fx.ls) { const v = fx.lsRaw ? fx.ls : Math.round(fx.ls * R().lsScale); const before = S.ls; S.ls = Math.max(0, S.ls + v); const d = S.ls - before; if (d) tags.push({ t: `灵石 ${d > 0 ? '+' : '−'}${Math.abs(d)}`, c: d > 0 ? 'up' : 'down' }); }
  if (fx.life) { const v = Math.round(fx.life * LIFE_SCALE[S.realm]); S.lifeBonus += v; tags.push({ t: `寿元 ${v > 0 ? '+' : '−'}${Math.abs(v)}年`, c: v > 0 ? 'up' : 'down' }); }
  if (fx.xj) { const b = S.xj; S.xj = clamp(S.xj + fx.xj, 0, 100); const d = S.xj - b; if (d) tags.push({ t: `心境 ${d > 0 ? '+' : '−'}${Math.abs(d)}`, c: d > 0 ? 'up' : 'down' }); }
  if (fx.wx) { const b = S.wx; S.wx = clamp(S.wx + fx.wx, 1, 10); if (S.wx !== b) tags.push({ t: `悟性 ${fx.wx > 0 ? '+' : '−'}${Math.abs(S.wx - b)}`, c: fx.wx > 0 ? 'up' : 'down' }); }
  if (fx.luck) S.luck = clamp(S.luck + fx.luck, -5, 10);
  if (fx.inj) { S.inj += fx.inj; tags.push({ t: '负伤', c: 'down' }); }
  if (fx.item) for (const [k, n] of Object.entries(fx.item)) { S.items[k] = (S.items[k] || 0) + n; tags.push({ t: `得${k}${n > 1 ? '×' + n : ''}`, c: 'up' }); }
  if (fx.buff) { S.buff = { ...fx.buff }; tags.push({ t: '灵脉加持', c: 'up' }); }
  if (fx.flag) S.flags[fx.flag] = 1;
  if (fx.time) passTime(fx.time);
  return { tags, ups };
}
function passTime(m) {
  S.months += m; sync();
  const left = S.lifespan - S.age, span = S.lifespan - 16;
  const k = S.realm + ':' + S.lifeBonus;
  if (left <= span * 0.05 && !S.warned['95' + k] && left > 0) { S.warned['95' + k] = 1; pushLog({ text: TEXT.old95, cls: 'warn' }); }
  else if (left <= span * 0.2 && !S.warned['80' + k] && left > 0) { S.warned['80' + k] = 1; pushLog({ text: TEXT.old80, cls: 'warn' }); }
  if (S.age >= S.lifespan) S.dead = true;
}
function gainMul() {
  let m = 1;
  if (S.inj > 0) { m *= 0.5; S.inj--; }
  if (S.buff) { m *= S.buff.mul; if (--S.buff.n <= 0) S.buff = null; }
  return m;
}

/* ================= 行动 ================= */
let busy = false;
function lock(ms) { busy = true; $$('.act').forEach(b => b.classList.add('busy')); setTimeout(() => { busy = false; $$('.act').forEach(b => b.classList.remove('busy')); }, ms); }
function act(kind) {
  if (busy || !S || S.dead || S.ascended) return;
  if (kind === 'bag') return openBag();
  const r = R();
  if (kind === 'tuna') {
    lock(900);
    const mul = gainMul();
    const g = Math.round(unit() * 0.22 * (0.9 + Math.random() * 0.2) * mul);
    const tags = []; const ups = bottleneck() ? (tags.push({ t: '瓶颈难破，修为难进' }), []) : addXw(g, tags);
    passTime(r.T * 3);
    const text = pick(TEXT.tuna).replace('{d}', cnDur(r.T * 3));
    save();
    // 灵气旋入丹田之后，才落笔记下这一季
    const sp = $('.scroll-paper').getBoundingClientRect();
    FX.qiSwirl(sp.left + sp.width / 2, sp.top + sp.height * 0.55, () => {
      const bx = $('.bar-xw'); bx.classList.remove('gain'); void bx.offsetWidth; bx.classList.add('gain');
      if (!S) return;
      pushLog({ text, tags }); afterGain(ups); render(); save(); checkEnd();
    });
    return;
  } else if (kind === 'biguan') {
    lock(1100);
    FX.cave();
    const mul = gainMul();
    const pXm = clamp(0.06 + (50 - S.xj) / 400, 0.02, 0.22), pDw = clamp(0.08 + S.luck * 0.006 + (S.wx - 5) * 0.012, 0.03, 0.25);
    const roll = Math.random(); const tags = []; let text = pick(TEXT.biguan).replace(/\{d\}/g, cnDur(r.T * 12)); let cls = '', ups = [];
    passTime(r.T * 12);
    if (roll < pXm) {
      text += pick(TEXT.xinmo); cls = 'warn';
      addXw(-Math.round(req() * 0.12), tags); S.inj += 2; tags.push({ t: '负伤', c: 'down' });
      S.xj = clamp(S.xj - 6, 0, 100); tags.push({ t: '心境 −6', c: 'down' });
    } else {
      let g = unit() * (0.88 + Math.random() * 0.24) * mul;
      if (roll > 1 - pDw) { g *= 1.6; text += pick(TEXT.dunwu); cls = 'gold'; if (Math.random() < 0.25 && S.wx < 10) { S.wx++; tags.push({ t: '悟性 +1', c: 'up' }); } }
      if (bottleneck()) tags.push({ t: '瓶颈难破，修为难进' }); else ups = addXw(Math.round(g), tags);
      S.xj = clamp(S.xj + 1, 0, 100);
    }
    pushLog({ text, tags, cls });
    afterGain(ups);
  } else if (kind === 'youli') {
    passTime(r.T * 3);
    if (S.dead) { render(); save(); return checkEnd(); }
    const pool = EVENTS.filter(e => !e.cond || e.cond(S));
    const recent = S.recent || []; const pool2 = pool.filter(e => !recent.includes(e.id));
    const use = pool2.length ? pool2 : pool;
    let tot = use.reduce((a, e) => a + e.w, 0), x = Math.random() * tot, ev = use[0];
    for (const e of use) { if ((x -= e.w) < 0) { ev = e; break; } }
    S.recent = [...recent, ev.id].slice(-5);
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
function checkEnd() {
  if (S.dead) setTimeout(() => showEnd('death'), 1800);
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
  S.events++;
  FX.vtext($('#ev-title'), ev.title);
  $('#ev-seal').textContent = pick(['缘', '遇', '奇', '机']);
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
  const res = c.act(S);
  const { tags, ups } = applyFx(res.fx || {});
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
    afterGain(ups);
    render(); save(); checkEnd();
  };
  render(); save();
}

/* ================= 破境 ================= */
function btChance(usePill) {
  return clamp(R().base + S.lg.bt + (S.xj - 50) / 250 + (usePill ? 0.2 : 0) + Math.min(0.12, S.fails * 0.04) - (S.inj > 0 ? 0.15 : 0) + S.luck * 0.005, 0.05, 0.95);
}
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
  const r = R(), from = S.realm, p = btChance(usePill), ok = Math.random() < p;
  if (usePill) S.items[r.pill]--, S.items[r.pill] <= 0 && delete S.items[r.pill];
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
  inkWrite(l2, S.realm === 4 ? '劫云压顶……' : '引天地灵气，冲击瓶颈……', { immediate: true, step: 70 });
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
  // 结算
  let logText;
  if (ok) {
    const sText = TEXT.btSuccess[from];
    if (from === 4) { S.ascended = true; }
    else { S.realm++; S.stage = 0; S.xw = 0; S.fails = 0; S.inj = 0; S.bnLogged = false; S.xj = clamp(S.xj + 5, 0, 100); }
    sync();
    logText = sText + (from < 4 ? `寿元增至${cn(S.lifespan)}载。` : '');
    inkWrite(txt, logText, { immediate: true, step: 26 });
  } else {
    const fText = pick(TEXT.btFail);
    S.xw = Math.round(req() * (0.6 + Math.random() * 0.15)); S.inj += 3; S.xj = clamp(S.xj - 4, 0, 100); S.fails++; S.bnLogged = false;
    passTime(r.T * 6);
    logText = fText + `休养${cnDur(r.T * 6)}，方能再试。`;
    inkWrite(txt, logText, { immediate: true, step: 26 });
  }
  save();
  await sleep(1600);
  close.hidden = false; close.classList.add('bleed-in');
  close.onclick = async () => {
    bt.classList.add('leave'); await sleep(900); bt.hidden = true; bt.className = 'bt';
    const cv = $('#inkfx'); if (cv.parentNode === bt) { InkGL.hide(); document.body.insertBefore(cv, $('#grain')); }
    busy = false;
    pushLog({ title: ok ? (from === 4 ? '飞升' : `破境 · ${NEXT_REALM_NAME[from]}`) : '破境未果', text: logText, cls: ok ? 'gold' : 'warn', div: true });
    render(); save();
    if (S.ascended) setTimeout(() => showEnd('ascend'), 1600); else checkEnd();
  };
}

/* ================= 行囊 / 卷首菜单 ================= */
const sheet = $('#sheet');
async function openSheet(title, body) {
  $('#sheet-title').textContent = title; const sb = $('#sheet-body'); sb.innerHTML = ''; sb.appendChild(body);
  sheet.hidden = false; await sleep(20); sheet.classList.add('open');
}
async function closeSheet() { sheet.classList.remove('open'); await sleep(500); sheet.hidden = true; }
$('.sheet-shade').onclick = closeSheet;
function openBag() {
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
      b.onclick = () => { useItem(k); closeSheet(); };
      it.appendChild(b);
    }
    wrap.appendChild(it);
  });
  openSheet('行囊', wrap);
}
function useItem(k) {
  if (!(S.items[k] > 0)) return;
  const tags = []; let text = '', ups = [];
  if (k === '聚气丹') {
    if (bottleneck()) { toast('瓶颈当前，丹药无益'); return; }
    ups = addXw(Math.round(unit() * 0.35), tags) || []; text = '丹药入腹，化作一股温润灵流，沿经脉缓缓散开。';
  } else if (k === '回春丹') {
    if (S.inj <= 0) { toast('身无伤患，留待日后'); return; }
    S.inj = 0; S.xj = clamp(S.xj + 2, 0, 100); tags.push({ t: '伤势痊愈', c: 'up' }); text = '回春丹化开，周身暖意融融，旧伤处的隐痛渐渐消散。';
  } else if (k === '延寿果') {
    const v = Math.round(5 * LIFE_SCALE[S.realm] * 2); S.lifeBonus += v; tags.push({ t: `寿元 +${v}年`, c: 'up' }); text = '朱果入口即化，一股勃勃生机自丹田升起，鬓边白发竟转青了几根。';
  }
  S.items[k]--; if (S.items[k] <= 0) delete S.items[k];
  pushLog({ text, tags, cls: 'sys' }); afterGain(ups); render(); save();
}
function openMenu() {
  const w = document.createElement('div'); w.className = 'menu-list';
  w.innerHTML = `<div class="menu-note">${S.name} · ${realmStr()} · ${cn(S.age)}岁<br>此卷随笔随存，合上亦不失。</div>
    <button class="menu-item" data-m="resume">继续修行</button>
    <button class="menu-item" data-m="title">回到卷首</button>
    <button class="menu-item danger" data-m="reset">焚卷重来</button>`;
  w.onclick = async e => {
    const m = e.target.dataset.m; if (!m) return;
    await closeSheet();
    if (m === 'title') { save(); initTitle(); unrollTo('title'); }
    if (m === 'reset' && confirm('焚去此卷，前尘尽忘。确定么？')) { localStorage.removeItem(SAVE_KEY); S = null; resetCreate(); unrollTo('create'); }
  };
  openSheet('卷首', w);
}

/* ================= 终卷 ================= */
function showEnd(kind) {
  const e = $('#end'); e.hidden = false;
  const r = R();
  if (kind === 'ascend') {
    $('#end-title').textContent = '飞升';
    $('#end-epitaph').textContent = `${S.name}，以${S.lg.name}之资，历${cn(S.age)}载春秋，终渡九重天劫，白日飞升。青冥山下的樵夫说，那一日，满山松涛都静了一瞬。`;
  } else {
    $('#end-title').textContent = '坐化';
    $('#end-epitaph').textContent = `${cn(S.age)}岁那年冬天，你在洞府中静静合上了眼。生前修至${realmStr()}，${S.events ? '历奇遇' + cn(S.events) + '桩' : '一生未逢奇遇'}。山风穿过石门，吹散了案上未写完的手札。` + pick(['青山不语，白云自去。', '一生求长生，长生终未得。', '此身原是客，何处不归途。']);
  }
  $('#end-stats').innerHTML = `${S.name} · ${S.lgEls.join('')}${S.lg.name}<br>境界 <b>${kind === 'ascend' ? '飞升' : realmStr()}</b>　享年 <b>${cn(S.age)}</b><br>悟性 <b>${cn(S.wx)}</b>　心境 <b>${xinjingWord(S.xj)}</b>`;
  save();
  $('#btn-reborn').onclick = () => { localStorage.removeItem(SAVE_KEY); e.hidden = true; S = null; resetCreate(); unrollTo('create'); };
}

/* ================= 启动 ================= */
$$('.act').forEach(b => b.addEventListener('click', () => {
  b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse'); setTimeout(() => b.classList.remove('pulse'), 500);
  act(b.dataset.act);
}));
$('#btn-break').onclick = openBreak;
$('#btn-menu').onclick = openMenu;
FX.initPress(); FX.initParallax();
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
window.__moxian = { get S() { return S; }, set S(v) { S = v; }, render, act, openBreak };
})();
