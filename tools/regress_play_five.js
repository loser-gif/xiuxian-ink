/* v133 · 旧档、可错过线索、途兵实战及奈何传句。 */
'use strict';
const vm = require('vm'), fs = require('fs'), assert = require('assert'), path = require('path');
const store = new Map();
const ctx = vm.createContext({ console, Math: Object.create(Math), Date, localStorage: {
  getItem: k => store.get(k) || null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k)
} });
for (const f of ['data','gongfa','gear','path','story','sect','baijia','world','tianxia','karma','life','juan','core','loops','samsara','jianghu','redworld','people'])
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/' + f + '.js'), 'utf8'), ctx);
const G = vm.runInContext('({Core, EVENTS, LINGGEN, Samsara, LOC_EV, EV_LOC})', ctx);
const fresh = () => G.Core.newState('旧卷', {lg:G.LINGGEN.find(l=>l.id==='san'),els:['金','木','水'],wx:6,luck:3,org:'qm'});
const event = id => G.EVENTS.find(e=>e.id===id);
let s = fresh(), old = JSON.parse(JSON.stringify(s));
delete old.flags.liudao;
assert.equal(G.Core.migrate(old).v,16); assert.equal(old.xw,s.xw); assert.equal(old.flags.liudao,null);
s.loc='taohua'; const a=event('clue_xi_0'), b=event('clue_xi_1');
assert(a.cond(s)); a.choices(s)[0].act(s); assert(!b.cond(s)); s.months++; assert(!b.cond(s)); s.flags.visit_taohua = 1; assert(b.cond(s)); b.choices(s)[0].act(s); assert.equal(s.flags.clue_xi,2);
for (const [loc, key] of [['taohua', 'xi'], ['gufu', 'dong']]) {
  s=fresh(); s.loc=loc;
  const first=event('clue_'+key+'_0'), second=event('clue_'+key+'_1');
  first.choices(s)[0].act(s); assert(!second.cond(s));
  const months=s.months;
  // Match goEvent's local visit update without advancing months or loading its DOM.
  if (!s.dead) s.flags['visit_' + loc] = (s.flags['visit_' + loc] || 0) + 1;
  assert.equal(s.months,months); assert(second.cond(s));
  for (const e of [first, second]) {
    assert(G.LOC_EV[loc].includes(e.id)); assert(G.EV_LOC[e.id].includes(loc));
  }
}
const forge=event('xuanfeng_forge');
assert.deepStrictEqual(Array.from(forge.rm),[0,1]);
assert(G.LOC_EV.yunyue.includes(forge.id)); assert(G.EV_LOC[forge.id].includes('yunyue'));
s=fresh(); s.loc='yunyue'; s.stage=5; assert(!forge.cond(s));
s.realm=1; s.stage=0; assert(forge.cond(s));
s.realm=2; s.stage=6; assert(!s.flags.liudao); assert(!forge.cond(s));
s=fresh(); s.loc='taohua'; a.choices(s)[1].act(s); assert(!a.cond(s)&&!b.cond(s));
s=fresh();s.loc='yunyue';s.stage=6;s.ls=59;
assert(forge.cond(s));assert.strictEqual(forge.choices(s)[0].disabled,true);
s.ls=60;G.Core.applyFx(s,forge.choices(s)[0].act(s).fx,[]);assert.equal(s.ls,0);assert.equal(s.items['扫霜剑'],1);assert(!forge.cond(s));
G.Core.equip(s,'扫霜剑');
const o={base:.5,win:{text:'胜',fx:{}},lose:{text:'负',fx:{}}};
G.Core.showFoe(s,{realm:0,stage:0});G.Core.fightAct(s,o);assert.equal(s.flags.liudao.fights,0);
for(let i=0;i<40;i++){G.Core.showFoe(s,{realm:0,stage:6});G.Core.fightAct(s,o);}
assert.equal(s.flags.liudao.stage,'baizhan'); assert(s.marks.some(m=>m.t==='百战卒'));
const back=G.Core.migrate(JSON.parse(JSON.stringify(s)));assert.equal(back.flags.liudao.fights,40);
G.Core.applyFx(s,{npc:{su:10}},[]);assert(s.marks.some(m=>m.t==='人情半页'));
const count=s.marks.length;G.Core.applyFx(s,{npc:{su:10}},[]);assert.equal(s.marks.length,count);
const legacy=G.Samsara.buildLegacy(s,'hongchen');assert(legacy.verse&&legacy.seal);
const next=fresh();G.Samsara.applyLegacy(next,legacy);assert(next.flags.legacyNote.includes(legacy.verse));
G.Samsara.recordLife(s,'hongchen');const chosen=G.Samsara.chooseNaihe('mem');assert(chosen.verse.includes('雨声'));G.Samsara.applyLegacy(next,chosen);assert(next.flags.legacyNote.includes(chosen.verse));
// Fixed rolls isolate seasonal gain from unrelated random events.
vm.runInContext('Math.random = () => 0.5', ctx);
const spring=fresh(), autumn=fresh();spring.months=192;autumn.months=198;
G.Core.biguan(spring);G.Core.biguan(autumn);
assert(autumn.xw>spring.xw&&autumn.xw<=spring.xw*1.04);
vm.runInContext('Math.random = () => 0', ctx);
const calm=fresh(), summer=fresh();calm.months=192;summer.months=195;
G.Core.tuna(calm);G.Core.tuna(summer);assert(calm.xw>summer.xw);
console.log('v133: migration, clues, forging, combat, reputation, legacy passed');
