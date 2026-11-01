/* 墨仙录 · 主界面册页四季
   同一张宣纸上的四种笔意。只在 data-screen=main 显出。
   卷首远山、红日、孤松、湖舟不经过这里。 */
'use strict';
const Album = (() => {
  const host = document.getElementById('album');
  if (!host || typeof Ink === 'undefined') return { init: function () {} };

  const leaves = [
    host.querySelector('.l0'),
    host.querySelector('.l1'),
    host.querySelector('.l2'),
    host.querySelector('.l3')
  ];
  let paintedKey = '';
  let sweepTimer = 0;
  let resizeTimer = 0;
  let seenSeason = null;

  function night() { return document.documentElement.dataset.theme === 'night'; }
  function thin() {
    const root = document.documentElement;
    if (root.dataset.motion === 'lite' || root.dataset.fx === 'thin') return true;
    return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function rgba(rgb, a) {
    return 'rgba(' + (rgb[0] | 0) + ',' + (rgb[1] | 0) + ',' + (rgb[2] | 0) + ',' + a + ')';
  }
  function blob(c, x, y, rx, ry, rgb, a) {
    if (rx < 1 || ry < 1 || a <= 0) return;
    c.save();
    c.translate(x, y);
    c.scale(rx, ry);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, rgba(rgb, a));
    g.addColorStop(0.42, rgba(rgb, a * 0.45));
    g.addColorStop(1, rgba(rgb, 0));
    c.fillStyle = g;
    c.beginPath();
    c.arc(0, 0, 1, 0, 6.2832);
    c.fill();
    c.restore();
  }
  function bez(P, t) {
    const u = 1 - t;
    return [
      u * u * u * P[0][0] + 3 * u * u * t * P[1][0] + 3 * u * t * t * P[2][0] + t * t * t * P[3][0],
      u * u * u * P[0][1] + 3 * u * u * t * P[1][1] + 3 * u * t * t * P[2][1] + t * t * t * P[3][1]
    ];
  }
  function limb(c, P, w0, w1, rgb, a, rnd) {
    const n = 22, L = [], Rr = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const p = bez(P, t);
      const q = bez(P, Math.min(1, t + 0.025));
      let dx = q[0] - p[0], dy = q[1] - p[1];
      const d = Math.hypot(dx, dy) || 1;
      dx /= d; dy /= d;
      const ww = (w0 + (w1 - w0) * t) * (0.72 + rnd() * 0.5) * 0.5;
      L.push([p[0] - dy * ww, p[1] + dx * ww]);
      Rr.push([p[0] + dy * ww, p[1] - dx * ww]);
    }
    c.beginPath();
    c.moveTo(L[0][0], L[0][1]);
    for (let i = 1; i < L.length; i++) c.lineTo(L[i][0], L[i][1]);
    for (let i = Rr.length - 1; i >= 0; i--) c.lineTo(Rr[i][0], Rr[i][1]);
    c.closePath();
    c.fillStyle = rgba(rgb, a);
    c.fill();
  }
  function dry(c, x0, y0, x1, y1, rgb, a, width, rnd) {
    const n = 18;
    c.lineCap = 'butt';
    for (let i = 0; i < n; i++) {
      if (rnd() < 0.34) continue;
      const t0 = i / n, t1 = (i + 0.72) / n;
      const wob = (rnd() - 0.5) * width * 1.4;
      c.strokeStyle = rgba(rgb, a * (0.28 + rnd() * 0.72));
      c.lineWidth = Math.max(0.4, width * (0.25 + rnd() * 0.9) * Math.sin(Math.PI * ((t0 + t1) * 0.5)));
      c.beginPath();
      c.moveTo(x0 + (x1 - x0) * t0 + wob, y0 + (y1 - y0) * t0);
      c.lineTo(x0 + (x1 - x0) * t1, y0 + (y1 - y0) * t1 + wob * 0.35);
      c.stroke();
    }
  }
  function hair(c, x, y, len, ang, rgb, a, rnd) {
    c.strokeStyle = rgba(rgb, a);
    c.lineWidth = 0.6 + rnd() * 0.7;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    c.stroke();
  }

  /* 书写留白：中间让字，四边留笔意。 */
  function well(c, w, h, paper) {
    const g = c.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, rgba(paper, 0));
    g.addColorStop(0.08, rgba(paper, 0.5));
    g.addColorStop(0.16, rgba(paper, 0.88));
    g.addColorStop(0.84, rgba(paper, 0.88));
    g.addColorStop(0.93, rgba(paper, 0.35));
    g.addColorStop(1, rgba(paper, 0));
    c.fillStyle = g;
    c.fillRect(0, h * 0.04, w, h * 0.86);
    const v = c.createLinearGradient(0, 0, 0, h);
    v.addColorStop(0, rgba(paper, 0));
    v.addColorStop(0.045, rgba(paper, 0));
    v.addColorStop(0.15, rgba(paper, 0.55));
    v.addColorStop(0.74, rgba(paper, 0.55));
    v.addColorStop(0.88, rgba(paper, 0));
    v.addColorStop(1, rgba(paper, 0));
    c.fillStyle = v;
    c.fillRect(w * 0.05, 0, w * 0.9, h);
  }

  function spring(c, w, h, N, rnd, P) {
    const wet = P.wet;
    const pink = P.pink;
    blob(c, w * 0.92, h * 0.08, w * 0.36, h * 0.22, pink, N ? 0.36 : 0.28);
    blob(c, w * 0.06, h * 0.7, w * 0.28, h * 0.18, wet, N ? 0.16 : 0.12);
    blob(c, w * 0.18, h * 0.86, w * 0.36, h * 0.12, wet, 0.08);
  }

  function summer(c, w, h, N, rnd, P) {
    const leaf = P.leaf;
    const hole = P.paper;
    blob(c, w * 1.12, h * 0.48, w * 0.42, h * 0.72, leaf, N ? 0.96 : 0.88);
    blob(c, w * 1.04, h * 0.12, w * 0.3, h * 0.22, leaf, N ? 0.85 : 0.72);
    blob(c, w * 1.06, h * 0.84, w * 0.34, h * 0.26, leaf, N ? 0.8 : 0.66);
    blob(c, w * 0.86, h * 0.42, w * 0.12, h * 0.16, hole, N ? 0.4 : 0.22);
    blob(c, w * 0.5, h * -0.04, w * 0.9, h * 0.16, P.heat, N ? 0.12 : 0.16);
  }

  function autumn(c, w, h, N, rnd, P) {
    blob(c, w * 0.5, h * 1.02, w * 0.7, h * 0.28, P.ochre, N ? 0.55 : 0.42);
    blob(c, w * 0.2, h * 0.96, w * 0.4, h * 0.16, P.ochre, 0.28);
    blob(c, w * 0.86, h * 0.92, w * 0.36, h * 0.14, P.ochre, 0.24);
  }

  function winter(c, w, h, N, rnd, P) {
    const snow = P.snow;
    for (let i = 0; i < 4; i++) {
      const y = h * (0.03 + i * 0.035);
      c.fillStyle = rgba(N ? [150, 164, 176] : [168, 176, 184], 0.1 + i * 0.02);
      c.fillRect(0, y, w, Math.max(1, h * 0.008));
    }
    c.lineCap = 'butt';
    for (let i = 0; i < 36; i++) {
      const x = rnd() * w;
      const y = rnd() * h * 0.16;
      hair(c, x, y, 6 + rnd() * 22, (rnd() - 0.5) * 0.15, snow, N ? 0.35 : 0.5, rnd);
    }
  }

  function shore(c, w, h, season, N, rnd, P) {
    const y0 = h * 0.86;
    if (season === 0) {
      blob(c, w * 0.5, h * 0.96, w * 0.7, h * 0.1, P.wet, N ? 0.22 : 0.16);
      c.strokeStyle = rgba(N ? [210, 200, 188] : [90, 100, 96], 0.25);
      for (let i = 0; i < 8; i++) {
        const y = y0 + i * h * 0.012;
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(w * 0.08, y);
        c.lineTo(w * 0.92, y + Math.sin(i) * 2);
        c.stroke();
      }
    } else if (season === 1) {
      for (let i = 0; i < 22; i++) {
        const y = y0 + rnd() * h * 0.12;
        const x = rnd() * w;
        const len = 10 + rnd() * 48;
        c.strokeStyle = rgba(N ? [220, 236, 228] : [255, 252, 244], 0.35 + rnd() * 0.4);
        c.lineWidth = 0.8 + rnd() * 1.1;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + len, y);
        c.stroke();
      }
    } else if (season === 2) {
      c.strokeStyle = rgba(P.dry, N ? 0.35 : 0.28);
      for (let i = 0; i < 9; i++) {
        const y = y0 + i * h * 0.012;
        let x = w * 0.06;
        c.lineWidth = 1.1;
        c.beginPath();
        c.moveTo(x, y);
        while (x < w * 0.94) {
          const seg = 16 + rnd() * 50;
          if (rnd() < 0.45) c.moveTo(x + seg, y);
          else c.lineTo(x + seg, y + (rnd() - 0.5) * 1.5);
          x += seg;
        }
        c.stroke();
      }
    } else {
      const g = c.createLinearGradient(0, y0, 0, h);
      g.addColorStop(0, rgba(P.snow, 0));
      g.addColorStop(0.45, rgba(P.snow, N ? 0.14 : 0.28));
      g.addColorStop(1, rgba(P.snow, N ? 0.05 : 0.08));
      c.fillStyle = g;
      c.fillRect(0, y0, w, h - y0);
      c.strokeStyle = rgba(P.bone, 0.45);
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(0, y0 + 2);
      c.lineTo(w, y0 + 1);
      c.stroke();
    }
  }

  const DAY = [
    { paper: '#f7f1e6', rgb: [247, 241, 230], ink: [48, 40, 36], wet: [86, 108, 92], pink: [196, 120, 116] },
    { paper: '#e5f0e2', rgb: [229, 240, 226], leaf: [24, 46, 34], heat: [255, 220, 170], vein: [18, 36, 26] },
    { paper: '#f3e4cc', rgb: [243, 228, 204], dry: [112, 58, 26], ochre: [184, 102, 40] },
    { paper: '#e0e5eb', rgb: [224, 229, 235], bone: [52, 62, 74], snow: [255, 255, 255] }
  ];
  const NIGHT = [
    { paper: '#1a1412', rgb: [26, 20, 18], ink: [214, 202, 188], wet: [120, 150, 124], pink: [214, 146, 136] },
    { paper: '#101614', rgb: [16, 22, 20], leaf: [4, 8, 6], heat: [186, 140, 78], vein: [170, 196, 176] },
    { paper: '#1b140e', rgb: [27, 20, 14], dry: [214, 176, 128], ochre: [168, 96, 44] },
    { paper: '#141820', rgb: [20, 24, 32], bone: [198, 208, 216], snow: [226, 232, 238] }
  ];
  const DRAW = [spring, summer, autumn, winter];

  function paintOne(cv, season, N) {
    const w = cv.width, h = cv.height;
    const c = cv.getContext('2d');
    const rnd = Ink.mulberry(80 + season * 19 + (N ? 3 : 0));
    const P = (N ? NIGHT : DAY)[season];
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, w, h);
    c.fillStyle = P.paper;
    c.fillRect(0, 0, w, h);
    DRAW[season](c, w, h, N, rnd, P);
    well(c, w, h, P.rgb);
    shore(c, w, h, season, N, rnd, P);
    margin(c, w, h, season, N, rnd, P);
  }

  /* 留白之后再落边角，保证四幅册页在四边一眼可分。 */
  function margin(c, w, h, season, N, rnd, P) {
    if (season === 0) {
      blob(c, w * 0.98, h * 0.03, w * 0.28, h * 0.14, P.pink, N ? 0.58 : 0.48);
      const trunk = [[w * 1.05, h * 0.2], [w * 0.99, h * 0.34], [w * 0.96, h * 0.48], [w * 0.94, h * 0.64]];
      limb(c, trunk, Math.max(1.4, w * 0.007), 0.6, P.ink, N ? 0.6 : 0.68, rnd);
      limb(c, [[w * 1.0, h * 0.28], [w * 0.96, h * 0.2], [w * 0.93, h * 0.14], [w * 0.9, h * 0.06]], Math.max(1, w * 0.0035), 0.45, P.ink, 0.48, rnd);
      for (let i = 0; i < 12; i++) {
        blob(c, w * (0.9 + rnd() * 0.1), h * (0.04 + rnd() * 0.36), 2 + rnd() * 1.4, 1.3, P.pink, N ? 0.65 : 0.52);
      }
    } else if (season === 1) {
      blob(c, w * 1.02, h * 0.46, w * 0.3, h * 0.78, P.leaf, N ? 0.94 : 0.9);
      blob(c, w * 0.94, h * 0.1, w * 0.22, h * 0.18, P.leaf, N ? 0.8 : 0.72);
      blob(c, w * 0.98, h * 0.86, w * 0.24, h * 0.2, P.leaf, 0.66);
      blob(c, w * 0.84, h * 0.4, w * 0.08, h * 0.12, P.paper, N ? 0.35 : 0.2);
      for (let i = 0; i < 9; i++) {
        const x = w * (0.82 + rnd() * 0.2);
        const y = h * (0.12 + rnd() * 0.7);
        dry(c, x, y, x - w * 0.08, y + h * 0.05, N ? P.vein : P.leaf, 0.55, 3, rnd);
      }
    } else if (season === 2) {
      blob(c, w * 0.55, h * 1.04, w * 0.78, h * 0.2, P.ochre, N ? 0.72 : 0.6);
      for (let i = 0; i < 6; i++) {
        const y = h * (0.012 + i * 0.012);
        dry(c, w * (0.35 + rnd() * 0.2), y, w * (0.7 + rnd() * 0.3), y + h * 0.045, P.dry, N ? 0.55 : 0.48, 2.2, rnd);
      }
      for (let i = 0; i < 8; i++) {
        const x = w * (0.9 + rnd() * 0.1);
        const y = h * (0.08 + i * 0.09);
        dry(c, x + w * 0.04, y, x - w * 0.1, y + h * 0.07, P.dry, 0.55, 2.4, rnd);
      }
    } else {
      c.fillStyle = rgba(N ? [160, 174, 186] : [176, 184, 192], 0.18);
      c.fillRect(0, h * 0.03, w, Math.max(2, h * 0.01));
      const trunk = [[w * 1.02, h * 0.0], [w * 0.94, h * 0.08], [w * 0.9, h * 0.16], [w * 0.86, h * 0.24]];
      limb(c, trunk, Math.max(1.8, w * 0.009), 0.6, P.bone, N ? 0.84 : 0.9, rnd);
      limb(c, [[w * 0.96, h * 0.07], [w * 0.88, h * 0.04], [w * 0.8, h * 0.02], [w * 0.72, h * 0.0]], Math.max(1, w * 0.004), 0.45, P.bone, 0.7, rnd);
      limb(c, [[w * 0.92, h * 0.14], [w * 0.86, h * 0.12], [w * 0.8, h * 0.16], [w * 0.76, h * 0.12]], Math.max(0.8, w * 0.003), 0.4, P.bone, 0.62, rnd);
      for (let i = 0; i < 28; i++) {
        hair(c, rnd() * w, rnd() * h * 0.14, 7 + rnd() * 20, (rnd() - 0.5) * 0.2, P.snow, N ? 0.5 : 0.65, rnd);
      }
    }
  }

  function sizeOf() {
    const vw = Math.max(2, innerWidth || 2);
    const vh = Math.max(2, innerHeight || 2);
    const coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches && Math.min(vw, vh) < 1000;
    const cap = (coarse || thin()) ? 520 : 760;
    const k = Math.min(1, cap / Math.max(vw, vh));
    return { w: Math.max(2, Math.round(vw * k)), h: Math.max(2, Math.round(vh * k)) };
  }

  function paintAll() {
    const N = night();
    const sz = sizeOf();
    const key = sz.w + 'x' + sz.h + (N ? 'n' : 'd');
    if (key === paintedKey) return;
    paintedKey = key;
    for (let i = 0; i < 4; i++) {
      const cv = leaves[i];
      if (!cv) continue;
      cv.width = sz.w;
      cv.height = sz.h;
      paintOne(cv, i, N);
    }
  }

  function sweep() {
    if (thin()) return;
    if (document.body.dataset.screen !== 'main') return;
    document.body.classList.remove('album-sweep');
    void document.body.offsetWidth;
    document.body.classList.add('album-sweep');
    clearTimeout(sweepTimer);
    sweepTimer = setTimeout(function () { document.body.classList.remove('album-sweep'); }, 980);
  }

  function sync() {
    paintAll();
    const season = document.body.dataset.season;
    if (seenSeason !== null && season !== seenSeason) sweep();
    seenSeason = season == null ? seenSeason : season;
  }

  function init() {
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.body, { attributes: true, attributeFilter: ['data-season', 'data-screen'] });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-motion', 'data-fx'] });
    addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { paintedKey = ''; paintAll(); }, 160);
    });
    if (window.matchMedia) {
      const mq = matchMedia('(prefers-reduced-motion: reduce)');
      const on = function () { paintedKey = ''; paintAll(); };
      if (mq.addEventListener) mq.addEventListener('change', on);
      else if (mq.addListener) mq.addListener(on);
    }
  }

  init();
  return { init: init };
})();
