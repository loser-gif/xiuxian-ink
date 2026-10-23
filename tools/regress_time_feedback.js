#!/usr/bin/env node
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const math = Object.create(Math); math.random = () => 0.5;
const ctx = vm.createContext({ console, Math: math });
for (const f of ['data', 'gongfa', 'gear', 'path', 'story', 'sect', 'baijia', 'world', 'tianxia', 'karma', 'life', 'juan', 'core', 'jianghu', 'loops', 'arts', 'people'])
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f + '.js'), 'utf8'), ctx, { filename: f });
const { Core, J, EVENTS, LINGGEN, cnDur } = vm.runInContext('({Core, J:Jianghu, EVENTS, LINGGEN, cnDur})', ctx);
vm.runInContext("TEXT.tuna = TEXT.tuna.filter(t => t.includes('{d}'))", ctx);
assert.equal(cnDur(24.8832), '二年一月');
assert.equal(cnDur(5.999999), '半载');
const near = (a, b) => assert(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
function fresh(realm) {
  const s = Core.newState('行旅客', { lg: LINGGEN.find(l => l.id === 'san'), els: ['金', '水', '土'], wx: 6, luck: 2 });
  s.realm = realm; s.path.daoji = 'zhen'; s.lifeBonus = 10000; s.loc = 'qingshi';
  s.court = { rank: 4, dao: 60, bing: 0, min: 0, score: 0 };
  for (const id of ['houtu', 'houtuzy', 'xiaoyao']) s.gfs[id] = { lv: 3, xp: 0 };
  s.gf = 'houtu'; s.aux = ['houtuzy']; Core.sync(s); return s;
}
let checks = 0;
for (let realm = 0; realm < 5; realm++) for (const target of ['houtuzy', 'xiaoyao']) for (const enough of [false, true]) {
  const s = fresh(realm); s.xw = enough ? Core.req(s) : 0;
  const before = JSON.stringify(s), c = Core.switchCost(s, target), logs = [];
  assert.equal(JSON.stringify(s), before, 'preview must not mutate or remove an auxiliary');
  const at = s.months; Core.switchGf(s, target, x => logs.push(x));
  near(s.months - at, c.duration);
  assert(logs.find(l => l.title === '转修').text.includes(cnDur(c.duration)));
  assert(!s.aux.includes(target)); assert.equal(s.gfs.houtu.lv, 2);
  if (!enough) assert(c.extra > 0 && c.extraDuration > 0);
  checks++;
}
for (let realm = 0; realm < 5; realm++) for (const target of ['qingshi', 'yunyue']) {
  const s = fresh(realm), base = J.travelMonths(s, target);
  const expected = base * Core.gt(s, 'time', 1) * 1.06, at = s.months;
  near(Core.timeMonths(s, base), expected);
  const r = J.travel(s, target, () => {});
  near(r.months, expected); near(s.months - at, expected); checks++;
}
for (let realm = 0; realm < 5; realm++) {
  const s = fresh(realm), at = s.months;
  const r = Core.tuna(s, () => {});
  if (r.text.includes('月') || r.text.includes('年') || r.text.includes('载') || r.text.includes('季'))
    assert(r.text.includes(cnDur(Math.round(s.months - at))));
  checks++;
}
const tea = EVENTS.find(e => e.id === 'deed_zhouwan'), road = EVENTS.find(e => e.id === 'deed_zhaoheng');
for (const realm of [0, 1]) {
  const s = fresh(realm), cost = Core.scaleLs(s, 6); s.ls = cost - 1;
  assert.strictEqual(tea.choices(s)[0].disabled, true);
  s.ls = cost; const c = tea.choices(s)[0]; assert.strictEqual(c.disabled, false);
  assert(Core.tollText(s, c.toll)); const r = Core.resolveChoice(s, c), out = Core.applyFx(s, r.fx, () => {});
  assert.equal(s.ls, 0); assert(out.tags.some(t => t.t.includes('灵石')));
  const rc = road.choices(s)[0]; assert(rc.sub.includes('不耗灵石'));
  const rr = Core.resolveChoice(s, rc); Core.applyFx(s, rr.fx, () => {});
  assert.equal(s.ls, 0); assert(rr.text.includes('凡间铜钱')); checks += 2;
}
console.log(`PASS: ${checks} time/transfer/travel and debt-feedback cases; actual time formula unchanged`);
