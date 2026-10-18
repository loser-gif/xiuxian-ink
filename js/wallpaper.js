/* 墨仙录 · 卷首动态壁纸：松枝、湖光倒影、低分辨率流雾与云影 */
'use strict';
const Wallpaper = (() => {
  const $ = s => document.querySelector(s);
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => !!(RM && RM.matches);
  const R = Ink.mulberry(2024);
  const rnd = (a, b) => a + R() * (b - a);

  /* ---------- 前景松枝 ---------- */
  function drawPine(cv) {
    const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
    cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR);
    const c = cv.getContext('2d'); c.setTransform(DPR, 0, 0, DPR, 0, 0); c.clearRect(0, 0, w, h);
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
      c.fillStyle = `rgba(${rgb},${a})`; c.fill();
      // 飞白与树皮鳞纹
      for (let i = 0; i < n * 1.6; i++) {
        const t = r(), p = bez(...P, t), ww = (w0 + (w1 - w0) * t) / 2;
        c.strokeStyle = r() < .55 ? `rgba(239,230,211,${.12 + r() * .18})` : `rgba(10,9,8,${.3 + r() * .3})`;
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
        c.strokeStyle = `rgba(22,21,18,${a * (.6 + r() * .4)})`; c.lineWidth = (.6 + r() * .5) * s;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(ang) * L, y + Math.sin(ang) * L * .95); c.stroke();
      }
    }
    function cloud(cx, cy, len, size) {
      // 淡墨衬底
      const g = c.createRadialGradient(cx, cy, 0, cx, cy, len * .6);
      g.addColorStop(0, 'rgba(48,58,56,.20)'); g.addColorStop(1, 'rgba(48,58,56,0)');
      c.save(); c.translate(cx, cy); c.scale(1, .45); c.translate(-cx, -cy); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, len * .6, 0, 7); c.fill(); c.restore();
      const n = Math.round(len / (size * .55));
      for (let i = 0; i < n; i++) {
        const t = i / Math.max(1, n - 1), x = cx - len / 2 + t * len + (r() - .5) * size * .4;
        const y = cy + Math.sin(t * Math.PI) * -size * .28 + (r() - .5) * size * .25 + size * .18;
        fan(x, y, size * (.8 + Math.sin(t * Math.PI) * .35), .78);
      }
      // 第二层：稍高、稍短，叠出厚度
      for (let i = 0; i < n * .7; i++) { const t = r(); fan(cx - len * .32 + t * len * .64, cy - size * .35 - Math.sin(t * Math.PI) * size * .3, size * .75, .7); }
    }
    const ink = '27,24,20';
    const T = [[w * 1.03, h * 1.04], [w * .86, h * .76], [w * .92, h * .44], [w * .74, h * .2]];
    limb(T, 30 * s, 10 * s, ink, .94);
    const branches = [
      { t: .4, to: [w * .24, h * .42], droop: .06, w: 10 },
      { t: .66, to: [w * .36, h * .25], droop: .045, w: 8 },
      { t: .9, to: [w * .54, h * .1], droop: .03, w: 6 },
    ];
    const clouds = [];
    for (const b of branches) {
      const st = bez(...T, b.t), en = b.to;
      const P = [st, [st[0] - (st[0] - en[0]) * .35, st[1] + h * b.droop], [st[0] - (st[0] - en[0]) * .7, en[1] + h * b.droop], en];
      limb(P, b.w * s, 2.4 * s, ink, .9);
      const mid = bez(...P, .55), tip = bez(...P, .96);
      clouds.push([tip[0] + 6 * s, tip[1] - 4 * s, 82 * s, 19 * s], [mid[0], mid[1] - 3 * s, 64 * s, 16 * s]);
    }
    clouds.push([T[3][0], T[3][1] - 2 * s, 74 * s, 19 * s]);
    for (const cl of clouds) cloud(...cl);
  }

  /* ---------- 湖面倒影（静态预渲染，交给 CSS 做波光） ---------- */
  function drawLake() {
    const lake = $('.lake'), cv = $('.lake-refl'); if (!lake || !cv) return;
    const lw = lake.offsetWidth, lh = lake.offsetHeight, ltop = lake.offsetTop; if (!lw || !lh) return;
    cv.width = Math.round(lw); cv.height = Math.round(lh);
    const c = cv.getContext('2d'); c.clearRect(0, 0, lw, lh);
    for (const [sel, a] of [['.m2', .45], ['.m3', 1]]) {
      const m = $('#scenery ' + sel); if (!m || !m.width) continue;
      c.save(); c.globalAlpha = a;
      // 以水线为轴镜像：lake 内 y = ltop - 屏幕 y
      c.setTransform(1, 0, 0, -0.92, 0, ltop * 0.92);
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

  /* ---------- 流雾与云影：1/4 分辨率画布，30fps ---------- */
  const K = 0.25;
  const A = { layers: [], raf: 0, last: 0, t0: 0, frame: 0 };
  let fogImg = null, shadowImg = null;
  function sprite(rgb, a0) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d');
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, `rgba(${rgb},${a0})`); g.addColorStop(.45, `rgba(${rgb},${a0 * .55})`); g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g; c.fillRect(0, 0, 64, 64); return cv;
  }
  function makeLayer(cv, mtnSel, band, nFog, nShadow) {
    const W = innerWidth, H = innerHeight, w = Math.ceil(W * K), h = Math.ceil(H * K);
    cv.width = w; cv.height = h;
    const sil = document.createElement('canvas'); sil.width = w; sil.height = h;
    const m = $('#scenery ' + mtnSel);
    if (m && m.width) sil.getContext('2d').drawImage(m, m.offsetLeft * K, m.offsetTop * K, m.offsetWidth * K, m.offsetHeight * K);
    const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
    const fog = Array.from({ length: nFog }, () => ({ x: rnd(-.2, 1.2) * W, y: rnd(band[0], band[1]) * H, rw: rnd(90, 210), rh: rnd(22, 48), v: rnd(3, 9) * (R() < .3 ? -1 : 1), a: rnd(.35, .7), ph: rnd(0, 6.28), bob: rnd(3, 9) }));
    const sh = Array.from({ length: nShadow }, (_, i) => ({ x: (i / nShadow) * W * 1.6 - W * .3, y: rnd(.25, .75) * H, rw: rnd(140, 240), rh: rnd(70, 130), v: rnd(4, 7), a: rnd(.5, .8) }));
    return { cv, c: cv.getContext('2d'), sil, tmp, tc: tmp.getContext('2d'), fog, sh, w, h, W, H };
  }
  function drawLayer(L, t, dt) {
    const { c, tc, w, h, W } = L;
    // 云影：只落在山体上
    tc.globalCompositeOperation = 'source-over'; tc.clearRect(0, 0, w, h);
    for (const s of L.sh) {
      s.x += s.v * dt; if (s.x - s.rw > W) s.x = -s.rw * 1.2;
      tc.globalAlpha = s.a; tc.drawImage(shadowImg, (s.x - s.rw) * K, (s.y - s.rh) * K, s.rw * 2 * K, s.rh * 2 * K);
    }
    tc.globalAlpha = 1; tc.globalCompositeOperation = 'destination-in'; tc.drawImage(L.sil, 0, 0);
    c.clearRect(0, 0, w, h); c.drawImage(L.tmp, 0, 0);
    // 流雾：在山谷间缓缓穿行，呼吸般浓淡起伏
    for (const f of L.fog) {
      f.x += f.v * dt;
      if (f.v > 0 && f.x - f.rw > W) f.x = -f.rw; if (f.v < 0 && f.x + f.rw < 0) f.x = W + f.rw;
      const y = f.y + Math.sin(t * .13 + f.ph) * f.bob;
      c.globalAlpha = f.a * (.7 + .3 * Math.sin(t * .21 + f.ph * 2));
      c.drawImage(fogImg, (f.x - f.rw) * K, (y - f.rh) * K, f.rw * 2 * K, f.rh * 2 * K);
    }
    c.globalAlpha = 1;
  }
  function tick(now) {
    A.raf = 0;
    if (document.hidden || document.body.dataset.screen !== 'title') return;
    A.raf = requestAnimationFrame(tick);
    if (++A.frame % 2) return;                 // 30fps 足够：雾很慢，且画布被放大柔化
    const dt = A.last ? Math.min(.1, (now - A.last) / 1000) : .033; A.last = now;
    const t = now / 1000;
    for (const L of A.layers) drawLayer(L, t, dt);
  }
  function start() { if (!A.raf && !reduced() && A.layers.length) { A.last = 0; A.raf = requestAnimationFrame(tick); } }

  function build() {
    fogImg = fogImg || sprite('246,241,229', .95);
    shadowImg = shadowImg || sprite('22,24,30', .26);
    const far = $('.atmo-far'), near = $('.atmo-near');
    A.layers = [makeLayer(far, '.m2', [.5, .64], 7, 3), makeLayer(near, '.m3', [.66, .8], 8, 3)];
    for (const L of A.layers) drawLayer(L, performance.now() / 1000, 0);
    drawPine($('.pine'));
    drawLake();
    if (!document.documentElement.style.getPropertyValue('--glint-img')) document.documentElement.style.setProperty('--glint-img', `url(${glints()})`);
    start();
  }
  function init() {
    build();
    document.addEventListener('visibilitychange', start);
    new MutationObserver(start).observe(document.body, { attributes: true, attributeFilter: ['data-screen'] });
  }
  return { init, rebuild: build };
})();
