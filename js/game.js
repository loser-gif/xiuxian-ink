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
let lastW = 0, lastRealmDraw = -1;
const REALM_SHIFT = [
  [22, 34, 8],
  [-6, 14, 32],
  [42, 10, -16],
  [4, 8, 28],
  [-8, 4, 36],
  [10, 12, 30],
];
/* 夜墨远山：淡墨绘在透明画布上，避免整层反相把湖面切成一条硬边 */
const MTN_NIGHT = [
  { rgb: [168, 160, 150], alpha: 0.4 },
  { rgb: [198, 188, 174], alpha: 0.54 },
  { rgb: [222, 212, 198], alpha: 0.68 },
  { rgb: [236, 228, 216], alpha: 0.76, bottomFade: true },
];
let mtnGen = 0;
function paintMountain(cv, i, night, title, realm, sh) {
  const base = night ? Object.assign({}, MTN[i], MTN_NIGHT[i]) : MTN[i];
  const rgb = (base.rgb || [40, 40, 40]).map((v, k) => Math.max(0, Math.min(255, v + (sh[k] || 0) * (i < 2 ? 0.65 : 1))));
  let shape = {};
  if (!title && !night && realm === 1 && i === 3) shape = { peaks: 1, amp: base.amp * 1.35, trees: 0, sharp: 2.8 };
  else if (!title && !night && realm === 2 && i === 2) shape = { peaks: 3, amp: base.amp * 1.15, sharp: 3.1 };
  else if (!title && !night && realm === 4 && i <= 1) shape = { peaks: 2, amp: base.amp * 0.55, trees: 0 };
  const bamboo = !title && !night && realm === 0 && i >= 2 ? { trees: (base.trees || 0) + 3, treeSize: 1.15 } : {};
  Ink.mountainLayer(cv, Object.assign({}, base, shape, bamboo, { rgb }));
}
function drawMountains(force, opt) {
  const w = window.innerWidth;
  const screen = document.body.dataset.screen || 'title';
  const title = screen === 'title';
  const realm = +(document.body.dataset.realm || 0);
  const night = document.documentElement.dataset.theme === 'night';
  // 卷首锁在 v35 的峰形：不随境界换色、不加竹。游玩背景仍按境界变。
  const sig = (title ? 1000 : 0) + realm + (night ? 100 : 0);
  if (!force && Math.abs(w - lastW) < 2 && sig === lastRealmDraw) return;
  lastW = w; lastRealmDraw = sig;
  const sh = (night || title) ? [0, 0, 0] : (REALM_SHIFT[realm] || [0, 0, 0]);
  const els = $$('.mtn');
  const finish = () => { if (wallpaperOn && typeof Wallpaper !== 'undefined') Wallpaper.rebuild(); };
  if (opt && opt.yield && els.length) {
    const gen = ++mtnGen;
    const step = i => {
      if (gen !== mtnGen) return;
      if (i >= els.length) { requestAnimationFrame(finish); return; }
      paintMountain(els[i], i, night, title, realm, sh);
      requestAnimationFrame(() => step(i + 1));
    };
    requestAnimationFrame(() => step(0));
    return;
  }
  mtnGen++;
  els.forEach((cv, i) => paintMountain(cv, i, night, title, realm, sh));
  finish();
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
  try { root.style.setProperty('--juan-mask', `url("${juanWashMask()}")`); } catch (e) { console.warn(e); }
  const [paper, mist, b1, b2, b3, b4, stone, big, scene] = await Promise.all([
    Ink.paperTile(512), Ink.mistSprite(),
    Ink.inkBlot(160, 3, { core: 0.32, rough: 0.08, splatter: 6, alpha: 0.95 }),
    Ink.inkBlot(160, 8, { core: 0.31, rough: 0.08, splatter: 5, alpha: 0.95 }),
    Ink.inkBlot(160, 15, { core: 0.33, rough: 0.08, splatter: 7, alpha: 0.95 }),
    Ink.inkBlot(160, 22, { core: 0.3, rough: 0.08, splatter: 4, alpha: 0.95 }),
    Ink.inkBlot(420, 31, { core: 0.3, rough: 0.04, splatter: 14, alpha: 0.92, halo: 0.18 }),
    Ink.inkBlot(1000, 77, { core: 0.3, rough: 0.16, splatter: 150, alpha: 0.94, halo: 0.07, rgb: [18, 14, 12], feibai: true }),
    Ink.scene(800, 220),
  ]);
  root.style.setProperty('--mtn-img', `url(${scene})`);
  root.style.setProperty('--paper-img', `url(${paper})`);
  root.style.setProperty('--mist-img', `url(${mist})`);
  root.style.setProperty('--blot', `url(${b1})`); root.style.setProperty('--blot2', `url(${b2})`);
  root.style.setProperty('--blot3', `url(${b3})`); root.style.setProperty('--blot4', `url(${b4})`);
  root.style.setProperty('--blot-stone', `url(${stone})`); root.style.setProperty('--blot-big', `url(${big})`);
  try { const warm = new Image(); warm.src = big; if (warm.decode) warm.decode().catch(() => {}); } catch (e) {}
  try { Wallpaper.init(); wallpaperOn = true; } catch (e) { console.warn(e); }
  root.style.setProperty('--grain-img', `url(${grainTile()})`);
  root.style.setProperty('--fiber-img', `url(${fiberTile()})`);
  try { InkGL.init(); InkGL.setPaper(paper); } catch (e) { console.warn(e); }
}
function grainTile() {
  const s = 180, cv = document.createElement('canvas'); cv.width = cv.height = s; const c = cv.getContext('2d');
  const img = c.createImageData(s, s), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const v = Math.random(); const dark = v < .5; d[i] = d[i + 1] = d[i + 2] = dark ? 20 : 255; d[i + 3] = Math.pow(Math.random(), 3) * 120; }
  c.putImageData(img, 0, 0); return cv.toDataURL();
}
/* 宣纸纤维：极淡横丝，静帧贴图（不动画，保 60fps） */
function fiberTile() {
  const s = 256, cv = document.createElement('canvas'); cv.width = cv.height = s; const c = cv.getContext('2d');
  c.clearRect(0, 0, s, s);
  for (let i = 0; i < 90; i++) {
    const y = Math.random() * s, x0 = Math.random() * s;
    const len = 20 + Math.random() * 70, w = 0.4 + Math.random() * 0.9;
    c.strokeStyle = `rgba(40,32,24,${0.04 + Math.random() * 0.07})`;
    c.lineWidth = w; c.beginPath();
    c.moveTo(x0, y);
    c.quadraticCurveTo(x0 + len * 0.4, y + (Math.random() - 0.5) * 3, x0 + len, y + (Math.random() - 0.5) * 2);
    c.stroke();
  }
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * s, y = Math.random() * s;
    c.fillStyle = `rgba(90,70,40,${0.015 + Math.random() * 0.03})`;
    c.beginPath(); c.ellipse(x, y, 8 + Math.random() * 18, 3 + Math.random() * 6, Math.random() * 0.4, 0, 7); c.fill();
  }
  return cv.toDataURL();
}
let resizeT;
window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => drawMountains(false), 250); });

/* 触感：墨晕涟漪 */
document.addEventListener('pointerdown', e => {
  if (typeof FX !== 'undefined' && FX.bloomAt) FX.bloomAt(e.clientX, e.clientY);
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
function splitUnits(text) {
  const units = [];
  for (const ch of text) {
    if (units.length && (PUNCT.includes(ch) || ch === ' ')) units[units.length - 1] += ch;
    else if (units.length && '“‘（《「'.includes(units[units.length - 1].slice(-1))) units[units.length - 1] += ch;
    else units.push(ch);
  }
  return units;
}
function splitSentences(text) {
  const sentences = [];
  const chars = [...text];
  let buf = '';
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    buf += ch;
    if ('。！？'.includes(ch)) {
      while (i + 1 < chars.length && '”’》」'.includes(chars[i + 1])) { i++; buf += chars[i]; }
      sentences.push(buf); buf = '';
    }
  }
  if (buf) sentences.push(buf);
  return sentences.length ? sentences : [''];
}
function bareLen(s) { return s.replace(/[\s，。、；：？！“”‘’（《》「」…—·]/g, '').length; }
function inkWrite(el, text, opt = {}) {
  const now = performance.now();
  const backlog = Math.max(0, inkBusyUntil - now);
  const start = opt.immediate ? 0 : Math.min(backlog, 1400);
  const step = opt.step || (backlog > 1200 ? 9 : 22);
  const cadence = !!opt.cadence;
  const quiet = cadence && typeof FX !== 'undefined' && FX.reduced && FX.reduced();
  if (cadence) el.classList.add('ink-cadence');
  else el.classList.remove('ink-cadence');
  const frag = document.createDocumentFragment();
  const sentences = splitSentences(text);
  const lastSent = sentences.length - 1;
  const pauseScale = text.length > 140 ? 0.62 : 1;
  let delay = start;
  let count = 0;
  sentences.forEach((sentence, si) => {
    const units = splitUnits(sentence);
    const bare = bareLen(sentence);
    let key = lastSent;
    while (key > 0 && bareLen(sentences[key]) < 2) key--;
    const dense = sentences.length === 1
      ? bare > 0 && bare <= 16
      : (si === key || (/！/.test(sentence) && bare >= 2 && bare <= 20));
    units.forEach((u, ui) => {
      const sp = document.createElement('span');
      sp.className = 'ink-ch';
      if (cadence) {
        if (dense) sp.classList.add('ink-dense');
        else if (ui === 0) sp.classList.add('ink-dry');
        else if (/[。！？，、；：…][”’》」]*$/.test(u)) sp.classList.add('ink-press');
      }
      sp.textContent = u;
      const jitter = cadence && !quiet ? ((u.charCodeAt(0) * 17) % 11) : 0;
      sp.style.animationDelay = (quiet ? 0 : delay) + 'ms';
      frag.appendChild(sp);
      count++;
      if (!quiet) {
        delay += step + jitter;
        if (cadence) {
          if (/[。！？…][”’》」]*$/.test(u)) delay += Math.round(step * 13 * pauseScale);
          else if (/[，、；：][”’》」]*$/.test(u)) delay += Math.round(step * 4.5 * pauseScale);
        }
      }
    });
  });
  el.textContent = ''; el.appendChild(frag);
  const written = quiet ? 0 : delay;
  inkBusyUntil = now + written + 200;
  if (!cadence) {
    const total = start + count * step + 1100;
    setTimeout(() => { if (el.isConnected && el.querySelector('.ink-ch')) el.textContent = text; }, total + 50);
  }
  return written;
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

let playTick = 0;
function tickPlayed() {
  if (!S || S.dead || S.ascended) { playTick = Date.now(); return; }
  const now = Date.now();
  if (playTick && document.visibilityState !== 'hidden') {
    const d = Math.min(120000, Math.max(0, now - playTick));
    S.played = (S.played | 0) + d;
  }
  playTick = now;
}
function save() {
  if (!S) return;
  tickPlayed();
  if (typeof Slots !== 'undefined') Slots.writeActive(S);
  else { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
}
function load() {
  try {
    if (typeof Slots !== 'undefined') return Slots.readActive();
    return Core.migrate(JSON.parse(localStorage.getItem(SAVE_KEY)));
  } catch (e) { console.warn(e); }
  return null;
}
function aliveSave() {
  if (typeof Slots === 'undefined') return load();
  const i = Slots.aliveIndex();
  if (i < 0) return null;
  Slots.setActive(i);
  return Slots.read(i);
}

/* ================= 屏幕切换（卷轴） ================= */
let curScreen = 'title';
/* 卷首小景的边：中心留实。底边几道宽窄不一的墨舌，左右与顶也起伏，羽化进纸，不是直线矩形渐变。 */
function juanWashMask() {
  const W = 880, H = 300, R = Ink.mulberry(47);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  const lobe = (n, amp, w0) => {
    const out = [];
    for (let i = 0; i < n; i++) out.push({ p: 0.08 + R() * 0.84, amp: (R() * 2 - 1) * amp, w: w0 + R() * w0 });
    return out;
  };
  const botL = lobe(6, 0.18, 0.042);
  const topL = lobe(4, 0.07, 0.08);
  const leftL = lobe(4, 0.055, 0.12);
  const rightL = lobe(4, 0.055, 0.12);
  const bell = (p, c0, w) => { const d = (p - c0) / w; return Math.exp(-d * d); };
  const img = c.createImageData(W, H), data = img.data;
  for (let y = 0; y < H; y++) {
    const ny = y / (H - 1);
    for (let x = 0; x < W; x++) {
      const nx = x / (W - 1);
      let bot = 0.80, top = 0.045, left = 0.04, right = 0.96;
      for (const L of botL) bot += L.amp * bell(nx, L.p, L.w);
      for (const L of topL) top += L.amp * bell(nx, L.p, L.w);
      for (const L of leftL) left += L.amp * bell(ny, L.p, L.w);
      for (const L of rightL) right -= L.amp * bell(ny, L.p, L.w);
      if (bot > 0.96) bot = 0.96; else if (bot < 0.58) bot = 0.58;
      if (top < 0) top = 0; else if (top > 0.16) top = 0.16;
      if (left < 0) left = 0; else if (left > 0.14) left = 0.14;
      if (right > 1) right = 1; else if (right < 0.86) right = 0.86;
      const yIn = ny < 0.46 ? (ny - top) / 0.07 : (bot - ny) / 0.075;
      const xIn = nx < 0.5 ? (nx - left) / 0.05 : (right - nx) / 0.05;
      let a = yIn < xIn ? yIn : xIn;
      if (a < 0) a = 0; else if (a > 1) a = 1;
      a = a * a * (3 - 2 * a);
      const i = (y * W + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = 255;
      data[i + 3] = (a * 255 + 0.5) | 0;
    }
  }
  c.putImageData(img, 0, 0);
  return cv.toDataURL('image/png');
}
function placeRealmScape() {
  const svg = document.getElementById('realm-scape');
  if (!svg) return;
  const screen = document.body.dataset.screen;
  if (screen === 'main') {
    const head = document.getElementById('juan-head');
    if (head && svg.parentElement !== head) head.insertBefore(svg, head.firstChild);
  } else {
    const sc = document.getElementById('scenery');
    const veil = document.getElementById('season-veil');
    if (sc && svg.parentElement !== sc) sc.insertBefore(svg, veil || null);
  }
}
function setScreen(id) {
  const prev = curScreen;
  if (curScreen === 'title' && id !== 'title') document.body.classList.add('intro-done');
  $$('.screen').forEach(el => el.hidden = el.id !== 'scr-' + id);
  document.body.dataset.screen = id; curScreen = id;
  placeRealmScape();
  if (prev !== id && (prev === 'title' || id === 'title')) drawMountains(true, { yield: !snappy() });
  if (typeof MoAudio !== 'undefined') {
    const mode = id === 'title' ? 'title' : (id === 'main' || id === 'create' ? 'main' : 'off');
    MoAudio.startAmbient(mode);
    if (id === 'main' && S) MoAudio.setPlace(S.loc, Math.floor((S.months % 12) / 3));
  }
}
let lastTap = null;
document.addEventListener('pointerdown', e => { lastTap = [e.clientX, e.clientY]; }, { passive: true, capture: true });
async function unrollTo(id) {
  const t = lastTap; lastTap = null;
  if (typeof MoAudio !== 'undefined') { MoAudio.unlock(); MoAudio.play('paper'); }
  await FX.wash(async () => { setScreen(id); await sleep(60); }, t && t[0], t && t[1]);
}

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 1900);
}

/* ================= 卷首 ================= */
function initTitle() {
  const s = aliveSave();
  if (s && !s.dead && !s.ascended) {
    $('#btn-continue').hidden = false;
    const extra = (typeof Slots !== 'undefined') ? Slots.loadBox().slots.filter(x => x && x.sum && !x.sum.dead && !x.sum.ascended).length : 1;
    $('#continue-sub').textContent = extra > 1 ? `${s.name} · ${realmStr(s)} · 另有卷` : `${s.name} · ${realmStr(s)}`;
  } else {
    const bc = $('#btn-continue'); if (bc) bc.hidden = true;
  }
  const _sea = s && !s.dead && !s.ascended ? Math.floor((s.months % 12) / 3) : 0;
  FX.setSeason(_sea); FX.setGold(0);
  document.body.dataset.season = _sea;
  document.body.dataset.tod = 'dawn';
  document.body.dataset.realm = (s && !s.dead && !s.ascended) ? String(s.realm || 0) : '0';
  shownRealm = document.body.dataset.realm;
  drawMountains(true);
  const subAtlas = $('#atlas-sub');
  if (subAtlas && typeof Samsara !== 'undefined') {
    const st = Samsara.atlasStats();
    subAtlas.textContent = st.lives ? `轮回 ${cn(st.lives)} 世 · 墓志 ${cn(st.epitaphs)}` : '尚未入轮回簿';
  }
  const legPeek = (typeof Samsara !== 'undefined' && Samsara.peekLegacy) ? Samsara.peekLegacy() : null;
  const legHint = $('#legacy-hint');
  if (legHint) {
    if (legPeek) {
      const bits = [];
      if (legPeek.wx) bits.push('悟性残念');
      if (legPeek.canhun) bits.push('法宝残魂');
      if (legPeek.daoji) bits.push('道基残忆');
      if (legPeek.auxPage) bits.push('功法残页');
      if (legPeek.sectMark) bits.push('门派印记');
      if (legPeek.courtMark) bits.push('皇命印记');
      if (legPeek.cave) bits.push('旧洞残钥');
      legHint.hidden = false;
      legHint.textContent = '前世余韵待启 · ' + (bits.join(' · ') || '一缕残念');
    } else legHint.hidden = true;
  }
  const btnDaily = $('#btn-daily');
  if (btnDaily && typeof Samsara !== 'undefined') {
    const ds = Samsara.dailyStatus();
    btnDaily.hidden = false;
    const sm = btnDaily.querySelector('small');
    if (sm) sm.textContent = ds.claimed ? '今日已领' : '此卷晨露';
    btnDaily.classList.toggle('dim', !!ds.claimed);
    btnDaily.onclick = () => {
      FX.requestTilt();
      if (!s || s.dead || s.ascended) { toast('须先有一卷在修，方可领日缘'); return; }
      S = s;
      const r = Samsara.claimDaily(S, pushLog);
      if (r.err) { toast(r.err); return; }
      save(); toast('日缘已领');
      initTitle();
    };
  }
  $('#btn-new').onclick = async () => {
    FX.requestTilt();
    window.__trialStart = false;
    if (!(await pickSlotForNew(false))) return;
    resetCreate(); unrollTo('create');
  };
  const btnTrial = $('#btn-trial');
  if (btnTrial) {
    btnTrial.hidden = false;
    btnTrial.onclick = async () => {
      FX.requestTilt();
      const ok = await trialBrief();
      if (!ok) return;
      if (!(await pickSlotForNew(true))) return;
      window.__trialStart = true;
      resetCreate(); unrollTo('create');
    };
  }
  const btnAtlas = $('#btn-atlas');
  if (btnAtlas) btnAtlas.onclick = () => { FX.requestTilt(); openAtlasSheet(); };
  const btnSlots = $('#btn-slots');
  if (btnSlots) btnSlots.onclick = () => { FX.requestTilt(); openSlots(); };
  $('#btn-continue').onclick = () => { FX.requestTilt(); S = aliveSave(); if (!S) return; playTick = Date.now(); enterMain(true); };
}

async function pickSlotForNew(trial) {
  if (typeof Slots === 'undefined') return true;
  let i = Slots.firstEmpty();
  if (i < 0) {
    const ok = await inkConfirm(trial ? '三卷皆满。试炼将覆盖最近一卷。' : '三卷皆满。另开将覆盖最近一卷。', trial ? '试炼' : '覆盖', true);
    if (!ok) return false;
    i = Slots.newestIndex();
  }
  window.__slotTarget = i;
  Slots.setActive(i);
  return true;
}

/* ================= 试炼入局笺 ================= */
function trialBrief() {
  return new Promise(res => {
    const el = document.createElement('div');
    el.className = 'ask trial-brief';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.innerHTML = `<div class="ask-shade"></div>
      <div class="ask-card trial-card">
        <div class="trial-chop" aria-hidden="true">试炼</div>
        <h3 class="trial-card-title">试炼境</h3>
        <p class="trial-lead">以金丹初期之身入局。</p>
        <p class="trial-rule"><i>起手</i><span>年四十，修为自零起，灵石一百二十。</span></p>
        <p class="trial-rule"><i>所求</i><span>二十载内，须破一障。</span></p>
        <p class="trial-rule"><i>卷末</i><span>不入轮回簿。图鉴仍可解锁。</span></p>
        <p class="trial-rule"><i>此身</i><span>灵根与名分仍随你所测、所拜。</span></p>
        <div class="ask-btns">
          <button class="brush-btn small ask-no" type="button"><span class="bb-ink"></span><span class="bb-text">且慢</span></button>
          <button class="brush-btn small ask-ok" type="button" id="ask-ok"><span class="bb-ink"></span><span class="bb-text">入局</span></button>
        </div>
      </div>`;
    document.body.appendChild(el);
    const done = v => {
      if (!askOpen) return;
      askOpen = null;
      el.classList.remove('open');
      setTimeout(() => el.remove(), 320);
      res(v);
    };
    askOpen = done;
    el.querySelector('.ask-ok').onclick = () => done(true);
    el.querySelector('.ask-no').onclick = () => done(false);
    el.querySelector('.ask-shade').onclick = () => done(false);
    requestAnimationFrame(() => { el.classList.add('open'); el.querySelector('.ask-ok').focus({ preventScroll: true }); });
  });
}

/* ================= 墨笺问询：替代原生 confirm ================= */
let askOpen = null;
function inkConfirm(text, ok = '确定', danger = false, sub = '确定么？') {
  return new Promise(res => {
    const el = document.createElement('div'); el.className = 'ask'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = `<div class="ask-shade"></div><div class="ask-card"><p class="ask-text"></p><p class="ask-sub"></p>
      <div class="ask-btns"><button class="brush-btn small ask-no"><span class="bb-ink"></span><span class="bb-text">且慢</span></button>
      <button class="brush-btn small ask-ok${danger ? ' danger' : ''}" id="ask-ok"><span class="bb-ink"></span><span class="bb-text"></span></button></div></div>`;
    el.querySelector('.ask-text').textContent = text;
    el.querySelector('.ask-sub').textContent = sub;
    el.querySelector('.ask-ok .bb-text').textContent = ok;
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
  const trial = !!window.__trialStart;
  const ch = document.querySelector('#scr-create .chapter');
  const ban = $('#trial-banner');
  if (ch) ch.textContent = trial ? '试炼境' : '第一卷';
  if (ban) {
    ban.hidden = !trial;
    ban.textContent = trial ? '今日试炼：以金丹初期之身入局，年四十，灵石一百二十。二十载内须破一障，不入轮回簿。' : '';
  }
  $('#inp-name').value = '';
  $('#lg-name').textContent = ''; $('#lg-stats').textContent = '';
  const f = $('#lg-flavor'); f.textContent = trial ? '灵根随你。入局之后，已是金丹初期。' : '以指触石，可知灵根。'; f.className = 'lg-flavor dim';
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
  $('#btn-start').onclick = async () => {
    if (!roll) return;
    let name = $('#inp-name').value.trim().replace(/\s+/g, '');
    if (!name) { name = randName(); $('#inp-name').value = name; }
    const origin = await openOrigin();
    if (!origin) return;
    const choice = await openBaishan(roll);
    if (!choice) return;
    newGame(name, roll, choice, origin);
  };
  $('#inp-name').addEventListener('keydown', e => { if (e.key === 'Enter') e.target.blur(); });
}

function newGame(name, r, choice, originId) {
  let legacy = null;
  if (typeof Samsara !== 'undefined' && Samsara.consumeLegacy) legacy = Samsara.consumeLegacy();
  else { try { legacy = JSON.parse(localStorage.getItem(LEGACY_KEY)); localStorage.removeItem(LEGACY_KEY); } catch (e) {} }
  const orgId = choice && choice.id !== 'free' ? choice.id : null;
  const free = !!(choice && choice.id === 'free');
  const trial = !!window.__trialStart;
  window.__trialStart = false;
  const rr = Object.assign({}, r, { org: orgId, free, trial, origin: originId || 'qingshi' });
  S = Core.newState(name, rr, legacy);
  if (typeof Slots !== 'undefined') {
    const slot = window.__slotTarget != null ? window.__slotTarget : (Slots.firstEmpty() >= 0 ? Slots.firstEmpty() : Slots.newestIndex());
    window.__slotTarget = null;
    Slots.setActive(slot);
  }
  playTick = Date.now();
  if (!trial && typeof Samsara !== 'undefined') {
    const meta = Samsara.loadMeta();
    const firstLife = !legacy && !(meta.guide) && !(meta.lives > 0);
    if (firstLife) S.flags.guide = 1;
  }
  const lgDesc = (r.lg.id === 'wei' ? '' : r.els.join('')) + r.lg.name;
  const o = orgId && ORGS[orgId];
  let sectLine;
  if (free) {
    sectLine = r.lg.id === 'wei'
      ? `测得伪灵根，各宗门前无立锥之地。你折叠拜山帖，独自往深山里去了——无门无派，也好。`
      : `测得${lgDesc}。你拜了山帖，却在山门外止步：此生不入任何门户。云海翻涌，像在鼓掌，也像在叹气。`;
  } else if (o) {
    const rank = Core.rankName(S);
    const gf0 = S.gf && GONGFA[S.gf] ? GONGFA[S.gf].name : '入门心法';
    sectLine = `测得${lgDesc}。你投帖${o.name}，赐下${rank}名分，领了腰牌与一卷《${gf0}》。${o.trait || ''}`;
  } else {
    sectLine = `测得${lgDesc}。山门之内，尘埃落定。`;
  }
  const who = (typeof Juan !== 'undefined' && Juan.originName) ? Juan.originName(S) : '青石镇少年';
  const rankWord = Core.rankName(S);
  if (trial) {
    pushLog({
      title: '试炼',
      text: `今日试炼：以金丹${rankWord}之身入局。出身${who}，名${name}，年四十，随身灵石一百二十。二十载内须破一障；此局不入轮回簿，可解锁图鉴。`,
      cls: 'gold',
      tags: [{ t: '金丹初期', c: 'gold' }, { t: '二十载', c: 'gold' }]
    });
  } else {
    const line = (typeof Juan !== 'undefined' && Juan.originLine) ? Juan.originLine(S) : `你名${name}，青石镇人氏，年方十六。`;
    pushLog({ text: `大衍历三千七百二十一年，春。天下开山收徒。${line}`, cls: 'sys' });
  }
  pushLog({ text: sectLine });
  if (legacy) {
    const tags = S._legacyTags || [{ t: '前世残念', c: 'gold' }];
    pushLog({ text: '入山那夜，你梦见一柄断剑沉在云海深处，剑身上刻着一个陌生的名字。醒来时，许多道理竟像早已懂得。', tags, cls: 'gold' });
    const bits = [];
    if (legacy.cave) bits.push('一枚旧钥');
    if (legacy.auxPage) bits.push('半页残卷');
    if (legacy.canhun) bits.push('一声旧器的鸣');
    if (bits.length) pushLog({ title: '轮回', text: `除了那些说不清的道理，你还带着${bits.join('、')}。它们会在该出现的时候出现。`, cls: 'breath' });
  }
  if (S.flags && S.flags._legacyJoinText) {
    pushLog({ text: S.flags._legacyJoinText, tags: [{ t: '门派印记', c: 'gold' }], cls: 'gold' });
    delete S.flags._legacyJoinText;
  }
  pushLog({ text: trial ? '试炼钟响。此去不问来世，只问此身能走多远。' : '山门之外，云海翻涌。此去长生，不问归期。', cls: 'gold', div: !trial });
  if (legacy && legacy.thread) pushLog({ title: '前世绝笔', text: legacy.thread, cls: 'breath' });
  else if (S.flags && S.flags.threadText) pushLog({ title: '前世绝笔', text: S.flags.threadText, cls: 'breath' });
  save();
  enterMain(false);
  if (!trial) setTimeout(() => { if (S && !(S.life && S.life.goal)) openGoalPicker(); }, 800);
}

async function openOrigin() {
  const list = (typeof Juan !== 'undefined' && Juan.ORIGINS) ? Juan.ORIGINS : null;
  const pc = $('#origin-cer');
  if (!pc || !list || !list.length) return 'qingshi';
  return new Promise(resolve => {
    pc.hidden = false; pc.className = 'path-cer origin-cer go';
    $('#origin-seal').textContent = '身';
    $('#origin-title').textContent = '出身';
    const opts = $('#origin-opts'); opts.innerHTML = ''; opts.className = 'path-cer-opts';
    const foot = $('#origin-foot'); foot.hidden = false;
    const conf = $('#origin-confirm');
    conf.disabled = true; conf.classList.add('dim');
    const hint = $('#origin-hint'); if (hint) hint.textContent = '点选一种出身，再落墨';
    inkWrite($('#origin-lead'), '灵根未测之前，你已在世上活了十六年。这一页出身，会跟着你走进山门，也会在卷末轻轻偏一下。', { immediate: true, step: 22 });
    let selected = null;
    list.forEach((o, i) => {
      const btn = document.createElement('button');
      btn.className = 'path-opt'; btn.type = 'button'; btn.style.animationDelay = (120 + i * 60) + 'ms';
      btn.innerHTML = `<span class="po-seal${(o.seal || '').length > 1 ? ' wide' : ''}"></span><div class="po-body"><b></b><em></em><p></p></div>`;
      btn.querySelector('.po-seal').textContent = o.seal;
      btn.querySelector('b').textContent = o.name;
      btn.querySelector('em').textContent = '偏向 · ' + o.lean;
      btn.querySelector('p').textContent = o.prose;
      btn.onclick = () => {
        selected = o;
        opts.querySelectorAll('.path-opt').forEach(x => x.classList.remove('on'));
        btn.classList.add('on');
        conf.disabled = false; conf.classList.remove('dim');
        if (hint) hint.textContent = '确认后落墨 · Enter 亦可';
      };
      opts.appendChild(btn);
    });
    conf.onclick = async () => {
      if (!selected || conf.disabled) return;
      opts.classList.add('locked');
      if (typeof MoAudio !== 'undefined') MoAudio.play('stamp');
      pc.classList.add('leave'); await sleep(640);
      pc.hidden = true; pc.className = 'path-cer origin-cer';
      resolve(selected.id);
    };
  });
}

async function openBaishan(roll) {
  const list = (typeof baishanAllowed === 'function' ? baishanAllowed(roll.lg.id) : BAISHAN);
  const pc = $('#baishan'); if (!pc || !list || !list.length) return { id: roll.lg.id === 'wei' ? 'sx' : 'qm' };
  return new Promise(resolve => {
    pc.hidden = false; pc.className = 'path-cer baishan go';
    $('#baishan-seal').textContent = '拜';
    $('#baishan-title').textContent = '拜山帖';
    $('#baishan-lead').textContent = '';
    const opts = $('#baishan-opts'); opts.innerHTML = ''; opts.className = 'path-cer-opts';
    const foot = $('#baishan-foot'); foot.hidden = false;
    const conf0 = $('#baishan-confirm');
    conf0.disabled = true;
    conf0.classList.add('dim');
    const h0 = $('#baishan-hint'); if (h0) h0.textContent = '点选一家门户，再投帖';
    const lead = roll.lg.id === 'wei'
      ? '伪灵根不为大多数宗门所收。帖上只余散修盟与无门两途——选一条，活下去。'
      : '灵根已定。山海之间，数家门户张帖招徒。一帖既投，便是数年乃至数十年的路——慎择。';
    inkWrite($('#baishan-lead'), lead, { immediate: true, step: 22 });
    let selected = null;
    list.forEach((b, i) => {
      const btn = document.createElement('button');
      btn.className = 'path-opt'; btn.style.animationDelay = (160 + i * 80) + 'ms';
      btn.innerHTML = `<span class="po-seal">${esc(b.seal)}</span><div class="po-body"><b>${esc(b.name)}</b><em>${esc(b.sub)}</em><p></p></div>`;
      btn.querySelector('p').textContent = b.prose;
      btn.type = 'button';
      btn.onclick = () => {
        selected = b;
        opts.querySelectorAll('.path-opt').forEach(x => x.classList.remove('on'));
        btn.classList.add('on');
        foot.hidden = false;
        const conf = $('#baishan-confirm');
        conf.disabled = false;
        conf.classList.remove('dim');
        const lab = conf.querySelector('.bb-text');
        if (lab) lab.textContent = b.id === 'free' ? '无门而去' : '投帖拜入';
        const h = $('#baishan-hint'); if (h) h.textContent = '确认后投帖 · Enter 亦可';
      };
      opts.appendChild(btn);
    });
    $('#baishan-confirm').onclick = async () => {
      if (!selected || $('#baishan-confirm').disabled) return;
      opts.classList.add('locked');
      if (typeof MoAudio !== 'undefined') MoAudio.play('stamp');
      pc.classList.add('leave'); await sleep(700);
      pc.hidden = true; pc.className = 'path-cer baishan';
      resolve(selected);
    };
  });
}

/* ================= 主界面 ================= */
function enterMain(fromSave) {
  $('#log').innerHTML = '';
  const logs = S.log.slice(-30);
  unrollTo('main').then(() => {
    // 先铺陈旧事，最后三条以墨晕写出
    render();
    logs.forEach((e, i) => renderEntry(e, fromSave ? i >= logs.length - 2 : true));
    if (fromSave) scrollLog();
    else { const l = $('#log'); if (l) l.scrollTop = 0; }
    if (typeof JHUI !== 'undefined') setTimeout(JHUI.resume, 700);
    if (fromSave) setTimeout(() => ensurePendingPath(), 900);
    if (S.flags && S.flags.guide) setTimeout(() => maybeGuide(), fromSave ? 600 : 1100);
  });
  render();
}
function clipMark(text) {
  let t = String(text || '').replace(/\s+/g, '');
  const i = t.search(/[。！？]/);
  if (i >= 6 && i <= 28) return t.slice(0, i);
  return t.length > 24 ? t.slice(0, 24) : t;
}
function noteMark(e) {
  if (!S || !e || !e.title || e.guide) return;
  S.marks = S.marks || [];
  const last = S.marks[S.marks.length - 1];
  if (last && last.t === e.title) return;
  S.marks.push({ t: e.title, y: S.age | 0, c: e.cls || '', d: clipMark(e.text) });
  if (S.marks.length > 24) S.marks.splice(0, S.marks.length - 24);
  if (typeof Life !== 'undefined' && Life.note) Life.note(S, { y: S.age | 0, t: e.title, d: clipMark(e.text), k: e.cls || '' });
}
function pushLog(e) {
  e.time = timeLabel();
  if (typeof Juan !== 'undefined' && Juan.onLog) Juan.onLog(S, e);
  noteMark(e);
  S.log.push(e); if (S.log.length > 60) S.log.splice(0, S.log.length - 60);
  if (curScreen === 'main' && !document.getElementById('scr-main').hidden) {
    renderEntry(e, true); scrollLog();
    if (e.colo) renderSeals();
  }
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
  if (e.colo) { const c = document.createElement('div'); c.className = 'entry-colo'; c.textContent = e.colo; el.appendChild(c); }
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
  syncColo();
}
function syncColo() {
  const last = (S && S.colophon && S.colophon.length) ? S.colophon[S.colophon.length - 1] : null;
  document.querySelectorAll('#log .entry-colo').forEach(colo => {
    const title = colo.parentElement && colo.parentElement.querySelector('.entry-title');
    const onMargin = !!(last && colo.textContent === last.line && title && title.textContent === last.t);
    colo.hidden = onMargin;
  });
}
function scrollLog() { const l = $('#log'); requestAnimationFrame(() => l.scrollTop = l.scrollHeight); }

// 单行自适应：放不下就逐级缩小字号，绝不折行
function fitLine(el, max, min) {
  if (!el || !el.clientWidth) return;
  let f = max; el.style.fontSize = f + 'px'; el.style.letterSpacing = '';
  while (el.scrollWidth > el.clientWidth + 0.5 && f > min) { f -= 0.5; el.style.fontSize = f + 'px'; el.style.letterSpacing = '0.02em'; }
}
let shownRealm = null;
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
  const trialSeal = $('#trial-seal');
  if (trialSeal) trialSeal.hidden = !(S.flags && S.flags.trial);
  setText('#h-name', S.name);
  const cr = typeof courtRankName === 'function' ? courtRankName(S) : '';
  setText('#h-sub', `${Core.rankName(S)}${cr ? ' · ' + cr : ''} · ${S.lg.id === 'wei' ? '' : S.lgEls.join('')}${S.lg.name}`);
  renderPathSeals();
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
  if (typeof MoAudio !== 'undefined') MoAudio.setSeason(season);
  const nextRealm = String(S.ascended ? 5 : S.realm);
  if (shownRealm != null && shownRealm !== nextRealm && document.body.dataset.screen === 'main' && !snappy()) {
    document.body.classList.add('realm-shift');
    clearTimeout(render._rs);
    render._rs = setTimeout(() => document.body.classList.remove('realm-shift'), 980);
  }
  if (shownRealm !== nextRealm) { shownRealm = nextRealm; document.body.dataset.realm = nextRealm; drawMountains(true, { yield: document.body.dataset.screen === 'main' && !snappy() }); }
  else document.body.dataset.realm = nextRealm;
  document.body.dataset.season = season;
  // 时辰感：按月份内进度微移（晨／午／暮），只影响纸色，不改玩法
  const mIn = S.months % 3; // 0..2 within season quarter-ish
  document.body.dataset.tod = mIn === 0 ? 'dawn' : mIn === 1 ? 'noon' : 'dusk';
  setText('#c-wx', cn(S.wx)); setText('#c-xj', xinjingWord(S.xj)); setText('#c-ls', S.ls > 9999 ? fmtNum(S.ls) : cn(S.ls));
  const chipC = $('#chip-court');
  if (chipC) {
    const on = !!(S.court && S.court.rank >= 0);
    chipC.hidden = !on;
    if (on) setText('#c-court', courtRankName(S) || '白身');
  }
  const chipG = $('#chip-goal');
  if (chipG) {
    const gn = (typeof Life !== 'undefined' && Life.goalName) ? Life.goalName(S) : '';
    chipG.hidden = !gn;
    if (gn) setText('#c-goal', gn);
  }
  const tm = Core.gt(S, 'time', 1);
  setText('#dur-tuna', cnDur(Math.round(r.T * K.tunaMonths * tm))); setText('#dur-biguan', cnDur(Math.round(r.T * K.biguanMonths * tm)));
  const cnt = Object.values(S.items).reduce((a, b) => a + b, 0);
  const bagLab = S.eq && S.eq.weapon ? (cnt ? `佩·${cn(cnt)}` : '佩') : (cnt ? `${cn(cnt)}物` : '空');
  setText('#bag-count', bagLab);
  if (typeof JHUI !== 'undefined') setText('#youli-sub', JHUI.youliSub());
  $('#btn-break').hidden = !bottleneck() || S.dead || S.ascended;
  const st = $('#status-line'); st.classList.remove('zhu');
  let msg = '';
  if (bottleneck()) {
    const pill = r.pill;
    msg = (S.items[pill] > 0) ? '瓶颈已至 · 囊中有丹，可破境' : '瓶颈已至 · 可破境，坊市或有丹药';
    st.classList.add('zhu');
  }
  else if (S.inj > 0) { msg = `伤势未愈 · 修炼减半`; st.classList.add('zhu'); }
  else if (S.buff) msg = `灵脉加持 · 余${cn(S.buff.n)}次`;
  else if (lowLife) { msg = '寿元无多'; st.classList.add('zhu'); }
  else if (S.xj < 15) { msg = '心境动摇 · 恐生心魔'; st.classList.add('zhu'); }
  else if (S.court && S.court.rank >= 6 && typeof canClaimThrone === 'function' && (canClaimThrone(S) || canRegent(S)) && !S.flags.jc_throne) { msg = '鼎鼐可问 · 往京城一抉'; st.classList.add('zhu'); }
  else if (S.karma && (S.karma.seeds || []).some(k => S.months >= k.due && !S.flags['karma_done_' + k.id])) { msg = '因果将至 · 游历或逢回响'; st.classList.add('zhu'); }
  else if (S.flags && S.flags.tideDue) { msg = '天下有变 · 出山或可遇见'; st.classList.add('zhu'); }
  else if (S.flags && S.flags.guide && (S.acts | 0) < 1) msg = '先吐纳一息，或出山看看';
  else if ((S.flags && S.flags.cultRun | 0) >= 6) { msg = '闭关已久 · 山外或有机缘'; st.classList.add('zhu'); }
  else if (S.gf && GONGFA[S.gf].mo) msg = `魔功在身 · ${GONGFA[S.gf].name}`;
  else {
    const bits = [];
    if (S.gf && GONGFA[S.gf]) bits.push('主《' + GONGFA[S.gf].name + '》');
    if ((S.aux || []).length) bits.push('辅' + cn(S.aux.length));
    if (S.fabao) bits.push('本命' + S.fabao.name);
    if (S.path && S.path.daoji && typeof DAOJI !== 'undefined' && DAOJI[S.path.daoji]) bits.push(DAOJI[S.path.daoji].name);
    if (bits.length) msg = bits.slice(0, 3).join(' · ');
  }
  st.textContent = msg;
  renderSide();
  renderSeals();
}
function renderSeals() {
  const col = $('#margin-seals'), note = $('#margin-note');
  if (!col || !S) return;
  if (typeof Juan !== 'undefined' && Juan.ensure) Juan.ensure(S);
  const list = S.colophon || [];
  const paper = document.querySelector('#scr-main .scroll-paper');
  const setNote = on => { if (paper) paper.classList.toggle('has-note', !!on); };
  if (!list.length) {
    col.hidden = true; col.innerHTML = '';
    if (note) { note.hidden = true; note.textContent = ''; }
    delete document.body.dataset.seals;
    setNote(false);
    return;
  }
  document.body.dataset.seals = '1';
  const last = list[list.length - 1];
  const sig = list.length + '|' + (last.seal || '') + '|' + (last.line || '');
  const changed = !!(renderSeals._sig && renderSeals._sig !== sig);
  renderSeals._sig = sig;
  const show = list.slice(-6);
  col.hidden = false;
  col.innerHTML = show.map((c, i) => `<i class="m-seal${changed && i === show.length - 1 ? ' land' : ''}">${esc(c.seal || '印')}</i>`).join('');
  if (note) {
    const line = last.line || '';
    note.hidden = !line;
    note.textContent = line;
    note.classList.toggle('land', changed && !!line);
    setNote(!!line);
  } else setNote(false);
  syncColo();
}
// 宽屏右栏：功法 / 宗门 / 行囊 / 行迹 一览（窄屏隐藏时不渲染）
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function renderSide() {
  const side = $('#side'); if (!side || !side.offsetParent || !S) return;
  const g = S.gf && GONGFA[S.gf];
  const auxN = (S.aux || []).length;
  const pathBits = (Core.pathSummary(S) || []).map(x => x.name).join(' · ');
  const fabaoLine = S.fabao ? `<span class="sd-row">本命 · ${esc(S.fabao.name)} · ${FABAO_STAGE[S.fabao.stage|0]}</span>` : '';
  const auxLine = auxN ? `<span class="sd-row">辅修 ${cn(auxN)} 门</span>` : '';
  const pathLine = pathBits ? `<span class="sd-row path-line">${esc(pathBits)}</span>` : '';
  $('#sd-gf').innerHTML = g
    ? `<b class="sd-name">《${esc(g.name)}》</b><span class="sd-row"><em>${GF_GRADE[g.grade]}</em>${S.gfs[S.gf].lv >= GF_LAYERS ? '大成' : '第' + cn(S.gfs[S.gf].lv) + '层'} · 行功×${Core.gfSpeed(S).toFixed(2)}</span>${auxLine}${fabaoLine}${pathLine}`
    : (fabaoLine || pathLine ? `${fabaoLine}${pathLine}` : '<span class="sd-empty">胸中尚无功法</span>');
  const o = Core.org(S);
  const bond = [];
  if (S.bond && S.bond.lost && S.karma && S.karma.mate) bond.push('道侣已失');
  else if (S.karma && S.karma.mate && typeof NPCS !== 'undefined' && NPCS[S.karma.mate]) bond.push('道侣 · ' + NPCS[S.karma.mate].name);
  const discs = (S.bond && S.bond.discs) || [];
  if (discs.length) bond.push('徒 · ' + discs.map(d => d.name + (d.fate === 'betray' ? '·叛' : d.fate === 'inherit' ? '·承' : d.fate === 'surpass' ? '·青' : '')).join('、'));
  if (S.karma && S.karma.foe && typeof NPCS !== 'undefined' && NPCS[S.karma.foe]) bond.push('宿敌 · ' + NPCS[S.karma.foe].name);
  const bondLine = bond.length ? `<span class="sd-row">${esc(bond.join(' · '))}</span>` : '';
  $('#sd-sect').innerHTML = o ? `<b class="sd-name">${esc(o.name)}</b><span class="sd-row">${esc(Core.rankName(S))} · 贡献 ${fmtNum(S.sect.gx)}</span>${bondLine}`
    : `<b class="sd-name">${esc(Core.rankName(S))}</b><span class="sd-row">无门无派，来去自由</span>${bondLine}`;
  const items = Object.entries(S.items).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  const eqLine = S.eq && S.eq.weapon ? `<span class="sd-row">佩 · ${esc(S.eq.weapon)}</span>` : '';
  $('#sd-bag').innerHTML = (eqLine || items.length) ? `${eqLine}${items.length ? `<ul class="sd-list">${items.slice(0, 4).map(([k, n]) => `<li><span>${esc(k)}</span><i>${cn(n)}</i></li>`).join('')}</ul>` : ''}${items.length > 4 ? `<span class="sd-more">另有${cn(items.length - 4)}种</span>` : ''}`
    : '<span class="sd-empty">囊中空空</span>';
  const loc = typeof LOCS !== 'undefined' && LOCS.find(l => l.id === S.loc);
  const notes = [];
  if (S.court && S.court.rank >= 0) notes.push(`朝 · ${courtRankName(S)}　兵${cn(S.court.bing)} 民${cn(S.court.min)} 道${cn(S.court.dao)}`);
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
    S.flags.cultRun = (S.flags.cultRun | 0) + 1;
    if (typeof MoAudio !== 'undefined') MoAudio.play('breath');
    lock(1500);
    const B = buffer(), o = Core.tuna(S, B.emit);
    save();
    // 灵气旋入丹田之后，才落笔记下这一季
    const done = async () => {
      if (!S) return;
      pushLog({ text: o.text, tags: o.tags }); B.flush(); Core.afterGain(S, o.ups, pushLog); render(); save(); checkEnd(); maybeWanderNudge(); maybeGuide();
      const bx = $('.bar-xw'); bx.classList.remove('gain'); void bx.offsetWidth; bx.classList.add('gain');
      clearTimeout(act.gt); act.gt = setTimeout(() => bx.classList.remove('gain'), 1500);
      await maybeFabaoCeremony();
    };
    if (typeof InkGL !== 'undefined' && InkGL.qi) InkGL.qi($('.scroll-paper'), { cy: .5, onSink: done });
    else { const sp = $('.scroll-paper').getBoundingClientRect(); FX.qiSwirl(sp.left + sp.width / 2, sp.top + sp.height * 0.55, done); }
    return;
  } else if (kind === 'biguan') {
    S.flags.cultRun = (S.flags.cultRun | 0) + 1;
    if (typeof MoAudio !== 'undefined') MoAudio.play('cave');
    lock(1100);
    FX.cave();
    const B = buffer(), o = Core.biguan(S, B.emit);
    pushLog({ text: o.text, tags: o.tags, cls: o.cls }); B.flush();
    Core.afterGain(S, o.ups, pushLog);
    if (typeof Life !== 'undefined') {
      const v = Life.takeVignette(S, 'biguan');
      if (v) pushLog({ title: v.title, text: v.text, cls: 'breath' });
      if (Life.shouldAskGoal(S) && !uiBlocked()) setTimeout(() => openEvent(Life.goalShiftEvent(S)), 500);
    }
    render(); save(); checkEnd(); maybeWanderNudge(); maybeGuide();
    maybeFabaoCeremony();
    return;
  } else if (kind === 'youli' && typeof JHUI !== 'undefined') {
    if (S.flags) S.flags.cultRun = 0;
    return JHUI.openMap();
  } else if (kind === 'youli') {
    if (S.flags) S.flags.cultRun = 0;
    const ym = Math.max(1, Math.round(r.T * K.youliMonths / (Core.pathYouliMul ? Core.pathYouliMul(S) : 1)));
    Core.passTime(S, ym, pushLog);
    if (S.dead) { render(); save(); checkEnd(); return; }
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
const GUIDES = [
  { id: 'g1', min: 0, title: '晨课', seal: '息',
    text: '入山第一夜，窗纸被风吹得轻轻响。执事只叮过一句：吐纳，是一季的呼吸；闭关，是一年的灯火。修为走到头时，卷上会浮出一枚朱红的「破境」。',
    ok: '先去吐纳', okText: '你吸了一口气。丹田里有一点暖，像一粒还没点燃的火星。' },
  { id: 'g2', min: 2, title: '旧囊', seal: '囊',
    text: '你摸到袖中那只旧囊。丹药、残卷、兵器，都收在底下那枚「行囊」里——服下，佩上，或只是看看。有些东西不到时候，吃了也无益。',
    ok: '记下了', okText: '你把囊口系紧。东西还在，路也还在。' },
  { id: 'g3', min: 4, title: '腰间印', seal: '修',
    text: '腰侧那枚黑印，刻着一个「修」字。点开它，便是功法、本命与日后的定型。主修一门，辅修至多两门。路还长，不必今夜都懂。',
    ok: '知道了', okText: '你按了按那枚印。它凉，像一块刚落定的墨。' },
];
function guideEvent(g) {
  return {
    id: g.id, guide: true, title: g.title, seal: g.seal,
    text: () => g.text,
    choices: () => [
      { label: g.ok, sub: '', act: () => ({ text: g.okText, fx: { xj: 1 } }) },
      { label: '这些我已知', sub: '不再提示', skipAll: true, act: () => ({ text: '你拱了拱手。后头没说完的话，山风替你吹散了。', fx: {} }) },
    ],
  };
}
function uiBlocked() {
  if (busy) return true;
  if (document.querySelector('.ask')) return true;
  for (const id of ['end', 'rite', 'dan', 'auc', 'duel', 'bt', 'path-cer', 'baishan', 'goal-cer', 'modal', 'sheet', 'mj', 'map', 'scroll-view']) {
    const el = document.getElementById(id);
    if (el && !el.hidden) return true;
  }
  return false;
}
function finishGuide() {
  if (S && S.flags) S.flags.guide = 0;
  if (typeof Samsara === 'undefined') return;
  const m = Samsara.loadMeta();
  m.guide = 1;
  Samsara.saveMeta(m);
}
function maybeGuide() {
  if (!S || S.dead || S.ascended || !S.flags || !S.flags.guide || S.flags.trial) return;
  if (uiBlocked()) {
    if ((maybeGuide._n | 0) < 16) { maybeGuide._n = (maybeGuide._n | 0) + 1; setTimeout(maybeGuide, 500); }
    return;
  }
  maybeGuide._n = 0;
  const g = GUIDES.find(x => !S.flags[x.id] && (S.acts | 0) >= x.min);
  if (!g) return;
  openEvent(guideEvent(g));
}
function maybeWanderNudge() {
  if (!S || !S.flags || S.dead) return;
  const n = S.flags.cultRun | 0;
  const key = 'nudgeW' + S.realm;
  if (n === 8 && !S.flags[key]) {
    S.flags[key] = 1;
    pushLog({ text: '你在洞里坐得太久，窗纸都黄了一圈。山门外似有人声，像在喊集市，又像只是风。', cls: 'sys' });
  }
}
let endT = 0;
function checkEnd() {
  if (S && !S.dead && !S.ascended && S.flags && S.flags.trial && S.flags.trialYears) {
    const startAge = 40;
    if ((S.age | 0) >= startAge + (S.flags.trialYears | 0)) {
      S.dead = true; S.ending = S.ending || 'zuohua';
      pushLog({ title: '试炼终', text: '二十载钟声再响。试炼境收卷——此局不入轮回簿，所见道基／法相／神器已记入图鉴。', cls: 'sys', div: true });
    }
  }
  if (S && S.dead && !endT) endT = setTimeout(() => { endT = 0; if (S && S.dead) showEnd(S.ending || 'zuohua'); }, 1800);
  else if (S && !S.dead && S.sect && S.sect.dabiDue) setTimeout(dabiInvite, 1400);
}

/* ================= 奇遇卷轴 ================= */
const modal = $('#modal');
function snappy() {
  const root = document.documentElement;
  return root.dataset.motion === 'lite' || root.dataset.fx === 'thin' || (typeof FX !== 'undefined' && FX.reduced());
}
async function openModal() {
  modal.hidden = false;
  const hs = $('#hscroll');
  hs.style.setProperty('--half', (hs.offsetWidth / 2 - 10) + 'px');
  $('.ev-main').scrollTop = 0;
  await sleep(snappy() ? 16 : 30);
  modal.classList.add('open');
}
async function closeModal() {
  modal.classList.remove('open');
  await sleep(snappy() ? 240 : 640);
  modal.hidden = true;
}
function portraitHtml(ev) {
  if (typeof InkPortrait === 'undefined' || !ev) return '';
  if ((ev.id === 'bond_dual' || ev.id === 'bond_jie') && S && S.karma && S.karma.mate) {
    const svg = InkPortrait.svg(S.karma.mate);
    if (svg) return svg;
  }
  return InkPortrait.forEvent(ev);
}
function evTitle(ev) { return ev && typeof ev.title === 'function' ? ev.title(S) : (ev && ev.title) || ''; }
function choiceSub(c, s) {
  let sub = typeof c.sub === 'function' ? c.sub(s) : (c.sub || '');
  if (c.odds != null && s && s.evFoe && typeof Core !== 'undefined' && Core.oddsWord) {
    const base = typeof c.odds === 'function' ? c.odds(s) : c.odds;
    const w = Core.oddsWord(s, base);
    if (w) sub = sub ? (sub + ' · ' + w) : w;
  }
  return sub;
}
function mountFoeSlip(after) {
  if (!after || !after.parentNode) return;
  const old = after.parentNode.querySelector('.foe-slip');
  if (old) old.remove();
  if (!S || !S.evFoeMeta) return;
  const meta = S.evFoeMeta;
  const slip = document.createElement('div');
  if (meta.roster && meta.roster.length) {
    slip.className = 'foe-slip roster';
    slip.innerHTML = meta.roster.map(r => `<div class="foe-row"><b>${esc(r.name)}</b><em>${esc(r.title || '')}</em><span>${esc(r.read || '')}</span><small>${esc(r.realm || '')}</small></div>`).join('');
  } else if (S.evFoe && Core.glance) {
    const g = Core.glance(S);
    slip.className = 'foe-slip' + (g.exact ? '' : ' dim');
    const title = meta.title ? `<em>${esc(meta.title)}</em>` : '';
    slip.innerHTML = `<div class="foe-name">${esc(meta.name || '对手')}${title}</div>`
      + (g.exact ? `<div class="foe-realm">${esc(g.realm)}</div>` : '')
      + `<div class="foe-read">「${esc(g.read)}」</div>`
      + (g.exact ? '' : `<div class="foe-rough">${esc(g.rough)}</div>`);
  } else return;
  after.insertAdjacentElement('afterend', slip);
}
function openEvent(ev) {
  if (!ev) return;
  if (!ev.guide && typeof Samsara !== 'undefined' && Samsara.seeEncounter) Samsara.seeEncounter(ev.id);
  const slot = $('#ev-portrait');
  if (slot) { const html = portraitHtml(ev); slot.innerHTML = html; slot.hidden = !html; }
  const title = evTitle(ev);
  FX.vtext($('#ev-title'), title);
  $('#ev-seal').textContent = ev.seal || pick(['缘', '遇', '奇', '机']);
  if (S) { S.evFoe = null; S.evFoeMeta = null; }
  const text = ev.text(S);
  $('#ev-result').innerHTML = '';
  const box = $('#ev-choices'); box.innerHTML = ''; box.className = 'ev-choices';
  mountFoeSlip($('#ev-text'));
  openModal();
  const d = inkWrite($('#ev-text'), text, { immediate: true, step: snappy() ? 6 : 20, cadence: !snappy() });
  const startAt = (snappy() ? 80 : 420) + d * 0.35;
  ev.choices(S).forEach((c, i) => {
    const b = document.createElement('button'); b.className = 'choice'; b.disabled = !!c.disabled;
    b.style.animationDelay = (startAt + i * 120) + 'ms';
    b.innerHTML = `<span></span><small></small>`; b.firstChild.textContent = c.label; b.lastChild.textContent = choiceSub(c, S);
    b.onclick = () => choose(ev, c, b, text, title);
    box.appendChild(b);
  });
}
function appendManualOffer(out, id, extra) {
  const o = Core.manualOffer(S, id);
  if (!o) return;
  const slip = document.createElement('div'); slip.className = 'manual-slip';
  const nextLine = o.cap
    ? '此经已至大成，再读也只是温故。可售予坊市。'
    : `参悟则至第${cn(o.next)}层，行功 ×${o.nextSpd.toFixed(2)}。`;
  slip.innerHTML = `<div class="manual-kicker">重复功法 · ${esc(o.role)}</div>
    <div class="manual-name">《${esc(o.name)}》</div>
    <div class="manual-now">${esc(o.grade)}品 · 现为第${cn(o.lv)}层 · 行功 ×${o.spd.toFixed(2)}</div>
    <div class="manual-next"></div>
    <div class="manual-fade">${o.cap ? '大成之后，只余一桩去处。' : '愈往后，一层比一层淡。不参悟也可收进行囊，日后再定。'}</div>`;
  slip.querySelector('.manual-next').textContent = nextLine;
  out.appendChild(slip);
  const box = document.createElement('div'); box.className = 'ev-choices manual-choices';
  const done = (btn, r) => {
    if (r.err) return toast(r.err);
    if (box.classList.contains('chosen')) return;
    box.classList.add('chosen'); btn.classList.add('picked');
    extra.text = r.text;
    const p = document.createElement('p'); p.className = 'r-text'; p.textContent = r.text;
    const tg = document.createElement('div'); tg.className = 'entry-tags bleed-in';
    tg.innerHTML = (r.tags || []).map(x => `<span class="${x.c || ''}">${esc(x.t)}</span>`).join('');
    out.insertBefore(p, box); out.insertBefore(tg, box);
    render(); save();
    const m = $('.ev-main'); if (m) m.scrollTo({ top: m.scrollHeight, behavior: 'smooth' });
  };
  const mk = (label, sub, dis, fn) => {
    const b = document.createElement('button'); b.className = 'choice'; b.disabled = !!dis;
    b.innerHTML = '<span></span><small></small>';
    b.firstChild.textContent = label; b.lastChild.textContent = sub;
    b.onclick = () => { if (box.classList.contains('chosen')) return; fn(b); };
    box.appendChild(b);
  };
  mk('参悟精进', o.cap ? '已至大成' : `升至第${cn(o.next)}层`, o.cap, b => done(b, Core.studyManual(S, id)));
  mk('售予坊市', `灵石${cn(o.price)}`, false, b => done(b, Core.sellManual(S, id)));
  out.appendChild(box);
}
function choose(ev, c, btn, evText, titleText) {
  const box = $('#ev-choices'); if (box.classList.contains('chosen')) return;
  btn.classList.add('picked'); box.classList.add('chosen');
  const res = Core.resolveChoice(S, c);
  const B = buffer(), fxR = Core.applyFx(S, res.fx || {}, B.emit);
  const tags = [...(res.tags || []), ...(fxR.tags || [])], ups = fxR.ups;
  if (res.fx && res.fx.gf) FX.goldMotes && setTimeout(() => { const t = $('#ev-result').getBoundingClientRect(); FX.goldMotes(t.left + t.width / 2, t.top + 20); }, 900);
  const out = $('#ev-result');
  const p = document.createElement('p'); p.className = 'r-text'; out.appendChild(p);
  const d = inkWrite(p, res.text, { immediate: true, step: 20, cadence: true });
  const tg = document.createElement('div'); tg.className = 'entry-tags'; tg.style.opacity = 0;
  tg.innerHTML = tags.map(x => `<span class="${x.c || ''}">${esc(x.t)}</span>`).join('') || '<span>无事发生</span>';
  out.appendChild(tg);
  const extra = { text: '' };
  if (fxR.manual) appendManualOffer(out, fxR.manual, extra);
  const close = document.createElement('button'); close.className = 'brush-btn small'; close.style.opacity = 0;
  close.innerHTML = '<span class="bb-ink"></span><span class="bb-text">收卷</span>';
  out.appendChild(close);
  setTimeout(() => { tg.style.opacity = ''; tg.classList.add('bleed-in'); close.style.opacity = ''; close.classList.add('bleed-in');
    const m = $('.ev-main'); m.scrollTo({ top: m.scrollHeight, behavior: 'smooth' }); }, Math.min(d, 2200) + 200);
  setTimeout(() => { const m = $('.ev-main'); m.scrollTo({ top: m.scrollHeight, behavior: 'smooth' }); }, 400);
  close.onclick = async () => {
    await closeModal();
    if (S.flags) S.flags.cultRun = 0;
    if (ev.guide) {
      S.flags[ev.id] = 1;
      if (c.skipAll) { GUIDES.forEach(g => { S.flags[g.id] = 1; }); finishGuide(); }
      else if (GUIDES.every(g => S.flags[g.id])) finishGuide();
    }
    pushLog({ title: titleText || evTitle(ev), text: `${c.label.replace(/[“”]/g, '')}——${res.text}${extra.text ? ' ' + extra.text : ''}`, tags, cls: ev.xinmo ? 'warn' : 'event', div: true, guide: !!ev.guide });
    B.flush(); Core.afterGain(S, ups, pushLog);
    render(); save(); checkEnd();
    if (!ev.guide) maybeGuide();
    if (res.after && !S.dead) res.after();
    if (res.afterBreak && !S.dead && !S.ascended && bottleneck()) setTimeout(() => { if (!uiBlocked()) openBreak(); }, 280);
  };
  render(); save();
}

/* ================= 破境 ================= */
if (typeof BtFx !== 'undefined') BtFx.setWriter((el, text) => inkWrite(el, text, { immediate: true, step: FX.reduced() ? 8 : 55 }));

const btChance = usePill => Core.btChance(S, usePill);
const chanceWord = p => { const n = Math.round(p * 10); return n <= 1 ? '九死一生' : n >= 9 ? '十拿九稳' : `约莫${cn(n)}成`; };
function openBreak() {
  if (!bottleneck() || busy) return;
  if (typeof Life !== 'undefined' && Life.xinmoPending(S) && !openBreak._skip) {
    openEvent(Life.xinmoEvent(S));
    return;
  }
  openBreak._skip = false;
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
  const d = inkWrite($('#ev-text'), t, { immediate: true, step: 20, cadence: true });
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
  const bt = $('#bt');
  const meta = (typeof BtFx !== 'undefined') ? BtFx.prepare(bt, from, ok) : null;
  bt.hidden = false;
  const lines = $('#bt-lines'), a = $('#bt-a'), b = $('#bt-b'), txt = $('#bt-text'), close = $('#bt-close');
  lines.innerHTML = ''; txt.textContent = ''; close.hidden = true; close.classList.remove('bleed-in');
  const target = NEXT_REALM_NAME[from];
  a.textContent = b.textContent = target;
  if (!meta) $('#bt-stamp-t').textContent = ok ? '成' : '败';
  await sleep(30); bt.classList.add('go');
  // 墨染入场：渡劫更慢更沉，筑基略轻
  const spreadDur = from === 4 ? 3200 : from === 0 ? 2000 : 2600;
  if (InkGL.spreadOk && !FX.reduced()) {
    const cv = $('#inkfx'); cv.classList.remove('fade');
    const ink = $('#bt-ink');
    bt.insertBefore(cv, ink || bt.firstChild); bt.classList.add('gl');
    InkGL.spread({ mode: 1, y: innerHeight * (from === 4 ? .36 : .44), from: 0, to: 1.08, dur: spreadDur, ease: 'inOut', scale: .5, z: 'auto' });
  }
  await sleep(FX.reduced() ? 80 : (from === 4 ? 1200 : 900));
  if (typeof BtFx !== 'undefined') await BtFx.chargePhase(bt, from, usePill, r.pill);
  else {
    const l1 = document.createElement('div'); lines.appendChild(l1);
    inkWrite(l1, usePill ? `服下${r.pill}，凝神静气` : '凝神静气，抱元守一', { immediate: true, step: 60 });
    await sleep(1100); bt.classList.add('charge');
    const l2 = document.createElement('div'); lines.appendChild(l2);
    inkWrite(l2, from === 4 ? '劫云压顶……' : '引天地灵气，冲击瓶颈……', { immediate: true, step: 70 });
    await sleep(1900); bt.classList.remove('charge');
  }
  if (typeof BtFx !== 'undefined') await BtFx.revealPhase(bt, from, ok);
  else {
    bt.classList.add('reveal');
    if (ok) {
      await sleep(500); bt.classList.add('glory', 'weight');
      if (typeof MoAudio !== 'undefined') { MoAudio.play('splash'); MoAudio.play('gold'); }
      await sleep(760);
    } else await sleep(1300);
    if (!ok) {
      if (typeof MoAudio !== 'undefined') MoAudio.play('fail');
      bt.classList.add('fail', 'crack', 'shake'); await sleep(500);
    }
  }
  if (!snappy()) { bt.classList.add('pomo'); await sleep(780); }
  if (typeof MoAudio !== 'undefined') MoAudio.play('stamp');
  bt.classList.add('stamped');
  await sleep(FX.reduced() ? 80 : 480);
  const logText = res.text;
  if (res.ending) bt.classList.add('end-' + res.ending);
  inkWrite(txt, logText, { immediate: true, step: 26 });
  save();
  await sleep(FX.reduced() ? 200 : 1500);
  close.hidden = false; close.classList.add('bleed-in');
  close.onclick = async () => {
    bt.classList.add('leave'); await sleep(900); bt.hidden = true; bt.className = 'bt';
    if (typeof BtFx !== 'undefined') BtFx.clearStage();
    const cv = $('#inkfx'); if (cv.parentNode === bt) { InkGL.hide(); document.body.insertBefore(cv, $('#grain')); }
    const ttl = ok ? (from === 4 ? '渡劫飞升' : `破境 · ${NEXT_REALM_NAME[from]}`) : { bingjie: '兵解', yunluo: '身殒', rumo: '入魔' }[res.ending] || '破境未果';
    pushLog({ title: ttl, text: logText, cls: ok ? 'gold' : 'warn', div: true });
    B.flush(); render(); save();
    if (ok && res.needPath) {
      await openPathCeremony(res.needPath, !!res.pendingAscend);
      busy = false; render(); save();
      if (S.ascended) setTimeout(() => showEnd('ascend'), 1600); else checkEnd();
      maybeFabaoCeremony();
    } else {
      busy = false;
      if (S.ascended) setTimeout(() => showEnd('ascend'), 1600); else checkEnd();
      maybeFabaoCeremony();
    }
  };
}

/* ================= 定型仪式 ================= */
const PATH_LEAD = {
  daoji: '筑基已成。丹田之中，一道虚影未定——此乃道基。一经落成，难再更易。择其一路，定下此后百年的修行之趋。',
  danwen: '金丹凝成，丹面尚白。可刻一至二道丹纹。纹成之后，若要洗去，需以极重代价。',
  faxiang: '元婴化形。识海之中，一尊法相将成。法相一定，斗法招式与机缘皆随之偏转。',
  wendao: '化神之际，你站在天地之间。可问天、问心、或问地——一问即可。',
  jiewen: '劫云将散。这一道烙在识海上的劫纹，将随你飞升而去。',
};

async function maybeFabaoCeremony() {
  if (typeof FabaoArt === 'undefined' || !FabaoArt.flushIfAny) return;
  await FabaoArt.flushIfAny();
}
function renderPathSeals() {
  const el = $('#path-seals'); if (!el || !S) return;
  const list = Core.pathSummary(S) || [];
  if (!list.length) { el.innerHTML = ''; el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = list.map(x => `<span class="path-seal" data-k="${x.k}" title="${esc(x.name)}"><i>${esc(x.seal)}</i><b>${esc(x.name)}</b></span>`).join('');
}
function pathPage() {
  const wrap = document.createElement('div'); wrap.className = 'path-page';
  const list = Core.pathSummary(S) || [];
  if (!list.length) {
    wrap.innerHTML = `<div class="path-empty"><span class="path-empty-seal">空</span><p>道基未定。破境筑基之时，自有虚影落于丹田——那时，再择。</p><p class="path-empty-hint">金丹刻纹、元婴法相、化神问道、渡劫劫纹，亦各有一择。</p></div>`;
    return wrap;
  }
  wrap.innerHTML = list.map(x => {
    let o = null;
    if (x.k === 'danwen') { const oid = (S.path.danwen || []).find(i => DANWEN[i] && DANWEN[i].seal === x.seal); o = DANWEN[oid]; }
    else o = PATH_TABLE[x.k][S.path[x.k]];
    return `<div class="path-card"><span class="path-card-seal">${esc(x.seal)}</span><div><b>${esc(PATH_KIND[x.k].name)} · ${esc(x.name)}</b><p>${esc(o ? o.trait : '')}</p><small>${esc(o ? o.desc : '')}</small></div></div>`;
  }).join('');
  const washBox = document.createElement('div'); washBox.className = 'path-wash';
  const bits = [];
  if (S.path && S.path.danwen && S.path.danwen.length) {
    const c = Core.pathWashCost(S, 'danwen');
    bits.push(`<button type="button" class="path-wash-btn" data-w="danwen">洗去丹纹<small>灵石 ${fmtNum(c.ls)} · 寿 −${c.life} · 心境 −${c.xj}</small></button>`);
  }
  if (S.path && S.path.daoji) {
    const c = Core.pathWashCost(S, 'daoji');
    bits.push(`<button type="button" class="path-wash-btn danger" data-w="daoji">震散道基<small>灵石 ${fmtNum(c.ls)} · 寿 −${c.life} · 心境 −${c.xj} · 近乎自毁</small></button>`);
  }
  if (S.path && S.path.faxiang) {
    const c = Core.pathWashCost(S, 'faxiang');
    const half = S.flags && S.flags.xiang_wash_half;
    bits.push(`<button type="button" class="path-wash-btn" data-w="faxiang">洗去法相<small>${half ? '相裂半价 · ' : ''}灵石 ${fmtNum(c.ls)} · 寿 −${c.life} · 心境 −${c.xj}</small></button>`);
  }
  if (S.path && S.path.wendao) {
    const c = Core.pathWashCost(S, 'wendao');
    bits.push(`<button type="button" class="path-wash-btn" data-w="wendao">洗去问道<small>灵石 ${fmtNum(c.ls)} · 寿 −${c.life} · 心境 −${c.xj}</small></button>`);
  }
  if (S.path && S.path.jiewen && !S.ascended) {
    const c = Core.pathWashCost(S, 'jiewen');
    bits.push(`<button type="button" class="path-wash-btn danger" data-w="jiewen">磨去劫纹<small>灵石 ${fmtNum(c.ls)} · 寿 −${c.life} · 心境 −${c.xj} · 飞升前可另择</small></button>`);
  }
  if (bits.length) {
    washBox.innerHTML = `<p class="path-wash-note">定型可洗，代价极重。洗后须重新择定。法相／问道／劫纹（飞升前）皆可洗；若逢「相裂」，洗相代价略减。</p>${bits.join('')}`;
    washBox.onclick = async e => {
      const b = e.target.closest('[data-w]'); if (!b) return;
      const kind = b.dataset.w;
      const title = ({ danwen: '洗去丹纹？纹成难易，此举耗寿伤神。', faxiang: '洗去法相？识海空明一阵，须待机缘再凝。', wendao: '洗去问道？天地之间那一问将被拔出，须得再问。', jiewen: '磨去劫纹？雷痕将淡，渡劫飞升前尚可另择一纹。', daoji: '震散道基？百年倾向尽废，寻常修士视为自毁。' })[kind];
      const conf = ({ danwen: '洗纹', faxiang: '洗相', wendao: '洗问', jiewen: '洗劫', daoji: '易基' })[kind];
      if (!(await inkConfirm(title, conf, true))) return;
      const r = Core.washPath(S, kind, pushLog);
      if (r.err) { toast(r.err); return; }
      save(); render();
      await closeSheet();
      await ensurePendingPath();
    };
    wrap.appendChild(washBox);
  }
  return wrap;
}
let pathCerGen = 0;
async function openPathCeremony(kind, pendingAscend) {
  const meta = PATH_KIND[kind], tab = PATH_TABLE[kind];
  if (!meta || !tab) return;
  const pc = $('#path-cer'); if (!pc) return;
  const gen = ++pathCerGen;
  busy = true;
  pc.hidden = false; pc.className = 'path-cer go kind-' + kind;
  $('#path-cer-seal').textContent = meta.seal;
  $('#path-cer-title').textContent = meta.name;
  $('#path-cer-lead').textContent = '';
  const opts = $('#path-cer-opts'); opts.innerHTML = ''; opts.className = 'path-cer-opts';
  const foot = $('#path-cer-foot'); foot.hidden = false;
  const confBtn = $('#path-cer-confirm');
  const confLab = confBtn.querySelector('.bb-text') || confBtn;
  const hint = $('#path-cer-hint');
  $('#path-cer-prose').textContent = '';
  inkWrite($('#path-cer-lead'), PATH_LEAD[kind] || '', { immediate: true, step: 22 });
  await sleep(400);
  const selected = new Set();
  const max = meta.max, pickN = meta.pick;
  const syncFoot = () => {
    const n = selected.size;
    const ready = n >= pickN;
    foot.hidden = false;
    confBtn.disabled = !ready;
    confBtn.classList.toggle('dim', !ready);
    confLab.textContent = ready ? (meta.irrev ? '落定 · 难再更易' : '落定') : (max > 1 ? `再择（已选${cn(n)}）` : '落定');
    if (hint) {
      if (!n) hint.textContent = '点选一路，再落定';
      else if (!ready) hint.textContent = max > 1 ? `可多选至${cn(max)}道，至少${cn(pickN)}道` : '点下方落定';
      else hint.textContent = meta.irrev ? '落定后难再更易 · Enter 亦可' : '确认后落定 · Enter 亦可';
    }
  };
  const ids = Object.keys(tab);
  ids.forEach((id, i) => {
    const o = tab[id];
    const b = document.createElement('button');
    const mem = (kind === 'daoji' && S.flags && S.flags.daojiMem === id) || (kind === 'faxiang' && S.flags && S.flags.faxiangMem === id);
    b.className = 'path-opt' + (mem ? ' mem' : ''); b.style.animationDelay = (180 + i * 90) + 'ms';
    b.type = 'button';
    const memTag = mem ? '<i class="po-mem">残忆</i>' : '';
    b.innerHTML = `<span class="po-seal">${esc(o.seal)}</span><div class="po-body"><b>${esc(o.name)}${memTag}</b><em>${esc(o.trait)}</em><p></p></div>`;
    b.querySelector('p').textContent = o.desc;
    b.onclick = () => {
      if (opts.classList.contains('locked')) return;
      if (max === 1) {
        selected.clear();
        opts.querySelectorAll('.path-opt').forEach(x => x.classList.remove('on'));
        selected.add(id); b.classList.add('on');
      } else {
        if (selected.has(id)) { selected.delete(id); b.classList.remove('on'); }
        else if (selected.size < max) { selected.add(id); b.classList.add('on'); }
        else { toast(`至多${cn(max)}道`); return; }
      }
      syncFoot();
    };
    opts.appendChild(b);
  });
  syncFoot();
  await new Promise(resolve => {
    confBtn.onclick = async () => {
      if (selected.size < pickN || opts.classList.contains('locked') || confBtn.disabled) return;
      opts.classList.add('locked');
      const list = [...selected];
      const B = buffer();
      const r = Core.choosePath(S, kind, list, B.emit);
      if (r.err) { toast(r.err); opts.classList.remove('locked'); return; }
      save();
      foot.hidden = true;
      const prose = $('#path-cer-prose');
      pc.classList.add('sealed');
      if (typeof MoAudio !== 'undefined') { MoAudio.play('stamp'); MoAudio.play('gold'); }
      inkWrite(prose, r.text || '', { immediate: true, step: 28 });
      B.flush();
      await sleep(2200);
      if (gen !== pathCerGen) { resolve(); return; }
      pc.classList.add('leave'); await sleep(800);
      if (gen !== pathCerGen) { resolve(); return; }
      pc.hidden = true; pc.className = 'path-cer';
      if (pendingAscend) Core.finishAscend(S, pushLog);
      pushLog({ title: meta.name + ' · ' + r.names, text: r.text, tags: r.tags, cls: 'gold', div: true });
      resolve();
    };
  });
}
async function ensurePendingPath() {
  if (!S || S.dead || S.ascended) return;
  let guard = 0;
  while (guard++ < 5) {
    if (busy) return;
    const k = Core.pendingPath(S);
    if (!k) break;
    await openPathCeremony(k, false);
    busy = false; render(); save();
  }
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
    <div class="dabi-line">${r <= 3 ? `下届${o.dabi} · 约${cn(Math.max(1, Math.ceil((sc.dabiAt - S.months) / 12)))}年后` : `${o.dabi} · 你已列席观礼`}${sc.dabiBest >= 0 ? `<br>最佳名次 · ${DABI_PLACE[sc.dabiBest]}` : ''}</div>
    <button type="button" class="defect-btn" id="btn-defect">叛宗<small>解牌下山 · 代价极重</small></button>`;
  const pb = w.querySelector('.promo-btn');
  if (pb) pb.onclick = async () => { if (!Core.canPromote(S).ok) return; await closeSheet(); const res = Core.promote(S, pushLog); if (res) runRite(res); };
  const db = w.querySelector('#btn-defect');
  if (db) db.onclick = async () => {
    const cost = (() => { try { const lsS = REALMS[S.realm].lsScale; return Math.round(800 * lsS); } catch (e) { return 800; } })();
    if (!(await inkConfirm(`叛出${o.name}？需灵石约${fmtNum(cost)}，并折寿伤神。此后为逍遥散修。`, '叛宗', true))) return;
    const res = Core.defect(S, pushLog);
    if (res.err) { toast(res.err); return; }
    await closeSheet(); render(); save();
  };
  return w;
}
function sectTasks() {
  const w = document.createElement('div'); w.className = 'tasks';
  const ms = Core.ensureMissions(S); save();
  if (!ms.length) { w.innerHTML = '<div class="empty">执事堂案上暂无新令<br><small>约三年一换，不妨先闭关或出山</small></div>'; return w; }
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
    text: () => {
      const roster = Core.dabiRoster(S);
      S.evFoeMeta = { roster };
      const who = roster.map(r => `${r.name}（${r.read}）`).join('、');
      const head = {
        qm: `${o.dabi}，${cn(K.dabiYears * R().T)}年一度。演武台上的青石被扫得发亮，八名弟子的名牌挂在台前，其中一块，写着你的名字。台下人山人海，执事堂的老执事敲了三下铜锣。`,
        dx: `${o.dabi}开炉。丹坪上的青石被扫净，炉烟压得很低。名牌挂在台前，其中一块写着你的名字。`,
        yy: `${o.dabi}。影坪无灯，名牌却自己浮出来，其中一块是你的。`,
        xj: `${o.dabi}。演机坪的铜铃响了三声，名牌按机纹排开，有一块写着你的名字。`,
        sx: `${o.dabi}开擂。坊市里的赌档早早开了盘口，木牌上你的名字排在前列。`,
      }[o.id] || `${o.dabi}将启。名牌上有你的名字。`;
      return `${head}这一回签上的对手，是${who}。`;
    },
    choices: () => [
      { label: '登台', sub: '三战定名次', act: () => ({ text: '你整了整衣袍，一步步走上演武台。台下的喧哗声，忽然都远了。', fx: {}, after: startDabi }) },
      { label: '托病不出', sub: '贡献 · 心境稍减', act: s => { s.sect.dabiDue = false; s._dabiBracket = null; return { text: '你递了一张告假条。那块写着你名字的名牌，被执事默默摘了下来。', fx: { gx: -2, xj: -2 } }; } },
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
          await sleep(500);
          if (typeof MoAudio !== 'undefined') MoAudio.play(d.over === 'win' ? 'stamp' : 'fail');
          $('#duel-stamp').classList.add('on');
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
  if (typeof MoAudio !== 'undefined') MoAudio.play('clash');
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
function refreshOpenPanel() {
  const root = $('#sheet-body') && $('#sheet-body').firstElementChild;
  if (root && typeof root._refresh === 'function') root._refresh();
}
function openBag(tab = 'bag') {
  // 行囊：只装消耗品与佩器；功法／法宝／定型／丹炉改走「修」印 openCult
  if (tab && tab !== 'bag') return openCult(tab);
  const wrap = document.createElement('div'); wrap.className = 'bag-wrap';
  wrap.innerHTML = '<div class="bag-lead">丹药 · 佩器 · 杂物<span>服用后不关卷</span></div><div class="tab-body bag-body"></div>';
  const body = wrap.querySelector('.tab-body');
  const show = () => {
    $('#sheet-title').textContent = '行囊';
    body.innerHTML = '';
    body.appendChild(bagPage());
    body.classList.remove('tab-in'); void body.offsetWidth; body.classList.add('tab-in');
  };
  wrap._refresh = show;
  openSheet('行囊', wrap);
  show();
}
function openCult(tab = 'gf') {
  const wrap = document.createElement('div'); wrap.className = 'cult-wrap';
  const hasDan = typeof JHUI !== 'undefined' && S && S.dan;
  const tabs = [['gf', '功法'], ['fabao', '法宝'], ['path', '定型']];
  if (hasDan) tabs.push(['dan', '丹炉']);
  wrap.innerHTML = `<div class="sheet-tabs">${tabs.map((t, i) => `${i ? '<i class="stab-dot"></i>' : ''}<button class="stab" data-t="${t[0]}">${t[1]}</button>`).join('')}</div><div class="tab-body"></div>`;
  const body = wrap.querySelector('.tab-body');
  const TT = { gf: '功法', dan: '丹炉', fabao: '法宝', path: '定型' };
  let cur = tabs.some(t => t[0] === tab) ? tab : 'gf';
  const show = t => {
    cur = t;
    wrap.querySelectorAll('.stab').forEach(b => b.classList.toggle('on', b.dataset.t === t));
    $('#sheet-title').textContent = TT[t] || '修持';
    body.innerHTML = '';
    body.appendChild(t === 'gf' ? gfPage() : t === 'dan' ? JHUI.danPage() : t === 'fabao' ? fabaoPage() : pathPage());
    body.classList.remove('tab-in'); void body.offsetWidth; body.classList.add('tab-in');
  };
  wrap._refresh = () => show(cur);
  wrap.querySelector('.sheet-tabs').onclick = e => { const b = e.target.closest('.stab'); if (b) show(b.dataset.t); };
  openSheet(TT[cur] || '修持', wrap);
  show(cur);
}
function bagPage() {
  const wrap = document.createElement('div'); wrap.className = 'bag-list';
  if (S.eq && S.eq.weapon) {
    const eq = document.createElement('div'); eq.className = 'item eq-row';
    const gg = GEAR[S.eq.weapon];
    eq.innerHTML = `<div class="item-info"><div class="item-name">佩身 · ${S.eq.weapon}<em>${gg ? gg.kind : '器'}</em></div><div class="item-desc"></div></div>
      <div class="item-acts"><button class="item-use" data-act="uneq">卸下</button></div>`;
    eq.querySelector('.item-desc').textContent = gg ? gg.desc : '';
    eq.querySelector('[data-act=uneq]').onclick = () => {
      const r = Core.unequip(S); if (r.err) return toast(r.err);
      pushLog({ text: r.text, tags: r.tags, cls: 'sys' }); render(); save(); refreshOpenPanel();
    };
    wrap.appendChild(eq);
  }
  const keys = Object.keys(S.items).filter(k => S.items[k] > 0);
  if (!keys.length && !(S.eq && S.eq.weapon)) {
    wrap.insertAdjacentHTML('beforeend', '<div class="empty">行囊空空，唯有清风两袖</div>');
  }
  keys.forEach(k => {
    const it = document.createElement('div'); it.className = 'item';
    const mid = Core.manualId ? Core.manualId(k) : null;
    if (mid) {
      const off = Core.manualOffer(S, mid);
      if (!off) return;
      it.innerHTML = `<div class="item-info"><div class="item-name"></div><div class="item-desc"></div></div><div class="item-acts"></div>`;
      const acts = it.querySelector('.item-acts');
      it.querySelector('.item-name').innerHTML = `《${esc(off.name)}》<em>×${S.items[k]}</em><em class="gear-k">${esc(off.grade)}品</em>`;
      it.querySelector('.item-desc').textContent = off.cap
        ? `《${off.name}》已至大成。可售予坊市，换灵石${cn(off.price)}。`
        : `胸中已有此法，${off.role}第${cn(off.lv)}层。参悟可升至第${cn(off.next)}层，行功自 ×${off.spd.toFixed(2)} 至 ×${off.nextSpd.toFixed(2)}。售予坊市可得灵石${cn(off.price)}。`;
      const bStudy = document.createElement('button'); bStudy.className = 'item-use'; bStudy.textContent = '参悟精进'; bStudy.disabled = !!off.cap;
      bStudy.onclick = () => {
        const r = Core.studyManual(S, mid); if (r.err) return toast(r.err);
        pushLog({ text: r.text, tags: r.tags, cls: 'gold' }); render(); save(); refreshOpenPanel();
      };
      const bSell = document.createElement('button'); bSell.className = 'item-use light'; bSell.textContent = '售予坊市';
      bSell.onclick = () => {
        const r = Core.sellManual(S, mid); if (r.err) return toast(r.err);
        pushLog({ text: r.text, tags: r.tags, cls: 'sys' }); render(); save(); refreshOpenPanel();
      };
      acts.appendChild(bStudy); acts.appendChild(bSell);
      wrap.appendChild(it);
      return;
    }
    const isG = typeof GEAR !== 'undefined' && GEAR[k];
    const canUse = !!(PILLS[k] && PILLS[k].use) || (k === '延寿丹' || k === '破障丹');
    it.innerHTML = `<div class="item-info"><div class="item-name"></div><div class="item-desc"></div></div><div class="item-acts"></div>`;
    it.querySelector('.item-name').innerHTML = `${k}<em>×${S.items[k]}</em>${isG ? `<em class="gear-k">${GEAR[k].kind}</em>` : ''}`;
    it.querySelector('.item-desc').textContent = isG ? GEAR[k].desc : (PILLS[k] ? PILLS[k].desc : (k === '延寿丹' ? '延年益寿，略补寿元。' : k === '破障丹' ? '破障开经，助破瓶颈或增益修为。' : ''));
    const acts = it.querySelector('.item-acts');
    if (canUse) {
      const cap = Core.useBatchCap ? Core.useBatchCap(S, k) : Math.min(5, S.items[k] | 0);
      const mk = (lab, n, cls) => {
        const b = document.createElement('button'); b.className = 'item-use' + (cls ? ' ' + cls : ''); b.textContent = lab;
        b.disabled = cap <= 0 || (n > 1 && (S.items[k] | 0) < 2);
        if (n > 1 && n > cap) b.disabled = true;
        b.onclick = () => {
          const r = useItem(k, n);
          if (r) { toast(n > 1 ? `已服 ×${r.used || n}` : '已服用'); refreshOpenPanel(); }
        };
        return b;
      };
      acts.appendChild(mk('服', 1));
      if ((S.items[k] | 0) >= 2 && cap >= 2) {
        const n5 = Math.min(5, cap, S.items[k] | 0);
        if (n5 >= 2) acts.appendChild(mk('×' + n5, n5, 'batch'));
      }
      if ((S.items[k] | 0) > 1 && cap > 1) {
        const nAll = Math.min(cap, S.items[k] | 0);
        if (nAll >= 2) acts.appendChild(mk('尽', nAll, 'batch all'));
      }
      if (cap <= 0) {
        const tip = document.createElement('span'); tip.className = 'item-cap-tip';
        tip.textContent = k === '回春丹' ? '无伤' : k === '清心丹' ? '心境已满' : k === '聚气丹' ? '瓶颈无益' : '暂不可服';
        acts.appendChild(tip);
      }
    } else if (isG) {
      const b = document.createElement('button'); b.className = 'item-use'; b.textContent = '佩戴';
      b.onclick = () => {
        const r = Core.equip(S, k); if (r.err) return toast(r.err);
        pushLog({ text: r.text, tags: r.tags, cls: r.tags.some(t => t.c === 'down') ? 'warn' : 'sys' });
        render(); save(); refreshOpenPanel();
      };
      acts.appendChild(b);
    }
    wrap.appendChild(it);
  });
  if (typeof SHENQI_ZHI !== 'undefined') {
    const zhi = document.createElement('div'); zhi.className = 'shenqi-zhi';
    const rows = SHENQI_ZHI.map(z => {
      const known = (S.flags && S.flags[z.flag]) || (S.items && S.items[z.name]) || (S.eq && S.eq.weapon === z.name);
      return `<div class="sq-row ${known ? 'on' : 'off'}"><span class="sq-seal">${known ? esc(z.seal) : '？'}</span><div><b>${known ? esc(z.name) : '□□□□'}</b><p>${known ? esc(z.blurb) : '机缘未至，名录空阙。'}</p></div></div>`;
    }).join('');
    zhi.innerHTML = `<div class="sq-h"><span>神器志</span><em>奇遇见过或持有后解锁</em></div>${rows}`;
    wrap.appendChild(zhi);
  }
  return wrap;
}

const layerDots = lv => Array.from({ length: GF_LAYERS }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('');
const gfElWord = (id) => { const g = GONGFA[id]; return (g.el ? (g.el === '五行' ? '五行' : g.el + '行') : '无属') + ' · ' + Core.gfMatchWord(S, id); };
function gfPage() {
  const wrap = document.createElement('div'); wrap.className = 'gf-page';
  // 主修
  const mainBox = document.createElement('div'); mainBox.className = 'gf-block';
  mainBox.innerHTML = '<div class="gf-list-h"><span>主修</span><em>一门</em></div>';
  wrap.appendChild(mainBox);
  if (!S.gf) {
    mainBox.insertAdjacentHTML('beforeend', `<div class="gf-scroll gf-none"><div class="gf-vname">${[...'无法可依'].map(c => `<i>${c}</i>`).join('')}</div>
      <div class="gf-info"><p class="gf-desc">胸中尚无一部功法。你只凭本能吐纳，像在夜里摸索山路——走得动，却走不快。</p>
      <div class="gf-speed">行功之速 <b>×${K.noGf.toFixed(2)}</b></div><div class="gf-src">游历、宗门、坊市，皆可遇得功法。</div></div></div>`);
  } else {
    const g0 = GONGFA[S.gf], e = S.gfs[S.gf];
    const card = document.createElement('div'); card.className = 'gf-scroll g' + g0.grade + (g0.mo ? ' mo' : '') + ' main';
    card.innerHTML = `<div class="gf-vname">${[...g0.name].map(c => `<i>${c}</i>`).join('')}</div>
      <div class="gf-info">
        <div class="gf-meta"><span class="gf-seal">${GF_GRADE[g0.grade]}</span><span class="gf-el">${gfElWord(S.gf)}</span><span class="gf-role">主修</span></div>
        <div class="gf-layers">${layerDots(e.lv)}<em>${e.lv >= GF_LAYERS ? '大成' : '第' + cn(e.lv) + '层'}</em></div>
        <div class="gf-speed">行功之速 <b>×${Core.gfSpeed(S).toFixed(2)}</b></div>
        ${e.lv > 1 ? `<div class="gf-deep">第${cn(e.lv)}层。层数愈高，每一层加进行功的分量愈淡。</div>` : ''}
        <div class="gf-trait">${g0.trait}</div>
        <p class="gf-desc"></p>
        <div class="gf-src">得自 · ${g0.src}</div>
      </div>`;
    card.querySelector('.gf-desc').textContent = g0.desc;
    mainBox.appendChild(card);
  }
  // 辅修
  const auxBox = document.createElement('div'); auxBox.className = 'gf-block';
  const aux = S.aux || [];
  auxBox.innerHTML = `<div class="gf-list-h"><span>辅修</span><em>${cn(aux.length)}/${cn(typeof AUX_MAX !== 'undefined' ? AUX_MAX : 2)} · 只取其意</em></div>`;
  wrap.appendChild(auxBox);
  if (!aux.length) {
    const em = document.createElement('div'); em.className = 'empty small'; em.textContent = '尚未辅修 · 可自胸中所藏择一两门温养'; auxBox.appendChild(em);
  } else aux.forEach(id => {
    const g0 = GONGFA[id], e = S.gfs[id];
    const row = document.createElement('div'); row.className = 'gf-row aux g' + g0.grade;
    row.innerHTML = `<span class="gf-seal">${GF_GRADE[g0.grade]}</span>
      <div class="gf-row-info"><div class="gf-row-name">${g0.name}<em>辅 · ${e.lv >= GF_LAYERS ? '大成' : cn(e.lv) + '层'}</em></div>
      <div class="gf-row-sub">${gfElWord(id)} · ${g0.trait}</div></div>
      <button class="item-use">卸下</button>`;
    row.querySelector('button').onclick = () => {
      const r = Core.clearAux(S, id);
      pushLog({ text: r.text, tags: r.tags, cls: 'sys' }); render(); save(); refreshOpenPanel();
    };
    auxBox.appendChild(row);
  });
  // 所藏
  const others = Object.keys(S.gfs).filter(id => id !== S.gf);
  const h = document.createElement('div'); h.className = 'gf-list-h'; h.innerHTML = `<span>胸中所藏</span><em>${cn(Object.keys(S.gfs).length)}部</em>`;
  wrap.appendChild(h);
  if (!others.length) { const em = document.createElement('div'); em.className = 'empty small'; em.textContent = '别无他法 · 机缘未至'; wrap.appendChild(em); }
  others.sort((a, b) => GONGFA[b].grade - GONGFA[a].grade).forEach(id => {
    const g0 = GONGFA[id], e = S.gfs[id], isAux = aux.includes(id);
    const row = document.createElement('div'); row.className = 'gf-row g' + g0.grade + (g0.mo ? ' mo' : '');
    row.innerHTML = `<span class="gf-seal">${GF_GRADE[g0.grade]}</span>
      <div class="gf-row-info"><div class="gf-row-name">${g0.name}<em>${e.lv >= GF_LAYERS ? '大成' : cn(e.lv) + '层'}</em></div>
      <div class="gf-row-sub">${gfElWord(id)} · ×${Core.gfSpeed(S, id).toFixed(2)}</div><div class="gf-row-trait">${g0.trait}</div>
      <div class="gf-cost">${(c => `散功转修：${c.lose ? `修为 −${fmtNum(c.lose)} · ` : ''}心境 −${c.xj} · 耗时${cnDur(c.months + c.extra)}${c.extra ? `（修为不足，以${cnDur(c.extra)}苦功补足）` : ''}${c.layer ? ` · 《${GONGFA[S.gf].name}》跌一层` : ''}`)(Core.switchCost(S, id))}</div></div>
      <div class="gf-acts"></div>`;
    const acts = row.querySelector('.gf-acts');
    const bMain = document.createElement('button'); bMain.className = 'item-use'; bMain.textContent = '转修';
    bMain.onclick = async () => {
      if (!row.classList.contains('confirm')) { wrap.querySelectorAll('.gf-row.confirm').forEach(r => { r.classList.remove('confirm'); const bb = r.querySelector('.item-use'); if (bb && bb.textContent === '确定') bb.textContent = '转修'; }); row.classList.add('confirm'); bMain.textContent = '确定'; return; }
      await closeSheet();
      Core.switchGf(S, id, pushLog); render(); save(); checkEnd();
    };
    acts.appendChild(bMain);
    if (!isAux && aux.length < (typeof AUX_MAX !== 'undefined' ? AUX_MAX : 2)) {
      const bAux = document.createElement('button'); bAux.className = 'item-use light'; bAux.textContent = '辅修';
      bAux.onclick = () => {
        const r = Core.setAux(S, id); if (r.err) return toast(r.err);
        pushLog({ text: r.text, tags: r.tags, cls: 'sys' }); render(); save(); refreshOpenPanel();
      };
      acts.appendChild(bAux);
    }
    wrap.appendChild(row);
  });
  return wrap;
}
function fabaoPage() {
  const wrap = document.createElement('div'); wrap.className = 'fabao-page';
  if (!S.fabao) {
    wrap.innerHTML = `<div class="fabao-scroll empty-fabao">
      <div class="fabao-seal">空</div>
      <p class="fabao-title">本命未认</p>
      <p class="fabao-flavor">器随人走，人未至，器不来。破境筑基之后，自有一物落于识海——与你灵根相应，与你主修相系。</p>
      <p class="fabao-hint">筑基成功时认主 · 吐纳／闭关／游历／破境可祭炼<br>器基道基者，祭炼倍加亲近</p>
    </div>`;
    if (S.flags && S.flags.fabaoCanhun) wrap.insertAdjacentHTML('beforeend', '<p class="fabao-canhun">残魂未散 · 来世或可重光</p>');
    return wrap;
  }
  const f = S.fabao, st = f.stage | 0, need = typeof FABAO_NEED !== 'undefined' ? FABAO_NEED : [0, 10, 28, 64];
  const next = st < 3 ? need[st + 1] : null;
  const bonus = (typeof FABAO_BONUS !== 'undefined' ? FABAO_BONUS[st] : {}) || {};
  const traits = [];
  if (bonus.bt) traits.push('破境 +' + Math.round(bonus.bt * 100) + '%');
  if (bonus.spd) traits.push('行功 ×' + bonus.spd.toFixed(2));
  if (bonus.life) traits.push('寿元 +' + Math.round(bonus.life * 100) + '%');
  if (bonus.qiyu) traits.push('机缘略增');
  const card = document.createElement('div'); card.className = 'fabao-scroll stage-' + st;
  card.innerHTML = `
    <div class="fabao-head"><span class="fabao-seal">${f.seal || '器'}</span>
      <div><b class="fabao-name">${f.name}</b><span class="fabao-stage">${typeof FABAO_STAGE !== 'undefined' ? FABAO_STAGE[st] : ''}</span></div></div>
    <p class="fabao-flavor"></p>
    <div class="fabao-bond"><span>祭炼</span><span class="fb-track"><i style="width:${next ? Math.min(100, f.bond / next * 100) : 100}%"></i></span>
      <em>${next ? cn(f.bond) + ' / ' + cn(next) : '化形已成'}</em></div>
    <div class="fabao-traits">${traits.length ? traits.map(t => '<span>' + t + '</span>').join('') : '<span>认主之初，灵性尚浅</span>'}</div>
    <div class="fabao-meta">系于 · ${f.el || '无属'}灵根${f.gfId && GONGFA[f.gfId] ? ' · 《' + GONGFA[f.gfId].name + '》' : ''}</div>`;
  card.querySelector('.fabao-flavor').textContent = f.flavor || '';
  wrap.appendChild(card);
  if (typeof FabaoArt !== 'undefined' && FabaoArt.mountCard) FabaoArt.mountCard(card, f);
  wrap.insertAdjacentHTML('beforeend', `<p class="fabao-note">转主修或身死，或留残魂供来世再聚。法宝不入行囊，只在识海。祭炼进阶时，识海自有开光／化形之礼。</p>`);
  return wrap;
}
function useItem(k, n) {
  const o = Core.useItem(S, k, n);
  if (o.err) { toast(o.err); return null; }
  pushLog({ text: o.text, tags: o.tags, cls: 'sys' }); Core.afterGain(S, o.ups, pushLog); render(); save(); checkEnd();
  return o;
}
function openMenu() {
  const w = document.createElement('div'); w.className = 'menu-list';
  const ps = (Core.pathSummary(S) || []).map(x => x.name).join(' · ') || '道基未定';
  const ds = (typeof Samsara !== 'undefined') ? Samsara.dailyStatus() : { claimed: true };
  const trialNote = (S.flags && S.flags.trial) ? '<br><span class="menu-trial">试炼境 · 不入轮回簿</span>' : '';
  w.innerHTML = `<div class="menu-note">${S.name} · ${realmStr()} · ${cn(S.age)}岁<br>定型 · ${ps}${trialNote}<br>此卷随笔随存，合上亦不失。</div>
    <button class="menu-item" data-m="annals">平生<small>逐年 · 所遇 · 所求</small></button>
    <button class="menu-item" data-m="look">纸墨<small>昼夜 · 字号 · 动效</small></button>
    <button class="menu-item" data-m="resume">继续修行</button>
    <button class="menu-item" data-m="slots">存档<small>三卷 · 导出 · 导入</small></button>
    <button class="menu-item" data-m="path">定型小记<small>道基 · 丹纹 · 法相</small></button>
    <button class="menu-item" data-m="atlas">轮回图鉴<small>墓志 · 道基 · 法相 · 神器 · 结局</small></button>
    ${!ds.claimed ? '<button class="menu-item" data-m="daily">今日机缘<small>晨露一缕</small></button>' : ''}
    <button class="menu-item" data-m="title">回到卷首</button>
    ${Core.canRetire(S) ? '<button class="menu-item" data-m="retire">归隐山林<small>放下长生，此卷即终</small></button>' : ''}
    <button class="menu-item danger" data-m="reset">焚卷重来</button>`;
  w.onclick = async e => {
    const btn = e.target.closest('[data-m]'); if (!btn) return;
    const m = btn.dataset.m;
    if (m === 'slots') { await closeSheet(); openSlots(); return; }
    if (m === 'annals') { await closeSheet(); openAnnals(); return; }
    if (m === 'look') { await closeSheet(); openLook(); return; }
    if (m === 'path') { await closeSheet(); openCult('path'); return; }
    if (m === 'atlas') { await closeSheet(); openAtlasSheet(); return; }
    if (m === 'daily') {
      await closeSheet();
      const r = Samsara.claimDaily(S, pushLog);
      if (r.err) toast(r.err); else { save(); render(); toast('日缘已领'); }
      return;
    }
    await closeSheet();
    if (m === 'title') { save(); initTitle(); unrollTo('title'); }
    if (m === 'retire' && await inkConfirm('此去不问长生。归隐之后，此卷即终。', '归隐')) {
      Core.retire(S); pushLog({ title: '归隐', text: '你解下腰牌，放在洞府石案上，转身下山。山道上的石阶，你走了许多年，今日才觉出它这样长。', cls: 'event', div: true });
      render(); save(); setTimeout(() => showEnd('guiyin'), 900);
    }
    if (m === 'reset' && await inkConfirm('焚去此卷，前尘尽忘。', '焚卷', true)) {
      if (typeof Slots !== 'undefined') Slots.clear(Slots.loadBox().active);
      else localStorage.removeItem(SAVE_KEY);
      S = null; resetCreate(); unrollTo('create');
    }
  };
  openSheet('卷首', w);
}


/* ================= 三卷存档 ================= */
const END_NAME = { ascend: '飞升', zuohua: '坐化', rumo: '入魔', guiyin: '归隐', bingjie: '兵解', yunluo: '身殒', renhuang: '人皇', quancheng: '权臣', huashen: '山神', zhenmo: '镇魔', chuanshuo: '传说' };
function openSlots() {
  if (typeof Slots === 'undefined') { toast('存档未备'); return; }
  const w = document.createElement('div');
  w.className = 'slot-sheet';
  let sel = Slots.loadBox().active | 0;
  const paint = () => {
    const box = Slots.loadBox();
    if (sel < 0 || sel > 2) sel = box.active | 0;
    const cards = box.slots.map((sl, i) => {
      if (!sl || !sl.sum) return `<button type="button" class="slot-card empty${i === sel ? ' on' : ''}" data-i="${i}"><b>第${cn(i + 1)}卷</b><em>空卷</em><small>可存入</small></button>`;
      const sm = sl.sum;
      const st = sm.ascended ? '飞升' : sm.dead ? (END_NAME[sm.ending] || '已终') : '在修';
      return `<button type="button" class="slot-card${i === sel ? ' on' : ''}" data-i="${i}"><b>${esc(sm.name || '无名')}</b><em>${esc(sm.realmName || '—')} · ${cn(sm.age || 0)}岁</em><small>${esc(Slots.fmtPlayed(sm.played))} · ${esc(Slots.fmtDate(sl.at))} · ${esc(st)}</small></button>`;
    }).join('');
    const io = w.querySelector('.slot-io');
    const keep = io && !io.hidden ? io.innerHTML : '';
    const keepOn = io && !io.hidden;
    w.innerHTML = `<p class="slot-lead">三卷并存。读入即续，存入即覆。导出的码可抄去别处。</p>
      <div class="slot-list">${cards}</div>
      <div class="slot-actions">
        <button type="button" class="menu-item" data-a="load">读入此卷</button>
        ${S && !S.dead && !S.ascended ? '<button type="button" class="menu-item" data-a="save">存入此卷</button>' : ''}
        <button type="button" class="menu-item" data-a="export">导出此卷</button>
        <button type="button" class="menu-item" data-a="import">导入存档</button>
        <button type="button" class="menu-item danger" data-a="wipe">焚去此卷</button>
      </div>
      <div class="slot-io"${keepOn ? '' : ' hidden'}>${keep}</div>`;
  };
  const slotData = i => {
    const box = Slots.loadBox();
    const sl = box.slots[i];
    if (!sl) return null;
    return Slots.migrateSlot(sl);
  };
  w.addEventListener('click', async e => {
    const card = e.target.closest('.slot-card');
    if (card) { sel = +card.dataset.i; paint(); return; }
    const b = e.target.closest('[data-a]');
    if (!b || b.closest('.slot-io')) return;
    const a = b.dataset.a;
    if (a === 'load') {
      const data = slotData(sel);
      if (!data) { toast('此卷是空的'); return; }
      if (data.dead || data.ascended) { toast('此卷已终，可导出，不能续'); return; }
      if (S && !S.dead && !(await inkConfirm('转去另一卷？当前卷已随手存好。', '读入'))) return;
      save();
      Slots.setActive(sel);
      S = Slots.read(sel);
      if (!S) { toast('此卷读不开'); return; }
      playTick = Date.now();
      await closeSheet();
      $('#end').hidden = true;
      enterMain(true);
      return;
    }
    if (a === 'save') {
      if (!S || S.dead || S.ascended) { toast('没有可存的卷'); return; }
      const box = Slots.loadBox();
      if (box.slots[sel] && sel !== box.active && !(await inkConfirm('覆上这一卷？', '存入', true))) return;
      Slots.write(sel, S);
      toast('已存入第' + cn(sel + 1) + '卷');
      paint();
      return;
    }
    if (a === 'export') {
      const data = slotData(sel) || (S && sel === (Slots.loadBox().active | 0) ? S : null);
      if (!data) { toast('此卷是空的'); return; }
      let code = '';
      try { code = Codec.encode(data); } catch (err) { toast('导出未成'); return; }
      const io = document.createElement('div');
      io.className = 'slot-io';
      io.innerHTML = `<p>长按可复制。换一处设备，用「导入」贴回。</p><textarea class="slot-code" readonly></textarea><button type="button" class="menu-item" data-a="copy">复制</button>`;
      io.querySelector('textarea').value = code;
      const old = w.querySelector('.slot-io');
      if (old) old.replaceWith(io); else w.appendChild(io);
      io.querySelector('[data-a="copy"]').onclick = async () => {
        const ta = io.querySelector('textarea');
        ta.focus(); ta.select();
        try { await navigator.clipboard.writeText(code); toast('已抄下'); }
        catch (err) { toast('请长按文字复制'); }
      };
      return;
    }
    if (a === 'import') {
      const io = document.createElement('div');
      io.className = 'slot-io';
      io.innerHTML = `<p>把存档码贴在下面。将写入第${cn(sel + 1)}卷。</p><textarea class="slot-code" placeholder="MX1.…"></textarea><button type="button" class="menu-item" data-a="doimp">验入</button>`;
      const old = w.querySelector('.slot-io');
      if (old) old.replaceWith(io); else w.appendChild(io);
      io.querySelector('[data-a="doimp"]').onclick = async () => {
        const text = io.querySelector('textarea').value;
        const dec = Codec.decode(text);
        if (dec.err) { toast(dec.err); return; }
        let data = dec.data;
        if (data && data.data && data.data.v && !data.v) data = data.data;
        data = Core.migrate(data);
        if (!data || !data.name) { toast('此码不是一卷可续的人生'); return; }
        const box = Slots.loadBox();
        if (box.slots[sel] && !(await inkConfirm(`写入第${cn(sel + 1)}卷，原卷将被盖住。`, '导入', true))) return;
        Slots.write(sel, data);
        toast('已导入 · ' + data.name);
        paint();
      };
      return;
    }
    if (a === 'wipe') {
      const box = Slots.loadBox();
      if (!box.slots[sel]) { toast('此卷是空的'); return; }
      if (!(await inkConfirm('焚去这一卷？', '焚卷', true))) return;
      const wasActive = (box.active | 0) === sel;
      Slots.clear(sel);
      if (wasActive && S) { S = null; }
      toast('已焚');
      paint();
      if (wasActive && document.body.dataset.screen === 'main') { await closeSheet(); initTitle(); unrollTo('title'); }
    }
  });
  paint();
  openSheet('存档', w);
}

/* ================= 轮回图鉴／墓志长卷 ================= */
function openAtlasSheet() {
  if (typeof Samsara === 'undefined') { toast('轮回未启'); return; }
  const m = Samsara.loadMeta();
  const st = Samsara.atlasStats(m);
  const w = document.createElement('div'); w.className = 'atlas-sheet';
  const END_N = { ascend: '飞升', zuohua: '坐化', rumo: '入魔', guiyin: '归隐', bingjie: '兵解', yunluo: '身殒', renhuang: '人皇', quancheng: '权臣', huashen: '山神', zhenmo: '镇魔', chuanshuo: '传说' };
  const sec = (title, html) => `<section class="atlas-sec"><h4>${title}</h4><div class="atlas-grid">${html}</div></section>`;
  const cell = (name, on, sub) => `<div class="atlas-cell${on ? ' on' : ''}"><b>${esc(name)}</b>${sub ? '<em>' + esc(sub) + '</em>' : ''}${on ? '' : '<i>未识</i>'}</div>`;
  const sil = i => {
    const dx = ((i * 17) % 9) - 4, dy = ((i * 5) % 7) - 3, sc = (0.86 + (i % 4) * 0.06).toFixed(2);
    return `<div class="atlas-cell sil" aria-label="未解之缘"><span class="sil-ink" style="transform:translate(${dx}px,${dy}px) scale(${sc})"></span><em>未解之缘</em></div>`;
  };
  let daojiH = '', faxiangH = '', shenqiH = '', endingH = '', encH = '';
  if (typeof DAOJI !== 'undefined') for (const id of Object.keys(DAOJI)) daojiH += cell(DAOJI[id].name, !!m.atlas.daoji[id], DAOJI[id].seal);
  if (typeof FAXIANG !== 'undefined') for (const id of Object.keys(FAXIANG)) faxiangH += cell(FAXIANG[id].name, !!m.atlas.faxiang[id], FAXIANG[id].seal);
  if (typeof SHENQI_ZHI !== 'undefined') for (const z of SHENQI_ZHI) shenqiH += cell(z.name, !!m.atlas.shenqi[z.name], z.seal || '器');
  let endKnown = 0, silI = 0;
  for (const k of Object.keys(END_N)) {
    if (m.atlas.ending[k]) { endingH += cell(END_N[k], true, '×' + m.atlas.ending[k]); endKnown++; }
    else endingH += sil(silI++);
  }
  const enc = Samsara.encounterCatalog();
  m.atlas.encounter = m.atlas.encounter || {};
  let encKnown = 0;
  const knownEnc = [], unknownN = [];
  enc.forEach(e => { if (m.atlas.encounter[e.id]) knownEnc.push(e); else unknownN.push(e); });
  encKnown = knownEnc.length;
  knownEnc.forEach(e => { encH += cell(e.title, true, e.seal || '缘'); });
  unknownN.forEach(() => { encH += sil(silI++); });
  const relicH = (m.relics || []).slice(0, 8).map(r => {
    const lab = r.kind === 'cave' ? '旧洞' : r.kind === 'fabao' ? '旧器' : r.kind === 'page' ? '残页' : '遗';
    return cell(lab, true, r.name || '');
  }).join('');
  const got = (st.daoji | 0) + (st.faxiang | 0) + (st.shenqi | 0) + endKnown + encKnown;
  const max = (st.daojiMax | 0) + (st.faxiangMax | 0) + (st.shenqiMax | 0) + Object.keys(END_N).length + enc.length;
  const epis = (m.epitaphs || []).slice(0, 8).map((ep, i) => {
    const t = (ep.short || ep.text || '').slice(0, 64);
    return `<button type="button" class="atlas-epi" data-i="${i}"><b>${esc(ep.name || '无名')} · ${esc(END_N[ep.ending] || ep.ending || '')}</b><span>${cn(ep.age)}岁 · ${esc(t)}</span></button>`;
  }).join('') || '<p class="atlas-empty">尚无墓志。了结一世后，长卷自会落下。</p>';
  w.innerHTML = `<div class="atlas-head">已录 ${cn(got)} / ${cn(max)}　·　轮回 ${cn(st.lives)} 世　最高 ${cn(st.best.age || 0)} 岁</div>
    <p class="atlas-count">终局 ${cn(endKnown)}/${cn(Object.keys(END_N).length)}　奇遇 ${cn(encKnown)}/${cn(enc.length)}　道基 ${cn(st.daoji)}/${cn(st.daojiMax)}　法相 ${cn(st.faxiang)}/${cn(st.faxiangMax)}　神器 ${cn(st.shenqi)}/${cn(st.shenqiMax)}</p>
    ${sec('道基 ' + cn(st.daoji) + '/' + cn(st.daojiMax), daojiH || '<p class="atlas-empty">—</p>')}
    ${sec('法相 ' + cn(st.faxiang) + '/' + cn(st.faxiangMax), faxiangH || '<p class="atlas-empty">—</p>')}
    ${sec('神器 ' + cn(st.shenqi) + '/' + cn(st.shenqiMax), shenqiH || '<p class="atlas-empty">—</p>')}
    ${sec('终局 ' + cn(endKnown) + '/' + cn(Object.keys(END_N).length), endingH)}
    ${relicH ? sec('轮回遗物', relicH) : ''}
    ${sec('奇遇 ' + cn(encKnown) + '/' + cn(enc.length), encH || '<p class="atlas-empty">—</p>')}
    <section class="atlas-sec"><h4>墓志长卷</h4><div class="atlas-epis">${epis}</div>
      <pre class="atlas-long" id="atlas-long-view" hidden></pre></section>`;
  w.onclick = e => {
    const b = e.target.closest('.atlas-epi'); if (!b) return;
    const ep = (m.epitaphs || [])[+b.dataset.i]; if (!ep) return;
    const view = w.querySelector('#atlas-long-view');
    view.hidden = false; view.textContent = ep.text || ep.short || '';
    w.querySelectorAll('.atlas-epi').forEach(x => x.classList.toggle('on', x === b));
  };
  openSheet('轮回图鉴', w);
}

/* ================= 终卷 ================= */
const END_ART = {
  ascend: `<svg viewBox="0 0 320 120"><g class="ea-rays">${Array.from({ length: 13 }, (_, i) => { const a = (-90 + (i - 6) * 13) * Math.PI / 180; return `<path d="M160 118 L${(160 + Math.cos(a) * 190).toFixed(1)} ${(118 + Math.sin(a) * 190).toFixed(1)}" />`; }).join('')}</g><circle class="ea-sun" cx="160" cy="118" r="34"/></svg>`,
  zuohua: `<svg viewBox="0 0 320 120"><path class="ea-smoke" d="M160 104 C150 86 172 74 160 58 C148 42 170 32 162 14"/><path class="ea-smoke s2" d="M160 104 C168 90 150 80 158 66 C166 52 150 44 156 28"/><rect class="ea-stick" x="158.6" y="100" width="2.8" height="20" rx="1"/><circle class="ea-ember" cx="160" cy="100" r="2.2"/></svg>`,
  rumo: `<svg viewBox="0 0 320 120"><g class="ea-drips">${[[92, 26, 2.2, 6], [121, 64, 4.5, 2], [150, 18, 1.6, 10], [174, 48, 3.2, 0], [207, 82, 5.5, 4], [236, 34, 2.6, 12]].map(([x, h, w, y0], i) => `<path d="M${x - w} ${y0} C${x - w * .6} ${y0 + h * .55} ${x - w * .9} ${y0 + h} ${x} ${y0 + h + w * 1.6} C${x + w * .9} ${y0 + h} ${x + w * .6} ${y0 + h * .55} ${x + w} ${y0}Z" style="animation-delay:${(.4 + i * .19).toFixed(2)}s"/>`).join('')}</g></svg>`,
  guiyin: `<svg viewBox="0 0 320 120"><circle class="ea-moon" cx="244" cy="30" r="16"/><g class="ea-boat"><path d="M96 80 Q160 98 226 77 L214 88 Q160 104 108 90Z"/><path class="ea-pole" d="M146 84 L198 26"/></g><g class="ea-boat ea-refl"><path d="M96 98 Q160 84 226 100 L214 93 Q160 80 108 92Z"/></g><g class="ea-waves"><path d="M30 96 Q60 92 90 96 T150 96 T210 96 T290 96"/><path d="M70 108 Q100 104 130 108 T190 108 T250 108"/></g></svg>`,
  bingjie: `<svg viewBox="0 0 320 120"><g class="ea-sword"><path class="ea-blade1" d="M104 92 L168 52 Q172 51 173 55 L110 97Z"/><path class="ea-blade2" d="M180 46 L236 12 Q240 12 239 16 L186 52Z"/><path class="ea-guard" d="M92 82 Q98 80 116 104 Q112 108 108 104 Q100 92 90 86Z"/><path class="ea-hilt" d="M100 100 L80 116"/></g><g class="ea-motes">${Array.from({ length: 16 }, (_, i) => `<circle cx="${176 + (i * 37) % 64 - 20}" cy="${50 - (i * 23) % 42}" r="${1 + (i % 3) * .8}" style="animation-delay:${(i * .19).toFixed(2)}s"/>`).join('')}</g></svg>`,
  yunluo: `<svg viewBox="0 0 320 120"><path class="ea-bolt" d="M184 -4 L156 42 L172 44 L142 92 L160 94 L132 124 L166 88 L150 86 L182 38 L166 36 L192 -4Z"/><path class="ea-bolt thin" d="M156 42 L134 58 L140 64 L116 86 L146 60 L140 56 L162 44Z"/></svg>`,
  renhuang: `<svg viewBox="0 0 320 120"><g class="ea-throne"><rect x="130" y="48" width="60" height="52" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M120 48 L160 18 L200 48" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="160" cy="28" r="6" fill="currentColor" opacity=".55"/><path d="M140 100 H180" stroke="currentColor" stroke-width="2"/></g><g class="ea-rays" opacity=".45">${Array.from({length:9},(_,i)=>{const a=(-90+(i-4)*12)*Math.PI/180;return `<path d="M160 22 L${(160+Math.cos(a)*90).toFixed(1)} ${(22+Math.sin(a)*90).toFixed(1)}"/>`;}).join('')}</g></svg>`,
  quancheng: `<svg viewBox="0 0 320 120"><g class="ea-seal"><rect x="118" y="28" width="84" height="84" rx="6" fill="none" stroke="currentColor" stroke-width="2.4"/><text x="160" y="86" text-anchor="middle" font-size="42" class="seal-font" fill="currentColor" opacity=".85">摄</text></g></svg>`,
  huashen: `<svg viewBox="0 0 320 120"><path d="M118 96 L160 42 L202 96" fill="none" stroke="currentColor" stroke-width="2"/><path d="M136 96 V72 H184 V96" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="232" cy="36" r="10" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M70 100 H250" stroke="currentColor" stroke-width="1" opacity=".45"/></svg>`,
  zhenmo: `<svg viewBox="0 0 320 120"><path d="M150 18 V92" stroke="currentColor" stroke-width="2"/><path d="M132 40 H168" stroke="currentColor" stroke-width="1.6"/><path d="M160 96 C120 108 90 78 70 110" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".8"/><path d="M168 100 C210 112 250 70 280 104" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".7"/></svg>`,
  chuanshuo: `<svg viewBox="0 0 320 120"><rect x="132" y="22" width="56" height="82" fill="none" stroke="currentColor" stroke-width="2"/><path d="M146 44 H174 M146 58 H168 M146 72 H170" stroke="currentColor" stroke-width="1.3"/><path d="M70 104 H250" stroke="currentColor" stroke-width="1" opacity=".4"/></svg>`,
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
  const cr = typeof courtRankName === 'function' ? courtRankName(S) : '';
  const courtLine = cr ? `官至${cr}，兵${cn((S.court&&S.court.bing)||0)}·民${cn((S.court&&S.court.min)||0)}·道${cn((S.court&&S.court.dao)||0)}。` : '';
  const T = {
    ascend: ['飞升', `${S.name}，以${S.lg.name}之资${(Core.pathSummary(S)||[]).length ? '，行' + (Core.pathSummary(S)||[]).map(x=>x.name).join('·') + '之路' : ''}，历${age}载春秋，终渡九重天劫，白日飞升。青冥山下的樵夫说，那一日，满山松涛都静了一瞬。`],
    zuohua: ['坐化', `${age}岁那年冬天，你在洞府中静静合上了眼。生前修至${rs}，${evs}。山风穿过石门，吹散了案上未写完的手札。` + pick(['青山不语，白云自去。', '一生求长生，长生终未得。', '此身原是客，何处不归途。'])],
    rumo: ['入魔', `${age}岁那年，${S.gf && GONGFA[S.gf].mo ? '《' + GONGFA[S.gf].name + '》在你体内' : '心魔在你识海中'}日夜低语，终于有一夜，你再也分不清哪一个声音是自己。后来有人在血雾谷见过一个赤瞳之人，修为通天，却认不得任何一位故人。` + pick(['一念成魔，万劫难复。', '墨落成血，再难洗白。'])],
    guiyin: ['归隐', `${S.name}修至${rs}，于${age}岁那年放下了长生。此后青冥山中少了一位修士，桃花溪上多了一叶扁舟。有渔人说，常见一个老者在江心垂钓，钓线上从不挂饵；后来，连那舟也不见了，只剩空船自横。`],
    bingjie: ['兵解', `${rs}破关之际，天威如山，肉身寸寸崩解。袖中兵解玉符应声而碎，一缕真灵遁出，没入茫茫轮回。此生修为尽散，道心未绝——来世入道之时，或可忆起今日。`],
    yunluo: ['身殒', `${rs}破关失利，经脉寸断，${age}载苦修化作山间一缕青烟。同门在你的洞府前立了一块无字碑，碑前的野草，年年都长得很高。` + pick(['大道无情，从不等人。', '天道之下，众生皆刍狗。'])],
    renhuang: ['人皇', `${S.name}修至${rs}，${courtLine}于${age}岁登基，建元人皇。史官写下：仙凡一统，自此人主天下。山门钟声那日齐哑——有人说是敬畏，有人说是诀别。`],
    quancheng: ['权臣', `${S.name}修至${rs}，${courtLine}于${age}岁摄政，不篡位号。诏令出其手，军权归其心。史书不敢直书其名，只写「摄政如天」。`],
    huashen: ['山神', `${S.name}修至${rs}，于${age}岁停在那座没有门的祠前。名字刻得很浅。浅，是因为山会自己把字长深。此后过路人放一枚干果，风会替你点头。`],
    zhenmo: ['镇魔', `${S.name}修至${rs}，于${age}岁坐上裂口。剑横在膝上，不是为了杀，是做一个很沉的镇纸。潮声在身下慢慢变成普通的风。`],
    chuanshuo: ['传说', `${S.name}修至${rs}，于${age}岁把这一生删到很薄，放进石室，封面上没有名字。后世用别人的嘴讲你。讲着讲着，就成了真的。`],
  }[kind] || ['坐化', ''];
  $('#end-title').textContent = T[0];
  const composed = (typeof Life !== 'undefined' && Life.compose) ? Life.compose(S, kind, T[1]) : null;
  const recLine = composed ? [T[1], composed.juebi, composed.variant, composed.judge].filter(Boolean).join('') : T[1];
  const isTrial = !!(S.flags && S.flags.trial);
  let rec = null;
  if (typeof Samsara !== 'undefined' && Samsara.recordLife) {
    if (isTrial) {
      const m = Samsara.loadMeta();
      Samsara.unlockAtlas(m, S, kind);
      Samsara.saveMeta(m);
      rec = { epitaph: Samsara.epitaphLong(S, kind, recLine), legacy: null };
    } else {
      rec = Samsara.recordLife(S, kind, recLine);
    }
  }
  const longEp = (composed && [composed.full, composed.thread].filter(Boolean).join('\n')) || (rec && rec.epitaph) || T[1];
  $('#end-epitaph').textContent = composed ? composed.juebi : T[1];
  const longEl = $('#end-epitaph-long');
  if (longEl) { longEl.textContent = longEp; longEl.hidden = false; }
  const judgeEl = $('#end-judge');
  if (judgeEl) {
    const bits = [];
    if (composed && composed.judge) bits.push(composed.judge);
    if (composed && composed.variant) bits.push(composed.variant);
    if (composed && composed.thread && (kind === 'zuohua' || kind === 'rumo' || kind === 'yunluo' || kind === 'bingjie')) bits.push(composed.thread);
    judgeEl.textContent = bits.join('');
    judgeEl.hidden = !bits.length;
  }
  const lab = { ascend: '境界 <b>飞升</b>', guiyin: `境界 <b>${rs}</b>　归隐 <b>${age}岁</b>`, renhuang: `境界 <b>${rs}</b>　人皇 <b>${age}岁</b>`, quancheng: `境界 <b>${rs}</b>　摄政 <b>${age}岁</b>`, huashen: `境界 <b>${rs}</b>　山神 <b>${age}岁</b>`, zhenmo: `境界 <b>${rs}</b>　镇魔 <b>${age}岁</b>`, chuanshuo: `境界 <b>${rs}</b>　传说 <b>${age}岁</b>` }[kind] || `境界 <b>${rs}</b>　享年 <b>${age}</b>`;
  const gfl = S.gf ? `<br>主修 <b>《${GONGFA[S.gf].name}》</b>` : '';
  const pth = (Core.pathSummary(S) || []).map(x => x.name).join(' · ');
  const pfl = pth ? `<br>定型 <b>${pth}</b>` : '';
  const fbl = S.fabao ? `<br>本命 <b>${S.fabao.name}</b>·${FABAO_STAGE[S.fabao.stage|0]}` : '';
  const goalBit = (composed && composed.judge) ? `<br><span class="end-judge-inline">${esc(composed.judge)}</span>` : '';
  const legObj = rec && rec.legacy;
  const carry = [];
  if (legObj) {
    if (legObj.wx) carry.push(`悟性 +${legObj.wx}`);
    if (legObj.canhun) carry.push('法宝残魂');
    if (legObj.daoji) carry.push('道基残忆');
    if (legObj.auxPage) carry.push('功法残页');
    if (legObj.sectMark) carry.push('门派印记');
    if (legObj.courtMark) carry.push('皇命印记');
    if (legObj.cave) carry.push('旧洞残钥');
  }
  const leg = carry.length ? `<br><span class="end-legacy">来世可承 · ${carry.join(' · ')}</span>`
    : (isTrial ? '<br><span class="end-legacy">试炼局 · 不入轮回簿</span>' : '');
  $('#end-stats').innerHTML = `${S.name} · ${S.lg.id === 'wei' ? '' : S.lgEls.join('')}${S.lg.name}<br>${lab}${gfl}${pfl}${fbl}${goalBit}<br>悟性 <b>${cn(S.wx)}</b>　心境 <b>${xinjingWord(S.xj)}</b>${leg}`;
  save();
  $('#btn-reborn').onclick = async () => {
    const kept = typeof Slots !== 'undefined' && Slots.firstEmpty() >= 0;
    e.hidden = true; S = null;
    window.__trialStart = false;
    if (kept) toast('前卷留在存档里');
    else if (typeof Slots !== 'undefined') window.__slotTarget = Slots.newestIndex();
    resetCreate(); initTitle(); unrollTo('create');
  };
  const btnAtlasEnd = $('#btn-end-atlas');
  if (btnAtlasEnd) btnAtlasEnd.onclick = () => openAtlasSheet();
  const btnScroll = $('#btn-scroll');
  if (btnScroll) btnScroll.onclick = () => saveScroll(kind, T[0]);
}

const END_SEAL = { ascend: '升', zuohua: '化', rumo: '魔', guiyin: '隐', bingjie: '解', yunluo: '殒', renhuang: '皇', quancheng: '摄' };
async function saveScroll(kind, title) {
  if (!S || typeof ScrollArt === 'undefined') { toast('绘卷未备'); return; }
  const view = $('#scroll-view');
  const img = $('#scroll-img');
  if (!view || !img) return;
  toast('正在落墨…');
  let canvas;
  try { canvas = await ScrollArt.render(S, kind, title); }
  catch (err) { console.warn(err); toast('绘卷未成'); return; }
  const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
  if (!blob) { toast('绘卷未成'); return; }
  const url = URL.createObjectURL(blob);
  if (img._url) URL.revokeObjectURL(img._url);
  img._url = url;
  img.src = url;
  img.alt = (S.name || '无名') + ' · ' + (title || '终卷');
  view.hidden = false;
  requestAnimationFrame(() => view.classList.add('open'));
  const file = new File([blob], '纸上仙途.png', { type: 'image/png' });
  const shareBtn = $('#scroll-share');
  const can = navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }));
  if (shareBtn) {
    shareBtn.querySelector('.bb-text').textContent = can ? '分享' : '打开图片';
    shareBtn.onclick = async () => {
      if (can) {
        try { await navigator.share({ files: [file], title: '纸上仙途', text: [S.name || '', title || '', '纸上仙途'].filter(Boolean).join(' · ') }); return; }
        catch (e) { if (e && e.name === 'AbortError') return; }
      }
      const w = window.open(url, '_blank');
      if (!w) toast('长按图片，即可保存');
    };
  }
}
function closeScrollView() {
  const view = $('#scroll-view');
  if (!view) return;
  view.classList.remove('open');
  setTimeout(() => { view.hidden = true; }, 320);
}

/* ================= 江湖界面 ================= */
const JHUI = typeof makeJHUI === 'function' ? makeJHUI({ get S() { return S; }, get busy() { return busy; }, set busy(v) { busy = v; },
  $, sleep, pick, render, save, pushLog, openEvent, openSheet, closeSheet, toast, inkWrite, buffer, checkEnd, runDuel, realmStr, fmtNum, K, chanceWord, mountFoeSlip, choiceSub }) : undefined;

/* ================= 此生所求 / 平生 / 纸墨 ================= */
const LOOK_KEY = 'moxian.look';
function readLook() {
  try { return JSON.parse(localStorage.getItem(LOOK_KEY) || '{}') || {}; } catch (e) { return {}; }
}
function applyLook(partial) {
  const prev = readLook();
  const prevTheme = document.documentElement.dataset.theme || '';
  const p = Object.assign({ theme: 'auto', font: 'md', motion: 'full' }, prev, partial || {});
  try { localStorage.setItem(LOOK_KEY, JSON.stringify({ theme: p.theme, font: p.font, motion: p.motion })); } catch (e) {}
  const dark = p.theme === 'night' || (p.theme !== 'day' && matchMedia('(prefers-color-scheme: dark)').matches);
  const nextTheme = dark ? 'night' : 'day';
  document.documentElement.dataset.theme = nextTheme;
  document.documentElement.dataset.font = (p.font === 'lg' || p.font === 'sm') ? p.font : 'md';
  document.documentElement.dataset.motion = p.motion === 'lite' ? 'lite' : 'full';
  const wantThin = p.motion === 'lite' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (wantThin) document.documentElement.dataset.fx = 'thin';
  else if (partial && partial.motion === 'full') delete document.documentElement.dataset.fx;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#16130f' : '#efe6d3');
  const apple = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (apple) apple.setAttribute('content', dark ? 'black' : 'default');
  root.style.setProperty('--brush-night-ink', brushBtnImg(44, '#4a4036', 0.92));
  root.style.setProperty('--brush-img-zhu', brushBtnImg(27, dark ? '#9c4038' : '#b3302a', dark ? 0.94 : 0.92));
  if (typeof FX !== 'undefined' && FX.syncMotion) FX.syncMotion();
  if (typeof Wallpaper !== 'undefined' && Wallpaper.syncMotion) Wallpaper.syncMotion();
  // 开卷前山与壁纸已经画过。主题没变就不要在墨滴落地的同一帧整页重绘。
  if (prevTheme !== nextTheme) drawMountains(true, { yield: prevTheme !== '' });
}
function openLook() {
  const p = Object.assign({ theme: 'auto', font: 'md', motion: 'full' }, readLook());
  const w = document.createElement('div');
  w.className = 'look-sheet';
  const row = (k, label, opts) => `<div class="look-row" data-k="${k}"><b>${label}</b><div class="look-opts">${opts.map(([id, name]) => `<button type="button" class="look-opt${p[k] === id ? ' on' : ''}" data-v="${id}">${name}</button>`).join('')}</div></div>`;
  w.innerHTML = `<p class="look-lead">纸还是那张纸。昼夜、字号与动效都记在这卷之外，不入存档。</p>
    ${row('theme', '昼夜', [['auto', '自动'], ['day', '昼'], ['night', '夜']])}
    ${row('font', '字号', [['sm', '小'], ['md', '中'], ['lg', '大']])}
    ${row('motion', '动效', [['full', '全'], ['lite', '简']])}
    <p class="look-note">夜墨是深纸与淡墨，卷面仍暖。简则收雾、落花与翻卷。若画面吃力，动效会自己变薄。</p>`;
  w.addEventListener('click', e => {
    const b = e.target.closest('.look-opt'); if (!b) return;
    const rowEl = b.closest('.look-row');
    const k = rowEl.dataset.k, v = b.dataset.v;
    rowEl.querySelectorAll('.look-opt').forEach(x => x.classList.toggle('on', x === b));
    applyLook({ [k]: v });
  });
  openSheet('纸墨', w);
}
function openGoalPicker() {
  if (!S || typeof Life === 'undefined') return Promise.resolve(null);
  const pc = $('#goal-cer'); if (!pc) return Promise.resolve(null);
  return new Promise(resolve => {
    pc.hidden = false; pc.className = 'path-cer goal-cer go';
    const seal = $('#goal-seal'); if (seal) seal.textContent = '求';
    const lead = $('#goal-lead');
    if (lead) lead.textContent = '';
    const opts = $('#goal-opts'); opts.innerHTML = '';
    const foot = $('#goal-foot'); foot.hidden = false;
    const conf = $('#goal-confirm'); conf.disabled = true;
    const hint = $('#goal-hint'); if (hint) hint.textContent = '择一愿。闭关时，或可再改';
    let selected = S.life && S.life.goal;
    inkWrite(lead, '入山之前，先问自己一句。此生所求，不必告诉别人。卷终时，纸会记得你有没有做到。', { immediate: true, step: snappy() ? 8 : 18 });
    Life.GOALS.forEach((g, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'path-opt' + (selected === g.id ? ' on' : '');
      b.style.animationDelay = (0.05 * i) + 's';
      b.innerHTML = `<span class="po-seal"></span><span class="po-body"><b></b><em></em><p></p></span>`;
      b.querySelector('.po-seal').textContent = g.seal;
      b.querySelector('b').textContent = g.name;
      b.querySelector('em').textContent = '此生所求';
      b.querySelector('p').textContent = g.hint;
      b.onclick = () => {
        selected = g.id;
        opts.querySelectorAll('.path-opt').forEach(x => x.classList.toggle('on', x === b));
        conf.disabled = false;
        if (hint) hint.textContent = '落定 · ' + g.name;
      };
      opts.appendChild(b);
    });
    if (selected) conf.disabled = false;
    conf.onclick = async () => {
      if (!selected) return;
      const g = Life.setGoal(S, selected, !!(S.life && S.life.goal && S.life.goal !== selected));
      pc.classList.add('leave');
      await sleep(snappy() ? 180 : 420);
      pc.hidden = true; pc.className = 'path-cer goal-cer';
      if (g) pushLog({ title: '此生所求', text: `你在心里写下一行很小的字：${g.name}。${g.hint}`, cls: 'gold' });
      render(); save();
      resolve(g);
    };
  });
}
function openAnnals() {
  if (!S || typeof Life === 'undefined') { toast('平生未启'); return; }
  const c = Life.chronicle(S);
  const w = document.createElement('div');
  w.className = 'annals';
  const goal = c.goal ? `${c.goal.name}` : '尚未落笔';
  const scars = c.scars.length ? c.scars.map(x => x.text).slice(0, 3).map(t => `<p>${esc(t)}</p>`).join('') : '<p class="annals-empty">识海尚无暗伤。</p>';
  const people = c.people.length ? c.people.map(p => `<li><b>${esc(p.name)}</b><em>${cn(p.y)}岁</em><span>${esc(p.note || '')}</span></li>`).join('') : '<li class="annals-empty">还没有记下谁。</li>';
  const years = c.years.length ? c.years.map(y => `<section class="annals-year"><h4>${cn(y.y)}岁</h4>${y.items.map(it => `<article class="${esc(it.k || '')}"><b>${esc(it.t || '·')}</b><p>${esc(it.d || '')}</p></article>`).join('')}</section>`).join('') : '<p class="annals-empty">这一卷还薄。去活一活，字会自己来。</p>';
  const deeds = (c.deeds || []).filter(d => !d.done && S.months >= d.due).length;
  w.innerHTML = `<header class="annals-head">
      <div class="annals-seal">${esc(c.heart.slice(0, 1))}</div>
      <div><b>${esc(S.name)}</b><em>心性 · ${esc(c.heart)}</em><em>所求 · ${esc(goal)}</em>${deeds ? `<em class="zhu">回响将至</em>` : ''}</div>
    </header>
    <section class="annals-block"><h4>暗伤</h4>${scars}</section>
    <section class="annals-block"><h4>所遇</h4><ul class="annals-people">${people}</ul></section>
    <div class="annals-scroll">${years}</div>`;
  openSheet('平生', w);
}

/* ================= 启动 ================= */
$$('.act').forEach(b => b.addEventListener('click', () => {
  b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse'); setTimeout(() => b.classList.remove('pulse'), 500);
  if (typeof MoAudio !== 'undefined') MoAudio.uiTap();
  act(b.dataset.act);
}));
$('#btn-break').onclick = openBreak;
$('#btn-menu').onclick = openMenu;
$('#btn-sect').onclick = () => { if (!busy && S && !S.dead && !S.ascended) openSect(); };
$('#btn-cult').onclick = () => { if (!busy && S && !S.dead && !S.ascended) openCult(); };
$('#path-seals').onclick = e => {
  const s = e.target.closest('.path-seal'); if (!s || busy || !S || S.dead || S.ascended) return;
  openCult('path');
};
FX.initPress(); FX.initParallax();
if (typeof MoAudio !== 'undefined') {
  MoAudio.mountUI();
  const dock = document.getElementById('audio-dock');
  if (dock && !document.getElementById('btn-look')) {
    const b = document.createElement('button');
    b.type = 'button'; b.id = 'btn-look'; b.className = 'audio-btn';
    b.setAttribute('aria-label', '纸墨');
    b.innerHTML = '<span class="audio-lab">设</span>';
    b.addEventListener('click', e => { e.stopPropagation(); openLook(); });
    dock.insertBefore(b, dock.firstChild);
  }
  document.addEventListener('click', e => {
    const t = e.target.closest('button, .map-tag, .choice, .item-use, .ab, .mc-btn, .stab, .mini-seal, .menu-seal');
    if (t && !t.closest('#audio-dock')) MoAudio.uiTap();
  }, true);
}
$('#side').onclick = e => {
  const c = e.target.closest('.side-card'); if (!c || busy || !S || S.dead || S.ascended) return;
  const k = c.dataset.open; if (k === 'gf') openCult('gf'); else if (k === 'fabao') openCult('fabao'); else if (k === 'path') openCult('path'); else if (k === 'bag') openBag(); else if (k === 'sect') openSect(); else if (k === 'cult') openCult(); else act('youli');
};
addEventListener('resize', () => { if (document.body.dataset.screen === 'main') renderSide(); });

/* ================= 键盘：1-4 行动 · Esc 收起 · Enter 确认 · 方向键（地图/斗法） ================= */
const vis = el => !!el && !el.hidden && el.offsetParent !== null && !el.disabled;
const firstVis = (root, sel) => [...root.querySelectorAll(sel)].find(vis);
function topLayer() {
  const ask = document.querySelector('.ask'); if (ask) return ask;
  for (const id of ['scroll-view', 'end', 'rite', 'dan', 'auc', 'duel', 'bt', 'path-cer', 'origin-cer', 'baishan', 'goal-cer', 'modal', 'sheet', 'mj', 'map']) { const el = $('#' + id); if (el && !el.hidden) return el; }
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
    if (L.id === 'scroll-view') { e.preventDefault(); return closeScrollView(); }
    if (L.id === 'sheet') { e.preventDefault(); return closeSheet(); }
    if (L.id === 'map') return click($('#map-close'));
    if (L.id === 'dan') return click($('#dan-close'));
    if (L.id === 'path-cer' || L.id === 'baishan' || L.id === 'origin-cer') {
      e.preventDefault();
      const btn = L.id === 'origin-cer' ? $('#origin-confirm') : L.id === 'baishan' ? $('#baishan-confirm') : $('#path-cer-confirm');
      const foot = L.id === 'origin-cer' ? $('#origin-foot') : L.id === 'baishan' ? $('#baishan-foot') : $('#path-cer-foot');
      if (foot && !foot.hidden && btn && !btn.disabled) { btn.focus(); toast('请点「落定」确认，或按 Enter'); }
      else toast('请先点选一项，再点底部「落定」');
      return;
    }
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
    if (tgt && tgt.tagName === 'BUTTON' && L.contains(tgt) && vis(tgt) && tgt.id !== 'path-cer-confirm' && tgt.id !== 'baishan-confirm') return;
    if (L.classList.contains('ask')) return click(L.querySelector('.ask-ok'));
    if (L.id === 'sheet') return;
    if (L.id === 'path-cer') {
      const b = $('#path-cer-confirm'), f = $('#path-cer-foot');
      if (f && !f.hidden && b && !b.disabled) return click(b);
      toast('请先点选定型'); return;
    }
    if (L.id === 'baishan') {
      const b = $('#baishan-confirm'), f = $('#baishan-foot');
      if (f && !f.hidden && b && !b.disabled) return click(b);
      toast('请先点选门户'); return;
    }
    if (L.id === 'origin-cer') {
      const b = $('#origin-confirm'), f = $('#origin-foot');
      if (f && !f.hidden && b && !b.disabled) return click(b);
      toast('请先点选出身'); return;
    }
    return click(firstVis(L, '.brush-btn:not(.ask-no)'));
  }
});
setScreen('title');
initTitle(); initCreate();
applyLook();
try {
  const mq = matchMedia('(prefers-color-scheme: dark)');
  if (mq && mq.addEventListener) mq.addEventListener('change', () => { if ((readLook().theme || 'auto') === 'auto') applyLook(); });
} catch (e) {}
if (matchMedia('(display-mode: standalone)').matches || navigator.standalone) document.documentElement.dataset.standalone = '1';
const scrollClose = $('#scroll-close');
if (scrollClose) scrollClose.onclick = () => closeScrollView();
const scrollShade = document.querySelector('#scroll-view .scroll-shade');
if (scrollShade) scrollShade.onclick = () => closeScrollView();

function splashWait() {
  const el = document.getElementById('splash');
  if (!el) return Promise.resolve();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.hidden = false;
  if (reduce) {
    el.classList.add('skip');
    return sleep(160).then(() => el.classList.add('gone'));
  }
  requestAnimationFrame(() => el.classList.add('play'));
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.body.classList.add('go', 'hold');
  }));
  return sleep(1280).then(() => { el.classList.add('gone'); return sleep(380); });
}
function mountSW() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol === 'file:') return;
  const had = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('./sw.js?v=49').then(reg => {
    if (!had) return;
    const ask = () => { const bar = document.getElementById('sw-refresh'); if (bar) bar.hidden = false; };
    if (reg.waiting) ask();
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      if (!nw) return;
      nw.addEventListener('statechange', () => { if (nw.state === 'installed' && navigator.serviceWorker.controller) ask(); });
    });
  }).catch(() => {});
  const btn = document.getElementById('sw-refresh-btn');
  if (btn) btn.onclick = () => {
    navigator.serviceWorker.getRegistration().then(reg => {
      const w = reg && reg.waiting;
      if (w) w.postMessage({ type: 'SKIP_WAITING' });
      else location.reload();
    });
  };
}
mountSW();

function retireIntro() {
  const intro = document.getElementById('intro');
  const sp = document.getElementById('splash');
  if (intro) intro.hidden = true;
  if (sp) sp.hidden = true;
  const warm = () => {
    document.querySelectorAll('#realm-scape img').forEach(img => { if (img.decode) img.decode().catch(() => {}); });
  };
  if (window.requestIdleCallback) requestIdleCallback(warm, { timeout: 1200 });
  else setTimeout(warm, 400);
}
// 视觉素材与字体都就绪后再开卷，避免字体替换造成的半截状态
Promise.all([
  initVisuals(),
  Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), sleep(2500)]),
]).catch(() => {}).then(() => splashWait()).then(() => {
  applyLook();
  // 动画层已在卷首遮罩下建好（go+hold）。这里只放开播放。
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (!document.body.classList.contains('go')) document.body.classList.add('go');
    document.body.classList.remove('hold');
    if (typeof Wallpaper !== 'undefined' && Wallpaper.kick) Wallpaper.kick(1000);
  }));
  // 首访不在中途打 intro-done，也不要在墨滴落地时 display:none（会逼 InkGL 重扫、掐断晕开）。
  setTimeout(retireIntro, 4200);
});

/* 日志滚动时短暂显示墨条 */
(() => {
  const log = document.getElementById('log');
  if (!log) return;
  let tmr = 0;
  const mark = () => { log.classList.add('is-scrolling'); clearTimeout(tmr); tmr = setTimeout(() => log.classList.remove('is-scrolling'), 700); };
  log.addEventListener('scroll', mark, { passive: true });
})();

window.__moxian = { get S() { return S; }, set S(v) { S = v; }, get busy() { return busy; }, set busy(v) { busy = v; }, save, render, pushLog, act, openBreak, openBag, openCult, refreshOpenPanel, maybeFabaoCeremony, FabaoArt: typeof FabaoArt !== 'undefined' ? FabaoArt : null, showEnd, openEvent: id => openEvent(EVENTS.find(e => e.id === id)), Core, openSect, runRite, startDabi, dabiInvite, openMission: uid => openEvent(Core.missionEvent(S, uid)), openPathCeremony, ensurePendingPath, pathPage, openBaishan, openOrigin, runBreak, JHUI, BtFx: typeof BtFx !== 'undefined' ? BtFx : null, MoAudio: typeof MoAudio !== 'undefined' ? MoAudio : null, Samsara: typeof Samsara !== 'undefined' ? Samsara : null, openAtlasSheet, openSlots, saveScroll, closeScrollView, maybeGuide, newGame, Slots: typeof Slots !== 'undefined' ? Slots : null, Codec: typeof Codec !== 'undefined' ? Codec : null, ScrollArt: typeof ScrollArt !== 'undefined' ? ScrollArt : null, Life: typeof Life !== 'undefined' ? Life : null, Juan: typeof Juan !== 'undefined' ? Juan : null, InkPortrait: typeof InkPortrait !== 'undefined' ? InkPortrait : null, openGoalPicker, openAnnals, openLook, applyLook };
})();
