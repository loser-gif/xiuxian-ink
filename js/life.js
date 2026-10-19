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
    o.rescues = Array.isArray(o.rescues) ? o.rescues : [];
    o.rescueQ = Array.isArray(o.rescueQ) ? o.rescueQ : [];
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
  function xinmoFacts(s) {
    const life = L(s);
    const past = pastOf(s);
    const mate = (typeof mateName === 'function' && mateName(s)) || '';
    const lost = !!(s.bond && s.bond.lost);
    let foe = '';
    if (s.karma && s.karma.foe && typeof NPCS !== 'undefined' && NPCS[s.karma.foe]) foe = NPCS[s.karma.foe].name;
    const sect = (s.sect && s.sect.org && typeof ORGS !== 'undefined' && ORGS[s.sect.org]) ? ORGS[s.sect.org].name : '';
    const goal = goalName(s);
    const scar = (life.scars && life.scars.length && life.scars[life.scars.length - 1].text) || '';
    const origin = s.origin || '';
    return { life, past, mate, lost, foe, sect, goal, scar, origin, quote: past.line || past.title || '一件你不肯再提的事' };
  }
  function xinmoLines(s) {
    const f = xinmoFacts(s);
    const q = f.quote;
    const realms = [
      [
        `识海里先响起的是风，像你离开家那天的风。有个声音用你自己的嗓子问：你答应过要回来的那一句，还算数吗？它把「${q}」摊在你面前。`,
        f.origin === 'xiaohuan'
          ? '宫墙的灯又亮了一盏。心魔坐在灯下，问你还是不是那个把灯放低的人。它不要你的命，只要你承认：你听过那一声很小的哭。'
          : f.origin === 'moyi'
            ? '血衣的布纹在识海里硬得像刀。心魔问：你留下它，是为了记得，还是为了有一天把它还给谁？'
            : `山门外的石阶还在。心魔蹲在第一级上，像个等你的人：「炼气这一步，你是为自己走的，还是为了不再回去？」旁边摊着旧事：${q}。`,
        f.goal ? `心魔把「${f.goal}」三个字写在雾上，又擦掉。「你现在连气都没炼完。这一愿，是真的，还是怕自己没事可做？」` : `心魔学着你的声音，把「${q}」念得很慢。它问：若这一步踏出去，你还认不认门槛外的自己。`,
      ],
      [
        f.mate && !f.lost
          ? `筑基的关隘里站着${f.mate}。不是真人，是你记得的那个站法。心魔说：「你筑的这座基，有一半是给这个人留的位置。位置若空了，基还在不在？」`
          : f.lost && f.mate
            ? `识海里有一只空杯。心魔把杯转过来，杯底写着${f.mate}的名字。「人已经不在了。你还把道基砌在一个空位上。」`
            : `道基将成未成。心魔在基石上敲了敲：「这一基，是你自己选的，还是被日子推着走的？」它把「${q}」压在石下，让你看见。`,
        f.foe ? `${f.foe}的声音从关隘另一头传来，不像仇，倒像提醒。「你筑基的时候，可还记着这一剑？」心魔笑：「记着，基就歪一点。不记，你就不是你。」` : `心魔把你这些年的选择铺成一条路。「${q}」。它问：筑基之后，这条路还走不走得回去。`,
        f.sect ? `${f.sect}的钟在识海里响了一下。心魔问：「钟若是为你响，你承不承得起？钟若不为你响，你这基又算谁的？」` : '心魔不催你死。它只把一只空碗放在关前：「基要筑在实处。你碗里现在是空的。空，也能当基吗？」',
      ],
      [
        f.goal ? `金丹将凝。心魔把「${f.goal}」写进丹纹里，一笔一笔。「这一愿若是假的，丹会裂。你现在还敢说它是真的吗？」` : `丹光里照出一张旧脸。心魔说：「凝丹的人，不该再躲${q}。躲，丹就有裂纹。」`,
        f.mate && !f.lost
          ? `${f.mate}的呼吸在识海里慢了半拍，和你不一样。心魔问：「两个人的息，凝得进同一枚丹吗？凝不进，你舍哪一边？」`
          : f.scar
            ? `旧伤在丹光里发亮。心魔念你留下的那句：「${f.scar}」它问：带伤凝丹，丹是你的，还是伤的？`
            : `心魔坐在丹炉边上，像个不请自来的丹师。「${q}」。它说这一笔若写进丹里，你后半辈子都要认。`,
        f.foe ? `仇人的名字在丹纹上绕了一圈。心魔说：「${f.foe}若死在你前面，这枚丹还凝不凝？若不死，你的丹是不是为他准备的刀？」` : '心魔把一枚空丹托在掌心。「金丹一成，很多路就回不去了。你回不去的那条，叫什么名字？」',
      ],
      [
        f.lost && f.mate
          ? `元婴出窍的那一瞬，你看见${f.mate}站在很远的地方，不进来。心魔小声说：「婴可以离体。人不能。你还要不要把这个名字带出去？」`
          : f.mate
            ? `元婴将成。心魔让你看${f.mate}的背影：「婴若离体，你还回不回得来这具坐在人身边的壳？回不来的话，先说一声。」`
            : `识海忽然很宽。心魔站在远处，声音却近：「元婴一出，你就不再只是这个身体里的人。${q}——这件事，你带不带出去？」`,
        f.goal === '守一人' ? '心魔问得很轻：「你说要守一人。元婴能守人，也能把人守丢。你守的是人，还是守这个念头？」' : f.goal ? `心魔把「${f.goal}」放在婴影前面。「出了这关，所求会变重。你还抬得动吗？」` : `心魔不化形。它只用你的声音说：「${q}」。然后问：这句话，配不配被一具元婴记住。`,
        f.sect ? `${f.sect}的山门在识海里缩小成一粒。心魔问：「你若成了婴，山门还是家，还是你路过的一座山？」` : '心魔指了指你留下的暗伤：「婴最怕的不是雷，是你自己不肯看的那一寸。看，或者带着它出去。你选。」',
      ],
      [
        f.goal === '求长生' ? '化神的门槛上没有人。心魔却在。「长生若是真的，你从前亏过的人，要在哪一年还？还不起，这一步就是逃。」' : f.goal ? `天风里只剩一句：「${f.goal}」。心魔说：「到了这里，所求若还只是一句话，你就还没有准备好让它变成你。」` : `心魔终于用你现在的脸说话。「${q}」。它问：这一步之后，还有没有一件事值得你停留。`,
        f.lost && f.mate
          ? `${f.mate}没有出现。心魔偏要你想起这个名字。「飞升的人，常常把名字落在山下。你落不落？」`
          : f.mate
            ? `${f.mate}在风里说了一句听不清的话。心魔替你翻译：「若你上去了，谁在下面记得你？」它不等你答。`
            : f.foe
              ? `${f.foe}的影子被风吹薄。心魔说：「仇到了这一境，已经轻得可以不报。不报，你还是你吗？」`
              : '心魔把你这一生的选择收成一页。「页要是合上，人就只剩路。你还想在页边上留一个名字吗？」',
        f.scar ? `最后一问很短。心魔点着你的暗伤：「${f.scar}」它说，带着这个上去，天会看见。不带，你就少了一块自己。` : '心魔不再问旧事。它只问：「你还怕不怕死？」问完，它就站在那里，等你用自己的声音回答。',
      ],
    ];
    const realm = Math.max(0, Math.min(4, s.realm | 0));
    const lines = realms[realm].filter(Boolean);
    const n = (s.months | 0) + (s.age | 0) + realm * 3;
    return { line: lines[n % lines.length], quote: q, who: f.past.who || '' };
  }
  function xinmoEvent(s) {
    const picked = xinmoLines(s);
    const quote = picked.quote;
    const realm = s.realm | 0;
    return {
      id: 'xinmo_r' + realm, title: '心魔', seal: '魔', xinmo: true,
      text: () => picked.line,
      choices: () => [
        { label: '把那件事说完', sub: '道心微定', act: s2 => {
          finishXinmo(s2, 'clear');
          tint(s2, 4);
          return { text: `你把「${quote}」又说了一遍，一个字不改。心魔听完，像雾一样散了。关隘还在，可你知道自己是从哪一条路上走来的。`, fx: { xj: 5 }, afterBreak: true };
        }},
        { label: '不许它再提', sub: '或留暗伤', act: s2 => {
          finishXinmo(s2, 'scar', `你不许心魔提起${picked.who || '那件事'}。它停了，伤却留在识海内侧，像一根没拔的刺。`);
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

  const RESCUES = [
    { id: 'nvxiu', echo: 1,
      text: () => '林中有一行血迹，蜿蜒没入草丛。你循迹而去，见一名女修倚树而坐，面如金纸，腰间储物袋鼓鼓囊囊。她勉力睁眼看你，手按剑柄，却已无力拔出。',
      choices: s => [
        { label: '渡气施救', sub: '耗损修为', act: s2 => { takeRescue(s2, RESCUES[0]); return Math.random() < 0.75
          ? { text: '你为她渡入灵力，守了一夜。天明时她已能起身，取出一只锦囊相赠：「救命之恩，他日必报。」她御剑而去，衣袂如云。', fx: { xw: -0.15, xj: 8, luck: 1, ls: 30, item: Math.random() < 0.5 ? { '回春丹': 1 } : { '聚气丹': 1 } } }
          : { text: '她伤势稍缓，却趁你调息之际悄然离去，连一句谢也无。你苦笑摇头：救人原不为图报。', fx: { xw: -0.15, xj: 10 } }; } },
        { label: '夺其储物袋', sub: '心境有损', act: s2 => { takeRescue(s2, RESCUES[0]); return { text: '你别过脸去，伸手解下了那只储物袋。她没有挣扎，只是看着你，眼中的光一点点熄灭。很多年后，你仍会梦见那双眼睛。', fx: { ls: 60, item: { '聚气丹': 2 }, xj: -18, luck: -2 } }; } },
        { label: '默然离去', act: s2 => { takeRescue(s2, RESCUES[0]); return { text: '修行路上，生死各安天命。你转身离去，身后林风簌簌，似有一声叹息。', fx: { xj: -3 } }; } },
      ] },
    { id: 'laonong', echo: 1,
      text: () => '田埂上躺着一个老农，腿被什么东西咬出三道口子，血把泥浸透了。他看见你，没喊仙长，只说：「家里还有一口锅在火上。」',
      choices: () => [
        { label: '替他止血，送回村口', act: s2 => { takeRescue(s2, RESCUES[1]); return { text: '你用灵力把血止住，背他到村口。他媳妇出来，塞给你一包自己晒的药草，说不出别的。', fx: { xj: 6, item: { '青叶草': 3, '宁神花': 1 }, time: 1 } }; } },
        { label: '指给他一条近路', act: s2 => { takeRescue(s2, RESCUES[1]); return { text: '你没有背他，只指了路。他点头，自己爬着走了。你站在田埂上，觉得这点指点，轻得有点过分。', fx: { xj: 1 } }; } },
        { label: '当作没看见', act: s2 => { takeRescue(s2, RESCUES[1]); return { text: '你从另一条田埂绕开。锅大概还在火上。你没有回去看。', fx: { xj: -4 } }; } },
      ] },
    { id: 'tongzi', echo: 1,
      text: () => '溪边一个童子卡在石缝里，书包还背着，人已经喊不出声，只剩眼睛在转。他看见你，把一只木剑递出来，像那是他全部的行李。',
      choices: () => [
        { label: '把他抱出来', act: s2 => { takeRescue(s2, RESCUES[2]); return { text: '石缝磨破了你的袖。童子出来之后，把木剑硬塞给你，说以后要来找你学剑。你没有答应，也没有把剑扔掉。', fx: { xj: 7, luck: 1 } }; } },
        { label: '叫他村里的人', act: s2 => { takeRescue(s2, RESCUES[2]); return { text: '你在村口喊了人。来的是他姐姐。她谢你，谢得很慌。你把木剑还给孩子，自己走了。', fx: { xj: 3 } }; } },
        { label: '木剑留下，人不管', sub: '心境有损', act: s2 => { takeRescue(s2, RESCUES[2]); return { text: '你拿了那把木剑。它不值什么。可你知道自己拿的不是剑。', fx: { xj: -8 } }; } },
      ] },
    { id: 'sanxiu', echo: 1,
      text: () => '官道旁倒着一个散修，储物袋空着，人还剩一口气。他抓住你的袖子：「别问我是谁。东边第三座山，缝里有光。我走不到了。」',
      choices: () => [
        { label: '先救人，再听方位', act: s2 => { takeRescue(s2, RESCUES[3]); return { text: '你把药渡进去。他缓过来，把方位又说了一遍，说得更清楚。说完他拱手，一瘸一拐地走了，没有留下名字。', fx: { xw: -0.08, luck: 2, xj: 4 } }; } },
        { label: '只记下方位', act: s2 => { takeRescue(s2, RESCUES[3]); return { text: '你把方位记下，人没救。夜里你睡不着，不是因为那座山，是因为袖子上还留着他的力道。', fx: { luck: 1, xj: -5 } }; } },
      ] },
    { id: 'zhuangshang', echo: 0,
      text: () => '桥洞里有人呻吟，衣裳是好的，伤看起来却太整齐。他见你停下，立刻把一只破碗伸出来，碗底是干的。',
      choices: () => [
        { label: '仍把伤当真的治', act: s2 => { takeRescue(s2, RESCUES[4]); return Math.random() < 0.45
          ? { text: '伤是装的。可你的灵力进去的那一瞬，他脸上的笑停了。他磕了个头，把藏在袖里的一枚灵石推给你，跑了。', fx: { xj: 3, ls: 12 } }
          : { text: '你蹲下去的时候，他的同伙从桥上跳下来。灵石少了一截，你多了一道口子。桥洞里的呻吟，原来是暗号。', fx: { ls: -Math.max(8, Math.floor(s2.ls * 0.25)), lsRaw: true, inj: 1, xj: -4 } }; } },
        { label: '拆穿他', act: s2 => { takeRescue(s2, RESCUES[4]); return { text: '你说：「碗是干的。」他愣了一下，笑出声，把同伙叫出来，居然向你行了个礼，然后跑了。', fx: { xj: 2, luck: 1 } }; } },
        { label: '绕开桥洞', act: s2 => { takeRescue(s2, RESCUES[4]); return { text: '你从桥上走。下面的呻吟停了一停，又响起来，像在等下一个。', fx: {} }; } },
      ] },
    { id: 'jianxiu', echo: 1,
      text: () => '崖下靠着一个剑修，剑断了，人还握着半截。他看见你，第一句不是救命，是：「别让这半截剑落进沟里。」',
      choices: () => [
        { label: '救人，也捡起断剑', act: s2 => { takeRescue(s2, RESCUES[5]); return { text: '你把他拖上崖。断剑里还剩一点剑意。他让你留下，说自己用不上了。人走的时候，步子已经能自己迈。', fx: { xj: 5, item: { '古剑残片': 1 }, gfXp: 2 } }; } },
        { label: '只把人拖上去', act: s2 => { takeRescue(s2, RESCUES[5]); return { text: '剑留在沟里。人活了。他看了你一眼，像把一句谢谢咽了回去，也像把一句责备咽了回去。', fx: { xj: 4 } }; } },
      ] },
    { id: 'yaotong', echo: 1,
      text: () => '疫城外的破庙里，一个药童守着一口冷锅，自己先烧起来了。他嘴里还在背药名，背到一半就乱了。',
      choices: () => [
        { label: '替他把药煎上', act: s2 => { takeRescue(s2, RESCUES[6]); return { text: '你把冷锅重新烧开，又分了他半瓶自己的药。天亮时他退了烧，把药名背完整了，说以后煎药，会给你留一碗。', fx: { xj: 6, item: { '回春丹': 1 }, time: 1 } }; } },
        { label: '留下丹药就走', act: s2 => { takeRescue(s2, RESCUES[6]); if ((s2.items['聚气丹'] || 0) > 0) return { text: '你把一枚聚气丹放在他手边。他抓住了，没抓住你的袖子。你出庙的时候，锅还是冷的。', fx: { item: { '聚气丹': -1 }, xj: 2 } }; return { text: '你袖中没有丹。只把一点灵气温进他脉里，让他至少能把药名背完。', fx: { xj: 2 } }; } },
      ] },
    { id: 'qitu', echo: 1,
      text: s => `山门外跪着一个被逐出来的弟子，额上还有戒痕。他认得你腰间的路数，抬头说：「${(s.sect && s.sect.org) ? '同门' : '道友'}，给我一口水。水以后的事，我自己担。」`,
      choices: () => [
        { label: '给他水，也给他一句去处', act: s2 => { takeRescue(s2, RESCUES[7]); return Math.random() < 0.72
          ? { text: '他喝完水，把戒痕用布遮住，朝你深深一揖。临走留下一块刻着地名的木牌：那里有一处还没被人摸干净的药谷。', fx: { xj: 4, luck: 1, ls: 15 } }
          : { text: '他喝了你的水，夜里却摸进你的行李。丹药少了一枚。木牌是假的。你追出半里，只看见他消失在雾里。', fx: { xj: -6, item: { '聚气丹': -1 } } }; } },
        { label: '逐客的规矩，不必破', act: s2 => { takeRescue(s2, RESCUES[7]); return { text: '你没有给水。他跪到你走远。你没有回头，可那句「一口水」在耳朵里停了很久。', fx: { xj: -2 } }; } },
      ] },
  ];
  function takeRescue(s, r) {
    const life = L(s);
    if (life.rescues.indexOf(r.id) < 0) life.rescues.push(r.id);
    if (s.flags) s.flags.rescueNow = '';
    if (r.echo) life.rescueQ.push({ id: r.id, at: (s.months | 0) + 12 * (6 + (s.realm | 0) * 2) });
    note(s, { t: '救人', d: r.id, k: 'rescue' });
  }
  function pickRescue(s) {
    const life = L(s);
    const pool = RESCUES.filter(r => life.rescues.indexOf(r.id) < 0);
    if (!pool.length) return null;
    s.flags = s.flags || {};
    if (s.flags.rescueNow) {
      const keep = pool.find(r => r.id === s.flags.rescueNow);
      if (keep) return keep;
    }
    const r = pool[Math.floor(Math.random() * pool.length)];
    s.flags.rescueNow = r.id;
    return r;
  }
  function rescueEcho(s) {
    const life = L(s);
    const due = (life.rescueQ || []).find(q => (s.months | 0) >= (q.at | 0) && !q.done);
    return due || null;
  }
  const ECHO_TEXT = {
    nvxiu: { t: '多年前你在林中救下的女修托人送来一只小瓶，瓶底压着字条：「还你一夜。」', fx: { item: { '回春丹': 1 }, xj: 4 } },
    laonong: { t: '村口的老农让孙子找到你，送来一筐晒干的药草，和一句话：「锅还在。」', fx: { item: { '青叶草': 4, '赤阳花': 1 }, xj: 3 } },
    tongzi: { t: '那个溪边的童子长高了半头，在坊市拦住你，把当年的木剑换了一柄真的短剑塞过来，说自己还没学成，剑先还给你路上用。', fx: { gear: '精铁短剑', xj: 5 } },
    sanxiu: { t: '那个没留名字的散修托人带话：东边那座山的缝，他后来自己也没进去。话送到了，人又走了。你只觉得有人还活着。', fx: { luck: 1, xj: 3 } },
    jianxiu: { t: '断剑的主人托铁匠捎来一句话：「沟里的那半截，我回去捡了。你的人情，我记在剑上。」', fx: { gfXp: 3, xj: 3 } },
    yaotong: { t: '疫城的药童如今会煎药了。他托商队给你带来一碗晾凉的药，药力淡，心意不淡。', fx: { item: { '清心丹': 1 }, xj: 4 } },
    qitu: { t: '那个跪在山门外的人没有再来。有人在坊市提起他，说他在某处安稳地卖水。卖水。你听见这两个字，忽然松了一松。', fx: { xj: 4 } },
  };
  if (typeof EVENTS !== 'undefined') {
    const ev = EVENTS.find(e => e.id === 'wounded');
    if (ev) {
      ev.cond = s => RESCUES.some(r => L(s).rescues.indexOf(r.id) < 0);
      ev.text = s => { const r = pickRescue(s); return r ? r.text(s) : '林中的血迹已经淡了。'; };
      ev.choices = s => {
        const r = pickRescue(s);
        if (!r) return [{ label: '离开', act: () => ({ text: '你没有停留。', fx: {} }) }];
        return r.choices(s);
      };
    }
    EVENTS.push({
      id: 'rescue_echo', title: '旧恩', seal: '恩', w: 7,
      cond: s => !!rescueEcho(s),
      text: s => {
        const due = rescueEcho(s);
        const row = due && ECHO_TEXT[due.id];
        return row ? row.t : '有人在路上叫住你，说是来还一笔很旧的情。';
      },
      choices: s => [{
        label: '收下',
        act: s2 => {
          const due = rescueEcho(s2);
          if (due) due.done = 1;
          const row = due && ECHO_TEXT[due.id];
          return { text: '你把这份回礼收好。有些债，是用很多年来还的，还的时候轻得像一阵风。', fx: row ? row.fx : { xj: 2 } };
        },
      }],
    });
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
