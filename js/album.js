/* 墨仙录 · 主界面册页四季
   同一张宣纸上的四种笔意。只在 data-screen=main 显出。
   卷首远山、红日、孤松、湖舟不经过这里。
   夏荫收在右缘外，晕进纸色，不铺成一条实边。
   轻动效只在主界面、且未开简动效时走；薄动效只留静册页。 */
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
  const breath = host.querySelector('.breath');
  let paintedKey = '';
  let sweepTimer = 0;
  let resizeTimer = 0;
  let seenSeason = null;
  let rafId = 0;
  let lastTick = 0;
  let clock = 0;
  let speckSeason = -1;
  let specks = [];

  function night() { return document.documentElement.dataset.theme === 'night'; }
  function thin() {
    const root = document.documentElement;
    if (root.dataset.motion === 'lite' || root.dataset.fx === 'thin') return true;
    return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function phone() {
    const vw = innerWidth || 2, vh = innerHeight || 2;
    return !!(window.matchMedia && matchMedia('(pointer: coarse)').matches && Math.min(vw, vh) < 1000);
  }
  function rgba(rgb, a) {
    return 'rgba(' + (rgb[0] | 0) + ',' + (rgb[1] | 0) + ',' + (rgb[2] | 0) + ',' + a + ')';
  }
  function blob(c, x, y, rx, ry, rgb, a) {
    wash(c, x, y, rx, ry, rgb, a, 0, 0);
  }
  /* 大团用更散的停笔：核小、边虚，避免叠成一条硬边。 */
  function wash(c, x, y, rx, ry, rgb, a, rot, soft) {
    if (rx < 1 || ry < 1 || a <= 0) return;
    c.save();
    c.translate(x, y);
    if (rot) c.rotate(rot);
    c.scale(rx, ry);
    const g = c.createRadialGradient(-0.14, -0.08, 0, 0.05, 0.02, 1);
    if (soft) {
      g.addColorStop(0, rgba(rgb, a));
      g.addColorStop(0.16, rgba(rgb, a * 0.48));
      g.addColorStop(0.4, rgba(rgb, a * 0.14));
      g.addColorStop(0.68, rgba(rgb, a * 0.035));
      g.addColorStop(1, rgba(rgb, 0));
    } else {
      g.addColorStop(0, rgba(rgb, a));
      g.addColorStop(0.42, rgba(rgb, a * 0.45));
      g.addColorStop(1, rgba(rgb, 0));
    }
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
  function hair(c, x, y, len, ang, rgb, a, width) {
    c.strokeStyle = rgba(rgb, a);
    c.lineWidth = width || 0.8;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    c.stroke();
  }
  function strand(c, x, y, len, bend, rgb, a) {
    c.strokeStyle = rgba(rgb, a);
    c.lineWidth = 0.8;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x + bend, y + len * 0.45, x + bend * 0.25, y + len);
    c.stroke();
  }
  function leafMark(c, x, y, s, rot, rgb, a) {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.strokeStyle = rgba(rgb, a);
    c.lineCap = 'round';
    c.lineWidth = Math.max(0.7, s * 0.11);
    c.beginPath();
    c.moveTo(-s * 0.5, s * 0.12);
    c.quadraticCurveTo(-s * 0.02, -s * 0.42, s * 0.46, s * 0.02);
    c.stroke();
    c.lineWidth = Math.max(0.4, s * 0.045);
    c.beginPath();
    c.moveTo(-s * 0.08, -s * 0.02);
    c.lineTo(s * 0.18, -s * 0.16);
    c.stroke();
    c.restore();
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
    wash(c, w * 0.98, h * 0.05, w * 0.26, h * 0.15, pink, N ? 0.22 : 0.16, -0.2, 1);
    wash(c, w * 0.9, h * 0.16, w * 0.16, h * 0.1, pink, N ? 0.12 : 0.09, 0.3, 1);
    wash(c, w * 0.05, h * 0.68, w * 0.24, h * 0.16, wet, N ? 0.13 : 0.1, 0, 1);
    wash(c, w * 0.16, h * 0.9, w * 0.32, h * 0.1, wet, 0.07, 0, 1);
    wash(c, w * 0.06, h * 0.16, w * 0.18, h * 0.12, P.bud, N ? 0.1 : 0.07, 0, 1);
  }

  function summer(c, w, h, N, rnd, P) {
    /* 底子只留一层热晕。浓荫改在留白之后画，避免被纸色盖没，也不叠成实边。 */
    wash(c, w * 0.5, h * -0.02, w * 0.78, h * 0.11, P.heat, N ? 0.1 : 0.13, 0, 1);
  }

  function autumn(c, w, h, N, rnd, P) {
    wash(c, w * 0.38, h * 1.08, w * 0.42, h * 0.18, P.ochre, N ? 0.28 : 0.2, 0, 1);
    wash(c, w * 0.12, h * 1.02, w * 0.26, h * 0.12, P.ochre, 0.14, 0.2, 1);
    wash(c, w * 0.82, h * 1.0, w * 0.28, h * 0.12, P.rust, 0.16, -0.15, 1);
    wash(c, w * 1.04, h * 0.18, w * 0.14, h * 0.2, P.dry, N ? 0.1 : 0.07, 0, 1);
  }

  function winter(c, w, h, N, rnd, P) {
    const snow = P.snow;
    c.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const y = h * (0.03 + i * 0.022);
      const x0 = w * (0.02 + rnd() * 0.28);
      const x1 = x0 + w * (0.16 + rnd() * 0.34);
      c.strokeStyle = rgba(N ? [150, 166, 178] : [168, 178, 188], 0.12 + i * 0.025);
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x0, y);
      c.lineTo(x1, y + (rnd() - 0.5) * 2);
      c.stroke();
    }
    for (let i = 0; i < 16; i++) {
      const x = rnd() * w;
      const y = rnd() * h * 0.14;
      hair(c, x, y, 5 + rnd() * 16, (rnd() - 0.5) * 0.2, snow, N ? 0.28 : 0.4, 0.6 + rnd() * 0.5);
    }
  }

  function shore(c, w, h, season, N, rnd, P) {
    const y0 = h * 0.88;
    if (season === 0) {
      wash(c, w * 0.5, h * 0.98, w * 0.62, h * 0.08, P.wet, N ? 0.16 : 0.11, 0, 1);
      c.strokeStyle = rgba(N ? [210, 200, 188] : [90, 100, 96], 0.18);
      for (let i = 0; i < 6; i++) {
        const y = y0 + i * h * 0.012;
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(w * 0.08, y);
        c.lineTo(w * 0.92, y + Math.sin(i) * 2);
        c.stroke();
      }
    } else if (season === 1) {
      for (let i = 0; i < 12; i++) {
        const y = y0 + rnd() * h * 0.1;
        const left = rnd() < 0.45;
        const x = left ? rnd() * w * 0.16 : w * (0.86 + rnd() * 0.12);
        const len = 8 + rnd() * 28;
        c.strokeStyle = rgba(N ? [210, 228, 214] : [248, 252, 240], 0.28 + rnd() * 0.28);
        c.lineWidth = 0.7 + rnd() * 0.8;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + (left ? len : -len), y);
        c.stroke();
      }
    } else if (season === 2) {
      c.strokeStyle = rgba(P.dry, N ? 0.28 : 0.22);
      for (let i = 0; i < 6; i++) {
        const y = y0 + i * h * 0.014;
        let x = w * (i % 2 ? 0.62 : 0.04);
        const end = i % 2 ? w * 0.96 : w * 0.28;
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(x, y);
        while (x < end) {
          const seg = 12 + rnd() * 36;
          if (rnd() < 0.4) c.moveTo(x + seg, y);
          else c.lineTo(x + seg, y + (rnd() - 0.5) * 1.4);
          x += seg;
        }
        c.stroke();
      }
    } else {
      const g = c.createLinearGradient(0, y0, 0, h);
      g.addColorStop(0, rgba(P.snow, 0));
      g.addColorStop(0.5, rgba(P.snow, N ? 0.1 : 0.2));
      g.addColorStop(1, rgba(P.snow, N ? 0.04 : 0.06));
      c.fillStyle = g;
      c.fillRect(0, y0, w, h - y0);
      c.strokeStyle = rgba(P.bone, 0.22);
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(w * 0.06, y0 + 2);
      c.lineTo(w * 0.28, y0 + 1);
      c.moveTo(w * 0.74, y0 + 2);
      c.lineTo(w * 0.94, y0 + 1);
      c.stroke();
    }
  }

  const DAY = [
    { paper: '#f7f1e6', rgb: [247, 241, 230], ink: [48, 40, 36], wet: [86, 108, 92], bud: [118, 146, 108], pink: [196, 120, 116] },
    { paper: '#e6f0e3', rgb: [230, 240, 227], leaf: [64, 98, 74], deep: [44, 72, 54], heat: [255, 214, 164], sun: [236, 244, 216], vein: [40, 68, 48] },
    { paper: '#f3e4cc', rgb: [243, 228, 204], dry: [112, 58, 26], ochre: [184, 102, 40], rust: [150, 72, 32] },
    { paper: '#e0e5eb', rgb: [224, 229, 235], bone: [52, 62, 74], snow: [255, 255, 255] }
  ];
  const NIGHT = [
    { paper: '#1a1412', rgb: [26, 20, 18], ink: [214, 202, 188], wet: [120, 150, 124], bud: [150, 176, 140], pink: [214, 146, 136] },
    { paper: '#121a16', rgb: [18, 26, 22], leaf: [58, 90, 70], deep: [16, 32, 24], heat: [186, 140, 78], sun: [176, 204, 168], vein: [176, 204, 180] },
    { paper: '#1b140e', rgb: [27, 20, 14], dry: [214, 176, 128], ochre: [168, 96, 44], rust: [196, 120, 64] },
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
      wash(c, w * 1.0, h * 0.02, w * 0.2, h * 0.1, P.pink, N ? 0.34 : 0.26, -0.15, 1);
      const trunk = [[w * 1.04, h * 0.18], [w * 0.99, h * 0.32], [w * 0.965, h * 0.46], [w * 0.95, h * 0.6]];
      limb(c, trunk, Math.max(1.2, w * 0.0055), 0.5, P.ink, N ? 0.5 : 0.55, rnd);
      limb(c, [[w * 0.995, h * 0.26], [w * 0.95, h * 0.18], [w * 0.92, h * 0.12], [w * 0.89, h * 0.05]], Math.max(0.8, w * 0.003), 0.4, P.ink, 0.4, rnd);
      for (let i = 0; i < 8; i++) {
        blob(c, w * (0.9 + rnd() * 0.1), h * (0.03 + rnd() * 0.28), 1.1 + rnd() * 1.5, 0.9 + rnd() * 0.5, P.pink, N ? 0.5 : 0.4);
      }
      for (let i = 0; i < 4; i++) {
        blob(c, w * (0.78 + rnd() * 0.1), h * (0.02 + rnd() * 0.16), 1 + rnd() * 1.1, 0.8, P.pink, N ? 0.32 : 0.24);
      }
      for (let i = 0; i < 5; i++) {
        const bend = w * (0.028 + rnd() * 0.04) * (i % 2 ? 1 : -0.35);
        strand(c, w * (0.012 + i * 0.026), h * (0.48 + rnd() * 0.1), h * (0.1 + rnd() * 0.1), bend, P.bud, N ? 0.3 : 0.22);
      }
    } else if (season === 1) {
      const veil = N ? [3, 10, 6] : P.deep;
      const clump = N ? [4, 12, 8] : P.leaf;
      const g = c.createLinearGradient(w * 0.84, 0, w, 0);
      const a = N ? 0.92 : 0.46;
      g.addColorStop(0, rgba(veil, 0));
      g.addColorStop(0.38, rgba(veil, a * (N ? 0.28 : 0.18)));
      g.addColorStop(0.7, rgba(veil, a * (N ? 0.55 : 0.34)));
      g.addColorStop(1, rgba(veil, a * (N ? 0.22 : 0.12)));
      c.fillStyle = g;
      c.fillRect(w * 0.84, 0, w * 0.16, h);
      wash(c, w * 1.05, h * 0.16, w * 0.13, h * 0.16, clump, N ? 0.42 : 0.3, 0.35, 1);
      wash(c, w * 1.02, h * 0.4, w * 0.1, h * 0.18, N ? clump : P.deep, N ? 0.36 : 0.24, -0.25, 1);
      wash(c, w * 1.06, h * 0.66, w * 0.12, h * 0.16, clump, N ? 0.34 : 0.22, 0.15, 1);
      wash(c, w * 0.98, h * 0.86, w * 0.09, h * 0.1, clump, N ? 0.24 : 0.16, 0.4, 1);
      wash(c, w * 0.93, h * 0.28, w * 0.045, h * 0.05, P.sun, N ? 0.18 : 0.26, 0.4, 1);
      wash(c, w * 0.96, h * 0.58, w * 0.04, h * 0.045, P.paper, N ? 0.16 : 0.24, -0.3, 1);
      for (let i = 0; i < 6; i++) {
        const x = w * (0.92 + rnd() * 0.09);
        const y = h * (0.08 + rnd() * 0.8);
        dry(c, x, y, x - w * (0.025 + rnd() * 0.035), y + h * (rnd() - 0.4) * 0.04, N ? P.vein : P.leaf, N ? 0.4 : 0.28, 1.2, rnd);
      }
    } else if (season === 2) {
      wash(c, w * 0.5, h * 1.06, w * 0.55, h * 0.14, P.ochre, N ? 0.34 : 0.26, 0, 1);
      wash(c, w * 0.86, h * 1.02, w * 0.22, h * 0.1, P.rust, N ? 0.22 : 0.16, 0, 1);
      for (let i = 0; i < 4; i++) {
        const y = h * (0.012 + i * 0.014);
        dry(c, w * (0.55 + rnd() * 0.15), y, w * (0.82 + rnd() * 0.16), y + h * 0.03, P.dry, N ? 0.42 : 0.36, 1.8, rnd);
      }
      for (let i = 0; i < 5; i++) {
        const x = w * (0.9 + rnd() * 0.1);
        const y = h * (0.1 + i * 0.12);
        dry(c, x + w * 0.03, y, x - w * 0.07, y + h * 0.05, P.dry, 0.4, 1.8, rnd);
      }
      for (let i = 0; i < 5; i++) {
        const left = i < 2;
        leafMark(
          c,
          w * (left ? 0.03 + rnd() * 0.08 : 0.9 + rnd() * 0.08),
          h * (0.7 + rnd() * 0.2),
          7 + rnd() * 8,
          rnd() * 3.2,
          i % 2 ? P.ochre : P.dry,
          N ? 0.5 : 0.42
        );
      }
    } else {
      for (let i = 0; i < 3; i++) {
        const y = h * (0.02 + i * 0.016);
        const x0 = rnd() * w * 0.4;
        c.strokeStyle = rgba(N ? [160, 174, 186] : [176, 184, 192], 0.16);
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(x0, y);
        c.lineTo(x0 + w * (0.12 + rnd() * 0.22), y + (rnd() - 0.5));
        c.stroke();
      }
      const trunk = [[w * 1.01, h * 0.0], [w * 0.94, h * 0.07], [w * 0.9, h * 0.14], [w * 0.87, h * 0.2]];
      limb(c, trunk, Math.max(1.4, w * 0.007), 0.5, P.bone, N ? 0.72 : 0.78, rnd);
      limb(c, [[w * 0.95, h * 0.06], [w * 0.88, h * 0.035], [w * 0.8, h * 0.02], [w * 0.74, h * 0.0]], Math.max(0.8, w * 0.0032), 0.4, P.bone, 0.55, rnd);
      limb(c, [[w * 0.91, h * 0.12], [w * 0.86, h * 0.1], [w * 0.81, h * 0.13], [w * 0.78, h * 0.1]], Math.max(0.7, w * 0.0026), 0.35, P.bone, 0.48, rnd);
      for (let i = 0; i < 14; i++) {
        hair(c, rnd() * w, rnd() * h * 0.12, 6 + rnd() * 14, (rnd() - 0.5) * 0.25, P.snow, N ? 0.4 : 0.55, 0.6 + rnd() * 0.4);
      }
    }
  }

  function sizeOf() {
    const vw = Math.max(2, innerWidth || 2);
    const vh = Math.max(2, innerHeight || 2);
    const cap = (phone() || thin()) ? 520 : 760;
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
    if (breath) {
      breath.width = sz.w;
      breath.height = sz.h;
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

  function seasonIndex() {
    const n = parseInt(document.body.dataset.season, 10);
    return n >= 0 && n <= 3 ? n : 0;
  }
  function alive() {
    return document.body.dataset.screen === 'main' && !document.hidden && !thin();
  }
  function edgeFade(x, y) {
    const dx = Math.abs(x - 0.5) * 2;
    const dy = Math.abs(y - 0.46) * 2;
    const e = Math.max(dx, dy * 0.85);
    if (e >= 0.82) return 1;
    if (e <= 0.38) return 0.22;
    const t = (e - 0.38) / 0.44;
    return 0.22 + 0.78 * t * t;
  }
  function makeSpecks(season) {
    const rnd = Ink.mulberry(210 + season * 29);
    const small = phone();
    const n = [small ? 7 : 11, small ? 5 : 7, small ? 5 : 8, small ? 14 : 22][season];
    const list = [];
    for (let i = 0; i < n; i++) {
      if (season === 0) {
        list.push({
          k: 0,
          x: rnd() < 0.7 ? 0.72 + rnd() * 0.3 : rnd() * 0.2,
          y: rnd(),
          v: 0.03 + rnd() * 0.028,
          r: 1.4 + rnd() * 1.8,
          a: 0.34 + rnd() * 0.28,
          ph: rnd() * 6.2832,
          sway: 0.01 + rnd() * 0.018
        });
      } else if (season === 1) {
        list.push({
          k: 1,
          x: 0.86 + rnd() * 0.14,
          y: 0.08 + rnd() * 0.84,
          v: 0.008 + rnd() * 0.012,
          r: 1.6 + rnd() * 2.4,
          a: 0.22 + rnd() * 0.2,
          ph: rnd() * 6.2832,
          sway: 0.006 + rnd() * 0.01
        });
      } else if (season === 2) {
        const left = i < 2;
        const x0 = left ? 0.02 + rnd() * 0.12 : 0.8 + rnd() * 0.2;
        list.push({
          k: 2,
          x: x0,
          x0: x0,
          y: rnd(),
          v: 0.05 + rnd() * 0.04,
          s: 8 + rnd() * 10,
          rot: rnd() * 6.2832,
          vr: (rnd() - 0.5) * 0.9,
          a: 0.42 + rnd() * 0.28,
          ph: rnd() * 6.2832,
          sway: 0.012 + rnd() * 0.02,
          dye: rnd() < 0.5 ? 0 : 1
        });
      } else {
        list.push({
          k: 3,
          x: rnd(),
          y: rnd(),
          v: 0.04 + rnd() * 0.045,
          r: 0.7 + rnd() * 1.2,
          a: 0.34 + rnd() * 0.36,
          ph: rnd() * 6.2832,
          sway: 0.008 + rnd() * 0.014,
          hair: rnd() < 0.4,
          ang: (rnd() - 0.5) * 0.4 + 1.25
        });
      }
    }
    return list;
  }
  function ensureSpecks(season) {
    if (season === speckSeason && specks.length) return;
    speckSeason = season;
    specks = makeSpecks(season);
  }
  function stepSpecks(dt, t) {
    for (let i = 0; i < specks.length; i++) {
      const s = specks[i];
      if (s.k === 0) {
        s.y -= s.v * dt;
        s.x += Math.sin(t * 0.7 + s.ph) * s.sway * dt * 8;
        if (s.y < -0.04) s.y = 1.03;
        if (s.x < -0.03) s.x = 1.01;
        if (s.x > 1.05) s.x = -0.02;
      } else if (s.k === 1) {
        s.x += Math.sin(t * 0.9 + s.ph) * s.sway * dt * 6;
        s.y += Math.cos(t * 0.55 + s.ph) * s.sway * dt * 5;
        if (s.x < 0.84) s.x = 0.84;
        if (s.x > 1.02) s.x = 1.02;
        if (s.y < 0.02) s.y = 0.02;
        if (s.y > 0.96) s.y = 0.96;
      } else if (s.k === 2) {
        s.y += s.v * dt;
        s.x += Math.sin(t * 0.85 + s.ph) * s.sway * dt * 7;
        s.rot += s.vr * dt;
        if (s.y > 1.06) { s.y = -0.06; s.x = s.x0; }
      } else {
        s.y += s.v * dt;
        s.x += Math.sin(t * 0.45 + s.ph) * s.sway * dt * 6;
        if (s.y > 1.04) { s.y = -0.04; s.x = (s.x + 0.17) % 1; }
        if (s.x < -0.02) s.x = 0.98;
        if (s.x > 1.02) s.x = 0.02;
      }
    }
  }
  function drawSpecks(c, w, h, season, N) {
    const P = (N ? NIGHT : DAY)[season];
    for (let i = 0; i < specks.length; i++) {
      const s = specks[i];
      const fade = edgeFade(s.x, s.y);
      const a = s.a * fade;
      if (a < 0.02) continue;
      if (s.k === 0) {
        blob(c, s.x * w, s.y * h, s.r, s.r * 0.7, P.pink, a);
      } else if (s.k === 1) {
        const tw = 0.65 + 0.35 * Math.sin(clock * 1.4 + s.ph);
        blob(c, s.x * w, s.y * h, s.r, s.r * 0.75, P.sun, a * tw);
      } else if (s.k === 2) {
        leafMark(c, s.x * w, s.y * h, s.s, s.rot, s.dye ? P.ochre : P.dry, a);
      } else if (s.hair) {
        hair(c, s.x * w, s.y * h, 2.2 + s.r * 2.4, s.ang, P.snow, a, 0.7);
      } else {
        blob(c, s.x * w, s.y * h, s.r, s.r, P.snow, a);
      }
    }
  }
  function clearBreath() {
    if (!breath || !breath.width) return;
    const c = breath.getContext('2d');
    if (c) c.clearRect(0, 0, breath.width, breath.height);
  }
  function stopBreath() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    clearBreath();
  }
  function tick(now) {
    rafId = 0;
    if (!alive()) { clearBreath(); return; }
    rafId = requestAnimationFrame(tick);
    if (lastTick && now - lastTick < 48) return;
    const dt = lastTick ? Math.min(0.08, (now - lastTick) / 1000) : 0.05;
    lastTick = now;
    clock += dt;
    if (!breath || !breath.width) return;
    const season = seasonIndex();
    ensureSpecks(season);
    const c = breath.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, breath.width, breath.height);
    stepSpecks(dt, clock);
    drawSpecks(c, breath.width, breath.height, season, night());
  }
  function pump() {
    if (!alive()) { stopBreath(); return; }
    ensureSpecks(seasonIndex());
    if (!rafId) {
      lastTick = 0;
      rafId = requestAnimationFrame(tick);
    }
  }

  function sync() {
    paintAll();
    const season = document.body.dataset.season;
    if (seenSeason !== null && season !== seenSeason) sweep();
    seenSeason = season == null ? seenSeason : season;
    pump();
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
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopBreath();
      else pump();
    });
    if (window.matchMedia) {
      const mq = matchMedia('(prefers-reduced-motion: reduce)');
      const on = function () { paintedKey = ''; paintAll(); pump(); };
      if (mq.addEventListener) mq.addEventListener('change', on);
      else if (mq.addListener) mq.addListener(on);
    }
  }

  init();
  return { init: init };
})();
