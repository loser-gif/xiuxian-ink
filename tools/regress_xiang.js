#!/usr/bin/env node
/* 法相回首与相裂行迹：回首不了因果；洗相或不再持相则已消；相裂本身仍可已了。 */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = vm.createContext({ console, Math, JSON, Object, Array, Number, String, TextEncoder, TextDecoder, Uint8Array, Map, btoa, atob });
for (const f of ['data', 'gongfa', 'gear', 'path', 'story', 'sect', 'baijia', 'world', 'tianxia', 'karma', 'life', 'juan', 'core', 'jianghu', 'redworld', 'loops', 'codec', 'arts', 'people'])
  vm.runInContext(fs.readFileSync(path.join(root, 'js', f + '.js'), 'utf8'), ctx, { filename: f });
const { Core, Codec, EVENTS, LINGGEN, karmaTraces, karmaSeed } = vm.runInContext('({Core, Codec, EVENTS, LINGGEN, karmaTraces, karmaSeed})', ctx);

function fresh() {
  const s = Core.newState('沈观澜', { lg: LINGGEN.find(x => x.id === 'san'), els: ['金', '木', '水'], wx: 6, luck: 1, org: 'xj' });
  s.realm = 3; s.stage = 0; s.ls = 500000; s.xj = 70; s.months = 200 * 12;
  Core.sync(s);
  return s;
}
const look = s => karmaTraces(s, 0).find(x => x.name === '相裂');
const ev = id => EVENTS.find(e => e.id === id);
const pending = s => karmaTraces(s, 0).some(x => x.name === '相裂' && (x.st === '将至' || x.st === '伏笔'));

let s = fresh();
assert.equal(s.v, 16);
assert(!Core.choosePath(s, 'faxiang', ['lei'], null).err);
assert(karmaSeed(s, 'xiang_fan'));
assert(!s.flags.karma_done_xiang_fan);
let t = look(s);
assert(t && t.st === '伏笔', '定相后应是伏笔，不是将至');
assert.equal(t.hint, '因果');
assert(t.detail.includes('法相回首') && t.detail.includes('不是同一件事'));
assert(t.detail.includes('云海天阶') && t.detail.includes('青冥山门'));
assert(!karmaTraces(s, 0).some(x => x.name === '法相' && x.hint === '因果'));

let back = ev('mark_faxiang');
assert(back.cond(s));
assert(back.text(s).includes('功课') && back.text(s).includes('相裂'));
let ch = back.choices(s).find(c => c.label.indexOf('缘由') >= 0);
let r = ch.act(s);
Core.applyFx(s, r.fx, () => {});
assert.equal(s.flags.mark_faxiang, 1);
assert(karmaSeed(s, 'xiang_fan'), '回首不得清掉相裂种子');
assert(r.text.includes('相裂的因果还在') && r.text.includes('尚未到裂开'));
assert(!back.cond(s));
assert.equal(look(s).st, '伏笔');

s = fresh();
Core.choosePath(s, 'faxiang', ['jian'], null);
r = ev('mark_faxiang').choices(s).find(c => c.label === '闭上眼').act(s);
Core.applyFx(s, r.fx, () => {});
assert(r.text.includes('没有因此了结'));
assert(karmaSeed(s, 'xiang_fan'));
assert.equal(look(s).st, '伏笔');

s.months = karmaSeed(s, 'xiang_fan').due;
t = look(s);
assert.equal(t.st, '将至');
assert(t.detail.includes('时机已到'));
assert(ev('yg_xiang_fan').cond(s));
r = ev('mark_faxiang').choices(s)[0].act(s);
assert(r.text.includes('时机已到') && r.text.includes('云海天阶'));
assert.equal(look(s).st, '将至');

const hold = ev('yg_xiang_fan').choices(s).find(c => c.label.indexOf('压下') >= 0);
r = hold.act(s);
Core.applyFx(s, r.fx, () => {});
assert.equal(s.flags.karma_done_xiang_fan, 1);
assert(!karmaSeed(s, 'xiang_fan'));
assert.equal(s.path.faxiang, 'jian');
t = look(s);
assert.equal(t.st, '已了');
assert(t.detail.includes('法相回首不算这一笔'));
assert(!pending(s));
assert(!ev('yg_xiang_fan').cond(s));
s.flags.mark_faxiang = 0;
r = ev('mark_faxiang').choices(s)[0].act(s);
assert(!r.text.includes('还在') && !r.text.includes('没有因此了结'));

s = fresh();
Core.choosePath(s, 'faxiang', ['shui'], null);
const xw = s.xw, ver = s.v;
r = Core.washPath(s, 'faxiang', null);
assert(r.ok);
assert(!s.path.faxiang);
assert(!karmaSeed(s, 'xiang_fan'));
assert.equal(s.flags.karma_gone_xiang_fan, 1);
assert(!s.flags.karma_done_xiang_fan);
t = look(s);
assert.equal(t.st, '已消');
assert(t.detail.includes('不是法相回首了结的'));
assert(!pending(s));
assert(r.text.includes('已消'));
assert(r.tags.some(x => x.t === '相裂已消'));
assert.equal(s.v, ver);
assert.equal(s.xw, xw);
assert(!ev('yg_xiang_fan').cond(s));

assert(!Core.choosePath(s, 'faxiang', ['kong'], null).err);
assert(karmaSeed(s, 'xiang_fan'));
assert(!s.flags.karma_gone_xiang_fan);
assert.equal(look(s).st, '伏笔');
assert(!karmaTraces(s, 0).some(x => x.name === '相裂' && x.st === '已消'));

s = fresh();
Core.choosePath(s, 'faxiang', ['lei'], null);
s.months = karmaSeed(s, 'xiang_fan').due;
assert.equal(look(s).st, '将至');
Core.washPath(s, 'faxiang', null);
assert.equal(look(s).st, '已消');
assert(!pending(s));
Core.choosePath(s, 'faxiang', ['kong'], null);
const neu = karmaSeed(s, 'xiang_fan');
assert(neu && neu.due > s.months);
assert.equal(look(s).st, '伏笔');

s = fresh();
Core.choosePath(s, 'faxiang', ['huo'], null);
s.months = karmaSeed(s, 'xiang_fan').due;
r = ev('yg_xiang_fan').choices(s).find(c => c.label.indexOf('洗去') >= 0).act(s);
assert(!s.path.faxiang);
assert.equal(s.flags.karma_done_xiang_fan, 1);
assert(!karmaSeed(s, 'xiang_fan'));
assert(!s.flags.karma_gone_xiang_fan);
assert.equal(look(s).st, '已了');
assert(r.text.includes('淡开'));
assert(!pending(s));

s = fresh();
Core.choosePath(s, 'faxiang', ['lei'], null);
s.months = karmaSeed(s, 'xiang_fan').due;
s.ls = 0;
r = ev('yg_xiang_fan').choices(s).find(c => c.label.indexOf('洗去') >= 0).act(s);
assert(r.text.includes('未能如愿'));
assert.equal(s.path.faxiang, 'lei');
assert.equal(s.flags.karma_done_xiang_fan, 1);
assert(!karmaSeed(s, 'xiang_fan'));
assert.equal(look(s).st, '已了');
assert.equal(s.flags.xiang_wash_half, 1);

s = fresh();
Core.choosePath(s, 'faxiang', ['lei'], null);
s.path.faxiang = null;
Core.sync(s);
const life = s.lifespan, bonus = s.lifeBonus, cult = s.xw;
const migrated = Core.migrate(JSON.parse(JSON.stringify(s)));
assert.equal(migrated.v, 16);
assert.equal(migrated.xw, cult);
assert.equal(migrated.lifespan, life);
assert.equal(migrated.lifeBonus, bonus);
assert(!karmaSeed(migrated, 'xiang_fan'));
assert.equal(migrated.flags.karma_gone_xiang_fan, 1);
assert.equal(look(migrated).st, '已消');
assert(!pending(migrated));

s = fresh();
Core.choosePath(s, 'faxiang', ['lei'], null);
const due = karmaSeed(s, 'xiang_fan').due;
const kept = Core.migrate(JSON.parse(JSON.stringify(s)));
assert.equal(karmaSeed(kept, 'xiang_fan').due, due);
assert(!kept.flags.karma_gone_xiang_fan);
assert.equal(look(kept).st, '伏笔');
assert.equal(kept.v, 16);

const code = Codec.encode(kept);
assert(code.startsWith('MX1.'), code.slice(0, 8));
const round = Core.migrate(Codec.decode(code).data);
assert.equal(round.v, 16);
assert.equal(karmaSeed(round, 'xiang_fan').due, due);

console.log('regress_xiang ok');
