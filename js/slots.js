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
    try {
      // A failed initial read must never authorize a blind replacement.
      localStorage.getItem(KEY);
      const encoded = JSON.stringify(box);
      localStorage.setItem(KEY, encoded);
      return localStorage.getItem(KEY) === encoded;
    } catch (e) { return false; }
  }

  function normalize(box) {
    if (!box || typeof box !== 'object' || !Array.isArray(box.slots)) box = emptyBox();
    while (box.slots.length < N) box.slots.push(null);
    box.slots = box.slots.slice(0, N);
    box.active = Math.max(0, Math.min(N - 1, box.active | 0));
    box.v = 1;
    return box;
  }

  function adoptLegacy(box, persist = true) {
    // Never remove the sole source until the exact destination bytes are readable.
    // A leftover source after failed removal cannot replace an existing slot box.
    if (box.slots.some(Boolean)) return box;
    try {
      const raw = localStorage.getItem(LEGACY);
      if (!raw) return box;
      const parsed = JSON.parse(raw);
      const s = (typeof Core !== 'undefined' && Core.migrate) ? Core.migrate(parsed) : parsed;
      if (!s || !s.name) return box;
      box.slots[0] = { at: Date.now(), sum: summarize(s), data: s };
      box.active = 0;
      if (!persist || !saveBox(box)) return box;
      localStorage.removeItem(LEGACY);
    } catch (e) { /* Keep the original bytes for recovery/retry. */ }
    return box;
  }

  function loadBox(forWrite = false) {
    let box = null;
    // An unreadable destination is not permission to migrate over it.
    try { box = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { if (forWrite) throw e; return emptyBox(); }
    if (!box) return adoptLegacy(emptyBox(), !forWrite);
    box = normalize(box);
    if (!flushEffects(box) && forWrite) throw Error('effect reconciliation unavailable');
    return box;
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
    let box;
    try { box = loadBox(true); } catch (e) { return null; }
    i = Math.max(0, Math.min(N - 1, i | 0));
    box.slots[i] = s ? pack(s) : null;
    box.active = i;
    if (!saveBox(box)) return null;
    try { localStorage.removeItem(LEGACY); } catch (e) {}
    return box;
  }

  // Current authority plus the last observed compatibility-mirror baseline.
  // v143 preserves unknown envelope fields, but writes only the two mirror keys.
  const EFFECT_KEYS = ['moxian.meta', 'moxian.legacy'];
  function mirrorValues() {
    const values = {};
    EFFECT_KEYS.forEach(k => { values[k] = localStorage.getItem(k); });
    return values;
  }
  function effectBox() {
    const raw = localStorage.getItem(KEY);
    return raw ? normalize(JSON.parse(raw)) : null;
  }
  function metaValue(raw) {
    try { return JSON.parse(raw) || {}; } catch (e) { return {}; }
  }
  function flushEffects(box) {
    if (!box || !box.creationEffects) return true;
    try {
      const observed = mirrorValues();
      const effects = Object.assign({}, box.creationEffects);
      const baseline = box.effectMirrors;
      const oldMeta = metaValue(effects['moxian.meta']);
      const mirrorMeta = metaValue(observed['moxian.meta']);
      // A later completed life can produce byte-identical legacy. An open bridge
      // alone does not prove that an old, failed-removal legacy was replaced.
      const laterLife = (mirrorMeta.lives | 0) > (oldMeta.lives | 0);
      const before = oldMeta.bridge, after = mirrorMeta.bridge;
      const sameLifeClosed = (mirrorMeta.lives | 0) === (oldMeta.lives | 0) &&
        before && before.open && after && before.lives === after.lives &&
        after.lives === mirrorMeta.lives;
      const leg = metaValue(observed['moxian.legacy']);
      // dismissBridge('ascend') creates no legacy. A choice must match its payload.
      // Persist the closed bridge with the legacy so this evidence is used once.
      const freshMeta = !baseline || observed['moxian.meta'] !== baseline['moxian.meta'];
      const laterChoice = freshMeta && (laterLife || sameLifeClosed) && after && !after.open &&
        ['none', 'mem', 'page', 'bond'].includes(after.chosen) &&
        leg.naihe && leg.kind === after.chosen;
      let changed = false;
      EFFECT_KEYS.forEach(k => {
        const value = observed[k];
        const external = baseline && Object.prototype.hasOwnProperty.call(baseline, k)
          ? value !== baseline[k] && value !== effects[k]
          : k === 'moxian.meta' && laterLife;
        if (external || laterChoice) {
          effects[k] = value;
          changed = true;
        }
      });
      // Persist reconciliation before touching mirrors. On failure leave them intact.
      if (changed || !baseline) {
        const reconciled = Object.assign({}, box, {creationEffects: effects, effectMirrors: observed});
        if (!saveBox(reconciled)) return false;
        box.creationEffects = effects;
        box.effectMirrors = observed;
      }
      const ack = Object.assign({}, box.effectMirrors);
      EFFECT_KEYS.forEach(k => {
        try {
          const value = effects[k];
          if (observed[k] !== value) {
            if (value === null) localStorage.removeItem(k);
            else localStorage.setItem(k, value);
          }
          if (localStorage.getItem(k) === value) ack[k] = value;
        } catch (e) { /* Unacknowledged baseline stays durable across reload. */ }
      });
      if (JSON.stringify(ack) !== JSON.stringify(box.effectMirrors)) {
        // Cleanup acknowledgement is retryable; authority was already reconciled.
        // A failed ack must not turn a trustworthy effect read into a failure.
        try {
          localStorage.setItem(KEY, JSON.stringify(Object.assign({}, box, {effectMirrors: ack})));
          box.effectMirrors = ack;
        } catch (e) { /* Keep the durable baseline for the next cleanup attempt. */ }
      }
    } catch (e) { return false; /* Retain authority and retry later. */ }
    return true;
  }
  function readEffect(k) {
    const box = effectBox();
    if (box && box.creationEffects && Object.prototype.hasOwnProperty.call(box.creationEffects, k)) {
      if (!flushEffects(box)) throw Error('effect reconciliation unavailable');
      return box.creationEffects[k];
    }
    return localStorage.getItem(k);
  }
  function writeEffect(k, value) {
    const box = effectBox();
    if (box && box.creationEffects) {
      if (!flushEffects(box)) throw Error('effect reconciliation unavailable');
      box.effectMirrors = mirrorValues();
      box.creationEffects[k] = value;
      if (!saveBox(box)) throw Error('effect persistence unavailable');
      flushEffects(box);
    } else if (value === null) localStorage.removeItem(k);
    else localStorage.setItem(k, value);
  }

  // Creation trusts a normal Web Storage setItem return as the commit boundary.
  // Readback is diagnostic here; verified source cleanup still uses saveBox.
  function createEmpty(i, s, effects) {
    try {
      const raw = localStorage.getItem(KEY);
      const box = normalize(raw ? JSON.parse(raw) : emptyBox());
      if (!raw && localStorage.getItem(LEGACY)) return {ok:false,err:'旧卷尚待整理，请先续卷'};
      if (i == null) i = box.slots.findIndex(slot => !slot);
      if (!Number.isInteger(i) || i < 0 || i >= N || box.slots[i]) return {ok:false,err:'空卷已变动，请返回卷首重选'};
      box.slots[i] = pack(s); box.active = i;
      if (effects) { box.creationEffects = effects; box.effectMirrors = mirrorValues(); }
      const encoded = JSON.stringify(box);
      localStorage.setItem(KEY, encoded);
      let uncertain = false, readUnavailable = false;
      try { uncertain = localStorage.getItem(KEY) !== encoded; }
      catch (e) { readUnavailable = true; }
      return {ok:true,index:i,uncertain,readUnavailable};
    } catch (e) { return {ok:false,err:'存档未写入，请检查储存空间后重试'}; }
  }

  function writeActive(s) {
    try { return write(loadBox(true).active, s); } catch (e) { return null; }
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
    KEY, LEGACY, N, createEmpty, readEffect, writeEffect,
    loadBox, saveBox, summarize, fmtPlayed, fmtDate,
    setActive, write, writeActive, read, readActive, clear,
    firstEmpty, newestIndex, aliveIndex, migrateSlot,
  };
})();
