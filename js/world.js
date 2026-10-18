/* 墨仙录 · 江湖：山水长卷上的地名、灵草丹方、坊市拍卖、秘境 */
'use strict';

/* ================= 地名 ================= */
// x：在长卷上的位置（0–1）；rm：可达的最低境界；danger：凶险（0–5 墨点）
const LOCS = [
  { id: 'qingshi', name: '青石镇', seal: '镇', x: 0.05, rm: 0, danger: 0, herbs: ['青叶草', '宁神花'], paint: 'town',
    desc: '你出身的小镇。青石板路被几百年的脚步磨得发亮，镇口老槐下，说书人还在讲那位一剑断江的仙人。' },
  { id: 'taohua', name: '桃花溪', seal: '溪', x: 0.15, rm: 0, danger: 1, herbs: ['青叶草', '宁神花', '赤阳花'], paint: 'peach',
    desc: '溪水自山中来，两岸桃林十里。花开时落英顺流而下，渔人说溪尽处另有人家，却没人找到过。' },
  { id: 'shanmen', name: '青冥山门', seal: '宗', x: 0.26, rm: 0, danger: 0, herbs: ['青叶草', '赤阳花'], paint: 'sect',
    desc: '九百级石阶直上云中。山门牌坊上“青冥”二字，传是开山祖师以指代笔所书，至今剑气未散。' },
  { id: 'yunyue', name: '云岳坊', seal: '市', x: 0.37, rm: 0, danger: 1, herbs: [], paint: 'market', market: true,
    desc: '方圆千里最大的修士坊市。白日里摊贩吆喝，入夜灯火不熄；每隔些年，坊主便在听雨楼上开一场拍卖会。' },
  { id: 'jingcheng', name: '大黎京城', seal: '京', x: 0.43, rm: 1, danger: 1, herbs: [], paint: 'capital',
    desc: '皇城如岳，宫墙朱深。贡院、部堂、校场一字排开；修士入京须验腰牌——帝京风光，也是人间罗网。' },
  { id: 'heifeng', name: '黑风岭', seal: '岭', x: 0.52, rm: 1, danger: 3, herbs: ['赤阳花', '紫云芝'], paint: 'ridge',
    desc: '山势如锯，终年阴风不止。劫修与妖兽都爱在此落脚，商队宁可绕行三百里。' },
  { id: 'gufu', name: '古修洞府', seal: '府', x: 0.60, rm: 1, danger: 2, herbs: ['紫云芝', '龙血藤'], paint: 'cliff', mj: 'gufu',
    desc: '断崖上嵌着十几座无主洞府，石门禁制多已残破。据说其中一座，至今无人走到尽头。' },
  { id: 'xuewu', name: '血雾谷', seal: '谷', x: 0.68, rm: 2, danger: 5, herbs: ['龙血藤', '血菩提'], paint: 'redvalley',
    desc: '谷中雾气终年带着血色，鸟兽不入。魔修在谷底筑坛，正道几番围剿，都折了人手。' },
  { id: 'xihuang', name: '西荒', seal: '荒', x: 0.77, rm: 2, danger: 4, herbs: ['血菩提'], paint: 'desert', mj: 'zhanchang',
    desc: '黄沙万里，白骨半掩。上古时这里是一处战场，至今月夜里，还能听见金铁交鸣。' },
  { id: 'beihai', name: '北海', seal: '海', x: 0.87, rm: 3, danger: 4, herbs: ['雪莲'], paint: 'sea', mj: 'longgong',
    desc: '海天一色，冰山浮沉。渔人传说海眼之下有一座龙宫，每隔百年，海面会裂开一道门。' },
  { id: 'yunhai', name: '云海天阶', seal: '阶', x: 0.96, rm: 4, danger: 3, herbs: ['九叶灵芝', '雪莲'], paint: 'heaven',
    desc: '万丈绝顶之上，石阶没入云海，不知通往何处。只有化神修士，才踏得上第一级。' },
];
const LOC = Object.fromEntries(LOCS.map(l => [l.id, l]));
// 初到某境界时听来的传闻
const LOC_RUMOR = {
  heifeng: '坊间都在传：黑风岭又有商队失了踪。你在长卷上，添了一道锯齿般的山脊。',
  gufu: '一位老散修酒后说起，断崖上那片古修洞府，近来石门上的禁制又亮了。',
  xuewu: '有人从西边逃回来，满身血雾的腥气，只说了三个字：“血雾谷。”',
  xihuang: '你在旧卷里读到一行小字：“西出阳关三千里，有古战场，白骨如山。”',
  beihai: '北海来的商人说，今年冰山南下得早，海眼那边夜夜有龙吟。',
  jingcheng: '云岳坊有人说：大黎京城开了城门验修士腰牌。你在长卷上，添了一座朱墙宫阙。',
  yunhai: '你于定中忽见云海之上一道石阶，一级一级，直入天光。醒来时，那道石阶已刻在你的神识里。',
};

/* ================= 事件归处：哪些奇遇长在哪片山水 ================= */
const LOC_EV = {
  qingshi: ['home', 'wounded', 'plague', 'tongxiang', 'inn', 'disciple', 'monk'],
  taohua: ['qin', 'chess', 'crane', 'yufu', 'meet_su', 'wolf', 'th_herb'],
  shanmen: ['cangjing', 'herbold', 'xiaobi', 'letter', 'danhui', 'shoutu', 'jiuzong', 'sf_tea', 'sf_test', 'sf_old', 'lu_duel', 'lu_sword', 'su_herb', 'su_fire', 'su_lamp', 'su_recipe', 'wen_credit', 'wen_deal', 'wen_trap', 'shi_bun', 'shi_bully', 'shi_guard'],
  yunyue: ['market', 'fox', 'shusi', 'tianji', 'chaliao', 'sx_invite', 'yy_stone'],
  jingcheng: [],
  heifeng: ['bandit', 'heifeng', 'herb', 'sanxiu', 'meet_lu', 'lu_save', 'thunder'],
  gufu: ['cave', 'furnace', 'stele', 'jianzhong', 'hantan2', 'shanfu', 'wuxingbei', 'gumu', 'vein', 'mirror'],
  xuewu: ['xueyu', 'xw_altar', 'xw_mist'],
  xihuang: ['xueji', 'huoshan', 'meteor', 'fengyan', 'xh_bones'],
  beihai: ['longevity', 'binghu', 'bh_lamp', 'yufu2'],
  yunhai: ['xinghai', 'jieyun', 'xinmojie', 'leichi', 'wangqingya', 'yh_stair'],
};
const EV_LOC = {}; for (const [l, ids] of Object.entries(LOC_EV)) for (const id of ids) (EV_LOC[id] = EV_LOC[id] || []).push(l);

/* ================= 灵草、材料、新丹 ================= */
Object.assign(PILLS, {
  '延寿丹': { desc: '龙血藤与雪莲同炉，可续数载寿元，药力逊于朱果。', use: true },
  '破障丹': { desc: '小境界服之，修为陡进半层；瓶颈时服之，下一回破境多一分把握。', use: true },
  '青叶草': { desc: '山野随处可见的灵草，聚气、回春皆用得上。', kind: 'herb' },
  '宁神花': { desc: '花开如盏，香气清冷，可入清心丹。', kind: 'herb' },
  '赤阳花': { desc: '生在向阳的石缝里，花心一点赤红，性燥。', kind: 'herb' },
  '紫云芝': { desc: '古木根下所生，伞面如紫云，百年方成。', kind: 'herb' },
  '龙血藤': { desc: '藤汁殷红如血，传说曾沾过龙血。', kind: 'herb' },
  '血菩提': { desc: '只长在杀伐之地，籽粒如血珠，至阴亦至烈。', kind: 'herb' },
  '雪莲': { desc: '北海冰崖之上，千年一开。', kind: 'herb' },
  '九叶灵芝': { desc: '九叶齐全者，万中无一。可遇不可求。', kind: 'herb' },
  '妖丹': { desc: '妖兽一身修为所凝，坊市里常有人收。', kind: 'mat' },
  '火精石': { desc: '地火淬炼千年的赤石，握在手里微微发烫。', kind: 'mat' },
  '寒铁': { desc: '北地深矿所出，铸剑上品。', kind: 'mat' },
  '古剑残片': { desc: '上古之剑的碎片，剑意犹存，割手。', kind: 'mat' },
  '鲛珠': { desc: '鲛人泣泪所化，夜里自生微光。', kind: 'mat' },
  '龙鳞': { desc: '一片巴掌大的逆鳞，坚逾精金。', kind: 'mat' },
});
// 物价：base 为灵石，tier 为物品品阶（按 lsScale 折算）；rel 表示随买者境界折算
const ITEM_VAL = {
  '聚气丹': { base: 16, rel: 1 }, '回春丹': { base: 26, rel: 1 }, '清心丹': { base: 36, rel: 1 }, '延寿丹': { base: 110, rel: 1 }, '破障丹': { base: 90, rel: 1 }, '延寿果': { base: 160, rel: 1 },
  '筑基丹': { base: 150, tier: 0 }, '凝元丹': { base: 150, tier: 1 }, '化婴丹': { base: 150, tier: 2 }, '问神丹': { base: 150, tier: 3 }, '渡厄符': { base: 150, tier: 4 },
  '青叶草': { base: 3, tier: 0 }, '宁神花': { base: 5, tier: 0 }, '赤阳花': { base: 6, tier: 0 }, '紫云芝': { base: 6, tier: 1 }, '龙血藤': { base: 7, tier: 2 },
  '血菩提': { base: 8, tier: 2 }, '雪莲': { base: 7, tier: 3 }, '九叶灵芝': { base: 9, tier: 4 },
  '妖丹': { base: 12, rel: 1 }, '火精石': { base: 14, tier: 2 }, '寒铁': { base: 10, tier: 1 }, '古剑残片': { base: 12, tier: 2 }, '鲛珠': { base: 12, tier: 3 }, '龙鳞': { base: 14, tier: 3 },
  '精铁短剑': { base: 55, rel: 1 }, '青钢刃': { base: 88, rel: 1 }, '寒铁枪': { base: 240, tier: 1 }, '赤焰环': { base: 260, tier: 1 }, '碧水尺': { base: 230, tier: 1 },
};

/* ================= 丹方 ================= */
const RECIPES = {
  juqi: { name: '聚气丹', out: '聚气丹', need: { '青叶草': 2, '赤阳花': 1 }, diff: 0 },
  huichun: { name: '回春丹', out: '回春丹', need: { '青叶草': 2, '紫云芝': 1 }, diff: 1 },
  qingxin: { name: '清心丹', out: '清心丹', need: { '宁神花': 2, '青叶草': 1 }, diff: 1 },
  zhuji: { name: '筑基丹', out: '筑基丹', need: { '赤阳花': 2, '紫云芝': 1 }, diff: 2 },
  yanshou: { name: '延寿丹', out: '延寿丹', need: { '龙血藤': 1, '雪莲': 1 }, diff: 3 },
  pozhang: { name: '破障丹', out: '破障丹', need: { '紫云芝': 1, '血菩提': 1 }, diff: 3 },
  ningyuan: { name: '凝元丹', out: '凝元丹', need: { '紫云芝': 2, '龙血藤': 1 }, diff: 4 },
  huaying: { name: '化婴丹', out: '化婴丹', need: { '龙血藤': 2, '血菩提': 1, '雪莲': 1 }, diff: 5 },
};
const RECIPE_SRC = { juqi: '入门所授', huichun: '苏晚晴所授 · 坊市丹方', qingxin: '苏晚晴所授 · 藏经阁', zhuji: '藏经阁', yanshou: '北海孤灯 · 坊市丹方', pozhang: '古修洞府', ningyuan: '藏经阁', huaying: '藏经阁 · 拍卖' };
const DAN_Q = ['下品', '中品', '上品', '极品'];
const DAN_TEXT = {
  ok: ['炉火由青转白，丹香透鼎而出。你揭开炉盖，几枚丹丸滚落掌心，温润如玉。', '三昧真火收尽，炉中“叮”的一声轻响。丹成。', '药气在鼎中翻腾了七日，终于凝作数点圆光。你屏息收丹，指尖尚有余温。'],
  top: '开炉那一刻，丹香满室，炉口浮起一圈淡金丹晕，久久不散——极品。',
  waste: ['火候差了一线，药力散尽，炉底只剩一层焦黑的药渣。', '丹将成时心神一晃，鼎中药气四散，前功尽弃。'],
  boom: ['鼎中药气暴走，“轰”的一声，炉盖飞出三丈，你被烟火燎去半边眉毛。', '火势陡然失控，丹炉炸开一道裂口，滚烫的药汁溅了你一身。'],
};
const LIB_RECIPES = [{ id: 'qingxin', rank: 1, cost: 40 }, { id: 'zhuji', rank: 1, cost: 90 }, { id: 'ningyuan', rank: 2, cost: 260 }, { id: 'huaying', rank: 3, cost: 700 }];

/* ================= 坊市 ================= */
// 每次换季刷新：哪些货、几件
const MARKET = [
  { k: '聚气丹', n: [2, 5] }, { k: '回春丹', n: [1, 3] }, { k: '清心丹', n: [1, 2], p: 0.7 }, { k: '延寿丹', n: [1, 1], p: 0.25 }, { k: '破障丹', n: [1, 1], p: 0.2, rm: 1 },
  { k: 'PILL', n: [1, 1], p: 0.35 },
  { k: '青叶草', n: [3, 8] }, { k: '宁神花', n: [2, 5] }, { k: '赤阳花', n: [2, 5] }, { k: '紫云芝', n: [1, 3], rm: 1 }, { k: '龙血藤', n: [1, 2], rm: 2, p: 0.7 },
  { k: '血菩提', n: [1, 2], rm: 2, p: 0.5 }, { k: '雪莲', n: [1, 1], rm: 3, p: 0.5 },
  { k: 'R:huichun', p: 0.45 }, { k: 'R:yanshou', p: 0.25, rm: 2 }, { k: 'SCROLL', p: 0.6 },
  { k: '精铁短剑', n: [1, 2], p: 0.55 }, { k: '青钢刃', n: [1, 1], p: 0.4 },
  { k: '寒铁枪', n: [1, 1], p: 0.28, rm: 1 }, { k: '赤焰环', n: [1, 1], p: 0.25, rm: 1 }, { k: '碧水尺', n: [1, 1], p: 0.25, rm: 1 },
];
const MARKET_BARK = ['卖丹的老道捋着胡子：“童叟无欺，童叟无欺。”', '药铺小伙计把秤杆一翘：“新到的灵草，带着露水呢。”', '街角有人压低声音：“上好的残卷，要不要瞧瞧？”', '听雨楼的灯笼又挂起来了，楼下站满了看热闹的人。', '一个胖商人拦住你：“道友，收妖丹么？价钱好商量。”'];

/* ================= 拍卖 ================= */
const BIDDERS = {
  zhao: { name: '赵长老', who: '丹鼎门 · 白须老者', raise: ['老夫再添一成。', '此物与老夫有缘。', '年轻人，莫要与老夫相争。'], quit: '罢了罢了，老夫年纪大了，用不上。', win: '老夫承让。' },
  liu: { name: '柳如烟', who: '紫衣女修', raise: ['妾身也想要呢。', '这位道友，让一让妾身可好？', '再加些，妾身不心疼。'], quit: '道友好大的手笔，妾身让了。', win: '多谢诸位成全。' },
  qian: { name: '钱多多', who: '胖商人', raise: ['加！我钱多多别的没有，就是灵石多。', '跟！今儿个我包了。', '加价，加价！'], quit: '亏本的买卖不做，不做。', win: '嘿嘿，承让承让。' },
  hei: { name: '黑袍客', who: '来历不明', raise: ['（黑袍下伸出一根手指）', '……加。', '（他把一袋灵石推到桌上，一言不发）'], quit: '……（他深深看了你一眼）', win: '（黑袍一闪，人已不见）' },
  wen: { name: '温庭玉', who: '青冥宗 · 执事堂之子', raise: ['温某素来成人之美，只是这一件……', '师兄见谅，家父嘱托在身。', '温某再添一点心意。'], quit: '师兄请。温某记下了。', win: '承让。改日请师兄喝茶。', npc: 'wen' },
};
const AUC_OPEN = ['听雨楼上，十二盏灯笼次第点亮。坊主拍了拍手：“诸位，今夜共三件，价高者得。”', '楼中檀香袅袅，屏风后人影绰绰。一声锣响，拍卖开始。'];

/* ================= 新奇遇（落在各处山水） ================= */
EVENTS.push(
  { id: 'th_herb', title: '溪畔采药', seal: '药', w: 8, rm: [0, 2],
    text: () => '桃花落在溪面上，顺水漂远。溪畔湿地里长着一丛丛灵草，叶尖挂着露水。远处有人在唱采茶调，调子很老了。',
    choices: s => [
      { label: '俯身细采', sub: '耗时一季', act: s => ({ text: '你挽起裤脚，在溪水里来回涉了一整季。草叶划过手背，凉丝丝的。回去时，药篓沉甸甸的。', fx: { item: { '青叶草': 3, '宁神花': 2, ...(Math.random() < 0.4 ? { '赤阳花': 1 } : {}) }, time: 3 } }) },
      { label: '循歌声寻去', sub: '', act: s => Math.random() < 0.55
        ? { text: '唱歌的是个采茶老妪。她听说你在采药，从篓底摸出一株紫芝塞给你：“老婆子用不上，给有用的人。”', fx: { item: { '紫云芝': 1 }, xj: 4 } }
        : { text: '歌声忽远忽近，你追到林深处，只见一株老桃树，枝头挂着一顶旧斗笠。', fx: { xj: 2 } } },
    ] },
  { id: 'yy_stone', title: '赌石', seal: '赌', w: 7,
    text: s => `云岳坊西头有一条赌石街，满地都是灰扑扑的原石。摊主拍着一块磨盘大的石头：“开出来是什么，全凭道友的眼力。一块${cn(20 * REALMS[s.realm].lsScale)}灵石。”`,
    choices: s => { const p = 20 * REALMS[s.realm].lsScale; return [
      { label: '买一块，当场开', sub: `灵石${cn(p)}`, disabled: s.ls < p, act: s => { const r = Math.random() + s.luck * 0.02;
        return r > 0.85 ? { text: '刀锋落下，石皮剥开，一道赤光冲起——竟是一块成色极好的火精石。围观的人倒吸一口凉气。', fx: { ls: -p, lsRaw: true, item: { '火精石': 2 } } }
          : r > 0.45 ? { text: '开出来一小块寒铁，不亏不赚。摊主笑眯眯地说：“道友手气不错。”', fx: { ls: -p, lsRaw: true, item: { '寒铁': 1 } } }
          : { text: '一刀下去，满地石屑，里头空空如也。摊主摊手：“赌石嘛。”', fx: { ls: -p, lsRaw: true, xj: -1 } }; } },
      { label: '看别人开', sub: '', act: () => ({ text: '你看了一下午。有人一刀暴富，有人倾家荡产。你忽然觉得，修行也不过如此。', fx: { xj: 3 } }) },
    ]; } },
  { id: 'su_recipe', title: '丹房传方', seal: '丹', w: 8, cond: s => s.npc && s.npc.su.met && s.npc.su.a >= 30 && s.dan && !(s.dan.rec.includes('huichun') && s.dan.rec.includes('qingxin')),
    text: () => '苏晚晴把一张泛黄的丹方推到你面前，纸角卷着，字迹娟秀。“这是我师父留下的，”她说，“你常往外跑，学会了，受了伤也不至于干熬着。”',
    choices: s => [
      { label: '郑重收下', sub: '习得丹方', act: s => { const id = s.dan.rec.includes('huichun') ? 'qingxin' : 'huichun';
        return { text: `你照着丹方，在她的丹房里试了三炉。第三炉成丹时，她比你还高兴。《${RECIPES[id].name}》的方子，从此记在你心里。`, fx: { recipe: id, npc: { su: 6 }, dan: 2 } }; } },
      { label: '请她亲手演示', sub: '', act: s => ({ text: '她挽起袖子，一边看火一边讲。火光映着她的侧脸，你一句也没记住，只记得药香。她嗔你一眼，把丹方塞进你袖中。', fx: { recipe: s.dan.rec.includes('huichun') ? 'qingxin' : 'huichun', npc: { su: 10 } } }) },
    ] },
  { id: 'xw_altar', title: '血祭坛', seal: '坛', w: 7, rm: [2, 4],
    text: s => { Core.rollFoe(s, { rel: anyOf([0, 1, 1, 2]) }); return `谷底雾气最浓处，一座白骨垒成的祭坛上燃着幽绿的火。坛下锁着七八个凡人，个个面无血色。坛主背对着你，袍角绣着血色骷髅，气息约莫${Core.foeStr(s)}。`; },
    choices: s => [
      { label: '出手救人', sub: '凶险', act: s => Core.fightAct(s, { name: '坛主', base: 0.52 + s.luck * 0.03,
        win: { text: '你一剑劈开祭坛，幽火四散。坛主惨嚎着化作一团血雾遁走，凡人们抱头痛哭。你在坛下捡到一袋来路不明的灵石，和几颗血菩提。', fx: { xw: 0.35, ls: 40, xj: 8, item: { '血菩提': 2 } } },
        lose: { text: s => `那名${Core.foeStr(s)}的坛主回身一掌，血雾如潮。你护着两个孩子退出谷口，自己却被血煞侵了经脉。`, fx: { inj: 4, life: -3, xj: 6 } } }) },
      { label: '暗中记下方位，报与宗门', sub: '', act: s => ({ text: '你悄然退出，把祭坛方位刻在玉简上送回宗门。三月后听说，祭坛被拔了，人救出来四个。', fx: { xj: 3, gx: 10 } }) },
      { label: '绕道而行', sub: '', act: () => ({ text: '你转身离开。身后的哭声被雾吞了，听不真切。', fx: { xj: -6 } }) },
    ] },
  { id: 'xw_mist', title: '血雾迷途', seal: '雾', w: 6, rm: [2, 4],
    text: () => '雾忽然浓了。四下里只剩血色，连自己的手都看不清。雾气钻进鼻腔，带着一股甜腥，你听见耳边有人在笑——又像是你自己在笑。',
    choices: s => [
      { label: '闭气强行', sub: '耗神', act: s => Math.random() < 0.55 + s.xj / 300
        ? { text: '你闭住六识，只凭一点灵觉往前走。不知过了多久，雾散了，脚下踩着一丛血菩提。', fx: { item: { '血菩提': 1, '龙血藤': 1 }, xj: 2 } }
        : { text: '血雾入肺，你眼前尽是幻象，在雾中困了三个月才摸出谷来，心神俱疲。', fx: { xj: -8, inj: 2, time: 3 } } },
      { label: '服清心丹护住灵台', sub: s.items['清心丹'] ? '耗清心丹一枚' : '身无清心丹', disabled: !s.items['清心丹'], act: s => ({ text: '丹药化开，灵台一片清凉。笑声远了，雾也淡了。你从容走出谷去，顺手采了几株龙血藤。', fx: { item: { '清心丹': -1, '龙血藤': 2 }, xj: 4 } }) },
      { label: '原路退回', sub: '', act: () => ({ text: '你一步一步倒退，退出了雾。回头看时，谷口的血雾像一张合拢的嘴。', fx: {} }) },
    ] },
  { id: 'xh_bones', title: '白骨问剑', seal: '骨', w: 7, rm: [2, 4],
    text: () => '沙丘背后露出半具白骨，仍保持着拄剑而立的姿势。剑早已锈成一截黑铁，剑意却还在——你走近一步，便觉眉心一凉。',
    choices: s => [
      { label: '以神识接他一剑', sub: '剑意凌厉', act: s => Math.random() < 0.45 + s.wx * 0.04
        ? { text: '那一剑自万年前斩来，你看清了起手，看清了收势，也看清了他死前没能斩出的最后半招。白骨轻轻一晃，化作流沙。', fx: { xw: 0.6, wx: Math.random() < 0.3 ? 1 : 0, item: { '古剑残片': 1 } } }
        : { text: '剑意如万箭穿心，你七窍渗血，在沙地上躺了半日才爬起来。', fx: { inj: 3, xj: -3 } } },
      { label: '掩埋白骨', sub: '', act: () => ({ text: '你掘沙三尺，将他葬了，以那截黑铁为碑。风沙很快抹平了一切。那夜你梦见一个披甲的人，朝你抱了抱拳。', fx: { xj: 10, luck: 1 } }) },
    ] },
  { id: 'bh_lamp', title: '冰山孤灯', seal: '灯', w: 6, rm: [3, 4], once: true,
    text: () => '一座冰山缓缓漂过，冰崖上竟有一盏孤灯。灯下坐着个钓鱼的老人，蓑衣上积了三尺雪，钓线垂进海里，不知有多深。',
    choices: s => [
      { label: '上前请教', sub: '', act: s => ({ text: '老人头也不回：“你也是来求长生的？”他递给你一张冻得发脆的纸，上面是一张丹方，“雪莲配龙血藤，文火七七之数。拿去，莫再来了。”', fx: { recipe: 'yanshou', item: { '雪莲': 1 }, xj: 6 } }) },
      { label: '陪他钓一夜', sub: '', act: s => ({ text: '你在他身边坐了一夜，谁也没说话。天亮时他收了线，钩上什么也没有。他笑了笑：“钓的本来就不是鱼。”', fx: { xj: 15, xw: 0.4 } }) },
    ] },
  { id: 'yh_stair', title: '天阶一级', seal: '阶', w: 7, rm: [4, 4],
    text: () => '石阶就在脚下，云从阶缝里漫上来。第一级很矮，矮得像是谁随手放的一块石头；可你抬起脚时，却觉得整个天地都压在脚背上。',
    choices: s => [
      { label: '踏上去', sub: '天威', act: s => Math.random() < 0.5 + s.xj / 250
        ? { text: '你踏了上去。天地静了一瞬，然后风从四面八方灌进你的经脉。你站在第一级上，看见云海之下，自己走过的整卷山水。', fx: { xw: 0.9, xj: 8 } }
        : { text: '脚尚未落下，便被一股无形之力弹回。你滚下山崖，半身骨头都在响。', fx: { inj: 4, life: -6 } } },
      { label: '坐在阶前', sub: '', act: () => ({ text: '你没有上去，只在阶前坐了三年。云来云去，石阶始终在那里，不催你，也不等你。', fx: { xj: 18, time: 6 } }) },
    ] },
);
EVENTS.push({ id: 'hei_ambush', title: '夜路', seal: '袭', w: 30, cond: s => s.flags && s.flags.heiGrudge === 1,
  text: s => { Core.rollFoe(s, { rel: anyOf([0, 1, 1]) }); return `拍卖散场，你踏着月色出坊。巷子尽头立着一个黑袍人，袍角在风里一动不动。“东西留下，”他说，声音像砂纸，“我不想杀人。”他的气息，约莫${Core.foeStr(s)}。`; },
  choices: s => [
    { label: '拔剑', sub: '凶险', act: s => { s.flags.heiGrudge = 2; return Core.fightAct(s, { name: '黑袍客', base: 0.5 + s.luck * 0.03,
      win: { text: '三招之后，黑袍被你一剑挑落——底下是一张苍白的年轻的脸，额上刺着血雾谷的印记。他咬牙遁入夜色，丢下一只储物袋。', fx: { ls: 50, xj: 4 } },
      lose: { text: s => `那名${Core.foeStr(s)}的黑袍客出手如鬼魅。你护住了拍来的宝物，肋下却挨了一记血煞掌。`, fx: { inj: 3, xj: -2 } } }); } },
    { label: '掉头回坊，借坊主之势', sub: '', act: s => { s.flags.heiGrudge = 2; return { text: '你转身回了听雨楼，在楼上坐到天明。黑袍人没有跟进来。坊主笑眯眯地收了你一笔“茶钱”。', fx: { ls: -Math.floor(s.ls * 0.08), lsRaw: true } }; } },
  ] });
LOC_EV.yunyue.push('hei_ambush');
EVENTS.push({ id: 'bh_jiao', title: '冰下', seal: '蛟', w: 9, rm: [3, 4],
  text: s => { Core.rollFoe(s, { rel: anyOf([-1, 0, 0, 1]) }); return `北海的冰面下有黑影游过，粗如殿柱。冰层一声闷响，裂开一道长缝——一条冰蛟探出头来，鳞上结着百年的霜。看它吐纳的气象，约莫${Core.foeStr(s)}。`; },
  choices: s => [
    { label: '斩蛟', sub: '取其内丹', act: s => Core.fightAct(s, { name: '冰蛟', base: 0.52,
      win: { text: '你一剑劈开冰浪，第二剑刺入逆鳞。冰蛟哀鸣着沉入海底，海面浮起一枚莹白的内丹，寒气逼人。', fx: { item: { '妖丹': 2 }, xw: 0.12, ls: 40 } },
      dominant: '冰蛟刚一扑起，你已立在它头顶。它僵了一僵，乖乖沉回冰下，吐出一枚内丹作买路钱。',
      crush: '冰蛟只看了你一眼，便缩回了海底，连水花都不敢溅起。',
      lose: { text: s => `那条${Core.foeStr(s)}的冰蛟一尾扫来，冰面炸成碎玉。你被寒气侵入经脉，在雪里躺了半月才缓过来。`, fx: { inj: 2, xj: -2 } } }) },
    { label: '绕冰而行', act: s => ({ text: '你踏着浮冰远远绕开。回头时，那道裂缝已重新冻上，像什么也没发生过。', fx: {} }) },
  ] });
EVENTS.push({ id: 'yh_guard', title: '守阶', seal: '阶', w: 9, rm: [4, 4],
  text: s => { Core.rollFoe(s, { rel: anyOf([0, 0, 0, -1]) }); return `天阶第九百级上，坐着一尊披甲的石像。你走近时，石像睁开眼，甲叶簌簌落下尘土。“登此阶者，先过我。”它的气息浩荡如潮，约莫${Core.foeStr(s)}。`; },
  choices: s => [
    { label: '应战', sub: '问道于剑', act: s => Core.fightAct(s, { name: '守阶天将', base: 0.5,
      win: { text: '百招之后，石像的长戟断成两截。它低头看了看，侧身让开石阶：“去罢。往上，便是另一番天地。”', fx: { xw: 0.15, xj: 5 } },
      dominant: '石像接了你三招，收戟行礼，让开了道路。',
      crush: '你尚未出手，石像已默默起身，让开了石阶。',
      lose: { text: s => `那尊${Core.foeStr(s)}的守阶天将一戟横扫，你从天阶上滚落百级，护体灵光碎了一地。`, fx: { inj: 2, xj: -3 } } }) },
    { label: '拱手而退', act: s => ({ text: '你拱手退下石阶。石像重新闭上了眼睛，云海又合拢了。', fx: {} }) },
  ] });
LOC_EV.beihai.push('bh_jiao'); EV_LOC.bh_jiao = ['beihai']; LOC_EV.yunhai.push('yh_guard'); EV_LOC.yh_guard = ['yunhai']; (EV_LOC.hei_ambush = ['yunyue']);
// 旧的“秘境将启”让位给多段式秘境
(() => { const e = EVENTS.find(e => e.id === 'secret'); if (e) e.cond = () => false; })();

/* ================= 多段式秘境 ================= */
// 秘境禁制随来者修为而生：守关者一概与入境者相较（rel），不会以弱凌强，也不会以强欺弱
const MJ_INTRO = '秘境禁制随来者修为而变——你强一分，它便强一分。';
const MIJING = {
  gufu: { name: '古修洞府', loc: 'gufu', rm: 1, seal: '府', tint: 'moss',
    open: '断崖上最深的那座洞府，石门上的禁制亮了。门缝里漏出一线青光，像有人在里面点了一盏灯。',
    nodes: [
      { t: '石门禁制', text: '石门高三丈，门上符文如蛇游走。指尖一触，符文便缠了上来。', choices: s => [
        { label: '以灵力强破', sub: '耗灵力', ling: -25, act: s => Math.random() < 0.7 ? { text: '你双掌按门，灵力如潮涌入。符文一根根崩断，石门轰然洞开。', loot: { ls: 15 } } : { text: '符文反噬，一道电光顺着手臂窜上来，你踉跄后退。门还是开了，只是开得狼狈。', hp: -15, hazard: true } },
        { label: '寻机关绕行', sub: '凭悟性', act: s => Math.random() < 0.35 + s.wx * 0.05 ? { text: '你在门侧石壁上摸到一处凹痕，按下去，旁边无声地滑开一道窄门。', loot: { xw: 0.1 } } : { text: '你摸索了半日，才在一堆碎石下找到暗道，灵力耗去不少。', ling: -15 } },
      ] },
      { t: '傀儡长廊', text: s => { Core.rollFoe(s, { rel: 0 }); return `长廊两侧立着十二尊石傀，眼眶里嵌着暗红的晶石。你踏进第一步，最近的那尊便转过头来——它的气息，恰与你一般无二。`; }, choices: s => [
        { label: '拔剑破傀', sub: '一战', ling: -15, act: s => Core.fightAct(s, { name: '石傀', base: Jianghu.mjBase(s, 0.55),
          win: { text: '剑光过处，石傀碎成一地。你从它眼眶里抠出两颗晶石，入手温热。', fx: { ls: 30, item: { '寒铁': 1 } } },
          lose: { text: '石傀的拳头比山还重。你挨了两下，才寻到它关节处的破绽。', fx: { hp: -30 } } }) },
        { label: '屏息潜行', sub: '凭气运', act: s => Math.random() < 0.5 + s.luck * 0.04 ? { text: '你贴着墙根，一步一息。十二尊石傀的目光从你身上滑过，没有一尊动。' } : { text: '一块碎石在你脚下滚落。十二尊石傀齐齐转头，你只得一路狂奔，冲出长廊时，背上挨了一记。', hp: -20, fight: { dr: 0, gap: 0, foe: '石傀', tier: 'flee' } } },
      ] },
      { t: '丹室', text: '丹室里一尊三足鼎，炉火早熄了千年，鼎壁上却还凝着一层丹霜。墙上刻满了蝇头小字。', choices: s => [
        { label: '刮取丹霜', sub: '或有丹毒', act: s => Math.random() < 0.7 ? { text: '丹霜入瓶，药香扑鼻。鼎底还滚着两颗干瘪的丹丸。', loot: { item: { '聚气丹': 2, '紫云芝': 1 } } } : { text: '丹霜里藏着千年丹毒，你只吸了一口，便头晕目眩。', hp: -15, loot: { item: { '聚气丹': 1 } }, hazard: true } },
        { label: '研读壁上丹方', sub: '丹道', ling: -10, act: s => s.dan && !s.dan.rec.includes('pozhang') ? { text: '壁上刻的是一张破障丹方，你一字一句记下，掌心都是汗。', loot: { recipe: 'pozhang' } } : { text: '壁上丹方你早已烂熟，倒是旁边几行炼丹心得，让你茅塞顿开。', loot: { dan: 3 } } },
      ] },
      { t: '书阁与剑池', text: '甬道一分为二：左边是一间书阁，竹简堆到了屋顶；右边是一方剑池，池底沉着百十柄断剑，池水泛着寒光。', choices: s => [
        { label: '入书阁', sub: '悟道', act: s => Math.random() < 0.6 ? { text: '你在竹简堆里翻了三天，找到一卷洞府主人的修行札记，字字珠玑。', loot: { xw: 0.3 } } : { text: '竹简大多已经朽了，你只拼出半篇心得。', loot: { xw: 0.12 } } },
        { label: '探剑池', sub: '寒气侵骨', ling: -10, act: s => Math.random() < 0.6 ? { text: '你潜入池底，捞起一柄断剑，剑身上还刻着铭文。池水冷得刺骨。', loot: { ls: 50, item: { '古剑残片': 1 } } } : { text: '池水里的剑意比想的更烈，你捞起一枚残片，手掌被割得鲜血淋漓。', hp: -15, loot: { item: { '古剑残片': 1 } }, hazard: true } },
      ] },
      { t: '主室', boss: true, text: s => { Core.rollFoe(s, { rel: 1 }); return `主室正中一具枯骨端坐蒲团之上。你踏进门槛时，枯骨眼中亮起两点青火，一道残魂自骨中站起——${Core.foeStr(s)}，比你高了半筹。“后生，”他说，“过得了我，洞府归你。”`; }, choices: s => [
        { label: '请前辈赐教', sub: '决战', act: s => Core.fightAct(s, { name: '残魂', base: Jianghu.mjBase(s, 0.5),
          win: { text: '残魂散尽之前，朝你点了点头：“好。”枯骨化作飞灰，蒲团下露出一只玉匣。', fx: { xw: 0.6, ls: 80, frag: 1 } },
          lose: { text: '残魂一指点在你眉心，你神魂剧震，被一股柔力推出了洞府。“再修些年。”他的声音远远传来。', fx: { hp: -60 } } }) },
      ] },
    ] },
  zhanchang: { name: '上古战场', loc: 'xihuang', rm: 2, seal: '战', tint: 'rust',
    open: '西荒的风沙停了三天。第四天夜里，沙海中央升起一面残破的血旗，旗下，是一整片没有掩埋的上古战场。',
    nodes: [
      { t: '白骨荒原', text: s => { Core.rollFoe(s, { rel: 0 }); return `白骨铺地，一眼望不到头。月光下，几具披甲的骸骨慢慢站了起来，空洞的眼眶对准了你。阴兵的煞气，与你的修为恰好相当。`; }, choices: s => [
        { label: '斩开一条路', sub: '一战', ling: -15, act: s => Core.fightAct(s, { name: '阴兵', base: Jianghu.mjBase(s, 0.58),
          win: { text: '你斩碎了七具阴兵，骨片落了一地。骸骨堆里埋着几颗血菩提。', fx: { item: { '血菩提': 2 }, ls: 25 } },
          lose: { text: '阴兵不知疼痛，砍倒了又站起来。你杀出重围时，铠甲的锈刃在你身上留了三道口子。', fx: { hp: -30 } } }) },
        { label: '绕行沙丘', sub: '费灵力', ling: -20, act: s => ({ text: '你借着沙丘遮掩，绕了一个大圈。阴兵在原地站了一会儿，又慢慢躺了回去。' }) },
      ] },
      { t: '断戟山', text: '一座山全是断戟堆成的。每一截断戟上都残留着主人临死前的杀意，风吹过，满山呜咽。', choices: s => [
        { label: '登山悟杀意', sub: '心神俱震', act: s => Math.random() < 0.45 + s.xj / 250 ? { text: '你登上山顶，万千杀意扑面而来，又从你身边流过。你心头一片澄明，仿佛看见了那一战的始末。', loot: { xw: 0.35 } } : { text: '杀意灌顶，你眼前一黑，险些拔剑自刎。清醒过来时，掌心全是指甲掐出的血痕。', hp: -20, ling: -10, hazard: true } },
        { label: '拾取断戟', sub: '', act: s => ({ text: '你挑了几截成色最好的断戟，敲下戟尖收好。', loot: { item: { '古剑残片': 1, '寒铁': 1 } } }) },
      ] },
      { t: '英灵冢', text: '一座孤冢，冢前立着一块无字碑。碑下压着一面折断的令旗。四周的白骨，都朝着这座冢跪着。', choices: s => [
        { label: '祭拜英灵', sub: '', act: s => ({ text: '你折了三根枯枝当香，拜了三拜。风停了。碑上缓缓浮出一行字，又缓缓隐去。你心头一暖，灵力竟回复了几分。', ling: 25, loot: { xj: 8 } }) },
        { label: '掘冢取宝', sub: '怨气', act: s => Math.random() < 0.5 ? { text: '冢中一具将军骸骨，怀抱一只铁匣。匣中灵石尚在，你取了便走。', loot: { ls: 90 } } : { text: '锄头刚落，冢中怨气冲天而起，缠住你的手脚，你拼尽灵力才挣脱。', hp: -20, ling: -20, loot: { ls: 40 }, hazard: true } },
      ] },
      { t: '血旗阵', text: '血旗就在前方。旗下布着一座残阵，阵纹已经断了大半，却仍在缓缓转动，每转一圈，地上的血色便深一分。', choices: s => [
        { label: '以灵力硬闯', sub: '耗灵力', ling: -30, act: s => Math.random() < 0.65 ? { text: '你周身灵光大盛，一步一步走过阵心。阵纹在你脚下寸寸熄灭。' } : { text: '阵纹骤然收紧，血光如刀，你冲出阵时，护体灵光已经碎了。', hp: -25, hazard: true } },
        { label: '推演阵眼', sub: '凭悟性', act: s => Math.random() < 0.3 + s.wx * 0.06 ? { text: '你在阵外推演了三日，找到了那根断了的阵纹。轻轻一挑，整座阵便停了。', loot: { xw: 0.15 } } : { text: '推演到第三日，你算错了一步，被阵力扫中。', hp: -15, ling: -10, hazard: true } },
      ] },
      { t: '剑魂', boss: true, duel: true, text: s => `血旗之下站着一个披甲的人影，半透明，手按长剑。他看了你很久，开口时声音像是从万年前传来：“我等了很久。”——剑魂的修为，随你而涨，始终高你一线。`, choices: s => [
        { label: '拔剑', sub: '对决 · 攻守术奇', duelOpp: s => ({ name: '剑魂', npc: null, style: 'ao', rel: 0.72, q: 1.08 }),
          win: { text: '最后一剑，你们同时出手。剑魂的剑停在你喉前一寸，你的剑穿过了他的胸口。他笑了：“好剑。”血旗轰然倒下，旗杆里藏着一卷残页。', fx: { xw: 0.7, frag: 1, ls: 60 } },
          lose: { text: '剑魂收剑：“回去罢，你还没准备好。”一阵狂风卷起黄沙，你再睁眼时，已在战场之外。', fx: { hp: -60 } } },
      ] },
    ] },
  longgong: { name: '北海龙宫', loc: 'beihai', rm: 3, seal: '龙', tint: 'sea',
    open: '北海海眼裂开了。月光照进去，照见一级一级的白玉台阶，通往海底那座传说中的龙宫。',
    nodes: [
      { t: '海眼', text: '海水在你身边竖成两堵墙，墙里有巨大的影子游过。脚下的台阶湿滑，越往下，越冷。', choices: s => [
        { label: '御水而下', sub: '耗灵力', ling: -20, act: s => ({ text: '你以灵力撑开一圈水罩，沿着台阶一路下行。头顶的月光越来越小，最后只剩一个白点。' }) },
        { label: '纵身一跃', sub: '凭气运', act: s => Math.random() < 0.55 + s.luck * 0.04 ? { text: '你跃入漩涡，被暗流一卷，竟直接送到了龙宫门前。', ling: 10 } : { text: '暗流比想的更急，你被卷着撞上了礁石。', hp: -20, hazard: true } },
      ] },
      { t: '珊瑚迷阵', text: '龙宫外是一片血红的珊瑚林，枝枝相连，结成迷阵。珊瑚枝上挂着历代闯入者的骸骨。', choices: s => [
        { label: '顺水流而行', sub: '凭悟性', act: s => Math.random() < 0.35 + s.wx * 0.05 ? { text: '你注意到珊瑚的枝杈都朝着一个方向弯——那是水流的方向。你顺着水流，走出了迷阵。', loot: { item: { '鲛珠': 1 } } } : { text: '你在迷阵里转了七天，灵力耗了大半，才摸到出口。', ling: -25 } },
        { label: '斩开珊瑚', sub: '惊动守卫', act: s => { Core.rollFoe(s, { rel: 0 }); return Core.fightAct(s, { name: '巡海夜叉', base: Jianghu.mjBase(s, 0.55),
          win: { text: '珊瑚断处，冲出一队巡海夜叉。你斩了领头的那个，余者四散。夜叉的腰牌是一片龙鳞。', fx: { item: { '龙鳞': 1 }, ls: 40 } },
          lose: { text: '巡海夜叉的钢叉从四面八方刺来，你突围而出，肩上多了两个血洞。', fx: { hp: -30 } } }); } },
      ] },
      { t: '鲛人', text: '一个鲛人坐在龙宫门前的礁石上梳头，鱼尾拍着水。她看见你，并不害怕：“又是来偷宝的？”', choices: s => [
        { label: '以灵石换她指路', sub: '灵石', act: s => ({ text: '她收了灵石，指给你一条暗道：“从这里走，可以绕过龙王的眼睛。”临走时，她把一颗鲛珠塞进你手里。', loot: { ls: -60, item: { '鲛珠': 1 } }, ling: 15 }) },
        { label: '为她唱一支歌', sub: '', act: s => Math.random() < 0.5 ? { text: '你唱了一支家乡的小调。她听着听着，眼泪落下来，化作三颗鲛珠。', loot: { item: { '鲛珠': 3 } }, xj: 6 } : { text: '你唱得很难听。她笑得从礁石上滑进了水里。', loot: { xj: 4 } } },
      ] },
      { t: '宝库', text: '宝库的门开着。里面堆着沉船里捞来的金银，也有真正的宝物：一株九叶灵芝插在玉瓶里，旁边是一卷用龙筋捆着的丹方。', choices: s => [
        { label: '取灵芝', sub: '', act: s => ({ text: '你取下九叶灵芝。瓶中的海水忽然沸腾起来——宝库深处，传来一声低沉的龙吟。', loot: { item: { '九叶灵芝': 1, '雪莲': 1 } } }) },
        { label: '取丹方', sub: '', act: s => ({ text: '龙筋松开，丹方上是化婴丹的炼法，还附着龙宫历代丹师的批注。', loot: s.dan && !s.dan.rec.includes('huaying') ? { recipe: 'huaying' } : { dan: 4, ls: 60 } }) },
        { label: '什么都不拿', sub: '', act: s => ({ text: '你转身离开了宝库。龙吟声停了。', loot: { xj: 10 }, ling: 20 }) },
      ] },
      { t: '守宫老龙', boss: true, text: s => { Core.rollFoe(s, { rel: 2 }); return `宝库之后，一条白鳞老龙盘在玉柱上，龙须垂地，一只眼已经瞎了。“三千年了，”他说，“你是第一个走到这里的。”他的修为深不可测，约莫${Core.foeStr(s)}。`; }, choices: s => [
        { label: '请战', sub: '决战', act: s => Core.fightAct(s, { name: '老龙', base: Jianghu.mjBase(s, 0.55),
          win: { text: '老龙收了爪，长叹一声：“走罢，带上你该带的。”他吐出一颗龙珠，在你掌心化作一卷金色残页。', fx: { xw: 0.8, frag: 1, item: { '龙鳞': 2 } } },
          lose: { text: '龙尾一扫，海水倒灌，你被冲出海眼，落在冰面上，咳出一口带冰碴的血。', fx: { hp: -60 } } }) },
        { label: '与他说话', sub: '', act: s => ({ text: '你没有拔剑，坐下来听他讲了三天三夜。讲上古，讲龙族，讲他瞎掉的那只眼。临别时，他送了你一片逆鳞：“留个念想。”', loot: { item: { '龙鳞': 1 }, xj: 15, xw: 0.4 } }) },
      ] },
    ] },
};
const MJ_TINT = { moss: '#4e5a46', rust: '#6a4632', sea: '#3c5664' };


/* ================= v0.9 神器奇遇 ================= */
EVENTS.push(
  { id: 'shen_gu', title: '白骨祭坛', seal: '祭', w: 3, once: true, rm: [1, 4],
    cond: s => !s.flags.got_shen_gu && s.realm >= 1,
    text: s => '荒谷深处一座白骨堆成的祭坛，坛上插着一柄骨白短刃，无护手，刃口沁着薄红。周围静得可怕——连风都绕道走。你识海中那一点灵光隐隐发烫，似在提醒：此物有灵，亦有主。',
    choices: s => [
      { label: '以心血温之，强行认主', sub: '得噬主骨刃 · 寿元与心境皆有损', act: s => {
        s.flags.got_shen_gu = 1;
        return { text: '你刺破指尖，血珠滴上刃身。骨刃嗡鸣一声，钻入你袖中。只是那一瞬，鬓角似又白了一寸，心头也空了一块。', fx: { gear: '噬主骨刃', life: -0.08, xj: -8, flag: 'got_shen_gu' } };
      }},
      { label: '以土掩之，不去招惹', sub: '心境略安', act: s => ({ text: '你拨开黄土，把祭坛埋了半截。走出谷口时，背后似有骨节轻响——你没有回头。', fx: { xj: 3, flag: 'got_shen_gu' } }) },
      { label: '试着拨开骨刃，看清铭文', sub: '或有机缘，或被反噬', act: s => {
        s.flags.got_shen_gu = 1;
        if (Math.random() < 0.45) return { text: '铭文是上古血篆，你强记下来，悟得一丝噬元之法。骨刃却突然烫手，你甩开它，掌心已起水泡。', fx: { gfXp: 4, inj: 1, xj: -4 } };
        return { text: '你刚触到刃柄，阴寒倒灌。好在你运功及时，只是吐了一口淤血。骨刃没入土中，再寻不见。', fx: { inj: 2, xj: -6 } };
      }},
    ]},
  { id: 'shen_deng', title: '忘川青灯', seal: '灯', w: 2.5, once: true, rm: [2, 4],
    cond: s => !s.flags.got_shen_deng && s.realm >= 2,
    text: s => '月下冰湖中央，一盏青荧小灯悬在水面上，照不见前路，只照见你来时的脚印。灯旁立一石碣，三字：「寿可赎」。',
    choices: s => [
      { label: '以寿元点亮青灯', sub: '得忘川灯 · 折损寿元', act: s => {
        s.flags.got_shen_deng = 1;
        return { text: '你掐指一算，心知此灯要你一截阳寿。灯焰跳了一下，跃入识海。此后闭关，心魔竟远了些——只是铜镜里，你眉间多了一道浅纹。', fx: { gear: '忘川灯', life: -0.12, flag: 'got_shen_deng' } };
      }},
      { label: '只借灯火照路，不取灯', sub: '游历有获', act: s => ({ text: '你借着灯光辨清了湖心石路，捡到一枚鲛珠。青灯依旧悬着，像在等下一个愿意付钱的人。', fx: { item: { '鲛珠': 1 }, xj: 2, flag: 'got_shen_deng' } }) },
      { label: '吹灭它', sub: '未知', act: s => {
        s.flags.got_shen_deng = 1;
        return { text: '你吹了一口气。灯灭了。湖面忽然起雾，你在雾里走了很久，走出来时，手里多了一张无名功法残页——墨迹未干。', fx: { ls: 40, xj: -2 } };
      }},
    ]},
);

LOC_EV.xuewu.push('shen_gu'); LOC_EV.xihuang.push('shen_gu'); EV_LOC.shen_gu = ['xuewu', 'xihuang'];
LOC_EV.beihai.push('shen_deng'); LOC_EV.yunhai.push('shen_deng'); EV_LOC.shen_deng = ['beihai', 'yunhai'];

/* ================= v0.10 补：神器＋道基机缘 ================= */
EVENTS.push(
  { id: 'shen_ling', title: '裂空残绫', seal: '绫', w: 2.8, once: true, rm: [1, 4],
    cond: s => !s.flags.got_shen_ling && s.realm >= 1,
    text: s => '古修洞府石壁裂开一道缝，缝中垂着半匹半透明的绫。风一吹，绫影把空间撕开一线，你看见缝那边竟是另一座山——转眼又合上。',
    choices: s => [
      { label: '以精血系绫，收作佩物', sub: '得裂空绫 · 心境日损', act: s => {
        s.flags.got_shen_ling = 1;
        return { text: '绫缠上腕时，你听见极远的一声呼唤，像在叫一个你不认识的名字。腕间一凉，绫已没入识海。', fx: { gear: '裂空绫', xj: -6, flag: 'got_shen_ling' } };
      }},
      { label: '只记下裂空之法，不取绫', sub: '功法精进', act: s => ({ text: '你凝视那一线裂隙，悟得些许挪移之妙。绫自行褪入石壁，再寻不见。', fx: { gfXp: 5, xj: 2, flag: 'got_shen_ling' } }) },
      { label: '后退，不去碰', sub: '平安', act: s => ({ text: '你退了三步。石缝合拢，洞府复归寻常。走出洞口时，袖里多了一缕淡金丝线——不知何时落的。', fx: { ls: 25, flag: 'got_shen_ling' } }) },
    ]},
  { id: 'shen_pan', title: '子午铜盘', seal: '盘', w: 2.6, once: true, rm: [2, 4],
    cond: s => !s.flags.got_shen_pan && s.realm >= 2,
    text: s => '天阶下一块青石上，搁着一枚铜盘。指针不指南北，只微微颤着，像在等一个人伸手。盘沿刻着小字：「先付五年，再问前路。」',
    choices: s => [
      { label: '按盘心，付寿取盘', sub: '得子午罗盘 · 折寿五年', act: s => {
        s.flags.got_shen_pan = 1;
        return { text: '你掌心贴上盘心，一股凉意抽走。铜盘跃入袖中，指针忽然稳了——正指你尚未抵达的那一境。', fx: { gear: '子午罗盘', life: -0.1, flag: 'got_shen_pan' } };
      }},
      { label: '只借指针定向，不取盘', sub: '游历有获', act: s => ({ text: '你顺着指针走了一炷香，在乱石中捡到一枚古玉。铜盘仍在石上，像根本没被人碰过。', fx: { ls: 55, xj: 2, flag: 'got_shen_pan' } }) },
      { label: '翻转铜盘，看背面铭文', sub: '或悟或伤', act: s => {
        s.flags.got_shen_pan = 1;
        if (Math.random() < 0.5) return { text: '背面是一幅极简星图。你记下了，破境之时或可少走弯路。盘却烫手，你不得不放下。', fx: { btBuff: 1, xj: -3 } };
        return { text: '铭文一瞬刺目，你眼前发黑，好在闭气及时。醒来时盘已不见，只留下掌心一道圆印。', fx: { inj: 1, xj: -5 } };
      }},
    ]},
);

LOC_EV.gufu.push('shen_ling'); LOC_EV.heifeng.push('shen_ling'); EV_LOC.shen_ling = ['gufu', 'heifeng'];
LOC_EV.yunhai.push('shen_pan'); LOC_EV.gufu.push('shen_pan'); EV_LOC.shen_pan = ['yunhai', 'gufu'];

/* 道基共鸣：已择道基后的淡味机缘 */
EVENTS.push(
  { id: 'dj_jian', title: '剑意夜鸣', seal: '剑', w: 4, once: true, rm: [1, 4],
    cond: s => s.path && s.path.daoji === 'jian' && !s.flags.dj_jian,
    text: s => '夜里你在洞府调息，本命器忽然轻鸣。窗外松影一晃，像有人对剑。你睁眼，只见月光如刃，斜切在石案上。',
    choices: s => [
      { label: '起身对月练剑一式', sub: '斗法略利 · 祭炼', act: s => ({ text: '一式练完，腕间发热。你觉得那道刃形裂隙又深了半分——不是伤，是锋。', fx: { flag: 'dj_jian', xj: 2, gfXp: 3 } }) },
      { label: '按住器鸣，继续入定', sub: '心境安', act: s => ({ text: '你按住识海里的震颤。月光移过案角，一切复静。锋藏于静，不在张扬。', fx: { flag: 'dj_jian', xj: 5 } }) },
    ]},
  { id: 'dj_dan', title: '药香入梦', seal: '丹', w: 4, once: true, rm: [1, 4],
    cond: s => s.path && s.path.daoji === 'dan' && !s.flags.dj_dan,
    text: s => '闭关第三夜，你梦见一座丹炉。炉火不灼，只把识海里的杂念一点点炼化。醒时鼻端仍有药香。',
    choices: s => [
      { label: '依梦中火候试炼一炉', sub: '丹道精进', act: s => {
        if (s.dan) { s.dan.xp = (s.dan.xp || 0) + 6; }
        return { text: '火候竟与梦中一般无二。虽未成上品，你却摸到了丹基与炉火的共鸣。', fx: { flag: 'dj_dan', xj: 2 } };
      }},
      { label: '记下药香，留待日后', sub: '心境', act: s => ({ text: '你把那缕香气记在心口。此后吐纳，总觉得丹田温润了些。', fx: { flag: 'dj_dan', xj: 4 } }) },
    ]},
  { id: 'dj_qi', title: '器心轻颤', seal: '器', w: 4, once: true, rm: [1, 4],
    cond: s => s.path && s.path.daoji === 'qi' && s.fabao && !s.flags.dj_qi,
    text: s => `本命${s.fabao.name}在识海中沉了沉，像认家的牲口蹭了蹭你的掌心。你忽然明白：器基所定，不只是路，是羁绊。`,
    choices: s => [
      { label: '以心血温养本命器', sub: '祭炼大进', act: s => { if (typeof Core !== 'undefined' && Core.fabaoFeed) Core.fabaoFeed(s, 12); return { text: '一滴心血落下，器光大盛。你与它之间的丝，又粗了一分。', fx: { flag: 'dj_qi', xj: -2 } }; } },
      { label: '轻拍器身，权当问答', sub: '安稳', act: s => ({ text: '你在识海里拍了拍它。它震了一下，算是应了。', fx: { flag: 'dj_qi', xj: 3 } }) },
    ]},
  { id: 'dj_mo', title: '第二声笑', seal: '魔', w: 3.5, once: true, rm: [1, 4],
    cond: s => s.path && s.path.daoji === 'mo' && !s.flags.dj_mo,
    text: s => '丹田那滴黑血今夜又温了一下。你听见心里第二个声音轻笑：长生这条路，本就不干净。',
    choices: s => [
      { label: '随它笑，借力破障', sub: '修为进 · 心境危', act: s => ({ text: '你没有驱赶那笑声。修为涨了一截，镜中瞳仁却深了一分。', fx: { flag: 'dj_mo', xw: 0.08, xj: -10 } }) },
      { label: '压下魔念，默诵清心', sub: '心境回稳', act: s => ({ text: '你咬破舌尖，以痛压念。笑声淡了，黑血仍在——只是暂时安静。', fx: { flag: 'dj_mo', xj: 8 } }) },
    ]},
  { id: 'dj_zhen', title: '罗盘在心', seal: '阵', w: 4, once: true, rm: [1, 4],
    cond: s => s.path && s.path.daoji === 'zhen' && !s.flags.dj_zhen,
    text: s => '你路过一处乱石，忽然觉得脚踩的不是地，是纹。天地经纬在瞳中闪了一下，你下意识拨开一枚石子——石下竟有一枚旧阵基。',
    choices: s => [
      { label: '依阵纹推演片刻', sub: '机缘', act: s => ({ text: '推演到第三层，阵基自行崩解，化作一缕清气没入你识海。你忽然懂了：有些路，是布出来的。', fx: { flag: 'dj_zhen', ls: 40, xj: 2 } }) },
      { label: '埋回石子，不扰古阵', sub: '心境', act: s => ({ text: '你把石子放回原处。风过乱石，像有人低声道谢。', fx: { flag: 'dj_zhen', xj: 5 } }) },
    ]},
);
LOC_EV.shanmen.push('dj_jian', 'dj_dan', 'dj_qi', 'dj_mo', 'dj_zhen');
LOC_EV.gufu.push('dj_jian', 'dj_qi', 'dj_zhen');
LOC_EV.yunyue.push('dj_dan');
LOC_EV.xuewu.push('dj_mo');
for (const id of ['dj_jian', 'dj_dan', 'dj_qi', 'dj_mo', 'dj_zhen']) {
  EV_LOC[id] = EV_LOC[id] || [];
}
EV_LOC.dj_jian = ['shanmen', 'gufu']; EV_LOC.dj_dan = ['shanmen', 'yunyue'];
EV_LOC.dj_qi = ['shanmen', 'gufu']; EV_LOC.dj_mo = ['shanmen', 'xuewu']; EV_LOC.dj_zhen = ['shanmen', 'gufu'];
