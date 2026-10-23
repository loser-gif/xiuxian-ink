/* 墨仙录 · 轮回与仙途志。进度只写 moxian.meta，不进存档槽。 */
'use strict';
const Samsara = (() => {
  const META_KEY = 'moxian.meta';
  const LEGACY_KEY = 'moxian.legacy';
  const META_V = 1;
  const END_IDS = ['ascend', 'zuohua', 'rumo', 'guiyin', 'bingjie', 'yunluo', 'renhuang', 'quancheng', 'huashen', 'zhenmo', 'chuanshuo'];
  const PERSON_IDS = Object.keys(NPCS);
  const ELS = ['金', '木', '水', '火', '土'];

  function emptyAtlas() {
    return { daoji: {}, faxiang: {}, shenqi: {}, ending: {}, danwen: {}, encounter: {}, gongfa: {}, person: {} };
  }
  function emptyMeta() {
    return {
      v: META_V, lives: 0,
      epitaphs: [],
      atlas: emptyAtlas(),
      guide: 0,
      daily: { day: '', claimed: false },
      best: { age: 0, realm: 0, ascend: 0 },
      relics: [],
      echoes: [],
      boons: {},
      palette: '',
      bridge: null,
      backfilled: 0,
    };
  }

  function loadMeta() {
    try {
      const m = JSON.parse(localStorage.getItem(META_KEY) || 'null');
      if (!m || typeof m !== 'object') return emptyMeta();
      m.atlas = m.atlas || emptyAtlas();
      for (const k of ['daoji', 'faxiang', 'shenqi', 'ending', 'danwen', 'encounter', 'gongfa', 'person']) m.atlas[k] = m.atlas[k] || {};
      if (m.guide == null) m.guide = 0;
      m.epitaphs = Array.isArray(m.epitaphs) ? m.epitaphs : [];
      m.daily = m.daily || { day: '', claimed: false };
      m.best = m.best || { age: 0, realm: 0, ascend: 0 };
      m.relics = Array.isArray(m.relics) ? m.relics : [];
      m.echoes = Array.isArray(m.echoes) ? m.echoes : [];
      m.boons = m.boons && typeof m.boons === 'object' ? m.boons : {};
      if (m.palette !== 'songyan' && m.palette !== 'lengjin' && m.palette !== 'yuqing') m.palette = '';
      m.lives = m.lives | 0;
      if (!m.backfilled) {
        backfill(m);
        m.backfilled = 1;
        grantBoons(m);
        saveMeta(m);
      } else if (grantBoons(m)) saveMeta(m);
      return m;
    } catch (e) { return emptyMeta(); }
  }

  function saveMeta(m) {
    try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch (e) {}
  }

  function todayKey() {
    const d = new Date();
    const z = n => (n < 10 ? '0' : '') + n;
    return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
  }

  function unlockAtlas(m, s, ending) {
    if (!s) return;
    const a = m.atlas;
    if (s.path) {
      if (s.path.daoji) a.daoji[s.path.daoji] = 1;
      if (s.path.faxiang) a.faxiang[s.path.faxiang] = 1;
      for (const id of (s.path.danwen || [])) a.danwen[id] = 1;
    }
    if (ending) a.ending[ending] = (a.ending[ending] | 0) + 1;
    // 神器：持有或见过
    if (typeof SHENQI_ZHI !== 'undefined') {
      for (const z of SHENQI_ZHI) {
        if ((s.flags && s.flags[z.flag]) || (s.items && s.items[z.name]) || (s.eq && s.eq.weapon === z.name))
          a.shenqi[z.name] = 1;
      }
    }
    if (typeof GEAR !== 'undefined') {
      for (const name in GEAR) if (GEAR[name].artifact && ((s.items && s.items[name]) || (s.eq && s.eq.weapon === name)))
        a.shenqi[name] = 1;
    }
  }

  /* ---------- 结生遗物 ---------- */
  function buildLegacy(s, ending) {
    if (!s) return null;
    const leg = { v: 1, ending: ending || s.ending || 'zuohua', name: s.name, age: s.age | 0, realm: s.realm | 0, wx: 0 };
    // 悟性残念：兵解／飞升／归隐略厚，身殒／入魔略薄
    const wxMap = { bingjie: 1, ascend: 2, guiyin: 1, renhuang: 1, quancheng: 1, huashen: 1, zhenmo: 1, chuanshuo: 1, zuohua: 0, rumo: 0, yunluo: 0 };
    leg.wx = wxMap[leg.ending] != null ? wxMap[leg.ending] : 0;
    // 法宝残魂：已祭炼的厚，未成器的也留一声轻鸣
    if (typeof Core !== 'undefined' && Core.fabaoOnDeath) {
      const ch = Core.fabaoOnDeath(s);
      if (ch) leg.canhun = ch;
    }
    if (!leg.canhun && s.fabao) {
      leg.canhun = { id: s.fabao.id, name: s.fabao.name, seal: s.fabao.seal, stage: 0, el: s.fabao.el, bond: 0, flavor: s.fabao.flavor || '残魂尚轻，只余一声鸣。', weak: 1 };
    }
    // 道基残忆
    if (s.path && s.path.daoji) leg.daoji = s.path.daoji;
    // 辅修残页：取一门辅修或主修残页
    const aux = (s.aux || []).filter(id => s.gfs && s.gfs[id]);
    if (aux.length) leg.auxPage = aux[Math.floor(Math.random() * aux.length)];
    else if (s.gf && (s.gfs[s.gf] && s.gfs[s.gf].lv >= 3)) leg.auxPage = s.gf;
    // 门派印记
    if (s.sect && s.sect.org && (s.sect.rank | 0) >= 2) {
      leg.sectMark = { org: s.sect.org, rank: Math.min(3, s.sect.rank | 0) };
    }
    // 皇命印记
    if (s.court && (s.court.rank | 0) >= 0) {
      leg.courtMark = { rank: s.court.rank | 0, entry: s.court.entry || null, bing: s.court.bing | 0 };
    }
    // 法相残影（仅图鉴用，不直接继承法相）
    if (s.path && s.path.faxiang) leg.faxiang = s.path.faxiang;
    if (s.life && s.life.thread) leg.thread = s.life.thread;
    if (s.life && s.life.goal) leg.goal = s.life.goal;
    const place = (typeof LOC !== 'undefined' && s.loc && LOC[s.loc]) ? LOC[s.loc].name : '旧洞';
    if ((s.realm | 0) >= 1 || (s.age | 0) >= 48) leg.cave = { name: place, modest: (s.realm | 0) < 2 };
    rememberRelics(leg);
    return leg;
  }

  function markRelic(kind, name) {
    const m = loadMeta();
    m.relics = m.relics || [];
    const key = kind + ':' + (name || '');
    if (!m.relics.some(r => r && r.k === key)) {
      m.relics.unshift({ k: key, kind, name: name || '', at: Date.now() });
      if (m.relics.length > 24) m.relics.length = 24;
      saveMeta(m);
    }
  }
  function rememberRelics(leg) {
    if (!leg) return;
    if (leg.cave) markRelic('cave', leg.cave.name);
    if (leg.canhun) markRelic('fabao', leg.canhun.name);
    if (leg.auxPage) markRelic('page', leg.auxPage);
  }

  function writeLegacy(leg) {
    if (!leg) return;
    try { localStorage.setItem(LEGACY_KEY, JSON.stringify(leg)); } catch (e) {}
  }

  function peekLegacy() {
    try { return JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null'); } catch (e) { return null; }
  }

  function consumeLegacy() {
    const leg = peekLegacy();
    try { localStorage.removeItem(LEGACY_KEY); } catch (e) {}
    return leg;
  }

  /* ---------- 开卷继承 ---------- */
  function applyLegacy(s, legacy) {
    if (!s || !legacy) return [];
    const tags = [];
    s.flags = s.flags || {};
    if (legacy.naihe) return applyNaihe(s, legacy, tags);
    s.flags.legacy = 1;
    const wxAdd = Math.min(2, legacy.wx | 0);
    if (wxAdd) {
      s.wx = Math.max(1, Math.min(10, (s.wx | 0) + wxAdd));
      tags.push({ t: `前世残念 · 悟性 +${wxAdd}`, c: 'up' });
    }
    if (legacy.canhun) {
      s.flags.canhunSeed = legacy.canhun;
      s.flags.fabaoCanhun = 1;
      tags.push({ t: '法宝残魂', c: 'gold' });
    }
    if (legacy.daoji) {
      s.flags.daojiMem = legacy.daoji;
      tags.push({ t: '道基残忆', c: 'gold' });
    }
    if (legacy.auxPage && typeof GONGFA !== 'undefined' && GONGFA[legacy.auxPage]) {
      s.flags.auxPage = legacy.auxPage;
      // 残页：记入已知，可研习；不直接主修
      s.seen = s.seen || {};
      s.seen['gf_' + legacy.auxPage] = 1;
      tags.push({ t: '功法残页 · 《' + GONGFA[legacy.auxPage].name + '》', c: 'gold' });
    }
    if (legacy.sectMark && legacy.sectMark.org) {
      s.flags.sectMark = legacy.sectMark;
      tags.push({ t: '门派印记', c: 'gold' });
    }
    if (legacy.courtMark) {
      s.flags.courtMark = legacy.courtMark;
      tags.push({ t: '皇命印记', c: 'gold' });
    }
    if (legacy.faxiang) s.flags.faxiangMem = legacy.faxiang;
    if (legacy.thread) {
      s.flags.threadText = legacy.thread;
      tags.push({ t: '前世绝笔', c: 'gold' });
    }
    if (legacy.cave && legacy.cave.name) {
      s.flags.heirCave = legacy.cave;
      tags.push({ t: '旧洞残钥', c: 'gold' });
    }
    return tags;
  }

  /* 道基残忆：择基时微利 */
  function daojiAffinity(s, id) {
    if (!(s && s.flags && s.flags.daojiMem && s.flags.daojiMem === id)) return 0;
    return 0.015; // 破境微利，叠入 btBuff 式
  }

  /* 门派印记：入同宗时贡奉加成 */
  function onJoinOrg(s, orgId) {
    if (!(s && s.flags && s.flags.sectMark && s.flags.sectMark.org === orgId)) return null;
    const bonus = 80 + (s.flags.sectMark.rank | 0) * 40;
    s.sect = s.sect || {};
    s.sect.gxTotal = (s.sect.gxTotal | 0) + bonus;
    const name = (typeof ORGS !== 'undefined' && ORGS[orgId]) ? ORGS[orgId].name : '故宗';
    return { text: `腰间旧印微热——前世与「${name}」的因果未尽。执事堂记下你的面缘，贡奉簿上多了一笔。`, gx: bonus };
  }

  /* 皇命印记：初入仕途略易 */
  function courtLegacyBoost(s) {
    if (!(s && s.flags && s.flags.courtMark)) return 0;
    return 8; // 民心／道统起步加成在 apply 时写入
  }

  function applyCourtMark(s) {
    if (!(s && s.flags && s.flags.courtMark && s.court)) return;
    const m = s.flags.courtMark;
    s.court.min = Math.min(90, (s.court.min | 0) + 6);
    s.court.dao = Math.min(90, (s.court.dao | 0) + 4);
    if (m.entry && !s.court.entry) s.flags.courtEntryHint = m.entry;
  }

  /* ---------- 墓志长卷文 ---------- */
  function epitaphLong(s, ending, shortLine) {
    const age = (typeof cn === 'function' ? cn(s.age) : s.age);
    const rs = (typeof realmStr === 'function' ? realmStr() : (REALMS[s.realm] && REALMS[s.realm].name) || '');
    const path = (typeof Core !== 'undefined' && Core.pathSummary) ? (Core.pathSummary(s) || []).map(x => x.name).join('·') : '';
    const gf = s.gf && typeof GONGFA !== 'undefined' && GONGFA[s.gf] ? GONGFA[s.gf].name : '';
    const fb = s.fabao ? s.fabao.name : '';
    const org = s.sect && s.sect.org && typeof ORGS !== 'undefined' && ORGS[s.sect.org] ? ORGS[s.sect.org].name : '';
    const rank = s.sect && typeof ORGS !== 'undefined' && ORGS[s.sect && s.sect.org] && ORGS[s.sect.org].ranks
      ? ORGS[s.sect.org].ranks[s.sect.rank | 0] : '';
    const lines = [];
    lines.push(shortLine || '');
    lines.push('');
    lines.push(`名讳 ${s.name}　灵根 ${s.lgEls && s.lgEls.length ? s.lgEls.join('') : ''}${s.lg && s.lg.name ? s.lg.name : ''}`);
    lines.push(`境界 ${rs}　春秋 ${age} 载`);
    if (path) lines.push(`定型 ${path}`);
    if (gf) lines.push(`主修 《${gf}》`);
    if (fb) lines.push(`本命 ${fb}`);
    if (org) lines.push(`门墙 ${org}${rank ? ' · ' + rank : ''}`);
    if (s.court && (s.court.rank | 0) >= 0 && typeof courtRankName === 'function') {
      lines.push(`皇命 ${courtRankName(s)}`);
    }
    if (s.events) lines.push(`奇遇 ${typeof cn === 'function' ? cn(s.events) : s.events} 桩`);
    lines.push('');
    const seals = {
      ascend: '',
      zuohua: '山风过石门，案上笔未干。',
      rumo: '墨落成血，不可复洗。',
      guiyin: '空船自横，钓丝无饵。',
      bingjie: '真灵一缕，尚在轮回。',
      yunluo: '无字碑前，野草年年。',
      renhuang: '仙凡一统，山门钟哑。',
      quancheng: '摄政如天，史不敢名。',
      huashen: '祠前无门，风替人点头。',
      zhenmo: '裂口合拢，剑作镇纸。',
      chuanshuo: '册子无名，句子还在。',
    };
    const seal = Object.prototype.hasOwnProperty.call(seals, ending) ? seals[ending] : '青石一方，记此一念。';
    if (seal) lines.push(seal);
    return lines.filter((x, i, a) => x !== '' || (a[i - 1] !== '')).join('\n');
  }

  /* ---------- 结生记账 ---------- */
  function recordLife(s, ending, shortLine) {
    const m = loadMeta();
    m.lives = (m.lives | 0) + 1;
    unlockAtlas(m, s, ending);
    const long = epitaphLong(s, ending, shortLine);
    m.epitaphs.unshift({
      at: Date.now(), name: s.name, ending, age: s.age | 0, realm: s.realm | 0,
      path: (s.path && s.path.daoji) || null, faxiang: (s.path && s.path.faxiang) || null,
      text: long, short: shortLine || '',
    });
    if (m.epitaphs.length > 24) m.epitaphs.length = 24;
    m.guide = 1;
    if ((s.age | 0) > (m.best.age | 0)) m.best.age = s.age | 0;
    if ((s.realm | 0) > (m.best.realm | 0)) m.best.realm = s.realm | 0;
    if (ending === 'ascend') m.best.ascend = (m.best.ascend | 0) + 1;
    if (!(s.flags && s.flags.trial)) {
      m.echoes = Array.isArray(m.echoes) ? m.echoes : [];
      const echo = {
        key: (s.name || '') + '|' + (ending || '') + '|' + (s.age | 0),
        name: s.name || '无名', ending: ending || 'zuohua', realm: s.realm | 0, age: s.age | 0,
        mate: (s.karma && s.karma.mate && typeof NPCS !== 'undefined' && NPCS[s.karma.mate]) ? NPCS[s.karma.mate].name : '',
        mateId: (s.karma && s.karma.mate) || '',
        foe: (s.karma && s.karma.foe && typeof NPCS !== 'undefined' && NPCS[s.karma.foe]) ? NPCS[s.karma.foe].name : '',
        foeId: (s.karma && s.karma.foe) || '',
        sect: (s.sect && s.sect.org && typeof ORGS !== 'undefined' && ORGS[s.sect.org]) ? ORGS[s.sect.org].name : '',
        fabao: (s.fabao && s.fabao.name) || (s.eq && s.eq.weapon) || '',
        goal: (s.life && s.life.goal) || '',
      };
      if (!m.echoes.some(x => x && x.key === echo.key)) m.echoes.unshift(echo);
      if (m.echoes.length > 16) m.echoes.length = 16;
    }
    harvest(m, s);
    m.bridge = bridgeFrom(s, ending, m.lives | 0);
    if ((m.lives | 0) > 0) m.guide = 1;
    grantBoons(m);
    saveMeta(m);
    return { meta: m, legacy: null, epitaph: long, bridge: m.bridge };
  }

  function applyNaihe(s, legacy, tags) {
    s.flags.legacy = 1;
    s.flags.naihe = legacy.kind || 'none';
    if (legacy.kind === 'mem') {
      const add = Math.min(1, legacy.wx | 0);
      if (add) {
        s.wx = Math.max(1, Math.min(10, (s.wx | 0) + add));
        tags.push({ t: '前世记忆 · 悟性 +1', c: 'up' });
      }
      if (legacy.el && ELS.indexOf(legacy.el) >= 0) {
        s.flags.lgLean = legacy.el;
        tags.push({ t: '灵根微偏 · ' + legacy.el, c: 'gold' });
      }
    } else if (legacy.kind === 'page' && legacy.page && typeof GONGFA !== 'undefined' && GONGFA[legacy.page] && s.gf !== legacy.page) {
      const id = legacy.page;
      if (!s.gfs[id]) s.gfs[id] = { lv: 1, xp: 0, broken: 1 };
      else if (!s.gfs[id].lv) s.gfs[id] = { lv: 1, xp: 0, broken: 1 };
      else s.gfs[id].broken = 1;
      s.flags.brokenPage = id;
      tags.push({ t: '残篇 · 《' + GONGFA[id].name + '》', c: 'gold' });
    } else if (legacy.kind === 'bond' && legacy.bond && legacy.bond.id) {
      s.flags.karmaCarry = {
        role: legacy.bond.role || 'en',
        id: legacy.bond.id,
        name: legacy.bond.name || '',
      };
      const lab = legacy.bond.role === 'foe' ? '旧仇' : legacy.bond.role === 'mate' ? '旧侣' : '旧恩';
      tags.push({ t: lab + ' · ' + (legacy.bond.name || '有人'), c: 'gold' });
    }
    return tags;
  }

  function bridgeFrom(s, ending, lives) {
    const mem = { wx: 1, el: '' };
    if (s && s.lg && s.lg.id !== 'wei' && s.lgEls && s.lgEls.length) {
      for (let i = 0; i < s.lgEls.length; i++) if (ELS.indexOf(s.lgEls[i]) >= 0) { mem.el = s.lgEls[i]; break; }
    }
    let page = null;
    if (s && s.gfs && typeof GONGFA !== 'undefined') {
      const ids = Object.keys(s.gfs).filter(id => GONGFA[id]);
      ids.sort((a, b) => (GONGFA[b].grade - GONGFA[a].grade) || ((s.gfs[b].lv | 0) - (s.gfs[a].lv | 0)));
      let pickId = '';
      for (let i = 0; i < ids.length; i++) if (ids[i] !== 'qingming') { pickId = ids[i]; break; }
      if (pickId) page = { id: pickId, name: GONGFA[pickId].name, grade: GONGFA[pickId].grade | 0 };
    }
    let bond = null;
    if (s && s.karma && s.karma.mate && typeof NPCS !== 'undefined' && NPCS[s.karma.mate]) {
      bond = { role: 'mate', id: s.karma.mate, name: NPCS[s.karma.mate].name };
    } else if (s && s.karma && s.karma.foe && typeof NPCS !== 'undefined' && NPCS[s.karma.foe]) {
      bond = { role: 'foe', id: s.karma.foe, name: NPCS[s.karma.foe].name };
    } else if (s && s.npc && typeof NPCS !== 'undefined') {
      let best = '', bestA = 39;
      for (const id in s.npc) {
        const n = s.npc[id];
        if (!n || !n.met || !NPCS[id] || n.dead) continue;
        if ((n.a | 0) > bestA) { bestA = n.a | 0; best = id; }
      }
      if (best) bond = { role: 'en', id: best, name: NPCS[best].name };
    }
    const roadBonds = ((s && s.life && s.life.deeds) || []).filter(d => ['ahe', 'shengu'].includes(d.id) && (d.kind === 'save' || d.kind === 'spare'))
      .map(d => ({ role: 'en', id: d.id, name: d.who }));
    return {
      open: 1, name: (s && s.name) || '', ending: ending || '', roadBonds,
      mem, page, bond, lives: lives | 0,
    };
  }

  function bridgeOpen() {
    const b = loadMeta().bridge;
    return !!(b && b.open);
  }
  function dismissBridge() {
    const m = loadMeta();
    if (!m.bridge || !m.bridge.open) return;
    m.bridge = Object.assign({}, m.bridge, { open: 0, chosen: 'ascend' });
    saveMeta(m);
  }
  function chooseNaihe(kind, personId) {
    const m = loadMeta();
    const b = m.bridge || {};
    const leg = { v: 2, naihe: 1, kind: 'none' };
    if (kind === 'mem') { leg.kind = 'mem'; leg.wx = 1; leg.el = (b.mem && b.mem.el) || ''; }
    else if (kind === 'page' && b.page && b.page.id) { leg.kind = 'page'; leg.page = b.page.id; }
    else if (kind === 'bond') {
      const person = personId ? (b.roadBonds || []).find(p => p.id === personId) : b.bond;
      if (person && person.id) { leg.kind = 'bond'; leg.bond = { role: person.role || 'en', id: person.id, name: person.name || '' }; }
    }
    writeLegacy(leg);
    m.bridge = Object.assign({}, b, { open: 0, chosen: leg.kind });
    saveMeta(m);
    return leg;
  }

  function harvest(m, s) {
    if (!m || !s) return;
    m.atlas = m.atlas || emptyAtlas();
    if (s.gfs && typeof GONGFA !== 'undefined') {
      for (const id in s.gfs) if (GONGFA[id]) m.atlas.gongfa[id] = 1;
    }
    if (s.gf && typeof GONGFA !== 'undefined' && GONGFA[s.gf]) m.atlas.gongfa[s.gf] = 1;
    if (typeof SHENQI_ZHI !== 'undefined') {
      for (let i = 0; i < SHENQI_ZHI.length; i++) {
        const z = SHENQI_ZHI[i];
        if ((s.flags && s.flags[z.flag]) || (s.items && s.items[z.name]) || (s.eq && s.eq.weapon === z.name))
          m.atlas.shenqi[z.name] = 1;
      }
    }
    if (s.npc) {
      for (const id in s.npc) if (s.npc[id] && s.npc[id].met) m.atlas.person[id] = 1;
    }
    if (s.karma) {
      if (s.karma.mate) m.atlas.person[s.karma.mate] = 1;
      if (s.karma.foe) m.atlas.person[s.karma.foe] = 1;
    }
    if (s.life && Array.isArray(s.life.people) && typeof NPCS !== 'undefined') {
      const byName = {};
      for (const id in NPCS) if (NPCS[id] && NPCS[id].name) byName[NPCS[id].name] = id;
      s.life.people.forEach(p => { if (p && byName[p.name]) m.atlas.person[byName[p.name]] = 1; });
    }
    if (s.seen) {
      const ids = {};
      encounterCatalog().forEach(e => { ids[e.id] = 1; });
      for (const id in s.seen) if (ids[id]) m.atlas.encounter[id] = 1;
    }
    if (s.path) {
      if (s.path.daoji) m.atlas.daoji[s.path.daoji] = 1;
      if (s.path.faxiang) m.atlas.faxiang[s.path.faxiang] = 1;
      for (const id of (s.path.danwen || [])) m.atlas.danwen[id] = 1;
    }
  }

  function absorbSave(m, d) {
    if (!d || typeof d !== 'object') return false;
    let fin = false;
    if (d.dead || d.ascended || d.ending) fin = true;
    if (d.ending) m.atlas.ending[d.ending] = m.atlas.ending[d.ending] || 1;
    else if (d.ascended) m.atlas.ending.ascend = m.atlas.ending.ascend || 1;
    harvest(m, d);
    return fin;
  }

  function backfill(m) {
    const seenFin = {};
    let fin = 0;
    function take(d) {
      if (!absorbSave(m, d)) return;
      const k = (d.name || '') + '|' + (d.ending || (d.ascended ? 'ascend' : '')) + '|' + (d.age | 0);
      if (seenFin[k]) return;
      seenFin[k] = 1;
      fin++;
    }
    (m.epitaphs || []).forEach(ep => { if (ep && ep.ending) m.atlas.ending[ep.ending] = m.atlas.ending[ep.ending] || 1; });
    try {
      if (typeof localStorage === 'undefined' || !localStorage) return;
      take(JSON.parse(localStorage.getItem('moxian.v1') || 'null'));
      const box = JSON.parse(localStorage.getItem('moxian.slots') || 'null');
      const slots = box && box.slots;
      if (Array.isArray(slots)) slots.forEach(sl => take(sl && sl.data));
    } catch (e) {}
    if ((m.epitaphs || []).length > fin) fin = m.epitaphs.length;
    if ((m.lives | 0) < fin) m.lives = fin;
    if ((m.lives | 0) > 0) m.guide = 1;
  }

  function volumeStats(m) {
    m = m || loadMeta();
    const a = m.atlas || emptyAtlas();
    const endingGot = END_IDS.filter(k => a.ending && a.ending[k]).length;
    const gfIds = (typeof GONGFA !== 'undefined') ? Object.keys(GONGFA) : [];
    const gfGot = gfIds.filter(id => a.gongfa && a.gongfa[id]).length;
    const fb = (typeof SHENQI_ZHI !== 'undefined') ? SHENQI_ZHI : [];
    const fbGot = fb.filter(z => a.shenqi && a.shenqi[z.name]).length;
    const pGot = PERSON_IDS.filter(id => a.person && a.person[id]).length;
    const enc = encounterCatalog();
    const eGot = enc.filter(e => a.encounter && a.encounter[e.id]).length;
    const pack = (got, max) => ({ got, max, done: max > 0 && got >= max });
    return {
      ending: pack(endingGot, END_IDS.length),
      gongfa: pack(gfGot, gfIds.length),
      fabao: pack(fbGot, fb.length),
      person: pack(pGot, PERSON_IDS.length),
      encounter: pack(eGot, enc.length),
    };
  }
  function grantBoons(m) {
    if (!m) return false;
    m.boons = m.boons || {};
    const st = volumeStats(m);
    let changed = false;
    ['ending', 'gongfa', 'fabao', 'person', 'encounter'].forEach(k => {
      if (st[k].done && !m.boons[k]) { m.boons[k] = 1; changed = true; }
    });
    return changed;
  }
  function setPalette(id) {
    const m = loadMeta();
    const map = { songyan: 'gongfa', lengjin: 'fabao', yuqing: 'encounter' };
    if (id && map[id] && m.boons && m.boons[map[id]]) m.palette = id;
    else m.palette = '';
    saveMeta(m);
    return m.palette;
  }
  function noteGongfa(id) {
    if (!id || typeof GONGFA === 'undefined' || !GONGFA[id]) return;
    const m = loadMeta();
    if (m.atlas.gongfa[id]) return;
    m.atlas.gongfa[id] = 1;
    grantBoons(m);
    saveMeta(m);
  }

  /* ---------- 日缘 ---------- */
  function dailyStatus() {
    const m = loadMeta();
    const day = todayKey();
    if (m.daily.day !== day) { m.daily = { day, claimed: false }; saveMeta(m); }
    return { day, claimed: !!m.daily.claimed, lives: m.lives | 0 };
  }

  function claimDaily(s, emit) {
    const st = dailyStatus();
    if (st.claimed) return { err: '今日机缘已领' };
    if (!s || s.dead || s.ascended) return { err: '无卷可领' };
    const m = loadMeta();
    m.daily.claimed = true;
    saveMeta(m);
    const roll = Math.random();
    let text, tags = [{ t: '日缘', c: 'gold' }];
    if (roll < 0.35) {
      s.ls = (s.ls | 0) + 28; tags.push({ t: '灵石 +28', c: 'up' });
      text = '晨起石案上多了一袋灵石，袋口系着一根枯藤——像有人夜里来过，又像你自己梦见的。';
    } else if (roll < 0.6) {
      s.xj = Math.min(100, (s.xj | 0) + 4); tags.push({ t: '心境 +4', c: 'up' });
      text = '窗纸上的霜花化了。你静坐片刻，心口那一点浊气散了。';
    } else if (roll < 0.8) {
      s.items = s.items || {};
      s.items['聚气丹'] = (s.items['聚气丹'] | 0) + 1; tags.push({ t: '聚气丹 +1', c: 'up' });
      text = '药童敲门：「谷里多炼了一炉，谷主说随缘分。」你收下，未问谷主是谁。';
    } else {
      if (typeof Core !== 'undefined' && Core.fabaoFeed && s.fabao) {
        Core.fabaoFeed(s, 4, null);
        tags.push({ t: '祭炼', c: 'gold' });
        text = '本命器在识海里轻轻震了一下，像被谁喂了一口晨露。';
      } else {
        s.luck = Math.min(10, (s.luck | 0) + 1); tags.push({ t: '气运 +1', c: 'up' });
        text = '你出门时看见一只白鹤掠过山门。鹤影入云，你心口一轻。';
      }
    }
    if (typeof Core !== 'undefined' && Core.sync) Core.sync(s);
    if (emit) emit({ title: '日缘', text, tags, cls: 'gold', div: true });
    return { ok: true, text, tags };
  }

  /* ---------- 试炼局种子 ---------- */
  function trialSeed() {
    return {
      trial: 1, name: '试炼客',
      // 供 UI 使用：短局、高起步
      hint: '试炼境：以金丹之姿入局，二十载内须破一障。不入轮回簿，可解锁图鉴。',
    };
  }

  function isTrial(s) { return !!(s && s.flags && s.flags.trial); }

  function plainTitle(e) {
    if (!e || e.title == null) return '';
    if (typeof e.title === 'string') return e.title;
    // 个别奇遇的题随身份变。志上只记一个稳定的名字，不把函数印出来。
    if (e.id === 'cangjing') return '藏经阁';
    return '';
  }
  function encounterCatalog() {
    if (typeof EVENTS === 'undefined') return [];
    const seen = {}, out = [];
    for (const e of EVENTS) {
      const title = plainTitle(e);
      if (!e || !e.once || !title || !e.id || e.mission || seen[e.id]) continue;
      seen[e.id] = 1;
      out.push({ id: e.id, title, seal: e.seal || '缘' });
    }
    return out;
  }

  function seeEncounter(id) {
    if (!id || String(id).indexOf('g') === 0 && String(id).length <= 2) return;
    const cat = encounterCatalog();
    if (!cat.some(e => e.id === id)) return;
    const m = loadMeta();
    if (m.atlas.encounter[id]) return;
    m.atlas.encounter[id] = 1;
    saveMeta(m);
  }

  function atlasStats(m) {
    m = m || loadMeta();
    const a = m.atlas;
    const count = o => Object.keys(o || {}).length;
    return {
      lives: m.lives | 0,
      daoji: count(a.daoji), daojiMax: typeof DAOJI !== 'undefined' ? Object.keys(DAOJI).length : 6,
      faxiang: count(a.faxiang), faxiangMax: typeof FAXIANG !== 'undefined' ? Object.keys(FAXIANG).length : 5,
      shenqi: count(a.shenqi), shenqiMax: typeof SHENQI_ZHI !== 'undefined' ? SHENQI_ZHI.length : 6,
      ending: count(a.ending),
      endingMax: 11,
      relics: (m.relics || []).length,
      encounter: count(a.encounter),
      encounterMax: encounterCatalog().length,
      epitaphs: (m.epitaphs || []).length,
      best: m.best,
    };
  }

    return {
    META_KEY, LEGACY_KEY, loadMeta, saveMeta, emptyMeta,
    buildLegacy, writeLegacy, peekLegacy, consumeLegacy, applyLegacy,
    recordLife, epitaphLong, unlockAtlas,
    daojiAffinity, onJoinOrg, applyCourtMark, courtLegacyBoost,
    dailyStatus, claimDaily, todayKey,
    trialSeed, isTrial, atlasStats,
    encounterCatalog, seeEncounter, markRelic,
    END_IDS, PERSON_IDS, bridgeOpen, dismissBridge, chooseNaihe, volumeStats, setPalette, noteGongfa, harvest,
  };
})();
