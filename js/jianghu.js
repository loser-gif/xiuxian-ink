/* 墨仙录 · 江湖规则：行旅、坊市、拍卖、炼丹、秘境（挂在 Core 上，供界面与模拟共用） */
'use strict';
const Jianghu = (() => {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const T = s => REALMS[s.realm].T;
  const K = { exploreM: 3, travelBase: 2, travelPer: 6, mktEvery: 12, aucEvery: [7, 11], aucWin: 30, mjEvery: [70, 110], mjXw: 0.55, mjWin: 30, mjExit: 4, gather: 0.55 };

  /* ---------- 初始化 / 迁移 ---------- */
  function init(s) {
    s.loc = s.loc || (s.sect && s.sect.org === 'qm' ? 'shanmen' : 'qingshi');
    s.found = s.found || { qingshi: 1, taohua: 1, shanmen: 1, yunyue: 1 };
    s.dan = s.dan || { lv: 1, xp: 0, rec: ['juqi'], n: 0 };
    s.mkt = s.mkt || { t: -9999, f: {}, st: {} };
    s.auc = s.auc || { next: s.months + 12 * rint(K.aucEvery[0], K.aucEvery[1]) * Math.max(1, T(s) / 2) };
    s.mj = s.mj || {};
    s.dive = s.dive || null;
    s.frag = s.frag || { id: null, n: 0 };
    s.btBuff = s.btBuff || 0;
    for (const l of LOCS) if (s.realm >= l.rm && l.rm > 0) s.found[l.id] = 1;
    return s;
  }

  /* ---------- 光阴流转时：传闻、秘境开合、拍卖预告 ---------- */
  function tick(s, emit) {
    if (!s.found) return;
    for (const l of LOCS) if (!s.found[l.id] && s.realm >= l.rm) {
      s.found[l.id] = 1; s.newFound = l.id;
      emit && emit({ title: `新识 · ${l.name}`, text: LOC_RUMOR[l.id] || l.desc, cls: 'event', div: true });
    }
    for (const [id, m] of Object.entries(MIJING)) {
      if (s.realm < m.rm) continue;
      const st = s.mj[id] = s.mj[id] || { next: s.months + 12 * rint(2, 8) * T(s), open: 0, close: 0, n: 0 };
      if (!st.open && s.months >= st.next) {
        st.open = s.months; st.close = s.months + K.mjWin * T(s);
        emit && emit({ title: `秘境将启 · ${m.name}`, text: m.open + `（约${cnDur(K.mjWin * T(s))}后闭合，可往${LOC[m.loc].name}一探）`, cls: 'gold', div: true });
      } else if (st.open && s.months > st.close && !(s.dive && s.dive.id === id)) {
        st.open = 0; st.next = s.months + 12 * rint(K.mjEvery[0], K.mjEvery[1]) * T(s) / 2;
        emit && emit({ text: `${m.name}的入口悄然合上了。下一次开启，不知又是何年。`, cls: '' });
      }
    }
    if (s.auc && !s.auc.told && s.months >= s.auc.next && s.months <= s.auc.next + K.aucWin * T(s)) {
      s.auc.told = 1; emit && emit({ text: `云岳坊听雨楼挂出了灯笼：拍卖会将开。（约${cnDur(K.aucWin * T(s))}内，往云岳坊可赴会）`, cls: 'event' });
    }
    if (s.auc && s.months > s.auc.next + K.aucWin * T(s)) s.auc = { next: s.months + 12 * rint(K.aucEvery[0], K.aucEvery[1]) * Math.max(1, T(s) / 2) };
  }

  /* ---------- 行旅 ---------- */
  const canGo = (s, id) => !!(s.found[id] && s.realm >= LOC[id].rm);
  const dist = (a, b) => Math.abs(LOC[a].x - LOC[b].x);
  const travelMonths = (s, to) => {
    let m = to === s.loc ? K.exploreM * T(s) : T(s) * (K.travelBase + Math.round(dist(s.loc, to) * K.travelPer));
    if (typeof Core !== 'undefined' && Core.pathYouliMul) m = Math.max(1, Math.round(m / Core.pathYouliMul(s)));
    return m;
  };
  function gather(s, locId, tags, p = K.gather) {
    const l = LOC[locId]; if (!l || !l.herbs.length || Math.random() > p) return;
    const ok = l.herbs.filter(h => (ITEM_VAL[h].tier || 0) <= s.realm + 1); if (!ok.length) return;
    const h = pick(ok), n = Math.random() < 0.35 ? 2 : 1;
    s.items[h] = (s.items[h] || 0) + n; tags.push({ t: `采得${h}${n > 1 ? '×' + n : ''}`, c: 'up' });
  }
  function travel(s, to, emit) {
    const m = travelMonths(s, to), tags = [], from = s.loc;
    Core.passTime(s, m, emit);
    s.loc = to; if (!s.dead) gather(s, to, tags);
    return { months: m, tags, from };
  }
  // 地点的奇遇池：本地者全权，未归处者半权
  function pickAt(s, locId) {
    if (!locId) return Core.pickEvent(s, e => !EV_LOC[e.id] || EV_LOC[e.id].some(l => s.found[l]));
    return Core.pickEvent(s, e => !EV_LOC[e.id] || EV_LOC[e.id].includes(locId), e => EV_LOC[e.id] ? 1 : 0.45);
  }

  /* ---------- 坊市 ---------- */
  const pillOf = s => REALMS[Math.min(4, s.realm)].pill;
  function baseVal(s, k) {
    const v = ITEM_VAL[k]; if (!v) return 0;
    return Math.round(v.base * REALMS[v.rel ? s.realm : v.tier].lsScale);
  }
  function mktRefresh(s, force) {
    if (!force && s.months - s.mkt.t < K.mktEvery * T(s)) return false;
    const st = {}, f = s.mkt.f || {};
    for (const m of MARKET) {
      if (m.rm && s.realm < m.rm) continue;
      if (m.p && Math.random() > m.p) continue;
      let k = m.k; if (k === 'PILL') k = pillOf(s);
      if (k === 'SCROLL') { st.SCROLL = 1; continue; }
      if (k.startsWith('R:') && s.dan.rec.includes(k.slice(2))) continue;
      st[k] = k.startsWith('R:') ? 1 : rint(m.n[0], m.n[1]);
    }
    for (const k of Object.keys(ITEM_VAL)) f[k] = +clamp((f[k] || 1) * (0.8 + Math.random() * 0.42), 0.62, 1.6).toFixed(2);
    s.mkt = { t: s.months, f, st };
    return true;
  }
  function price(s, k) {
    if (k === 'SCROLL') return 60 * REALMS[s.realm].lsScale;
    if (k.startsWith('R:')) return Math.round((RECIPES[k.slice(2)].diff * 40 + 50) * REALMS[s.realm].lsScale * (k === 'R:yanshou' ? 1.6 : 1));
    return Math.max(1, Math.round(baseVal(s, k) * (s.mkt.f[k] || 1)));
  }
  const sellPrice = (s, k) => ITEM_VAL[k] ? Math.max(1, Math.round(baseVal(s, k) * (s.mkt.f[k] || 1) * 0.5)) : 0;
  function buy(s, k) {
    const p = price(s, k); if (s.ls < p || !(s.mkt.st[k] > 0)) return null;
    s.ls -= p; s.mkt.st[k]--; const tags = [{ t: `灵石 −${p}`, c: 'down' }];
    if (k === 'SCROLL') {
      const pool = Object.keys(GONGFA).filter(id => GONGFA[id].grade <= Math.min(1, s.realm) && !GONGFA[id].mo && !s.gfs[id] && !['雷', '风', '冰', '五行'].includes(GONGFA[id].el));
      if (!pool.length || Math.random() < 0.3) return { tags, text: '残卷用油布裹了三层，回到住处展开一看，前半卷是功法，后半卷却是一本春宫。你哭笑不得。', fake: true };
      const id = pick(pool), o = Core.applyFx(s, { gf: id });
      return { tags: tags.concat(o.tags), text: `卖残卷的是个瞎眼说书人，摸着灵石笑道：“老朽看不见字，客官自己瞧。”你就着灯火细读——竟是一卷完整的《${GONGFA[id].name}》。` };
    }
    if (k.startsWith('R:')) { learnRecipe(s, k.slice(2), tags); return { tags, text: `你买下一张${RECIPES[k.slice(2)].name}方，纸页焦黄，字迹却清楚。` }; }
    s.items[k] = (s.items[k] || 0) + 1; tags.push({ t: `得${k}`, c: 'up' });
    return { tags };
  }
  function sell(s, k) {
    if (!(s.items[k] > 0) || !ITEM_VAL[k]) return null;
    const p = sellPrice(s, k); s.items[k]--; if (!s.items[k]) delete s.items[k]; s.ls += p;
    return { tags: [{ t: `灵石 +${p}`, c: 'up' }], p };
  }

  /* ---------- 拍卖 ---------- */
  const aucOpen = s => s.loc === 'yunyue' && s.auc && s.months >= s.auc.next && s.months <= s.auc.next + K.aucWin * T(s) && !s.auc.done;
  function aucNew(s) {
    const L = REALMS[s.realm].lsScale, lots = [];
    const pool = [
      { k: pillOf(s), v: 160 * L, w: 3 },
      { k: '延寿果', v: 170 * L, w: 2 },
      { k: '天品残页', v: 260 * L, w: 2, frag: 1 },
      { k: '九叶灵芝', v: 120 * L, w: s.realm >= 2 ? 1.5 : 0 },
      { k: 'R:ningyuan', v: 140 * L, w: s.realm >= 1 && !s.dan.rec.includes('ningyuan') ? 1.2 : 0 },
      { k: 'R:huaying', v: 200 * L, w: s.realm >= 2 && !s.dan.rec.includes('huaying') ? 1.2 : 0 },
      { k: '龙鳞', v: 60 * L, w: 1 },
    ];
    while (lots.length < 3) {
      const c = pool.filter(p => p.w > 0 && !lots.find(l => l.k === p.k)); let tot = c.reduce((a, b) => a + b.w, 0), x = Math.random() * tot;
      for (const p of c) if ((x -= p.w) < 0) { lots.push({ ...p }); break; }
    }
    const ids = ['zhao', 'liu', 'qian', 'hei'].sort(() => Math.random() - 0.5).slice(0, 3);
    if (s.npc && s.npc.wen && s.npc.wen.met && s.sect.org === 'qm') ids[2] = 'wen';
    s.auc.done = 1;
    return { lots, ids, i: -1, beat: [] };
  }
  function lotName(l) { return l.k.startsWith('R:') ? RECIPES[l.k.slice(2)].name + '方' : l.k; }
  function aucLot(s, a) {
    a.i++; const l = a.lots[a.i]; if (!l) return null;
    a.price = Math.round(l.v * 0.45); a.leader = null; a.lines = [];
    a.max = {}; for (const id of a.ids) a.max[id] = Math.round(l.v * (0.65 + Math.random() * 0.85) * (id === 'qian' ? 1.1 : 1));
    a.active = a.ids.filter(id => a.max[id] >= a.price);
    const op = a.active.length ? pick(a.active) : null;
    if (op) { a.leader = op; a.lines.push({ who: op, t: pick(BIDDERS[op].raise) }); }
    return l;
  }
  // 玩家加价 k（0.1 / 0.3）；返回 {won} 或 {outbid}
  function aucRaise(s, a, k) {
    const np = Math.max(a.price + 1, Math.round(a.price * (1 + k)));
    if (np > s.ls) return { err: '灵石不足' };
    a.price = np; a.leader = 'you'; a.lines = [];
    const still = [];
    for (const id of a.active) {
      if (a.max[id] >= Math.round(a.price * 1.08)) still.push(id);
      else { a.lines.push({ who: id, t: BIDDERS[id].quit }); if (!a.beat.includes(id)) a.beat.push(id); }
    }
    a.active = still;
    if (!still.length) return aucWin(s, a);
    const id = pick(still); a.price = Math.min(a.max[id], Math.round(a.price * (1.08 + Math.random() * 0.12)));
    a.leader = id; a.lines.push({ who: id, t: pick(BIDDERS[id].raise) });
    return { outbid: id };
  }
  function aucWin(s, a) {
    const l = a.lots[a.i], tags = [{ t: `灵石 −${a.price}`, c: 'down' }];
    s.ls -= a.price;
    if (l.frag) fxFrag(s, 1, tags);
    else if (l.k.startsWith('R:')) learnRecipe(s, l.k.slice(2), tags);
    else { s.items[l.k] = (s.items[l.k] || 0) + 1; tags.push({ t: `得${l.k}`, c: 'up' }); }
    if (a.beat.includes('hei')) s.flags.heiGrudge = 1;
    if (a.beat.includes('wen')) Core.npcAdd(s, 'wen', -4, tags);
    return { won: true, tags };
  }
  function aucPass(s, a) { const w = a.leader && a.leader !== 'you' ? a.leader : null; return { lost: true, winner: w, line: w ? BIDDERS[w].win : '无人应价，此物流拍。' }; }

  /* ---------- 炼丹 ---------- */
  function learnRecipe(s, id, tags) {
    if (s.dan.rec.includes(id)) { s.dan.xp += 2; tags && tags.push({ t: '丹道精进', c: 'up' }); return false; }
    s.dan.rec.push(id); tags && tags.push({ t: `习得${RECIPES[id].name}方`, c: 'up' }); return true;
  }
  const danNeed = lv => 3 + lv * 2;
  function danXp(s, n, tags) {
    s.dan.xp += n;
    const lv0 = s.dan.lv;
    while (s.dan.lv < 9 && s.dan.xp >= danNeed(s.dan.lv)) { s.dan.xp -= danNeed(s.dan.lv); s.dan.lv++; }
    if (tags && s.dan.lv > lv0) tags.push({ t: `丹道 ${cn(s.dan.lv)}重`, c: 'up' });
  }
  const hasHerbs = (s, id) => Object.entries(RECIPES[id].need).every(([h, n]) => (s.items[h] || 0) >= n);
  function danChance(s, id) {
    const r = RECIPES[id];
    let bonus = (s.lgEls.includes('火') ? 0.05 : 0) + (s.npc && s.npc.su && s.npc.su.a >= 50 ? 0.04 : 0);
    if (s.path && s.path.daoji === 'dan' && typeof DAOJI !== 'undefined') bonus += DAOJI.dan.craft || 0;
    return clamp(0.56 + 0.065 * (s.dan.lv - 1) - 0.1 * r.diff + 0.03 * (s.wx - 5) + bonus, 0.05, 0.95);
  }
  const danMonths = (s, id) => T(s) * (2 + Math.floor(RECIPES[id].diff / 2));
  function craft(s, id, emit) {
    const r = RECIPES[id]; if (!s.dan.rec.includes(id) || !hasHerbs(s, id)) return null;
    for (const [h, n] of Object.entries(r.need)) { s.items[h] -= n; if (!s.items[h]) delete s.items[h]; }
    const p = danChance(s, id), tags = [], m = danMonths(s, id);
    Core.passTime(s, m, emit); s.dan.n++;
    if (Math.random() < p) {
      const qr = Math.random() + s.dan.lv * 0.04 + (s.wx - 5) * 0.02;
      const q = qr > 1.12 ? 3 : qr > 0.8 ? 2 : qr > 0.38 ? 1 : 0;
      const n = r.diff <= 1 ? q + 1 : Math.max(1, Math.ceil((q + 1) / 2));
      s.items[r.out] = (s.items[r.out] || 0) + n; tags.push({ t: `${DAN_Q[q]} · 成丹${cn(n)}枚`, c: q >= 2 ? 'gold' : 'up' });
      danXp(s, 2 + r.diff + (q === 3 ? 2 : 0), tags);
      return { ok: true, q, n, months: m, tags, text: q === 3 ? DAN_TEXT.top : pick(DAN_TEXT.ok) };
    }
    const boom = Math.random() < 0.25 + 0.06 * r.diff;
    danXp(s, 1, tags);
    if (boom) { s.inj += 1; tags.push({ t: '炸炉 · 负伤', c: 'down' }); return { ok: false, boom: true, months: m, tags, text: pick(DAN_TEXT.boom) }; }
    tags.push({ t: '废丹', c: 'down' });
    return { ok: false, months: m, tags, text: pick(DAN_TEXT.waste) };
  }

  // 藏经阁丹方：以贡献换
  const libRecipes = s => s.sect && s.sect.org ? LIB_RECIPES.map(r => ({ ...r, cost: Math.round(r.cost * (GX_SCALE[s.lg.id] || 1)), known: s.dan.rec.includes(r.id), locked: s.sect.rank < r.rank })) : [];
  function buyRecipe(s, id) {
    const r = libRecipes(s).find(x => x.id === id); if (!r || r.known || r.locked || s.sect.gx < r.cost) return null;
    s.sect.gx -= r.cost; const tags = [{ t: `贡献 −${r.cost}`, c: 'down' }]; learnRecipe(s, id, tags); return { tags };
  }

  /* ---------- 天品残页 ---------- */
  function fxFrag(s, n, tags) {
    if (!s.frag.id || s.gfs[s.frag.id]) {
      const pool = Object.keys(GONGFA).filter(id => GONGFA[id].grade === 3 && !s.gfs[id]);
      const own = pool.filter(id => s.lgEls.includes(GONGFA[id].el) || !GONGFA[id].el);
      s.frag = { id: (own.length ? pick(own) : pool.length ? pick(pool) : null), n: 0 };
    }
    if (!s.frag.id) { s.ls += 100 * REALMS[s.realm].lsScale; tags.push({ t: '残页可换灵石', c: 'up' }); return; }
    s.frag.n += n; tags.push({ t: `得《${GONGFA[s.frag.id].name}》残页（${cn(s.frag.n)}/三）`, c: 'gold' });
    if (s.frag.n >= 3) { const id = s.frag.id; s.frag = { id: null, n: 0 }; Core.applyFx(s, { gf: id }); tags.push({ t: `三页合璧 · 悟得《${GONGFA[id].name}》`, c: 'gold' }); }
  }

  /* ---------- 秘境 ---------- */
  const mjOpen = (s, id) => !!(s.mj[id] && s.mj[id].open && s.months <= s.mj[id].close && s.realm >= MIJING[id].rm);
  const mjHere = s => { const l = LOC[s.loc]; return l && l.mj && mjOpen(s, l.mj) ? l.mj : null; };
  function mjEnter(s, id) { s.dive = { id, node: 0, hp: 100, ling: 100, loot: { ls: 0, xw: 0, item: {} }, seen: 0 }; return s.dive; }
  const mjNode = s => s.dive && MIJING[s.dive.id].nodes[s.dive.node];
  const mjBase = (s, b) => s.dive ? b + (s.dive.hp - 60) / 300 + (s.dive.ling - 50) / 400 : b;
  function addLoot(L, o) {
    if (!o) return;
    for (const k of ['ls', 'xw', 'xj', 'dan', 'frag']) if (o[k]) L[k] = (L[k] || 0) + o[k];
    if (o.item) for (const [k, n] of Object.entries(o.item)) L.item[k] = (L.item[k] || 0) + n;
    if (o.recipe) L.recipe = o.recipe;
  }
  // 结算一处节点的选择；fightAct 的 fx 作 loot 处理（hp 另计）
  function mjResolve(s, c, duelWon) {
    const d = s.dive; let res;
    if (c.duelOpp) res = duelWon ? { text: c.win.text, fx: c.win.fx, fight: { dr: 0, gap: 0, foe: '剑魂', tier: 'win' } } : { text: c.lose.text, fx: c.lose.fx, fight: { dr: 0, gap: 0, foe: '剑魂', tier: 'lose' } };
    else res = c.act(s);
    s.evFoe = null;
    const fx = res.fx || {}, hp = (res.hp || 0) + (fx.hp || 0), ling = (res.ling || 0) + (c.ling || 0);
    const loot = { ...(res.loot || {}) }; for (const k of ['ls', 'xw', 'item', 'frag', 'recipe', 'dan']) if (fx[k] != null) loot[k] = fx[k];
    if (res.xj) loot.xj = (loot.xj || 0) + res.xj;
    d.hp = clamp(d.hp + hp, 0, 100); d.ling = clamp(d.ling + ling, 0, 100); addLoot(d.loot, loot);
    const tags = [];
    if (hp) tags.push({ t: `元气 ${hp > 0 ? '+' : '−'}${Math.abs(hp)}`, c: hp > 0 ? 'up' : 'down' });
    if (ling) tags.push({ t: `灵力 ${ling > 0 ? '+' : '−'}${Math.abs(ling)}`, c: ling > 0 ? 'up' : 'down' });
    const node = mjNode(s);
    let next = 'go';
    if (d.hp <= 0) next = 'forced';
    else if (node.boss) next = res.fight && res.fight.tier === 'lose' ? 'forced' : 'clear';
    else d.node++;
    return { text: typeof res.text === 'function' ? res.text(s) : res.text, tags, hp, ling, loot, fight: res.fight, hazard: res.hazard, next };
  }
  function mjLeave(s, how, emit) {
    const d = s.dive; if (!d) return null;
    const m = MIJING[d.id], L = d.loot, half = how === 'forced';
    const fx = {};
    if (L.ls) fx.ls = Math.round(L.ls * (half ? 0.5 : 1));
    if (L.xw) fx.xw = +(L.xw * K.mjXw * (half ? 0.5 : 1)).toFixed(3);
    if (L.xj) fx.xj = L.xj;
    const items = {}; for (const [k, n] of Object.entries(L.item)) { const v = half ? Math.floor(n / 2) : n; if (v) items[k] = v; }
    if (Object.keys(items).length) fx.item = items;
    if (half) { fx.inj = 2; fx.xj = (fx.xj || 0) - 4; }
    const tags = [];
    const months = T(s) * (K.mjExit + d.node);
    s.dive = null; s.mj[d.id] = s.mj[d.id] || { n: 0 }; s.mj[d.id].open = 0; s.mj[d.id].n++; s.mj[d.id].next = s.months + 12 * rint(K.mjEvery[0], K.mjEvery[1]) * T(s) / 2;
    Core.passTime(s, months, emit);
    const o = Core.applyFx(s, fx, emit); tags.push(...o.tags);
    if (!half && L.recipe) learnRecipe(s, L.recipe, tags);
    if (!half && L.dan) danXp(s, L.dan, tags);
    if (!half && L.frag) fxFrag(s, L.frag, tags);
    const text = how === 'clear' ? `你走出${m.name}时，身后的入口缓缓合拢。${cnDur(months)}光阴，恍如一梦。`
      : how === 'forced' ? `你被逐出${m.name}，囊中所得散落了一半。` : `你见好就收，退出了${m.name}。`;
    return { text, tags, ups: o.ups, months, how };
  }
  const mjAll = () => Object.keys(MIJING);

  /* ---------- 新增 fx 与丹药 ---------- */
  function fx(s, f, tags) {
    if (f.recipe && s.dan) learnRecipe(s, f.recipe, tags);
    if (f.dan && s.dan) danXp(s, f.dan, tags);
    if (f.frag) fxFrag(s, f.frag, tags);
  }
  function useItem(s, k, tags) {
    if (k === '延寿丹') { const v = Math.round(3 * Core.LIFE_SCALE[s.realm] * 2); s.lifeBonus += v; tags.push({ t: `寿元 +${v}年`, c: 'up' }); return { text: '丹药入腹，枯槁的经脉里，像是渗进了一场春雨。' }; }
    if (k === '破障丹') {
      if (Core.bottleneck(s)) { if (s.btBuff >= 0.08) return { err: '药力已足，再服无益' }; s.btBuff = 0.08; tags.push({ t: '下回破境 +8%', c: 'up' }); return { text: '破障丹化作一线锐气，抵在瓶颈之上，蓄势待发。' }; }
      const ups = Core.addXw(s, Core.req(s) * 0.5, tags); return { text: '药力如凿，一下一下凿开经脉间的壁垒。', ups };
    }
    return null;
  }

  return { K, init, tick, canGo, dist, travelMonths, travel, gather, pickAt,
    baseVal, mktRefresh, price, sellPrice, buy, sell,
    aucOpen, aucNew, aucLot, aucRaise, aucPass, lotName,
    libRecipes, buyRecipe, learnRecipe, hasHerbs, danChance, danMonths, craft, danNeed,
    fxFrag, mjOpen, mjHere, mjEnter, mjNode, mjBase, mjResolve, mjLeave, mjAll, fx, useItem };
})();
