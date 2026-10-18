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
  wrap.innerHTML = '<div class="sheet-tabs"><button class="stab" data-t="bag">行囊</button><i class="stab-dot"></i><button class="stab" data-t="gf">功法</button></div><div class="tab-body"></div>';
  const body = wrap.querySelector('.tab-body');
  const show = t => {
    wrap.querySelectorAll('.stab').forEach(b => b.classList.toggle('on', b.dataset.t === t));
    $('#sheet-title').textContent = t === 'gf' ? '功法' : '行囊';
    body.innerHTML = ''; body.appendChild(t === 'gf' ? gfPage() : bagPage());
    body.classList.remove('tab-in'); void body.offsetWidth; body.classList.add('tab-in');
  };
  wrap.querySelector('.sheet-tabs').onclick = e => { const t = e.target.closest('.stab'); if (t) show(t.dataset.t); };
  openSheet(tab === 'gf' ? '功法' : '行囊', wrap);
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
  const c = Core.switchCost(S);
  others.sort((a, b) => GONGFA[b].grade - GONGFA[a].grade).forEach(id => {
    const g = GONGFA[id], e = S.gfs[id];
    const row = document.createElement('div'); row.className = 'gf-row g' + g.grade + (g.mo ? ' mo' : '');
    row.innerHTML = `<span class="gf-seal">${GF_GRADE[g.grade]}</span>
      <div class="gf-row-info"><div class="gf-row-name">${g.name}<em>${e.lv >= GF_LAYERS ? '大成' : cn(e.lv) + '层'}</em></div>
      <div class="gf-row-sub">${gfElWord(id)} · ×${Core.gfSpeed(S, id).toFixed(2)}</div><div class="gf-row-trait">${g.trait}</div>
      <div class="gf-cost">散功转修：修为 −${fmtNum(c.xw)} · 心境 −${c.xj} · 耗时${cnDur(c.months)}</div></div>
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
    if (m === 'retire' && confirm('此去不问长生。归隐之后，此卷即终。确定么？')) {
      Core.retire(S); pushLog({ title: '归隐', text: '你解下腰牌，放在洞府石案上，转身下山。山道上的石阶，你走了许多年，今日才觉出它这样长。', cls: 'event', div: true });
      render(); save(); setTimeout(() => showEnd('guiyin'), 900);
    }
    if (m === 'reset' && confirm('焚去此卷，前尘尽忘。确定么？')) { localStorage.removeItem(SAVE_KEY); S = null; resetCreate(); unrollTo('create'); }
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
window.__moxian = { get S() { return S; }, set S(v) { S = v; }, render, act, openBreak, openBag, showEnd, openEvent: id => openEvent(EVENTS.find(e => e.id === id)), Core };
})();
