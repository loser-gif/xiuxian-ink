#!/usr/bin/env node
/* Round4 fixed-behavior tests; VM adapter derived from the unchanged independent review.
   Uses an in-memory Map only; never touches user localStorage or files under the checkout except read-only source loads. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const BASE = '44d90609b2e631c874eb2d05128f7419a6c43022';
const fixtureHashes = {slots:'1c7e6ea539d3b518173f9f0cb50eaa2a2d1db45aefc12d3272af093d7519c8e9',samsara:'39e3a2e93fc6f871edf532216ded07ef698b4dc901908c5909cd1ba92874b12a'};
const oldSources = {};
for (const f of ['slots', 'samsara']) oldSources[f] = fs.readFileSync(path.join(__dirname, 'fixtures/storage-v143', f + '.js'), 'utf8');
for(const f of Object.keys(oldSources)) assert.equal(require('crypto').createHash('sha256').update(oldSources[f]).digest('hex'),fixtureHashes[f], BASE+':'+f);
const passed = [];
const tests = [];
function test(name, fn) { tests.push([name, fn]); }
function check(name, fn) {
  fn();
  passed.push(name);
  console.log('PASS ' + name);
}

function makeStorage() {
  const storage = new Map();
  const writes = [];
  const flags = { failWrite: false, failKey: false, failMeta: false, failRemove: false, keyFailsLeft: 0 };
  const localStorage = {
    getItem(k) { return storage.has(k) ? storage.get(k) : null; },
    setItem(k, v) {
      if (flags.failWrite) throw Error('quota');
      if (flags.failKey && k === 'moxian.slots') {
        if (flags.keyFailsLeft <= 0) throw Error('quota-slots');
        flags.keyFailsLeft--;
      }
      if (flags.failMeta && k === 'moxian.meta') throw Error('quota-meta');
      writes.push({ op: 'set', key: k, value: String(v) });
      storage.set(k, String(v));
    },
    removeItem(k) {
      if (flags.failRemove && k === 'moxian.legacy') throw Error('remove denied');
      writes.push({ op: 'remove', key: k });
      storage.delete(k);
    }
  };
  return { storage, writes, flags, localStorage };
}

function loadWorld(localStorage, old = false) {
  const elements = new Map();
  function element(key) {
    if (!elements.has(key)) elements.set(key, {
      value: '', hidden: false, disabled: false, textContent: '', dataset: {},
      style: { setProperty() {}, opacity: 0 }, classList: { add() {}, remove() {}, toggle() {} },
      setAttribute() {}, addEventListener() {}, querySelector: q => element(key + ' ' + q),
      querySelectorAll: () => [], children: [], appendChild(e) { this.children.push(e); }, remove() { this.removed = true; }, focus() {}, blur() {}
    });
    return elements.get(key);
  }
  const document = {
    createElement: tag => element(tag + ':' + elements.size), querySelector: element, getElementById: k => element('#' + k),
    querySelectorAll: () => [], documentElement: { dataset: {} },
    body: element('body')
  };
  const sandbox = {
    console, Math, Date, JSON, Promise, Uint32Array, Uint8Array, TextEncoder, TextDecoder, btoa, atob,
    crypto: { getRandomValues(a) { a[0] = 0; return a; } },
    localStorage, document, setTimeout: () => 0, clearTimeout() {}, window: null, globalThis: null
  };
  sandbox.window = sandbox; sandbox.globalThis = sandbox;
  const ctx = vm.createContext(sandbox);
  const files = ['data','gongfa','gear','path','story','sect','baijia','world','tianxia','karma','life','juan','calendar','school','core','loops','jianghu','redworld','folio','people','mingge','village','slots','codec','samsara'];
  for (const f of files) {
    vm.runInContext(old && oldSources[f] || fs.readFileSync(path.join(ROOT, 'js', f + '.js'), 'utf8'), ctx, { filename: f + '.js' });
  }
  // Load only newGame and the helpers it needs from game.js via a minimal harness, not the full 270k UI file.
  // Instead, extract and eval the real newGame function from game.js so we test production code.
  const gameSrc = fs.readFileSync(path.join(ROOT, 'js', 'game.js'), 'utf8');
  const start = gameSrc.indexOf('function newGame(name, r, choice, originId)');
  const end = gameSrc.indexOf('\nfunction paintLunhuiSeal()', start);
  if (start < 0 || end < 0) throw Error('could not extract newGame');
  vm.runInContext(`
    let S=null, testing=false, playTick=0, curScreen='create';
    const $=q=>document.querySelector(q), $$=q=>document.querySelectorAll(q);
    const FX={requestTilt(){}};
    const VillageUI={clear(){}};
    const LEGACY_KEY='moxian.legacy';
    function pushLog(row){ if(S) S.log.push(row); }
    function toast(s){ window.lastToast=s; }
    function save(){ if(S) Slots.writeActive(S); }
    function enterMain(){ curScreen='main'; return Promise.resolve(); }
    function appendInitialLog(s,row){ s.log=s.log||[]; s.log.push(row||{}); }
    function openGoalPicker(){};
    function clearOpeningSex(){ window.__openingSex=null; window.__villageDraft=null; }
  ` + gameSrc.slice(start, end), ctx, { filename: 'newGame-extract.js' });
  return ctx;
}

function roll(ctx) {
  const LINGGEN = vm.runInContext('LINGGEN', ctx);
  return { lg: LINGGEN.find(l => l.id === 'san'), els: ['金', '木', '土'], wx: 5, luck: 2, free: true, origin: 'qingshi' };
}

function boxOf(storage) {
  const raw = storage.get('moxian.slots');
  return raw ? JSON.parse(raw) : null;
}

function freshModules(localStorage, coreCtx) {
  const fresh = vm.createContext({ localStorage, console, Date, JSON, Math, Core: vm.runInContext('Core', coreCtx), NPCS: {}, GONGFA: vm.runInContext('GONGFA', coreCtx) });
  for (const f of ['slots', 'samsara']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', f + '.js'), 'utf8'), fresh, { filename: f + '.js' });
  }
  return vm.runInContext('({Slots,Samsara})', fresh);
}

function v143Box(char) {
  return { v: 1, active: 0, slots: [{ at: 1, sum: { name: char.name, dead: false, ascended: false }, data: char }, null, null] };
}

// All storage is isolated in memory. Production Samsara/Slots, including actual
// git-show v143 modules, run in VM. DOM adapters prove handlers, not rendering.
function world() {
  const st = makeStorage(), ctx = loadWorld(st.localStorage);
  return Object.assign(st, {ctx}, vm.runInContext('({Samsara, Slots, Core})', ctx));
}
function create(w, index = 0, name = '新卷') {
  w.ctx.__slotTarget = index; w.ctx.testRoll = roll(w.ctx);
  return vm.runInContext(`newGame(${JSON.stringify(name)},testRoll,{id:'free'},'shusheng')`, w.ctx);
}
function oldWorld(w) {
  const ctx = loadWorld(w.localStorage, true);
  return Object.assign({ctx}, vm.runInContext('({Samsara, Slots, Core})',ctx));
}
function endLife(w, index = 0, kind = 'mem') {
  const s = w.Slots.read(index); s.dead = true; s.ending = 'zuohua'; s.age = 80;
  w.Samsara.recordLife(s, 'zuohua', '旧卷');
  return w.Samsara.chooseNaihe(kind);
}
function reload(w) { return freshModules(w.localStorage, w.ctx); }
function authority(w) { return boxOf(w.storage).creationEffects; }
function recovery(w) { return w.ctx.document.body.children.slice(-1)[0]; }

// R4-S: sequential v144 -> actual base v143 -> v144, no concurrency.
test('S1 acknowledged mirrors: actual v143 consumes legacy and saves slots, return retains consumption', async () => {
  const w=world(); await create(w); endLife(w);
  const old=oldWorld(w), leg=old.Samsara.consumeLegacy(); assert(leg);
  const s=old.Core.newState('旧版来世',roll(old.ctx),leg); old.Slots.write(1,s);
  const re=reload(w); assert.equal(re.Samsara.peekLegacy(),null); assert.equal(re.Slots.read(1).name,'旧版来世');
  assert.equal(re.Slots.read(1).wx,6); assert.equal(re.Samsara.loadMeta().lives,1);
});
test('S2 actual v143 later life, meta atlas/daily changes and changed legacy survive return', async () => {
  const w=world(); await create(w); endLife(w); await create(w,1);
  const old=oldWorld(w); endLife(old,1,'page');
  const m=old.Samsara.loadMeta(); m.daily={day:'2026-11-10',claimed:true}; m.atlas.gongfa.test=1; old.Samsara.saveMeta(m);
  const expected=w.storage.get('moxian.legacy'), re=reload(w);
  assert.equal(re.Samsara.loadMeta().lives,2); assert(re.Samsara.loadMeta().daily.claimed); assert(re.Samsara.loadMeta().atlas.gongfa.test);
  assert.equal(JSON.stringify(re.Samsara.peekLegacy()),expected); assert.equal(w.storage.get('moxian.legacy'),expected);
});
test('S3 actual v143 same-content later legitimate legacy after acknowledged null', async () => {
  const w=world(); await create(w); const first=endLife(w,0,'none'); await create(w,1);
  const old=oldWorld(w); const next=endLife(old,1,'none'); assert.equal(JSON.stringify(first),JSON.stringify(next));
  const re=reload(w); assert.equal(re.Samsara.loadMeta().lives,2); assert.equal(JSON.stringify(re.Samsara.peekLegacy()),JSON.stringify(next));
});
test('S4 same-content legacy with failed remove distinguished by actual later completed-life bridge', async () => {
  const w=world(); await create(w); const first=endLife(w,0,'none'); w.flags.failRemove=true; await create(w,1);
  assert.equal(w.Samsara.peekLegacy(),null); const old=oldWorld(w); const next=endLife(old,1,'none');
  assert.equal(JSON.stringify(first),JSON.stringify(next)); w.flags.failRemove=false;
  const re=reload(w); assert.equal(re.Samsara.loadMeta().lives,2); assert.equal(JSON.stringify(re.Samsara.peekLegacy()),JSON.stringify(next));
  await create(w,2); assert.equal(w.Samsara.peekLegacy(),null);
});
test('S5 failed mirrors + reload + unrelated meta changes never resurrect consumed legacy; recovery acknowledges null', async () => {
  const w=world(); w.Samsara.writeLegacy({wx:2,v:1}); w.flags.failRemove=true; w.flags.failMeta=true; await create(w);
  let re=reload(w); assert.equal(re.Samsara.peekLegacy(),null); const m=re.Samsara.loadMeta(); m.guide=9; re.Samsara.saveMeta(m);
  assert.equal(reload(w).Samsara.peekLegacy(),null); w.flags.failRemove=false; w.flags.failMeta=false;
  re=reload(w); assert.equal(re.Samsara.loadMeta().guide,9); assert.equal(re.Samsara.peekLegacy(),null); assert(!w.storage.has('moxian.legacy'));
  const old=oldWorld(w); old.Samsara.writeLegacy({wx:2,v:1}); assert.equal(reload(w).Samsara.peekLegacy().wx,2);
});
test('S6 failed remove then old open bridge alone does not revive stale legacy', async () => {
  const w=world(); w.Samsara.writeLegacy({wx:2,v:1}); w.flags.failRemove=true; await create(w);
  const old=oldWorld(w), s=old.Slots.read(0); s.dead=true; old.Samsara.recordLife(s,'zuohua','旧卷');
  assert.equal(reload(w).Samsara.peekLegacy(),null); assert.equal(reload(w).Samsara.loadMeta().lives,1);
});
test('S7 old changes meta without lives growth and replaces legacy while mirror retry still fails', async () => {
  const w=world(); w.Samsara.writeLegacy({wx:2,v:1}); w.flags.failRemove=true; await create(w);
  const old=oldWorld(w), m=old.Samsara.loadMeta(); m.guide=7; old.Samsara.saveMeta(m); old.Samsara.writeLegacy({wx:3,v:1});
  const re=reload(w); assert.equal(re.Samsara.loadMeta().guide,7); assert.equal(re.Samsara.peekLegacy().wx,3);
  w.flags.failRemove=false; await create(w,1); assert.equal(w.Slots.read(1).wx,7); assert.equal(reload(w).Samsara.peekLegacy(),null);
});
test('S8 ambiguous identical bytes without lifecycle evidence remain consumed (documented boundary)', async () => {
  const w=world(); w.Samsara.writeLegacy({wx:2,v:1}); w.flags.failRemove=true; await create(w);
  oldWorld(w).Samsara.writeLegacy({wx:2,v:1}); assert.equal(reload(w).Samsara.peekLegacy(),null);
});
test('S9 reconciled old changes survive failed authority write without destroying newer mirrors', async () => {
  const w=world(); await create(w); const old=oldWorld(w); endLife(old);
  const meta=w.storage.get('moxian.meta'),leg=w.storage.get('moxian.legacy'); w.flags.failKey=true;
  reload(w).Samsara.loadMeta(); assert.equal(w.storage.get('moxian.meta'),meta); assert.equal(w.storage.get('moxian.legacy'),leg);
  w.flags.failKey=false; assert.equal(reload(w).Samsara.loadMeta().lives,1); assert(reload(w).Samsara.peekLegacy());
});
test('S10 receipt acknowledgement write failure does not resurrect consumed legacy', async () => {
  const w=world(); w.Samsara.writeLegacy({wx:2,v:1}); w.flags.failKey=true; w.flags.keyFailsLeft=1;
  await create(w); assert(w.ctx.testRoll._created); assert.equal(reload(w).Samsara.peekLegacy(),null);
  w.flags.failKey=false; assert.equal(reload(w).Samsara.peekLegacy(),null); assert(!w.storage.has('moxian.legacy'));
});

// R4-M: existing v1 adoption bug, not an authority regression.
for (const mode of ['write-throw','noop','wrong','read-throw','remove-throw','normal']) {
 test('M '+mode+': adoption preserves source until exact readback, retry never overwrites occupied destination', () => {
  const w=world(), s=w.Core.newState('唯一旧卷',roll(w.ctx),null), raw=JSON.stringify(s);
  w.storage.clear(); w.storage.set('moxian.v1',raw);
  let written=false, enabled=true;
  const base=w.localStorage;
  const adapter={
   getItem(k) { if(enabled&&written&&k==='moxian.slots'&&mode==='read-throw')throw Error('read'); return base.getItem(k); },
   setItem(k,v) { if(enabled&&k==='moxian.slots') { written=true; if(mode==='write-throw')throw Error('write'); if(mode==='noop')return; if(mode==='wrong'){base.setItem(k,'null');return;} } base.setItem(k,v); },
   removeItem(k) { if(enabled&&k==='moxian.v1'&&mode==='remove-throw')throw Error('remove'); base.removeItem(k); }
  };
  const re=freshModules(adapter,w.ctx); re.Slots.loadBox();
  if(mode==='normal')assert(!w.storage.has('moxian.v1')); else assert.equal(w.storage.get('moxian.v1'),raw);
  enabled=false;
  const retry=freshModules(adapter,w.ctx); assert.equal(retry.Slots.read(0).name,'唯一旧卷');
  const occupied=retry.Slots.read(0); occupied.name='后续进度'; retry.Slots.write(0,occupied);
  w.storage.set('moxian.v1',raw); assert.equal(retry.Slots.read(0).name,'后续进度'); assert.equal(w.storage.get('moxian.v1'),raw);
 });
}
test('M invalid source remains byte-identical and cannot create a blocking empty destination', () => {
 for(const raw of ['{bad',JSON.stringify({v:999,name:'无效'}),'null']) {
  const w=world(); w.storage.clear(); w.storage.set('moxian.v1',raw); w.Slots.loadBox();
  assert.equal(w.storage.get('moxian.v1'),raw); assert(!w.storage.has('moxian.slots'));
 }
});
test('M initial destination read throws: no migration/write/removal', () => {
 const w=world(),raw=JSON.stringify(w.Core.newState('旧卷',roll(w.ctx),null)); w.storage.clear(); w.storage.set('moxian.v1',raw);
 const a=Object.assign({},w.localStorage,{getItem(k){if(k==='moxian.slots')throw Error('read');return w.localStorage.getItem(k);}});
 freshModules(a,w.ctx).Slots.loadBox(); assert.equal(w.storage.get('moxian.v1'),raw); assert(!w.storage.has('moxian.slots'));
});

// R4-U: execute the production newGame body with fault injection around UI only.
for(const mode of ['endCreation','sync-enter','async-enter','retry-read']) {
 test('U '+mode+': committed token, truthful recovery, same persisted character, callback replay and retry',async()=>{
  const w=world(); w.Samsara.writeLegacy({wx:2,v:1});
  const originalEnd=w.Samsara.endCreation;
  if(mode==='endCreation')w.Samsara.endCreation=function(commit){originalEnd(commit);if(commit)throw Error('postcommit');};
  vm.runInContext("enterMain=function(){throw Error('enter')}",w.ctx);
  if(mode==='async-enter')vm.runInContext("enterMain=function(){return Promise.reject(Error('enter async'))}",w.ctx);
  await create(w); const token=w.ctx.testRoll;
  assert(token._created); assert.equal(w.ctx.__villageDraft,null); assert.equal(w.ctx.__slotTarget,null);
  assert.equal(w.Slots.read(0).wx,7); assert.equal(w.Samsara.peekLegacy(),null);
  assert(w.ctx.lastToast.includes('新卷已存')); assert(!w.ctx.lastToast.includes('开卷未成'));
  const encoded=w.storage.get('moxian.slots'), panel=recovery(w); assert(panel); assert.equal(panel.children[1].textContent,'续卷');
  await vm.runInContext("newGame('重复',testRoll,{id:'free'},'shusheng')",w.ctx); assert.equal(w.storage.get('moxian.slots'),encoded);
  await create(w,1,'不可另造'); assert.equal(w.Slots.read(1),null); assert.equal(w.storage.get('moxian.slots'),encoded);
  vm.runInContext("enterMain=function(){curScreen='main'; return Promise.resolve()}",w.ctx);
  if(mode==='retry-read') {
   const read=w.Slots.read; w.Slots.read=()=>{throw Error('read')}; await panel.children[1].onclick(); assert(!panel.removed); w.Slots.read=read;
  }
  await panel.children[1].onclick(); assert(panel.removed); assert.equal(vm.runInContext('S.name',w.ctx),'新卷');
  assert.equal(w.storage.get('moxian.slots'),encoded); assert.equal(w.Samsara.peekLegacy(),null);
  await create(w,1); assert.equal(w.Slots.read(1).wx,5);
 });
}
test('U precommit failure preserves village draft and permits only one successful retry', async()=>{
 const w=world(), V=vm.runInContext('Village',w.ctx),d=V.draft(); d.sex='f';
 for(const [k,v] of Object.entries({grab:'book',six:'school',nine:'study',rain:'count'}))V.choose(d,k,v);
 d.route='money';d.talent=8;d.confirmed=true; assert(V.valid(d)); w.ctx.__villageDraft=d; w.flags.failKey=true;
 await create(w); assert.strictEqual(w.ctx.__villageDraft,d); assert(!d._created); assert(!w.ctx.testRoll._created); assert(!w.storage.has('moxian.slots'));
 w.flags.failKey=false; await vm.runInContext("newGame('重试',testRoll,{id:'free'},'qingshi')",w.ctx);
 assert(d._created);assert.equal(w.ctx.__villageDraft,null);assert.equal(w.Slots.read(0).who.sex,'f');
});
for (const mode of ['wrong-readback','missing-readback']) {
 test('M '+mode+': successful write but unverified readback retains original bytes',()=>{
  const w=world(),raw=JSON.stringify(w.Core.newState('旧卷',roll(w.ctx),null));w.storage.clear();w.storage.set('moxian.v1',raw);
  let written=false;
  const adapter=Object.assign({},w.localStorage,{
   setItem(k,v){w.localStorage.setItem(k,v);if(k==='moxian.slots')written=true;},
   getItem(k){if(written&&k==='moxian.slots')return mode==='wrong-readback'?'{}':null;return w.localStorage.getItem(k);}
  });
  freshModules(adapter,w.ctx).Slots.loadBox(); assert.equal(w.storage.get('moxian.v1'),raw);
  assert.equal(reload(w).Slots.read(0).name,'旧卷'); assert.equal(w.storage.get('moxian.v1'),raw);
 });
}
for(const mode of ['render-throws','passage-rejects']) {
 test('U actual enterMain '+mode+': same saved slot resumes through real enterMain body',async()=>{
  const w=world(); const source=fs.readFileSync(path.join(ROOT,'js/game.js'),'utf8');
  vm.runInContext(`
   var uiFailure=true;
   function render(){if(uiFailure && '${mode}'==='render-throws')throw Error('render');}
   function renderEntry(){}
   function ensurePendingPath(){return Promise.resolve();}
   function unrollTo(id,ready){
    if(uiFailure && '${mode}'==='passage-rejects')return Promise.reject(Error('passage'));
    curScreen=id;ready();return Promise.resolve();
   }
  `+source.slice(source.indexOf('function enterMain(fromSave)'),source.indexOf('function clipMark')),w.ctx);
  w.Samsara.writeLegacy({wx:2,v:1});await create(w);assert(w.ctx.lastToast.includes('新卷已存'));
  const saved=w.storage.get('moxian.slots');vm.runInContext('uiFailure=false',w.ctx);
  await recovery(w).children[1].onclick();assert(recovery(w).removed);assert.equal(w.storage.get('moxian.slots'),saved);
  assert.equal(w.Slots.read(0).wx,7);assert.equal(w.Samsara.peekLegacy(),null);
 });
}
test('U trial postcommit retry preserves trial and does not consume pending legacy',async()=>{
 const w=world();w.Samsara.writeLegacy({wx:2,v:1});w.ctx.__trialStart=true;
 vm.runInContext("enterMain=function(){return Promise.reject(Error('trial UI'))}",w.ctx);await create(w);
 assert(w.ctx.testRoll._created);assert(w.Slots.read(0).flags.trial);assert.equal(w.Samsara.peekLegacy().wx,2);
 vm.runInContext("enterMain=function(){return Promise.resolve()}",w.ctx);await recovery(w).children[1].onclick();
 assert(w.Slots.read(0).flags.trial);assert.equal(w.Samsara.peekLegacy().wx,2);assert.equal(w.Slots.read(0).wx,5);
});
test('U village cleanup throws after commit: consumed draft stays cleared, cleanup retries on the same slot',async()=>{
 const w=world(),V=vm.runInContext('Village',w.ctx),d=V.draft();d.sex='f';
 for(const [k,v] of Object.entries({grab:'book',six:'school',nine:'study',rain:'count'}))V.choose(d,k,v);
 d.route='money';d.talent=8;d.confirmed=true;w.ctx.__villageDraft=d;
 vm.runInContext("VillageUI.clear=function(){throw Error('cleanup')}",w.ctx);await create(w);
 assert(d._created);assert(w.ctx.testRoll._created);assert.equal(w.ctx.__villageDraft,null);assert(w.ctx.lastToast.includes('新卷已存'));
 const saved=w.storage.get('moxian.slots');vm.runInContext('VillageUI.clear=function(){}',w.ctx);
 await recovery(w).children[1].onclick();assert(recovery(w).removed);assert.equal(w.storage.get('moxian.slots'),saved);
 assert.equal(w.Slots.read(0).who.sex,'f');
});
(async()=>{for(const [name,fn] of tests){await fn();passed.push(name);console.log('PASS '+name);}console.log(passed.length+' fixed-behavior storage checks passed; actual base v143 modules executed.');})().catch(e=>{console.error(e);process.exitCode=1;});
