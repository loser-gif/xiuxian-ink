#!/usr/bin/env node
/* Executes shipped calendar/School/Core/Slots/newGame, using isolated storage. No layout claims. */
'use strict';
const assert=require('assert'),fs=require('fs');
const {loadWorld,makeStorage,roll,vm}=require('./storage_test_world');
const gameSource=fs.readFileSync('js/game.js','utf8');
function extractFn(name){
  const start=gameSource.indexOf('function '+name+'(');
  if(start<0)throw new Error('missing '+name);
  let i=gameSource.indexOf('{',start),depth=0,quote='',esc=false;
  for(;i<gameSource.length;i++){
    const c=gameSource[i];
    if(quote){if(esc)esc=false;else if(c==='\\')esc=true;else if(c===quote)quote='';continue;}
    if(c==='"'||c==="'"||c==='`'){quote=c;continue;}
    if(c==='{')depth++;
    else if(c==='}'){depth--;if(!depth)return gameSource.slice(start,i+1);}
  }
  throw new Error('unclosed '+name);
}
const st=makeStorage(),ctx=loadWorld(st.localStorage);
vm.runInContext("SchoolUI.clear=()=>{window.schoolCleared=true};",ctx);
const {Core:C,School:H,Dali:D,Slots,Codec}=vm.runInContext('({Core,School,Dali,Slots,Codec})',ctx);
let count=0;function test(n,f){f();count++;console.log('PASS '+n);}
function fresh(){const s=C.newState('青禾',roll(ctx),null);H.begin(s,{seed:135,sex:'f'});return s;}
function act(s,id,n=1){const out=H.action(s,id,n,()=>{});assert(!out.err,out.err);return out;}
function respond(s){if(s.school.pending!==null)act(s,'home');}
function advance(s,days,id='farm'){let n=0;while(n<days){respond(s);const o=act(s,id,Math.min(90,days-n));n+=o.days;assert(o.days>0&&!s.dead);}respond(s);}
test('365-day configurable twelve months; all day/month/year boundaries via runtime actions',()=>{assert.equal(D.yearDays(),365);const s=fresh(),year=D.today(s).year;for(let i=0;i<365;i++){const before=D.exact(s);act(s,'farm');assert(Math.abs(D.exact(s)-before-1)<1e-6);respond(s);}assert.deepEqual(JSON.parse(JSON.stringify(D.today(s))),{year:year+1,month:1,day:1,season:0});assert.equal(s.age,7);assert.equal(s.months,84);});
test('non-January birthday including year boundary and fractional cultivation months',()=>{const s=fresh();s.calendar.birthMonth=12;s.calendar.birthDay=30;C.sync(s);assert.equal(s.age,6);act(s,'farm');assert.equal(s.age,6);assert.equal(D.today(s).month,1);advance(s,364);assert.equal(s.age,7);const before=s.months;C.passTime(s,2.5,()=>{});assert.equal(s.months-before,C.timeMonths(s,2.5));assert(Number.isFinite(D.exact(s)));});
test('same save/day omen and quote stable across opens, JSON migration and codec; bounded probability',()=>{const s=fresh();s.months=144;C.sync(s);const o=JSON.stringify(D.omen(s)),q=JSON.stringify(H.quote(s,'copy'));for(let i=0;i<20;i++){assert.equal(JSON.stringify(D.omen(s)),o);assert.equal(JSON.stringify(H.quote(s,'copy')),q);}const t=C.migrate(Codec.decode(Codec.encode(s)).data);assert.equal(JSON.stringify(D.omen(t)),o);for(let i=0;i<90;i++){for(const k of D.kinds)for(const p of [0,.001,.05,.5,.95,.999,1]){const v=D.probability(s,k,p);assert(v>=0&&v<=1);assert(Math.abs(v-p)<=.03000001);if(p>0&&p<1)assert(v>0&&v<1);else assert.equal(v,p);}act(s,'farm');respond(s);}});
test('school and registration deterministic; childhood retains skills, food and ties at adulthood',()=>{const s=fresh();advance(s,240,'study');const learned=s.school.letters;advance(s,365*10-240);assert.equal(s.age,16);assert.equal(s.school.letters,learned);assert(s.school.family>50&&s.school.farm>120);assert.equal(H.job(s),'抄书人');assert(!s.school.entered&&!s.gf);assert.equal(s.school.clue,0);assert.equal(s.xw,0);});
test('adult livelihood loop can continue, learn craft, buy food, work, repair and stay mortal',()=>{const s=fresh();advance(s,365*10);advance(s,130,'craft');assert.equal(H.job(s),'木匠');const money=s.school.copper;advance(s,90,'repair');assert(s.school.copper>money);const food=s.school.food;act(s,'buy');assert.equal(s.school.food,food+20);act(s,'visit',7);respond(s);assert(!s.school.entered&&!s.dead&&s.school.neighbor>20);});
test('exploration opt-out, knowledge obstruction recoverable, method is not automatic entry',()=>{const s=fresh();advance(s,365*6);act(s,'pause');assert(H.action(s,'seek',1).err);advance(s,120);assert(!s.school.entered&&s.school.clue===0);act(s,'pause');while(s.school.clue<2){respond(s);act(s,'seek');}assert(H.action(s,'seek',1).err);advance(s,30,'study');while(s.school.clue<4){respond(s);act(s,'seek');}assert(!s.gf&&!s.school.entered);respond(s);act(s,'enter');respond(s);act(s,'enter');respond(s);const out=act(s,'enter');assert(out.entered);assert(s.gfs.qingming&&s.gf==='qingming');const xw=s.xw,months=s.months;C.tuna(s,()=>{});assert(s.xw>xw&&s.months>months);respond(s);const food=s.school.food;act(s,'farm',7);assert(s.school.food>food);});
test('old cultivator identity, root, cultivation, legacy and inventory preserve; no school injection',()=>{const s=C.newState('旧修士',roll(ctx),null);s.months=553.5;s.xw=123;s.items.foo=4;s.flags.legacy=1;delete s.calendar;const t=C.migrate(JSON.parse(JSON.stringify(s)));assert(!t.school);for(const key of ['name','months','xw','items','lg'])assert.deepEqual(t[key],s[key]);assert.equal(t.flags.legacy,1);assert.equal(t.age,46);assert(D.label(t).startsWith('大黎'));});
test('v144 village mid-progress retained and resumable, without repeating opening or rewards',()=>{const s=C.newState('旧村童',roll(ctx),null);s.village={version:1,talent:8,material:4,basic:12,goal:true};const before=JSON.stringify(s.village),ls=s.ls;const t=C.migrate(JSON.parse(JSON.stringify(s)));assert.equal(JSON.stringify(t.village),before);assert.equal(t.ls,ls);assert(!t.school);});
test('partial date fields recover with stable defaults; migration does not re-age or reroll twice',()=>{const s=fresh();s.calendar={};const t=C.migrate(s);assert.equal(t.age,6);const once=JSON.stringify(t.calendar);C.migrate(t);assert.equal(JSON.stringify(t.calendar),once);});
test('lifespan ends action with no later reward, no batch rewards past death',()=>{const s=fresh();s.months=80*12-.01;C.sync(s);const old=s.school.copper;const o=act(s,'work',90);assert(s.dead);assert.equal(o.days,0);assert.equal(s.school.copper,old);});
test('town life earns almanac and map, then a persistent choice opens one road',()=>{
  const s=fresh();assert(!s.school.almanac&&s.school.chart===0&&s.found.qingshi===1&&!s.found.taohua);
  assert(/镇东的路/.test(H.travel(s,'taohua',()=>{}).err));
  let o=H.play(s,'study',()=>{});assert(!o.err&&s.school.almanac&&/黄历/.test(o.text));
  o=H.play(s,'farm',()=>{});assert(s.school.people.kin>0);
  let guard=0;while(s.school.affair<1&&guard++<8){o=H.play(s,'visit',()=>{});assert(!o.err);}
  assert(s.school.chart>=1&&s.school.affair===1);
  const help=H.play(s,'study',()=>{});assert.equal(s.school.affairChoice,'teacher');assert(s.school.road===1&&/桃花溪/.test(help.text));
  const other=fresh();other.school.almanac=true;other.school.chart=1;other.school.affair=1;other.school.people={teacher:1,kin:1,mate:1,maker:1};
  const stay=H.play(other,'visit',()=>{});assert.equal(other.school.affairChoice,'kin');assert(!/抬木/.test(stay.text));
  const trip=H.travel(s,'taohua',()=>{});assert.equal(s.loc,'taohua');assert(s.found.taohua===1&&trip.days>=4);
  const again=JSON.parse(JSON.stringify(s));const back=H.travel(again,'qingshi',()=>{});assert.equal(back.traveled,'qingshi');
  assert(/远方|不等于能去/.test(H.travel(s,'yunyue',()=>{}).err));
});
test('adult livelihood stays on the work action, and the creek is not an automatic quest',()=>{
  const s=fresh();s.months=16*12;C.sync(s);
  s.school.people.maker=1;s.school.letters=40;s.school.craft=20;s.school.road=1;s.school.almanac=true;s.school.chart=1;s.school.affair=2;
  s.school.seasonAt=D.today(s).year*4+D.today(s).season;s.school.pending=null;
  assert(H.works(s).indexOf('copy')>=0&&H.works(s).indexOf('repair')>=0);
  let guard=0;while(H.workNow(s)!=='copy'&&guard++<6)H.cycleWork(s);
  assert.equal(H.workNow(s),'copy');
  const money=s.school.copper;const o=H.play(s,'farm',()=>{});
  assert(!o.err&&/书铺|抄/.test(o.text)&&s.school.copper>money&&o.title==='抄书');
  s.loc='taohua';s.school.intent='';const clue=s.school.clue;
  const idle=H.play(s,'visit',()=>{});assert.equal(s.school.clue,clue);assert.equal(idle.title,'走访');
  s.school.intent='seek';const asked=H.play(s,'visit',()=>{});
  assert(s.school.clue>clue&&asked.title==='寻访');
});
test('full page render closes over the live save',()=>{
  const close=gameSource.lastIndexOf('})();');
  assert(close>0);
  for(const name of ['function renderSchool(','function openSchoolLife(','function openVillageTasks(']){
    const at=gameSource.indexOf(name);
    assert(at>0&&at<close,name+' sits outside the game closure, so the page throws ReferenceError: S is not defined');
  }
  assert(gameSource.indexOf('renderSchool();')<gameSource.indexOf('function renderSchool('));
  assert(extractFn('renderSchool').includes('School.mortal(S)'));
  assert(extractFn('openSchoolLife').includes('School.action'));
});
(async()=>{
 st.storage.clear();ctx.__slotTarget=0;ctx.__schoolDraft={name:'青禾',sex:'f',seed:42};ctx.r=roll(ctx);st.flags.failWrite=true;await vm.runInContext("newGame('青禾',r,{id:'free'},'village')",ctx);assert.equal(vm.runInContext('S',ctx),null);assert(ctx.__schoolDraft);assert(!rCreated());st.flags.failWrite=false;
 await vm.runInContext("newGame('青禾',r,{id:'free'},'village')",ctx);let s=Slots.read(0);assert(s.school&&s.age===6&&!s.gf&&s.who.sex==='f');assert(!ctx.__schoolDraft);assert(ctx.schoolCleared);assert(!s.log.some(x=>/测得|山门之内/.test(x.text)));console.log('PASS actual newGame failed write/retry/atomic school creation and identity');count++;
 const raw=st.storage.get(Slots.KEY);await vm.runInContext("newGame('重入',r,{id:'free'},'village')",ctx);assert.equal(st.storage.get(Slots.KEY),raw);
 for(let i=1;i<3;i++)assert(Slots.createEmpty(i,s).ok);const full=st.storage.get(Slots.KEY);assert(!Slots.createEmpty(0,fresh()).ok);assert.equal(st.storage.get(Slots.KEY),full);assert.equal(Slots.read(0).school.roll,42);console.log('PASS refresh/full slots/duplicate submission preserve all existing slots');count++;
 const trial=C.newState('试炼',Object.assign(roll(ctx),{trial:true}),null);assert(!trial.school&&trial.age===40&&trial.realm===2&&trial.ls===120);assert.equal(C.trialStatus(trial).left,240);console.log('PASS real trial remains forty-year-old cultivator, twenty-year time limit');count++;
 // Actual daily UI transaction body: storage failure cannot advance time, inventory or RNG.
 vm.runInContext("let busy=false;function render(){}function renderEntry(){}function checkEnd(){} SchoolUI.life=(s,fn)=>{window.perform=fn};SchoolUI.closeLife=()=>{};",ctx);
 vm.runInContext(extractFn('openSchoolLife'),ctx);
 const stateBefore=vm.runInContext('JSON.stringify(S)',ctx),storedBefore=st.storage.get(Slots.KEY);
 vm.runInContext('openSchoolLife()',ctx);st.flags.failWrite=true;
 const rejected=ctx.perform('farm',7);assert(rejected.err);assert.equal(vm.runInContext('JSON.stringify(S)',ctx),stateBefore);assert.equal(st.storage.get(Slots.KEY),storedBefore);
 st.flags.failWrite=false;const accepted=ctx.perform('farm',7);assert(!accepted.err&&accepted.days===7);assert.equal(Slots.readActive().school.days,7);
 console.log('PASS production openSchoolLife write failure rolls back day, food and random stream, retry saves once');count++;
 const legStore=makeStorage(),legCtx=loadWorld(legStore.localStorage);legCtx.__slotTarget=0;legCtx.__schoolDraft={name:'来世',sex:'m',seed:7};legCtx.r=roll(legCtx);
 vm.runInContext("Samsara.writeLegacy({v:2,naihe:1,kind:'page',page:'qingming'})",legCtx);
 await vm.runInContext("newGame('来世',r,{id:'free'},'village')",legCtx);
 const reborn=vm.runInContext('Slots.read(0)',legCtx);assert(reborn.school&&reborn.gfs.qingming.broken&&!reborn.gf);assert.equal(vm.runInContext('Samsara.peekLegacy()',legCtx),null);
 reborn.months=144;C.sync(reborn);reborn.school.clue=4;reborn.school.pending=null;reborn.school.seasonAt=D.today(reborn).year*4+D.today(reborn).season;
 for(let i=0;i<3;i++){respond(reborn);act(reborn,'enter');}assert.equal(reborn.gf,'qingming');assert(!reborn.gfs.qingming.broken);
 console.log('PASS actual school reincarnation retains inherited broken page, consumes legacy once, optional entry completes earned method');count++;
 console.log('Runtime groups passed: '+count+'; browser/animation/audio not tested.');
})().catch(e=>{console.error(e);process.exitCode=1;});
function rCreated(){return !!ctx.r._created;}
