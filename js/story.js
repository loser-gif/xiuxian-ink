/* 墨仙录 · v0.6「道途」：功法、境界奇遇、结局文案 */
'use strict';
Object.assign(TEXT, {
  crush: ['你只一拂袖，{f}便如落叶般翻了出去。', '你甚至没有起身，只抬眼一看，{f}已瘫软在地，抖如筛糠。', '一道剑气掠过，{f}的兵刃齐齐断成两截。你收回手指，懒得再看第二眼。', '你屈指一弹，{f}倒飞十丈，再爬起来时，已是磕头如捣蒜。'],
  dominant: ['高下之分，一交手便见分晓。{f}连三招都没走满，便落荒而逃。', '{f}拼尽全力，在你面前却像孩童挥棒。你点到为止，放了一条生路。'],
  gfUp: ['周天路数愈发圆熟，气行如水过渠。', '口诀里那几处晦涩，今日忽然读通了。', '功法与经脉相契，再无半分滞涩。'],
  xjLow: '近来夜夜惊梦，打坐时总听见有人在耳边低语。心境若再崩，恐有走火入魔之虞。',
  zouhuo: '行功至紧要处，丹田里那股阴冷之气忽然反噬，你眼前一黑，七窍渗出血来。',
  rumoBreak: '关隘未破，心魔却趁虚而入。你听见自己在笑，笑声越来越大，越来越陌生……',
  wangqingCost: '只是心中又空了一块，你竟想不起，上一回落泪是为了谁。',
  bingjie: '天劫落下的那一刻，你捏碎了掌心的兵解玉符。肉身在雷光中化作飞灰，一点真灵却挣脱而出，没入茫茫轮回。',
  yunluo: ['关隘反噬如山崩海啸。你最后看见的，是自己的元婴在丹田中寸寸碎裂。', '第七道天雷落下时，护体灵光碎了。第八道，你听见自己的骨头在响。第九道之后，山巅只余一片焦土。'],
  sectGift: ['筑基之喜传回宗门，执事长老亲自送来一卷功法：“宗门赐你《{g}》，与你灵根相合，好生参悟。”', '你结丹的消息震动青冥宗。宗主召你入殿，赐下镇宗秘传之一《{g}》：“你已是宗门柱石，此经，望你传下去。”'],
});
Object.assign(PILLS, {
  '清心丹': { desc: '以雪莲、静心草炼成，服之可平心魔，心境大复。', use: true },
  '兵解玉符': { desc: '劫中身死时自行碎裂，护一点真灵入轮回。', use: false },
});

// 按灵根挑一卷凡品功法（异灵根/伪灵根则随缘）
const gfFor = s => (ELEMENTS.includes(s.lgEls[0]) ? GF_BY_EL[s.lgEls[0]] : GF_FAN[Math.floor(Math.random() * GF_FAN.length)]);
const XIAOBI = {
  qm: {
    outer: { title: '外门小比', yard: '演武坪', who: '外门', foe: '金线弟子', ft: '外门弟子' },
    inner: { title: '内门大比', yard: '问道台', who: '内门', foe: '青袍师兄', ft: '内门弟子' },
    watch: { title: '外门观礼', yard: '演武坪', role: '判官' },
  },
  dx: {
    outer: { title: '外谷小比', yard: '丹坪', who: '外谷', foe: '赤袖弟子', ft: '外谷弟子' },
    inner: { title: '内谷论丹', yard: '丹霞内坪', who: '内谷', foe: '守炉师兄', ft: '内谷弟子' },
    watch: { title: '外谷观礼', yard: '丹坪', role: '判官' },
  },
  yy: {
    outer: { title: '外殿小比', yard: '影坪', who: '外殿', foe: '黑纱弟子', ft: '外殿弟子' },
    inner: { title: '内殿夺影', yard: '幽荧内殿', who: '内殿', foe: '影中人', ft: '内殿弟子' },
    watch: { title: '外殿观礼', yard: '影坪', role: '前辈' },
  },
  xj: {
    outer: { title: '外楼小比', yard: '演机坪', who: '外楼', foe: '铜环弟子', ft: '外楼弟子' },
    inner: { title: '内楼演机', yard: '璇玑台', who: '内楼', foe: '机纹师兄', ft: '内楼弟子' },
    watch: { title: '外楼观礼', yard: '演机坪', role: '前辈' },
  },
  sx: {
    outer: { title: '盟中小擂', yard: '客栈后院', who: '盟中', foe: '行客', ft: '散修行客' },
    inner: { title: '客卿论道', yard: '盟中议事厅', who: '客卿', foe: '客卿', ft: '散修客卿' },
    watch: { title: '小擂观礼', yard: '客栈后院', role: '前辈' },
  },
};
function wuxingWin(s) {
  const id = s.lg && s.lg.id;
  const tail = '碑上的字缓缓剥落，飞入你的眉心——《五行归一真经》。';
  if (id === 'tian' || id === 'yi') return `五道光柱自残碑升起，在你头顶交汇。你那条本就清澈的灵根被五气一冲，几乎散开，又在眉心重新聚成一线。${tail}`;
  if (id === 'shuang') return `五道光柱自残碑升起，在你头顶交汇。你体内两道灵根第一次不再各行其是，而是首尾相衔，锁成一个环。${tail}`;
  return `五道光柱自残碑升起，在你头顶交汇。你体内驳杂的灵根第一次不再相互掣肘，而是首尾相衔，转成一个圆。${tail}`;
}
function xiaobiPack(s) {
  const id = (s.sect && s.sect.org) || 'qm';
  const pack = XIAOBI[id] || XIAOBI.qm;
  const band = Core.sectBand(s);
  const kind = band === 'inner' ? 'inner' : (band === 'core' || band === 'elder' ? 'watch' : 'outer');
  return { kind, face: pack[kind], org: id };
}
const gfOther = (s, not) => { const pool = GF_FAN.filter(id => id !== not && !s.gfs[id]); return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null; };
const gfn = id => GONGFA[id].name;

// 坊市：添一笔功法残卷（占位，日后扩成坊市界面）
(() => {
  const m = EVENTS.find(e => e.id === 'market'); const base = m.choices;
  m.choices = s => {
    const list = base(s); const p = 60 * REALMS[s.realm].lsScale;
    list.splice(list.length - 1, 0, { label: '购功法残卷', sub: `灵石${cn(p)} · 真伪难辨`, disabled: s.ls < p, act: s => {
      const pool = Object.keys(GONGFA).filter(id => GONGFA[id].grade <= Math.min(1, s.realm) && !GONGFA[id].mo && !s.gfs[id] && GONGFA[id].el !== '雷' && GONGFA[id].el !== '风' && GONGFA[id].el !== '冰' && id !== 'wuxing');
      if (!pool.length || Math.random() < 0.3) return { text: '残卷用油布裹了三层，回到洞府展开一看，前半卷是功法，后半卷却是一本春宫。你哭笑不得。', fx: { ls: -p, lsRaw: true, xj: 2 } };
      const id = pool[Math.floor(Math.random() * pool.length)];
      return { text: `卖残卷的是个瞎眼说书人，摸着灵石笑道：“老朽看不见字，客官自己瞧。”你就着灯火细读——竟是一卷完整的《${gfn(id)}》。`, fx: { ls: -p, lsRaw: true, gf: id } };
    } });
    return list;
  };
})();

EVENTS.push(
  /* ===================== 炼气 ===================== */
  { id: 'cangjing', title: s => {
      const band = Core.sectBand(s);
      if (band === 'elder' || band === 'core') return '巡阁取卷';
      if (band === 'inner') return '点校内册';
      return '藏经阁扫尘';
    }, w: 9, rm: [0, 0], once: true, cond: s => s.lg.id !== 'wei',
    text: s => {
      const o = s.sect && s.sect.org && typeof ORGS !== 'undefined' ? ORGS[s.sect.org] : null;
      const lib = o ? o.lib : '藏经阁';
      const band = Core.sectBand(s);
      if (band === 'elder' || band === 'core') return `你以${Core.rankName(s)}之身巡过${lib}。高阁只对这个身份开一隙，守阁人起身让座：“要哪一卷，尽管取。莫贪。”`;
      if (band === 'inner') return `${lib}点校的差事落到你头上。内册错页、虫蛀、朱批，都要过目。守阁人打着盹：“看完了，许你挑一卷带走。莫贪，莫挑花眼。”`;
      return `轮到你去${lib}扫尘。一层书架上落满了灰，竹简的绳结一碰便断。守阁的老道士打着盹，眼也不睁：“扫完了，许你挑一卷带走。莫贪，莫挑花眼。”`;
    },
    choices: s => { const a = gfFor(s), b = gfOther(s, a) || a;
      const orgO = s.sect && s.sect.org && typeof ORGS !== 'undefined' ? ORGS[s.sect.org] : null;
      const book = orgO && orgO.startGf && GONGFA[orgO.startGf] ? GONGFA[orgO.startGf].name : '青冥引气诀';
      return [
      { label: `取《${gfn(a)}》`, sub: `${GONGFA[a].el}行 · ${GONGFA[a].trait}`, act: () => ({ text: `你在角落里抽出一卷《${gfn(a)}》，竹简上的字迹被人摩挲得发亮。守阁人眯眼看了看，嘟囔一句：“倒也识货。”`, fx: { gf: a } }) },
      ...(b !== a ? [{ label: `取《${gfn(b)}》`, sub: `${GONGFA[b].el}行 · ${GONGFA[b].trait}`, act: () => ({ text: `你挑了《${gfn(b)}》。守阁人翻了个身：“与你灵根未必相合，自己的路，自己走。”`, fx: { gf: b } }) }] : []),
      { label: '不取，只抄一页口诀', sub: '', act: () => ({ text: `你把书架擦得一尘不染，只在《${book}》的旧注里抄了一页心得。守阁人忽然睁眼，看了你很久。`, fx: { gfXp: 4, xj: 4 } }) },
    ]; } },
  { id: 'herbold', title: '药园老人', w: 7, rm: [0, 0], once: true,
    text: () => '药园角落里住着一个老杂役，佝偻着腰，日日蹲在田垄间，侧着耳朵，像在听什么。有人说他年轻时也是内门弟子，后来犯了事，便再没出过这片药园。',
    choices: s => [
      { label: '帮他挑水，顺口请教', sub: '耗时一季', act: s => Math.random() < 0.6 + s.luck * 0.03
        ? { text: '你替他挑了一季的水。某天傍晚，他忽然拍拍身边的田垄：“躺下，听。”你躺下去，听见地气一寸一寸往上涌，像远处有人在擂一面极慢的鼓。他把这法子叫作《厚土培元功》。', fx: { gf: 'houtu', xj: 4, time: 3 } }
        : { text: '老人收下了你的水，却始终一言不发。季末那天，他把一株开得正好的灵草塞进你怀里，挥手让你走。', fx: { item: { '聚气丹': 1 }, xj: 5, time: 3 } } },
      { label: '敬而远之', sub: '', act: () => ({ text: '犯过事的人，还是少沾为妙。你绕开那片药园，只是夜里偶尔会想，他究竟在听什么。', fx: {} }) },
    ] },
  { id: 'xiaobi', title: s => {
      const p = xiaobiPack(s); return p.face.title;
    }, w: 7, rm: [0, 0], cond: s => !!(s.sect && s.sect.org),
    text: s => {
      const p = xiaobiPack(s), face = Core.rootFace(s), f = p.face;
      if (p.kind === 'watch') {
        return `你以${Core.rankName(s)}之身，被请到${f.yard}做${f.role}。台上是一场给后辈的小比，少年们意气飞扬。执事把朱笔递到你手里：“前辈看一眼，便是他们的名次。”`;
      }
      Core.showFoe(s, { rel: 2 }, { name: f.foe, title: f.ft });
      if (p.kind === 'inner') {
        return `${f.title}。${f.yard}上名牌里有你的名字，对手是早你两年入门的${f.foe}。${face.peer}`;
      }
      return `${f.who}三年一度小比，擂台设在${f.yard}上。你的对手早你两年入门，抱臂冷笑：“${face.taunt}”${face.aside}`;
    },
    choices: s => {
      const p = xiaobiPack(s), f = p.face;
      if (p.kind === 'watch') return [
        { label: '公正落笔', sub: '后辈的名次', act: () => ({ text: `你把名次写得很慢。台上那几个少年下台时朝你拱手，像看见了自己以后的路。`, fx: { gx: 8, xj: 4, xw: 0.25, ls: 12 } }) },
        { label: '点到即止，放他们一马', sub: '', act: () => ({ text: '你没有把输的人写得太难看。散场时有个少年追出来，塞给你一包自己烘的茶，说不出谢谢。', fx: { xj: 6, xw: 0.35 } }) },
      ];
      const base = s => 0.45 + s.luck * 0.03 + s.wx * 0.02;
      return [
        { label: '全力以赴', sub: '凭气运与悟性', odds: base, act: s => Core.fightAct(s, { name: f.foe, foe: { rel: 2 }, base: base(s),
          win: { text: p.kind === 'inner'
            ? `第三十七招，你一掌拍在${f.foe}肩头。台下骤然安静。执事敲了敲铜锣，把头名的赏赐推到你面前。`
            : '第三十七招，你一掌拍在他肩头。台下骤然安静。执事敲了敲铜锣，把头名的赏赐推到你面前。', fx: { ls: 30, item: { '聚气丹': 1 }, xj: 5 } },
          lose: { text: '你被一脚踹下擂台，滚了满身泥。那天夜里，你在后山对着一棵老松，一掌一掌，打到天亮。', fx: { inj: 1, xj: -3, xw: 0.2 } } }) },
        { label: '点到为止，借机观摩', sub: '', act: () => ({ text: '你早早认输，下台后却在擂台边看了一整天。三十几场比斗看下来，各家路数在心里慢慢理出了脉络。', fx: { xw: 0.35 } }) },
      ];
    } },
  { id: 'wolf', title: '独眼妖狼', w: 7, rm: [0, 0],
    text: s => { Core.showFoe(s, { realm: 0, stage: 5 }, { name: '妖狼', title: '山道拦路' }); return '采药归来，暮色里一头独眼妖狼拦在山道上，涎水滴在石阶上，嘶嘶冒着白气。它比寻常狼大了一圈，脖颈上还套着半截断链——像是从谁家兽栏里逃出来的。'; },
    choices: s => [
      { label: '拔剑', sub: '凶险', odds: s => 0.5 + s.luck * 0.03, act: s => Core.fightAct(s, { name: '妖狼', foe: { realm: 0, stage: 5 }, base: 0.5 + s.luck * 0.03,
        win: { text: '它扑上来的那一刻，你侧身一剑，从断链底下刺入。妖狼哀嚎着倒地，喉间滚出一枚浑浊的妖丹。你提着剑站了很久，手才不抖。', fx: { ls: 25, xw: 0.3, xj: 2 } },
        lose: { text: '狼爪撕开了你的肩膀。你滚下山坡，在溪水里躲了一夜，天亮才敢爬出来。', fx: { inj: 3, xj: -2 } } }) },
      { label: '抛下药篓，引开它', sub: '', act: () => ({ text: '你把一篓药草远远抛进林子，妖狼循着血腥气扑了过去。一季的辛苦白费了，命总算还在。', fx: { xj: 2 } }) },
    ] },
  { id: 'letter', title: '无名信', w: 6, rm: [0, 0], once: true, cond: s => s.lg.id !== 'wei',
    text: s => { Core.showFoe(s, { rel: 1 }, { name: '蒙面弟子', title: '不知来历', hide: true }); return '一封没有署名的信塞在你门缝里，字迹清秀：“明日卯时，后山断桥，有一样东西要交给你。”来人把修为敛得很死，你只摸到一个大概。'; },
    choices: s => [
      { label: '赴约', sub: '或是局', odds: s => 0.62 + s.luck * 0.03, act: s => Core.fightAct(s, { name: '蒙面弟子', foe: { rel: 1 }, base: 0.62 + s.luck * 0.03,
        win: { text: '断桥边站着一个面生的师姐。她递过一只布包，说是你那早逝的同乡临终托付。布包里是两粒丹药，和一张字条，墨迹被水洇过：“替我走得远些。”', fx: { item: { '聚气丹': 2 }, xj: 6 } },
        lose: { text: '断桥边没有人，只有几个蒙面弟子从林中闪出。原来是有人嫉你资质，设局相诱。你拼着挨了两拳才脱身。', fx: { inj: 2, xj: -3 } } }) },
      { label: '置之不理', sub: '', act: () => ({ text: '你把信纸凑到灯上烧了。灰烬里那个“走”字最后才卷起来。', fx: {} }) },
    ] },
  { id: 'sanxiu', title: '破庙独臂人', w: 6, rm: [0, 1], once: true, wf: s => s.lg.id === 'wei' ? 22 : (s.gf ? 4 : 10),
    text: () => '破庙里，一个独臂散修烤着半只山鸡。见你盯着看，他掰下一条腿扔过来：“吃吧。看你这身打扮，也是没门没派的。”火光映着他空荡荡的袖管。',
    choices: s => { const id = gfFor(s); return [
      { label: '陪他喝酒', sub: '', act: () => ({ text: `酒过三巡，他用仅剩的那只手蘸着酒，在供桌上写下一篇口诀：“我这条胳膊，是拿命换来的这卷《${gfn(id)}》。你拿去，别学我。”天亮时，他已不知去向。`, fx: { gf: id } }) },
      { label: '道谢告辞', sub: '', act: () => ({ text: '你啃完鸡腿，拱手作别。走出很远，还听见他在庙里哼一支走调的小曲。', fx: { xj: 3 } }) },
    ]; } },
  { id: 'shusi', title: '旧书肆', w: 5, rm: [0, 2], once: true,
    text: () => '镇上旧书肆里，掌柜论斤卖书。你随手翻开一册，是庄子的《逍遥游》，字缝里却有人用朱笔密密批着运气之法，笔意潇洒，像是随手写给自己看的。',
    choices: s => [
      { label: '买下', sub: '灵石十', disabled: s.ls < 10, act: () => ({ text: '掌柜称了称：“二两，算你十块灵石。”你揣着它走在回山的路上，忽然很想多看几眼路边的野花。', fx: { ls: -10, lsRaw: true, gf: 'xiaoyao' } }) },
      { label: '放回去', sub: '', act: () => ({ text: '你把书放回原处。走出门时，风翻动了书页，哗啦啦的，像有人在笑。', fx: {} }) },
    ] },

  /* ===================== 筑基 ===================== */
  { id: 'jianzhong', title: '剑冢', w: 7, rm: [1, 2], once: true,
    text: () => '北岭剑冢里埋着三千柄无主之剑，每逢月圆，剑鸣如潮。你踏着满地锈铁走进去，忽有一柄残剑嗡然作响，剑身上缓缓浮出几行小字。',
    choices: s => { const id = s.realm >= 2 ? 'taibai' : 'baihong'; return [
      { label: '握住残剑', sub: '剑意反噬，生死一线', act: s => Math.random() < 0.45 + s.luck * 0.03 + (s.lgEls.includes('金') ? 0.15 : 0)
        ? { text: `剑柄冰冷，一股凌厉剑意顺着手臂直冲识海。你咬牙不松，直到那些小字一个个烙进脑中——是《${gfn(id)}》。残剑在你掌心化作铁屑，簌簌落下。`, fx: { gf: id } }
        : { text: '剑意如万箭穿心，你被震飞出去，撞断了三柄锈剑。爬起来时，满地的剑都在嗡嗡作响，像在嘲笑。', fx: { inj: 3, xj: -3 } } },
      { label: '拜剑而退', sub: '', act: () => ({ text: '你对着满冢残剑长揖到地。这些剑的主人，都曾以为自己会是最后一个。', fx: { xj: 6 } }) },
    ]; } },
  { id: 'xueyu', title: '血色玉简', w: 5, rm: [1, 2], once: true,
    text: () => '你在一具魔修尸身上搜出一枚血色玉简。玉简入手冰凉，却像有心跳一般，一下一下撞着你的掌心。神识方一触及，便有个声音贴着耳根低语：“修我。修我，便快。”',
    choices: s => [
      { label: '参悟玉简', sub: '魔功 · 心境大损', act: () => ({ text: '你闭上眼，任那声音引着你走进一片血色。醒来时已是三日之后，丹田里多了一股阴冷的力量，饿得发慌。你知道，有些门一旦推开，就关不上了。', fx: { gf: 'tianmo', xj: -10 } }) },
      { label: '捏碎玉简', sub: '', act: () => ({ text: '玉简在你掌中碎裂，那声音尖叫着散去。你掌心留下一道细细的血痕，许多年都没有褪。', fx: { xj: 10 } }) },
      ...(s.lg.id !== 'wei' ? [{ label: '上交宗门', sub: '', act: () => ({ text: '戒律堂长老接过玉简，脸色骤变，当即封入禁地。三日后，你的名字被记进了功劳簿。', fx: { ls: 80, luck: 1 } }) }] : []),
    ] },
  { id: 'danhui', title: '青冥丹会', w: 6, rm: [1, 1],
    text: () => '青冥城三年一度丹会，各家丹师当街开炉，炉火映红半座城。你挤在人群里，一位白发丹师忽然朝你招手：“小友根骨不错，替老夫守一炉火如何？”',
    choices: s => [
      { label: '守炉', sub: '耗时一季', act: () => Math.random() < 0.65
        ? { text: '你守了三个月的炉火，一刻不敢合眼。开炉那日，丹香飘出三条街。老丹师拈出一粒凝元丹放在你掌心：“酬劳。下回丹会，还来。”', fx: { item: { '凝元丹': 1 }, time: 3 } }
        : { text: '第八十一天夜里，炉中丹气忽然暴走。“轰”的一声，你和老丹师一起被掀翻在地，须发皆焦。他哈哈大笑，塞给你一袋灵石压惊。', fx: { inj: 1, ls: 25, time: 3 } } },
      { label: '买一瓶清心丹', sub: '灵石四十', disabled: s.ls < 40, act: () => ({ text: '丹铺伙计包好丹药，随口道：“近来买清心丹的多，世道乱，人心也乱。”', fx: { ls: -40, lsRaw: true, item: { '清心丹': 1 } } }) },
      { label: '只看热闹', sub: '', act: () => ({ text: '你看了一整天的开炉，记下了几样火候诀窍。丹道一途，原来也通修行。', fx: { xw: 0.2 } }) },
    ] },
  { id: 'tongxiang', title: '同乡', w: 6, rm: [1, 2], once: true,
    text: s => `你在坊市遇见当年一同上山的同乡少年——如今已是两鬓斑白的炼气修士。他局促地搓着手，叫你“前辈”。你们同岁，都是${cn(s.age)}岁。`,
    choices: s => [
      { label: '点拨他几句', sub: '', act: () => Math.random() < 0.5
        ? { text: '你点破了他卡了二十年的那处关窍。他愣了半晌，忽然蹲在地上，哭得像个孩子。半年后你听说，他筑基了。', fx: { xj: 12, luck: 1 } }
        : { text: '你说得仔细，他听得认真，只是资质所限，终究没能明白。临别时他执意把一包家乡的茶叶塞给你。', fx: { xj: 6 } } },
      { label: '叙旧一夜', sub: '', act: () => ({ text: '你们在酒肆里坐到天明。他说起镇上的人，谁家娶了亲，谁家添了丁，谁又走了。你才发现，青石镇的事，你已经一件也不知道了。', fx: { xj: 7, time: 1 } }) },
      { label: '装作不识', sub: '', act: () => ({ text: '你别过脸，从他身边走过。他张了张嘴，终究没有叫出你的名字。', fx: { xj: -6 } }) },
    ] },
  { id: 'hantan2', title: '墨潭', w: 6, rm: [1, 2], once: true,
    text: () => '深山有一潭，潭水漆黑如墨，终年不冻。月圆之夜，潭底泛起幽幽青光，隐约可见一只玉匣沉在乱石之间。',
    choices: s => { const id = s.realm >= 2 ? 'jiuyou' : 'guicang'; return [
      { label: '潜入潭底', sub: '寒气蚀骨', act: s => Math.random() < 0.45 + s.luck * 0.03 + (s.lgEls.includes('水') ? 0.15 : 0)
        ? { text: `潭水冷得像刀子。你潜到底时，玉匣自己开了，一卷《${gfn(id)}》浮上来，字迹是用水写的，一离开潭水便要消散。你在潭边坐了七天，把每一个字都刻进了心里。`, fx: { gf: id, time: 1 } }
        : { text: '寒气钻进骨缝，你手脚僵硬，几乎沉在潭底。爬上岸时，眉毛都结了霜。', fx: { inj: 3, life: -2 } } },
      { label: '潭边打坐', sub: '', act: () => ({ text: '你在潭边坐了一夜。月影沉在墨色的水里，一动不动。你忽然觉得，自己心里也有这样一潭水。', fx: { xj: 8, xw: 0.25 } }) },
    ]; } },
  { id: 'heifeng', title: '黑风岭', w: 6, rm: [1, 2],
    text: s => { Core.showFoe(s, { rel: anyOf([0, 1, 1, 2]) }, { name: '贼首', title: '黑风岭' }); return `一伙劫修盘踞黑风岭，近来连劫了三支商队，杀人不留活口。镇上的悬赏告示贴满了城门，赏格一涨再涨。据逃回来的车夫说，贼首已是${Core.foeStr(s)}的修为。`; },
    choices: s => [
      { label: '独闯黑风岭', sub: '凶险', odds: s => 0.5 + s.luck * 0.03, act: s => Core.fightAct(s, { name: '贼首', base: 0.5 + s.luck * 0.03,
        win: { text: '你借着夜雨摸上山寨，一盏茶工夫，寨中便只剩风声。你在贼首的密室里找到了三支商队的货单，和一瓶没开封的丹药。', fx: { ls: 90, item: { '回春丹': 1 }, xw: 0.3, xj: 3 } },
        lose: { text: s => `那名${Core.foeStr(s)}的贼首果然名不虚传，寨中又布了阵。你身中三刀，拼死杀出重围。`, fx: { inj: 4, life: -3 } } }) },
      { label: '邀同道共剿', sub: '耗时一季', act: () => ({ text: '你联络了几位散修，围山三月，终将劫修一网打尽。赏银分下来不多，城门口的告示却终于撕了。', fx: { ls: 40, xj: 5, time: 3 } }) },
      { label: '与我何干', sub: '', act: () => ({ text: '你绕开了黑风岭。半月后，又一支商队没能走出山谷。', fx: { xj: -4 } }) },
    ] },

  /* ===================== 金丹 ===================== */
  { id: 'huoshan', title: '火山遗府', w: 6, rm: [2, 3], once: true,
    text: () => '赤焰山喷发之后，山腹里露出一座半熔的洞府，门楣上“焚天”二字犹自通红。热浪扑面而来，连你的护体灵光都在嗤嗤作响。',
    choices: s => [
      { label: '冒火而入', sub: '烈焰焚身', act: s => Math.random() < 0.45 + s.luck * 0.03 + (s.lgEls.includes('火') ? 0.15 : 0)
        ? { text: '洞府深处，一具焦骨盘膝而坐，膝上摊着一卷火玉书页，字字赤红如炭——《赤霄焚天诀》。你取书时，焦骨轻轻一叹，化作一捧飞灰。', fx: { gf: 'chixiao' } }
        : { text: '岩浆自地缝中骤然喷涌，你被烧去半身衣袍，狼狈逃出。', fx: { inj: 4, life: -4 } } },
      { label: '取些火精便走', sub: '', act: () => ({ text: '你在洞口凿下几块火精石，趁岩浆未涌，迅速退走。', fx: { ls: 60 } }) },
    ] },
  { id: 'zhanjiao', title: '江心恶蛟', w: 6, rm: [2, 2],
    text: s => { Core.showFoe(s, { rel: anyOf([0, 1, 2]) }, { name: '恶蛟', title: '江心' }); return `江心有蛟作乱，掀翻渔船无数。那蛟修行千年，妖力约与${Core.foeStr(s)}相当。沿岸渔民凑了一袋碎银、一坛老酒，跪在你面前。碎银于你不值一文，那坛酒却是他们过年才舍得开的。`; },
    choices: s => [
      { label: '斩蛟', sub: '凶险', odds: s => 0.57 + s.luck * 0.03, act: s => Core.fightAct(s, { name: '恶蛟', base: 0.57 + s.luck * 0.03,
        win: { text: '你踏浪而行，剑光一闪，江面裂开一道白痕。恶蛟翻着肚皮浮上来时，岸上的渔民已经跪成一片。那坛酒，你喝了一口，剩下的留给了他们。', fx: { xw: 0.7, ls: 50, xj: 8, luck: 2 } },
        lose: { text: '恶蛟比你想的更狡猾。你被拖入江底，呛了满腹泥水，好不容易才将它重创逼退。渔民们依旧向你磕头，你却有些不敢受。', fx: { inj: 4, xj: 4 } } }) },
      { label: '布阵镇之', sub: '耗时半载', act: () => ({ text: '你沿江布下七十二道镇水符，蛟龙从此不敢出水。渔民在江边为你立了块石碑，你没有留名。', fx: { xj: 10, time: 6 } }) },
      { label: '袖手', sub: '', act: () => ({ text: '你收起了那袋碎银，却没有接那坛酒。转身时，你听见身后有人在哭。', fx: { xj: -8, ls: 5 } }) },
    ] },
  { id: 'wuxingbei', title: '五行残碑', w: 5, rm: [2, 3], once: true, wf: s => ({ si: 14, wei: 18, san: 9 }[s.lg.id] || 4),
    text: () => '荒原深处，五块残碑围成一圈，分刻金、木、水、火、土五字。碑上苔痕斑驳，唯独中央一方空地寸草不生，像在等一个人坐下。',
    choices: s => [
      { label: '坐入碑阵中央', sub: ({ si: '灵根愈杂，机缘愈深', wei: '灵根愈杂，机缘愈深', san: '灵根愈杂，机缘愈深', shuang: '两根相衔，或可成圆' }[s.lg.id] || '清根遇五气，成毁参半'), act: s => Math.random() < 0.25 + (s.lg.id === 'yi' ? 0 : s.lgEls.length * 0.12) + s.luck * 0.02
        ? { text: wuxingWin(s), fx: { gf: 'wuxing' } }
        : { text: '五行之气在你经脉中横冲直撞，你吐了一口血，被弹出碑阵。残碑静立如初。', fx: { inj: 3, xj: -4 } } },
      { label: '拓下碑文', sub: '', act: () => ({ text: '你拓了五张碑文带回洞府，日日对照参悟，虽未得其门而入，周天运转却顺畅了许多。', fx: { xw: 0.4, gfXp: 3 } }) },
    ] },
  { id: 'chaliao', title: '忘忧茶', w: 5, rm: [2, 4],
    text: () => '山腰茶寮，主人是个沉默的老妪，一壶茶煮了整整一个时辰。她把茶推到你面前：“喝了这杯，便忘了一件事。你想忘哪件？”',
    choices: s => [
      { label: '忘却旧怨', sub: '', act: () => ({ text: '茶很苦。喝完之后，你想了很久，也想不起自己曾经恨过谁。心里空了一块，却轻了许多。', fx: { xj: 15 } }) },
      { label: '忘却执念', sub: '', act: s => ({ text: '你一饮而尽。再抬头时，那道困了你多年的关隘，忽然不再像一堵墙，而像一扇门。', fx: { wx: 1, xj: 4 } }) },
      { label: '什么也不想忘', sub: '', act: () => ({ text: '你把茶推了回去。老妪第一次笑了：“好。都记着，才是活过。”', fx: { xj: 6 } }) },
    ] },
  { id: 'shoutu', title: '首徒', w: 9, rm: [2, 3], once: true, cond: s => s.flags.disciple,
    text: () => '当年你收下的那个伪灵根少年，如今跪在你洞府外，额头抵着石阶，声音发颤：“师父……弟子，筑基了。”',
    choices: s => [
      { label: '扶他起来', sub: '', act: s => ({ text: (Core.rootFace(s).band === 'high' || Core.rootFace(s).band === 'good')
        ? `你扶起他，才发现他鬓边也有了白发。为这一步，他走了四十年。你自己是${Core.rootFace(s).shown}，不必拿他的根骨开玩笑——肯跪着走完这一程的人，已经比许多天资走得认真。`
        : '你扶起他，才发现他鬓边也有了白发。为这一步，他走了四十年。你忽然明白了当年那个嗤笑你的长老，为何最后没有赶你下山。', fx: { xj: 18, luck: 2 } }) },
      { label: '传他心法', sub: '', act: () => ({ text: '你把自己这些年的修行心得写成一卷，放在他手里。他捧着书卷，又一次跪了下去。这一次，你没有扶。', fx: { xj: 12, gfXp: 3 } }) },
    ] },
  { id: 'xueji', title: '西荒血祭', w: 5, rm: [2, 3],
    text: s => { Core.showFoe(s, { rel: 3 }, { name: '血煞阵主', title: '血煞宗' }); return '血煞宗在西荒设下血祭大阵，掳了三千凡人。正道传檄天下，邀各派修士共赴西荒。檄文上说，阵成之日，便是三千人化作血水之时。'; },
    choices: s => [
      { label: '赴西荒', sub: '九死一生', odds: s => 0.62 + s.luck * 0.03, act: s => Core.fightAct(s, { name: '血煞阵主', foe: { rel: 3 }, base: 0.62 + s.luck * 0.03,
        win: { text: '你与众修士血战七昼夜，终于斩断阵眼。被救出的凡人里，有个小女孩把一朵干枯的野花塞给你。你把它夹在了那卷功法里。', fx: { xw: 0.9, xj: 10, item: { '清心丹': 1 } } },
        lose: { text: s => `坐镇阵眼的是一名${Core.foeStr(s)}的血煞宗长老。阵中血煞之气侵入经脉，你几乎被炼成血傀，最后被同道拖了出来。阵破了，你却在床上躺了许久。`, fx: { inj: 5, life: -6, xj: 6 } } }) },
      { label: '闭门不出', sub: '', act: () => ({ text: '你关上洞府石门。三个月后，西荒传来消息：阵破了，死了很多人，活下来的不多。', fx: { xj: -10 } }) },
    ] },
  { id: 'shanfu', title: '山腹石碑', w: 5, rm: [2, 3], once: true,
    text: () => '开山凿路的凡人挖穿了一座山腹，里面立着一块无字石碑。凡人们吓得四散奔逃，只有你看见，碑面上正一行行浮出密密麻麻的古篆。',
    choices: s => [
      { label: '静坐参碑', sub: '耗时一年', act: s => Math.random() < 0.55 + (s.lgEls.includes('土') ? 0.2 : 0) + s.wx * 0.02
        ? { text: '一年里，你看着那些古篆浮起又沉下，像山在呼吸。最后一日，碑文尽数没入你的身体，你听见自己的心跳慢了下来——《后土镇岳经》。', fx: { gf: 'houtuzy', time: 12 } }
        : { text: '一年过去，古篆依旧浮沉，你却始终读不懂一个字。起身时，才发现膝下的石头被你坐出了两个浅坑。', fx: { xj: 6, time: 12 } } },
      { label: '护凡人离去', sub: '', act: () => ({ text: '你先把吓坏了的凡人一个个送下山。等你回来，山腹已经合拢，像什么也没发生过。', fx: { xj: 8, luck: 1 } }) },
    ] },
  { id: 'yufu', title: '江上渔父', w: 5, rm: [2, 4], cond: s => !s.flags.yufuNo || s.age > 200,
    text: () => '江上一叶扁舟，渔父披着蓑衣，钓竿斜倚船舷。他看了你半晌，笑道：“仙长修了这许多年，可还记得鱼是什么滋味？”舟上，还空着一个位子。',
    choices: s => [
      { label: '上船，从此不问仙途', sub: '归隐 · 此卷终', act: () => ({ text: '你脱下道袍，叠好，放在岸边的青石上，然后上了船。渔父没有问你的名字，只递过来一根钓竿。江水很慢，你们都没有说话。', fx: { end: 'guiyin' } }) },
      { label: '与他饮一杯，作别', sub: '', act: () => ({ text: '你在船上喝了一杯浊酒，吃了一尾烤鱼——原来是这个滋味。上岸时，渔父在身后唱起歌来，你没有回头。', fx: { xj: 10, flag: 'yufuNo' } }) },
    ] },

  /* ===================== 元婴 ===================== */
  { id: 'wangqingya', title: '忘情崖', w: 5, rm: [3, 4], once: true,
    text: () => '忘情崖上终年飘雪。崖顶一块青石，石上刻满了名字——都是曾在此斩断尘缘的人。最末一个名字墨迹尚新，名字旁边，放着一卷薄薄的书册。',
    choices: s => [
      { label: '翻开书册', sub: '太上忘情 · 天品', act: () => ({ text: '书册只有九页。读到第九页时，你发现自己已经想不起母亲的模样了。雪落在书页上，没有化。你把《太上忘情录》收进袖中，像收起一块冰。', fx: { gf: 'wangqing', xj: -10 } }) },
      { label: '刻下名字，又抹去', sub: '', act: () => ({ text: '你在青石上刻下自己的名字，看了很久，又一笔一笔抹去。下崖时，雪停了。', fx: { xj: 14 } }) },
      { label: '转身下崖', sub: '', act: () => ({ text: '有些东西，你还不想忘。', fx: { xj: 4 } }) },
    ] },
  { id: 'gumu', title: '古木洞天', w: 5, rm: [3, 3], once: true,
    text: () => '一株万年古木，树洞里别有洞天：溪流、竹舍、一张落满花瓣的石榻。石榻上刻着一行小字：“坐满三年，可得长春。”',
    choices: s => [
      { label: '坐满三年', sub: '耗时三年', act: () => ({ text: '你在石榻上坐了三年。花开了三次，落了三次。出洞那天，你发现古木的年轮里刻着一卷《乙木回春真解》，最外一圈，刚刚写完。', fx: { gf: 'yimu', life: 4, time: 36 } }) },
      { label: '只坐一夜', sub: '', act: () => ({ text: '一夜花落如雨。天明时，你身上落满了花瓣，心里也是。', fx: { xj: 8, xw: 0.3 } }) },
    ] },
  { id: 'yufu2', title: '兵解玉符', w: 5, rm: [3, 4], once: true,
    text: () => '一位素不相识的老修士在你洞府前坐化。临终前他忽然睁眼，将一枚温润玉符按进你掌心：“劫中若有不测……捏碎它。魂魄可入轮回，不至灰飞烟灭。”',
    choices: s => [
      { label: '收下，为他安葬', sub: '', act: () => ({ text: '你将他葬在洞府后的松下，碑上无名。那枚玉符贴身收着，夜里微微发烫，像一颗不肯凉下去的心。', fx: { item: { '兵解玉符': 1 }, xj: 6 } }) },
      { label: '收下，不问来历', sub: '', act: () => ({ text: '你收起玉符，将他的尸身化作飞灰。修行路上，这样的人太多了。', fx: { item: { '兵解玉符': 1 }, xj: -3 } }) },
    ] },
  { id: 'tianji', title: '天机阁', w: 5, rm: [3, 4], once: true,
    text: () => '天机阁百年一现，阁中只卖一样东西：消息。掌柜蒙着双眼，却准确地叫出了你的名字：“道友想知道什么？天机有价，价不在灵石。”',
    choices: s => [
      { label: '问破境之机', toll: { life: -10 }, act: () => ({ text: '掌柜在你掌心写了三个字。你看懂了，又像没看懂。此后几次闭关，那三个字总在关隘处亮起。', fx: { life: -10, buff: { mul: 1.7, n: 5 } } }) },
      { label: '问自己还剩多少寿元', sub: '', act: s => ({ text: `掌柜沉默片刻：“${cn(Math.max(1, s.lifespan - s.age))}载。”你本以为自己会怕，可听到那个数字，心里反倒定了。`, fx: { xj: 10 } }) },
      { label: '一言不发', sub: '', act: () => ({ text: '你在阁中站了一炷香，什么也没问。掌柜忽然笑了：“不问，也是一问。”你出门时，才发觉自己想通了一件事。', fx: { wx: 1 } }) },
    ] },
  { id: 'leichi', title: '紫霄雷池', w: 10, rm: [2, 4], once: true, cond: s => s.lg.id === 'yi' && s.lgEls[0] === '雷',
    text: () => '九天之上有一方雷池，紫电如瀑，万年不息。你体内的雷灵根远远便开始躁动，像是游子听见了乡音。',
    choices: s => [
      { label: '踏入雷池', sub: '', act: s => Math.random() < 0.65 + s.luck * 0.03
        ? { text: '雷光贯体，你却没有感到疼。池底的雷纹一道道亮起，连成一篇古经——《紫霄神雷诀》。出池时，你的影子里还噼啪闪着细小的电光。', fx: { gf: 'zixiao' } }
        : { text: '雷池认主，却也试主。你被劈得遍体焦黑，退出池外，雷纹在你身后合拢。', fx: { inj: 4, xj: -2 } } },
      { label: '观雷悟道', sub: '', act: () => ({ text: '你在池边看了一夜雷。每一道电光落下之前，都有一瞬间的寂静。', fx: { xw: 0.6 } }) },
    ] },
  { id: 'fengyan', title: '天外风眼', w: 10, rm: [2, 4], once: true, cond: s => s.lg.id === 'yi' && s.lgEls[0] === '风',
    text: () => '极西之地有一处风眼，万里长风皆从此出。风眼中央却纹丝不动，静得能听见自己的血流声。',
    choices: s => [
      { label: '走入风眼', sub: '', act: s => Math.random() < 0.65 + s.luck * 0.03
        ? { text: '你逆风而行，衣袍猎猎如旗。踏入风眼的一瞬，万籁俱寂，一篇《御风逍遥篇》随着最后一缕风钻进你的袖口。', fx: { gf: 'yufeng' } }
        : { text: '狂风将你卷起，抛出百里之外。你落进一片麦田，惊起一群麻雀。', fx: { inj: 3 } } },
      { label: '随风而行', sub: '', act: () => ({ text: '你顺着风走了三个月，走到哪里算哪里。这三个月，是你修道以来最快活的日子。', fx: { xj: 12, time: 3 } }) },
    ] },
  { id: 'binghu', title: '月下冰湖', w: 10, rm: [2, 4], once: true, cond: s => s.lg.id === 'yi' && s.lgEls[0] === '冰',
    text: () => '北原有一面冰湖，冻了三千年。每逢月满，湖心冰层下便浮现一行行银白的字，随月光流转，天明即隐。',
    choices: s => [
      { label: '卧冰观字', sub: '', act: s => Math.random() < 0.65 + s.luck * 0.03
        ? { text: '你在冰上躺了一整夜，体内的冰灵根与湖心遥相呼应。天明时，那些字没有消失，而是沉进了你的识海——《太阴玄冰经》。', fx: { gf: 'taiyin' } }
        : { text: '寒气侵入心脉，你几乎冻成冰雕，三月方缓过来。', fx: { inj: 3, life: -3 } } },
      { label: '凿冰取水', sub: '', act: () => ({ text: '三千年的冰化成的水，清得没有一点颜色。你煮了一壶茶，茶香一夜不散。', fx: { xj: 10, xw: 0.3 } }) },
    ] },

  /* ===================== 化神 ===================== */
  { id: 'xinghai', title: '星海弈', w: 6, rm: [4, 4],
    text: () => '某夜神游太虚，你见到一片星海。星海中央坐着一个与你一模一样的人，正对着一盘没有棋子的棋，凝神沉思。',
    choices: s => [
      { label: '坐下对弈', sub: '凭悟性', act: s => Math.random() < 0.35 + s.wx * 0.045
        ? { text: '你们以星为子，下了一局没有输赢的棋。终局时，他朝你点了点头，化作一颗星，落进你的眉心。', fx: { xw: 1.1, wx: 1 } }
        : { text: '你每落一子，他便已在那里等着。最后你推枰认输，醒来时满身冷汗。', fx: { xj: -6 } } },
      { label: '问他是谁', sub: '', act: () => ({ text: '“我是你未曾修道时的那一念。”他说，“你走了这么远，我一直在这里等你。”', fx: { xj: 14 } }) },
    ] },
  { id: 'jieyun', title: '劫云初聚', w: 6, rm: [4, 4], once: true,
    text: () => '天边劫云初聚，尚未成形。一位渡过两次天劫的前辈传音于你：可借这未成之劫先淬一淬肉身，来日渡劫便多一分把握——只是淬得过了，反倒伤了根本。',
    choices: s => [
      { label: '借劫淬体', sub: '凶险', act: s => Math.random() < 0.6 + s.luck * 0.03
        ? { text: '你迎着初成的劫雷站了三日。雷光一遍遍洗过筋骨，最后一道雷落下时，你掌心凝出一道符印模样的雷纹——渡厄符。', fx: { item: { '渡厄符': 1 }, xw: 0.4 } }
        : { text: '劫雷比预想的更狠，你被劈落云端，道体受损。', fx: { inj: 4, life: -10 } } },
      { label: '静观其变', sub: '', act: () => ({ text: '你看着劫云聚了又散。天道不急，你也不急。', fx: { xj: 6 } }) },
    ] },
  { id: 'jiuzong', title: '青冥旧地', w: 6, rm: [4, 4], once: true,
    text: () => '你回到青冥山。山门早已易主，演武坪上长满了蒿草，藏经阁只剩半截焦黑的梁柱。一个扫地的小道童仰头问你：“前辈也是来凭吊的么？”',
    choices: s => [
      { label: '在焦木前坐一夜', sub: '', act: () => ({ text: '你想起那年扫尘的午后，老道士打着盹，阳光从窗格里漏进来，照着满室浮尘。天亮时你起身，周身灵力圆融如意。', fx: { xw: 0.5, gfXp: 4, xj: 8 } }) },
      { label: '为他摩顶授法', sub: '', act: () => ({ text: '你把手放在小道童头顶，传了他一篇入门心法。他懵懵懂懂地磕头。很多年后，青冥山上会有一个新的老道士，守着一座新的藏经阁。', fx: { xj: 15, luck: 3 } }) },
    ] },
  { id: 'xinmojie', title: '心魔劫', w: 6, rm: [4, 4],
    text: () => '越近大道，心魔来得越凶。这一次，它化作你此生亏欠最深的那个人，站在你面前，什么也不说，只是看着你。',
    choices: s => [
      { label: '直面', sub: '心境愈稳，胜算愈大', act: s => Math.random() < 0.3 + s.xj / 140
        ? { text: '你看着那个人，把这些年没说出口的话，一句一句说完了。那人笑了笑，像晨雾一样散去。你忽然觉得，天劫也不过如此。', fx: { xj: 20, xw: 0.6 } }
        : { text: '你开口时，声音哑了。那人伸手抚过你的脸，指尖冰凉。你在洞府里枯坐了一年，才勉强把心魔压下。', fx: { xj: -15, inj: 2, time: 12 } } },
      { label: '闭目不看', sub: '', act: () => ({ text: '你闭上眼。它便一直站在那里，站了很久。睁眼时，它不见了——只是你知道，它还会回来。', fx: { xj: -4 } }) },
    ] },
);
