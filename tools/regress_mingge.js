#!/usr/bin/env node
/* 命格绘卷：落印效果、不重掷、不叠奖、旧档空命格。 */
'use strict';
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const ctx = vm.createContext({ console, Math, JSON, Object, Array, Number, String, Date, parseInt, parseFloat });
const files = ['data', 'gongfa', 'gear', 'path', 'story', 'sect', 'baijia', 'world', 'tianxia', 'karma', 'life', 'juan', 'core', 'loops', 'jianghu', 'redworld', 'folio', 'people', 'mingge'];
for (const f of files) vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', f + '.js'), 'utf8'), ctx, { filename: f + '.js' });
const g = vm.runInContext('({ Core, Mingge, Juan, EVENTS, LINGGEN, ORGS })', ctx);
const fail = [];
function check(name, ok, extra) {
  if (!ok) fail.push(name + (extra ? ' ' + JSON.stringify(extra) : ''));
}
function san() {
  return { id: 'san', name: '三灵根', mult: 1, bt: 0, sect: '外门弟子', word: '寻常' };
}
function draft(over) {
  const d = g.Mingge.emptyDraft(over && over.seed != null ? over.seed : 3);
  d.base = { lg: san(), els: ['金', '木', '土'], wx: 5, luck: 2 };
  d.sex = 'm';
  d.grab = 'jade';
  d.six = 'run';
  d.ten = 'watch';
  d.root = 'fire';
  d.path = 'sect';
  d.org = 'qm';
  d.mate = 'any';
  d.name = '沈试';
  if (over) Object.keys(over).forEach(k => { if (k !== 'seed') d[k] = over[k]; });
  return d;
}
function begin(d) {
  const packed = g.Mingge.pack(d);
  const roll = Object.assign({}, packed.roll, {
    org: packed.choice.id === 'free' ? null : packed.choice.id,
    free: packed.choice.id === 'free',
    origin: packed.origin,
  });
  const s = g.Core.newState(d.name || '沈试', roll, null);
  s.who = { sex: d.sex || 'm', mate: d.mate || 'any' };
  g.Mingge.apply(s, d);
  return s;
}

const male = begin(draft({ sex: 'm', grab: 'sword', six: 'book', ten: 'free', root: 'fire', path: 'sect', org: 'dx' }));
check('male-sex', male.who && male.who.sex === 'm', male.who);
check('male-life', male.lifeBonus === 19, male.lifeBonus);
check('male-origin', male.origin === 'hanmen');
check('male-sword', !!(male.gfs && male.gfs.tiejian));
check('male-fire', male.lgEls[0] === '火');
check('male-fox', (male.life.deeds || []).some(d => d.id === 'mingfox'));
check('male-wx', male.wx === 6, male.wx);
check('male-sect', male.sect.org === 'dx' && male.sect.rank === 1, { org: male.sect.org, rank: male.sect.rank });
check('male-hook', g.EVENTS.find(e => e.id === 'ming_qian').cond(male) && !g.EVENTS.find(e => e.id === 'ming_kun').cond(male));

const female = begin(draft({ sex: 'f', grab: 'jade', six: 'pill', ten: 'watch', root: 'water', path: 'sect', org: 'qm' }));
check('female-sex', female.who.sex === 'f');
check('female-shen', female.ming.shen === 8, female.ming.shen);
check('female-luck', female.luck === 7, female.luck);
check('female-ls', female.ls === 108, female.ls);
check('female-origin', female.origin === 'shijia');
check('female-water', female.lgEls[0] === '水');
check('female-gengu', female.ming.gengu === 5);
check('female-clean', g.Core.gt(female, 'xinmo', 1) < 1, g.Core.gt(female, 'xinmo', 1));
check('female-life-trait', g.Core.gt(female, 'life', 0) >= 0.03);
check('female-hook', g.EVENTS.find(e => e.id === 'ming_kun').cond(female) && !g.EVENTS.find(e => e.id === 'ming_qian').cond(female));
check('female-rank', female.sect.rank === 1, female.sect.rank);

const air = begin(draft({ sex: 'f', grab: 'air', six: 'run', ten: 'skin', root: 'fire', path: 'rogue' }));
check('air-ls', air.ls === 0, air.ls);
check('air-origin', air.origin === 'daotai');
check('air-gold', !!air.ming.gold && g.Mingge.GOLD[air.ming.gold], air.ming.gold);
check('air-coat', air.items['百年狐皮'] === 1, air.items);
check('air-heart', air.life.heart < 0, air.life.heart);
check('air-free', air.sect.free === true && !air.sect.org);
check('air-bounty', (air.karma.seeds || []).some(x => x.id === 'ming_bounty'));
check('air-no-moblood', !air.flags.moBlood);
check('cruel-event', g.EVENTS.find(e => e.id === 'ming_cruel').cond(air));

const lifeBefore = air.lifeBonus;
const coatBefore = air.items['百年狐皮'];
const again = g.Mingge.apply(air, draft({ grab: 'air' }));
check('apply-dup', again.dup === true);
check('no-stack-life', air.lifeBonus === lifeBefore, { lifeBefore, now: air.lifeBonus });
check('no-stack-coat', air.items['百年狐皮'] === coatBefore);

let leiOk = null;
let leiNo = null;
for (let seed = 1; seed < 400 && (!leiOk || !leiNo); seed++) {
  const d = draft({ seed: seed, grab: 'sword', six: 'pill', root: 'lei', path: 'dust', ten: 'watch', sex: 'm' });
  d.lei = null;
  const row = g.Mingge.resolveLei(d);
  const againLei = g.Mingge.resolveLei(d);
  if (row !== againLei || row.ok !== againLei.ok) fail.push('lei-unstable ' + seed);
  if (row.ok && !leiOk) leiOk = seed;
  if (!row.ok && !leiNo) leiNo = seed;
}
check('lei-both', leiOk && leiNo, { leiOk, leiNo });
if (leiOk) {
  const d = draft({ seed: leiOk, grab: 'sword', six: 'book', root: 'lei', path: 'sect', org: 'qm', sex: 'm', ten: 'watch' });
  d.lei = null;
  const s = begin(d);
  check('lei-success', s.lg.id === 'yi' && s.lgEls[0] === '雷' && s.ming.leiOk === 1, { id: s.lg.id, els: s.lgEls, band: s.ming.band });
  check('lei-qinchuan-or-rank', s.sect.rank === 3 && s.sect.master === true, { rank: s.sect.rank, master: s.sect.master });
}
if (leiNo) {
  const d = draft({ seed: leiNo, grab: 'sword', six: 'pill', root: 'lei', path: 'sect', org: 'qm', sex: 'f', ten: 'watch' });
  d.lei = null;
  const s = begin(d);
  check('lei-fail', s.lg.id !== 'yi' && s.inj === 2 && s.xj >= 60, { id: s.lg.id, inj: s.inj, xj: s.xj });
}

const low = draft({ grab: 'jade', six: 'run', root: 'fire' });
check('lei-locked', g.Mingge.canLei(low) === false && g.Mingge.gengu(low) === 0);

const study = begin(draft({ grab: 'almanac', six: 'book', ten: 'watch', root: 'fire', path: 'dust', sex: 'f' }));
check('study-origin', study.origin === 'shusheng' && study.flags.wrote);
check('study-speed', g.Core.gt(study, 'spd', 1) > 1.05, g.Core.gt(study, 'spd', 1));
check('study-wx', study.wx === 8, study.wx);
check('dust-fabao', study.fabao && study.fabao.stage === 0 && study.lifeBonus === -20, { fabao: study.fabao && study.fabao.name, life: study.lifeBonus });
check('dust-event', g.EVENTS.find(e => e.id === 'ming_sky').cond(study));
check('taixu-event', g.EVENTS.find(e => e.id === 'ming_taixu').cond(study));

const swift = begin(draft({ grab: 'sword', six: 'run', ten: 'watch', root: 'water', path: 'rogue', sex: 'm' }));
check('swift-time', g.Core.gt(swift, 'time', 1) < 1, g.Core.gt(swift, 'time', 1));
check('swift-event', g.EVENTS.find(e => e.id === 'ming_road').cond(swift));
check('cave-event', g.EVENTS.find(e => e.id === 'ming_cave').cond(swift));

const wei = begin(draft({
  sex: 'm', grab: 'almanac', six: 'run', ten: 'watch', root: 'fire', path: 'sect', org: 'qm',
  base: { lg: { id: 'wei', name: '伪灵根', mult: 0.55, bt: -0.05, sect: '散修', word: '废材' }, els: ['金', '木', '水', '火', '土'], wx: 5, luck: 1 },
}));
check('wei-org', wei.sect.org === 'sx' && wei.sect.rank === 0, { org: wei.sect.org, rank: wei.sect.rank });
check('wei-fire', wei.lgEls[0] === '火');

const goldA = g.Mingge.emptyDraft(11);
const goldB = g.Mingge.emptyDraft(11);
goldA.grab = 'air';
goldB.grab = 'air';
check('gold-stable', g.Mingge.resolveGold(goldA) === g.Mingge.resolveGold(goldB) && goldA.gold === goldB.gold);

swift.inj = 0;
swift.ming.tipo = 6;
swift.loop.ti = 0;
g.Core.applyFx(swift, { inj: 1 });
check('tipo-soak-one', swift.inj === 0, swift.inj);
g.Core.applyFx(swift, { inj: 3 });
check('tipo-soak-rest', swift.inj === 2, swift.inj);

const plain = g.Core.newState('旧', { lg: san(), els: ['金', '木', '水'], wx: 5, luck: 1, org: 'qm', origin: 'qingshi' }, null);
const span = plain.lifespan;
const wx0 = plain.wx;
delete plain.ming;
const migrated = g.Core.migrate(JSON.parse(JSON.stringify(plain)));
check('old-ming', migrated && migrated.ming && migrated.ming.on === 0, migrated && migrated.ming);
check('old-life', migrated && migrated.lifespan === span, migrated && migrated.lifespan);
check('old-wx', migrated && migrated.wx === wx0);
check('old-save', migrated && migrated.v === 16);
check('old-no-qian', !g.EVENTS.find(e => e.id === 'ming_qian').cond(migrated));

const shown = g.Juan.ORIGINS.filter(o => !o.prologue && !o.need).map(o => o.id);
check('origin-hidden', shown.indexOf('hanmen') < 0 && shown.indexOf('daotai') < 0 && g.Juan.ORIGINS.some(o => o.id === 'hanmen' && o.prologue));

const fox = g.EVENTS.find(e => e.id === 'echo_mingfox');
check('fox-not-yet', !fox.cond(male));
male.months = male.life.deeds.filter(d => d.id === 'mingfox')[0].due;
check('fox-due', fox.cond(male));
const gift = fox.choices(male)[0].act(male);
check('fox-gift', gift.fx && (gift.fx.item['古剑残片'] || gift.fx.item['聚气丹']), gift.fx);

const read = g.EVENTS.find(e => e.id === 'ming_read');
check('shen-payoff', read.cond(female));
const seen = read.choices(female)[0].act(female);
check('shen-xw', seen.fx.xw >= 0.14, seen.fx.xw);

const src = fs.readFileSync(path.join(ROOT, 'js', 'mingge.js'), 'utf8') + fs.readFileSync(path.join(ROOT, 'js', 'mingge_ui.js'), 'utf8');
check('no-optional', src.indexOf('?.') < 0 && src.indexOf('??') < 0);
check('save-v', g.Core && fs.readFileSync(path.join(ROOT, 'js', 'core.js'), 'utf8').indexOf('const SAVE_V = 16') >= 0);

if (fail.length) {
  console.error(fail.join('\n'));
  process.exit(1);
}
console.log('mingge ok', { leiOk, leiNo, events: g.EVENTS.filter(e => e.id && e.id.indexOf('ming') === 0).length });
