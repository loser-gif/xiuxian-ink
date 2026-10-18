#!/usr/bin/env node
/* 墨仙录 · 流程审计：存档迁移、存档码、早期经济、空选项、闭关长段。 */
'use strict';
const vm = require('vm'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');

function makeLS() {
  const m = new Map();
  return {
    getItem: k => m.has(k) ? m.get(k) : null,
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
  };
}

function boot() {
  const ctx = vm.createContext({
    console, Math, JSON, Object, Array, Number, String, Date, Map,
    TextEncoder, TextDecoder, Uint8Array, btoa, atob,
    localStorage: makeLS(),
  });
  for (const f of ['data', 'gongfa', 'gear', 'path', 'story', 'sect', 'baijia', 'world', 'tianxia', 'karma', 'core', 'codec', 'samsara', 'jianghu', 'slots']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', f + '.js'), 'utf8'), ctx, { filename: f });
  }
  return ctx;
}

const G = boot();
const { Core, Codec, Jianghu, Slots, LINGGEN, ELEMENTS, EVENTS, REALMS } = vm.runInContext(
  '({ Core, Codec, Jianghu, Slots, LINGGEN, ELEMENTS, EVENTS, REALMS })', G);

const findings = [];
const note = (kind, text) => findings.push({ kind, text });

function root(id) {
  const lg = LINGGEN.find(l => l.id === id);
  const sh = [...ELEMENTS];
  const n = { tian: 1, shuang: 2, san: 3, si: 4, wei: 5 }[id] || 3;
  return { lg, els: sh.slice(0, n), wx: 6, luck: 3, org: id === 'wei' ? 'sx' : 'qm' };
}

/* —— 迁移 v10 —— */
{
  const fresh = Core.newState('旧卷', root('san'));
  const xw = fresh.xw, acts = fresh.acts;
  fresh.v = 10;
  delete fresh.marks;
  delete fresh.played;
  const raw = JSON.parse(JSON.stringify(fresh));
  const m = Core.migrate(raw);
  if (!m || m.v !== 11) note('fail', 'v10 存档未能迁到 v11');
  else {
    if (m.xw !== xw) note('fail', '迁移改动了修为 xw');
    if (!Array.isArray(m.marks)) note('fail', '迁移后缺少 marks');
    if (m.played !== Math.round(acts * 6500)) note('fail', '旧档游玩时长估算不对：' + m.played);
    if (!findings.some(f => f.kind === 'fail')) note('ok', 'v10→v11：补 marks 与 played，修为未缩放');
  }
}

/* —— 存档码 —— */
{
  const s = Core.newState('青石', root('san'));
  s.log = [{ title: '拜山', text: '投帖青冥', cls: 'sys' }];
  s.marks = [{ t: '拜山', y: 16 }];
  const code = Codec.encode(s);
  const dec = Codec.decode(code);
  if (!dec.ok) note('fail', '存档码往返失败：' + dec.err);
  else if (dec.data.name !== '青石' || dec.data.v !== s.v) note('fail', '存档码内容不符');
  else note('ok', `存档码往返通过，长度 ${code.length}（${code.startsWith('MX1.') ? 'MX1' : '?'}）`);
  const bad = Codec.decode(code.slice(0, -4) + 'xxxx');
  if (!bad.err) note('fail', '损坏的存档码未被拒绝');
  else note('ok', '损坏存档码被拒绝：' + bad.err);
  const migrated = Core.migrate(dec.data);
  if (!migrated || migrated.name !== '青石') note('fail', '导入后 migrate 未通过');
}

/* —— 旧档落入第一卷 —— */
{
  const ls = G.localStorage;
  ls.removeItem('moxian.slots');
  const legacy = Core.newState('前缘', root('san'));
  legacy.months = 16 * 12 + 8;
  ls.setItem('moxian.v1', JSON.stringify(legacy));
  const box = Slots.loadBox();
  if (!box.slots[0] || box.slots[0].sum.name !== '前缘') note('fail', '单存档没有落入第一卷');
  else if (ls.getItem('moxian.v1')) note('fail', '旧键 moxian.v1 未被摘掉');
  else note('ok', '旧档 moxian.v1 自动落入第一卷，原键已摘');
}

/* —— 早期经济 —— */
{
  let affordable = 0, opening = 0, wins = 0, trials = 400;
  for (let i = 0; i < trials; i++) {
    const s = Core.newState('测', root('san'));
    if (i === 0 && s.ls !== 20) note('fail', '开局灵石不是 20，而是 ' + s.ls);
    s.loc = 'yunyue';
    const a = Jianghu.aucNew(s);
    const cheap = a.lots.find(l => l.k === '聚气丹');
    if (!cheap) continue;
    affordable++;
    Jianghu.aucLot(s, a);
    const open = a.price;
    if (open <= s.ls) opening++;
    let guard = 0;
    while (s.ls >= Math.round(a.price * 1.1) + 1 && guard++ < 8 && a.leader !== 'you') {
      const r = Jianghu.aucRaise(s, a, 0.1);
      if (r.won) { wins++; break; }
      if (r.err) break;
    }
    if (a.leader === 'you' && s.ls >= a.price) {
      const r = Jianghu.aucPass(s, a);
      if (r.won) wins++;
    }
  }
  note('eco', `炼气拍卖抽到聚气丹 ${affordable}/${trials}，开价买得起 ${opening}，穷修能拍下 ${wins}`);
  const s0 = Core.newState('测', root('san'));
  const pJu = 12 * REALMS[0].lsScale, pPo = 45 * REALMS[0].lsScale;
  note('eco', `开局灵石 ${s0.ls}；坊市聚气丹 ${pJu}（${s0.ls >= pJu ? '买得起一次' : '买不起'}），破境丹 ${pPo}（仍买不起）`);
}

/* —— 空选项 / 全禁用 —— */
{
  const dead = [];
  const stages = [0, 1, 2, 3, 4];
  for (const realm of stages) {
    const s = Core.newState('测', root('san'));
    s.realm = realm; s.age = 16 + realm * 40; s.months = s.age * 12; s.ls = 30 * REALMS[realm].lsScale;
    if (Core.sync) Core.sync(s);
    for (const ev of EVENTS) {
      if (!ev || !ev.choices || ev.mission || ev.guide) continue;
      let cs;
      try { ev.text && ev.text(s); cs = ev.choices(s); } catch (e) { continue; }
      if (!cs || !cs.length) { dead.push(ev.id + '@' + realm + ' 无选项'); continue; }
      if (cs.every(c => c.disabled)) dead.push((ev.title || ev.id) + '@' + REALMS[realm].name + ' 全禁用');
    }
  }
  if (dead.length) note('stuck', '疑似死选项 ' + dead.slice(0, 12).join('；') + (dead.length > 12 ? ' …共' + dead.length : ''));
  else note('ok', '五境抽查：没有「一个选项都没有」或「全部禁用」的奇遇');
}

/* —— 闭关长段：均衡策略下连续吐纳/闭关 —— */
{
  const stretches = [];
  for (let n = 0; n < 8; n++) {
    const s = Core.newState('测', root('san'));
    let run = 0, max = 0, guard = 0;
    const bump = kind => { if (kind === 'cult') { run++; if (run > max) max = run; } else run = 0; };
    while (!s.dead && !s.ascended && guard++ < 8000) {
      if (Core.bottleneck(s)) { bump('break'); break; }
      const r = Math.random();
      if (r < 0.45) { Core.biguan(s, () => {}); bump('cult'); }
      else if (r < 0.75) { Core.tuna(s, () => {}); bump('cult'); }
      else {
        bump('out');
        Core.passTime(s, REALMS[s.realm].T, () => {});
        if (s.dead) break;
        const ev = Core.pickEvent(s);
        if (ev && ev.choices) {
          const cs = ev.choices(s).filter(c => !c.disabled);
          if (!cs.length) note('stuck', '游历抽到无可用选项：' + (ev.title || ev.id));
        }
      }
    }
    stretches.push(max);
  }
  stretches.sort((a, b) => a - b);
  note('pace', `炼气阶段连续苦修（无游历）最长 ${stretches[stretches.length - 1]} 手，中位 ${stretches[3]}。满 8 手时界面会提示出山。`);
}

const bad = findings.filter(f => f.kind === 'fail');
console.log(JSON.stringify({ ok: bad.length === 0, findings }, null, 2));
if (bad.length) process.exitCode = 1;
