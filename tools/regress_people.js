'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..'), math = Object.create(Math); math.random = () => 0.5;
const storage = new Map(), localStorage = {getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
const ctx = vm.createContext({console,Math:math,localStorage,TextEncoder,TextDecoder,Uint8Array,btoa,atob});
for(const f of ['data','gongfa','gear','path','story','sect','baijia','world','tianxia','karma','life','juan','core','loops','codec','slots','samsara','jianghu', 'redworld','folio','arts','people','portraits'])
  vm.runInContext(fs.readFileSync(path.join(root,'js',f+'.js'),'utf8'),ctx,{filename:f});
const {Core,People,Folio,Life,Samsara,Codec,NPCS,EVENTS,MIJING,LINGGEN,Jianghu,karmaTraces,InkPortrait} = vm.runInContext('({Core,People,Folio,Life,Samsara,Codec,NPCS,EVENTS,MIJING,LINGGEN,Jianghu,karmaTraces,InkPortrait})',ctx);
const fresh=()=>Core.newState('人间客',{lg:LINGGEN.find(l=>l.id==='san'),els:['木','水','金'],wx:6,luck:1,org:'qm'});
const ev=id=>EVENTS.find(e=>e.id===id), json=x=>JSON.parse(JSON.stringify(x));
function choose(s,id,label){const e=ev(id);e.text(s);const c=e.choices(s).find(x=>typeof label==='number'?false:x.label===label)||e.choices(s)[label];assert(c&&!c.disabled,id+':'+label);const r=Core.resolveChoice(s,c);Core.applyFx(s,r.fx||{},()=>{});return r;}
assert.equal(Object.keys(NPCS).length,31);assert.equal(Samsara.PERSON_IDS.length,31);assert(!NPCS.ashina);
for(const id of Object.keys(People.newcomers)) assert(InkPortrait.svg(id).includes('<svg'));
let s=fresh();const oldXw=s.xw,oldLife=s.lifespan,oldBooks=Object.keys(s.gfs).length;
s.v=14;for(const id of Object.keys(People.newcomers))delete s.npc[id];for(const n of Object.values(s.npc))delete n.life;
s.npc.su.a=57;const old=Core.migrate(Codec.decode(Codec.encode(s)).data);
assert.equal(old.v,16);assert.equal(Object.keys(old.npc).length,31);assert.equal(old.npc.su.a,57);assert.equal(old.npc.su.life.beat,0);assert.equal(old.xw,oldXw);assert(old.lifespan>=oldLife);assert.equal(Object.keys(old.gfs).length,oldBooks);
s=fresh();s.npc.su.met=true;const at=s.months;s.months=at+23;People.tick(s);assert.equal(s.npc.su.life.beat,0);
s.months++;People.tick(s);assert.equal(s.npc.su.life.beat,1);People.tick(s);assert.equal(s.npc.su.life.beat,1);
Core.npcAdd(s,'su',1);s.months+=23;People.tick(s);assert.equal(s.npc.su.life.beat,1);s.months+=240;People.tick(s);assert.equal(s.npc.su.life.beat,2,'large time jump advances only one beat');
s=fresh();s.npc.mi.met=true;s.months=(88-44)*12;const logs=[];People.tick(s,x=>logs.push(x));People.tick(s,x=>logs.push(x));assert(s.npc.mi.dead);assert.equal(logs.filter(x=>x.text.includes('米婆')).length,1);s.months+=24;People.tick(s);assert.equal(s.npc.mi.life.state,'只剩名字');assert(!Core.npcAlive(s,'mi'));
s=fresh();s.npc.lu.met=true;choose(s,'lu_save','依他所言，转身离去');assert(s.npc.lu.absolute);Core.npcAdd(s,'lu',500);assert.equal(s.npc.lu.a,-100);assert(People.interact(s,'lu','talk').err);assert(!ev('yg_lu_foe').choices(s).some(c=>c.label.includes('言和')));assert(ev('people_lu_hunt').cond(s));
Core.dabiPeek(s);Core.killNpc(s,'lu');assert(!Core.dabiPeek(s).opps.some(o=>o.npc==='lu'));assert(!ev('people_lu_hunt').cond(s));
s=fresh();s.npc.lu.met=true;s.npc.lu.a=80;Core.dabiPeek(s);People.note(s,'lu','闭关','在关内');assert(!ev('lu_duel').cond(s));assert(!Core.npcHelp(s).who.includes('lu'));assert(!Core.dabiPeek(s).opps.some(o=>o.npc==='lu'));
s=fresh();s.realm=1;s.npc.shi.met=true;s.npc.shi.a=60;math.random=()=>0.99;choose(s,'people_shi',0);math.random=()=>0.5;assert(s.npc.shi.crippled);assert(!Core.npcHelp(s).who.includes('shi'));
s.sect.missions=[{id:'qingjiao',uid:3}];const mission=Core.missionEvent(s,3);assert(mission);assert(!mission.choices(s).some(c=>c.label==='与石小满同往'));
for(const [id,a] of Object.entries(People.newcomers)){
  if(id==='baiwei'||id==='gu')continue;s=fresh();s.loc=a[5];s.sect.org=a[6]||'qm';s.realm=id==='yu'?3:1;
  assert(ev('people_meet_'+id).cond(s),id);choose(s,'people_meet_'+id,0);assert(s.npc[id].met,id);
}
s=fresh();s.realm=2;s.loc='xuewu';s.path.daoji='jian';assert.equal(ev('people_gu').choices(s).length,2);s.path.daoji='mo';choose(s,'people_gu',0);assert(s.npc.gu.met);assert.equal(s.npc.gu.life.wish,'已进');
s=fresh();MIJING.xiandao.nodes[0].choices(s).find(c=>c.label==='问守门的白苇').act(s);assert(s.npc.baiwei.met);
s=fresh();s.npc.tang.met=true;s.npc.tang.a=70;Folio.setWho(s,'n','m');assert(!ev('people_bond_tang').cond(s));Folio.setWho(s,'n','any');assert(ev('people_bond_tang').cond(s));choose(s,'people_bond_tang',0);assert.equal(s.karma.mate,'tang');assert.equal(Folio.mateTa(s),'她');
const hearts=s.xj, a=s.npc.tang.a;s.items['清心丹']=1;assert(!People.interact(s,'tang','gift',()=>{}).err);assert.equal(s.items['清心丹'],0);assert(s.npc.tang.a>a);assert(People.interact(s,'tang','gift').err);
s.months+=3;assert(!People.interact(s,'tang','promise',()=>{}).err);assert(karmaTraces(s,0).some(x=>x.name.includes('共修之约')));assert(!People.interact(s,'tang','sit',()=>{}).err);assert.equal(s.bond.promiseDue,0);
s.months+=3;People.interact(s,'tang','promise',()=>{});const before=s.npc.tang.a;s.months+=13;People.tick(s,()=>{});assert.equal(s.bond.promiseDue,0);assert.equal(s.npc.tang.a,before-12);People.tick(s);assert.equal(s.npc.tang.a,before-12);
s.months+=3;People.interact(s,'tang','promise',()=>{});s.months=s.bond.promiseDue-1;s.npc.tang.life.nextAct=0;const late=People.interact(s,'tang','sit',()=>{});assert(!late.text.includes('没有失约'));assert(s.bond.missed>=2);
Core.killNpc(s,'tang');assert(People.interact(s,'tang','talk').err);assert(!ev('people_bond_tang').cond(s));
s=fresh();s.loc='shanmen';s.npc.su.met=true;for(let i=0;i<3;i++)People.afterLoop(s,'dan','wenwen',{text:''});assert.equal(s.npc.su.life.wish,'共炉');
s=fresh();s.loc='shanmen';s.npc.su.met=true;People.afterLoop(s,'dan','cheng',{text:'炉裂',boom:true});for(let i=0;i<3;i++)People.afterLoop(s,'dan','wenwen',{text:''});assert.equal(s.npc.su.life.wish,'已碎');
s=fresh();s.npc.tang.met=true;choose(s,'people_tang',1);assert.equal(s.npc.tang.life.state,'远行');s.months+=24;s.loc='yunyue';assert(ev('people_tang_market').cond(s));choose(s,'people_tang_market',0);assert.equal(s.npc.tang.life.state,'在');
s=fresh();s.npc.yu.met=true;Core.killNpc(s,'yu');assert(ev('people_yu').text(s).includes('女儿'));assert.equal(Object.keys(s.npc).length,31);
s=fresh();Life.plant(s,{id:'shengu',who:'沈孤',kind:'save',line:'你给沈孤药',years:22});s.items['青叶草']=1;let quote=Jianghu.sellPrice(s,'青叶草'),ls=s.ls;choose(s,'echo_shengu',0);assert.equal(s.ls-ls,quote);assert(!s.items['青叶草']);assert(Life.deed(s,'shengu').done);
s=fresh();Life.plant(s,{id:'qiuniang',who:'秋娘',kind:'save'});assert(choose(s,'echo_qiuniang',0).text.includes('消息'));
s=fresh();Life.plant(s,{id:'linzhao',who:'林照',kind:'save'});s.items['清心丹']=1;choose(s,'echo_linzhao',0);assert.equal(s.items['清心丹'],0);assert(Life.deed(s,'linzhao').done);
s=fresh();for(let i=0;i<8;i++)Life.plant(s,{id:'trace'+i,who:'行客'+i,kind:'save'});assert.equal(karmaTraces(s,0).length,8);assert(karmaTraces(s,0).every(x=>x.detail.includes('无失效期限')));
s=fresh();Life.plant(s,{id:'ahe',who:'阿禾',kind:'save'});Life.plant(s,{id:'shengu',who:'沈孤',kind:'save'});Samsara.recordLife(s,'guiyin');const bridge=Samsara.loadMeta().bridge;assert.equal(bridge.roadBonds.length,2);const legacy=Samsara.chooseNaihe('bond','ahe');assert.equal(legacy.bond.id,'ahe');assert(!legacy.wx&&!legacy.page);s=fresh();s.flags.karmaCarry={role:'en',id:'ahe',name:'阿禾'};assert(ev('echo_grace').text(s).includes('孩子已经长大'));const beforeAttrs=[s.xw,s.xj,s.wx,s.ls,s.lifespan];choose(s,'echo_grace',0);assert.deepStrictEqual([s.xw,s.xj,s.wx,s.ls,s.lifespan],beforeAttrs);
console.log('PASS: 31 people; v14 migration; paced life beats; one death notice; irreversible grievance; cached roster and companion exclusion; ten introductions; partner preference/actions/promises/death; personal furnace and departures; distinct echoes; complete clues; named road reincarnation without attributes');
