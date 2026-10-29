/* 墨仙录 · 墨童闲录
   卷首附加的纸上挂机。存档只写 moxian-idle-v1，不读不写正传三卷，不动 SAVE_V。 */
'use strict';
const Idle = (() => {
  const KEY = 'moxian-idle-v1';
  const AWAY_CAP = 8 * 3600 * 1000;
  const BUILDINGS = [
    { id: 'brush', name: '秃笔', base: 15, r: 1.15, prod: 0.1 },
    { id: 'inkstone', name: '歙砚', base: 100, r: 1.15, prod: 1, prev: 'brush', prevName: '秃笔', orInk: 50 },
    { id: 'pine', name: '松烟', base: 1100, r: 1.14, prod: 8, prev: 'inkstone', prevName: '歙砚' },
    { id: 'paper', name: '宣纸匣', base: 12000, r: 1.13, prod: 47, prev: 'pine', prevName: '松烟' },
    { id: 'crane', name: '纸鹤', base: 130000, r: 1.13, prod: 260, prev: 'paper', prevName: '宣纸匣' },
    { id: 'boy', name: '书童', base: 1400000, r: 1.12, prod: 1400, prev: 'crane', prevName: '纸鹤' },
    { id: 'pavilion', name: '墨阁', base: 20000000, r: 1.12, prod: 7800, prev: 'boy', prevName: '书童' },
    { id: 'lake', name: '墨池', base: 3.3e8, r: 1.11, prod: 4.4e4, prev: 'pavilion', prevName: '墨阁' },
    { id: 'mountain', name: '墨山', base: 5.1e9, r: 1.11, prod: 2.6e5, prev: 'lake', prevName: '墨池' },
    { id: 'void', name: '纸外虚空', base: 7.8e10, r: 1.10, prod: 1.5e6, prev: 'mountain', prevName: '墨山', needSeal: 1 }
  ];
  const HEARTS = [
    { id: 'breath', name: '吐纳', desc: '点墨每层一倍半', base: 50, r: 2, cap: 25 },
    { id: 'drip', name: '滴墨', desc: '墨息每层一倍二', base: 500, r: 2.2, cap: 25 },
    { id: 'focus', name: '凝神', desc: '离纸时每层多一成，至多加倍', base: 2000, r: 2.5, cap: 10 },
    { id: 'luck', name: '沾光', desc: '机缘来得勤些', base: 10000, r: 3, cap: 25 }
  ];
  const ORNS = [
    { need: 5, name: '发丝' },
    { need: 10, name: '衣褶' },
    { need: 15, name: '袖口' },
    { need: 20, name: '松针' },
    { need: 25, name: '鹤痕' },
    { need: 30, name: '印点' },
    { need: 35, name: '薄雾' },
    { need: 40, name: '山隙' },
    { need: 45, name: '纸斑' },
    { need: 50, name: '朱屑' }
  ];
  const FATES = [
    { id: 'eaves', title: '檐滴', text: '檐上落了一滴，正好掉进砚里。', btn: '收墨', kind: 'prod', mult: 2, sec: 30 },
    { id: 'pool', title: '砚洼', text: '砚底还有一洼，刮一刮。', btn: '收墨', kind: 'ink', sec: 45 },
    { id: 'walk', title: '笔自走', text: '笔杆自己滚了半寸，像还想写。', btn: '任其走', kind: 'auto', sec: 8 },
    { id: 'damp', title: '纸潮', text: '纸边潮了一线，墨走得开些。', btn: '收墨', kind: 'prod', mult: 2, sec: 30 },
    { id: 'nap', title: '打盹', text: '墨童闭了一下眼。醒来时，纸上多了一点。', btn: '随它', kind: 'clickink', times: 30 },
    { id: 'soot', title: '松烟', text: '松烟落在袖上，拍也拍不净。', btn: '拈来', kind: 'clickink', times: 40 },
    { id: 'crane', title: '鹤影', text: '纸上过了一道影子，不像鸟，也不像云。', btn: '留影', kind: 'prod', mult: 1.5, sec: 45 },
    { id: 'deep', title: '空处', text: '空白的地方忽然深了一寸。', btn: '接住', kind: 'ink', sec: 70 },
    { id: 'dry', title: '干角', text: '角上的墨干了。干的也能揭下来。', btn: '揭下', kind: 'ink', sec: 20 },
    { id: 'cough', title: '窗外', text: '窗外有人咳了一声，没进来。', btn: '点头', kind: 'clickink', times: 12 },
    { id: 'slant', title: '偏锋', text: '这一笔偏了，偏处反而黑。', btn: '顺着', kind: 'click', mult: 2, sec: 20 },
    { id: 'warm', title: '余温', text: '纸还温着，像方才有人写过。', btn: '拢一拢', kind: 'ink', sec: 90 }
  ];
  const CN = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

  function fresh() {
    return {
      v: 1,
      ink: 0,
      lifeInk: 0,
      allInk: 0,
      bld: {},
      xin: {},
      seal: 0,
      lives: 0,
      clicks: 0,
      buy: 1,
      last: 0,
      born: 0,
      fateAt: 0,
      milestones: {},
      buff: null,
      tripleAt: 0,
      tab: 'bld'
    };
  }

  function num(v) {
    const n = typeof v === 'number' ? v : parseFloat(v);
    return isFinite(n) ? n : 0;
  }

  function findBld(id) {
    for (let i = 0; i < BUILDINGS.length; i++) if (BUILDINGS[i].id === id) return BUILDINGS[i];
    return null;
  }
  function findHeart(id) {
    for (let i = 0; i < HEARTS.length; i++) if (HEARTS[i].id === id) return HEARTS[i];
    return null;
  }

  function costAt(def, n) {
    const c = Math.floor(def.base * Math.pow(def.r, n));
    if (!isFinite(c) || c < 1) return Infinity;
    return c;
  }

  function sumCost(def, n, k) {
    if (!(k > 0)) return 0;
    if (k <= 160) {
      let s = 0;
      for (let i = 0; i < k; i++) {
        const c = costAt(def, n + i);
        if (!isFinite(c)) return Infinity;
        s += c;
        if (!isFinite(s)) return Infinity;
      }
      return s;
    }
    const first = def.base * Math.pow(def.r, n);
    if (!isFinite(first)) return Infinity;
    const sum = first * (Math.pow(def.r, k) - 1) / (def.r - 1);
    if (!isFinite(sum)) return Infinity;
    return Math.floor(sum);
  }

  function maxBuy(def, n, ink) {
    if (!(ink > 0) || costAt(def, n) > ink) return 0;
    let lo = 1;
    let hi = 2;
    while (hi < 4000 && sumCost(def, n, hi) <= ink) {
      lo = hi;
      hi *= 2;
    }
    if (hi > 4000) hi = 4000;
    let ans = lo;
    let a = lo;
    let b = hi;
    while (a <= b) {
      const mid = Math.floor((a + b) / 2);
      if (sumCost(def, n, mid) <= ink) { ans = mid; a = mid + 1; }
      else b = mid - 1;
    }
    return ans;
  }

  function heartCost(def, n) {
    const c = Math.floor(def.base * Math.pow(def.r, n));
    if (!isFinite(c) || c < 1) return Infinity;
    return c;
  }

  function sealProdBonus(seals) {
    const rates = [0.08, 0.04, 0.02, 0.01];
    let left = seals > 0 ? seals : 0;
    let b = 0;
    for (let i = 0; i < rates.length; i++) {
      const take = left > 20 ? 20 : left;
      b += take * rates[i];
      left -= take;
      if (left <= 0) return b;
    }
    b += left * 0.005;
    return b;
  }

  function prodMult(state) {
    const lv = (state.xin && state.xin.drip) || 0;
    let m = Math.pow(1.2, lv) * (1 + sealProdBonus(state.seal || 0));
    if (state.buff && state.buff.kind === 'prod') m *= state.buff.mult || 1;
    return m;
  }

  function dps(state) {
    let base = 0;
    const bld = state.bld || {};
    for (let i = 0; i < BUILDINGS.length; i++) {
      const n = bld[BUILDINGS[i].id] || 0;
      if (n > 0) base += BUILDINGS[i].prod * n;
    }
    return base * prodMult(state);
  }

  function clickValue(state, combo) {
    const lv = (state.xin && state.xin.breath) || 0;
    const c = combo > 0 ? combo : 0;
    const comboMult = 1 + Math.min(0.5, c * 0.1);
    let m = Math.pow(1.5, lv) * (1 + 0.05 * (state.seal || 0)) * comboMult;
    if (state.buff && state.buff.kind === 'click') m *= state.buff.mult || 1;
    return m;
  }

  function offlineFactor(state) {
    const lv = (state.xin && state.xin.focus) || 0;
    const bonus = lv * 0.1;
    return 1 + (bonus > 1 ? 1 : bonus);
  }

  function needInk(lives) { return 1e6 * Math.pow(1.35, lives || 0); }
  function needDps(lives) { return 500 * Math.pow(1.35, lives || 0); }

  function canRebirth(state) {
    return (state.lifeInk || 0) >= needInk(state.lives) || dps(state) >= needDps(state.lives);
  }

  function sealGain(lifeInk) {
    const x = Math.log10((lifeInk || 0) + 10);
    const v = Math.floor(x * x);
    if (!isFinite(v) || v < 1) return 1;
    return v;
  }

  function unlocked(state, def) {
    if (def.id === 'inkstone') {
      if ((state.bld && state.bld.brush) >= 1) return true;
      if ((state.ink || 0) >= 50 || (state.lifeInk || 0) >= 50) return true;
      return false;
    }
    if (def.needSeal && (state.seal || 0) < def.needSeal) return false;
    if (def.prev && ((state.bld && state.bld[def.prev]) || 0) < 1) return false;
    return true;
  }

  function lockText(def) {
    if (def.id === 'inkstone') return '秃笔一管，或墨气及五十';
    if (def.needSeal) return (def.prevName || '前一项') + '之后，且已有道印';
    return (def.prevName || '前一项') + '之后';
  }

  function addInk(state, g) {
    if (!(g > 0) || !isFinite(g)) return;
    state.ink += g;
    state.lifeInk += g;
    state.allInk = (state.allInk || 0) + g;
  }

  function awayMs(dt) {
    if (!(dt > 0)) return 0;
    return dt > AWAY_CAP ? AWAY_CAP : dt;
  }

  function accrue(state, ms, away) {
    const use = away ? awayMs(ms) : (ms > 0 ? ms : 0);
    const capped = !!(away && ms > AWAY_CAP);
    if (!(use > 0)) return { gain: 0, capped: capped, sec: 0 };
    const held = state.buff;
    if (away && held && held.kind === 'prod') state.buff = null;
    const factor = away ? offlineFactor(state) : 1;
    const g = dps(state) * (use / 1000) * factor;
    if (away && held && held.kind === 'prod') state.buff = held;
    addInk(state, g);
    return { gain: g, capped: capped, sec: use / 1000 };
  }

  function tryBuy(state, kind, id, qty) {
    if (kind === 'xin') {
      const def = findHeart(id);
      if (!def) return 0;
      state.xin = state.xin || {};
      const lv = state.xin[id] || 0;
      if (lv >= def.cap) return 0;
      const c = heartCost(def, lv);
      if (!(c <= state.ink)) return 0;
      state.ink -= c;
      state.xin[id] = lv + 1;
      return 1;
    }
    const def = findBld(id);
    if (!def || !unlocked(state, def)) return 0;
    state.bld = state.bld || {};
    const n = state.bld[id] || 0;
    const room = qty === 'max' ? maxBuy(def, n, state.ink) : maxBuy(def, n, state.ink);
    let want = qty === 'max' ? room : qty;
    if (want > room) want = room;
    if (!(want > 0)) return 0;
    const c = sumCost(def, n, want);
    if (!(c <= state.ink)) return 0;
    state.ink -= c;
    state.bld[id] = n + want;
    return want;
  }

  function rebirth(state) {
    const g = sealGain(state.lifeInk);
    state.seal = (state.seal || 0) + g;
    state.lives = (state.lives || 0) + 1;
    state.ink = 0;
    state.lifeInk = 0;
    state.bld = {};
    state.xin = {};
    state.clicks = 0;
    state.buff = null;
    state.tripleAt = 0;
    state.milestones = {};
    state.fateAt = 0;
    return g;
  }

  function trimNum(v) {
    const r = Math.round(v * 10) / 10;
    if (Math.abs(r - Math.round(r)) < 1e-6) return String(Math.round(r));
    return r.toFixed(1);
  }

  function fmt(n) {
    if (n == null || !isFinite(n)) return '一重墨海';
    const neg = n < 0;
    let v = Math.abs(n);
    const sign = neg ? '-' : '';
    if (v < 10000) {
      if (v < 100) return sign + trimNum(v);
      return sign + String(Math.round(v));
    }
    const units = ['', '万', '亿', '兆', '京', '垓', '秭', '穰', '沟', '涧', '正', '载'];
    const heavens = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    let k = 0;
    while (v >= 10000 && k < units.length - 1) { v /= 10000; k += 1; }
    if (v < 10000) return sign + trimNum(v) + units[k];
    let h = 0;
    while (v >= 10000 && h < heavens.length) { v /= 10000; h += 1; }
    if (h > 0 && v < 10000) return sign + trimNum(v) + heavens[h - 1];
    const exp = Math.floor(Math.log10(Math.abs(n)));
    const mant = Math.abs(n) / Math.pow(10, exp);
    return sign + trimNum(mant) + '×10^' + exp;
  }

  function lifeName(lives) {
    const n = (lives || 0) + 1;
    if (n <= 10) return '第' + CN[n] + '世';
    if (n < 20) return '第十' + CN[n - 10] + '世';
    return '第' + n + '世';
  }

  function ornCount(seal) {
    let c = 0;
    for (let i = 0; i < ORNS.length; i++) if ((seal || 0) >= ORNS[i].need) c += 1;
    return c;
  }

  function goalText(state) {
    const bld = state.bld || {};
    if ((state.lives || 0) === 0 && (bld.pavilion || 0) < 1) return '本世可往墨阁';
    if ((state.seal || 0) < 5) return '道印满五，纸上多一笔';
    if ((state.seal || 0) < 10) return '十印，可试一念三墨';
    if ((state.seal || 0) >= 1 && (bld.mountain || 0) >= 1 && (bld.void || 0) < 1) return '纸外尚有一处';
    return '';
  }

  function tripleCd(state) {
    const s = state.seal || 0;
    if (s >= 50) return 6000;
    if (s >= 25) return 8000;
    return 12000;
  }

  const math = {
    KEY: KEY, AWAY_CAP: AWAY_CAP, BUILDINGS: BUILDINGS, HEARTS: HEARTS, FATES: FATES,
    fresh: fresh, costAt: costAt, sumCost: sumCost, maxBuy: maxBuy, heartCost: heartCost,
    dps: dps, clickValue: clickValue, prodMult: prodMult, sealProdBonus: sealProdBonus,
    offlineFactor: offlineFactor, needInk: needInk, needDps: needDps, canRebirth: canRebirth,
    sealGain: sealGain, unlocked: unlocked, addInk: addInk, accrue: accrue, awayMs: awayMs,
    tryBuy: tryBuy, rebirth: rebirth, fmt: fmt, lifeName: lifeName
  };

  let state = null;
  let on = false;
  let raf = 0;
  let combo = 0;
  let comboAt = 0;
  let lastSig = '';
  let slipKind = '';
  let root = null;
  let built = false;
  let saveAcc = 0;
  let noteText = '';
  let noteUntil = 0;

  function thin() {
    if (typeof document === 'undefined') return false;
    const d = document.documentElement.dataset;
    if (d.motion === 'lite' || d.fx === 'thin') return true;
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function save() {
    if (!state) return;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function load() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { raw = null; }
    const s = fresh();
    if (!raw) return s;
    let o = null;
    try { o = JSON.parse(raw); } catch (e2) { return s; }
    if (!o || typeof o !== 'object') return s;
    s.ink = num(o.ink);
    s.lifeInk = num(o.lifeInk);
    s.allInk = num(o.allInk);
    s.seal = Math.max(0, Math.floor(num(o.seal)));
    s.lives = Math.max(0, Math.floor(num(o.lives)));
    s.clicks = Math.max(0, Math.floor(num(o.clicks)));
    s.buy = o.buy === 0 || o.buy === 10 || o.buy === 100 ? o.buy : 1;
    s.last = num(o.last);
    s.born = num(o.born);
    s.fateAt = num(o.fateAt);
    s.tripleAt = num(o.tripleAt);
    s.tab = o.tab === 'xin' ? 'xin' : 'bld';
    s.bld = {};
    s.xin = {};
    s.milestones = {};
    if (o.bld && typeof o.bld === 'object') {
      for (let i = 0; i < BUILDINGS.length; i++) {
        const id = BUILDINGS[i].id;
        const n = Math.floor(num(o.bld[id]));
        if (n > 0) s.bld[id] = n;
      }
    }
    if (o.xin && typeof o.xin === 'object') {
      for (let j = 0; j < HEARTS.length; j++) {
        const hid = HEARTS[j].id;
        const lv = Math.floor(num(o.xin[hid]));
        if (lv > 0) s.xin[hid] = lv > HEARTS[j].cap ? HEARTS[j].cap : lv;
      }
    }
    if (o.milestones && typeof o.milestones === 'object') {
      s.milestones.a = o.milestones.a ? 1 : 0;
      s.milestones.b = o.milestones.b ? 1 : 0;
      s.milestones.c = o.milestones.c ? 1 : 0;
    }
    if (o.buff && typeof o.buff === 'object' && o.buff.kind) {
      const until = num(o.buff.until);
      if (until > Date.now()) {
        s.buff = { kind: o.buff.kind, mult: num(o.buff.mult) || 1, until: until, acc: 0 };
      }
    }
    return s;
  }

  function scheduleFate(now) {
    const lv = (state.xin && state.xin.luck) || 0;
    const base = 90000 + Math.random() * 90000;
    const div = 1 + lv * 0.12;
    state.fateAt = now + Math.max(28000, Math.floor(base / div));
  }

  function boySvg() {
    return '<svg class="idle-svg" viewBox="0 0 240 280" aria-hidden="true">' +
      '<g class="idle-fig">' +
      '<path class="ink-body" fill="currentColor" d="M122 128c28-6 48 16 42 42-6 28-32 46-58 40-28-6-40-34-32-58 6-18 24-28 48-24z"/>' +
      '<path fill="currentColor" opacity=".2" d="M146 146c16 6 14 26-2 32-14 6-26-6-24-18 2-10 14-18 26-14z"/>' +
      '<circle fill="currentColor" opacity=".45" cx="172" cy="196" r="3.4"/>' +
      '<circle fill="currentColor" opacity=".28" cx="74" cy="168" r="1.7"/>' +
      '<path class="ink-hair" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" d="M98 146c-14-6-22-18-16-28"/>' +
      '<path class="ink-fold" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity=".65" d="M112 196c4 16 10 28 8 40"/>' +
      '<ellipse class="hole" cx="126" cy="158" rx="2.1" ry="1.15" transform="rotate(-16 126 158)"/>' +
      '<circle class="hole" cx="114" cy="172" r=".95"/>' +
      '<path data-need="5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="M124 116c8-12 18-8 14 4"/>' +
      '<path data-need="10" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" opacity=".7" d="M98 176c10 7 18 8 28 4"/>' +
      '<path data-need="15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M94 156c-10 8-12 18-6 24"/>' +
      '<path data-need="20" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" d="M142 148c10-2 12 6 6 10"/>' +
      '<path data-need="25" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" d="M88 146c8-10 12-8 12 2"/>' +
      '<circle data-need="30" cx="120" cy="172" r="1.5" fill="currentColor"/>' +
      '<path data-need="35" fill="none" stroke="currentColor" stroke-width="1" opacity=".4" d="M84 186c18 10 48 8 66-4"/>' +
      '<path data-need="40" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" d="M106 112l7 9 9-7"/>' +
      '<g data-need="45" fill="currentColor" opacity=".5"><circle cx="150" cy="176" r="1.15"/><circle cx="90" cy="168" r=".85"/></g>' +
      '<circle data-need="50" class="zhu-dot" cx="136" cy="166" r="1.9"/>' +
      '</g></svg>';
  }

  function ensure() {
    root = document.getElementById('idle');
    if (!root || built) return;
    built = true;
    root.innerHTML =
      '<div class="idle-wrap">' +
        '<i class="idle-mark" aria-hidden="true">闲</i>' +
        '<header class="idle-hero">' +
          '<button type="button" class="idle-boy" id="idle-boy" aria-label="点墨">' + boySvg() + '</button>' +
          '<div class="idle-read">' +
            '<p class="idle-count"><b id="idle-ink">0</b><span>墨气</span></p>' +
            '<p class="idle-dps" id="idle-dps">墨息 0</p>' +
            '<p class="idle-meta" id="idle-meta"></p>' +
            '<p class="idle-buff" id="idle-buff" hidden></p>' +
            '<p class="idle-goal" id="idle-goal"></p>' +
          '</div>' +
        '</header>' +
        '<div class="idle-tabs" role="tablist">' +
          '<button type="button" class="idle-tab" data-tab="bld">置办</button>' +
          '<button type="button" class="idle-tab" data-tab="xin">心法</button>' +
        '</div>' +
        '<div class="idle-main">' +
          '<section class="idle-col idle-col-bld" id="idle-col-bld">' +
            '<h2>置办</h2>' +
            '<div class="idle-modes" id="idle-modes">' +
              '<button type="button" data-buy="1">一</button>' +
              '<button type="button" data-buy="10">十</button>' +
              '<button type="button" data-buy="100">百</button>' +
              '<button type="button" data-buy="0">最大</button>' +
            '</div>' +
            '<div id="idle-bld-list"></div>' +
          '</section>' +
          '<section class="idle-col idle-col-xin" id="idle-col-xin">' +
            '<h2>心法</h2>' +
            '<p class="idle-col-note">本世有效。再落一墨后收回。</p>' +
            '<div id="idle-xin-list"></div>' +
          '</section>' +
        '</div>' +
        '<p class="idle-hint" id="idle-hint"></p>' +
        '<footer class="idle-dock">' +
          '<button type="button" class="brush-btn small light" id="idle-close"><span class="bb-ink"></span><span class="bb-text">收卷</span></button>' +
          '<button type="button" class="brush-btn idle-tap" id="idle-tap"><span class="bb-ink"></span><span class="bb-text">点墨</span><small id="idle-tap-sub">以指</small></button>' +
          '<button type="button" class="brush-btn small light" id="idle-re"><span class="bb-ink"></span><span class="bb-text">再落一墨</span></button>' +
        '</footer>' +
      '</div>' +
      '<div class="idle-fx" id="idle-fx"></div>' +
      '<div class="idle-shade" id="idle-shade" hidden></div>' +
      '<div class="idle-slip" id="idle-slip" hidden role="dialog" aria-modal="true">' +
        '<i class="idle-slip-mark" aria-hidden="true">闲</i>' +
        '<h3 id="idle-slip-title"></h3>' +
        '<p id="idle-slip-text"></p>' +
        '<p class="idle-slip-sub" id="idle-slip-sub" hidden></p>' +
        '<div class="idle-slip-actions">' +
          '<button type="button" class="brush-btn small light" id="idle-slip-ok"><span class="bb-ink"></span><span class="bb-text" id="idle-slip-ok-t">收墨</span></button>' +
          '<button type="button" class="idle-slip-alt" id="idle-slip-alt" hidden>再坐一会</button>' +
        '</div>' +
      '</div>' +
      '<div class="idle-stamp" id="idle-stamp" hidden aria-hidden="true"><b>印</b></div>';

    document.getElementById('idle-boy').onclick = function (e) { tap(e); };
    document.getElementById('idle-tap').onclick = function (e) { tap(e); };
    document.getElementById('idle-close').onclick = function () { close(); };
    document.getElementById('idle-re').onclick = function () { askRebirth(); };
    document.getElementById('idle-slip-ok').onclick = function () { confirmSlip(); };
    document.getElementById('idle-slip-alt').onclick = function () { dismissSlip(); };
    document.getElementById('idle-shade').onclick = function () {
      if (slipKind === 're') dismissSlip();
    };
    root.addEventListener('click', function (e) {
      const t = e.target.closest ? e.target.closest('[data-buy],[data-tab],[data-act]') : null;
      if (!t || !root.contains(t)) return;
      if (t.hasAttribute('data-buy')) {
        const b = parseInt(t.getAttribute('data-buy'), 10);
        state.buy = b === 0 || b === 10 || b === 100 ? b : 1;
        lastSig = '';
        paint(Date.now(), true);
        save();
        return;
      }
      if (t.hasAttribute('data-tab')) {
        state.tab = t.getAttribute('data-tab') === 'xin' ? 'xin' : 'bld';
        applyTab();
        save();
        return;
      }
      if (t.hasAttribute('data-act') && !t.disabled) {
        const kind = t.getAttribute('data-act');
        const id = t.getAttribute('data-id');
        const qty = state.buy === 0 ? 'max' : state.buy;
        const n = kind === 'xin' ? tryBuy(state, 'xin', id, 1) : tryBuy(state, 'bld', id, qty);
        if (n > 0) {
          lastSig = '';
          paint(Date.now(), true);
          save();
        }
      }
    });
    root.addEventListener('keydown', function (e) {
      e.stopPropagation();
      if (e.key === 'Escape') {
        e.preventDefault();
        if (slipKind) dismissSlip();
        else close();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (!on) return;
      if (root && root.contains(e.target)) return;
      e.stopPropagation();
      e.preventDefault();
      if (e.key === 'Escape') {
        if (slipKind) dismissSlip();
        else close();
      }
    }, true);
    document.addEventListener('visibilitychange', onVis);
  }

  function onVis() {
    if (!on || !state) return;
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      save();
      return;
    }
    const now = Date.now();
    const dt = now - (state.last || now);
    if (dt > 2500) {
      const away = accrue(state, dt, true);
      state.last = now;
      clearBuff(now);
      if (away.gain >= 1 && dt >= 30000 && !slipKind) openAway(away);
    }
    state.last = now;
    loop();
  }

  function clearBuff(now) {
    if (state.buff && state.buff.until && state.buff.until <= now) state.buff = null;
  }

  function applyTab() {
    if (!root) return;
    root.classList.toggle('is-tab-xin', state.tab === 'xin');
    root.classList.toggle('is-tab-bld', state.tab !== 'xin');
    const tabs = root.querySelectorAll('.idle-tab');
    for (let i = 0; i < tabs.length; i++) {
      const onTab = tabs[i].getAttribute('data-tab') === (state.tab === 'xin' ? 'xin' : 'bld');
      tabs[i].classList.toggle('on', onTab);
      tabs[i].setAttribute('aria-selected', onTab ? 'true' : 'false');
    }
  }

  function signature() {
    const bld = state.bld || {};
    const xin = state.xin || {};
    let s = String(state.buy) + '|' + String(state.seal) + '|' + String(state.lives) + '|' + state.tab;
    for (let i = 0; i < BUILDINGS.length; i++) {
      const id = BUILDINGS[i].id;
      s += '|' + id + ':' + (bld[id] || 0) + (unlocked(state, BUILDINGS[i]) ? 'y' : 'n');
    }
    for (let j = 0; j < HEARTS.length; j++) s += '|' + HEARTS[j].id + ':' + (xin[HEARTS[j].id] || 0);
    return s;
  }

  function renderLists() {
    const bldHost = document.getElementById('idle-bld-list');
    const xinHost = document.getElementById('idle-xin-list');
    if (!bldHost || !xinHost) return;
    let bh = '';
    for (let i = 0; i < BUILDINGS.length; i++) {
      const def = BUILDINGS[i];
      if (!unlocked(state, def)) {
        bh += '<div class="idle-row is-lock"><b>' + def.name + '</b><p>' + lockText(def) + '</p></div>';
        continue;
      }
      const n = (state.bld && state.bld[def.id]) || 0;
      bh += '<div class="idle-row">' +
        '<div class="idle-row-t"><b>' + def.name + '</b><i>' + n + ' 级</i></div>' +
        '<p class="idle-row-d">每级 ' + fmt(def.prod) + ' · 现 ' + fmt(def.prod * n) + '</p>' +
        '<button type="button" class="idle-go" data-act="bld" data-id="' + def.id + '">' +
          '<span class="idle-go-n">置办</span><span class="idle-go-c"></span></button></div>';
    }
    bldHost.innerHTML = bh;
    let xh = '';
    for (let j = 0; j < HEARTS.length; j++) {
      const def = HEARTS[j];
      const lv = (state.xin && state.xin[def.id]) || 0;
      xh += '<div class="idle-row">' +
        '<div class="idle-row-t"><b>' + def.name + '</b><i>' + lv + ' / ' + def.cap + '</i></div>' +
        '<p class="idle-row-d">' + def.desc + '</p>' +
        '<button type="button" class="idle-go" data-act="xin" data-id="' + def.id + '">' +
          '<span class="idle-go-n">' + (lv >= def.cap ? '已满' : '参悟') + '</span><span class="idle-go-c"></span></button></div>';
    }
    xinHost.innerHTML = xh;
    const modes = root.querySelectorAll('[data-buy]');
    for (let k = 0; k < modes.length; k++) {
      modes[k].classList.toggle('on', parseInt(modes[k].getAttribute('data-buy'), 10) === state.buy);
    }
    applyTab();
  }

  function quoteBuy(def) {
    const n = (state.bld && state.bld[def.id]) || 0;
    const room = maxBuy(def, n, state.ink);
    let want = state.buy === 0 ? room : state.buy;
    if (want > room) want = room;
    if (!(want > 0)) return { want: 0, cost: costAt(def, n), label: '置办' };
    const label = want === 1 ? '置办' : ('置办 ' + want);
    return { want: want, cost: sumCost(def, n, want), label: label };
  }

  function updateAfford() {
    const buttons = root.querySelectorAll('[data-act]');
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      const id = btn.getAttribute('data-id');
      const kind = btn.getAttribute('data-act');
      const costEl = btn.querySelector('.idle-go-c');
      const nameEl = btn.querySelector('.idle-go-n');
      if (kind === 'xin') {
        const def = findHeart(id);
        const lv = (state.xin && state.xin[id]) || 0;
        if (!def || lv >= def.cap) {
          btn.disabled = true;
          if (nameEl) nameEl.textContent = '已满';
          if (costEl) costEl.textContent = '';
        } else {
          const c = heartCost(def, lv);
          btn.disabled = !(c <= state.ink);
          if (nameEl) nameEl.textContent = '参悟';
          if (costEl) costEl.textContent = fmt(c);
        }
      } else {
        const def = findBld(id);
        if (!def) continue;
        const q = quoteBuy(def);
        btn.disabled = !(q.want > 0);
        if (nameEl) nameEl.textContent = q.label;
        if (costEl) costEl.textContent = fmt(q.cost);
      }
    }
  }

  function paintOrn() {
    const svg = root.querySelector('.idle-svg');
    if (!svg) return;
    const nodes = svg.querySelectorAll('[data-need]');
    const seal = state.seal || 0;
    for (let i = 0; i < nodes.length; i++) {
      const need = parseInt(nodes[i].getAttribute('data-need'), 10);
      nodes[i].style.display = seal >= need ? '' : 'none';
    }
  }

  function paint(now, force) {
    const inkEl = document.getElementById('idle-ink');
    const dpsEl = document.getElementById('idle-dps');
    const meta = document.getElementById('idle-meta');
    const buff = document.getElementById('idle-buff');
    const goal = document.getElementById('idle-goal');
    const hint = document.getElementById('idle-hint');
    const re = document.getElementById('idle-re');
    const sub = document.getElementById('idle-tap-sub');
    if (inkEl) inkEl.textContent = fmt(state.ink);
    const rate = dps(state);
    if (dpsEl) dpsEl.textContent = '墨息 ' + fmt(rate);
    const oc = ornCount(state.seal || 0);
    if (meta) meta.textContent = lifeName(state.lives) + ' · 道印 ' + fmt(state.seal || 0) + (oc ? (' · 纸饰 ' + CN[oc] || oc) : '');
    if (goal) goal.textContent = now < noteUntil ? noteText : goalText(state);
    if (buff) {
      if (state.buff && state.buff.until > now) {
        const left = Math.ceil((state.buff.until - now) / 1000);
        const name = state.buff.kind === 'prod' ? '墨正走' : (state.buff.kind === 'click' ? '偏锋' : '笔自走');
        buff.hidden = false;
        buff.textContent = name + ' · 还剩 ' + left;
      } else buff.hidden = true;
    }
    const ready = canRebirth(state);
    if (re) re.disabled = !ready;
    if (hint) {
      if (ready) hint.textContent = '墨已可干';
      else hint.textContent = '还差 ' + fmt(needInk(state.lives) - state.lifeInk) + ' 墨气，或墨息至 ' + fmt(needDps(state.lives));
    }
    if (sub) {
      if ((state.seal || 0) >= 10 && now >= (state.tripleAt || 0)) sub.textContent = '一念';
      else if ((state.seal || 0) >= 10) sub.textContent = '稍候';
      else sub.textContent = '以指';
    }
    const sig = signature();
    if (force || sig !== lastSig) {
      lastSig = sig;
      renderLists();
      paintOrn();
    }
    updateAfford();
  }

  function floater(text, x, y) {
    const fx = document.getElementById('idle-fx');
    if (!fx) return;
    const s = document.createElement('span');
    s.className = 'idle-flo';
    s.textContent = text;
    s.style.left = Math.round(x) + 'px';
    s.style.top = Math.round(y) + 'px';
    fx.appendChild(s);
    setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 860);
  }

  function drops(x, y) {
    if (thin()) return;
    const fx = document.getElementById('idle-fx');
    if (!fx) return;
    for (let i = 0; i < 4; i++) {
      const d = document.createElement('i');
      d.className = 'idle-drop';
      const size = 3 + Math.random() * 5;
      d.style.width = size + 'px';
      d.style.height = size + 'px';
      d.style.left = Math.round(x + (Math.random() - 0.5) * 46) + 'px';
      d.style.top = Math.round(y + (Math.random() - 0.5) * 28) + 'px';
      fx.appendChild(d);
      setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 560);
    }
  }

  function tap(e) {
    if (!on || slipKind === 're') return;
    const now = Date.now();
    if (now - comboAt <= 350) combo = Math.min(5, combo + 1);
    else combo = 0;
    comboAt = now;
    let hits = 1;
    if ((state.seal || 0) >= 10 && now >= (state.tripleAt || 0)) {
      hits = 3;
      state.tripleAt = now + tripleCd(state);
    }
    const gain = clickValue(state, combo) * hits;
    addInk(state, gain);
    state.clicks = (state.clicks || 0) + 1;
    const boy = document.getElementById('idle-boy');
    if (boy && !thin()) {
      boy.classList.remove('is-tap');
      void boy.offsetWidth;
      boy.classList.add('is-tap');
    }
    const fx = document.getElementById('idle-fx');
    let x = 0;
    let y = 0;
    if (fx && e && e.clientX) {
      const box = fx.getBoundingClientRect();
      x = e.clientX - box.left;
      y = e.clientY - box.top;
    } else if (fx && boy) {
      const a = boy.getBoundingClientRect();
      const b = fx.getBoundingClientRect();
      x = a.left - b.left + a.width * 0.62;
      y = a.top - b.top + a.height * 0.42;
    }
    floater('+' + fmt(gain), x, y);
    drops(x, y);
    maybeMilestone(now);
    paint(now, false);
  }

  function maybeMilestone(now) {
    if (slipKind) return;
    const c = state.clicks || 0;
    state.milestones = state.milestones || {};
    let key = '';
    if (c === 40) key = 'a';
    else if (c === 120) key = 'b';
    else if (c === 400) key = 'c';
    if (!key || state.milestones[key]) return;
    state.milestones[key] = 1;
    openFate(FATES[c === 40 ? 0 : (c === 120 ? 4 : 7)], now);
  }

  function maybeFate(now) {
    if (slipKind || !state.fateAt || now < state.fateAt) return;
    if (now - (state.born || now) < 40000 && (state.clicks || 0) < 40) {
      state.fateAt = now + 20000;
      return;
    }
    const fate = FATES[Math.floor(Math.random() * FATES.length)];
    openFate(fate, now);
    scheduleFate(now);
  }

  function autoClicks(dt, now) {
    if (!state.buff || state.buff.kind !== 'auto' || state.buff.until <= now) return;
    state.buff.acc = (state.buff.acc || 0) + dt;
    let guard = 0;
    while (state.buff.acc >= 250 && guard < 8) {
      state.buff.acc -= 250;
      guard += 1;
      addInk(state, clickValue(state, 2) * 0.7);
    }
  }

  function frame() {
    if (!on) return;
    raf = requestAnimationFrame(frame);
    const now = Date.now();
    let dt = now - (state.last || now);
    if (dt < 0) dt = 0;
    state.last = now;
    clearBuff(now);
    if (dt >= 5000) {
      const away = accrue(state, dt, true);
      if (away.gain >= 1 && dt >= 30000 && !slipKind) openAway(away);
      maybeFate(now);
      paint(now, false);
      save();
      return;
    }
    addInk(state, dps(state) * (dt / 1000));
    autoClicks(dt, now);
    maybeFate(now);
    paint(now, false);
    saveAcc += dt;
    if (saveAcc > 4000) { saveAcc = 0; save(); }
  }

  function loop() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }

  function showRoot() {
    root.hidden = false;
    root.classList.add('open');
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', '墨童闲录');
    const app = document.getElementById('app');
    if (app) app.setAttribute('aria-hidden', 'true');
    document.body.classList.add('idle-on');
  }

  function hideRoot() {
    root.classList.remove('open');
    root.hidden = true;
    root.removeAttribute('role');
    root.removeAttribute('aria-modal');
    const app = document.getElementById('app');
    if (app) app.removeAttribute('aria-hidden');
    document.body.classList.remove('idle-on');
    const btn = document.getElementById('btn-idle');
    if (btn && btn.focus) btn.focus();
  }

  function open() {
    ensure();
    if (!root || on) return;
    state = load();
    const now = Date.now();
    const prev = state.last || now;
    const dt = now - prev;
    let away = null;
    if (state.last && dt > 800) {
      away = accrue(state, dt, dt >= 30000);
    }
    state.last = now;
    if (!state.born) state.born = now;
    if (!state.fateAt || state.fateAt < now) {
      state.fateAt = now + 50000 + Math.floor(Math.random() * 40000);
    }
    clearBuff(now);
    on = true;
    combo = 0;
    lastSig = '';
    showRoot();
    paint(now, true);
    if (away && away.gain >= 1 && dt >= 30000) openAway(away);
    loop();
    save();
  }

  function close() {
    if (!on) return;
    dismissSlip();
    on = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (state) {
      state.last = Date.now();
      saveAcc = 0;
      save();
    }
    hideRoot();
  }

  let slipFate = null;

  function openSlip(opts) {
    slipKind = opts.kind;
    const slip = document.getElementById('idle-slip');
    const shade = document.getElementById('idle-shade');
    const title = document.getElementById('idle-slip-title');
    const text = document.getElementById('idle-slip-text');
    const sub = document.getElementById('idle-slip-sub');
    const ok = document.getElementById('idle-slip-ok-t');
    const alt = document.getElementById('idle-slip-alt');
    if (title) title.textContent = opts.title || '';
    if (text) text.textContent = opts.text || '';
    if (sub) {
      sub.hidden = !opts.sub;
      sub.textContent = opts.sub || '';
    }
    if (ok) ok.textContent = opts.btn || '知道了';
    if (alt) alt.hidden = !opts.alt;
    if (shade) shade.hidden = false;
    if (slip) {
      slip.hidden = false;
      slip.classList.remove('on');
      if (thin()) slip.classList.add('on');
      else requestAnimationFrame(function () { slip.classList.add('on'); });
    }
  }

  function dismissSlip() {
    slipKind = '';
    slipFate = null;
    const slip = document.getElementById('idle-slip');
    const shade = document.getElementById('idle-shade');
    if (slip) { slip.classList.remove('on'); slip.hidden = true; }
    if (shade) shade.hidden = true;
  }

  function openAway(away) {
    const extra = away.capped ? '余息只记八小时。' : '';
    openSlip({
      kind: 'away',
      title: '余息',
      text: '墨未干，纸上仍有余息。',
      sub: '不在的这段，墨气 +' + fmt(away.gain) + (extra ? '。' + extra : ''),
      btn: '知道了',
      alt: false
    });
  }

  function openFate(fate) {
    slipFate = fate;
    openSlip({
      kind: 'fate',
      title: fate.title,
      text: fate.text,
      btn: fate.btn,
      alt: false
    });
  }

  function applyFate(fate) {
    const now = Date.now();
    if (fate.kind === 'prod' || fate.kind === 'click' || fate.kind === 'auto') {
      state.buff = { kind: fate.kind, mult: fate.mult || 1, until: now + fate.sec * 1000, acc: 0 };
    } else if (fate.kind === 'ink') {
      const lump = Math.max(dps(state) * fate.sec, clickValue(state, 0) * 8, 20);
      addInk(state, lump);
      floater('+' + fmt(lump), 80, 120);
    } else if (fate.kind === 'clickink') {
      const lump = Math.max(clickValue(state, 0) * fate.times, 12);
      addInk(state, lump);
      floater('+' + fmt(lump), 80, 120);
    }
  }

  function askRebirth() {
    if (!state || !canRebirth(state)) return;
    const g = sealGain(state.lifeInk);
    openSlip({
      kind: 're',
      title: '再落一墨',
      text: '这一世的墨会干。置办与心法都收回纸里，道印留下。',
      sub: '可落道印 ' + fmt(g) + '。现有 ' + fmt(state.seal || 0) + '。',
      btn: '落印',
      alt: true
    });
  }

  function confirmSlip() {
    if (slipKind === 'fate' && slipFate) {
      applyFate(slipFate);
      dismissSlip();
      paint(Date.now(), false);
      save();
      return;
    }
    if (slipKind === 'away') {
      dismissSlip();
      return;
    }
    if (slipKind === 're') {
      const stamp = document.getElementById('idle-stamp');
      const gain = rebirth(state);
      state.born = Date.now();
      state.last = state.born;
      state.fateAt = state.born + 50000;
      combo = 0;
      lastSig = '';
      dismissSlip();
      if (stamp && !thin()) {
        stamp.hidden = false;
        stamp.classList.remove('go');
        void stamp.offsetWidth;
        stamp.classList.add('go');
        setTimeout(function () { stamp.hidden = true; stamp.classList.remove('go'); }, 780);
      }
      noteText = '纸上又落了一墨 · 道印 +' + fmt(gain);
      noteUntil = Date.now() + 3200;
      paint(Date.now(), true);
      save();
    }
  }

  function boot() {
    if (typeof document === 'undefined') return;
    const bind = function () {
      const btn = document.getElementById('btn-idle');
      if (!btn || btn._idle) return;
      btn._idle = 1;
      btn.addEventListener('click', function () {
        if (typeof FX !== 'undefined' && FX.requestTilt) FX.requestTilt();
        open();
      });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();
  }

  boot();

  return { KEY: KEY, open: open, close: close, math: math };
})();
if (typeof globalThis !== 'undefined') globalThis.Idle = Idle;
