/* 墨仙录 · 江湖界面：长卷地图、坊市、拍卖、丹炉、秘境 */
'use strict';
// 由 game.js 在其闭包内调用：G 提供界面工具与 S / busy 的存取
function makeJHUI(G) {
  const { $, sleep, pick, render, save, pushLog, openEvent, openSheet, closeSheet, toast, inkWrite, buffer, checkEnd, runDuel, realmStr, fmtNum, K, chanceWord, mountFoeSlip, choiceSub } = G;
  const J = Jianghu;
  const vtext = (t, cls = '') => `<span class="vt ${cls}"><span class="vcol">${[...t].map(c => `<i>${c}</i>`).join('')}</span></span>`;
  const dots = (n, max = 5) => Array.from({ length: max }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('');
  const dangerWord = n => ['太平', '小有风波', '时有凶险', '凶险', '险恶', '九死一生'][n];
  const aucWindow = () => G.S.auc && G.S.months >= G.S.auc.next && G.S.months <= G.S.auc.next + J.K.aucWin * REALMS[G.S.realm].T && !G.S.auc.done;
  const tagsHTML = tags => (tags || []).map(x => `<span class="${x.c || ''}">${x.t}</span>`).join('');

  /* ================= 长卷地图 ================= */
  const mapEl = $('#map');
  let sel = null, mapBusy = false, onScroll = null, drag = null;
  addEventListener('pointermove', e => {
    if (!drag) return; const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 4) { drag.moved = true; drag.sc.classList.add('dragging'); }
    if (drag.moved) drag.sc.scrollLeft = drag.l - dx;
  });
  addEventListener('pointerup', () => {
    if (!drag) return; const moved = drag.moved; drag.sc.classList.remove('dragging'); drag = null;
    // 拖动后松手不算点选地点
    if (moved) { const eat = ev => { ev.stopPropagation(); ev.preventDefault(); }; addEventListener('click', eat, { capture: true, once: true }); setTimeout(() => removeEventListener('click', eat, true), 0); }
  });
  async function openMap() {
    if (G.busy || !G.S || G.S.dead || G.S.ascended) return;
    G.busy = true;
    sel = G.S.loc;
    mapEl.innerHTML = `
      <div class="map-head">
        <div class="map-ttl"><b>江湖</b><span id="map-where"></span><span>淡墨为足迹，朱砂为此身</span></div>
        <button class="map-btn" id="map-rand"><span>随缘</span><small>信步而行</small></button>
        <button class="map-close" id="map-close" aria-label="收卷"><svg viewBox="0 0 100 100"><g filter="url(#f-seal)"><rect x="6" y="6" width="88" height="88" rx="8" fill="#b3302a"/><text x="50" y="67" text-anchor="middle" font-size="46" fill="#f3ead6" class="seal-font">收</text></g></svg></button>
      </div>
      <div class="map-scroll-wrap"><div class="map-roller l"></div>
        <div class="map-scroll" id="map-scroll"><div class="map-canvas" id="map-canvas">
          <img class="map-far" alt=""><img class="map-img" alt="">
          <svg class="map-road" viewBox="0 0 ${InkMap.MW} ${InkMap.MH}" preserveAspectRatio="none" aria-hidden="true"><path class="road-all" d=""/><path class="road-known" d=""/><path class="road-trail" d=""/><path class="road-go" d=""/></svg>
          <div class="map-marks"></div>
        </div></div>
        <div class="map-roller r"></div><div class="map-loading">研墨铺纸……</div></div>
      <div class="map-card" id="map-card"></div>`;
    mapEl.hidden = false; await sleep(20); mapEl.classList.add('open');
    if (typeof MoAudio !== 'undefined') {
      MoAudio.play('paper');
      MoAudio.startAmbient('map');
      MoAudio.setPlace(G.S.loc, Math.floor((G.S.months % 12) / 3));
    }
    $('#map-close').onclick = () => closeMap();
    $('#map-rand').onclick = () => wander();
    renderWhere();
    const art = await InkMap.paint();
    const cv = $('#map-canvas'), img = cv.querySelector('.map-img'), far = cv.querySelector('.map-far');
    await new Promise(r => { img.onload = r; img.onerror = r; img.src = art.url; far.src = art.farUrl; });
    mapEl.classList.add('ready');
    drawMarks(); renderCard();
    const sc = $('#map-scroll');
    // 远山视差：慢于近景
    onScroll = () => { far.style.transform = `translate3d(${(sc.scrollLeft * .3).toFixed(1)}px,0,0)`; };
    sc.addEventListener('scroll', onScroll, { passive: true });
    // 桌面：滚轮纵向转横向；鼠标按住拖动长卷（触屏仍走原生滚动）
    sc.addEventListener('wheel', e => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || e.ctrlKey) return;
      e.preventDefault(); sc.scrollLeft += e.deltaY * (e.deltaMode === 1 ? 32 : 1);
    }, { passive: false });
    sc.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.button !== 0) return; drag = { sc, x: e.clientX, l: sc.scrollLeft, moved: false }; });
    centerOn(G.S.loc, false);
    G.busy = false;
  }
  async function closeMap(keepBusy) {
    mapEl.classList.remove('open');
    if (typeof MoAudio !== 'undefined') {
      MoAudio.play('paper');
      MoAudio.startAmbient('main');
      MoAudio.setPlace(G.S.loc, Math.floor((G.S.months % 12) / 3));
    }
    await sleep(420);
    // 释放解码后的位图：移除 <img>，避免常驻 GPU 内存
    mapEl.querySelectorAll('img').forEach(i => { i.removeAttribute('src'); i.remove(); });
    mapEl.innerHTML = ''; mapEl.hidden = true; mapEl.classList.remove('ready');
    if (!keepBusy) G.busy = false;
  }
  function renderWhere() {
    const l = LOC[G.S.loc]; $('#map-where').textContent = `身在 · ${l.name}　${realmStr()}　${cn(G.S.age)}岁`;
  }
  const locXY = id => { const p = InkMap.pts().find(q => q.id === id); return [p.x * 100, p.y * 100, p.ly * 100]; };
  function drawMarks() {
    const box = mapEl.querySelector('.map-marks'); box.innerHTML = '';
    const idx = LOCS.map(l => !!G.S.found[l.id]); const last = idx.lastIndexOf(true);
    mapEl.querySelector('.road-all').setAttribute('d', InkMap.roadPath(0, LOCS.length - 1));
    mapEl.querySelector('.road-known').setAttribute('d', InkMap.roadPath(0, Math.max(1, last)));
    const walked = J.trailSegments(G.S);
    mapEl.querySelector('.road-trail').setAttribute('d', walked.map(i => InkMap.roadPath(i, i + 1)).join(' '));
    LOCS.forEach((l, i) => {
      const [x, y, ly] = locXY(l.id), found = !!G.S.found[l.id];
      if (!found) {
        const m = document.createElement('div'); m.className = 'map-fog'; m.style.left = x + '%'; m.style.top = '8%'; box.appendChild(m); return;
      }
      const tag = document.createElement('button'); tag.className = 'map-tag' + (l.id === sel ? ' sel' : '') + (G.S.realm < l.rm ? ' locked' : '');
      tag.dataset.id = l.id; tag.style.left = x + '%'; tag.style.top = ly + '%';
      const mjOpenHere = l.mj && J.mjOpen(G.S, l.mj), auc = l.market && aucWindow();
      tag.innerHTML = `<span class="tag-slip">${vtext(l.name)}</span><span class="tag-seal">${l.seal}</span>${mjOpenHere ? '<span class="tag-flag">秘境</span>' : ''}${auc ? '<span class="tag-flag gold">拍卖</span>' : ''}`;
      tag.onclick = () => { if (mapBusy) return; sel = l.id; box.querySelectorAll('.map-tag').forEach(t => t.classList.toggle('sel', t.dataset.id === sel)); if (typeof MoAudio !== 'undefined') MoAudio.setPlace(sel); renderCard(); centerOn(sel, true); };
      box.appendChild(tag);
      const pt = document.createElement('i'); pt.className = 'map-pt' + (walked.includes(i) || walked.includes(i - 1) ? ' walked' : ''); pt.style.left = x + '%'; pt.style.top = y + '%'; box.appendChild(pt);
    });
    const [mx, my] = locXY(G.S.loc);
    const mk = document.createElement('div'); mk.className = 'map-me'; mk.id = 'map-me'; mk.style.left = mx + '%'; mk.style.top = my + '%';
    mk.innerHTML = '<i class="me-halo"></i><i class="me-dot"></i>'; box.appendChild(mk);
  }
  // 键盘：左右键在已知地点间切换
  function mapKey(dir) {
    if (mapBusy || !mapEl.classList.contains('ready')) return;
    const tags = [...mapEl.querySelectorAll('.map-tag')]; if (!tags.length) return;
    const i = tags.findIndex(t => t.dataset.id === sel), n = tags[Math.min(tags.length - 1, Math.max(0, (i < 0 ? 0 : i) + dir))];
    if (n && n.dataset.id !== sel) n.click();
  }
  function centerOn(id, smooth) {
    const sc = $('#map-scroll'), cv = $('#map-canvas'); if (!sc || !cv) return;
    const x = locXY(id)[0] / 100 * cv.offsetWidth - sc.clientWidth / 2;
    sc.scrollTo({ left: Math.max(0, x), behavior: smooth && !FX.reduced() ? 'smooth' : 'auto' });
  }
  function renderCard() {
    const l = LOC[sel], here = sel === G.S.loc, ok = J.canGo(G.S, sel), card = $('#map-card');
    const m = J.travelMonths(G.S, sel);
    const ids = [l.mj, l.mj2].filter(id => id && typeof MIJING !== 'undefined' && MIJING[id]);
    const open = ids.filter(id => J.mjOpen(G.S, id));
    const btns = [];
    if (here) btns.push(['explore', '就地游历', `${cnDur(m)}`]);
    else btns.push(['go', ok ? '前往' : `需${REALMS[l.rm].name}`, ok ? `路程${cnDur(m)}` : '修为未到', !ok]);
    if (l.market) btns.push(['market', here ? '入坊市' : '赴坊市', aucWindow() ? '今有拍卖' : '买卖丹草', !ok]);
    open.forEach((id, i) => btns.push([i ? 'mj2' : 'mj', i ? '再探一处' : '入秘境', MIJING[id].name, !ok, id]));
    if (!open.length && ids.some(id => G.S.realm >= MIJING[id].rm)) btns.push(['mjx', '秘境未启', '静候天时', true]);
    card.innerHTML = `<div class="mc-head"><span class="mc-seal">${l.seal}</span><div class="mc-name">${l.name}${here ? '<em>此间</em>' : ''}</div>
        <div class="mc-danger" title="凶险"><span class="dots">${dots(l.danger)}</span><small>${dangerWord(l.danger)}</small></div></div>
      <p class="mc-desc"></p>
      <div class="mc-meta">${l.herbs.length ? `<span>物产 · ${l.herbs.join('、')}</span>` : '<span>物产 · 百货云集</span>'}${G.S.realm < l.rm ? `<span class="zhu">需${REALMS[l.rm].name}方可涉足</span>` : ''}</div>
      <div class="mc-btns">${btns.map(b => `<button class="mc-btn${b[3] ? '' : ' on'}" data-a="${b[0]}" data-mj="${b[4] || ''}" ${b[3] ? 'disabled' : ''}><b>${b[1]}</b><small>${b[2]}</small></button>`).join('')}</div>`;
    card.querySelector('.mc-desc').textContent = l.desc;
    card.classList.remove('bleed-in'); void card.offsetWidth; card.classList.add('bleed-in');
    card.querySelectorAll('.mc-btn').forEach(b => b.onclick = () => cardAct(b.dataset.a, b.dataset.mj));
  }
  async function cardAct(a, mjId) {
    if (mapBusy) return; const to = sel;
    if (a === 'explore') return goEvent(to, true);
    if (a === 'go') return goEvent(to, false);
    if (a === 'market') { const tr = to !== G.S.loc ? await travelAnim(to) : null; await closeMap(); if (tr) logTravel(tr); if (G.S.dead) return afterDeath(); return openMarket(); }
    if (a === 'mj' || a === 'mj2') { const id = mjId || LOC[to].mj; const tr = to !== G.S.loc ? await travelAnim(to) : null; await closeMap(); if (tr) logTravel(tr); if (G.S.dead) return afterDeath(); return enterMj(id); }
  }
  const afterDeath = () => { render(); save(); checkEnd(); };
  function logTravel(tr) {
    const l = LOC[G.S.loc];
    pushLog({ title: `行旅 · ${l.name}`, text: `${tr.from && tr.from !== G.S.loc ? `自${LOC[tr.from].name}起行，` : ''}${pick(['晓行夜宿', '风餐露宿', '一路无话', '翻山渡水'])}，${cnDur(tr.months)}后，到了${l.name}。`, tags: tr.tags, cls: 'sys' });
  }
  // 行旅：沿路描一笔朱墨，印记随之移动
  async function travelAnim(to) {
    mapBusy = true;
    const from = G.S.loc, a = LOCS.findIndex(l => l.id === from), b = LOCS.findIndex(l => l.id === to);
    const go = mapEl.querySelector('.road-go'), me = $('#map-me');
    const d = InkMap.roadPath(a, b); go.setAttribute('d', d);
    const len = go.getTotalLength(), rev = b < a, dur = FX.reduced() ? 10 : Math.min(1800, 700 + len * 1.1);
    const sc = $('#map-scroll'), cv = $('#map-canvas');
    const t0 = performance.now();
    await new Promise(res => {
      const step = now => {
        const t = Math.min(1, (now - t0) / dur), e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const drawn = len * e, at = rev ? len - drawn : drawn;
        // 正向自头描起；逆向自尾描起
        go.style.strokeDasharray = rev ? `0 ${(len - drawn).toFixed(1)} ${drawn.toFixed(1)} ${len.toFixed(1)}` : `${drawn.toFixed(1)} ${len.toFixed(1)}`;
        const p = go.getPointAtLength(at);
        me.style.left = (p.x / InkMap.MW * 100) + '%'; me.style.top = (p.y / InkMap.MH * 100) + '%';
        sc.scrollLeft = Math.max(0, p.x / InkMap.MW * cv.offsetWidth - sc.clientWidth / 2);
        if (t < 1) requestAnimationFrame(step); else res();
      };
      requestAnimationFrame(step);
    });
    const tr = J.travel(G.S, to, pushLog); tr.from = from;
    if (Core.fabaoFeed) Core.fabaoFeed(G.S, 2);
    if (typeof MoAudio !== 'undefined') MoAudio.setPlace(G.S.loc, Math.floor((G.S.months % 12) / 3));
    render(); save(); renderWhere();
    await sleep(FX.reduced() ? 0 : 380);
    mapBusy = false;
    return tr;
  }
  async function goEvent(to, local) {
    let tr = null; const gt = [];
    if (!local) tr = await travelAnim(to);
    else { Core.passTime(G.S, J.travelMonths(G.S, to), pushLog); if (!G.S.dead) J.gather(G.S, to, gt); }
    if (G.S.dead) { await closeMap(); return afterDeath(); }
    const ev = J.pickAt(G.S, to); render(); save();
    await closeMap(true);
    if (tr) logTravel(tr);
    else if (gt.length) pushLog({ text: `你在${LOC[to].name}左近盘桓，顺手采了些灵草。`, tags: gt, cls: 'sys' });
    if (typeof Life !== 'undefined') {
      const v = Life.takeVignette(G.S, 'road');
      if (v) pushLog({ title: v.title, text: v.text, cls: 'breath' });
    }
    G.busy = false; openEvent(ev);
  }
  async function wander() {
    if (mapBusy) return;
    Core.passTime(G.S, Math.max(1, Math.round(REALMS[G.S.realm].T * K.youliMonths / (Core.pathYouliMul ? Core.pathYouliMul(G.S) : 1))), pushLog);
    if (G.S.dead) { await closeMap(); return afterDeath(); }
    const ev = J.pickAt(G.S, null); render(); save();
    await closeMap(true);
    if (typeof Life !== 'undefined') {
      const v = Life.takeVignette(G.S, 'road');
      if (v) pushLog({ title: v.title, text: v.text, cls: 'breath' });
    }
    G.busy = false; openEvent(ev);
  }

  /* ================= 坊市 ================= */
  function openMarket(tab = 'buy') {
    J.mktRefresh(G.S); save();
    const wrap = document.createElement('div'); wrap.className = 'bag-wrap mkt-wrap';
    const tabs = [['buy', '购'], ['sell', '售']].concat(aucWindow() ? [['auc', '拍卖']] : []);
    wrap.innerHTML = `<div class="sheet-tabs">${tabs.map((t, i) => `${i ? '<i class="stab-dot"></i>' : ''}<button class="stab" data-t="${t[0]}">${t[1]}</button>`).join('')}</div>
      <div class="mkt-bar"><p class="mkt-bark"></p><span class="mkt-ls">灵石 <b></b></span></div><div class="tab-body"></div>`;
    wrap.querySelector('.mkt-bark').textContent = pick(MARKET_BARK);
    const body = wrap.querySelector('.tab-body');
    const show = t => {
      wrap.querySelectorAll('.stab').forEach(b => b.classList.toggle('on', b.dataset.t === t));
      wrap.querySelector('.mkt-ls b').textContent = fmtNum(G.S.ls);
      body.innerHTML = ''; body.appendChild({ buy: buyPage, sell: sellPage, auc: aucPage }[t](() => show(t)));
      body.classList.remove('tab-in'); void body.offsetWidth; body.classList.add('tab-in');
    };
    wrap.querySelector('.sheet-tabs').onclick = e => { const b = e.target.closest('.stab'); if (b) show(b.dataset.t); };
    openSheet('云岳坊', wrap); show(tabs.find(t => t[0] === tab) ? tab : 'buy');
  }
  const itemDesc = k => k === 'SCROLL' ? '瞎眼说书人兜售的功法残卷。真假难辨，全凭眼力与运气。' : k.startsWith('R:') ? `${RECIPES[k.slice(2)].name}的丹方。需${Object.entries(RECIPES[k.slice(2)].need).map(([h, n]) => h + cn(n)).join('、')}。` : (typeof GEAR !== 'undefined' && GEAR[k] ? GEAR[k].desc : (typeof Core !== 'undefined' && Core.itemEffect ? Core.itemEffect(G.S, k) : (PILLS[k] && PILLS[k].desc) || ''));
  const itemName = k => k === 'SCROLL' ? '功法残卷' : k.startsWith('R:') ? RECIPES[k.slice(2)].name + '方' : k;
  function trend(k) { const f = G.S.mkt.f[k] || 1; return f >= 1.15 ? '<i class="tr up">贵</i>' : f <= .85 ? '<i class="tr dn">贱</i>' : ''; }
  const stackable = k => k !== 'SCROLL' && String(k).indexOf('R:') !== 0 && !(typeof GEAR !== 'undefined' && GEAR[k]) && (G.S.mkt.st[k] | 0) > 1;
  const dearBuy = (k, n, p) => {
    const gate = Math.max(30, Math.round(28 * REALMS[G.S.realm].lsScale));
    return n > 1 || p >= gate || p * n >= Math.max(gate, Math.floor(G.S.ls * 0.5));
  };
  function buyPage(refresh) {
    const w = document.createElement('div'); w.className = 'mkt-list';
    const keys = Object.keys(G.S.mkt.st).filter(k => G.S.mkt.st[k] > 0);
    if (!keys.length) w.innerHTML = '<div class="empty">货架已空，改日再来</div>';
    keys.forEach(k => {
      const p0 = J.price(G.S, k), row = document.createElement('div'); row.className = 'item mkt-row';
      const stack = stackable(k);
      const maxN = Math.max(1, Math.min(9, G.S.mkt.st[k] | 0, Math.floor(G.S.ls / Math.max(1, p0))));
      row._n = 1;
      row.innerHTML = `<div class="item-info"><div class="item-name">${itemName(k)}<em>余${cn(G.S.mkt.st[k])}</em>${trend(k)}</div><div class="item-desc"></div></div>
        <div class="mkt-buy">${stack ? `<div class="qty"><button type="button" class="qty-btn" data-q="-1" aria-label="少一件">−</button><b class="qty-n">一</b><button type="button" class="qty-btn" data-q="1" aria-label="多一件">+</button></div>` : ''}
        <button class="item-use price" ${G.S.ls < p0 ? 'disabled' : ''}><b>${fmtNum(p0)}</b><small>灵石</small></button></div>`;
      row.querySelector('.item-desc').textContent = itemDesc(k);
      const btn = row.querySelector('.item-use');
      const paintQty = () => {
        const n = row._n;
        const cost = p0 * n;
        const b = btn.querySelector('b'); if (b) b.textContent = fmtNum(cost);
        const qn = row.querySelector('.qty-n'); if (qn) qn.textContent = cn(n);
        btn.disabled = G.S.ls < cost;
        btn.dataset.arm = '';
        const sm = btn.querySelector('small'); if (sm) sm.textContent = '灵石';
      };
      row.querySelectorAll('.qty-btn').forEach(qb => {
        qb.onclick = () => {
          const dir = qb.dataset.q === '1' ? 1 : -1;
          const cap = Math.max(1, Math.min(9, G.S.mkt.st[k] | 0, Math.floor(G.S.ls / Math.max(1, p0)) || 1));
          row._n = Math.max(1, Math.min(cap, (row._n | 0) + dir));
          paintQty();
        };
      });
      btn.onclick = () => {
        const n = row._n | 0 || 1;
        const p = J.price(G.S, k);
        if (G.S.ls < p * n) return toast('灵石不足');
        if (dearBuy(k, n, p) && btn.dataset.arm !== '1') {
          btn.dataset.arm = '1';
          const sm = btn.querySelector('small'); if (sm) sm.textContent = '确认';
          return;
        }
        const r = J.buy(G.S, k, n); if (!r) return toast('灵石不足');
        const got = itemName(k) + ((r.n | 0) > 1 ? '×' + cn(r.n) : '');
        if (r.text) pushLog({ title: '坊市', text: r.text, tags: r.tags, cls: 'event', div: true });
        else pushLog({ text: `你在云岳坊购得${got}。`, tags: r.tags, cls: 'sys' });
        render(); save(); toast(r.fake ? '上当了' : `得${got}`); refresh();
      };
      w.appendChild(row);
    });
    const f = document.createElement('div'); f.className = 'sect-note center'; f.textContent = `坊中货色，约${cn(Math.max(1, Math.round(J.K.mktEvery * REALMS[G.S.realm].T / 12)))}年一换；价随行情起落`; w.appendChild(f);
    return w;
  }
  function sellPage(refresh) {
    const w = document.createElement('div'); w.className = 'mkt-list';
    const keys = Object.keys(G.S.items).filter(k => G.S.items[k] > 0 && ITEM_VAL[k]);
    if (!keys.length) w.innerHTML = '<div class="empty">囊中无可售之物</div>';
    keys.forEach(k => {
      const p = J.sellPrice(G.S, k), row = document.createElement('div'); row.className = 'item mkt-row';
      row.innerHTML = `<div class="item-info"><div class="item-name">${k}<em>×${G.S.items[k]}</em>${trend(k)}</div><div class="item-desc"></div></div>
        <button class="item-use price"><b>${fmtNum(p)}</b><small>售出</small></button>`;
      row.querySelector('.item-desc').textContent = (typeof Core !== 'undefined' && Core.itemEffect) ? Core.itemEffect(G.S, k) : ((PILLS[k] && PILLS[k].desc) || '');
      row.querySelector('button').onclick = () => { const r = J.sell(G.S, k); if (!r) return; pushLog({ text: `你将一份${k}卖与坊中商户。`, tags: r.tags, cls: 'sys' }); render(); save(); refresh(); };
      w.appendChild(row);
    });
    return w;
  }
  function aucPage() {
    const w = document.createElement('div'); w.className = 'auc-banner';
    const held = G.S.auc && G.S.auc.hold;
    const rows = (J.consignList ? J.consignList(G.S) : []).map(r => `<button type="button" class="shop-row" data-k="${String(r.k).replace(/"/g, '')}">寄拍 ${r.name}<small>落槌随席</small></button>`).join('');
    w.innerHTML = `<div class="ab-lamps"><i></i><i></i><i></i></div><div class="ab-ttl">听雨楼 · 今夜拍卖</div>
      <p>楼上挂出红灯。席上的宝物待价而沽。你若有余货，也可寄一件上去，价由席上的人争，楼里抽一成二。</p>
      ${held ? `<p class="shop-note">已寄：${held.name}。登楼后随席落槌。</p>` : `<div class="shop-col"><b>寄拍</b>${rows || '<p class="sd-empty">囊中暂无可寄之物</p>'}</div>`}
      <button class="brush-btn small ab-go"><span class="bb-ink"></span><span class="bb-text">登楼</span></button>`;
    w.querySelectorAll('[data-k]').forEach(b => {
      b.onclick = () => {
        const r = J.consign(G.S, b.dataset.k);
        if (!r || r.err) return toast(r && r.err || '不能寄');
        pushLog({ title: '寄拍', text: `你把${r.name}交给听雨楼。估价随席，落槌之前谁也不说死。`, cls: 'sys' });
        save(); render();
        const n = aucPage(); w.replaceWith(n);
      };
    });
    w.querySelector('.ab-go').onclick = async () => { await closeSheet(); startAuction(); };
    return w;
  }

  /* ================= 拍卖会 ================= */
  const aucEl = $('#auc');
  async function startAuction() {
    if (!aucWindow()) return toast('拍卖已散');
    G.busy = true;
    const a = J.aucNew(G.S); save();
    aucEl.innerHTML = `<div class="auc-shade"></div><div class="auc-lamps"><i></i><i></i><i></i><i></i></div>
      <div class="auc-head"><span>听雨楼</span><em id="auc-no"></em></div>
      <div class="auc-lot"><div class="auc-name" id="auc-name"></div><p class="auc-desc" id="auc-desc"></p></div>
      <div class="auc-price"><small>现价</small><b id="auc-price"></b><span>灵石</span><em id="auc-lead"></em></div>
      <div class="auc-lines" id="auc-lines"></div>
      <div class="auc-me">囊中 <b id="auc-ls"></b> 灵石</div>
      <nav class="auc-btns" id="auc-btns"></nav>
      <div class="auc-stamp" id="auc-stamp"><svg viewBox="0 0 100 100"><g filter="url(#f-seal)"><rect x="5" y="5" width="90" height="90" rx="8" fill="#b3302a"/><text x="50" y="70" text-anchor="middle" font-size="56" fill="#f3ead6" class="seal-font" id="auc-stamp-t">得</text></g></svg></div>`;
    aucEl.hidden = false; await sleep(20); aucEl.classList.add('open');
    if (typeof MoAudio !== 'undefined') MoAudio.startAmbient('auction');
    const allTags = [], got = [], sold = [];
    addLine({ t: pick(AUC_OPEN) }, true); await sleep(1200);
    let l;
    while ((l = J.aucLot(G.S, a))) {
      const won = await runLot(a, l);
      if (won && won.consign) { allTags.push(...(won.tags || [])); if (won.sold) sold.push(l.name || J.lotName(l)); }
      else if (won) { allTags.push(...won.tags); got.push(J.lotName(l)); }
      await sleep(300);
    }
    aucEl.classList.remove('open'); await sleep(500); aucEl.hidden = true; aucEl.innerHTML = '';
    if (typeof MoAudio !== 'undefined') MoAudio.startAmbient('main');
    G.busy = false;
    const bits = [];
    if (got.length) bits.push(`你拍得${got.join('、')}`);
    if (sold.length) bits.push(`你寄出的${sold.join('、')}也落了槌`);
    pushLog({ title: '听雨楼拍卖', text: bits.length ? `${bits.join('。')}。下楼时，夜风里还飘着檀香。` : '今夜各有所归，你两手空空地下了楼。有些东西，原本就不是灵石能争来的。', tags: allTags, cls: (got.length || sold.length) ? 'gold' : 'event', div: true });
    render(); save(); checkEnd();
    if (G.S.flags.heiGrudge === 1 && !G.S.dead) setTimeout(() => openEvent(EVENTS.find(e => e.id === 'hei_ambush')), 900);
  }
  function addLine(x, sys) {
    const box = $('#auc-lines'); const p = document.createElement('p'); p.className = 'al' + (sys ? ' sys' : '') + (x.who === 'you' ? ' me' : '');
    const who = x.who ? (x.who === 'you' ? '你' : BIDDERS[x.who].name) : '';
    p.innerHTML = who ? `<b></b><span></span>` : '<span></span>';
    if (who) p.firstChild.textContent = who;
    box.appendChild(p); inkWrite(p.lastChild, x.t, { immediate: true, step: 16 });
    while (box.children.length > 4) box.firstChild.remove();
  }
  function runLot(a, l) {
    return new Promise(async resolve => {
      $('#auc-no').textContent = `第${cn(a.i + 1)}件 · 共${cn(a.lots.length)}件`;
      $('#auc-name').textContent = J.lotName(l);
      $('#auc-desc').textContent = l.frag ? '一页泛黄的天品功法残页，字迹如刀刻。据说集齐三页，便可悟出整部功法。' : itemDesc(l.k);
      $('#auc-stamp').className = 'auc-stamp';
      aucEl.querySelector('.auc-lot').classList.remove('bleed-in'); void aucEl.offsetWidth; aucEl.querySelector('.auc-lot').classList.add('bleed-in');
      const upd = () => { $('#auc-price').textContent = fmtNum(a.price); $('#auc-lead').textContent = a.leader ? (a.leader === 'you' ? '你领先' : `${BIDDERS[a.leader].name}领先`) : '尚无人应价'; $('#auc-ls').textContent = fmtNum(G.S.ls); };
      upd(); a.lines.forEach(x => addLine(x));
      const btns = $('#auc-btns');
      if (l.consign && J.aucPlayConsign) {
        btns.innerHTML = '';
        const r = J.aucPlayConsign(G.S, a);
        (r.lines || []).forEach(x => addLine(x));
        upd();
        return finish(r.sold ? r : null, { t: r.line || '落槌。' });
      }
      const finish = async (won, line) => {
        btns.innerHTML = '';
        if (line) addLine(line);
        if (typeof MoAudio !== 'undefined') MoAudio.play('gavel');
        $('#auc-stamp-t').textContent = won ? '得' : '落'; await sleep(300); $('#auc-stamp').classList.add('on', won ? 'won' : 'lost');
        await sleep(900);
        btns.innerHTML = `<button class="brush-btn small light" id="auc-next"><span class="bb-ink"></span><span class="bb-text">${a.i < a.lots.length - 1 ? '下一件' : '散场'}</span></button>`;
        $('#auc-next').onclick = () => resolve(won);
      };
      const draw = () => {
        const p1 = Math.max(a.price + 1, Math.round(a.price * 1.1)), p3 = Math.max(a.price + 1, Math.round(a.price * 1.3));
        const poor = p1 > G.S.ls;
        const leading = a.leader === 'you';
        btns.innerHTML = `<button class="ab" data-k=".1" ${poor ? 'disabled' : ''}><b>加一成</b><small>${fmtNum(p1)}</small></button>
          <button class="ab" data-k=".3" ${p3 > G.S.ls ? 'disabled' : ''}><b>加三成</b><small>${fmtNum(p3)}</small></button>
          <button class="ab pass" data-k="0"><b>${leading ? '成交' : '罢手'}</b><small>${leading ? '落槌' : (poor ? '囊中不足' : '不争')}</small></button>`
          + (poor && !leading ? '<p class="auc-hint">囊中羞涩，可罢手离场。不必硬争。</p>' : '');
        btns.onclick = async e => {
          const b = e.target.closest('.ab'); if (!b || b.disabled || btns.classList.contains('wait')) return;
          btns.classList.add('wait');
          const k = +b.dataset.k;
          if (!k) {
            btns.classList.remove('wait'); btns.onclick = null;
            const r = J.aucPass(G.S, a);
            if (r.won) return finish(r.won, { who: 'you', t: r.line || '落槌。' });
            return finish(null, { who: r.winner, t: r.line });
          }
          const bid = Math.max(a.price + 1, Math.round(a.price * (1 + k)));
          if (typeof MoAudio !== 'undefined') MoAudio.play('gavel');
          addLine({ who: 'you', t: bid < 10000 ? `${cn(bid)}。` : `${fmtNum(bid)}灵石。` });
          const r = J.aucRaise(G.S, a, k); await sleep(700);
          a.lines.forEach(x => addLine(x)); upd(); btns.classList.remove('wait');
          if (r.err) { toast(r.err); return draw(); }
          if (r.won) { btns.onclick = null; upd(); $('#auc-price').textContent = fmtNum(a.price); return finish(r, null); }
          draw();
        };
      };
      draw();
    });
  }

  /* ================= 丹炉 ================= */
  function danPage() {
    const w = document.createElement('div'); w.className = 'dan-page';
    const d = G.S.dan, need = J.danNeed(d.lv);
    w.innerHTML = `<div class="dan-head"><div class="dan-ding"></div><div class="dan-info"><div class="dan-lv">丹道 <b>${cn(d.lv)}重</b></div>
      <div class="dan-xp"><i style="width:${Math.min(100, d.xp / need * 100).toFixed(0)}%"></i></div><small>已开炉${cn(d.n)}次${G.S.lgEls.includes('火') ? ' · 火灵根，控火更稳' : ''}</small></div></div>`;
    w.querySelector('.dan-ding').appendChild(dingImg('ding-ico'));
    const ids = Object.keys(RECIPES);
    ids.sort((a, b) => (d.rec.includes(b) - d.rec.includes(a)) || RECIPES[a].diff - RECIPES[b].diff).forEach(id => {
      const r = RECIPES[id], known = d.rec.includes(id), row = document.createElement('div');
      row.className = 'item dan-row' + (known ? '' : ' unknown');
      if (!known) { row.innerHTML = `<div class="item-info"><div class="item-name">${r.name}方<em>未得</em></div><div class="item-desc">得自 · ${RECIPE_SRC[id] || '机缘'}</div></div>`; w.appendChild(row); return; }
      const p = J.danChance(G.S, id), ok = J.hasHerbs(G.S, id);
      row.innerHTML = `<div class="item-info"><div class="item-name">${r.name}<em>${chanceWord(p)}</em></div>
        <div class="dan-need">${Object.entries(r.need).map(([h, n]) => `<span class="${(G.S.items[h] || 0) >= n ? 'ok' : 'no'}">${h} ${cn(G.S.items[h] || 0)}/${cn(n)}</span>`).join('')}<span class="t">耗时${cnDur(J.danMonths(G.S, id))}</span></div>
        <div class="item-desc">${(PILLS[r.out] && PILLS[r.out].desc) || ''}</div></div>
        <button class="item-use" ${ok ? '' : 'disabled'}>开炉</button>`;
      row.querySelector('button').onclick = async () => { await closeSheet(); runFurnace(id); };
      w.appendChild(row);
    });
    return w;
  }
  // 丹炉小像：与炉火场景同一幅水墨鼎
  function dingImg(cls) { const im = new Image(); im.className = cls; im.alt = ''; im.decoding = 'async'; Ding.url().then(u => { im.src = u; }); return im; }
  const danEl = $('#dan');
  async function runFurnace(id) {
    G.busy = true;
    const r = RECIPES[id];
    danEl.innerHTML = `<div class="dan-shade"></div>
      <div class="dan-head2"><span>开炉</span><em>${cnDur(J.danMonths(G.S, id))}</em></div>
      <div class="dan-stage" id="dan-stage"><div class="dan-stamp" id="dan-stamp"><svg viewBox="0 0 100 100"><g filter="url(#f-seal)"><rect x="5" y="5" width="90" height="90" rx="8" fill="#b3302a"/><text x="50" y="70" text-anchor="middle" font-size="56" fill="#f3ead6" class="seal-font" id="dan-stamp-t">成</text></g></svg></div></div>

      <div class="dan-name">${r.name}</div><p class="dan-text" id="dan-text"></p><div class="entry-tags dan-tags" id="dan-tags"></div>
      <button class="brush-btn small dan-close" id="dan-close" hidden><span class="bb-ink"></span><span class="bb-text">收丹</span></button>`;
    danEl.className = 'dan'; danEl.hidden = false;
    const stage = $('#dan-stage');
    const ctl = typeof InkGL !== 'undefined' && InkGL.furnace ? InkGL.furnace(stage, { size: .64 }) : null;
    if (!ctl) stage.appendChild(dingImg('dan-ding-img'));
    danEl.classList.toggle('nogl', !ctl);
    G.furnace = ctl;
    await sleep(20); danEl.classList.add('open', 'fire');
    if (typeof MoAudio !== 'undefined') MoAudio.startAmbient('dan');
    inkWrite($('#dan-text'), pick(['文火温养，药香初起……', '炉火渐旺，药气在鼎中翻涌……', '引火入炉，凝神看着火候……']), { immediate: true, step: 40 });
    const B = buffer(); const res = J.craft(G.S, id, B.emit); save();
    await sleep(FX.reduced() ? 300 : 2600);
    const kind = res.ok ? (res.q >= 2 ? 'gold' : 'ok') : res.boom ? 'boom' : 'waste';
    danEl.classList.remove('fire'); danEl.classList.add(kind);
    if (ctl) ctl.set(kind);
    if (typeof MoAudio !== 'undefined') {
      if (res.boom) MoAudio.play('boom');
      else if (res.ok) { MoAudio.play(res.q >= 2 ? 'gold' : 'splash'); }
      else MoAudio.play('fail');
    }
    if (res.boom && navigator.vibrate) try { navigator.vibrate([20, 40, 30]); } catch (e) {}
    $('#dan-text').textContent = '';
    await sleep(res.boom ? 900 : res.ok ? 1100 : 700);
    $('#dan-stamp-t').textContent = res.ok ? (res.q >= 2 ? DAN_Q[res.q].slice(0, 1) : '成') : res.boom ? '炸' : '废';
    if (typeof MoAudio !== 'undefined') MoAudio.play('stamp');
    $('#dan-stamp').classList.add('on');
    const t = inkWrite($('#dan-text'), res.text, { immediate: true, step: 18 });
    await sleep(Math.min(t, 1600) + 300);
    $('#dan-tags').innerHTML = tagsHTML(res.tags); $('#dan-tags').classList.add('bleed-in');
    const c = $('#dan-close'); c.hidden = false; c.classList.add('bleed-in');
    c.querySelector('.bb-text').textContent = res.ok ? '收丹' : '收拾';
    c.onclick = async () => {
      c.onclick = null;
      danEl.classList.remove('open'); await sleep(500);
      if (ctl) ctl.stop(); G.furnace = null;
      danEl.hidden = true; danEl.innerHTML = ''; danEl.className = 'dan';
      if (typeof MoAudio !== 'undefined') MoAudio.startAmbient('main');
      G.busy = false;
      pushLog({ title: `开炉 · ${r.name}`, text: res.text, tags: res.tags, cls: res.ok && res.q >= 2 ? 'gold' : 'event', div: true }); B.flush();
      render(); save(); checkEnd();
    };
  }

  /* ================= 秘境 ================= */
  const mjEl = $('#mj');
  async function enterMj(id) {
    if (!J.mjOpen(G.S, id)) return toast('秘境已闭');
    J.mjEnter(G.S, id); save();
    pushLog({ title: `入 · ${MIJING[id].name}`, text: MJ_INTRO, cls: 'event', div: true });
    showMj(true);
  }
  async function showMj(fresh) {
    G.busy = true;
    const d = G.S.dive, m = MIJING[d.id];
    mjEl.style.setProperty('--tint', MJ_TINT[m.tint] || '#4a4a44');
    mjEl.innerHTML = `<div class="mj-wash"></div>
      <div class="mj-head"><span class="mj-seal">${m.seal}</span><div class="mj-ttl"><b>${m.name}</b><small id="mj-depth"></small></div>
        <button class="mj-out" id="mj-out">退出</button></div>
      <div class="mj-chain" id="mj-chain"></div>
      <div class="mj-bars"><div class="mjb hp"><span>元气</span><div class="mjb-t"><i id="mj-hp"></i></div><b id="mj-hpn"></b></div>
        <div class="mjb ling"><span>灵力</span><div class="mjb-t"><i id="mj-ling"></i></div><b id="mj-lingn"></b></div></div>
      <div class="mj-body" id="mj-body"></div>
      <div class="mj-loot" id="mj-loot"></div>`;
    mjEl.hidden = false; await sleep(20); mjEl.classList.add('open');
    $('#mj-out').onclick = () => leaveMj('retreat');
    mjNodeView();
  }
  function mjBars() {
    const d = G.S.dive, m = MIJING[d.id];
    $('#mj-hp').style.width = d.hp + '%'; $('#mj-ling').style.width = d.ling + '%';
    $('#mj-hpn').textContent = cn(d.hp); $('#mj-lingn').textContent = cn(d.ling);
    $('#mj-hp').parentElement.parentElement.classList.toggle('low', d.hp < 40);
    $('#mj-chain').innerHTML = m.nodes.map((n, i) => `<i class="${i < d.node ? 'past' : i === d.node ? 'cur' : ''}${n.boss ? ' boss' : ''}"><em>${n.boss ? '主' : cn(i + 1)}</em></i>`).join('<b></b>');
    $('#mj-depth').textContent = `第${cn(d.node + 1)}重 · 共${cn(m.nodes.length)}重`;
    const L = d.loot, parts = [];
    if (L.ls) parts.push(`灵石${fmtNum(Math.round(L.ls * REALMS[G.S.realm].lsScale))}`);
    if (L.xw) parts.push('修为若干');
    for (const [k, n] of Object.entries(L.item || {})) parts.push(`${k}×${n}`);
    if (L.recipe) parts.push(RECIPES[L.recipe].name + '方'); if (L.frag) parts.push('天品残页');
    $('#mj-loot').innerHTML = `<span>囊中所得</span>${parts.length ? parts.join(' · ') : '尚无'}`;
  }
  function mjNodeView() {
    const d = G.S.dive, nd = J.mjNode(G.S), body = $('#mj-body'); mjBars();
    $('#mj-out').disabled = false;
    body.innerHTML = `<div class="mj-node"><h3 class="mj-nt">${vtext(nd.t)}</h3><div class="mj-main"><div class="mj-text" id="mj-text"></div><div class="ev-choices" id="mj-choices"></div><div class="mj-result" id="mj-result"></div></div></div>`;
    body.classList.remove('tab-in'); void body.offsetWidth; body.classList.add('tab-in');
    if (G.S) { G.S.evFoe = null; G.S.evFoeMeta = null; }
    const text = typeof nd.text === 'function' ? nd.text(G.S) : nd.text;
    if (typeof mountFoeSlip === 'function') mountFoeSlip($('#mj-text'));
    const dl = inkWrite($('#mj-text'), text, { immediate: true, step: 18 });
    const box = $('#mj-choices');
    let list = nd.choices(G.S);
    const mjEv = { id: 'mj:' + nd.t, title: nd.t };
    if (typeof Loop !== 'undefined' && Loop.dress) list = Loop.dress(list, mjEv, G.S);
    list.forEach((c, i) => {
      const b = document.createElement('button'); b.className = 'choice';
      const short = c.ling && d.ling + c.ling < 0;
      b.disabled = !!c.disabled || short;
      b._choice = c;
      b.style.animationDelay = (400 + dl * .5 + i * 110) + 'ms';
      b.innerHTML = '<span></span><small></small>'; b.firstChild.textContent = c.label; b.lastChild.textContent = short ? '灵力不足' : (typeof choiceSub === 'function' ? choiceSub(c, G.S) : (c.sub || ''));
      b.onclick = () => {
        if (c.side && typeof Loop !== 'undefined') {
          if (c.side === 'burn') {
            const r = Loop.burn(G.S, c.burn);
            b.disabled = true; b.classList.add('picked');
            toast(r.text || '符烧了。事情按原来的走。');
            save();
            return;
          }
          if (c.side === 'xian') {
            const r = Loop.reveal(G.S);
            if (r.err) { toast(r.err); return; }
            b.disabled = true; b.classList.add('picked');
            box.querySelectorAll('.choice').forEach(x => {
              if (!x._choice) return;
              const small = x.querySelector('small');
              if (small && typeof choiceSub === 'function') small.textContent = choiceSub(x._choice, G.S);
            });
            if (typeof mountFoeSlip === 'function') mountFoeSlip($('#mj-text'));
            toast(r.text);
            save();
            return;
          }
        }
        mjChoose(c, b);
      };
      box.appendChild(b);
    });
  }
  async function mjChoose(c, btn) {
    const box = $('#mj-choices'); if (box.classList.contains('chosen')) return;
    box.classList.add('chosen'); btn.classList.add('picked'); $('#mj-out').disabled = true;
    let won;
    if (c.duelOpp) won = await bossDuel(c.duelOpp(G.S), MIJING[G.S.dive.id].name);
    const res = J.mjResolve(G.S, c, won); save();
    mjBars();
    const out = $('#mj-result'); const p = document.createElement('p'); p.className = 'r-text'; out.appendChild(p);
    const t = inkWrite(p, res.text, { immediate: true, step: 18 });
    const tg = document.createElement('div'); tg.className = 'entry-tags'; tg.innerHTML = tagsHTML(res.tags) || '<span>无伤无损</span>'; tg.style.opacity = 0; out.appendChild(tg);
    const nav = document.createElement('div'); nav.className = 'mj-nav'; nav.style.opacity = 0; out.appendChild(nav);
    if (res.next === 'go') nav.innerHTML = `<button class="brush-btn small" data-a="deep"><span class="bb-ink"></span><span class="bb-text">深入</span></button><button class="mj-link" data-a="retreat">见好就收</button>`;
    else if (res.next === 'clear') nav.innerHTML = `<button class="brush-btn small" data-a="clear"><span class="bb-ink"></span><span class="bb-text">出秘境</span></button>`;
    else nav.innerHTML = `<button class="brush-btn small" data-a="forced"><span class="bb-ink"></span><span class="bb-text">狼狈而出</span></button>`;
    setTimeout(() => { tg.style.opacity = ''; tg.classList.add('bleed-in'); nav.style.opacity = ''; nav.classList.add('bleed-in'); const m = $('.mj-main'); m && m.scrollTo({ top: m.scrollHeight, behavior: 'smooth' }); }, Math.min(t, 1800) + 200);
    nav.onclick = e => { const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a; nav.onclick = null; if (a === 'deep') mjNodeView(); else leaveMj(a); };
  }
  async function leaveMj(how) {
    const name = MIJING[G.S.dive.id].name;
    const B = buffer(), o = J.mjLeave(G.S, how, B.emit);
    mjEl.classList.remove('open'); await sleep(500); mjEl.hidden = true; mjEl.innerHTML = '';
    G.busy = false;
    pushLog({ title: `出 · ${name}`, text: o.text, tags: o.tags, cls: how === 'clear' ? 'gold' : 'event', div: true }); B.flush();
    Core.afterGain(G.S, o.ups, pushLog); render(); save(); checkEnd();
  }
  // 秘境首领：借大比的对决台
  async function bossDuel(opp, ttl) {
    const el = $('#duel');
    el.className = 'duel boss'; el.hidden = false;
    $('#duel-ttl').textContent = ttl;
    $('#duel-mname').textContent = G.S.name;
    $('#duel-mstyle').textContent = `${REALMS[G.S.realm].name}${REALMS[G.S.realm].stages[G.S.stage]}${G.S.gf ? ' · 《' + GONGFA[G.S.gf].name + '》' : ''}`;
    await sleep(30); el.classList.add('go');
    const won = await runDuel({ opps: [opp] }, 0, { rd: '秘境之主', last: true, title: opp.title || '上古遗灵', intro: opp.intro });
    await sleep(300); el.classList.add('leave'); await sleep(900); el.hidden = true; el.className = 'duel';
    return won;
  }

  function resume() { if (G.S && G.S.dive && !G.S.dead) showMj(false); }
  function youliSub() { const l = G.S && G.S.loc && LOC[G.S.loc]; return l ? l.name : '寻机缘'; }
  return { openMap, closeMap, openMarket, startAuction, danPage, runFurnace, enterMj, resume, youliSub, aucWindow, mapKey, furnaceCtl: () => G.furnace };
}
