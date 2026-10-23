/* 墨仙录 · 因果：跨十年链、道侣／宿敌、拍卖／宗门／朝堂回响 */
'use strict';

function emptyKarma() { return { mate: null, foe: null, seeds: [] }; }

function karmaYears(s, y) {
  const T = (REALMS[s.realm] && REALMS[s.realm].T) || 1;
  return Math.round(12 * T * Math.max(1, y));
}
function karmaPlant(s, id, years, data) {
  if (!s.karma) s.karma = emptyKarma();
  if (s.flags && s.flags['karma_done_' + id]) return false;
  if ((s.karma.seeds || []).some(x => x.id === id)) return false;
  if (s.flags && s.flags['karma_gone_' + id]) delete s.flags['karma_gone_' + id];
  s.karma.seeds.push({ id, due: s.months + karmaYears(s, years == null ? 20 : years), data: data || {} });
  return true;
}
function karmaDue(s, id) {
  if (!s.karma || (s.flags && s.flags['karma_done_' + id])) return false;
  const k = (s.karma.seeds || []).find(x => x.id === id);
  return !!(k && s.months >= k.due);
}
function karmaTake(s, id) {
  s.flags = s.flags || {};
  s.flags['karma_done_' + id] = 1;
  if (s.karma) s.karma.seeds = (s.karma.seeds || []).filter(x => x.id !== id);
}
function karmaSeed(s, id) {
  return s.karma && (s.karma.seeds || []).find(x => x.id === id);
}
// 不再持相时，相裂无处可落。已面对过的仍算已了；没上门的标已消，并允许日后重新定相再种。
function settleXiang(s) {
  if (!s || (s.path && s.path.faxiang)) return false;
  const seeds = (s.karma && s.karma.seeds) || [];
  if (!seeds.some(x => x.id === 'xiang_fan')) return false;
  s.flags = s.flags || {};
  s.karma.seeds = seeds.filter(x => x.id !== 'xiang_fan');
  if (s.flags.karma_done_xiang_fan) return false;
  s.flags.karma_gone_xiang_fan = 1;
  return true;
}
function setMate(s, id, tags) {
  if (typeof People !== 'undefined' && !People.eligible(s, id)) return false;
  if (s.npc && s.npc[id] && s.npc[id].dead) return false;
  if (!s.karma) s.karma = emptyKarma();
  s.karma.mate = id;
  const nm = (NPCS[id] && NPCS[id].name) || id;
  tags && tags.push({ t: `道侣 · ${nm}`, c: 'gold' });
}
function setFoe(s, id, tags) {
  if (!s.karma) s.karma = emptyKarma();
  s.karma.foe = id;
  const nm = (NPCS[id] && NPCS[id].name) || id;
  tags && tags.push({ t: `宿敌 · ${nm}`, c: 'down' });
}
const KARMA_HINT = {
  su_vow: '有一夜，你梦见丹房的灯。灯下人影未散，像在等什么。因果将近。',
  lu_foe: '剑意忽然一颤。远方似有同辈剑鸣，锋芒指向你。',
  wen_foe: '折扇开合之声在耳边一闪而过。温庭玉的名字，又浮上心头。',
  hei_echo: '云岳坊的夜风里，又飘过一缕血煞气。旧怨未尽。',
  tu_return: '山门外有人唤师父。那声音，比记忆里粗了许多。',
  court_echo: '朝中有人抄录旧案，案卷上是你的名字。',
  court_grace: '京畿百姓唱起一支无名小调，调子里有你当年开仓的影子。',
  xiang_fan: '识海中法相忽然不稳，像一面镜子裂了纹。这不是回首，是相裂将至。',
  shen_lamp: '有个夜行人来借一盏灯，你想起沈无灯托付的那一程。',
};
const KARMA_NAME = {
  su_vow: '灯约', su_aid: '道侣之约', lu_foe: '同辈剑意', wen_foe: '折扇旧怨',
  hei_echo: '夜路血煞', tu_return: '弟子归来', court_echo: '朝案', court_grace: '开仓', xiang_fan: '相裂',
  shen_lamp: '传灯之约',
};
const DEED_HINT = {
  ahe: '崖边', shengu: '伤药', qingzhen: '镇疫', zhouwan: '茶债', fox: '伤狐',
  linzhao: '碎壶', beggar: '一口饭', qiuniang: '渡口', zhaoheng: '路费', aman: '猎户',
};
function karmaTraces(s, limit = 6) {
  if (!s) return [];
  const months = s.months | 0;
  const rows = [];
  const deeds = (s.life && s.life.deeds) || [];
  for (const d of deeds) {
    const st = d.done ? '已了' : (months >= (d.due | 0) ? '将至' : '伏笔');
    const from = d.from && typeof LOC !== 'undefined' && LOC[d.from] ? LOC[d.from].name : '旧日行路';
    const wait = d.done ? '旧事已了' : months >= d.due ? '已到重逢之时' : '约' + cnDur(d.due - months) + '后';
    rows.push({ st, name: d.who || '旧事', hint: DEED_HINT[d.id] || '回响', detail: `来自${from} · ${d.line || '旧事未忘'}。各地游历可重逢 · ${wait} · 无失效期限。` });
  }
  const seeds = (s.karma && s.karma.seeds) || [];
  const seen = {};
  for (const k of seeds) {
    seen[k.id] = 1;
    const personId = { su_vow: 'su', su_aid: s.karma && s.karma.mate, lu_foe: 'lu', wen_foe: 'wen' }[k.id];
    const lost = !!(personId && s.npc && s.npc[personId] && s.npc[personId].dead);
    const done = lost || (s.flags && s.flags['karma_done_' + k.id]);
    const st = done ? '已了' : (months >= (k.due | 0) ? '将至' : '伏笔');
    const ev = EVENTS.find(e => e.id === 'yg_' + k.id), locs = ev && typeof EV_LOC !== 'undefined' ? EV_LOC[ev.id] || [] : [];
    const where = locs.length ? locs.map(id => LOC[id] ? LOC[id].name : id).join('、') : '各地游历';
    const who = { su_vow: '苏晚晴', su_aid: '道侣', lu_foe: '陆沉舟', wen_foe: '温庭玉' }[k.id] || KARMA_NAME[k.id] || '旧日因果';
    let detail;
    if (lost) detail = `${who}已经不在，此约无法再赴。`;
    else if (k.id === 'xiang_fan') {
      const wait = done ? '已了' : months >= k.due ? '时机已到' : '约' + cnDur(k.due - months) + '后';
      detail = `定法相时种下的裂痕，与法相回首不是同一件事。去${where}等候相裂。${wait}。未裂之前洗去法相，这条将至会消。`;
    } else detail = `${who}留下的事 · 去${where}。${done ? '已了' : months >= k.due ? '时机已到' : '约' + cnDur(k.due - months) + '后'} · 无失效期限。`;
    rows.push({ st, name: KARMA_NAME[k.id] || '因果', hint: lost ? '故人已逝' : '因果', detail });
  }
  if (s.flags) {
    Object.keys(KARMA_NAME).forEach(id => {
      if (seen[id]) return;
      if (s.flags['karma_done_' + id]) {
        if (id === 'xiang_fan') rows.push({ st: '已了', name: '相裂', hint: '因果', detail: '你已面对识海中的裂痕：或洗去法相，或压下裂痕继续持相。法相回首不算这一笔。' });
        else rows.push({ st: '已了', name: KARMA_NAME[id], hint: '因果' });
        return;
      }
      if (s.flags['karma_gone_' + id]) {
        rows.push({
          st: '已消', name: KARMA_NAME[id], hint: '因果', pin: true,
          detail: id === 'xiang_fan' ? '法相已不在，裂痕无处可落。这条将至就此消了，不是法相回首了结的。' : '因由已不在，此因果自消。',
        });
      }
    });
  }
  const rank = { '将至': 0, '伏笔': 1, '已了': 2, '已消': 2 };
  rows.sort((a, b) => (rank[a.st] == null ? 9 : rank[a.st]) - (rank[b.st] == null ? 9 : rank[b.st]));
  const open = rows.filter(r => r.st !== '已了' && r.st !== '已消');
  const doneAll = rows.filter(r => r.st === '已了' || r.st === '已消');
  const pinned = doneAll.filter(r => r.pin);
  const done = pinned.concat(doneAll.filter(r => !r.pin)).slice(0, Math.max(2, pinned.length));
  if (s.bond && s.bond.promiseDue && s.karma && Core.npcAlive(s, s.karma.mate)) open.unshift({ st: '将至', name: NPCS[s.karma.mate].name + '的共修之约', hint: '人物页 · 共修', detail: '还余' + cnDur(Math.max(0, s.bond.promiseDue - months)) + '。期限内完成一季共修；失约会伤情谊。' });
  return limit ? open.concat(done).slice(0, limit) : open.concat(done);
}
function karmaTick(s, emit) {
  if (!s.karma || !(s.karma.seeds || []).length) return;
  for (const k of s.karma.seeds) {
    if (s.months < k.due) continue;
    if (s.flags['karma_hint_' + k.id]) continue;
    s.flags['karma_hint_' + k.id] = 1;
    const hint = KARMA_HINT[k.id];
    if (hint && emit) emit({ title: '因果', text: hint, cls: 'event', div: true });
  }
}

/* —— 回响事件 —— */
EVENTS.push(
  /* 道侣：结契 */
  { id: 'yg_su_vow', title: '灯约', seal: '侣', w: 8, once: true, rm: [1, 4],
    cond: s => karmaDue(s, 'su_vow') && met(s, 'su') && aff(s, 'su') >= 40 && !(s.karma && s.karma.mate),
    text: () => '苏晚晴站在桃花溪边，灯火映在水里。“许多年了，”她说，“我炼过的丹，一半是给你的。若你愿意……我们结一道侣契。不求飞升同路，只求有人记得彼此的名字。”',
    choices: s => [
      { label: '结契，结为道侣', act: s => {
        karmaTake(s, 'su_vow');
        const tags = []; setMate(s, 'su', tags);
        if (s.npc.su) s.npc.su.a = Math.min(100, s.npc.su.a + 20);
        karmaPlant(s, 'su_aid', 12);
        return { text: '你们在溪边立誓。没有宾客，只有桃瓣落在水面。此后洞府案上，常有两只杯。', tags, fx: { xj: 10, npc: { su: 10 } } };
      }},
      { label: '婉拒，愿为知己', act: s => {
        karmaTake(s, 'su_vow');
        return { text: '她听完，只是轻轻点头：“也好。知己，便是知己。”灯灭时，她的背影仍直。', fx: { xj: 2, npc: { su: -4 } } };
      }},
    ] },

  /* 道侣援手 */
  { id: 'yg_su_aid', title: '药香入劫', seal: '援', w: 7, once: true, rm: [2, 4],
    cond: s => (karmaDue(s, 'su_aid') || (s.karma && s.karma.mate === 'su' && s.flags.karma_done_su_vow && !s.flags.karma_done_su_aid && s.realm >= 2))
      && s.karma && s.karma.mate === 'su' && met(s, 'su'),
    text: () => '破境关口将至。苏晚晴送来一炉护心丹，又把袖中玉简塞给你：“若心魔起，念我的名字。我在山门外守着。”',
    choices: s => [
      { label: '受丹，请她护法', act: s => {
        karmaTake(s, 'su_aid');
        s.btBuff = (s.btBuff || 0) + 0.08;
        return { text: '药香入腹，心境定了半分。她在洞外坐下，像一棵不移的药树。', fx: { item: { '清心丹': 2 }, xj: 6, npc: { su: 6 } }, tags: [{ t: '破境把握暂增', c: 'up' }] };
      }},
      { label: '道谢，独自闭关', act: s => {
        karmaTake(s, 'su_aid');
        return { text: '她把丹留下，自己走了。走前说：“记得出来。”', fx: { item: { '清心丹': 1 }, npc: { su: 3 } } };
      }},
    ] },

  /* 宿敌 · 陆 */
  { id: 'yg_lu_foe', title: '旧剑', seal: '敌', w: 8, once: true, rm: [1, 4],
    cond: s => karmaDue(s, 'lu_foe') && met(s, 'lu'),
    text: s => { Core.showFoe(s, { rel: anyOf([0, 1]) }, { name: '陆沉舟', title: '旧剑' }); return `陆沉舟立在黑风岭顶，白衣已旧。“${s.karma && s.karma.foe === 'lu' ? '宿敌' : '同辈'}，”他拔剑，“今日把从前未完的一剑，补上。”他的气息约莫${Core.foeStr(s)}。`; },
    choices: s => [
      { label: '拔剑相迎', sub: '斗法', odds: s => 0.52 + (aff(s, 'lu') < 0 ? 0.04 : 0), act: s => {
        karmaTake(s, 'lu_foe');
        const tags = []; if (!(s.karma && s.karma.foe)) setFoe(s, 'lu', tags);
        return Core.fightAct(s, { name: '陆沉舟', base: 0.52 + (aff(s, 'lu') < 0 ? 0.04 : 0),
          win: { text: '两剑相交，岭上松针齐落。他收剑，竟笑了：“你赢了。下回，我再不留手。”', fx: { xw: 0.1, npc: { lu: 8 }, xj: 4 }, tags },
          lose: { text: s => `那${Core.foeStr(s)}的剑意压来，你退了九步，袖口裂开。他没有补刀：“养好伤。我等你。”`, fx: { inj: 2, npc: { lu: 4 }, xj: -2 }, tags } });
      }},
      { label: '收剑，言和', act: s => {
        karmaTake(s, 'lu_foe');
        if (s.karma && s.karma.foe === 'lu') s.karma.foe = null;
        return { text: '你把剑插入鞘。他沉默片刻，也收了剑。“……也好。”风过岭顶，像有人松了一口气。', fx: { npc: { lu: 12 }, xj: 6 } };
      }},
    ] },

  /* 宿敌 · 温 */
  { id: 'yg_wen_foe', title: '扇底', seal: '仇', w: 7, once: true, rm: [1, 4],
    cond: s => karmaDue(s, 'wen_foe') && met(s, 'wen'),
    text: () => '温庭玉在茶寮等你，扇骨已换了新的。“当年那一局，”他笑，“我输得不服。今日请你再入一局——不是棋，是命。”',
    choices: s => [
      { label: '揭穿他的新局', act: s => {
        karmaTake(s, 'wen_foe');
        const tags = []; setFoe(s, 'wen', tags);
        if (Math.random() < 0.55 + (s.luck || 0) * 0.03) {
          return { text: '你当场拆穿他设下的伪证。茶寮哗然。他收扇起身：“这仇，又深了一层。”', tags, fx: { gx: 12, npc: { wen: -15 }, xj: 4 } };
        }
        return { text: '他早有备手。你险些落进执事堂的簿子里，幸得有人替你说了一句。', tags, fx: { gx: -8, npc: { wen: -8 }, xj: -4 } };
      }},
      { label: '一笑饮尽这杯', act: s => {
        karmaTake(s, 'wen_foe');
        return { text: '你把他的茶喝了。苦得很。他说：“算了。仇人喝茶，也算一缘。”扇子合上，像一声叹息。', fx: { npc: { wen: 6 }, xj: 2 } };
      }},
    ] },

  /* 拍卖黑袍回响 */
  { id: 'yg_hei_echo', title: '血印再至', seal: '怨', w: 7, once: true, rm: [1, 4],
    cond: s => karmaDue(s, 'hei_echo') && s.flags.heiGrudge >= 2,
    text: s => { Core.showFoe(s, { rel: anyOf([0, 1, 1]) }, { name: '血印客', title: '旧巷' }); return `云岳坊外旧巷。那个额刺血雾印的人又来了，修为更沉，约莫${Core.foeStr(s)}。“上次走得急，”他哑声道，“这次，把旧账算清。”`; },
    choices: s => [
      { label: '了断', sub: '斗法', odds: 0.5, act: s => {
        karmaTake(s, 'hei_echo');
        return Core.fightAct(s, { name: '血印客', base: 0.5,
          win: { text: '你胜了。他跪地吐出一枚染血令牌：“谷主……不认弃子。”你收下令牌，夜色忽然干净了。', fx: { ls: 40, item: { '血菩提': 1 }, xj: 3 } },
          lose: { text: s => `那${Core.foeStr(s)}的血煞掌再至，你护住命门，却失了半袋灵石。`, fx: { inj: 2, ls: -30, xj: -3 } } });
      }},
      { label: '丢下灵石，换路', act: s => {
        karmaTake(s, 'hei_echo');
        const cost = Math.max(20, Math.floor(s.ls * 0.1));
        return { text: '你扔下储物袋，转身入市。他没有追。因果未消，只是今夜还活着。', fx: { ls: -cost, lsRaw: true, xj: -2 } };
      }},
    ] },

  /* 弟子归来 */
  { id: 'yg_tu_return', title: '徒归', seal: '徒', w: 7, once: true, rm: [2, 4],
    cond: s => karmaDue(s, 'tu_return') && s.flags.disciple,
    text: () => '山门石阶上，站着一个青年。腰间有你当年教的结绳法。他跪下：“师父，徒儿回来了。外面十年，没有辱没您的名字。”',
    choices: s => [
      { label: '扶起，问他所见', act: s => {
        karmaTake(s, 'tu_return');
        return { text: '他讲了江湖，也讲了想你的时候。临走留下一袋他炼的粗丹，和一句：“下回破境，徒儿给您护法。”', fx: { item: { '聚气丹': 3 }, xj: 8, luck: 1 }, tags: [{ t: '破境把握暂增', c: 'up' }] };
      }},
      { label: '点头，赠他一式', act: s => {
        karmaTake(s, 'tu_return');
        s.btBuff = (s.btBuff || 0) + 0.03;
        return { text: '你把一式心得写入他掌心。他哭了，又笑了。下山时，背影已是独当一面的修士。', fx: { xj: 6, wx: Math.random() < 0.2 ? 1 : 0 } };
      }},
    ] },

  /* 朝堂回响 · 威压 */
  { id: 'yg_court_echo', title: '旧案重提', seal: '案', w: 6, once: true, rm: [2, 4],
    cond: s => karmaDue(s, 'court_echo') && s.court && s.court.rank >= 3,
    text: () => '御史台呈上一卷旧档：你昔年以修士威压督运的折子。清议再起，有人要你给个说法。',
    choices: s => [
      { label: '承认，请罪补过', act: s => {
        karmaTake(s, 'court_echo');
        const tags = []; if (typeof courtAdd === 'function') courtAdd(s, { dao: 8, bing: -4, min: 4 }, tags);
        return { text: '你在殿上把那日说清。有人骂，有人叹。道统回暖一分，兵权却松了。', tags, fx: { xj: 4 } };
      }},
      { label: '以权压言', act: s => {
        karmaTake(s, 'court_echo');
        const tags = []; if (typeof courtAdd === 'function') courtAdd(s, { dao: -10, bing: 6, min: -6 }, tags);
        return { text: '卷宗被收回。朝堂安静了。你知道，安静会在史书里变成另一种声音。', tags, fx: { xj: -5 } };
      }},
    ] },

  /* 朝堂回响 · 赈灾恩 */
  { id: 'yg_court_grace', title: '青天谣', seal: '谣', w: 5, once: true, rm: [1, 4],
    cond: s => karmaDue(s, 'court_grace') && s.court && s.court.rank >= 2,
    text: () => '你路过京畿村落，孩童唱着“青天开仓”。老人认出你，塞给你一袋粗粮：“那年若不活，哪有今日。”',
    choices: s => [
      { label: '收下，问民生', act: s => {
        karmaTake(s, 'court_grace');
        const tags = []; if (typeof courtAdd === 'function') courtAdd(s, { min: 10, dao: 4 }, tags);
        return { text: '粗粮入口，是人间的味道。民心又厚了一寸。', tags, fx: { xj: 6 } };
      }},
      { label: '婉谢，留粮与村', act: s => {
        karmaTake(s, 'court_grace');
        const tags = []; if (typeof courtAdd === 'function') courtAdd(s, { min: 6, dao: 6 }, tags);
        return { text: '你把袋子还回村里。老人哭了。你走在官道上，觉得官袍轻了一些。', tags, fx: { xj: 8 } };
      }},
    ] },

  /* 法相反噬 → 洗相契机 */
  { id: 'yg_xiang_fan', title: '相裂', seal: '相', w: 6, once: true, rm: [3, 4],
    cond: s => karmaDue(s, 'xiang_fan') && s.path && s.path.faxiang,
    text: s => {
      const n = (typeof FAXIANG !== 'undefined' && FAXIANG[s.path.faxiang]) ? FAXIANG[s.path.faxiang].name : '法相';
      return `识海中，「${n}」忽裂一道细纹。有人说是天道挑剔，有人说是你心有悔。旁门有洗相秘法，代价极重——却比强行震散稍轻。`;
    },
    choices: s => [
      { label: '受秘法，洗去法相', sub: '半价洗相', act: s => {
        karmaTake(s, 'xiang_fan');
        s.flags.xiang_wash_half = 1;
        if (typeof Core !== 'undefined' && Core.washPath) {
          const r = Core.washPath(s, 'faxiang', null);
          if (r.err) return { text: `你想洗相，却未能如愿：${r.err}`, fx: {} };
          return { text: '秘法落掌，法相如墨遇水，淡开。识海空明，痛，却干净。' + r.text, tags: r.tags, fx: {} };
        }
        return { text: '秘法未成。', fx: {} };
      }},
      { label: '压下裂痕，继续持相', act: s => {
        karmaTake(s, 'xiang_fan');
        return { text: '你以心血补纹。法相仍在，只是偶尔在夜里轻颤一声。', fx: { xj: -4, inj: 1 } };
      }},
    ] },

  /* 种植：道侣机缘（高情谊） */
  { id: 'yg_su_seed', title: '未言', seal: '缘', w: 6, once: true, rm: [1, 3],
    cond: s => met(s, 'su') && aff(s, 'su') >= 55 && !karmaSeed(s, 'su_vow') && !s.flags.karma_done_su_vow && !(s.karma && s.karma.mate),
    text: () => '丹房廊下，苏晚晴欲言又止。风把药香吹到你这边。“再过些年，”她忽然说，“若我们都还在……你愿不愿听我一句话？”',
    choices: s => [
      { label: '“愿听。”', act: s => {
        const tags = []; karmaPlant(s, 'su_vow', 18); tags.push({ t: '因果已种 · 道侣', c: 'gold' });
        return { text: '她笑了，像放下一块心石。“那就……再过些年。”桃花瓣落在她肩上，你没有替她拂去。', tags, fx: { npc: { su: 6 }, xj: 4 } };
      }},
      { label: '沉默', act: () => ({ text: '她等了一息，自己把话咽回去：“当我没说。”廊下风大，药香淡了。', fx: { npc: { su: -2 } } }) },
    ] },

  /* 种植：陆沉舟宿敌／剑缘 */
  { id: 'yg_lu_seed', title: '剑债', seal: '债', w: 6, once: true, rm: [1, 3],
    cond: s => met(s, 'lu') && (aff(s, 'lu') <= -15 || aff(s, 'lu') >= 45) && !karmaSeed(s, 'lu_foe') && !s.flags.karma_done_lu_foe,
    text: s => aff(s, 'lu') <= -15
      ? '陆沉舟在演武场尽头停住：“总有一日，我会赢你。记住这口气。”'
      : '陆沉舟递过一柄木剑：“同辈之中，只你配做我的对手。他日岭上见。”',
    choices: s => [
      { label: '应下这道剑债', act: s => {
        const tags = []; karmaPlant(s, 'lu_foe', 22);
        if (aff(s, 'lu') <= -15) setFoe(s, 'lu', tags);
        tags.push({ t: '因果已种 · 剑债', c: 'gold' });
        return { text: '木剑相交一声。因果落子，要等十年后才知谁先笑。', tags, fx: { npc: { lu: aff(s, 'lu') <= -15 ? -4 : 6 } } };
      }},
      { label: '不接', act: () => ({ text: '他收剑，眼神冷了一瞬，又恢复平静：“随你。”', fx: { npc: { lu: -3 } } }) },
    ] },
);

/* 地点挂载 */
function karmaLoc(id, locs) {
  for (const l of locs) {
    LOC_EV[l] = LOC_EV[l] || [];
    if (!LOC_EV[l].includes(id)) LOC_EV[l].push(id);
  }
  EV_LOC[id] = locs.slice();
}
karmaLoc('yg_su_vow', ['taohua', 'shanmen', 'qingshi']);
karmaLoc('yg_su_aid', ['shanmen', 'taohua', 'gufu']);
karmaLoc('yg_lu_foe', ['heifeng', 'shanmen', 'yunyue']);
karmaLoc('yg_wen_foe', ['shanmen', 'yunyue', 'qingshi']);
karmaLoc('yg_hei_echo', ['yunyue', 'heifeng']);
karmaLoc('yg_tu_return', ['shanmen', 'qingshi']);
karmaLoc('yg_court_echo', ['jingcheng', 'yunyue']);
karmaLoc('yg_court_grace', ['jingcheng', 'qingshi']);
karmaLoc('yg_xiang_fan', ['yunhai', 'gufu', 'shanmen']);
karmaLoc('yg_su_seed', ['shanmen', 'taohua']);
karmaLoc('yg_lu_seed', ['shanmen', 'heifeng']);
