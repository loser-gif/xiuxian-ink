#!/usr/bin/env node
/* Independent post-fix storage assertions for Round5+5b.
   Original 15- and 17-test files are left unchanged. Isolated in-memory Map only. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const FIX = path.join(ROOT, 'tools/fixtures/storage-v143');
const expected = {
  slots: '1c7e6ea539d3b518173f9f0cb50eaa2a2d1db45aefc12d3272af093d7519c8e9',
  samsara: '39e3a2e93fc6f871edf532216ded07ef698b4dc901908c5909cd1ba92874b12a'
};
const oldSources = {};
for (const f of ['slots', 'samsara']) {
  const buf = fs.readFileSync(path.join(FIX, f + '.js'));
  const hx = crypto.createHash('sha256').update(buf).digest('hex');
  assert.equal(hx, expected[f], 'fixture sha ' + f);
  oldSources[f] = buf.toString('utf8');
}
const passed = [];
const tests = [];
function test(name, fn) { tests.push([name, fn]); }

function makeStorage() {
  const storage = new Map();
  const flags = {
    failWrite: false,
    failKey: false,
    failMeta: false,
    failRemove: false,
    failLegacy: false,
    keyFailsLeft: 0,
    slotsGetThrow: false,
    slotsGetThrowAfterSet: 0,
    slotsGetMismatch: null,
    slotsSetNoop: false,
    _wroteSlots: false,
    _oldSlots: null
  };
  const localStorage = {
    getItem(k) {
      if (k === 'moxian.slots') {
        if (flags.slotsGetThrow) throw Error('get-slots');
        if (flags._wroteSlots && flags.slotsGetThrowAfterSet > 0) {
          flags.slotsGetThrowAfterSet--;
          throw Error('get-slots-after-set');
        }
        if (flags._wroteSlots && flags.slotsGetMismatch) {
          const m = flags.slotsGetMismatch;
          if (m === 'wrong') return '{}';
          if (m === 'null') return null;
          if (m === 'old') return flags._oldSlots == null ? null : flags._oldSlots;
        }
      }
      return storage.has(k) ? storage.get(k) : null;
    },
    setItem(k, v) {
      if (flags.failWrite) throw Error('quota');
      if (flags.failKey && k === 'moxian.slots') {
        if (flags.keyFailsLeft <= 0) throw Error('quota-slots');
        flags.keyFailsLeft--;
      }
      if (flags.failMeta && k === 'moxian.meta') throw Error('quota-meta');
      if (flags.failLegacy && k === 'moxian.legacy') throw Error('quota-legacy');
      if (k === 'moxian.slots') {
        flags._oldSlots = storage.has('moxian.slots') ? storage.get('moxian.slots') : null;
        if (flags.slotsSetNoop) { flags._wroteSlots = true; return; }
        flags._wroteSlots = true;
      }
      storage.set(k, String(v));
    },
    removeItem(k) {
      if (flags.failRemove && k === 'moxian.legacy') throw Error('remove denied');
      storage.delete(k);
    }
  };
  return { storage, flags, localStorage };
}

function loadWorld(localStorage, old = false) {
  const elements = new Map();
  function element(key) {
    if (!elements.has(key)) elements.set(key, {
      value: '', hidden: false, disabled: false, textContent: '', dataset: {},
      style: { setProperty() {}, opacity: 0 }, classList: { add() {}, remove() {}, toggle() {} },
      setAttribute() {}, addEventListener() {}, querySelector: q => element(key + ' ' + q),
      querySelectorAll: () => [], children: [], appendChild(e) { this.children.push(e); },
      remove() { this.removed = true; }, focus() {}, blur() {}
    });
    return elements.get(key);
  }
  const document = {
    createElement: tag => element(tag + ':' + elements.size),
    querySelector: element, getElementById: k => element('#' + k),
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
    const src = old && oldSources[f] ? oldSources[f] : fs.readFileSync(path.join(ROOT, 'js', f + '.js'), 'utf8');
    vm.runInContext(src, ctx, { filename: f + '.js' });
  }
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
    function save(){ if(S) return !!Slots.writeActive(S); }
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
function slotNames(storage) {
  const box = boxOf(storage);
  return box ? box.slots.map(s => (s && s.sum && s.sum.name) || null) : [null, null, null];
}
function freshModules(localStorage, coreCtx) {
  const fresh = vm.createContext({ localStorage, console, Date, JSON, Math, Core: vm.runInContext('Core', coreCtx), NPCS: {}, GONGFA: vm.runInContext('GONGFA', coreCtx) });
  for (const f of ['slots', 'samsara']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', f + '.js'), 'utf8'), fresh, { filename: f + '.js' });
  }
  return vm.runInContext('({Slots,Samsara})', fresh);
}
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
  return Object.assign({ctx}, vm.runInContext('({Samsara, Slots, Core})', ctx));
}
function endLife(w, index = 0, kind = 'mem') {
  const s = w.Slots.read(index); s.dead = true; s.ending = 'zuohua'; s.age = 80;
  w.Samsara.recordLife(s, 'zuohua', '旧卷');
  return w.Samsara.chooseNaihe(kind);
}
function reload(w) { return freshModules(w.localStorage, w.ctx); }

async function openSecondLifeMidRead(w) {
  await create(w);
  const first = endLife(w, 0, 'mem');
  w.flags.failRemove = true;
  await create(w, 1);
  assert.equal(w.Samsara.peekLegacy(), null);
  const old1 = oldWorld(w);
  const s = old1.Slots.read(1); s.dead = true; s.ending = 'zuohua'; s.age = 80;
  old1.Samsara.recordLife(s, 'zuohua', '旧卷');
  assert(old1.Samsara.bridgeOpen());
  const mid = reload(w);
  assert.equal(mid.Samsara.loadMeta().lives, 2);
  assert(mid.Samsara.bridgeOpen());
  assert.equal(mid.Samsara.peekLegacy(), null);
  return first;
}


// Round6 assertions below are new; independent originals remain unchanged.
function worldFrom(w) {
  const ctx = loadWorld(w.localStorage);
  return Object.assign({}, w, {ctx}, vm.runInContext('({Samsara, Slots, Core})', ctx));
}
function faultWorld(w, mode) {
  const calls = [], control = {denied:0, restored:false, enabled:true};
  const adapter = {
    getItem(k) { const v=w.localStorage.getItem(k); calls.push({op:'get',key:k,value:v}); return v; },
    setItem(k,v) {
      const deny=control.enabled && k==='moxian.slots' && (mode==='continuous' || mode==='until-name' && !String(v).includes('三世') || mode==='one-shot' && control.denied===0);
      calls.push({op:'set',key:k,value:String(v),deny});
      if(deny) { control.denied++; if(mode==='one-shot') control.restored=true; throw Error('reconcile-quota'); }
      w.localStorage.setItem(k,v);
    },
    removeItem(k) { calls.push({op:'remove',key:k}); w.localStorage.removeItem(k); }
  };
  return Object.assign(worldFrom(Object.assign({},w,{localStorage:adapter})),{calls,control});
}
for(const mode of ['one-shot','continuous','until-name']) test('R6 creation abort / retry once: '+mode, async()=>{
  const w=world(); const first=await openSecondLifeMidRead(w); oldWorld(w).Samsara.chooseNaihe('mem');
  const before=Object.fromEntries(w.storage), fw=faultWorld(w,mode);
  await create(fw,2,'三世');
  console.log('TRACE '+mode+' '+JSON.stringify(fw.calls));
  assert(fw.control.denied>0);
  if(mode==='one-shot') assert(fw.control.restored,'adapter restored immediately inside first failing set');
  assert(!fw.ctx.testRoll._created,'untrusted read must not create a role');
  assert(!boxOf(w.storage).slots[2]);
  assert.equal(w.storage.get('moxian.legacy'),before['moxian.legacy']);
  assert.equal(w.storage.get('moxian.meta'),before['moxian.meta']);
  assert(!fw.ctx.__resumeCreated,'precommit failure is retryable, not saved recovery');
  fw.control.enabled=false; w.flags.failRemove=false;
  const again=mode==='continuous'?worldFrom(w):fw;
  assert.equal(JSON.stringify(again.Samsara.peekLegacy()),JSON.stringify(first));
  await create(again,2,'三世');
  assert(again.Slots.read(2).flags.naihe==='mem');
  assert.equal(reload(w).Samsara.peekLegacy(),null);
  again.Slots.clear(0); await create(again,0,'后卷');
  assert.equal(again.Slots.read(0).wx,5);
  assert(!again.Slots.read(0).flags.naihe);
});

test('R6 source failure cannot become null; swallowed failure stays sticky after same-session restoration',async()=>{
  const w=world(); const first=await openSecondLifeMidRead(w); oldWorld(w).Samsara.chooseNaihe('mem');
  const fw=faultWorld(w,'one-shot');
  assert.throws(()=>fw.Slots.readEffect('moxian.legacy'),/reconciliation/);
  assert.equal(JSON.stringify(JSON.parse(fw.Slots.readEffect('moxian.legacy'))),JSON.stringify(first));
  // A separate failure inside the real staged Core initialization cannot be cleared by later successful reads.
  let fail=true;
  const adapter={getItem(k){if(k==='moxian.meta'&&fail){fail=false;throw Error('one meta read');}return w.localStorage.getItem(k);},setItem:(k,v)=>w.localStorage.setItem(k,v),removeItem:k=>w.localStorage.removeItem(k)};
  const x=worldFrom(Object.assign({},w,{localStorage:adapter}));
  x.Samsara.beginCreation();
  x.Samsara.loadMeta(); // legacy API may catch, but creationEffects must reject this entire preparation.
  x.Samsara.loadMeta();
  assert.throws(()=>x.Samsara.creationEffects());
  x.Samsara.endCreation(false);
  x.Samsara.beginCreation(); assert(x.Samsara.creationEffects()['moxian.legacy']); x.Samsara.endCreation(false);
});

for(const key of ['moxian.slots','moxian.meta','moxian.legacy']) for(const noSamsara of [false,true]) test('R6 initial source read failure '+key+' fallback='+noSamsara,async()=>{
  const w=world(); w.Samsara.writeLegacy({wx:2,v:1});
  const before=Object.fromEntries(w.storage); let fail=true;
  const adapter={getItem(k){if(k===key&&fail){fail=false;throw Error('read-once');}return w.localStorage.getItem(k);},setItem:(k,v)=>w.localStorage.setItem(k,v),removeItem:k=>w.localStorage.removeItem(k)};
  // Omit Samsara from the actual module loader, not a substitute API.
  let x;
  if(noSamsara){
    const source=loadWorld.toString().replace(",'samsara'",'');
    const loader=eval('('+source+')'); const ctx=loader(adapter);
    x=Object.assign({},w,{localStorage:adapter,ctx},vm.runInContext('({Slots,Core})',ctx));
  }else x=worldFrom(Object.assign({},w,{localStorage:adapter}));
  await create(x);
  assert(!x.ctx.testRoll._created);
  assert.deepEqual(Object.fromEntries(w.storage),before);
  await create(x); assert(x.ctx.testRoll._created);
  assert.equal(reload(w).Samsara.peekLegacy(),null);
});

test('R6 cleanup-only removal and ack failures do not block trustworthy authority or no-legacy creation',async()=>{
  for(const mode of ['remove','ack']) {
    const w=world();w.Samsara.writeLegacy({wx:2,v:1});w.flags.failRemove=true;await create(w);
    assert.equal(w.Samsara.peekLegacy(),null);
    const adapter={getItem:k=>w.localStorage.getItem(k),setItem(k,v){if(mode==='ack'&&k==='moxian.slots'&&!String(v).includes('后卷'))throw Error('ack');w.localStorage.setItem(k,v);},removeItem:k=>w.localStorage.removeItem(k)};
    if(mode==='ack')w.flags.failRemove=false;
    const x=worldFrom(Object.assign({},w,{localStorage:adapter}));
    assert.equal(x.Slots.readEffect('moxian.legacy'),null);
    await create(x,1,'后卷');assert(x.ctx.testRoll._created);assert.equal(x.Slots.read(1).wx,5);
    assert.equal(reload(w).Samsara.peekLegacy(),null);
  }
});


test('R6 consume outside creation propagates failed read without erasing the source',()=>{
 const w=world();w.Samsara.writeLegacy({wx:2,v:1});let fail=true;
 const adapter={getItem(k){if(k==='moxian.legacy'&&fail){fail=false;throw Error('read-once');}return w.localStorage.getItem(k);},setItem:(k,v)=>w.localStorage.setItem(k,v),removeItem:k=>w.localStorage.removeItem(k)};
 const x=worldFrom(Object.assign({},w,{localStorage:adapter}));const before=w.storage.get('moxian.legacy');
 assert.throws(()=>x.Samsara.consumeLegacy());assert.equal(w.storage.get('moxian.legacy'),before);
 assert.equal(x.Samsara.consumeLegacy().wx,2);assert.equal(x.Samsara.peekLegacy(),null);
});
test('R6 no-Samsara real reconcile failure aborts before consuming fresh completion',async()=>{
 const w=world();await openSecondLifeMidRead(w);oldWorld(w).Samsara.chooseNaihe('mem');
 const f=faultWorld(w,'one-shot');const loader=eval('('+loadWorld.toString().replace(",'samsara'",'')+')');
 const ctx=loader(f.localStorage);const x=Object.assign({},f,{ctx},vm.runInContext('({Slots,Core})',ctx));
 const before=Object.fromEntries(w.storage);await create(x,2,'三世');
 assert.equal(f.control.denied,1);assert(!x.ctx.testRoll._created);assert.deepEqual(Object.fromEntries(w.storage),before);
 await create(x,2,'三世');assert(x.ctx.testRoll._created);assert.equal(reload(w).Samsara.peekLegacy(),null);
});


for(const key of ['moxian.meta','moxian.legacy']) test('R6 actual title decision fails closed on '+key,async()=>{
 const w=world();w.Samsara.writeLegacy({wx:2,v:1});let fail=false;
 const adapter={getItem(k){if(fail&&k===key)throw Error('title read');return w.localStorage.getItem(k);},setItem:(k,v)=>w.localStorage.setItem(k,v),removeItem:k=>w.localStorage.removeItem(k)};
 const x=worldFrom(Object.assign({},w,{localStorage:adapter}));
 vm.runInContext(`let newLifeLock=false,shownRealm='';FX.setSeason=()=>{};FX.setGold=()=>{};
 function aliveSave(){return Slots.readActive()} function drawMountains(){} function paintNoticeDot(){} function realmStr(s=S){return Core.realmStr(s)}
 function resetCreate(){window.resetCount=(window.resetCount||0)+1} function trialBrief(){return Promise.resolve(true)} function openNaihe(go){window.bridgeCallback=go}
 function unrollTo(){};const SchoolUI={open:()=>{window.schoolOpens=(window.schoolOpens||0)+1;return Promise.resolve({ok:false})}};`,x.ctx);
 const src=fs.readFileSync(path.join(ROOT,'js/game.js'),'utf8');
 vm.runInContext(src.slice(src.indexOf('function initTitle()'),src.indexOf('/* 一念上山。')),x.ctx);
 vm.runInContext(src.slice(src.indexOf('function paintLunhuiSeal()'),src.indexOf('async function openOrigin()')),x.ctx);
 vm.runInContext('initTitle()',x.ctx);x.Samsara.loadMeta();const before=Object.fromEntries(w.storage);fail=true;
 x.ctx.document.querySelector('#btn-new').onclick();for(let i=0;i<12;i++)await Promise.resolve();
 assert(!x.ctx.villageOpens);assert(!x.ctx.resetCount);assert(!vm.runInContext('newLifeLock',x.ctx));assert.deepEqual(Object.fromEntries(w.storage),before);
 fail=false;x.ctx.document.querySelector('#btn-new').onclick();for(let i=0;i<12;i++)await Promise.resolve();
 assert(!x.ctx.villageOpens);assert.equal(x.ctx.schoolOpens,1);assert(!x.ctx.resetCount);
});

(async()=>{
 let failures=0;
 for(const [name,fn] of tests){try{await fn();passed.push(name);console.log('PASS '+name);}catch(e){failures++;console.error('FAIL '+name+'\n'+e.stack);}}
 console.log(JSON.stringify({passed:passed.length,failed:failures}));if(failures)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
