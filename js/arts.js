/* 功法入事：沿用奇遇、差事、秘境与藏经阁，不另设进度页。 */
'use strict';
const Arts = (() => {
  const libraries = { qm: ['zhefeng', 'tiejian'], dx: ['yicun', 'zhuhuo'], yy: ['yezhi', 'langtao', 'zhaoying'], xj: ['bamen', 'shiqu', 'shouque'], sx: ['songyan'] };
  Object.keys(libraries).forEach(org => libraries[org].forEach(id => LIB_POOL_ORG[org].push(id)));
  const friendly = (s, ids) => ids.some(id => Core.npcAlive(s, id) && s.npc[id].a >= 35);
  const routes = [
    ['tingsong', 'taohua', 1, () => true], ['tingfeng', 'taohua', 1, () => true],
    ['shixin', 'heifeng', 2, () => true], ['duanwen', 'xuewu', 2, s => !!s.flags.zhenAltar],
    ['yicun', 'shanmen', 1, s => friendly(s, ['su'])], ['bailian', 'shanmen', 1, s => friendly(s, ['shi', 'dx_tong'])],
    ['yangbing', 'shanmen', 1, s => friendly(s, ['xj_qi'])],
    ['buken', '', 2, s => s.loop && s.loop.mo >= 2],
    ['shanmenjiuli', 'jingcheng', 1, () => true], ['heqing', 'jingcheng', 1, s => s.court && s.court.rank >= 5],
    ['yuci', 'jingcheng', 1, () => true],
    ['gengjinwendao', 'yunhai', 4, () => true],
    ['guixu', 'beihai', 3, () => true], ['nanming', 'xuewu', 3, () => true], ['sheji', 'yunhai', 4, () => true],
  ];
  routes.forEach(([id, loc, rm, cond]) => {
    const g = GONGFA[id];
    const ev = { id: 'arts_' + id, title: g.name, seal: '卷', w: g.grade === 3 ? 2 : 4, once: true, rm: [rm, 4],
      cond: s => !s.gfs[id] && (!loc || s.loc === loc) && cond(s),
      text: () => g.src + '。' + g.desc + '这卷文字可以带走，也可以留在原处。',
      choices: s => [{ label: '读过，带走此卷', sub: cnDur(Core.timeMonths(s, 1)), act: () => ({ text: '你把字句记进心里，合上《' + g.name + '》。' + (id === 'buken' ? '它不与天魔同修。学会，不等于此刻便要用它。' : ''), fx: { gf: id, time: 1 } }) },
        { label: '留给后来的人', act: () => ({ text: '你把卷页压好。风再来时，没有带走一个字。', fx: {}, tags: [{ t: '此卷留后人' }] }) }] };
    EVENTS.push(ev);
    if (loc) { EV_LOC[ev.id] = [loc]; if (LOC_EV[loc]) LOC_EV[loc].push(ev.id); }
  });
  const copyChoice = (c, label, text, alter) => Object.assign({}, c, { label, act: s => {
    const r = c.act(s); const result = Object.assign({}, r, { text: text + (typeof r.text === 'function' ? r.text(s) : r.text || '') });
    if (alter) alter(result, s);
    return result;
  } });
  function dress(list, ev, s) {
    const out = list.slice(), id = ev.id || '', main = s.gf;
    if (!main || !s.gfs[main] || s.gfs[main].broken) return out;
    if (main === 'yicun' && /^(m_caiyao|m_danfang|m_dx_caiyao|m_dx_shouhuo)$/.test(id) && out[0])
      out.push(copyChoice(out[0], '辨这味药', '你依一寸丹经先辨药性，再按原差事交还药篓。'));
    if (main === 'bailian' && ['huoshan', 'furnace', 'xw_mist', 'bandit'].includes(id) && out[0])
      out.push(copyChoice(out[0], '硬挨这一记', '你按百炼体书收紧肩背。', r => {
        if (r.fx && r.fx.inj > 0) { r.fx = Object.assign({}, r.fx, { inj: Math.max(0, r.fx.inj - 1) }); r.tags = (r.tags || []).concat([{ t: '硬挨 · 少伤一分' }]); }
      }));
    if (main === 'bamen' && id === 'm_shoushan' && out[0]) out.push(copyChoice(out[0], '先看阵', '你先沿山门走完八门步，记住巡夜的阵眼。'));
    if (main === 'bamen' && ev.title === '石门禁制') out.push({ label: '先看阵', sub: '八门步引', act: () => ({ text: '你没有碰门，先走完八门。最后一步落下，符纹让出一道只容一人通过的门缝。', ling: -8 }) });
    if (main === 'chenjian' && ev.title === '沉剑台') out.push({ label: '以谱问剑', sub: '沉剑谱', act: () => ({ text: '你摊开剑谱，问台上之剑为何沉在这里。剑没有出鞘，只用一声轻鸣，把你缺的半句补上。', loot: { xw: 0.2 } }) });
    if (main === 'wangqing' && id === 'yg_su_vow') out.push({ label: '不问', sub: '忘情 · 情谊不变', act: st => {
      karmaTake(st, 'su_vow'); return { text: '你没有问那盏灯为谁而亮，也没有替苏晚晴回答。灯留在溪边，情谊停在原处。', fx: {}, tags: [{ t: '不问 · 谊如旧' }] };
    } });
    if (main === 'shanmenjiuli' && id === 'jc_gate' && out[0]) out.push(copyChoice(out[0], '据旧例说明来处', '你翻出山门旧例的入籍条目。校尉核过后收了戟，依例将你记作白身，未替你越级。'));
    return out;
  }
  EVENTS.forEach(ev => { const choices = ev.choices; if (typeof choices === 'function') ev.choices = s => dress(choices(s), ev, s); });
  Object.keys(MIJING).forEach(id => MIJING[id].nodes.forEach(node => {
    const choices = node.choices;
    node.choices = s => {
      const out = dress(choices(s), { id: 'mj:' + node.t, title: node.t }, s);
      if (id === 'gufu' && node.t === '丹室' && !s.gfs.lenglu) out.push({ label: '读炉边残篇', sub: '冷炉残篇', act: st => {
        const tags = []; Core.learn(st, 'lenglu', tags);
        return { text: '你留下瓶中的丹，把炉边的残篇读完。冷炉的行功路数已经记在心里。' };
      } });
      if (id === 'xiandao' && node.t === '岛上桃' && !s.flags.wanmuOffered && !s.gfs.wanmu) {
        out.push({ label: '听古木同根之息', sub: '万木同根经 · 此生一次', act: st => {
          Core.learn(st, 'wanmu'); return { text: '你没有折枝。树根下传来万木相连的呼吸，你读懂了《万木同根经》。' };
        } });
        return out.map(c => copyChoice(c, c.label, '', (r, st) => { st.flags.wanmuOffered = 1; }));
      }
      return out;
    };
  }));
  const missionEvent = Core.missionEvent;
  Core.missionEvent = (s, uid) => {
    const ev = missionEvent(s, uid); if (!ev) return ev;
    const choices = ev.choices; ev.choices = st => dress(choices(st), ev, st); return ev;
  };
  EVENTS.push({ id: 'arts_roots', title: '杂根对读', seal: '法', w: 5, once: true, rm: [1, 4],
    cond: s => s.gf === 'wuxing' && s.lgEls.length >= 3 && s.sect && !!s.sect.org,
    text: () => '藏经阁执事把旧时赐下的法诀摆在你面前：“根杂的人，可也有相通的读法？”',
    choices: () => [{ label: '以杂根相生', sub: '五行归一', act: () => ({ text: '你让三路以上的气息各行其路，再在末尾相逢。没有哪一道根被舍去，旧法里含糊的地方也清楚了。', fx: { gfXp: 2, xj: 2 } }) },
      { label: '只重读旧注', act: () => ({ text: '你把旧注又读一遍，没有急着添上自己的名字。', fx: { xj: 2 } }) }] });
  return { dress, routes, libraries };
})();
