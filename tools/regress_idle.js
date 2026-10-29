#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = vm.createContext({ console, Math, JSON, Number, isFinite, Date, parseFloat, parseInt, globalThis: {} });
vm.runInContext(fs.readFileSync(path.join(root, 'js/idle.js'), 'utf8'), ctx, { filename: 'idle.js' });
const Idle = ctx.globalThis.Idle;
const M = Idle.math;
assert(Idle.KEY === 'moxian-idle-v1');

const idleSrc = fs.readFileSync(path.join(root, 'js/idle.js'), 'utf8');
assert(!idleSrc.includes('moxian.v1'));
assert(!idleSrc.includes('moxian.slots'));
assert(!idleSrc.includes('localStorage.getItem(\'moxian'));
assert(!/[^.\w]\?\./.test(idleSrc), 'no optional chaining');
assert(!idleSrc.includes('??'), 'no nullish');

const core = fs.readFileSync(path.join(root, 'js/core.js'), 'utf8');
assert(core.includes('const SAVE_V = 16'));

const brush = M.BUILDINGS[0];
assert.equal(M.costAt(brush, 0), 15);
assert.equal(M.costAt(brush, 1), Math.floor(15 * 1.15));
assert.equal(M.sumCost(brush, 0, 1), 15);

const s0 = M.fresh();
assert.equal(M.dps(s0), 0);
assert.equal(M.clickValue(s0, 0), 1);
assert.equal(M.tryBuy(s0, 'bld', 'brush', 1), 0);
assert.equal(s0.ink, 0);
assert.equal(s0.bld.brush || 0, 0);

s0.ink = 15;
assert.equal(M.tryBuy(s0, 'bld', 'brush', 1), 1);
assert.equal(s0.ink, 0);
assert.equal(s0.bld.brush, 1);
assert.ok(Math.abs(M.dps(s0) - 0.1) < 1e-9);

s0.xin.drip = 1;
assert.ok(Math.abs(M.dps(s0) - 0.12) < 1e-9);
s0.xin.drip = 0;
s0.seal = 1;
assert.ok(Math.abs(M.dps(s0) - 0.108) < 1e-9);
s0.seal = 0;
assert.ok(Math.abs(M.clickValue(s0, 5) - 1.5) < 1e-9);

assert.equal(M.needInk(0), 1e6);
assert.equal(M.needInk(1), 1e6 * 1.35);
assert.equal(M.needDps(0), 500);
assert.equal(M.sealGain(1e6), Math.floor(Math.pow(Math.log10(1e6 + 10), 2)));
assert.ok(M.sealGain(1e6) >= 1);

assert.equal(M.fmt(9999), '9999');
assert.equal(M.fmt(10000), '1万');
assert.equal(M.fmt(15000), '1.5万');
assert.equal(M.fmt(1e8), '1亿');
assert.equal(M.fmt(1e12), '1兆');
assert.equal(M.fmt(0.1), '0.1');

const away = M.fresh();
away.bld.brush = 10;
const long = M.accrue(away, 10 * 3600 * 1000, true);
const cap = M.fresh();
cap.bld.brush = 10;
const short = M.accrue(cap, 8 * 3600 * 1000, true);
assert.ok(Math.abs(long.gain - short.gain) < 1e-6, 'offline caps at 8h');
assert.equal(long.capped, true);
assert.ok(Math.abs(long.gain - 0.1 * 10 * 8 * 3600) < 1e-4);

const rich = M.fresh();
rich.ink = 1e9;
const bought = M.tryBuy(rich, 'bld', 'brush', 'max');
assert.ok(bought > 10);
assert.ok(rich.ink >= 0);
assert.ok(M.costAt(brush, rich.bld.brush) > rich.ink);

const life = M.fresh();
life.lifeInk = 1e6;
life.ink = 50;
life.bld.brush = 3;
life.xin.breath = 2;
const beforeSeal = life.seal;
const g = M.rebirth(life);
assert.equal(g, M.sealGain(1e6));
assert.equal(life.seal, beforeSeal + g);
assert.equal(life.lives, 1);
assert.equal(life.ink, 0);
assert.equal(life.lifeInk, 0);
assert.deepEqual(life.bld, {});
assert.deepEqual(life.xin, {});
assert.equal(M.canRebirth(life), false);

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
assert(html.includes('id="btn-idle"'));
assert(html.includes('墨童'));
assert(html.includes('js/idle.js?v=106'));
assert(html.includes('css/idle.css?v=106'));
assert(html.includes("var EXPECT = 'moxian-v106'"));
assert(sw.includes("var CACHE = 'moxian-v106'"));
assert(sw.includes('css/idle.css?v=106'));

function scoreBuy(state, cps) {
  let pick = null;
  let best = 0;
  const ink = state.ink;
  for (let i = 0; i < M.BUILDINGS.length; i++) {
    const def = M.BUILDINGS[i];
    if (!M.unlocked(state, def)) continue;
    const n = (state.bld[def.id] || 0);
    const cost = M.costAt(def, n);
    if (!(cost <= ink) || cost <= 0) continue;
    state.bld[def.id] = n + 1;
    const after = M.dps(state);
    state.bld[def.id] = n || 0;
    if (!state.bld[def.id]) delete state.bld[def.id];
    const gain = after - M.dps(state);
    const sc = gain / cost;
    if (sc > best) { best = sc; pick = { kind: 'bld', id: def.id }; }
  }
  for (let j = 0; j < M.HEARTS.length; j++) {
    const def = M.HEARTS[j];
    if (def.id === 'focus' || def.id === 'luck') continue;
    const lv = state.xin[def.id] || 0;
    if (lv >= def.cap) continue;
    const cost = M.heartCost(def, lv);
    if (!(cost <= ink) || cost <= 0) continue;
    let sc = 0;
    if (def.id === 'breath') {
      state.xin[def.id] = lv + 1;
      const a = M.clickValue(state, 3);
      state.xin[def.id] = lv;
      if (!lv) delete state.xin[def.id];
      sc = ((a - M.clickValue(state, 3)) * cps) / cost;
    } else {
      state.xin[def.id] = lv + 1;
      const a = M.dps(state);
      state.xin[def.id] = lv;
      if (!lv) delete state.xin[def.id];
      sc = (a - M.dps(state)) / cost;
    }
    if (sc > best) { best = sc; pick = { kind: 'xin', id: def.id }; }
  }
  return pick;
}

function sim(seconds, cps, combo) {
  const s = M.fresh();
  let c = 0;
  for (let t = 0; t < seconds; t++) {
    for (let i = 0; i < cps; i++) {
      c = combo ? Math.min(5, c + 1) : 0;
      M.addInk(s, M.clickValue(s, c));
    }
    M.addInk(s, M.dps(s));
    for (let n = 0; n < 24; n++) {
      const pick = scoreBuy(s, cps);
      if (!pick) break;
      if (!M.tryBuy(s, pick.kind, pick.id, 1)) break;
    }
    if (M.canRebirth(s)) return { t: t + 1, dps: M.dps(s), ink: s.lifeInk, why: s.lifeInk >= M.needInk(0) ? 'ink' : 'dps' };
  }
  return { t: -1, dps: M.dps(s), ink: s.lifeInk };
}

const active = sim(90 * 60, 3, true);
const calm = sim(120 * 60, 2, false);
console.log('active 3cps', active);
console.log('calm 2cps', calm);
assert(active.t > 8 * 60 && active.t < 55 * 60, 'active first rebirth should land near half an hour, got ' + active.t);
console.log('PASS idle');
