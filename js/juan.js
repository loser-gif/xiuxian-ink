/* 纸上仙途 · 卷外：出身、道侣师徒、天下大势、稀有终局、轮回可再寻的遗物、题跋闲章。
   接在既有因果／秘境／轮回之上，不另起存档键。 */
'use strict';
const Juan = (() => {
  const TIDES = ['mochao', 'gengdai', 'xianbi', 'lingku'];
  const TIDE_HINT = {
    mochao: '西边的信使把马骑死在镇口。他说：魔潮起了，这一次不像往常那样只舔一舔边境。',
    gengdai: '京里的年号忽然换了。换年号的消息比人走得快，茶摊上已经有人在争论该不该跪。',
    xianbi: '各山门同时挂出了帖：仙门大比，百年一次。帖子很薄，薄得像一张随时会被风拿走的脸。',
    lingku: '山里的泉眼浅了。灵脉像一根慢慢抽走的线，闭关的人最先觉得冷。',
  };
  const DISC_NAMES = ['江小舟', '叶迟', '秦晚', '顾衡', '沈糯', '闻小禾'];

  const ORIGINS = [
    { id: 'qingshi', name: '青石镇少年', seal: '镇', lean: '归隐',
      intro: '青石镇人氏，年方十六。镇口老槐还认得你的脚步。',
      prose: '青石板、老槐、说书人。你从凡尘最普通的一页里走出来。',
      flags: [] },
    { id: 'shijia', name: '世家庶子', seal: '庶', lean: '朝堂', ls: 28,
      intro: '世家庶子，年方十六。正厅的灯火，从来不为你留。',
      prose: '嫡母的眼神比冬雨冷。你识字，也识得什么叫多余。',
      flags: ['leanCourt'] },
    { id: 'liehu', name: '山中猎户', seal: '猎', lean: '山神', luck: 1,
      intro: '山中猎户之子，年方十六。弓比人高，山比家近。',
      prose: '你闻得懂兽迹，也在山神祠前磕过头。山记得你。',
      flags: ['shanCi'] },
    { id: 'shusheng', name: '落第书生', seal: '落第', lean: '青史',
      intro: '落第书生，年方十六。卷子还在，名字不在榜上。',
      prose: '你把落第的卷子折好。字还在，路却要另寻。',
      flags: ['wrote', 'legend'] },
    { id: 'xiaohuan', name: '宫中小宦', seal: '宦', lean: '帝位', ls: 16, xj: -2,
      intro: '宫中小宦，年方十六。朱墙认你的影子，不认你的姓。',
      prose: '你在宫墙根下长大。礼乐、眼色、以及不能说的名字，你都懂一点。',
      flags: ['courtEar'] },
    { id: 'moyi', name: '魔门遗孤', seal: '孤', lean: '镇魔', xj: -4, luck: 1,
      intro: '魔门遗孤，年方十六。血衣是别人给你披上的，你还没决定要不要脱掉。',
      prose: '灭门那夜你活了下来。世上有人要你的命，也有人要你的恨。',
      flags: ['moBlood'] },
    { id: 'qiaobian', name: '桥边人', seal: '桥', lean: '无', need: 'ending',
      intro: '桥边人，年方十六。你不记得自己从哪一户出来，只记得水声。',
      prose: '没有镇籍，没有家谱。你从桥栏上醒来，袖里空空。',
      flags: [] },
    { id: 'jiushi', name: '旧识', seal: '识', lean: '无', need: 'person',
      intro: '旧识之后，年方十六。街上有人看你眼熟，你也看他们眼熟。',
      prose: '你说不出上一面在何时。只是点头的时候，像早就认识。',
      flags: [] },
  ];
  const byId = id => ORIGINS.find(o => o.id === id) || ORIGINS[0];

  function emptyBond() { return { discs: [], lost: 0 }; }
  function ensure(s) {
    if (!s) return s;
    if (!s.origin) s.origin = 'qingshi';
    if (!s.bond || typeof s.bond !== 'object') s.bond = emptyBond();
    s.bond.discs = Array.isArray(s.bond.discs) ? s.bond.discs : [];
    if (!s.shi || typeof s.shi !== 'object') s.shi = { next: (s.months | 0) + 12 * 32, n: 0, side: {} };
    s.shi.side = s.shi.side || {};
    if (s.shi.next == null) s.shi.next = (s.months | 0) + 12 * 32;
    if (!Array.isArray(s.colophon)) s.colophon = [];
    return s;
  }
  function boot(s, r) {
    ensure(s);
    if (r && r.origin && byId(r.origin)) s.origin = r.origin;
    if (s.flags.originBoot) return;
    s.flags.originBoot = 1;
    const o = byId(s.origin);
    if (o.ls) s.ls = (s.ls | 0) + o.ls;
    if (o.luck) s.luck = Math.max(-5, Math.min(10, (s.luck | 0) + o.luck));
    if (o.xj) s.xj = Math.max(0, Math.min(100, (s.xj | 0) + o.xj));
    (o.flags || []).forEach(k => { if (!s.flags[k]) s.flags[k] = 1; });
  }
  function originLine(s) {
    const o = byId(s && s.origin);
    const name = (s && s.name) || '你';
    return ('你名' + name + '，' + o.intro).replace(/年方十六/g, '年方十\u2060六');
  }
  function originName(s) { return byId(s && s.origin).name; }

  function tick(s, emit) {
    ensure(s);
    if (!s || s.dead || s.ascended) return;
    if (!s.flags.tideDue && (s.months | 0) >= (s.shi.next | 0) && (s.age | 0) >= 24) {
      const id = TIDES[(s.shi.n | 0) % TIDES.length];
      s.shi.n = (s.shi.n | 0) + 1;
      s.flags.tideDue = id;
      s.shi.next = (s.months | 0) + 12 * (40 + (s.shi.n % 4) * 12);
      if (emit && TIDE_HINT[id]) emit({ title: '天下', text: TIDE_HINT[id], cls: 'event', div: true });
    }
    for (const d of s.bond.discs) {
      if (!d || d.fate) continue;
      const span = (s.age | 0) - (d.y | 0);
      const need = d.stage === 0 ? 16 : d.stage === 1 ? 34 : 999;
      if (d.stage < 2 && span >= need && d.pending !== d.stage + 1) {
        d.pending = d.stage + 1;
        if (emit) emit({ title: '徒讯', text: `${d.name}托人带来一封短信。字比去年稳，仍有一笔写得像在喊你。`, cls: 'event' });
      }
    }
  }
  function dueEvent(s) {
    if (!s || !s.flags || !s.flags.tideDue || typeof EVENTS === 'undefined') return null;
    const ev = EVENTS.find(e => e.id === 'tide_' + s.flags.tideDue);
    if (!ev) { s.flags.tideDue = ''; return null; }
    if (ev.once && s.seen && s.seen[ev.id]) { s.flags.tideDue = ''; return null; }
    return ev;
  }
  function takeTide(s, id, side) {
    ensure(s);
    s.flags.tideDue = '';
    s.shi.side[id] = side;
    s.flags['tide_' + id] = side;
    if (!s.flags.tideAfterAt) s.flags.tideAfterAt = (s.months | 0) + 12 * 18;
  }
  function pendingDisc(s) {
    ensure(s);
    return (s.bond.discs || []).find(d => d && d.pending && !d.fate) || null;
  }
  function takeDisc(s, name) {
    ensure(s);
    if (s.bond.discs.length >= 3) return null;
    const nm = name || DISC_NAMES[s.bond.discs.length % DISC_NAMES.length];
    if (s.bond.discs.some(d => d.name === nm)) return null;
    const d = { name: nm, y: s.age | 0, aff: 42, stage: 0, fate: '', pending: 0 };
    s.bond.discs.push(d);
    if (typeof Life !== 'undefined' && Life.meet) Life.meet(s, nm, '收入门下');
    return d;
  }
  function mateName(s) {
    if (!(s && s.karma && s.karma.mate)) return '';
    return (typeof NPCS !== 'undefined' && NPCS[s.karma.mate] && NPCS[s.karma.mate].name) || '';
  }
  function onLog(s, e) {
    if (!s || !e || !e.title || e.guide) return;
    ensure(s);
    const blob = e.title + (e.text || '');
    const hot = e.cls === 'gold' || /破境|道侣|秘境|天下|回响|徒|结契|传承|山神|镇魔|传说|渊|岛|洞府|残页/.test(blob);
    if (!hot) return;
    if (s.colophon.some(c => c.t === e.title)) return;
    const who = inferWho(s, e);
    const line = coloLine(s, e.title, who);
    if (s.colophon.length >= 16) s.colophon.shift();
    const rec = { seal: String(e.seal || e.title).slice(0, 1), line, t: e.title, y: s.age | 0 };
    if (who) rec.who = who;
    s.colophon.push(rec);
    e.colo = line;
  }
  function inferWho(s, e) {
    if (e && e.who) return String(e.who);
    const title = String((e && e.title) || '');
    const echo = title.match(/回响\s*[·・]\s*(.+)$/);
    if (echo && echo[1]) return echo[1].trim();
    if (/^旧人/.test(title)) return mateName(s);
    return '';
  }
  function coloLine(s, title, who) {
    const place = (typeof LOC !== 'undefined' && s.loc && LOC[s.loc]) ? LOC[s.loc].name : '山中';
    const year = 3721 + Math.max(0, (s.age | 0) - 16);
    const name = String(title || '').trim() || '一事';
    const extra = who && name.indexOf(who) < 0 ? ' · ' + who : '';
    return `大衍历${year}年，于${place}，${name}${extra}`;
  }
  function placeOf(line) {
    const m = String(line || '').match(/^大衍历\d+年，于(.+)$/);
    if (!m || typeof LOC === 'undefined') return '';
    const rest = m[1];
    const names = [];
    Object.keys(LOC).forEach(k => { if (LOC[k] && LOC[k].name) names.push(LOC[k].name); });
    names.sort((a, b) => b.length - a.length);
    return names.find(n => rest.indexOf(n) === 0) || '';
  }
  function coloShown(c) {
    if (!c) return '';
    const title = String(c.t || '').trim();
    const who = c.who && title.indexOf(c.who) < 0 ? ' · ' + c.who : '';
    const line = String(c.line || '');
    if (title && line.indexOf(title) >= 0) return line;
    const m = line.match(/^大衍历(\d+)年，于/);
    if (!m || !title) return line;
    const place = placeOf(line);
    if (place) return `大衍历${m[1]}年，于${place}，${title}${who}`;
    return `大衍历${m[1]}年，${title}${who}`;
  }
  function markLabel(c) {
    if (!c) return '';
    const title = String(c.t || '一事');
    const seal = c.seal || title.slice(0, 1) || '印';
    const who = c.who && title.indexOf(c.who) < 0 ? ' · ' + c.who : '';
    return seal + ' · ' + title + who;
  }
  function sealLine(s) {
    ensure(s);
    const c = s.colophon[s.colophon.length - 1];
    return c ? c.line : '';
  }

  function pin(loc, id) {
    if (typeof LOC_EV === 'undefined' || typeof EV_LOC === 'undefined') return;
    (LOC_EV[loc] = LOC_EV[loc] || []).push(id);
    (EV_LOC[id] = EV_LOC[id] || []).push(loc);
  }

  if (typeof NPCS !== 'undefined') {
    NPCS.xie = NPCS.xie || {
      name: '谢疏影', seal: '谢', title: '云下游侣', a0: 12, style: 'rou', rel: 0.7, el: '水',
      trait: '声细，步轻，像一阵不肯停的雨。', bio: '无门无派。桃花开时出现，花落后便寻不到人。',
    };
  }

  if (typeof LOC !== 'undefined' && typeof MIJING !== 'undefined') {
    if (LOC.heifeng && !LOC.heifeng.mj) LOC.heifeng.mj = 'chenjian';
    if (LOC.beihai) LOC.beihai.mj2 = 'xiandao';
    if (LOC.yunhai) LOC.yunhai.mj2 = 'xingyun';
    Object.assign(MIJING, {
      chenjian: { name: '沉剑渊', loc: 'heifeng', rm: 1, seal: '渊', tint: 'steel',
        open: '黑风岭下裂开一道细渊。渊底有剑鸣，像有人在水里磨剑，磨了很久。',
        nodes: [
          { t: '渊口寒雾', text: '雾从渊口倒灌上来，冷得像针。石阶只露出半级，下面是看不见底的青黑。', choices: () => [
            { label: '以灵力辟雾下行', sub: '耗灵力', ling: -18, act: () => ({ text: '你把灵力铺成一层薄罩。雾分开一掌宽，恰好够你落下。' }) },
            { label: '闭气硬闯', sub: '寒气侵体', act: () => Math.random() < 0.55 ? { text: '你屏住呼吸往下走。雾在袖上结了一层霜，人还是下去了。', ling: -8 } : { text: '寒气钻进骨缝。你在阶上跪了一跪，才把那口冷气逼出去。', hp: -16, hazard: true } },
          ] },
          { t: '沉剑台', text: s => { if (typeof Core !== 'undefined') Core.showFoe(s, { rel: 0 }, { name: '残剑意', title: '沉剑台' }); return '一方石台没在水里，台上插着十几柄断剑。你的脚步一近，其中一柄忽然轻鸣，剑意与你相当。'; }, choices: s => [
            { label: '拔剑相试', sub: '斗法', odds: 0.52, act: s2 => Core.fightAct(s2, { name: '残剑意', foe: { rel: 0 }, base: 0.52,
              win: { text: '剑意散时，断剑里落下一块温热的铁。你收进袖中，掌心还在发麻。', fx: { item: { '古剑残片': 1 }, xw: 0.12 } },
              lose: { text: '剑鸣刺耳。你退开时，衣袖被削去一角，人还在台上。', fx: { hp: -18 } } }) },
            { label: '只观剑纹，不拔', sub: '悟', act: () => ({ text: '你在台边坐到雾色发白。剑纹像一句反复写的话，你记下了其中半句。', loot: { xw: 0.2 } }) },
          ] },
          { t: '守渊人', text: s => { Core.showFoe(s, { rel: 0 }, { name: '守渊人', title: '渊上' }); return `水面上站着一个没有影子的人，声音很轻：“渊不留无名之剑。”他的气息与你齐平，约莫${Core.foeStr(s)}。`; }, choices: s => [
            { label: '报上名字', sub: '一战', odds: 0.5, act: s2 => Core.fightAct(s2, { name: '守渊人', foe: { rel: 0 }, base: 0.5,
              win: { text: '他听完你的名字，把路让开。“下去吧。渊底那柄，不一定肯认你。”', fx: { xj: 4, ls: 20 } },
              lose: { text: '他一掌把你送回雾里。“名字太轻。”你咳出一口水，人还活着。', fx: { hp: -22 } } }) },
            { label: '沉默，绕开他', act: () => Math.random() < 0.5 ? { text: '你不说话，贴着石壁过去。他没有追，只把脸转向更深的地方。' } : { text: '你绕到一半，被他的袖风扫中，只好退回原阶。', hp: -12, hazard: true } },
          ] },
          { t: '渊心', boss: true, text: s => { Core.showFoe(s, { rel: 1 }, { name: '渊心剑灵', title: '与你七分像' }); return `渊心悬着一柄整剑，剑身无锈。剑中站出一个与你眉眼有七分像的人，修为却压你半筹，约莫${Core.foeStr(s)}。“想带走它，先胜过我。”`; }, choices: s => [
            { label: '出剑', sub: '决战', odds: 0.48, act: s2 => Core.fightAct(s2, { name: '渊心剑灵', foe: { rel: 1 }, base: 0.48,
              win: { text: '最后一剑你没有刺下去。剑灵自己散了，整剑化作一页金纹残卷，落进你掌心。', fx: { xw: 0.85, frag: 1, item: { '古剑残片': 1 } } },
              lose: { text: '剑灵收剑：“还不是时候。”一股水柱把你送出渊口，天亮时你才喘匀。', fx: { hp: -55 } } }) },
          ] },
        ] },
      xiandao: { name: '海外仙岛', loc: 'beihai', rm: 3, seal: '岛', tint: 'isle',
        open: '北海雾开了一线。线的尽头有岛，岛上桃树不合季节地开着，像谁把春天单独留在那里。',
        nodes: [
          { t: '潮信', text: '登岛的水路只有一条。潮水按时涨落，涨的时候能把人按进礁缝里。', choices: () => [
            { label: '等潮落再上', sub: '稳', act: () => ({ text: '你在礁上坐过一轮潮。鞋子是湿的，人是干的。岛上的风带着桃花。' }) },
            { label: '趁潮头冲上去', sub: '险', act: () => Math.random() < 0.5 ? { text: '你踩着浪头上了岸，袍角只湿了一掌。' } : { text: '浪比你以为的更横。你被拍在礁上，爬上岸时嘴角有血，血是咸的。', hp: -18, hazard: true } },
          ] },
          { t: '岛上桃', text: '桃树不多，每株都老。树下有石桌，桌上一只空杯，杯沿没有灰。', choices: () => [
            { label: '坐下，喝一口露', act: () => ({ text: '露水是甜的。你喝完，觉得经脉里有什么轻轻转了一圈。', loot: { xw: 0.22, xj: 4 } }) },
            { label: '折一枝带走', act: () => ({ text: '你折了一枝最小的。树没有生气。枝在袖中一夜，第二天变成了一小把花瓣，香气还在。', loot: { item: { '宁神花': 2 }, xj: 2 } }) },
          ] },
          { t: '问岛主', text: s => { Core.showFoe(s, { rel: 0 }, { name: '岛上白衣', title: '看不出年纪' }); return `一个白衣人从桃后走出来，看不出年纪。“岛不招待贪的人，”他说，气息却与你相当，约莫${Core.foeStr(s)}。“你来做什么？”`; }, choices: s => [
            { label: '说来看一眼春天', act: () => ({ text: '他听完，把空杯倒扣。“那就看一眼。看完，走。”你在岛上又留了半日，心是静的。', loot: { xj: 8, xw: 0.1 } }) },
            { label: '说来寻长生', sub: '斗法', odds: 0.5, act: s2 => Core.fightAct(s2, { name: '岛上白衣', foe: { rel: 0 }, base: 0.5,
              win: { text: '你赢了，他却笑：“长生不在岛上。”他丢给你一枚温玉，转身走入桃影。', fx: { item: { '鲛珠': 1 }, ls: 40, xw: 0.15 } },
              lose: { text: '他没有下重手，只把你点倒在石桌边。“醒了再想。”你醒时，杯子还是空的。', fx: { hp: -20 } } }) },
          ] },
          { t: '仙酿', text: '石室里一瓮酒，封泥上写着“饮者自知”。香气很淡，淡得像陷阱。', choices: () => [
            { label: '只沾唇', act: () => ({ text: '你只沾了一点。舌尖一热，随即清凉。你把瓮重新封好。', loot: { xj: 6 } }) },
            { label: '饮一大口', sub: '或伤', act: () => Math.random() < 0.62 ? { text: '酒入喉，像把一整座春天喝了下去。你坐了很久，修为却实实在在厚了一层。', loot: { xw: 0.35 } } : { text: '酒性比香气烈得多。你吐出一口浊气，五脏像被火舔过。', hp: -16, hazard: true } },
          ] },
          { t: '树心', boss: true, text: s => { Core.showFoe(s, { rel: 1 }, { name: '岛心古树', title: '海外仙岛' }); return `岛心一株枯而不死的古树。树洞里睁开一只眼，声音从年轮里出来：“走的人很多，留下名字的很少。”它的修为压着你，约莫${Core.foeStr(s)}。`; }, choices: s => [
            { label: '把名字写下', sub: '决战', odds: 0.47, act: s2 => Core.fightAct(s2, { name: '岛心古树', foe: { rel: 1 }, base: 0.47,
              win: { text: '你把名字刻在树根上。树眼闭上，掉下一片金边树叶，叶脉里是一卷残页。', fx: { xw: 0.9, frag: 1, xj: 6 } },
              lose: { text: '树根把你卷起，轻轻放到海边。“下次再来，把名字想清楚。”', fx: { hp: -50 } } }) },
            { label: '不留名，只作一揖', act: () => ({ text: '你作了一揖，没有刻字。树眼看了你很久，掉下一小片普通的叶子。你觉得这也够了。', loot: { xj: 10, xw: 0.25 } }) },
          ] },
        ] },
      xingyun: { name: '星陨残谷', loc: 'yunhai', rm: 4, seal: '星', tint: 'star',
        open: '云海天阶旁的谷地亮了一夜。天亮后，谷中多了一块没有温度的星铁，像天自己掉下来一块。',
        nodes: [
          { t: '星坑', text: '坑沿光滑，像被烧过。往下看，能看见自己的倒影站在星空里，而不是站在云上。', choices: () => [
            { label: '沿坑壁缓下', ling: -16, act: () => ({ text: '你一点点下去。星铁的冷从手心走到心口，又被你压住。' }) },
            { label: '直接跃下', act: () => Math.random() < 0.55 ? { text: '你落在一块斜铁上，膝一软，人还站得住。' } : { text: '落点比看起来更滑。你滚了两滚，护体灵光碎了一角。', hp: -18, hazard: true } },
          ] },
          { t: '观星台', text: '坑底有一座半塌的石台。台上的刻度不是时辰，是某种你还叫不出名字的远近。', choices: () => [
            { label: '按刻度坐一夜', act: () => ({ text: '你坐到云海发白。有一刹那，你看见自己的经脉像一条河，河上有桥。', loot: { xw: 0.4, xj: 4 } }) },
            { label: '取一块星铁', act: () => ({ text: '星铁不大，重得过分。你只取了指甲大的一块，已经觉得袖子沉了。', loot: { item: { '寒铁': 1 }, ls: 30 } }) },
          ] },
          { t: '星兽', boss: true, text: s => { Core.showFoe(s, { rel: 1 }, { name: '星兽', title: '星陨残谷' }); return `星铁堆里站起一头不成兽形的光，四足，无眼。它的气息比你深半境，约莫${Core.foeStr(s)}。它不吼，只把你的影子踩住。`; }, choices: s => [
            { label: '把影子夺回来', sub: '决战', odds: 0.46, act: s2 => Core.fightAct(s2, { name: '星兽', foe: { rel: 1 }, base: 0.46,
              win: { text: '光散的时候，你的影子回到脚下。星铁核心里躺着一卷发亮的残页。', fx: { xw: 1.0, frag: 1, xj: 5 } },
              lose: { text: '它松开你的影子，像松开一件不属于它的东西。你被一股柔风送出谷口。', fx: { hp: -48 } } }) },
          ] },
        ] },
    });
    if (typeof MJ_TINT !== 'undefined') Object.assign(MJ_TINT, { steel: '#3c4652', isle: '#4e5d52', star: '#34384e' });
  }

  if (typeof EVENTS !== 'undefined') {
    const early = id => s => s.origin === id && (s.age | 0) < 46 && (s.realm | 0) <= 1;
    EVENTS.push(
      { id: 'org_qs_huai', title: '老槐', seal: '槐', w: 8, once: true, rm: [0, 1], portrait: 'beggar',
        wf: s => early('qingshi')(s) ? 18 : 1, cond: early('qingshi'),
        text: () => '镇口老槐下，说书人还在讲那位一剑断江的仙人。他看见你，把惊堂木搁下：“小子，你也要去山上？山上不留人吃饭。”',
        choices: () => [
          { label: '听完这一段', act: () => ({ text: '你把这一段听完。仙人在故事里很轻，轻得像随时会飞走。你心里却重了一点，重的是自己的名字。', fx: { xj: 4 } }) },
          { label: '问他山上到底有没有饭', act: () => ({ text: '他说有。接着又说，饭是冷的。你点点头，把干粮分了他一半。', fx: { xj: 3, ls: -2, lsRaw: true } }) },
        ] },
      { id: 'org_qs_bie', title: '镇口', seal: '别', w: 7, once: true, rm: [0, 1],
        wf: s => early('qingshi')(s) ? 16 : 1, cond: s => early('qingshi')(s) && s.seen && s.seen.org_qs_huai,
        text: () => '离家那日没有人敲锣。母亲把一件洗得发白的外袍塞进你手里，说：“冷了就穿。别的，别写信回来吓我们。”',
        choices: () => [
          { label: '应下，回头再看一眼', act: s => { s.flags.shanCi = s.flags.shanCi || 0; return { text: '你应了。回头时镇口很小。小，才记得住。', fx: { xj: 5 } }; } },
          { label: '不回头', act: () => ({ text: '你没有回头。路因此直了一些，心里却空了一块，空得刚好能装以后的事。', fx: { xj: 1 } }) },
        ] },

      { id: 'org_sj_xi', title: '偏席', seal: '席', w: 8, once: true, rm: [0, 1],
        wf: s => early('shijia')(s) ? 18 : 1, cond: early('shijia'),
        text: () => '家宴上你的席在柱后。嫡兄举杯，杯口对着你，话却对着客人：“庶出的，也读了几本书。”笑声很轻，轻得刚好人人都听见。',
        choices: () => [
          { label: '举杯，不辩', act: s => { s.flags.leanCourt = 1; return { text: '你把杯举平。酒是温的，话是冷的。你记住了这种温度，以后在朝里还会遇见。', fx: { xj: 3 } }; } },
          { label: '放下筷子，离席', act: () => ({ text: '你离了席。花园里的灯比厅里暗，可至少只照你一个人。', fx: { xj: 4 } }) },
        ] },
      { id: 'org_sj_shu', title: '家书', seal: '书', w: 6, once: true, rm: [0, 2],
        cond: s => s.origin === 'shijia' && (s.age | 0) > 20 && (s.age | 0) < 80 && !s.flags.org_sj_shu,
        text: () => '一只很慢的信鸟停在窗上。信是老管家写的，字迹发抖：家主病了，祠堂的位子，忽然有人提起你的名字。',
        choices: s => [
          { label: '回信：修行未竟，不归', act: s2 => { s2.flags.org_sj_shu = 1; s2.flags.leanCourt = 1; return { text: '你写得很短。短，是因为长了就会心软。管家若还活着，应当懂。', fx: { xj: 3, flag: 'org_sj_shu' } }; } },
          { label: '回信：若朝中有召，可议', act: s2 => { s2.flags.org_sj_shu = 1; s2.flags.leanCourt = 2; return { text: '你没有答应回家，只留了一句“可议”。这句话以后也许会变成官牒，也许会变成笑话。', fx: { xj: 1, flag: 'org_sj_shu' } }; } },
        ] },

      { id: 'org_lh_ci', title: '山神祠', seal: '祠', w: 8, once: true, rm: [0, 1], portrait: 'beggar',
        wf: s => early('liehu')(s) ? 18 : 1, cond: early('liehu'),
        text: () => '山神祠没有门，只有一块被烟熏黑的石。你父亲以前每次下山，都在这里放一只干果。今天果盘是空的。',
        choices: () => [
          { label: '放上自己的干粮', act: s => { s.flags.shanCi = 1; return { text: '你把干粮放下。风从祠后过来，像有人点了点头。你知道这不算回报，只算打过招呼。', fx: { xj: 5, flag: 'shanCi' } }; } },
          { label: '只作一揖', act: s => { s.flags.shanCi = 1; return { text: '你作了一揖，没有放东西。山神若要吃，山里多的是。你只是来告诉它：人还在。', fx: { xj: 3, flag: 'shanCi' } }; } },
        ] },
      { id: 'org_lh_lie', title: '夜猎', seal: '猎', w: 7, once: true, rm: [0, 1],
        wf: s => early('liehu')(s) ? 14 : 1, cond: s => early('liehu')(s) && s.flags.shanCi,
        text: s => { if (typeof Core !== 'undefined') Core.showFoe(s, { rel: 0 }, { name: '夜山虎', title: '旧猎径' }); return '夜里有虎伤了邻家的牛。你摸黑上山，在旧猎径上看见一双眼睛。那东西的气势，竟与你此刻的修为一般高。'; },
        choices: s => [
          { label: '搭箭', sub: '斗法', odds: 0.56, act: s2 => Core.fightAct(s2, { name: '夜山虎', foe: { rel: 0 }, base: 0.56,
            win: { text: '箭正中肩。虎走了，没有死。你没有追。邻家的牛还在，你的手还稳。', fx: { item: { '妖丹': 1 }, xj: 3, xw: 0.06 } },
            lose: { text: '虎比你的箭快。你滚进灌木，小腿被刮开一道。它看了你一眼，也走了——像觉得你还不够做一顿饭。', fx: { inj: 1 } } }) },
          { label: '把牛径让开，引它走别的山', act: () => ({ text: '你敲响火石，把虎往更深的林里引。牛活了，虎也活了。你觉得这样比较像你父亲。', fx: { xj: 6 } }) },
        ] },

      { id: 'org_ss_juan', title: '落第卷', seal: '卷', w: 8, once: true, rm: [0, 1], portrait: 'zhaoheng',
        wf: s => early('shusheng')(s) ? 18 : 1, cond: early('shusheng'),
        text: () => '你把落第的卷子摊在灯下。批语只有两个字：“平平。”平平两个字写得很用力，像考官怕你看不清自己的普通。',
        choices: () => [
          { label: '烧了', act: s => { s.flags.wrote = 1; return { text: '纸灰很轻。你看着它飞出窗外，忽然觉得“平平”也可以是一种开始：从此不必再证明给那支朱笔看。', fx: { xj: 4, flag: 'wrote' } }; } },
          { label: '夹进书里', act: s => { s.flags.wrote = 1; s.flags.legend = (s.flags.legend | 0) + 1; return { text: '你把卷子夹进最旧的那本书。总有一天，你会写一句比“平平”更难批的话。', fx: { xj: 3, flag: 'wrote' } }; } },
        ] },
      { id: 'org_ss_ye', title: '夜读', seal: '读', w: 6, once: true, rm: [0, 2],
        cond: s => s.origin === 'shusheng' && s.flags.wrote && (s.realm | 0) <= 2,
        text: () => '山门外有一间废弃的私塾。夜里你推门进去，黑板上还有半行没擦干净的字：“名者，实之宾。”',
        choices: s => [
          { label: '把这半行抄下', act: s2 => { s2.flags.legend = (s2.flags.legend | 0) + 1; return { text: '你抄在袖简上。字很丑，意思却清楚：名字若要留下来，得先有一件配得上它的事。', fx: { xj: 4 } }; } },
          { label: '擦掉，重新写自己的一句', act: s2 => { s2.flags.legend = (s2.flags.legend | 0) + 1; s2.flags.wrote = 2; return { text: '你写下：“名可迟到，人不可。”粉笔灰沾在指上，像一种很轻的誓。', fx: { xj: 5 } }; } },
        ] },

      { id: 'org_xh_yu', title: '宫墙', seal: '墙', w: 8, once: true, rm: [0, 1],
        wf: s => early('xiaohuan')(s) ? 18 : 1, cond: early('xiaohuan'),
        text: () => '你最后一夜在宫里当值。雨打在琉璃上，里面有人哭，哭声被训练得很小。你端着灯，灯照见自己的手，手很稳。',
        choices: () => [
          { label: '把灯放低，当没听见', act: s => { s.flags.courtEar = 1; return { text: '你把灯放低。有些哭声不该被第三个人听见。你出宫时，这只耳朵还是热的。', fx: { xj: 2, flag: 'courtEar' } }; } },
          { label: '在门缝里留一句话', act: s => { s.flags.courtEar = 2; return { text: '你只说：“活下去。”门里静了一静。你不知道那人是谁，可这句话你自己也要用。', fx: { xj: 4, flag: 'courtEar' } }; } },
        ] },
      { id: 'org_xh_tuo', title: '旧主', seal: '托', w: 6, once: true, rm: [1, 3],
        cond: s => s.origin === 'xiaohuan' && (s.realm | 0) >= 1 && (s.age | 0) < 120,
        text: () => '一个面生的小太监在坊市找到你，跪下，把一只没有印的木盒推过来。“主子说，若你还记得宫墙，就看一眼。不记得，扔掉。”',
        choices: s => [
          { label: '打开', act: s2 => { s2.flags.courtEar = Math.max(s2.flags.courtEar | 0, 2); return { text: '盒中是半块旧令牌，和一行很小的字：天下若乱，勿做刀。你把令牌收好。它不给你官，只给你一个提醒。', fx: { xj: 3, ls: 15 } }; } },
          { label: '让他带回', act: () => ({ text: '你说：“告诉他，我出了宫，就不再做宫里的人。”小太监磕了头，走得很慢。', fx: { xj: 4 } }) },
        ] },

      { id: 'org_my_yi', title: '血衣', seal: '衣', w: 8, once: true, rm: [0, 1],
        wf: s => early('moyi')(s) ? 18 : 1, cond: early('moyi'),
        text: () => '包袱最底下有一件小孩的血衣，不是你的尺寸，是你哥哥的。布已经硬了。你每次摸到它，手指都会停很久。',
        choices: () => [
          { label: '埋了', act: s => { s.flags.moBlood = 1; return { text: '你在离山门很远的地方挖了一个很浅的坑。埋的不是恨，是一件已经不能再穿的衣服。', fx: { xj: 4, flag: 'moBlood' } }; } },
          { label: '留着', act: s => { s.flags.moBlood = 2; return { text: '你把它重新包好。留着不是为了穿，是为了有一天有人问你为什么还活着时，你拿得出一件东西。', fx: { xj: -2, flag: 'moBlood' } }; } },
        ] },
      { id: 'org_my_ye', title: '夜半', seal: '夜', w: 6, once: true, rm: [0, 2],
        cond: s => s.origin === 'moyi' && s.flags.moBlood && (s.age | 0) < 90,
        text: () => '夜里有人在你窗外站了一站，没有进来。留下的只有一句气音：“遗孤若肯回来，血债可以改记在别人名下。”',
        choices: s => [
          { label: '不开窗', act: s2 => { s2.flags.moSealed = 1; return { text: '你没有开窗。天亮时窗外只有露水。你知道自己拒绝的不是一句气音，是一条更容易的路。', fx: { xj: 5 } }; } },
          { label: '问他：谁来改账', act: s2 => { s2.flags.moLean = 1; return { text: '窗外沉默很久，才说：“你自己。”人走了。你坐到晨钟，觉得这句话比威胁更难办。', fx: { xj: -3 } }; } },
        ] },

      { id: 'bond_meet', title: '疏影', seal: '影', w: 6, once: true, rm: [1, 3], portrait: 'xie',
        cond: s => !(s.karma && s.karma.mate) && (s.realm | 0) >= 1 && !(s.bond && s.bond.lost) && (typeof Folio === 'undefined' || Folio.wantMate(s, 'f')),
        text: () => '桃花谢得晚的那年，溪边有个撑伞的人。伞是纸的，人是谢疏影。她看你一眼：“你走路的样子，像要去一个很远、也不一定存在的地方。”',
        choices: s => [
          { label: '问她要不要同行一程', act: s2 => {
            if (typeof setMate === 'function') setMate(s2, 'xie');
            if (s2.npc && s2.npc.xie) { s2.npc.xie.met = true; s2.npc.xie.a = Math.min(100, (s2.npc.xie.a | 0) + 18); }
            if (typeof Life !== 'undefined' && Life.meet) Life.meet(s2, '谢疏影', '溪边同行');
            return { text: '她把伞倾向你那边一点。“一程可以。再远的，走着看。”自此案上常常多一只杯，杯是空的时候也像在等。', fx: { xj: 6, npc: { xie: 8 } }, tags: [{ t: '道侣 · 谢疏影', c: 'gold' }] };
          } },
          { label: '说自己还不能许人', act: () => ({ text: '她点头，像早就知道。“那我把伞留下。雨若再来，你自己撑。”人走了，伞柄还温。', fx: { xj: 2 } }) },
        ] },
      { id: 'bond_dual', title: '双修', seal: '双', w: 4, rm: [1, 4], portrait: 'xie',
        cond: s => !!(s.karma && s.karma.mate) && !(s.bond && s.bond.lost) && (s.flags.dualN | 0) < 2,
        text: s => {
          const nm = mateName(s) || '那人';
          return `${nm}在你对面坐下。没有盟约要补，只是把呼吸放慢到和你一样。“若你愿意，今夜的灵气我们可以分。”窗外的风也放慢了。`;
        },
        choices: s => [
          { label: '愿意', act: s2 => { s2.flags.dualN = (s2.flags.dualN | 0) + 1; return { text: '灵气在两个人之间走了一个来回。不炽，只是暖。暖完，你们谁也没有说话，因为话说了就会把暖说小。', fx: { xw: 0.12, xj: 5, time: 2 } }; } },
          { label: '今夜只想并坐', act: () => ({ text: '你们并坐到灯油尽。没有修为上的进益，只有肩膀终于知道另一边有人。', fx: { xj: 4 } }) },
        ] },
      { id: 'bond_jie', title: '劫中人', seal: '劫', w: 5, once: true, rm: [3, 4], portrait: 'su',
        cond: s => !!(s.karma && s.karma.mate) && !(s.bond && s.bond.lost) && (s.realm | 0) >= 3,
        text: s => `${mateName(s) || '道侣'}站在劫云边上，衣带被风抽直。“我可以陪你进去，”声音很稳，“也可以在外面等。你选。外面等的人，不一定等得到。”`,
        choices: s => {
          const loseMate = s2 => {
            if (s2.bond) s2.bond.lost = 1;
            const id = s2.karma && s2.karma.mate;
            if (typeof Core !== 'undefined' && Core.killNpc) Core.killNpc(s2, id);
            else if (id && s2.npc && s2.npc[id]) s2.npc[id].dead = 1;
          };
          const rows = [
            { label: '让其在外守着', act: s2 => { if (s2.npc && s2.karma.mate && s2.npc[s2.karma.mate] && !s2.npc[s2.karma.mate].dead) s2.npc[s2.karma.mate].a = Math.min(100, s2.npc[s2.karma.mate].a + 6); return { text: '你说：“等我。”这三个字比任何法诀都难说。劫后你出来时，人还在，伞还在，只是人都瘦了一圈。', fx: { xj: 4, btBuff: 0.03 } }; } },
          ];
          const token = typeof Core !== 'undefined' && Core.saveMateItem ? Core.saveMateItem(s) : null;
          if (token) rows.push({
            label: `以${token}替其挡劫`, sub: '耗去此物 · 人可留',
            act: s2 => {
              if (Core.spendSaveItem) Core.spendSaveItem(s2, token);
              return { text: `你把${token}按在${mateName(s2) || '那人'}心口。劫光吞下去的是那件东西，不是人。出来时你们都还在，只是那物已成灰。`, fx: { xj: 6, btBuff: 0.03 }, tags: [{ t: `耗${token}`, c: 'down' }, { t: '道侣未失', c: 'gold' }] };
            },
          });
          rows.push(
            { label: '携手入劫', sub: '或有失', act: s2 => {
              if (Math.random() < 0.55) return { text: '你们一起走进那片白。出来时手还牵着，牵得很紧，紧得指节发白。这一次，天没有把人拿走。', fx: { xj: 8, btBuff: 0.04, inj: 1 } };
              loseMate(s2);
              return { text: `${mateName(s2) || '那人'}在最后一道光里松了手。不是放弃，是把生路推给你。此后杯还在，人不再来倒茶。`, fx: { xj: -12, inj: 1 } };
            } },
            { label: '自己先走', act: s2 => { loseMate(s2); return { text: '你先踏了进去。回头时，那个人的嘴型像是“去”。你活着出来了。活着的代价，是案上那只杯从此只是杯子。', fx: { xj: -14, xw: 0.05 } }; } },
          );
          return rows;
        } },

      { id: 'bond_fate', title: '徒来', seal: '徒', w: 7, once: false, rm: [1, 4], portrait: 'tu',
        cond: s => !!pendingDisc(s),
        text: s => {
          const d = pendingDisc(s);
          return `${d.name}在阶下见你，比记忆里高了半头。行礼还是当年的样子，眼神却已经会自己做主。“师父，我想到山外去看看。也想知道，您还要不要我留在门里。”`;
        },
        choices: s => {
          const d = pendingDisc(s);
          return [
            { label: '让其去闯', act: s2 => {
              const x = (s2.bond.discs || []).find(n => n.name === d.name); if (x) { x.stage = x.pending || (x.stage + 1); x.pending = 0; x.aff = Math.min(100, x.aff + 8); }
              return { text: `${d.name}走的时候回头笑了一下。那一笑已经不像孩子。你站在原处，忽然明白收徒的意思：是看着一个人慢慢不再需要你。`, fx: { xj: 4 } };
            } },
            { label: '留其守山', act: s2 => {
              const x = (s2.bond.discs || []).find(n => n.name === d.name); if (x) { x.stage = Math.max(x.stage, 1); x.pending = 0; x.aff = Math.min(100, x.aff + 4); }
              return { text: `你让${d.name}先留下。他应了，应得很轻。轻，是听话；也是还没决定要不要一直听。`, fx: { xj: 2 } };
            } },
            { label: '苛责其心不诚', act: s2 => {
              const x = (s2.bond.discs || []).find(n => n.name === d.name); if (x) { x.pending = 0; x.aff = Math.max(0, x.aff - 18); }
              return { text: `你说了几句很重的话。${d.name}跪着听完，起来时膝盖上有灰，眼里有一种你不想看见的亮。`, fx: { xj: -3 } };
            } },
          ];
        } },
      { id: 'bond_surpass', title: '青出于蓝', seal: '蓝', w: 5, once: true, rm: [2, 4], portrait: 'tu2',
        cond: s => (s.bond && s.bond.discs || []).some(d => d.stage >= 2 && !d.fate && d.aff >= 36),
        text: s => {
          const d = s.bond.discs.find(x => x.stage >= 2 && !x.fate && x.aff >= 36);
          if (typeof Core !== 'undefined') Core.showFoe(s, { rel: 1 }, { name: d.name, title: '你的徒弟' });
          return `${d.name}请你过招。不是赌气，是给他自己一个答案。他的气息竟已比你沉半筹，约莫${Core.foeStr(s)}。`;
        },
        choices: s => [
          { label: '认真过招', sub: '斗法', odds: 0.48, act: s2 => {
            const d = s2.bond.discs.find(x => x.stage >= 2 && !x.fate);
            const r = Core.fightAct(s2, { name: d.name, foe: { rel: 1 }, base: 0.48,
              win: { text: `你赢了半招。${d.name}收手，眼睛却是亮的：“还差半招。下次我来补。”`, fx: { xj: 6, xw: 0.08 } },
              lose: { text: `${d.name}的最后一式你没有接住。他慌忙收剑，你却先笑了。被自己的徒弟胜过，原来是这种味道。`, fx: { xj: 8, inj: 1 } } });
            if (d) d.fate = 'surpass';
            return r;
          } },
          { label: '把后手教给他', act: s2 => {
            const d = s2.bond.discs.find(x => x.stage >= 2 && !x.fate); if (d) d.fate = 'surpass';
            return { text: `你没有比，把一式不肯轻易示人的后手写在他掌心。${d.name}看完，向你拜了三拜。这一拜，是告别，也是接过去。`, fx: { xj: 7 } };
          } },
        ] },
      { id: 'bond_betray', title: '反目', seal: '叛', w: 4, once: true, rm: [2, 4], portrait: 'tu3',
        cond: s => (s.bond && s.bond.discs || []).some(d => !d.fate && d.stage >= 1 && d.aff <= 12),
        text: s => {
          const d = s.bond.discs.find(x => !x.fate && x.stage >= 1 && x.aff <= 12);
          if (typeof Core !== 'undefined') Core.showFoe(s, { rel: 0 }, { name: d.name, title: '你的徒弟' });
          return `${d.name}没有跪。他站在你曾经教他走路的那条阶上，声音发干：“师父，你教我活，没教我一直做你的人。”`;
        },
        choices: s => [
          { label: '听他把话说完', act: s2 => {
            const d = s2.bond.discs.find(x => !x.fate && x.aff <= 12); if (d) d.fate = 'leave';
            return { text: '他说完就走了。没有动手。你站在阶上，觉得有一种失败比斗法输掉更安静。', fx: { xj: -4 } };
          } },
          { label: '拦下', sub: '斗法', odds: 0.5, act: s2 => {
            const d = s2.bond.discs.find(x => !x.fate && x.aff <= 12);
            const r = Core.fightAct(s2, { name: d ? d.name : '徒弟', foe: { rel: 0 }, base: 0.5,
              win: { text: '你赢了。他丢掉剑，说：“赢我容易。”人走了，剑留在阶上，像一句没说完的话。', fx: { xj: -6 } },
              lose: { text: '他没有下死手。你退开时，他已经走远。山门的风从空出来的位置灌进来。', fx: { inj: 1, xj: -4 } } });
            if (d) d.fate = 'betray';
            return r;
          } },
        ] },
      { id: 'bond_inherit', title: '托山', seal: '托', w: 4, once: true, rm: [3, 4], portrait: 'tu2',
        cond: s => s.sect && (s.sect.rank | 0) >= 5 && (s.bond && s.bond.discs || []).some(d => !d.fate && d.stage >= 1 && d.aff >= 48),
        text: s => {
          const d = s.bond.discs.find(x => !x.fate && x.stage >= 1 && x.aff >= 48);
          const org = (typeof ORGS !== 'undefined' && s.sect.org && ORGS[s.sect.org]) ? ORGS[s.sect.org].name : '这扇山门';
          return `长老们没有明说，可茶会散时，有人把${org}的名录推到你手边。${d.name}的名字在末行，字写得很端正。`;
        },
        choices: s => [
          { label: '把山门日后交给他', act: s2 => {
            const d = s2.bond.discs.find(x => !x.fate && x.aff >= 48); if (d) { d.fate = 'inherit'; s2.flags.heirDisc = d.name; }
            return { text: `你在名录空白处写了${d.name}。不是今天交印，是让山门知道：若你有一天不在，钟还有人敲。`, fx: { xj: 6, gx: 20 } };
          } },
          { label: '山门的事，以后再说', act: () => ({ text: '你把名录推回去。以后很长。长，就还不必在今天决定谁来替你老。', fx: { xj: 1 } }) },
        ] },

      { id: 'tide_mochao', title: '魔潮', seal: '潮', w: 6, once: true, rm: [0, 4],
        cond: s => s.flags && s.flags.tideDue === 'mochao',
        text: () => '魔潮真的来了。不是故事里的红云，是一股让鸟不再叫的安静。山门问你去不去西线，血雾那一侧也有人递来无字帖。',
        choices: s => [
          { label: '去西线，把潮头按住', act: s2 => { takeTide(s2, 'mochao', 'seal'); s2.flags.moSealed = 1; return { text: '你在西线站了很久。潮头碰到你的剑，像海碰到礁，礁没有动，海退了一寸。退得很不甘心。', fx: { xj: 4, gx: 24, btBuff: 0.02 }, tags: [{ t: '魔潮 · 镇', c: 'gold' }] }; } },
          { label: '接过无字帖', act: s2 => { takeTide(s2, 'mochao', 'join'); s2.flags.moLean = 1; return { text: '帖是空白的，意思却满。你没有入伙，可你让那条路在你脚边停过。有人会记住这个停。', fx: { xj: -6, ls: 40 }, tags: [{ t: '魔潮 · 偏', c: 'down' }] }; } },
          { label: '关上洞门', act: s2 => { takeTide(s2, 'mochao', 'hide'); return { text: '你把门关上。门外的安静持续了七天。第八天鸟叫了。你不知道是潮退了，还是潮绕开了你。', fx: { xj: -1 } }; } },
        ] },
      { id: 'tide_gengdai', title: '易代', seal: '代', w: 6, once: true, rm: [0, 4],
        cond: s => s.flags && s.flags.tideDue === 'gengdai',
        text: s => `新的年号已经传到${(typeof LOC !== 'undefined' && s.loc && LOC[s.loc]) ? LOC[s.loc].name : '你脚下'}。旧年号的人还在逃，新年号的人已经在征粮。你站在路中间，两边都看你。`,
        choices: s => [
          { label: '护住逃难的人', act: s2 => {
            takeTide(s2, 'gengdai', 'people');
            const tags = []; if (s2.court && typeof courtAdd === 'function') courtAdd(s2, { min: 8, dao: 2 }, tags);
            return { text: '你把路让给担着孩子的人，把征粮的吏让到沟边去说话。年号与你无关，人与你有关。', tags, fx: { xj: 5 } };
          } },
          { label: '为新朝站一场', act: s2 => {
            takeTide(s2, 'gengdai', 'new');
            const tags = []; if (s2.court && typeof courtAdd === 'function') courtAdd(s2, { bing: 6, dao: -4, min: 2 }, tags);
            s2.flags.leanCourt = Math.max(s2.flags.leanCourt | 0, 1);
            return { text: '你没有称臣，只是在乱军里把一面旗扶正。扶正之后，有人开始用新的口气跟你说话。', tags, fx: { xj: -2 } };
          } },
          { label: '两不相帮', act: s2 => { takeTide(s2, 'gengdai', 'none'); return { text: '你走进山。山里没有年号。等你再出来，街上的旗已经换完，人还是那些人。', fx: { xj: 2 } }; } },
        ] },
      { id: 'tide_xianbi', title: '仙门大比', seal: '比', w: 6, once: true, rm: [1, 4],
        cond: s => s.flags && s.flags.tideDue === 'xianbi',
        text: () => '大比的帖子在你案上压了三天。去，是把名字放到天下人眼前；不去，名字就还只在你自己的簿子上。',
        choices: s => [
          { label: '赴会，不求名次，只求一战', act: s2 => {
            takeTide(s2, 'xianbi', 'go');
            s2.flags.legend = (s2.flags.legend | 0) + 1;
            return { text: '你去了。没有拿魁首，可有三个人记住了你的剑或你的沉默。记住，有时比名次更难消。', fx: { xj: 3, gx: 30, xw: 0.08 }, tags: [{ t: '名字被看见', c: 'gold' }] };
          } },
          { label: '只做观礼', act: s2 => { takeTide(s2, 'xianbi', 'watch'); s2.flags.legend = (s2.flags.legend | 0) + 1; return { text: '你坐在很后的地方。看见有人赢，有人哭，有人把失败写成另一条路。你把这些写进自己的簿子。', fx: { xj: 4 } }; } },
          { label: '帖子压回书下', act: s2 => { takeTide(s2, 'xianbi', 'skip'); return { text: '你没有去。大比的锣声据说传了很远，远到你的山，像一声与你无关的雷。', fx: { xj: 1 } }; } },
        ] },
      { id: 'tide_lingku', title: '灵脉将枯', seal: '脉', w: 6, once: true, rm: [1, 4],
        cond: s => s.flags && s.flags.tideDue === 'lingku',
        text: () => '灵脉浅了。洞府里的夜比从前长。有人提议封山独享余脉，有人说该把脉眼让给后辈和山下的田。',
        choices: s => [
          { label: '把余脉分给山下', act: s2 => { takeTide(s2, 'lingku', 'share'); s2.flags.shanCi = 1; return { text: '你把禁制松了一寸。泉眼没有立刻满，可山下有人说井水甜了。山记得这种甜。', fx: { xj: 6 }, tags: [{ t: '与山分脉', c: 'gold' }] }; } },
          { label: '封山，先保自己这一关', act: s2 => { takeTide(s2, 'lingku', 'hoard'); s2.buff = { mul: 1.06, n: 3 }; return { text: '你把山封了三个月。修为确实稳了一稳。稳的时候你听见山下有人骂，骂声不高，刚好够你假装是风。', fx: { xj: -4 }, tags: [{ t: '灵脉暂厚', c: 'up' }] }; } },
          { label: '离开这条脉', act: s2 => { takeTide(s2, 'lingku', 'leave'); return { text: '你收拾洞府，像收拾一个已经不住的人。脉还在枯，可至少不是在你脚下枯给别人看。', fx: { xj: 3 } }; } },
        ] },
      { id: 'tide_after', title: '余波', seal: '波', w: 5, once: true, rm: [1, 4],
        cond: s => s.flags && s.flags.tideAfterAt && (s.months | 0) >= s.flags.tideAfterAt && s.shi && s.shi.side && Object.keys(s.shi.side).length,
        text: s => {
          const side = s.shi.side || {};
          const bits = [];
          if (side.mochao === 'seal') bits.push('西线来信：魔潮退处长出了草，草很普通，普通得像在谢你。');
          else if (side.mochao === 'join') bits.push('有本无名册子在坊间流传，上面有一个像你的名字，写在不该写的那一栏。');
          else if (side.mochao === 'hide') bits.push('有人问你当年为何闭门。你还没有想好回答。');
          if (side.gengdai === 'people') bits.push('新朝的榜上没有你，逃难的人却还在讲一个不肯让路给刀的修士。');
          else if (side.gengdai === 'new') bits.push('新朝的吏部记得你扶过的那面旗。记得，不一定是恩。');
          if (side.xianbi === 'go' || side.xianbi === 'watch') bits.push('大比已散，可还有少年在模仿你站立的样子。');
          if (side.lingku === 'share') bits.push('你分出去的那寸灵脉，如今养着几亩薄田。');
          else if (side.lingku === 'hoard') bits.push('封山的三个月过去了，脉还是浅。浅，不会因为你独占就变深。');
          return bits.join('') || '天下的风还在吹。你已经知道它从哪一边来，也知道自己当时面向哪一边。';
        },
        choices: () => [
          { label: '把这些记下', act: s => { s.flags.legend = (s.flags.legend | 0) + 1; return { text: '你记下了。不是为了辩解，是为了老的时候，还能认出自己。', fx: { xj: 3 } }; } },
          { label: '合上，不再看', act: () => ({ text: '你把消息叠好，压在书下。余波还是余波。人要往前走，不能老站在自己的选择里。', fx: { xj: 1 } }) },
        ] },

      { id: 'end_huashen', title: '山神祠前', seal: '山', w: 3, once: true, rm: [2, 4],
        cond: s => (s.realm | 0) >= 2 && (s.age | 0) >= 68 && (s.origin === 'liehu' || (s.life && s.life.goal === 'xiaoyao')) && s.flags.shanCi && !s.flags.end_pick,
        text: () => '你又站在那座没有门的祠前。石像的脸被烟熏得看不清，可你觉得它在等一个愿意留下来的人。留下来，就不再是过路的修士。',
        choices: () => [
          { label: '把名字刻进山里', sub: '此卷终 · 化身山神', act: s => { s.flags.end_pick = 1; return { text: '你把名字刻得很浅。浅，是因为山会自己把字长深。风从祠后过来，这一次像接住了你。你不再赶路。路开始从你脚下长出去。', fx: { end: 'huashen', xj: 8 } }; } },
          { label: '还是要走', act: () => ({ text: '你作了一揖，还是走了。山没有挽留。挽留这种事，山做得比人含蓄。', fx: { xj: 2 } }) },
        ] },
      { id: 'end_zhenmo', title: '潮未退', seal: '镇', w: 3, once: true, rm: [3, 4],
        cond: s => (s.realm | 0) >= 3 && (s.origin === 'moyi' || (s.life && s.life.goal === 'xuechou') || s.flags.moBlood) && (s.flags.moSealed || s.flags.moBlood) && !s.flags.end_pick,
        text: () => '魔潮没有灭，只是在等一个盖子。你看着那道裂口，忽然明白：有的债不是杀掉谁就能结，是得有人坐在裂口上，坐很多年。',
        choices: () => [
          { label: '坐下去', sub: '此卷终 · 以身镇魔', act: s => { s.flags.end_pick = 1; return { text: '你坐下。剑横在膝上，不是为了杀，是为了做一个很沉的镇纸。裂口在你身下慢慢合拢，合拢的声音像一声谢谢，又像一声对不起。', fx: { end: 'zhenmo', xj: 6 } }; } },
          { label: '把裂口留给后来的人', act: () => ({ text: '你在裂口边留下标记，然后离开。后来的人若肯坐，会看见你的标记。若不肯，标记也只是标记。', fx: { xj: -2 } }) },
        ] },
      { id: 'end_chuanshuo', title: '封笔', seal: '传', w: 3, once: true, rm: [1, 4], portrait: 'zhaoheng',
        cond: s => (s.age | 0) >= 78 && (s.events | 0) >= 8 && ((s.life && s.life.goal === 'qingshi') || s.origin === 'shusheng') && ((s.flags.legend | 0) >= 1) && !s.flags.end_pick,
        text: () => '你把这一生能写的都写在一本很薄的册子上。薄，是因为你删掉了所有为自己辩解的句子。剩下的，够不够让后世把你当成一个真的人？',
        choices: () => [
          { label: '把册子放进石室', sub: '此卷终 · 成为传说', act: s => { s.flags.end_pick = 1; s.flags.legend = (s.flags.legend | 0) + 1; return { text: '你把册子放好，没有署名在封面上。封面会烂，句子不一定。你走出石室时觉得轻。轻，是因为重的部分已经留下了。', fx: { end: 'chuanshuo', xj: 6 } }; } },
          { label: '还不到封笔的时候', act: () => ({ text: '你把册子收回袖中。传说可以再等。人若还想活，就还不必把自己写成过去。', fx: { xj: 2 } }) },
        ] },

      { id: 'heir_cave', title: '旧钥', seal: '钥', w: 7, once: true, rm: [0, 4],
        cond: s => !!(s.flags && s.flags.heirCave) && !s.flags.heirCaveDone,
        text: s => {
          const c = s.flags.heirCave || {};
          return `你在石缝里摸到半枚旧钥。钥上的纹路像梦里见过。梦的主人不是今生的你。钥柄刻着一个地方的简称，像是「${c.name || '旧洞'}」。`;
        },
        choices: s => [
          { label: '循纹找去', act: s2 => {
            s2.flags.heirCaveDone = 1;
            if (typeof Samsara !== 'undefined' && Samsara.markRelic) Samsara.markRelic('cave', (s2.flags.heirCave && s2.flags.heirCave.name) || '');
            const modest = s2.flags.heirCave && s2.flags.heirCave.modest;
            return { text: modest
              ? '洞很浅，浅得像一句没写完的话。你在里面坐了一坐，捡到前世没拿走的一点碎银和一张草图。'
              : '洞府打扫得很干净，像有人知道你会来。石床还温，温的不是火，是一种被记得的感觉。你在壁上找到前世留下的半行字。',
            fx: modest ? { ls: 25, xj: 3 } : { ls: 40, xw: 0.18, xj: 4, buff: { mul: 1.05, n: 2 } } };
          } },
          { label: '把钥放回石缝', act: s2 => { s2.flags.heirCaveDone = 1; return { text: '你把钥放回去。有些门不必进。知道它在，就已经是一种继承。', fx: { xj: 3 } }; } },
        ] },
      { id: 'heir_page', title: '残页重现', seal: '页', w: 7, once: true, rm: [0, 4],
        cond: s => !!(s.flags && s.flags.auxPage && typeof GONGFA !== 'undefined' && GONGFA[s.flags.auxPage]) && !(s.gfs && s.gfs[s.flags.auxPage]) && !s.flags.heirPageDone,
        text: s => `书贩的筐底压着一张残页，墨色新得不像古物。你读到篇名，指节一紧——《${GONGFA[s.flags.auxPage].name}》。这字，你的手比你的记忆更早认得。`,
        choices: s => [
          { label: '买下，当场读完', act: s2 => {
            s2.flags.heirPageDone = 1;
            const id = s2.flags.auxPage;
            if (typeof Samsara !== 'undefined' && Samsara.markRelic) Samsara.markRelic('page', id);
            return { text: `残页并不残。你读到最后，前世停笔的地方，今生刚好接上。`, fx: { gf: id, ls: -8, lsRaw: true, xj: 3 } };
          } },
          { label: '只抄半页', act: s2 => { s2.flags.heirPageDone = 1; return { text: '你抄了半页。半页足够让你夜里睡不着，也足够让你知道：有些路你走过，不必一次走完。', fx: { xj: 2, xw: 0.06 } }; } },
        ] },
      { id: 'heir_fabao', title: '旧器鸣', seal: '鸣', w: 6, once: true, rm: [0, 3],
        cond: s => !!(s.flags && s.flags.canhunSeed) && !s.fabao && !s.flags.heirFabaoDone,
        text: s => {
          const c = s.flags.canhunSeed || {};
          return `静坐时识海里有一下很轻的鸣，像金属碰到金属。一个名字自己浮上来：${c.name || '那件旧器'}。它还没有到你手里，可它已经知道你在。`;
        },
        choices: s => [
          { label: '应一声', act: s2 => {
            s2.flags.heirFabaoDone = 1;
            if (typeof Samsara !== 'undefined' && Samsara.markRelic) Samsara.markRelic('fabao', (s2.flags.canhunSeed && s2.flags.canhunSeed.name) || '');
            return { text: '你在心里应了一声。鸣停了，像得到了许可。破境之时，它或许会自己来认你。', fx: { xj: 3 } };
          } },
          { label: '按下不答', act: s2 => { s2.flags.heirFabaoDone = 1; return { text: '你没有应。鸣又响了一下，然后很有礼貌地消失。有些继承，连拒绝都会被记住。', fx: { xj: 1 } }; } },
        ] },
    );

    const d0 = EVENTS.find(e => e.id === 'disciple');
    if (d0 && !d0._juan) {
      d0._juan = 1;
      const base = d0.choices;
      d0.choices = s => base(s).map((c, i) => {
        if (i) return c;
        const act = c.act;
        return Object.assign({}, c, { act: s2 => { const r = act(s2); takeDisc(s2); return r; } });
      });
      d0.portrait = 'tu';
    }
  }

  ['bond_meet'].forEach(id => pin('taohua', id));
  pin('gufu', 'heir_cave'); pin('shanmen', 'heir_cave');
  pin('shanmen', 'heir_page'); pin('yunyue', 'heir_page');
  pin('shanmen', 'heir_fabao');

  return {
    ORIGINS, byId, ensure, boot, originLine, originName, tick, dueEvent,
    onLog, sealLine, coloShown, markLabel, takeDisc, mateName, emptyBond,
  };
})();
