/* 墨仙录 · 水墨渲染：宣纸、远山、云雾、墨晕 */
'use strict';
const Ink = (() => {
  function mulberry(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  function layerScale(W, H) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const coarse = window.matchMedia && matchMedia('(pointer:coarse)').matches && Math.min(window.innerWidth, window.innerHeight) < 1000;
    const area = Math.max(1, W * H);
    if (coarse) return Math.min(dpr, 1.5, Math.max(1, Math.sqrt(2.2e6 / area)));
    return Math.min(dpr, Math.max(1, Math.sqrt(1.2e7 / area)));
  }

  function toURL(cv) {
    return new Promise(res => {
      if (cv.toBlob) cv.toBlob(b => res(b ? URL.createObjectURL(b) : cv.toDataURL()), 'image/png');
      else res(cv.toDataURL());
    });
  }

  /* ---------- 宣纸纹理（笺面平铺：只留细纤维和颗粒，不要大块色斑） ---------- */
  function paperTile(size = 512) {
    const cv = document.createElement('canvas'); cv.width = cv.height = size;
    const c = cv.getContext('2d'); const R = mulberry(7);
    c.fillStyle = '#efe6d3'; c.fillRect(0, 0, size, size);
    const wrap = fn => { for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { c.save(); c.translate(dx * size, dy * size); fn(); c.restore(); } };
    for (let i = 0; i < 420; i++) {
      const x = R() * size, y = R() * size, len = 6 + R() * 38, ang = R() * Math.PI * 2, bend = (R() - 0.5) * 14;
      const light = R() < 0.35;
      c.strokeStyle = light ? `rgba(255,253,245,${0.25 + R() * 0.3})` : `rgba(110,88,60,${0.05 + R() * 0.09})`;
      c.lineWidth = 0.4 + R() * 0.9;
      wrap(() => { c.beginPath(); c.moveTo(x, y);
        c.quadraticCurveTo(x + Math.cos(ang) * len / 2 + bend, y + Math.sin(ang) * len / 2 - bend, x + Math.cos(ang) * len, y + Math.sin(ang) * len); c.stroke(); });
    }
    // 颗粒噪声
    const img = c.getImageData(0, 0, size, size), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (R() - 0.5) * 16 + (R() < 0.004 ? -40 * R() : 0);
      d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.9;
    }
    c.putImageData(img, 0, 0);
    return toURL(cv);
  }

  /* 整页宣纸：铺满当前视口，不重复。只有细纤维、细颗粒，和两三团比画面还大的极淡墨气。 */
  function paperField(cv) {
    const w = cv.width, h = cv.height; if (!w || !h) return;
    const c = cv.getContext('2d', { willReadFrequently: true }); const R = mulberry(11);
    c.fillStyle = '#efe6d3'; c.fillRect(0, 0, w, h);
    const span = Math.max(w, h);
    for (let i = 0; i < 3; i++) {
      const x = R() * w, y = R() * h, r = span * (0.85 + R() * 0.35), a = 0.008 + R() * 0.012;
      const g = c.createRadialGradient(x, y, r * 0.2, x, y, r);
      g.addColorStop(0, `rgba(138,112,74,${a.toFixed(3)})`); g.addColorStop(1, 'rgba(138,112,74,0)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    }
    c.lineCap = 'round';
    const fibers = Math.min(2800, Math.max(180, Math.round(w * h / 1400)));
    for (let i = 0; i < fibers; i++) {
      const x = R() * w, y = R() * h, len = 5 + R() * 28, ang = R() * Math.PI * 2, bend = (R() - 0.5) * 8;
      const light = R() < 0.35;
      c.strokeStyle = light ? `rgba(255,253,245,${0.18 + R() * 0.22})` : `rgba(110,88,60,${0.035 + R() * 0.05})`;
      c.lineWidth = 0.35 + R() * 0.55;
      c.beginPath(); c.moveTo(x, y);
      c.quadraticCurveTo(x + Math.cos(ang) * len / 2 + bend, y + Math.sin(ang) * len / 2 - bend, x + Math.cos(ang) * len, y + Math.sin(ang) * len);
      c.stroke();
    }
    const img = c.getImageData(0, 0, w, h), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (R() - 0.5) * 8;
      d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.9;
    }
    c.putImageData(img, 0, 0);
  }

  /* ---------- 远山（水墨晕染） ---------- */
  function ridgeLine(W, R, o) {
    const step = 2, n = Math.ceil(W / step) + 2, pts = [];
    const peaks = [];
    for (let i = 0; i < o.peaks; i++) {
      const x = ((i + 0.15 + R() * 0.7) / o.peaks) * W * 1.08 - W * 0.04;
      const h = o.amp * (i === o.hero ? 1 : 0.38 + R() * 0.5);
      peaks.push({ x, h, wl: W * o.width * (0.55 + R() * 0.9), wr: W * o.width * (0.55 + R() * 0.9), sharp: o.sharp * (0.75 + R() * 0.5) });
      // 副峰
      if (R() < 0.8) peaks.push({ x: x + (R() < 0.5 ? -1 : 1) * W * o.width * (0.5 + R() * 0.5), h: h * (0.45 + R() * 0.3), wl: W * o.width * 0.5, wr: W * o.width * 0.5, sharp: o.sharp });
    }
    // 分形噪声
    const noise = new Float32Array(n); const oct = [[0.006, 0.07], [0.017, 0.035], [0.05, 0.016], [0.13, 0.007]];
    const ph = oct.map(() => R() * 100);
    for (let i = 0; i < n; i++) { let v = 0; oct.forEach(([f, a], k) => v += Math.sin(i * step * f + ph[k]) * a + Math.sin(i * step * f * 1.7 + ph[k] * 2) * a * 0.5); noise[i] = v; }
    for (let i = 0; i < n; i++) {
      const x = i * step; let h = 0;
      for (const p of peaks) {
        const d = x - p.x, t = Math.abs(d) / (d < 0 ? p.wl : p.wr);
        // 圆顶陡壁：上部圆润，下部舒展
        const v = p.h / (1 + Math.pow(t, p.sharp) * 3.2);
        h = Math.max(h, v);
      }
      h = h * (1 + noise[i] * 1.4) + o.amp * noise[i] * 0.35;
      pts.push([x, o.base - h]);
    }
    return pts;
  }
  function pathOf(c, pts, W, H) { c.beginPath(); c.moveTo(-2, H + 2); for (const p of pts) c.lineTo(p[0], p[1]); c.lineTo(W + 2, H + 2); c.closePath(); }

  function treeCluster(c, x, y, s, R, rgb, a) {
    // 点叶树：一簇墨点 + 细干
    const n = 3 + Math.floor(R() * 4);
    for (let t = 0; t < n; t++) {
      const tx = x + (R() - 0.5) * 22 * s, th = (10 + R() * 14) * s, ty = y + R() * 4 * s;
      c.strokeStyle = `rgba(${rgb},${a * 0.9})`; c.lineWidth = 0.9 * s; c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + (R() - 0.5) * 3 * s, ty - th / 2, tx + (R() - 0.5) * 2 * s, ty - th); c.stroke();
      const dots = 14 + Math.floor(R() * 10);
      for (let k = 0; k < dots; k++) {
        const ang = R() * Math.PI * 2, rr = Math.sqrt(R()) * 5.5 * s;
        c.fillStyle = `rgba(${rgb},${a * (0.35 + R() * 0.55)})`;
        c.beginPath(); c.ellipse(tx + Math.cos(ang) * rr * 1.2, ty - th + Math.sin(ang) * rr * 0.8, (1.1 + R() * 1.4) * s, (0.6 + R() * 0.8) * s, (R() - 0.5) * 0.8, 0, 7); c.fill();
      }
    }
  }

  function mountainLayer(cv, o) {
    const W = o.W || cv.clientWidth, H = o.H || cv.clientHeight; if (!W || !H) return false;
    const dpr = o.W ? 1 : layerScale(W, H);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
    const R = mulberry(o.seed);
    const pts = ridgeLine(W, R, { base: H * o.base, amp: H * o.amp, peaks: o.peaks, width: o.width, sharp: o.sharp, hero: o.hero ?? -1 });
    const rgb = o.rgb.join(','), A = o.alpha;
    // 1) 底层淡墨（整体薄染）
    c.save(); pathOf(c, pts, W, H); c.clip();
    let minY = H; for (const p of pts) minY = Math.min(minY, p[1]);
    const g0 = c.createLinearGradient(0, minY, 0, H);
    g0.addColorStop(0, `rgba(${rgb},${A * 0.22})`); g0.addColorStop(o.fade, `rgba(${rgb},0)`);
    c.fillStyle = g0; c.fillRect(0, 0, W, H);
    // 2) 沿山脊向下晕染：浓处在脊，渐淡入雾
    const N = 26, depth = H * o.wash;
    c.lineJoin = 'round'; c.lineCap = 'round';
    for (let k = N; k >= 0; k--) {
      const t = k / N, off = t * depth;
      c.strokeStyle = `rgba(${rgb},${A * 0.16 * Math.pow(1 - t, 1.6)})`;
      c.lineWidth = depth / N * 2.4 + 2;
      c.beginPath();
      for (let i = 0; i < pts.length; i += 2) { const [x, y] = pts[i]; i ? c.lineTo(x, y + off) : c.moveTo(x, y + off); }
      c.stroke();
    }
    // 3) 皴擦：顺坡而下的干笔
    const strokes = Math.floor(W * o.cun);
    for (let k = 0; k < strokes; k++) {
      const i = Math.floor(R() * (pts.length - 2)) + 1; const [x, y] = pts[i];
      const slope = (pts[i + 1][1] - pts[i - 1][1]) / 4; const len = (8 + R() * 30) * o.cunLen;
      const sy = y + R() * depth * 0.35, dir = slope > 0 ? 1 : -1;
      c.strokeStyle = `rgba(${rgb},${A * (0.08 + R() * 0.22)})`; c.lineWidth = 0.5 + R() * 1.1;
      c.beginPath(); c.moveTo(x, sy);
      c.quadraticCurveTo(x + dir * len * 0.25, sy + len * 0.5, x + dir * len * (0.2 + R() * 0.4), sy + len); c.stroke();
    }
    // 4) 内部山褶（断续淡线，表现山体层次）
    for (let f = 0; f < o.folds; f++) {
      const off = depth * (0.18 + f * 0.22) * (0.8 + R() * 0.4), amp = 6 + R() * 10;
      c.strokeStyle = `rgba(${rgb},${A * 0.22})`; c.lineWidth = 0.8;
      let on = false; c.beginPath();
      for (let i = 0; i < pts.length; i += 2) {
        if (R() < 0.025) on = !on;
        const [x, y] = pts[i], yy = y + off + Math.sin(i * 0.03 + f * 2) * amp;
        on ? c.lineTo(x, yy) : c.moveTo(x, yy);
      }
      c.stroke();
    }
    c.restore();
    // 5) 山脊勾勒：断续、粗细有变
    if (o.line > 0) {
      c.save(); c.lineCap = 'round';
      let w = o.line, on = true;
      for (let i = 2; i < pts.length; i += 2) {
        if (R() < 0.018) on = !on;
        if (!on) continue;
        w += (R() - 0.5) * 0.35; w = Math.max(o.line * 0.25, Math.min(o.line * 1.8, w));
        c.strokeStyle = `rgba(${rgb},${Math.min(1, A * 1.15)})`; c.lineWidth = w;
        c.beginPath(); c.moveTo(pts[i - 2][0], pts[i - 2][1] + 0.5); c.lineTo(pts[i][0], pts[i][1] + 0.5); c.stroke();
      }
      c.restore();
    }
    // 6) 苔点
    if (o.dots) {
      for (let i = 0; i < pts.length; i += 3) if (R() < o.dots) {
        const [x, y] = pts[i];
        c.fillStyle = `rgba(${rgb},${Math.min(1, A * (0.7 + R() * 0.5))})`;
        c.beginPath(); c.ellipse(x + (R() - 0.5) * 5, y + 1 + R() * 6, 0.8 + R() * 1.8, 0.6 + R() * 1.1, R() * 3, 0, 7); c.fill();
      }
    }
    // 7) 点叶树丛
    if (o.trees) {
      for (let k = 0; k < o.trees; k++) {
        const i = Math.floor((0.05 + R() * 0.9) * (pts.length - 1)); const [x, y] = pts[i];
        treeCluster(c, x, y + 3, o.treeSize * (0.7 + R() * 0.5), R, rgb, Math.min(1, A * 1.05));
      }
    }
    // 8) 底部渐隐，避免画布边缘出现硬线
    if (o.bottomFade !== false) {
      c.save(); c.globalCompositeOperation = 'destination-out';
      const gf = c.createLinearGradient(0, H * 0.62, 0, H);
      gf.addColorStop(0, 'rgba(0,0,0,0)'); gf.addColorStop(1, 'rgba(0,0,0,1)');
      c.fillStyle = gf; c.fillRect(0, H * 0.62, W, H * 0.38); c.restore();
    }
  }

  /* ---------- 云雾贴图 ---------- */
  function mistSprite() {
    // 横向必须均匀。一排椭圆铺开会在宽屏上读成重复的云朵。
    const W = 32, H = 280, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    const veil = c.createLinearGradient(0, 0, 0, H);
    veil.addColorStop(0, 'rgba(248,244,236,0)');
    veil.addColorStop(0.28, 'rgba(248,244,236,0.03)');
    veil.addColorStop(0.55, 'rgba(248,244,236,0.09)');
    veil.addColorStop(0.78, 'rgba(248,244,236,0.05)');
    veil.addColorStop(1, 'rgba(248,244,236,0)');
    c.fillStyle = veil; c.fillRect(0, 0, W, H);
    return toURL(cv);
  }

  /* ---------- 墨团（按钮底）。soft：只给终卷、拍卖做淡晕，没有溅点和飞白 ---------- */
  function softBlot(size, seed, opt) {
    const cv = document.createElement('canvas'); cv.width = cv.height = size;
    const c = cv.getContext('2d'); const R = mulberry(seed);
    const col = opt.rgb || [32, 26, 22];
    const cx = size * 0.5, cy = size * 0.5;
    for (let i = 0; i < 11; i++) {
      const a = R() * 6.283, d = size * R() * 0.1;
      const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.82;
      const r = size * (0.26 + R() * 0.22);
      const g = c.createRadialGradient(x, y, r * 0.04, x, y, r);
      const deep = i < 3 ? 0.48 : i < 7 ? 0.24 : 0.1;
      g.addColorStop(0, 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + deep + ')');
      g.addColorStop(0.45, 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + (deep * 0.4) + ')');
      g.addColorStop(0.78, 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + (deep * 0.08) + ')');
      g.addColorStop(1, 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',0)');
      c.fillStyle = g; c.fillRect(0, 0, size, size);
    }
    return toURL(cv);
  }
  function inkBlot(size, seed, opt = {}) {
    if (opt.soft) return softBlot(size, seed, opt);
    const cv = document.createElement('canvas'); cv.width = cv.height = size;
    const c = cv.getContext('2d'); const R = mulberry(seed); const cx = size / 2, cy = size / 2;
    const col = opt.rgb || [24, 22, 20];
    const base = size * (opt.core || 0.3);
    // 主墨团：不规则外缘
    c.save(); c.shadowColor = `rgba(${col},${opt.alpha || 0.9})`; c.shadowBlur = size * 0.025;
    c.fillStyle = `rgba(${col},${opt.alpha || 0.9})`; c.beginPath();
    const N = 260; const ph = [R() * 6, R() * 6, R() * 6];
    for (let i = 0; i <= N; i++) {
      const a = i / N * Math.PI * 2;
      const rr = base * (1 + 0.12 * Math.sin(a * 3 + ph[0]) + 0.07 * Math.sin(a * 7 + ph[1]) + 0.04 * Math.sin(a * 13 + ph[2]) + 0.02 * Math.sin(a * 29 + ph[0] * 2) + (R() - 0.5) * (opt.rough || 0.05) * 0.5);
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr; i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.fill(); c.restore();
    // 内部浓淡
    for (let i = 0; i < 18; i++) {
      const a = R() * 7, d = R() * base * 0.7, r = base * (0.2 + R() * 0.5);
      const g = c.createRadialGradient(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 0, cx + Math.cos(a) * d, cy + Math.sin(a) * d, r);
      const light = R() < 0.5;
      g.addColorStop(0, light ? 'rgba(255,255,255,0.05)' : `rgba(0,0,0,0.12)`); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalCompositeOperation = 'source-atop'; c.fillStyle = g; c.fillRect(0, 0, size, size);
    }
    c.globalCompositeOperation = 'source-over';
    // 溅点
    const sp = opt.splatter || 0;
    for (let i = 0; i < sp; i++) {
      const a = R() * Math.PI * 2, d = base * (1.05 + Math.pow(R(), 2) * 0.75), r = size * (0.003 + Math.pow(R(), 3) * 0.022);
      c.fillStyle = `rgba(${col},${(opt.alpha || 0.9) * (0.6 + R() * 0.4)})`;
      c.beginPath(); c.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * (1 + R()), r, a, 0, 7); c.fill();
      if (R() < 0.3) { // 拖尾
        c.strokeStyle = c.fillStyle; c.lineWidth = r * 0.45; c.lineCap = 'round'; c.beginPath();
        c.moveTo(cx + Math.cos(a) * base * 0.95, cy + Math.sin(a) * base * 0.95); c.lineTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d); c.stroke();
      }
    }
    // 飞白与浓淡：大泼墨不能是一块平灰
    if (opt.feibai) {
      c.save();
      c.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 18; i++) {
        const a = R() * Math.PI * 2;
        const x = cx + (R() - 0.5) * base * 0.85, y = cy + (R() - 0.5) * base * 0.85;
        const len = base * (0.55 + R() * 0.9);
        c.strokeStyle = `rgba(0,0,0,${0.28 + R() * 0.55})`;
        c.lineWidth = 16 + R() * (i % 3 === 0 ? 52 : 28);
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(x, y);
        c.quadraticCurveTo(x + Math.cos(a + 0.7) * len * 0.55, y + Math.sin(a + 0.7) * len * 0.55, x + Math.cos(a) * len, y + Math.sin(a) * len);
        c.stroke();
      }
      for (let i = 0; i < 7; i++) {
        const a = R() * 7, d = R() * base * 0.35, r = base * (0.1 + R() * 0.2);
        c.beginPath(); c.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r, r * (0.28 + R() * 0.45), a, 0, 7); c.fill();
      }
      c.restore();
      c.save();
      c.globalCompositeOperation = 'source-atop';
      for (let i = 0; i < 10; i++) {
        const a = R() * 7, d = R() * base * 0.55, r = base * (0.12 + R() * 0.28);
        const g = c.createRadialGradient(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 0, cx + Math.cos(a) * d, cy + Math.sin(a) * d, r);
        g.addColorStop(0, R() < 0.5 ? 'rgba(0,0,0,0.28)' : 'rgba(255,248,236,0.16)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g; c.fillRect(0, 0, size, size);
      }
      c.restore();
    }
    // 外圈淡墨晕
    if (opt.halo) {
      const g = c.createRadialGradient(cx, cy, base * 0.9, cx, cy, base * 1.6);
      g.addColorStop(0, `rgba(${col},${opt.halo})`); g.addColorStop(1, `rgba(${col},0)`);
      c.globalCompositeOperation = 'destination-over'; c.fillStyle = g; c.fillRect(0, 0, size, size); c.globalCompositeOperation = 'source-over';
    }
    return toURL(cv);
  }

  /* ---------- 笔触（SVG path） ---------- */
  function brushPath(w, h, seed, taper = true) {
    const R = mulberry(seed), n = 40, top = [], bot = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = t * w;
      let th = h * (taper ? Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.02)), 0.45) : 1) * (0.82 + R() * 0.18);
      if (t > 0.86) th *= (1 - (t - 0.86) * 3.5) + R() * 0.25; // 飞白收锋
      const mid = h / 2 + Math.sin(t * 3 + seed) * h * 0.08;
      top.push([x, mid - th / 2 + (R() - 0.5) * h * 0.06]); bot.push([x, mid + th / 2 + (R() - 0.5) * h * 0.06]);
    }
    let d = `M${top[0][0].toFixed(1)},${top[0][1].toFixed(1)}`;
    for (const p of top) d += `L${p[0].toFixed(1)},${p[1].toFixed(1)}`;
    for (let i = bot.length - 1; i >= 0; i--) d += `L${bot[i][0].toFixed(1)},${bot[i][1].toFixed(1)}`;
    return d + 'Z';
  }
  function brushSVG(w, h, seed, fill = 'currentColor', extra = '') {
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true" ${extra}><path d="${brushPath(w, h, seed)}" fill="${fill}"/></svg>`;
  }

  function scene(W, H) {
    const cv = document.createElement('canvas');
    mountainLayer(cv, { W, H, seed: 91, rgb: [60, 66, 70], alpha: 0.9, base: 1.02, amp: 0.8, peaks: 4, width: 0.08, sharp: 2.2, fade: 0.8, wash: 0.35, cun: 0.15, cunLen: 0.7, folds: 2, line: 0.8, dots: 0.05, hero: 1, trees: 2, treeSize: 0.6, bottomFade: false });
    return toURL(cv);
  }
  return { scene, paperTile, paperField, mountainLayer, mistSprite, inkBlot, brushPath, brushSVG, mulberry, DPR, layerScale };
})();
