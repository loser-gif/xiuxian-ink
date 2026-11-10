#!/usr/bin/env node
/* Round5 corrected expectations derived from the preserved independent Round4 suite.
   Session-authored extensions run real modules with isolated storage; not browser rendering. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const BASE = '44d90609b2e631c874eb2d05128f7419a6c43022';
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
      setAttribute() {}, addEventListener() {}, replaceWith() {}, querySelector: q => element(key + ' ' + q),
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
  const files = ['data','gongfa','gear','path','story','sect','baijia','world','tianxia','karma','life','juan','core','loops','jianghu','redworld','folio','people','mingge','village','slots','codec','samsara'];
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

test('F1 real v143 fixture: later life lives and new legacy survive new→old→new', async () => {
  const w = world(); await create(w); endLife(w); await create(w, 1);
  const old = oldWorld(w); endLife(old, 1, 'page');
  const expectedLeg = w.storage.get('moxian.legacy');
  const re = reload(w);
  assert.equal(re.Samsara.loadMeta().lives, 2);
  assert.equal(JSON.stringify(re.Samsara.peekLegacy()), expectedLeg);
  assert(re.Samsara.peekLegacy() && re.Samsara.peekLegacy().kind === 'page');
});

test('F2 failed remove residue plus reload and later meta write does not resurrect consumed legacy', async () => {
  const w = world();
  w.Samsara.writeLegacy({ wx: 2, v: 1 });
  w.flags.failRemove = true;
  w.flags.failMeta = true;
  await create(w);
  assert(w.storage.has('moxian.legacy'));
  let re = reload(w);
  assert.equal(re.Samsara.peekLegacy(), null);
  const m = re.Samsara.loadMeta(); m.guide = 9; re.Samsara.saveMeta(m);
  assert.equal(reload(w).Samsara.peekLegacy(), null);
  w.flags.failRemove = false; w.flags.failMeta = false;
  re = reload(w);
  assert.equal(re.Samsara.loadMeta().guide, 9);
  assert.equal(re.Samsara.peekLegacy(), null);
  assert(!w.storage.has('moxian.legacy'));
});

test('F3 partial: meta mirror flush ok, legacy remove fails, restart still consumed; later different old write is adopted', async () => {
  const w = world();
  w.Samsara.writeLegacy({ wx: 2, v: 1 });
  w.flags.failRemove = true;
  await create(w);
  assert.equal(w.Samsara.peekLegacy(), null);
  assert(w.storage.has('moxian.legacy'));
  const re1 = reload(w);
  assert.equal(re1.Samsara.peekLegacy(), null);
  assert.equal(re1.Samsara.loadMeta().lives | 0, 0);
  const old = oldWorld(w);
  old.Samsara.writeLegacy({ wx: 4, v: 1 });
  const re2 = reload(w);
  assert.equal(re2.Samsara.peekLegacy().wx, 4);
  w.flags.failRemove = false;
  w.ctx.__slotTarget = 1; w.ctx.testRoll = roll(w.ctx);
  await vm.runInContext("newGame('来世',testRoll,{id:'free'},'shusheng')", w.ctx);
  assert.equal(w.Slots.read(1).wx, 7); // cap: min(2, legacy.wx)
  assert.equal(reload(w).Samsara.peekLegacy(), null);
});

test('F4 with baseline, laterLife and open bridge plus a different new legacy is adopted, not deleted', async () => {
  const w = world(); await create(w);
  const old = oldWorld(w);
  const s = old.Slots.read(0); s.dead = true; s.ending = 'zuohua'; s.age = 80;
  old.Samsara.recordLife(s, 'zuohua', '旧卷');
  assert(old.Samsara.bridgeOpen());
  old.Samsara.writeLegacy({ wx: 3, v: 1, note: 'pending-while-bridge-open' });
  const re = reload(w);
  assert.equal(re.Samsara.loadMeta().lives, 1);
  assert.equal(re.Samsara.peekLegacy().wx, 3);
  assert.equal(re.Samsara.peekLegacy().note, 'pending-while-bridge-open');
});

test('F5 documented: no-baseline round3 envelope + laterLife + open bridge can delete a different new legacy', async () => {
  const w = world(); await create(w);
  const box = boxOf(w.storage);
  delete box.effectMirrors;
  w.storage.set('moxian.slots', JSON.stringify(box));
  const old = oldWorld(w);
  const s = old.Slots.read(0); s.dead = true; s.ending = 'zuohua'; s.age = 80;
  old.Samsara.recordLife(s, 'zuohua', '旧卷');
  old.Samsara.writeLegacy({ wx: 3, v: 1, note: 'would-be-new' });
  const before = w.storage.get('moxian.legacy');
  assert(before && before.includes('would-be-new'));
  const re = reload(w);
  // Bootstrap without receipts: laterLife adopts meta, but open bridge is not laterChoice,
  // so a different new legacy is not adopted and flush may remove it.
  assert.equal(re.Samsara.loadMeta().lives, 1);
  const after = re.Samsara.peekLegacy();
  assert.equal(after, null, 'pre-receipt bootstrap can drop a newer unmatched legacy when bridge is still open');
  assert(!w.storage.has('moxian.legacy') || w.storage.get('moxian.legacy') == null || w.storage.get('moxian.legacy') !== before);
});

test('F6 same-byte rewrite without lifecycle evidence stays consumed', async () => {
  const w = world();
  w.Samsara.writeLegacy({ wx: 2, v: 1 });
  w.flags.failRemove = true;
  await create(w);
  oldWorld(w).Samsara.writeLegacy({ wx: 2, v: 1 });
  assert.equal(reload(w).Samsara.peekLegacy(), null);
});

test('F7 failed envelope persist during reconcile leaves newer mirrors intact for a later retry', async () => {
  const w = world(); await create(w);
  const old = oldWorld(w); endLife(old);
  const meta = w.storage.get('moxian.meta');
  const leg = w.storage.get('moxian.legacy');
  w.flags.failKey = true;
  reload(w).Samsara.loadMeta();
  assert.equal(w.storage.get('moxian.meta'), meta);
  assert.equal(w.storage.get('moxian.legacy'), leg);
  w.flags.failKey = false;
  assert.equal(reload(w).Samsara.loadMeta().lives, 1);
  assert(reload(w).Samsara.peekLegacy());
});

test('F8 ack write failure after successful remove does not resurrect leftover across restart', async () => {
  const w = world();
  w.Samsara.writeLegacy({ wx: 2, v: 1 });
  w.flags.failKey = true;
  w.flags.keyFailsLeft = 1; // createEmpty succeeds, later envelope ack may fail
  await create(w);
  assert(w.ctx.testRoll._created);
  assert.equal(reload(w).Samsara.peekLegacy(), null);
  w.flags.failKey = false;
  assert.equal(reload(w).Samsara.peekLegacy(), null);
  assert(!w.storage.has('moxian.legacy'));
});

test('F9 stale in-memory saveBox is repaired when the newer legacy still exists in the mirror', async () => {
  const w = world(); await create(w);
  const stale = vm.runInContext('Slots.loadBox()', w.ctx);
  w.Samsara.writeLegacy({ wx: 2, v: 1 });
  assert.equal(w.Samsara.peekLegacy().wx, 2);
  vm.runInContext('Slots.saveBox', w.ctx)(stale);
  assert.equal(w.Samsara.peekLegacy().wx, 2);
  assert.equal(reload(w).Samsara.peekLegacy().wx, 2);
});

test('F10 stale saveBox cannot recover a newer legacy that also never reached the mirror', async () => {
  const w = world(); await create(w);
  const stale = vm.runInContext('Slots.loadBox()', w.ctx);
  w.flags.failKey = true; // writeLegacy authority rewrite fails, swallowed; mirrors unchanged
  w.Samsara.writeLegacy({ wx: 2, v: 1 });
  w.flags.failKey = false;
  assert.equal(w.Samsara.peekLegacy(), null);
  vm.runInContext('Slots.saveBox', w.ctx)(stale);
  assert.equal(reload(w).Samsara.peekLegacy(), null);
});

test('F11 v1 adopt: failed destination write keeps source; retry migrates; leftover source cannot replace later progress', () => {
  const w = world();
  const raw = JSON.stringify(w.Core.newState('唯一旧卷', roll(w.ctx), null));
  w.storage.clear(); w.storage.set('moxian.v1', raw);
  w.flags.failKey = true;
  const box = w.Slots.loadBox();
  assert.equal(w.storage.get('moxian.v1'), raw);
  assert(!w.storage.has('moxian.slots'));
  w.flags.failKey = false;
  const re = reload(w);
  assert.equal(re.Slots.read(0).name, '唯一旧卷');
  const occupied = re.Slots.read(0); occupied.name = '后续进度'; re.Slots.write(0, occupied);
  w.storage.set('moxian.v1', raw);
  assert.equal(reload(w).Slots.read(0).name, '后续进度');
  assert.equal(w.storage.get('moxian.v1'), raw);
});

test('F12 v1 adopt: exact readback mismatch or missing readback does not delete source', () => {
  for (const mode of ['wrong', 'missing']) {
    const w = world();
    const raw = JSON.stringify(w.Core.newState('旧卷', roll(w.ctx), null));
    w.storage.clear(); w.storage.set('moxian.v1', raw);
    let written = false;
    const adapter = {
      getItem(k) {
        if (written && k === 'moxian.slots') return mode === 'wrong' ? '{}' : null;
        return w.localStorage.getItem(k);
      },
      setItem(k, v) { if (k === 'moxian.slots') written = true; w.localStorage.setItem(k, v); },
      removeItem(k) { w.localStorage.removeItem(k); }
    };
    freshModules(adapter, w.ctx).Slots.loadBox();
    assert.equal(w.storage.get('moxian.v1'), raw);
  }
});

test('F13 post-commit enterMain rejection shows 新卷已存, resume rereads the same slot, does not consume again', async () => {
  const w = world();
  w.Samsara.writeLegacy({ wx: 2, v: 1 });
  vm.runInContext("enterMain=function(){return Promise.reject(Error('enter async'))}", w.ctx);
  await create(w);
  const encoded = w.storage.get('moxian.slots');
  assert(w.ctx.testRoll._created);
  assert.equal(w.Slots.read(0).wx, 7);
  assert.equal(w.Samsara.peekLegacy(), null);
  assert(w.ctx.lastToast.includes('新卷已存'));
  assert(!w.ctx.lastToast.includes('开卷未成'));
  await vm.runInContext("newGame('重复',testRoll,{id:'free'},'shusheng')", w.ctx);
  assert.equal(w.storage.get('moxian.slots'), encoded);
  w.ctx.__slotTarget = 1; w.ctx.testRoll2 = roll(w.ctx);
  await vm.runInContext("newGame('另造',testRoll2,{id:'free'},'shusheng')", w.ctx);
  assert.equal(w.Slots.read(1), null);
  assert.equal(w.storage.get('moxian.slots'), encoded);
  vm.runInContext("enterMain=function(){curScreen='main';return Promise.resolve()}", w.ctx);
  const panel = w.ctx.document.body.children.slice(-1)[0];
  await panel.children[1].onclick();
  assert(panel.removed);
  assert.equal(w.storage.get('moxian.slots'), encoded);
  assert.equal(w.Samsara.peekLegacy(), null);
  await create(w, 1);
  assert.equal(w.Slots.read(1).wx, 5);
});

test('F14 precommit failure keeps draft; only one later successful create', async () => {
  const w = world();
  w.flags.failKey = true;
  await create(w);
  assert(!w.ctx.testRoll._created);
  assert(!w.storage.has('moxian.slots'));
  assert(w.ctx.lastToast);
  w.flags.failKey = false;
  await create(w);
  assert(w.ctx.testRoll._created);
  assert.equal(w.Slots.read(0).name, '新卷');
});

test('F15 chooseNaihe two-write window remains: legacy written, bridge still open if the meta envelope write fails', async () => {
  const w = world(); await create(w);
  const s = w.Slots.read(0); s.dead = true; s.ending = 'zuohua'; s.age = 80;
  w.Samsara.recordLife(s, 'zuohua', '旧卷');
  assert(w.Samsara.bridgeOpen());
  w.flags.failKey = true; w.flags.keyFailsLeft = 1;
  w.Samsara.chooseNaihe('mem');
  w.flags.failKey = false;
  assert(w.Samsara.peekLegacy() && w.Samsara.peekLegacy().naihe);
  assert.equal(w.Samsara.bridgeOpen(), true);
});


test('F16 corrected: interleaved open read retains same-byte choice', async () => {
  const w = world();
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
  const old2 = oldWorld(w);
  const next = old2.Samsara.chooseNaihe('mem');
  assert.equal(JSON.stringify(first), JSON.stringify(next));
  w.flags.failRemove = false;
  const re = reload(w);
  const meta = re.Samsara.loadMeta();
  assert.equal(meta.lives, 2);
  assert(meta.bridge && !meta.bridge.open && meta.bridge.chosen === 'mem');
  assert.equal(JSON.stringify(re.Samsara.peekLegacy()), JSON.stringify(next));
});

test('F17 corrected: failed adopt then writeActive retains sole source', () => {
  const w = world();
  const raw = JSON.stringify(w.Core.newState('唯一旧卷', roll(w.ctx), null));
  w.storage.clear(); w.storage.set('moxian.v1', raw);
  w.flags.failKey = true;
  const s = w.Slots.readActive();
  assert.equal(s && s.name, '唯一旧卷');
  assert.equal(w.storage.get('moxian.v1'), raw);
  assert(!w.storage.has('moxian.slots'));
  w.Slots.writeActive(s);
  assert(!w.storage.has('moxian.slots'), 'slots write still swallowed');
  assert.equal(w.storage.get('moxian.v1'), raw);
  w.flags.failKey = false;
  assert.equal(reload(w).Slots.readActive().name, '唯一旧卷');
});


async function openSecondLife() {
  const w = world(); await create(w); w.first = endLife(w);
  w.flags.failRemove = true; await create(w, 1);
  const old = oldWorld(w), s = old.Slots.read(1);
  s.dead = true; s.ending = 'zuohua'; s.age = 80;
  old.Samsara.recordLife(s, 'zuohua', '旧卷');
  const mid = reload(w);
  assert.equal(mid.Samsara.loadMeta().lives, 2);
  assert(mid.Samsara.bridgeOpen()); assert.equal(mid.Samsara.peekLegacy(), null);
  return w;
}
for (const mode of ['normal','reconcile-throw','reconcile-noop','reconcile-read-throw','reconcile-mismatch','ack-throw','meta-and-remove-fail']) {
 test('L same lifecycle '+mode+': completion survives restart and is consumed once', async () => {
  const w = await openSecondLife();
  const next = oldWorld(w).Samsara.chooseNaihe('mem');
  assert.equal(JSON.stringify(next), JSON.stringify(w.first));
  const meta = w.storage.get('moxian.meta'), leg = w.storage.get('moxian.legacy');
  let enabled = true, wrote = false;
  const adapter = {
   getItem(k) {
    if(enabled && wrote && k==='moxian.slots') {
     if(mode==='reconcile-read-throw')throw Error('readback');
     if(mode==='reconcile-mismatch')return '{}';
    }
    return w.localStorage.getItem(k);
   },
   setItem(k,v) {
    if(enabled && k==='moxian.slots') {
     if(mode==='reconcile-throw')throw Error('quota');
     if(mode==='reconcile-noop')return;
     wrote = true;
    }
    w.localStorage.setItem(k,v);
   }, removeItem:k=>w.localStorage.removeItem(k)
  };
  freshModules(adapter,w.ctx).Samsara.loadMeta();
  assert.equal(w.storage.get('moxian.meta'),meta); assert.equal(w.storage.get('moxian.legacy'),leg);
  enabled=false;
  let re=freshModules(adapter,w.ctx);
  assert.equal(JSON.stringify(re.Samsara.peekLegacy()),JSON.stringify(next));
  assert.equal(re.Samsara.loadMeta().bridge.chosen,'mem');
  // Consume via the production character commit with removal still denied.
  if(mode==='ack-throw'){w.flags.failKey=true;w.flags.keyFailsLeft=1;w.flags.failRemove=false;}
  if(mode==='meta-and-remove-fail')w.flags.failMeta=true;
  await create(w,2); assert.equal(w.Slots.read(2).wx,6);
  for(let n=0;n<3;n++)assert.equal(reload(w).Samsara.peekLegacy(),null);
  w.flags.failKey=false;
  re=reload(w); const m=re.Samsara.loadMeta();m.guide=42;re.Samsara.saveMeta(m);
  assert.equal(reload(w).Samsara.peekLegacy(),null);
  w.flags.failRemove=false;w.flags.failMeta=false;
  assert.equal(reload(w).Samsara.peekLegacy(),null);assert(!w.storage.has('moxian.legacy'));
  assert.equal(reload(w).Samsara.loadMeta().guide,42);
 });
}
for(const midRead of [false,true])test('L dismissBridge creates no legacy, midRead='+midRead,async()=>{
 const w=world();await create(w);endLife(w);w.flags.failRemove=true;await create(w,1);
 const old=oldWorld(w),s=old.Slots.read(1);s.dead=true;old.Samsara.recordLife(s,'ascend','旧卷');
 if(midRead){assert(reload(w).Samsara.bridgeOpen());assert.equal(reload(w).Samsara.peekLegacy(),null);}
 oldWorld(w).Samsara.dismissBridge();assert.equal(reload(w).Samsara.peekLegacy(),null);
 w.flags.failRemove=false;assert.equal(reload(w).Samsara.peekLegacy(),null);
});
test('L already acknowledged closed mirror cannot re-authorize residue after an open-meta write fails to mirror',async()=>{
 const w=await openSecondLife();const open=reload(w).Samsara.loadMeta();
 oldWorld(w).Samsara.chooseNaihe('mem');assert(reload(w).Samsara.peekLegacy());
 await create(w,2);w.flags.failMeta=true;
 reload(w).Samsara.saveMeta(open);
 assert.equal(reload(w).Samsara.peekLegacy(),null);
 w.flags.failMeta=false;w.flags.failRemove=false;assert.equal(reload(w).Samsara.peekLegacy(),null);
});

// Inject failures after setup so each actual entry, not just adoption, is exercised.
function faultAdapter(w,mode) {
 const control={enabled:true,wrote:false};
 const adapter={
  getItem(k){
   if(control.enabled&&k==='moxian.slots') {
    if(mode==='initial-read-throw'||(control.wrote&&mode==='readback-throw'))throw Error('read');
    if(control.wrote&&mode==='mismatch')return '{}';
   }
   return w.localStorage.getItem(k);
  },
  setItem(k,v){
   if(control.enabled&&k==='moxian.slots') {
    if(mode==='write-throw')throw Error('write');
    control.wrote=true;if(mode==='noop')return;
   }
   w.localStorage.setItem(k,v);
  },
  removeItem(k){if(control.enabled&&mode==='remove-throw'&&k==='moxian.v1')throw Error('remove');w.localStorage.removeItem(k);}
 };
 return {adapter,control};
}
const failureModes=['write-throw','initial-read-throw','readback-throw','mismatch','noop','remove-throw','normal'];
for(const entry of ['adopt','write','writeActive','game-save'])for(const occupied of [false,true])for(const mode of failureModes) {
 test('V '+entry+' occupied='+occupied+' '+mode,()=>{
  const w=world(),original=w.Core.newState('旧卷',roll(w.ctx),null),raw=JSON.stringify(original);
  w.storage.clear();
  if(occupied){w.Slots.write(0,original);const other=w.Core.newState('另卷',roll(w.ctx),null);w.Slots.write(2,other);w.Slots.setActive(0);}
  w.storage.set('moxian.v1',raw);const before=w.storage.get('moxian.slots');
  const {adapter,control}=faultAdapter(w,mode),ctx=loadWorld(adapter);
  const api=vm.runInContext('({Slots,Core})',ctx);original.name='进度';
  let result;
  if(entry==='adopt')result=api.Slots.loadBox();
  if(entry==='write')result=api.Slots.write(0,original);
  if(entry==='writeActive')result=api.Slots.writeActive(original);
  if(entry==='game-save'){
   const source=fs.readFileSync(path.join(ROOT,'js/game.js'),'utf8');
   vm.runInContext('function tickPlayed(){};'+source.slice(source.indexOf('function save()'),source.indexOf('function load()')),ctx);
   ctx.input=original;result=vm.runInContext('S=input;save()',ctx);
  }
  const mutating=entry!=='adopt';
  const failed=!['normal','remove-throw'].includes(mode);
  if(failed||mode==='remove-throw'||(entry==='adopt'&&occupied))assert.equal(w.storage.get('moxian.v1'),raw);
  else assert(!w.storage.has('moxian.v1'));
  if(mutating&&failed)assert(!result,'failure must be returned');
  if(['write-throw','initial-read-throw','noop'].includes(mode))assert.equal(w.storage.get('moxian.slots'),before);
  control.enabled=false;
  const re=reload(w),saved=re.Slots.read(0);assert(saved);
  if(occupied)assert.equal(re.Slots.read(2).name,'另卷');
  // Truthful successful set followed by an unreadable/lying get may have saved
  // progress; retaining the source is required, rolling back that progress is not.
  if(mutating&&['normal','remove-throw','readback-throw','mismatch'].includes(mode))assert.equal(saved.name,'进度');
  else assert.equal(saved.name,'旧卷');
  assert(re.Slots.write(0,original));assert.equal(reload(w).Slots.read(0).name,'进度');assert(!w.storage.has('moxian.v1'));
 });
}

// Real openSlots handlers and Codec; tiny event adapter, no browser or layout claim.
function slotUI(w,adapter) {
 const ctx=loadWorld(adapter),source=fs.readFileSync(path.join(ROOT,'js/game.js'),'utf8');
 vm.runInContext(`
  var sheet=null;
  function esc(x){return String(x)};function inkConfirm(){return Promise.resolve(true)};
  function closeSheet(){return Promise.resolve()};function initTitle(){};function unrollTo(){};
  function openSheet(title,w){sheet=w};function tickPlayed(){};
 `+source.slice(source.indexOf('function save()'),source.indexOf('function load()'))+
 source.slice(source.indexOf('const END_NAME ='),source.indexOf('/* ================= 仙途志')),ctx);
 // Capture listeners on created nodes; querySelector returns stable stand-ins.
 const original=ctx.document.createElement;
 ctx.document.createElement=tag=>{const e=original(tag);e.listeners={};e.addEventListener=(k,fn)=>e.listeners[k]=fn;e.replaceWith=()=>{};return e;};
 return ctx;
}
async function action(ctx,a){const b={dataset:{a},closest:()=>null};await vm.runInContext('sheet',ctx).listeners.click({target:{closest:q=>q==='.slot-card'?null:b}});}
for(const entry of ['save','load','import'])for(const mode of failureModes)test('UI '+entry+' '+mode,async()=>{
 const w=world(),s=w.Core.newState('旧卷',roll(w.ctx),null);w.storage.clear();w.Slots.write(0,s);
 w.Slots.write(2,w.Core.newState('另卷',roll(w.ctx),null));w.Slots.setActive(0);
 const raw=JSON.stringify(s);w.storage.set('moxian.v1',raw);
 const {adapter,control}=faultAdapter(w,mode);control.enabled=false;
 const ctx=slotUI(w,adapter);ctx.input=s;vm.runInContext('S=input;openSlots()',ctx);
 const before=w.storage.get('moxian.slots');
 let retryImport;
 if(entry==='import'){
  // The fake document keeps created nodes by tag + element count. Capture the
  // actual import node instead of reimplementing its handler.
  const nodes=[];const orig=ctx.document.createElement;ctx.document.createElement=tag=>{const n=orig(tag);nodes.push(n);return n;};
  await action(ctx,'import');const form=nodes[0];
  ctx.imported=w.Core.newState('导入',roll(w.ctx),null);
  form.querySelector('textarea').value=vm.runInContext('Codec.encode(imported)',ctx);
  retryImport=form.querySelector('[data-a="doimp"]').onclick;
  control.enabled=true;await retryImport();
 }else{control.enabled=true;await action(ctx,entry);}
 const failed=!['normal','remove-throw'].includes(mode);
 if(failed){assert.equal(w.storage.get('moxian.v1'),raw);assert.equal(vm.runInContext('S.name',ctx),'旧卷');assert(ctx.lastToast.includes('未写入')||entry==='load'&&ctx.lastToast.includes('空'));}
 if(['write-throw','initial-read-throw','noop'].includes(mode))assert.equal(w.storage.get('moxian.slots'),before);
 control.enabled=false;assert.equal(reload(w).Slots.read(2).name,'另卷');assert(reload(w).Slots.read(0));
 if(entry==='import'&&!failed){assert.equal(reload(w).Slots.read(0).name,'导入');assert.equal(vm.runInContext('S',ctx),null);}
 if(failed){if(retryImport)await retryImport();else await action(ctx,entry);assert(!w.storage.has('moxian.v1'));assert.equal(reload(w).Slots.read(0).name,entry==='import'?'导入':'旧卷');}
});

for(const mode of failureModes)test('fallback newGame without Samsara '+mode,async()=>{
 const w=world();w.storage.clear();w.storage.set('moxian.legacy',JSON.stringify({wx:2,v:1}));
 const {adapter,control}=faultAdapter(w,mode);
 // Remove only the Samsara declaration when loading the real module harness.
 const loader=loadWorld.toString().replace("'slots','codec','samsara'","'slots','codec'");
 const ctx=eval('('+loader+')')(adapter);ctx.testRoll=roll(ctx);ctx.__slotTarget=0;
 await vm.runInContext("newGame('兼容',testRoll,{id:'free'},'shusheng')",ctx);
 const failed=!['normal','remove-throw'].includes(mode);
 if(failed)assert(w.storage.has('moxian.legacy'));else assert(!w.storage.has('moxian.legacy'));
 control.enabled=false;
 const re=reload(w);
 if(w.storage.has('moxian.slots')){assert.equal(re.Slots.read(0).wx,7);assert.equal(re.Samsara.peekLegacy(),null);}
 else if(mode==='noop'){assert.equal(re.Samsara.peekLegacy().wx,2);assert(ctx.lastToast.includes('待核实'));assert(ctx.__resumeCreated);return;}
 else{assert.equal(re.Samsara.peekLegacy().wx,2);await vm.runInContext("newGame('兼容',testRoll,{id:'free'},'shusheng')",ctx);assert.equal(re.Slots.read(0).wx,7);}
 assert.equal(reload(w).Samsara.peekLegacy(),null);
});


for(const kind of ['mismatched-life','mismatched-kind'])test('L closure without matching lifecycle/payload '+kind,async()=>{
 const w=await openSecondLife(),old=oldWorld(w),m=old.Samsara.loadMeta();
 m.bridge.open=0;m.bridge.chosen=kind==='mismatched-kind'?'page':'mem';
 if(kind==='mismatched-life')m.bridge.lives--;
 old.Samsara.saveMeta(m);assert.equal(reload(w).Samsara.peekLegacy(),null);
});
for(const slotsPresent of [false,true])for(const fail of [false,true])test('explicit legacy consume semantics slots='+slotsPresent+' fail='+fail,()=>{
 const w=world();w.storage.clear();const raw=JSON.stringify({wx:2,v:1});w.storage.set('moxian.legacy',raw);w.flags.failRemove=fail;
 const ctx=slotsPresent?w.ctx:eval('('+loadWorld.toString().replace("'slots','codec','samsara'","'codec','samsara'")+')')(w.localStorage);
 const sam=vm.runInContext('Samsara',ctx);assert.equal(sam.consumeLegacy().wx,2);
 // Direct public consumption without an envelope has no destination by design;
 // production newGame now only calls this API while creation is staged.
 assert.equal(w.storage.get('moxian.legacy'),fail?raw:undefined);
 w.flags.failRemove=false;sam.consumeLegacy();assert.equal(reload(w).Samsara.peekLegacy(),null);
});
for(const fail of [false,true])test('explicit v1 fallback reset remains destructive only on confirmed reset, remove fails='+fail,async()=>{
 const w=world(),raw=JSON.stringify(w.Core.newState('旧卷',roll(w.ctx),null));w.storage.clear();w.storage.set('moxian.v1',raw);
 let enabled=fail;
 const adapter=Object.assign({},w.localStorage,{removeItem(k){if(enabled&&k==='moxian.v1')throw Error('remove');w.localStorage.removeItem(k);}});
 const ctx=eval('('+loadWorld.toString().replace("'slots','codec','samsara'","'codec'")+')')(adapter);
 const src=fs.readFileSync(path.join(ROOT,'js/game.js'),'utf8');ctx.input=JSON.parse(raw);
 vm.runInContext(`const SAVE_KEY='moxian.v1';var sheet;S=input;
 function realmStr(){return ''};function closeSheet(){return Promise.resolve()};
 function inkConfirm(){return Promise.resolve(true)};function resetCreate(){};
 function unrollTo(){};function openSheet(title,w){sheet=w};
 `+src.slice(src.indexOf('function openMenu()'),src.indexOf('/* ================= 三卷存档')),ctx);
 vm.runInContext('openMenu()',ctx);const click=()=>vm.runInContext('sheet',ctx).onclick({target:{closest:()=>({dataset:{m:'reset'}})}});
 if(fail){await assert.rejects(click());assert.equal(w.storage.get('moxian.v1'),raw);assert(vm.runInContext('S',ctx));}
 else{await click();assert(!w.storage.has('moxian.v1'));assert.equal(vm.runInContext('S',ctx),null);}
 enabled=false;if(fail)await click();assert(!w.storage.has('moxian.v1'));assert.equal(reload(w).Slots.readActive(),null);
});
test('sole v1 fallback save writes same key, never removes it on exception',()=>{
 const w=world(),s=w.Core.newState('旧卷',roll(w.ctx),null),raw=JSON.stringify(s);w.storage.clear();w.storage.set('moxian.v1',raw);
 let fail=true;const adapter=Object.assign({},w.localStorage,{setItem(k,v){if(fail)throw Error('quota');w.localStorage.setItem(k,v);},removeItem(){throw Error('unexpected deletion');}});
 const ctx=eval('('+loadWorld.toString().replace("'slots','codec','samsara'","'codec'")+')')(adapter),src=fs.readFileSync(path.join(ROOT,'js/game.js'),'utf8');ctx.input=s;
 vm.runInContext("const SAVE_KEY='moxian.v1';function tickPlayed(){};S=input;"+src.slice(src.indexOf('function save()'),src.indexOf('function load()')),ctx);
 assert.equal(vm.runInContext('save()',ctx),false);assert.equal(w.storage.get('moxian.v1'),raw);
 fail=false;assert.equal(vm.runInContext('save()',ctx),true);assert.equal(w.storage.get('moxian.v1'),raw);
});

for(const entry of ['clear','ui-wipe','menu-reset'])for(const fail of [false,true])test('explicit slot reset '+entry+' write fails='+fail,async()=>{
 const w=world(),s=w.Core.newState('旧卷',roll(w.ctx),null),raw=JSON.stringify(s);w.storage.clear();w.storage.set('moxian.v1',raw);
 const ctx=slotUI(w,w.localStorage);ctx.input=s;vm.runInContext('S=input',ctx);
 // Fail before even opening the sheet: its loadBox is also an adoption entry.
 w.flags.failKey=fail;
 async function reset(){
  if(entry==='clear'){vm.runInContext('Slots.clear(0)',ctx);return;}
  if(entry==='ui-wipe'){vm.runInContext('openSlots()',ctx);await action(ctx,'wipe');return;}
  const src=fs.readFileSync(path.join(ROOT,'js/game.js'),'utf8');
  vm.runInContext('function realmStr(){return ""};function resetCreate(){};'+src.slice(src.indexOf('function openMenu()'),src.indexOf('/* ================= 三卷存档')),ctx);
  vm.runInContext('openMenu()',ctx);await vm.runInContext('sheet',ctx).onclick({target:{closest:()=>({dataset:{m:'reset'}})}});
 }
 await reset();
 if(fail){assert.equal(w.storage.get('moxian.v1'),raw);assert(!w.storage.has('moxian.slots'));w.flags.failKey=false;assert.equal(reload(w).Slots.read(0).name,'旧卷');vm.runInContext('S=input',ctx);await reset();}
 assert(!w.storage.has('moxian.v1'));assert.equal(reload(w).Slots.read(0),null);
});
// Round5b: use extracted production newGame and real staged Samsara, not a
// replacement creation algorithm. Exercise the trusted set boundary separately
// from lying adapters and from a real precommit exception.
for(const staged of [true,false])for(const mode of ['readback-throw','normal','write-throw','mismatch','noop'])test('C commit boundary staged='+staged+' '+mode,async()=>{
 const w=world();w.storage.clear();
 const legacy=JSON.stringify({wx:2,v:1});w.storage.set('moxian.legacy',legacy);
 // An existing destination and a retained original v1 must coexist unchanged.
 w.storage.set('moxian.slots',JSON.stringify({v:1,active:0,slots:[null,null,null]}));
 const original=JSON.stringify(w.Core.newState('旧源',roll(w.ctx),null));w.storage.set('moxian.v1',original);
 const {adapter,control}=faultAdapter(w,mode);
 const loader=staged?loadWorld:eval('('+loadWorld.toString().replace("'slots','codec','samsara'","'slots','codec'")+')');
 const ctx=loader(adapter);ctx.testRoll=roll(ctx);ctx.__slotTarget=0;
 vm.runInContext('var newCount=0;const actualNew=Core.newState;Core.newState=function(...args){newCount++;return actualNew(...args)};',ctx);
 const invoke=()=>vm.runInContext("newGame('首卷',testRoll,{id:'free'},'shusheng')",ctx);
 await invoke();
 assert.equal(w.storage.get('moxian.v1'),original);
 if(mode==='write-throw'){
  assert(!ctx.testRoll._created);assert(!ctx.__resumeCreated);assert(ctx.lastToast.includes('未写入'));
  assert.equal(boxOf(w.storage).slots.filter(Boolean).length,0);assert.equal(w.storage.get('moxian.legacy'),legacy);
  control.enabled=false;await invoke();assert(ctx.testRoll._created);assert.equal(boxOf(w.storage).slots[0].data.wx,7);return;
 }
 assert(ctx.testRoll._created);assert(!String(ctx.lastToast).includes('未写入'));
 if(mode!=='normal'){
  assert(ctx.__resumeCreated);assert(ctx.lastToast.includes(mode==='readback-throw'?'新卷已存':'待核实'));
  assert.equal(w.storage.get('moxian.legacy'),legacy);
  await invoke();ctx.otherRoll=roll(ctx);ctx.__slotTarget=1;
  await vm.runInContext("newGame('另卷',otherRoll,{id:'free'},'shusheng')",ctx);
  assert.equal(vm.runInContext('newCount',ctx),1);
 }
 control.enabled=false;
 if(mode==='noop'){
  await ctx.__resumeCreated();assert(ctx.__resumeCreated);assert.equal(vm.runInContext('newCount',ctx),1);
  assert.equal(boxOf(w.storage).slots.filter(Boolean).length,0);assert.equal(w.storage.get('moxian.legacy'),legacy);return;
 }
 const candidate=JSON.stringify(boxOf(w.storage).slots[0].data);
 if(ctx.__resumeCreated){
  // A different callback after recovery must resume slot zero, not its target 1.
  await vm.runInContext("newGame('另卷',otherRoll,{id:'free'},'shusheng')",ctx);
 }
 await invoke();await invoke();
 assert(!ctx.__resumeCreated);assert.equal(vm.runInContext('newCount',ctx),1);
 assert.equal(vm.runInContext('S.name',ctx),'首卷');assert.equal(vm.runInContext('S.wx',ctx),7);
 const box=boxOf(w.storage);assert.equal(box.slots.filter(Boolean).length,1);assert.equal(JSON.stringify(box.slots[0].data),candidate);
 assert.equal(box.creationEffects['moxian.legacy'],null);
 const effects=JSON.stringify(box.creationEffects);
 assert.equal(reload(w).Samsara.peekLegacy(),null);assert.equal(reload(w).Samsara.peekLegacy(),null);
 assert.equal(JSON.stringify(boxOf(w.storage).creationEffects),effects);
 assert(!w.storage.has('moxian.legacy'));assert.equal(w.storage.get('moxian.v1'),original);
});

test('C fallback without legacy: committed unreadable slot locks creation and null resume is rejected',async()=>{
 const w=world();w.storage.clear();const {adapter,control}=faultAdapter(w,'readback-throw');
 const loader=eval('('+loadWorld.toString().replace("'slots','codec','samsara'","'slots','codec'")+')');
 const ctx=loader(adapter);ctx.testRoll=roll(ctx);ctx.__slotTarget=0;
 await vm.runInContext("newGame('首卷',testRoll,{id:'free'},'shusheng')",ctx);
 assert(ctx.testRoll._created);assert(ctx.__resumeCreated);assert(ctx.lastToast.includes('新卷已存'));
 const raw=w.storage.get('moxian.slots');control.enabled=false;
 w.storage.set('moxian.slots',JSON.stringify({v:1,active:0,slots:[null,null,null]}));
 await ctx.__resumeCreated();assert(ctx.__resumeCreated);assert.equal(vm.runInContext('curScreen',ctx),'create');
 w.storage.set('moxian.slots',raw);await ctx.__resumeCreated();assert(!ctx.__resumeCreated);
 assert.equal(vm.runInContext('S.name',ctx),'首卷');assert.equal(boxOf(w.storage).slots.filter(Boolean).length,1);
});

(async()=>{
 let failed=0;
 for(const [name,fn] of tests){try{await fn();passed.push(name);console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+'\n'+e.stack);}}
 console.log(passed.length+' passed; '+failed+' failed; '+tests.length+' Round5 checks.');
 if(failed)process.exitCode=1;
})();
