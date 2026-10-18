/* 墨仙录 · 本命法宝墨绘与开光仪式（程序墨迹，无外链图） */
'use strict';
const FabaoArt = (() => {
  const R = () => typeof FX !== 'undefined' && FX.reduced && FX.reduced();
  let pending = null;

  const SHAPE = {
    尺: 'ruler', 刃: 'blade', 簪: 'pin', 针: 'needle', 镜: 'mirror', 珠: 'orb',
    灯: 'lamp', 印: 'seal', 圭: 'gui', 剑: 'sword', 简: 'slip', 器: 'orb',
  };

  function inkStroke(ctx, pts, w0, a) {
    if (pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.strokeStyle = `rgba(27,24,20,${a})`;
    ctx.lineWidth = w0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  function drawShape(ctx, kind, cx, cy, s, stage) {
    const ink = stage >= 3 ? 0.78 : stage >= 2 ? 0.7 : stage >= 1 ? 0.62 : 0.5;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    // paper wash
    const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 70);
    g.addColorStop(0, 'rgba(249,245,233,.55)');
    g.addColorStop(1, 'rgba(249,245,233,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, 72, 0, Math.PI * 2); ctx.fill();

    if (kind === 'sword' || kind === 'blade') {
      inkStroke(ctx, [[0, -48], [0, 42]], 3.2, ink);
      inkStroke(ctx, [[-10, -8], [10, -8]], 2.2, ink * 0.85);
      inkStroke(ctx, [[-6, 42], [6, 42], [0, 52], [-6, 42]], 1.8, ink * 0.7);
      if (kind === 'blade') inkStroke(ctx, [[2, -40], [8, -10], [2, 20]], 1.4, ink * 0.55);
    } else if (kind === 'ruler' || kind === 'gui' || kind === 'slip') {
      const w = kind === 'slip' ? 18 : 12;
      inkStroke(ctx, [[-w, -46], [-w, 46], [w, 46], [w, -46], [-w, -46]], 2.4, ink);
      for (let i = -30; i <= 30; i += 12) inkStroke(ctx, [[-w + 3, i], [w - 3, i]], 1.1, ink * 0.45);
    } else if (kind === 'pin' || kind === 'needle') {
      inkStroke(ctx, [[0, -50], [0, 48]], kind === 'needle' ? 1.6 : 2.4, ink);
      inkStroke(ctx, [[-8, -42], [0, -52], [8, -42]], 1.8, ink * 0.8);
      if (kind === 'pin') { ctx.beginPath(); ctx.arc(0, -36, 5, 0, Math.PI * 2); ctx.strokeStyle = `rgba(27,24,20,${ink})`; ctx.lineWidth = 1.5; ctx.stroke(); }
    } else if (kind === 'mirror' || kind === 'orb') {
      ctx.beginPath(); ctx.arc(0, 0, kind === 'orb' ? 28 : 34, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(27,24,20,${ink})`; ctx.lineWidth = 2.6; ctx.stroke();
      ctx.beginPath(); ctx.arc(-10, -10, kind === 'orb' ? 8 : 12, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(27,24,20,${ink * 0.35})`; ctx.lineWidth = 1.4; ctx.stroke();
      if (kind === 'mirror') inkStroke(ctx, [[0, 34], [0, 48], [-8, 52], [8, 52]], 1.8, ink * 0.7);
    } else if (kind === 'lamp') {
      inkStroke(ctx, [[-18, 30], [18, 30], [12, 8], [-12, 8], [-18, 30]], 2.2, ink);
      inkStroke(ctx, [[-8, 8], [-6, -18], [0, -36], [6, -18], [8, 8]], 2, ink * 0.9);
      ctx.beginPath(); ctx.arc(0, -40, 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(179,48,42,${0.25 + stage * 0.12})`; ctx.fill();
    } else if (kind === 'seal') {
      inkStroke(ctx, [[-26, -26], [26, -26], [26, 26], [-26, 26], [-26, -26]], 2.8, ink);
      inkStroke(ctx, [[-10, -6], [10, -6]], 2, ink * 0.7);
      inkStroke(ctx, [[0, -14], [0, 14]], 2, ink * 0.7);
    } else {
      ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(27,24,20,${ink})`; ctx.lineWidth = 2.4; ctx.stroke();
    }
    // stage aura
    if (stage >= 1) {
      ctx.beginPath(); ctx.arc(0, 0, 58, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(179,48,42,${0.12 + stage * 0.06})`; ctx.lineWidth = 1; ctx.stroke();
    }
    ctx.restore();
  }

  function paint(canvas, fabao) {
    if (!canvas || !fabao) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const css = canvas.clientWidth || 160;
    const h = canvas.clientHeight || 120;
    canvas.width = Math.round(css * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, css, h);
    const kind = SHAPE[fabao.seal] || SHAPE[fabao.id] || 'orb';
    drawShape(ctx, kind, css / 2, h / 2, Math.min(css, h) / 140, fabao.stage | 0);
  }

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
    paint(cv, { ...fabao, stage: Math.max(1, fabao.stage | 0) });
    requestAnimationFrame(() => host.classList.add('go'));
    if (typeof MoAudio !== 'undefined') MoAudio.play(stageName === '开光' ? 'gold' : 'splash');
    if (typeof inkWrite === 'function') inkWrite(line, lines[stageName] || lines['开光'], { immediate: true, step: R() ? 6 : 28 });
    else line.textContent = lines[stageName] || '';
    // animate ink bloom on canvas
    if (!R() && cv) {
      const t0 = performance.now();
      const tick = (now) => {
        const k = Math.min(1, (now - t0) / 1200);
        paint(cv, { ...fabao, stage: Math.max(1, fabao.stage | 0) });
        const ctx = cv.getContext('2d');
        ctx.save();
        ctx.globalAlpha = 0.25 * (1 - k);
        ctx.beginPath();
        ctx.arc(cv.width / (window.devicePixelRatio || 1) / 2, cv.height / (window.devicePixelRatio || 1) / 2, 20 + k * 70, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(179,48,42,.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
    await new Promise(r => setTimeout(r, R() ? 600 : 2800));
    host.classList.add('leave');
    await new Promise(r => setTimeout(r, R() ? 200 : 700));
    host.remove();
  }

  return { paint, mountCard, queue, flushIfAny, ceremony, SHAPE };
})();
