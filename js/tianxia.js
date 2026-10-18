/* 墨仙录 · 天下：大黎仕途（科举／举荐→官阶→宰辅→人皇／权臣） */
'use strict';

const COURT_RANKS = [
  { id: 0, name: '白身', seal: '白' },
  { id: 1, name: '秀才', seal: '秀' },
  { id: 2, name: '举人', seal: '举' },
  { id: 3, name: '进士', seal: '进' },
  { id: 4, name: '京官', seal: '官' },
  { id: 5, name: '部堂', seal: '部' },
  { id: 6, name: '宰辅', seal: '辅' },
];

function emptyCourt() {
  return { rank: -1, entry: null, bing: 0, min: 40, dao: 55, examAt: 0, n: 0, txAt: 0 };
}
function courtRankName(s) {
  if (!s.court || s.court.rank < 0) return '';
  return COURT_RANKS[Math.min(s.court.rank, COURT_RANKS.length - 1)].name;
}
function courtClamp(s) {
  if (!s.court) return;
  s.court.bing = Math.max(0, Math.min(100, s.court.bing | 0));
  s.court.min = Math.max(0, Math.min(100, s.court.min | 0));
  s.court.dao = Math.max(0, Math.min(100, s.court.dao | 0));
}
function courtAdd(s, o, tags) {
  if (!s.court) s.court = emptyCourt();
  const map = { bing: '兵权', min: '民心', dao: '道统' };
  for (const k of ['bing', 'min', 'dao']) {
    if (o[k] == null) continue;
    const b = s.court[k]; s.court[k] += o[k]; courtClamp(s);
    const d = s.court[k] - b;
    if (d && tags) tags.push({ t: `${map[k]} ${d > 0 ? '+' : '−'}${Math.abs(d)}`, c: d > 0 ? 'up' : 'down' });
  }
}
function courtPromote(s, to, tags, emit) {
  if (!s.court) s.court = emptyCourt();
  if (to <= s.court.rank) return false;
  s.court.rank = to;
  const name = courtRankName(s);
  tags && tags.push({ t: `官阶 · ${name}`, c: 'gold' });
  if (emit) emit({ title: '朝堂', text: `吏部行文至此：你已实授「${name}」。金殿之外，又是一场人间风雨。`, tags, cls: 'gold', div: true });
  return true;
}
function courtFriction(s) {
  /* 修士入仕：官阶越高，闭关略滞；道统低则心境易摇 */
  if (!s.court || s.court.rank < 3) return { time: 1, xinmo: 1, spd: 1 };
  const r = s.court.rank;
  return {
    time: 1 + 0.03 * (r - 2),
    spd: 1 - 0.015 * (r - 2),
    xinmo: s.court.dao < 35 ? 1.15 : s.court.dao < 50 ? 1.06 : 1,
  };
}
function canClaimThrone(s) {
  return s.court && s.court.rank >= 6 && s.court.bing >= 70 && s.court.min >= 60 && s.court.dao >= 55;
}
function canRegent(s) {
  return s.court && s.court.rank >= 6 && s.court.bing >= 65 && s.court.min >= 40;
}

/* —— 京城事件 —— */
EVENTS.push(
  { id: 'jc_gate', title: '城门验身', seal: '京', w: 8, once: true, rm: [1, 4],
    cond: s => s.loc === 'jingcheng' && (!s.court || s.court.rank < 0) && !s.flags.jc_gate,
    text: () => '大黎京城，城门如阙。守门校尉横戟而立：「修士入京，须验腰牌、登名册。你是来赶考的，还是来……寻别的机缘？」',
    choices: s => [
      { label: '登名入册，以备科考', sub: '开启仕途', act: s => {
        s.court = emptyCourt(); s.court.rank = 0; s.flags.jc_gate = 1;
        return { text: '你在名册上落了笔。墨迹未干，校尉哼了一声：「白身也敢入京。去吧，贡院在东市。」', fx: { flag: 'jc_gate' }, tags: [{ t: '白身入籍', c: 'gold' }] };
      }},
      { label: '只游历，不入仕籍', act: () => ({ text: '你拱手：「山野散人，一观帝京而已。」校尉收戟放行。名册上，没有你的名字。', fx: { flag: 'jc_gate', xj: 2 } }) },
      ...(s.sect && s.sect.org && s.sect.rank >= 2 ? [{ label: '出示宗门腰牌，请人举荐', sub: '举荐入仕', act: s => {
        s.court = emptyCourt(); s.court.rank = 2; s.court.entry = 'jianju'; s.flags.jc_gate = 1;
        courtAdd(s, { dao: -4, min: 2 });
        return { text: `你亮出${ORGS[s.sect.org].name}腰牌。礼部一纸举荐，你越过童生，直挂「举人」虚衔——朝中有人说：修士入朝，终非正途。`, fx: { flag: 'jc_gate' }, tags: [{ t: '举人 · 举荐', c: 'gold' }, { t: '道统 −4', c: 'down' }] };
      }}] : []),
    ] },

  { id: 'jc_keju', title: '贡院开科', seal: '科', w: 10, rm: [1, 4],
    cond: s => s.loc === 'jingcheng' && s.court && s.court.rank >= 0 && s.court.rank < 3 && s.months >= (s.court.examAt || 0),
    text: s => `贡院号炮响了。今科取士，天下念书人挤破头。你以「${courtRankName(s) || '白身'}」入场——帘外有人低语：「听说还有修士来考。」`,
    choices: s => [
      { label: '正经答卷', sub: '凭悟性', act: s => {
        s.court.examAt = s.months + 12 * REALMS[s.realm].T * 4;
        s.court.n++;
        const score = (s.wx - 3) * 0.12 + (s.luck || 0) * 0.04 + s.realm * 0.08 + Math.random() * 0.35;
        const tags = [];
        if (score > 0.85 && s.court.rank < 3) { courtPromote(s, 3, tags); courtAdd(s, { min: 6, dao: 4 }, tags); return { text: '三场下来，主考拍案：「此卷，可点进士。」金殿传胪那日，你第一次看见天子的轮廓。', tags }; }
        if (score > 0.55 && s.court.rank < 2) { courtPromote(s, Math.max(s.court.rank, 2), tags); courtAdd(s, { min: 3 }, tags); return { text: '榜上有你的名字——举人。同乡摆酒，有人敬你，有人酸你。', tags }; }
        if (score > 0.32 && s.court.rank < 1) { courtPromote(s, 1, tags); return { text: '秀才而已。礼部小吏甩给你一块木牌：「回去再读。」', tags }; }
        courtAdd(s, { min: -2 }, tags); return { text: '名落孙山。你走出贡院，听见有人笑：「修士也会落第？」', tags, fx: { xj: -3 } };
      }},
      { label: '以神识窥卷，暗改一二', sub: '险 · 伤道统', act: s => {
        s.court.examAt = s.months + 12 * REALMS[s.realm].T * 4;
        const tags = []; courtAdd(s, { dao: -12, min: 2 }, tags);
        if (Math.random() < 0.7) { courtPromote(s, Math.min(3, Math.max(s.court.rank + 1, 2)), tags); return { text: '你改了两处破绽。榜上有名。可夜半时，你总觉得朱笔在暗处多蘸了一点。', tags, fx: { xj: -4 } }; }
        return { text: '监考御史忽然抬头。你收神不及，只得装病出场。东窗未发，道心已污。', tags, fx: { xj: -6 } };
      }},
      { label: '不考了，离场', act: s => { s.court.examAt = s.months + 12 * REALMS[s.realm].T * 2; return { text: '你把卷子一推，出了贡院。有人追问，你只说：「道不同。」', fx: { xj: 2 } }; } },
    ] },

  { id: 'jc_office', title: '部里当差', seal: '差', w: 9, rm: [1, 4],
    cond: s => s.loc === 'jingcheng' && s.court && s.court.rank >= 3 && s.court.rank < 6,
    text: s => `你在部中当差，案牍如山。同列觑你腰间修士气机，有人巴结，有人疏远。眼前一桩：边关缺饷，户部扯皮。`,
    choices: s => [
      { label: '据理力争，拨饷救边', sub: '民心↑ 兵权微↑', act: s => {
        const tags = []; courtAdd(s, { min: 8, bing: 4, dao: 2 }, tags);
        if (s.court.rank < 5 && Math.random() < 0.35 + s.court.min * 0.004) courtPromote(s, s.court.rank + 1, tags);
        return { text: '你把卷宗摔在堂上。半月后，边关来报：饷到了。有老卒托人带酒谢你。', tags, fx: { time: REALMS[s.realm].T * 2 } };
      }},
      { label: '领兵督运，以修士威压', sub: '兵权↑ 道统↓', act: s => {
        const tags = []; courtAdd(s, { bing: 10, dao: -8, min: 3 }, tags);
        if (s.court.rank < 5 && Math.random() < 0.4) courtPromote(s, s.court.rank + 1, tags);
        return { text: '你催动灵压，运粮官跪了一地。饷是送到了，朝中也多了句闲话：「修士胁政。」', tags, fx: { time: REALMS[s.realm].T, karma: { id: 'court_echo', years: 22 } } };
      }},
      { label: '装聋作哑，但求无过', act: s => {
        const tags = []; courtAdd(s, { min: -4, dao: 1 }, tags);
        return { text: '你把文书压在案底。边关的折子黄了，你的官帽还在。夜里你睡不着。', tags, fx: { xj: -3 } };
      }},
    ] },

  { id: 'jc_bing', title: '点兵校场', seal: '兵', w: 7, rm: [2, 4],
    cond: s => s.loc === 'jingcheng' && s.court && s.court.rank >= 4,
    text: () => '校场鼓响。兵部请你观阵——有人想借你的名声压一压骄兵，有人想看修士会不会打仗。',
    choices: s => [
      { label: '陈兵说阵，以理服人', act: s => {
        const tags = []; courtAdd(s, { bing: 6, dao: 3, min: 2 }, tags);
        return { text: '你不显神通，只把阵图画在沙盘上。老将捋须：「倒像读过兵书。」', tags };
      }},
      { label: '一剑断旗，立威', sub: '兵权大增 · 伤道统', act: s => {
        const tags = []; courtAdd(s, { bing: 14, dao: -10, min: -2 }, tags);
        return { text: '剑光起处，校旗寸断。校场寂静。有人跪下，有人握刀。你知道，从这一刻起，有人怕你，有人恨你。', tags, fx: { xj: -2 } };
      }},
      { label: '婉拒，不涉兵事', act: s => {
        const tags = []; courtAdd(s, { bing: -2, dao: 4 }, tags);
        return { text: '你拱手离场。兵部尚书目送你：「清高——也好。」', tags };
      }},
    ] },

  { id: 'jc_min', title: '开仓赈灾', seal: '赈', w: 7, rm: [1, 4],
    cond: s => s.loc === 'jingcheng' && s.court && s.court.rank >= 2,
    text: () => '畿辅大旱。城外流民如蚁，御史请开仓。户部说无粮，太监说无银，皇帝说——「让他们议。」',
    choices: s => [
      { label: '私动修士储粮赈济', sub: '民心↑↑ 或触宗门', act: s => {
        const tags = []; courtAdd(s, { min: 12, dao: 2, bing: -2 }, tags);
        if (s.sect && s.sect.org && s.sect.gx > 20) { s.sect.gx -= 15; tags.push({ t: '贡献 −15', c: 'down' }); }
        return { text: '你运来灵谷，化作凡粮。百姓喊青天。宗门来信却只二字：「慎之。」', tags, fx: { time: REALMS[s.realm].T, xj: 4, karma: { id: 'court_grace', years: 18 } } };
      }},
      { label: '上疏死谏，请皇开仓', act: s => {
        const tags = [];
        if (Math.random() < 0.55 + (s.luck || 0) * 0.03) { courtAdd(s, { min: 8, dao: 5 }, tags); if (s.court.rank < 5) courtPromote(s, s.court.rank + 1, tags); return { text: '你把乌纱摘了搁在殿上。三日后，仓开了。有人说你傻，有人说你像个人。', tags }; }
        courtAdd(s, { min: 3, dao: 2 }, tags); return { text: '你被罚俸三月。仓终于还是开了——不是因你，是因另一道折子。你仍不后悔。', tags, fx: { xj: 3 } };
      }},
      { label: '袖手', act: s => { const tags = []; courtAdd(s, { min: -10, dao: -3 }, tags); return { text: '你没有出声。后来路过城门，看见饿殍，你把脸转向了别处。', tags, fx: { xj: -8 } }; } },
    ] },

  { id: 'jc_zaifu', title: '入阁', seal: '阁', w: 6, once: true, rm: [2, 4],
    cond: s => s.loc === 'jingcheng' && s.court && s.court.rank === 5 && s.court.bing + s.court.min + s.court.dao >= 140 && !s.flags.jc_zaifu,
    text: () => '午夜，中书省来人。天子病重，储君年幼，要你入阁——宰辅之位，悬在你眼前。',
    choices: s => [
      { label: '入阁为宰辅', act: s => {
        s.flags.jc_zaifu = 1; const tags = []; courtPromote(s, 6, tags); courtAdd(s, { bing: 5, dao: 3 }, tags);
        return { text: '金印入手，重得像一座山。你站在文华殿外，忽然想起山门的云海——那里没有奏折，只有松涛。', tags, fx: { flag: 'jc_zaifu' } };
      }},
      { label: '固辞，愿守部堂', act: s => {
        s.flags.jc_zaifu = 1; const tags = []; courtAdd(s, { dao: 8, min: 4, bing: -4 }, tags);
        return { text: '你跪辞三次。天子叹了口气。朝中有人松了口气，也有人摸了摸刀柄。', tags, fx: { flag: 'jc_zaifu', xj: 5 } };
      }},
    ] },

  { id: 'jc_throne', title: '鼎鼐之间', seal: '鼎', w: 5, once: true, rm: [3, 4],
    cond: s => s.loc === 'jingcheng' && s.court && s.court.rank >= 6 && !s.flags.jc_throne && (canClaimThrone(s) || canRegent(s)),
    text: s => `龙椅空着。储君啼哭，宗室环伺，边军在外。你手握兵符，民心可用，道统——${s.court.dao >= 55 ? '尚能压得住清议' : '已摇'}。今夜，你必须选一条路。`,
    choices: s => [
      ...(canClaimThrone(s) ? [{ label: '称帝，建元「人皇」', sub: '人皇结局', act: s => {
        s.flags.jc_throne = 1; s.dead = true; s.ending = 'renhuang';
        return { text: '你坐上了那把椅子。冕旒落下的一瞬，你听见天边似有剑鸣——是嘲讽，还是祝贺，再也无人说得清。大黎换了姓，史书开了新页：人皇纪元。', fx: { flag: 'jc_throne', end: 'renhuang' } };
      }}] : []),
      ...(canRegent(s) ? [{ label: '摄政，不篡位号', sub: '权臣结局', act: s => {
        s.flags.jc_throne = 1; s.dead = true; s.ending = 'quancheng';
        return { text: '你把储君抱上座，自己坐在侧殿。诏令出你手，军权归你心。天下人只知有摄政，不知有天子——你要的，从来不是那顶冕，是让山河按你的脉搏跳。', fx: { flag: 'jc_throne', end: 'quancheng' } };
      }}] : []),
      { label: '扶幼主，退居幕后', sub: '继续修行', act: s => {
        s.flags.jc_throne = 1; const tags = []; courtAdd(s, { dao: 10, bing: -8, min: 6 }, tags);
        return { text: '你把兵符交还给兵部，把印绶放回中书。出宫那夜，雪很大。你觉得自己又重新是个修士了。', tags, fx: { flag: 'jc_throne', xj: 10 } };
      }},
    ] },

  /* 摩擦：宗门 vs 朝堂 */
  { id: 'tx_sect', title: '山门来信', seal: '信', w: 6, rm: [1, 4],
    cond: s => s.sect && s.sect.org && s.court && s.court.rank >= 3 && s.months >= (s.court.txAt || 0),
    text: s => `${ORGS[s.sect.org].name}来信，字迹冷淡：「闻你在朝中日深。修士入仕，古来少有善终。速归，或——自便。」`,
    choices: s => [
      { label: '回山述职，暂离朝堂', sub: '耗时 · 官阶不升', act: s => {
        s.court.txAt = s.months + 12 * REALMS[s.realm].T * 6; const tags = []; courtAdd(s, { dao: 6, bing: -3 }, tags);
        if (s.sect.gx != null) { s.sect.gx += 20; tags.push({ t: '贡献 +20', c: 'up' }); }
        return { text: '你告假回山。师父／长老看了你一眼，没问朝中事，只问你的剑／炉／阵还在不在。', tags, fx: { time: 12 * REALMS[s.realm].T, xj: 4 } };
      }},
      { label: '回信：道在人间', act: s => {
        s.court.txAt = s.months + 12 * REALMS[s.realm].T * 6; const tags = []; courtAdd(s, { dao: -5, min: 3 }, tags);
        if (s.sect.gx > 10) { s.sect.gx -= 25; tags.push({ t: '贡献 −25', c: 'down' }); }
        return { text: '你回信只有一句：「道不远人。」此后山门的信少了，朝中的折子多了。', tags, fx: { xj: -2 } };
      }},
      { label: '叛宗，专一心向朝', sub: '若有门可叛', act: s => {
        s.court.txAt = s.months + 12 * REALMS[s.realm].T * 8;
        if (typeof Core !== 'undefined' && Core.defect) {
          const r = Core.defect(s);
          if (r.err) return { text: `你想叛宗，却未能如愿：${r.err}` };
          courtAdd(s, { bing: 4, dao: -6 }, r.tags || []);
          return { text: r.text + '朝中闻讯，有人弹冠，有人侧目。', tags: r.tags };
        }
        return { text: '你把腰牌寄了回去。' };
      }},
    ] },

  { id: 'tx_dao', title: '清议汹汹', seal: '议', w: 5, rm: [2, 4],
    cond: s => s.court && s.court.rank >= 4 && s.court.dao < 40,
    text: () => '太学诸生联名上书，斥你「以仙道乱王道」。街巷里开始有童谣，唱的是你的名字，调子不好听。',
    choices: s => [
      { label: '公开辩道', act: s => {
        const tags = [];
        if (Math.random() < 0.5 + s.wx * 0.03) { courtAdd(s, { dao: 10, min: 4 }, tags); return { text: '你在国子监讲了一日。散场时，有人撕了联名书。道统回暖一分。', tags, fx: { xj: 3 } }; }
        courtAdd(s, { dao: -4, min: -4 }, tags); return { text: '你辩才不利。砖头砸在官轿上，你第一次知道，民心也可以变成石头。', tags, fx: { inj: 1 } };
      }},
      { label: '以权压议', sub: '伤道统', act: s => {
        const tags = []; courtAdd(s, { dao: -8, bing: 5, min: -6 }, tags);
        return { text: '缇骑连夜收了带头的生员。朝堂安静了。你知道，安静有时比吵闹更可怕。', tags, fx: { xj: -5 } };
      }},
      { label: '上疏请罪，自请削职', act: s => {
        const tags = []; courtAdd(s, { dao: 8, bing: -5, min: 5 }, tags);
        if (s.court.rank > 3) { s.court.rank--; tags.push({ t: `降为${courtRankName(s)}`, c: 'down' }); }
        return { text: '你把官帽摘了。天子慰留，终究降了一级。清议稍歇，你反倒睡得稳了。', tags };
      }},
    ] },
);

LOC_EV.jingcheng = LOC_EV.jingcheng || [];
['jc_gate', 'jc_keju', 'jc_office', 'jc_bing', 'jc_min', 'jc_zaifu', 'jc_throne'].forEach(id => {
  if (!LOC_EV.jingcheng.includes(id)) LOC_EV.jingcheng.push(id);
  EV_LOC[id] = EV_LOC[id] || [];
  if (!EV_LOC[id].includes('jingcheng')) EV_LOC[id].push('jingcheng');
});
/* 摩擦事件随游历可遇 */
['tx_sect', 'tx_dao'].forEach(id => {
  ['jingcheng', 'yunyue', 'shanmen', 'qingshi'].forEach(l => {
    LOC_EV[l] = LOC_EV[l] || [];
    if (!LOC_EV[l].includes(id)) LOC_EV[l].push(id);
  });
  EV_LOC[id] = ['jingcheng', 'yunyue', 'shanmen', 'qingshi'];
});
