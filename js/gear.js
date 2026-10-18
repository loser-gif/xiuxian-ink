/* 墨仙录 · 器与卷：本命法宝、凡兵灵器神器 */
'use strict';

const FABAO_STAGE = ['认主', '开光', '祭炼', '化形'];
const FABAO_NEED = [0, 10, 28, 64];   // 祭炼值门槛
// 各阶被动（叠加入行功／破境／寿元）
const FABAO_BONUS = [
  {},
  { bt: 0.02 },
  { bt: 0.035, spd: 1.03 },
  { bt: 0.05, spd: 1.06, life: 0.05, qiyu: 0.08 },
];
// 按灵根五行取本命器胚；异灵根／伪灵根走 _
const FABAO_POOL = {
  金: [
    { id: 'baihong', name: '白虹尺', seal: '尺', flavor: '尺身细窄，映日时一道白线。你握上的那一瞬，指节隐隐发热——它认得你经脉里的金气。' },
    { id: 'suijin', name: '碎金刃', seal: '刃', flavor: '刃口细碎如星砂，并不锋利，却专断执念。认主时，你听见极轻的一声金鸣。' },
  ],
  木: [
    { id: 'qingteng', name: '青藤簪', seal: '簪', flavor: '一截活藤枯成簪形，簪头犹有新芽。插入发间，便觉气机缓缓爬上百会。' },
    { id: 'mulin', name: '木灵针', seal: '针', flavor: '针身青碧，刺破虚空亦不带血腥气。认主那夜，药园的草都朝你微微低了头。' },
  ],
  水: [
    { id: 'hantan', name: '寒潭镜', seal: '镜', flavor: '镜面无尘，映出的不是容颜，是心湖。你望进去，连自己的杂念都看得清楚。' },
    { id: 'xuanzhu', name: '玄水珠', seal: '珠', flavor: '一粒深黑的珠，沉甸甸的。握久了掌心潮意，像揣着一掬不干的夜雨。' },
  ],
  火: [
    { id: 'chiyan', name: '赤焰灯', seal: '灯', flavor: '灯芯是一缕不灭的心火。你吹它不熄，唯有以识海喂养，灯花才会亮一分。' },
    { id: 'lihuo', name: '离火印', seal: '印', flavor: '方寸朱印，印面无字。按下虚空，却留下一枚灼热的火篆，半晌方散。' },
  ],
  土: [
    { id: 'houtu', name: '厚土圭', seal: '圭', flavor: '石圭沉手，纹路如田垄。认主时你几乎站不稳——地气从脚底往上涌，要把你钉在此处。' },
    { id: 'zhenyue', name: '镇岳印', seal: '印', flavor: '印纽作山形，握之如负丘壑。你心一静，周围的风声便矮了一寸。' },
  ],
  _: [
    { id: 'wuming', name: '无名残剑', seal: '剑', flavor: '剑无锋、无名、无来历。你捡起它时，它也只是轻轻震了一下，像在说：也好。' },
    { id: 'mujian', name: '青冥木简', seal: '简', flavor: '三片朽木穿成的简，字迹淡得几乎没有。可你一运功，简上便浮出自己的名字。' },
  ],
};

const AUX_MAX = 2;
const AUX_LAYER_CAP = 3;   // 辅修只取前三层之效

/* 装备：凡兵 / 灵器可购；神器仅奇遇 */
const GEAR = {
  '精铁短剑': { grade: 0, kind: '凡兵', slot: 'weapon', base: 55, buy: 1, t: { bt: 0.012 },
    desc: '坊市铁匠随手打的短剑，分量尚可。佩在腰间，走路都稳些。' },
  '青钢刃': { grade: 0, kind: '凡兵', slot: 'weapon', base: 88, buy: 1, t: { bt: 0.02 },
    desc: '刃上带一丝青光，砍石不崩。卖剑人说，此刃杀过一头筑基妖兽——你半信半疑。' },
  '寒铁枪': { grade: 1, kind: '灵器', slot: 'weapon', base: 240, buy: 1, rm: 1, t: { bt: 0.03, qiyu: 0.05 },
    desc: '枪头嵌寒铁，握久了掌心生凉。游历遇敌时，先机常在你这一枪。' },
  '赤焰环': { grade: 1, kind: '灵器', slot: 'weapon', base: 260, buy: 1, rm: 1, t: { spd: 1.03 },
    desc: '一对赤铜环，运转周天时环中隐有火纹。佩之，吐纳略快一线。' },
  '碧水尺': { grade: 1, kind: '灵器', slot: 'weapon', base: 230, buy: 1, rm: 1, t: { xinmo: 0.88 },
    desc: '尺身如一汪浅水，心浮气躁时看一眼，便静了。' },
  '噬主骨刃': { grade: 2, kind: '神器', slot: 'weapon', artifact: 1, t: { spd: 1.1, bt: 0.04 },
    curse: { xjPerYear: 1.2, risk: 0.012 },
    desc: '刃白如骨，无护手。认主之后，它便日夜吮你心神——快是真快，空也是真空。' },
  '忘川灯': { grade: 2, kind: '神器', slot: 'weapon', artifact: 1, t: { life: 0.1, xinmo: 0.65 },
    curse: { lifeOnce: -8 },
    desc: '一盏青荧小灯，照不见前路，只照见来路。点亮它的人，寿元要先献给忘川。' },
  '裂空绫': { grade: 2, kind: '神器', slot: 'weapon', artifact: 1, t: { spd: 1.08, qiyu: 0.12 },
    curse: { xjPerYear: 0.8 },
    desc: '一匹半透明的绫，抖开时空间似被撕开一线。佩之游历机缘更盛，只是夜里常听见远处有人唤你的名字——唤的，未必是你。' },
  '子午罗盘': { grade: 2, kind: '神器', slot: 'weapon', artifact: 1, t: { bt: 0.035, time: 0.9 },
    curse: { lifeOnce: -5 },
    desc: '铜盘十二刻，指针永指你尚未抵达之处。握它的人，光阴略缓，破境略利——盘心却要你先付五年阳寿。' },
};

const GEAR_BUY = Object.keys(GEAR).filter(k => GEAR[k].buy);
