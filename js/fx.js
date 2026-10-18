/* 墨仙录 · 动效层：视差、季节飘落、动作反馈、墨染转场 */
'use strict';
const FX = (() => {
  const RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => !!(RM && RM.matches);
  const thinNow = () => reduced() || document.documentElement.dataset.motion === 'lite' || document.documentElement.dataset.fx === 'thin';
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
      if (PX.gyro || !touching) return; const t = e.touches[0];
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
    if (reduced() || PX.gyro || PX.asked) return; PX.asked = true;
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
    const k = Math.min(DPR, 1.25, Math.sqrt(2.6e6 / (W.w * W.h))); W.k = k;
    W.cv.width = Math.round(W.w * k); W.cv.height = Math.round(W.h * k); W.c.setTransform(k, 0, 0, k, 0, 0);
    if (W.parts && W.season >= 0) fitParts();
  }
  // 粒子数随画面面积增长（以 390×844 为基准，最多 2.4 倍），宽屏不显稀疏。
  // 手机与「简」再收一截，少画少合成。
  function partMul() {
    let m = 1;
    if (coarsePhone()) m *= 0.38;
    if (document.documentElement.dataset.fx === 'thin' || document.documentElement.dataset.motion === 'lite') m *= 0.34;
    return m;
  }
  const partN = s => Math.max(4, Math.round([12, 40, 11, 36][s] * Math.min(2.4, Math.max(1, Math.sqrt((W.w || innerWidth) * (W.h || innerHeight) / (390 * 844)))) * partMul()));
  function fitParts() {
    const n = partN(W.season);
    while (W.parts.length < n) { const p = {}; spawn(p, true); W.parts.push(p); }
    if (W.parts.length > n) W.parts.length = n;
  }
  function spawn(p, init) {
    const s = W.season;
    p.x = rnd(-20, W.w + 20); p.y = init ? rnd(-W.h * .1, W.h) : rnd(-40, -10);
    p.z = rnd(.45, 1); p.rot = rnd(0, 6.28); p.spin = rnd(-1.6, 1.6); p.ph = rnd(0, 6.28); p.flip = rnd(1.2, 3);
    if (s === 1) { p.vy = rnd(520, 760) * p.z; p.vx = -p.vy * .2; p.len = rnd(10, 20) * p.z; }
    else if (s === 3) { p.vy = rnd(18, 42) * p.z; p.vx = rnd(-8, 8); p.size = rnd(4.5, 9) * p.z; }
    else if (s === 2) { p.vy = rnd(34, 60) * p.z; p.vx = rnd(10, 26); p.size = rnd(9, 15) * p.z; }
    else { p.vy = rnd(16, 30) * p.z; p.vx = rnd(8, 20); p.size = rnd(6, 10.5) * p.z; }
  }
  function haltWeather() {
    if (W.raf) cancelAnimationFrame(W.raf);
    W.raf = 0; W.parts = []; W.gold = [];
    if (W.c && W.w) { W.c.setTransform(1, 0, 0, 1, 0, 0); W.c.clearRect(0, 0, W.cv.width, W.cv.height); }
  }
  function setSeason(s) {
    if (reduced()) { haltWeather(); return; }
    if (!W.cv) { W.cv = $('#weather'); W.c = W.cv.getContext('2d'); resizeWeather(); addEventListener('resize', resizeWeather); document.addEventListener('visibilitychange', () => { if (!document.hidden && !reduced() && !W.raf && W.season >= 0) { W.last = 0; W.raf = requestAnimationFrame(wTick); } }); }
    armFps();
    if (s === W.season && W.parts.length === partN(s)) return;
    W.season = s;
    const n = partN(s);
    W.parts = Array.from({ length: n }, () => { const p = {}; spawn(p, true); return p; });
    if (!W.raf) { W.last = 0; W.raf = requestAnimationFrame(wTick); }
  }
  function setGold(realm) {
    if (reduced() || !W.cv) return;
    let n = realm >= 2 ? Math.min(12, 5 + (realm - 2) * 2) : 0;
    if (thinNow()) n = Math.min(n, 3);
    else if (coarsePhone()) n = Math.min(n, 5);
    if ((W.gold || []).length === n) return;
    W.gold = Array.from({ length: n }, () => ({ x: rnd(0, W.w), y: rnd(0, W.h), vy: rnd(5, 12), s: rnd(2, 3.6), spin: rnd(.6, 1.4), ph: rnd(0, 6.28) }));
  }
  function wTick(t) {
    if (document.hidden || reduced()) { W.raf = 0; return; }
    W.frame = (W.frame || 0) + 1;
    if (thinNow() && (W.frame & 1)) { W.raf = requestAnimationFrame(wTick); return; }
    const dt = W.last ? Math.min(0.05, (t - W.last) / 1000) : 0.016; W.last = t;
    const c = W.c, D = W.k || DPR, s = W.season, time = t / 1000; c.clearRect(0, 0, W.w, W.h);
    const wind = Math.sin(time * 0.23) * 14 + Math.sin(time * 0.071) * 10;
    if (s === 1) { c.strokeStyle = 'rgba(52,62,70,.26)'; c.lineWidth = 1; c.beginPath(); }
    for (const p of W.parts) {
      p.y += p.vy * dt; p.x += (p.vx + wind * p.z) * dt;
      if (s === 1) {
        c.moveTo(p.x, p.y); c.lineTo(p.x - p.len * 0.2, p.y - p.len);
      } else {
        p.x += Math.sin(time * 1.1 + p.ph) * 12 * dt * p.z; p.rot += p.spin * dt;
        const img = sprite(s === 3 ? 'snow' : s === 2 ? 'leaf' : 'petal'), sz = p.size;
        const fl = s === 3 ? 1 : Math.cos(time * p.flip + p.ph);
        c.globalAlpha = (s === 3 ? 0.85 : 0.62) * (0.4 + p.z * 0.6);
        c.setTransform(D * Math.cos(p.rot), D * Math.sin(p.rot), -D * Math.sin(p.rot) * fl, D * Math.cos(p.rot) * fl, p.x * D, p.y * D);
        c.drawImage(img, -sz, -sz, sz * 2, sz * 2);
      }
      if (p.y > W.h + 30 || p.x < -60 || p.x > W.w + 60) spawn(p, false);
    }
    if (s === 1) c.stroke(); else { c.setTransform(D, 0, 0, D, 0, 0); c.globalAlpha = 1; }
    // 高境界：几片金箔缓缓浮沉，翻转到正面时一闪
    for (const g of W.gold || []) {
      g.y -= g.vy * dt; g.x += (Math.sin(time * .3 + g.ph) * 6 + wind * .3) * dt;
      if (g.y < -20) { g.y = W.h + 20; g.x = rnd(0, W.w); }
      const f = Math.cos(time * g.spin + g.ph), gl = Math.pow(Math.max(0, f), 8);
      c.setTransform(D, 0, 0, D, g.x * D, g.y * D); c.rotate(time * .2 + g.ph); c.scale(g.s, g.s * (.2 + .8 * Math.abs(f)));
      c.globalAlpha = .28 + .5 * gl; c.fillStyle = gl > .3 ? '#f6e3a8' : '#c49a4a';
      c.beginPath(); c.moveTo(-1, -.6); c.lineTo(.9, -.9); c.lineTo(.7, .8); c.lineTo(-.8, .7); c.closePath(); c.fill();
    }
    if (W.gold && W.gold.length) { c.setTransform(D, 0, 0, D, 0, 0); c.globalAlpha = 1; }
    W.raf = requestAnimationFrame(wTick);
  }

  /* 低帧率连续两段即把动效收薄；「全」可在纸墨里再打开 */
  let fpsLast = 0, fpsN = 0, fpsBad = 0, fpsArmed = false;
  function fpsTick(t) {
    if (!fpsArmed) return;
    requestAnimationFrame(fpsTick);
    if (document.hidden) { fpsLast = 0; fpsN = 0; return; }
    if (!fpsLast) { fpsLast = t; return; }
    fpsN++;
    const span = t - fpsLast;
    if (span < 1600) return;
    const fps = fpsN * 1000 / span;
    fpsLast = t; fpsN = 0;
    const root = document.documentElement;
    if (root.dataset.motion === 'lite' || root.dataset.fx === 'thin' || reduced()) { fpsBad = 0; return; }
    if (fps < 40) {
      fpsBad++;
      if (fpsBad >= 2) {
        root.dataset.fx = 'thin';
        syncMotion();
        if (typeof Wallpaper !== 'undefined' && Wallpaper.syncMotion) Wallpaper.syncMotion();
      }
    } else fpsBad = 0;
  }
  function armFps() {
    if (fpsArmed || reduced()) return;
    fpsArmed = true;
    requestAnimationFrame(fpsTick);
  }
  function syncMotion() {
    if (reduced()) { haltWeather(); return; }
    armFps();
    if (W.season >= 0 && W.cv) {
      fitParts();
      if (W.gold && thinNow()) W.gold.length = Math.min(W.gold.length, 3);
      if (!W.raf && !document.hidden) { W.last = 0; W.raf = requestAnimationFrame(wTick); }
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

  /* ---------- 墨染转场 ---------- */
  let washBusy = false;
  async function wash(swap, x, y) {
    const u = $('#wash');
    if (washBusy) { await swap(); return; }
    washBusy = true;
    if (reduced()) {
      u.classList.add('on'); const f = u.querySelector('.wash-full');
      await f.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, fill: 'forwards' }).finished.catch(() => {});
      await swap();
      await f.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }).finished.catch(() => {});
      u.classList.remove('on'); washBusy = false; return;
    }
    if (typeof InkGL !== 'undefined' && InkGL.spreadOk) {   // WebGL：纸面以域扭曲的边缘洇开，外缘一圈淡墨
      const cv = $('#inkfx'); cv.classList.remove('fade'); u.classList.add('on');
      await InkGL.spread({ mode: 0, x, y, from: 0, to: 1.02, dur: 1050, ease: 'inOut', scale: .5, z: 41 });
      await swap(); await sleep(60);
      cv.classList.add('fade'); await sleep(820);
      InkGL.hide(); cv.classList.remove('fade'); u.classList.remove('on'); washBusy = false; return;
    }
    const ink = u.querySelector('.wash-ink'), paper = u.querySelector('.wash-paper'), full = u.querySelector('.wash-full');
    u.style.setProperty('--wx', (x ?? innerWidth / 2) + 'px'); u.style.setProperty('--wy', (y ?? innerHeight * .55) + 'px');
    u.classList.add('on');
    const ease = 'cubic-bezier(.3,.1,.2,1)';
    ink.animate([{ transform: 'scale(.02) rotate(0deg)', opacity: .9 }, { transform: 'scale(1.8) rotate(20deg)', opacity: .65 }], { duration: 760, easing: ease, fill: 'forwards' });
    paper.animate([{ transform: 'scale(0) rotate(0deg)' }, { transform: 'scale(.02) rotate(0deg)', offset: .12 }, { transform: 'scale(1.85) rotate(-14deg)' }], { duration: 860, easing: ease, fill: 'forwards' });
    const f1 = full.animate([{ opacity: 0 }, { opacity: 0, offset: .55 }, { opacity: 1 }], { duration: 900, easing: 'ease-in', fill: 'forwards' });
    await f1.finished.catch(() => {});
    await swap();
    ink.getAnimations().forEach(a => a.cancel()); paper.getAnimations().forEach(a => a.cancel());
    await sleep(80);
    await full.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.04)' }], { duration: 760, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).finished.catch(() => {});
    full.getAnimations().forEach(a => a.cancel());
    u.classList.remove('on'); washBusy = false;
  }

  /* ---------- iOS 按压态 ---------- */
  function initPress() {
    document.addEventListener('touchstart', () => {}, { passive: true }); // 让 :active 在 iOS 生效
    const on = e => { const b = e.target.closest && e.target.closest('.brush-btn,.act'); if (b && !b.disabled) b.classList.add('pressed'); };
    const off = () => document.querySelectorAll('.pressed').forEach(b => b.classList.remove('pressed'));
    document.addEventListener('pointerdown', on, { passive: true });
    ['pointerup', 'pointercancel', 'pointerleave', 'blur'].forEach(ev => window.addEventListener(ev, off, { passive: true }));
  }

  return { vtext, initParallax, requestTilt, setSeason, setGold, qiSwirl, goldMotes, cave, inkPath, wash, initPress, reduced, syncMotion, thinNow };
})();
