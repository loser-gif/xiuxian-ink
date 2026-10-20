/* 墨仙录 · 定型：道基 / 丹纹 / 法相 / 问道 / 劫纹 */
'use strict';

const PATH_KIND = {
  daoji: { name: '道基', seal: '基', realm: 1, pick: 1, max: 1, irrev: true },
  danwen: { name: '丹纹', seal: '纹', realm: 2, pick: 1, max: 2, irrev: true },
  faxiang: { name: '法相', seal: '相', realm: 3, pick: 1, max: 1, irrev: true },
  wendao: { name: '问道', seal: '问', realm: 4, pick: 1, max: 1, irrev: false },
  jiewen: { name: '劫纹', seal: '劫', realm: 5, pick: 1, max: 1, irrev: false },
};

/* from 破境前境界：0炼气→道基，1筑基→丹纹，2金丹→法相，3元婴→问道，4化神→劫纹后飞升 */
const PATH_AT = { 0: 'daoji', 1: 'danwen', 2: 'faxiang', 3: 'wendao', 4: 'jiewen' };

const DAOJI = {
  jian: {
    name: '剑基', seal: '剑',
    trait: '锋芒外露 · 破境、游历、斗法略利',
    desc: '以剑意为基。筑基那一夜，你梦见一口无名长剑立于胸臆，剑鸣不绝。醒时丹田多了一道刃形裂隙——不是伤，是锋。',
    t: { bt: 0.025, qiyu: 0.1 }, duel: 1.07, fabao: 1.15, youli: 1.08,
  },
  dan: {
    name: '丹基', seal: '丹',
    trait: '药香入髓 · 闭关顿悟、伤愈略易',
    desc: '以丹意为基。炉火在识海中燃了一夜，凝成一粒不散的虚丹。此后吐纳，总有药香绕鼻。',
    t: { dunwu: 0.04, heal: 1, xjGain: 1 }, craft: 0.06, fabao: 1.05,
  },
  ti: {
    name: '体基', seal: '体',
    trait: '筋骨如铸 · 寿元、抗心魔',
    desc: '以身为基。经脉轰鸣如鼓，皮肉下隐有青铜光泽。你站起身时，石床竟裂了一道细纹。',
    t: { life: 0.1, xinmo: 0.82 }, duel: 1.03, fabao: 1.1,
  },
  zhen: {
    name: '阵基', seal: '阵',
    trait: '罗盘在心 · 光阴略缓、机缘可推',
    desc: '以阵意为基。开眼时，天地经纬在你瞳中过了一遍。你忽然懂得：有些路，不是走的，是布的。',
    t: { time: 0.9, qiyu: 0.08 }, fabao: 1.08,
  },
  mo: {
    name: '魔基', seal: '魔',
    trait: '魔性初萌 · 修炼加快，心魔亦近',
    desc: '以魔意为基。那一夜，你听见自己心里第二个声音在笑。丹田深处多了一滴黑血，温热，却不烫。',
    t: { spd: 1.1, xinmo: 1.2, bt: 0.015 }, duel: 1.05, fabao: 1.2,
  },
  qi: {
    name: '器基', seal: '器',
    trait: '器心共鸣 · 本命法宝祭炼加倍亲近',
    desc: '以器意为基。识海中那件本命物忽然沉了沉，像认了家。你与它之间，多了一根看不见的丝。',
    t: { bt: 0.015, life: 0.04 }, fabao: 1.45, duel: 1.02,
  },
};

const DANWEN = {
  gong: {
    name: '攻伐纹', seal: '攻',
    trait: '金丹锋芒 · 斗法、破境',
    desc: '金丹表面裂开一道朱红纹路，如刀刻。纹成之时，周遭灵气皆避让三分。',
    t: { bt: 0.02 }, duel: 1.09,
  },
  hu: {
    name: '护体纹', seal: '护',
    trait: '丹护周天 · 伤势易愈、寿元略增',
    desc: '纹如龟甲，环抱金丹。你试着以指叩腹，听见一声极轻的钟鸣。',
    t: { life: 0.06, heal: 1 }, duel: 0.97,
  },
  shou: {
    name: '衍寿纹', seal: '寿',
    trait: '寿元绵长',
    desc: '纹作藤蔓，绕丹三匝。每转一匝，你便觉得时光在身边慢了一息。',
    t: { life: 0.14, time: 0.96 },
  },
  ling: {
    name: '通灵纹', seal: '灵',
    trait: '感应天地 · 游历机缘',
    desc: '纹如星河，细不可察。闭目时，远处的灵草、妖气、人影，皆在识海边缘闪一下。',
    t: { qiyu: 0.15, dunwu: 0.02 },
  },
  xin: {
    name: '澄心纹', seal: '澄',
    trait: '心湖不波 · 心魔大减',
    desc: '纹作一圈涟漪，旋即静止。你发现，那些往日挥之不去的杂念，竟一时找不到落脚处。',
    t: { xinmo: 0.68, xjGain: 1 },
  },
};

const FAXIANG = {
  jian: {
    name: '剑相', seal: '剑',
    trait: '法相如剑 · 斗法攻势',
    desc: '元婴化形，竟是一口虚空长剑。出招时，剑相与本尊同鸣，攻势如白虹。',
    t: { bt: 0.02, qiyu: 0.05 }, duel: 1.12, style: 'gang',
  },
  huo: {
    name: '火相', seal: '火',
    trait: '法相离火 · 修炼、顿悟',
    desc: '元婴周身燃起不灼之物。那火只烧杂念，不烧肉身——你希望如此。',
    t: { spd: 1.06, dunwu: 0.04, xinmo: 1.08 }, duel: 1.05,
  },
  shui: {
    name: '水相', seal: '水',
    trait: '法相玄水 · 心境、光阴',
    desc: '元婴化作一滴深水，落入识海无声。水善利万物，亦善藏锋。',
    t: { xinmo: 0.72, time: 0.92, xjGain: 1 }, duel: 1.02,
  },
  lei: {
    name: '雷相', seal: '雷',
    trait: '法相紫霄 · 破境大增',
    desc: '元婴掌中一络电光，若隐若现。破关之时，那电光会替你先撞开一层天门。',
    t: { bt: 0.05, spd: 1.03 }, duel: 1.08,
  },
  kong: {
    name: '空相', seal: '空',
    trait: '法相虚无 · 机缘、光阴',
    desc: '元婴淡去轮廓，只余一点灵光。空故能容，容故能遇。',
    t: { qiyu: 0.18, time: 0.88 }, duel: 1.0,
  },
};

const WENDAO = {
  tian: {
    name: '问天', seal: '天',
    trait: '以天为鉴 · 破境略增',
    desc: '化神之时，你仰面问天。天不语，却落下一缕金辉，没入眉心。',
    t: { bt: 0.03 },
  },
  ren: {
    name: '问心', seal: '心',
    trait: '以心为度 · 心境稳',
    desc: '你不问天，只问自己：为何求长生？答案未出，心湖已定。',
    t: { xinmo: 0.85, xjGain: 1 },
  },
  di: {
    name: '问地', seal: '地',
    trait: '以地为根 · 寿元、光阴',
    desc: '你俯身触地。地气涌上来，像认回一个出走太久的孩子。',
    t: { life: 0.08, time: 0.93 },
  },
};

const JIEWEN = {
  gang: {
    name: '刚劫', seal: '刚',
    trait: '此次破劫略利 · 失败更易重伤',
    desc: '劫云压顶，你不闪不避，以法相硬接第一道雷。这一纹算在即将落下的这一劫上：成，略利；败，伤势更重。劫纹烙在识海，如刀疤。',
    t: { bt: 0.04 }, duel: 1.05, risk: 1.15,
  },
  rou: {
    name: '柔劫', seal: '柔',
    trait: '此次失败稍安 · 不改已成之局',
    desc: '你化作水与风，引雷绕体三匝，再送入长空。这一纹算在即将落下的这一劫上：失败时稍安，并不改写已经过去的事。劫纹细而长，像一道愈合的伤。',
    t: { xinmo: 0.9, life: 0.04 }, risk: 0.85,
  },
  wang: {
    name: '忘劫', seal: '忘',
    trait: '不改此次凶险 · 利心境与机缘',
    desc: '雷落之时，你忽然什么都不想。这一纹不改这一劫的凶险，只在心境与机缘上留一点余地。无想故无惧，无惧故雷亦茫然。',
    t: { qiyu: 0.1, xjGain: 1 }, risk: 1.0,
  },
};

const PATH_TABLE = { daoji: DAOJI, danwen: DANWEN, faxiang: FAXIANG, wendao: WENDAO, jiewen: JIEWEN };

function pathLabel(kind, id) {
  const t = PATH_TABLE[kind]; return t && t[id] ? t[id].name : '';
}
function pathTrait(kind, id) {
  const t = PATH_TABLE[kind]; return t && t[id] ? t[id].trait : '';
}
