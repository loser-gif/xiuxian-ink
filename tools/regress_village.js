#!/usr/bin/env node
/* Runtime VM + minimal DOM adapter. No browser, screenshots, layout or animation acceptance. */
'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm'),crypto=require('crypto');
const checks=[];
function check(name,fn){fn();checks.push(name);console.log('PASS '+name);}
const storage=new Map();let failWrite=false,failMeta=false,failRemove=false,seedCalls=0;const writes=[];
const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>{if(failWrite||(failMeta&&k==='moxian.meta'))throw Error('quota');writes.push({key:k,value:String(v)});storage.set(k,String(v));},removeItem:k=>{if(failRemove&&k==='moxian.legacy')throw Error('remove denied');storage.delete(k)}};
const elements=new Map();
function element(key){if(!elements.has(key))elements.set(key,{value:'',hidden:false,disabled:false,textContent:'',dataset:{},style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(){},querySelector:q=>element(key+' '+q),querySelectorAll:()=>[],appendChild(){},focus(){},blur(){}});return elements.get(key);}
const document={querySelector:element,getElementById:k=>element('#'+k),querySelectorAll:q=>q==='.el'?['金','木','水','火','土'].map(k=>{const e=element('.el-'+k);e.textContent=k;return e;}):[],documentElement:{dataset:{}},body:{dataset:{},classList:{add(){},remove(){}}}};
const sandbox={console,Math:Object.create(Math),Date,JSON,Uint32Array,Uint8Array,TextEncoder,TextDecoder,btoa,atob,crypto:{getRandomValues(a){seedCalls++;a[0]=0;return a;}},localStorage,document,setTimeout:()=>0,clearTimeout(){},window:null,globalThis:null};
sandbox.window=sandbox;sandbox.globalThis=sandbox;const ctx=vm.createContext(sandbox);
for(const f of ['data','gongfa','gear','path','story','sect','baijia','world','tianxia','karma','life','juan','calendar','school','core','loops','jianghu','redworld','folio','people','mingge','village','slots','codec','samsara'])vm.runInContext(fs.readFileSync('js/'+f+'.js','utf8'),ctx,{filename:f+'.js'});
ctx.Math.random=()=>.5;
const g=vm.runInContext('({Core,Village,Slots,Codec,LINGGEN,GONGFA})',ctx);const {Core: C,Village: V,Slots}=g;
function draft(route=['book','school','study','count'],talent=1,outcome='money',seed=1,sex='m') {const d=V.draft(seed);d.sex=sex;['grab','six','nine','rain'].forEach((k,i)=>V.choose(d,k,route[i]));d.talent=talent;d.route=outcome;d.confirmed=true;assert(V.valid(d));return d;}
function roll(){return {lg:g.LINGGEN.find(l=>l.id==='san'),els:['金','木','土'],wx:5,luck:2,free:true,origin:'village'};}
function begin(d){const s=C.newState('试村',roll(),null);V.apply(s,d);return s;}
function act(s,id){const r=V.action(s,id,()=>{});assert(!r.err,id+': '+r.err);return r;}
const book=['book','school','craft','rope'],sword=['wood','farm','craft','carry'],bead=['pouch','school','observe','soup'],balanced=['book','farm','craft','soup'];
check('runtime eligibility: all 9216 states, both sexes; all eight talents and three relics; fallback',()=>{
 const seenT=new Set(),seenR=new Set();let n=0;
 for(const a of ['wood','book','pouch'])for(const b of ['school','farm','craft'])for(const c of ['study','farm','craft','observe'])for(const e of ['count','carry','soup','rope'])for(let seed=0;seed<32;seed++)for(const sex of ['m','f']){
 const d=draft([a,b,c,e],8,'money',seed,sex),q=V.qualify(d);assert.equal(Object.values(q.p).reduce((a,b)=>a+b,0),8);assert(q.talents.includes(8));assert(q.routes.includes('money'));q.talents.forEach(x=>seenT.add(x));q.routes.forEach(x=>seenR.add(x));assert(q.routes.filter(x=>['booktag','swordcore','bead'].includes(x)).length<=1);n++;
 } assert.equal(n,9216);assert.equal(seenT.size,8);assert.equal(seenR.size,6);
 assert.deepEqual(Array.from(V.qualify(draft(book,5,'booktag')).talents),[3,5,8]);
 assert.deepEqual(Array.from(V.qualify(draft(balanced,7,'tools')).talents),[6,7,8]);
});
check('frozen seed, stage recomputation and downstream invalidation',()=>{const d=V.draft();const count=seedCalls;d.sex='f';V.choose(d,'grab','pouch');V.choose(d,'six','school');V.choose(d,'nine','observe');V.choose(d,'rain','soup');d.route='bead';d.talent=4;d.confirmed=true;V.choose(d,'six','farm');assert(!d.nine&&!d.rain&&!d.route&&!d.talent&&!d.confirmed);assert.equal(d.originSeed,0);assert.equal(seedCalls,count);assert.equal(Object.values(V.qualify(d).p).reduce((a,b)=>a+b),4);});
check('ordinary initialization, both sexes, only chosen talent/outcome, no Mingge awards, apply idempotence',()=>{for(const sex of ['m','f']){const d=draft(book,5,'booktag',4,sex),s=begin(d);assert.equal(s.ls,22);assert.equal(s.wx,5);assert.equal(s.months,192);assert.equal(s.lifeBonus,0);assert(!s.ming);assert.equal(s.village.talent,5);assert(!s.village.tools);assert.equal(s.village.relic,'booktag');assert.equal(V.apply(s,d),false);assert.equal(s.ls,22);}});
check('weakest roots: ordinary fallback retains survival and can learn/breathe',()=>{const r=roll();r.lg=g.LINGGEN.find(x=>x.id==='wei');const s=C.newState('凡童',r,null);V.apply(s,draft(balanced,8,'money'));assert.equal(s.ls,29);assert(!s.gf);act(s,'job');for(let i=0;i<5;i++)act(s,'basic');assert(s.gf);C.tuna(s,()=>{});assert.equal(s.village.breaths,1);});
check('all talent effects execute via real accessible gameplay and Core injury/progress',()=>{
 const s=begin(draft());const before=s.gfs[s.gf].xp;act(s,'basic');assert(Math.abs(s.gfs[s.gf].xp-before-4.12)<1e-8);
 const t=begin(draft(book,5,'money'));act(t,'art');assert.equal(t.village.art,4.12);assert.equal(t.village.basic,0);
 const injured=begin(draft(sword,2,'money'));for(let i=0;i<3;i++)C.applyFx(injured,{inj:1},()=>{});assert.equal(injured.inj,0);C.applyFx(injured,{inj:1},()=>{});assert.equal(injured.inj,1);
 const stacked=begin(draft(sword,2,'money'));stacked.loop.ti=1;C.applyFx(stacked,{inj:2},()=>{});assert.equal(stacked.inj,1);
 const craft=begin(draft(book,3,'money'));craft.village.material=10;for(let i=0;i<3;i++)act(craft,'repair');assert.equal(craft.village.material,7);act(craft,'repair');assert.equal(craft.village.material,5);
 const gather=begin(draft(balanced,6,'money'));for(let i=0;i<4;i++)act(gather,'gather');assert.equal(gather.village.material,7);const empty=begin(draft(balanced,6,'money'));ctx.Math.random=()=>.05;act(empty,'gather');assert.equal(empty.village.material,0);assert(!empty.village.used.gather);ctx.Math.random=()=>.5;
 const mixed=begin(draft(balanced,7,'tools'));assert.equal(mixed.ls,22);act(mixed,'coupon:money');act(mixed,'coupon:material');act(mixed,'coupon:medicine');assert.equal(mixed.ls,23);assert.equal(mixed.village.material,1);mixed.inj=2;act(mixed,'heal');assert.equal(mixed.inj,1);assert(V.action(mixed,'coupon:money').err);
 const ready=begin(draft(balanced,8,'money'));assert.equal(ready.ls,29);
 const clue=begin(draft(bead,4,'money'));for(let i=0;i<3;i++){const text=act(clue,'explore').text;assert(text.includes('走高坡'));act(clue,'ridge');}assert.equal(clue.village.material,6);const unlucky=begin(draft(bead,4,'money'));act(unlucky,'explore');ctx.Math.random=()=>.1;act(unlucky,'ridge');assert.equal(unlucky.village.material,0);assert.equal(unlucky.inj,0);ctx.Math.random=()=>.5;assert(!act(clue,'explore').text.includes('走高坡'));act(clue,'bank');assert.equal(clue.inj,1);
});
check('real contact, apprentice and ordinary goal; no automatic sect rank',()=>{const s=begin(draft(undefined,1,'letter'));act(s,'letter');assert(s.village.goal);assert.equal(s.ls,24);assert(V.action(s,'letter').err);assert.equal(s.sect.org,null);const t=begin(draft(balanced,7,'tools'));act(t,'gather');act(t,'gather');act(t,'gather');act(t,'repair');assert(t.village.goal);assert.equal(t.village.material,0);});
check('I1 fixed decipher, genuinely paid optional basic learning refund, no-charge does not consume',()=>{const s=begin(draft(book,5,'booktag'));act(s,'awaken');assert(s.village.awake);act(s,'basic');assert(!s.village.used.booktag);s.village.material=4;for(let i=0;i<3;i++)act(s,'basicPaid');assert.equal(s.village.material,4);act(s,'basicPaid');assert.equal(s.village.material,3);assert.equal(s.village.used.booktag,3);});
check('I2 ordinary repair awakens; only tool maintenance, separate from T2',()=>{const s=begin(draft(sword,2,'swordcore'));s.village.material=20;act(s,'repair');assert(s.village.awake&&s.village.tools);assert.equal(s.village.material,18);for(let i=0;i<3;i++)act(s,'repair');assert.equal(s.village.material,12);act(s,'repair');assert.equal(s.village.material,9);assert.equal(s.village.used.maintenance,3);assert(!s.village.used.injury);C.applyFx(s,{inj:1},()=>{});assert.equal(s.inj,0);assert.equal(s.village.used.injury,1);});
check('bead narrow chain and ordinary fallback',()=>{assert(V.qualify(draft(bead,4,'money',0)).routes.includes('bead'));assert(!V.qualify(draft(bead,4,'money',1)).routes.includes('bead'));const d=draft(bead,4,'bead',0);V.choose(d,'six','farm');assert(!V.valid(d));});
check('I3 ten actual Core.tuna actions, goal/material gates, fixed awakening',()=>{const s=begin(draft(bead,4,'bead',0));assert(V.action(s,'awaken').err);for(let i=0;i<10;i++)C.tuna(s,()=>{});assert.equal(s.village.breaths,10);assert(V.action(s,'awaken').err);act(s,'job');assert(V.action(s,'awaken').err);act(s,'gather');act(s,'awaken');assert.equal(s.village.material,0);assert(s.village.awake);assert.equal(s.village.stored,0);});
check('bead runtime fraction, base-only and bonus exclusion, full/later action/release ceiling/recharge, no offline',()=>{
 const s=begin(draft(bead,4,'bead',0));s.village.breaths=10;s.village.goal=true;s.village.material=1;act(s,'awaken');s.wx=6;
 const base=Math.round(C.unit(s)*C.K.tunaGain);// base incorporates roots/wuxing, no season/gf bonuses
 C.tuna(s,()=>{});assert.equal(s.village.stored,base/10);assert.equal(s.village.capacity,base);
 s.gfs[s.gf].lv=5;const before=s.village.stored;C.tuna(s,()=>{});assert(Math.abs(s.village.stored-before-base/10)<1e-8);
 const stash=s.village.stored;C.passTime(s,12,()=>{});assert.equal(s.village.stored,stash);C.biguan(s,()=>{});assert.equal(s.village.stored,stash);
 for(let i=0;i<8;i++)C.tuna(s,()=>{});assert(Math.abs(s.village.stored-base)<1e-8);const fullAt=s.village.fullAt;assert(fullAt>0);assert(!s.village.release);act(s,'release');
 // Real Core breath with controlled baseline, same random stream. Alter roots down to prove release ceiling.
 s.lg.mult=.5;const low=Math.round(C.unit(s)*C.K.tunaGain);const clone=JSON.parse(JSON.stringify(s));delete clone.village;ctx.Math.random=()=>.5;
 C.tuna(clone,()=>{});C.tuna(s,()=>{});assert.equal(s.xw-clone.xw,Math.min(base,low));assert.equal(s.village.stored,low/10);assert(s.village.breaths>fullAt);assert(!s.village.release);
});
check('old save migration and codec preserve resources, no childhood or effect backfill',()=>{const s=C.newState('旧卷',roll(),null);const old=JSON.stringify(s);const migrated=C.migrate(JSON.parse(old));assert(!migrated.village);assert.equal(migrated.ls,20);assert.equal(migrated.v,16);assert.equal(migrated.months,192);const code=g.Codec.encode(migrated);assert(code.startsWith('MX1.'));const read=g.Codec.decode(code).data;assert.equal(read.name,migrated.name);assert(!read.village);const fresh=begin(draft(bead,4,'bead',0));const decoded=C.migrate(g.Codec.decode(g.Codec.encode(fresh)).data);assert.equal(decoded.village.relic,'bead');});
check('slot atomic full/failure/idempotence and existing saves unchanged',()=>{storage.clear();const old=C.newState('原卷',roll(),null);storage.set(Slots.KEY,JSON.stringify({v:1,active:0,slots:[{sum:{},data:old},null,null]}));const raw=storage.get(Slots.KEY);const s=begin(draft());failWrite=true;assert(!Slots.createEmpty(1,s).ok);assert.equal(storage.get(Slots.KEY),raw);failWrite=false;assert(!Slots.createEmpty(0,s).ok);assert.equal(storage.get(Slots.KEY),raw);assert(Slots.createEmpty(1,s).ok);const saved=storage.get(Slots.KEY);assert(!Slots.createEmpty(1,s).ok);assert.equal(storage.get(Slots.KEY),saved);assert.equal(Slots.read(0).name,'原卷');});
check('all three occupied slots cannot be overwritten by new childhood',()=>{storage.clear();const s=begin(draft());for(let i=0;i<3;i++)assert(Slots.createEmpty(i,s).ok);const raw=storage.get(Slots.KEY);assert.equal(Slots.firstEmpty(),-1);for(let i=0;i<3;i++)assert(!Slots.createEmpty(i,s).ok);assert.equal(storage.get(Slots.KEY),raw);});
check('I1 refusal with no materials or max technique never consumes refund',()=>{
 const s=begin(draft(book,5,'booktag'));act(s,'awaken');assert(V.action(s,'basicPaid').err);assert(!s.village.used.booktag);s.village.material=2;s.gfs[s.gf].lv=9;assert(V.action(s,'basicPaid').err);assert.equal(s.village.material,2);assert(!s.village.used.booktag);
});
check('all timed village actions stop rewards/progress/awakening on actual lifespan death',()=>{
 for(const id of ['job','letter','gather','basic','basicPaid','art','repair','awaken','ridge','bank']){
 const s=begin(id==='letter'?draft(undefined,1,'letter'):draft(book,5,'booktag'));s.village.material=10;if(['ridge','bank'].includes(id))act(s,'explore');
 s.months=s.lifespan*12-1;const ls=s.ls,basic=s.village.basic,art=s.village.art,mat=s.village.material,xp=s.gfs[s.gf].xp;
 act(s,id);assert(s.dead,id);assert.equal(s.ls,ls,id);assert.equal(s.village.basic,basic);assert.equal(s.village.art,art);assert.equal(s.gfs[s.gf].xp,xp);assert(s.village.material<=mat);assert(!s.village.goal&&!s.village.awake);assert(!s.village.used.booktag);
 }
 // Exercise the same post-time guard when a real lifecycle hook ends in ascension.
 const s=begin(draft()),tick=vm.runInContext('Juan.tick',ctx);ctx.endTick=(s)=>{s.ascended=true};vm.runInContext('Juan.tick=endTick',ctx);const ls=s.ls;act(s,'job');assert(s.ascended);assert.equal(s.ls,ls);vm.runInContext('Juan.tick=undefined',ctx);vm.runInContext('Juan',ctx).tick=tick;
});
check('I3 same pre-state: injury and negative buff honored, positives/aux excluded, production unchanged',()=>{
 for(const mode of ['injury','positive','negative','aux','mismatch','noGf']){
 const s=begin(draft(bead,4,'bead',0));s.village.awake=true;let penalty=1;
 if(mode==='injury'){s.inj=1;s.buff={mul:3,n:1};penalty=.5;}
 if(mode==='positive')s.buff={mul:3,n:1};
 if(mode==='negative'){s.buff={mul:.6,n:1};penalty=.6;}
 if(mode==='aux'){const id=Object.keys(g.GONGFA).find(k=>k!==s.gf&&g.GONGFA[k].t.spd>1);s.aux=[id];s.gfs[id]={lv:3,xp:0};}
 if(mode==='mismatch'){s.lgEls=['金'];penalty=Math.min(1,C.gfMatch(s,s.gf));}
 if(mode==='noGf'){s.gf=null;penalty=C.K.noGf;}
 const base=Math.round(C.unit(s)*C.K.tunaGain*penalty),clone=JSON.parse(JSON.stringify(s));delete clone.village;
 C.tuna(clone,()=>{});C.tuna(s,()=>{});assert.equal(s.xw,clone.xw,mode);assert.equal(s.inj,clone.inj);assert.deepEqual(s.buff,clone.buff);assert.equal(s.village.stored,base/10,mode);assert.equal(s.village.capacity,base);
 }
});
check('I3 bottleneck refusal retains full stash; final mortal breath neither charges nor releases nor credits awakening',()=>{
 for(const final of [false,true]){const s=begin(draft(bead,4,'bead',0));s.village.awake=true;s.village.capacity=42;s.village.stored=42;s.village.fullAt=10;s.village.breaths=10;s.village.release=true;
 if(final)s.months=s.lifespan*12-1;else{s.stage=vm.runInContext('REALMS[0].stages.length-1',ctx);s.xw=C.req(s)-1;}
 const clone=JSON.parse(JSON.stringify(s));delete clone.village;C.tuna(clone,()=>{});C.tuna(s,()=>{});assert.equal(s.xw,clone.xw);assert.equal(s.village.stored,42);assert(s.village.release);assert.equal(s.village.breaths,final?10:11);if(final)assert(s.dead);
 if(!final){C.tuna(s,()=>{});assert.equal(s.village.breaths,11);assert.equal(s.village.stored,42);}
 }
 const sealed=begin(draft(bead,4,'bead',0));sealed.months=sealed.lifespan*12-1;C.tuna(sealed,()=>{});assert(sealed.dead);assert.equal(sealed.village.breaths,0);
});
// Execute actual game functions, extracted without the browser startup/visual driver.
const game=fs.readFileSync('js/game.js','utf8');
function functionSource(name){const at=game.indexOf('function '+name+'('),prefix=game.slice(Math.max(0,at-6),at)==='async '?'async ':'';let i=game.indexOf('{',at),n=1,j=i+1; // function boundaries below use next top-level function/comment, preserving complete source
 const next=game.indexOf('\nfunction ',i+1),nextAsync=game.indexOf('\nasync function ',i+1),comment=game.indexOf('\n/* =================',i+1);const end=Math.min(...[next,nextAsync,comment].filter(x=>x>=0));return prefix+game.slice(at,end);}
vm.runInContext(`const clamp=Core.clamp, pick=Core.pick; let S=null, roll=null, rerolls=2, testing=false, playTick=0, curScreen='create'; const $=q=>document.querySelector(q), $$=q=>document.querySelectorAll(q); const FX={requestTilt(){}}; const VillageUI={clear(){}}; const SchoolUI={clear(){}}; const LEGACY_KEY='moxian.legacy'; const SAVE_KEY='moxian.v1'; function pushLog(row){if(S)S.log.push(row)} function toast(s){window.lastToast=s} function save(){if(S)Slots.writeActive(S)} function enterMain(){curScreen='main';return Promise.resolve()} function paintWhoPick(){} function inkWrite(e,s){e.textContent=s;return 0} const sleep=()=>Promise.resolve(); function linggenFlavor(){return '测灵'} async function openOrigin(){return 'qingshi'} async function openBaishan(){return {id:'free'}} function openGoalPicker(){} function clearOpeningSex(){window.__openingSex=null;window.__villageDraft=null} function initTitle(){} function unrollTo(){};`,ctx);
for(const name of ['clipMark','noteMark','appendInitialLog','rollLinggen','doTest','initCreate','newGame'])vm.runInContext(functionSource(name),ctx,{filename:'game.js#'+name});
(async()=>{
 check('single slot persistence includes real Folio, guide, initial logs; late preparation exception rolls back',()=>{
 storage.clear();writes.length=0;ctx.__slotTarget=0;ctx.__villageDraft=draft();ctx.testRoll=roll();ctx.__who={sex:'f',mate:'any'};
 const before=vm.runInContext('S',ctx),boot=vm.runInContext('Folio.boot',ctx);ctx.failBoot=()=>{throw Error('late init failure')};vm.runInContext('Folio.boot=failBoot',ctx);
 vm.runInContext("newGame('未成',testRoll,{id:'free'},'village')",ctx);assert.equal(vm.runInContext('S',ctx),before);assert.equal(storage.size,0);assert(!ctx.__villageDraft._created);
 vm.runInContext('Folio',ctx).boot=boot;vm.runInContext("newGame('全卷',testRoll,{id:'free'},'village')",ctx);
 const slotWrites=writes.filter(x=>x.key===Slots.KEY);assert.equal(slotWrites.length,1);const saved=JSON.parse(slotWrites[0].value).slots[0].data;assert(saved.echo&&saved.who&&saved.flags.guide);assert(saved.log.length>=3);assert(saved.log.every(e=>e.time));assert.equal(saved.who.sex,'m');assert.equal(JSON.stringify(saved),JSON.stringify(vm.runInContext('S',ctx)));
 });
 check('real Samsara recordLife / chooseNaihe / legacy / meta.lives: quota rollback then full candidate',()=>{
 storage.clear();const sam=vm.runInContext('Samsara',ctx),prior=C.newState('前身',roll(),null);prior.dead=true;prior.ending='zuohua';sam.recordLife(prior,'zuohua','旧卷');assert(sam.bridgeOpen());sam.chooseNaihe('mem');const leg=sam.peekLegacy();assert(leg.naihe&&leg.kind==='mem');assert.equal(sam.loadMeta().lives,1);
 ctx.__villageDraft=null;ctx.__slotTarget=0;ctx.testRoll=roll();const raw=JSON.stringify([...storage]),oldS=vm.runInContext('S',ctx);failWrite=true;vm.runInContext("newGame('后身',testRoll,{id:'free'},'shusheng')",ctx);failWrite=false;assert.equal(JSON.stringify([...storage]),raw);assert.equal(vm.runInContext('S',ctx),oldS);assert(sam.peekLegacy());
 vm.runInContext("newGame('后身',testRoll,{id:'free'},'shusheng')",ctx);const saved=Slots.read(0);assert.equal(saved.flags.lives,1);assert(!saved.village&&!saved.flags.guide);assert(saved.wx>5);assert(saved.log.some(e=>e.title==='奈何'));assert(saved.echo.kinds.length);assert.equal(sam.peekLegacy(),null);const once=storage.get(Slots.KEY);vm.runInContext("newGame('重复后身',testRoll,{id:'free'},'shusheng')",ctx);assert.equal(storage.get(Slots.KEY),once);
 });

 check('selective late meta/remove failures: real creation, reload, future writes and no stale receipt replay',()=>{
 for(const mode of ['meta','remove']){
 storage.clear();const sam=vm.runInContext('Samsara',ctx),prior=C.newState('前身',roll(),null);prior.dead=true;prior.ending='zuohua';sam.recordLife(prior,'zuohua','旧卷');sam.chooseNaihe('mem');
 const oldMeta=JSON.parse(storage.get('moxian.meta'));oldMeta.backfilled=0;storage.set('moxian.meta',JSON.stringify(oldMeta));const before=storage.get('moxian.meta');ctx.__villageDraft=null;ctx.__slotTarget=0;ctx.testRoll=roll();failMeta=mode==='meta';failRemove=mode==='remove';
 vm.runInContext("newGame('后身',testRoll,{id:'free'},'shusheng')",ctx);
 assert(ctx.testRoll._created);assert.equal(Slots.loadBox().slots.filter(Boolean).length,1);assert.equal(sam.peekLegacy(),null);
 assert.notEqual(Slots.loadBox().creationEffects['moxian.meta'],before);if(mode==='remove')assert(storage.get('moxian.legacy'));else assert.equal(storage.get('moxian.meta'),before);
 ctx.__slotTarget=0;ctx.testRollRetry=roll();vm.runInContext("newGame('占卷重试',testRollRetry,{id:'free'},'shusheng')",ctx);assert(!ctx.testRollRetry._created);assert.equal(Slots.loadBox().slots.filter(Boolean).length,1);
 const saved=Slots.read(0),wx=saved.wx;assert(wx>5);const once=storage.get(Slots.KEY);
 vm.runInContext("newGame('重复',testRoll,{id:'free'},'shusheng')",ctx);assert.equal(storage.get(Slots.KEY),once);
 // Fresh lexical modules sharing only the storage adapter, not Samsara memory.
 const fresh=vm.createContext({localStorage,console,Date,JSON,Math,Core:C,NPCS:{},GONGFA:g.GONGFA});
 for(const f of ['slots','samsara'])vm.runInContext(fs.readFileSync('js/'+f+'.js','utf8'),fresh);
 const re=vm.runInContext('({Slots,Samsara})',fresh);assert.equal(re.Samsara.peekLegacy(),null);assert.equal(re.Slots.readActive().wx,wx);
 const later=re.Samsara.loadMeta();later.guide=77;re.Samsara.saveMeta(later);assert.equal(re.Samsara.loadMeta().guide,77);
 re.Slots.setActive(0);re.Slots.writeActive(saved);assert.equal(re.Samsara.loadMeta().guide,77);
 failMeta=false;failRemove=false;assert.equal(re.Samsara.peekLegacy(),null);assert(!storage.has('moxian.legacy'));assert.equal(JSON.parse(storage.get('moxian.meta')).guide,77);
 re.Samsara.writeLegacy({wx:2});assert.equal(re.Samsara.peekLegacy().wx,2);re.Slots.read(0);assert.equal(re.Samsara.peekLegacy().wx,2);assert.equal(re.Samsara.loadMeta().guide,77);
 assert.equal(re.Slots.loadBox().slots.filter(Boolean).length,1);
 }
 });
 check('failed legacy removal cannot grant inheritance to a second actual creation',()=>{
 storage.clear();const sam=vm.runInContext('Samsara',ctx);sam.writeLegacy({wx:2});failRemove=true;ctx.__villageDraft=null;ctx.__slotTarget=0;ctx.testRoll=roll();
 vm.runInContext("newGame('继承',testRoll,{id:'free'},'shusheng')",ctx);assert.equal(Slots.read(0).wx,7);assert(storage.has('moxian.legacy'));
 ctx.__slotTarget=1;ctx.testRoll=roll();vm.runInContext("newGame('不再继承',testRoll,{id:'free'},'shusheng')",ctx);assert.equal(Slots.read(1).wx,5);assert.equal(Slots.loadBox().slots.filter(Boolean).length,2);
 failRemove=false;assert.equal(sam.peekLegacy(),null);assert(!storage.has('moxian.legacy'));
 });
 check('first-life meta mirror failure still commits complete guide and atlas atomically',()=>{
 storage.clear();storage.set('moxian.meta',JSON.stringify(vm.runInContext('Samsara.emptyMeta()',ctx)));ctx.__villageDraft=draft();ctx.__slotTarget=0;ctx.testRoll=roll();failMeta=true;
 vm.runInContext("newGame('初生',testRoll,{id:'free'},'village')",ctx);assert(ctx.testRoll._created);assert(Slots.read(0).flags.guide);assert(Slots.loadBox().creationEffects['moxian.meta']);
 failMeta=false;const sam=vm.runInContext('Samsara',ctx);sam.loadMeta();assert(storage.has('moxian.meta'));
 });

 check('actual newGame: write failure leaves current state/old slots untouched; retry creates once',()=>{storage.clear();const old=C.newState('在修旧卷',roll(),null);ctx.old=old;vm.runInContext('S=old',ctx);storage.set(Slots.KEY,JSON.stringify({v:1,active:0,slots:[{sum:{},data:old},null,null]}));const raw=storage.get(Slots.KEY);ctx.__slotTarget=1;ctx.__villageDraft=draft(bead,4,'bead',0,'f');ctx.__who={sex:'f',mate:'any'};ctx.testRoll=roll();failWrite=true;vm.runInContext("newGame('新村',testRoll,{id:'free'},'village')",ctx);assert.equal(vm.runInContext('S.name',ctx),'在修旧卷');assert.equal(storage.get(Slots.KEY),raw);assert(!ctx.__villageDraft._created);failWrite=false;vm.runInContext("newGame('新村',testRoll,{id:'free'},'village')",ctx);const s=vm.runInContext('S',ctx);assert.equal(s.name,'新村');assert.equal(s.who.sex,'f');assert.equal(s.ls,22);assert(s.village&&!s.ming);const raw2=storage.get(Slots.KEY);vm.runInContext("newGame('重复',testRoll,{id:'free'},'village')",ctx);assert.equal(storage.get(Slots.KEY),raw2);assert.equal(s.name,'新村');C.tuna(s,()=>{});assert.equal(s.village.breaths,1);});
 check('actual root sampler independent from origin seed, sex, growth and animation',()=>{ctx.Math.random=()=>.42;ctx.__villageDraft=draft(book,5,'booktag',0,'f');const a=vm.runInContext('rollLinggen()',ctx);ctx.__villageDraft=draft(sword,2,'money',31,'m');const b=vm.runInContext('rollLinggen()',ctx);assert.equal(JSON.stringify(a),JSON.stringify(b));});
 storage.clear();ctx.__slotTarget=0;ctx.__villageDraft=draft(balanced,7,'tools',3,'m');ctx.__who={sex:'m',mate:'any'};
 // doTest needs the five actual elemental DOM slots, model only those nodes.
 vm.runInContext("initCreate(); roll=null;",ctx);
 await vm.runInContext("doTest()",ctx);
 element('#inp-name').value='村中旧名';
 const beforeCancel=JSON.stringify([...storage]);const beforeState=vm.runInContext('S',ctx);
 vm.runInContext("openBaishan=async()=>null",ctx);await element('#btn-start').onclick();
 check('actual final UI cancel does not create or write',()=>{assert.equal(JSON.stringify([...storage]),beforeCancel);assert.equal(vm.runInContext('S',ctx),beforeState);assert(!ctx.__villageDraft._created);});
 vm.runInContext("openBaishan=async()=>({id:'free'})",ctx);
 await element('#btn-start').onclick();
 check('actual name/root UI final handler -> Core.newState -> slot -> real breathing',()=>{const s=vm.runInContext('S',ctx);assert.equal(s.name,'村中旧名');assert.equal(s.origin,'village');assert.equal(s.village.talent,7);assert.equal(s.village.route,'tools');assert.equal(s.ls,22);assert.equal(Slots.read(0).name,s.name);C.tuna(s,()=>{});assert.equal(s.village.breaths,1);});
 check('actual trial initialization and ordinary later creation, no forced village',()=>{storage.clear();ctx.__villageDraft=null;ctx.__trialStart=true;ctx.__slotTarget=0;ctx.testRoll=roll();vm.runInContext("newGame('试炼',testRoll,{id:'free'},'qingshi')",ctx);const s=vm.runInContext('S',ctx);assert.equal(s.realm,2);assert.equal(s.ls,120);assert(!s.village);ctx.__slotTarget=1;ctx.testRoll=roll();vm.runInContext("newGame('来世',testRoll,{id:'free'},'qingshi')",ctx);assert(!vm.runInContext('S.village',ctx));});

 vm.runInContext("let newLifeLock=false,shownRealm='';FX.setSeason=()=>{};FX.setGold=()=>{};function aliveSave(){return Slots.readActive()} function drawMountains(){} function paintNoticeDot(){} function realmStr(s=S){return Core.realmStr(s)} function resetCreate(){window.resetCount=(window.resetCount||0)+1} function trialBrief(){return Promise.resolve(true)} function openNaihe(go){window.bridgeCallback=go} SchoolUI.open=()=>{window.villageOpens=(window.villageOpens||0)+1;return Promise.resolve({ok:false})};",ctx);
 for(const name of ['pickSlotForNew','paintLunhuiSeal','applyOpeningSex','initTitle'])vm.runInContext(name==='pickSlotForNew'?functionSource(name).split('/* 一念上山')[0]:functionSource(name),ctx);
 async function titleClick(){vm.runInContext('initTitle()',ctx);element('#btn-new').onclick();for(let n=0;n<12;n++)await Promise.resolve();}
 storage.clear();ctx.villageOpens=0;await titleClick();check('actual title first life opens school; cancel releases lock',()=>{assert.equal(ctx.villageOpens,1);assert(!vm.runInContext('newLifeLock',ctx));});
 const sam=vm.runInContext('Samsara',ctx),m=sam.emptyMeta();m.lives=2;m.guide=1;sam.saveMeta(m);await titleClick();check('actual title later life opens school',()=>assert.equal(ctx.villageOpens,2));
 storage.clear();sam.writeLegacy({wx:1});await titleClick();check('actual title legacy opens school without consumption on cancel',()=>assert.equal(ctx.villageOpens,3));
 storage.clear();const ended=C.newState('终卷',roll(),null);ended.dead=true;ended.ending='zuohua';sam.recordLife(ended,'zuohua','旧卷');await titleClick();assert(ctx.bridgeCallback);assert(vm.runInContext('newLifeLock',ctx));sam.chooseNaihe('mem');await ctx.bridgeCallback();check('actual title bridge callback reaches school after Naihe choice',()=>{assert.equal(ctx.villageOpens,4);assert(!vm.runInContext('newLifeLock',ctx));});
 storage.clear();for(let i=0;i<3;i++)Slots.createEmpty(i,begin(draft()));vm.runInContext('initTitle()',ctx);const full=storage.get(Slots.KEY);element('#btn-new').onclick();for(let n=0;n<12;n++)await Promise.resolve();check('actual title three full slots refuses without overwrite',()=>{assert.equal(ctx.villageOpens,4);assert.equal(storage.get(Slots.KEY),full);});
 storage.clear();vm.runInContext('initTitle()',ctx);await element('#btn-trial').onclick();check('actual title trial uses separate entry without activating slot',()=>{assert(ctx.__trialStart);assert.equal(ctx.villageOpens,4);assert.equal(Slots.loadBox().slots.filter(Boolean).length,0);});ctx.__trialStart=false;
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{console.log(checks.length+' runtime checks passed. DOM adapter does not verify visuals.');});
