#!/usr/bin/env node
/* 墨仙录 · 无头平衡模拟：node tools/sim.js [runs] [strategy] */
'use strict';
const vm = require('vm'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
function load() {
  const ctx = vm.createContext({ console, Math, JSON, Object, Array, Number, String });
  for (const f of ['data', 'gongfa', 'gear', 'path', 'story', 'sect', 'world', 'core', 'jianghu']) vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', f + '.js'), 'utf8'), ctx, { filename: f });
  return vm.runInContext('({ Core, Jianghu, LINGGEN, ELEMENTS, EVENTS, GONGFA, REALMS, LOCS, LOC, MIJING, RECIPES, ITEM_VAL, PATH_TABLE, PATH_KIND, DAOJI })', ctx);
}
const G = load(), { Core, Jianghu, LINGGEN, ELEMENTS, GONGFA, REALMS, LOCS, LOC, MIJING, RECIPES, ITEM_VAL, PATH_TABLE } = G;
const JH = !process.env.NOJH;
if (process.env.JK) Object.assign(Jianghu.K, JSON.parse(process.env.JK));
if (process.env.K) Object.assign(Core.K, JSON.parse(process.env.K));
// 真实耗时估计（秒）：动画 + 阅读 + 点按
const SEC = { travel: 20, market: 26, auction: 50, craft: 14, mjNode: 16, mjEnter: 14, tuna: 4.2, biguan: 5.0, youli: 22, break: 18, item: 5, gfSwitch: 10, mission: 24, promo: 14, lib: 7, duelIntro: 12, duelRound: 7, dabi: 10 };
const STRATS = {
  balanced: { mission: .06, biguan: 0.45, tuna: 0.30, youli: 0.25 },
  grinder: { mission: .03, biguan: 0.72, tuna: 0.10, youli: 0.18 },
  wanderer: { mission: .07, biguan: 0.33, tuna: 0.22, youli: 0.45 },
  tapper: { mission: .05, biguan: 0.15, tuna: 0.65, youli: 0.20 },
};
function rollRoot(id) {
  const lg = LINGGEN.find(l => l.id === id);
  const sh = [...ELEMENTS].sort(() => Math.random() - 0.5);
  const n = { tian: 1, shuang: 2, san: 3, si: 4, wei: 5 }[id];
  const els = id === 'yi' ? [['雷', '风', '冰'][Math.floor(Math.random() * 3)]] : sh.slice(0, n);
  const wx = Math.max(1, Math.min(10, 3 + Math.floor(Math.random() * 5) + (Math.random() < 0.12 ? 2 : 0)));
  return { lg, els, wx, luck: Math.floor(Math.random() * 6) };
}
const noop = () => {};
function gfVal(s, id, allowMo) {
  const g = GONGFA[id];
  return Core.gfSpeed(s, id) * (g.t.bt ? 1 + g.t.bt * 2 : 1) * (g.mo && !allowMo ? 0.6 : 1);
}
function bestGf(s, allowMo) {
  if (s.xj < 30 && !(s.gf && GONGFA[s.gf].mo)) return s.gf;                       // 心境不稳时不换功
  let best = s.gf, bv = s.gf ? gfVal(s, s.gf, allowMo) : 0;
  for (const id of Object.keys(s.gfs)) {
    if (GONGFA[id].mo && !allowMo) continue;
    const v = gfVal(s, id, allowMo);
    if (v > bv * 1.12) { best = id; bv = v; }
  }
  return best;
}
function play(rootId, strat, opt = {}) {
  const s = Core.newState('模拟', rollRoot(rootId));
  const mix = STRATS[strat]; let sec = 0, n = { tuna: 0, biguan: 0, youli: 0, break: 0, mission: 0, promo: 0, dabi: 0 }, idle = 0;
  const realmAt = [0, 0, 0, 0, 0];   // 到达各境界的耗时
  let guard = 0;
  while (!s.dead && !s.ascended && guard++ < 20000) {
    // 定型补选（迁移存档）
    const pk = Core.pendingPath(s);
    if (pk) {
      const tab = PATH_TABLE[pk], ids = Object.keys(tab);
      const pick = pk === 'danwen' ? ids.slice(0, 1) : [ids[Math.floor(Math.random() * ids.length)]];
      Core.choosePath(s, pk, pick, noop); sec += 8;
    }
    // 物品
    for (const k of ['延寿果', '延寿丹', '回春丹', '聚气丹', '清心丹', '破障丹']) {
      if (!(s.items[k] > 0)) continue;
      if (k === '回春丹' && s.inj <= 0) continue;
      if (k === '聚气丹' && Core.bottleneck(s)) continue;
      if (k === '清心丹' && s.xj > 35) continue;
      if (k === '破障丹' && Core.bottleneck(s) && s.btBuff) continue;
      const r = Core.useItem(s, k); if (!r.err) { Core.afterGain(s, r.ups, noop); sec += SEC.item; }
    }
    // 宗门：能升则升、藏经阁择优、大比必到
    if (s.sect.org && !opt.noSect) {
      if (Core.canPromote(s).ok) { Core.promote(s, noop); sec += SEC.promo; n.promo++; }
      for (const it of Core.libList(s)) if (it.open && !it.known && s.sect.gx >= it.cost && !it.g.mo && gfVal(s, it.id) > gfVal(s, s.gf || 'qingming') * 1.12) { Core.learnLib(s, it.id, noop); sec += SEC.lib; }
      if (s.sect.dabiDue) { sec += runDabi(s); n.dabi++; if (s.dead) break; }
    }
    if (JH) { sec += jhStep(s, n); if (s.dead) break; }
    const b = bestGf(s, opt.mo);
    if (b !== s.gf && !Core.bottleneck(s)) { Core.switchGf(s, b, noop); sec += SEC.gfSwitch; if (s.dead) break; }
    // 辅修：择一非主修、相合功法
    if (Core.setAux && (s.aux || []).length < 2) {
      for (const id of Object.keys(s.gfs)) {
        if (id === s.gf || (s.aux || []).includes(id) || GONGFA[id].mo) continue;
        if (Core.gfMatch(s, id) >= 1) { Core.setAux(s, id); break; }
      }
    }
    // 坊市凡兵
    if (JH && s.ls > 120 && !(s.eq && s.eq.weapon) && s.items['精铁短剑'] > 0) Core.equip(s, '精铁短剑');
    else if (JH && s.mkt && s.mkt.st && s.mkt.st['精铁短剑'] > 0 && s.ls >= Jianghu.price(s, '精铁短剑') && !(s.eq && s.eq.weapon)) {
      Jianghu.buy(s, '精铁短剑'); if (s.items['精铁短剑']) Core.equip(s, '精铁短剑'); sec += SEC.market * 0.3;
    }
    if (Core.bottleneck(s)) {
      const pill = s.items[REALMS[s.realm].pill] > 0, p = Core.btChance(s, pill);
      const left = s.lifespan - s.age;
      if (pill || p >= 0.5 || idle >= 3 || left < REALMS[s.realm].T * 6) {
        const before = s.realm; const res = Core.resolveBreak(s, pill, noop); sec += SEC.break; n.break++; idle = 0;
        if (res.ok && res.needPath) {
          const tab = PATH_TABLE[res.needPath], ids = Object.keys(tab);
          const pick = res.needPath === 'danwen' ? ids.slice(0, 1 + (Math.random() < 0.45 ? 1 : 0)) : [ids[Math.floor(Math.random() * ids.length)]];
          Core.choosePath(s, res.needPath, pick, noop);
          if (res.pendingAscend) Core.finishAscend(s, noop);
        }
        if (res.ok && s.realm > before) realmAt[s.realm] = sec;
        continue;
      }
      idle++; // 去游历碰碰运气（找破境丹）
      doYouli(s); sec += tsAdd('youli', SEC.youli); n.youli++; continue;
    }
    if (s.sect.org && !opt.noSect && Math.random() < mix.mission) {
      const ms = Core.ensureMissions(s);
      if (ms.length) { doMission(s, ms[Math.floor(Math.random() * ms.length)].uid); sec += SEC.mission; n.mission++; continue; }
    }
    const r = Math.random();
    if (r < mix.biguan) { const o = Core.biguan(s, noop); Core.afterGain(s, o.ups, noop); sec += SEC.biguan; n.biguan++; }
    else if (r < mix.biguan + mix.tuna) { const o = Core.tuna(s, noop); Core.afterGain(s, o.ups, noop); sec += SEC.tuna; n.tuna++; }
    else { doYouli(s); sec += tsAdd('youli', SEC.youli); n.youli++; }
  }
  if (process.env.TS) for (const k in n) tsAdd('n.' + k, n[k] * 60);
  return { s, sec, n, realmAt };
}
function doYouli(s) {
  let ev;
  if (JH) {
    // 择地而行：多往与境界相称之处；偶尔回山门、去坊市、或随缘
    const ok = LOCS.filter(l => Jianghu.canGo(s, l.id)), r = Math.random();
    let to;
    if (r < 0.1) to = null;
    else if (r < 0.55) to = s.loc;
    else { const w = ok.map(l => (l.rm === s.realm ? 3 : l.rm === s.realm - 1 ? 1.5 : 1) * (l.id === 'shanmen' && s.sect.org ? 1.5 : 1)); let tot = w.reduce((a, b) => a + b, 0), x = Math.random() * tot; to = ok[0].id; for (let i = 0; i < ok.length; i++) if ((x -= w[i]) < 0) { to = ok[i].id; break; } }
    if (to === null) { Core.passTime(s, REALMS[s.realm].T * Core.K.youliMonths, noop); if (s.dead) return; ev = Jianghu.pickAt(s, null); }
    else { Jianghu.travel(s, to, noop); if (s.dead) return; ev = Jianghu.pickAt(s, to); }
  } else { Core.passTime(s, REALMS[s.realm].T * Core.K.youliMonths, noop); if (s.dead) return; ev = Core.pickEvent(s); }
  ev.text(s);
  const cs = ev.choices(s).filter(c => !c.disabled && !(c.sub || '').includes('此卷终'));
  const c = cs[Math.floor(Math.random() * cs.length)];
  const res = Core.resolveChoice(s, c); fightCheck(s, ev.id + '·' + c.label, res);
  const o = Core.applyFx(s, res.fx || {}, noop); Core.afterGain(s, o.ups, noop);
}
// 不变式：境界高于敌手（大境界）而受伤折寿，即为违例
const VIOL = {}; let FIGHTS = 0;
function fightCheck(s, key, res) {
  if (!res.fight) return; FIGHTS++;
  const fx = res.fx || {};
  if (res.fight.dr >= 1 && (fx.inj > 0 || fx.life < 0)) VIOL[key] = (VIOL[key] || 0) + 1;
}
function doMission(s, uid) {
  const ev = Core.missionEvent(s, uid); ev.text(s); const cs = ev.choices(s);
  const c = cs[Math.floor(Math.random() * cs.length)];
  const res = Core.resolveChoice(s, c); fightCheck(s, ev.id + '·' + c.label, res);
  const o = Core.applyFx(s, res.fx || {}, noop); Core.afterGain(s, o.ups, noop);
}
// ---------- 江湖：坊市、拍卖、炼丹、秘境 ----------
const TS = {}; const tsAdd = (k, v) => { TS[k] = (TS[k] || 0) + v; return v; };
const STAT = { mkt: 0, auc: 0, craft: 0, boom: 0, mj: 0, mjClear: 0, mjForced: 0, frag: 0 };
function autoDuel(s, opp) {
  const d = Core.duelNew(s, opp); let sec = SEC.duelIntro;
  while (!d.over) { const tl = Core.duelTell(d); const counter = { gong: 'shou', shou: 'shu', shu: 'gong', qi: 'shou' }[tl.tell];
    const m = Math.random() < 0.65 ? counter : ['gong', 'shou', 'shu'][Math.floor(Math.random() * 3)]; Core.duelRound(s, d, m); sec += SEC.duelRound; }
  return { won: d.over === 'win', sec };
}
function jhStep(s, n) {
  let sec = 0;
  // 秘境开启：前往一探
  const open = Jianghu.mjAll().find(id => Jianghu.mjOpen(s, id) && s._mjSkip !== id + s.mj[id].open);
  if (open && Math.random() > 0.7) s._mjSkip = open + s.mj[open].open;
  else if (open && !process.env.NOMJ) {
    const m = MIJING[open]; if (s.loc !== m.loc) { Jianghu.travel(s, m.loc, noop); sec += SEC.travel / 2; if (s.dead) return sec; }
    if (Jianghu.mjOpen(s, open)) { sec += tsAdd('mj', dive(s, open)); n.mj = (n.mj || 0) + 1; return sec; }
  }
  // 坊市：身在云岳坊，或囊中灵石充裕时专程去
  const mkOk = !process.env.NOMKT && s.acts - (s._mk || -1e9) >= 25;
  if (mkOk && (s.loc === 'yunyue' || (Math.random() < 0.04 && s.ls > 120 * REALMS[s.realm].lsScale))) {
    s._mk = s.acts;
    if (s.loc !== 'yunyue') { Jianghu.travel(s, 'yunyue', noop); sec += SEC.travel / 2; if (s.dead) return sec; }
    sec += tsAdd('mkt', market(s));
  }
  // 炼丹：先炼本境破境丹，再炼回春/聚气
  const want = ['zhuji', 'ningyuan', 'huaying'][s.realm];
  const order = [want, 'pozhang', 'yanshou', 'huichun', 'qingxin', 'juqi'].filter(Boolean);
  if (!process.env.NODAN) for (const id of order) if (s.dan.rec.includes(id) && Jianghu.hasHerbs(s, id) && !(id === 'qingxin' && s.xj > 50) && !(id === 'huichun' && (s.items['回春丹'] || 0) > 2)) {
    const r = Jianghu.craft(s, id, noop); sec += tsAdd('craft', SEC.craft); STAT.craft++; if (r.boom) STAT.boom++; break;
  }
  // 藏经阁丹方
  for (const r of Jianghu.libRecipes(s)) if (!r.known && !r.locked && s.sect.gx >= r.cost * 1.5) { Jianghu.buyRecipe(s, r.id); sec += SEC.lib; }
  return sec;
}
function market(s) {
  let sec = SEC.market; STAT.mkt++;
  Jianghu.mktRefresh(s);
  const L = REALMS[s.realm].lsScale, pill = REALMS[s.realm].pill;
  for (const k of Object.keys(s.items)) if (['妖丹', '火精石', '寒铁', '古剑残片', '鲛珠', '龙鳞'].includes(k)) while (s.items[k] > 0) Jianghu.sell(s, k);
  const tryBuy = k => { if (s.mkt.st[k] > 0 && s.ls >= Jianghu.price(s, k)) return Jianghu.buy(s, k); };
  if (Core.bottleneck(s) && !(s.items[pill] > 0)) tryBuy(pill);
  if (s.inj > 0 && !(s.items['回春丹'] > 0)) tryBuy('回春丹');
  if (s.mkt.st['R:huichun'] && s.ls > Jianghu.price(s, 'R:huichun') * 2) tryBuy('R:huichun');
  for (const id of s.dan.rec) for (const [h, q] of Object.entries(RECIPES[id].need)) while ((s.items[h] || 0) < q && s.mkt.st[h] > 0 && s.ls > Jianghu.price(s, h) * 3) Jianghu.buy(s, h);
  if (s.ls > 60 * L && s.mkt.st['聚气丹'] > 0) tryBuy('聚气丹');
  if (Jianghu.aucOpen(s)) sec += auction(s);
  return sec;
}
function auction(s) {
  let sec = SEC.auction; STAT.auc++;
  const a = Jianghu.aucNew(s); let l;
  while ((l = Jianghu.aucLot(s, a))) {
    const cap = Math.min(s.ls * 0.7, l.v * (0.8 + Math.random() * 0.5));
    let won = false;
    for (let k = 0; k < 12; k++) { if (Math.round(a.price * 1.1) > cap) break; const r = Jianghu.aucRaise(s, a, 0.1); if (r.won) { won = true; if (l.frag) STAT.frag++; break; } if (r.err) break; }
  }
  if (s.flags.heiGrudge === 1) { const ev = G.EVENTS.find(e => e.id === 'hei_ambush'); ev.text(s); const c = ev.choices(s)[Math.random() < 0.6 ? 0 : 1]; const res = Core.resolveChoice(s, c); fightCheck(s, 'hei_ambush', res); const o = Core.applyFx(s, res.fx || {}, noop); Core.afterGain(s, o.ups, noop); }
  return sec;
}
function dive(s, id) {
  let sec = SEC.mjEnter; STAT.mj++;
  Jianghu.mjEnter(s, id);
  while (s.dive) {
    const nd = Jianghu.mjNode(s);
    if (typeof nd.text === 'function') nd.text(s);
    const d = s.dive;
    if ((d.hp < 40 && !nd.boss) || (nd.boss && d.hp < 45)) { const o = Jianghu.mjLeave(s, 'retreat', noop); Core.afterGain(s, o.ups, noop); break; }
    const cs = nd.choices(s).filter(c => !(c.ling && d.ling + c.ling < 0));
    const c = cs.length ? cs[Math.floor(Math.random() * cs.length)] : nd.choices(s)[0];
    let won;
    if (c.duelOpp) { const r = autoDuel(s, c.duelOpp(s)); won = r.won; sec += r.sec; }
    const res = Jianghu.mjResolve(s, c, won); sec += SEC.mjNode;
    if (res.fight && res.fight.dr >= 1 && res.hp < 0) VIOL['秘境:' + id] = (VIOL['秘境:' + id] || 0) + 1;
    if (res.fight) FIGHTS++;
    if (res.next !== 'go') { const o = Jianghu.mjLeave(s, res.next, noop); Core.afterGain(s, o.ups, noop); if (res.next === 'clear') STAT.mjClear++; else STAT.mjForced++; }
  }
  return sec;
}
// 大比：七成看破对手的起手，余者随手出招
function runDabi(s) {
  const t = Core.dabiNew(s); let sec = SEC.dabi, place = 0; const beat = [];
  for (let r = 0; r < 3; r++) {
    const d = Core.duelNew(s, t.opps[r]); sec += SEC.duelIntro;
    while (!d.over) {
      const tl = Core.duelTell(d); let m;
      const counter = { gong: 'shou', shou: 'shu', shu: 'gong', qi: 'shou' }[tl.tell];
      if (Math.random() < 0.65) m = counter; else { const ms = ['gong', 'shou', 'shu'].concat(d.qi[0] ? ['qi'] : []); m = ms[Math.floor(Math.random() * ms.length)]; }
      Core.duelRound(s, d, m); sec += SEC.duelRound;
    }
    if (d.over === 'win') { place = r + 1; if (t.opps[r].npc) beat.push(t.opps[r].npc); } else break;
  }
  Core.dabiFinish(s, place, beat);
  return sec;
}
// ---------- 汇总 ----------
const N = +(process.argv[2] || 2000), only = process.argv[3];
const roots = ['tian', 'yi', 'shuang', 'san', 'si', 'wei'];
const pct = (a, q) => { if (!a.length) return 0; const b = [...a].sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.floor(q * b.length))]; };
const out = {};
for (const strat of only ? [only] : Object.keys(STRATS)) {
  out[strat] = {};
  console.log(`\n=== 策略 ${strat} (${N} 局/灵根) ===`);
  console.log('灵根      飞升%  坐化%  入魔%  陨落%  兵解%  最高境界分布(炼/筑/丹/婴/神)       行动中位  飞升用时中位(分)  全体用时中位(分)  功法换修均');
  for (const id of roots) {
    const end = {}, acts = [], winMin = [], allMin = [], reach = [0, 0, 0, 0, 0], seg = [[], [], [], [], []]; let sw = 0, ms = 0, db = 0, inOrg = 0, free = 0; const rk = [0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < N; i++) {
      const { s, sec, n, realmAt } = play(id, strat, { mo: !!process.env.MO, noSect: !!process.env.NOSECT });
      if (s.ascended) { const t = [...realmAt.slice(1), sec]; for (let r = 0; r < 5; r++) seg[r].push((t[r] - (r ? t[r - 1] : 0)) / 60); }
      if (process.env.DBG && s.ending === process.env.DBG) console.log('DBG', id, s.gf, Object.keys(s.gfs).join(','), s.realm, s.xj, s.age);
      end[s.ending || 'none'] = (end[s.ending || 'none'] || 0) + 1;
      reach[s.ascended ? 4 : s.realm]++;
      const a = n.tuna + n.biguan + n.youli + n.break; acts.push(a); allMin.push(sec / 60);
      if (s.ascended) winMin.push(sec / 60);
      sw += Object.keys(s.gfs).length; ms += n.mission; db += n.dabi; if (s.sect.org) { inOrg++; rk[s.sect.rank]++; } if (s.sect.free) free++;
    }
    const f = k => ((end[k] || 0) / N * 100).toFixed(1).padStart(5);
    const row = `${(id + '     ').slice(0, 7)} ${f('ascend')}  ${f('zuohua')}  ${f('rumo')}  ${f('yunluo')}  ${f('bingjie')}   ${reach.map(x => (x / N * 100).toFixed(0).padStart(3)).join('/')}            ${String(pct(acts, .5)).padStart(5)}     ${pct(winMin, .5).toFixed(1).padStart(6)} (p25 ${pct(winMin, .25).toFixed(0)}–p75 ${pct(winMin, .75).toFixed(0)})   ${pct(allMin, .5).toFixed(1).padStart(6)}        ${(sw / N).toFixed(1)}`;
    if (process.env.TS) { console.log('   时间(分/局)', Object.entries(TS).map(([k, v]) => k + ' ' + (v / N / 60).toFixed(1)).join(' · '), '| 江湖', Object.entries(STAT).map(([k, v]) => k + ' ' + (v / N).toFixed(1)).join(' ')); for (const k in TS) delete TS[k]; for (const k in STAT) STAT[k] = 0; }
    console.log(row + `   各境用时中位(分) ${seg.map(a => pct(a, .5).toFixed(1)).join('/')}`);
    console.log(`         宗门：任务均${(ms / N).toFixed(1)} 大比均${(db / N).toFixed(1)} 入门${(inOrg / N * 100).toFixed(0)}% 逍遥${(free / N * 100).toFixed(0)}% 终局位阶(杂/外/内/真/长/峰/掌)% ${rk.map(x => (x / Math.max(1, inOrg) * 100).toFixed(0)).join('/')}`);
    out[strat][id] = { missions: ms / N, dabi: db / N, ranks: rk, end, reach, actsMed: pct(acts, .5), winMinMed: pct(winMin, .5), allMinMed: pct(allMin, .5) };
  }
}
if (process.env.JSON_OUT) fs.writeFileSync(process.env.JSON_OUT, JSON.stringify(out, null, 1));
{ const v = Object.entries(VIOL); console.log(`\n敌我结算 ${FIGHTS} 次 · 以强受伤违例 ${v.length ? v.map(([k, n]) => k + '×' + n).join('，') : '0'}`); if (v.length) process.exitCode = 1; }
