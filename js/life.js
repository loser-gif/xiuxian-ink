/* 纸上仙途 · 此生：回响、心魔、喘息、绝笔、所求、平生
   接在因果 / 轮回之上。存档字段 life，旧档迁移为空。 */
'use strict';
const Life = (() => {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const GOALS = [
    { id: 'changsheng', name: '求长生', seal: '生', hint: '白日飞升，方不算辜负这身骨头', judge: s => s.ending === 'ascend' || !!s.ascended },
    { id: 'xuechou', name: '报血仇', seal: '仇', hint: '有一笔账，要在这辈子结清', judge: s => !!(s.life && s.life.vendetta) || s.ending === 'zhenmo' },
    { id: 'diwei', name: '登帝位', seal: '帝', hint: '问鼎人皇，仙凡都要低头', judge: s => s.ending === 'renhuang' },
    { id: 'wendao', name: '问大道', seal: '问', hint: '把那一问问到底，成败其次', judge: s => !!(s.path && s.path.wendao) || s.ending === 'ascend' },
    { id: 'shouyi', name: '守一人', seal: '守', hint: '有人记得你的名字，你也记得', judge: s => !!(s.karma && s.karma.mate) && !(s.bond && s.bond.lost) },
    { id: 'xiaoyao', name: '逍遥归隐', seal: '隐', hint: '放下长生，一叶扁舟便是归处', judge: s => s.ending === 'guiyin' || s.ending === 'huashen' },
    { id: 'zhangmen', name: '掌一门', seal: '掌', hint: '山门的钟，要为你响一次', judge: s => !!(s.sect && (s.sect.rank | 0) >= 6) },
    { id: 'qingshi', name: '留名青史', seal: '史', hint: '史笔写下你时，不敢漏字', judge: s => s.ending === 'quancheng' || s.ending === 'renhuang' || s.ending === 'ascend' || s.ending === 'chuanshuo' },
  ];

  function empty() {
    return {
      goal: null, goalChanges: 0, heart: 0,
      scars: [], deeds: [], seenV: [], xinmo: {},
      annals: [], people: [], thread: '', variant: '', vendetta: 0, bg: 0,
    };
  }
  function L(s) {
    if (!s.life || typeof s.life !== 'object') s.life = empty();
    const o = s.life;
    o.scars = o.scars || []; o.deeds = o.deeds || []; o.seenV = o.seenV || [];
    o.xinmo = o.xinmo || {}; o.annals = o.annals || []; o.people = o.people || [];
    if (o.heart == null) o.heart = 0;
    return o;
  }
  function goalBy(id) { return GOALS.find(g => g.id === id) || null; }
  function goalName(s) { const g = s && s.life && goalBy(s.life.goal); return g ? g.name : ''; }

  function heartWord(n) {
    n = n | 0;
    if (n >= 36) return '仁厚';
    if (n >= 12) return '温润';
    if (n > -12) return '平和';
    if (n > -36) return '孤峭';
    return '杀伐';
  }

  function note(s, rec) {
    if (!s || !rec) return;
    const life = L(s);
    const y = rec.y != null ? (rec.y | 0) : (s.age | 0);
    const t = rec.t || '';
    const d = rec.d || '';
    if (!t && !d) return;
    const last = life.annals[life.annals.length - 1];
    if (last && last.t === t && last.y === y && last.d === d) return;
    life.annals.push({ y, t, d, k: rec.k || '' });
    if (life.annals.length > 120) life.annals.splice(0, life.annals.length - 120);
  }
  function meet(s, name, line) {
    if (!s || !name) return;
    const life = L(s);
    if (life.people.some(p => p.name === name)) return;
    life.people.push({ name, y: s.age | 0, note: line || '' });
    if (life.people.length > 40) life.people.splice(0, life.people.length - 40);
  }

  function tint(s, n) {
    const life = L(s);
    life.heart = clamp((life.heart | 0) + (n | 0), -100, 100);
  }
  const goodKind = k => k === 'save' || k === 'spare';

  function plant(s, spec) {
    if (!s || !spec || !spec.id) return false;
    const life = L(s);
    if (life.deeds.some(d => d.id === spec.id)) return false;
    const years = spec.years != null ? spec.years : (22 + Math.floor(Math.random() * 9));
    life.deeds.push({
      id: spec.id, who: spec.who || '那人', kind: spec.kind || 'save',
      line: spec.line || '', year: s.age | 0, due: (s.months | 0) + years * 12,
      roleGood: spec.roleGood || '', roleBad: spec.roleBad || '', done: 0,
    });
    tint(s, goodKind(spec.kind) ? 10 : -12);
    meet(s, spec.who, spec.line);
    return true;
  }
  function deed(s, id) {
    return s && s.life && (s.life.deeds || []).find(d => d.id === id) || null;
  }
  function seal(s, id) {
    const d = deed(s, id);
    if (d) d.done = 1;
  }
  function dueEvent(s) {
    if (!s || typeof EVENTS === 'undefined') return null;
    const life = L(s);
    let best = null;
    for (const d of life.deeds) {
      if (d.done || (s.months | 0) < d.due) continue;
      if (s.seen && s.seen['echo_' + d.id]) continue;
      if (!best || d.due < best.due) best = d;
    }
    if (!best) return null;
    const ev = EVENTS.find(e => e.id === 'echo_' + best.id);
    if (!ev) return null;
    if (ev.once && s.seen && s.seen[ev.id]) return null;
    return ev;
  }

  /* ---------- 心魔 ---------- */
  function pastOf(s) {
    const life = L(s);
    const ds = (life.deeds || []).filter(d => d.line);
    if (ds.length) return ds[ds.length - 1];
    const ms = (s.marks || []).filter(m => m && (m.d || m.t));
    if (ms.length) {
      const m = ms[ms.length - 1];
      return { who: '', line: m.d || m.t, kind: 'mark', title: m.t || '旧事' };
    }
    return { who: s.name || '你', line: '你第一次在山门外站定，风把衣角吹起来', kind: 'mark', title: '入山' };
  }
  function xinmoPending(s) {
    if (!s || s.dead || s.ascended) return false;
    if (typeof Core === 'undefined' || !Core.bottleneck(s)) return false;
    const life = L(s);
    return !life.xinmo[s.realm];
  }
  function xinmoEvent(s) {
    const life = L(s);
    const past = pastOf(s);
    const who = past.who ? '「' + past.who + '」' : '那个人';
    const heart = life.heart | 0;
    const q = heart >= 16
      ? '你救过的人，可是为了今日这一步？'
      : heart <= -16
        ? '你亏过的人，都在门外等着看你破境。'
        : '这一步踏出去，你还是那时的人吗？';
    const quote = past.line || past.title || '一件你不肯再提的事';
    const realm = s.realm | 0;
    return {
      id: 'xinmo_r' + realm, title: '心魔', seal: '魔', xinmo: true,
      text: () => `识海翻涌，像有人把旧卷重新摊开。你看见当年的自己：${quote}。那张脸慢慢换成你自己的，声音却仍像${who}。「${q}」它并不催你死。它只要你认，或者不认。`,
      choices: () => [
        { label: '把那件事说完', sub: '道心微定', act: s2 => {
          finishXinmo(s2, 'clear');
          tint(s2, 4);
          return { text: `你把${quote}又说了一遍，一个字不改。心魔听完，像雾一样散了。关隘还在，可你知道自己是从哪一条路上走来的。`, fx: { xj: 5 }, afterBreak: true };
        }},
        { label: '不许它再提', sub: '或留暗伤', act: s2 => {
          finishXinmo(s2, 'scar', `你不许心魔提起${past.who || '那件事'}。它停了，伤却留在识海内侧，像一根没拔的刺。`);
          return { text: '你抬手斩断那声音。识海静了，静得发空。破境仍可继续——只是下一次关隘，这根刺还会疼一下。', fx: { xj: -3 }, afterBreak: true };
        }},
        { label: '随口应了它', sub: '心境动摇', act: s2 => {
          finishXinmo(s2, 'scar', `你随口应了心魔。它用你的声音把「${quote}」又念了一遍，像在记账。`);
          tint(s2, -6);
          return { text: '你应了一声。心魔笑了，笑得像你自己。它没有要你的命，只在道心上按了一个指印。这个指印，叫暗伤。', fx: { xj: -6 }, afterBreak: true };
        }},
      ],
    };
  }
  function finishXinmo(s, how, scarText) {
    const life = L(s);
    const realm = s.realm | 0;
    life.xinmo[realm] = how || 'clear';
    if (how === 'scar') {
      const id = 'xm' + realm;
      if (!life.scars.some(x => x.id === id)) {
        life.scars.push({ id, realm, text: scarText || '破境时你躲开了一问，问还在。' });
        if (life.scars.length > 4) life.scars.splice(0, life.scars.length - 4);
      }
      note(s, { t: '暗伤', d: scarText || '识海留刺', k: 'scar' });
    } else {
      note(s, { t: '心魔', d: '你把旧事说完，道心未裂', k: 'xinmo' });
    }
  }
  function scarPen(s) {
    const n = s && s.life && s.life.scars ? s.life.scars.length : 0;
    return Math.min(0.06, n * 0.015);
  }

  /* ---------- 喘息 ---------- */
  const VIGNETTES = [
    { id: 'v_qi', where: 'any', title: '山间对弈', text: '山腰一块平石，已有人摆好了棋，人却不在。你坐下来，替那空位落了一子。风把松针吹进棋盘，你没有拿掉。下到中盘，你忽然不想赢，只把最后一子握在手里，听了一会儿山。' },
    { id: 'v_qin', where: 'any', title: '雨夜听琴', text: '雨落在瓦上，像有人用指节轻轻敲。洞府对面的崖缝里，传来半段琴声，不成曲，只是几个音，来回走。你没有去寻。琴声停的时候，雨也小了。' },
    { id: 'v_xin', where: 'any', title: '旧友来信', text: '信是托人带到山门的，纸边磨毛了。开头只写「见字如晤」，后面三行都是天气，末了才说：你还在就好。没有地址。你把信压在砚下，砚是凉的。' },
    { id: 'v_xi', where: 'cave', title: '溪边洗砚', text: '你把砚拿到溪边洗。墨沉下去，又浮上来，像一条不肯走的小鱼。洗到水清，你发现自己并没有要写的字，只是想让手在冷水里多停一会儿。' },
    { id: 'v_yun', where: 'road', title: '看云', text: '路上没有人。云从东边的峰移到西边的峰，慢得像不肯赶路。你靠着一棵枯树站了一盏茶的工夫，把要办的事忘了半件，又自己想起来。想起来的时候，并不急。' },
    { id: 'v_song', where: 'any', title: '听松', text: '松涛来的时候，你正在吐纳的间隙里发呆。风过一层，松针便响一层，像有人在很远的地方翻书。你没有把这算进修为。有些声音，一算就算没了。' },
    { id: 'v_cha', where: 'road', title: '茶摊', text: '岔路口一个茶摊，摊主是个不爱说话的老人。茶是粗的，杯子缺了口。你喝完，把一枚最小的灵石压在杯下。老人摇头，把灵石推回来，又给你续了半杯。' },
    { id: 'v_yue', where: 'cave', title: '月下独酌', text: '月好，你却只倒了一小杯。酒入喉是热的，月在杯沿上是凉的。你忽然想起一个名字，想了想，没有喊出声。洞外的虫子替你喊了两声。' },
    { id: 'v_xue', where: 'cave', title: '雪夜补衣', text: '雪把窗纸映白。你发现袖口裂了一线，便就着灯补。针脚歪歪扭扭，不像修士的手。补完你笑了一下：长生若是这样的夜晚连起来的，倒也不算亏。' },
    { id: 'v_yu', where: 'road', title: '船头看鱼', text: '渡船很慢。鱼在船头的影子里翻白，又沉下去。舟子问你去哪一岸，你说随它。舟子便不再问，只把桨放平，让船自己在江心里转了半圈。' },
    { id: 'v_jing', where: 'cave', title: '灯下抄经', text: '你抄了半页经，抄到一个「空」字，笔停住。灯花爆了一下。你没有把那个字写完，只在边上点了一个墨点，像给未来的自己留一扇小窗。' },
    { id: 'v_zhong', where: 'road', title: '山寺午钟', text: '午钟从很远的庙里传来，一下，又一下。你数到第七下便数乱了。乱了也好。你在石阶上坐到钟声彻底散尽，膝盖上落了一层细灰，像雪，不是雪。' },
    { id: 'v_cao', where: 'any', title: '与童子斗草', text: '山门外两个童子斗草，见你便要你做裁判。你蹲下去，看了很久，判两根都赢。童子笑你不会玩。你把那两根草夹进书里，书因此合不严。' },
    { id: 'v_ye', where: 'road', title: '一片落叶', text: '一片叶子落在你掌心，脉络还清楚。你举起来对着天看，天便被叶脉分成许多小小的块。你把叶子放回路上，让下一个人也能捡到，或者让风先捡到。' },
    { id: 'v_deng', where: 'road', title: '渡口等船', text: '船不来。你在渡口的石桩上坐着，看对岸的灯一盏盏亮起。有人问你等谁，你说等船。那人笑了笑，把自己的斗笠借你。船来的时候，斗笠的主人已经走了。' },
    { id: 'v_di', where: 'any', title: '雾中闻笛', text: '雾厚得看不见路。笛声从雾的另一头来，短短的，像在问路。你用指节在剑鞘上应了两下。笛声便转了个弯，往你这边近了一近，又远了。你们都没有走出雾。' },
    { id: 'v_shu', where: 'cave', title: '晒书', text: '你把受潮的书页摊在石上晒。蚂蚁爬过一行字，你没有赶。字被晒暖了，墨味淡淡地起来。你忽然觉得，这些年赶路赶得太凶，书都还没有真正被太阳看过。' },
    { id: 'v_he', where: 'any', title: '喂鹤', text: '鹤落在洞顶，不叫，只侧头看你。你把吃剩的果核放在石上。鹤不吃果核，却把一只脱落的羽毛留在那里，像交换。你把羽毛夹进书里，跟那两根草作伴。' },
  ];
  function pull(s, where) {
    const life = L(s);
    const pool = VIGNETTES.filter(v => !life.seenV.includes(v.id) && (v.where === 'any' || v.where === where));
    if (!pool.length) return null;
    const v = pool[Math.floor(Math.random() * pool.length)];
    life.seenV.push(v.id);
    note(s, { t: v.title, d: v.text.slice(0, 28), k: 'breath' });
    return { title: v.title, text: v.text, id: v.id };
  }
  function takeVignette(s, where) {
    if (!s || s.dead) return null;
    const life = L(s);
    if (where === 'biguan') {
      life.bg = (life.bg | 0) + 1;
      if (life.bg >= 3 && life.bg % 3 === 0) return pull(s, 'cave');
      return null;
    }
    if (where === 'road') {
      if ((s.realm | 0) < 1 && (s.age | 0) < 22) return null;
      if (dueEvent(s)) return null;
      if (Math.random() > 0.32) return null;
      return pull(s, 'road');
    }
    return null;
  }
  function shouldAskGoal(s) {
    if (!s || s.dead || s.ascended || (s.flags && s.flags.trial)) return false;
    const life = L(s);
    if (!life.goal) return false;
    if ((life.goalChanges | 0) >= 2) return false;
    s.flags = s.flags || {};
    const key = 'goalAsk' + (s.realm | 0);
    if (s.flags[key]) return false;
    if ((life.bg | 0) > 0 && life.bg % 8 === 0 && (s.realm | 0) >= 1) {
      s.flags[key] = 1;
      return true;
    }
    return false;
  }
  function goalShiftEvent(s) {
    const cur = goalBy(L(s).goal);
    const alt = GOALS.filter(g => g.id !== (cur && cur.id));
    const pick2 = alt.sort(() => Math.random() - 0.5).slice(0, 3);
    return {
      id: 'goal_shift', title: '闭关问心', seal: '问', guide: true,
      text: () => `灯花爆了两次。你在黑暗里忽然问自己：此生所求，还是「${cur ? cur.name : '那一件事'}」吗？洞外的风不回答。回答的只有你。`,
      choices: () => [
        { label: '仍是此愿', sub: cur ? cur.name : '', act: () => ({ text: `你把「${cur ? cur.name : '旧愿'}」又在心里默了一遍。灯芯稳住了。愿还是那一个愿，人却比进来时静。`, fx: { xj: 2 } }) },
        ...pick2.map(g => ({
          label: '改求 · ' + g.name, sub: '一生可改两次',
          act: s2 => {
            setGoal(s2, g.id, true);
            return { text: `你把旧愿轻轻放下，像放下一块已经温过的石头。此生所求，改作「${g.name}」。洞里的黑暗没有反对。`, fx: { xj: 1 } };
          },
        })),
      ],
    };
  }

  function setGoal(s, id, changed) {
    const g = goalBy(id); if (!g || !s) return null;
    const life = L(s);
    const prev = life.goal;
    life.goal = g.id;
    if (changed && prev && prev !== g.id) life.goalChanges = (life.goalChanges | 0) + 1;
    note(s, { t: '此生所求', d: g.name, k: 'goal' });
    return g;
  }
  function achieved(s, kind) {
    if (!s || !s.life || !s.life.goal) return null;
    const g = goalBy(s.life.goal); if (!g) return null;
    const snap = Object.assign({}, s, { ending: kind || s.ending });
    let ok = false;
    try { ok = !!g.judge(snap); } catch (e) { ok = false; }
    return { goal: g, ok };
  }
  function judgeLine(s, kind) {
    const a = achieved(s, kind);
    if (!a) return '';
    return `此生所求「${a.goal.name}」。卷终之时，此事${a.ok ? '已遂' : '未竟'}。`;
  }

  function variantOf(s, kind) {
    const scars = s && s.life && s.life.scars ? s.life.scars.length : 0;
    const tested = s && s.life && s.life.xinmo ? Object.keys(s.life.xinmo).length : 0;
    if (kind === 'ascend' && tested >= 2 && scars === 0) return 'clear';
    if ((kind === 'ascend' || kind === 'rumo' || kind === 'zuohua' || kind === 'yunluo' || kind === 'bingjie') && scars >= 1) return 'scar';
    return '';
  }
  function variantLine(s, kind) {
    const v = variantOf(s, kind);
    const n = s && s.life && s.life.scars ? s.life.scars.length : 0;
    if (v === 'clear' && kind === 'ascend') return '道心澄明。心魔问过你的旧事，你都答了，没有留下暗伤。';
    if (v === 'scar' && kind === 'ascend') return `飞升的光里，仍夹着${cn(n)}道未愈的暗伤。天门没有因此关上，只是你自己知道。`;
    if (v === 'scar' && kind === 'rumo') return '暗伤先行，心魔后至。你不是一夜之间变成这样的。';
    if (v === 'scar' && kind === 'zuohua') return '你坐化时，识海里那根刺还在。它没有杀死你，只是陪你到了最后。';
    if (v === 'scar' && kind === 'yunluo') return '雷落下来之前，暗伤先疼了一下。像在提醒你：有一问，你还没答。';
    if (v === 'scar' && kind === 'bingjie') return '真灵脱出时，暗伤没有跟着肉身一起碎。它轻，所以走得及。';
    return '';
  }

  function juebi(s, kind) {
    const name = (s && s.name) || '无名';
    const age = typeof cn === 'function' ? cn(s.age | 0) : String(s.age | 0);
    const past = pastOf(s);
    const quote = past.line || '一件没有写完的事';
    const who = past.who || '一个没有留下姓名的人';
    const g = goalName(s);
    const gBit = g ? `所求「${g}」` : '没有写下的那一愿';
    const scar = s.life && s.life.scars && s.life.scars[0];
    let text = '', thread = '';
    if (kind === 'zuohua') {
      text = `${name}于${age}岁坐化。案上未写完的，是${gBit}。笔停处，还记着：${quote}。山风进门，把灯吹灭。`;
      thread = `来世若在灯灭之前醒来，手里或许还捏着这截没写完的炭。`;
    } else if (kind === 'rumo') {
      text = `${age}岁入魔那夜，${name}认得的最后一张脸，像${who}。心魔用你自己的声音，把「${quote}」念完。${scar ? '暗伤在那之前就在了。' : '你分不清哪一句是自己。'}`;
      thread = `来世若梦回此处，别答应那个声音。`;
    } else if (kind === 'yunluo') {
      text = `破关失利，${age}载至此。${name}留下的最后一念不是境界，是${quote}。同门把名字从簿上划去时，划得很慢。`;
      thread = `来世若再拜这座山，腰间或有一道旧的灼痕，摸得到，别人看不见。`;
    } else if (kind === 'bingjie') {
      text = `玉符碎时，${name}把${gBit}咽了回去。肉身在雷里散开，真灵却记得${who}，也记得${quote}。`;
      thread = `来世入道之时，或能应一声从前没应完的名字。`;
    } else if (kind === 'guiyin') {
      text = `${name}放下长生时，${age}岁。舟上没有带功法，只把「${quote}」在心里过了一遍，然后不再过。`;
      thread = `来世若在江上看见空船，不必上，看一眼就好。`;
    } else if (kind === 'ascend') {
      text = `${name}飞升前回了一次头。云下很安静。安静里有一句没带走的话：${quote}。`;
      thread = g ? `来世不必再求「${g}」。若还记得，就当是风。` : `来世若还想飞，先记得自己曾经低头看过人间。`;
    } else if (kind === 'renhuang') {
      text = `登基那日，${name}在诏书空白处写了很小的一行，写的是${who}，又涂掉了。史官没有看见。`;
      thread = `来世若听见礼乐，可以不跪。那一行小字，还在涂掉的地方。`;
    } else if (kind === 'quancheng') {
      text = `${name}摄政多年，印玺温热。夜里独处时，仍会想起${quote}。权柄没有把这件事磨平。`;
      thread = `来世若再握印，先问自己还记不记得那一句。`;
    } else if (kind === 'huashen') {
      text = `${name}于${age}岁不再赶路。名字刻进山石，浅处会自己长深。此后过路的人在祠前放一枚干果，风会替你点头。`;
      thread = `来世若在山神祠前歇脚，不必报名。山还认得你的脚步。`;
    } else if (kind === 'zhenmo') {
      text = `${age}岁那年，${name}坐上了那道裂口。剑横在膝上，不是为了杀，是做一个很沉的镇纸。潮在身下慢慢安静。安静，就是回答。`;
      thread = `来世若听见西边忽然不叫的鸟，别往裂口里看太久。那里已经有人坐着。`;
    } else if (kind === 'chuanshuo') {
      text = `${name}把这一生删到很薄，放进石室，没有在封面上署名。${age}岁以后，世上开始用别人的嘴讲你。讲着讲着，就成了真的。`;
      thread = `来世若在书摊底翻到没有署名的册子，读半页即可。读完，还是去活。`;
    } else {
      text = `${name}的这一卷在${age}岁合上。卷末没有境界，只有${quote}。`;
      thread = `来世翻开新卷时，旧卷的最后一行还会透上来。`;
    }
    if (s && s.life) s.life.thread = thread;
    return { text, thread };
  }

  function compose(s, kind, base) {
    const j = juebi(s, kind);
    const v = variantLine(s, kind);
    if (s && s.life) s.life.variant = variantOf(s, kind);
    const judge = judgeLine(s, kind);
    return {
      juebi: j.text,
      thread: j.thread,
      variant: v,
      judge,
      full: [base, j.text, v, judge].filter(Boolean).join(''),
    };
  }

  function chronicle(s) {
    const life = s ? L(s) : empty();
    const years = {};
    const add = (y, item) => {
      const k = String(y | 0);
      (years[k] = years[k] || []).push(item);
    };
    (life.annals || []).forEach(a => add(a.y, { t: a.t, d: a.d, k: a.k || '' }));
    (s && s.marks || []).forEach(m => {
      if (!m) return;
      const dup = (life.annals || []).some(a => a.t === m.t && (a.y | 0) === (m.y | 0));
      if (!dup) add(m.y, { t: m.t, d: m.d || '', k: m.c || '' });
    });
    const ys = Object.keys(years).map(n => n | 0).sort((a, b) => a - b);
    return {
      heart: heartWord(life.heart | 0),
      heartN: life.heart | 0,
      goal: goalBy(life.goal),
      scars: life.scars || [],
      people: life.people || [],
      deeds: life.deeds || [],
      years: ys.map(y => ({ y, items: years[String(y)] })),
    };
  }

  return {
    GOALS, empty, ensure: L, goalBy, goalName, heartWord,
    note, meet, tint, plant, deed, seal, dueEvent,
    xinmoPending, xinmoEvent, finishXinmo, scarPen, pastOf,
    takeVignette, shouldAskGoal, goalShiftEvent, setGoal, achieved, judgeLine,
    variantOf, variantLine, juebi, compose, chronicle,
  };
})();

/* —— 早期抉择：种下回响。二十至三十载后，以新的身份回来。 —— */
(function () {
  if (typeof EVENTS === 'undefined') return;
  const early = s => (s.age | 0) < 56 && (s.realm | 0) <= 1;
  const fresh = id => s => early(s) && !Life.deed(s, id);

  const specs = [
    { id: 'ahe', title: '崖上', seal: '崖', who: '阿禾',
      roleGood: '一座小山门的掌门', roleBad: '来寻仇的弟弟',
      text: '山道拐弯处，一个孩子扒在崖沿上，手指已经白了。下面是雾。他看见你，没喊救命，只是很轻地说：「我叫阿禾。」',
      save: { label: '拉他上来', line: '你在崖边拉住了一个名叫阿禾的孩子', kind: 'save',
        out: '你趴下去，抓住他的腕。石头磨破了你的袖口。孩子上来之后，把额头在你膝上碰了碰，转身跑进雾里，跑得很快，像怕你后悔。' },
      bad: { label: '此事与我无关', line: '崖边的阿禾向你伸手，你没有拉', kind: 'wrong',
        out: '你停了一停，还是走了。身后没有哭声。只有一小块石头，很久以后才落进雾里。' } },
    { id: 'shengu', title: '伤修', seal: '伤', who: '沈孤',
      roleGood: '坊市里护短的掌柜', roleBad: '前来清算的徒弟',
      text: '官道旁倒着一个修士，丹田的血把土染深了一块。他睁开眼，声音哑：「药……或是，你把我身上的袋子拿走也行。我叫沈孤。」',
      save: { label: '分他一枚药', line: '你把伤药分给了路旁的沈孤', kind: 'save',
        out: '你把回春的意思分了他半分——没有丹，便是真气。他缓过来，把一只缺角的玉佩塞进你手里：「不必还。记住我还活着就行。」' },
      bad: { label: '拿走袋子', line: '你在沈孤伤重时拿走了他的袋子', kind: 'wrong',
        out: '袋子不重。人不再看你。你走出很远，才发现袋里只有半块干粮和一封没写完的家书。家书上的称呼是「师父」。' } },
    { id: 'qingzhen', title: '镇疫', seal: '疫', who: '青石镇',
      roleGood: '在朝中记得你的女子', roleBad: '堵在路口的幸存者之子',
      text: '青石镇的牌坊上贴着封条。里面有咳嗽，有药味，也有一个老人拦住你：「仙长若肯留一夜，孩子们或许还有一个能看见明天。你若走，我们也不怨。」',
      save: { label: '留下，施一夜针', line: '瘟疫那年，你在青石镇留了一夜', kind: 'save',
        out: '你留了一夜。针是笨的，火是热的。天明时死了两个，活了七个。老人没有道谢，只把你的碗洗得很干净。' },
      bad: { label: '绕镇而走', line: '青石镇瘟疫时，你绕路走了', kind: 'wrong',
        out: '你绕开牌坊。风从镇里追出来，药味淡得像没有发生。你告诉自己，修士不该沾凡间的病。这句话，说完并不舒服。' } },
    { id: 'zhouwan', title: '茶债', seal: '茶', who: '周晚',
      roleGood: '听雨楼的管事', roleBad: '来收旧账的儿子',
      text: '茶摊的女子把账簿推到你面前，耳根红了：「周晚。这名字不值钱。债倒是值钱。客官若肯替我垫上，茶不要钱。若不肯，当我没说。」',
      save: { label: '替她垫上', line: '你替茶摊的周晚垫了一笔债', kind: 'save',
        out: '你把灵石按在账簿上。她把最好的那罐茶给你满上，手很稳。临走只说：「我记性好。」' },
      bad: { label: '压价，拿走茶', line: '你压低了周晚的茶价，还拿走了罐子', kind: 'wrong',
        out: '你把价压到可笑，又把罐子提走。她没有拦。罐沿还留着她的指温。你走出十步，指温就没了。' } },
    { id: 'fox', title: '伤狐', seal: '狐', who: '白狐',
      roleGood: '山中托梦的灵', roleBad: '来索命的狐子',
      text: '林子里一只白狐夹着后腿，眼里有人的光。它没有逃，只把伤口转向你，像把一件很难的事交到你手上。',
      save: { label: '为它包扎，放走', line: '你放走了一只受伤的白狐', kind: 'spare',
        out: '你用布条缠住那条腿。狐在你掌心停了停，随即没入草里，连血都收得干净。夜里你梦见一条雪白的路，路的尽头没有人。' },
      bad: { label: '取它内丹', line: '你取走了白狐的内丹', kind: 'kill',
        out: '丹很小，温热。狐看着你，一直看到光从眼里灭掉。你把丹收好，手却洗了很久。' } },
    { id: 'linzhao', title: '背锅', seal: '责', who: '林照',
      roleGood: '记你情分的执事', roleBad: '当众揭旧账的徒弟',
      text: '执事堂里，一个与你同阶的弟子林照跪着。打碎的是长老的壶。他看你一眼，那一眼不是求你，是认了。壶其实是你袖口带倒的。',
      save: { label: '说是我碰的', line: '你替林照认下了打碎的壶', kind: 'save',
        out: '你上前说是自己。责罚不重，是一个月的杂役。林照在廊下等你，把一块干净的帕子递过来，什么也没讲。' },
      bad: { label: '看着他认', line: '壶是你碰倒的，你看着林照认了', kind: 'wrong',
        out: '你没有出声。林照被罚去挑水。水声在夜里响了很久。你躺着，觉得那声音是冲着你的窗口来的。' } },
    { id: 'beggar', title: '老乞', seal: '乞', who: '老乞',
      roleGood: '隐于尘中的前辈', roleBad: '来讨那口饭的传人',
      text: '山门石阶下坐着一个老乞，碗是空的。他不看你的储物袋，只看你的眼睛：「小友，分一口，或者把我赶走。两样我都受过。」',
      save: { label: '分他半块干粮', line: '你把半块干粮分给了阶下的老乞', kind: 'save',
        out: '干粮是硬的。他嚼得很慢，像在品尝一件很贵的东西。嚼完他笑：「好。这口饭，我替你记到很后面。」' },
      bad: { label: '赶走他', line: '你把石阶下的老乞赶走了', kind: 'wrong',
        out: '你说山门不留闲人。他站起来，膝响了一声，走的时候碗还是空的。石阶上留下一个圆印，像月亮，很快被扫掉。' } },
    { id: 'qiuniang', title: '渡口', seal: '渡', who: '秋娘',
      roleGood: '渡口留灯的坊主', roleBad: '来问罪的孩子',
      text: '渡口涨水。一个女子抱着包袱站在没膝的水里，船已经离岸半丈。她喊：「秋娘！我叫秋娘！船上可还有位子？」',
      save: { label: '把船撑回去', line: '涨水那天，你把船撑回去接了秋娘', kind: 'save',
        out: '你夺过桨，把船抵回岸。水冷。秋娘上来时在抖，把一件干的披风硬披到你身上：「我还不起船钱。我还得起一次灯。」' },
      bad: { label: '让舟子开船', line: '涨水那天，你让船先走，秋娘留在水里', kind: 'wrong',
        out: '船离开岸。秋娘的声音被水声盖住。你没有回头。披风是干的，心口却像进了水。' } },
    { id: 'zhaoheng', title: '路费', seal: '资', who: '赵珩',
      roleGood: '京中为你留名的书生', roleBad: '带着旧恨的门客',
      text: '一个书生在凉亭里数铜钱，数完又数，还是不够。他抬头，很不好意思：「在下赵珩。不是骗子。只是路费真的不够。仙长看人，应当看得出来。」',
      save: { label: '借他路费', line: '你借了书生赵珩一笔路费', kind: 'save',
        out: '你把灵石换成他听得懂的银子。他写下借据，字很工整，连你的名字都问了两遍，怕写错。' },
      bad: { label: '揭穿，并赶走', line: '你认定赵珩是骗子，当众赶走了他', kind: 'wrong',
        out: '你说他眼会转，不是好人。亭里的人笑起来。赵珩把铜钱收好，走的时候背很直。借据没有写成，恨意倒是写成了。' } },
    { id: 'aman', title: '猎户', seal: '弓', who: '阿蛮',
      roleGood: '山中认你的猎女', roleBad: '来讨弓的年轻猎人',
      text: '猎户的女儿阿蛮把父亲背到你脚下。父亲还有气。她的弓是好弓，她自己的手在抖：「仙长若肯看一眼，这张弓可以留下。人，我想带回。」',
      save: { label: '救人，弓还给她', line: '你救了阿蛮的父亲，把弓还给了她', kind: 'save',
        out: '你看了伤，喂了一点灵水。父亲的气匀了。阿蛮把弓收回去，向你鞠了一躬，深得像把整个山都按进那一躬里。' },
      bad: { label: '收下弓，不多问', line: '你收下阿蛮的弓，没有救她的父亲', kind: 'wrong',
        out: '弓确实好。你收下了。阿蛮没有再求，背起父亲往回走。弓在你手里很轻，轻得让你后来不太敢挽。' } },
  ];

  specs.forEach(sp => {
    EVENTS.push({
      id: 'deed_' + sp.id, title: sp.title, seal: sp.seal, w: 6, once: true, rm: [0, 1],
      wf: s => {
        const n = (s.life && s.life.deeds && s.life.deeds.length) || 0;
        if ((s.age | 0) < 48 && (s.realm | 0) <= 1 && n < 6) return 16;
        return 5;
      },
      cond: fresh(sp.id),
      text: () => sp.text,
      choices: () => [
        { label: sp.save.label, sub: '', act: s => {
          const ok = Life.plant(s, { id: sp.id, who: sp.who, kind: sp.save.kind, line: sp.save.line, roleGood: sp.roleGood, roleBad: sp.roleBad, years: 22 + Math.floor(Math.random() * 9) });
          return { text: sp.save.out, fx: { xj: 4, xw: 0.05 }, tags: ok ? [{ t: '回响已埋', c: 'gold' }] : [] };
        }},
        { label: sp.bad.label, sub: '', act: s => {
          const ok = Life.plant(s, { id: sp.id, who: sp.who, kind: sp.bad.kind, line: sp.bad.line, roleGood: sp.roleGood, roleBad: sp.roleBad, years: 22 + Math.floor(Math.random() * 9) });
          return { text: sp.bad.out, fx: { xj: -3 }, tags: ok ? [{ t: '回响已埋', c: 'gold' }] : [] };
        }},
      ],
    });

    EVENTS.push({
      id: 'echo_' + sp.id, title: '回响 · ' + sp.who, seal: '响', w: 8, once: true, rm: [0, 4],
      cond: s => { const d = Life.deed(s, sp.id); return !!(d && !d.done && s.months >= d.due); },
      text: s => {
        const d = Life.deed(s, sp.id);
        const good = d && (d.kind === 'save' || d.kind === 'spare');
        const role = good ? sp.roleGood : sp.roleBad;
        const years = d ? Math.max(1, Math.round((s.months - (d.year * 12)) / 12)) : 20;
        if (!good && typeof Core !== 'undefined' && Core.showFoe) Core.showFoe(s, { rel: 0 }, { name: role, title: '旧怨' });
        return `距你${d ? d.line : '遇见' + sp.who}，约莫${typeof cn === 'function' ? cn(years) : years}年。${sp.who}没有以旧模样出现。来的是${role}。对方看你的眼神，仍停在当年那一刻。`;
      },
      choices: s => {
        const d = Life.deed(s, sp.id);
        const good = d && (d.kind === 'save' || d.kind === 'spare');
        if (good) {
          return [
            { label: '认下当年', sub: '', act: s2 => {
              Life.seal(s2, sp.id);
              const fx = { xj: 6 };
              if (sp.id === 'linzhao' && s2.sect && s2.sect.org) fx.gx = 36;
              else if (sp.id === 'qingzhen' && s2.court && (s2.court.rank | 0) >= 0) fx.xj = 4;
              else if (sp.id === 'beggar') fx.btBuff = 0.02;
              else fx.item = { '清心丹': 1 };
              if (sp.id === 'zhaoheng') fx.ls = 2;
              return { text: `${sp.roleGood}向你拱手。没有大礼，只有一句：「当年那件事，我一直记着。」你发现有些债，是用很多年来还的，还的时候轻得像一阵风。`, fx };
            }},
            { label: '说已经忘了', sub: '', act: s2 => {
              Life.seal(s2, sp.id);
              return { text: `对方愣了一愣，随即笑：「忘了也好。我记得就够。」人走了。你站在原地，觉得「忘了」两个字，并不像你以为的那样轻。`, fx: { xj: 1 } };
            }},
          ];
        }
        return [
          { label: '把旧账说开', sub: '',             act: s2 => {
              Life.seal(s2, sp.id);
              return { text: `你没有拔剑。你把当年的事原样说了，包括你不体面的那一部分。${sp.roleBad}听完，恨意像潮水退了一寸：「……至少你还记得。」此账未清，可也不必在今天见血。`, fx: { xj: 3 } };
            }},
          { label: '拔剑相向', sub: '斗法', odds: 0.5, act: s2 => {
            Life.seal(s2, sp.id);
            if (typeof Core !== 'undefined' && Core.fightAct) {
              if (!s2.evFoe) Core.showFoe(s2, { rel: 0 }, { name: sp.roleBad, title: '旧怨' });
              const r = Core.fightAct(s2, {
                name: sp.roleBad,
                base: 0.5,
                win: { text: `那一战不长。${sp.roleBad}败了，却把一句话留下：「阿谁若死了，还有下一个。」你赢了架，没赢那句话。`, fx: { xj: 2, xw: 0.04 } },
                lose: { text: `${Core.foeStr(s2)}的攻势里夹着旧恨。你退开时，袖上有血，不全是你的。对方没有追：「记住就行。」`, fx: { xj: -4 } },
              });
              if (s2.life && s2.life.goal === 'xuechou' && r.fight && r.fight.tier !== 'lose') s2.life.vendetta = 1;
              return r;
            }
            return { text: '剑光一闪，旧怨又多了一层。', fx: { xj: -2 } };
          }},
        ];
      },
    });
  });
})();
if (typeof module !== 'undefined') module.exports = Life;
