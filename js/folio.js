/* 纸上仙途 · 此身、铺子之外的客卿与前世回响、道侣日常。
   旧档不写性别则仍按原先的「师兄」称呼；字段缺了就补空，不升存档版本。 */
'use strict';
const Folio = (() => {
  const KEEP = ['器房师兄', '青袍师兄', '守炉师兄', '机纹师兄', '丹房师姐', '殿中师姐'];

  function who(s) {
    if (!s.who || typeof s.who !== 'object') s.who = {};
    return s.who;
  }
  function sex(s) {
    const x = s && s.who && s.who.sex;
    return x === 'f' || x === 'n' || x === 'm' ? x : 'm';
  }
  function needSex(s) { return !!(s && !(s.who && s.who.sex)); }
  function setWho(s, sexId, mateId) {
    const w = who(s);
    if (sexId === 'f' || sexId === 'n' || sexId === 'm') w.sex = sexId;
    if (mateId === 'm' || mateId === 'f' || mateId === 'any') w.mate = mateId;
    return w;
  }
  function ta(s) { const x = sex(s); return x === 'f' ? '她' : x === 'n' ? '其' : '他'; }
  function shi(s) { const x = sex(s); return x === 'f' ? '师姐' : x === 'n' ? '同门' : '师兄'; }
  function call(s) { const x = sex(s); return x === 'f' ? '姑娘' : x === 'n' ? '道友' : '公子'; }
  function dress(s, text) {
    if (!text || sex(s) === 'm') return text;
    const word = shi(s);
    let t = String(text);
    const marks = [];
    KEEP.forEach((k, i) => {
      const token = '\u0001' + i + '\u0001';
      if (t.indexOf(k) >= 0) { marks.push([token, k]); t = t.split(k).join(token); }
    });
    t = t.replace(/师兄/g, word);
    marks.forEach(([token, k]) => { t = t.split(token).join(k); });
    return t;
  }
  function wantMate(s, g) {
    const m = s && s.who && s.who.mate;
    if (!m) return g === 'f';
    if (m === 'any') return true;
    return m === g;
  }
  function mateSex(s) {
    if (s && s.bond && (s.bond.mateSex === 'm' || s.bond.mateSex === 'f')) return s.bond.mateSex;
    const id = s && s.karma && s.karma.mate;
    const fixed = { xie: 'f', su: 'f', bai: 'm', lu: 'm', wen: 'm', shi: 'm' };
    if (id && fixed[id]) return fixed[id];
    const pref = s && s.who && s.who.mate;
    if (pref === 'm' || pref === 'f') return pref;
    return 'f';
  }
  function mateTa(s) { return mateSex(s) === 'm' ? '他' : '她'; }
  function aliveMate(s) {
    return !!(s && s.karma && s.karma.mate) && !(s.bond && s.bond.lost)
      && (typeof Core === 'undefined' || Core.npcAlive(s, s.karma.mate));
  }
  function mateNameOf(s) {
    if (typeof mateName === 'function') return mateName(s) || '';
    const id = s && s.karma && s.karma.mate;
    return (id && typeof NPCS !== 'undefined' && NPCS[id]) ? NPCS[id].name : '';
  }

  function keq(s) {
    s.keq = s.keq && typeof s.keq === 'object' ? s.keq : { rank: -1, fail: 0, next: 0, pay: 0, out: 0 };
    if (s.keq.rank == null) s.keq.rank = -1;
    return s.keq;
  }
  function keqOn(s) { const k = s && s.keq; return !!(k && (k.rank | 0) >= 0 && !k.out); }
  function keqTitle(s) { return (s.keq && (s.keq.rank | 0) >= 1) ? '国师' : '客卿'; }

  function hooksOf(echo) {
    if (!echo) return [];
    const hs = [];
    if (echo.ending === 'huashen') hs.push('shan');
    if (echo.mate) hs.push('mate');
    if (echo.foe) hs.push('foe');
    if (echo.sect) hs.push('sect');
    if (echo.fabao) hs.push('fabao');
    if (echo.ending === 'ascend') hs.push('ascend');
    if (echo.ending === 'renhuang' || echo.ending === 'quancheng') hs.push('edict');
    if (echo.ending === 'zuohua' || echo.ending === 'yunluo' || echo.ending === 'bingjie') hs.push('grave');
    if (echo.goal) hs.push('wish');
    if (echo.ending === 'guiyin') hs.push('boat');
    return hs;
  }
  function readEchoes() {
    const out = [];
    if (typeof Samsara !== 'undefined' && Samsara.loadMeta) {
      const m = Samsara.loadMeta();
      (m.echoes || []).forEach(e => { if (e && e.name) out.push(e); });
    }
    try {
      const box = JSON.parse(localStorage.getItem('moxian.slots') || 'null');
      (box && box.slots || []).forEach(sl => {
        const d = sl && sl.data;
        if (!d || !(d.dead || d.ascended || d.ending)) return;
        out.push({
          name: d.name || (sl.sum && sl.sum.name) || '无名',
          ending: d.ending || (d.ascended ? 'ascend' : 'zuohua'),
          realm: d.realm | 0, age: d.age | 0,
          mate: (d.karma && d.karma.mate && typeof NPCS !== 'undefined' && NPCS[d.karma.mate]) ? NPCS[d.karma.mate].name : '',
          mateId: (d.karma && d.karma.mate) || '',
          foe: (d.karma && d.karma.foe && typeof NPCS !== 'undefined' && NPCS[d.karma.foe]) ? NPCS[d.karma.foe].name : '',
          foeId: (d.karma && d.karma.foe) || '',
          sect: (d.sect && d.sect.org && typeof ORGS !== 'undefined' && ORGS[d.sect.org]) ? ORGS[d.sect.org].name : '',
          fabao: (d.fabao && d.fabao.name) || (d.eq && d.eq.weapon) || '',
          goal: (d.life && d.life.goal) || '',
        });
      });
    } catch (e) {}
    return out;
  }
  function seed(s) {
    if (!s) return;
    if (s.flags && s.flags.trial) { s.echo = s.echo || { kinds: [], by: {} }; return; }
    if (s.echo && s.echo.kinds) return;
    const pool = [];
    readEchoes().forEach(e => {
      if (e.name && s.name && e.name === s.name && (e.age | 0) === (s.age | 0)) return;
      hooksOf(e).forEach(h => pool.push({ h, e }));
    });
    const picked = [];
    const by = {};
    while (pool.length && picked.length < 2) {
      const i = Math.floor(Math.random() * pool.length);
      const row = pool.splice(i, 1)[0];
      if (picked.indexOf(row.h) >= 0) continue;
      picked.push(row.h);
      const hid = row.h === 'mate' ? (row.e.mateId || '') : row.h === 'foe' ? (row.e.foeId || '') : '';
      by[row.h] = { name: row.e.name, mate: row.e.mate || '', foe: row.e.foe || '', sect: row.e.sect || '', fabao: row.e.fabao || '', goal: row.e.goal || '', ending: row.e.ending || '', id: hid };
    }
    const carry = s.flags && s.flags.karmaCarry;
    if (carry && carry.id && !s.flags.trial) {
      const h = carry.role === 'mate' ? 'mate' : carry.role === 'foe' ? 'foe' : 'en';
      if (picked.indexOf(h) < 0) picked.push(h);
      const prev = by[h] || {};
      by[h] = {
        name: prev.name || s.name || '',
        mate: carry.role === 'mate' ? (carry.name || prev.mate || '') : (prev.mate || ''),
        foe: carry.role === 'foe' ? (carry.name || prev.foe || '') : (prev.foe || ''),
        sect: prev.sect || '', fabao: prev.fabao || '', goal: prev.goal || '', ending: prev.ending || '',
        id: carry.id || prev.id || '',
        en: carry.role === 'en' ? (carry.name || '') : (prev.en || ''),
      };
    }
    s.echo = { kinds: picked, by };
  }
  function hasHook(s, id) {
    return !!(s && s.echo && s.echo.kinds && s.echo.kinds.indexOf(id) >= 0 && s.echo.by && s.echo.by[id]);
  }
  function hook(s, id) { return (s.echo && s.echo.by && s.echo.by[id]) || {}; }
  function livesOf(s) { return s && s.flags ? (s.flags.lives | 0) : 0; }
  function idByName(name) {
    if (!name || typeof NPCS === 'undefined') return '';
    for (const id in NPCS) if (NPCS[id] && NPCS[id].name === name) return id;
    return '';
  }
  function sexOf(id, name) {
    const fixed = { xie: 'f', su: 'f', bai: 'm', lu: 'm', wen: 'm', shi: 'm', shifu: 'm' };
    if (id && fixed[id]) return fixed[id];
    if (name === '苏晚晴' || name === '谢疏影') return 'f';
    if (name === '江疏白' || name === '陆沉舟' || name === '温庭玉' || name === '石小满' || name === '玄微真人') return 'm';
    return '';
  }
  function taOf(g) { return g === 'f' ? '她' : g === 'm' ? '他' : '那人'; }
  function pastMate(s) {
    const c = s.flags && s.flags.karmaCarry;
    if (c && c.role === 'mate' && c.name) return { name: c.name, id: c.id || idByName(c.name) };
    const h = hook(s, 'mate');
    const name = h.mate || '';
    return { name, id: h.id || idByName(name) };
  }
  function pastFoe(s) {
    const c = s.flags && s.flags.karmaCarry;
    if (c && c.role === 'foe' && c.name) return { name: c.name, id: c.id || idByName(c.name) };
    const h = hook(s, 'foe');
    const name = h.foe || '';
    return { name, id: h.id || idByName(name) };
  }

  function ensure(s) {
    if (!s) return;
    who(s);
    if (s.keq) keq(s);
    if (!s.echo) seed(s);
  }
  function boot(s) { ensure(s); seed(s); }

  function install() {
    if (typeof EVENTS === 'undefined' || EVENTS.some(e => e && e.id === 'bond_meet_he')) return;
    const mateOk = s => aliveMate(s);
    EVENTS.push(
      { id: 'bond_meet_he', title: '疏白', seal: '白', w: 6, once: true, rm: [1, 3], portrait: 'lu',
        cond: s => !(s.karma && s.karma.mate) && (s.realm | 0) >= 1 && !(s.bond && s.bond.lost) && wantMate(s, 'm'),
        text: () => '溪水发白的那年，桥上站着一个穿青衫的人。他说自己叫江疏白，说话很慢：“你走路的样子，像要去一个很远、也不一定存在的地方。”',
        choices: s => [
          { label: '问他要不要同行一程', act: s2 => {
            if (typeof setMate === 'function') setMate(s2, 'bai');
            if (s2.bond) s2.bond.mateSex = 'm';
            if (s2.npc && s2.npc.bai) { s2.npc.bai.met = true; s2.npc.bai.a = Math.min(100, (s2.npc.bai.a | 0) + 18); }
            if (typeof Life !== 'undefined' && Life.meet) Life.meet(s2, '江疏白', '桥上同行');
            return { text: '他把伞柄往你这边让了让。“一程可以。再远的，走着看。”自此案上常常多一只杯。', fx: { xj: 6 }, tags: [{ t: '道侣 · 江疏白', c: 'gold' }] };
          } },
          { label: '说自己还不能许人', act: () => ({ text: '他点头，像早就知道。“那我把名字留下。你若改主意，桥还在。”人走了，桥栏还温。', fx: { xj: 2 } }) },
        ] },
      { id: 'bond_sit', title: '共修', seal: '坐', w: 4, rm: [1, 4],
        cond: s => mateOk(s) && (s.flags.bondSit | 0) < 3,
        text: s => `${mateNameOf(s) || '道侣'}在你对面坐下，把呼吸放得很慢。“今日不谈去处。只把这一炷香的灵气，分给你一半，也分我一半。”`,
        choices: () => [
          { label: '一起坐', sub: '心境与修为', act: s2 => { s2.flags.bondSit = (s2.flags.bondSit | 0) + 1; return { text: `灵气在你和${mateTa(s2)}之间走了一个来回。不炽，只是稳。稳完，谁也没有把这事说大。`, fx: { xw: 0.06, xj: 4, time: 1 } }; } },
          { label: '今日只想安静', act: () => ({ text: '你们并坐到香尽。没有修为上的进益，只有肩膀知道另一边有人。', fx: { xj: 3 } }) },
        ] },
      { id: 'bond_spat', title: '闹别扭', seal: '拧', w: 3, rm: [1, 4],
        cond: s => mateOk(s) && (s.flags.bondSpat | 0) < 2 && (s.xj | 0) < 70,
        text: s => `${mateNameOf(s) || '那人'}把杯推远了一寸。“你这些天看的都是功法，不是人。”声音不高，桌子却像忽然凉了。`,
        choices: () => [
          { label: '把功法合上', act: s2 => { s2.flags.bondSpat = (s2.flags.bondSpat | 0) + 1; return { text: `你把册子合上。${mateTa(s2)}看了你很久，把杯推回来。“下回先看人。”心口那一点拧着的劲，松了。`, fx: { xj: 5 } }; } },
          { label: '说修为不能停', act: s2 => { s2.flags.bondSpat = (s2.flags.bondSpat | 0) + 1; return { text: `${mateTa(s2)}没再争。杯留在远处。你多看了半夜的字，字都认得，心里却空了一块。`, fx: { xj: -4, xw: 0.04 } }; } },
        ] },
      { id: 'bond_herb', title: '寻药', seal: '药', w: 4, rm: [1, 4],
        cond: s => mateOk(s) && !s.flags.bondHerb,
        text: s => `${mateNameOf(s) || '道侣'}把一只小篓递过来。“山后有一株我拿不准的草。你若肯陪我去看看，回来的路上可以不说话。”`,
        choices: () => [
          { label: '陪去', sub: '约一季', act: s2 => { s2.flags.bondHerb = 1; return { text: `草不稀奇，路倒很长。${mateTa(s2)}在崖边拉了你一把。回来时篓里多了两株青叶，人比去时靠近了一点。`, fx: { item: { '青叶草': 2 }, xj: 3, time: 3 } }; } },
          { label: '让其自去', act: s2 => { s2.flags.bondHerb = 1; return { text: `${mateTa(s2)}自己去了。天黑才回来，草是好的，话少了两句。`, fx: { xj: -2, item: { '青叶草': 1 } } }; } },
        ] },
      { id: 'bond_year', title: '年节', seal: '节', w: 4, rm: [0, 4],
        cond: s => mateOk(s) && (s.months | 0) > 0 && Math.floor((s.months | 0) / 12) !== (s.flags.bondYear | 0) && ((s.months | 0) % 12) < 2,
        text: s => `年关的灯还没挂全。${mateNameOf(s) || '那人'}在案上摆了两双筷子，一双是你的。“今夜不谈破境。吃饭。”`,
        choices: () => [
          { label: '坐下吃', act: s2 => { s2.flags.bondYear = Math.floor((s2.months | 0) / 12); return { text: '菜很普通。普通到你忽然记得，自己已经很多年没有在固定的日子里被人等。', fx: { xj: 6 } }; } },
          { label: '说还要闭关', act: s2 => { s2.flags.bondYear = Math.floor((s2.months | 0) / 12); return { text: `筷子收回去一只。${mateTa(s2)}说“那你去”。洞里的灯你自己点，点完才发现年已经过了。`, fx: { xj: -3, xw: 0.03 } }; } },
        ] },
      { id: 'bond_part', title: '生离', seal: '离', w: 3, once: true, rm: [2, 4],
        cond: s => mateOk(s) && (s.age | 0) >= 60 && (s.lifespan - s.age) < 18,
        text: s => `${mateNameOf(s) || '那人'}把你的手翻过来，看掌纹，看了很久。“若日子不够用，你想先把哪一句说完？”`,
        choices: () => [
          { label: '说还要一起走', act: () => ({ text: '你说了。说得很短。短的话有时候比长的话更重。重完，两个人都安静了一会儿，安静得像把日子又接上了一寸。', fx: { xj: 6, life: 2 } }) },
          { label: '说不出', act: s2 => ({ text: `${mateTa(s2)}没有催。手还握着。有些离别不是走掉，是话停在喉咙里，谁也不肯先放。`, fx: { xj: -2 } }) },
        ] },

      { id: 'keq_invite', title: '供奉', seal: '奉', w: 4, once: true, rm: [1, 4],
        cond: s => (s.realm | 0) >= 1 && !keqOn(s) && !(s.keq && s.keq.out) && !(s.court && (s.court.rank | 0) >= 0),
        text: s => `县里来了个穿便服的人，把帖子放在你案上，没有下跪。“不要求你入朝。只求一位${call(s)}，偶尔应一声凡间的事。灵石按季送，宗门的簿子上，不会记你这一笔。”`,
        choices: () => [
          { label: '应下，做客卿', act: s2 => { const k = keq(s2); k.rank = 0; k.fail = 0; k.out = 0; k.pay = (s2.months | 0) + 6; k.next = (s2.months | 0) + 8; return { text: '你在帖子上按了一个很淡的手印。人走之后，洞府还是洞府。只是从今以后，凡间有事会来敲你的门。门派的贡献簿，果然一个字也没动。', tags: [{ t: '客卿', c: 'gold' }] }; } },
          { label: '不接这门供奉', act: () => ({ text: '你把帖子还了。来人也不勉强。“那便当山里没有这个人。”他走得很轻，像怕惊动你的清修。', fx: { xj: 1 } }) },
        ] },
      { id: 'keq_war', title: '征召', seal: '战', w: 5, rm: [1, 4],
        cond: s => keqOn(s) && (s.months | 0) >= ((s.keq && s.keq.next) || 0) && !s.flags.keqBusy,
        text: () => '军帖比供奉的银子先到。边城在打仗，要一位修士去压一阵，不是要你当官，是要你在阵前站一夜。',
        choices: s => [
          { label: '去站一夜', sub: '约一季', act: s2 => {
            s2.keq.next = (s2.months | 0) + 10 * (typeof REALMS !== 'undefined' ? REALMS[s2.realm].T : 1);
            const ok = Math.random() < 0.62 + Math.min(0.2, (s2.realm | 0) * 0.05);
            if (ok) return { text: '你在阵前站了一夜。刀光没有爬上城墙。天亮时，将军给你鞠了一躬，没有问你的宗门。', fx: { xj: 2, time: 3, ls: 8 }, tags: [{ t: '应召', c: 'up' }] };
            s2.keq.fail = (s2.keq.fail | 0) + 1;
            return { text: '夜太长，你没能把那一阵压住。城还在，人少了一排。供奉的人后来说话，声音轻了很多。', fx: { xj: -3, time: 3 } };
          } },
          { label: '推说在闭关', act: s2 => { s2.keq.fail = (s2.keq.fail | 0) + 1; s2.keq.next = (s2.months | 0) + 8; return { text: '你没有去。帖子在案上放了三天，自己黄了。下一季的供奉，会薄一截。', fx: { xj: -1 } }; } },
        ] },
      { id: 'keq_yao', title: '妖患', seal: '妖', w: 4, rm: [1, 4],
        cond: s => keqOn(s) && (s.keq.fail | 0) < 3 && (s.months | 0) >= ((s.keq.next || 0) + 4) && (s.flags.keqYao | 0) < 2,
        text: () => '乡人堵在洞口，说后山的兽开始吃人。他们不求你收徒，只求你去看一眼。看完可以回来继续修。',
        choices: () => [
          { label: '去看一眼', act: s2 => { s2.flags.keqYao = (s2.flags.keqYao | 0) + 1; s2.keq.next = (s2.months | 0) + 6; return { text: '兽不厉害，厉害的是乡人的眼睛。你把事情做完，他们把一筐干果放在洞口，没有留名。', fx: { xj: 3, time: 2, item: { '青叶草': 1 } } }; } },
          { label: '让他们另请高明', act: s2 => { s2.keq.fail = (s2.keq.fail | 0) + 1; s2.flags.keqYao = (s2.flags.keqYao | 0) + 1; return { text: '人散了。散的时候没有骂你。不骂，有时候比骂更让供奉的人心里有数。', fx: { xj: -2 } }; } },
        ] },
      { id: 'keq_rain', title: '祈雨', seal: '雨', w: 4, rm: [1, 4],
        cond: s => keqOn(s) && (s.flags.keqRain | 0) < 1 && (s.months | 0) > 24,
        text: s => `田旱了。里正远道来求${call(s)}在祠前站一个时辰。“不入朝籍。雨来不来，我们自己看天。”`,
        choices: () => [
          { label: '去祠前站着', act: s2 => { s2.flags.keqRain = 1; const ok = Math.random() < 0.7; return ok ? { text: '云是自己来的。你只是站着。乡人把这叫做灵验，你把这叫做刚好。', fx: { xj: 3, time: 1 } } : { text: '你站到太阳落山，雨没有来。里正仍旧道谢，谢得有点勉强。', fx: { xj: -1, time: 1 } }; } },
          { label: '说天不由人', act: s2 => { s2.flags.keqRain = 1; s2.keq.fail = (s2.keq.fail | 0) + 1; return { text: '你说了实话。实话不下雨。里正走的时候，把帽子压得很低。', fx: { xj: 1 } }; } },
        ] },
      { id: 'keq_jia', title: '护驾', seal: '驾', w: 3, rm: [2, 4],
        cond: s => keqOn(s) && (s.keq.rank | 0) >= 0 && (s.realm | 0) >= 2 && !s.flags.keqJia,
        text: () => '一顶没有旗的轿子停在山外。里面的人说，只借你三日，沿路不要有人动手。事完，客卿可以写成国师，仍不必入朝籍。',
        choices: () => [
          { label: '护送三日', act: s2 => {
            s2.flags.keqJia = 1;
            if (Math.random() < 0.72) { s2.keq.rank = 1; return { text: '三日无事。轿子进了城，你停在城外。回山时，供奉的封条上多了两个字：国师。宗门的名册还是只有你原来的位置。', fx: { xj: 2, time: 3, ls: 20 }, tags: [{ t: '国师', c: 'gold' }] }; }
            s2.keq.fail = (s2.keq.fail | 0) + 1;
            return { text: '路上还是动了手。人是保住了，面子没有。国师两个字，这一次没有写上。', fx: { xj: -2, time: 3, inj: 1 } };
          } },
          { label: '三日太长', act: s2 => { s2.flags.keqJia = 1; s2.keq.fail = (s2.keq.fail | 0) + 1; return { text: '轿子调头走了。山还是你的山。供奉的人会记得，你有一次没有来。', fx: { xj: 1 } }; } },
        ] },
      { id: 'keq_out', title: '除名', seal: '除', w: 8, once: true, rm: [1, 4],
        cond: s => !!(s.keq && (s.keq.rank | 0) >= 0 && !s.keq.out && (s.keq.fail | 0) >= 3),
        text: () => '供奉的人最后来了一次，把原先的帖子要回去，在背面写了两个字，给你看过，又收走。“不是恨你。是凡间不能再等一个不来的人。”',
        choices: () => [
          { label: '把印还了', act: s2 => { s2.keq.out = 1; s2.keq.rank = -2; return { text: '印还了。洞府清静了。清静的代价是，再没有人按季把灵石放在你门口。宗门那边，始终不知道你曾被凡人请过。', fx: { xj: -2 }, tags: [{ t: '客卿除名', c: 'down' }] }; } },
        ] },

      { id: 'echo_shan', title: '山神', seal: '山', w: 2, once: true, rm: [1, 4],
        cond: s => hasHook(s, 'shan'),
        text: s => { const h = hook(s, 'shan'); return `没有门的祠前，风替人点头。石上的名字很浅，浅处却认得出是「${h.name}」。你站了一会儿，干果自己从供盘里滚到你脚边。`; },
        choices: () => [{ label: '放下一块干粮', act: () => ({ text: '你没有报名。山也不问。走的时候，脚步轻了一点，像有人在后面让了让路。', fx: { xj: 4, btBuff: 0.02 } }) }] },
      { id: 'echo_mate', title: '旧人', seal: '旧', w: 2, once: true, rm: [1, 4],
        cond: s => hasHook(s, 'mate') && livesOf(s) < 2 && !(s.flags && s.flags.karmaCarry && s.flags.karmaCarry.role === 'mate'),
        text: s => { const h = hook(s, 'mate'); return `茶摊的人听见你的路数，忽然停杯：“上一世有个人，身边总坐着${h.mate}。你走路的影子，有一点像那个空出来的位置。”`; },
        choices: () => [{ label: '听完就走', act: () => ({ text: '你没有承认，也没有否认。杯底的茶叶沉下去，像一个不愿意被讲完的名字。', fx: { xj: 2 } }) }] },
      { id: 'echo_foe', title: '余仇', seal: '余', w: 2, once: true, rm: [1, 4],
        cond: s => hasHook(s, 'foe') && livesOf(s) < 2 && !(s.flags && s.flags.karmaCarry && s.flags.karmaCarry.role === 'foe'),
        text: s => { const h = hook(s, 'foe'); return `路口有人挡你，不是为了劫道。他说：“我认得${h.foe}。也认得那个把这笔账带到下一世的人。你若是，就自己心里有数。”`; },
        choices: () => [{ label: '拱手过去', act: () => ({ text: '你过去了。背后没有刀。只有一句很旧的名字，在风里磨了一下。', fx: { xj: 1 } }) }] },
      { id: 'echo_sect', title: '旧籍', seal: '籍', w: 2, once: true, rm: [0, 4],
        cond: s => hasHook(s, 'sect'),
        text: s => { const h = hook(s, 'sect'); return `${h.sect}的执事翻到一页泛黄的名册，指给你看一个名字：「${h.name}」。他说这不是你，可纸边的批注写着：来人若似，便让一让。`; },
        choices: () => [{ label: '看一眼就合上', act: () => ({ text: '名册合上了。执事没有多问。你出堂时，门槛好像比进来时低了一指。', fx: { xj: 2 } }) }] },
      { id: 'echo_fabao', title: '遗器', seal: '器', w: 2, once: true, rm: [1, 4],
        cond: s => hasHook(s, 'fabao'),
        text: s => { const h = hook(s, 'fabao'); return `当铺最里面的架子上，一件${h.fabao}用布蒙着。掌柜说这是从一座空洞里收来的，“器还记得上一任的手温，可那个人已经不在这一卷里。”`; },
        choices: () => [{ label: '摸一摸，不买', act: () => ({ text: '布下的温度不是你的。你缩回手。掌柜也不勉强。有些东西只负责让你知道，从前有人认真活过。', fx: { xj: 2, btBuff: 0.01 } }) }] },
      { id: 'echo_ascend', title: '传闻', seal: '闻', w: 2, once: true, rm: [2, 4],
        cond: s => hasHook(s, 'ascend'),
        text: s => { const h = hook(s, 'ascend'); return `说书人拍醒木：“话说有位${h.name}，白日里上了天，山下的人到现在还在争，那是飞升还是躲起来了。”满堂看你，像在等一个不该在场的听众。`; },
        choices: () => [{ label: '听完，不辩', act: () => ({ text: '你把茶钱放下。故事不必被你改正。改正了，它就不再是传闻。', fx: { xj: 3 } }) }] },
      { id: 'echo_edict', title: '旧诏', seal: '诏', w: 2, once: true, rm: [1, 4],
        cond: s => hasHook(s, 'edict'),
        text: s => { const h = hook(s, 'edict'); return `城门口的碑上刻着很短的一句：昔有${h.name}，仙凡都要低头。碑新，字旧。你读的时候，守门的人没有叫你行礼。`; },
        choices: () => [{ label: '读完便走', act: () => ({ text: '碑不认识你。你也不必认识碑。可那一行字在心里停了一停，像从前有人把位子坐热过。', fx: { xj: 1 } }) }] },
      { id: 'echo_grave', title: '旧洞', seal: '洞', w: 2, once: true, rm: [0, 4],
        cond: s => hasHook(s, 'grave') && livesOf(s) < 3,
        text: s => { const h = hook(s, 'grave'); return `一座空洞的门框上，有人用炭写了「${h.name}」。字被雨冲淡了，还剩一个轮廓。洞里没有尸骨，只有一盏干了的灯。`; },
        choices: () => [{ label: '添一盏新油', act: () => ({ text: '油是你的。灯不是。点着之后你就退出去，没有在门框上加自己的名字。', fx: { xj: 3 } }) }] },
      { id: 'echo_wish', title: '残愿', seal: '愿', w: 2, once: true, rm: [0, 4],
        cond: s => hasHook(s, 'wish'),
        text: s => { const h = hook(s, 'wish'); const g = (typeof Life !== 'undefined' && Life.goalBy && Life.goalBy(h.goal)) ? Life.goalBy(h.goal).name : '一件没写完的事'; return `你在一页被风吹到脚边的纸上，看见一行很小的字：${h.name}，所求「${g}」。纸没有署名给你。它只是刚好停在你这里。`; },
        choices: () => [{ label: '把纸压在石下', act: () => ({ text: '你没有把它收进怀里。压在石下，风就暂时拿不走。拿不走的东西，有时比带走的更像一个前世。', fx: { xj: 2 } }) }] },
      { id: 'echo_boat', title: '空船', seal: '舟', w: 2, once: true, rm: [1, 4],
        cond: s => hasHook(s, 'boat'),
        text: s => { const h = hook(s, 'boat'); return `江心有一条空船，缆绳系在没有人的桩上。船头刻着「${h.name}」，刻得很浅，像主人离开时特意没有带走名字。`; },
        choices: () => [{ label: '看一眼，不上船', act: () => ({ text: '你看了一眼。船自己微微一晃，又稳住。稳住的意思是：这一世，你可以不重复上一次的离开。', fx: { xj: 3 } }) }] },

      { id: 'echo_meet', title: '重逢', seal: '逢', w: 5, once: true, rm: [0, 4],
        cond: s => {
          if (s.flags && s.flags.trial) return false;
          if ((s.age | 0) < 17 || !pastMate(s).name) return false;
          const carried = s.flags && s.flags.karmaCarry && s.flags.karmaCarry.role === 'mate';
          return carried || (livesOf(s) >= 2 && hasHook(s, 'mate'));
        },
        text: s => {
          const p = pastMate(s);
          const g = sexOf(p.id, p.name);
          const ta = taOf(g);
          return `桥栏还是湿的。${p.name}站在你来的方向，像等了很久，又像只是路过。「你走路的样子，我在另一世见过。」${ta}没有笑。名字是对的。脸也是。`;
        },
        choices: s => {
          const p = pastMate(s);
          const g = sexOf(p.id, p.name);
          const ta = taOf(g);
          const allow = !!(p.id && g && wantMate(s, g));
          const opts = [];
          if (allow) {
            opts.push({ label: '再走一程', act: s2 => {
              if (typeof setMate === 'function') setMate(s2, p.id);
              if (s2.bond) s2.bond.mateSex = g;
              if (s2.npc && s2.npc[p.id]) { s2.npc[p.id].met = true; s2.npc[p.id].a = Math.min(100, (s2.npc[p.id].a | 0) + 12); }
              if (typeof Life !== 'undefined' && Life.meet) Life.meet(s2, p.name, '转世重逢');
              return { text: `${ta}把袖子往你这边让了让。「这一世的路，我还是不认得。你若肯，就并肩走到看清为止。」没有誓。只有两个人同时迈了一步。`, fx: { xj: 4 }, tags: [{ t: '重逢 · ' + p.name, c: 'gold' }] };
            } });
          }
          opts.push({ label: allow ? '认出，却不重续' : '远远看一眼', act: () => ({ text: allow ? `你报了自己的名字。${ta}点头，像把一个旧约定轻轻放回桥下。「那就当认错了人。」人走了。桥还在。` : `你没有上前。这一世你不想把道侣的位子，许给一个对不上的人。${p.name}也没有追。只是回头看了一眼，像把名字还给风。`, fx: { xj: 2 } }) });
          return opts;
        } },
      { id: 'echo_hunt', title: '寻仇', seal: '仇', w: 5, once: true, rm: [0, 4],
        cond: s => {
          if (s.flags && s.flags.trial) return false;
          if ((s.age | 0) < 17 || !pastFoe(s).name) return false;
          const carried = s.flags && s.flags.karmaCarry && s.flags.karmaCarry.role === 'foe';
          return carried || (livesOf(s) >= 2 && hasHook(s, 'foe'));
        },
        text: s => {
          const p = pastFoe(s);
          const ta = taOf(sexOf(p.id, p.name));
          return `洞口的石阶上坐着${p.name}。不是为了劫道。${ta}把一块旧石头放在你脚边：「上一世的账，我带到了这一世。人可以重来，这笔不行。」`;
        },
        choices: s => {
          const p = pastFoe(s);
          const ta = taOf(sexOf(p.id, p.name));
          return [
            { label: '把旧账说开', act: s2 => {
              if (s2.npc && p.id && s2.npc[p.id]) { s2.npc[p.id].met = true; s2.npc[p.id].a = Math.max(-20, (s2.npc[p.id].a | 0) - 8); }
              if (s2.karma && p.id && !s2.karma.foe) s2.karma.foe = p.id;
              return { text: `你没有动手。${ta}也没有。话说到石头凉了，${p.name}站起来。「听到了。这一世，我先看着你。」人走远，账还在，只是不再堵门。`, fx: { xj: 2 }, tags: [{ t: '旧仇上门', c: 'gold' }] };
            } },
            { label: '避而不见', act: () => ({ text: `你从侧岭绕开。${p.name}在洞口坐到天黑，没有闯进来。第二天石头还在，人已经不在。`, fx: { xj: -1 } }) },
          ];
        } },
      { id: 'echo_grace', title: '旧恩', seal: '恩', w: 5, once: true, rm: [0, 4],
        cond: s => {
          const c = s.flags && s.flags.karmaCarry;
          return !!(c && c.role === 'en' && c.name) && !(s.flags && s.flags.trial) && (s.age | 0) >= 17;
        },
        text: s => {
          const c = s.flags.karmaCarry;
          const ta = taOf(sexOf(c.id, c.name));
          return `集上有人叫住你。是${c.name}。${ta}看了你很久，才说：「上一世你帮过我。这一世我还没想好怎么还，先把你认出来。」`;
        },
        choices: s => {
          const c = s.flags.karmaCarry;
          return [
            { label: '也认出对方', act: s2 => {
              if (s2.npc && c.id && s2.npc[c.id]) { s2.npc[c.id].met = true; s2.npc[c.id].a = Math.min(100, (s2.npc[c.id].a | 0) + 10); }
              if (typeof Life !== 'undefined' && Life.meet) Life.meet(s2, c.name, '旧恩再遇');
              return { text: '你们没有把那件事再讲一遍。点过头，就像把一笔很轻的账，从上一世挪到了这一世的袖里。', fx: { xj: 3 }, tags: [{ t: '旧恩 · ' + c.name, c: 'gold' }] };
            } },
            { label: '说自己不记得', act: () => ({ text: `${c.name}也不勉强。「不记得也好。恩情若要人记住，就重了。」人没入集里。你站了一会儿。`, fx: { xj: 1 } }) },
          ];
        } },
      { id: 'echo_cave_mem', title: '忆洞', seal: '忆', w: 5, once: true, rm: [0, 4],
        cond: s => livesOf(s) >= 3 && hasHook(s, 'grave') && !(s.flags && s.flags.trial) && (s.age | 0) >= 18,
        text: s => {
          const h = hook(s, 'grave');
          const who = h.name || '一个旧名字';
          return `你在一条没有路牌的山凹里站住。门框是空的，灯是干的。炭写的「${who}」被雨冲得只剩轮廓。你忽然记得这盏灯的油从哪来，也记得自己曾经坐在这里，把一句没写完的话停在案上。`;
        },
        choices: () => [
          { label: '站一会儿就走', act: s2 => {
            s2.flags.caveMem = 1;
            return { text: '你没有往洞里搬东西，也没有把名字补全。记得，就已经够了。风从空门里穿过去，像有人侧身让你。', fx: { xj: 4 }, tags: [{ t: '忆起旧洞', c: 'gold' }] };
          } },
        ] },
    );
  }

  function tick(s, emit) {
    if (!keqOn(s) || s.dead) return;
    const k = s.keq;
    if ((k.fail | 0) >= 3) return;
    if ((s.months | 0) < (k.pay | 0)) return;
    const L = (typeof REALMS !== 'undefined') ? REALMS[s.realm].lsScale : 1;
    const base = (k.rank | 0) >= 1 ? 22 : 10;
    const cut = Math.max(0.35, 1 - 0.22 * (k.fail | 0));
    const pay = Math.max(1, Math.round(base * L * cut));
    s.ls = (s.ls | 0) + pay;
    k.pay = (s.months | 0) + 12 * ((typeof REALMS !== 'undefined') ? REALMS[s.realm].T : 1);
    emit && emit({ title: keqTitle(s), text: `凡间的供奉到了。封条上没有你的官职，只有灵石${pay}。宗门的贡献，一个数也没有动。`, cls: 'sys' });
  }

  install();
  return { who, sex, needSex, setWho, ta, shi, call, dress, wantMate, mateSex, mateTa, aliveMate, keq, keqOn, keqTitle, seed, boot, ensure, tick, hasHook };
})();
