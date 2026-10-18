/* 墨仙录 · 江湖长卷：程序化水墨手卷（一次绘成，转为图片后即释放画布） */
'use strict';
const InkMap = (() => {
  const MW = 2600, MH = 560;           // 逻辑尺寸（CSS 像素）
  const GY = { town: .74, peach: .76, sect: .70, market: .73, capital: .72, ridge: .69, cliff: .71, redvalley: .75, desert: .73, sea: .77, heaven: .64 };
  const LY = { town: .30, peach: .30, sect: .10, market: .26, capital: .18, ridge: .16, cliff: .20, redvalley: .24, desert: .30, sea: .26, heaven: .06 };
  const INK = [38, 34, 30], BLUE = [62, 70, 76];
  let cache = null;                    // { url, farUrl } 本次会话内复用
  const pts = () => LOCS.map(l => ({ id: l.id, x: l.x, y: GY[l.paint], ly: LY[l.paint] }));

  // 道路：过各地的平滑曲线（Catmull-Rom → 三次贝塞尔），坐标为逻辑像素
  function roadPath(a = 0, b = LOCS.length - 1) {
    const P = pts().map(p => [p.x * MW, p.y * MH]);
    const lo = Math.min(a, b), hi = Math.max(a, b), q = P.slice(lo, hi + 1);
    if (q.length < 2) return '';
    let d = `M${q[0][0].toFixed(1)},${q[0][1].toFixed(1)}`;
    for (let i = 0; i < q.length - 1; i++) {
      const p0 = P[lo + i - 1] || q[i], p1 = q[i], p2 = q[i + 1], p3 = P[lo + i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d;
  }

  /* ---------- 笔墨小件 ---------- */
  const rgba = (c, a) => `rgba(${c.join(',')},${a.toFixed(3)})`;
  function stroke(c, R, x0, y0, x1, y1, w, col, a, bend = 0) {
    c.strokeStyle = rgba(col, a); c.lineWidth = w; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + bend, (y0 + y1) / 2 - Math.abs(bend) * .3, x1, y1); c.stroke();
  }
  function wash(c, x, y, rx, ry, col, a) {
    c.save(); c.translate(x, y); c.scale(1, ry / rx);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.fillRect(-rx, -rx, rx * 2, rx * 2); c.restore();
  }
  function roof(c, R, x, y, w, s, a = .85) {        // 屋：飞檐一笔 + 淡墙 + 门洞
    const h = w * .42;
    c.fillStyle = rgba([239, 230, 211], .9); c.fillRect(x - w * .38, y - h, w * .76, h);
    c.strokeStyle = rgba(INK, a * .55); c.lineWidth = .9 * s; c.strokeRect(x - w * .38, y - h, w * .76, h);
    c.fillStyle = rgba(INK, a * .5); c.fillRect(x - w * .07, y - h * .62, w * .14, h * .62);
    c.fillStyle = rgba(INK, a); c.beginPath();
    c.moveTo(x - w * .62, y - h * .9); c.quadraticCurveTo(x - w * .3, y - h * 1.05, x - w * .18, y - h * 1.55);
    c.lineTo(x + w * .18, y - h * 1.55); c.quadraticCurveTo(x + w * .3, y - h * 1.05, x + w * .62, y - h * .9);
    c.quadraticCurveTo(x, y - h * 1.12, x - w * .62, y - h * .9); c.fill();
  }
  function pagoda(c, R, x, y, w, tiers, s) {
    for (let t = 0; t < tiers; t++) { const ww = w * (1 - t * .16), yy = y - t * w * .5; roof(c, R, x, yy, ww, s, .9 - t * .06); }
    stroke(c, R, x, y - tiers * w * .5 - w * .1, x, y - tiers * w * .5 - w * .55, 1.2 * s, INK, .8);
  }
  function pine(c, R, x, y, h, s, a = .8) {
    stroke(c, R, x, y, x + (R() - .5) * h * .12, y - h, 1.6 * s, INK, a, (R() - .5) * 6 * s);
    for (let k = 0; k < 7; k++) {
      const yy = y - h * (.35 + k * .095), ww = h * (.36 - k * .04) * (.8 + R() * .4);
      c.fillStyle = rgba(INK, a * (.45 + R() * .35));
      c.beginPath(); c.ellipse(x + (R() - .5) * 4 * s, yy, ww, h * .045, (R() - .5) * .25, 0, 7); c.fill();
    }
  }
  function willow(c, R, x, y, h, s) {
    stroke(c, R, x, y, x + 2 * s, y - h, 1.8 * s, INK, .7, 4 * s);
    for (let k = 0; k < 16; k++) { const ox = x + (R() - .5) * h * .5, oy = y - h * (.8 + R() * .25); stroke(c, R, ox, oy, ox + (R() - .5) * 8 * s, oy + h * (.35 + R() * .3), .7 * s, BLUE, .35 + R() * .2, (R() - .5) * 10 * s); }
  }
  function blossomTree(c, R, x, y, h, s) {
    stroke(c, R, x, y, x + (R() - .5) * 8 * s, y - h, 2 * s, INK, .75, (R() - .5) * 10 * s);
    for (let b = 0; b < 3; b++) stroke(c, R, x, y - h * (.5 + b * .15), x + (R() - .5) * h * .9, y - h * (.8 + R() * .3), 1 * s, INK, .6, (R() - .5) * 8 * s);
    for (let k = 0; k < 46; k++) {
      const a = R() * 7, r = Math.sqrt(R()) * h * .5;
      c.fillStyle = `rgba(${190 + R() * 20 | 0},${96 + R() * 30 | 0},${96 + R() * 24 | 0},${(.22 + R() * .35).toFixed(2)})`;
      c.beginPath(); c.ellipse(x + Math.cos(a) * r * 1.2, y - h * .92 + Math.sin(a) * r * .7, (1.4 + R() * 2) * s, (1 + R() * 1.4) * s, R() * 3, 0, 7); c.fill();
    }
  }
  function ripples(c, R, x0, x1, y, n, s, a = .22) {
    for (let k = 0; k < n; k++) { const x = x0 + R() * (x1 - x0), yy = y + (R() - .5) * 26 * s, len = (14 + R() * 46) * s; stroke(c, R, x, yy, x + len, yy + (R() - .5) * 2 * s, (.5 + R() * .7) * s, BLUE, a * (.5 + R() * .7), (R() - .5) * 3 * s); }
  }
  function cloud(c, R, x, y, r, s, a = .5) {            // 卷云：螺旋 + 外缘
    c.strokeStyle = rgba(BLUE, a); c.lineWidth = 1.1 * s; c.lineCap = 'round';
    for (let k = 0; k < 3; k++) {
      const cx = x + (k - 1) * r * 1.1, cy = y + (k === 1 ? -r * .45 : 0), rr = r * (k === 1 ? 1 : .75);
      c.beginPath(); for (let t = 0; t < 5.2; t += .12) { const q = rr * (1 - t / 6.5); const px = cx + Math.cos(t + k) * q, py = cy + Math.sin(t + k) * q * .62; t ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke();
    }
    c.fillStyle = rgba([250, 247, 238], .55); c.beginPath(); c.ellipse(x, y + r * .3, r * 2.3, r * .45, 0, 0, 7); c.fill();
  }

  /* ---------- 各地风物 ---------- */
  function region(c, l, S) {
    const R = Ink.mulberry(1000 + Math.round(l.x * 977)), s = S, X = l.x * MW * s, gy = GY[l.paint] * MH * s, U = MW * s;
    const seg = (o) => {           // 区段山体：临时画布绘一段，两端羽化后合成
      const sw = Math.round(U * (o.span || .17)), sh = Math.round(MH * s);
      const cv = document.createElement('canvas');
      Ink.mountainLayer(cv, { W: sw, H: sh, seed: o.seed, rgb: o.rgb || INK, alpha: o.alpha, base: o.base, amp: o.amp, peaks: o.peaks, width: o.width, sharp: o.sharp, fade: .9, wash: o.wash || .3, cun: o.cun || .12, cunLen: s * (o.cunLen || 1), folds: o.folds ?? 2, line: (o.line || .9) * s, dots: o.dots || .04, hero: o.hero ?? 0, trees: o.trees || 0, treeSize: (o.treeSize || .7) * s, bottomFade: true });
      const m = cv.getContext('2d'); m.globalCompositeOperation = 'destination-in';
      const g = m.createLinearGradient(0, 0, sw, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.22, 'rgba(0,0,0,1)'); g.addColorStop(.78, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      m.fillStyle = g; m.fillRect(0, 0, sw, sh);
      c.drawImage(cv, X - sw / 2 + (o.dx || 0) * U, (o.dy || 0) * MH * s);
      cv.width = cv.height = 0;
    };
    switch (l.paint) {
      case 'town':
        seg({ seed: 11, alpha: .5, base: .72, amp: .2, peaks: 3, width: .14, sharp: 1.6, trees: 3 });
        for (let k = 0; k < 6; k++) roof(c, R, X + (k - 2.5) * 30 * s + (R() - .5) * 8 * s, gy - (k % 2) * 6 * s, (22 + R() * 8) * s, s);
        willow(c, R, X - 98 * s, gy + 4 * s, 58 * s, s); willow(c, R, X + 92 * s, gy + 6 * s, 50 * s, s);
        break;
      case 'peach':
        seg({ seed: 23, alpha: .42, base: .74, amp: .26, peaks: 3, width: .13, sharp: 1.5, trees: 2 });
        for (let k = 0; k < 5; k++) blossomTree(c, R, X + (k - 2) * 40 * s + (R() - .5) * 10 * s, gy - 2 * s + (R() - .5) * 8 * s, (40 + R() * 16) * s, s);
        ripples(c, R, X - 120 * s, X + 120 * s, gy + 34 * s, 22, s, .3);
        break;
      case 'sect':
        seg({ seed: 37, alpha: .82, base: .78, amp: .6, peaks: 2, width: .11, sharp: 2.3, hero: 0, wash: .4, cun: .2, dots: .07, trees: 3 });
        pagoda(c, R, X - 6 * s, MH * s * .3, 30 * s, 3, s); roof(c, R, X + 46 * s, MH * s * .43, 24 * s, s); roof(c, R, X - 52 * s, MH * s * .48, 22 * s, s);
        for (let k = 0; k < 14; k++) { const t = k / 13, x = X - 20 * s + Math.sin(t * 9) * 26 * s, y = gy - t * MH * s * .3; stroke(c, R, x - 5 * s, y, x + 5 * s, y, 1.1 * s, INK, .55); }
        pine(c, R, X + 70 * s, gy, 62 * s, s); pine(c, R, X - 84 * s, gy + 4 * s, 54 * s, s);
        break;
      case 'market':
        seg({ seed: 41, alpha: .38, base: .7, amp: .22, peaks: 3, width: .14, sharp: 1.7 });
        pagoda(c, R, X + 10 * s, gy - 6 * s, 34 * s, 4, s);
        for (let k = 0; k < 8; k++) { const x = X + (k - 3.5) * 27 * s; if (Math.abs(x - X - 10 * s) < 22 * s) continue; roof(c, R, x, gy + (k % 2) * 5 * s, (20 + R() * 6) * s, s); }
        for (const dx of [-86, -40, 64, 104]) { const x = X + dx * s; stroke(c, R, x, gy, x, gy - 58 * s, 1.1 * s, INK, .7); c.fillStyle = dx > 0 ? 'rgba(179,48,42,.62)' : rgba(INK, .55); c.beginPath(); c.moveTo(x, gy - 56 * s); c.quadraticCurveTo(x + 9 * s, gy - 50 * s, x + 2 * s, gy - 30 * s); c.lineTo(x, gy - 32 * s); c.fill(); }
        break;
      case 'ridge':
        seg({ seed: 53, alpha: .9, base: .76, amp: .4, peaks: 4, width: .1, sharp: 2.6, wash: .45, cun: .28, dots: .09, trees: 6, treeSize: .8 });
        for (let k = 0; k < 9; k++) pine(c, R, X + (k - 4) * 26 * s + (R() - .5) * 10 * s, gy + (R() - .3) * 10 * s, (34 + R() * 26) * s, s, .85);
        wash(c, X, gy - 60 * s, 200 * s, 50 * s, INK, .08);
        break;
      case 'cliff':
        seg({ seed: 67, alpha: .78, base: .8, amp: .54, peaks: 2, width: .1, sharp: 2.8, hero: 1, wash: .5, cun: .3, cunLen: 1.6, dots: .05 });
        for (let k = 0; k < 26; k++) { const x = X - 40 * s + R() * 80 * s, y = MH * s * (.32 + R() * .3); stroke(c, R, x, y, x + (R() - .5) * 6 * s, y + (20 + R() * 40) * s, (.6 + R()) * s, INK, .25 + R() * .25); }
        c.fillStyle = rgba(INK, .85); c.beginPath(); c.moveTo(X - 15 * s, gy - 4 * s); c.quadraticCurveTo(X - 14 * s, gy - 36 * s, X, gy - 38 * s); c.quadraticCurveTo(X + 14 * s, gy - 36 * s, X + 15 * s, gy - 4 * s); c.fill();
        wash(c, X, gy - 20 * s, 34 * s, 26 * s, [120, 140, 110], .18);
        break;
      case 'redvalley':
        seg({ seed: 79, alpha: .8, base: .8, amp: .46, peaks: 2, width: .09, sharp: 2.4, dx: -.035, span: .12 });
        seg({ seed: 83, alpha: .8, base: .8, amp: .42, peaks: 2, width: .09, sharp: 2.4, dx: .035, span: .12 });
        for (let k = 0; k < 4; k++) wash(c, X + (R() - .5) * 120 * s, gy - (20 + R() * 70) * s, (90 + R() * 70) * s, (26 + R() * 20) * s, [150, 42, 34], .1 + R() * .06);
        for (let k = 0; k < 5; k++) { const x = X + (k - 2) * 22 * s; stroke(c, R, x, gy + 6 * s, x + (R() - .5) * 10 * s, gy - (12 + R() * 22) * s, 1.4 * s, INK, .6, (R() - .5) * 12 * s); }
        break;
      case 'desert':
        for (let k = 0; k < 6; k++) { const y = gy - 30 * s + k * 12 * s, x0 = X - 160 * s + R() * 40 * s; c.strokeStyle = rgba([110, 92, 70], .25 + R() * .2); c.lineWidth = (1 + R() * 1.5) * s; c.beginPath(); c.moveTo(x0, y); for (let t = 0; t <= 1; t += .05) c.lineTo(x0 + t * 320 * s, y - Math.sin(t * Math.PI * (1.4 + k * .2) + k) * 14 * s); c.stroke(); }
        wash(c, X, gy - 6 * s, 190 * s, 30 * s, [150, 128, 96], .14);
        for (let k = 0; k < 6; k++) { const x = X + (k - 2.5) * 34 * s + (R() - .5) * 14 * s, y = gy + (R() - .5) * 12 * s, lean = (R() - .5) * 26 * s; stroke(c, R, x, y, x + lean, y - (26 + R() * 30) * s, 1.3 * s, INK, .75); if (R() < .6) { c.fillStyle = rgba(INK, .7); c.fillRect(x + lean - 3 * s, y - (26 + 30) * s * .9, 6 * s, 2 * s); } }
        c.fillStyle = 'rgba(179,48,42,.35)'; c.beginPath(); c.arc(X + 100 * s, MH * s * .3, 16 * s, 0, 7); c.fill();
        break;
      case 'sea':
        seg({ seed: 97, rgb: BLUE, alpha: .4, base: .6, amp: .18, peaks: 3, width: .08, sharp: 2, dy: -.02 });
        ripples(c, R, X - 170 * s, X + 170 * s, gy - 4 * s, 60, s, .32); ripples(c, R, X - 170 * s, X + 170 * s, gy + 34 * s, 50, s, .26);
        for (let k = 0; k < 5; k++) { const x = X + (k - 2) * 60 * s + (R() - .5) * 20 * s, y = gy + (R() - .3) * 30 * s, w = (14 + R() * 18) * s; c.fillStyle = 'rgba(250,247,238,.85)'; c.strokeStyle = rgba(BLUE, .55); c.lineWidth = .9 * s; c.beginPath(); c.moveTo(x - w, y); c.lineTo(x - w * .4, y - w * .3); c.lineTo(x + w * .6, y - w * .25); c.lineTo(x + w, y + 1 * s); c.closePath(); c.fill(); c.stroke(); }
        c.fillStyle = 'rgba(214,170,90,.7)'; c.beginPath(); c.arc(X - 36 * s, gy - 30 * s, 3 * s, 0, 7); c.fill(); wash(c, X - 36 * s, gy - 30 * s, 22 * s, 22 * s, [214, 170, 90], .25);
        break;
      case 'capital':
        seg({ seed: 47, alpha: .48, base: .72, amp: .2, peaks: 3, width: .15, sharp: 1.5 });
        // 宫墙
        c.strokeStyle = rgba(INK, .55); c.lineWidth = 1.4 * s;
        c.strokeRect(X - 110 * s, gy - 52 * s, 220 * s, 52 * s);
        // 正殿三重檐
        pagoda(c, R, X, gy - 8 * s, 36 * s, 3, s);
        for (let k = 0; k < 6; k++) roof(c, R, X + (k - 2.5) * 32 * s, gy - (k % 2) * 4 * s, (18 + R() * 6) * s, s, .75);
        // 阙门双柱
        for (const dx of [-70, 70]) {
          stroke(c, R, X + dx * s, gy, X + dx * s, gy - 48 * s, 2 * s, INK, .75);
          c.fillStyle = 'rgba(179,48,42,.7)'; c.beginPath();
          c.moveTo(X + dx * s - 8 * s, gy - 48 * s); c.lineTo(X + dx * s + 8 * s, gy - 48 * s);
          c.lineTo(X + dx * s, gy - 62 * s); c.fill();
        }
        wash(c, X, gy - 70 * s, 160 * s, 40 * s, [214, 170, 90], .1);
        break;
      case 'heaven':
        for (let k = 0; k < 22; k++) { const t = k / 21, x = X - 120 * s + t * 150 * s, y = gy - t * MH * s * .5; stroke(c, R, x - 8 * s, y, x + 8 * s, y, 1.2 * s, INK, .62 - t * .4); }
        cloud(c, R, X - 70 * s, gy - 40 * s, 26 * s, s); cloud(c, R, X + 40 * s, MH * s * .36, 34 * s, s, .45); cloud(c, R, X + 120 * s, gy - 10 * s, 22 * s, s, .4);
        wash(c, X + 20 * s, MH * s * .2, 140 * s, 60 * s, [214, 170, 90], .12);
        pagoda(c, R, X + 30 * s, MH * s * .22, 22 * s, 2, s);
        break;
    }
  }

  // 主画面：远山之外的一切；远山另画一张，供视差
  async function paint() {
    if (cache) return cache;
    const S = Math.min(1.5, Ink.DPR, 4096 / MW), W = Math.round(MW * S), H = Math.round(MH * S);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    // 1) 中景连绵：极淡的一脉，连起各地
    // 中景只是一抹淡山：半分辨率绘制再放大，峰值内存少一张全尺寸画布
    const mid = document.createElement('canvas'), hs = .5;
    Ink.mountainLayer(mid, { W: Math.round(W * hs), H: Math.round(H * hs), seed: 5, rgb: BLUE, alpha: .32, base: .7, amp: .26, peaks: 22, width: .022, sharp: 2, fade: .85, wash: .25, cun: .05, cunLen: S * hs, folds: 1, line: .6 * S * hs, dots: .02, trees: 10, treeSize: .55 * S * hs });
    c.drawImage(mid, 0, 0, W, H); mid.width = mid.height = 0;
    // 2) 河：一带淡青，贯穿全卷
    const R = Ink.mulberry(77);
    const ry = x => (.86 + Math.sin(x / W * 9.4) * .025 + Math.sin(x / W * 23) * .01) * H;
    const g = c.createLinearGradient(0, H * .8, 0, H); g.addColorStop(0, 'rgba(62,70,76,0)'); g.addColorStop(.4, 'rgba(62,70,76,.1)'); g.addColorStop(1, 'rgba(62,70,76,.04)');
    c.fillStyle = g; c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 8) c.lineTo(x, ry(x) - 12 * S); c.lineTo(W, H); c.fill();
    for (let k = 0; k < 160; k++) { const x = R() * W, y = ry(x) + R() * 40 * S; stroke(c, R, x, y, x + (12 + R() * 50) * S, y, (.5 + R() * .6) * S, BLUE, .1 + R() * .14); }
    // 3) 各地风物
    for (const l of LOCS) region(c, l, S);
    // 4) 卷尾题款
    c.save(); c.font = `${14 * S}px MoShu,MoWen,serif`; c.fillStyle = rgba(INK, .55); c.textAlign = 'center';
    [...'江湖行旅图'].forEach((ch, i) => c.fillText(ch, W - 22 * S, H * .1 + i * 17 * S)); c.restore();
    c.fillStyle = 'rgba(179,48,42,.7)'; c.fillRect(W - 30 * S, H * .1 + 5 * 17 * S, 16 * S, 16 * S);
    const url = await toBlobURL(cv); cv.width = cv.height = 0;
    // 远山：低分辨率，CSS 放大即可（本就朦胧）
    const fs = .6, fcv = document.createElement('canvas');
    Ink.mountainLayer(fcv, { W: Math.round(MW * fs), H: Math.round(MH * fs), seed: 3, rgb: BLUE, alpha: .3, base: .56, amp: .34, peaks: 16, width: .03, sharp: 1.8, fade: .8, wash: .3, cun: .03, cunLen: fs, folds: 1, line: .5, dots: 0, trees: 0, bottomFade: true });
    const farUrl = await toBlobURL(fcv); fcv.width = fcv.height = 0;
    cache = { url, farUrl, W, H, S };
    return cache;
  }
  function toBlobURL(cv) { return new Promise(res => cv.toBlob ? cv.toBlob(b => res(b ? URL.createObjectURL(b) : cv.toDataURL()), 'image/png') : res(cv.toDataURL())); }
  return { MW, MH, paint, roadPath, pts, GY, LY, get cached() { return !!cache; } };
})();
