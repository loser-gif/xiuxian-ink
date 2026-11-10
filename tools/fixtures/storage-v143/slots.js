/* 墨仙录 · 三卷存档。旧档 moxian.v1 首次读入时落入第一卷。 */
'use strict';
const Slots = (() => {
  const KEY = 'moxian.slots';
  const LEGACY = 'moxian.v1';
  const N = 3;

  function emptyBox() { return { v: 1, active: 0, slots: [null, null, null] }; }

  function summarize(s) {
    if (!s) return null;
    const R = (typeof REALMS !== 'undefined') ? REALMS[s.realm] : null;
    return {
      name: s.name || '无名',
      realm: s.realm | 0,
      stage: s.stage | 0,
      realmName: R ? (R.name + (R.stages[s.stage] || '')) : '',
      age: s.age | 0,
      played: s.played | 0,
      dead: !!s.dead,
      ascended: !!s.ascended,
      ending: s.ending || null,
      lg: s.lg && s.lg.name ? s.lg.name : '',
    };
  }

  function fmtPlayed(ms) {
    const m = Math.round((ms || 0) / 60000);
    const num = n => (typeof cn === 'function') ? cn(n) : String(n);
    if (m < 1) return '不足一分';
    if (m < 60) return num(m) + '分';
    const h = Math.floor(m / 60), rm = m % 60;
    return num(h) + '时' + (rm ? num(rm) + '分' : '');
  }

  function fmtDate(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }

  function saveBox(box) {
    try { localStorage.setItem(KEY, JSON.stringify(box)); } catch (e) {}
  }

  function normalize(box) {
    if (!box || typeof box !== 'object' || !Array.isArray(box.slots)) box = emptyBox();
    while (box.slots.length < N) box.slots.push(null);
    box.slots = box.slots.slice(0, N);
    box.active = Math.max(0, Math.min(N - 1, box.active | 0));
    box.v = 1;
    return box;
  }

  function adoptLegacy(box) {
    let raw = null;
    try { raw = localStorage.getItem(LEGACY); } catch (e) {}
    if (!raw) return box;
    try {
      const parsed = JSON.parse(raw);
      const s = (typeof Core !== 'undefined' && Core.migrate) ? Core.migrate(parsed) : parsed;
      if (s && s.name) {
        box.slots[0] = { at: Date.now(), sum: summarize(s), data: s };
        box.active = 0;
      }
    } catch (e) {}
    saveBox(box);
    try { localStorage.removeItem(LEGACY); } catch (e) {}
    return box;
  }

  function loadBox() {
    let box = null;
    try { box = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    if (!box) {
      box = emptyBox();
      adoptLegacy(box);
      if (!box.slots.some(Boolean)) saveBox(box);
      return box;
    }
    return normalize(box);
  }

  function pack(s) { return { at: Date.now(), sum: summarize(s), data: s }; }

  function migrateSlot(sl) {
    if (!sl || !sl.data) return null;
    let data = sl.data;
    try { data = JSON.parse(JSON.stringify(sl.data)); } catch (e) {}
    if (typeof Core !== 'undefined' && Core.migrate) data = Core.migrate(data);
    return data;
  }

  function setActive(i) {
    const box = loadBox();
    box.active = Math.max(0, Math.min(N - 1, i | 0));
    saveBox(box);
    return box.active;
  }

  function write(i, s) {
    const box = loadBox();
    i = Math.max(0, Math.min(N - 1, i | 0));
    box.slots[i] = s ? pack(s) : null;
    box.active = i;
    saveBox(box);
    try { localStorage.removeItem(LEGACY); } catch (e) {}
    return box;
  }

  function writeActive(s) {
    const box = loadBox();
    return write(box.active, s);
  }

  function read(i) {
    const box = loadBox();
    return migrateSlot(box.slots[Math.max(0, Math.min(N - 1, i | 0))]);
  }

  function readActive() {
    const box = loadBox();
    const s = migrateSlot(box.slots[box.active]);
    if (s && !s.dead && !s.ascended) return s;
    const alive = aliveIndex();
    if (alive < 0) return s;
    setActive(alive);
    return read(alive);
  }

  function clear(i) {
    const box = loadBox();
    box.slots[Math.max(0, Math.min(N - 1, i | 0))] = null;
    saveBox(box);
  }

  function firstEmpty() {
    const box = loadBox();
    const i = box.slots.findIndex(s => !s);
    return i;
  }

  function newestIndex() {
    const box = loadBox();
    let best = box.active, at = 0;
    box.slots.forEach((s, i) => { if (s && (s.at || 0) >= at) { at = s.at || 0; best = i; } });
    return best;
  }

  function aliveIndex() {
    const box = loadBox();
    let best = -1, at = -1;
    if (box.slots[box.active] && box.slots[box.active].data && !box.slots[box.active].sum.dead && !box.slots[box.active].sum.ascended) {
      return box.active;
    }
    box.slots.forEach((s, i) => {
      if (!s || !s.sum || s.sum.dead || s.sum.ascended) return;
      if ((s.at || 0) >= at) { at = s.at || 0; best = i; }
    });
    return best;
  }

  return {
    KEY, LEGACY, N,
    loadBox, saveBox, summarize, fmtPlayed, fmtDate,
    setActive, write, writeActive, read, readActive, clear,
    firstEmpty, newestIndex, aliveIndex, migrateSlot,
  };
})();
