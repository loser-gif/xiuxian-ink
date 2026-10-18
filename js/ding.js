/* 墨仙录 · 丹炉：以笔墨逐层画出的三足圆鼎 —— 淡墨铺底、积墨为骨、飞白收锋 */
'use strict';
const Ding = (() => {
  const INK = '27,24,20';
  let cache = null, urlP = null;
  function vnoise(seed) {
    const R = Ink.mulberry(seed), T = Array.from({ length: 512 }, R);
    return x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return T[i & 511] * (1 - u) + T[(i + 1) & 511] * u; };
  }
  function spline(P, n) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n * (P.length - 1), k = Math.min(P.length - 2, Math.floor(t)), u = t - k;
      const p0 = P[Math.max(0, k - 1)], p1 = P[k], p2 = P[k + 1], p3 = P[Math.min(P.length - 1, k + 2)];
      const f = (a, b, c, d) => .5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
    return out;
  }
  // 低频噪声纹理：墨韵（浓淡斑驳）
  function noiseTex(size, seed, cells) {
    const cv = document.createElement('canvas'); cv.width = cv.height = size; const c = cv.getContext('2d');
    const R = Ink.mulberry(seed), G = Array.from({ length: (cells + 1) * (cells + 1) }, R);
    const g = (x, y) => G[(y % (cells + 1)) * (cells + 1) + (x % (cells + 1))];
    const img = c.createImageData(size, size), d = img.data;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      let v = 0, amp = .55, f = cells / size;
      for (let o = 0; o < 3; o++) {
        const fx = x * f, fy = y * f, ix = Math.floor(fx), iy = Math.floor(fy), ux = fx - ix, uy = fy - iy, sx = ux * ux * (3 - 2 * ux), sy = uy * uy * (3 - 2 * uy);
        const a = g(ix, iy), b = g(ix + 1, iy), cc = g(ix, iy + 1), dd = g(ix + 1, iy + 1);
        v += amp * (a + (b - a) * sx + (cc - a) * sy + (a - b - cc + dd) * sx * sy); amp *= .5; f *= 2.1;
      }
      const i = (y * size + x) * 4; d[i] = d[i + 1] = d[i + 2] = 0; d[i + 3] = Math.max(0, Math.min(255, (v * 1.25 - .05) * 255));
    }
    c.putImageData(img, 0, 0); return cv;
  }
  function paint(size = 640) {
    const cv = document.createElement('canvas'); cv.width = cv.height = size;
    const main = cv.getContext('2d'), s = size / 100, R = Ink.mulberry(1717), nz = vnoise(29);
    const layer = document.createElement('canvas'); layer.width = layer.height = size; const L = layer.getContext('2d');
    const small = document.createElement('canvas'); small.width = small.height = size / 4; const SM = small.getContext('2d');
    const mottle = noiseTex(size / 2, 7, 5), grainT = noiseTex(size / 2, 19, 26);
    const clearL = () => { L.setTransform(1, 0, 0, 1, 0, 0); L.globalCompositeOperation = 'source-over'; L.globalAlpha = 1; L.clearRect(0, 0, size, size); L.setTransform(s, 0, 0, s, 0, 0); };
    const flush = (alpha = 1) => { main.save(); main.setTransform(1, 0, 0, 1, 0, 0); main.globalAlpha = alpha; main.drawImage(layer, 0, 0); main.restore(); };
    // 柔化：缩小再放大，墨边自然洇开
    const keep = document.createElement('canvas'); keep.width = keep.height = size; const KP = keep.getContext('2d');
    const soften = (k = 1) => {
      SM.clearRect(0, 0, size / 4, size / 4); SM.drawImage(layer, 0, 0, size / 4, size / 4);
      KP.clearRect(0, 0, size, size); if (k < 1) KP.drawImage(layer, 0, 0);
      L.setTransform(1, 0, 0, 1, 0, 0); L.clearRect(0, 0, size, size);
      L.globalAlpha = k; L.drawImage(small, 0, 0, size, size); if (k < 1) { L.globalAlpha = 1 - k; L.drawImage(keep, 0, 0); }
      L.globalAlpha = 1; L.setTransform(s, 0, 0, s, 0, 0);
    };
    // 斑驳：以噪声纹理遮罩，保留 lo..1 的浓度
    const mottleL = (tex, lo) => {
      L.setTransform(1, 0, 0, 1, 0, 0); L.globalCompositeOperation = 'destination-out'; L.globalAlpha = 1 - lo;
      L.drawImage(tex, 0, 0, size, size); L.globalAlpha = 1; L.globalCompositeOperation = 'source-over'; L.setTransform(s, 0, 0, s, 0, 0);
    };
    /* 一笔：实心笔身 + 笔毛细纹 + 飞白（顺笔势擦出）+ 墨边 */
    function stroke(P, o) {
      clearL();
      const pts = spline(P, o.n || 90), n = pts.length, W = t => o.w * (o.shape ? o.shape(t) : 1) / 2;
      const nrm = pts.map((p, i) => { const q = pts[Math.min(n - 1, i + 1)], r = pts[Math.max(0, i - 1)]; let dx = q[0] - r[0], dy = q[1] - r[1]; const d = Math.hypot(dx, dy) || 1; return [-dy / d, dx / d]; });
      const side = sg => pts.map((p, i) => { const t = i / (n - 1), w = W(t) * (1 + (nz(i * .21 + sg * 40 + o.w * 9) - .5) * (o.rough ?? .22)); return [p[0] + nrm[i][0] * w * sg, p[1] + nrm[i][1] * w * sg]; });
      const A = side(1), Bs = side(-1);
      L.beginPath(); L.moveTo(A[0][0], A[0][1]); A.forEach(p => L.lineTo(p[0], p[1])); for (let i = n - 1; i >= 0; i--) L.lineTo(Bs[i][0], Bs[i][1]); L.closePath();
      L.fillStyle = `rgba(${o.rgb || INK},${o.a})`; L.fill();
      // 墨聚于边
      L.strokeStyle = `rgba(${o.rgb || INK},${Math.min(1, o.a * .5)})`; L.lineWidth = Math.max(.18, o.w * .05); L.stroke();
      // 笔毛细纹：浓淡交错的细丝
      const N = Math.max(6, Math.round(o.w * 5));
      for (let h = 0; h < N; h++) {
        const off = (h + .5) / N * 2 - 1, dark = R() < .5;
        L.strokeStyle = dark ? `rgba(${INK},${o.a * .25})` : `rgba(0,0,0,0)`; if (!dark) continue;
        L.lineWidth = o.w / N * .7; L.beginPath();
        pts.forEach((p, i) => { const w = W(i / (n - 1)) * off * .92; const x = p[0] + nrm[i][0] * w, y = p[1] + nrm[i][1] * w; i ? L.lineTo(x, y) : L.moveTo(x, y); }); L.stroke();
      }
      // 飞白：沿笔势的断续丝路擦去墨色，边缘与笔尾更多
      if (o.dry) {
        L.globalCompositeOperation = 'destination-out'; L.lineCap = 'butt';
        const M = Math.max(5, Math.round(o.w * 6));
        for (let h = 0; h < M; h++) {
          const off = (R() * 2 - 1), edge = Math.abs(off), seed = R() * 300, f = (o.freq || 6) * .45;
          L.lineWidth = o.w / M * (.6 + R() * 1.1); L.strokeStyle = `rgba(0,0,0,${.55 + R() * .45})`;
          let on = false; L.beginPath();
          pts.forEach((p, i) => {
            const t = i / (n - 1), dryness = o.dry * (Math.pow(t, o.tail || 1.6) * 1.15 + edge * .55 - .15);
            const cut = nz(seed + t * f * (2 + edge * 2)) < dryness;
            const w = W(t) * off; const x = p[0] + nrm[i][0] * w, y = p[1] + nrm[i][1] * w;
            if (cut) { on ? L.lineTo(x, y) : L.moveTo(x, y); on = true; } else if (on) { L.stroke(); L.beginPath(); on = false; }
          });
          if (on) L.stroke();
        }
        L.globalCompositeOperation = 'source-over';
      }
      if (o.soft) soften(o.soft);
      flush();
    }
    // 淡墨铺染：形内填色 → 斑驳 → 柔化
    function wash(shape, fill, o = {}) {
      clearL(); shape(L); L.fillStyle = fill; L.fill();
      if (o.mottle !== false) mottleL(mottle, o.lo ?? .45);
      if (o.grain) mottleL(grainT, o.grain);
      soften(o.soft ?? .75);
      flush(o.alpha ?? 1);
    }
    main.setTransform(s, 0, 0, s, 0, 0);
    const lin = (x0, y0, x1, y1, stops) => { const g = L.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, a]) => g.addColorStop(o, `rgba(${INK},${a})`)); return g; };

    // ---- 地上淡影
    wash(c => { c.beginPath(); c.ellipse(50, 92, 33, 3.6, 0, 0, 7); }, lin(17, 0, 83, 0, [[0, 0], [.3, .2], [.7, .14], [1, 0]]), { soft: 1, lo: .3 });
    // ---- 后两足：淡、略外撇，兽蹄足（膝鼓、胫收、蹄外翻）
    const legP = (x0, y0, dir, len) => [[x0, y0], [x0 + dir * 1.8, y0 + len * .28], [x0 + dir * .6, y0 + len * .62], [x0 + dir * 2.4, y0 + len * .94], [x0 + dir * 3.4, y0 + len]];
    const legShape = t => t < .16 ? 1.3 - t * 1.4 : t > .88 ? .72 + (t - .88) * 1.6 : .98 - t * .3;
    stroke(legP(33.5, 63, -1, 25), { w: 5.2, a: .5, dry: .32, freq: 4, shape: legShape, soft: .25 });
    stroke(legP(66.5, 63, 1, 25), { w: 5.2, a: .46, dry: .38, freq: 4, shape: legShape, soft: .25 });
    // ---- 鼎腹
    const belly = c => { c.beginPath(); c.moveTo(19.6, 36); c.bezierCurveTo(14.5, 46, 16.5, 60.5, 30, 67.4); c.bezierCurveTo(40, 72.6, 60, 72.6, 70, 67.4); c.bezierCurveTo(83.5, 60.5, 85.5, 46, 80.4, 36); c.closePath(); };
    // 纸底：鼎腹不透，挡住后足与炉火
    main.save(); belly(main); main.fillStyle = 'rgb(240,232,214)'; main.fill(); main.restore();
    // 底色：左浓右淡（光自右上来）
    wash(belly, lin(15, 0, 85, 0, [[0, .82], [.15, .6], [.33, .28], [.55, .08], [.76, .03], [.92, .14], [1, .4]]), { lo: .45, soft: .5, mottle: true });
    // 下浓：腹底积墨
    wash(belly, lin(0, 40, 0, 72, [[0, 0], [.5, .06], [.8, .3], [1, .62]]), { lo: .4, soft: .55, mottle: true });
    // 左侧一笔湿墨顺腹而下：明暗交界
    stroke([[24, 40], [21.5, 49], [24, 59], [31, 66]], { w: 7, a: .3, dry: .5, freq: 3, soft: .9 });
    // 两三团浓墨：铜色沉处
    wash(c => { c.beginPath(); c.ellipse(27, 55, 9, 10, -.3, 0, 7); }, `rgba(${INK},.24)`, { lo: .2, soft: 1 }); soften(1);
    wash(c => { c.beginPath(); c.ellipse(46, 66, 14, 4.5, 0, 0, 7); }, `rgba(${INK},.22)`, { lo: .2, soft: 1 });
    // 高光：右上以纸色擦出一道
    main.save(); main.globalCompositeOperation = 'destination-out';
    clearL(); L.beginPath(); L.ellipse(67, 49, 4.5, 10, -.4, 0, 7); L.fillStyle = 'rgba(0,0,0,.4)'; L.fill(); soften(1); soften(1);
    main.drawImage(layer, 0, 0, size, size, 0, 0, 100, 100); main.restore();
    // 细颗粒：铜锈的沙眼
    main.save(); belly(main); main.clip();
    for (let i = 0; i < 220; i++) { const x = 16 + R() * 68, y = 38 + R() * 34; main.fillStyle = `rgba(${INK},${.04 + R() * .14})`; main.beginPath(); main.arc(x, y, .12 + R() * .32, 0, 7); main.fill(); }
    main.restore();
    // ---- 纹带：口沿下两道细弦，弦间一列短促的点笔（雷纹之意）
    const arc = (y0, sag, x0 = 20.6, x1 = 79.4) => { const P = []; for (let i = 0; i <= 8; i++) { const t = i / 8; P.push([x0 + t * (x1 - x0), y0 + Math.sin(t * Math.PI) * sag]); } return P; };
    stroke(arc(39.6, 2.6), { w: .9, a: .55, dry: .5, freq: 9 });
    stroke(arc(44.6, 2.8, 19.4, 80.6), { w: .75, a: .45, dry: .6, freq: 9 });
    for (let i = 0; i < 13; i++) {
      const t = (i + .5) / 13, x = 21 + t * 58, y = 42.1 + Math.sin(t * Math.PI) * 2.7;
      stroke([[x - .9, y - .5], [x + .1, y + .35], [x + 1, y - .3]], { w: .7, a: .3, dry: .3, freq: 4, n: 12, rough: .4 });
    }
    // ---- 鼎腹轮廓：左一笔浓重而下，右一笔轻提，底一笔沉稳
    stroke([[20.4, 36.2], [16.6, 42.5], [15.9, 48.6]], { w: 2.9, a: .92, dry: .35, freq: 5, tail: 2.4, shape: t => .55 + t * .6 });
    stroke([[16.3, 51.2], [17.6, 57], [23.6, 63.8], [31.5, 67.8]], { w: 3.2, a: .9, dry: .55, freq: 5, tail: 1.6, shape: t => 1.05 - t * .55 });
    stroke([[79.6, 36.2], [83.6, 43], [84.1, 49]], { w: 1.7, a: .78, dry: .7, freq: 5, shape: t => .5 + Math.sin(t * Math.PI) * .6 });
    stroke([[83.4, 52.6], [81.6, 58.4], [76.2, 64], [68.4, 68]], { w: 1.9, a: .74, dry: .75, freq: 5, shape: t => .45 + Math.sin(t * Math.PI) * .65 });
    stroke([[30, 67.2], [40.5, 71.6], [52, 72.4], [62.5, 70.8], [70.5, 66.8]], { w: 2.4, a: .85, dry: .55, freq: 5, shape: t => .35 + Math.sin(t * Math.PI) * .8 });
    // ---- 鼎口：内里浓墨（近沿处最深），沿口一圈
    wash(c => { c.beginPath(); c.ellipse(50, 35.4, 29.6, 4.5, 0, 0, 7); }, lin(20, 0, 80, 0, [[0, .88], [.35, .62], [.65, .5], [1, .8]]), { lo: .55, soft: .35, mottle: true });
    const lip = (from, to) => { const P = []; for (let i = 0; i <= 14; i++) { const a = from + (to - from) * i / 14; P.push([50 + Math.cos(a) * 31.2, 35.4 + Math.sin(a) * 4.8]); } return P; };
    stroke(lip(Math.PI * 1.03, Math.PI * 1.97), { w: 1.3, a: .6, dry: .6, freq: 7 });
    stroke(lip(Math.PI * .985, Math.PI * .015), { w: 3.3, a: .95, dry: .42, freq: 7, tail: 2, shape: t => .7 + Math.sin(t * Math.PI) * .4 });
    // ---- 立耳：一笔方折而起，略向外倾；内缘一道淡墨
    const ear = (x, dir) => {
      stroke([[x - 4 * dir, 35.4], [x - 4.6 * dir, 27], [x - 4.4 * dir, 20.2], [x - 1.4 * dir, 17.2], [x + 2.4 * dir, 17.8], [x + 4 * dir, 21], [x + 3.9 * dir, 28], [x + 3.3 * dir, 34.4]],
        { w: 2.8, a: .9, dry: .55, freq: 6, tail: 1.4, shape: t => (t < .5 ? .85 + t * .5 : 1.1 - (t - .5) * .7) });
      stroke([[x - 1.5 * dir, 33.6], [x - 1.8 * dir, 25], [x - .4 * dir, 21.6], [x + 1.4 * dir, 22.4], [x + 1.3 * dir, 30]], { w: .8, a: .38, dry: .6, freq: 6 });
    };
    ear(30.5, 1); ear(69.5, -1);
    // ---- 前足：最近最浓，足根兽首隆起
    stroke(legP(50, 68.6, .25, 22), { w: 6.2, a: .88, dry: .3, freq: 4, tail: 2.4, shape: legShape });
    wash(c => { c.beginPath(); c.ellipse(50.2, 70, 4.6, 2.9, 0, 0, 7); }, `rgba(${INK},.8)`, { lo: .6, soft: .8 });
    for (const [x, y] of [[33.2, 63.6], [66.8, 63.6]]) wash(c => { c.beginPath(); c.ellipse(x, y, 3.4, 2.2, 0, 0, 7); }, `rgba(${INK},.5)`, { lo: .5, soft: .85 });
    return cv;
  }
  function art() { return cache || (cache = paint(640)); }
  function url() {
    return urlP || (urlP = new Promise(res => { const cv = art(); cv.toBlob ? cv.toBlob(b => res(b ? URL.createObjectURL(b) : cv.toDataURL())) : res(cv.toDataURL()); }));
  }
  return { art, url, paint };
})();
