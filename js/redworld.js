/* 纸上仙途 · 红尘。接替旧铺，不在闭关期间自动卖货。 */
'use strict';
const Redworld = (() => {
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const SPOTS = { alley: ['巷尾', .08], street: ['街中', .15], gate: ['坊市口', .24] };
  const PRICES = { low: ['低', .8], fair: ['平', 1], high: ['高', 1.25] };
  const span = s => 3 * REALMS[s.realm].T;
  const months = s => Core.timeMonths(s, span(s));
  const cap = s => Jianghu.price(s, '聚气丹');
  const rent = (s, spot) => Math.max(1, Math.floor(cap(s) * SPOTS[spot][1]));
  const active = s => !!s && !s.dead && !s.ascended;
  const qianPresent = s => Core.npcAlive(s, 'qian') && (typeof People === 'undefined' || People.present(s, 'qian'));
  function meetRival(s) {
    const h = ensure(s), n = s.npc && s.npc.qian;
    if (h.rep < 20 || !n || n.dead || n.met) return '';
    Core.npcAdd(s, 'qian', 0);
    return '对门新挂了招牌。钱十三自报姓名：“护山阵没算清，先算铺子的账。”';
  }
  function ensure(s) {
    let h = s.shop;
    if (!h || h.rev !== 1) {
      const old = h || {};
      h = s.shop = { rev: 1, stock: old.stock || {}, stores: [], price: 'fair', rep: 0, moral: 0,
        fruit: 0, goods: { medicine: 0, shelter: 0, plague: 0 }, shrine: 0, incenseAt: 0,
        shield: 0, debt: 0, recovery: 0, honest: 0, fraud: 0, guarantor: 0, rescue: 0,
        pending: '', shrineSteps: 0, trouble: 0, ledger: [], income: 0, expense: 0, haul: 0 };
      if (old.own || old.rentUntil > 0)
        h.stores.push({ spot: 'alley', own: old.own ? 1 : 0, paidUntil: old.rentUntil || 0 });
    }
    return h;
  }
  const open = s => ensure(s).stores.length > 0;
  const item = key => key.indexOf('自炼:') === 0 ? key.split(':')[1] : key;
  const name = key => key.indexOf('自炼:') === 0 ? item(key) + ' · 自炼' + DAN_Q[+key.split(':')[2]] : key;
  const sellable = key => !!ITEM_VAL[item(key)] || !!(typeof GEAR !== 'undefined' && GEAR[key] && !GEAR[key].artifact);
  const reference = (s, key) => ITEM_VAL[item(key)] ? Jianghu.price(s, item(key)) : Math.round(36 * REALMS[s.realm].lsScale);
  const stockKeys = h => Object.keys(h.stock).filter(k => h.stock[k] > 0);
  function book(s, text, income, expense, detail) {
    const h = ensure(s);
    h.income += income || 0; h.expense += expense || 0;
    h.ledger.push({ at: s.months, text, income: income || 0, expense: expense || 0, detail: detail || '' });
    if (h.ledger.length > 40) h.ledger.shift();
  }
  function fruit(s, n) { const h = ensure(s); if (h.shrine !== -1) h.fruit += n; }
  function moral(s, n) { const h = ensure(s); h.moral = clamp(h.moral + n, -100, 100); }
  function reason(s, spot) {
    const h = ensure(s);
    if (!SPOTS[spot]) return '没有这个地段';
    if (!active(s)) return '此卷已终';
    if (s.loc !== 'yunyue') return '开铺须到云岳坊';
    if (h.recovery && spot !== 'alley') return '东山再起前，只能守巷尾的小摊';
    if (spot === 'street' && h.rep < 20 && !h.guarantor) return '街中须口碑二十，或有人作保';
    if (spot === 'gate' && !(s.flags.miTrust && Core.npcAlive(s, 'mi')) && (h.rep < 40 || h.moral <= -20)) return '坊市口须口碑四十且正邪高于负二十，或米婆当面让铺';
    return '';
  }
  function lease(s, spot, move) {
    const h = ensure(s), err = reason(s, spot);
    if (err) return { err };
    if (!move && h.stores.length >= 3) return { err: '连主店总共最多三间' };
    if (!move && h.stores.length && h.rep < 20) return { err: '口碑二十才有人愿意替你看分店' };
    if (move && !h.stores.length) return { err: '还没有主店' };
    const cost = h.recovery && h.rescue === 1 && !h.stores.length ? 0 : rent(s, spot);
    if (s.ls < cost) return { err: '付不起首季租金' };
    s.ls -= cost;
    const store = { spot, own: 0, paidUntil: s.months + months(s) };
    if (move) h.stores[0] = store; else h.stores.push(store);
    if (!cost && h.rescue === 1) h.rescue = 2;
    let text = `${SPOTS[spot][0]}的门开了。首季租金${cost}灵石，租期${cnDur(months(s))}。休市不收后续租金，下次开季再续。`;
    if (spot === 'gate' && s.flags.miTrust && Core.npcAlive(s, 'mi')) { Core.npcAdd(s, 'mi', 2); text += '米婆当面递来钥匙：“别让秤偏。”'; }
    text += meetRival(s); book(s, move ? '迁主店' : '开铺', 0, cost, text);
    return { text };
  }
  function put(s, key) {
    const h = ensure(s);
    if (!active(s) || !open(s) || s.loc !== 'yunyue') return { err: '须在云岳坊自己的铺里上货' };
    if (!sellable(key)) return { err: '这件物品不作铺货，可取回留用或寄拍' };
    if (!(s.items[key] > 0)) return { err: '囊中无此货' };
    s.items[key]--; h.stock[key] = (h.stock[key] || 0) + 1;
    return { text: `你把${name(key)}搁上架。自备货只记参考价，未扣进货款。` };
  }
  function take(s, key) {
    const h = ensure(s);
    if (!active(s) || s.loc !== 'yunyue' || !(h.stock[key] > 0)) return { err: '须到云岳坊取架上的货' };
    h.stock[key]--; s.items[item(key)] = (s.items[item(key)] || 0) + 1;
    return { text: `取回${name(key)}。` };
  }
  function purchase(s, key) {
    if (!active(s) || s.loc !== 'yunyue' || !open(s) || !ITEM_VAL[key]) return { err: '须到云岳坊自己的铺里进货' };
    const cost = Jianghu.price(s, key), r = Jianghu.buy(s, key, 1);
    if (!r || !r.n) return { err: '灵石不足，或坊市无货' };
    put(s, key); book(s, '进货', 0, cost, `${key}×1 · 实付${cost}`);
    return { text: `进货${key}一件，实付${cost}灵石。进货与卖价分别记账。` };
  }
  function craft(s, id, emit) {
    if (!active(s) || s.loc !== 'yunyue' || !open(s) || s.path.daoji !== 'dan' || !RECIPES[id]) return { err: '丹基在自己的铺里，才可自炼入架' };
    const r = Jianghu.craft(s, id, emit);
    if (!r) return { err: '丹方或药材不足' };
    if (r.ok) {
      const key = '自炼:' + RECIPES[id].out + ':' + r.q, h = ensure(s);
      s.items[RECIPES[id].out] -= r.n; h.stock[key] = (h.stock[key] || 0) + r.n;
      r.text += `${name(key)}×${r.n}留在架上。材料自备，未虚记现金支出。`;
      book(s, '自炼入架', 0, 0, name(key) + '×' + r.n);
    }
    return r;
  }
  function quote(s, mode) {
    const h = ensure(s), n = h.stores.length, ceiling = cap(s) * n, dj = s.path && s.path.daoji;
    const dues = h.stores.map(t => t.own || t.paidUntil > s.months + .00001 ? 0 : rent(s, t.spot));
    const q = { mode, count: n, ceiling, rent: dues.reduce((a,b)=>a+b,0), dues, span: span(s), months: months(s), sales: [], blocked: [], service: '', risk: [], low: 0, high: 0, gross: 0 };
    if (!n) return q;
    let slots = h.stores.reduce((sum,t) => sum + ({alley: 1, street: 2, gate: 3}[t.spot]), 0) * (h.price === 'low' ? 2 : 1);
    for (const k of stockKeys(h)) {
      if (!sellable(k)) { q.blocked.push(name(k)); continue; }
      const unit = Math.max(1, Math.round(reference(s, k) * PRICES[h.price][1]));
      const qty = Math.min(h.stock[k], slots, Math.floor((ceiling - q.gross) / unit));
      if (qty > 0) { q.sales.push({ key: k, n: qty, unit }); q.gross += qty * unit; slots -= qty; }
      else q.blocked.push(name(k));
    }
    if (mode === 'guard' && dj === 'zhen') { q.sales = []; q.service = '阵基守铺'; q.gross = Math.floor(ceiling * .65); }
    if (mode === 'haul' && dj === 'ti' && !h.haul) { q.sales = []; q.service = '体基扛货'; q.gross = Math.floor(ceiling * .4); }
    if (n > 1) q.risk.push('掌柜可能卷货，本季收入可为零');
    if (n > 1 && h.rep >= 20 && qianPresent(s)) q.risk.push('钱十三压价抢客');
    if (h.price === 'high' && h.rep < 40) q.risk.push('高价而口碑不足，可能无人购买');
    if (dj === 'jian') q.risk.push('剑基旧怨可能上门，闭门避让会少卖货');
    q.low = q.risk.length ? 0 : q.gross; q.high = q.gross;
    if (mode === 'honest') { q.low = Math.floor(q.gross * .25); q.high = Math.floor(q.gross * .5); }
    if (mode === 'fraud') { q.low = q.high = q.gross; q.risk = ['收满本季货款，随后苦主与执法堂上门；口碑 −18，正邪 ' + (dj === 'mo' ? '−8' : '−4')]; }
    return q;
  }
  function shrineStep(s) {
    const h = ensure(s);
    if (h.shrine <= 0 || h.pending) return;
    h.shrineSteps++;
    if (h.shrineSteps >= 2) { h.shrineSteps = 0; h.pending = h.trouble % 2 ? 'attack' : 'petition'; h.trouble++; }
  }
  function season(s, mode, emit) {
    const h = ensure(s), q = quote(s, mode);
    if (!active(s) || s.loc !== 'yunyue' || !q.count) return { err: '须到云岳坊自己的铺里开季' };
    if (h.pending) return { err: '先回应铺前或祠前的来人，再开季' };
    if (!['normal','honest','fraud','guard','haul'].includes(mode) || (mode === 'guard' && s.path.daoji !== 'zhen') || (mode === 'haul' && (s.path.daoji !== 'ti' || h.haul))) return { err: '这季不能接这笔活' };
    if (!q.gross) return { err: '这季无可售货；换些货，或休市去修行' };
    if (s.ls < q.rent) return { err: '租金不足，可休市，或交回铺面记下人情债' };
    s.ls -= q.rent;
    h.stores.forEach((t,i) => { if (q.dues[i]) t.paidUntil = s.months + q.months; });
    let income = q.gross, loss = '', sold = q.sales;
    if (mode === 'honest') income = q.low + Math.floor(Math.random() * (q.high - q.low + 1));
    else if (mode !== 'fraud' && q.risk.length) {
      const roll = Math.random();
      if (roll < .1 && q.count > 1 && sold.length) { income = 0; loss = '掌柜卷走这一季拟售的货，柜里没有进账。'; }
      else if ((h.price === 'high' && h.rep < 40 && roll < .6) || (s.path.daoji === 'jian' && roll < .2)) { income = 0; sold = []; loss = '铺前起了争执，你闭门半季，货原样留下。'; }
      else if (q.count > 1 && h.rep >= 20 && qianPresent(s) && roll < .4) { income = 0; sold = []; Core.npcAdd(s, 'qian', 0); loss = '对门的钱十三压低价，客人去了他那里。货仍在架上。'; }
    }
    sold.forEach(x => { h.stock[x.key] -= x.n; });
    s.ls += income;
    if (mode === 'haul') h.haul = 1;
    if (mode === 'fraud') { h.rep = Math.max(0, h.rep - 18); moral(s, s.path.daoji === 'mo' ? -8 : -4); h.honest = 0; h.fraud++; h.pending = h.fraud % 3 === 1 ? 'victim' : h.fraud % 3 === 2 ? 'inspect' : 'foe'; }
    else {
      h.rep = Math.min(100, h.rep + (mode === 'honest' ? 6 : h.price === 'low' ? 2 : 1));
      if (mode === 'honest') moral(s, 1);
      h.honest++; fruit(s, 1);
      if (h.honest >= 3) { h.guarantor = 1; if (h.recovery) { h.recovery = 0; h.debt = 0; loss += '三季不欺客，旧主顾认下这笔人情：东山再起。'; } }
      shrineStep(s);
    }
    const lines = sold.map(x => `${name(x.key)}×${x.n} · 定价${x.unit}`).join('；') || q.service || '本季未售';
    const credit = mode === 'honest' ? q.gross - income : 0;
    const text = `${lines}。实收${income}，租金${q.rent}，本季现金净额${income - q.rent}灵石。${credit ? `赊免${credit}灵石，不再追收。` : ''}${loss}${mode === 'fraud' && s.path.daoji === 'mo' ? '魔息掩了劣药的气味，骗过眼前人，恶名却记得更深。' : ''}${h.guarantor && h.honest === 3 ? '老客来信说坊市口有人招租，并愿替你在街中作保。' : ''}${meetRival(s)}`;
    book(s, '季末', income, q.rent, text);
    Core.passTime(s, q.span, emit); s.acts = (s.acts || 0) + 1;
    return { text, quote: q, income, credit, tags: [{ t: cnDur(q.months), c: 'down' }] };
  }
  function bankrupt(s) {
    const h = ensure(s), q = quote(s, 'normal');
    if (!active(s) || s.loc !== 'yunyue' || !q.count || s.ls >= q.rent) return { err: '并未付不起到期租金' };
    for (const key of stockKeys(h)) { s.items[item(key)] = (s.items[item(key)] || 0) + h.stock[key]; }
    h.stock = {}; h.stores = []; h.debt += q.rent; h.rep = Math.floor(h.rep / 2); h.recovery = 1; h.honest = 0;
    if (h.guarantor && !h.rescue) h.rescue = 1;
    const text = `铺面收回，未售货已返还。人情债${h.debt}灵石，口碑减半。修为、寿元、道基照旧。${h.rescue === 1 ? '老客替你留了巷尾小摊，首季免租。' : '此后可从巷尾小摊重来。'}连续三季不欺客，或还清人情债，便能东山再起。`;
    book(s, '收铺', 0, 0, text); return { text };
  }
  function repay(s) {
    const h = ensure(s), cost = h.debt;
    if (!active(s) || !cost || s.ls < cost) return { err: '没有欠账，或灵石不足' };
    s.ls -= cost; h.debt = 0; h.recovery = 0; book(s, '还人情债', 0, cost);
    return { text: '欠账两清。东山再起，地段与分店的门重新开了。' };
  }
  function help(s, kind, emit) {
    const h = ensure(s);
    if (!active(s) || !['qingshi','yunyue','jingcheng'].includes(s.loc)) return { err: '行善须到青石镇、云岳坊或京城' };
    if (!Object.prototype.hasOwnProperty.call(h.goods, kind)) return { err: '没有这桩善事' };
    if (h.pending) return { err: '先回应来人，再走这一季' };
    const cost = kind === 'shelter' ? Math.max(1, Math.floor(cap(s) * .2)) : 0;
    const drug = kind === 'medicine' ? '回春丹' : kind === 'plague' ? '清心丹' : '';
    if (s.ls < cost || (drug && !(s.items[drug] > 0))) return { err: '灵石或所需丹药不足' };
    const duration = months(s);
    if (drug) s.items[drug]--; s.ls -= cost; h.goods[kind]++; moral(s, 3); fruit(s, 2);
    const total = Object.values(h.goods).reduce((a,b)=>a+b,0);
    let text = { medicine: '你把药分给病人，记住的不是银钱，是药煎开时的气味。', shelter: '风雪夜，你让赶路人在屋里留了一晚。', plague: '你没有绕开疫镇。一季后，门外又有人说话。' }[kind];
    if (!h.shrine && total >= 3) { h.shrine = 1; h.incenseAt = s.months + duration; text += '乡人替你立了一座小祠。'; }
    if (h.shrine === 1 && total >= 6) { h.shrine = 2; text += '乡人合力塑了金身，名字仍是你的旧名。'; }
    shrineStep(s); book(s, '善事', 0, cost, text);
    Core.passTime(s, span(s), emit); s.acts = (s.acts || 0) + 1;
    return { text, tags: [{ t: cnDur(duration), c: 'down' }] };
  }
  function blessing(s, kind) {
    const h = ensure(s);
    if (!active(s) || h.shrine <= 0 || h.pending || s.months < h.incenseAt || !['heart','shield'].includes(kind)) return { err: '香火未成，或祠前有事尚未回应' };
    if (kind === 'shield' && h.shield) return { err: '先前的庇佑尚在，不可叠存' };
    if (kind === 'heart') s.xj = Math.min(100, s.xj + 2); else h.shield = 1;
    h.incenseAt = s.months + 144; fruit(s, 1); shrineStep(s);
    return { text: kind === 'heart' ? '香火暖过心头。心境 +2，下次须隔十二个实际年。' : '一道香火护身，可免一次轻伤；不免重伤。下次须隔十二个实际年。' };
  }
  function troubleCost(s) { return Math.max(1, Math.floor(cap(s) * .5)); }
  function respond(s, choice, emit) {
    const h = ensure(s), p = h.pending;
    if (!active(s) || !p || !['pay','leave'].includes(choice)) return { err: '眼前没有待回应的事' };
    const cost = choice === 'pay' ? troubleCost(s) : 0, duration = choice === 'pay' ? months(s) : 0;
    if (s.ls < cost) return { err: '灵石不足' };
    s.ls -= cost; h.pending = '';
    let text = '';
    if (p === 'attack') {
      if (choice === 'pay') text = '你请人护祠，自己守过这一季。邪修离开，灯还亮着。';
      else { h.shrine = -1; text = '你没有回头。祠毁了，道果停在原数，重修之前不再增长。'; }
    } else if (p === 'petition') {
      text = choice === 'pay' ? '你替来人解了一桩难事。祠前没有多一尊像，只多了一盏灯。' : '你听完了来意，却没有应下。那人叩首而去。';
      if (choice === 'pay') { moral(s, 3); fruit(s, 1); }
    } else {
      text = choice === 'pay' ? '你赔了苦主，陪执法堂查过一季。账记着，旧事没有被抹掉。' : '你不肯认这笔账。苦主把名字记进仇怨，街坊避开你的门。';
      if (choice === 'leave') { h.rep = Math.max(0, h.rep - 8); moral(s, -3); if (typeof Life !== 'undefined') Life.plant(s, { id: 'shop', who: '受骗的穷修士', kind: 'shopFoe', line: '铺前未清的旧账', years: 12 }); }
    }
    book(s, '来人', 0, cost, text);
    if (duration) { Core.passTime(s, span(s), emit); s.acts = (s.acts || 0) + 1; }
    return { text, tags: [{ t: cnDur(duration) + ' · 灵石 −' + cost }] };
  }
  function rebuild(s, emit) {
    const h = ensure(s), cost = troubleCost(s);
    if (!active(s) || h.shrine !== -1 || s.ls < cost) return { err: '祠未毁，或重修灵石不足' };
    s.ls -= cost; h.shrine = Object.values(h.goods).reduce((a,b)=>a+b,0) >= 6 ? 2 : 1;
    const duration = months(s); book(s, '重修', 0, cost);
    Core.passTime(s, span(s), emit); s.acts = (s.acts || 0) + 1;
    return { text: `重修花了${cnDur(duration)}、${cost}灵石。灯再亮，道果从原数接着长。十二年香火之期没有重置。` };
  }
  function canEnd(s) { const h = ensure(s); return active(s) && s.realm === 4 && Core.bottleneck(s) && h.fruit >= 24 && h.moral >= 20; }
  function finish(s) { if (!canEnd(s)) return { err: '还未到留在人间的那扇门' }; s.dead = true; s.ending = 'hongchen'; return { text: '入世修行，终得正果。世人称红尘仙。' }; }
  function civilian(s, kind) { if (kind === 'save' || kind === 'spare') { moral(s, 3); fruit(s, 1); } else if (kind === 'kill') moral(s, -12); }
  return { SPOTS, PRICES, ensure, span, months, cap, rent, open, name, item, sellable, reference, book, reason, lease, put, take, purchase, craft, quote, season, bankrupt, repay, help, blessing, troubleCost, respond, rebuild, canEnd, finish, civilian };
})();

EVENTS.push({ id: 'echo_shop', title: '旧账上门', seal: '债', w: 0, once: true, rm: [0, 4],
  cond: s => { const d = typeof Life !== 'undefined' && Life.deed(s, 'shop'); return !!(d && !d.done && s.months >= d.due); },
  text: '多年后，那位受骗的穷修士把旧药纸放在你面前。他不要听大道，只问那年的账。',
  choices: s => [{ label: '认下旧账', sub: '灵石 −' + Redworld.troubleCost(s), disabled: s.ls < Redworld.troubleCost(s), act: s => {
    const cost = Redworld.troubleCost(s); Life.seal(s, 'shop'); s.ls -= cost; Redworld.book(s, '偿旧账', 0, cost);
    return { text: '你偿了这笔旧账。他收好药纸，不再回头。', fx: {} };
  } }, { label: '让他离开', act: s => { Life.seal(s, 'shop'); return { text: '那人没有再说什么。旧事终于停在这一页，恨却没有消。', fx: {} }; } }],
});
