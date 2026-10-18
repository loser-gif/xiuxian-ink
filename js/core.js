/* 墨仙录 · 规则核心（无 DOM，游戏与模拟器共用） */
'use strict';
const Core = (() => {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const LIFE_SCALE = [1, 1.5, 2.5, 4, 6];
  const SAVE_V = 2;
  // 调参入口（模拟器会改写这里）
  const K = {
    tunaGain: 0.22, biguanGain: 1.0, tunaMonths: 3, biguanMonths: 12, youliMonths: 3,
    noGf: 0.75, mismatch: 0.85, yiElemental: 0.9, yiOwn: 1.4, wuxingPer: 0.07,
    match: { tian: 1.35, shuang: 1.25, san: 1.18, si: 1.1, wei: 1.05, yi: 1.0 },
    layerBonus: 0.04, xpNeed: lv => 3 + lv * 2,
    btDeath: [0, 0, 0, 0.07, 0.18],
    moLoss: [1, 2], moRiskXj: 30, moRisk: 0.008,
    reqMul: [6.5, 7.5, 8.5, 10, 11], lifeMul: [1.3, 1.45, 1.55, 1.6, 1.65],
  };

  /* ---------- 基础 ---------- */
  function gf(s) { return s.gf ? GONGFA[s.gf] : null; }
  function gt(s, key, dflt) { const g = gf(s); return g && g.t[key] != null ? g.t[key] : dflt; }
  function sync(s) {
    s.age = Math.floor(s.months / 12);
    s.lifespan = Math.round(REALMS[s.realm].life * K.lifeMul[s.realm] * (1 + gt(s, 'life', 0)) + s.lifeBonus);
  }
  const req = s => Math.round(REALMS[s.realm].scale * REALMS[s.realm].reqBase * K.reqMul[s.realm] * (1 + REALMS[s.realm].reqGrow * s.stage));
  const unit = s => 100 * REALMS[s.realm].scale * s.lg.mult * (1 + (s.wx - 5) * 0.06);
  const isLast = s => s.stage === REALMS[s.realm].stages.length - 1;
  const bottleneck = s => isLast(s) && s.xw >= req(s);
  const realmStr = s => REALMS[s.realm].name + REALMS[s.realm].stages[s.stage];
  const timeLabel = s => `${cn(s.age)}岁 · ${['春', '夏', '秋', '冬'][Math.floor((s.months % 12) / 3)]}`;
  const fmtNum = n => n >= 100000 ? (n / 10000).toFixed(1) + '万' : String(Math.floor(n));

  /* ---------- 功法 ---------- */
  function gfMatch(s, id) {
    const g = GONGFA[id]; if (!g) return K.noGf;
    if (!g.el) return 1;
    if (g.el === '五行') return 1 + K.wuxingPer * (s.lg.id === 'yi' ? 1 : s.lgEls.length);
    if (s.lg.id === 'yi') return s.lgEls[0] === g.el ? K.yiOwn : (ELEMENTS.includes(g.el) ? K.yiElemental : 0.6);
    if (!ELEMENTS.includes(g.el)) return 0.6;          // 雷风冰之法，非异灵根难以驾驭
    return s.lgEls.includes(g.el) ? (K.match[s.lg.id] || 1.1) : K.mismatch;
  }
  function gfLv(s, id = s.gf) { return id && s.gfs[id] ? s.gfs[id].lv : 0; }
  function gfSpeed(s, id = s.gf) {
    if (!id) return K.noGf;
    const g = GONGFA[id];
    return GF_GRADE_MUL[g.grade] * gfMatch(s, id) * (1 + K.layerBonus * (gfLv(s, id) - 1)) * (g.t.spd || 1);
  }
  function gfMatchWord(s, id) {
    const g = GONGFA[id]; if (!g.el) return '不择灵根';
    const m = gfMatch(s, id);
    if (g.el === '五行') return '五行相生';
    return m >= 1.15 ? '与灵根相合' : m >= 1 ? '与灵根无碍' : m >= 0.8 ? '与灵根相悖' : '灵根难驭';
  }
  function learn(s, id, tags, emit) {
    if (!GONGFA[id]) return false;
    if (s.gfs[id]) { tags && tags.push({ t: `《${GONGFA[id].name}》已在胸中`, c: '' }); return false; }
    s.gfs[id] = { lv: 1, xp: 0 };
    tags && tags.push({ t: `得功法《${GONGFA[id].name}》`, c: 'up' });
    if (!s.gf) { s.gf = id; emit && emit({ text: `你开始修习《${GONGFA[id].name}》。从此吐纳有法，不再是盲人摸象。`, cls: 'sys' }); }
    return true;
  }
  function practice(s, n, tags, emit) {
    if (!s.gf) return;
    const e = s.gfs[s.gf]; if (!e || e.lv >= GF_LAYERS) return;
    e.xp += n;
    while (e.lv < GF_LAYERS && e.xp >= K.xpNeed(e.lv)) {
      e.xp -= K.xpNeed(e.lv); e.lv++;
      emit && emit({ text: `《${GONGFA[s.gf].name}》${e.lv === GF_LAYERS ? '大成，修至第九层' : `修至第${cn(e.lv)}层`}。${pick(TEXT.gfUp)}`, cls: 'gold' });
    }
  }
  // 转修：散去旧功，耗修为、心境与一段光阴；新功法保留各自层数
  function switchCost(s) { return { xw: Math.round(req(s) * 0.25), xj: 6, months: 6 * REALMS[s.realm].T }; }
  function switchGf(s, id, emit) {
    if (!s.gfs[id] || s.gf === id) return false;
    const c = switchCost(s), old = s.gf;
    s.gf = id; s.xw = Math.max(0, s.xw - c.xw); s.xj = clamp(s.xj - c.xj, 0, 100);
    s.bnLogged = false;
    passTime(s, c.months, emit);
    emit && emit({ title: '转修', text: old ? `你散去《${GONGFA[old].name}》的周天路数，改修《${GONGFA[id].name}》。经脉逆转之痛，如抽丝剥茧，${cnDur(c.months)}方定。` : `你改修《${GONGFA[id].name}》。`,
      tags: [{ t: `修为 −${fmtNum(c.xw)}`, c: 'down' }, { t: `心境 −${c.xj}`, c: 'down' }], cls: 'event', div: true });
    checkXj(s, emit);
    return true;
  }

  /* ---------- 数值 ---------- */
  function addXw(s, amount, tags) {
    amount = Math.round(amount);
    if (amount < 0) { s.xw = Math.max(0, s.xw + amount); tags && tags.push({ t: `修为 −${fmtNum(-amount)}`, c: 'down' }); return []; }
    if (bottleneck(s)) { tags && tags.push({ t: '修为已满', c: '' }); return []; }
    tags && tags.push({ t: `修为 +${fmtNum(amount)}`, c: 'up' });
    s.xw += amount;
    const ups = [];
    while (s.xw >= req(s) && !isLast(s)) { s.xw -= req(s); s.stage++; ups.push(realmStr(s)); }
    if (isLast(s) && s.xw >= req(s)) s.xw = req(s);
    return ups;
  }
  function afterGain(s, ups, emit) {
    (ups || []).forEach(r => emit({ text: pick(TEXT.stageUp).replace('{r}', r), cls: 'gold' }));
    if (bottleneck(s) && !s.bnLogged) { s.bnLogged = true; emit({ text: TEXT.bottleneck.replace('{r}', REALMS[s.realm].name + (s.realm === 0 ? '九层' : '圆满')), cls: 'warn' }); }
  }
  function passTime(s, m, emit) {
    s.months += m * gt(s, 'time', 1); sync(s);
    const left = s.lifespan - s.age, span = s.lifespan - 16;
    const k = s.realm + ':' + s.lifeBonus;
    if (left <= span * 0.05 && !s.warned['95' + k] && left > 0) { s.warned['95' + k] = 1; emit && emit({ text: TEXT.old95, cls: 'warn' }); }
    else if (left <= span * 0.2 && !s.warned['80' + k] && left > 0) { s.warned['80' + k] = 1; emit && emit({ text: TEXT.old80, cls: 'warn' }); }
    if (s.age >= s.lifespan && !s.dead) { s.dead = true; s.ending = 'zuohua'; }
  }
  function gainMul(s) {
    let m = 1;
    if (s.inj > 0) { m *= 0.5; s.inj = Math.max(0, s.inj - 1 - gt(s, 'heal', 0)); }
    if (s.buff) { m *= s.buff.mul; if (--s.buff.n <= 0) s.buff = null; }
    return m;
  }
  // 心境：跌至谷底即走火入魔
  function checkXj(s, emit) {
    if (s.dead) return;
    if (s.xj <= 0) { s.dead = true; s.ending = 'rumo'; return; }
    if (s.xj < 15 && !s.warned.xjLow) { s.warned.xjLow = 1; emit && emit({ text: TEXT.xjLow, cls: 'warn' }); }
    if (s.xj >= 25) s.warned.xjLow = 0;
  }
  // 魔功：每次运功蚕食心境；心境低时闭关恐走火
  function moTick(s, heavy, tags, emit) {
    if (!gt(s, 'mo', 0)) return;
    const loss = K.moLoss[heavy ? 1 : 0];
    s.xj = clamp(s.xj - loss, 0, 100); tags.push({ t: `心境 −${loss}`, c: 'down' });
    if (heavy && s.xj < K.moRiskXj && Math.random() < (K.moRiskXj - s.xj) * K.moRisk) {
      if (s.xj < 12) { s.dead = true; s.ending = 'rumo'; return 'rumo'; }
      s.inj += 3; s.xw = Math.max(0, s.xw - Math.round(req(s) * 0.15)); s.xj = clamp(s.xj - 5, 0, 100);
      tags.push({ t: '走火', c: 'down' }, { t: '负伤', c: 'down' });
      return 'zouhuo';
    }
  }

  /* ---------- 行动 ---------- */
  function tuna(s, emit) {
    const r = REALMS[s.realm], mul = gainMul(s), tags = [];
    const g = unit(s) * K.tunaGain * (0.9 + Math.random() * 0.2) * mul * gfSpeed(s);
    const ups = bottleneck(s) ? (tags.push({ t: '瓶颈难破，修为难进' }), []) : addXw(s, g, tags);
    practice(s, 1, null, emit);
    moTick(s, 0, tags, emit);
    passTime(s, r.T * K.tunaMonths, emit);
    checkXj(s, emit);
    s.acts++;
    return { text: pick(TEXT.tuna).replace('{d}', cnDur(r.T * K.tunaMonths)), tags, ups };
  }
  function biguan(s, emit) {
    const r = REALMS[s.realm], mul = gainMul(s), tags = [];
    const pXm = clamp(0.06 + (50 - s.xj) / 400, 0.02, 0.22) * gt(s, 'xinmo', 1);
    const pDw = clamp(0.08 + s.luck * 0.006 + (s.wx - 5) * 0.012 + gt(s, 'dunwu', 0), 0.03, 0.4);
    const roll = Math.random(); let text = pick(TEXT.biguan).replace(/\{d\}/g, cnDur(r.T * K.biguanMonths)), cls = '', ups = [];
    passTime(s, r.T * K.biguanMonths, emit);
    if (roll < pXm) {
      text += pick(TEXT.xinmo); cls = 'warn';
      addXw(s, -req(s) * 0.12, tags); s.inj += 2; tags.push({ t: '负伤', c: 'down' });
      s.xj = clamp(s.xj - 6, 0, 100); tags.push({ t: '心境 −6', c: 'down' });
    } else {
      let g = unit(s) * K.biguanGain * (0.88 + Math.random() * 0.24) * mul * gfSpeed(s);
      if (roll > 1 - pDw) { g *= 1.6; text += pick(TEXT.dunwu); cls = 'gold'; if (Math.random() < 0.25 && s.wx < 10) { s.wx++; tags.push({ t: '悟性 +1', c: 'up' }); } }
      if (bottleneck(s)) tags.push({ t: '瓶颈难破，修为难进' }); else ups = addXw(s, g, tags);
      const xg = 1 + gt(s, 'xjGain', 0); s.xj = clamp(s.xj + xg, 0, 100);
    }
    practice(s, 3, null, emit);
    const mo = moTick(s, 1, tags, emit);
    if (mo === 'zouhuo') { text += pick(TEXT.zouhuo); cls = 'warn'; }
    checkXj(s, emit);
    s.acts++;
    return { text, tags, cls, ups };
  }

  /* ---------- 奇遇 ---------- */
  function eventOk(s, e) {
    if (e.rm && (s.realm < e.rm[0] || s.realm > e.rm[1])) return false;
    if (e.once && s.seen[e.id]) return false;
    return !e.cond || e.cond(s);
  }
  function pickEvent(s) {
    const recent = s.recent || [];
    let pool = EVENTS.filter(e => eventOk(s, e) && !recent.includes(e.id));
    if (!pool.length) pool = EVENTS.filter(e => eventOk(s, e));
    // 未见过的更易遇到；见得越多越稀；本境界专属的略受青睐
    const wt = e => (e.wf ? e.wf(s) : e.w) * (s.seen[e.id] ? 1 / (1 + s.seen[e.id] * 1.2) : 1.8) * (e.rm ? 1.3 : 1);
    let tot = pool.reduce((a, e) => a + wt(e), 0), x = Math.random() * tot, ev = pool[0];
    for (const e of pool) { if ((x -= wt(e)) < 0) { ev = e; break; } }
    s.recent = [...recent, ev.id].slice(-8);
    s.seen[ev.id] = (s.seen[ev.id] || 0) + 1;
    s.events++; s.acts++;
    return ev;
  }
  // 游历机缘：选择时暂借气运，正向修为收益放大
  function resolveChoice(s, c) {
    const q = gt(s, 'qiyu', 0), lb = Math.round(q * 10);
    s.luck += lb;
    let res; try { res = c.act(s); } finally { s.luck -= lb; }
    if (res.fx && res.fx.xw > 0 && q) res.fx = { ...res.fx, xw: res.fx.xw * (1 + q) };
    return res;
  }
  function applyFx(s, fx, emit) {
    const tags = []; let ups = [];
    if (fx.xw) ups = addXw(s, fx.xw * req(s), tags) || [];
    if (fx.ls) { const v = fx.lsRaw ? fx.ls : Math.round(fx.ls * REALMS[s.realm].lsScale); const before = s.ls; s.ls = Math.max(0, s.ls + v); const d = s.ls - before; if (d) tags.push({ t: `灵石 ${d > 0 ? '+' : '−'}${Math.abs(d)}`, c: d > 0 ? 'up' : 'down' }); }
    if (fx.life) { const v = Math.round(fx.life * LIFE_SCALE[s.realm]); s.lifeBonus += v; tags.push({ t: `寿元 ${v > 0 ? '+' : '−'}${Math.abs(v)}年`, c: v > 0 ? 'up' : 'down' }); }
    if (fx.xj) { const b = s.xj; s.xj = clamp(s.xj + fx.xj, 0, 100); const d = s.xj - b; if (d) tags.push({ t: `心境 ${d > 0 ? '+' : '−'}${Math.abs(d)}`, c: d > 0 ? 'up' : 'down' }); }
    if (fx.wx) { const b = s.wx; s.wx = clamp(s.wx + fx.wx, 1, 10); if (s.wx !== b) tags.push({ t: `悟性 ${fx.wx > 0 ? '+' : '−'}${Math.abs(s.wx - b)}`, c: fx.wx > 0 ? 'up' : 'down' }); }
    if (fx.luck) s.luck = clamp(s.luck + fx.luck, -5, 10);
    if (fx.inj) { s.inj += fx.inj; tags.push({ t: '负伤', c: 'down' }); }
    if (fx.item) for (const [k, n] of Object.entries(fx.item)) { s.items[k] = (s.items[k] || 0) + n; tags.push({ t: `得${k}${n > 1 ? '×' + n : ''}`, c: 'up' }); }
    if (fx.buff) { s.buff = { ...fx.buff }; tags.push({ t: '灵脉加持', c: 'up' }); }
    if (fx.gf) learn(s, fx.gf, tags, emit);
    if (fx.gfXp && s.gf) { practice(s, fx.gfXp, null, emit); tags.push({ t: `《${GONGFA[s.gf].name}》精进`, c: 'up' }); }
    if (fx.flag) s.flags[fx.flag] = 1;
    if (fx.time) passTime(s, fx.time, emit);
    if (fx.end && !s.dead) { s.dead = true; s.ending = fx.end; }
    checkXj(s, emit);
    return { tags, ups };
  }

  /* ---------- 破境 ---------- */
  function btChance(s, usePill) {
    return clamp(REALMS[s.realm].base + s.lg.bt + (s.xj - 50) / 250 + (usePill ? 0.2 : 0) + Math.min(0.12, s.fails * 0.04)
      - (s.inj > 0 ? 0.15 : 0) + s.luck * 0.005 + gt(s, 'bt', 0) + (s.gf ? (gfLv(s) - 1) * 0.004 : 0), 0.05, 0.95);
  }
  // 返回 {ok, text, ending}；会直接改写 s；宗门赐法等追加日志走 emit
  function resolveBreak(s, usePill, emit) {
    const r = REALMS[s.realm], from = s.realm, p = btChance(s, usePill), ok = Math.random() < p;
    if (usePill) { s.items[r.pill]--; if (s.items[r.pill] <= 0) delete s.items[r.pill]; }
    const btXj = gt(s, 'btXj', 0);
    s.acts++;
    if (ok) {
      if (from === 4) { s.ascended = true; s.ending = 'ascend'; sync(s); return { ok, from, text: TEXT.btSuccess[from] }; }
      s.realm++; s.stage = 0; s.xw = 0; s.fails = 0; s.inj = 0; s.bnLogged = false; s.xj = clamp(s.xj + 5 - btXj, 0, 100);
      sync(s);
      const text = TEXT.btSuccess[from] + `寿元增至${cn(s.lifespan)}载。` + (btXj ? TEXT.wangqingCost : '');
      sectReward(s, emit);
      checkXj(s, emit);
      return { ok, from, text };
    }
    // 高境界破境失败，可能身死道消；身怀兵解玉符者兵解转修
    const pd = K.btDeath[from] * (s.inj > 0 ? 1.3 : 1) * (1 - Math.min(0.4, Math.max(0, s.luck) * 0.04));
    if (Math.random() < pd) {
      s.dead = true;
      if (s.items['兵解玉符'] > 0) { s.items['兵解玉符']--; s.ending = 'bingjie'; return { ok, from, text: TEXT.bingjie, ending: 'bingjie' }; }
      s.ending = 'yunluo'; return { ok, from, text: TEXT.yunluo[from === 4 ? 1 : 0], ending: 'yunluo' };
    }
    const fText = pick(TEXT.btFail);
    s.xw = Math.round(req(s) * (0.6 + Math.random() * 0.15)); s.inj += 3; s.xj = clamp(s.xj - 4, 0, 100); s.fails++; s.bnLogged = false;
    passTime(s, r.T * 6, emit);
    if (gt(s, 'mo', 0) && s.xj < 15 && !s.dead) { s.dead = true; s.ending = 'rumo'; return { ok, from, text: fText + TEXT.rumoBreak, ending: 'rumo' }; }
    checkXj(s, emit);
    return { ok, from, text: fText + `休养${cnDur(r.T * 6)}，方能再试。`, ending: s.dead ? s.ending : null };
  }
  function sectReward(s, emit) {
    if (s.lg.id === 'wei' || s.flags.leftSect) return;
    const tier = GF_SECT[s.realm]; if (!tier) return;
    if (s.realm === 2 && !['tian', 'yi', 'shuang'].includes(s.lg.id)) return;
    const el = ELEMENTS.includes(s.lgEls[0]) ? s.lgEls[0] : pick(ELEMENTS);
    const id = tier[el]; if (s.gfs[id]) return;
    const tags = []; learn(s, id, tags, emit);
    emit({ title: '宗门赐法', text: TEXT.sectGift[s.realm === 1 ? 0 : 1].replace('{g}', GONGFA[id].name), tags, cls: 'gold', div: true });
  }

  /* ---------- 物品 ---------- */
  function useItem(s, k) {
    if (!(s.items[k] > 0)) return { err: '无此物' };
    const tags = []; let text = '', ups = [];
    if (k === '聚气丹') {
      if (bottleneck(s)) return { err: '瓶颈当前，丹药无益' };
      ups = addXw(s, unit(s) * 0.35, tags) || []; text = '丹药入腹，化作一股温润灵流，沿经脉缓缓散开。';
    } else if (k === '回春丹') {
      if (s.inj <= 0) return { err: '身无伤患，留待日后' };
      s.inj = 0; s.xj = clamp(s.xj + 2, 0, 100); tags.push({ t: '伤势痊愈', c: 'up' }); text = '回春丹化开，周身暖意融融，旧伤处的隐痛渐渐消散。';
    } else if (k === '延寿果') {
      const v = Math.round(5 * LIFE_SCALE[s.realm] * 2); s.lifeBonus += v; tags.push({ t: `寿元 +${v}年`, c: 'up' }); text = '朱果入口即化，一股勃勃生机自丹田升起，鬓边白发竟转青了几根。';
    } else if (k === '清心丹') {
      s.xj = clamp(s.xj + 15, 0, 100); s.warned.xjLow = 0; tags.push({ t: '心境 +15', c: 'up' }); text = '清心丹入口微苦，回甘如泉。心头那团乱麻，被一根根理顺了。';
    } else return { err: '此物不可服用' };
    s.items[k]--; if (s.items[k] <= 0) delete s.items[k];
    sync(s);
    return { text, tags, ups };
  }

  /* ---------- 新卷 / 旧卷迁移 ---------- */
  function newState(name, r, legacy) {
    const s = { v: SAVE_V, name, lg: { id: r.lg.id, name: r.lg.name, mult: r.lg.mult, bt: r.lg.bt, sect: r.lg.sect }, lgEls: r.els,
      wx: r.wx, xj: 50, luck: r.luck, ls: 10, realm: 0, stage: 0, xw: 0, months: 16 * 12, lifeBonus: 0,
      inj: 0, buff: null, items: {}, flags: {}, fails: 0, events: 0, log: [], warned: {}, dead: false, ascended: false, bnLogged: false,
      gf: null, gfs: {}, seen: {}, recent: [], acts: 0, ending: null };
    if (r.lg.id !== 'wei') { s.gf = 'qingming'; s.gfs.qingming = { lv: 1, xp: 0 }; }
    if (legacy) { s.wx = clamp(s.wx + (legacy.wx || 0), 1, 10); s.flags.legacy = 1; }
    sync(s); return s;
  }
  function migrate(s) {
    if (!s) return null;
    if (s.v === 1) {
      s.v = 2;
      s.gfs = {}; s.seen = {}; s.acts = s.acts || 0; s.ending = s.dead ? 'zuohua' : s.ascended ? 'ascend' : null;
      s.gf = null; s.xw = Math.round(s.xw * K.reqMul[s.realm]);
      if (s.lg.id !== 'wei') { s.gf = 'qingming'; s.gfs.qingming = { lv: Math.min(GF_LAYERS, 1 + s.realm * 2), xp: 0 }; }
      (s.recent || []).forEach(id => s.seen[id] = 1);
    }
    if (s.v !== SAVE_V) return null;
    s.gfs = s.gfs || {}; s.seen = s.seen || {}; s.recent = s.recent || []; s.warned = s.warned || {}; s.flags = s.flags || {};
    sync(s); return s;
  }
  function retire(s) { s.dead = true; s.ending = 'guiyin'; }
  const canRetire = s => !s.dead && !s.ascended && (s.realm >= 2 || s.age >= 100);

  return { K, LIFE_SCALE, clamp, pick, gf, gt, sync, req, unit, isLast, bottleneck, realmStr, timeLabel, fmtNum,
    gfMatch, gfMatchWord, gfLv, gfSpeed, learn, practice, switchCost, switchGf,
    addXw, afterGain, passTime, gainMul, checkXj, tuna, biguan, pickEvent, resolveChoice, applyFx,
    btChance, resolveBreak, useItem, newState, migrate, retire, canRetire };
})();
if (typeof module !== 'undefined') module.exports = Core;
