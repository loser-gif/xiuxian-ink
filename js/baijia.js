/* 墨仙录 · 百家：多宗门数据（拜山帖／新宗／叛宗） */
'use strict';

/* ---------- 补宗门 ---------- */
Object.assign(ORGS, {
  dx: { id: 'dx', name: '丹霞谷', short: '丹霞', seal: '丹', lib: '丹霞秘藏',
    ranks: ['药童', '外谷弟子', '内谷弟子', '真传弟子', '丹长老', '炉主', '谷主'],
    cave: [1, 1.02, 1.05, 1.1, 1.15, 1.2, 1.24], ls: [1, 2, 5, 10, 20, 36, 55], lsMul: 1.05,
    dabi: '丹火大会', token: ['木', '木', '赤陶', '赤玉', '朱砂', '赤金', '火玉'],
    flavor: '丹', trait: '炉火纯青 · 炼丹、闭关顿悟略利', daoji: ['dan'], fabaoEl: ['火', '木'],
    startGf: 'qingteng', mentor: 'dx_shi', rookies: ['dx_huo', 'dx_lian', 'dx_tong'],
    craft: 0.05, dunwu: 0.02 },
  yy: { id: 'yy', name: '幽荧殿', short: '幽荧', seal: '幽', lib: '幽荧藏',
    ranks: ['影徒', '外殿弟子', '内殿弟子', '真传弟子', '殿司', '幽主', '殿主'],
    cave: [1, 1.04, 1.08, 1.13, 1.17, 1.21, 1.26], ls: [1, 3, 6, 11, 22, 38, 58], lsMul: 1.1,
    dabi: '幽荧夺影', token: ['骨', '骨', '玄玉', '墨玉', '夜明', '幽金', '荧玉'],
    flavor: '阴', trait: '幽荧照影 · 修炼略快，心魔亦近', daoji: ['mo'], fabaoEl: ['水'],
    startGf: 'hantan', mentor: 'yy_shi', rookies: ['yy_gui', 'yy_yin', 'yy_sha'],
    spd: 1.04, xinmo: 1.12 },
  xj: { id: 'xj', name: '玄机楼', short: '玄机', seal: '机', lib: '玄机阁',
    ranks: ['学徒', '外楼弟子', '内楼弟子', '真传弟子', '机司', '副楼主', '楼主'],
    cave: [1, 1.03, 1.06, 1.11, 1.16, 1.2, 1.25], ls: [1, 3, 5, 11, 22, 38, 56], lsMul: 1,
    dabi: '玄机演武', token: ['铜', '铜', '青铜', '星铜', '玄铁', '机金', '璇玑'],
    flavor: '阵器', trait: '机枢在握 · 光阴略缓、法宝亲近', daoji: ['zhen', 'qi'], fabaoEl: ['土', '金'],
    startGf: 'houtu', mentor: 'xj_shi', rookies: ['xj_zhen', 'xj_qi', 'xj_pan'],
    time: 0.96, fabao: 1.2 },
});

/* 青冥补 mentor 已在 sect.js；拜山帖选项 */
const BAISHAN = [
  { id: 'qm', seal: '宗', name: '青冥宗', sub: '剑修名门 · 斗法破境', prose: '云海之上，百峰如剑。青冥收人，先看锋芒——敢不敢把一生押在一柄剑上。' },
  { id: 'dx', seal: '丹', name: '丹霞谷', sub: '丹道一脉 · 炉火顿悟', prose: '谷中丹烟终年不散。丹霞收人，先看心性——守得住一炉火，才守得住一条命。' },
  { id: 'yy', seal: '幽', name: '幽荧殿', sub: '阴修鬼道 · 速成险途', prose: '殿门无匾，只有一盏幽荧。收人不论灵根清浊，只问：你怕不怕黑。' },
  { id: 'xj', seal: '机', name: '玄机楼', sub: '阵器双修 · 机缘光阴', prose: '楼中齿轮昼夜轻鸣。玄机收人，先看手稳——布阵的人，也要敢把自己布进去。' },
  { id: 'sx', seal: '盟', name: '散修盟', sub: '无门无派 · 俸厚脉薄', prose: '坊市角落里的铁令。散修盟不看灵根，只看本事——也看你愿不愿，与一群野修同桌吃饭。' },
  { id: 'free', seal: '游', name: '无门', sub: '逍遥散修 · 游历机缘更盛', prose: '山门之外，云海翻涌。你也可以谁都不拜——从此青石作枕，天地为炉。' },
];

const BAISHAN_WEI = BAISHAN.filter(b => b.id === 'sx' || b.id === 'free');

/* ---------- 新宗同门 ---------- */
Object.assign(NPCS, {
  dx_shi: { name: '赤霞真人', seal: '霞', title: '丹霞谷 · 授业', a0: 18,
    trait: '性急如火，骂人比炼丹还勤。', bio: '据说年轻时炸过九十九炉，第一百炉成了谷中至宝。' },
  dx_huo: { name: '霍长明', seal: '霍', title: '内谷 · 看火', a0: 5, style: 'gang', rel: 0.7, el: '火',
    trait: '话少，袖口总有焦痕。', bio: '守炉十年，眼睛被火光染成琥珀色。' },
  dx_lian: { name: '练清婉', seal: '练', title: '丹房师妹', a0: 22, style: 'rou', rel: 0.8, el: '木',
    trait: '温静，记药性过目不忘。', bio: '药篓比人高，人比药香淡。' },
  dx_tong: { name: '小满仓', seal: '仓', title: '药童', a0: 28, style: 'han', rel: 0.9, el: '土',
    trait: '贪吃药渣，却从不误事。', bio: '名字是谷主随口起的，他自己倒很满意。' },
  yy_shi: { name: '幽荧上人', seal: '荧', title: '幽荧殿 · 授业', a0: 10,
    trait: '声如冷泉，喜怒不形于色。', bio: '没人见过他的真面目，只见过那盏永不熄的幽荧。' },
  yy_gui: { name: '顾无夜', seal: '顾', title: '内殿 · 影修', a0: -5, style: 'gui', rel: 0.55, el: '水',
    trait: '来去无声，像自己的影子。', bio: '据说他有一半修为，练在「看不见」上。' },
  yy_yin: { name: '阴十娘', seal: '阴', title: '殿中师姐', a0: 12, style: 'wen', rel: 0.65, el: '水',
    trait: '笑时温柔，不笑时更温柔。', bio: '专司引魂灯，手里的灯从没晃过。' },
  yy_sha: { name: '煞七', seal: '煞', title: '外殿刀客', a0: -8, style: 'ao', rel: 0.75, el: '金',
    trait: '一言不合就拔刀，拔刀却少见血。', bio: '刀上刻着「七」，他自己也说不清是第几把。' },
  xj_shi: { name: '璇玑子', seal: '璇', title: '玄机楼 · 授业', a0: 16,
    trait: '说话像推演，推演像下棋。', bio: '腰间挂十二枚铜钱，从不占卜自己的事。' },
  xj_zhen: { name: '阵无虚', seal: '阵', title: '内楼 · 阵修', a0: 8, style: 'zha', rel: 0.6, el: '土',
    trait: '走路也在量步距。', bio: '他布的小阵，能让偷懒的弟子原地转三圈。' },
  xj_qi: { name: '器阿末', seal: '器', title: '器房师兄', a0: 15, style: 'gang', rel: 0.7, el: '金',
    trait: '锤声即回答。', bio: '打了一辈子铁，打出一屋子会响的废品——他说那叫「练耳」。' },
  xj_pan: { name: '盘小乙', seal: '盘', title: '外楼学徒', a0: 24, style: 'han', rel: 0.85, el: '土',
    trait: '罗盘比人精。', bio: '迷路三次，找到过一次古迹，从此腰牌上多了一枚小铜盘。' },
  sx_du: { name: '独眼老贾', seal: '贾', title: '散修盟 · 接引人', a0: 20,
    trait: '黄牙一笑，人情三分。', bio: '收过铁令又退盟的人，他都记得名字。' },
  sx_hua: { name: '花三娘', seal: '花', title: '盟中客卿', a0: 10, style: 'rou', rel: 0.7, el: '木',
    trait: '卖药也卖消息。', bio: '坊市里摊位最大的那个，是她；消息最快的那个，也是她。' },
});

Object.assign(NPC_LINE, {
  dx_shi: ['他看你的眼神，像看一炉未成的废丹。', '他骂归骂，药渣里总会多留你两味。', '他说：“这炉成了，算你的。”那是他夸人的极限。'],
  dx_huo: ['他只是点头，不与你并肩看火。', '守炉时他会默默把风口让你一半。', '他说：“火候这件事，你比我稳。”'],
  dx_lian: ['她见你，只浅浅一笑。', '她总记得你缺哪一味药。', '药篓里常多一包你爱吃的果脯。'],
  dx_tong: ['他见了你就躲到药架后。', '他塞给你烧焦的药饼：“能吃。”', '他逢人便说：“这位师兄，炉子炸了我都不怕。”'],
  yy_shi: ['幽荧晃了一下，算是见过你了。', '他偶尔问你一句心魔，像问今日天气。', '他说：“你还在，便好。”'],
  yy_gui: ['你看不见他，他却总看得到你。', '他会在你身后落下一句提醒，人已不见。', '他说：“影子也交过朋友。”'],
  yy_yin: ['她对你客气得像对陌生人。', '引魂灯经过你时，会亮一瞬。', '她说：“别怕黑。黑比许多人干净。”'],
  yy_sha: ['他擦刀的时候从不看你。', '他会把刀柄朝你递过来——那是信任。', '他说：“你的命，比我的刀贵。”'],
  xj_shi: ['他用铜钱敲桌，像在计你的对错。', '他偶尔把推演草稿塞给你。', '他说：“你这一步，走得比我当年好。”'],
  xj_zhen: ['他量你的步距，像量陌生人。', '他会指正你阵图上的一笔。', '他说：“跟你布阵，不累。”'],
  xj_qi: ['锤声停了，他也不抬头。', '他给你打过一把凡兵，不收钱。', '他说：“这件，配你。”'],
  xj_pan: ['他罗盘乱转，也不找你。', '他追着你问阵眼怎么布。', '他把小铜盘借给你：“别迷路。”'],
  sx_du: ['他眯着眼打量你，像打量货。', '铁令在他那儿总给你留着。', '他说：“自家人，没那么多规矩。”'],
  sx_hua: ['她卖药给你，价码分毫不让。', '消息到你耳中，总比别人早半日。', '她说：“你要是死外头，摊我来收。”'],
});

/* ---------- 晋升文 ---------- */
RITE_TEXT.dx = [null,
  '谷口丹烟里，执事把一块赤陶牌抛给你：“外谷弟子，许入丹房打杂，月领灵石。”牌上还烫手。',
  '赤霞真人骂骂咧咧把你喊进丹室：“跪下。从今日起，你是我看过的第一百零一个徒弟——别学前面一百个，炸炉。”青玉令砸进你怀里。',
  '丹霞钟鸣，谷主亲授真传赤玉令：“真传者，炉火不断，道心不灭。”你握着令牌，觉得掌心像压着一团活火。',
  '议炉殿中，你入丹长老末席。案上已备一盏新茶，茶里竟沉着半粒朱砂。',
  '你择一处丹烟最淡的侧峰开炉府。朱砂令入手，背面刻着历代炉主之名——最末一行，空着等你。',
  '丹霞谷开谷两千八百年，你成为谷主。接令那日，满谷丹烟忽然静了一息，像整座山在看你。'];
RITE_TEXT.yy = [null,
  '殿门幽荧下，影司递来骨牌：“外殿弟子。夜里的路，你自己走。”',
  '幽荧上人立于暗处：“起来。内殿的灯，照得见人，也照得见鬼。你选过了。”玄玉令冰凉入掌。',
  '夺影台前，殿主授你真传墨玉令：“真传者，影不离身，心不离道。”台下影修齐齐一揖。',
  '你入殿司席。案上无茶，只有一盏幽荧。上人说：“习惯就好。”',
  '你在殿侧开了一间无窗的幽府。夜明令入手，像握着一点不肯灭的光。',
  '幽荧殿主。接令时，殿中百灯齐明，又齐灭——只留你掌心那一点。'];
RITE_TEXT.xj = [null,
  '楼下执事把青铜牌拍在你手心：“外楼弟子，许入机房学徒。齿轮响的地方，就是你的课。”',
  '璇玑子拨了拨算盘：“内楼了。往后推演出错，罚抄阵图——抄一百遍。”星铜令叮一声。',
  '玄机楼钟齿轮合鸣，楼主授真传玄铁令：“真传者，机心在握，不欺天地。”',
  '你入机司席。案上摆着一副残阵，像在考你第一道题。',
  '你在楼侧开府，门楣自刻「半机」。机金令沉重，背面是历代副楼主的印。',
  '玄机楼主。接令那日，整楼齿轮忽然同频一响，像整座楼向你点头。'];
RITE_TEXT.sx = RITE_TEXT.sx; // already set

/* ---------- 新宗任务 ---------- */
MISSIONS.push(
  /* 丹霞 */
  { id: 'dx_shouhuo', name: '守炉看火', seal: '炉', orgs: ['dx'], rank: [0, 2], rm: [0, 2], m: 2, risk: 0.1, gx: 10, ls: 3, w: 10,
    brief: '丹房缺人守炉，火候差一分便废。',
    text: () => '丹房挂出牌子：今夜开炉回春丹，缺守火弟子。上一个守火的，眉毛还没长回来。',
    choices: s => [
      { label: '守炉通宵', risk: -0.05, gxm: 1, item: { '回春丹': 1 }, ...mt('火候稳如你的呼吸。开炉时赤霞真人只哼了一声——那是表扬。', '火旺了一息，焦了半炉。你被骂到天亮。') },
      { label: '偷记火诀', sub: '险', risk: 0.18, gxm: 0.9, gfXp: 2, ...mt('你把手法刻进心里。回去行功，竟也顺了些。', '看得太入神，炉盖“砰”地掀开，燎了额头。'), ffx: { inj: 1 } },
      ...(met(s, 'dx_lian') ? [{ label: '与练清婉轮守', sub: '练清婉', risk: -0.08, gxm: 1.1, npc: { dx_lian: 5 }, item: { '宁神花': 2 }, ...mt('她教你闻焦香辨火候。夜里药香与人声都淡。', '你们困得轮流盹，险些误了辰时。') }] : []),
    ] },
  { id: 'dx_caiyao', name: '谷后采药', seal: '药', orgs: ['dx'], rank: [0, 3], rm: [0, 3], m: 2, risk: 0.12, gx: 12, ls: 4, w: 9,
    brief: '药园缺雾隐草与赤阳花。',
    text: () => '药园执事缺一味雾隐草。谷后雾大，崖顶据说有百年灵芝。',
    choices: s => [
      { label: '稳妥采摘', risk: -0.05, gxm: 1, item: { '青叶草': 2, '赤阳花': 1 }, ...mt('叶不沾泥，根须完整。执事少见地点了点头。', '雾里转了两日，只得半筐。') },
      { label: '攀崖取灵芝', sub: '险', risk: 0.22, gxm: 1.5, item: { '紫云芝': 1 }, ...mt('你连土捧下灵芝，霍长明看了半晌，丢给你一枚聚气丹。', '岩松手，挂在藤上半个时辰。'), ffx: { inj: 2 }, itemOk: { '聚气丹': 1 } },
    ] },
  { id: 'dx_jianlu', name: '鉴炉', seal: '鉴', orgs: ['dx'], rank: [2, 6], rm: [1, 4], m: 3, risk: 0.15, gx: 22, ls: 8, w: 7,
    brief: '外谷弟子开炉翻车，请你鉴火。',
    text: () => '外谷一个弟子炉毁人伤。谷中请你去鉴——是火候错，还是心性躁。',
    choices: s => [
      { label: '直言其错', risk: 0, gxm: 1, xj: 2, ...mt('你把错处分毫不让地说清。那弟子跪谢，谷中记你一功。', '他不服，闹到执事处。你被说「太苛」。'), ffx: { xj: -2 } },
      { label: '引他重炼一炉', sub: '耗时', risk: 0.1, gxm: 1.3, time: 2, ...mt('你带着他重炼。成丹那一瞬，他哭了。你忽然想起自己第一炉。', '又炸了。你们俩眉毛都短了一截。'), ffx: { inj: 1 } },
    ] },
  /* 幽荧 */
  { id: 'yy_xunying', name: '巡影', seal: '影', orgs: ['yy'], rank: [0, 3], rm: [0, 2], m: 3, risk: 0.14, gx: 12, ls: 3, w: 10,
    brief: '殿廊夜巡，近来影子不太安分。',
    text: () => '殿廊的影子近来会自己走动。影司排了巡影，给你一盏幽荧、一口铜哨。',
    choices: s => [
      { label: '依令巡廊', risk: -0.05, gxm: 1, ...mt('你把每根柱影都认熟了。怪象在雨夜停了。', '你打了个盹，醒来幽荧灭了，铜哨不见。') },
      { label: '循影入暗室', sub: '险', risk: 0.2, gxm: 1.6, ...mt('暗室里是个走火的外殿弟子。你按住他，送去清心。', '暗室里什么也没有，只有冷风。你站了一夜。'), ffx: { xj: -4 } },
      ...(met(s, 'yy_gui') ? [{ label: '与顾无夜同巡', sub: '顾无夜', risk: -0.06, gxm: 1.1, npc: { yy_gui: 6 }, ...mt('他走在你影子里。一夜无话，却平安。', '他忽然消失，留下你独自面对一走廊乱动的影。') }] : []),
    ] },
  { id: 'yy_yinqi', name: '引气入阴', seal: '阴', orgs: ['yy'], rank: [1, 5], rm: [0, 3], m: 2, risk: 0.16, gx: 14, ls: 4, w: 8,
    brief: '殿中功课：以阴气淬体一刻。',
    text: () => '功课牌下：引阴气入体一刻。走火者自行负责。幽荧上人只批两字：「自愿」。',
    choices: s => [
      { label: '如法淬体', risk: 0.05, gxm: 1, xw: 0.06, ...mt('阴气如潮，你咬牙炼化。出定后，拳风更冷一分。', '阴气逆冲，你呕出一口黑血。'), ffx: { inj: 2, xj: -5 } },
      { label: '浅尝辄止', risk: -0.08, gxm: 0.7, xj: 3, ...mt('你只引一线。功课过了，心也稳。', '影司说你敷衍，记了一笔。') },
    ] },
  { id: 'yy_zhuisha', name: '追煞', seal: '煞', orgs: ['yy'], rank: [2, 6], rm: [1, 4], m: 4, risk: 0.32, gx: 36, ls: 14, w: 6, fight: true,
    brief: '有叛殿影修在外开杀戒，殿令追回。',
    text: s => { Core.showFoe(s, { rel: 1 }, { name: '叛殿弟子', title: '旧日同巡' }); return '一名内殿弟子携影遁走，在凡人镇上开了杀戒。殿令：影必须归，人——可生可死。他曾与你一廊巡影。'; },
    choices: s => [
      { label: '千里追影', risk: 0, gxm: 1, ...mt('你在破庙截住他。他跪着把影灯交还，一句话没有。', '他比影更滑。你只追回一只空灯笼。'), ffx: { xj: -3 } },
      { label: '劝他回头', sub: '心境', fight: true, risk: -0.05, gxm: 0.85, xj: 6, ...mt('你讲起同巡的雨夜。天亮时他把刀放下了。', '他笑了一下，刀光先到。'), ffx: { inj: 3 } },
    ] },
  /* 玄机 */
  { id: 'xj_buzhen', name: '布阵功课', seal: '阵', orgs: ['xj'], rank: [0, 2], rm: [0, 2], m: 2, risk: 0.1, gx: 11, ls: 3, w: 10,
    brief: '机房要你布一座「困步小阵」。',
    text: () => '机房考校：用十二枚铜钱布困步小阵，困住学徒三息即为过。',
    choices: s => [
      { label: '中规中矩布阵', risk: -0.04, gxm: 1, ...mt('学徒在阵中转了五圈。璇玑子敲了敲算盘：「过。」', '阵眼偏了一寸，学徒大步走了出去。') },
      { label: '加一暗扣', sub: '险', risk: 0.15, gxm: 1.35, ...mt('暗扣生效，学徒原地愣了半晌。阵无虚远远点了点头。', '暗扣反噬，你自己转了三圈。'), ffx: { xj: -2 } },
      ...(met(s, 'xj_zhen') ? [{ label: '请阵无虚指点', sub: '阵无虚', risk: -0.1, gxm: 1.1, npc: { xj_zhen: 5 }, ...mt('他改了你两处步距。阵成时，连空气都紧了一线。', '他叹了口气：「你量路，像量仇人。」') }] : []),
    ] },
  { id: 'xj_qiushi', name: '器房杂役', seal: '器', orgs: ['xj'], rank: [0, 1], rm: [0, 2], m: 2, risk: 0.08, gx: 9, ls: 2, w: 9,
    brief: '器阿末缺人拉风箱。',
    text: () => '器房锤声震天。器阿末头也不抬：「拉风箱。拉歪了，锤砸你脚。」',
    choices: s => [
      { label: '老实拉风箱', risk: -0.05, gxm: 1, ...mt('你拉到臂酸。他丢给你一块打废的精铁：「练手。」', '风歪了，他骂得比锤还响。') },
      { label: '偷学锻打', sub: '险', risk: 0.16, gxm: 0.9, gfXp: 2, ...mt('他假装没看见你偷学。临走塞你一把凡兵胚。', '锤偏了，砸在砧边，火星迸你脸上。'), ffx: { inj: 1 } },
    ] },
  { id: 'xj_tuyan', name: '推演残局', seal: '演', orgs: ['xj'], rank: [2, 6], rm: [1, 4], m: 3, risk: 0.12, gx: 24, ls: 8, w: 7,
    brief: '楼中残阵未解，请你推三日。',
    text: () => '案上残阵是百年前某位楼主留下的。璇玑子说：「解出来，真传可期；解不出来，也当睡了三日。」',
    choices: s => [
      { label: '苦推三日', risk: 0, gxm: 1, time: 1, wx: 0, ...mt('第三日晨，阵图自行合上。你悟到一丝机枢。', '推到眼花，阵还是残的。'), ffx: { xj: -2 } },
      { label: '以身体验阵眼', sub: '险', risk: 0.2, gxm: 1.4, xw: 0.08, ...mt('你站进阵眼，痛，但懂了。出阵时鼻血未干，笑了。', '阵反噬，你在原地转到吐。'), ffx: { inj: 2 } },
    ] },
  /* 散修盟 richer */
  { id: 'sx_biao', name: '盟中镖', seal: '镖', orgs: ['sx'], rank: [0, 5], rm: [0, 3], m: 3, risk: 0.2, gx: 14, ls: 16, w: 9,
    brief: '护送一车药材过黑风岭。',
    text: s => { Core.showFoe(s, { rel: 1 }, { name: '劫修', title: '黑风岭' }); return '独眼老贾拍你肩：「一车货，过黑风岭。岭上近来不太平。成了，银子你一半。」'; },
    choices: s => [
      { label: '绕官道', sub: '多耗时', risk: -0.1, gxm: 1, time: 2, ...mt('官道远，货全。老贾多给你一包糖炒栗子。', '桥断了，货霉了一半。') },
      { label: '硬闯黑风岭', sub: '险', risk: 0.15, gxm: 1.3, lsm: 1.5, fight: true, ...mt('你亮出盟令，又劈开巨石，劫修散了。', '货没保住，人保住了。老贾抽烟不说话。'), ffx: { inj: 2 } },
    ] },
  { id: 'sx_lei', name: '群英报名', seal: '擂', orgs: ['sx'], rank: [1, 4], rm: [0, 3], m: 1, risk: 0.05, gx: 8, ls: 2, w: 7,
    brief: '群英擂将开，盟中征人热场。',
    text: s => { Core.showFoe(s, { rel: 0 }, { name: '热场对手', title: '散修' }); return '群英擂前夜，老贾让你上台走两招热场：「打不打得赢不论，别把台子拆了。」'; },
    choices: s => [
      { label: '点到为止走两招', risk: -0.05, gxm: 1, xj: 2, ...mt('台下叫好。你拱手下台，腰包多了点打赏。', '你太认真，把对手打翻下台。老贾捂脸。') },
      { label: '真打一场', sub: '险', risk: 0.12, gxm: 1.4, fight: true, ...mt('你赢了。有散修塞你一瓶不知名的药。', '你输了，但台下记住了你的名字。'), ffx: { inj: 1 } },
    ] },
  { id: 'sx_qingbao', name: '买消息', seal: '讯', orgs: ['sx'], rank: [0, 6], rm: [0, 4], m: 1, risk: 0.06, gx: 6, ls: 1, w: 8,
    brief: '花三娘处有江湖消息出售。',
    text: () => '花三娘敲着算盘：「消息，三等价钱。你要听哪等？」',
    choices: s => [
      { label: '买一等消息', sub: '耗灵石约二十', risk: -0.05, gxm: 0.8, ...mt('她收了二十灵石，告诉你一处将开的秘境方位。你记在心里。', '消息是旧的。她赔你一笑：「江湖就是这样。」') },
      { label: '只听免费的', risk: 0, gxm: 0.5, ...mt('免费的是：「近期别去血雾谷。」你谢了。', '免费的是天气。') },
      ...(met(s, 'sx_hua') && aff(s, 'sx_hua') >= 20 ? [{ label: '凭交情要实讯', sub: '花三娘', risk: -0.05, gxm: 1.1, npc: { sx_hua: 3 }, ...mt('她压低声音说了一处拍卖冷门。', '她白你一眼：「交情不能当饭吃。」') }] : []),
    ] },
);

/* 修正 dx_caiyao itemOk 误用 — 简化 choices */
(function fixDx() {
  const m = MISSIONS.find(x => x.id === 'dx_caiyao');
  if (!m) return;
  m.choices = s => [
    { label: '稳妥采摘', risk: -0.05, gxm: 1, item: { '青叶草': 2, '赤阳花': 1 }, ...mt('叶不沾泥，根须完整。执事少见地点了点头。', '雾里转了两日，只得半筐。') },
    { label: '攀崖取灵芝', sub: '险', risk: 0.22, gxm: 1.5, item: { '紫云芝': 1, '聚气丹': 1 }, ...mt('你连土捧下灵芝，霍长明看了半晌，丢给你一枚聚气丹。', '岩松手，挂在藤上半个时辰。'), ffx: { inj: 2 } },
  ];
})();

/* ---------- 拜山／叛宗／掌门轻剧情 ---------- */
EVENTS.push(
  { id: 'peak_qm', title: '掌门夜问', seal: '宗', w: 5, once: true, rm: [4, 4],
    cond: s => s.sect && s.sect.org === 'qm' && s.sect.rank >= 6 && !s.flags.peak_ask,
    text: () => '你成为掌门后的第一个冬夜，栖霞峰松下多了一个人影——是玄微真人。他仍在煮茶：「坐。掌门也该问问自己，这山，因何而青冥。」',
    choices: () => [
      { label: '“为剑。”', act: () => ({ text: '师父点头：「那就把剑，留给后来人。」茶烟散尽，他的背影融进松色。', fx: { flag: 'peak_ask', xj: 6, wx: 1 } }) },
      { label: '“为山上这些人。”', act: () => ({ text: '师父笑了一下，极少见：「难。也该。」', fx: { flag: 'peak_ask', xj: 8 } }) },
      { label: '沉默，只饮茶', act: () => ({ text: '你们对坐到天明。他走时留下一句话：「青冥不在令上，在你心里那一寸不肯钝的锋。」', fx: { flag: 'peak_ask', xj: 5 } }) },
    ] },
  { id: 'peak_dx', title: '谷主开炉', seal: '丹', w: 5, once: true, rm: [4, 4],
    cond: s => s.sect && s.sect.org === 'dx' && s.sect.rank >= 6 && !s.flags.peak_ask,
    text: () => '你成为谷主，第一炉要以己血为引。赤霞真人在炉边骂：「别学我年轻时，炸了整个西谷。」',
    choices: () => [
      { label: '稳火成丹', act: () => ({ text: '丹成，香满谷。你把第一枚留给药童们分。', fx: { flag: 'peak_ask', item: { '聚气丹': 3 }, xj: 6 } }) },
      { label: '试险方', sub: '险', act: () => Math.random() < 0.55
        ? { text: '险方竟成。谷中记此一炉为「谷主炉」。', fx: { flag: 'peak_ask', wx: 1, xj: 4 } }
        : { text: '炸了半边炉灶。你站在烟里笑：「总算轮到我炸了。」', fx: { flag: 'peak_ask', inj: 2, xj: 8 } } },
    ] },
  { id: 'peak_yy', title: '殿主灭灯', seal: '幽', w: 5, once: true, rm: [4, 4],
    cond: s => s.sect && s.sect.org === 'yy' && s.sect.rank >= 6 && !s.flags.peak_ask,
    text: () => '按例，新殿主要亲手熄灭殿中百灯，只留一盏。幽荧上人在暗处：「你熄得掉吗？」',
    choices: () => [
      { label: '一盏盏熄去', act: () => ({ text: '熄到最后一盏，你的手停了。上人说：「留下。殿不能全黑。」', fx: { flag: 'peak_ask', xj: 7 } }) },
      { label: '一口气吹灭', act: () => ({ text: '百灯齐灭。黑暗里，你听见自己的心跳，和无数影子的呼吸。', fx: { flag: 'peak_ask', xj: -4, wx: 1 } }) },
    ] },
  { id: 'peak_xj', title: '楼主合齿', seal: '机', w: 5, once: true, rm: [4, 4],
    cond: s => s.sect && s.sect.org === 'xj' && s.sect.rank >= 6 && !s.flags.peak_ask,
    text: () => '新楼主要亲自校准楼心齿轮。璇玑子把扳手递给你：「错一齿，整楼要响一年的别扭。」',
    choices: () => [
      { label: '细校至合', act: () => ({ text: '齿轮咬合那一声，干净。整楼像松了口气。', fx: { flag: 'peak_ask', xj: 6, wx: 1 } }) },
      { label: '大胆改一齿', sub: '险', act: () => Math.random() < 0.5
        ? { text: '改齿后效率竟升。弟子们说楼走起路来都轻了。', fx: { flag: 'peak_ask', xj: 4 } }
        : { text: '别扭的响声持续了三个月。你每晚都在听。', fx: { flag: 'peak_ask', xj: -3 } } },
    ] },
  { id: 'peak_sx', title: '盟主席', seal: '盟', w: 5, once: true, rm: [4, 4],
    cond: s => s.sect && s.sect.org === 'sx' && s.sect.rank >= 6 && !s.flags.peak_ask,
    text: () => '你坐上盟主席。台下有人喊：「散修也有天！」独眼老贾在角落抽烟，花三娘敲了敲算盘。',
    choices: () => [
      { label: '立约：不弃弱散', act: () => ({ text: '你把「凡持铁令者，皆可一饭」写上盟约。台下有人哭了。', fx: { flag: 'peak_ask', xj: 8 } }) },
      { label: '立约：只认本事', act: () => ({ text: '你说：「盟里没有可怜人，只有能活下去的人。」鼓噪声起。', fx: { flag: 'peak_ask', xj: 3, wx: 1 } }) },
    ] },

  /* 掌门深一笔：夜问之后的职责 */
  { id: 'peak_duty_qm', title: '栖霞峰会', seal: '峰', w: 4.5, once: true, rm: [4, 4],
    cond: s => s.sect && s.sect.org === 'qm' && s.sect.rank >= 6 && s.flags.peak_ask && !s.flags.peak_duty,
    text: () => '峰会之上，长老们为外门一桩冤案争执不下。金令在你案上，像一口未出鞘的剑。',
    choices: () => [
      { label: '亲审，不为偏袒', act: () => ({ text: '你把案卷翻到天明，判得不漂亮，却让两边都无话可说。下山时，外门弟子朝你拱手。', fx: { flag: 'peak_duty', xj: 6, gx: 40 } }) },
      { label: '交给执事堂，自去闭关', act: () => ({ text: '你把金令一推：「你们裁。」闭关三月，出关时山门已贴了新榜——你的名字小了一寸，心倒静了。', fx: { flag: 'peak_duty', xj: 3, gx: -20 } }) },
      { label: '以剑断案，立威', act: () => ({ text: '你一剑削断公案角。堂上寂静。此后无人敢再在峰会上阴阳怪气——只是有人背后说：掌门锋利，山门也薄了。', fx: { flag: 'peak_duty', xj: -2, wx: 1, gx: 20 } }) },
    ] },
  { id: 'peak_duty_dx', title: '药谷冬疫', seal: '疫', w: 4.5, once: true, rm: [4, 4],
    cond: s => s.sect && s.sect.org === 'dx' && s.sect.rank >= 6 && s.flags.peak_ask && !s.flags.peak_duty,
    text: () => '冬月外门染疫。丹室告急，有人主张封谷，有人主张开炉舍丹。',
    choices: () => [
      { label: '开炉，以谷主炉供外门', act: () => ({ text: '你把谷主炉的火分给外门。三日后疫退，药童们喊你「谷主」。赤霞真人只哼了一声，眼底却软。', fx: { flag: 'peak_duty', xj: 7, item: { '聚气丹': 2 }, gx: 30 } }) },
      { label: '封谷自保，研新方', act: () => ({ text: '谷门落锁。半月后新方成，你开锁发丹——活的人多，怨的人也多。', fx: { flag: 'peak_duty', xj: 2, wx: 1, gx: 10 } }) },
    ] },
  { id: 'peak_duty_yy', title: '影殿点名', seal: '影', w: 4.5, once: true, rm: [4, 4],
    cond: s => s.sect && s.sect.org === 'yy' && s.sect.rank >= 6 && s.flags.peak_ask && !s.flags.peak_duty,
    text: () => '殿中要清点影卫名册。有三个名字，墨迹发虚——像活着，又像从未存在。',
    choices: () => [
      { label: '亲自入影查核', act: () => ({ text: '你在影里走了三夜，找回两个，第三个只剩一枚冷玉。上人说：「够了。影殿不求全。」', fx: { flag: 'peak_duty', xj: 5, gx: 35 } }) },
      { label: '涂去虚名，装作不知', act: () => ({ text: '你把三个名字抹了。名册干净，殿也更空。有人谢你，有人恨你。', fx: { flag: 'peak_duty', xj: -3, gx: 15 } }) },
    ] },
  { id: 'peak_duty_xj', title: '楼约重修', seal: '约', w: 4.5, once: true, rm: [4, 4],
    cond: s => s.sect && s.sect.org === 'xj' && s.sect.rank >= 6 && s.flags.peak_ask && !s.flags.peak_duty,
    text: () => '楼约百年一修。弟子们为「效率」与「人情」吵翻——齿轮不认情，人却认。',
    choices: () => [
      { label: '约以效率为齿，情为油', act: () => ({ text: '你写：「齿不合则换，人疲则歇。」楼约贴出，吵声小了，机声顺了。', fx: { flag: 'peak_duty', xj: 6, wx: 1, gx: 25 } }) },
      { label: '只改齿，不改人', act: () => ({ text: '你连夜校准。楼跑得更快，弟子眼底的青却更深。', fx: { flag: 'peak_duty', xj: -2, gx: 40 } }) },
    ] },
  { id: 'peak_duty_sx', title: '铁令风波', seal: '令', w: 4.5, once: true, rm: [4, 4],
    cond: s => s.sect && s.sect.org === 'sx' && s.sect.rank >= 6 && s.flags.peak_ask && !s.flags.peak_duty,
    text: () => '有人伪造铁令骗吃骗住。台下有人喊杀，有人喊放。独眼老贾看你，花三娘拨了一声算盘。',
    choices: () => [
      { label: '当众断伪令，赦初犯', act: () => ({ text: '你折断伪令，留下人：「再犯，无盟可投。」鼓噪声里，有人把真铁令握得更紧。', fx: { flag: 'peak_duty', xj: 7, gx: 30 } }) },
      { label: '严惩，以儆效尤', act: () => ({ text: '伪令者被逐出盟。此后铁令更金贵，也更冷。', fx: { flag: 'peak_duty', xj: 2, gx: 20 } }) },
    ] },
  /* 伪灵根更丰：散修路上 */
  { id: 'wei_night', title: '山门外一夜', seal: '夜', w: 6, once: true, rm: [0, 0],
    cond: s => s.lg && s.lg.id === 'wei' && !s.sect.org && !s.flags.wei_night,
    text: () => '测灵那夜你在青冥山门外站到天明。有个独眼老者扔过来一件旧袍：「穿上。伪灵根也能活，别冻死让宗门笑话。」',
    choices: () => [
      { label: '接袍，问他是谁', act: () => ({ text: '他咧嘴：「散修盟，老贾。铁令你要不要？不要也成，袍子送你。」', fx: { flag: 'wei_night', npc: { sx_du: 10 }, xj: 4 } }) },
      { label: '道谢，独自入山', act: () => ({ text: '你把袍披上，走进深山。风比宗门的拒绝诚实。', fx: { flag: 'wei_night', free: true, xj: 6 } }) },
    ] },
);

/* 藏经池：各宗略有侧重 */
const LIB_POOL_ORG = {
  qm: LIB_POOL.slice(),
  dx: ['qingteng', 'changchun', 'yimu', 'yanyang', 'lihuo', 'chixiao', 'xiaoyao', 'houtu', 'qingming'],
  yy: ['hantan', 'guicang', 'jiuyou', 'taiyin', 'tianmo', 'wangqing', 'xiaoyao', 'qingming'],
  xj: ['houtu', 'kunyuan', 'houtuzy', 'gengjin', 'baihong', 'wuxing', 'xiaoyao', 'qingming'],
  sx: ['qingming', 'xiaoyao', 'gengjin', 'qingteng', 'hantan', 'yanyang', 'houtu', 'baihong', 'changchun'],
};

function baishanAllowed(lgId) {
  return lgId === 'wei' ? BAISHAN_WEI : BAISHAN;
}
function orgTraitParts(s) {
  const o = s.sect && s.sect.org && ORGS[s.sect.org];
  if (!o) return null;
  const t = {};
  if (o.spd) t.spd = o.spd;
  if (o.xinmo) t.xinmo = o.xinmo;
  if (o.time) t.time = o.time;
  if (o.dunwu) t.dunwu = o.dunwu;
  if (o.craft) t.craft = o.craft;
  return Object.keys(t).length ? t : null;
}
