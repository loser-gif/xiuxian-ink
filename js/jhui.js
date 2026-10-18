/* 墨仙录 · 江湖界面：长卷地图、坊市、拍卖、丹炉、秘境 */
'use strict';
// 由 game.js 在其闭包内调用：G 提供界面工具与 S / busy 的存取
function makeJHUI(G) {
  const { $, sleep, pick, render, save, pushLog, openEvent, openSheet, closeSheet, toast, inkWrite, buffer, checkEnd, runDuel, realmStr, fmtNum, K, chanceWord } = G;
  const J = Jianghu;
  const vtext = (t, cls = '') => `<span class="vt ${cls}"><span class="vcol">${[...t].map(c => `<i>${c}</i>`).join('')}</span></span>`;
  const dots = (n, max = 5) => Array.from({ length: max }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('');
  const dangerWord = n => ['太平', '小有风波', '时有凶险', '凶险', '险恶', '九死一生'][n];
  const aucWindow = () => G.S.auc && G.S.months >= G.S.auc.next && G.S.months <= G.S.auc.next + J.K.aucWin * REALMS[G.S.realm].T && !G.S.auc.done;
  const tagsHTML = tags => (tags || []).map(x => `<span class="${x.c || ''}">${x.t}</span>`).join('');

  /* ================= 长卷地图 ================= */
  const mapEl = $('#map');
  let sel = null, mapBusy = false, onScroll = null;
  async function openMap() {
    if (G.busy || !G.S || G.S.dead || G.S.ascended) return;
    G.busy = true;
    sel = G.S.loc;
    mapEl.innerHTML = `
      <div class="map-head">
        <div class="map-ttl"><b>江湖</b><span id="map-where"></span></div>
        <button class="map-btn" id="map-rand"><span>随缘</span><small>信步而行</small></button>
        <button class="map-close" id="map-close" aria-label="收卷"><svg viewBox="0 0 100 100"><g filter="url(#f-seal)"><rect x="6" y="6" width="88" height="88" rx="8" fill="#b3302a"/><text x="50" y="67" text-anchor="middle" font-size="46" fill="#f3ead6" class="seal-font">收</text></g></svg></button>
      </div>
      <div class="map-scroll-wrap"><div class="map-roller l"></div>
        <div class="map-scroll" id="map-scroll"><div class="map-canvas" id="map-canvas">
          <img class="map-far" alt=""><img class="map-img" alt="">
          <svg class="map-road" viewBox="0 0 ${InkMap.MW} ${InkMap.MH}" preserveAspectRatio="none"><path class="road-all" d=""/><path class="road-known" d=""/><path class="road-go" d=""/></svg>
          <div class="map-marks"></div>
        </div></div>
        <div class="map-roller r"></div><div class="map-loading">研墨铺纸……</div></div>
      <div class="map-card" id="map-card"></div>`;
    mapEl.hidden = false; await sleep(20); mapEl.classList.add('open');
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
    centerOn(G.S.loc, false);
    G.busy = false;
  }
  async function closeMap(keepBusy) {
    mapEl.classList.remove('open');
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
    LOCS.forEach(l => {
      const [x, y, ly] = locXY(l.id), found = !!G.S.found[l.id];
      if (!found) {
        const m = document.createElement('div'); m.className = 'map-fog'; m.style.left = x + '%'; m.style.top = '8%'; box.appendChild(m); return;
      }
      const tag = document.createElement('button'); tag.className = 'map-tag' + (l.id === sel ? ' sel' : '') + (G.S.realm < l.rm ? ' locked' : '');
      tag.dataset.id = l.id; tag.style.left = x + '%'; tag.style.top = ly + '%';
      const mjOpenHere = l.mj && J.mjOpen(G.S, l.mj), auc = l.market && aucWindow();
      tag.innerHTML = `<span class="tag-slip">${vtext(l.name)}</span><span class="tag-seal">${l.seal}</span>${mjOpenHere ? '<span class="tag-flag">秘境</span>' : ''}${auc ? '<span class="tag-flag gold">拍卖</span>' : ''}`;
      tag.onclick = () => { if (mapBusy) return; sel = l.id; box.querySelectorAll('.map-tag').forEach(t => t.classList.toggle('sel', t.dataset.id === sel)); renderCard(); centerOn(sel, true); };
      box.appendChild(tag);
      const pt = document.createElement('i'); pt.className = 'map-pt'; pt.style.left = x + '%'; pt.style.top = y + '%'; box.appendChild(pt);
    });
    const [mx, my] = locXY(G.S.loc);
    const mk = document.createElement('div'); mk.className = 'map-me'; mk.id = 'map-me'; mk.style.left = mx + '%'; mk.style.top = my + '%';
    mk.innerHTML = '<i class="me-halo"></i><i class="me-dot"></i>'; box.appendChild(mk);
  }
  function centerOn(id, smooth) {
    const sc = $('#map-scroll'), cv = $('#map-canvas'); if (!sc || !cv) return;
    const x = locXY(id)[0] / 100 * cv.offsetWidth - sc.clientWidth / 2;
    sc.scrollTo({ left: Math.max(0, x), behavior: smooth && !FX.reduced() ? 'smooth' : 'auto' });
  }
  function renderCard() {
    const l = LOC[sel], here = sel === G.S.loc, ok = J.canGo(G.S, sel), card = $('#map-card');
    const m = J.travelMonths(G.S, sel), mjId = l.mj && J.mjOpen(G.S, l.mj) ? l.mj : null;
    const btns = [];
    if (here) btns.push(['explore', '就地游历', `${cnDur(m)}`]);
    else btns.push(['go', ok ? '前往' : `需${REALMS[l.rm].name}`, ok ? `路程${cnDur(m)}` : '修为未到', !ok]);
    if (l.market) btns.push(['market', here ? '入坊市' : '赴坊市', aucWindow() ? '今有拍卖' : '买卖丹草', !ok]);
    if (mjId) btns.push(['mj', '入秘境', MIJING[mjId].name, !ok]);
    else if (l.mj && G.S.realm >= MIJING[l.mj].rm) btns.push(['mjx', '秘境未启', '静候天时', true]);
    card.innerHTML = `<div class="mc-head"><span class="mc-seal">${l.seal}</span><div class="mc-name">${l.name}${here ? '<em>此间</em>' : ''}</div>
        <div class="mc-danger" title="凶险"><span class="dots">${dots(l.danger)}</span><small>${dangerWord(l.danger)}</small></div></div>
      <p class="mc-desc"></p>
      <div class="mc-meta">${l.herbs.length ? `<span>物产 · ${l.herbs.join('、')}</span>` : '<span>物产 · 百货云集</span>'}${G.S.realm < l.rm ? `<span class="zhu">需${REALMS[l.rm].name}方可涉足</span>` : ''}</div>
      <div class="mc-btns">${btns.map(b => `<button class="mc-btn${b[3] ? '' : ' on'}" data-a="${b[0]}" ${b[3] ? 'disabled' : ''}><b>${b[1]}</b><small>${b[2]}</small></button>`).join('')}</div>`;
    card.querySelector('.mc-desc').textContent = l.desc;
    card.classList.remove('bleed-in'); void card.offsetWidth; card.classList.add('bleed-in');
    card.querySelectorAll('.mc-btn').forEach(b => b.onclick = () => cardAct(b.dataset.a));
  }
  async function cardAct(a) {
    if (mapBusy) return; const to = sel;
    if (a === 'explore') return goEvent(to, true);
    if (a === 'go') return goEvent(to, false);
    if (a === 'market') { const tr = to !== G.S.loc ? await travelAnim(to) : null; await closeMap(); if (tr) logTravel(tr); if (G.S.dead) return afterDeath(); return openMarket(); }
    if (a === 'mj') { const tr = to !== G.S.loc ? await travelAnim(to) : null; await closeMap(); if (tr) logTravel(tr); if (G.S.dead) return afterDeath(); return enterMj(LOC[to].mj); }
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
    G.busy = false; openEvent(ev);
  }
  async function wander() {
    if (mapBusy) return;
    Core.passTime(G.S, REALMS[G.S.realm].T * K.youliMonths, pushLog);
    if (G.S.dead) { await closeMap(); return afterDeath(); }
    const ev = J.pickAt(G.S, null); render(); save();
    await closeMap(true); G.busy = false; openEvent(ev);
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
  const itemDesc = k => k === 'SCROLL' ? '瞎眼说书人兜售的功法残卷。真假难辨，全凭眼力与运气。' : k.startsWith('R:') ? `${RECIPES[k.slice(2)].name}的丹方。需${Object.entries(RECIPES[k.slice(2)].need).map(([h, n]) => h + cn(n)).join('、')}。` : (PILLS[k] && PILLS[k].desc) || '';
  const itemName = k => k === 'SCROLL' ? '功法残卷' : k.startsWith('R:') ? RECIPES[k.slice(2)].name + '方' : k;
  function trend(k) { const f = G.S.mkt.f[k] || 1; return f >= 1.15 ? '<i class="tr up">贵</i>' : f <= .85 ? '<i class="tr dn">贱</i>' : ''; }
  function buyPage(refresh) {
    const w = document.createElement('div'); w.className = 'mkt-list';
    const keys = Object.keys(G.S.mkt.st).filter(k => G.S.mkt.st[k] > 0);
    if (!keys.length) w.innerHTML = '<div class="empty">货架已空，改日再来</div>';
    keys.forEach(k => {
      const p = J.price(G.S, k), row = document.createElement('div'); row.className = 'item mkt-row';
      row.innerHTML = `<div class="item-info"><div class="item-name">${itemName(k)}<em>余${cn(G.S.mkt.st[k])}</em>${trend(k)}</div><div class="item-desc"></div></div>
        <button class="item-use price" ${G.S.ls < p ? 'disabled' : ''}><b>${fmtNum(p)}</b><small>灵石</small></button>`;
      row.querySelector('.item-desc').textContent = itemDesc(k);
      row.querySelector('button').onclick = () => {
        const r = J.buy(G.S, k); if (!r) return toast('灵石不足');
        if (r.text) pushLog({ title: '坊市', text: r.text, tags: r.tags, cls: 'event', div: true }); else pushLog({ text: `你在云岳坊购得${itemName(k)}。`, tags: r.tags, cls: 'sys' });
        render(); save(); toast(r.fake ? '上当了' : `得${itemName(k)}`); refresh();
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
      row.querySelector('.item-desc').textContent = (PILLS[k] && PILLS[k].desc) || '';
      row.querySelector('button').onclick = () => { const r = J.sell(G.S, k); if (!r) return; pushLog({ text: `你将一份${k}卖与坊中商户。`, tags: r.tags, cls: 'sys' }); render(); save(); refresh(); };
      w.appendChild(row);
    });
    return w;
  }
  function aucPage() {
    const w = document.createElement('div'); w.className = 'auc-banner';
    w.innerHTML = `<div class="ab-lamps"><i></i><i></i><i></i></div><div class="ab-ttl">听雨楼 · 今夜拍卖</div>
      <p>楼上挂出三盏红灯，今夜有三件宝物待价而沽。各路修士陆续登楼，有人笑语寒暄，有人只把斗笠压得更低。</p>
      <button class="brush-btn small ab-go"><span class="bb-ink"></span><span class="bb-text">登楼</span></button>`;
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
    const allTags = [], got = [];
    addLine({ t: pick(AUC_OPEN) }, true); await sleep(1200);
    let l;
    while ((l = J.aucLot(G.S, a))) {
      const won = await runLot(a, l);
      if (won) { allTags.push(...won.tags); got.push(J.lotName(l)); }
      await sleep(300);
    }
    aucEl.classList.remove('open'); await sleep(500); aucEl.hidden = true; aucEl.innerHTML = '';
    G.busy = false;
    pushLog({ title: '听雨楼拍卖', text: got.length ? `三件宝物落槌，你拍得${got.join('、')}。下楼时，夜风里还飘着檀香。` : '三件宝物各有所归，你两手空空地下了楼。有些东西，原本就不是灵石能争来的。', tags: allTags, cls: got.length ? 'gold' : 'event', div: true });
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
      const finish = async (won, line) => {
        btns.innerHTML = '';
        if (line) addLine(line);
        $('#auc-stamp-t').textContent = won ? '得' : '落'; await sleep(300); $('#auc-stamp').classList.add('on', won ? 'won' : 'lost');
        await sleep(900);
        btns.innerHTML = `<button class="brush-btn small light" id="auc-next"><span class="bb-ink"></span><span class="bb-text">${a.i < a.lots.length - 1 ? '下一件' : '散场'}</span></button>`;
        $('#auc-next').onclick = () => resolve(won);
      };
      const draw = () => {
        const p1 = Math.max(a.price + 1, Math.round(a.price * 1.1)), p3 = Math.max(a.price + 1, Math.round(a.price * 1.3));
        btns.innerHTML = `<button class="ab" data-k=".1" ${p1 > G.S.ls ? 'disabled' : ''}><b>加一成</b><small>${fmtNum(p1)}</small></button>
          <button class="ab" data-k=".3" ${p3 > G.S.ls ? 'disabled' : ''}><b>加三成</b><small>${fmtNum(p3)}</small></button>
          <button class="ab pass" data-k="0"><b>罢手</b><small>${a.leader === 'you' ? '' : '不争'}</small></button>`;
        btns.onclick = async e => {
          const b = e.target.closest('.ab'); if (!b || b.disabled || btns.classList.contains('wait')) return;
          btns.classList.add('wait');
          const k = +b.dataset.k;
          if (!k) { btns.classList.remove('wait'); btns.onclick = null; const r = J.aucPass(G.S, a); return finish(null, { who: r.winner, t: r.line }); }
          addLine({ who: 'you', t: `${fmtNum(Math.max(a.price + 1, Math.round(a.price * (1 + k))))}。` });
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
    w.innerHTML = `<div class="dan-head"><div class="dan-ding">${dingSVG()}</div><div class="dan-info"><div class="dan-lv">丹道 <b>${cn(d.lv)}重</b></div>
      <div class="dan-xp"><i style="width:${Math.min(100, d.xp / need * 100).toFixed(0)}%"></i></div><small>已开炉${cn(d.n)}次${G.S.lgEls.includes('火') ? ' · 火灵根，控火更稳' : ''}</small></div></div>`;
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
  function dingSVG(big) {
    return `<svg viewBox="0 0 120 120" class="ding${big ? ' big' : ''}"><g fill="none" stroke="#1b1814" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 50 Q60 44 98 50 L92 84 Q60 94 28 84 Z" fill="#2a2621" stroke-width="2.5"/>
      <path d="M26 58 Q60 52 94 58" stroke="#efe6d3" stroke-opacity=".28" stroke-width="1.5"/>
      <path d="M18 50 Q60 40 102 50" stroke-width="4"/>
      <path d="M34 47 Q34 30 44 30 M86 47 Q86 30 76 30" stroke-width="4"/>
      <path d="M36 86 L30 108 M60 92 L60 112 M84 86 L90 108" stroke-width="5"/>
      <path d="M48 68 q6 -6 12 0 q6 6 12 0" stroke="#efe6d3" stroke-opacity=".35" stroke-width="1.5"/></g></svg>`;
  }
  const danEl = $('#dan');
  async function runFurnace(id) {
    G.busy = true;
    const r = RECIPES[id];
    danEl.innerHTML = `<div class="dan-shade"></div><div class="dan-fire"></div>
      <div class="dan-stage">${dingSVG(true)}
        <svg class="dan-smoke" viewBox="0 0 200 260"><path d="M100 250 C80 210 122 190 98 150 C76 112 124 90 100 40"/><path d="M92 250 C110 214 70 188 90 146 C108 108 76 80 88 20" style="animation-delay:.35s"/><path d="M108 250 C126 220 94 196 112 160 C130 124 102 96 118 50" style="animation-delay:.7s"/></svg>
        <svg class="dan-flame" viewBox="0 0 70 40"><path d="M35 40 C22 34 26 20 33 6 C36 18 46 24 44 34 Z" fill="rgba(226,120,60,.85)"/><path d="M22 40 C14 34 18 26 22 18 C24 26 30 30 28 38 Z" fill="rgba(200,80,44,.7)"/><path d="M48 40 C42 34 46 26 50 16 C52 26 58 30 55 38 Z" fill="rgba(200,80,44,.7)"/></svg>
        <div class="dan-glow"></div><div class="dan-splash"></div></div>
      <div class="dan-name">${r.name}</div><p class="dan-text" id="dan-text"></p><div class="entry-tags dan-tags" id="dan-tags"></div>
      <div class="dan-stamp" id="dan-stamp"><svg viewBox="0 0 100 100"><g filter="url(#f-seal)"><rect x="5" y="5" width="90" height="90" rx="8" fill="#b3302a"/><text x="50" y="70" text-anchor="middle" font-size="56" fill="#f3ead6" class="seal-font" id="dan-stamp-t">成</text></g></svg></div>
      <button class="brush-btn small light dan-close" id="dan-close" hidden><span class="bb-ink"></span><span class="bb-text">收丹</span></button>`;
    danEl.className = 'dan'; danEl.hidden = false; await sleep(20); danEl.classList.add('open', 'fire');
    const B = buffer(); const res = J.craft(G.S, id, B.emit); save();
    await sleep(FX.reduced() ? 100 : 2200);
    danEl.classList.remove('fire'); danEl.classList.add(res.ok ? (res.q >= 2 ? 'gold' : 'ok') : res.boom ? 'boom' : 'waste');
    if (res.boom && navigator.vibrate) try { navigator.vibrate([20, 40, 30]); } catch (e) {}
    await sleep(res.boom ? 700 : 500);
    $('#dan-stamp-t').textContent = res.ok ? (res.q >= 2 ? DAN_Q[res.q].slice(0, 1) : '成') : res.boom ? '炸' : '废';
    $('#dan-stamp').classList.add('on');
    const t = inkWrite($('#dan-text'), res.text, { immediate: true, step: 18 });
    await sleep(Math.min(t, 1600) + 300);
    $('#dan-tags').innerHTML = tagsHTML(res.tags); $('#dan-tags').classList.add('bleed-in');
    const c = $('#dan-close'); c.hidden = false; c.classList.add('bleed-in');
    c.querySelector('.bb-text').textContent = res.ok ? '收丹' : '收拾';
    c.onclick = async () => {
      danEl.classList.remove('open'); await sleep(500); danEl.hidden = true; danEl.innerHTML = ''; danEl.className = 'dan';
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
    const text = typeof nd.text === 'function' ? nd.text(G.S) : nd.text;
    const dl = inkWrite($('#mj-text'), text, { immediate: true, step: 18 });
    const box = $('#mj-choices');
    nd.choices(G.S).forEach((c, i) => {
      const b = document.createElement('button'); b.className = 'choice';
      const short = c.ling && d.ling + c.ling < 0;
      b.disabled = !!c.disabled || short;
      b.style.animationDelay = (400 + dl * .5 + i * 110) + 'ms';
      b.innerHTML = '<span></span><small></small>'; b.firstChild.textContent = c.label; b.lastChild.textContent = short ? '灵力不足' : (c.sub || '');
      b.onclick = () => mjChoose(c, b);
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
  return { openMap, closeMap, openMarket, startAuction, danPage, runFurnace, enterMj, resume, youliSub, aucWindow };
}
