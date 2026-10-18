/* 墨仙录 · 规则核心（无 DOM，游戏与模拟器共用） */
'use strict';
const Core = (() => {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const LIFE_SCALE = [1, 1.5, 2.5, 4, 6];
  const SAVE_V = 4;
  // 调参入口（模拟器会改写这里）
  const K = {
    tunaGain: 0.5, biguanGain: 1.7, tunaMonths: 3, biguanMonths: 12, youliMonths: 3,
    noGf: 0.75, mismatch: 0.85, yiElemental: 0.9, yiOwn: 1.4, wuxingPer: 0.07,
    match: { tian: 1.35, shuang: 1.25, san: 1.18, si: 1.1, wei: 1.05, yi: 1.0 },
    layerBonus: 0.04, xpNeed: lv => 3 + lv * 2,
    btDeath: [0, 0, 0.05, 0.14, 0.3],
    moLoss: [1, 2], moRiskXj: 30, moRisk: 0.008,
    reqMul: [4.3, 5.0, 5.6, 6.7, 7.4], lifeMul: [1.0, 1.0, 1.0, 0.9, 0.95],
    rootLife: { si: 1.04, wei: 1.08 },   // 驳杂灵根，气血反而绵长些
    payYears: 2, dabiYears: 55, mYears: 3, mXw: 0.05, stipendPill: [0, 0, 0, 0.05, 0.08, 0.1, 0.12], freeQiyu: 0.12,
  };

  /* ---------- 基础 ---------- */
  function gf(s) { return s.gf ? GONGFA[s.gf] : null; }
  function gt(s, key, dflt) { const g = gf(s); return g && g.t[key] != null ? g.t[key] : dflt; }
  function sync(s) {
    s.age = Math.floor(s.months / 12);
    s.lifespan = Math.round(REALMS[s.realm].life * K.lifeMul[s.realm] * (K.rootLife[s.lg.id] || 1) * (1 + gt(s, 'life', 0)) + s.lifeBonus);
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
  // 转修：散去旧功（旧功跌一层），耗修为、心境与光阴；修为不足者以光阴补足
  function switchCost(s, id) {
    const xw = Math.round(req(s) * 0.25), T = REALMS[s.realm].T;
    const short = Math.max(0, xw - s.xw);
    const perMonth = unit(s) * K.biguanGain * gfSpeed(s, id || s.gf) / (K.biguanMonths * T);
    const extra = short > 0 ? Math.ceil(short / Math.max(1, perMonth) / T) * T : 0;
    return { xw, lose: Math.min(xw, Math.max(0, Math.round(s.xw))), xj: 6, months: 6 * T, extra, layer: s.gf && s.gfs[s.gf] && s.gfs[s.gf].lv > 1 ? 1 : 0 };
  }
  function switchGf(s, id, emit) {
    if (!s.gfs[id] || s.gf === id) return false;
    const c = switchCost(s, id), old = s.gf;
    if (old && c.layer) s.gfs[old].lv -= 1;
    s.gf = id; s.xw = Math.max(0, s.xw - c.xw); s.xj = clamp(s.xj - c.xj, 0, 100);
    s.bnLogged = false;
    passTime(s, c.months + c.extra, emit);
    const tags = [...(c.lose ? [{ t: `修为 −${fmtNum(c.lose)}`, c: 'down' }] : []), ...(c.extra ? [{ t: `补足根基 ${cnDur(c.extra)}`, c: 'down' }] : []), { t: `心境 −${c.xj}`, c: 'down' }];
    if (old && c.layer) tags.push({ t: `《${GONGFA[old].name}》跌落一层`, c: 'down' });
    emit && emit({ title: '转修', text: (old ? `你散去《${GONGFA[old].name}》的周天路数，改修《${GONGFA[id].name}》。经脉逆转之痛，如抽丝剥茧，${cnDur(c.months + c.extra)}方定。` : `你改修《${GONGFA[id].name}》。`) + (c.extra ? '修为本就浅薄，散功之后，几乎是从头来过。' : ''),
      tags, cls: 'event', div: true });
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
    if (!s.dead) sectTick(s, emit);
    if (!s.dead && typeof Jianghu !== 'undefined') Jianghu.tick(s, emit);
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
      let g = unit(s) * K.biguanGain * (0.88 + Math.random() * 0.24) * mul * gfSpeed(s) * caveMul(s);
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
  function pickEvent(s, filt, wmul) {
    const recent = s.recent || [], ok = e => eventOk(s, e) && (!filt || filt(e));
    let pool = EVENTS.filter(e => ok(e) && !recent.includes(e.id));
    if (!pool.length) pool = EVENTS.filter(ok);
    if (!pool.length) pool = EVENTS.filter(e => eventOk(s, e));
    // 未见过的更易遇到；见得越多越稀；本境界专属的略受青睐
    const wt = e => (e.wf ? e.wf(s) : e.w) * (s.seen[e.id] ? 1 / (1 + s.seen[e.id] * 1.2) : 1.8) * (e.rm ? 1.3 : 1) * (wmul ? wmul(e) : 1);
    let tot = pool.reduce((a, e) => a + wt(e), 0), x = Math.random() * tot, ev = pool[0];
    for (const e of pool) { if ((x -= wt(e)) < 0) { ev = e; break; } }
    s.recent = [...recent, ev.id].slice(-8);
    s.seen[ev.id] = (s.seen[ev.id] || 0) + 1;
    s.events++; s.acts++; s.evFoe = null;
    return ev;
  }
  // 游历机缘：选择时暂借气运，正向修为收益放大
  function resolveChoice(s, c) {
    const q = gt(s, 'qiyu', 0) + (s.sect && s.sect.free ? K.freeQiyu : 0), lb = Math.round(q * 10);
    s.luck += lb;
    let res; try { res = c.act(s); } finally { s.luck -= lb; s.evFoe = null; }
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
    if (fx.item) for (const [k, n] of Object.entries(fx.item)) {
      s.items[k] = Math.max(0, (s.items[k] || 0) + n); if (!s.items[k]) delete s.items[k];
      tags.push(n > 0 ? { t: `得${k}${n > 1 ? '×' + n : ''}`, c: 'up' } : { t: `失${k}`, c: 'down' });
    }
    if (fx.join) join(s, fx.join, tags);
    if (fx.free) { s.sect.free = true; tags.push({ t: '逍遥 · 游历机缘更盛', c: 'up' }); }
    if (fx.gx && s.sect.org) addGx(s, fx.gx, tags);
    if (fx.npc) for (const [id, d] of Object.entries(fx.npc)) npcAdd(s, id, d, tags);
    if (fx.buff) { s.buff = { ...fx.buff }; tags.push({ t: '灵脉加持', c: 'up' }); }
    if (fx.gf) learn(s, fx.gf, tags, emit);
    if (fx.gfXp && s.gf) { practice(s, fx.gfXp, null, emit); tags.push({ t: `《${GONGFA[s.gf].name}》精进`, c: 'up' }); }
    if (fx.flag) s.flags[fx.flag] = 1;
    if (typeof Jianghu !== 'undefined') Jianghu.fx(s, fx, tags);
    if (fx.time) passTime(s, fx.time, emit);
    if (fx.end && !s.dead) { s.dead = true; s.ending = fx.end; }
    checkXj(s, emit);
    return { tags, ups };
  }

  /* ---------- 破境 ---------- */
  function btChance(s, usePill) {
    return clamp(REALMS[s.realm].base + s.lg.bt + (s.xj - 50) / 250 + (usePill ? 0.2 : 0) + Math.min(0.12, s.fails * 0.04)
      - (s.inj > 0 ? 0.15 : 0) + (s.btBuff || 0) + s.luck * 0.005 + gt(s, 'bt', 0) + (s.gf ? (gfLv(s) - 1) * 0.004 : 0) + npcHelp(s).bt, 0.05, 0.95);
  }
  // 返回 {ok, text, ending}；会直接改写 s；宗门赐法等追加日志走 emit
  function resolveBreak(s, usePill, emit) {
    const r = REALMS[s.realm], from = s.realm, p = btChance(s, usePill), ok = Math.random() < p;
    if (usePill) { s.items[r.pill]--; if (s.items[r.pill] <= 0) delete s.items[r.pill]; }
    s.btBuff = 0;
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
    if (!s.sect || s.sect.org !== 'qm') return;
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
    } else {
      const j = typeof Jianghu !== 'undefined' && Jianghu.useItem(s, k, tags);
      if (!j) return { err: '此物不可服用' };
      if (j.err) return j;
      text = j.text; ups = j.ups || [];
    }
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
    s.sect = initSect(s, r.lg.id === 'wei' ? null : 'qm', START_RANK[r.lg.id]); s.npc = initNpc(s);
    if (typeof Jianghu !== 'undefined') Jianghu.init(s);
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
    if (s.v === 2) {
      s.v = 3;
      const org = s.lg.id === 'wei' ? null : 'qm';
      const rank = org ? Math.max(START_RANK[s.lg.id], Math.min(s.realm, 3)) : -1;
      s.sect = initSect(s, org, rank); s.sect.gxTotal = org ? RANK_REQ[rank].gx : 0; s.npc = initNpc(s);
      // v0.6 → v0.7 平衡调整：修为按所需比例换算，寿元只增不减
      const V6_REQ = [6.5, 7.5, 8.5, 10, 11], V6_LIFE = [1.3, 1.45, 1.55, 1.6, 1.65];
      s.xw = Math.round(s.xw * K.reqMul[s.realm] / V6_REQ[s.realm]);
      const oldLife = Math.round(REALMS[s.realm].life * V6_LIFE[s.realm] * (1 + gt(s, 'life', 0)) + (s.lifeBonus || 0));
      sync(s); if (oldLife > s.lifespan) s.lifeBonus = (s.lifeBonus || 0) + oldLife - s.lifespan;
    }
    if (s.v === 3) {   // v0.7 → v0.8：江湖字段；寿元公式调整，旧档寿元原样保留
      const oldLife = s.lifespan; s.v = 4; if (typeof Jianghu !== 'undefined') Jianghu.init(s);
      sync(s); if (oldLife > s.lifespan) { s.lifeBonus = (s.lifeBonus || 0) + oldLife - s.lifespan; sync(s); }
    }
    if (s.v !== SAVE_V) return null;
    s.gfs = s.gfs || {}; s.seen = s.seen || {}; s.recent = s.recent || []; s.warned = s.warned || {}; s.flags = s.flags || {};
    sync(s); return s;
  }
  function retire(s) { s.dead = true; s.ending = 'guiyin'; }
  const canRetire = s => !s.dead && !s.ascended && (s.realm >= 2 || s.age >= 100);

  /* ---------- 敌我：按境界高下结算 ---------- */
  const lvl = (r, st) => r + st / REALMS[r].stages.length;
  function shiftLv(s, d) {
    let r = s.realm, st = s.stage + d;
    while (st >= REALMS[r].stages.length && r < 4) { st -= REALMS[r].stages.length; r++; }
    while (st < 0 && r > 0) { r--; st += REALMS[r].stages.length; }
    return { realm: r, stage: clamp(st, 0, REALMS[r].stages.length - 1) };
  }
  // 事件开场时掷定敌手：{rel:n} 相对玩家 n 个小境界；{realm, stage} 固定境界
  function rollFoe(s, spec) { const f = typeof spec === 'function' ? spec(s) : spec; s.evFoe = f.rel != null ? shiftLv(s, f.rel) : { realm: f.realm, stage: f.stage || 0 }; return s.evFoe; }
  const foe = s => s.evFoe || { realm: s.realm, stage: s.stage };
  const foeStr = (s, f = foe(s)) => REALMS[f.realm].name + REALMS[f.realm].stages[f.stage];
  const foeDr = (s, f = foe(s)) => s.realm - f.realm;
  function scaleFx(fx, k, lsK) {
    const o = { ...fx };
    if (o.xw > 0) o.xw = +(o.xw * k).toFixed(3);
    if (o.ls > 0 && !o.lsRaw) o.ls = Math.max(1, Math.round(o.ls * lsK));
    for (const bad of ['inj']) delete o[bad];
    if (o.life < 0) delete o.life;
    if (o.xj < 0) delete o.xj;
    return o;
  }
  // o: {name, base, win:{text,fx}, lose:{text,fx}, crush?:text, dominant?:text, foe?}
  function fightAct(s, o) {
    const f = o.foe ? rollFoe(s, o.foe) : foe(s), dr = s.realm - f.realm, gap = lvl(s.realm, s.stage) - lvl(f.realm, f.stage);
    const nm = o.name || '对手', lsK = REALMS[f.realm].lsScale / REALMS[s.realm].lsScale;
    const meta = { gap: +gap.toFixed(2), dr, foe: foeStr(s, f) };
    if (dr >= 2) return { text: (o.crush || pick(TEXT.crush)).replace(/\{f\}/g, nm), fx: { ...scaleFx(o.win.fx, 0, lsK), ...(o.crushFx || {}) }, fight: { ...meta, tier: 'crush' } };
    if (dr === 1) return { text: (o.dominant || pick(TEXT.dominant)).replace(/\{f\}/g, nm) + (o.dominantTail ? o.dominantTail : ''), fx: scaleFx(o.win.fx, 0.25, lsK), fight: { ...meta, tier: 'dominant' } };
    const p = clamp(o.base + clamp(gap * 0.6, -0.3, 0.3), 0.05, 0.95);
    const won = Math.random() < p;
    const r = won ? o.win : o.lose;
    return { text: fnv(r.text, s), fx: r.fx, fight: { ...meta, tier: won ? 'win' : 'lose', p: +p.toFixed(2) } };
  }

  /* ---------- 宗门 ---------- */
  const org = s => (s.sect && s.sect.org ? ORGS[s.sect.org] : null);
  const rankName = s => { const o = org(s); return o ? o.ranks[s.sect.rank] : s.sect && s.sect.free ? '逍遥散修' : '散修'; };
  const caveMul = s => { const o = org(s); return o ? o.cave[s.sect.rank] : 1; };
  const payEvery = s => 12 * REALMS[s.realm].T * K.payYears;
  const dabiEvery = s => 12 * REALMS[s.realm].T * K.dabiYears;
  function initSect(s, o, rank) {
    return { org: o, rank: o ? rank : -1, gx: 0, gxTotal: 0, free: false, master: !!(o === 'qm' && rank >= 2),
      missions: [], mAt: -1, uid: 0, payAt: s.months + payEvery(s), dabiAt: s.months + dabiEvery(s) * 0.4, dabiDue: false,
      dabiN: 0, dabiBest: -1, done: 0, promoLogged: -1 };
  }
  function initNpc(s) {
    const n = {};
    for (const id in NPCS) n[id] = { a: NPCS[id].a0, met: false };
    if (s.sect.org === 'qm') { ['lu', 'su', 'wen', 'shi'].forEach(id => n[id].met = true); if (s.sect.master) n.shifu.met = true; }
    return n;
  }
  function join(s, o, tags) {
    s.sect.org = o; s.sect.rank = 1; s.sect.missions = []; s.sect.mAt = -1;
    s.sect.payAt = s.months + payEvery(s); s.sect.dabiAt = s.months + dabiEvery(s) * 0.6;
    if (o === 'qm') ['lu', 'su', 'wen', 'shi'].forEach(id => s.npc[id].met = true);
    tags && tags.push({ t: `入${ORGS[o].name} · ${ORGS[o].ranks[1]}`, c: 'up' });
  }
  function addGx(s, base, tags) {
    const v = Math.round(base * GX_SCALE[s.realm]);
    s.sect.gx = Math.max(0, s.sect.gx + v); if (v > 0) s.sect.gxTotal += v;
    tags && tags.push({ t: `贡献 ${v >= 0 ? '+' : '−'}${Math.abs(v)}`, c: v >= 0 ? 'up' : 'down' });
    return v;
  }
  function npcAdd(s, id, d, tags) {
    const n = s.npc[id]; if (!n) return;
    const first = !n.met; n.met = true;
    n.a = clamp(n.a + d, -100, 100);
    if (tags && d) tags.push({ t: `${NPCS[id].name} ${d > 0 ? '情谊 +' + d : '情谊 −' + (-d)}`, c: d > 0 ? 'up' : 'down' });
    else if (tags && first) tags.push({ t: `结识${NPCS[id].name}`, c: 'up' });
  }
  const npcWord = a => a <= -40 ? '仇怨' : a <= -10 ? '嫌隙' : a < 20 ? '泛泛' : a < 50 ? '相善' : a < 80 ? '交厚' : '莫逆';
  const npcLine = (s, id) => NPC_LINE[id][s.npc[id].a < 0 ? 0 : s.npc[id].a < 45 ? 1 : 2];
  function npcHelp(s) {
    const n = s.npc || {}, who = []; let bt = 0;
    if (s.sect && s.sect.master && n.shifu && n.shifu.a >= 50) { bt += 0.05; who.push('shifu'); }
    if (n.su && n.su.met && n.su.a >= 50) { bt += 0.03; who.push('su'); }
    if (n.shi && n.shi.met && n.shi.a >= 60) { bt += 0.02; who.push('shi'); }
    if (n.lu && n.lu.met && n.lu.a >= 70) { bt += 0.02; who.push('lu'); }
    return { bt, who };
  }
  function canPromote(s) {
    const o = org(s); if (!o || s.sect.rank >= 6) return { ok: false };
    const r = RANK_REQ[s.sect.rank + 1];
    const realmOk = s.realm > r.realm || (s.realm === r.realm && s.stage >= (r.stage || 0));
    return { ok: s.sect.gxTotal >= r.gx && realmOk, gxOk: s.sect.gxTotal >= r.gx, realmOk, need: r, next: o.ranks[s.sect.rank + 1] };
  }
  function promote(s, emit) {
    const c = canPromote(s); if (!c.ok) return null;
    const o = org(s), tags = [];
    s.sect.rank++;
    tags.push({ t: `晋${o.ranks[s.sect.rank]}`, c: 'up' });
    if (o.id === 'qm' && s.sect.rank === 2 && !s.sect.master) { s.sect.master = true; s.npc.shifu.met = true; tags.push({ t: '拜入玄微真人门下', c: 'up' }); }
    if (o.id === 'qm' && s.sect.rank === 3 && s.npc.shifu.a >= 40) {
      const id = GF_SECT[2][ELEMENTS.includes(s.lgEls[0]) ? s.lgEls[0] : pick(ELEMENTS)];
      if (!s.gfs[id]) { learn(s, id, tags, emit); tags.push({ t: '师父传法', c: 'up' }); }
    }
    s.acts++;
    return { rank: s.sect.rank, name: o.ranks[s.sect.rank], token: o.token[s.sect.rank], text: RITE_TEXT[o.id][s.sect.rank], tags };
  }
  function sectTick(s, emit) {
    const o = org(s); if (!o) return;
    const sc = s.sect;
    while (s.months >= sc.payAt) {
      sc.payAt += payEvery(s);
      const ls = Math.round(o.ls[sc.rank] * REALMS[s.realm].lsScale), tags = [{ t: `灵石 +${ls}`, c: 'up' }];
      s.ls += ls;
      if (sc.rank >= 2 && Math.random() < 0.25) { s.items['聚气丹'] = (s.items['聚气丹'] || 0) + 1; tags.push({ t: '得聚气丹', c: 'up' }); }
      if (Math.random() < K.stipendPill[sc.rank]) { const pl = REALMS[s.realm].pill; s.items[pl] = (s.items[pl] || 0) + 1; tags.push({ t: `得${pl}`, c: 'up' }); }
      emit && emit({ text: `${o.id === 'qm' ? '宗门' : '盟中'}按例发下${o.ranks[sc.rank]}的俸禄。`, tags, cls: 'sys' });
      if (s.npc.su.met && s.npc.su.a >= 40 && Math.random() < 0.25) {
        const k = s.inj > 0 ? '回春丹' : '聚气丹'; s.items[k] = (s.items[k] || 0) + 1;
        emit && emit({ text: `苏晚晴托人捎来一只小瓷瓶，瓶底压着一张字条：“${s.inj > 0 ? '伤好之前，不许逞强。' : '修行莫太急。'}”`, tags: [{ t: `得${k}`, c: 'up' }], cls: 'sys' });
      }
    }
    if (s.months >= sc.dabiAt) {
      sc.dabiAt = s.months + dabiEvery(s);
      if (sc.rank <= 3) { sc.dabiDue = true; emit && emit({ text: `${o.dabi}将启。山门内外张灯结彩，演武台上的青石被扫得一尘不染。`, cls: 'warn' }); }
      else { const tags = []; addGx(s, 10, tags); emit && emit({ text: `${o.dabi}如期而开。你以${o.ranks[sc.rank]}之身列席观礼，看台下少年们意气飞扬，恍如看见当年的自己。`, tags, cls: 'sys' }); }
    }
    const c = canPromote(s);
    if (c.ok && sc.promoLogged !== sc.rank) { sc.promoLogged = sc.rank; emit && emit({ text: PROMO_LOG.replace('{r}', c.next), cls: 'gold' }); }
  }
  /* 宗门任务 */
  function missionPool(s) {
    return MISSIONS.filter(m => s.sect.rank >= m.rank[0] && s.sect.rank <= m.rank[1] && (!m.rm || (s.realm >= m.rm[0] && s.realm <= m.rm[1])));
  }
  function ensureMissions(s) {
    const sc = s.sect; if (!sc.org) return [];
    const every = 12 * REALMS[s.realm].T * K.mYears;
    if (sc.mAt < 0 || s.months - sc.mAt >= every || !sc.missions.length || sc.missions.some(x => !missionPool(s).find(m => m.id === x.id))) {
      sc.mAt = s.months;
      const pool = missionPool(s).slice(), n = sc.rank >= 3 ? 4 : 3, out = [];
      while (out.length < n && pool.length) {
        let tot = pool.reduce((a, m) => a + m.w, 0), x = Math.random() * tot, i = 0;
        for (; i < pool.length - 1; i++) if ((x -= pool[i].w) < 0) break;
        out.push({ uid: ++sc.uid, id: pool[i].id }); pool.splice(i, 1);
      }
      sc.missions = out;
    }
    return sc.missions;
  }
  const fnv = (v, s) => typeof v === 'function' ? v(s) : v;
  const riskWord = r => r < 0.1 ? '平稳' : r < 0.22 ? '小险' : r < 0.38 ? '凶险' : '九死一生';
  function missionBonus(s, m) {
    return (s.wx - 5) * 0.012 + s.luck * 0.01 + (s.gf ? (gfLv(s) - 1) * 0.006 : 0) + s.stage * 0.01
      + (m.fight && s.gf && ['baihong', 'taibai'].includes(s.gf) ? 0.06 : 0) - (s.inj > 0 ? 0.08 : 0);
  }
  const missionRisk = (s, m, c) => clamp(m.risk + ((c && c.risk) || 0) - missionBonus(s, m), 0.03, 0.9);
  function missionInfo(s, mi) {
    const m = MISSIONS.find(x => x.id === mi.id), o = org(s);
    return { m, uid: mi.uid, name: o.id === 'sx' && SX_MISSION_NAME[m.id] ? SX_MISSION_NAME[m.id] : m.name, brief: fnv(m.brief, s),
      months: m.m * REALMS[s.realm].T, risk: missionRisk(s, m), riskWord: riskWord(missionRisk(s, m)),
      gx: Math.round(m.gx * GX_SCALE[s.realm]), ls: Math.round(m.ls * REALMS[s.realm].lsScale * o.lsMul) };
  }
  function missionEvent(s, uid) {
    const mi = s.sect.missions.find(x => x.uid === uid); if (!mi) return null;
    const info = missionInfo(s, mi), m = info.m;
    return { id: 'm_' + m.id, title: info.name, seal: m.seal, mission: true, text: () => m.text(s),
      choices: () => m.choices(s).map(c => ({ label: c.label, sub: (c.sub ? c.sub + ' · ' : '') + riskWord(missionRisk(s, m, c)), act: s2 => missionAct(s2, uid, m, c) })) };
  }
  function missionAct(s, uid, m, c) {
    s.sect.missions = s.sect.missions.filter(x => x.uid !== uid);
    s.sect.done++; s.acts++;
    const T = REALMS[s.realm].T, ok = Math.random() >= missionRisk(s, m, c), o = org(s);
    const fx = { time: (m.m + (c.time || 0)) * T };
    let text;
    if (ok) {
      fx.gx = m.gx * (c.gxm || 1); fx.xw = K.mXw;
      fx.ls = Math.round(m.ls * (c.lsm || 1) * o.lsMul * REALMS[s.realm].lsScale); fx.lsRaw = true;
      if (c.item) fx.item = fnv(c.item, s);
      for (const k of ['xj', 'wx', 'gfXp', 'npc']) if (c[k]) fx[k] = c[k];
      if (c.xw) fx.xw += c.xw;
      text = fnv(c.ok, s);
      if (s.npc.wen.met && s.npc.wen.a <= -20 && Math.random() < 0.3) { fx.gx /= 2; text += '只是功劳簿上，这桩差事的一半，不知怎的记在了温庭玉名下。'; }
    } else {
      const f = c.ffx || {};
      fx.gx = m.gx * (f.gx != null ? f.gx : 0.2);
      if (f.inj) fx.inj = f.inj; if (f.xj) fx.xj = f.xj;
      if (c.failNpc) fx.npc = c.failNpc;
      text = fnv(c.fail, s);
    }
    return { text, fx, ok, ...(m.fight || c.fight ? { fight: { dr: 0, gap: 0, foe: '同阶', tier: ok ? 'win' : 'lose' } } : {}) };
  }
  /* 藏经阁 */
  function libList(s) {
    const cap = s.sect.org ? RANK_LIB[s.sect.rank] : -1;
    return LIB_POOL.map(id => ({ id, g: GONGFA[id], cost: LIB_COST[GONGFA[id].grade], known: !!s.gfs[id], open: GONGFA[id].grade <= cap }))
      .sort((a, b) => a.g.grade - b.g.grade);
  }
  function learnLib(s, id, emit) {
    const it = libList(s).find(x => x.id === id);
    if (!it || !it.open) return { err: '位阶不足，不得入此层' };
    if (it.known) return { err: '此法已在胸中' };
    if (s.sect.gx < it.cost) return { err: '贡献不足' };
    s.sect.gx -= it.cost; const tags = [{ t: `贡献 −${it.cost}`, c: 'down' }];
    learn(s, id, tags, emit); s.acts++;
    return { tags };
  }
  /* 大比：攻克术、术克守、守克攻；奇招一搏 */
  const BEATS = { gong: 'shu', shu: 'shou', shou: 'gong' };
  const isSword = s => !!(s.gf && ['baihong', 'taibai'].includes(s.gf));
  function duelPower(s) {
    return Math.sqrt(gfSpeed(s) / 1.2) * (1 + 0.02 * (gfLv(s) - 1)) * (1 + 0.03 * (s.wx - 5))
      * (1 + 0.05 * s.stage / Math.max(1, REALMS[s.realm].stages.length - 1)) * (s.inj > 0 ? 0.85 : 1);
  }
  function dabiNew(s) {
    s.sect.dabiDue = false;
    const metIds = ['shi', 'su', 'wen', 'lu'].filter(id => s.npc[id].met && s.sect.org === 'qm');
    const gen = (q) => ({ name: (s.sect.org === 'qm' ? '内门 · ' : '散修 · ') + pick(NAMES_XING) + pick(NAMES_MING), npc: null, style: pick(['gang', 'wen', 'gui']), rel: 0.7, q });
    const fromNpc = (id, q) => {
      const n = NPCS[id]; let qq = q;
      if (id === 'lu') qq += s.npc.lu.a < 0 ? 0.06 : 0;
      if (id === 'su' && s.npc.su.a >= 60) qq -= 0.08;
      if (id === 'shi') qq = Math.min(qq, 0.82);
      return { name: n.name, npc: id, style: n.style, rel: n.rel, q: qq };
    };
    const lift = s.sect.rank >= 3 ? 0.05 : 0, jit = () => 0.95 + Math.random() * 0.1;
    const r0 = metIds.includes('shi') && Math.random() < 0.4 ? fromNpc('shi', 0.85) : gen(0.84 * jit() + lift);
    const mid = metIds.filter(id => id === 'su' || id === 'wen');
    const r1 = mid.length && Math.random() < 0.7 ? fromNpc(pick(mid), 0.99 * jit() + lift) : gen(0.99 * jit() + lift);
    const r2 = metIds.includes('lu') ? fromNpc('lu', 1.1 * jit() + lift) : gen(1.12 * jit() + lift);
    return { round: 0, opps: [r0, r1, r2], place: -1 };
  }
  function duelNew(s, opp) {
    const P = duelPower(s);
    return { hp: [3, 3], qi: [1, 1], round: 0, P, Q: P * opp.q, opp, sword: isSword(s), over: null, next: null };
  }
  function duelTell(d) {
    const w = DUEL_STYLE[d.opp.style].slice(); if (!d.qi[1]) w[3] = 0;
    const ids = ['gong', 'shou', 'shu', 'qi']; let tot = w.reduce((a, b) => a + b, 0), x = Math.random() * tot, o = 'gong';
    for (let i = 0; i < 4; i++) if ((x -= w[i]) < 0) { o = ids[i]; break; }
    d.next = o;
    let tell = o;
    if (Math.random() > d.opp.rel) { const oth = ids.filter(i => i !== o && (i !== 'qi' || d.qi[1])); tell = pick(oth); }
    const lines = (DUEL_TELL[d.opp.npc] || DUEL_TELL._)[tell] || DUEL_TELL._[tell];
    return { tell, line: pick(lines).replace('对手', d.opp.npc ? NPCS[d.opp.npc].name : '对手') };
  }
  function duelRound(s, d, m) {
    const o = d.next, r = d.P / d.Q, dmg = [0, 0], on = d.opp.name.replace(/^.* · /, '');
    let kind, text;
    if (m === 'qi') d.qi[0] = 0; if (o === 'qi') d.qi[1] = 0;
    if (m === 'qi' && o === 'qi') { kind = 'clash'; text = DUEL_TEXT.clash.qi; if (Math.random() < clamp(0.5 + (r - 1), 0.2, 0.8)) dmg[0] = 1; else dmg[1] = 1; }
    else if (m === 'qi') {
      const p = clamp(0.5 + (r - 1) * 0.8 + (s.wx - 5) * 0.02 + (d.sword ? 0.1 : 0), 0.2, 0.85);
      if (Math.random() < p) { kind = 'qiwin'; dmg[0] = 2; text = d.sword ? DUEL_TEXT.qiWinJian : DUEL_TEXT.qiWin; } else { kind = 'qilose'; dmg[1] = 1; text = DUEL_TEXT.qiLose; }
    } else if (o === 'qi') {
      if (Math.random() < clamp(0.5 - (r - 1) * 0.8, 0.15, 0.8)) { kind = 'oqiwin'; dmg[1] = 2; text = DUEL_TEXT.oQiWin; } else { kind = 'oqilose'; dmg[0] = 1; text = DUEL_TEXT.oQiLose; }
    } else if (BEATS[m] === o) { kind = 'win'; dmg[0] = 1 + (r >= 1.3 ? 1 : 0); text = DUEL_TEXT.win[m]; }
    else if (BEATS[o] === m) { kind = 'lose'; dmg[1] = 1 + (r <= 1 / 1.3 ? 1 : 0); text = DUEL_TEXT.lose[m]; }
    else if (m === 'shou') { kind = 'stall'; text = DUEL_TEXT.clash.shou; }
    else {
      kind = 'clash';
      if (Math.random() < clamp(0.5 + (r - 1) * 1.2 + (m === 'gong' && d.sword ? 0.12 : 0), 0.15, 0.85)) { dmg[0] = 1; text = DUEL_TEXT.clash[m] + DUEL_TEXT.edge; }
      else { dmg[1] = 1; text = DUEL_TEXT.clash[m] + DUEL_TEXT.edgeLose; }
    }
    d.hp[1] = Math.max(0, d.hp[1] - dmg[0]); d.hp[0] = Math.max(0, d.hp[0] - dmg[1]); d.round++;
    if (d.hp[1] <= 0) d.over = 'win'; else if (d.hp[0] <= 0) d.over = 'lose';
    else if (d.round >= 9) d.over = d.hp[0] > d.hp[1] ? 'win' : d.hp[0] < d.hp[1] ? 'lose' : (Math.random() < clamp(0.5 + (r - 1), 0.2, 0.8) ? 'win' : 'lose');
    return { m, o, kind, dmg, text: text.replace(/\{o\}/g, on) };
  }
  function dabiFinish(s, place, beat) {
    const o = org(s), rw = DABI_REWARD[place], tags = [];
    s.sect.dabiN++; s.sect.dabiBest = Math.max(s.sect.dabiBest, place); s.acts++;
    addGx(s, rw.gx, tags);
    const ls = Math.round(rw.ls * REALMS[s.realm].lsScale); s.ls += ls; tags.push({ t: `灵石 +${ls}`, c: 'up' });
    if (place === 3) { s.items['聚气丹'] = (s.items['聚气丹'] || 0) + 2; tags.push({ t: '得聚气丹×2', c: 'up' }); if (Math.random() < 0.35) { const pl = REALMS[s.realm].pill; s.items[pl] = (s.items[pl] || 0) + 1; tags.push({ t: `得${pl}`, c: 'up' }); } s.xj = clamp(s.xj + 6, 0, 100); }
    (beat || []).forEach(id => { if (id === 'lu') npcAdd(s, 'lu', 8, tags); if (id === 'wen') npcAdd(s, 'wen', -6, tags); if (id === 'su') npcAdd(s, 'su', 3, tags); if (id === 'shi') npcAdd(s, 'shi', 2, tags); });
    const text = [`${o.dabi}落幕。你止步八强，下台时，有人拍了拍你的肩。`, `${o.dabi}落幕。你力战入了四强，演武台下第一次有人喊出你的名字。`,
      `${o.dabi}落幕。决战惜败，屈居亚魁。夜里你一个人回到演武台，把最后一招又走了一遍。`, `${o.dabi}落幕。你连胜三场，夺得魁首。钟鸣九响，百峰同闻。`][place];
    return { text, tags };
  }

  return { K, LIFE_SCALE, clamp, pick, gf, gt, sync, req, unit, isLast, bottleneck, realmStr, timeLabel, fmtNum,
    gfMatch, gfMatchWord, gfLv, gfSpeed, learn, practice, switchCost, switchGf,
    addXw, afterGain, passTime, gainMul, checkXj, tuna, biguan, pickEvent, resolveChoice, applyFx,
    btChance, resolveBreak, useItem, newState, migrate, retire, canRetire,
    lvl, shiftLv, rollFoe, foe, foeStr, foeDr, fightAct,
    org, rankName, caveMul, join, addGx, npcAdd, npcWord, npcLine, npcHelp, canPromote, promote, sectTick,
    ensureMissions, missionInfo, missionEvent, missionAct, riskWord, libList, learnLib,
    duelPower, dabiNew, duelNew, duelTell, duelRound, dabiFinish, DUEL_BEATS: BEATS };
})();
if (typeof module !== 'undefined') module.exports = Core;
