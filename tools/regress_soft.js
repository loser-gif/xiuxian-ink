#!/usr/bin/env node
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const math = Object.create(Math); math.random = () => 0.5;
const ctx = vm.createContext({ console, Math: math, JSON, Object, Array, Number, String, TextEncoder, TextDecoder, Uint8Array, Map });
for (const f of ['data', 'gongfa', 'gear', 'path', 'story', 'sect', 'baijia', 'world', 'tianxia', 'karma', 'life', 'juan', 'core'])
  vm.runInContext(fs.readFileSync(path.join(root, 'js', f + '.js'), 'utf8'), ctx, { filename: f });
const { Core, Life, LINGGEN } = vm.runInContext('({Core, Life, LINGGEN})', ctx);
function fresh() {
  return Core.newState('听灯', { lg: LINGGEN.find(l => l.id === 'san'), els: ['金', '木', '火'], wx: 5, luck: 1, org: 'dx' });
}
function yearItems(s, y, title) {
  const row = Life.chronicle(s).years.find(x => x.y === y);
  return row ? row.items.filter(i => i.t === title) : [];
}

let s = fresh();
assert.equal(s.v, 16);
Life.note(s, { y: 20, t: '檐雨', d: '雨落在石阶上，一级一级，像有人用指节数你的呼吸。你没有', k: 'breath' });
Life.note(s, { y: 20, t: '檐雨', d: '雨落在石阶上，一级一级，像有人用指节数你的呼吸', k: 'breath' });
assert.equal(s.life.annals.filter(a => a.t === '檐雨').length, 1);
let rain = yearItems(s, 20, '檐雨');
assert.equal(rain.length, 1);
assert(rain[0].d.indexOf('雨落在石阶上') === 0);
assert(rain[0].d.indexOf('你没有') < 0);

s.life.annals.push({ y: 22, t: '门外一声', d: '门外有人唤了一声「师兄」，脚步却没有停。你应到一半', k: 'breath' });
s.life.annals.push({ y: 22, t: '门外一声', d: '门外有人唤了一声「师兄」，脚步却没有停', k: 'breath' });
s.marks = s.marks || [];
s.marks.push({ y: 22, t: '门外一声', d: '门外有人唤了一声「师兄」，脚步却没有停', c: 'breath' });
const door = yearItems(s, 22, '门外一声');
assert.equal(door.length, 1, 'marks and the short annals line must not add a second row');

Life.note(s, { y: 16, t: '此生所求', d: '念头通达', k: 'goal' });
Life.note(s, { y: 16, t: '此生所求', d: '你在心里写下一行很小的字：念头通达', k: 'gold' });
const goal = yearItems(s, 16, '此生所求');
assert.equal(goal.length, 1);
assert(goal[0].d.indexOf('很小的字') >= 0);

Life.note(s, { y: 30, t: '故人', d: '阿禾在山上', k: 'people' });
Life.note(s, { y: 30, t: '故人', d: '沈孤去了远方', k: 'people' });
assert.equal(yearItems(s, 30, '故人').length, 2);

const game = fs.readFileSync(path.join(root, 'js/game.js'), 'utf8');
const jhui = fs.readFileSync(path.join(root, 'js/jhui.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
assert(game.includes('上架一件（持有'));
assert(game.includes('已有铺面 · 休市中'));
assert(game.includes('此刻休市'));
assert(game.includes('本季营业'));
assert(!game.includes('铺子开着'));
assert(game.includes('先回应来人'));
assert(game.includes('这课来得晚了些'));
assert(game.includes("maybeGuide._n = 0"));
assert(jhui.includes('放弃本件'));
assert(!jhui.includes('可罢手离场'));
assert(html.includes("var EXPECT = 'moxian-v90'"));
assert(sw.includes("var CACHE = 'moxian-v90'"));
assert(!html.includes('moxian-v89'));
assert(!sw.includes('moxian-v89'));
assert(game.includes('sw.js?v=90'));
console.log('PASS: chronicle dedupe, listing copy, closed-shop wording, delayed morning lesson, auction abandon hint, cache v90');
