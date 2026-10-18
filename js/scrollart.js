/* 墨仙录 · 终卷绘卷：canvas → PNG。字体须先加载再落笔。 */
'use strict';
const ScrollArt = (() => {
  const W = 900;
  const INK = '#1c1915';
  const INK2 = '#3a332b';
  const ZHU = '#9d2b26';
  const PAPER = '#f4ecda';
  const URL = 'https://loser-gif.github.io/xiuxian-ink/';

  function rng(seed) {
    let s = seed | 0 || 1;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  function highlights(s) {
    const marks = (s.marks || []).filter(m => m && m.t);
    let src = marks;
    if (!src.length) {
      src = (s.log || []).filter(e => e && e.title).map(e => ({ t: e.title, y: s.age | 0 }));
    }
    let pick = src;
    if (src.length > 6) {
      pick = [];
      for (let i = 0; i < 6; i++) pick.push(src[Math.round(i * (src.length - 1) / 5)]);
    }
    const out = [];
    for (const m of pick) {
      if (out.length && out[out.length - 1].t === m.t) continue;
      out.push({ t: String(m.t).slice(0, 16), y: m.y | 0 });
    }
    if (out.length < 4) {
      for (const e of (s.log || [])) {
        if (!e || !e.text) continue;
        const t = String(e.title || e.text).replace(/\s+/g, '').slice(0, 16);
        if (!t || out.some(d => d.t === t)) continue;
        out.push({ t, y: 0 });
        if (out.length >= 4) break;
      }
    }
    return out.slice(0, 6);
  }

  function metaLines(s) {
    const rs = (typeof Core !== 'undefined' && Core.realmStr) ? Core.realmStr(s) : '';
    const org = s.sect && s.sect.org && typeof ORGS !== 'undefined' && ORGS[s.sect.org] ? ORGS[s.sect.org].name : '无门';
    const rank = (s.sect && s.sect.org && ORGS[s.sect.org] && (s.sect.rank | 0) >= 0) ? ORGS[s.sect.org].ranks[s.sect.rank | 0] : '';
    const path = (typeof Core !== 'undefined' && Core.pathSummary) ? (Core.pathSummary(s) || []).map(x => x.name).join(' · ') : '';
    const gf = s.gf && typeof GONGFA !== 'undefined' && GONGFA[s.gf] ? GONGFA[s.gf].name : '';
    const lines = [];
    lines.push('境界　' + (rs || '—'));
    lines.push('春秋　' + (s.age | 0) + ' 岁　·　寿元 ' + (s.lifespan | 0));
    lines.push('门墙　' + org + (rank ? ' · ' + rank : ''));
    if (path) lines.push('定型　' + path);
    else if (gf) lines.push('主修　' + gf);
    else lines.push('路尚未定');
    if (path && gf) lines.push('主修　' + gf);
    return lines.slice(0, 5);
  }

  async function ensureFonts() {
    if (!document.fonts || !document.fonts.load) return;
    const jobs = [
      document.fonts.load('72px MoCao'),
      document.fonts.load('44px MoShu'),
      document.fonts.load('22px MoWen'),
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
    g.addColorStop(0, '#f7f1e4');
    g.addColorStop(0.45, PAPER);
    g.addColorStop(1, '#e6d9c2');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.globalAlpha = 0.045;
    ctx.fillStyle = INK;
    for (let i = 0; i < 900; i++) {
      ctx.fillRect(rnd() * w, rnd() * h, rnd() * 1.6 + 0.3, rnd() * 1.6 + 0.3);
    }
    ctx.globalAlpha = 0.05;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.6;
    for (let i = 0; i < 18; i++) {
      ctx.beginPath();
      let x = rnd() * w, y = rnd() * h;
      ctx.moveTo(x, y);
      for (let k = 0; k < 4; k++) { x += (rnd() - 0.5) * 80; y += 20 + rnd() * 40; ctx.quadraticCurveTo(x + 10, y - 8, x, y); }
      ctx.stroke();
    }
    ctx.restore();
    const vg = ctx.createRadialGradient(w * 0.5, h * 0.4, w * 0.2, w * 0.5, h * 0.45, w * 0.85);
    vg.addColorStop(0, 'rgba(90,60,30,0)');
    vg.addColorStop(1, 'rgba(90,60,30,0.14)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }

  function roller(ctx, y, w) {
    const h = 28;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#6a5140');
    g.addColorStop(0.35, '#2b211a');
    g.addColorStop(0.7, '#1a140f');
    g.addColorStop(1, '#4a382c');
    ctx.fillStyle = g;
    roundRect(ctx, 18, y, w - 36, h, 10);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,236,210,0.18)';
    ctx.fillRect(36, y + 4, w - 72, 2);
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

  function mountains(ctx, w, y, seed) {
    const rnd = rng(seed);
    ctx.save();
    ctx.translate(0, y);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.moveTo(0, 90);
    let x = 0;
    while (x < w) {
      const nx = x + 70 + rnd() * 90;
      const peak = 20 + rnd() * 50;
      ctx.quadraticCurveTo((x + nx) / 2, peak, nx, 70 + rnd() * 20);
      x = nx;
    }
    ctx.lineTo(w, 120); ctx.lineTo(0, 120); ctx.fill();
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.moveTo(0, 100);
    x = 0;
    while (x < w) {
      const nx = x + 90 + rnd() * 110;
      ctx.quadraticCurveTo((x + nx) / 2, 40 + rnd() * 30, nx, 88);
      x = nx;
    }
    ctx.lineTo(w, 130); ctx.lineTo(0, 130); ctx.fill();
    ctx.restore();
  }

  function seal(ctx, x, y, ch, seed) {
    const rnd = rng(seed ^ 0x5ead);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.12);
    roundRect(ctx, -46, -46, 92, 92, 6);
    ctx.fillStyle = ZHU;
    ctx.fill();
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 16; i++) {
      ctx.globalAlpha = 0.35 + rnd() * 0.5;
      ctx.beginPath();
      ctx.ellipse(-40 + rnd() * 80, -40 + rnd() * 80, 1 + rnd() * 3.2, 0.8 + rnd() * 2, rnd() * 3, 0, 6.3);
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = '#f3ead6';
    ctx.font = '46px MoShu, MoWen, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ch || '终', 0, 4);
    ctx.restore();
  }

  function wrap(ctx, text, max) {
    const chars = [...String(text)];
    const lines = [];
    let cur = '';
    for (const ch of chars) {
      if (ctx.measureText(cur + ch).width > max && cur) { lines.push(cur); cur = ch; }
      else cur += ch;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  async function render(s, kind, title) {
    await ensureFonts();
    const hs = highlights(s);
    const lines = metaLines(s);
    const H = 1180 + Math.max(0, hs.length - 4) * 36;
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
    roller(ctx, 22, W);
    roller(ctx, H - 50, W);
    mountains(ctx, W, 58, seed);

    ctx.save();
    ctx.strokeStyle = 'rgba(28,25,21,0.18)';
    ctx.lineWidth = 1;
    ctx.strokeRect(36, 78, W - 72, H - 156);

    const chars = [...(title || '坐化')].slice(0, 4);
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '68px MoCao, MoShu, serif';
    chars.forEach((ch, i) => ctx.fillText(ch, W - 108, 210 + i * 78));

    ctx.textAlign = 'left';
    ctx.font = '46px MoShu, MoWen, serif';
    ctx.fillStyle = INK;
    ctx.fillText(s.name || '无名', 72, 188);

    ctx.font = '20px MoWen, serif';
    ctx.fillStyle = INK2;
    const lg = (s.lg ? ((s.lg.id === 'wei' ? '' : (s.lgEls || []).join('')) + s.lg.name) : '');
    ctx.fillText(lg, 74, 228);

    ctx.font = '22px MoWen, serif';
    lines.forEach((ln, i) => {
      ctx.fillStyle = i === 0 ? INK : INK2;
      ctx.fillText(ln, 74, 290 + i * 40);
    });

    const divY = 290 + lines.length * 40 + 16;
    ctx.strokeStyle = 'rgba(28,25,21,0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(74, divY);
    ctx.bezierCurveTo(200, divY - 3, 360, divY + 4, W - 180, divY + 1);
    ctx.stroke();

    ctx.font = '15px MoWen, serif';
    ctx.fillStyle = 'rgba(28,25,21,0.45)';
    ctx.fillText('生平', 74, divY + 36);

    ctx.font = '22px MoWen, serif';
    hs.forEach((h, i) => {
      const y = divY + 74 + i * 48;
      ctx.fillStyle = ZHU;
      ctx.font = '15px MoWen, serif';
      ctx.fillText(h.y ? (h.y + ' 岁') : '·', 74, y);
      ctx.fillStyle = INK;
      ctx.font = '24px MoShu, MoWen, serif';
      const row = wrap(ctx, h.t, W - 280);
      ctx.fillText(row[0] || h.t, 168, y);
    });

    const sealCh = chars[0] || '终';
    seal(ctx, W - 150, H - 250, sealCh, seed);

    ctx.fillStyle = 'rgba(28,25,21,0.55)';
    ctx.font = '16px MoShu, MoWen, serif';
    ctx.textAlign = 'center';
    ctx.fillText('墨仙录', W / 2, H - 108);
    ctx.font = '13px MoWen, serif';
    ctx.fillStyle = 'rgba(28,25,21,0.42)';
    ctx.fillText(URL, W / 2, H - 84);
    ctx.restore();
    return canvas;
  }

  return { render, highlights, W };
})();
