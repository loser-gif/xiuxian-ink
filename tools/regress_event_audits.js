#!/usr/bin/env node
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const random = Object.create(Math), ctx = vm.createContext({ console, Math: random });
for (const f of ['data', 'gongfa', 'gear', 'path', 'story', 'sect', 'baijia', 'world', 'tianxia', 'karma', 'life', 'juan', 'core', 'jianghu', 'loops', 'arts']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f + '.js'), 'utf8'), ctx);
}
const { Core, EVENTS, LINGGEN } = vm.runInContext('({Core, EVENTS, LINGGEN})', ctx);
let checks = 0;
function state(realm) {
  random.random = () => 0.5;
  const s = Core.newState('regression', { lg: LINGGEN.find(l => l.id === 'san'), els: ['金', '水', '土'], wx: 6, luck: 2, org: 'qm' });
  s.realm = realm; s.stage = 0; s.ls = 100; s.sect.rank = 4; Core.sync(s); return s;
}
function mission(id, realm, choice, roll) {
  const s = state(realm); s.sect.missions = [{ uid: 1, id }];
  const ev = Core.missionEvent(s, 1); assert(ev, id); ev.text(s);
  const c = ev.choices(s)[choice], foe = JSON.stringify(s.evFoe), done = s.sect.done, acts = s.acts;
  random.random = () => roll; const result = c.act(s);
  assert.strictEqual(s.sect.missions.length, 0); assert.strictEqual(s.sect.done, done + 1); assert.strictEqual(s.acts, acts + 1);
  assert.strictEqual(JSON.stringify(s.evFoe), foe, 'preview foe must not reroll'); checks++;
  return { result, c };
}
for (const id of ['shouyuan', 'xunhe']) {
  for (const realm of [0, 1, 2]) for (const roll of [0, 0.999]) {
    const { result: r, c } = mission(id, realm, 1, roll);
    assert.strictEqual(r.ok, roll > 0.9, 'realm must not turn failed commission into success');
    if (r.ok) {
      assert.strictEqual(r.fx.xw, 0.05, 'commission reward is not enemy cultivation');
      assert(r.fx.gx > 0 && r.fx.ls > 0 && r.fx.lsRaw && r.fx.time > 0);
      assert(!r.fight, 'successful search need not be a fight');
    } else {
      assert.strictEqual(r.fight.dr, realm);
      assert.strictEqual(r.fx.inj || 0, realm === 0 ? 1 : 0);
      assert(!r.fx.ls && !r.fx.xw, 'failure must not award success rewards');
      if (realm > 0) assert(c.sub.includes('仍可能失败'));
    }
  }
}
for (const roll of [0, 0.999]) {
  const r = mission('liexi', 3, 1, roll).result;
  assert.strictEqual(r.ok, roll > 0.9);
  if (!r.ok) assert(r.fight && r.fight.dr <= 0 && r.fx.inj === 3);
}
for (const [id, realm, choice] of [['weishou', 1, 1], ['lianzhi', 4, 1], ['liexi', 4, 0]]) {
  const r = mission(id, realm, choice, 0).result;
  assert(!r.ok && !r.fight && r.fx.inj > 0, 'hazards retain original injury');
}
const wounded = EVENTS.find(e => e.id === 'wounded');
for (const realm of [0, 1, 2, 4]) for (const roll of [0.449, 0.45, 0.999]) {
  const s = state(realm); s.flags.rescueNow = 'zhuangshang'; wounded.text(s);
  const c = wounded.choices(s)[0]; random.random = () => roll; const r = c.act(s);
  if (roll < 0.45) { assert.strictEqual(r.fx.ls, 12); assert.strictEqual(r.fx.xj, 3); assert(!r.fight); }
  else {
    assert(r.fight && r.fight.dr === realm);
    assert.strictEqual(r.fx.inj || 0, realm === 0 ? 1 : 0);
    assert.strictEqual(r.fx.ls, -25); assert(r.fx.lsRaw); assert.strictEqual(r.fx.xj, -4);
    if (realm > 0) assert(c.sub.includes('仍可能失财'));
  }
  checks++;
}
console.log('Event audit regressions passed: ' + checks + ' deterministic cases.');
