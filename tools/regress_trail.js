#!/usr/bin/env node
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..'), math = Object.create(Math); math.random = () => 0.5;
const ctx = vm.createContext({ console, Math: math, TextEncoder, TextDecoder, Uint8Array, btoa, atob });
for (const f of ['data', 'gongfa', 'gear', 'path', 'story', 'sect', 'baijia', 'world', 'tianxia', 'karma', 'life', 'juan', 'core', 'jianghu', 'loops', 'codec'])
  vm.runInContext(fs.readFileSync(path.join(root, 'js', f + '.js'), 'utf8'), ctx, { filename: f });
const { Core, Jianghu: J, Codec, LINGGEN, LOCS } = vm.runInContext('({Core, Jianghu, Codec, LINGGEN, LOCS})', ctx);
const json = x => JSON.parse(JSON.stringify(x));
const fresh = () => Core.newState('行路人', { lg: LINGGEN.find(l => l.id === 'san'), els: ['木', '水', '火'], wx: 6, luck: 1 });
let s = fresh(); assert.deepStrictEqual(json(s.trail), []);
// Missing legacy field must not invent history from discovered places or touch core progress.
delete s.trail; const before = json(s); s = Core.migrate(json(s));
assert.deepStrictEqual(json(s.trail), []);
for (const key of ['v', 'months', 'age', 'realm', 'stage', 'xw', 'ls', 'wx', 'xj', 'items', 'gf', 'gfs', 'path', 'log', 'lifespan', 'lifeBonus']) assert.deepStrictEqual(json(s[key]), before[key], key);
assert.equal(s.v, 14);
J.tick(s); assert.deepStrictEqual(json(s.trail), []);
let months = s.months, cost = J.travelMonths(s, 'shanmen');
J.travel(s, 'shanmen'); assert.equal(s.months - months, cost);
assert.deepStrictEqual(json(s.trail), [['qingshi', 'taohua'], ['taohua', 'shanmen']]);
J.travel(s, 'qingshi'); assert.equal(s.trail.length, 2);
J.travel(s, 'qingshi'); assert.equal(s.trail.length, 2);
J.travel(s, 'yunyue'); assert.equal(s.trail.length, 3);
const decoded = Codec.decode(Codec.encode(s)); assert(decoded.ok);
assert.deepStrictEqual(json(Core.migrate(decoded.data).trail), json(s.trail));
// Farther realms reveal map locations without leaving footprints.
s.realm = 4; Core.sync(s); J.tick(s); assert.equal(s.trail.length, 3);
// Repeated long journeys cannot grow the history beyond the fixed road graph.
s.lifeBonus = 100000; Core.sync(s);
for (let i = 0; i < 20; i++) J.travel(s, LOCS[i % 2 ? 0 : LOCS.length - 1].id);
assert.equal(s.trail.length, LOCS.length - 1);
// Interrupted journeys do not add successful-travel marks.
s = fresh(); s.months = s.lifespan * 12 - 1; Core.sync(s); J.travel(s, 'yunyue');
assert(s.dead); assert.deepStrictEqual(json(s.trail), []);
// Damaged optional history cannot break rendering; known valid segments survive.
s.trail = [null, {}, 'bad', ['unknown', 'taohua'], ['qingshi', 'shanmen'], ['qingshi', 'taohua'], ['taohua', 'qingshi']];
assert.deepStrictEqual(json(J.trailSegments(s)), [0]);
s.trail = 'bad'; assert.deepStrictEqual(json(Core.migrate(s).trail), []);
console.log('PASS: legacy defaults and progress, real travel, revisits, discovery, save-code round trip, bounded history, death, damaged history');
