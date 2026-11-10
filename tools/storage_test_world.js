#!/usr/bin/env node
/* Shared isolated storage/DOM adapter for production-function regression tests.
   No browser layout/audio assertions. Real data/Core/Slots/Samsara are loaded. */
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

function loadWorld(localStorage, old = false, noSamsara = false) {
  const elements = new Map();
  function element(key) {
    if (!elements.has(key)) elements.set(key, {
      value: '', hidden: true, disabled: false, textContent: '', dataset: {},
      style: { setProperty() {}, opacity: 0 }, classList: { add() {}, remove() {}, toggle() {} },
      setAttribute() {}, addEventListener() {}, querySelector: q => element(key + ' ' + q),
      querySelectorAll: () => [], children: [], appendChild(e) { this.children.push(e); },
      remove() { this.removed = true; }, focus() {}, blur() {},
      set innerHTML(v) { this.html = v; this.children = []; }, get innerHTML() { return this.html || ''; }
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
    console: {log:console.log, error(){}}, Math, Date, JSON, Promise, Uint32Array, Uint8Array, TextEncoder, TextDecoder, btoa, atob,
    crypto: { getRandomValues(a) { a[0] = 0; return a; } },
    localStorage, document, setTimeout: () => 0, clearTimeout() {}, window: null, globalThis: null
  };
  sandbox.window = sandbox; sandbox.globalThis = sandbox;
  const ctx = vm.createContext(sandbox);
  const files = ['data','gongfa','gear','path','story','sect','baijia','world','tianxia','karma','life','juan','core','loops','jianghu','redworld','folio','people','mingge','village','slots','codec','samsara'];
  for (const f of files) {
    if (noSamsara && f === "samsara") continue;
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

module.exports = {loadWorld, makeStorage, roll, vm, ROOT};
