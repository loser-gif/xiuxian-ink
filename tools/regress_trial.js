#!/usr/bin/env node
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const math = Object.create(Math); math.random = () => 0.5;
const ctx = vm.createContext({ console, Math: math, JSON, Object, Array, Number, String, TextEncoder, TextDecoder, Uint8Array, Map, btoa, atob });
for (const f of ['data', 'gongfa', 'gear', 'path', 'story', 'sect', 'baijia', 'world', 'tianxia', 'karma', 'life', 'juan', 'core', 'jianghu', 'codec', 'loops', 'arts', 'people'])
  vm.runInContext(fs.readFileSync(path.join(root, 'js', f + '.js'), 'utf8'), ctx, { filename: f });
const { Core, Codec, LINGGEN, cnDur, GONGFA } = vm.runInContext('({Core, Codec, LINGGEN, cnDur, GONGFA})', ctx);
vm.runInContext("TEXT.biguan = TEXT.biguan.filter(t => t.includes('{d}'))", ctx);
const fresh = (trial = true) => Core.newState('试炼客', { lg: LINGGEN.find(x => x.id === 'san'), els: ['木', '水', '火'], wx: 6, luck: 1, org: 'xj', trial });
let s = fresh();
assert.equal(Core.pendingPath(s), 'daoji');
assert(!Core.choosePath(s, 'daoji', ['zhen']).err);
assert.equal(Core.pendingPath(s), 'danwen');
assert(!Core.choosePath(s, 'danwen', ['gong', 'xin']).err);
assert.equal(Core.pendingPath(s), null);
assert.equal(Core.trialStatus(s).left, 240);
assert.equal(Core.trialStatus(s).result, '');
s.stage = 1;
assert.equal(Core.trialStatus(s).result, 'success');
s.months = 720;
assert.equal(Core.trialStatus(s).result, 'success', 'exact deadline is inclusive');
s.months += 0.01;
assert.equal(Core.trialStatus(s).result, 'timeout', 'late progress cannot win');
s = fresh(); s.months = 719.99;
assert.equal(Core.trialStatus(s).result, '');
s.months = 720;
assert.equal(Core.trialStatus(s).result, 'timeout');
s = fresh(); s.dead = true;
assert.equal(Core.trialStatus(s).result, 'ended');
s.stage = 1;
assert.equal(Core.trialStatus(s).result, 'ended', 'death cannot grant success');
s.flags.trialResult = 'success';
assert.equal(Core.trialStatus(s).result, 'success', 'saved result survives terminal dead flag');
assert.equal(Core.trialStatus(fresh(false)), null);
s = fresh(); delete s.flags.trialYears;
assert.equal(Core.trialStatus(s).left, 240, 'legacy trial defaults to twenty years');
const old = JSON.stringify(s);
assert.equal(Core.migrate(JSON.parse(old)).v, 15);
assert.equal(s.flags.trialResult, undefined, 'status reads do not modify saves');
// Time preview, prose and actual advancement must agree for stacked modifiers,
// court friction, single-use moCut, and the tianmo exclusion.
let cases = 0;
for (const realm of [0, 1, 2, 3, 4]) for (const gf of ['qingming', 'xiaoyao', 'tianmo']) for (const cut of [0, 1]) {
  s = fresh(false); s.realm = realm; s.stage = 0; s.gf = gf; s.gfs[gf] = {lv: 1, xp: 0};
  s.path.daoji = 'zhen'; s.loop.moCut = cut; s.court.rank = 4; s.xj = 80;
  Core.sync(s);
  const factor = Core.gt(s, 'time', 1) * vm.runInContext('courtFriction', ctx)(s).time;
  const raw = [1, 2, 5, 10, 20][realm] * Core.K.biguanMonths;
  const expected = cut && gf !== 'tianmo' ? Math.max(1, Math.round(raw * 0.8 * factor)) : raw * factor;
  const timing = Core.biguanTime(s), before = s.months;
  assert(Math.abs(timing.months - expected) < 1e-8, 'existing duration is preserved');
  assert.equal(s.loop.moCut, cut, 'preview does not spend moCut');
  const out = Core.biguan(s, () => {});
  assert(Math.abs((s.months - before) - timing.months) < 1e-8);
  assert(out.text.includes(cnDur(Math.round(timing.months))), 'prose uses displayed actual duration');
  assert.equal(s.loop.moCut, 0);
  cases++;
}
s = fresh(); s.months = 719; const logs = [];
Core.biguan(s, e => logs.push(e));
assert(logs.some(e => e.title === '试炼期限'));
assert.equal(Core.trialStatus(s).result, 'timeout');
console.log('PASS: trial paths, deadline boundaries, legacy saves, no read mutation; ' + cases + ' cultivation timing cases');
