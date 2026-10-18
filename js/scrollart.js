/* 墨仙录 · 终卷立轴。字在上，远山只落在下方留白，不压题款。 */
'use strict';
const ScrollArt = (() => {
  const W = 900;
  const INK = '#1c1915';
  const INK2 = '#4a433a';
  const INK3 = '#6e6458';
  const ZHU = '#9a332c';
  const PAPER = '#efe6d3';
  const URL = 'https://loser-gif.github.io/xiuxian-ink/';
  const SEAL_CH = { ascend: '升', zuohua: '化', rumo: '魔', guiyin: '隐', bingjie: '解', yunluo: '殒', renhuang: '皇', quancheng: '摄' };

  function rng(seed) {
    let s = seed | 0 || 1;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  function num(n) {
    n = n | 0;
    if (typeof cn === 'function') return cn(Math.max(0, n));
    return String(n);
  }

  function shorten(text, max) {
    let t = String(text || '').replace(/\s+/g, '').replace(/[“”"「」]/g, '');
    const i = t.search(/[。！？]/);
    if (i >= 6) t = t.slice(0, i);
    if (t.length > max) t = t.slice(0, max);
    return t;
  }

  function highlights(s) {
    const log = s.log || [];
    const fromLog = title => {
      for (let i = log.length - 1; i >= 0; i--) {
        const e = log[i];
        if (e && e.title === title && e.text && !e.guide) return shorten(e.text, 24);
      }
      return '';
    };
    let src = (s.marks || []).filter(m => m && (m.t || m.d)).map(m => ({
      t: m.t || '',
      y: m.y | 0,
      d: m.d ? shorten(m.d, 24) : fromLog(m.t),
    }));
    if (src.length < 4) {
      for (const e of log) {
        if (!e || e.guide || (!e.title && !e.text)) continue;
        const t = e.title || '';
        if (t && src.some(d => d.t === t)) {
          const hit = src.find(d => d.t === t);
          if (hit && !hit.d && e.text) hit.d = shorten(e.text, 24);
          continue;
        }
        src.push({ t, y: 0, d: shorten(e.text || t, 24) });
        if (src.length >= 6) break;
      }
    }
    let pick = src;
    if (src.length > 6) {
      pick = [];
      for (let i = 0; i < 6; i++) pick.push(src[Math.round(i * (src.length - 1) / 5)]);
    }
    const out = [];
    for (const m of pick) {
      const d = m.d || m.t;
      if (!d) continue;
      if (out.length && out[out.length - 1].d === d) continue;
      out.push({ t: m.t, y: m.y | 0, d });
    }
    return out.slice(0, 6);
  }

  function metaLines(s) {
    const rs = (typeof Core !== 'undefined' && Core.realmStr) ? Core.realmStr(s) : '';
    const org = s.sect && s.sect.org && typeof ORGS !== 'undefined' && ORGS[s.sect.org] ? ORGS[s.sect.org].name : '';
    const rank = (org && (s.sect.rank | 0) >= 0 && ORGS[s.sect.org].ranks) ? (ORGS[s.sect.org].ranks[s.sect.rank | 0] || '') : '';
    const path = (typeof Core !== 'undefined' && Core.pathSummary) ? (Core.pathSummary(s) || []).map(x => x.name).join(' · ') : '';
    const gf = s.gf && typeof GONGFA !== 'undefined' && GONGFA[s.gf] ? GONGFA[s.gf].name : '';
    const court = (typeof courtRankName === 'function') ? courtRankName(s) : '';
    const lines = [];
    if (rs) lines.push(rs);
    lines.push(num(s.age) + '岁　·　寿' + num(s.lifespan));
    if (org) lines.push(org + (rank ? rank : ''));
    else lines.push('无门无派');
    if (path) lines.push(path);
    else if (gf) lines.push('《' + gf + '》');
    if (court && court !== '白身') lines.push(court);
    if (typeof Life !== 'undefined' && Life.judgeLine) {
      const j = Life.judgeLine(s, s.ending);
      if (j) lines.push(j.replace(/。/g, ''));
    }
    return lines.slice(0, 6);
  }

  async function ensureFonts() {
    if (!document.fonts || !document.fonts.load) return;
    const jobs = [
      document.fonts.load('108px MoCao'),
      document.fonts.load('40px MoShu'),
      document.fonts.load('22px MoWen'),
      document.fonts.load('18px MoWen'),
      document.fonts.load('15px MoWen'),
    ];
    await Promise.race([
      Promise.all(jobs).then(() => document.fonts.ready),
      new Promise(r => setTimeout(r, 2800)),
    ]);
  }

  function paper(ctx, w, h, seed) {
    const rnd = rng(seed);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#f6f0e2');
    g.addColorStop(0.42, PAPER);
    g.addColorStop(1, '#e4d5be');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const stains = [
      [w * 0.08, h * 0.12, 220, 'rgba(140,96,52,0.05)'],
      [w * 0.86, h * 0.2, 180, 'rgba(120,80,48,0.045)'],
      [w * 0.2, h * 0.78, 260, 'rgba(110,78,46,0.04)'],
      [w * 0.72, h * 0.9, 200, 'rgba(90,60,36,0.05)'],
    ];
    for (const [x, y, r, col] of stains) {
      const sg = ctx.createRadialGradient(x, y, 10, x, y, r);
      sg.addColorStop(0, col);
      sg.addColorStop(1, 'rgba(90,60,30,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.save();
    for (let i = 0; i < 520; i++) {
      const x = rnd() * w, y = rnd() * h, len = 8 + rnd() * 36, ang = rnd() * Math.PI;
      const light = rnd() < 0.28;
      ctx.strokeStyle = light ? 'rgba(255,252,244,0.45)' : 'rgba(110,88,60,0.07)';
      ctx.lineWidth = 0.4 + rnd() * 0.7;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + Math.cos(ang) * len * 0.5 + (rnd() - 0.5) * 8, y + Math.sin(ang) * len * 0.5, x + Math.cos(ang) * len, y + Math.sin(ang) * len);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.035;
    ctx.fillStyle = INK;
    for (let i = 0; i < 1400; i++) ctx.fillRect(rnd() * w, rnd() * h, 0.6 + rnd(), 0.6 + rnd());
    ctx.restore();
    const edge = ctx.createLinearGradient(0, 0, w, 0);
    edge.addColorStop(0, 'rgba(92,64,36,0.16)');
    edge.addColorStop(0.06, 'rgba(92,64,36,0)');
    edge.addColorStop(0.94, 'rgba(92,64,36,0)');
    edge.addColorStop(1, 'rgba(92,64,36,0.16)');
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, w, h);
    const vg = ctx.createRadialGradient(w * 0.5, h * 0.42, w * 0.2, w * 0.5, h * 0.48, h * 0.72);
    vg.addColorStop(0, 'rgba(90,60,30,0)');
    vg.addColorStop(1, 'rgba(70,48,28,0.13)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function roller(ctx, y, w) {
    const h = 22;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#6a5140');
    g.addColorStop(0.4, '#2b211a');
    g.addColorStop(0.72, '#1a140f');
    g.addColorStop(1, '#4a382c');
    ctx.fillStyle = g;
    roundRect(ctx, 36, y, w - 72, h, 8);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,236,210,0.16)';
    ctx.fillRect(52, y + 3, w - 104, 1.5);
    const cap = ctx.createLinearGradient(0, y - 3, 0, y + h + 3);
    cap.addColorStop(0, '#efe6d4');
    cap.addColorStop(0.45, '#c9bea4');
    cap.addColorStop(1, '#a89880');
    ctx.fillStyle = cap;
    roundRect(ctx, 22, y - 3, 16, h + 6, 3);
    ctx.fill();
    roundRect(ctx, w - 38, y - 3, 16, h + 6, 3);
    ctx.fill();
  }

  function fadeEdge(cv, frac, fromTop) {
    const c = cv.getContext('2d');
    const h = cv.height;
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'destination-out';
    const g = c.createLinearGradient(0, fromTop ? 0 : h * (1 - frac), 0, fromTop ? h * frac : h);
    if (fromTop) {
      g.addColorStop(0, 'rgba(0,0,0,0.92)');
      g.addColorStop(0.45, 'rgba(0,0,0,0.25)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
    } else {
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.65)');
    }
    c.fillStyle = g;
    c.fillRect(0, fromTop ? 0 : h * (1 - frac), cv.width, h * frac);
    c.restore();
  }

  function land(ctx, x, y, w, h, seed, kind) {
    if (typeof Ink === 'undefined' || !Ink.mountainLayer || h < 80) return;
    const far = document.createElement('canvas');
    const near = document.createElement('canvas');
    Ink.mountainLayer(far, {
      W: w, H: h, seed: seed + 3,
      rgb: [78, 88, 96], alpha: 0.34,
      base: 0.62, amp: 0.34, peaks: 6, width: 0.11, sharp: 1.55,
      fade: 0.5, wash: 0.46, cun: 0.045, cunLen: 0.85, folds: 1,
      line: 0.5, dots: 0.02, trees: 0, bottomFade: true, hero: 2,
    });
    Ink.mountainLayer(near, {
      W: w, H: h, seed: seed + 11,
      rgb: [42, 38, 34], alpha: 0.5,
      base: 0.8, amp: 0.38, peaks: 7, width: 0.08, sharp: 1.65,
      fade: 0.58, wash: 0.5, cun: 0.06, cunLen: 1, folds: 2,
      line: 0.8, dots: 0.03,
      trees: kind === 'zuohua' || kind === 'yunluo' || kind === 'guiyin' ? 3 : 1,
      treeSize: 0.62, bottomFade: true, hero: 3,
    });
    fadeEdge(far, 0.34, true);
    fadeEdge(near, 0.2, true);
    ctx.save();
    ctx.drawImage(far, x, y, w, h);
    ctx.drawImage(near, x, y + h * 0.08, w, h * 0.92);
    motif(ctx, kind, x, y, w, h, seed);
    ctx.restore();
  }

  function motif(ctx, kind, x, y, w, h, seed) {
    const rnd = rng(seed ^ 91);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (kind === 'ascend') {
      const sx = x + w * 0.62, sy = y + h * 0.22;
      const g = ctx.createRadialGradient(sx, sy, 2, sx, sy, 54);
      g.addColorStop(0, 'rgba(176,148,96,0.28)');
      g.addColorStop(1, 'rgba(176,148,96,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(sx, sy, 54, 0, 7);
      ctx.fill();
      ctx.strokeStyle = 'rgba(36,32,28,0.38)';
      ctx.lineWidth = 1.1;
      crane(ctx, x + w * 0.28, y + h * 0.3, 0.9);
      crane(ctx, x + w * 0.4, y + h * 0.18, 0.62);
    } else if (kind === 'zuohua' || kind === 'yunluo') {
      ctx.strokeStyle = 'rgba(40,34,30,0.4)';
      ctx.lineWidth = 1.15;
      const bx = x + w * 0.3, by = y + h * 0.62;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.bezierCurveTo(bx - 8, by - h * 0.18, bx + 16, by - h * 0.32, bx + 4, y + h * 0.16);
      ctx.stroke();
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.moveTo(bx + 10, by);
      ctx.bezierCurveTo(bx + 18, by - h * 0.14, bx + 2, by - h * 0.26, bx + 14, y + h * 0.22);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(bx - 16, by + 2);
      ctx.lineTo(bx + 22, by + 6);
      ctx.stroke();
    } else if (kind === 'renhuang' || kind === 'quancheng') {
      ctx.strokeStyle = 'rgba(36,32,28,0.32)';
      ctx.lineWidth = 1.2;
      const rx = x + w * 0.58, ry = y + h * 0.48;
      for (let i = 0; i < 3; i++) {
        const yy = ry - i * 16, ww = 78 - i * 14;
        ctx.beginPath();
        ctx.moveTo(rx, yy);
        ctx.quadraticCurveTo(rx + ww * 0.5, yy - 11, rx + ww, yy + 1);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(rx + 18, ry + 4);
      ctx.lineTo(rx + 18, ry + 28);
      ctx.moveTo(rx + 52, ry + 2);
      ctx.lineTo(rx + 50, ry + 26);
      ctx.stroke();
    } else if (kind === 'guiyin') {
      ctx.strokeStyle = 'rgba(36,32,28,0.34)';
      ctx.lineWidth = 1.15;
      const bx = x + w * 0.34, by = y + h * 0.58;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + 40, by + 14, bx + 86, by - 2);
      ctx.quadraticCurveTo(bx + 48, by + 8, bx + 8, by + 4);
      ctx.stroke();
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.arc(x + w * 0.72, y + h * 0.2, 11, 0, 7);
      ctx.stroke();
    } else if (kind === 'bingjie') {
      ctx.strokeStyle = 'rgba(36,32,28,0.4)';
      ctx.lineWidth = 1.3;
      const bx = x + w * 0.36, by = y + h * 0.42;
      ctx.beginPath();
      ctx.moveTo(bx, by + 36);
      ctx.lineTo(bx + 28, by);
      ctx.moveTo(bx + 34, by + 8);
      ctx.lineTo(bx + 58, by - 18);
      ctx.stroke();
    } else if (kind === 'rumo') {
      ctx.fillStyle = 'rgba(90,24,20,0.28)';
      for (let i = 0; i < 4; i++) {
        const dx = x + w * (0.22 + i * 0.08) + rnd() * 10;
        const dy = y + h * 0.2;
        ctx.beginPath();
        ctx.moveTo(dx, dy);
        ctx.quadraticCurveTo(dx + 3, dy + 24, dx - 1, dy + 40 + rnd() * 16);
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = 'rgba(90,24,20,0.28)';
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function crane(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.quadraticCurveTo(18, 2, 36, 6);
    ctx.moveTo(28, 5);
    ctx.quadraticCurveTo(16, -8, 4, -16);
    ctx.moveTo(30, 4);
    ctx.quadraticCurveTo(46, -6, 58, -2);
    ctx.stroke();
    ctx.restore();
  }

  function wobbleBox(ctx, s, rnd, amp) {
    const c = [[-s, -s], [s, -s], [s, s], [-s, s]];
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const [x0, y0] = c[i], [x1, y1] = c[(i + 1) % 4];
      const j = () => (rnd() - 0.5) * amp;
      if (!i) ctx.moveTo(x0 + j(), y0 + j());
      ctx.quadraticCurveTo((x0 + x1) / 2 + j() * 1.4, (y0 + y1) / 2 + j() * 1.4, x1 + j(), y1 + j());
    }
    ctx.closePath();
  }

  function seal(ctx, x, y, ch, seed) {
    const rnd = rng(seed ^ 0x51a1);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.16);
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.translate(1.6, 2.2);
    ctx.fillStyle = ZHU;
    wobbleBox(ctx, 48, rnd, 7);
    ctx.fill();
    ctx.restore();
    const g = ctx.createRadialGradient(-10, -12, 6, 4, 6, 62);
    g.addColorStop(0, '#b24a40');
    g.addColorStop(0.55, '#922e28');
    g.addColorStop(1, '#6e241f');
    ctx.fillStyle = g;
    wobbleBox(ctx, 44, rnd, 6.5);
    ctx.fill();
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 28; i++) {
      const edge = rnd() < 0.55;
      const px = edge ? (rnd() < 0.5 ? -1 : 1) * (30 + rnd() * 16) : (rnd() - 0.5) * 70;
      const py = edge ? (rnd() - 0.5) * 78 : (rnd() - 0.5) * 70;
      ctx.globalAlpha = 0.35 + rnd() * 0.55;
      ctx.beginPath();
      ctx.ellipse(px, py, 1.2 + rnd() * 4.2, 0.7 + rnd() * 2.4, rnd() * 3, 0, 6.3);
      ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(243,234,214,0.72)';
    ctx.lineWidth = 1.35;
    wobbleBox(ctx, 30, rnd, 3.2);
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 5; i++) {
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc((rnd() - 0.5) * 52, (rnd() < 0.5 ? -1 : 1) * (26 + rnd() * 6), 2 + rnd() * 3, 0, 7);
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = '#f4ecda';
    ctx.font = '40px MoShu, MoWen, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ch || '终', (rnd() - 0.5) * 2, 1 + (rnd() - 0.5) * 2);
    ctx.restore();
  }

  function fitLine(ctx, text, max) {
    const chars = [...String(text || '')];
    let cur = '';
    for (const ch of chars) {
      if (ctx.measureText(cur + ch).width > max) break;
      cur += ch;
    }
    return cur || chars[0] || '';
  }

  async function render(s, kind, title) {
    await ensureFonts();
    const hs = highlights(s);
    const lines = metaLines(s);
    const chars = [...(title || '坐化')].slice(0, 4);
    const titleTop = 196;
    const titleStep = chars.length > 2 ? 108 : 128;
    const titleX = W - 128;
    const titleBottom = titleTop + Math.max(0, chars.length - 1) * titleStep + 54;
    const sealY = titleBottom + 62;
    const sealBottom = sealY + 52;

    const nameY = 176;
    const metaTop = 268;
    const metaGap = 34;
    const metaBottom = metaTop + lines.length * metaGap;
    const hiTop = metaBottom + 54;
    const hiGap = hs.length >= 6 ? 52 : 58;
    const textBottom = hiTop + Math.max(0, hs.length - 1) * hiGap + 28;
    const blockBottom = Math.max(textBottom, sealBottom);
    const landTop = blockBottom + 56;
    const landH = 360;
    const H = landTop + landH + 108;

    const canvas = document.createElement('canvas');
    const dpr = Math.min(2, (window.devicePixelRatio || 1));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const seed = (s.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 17) + (s.age | 0) * 13 + (s.realm | 0) * 99;

    paper(ctx, W, H, seed);
    roller(ctx, 26, W);
    roller(ctx, H - 48, W);
    land(ctx, 48, landTop, W - 96, landH, seed, kind || 'zuohua');

    ctx.save();
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '108px MoCao, MoShu, serif';
    chars.forEach((ch, i) => {
      ctx.shadowColor = 'rgba(28,25,21,0.18)';
      ctx.shadowBlur = 0.6;
      ctx.fillText(ch, titleX, titleTop + i * titleStep);
    });
    ctx.shadowBlur = 0;

    const sealCh = SEAL_CH[kind] || chars[0] || '终';
    seal(ctx, titleX, sealY, sealCh, seed);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = INK;
    ctx.font = '40px MoShu, MoWen, serif';
    ctx.fillText(s.name || '无名', 86, nameY);
    const lg = s.lg ? ((s.lg.id === 'wei' ? '' : (s.lgEls || []).join('')) + (s.lg.name || '')) : '';
    if (lg) {
      ctx.font = '18px MoWen, serif';
      ctx.fillStyle = INK3;
      ctx.fillText(lg, 88, nameY + 32);
    }

    ctx.strokeStyle = 'rgba(28,25,21,0.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(88, metaTop - 28);
    ctx.bezierCurveTo(140, metaTop - 30, 200, metaTop - 24, 250, metaTop - 28);
    ctx.stroke();

    ctx.font = '20px MoWen, serif';
    lines.forEach((ln, i) => {
      ctx.fillStyle = i === 0 ? INK : INK2;
      ctx.fillText(ln, 88, metaTop + i * metaGap);
    });

    const bodyMax = titleX - 96;
    ctx.font = '22px MoWen, serif';
    hs.forEach((h, i) => {
      const y = hiTop + i * hiGap;
      const age = h.y ? (num(h.y) + '岁') : '';
      ctx.textAlign = 'right';
      ctx.fillStyle = ZHU;
      ctx.font = '16px MoWen, serif';
      if (age) ctx.fillText(age, 196, y);
      ctx.textAlign = 'left';
      ctx.fillStyle = INK;
      ctx.font = '22px MoWen, serif';
      ctx.fillText(fitLine(ctx, h.d || h.t, bodyMax - 214), 214, y);
    });

    ctx.fillStyle = 'rgba(28,25,21,0.5)';
    ctx.font = '16px MoShu, MoWen, serif';
    ctx.textAlign = 'center';
    ctx.fillText('纸上仙途', W / 2, H - 92);
    ctx.font = '13px MoWen, serif';
    ctx.fillStyle = 'rgba(28,25,21,0.38)';
    ctx.fillText(URL, W / 2, H - 70);
    ctx.restore();
    return canvas;
  }

  return { render, highlights, W };
})();
