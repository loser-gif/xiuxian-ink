/* 纸上仙途 · 命格绘卷的纸面。不加载插画。落印只提交一次。 */
'use strict';
const MinggeUI = (() => {
  const ORDER = ['birth', 'sex', 'grab', 'six', 'ten', 'root', 'path', 'gate', 'book'];
  let root = null;
  let draft = null;
  let step = 'birth';
  let pending = '';
  let mate = 'any';
  let fast = false;
  let sealing = false;
  let opened = null;
  let resolveOpen = null;
  let raf = 0;
  let rain = null;
  let onKey = null;
  let onVis = null;
  let onHide = null;

  function motionOff() {
    if (fast) return true;
    if (typeof FX !== 'undefined' && FX.userReduced && FX.userReduced()) return true;
    try { if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true; } catch (e) {}
    return false;
  }
  function muted() {
    if (typeof MoAudio !== 'undefined' && MoAudio.isMuted && MoAudio.isMuted()) return true;
    return false;
  }
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function $(id) { return root ? root.querySelector(id) : null; }
  function stopRain() {
    if (typeof window !== 'undefined') window.__minggeAudio = 'off';
    if (!rain) return;
    try { rain.nodes.forEach(n => { try { n.stop(); } catch (e) {} }); } catch (e2) {}
    try { if (rain.ctx) rain.ctx.close(); } catch (e3) {}
    rain = null;
    if (typeof window !== 'undefined') window.__minggeAudio = 'off';
  }
  function startRain() {
    stopRain();
    if (motionOff() || muted() || step !== 'birth') return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      const ctx = new AC();
      const frames = Math.floor(ctx.sampleRate * 1.2);
      const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 720;
      const gain = ctx.createGain();
      gain.gain.value = 0.025;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();
      if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
      rain = { ctx: ctx, nodes: [src] };
      window.__minggeAudio = 'on';
    } catch (e) { rain = null; }
  }
  function stopFx() {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }
  function startFx() {
    stopFx();
    const cv = $('#mg-fx');
    if (!cv || motionOff() || step !== 'birth') {
      if (cv) cv.hidden = true;
      return;
    }
    cv.hidden = false;
    const ctx = cv.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      const w = root.clientWidth || 320;
      const h = root.clientHeight || 480;
      cv.width = Math.max(1, Math.floor(w * dpr));
      cv.height = Math.max(1, Math.floor(h * dpr));
      cv.style.width = w + 'px';
      cv.style.height = h + 'px';
    };
    resize();
    const drops = [];
    for (let i = 0; i < 28; i++) drops.push({ x: Math.random(), y: Math.random(), v: 0.15 + Math.random() * 0.35, l: 0.03 + Math.random() * 0.05 });
    const blots = [];
    for (let i = 0; i < 5; i++) blots.push({ x: 0.2 + Math.random() * 0.6, y: 0.15 + Math.random() * 0.5, r: 8 + Math.random() * 26, a: 0.04 + Math.random() * 0.06 });
    let last = 0;
    const frame = now => {
      if (!root || step !== 'birth' || motionOff()) { raf = 0; return; }
      raf = requestAnimationFrame(frame);
      if (document.hidden) return;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      const w = cv.width, h = cv.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(74,67,58,0.05)';
      blots.forEach(b => {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(74,67,58,' + b.a + ')';
        ctx.arc(b.x * w, b.y * h, b.r * dpr, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.strokeStyle = 'rgba(74,67,58,0.28)';
      ctx.lineWidth = dpr;
      drops.forEach(p => {
        p.y += p.v * dt;
        if (p.y > 1.1) p.y = -0.1;
        ctx.beginPath();
        ctx.moveTo(p.x * w, p.y * h);
        ctx.lineTo(p.x * w, (p.y + p.l) * h);
        ctx.stroke();
      });
    };
    raf = requestAnimationFrame(frame);
  }
  function lean() {
    try {
      if (typeof Samsara === 'undefined' || !Samsara.peekLegacy) return '';
      const leg = Samsara.peekLegacy();
      if (leg && leg.naihe && leg.kind === 'mem' && leg.el) return leg.el;
    } catch (e) {}
    return '';
  }
  function fieldOf(id) {
    return { sex: 'sex', grab: 'grab', six: 'six', ten: 'ten', root: 'root', path: 'path', gate: 'org' }[id] || '';
  }
  function nextId(id) {
    const i = ORDER.indexOf(id);
    for (let k = i + 1; k < ORDER.length; k++) {
      if (ORDER[k] === 'gate' && draft.path !== 'sect') continue;
      return ORDER[k];
    }
    return id;
  }
  function prevId(id) {
    const i = ORDER.indexOf(id);
    for (let k = i - 1; k >= 0; k--) {
      if (ORDER[k] === 'gate' && draft.path !== 'sect') continue;
      return ORDER[k];
    }
    return 'birth';
  }
  function optsFor() {
    if (step === 'sex') return [
      ['m', '是个男孩', '元阳之体。气血稍后微增。'],
      ['f', '是个女孩', '坤灵之体。神识稍后微增。'],
    ];
    if (step === 'grab') return [
      ['jade', '抓住古玉', '商贾世家。灵石与福缘。'],
      ['sword', '抓住断剑', '寒门将门。剑篇、气血、根骨。'],
      ['almanac', '抓住黄历', '书香算命。悟性与修习。'],
      ['air', '抓了一把空气', '道胎弃婴。身无分文，一项先天。'],
    ];
    if (step === 'six') return [
      ['book', '接过无字天书', '悟性。太虚宗只留一盏灯。'],
      ['pill', '讨要糖丸', '洗髓。根骨，浊气去一层。'],
      ['run', '吐舌跑开', '身法。性子偏向逍遥。'],
    ];
    if (step === 'ten') return [
      ['free', '买下放生', '灵狐报恩。心性偏仁。'],
      ['skin', '砸晕剥皮', '百年狐皮。心性偏狠。'],
      ['watch', '冷眼旁观', '神识。心性放在中间。'],
    ];
    if (step === 'root') return [
      ['fire', '走向火海', '火行亲和。'],
      ['water', '潜入寒潭', '水行，异根则落成冰。'],
      ['lei', '引天雷入体', Mingge.canLei(draft) ? '根骨够了。成与不成，此刻算定。' : '根骨不足，这一手按不下去。'],
    ];
    if (step === 'path') {
      const g = Mingge.guide(draft);
      return [
        ['sect', '升仙大会', '测灵入宗。' + (g === 'sect' ? '与你此前所行更近。' : '')],
        ['rogue', '满门祸起', '散修、悬赏、隐洞。' + (g === 'rogue' ? '与你此前所行更近。' : '')],
        ['dust', '红尘奇遇', '残宝，寿元见压。' + (g === 'dust' ? '与你此前所行更近。' : '')],
      ];
    }
    if (step === 'gate') {
      const face = Mingge.resolve(draft);
      if (face.lg.id === 'wei') return [['sx', '散修盟', '伪灵根。此路记为散人杂役。']];
      return [
        ['qm', '青冥宗', '剑修名门。'],
        ['dx', '丹霞谷', '丹道炉火。'],
        ['yy', '幽荧殿', '阴修。'],
        ['xj', '玄机楼', '阵器。'],
      ];
    }
    return [];
  }
  function bodyCopy() {
    if (step === 'birth') return [
      '大千世界，浮生若梦。天道执笔，落墨成命。',
      '一缕幽魂自混沌中醒来，前尘尽忘，唯余眼前一点微光。',
      '这一页不限时。看完再往下。',
    ];
    if (step === 'sex') return [
      '产房外风雨交加，屋内烛火猛地一跳。',
      '接生婆抱起包被，等你自己点头。先选，再确认。',
    ];
    if (step === 'grab') return [
      '转眼满周岁。红布上摆着寻常物事与奇珍。',
      '你伸出手。抓到的东西，要等你确认才落进命册。',
    ];
    if (step === 'six') return ['村口来了一位云游老道。他见你骨头清奇，递出两样东西，也容你跑开。'];
    if (step === 'ten') return ['大旱。山林里一只受伤的灵狐被猎户困住，正用哀求的眼神看着你。'];
    if (step === 'root') {
      const lines = ['盛夏雷雨夜，你高烧不退。梦里五色迷雾，四周元素狂涌。'];
      if (draft.lei) lines.push(draft.lei.ok ? '引雷已经算定：雷根醒了。返回不会重算。' : '引雷已经算定：雷未入体，只留暗伤。返回不会重算。');
      else if (!Mingge.canLei(draft)) lines.push('根骨还不够引雷。糖丸或断剑那一路，才按得下去。');
      else lines.push('根骨够了。选定引雷之后才算定，返回不重掷。');
      return lines;
    }
    if (step === 'path') return ['十六岁。纸页到了这里，凡人的日子要收束了。三条路都走得成，近的那条只是标给你看。'];
    if (step === 'gate') return ['青铜仙舟停在府城上空。测灵台前，你要投哪一座山。'];
    return ['命册已经写好。题上名字，再落印。印只盖一次。'];
  }
  function render() {
    const chap = $('#mg-chap');
    const body = $('#mg-body');
    const box = $('#mg-opts');
    const note = $('#mg-note');
    const back = $('#mg-back');
    const ok = $('#mg-ok');
    const book = $('#mg-book');
    const titles = { birth: '混沌', sex: '落地', grab: '周岁', six: '六岁', ten: '十岁', root: '十四岁', path: '十六岁', gate: '测灵', book: '命册' };
    chap.textContent = titles[step] || '';
    body.textContent = '';
    bodyCopy().forEach(line => body.appendChild(el('p', '', line)));
    box.textContent = '';
    book.hidden = step !== 'book';
    book.textContent = '';
    root.classList.toggle('is-birth', step === 'birth');
    root.classList.toggle('is-quiet', motionOff());
    if (step === 'book') {
      const sheet = Mingge.sheet(draft);
      book.appendChild(el('p', 'mg-verse', sheet.verse));
      sheet.lines.forEach(line => book.appendChild(el('p', 'mg-line', line)));
      const nameRow = el('label', 'mg-name');
      nameRow.appendChild(el('span', '', '题名'));
      const input = el('input');
      input.id = 'mg-name';
      input.maxLength = 6;
      input.autocomplete = 'off';
      input.value = draft.name || '';
      input.setAttribute('aria-label', '题名');
      nameRow.appendChild(input);
      const rand = el('button', 'mg-mini', '随缘');
      rand.type = 'button';
      rand.addEventListener('click', () => { input.value = Mingge.randName(); draft.name = input.value; });
      nameRow.appendChild(rand);
      book.appendChild(nameRow);
      const mateRow = el('div', 'mg-mate');
      mateRow.appendChild(el('span', '', '道侣'));
      [['f', '女'], ['m', '男'], ['any', '随缘']].forEach(pair => {
        const b = el('button', 'mg-mini' + (mate === pair[0] ? ' on' : ''), pair[1]);
        b.type = 'button';
        b.addEventListener('click', () => { mate = pair[0]; draft.mate = mate; render(); });
        mateRow.appendChild(b);
      });
      book.appendChild(mateRow);
      if (draft.gold) book.appendChild(el('p', 'mg-line', '先天词条已定：' + (Mingge.GOLD[draft.gold] || '') + '。返回不重抽。'));
      ok.textContent = '落印';
      ok.classList.add('mg-seal');
      ok.disabled = !!sealing;
    } else {
      ok.classList.remove('mg-seal');
      ok.textContent = step === 'birth' ? '继续' : '就这样';
      const options = optsFor();
      options.forEach(row => {
        const b = el('button', 'mg-opt' + (pending === row[0] ? ' on' : ''), '');
        b.type = 'button';
        b.appendChild(el('b', '', row[1]));
        b.appendChild(el('small', '', row[2]));
        const blocked = step === 'root' && row[0] === 'lei' && !Mingge.canLei(draft);
        if (blocked) b.classList.add('is-block');
        b.addEventListener('click', () => {
          if (blocked) {
            note.textContent = '根骨不足，引雷按不下去。';
            return;
          }
          pending = row[0];
          note.textContent = '已预选。确认之后才写入这一页。';
          render();
        });
        box.appendChild(b);
      });
      ok.disabled = step !== 'birth' && !pending;
    }
    back.hidden = false;
    back.textContent = step === 'birth' ? '作罢' : '返回';
    const cancelBtn = $('#mg-cancel');
    if (cancelBtn) cancelBtn.hidden = step === 'birth';
    note.textContent = note.textContent || (step === 'birth' ? '可跳过雨声和落墨。' : '');
    if (step === 'birth') startFx();
    else stopFx();
    if (step === 'birth') startRain();
    else stopRain();
    const sc = root.querySelector('.mg-sheet');
    if (sc) sc.scrollTop = 0;
    root.scrollTop = 0;
  }
  function commit() {
    if (sealing) return;
    if (step === 'book') { seal(); return; }
    if (step !== 'birth') {
      if (!pending) return;
      if (step === 'root' && pending === 'lei' && !Mingge.canLei(draft)) return;
      const field = fieldOf(step);
      draft[field] = pending;
      if (step === 'grab' && pending === 'air') Mingge.resolveGold(draft);
      if (step === 'root' && pending === 'lei') Mingge.resolveLei(draft);
      if (step === 'path' && pending !== 'sect') draft.org = '';
    }
    step = nextId(step);
    pending = draft[fieldOf(step)] || '';
    const note = $('#mg-note');
    if (note) note.textContent = '';
    render();
    const ok = $('#mg-ok');
    if (step === 'book') {
      const input = document.getElementById('mg-name');
      if (input) input.focus({ preventScroll: true });
    } else if (ok) ok.focus({ preventScroll: true });
  }
  function back() {
    if (sealing) return;
    if (step === 'birth') { cancel(); return; }
    step = prevId(step);
    pending = draft[fieldOf(step)] || '';
    const note = $('#mg-note');
    if (note) note.textContent = '';
    render();
  }
  function readName() {
    const input = document.getElementById('mg-name');
    let name = input ? String(input.value || '') : '';
    name = name.replace(/\s+/g, '').slice(0, 6);
    if (!name) name = Mingge.randName();
    draft.name = name;
    return name;
  }
  function seal() {
    if (sealing || !draft || draft._created) return;
    sealing = true;
    const ok = $('#mg-ok');
    if (ok) ok.disabled = true;
    root.classList.add('is-sealing');
    const wait = motionOff() ? 0 : 280;
    setTimeout(() => {
      try {
        const name = readName();
        draft.mate = mate || 'any';
        const packed = Mingge.pack(draft);
        window.__who = { sex: draft.sex, mate: draft.mate };
        window.__openingSex = draft.sex;
        const startLife = window.__moxian && window.__moxian.newGame;
        if (typeof startLife !== 'function') throw new Error('newGame');
        startLife(name, packed.roll, packed.choice, packed.origin);
        if (window.__minggeStats) window.__minggeStats.seals++;
        finish({ ok: true });
      } catch (err) {
        sealing = false;
        if (draft) draft._created = 0;
        if (ok) ok.disabled = false;
        root.classList.remove('is-sealing');
        const note = $('#mg-note');
        if (note) note.textContent = '落印未成，可再试。这一页不会重掷。';
        if (window.__minggeStats) window.__minggeStats.fails++;
        if (typeof console !== 'undefined') console.error(err);
      }
    }, wait);
  }
  function cancel() {
    if (sealing) return;
    if (window.__minggeStats) window.__minggeStats.cancels++;
    finish({ ok: false });
  }
  function finish(value) {
    const done = resolveOpen;
    cleanup(!!(value && value.ok));
    if (done) done(value);
  }
  function cleanup(ok) {
    stopFx();
    stopRain();
    if (onKey) { window.removeEventListener('keydown', onKey, true); onKey = null; }
    if (onVis) { document.removeEventListener('visibilitychange', onVis); onVis = null; }
    if (onHide) { window.removeEventListener('pagehide', onHide); onHide = null; }
    document.body.classList.remove('mingge-open');
    if (root && root.parentNode) root.parentNode.removeChild(root);
    root = null;
    sealing = false;
    opened = null;
    resolveOpen = null;
    if (!ok && typeof MoAudio !== 'undefined' && MoAudio.startAmbient) MoAudio.startAmbient('title');
    if (typeof Wallpaper !== 'undefined' && Wallpaper.kick) Wallpaper.kick(0);
  }
  function build() {
    root = el('div', 'mingge');
    root.id = 'mingge';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', '命格绘卷');
    const cv = el('canvas', 'mg-fx');
    cv.id = 'mg-fx';
    cv.setAttribute('aria-hidden', 'true');
    root.appendChild(cv);
    root.appendChild(el('div', 'mg-lamp'));
    const sheet = el('div', 'mg-sheet');
    const side = el('div', 'vcol mg-side');
    '命格绘卷'.split('').forEach(ch => side.appendChild(el('i', '', ch)));
    sheet.appendChild(side);
    const chap = el('p', 'mg-chap');
    chap.id = 'mg-chap';
    sheet.appendChild(chap);
    const body = el('div', 'mg-body');
    body.id = 'mg-body';
    sheet.appendChild(body);
    const opts = el('div', 'mg-opts');
    opts.id = 'mg-opts';
    sheet.appendChild(opts);
    const book = el('div', 'mg-book');
    book.id = 'mg-book';
    sheet.appendChild(book);
    const note = el('p', 'mg-note');
    note.id = 'mg-note';
    sheet.appendChild(note);
    const bar = el('div', 'mg-bar');
    const backBtn = el('button', 'mg-btn', '返回');
    backBtn.type = 'button';
    backBtn.id = 'mg-back';
    const skip = el('button', 'mg-btn', '跳过动态');
    skip.type = 'button';
    skip.id = 'mg-fast';
    const cancelBtn = el('button', 'mg-btn', '作罢');
    cancelBtn.type = 'button';
    cancelBtn.id = 'mg-cancel';
    const ok = el('button', 'mg-btn mg-ok', '继续');
    ok.type = 'button';
    ok.id = 'mg-ok';
    bar.appendChild(ok);
    bar.appendChild(backBtn);
    bar.appendChild(skip);
    bar.appendChild(cancelBtn);
    sheet.appendChild(bar);
    root.appendChild(sheet);
    document.body.appendChild(root);
    backBtn.addEventListener('click', back);
    cancelBtn.addEventListener('click', cancel);
    ok.addEventListener('click', commit);
    skip.addEventListener('click', () => {
      fast = !fast;
      skip.textContent = fast ? '动态已停' : '跳过动态';
      root.classList.toggle('is-quiet', motionOff());
      if (motionOff()) { stopFx(); stopRain(); }
      else if (step === 'birth') { startFx(); startRain(); }
    });
  }
  function open() {
    if (opened) return opened;
    if (typeof Mingge === 'undefined') return Promise.resolve({ ok: false, reason: 'missing' });
    draft = Mingge.emptyDraft(null, lean());
    step = 'birth';
    pending = '';
    mate = 'any';
    fast = motionOff();
    sealing = false;
    window.__minggeDraft = draft;
    window.__minggeStats = window.__minggeStats || { seals: 0, cancels: 0, fails: 0 };
    document.body.classList.add('mingge-open');
    if (typeof MoAudio !== 'undefined' && MoAudio.startAmbient) MoAudio.startAmbient('off');
    build();
    render();
    onKey = e => {
      if (!root) return;
      if (e.key === 'Escape') { e.preventDefault(); back(); }
      else if (e.key === 'Enter' && e.target && e.target.id === 'mg-name') { e.preventDefault(); commit(); }
    };
    onVis = () => {
      if (document.hidden) { stopFx(); stopRain(); }
      else if (step === 'birth' && !motionOff()) { startFx(); startRain(); }
    };
    onHide = () => { stopFx(); stopRain(); };
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', onHide);
    const ok = $('#mg-ok');
    if (ok) ok.focus({ preventScroll: true });
    opened = new Promise(resolve => { resolveOpen = resolve; });
    return opened;
  }
  return { open: open };
})();
if (typeof window !== 'undefined') window.__minggeUI = MinggeUI;
