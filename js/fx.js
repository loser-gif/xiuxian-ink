/* 墨仙录 · 动效层：视差、季节飘落、动作反馈、墨染转场 */
'use strict';
const FX = (() => {
  const RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => !!(RM && RM.matches);
  const thinNow = () => reduced() || document.documentElement.dataset.motion === 'lite' || document.documentElement.dataset.fx === 'thin';
  const cheapFx = () => document.documentElement.dataset.fx === 'thin' || document.documentElement.dataset.motion === 'lite';
  const coarsePhone = () => !!(window.matchMedia && matchMedia('(pointer: coarse)').matches && Math.min(innerWidth, innerHeight) < 900);
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const $ = s => document.querySelector(s);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ---------- 竖排文字（逐字堆叠，不依赖 writing-mode） ---------- */
  function vtext(el, text) {
    el.textContent = '';
    const cols = String(text).split('\n');
    cols.forEach(t => {
      const c = document.createElement('span'); c.className = 'vcol';
      for (const ch of t) { const i = document.createElement('i'); if (ch === '　' || ch === ' ') i.className = 'sp'; else i.textContent = ch; c.appendChild(i); }
      el.appendChild(c);
    });
    el.setAttribute('aria-label', text.replace(/\n/g, ''));
  }

  /* ---------- 视差：陀螺仪 / 触摸拖动 / 鼠标 ---------- */
  const PX = { tx: 0, ty: 0, x: 0, y: 0, running: false, layers: [], gyro: false, base: null };
  function initParallax() {
    const spec = [['.m1', .16], ['.mist1', .26], ['.m2', .36], ['.mist2', .52], ['.m3', .62], ['.mist3', .8], ['.m4', 1], ['.sun', .08], ['.cranes', .14], ['.atmo-far', .44], ['.atmo-near', .7], ['.lake', .78], ['.pine', 1.45]];
    PX.layers = spec.map(([s, d]) => ({ el: $('#scenery ' + s), d })).filter(l => l.el);
    // 触摸拖动：手指相对按下点的位移，松手后缓缓回中
    let sx = 0, sy = 0, touching = false;
    window.addEventListener('touchstart', e => { if (PX.gyro) return; const t = e.touches[0]; sx = t.clientX; sy = t.clientY; touching = true; }, { passive: true });
    window.addEventListener('touchmove', e => {
      // 手机上滑动日志也会冒泡到这里。视差每帧改十多层，长局会一直发热。
      if (coarsePhone() || PX.gyro || !touching) return; const t = e.touches[0];
      setTarget((t.clientX - sx) / (innerWidth * 0.5), (t.clientY - sy) / (innerHeight * 0.5));
    }, { passive: true });
    const end = () => { touching = false; if (!PX.gyro) setTarget(0, 0); };
    window.addEventListener('touchend', end, { passive: true }); window.addEventListener('touchcancel', end, { passive: true });
    window.addEventListener('mousemove', e => { if (PX.gyro) return; setTarget((e.clientX / innerWidth - .5) * 1.4, (e.clientY / innerHeight - .5) * 1.4); }, { passive: true });
  }
  function setTarget(x, y) {
    if (reduced()) return;
    PX.tx = Math.max(-1, Math.min(1, x)); PX.ty = Math.max(-1, Math.min(1, y));
    if (!PX.running) { PX.running = true; requestAnimationFrame(pxTick); }
  }
  function pxTick() {
    const k = PX.gyro ? 0.07 : 0.06;
    PX.x += (PX.tx - PX.x) * k; PX.y += (PX.ty - PX.y) * k;
    const done = Math.abs(PX.tx - PX.x) < 0.002 && Math.abs(PX.ty - PX.y) < 0.002;
    if (done) { PX.x = PX.tx; PX.y = PX.ty; }
    for (const l of PX.layers) l.el.style.translate = `${(-PX.x * 18 * l.d).toFixed(2)}px ${(-PX.y * 7 * l.d).toFixed(2)}px`;
    if (done) PX.running = false; else requestAnimationFrame(pxTick);
  }
  function onOrient(e) {
    if (e.gamma == null || e.beta == null) return;
    if (!PX.base) PX.base = { b: e.beta, g: e.gamma };
    // 基准缓慢跟随，避免手机姿势改变后永远偏在一边
    PX.base.b += (e.beta - PX.base.b) * 0.004; PX.base.g += (e.gamma - PX.base.g) * 0.004;
    setTarget((e.gamma - PX.base.g) / 18, (e.beta - PX.base.b) / 22);
  }
  // 必须在用户手势（点击“开卷”）里同步调用
  function requestTilt() {
    if (reduced() || coarsePhone() || PX.gyro || PX.asked) return; PX.asked = true;
    const D = window.DeviceOrientationEvent; if (!D) return;
    const on = () => { PX.gyro = true; window.addEventListener('deviceorientation', onOrient); };
    if (typeof D.requestPermission === 'function') D.requestPermission().then(r => { if (r === 'granted') on(); }).catch(() => {});
    else if ('ontouchstart' in window) on();
  }

  /* ---------- 季节飘落 ---------- */
  const W = { cv: null, c: null, parts: [], season: -1, raf: 0, last: 0, w: 0, h: 0, sprites: {} };
  function sprite(kind) {
    if (W.sprites[kind]) return W.sprites[kind];
    const s = 32, cv = document.createElement('canvas'); cv.width = cv.height = s; const c = cv.getContext('2d');
    c.translate(s / 2, s / 2);
    if (kind === 'petal') {
      const g = c.createRadialGradient(-2, 0, 1, 0, 0, 13); g.addColorStop(0, 'rgba(232,170,168,.95)'); g.addColorStop(1, 'rgba(206,120,118,.75)');
      c.fillStyle = g; c.beginPath(); c.moveTo(-12, 0); c.bezierCurveTo(-6, -10, 8, -9, 12, -1); c.lineTo(9, 0); c.lineTo(12, 2); c.bezierCurveTo(8, 9, -6, 9, -12, 0); c.fill();
    } else if (kind === 'leaf') {
      c.fillStyle = 'rgba(150,92,40,.85)'; c.beginPath(); c.moveTo(-13, 0); c.quadraticCurveTo(0, -9, 13, 0); c.quadraticCurveTo(0, 9, -13, 0); c.fill();
      c.strokeStyle = 'rgba(90,50,20,.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-13, 0); c.lineTo(11, 0); c.stroke();
    } else if (kind === 'lotus') {
      c.strokeStyle = 'rgba(62,88,58,.62)'; c.lineWidth = 1.15;
      c.beginPath(); c.ellipse(0, 0, 11, 5.5, -0.5, 0, 7); c.stroke();
      c.beginPath(); c.ellipse(1, 1, 6, 3.4, 0.7, 0, 7); c.stroke();
      c.fillStyle = 'rgba(48,72,44,.16)'; c.beginPath(); c.ellipse(0, 1, 4.5, 2.4, 0, 0, 7); c.fill();
    } else if (kind === 'snow') {
      const g = c.createRadialGradient(0, 0, 0, 0, 0, 9); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.55, 'rgba(250,250,248,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = 'rgba(70,82,94,.34)'; c.beginPath(); c.arc(.8, 1.1, 6.6, 0, 7); c.fill();
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, 9, 0, 7); c.fill();
    }
    return (W.sprites[kind] = cv);
  }
  function resizeWeather() {
    if (!W.cv) return; W.w = innerWidth; W.h = innerHeight;
    // 落花雨雪是小粒子，1.25 倍像素已足；全屏 2× 画布要 5MB，此处仅 2MB
    // 大窗口再限总像素（约 2.6MP），4K 屏也不至于整屏高倍
    const cap = coarsePhone() ? 1 : 1.25;
    const k = Math.min(DPR, cap, Math.sqrt(2.6e6 / (W.w * W.h))); W.k = k;
    W.cv.width = Math.round(W.w * k); W.cv.height = Math.round(W.h * k); W.c.setTransform(k, 0, 0, k, 0, 0);
    if (W.parts && W.season >= 0) fitParts();
  }
  // 粒子数随画面面积增长（以 390×844 为基准，最多 2.4 倍），宽屏不显稀疏。
  // 手机与「简」再收一截，少画少合成。
  function partMul() {
    let m = 1;
    if (coarsePhone()) m *= 0.5;
    if (document.documentElement.dataset.fx === 'thin' || document.documentElement.dataset.motion === 'lite') m *= 0.34;
    return m;
  }
  const partN = s => Math.max(4, Math.round([11, 7, 9, 12][s] * Math.min(1.5, Math.max(1, Math.sqrt((W.w || innerWidth) * (W.h || innerHeight) / (390 * 844)))) * partMul()));
  function fitParts() {
    const n = partN(W.season);
    while (W.parts.length < n) { const p = {}; spawn(p, true); W.parts.push(p); }
    if (W.parts.length > n) W.parts.length = n;
  }
  function scapeBox() {
    const el = document.getElementById('realm-scape');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width < 24 || r.height < 24) return null;
    if (parseFloat(getComputedStyle(el).opacity) < 0.15) return null;
    return r;
  }
  /* 卷首只在绘卷中段落几片，不铺满题字与开卷 */
  function paintZone() {
    if (document.body.dataset.screen === 'title') {
      const w = W.w || innerWidth, h = W.h || innerHeight;
      return { left: w * 0.1, right: w * 0.9, top: h * 0.34, bottom: h * 0.6, width: w * 0.8, height: h * 0.26 };
    }
    return scapeBox();
  }
  function blockBoxes() {
    if ((W.frame & 7) && W.block) return W.block;
    const list = [];
    document.querySelectorAll('#scr-main .log, #scr-main .hud, .title-block, .title-menu, .title-poem, #scr-main .actions, #audio-dock').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      if (el.classList.contains('log')) {
        list.push(r);
        return;
      }
      list.push(r);
    });
    W.block = list;
    return list;
  }
  function overText(x, y, sz) {
    for (const r of W.block || []) {
      if (x + sz > r.left - 3 && x - sz < r.right + 3 && y + sz > r.top - 3 && y - sz < r.bottom + 3) return true;
    }
    return false;
  }
  function spawn(p, init) {
    const s = W.season;
    const z = paintZone();
    if (z) {
      p.x = rnd(z.left + 6, Math.max(z.left + 8, z.right - 6));
      p.y = init ? rnd(z.top + 4, Math.max(z.top + 8, z.bottom - 4)) : rnd(z.top - 16, z.top + 4);
    } else {
      p.x = rnd(8, Math.max(16, W.w * 0.42));
      p.y = init ? rnd(8, W.h * 0.28) : rnd(-24, -6);
    }
    p.z = rnd(.55, 1); p.rot = rnd(0, 6.28); p.spin = rnd(-1.2, 1.2); p.ph = rnd(0, 6.28); p.flip = rnd(1.2, 3);
    if (s === 1) { p.vy = rnd(8, 16) * p.z; p.vx = rnd(-8, 6); p.size = rnd(5.2, 7.4) * p.z; }
    else if (s === 3) { p.vy = rnd(12, 26) * p.z; p.vx = rnd(-5, 5); p.size = rnd(3.4, 5.2) * p.z; }
    else if (s === 2) { p.vy = rnd(18, 32) * p.z; p.vx = rnd(6, 14); p.size = rnd(5, 7.2) * p.z; }
    else { p.vy = rnd(10, 18) * p.z; p.vx = rnd(4, 10); p.size = rnd(5.4, 7.6) * p.z; }
    if (document.body.dataset.screen === 'title') p.size *= 0.62;
  }
  function scheduleWeather() {
    if (W.raf || W.timer) return;
    if (coarsePhone()) W.timer = setTimeout(() => { W.timer = 0; W.raf = requestAnimationFrame(wTick); }, 50);
    else W.raf = requestAnimationFrame(wTick);
  }
  function haltWeather() {
    if (W.raf) cancelAnimationFrame(W.raf);
    W.raf = 0;
    if (W.timer) { clearTimeout(W.timer); W.timer = 0; }
    W.parts = []; W.gold = [];
    if (W.c && W.w) { W.c.setTransform(1, 0, 0, 1, 0, 0); W.c.clearRect(0, 0, W.cv.width, W.cv.height); }
  }
  function setSeason(s) {
    if (thinNow()) { haltWeather(); return; }
    if (!W.cv) { W.cv = $('#weather'); W.c = W.cv.getContext('2d'); resizeWeather(); addEventListener('resize', resizeWeather); document.addEventListener('visibilitychange', () => { if (!document.hidden && !thinNow() && !W.raf && !W.timer && W.season >= 0) { W.last = 0; scheduleWeather(); } }); }
    let n = partN(s);
    if (document.body.dataset.screen === 'title') n = Math.min(n, 4);
    if (s === W.season && W.parts.length === n) return;
    W.season = s;
    W.parts = Array.from({ length: n }, () => { const p = {}; spawn(p, true); return p; });
    if (!W.raf && !W.timer) { W.last = 0; scheduleWeather(); }
  }
  function setGold(realm) {
    if (reduced() || !W.cv) return;
    let n = realm >= 2 ? Math.min(12, 5 + (realm - 2) * 2) : 0;
    if (thinNow()) n = Math.min(n, 3);
    else if (coarsePhone()) n = Math.min(n, 5);
    if ((W.gold || []).length === n) return;
    W.gold = Array.from({ length: n }, () => ({ x: rnd(0, W.w), y: rnd(0, W.h), vy: rnd(5, 12), s: rnd(2, 3.6), spin: rnd(.6, 1.4), ph: rnd(0, 6.28) }));
  }
  let goSeen = 0;
  function introBusy() {
    if (document.body.dataset.screen !== 'title') return false;
    if (!document.body.classList.contains('go') || document.body.classList.contains('hold')) return true;
    if (!goSeen) goSeen = performance.now();
    return performance.now() - goSeen < 900;
  }
  function wTick(t) {
    W.raf = 0;
    if (thinNow()) { haltWeather(); return; }
    if (document.hidden) return;
    if (introBusy()) { scheduleWeather(); return; }
    scheduleWeather();
    const t0 = performance.now();
    W.frame = (W.frame || 0) + 1;
    const dt = W.last ? Math.min(0.05, (t - W.last) / 1000) : 0.016; W.last = t;
    const c = W.c, D = W.k || DPR, s = W.season, time = t / 1000; c.clearRect(0, 0, W.w, W.h);
    const wind = Math.sin(time * 0.23) * 8 + Math.sin(time * 0.071) * 5;
    const zone = paintZone();
    blockBoxes();
    for (const p of W.parts) {
      p.y += p.vy * dt; p.x += (p.vx + wind * p.z) * dt;
      p.x += Math.sin(time * (s === 1 ? 0.7 : 1.1) + p.ph) * (s === 1 ? 6 : 8) * dt * p.z; p.rot += p.spin * dt * (s === 1 ? 0.45 : 1);
      const box = zone;
      const inside = box && p.x > box.left && p.x < box.right && p.y > box.top && p.y < box.bottom;
      if (inside && !overText(p.x, p.y, p.size + 2)) {
        const img = sprite(s === 3 ? 'snow' : s === 2 ? 'leaf' : s === 1 ? 'lotus' : 'petal'), sz = p.size;
        const fl = s === 3 ? 1 : Math.cos(time * p.flip + p.ph);
        c.globalAlpha = (s === 3 ? 0.82 : 0.7) * (0.75 + p.z * 0.25);
        c.setTransform(D * Math.cos(p.rot), D * Math.sin(p.rot), -D * Math.sin(p.rot) * fl, D * Math.cos(p.rot) * fl, p.x * D, p.y * D);
        c.drawImage(img, -sz, -sz, sz * 2, sz * 2);
      }
      const floor = box ? box.bottom + 6 : W.h + 20;
      if (p.y > floor || p.x < -30 || p.x > W.w + 30) spawn(p, false);
    }
    c.setTransform(D, 0, 0, D, 0, 0); c.globalAlpha = 1;
    // 高境界：几片金箔缓缓浮沉，翻转到正面时一闪
    for (const g of W.gold || []) {
      g.y -= g.vy * dt; g.x += (Math.sin(time * .3 + g.ph) * 6 + wind * .3) * dt;
      if (g.y < -20) { g.y = W.h + 20; g.x = rnd(0, W.w); }
      if (overText(g.x, g.y, 8)) continue;
      const f = Math.cos(time * g.spin + g.ph), gl = Math.pow(Math.max(0, f), 8);
      c.setTransform(D, 0, 0, D, g.x * D, g.y * D); c.rotate(time * .2 + g.ph); c.scale(g.s, g.s * (.2 + .8 * Math.abs(f)));
      c.globalAlpha = .28 + .5 * gl; c.fillStyle = gl > .3 ? '#f6e3a8' : '#c49a4a';
      c.beginPath(); c.moveTo(-1, -.6); c.lineTo(.9, -.9); c.lineTo(.7, .8); c.lineTo(-.8, .7); c.closePath(); c.fill();
    }
    if (W.gold && W.gold.length) { c.setTransform(D, 0, 0, D, 0, 0); c.globalAlpha = 1; }
    noteCost(performance.now() - t0);
  }

  /* 落花这一帧若画太久，就把动效收薄。不再另开一条永远醒着的 rAF。 */
  let costBad = 0;
  function noteCost(ms) {
    const root = document.documentElement;
    if (root.dataset.motion === 'lite' || root.dataset.fx === 'thin' || reduced()) { costBad = 0; return; }
    if (ms > 26) {
      costBad++;
      if (costBad >= 4) {
        root.dataset.fx = 'thin';
        syncMotion();
        if (typeof Wallpaper !== 'undefined' && Wallpaper.syncMotion) Wallpaper.syncMotion();
      }
    } else costBad = 0;
  }
  function syncMotion() {
    if (thinNow()) { haltWeather(); return; }
    if (W.season >= 0 && W.cv) {
      fitParts();
      if (W.gold && thinNow()) W.gold.length = Math.min(W.gold.length, 3);
      if (!W.raf && !W.timer && !document.hidden) { W.last = 0; scheduleWeather(); }
    }
  }

  /* ---------- 一次性粒子（吐纳聚气 / 破境金屑） ---------- */
  // 画布只覆盖粒子所在区域（而非全屏），减少每帧合成面积
  const P = { cv: null, c: null, list: [], raf: 0, x: 0, y: 0, w: 0, h: 0 };
  function pInit() { if (!P.cv) { P.cv = $('#fx'); P.c = P.cv.getContext('2d'); } }
  function pBounds(b) {
    const x = Math.max(0, Math.floor(b[0])), y = Math.max(0, Math.floor(b[1]));
    const w = Math.min(innerWidth, Math.ceil(b[0] + b[2])) - x, h = Math.min(innerHeight, Math.ceil(b[1] + b[3])) - y;
    Object.assign(P, { x, y, w, h });
    const st = P.cv.style; st.left = x + 'px'; st.top = y + 'px'; st.width = w + 'px'; st.height = h + 'px';
    P.cv.width = Math.round(w * DPR); P.cv.height = Math.round(h * DPR);
  }
  function pRun(sys, bounds) {
    pInit();
    if (!P.list.length) pBounds(bounds || [0, 0, innerWidth, innerHeight]);
    else if (bounds) { // 合并区域
      const x0 = Math.min(P.x, bounds[0]), y0 = Math.min(P.y, bounds[1]);
      const x1 = Math.max(P.x + P.w, bounds[0] + bounds[2]), y1 = Math.max(P.y + P.h, bounds[1] + bounds[3]);
      if (x0 < P.x || y0 < P.y || x1 > P.x + P.w || y1 > P.y + P.h) pBounds([x0, y0, x1 - x0, y1 - y0]);
    }
    P.list.push(sys); if (!P.raf) P.raf = requestAnimationFrame(pTick);
  }
  function pTick(t) {
    const c = P.c; c.setTransform(DPR, 0, 0, DPR, -P.x * DPR, -P.y * DPR); c.clearRect(P.x, P.y, P.w, P.h);
    P.list = P.list.filter(s => { if (!s.t0) s.t0 = t; return s.draw(c, (t - s.t0) / 1000) !== false; });
    if (P.list.length) P.raf = requestAnimationFrame(pTick); else { P.raf = 0; c.clearRect(P.x, P.y, P.w, P.h); }
  }
  const easeIn = x => x * x * x, easeOut = x => 1 - Math.pow(1 - x, 3);
  // 吐纳：淡墨灵气自四方旋入丹田（柔边墨点 + 渐隐拖尾）
  let mote = null;
  function moteSprite() {
    if (mote) return mote;
    const cv = document.createElement('canvas'); cv.width = cv.height = 48; const c = cv.getContext('2d');
    const g = c.createRadialGradient(24, 24, 0, 24, 24, 24);
    g.addColorStop(0, 'rgba(27,24,20,.9)'); g.addColorStop(.25, 'rgba(27,24,20,.55)'); g.addColorStop(.6, 'rgba(27,24,20,.12)'); g.addColorStop(1, 'rgba(27,24,20,0)');
    c.fillStyle = g; c.fillRect(0, 0, 48, 48); return (mote = cv);
  }
  function qiSwirl(cx, cy, done) {
    if (reduced()) { done && done(); return; }
    const img = moteSprite();
    const N = 26, parts = Array.from({ length: N }, (_, i) => ({ a: (i / N) * 6.283 + rnd(-.2, .2), r: rnd(150, 260), d: rnd(0, .25), s: rnd(3.5, 7), w: rnd(2.4, 3.2) }));
    const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    const pos = (p, k) => { const e = ease(Math.max(0, Math.min(1, k))), r = p.r * (1 - e), a = p.a + e * p.w; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * .55, e]; };
    let fired = false;
    pRun({ draw(c, t) {
      const dur = 1.0;
      for (const p of parts) {
        const k = (t - p.d) / dur; if (k <= 0 || k >= 1.02) continue;
        const fade = Math.sin(Math.PI * Math.min(1, k)) * .62;
        for (let j = 5; j >= 0; j--) {          // 拖尾：越往后越淡越小
          const [x, y, e] = pos(p, k - j * .022);
          const sz = p.s * (1 - e * .55) * (1 - j * .13);
          c.globalAlpha = fade * (1 - j * .17);
          c.drawImage(img, x - sz, y - sz, sz * 2, sz * 2);
        }
      }
      c.globalAlpha = 1;
      const g = (t - 1.12) / .9;
      if (g > 0) {
        if (!fired) { fired = true; done && done(); }
        if (g < 1) {   // 丹田一圈墨晕
          const rr = 8 + easeOut(g) * 54, gr = c.createRadialGradient(cx, cy, rr * .55, cx, cy, rr);
          gr.addColorStop(0, 'rgba(27,24,20,0)'); gr.addColorStop(.7, `rgba(27,24,20,${.16 * (1 - g)})`); gr.addColorStop(1, 'rgba(27,24,20,0)');
          c.fillStyle = gr; c.beginPath(); c.ellipse(cx, cy, rr, rr * .6, 0, 0, 7); c.fill();
          c.globalAlpha = .5 * (1 - g); c.drawImage(img, cx - 10, cy - 10, 20, 20); c.globalAlpha = 1;
        }
      }
      return t < 2.1;
    } }, [cx - 290, cy - 170, 580, 340]);
  }
  // 破境成功：金箔碎片缓缓升腾、翻转时闪光
  function goldMotes(cx, cy, n = 34) {
    if (reduced()) return;
    const parts = Array.from({ length: n }, () => {
      const k = 3 + Math.floor(rnd(0, 3)), pts = Array.from({ length: k }, (_, i) => { const a = i / k * 6.283 + rnd(-.4, .4), r = rnd(.6, 1); return [Math.cos(a) * r, Math.sin(a) * r]; });
      return { x: cx + rnd(-150, 150), y: cy + rnd(-30, 190), vy: rnd(-34, -12), vx: rnd(-8, 8), s: rnd(2.2, 5.2), d: rnd(0, 2.2), ph: rnd(0, 6.28), spin: rnd(1.2, 3.2), rot: rnd(0, 6.28), life: rnd(3, 4.8), pts };
    });
    pRun({ draw(c, t) {
      let alive = false;
      for (const p of parts) {
        const tt = t - p.d, k = tt / p.life; if (k < 0) { alive = true; continue; } if (k > 1) continue; alive = true;
        const x = p.x + p.vx * tt + Math.sin(tt * 1.3 + p.ph) * 9, y = p.y + p.vy * tt;
        const flip = Math.cos(tt * p.spin + p.ph), glint = Math.pow(Math.max(0, flip), 6);
        const al = Math.sin(Math.PI * Math.min(1, k * 1.2)) * (.55 + .45 * Math.abs(flip));
        c.save(); c.translate(x, y); c.rotate(p.rot + tt * .4); c.scale(p.s, p.s * (.25 + .75 * Math.abs(flip)));
        c.beginPath(); p.pts.forEach(([a, b], i) => i ? c.lineTo(a, b) : c.moveTo(a, b)); c.closePath();
        const L = 150 + glint * 100;
        c.fillStyle = `rgba(${Math.min(255, 196 + glint * 59)},${Math.min(255, L)},${Math.round(70 + glint * 150)},${al})`; c.fill();
        c.restore();
        if (glint > .5) { const g = c.createRadialGradient(x, y, 0, x, y, p.s * 3.5); g.addColorStop(0, `rgba(255,240,200,${glint * al * .7})`); g.addColorStop(1, 'rgba(255,240,200,0)'); c.fillStyle = g; c.fillRect(x - p.s * 4, y - p.s * 4, p.s * 8, p.s * 8); }
      }
      return alive || t < .2;
    } }, [cx - 200, cy - 260, 400, 480]);
  }

  /* ---------- 闭关：洞府渐暗 ---------- */
  async function cave() {
    if (reduced()) return;
    const el = $('#cave'); el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    await sleep(2350); el.classList.remove('on');
  }

  /* ---------- 游历：山路一笔（淡墨笔触，画在纸下，起笔按、收笔飞白） ---------- */
  let pathCv = null;
  function stampSprite() {
    if (stampSprite.c) return stampSprite.c;
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d');
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(24,23,26,1)'); g.addColorStop(.55, 'rgba(24,23,26,.85)'); g.addColorStop(.8, 'rgba(30,32,40,.25)'); g.addColorStop(1, 'rgba(30,32,40,0)');
    c.fillStyle = g; c.fillRect(0, 0, 64, 64); return (stampSprite.c = cv);
  }
  function inkPath() {
    if (reduced()) return Promise.resolve();
    const host = $('.scroll-paper'); if (!host) return Promise.resolve();
    if (!pathCv) { pathCv = document.createElement('canvas'); pathCv.className = 'path-ink'; pathCv.setAttribute('aria-hidden', 'true'); }
    if (pathCv.parentNode !== host) host.insertBefore(pathCv, host.querySelector('.log'));
    const Wd = host.clientWidth, H = host.clientHeight, k = Math.min(DPR, 2);
    pathCv.width = Math.round(Wd * k); pathCv.height = Math.round(H * k);
    const c = pathCv.getContext('2d'); c.setTransform(k, 0, 0, k, 0, 0); c.clearRect(0, 0, Wd, H);
    pathCv.classList.remove('out'); pathCv.classList.add('on');
    // 山路沿卷底远山蜿蜒而上：起于左下，止于右侧山腰
    const pts = [[Wd * .06, H * .95], [Wd * .3, H * rnd(.86, .9)], [Wd * .52, H * rnd(.9, .93)], [Wd * .72, H * rnd(.78, .82)], [Wd * .86, H * rnd(.7, .74)]];
    const seg = [];
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], mx = (x0 + x1) / 2;
      for (let j = 0; j < 40; j++) { const t = j / 40, u = 1 - t;
        seg.push([u*u*u*x0 + 3*u*u*t*mx + 3*u*t*t*mx + t*t*t*x1, u*u*u*y0 + 3*u*u*t*y0 + 3*u*t*t*y1 + t*t*t*y1]); }
    }
    seg.push(pts[pts.length - 1]);
    // 等距重采样
    const P = [seg[0]], STEP = .6; let carry = 0;
    for (let i = 1; i < seg.length; i++) {
      const [ax, ay] = seg[i - 1], [bx, by] = seg[i], d = Math.hypot(bx - ax, by - ay);
      let s0 = STEP - carry;
      for (; s0 <= d; s0 += STEP) P.push([ax + (bx - ax) * s0 / d, ay + (by - ay) * s0 / d]);
      carry = d - (s0 - STEP);
    }
    const N = P.length, img = stampSprite(), D = 1150, t0 = performance.now(), ph = rnd(0, 9);
    const bristles = [-.62, -.25, .12, .5, .8].map(o => ({ o, cut: rnd(.72, .95) }));
    let drawn = 0;
    return new Promise(res => {
      const frame = now => {
        const k2 = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k2, 2.4);   // 行笔先快后缓
        const upto = Math.floor(e * (N - 1));
        for (; drawn <= upto; drawn++) {
          const i = drawn, t = i / (N - 1), [x, y] = P[i], q = P[Math.min(N - 1, i + 8)], pr = P[Math.max(0, i - 8)];
          let nx = -(q[1] - pr[1]), ny = q[0] - pr[0]; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
          // 起笔按（略重）→ 行笔 → 收笔提（变细、飞白）
          const press = 1 + .7 * Math.exp(-t * 18), lift = 1 - Math.pow(Math.max(0, (t - .55) / .45), 1.6) * .75;
          const wob = .85 + .3 * Math.sin(t * 23 + ph) * Math.sin(t * 7.3 + ph * 2);
          const w = 2.5 * press * lift * wob;
          if (i % 5 === 0) { c.globalAlpha = .03; c.drawImage(img, x - w * 4, y - w * 4, w * 8, w * 8); }   // 淡墨洇晕
          if (t < .58) { c.globalAlpha = .12; c.drawImage(img, x - w, y - w, w * 2, w * 2); }
          else for (const b of bristles) {                                                          // 散锋飞白
            if (t > b.cut || Math.sin(i * .045 + b.o * 11 + ph) > .7) continue;
            const r = Math.max(.45, w * .42), bx = x + nx * b.o * w, by = y + ny * b.o * w;
            c.globalAlpha = .16; c.drawImage(img, bx - r, by - r, r * 2, r * 2);
          }
        }
        c.globalAlpha = 1;
        if (k2 < 1) return requestAnimationFrame(frame);
        setTimeout(() => { pathCv.classList.add('out'); setTimeout(() => { pathCv.classList.remove('on', 'out'); c.clearRect(0, 0, Wd, H); }, 900); }, 250);
        res();
      };
      requestAnimationFrame(frame);
    });
  }

  /* ---------- 墨落入水 / 一笔扫过 ---------- */
  let washBusy = false;
  let dropCv = null;
  let dropGen = 0;

  const DROP_VERT = 'attribute vec2 aPos; varying vec2 vUv; void main(){ vUv = aPos * .5 + .5; gl_Position = vec4(aPos, 0., 1.); }';
  const DROP_FRAG = [
    'precision highp float;',
    'varying vec2 vUv;',
    'uniform vec2 uRes, uC;',
    'uniform float uK, uFade, uSeed, uCheap;',
    'float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',
    'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x), u.y); }',
    'float fbm(vec2 p){',
    '  float v = 0., a = .5, sum = 0.;',
    '  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);',
    '  v += a * noise(p); sum += a; p = m * p; a *= .5;',
    '  v += a * noise(p); sum += a; p = m * p; a *= .5;',
    '  if (uCheap < .5) { v += a * noise(p); sum += a; p = m * p; a *= .5; v += a * noise(p); sum += a; }',
    '  return v / sum;',
    '}',
    'void main(){',
    '  vec2 px = vUv * uRes;',
    '  float m = min(uRes.x, uRes.y);',
    '  vec2 p = (px - uC) / m;',
    '  float s = uSeed;',
    '  vec2 w = vec2(fbm(p * 1.05 + s), fbm(p * 1.05 + s + 5.2)) - .5;',
    '  vec2 q = p + w * (.16 + .48 * uK);',
    '  if (uCheap < .5) {',
    '    vec2 w2 = vec2(fbm(q * 2.1 + s + 1.8), fbm(q * 2.1 + s + 8.4)) - .5;',
    '    q += w2 * .22 * uK;',
    '  }',
    '  float ang = atan(q.y, q.x);',
    '  float lobe = 1. + .30 * sin(ang * 2. + s) + .18 * sin(ang * 3. + s * 1.7) + .10 * sin(ang * 5. - s * .4);',
    '  float n = fbm(q * 1.15 + s * 1.1);',
    '  float n2 = fbm(q * 2.35 + s * 2.2);',
    '  float R = uK * 1.02 * lobe * (.62 + .70 * n);',
    '  R += (n2 - .5) * .22 * uK;',
    '  if (uCheap < .5) {',
    '    float n3 = fbm(q * 4.4 + vec2(s * 1.4, n));',
    '    float ridge = 1. - abs(n3 * 2. - 1.);',
    '    R += smoothstep(.62, .90, ridge) * .10 * uK;',
    '  }',
    '  float floorR = mix(0., 1.12, smoothstep(.80, 1., uK));',
    '  R = max(R, floorR);',
    '  float d = length(q);',
    '  float sd = d - R;',
    '  float tw = d / max(R, .001);',
    '  tw += (fbm(q * 1.45 + s * 2.6) - .5) * .20;',
    '  vec3 deep = vec3(.169, .149, .129);',
    '  vec3 midc = vec3(.255, .224, .196);',
    '  vec3 pale = vec3(.353, .322, .282);',
    '  vec3 wash = vec3(.47, .43, .38);',
    '  vec3 col = mix(deep, midc, smoothstep(.08, .24, tw));',
    '  col = mix(col, pale, smoothstep(.40, .62, tw));',
    '  col = mix(col, wash, smoothstep(.74, .96, tw));',
    '  float pools = fbm(q * .9 + s * 3.3);',
    '  col = mix(col, midc, smoothstep(.45, .80, pools) * .48 * smoothstep(.14, .42, tw));',
    '  col = mix(col, deep, smoothstep(.55, .90, 1. - pools) * .40 * (1. - smoothstep(.04, .20, tw)));',
    '  float body = smoothstep(.040, -.018, sd);',
    '  float halo = smoothstep(.13, .018, sd) * (1. - body);',
    '  float rim = exp(-pow((sd + .006) / .018, 2.));',
    '  vec3 rimC = vec3(.11, .09, .075);',
    '  col = mix(col, rimC, rim * smoothstep(.05, -.015, sd) * .9);',
    '  col = mix(col, wash, halo * .8);',
    '  float a = body * .98;',
    '  a += halo * .38;',
    '  a = clamp(a, 0., .98) * (1. - uFade);',
    '  gl_FragColor = vec4(col, a);',
    '}',
  ].join('\n');

  function armSkip() {
    const gate = { skip: false, down: false };
    const stop = e => { e.preventDefault(); e.stopPropagation(); };
    const onDown = e => {
      if (e.button != null && e.button !== 0) return;
      gate.skip = true; gate.down = true; stop(e);
    };
    const onUp = e => { gate.down = false; stop(e); };
    const onKey = e => {
      if (e.repeat) return;
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { gate.skip = true; stop(e); }
    };
    const onClick = e => stop(e);
    const opt = { capture: true, passive: false };
    window.addEventListener('pointerdown', onDown, opt);
    window.addEventListener('pointerup', onUp, opt);
    window.addEventListener('pointercancel', onUp, opt);
    window.addEventListener('click', onClick, true);
    window.addEventListener('keydown', onKey, true);
    gate.off = () => {
      window.removeEventListener('pointerdown', onDown, opt);
      window.removeEventListener('pointerup', onUp, opt);
      window.removeEventListener('pointercancel', onUp, opt);
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('keydown', onKey, true);
    };
    return gate;
  }
  function settle(gate) {
    if (!gate || !gate.down) return Promise.resolve();
    return new Promise(resolve => {
      const up = ev => {
        if (ev) { ev.preventDefault(); ev.stopPropagation(); }
        window.removeEventListener('pointerup', up, true);
        window.removeEventListener('pointercancel', up, true);
        const eat = e => { e.preventDefault(); e.stopPropagation(); window.removeEventListener('click', eat, true); };
        window.addEventListener('click', eat, true);
        setTimeout(() => { window.removeEventListener('click', eat, true); resolve(); }, 60);
      };
      window.addEventListener('pointerup', up, true);
      window.addEventListener('pointercancel', up, true);
    });
  }
  function sizePass(cv, thin) {
    const vw = Math.max(1, innerWidth), vh = Math.max(1, innerHeight);
    let w, h;
    if (thin) {
      const s = Math.min(1, 640 / Math.max(vw, vh));
      w = Math.max(2, Math.round(vw * s));
      h = Math.max(2, Math.round(vh * s));
      cv.style.filter = 'blur(1.4px)';
    } else {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(2, Math.round(vw * dpr));
      h = Math.max(2, Math.round(vh * dpr));
      cv.style.filter = '';
    }
    if (cv.width !== w) cv.width = w;
    if (cv.height !== h) cv.height = h;
  }
  function takeDrop(host) {
    if (!dropCv) {
      dropCv = document.createElement('canvas');
      dropCv.className = 'ink-pass';
      dropCv.setAttribute('aria-hidden', 'true');
    }
    if (dropCv.parentNode !== host) host.appendChild(dropCv);
    dropCv.style.opacity = '1';
    return dropCv;
  }
  function linkDrop(gl, frag) {
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); gl.deleteShader(s); return null; }
      return s;
    };
    const vs = sh(gl.VERTEX_SHADER, DROP_VERT);
    const fs = sh(gl.FRAGMENT_SHADER, frag);
    if (!vs || !fs) return null;
    const p = gl.createProgram();
    gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(p)); return null; }
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    return {
      p, buf,
      aPos: gl.getAttribLocation(p, 'aPos'),
      uRes: gl.getUniformLocation(p, 'uRes'),
      uC: gl.getUniformLocation(p, 'uC'),
      uK: gl.getUniformLocation(p, 'uK'),
      uFade: gl.getUniformLocation(p, 'uFade'),
      uSeed: gl.getUniformLocation(p, 'uSeed'),
      uCheap: gl.getUniformLocation(p, 'uCheap'),
    };
  }
  function prepDropGL(cv, thin) {
    if (cv.__dropFailed) return null;
    const attrib = { alpha: true, premultipliedAlpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: true };
    const gl = cv.__gl || cv.getContext('webgl', attrib) || cv.getContext('experimental-webgl', attrib);
    if (!gl) { cv.__dropFailed = true; return null; }
    cv.__gl = gl;
    if (gl.isContextLost && gl.isContextLost()) { cv.__dropFailed = true; return null; }
    if (!cv.__dropProg) {
      let P = linkDrop(gl, DROP_FRAG);
      if (!P) P = linkDrop(gl, DROP_FRAG.replace('precision highp float;', 'precision mediump float;'));
      if (!P) { cv.__dropFailed = true; return null; }
      cv.__dropProg = P;
    }
    cv.__dropCheap = thin ? 1 : 0;
    return { gl, P: cv.__dropProg };
  }
  function drawDropGL(pack, cv, grow, fade, seed) {
    const gl = pack.gl, P = pack.P;
    gl.viewport(0, 0, cv.width, cv.height);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(P.p);
    gl.bindBuffer(gl.ARRAY_BUFFER, P.buf);
    gl.enableVertexAttribArray(P.aPos);
    gl.vertexAttribPointer(P.aPos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(P.uRes, cv.width, cv.height);
    gl.uniform2f(P.uC, cv.width * 0.5, cv.height * 0.5);
    gl.uniform1f(P.uK, grow);
    gl.uniform1f(P.uFade, fade);
    gl.uniform1f(P.uSeed, seed);
    gl.uniform1f(P.uCheap, cv.__dropCheap || 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  function softSprite() {
    if (softSprite.cv) return softSprite.cv;
    const s = 512, cv = document.createElement('canvas'); cv.width = cv.height = s;
    const c = cv.getContext('2d');
    const R = n => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
    for (let i = 0; i < 8; i++) {
      const a = R(i + 1) * 6.28, d = s * (0.02 + R(i + 2) * 0.08);
      const x = s / 2 + Math.cos(a) * d, y = s / 2 + Math.sin(a) * d;
      const r = s * (0.24 + R(i + 3) * 0.2);
      const g = c.createRadialGradient(x, y, r * 0.02, x, y, r);
      const deep = i < 2 ? 0.7 : i < 5 ? 0.38 : 0.14;
    g.addColorStop(0, 'rgba(43,38,33,' + deep + ')');
    g.addColorStop(0.35, 'rgba(64,56,48,' + (deep * 0.62) + ')');
    g.addColorStop(0.68, 'rgba(90,82,72,' + (deep * 0.28) + ')');
    g.addColorStop(1, 'rgba(122,110,96,0)');
      c.fillStyle = g; c.fillRect(0, 0, s, s);
    }
    return (softSprite.cv = cv);
  }
  function drawDrop2D(ctx, cv, grow, fade, seed, thin) {
    const w = cv.width, h = cv.height, sprite = softSprite();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const cx = w * 0.5, cy = h * 0.5, m = Math.min(w, h);
    const base = m * 1.15 * grow;
    const lobes = thin ? 4 : 7;
    for (let i = 0; i < lobes; i++) {
      const ang = seed + i * (6.28 / lobes);
      const reach = 0.55 + 0.55 * Math.abs(Math.sin(seed * 1.7 + i * 1.3));
      const ox = Math.cos(ang) * base * 0.22 * reach, oy = Math.sin(ang * 0.9) * base * 0.16 * reach;
      const rw = base * (0.42 + 0.38 * reach);
      const rh = base * (0.36 + 0.34 * Math.cos(seed + i));
      ctx.globalAlpha = (1 - fade) * (i === 0 ? 0.72 : 0.38);
      ctx.drawImage(sprite, cx + ox - rw, cy + oy - rh, rw * 2, rh * 2);
    }
    ctx.globalAlpha = 1;
  }
  function playInk(opt) {
    const host = opt.host;
    if (!host) return Promise.resolve();
    const thin = !!opt.thin;
    const maxGrow = opt.maxGrow == null ? 1 : opt.maxGrow;
    const growMs = opt.growMs || 500;
    const fadeMs = opt.fadeMs || 260;
    const gate = opt.gate;
    const onCover = opt.onCover;
    const gen = ++dropGen;
    return new Promise(resolve => {
      const cv = takeDrop(host);
      sizePass(cv, thin);
      const pack = prepDropGL(cv, thin);
      const ctx = pack ? null : cv.getContext('2d', { alpha: true });
      const seed = 1.3 + Math.random() * 6.5;
      const t0 = performance.now();
      let dead = false, mode = 'grow', fadeT0 = 0, started = false;
      const finish = () => {
        if (dead) return;
        dead = true;
        if (gen === dropGen && cv.parentNode) cv.parentNode.removeChild(cv);
        resolve();
      };
      const frame = now => {
        if (dead) return;
        if (gen !== dropGen) { dead = true; resolve(); return; }
        const skip = !!(gate && gate.skip);
        const elapsed = Math.max(0, now - t0);
        const gk = Math.min(1, elapsed / growMs);
        const e = gk < 0.5 ? 2 * gk * gk : 1 - Math.pow(-2 * gk + 2, 2) / 2;
        const full = skip || mode !== 'grow' || e >= 0.98 || elapsed >= growMs;
        const grow = (full ? 1 : e) * maxGrow;
        const fade = mode === 'fade' && !skip ? Math.min(1, (now - fadeT0) / fadeMs) : 0;
        if (pack) drawDropGL(pack, cv, grow, fade, seed);
        else drawDrop2D(ctx, cv, grow, fade, seed, thin);
        const ready = full;
        if (onCover && !started && ready) {
          started = true;
          mode = 'wait';
          let p;
          try { p = Promise.resolve(onCover()); }
          catch (err) { p = Promise.resolve(); }
          p.then(() => {
            if (dead || gen !== dropGen) return;
            if (gate && gate.skip) { finish(); return; }
            mode = 'fade';
            fadeT0 = performance.now();
            requestAnimationFrame(frame);
          }, () => finish());
          return;
        }
        if (!onCover && mode === 'grow' && ready) {
          mode = 'fade';
          fadeT0 = now;
          if (skip) { finish(); return; }
        }
        if (skip && mode !== 'wait') { finish(); return; }
        if (mode === 'fade' && (now - fadeT0) >= fadeMs) { finish(); return; }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  }
  function fadeEl(el, a, b, ms, gate) {
    if (!el) return Promise.resolve();
    if (gate && gate.skip) { el.style.opacity = String(b); return Promise.resolve(); }
    const anim = el.animate([{ opacity: a }, { opacity: b }], { duration: ms, fill: 'forwards', easing: 'ease' });
    return new Promise(resolve => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearInterval(t);
        anim.cancel();
        el.style.opacity = String(b);
        resolve();
      };
      const t = setInterval(() => { if (gate && gate.skip) finish(); }, 32);
      anim.finished.then(finish).catch(finish);
    });
  }
  async function wash(swap) {
    const u = $('#wash');
    if (!u) { await swap(); return; }
    if (washBusy) { await swap(); return; }
    washBusy = true;
    const gate = armSkip();
    try {
      const ae = document.activeElement;
      if (ae && ae.blur && ae !== document.body) ae.blur();
      u.classList.add('on');
      if (reduced()) {
        const f = u.querySelector('.wash-full');
        await fadeEl(f, 0, 1, 250, gate);
        await swap();
        if (!gate.skip) await fadeEl(f, 1, 0, 280, gate);
        if (f) { f.style.opacity = '0'; f.getAnimations().forEach(a => a.cancel()); }
      } else {
        await playInk({
          host: u, thin: cheapFx(), maxGrow: 1, growMs: 500, fadeMs: 260, gate, onCover: swap,
        });
      }
      await settle(gate);
    } finally {
      gate.off();
      u.classList.remove('on');
      washBusy = false;
    }
  }
  function titleDrop() {
    if (reduced() || coarsePhone() || document.body.classList.contains('intro-done')) return;
    setTimeout(() => {
      if (washBusy || reduced() || document.body.classList.contains('intro-done')) return;
      const host = $('#intro'); if (!host) return;
      playInk({ host, thin: cheapFx(), maxGrow: 0.42, growMs: 420, fadeMs: 460 });
    }, 560);
  }
  function brushHash(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  function brushSweep(opt) {
    opt = opt || {};
    if (reduced()) return Promise.resolve();
    const host = opt.host;
    if (!host) return Promise.resolve();
    const thin = opt.thin != null ? !!opt.thin : cheapFx();
    const broken = !!opt.broken;
    const strokeMs = opt.dur || 700;
    const paperMs = 150;
    const seal = opt.seal || '';
    const paper = document.createElement('div');
    paper.className = 'brush-paper';
    paper.setAttribute('aria-hidden', 'true');
    host.appendChild(paper);
    const cv = document.createElement('canvas');
    cv.className = 'ink-pass brush-pass';
    cv.setAttribute('aria-hidden', 'true');
    host.appendChild(cv);
    const dpr = thin ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.max(1, innerWidth), H = Math.max(1, innerHeight);
    const narrow = W < H;
    cv.width = Math.max(2, Math.round(W * dpr));
    cv.height = Math.max(2, Math.round(H * dpr));
    const c = cv.getContext('2d');
    const gate = armSkip();
    host.classList.add('brush-on');
    const nameEl = host.querySelector('.bt-big');
    if (nameEl) {
      nameEl.style.position = 'absolute';
      nameEl.style.left = '0';
      nameEl.style.right = '0';
      nameEl.style.top = '12%';
      nameEl.style.margin = '0 auto';
      nameEl.style.width = 'max-content';
      nameEl.style.zIndex = '5';
      nameEl.style.color = '#1e1a16';
      nameEl.style.textShadow = 'none';
    }
    const xA = W * (narrow ? 0.086 : 0.11);
    const xB = W * (broken ? 0.58 : (narrow ? 0.92 : 0.87));
    const cy = H * 0.5;
    const lift = H * (narrow ? 0.025 : 0.035);
    const p0 = [xA, cy];
    const p1 = [xA + (xB - xA) * 0.33, cy - lift];
    const p2 = [xA + (xB - xA) * 0.66, cy - lift * 0.85];
    const p3 = [xB, cy - lift * 0.15];
    const limitT = broken ? 0.66 : 1;
    const maxHalf = H * (narrow ? 0.042 : 0.068);
    const nBrist = thin ? 22 : (narrow ? 36 : 46);
    const bristles = [];
    for (let i = 0; i < nBrist; i++) {
      const o = ((i + 0.5) / nBrist - 0.5) * 2;
      const edge = Math.abs(o);
      let life = 0.45 + brushHash(i + 4) * 0.55;
      if (edge > 0.8) life = 0.45 + brushHash(i + 6) * 0.3;
      if (broken) life = Math.min(life, 0.62 + brushHash(i + 8) * 0.2);
      const tone = brushHash(i + 12);
      bristles.push({
        i,
        o,
        bias: (brushHash(i + 3) - 0.5) * 0.035,
        life,
        phase: brushHash(i + 9) * 6.28,
        freq: 1.05 + brushHash(i + 2) * 1.5,
        tone,
        color: inkTone(tone),
      });
    }
    function inkTone(h) {
      const t = h * 0.42;
      const r = Math.round(0x1e + (0x5c - 0x1e) * t);
      const g = Math.round(0x1a + (0x50 - 0x1a) * t);
      const b = Math.round(0x16 + (0x44 - 0x16) * t);
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    }
    const bez = (t, a, b, c0, d) => {
      const u = 1 - t;
      return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c0 + t * t * t * d;
    };
    const dbez = (t, a, b, c0, d) => {
      const u = 1 - t;
      return 3 * u * u * (b - a) + 6 * u * t * (c0 - b) + 3 * t * t * (d - c0);
    };
    const sample = t => {
      const x = bez(t, p0[0], p1[0], p2[0], p3[0]);
      const y = bez(t, p0[1], p1[1], p2[1], p3[1]);
      let dx = dbez(t, p0[0], p1[0], p2[0], p3[0]);
      let dy = dbez(t, p0[1], p1[1], p2[1], p3[1]);
      const len = Math.hypot(dx, dy) || 1;
      dx /= len; dy /= len;
      return { x, y, tx: dx, ty: dy, nx: -dy, ny: dx };
    };
    const envelope = tn => {
      const peakAt = 0.27;
      const head = 0.84;
      const tail = 0.36;
      let w;
      if (tn < peakAt) {
        const u = tn / peakAt;
        const s = u * u * (3 - 2 * u);
        w = head + (1 - head) * s;
      } else {
        const u = (tn - peakAt) / (1 - peakAt);
        const s = u * u * (3 - 2 * u);
        w = 1 + (tail - 1) * s;
      }
      return maxHalf * w;
    };
    const coverage = (tn, life) => {
      if (tn >= life) return 0;
      const start = Math.max(0.42, life - 0.22);
      if (tn <= start) return 1;
      const u = (tn - start) / Math.max(0.04, life - start);
      const s = u * u * (3 - 2 * u);
      return 1 - s;
    };
    const paintSeal = k => {
      if (broken || !seal || k < 0.82) return;
      const tip = sample(Math.min(limitT, 0.93));
      const fullW = maxHalf * 2;
      const s = Math.min(H * 0.07, fullW * 0.9);
      const press = Math.min(1, (k - 0.82) / 0.16);
      const sc = 1.22 - 0.22 * (1 - Math.pow(1 - press, 2));
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.filter = 'none';
      c.save();
      c.translate(tip.x, tip.y + s * 0.42);
      c.rotate(-0.07);
      c.scale(sc, sc);
      c.globalAlpha = Math.min(1, press * 1.35);
      c.fillStyle = '#9d342e';
      c.fillRect(-s / 2, -s / 2, s, s);
      c.strokeStyle = 'rgba(243,234,214,0.9)';
      c.lineWidth = Math.max(1.25, s * 0.045);
      c.strokeRect(-s / 2 + s * 0.08, -s / 2 + s * 0.08, s * 0.84, s * 0.84);
      c.fillStyle = '#f3ead6';
      c.font = Math.round(s * 0.52) + 'px MoShu, serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(seal, 0, s * 0.04);
      c.restore();
    };
    const spanPx = Math.max(1, xB - xA);
    const steps = Math.max(48, Math.round(spanPx / (thin ? 7 : 4)));
    const S = thin ? 1 : 2;
    const off = document.createElement('canvas');
    off.width = Math.max(2, Math.round(W * S));
    off.height = Math.max(2, Math.round(H * S));
    const g = off.getContext('2d');
    const place = (b, tn) => {
      const t = Math.max(0, Math.min(limitT, tn * limitT));
      const p = sample(t);
      const env = envelope(tn);
      const ink = coverage(tn, b.life);
      const wander = Math.sin(tn * b.freq + b.phase) * env * (0.012 + 0.045 * (1 - ink));
      const side = (b.o + b.bias) * env + wander;
      const lagT = 0.18;
      let lag = 0;
      if (tn < lagT) {
        const u = tn / lagT;
        const s = u * u * (3 - 2 * u);
        const arc = 1 - Math.sqrt(Math.max(0, 1 - Math.min(1, b.o * b.o)));
        lag = envelope(0) * arc * (1 - s);
      }
      const spacing = Math.max(0.75, (2 * env) / nBrist);
      const rad = spacing * 1.22 * (0.7 + 0.3 * ink);
      const alpha = ink * (0.84 + 0.12 * (1 - b.tone));
      return {
        x: p.x + p.tx * lag + p.nx * side,
        y: p.y + p.ty * lag + p.ny * side,
        nx: p.nx, ny: p.ny, rad, alpha, tn,
      };
    };
    const build = (b, reach) => {
      const maxTn = Math.min(1, reach / limitT, b.life);
      const pts = [];
      if (maxTn <= 0) return pts;
      const count = Math.max(2, Math.round(steps * maxTn));
      for (let i = 0; i <= count; i++) {
        const tn = i / steps;
        if (tn > maxTn + 1e-5) break;
        const pt = place(b, tn);
        pts.push(pt);
        if (pt.alpha <= 0.02) break;
      }
      return pts;
    };
    const fillRibbon = (ctx, pts, radScale, alpha, color) => {
      const L = pts.length;
      if (L < 2 || alpha <= 0.012) return;
      ctx.beginPath();
      ctx.moveTo(pts[0].x + pts[0].nx * pts[0].rad * radScale, pts[0].y + pts[0].ny * pts[0].rad * radScale);
      for (let i = 1; i < L; i++) ctx.lineTo(pts[i].x + pts[i].nx * pts[i].rad * radScale, pts[i].y + pts[i].ny * pts[i].rad * radScale);
      for (let i = L - 1; i >= 0; i--) ctx.lineTo(pts[i].x - pts[i].nx * pts[i].rad * radScale, pts[i].y - pts[i].ny * pts[i].rad * radScale);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fill();
    };
    const drawVarying = (ctx, pts, color, radScale, alphaScale) => {
      let i = 0;
      while (i < pts.length - 1) {
        let j = Math.min(pts.length - 1, i + 1);
        const a0 = pts[i].alpha;
        while (j < pts.length - 1 && Math.abs(pts[j].alpha - a0) < 0.07) j++;
        const seg = pts.slice(i, j + 1);
        let a = 0;
        for (let k = 0; k < seg.length; k++) a += seg[k].alpha;
        fillRibbon(ctx, seg, radScale, (a / seg.length) * alphaScale, color);
        if (j <= i) break;
        i = j;
      }
    };
    const paint = k => {
      const reach = Math.min(limitT, Math.max(0, k));
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, W, H);
      c.globalCompositeOperation = 'source-over';
      c.filter = 'none';
      if (reach <= 0) return;
      g.setTransform(S, 0, 0, S, 0, 0);
      g.clearRect(0, 0, W, H);
      g.globalCompositeOperation = 'source-over';
      const ribbons = [];
      for (let i = 0; i < bristles.length; i++) {
        const pts = build(bristles[i], reach);
        if (pts.length > 1) ribbons.push({ pts, b: bristles[i] });
      }
      for (let r = 0; r < ribbons.length; r++) {
        const pts = ribbons[r].pts;
        const wet = [];
        for (let i = 0; i < pts.length; i++) if (pts[i].alpha > 0.55) wet.push(pts[i]);
        if (wet.length > 1) drawVarying(g, wet, 'rgb(146,112,78)', 1.45, 0.16);
      }
      for (let r = 0; r < ribbons.length; r++) {
        const pts = ribbons[r].pts;
        const b = ribbons[r].b;
        g.fillStyle = b.color;
        g.globalAlpha = Math.min(1, pts[0].alpha);
        g.beginPath();
        g.arc(pts[0].x, pts[0].y, Math.max(0.6, pts[0].rad), 0, 6.2832);
        g.fill();
        drawVarying(g, pts, b.color, 1, 1);
      }
      c.imageSmoothingEnabled = true;
      c.imageSmoothingQuality = 'high';
      c.globalAlpha = 1;
      c.drawImage(off, 0, 0, off.width, off.height, 0, 0, W, H);
      paintSeal(k);
    };
    const t0 = performance.now();
    const total = paperMs + strokeMs;
    return new Promise(resolve => {
      const frame = now => {
        const skip = gate.skip;
        const elapsed = skip ? total : Math.max(0, Math.min(total, now - t0));
        paper.style.opacity = String(Math.min(1, elapsed / paperMs));
        const k = Math.min(1, Math.max(0, (elapsed - paperMs) / strokeMs));
        paint(skip ? 1 : k);
        if (!skip && elapsed < total) { requestAnimationFrame(frame); return; }
        settle(gate).then(() => {
          gate.off();
          resolve();
          paper.style.transition = 'opacity .45s ease';
          cv.style.transition = 'opacity .45s ease';
          requestAnimationFrame(() => { paper.style.opacity = '0'; cv.style.opacity = '0'; });
          setTimeout(() => {
            host.classList.remove('brush-on');
            if (nameEl) nameEl.removeAttribute('style');
            if (paper.parentNode) paper.parentNode.removeChild(paper);
            if (cv.parentNode) cv.parentNode.removeChild(cv);
          }, 480);
        });
      };
      requestAnimationFrame(frame);
    });
  }

  /* ---------- iOS 按压态 ---------- */
  function bloomAt(x, y) {
    if (x == null || y == null || thinNow()) return;
    const b = document.createElement('i');
    b.className = 'ink-bloom';
    b.style.left = x + 'px'; b.style.top = y + 'px';
    const done = () => { if (b.parentNode) b.remove(); };
    b.addEventListener('animationend', done);
    document.body.appendChild(b);
    setTimeout(done, 700);
  }
  function initPress() {
    document.addEventListener('touchstart', () => {}, { passive: true }); // 让 :active 在 iOS 生效
    const on = e => { const b = e.target.closest && e.target.closest('.brush-btn,.act'); if (b && !b.disabled) b.classList.add('pressed'); };
    const off = () => document.querySelectorAll('.pressed').forEach(b => b.classList.remove('pressed'));
    document.addEventListener('pointerdown', on, { passive: true });
    ['pointerup', 'pointercancel', 'pointerleave', 'blur'].forEach(ev => window.addEventListener(ev, off, { passive: true }));
  }

  return { vtext, initParallax, requestTilt, setSeason, setGold, qiSwirl, goldMotes, cave, inkPath, wash, brushSweep, titleDrop, initPress, bloomAt, reduced, syncMotion, thinNow };
})();
