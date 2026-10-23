'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.join(__dirname,'..'), math=Object.create(Math); let roll=.5; math.random=()=>roll;
const storage=new Map(),localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
const ctx=vm.createContext({console,Math:math,localStorage,TextEncoder,TextDecoder,Uint8Array,btoa,atob});
for(const f of ['data','gongfa','gear','path','story','sect','baijia','world','tianxia','karma','life','juan','core','loops','codec','slots','samsara','jianghu','folio','arts','people','redworld'])vm.runInContext(fs.readFileSync(path.join(root,'js',f+'.js'),'utf8'),ctx,{filename:f});
const {Core,Jianghu,Redworld:R,REALMS,LINGGEN,Codec,Life,Samsara,EVENTS,GEAR,RECIPES,Loop}=vm.runInContext('({Core,Jianghu,Redworld,REALMS,LINGGEN,Codec,Life,Samsara,EVENTS,GEAR,RECIPES,Loop})',ctx);
const json=x=>JSON.parse(JSON.stringify(x)),emit=()=>{};
function fresh(){const s=Core.newState('灯客',{lg:LINGGEN.find(l=>l.id==='san'),els:['木','水','金'],wx:6,luck:1,org:'qm'});s.loc='yunyue';s.sect.org=null;s.ls=10000;s.lifeBonus=100000;Core.sync(s);R.ensure(s);return s;}
let s=fresh(),h=s.shop;
assert.equal(s.v,16);assert.deepStrictEqual([h.rep,h.moral,h.fruit,h.shrine,h.stores.length],[0,0,0,0,0]);
for(const legacy of [{own:1,stock:{聚气丹:2,陌生旧物:1}},{rentUntil:300,stock:{清心丹:3}},{}]){
 s=fresh();s.v=15;s.shop=json(legacy);const attrs=[s.xw,s.lifespan,s.path.daoji];s=Core.migrate(Codec.decode(Codec.encode(s)).data);h=s.shop;
 assert.equal(s.v,16);assert.equal(h.price,'fair');assert.equal(h.stores.length,legacy.own||legacy.rentUntil?1:0);assert.deepStrictEqual(json(h.stock),legacy.stock||{});assert.deepStrictEqual([s.xw,s.lifespan,s.path.daoji],attrs);assert.equal(h.rep+h.moral+h.fruit+h.shrine,0);
 if(h.stores.length)assert.equal(h.stores[0].paidUntil,legacy.rentUntil||0);
}
s=fresh();s.loc='qingshi';assert(R.lease(s,'alley').err);s.loc='yunyue';assert(R.lease(s,'street').err);assert(R.lease(s,'gate').err);
assert(!R.lease(s,'alley').err);h=s.shop;h.rep=40;h.moral=-21;assert(R.lease(s,'gate').err);s.flags.miTrust=1;s.npc.mi.met=true;assert(!R.lease(s,'gate').err);Core.killNpc(s,'mi');assert(R.lease(s,'gate').err);h.moral=0;assert(!R.lease(s,'street').err);assert.equal(h.stores.length,3);const before=s.ls;assert(R.lease(s,'alley').err);assert.equal(s.ls,before);
// No automatic sales or debt while travelling/closed; already paid rent is honoured.
s=fresh();R.lease(s,'alley');s.items.聚气丹=3;R.put(s,'聚气丹');const shelves=json(s.shop.stock),money=s.ls;Core.passTime(s,48,emit);assert.deepStrictEqual(json(s.shop.stock),shelves);assert.equal(s.ls,money);assert.equal(s.shop.debt,0);assert(R.quote(s,'normal').rent>0);
// Goods above the season ceiling stay intact, including old unknown stock.
s=fresh();R.lease(s,'alley');s.shop.stock={筑基丹:2,陌生旧物:1};assert.equal(R.quote(s,'normal').gross,0);assert(R.season(s,'normal',emit).err);R.take(s,'陌生旧物');assert.equal(s.items.陌生旧物,1);
const artifact=Object.keys(GEAR).find(k=>GEAR[k].artifact);s.items[artifact]=1;assert(R.put(s,artifact).err);
// Existing ordinary equipment is saleable when the realm cap permits; the equipped natal treasure never enters stock.
s=fresh();s.realm=4;s.path.daoji='qi';Core.sync(s);R.lease(s,'alley');s.items.寒铁枪=1;R.put(s,'寒铁枪');assert(R.quote(s,'normal').sales.some(x=>x.key==='寒铁枪'));assert(!R.season(s,'normal',emit).err);assert.equal(s.shop.stock.寒铁枪,0);
// Rival introduction uses the same persistent person, and respects death/absence.
s=fresh();h=s.shop;h.rep=25;assert(!s.npc.qian.met);R.lease(s,'alley');assert(s.npc.qian.met);R.lease(s,'street');assert(R.quote(s,'normal').risk.some(x=>x.includes('钱十三')));s.npc.qian.life.state='远行';assert(!R.quote(s,'normal').risk.some(x=>x.includes('钱十三')));Core.killNpc(s,'qian');assert(!R.quote(s,'normal').risk.some(x=>x.includes('钱十三')));
// Actual purchases and self-supplied stock are not confused in cash accounting.
s=fresh();R.lease(s,'alley');s.mkt.st.青叶草=10;const price=Jianghu.price(s,'青叶草'),expense=s.shop.expense,ls=s.ls;assert(!R.purchase(s,'青叶草').err);assert.equal(s.ls,ls-price);assert.equal(s.shop.expense,expense+price);assert.equal(s.shop.stock.青叶草,1);R.take(s,'青叶草');R.put(s,'青叶草');assert.equal(s.shop.expense,expense+price);
// Every quoted range is honoured across five realms, six paths, three prices and shop counts.
let settlements=0;
for(let realm=0;realm<5;realm++)for(const dao of ['jian','dan','ti','zhen','qi','mo'])for(const priceKey of ['low','fair','high'])for(let count=1;count<=3;count++)for(const rep of [0,25,60])for(const mode of ['normal','honest','fraud','guard','haul']){
 if(mode==='guard'&&dao!=='zhen'||mode==='haul'&&dao!=='ti')continue;
 for(const random of [.05,.3,.8]){
  s=fresh();s.realm=realm;s.path.daoji=dao;Core.sync(s);h=s.shop;h.rep=rep;s.npc.qian.met=true;h.price=priceKey;h.stock={青叶草:100,聚气丹:100,筑基丹:2};h.stores=Array.from({length:count},()=>({spot:'alley',paidUntil:0,own:0}));
  const attrs=[s.xw,s.lifespan,s.path.daoji], q=R.quote(s,mode),oldMoney=s.ls,t=s.months;roll=random;
  if(!q.gross)continue;
  const out=R.season(s,mode,emit);assert(!out.err);assert(out.income>=q.low&&out.income<=q.high,JSON.stringify({realm,dao,count,rep,mode,random,q,income:out.income}));assert(out.income<=R.cap(s)*count);assert.equal(s.ls-oldMoney,out.income-q.rent);assert(Math.abs(s.months-t-q.months)<1e-7);assert.deepStrictEqual([s.xw,s.lifespan,s.path.daoji],attrs);assert.equal(h.ledger[h.ledger.length-1].income,out.income);if(mode==='fraud'){assert.equal(h.fruit,0);assert.equal(h.moral,dao==='mo'?-8:-4);}else assert.equal(h.fruit,1);settlements++;
 }
}
roll=.5;
// Long runs cannot turn repeated service/credit/fraud into income beyond the quoted cap or cultivation bonuses.
for(const route of ['honest','fraud','guard']){
 s=fresh();s.realm=2;s.path.daoji=route==='guard'?'zhen':'mo';Core.sync(s);h=s.shop;h.rep=50;
 for(const spot of ['alley','street','gate'])R.lease(s,spot);
 h.stock.青叶草=1000;const attrs=[s.xw,s.lifespan,Core.gfSpeed(s),Core.btChance(s,false)];let sum=0,bound=0;
 for(let i=0;i<60;i++){if(h.pending)R.respond(s,'leave',emit);const q=R.quote(s,route),out=R.season(s,route,emit);assert(!out.err);sum+=out.income;bound+=q.ceiling;assert(sum<=bound);assert.deepStrictEqual([s.xw,s.lifespan,Core.gfSpeed(s),Core.btChance(s,false)],attrs);}
 assert(h.ledger.length<=40);if(route==='fraud')assert.equal(h.fruit,0);
}
// Bankruptcy conserves unsold inventory and cultivation; exactly three honest quarters restore access.
s=fresh();h=s.shop;h.rep=40;h.guarantor=1;h.stores=[{spot:'gate',paidUntil:0}];h.stock={聚气丹:4};s.ls=0;const attrs=[s.xw,s.lifespan,s.path.daoji];assert(!R.bankrupt(s).err);assert.deepStrictEqual([s.xw,s.lifespan,s.path.daoji],attrs);assert.equal(s.items.聚气丹,4);assert.equal(h.rep,20);assert(h.debt>0&&h.recovery);assert(!R.lease(s,'alley').err);assert.equal(s.ls,0);assert(R.lease(s,'street').err);
for(let i=0;i<3;i++){R.put(s,'聚气丹');assert(!R.season(s,'honest',emit).err);}assert.equal(h.recovery,0);assert.equal(h.debt,0);assert(h.guarantor);
// Fraud produces a dated, resolvable grievance; its conclusion cannot repeat.
s=fresh();R.lease(s,'alley');s.items.聚气丹=1;R.put(s,'聚气丹');R.season(s,'fraud',emit);assert(s.shop.pending);R.respond(s,'leave',emit);assert(Life.deed(s,'shop'));s.months=Life.deed(s,'shop').due;const ev=Life.dueEvent(s);assert.equal(ev.id,'echo_shop');ev.choices(s)[0].act(s);assert(Life.deed(s,'shop').done);assert(!ev.cond(s));
// Three good works build a shrine, two gifts are never claimable in the same twelve-year interval.
s=fresh();h=s.shop;s.items.回春丹=5;s.items.清心丹=5;
for(const k of ['medicine','shelter','plague'])assert(!R.help(s,k,emit).err);assert.equal(h.shrine,1);assert.equal(h.fruit,6);assert.equal(h.moral,9);h.pending='';const hearts=s.xj;assert(!R.blessing(s,'heart').err);assert.equal(s.xj,Math.min(100,hearts+2));assert(R.blessing(s,'shield').err);s.months+=143.99;assert(R.blessing(s,'shield').err);s.months+=.01;h.pending='';assert(!R.blessing(s,'shield').err);
Core.applyFx(s,{inj:2});assert.equal(s.inj,2);assert.equal(h.shield,1);Core.applyFx(s,{inj:1});assert.equal(s.inj,2);assert.equal(h.shield,0);Core.applyFx(s,{inj:1});assert.equal(s.inj,3);
// Deliberate body training also consumes exactly one stored light-injury blessing.
const trained=fresh();trained.path.daoji='ti';trained.shop.shield=1;const train=Loop.act(trained,'ti:shi',emit);assert(!train.err);assert.equal(trained.shop.shield,0);assert.equal(trained.inj,0);assert.equal(trained.loop.ti,1);
assert.equal(Core.incenseInj(trained,1),1,'without incense, body training does not newly block furnace or artifact damage');
// Destroying a shrine freezes all sources of fruit; reconstruction does not reset the cooldown.
h.pending='attack';const fruit=h.fruit,next=h.incenseAt;R.respond(s,'leave',emit);assert.equal(h.shrine,-1);R.help(s,'shelter',emit);R.civilian(s,'save');assert.equal(h.fruit,fruit);assert(!R.rebuild(s,emit).err);assert.equal(h.fruit,fruit);assert.equal(h.incenseAt,next);R.civilian(s,'save');assert.equal(h.fruit,fruit+1);
const rep=h.rep;R.civilian(s,'kill');assert.equal(h.rep,rep);
// A complete deterministic redworld route from opening to the final choice; cultivation is supplied as a fixture.
s=fresh();h=s.shop;s.items.回春丹=10;s.items.清心丹=10;
for(let i=0;i<6;i++){if(h.pending)R.respond(s,'pay',emit);R.help(s,['medicine','shelter','plague'][i%3],emit);}
R.lease(s,'alley');s.items.聚气丹=20;
for(let i=0;i<12;i++){if(h.pending)R.respond(s,'pay',emit);R.put(s,'聚气丹');assert(!R.season(s,'honest',emit).err);}
assert(h.fruit>=24&&h.moral>=20);assert(!R.canEnd(s));s.realm=4;s.stage=REALMS[4].stages.length-1;Core.sync(s);s.xw=Core.req(s)-1;assert(!R.canEnd(s));s.xw=Core.req(s);assert(R.canEnd(s));h.moral=-100;assert(!R.canEnd(s));assert(Core.btChance(s,false)>0);h.moral=30;const endAttrs=[s.xw,s.lifespan,s.xj,Core.gfSpeed(s)];assert(!R.finish(s).err);assert.equal(s.ending,'hongchen');assert(s.dead&&!s.ascended);assert.deepStrictEqual([s.xw,s.lifespan,s.xj,Core.gfSpeed(s)],endAttrs);Samsara.recordLife(s,'hongchen');assert(Samsara.loadMeta().atlas.ending.hongchen);assert(Samsara.END_IDS.includes('hongchen'));assert.equal(R.ensure(fresh()).fruit,0);
console.log('PASS: v15/legacy shop migration, stock conservation, independent reputation, lease/three-shop limits, '+settlements+' bounded settlements, cash ledger, recovery, grievance, shrine freeze/cooldown/light injury, complete redworld route and final-only ending');
