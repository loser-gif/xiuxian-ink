#!/usr/bin/env node
/* 墨仙录 · 事件审计：逐一事件、逐一境界、逐一选项反复结算，揪出“以强凌弱反受伤”与“杀鸡得牛”
   node tools/audit_events.js            退出码非零表示有违例 */
'use strict';
const vm = require('vm'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const ctx = vm.createContext({ console, Math, JSON, Object, Array, Number, String });
for (const f of ['data', 'gongfa', 'story', 'sect', 'core']) vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', f + '.js'), 'utf8'), ctx, { filename: f });
const { Core, LINGGEN, EVENTS, MISSIONS, REALMS, NPCS } = vm.runInContext('({ Core, LINGGEN, EVENTS, MISSIONS, REALMS, NPCS })', ctx);
const RN = REALMS.map(r => r.name);
const ENEMY = /劫修|妖|蟒|狼(?!狈)|蛟|魔修|贼|匪|凶兽|山魈|叛徒|对手|弟子|修士|刺客|血煞|围在/;
// 天灾、禁制、丹炉、心魔、自损之类：并无敌手，受伤与境界高下无关。新增此类事件须在此登记，否则审计报错。
const HAZARD = new Set(['cave', 'thunder', 'fox', 'furnace', 'meteor', 'mirror', 'jianzhong', 'danhui', 'hantan2', 'huoshan', 'wuxingbei', 'tianji', 'jieyun', 'xinmojie', 'su_fire',
  '任务:caiyao', '任务:danfang', '任务:zhenmai', '任务:tanmi', 'leichi', 'fengyan', 'binghu']);
const TRIALS = +(process.argv[2] || 60);
const hazards = new Set(), flags = [], stat = { events: 0, fights: 0, checks: 0 };
function mkState(realm, stage) {
  const lg = LINGGEN.find(l => l.id === 'san');
  const s = Core.newState('审计', { lg, els: ['金', '水', '土'], wx: 6, luck: 2 });
  s.realm = realm; s.stage = stage; s.months = (40 + realm * 120) * 12; s.ls = 99999;
  s.sect.rank = 3; s.sect.master = true; s.sect.gxTotal = 500;
  for (const id in s.npc) { s.npc[id].met = true; s.npc[id].a = 50; }
  s.items = { '延寿果': 1, '回春丹': 1 }; s.flags.disciple = 1; s.gfs.baihong = { lv: 3, xp: 0 }; s.gf = 'baihong';
  Core.sync(s); return s;
}
const clone = o => JSON.parse(JSON.stringify(o));
function check(src, label, s, res, ctxText) {
  stat.checks++;
  const fx = res.fx || {}, hurt = (fx.inj > 0) || (fx.life < 0);
  const where = `${src} · ${label} @${RN[s.realm]}${REALMS[s.realm].stages[s.stage]}`;
  if (res.fight) {
    stat.fights++;
    if (res.fight.dr >= 1 && hurt) flags.push(`[以强受伤] ${where} 敌${res.fight.foe}：${res.text.slice(0, 40)}`);
    if (res.fight.dr >= 2 && fx.xw > 0.05) flags.push(`[杀鸡得牛] ${where} 敌${res.fight.foe} 修为${fx.xw}`);
    if (res.fight.dr === 1 && fx.xw > 0.15) flags.push(`[赏格过厚] ${where} 敌${res.fight.foe} 修为${fx.xw}`);
    return;
  }
  if (hurt && process.env.LIST) hazards.add(src + ' · ' + label + '：' + res.text.slice(0, 34));
  // 无敌我标注的受伤结局：文中若写明了低于玩家的境界，便是写死的弱敌
  if (hurt) {
    const txt = ctxText + res.text;
    for (let k = 0; k < s.realm; k++) if (txt.includes(RN[k]) && ENEMY.test(txt)) { flags.push(`[写死弱敌] ${where}：文中“${RN[k]}”而玩家已${RN[s.realm]}：${res.text.slice(0, 40)}`); break; }
    if (!HAZARD.has(src)) flags.push(`[未标敌手] ${where}：受伤却无敌我结算（若属天灾禁制，请登记 HAZARD）：${res.text.slice(0, 40)}`);
  }
}
for (const ev of EVENTS) {
  stat.events++;
  for (let r = 0; r < 5; r++) for (const st of [0, REALMS[r].stages.length - 1]) {
    const s0 = mkState(r, st);
    if (ev.rm && (r < ev.rm[0] || r > ev.rm[1])) continue;
    if (ev.cond) { try { if (!ev.cond(clone(s0))) continue; } catch (e) { continue; } }
    for (let t = 0; t < TRIALS; t++) {
      const s = clone(s0); s.evFoe = null;
      const text = ev.text(s);
      const cs = ev.choices(s);
      cs.forEach((c, i) => {
        if (c.disabled) return;
        const s2 = clone(s); const res = c.act(s2);
        check(ev.id, `${i}:${c.label}`, s2, res, text);
      });
    }
  }
}
for (const m of MISSIONS) for (let r = 0; r < 5; r++) {
  if (m.rm && (r < m.rm[0] || r > m.rm[1])) continue;
  for (let t = 0; t < TRIALS; t++) {
    const s = mkState(r, 1); s.sect.rank = Math.max(m.rank[0], Math.min(m.rank[1], 3)); s.sect.missions = [{ uid: 1, id: m.id }];
    const ev = Core.missionEvent(s, 1); if (!ev) continue; const text = ev.text(s);
    ev.choices(s).forEach((c, i) => { const s2 = clone(s); s2.sect.missions = [{ uid: 1, id: m.id }]; const ev2 = Core.missionEvent(s2, 1); const res = ev2.choices(s2)[i].act(s2); check('任务:' + m.id, `${i}:${c.label}`, s2, res, text); });
  }
}
if (process.env.LIST) { console.log('—— 无敌手的受伤结局（天灾/禁制/心魔/自损）——'); [...hazards].forEach(h => console.log('  ' + h)); }
const uniq = [...new Set(flags.map(f => f.replace(/@\S+/, '@').replace(/：.*$/, '')))];
const byKey = {}; flags.forEach(f => { const k = f.replace(/@\S+/, '@').replace(/：.*$/, ''); (byKey[k] = byKey[k] || []).push(f); });
console.log(`审计：事件${stat.events}个 · 任务${MISSIONS.length}个 · 结算${stat.checks}次（其中敌我结算${stat.fights}次）`);
if (!uniq.length) { console.log('无违例。'); process.exit(0); }
console.log(`违例 ${uniq.length} 类：`);
for (const k of uniq) console.log('  ' + byKey[k][0] + (byKey[k].length > 1 ? `  （共${byKey[k].length}次）` : ''));
process.exit(1);
