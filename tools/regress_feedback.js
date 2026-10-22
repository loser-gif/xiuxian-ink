#!/usr/bin/env node
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const math = Object.create(Math); math.random = () => 0.5;
const ctx = vm.createContext({ console, Math: math, JSON, Object, Array, Number, String, TextEncoder, TextDecoder, Uint8Array, Map, btoa, atob });
for (const f of ['data', 'gongfa', 'gear', 'path', 'story', 'sect', 'baijia', 'world', 'tianxia', 'karma', 'life', 'juan', 'core', 'jianghu', 'loops', 'codec'])
  vm.runInContext(fs.readFileSync(path.join(root, 'js', f + '.js'), 'utf8'), ctx, { filename: f });
const { Core, Loop, Codec, Life, LINGGEN, EVENTS, cnDur } = vm.runInContext('({Core, Loop, Codec, Life, LINGGEN, EVENTS, cnDur})', ctx);
const fresh = org => Core.newState('过路客', { lg: LINGGEN.find(x => x.id === 'san'), els: ['木', '水', '火'], wx: 6, luck: 1, org });
const lin = EVENTS.find(e => e.id === 'deed_linzhao');
for (const org of ['', 'sx', 'qm', 'dx', 'xj', 'yy']) {
  const s = fresh(org), visitor = !org || org === 'sx';
  assert.equal(lin.text(s).includes('暂住客院'), visitor);
  const r = lin.choices(s)[0].act(s);
  assert.equal(r.text.includes('客人的身份'), visitor);
  assert.equal(r.fx.xj, 4); assert.equal(r.fx.xw, 0.05);
  assert.equal(Life.deed(s, 'linzhao').kind, 'save');
}
// Cover every existing early-deed summary, including those that already start with 你.
let echoes = 0;
for (const e of EVENTS.filter(e => e.id.indexOf('deed_') === 0)) for (const choice of [0, 1]) {
  const s = fresh(''); e.choices(s)[choice].act(s);
  const echo = EVENTS.find(x => x.id === e.id.replace('deed_', 'echo_'));
  s.months += 360;
  assert(!echo.text(s).includes('你你'), echo.id);
  echoes++;
}
function arrayState() {
  const s = fresh('xj'); s.realm = 1; s.path.daoji = 'zhen'; s.loc = 'qingshi';
  s.months = 480.25; s.xj = 60; Core.sync(s); return s;
}
let s = arrayState(), cost = Loop.seasonOf(s), before = s.months;
assert(Loop.html(s).includes('不随春夏秋冬刷新'));
let r = Loop.act(s, 'zhen:cang', () => {});
assert.equal(r.title, '布阵 · 克制'); assert.equal(s.loop.zhen, 'cang');
assert.equal(s.months - before, cost); assert.equal(s.xj, 59);
assert(r.text.includes('没有额外修为、灵石或斗法加成'));
const after = JSON.stringify(s);
assert(Loop.act(s, 'zhen:kun', () => {}).err); assert.equal(JSON.stringify(s), after);
s.months += cost - 0.01;
assert(Loop.act(s, 'zhen:kun', () => {}).err, 'fractional month must not open early');
s.months += 0.01;
r = Loop.act(s, 'zhen:kun', () => {});
assert.equal(r.title, '布阵 · 平势'); assert(r.text.includes('原「藏」阵图已被替换'));
s.months += cost; s.xj = 30;
r = Loop.act(s, 'zhen:kun', () => {});
assert.equal(r.title, '布阵 · 被克'); assert.equal(s.loop.zhen, '');
assert(Loop.act(s, 'zhen:sheng', () => {}).err);
assert.equal(s.loop.zhenBan, s.months + cost);
s.months += cost; s.xj = 60; s.inj = 100;
const injury = s.inj;
r = Loop.act(s, 'zhen:sheng', () => {});
assert.equal(r.title, '布阵 · 克制'); assert(r.tags.some(t => t.t === '伤势 −1'));
assert(s.inj < injury); assert.equal(s.loop.zhen, 'sheng');
assert(Loop.dress([], {id:'m_zhenmai', _mid:'zhenmai', _uid:1}, s).some(c => c.label === '以阵镇脉'));
assert.equal(Loop.dress([], {id:'xw_altar'}, s).length, 0);
s.months += cost; s.loc = 'xuewu'; s.inj = 0;
r = Loop.act(s, 'zhen:sha', () => {});
assert(r.text.includes('原「生」阵图已被替换'));
assert(Loop.dress([], {id:'xw_altar'}, s).some(c => c.label === '走到坛前改阵'));
assert.equal(Loop.dress([], {id:'m_zhenmai', _mid:'zhenmai', _uid:1}, s).length, 0);
assert.equal(Core.migrate(Codec.decode(Codec.encode(s)).data).loop.zhen, 'sha');
Loop.resetDaoji(s); assert.equal(s.loop.zhen, '');
// Legacy missing-loop saves still open without raising SAVE_V.
s = arrayState(); delete s.loop;
assert.equal(Core.migrate(s).v, 14); assert.equal(s.loop.zhen, '');
// Exercise real event lists and mission metadata, rather than synthetic labels only.
const routes = [['sheng', 'vein', '以生阵养脉'], ['sheng', 'tide_lingku', '以生阵疏脉'], ['kun', 'bandit', '以困阵断后'], ['cang', 'hei_ambush', '藏入巷中月影'], ['cang', 'heifeng', '隐去商队行迹']];
for (const [form, id, label] of routes) {
  s = arrayState(); s.loop.zhen = form; s.flags.tideDue = 'lingku'; s.flags.heiGrudge = 1; s.inj = 3;
  const ev = EVENTS.find(e => e.id === id), choices = ev.choices(s);
  const c = Loop.dress(choices, ev, s).find(c => c.label === label);
  assert(c, id); const ls = s.ls, xw = s.xw;
  r = c.act(s); Core.applyFx(s, r.fx, () => {});
  assert(!r.fx.ls && !r.fx.xw, id + ' must not pay combat loot');
  if (id !== 'heifeng') { assert.equal(s.ls, ls); assert.equal(s.xw, xw); }
  if (id === 'vein') assert.equal(s.inj, 2);
  if (id === 'tide_lingku') { assert.equal(s.shi.side.lingku, 'share'); assert.notEqual(s.flags.tideDue, 'lingku'); assert(s.flags.shanCi); }
  if (id === 'hei_ambush') { assert.equal(s.flags.heiGrudge, 2); assert(!ev.cond(s)); }
  assert.equal(s.loop.zhen, form, 'using a retained diagram does not erase it');
  for (const other of ['kun', 'sheng', 'sha', 'cang', '']) if (other !== form) {
    s.loop.zhen = other; assert(!Loop.dress(choices, ev, s).some(c => c.label === label));
  }
}
s = arrayState(); s.loop.zhen = 'sheng'; s.sect.missions = [{id:'zhenmai', uid:1}];
const mission = Core.missionEvent(s, 1);
assert(mission && mission._mid.id === 'zhenmai');
r = Loop.dress(mission.choices(s), mission, s).find(c => c.label === '以阵镇脉').act(s);
assert(r.text.includes('灵气按回脉里')); assert.equal(s.sect.missions.length, 0);
console.log('PASS: 6 identity variants; ' + echoes + ' echo summaries; array cooldown boundaries, overwrite, failure, healing, event options and save round-trip');
