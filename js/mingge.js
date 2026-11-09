/* 纸上仙途 · 命格绘卷。
   新开一卷的文字序章：选择先记在草稿上，落印时一次性写入本局。
   返回不重掷、不叠奖。旧档没有这份命格，补一个空的，不抬 SAVE_V。 */
'use strict';
const Mingge = (() => {
  const GOLD = {
    jian: '天生剑骨',
    lingjue: '先天灵觉',
    fuxing: '福缘盈袖',
    qihai: '气海自生',
    zhishui: '心如止水',
  };
  const ORIGIN = { jade: 'shijia', sword: 'hanmen', almanac: 'shusheng', air: 'daotai' };

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rng(seed) {
    let a = seed | 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function copyLg(lg) {
    return { id: lg.id, name: lg.name, mult: lg.mult, bt: lg.bt, sect: lg.sect, word: lg.word };
  }
  function rollBase(seed, lean) {
    const next = rng(seed ^ 0x5a17);
    const tot = LINGGEN.reduce((acc, row) => acc + row.w, 0);
    let cursor = next() * tot;
    let lg = LINGGEN[LINGGEN.length - 1];
    for (let i = 0; i < LINGGEN.length; i++) {
      cursor -= LINGGEN[i].w;
      if (cursor < 0) { lg = LINGGEN[i]; break; }
    }
    const sh = ELEMENTS.slice().sort(() => next() - 0.5);
    if (lean && ELEMENTS.indexOf(lean) >= 0) {
      const at = sh.indexOf(lean);
      if (at > 0) { sh.splice(at, 1); sh.unshift(lean); }
    }
    const count = { tian: 1, shuang: 2, san: 3, si: 4, wei: 5 }[lg.id];
    let els;
    if (lg.id === 'yi') {
      const yi = ['雷', '风', '冰'];
      els = [yi[Math.floor(next() * yi.length)]];
    } else els = sh.slice(0, count);
    const wx = clamp(3 + Math.floor(next() * 5) + (next() < 0.12 ? 2 : 0), 1, 10);
    const luck = Math.floor(next() * 6);
    return { lg: copyLg(lg), els: els, wx: wx, luck: luck };
  }
  function legacyWx() {
    try {
      if (typeof Samsara === 'undefined' || !Samsara.peekLegacy) return 0;
      const leg = Samsara.peekLegacy();
      if (!leg || leg.naihe) return 0;
      return Math.min(2, leg.wx | 0);
    } catch (e) { return 0; }
  }
  function emptyDraft(seed, lean) {
    const s = seed == null ? ((Date.now() ^ ((Math.random() * 0x100000000) | 0)) >>> 0) : (seed >>> 0);
    const draft = {
      seed: s, lean: lean || '', sex: '', grab: '', six: '', ten: '', root: '', path: '',
      org: '', mate: 'any', name: '', lei: null, gold: '', _created: 0,
    };
    draft.base = rollBase(draft.seed, draft.lean);
    return draft;
  }
  function genguOf(d) { return (d.grab === 'sword' ? 6 : 0) + (d.six === 'pill' ? 5 : 0); }
  function canLei(d) { return genguOf(d) >= 5; }
  function resolveLei(d) {
    if (d.lei) return d.lei;
    const next = rng(d.seed ^ 0x51e1);
    const g = genguOf(d);
    const p = Math.min(0.85, 0.55 + Math.max(0, g - 5) * 0.08);
    d.lei = { p: Math.round(p * 100) / 100, ok: next() < p, g: g };
    return d.lei;
  }
  function resolveGold(d) {
    if (d.gold) return d.gold;
    const ids = ['jian', 'lingjue', 'fuxing', 'qihai', 'zhishui'];
    const next = rng(d.seed ^ 0x90d1);
    d.gold = ids[Math.floor(next() * ids.length)];
    return d.gold;
  }
  function bias(els, el) {
    const out = [el];
    for (let i = 0; i < els.length; i++) {
      if (els[i] !== el && out.length < els.length) out.push(els[i]);
    }
    const pool = ['金', '木', '水', '火', '土'];
    for (let i = 0; i < pool.length && out.length < Math.max(els.length, 1); i++) {
      if (out.indexOf(pool[i]) < 0) out.push(pool[i]);
    }
    return out.slice(0, Math.max(els.length, 1));
  }
  function band(lg, wx, d, gold) {
    let tier = 1;
    if (!lg) return 0;
    if (lg.id === 'wei' || lg.id === 'si') tier = 0;
    else if (lg.id === 'tian' || lg.id === 'yi') tier = 2;
    const strong = wx >= 8 || (d.grab === 'almanac' && d.six === 'book') || gold === 'lingjue';
    const weak = wx <= 4 && d.six !== 'book' && gold !== 'lingjue';
    if (strong && tier < 2) tier += 1;
    if (weak && tier > 0 && lg.id !== 'tian') tier -= 1;
    if (lg.id === 'wei') tier = 0;
    return tier;
  }
  function resolve(d) {
    const base = d.base;
    let lg = copyLg(base.lg);
    let els = base.els.slice();
    let lei = null;
    if (d.root === 'fire') {
      els = lg.id === 'yi' ? ['火'] : bias(els, '火');
    } else if (d.root === 'water') {
      els = lg.id === 'yi' ? ['冰'] : bias(els, '水');
    } else if (d.root === 'lei') {
      lei = resolveLei(d);
      if (lei.ok) {
        lg = copyLg(LINGGEN.filter(row => row.id === 'yi')[0]);
        els = ['雷'];
      }
    }
    const gold = d.grab === 'air' ? resolveGold(d) : '';
    let wxAdd = 0;
    if (d.grab === 'almanac') wxAdd += 2;
    if (d.six === 'book') wxAdd += 1;
    if (gold === 'lingjue') wxAdd += 2;
    let luckAdd = 0;
    if (d.grab === 'jade') luckAdd += 5;
    if (gold === 'fuxing') luckAdd += 3;
    let lifeAdd = 0;
    if (d.sex === 'm') lifeAdd += 4;
    if (d.grab === 'sword') lifeAdd += 15;
    if (gold === 'qihai') lifeAdd += 12;
    if (d.path === 'dust') lifeAdd -= 20;
    let xjAdd = 0;
    if (d.six === 'pill') xjAdd += 8;
    if (d.ten === 'watch') xjAdd += 4;
    if (d.ten === 'skin') xjAdd -= 4;
    if (lei && !lei.ok) xjAdd += 10;
    if (gold === 'zhishui') xjAdd += 12;
    const injAdd = lei && !lei.ok ? 2 : 0;
    let lsAdd = 0;
    if (d.grab === 'jade') lsAdd += 60;
    if (d.ten === 'free' && d.grab !== 'air') lsAdd -= 2;
    const shen = (d.sex === 'f' ? 3 : 0) + (d.ten === 'watch' ? 5 : 0) + (gold === 'lingjue' ? 4 : 0);
    const tipo = d.grab === 'sword' ? 6 : 0;
    const shenfa = d.six === 'run' ? 5 : 0;
    const qixue = (d.sex === 'm' ? 4 : 0) + (d.grab === 'sword' ? 15 : 0);
    const wxFinal = clamp(base.wx + wxAdd + legacyWx(), 1, 10);
    const tier = band(lg, wxFinal, d, gold);
    const free = d.path !== 'sect';
    let org = '';
    if (!free) {
      org = lg.id === 'wei' ? 'sx' : (d.org || 'qm');
      if (lg.id !== 'wei' && ['qm', 'dx', 'yy', 'xj'].indexOf(org) < 0) org = 'qm';
    }
    return {
      lg: lg, els: els, lei: lei, gold: gold,
      wxAdd: wxAdd, luckAdd: luckAdd, lifeAdd: lifeAdd, xjAdd: xjAdd, injAdd: injAdd,
      lsAdd: lsAdd, lsZero: d.grab === 'air',
      shen: shen, tipo: tipo, gengu: genguOf(d), shenfa: shenfa, qixue: qixue,
      tier: tier, free: free, org: org,
      origin: ORIGIN[d.grab] || 'qingshi',
    };
  }
  function guide(d) {
    if (d.ten === 'skin') return 'rogue';
    if (d.ten === 'free' || d.six === 'book' || d.six === 'run') return 'dust';
    return 'sect';
  }
  function rankWord(org, tier) {
    if (!org || typeof ORGS === 'undefined' || !ORGS[org]) return '逍遥散修';
    const rank = tier >= 2 ? 3 : tier;
    return ORGS[org].ranks[rank] || '弟子';
  }
  function pathLine(d, r) {
    if (d.path === 'rogue') return '散修。仇家悬赏，后山有一座不示人的洞';
    if (d.path === 'dust') return '红尘残宝。寿元被天道盯着';
    const o = (typeof ORGS !== 'undefined' && ORGS[r.org]) ? ORGS[r.org] : null;
    const name = o ? o.name : '宗门';
    const word = rankWord(r.org, r.tier);
    if (r.tier >= 2) return name + ' · ' + word + '（破格亲传）';
    return name + ' · ' + word;
  }
  function signed(n) { return (n > 0 ? '+' : '') + n; }
  function verse(d, name) {
    const who = name || '你';
    const sex = d.sex === 'f' ? '坤灵之身' : '元阳之身';
    const born = { jade: '生于商贾世家', sword: '生于寒门将门', almanac: '生于书香门第', air: '生来袖中无物' }[d.grab] || '生于凡尘';
    const grab = { jade: '周岁抓得古玉', sword: '幼时抓得断剑', almanac: '周岁抓得黄历', air: '周岁抓空而笑' }[d.grab] || '';
    const six = { book: '六岁接过无字天书', pill: '六岁讨得洗髓糖丸', run: '六岁吐舌跑开' }[d.six] || '';
    const ten = { free: '十岁买狐放生', skin: '十岁剥取得皮', watch: '十岁冷眼旁观' }[d.ten] || '';
    let root = '十四岁走向火海';
    if (d.root === 'water') root = '十四岁潜入寒潭';
    else if (d.root === 'lei') root = (d.lei && d.lei.ok) ? '十四岁于雷夜悟得雷根' : '十四岁引雷未成，暗伤入骨';
    const end = { sect: '今满十六，踏上测灵台', rogue: '今满十六，家门已破，独自入山', dust: '今满十六，携残宝走入红尘' }[d.path] || '今满十六';
    return who + '，' + born + '，' + sex + '。' + grab + '，' + six + '，' + ten + '，' + root + '。' + end + '。此去仙途渺渺，是化龙九天，还是冢中枯骨，皆在一念之间。';
  }
  function sheet(d) {
    const r = resolve(d);
    const lines = [];
    lines.push('灵根 ' + r.els.join('') + r.lg.name);
    if (r.wxAdd) lines.push('悟性 ' + signed(r.wxAdd));
    if (r.luckAdd) lines.push('气运 ' + signed(r.luckAdd));
    if (r.lifeAdd) lines.push('寿元 ' + signed(r.lifeAdd) + '年');
    if (r.xjAdd) lines.push('心境 ' + signed(r.xjAdd));
    if (r.injAdd) lines.push('暗伤 ' + r.injAdd);
    if (r.shen) lines.push('神识 ' + r.shen);
    if (r.tipo) lines.push('体魄 ' + r.tipo);
    if (r.gengu) lines.push('根骨 ' + r.gengu);
    if (r.shenfa) lines.push('身法 ' + r.shenfa);
    let stones = 20 + (r.origin === 'shijia' ? 28 : 0);
    if (r.lsZero) stones = 0;
    else stones = Math.max(0, stones + r.lsAdd);
    lines.push('随身灵石 ' + stones);
    if (d.grab === 'sword' || r.gold === 'jian') lines.push('学会 铁剑旧抄');
    if (d.ten === 'skin') lines.push('物品 百年狐皮');
    if (r.gold && GOLD[r.gold]) lines.push('先天 ' + GOLD[r.gold]);
    lines.push(pathLine(d, r));
    return { verse: verse(d, d.name || '你'), lines: lines, tier: r.tier, org: r.org, free: r.free };
  }
  function pack(d) {
    const r = resolve(d);
    return {
      roll: { lg: d.base.lg, els: d.base.els.slice(), wx: d.base.wx, luck: d.base.luck, ming: d },
      choice: r.free ? { id: 'free' } : { id: r.org || 'qm' },
      origin: r.origin,
    };
  }
  function settleRank(s, tier) {
    if (!s.sect || !s.sect.org || typeof ORGS === 'undefined' || !ORGS[s.sect.org]) return;
    const org = ORGS[s.sect.org];
    s.sect.rank = tier >= 2 ? 3 : tier;
    s.sect.master = tier >= 2;
    if (org.mentor && s.npc && s.npc[org.mentor]) s.npc[org.mentor].met = !!s.sect.master;
  }
  function fabaoOf(d, s) {
    let name = '残破戒指';
    let seal = '戒';
    let flavor = '戒内有一缕不肯散的神识。它会随你祭炼长大，眼下只剩一点温热。';
    if (d.ten === 'free') {
      name = '报恩珠'; seal = '珠';
      flavor = '灵狐留下的珠。残，但是活的。祭炼一次，它就亮一分。';
    } else if (d.six === 'book') {
      name = '无字戒'; seal = '戒';
      flavor = '戒面没有字。太虚的人说，字要你自己走出来。';
    }
    return {
      id: 'ming_' + seal, name: name, seal: seal, stage: 0, bond: 2,
      el: (s.lgEls || [])[0] || null, gfId: s.gf || null, flavor: flavor,
    };
  }
  function apply(s, d) {
    if (!s || !d) return { ok: false, err: '空' };
    s.flags = s.flags || {};
    if (s.flags.mingApplied) return { ok: true, dup: true };
    const r = resolve(d);
    s.lg = { id: r.lg.id, name: r.lg.name, mult: r.lg.mult, bt: r.lg.bt, sect: r.lg.sect };
    s.lgEls = r.els.slice();
    s.wx = clamp((s.wx | 0) + r.wxAdd, 1, 10);
    s.luck = clamp((s.luck | 0) + r.luckAdd, -5, 10);
    s.xj = clamp((s.xj | 0) + r.xjAdd, 0, 100);
    s.lifeBonus = (s.lifeBonus || 0) + r.lifeAdd;
    if (r.injAdd) s.inj = (s.inj | 0) + r.injAdd;
    if (r.lsZero) s.ls = 0;
    else s.ls = Math.max(0, (s.ls | 0) + r.lsAdd);
    if (d.ten === 'skin') s.items['百年狐皮'] = (s.items['百年狐皮'] || 0) + 1;
    const wantSword = d.grab === 'sword' || r.gold === 'jian';
    if (wantSword && typeof Core !== 'undefined' && !s.gfs.tiejian) Core.learn(s, 'tiejian');
    if (d.grab === 'sword' && r.gold === 'jian' && s.gfs.tiejian && s.gfs.tiejian.lv < 2) s.gfs.tiejian.lv = 2;
    const tier = band(r.lg, s.wx, d, r.gold);
    if (!r.free) settleRank(s, tier);
    if (d.path === 'dust' && !s.fabao) {
      s.fabao = fabaoOf(d, s);
      s.flags.fabao = 1;
    }
    s.ming = {
      on: 1, sex: d.sex, grab: d.grab, six: d.six, ten: d.ten, root: d.root, path: d.path,
      org: r.org || '', gold: r.gold || '',
      leiOk: r.lei && r.lei.ok ? 1 : 0, leiTried: d.root === 'lei' ? 1 : 0,
      shen: r.shen, tipo: r.tipo, gengu: r.gengu, shenfa: r.shenfa, qixue: r.qixue,
      fuyuan: d.grab === 'jade' ? 5 : 0,
      study: d.grab === 'almanac' ? 1 : 0, clean: d.six === 'pill' ? 1 : 0, swift: d.six === 'run' ? 1 : 0,
      fire: d.root === 'fire' ? 1 : 0, water: d.root === 'water' ? 1 : 0,
      bounty: d.path === 'rogue' ? 1 : 0, cave: d.path === 'rogue' ? 1 : 0, dust: d.path === 'dust' ? 1 : 0,
      coat: d.ten === 'skin' ? 1 : 0, taixu: d.six === 'book' ? 1 : 0,
      cruel: d.ten === 'skin' ? 1 : 0, kind: d.ten === 'free' ? 1 : 0, neutral: d.ten === 'watch' ? 1 : 0,
      band: tier, qinchuan: tier >= 2 ? 1 : 0, dualAsk: 0,
      verse: verse(d, s.name),
      applied: { wx: r.wxAdd, luck: r.luckAdd, life: r.lifeAdd, xj: r.xjAdd, inj: r.injAdd, ls: r.lsZero ? 0 : r.lsAdd, lsZero: r.lsZero ? 1 : 0 },
    };
    if (d.sex === 'm') s.flags.mingMale = 1;
    if (d.sex === 'f') s.flags.mingFemale = 1;
    if (d.six === 'book') s.flags.taixu = 1;
    if (d.ten === 'free') s.flags.foxDebt = 1;
    if (d.path === 'rogue') s.flags.mingBounty = 1;
    if (d.path === 'dust') s.flags.mingDust = 1;
    if (typeof Life !== 'undefined' && Life.plant && d.ten === 'free') {
      Life.plant(s, { id: 'mingfox', who: '灵狐', kind: 'spare', line: '十岁那年，你买下灵狐放生', years: 4 });
    } else if (typeof Life !== 'undefined' && Life.tint && d.ten === 'skin') {
      Life.tint(s, -10);
    }
    if (d.path === 'rogue' && typeof karmaPlant === 'function') karmaPlant(s, 'ming_bounty', 1, { name: '悬赏客' });
    if (typeof Core !== 'undefined') Core.sync(s);
    s.flags.mingApplied = 1;
    return { ok: true, tier: tier };
  }
  function logs(s) {
    const m = s && s.ming;
    if (!m || !m.on) return [];
    const a = m.applied || {};
    const bits = [];
    if (a.life) bits.push('寿元 ' + signed(a.life) + '年');
    if (a.wx) bits.push('悟性 ' + signed(a.wx));
    if (a.luck) bits.push('气运 ' + signed(a.luck));
    if (a.xj) bits.push('心境 ' + signed(a.xj));
    if (a.inj) bits.push('暗伤 ' + a.inj);
    if (m.shen) bits.push('神识 ' + m.shen);
    if (a.lsZero) bits.push('灵石空手');
    else bits.push('随身灵石 ' + (s.ls | 0));
    if (m.gold && GOLD[m.gold]) bits.push('先天「' + GOLD[m.gold] + '」');
    if (m.qinchuan) bits.push('测灵破格，记为亲传');
    else if (m.path === 'sect') bits.push('测灵入门');
    if (m.bounty) bits.push('仇家的画影已经贴出去了');
    if (m.dust) bits.push('本命物还残着，寿元却先紧了');
    return [
      { title: '命册', text: m.verse || '', cls: 'gold' },
      { title: '入册', text: bits.join('。') + '。', cls: 'sys' },
    ];
  }
  function ensure(s) {
    if (!s) return s;
    if (!s.ming || typeof s.ming !== 'object') s.ming = { on: 0 };
    else if (s.ming.on == null) s.ming.on = 0;
    return s;
  }
  function randName() {
    const x = (typeof NAMES_XING !== 'undefined' && NAMES_XING.length) ? NAMES_XING : ['沈'];
    const m = (typeof NAMES_MING !== 'undefined' && NAMES_MING.length) ? NAMES_MING : ['清辞'];
    const next = rng((Date.now() ^ 0x51c4) >>> 0);
    return x[Math.floor(next() * x.length)] + m[Math.floor(next() * m.length)];
  }
  function on(s) { return !!(s && s.ming && s.ming.on); }
  function install() {
    if (typeof EVENTS === 'undefined' || EVENTS.some(e => e && e.id === 'ming_bounty')) return;
    EVENTS.push(
      { id: 'ming_bounty', title: '仇家悬赏', seal: '赏', w: 12, once: true, rm: [0, 2],
        cond: s => on(s) && !!s.ming.bounty,
        text: s => {
          if (typeof Core !== 'undefined' && Core.showFoe) Core.showFoe(s, { rel: 0 }, { name: '悬赏客', title: '画影图形' });
          return '城门口新贴了一张画影图形，眉眼像你。树下两个人把斗笠压得很低，茶是凉的。';
        },
        choices: () => [
          { label: '从檐下走', sub: '凭身法', act: s => {
            const sf = (s.ming && s.ming.shenfa) || 0;
            const ok = Math.random() < Math.min(0.9, 0.35 + sf * 0.08);
            if (typeof karmaTake === 'function') karmaTake(s, 'ming_bounty');
            return ok
              ? { text: '你从檐影里穿过。他们看见的只是衣角。', fx: { xj: 2 } }
              : { text: '巷口有人伸腿。你没被抓住，步子乱了。', fx: { xj: -2 } };
          } },
          { label: '迎上去', sub: '生死', odds: s => 0.48 + ((s.ming && s.ming.tipo >= 6) ? 0.08 : 0),
            act: s => {
              const res = Core.fightAct(s, {
                name: '悬赏客',
                base: 0.48 + ((s.ming && s.ming.tipo >= 6) ? 0.08 : 0),
                win: { text: '斗笠滚进沟里。你没有追。告示还在，人先走了。', fx: { ls: 8, xj: 2 } },
                lose: { text: '你被压在墙根。他们割走一缕头发，说下回按图来。', fx: { inj: 2, xj: -4 } },
              });
              if (typeof karmaTake === 'function') karmaTake(s, 'ming_bounty');
              return res;
            } },
        ] },
      { id: 'ming_cave', title: '后山石洞', seal: '洞', w: 12, once: true, rm: [0, 1],
        cond: s => on(s) && !!s.ming.cave,
        text: () => '后山那道裂隙还在。你侧身钻进去，里面有一张石榻，榻下压着一只旧袋。洞口的风进不来。',
        choices: () => [
          { label: '把这里当成落脚', act: s => { s.flags.mingCaveHome = 1; return { text: '你把旧袋收了，石门仍掩着。这地方不写在任何帖上。', fx: { ls: 18, lsRaw: true, xj: 4 } }; } },
          { label: '只看一眼就走', act: () => ({ text: '你记住了石纹。洞还在，你先不住。', fx: { xj: 1 } }) },
        ] },
      { id: 'ming_scroll', title: '染血残卷', seal: '卷', w: 10, once: true, rm: [0, 1],
        cond: s => on(s) && s.ming.path === 'rogue',
        text: () => '那本从火里抢出来的残卷，血已经干了。字还在，像有人把命写到一半。',
        choices: () => [
          { label: '照着练一夜', act: () => ({ text: '你把残卷摊在膝上。吐纳歪了几次，天亮时终于顺了一寸。心口却空了一块。', fx: { xw: 0.16, xj: -3 } }) },
          { label: '收进夹层', act: () => ({ text: '你把卷子夹进衣里。字还在，今天先不读。', fx: { xj: 2 } }) },
        ] },
      { id: 'echo_mingfox', title: '灵狐报恩', seal: '狐', w: 8, once: true, rm: [0, 2],
        cond: s => {
          if (!on(s) || !s.ming.kind || typeof Life === 'undefined' || !Life.deed) return false;
          const deed = Life.deed(s, 'mingfox');
          return !!(deed && !deed.done && s.months >= deed.due);
        },
        text: () => '枕边多了一只暖袋。袋口没有字，只有一根白毛。十岁那年的林子，忽然近了。',
        choices: () => [
          { label: '收下', act: s => {
            if (typeof Life !== 'undefined' && Life.seal) Life.seal(s, 'mingfox');
            const fx = { ls: 24, lsRaw: true, xj: 4 };
            fx.item = (s.items['古剑残片'] > 0) ? { '聚气丹': 2 } : { '古剑残片': 1 };
            return { text: '袋里是温的。你把它收进怀里。林子里没有第二声。', fx: fx };
          } },
          { label: '放回枕边', act: s => {
            if (typeof Life !== 'undefined' && Life.seal) Life.seal(s, 'mingfox');
            return { text: '你把袋子放回原处。天亮时袋子还在，里面空了。白毛却留在你袖上。', fx: { xj: 2 } };
          } },
        ] },
      { id: 'ming_cruel', title: '狐皮', seal: '皮', w: 8, once: true, rm: [0, 2],
        cond: s => on(s) && !!s.ming.cruel,
        text: () => '有人看见你肩上的狐皮，笑了一声。「这路子，暗处更好走。」',
        choices: () => [
          { label: '把皮披紧', act: s => {
            if (s.ming) s.ming.moStep = 1;
            s.flags.mingMo = 1;
            return { text: '你把皮领竖起来。那人不再笑，只留下一句：幽荧殿的门，夜里开。', fx: { xw: 0.1, xj: -6 } };
          } },
          { label: '把皮收进包袱', act: () => ({ text: '你把皮卷起来。暖还在，人先不认这门路。', fx: { xj: 1 } }) },
        ] },
      { id: 'ming_read', title: '夜识', seal: '识', w: 8, once: true, rm: [0, 2],
        cond: s => on(s) && !!s.ming.neutral,
        text: () => '夜里你没有点灯。神识自己铺开一掌宽，又想收回来。',
        choices: () => [
          { label: '顺着看完', act: s => {
            const sh = (s.ming && s.ming.shen) || 0;
            return { text: '你看见院里的井，和井上的风。没有多的东西，可你记住了风从哪边来。', fx: { xw: 0.08 + Math.min(6, sh) * 0.01, xj: 2 } };
          } },
          { label: '闭上', act: () => ({ text: '你把神识收回眉心。夜还是夜。', fx: { xj: 3 } }) },
        ] },
      { id: 'ming_taixu', title: '太虚灯', seal: '虚', w: 8, once: true, rm: [0, 2],
        cond: s => on(s) && !!s.ming.taixu,
        text: () => '渡口站着一个背酒壶的人。他说太虚宗不收你，只把一盏灯放在你要走的方向。',
        choices: () => [
          { label: '顺着灯走', act: s => { s.flags.taixuMet = 1; return { text: '灯灭的地方有一块平石。你在石上坐了一夜，吐纳顺了一寸。', fx: { xw: 0.15, btBuff: 0.02 } }; } },
          { label: '只记下名号', act: s => { s.flags.taixuMet = 1; return { text: '你把太虚两个字记在袖口。人已经不在了。', fx: { xj: 2 } }; } },
        ] },
      { id: 'ming_road', title: '山脊', seal: '脊', w: 8, once: true, rm: [0, 2],
        cond: s => on(s) && !!s.ming.swift,
        text: () => '关前要路引。你看了一眼山脊，山脊比关口近。',
        choices: () => [
          { label: '从山脊绕开', act: s => {
            const sf = (s.ming && s.ming.shenfa) || 0;
            const ok = Math.random() < Math.min(0.92, 0.4 + sf * 0.08);
            return ok
              ? { text: '你从松根上过去。关里的人还在喊下一个。', fx: { xj: 3, luck: 1 } }
              : { text: '松根滑了一下。你还是绕开了，只是鞋里进了土。', fx: { xj: 1 } };
          } },
          { label: '排队过关', act: () => ({ text: '你排到日落。路引是空的，守关的人挥挥手。', fx: { time: 1 } }) },
        ] },
      { id: 'ming_sky', title: '天劫注视', seal: '劫', w: 9, once: true, rm: [0, 1],
        cond: s => on(s) && !!s.ming.dust,
        text: () => '天边像有一只眼睛。它不闭。你记得有人说过：留在原地，寿元不会宽限。',
        choices: () => [
          { label: '低头赶路', act: () => ({ text: '你不看天。脚下一步一步，寿元的紧还在，人先往前。', fx: { xj: 2, time: 1 } }) },
          { label: '抬头回望', act: () => ({ text: '那只眼睛没有表情。你把这一眼记住了。破境时，它也许会先你一步。', fx: { xj: -3, btBuff: 0.02 } }) },
        ] },
      { id: 'ming_qian', title: '元阳', seal: '阳', w: 8, once: true, rm: [0, 2],
        cond: s => on(s) && s.ming.sex === 'm',
        text: () => '演武场边，一个青年男修把木剑递过来。「元阳之身，第一剑别用巧。」',
        choices: () => [
          { label: '对练一炷香', act: () => ({ text: '木剑磕了满手的印。他收剑：「够用了。」', fx: { xw: 0.08, xj: 2 } }) },
          { label: '问起双修', act: s => {
            if (s.ming) s.ming.dualAsk = 1;
            return { text: '他摇头：「双修不是现在。等你有了人，元阳这一脉才用得上。」', fx: { xj: 3 } };
          } },
        ] },
      { id: 'ming_dual_m', title: '元阳同修', seal: '双', w: 5, once: true, rm: [1, 4],
        cond: s => on(s) && s.ming.sex === 'm' && !!s.ming.dualAsk && !!(s.karma && s.karma.mate) && !(s.bond && s.bond.lost) && (typeof Core === 'undefined' || Core.npcAlive(s, s.karma.mate)),
        text: s => {
          const n = (typeof NPCS !== 'undefined' && s.karma && NPCS[s.karma.mate]) ? NPCS[s.karma.mate].name : '道侣';
          return n + '在你对面坐下。「你早年问过的那一门，今日可以试。」';
        },
        choices: () => [
          { label: '依元阳之法同修', act: () => ({ text: '灵气走了一个来回。不烈，只是沉。沉完，谁也没有把这事说大。', fx: { xw: 0.1, xj: 4, time: 1 } }) },
          { label: '今日只坐一会', act: () => ({ text: '你们坐到香尽。没有修为，只有呼吸齐了。', fx: { xj: 2 } }) },
        ] },
      { id: 'ming_kun', title: '坤灵', seal: '坤', w: 8, once: true, rm: [0, 2],
        cond: s => on(s) && s.ming.sex === 'f',
        text: s => {
          const org = s.sect && s.sect.org && typeof ORGS !== 'undefined' && ORGS[s.sect.org];
          if (org) return org.name + '的廊下，一位师姐叫住你。「坤灵之体，不必学别人的步子。」';
          return '路上一位女修叫住你。「坤灵之体，路可以自己走，不必先找一座山。」';
        },
        choices: s => {
          const inSect = !!(s.sect && s.sect.org);
          return [
            { label: inSect ? '听她讲这一支' : '听她讲完', act: () => ({
              text: inSect ? '她把一套吐纳按在你脉上。执事后来给你记了一笔。' : '她讲完就走，留下一包宁神花。',
              fx: inSect ? { xj: 4, gx: 12, item: { '宁神花': 1 } } : { xj: 4, ls: 12, lsRaw: true, item: { '宁神花': 1 } },
            }) },
            { label: '道谢离开', act: () => ({ text: '你拱手。她点点头，没有追。', fx: { xj: 2 } }) },
          ];
        } }
    );
  }
  install();
  return {
    GOLD: GOLD, emptyDraft: emptyDraft, gengu: genguOf, canLei: canLei, resolveLei: resolveLei,
    resolveGold: resolveGold, resolve: resolve, guide: guide, sheet: sheet, pack: pack, apply: apply,
    logs: logs, ensure: ensure, verse: verse, randName: randName, rankWord: rankWord,
  };
})();
if (typeof window !== 'undefined') window.__mingge = Mingge;
