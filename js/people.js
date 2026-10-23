/* 纸上仙途 · 人在光阴里。旧人物不重置，新字段只补空。 */
'use strict';
const People = (() => {
  const newcomers = {
    pei: ['裴照野', '裴', '青冥外门 · 剑修', 'm', '在陆沉舟之前赢一次', 'shanmen', 'qm', 2, 430],
    tang: ['唐晚白', '唐', '丹霞谷 · 丹修', 'f', '炼成一炉极品', 'shanmen', 'dx', 3, 430],
    shen: ['沈无灯', '灯', '幽荧殿 · 传灯人', 'n', '把灯传出去', 'shanmen', 'yy', 8, 480],
    qian: ['钱十三', '钱', '玄机楼 · 阵师', 'm', '布成一座能用的护山阵', 'shanmen', 'xj', 6, 420],
    mi: ['米婆', '米', '云岳坊 · 药铺掌柜', 'f', '把铺面留给一个不坑人的', 'yunyue', '', 44, 88],
    helan: ['贺兰雄', '贺', '大黎 · 边将', 'm', '边患这一冬过去', 'jingcheng', '', 24, 82],
    liu: ['柳寄', '柳', '京城贡院 · 落第人', 'f', '有人把自己的句子留下', 'jingcheng', '', 2, 94],
    gu: ['骨刀', '骨', '血雾谷 · 魔修', 'm', '让正道记住自己的名字', 'xuewu', '', 26, 510],
    yu: ['渔生', '渔', '北海 · 渔港领船人', 'm', '海眼那一年不要再吞船', 'beihai', '', 12, 510],
    baiwei: ['白苇', '苇', '海外仙岛 · 守门人', 'n', '岛上少一个贪的人', '', '', 90, 760],
  };
  const biographies = {
    pei: '他把演武场的胜负抄在袖里，陆沉舟的名字总在上头。',
    tang: '她不数出过多少丹，只在炉边留了一只空匣，等那一炉极品。',
    shen: '其掌心的灯没有芯。问起名字，其说：“灯传出去，人便不必留。”',
    qian: '他会算阵，也会算账；算错时先翻账页，才去看被阵伤的人。',
    mi: '药铺门槛磨得发亮，她仍认得每个赊过药的孩子。',
    helan: '铠甲里的背已经有些弯。他说守过这一冬，便回家种豆。',
    liu: '她落第后仍替别人写信，把自己的文章夹在信纸最底下。',
    gu: '刀柄是一截旧骨。别人不愿问来处，他偏要讲给人听。',
    yu: '北海领船的人。他数船头，不数船上能带回来多少灵石。',
    baiwei: '其守着岛门，衣角沾了潮。岛主白衣住在深处，白苇只问过门的人。',
  };
  Object.keys(newcomers).forEach(id => {
    const a = newcomers[id];
    NPCS[id] = { name: a[0], seal: a[1], title: a[2], a0: 0, sex: a[3], trait: a[4], bio: biographies[id], style: 'wen', rel: 0.7 };
    NPC_LINE[id] = ['话没有说下去。', biographies[id], '再相见时，旧话仍有下文。'];
    if (typeof Samsara !== 'undefined' && !Samsara.PERSON_IDS.includes(id)) Samsara.PERSON_IDS.push(id);
  });
  const mates = { su: 'f', bai: 'm', xie: 'f', tang: 'f', liu: 'f' };
  const wishes = {
    shifu: '把茶案交给后来人', lu: '成为同辈第一剑', su: '有一座自己的丹炉', wen: '走进京城，不再借父亲的名', shi: '把热馒头送到远处',
    bai: '把未走完的一程走完', xie: '在云下留一个可回的地方', dx_shi: '让丹火有人接下', yy_shi: '留住最后一盏灯', xj_shi: '把旧阵讲清', sx_du: '让散人有地方歇脚',
    dx_huo: '守住炉火', dx_lian: '离开丹房看看', dx_tong: '尝出药渣里的甜', yy_gui: '在人前站一次', yy_yin: '把灯留到天亮', yy_sha: '收刀以后仍有去处',
    xj_zhen: '补好一座小阵', xj_qi: '打一件不会坏的东西', xj_pan: '迷路时也认得回程', sx_hua: '让后来人有酒可喝',
  };
  const beats = {
    shifu: [['在','他开始忘事，茶还温着，却问你是否刚入门。'],['远行','他下峰访旧，托人把茶案留给你。长老的旧席空了，你的位阶没有变。'],['在','他回到老松下，只看别人煮茶。']],
    lu: [['闭关','陆沉舟收起了演武场的名帖，独自闭关去了。'],['在','他出关时剑鞘多一道磨痕，仍要与你论高下。'],['在','他不再把胜负刻在剑上，旧愿却没有改。']],
    su: [['在','她把一口旧炉搬到自己的小院，第一次没有替别人看火。'],['在','院里的丹香淡了，她开始认真问你火候。'],['在','她收好了三次求问的笔记，等你再来。']],
    wen: [['远行','温家旧案翻出来了。他父亲离了执事堂，他独自往京城去。'],['在','温庭玉从京城带回一柄素扇，扇面没有署名。'],['在','他已经肯说那一年过得不好，只是仍先笑一声。']],
    shi: [['远行','他背着一筐馒头去远处送人，回信只说路很长。'],['在','他回山时筐空了，给你留下的那一个还用布裹着。'],['在','他不再跑着上山，仍会在门外等你。']],
    bai: [['远行','江疏白去了南边渡口，伞与人都还在。'],['在','他带着一张新的渡口图回来。'],['在','那条路他走完了，仍留着另一只杯。']],
    xie: [['远行','谢疏影留书往云下旧居去，约好有信便寄到那里。'],['在','她从旧居回来，带来屋后新开的花。'],['在','她把旧居的钥匙放在案上，没有再说要走。']],
    dx_huo: [['负伤','守炉时一道火星穿过袖口，他仍先把炉门关严。']],
    dx_lian: [['远行','她离开了丹房，去山外给人看病。']], dx_tong: [['负伤','小满仓偷吃药渣，苦得几日没说话。']],
    yy_gui: [['在','有人在月下看见了他。他没有再躲回影子里。']], yy_yin: [['在','她的灯灭过一次，后来又自己点上了。']], yy_sha: [['在','煞七把刀收进木匣，这一次没有马上取出。']],
    xj_zhen: [['在','他的小阵忽然失灵，雨顺着屋檐漏进阵眼。']], xj_qi: [['在','器阿末打出一件废品，摆在案上，不肯让人替他扔掉。']], xj_pan: [['在','盘小乙迷路回来，画出了一座此前没人认出的古修洞府。']],
    dx_shi: [['闭关','赤霞真人封了旧炉，授业的椅子空了一季。'],['在','他出关后让弟子先讲，自己听着。']],
    yy_shi: [['闭关','幽荧上人带灯入关，殿里只留一线微光。'],['在','他把灯还到殿门，自己退入后堂。']],
    xj_shi: [['闭关','璇玑子把旧阵图铺满了地，暂不见客。'],['在','他收了阵图，只留最初画错的那一张。']],
    sx_du: [['在','老贾把酒账交给后来人，说自己的眼已经看不清了。'],['远行','老贾去寻旧日同行者，盟里的门仍为散人开着。']],
    sx_hua: [['在','花三娘新酿了一坛酒，仍照旧价卖给行客。']],
  };
  const offsets = { shifu: 180, dx_shi: 150, yy_shi: 160, xj_shi: 150, sx_du: 90, lu: 4, su: 3, wen: 5, shi: -2, bai: 8, xie: 2, dx_tong: -4, xj_pan: -2 };
  function ensure(s) {
    s.npc = s.npc || {};
    Object.keys(NPCS).forEach(id => {
      const n = s.npc[id] || (s.npc[id] = { a: NPCS[id].a0, met: false });
      if (!n.life) n.life = { state: n.dead ? '身死' : '在', beat: 0, lastSeen: s.months, lastBeat: s.months, wish: '未竟', line: '', deathLogged: n.dead ? 1 : 0 };
      if (n.absolute) { n.a = -100; n.life.wish = '已碎'; if (!n.dead) n.life.state = '结仇'; }
    });
    return s.npc;
  }
  function age(s, id) { return Math.max(1, Math.floor(s.months / 12) + (newcomers[id] ? newcomers[id][7] : offsets[id] || 4)); }
  function wish(id) { return newcomers[id] ? newcomers[id][4] : wishes[id] || NPCS[id].trait; }
  function touch(s, id) { const n = ensure(s)[id]; if (n && !n.dead) n.life.lastSeen = s.months; }
  function note(s, id, state, line) {
    const n = ensure(s)[id]; if (!n || n.dead) return;
    if (n.life.state !== (n.absolute ? '结仇' : state)) s._dabiBracket = null;
    n.life.state = n.absolute ? '结仇' : state; n.life.line = line;
    if (typeof Life !== 'undefined') Life.note(s, { t: NPCS[id].name, d: line, k: 'people' });
  }
  function sever(s, id, line) {
    const n = ensure(s)[id]; if (!n || n.dead) return;
    n.absolute = 1; n.a = -100; n.life.wish = '已碎'; note(s, id, '结仇', line);
    setFoe(s, id);
  }
  function present(s, id) {
    const n = ensure(s)[id];
    return Core.npcAlive(s, id) && n.life.state !== '闭关' && n.life.state !== '远行';
  }
  function canFight(s, id) { return present(s, id) && !s.npc[id].crippled; }
  function eligible(s, id) { return !!mates[id] && (typeof Folio === 'undefined' ? mates[id] === 'f' : Folio.wantMate(s, mates[id])); }
  function tick(s, emit) {
    ensure(s);
    Object.keys(NPCS).forEach(id => {
      const n = s.npc[id], p = n.life;
      const max = newcomers[id] ? newcomers[id][8] : /^(shifu|dx_shi|yy_shi|xj_shi)$/.test(id) ? 800 : 560;
      if (!n.dead && age(s, id) >= max) {
        Core.killNpc(s, id); p.state = '身死'; p.line = NPCS[id].name + '的日子走到了尽头。';
        if (n.met && !p.deathLogged) {
          p.deathLogged = 1;
          if (emit) emit({ text: p.line, cls: 'sys' });
          if (typeof Life !== 'undefined') Life.note(s, { t: '故人', d: p.line, k: 'people' });
        }
        p.deathAt = s.months;
      }
      if (n.dead) { if (p.deathAt != null && s.months - p.deathAt >= 24) p.state = '只剩名字'; return; }
      if (p.awayUntil && s.months >= p.awayUntil) { p.awayUntil = 0; note(s, id, '在', NPCS[id].name + '已归来，旧日那一问仍没有忘。'); }
      if (!n.met || s.months - Math.max(p.lastSeen, p.lastBeat) < 24 || p.beat >= (beats[id] || []).length) return;
      const b = beats[id][p.beat++]; p.lastBeat = s.months;
      if (!n.absolute) note(s, id, b[0], b[1]);
    });
    const bond = s.bond, id = s.karma && s.karma.mate;
    if (bond && bond.promiseDue && s.months > bond.promiseDue) {
      bond.promiseDue = 0;
      if (Core.npcAlive(s, id)) { Core.npcAdd(s, id, -12); bond.missed = (bond.missed || 0) + 1; const text = NPCS[id].name + '等过了约好的日子。那一季共修，你没有来。'; note(s, id, '在', text); if (emit) emit({ text, cls: 'sys' }); }
    }
  }
  function interact(s, id, kind, emit) {
    const n = ensure(s)[id];
    if (!n || !present(s, id)) return { err: '此刻见不到此人' };
    if (n.absolute) return { err: '旧事已绝，赠物也不能抹去' };
    if (s.months < (n.life.nextAct || 0)) return { err: '这一季的话已经说过，过些时日再来' };
    const mate = s.karma && s.karma.mate === id && !(s.bond && s.bond.lost);
    if (kind !== 'talk' && !mate) return { err: '此事只与你的道侣相约' };
    let text = '', fx = { npc: { [id]: 2 }, time: 1 }, tags = [];
    if (kind === 'talk') text = NPCS[id].name + '说起了近况。' + (n.life.line || NPCS[id].bio);
    else if (kind === 'gift') {
      if (!(s.items['清心丹'] > 0)) return { err: '囊中没有清心丹' };
      s.items['清心丹']--; fx.npc[id] = 6; tags.push({ t: '清心丹 −1' }); text = '你把清心丹放在案边。对方收好了，没急着说谢。';
    } else if (kind === 'sit') {
      fx.time = 3; fx.xw = 0.03; fx.xj = 2; text = '你们对坐一季，灵气走得不快，却没有谁先起身。';
      if (s.bond && s.bond.promiseDue && s.months + Core.timeMonths(s, 3) <= s.bond.promiseDue) { s.bond.promiseDue = 0; fx.npc[id] = 8; text += '这一回，你没有失约。'; }
    } else if (kind === 'past') { text = '你问起旧事。' + (n.life.line || NPCS[id].bio) + '话说完，茶也凉了。'; fx.xj = 1; }
    else if (kind === 'promise') {
      s.bond = s.bond || {}; if (s.bond.promiseDue) return { err: '上一个约还没有赴' };
      s.bond.promiseDue = s.months + 12; fx.time = 0; fx.npc[id] = 0; text = '你约好一年内再来共修一季。日子写在案边，不能只当一句好听的话。';
    } else return { err: '此刻无此事' };
    if (kind !== 'promise') n.life.nextAct = s.months + 3;
    touch(s, id);
    const out = Core.applyFx(s, fx, emit); tags = tags.concat(out.tags || []);
    return { title: NPCS[id].name, text, tags };
  }
  function afterLoop(s, kind, sub, r) {
    if (kind !== 'dan' || s.loc !== 'shanmen' || !Core.npcAlive(s, 'su')) return;
    const n = ensure(s).su;
    if (sub === 'wenwen') {
      n.life.asked = (n.life.asked || 0) + 1;
      if (n.life.asked === 3) {
        const line = n.life.brokeFurnace ? '她没有再让你碰火。三次求问，她都答了，自己的炉却不再借你。' : '第三次求问之后，她在自己的炉边给你留了一个位置：“往后，这炉我们一起看。”';
        n.life.wish = n.life.brokeFurnace ? '已碎' : '共炉'; note(s, 'su', '在', line); r.text += line;
      }
    }
    if (r.boom && !n.life.brokeFurnace) { n.life.brokeFurnace = 1; Core.npcAdd(s, 'su', -10); note(s, 'su', '在', '她的小炉裂了，见你时没有再笑。'); }
  }
  function summary(s, id) {
    const n = ensure(s)[id], p = n.life;
    return `${p.state} · ${age(s, id)}岁${n.crippled ? ' · 旧伤难行' : ''}${n.absolute ? ' · 绝' : ''}。愿：${wish(id)}（${p.wish}）。${p.line}`;
  }
  function register(ev, loc) {
    if (!ev.portrait) ev.portrait = ev.id.replace(/^people_(meet_|bond_)?/, '').split('_')[0];
    EVENTS.push(ev);
    if (loc) { EV_LOC[ev.id] = [loc]; if (LOC_EV[loc]) LOC_EV[loc].push(ev.id); }
  }
  Object.keys(newcomers).filter(id => id !== 'baiwei' && id !== 'gu').forEach(id => {
    const a = newcomers[id], rm = id === 'yu' ? 3 : a[5] === 'jingcheng' ? 1 : 0;
    register({ id: 'people_meet_' + id, title: NPCS[id].name, seal: a[1], w: 6, once: true, rm: [rm, 4],
      cond: s => { const n = ensure(s)[id]; return !n.met && !n.dead && s.loc === a[5] && (!a[6] || s.sect.org === a[6]); },
      text: () => biographies[id], choices: () => [
        { label: '问一问名字', act: () => ({ text: NPCS[id].name + '把名字说了，也把那一点愿望说了：' + wish(id) + '。', fx: { npc: { [id]: 12 } } }) },
        { label: '记住这个人', act: () => ({ text: '这次没有深谈。人已见过，往后的事还未写。', fx: { npc: { [id]: 2 } } }) },
      ] }, a[5]);
  });
  const home = (s, id) => present(s, id) && !s.npc[id].absolute;
  register({ id: 'people_mi', title: '药秤', seal: '米', w: 5, once: true, rm: [0, 4], cond: s => home(s, 'mi') && s.loc === 'yunyue',
    text: () => '米婆把秤递给你。门口的孩子只带了半副药的钱，等着看你怎么称。',
    choices: s => [{ label: '按足量称，把短钱补上', sub: '灵石 ' + Core.scaleLs(s, 4), disabled: s.ls < Core.scaleLs(s, 4), toll: { ls: -4 }, act: s => {
      if (s.ls < Core.scaleLs(s, 4)) return { text: '你摸了摸钱袋，钱还不够。米婆把秤接回去了。', fx: {} };
      s.flags.miTrust = 1; s.npc.mi.life.wish = '有了着落'; return { text: '米婆看了一眼秤，没看钱袋。“你这手，能守铺子。”', fx: { ls: -4, npc: { mi: 20 } } };
    } }, { label: '钱多少，便称多少', act: () => ({ text: '米婆补了余下的药，自己把秤收好。', fx: { npc: { mi: -4 } } }) }] }, 'yunyue');
  register({ id: 'people_wen', title: '素扇', seal: '温', w: 5, once: true, rm: [1, 4], cond: s => home(s, 'wen') && ensure(s).wen.life.beat >= 1,
    text: s => s.court && s.court.rank >= 4 ? '温庭玉在衙门外等你，没摇扇子。他父亲的旧案翻出来了，这次他要以自己的名字求你查。' : '温庭玉在听雨楼门口拦下熟客。你寄拍的东西，他总说不值那个价。',
    choices: s => s.court && s.court.rank >= 4 ? [
      { label: '按案卷查，不替人改账', act: () => ({ text: '你把证据逐页摊开，有错的照错写。温庭玉看完，终于以自己的名字签了字。', fx: { npc: { wen: 12 }, time: 1 } }) },
      { label: '拒绝插手', act: () => ({ text: '他收回状纸，自己去了下一道门。', fx: { npc: { wen: -4 } } }) },
    ] : [{ label: '听清他的价，记住这件事', act: st => { st.flags.wenPressure = 1; note(st, 'wen', '在', '他在坊市压你的寄拍估价，少一成；此人身死后不再压价。'); return { text: '这次寄拍开始，温庭玉在场便压低一成估价。牌上会照实写，不会落槌后再少给你钱。', fx: { npc: { wen: -6 } } }; } },
      { label: '当面把旧账说清', act: () => ({ text: '你把估价的依据逐项说清，熟客们各自散去。他没有再拦下一位。', fx: { npc: { wen: -2 }, time: 1 } }) }] });
  register({ id: 'people_shi', title: '替你站一下', seal: '石', w: 5, once: true, rm: [1, 4], cond: s => home(s, 'shi') && s.npc.shi.a >= 35 && !s.npc.shi.crippled,
    text: s => { Core.showFoe(s, { rel: 1 }, { name: '山魈', title: '村外' }); return '山魈越过矮墙，石小满抢到你前头：“这回俺替你站一下。”他的脚已经踩进爪影里。'; },
    choices: () => [{ label: '同守 · 小满失手可能残伤', sub: '失手时石小满可能留下残伤', odds: 0.6, act: s => { const r = Core.fightAct(s, { name: '山魈', base: 0.6, win: { text: '你们把山魈逼回山中。他拍了拍你的肩，说这回谁也不用欠谁。', fx: { npc: { shi: 10 } } }, lose: { text: '石小满替你接住那一爪。伤能止住，腿却再不能像从前那样使力。', fx: { npc: { shi: 15 } } } }); if (r.fight && r.fight.tier === 'lose') { s.npc.shi.crippled = 1; note(s, 'shi', '负伤', '替你挡过一爪，腿伤不能尽复。清剿与护法，他不再出力。'); } return r; } },
      { label: '让他守村口，自己迎上', sub: '凶险', odds: 0.5, act: s => Core.fightAct(s, { name: '山魈', base: 0.5, win: { text: '你独自逼退山魈，回头时，他还守着村口。', fx: { npc: { shi: 4 } } }, lose: { text: '山魈的爪擦过肩头。你退到村口，两人一同守到了天明。', fx: { inj: 2 } } }) }] });
  register({ id: 'people_pei_clear', title: '名帖未收', seal: '裴', w: 4, once: true, rm: [2, 4], cond: s => home(s, 'pei') && !!s.seen.people_pei,
    text: s => { Core.showFoe(s, { rel: 1 }, { name: '邪修', title: '山外清剿' }); return '裴照野把名帖折进衣里，来问你是否一同清剿山外邪修。'; },
    choices: () => [{ label: '同行 · 裴照野失手可能身死', sub: '失手时裴照野可能身死', odds: 0.6, act: s => { const r = Core.fightAct(s, { name: '邪修', base: 0.6, win: { text: '你们一同回来。名帖上的胜，这一次他写在两个人名下。', fx: { npc: { pei: 12 } } }, lose: { text: '你退回山道时，裴照野没能跟上。送回来的只有那张名帖。', fx: { xj: -4 } } }); if (r.fight && r.fight.tier === 'lose') Core.killNpc(s, 'pei'); return r; } },
      { label: '劝他先守山门', act: () => ({ text: '他留了下来，把出发的日子划掉。名帖还没写完。', fx: { npc: { pei: 2 } } }) }] }, 'shanmen');
  register({ id: 'people_pei', title: '胜负之前', seal: '裴', w: 5, once: true, rm: [1, 4],
    cond: s => home(s, 'pei') && s.path && s.path.daoji === 'jian',
    text: s => { Core.showFoe(s, { rel: 0 }, { name: '裴照野', title: '青冥外门' }); return '裴照野把袖里的名帖取出来。“我想赢一次。先与你比，行么？”'; },
    choices: () => [{ label: '应他的剑', sub: '切磋', odds: 0.55, act: s => { const r = Core.fightAct(s, { name: '裴照野', base: 0.55, win: { text: '你先收剑。他把这一次败写在自己名字旁边，没有写你的。', fx: { npc: { pei: 8 } } }, lose: { text: '剑尖停在衣前。他愣了很久，才在名帖上添了小小一个“胜”。', fx: { npc: { pei: 12 } } } }); s.npc.pei.life.wish = r.fight && r.fight.tier === 'win' ? '仍求一胜' : '已进'; return r; } },
      { label: '改日大比再见', act: () => ({ text: '他点头，把名帖收回袖里。', fx: { npc: { pei: 2 } } }) }] }, 'shanmen');
  register({ id: 'people_tang', title: '空匣与炉', seal: '唐', w: 5, once: true, rm: [1, 4], cond: s => home(s, 'tang'),
    text: () => '唐晚白守着新炉，空匣放在最顺手的地方。“这一炉，我想把火推到头。”',
    choices: () => [{ label: '劝她先收半分火', act: s => { s.npc.tang.life.wish = '已进'; note(s, 'tang', '在', '她炼出一炉好丹，离极品还差一点，却肯把空匣留下。'); return { text: '炉稳住了。她没有拿到梦里的丹，笑时却没有看空匣。', fx: { npc: { tang: 15 }, xj: 2 } }; } },
      { label: '陪她赌这一炉', act: s => { s.flags.tangRuined = 1; s.npc.tang.life.wish = '已碎'; note(s, 'tang', '远行', '炉毁了。她离开丹霞，带着药箱往云岳坊去。'); return { text: '炉底裂开。你们退得及时，没有伤人。她把空匣合上，说以后先学着给人卖药。', fx: { npc: { tang: 5 } } }; } }] }, 'shanmen');
  register({ id: 'people_tang_market', title: '药摊再逢', seal: '唐', w: 6, once: true, rm: [1, 4],
    cond: s => !!s.flags.tangRuined && Core.npcAlive(s, 'tang') && s.loc === 'yunyue' && s.months - ensure(s).tang.life.lastSeen >= 24,
    text: () => '药摊后的人抬起头，是唐晚白。空匣垫在药箱底下，她没有再带炉。',
    choices: () => [{ label: '在摊前坐一会儿', act: s => { note(s, 'tang', '在', '她在云岳坊卖药，不再炼丹。旧愿碎了，人还在。'); return { text: '她给你讲了许多来看病的人，没有讲丹炉。', fx: { npc: { tang: 12 } } }; } }, { label: '道一声珍重', act: s => { note(s, 'tang', '在', '她在云岳坊安了药摊。'); return { text: '她挥手，转身替下一位客人称药。', fx: { npc: { tang: 3 } } }; } }] }, 'yunyue');
  register({ id: 'people_shen', title: '灯无芯', seal: '灯', w: 5, once: true, rm: [1, 4], cond: s => home(s, 'shen'),
    text: () => '沈无灯把掌心那一点微光递过来。“你不必修我的法。只要往后有人问路，你还肯把灯举起来。”',
    choices: () => [{ label: '接过这桩因果', act: s => { s.flags.shenLamp = 1; s.npc.shen.life.wish = '已进'; karmaPlant(s, 'shen_lamp', 4); return { text: '灯落在掌中，没有功法，也没有更快的行功声。你只是答应替其照一程。', fx: { npc: { shen: 15 }, xj: 2 } }; } }, { label: '请其另寻传灯人', act: () => ({ text: '其收回灯，向你点头。灯仍会往下一双手去。', fx: { npc: { shen: 2 } } }) }] }, 'shanmen');
  register({ id: 'yg_shen_lamp', title: '再传一程', seal: '灯', w: 6, once: true, rm: [1, 4], cond: s => karmaDue(s, 'shen_lamp'),
    text: () => '夜行的人停在岔路，手里只有一截湿灯芯。你掌中，沈无灯传来的微光还在。',
    choices: () => [{ label: '把灯传给夜行人', act: s => { karmaTake(s, 'shen_lamp'); s.flags.shenLamp = 0; s.flags.shenLampDone = 1; if (Core.npcAlive(s, 'shen')) s.npc.shen.life.wish = '已竟'; return { text: '那人举起灯，照着后来人的路。你掌心空了，却知道这盏灯还会往前去。', fx: { xj: 2 } }; } },
      { label: '替其指路，自己留灯', act: s => { karmaTake(s, 'shen_lamp'); return { text: '你指了路，把灯留在自己手中。沈无灯的愿望，还没有走到下一双手。', fx: {} }; } }] });
  register({ id: 'people_qian', title: '算差一寸', seal: '钱', w: 5, once: true, rm: [1, 4], cond: s => home(s, 'qian'),
    text: () => '钱十三的小阵刚落地，阵光便割伤了守在旁边的同门。他低着头翻图，说只差一寸。',
    choices: () => [{ label: '先送人治伤，再陪他重算', act: s => { s.npc.qian.life.wish = '已进'; note(s, 'qian', '在', '他在阵图第一页添了四个字：先把人看。'); return { text: '人送回去了。你们把那一寸重画了三遍，阵终于能用了。', fx: { npc: { qian: 15 }, time: 1 } }; } }, { label: '说阵对了，人伤便不算事', act: s => { s.npc.qian.life.wish = '已碎'; note(s, 'qian', '在', '他把错阵收进账匣，从此先问价，再问人。'); return { text: '他合上图。后来的账很好算，护山阵却一直没再试。', fx: { npc: { qian: -6 } } }; } }] }, 'shanmen');
  register({ id: 'people_helan', title: '这一冬', seal: '贺', w: 5, once: true, rm: [1, 4], cond: s => home(s, 'helan'),
    text: () => '贺兰雄把边报压在酒碗下，问你能否替他送一封平安信。信封上只有小村的名字。',
    choices: () => [{ label: '替他送到', act: s => { s.npc.helan.life.wish = '已进'; return { text: '村口有人接了信，先问他冷不冷。你回京时，这一冬已经过去。', fx: { time: 3, npc: { helan: 15 }, xj: 3 } }; } }, { label: '坦言此行去不了', act: () => ({ text: '他另找了驿卒，没有怪你。', fx: { npc: { helan: 2 } } }) }] }, 'jingcheng');
  register({ id: 'people_liu', title: '榜外的句子', seal: '柳', w: 5, once: true, rm: [1, 4], cond: s => home(s, 'liu'),
    text: () => '柳寄把文章压在信纸下面。“榜上没有，也就不会有人抄了。”她说完，仍把字写得端正。',
    choices: () => [{ label: '抄一份，留下她的名字', act: s => { s.npc.liu.life.wish = '已进'; s.flags.liuWords = 1; return { text: '你把柳寄二字写在篇首。她看了很久，说原来自己的名字也能留在这样的地方。', fx: { npc: { liu: 18 }, time: 1, xj: 2 } }; } }, { label: '请她把末句再读一遍', act: () => ({ text: '她读了。贡院的门还关着，街上的风没有把末句吹散。', fx: { npc: { liu: 6 } } }) }] }, 'jingcheng');
  register({ id: 'people_gu', title: '骨刀留名', seal: '骨', w: 5, once: true, rm: [2, 4], cond: s => !ensure(s).gu.dead && !s.npc.gu.met && s.loc === 'xuewu',
    text: s => { Core.showFoe(s, { rel: 1 }, { name: '骨刀', title: '血雾谷魔修' }); return biographies.gu + '他挡在雾口，刀没有放下。'; },
    choices: s => [
      ...(s.path.daoji === 'mo' || s.sect.org === 'yy' ? [{ label: '问他的名字从何而来', act: st => { st.npc.gu.life.wish = '已进'; return { text: '骨刀讲起死去的同门，讲完才把刀收起来。“正道不肯记。你替我记着。”', fx: { npc: { gu: 18 } } }; } }] : []),
      { label: '迎上骨刀', sub: '凶险', odds: 0.5, act: st => { Core.npcAdd(st, 'gu', -20); setFoe(st, 'gu'); return Core.fightAct(st, { name: '骨刀', base: 0.5, win: { text: '你迫他退回血雾。刀上的名字，你记住了。', fx: { xj: 2 } }, lose: { text: '骨刀划破肩头，你退到谷外。血雾里的那个人还没有走。', fx: { inj: 2 } } }); } },
      { label: '绕开雾口', act: () => ({ text: '骨刀没有追来。你记住了这个挡路的人。', fx: { npc: { gu: -4 } } }) },
    ] }, 'xuewu');
  register({ id: 'people_yu', title: '海眼那一年', seal: '渔', w: 5, once: true, rm: [3, 4], cond: s => ensure(s).yu.met && s.loc === 'beihai',
    text: s => (Core.npcAlive(s, 'yu') ? '渔生' : '渔生的女儿') + '把潮时写在船边：“这一回，别让海眼再吞船。”',
    choices: () => [{ label: '留下来候过潮头', act: s => { if (Core.npcAlive(s, 'yu')) s.npc.yu.life.wish = '已进'; s.flags.yuBoats = 1; return { text: '最后一条船过了潮头。岸上的人一艘一艘数，数到最后，才把手放下来。', fx: { time: 3, xj: 3 } }; } }, { label: '把潮时记下，先赴自己的路', act: () => ({ text: '你带走潮时。岸上的人继续等船。', fx: { xj: 1 } }) }] }, 'beihai');
  const gate = MIJING.xiandao && MIJING.xiandao.nodes[0];
  if (gate) { const choices = gate.choices; gate.choices = s => {
    const cs = choices(s), n = ensure(s).baiwei;
    if (!n.met && !n.dead) cs.push({ label: '问守门的白苇', sub: '岛主白衣在岛内', act: st => { Core.npcAdd(st, 'baiwei', 12); st.npc.baiwei.life.wish = '已进'; return { text: '白苇看了看你的空手，侧身让路：“岛主在里头。门前这一问，是我问的。”' }; } });
    return cs;
  }; }
  ['tang', 'liu'].forEach(id => register({ id: 'people_bond_' + id, title: '再留一只杯', seal: '侣', w: 5, once: true, rm: [1, 4],
    cond: s => home(s, id) && s.npc[id].a >= 60 && eligible(s, id) && !(s.karma && s.karma.mate),
    text: () => NPCS[id].name + '把第二只杯放在案上。话没有先说，位置已经留了。',
    choices: () => [{ label: '留下来，共许此生', act: s => { const tags = []; setMate(s, id, tags); s.bond = Object.assign(s.bond || {}, { lost: 0, mateSex: 'f' }); return { text: '你坐下，把名字写在同一张纸上。往后的光阴，要两个人一起过了。', tags, fx: { xj: 5 } }; } }, { label: '愿长为知己', act: () => ({ text: '杯仍留着，名字却各写在自己的纸上。', fx: { npc: { [id]: 2 } } }) }] }));
  // 在既有事件上补后果，保留原来的战斗、因果与时耗。
  EVENTS.forEach(ev => {
    const actor = /^(lu|su|wen|shi)_/.exec(ev.id);
    const id = actor ? actor[1] : /^sf_/.test(ev.id) ? 'shifu' : '';
    if (id) { const cond = ev.cond; ev.cond = s => present(s, id) && (!cond || cond(s)); }
    if (ev.id === 'lu_save') { const choices = ev.choices; ev.choices = s => choices(s).map(c => c.label === '依他所言，转身离去' ? Object.assign({}, c, { act: st => { const r = c.act(st); sever(st, 'lu', '妖窟那一日，你转身走了。断臂回来的陆沉舟，只肯再走仇线。'); karmaPlant(st, 'lu_foe', 2); return r; } }) : c); }
    if (ev.id === 'yg_lu_foe') { const choices = ev.choices; ev.choices = s => choices(s).filter(c => !s.npc.lu.absolute || c.label !== '收剑，言和'); }
    if (ev.id === 'yg_su_vow') { const choices = ev.choices; ev.choices = s => choices(s).filter(c => eligible(s, 'su') || c.label !== '结契，结为道侣'); }
    if (ev.id === 'lu_sword') { const choices = ev.choices; ev.choices = s => choices(s).map(c => Object.assign({}, c, { act: st => { const r = c.act(st); if (st.loop && st.loop.jian >= 5) { note(st, 'lu', '闭关', '你的剑意已在他前面。陆沉舟收剑闭关，要把未懂的那一式想清楚。'); st.npc.lu.life.awayUntil = st.months + 24; } return r; } })); }
    if (ev.id === 'bond_meet' || ev.id === 'bond_bai') { const cond = ev.cond, id = ev.id === 'bond_meet' ? 'xie' : 'bai'; ev.cond = s => !ensure(s)[id].dead && cond(s); }
    if (ev.id === 'jc_bing') {
      const text = ev.text, choices = ev.choices;
      ev.text = s => text(s) + (ensure(s).helan.dead ? '继任边将候在沙盘旁，贺兰雄的名字留在旧册上。' : '边将贺兰雄候在沙盘旁，铠甲上还有关外的风沙。');
      ev.choices = s => choices(s).map(c => Object.assign({}, c, { act: st => { const r = c.act(st); if (!ensure(st).helan.dead) Core.npcAdd(st, 'helan', 2); return Object.assign({}, r, { text: r.text.replace(/老将/g, st.npc.helan.dead ? '继任边将' : '贺兰雄') }); } }));
    }
  });
  const oldSword = EVENTS.find(e => e.id === 'yg_lu_foe');
  if (oldSword) register(Object.assign({}, oldSword, { id: 'people_lu_hunt', title: '断臂之仇', cond: s => Core.npcAlive(s, 'lu') && !!s.npc.lu.absolute }));
  MISSIONS.forEach(m => {
    const choices = m.choices;
    m.choices = s => choices(s).filter(c => !Object.keys(c.npc || {}).some(id => NPCS[id] && (String(c.label).includes(NPCS[id].name) || String(c.sub || '').includes(NPCS[id].name)) && !canFight(s, id)));
  });
  ['shengu', 'qiuniang', 'linzhao'].forEach(id => {
    const ev = EVENTS.find(e => e.id === 'echo_' + id); if (!ev) return;
    const choices = ev.choices;
    ev.choices = s => {
      const cs = choices(s), d = Life.deed(s, id);
      if (!d || (d.kind !== 'save' && d.kind !== 'spare')) return cs;
      if (id === 'shengu') {
        const item = Object.keys(s.items).find(k => s.items[k] > 0 && Jianghu.sellPrice(s, k) > 0);
        cs.unshift({ label: item ? '同掌柜做桩买卖 · 卖' + item : '问掌柜的买卖', sub: item ? '灵石 +' + Jianghu.sellPrice(s, item) : '囊中无可卖之物', disabled: !item, act: st => {
          const r = Jianghu.sell(st, item); if (!r) return { text: '这件东西已经不在囊中了。', fx: {} };
          Life.seal(st, id); return { text: '沈孤照坊市收价把灵石数齐，又把账当面记下。“买卖归买卖。你当年救我的事，我仍记着。”', tags: r.tags };
        } });
      } else if (id === 'qiuniang') cs.unshift({ label: '问坊主近日的消息', act: st => {
        const open = Jianghu.mjOpenList(st).filter(m => st.realm >= MIJING[m.id].rm);
        Life.seal(st, id); return { text: '秋娘把渡口听来的消息讲给你：' + (open.length ? open.map(m => m.name + '尚开着，约余' + cnDur(m.left)).join('；') : '眼下没有你能前往的秘境开门，等下一阵风再问。') + '。消息是消息，路还得你自己走。', fx: { xj: 2 } };
      } });
      else cs.unshift({ label: '应执事求援，送药救急', sub: '清心丹 −1 · ' + cnDur(Core.timeMonths(s, 1)), disabled: !(s.items['清心丹'] > 0), act: st => {
        if (!(st.items['清心丹'] > 0)) return { text: '囊中没有药，林照另去找人。', fx: {} };
        Life.seal(st, id); st.items['清心丹']--; return { text: '林照没摆谢礼，只把一封求援信交给你。你把药送到走火的弟子手里，他才松开攥了一路的手。', fx: { time: 1, xj: 3 }, tags: [{ t: '清心丹 −1' }, { t: '求援已应' }] };
      } });
      return cs;
    };
  });
  return { newcomers, biographies, ensure, age, wish, touch, note, sever, present, canFight, eligible, tick, interact, afterLoop, summary, mates };
})();
