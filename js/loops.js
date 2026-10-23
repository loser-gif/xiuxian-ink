/* 墨仙录 · v1.1 道基循环与符箓
   资源只记在 s.loop，不进 traitBag，不进轮回。
   阵基、体基按设计写全；剑、丹、魔、器各一条轻循环，再加大选。 */
'use strict';
const Loop = (() => {
  const ZHEN = {
    kun: { name: '困', ke: ['追兵', '妖兽围山'], bei: ['心魔', '灵脉暴动'] },
    sheng: { name: '生', ke: ['灵脉', '药园', '伤患'], bei: ['劫修火攻'] },
    sha: { name: '杀', ke: ['清剿', '血雾', '边境'], bei: ['同门', '京城宴会'] },
    cang: { name: '藏', ke: ['夜巡', '查案', '赶路遇伏'], bei: ['大比', '讲经'] },
  };
  const FU = { gui: '镇鬼符', jing: '静心符', lu: '路引', xian: '显形符' };
  const GUI_EV = { shoushan: 1, xw_mist: 1, xw_altar: 1, 'm_shoushan': 1, 'mj:白骨荒原': 1 };
  const LU_EV = { husong: 1, heifeng: 1, 'm_husong': 1 };
  const XIAN_EV = { chaan: 1, 'm_chaan': 1 };

  function empty() {
    return {
      tut: 0,
      jian: 0, jianAt: -99999, jianAsk: '',
      ti: 0, tiAt: -99999, tiAsk: 0,
      zhen: '', zhenAt: -99999, zhenBan: 0, zhenAsk: '',
      flow: {}, zhenKeep: 0, moRefusal: 0, qiReply: 0,
      mo: 0, moAt: -99999, moQuiet: 0, moPing: 0, moCut: 0, moBt: 0, moHeart: 0,
      lu: 0, luBoom: 0, luAt: -99999, luAsk: '',
      qiMem: '', qiMute: 0, qiAsk: '', qiAt: -99999,
      fu: { gui: 0, jing: 0, lu: 0, xian: 0 }, fuKnown: 0, fuJingAt: -99999,
    };
  }
  function ensure(s) {
    if (!s.loop) s.loop = empty();
    const e = empty();
    Object.keys(e).forEach(k => { if (s.loop[k] == null) s.loop[k] = e[k]; });
    if (!s.loop.fu) s.loop.fu = { gui: 0, jing: 0, lu: 0, xian: 0 };
    ['gui', 'jing', 'lu', 'xian'].forEach(k => { if (typeof s.loop.fu[k] !== 'number') s.loop.fu[k] = 0; });
    return s.loop;
  }
  function resetDaoji(s) {
    const L = ensure(s);
    L.flow = {}; L.zhenKeep = 0; L.moRefusal = 0; L.qiReply = 0;
    L.jian = 0; L.jianAsk = '';
    L.ti = 0; L.tiAsk = 0;
    L.zhen = ''; L.zhenAsk = ''; L.zhenBan = 0;
    L.mo = 0; L.moCut = 0; L.moBt = 0; L.moHeart = 0; L.moPing = 0; L.moQuiet = 0;
    L.lu = 0; L.luBoom = 0; L.luAsk = '';
    L.qiMem = ''; L.qiMute = 0; L.qiAsk = '';
  }
  function mul(s) {
    const cf = typeof courtFriction === 'function' ? (courtFriction(s).time || 1) : 1;
    return (Core.gt(s, 'time', 1) || 1) * cf;
  }
  function seasonOf(s) {
    const T = (REALMS[s.realm] && REALMS[s.realm].T) || 1;
    return Math.max(1, Math.round(3 * T * mul(s)));
  }
  function dur(n) { return n === 3 ? '三个月' : cnDur(n); }
  function spend(s, shown, emit) {
    const m = mul(s) || 1;
    Core.passTime(s, shown / m, emit);
    return shown;
  }
  function due(at, s, gap) {
    return s.months >= (at || -99999) + gap;
  }
  function locName(s) {
    if (typeof LOC !== 'undefined' && s.loc && LOC[s.loc]) return LOC[s.loc].name;
    return '';
  }
  function door(s) {
    if (s.xj < 40) return '心魔';
    if (s.inj > 0) return '伤患';
    if (s.sect && s.sect.dabiDue) return '大比';
    const id = s.loc;
    if (id === 'xuewu') return '血雾';
    if (id === 'heifeng') return '赶路遇伏';
    if (id === 'jingcheng') return '京城宴会';
    if (id === 'yunyue') return '药园';
    if (id === 'shanmen' || id === 'qingshi') return '夜巡';
    return '妖兽围山';
  }
  function zhenHit(form, name) {
    const row = ZHEN[form];
    if (!row) return 'ping';
    if (row.ke.indexOf(name) >= 0) return 'ke';
    if (row.bei.indexOf(name) >= 0) return 'bei';
    return 'ping';
  }
  function zhenWait(s, L, cost) {
    const left = Math.max((L.zhenAt || -99999) + cost, L.zhenBan || 0) - s.months;
    return left > 0 ? `还需${dur(Math.ceil(left))}可再布。` : '现在可布阵。';
  }
  function zhenUse(form) {
    if (form === 'sheng') return '生阵可在宗门镇脉时降低失败风险；遇地底灵脉可养伤，遇灵脉将枯可疏脉分给山下。仍需亲自遇见这些事。';
    if (form === 'sha') return '持有杀阵时，血雾谷坛前多出「走到坛前改阵」，仍需亲自游历遇见。';
    if (form === 'kun') return '困阵可在劫修拦路时困住追兵脱身，不算击败对手，不得战利。';
    if (form === 'cang') return '藏阵可在拍卖后的夜路隐去行迹；也可潜过黑风岭护送商队，不领清剿赏格。';
    return '';
  }
  function carried(s) {
    const f = ensure(s).fu;
    return (f.gui || 0) + (f.jing || 0) + (f.lu || 0) + (f.xian || 0);
  }
  function takeFu(s, k) {
    const f = ensure(s).fu;
    if (!(f[k] > 0)) return false;
    f[k]--;
    return true;
  }
  function pillKey(s) {
    const names = ['回春丹', '聚气丹', '清心丹', '破障丹', '延寿丹'];
    if (REALMS[s.realm] && s.items[REALMS[s.realm].pill] > 0) return REALMS[s.realm].pill;
    for (let i = 0; i < names.length; i++) if (s.items[names[i]] > 0) return names[i];
    return '';
  }
  function recipeId(s) {
    if (!s.dan || !s.dan.rec || typeof RECIPES === 'undefined' || typeof Jianghu === 'undefined') return '';
    for (let i = 0; i < s.dan.rec.length; i++) {
      const id = s.dan.rec[i];
      if (RECIPES[id] && Jianghu.hasHerbs(s, id)) return id;
    }
    return '';
  }
  function junkKey(s) {
    const skip = { '筑基丹': 1, '凝元丹': 1, '化婴丹': 1, '渡劫丹': 1, '飞升丹': 1, '回春丹': 1, '聚气丹': 1, '清心丹': 1, '破障丹': 1, '延寿丹': 1, '兵解玉符': 1 };
    const keys = Object.keys(s.items || {});
    for (let i = 0; i < keys.length; i++) if (s.items[keys[i]] > 0 && !skip[keys[i]]) return keys[i];
    return '';
  }
  function lifeCost(s, base) { return Core.scaleLife(s, base); }
  function lsCost(s, base) { return Core.scaleLs(s, base); }

  function html(s) {
    if (!s || !s.path) return '';
    const L = ensure(s);
    const bits = [];
    if (!L.tut) {
      bits.push(s.path.daoji === 'zhen' ? '<p class="loop-tut">布阵花费与等待时间写在下方，按境界计算，不随春夏秋冬刷新。不做，就去闭关或游历。</p>' : '<p class="loop-tut">这季可以做一次，不做也没有罚。花费写在按钮上，结算用的就是这个数。不做，就去闭关或游历。</p>');
    }
    const dj = s.path.daoji;
    if (s.gf && GONGFA[s.gf].style === dj) bits.push('<p class="loop-note">主修与道基同流：每三次日常循环多一笔，不加行功速度。剑意、体魄和求问多一；阵图可免一次被克清空；魔多一次拒绝余音；器多一句回答。</p>');
    if (s.realm >= 1 && dj) bits.push(panel(s, L, dj));
    if (L.fuKnown) bits.push(fuPanel(s, L));
    return bits.join('');
  }
  function panel(s, L, dj) {
    if (dj === 'zhen') return zhenPanel(s, L);
    if (dj === 'ti') return tiPanel(s, L);
    if (dj === 'jian') return jianPanel(s, L);
    if (dj === 'dan') return danPanel(s, L);
    if (dj === 'mo') return moPanel(s, L);
    if (dj === 'qi') return qiPanel(s, L);
    return '';
  }
  function btn(id, label, sub, dis) {
    return `<button type="button" class="path-wash-btn" data-loop="${id}"${dis ? ' disabled' : ''}><b>${label}</b><small>${sub}</small></button>`;
  }
  function zhenPanel(s, L) {
    const name = door(s);
    const cost = seasonOf(s);
    const banned = s.months < (L.zhenBan || 0);
    const ready = !banned && due(L.zhenAt, s, cost);
    const rows = Object.keys(ZHEN).map(k => {
      const row = ZHEN[k];
      return `<tr><td>${row.name}</td><td>${row.ke.join('、')}</td><td>${row.bei.join('、')}</td></tr>`;
    }).join('');
    const forms = Object.keys(ZHEN).map(k => {
      const hit = zhenHit(k, name);
      const result = hit === 'bei' ? (L.zhenKeep && L.zhen ? '被克 · 耗一次同流保留，旧图不失' : '被克 · 阵盘碎，旧图清空') : hit === 'ke' ? '克制 · 留下阵图' : '平势 · 留下阵图';
      return btn('zhen:' + k, ZHEN[k].name, `${dur(cost)} · 心境 −1 · ${result}`, !ready);
    }).join('');
    let big = '';
    if (s.realm >= 3 && !L.zhenAsk) {
      big = btn('zhen:sect', '把阵交给本宗', '不加贡献')
        + btn('zhen:xue', '把阵刻进血雾谷', locName(s) === '血雾谷' ? '就在此地刻下' : '阵意先寄着，到了血雾谷才刻')
        + btn('zhen:sit', '自己坐进阵眼', '收束仍是山神或镇魔，不加战力');
    }
    const hold = L.zhen ? `阵图留着「${ZHEN[L.zhen] ? ZHEN[L.zhen].name : L.zhen}」` : '尚未留阵图';
    const wait = (banned ? '阵盘待修。' : '') + zhenWait(s, L, cost);
    return `<div class="loop-block"><p class="loop-stat">罗盘 · ${hold}</p><p class="loop-note">${wait}此刻门外是${name}。</p>
      <p class="loop-note">布阵耗${dur(cost)}；完成后按当前境界再等${dur(cost)}可再布，不随春夏秋冬刷新。布成即替换旧图，被克则清空。${L.zhenKeep ? '尚有一次同流保留，可免旧图被克清空。' : ''}阵图持续留存，直到再布或洗道基。</p>
      ${L.zhen ? `<p class="loop-note">${zhenUse(L.zhen)}</p>` : ''}
      <table class="zhen-table"><tr><th>你布的</th><th>克</th><th>被克</th></tr>${rows}</table>
      <div class="loop-actions">${forms}${btn('skip', '这次不布', '去闭关或游历')}${big}</div></div>`;
  }
  function tiPanel(s, L) {
    const cost = seasonOf(s);
    const ready = due(L.tiAt, s, cost);
    const pill = pillKey(s);
    const cap = L.ti >= 6;
    let big = '';
    if (L.ti >= 6 && s.realm >= 4 && !L.tiAsk) big = btn('ti:jie', '肉身问劫', '刚劫的身死风险改回原数，不另加速');
    return `<div class="loop-block"><p class="loop-stat">体魄 ${cn(L.ti)} / 六</p>
      <div class="loop-actions">
      ${btn('ti:shi', '石', `${dur(cost)} · 体魄 +1 · 轻伤`, !ready || cap)}
      ${btn('ti:shui', '水', `${dur(cost)} · 伤愈 · 体魄不加`, !ready || s.inj <= 0)}
      ${btn('ti:huo', '火', pill ? `${dur(cost)} · 耗${pill} · 体魄 +1 · 心境 −4` : '须有一枚丹药', !ready || cap || !pill)}
      ${btn('skip', '此季不淬', '去闭关或游历')}
      ${big}</div></div>`;
  }
  function jianPanel(s, L) {
    const cost = seasonOf(s);
    const ready = due(L.jianAt, s, Math.max(12, cost));
    const sword = s.path && s.path.faxiang === 'jian' ? '剑相与剑基是同一笔锋。' : '';
    let big = '';
    if (L.jian >= 9 && s.realm >= 3 && !L.jianAsk) {
      big = btn('jian:shan', '把剑意还给山门', '不加破境')
        + btn('jian:yuan', '把剑意埋进沉剑渊', '渊心认你，不另给神器')
        + btn('jian:fei', '带着剑意飞升', '只改飞升判词');
    }
    return `<div class="loop-block"><p class="loop-stat">剑意 ${cn(L.jian)} / 九</p><p class="loop-note">${sword}对月一次，剑意加一，不加倍率。</p>
      <div class="loop-actions">${btn('jian:yue', '对月', `${dur(cost)} · 剑意 +1`, !ready || L.jian >= 9)}${btn('skip', '此季不对', '去闭关或游历')}${big}</div></div>`;
  }
  function danPanel(s, L) {
    const id = recipeId(s);
    let body = '<p class="loop-note">身上没有能开的丹方。此季便不必守炉。</p>';
    if (id && typeof Jianghu !== 'undefined') {
      const m = Jianghu.danMonths(s, id);
      const shown = Math.max(1, Math.round(m * mul(s)));
      const p = Jianghu.danChance(s, id);
      const steady = Math.min(0.92, p + 0.12);
      const ch = n => `约莫${cn(Math.max(1, Math.round(n * 10)))}成`;
      body = `<div class="loop-actions">
        ${btn('dan:cheng', '求成', `${ch(p)} · 可能炸炉 · ${dur(shown)}`)}
        ${btn('dan:wen', '求稳', `${ch(steady)} · 锁中品 · 不炸炉 · ${dur(shown)}`)}
        ${btn('dan:wenwen', '求问', `不成丹 · 材料退一半 · 心境 +4 · ${dur(shown)}`)}
        ${btn('skip', '此季不开', '去闭关或游历')}</div>`;
    }
    let big = '';
    if (L.lu >= 3 && s.realm >= 2 && !L.luAsk) {
      big = `<div class="loop-actions">${btn('dan:gui', '丹心 · 归隐偏方', '判词写炉冷了，不立刻结局')}${btn('dan:gu', '丹心 · 以丹代一阵', '记下而已，大比仍要自己赢')}</div>`;
    }
    const boom = L.luBoom ? `<p class="loop-note">炸炉已有${cn(L.luBoom)}次。</p>` : '';
    return `<div class="loop-block"><p class="loop-stat">求问 ${cn(L.lu)} / 三</p>${boom}${body}${big}</div>`;
  }
  function moPanel(s, L) {
    const cost = seasonOf(s);
    const quiet = s.months < (L.moQuiet || 0);
    const open = !quiet && (s.xj < 40 || L.moPing) && due(L.moAt, s, cost);
    const tianmo = s.gf === 'tianmo';
    const back = lifeCost(s, 12);
    let big = '';
    if (L.mo > 0 && L.mo < 3) big = btn('mo:huan', '还诺', `寿元 −${cn(back)}年 · 魔基还在，第二声安静三年`);
    if (L.mo >= 3) big += btn('mo:nuo', '应诺入魔', '心境跌到十二也会入魔。这一步是你自己点的');
    const line = L.mo >= 3 ? '诺已满。心境跌到十二，便是入魔。' : (L.mo >= 1 ? '同门说话已有些异样。' : '');
    return `<div class="loop-block"><p class="loop-stat">魔诺 ${cn(L.mo)} / 三</p><p class="loop-note">${line}${quiet ? '第二声这几年不响。' : ''}</p>
      <div class="loop-actions">
      ${btn('mo:yue', '应下第二声 · 缩短闭关', `${tianmo ? '天魔在身，月数不减 · ' : '下一回闭关月数 −20% · '}心境 −8`, !open)}
      ${btn('mo:po', '应下第二声 · 破境', '下一回破境把握 +0.03 · 心魔下次必现', !open)}
      ${btn('mo:ju', '拒绝', '心境 +3 · 修为不补偿', !open)}
      ${L.moRefusal ? btn('mo:yuyin', '以拒绝余音止声', '耗一次余音 · 第二声安静一年', !open) : ''}
      ${s.gf === 'buken' ? btn('mo:huijie', '把捷径还回去', '取消尚未用的闭关捷径 · 魔诺 −1 · 心境 +2', !L.moCut) : ''}
      ${btn('skip', '此季不听', '去闭关或游历')}
      ${big}</div></div>`;
  }
  function qiPanel(s, L) {
    if (!s.fabao) return '<div class="loop-block"><p class="loop-note">没有本命法宝，问无可问。</p></div>';
    const cost = seasonOf(s);
    const ready = due(L.qiAt, s, cost);
    const stone = lsCost(s, 12);
    const junk = junkKey(s);
    const stage = (s.fabao.stage | 0) >= 3;
    let big = '';
    if (stage && s.realm >= 4 && !L.qiAsk) {
      big = btn('qi:shou', '让它留下守山', '你飞升，器留在洞府')
        + btn('qi:fei', '人器同飞', '只改飞升题跋')
        + btn('qi:ju', '拒绝它', '祭炼倍率回到一，再喂一季才恢复');
    }
    const mem = L.qiMem === 'shi' ? '它记得你喂过灵石。' : L.qiMem === 'wu' ? '它记得那件杂物。' : L.qiMem === 'ting' ? '它记得你读过的那一句。' : '';
    const mute = L.qiMute ? '它沉默着，祭炼先按一倍算。' : '';
    return `<div class="loop-block"><p class="loop-stat">${s.fabao.name} · ${mute}</p><p class="loop-note">${mem}</p>
      <div class="loop-actions">
      ${btn('qi:shi', '喂灵石', `${dur(cost)} · 灵石 −${cn(stone)}`, !ready || s.ls < stone)}
      ${btn('qi:wu', '喂一件杂物', junk ? `${dur(cost)} · 耗${junk}` : '囊中无杂物', !ready || !junk)}
      ${btn('qi:ting', '把近事读给它', `${dur(cost)} · 不耗材料 · 羁绊只加一小截`, !ready)}
      ${btn('skip', '此季不问', '去闭关或游历')}
      ${big}</div></div>`;
  }
  function fuPanel(s, L) {
    const cost = seasonOf(s);
    const stone = lsCost(s, 8);
    const room = carried(s) < 3;
    const have = Object.keys(FU).filter(k => L.fu[k] > 0).map(k => `${FU[k]}×${cn(L.fu[k])}`).join('、') || '一张都没有';
    const draw = Object.keys(FU).map(k => btn('fu:' + k, '画' + FU[k], `${dur(cost)} · 灵石 −${cn(stone)} · 随身至多三张`, !room || s.ls < stone)).join('');
    return `<div class="loop-block"><p class="loop-stat">符箓 · ${have}</p><p class="loop-note">符不加快，也不减月数。贴对了，旧事里多一个稳妥的做法。</p><div class="loop-actions">${draw}</div></div>`;
  }

  function act(s, id, emit) {
    const L = ensure(s);
    if (id === 'skip') { L.tut = 1; return { noop: true, text: '这季便去闭关或游历。' }; }
    L.tut = 1;
    const kind = id.split(':')[0];
    const sub = id.split(':')[1];
    if (kind === 'fu') return actFu(s, L, sub, emit);
    const handler = { zhen: actZhen, ti: actTi, jian: actJian, dan: actDan, mo: actMo, qi: actQi }[kind];
    if (!handler) return { err: '没有这一笔' };
    const r = handler(s, L, sub, emit);
    if (r && !r.err && typeof People !== 'undefined') People.afterLoop(s, kind, sub, r);
    const daily = { zhen: ['kun', 'sheng', 'sha', 'cang'], ti: ['shi', 'shui', 'huo'], jian: ['yue'], dan: ['cheng', 'wen', 'wenwen'], mo: ['ju', 'yue', 'po'], qi: ['shi', 'wu', 'ting'] };
    if (!r.err && s.gf && GONGFA[s.gf].style === kind && s.path.daoji === kind && daily[kind].includes(sub)) {
      L.flow[kind] = (L.flow[kind] || 0) + 1;
      if (L.flow[kind] % 3 === 0) {
        let note = '';
        if (kind === 'jian') { const n = Math.min(1, 9 - L.jian); L.jian += n; note = n ? '同流 · 剑意再添一笔' : '同流 · 剑意已满'; }
        if (kind === 'ti') { const n = Math.min(1, 6 - L.ti); L.ti += n; note = n ? '同流 · 体魄再厚一层' : '同流 · 体魄已满'; }
        if (kind === 'dan') { L.lu++; note = '同流 · 求问多记一笔'; }
        if (kind === 'zhen') { L.zhenKeep = 1; note = '同流 · 下次被克可留住旧图'; }
        if (kind === 'mo') { L.moRefusal = Math.min(1, L.moRefusal + 1); note = '同流 · 留下一次拒绝余音'; }
        if (kind === 'qi') { L.qiReply++; note = '同流 · 器答：“你每一次回来，我都记得。”'; }
        r.text += note + '。'; r.tags = (r.tags || []).concat([{ t: note, c: 'gold' }]);
      }
    }
    return r;
  }

  function actZhen(s, L, sub, emit) {
    if (sub === 'sect' || sub === 'xue' || sub === 'sit') {
      if (L.zhenAsk) return { err: '大阵已经认过主' };
      if (s.realm < 3) return { err: '元婴之后才认主' };
      L.zhenAsk = sub;
      if (sub === 'sect') return { title: '护山', text: '你把阵交给本宗。护山的句子多了一条，贡献的算法没有改。', tags: [{ t: '护山', c: 'gold' }] };
      if (sub === 'sit') return { title: '阵眼', text: '你坐进阵眼。若有一天走山神或镇魔，判词会写成：阵在，人在。战力不加。', tags: [{ t: '坐入阵眼', c: 'gold' }] };
      if (locName(s) === '血雾谷') {
        s.flags.zhenCarved = 1;
        return { title: '刻阵', text: '你把阵刻进血雾谷的石上。北荒还远，这一笔先落在这里。', tags: [{ t: '阵刻血雾谷', c: 'gold' }] };
      }
      s.flags.zhenCarve = 1;
      return { title: '寄阵', text: '血雾谷不在脚下。阵意先寄在识海里，到了那里再刻。', tags: [{ t: '阵意寄往血雾谷', c: 'gold' }] };
    }
    const cost = seasonOf(s);
    if (s.months < (L.zhenBan || 0) || !due(L.zhenAt, s, cost)) return { err: zhenWait(s, L, cost) };
    if (!ZHEN[sub]) return { err: '没有这一式' };
    const name = door(s);
    const hit = zhenHit(sub, name);
    const shown = spend(s, cost, emit);
    s.xj = Core.clamp(s.xj - 1, 0, 100);
    L.zhenAt = s.months;
    const previous = L.zhen && ZHEN[L.zhen] ? `原「${ZHEN[L.zhen].name}」阵图已被替换。` : '';
    const tags = [{ t: dur(shown), c: 'down' }, { t: '心境 −1', c: 'down' }];
    if (hit === 'bei') {
      if (L.zhenKeep && L.zhen) {
        L.zhenKeep = 0; L.zhenBan = s.months + cost;
        return { title: '布阵 · 旧图未失', text: `新阵被克，你凭同流留下的余意护住了「${ZHEN[L.zhen].name}」旧图。保留机会已用去。${zhenWait(s, L, cost)}`, tags };
      }
      L.zhen = '';
      L.zhenBan = s.months + cost;
      return { title: '布阵 · 被克', text: `门外是${name}。${ZHEN[sub].name}阵被克，阵盘碎了，所留阵图已清空。${zhenWait(s, L, cost)}`, tags, cls: 'warn' };
    }
    L.zhen = sub;
    let extra = '';
    if (sub === 'sheng' && name === '伤患' && s.inj > 0) { s.inj = Math.max(0, s.inj - 1); extra = '伤松了一分。'; tags.push({ t: '伤势 −1', c: 'up' }); }
    const outcome = hit === 'ke' ? '此阵正好克制眼前局面。' : '此阵与眼前局面无克制关系，平势布成。';
    const benefit = extra || '本次只留阵图，没有额外修为、灵石或斗法加成。';
    return { title: hit === 'ke' ? '布阵 · 克制' : '布阵 · 平势', text: `门外是${name}。${outcome}${benefit}${previous}「${ZHEN[sub].name}」阵图已留存。${zhenUse(sub)}${zhenWait(s, L, cost)}`, tags };
  }
  function actTi(s, L, sub, emit) {
    if (sub === 'jie') {
      if (L.ti < 6 || s.realm < 4) return { err: '体魄未满，或尚未化神' };
      L.tiAsk = 1;
      return { title: '肉身问劫', text: '你把这一身交给将来的刚劫。身死的那一截风险回到原来的数，不往下再降，也不加快破境。', tags: [{ t: '肉身问劫', c: 'gold' }] };
    }
    const cost = seasonOf(s);
    if (!due(L.tiAt, s, cost)) return { err: '这一季已经淬过' };
    if (sub === 'shi') {
      if (L.ti >= 6) return { err: '体魄已满' };
      const shown = spend(s, cost, emit);
      L.tiAt = s.months; L.ti++; s.inj += 1;
      return { title: '淬身', text: '石头硌进肩胛。体魄厚了一层，也留下一块青。', tags: [{ t: dur(shown), c: 'down' }, { t: '体魄 +1', c: 'up' }, { t: '轻伤', c: 'down' }] };
    }
    if (sub === 'shui') {
      if (s.inj <= 0) return { err: '身无伤患' };
      const shown = spend(s, cost, emit);
      L.tiAt = s.months; s.inj = 0;
      return { title: '淬身', text: '水从旧伤上漫过去。痛退了，体魄没有加。', tags: [{ t: dur(shown), c: 'down' }, { t: '伤势痊愈', c: 'up' }] };
    }
    if (sub === 'huo') {
      const pill = pillKey(s);
      if (!pill) return { err: '须有一枚丹药' };
      if (L.ti >= 6) return { err: '体魄已满' };
      const shown = spend(s, cost, emit);
      L.tiAt = s.months;
      s.items[pill]--; if (s.items[pill] <= 0) delete s.items[pill];
      L.ti++;
      s.xj = Core.clamp(s.xj - 4, 0, 100);
      return { title: '淬身', text: `火借着${pill}烧过经脉。体魄加了一层，心口空了四寸。`, tags: [{ t: dur(shown), c: 'down' }, { t: '失去' + pill, c: 'down' }, { t: '体魄 +1', c: 'up' }, { t: '心境 −4', c: 'down' }] };
    }
    return { err: '没有这一淬' };
  }
  function actJian(s, L, sub, emit) {
    if (sub === 'shan' || sub === 'yuan' || sub === 'fei') {
      if (L.jian < 9 || s.realm < 3 || L.jianAsk) return { err: '剑问未到' };
      L.jianAsk = sub;
      const text = sub === 'shan' ? '你把剑意还给山门。掌门的故事里多了你一笔，破境的数没有动。'
        : sub === 'yuan' ? '你把剑意埋进黑风岭的沉剑渊。渊心认了你，没有另给你一件神器。'
        : '你决定带着剑意走。若有一日飞升，判词只改一笔，战力不加。';
      return { title: '剑问', text, tags: [{ t: '剑问', c: 'gold' }] };
    }
    const cost = seasonOf(s);
    if (!due(L.jianAt, s, Math.max(12, cost))) return { err: '还未到下一次对月' };
    if (L.jian >= 9) return { err: '剑意已满' };
    const shown = spend(s, cost, emit);
    L.jian++; L.jianAt = s.months;
    const fax = s.path && s.path.faxiang === 'jian' ? '剑相把这一式衬得更清楚，倍率仍旧不动。' : '';
    return { title: '对月', text: `月光里你走完一式。剑意至${cn(L.jian)}。它不加倍率。${fax}`, tags: [{ t: dur(shown), c: 'down' }, { t: '剑意 +1', c: 'up' }] };
  }
  function actDan(s, L, sub, emit) {
    if (sub === 'gui' || sub === 'gu') {
      if (L.lu < 3 || s.realm < 2 || L.luAsk) return { err: '丹心未到' };
      L.luAsk = sub;
      return { title: '丹心', text: sub === 'gui' ? '你把路记成归隐。真到那一天，判词会写炉冷了。现在还不结局。' : '你记下：若在丹霞争那一场，可以一炉丹代开头。剩下的场次，仍要自己赢。', tags: [{ t: '丹心', c: 'gold' }] };
    }
    const id = recipeId(s);
    if (!id) return { err: '材料或丹方不足' };
    const r = RECIPES[id];
    const m = Jianghu.danMonths(s, id);
    const shown = Math.max(1, Math.round(m * mul(s)));
    if (sub === 'cheng') {
      const res = Jianghu.craft(s, id, emit);
      if (!res) return { err: '这一炉开不成' };
      L.luAt = s.months;
      if (res.boom) {
        L.luBoom++;
        if (L.luBoom >= 3) { s.xj = Core.clamp(s.xj - 6, 0, 100); res.tags.push({ t: '丹毒 · 心境 −6', c: 'down' }); res.text += '炸炉已是第三次。丹毒沉下来，境界还在，心境少了六分。'; }
      }
      res.tags.unshift({ t: dur(shown), c: 'down' });
      return { title: '守炉', text: res.text, tags: res.tags, boom: !!res.boom, cls: res.boom ? 'warn' : '' };
    }
    Object.keys(r.need).forEach(h => {
      const n = r.need[h];
      s.items[h] -= n;
      if (sub === 'wenwen') s.items[h] += Math.floor(n / 2);
      if (s.items[h] <= 0) delete s.items[h];
    });
    spend(s, shown, emit);
    L.luAt = s.months;
    if (sub === 'wen') {
      const p = Math.min(0.92, Jianghu.danChance(s, id) + 0.12);
      if (Math.random() < p) {
        s.items[r.out] = (s.items[r.out] || 0) + 1;
        return { title: '守炉', text: '火压得很低。出来一枚中品，炉是完整的。', tags: [{ t: dur(shown), c: 'down' }, { t: '中品 · 成丹一枚', c: 'up' }] };
      }
      return { title: '守炉', text: '火候是稳的，丹没成，炉也没炸。', tags: [{ t: dur(shown), c: 'down' }, { t: '废丹', c: 'down' }] };
    }
    L.lu++;
    s.xj = Core.clamp(s.xj + 4, 0, 100);
    return { title: '守炉', text: '你没有要这炉丹。香气停在识海里，材料退回一半，不足一株的不退。', tags: [{ t: dur(shown), c: 'down' }, { t: '心境 +4', c: 'up' }, { t: '求问 +1', c: 'gold' }] };
  }
  function actMo(s, L, sub, emit) {
    if (sub === 'huijie') {
      if (s.gf !== 'buken' || !L.moCut) return { err: '没有尚未走的捷径' };
      L.moCut = 0; L.mo = Math.max(0, L.mo - 1); s.xj = Core.clamp(s.xj + 2, 0, 100);
      return { title: '第二声', text: '你把不肯经合上，将尚未走的捷径还回去。路恢复原来的长短，那一诺也不再欠着。', tags: [{ t: '捷径已还' }, { t: '魔诺 −1' }, { t: '心境 +2', c: 'up' }] };
    }
    if (sub === 'huan') {
      if (!(L.mo > 0 && L.mo < 3)) return { err: '此刻无可还' };
      const y = lifeCost(s, 12);
      s.lifeBonus -= y;
      L.mo = 0; L.moCut = 0; L.moBt = 0; L.moHeart = 0; L.moPing = 0;
      L.moQuiet = s.months + 36;
      Core.sync(s);
      return { title: '还诺', text: `你还了这一诺。寿元少了${cn(y)}年。魔基还在，第二声安静三年。这不是洗道基。`, tags: [{ t: `寿元 −${cn(y)}年`, c: 'down' }, { t: '魔诺已还', c: 'gold' }] };
    }
    if (sub === 'nuo') {
      if (L.mo < 3) return { err: '诺还没有满' };
      s.dead = true; s.ending = 'rumo';
      return { title: '应诺', text: '你应了那一声。卷上写的是入魔，不是意外。', tags: [{ t: '入魔', c: 'down' }], ending: 'rumo' };
    }
    const cost = seasonOf(s);
    if (s.months < (L.moQuiet || 0)) return { err: '第二声还安静着' };
    if (!(s.xj < 40 || L.moPing)) return { err: '这一季它没有出声' };
    if (!due(L.moAt, s, cost)) return { err: '这一季已经听过' };
    L.moAt = s.months; L.moPing = 0;
    if (sub === 'ju') {
      s.xj = Core.clamp(s.xj + 3, 0, 100);
      return { title: '第二声', text: '你没有应。心境回了三分，修为一点没补。', tags: [{ t: '心境 +3', c: 'up' }] };
    }
    if (sub === 'yuyin') {
      if (!L.moRefusal) return { err: '没有留下的拒绝余音' };
      L.moRefusal--; L.moQuiet = s.months + 12;
      return { title: '第二声', text: '你把先前未散的拒绝又说了一遍。第二声安静一年，没有补给你修为。', tags: [{ t: '余音已用 · 静一年' }] };
    }
    if (L.mo < 3) L.mo++;
    if (sub === 'yue') {
      L.moCut = 1;
      s.xj = Core.clamp(s.xj - 8, 0, 100);
      const note = s.gf === 'tianmo' ? '天魔已经在缩短月数，这一声不再减。' : '下一回闭关，月数少两成。';
      return { title: '第二声', text: `你应了。${note}心境少了八分。诺是${cn(L.mo)}。`, tags: [{ t: '心境 −8', c: 'down' }, { t: '魔诺 ' + cn(L.mo), c: 'gold' }], cls: 'warn' };
    }
    if (sub === 'po') {
      L.moBt = 1; L.moHeart = 1;
      return { title: '第二声', text: `你应了。下一回破境把握加三分里的一点，心魔下次必来。诺是${cn(L.mo)}。`, tags: [{ t: '破境把握暂 +0.03', c: 'up' }, { t: '魔诺 ' + cn(L.mo), c: 'gold' }], cls: 'warn' };
    }
    return { err: '没有这一声' };
  }
  function actQi(s, L, sub, emit) {
    if (!s.fabao) return { err: '没有本命法宝' };
    if (sub === 'shou' || sub === 'fei' || sub === 'ju') {
      if ((s.fabao.stage | 0) < 3 || s.realm < 4 || L.qiAsk) return { err: '器问未到' };
      L.qiAsk = sub;
      if (sub === 'ju') {
        L.qiMute = 1;
        return { title: '器问', text: '你拒绝了它。它沉默。祭炼倍率回到一，直到你再喂一季。', tags: [{ t: '器沉默', c: 'down' }] };
      }
      return { title: '器问', text: sub === 'shou' ? '你让它留下守山。若你飞升，器留在洞府，不拿去当因果。' : '你决定与它同飞。题跋会多一笔，战力不加。', tags: [{ t: '器问', c: 'gold' }] };
    }
    const cost = seasonOf(s);
    if (!due(L.qiAt, s, cost)) return { err: '这一季已经问过' };
    if (sub === 'shi') {
      const stone = lsCost(s, 12);
      if (s.ls < stone) return { err: '灵石不足' };
      const shown = spend(s, cost, emit);
      L.qiAt = s.months;
      if (L.qiMute) L.qiMute = 0;
      s.ls -= stone; L.qiMem = 'shi';
      Core.fabaoFeed(s, 6, emit);
      return { title: '问器', text: `你喂了${cn(stone)}灵石。它应了一声，没有长出新的属性。`, tags: [{ t: dur(shown), c: 'down' }, { t: `灵石 −${cn(stone)}`, c: 'down' }] };
    }
    if (sub === 'wu') {
      const k = junkKey(s);
      if (!k) return { err: '囊中无杂物' };
      const shown = spend(s, cost, emit);
      L.qiAt = s.months;
      if (L.qiMute) L.qiMute = 0;
      s.items[k]--; if (s.items[k] <= 0) delete s.items[k];
      L.qiMem = 'wu';
      Core.fabaoFeed(s, 4, emit);
      return { title: '问器', text: `你把${k}放了上去。它收了，下一句会记得这件事。`, tags: [{ t: dur(shown), c: 'down' }, { t: '失去' + k, c: 'down' }] };
    }
    const shown = spend(s, cost, emit);
    L.qiAt = s.months;
    if (L.qiMute) L.qiMute = 0;
    L.qiMem = 'ting';
    Core.fabaoFeed(s, 2, emit);
    const last = (s.log && s.log.length) ? (s.log[s.log.length - 1].title || '近来的一件事') : '近来的一件事';
    return { title: '问器', text: `你把「${last}」读给它听。羁绊只加了一小截。`, tags: [{ t: dur(shown), c: 'down' }] };
  }
  function actFu(s, L, sub, emit) {
    if (!L.fuKnown) return { err: '还不会画符' };
    if (!FU[sub]) return { err: '没有这种符' };
    if (carried(s) >= 3) return { err: '随身已经三张' };
    const cost = seasonOf(s);
    const stone = lsCost(s, 8);
    if (s.ls < stone) return { err: `灵石不足 · 需${stone}` };
    s.ls -= stone;
    const shown = spend(s, cost, emit);
    L.fu[sub]++;
    return { title: '画符', text: `你画成一张${FU[sub]}。它不加快道路，只在对的事情上多一个做法。`, tags: [{ t: dur(shown), c: 'down' }, { t: `灵石 −${cn(stone)}`, c: 'down' }, { t: FU[sub], c: 'gold' }] };
  }

  function dress(list, ev, s) {
    const out = (list || []).slice();
    if (!s || !ev) return out;
    const L = ensure(s);
    const id = ev.id || '';
    if (L.zhen === 'sheng' && id === 'vein') out.push({ label: '以生阵养脉', sub: '生阵 · 养伤', act: st => {
      const healed = Math.min(1, st.inj); st.inj -= healed;
      return { text: '你将阵眼留在泉边，让地气缓缓流过旧伤。脉眼没有被挖空，草庐也没有留下。', fx: { xj: 3 }, tags: healed ? [{ t: '伤势 −1', c: 'up' }] : [] };
    } });
    if (L.zhen === 'sheng' && id === 'tide_lingku') {
      const share = out.find(c => c.label === '把余脉分给山下');
      if (share) out.push({ label: '以生阵疏脉', sub: '生阵 · 与山分脉', act: st => {
        const r = share.act(st);
        return Object.assign({}, r, { text: '你沿枯脉布下生阵，把尚能流动的灵气引向山下。阵法留不住一座山的老去，却能让最后的水走得远些。' + r.text });
      } });
    }
    if (L.zhen === 'kun' && id === 'bandit') out.push({ label: '以困阵断后', sub: '困阵 · 脱身', act: () => ({ text: '你把阵图落在峡口，山石的影子将岔路叠成一圈。追兵绕回原地时，你已经走远。你没有回头取他们的储物袋。', fx: {}, tags: [{ t: '断后脱身', c: 'gold' }] }) });
    if (L.zhen === 'cang' && id === 'hei_ambush') out.push({ label: '藏入巷中月影', sub: '藏阵 · 脱身', act: st => {
      st.flags.heiGrudge = 2;
      if (typeof karmaPlant === 'function') karmaPlant(st, 'hei_echo', 28);
      return { text: '阵纹把你的脚步藏进檐下水声。黑袍客追着一团影子转过巷口，你带着拍来的东西从另一端离开。这段梁子还在。', fx: {}, tags: [{ t: '隐迹脱身', c: 'gold' }] };
    } });
    if (L.zhen === 'cang' && id === 'heifeng') out.push({ label: '隐去商队行迹', sub: '藏阵 · ' + cnDur(Core.timeMonths(s, 3)), act: () => ({ text: '你沿商队铺开藏阵，车轮声隐在风声里。车夫们平安走出山谷。山寨还在，这一次没有可领的清剿赏格。', fx: { xj: 2, time: 3 }, tags: [{ t: '商队平安', c: 'gold' }] }) });
    if (id === 'xw_altar' && L.zhen === 'sha') {
      out.push({ label: '走到坛前改阵', sub: '杀阵', act: st => { st.flags.zhenAltar = 1; return { text: '杀阵铺到坛前，幽火矮了一寸。你没有捡坛下的灵石。', fx: { xj: 1 } }; } });
    }
    if (id === 'm_zhenmai' && L.zhen === 'sheng' && ev._uid != null && ev._mid) {
      out.push({ label: '以阵镇脉', sub: '生阵', act: st => Core.missionAct(st, ev._uid, ev._mid, { gxm: 1, lsm: 0, xw: 0, ok: '你按生阵把灵气按回脉里。白霜退了。这一桩按原成功结算，没有另开一笔灵石。', fail: '阵纹和脉眼拧了一下。', risk: -0.25 }) });
    }
    const key = fuKey(ev);
    if (key === 'xian' && L.fu.xian > 0) out.push({ label: '贴显形符', sub: '符·一张', side: 'xian' });
    else if (key && L.fu[key] > 0) out.push({ label: fuLabel(key), sub: '符·一张', act: st => fuAct(st, key, ev) });
    const wrong = wrongKey(L, key);
    if (wrong) out.push({ label: '贴上' + FU[wrong], sub: '不对', side: 'burn', burn: wrong });
    return out;
  }
  function fuKey(ev) {
    const id = ev.id || '';
    if (GUI_EV[id] || ev.title === '白骨荒原') return 'gui';
    if (LU_EV[id]) return 'lu';
    if (XIAN_EV[id]) return 'xian';
    return '';
  }
  function fuLabel(k) {
    if (k === 'gui') return '贴镇鬼符';
    if (k === 'lu') return '贴路引';
    return '贴显形符';
  }
  function wrongKey(L, right) {
    const keys = ['gui', 'jing', 'lu', 'xian'];
    for (let i = 0; i < keys.length; i++) if (keys[i] !== right && L.fu[keys[i]] > 0) return keys[i];
    return '';
  }
  function fuAct(s, key, ev) {
    if (!takeFu(s, key)) return { text: '符不在身上。', fx: {} };
    if (key === 'gui') {
      if (ev && ev.id && String(ev.id).indexOf('m_') === 0 && ev._uid != null) {
        return Core.missionAct(s, ev._uid, ev._mid, { gxm: 1, lsm: 0, ok: '镇鬼符贴在灯上。怪声停了。你没有因此多得灵石。', fail: '符光灭了，夜还是夜。', risk: -0.4 });
      }
      return { text: '镇鬼符贴上去，那一路险处变成一句稳住的话。没有另奖灵石。', fx: { xj: 1 } };
    }
    if (key === 'lu') {
      return { text: '路引贴在车上。这一场伏击没有发生。路还是那么长，月数没有少。', fx: {} };
    }
    return { text: '显形符亮过，虚实写在纸上。', fx: {} };
  }
  function burn(s, key) {
    if (!takeFu(s, key)) return { text: '符不在身上。' };
    return { text: FU[key] + '烧了。事情按原来的走。' };
  }
  function reveal(s) {
    if (!takeFu(s, 'xian')) return { err: '没有显形符' };
    if (s.evFoe) s.evFoe.hide = false;
    if (s.evFoeMeta) s.evFoeMeta.hide = false;
    return { text: '显形符亮了一下。刚才含糊的那一句，现在是实话。' };
  }
  function arrive(s, emit) {
    if (!s || !s.flags || !s.flags.zhenCarve) return;
    if (s.loc !== 'xuewu' && locName(s) !== '血雾谷') return;
    s.flags.zhenCarved = 1;
    delete s.flags.zhenCarve;
    if (emit) emit({ text: '你把寄着的阵刻进血雾谷的石上。', cls: 'gold' });
  }

  function mountEvents() {
    if (typeof EVENTS === 'undefined') return;
    EVENTS.push(
      { id: 'fu_learn', title: '纸上画符', seal: '符', w: 5, once: true, rm: [0, 4],
        cond: s => s.loc === 'yunyue' && !(s.loop && s.loop.fuKnown),
        text: () => '云岳坊纸铺的老人把一张黄纸推过来。「笔是你的。符不替你赶路，只在旧事里多开一扇小门。」',
        choices: s => {
          const stone = lsCost(s, 6);
          const shown = seasonOf(s);
          return [
            { label: '学', sub: `${dur(shown)} · 灵石 ${cn(stone)}`, act: st => {
              if (st.ls < stone) return { text: '灵石不够，老人把纸收回去了。', fx: {} };
              st.ls -= stone;
              const got = spend(st, shown);
              ensure(st).fuKnown = 1;
              return { text: '你在纸上画了第一笔。以后可以在定型页画符。符不减月数。', fx: {}, tags: [{ t: dur(got), c: 'down' }, { t: `灵石 −${cn(stone)}`, c: 'down' }] };
            } },
            { label: '不学', sub: '', act: () => ({ text: '你把纸推回去。坊里的风还是那个风。', fx: {} }) },
          ];
        } },
      { id: 'mark_danwen', title: '丹纹自语', seal: '纹', w: 4, once: true, rm: [2, 4],
        cond: s => s.path && s.path.danwen && s.path.danwen.length && !s.flags.mark_danwen,
        text: s => `金丹上的${(s.path.danwen || []).map(id => DANWEN[id] ? DANWEN[id].name : '').filter(Boolean).join('、')}忽然温了一下，像在问你还记不记得自己刻过它。`,
        choices: () => [
          { label: '应一声', sub: '心境 +2', act: s => ({ text: '你应了。纹还是纹，只是不再像别人的字。', fx: { xj: 2, flag: 'mark_danwen' } }) },
          { label: '按下不答', sub: '心境 −1', act: () => ({ text: '你按住丹面。温热退了，什么也没有加。', fx: { xj: -1, flag: 'mark_danwen' } }) },
        ] },
      { id: 'mark_faxiang', title: '法相回首', seal: '相', w: 4, once: true, rm: [3, 4],
        cond: s => s.path && s.path.faxiang && !s.flags.mark_faxiang,
        text: s => {
          const n = FAXIANG[s.path.faxiang] ? FAXIANG[s.path.faxiang].name : '法相';
          const same = s.path.daoji === 'jian' && s.path.faxiang === 'jian' ? '它与剑基是同一笔，句子更清楚，斗法倍率不再乘一次。' : '';
          const scene = { jian: '剑影没有出鞘，却在识海里划开一道旧痕。', huo: '火照见你最不肯承认的那一念，烧的不是别人。', shui: '水相盛着一张旧脸，水动时，那张脸也跟着老去。', lei: '雷光停在落下之前，等你说清这一击为何而发。', kong: '空处没有影子。你却知道，那里正有人等一个名字。' }[s.path.faxiang] || '';
          return `识海里的${n}回了一下头。${scene}${same}`;
        },
        choices: s => [
          { label: { jian: '沿旧痕收剑', huo: '认下烧着的那一念', shui: '看清水中的旧脸', lei: '说出出手的缘由', kong: '把名字留在空处' }[s.path.faxiang] || '与它对视', sub: '心境 +2', act: st => ({ text: { jian: '剑影与你一同收回，旧痕没有再添一道。', huo: '你认了。火仍在，却不再把那一念藏到别人身上。', shui: '水面慢慢平了。旧脸没有年轻，你也没有移开眼。', lei: '理由说完，雷落在该落的地方，识海里终于安静。', kong: '名字留了下来。空处仍空，你却知道自己站在哪里。' }[st.path.faxiang] || '你看着它。', fx: { xj: 2, flag: 'mark_faxiang' } }) },
          { label: '闭上眼', sub: '心境 −1', act: () => ({ text: '你闭上眼。法相还在，只是这季不说话。', fx: { xj: -1, flag: 'mark_faxiang' } }) },
        ] },
      { id: 'mark_wendao', title: '一问未完', seal: '问', w: 4, once: true, rm: [4, 4],
        cond: s => s.path && s.path.wendao && !s.flags.mark_wendao,
        text: s => `化神之后，${WENDAO[s.path.wendao] ? WENDAO[s.path.wendao].name : '那一问'}还站在原地，等你把话说完。`,
        choices: () => [
          { label: '把问再说一遍', sub: '心境 +3', act: () => ({ text: '你又说了一遍。天地没有回答，心却定了些。', fx: { xj: 3, flag: 'mark_wendao' } }) },
          { label: '留到以后', sub: '心境 −1', act: () => ({ text: '你把问收起来。它还在，只是不催。', fx: { xj: -1, flag: 'mark_wendao' } }) },
        ] },
      { id: 'mark_jiewen', title: '劫纹将醒', seal: '劫', w: 4, once: true, rm: [4, 4],
        cond: s => s.path && s.path.jiewen && !s.ascended && !s.flags.mark_jiewen,
        text: s => {
          const n = JIEWEN[s.path.jiewen] ? JIEWEN[s.path.jiewen].name : '劫纹';
          const body = s.loop && s.loop.tiAsk && s.path.jiewen === 'gang' ? '肉身问劫已经把刚劫的风险按回原来的数。' : '';
          return `天劫之前，${n}在识海上热了一热。${body}`;
        },
        choices: () => [
          { label: '认下这一纹', sub: '心境 +2', act: () => ({ text: '你认了。劫还是那一劫，没有变得更轻，也没有变得更重，除了你早已问过的那一笔。', fx: { xj: 2, flag: 'mark_jiewen' } }) },
          { label: '先不去看', sub: '心境 −2', act: () => ({ text: '你别过脸。纹还烙着，渡劫时它仍会算那一笔。', fx: { xj: -2, flag: 'mark_jiewen' } }) },
        ] },
    );
    if (typeof EV_LOC !== 'undefined') EV_LOC.fu_learn = ['yunyue'];
    if (typeof LOC_EV !== 'undefined' && LOC_EV.yunyue) LOC_EV.yunyue.push('fu_learn');
  }
  function patch() {
    if (typeof Core === 'undefined' || !Core.missionEvent) return;
    const orig = Core.missionEvent;
    Core.missionEvent = function (s, uid) {
      const ev = orig(s, uid);
      if (!ev) return ev;
      const mi = s.sect && s.sect.missions && s.sect.missions.find(x => x.uid === uid);
      const m = mi && typeof MISSIONS !== 'undefined' ? MISSIONS.find(x => x.id === mi.id) : null;
      ev._uid = uid; ev._mid = m;
      return ev;
    };
  }
  function simStep(s) {
    let mode = '';
    try { mode = (typeof process !== 'undefined' && process.env && process.env.LOOP) || ''; } catch (e) { mode = ''; }
    if (!mode || mode === 'never') return null;
    const L = ensure(s);
    if (mode === 'fu') {
      if (!L.fuKnown) { L.fuKnown = 1; }
      if (carried(s) < 3 && s.ls >= lsCost(s, 8)) return act(s, 'fu:gui', () => {});
      return null;
    }
    const dj = (mode === 'always') ? (s.path && s.path.daoji) : mode;
    if (!dj || !s.path || s.path.daoji !== dj) return null;
    if (dj === 'zhen') {
      if (s.realm >= 3 && !L.zhenAsk) return act(s, 'zhen:xue', () => {});
      const cost = seasonOf(s);
      if (s.months < (L.zhenBan || 0) || !due(L.zhenAt, s, cost)) return null;
      const name = door(s);
      const form = Object.keys(ZHEN).filter(k => zhenHit(k, name) === 'ke')[0] || 'kun';
      return act(s, 'zhen:' + form, () => {});
    }
    if (dj === 'ti') {
      if (L.ti >= 6 && s.realm >= 4 && !L.tiAsk) return act(s, 'ti:jie', () => {});
      if (!due(L.tiAt, s, seasonOf(s))) return null;
      if (s.inj > 0) return act(s, 'ti:shui', () => {});
      if (L.ti < 6) return act(s, 'ti:shi', () => {});
      return null;
    }
    if (dj === 'jian') {
      if (L.jian >= 9 && s.realm >= 3 && !L.jianAsk) return act(s, 'jian:fei', () => {});
      if (L.jian >= 9 || !due(L.jianAt, s, Math.max(12, seasonOf(s)))) return null;
      return act(s, 'jian:yue', () => {});
    }
    if (dj === 'dan') {
      if (L.lu >= 3 && s.realm >= 2 && !L.luAsk) return act(s, 'dan:gui', () => {});
      if (!recipeId(s)) return null;
      return act(s, 'dan:wenwen', () => {});
    }
    if (dj === 'mo') {
      if (L.mo >= 3) return null;
      if (s.months < (L.moQuiet || 0)) return null;
      if (!(s.xj < 40 || L.moPing) || !due(L.moAt, s, seasonOf(s))) return null;
      return act(s, 'mo:yue', () => {});
    }
    if (dj === 'qi') {
      if (!s.fabao) return null;
      if ((s.fabao.stage | 0) >= 3 && s.realm >= 4 && !L.qiAsk) return act(s, 'qi:fei', () => {});
      if (!due(L.qiAt, s, seasonOf(s))) return null;
      return act(s, 'qi:ting', () => {});
    }
    return null;
  }

  mountEvents();
  patch();
  return { empty, ensure, resetDaoji, html, act, dress, burn, reveal, arrive, simStep, seasonOf };
})();
if (typeof module !== 'undefined') module.exports = Loop;
