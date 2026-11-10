#!/usr/bin/env node
/* Separate corrected comparison of the original independent checks.
   Original source SHA256: 735aef1223202ebe08f79399772ccf849000fcdb6ea4df461b42e4c62891ee54
   Corrected expectations: 12 (reconciles surviving mirror), 14 (version return),
   15 (migration). Other risk characterizations remain.
   Original external file is untouched.
   Uses an in-memory Map only; never touches user localStorage or files under the checkout except read-only source loads. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const passed = [];
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

function loadWorld(localStorage) {
  const elements = new Map();
  function element(key) {
    if (!elements.has(key)) elements.set(key, {
      value: '', hidden: false, disabled: false, textContent: '', dataset: {},
      style: { setProperty() {}, opacity: 0 }, classList: { add() {}, remove() {}, toggle() {} },
      setAttribute() {}, addEventListener() {}, querySelector: q => element(key + ' ' + q),
      querySelectorAll: () => [], appendChild() {}, focus() {}, blur() {}
    });
    return elements.get(key);
  }
  const document = {
    querySelector: element, getElementById: k => element('#' + k),
    querySelectorAll: () => [], documentElement: { dataset: {} },
    body: { dataset: {}, classList: { add() {}, remove() {} } }
  };
  const sandbox = {
    console, Math, Date, JSON, Uint32Array, Uint8Array, TextEncoder, TextDecoder, btoa, atob,
    crypto: { getRandomValues(a) { a[0] = 0; return a; } },
    localStorage, document, setTimeout: () => 0, clearTimeout() {}, window: null, globalThis: null
  };
  sandbox.window = sandbox; sandbox.globalThis = sandbox;
  const ctx = vm.createContext(sandbox);
  const files = ['data','gongfa','gear','path','story','sect','baijia','world','tianxia','karma','life','juan','core','loops','jianghu','redworld','folio','people','mingge','village','slots','codec','samsara'];
  for (const f of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', f + '.js'), 'utf8'), ctx, { filename: f + '.js' });
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

// -------- tests --------
{
  const { storage, flags, localStorage } = makeStorage();
  const ctx = loadWorld(localStorage);
  const sam = vm.runInContext('Samsara', ctx);
  const Slots = vm.runInContext('Slots', ctx);
  const Core = vm.runInContext('Core', ctx);

  check('create failure after consume keeps legacy for retry', () => {
    storage.clear();
    sam.writeLegacy({ wx: 2, v: 1 });
    ctx.__villageDraft = null;
    ctx.__slotTarget = 0;
    ctx.testRoll = roll(ctx);
    flags.failWrite = true;
    vm.runInContext("newGame('未成',testRoll,{id:'free'},'shusheng')", ctx);
    flags.failWrite = false;
    assert(!ctx.testRoll._created);
    assert.equal(sam.peekLegacy().wx, 2);
    assert(storage.has('moxian.legacy'));
    assert(!storage.has('moxian.slots'));
    vm.runInContext("newGame('再试',testRoll,{id:'free'},'shusheng')", ctx);
    assert(ctx.testRoll._created);
    assert.equal(Slots.read(0).wx, 7);
    assert.equal(sam.peekLegacy(), null);
  });
}

{
  const { storage, flags, localStorage } = makeStorage();
  const ctx = loadWorld(localStorage);
  const sam = vm.runInContext('Samsara', ctx);
  const Slots = vm.runInContext('Slots', ctx);

  check('failed legacy mirror remove cannot grant a second inheritance', () => {
    storage.clear();
    sam.writeLegacy({ wx: 2, v: 1 });
    flags.failRemove = true;
    ctx.__villageDraft = null;
    ctx.__slotTarget = 0;
    ctx.testRoll = roll(ctx);
    vm.runInContext("newGame('继承',testRoll,{id:'free'},'shusheng')", ctx);
    assert.equal(Slots.read(0).wx, 7);
    assert(storage.has('moxian.legacy'), 'stale mirror may remain');
    assert.equal(sam.peekLegacy(), null);
    assert.strictEqual(boxOf(storage).creationEffects['moxian.legacy'], null);
    ctx.__slotTarget = 1;
    ctx.testRoll = roll(ctx);
    vm.runInContext("newGame('不再继承',testRoll,{id:'free'},'shusheng')", ctx);
    assert.equal(Slots.read(1).wx, 5);
    flags.failRemove = false;
    const re = freshModules(localStorage, ctx);
    assert.equal(re.Samsara.peekLegacy(), null);
    assert.equal(re.Slots.read(0).wx, 7);
    assert.equal(re.Slots.read(1).wx, 5);
  });
}

{
  const { storage, flags, localStorage } = makeStorage();
  const ctx = loadWorld(localStorage);
  const sam = vm.runInContext('Samsara', ctx);
  const Slots = vm.runInContext('Slots', ctx);
  const Core = vm.runInContext('Core', ctx);

  check('old v143 box without creationEffects: consume commits in the same slots write', () => {
    storage.clear();
    const prior = Core.newState('旧档', roll(ctx), null);
    storage.set('moxian.slots', JSON.stringify(v143Box(prior)));
    const meta = sam.emptyMeta();
    meta.lives = 1; meta.guide = 1; meta.backfilled = 1;
    storage.set('moxian.meta', JSON.stringify(meta));
    storage.set('moxian.legacy', JSON.stringify({ wx: 2, v: 1 }));
    assert(!boxOf(storage).creationEffects);
    flags.failRemove = true;
    ctx.__villageDraft = null;
    ctx.__slotTarget = 1;
    ctx.testRoll = roll(ctx);
    vm.runInContext("newGame('升级后来世',testRoll,{id:'free'},'shusheng')", ctx);
    assert(ctx.testRoll._created);
    assert.equal(Slots.read(0).name, '旧档');
    assert.equal(Slots.read(1).wx, 7);
    assert.strictEqual(boxOf(storage).creationEffects['moxian.legacy'], null);
    assert.equal(sam.peekLegacy(), null);
    ctx.__slotTarget = 2;
    ctx.testRoll = roll(ctx);
    vm.runInContext("newGame('不可再继承',testRoll,{id:'free'},'shusheng')", ctx);
    assert.equal(Slots.read(2).wx, 5);
    const re = freshModules(localStorage, ctx);
    assert.equal(re.Samsara.peekLegacy(), null);
    assert.equal(JSON.parse(re.Samsara.loadMeta() && storage.get('moxian.slots') && '1'), 1);
    assert.equal(re.Samsara.loadMeta().lives, 1);
  });
}

{
  const { storage, flags, localStorage } = makeStorage();
  const ctx = loadWorld(localStorage);
  const sam = vm.runInContext('Samsara', ctx);
  const Slots = vm.runInContext('Slots', ctx);

  check('reload after successful create uses authority even if mirrors are stale', () => {
    storage.clear();
    sam.writeLegacy({ wx: 2, v: 1 });
    flags.failRemove = true;
    flags.failMeta = true;
    ctx.__villageDraft = null;
    ctx.__slotTarget = 0;
    ctx.testRoll = roll(ctx);
    vm.runInContext("newGame('刷新后身',testRoll,{id:'free'},'shusheng')", ctx);
    assert(ctx.testRoll._created);
    assert.equal(Slots.read(0).wx, 7);
    const re = freshModules(localStorage, ctx);
    assert.equal(re.Samsara.peekLegacy(), null);
    assert.equal(re.Slots.read(0).wx, 7);
    // Later meta write while mirrors still fail must not revive legacy
    const later = re.Samsara.loadMeta();
    later.guide = 9;
    later.backfilled = 1;
    re.Samsara.saveMeta(later);
    assert.equal(re.Samsara.loadMeta().guide, 9);
    assert.equal(re.Samsara.peekLegacy(), null);
  });
}

{
  const { storage, flags, localStorage } = makeStorage();
  const ctx = loadWorld(localStorage);
  const sam = vm.runInContext('Samsara', ctx);
  const Slots = vm.runInContext('Slots', ctx);

  check('occupied-slot reject rolls back staged consume; legacy remains', () => {
    storage.clear();
    const Core = vm.runInContext('Core', ctx);
    const existing = Core.newState('占卷', roll(ctx), null);
    assert(Slots.createEmpty(0, existing).ok);
    sam.writeLegacy({ wx: 2, v: 1 });
    ctx.__villageDraft = null;
    ctx.__slotTarget = 0;
    ctx.testRoll = roll(ctx);
    vm.runInContext("newGame('撞车',testRoll,{id:'free'},'shusheng')", ctx);
    assert(!ctx.testRoll._created);
    assert.equal(sam.peekLegacy().wx, 2);
    ctx.__slotTarget = 1;
    vm.runInContext("newGame('改空卷',testRoll,{id:'free'},'shusheng')", ctx);
    assert(ctx.testRoll._created);
    assert.equal(Slots.read(1).wx, 7);
    assert.equal(sam.peekLegacy(), null);
  });
}

{
  const { storage, flags, localStorage } = makeStorage();
  const ctx = loadWorld(localStorage);
  const sam = vm.runInContext('Samsara', ctx);
  const Slots = vm.runInContext('Slots', ctx);
  const Core = vm.runInContext('Core', ctx);

  check('write/setActive/clear preserve authority and do not revive consumed legacy', () => {
    storage.clear();
    sam.writeLegacy({ wx: 2, v: 1 });
    flags.failRemove = true;
    ctx.__villageDraft = null;
    ctx.__slotTarget = 0;
    ctx.testRoll = roll(ctx);
    vm.runInContext("newGame('保字段',testRoll,{id:'free'},'shusheng')", ctx);
    const saved = Slots.read(0);
    Slots.setActive(0);
    Slots.writeActive(saved);
    const box = boxOf(storage);
    assert(box.creationEffects);
    assert.strictEqual(box.creationEffects['moxian.legacy'], null);
    assert.equal(sam.peekLegacy(), null);
    Slots.clear(0);
    assert.strictEqual(boxOf(storage).creationEffects['moxian.legacy'], null);
    assert.equal(sam.peekLegacy(), null);
  });
}

{
  const { storage, flags, localStorage } = makeStorage();
  const ctx = loadWorld(localStorage);
  const sam = vm.runInContext('Samsara', ctx);
  const Slots = vm.runInContext('Slots', ctx);

  check('first-life with no pre-existing meta key still commits a real meta snapshot via staged saveMeta', () => {
    storage.clear();
    ctx.__villageDraft = null;
    ctx.__slotTarget = 0;
    ctx.testRoll = roll(ctx);
    vm.runInContext("newGame('初生无meta',testRoll,{id:'free'},'shusheng')", ctx);
    assert(ctx.testRoll._created);
    const box = boxOf(storage);
    assert(box.creationEffects);
    // Production newGame (Folio.boot / Samsara hooks) saveMeta into the staging map,
    // so authority gets a real meta document, not null, even when no mirror key existed.
    assert.equal(typeof box.creationEffects['moxian.meta'], 'string');
    const snap = JSON.parse(box.creationEffects['moxian.meta']);
    assert.equal(snap.v, 1);
    assert.equal(snap.lives | 0, 0);
    assert.equal(snap.backfilled, 1);
    assert.strictEqual(box.creationEffects['moxian.legacy'], null);
    const m = sam.loadMeta();
    assert.equal(m.lives | 0, 0);
    assert.equal(m.backfilled, 1);
    const re = freshModules(localStorage, ctx);
    assert.equal(re.Samsara.loadMeta().lives | 0, 0);
    assert.equal(re.Samsara.loadMeta().backfilled, 1);
    assert(Slots.read(0).flags.guide);
  });
}

{
  const { storage, flags, localStorage } = makeStorage();
  const ctx = loadWorld(localStorage);
  const sam = vm.runInContext('Samsara', ctx);
  const Core = vm.runInContext('Core', ctx);

  check('after authority exists, writeLegacy+recordLife survive failed mirrors and reload', () => {
    storage.clear();
    ctx.__villageDraft = null;
    ctx.__slotTarget = 0;
    ctx.testRoll = roll(ctx);
    vm.runInContext("newGame('将终',testRoll,{id:'free'},'shusheng')", ctx);
    const s = vm.runInContext('Slots.read(0)', ctx);
    s.dead = true; s.ending = 'zuohua'; s.age = 80;
    flags.failMeta = true;
    flags.failRemove = true;
    const rec = sam.recordLife(s, 'zuohua', '旧卷');
    assert.equal(sam.loadMeta().lives, 1);
    sam.chooseNaihe('mem');
    assert(sam.peekLegacy() && sam.peekLegacy().naihe);
    const re = freshModules(localStorage, ctx);
    assert.equal(re.Samsara.loadMeta().lives, 1);
    assert(re.Samsara.peekLegacy() && re.Samsara.peekLegacy().naihe);
    assert(re.Samsara.bridgeOpen() === false);
  });
}

{
  const { storage, flags, writes, localStorage } = makeStorage();
  const ctx = loadWorld(localStorage);
  const sam = vm.runInContext('Samsara', ctx);

  check('writeLegacy after authority rewrites the full slots key; failing that write drops the legacy silently', () => {
    storage.clear();
    ctx.__villageDraft = null;
    ctx.__slotTarget = 0;
    ctx.testRoll = roll(ctx);
    vm.runInContext("newGame('配额',testRoll,{id:'free'},'shusheng')", ctx);
    flags.failKey = true;
    flags.keyFailsLeft = 0; // next moxian.slots setItem fails
    sam.writeLegacy({ wx: 2, v: 1 });
    assert.equal(sam.peekLegacy(), null, 'authority write failed; swallowed; no legacy recorded');
    const re = freshModules(localStorage, ctx);
    assert.equal(re.Samsara.peekLegacy(), null);
    flags.failKey = false;
    sam.writeLegacy({ wx: 2, v: 1 });
    assert.equal(sam.peekLegacy().wx, 2);
  });
}

{
  const { storage, flags, localStorage } = makeStorage();
  const ctx = loadWorld(localStorage);
  const sam = vm.runInContext('Samsara', ctx);
  const Slots = vm.runInContext('Slots', ctx);

  check('trial creation does not consume a pending legacy', () => {
    storage.clear();
    sam.writeLegacy({ wx: 2, v: 1 });
    ctx.__villageDraft = null;
    ctx.__trialStart = true;
    ctx.__slotTarget = 0;
    ctx.testRoll = roll(ctx);
    vm.runInContext("newGame('试炼',testRoll,{id:'free'},'qingshi')", ctx);
    const s = Slots.read(0);
    assert.equal(s.wx, 5);
    assert.equal(sam.peekLegacy().wx, 2);
    ctx.__trialStart = false;
    ctx.__slotTarget = 1;
    ctx.testRoll = roll(ctx);
    vm.runInContext("newGame('来世',testRoll,{id:'free'},'shusheng')", ctx);
    assert.equal(Slots.read(1).wx, 7);
    assert.equal(sam.peekLegacy(), null);
  });
}

{
  const { storage, flags, localStorage } = makeStorage();
  const ctx = loadWorld(localStorage);
  const sam = vm.runInContext('Samsara', ctx);
  const Core = vm.runInContext('Core', ctx);

  check('downgrade / old-client read of failed mirrors can still see leftover legacy (not a new-client bug)', () => {
    storage.clear();
    sam.writeLegacy({ wx: 2, v: 1 });
    flags.failRemove = true;
    ctx.__villageDraft = null;
    ctx.__slotTarget = 0;
    ctx.testRoll = roll(ctx);
    vm.runInContext("newGame('新客户消耗',testRoll,{id:'free'},'shusheng')", ctx);
    assert.equal(sam.peekLegacy(), null);
    assert(storage.has('moxian.legacy'));
    const stale = JSON.parse(storage.get('moxian.legacy'));
    assert.equal(stale.wx, 2);
  });
}

{
  const { storage, flags, localStorage } = makeStorage();
  const ctx = loadWorld(localStorage);
  const sam = vm.runInContext('Samsara', ctx);
  const Core = vm.runInContext('Core', ctx);

  check('FIXED comparison 12: a surviving newer mirror repairs this stale saveBox snapshot', () => {
    storage.clear();
    ctx.__villageDraft = null;
    ctx.__slotTarget = 0;
    ctx.testRoll = roll(ctx);
    vm.runInContext("newGame('持盒',testRoll,{id:'free'},'shusheng')", ctx);
    const stale = vm.runInContext('Slots.loadBox()', ctx);
    sam.writeLegacy({ wx: 2, v: 1 });
    assert.equal(sam.peekLegacy().wx, 2);
    vm.runInContext('Slots.saveBox', ctx)(stale);
    // If saveBox persists the older envelope, authority/legacy is lost.
    const after = sam.peekLegacy();
    assert.equal(after.wx, 2, 'surviving changed mirror reconciles this stale snapshot');
  });
}

{
  const { storage, flags, localStorage } = makeStorage();
  const ctx = loadWorld(localStorage);
  const sam = vm.runInContext('Samsara', ctx);
  check('chooseNaihe: authority write for legacy then failing meta slots write leaves bridge open with legacy present', () => {
    storage.clear();
    ctx.__villageDraft = null;
    ctx.__slotTarget = 0;
    ctx.testRoll = roll(ctx);
    vm.runInContext("newGame('桥2',testRoll,{id:'free'},'shusheng')", ctx);
    const s = vm.runInContext('Slots.read(0)', ctx);
    s.dead = true; s.ending = 'zuohua'; s.age = 80;
    sam.recordLife(s, 'zuohua', '旧卷');
    assert(sam.bridgeOpen());
    flags.failKey = true;
    flags.keyFailsLeft = 1; // writeLegacy succeeds, saveMeta's slots write fails
    sam.chooseNaihe('mem');
    flags.failKey = false;
    assert(sam.peekLegacy() && sam.peekLegacy().naihe, 'legacy was written');
    assert.equal(sam.bridgeOpen(), true, 'bridge still open because saveMeta slots write failed');
  });
}



{
  const { storage, localStorage } = makeStorage();
  const ctx = loadWorld(localStorage);
  const sam = vm.runInContext('Samsara', ctx);
  const Core = vm.runInContext('Core', ctx);

  check('FIXED comparison 14: sequential old-client changes survive returning to new client', () => {
    storage.clear();
    ctx.__villageDraft = null;
    ctx.__slotTarget = 0;
    ctx.testRoll = roll(ctx);
    vm.runInContext("newGame('先写信封',testRoll,{id:'free'},'shusheng')", ctx);
    const ended = vm.runInContext('Slots.read(0)', ctx);
    ended.dead = true; ended.ending = 'zuohua'; ended.age = 80;
    sam.recordLife(ended, 'zuohua', '旧卷');
    sam.chooseNaihe('none');
    // After first v144 life, authority and mirrors agree: lives=1, leftover naihe 'none' or consumed?
    // chooseNaihe('none') still writes a naihe legacy. Consume it like a completed reincarnation,
    // then record a later-life meta/legacy only on the mirrors, as a v143 client would.
    ctx.__slotTarget = 1;
    ctx.testRoll = roll(ctx);
    vm.runInContext("newGame('第二世',testRoll,{id:'free'},'shusheng')", ctx);
    const afterNew = boxOf(storage);
    const authMeta = JSON.parse(afterNew.creationEffects['moxian.meta']);
    assert.equal(authMeta.lives, 1);
    assert.strictEqual(afterNew.creationEffects['moxian.legacy'], null);
    // Simulate a later old-client session: it updates only the compatibility mirrors,
    // leaving the stale creationEffects field intact (old normalize/saveBox preserves unknown keys).
    const oldMeta = JSON.parse(storage.get('moxian.meta'));
    oldMeta.lives = 2;
    oldMeta.guide = 1;
    storage.set('moxian.meta', JSON.stringify(oldMeta));
    storage.set('moxian.legacy', JSON.stringify({ wx: 2, v: 1 }));
    assert.equal(JSON.parse(boxOf(storage).creationEffects['moxian.meta']).lives, 1);
    const re = freshModules(localStorage, ctx);
    assert.equal(re.Samsara.loadMeta().lives, 2, 'later mirror progress reconciled');
    assert.equal(re.Samsara.peekLegacy().wx, 2, 'newer legacy retained');
    assert(storage.has('moxian.legacy'));
    assert.equal(JSON.parse(storage.get('moxian.meta')).lives, 2);
  });
}

{
  const { storage, flags, localStorage } = makeStorage();
  const ctx = loadWorld(localStorage);
  const Core = vm.runInContext('Core', ctx);
  const Slots = vm.runInContext('Slots', ctx);

  check('FIXED comparison 15: failed adoption retains original and retry migrates safely', () => {
    storage.clear();
    const old = Core.newState('唯一旧卷', roll(ctx), null);
    storage.set('moxian.v1', JSON.stringify(old));
    flags.failKey = true;
    flags.keyFailsLeft = 0;
    const box = Slots.loadBox();
    assert.equal(box.slots[0] && box.slots[0].data && box.slots[0].data.name, '唯一旧卷', 'in-memory adopt still returns the character');
    assert(!storage.has('moxian.slots'), 'slots write was swallowed');
    assert.equal(storage.get('moxian.v1'), JSON.stringify(old), 'source bytes retained');
    flags.failKey = false;
    const re = freshModules(localStorage, ctx);
    assert.equal(re.Slots.read(0).name, '唯一旧卷');
    assert(!storage.has('moxian.v1'));
    assert(re.Slots.loadBox().slots.some(Boolean));
  });
}

console.log(passed.length + ' independent isolated storage checks passed.');
