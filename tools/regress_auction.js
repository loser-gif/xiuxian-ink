#!/usr/bin/env node
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const math = Object.create(Math); math.random = () => 0.5;
const ctx = vm.createContext({ console, Math: math });
for (const f of ['data', 'gongfa', 'gear', 'path', 'story', 'sect', 'baijia', 'world', 'tianxia', 'karma', 'life', 'juan', 'core', 'jianghu', 'loops', 'arts'])
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f + '.js'), 'utf8'), ctx, { filename: f });
const { Core, J, LINGGEN } = vm.runInContext('({Core, J:Jianghu, LINGGEN})', ctx);
const json = s => JSON.parse(JSON.stringify(s));
function fresh() {
  const s = Core.newState('寄拍人', { lg: LINGGEN.find(l => l.id === 'san'), els: ['金', '水', '土'], wx: 6, luck: 2 });
  s.realm = 2; s.loc = 'yunyue'; Core.sync(s); s.auc = { next: s.months }; s.items = { 凝元丹: 1, 聚气丹: 2 }; s.ls = 340;
  return s;
}
function held() { const s = fresh(); assert(!J.consign(s, '凝元丹').err); return s; }
function lastLot(s) {
  const a = J.aucNew(s); assert.equal(a.lots.length, 4); a.i = 2;
  const l = J.aucLot(s, a); assert(l.consign); a.price = 50; a.ids = ['zhao', 'qian']; a.max = { zhao: 100, qian: 80 };
  return a;
}
// A second deposit cannot overwrite the first, including repeated UI clicks.
let s = held(); assert(J.consign(s, '聚气丹').err); assert.equal(s.items.聚气丹, 2);
// A save made before entry retains the deposit rather than returning it early.
let loaded = Core.migrate(json(s)); assert(loaded.auc.hold); assert(!loaded.items.凝元丹); assert.equal(loaded.v, 15);
// Reload while bidding on the other lots must return the still-unsettled deposit once.
let a = lastLot(s); loaded = Core.migrate(json(s)); assert.equal(loaded.items.凝元丹, 1); assert(!loaded.auc.pending);
loaded = Core.migrate(json(loaded)); assert.equal(loaded.items.凝元丹, 1); assert.equal(loaded.ls, 340);
assert(J.consign(loaded, '聚气丹').err, 'finished auction cannot accept another deposit');
// The displayed hammer price is gross; existing 18% commission remains unchanged.
const r = J.aucPlayConsign(s, a); assert.equal(a.price, 90); assert.equal(a.leader, 'zhao'); assert.equal(r.pay, 74); assert.equal(s.ls, 414);
assert.strictEqual(J.aucPlayConsign(s, a), r); assert.equal(s.ls, 414, 'settlement must not pay twice');
loaded = Core.migrate(json(s)); assert.equal(loaded.ls, 414); assert(!loaded.items.凝元丹); assert(!loaded.auc.pending);
// Unsold items return once, and survive save/load without becoming both cash and goods.
s = held(); a = lastLot(s); a.max = { zhao: 0, qian: 0 };
const unsold = J.aucPlayConsign(s, a); assert(unsold.returned); assert.equal(s.items.凝元丹, 1); assert.equal(s.ls, 340); assert.equal(a.leader, null);
J.aucPlayConsign(s, a); loaded = Core.migrate(json(s)); assert.equal(loaded.items.凝元丹, 1); assert.equal(loaded.ls, 340);
// Missing the whole auction window cannot silently discard the deposited item.
s = held(); s.months += 1000; J.tick(s); assert.equal(s.items.凝元丹, 1); J.tick(s); assert.equal(s.items.凝元丹, 1);
console.log('PASS: deposit protection, legacy hold, interrupted reload, sold/unsold settlement, single payment, price and fee, expiry');
