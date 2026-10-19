/* 墨仙录 · 本命法宝墨绘与开光仪式（程序墨迹，无外链图）
   开光是运笔与渗纸，不是光爆。 */
'use strict';
const FabaoArt = (() => {
  const R = () => typeof FX !== 'undefined' && FX.reduced && FX.reduced();
  let pending = null;

  const SHAPE = {
    尺: 'ruler', 刃: 'blade', 簪: 'pin', 针: 'needle', 镜: 'mirror', 珠: 'orb',
    灯: 'lamp', 印: 'seal', 圭: 'gui', 剑: 'sword', 简: 'slip', 器: 'orb',
  };

  function hash(n) {
    const x = Math.sin(n * 127.1 + 3.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function circleAt(x, y, r, n) {
    const pts = [];
    const start = -Math.PI * 0.72;
    for (let i = 0; i <= n; i++) {
      const a = start + (i / n) * Math.PI * 2;
      pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
    }
    return pts;
  }

  function shapeStrokes(kind) {
    const S = (pts, w, a) => ({ pts, w, a });
    if (kind === 'sword') return [
      S([[0, -48], [0, 16]], 3.3, 1),
      S([[0, 16], [0, 40]], 2.8, .88),
      S([[-12, -4], [12, -4]], 2.2, .78),
      S([[-5, 40], [5, 40], [0, 52], [-5, 40]], 1.7, .62),
    ];
    if (kind === 'blade') return [
      S([[0, -46], [1, 6], [0, 34]], 3.1, 1),
      S([[3, -34], [8, -6], [3, 14]], 1.4, .48),
      S([[-11, 4], [11, 4]], 2.1, .75),
      S([[-5, 34], [6, 34], [0, 46]], 1.6, .58),
    ];
    if (kind === 'ruler' || kind === 'gui' || kind === 'slip') {
      const w = kind === 'slip' ? 16 : kind === 'gui' ? 14 : 11;
      const ticks = [];
      for (let y = -28; y <= 28; y += 14) ticks.push(S([[-w + 4, y], [w - 4, y]], 1.05, .38));
      return [
        S([[-w, -44], [-w, 44]], 2.2, .95),
        S([[-w, 44], [w, 44]], 2.2, .88),
        S([[w, 44], [w, -44]], 2.2, .88),
        S([[w, -44], [-w, -44]], 2.1, .8),
        ...ticks,
      ];
    }
    if (kind === 'pin' || kind === 'needle') {
      const list = [
        S([[0, -50], [0, 46]], kind === 'needle' ? 1.55 : 2.3, 1),
        S([[-8, -40], [0, -52], [8, -40]], 1.7, .78),
      ];
      if (kind === 'pin') list.push(S(circleAt(0, -34, 5, 16), 1.45, .72));
      return list;
    }
    if (kind === 'mirror') return [
      S(circleAt(0, -6, 32, 28), 2.5, 1),
      S(circleAt(-8, -14, 11, 12).slice(0, 8), 1.3, .32),
      S([[0, 26], [0, 44]], 1.8, .7),
      S([[-8, 44], [8, 44]], 1.7, .6),
    ];
    if (kind === 'lamp') return [
      S([[-16, 28], [16, 28]], 2.2, .9),
      S([[16, 28], [10, 8], [-10, 8], [-16, 28]], 2.1, .85),
      S([[-7, 8], [-4, -16], [0, -32]], 1.9, .9),
      S([[0, -32], [5, -16], [7, 8]], 1.9, .85),
      S(circleAt(0, -38, 4.2, 10), 1.3, .7),
    ];
    if (kind === 'seal') return [
      S([[-24, -24], [24, -24]], 2.6, 1),
      S([[24, -24], [24, 24]], 2.6, .92),
      S([[24, 24], [-24, 24]], 2.6, .92),
      S([[-24, 24], [-24, -24]], 2.6, .88),
      S([[-8, -4], [8, -4]], 1.9, .66),
      S([[0, -12], [0, 12]], 1.9, .66),
    ];
    return [
      S(circleAt(0, 0, 28, 26), 2.4, 1),
      S(circleAt(-8, -8, 8, 10).slice(0, 7), 1.3, .34),
    ];
  }

  function strokeCore(ctx, pts, w, a) {
    if (!pts || pts.length < 2) return;
    const n = pts.length - 1;
    for (let i = 0; i < n; i++) {
      const t = n <= 1 ? 1 : i / n;
      const press = t < 0.14 ? 1.18 : t > 0.8 ? 0.62 + (1 - t) * 1.6 : 1;
      ctx.beginPath();
      ctx.moveTo(pts[i][0], pts[i][1]);
      ctx.lineTo(pts[i + 1][0], pts[i + 1][1]);
      ctx.strokeStyle = `rgba(27,24,20,${Math.min(1, a * (0.82 + 0.18 * (1 - t)))})`;
      ctx.lineWidth = w * press;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  }

  function strokeSoft(ctx, pts, w, a) {
    if (!pts || pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.strokeStyle = `rgba(62,48,32,${a})`;
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  function partialPts(pts, t) {
    if (t >= 1) return pts;
    if (t <= 0 || pts.length < 2) return [];
    const seg = pts.length - 1;
    const f = t * seg;
    const i = Math.min(seg - 1, Math.floor(f));
    const u = f - i;
    const a = pts[i], b = pts[i + 1];
    const out = pts.slice(0, i + 1);
    out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
    return out;
  }

  function bleedSpecks(ctx, pts, seed, amount) {
    if (!pts || pts.length < 2 || amount <= 0) return;
    const n = 3;
    for (let k = 0; k < n; k++) {
      const t = hash(seed + k * 1.7);
      const seg = pts.length - 1;
      const f = t * seg;
      const i = Math.min(seg - 1, Math.floor(f));
      const u = f - i;
      const a = pts[i], b = pts[Math.min(seg, i + 1)];
      const mx = a[0] + (b[0] - a[0]) * u;
      const my = a[1] + (b[1] - a[1]) * u;
      let dx = b[0] - a[0], dy = b[1] - a[1];
      const d = Math.hypot(dx, dy) || 1;
      dx /= d; dy /= d;
      const side = (hash(seed + k * 4.2) - 0.5) * 9 * amount;
      ctx.beginPath();
      ctx.arc(mx - dy * side, my + dx * side, 1.1 + hash(seed + k) * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(48,36,24,${(0.04 + hash(seed + k * 2) * 0.05) * amount})`;
      ctx.fill();
    }
  }

  /* 笔顺：每笔先顿一下再走，走完才渗开 */
  function mapBrush(p, n) {
    if (p >= 1) return { done: n, i: n - 1, t: 1 };
    const slot = p * n;
    const i = Math.min(n - 1, Math.floor(slot));
    const u = slot - i;
    const pause = 0.18;
    const t = u < pause ? 0 : (u - pause) / (1 - pause);
    return { done: i, i, t };
  }

  function drawOrdered(ctx, kind, stage, progress) {
    const strokes = shapeStrokes(kind);
    const ink = stage >= 3 ? 0.82 : stage >= 2 ? 0.74 : stage >= 1 ? 0.66 : 0.55;
    const wet = 0.85 + Math.min(stage, 3) * 0.12;
    if (progress > 0.04) {
      const a = 0.04 * Math.min(1, progress);
      const g = ctx.createRadialGradient(0, 4, 6, 0, 4, 58);
      g.addColorStop(0, `rgba(48,36,24,${a})`);
      g.addColorStop(1, 'rgba(48,36,24,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 4, 58, 0, Math.PI * 2);
      ctx.fill();
    }
    const br = mapBrush(progress, strokes.length);
    strokes.forEach((st, idx) => {
      let t = 0;
      if (idx < br.done) t = 1;
      else if (idx === br.i) t = br.t;
      else return;
      const drawn = partialPts(st.pts, t);
      if (drawn.length < 2) return;
      const bleed = (0.1 + (t > 0.75 ? (t - 0.75) : 0) * 0.28) * wet;
      strokeSoft(ctx, drawn, st.w * 3.4, st.a * ink * 0.07 * (0.6 + t));
      strokeSoft(ctx, drawn, st.w * 1.85, st.a * ink * 0.16 * t);
      strokeCore(ctx, drawn, st.w, st.a * ink);
      if (t > 0.8) bleedSpecks(ctx, drawn, idx * 19 + kind.length * 3, bleed);
    });
    if (stage >= 1 && progress >= 0.92) {
      const k = Math.min(1, (progress - 0.92) / 0.08);
      const heart = { sword: [0, -4], blade: [0, 4], pin: [0, -34], needle: [0, -48], mirror: [0, -6], lamp: [0, -38] }[kind] || [0, 0];
      ctx.beginPath();
      ctx.arc(heart[0] + 0.4, heart[1] + 0.5, 6.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(142,36,32,${0.08 * k})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(heart[0], heart[1], 2.05 + k * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(122,28,24,${0.8 * k})`;
      ctx.fill();
    }
  }

  function fibers(ctx, w, h) {
    ctx.save();
    ctx.strokeStyle = 'rgba(90,70,46,.055)';
    ctx.lineWidth = 0.6;
    ctx.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      const x = hash(i * 3.1) * w;
      const y = hash(i * 5.7) * h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + hash(i + 9) * 16 - 6, y + 3, x + hash(i + 2) * 22 - 8, y + hash(i + 4) * 6);
      ctx.stroke();
    }
    ctx.restore();
  }

  function render(cv, fabao, opt) {
    if (!cv || !fabao) return;
    opt = opt || {};
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssW = cv.clientWidth || opt.w || 280;
    const cssH = cv.clientHeight || opt.h || 168;
    const pw = Math.round(cssW * dpr), ph = Math.round(cssH * dpr);
    if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    fibers(ctx, cssW, cssH);
    const kind = SHAPE[fabao.seal] || SHAPE[fabao.id] || 'orb';
    const stage = fabao.stage | 0;
    const s = Math.min(cssW, cssH) / 148;
    ctx.save();
    ctx.translate(cssW / 2, cssH / 2 + 2);
    ctx.scale(s, s);
    drawOrdered(ctx, kind, stage, opt.progress == null ? 1 : opt.progress);
    ctx.restore();
  }

  function paint(canvas, fabao, opt) { render(canvas, fabao, opt); }

  function mountCard(card, fabao) {
    if (!card || !fabao) return;
    let wrap = card.querySelector('.fabao-art');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'fabao-art';
      wrap.innerHTML = '<canvas aria-hidden="true"></canvas>';
      const head = card.querySelector('.fabao-head');
      if (head) card.insertBefore(wrap, head.nextSibling);
      else card.prepend(wrap);
    }
    paint(wrap.querySelector('canvas'), fabao);
  }

  function queue(fabao, stageName) {
    if (!fabao || !stageName) return;
    pending = { fabao: { ...fabao }, stageName };
  }

  async function flushIfAny() {
    if (!pending) return;
    const p = pending; pending = null;
    await ceremony(p.fabao, p.stageName);
  }

  async function ceremony(fabao, stageName) {
    if (!fabao) return;
    const host = document.createElement('div');
    host.className = 'fb-cer' + (stageName === '开光' ? ' kai' : '') + (stageName === '化形' ? ' hua' : '');
    host.innerHTML = `<div class="fb-cer-shade"></div>
      <div class="fb-cer-panel">
        <canvas class="fb-cer-cv" width="280" height="200"></canvas>
        <div class="fb-cer-title">${stageName}</div>
        <div class="fb-cer-name">${fabao.name || ''}</div>
        <p class="fb-cer-line"></p>
      </div>`;
    document.body.appendChild(host);
    const lines = {
      '开光': '器心一点亮。你以神识点上印堂，本命器嗡鸣，光从识海深处洇开——自此，它看见你，你也看见它。',
      '祭炼': '心血与器纹相融。锋与钝、光与影，都在这一夜重新排过。',
      '化形': '器形大成。它不再只是一件物，是你在天地间多出的一只手、一只眼。',
    };
    const line = host.querySelector('.fb-cer-line');
    const cv = host.querySelector('.fb-cer-cv');
    const shown = { ...fabao, stage: Math.max(1, fabao.stage | 0) };
    const finish = () => render(cv, shown, { progress: 1, w: 280, h: 168 });
    requestAnimationFrame(() => host.classList.add('go'));
    if (typeof MoAudio !== 'undefined') MoAudio.play(stageName === '开光' ? 'gold' : 'splash');
    if (typeof inkWrite === 'function') inkWrite(line, lines[stageName] || lines['开光'], { immediate: true, step: R() ? 6 : 28, cadence: true });
    else line.textContent = lines[stageName] || '';
    if (R()) finish();
    else {
      const t0 = performance.now();
      const dur = 1680;
      let last = 0;
      const tick = (now) => {
        const k = Math.min(1, (now - t0) / dur);
        if (k < 1 && now - last < 32) { requestAnimationFrame(tick); return; }
        last = now;
        const eased = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        render(cv, shown, { progress: eased });
        if (k < 1 && host.isConnected) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
    await new Promise(r => setTimeout(r, R() ? 700 : 2900));
    host.classList.add('leave');
    await new Promise(r => setTimeout(r, R() ? 200 : 700));
    host.remove();
  }

  return { paint, mountCard, queue, flushIfAny, ceremony, SHAPE };
})();
