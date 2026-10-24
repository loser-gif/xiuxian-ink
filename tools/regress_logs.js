#!/usr/bin/env node
/* UI-only regression: run the production log renderer against a minimal DOM. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
class Element {
  constructor() { this.children = []; this.className = ''; this.textContent = ''; this.hidden = false; this.style = {}; this.parentElement = null; }
  get classList() {
    const el = this;
    return {
      contains: c => el.className.split(/\s+/).includes(c),
      add: c => { if (!el.classList.contains(c)) el.className += ' ' + c; },
      remove: c => { el.className = el.className.split(/\s+/).filter(x => x !== c).join(' '); },
      toggle: (c, yes) => { if (yes) el.classList.add(c); else el.classList.remove(c); },
    };
  }
  appendChild(el) { this.children.push(el); el.parentElement = this; }
  removeChild(el) { this.children.splice(this.children.indexOf(el), 1); }
  get firstChild() { return this.children[0]; }
  get previousElementSibling() {
    const siblings = this.parentElement ? this.parentElement.children : [];
    return siblings[siblings.indexOf(this) - 1] || null;
  }
  querySelector(sel) { return this.children.find(el => el.classList.contains(sel.slice(1))) || null; }
}
const log = new Element();
const entries = () => log.children.filter(el => el.classList.contains('entry'));
const document = { createElement: () => new Element(), querySelectorAll: () => entries() };
const source = fs.readFileSync(path.join(__dirname, '../js/game.js'), 'utf8');
const ctx = vm.createContext({ document, $: () => log, Ink: { brushSVG: () => '' }, voice: x => x,
  inkWrite: (el, s) => { el.textContent = s; return 0; }, syncColo: () => {}, setTimeout: f => f() });
vm.runInContext(source.slice(source.indexOf('function renderEntry('), source.indexOf('function syncColo(')), ctx);
const render = e => ctx.renderEntry(e, false);
const visible = () => entries().map(el => !el.querySelector('.entry-time').hidden);
const old = [{time:'A',text:'one'}, {time:'A',title:'two',text:'two',div:true}, {time:'B',text:'three'}, {time:'A',text:'four'}, {text:'old undated'}, {time:'A',text:'six'}, {time:'A',text:'seven'}];
const before = JSON.stringify(old);
old.forEach(render);
assert.deepStrictEqual(visible(), [true,false,true,true,false,true,false]);
assert.strictEqual(JSON.stringify(old), before, 'rendering must not mutate old saved logs');
assert(entries()[1].classList.contains('entry-cont'));
assert(entries()[0].classList.contains('entry-followed'));
assert(!entries()[3].classList.contains('entry-followed'), 'undated entry interrupts grouping');
assert(!entries()[4].classList.contains('entry-cont'));
assert.strictEqual(entries()[1].previousElementSibling.hidden, true, 'same-date divider is hidden');
log.removeChild(entries()[0]); ctx.syncLogTimes();
assert.strictEqual(entries()[0].previousElementSibling.hidden, false, 'first remaining divider is restored');
assert.strictEqual(visible()[0], true, 'first remaining date is restored');
// Reload beginning partway through a saved group must show its date.
log.children = []; old.slice(1, 3).forEach(render);
assert.deepStrictEqual(visible(), [true,true]);
assert.strictEqual(entries()[0].previousElementSibling, null, 'reload omits a divider before the first entry');
// Incremental appends and automatic trimming must promote the new first date.
log.children = [];
for (let i=0;i<90;i++) render({time:'A',text:String(i),div:i%2===0});
assert(log.children.length <= 80);
assert.strictEqual(visible()[0], true);
assert(visible().slice(1).every(v => !v));
entries().slice(1).forEach(el => {
  const prev = el.previousElementSibling;
  if (prev.classList.contains('entry-div')) assert.strictEqual(prev.hidden, true);
});
// Changed timestamps are never merged across another time, including after reload.
render({time:'B',text:'later',div:true}); render({time:'A',text:'return'});
assert.deepStrictEqual(visible().slice(-2), [true,true]);
assert.strictEqual(entries()[entries().length - 2].previousElementSibling.hidden, false, 'changed date retains divider');
log.children = [];
['十六岁 · 春', '十六岁 · 春', '十六岁 · 夏', '十七岁 · 春'].forEach(time => render({ time, text: time }));
assert.deepStrictEqual(visible(), [true, false, true, true]);
assert.strictEqual(entries()[0].querySelector('.entry-time').textContent, '十六岁 · 春');
assert.strictEqual(entries()[2].querySelector('.entry-time').textContent, '夏');
assert.strictEqual(entries()[2].querySelector('.entry-time')._full, '十六岁 · 夏');
assert.strictEqual(entries()[3].querySelector('.entry-time').textContent, '十七岁 · 春');
assert(entries()[2].classList.contains('entry-year'));
assert(!entries()[3].classList.contains('entry-year'));
assert.strictEqual(entries()[2].previousElementSibling.hidden, false, 'a new season keeps its divider');
console.log('PASS: consecutive grouping, unknown/changed dates, old-save immutability, reload, dividers and 80-node pruning');
