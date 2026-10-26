/* 墨仙录 · 卷首动态壁纸：松枝、湖光倒影、低分辨率流雾与云影 */
'use strict';
const Wallpaper = (() => {
  const $ = s => document.querySelector(s);
  const RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => !!(RM && RM.matches);
  const thinNow = () => reduced() || document.documentElement.dataset.motion === 'lite' || document.documentElement.dataset.fx === 'thin';
  const coarse = () => !!(window.matchMedia && matchMedia('(pointer: coarse)').matches && Math.min(innerWidth, innerHeight) < 1000);
  function fogN(n) {
    let m = coarse() ? 0.5 : 1;
    if (document.documentElement.dataset.fx === 'thin' || document.documentElement.dataset.motion === 'lite') m *= 0.45;
    return Math.max(2, Math.round(n * m));
  }
  const R = Ink.mulberry(2024);
  const rnd = (a, b) => a + R() * (b - a);

  /* ---------- 前景松枝 ---------- */
  function px(w, h) { return Ink.layerScale(w, h); }
  function drawPine(cv) {
    if (!cv) return false;
    const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return false;
    const dpr = px(w, h);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    const r = Ink.mulberry(77), s = w / 250;
    const bez = (p0, p1, p2, p3, t) => { const u = 1 - t; return [u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0], u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]]; };
    // 枝干：带粗细变化的填充笔触
    function limb(P, w0, w1, rgb, a) {
      const n = 40, L = [], Rr = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n, p = bez(...P, t), q = bez(...P, Math.min(1, t + .01));
        let dx = q[0] - p[0], dy = q[1] - p[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
        const ww = (w0 + (w1 - w0) * t) * (0.85 + r() * 0.3) / 2;
        L.push([p[0] - dy * ww, p[1] + dx * ww]); Rr.push([p[0] + dy * ww, p[1] - dx * ww]);
      }
      c.beginPath(); c.moveTo(...L[0]); L.forEach(p => c.lineTo(...p)); for (let i = Rr.length - 1; i >= 0; i--) c.lineTo(...Rr[i]); c.closePath();
      // 墨分五色：枝干根部浓、梢头淡
      const g = c.createLinearGradient(P[0][0], P[0][1], P[3][0], P[3][1]);
      g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},${a * .45})`);
      c.fillStyle = g; c.fill();
      // 飞白与树皮鳞纹
      for (let i = 0; i < n * 1.6; i++) {
        const t = r(), p = bez(...P, t), ww = (w0 + (w1 - w0) * t) / 2;
        c.strokeStyle = night
          ? (r() < .55 ? `rgba(28,24,20,${.14 + r() * .16})` : `rgba(255,248,236,${(.1 + r() * .14) * a})`)
          : (r() < .55 ? `rgba(239,230,211,${.1 + r() * .14})` : `rgba(10,9,8,${(.14 + r() * .18) * a})`);
        c.lineWidth = (.6 + r() * 1.2) * s; c.beginPath();
        const ox = (r() - .5) * ww * 1.4, oy = (r() - .5) * ww * 1.4;
        c.ellipse(p[0] + ox, p[1] + oy, ww * (.2 + r() * .25), ww * (.1 + r() * .12), r() * 3, 0, Math.PI * (1 + r()));
        c.stroke();
      }
    }
    // 松针一簇：半圆扇形放射的细针；多簇相叠成平展的“松云”，底下垫一层淡墨
    function fan(x, y, size, a) {
      const n = 20 + Math.floor(r() * 10);
      c.lineCap = 'round';
      for (let k = 0; k < n; k++) {
        const ang = Math.PI * (1.0 + (k / n) * 1.0) + (r() - .5) * .1, L = size * (.7 + r() * .35);
        c.strokeStyle = `rgba(${needle},${a * (.6 + r() * .4)})`; c.lineWidth = (.6 + r() * .5) * s;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(ang) * L, y + Math.sin(ang) * L * .95); c.stroke();
      }
    }
    function cloud(cx, cy, len, size, A = 1) {
      // 淡墨衬底
      const g = c.createRadialGradient(cx, cy, 0, cx, cy, len * .6);
      g.addColorStop(0, `rgba(${cloudInk},${.16 * A})`); g.addColorStop(1, `rgba(${cloudInk},0)`);
      c.save(); c.translate(cx, cy); c.scale(1, .45); c.translate(-cx, -cy); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, len * .6, 0, 7); c.fill(); c.restore();
      const n = Math.round(len / (size * .55));
      for (let i = 0; i < n; i++) {
        const t = i / Math.max(1, n - 1), x = cx - len / 2 + t * len + (r() - .5) * size * .4;
        const y = cy + Math.sin(t * Math.PI) * -size * .28 + (r() - .5) * size * .25 + size * .18;
        fan(x, y, size * (.8 + Math.sin(t * Math.PI) * .35), .6 * A);
      }
      // 第二层：稍高、稍短，叠出厚度
      for (let i = 0; i < n * .7; i++) { const t = r(); fan(cx - len * .32 + t * len * .64, cy - size * .35 - Math.sin(t * Math.PI) * size * .3, size * .75, .42 * A); }
    }
    const night = document.documentElement.dataset.theme === 'night';
    const ink = night ? '230,222,208' : '27,24,20';
    const needle = night ? '214,206,192' : '22,21,18';
    const cloudInk = night ? '206,198,184' : '48,58,56';
    const T = [[w * 1.03, h * 1.04], [w * .86, h * .76], [w * .92, h * .44], [w * .74, h * .2]];
    limb(T, 28 * s, 9 * s, ink, .74);
    const branches = [
      { t: .4, to: [w * .24, h * .42], droop: .06, w: 10 },
      { t: .66, to: [w * .36, h * .25], droop: .045, w: 8 },
      { t: .9, to: [w * .54, h * .1], droop: .03, w: 6 },
    ];
    const clouds = [];
    for (const b of branches) {
      const st = bez(...T, b.t), en = b.to;
      const P = [st, [st[0] - (st[0] - en[0]) * .35, st[1] + h * b.droop], [st[0] - (st[0] - en[0]) * .7, en[1] + h * b.droop], en];
      limb(P, b.w * s, 2.2 * s, ink, .62);
      const mid = bez(...P, .55), tip = bez(...P, .96);
      clouds.push([tip[0] + 6 * s, tip[1] - 4 * s, 82 * s, 19 * s, .62 + b.t * .1], [mid[0], mid[1] - 3 * s, 64 * s, 16 * s, 1 - b.t * .35]);
    }
    clouds.push([T[3][0], T[3][1] - 2 * s, 74 * s, 19 * s, .55]);
    for (const cl of clouds) cloud(...cl);
    return true;
  }

  /* ---------- 湖面倒影（静态预渲染，交给 CSS 做波光） ---------- */
  function drawLake() {
    const lake = $('.lake'), cv = $('.lake-refl'); if (!lake || !cv) return;
    const lw = lake.offsetWidth, lh = lake.offsetHeight, ltop = lake.offsetTop; if (!lw || !lh) return false;
    const dpr = px(lw, lh);
    cv.width = Math.round(lw * dpr); cv.height = Math.round(lh * dpr);
    const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, lw, lh);
    for (const [sel, a] of [['.m2', .45], ['.m3', 1]]) {
      const m = $('#scenery ' + sel); if (!m || !m.width) continue;
      c.save(); c.globalAlpha = a;
      c.setTransform(dpr, 0, 0, -0.92 * dpr, 0, ltop * 0.92 * dpr);
      c.drawImage(m, 0, m.offsetTop, m.offsetWidth, m.offsetHeight);
      c.restore();
    }
    // 水纹断开倒影
    c.globalCompositeOperation = 'destination-out';
    const r = Ink.mulberry(5);
    for (let i = 0; i < 70; i++) {
      const y = Math.pow(r(), .8) * lh, x = r() * lw, len = 20 + r() * 120;
      c.fillStyle = `rgba(0,0,0,${.35 + r() * .5})`; c.fillRect(x, y, len, .8 + r() * 1.4);
    }
    // 越远离水线越淡
    const g = c.createLinearGradient(0, 0, 0, lh); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.55, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,1)');
    c.fillStyle = g; c.fillRect(0, 0, lw, lh);
    c.globalCompositeOperation = 'source-over';
    return true;
  }

  function glints() {
    const W = 800, H = 240, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d'), r = Ink.mulberry(13);
    for (let i = 0; i < 150; i++) {
      const y = Math.pow(r(), 1.6) * H, len = 8 + r() * 60 * (1 - y / H * .6), x = r() * W, a = .25 + r() * .45;
      for (const ox of [-W, 0, W]) {
        const g = c.createLinearGradient(x + ox, 0, x + ox + len, 0);
        g.addColorStop(0, 'rgba(252,249,240,0)'); g.addColorStop(.5, `rgba(252,249,240,${a})`); g.addColorStop(1, 'rgba(252,249,240,0)');
        c.fillStyle = g; c.fillRect(x + ox, y, len, .9 + r() * 1.3);
      }
    }
    for (let i = 0; i < 26; i++) {
      const y = 20 + r() * (H - 20), len = 30 + r() * 120, x = r() * W;
      for (const ox of [-W, 0, W]) { c.fillStyle = `rgba(40,40,40,${.04 + r() * .05})`; c.fillRect(x + ox, y, len, 1); }
    }
    return cv.toDataURL();
  }

  /* ---------- 流雾与云影：固定 1/4 分辨率，放大后才柔，不能按像素比画实 ---------- */
  function mistK() { return 0.25; }
  const A = { layers: [], raf: 0, last: 0, t0: 0, frame: 0 };
  let fogImgs = null, shadowImg = null;
  function sprite(rgb, a0) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d');
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, `rgba(${rgb},${a0})`); g.addColorStop(.45, `rgba(${rgb},${a0 * .55})`); g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g; c.fillRect(0, 0, 64, 64); return cv;
  }
  function mistShapes() {
    const out = [];
    for (let s = 0; s < 4; s++) {
      const cv = document.createElement('canvas'); cv.width = 180; cv.height = 72;
      const c = cv.getContext('2d'); const rnd = Ink.mulberry(90 + s * 19);
      for (let i = 0; i < 5; i++) {
        const x = 12 + rnd() * 156, y = 10 + rnd() * 52, rad = 24 + rnd() * 42, a = 0.1 + rnd() * 0.16;
        const g = c.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, `rgba(246,241,229,${a})`);
        g.addColorStop(0.6, `rgba(246,241,229,${(a * 0.3).toFixed(3)})`);
        g.addColorStop(1, 'rgba(246,241,229,0)');
        c.fillStyle = g; c.fillRect(0, 0, 180, 72);
      }
      out.push(cv);
    }
    return out;
  }
  function fogBit() {
    return { x: rnd(-.15, 1.15) * innerWidth, y: 0, rw: rnd(260, 640), rh: rnd(36, 90), v: rnd(2, 7) * (R() < .3 ? -1 : 1), a: rnd(.18, .42), ph: rnd(0, 6.28), bob: rnd(4, 12), si: (R() * 4) | 0 };
  }
  function makeLayer(cv, mtnSel, band, nFog, nShadow) {
    const W = cv.clientWidth || innerWidth, H = cv.clientHeight || innerHeight;
    const w = Math.max(2, Math.ceil(W * mistK())), h = Math.max(2, Math.ceil(H * mistK()));
    cv.width = w; cv.height = h;
    const sil = document.createElement('canvas'); sil.width = w; sil.height = h;
    const m = $('#scenery ' + mtnSel);
    const kSil = w / Math.max(1, W);
    if (m && m.width) sil.getContext('2d').drawImage(m, m.offsetLeft * kSil, m.offsetTop * kSil, m.offsetWidth * kSil, m.offsetHeight * kSil);
    const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
    const fogBase = nFog, shBase = nShadow;
    const nF = fogN(fogBase), nS = thinNow() ? 1 : (coarse() ? Math.min(2, shBase) : shBase);
    const fog = Array.from({ length: nF }, () => { const f = fogBit(); f.y = rnd(band[0], band[1]) * H; return f; });
    const sh = Array.from({ length: nS }, (_, i) => ({ x: (i / Math.max(1, nS)) * W * 1.6 - W * .3, y: rnd(.25, .75) * H, rw: rnd(140, 240), rh: rnd(70, 130), v: rnd(4, 7), a: rnd(.5, .8) }));
    return { cv, c: cv.getContext('2d'), sil, tmp, tc: tmp.getContext('2d'), fog, sh, fogBase, shBase, band, w, h, W, H };
  }
  function drawLayer(L, t, dt) {
    const { c, tc, w, h, W } = L;
    // 云影：只落在山体上
    tc.globalCompositeOperation = 'source-over'; tc.clearRect(0, 0, w, h);
    for (const s of L.sh) {
      s.x += s.v * dt; if (s.x - s.rw > W) s.x = -s.rw * 1.2;
      const k = L.w / Math.max(1, L.W);
      tc.globalAlpha = s.a; tc.drawImage(shadowImg, (s.x - s.rw) * k, (s.y - s.rh) * k, s.rw * 2 * k, s.rh * 2 * k);
    }
    tc.globalAlpha = 1; tc.globalCompositeOperation = 'destination-in'; tc.drawImage(L.sil, 0, 0);
    c.clearRect(0, 0, w, h); c.drawImage(L.tmp, 0, 0);
    const wash = c.createLinearGradient(0, h * 0.4, 0, h * 0.86);
    wash.addColorStop(0, 'rgba(246,241,229,0)');
    wash.addColorStop(0.5, 'rgba(246,241,229,0.07)');
    wash.addColorStop(1, 'rgba(246,241,229,0)');
    c.globalAlpha = 1; c.fillStyle = wash; c.fillRect(0, 0, w, h);
    c.filter = 'blur(10px)';
    for (const f of L.fog) {
      f.x += f.v * dt;
      if (f.v > 0 && f.x - f.rw > W) f.x = -f.rw; if (f.v < 0 && f.x + f.rw < 0) f.x = W + f.rw;
      const y = f.y + Math.sin(t * .13 + f.ph) * f.bob;
      c.globalAlpha = f.a * (.75 + .25 * Math.sin(t * .21 + f.ph * 2));
      const k = L.w / Math.max(1, L.W);
      const img = fogImgs[(f.si | 0) % fogImgs.length];
      c.drawImage(img, (f.x - f.rw) * k, (y - f.rh) * k, f.rw * 2 * k, f.rh * 2 * k);
    }
    c.filter = 'none';
    c.globalAlpha = 1;
  }
  function tick(now) {
    A.raf = 0;
    if (document.hidden || document.body.dataset.screen !== 'title') return;
    if (reduced() || document.documentElement.dataset.motion === 'lite') return;
    A.raf = requestAnimationFrame(tick);
    if (++A.frame % 2) return;                 // 30fps 足够：雾很慢，且画布被放大柔化
    const dt = A.last ? Math.min(.1, (now - A.last) / 1000) : .033; A.last = now;
    const t = now / 1000;
    for (const L of A.layers) drawLayer(L, t, dt);
  }
  function start() {
    if (reduced() || document.documentElement.dataset.motion === 'lite') return;
    if (!document.body.classList.contains('go') || document.body.classList.contains('hold')) return;
    if (document.body.dataset.screen !== 'title') return;
    if (!A.raf && A.layers.length) { A.last = 0; A.raf = requestAnimationFrame(tick); }
  }
  function kick(ms) {
    setTimeout(start, ms || 0);
  }
  function refill(L) {
    const W = innerWidth, H = innerHeight;
    const nF = fogN(L.fogBase), nS = thinNow() ? 1 : (coarse() ? Math.min(2, L.shBase) : L.shBase);
    while (L.fog.length < nF) { const f = fogBit(); f.y = rnd(L.band[0], L.band[1]) * H; L.fog.push(f); }
    if (L.fog.length > nF) L.fog.length = nF;
    while (L.sh.length < nS) L.sh.push({ x: rnd(0, W), y: rnd(.25, .75) * H, rw: rnd(140, 240), rh: rnd(70, 130), v: rnd(4, 7), a: rnd(.5, .8) });
    if (L.sh.length > nS) L.sh.length = nS;
  }
  function syncMotion() {
    syncMain();
    if (A.raf) cancelAnimationFrame(A.raf);
    A.raf = 0;
    if (reduced()) return;
    for (const L of A.layers) refill(L);
    if (document.documentElement.dataset.motion !== 'lite') start();
  }

  function build() {
    fogImgs = fogImgs || mistShapes();
    shadowImg = shadowImg || sprite('22,24,30', .26);
    const far = $('.atmo-far'), near = $('.atmo-near');
    A.layers = [makeLayer(far, '.m2', [.5, .64], 7, 3), makeLayer(near, '.m3', [.66, .8], 8, 3)];
    for (const L of A.layers) drawLayer(L, performance.now() / 1000, 0);
    drawPine($('.pine'));
    drawLake();
    if (!document.documentElement.style.getPropertyValue('--glint-img')) document.documentElement.style.setProperty('--glint-img', `url(${glints()})`);
    if (needsBuild() && (build._n = (build._n || 0) + 1) < 8) {
      clearTimeout(build._t);
      build._t = setTimeout(build, 80);
    } else build._n = 0;
  }
  function bitmapStale(cv) {
    if (!cv) return false;
    const w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return true;
    if (cv.classList.contains('atmo')) return cv.width === 300 && cv.height === 150 && w > 400;
    const dpr = px(w, h);
    return Math.abs(cv.width - Math.round(w * dpr)) > 2 || Math.abs(cv.height - Math.round(h * dpr)) > 2;
  }
  function needsBuild() {
    return bitmapStale($('.pine')) || bitmapStale($('.lake-refl')) || bitmapStale($('.atmo-far')) || bitmapStale($('.atmo-near'));
  }
  /* 主卷：复用卷首的雾纹、湖光和舟鹤，文字与卷轴不随景物移动。 */
  const M = { cv: null, c: null, raf: 0, last: 0, time: 0, fog: [] };
  function buildMain() {
    if (!M.cv) return;
    const w = innerWidth, h = innerHeight, k = Math.min(.25, 512 / w);
    M.w = w; M.h = h;
    M.cv.width = Math.max(1, Math.round(w * k)); M.cv.height = Math.max(1, Math.round(h * k));
    M.c.setTransform(M.cv.width / w, 0, 0, M.cv.height / h, 0, 0);
    const r = Ink.mulberry(94);
    M.fog = Array.from({ length: w < 1000 ? 7 : 12 }, (_, i) => ({
      x: r() * w, y: h * (i % 3 === 0 ? .18 + r() * .2 : .78 + r() * .16),
      rw: Math.min(w * .6, 450) * (.65 + r() * .6), rh: 28 + r() * 45,
      v: 4 + r() * 5, phase: r() * Math.PI * 2, img: i % 4
    }));
    paintMain(0);
  }
  function paintMain(dt) {
    const c = M.c; c.clearRect(0, 0, M.w, M.h);
    for (const f of M.fog) {
      f.x += f.v * dt;
      if (f.x - f.rw > M.w) f.x = -f.rw;
      c.globalAlpha = .55 + Math.sin(M.time * .22 + f.phase) * .16;
      c.drawImage(fogImgs[f.img], f.x - f.rw, f.y - f.rh + Math.sin(M.time * .18 + f.phase) * 9, f.rw * 2, f.rh * 2);
    }
    c.globalAlpha = 1;
  }
  function mainTick(now) {
    M.raf = 0;
    if (document.hidden || document.body.dataset.screen !== 'main' || thinNow()) { syncMain(); return; }
    M.raf = requestAnimationFrame(mainTick);
    if (M.last && now - M.last < 50) return; // 20fps，四分之一分辨率；不跟随设备 DPR 放大。
    const dt = M.last ? Math.min(.1, (now - M.last) / 1000) : 0;
    M.last = now; M.time += dt; paintMain(dt);
  }
  function syncMain() {
    const on = !!M.cv && !document.hidden && document.body.dataset.screen === 'main' && !thinNow();
    document.documentElement.dataset.liveWallpaper = on ? 'on' : 'off';
    if (!on) { if (M.raf) cancelAnimationFrame(M.raf); M.raf = 0; M.last = 0; return; }
    if (M.w !== innerWidth || M.h !== innerHeight) buildMain();
    if (!M.raf) { M.last = 0; M.raf = requestAnimationFrame(mainTick); }
  }
  function initMain() {
    const host = $('.play-landscape'); if (!host) return;
    const add = (tag, cls) => { const el = document.createElement(tag); el.className = cls; host.appendChild(el); return el; };
    M.cv = add('canvas', 'play-mist'); M.c = M.cv.getContext('2d');
    add('div', 'play-water');
    const track = add('div', 'play-boat-track'), boat = document.createElement('div'); boat.className = 'play-boat';
    const originalBoat = $('#scenery .boat svg'); if (originalBoat) boat.appendChild(originalBoat.cloneNode(true));
    track.appendChild(boat);
    for (let i = 0; i < 2; i++) {
      const bird = add('div', 'play-crane play-crane-' + i), original = $('#scenery .crane svg');
      if (original) bird.appendChild(original.cloneNode(true));
    }
    buildMain(); syncMain();
    let resize;
    addEventListener('resize', () => { clearTimeout(resize); resize = setTimeout(() => { if (document.body.dataset.screen === 'main') { buildMain(); syncMain(); } }, 140); });
    new MutationObserver(syncMain).observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion', 'data-fx'] });
    if (RM) { if (RM.addEventListener) RM.addEventListener('change', syncMain); else RM.addListener(syncMain); }
  }

  function init() {
    build();
    initMain();
    document.addEventListener('visibilitychange', () => { start(); syncMain(); });
    new MutationObserver(() => {
      if (document.body.dataset.screen === 'title') start();
      syncMain();
    }).observe(document.body, { attributes: true, attributeFilter: ['data-screen'] });
  }
  return { init, rebuild: build, syncMotion, kick, needsBuild };
})();
