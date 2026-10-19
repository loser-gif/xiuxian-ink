#!/usr/bin/env node
/* 回归：江问心 · 丹霞内谷 · 木土双灵根，不得再抽到外门小比／杂灵根，斗法前要有对手。
   并核对重复功法可参悟或售出，旧档缺层数时作第一层，MX1 仍可往返。 */
'use strict';
const vm = require('vm'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const ctx = vm.createContext({ console, Math, JSON, Object, Array, Number, String, TextEncoder, TextDecoder, Uint8Array, Map, btoa, atob });
for (const f of ['data', 'gongfa', 'gear', 'path', 'story', 'sect', 'baijia', 'world', 'tianxia', 'karma', 'life', 'juan', 'core', 'jianghu', 'codec']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', f + '.js'), 'utf8'), ctx, { filename: f });
}
const G = vm.runInContext('({ Core, Codec, LINGGEN, EVENTS, GONGFA, GF_LAYERS })', ctx);
const { Core, Codec, LINGGEN, EVENTS } = G;
const fail = m => { console.error('FAIL', m); process.exitCode = 1; };
const lg = LINGGEN.find(l => l.id === 'shuang');
const s = Core.newState('江问心', { lg, els: ['木', '土'], wx: 7, luck: 2, org: 'dx', origin: 'qingshi' });
const header = `${Core.rankName(s)}·${s.lgEls.join('')}${s.lg.name}`;
if (header !== '内谷弟子·木土双灵根') fail('表头应为 内谷弟子·木土双灵根，实为 ' + header);
if (s.sect.rank !== 2) fail('双灵根入丹霞应为内谷 rank 2');
const ev = EVENTS.find(e => e.id === 'xiaobi');
const title = ev.title(s);
const text = ev.text(s);
const choices = ev.choices(s);
if (title === '外门小比' || String(title).includes('外门')) fail('内谷仍抽到外门小比：' + title);
if (title !== '内谷论丹') fail('内谷丹霞应是内谷论丹，实为 ' + title);
if (text.includes('杂灵根') || text.includes('杀灵根') || text.includes('外门三年')) fail('台词仍含杂灵根或外门小比：' + text);
if (!text.includes('木土双灵根')) fail('台词没有按本人灵根写：' + text);
if (!s.evFoe || !s.evFoeMeta) fail('斗法前没有对手');
const glance = Core.glance(s);
if (!glance || !glance.read) fail('没有气息判读');
const labels = choices.map(c => c.label);
if (!labels.includes('全力以赴') || !labels.includes('点到为止，借机观摩')) fail('选项变了：' + labels.join(' / '));
if (choices[0].odds == null) fail('全力以赴没有胜机提示');
console.log('小比', title, '|', Core.foeStr(s), glance.read, '|', text.slice(0, 42));

// 旧档：缺 lv 补成 1；已有层数保留
const old = JSON.parse(JSON.stringify(s));
delete old.gfs[s.gf].lv;
old.gfs.qingming = { xp: 3 };
const back = Core.migrate(old);
if (!back || back.gfs[s.gf].lv !== 1) fail('旧档缺层数应默认为 1');
if (back.gfs.qingming.lv !== 1) fail('只有 xp 的旧功法也应是第 1 层');
const kept = JSON.parse(JSON.stringify(s));
kept.gfs[s.gf].lv = 4;
const kept2 = Core.migrate(kept);
if (kept2.gfs[s.gf].lv !== 4) fail('已有层数不该被抹成 1');

// 重复功法
const id = s.gf;
const spd0 = Core.gfSpeed(s);
const fx = Core.applyFx(s, { gf: id });
if (fx.manual !== id) fail('重复功法没有交还选择');
if (!(s.items['卷:' + id] > 0)) fail('重复功法没有进行囊');
const offer = Core.manualOffer(s, id);
if (!offer || offer.cap || offer.next !== 2) fail('参悟预告不对');
const gain1 = offer.nextSpd - offer.spd;
const studied = Core.studyManual(s, id);
if (studied.err || s.gfs[id].lv !== 2) fail('参悟没有升到第二层');
if (!(Core.gfSpeed(s) > spd0)) fail('行功倍率没有提高');
Core.applyFx(s, { gf: id });
const offer2 = Core.manualOffer(s, id);
const gain2 = offer2.nextSpd - offer2.spd;
if (!(gain2 < gain1 - 1e-6)) fail('第二层之后增益没有变淡 ' + gain1 + ' → ' + gain2);
const ls0 = s.ls;
const sold = Core.sellManual(s, id);
if (sold.err || s.ls <= ls0) fail('售予坊市没有给灵石');
if (s.items['卷:' + id]) fail('卖掉之后行囊里还有卷');
s.gfs[id].lv = G.GF_LAYERS;
Core.applyFx(s, { gf: id });
const capped = Core.studyManual(s, id);
if (!capped.err) fail('大成之后仍能参悟');
if (!Core.sellManual(s, id).ls) fail('大成的卷应仍可售出');

// MX1 往返，前缀与键都不改
const code = Codec.encode(s);
if (!code.startsWith('MX1.')) fail('存档码前缀不是 MX1');
const dec = Codec.decode(code);
if (!dec.ok) fail('MX1 解不开：' + dec.err);
if (dec.data.name !== '江问心' || dec.data.gfs[id].lv !== G.GF_LAYERS) fail('解出来的层数不对');
const legacy = Codec.decode(code);
if (!legacy.ok || legacy.data.v !== 13) fail('旧格式解档失败');

// 试炼开局是固定预设：金丹初期、四十岁、灵石一百二十。日缘不会改境界。
const wei = LINGGEN.find(l => l.id === 'wei');
const trial = Core.newState('青石', { lg: wei, els: ['金', '木', '水', '火', '土'], wx: 4, luck: 1, org: 'sx', trial: 1, origin: 'qingshi' });
if (trial.realm !== 2 || trial.stage !== 0) fail('试炼境界应为金丹初期');
if (Math.floor(trial.months / 12) !== 40) fail('试炼年岁应为四十，实为 ' + Math.floor(trial.months / 12));
if (trial.ls !== 120 || trial.xw !== 0) fail('试炼灵石/修为不对 ' + trial.ls + '/' + trial.xw);
if ((trial.flags && trial.flags.trialYears) !== 20) fail('试炼应为二十载');
const idn = `${Core.rankName(trial)}·${trial.lg.name}`;
if (idn !== '行客·伪灵根') fail('散修盟伪灵根应是行客·伪灵根，实为 ' + idn);
if (trial.lifespan !== 380) fail('寿元应为 380，实为 ' + trial.lifespan);

if (!process.exitCode) console.log('回归通过', '行功', spd0.toFixed(2), '→', Core.gfSpeed(JSON.parse(JSON.stringify(kept2))).toFixed(2), '售价样例', offer.price, '试炼', idn, trial.lifespan);
