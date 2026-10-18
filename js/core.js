/* 墨仙录 · 规则核心（无 DOM，游戏与模拟器共用） */
'use strict';
const Core = (() => {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const LIFE_SCALE = [1, 1.5, 2.5, 4, 6];
  const SAVE_V = 11;
  // 调参入口（模拟器会改写这里）
  const K = {
    tunaGain: 0.42, biguanGain: 1.42, tunaMonths: 2.5, biguanMonths: 10, youliMonths: 3,
    noGf: 0.75, mismatch: 0.85, yiElemental: 0.9, yiOwn: 1.4, wuxingPer: 0.07,
    match: { tian: 1.35, shuang: 1.25, san: 1.18, si: 1.1, wei: 1.05, yi: 1.0 },
    layerBonus: 0.04, xpNeed: lv => 3 + lv * 2,
    btDeath: [0, 0, 0.05, 0.14, 0.3],
    moLoss: [1, 2], moRiskXj: 30, moRisk: 0.008,
    // v0.9：略抬需求、略缓收益，三灵根均衡局约 70–80 分钟
    reqMul: [5.15, 5.95, 6.7, 8.0, 8.85], lifeMul: [1.06, 1.08, 1.1, 1.0, 1.02],
    rootLife: { si: 1.04, wei: 1.08 },   // 驳杂灵根，气血反而绵长些
    payYears: 2, dabiYears: 55, mYears: 3, mXw: 0.05, stipendPill: [0, 0, 0, 0.05, 0.08, 0.1, 0.12], freeQiyu: 0.12,
  };

  /* ---------- 基础 ---------- */
  function gf(s) { return s.gf ? GONGFA[s.gf] : null; }
  // 主修完整生效；辅修仅取前 AUX_LAYER_CAP 层、且不参与 spd 主乘法（只给微量）
  function traitBag(s) {
    const parts = [];
    if (s.gf && GONGFA[s.gf]) parts.push({ t: GONGFA[s.gf].t, w: 1, spd: 1 });
    for (const id of (s.aux || [])) {
      const g = GONGFA[id], e = s.gfs[id]; if (!g || !e) continue;
      const w = Math.min(e.lv, typeof AUX_LAYER_CAP !== 'undefined' ? AUX_LAYER_CAP : 3) / (typeof GF_LAYERS !== 'undefined' ? GF_LAYERS : 9);
      parts.push({ t: g.t, w: 0.55 * w, spd: 0.25 * w });
    }
    const fb = s.fabao && typeof FABAO_BONUS !== 'undefined' ? FABAO_BONUS[s.fabao.stage | 0] : null;
    if (fb) parts.push({ t: fb, w: 1, spd: 1 });
    if (s.eq && s.eq.weapon && typeof GEAR !== 'undefined' && GEAR[s.eq.weapon])
      parts.push({ t: GEAR[s.eq.weapon].t || {}, w: 1, spd: 1 });
    // 宗门气运
    if (typeof orgTraitParts === 'function') {
      const ot = orgTraitParts(s);
      if (ot) parts.push({ t: ot, w: 1, spd: 1 });
    }
    // 定型：道基 / 丹纹 / 法相 / 问道 / 劫纹
    if (s.path && typeof PATH_TABLE !== 'undefined') {
      if (s.path.daoji && PATH_TABLE.daoji[s.path.daoji]) parts.push({ t: PATH_TABLE.daoji[s.path.daoji].t || {}, w: 1, spd: 1 });
      for (const id of (s.path.danwen || [])) if (PATH_TABLE.danwen[id]) parts.push({ t: PATH_TABLE.danwen[id].t || {}, w: 1, spd: 1 });
      if (s.path.faxiang && PATH_TABLE.faxiang[s.path.faxiang]) parts.push({ t: PATH_TABLE.faxiang[s.path.faxiang].t || {}, w: 1, spd: 1 });
      if (s.path.wendao && PATH_TABLE.wendao[s.path.wendao]) parts.push({ t: PATH_TABLE.wendao[s.path.wendao].t || {}, w: 1, spd: 1 });
      if (s.path.jiewen && PATH_TABLE.jiewen[s.path.jiewen]) parts.push({ t: PATH_TABLE.jiewen[s.path.jiewen].t || {}, w: 1, spd: 1 });
    }
    return parts;
  }
  function gt(s, key, dflt) {
    const parts = traitBag(s);
    if (key === 'spd') {
      let m = 1;
      for (const p of parts) if (p.t.spd != null) m *= 1 + (p.t.spd - 1) * (p.spd != null ? p.spd : p.w);
      return m;
    }
    if (key === 'xinmo' || key === 'time') {
      let m = 1, any = false;
      for (const p of parts) if (p.t[key] != null) { m *= Math.pow(p.t[key], p.w); any = true; }
      return any ? m : dflt;
    }
    if (key === 'mo') {
      for (const p of parts) if (p.t.mo) return p.t.mo;
      return dflt;
    }
    // 加法类：bt life qiyu dunwu heal xjGain btXj
    let sum = 0, any = false;
    for (const p of parts) if (p.t[key] != null) { sum += p.t[key] * p.w; any = true; }
    return any ? sum : dflt;
  }
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
    if (!id) return K.noGf * gearSpd(s) * courtSpd(s);
    const g = GONGFA[id];
    let spd = GF_GRADE_MUL[g.grade] * gfMatch(s, id) * (1 + K.layerBonus * (gfLv(s, id) - 1)) * (g.t.spd || 1);
    if (id === s.gf) spd *= gearSpd(s) * fabaoSpd(s) * auxSpd(s);
    return spd * courtSpd(s);
  }
  function courtSpd(s) {
    return typeof courtFriction === 'function' ? courtFriction(s).spd : 1;
  }
  function gearSpd(s) {
    if (!(s.eq && s.eq.weapon && typeof GEAR !== 'undefined' && GEAR[s.eq.weapon] && GEAR[s.eq.weapon].t.spd)) return 1;
    return GEAR[s.eq.weapon].t.spd;
  }
  function fabaoSpd(s) {
    if (!(s.fabao && typeof FABAO_BONUS !== 'undefined')) return 1;
    return FABAO_BONUS[s.fabao.stage | 0].spd || 1;
  }
  function auxSpd(s) {
    let m = 1;
    for (const id of (s.aux || [])) {
      const g = GONGFA[id], e = s.gfs[id]; if (!g || !e || !g.t.spd) continue;
      const w = 0.25 * Math.min(e.lv, typeof AUX_LAYER_CAP !== 'undefined' ? AUX_LAYER_CAP : 3) / 9;
      m *= 1 + (g.t.spd - 1) * w;
    }
    return m;
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
    let lv0 = 1;
    if (s.flags && s.flags.auxPage === id) {
      lv0 = 2; delete s.flags.auxPage;
      tags && tags.push({ t: '残页应验 · 起手二层', c: 'gold' });
    }
    s.gfs[id] = { lv: lv0, xp: 0 };
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
    s.aux = (s.aux || []).filter(x => x !== id);
    s.bnLogged = false;
    passTime(s, c.months + c.extra, emit);
    const tags = [...(c.lose ? [{ t: `修为 −${fmtNum(c.lose)}`, c: 'down' }] : []), ...(c.extra ? [{ t: `补足根基 ${cnDur(c.extra)}`, c: 'down' }] : []), { t: `心境 −${c.xj}`, c: 'down' }];
    if (old && c.layer) tags.push({ t: `《${GONGFA[old].name}》跌落一层`, c: 'down' });
    emit && emit({ title: '转修', text: (old ? `你散去《${GONGFA[old].name}》的周天路数，改修《${GONGFA[id].name}》。经脉逆转之痛，如抽丝剥茧，${cnDur(c.months + c.extra)}方定。` : `你改修《${GONGFA[id].name}》。`) + (c.extra ? '修为本就浅薄，散功之后，几乎是从头来过。' : ''),
      tags, cls: 'event', div: true });
    checkXj(s, emit);
    // 转主修：本命法宝若系于旧功，祭炼值回落，并记残魂旗（供来世）
    if (s.fabao && s.fabao.gfId && s.fabao.gfId === old) {
      s.fabao.bond = Math.max(0, Math.floor(s.fabao.bond * 0.55));
      fabaoSyncStage(s);
      s.fabao.gfId = id;
      s.flags = s.flags || {};
      s.flags.fabaoCanhun = 1;
      if (emit) emit({ text: `《${GONGFA[old].name}》散去之时，本命${s.fabao.name}轻轻一颤，灵性淡了几分——似有一缕残魂，犹记旧主人路数。`, cls: 'sys' });
    }
    return true;
  }

  /* ---------- 辅修 ---------- */
  function setAux(s, id) {
    if (!id || !s.gfs[id] || s.gf === id) return { err: '不可辅修' };
    s.aux = s.aux || [];
    if (s.aux.includes(id)) return { err: '已在辅修' };
    if (s.aux.length >= (typeof AUX_MAX !== 'undefined' ? AUX_MAX : 2)) return { err: '辅修已满两门' };
    s.aux.push(id);
    sync(s);
    return { text: `你将《${GONGFA[id].name}》列为辅修。不求精深，只取其意，温养性情。`, tags: [{ t: `辅修《${GONGFA[id].name}》`, c: 'up' }] };
  }
  function clearAux(s, id) {
    s.aux = (s.aux || []).filter(x => x !== id);
    sync(s);
    return { text: id ? `你卸下辅修《${GONGFA[id].name}》。` : '你清空了辅修。', tags: [{ t: '卸辅修', c: '' }] };
  }

  /* ---------- 本命法宝 ---------- */
  function fabaoPickSeed(s) {
    let keys = [];
    const o = s.sect && s.sect.org && typeof ORGS !== 'undefined' ? ORGS[s.sect.org] : null;
    if (o && o.fabaoEl && o.fabaoEl.length) keys = o.fabaoEl.filter(e => FABAO_POOL[e]);
    if (!keys.length) {
      const k = (s.lgEls || []).find(e => typeof FABAO_POOL !== 'undefined' && FABAO_POOL[e]);
      keys = k ? [k] : ['_'];
    }
    const poolKey = keys[Math.floor(Math.random() * keys.length)];
    const pool = FABAO_POOL[poolKey] || FABAO_POOL._;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function fabaoAwaken(s, emit) {
    if (s.fabao || typeof FABAO_POOL === 'undefined') return null;
    let seed, bond = 0, stage = 0, fromCanhun = false;
    if (s.flags && s.flags.canhunSeed) {
      const c = s.flags.canhunSeed; fromCanhun = true;
      seed = { id: c.id, name: c.name, seal: c.seal || '器', flavor: c.flavor || '残魂归笼，旧器重光。' };
      bond = c.bond || FABAO_NEED[1] || 10; stage = Math.min(2, c.stage | 0);
      delete s.flags.canhunSeed;
    } else seed = fabaoPickSeed(s);
    s.fabao = { id: seed.id, name: seed.name, seal: seed.seal, stage, bond, el: (s.lgEls || [])[0] || null, gfId: s.gf || null, flavor: seed.flavor };
    fabaoSyncStage(s);
    s.flags = s.flags || {}; s.flags.fabao = 1;
    if (emit) emit({ title: fromCanhun ? '本命法宝 · 残魂归笼' : '本命法宝 · 认主',
      text: fromCanhun ? `前世一缕残魂未散，今世再入仙途，${seed.name}自虚空凝出。${seed.flavor}你与它，似曾相识。`
        : `机缘至，一物落于你识海之中——${seed.name}。${seed.flavor}自此与你气血相连，是为认主。`, cls: 'gold', div: true });
    return s.fabao;
  }
  function fabaoSyncStage(s) {
    if (!s.fabao || typeof FABAO_NEED === 'undefined') return;
    let st = 0;
    for (let i = FABAO_NEED.length - 1; i >= 0; i--) if (s.fabao.bond >= FABAO_NEED[i]) { st = i; break; }
    if (st > (s.fabao.stage | 0)) {
      s.fabao.stage = st;
      return FABAO_STAGE[st];
    }
    s.fabao.stage = st;
    return null;
  }
  function fabaoFeed(s, n, emit) {
    if (!s.fabao) return;
    let mul = 1;
    if (s.path && s.path.daoji && typeof DAOJI !== 'undefined' && DAOJI[s.path.daoji] && DAOJI[s.path.daoji].fabao)
      mul = DAOJI[s.path.daoji].fabao;
    s.fabao.bond = (s.fabao.bond || 0) + Math.round(n * mul);
    if (!s.fabao.gfId && s.gf) s.fabao.gfId = s.gf;
    const up = fabaoSyncStage(s);
    if (up && emit) emit({ text: `本命${s.fabao.name}灵性大涨，进至「${up}」。`, cls: 'gold' });
    if (up && typeof FabaoArt !== 'undefined' && FabaoArt.queue) FabaoArt.queue(s.fabao, up);
  }
  function fabaoOnDeath(s) {
    if (!s.fabao || (s.fabao.stage | 0) < 1) return null;
    return { id: s.fabao.id, name: s.fabao.name, seal: s.fabao.seal, stage: s.fabao.stage, el: s.fabao.el, bond: Math.floor((s.fabao.bond || 0) * 0.4), flavor: s.fabao.flavor };
  }

  /* ---------- 装备 ---------- */
  function equip(s, name) {
    if (typeof GEAR === 'undefined' || !GEAR[name]) return { err: '非兵器' };
    if (!(s.items[name] > 0) && s.eq && s.eq.weapon !== name) return { err: '囊中无此物' };
    s.eq = s.eq || { weapon: null };
    const g = GEAR[name];
    // 神器代价：初次装备
    const tags = [];
    if (g.artifact && g.curse && !s.flags['eq_' + name]) {
      s.flags['eq_' + name] = 1;
      if (g.curse.lifeOnce) { s.lifeBonus += g.curse.lifeOnce; tags.push({ t: `寿元 ${g.curse.lifeOnce}年`, c: 'down' }); }
      if (g.curse.xj) { s.xj = clamp(s.xj + g.curse.xj, 0, 100); tags.push({ t: `心境 ${g.curse.xj}`, c: 'down' }); }
    }
    // 卸下旧器回囊
    if (s.eq.weapon && s.eq.weapon !== name) s.items[s.eq.weapon] = (s.items[s.eq.weapon] || 0) + 1;
    if (s.items[name] > 0) { s.items[name]--; if (!s.items[name]) delete s.items[name]; }
    s.eq.weapon = name;
    sync(s);
    return { text: g.artifact ? `你以心血温养${name}。${g.desc}` : `你将${name}佩在身侧。${g.desc}`, tags: tags.concat([{ t: `佩${name}`, c: 'up' }]) };
  }
  function unequip(s) {
    if (!(s.eq && s.eq.weapon)) return { err: '未佩兵器' };
    const n = s.eq.weapon;
    s.items[n] = (s.items[n] || 0) + 1;
    s.eq.weapon = null;
    sync(s);
    return { text: `你收起了${n}。`, tags: [{ t: `卸${n}`, c: '' }] };
  }
  function gearTick(s, emit) {
    if (!(s.eq && s.eq.weapon && typeof GEAR !== 'undefined')) return;
    const g = GEAR[s.eq.weapon];
    if (!(g && g.artifact && g.curse)) return;
    if (g.curse.xjPerYear) {
      // 约略：每次行动按年月损耗，在 passTime 后按月计太细；此处在 tuna/biguan 末调用已够
      const loss = Math.random() < 0.35 ? 1 : 0;
      if (loss) { s.xj = clamp(s.xj - loss, 0, 100); }
    }
    if (g.curse.risk && Math.random() < g.curse.risk) {
      s.inj += 1;
      if (emit) emit({ text: `${s.eq.weapon}忽然反噬，一股阴寒倒灌识海。你咬牙压下，额上已冷汗淋漓。`, cls: 'warn' });
    }
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
    const cfT = typeof courtFriction === 'function' ? courtFriction(s).time : 1;
    s.months += m * gt(s, 'time', 1) * cfT; sync(s);
    const left = s.lifespan - s.age, span = s.lifespan - 16;
    const k = s.realm + ':' + s.lifeBonus;
    if (left <= span * 0.05 && !s.warned['95' + k] && left > 0) { s.warned['95' + k] = 1; emit && emit({ text: TEXT.old95, cls: 'warn' }); }
    else if (left <= span * 0.2 && !s.warned['80' + k] && left > 0) { s.warned['80' + k] = 1; emit && emit({ text: TEXT.old80, cls: 'warn' }); }
    if (s.age >= s.lifespan && !s.dead) { s.dead = true; s.ending = 'zuohua'; }
    if (!s.dead) sectTick(s, emit);
    if (!s.dead && typeof Jianghu !== 'undefined') Jianghu.tick(s, emit);
    if (!s.dead && typeof karmaTick === 'function') karmaTick(s, emit);
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
    fabaoFeed(s, 1, emit);
    gearTick(s, emit);
    checkXj(s, emit);
    s.acts++;
    return { text: pick(TEXT.tuna).replace('{d}', cnDur(r.T * K.tunaMonths)), tags, ups };
  }
  function biguan(s, emit) {
    const r = REALMS[s.realm], mul = gainMul(s), tags = [];
    const cfXm = typeof courtFriction === 'function' ? courtFriction(s).xinmo : 1;
    const pXm = clamp(0.06 + (50 - s.xj) / 400, 0.02, 0.22) * gt(s, 'xinmo', 1) * cfXm;
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
    fabaoFeed(s, 3, emit);
    gearTick(s, emit);
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
    if (fx.karma && typeof karmaPlant === 'function') {
      const ok = karmaPlant(s, fx.karma.id, fx.karma.years != null ? fx.karma.years : 20, fx.karma.data);
      if (ok) tags.push({ t: '因果已种', c: 'gold' });
    }
    if (fx.btBuff) { s.btBuff = (s.btBuff || 0) + fx.btBuff; tags.push({ t: '破境把握暂增', c: 'up' }); }
    if (fx.gear && typeof GEAR !== 'undefined' && GEAR[fx.gear]) {
      s.items[fx.gear] = (s.items[fx.gear] || 0) + 1;
      tags.push({ t: `得${fx.gear}`, c: 'gold' });
    }
    if (typeof Jianghu !== 'undefined') Jianghu.fx(s, fx, tags);
    if (fx.time) passTime(s, fx.time, emit);
    if (fx.end && !s.dead) { s.dead = true; s.ending = fx.end; }
    checkXj(s, emit);
    return { tags, ups };
  }

  /* ---------- 定型 ---------- */
  function pathYouliMul(s) {
    if (s.path && s.path.daoji && typeof DAOJI !== 'undefined' && DAOJI[s.path.daoji] && DAOJI[s.path.daoji].youli)
      return DAOJI[s.path.daoji].youli;
    return 1;
  }
  function emptyPath() { return { daoji: null, danwen: [], faxiang: null, wendao: null, jiewen: null }; }
  function pendingPath(s) {
    if (!s || s.dead || s.ascended) return null;
    const p = s.path || emptyPath();
    if (s.realm >= 1 && !p.daoji) return 'daoji';
    if (s.realm >= 2 && !(p.danwen && p.danwen.length)) return 'danwen';
    if (s.realm >= 3 && !p.faxiang) return 'faxiang';
    if (s.realm >= 4 && !p.wendao) return 'wendao';
    return null;
  }
  function pathAtBreak(from) { return (typeof PATH_AT !== 'undefined' && PATH_AT[from]) || null; }
  function choosePath(s, kind, ids, emit) {
    if (!s.path) s.path = emptyPath();
    const tab = typeof PATH_TABLE !== 'undefined' ? PATH_TABLE[kind] : null;
    const meta = typeof PATH_KIND !== 'undefined' ? PATH_KIND[kind] : null;
    if (!tab || !meta) return { err: '未知定型' };
    const list = Array.isArray(ids) ? ids : [ids];
    if (list.length < meta.pick || list.length > meta.max) return { err: '选择数目不符' };
    for (const id of list) if (!tab[id]) return { err: '无此选项' };
    if (kind === 'daoji') {
      if (s.path.daoji) return { err: '道基已定，不可轻易更易' };
      s.path.daoji = list[0];
      if (s.flags && s.flags.daojiMem === list[0]) {
        s.btBuff = (s.btBuff || 0) + 0.02;
        s.flags.daojiMemUsed = 1;
      }
    } else if (kind === 'danwen') {
      if (s.path.danwen && s.path.danwen.length) return { err: '丹纹已定' };
      s.path.danwen = list.slice(0, meta.max);
    } else if (kind === 'faxiang') {
      if (s.path.faxiang) return { err: '法相已定' };
      s.path.faxiang = list[0];
      if (typeof karmaPlant === 'function') karmaPlant(s, 'xiang_fan', 16);
    } else if (kind === 'wendao') {
      if (s.path.wendao) return { err: '问道已定' };
      s.path.wendao = list[0];
    } else if (kind === 'jiewen') {
      if (s.path.jiewen) return { err: '劫纹已定' };
      s.path.jiewen = list[0];
    } else return { err: '未知定型' };
    sync(s);
    const names = list.map(id => tab[id].name).join('、');
    const prose = list.map(id => tab[id].desc).join('');
    const tags = list.map(id => ({ t: meta.name + ' · ' + tab[id].name, c: 'gold' }));
    if (emit) emit({ title: meta.name + '已定', text: prose, tags, cls: 'gold', div: true });
    return { text: prose, tags, names };
  }
  function pathSummary(s) {
    if (!s || !s.path) return [];
    const out = [];
    if (s.path.daoji && DAOJI[s.path.daoji]) out.push({ k: 'daoji', name: DAOJI[s.path.daoji].name, seal: DAOJI[s.path.daoji].seal });
    for (const id of (s.path.danwen || [])) if (DANWEN[id]) out.push({ k: 'danwen', name: DANWEN[id].name, seal: DANWEN[id].seal });
    if (s.path.faxiang && FAXIANG[s.path.faxiang]) out.push({ k: 'faxiang', name: FAXIANG[s.path.faxiang].name, seal: FAXIANG[s.path.faxiang].seal });
    if (s.path.wendao && WENDAO[s.path.wendao]) out.push({ k: 'wendao', name: WENDAO[s.path.wendao].name, seal: WENDAO[s.path.wendao].seal });
    if (s.path.jiewen && JIEWEN[s.path.jiewen]) out.push({ k: 'jiewen', name: JIEWEN[s.path.jiewen].name, seal: JIEWEN[s.path.jiewen].seal });
    return out;
  }
  function pathWashCost(s, kind) {
    const lsS = REALMS[s.realm].lsScale, lifeS = LIFE_SCALE[s.realm];
    if (kind === 'danwen') return { ls: Math.round(960 * lsS), life: Math.round(6 * lifeS), xj: 10 };
    if (kind === 'daoji') return { ls: Math.round(2400 * lsS), life: Math.round(14 * lifeS), xj: 16 };
    if (kind === 'faxiang') {
      let ls = Math.round(1800 * lsS), life = Math.round(10 * lifeS), xj = 14;
      if (s.flags && s.flags.xiang_wash_half) { ls = Math.round(ls * 0.5); life = Math.round(life * 0.55); xj = Math.round(xj * 0.6); }
      return { ls, life, xj };
    }
    if (kind === 'wendao') return { ls: Math.round(1500 * lsS), life: Math.round(8 * lifeS), xj: 12 };
    if (kind === 'jiewen') return { ls: Math.round(2200 * lsS), life: Math.round(12 * lifeS), xj: 15 };
    return null;
  }
  function washPath(s, kind, emit) {
    const cost = pathWashCost(s, kind);
    if (!cost) return { err: '此定型不可洗去' };
    if (kind === 'danwen') {
      if (!(s.path && s.path.danwen && s.path.danwen.length)) return { err: '尚无丹纹可洗' };
    } else if (kind === 'daoji') {
      if (!(s.path && s.path.daoji)) return { err: '尚无道基可洗' };
    } else if (kind === 'faxiang') {
      if (!(s.path && s.path.faxiang)) return { err: '尚无法相可洗' };
    } else if (kind === 'wendao') {
      if (!(s.path && s.path.wendao)) return { err: '尚无问道可洗' };
    } else if (kind === 'jiewen') {
      if (!(s.path && s.path.jiewen)) return { err: '尚无劫纹可洗' };
      if (s.ascended) return { err: '已飞升，劫纹随你入天，不可复洗' };
    } else return { err: '此定型不可洗去' };
    if (s.ls < cost.ls) return { err: `灵石不足 · 需${cost.ls}` };
    s.ls -= cost.ls;
    s.lifeBonus -= cost.life;
    s.xj = clamp(s.xj - cost.xj, 0, 100);
    const tags = [
      { t: `灵石 −${cost.ls}`, c: 'down' },
      { t: `寿元 −${cost.life}年`, c: 'down' },
      { t: `心境 −${cost.xj}`, c: 'down' },
    ];
    let text = '', title = '洗纹';
    if (kind === 'danwen') {
      const names = s.path.danwen.map(id => DANWEN[id] && DANWEN[id].name).filter(Boolean).join('、');
      s.path.danwen = [];
      text = `你以重金购得洗纹丹，金丹表面的${names || '旧纹'}寸寸淡去。丹面复白，像从未刻过——只是识海里空了一块，很久才填上。`;
      tags.unshift({ t: '丹纹已洗', c: 'gold' });
      title = '洗纹';
    } else if (kind === 'daoji') {
      const n = DAOJI[s.path.daoji].name;
      s.path.daoji = null;
      text = `你强行震碎丹田中的${n}虚影。经脉如遭雷劈，好在尚能重塑。道基一空，百年倾向尽散——此等代价，寻常修士不敢想。`;
      tags.unshift({ t: '道基已散', c: 'gold' });
      title = '易基';
    } else if (kind === 'faxiang') {
      const n = (FAXIANG[s.path.faxiang] && FAXIANG[s.path.faxiang].name) || '法相';
      s.path.faxiang = null;
      if (s.flags) delete s.flags.xiang_wash_half;
      text = `你运转洗相秘法，识海中「${n}」如墨遇水，一寸寸淡开。元婴空明一阵，痛，却干净。法相既洗，须待机缘再凝。`;
      tags.unshift({ t: '法相已洗', c: 'gold' });
      title = '洗相';
    } else if (kind === 'wendao') {
      const n = (WENDAO[s.path.wendao] && WENDAO[s.path.wendao].name) || '问道';
      s.path.wendao = null;
      text = `你在天地之间又站了一夜，把「${n}」那一问从识海里拔出。问口空了，风灌进来，冷，也自由。须得再问一次，方可落定。`;
      tags.unshift({ t: '问道已洗', c: 'gold' });
      title = '洗问';
    } else {
      const n = (JIEWEN[s.path.jiewen] && JIEWEN[s.path.jiewen].name) || '劫纹';
      s.path.jiewen = null;
      text = `你以神识强行磨去烙在识海上的「${n}」。雷痕淡了，像一道将愈的伤——渡劫尚未成飞升前，尚可另择一纹。`;
      tags.unshift({ t: '劫纹已洗', c: 'gold' });
      title = '洗劫';
    }
    sync(s);
    if (emit) emit({ title, text, tags, cls: 'warn', div: true });
    return { ok: true, text, tags, cost };
  }

  /* ---------- 破境 ---------- */
  function btChance(s, usePill) {
    const mem = (typeof Samsara !== 'undefined' && Samsara.daojiAffinity && s.path) ? Samsara.daojiAffinity(s, s.path.daoji) : 0;
    return clamp(REALMS[s.realm].base + s.lg.bt + (s.xj - 50) / 250 + (usePill ? 0.2 : 0) + Math.min(0.12, s.fails * 0.04)
      - (s.inj > 0 ? 0.15 : 0) + (s.btBuff || 0) + s.luck * 0.005 + gt(s, 'bt', 0) + (s.gf ? (gfLv(s) - 1) * 0.004 : 0) + npcHelp(s).bt + mem, 0.05, 0.95);
  }
  // 返回 {ok, text, ending}；会直接改写 s；宗门赐法等追加日志走 emit
  function resolveBreak(s, usePill, emit) {
    const r = REALMS[s.realm], from = s.realm, p = btChance(s, usePill), ok = Math.random() < p;
    if (usePill) { s.items[r.pill]--; if (s.items[r.pill] <= 0) delete s.items[r.pill]; }
    s.btBuff = 0;
    const btXj = gt(s, 'btXj', 0);
    s.acts++;
    if (ok) {
      const need = pathAtBreak(from);
      if (from === 4) {
        // 渡劫成功：先定劫纹，再飞升（UI 选完后调用 finishAscend）
        sync(s);
        return { ok, from, text: TEXT.btSuccess[from], needPath: need, pendingAscend: true };
      }
      s.realm++; s.stage = 0; s.xw = 0; s.fails = 0; s.inj = 0; s.bnLogged = false; s.xj = clamp(s.xj + 5 - btXj, 0, 100);
      sync(s);
      const text = TEXT.btSuccess[from] + `寿元增至${cn(s.lifespan)}载。` + (btXj ? TEXT.wangqingCost : '');
      sectReward(s, emit);
      fabaoFeed(s, 8, emit);
      if (!s.fabao && from === 0) fabaoAwaken(s, emit);
      else if (!s.fabao && from >= 1) fabaoAwaken(s, emit);
      checkXj(s, emit);
      return { ok, from, text, needPath: need };
    }
    // 高境界破境失败，可能身死道消；身怀兵解玉符者兵解转修
    let pd = K.btDeath[from] * (s.inj > 0 ? 1.3 : 1) * (1 - Math.min(0.4, Math.max(0, s.luck) * 0.04));
    if (from === 4 && s.path && s.path.jiewen && typeof JIEWEN !== 'undefined' && JIEWEN[s.path.jiewen] && JIEWEN[s.path.jiewen].risk)
      pd *= JIEWEN[s.path.jiewen].risk;
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
  function finishAscend(s, emit) {
    if (s.ascended) return;
    s.ascended = true; s.ending = 'ascend'; sync(s);
    if (emit) emit({ title: '飞升', text: TEXT.btSuccess[4], cls: 'gold', div: true });
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
  /* 单次可连服上限：防一键刷穿；各丹另有情境上限（瓶颈／满心境等） */
  const USE_HARD_CAP = 9;
  function useBatchCap(s, k) {
    const have = s.items[k] | 0;
    if (have <= 0) return 0;
    if (k === '聚气丹') {
      if (bottleneck(s)) return 0;
      return Math.min(5, have, USE_HARD_CAP);
    }
    if (k === '回春丹') return s.inj > 0 ? 1 : 0;
    if (k === '清心丹') {
      if (s.xj >= 100) return 0;
      const need = Math.ceil((100 - s.xj) / 15);
      return Math.min(3, have, need, USE_HARD_CAP);
    }
    if (k === '延寿果' || k === '延寿丹') return Math.min(5, have, USE_HARD_CAP);
    if (k === '破障丹') {
      if (bottleneck(s)) return (s.btBuff >= 0.08) ? 0 : 1;
      return Math.min(3, have, USE_HARD_CAP);
    }
    // 其它可服物：默认至多 5
    if (typeof PILLS !== 'undefined' && PILLS[k] && PILLS[k].use) return Math.min(5, have, USE_HARD_CAP);
    if (typeof Jianghu !== 'undefined') return Math.min(5, have, USE_HARD_CAP);
    return 0;
  }
  function useItemOnce(s, k, tags) {
    let text = '', ups = [];
    if (k === '聚气丹') {
      if (bottleneck(s)) return { err: '瓶颈当前，丹药无益' };
      ups = addXw(s, unit(s) * 0.35, tags) || []; text = '丹药入腹，化作一股温润灵流，沿经脉缓缓散开。';
    } else if (k === '回春丹') {
      if (s.inj <= 0) return { err: '身无伤患，留待日后' };
      s.inj = 0; s.xj = clamp(s.xj + 2, 0, 100); tags.push({ t: '伤势痊愈', c: 'up' }); text = '回春丹化开，周身暖意融融，旧伤处的隐痛渐渐消散。';
    } else if (k === '延寿果') {
      const v = Math.round(5 * LIFE_SCALE[s.realm] * 2); s.lifeBonus += v; tags.push({ t: `寿元 +${v}年`, c: 'up' }); text = '朱果入口即化，一股勃勃生机自丹田升起，鬓边白发竟转青了几根。';
    } else if (k === '清心丹') {
      if (s.xj >= 100) return { err: '心境已满，留待日后' };
      s.xj = clamp(s.xj + 15, 0, 100); s.warned.xjLow = 0; tags.push({ t: '心境 +15', c: 'up' }); text = '清心丹入口微苦，回甘如泉。心头那团乱麻，被一根根理顺了。';
    } else {
      const j = typeof Jianghu !== 'undefined' && Jianghu.useItem(s, k, tags);
      if (!j) return { err: '此物不可服用' };
      if (j.err) return j;
      text = j.text; ups = j.ups || [];
    }
    s.items[k]--; if (s.items[k] <= 0) delete s.items[k];
    return { text, tags, ups };
  }
  function useItem(s, k, n) {
    if (!(s.items[k] > 0)) return { err: '无此物' };
    n = Math.max(1, (n | 0) || 1);
    const cap = useBatchCap(s, k);
    if (cap <= 0) {
      if (k === '聚气丹' && bottleneck(s)) return { err: '瓶颈当前，丹药无益' };
      if (k === '回春丹') return { err: '身无伤患，留待日后' };
      if (k === '清心丹' && s.xj >= 100) return { err: '心境已满，留待日后' };
      return { err: '此物暂不可服用' };
    }
    n = Math.min(n, cap, s.items[k] | 0);
    const allTags = []; let lastText = '', allUps = []; let used = 0;
    for (let i = 0; i < n; i++) {
      if (!(s.items[k] > 0)) break;
      // 情境中途变了（如聚气丹顶到瓶颈）
      if (useBatchCap(s, k) <= 0) break;
      const tags = [];
      const r = useItemOnce(s, k, tags);
      if (r.err) { if (!used) return r; break; }
      used++;
      lastText = r.text;
      allTags.push(...tags);
      if (r.ups) allUps.push(...r.ups);
    }
    if (!used) return { err: '未能服用' };
    sync(s);
    // 合并同名标签数量感
    const merged = [];
    const map = {};
    for (const t of allTags) {
      const key = t.t + '|' + (t.c || '');
      if (!map[key]) { map[key] = { t: t.t, c: t.c, n: 0 }; merged.push(map[key]); }
      map[key].n++;
    }
    const tagsOut = merged.map(x => x.n > 1 ? { t: x.t.replace(/\+(\d+)/, (_, n) => '+' + ((+n) * x.n)), c: x.c } : { t: x.t, c: x.c });
    // 简单：若多颗，在文首标明
    const text = used > 1 ? (`连服${typeof cn === 'function' ? cn(used) : used}枚。` + lastText) : lastText;
    if (used > 1) tagsOut.unshift({ t: `服用 ×${used}`, c: 'gold' });
    return { text, tags: tagsOut, ups: allUps, used };
  }

  /* ---------- 新卷 / 旧卷迁移 ---------- */
  function newState(name, r, legacy) {
    const s = { v: SAVE_V, name, lg: { id: r.lg.id, name: r.lg.name, mult: r.lg.mult, bt: r.lg.bt, sect: r.lg.sect }, lgEls: r.els,
      wx: r.wx, xj: 50, luck: r.luck, ls: 20, realm: 0, stage: 0, xw: 0, months: 16 * 12, lifeBonus: 0,
      inj: 0, buff: null, items: {}, flags: {}, fails: 0, events: 0, log: [], warned: {}, dead: false, ascended: false, bnLogged: false,
      gf: null, gfs: {}, aux: [], fabao: null, eq: { weapon: null }, path: { daoji: null, danwen: [], faxiang: null, wendao: null, jiewen: null },
      seen: {}, recent: [], acts: 0, ending: null, marks: [], played: 0,
      court: typeof emptyCourt === 'function' ? emptyCourt() : { rank: -1, entry: null, bing: 0, min: 40, dao: 55, examAt: 0, n: 0, txAt: 0 },
      karma: typeof emptyKarma === 'function' ? emptyKarma() : { mate: null, foe: null, seeds: [] } };
    const startGf = (r.org && ORGS[r.org] && ORGS[r.org].startGf) || (r.lg.id !== 'wei' ? 'qingming' : null);
    if (startGf && GONGFA[startGf]) { s.gf = startGf; s.gfs[startGf] = { lv: 1, xp: 0 }; }
    else if (r.lg.id !== 'wei') { s.gf = 'qingming'; s.gfs.qingming = { lv: 1, xp: 0 }; }
    if (r && r.trial) { s.flags.trial = 1; s.realm = 2; s.stage = 0; s.months = 40 * 12; s.ls = 120; s.xw = 0; }
    let legacyTags = [];
    if (legacy && typeof Samsara !== 'undefined' && Samsara.applyLegacy) {
      legacyTags = Samsara.applyLegacy(s, legacy) || [];
    } else if (legacy) {
      s.wx = clamp(s.wx + (legacy.wx || 0), 1, 10); s.flags.legacy = 1;
      if (legacy.canhun) { s.flags.canhunSeed = legacy.canhun; s.flags.fabaoCanhun = 1; }
    }
    const orgId = r.org || null;
    const rank = orgId ? (START_RANK[r.lg.id] != null ? START_RANK[r.lg.id] : 1) : -1;
    s.sect = initSect(s, orgId, rank);
    if (r.free) s.sect.free = true;
    // 门派印记：同宗贡奉
    if (typeof Samsara !== 'undefined' && Samsara.onJoinOrg && orgId) {
      const mark = Samsara.onJoinOrg(s, orgId);
      if (mark) s.flags._legacyJoinText = mark.text;
    }
    if (typeof Samsara !== 'undefined' && Samsara.applyCourtMark) Samsara.applyCourtMark(s);
    s.npc = initNpc(s);
    if (typeof Jianghu !== 'undefined') Jianghu.init(s);
    // 试炼局：缩短寿元窗口感——不改公式，只记目标年
    if (s.flags.trial) s.flags.trialYears = 20;
    sync(s);
    s._legacyTags = legacyTags;
    return s;
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
    if (s.v === 4) {   // v0.8 → v0.9：器与卷
      const oldLife = s.lifespan;
      s.v = 5;
      s.aux = s.aux || [];
      s.fabao = s.fabao || null;
      s.eq = s.eq || { weapon: null };
      const V8 = [4.3, 5.0, 5.6, 6.7, 7.4];
      s.xw = Math.round(s.xw * K.reqMul[s.realm] / V8[s.realm]);
      sync(s); if (oldLife > s.lifespan) { s.lifeBonus = (s.lifeBonus || 0) + oldLife - s.lifespan; sync(s); }
    }
    if (s.v === 5) {   // v0.9 → v0.10：定型
      s.v = 6;
      s.path = s.path || { daoji: null, danwen: [], faxiang: null, wendao: null, jiewen: null };
    }
    if (s.v === 6) {   // v0.10 → v0.11：百家（青冥仍为 qm）
      s.v = 7;
      if (s.sect && s.sect.org && !ORGS[s.sect.org]) s.sect.org = 'qm';
    }
    if (s.v === 7) {   // v0.11 → v0.12：天下仕途
      s.v = 8;
      s.court = s.court || (typeof emptyCourt === 'function' ? emptyCourt() : { rank: -1, entry: null, bing: 0, min: 40, dao: 55, examAt: 0, n: 0, txAt: 0 });
    }
    if (s.v === 8) {   // v0.12 → v0.13：因果
      s.v = 9;
      s.karma = s.karma || (typeof emptyKarma === 'function' ? emptyKarma() : { mate: null, foe: null, seeds: [] });
    }
    if (s.v === 9) {   // v0.13 → v1.0：轮回字段（档案侧仅占位；元数据在 moxian.meta）
      s.v = 10;
      s.flags = s.flags || {};
    }
    if (s.v === 10) {  // v1.0 → v1.1：生平印记与游玩时长；修为倍率未改，不换算
      s.v = 11;
      s.marks = Array.isArray(s.marks) ? s.marks : [];
      if (typeof s.played !== 'number') s.played = Math.round((s.acts || 0) * 6500);
    }
    if (s.v !== SAVE_V) return null;
    s.gfs = s.gfs || {}; s.aux = s.aux || []; s.eq = s.eq || { weapon: null };
    s.path = s.path || { daoji: null, danwen: [], faxiang: null, wendao: null, jiewen: null };
    s.court = s.court || (typeof emptyCourt === 'function' ? emptyCourt() : { rank: -1, entry: null, bing: 0, min: 40, dao: 55, examAt: 0, n: 0, txAt: 0 });
    s.karma = s.karma || (typeof emptyKarma === 'function' ? emptyKarma() : { mate: null, foe: null, seeds: [] });
    s.seen = s.seen || {}; s.recent = s.recent || []; s.warned = s.warned || {}; s.flags = s.flags || {};
    s.marks = Array.isArray(s.marks) ? s.marks : [];
    if (typeof s.played !== 'number') s.played = Math.round((s.acts || 0) * 6500);
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
    const orgO = o && ORGS[o];
    return { org: o, rank: o ? rank : -1, gx: 0, gxTotal: 0, free: false,
      master: !!(orgO && orgO.mentor && rank >= 2),
      missions: [], mAt: -1, uid: 0, payAt: s.months + payEvery(s), dabiAt: s.months + dabiEvery(s) * 0.4, dabiDue: false,
      dabiN: 0, dabiBest: -1, done: 0, promoLogged: -1 };
  }
  function meetOrgNpcs(s, o, asMaster) {
    const orgO = ORGS[o]; if (!orgO || !s.npc) return;
    (orgO.rookies || []).forEach(id => { if (s.npc[id]) s.npc[id].met = true; });
    if (asMaster && orgO.mentor && s.npc[orgO.mentor]) s.npc[orgO.mentor].met = true;
  }
  function initNpc(s) {
    const n = {};
    for (const id in NPCS) n[id] = { a: NPCS[id].a0, met: false };
    s.npc = n;
    if (s.sect && s.sect.org) meetOrgNpcs(s, s.sect.org, s.sect.master);
    return n;
  }
  function join(s, o, tags) {
    s.sect.org = o; s.sect.rank = 1; s.sect.free = false; s.sect.missions = []; s.sect.mAt = -1;
    s.sect.payAt = s.months + payEvery(s); s.sect.dabiAt = s.months + dabiEvery(s) * 0.6;
    s.sect.master = false;
    meetOrgNpcs(s, o, false);
    tags && tags.push({ t: `入${ORGS[o].name} · ${ORGS[o].ranks[1]}`, c: 'up' });
  }
  function defect(s, emit) {
    if (!(s.sect && s.sect.org)) return { err: '无门可叛' };
    if (s.flags && s.flags.defectCD && s.months < s.flags.defectCD) return { err: '叛宗未久，不宜再叛' };
    const o = ORGS[s.sect.org], lsS = REALMS[s.realm].lsScale;
    const costLs = Math.round(800 * lsS), costLife = Math.round(10 * LIFE_SCALE[s.realm]);
    if (s.ls < costLs) return { err: `灵石不足 · 需${costLs}` };
    const name = o.name;
    s.ls -= costLs; s.lifeBonus -= costLife; s.xj = clamp(s.xj - 18, 0, 100);
    s.flags = s.flags || {}; s.flags.defectedFrom = o.id; s.flags.defectCD = s.months + 12 * REALMS[s.realm].T * 8;
    s.sect.org = null; s.sect.rank = -1; s.sect.master = false; s.sect.missions = []; s.sect.gx = 0;
    s.sect.free = true;
    sync(s);
    const tags = [{ t: `叛出${name}`, c: 'down' }, { t: `灵石 −${costLs}`, c: 'down' }, { t: `寿元 −${costLife}年`, c: 'down' }, { t: '心境 −18', c: 'down' }, { t: '逍遥', c: 'gold' }];
    const text = `你解下腰牌，放在山门石案上。${name}的钟没有为你响。下山时风很大，像整座山在赶人。自此无门无派——代价刻在寿元与心上。`;
    if (emit) emit({ title: '叛宗', text, tags, cls: 'warn', div: true });
    return { ok: true, text, tags };
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
    if (s.karma && s.karma.mate === 'su' && n.su && n.su.met) { bt += 0.04; if (!who.includes('su')) who.push('su'); }
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
    if (o.mentor && s.sect.rank === 2 && !s.sect.master) {
      s.sect.master = true;
      if (s.npc[o.mentor]) s.npc[o.mentor].met = true;
      tags.push({ t: `拜入${NPCS[o.mentor] ? NPCS[o.mentor].name : '师门'}门下`, c: 'up' });
    }
    if (o.mentor && s.sect.rank === 3 && s.npc[o.mentor] && s.npc[o.mentor].a >= 40) {
      const tier = GF_SECT[2];
      const id = tier[ELEMENTS.includes(s.lgEls[0]) ? s.lgEls[0] : pick(ELEMENTS)];
      if (id && !s.gfs[id]) { learn(s, id, tags, emit); tags.push({ t: '师父传法', c: 'up' }); }
    }
    s.acts++;
    const rite = (RITE_TEXT[o.id] && RITE_TEXT[o.id][s.sect.rank]) || `你晋升为${o.ranks[s.sect.rank]}。令牌入手，沉甸甸的。`;
    return { rank: s.sect.rank, name: o.ranks[s.sect.rank], token: o.token[s.sect.rank], text: rite, tags };
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
      emit && emit({ text: `${o.short || '门中'}按例发下${o.ranks[sc.rank]}的俸禄。`, tags, cls: 'sys' });
      if (s.npc.su && s.npc.su.met && s.npc.su.a >= 40 && Math.random() < 0.25) {
        const k = s.inj > 0 ? '回春丹' : '聚气丹'; s.items[k] = (s.items[k] || 0) + 1;
        emit && emit({ text: `苏晚晴托人捎来一只小瓷瓶，瓶底压着一张字条：“${s.inj > 0 ? '伤好之前，不许逞强。' : '修行莫太急。'}”`, tags: [{ t: `得${k}`, c: 'up' }], cls: 'sys' });
      }
      if (s.npc.dx_lian && s.npc.dx_lian.met && s.npc.dx_lian.a >= 40 && Math.random() < 0.2) {
        s.items['回春丹'] = (s.items['回春丹'] || 0) + 1;
        emit && emit({ text: '练清婉让药童送来一枚回春丹，纸条写：「别把命炼进炉里。」', tags: [{ t: '得回春丹', c: 'up' }], cls: 'sys' });
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
    const oid = s.sect && s.sect.org;
    return MISSIONS.filter(m => s.sect.rank >= m.rank[0] && s.sect.rank <= m.rank[1]
      && (!m.rm || (s.realm >= m.rm[0] && s.realm <= m.rm[1]))
      && (!m.orgs || (oid && m.orgs.includes(oid))));
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
    if (!m) return null;
    const lsMul = o ? o.lsMul : 1;
    return { m, uid: mi.uid, name: (o && o.id === 'sx' && typeof SX_MISSION_NAME !== 'undefined' && SX_MISSION_NAME[m.id]) ? SX_MISSION_NAME[m.id] : m.name, brief: fnv(m.brief, s),
      months: m.m * REALMS[s.realm].T, risk: missionRisk(s, m), riskWord: riskWord(missionRisk(s, m)),
      gx: Math.round(m.gx * GX_SCALE[s.realm]), ls: Math.round(m.ls * REALMS[s.realm].lsScale * lsMul) };
  }
  function missionEvent(s, uid) {
    const mi = s.sect.missions.find(x => x.uid === uid); if (!mi) return null;
    const info = missionInfo(s, mi); if (!info) return null;
    const m = info.m;
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
      fx.ls = Math.round(m.ls * (c.lsm || 1) * (o ? o.lsMul : 1) * REALMS[s.realm].lsScale); fx.lsRaw = true;
      if (c.item) fx.item = fnv(c.item, s);
      for (const k of ['xj', 'wx', 'gfXp', 'npc']) if (c[k]) fx[k] = c[k];
      if (c.xw) fx.xw += c.xw;
      text = fnv(c.ok, s);
      if (s.npc.wen && s.npc.wen.met && s.npc.wen.a <= -20 && Math.random() < 0.3) { fx.gx /= 2; text += '只是功劳簿上，这桩差事的一半，不知怎的记在了温庭玉名下。'; }
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
    const pool = (typeof LIB_POOL_ORG !== 'undefined' && s.sect.org && LIB_POOL_ORG[s.sect.org]) || LIB_POOL;
    return pool.filter(id => GONGFA[id]).map(id => ({ id, g: GONGFA[id], cost: LIB_COST[GONGFA[id].grade], known: !!s.gfs[id], open: GONGFA[id].grade <= cap }))
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
  const isSword = s => !!(s.gf && ['baihong', 'taibai'].includes(s.gf)) || !!(s.path && (s.path.daoji === 'jian' || s.path.faxiang === 'jian'));
  function duelPower(s) {
    let mul = 1;
    if (s.path && typeof PATH_TABLE !== 'undefined') {
      const add = (o) => { if (o && o.duel) mul *= o.duel; };
      if (s.path.daoji) add(PATH_TABLE.daoji[s.path.daoji]);
      for (const id of (s.path.danwen || [])) add(PATH_TABLE.danwen[id]);
      if (s.path.faxiang) add(PATH_TABLE.faxiang[s.path.faxiang]);
      if (s.path.jiewen) add(PATH_TABLE.jiewen[s.path.jiewen]);
    }
    return Math.sqrt(gfSpeed(s) / 1.2) * (1 + 0.02 * (gfLv(s) - 1)) * (1 + 0.03 * (s.wx - 5))
      * (1 + 0.05 * s.stage / Math.max(1, REALMS[s.realm].stages.length - 1)) * (s.inj > 0 ? 0.85 : 1) * mul;
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
    gfMatch, gfMatchWord, gfLv, gfSpeed, learn, practice, switchCost, switchGf, setAux, clearAux,
    fabaoAwaken, fabaoFeed, fabaoOnDeath, fabaoSyncStage, equip, unequip, gearTick,
    choosePath, pendingPath, pathAtBreak, pathSummary, finishAscend, emptyPath, pathYouliMul, pathWashCost, washPath,
    addXw, afterGain, passTime, gainMul, checkXj, tuna, biguan, pickEvent, resolveChoice, applyFx,
    btChance, resolveBreak, useItem, useBatchCap, newState, migrate, retire, canRetire,
    lvl, shiftLv, rollFoe, foe, foeStr, foeDr, fightAct,
    org, rankName, caveMul, join, defect, addGx, npcAdd, npcWord, npcLine, npcHelp, canPromote, promote, sectTick,
    ensureMissions, missionInfo, missionEvent, missionAct, riskWord, libList, learnLib,
    duelPower, dabiNew, duelNew, duelTell, duelRound, dabiFinish, DUEL_BEATS: BEATS };
})();
if (typeof module !== 'undefined') module.exports = Core;
