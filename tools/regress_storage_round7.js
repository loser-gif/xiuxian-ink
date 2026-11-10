#!/usr/bin/env node
'use strict';
// Real production function bodies and modules, deterministic DOM/transition adapter.
// This does not exercise browser layout, audio, or browser localStorage.
const assert=require('assert'), fs=require('fs'), path=require('path');
const {loadWorld,makeStorage,roll,vm,ROOT}=require('./storage_test_world');
const src=fs.readFileSync(path.join(ROOT,'js/game.js'),'utf8');
function slice(a,b){const i=src.indexOf(a),j=src.indexOf(b,i);assert(i>=0&&j>i);return src.slice(i,j);}
const tests=[];function test(n,f){tests.push([n,f]);}
const tick=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
function setup(noSamsara=false){
 const st=makeStorage(),fault={key:null,skip:0,left:0,hits:0};
 const adapter={getItem(k){if(k===fault.key&&fault.left&&(!fault.scope||new Error().stack.includes(fault.scope))){if(fault.skip)fault.skip--;else{fault.left--;fault.hits++;throw Error('injected '+k);}}return st.localStorage.getItem(k);},setItem:(k,v)=>st.localStorage.setItem(k,v),removeItem:k=>st.localStorage.removeItem(k)};
 const ctx=loadWorld(adapter,false,noSamsara);
 vm.runInContext(`let newLifeLock=false,busy=false;const END_ART={};const pick=a=>a[0];
 function resetCreate(){window.routes=(window.routes||0)+1}
 function unrollTo(s){window.route=s}
 function initTitle(){window.titleShown=true}
 function realmStr(){return '炼气'} function xinjingWord(){return '静'}
 function pickSlotForNew(){window.__slotTarget=1;return Promise.resolve(window.pickOK!==false)}
 function applyOpeningSex(){} function openSheet(t,w){window.sheet=w}
 function closeSheet(){return Promise.resolve()} function inkConfirm(){return Promise.resolve(true)}
 VillageUI.open=async()=>{window.village=(window.village||0)+1;return {ok:false}};
 `+slice('function openNaihe(done)','function openAtlasSheet')+
 slice('function showEnd(kind)','function showTrialEnd()')+
 slice("$('#btn-new').onclick",'const btnTrial')+
 slice('function returnToTitle()','function openMenu()')+
 slice('function openMenu()','const END_NAME ='),ctx);
 ctx.document.body.classList.contains=()=>false;
 const api=vm.runInContext(noSamsara?'({Slots,Core})':'({Slots,Core,Samsara})',ctx);
 const w={...st,...api,ctx,fault};w.el=id=>ctx.document.querySelector(id);
 w.run=s=>vm.runInContext(s,ctx);
 w.arm=(key,skip=0,continuous=false)=>Object.assign(fault,{key,skip,left:continuous?10000:1,hits:0});
 w.restore=()=>fault.left=0;
 w.create=async(name='新卷',index=1)=>{ctx.__slotTarget=index;ctx.testRoll=roll(ctx);await w.run(`newGame(${JSON.stringify(name)},testRoll,{id:'free'},'shusheng')`);};
 w.open=()=>w.run('openNaihe(()=>{window.doneCount=(window.doneCount||0)+1},()=>{window.cancelCount=(window.cancelCount||0)+1})');
 w.choice=()=>w.el('#naihe-opts').children[0];
 return w;
}
async function ended(w,show=false){
 await w.create('前卷',0);w.run("S.dead=true;S.ending='zuohua';S.age=80");
 if(show)w.run("showEnd('zuohua')");else w.Samsara.recordLife(w.run('S'),'zuohua','旧卷');
 w.Samsara.loadMeta(true); // finish normal backfill before fault assertions
}
function untouched(w,before){assert.deepEqual(Object.fromEntries(w.storage),before);assert(!w.ctx.routes);assert(!w.ctx.doneCount);assert(!w.ctx.village);}
for(const entry of ['open','title','reborn'])for(const key of ['moxian.meta','moxian.legacy','moxian.slots'])for(const continuous of [false,true])for(const skip of (entry==='open'?[0]:[0,1])) test(`${entry} ${key} skip=${skip} continuous=${continuous}`,async()=>{
 const w=setup();await ended(w,entry==='reborn');const before=Object.fromEntries(w.storage);
 w.arm(key,0,continuous);if(skip)w.fault.scope='at openNaihe';
 if(entry==='open')await w.open();else await w.el(entry==='title'?'#btn-new':'#btn-reborn').onclick();await tick();
 assert(w.fault.hits>0);untouched(w,before);assert(w.ctx.lastToast.includes('重试'));assert(!w.run('newLifeLock'));
 w.restore();if(entry==='open')await w.open();else await w.el(entry==='title'?'#btn-new':'#btn-reborn').onclick();await tick();
 assert.equal(w.el('#naihe').hidden,false);const button=w.choice();await button.onclick();await button.onclick();await tick();
 assert.equal(w.el('#naihe').hidden,true);assert.equal(w.Samsara.bridgeOpen(true),false);
 await w.create();assert.equal(w.Slots.read(1).flags.naihe,'mem');assert.equal(w.Samsara.peekLegacy(true),null);
 await w.create('后卷',2);assert(!w.Slots.read(2).flags.naihe);
});
for(const kind of ['none','mem','page','bond'])for(const continuous of [false,true])test(`choice ${kind} continuous=${continuous}`,async()=>{
 const w=setup();await ended(w);let m=w.Samsara.loadMeta(true);m.bridge.page={id:'changchun',name:'残篇'};m.bridge.bond={id:'su',name:'故人',role:'en'};w.Samsara.saveMeta(m);
 await w.open();const options=w.el('#naihe-opts').children;const idx={mem:0,page:1,bond:2,none:3}[kind],btn=options[idx];const before=Object.fromEntries(w.storage);
 w.arm('moxian.meta',0,continuous);await btn.onclick();untouched(w,before);assert.equal(w.el('#naihe').hidden,false);
 w.restore();await btn.onclick();await btn.onclick();assert.equal(w.ctx.doneCount,1);await w.create();assert.equal(w.Slots.read(1).flags.naihe,kind);assert.equal(w.Samsara.peekLegacy(true),null);
});
test('cancel, title retry, stale callbacks, slot cancel and create-back preserve choice',async()=>{
 const w=setup();await ended(w);await w.el('#btn-new').onclick();const old=w.choice(),before=Object.fromEntries(w.storage);
 await w.el('#naihe-opts').children.at(-1).onclick();assert(!w.run('newLifeLock'));assert.deepEqual(Object.fromEntries(w.storage),before);
 await w.el('#btn-new').onclick();await old.onclick();assert(w.Samsara.bridgeOpen(true));w.ctx.pickOK=false;await w.choice().onclick();await tick();assert(!w.ctx.routes);assert(!w.run('newLifeLock'));assert(w.Samsara.peekLegacy(true));
 w.ctx.pickOK=true;await w.el('#btn-new').onclick();await tick();assert.equal(w.ctx.routes,1);assert.equal(w.el('#naihe').hidden,true);
 // Actual create-back handler body, with its unrelated controls left in the adapter.
 w.run(slice('function initCreate()','function newGame(name, r, choice, originId)'));w.run('initCreate()');await w.el('#btn-create-back').onclick();assert.equal(w.ctx.route,'title');assert(w.Samsara.peekLegacy(true));
 await w.el('#btn-new').onclick();await tick();await w.create();assert.equal(w.Slots.read(1).flags.naihe,'mem');
});
test('done rejection prompts retry without re-choosing or duplicating sheet',async()=>{
 const w=setup();await ended(w);w.run("openNaihe(()=>{throw Error('done failure')})");await w.choice().onclick();assert(w.ctx.lastToast.includes('重试'));assert(w.Samsara.peekLegacy(true));await w.open();assert.equal(w.ctx.doneCount,1);assert(w.el('#naihe').hidden);
});
test('menu return routes through real title guard; pending choice preserved',async()=>{
 const w=setup();await ended(w);w.run('openMenu()');await w.ctx.sheet.onclick({target:{closest:()=>({dataset:{m:'title'}})}});assert.equal(w.ctx.route,'title');assert(w.Samsara.bridgeOpen(true));await w.el('#btn-new').onclick();assert(!w.el('#naihe').hidden);await w.choice().onclick();await tick();await w.create();assert.equal(w.Slots.read(1).flags.naihe,'mem');
});
for(const noSamsara of [false,true])test(`closed/no pending fallback=${noSamsara}`,async()=>{
 const w=setup(noSamsara);await w.open();assert.equal(w.ctx.doneCount,1);await w.el('#btn-new').onclick();await tick();assert.equal(w.ctx.village,1);await w.create();assert(w.Slots.read(1));
});
test('no Samsara open bridge blocks, actual Slots fallback exposes errors and retries',async()=>{
 const w=setup(true);w.Slots.writeEffect('moxian.meta',JSON.stringify({lives:1,bridge:{open:1}}));
 for(const key of ['moxian.meta','moxian.legacy','moxian.slots']){w.arm(key);await w.el('#btn-new').onclick();await tick();assert(!w.ctx.routes);assert(!w.run('newLifeLock'));w.restore();}
 await w.open();assert(!w.ctx.doneCount);await w.create();assert(!w.Slots.read(1));assert(w.ctx.lastToast.includes('重试'));
});
test('precommit bypass refuses open bridge, restored choice creates once',async()=>{
 const w=setup();await ended(w);const before=Object.fromEntries(w.storage);await w.create();assert.deepEqual(Object.fromEntries(w.storage),before);assert(!w.Slots.read(1));await w.open();await w.choice().onclick();await w.create();assert.equal(w.Slots.read(1).flags.naihe,'mem');
});

for(const key of ['moxian.meta','moxian.legacy','moxian.slots'])for(const continuous of [false,true])for(const phase of ['confirm-write','done','precommit','record'])test(`${phase} ${key} continuous=${continuous}`,async()=>{
 const w=setup();
 if(phase==='record'){
   await w.create('前卷',0);w.run("S.dead=true;S.ending='zuohua';S.age=80");
   w.arm(key,0,continuous);w.fault.scope='at Object.recordLife';w.run("showEnd('zuohua')");
   assert(w.fault.hits);assert(w.ctx.lastToast.includes('重试'));assert(!w.ctx.routes);
   w.restore();await w.el('#btn-reborn').onclick();assert.equal(w.Samsara.loadMeta(true).lives,1);
   await w.el('#btn-reborn').onclick();await w.choice().onclick();await w.create();assert.equal(w.Slots.read(1).flags.naihe,'mem');return;
 }
 await ended(w);await w.el('#btn-new').onclick();
 if(phase==='confirm-write'){
   const before=Object.fromEntries(w.storage);w.arm(key,0,continuous);w.fault.scope='at writeEffect';await w.choice().onclick();
   assert(w.fault.hits);untouched(w,before);assert(!w.el('#naihe').hidden);w.restore();await w.choice().onclick();
 }else{
   await w.choice().onclick();await tick();assert(w.Samsara.peekLegacy(true));w.ctx.routes=0;
   w.arm(key,0,continuous);
   if(phase==='done'){
     // Closed bridge -> actual done wrapper -> actual title go's secondary routing read.
     w.fault.scope='at go';await w.el('#btn-new').onclick();await tick();assert(w.fault.hits);assert(!w.ctx.routes);assert(!w.run('newLifeLock'));
   }else {await w.create();assert(w.fault.hits);assert(!w.Slots.read(1));assert(!w.ctx.testRoll._created);}
   w.restore();await w.el('#btn-new').onclick();await tick();
 }
 await w.create();assert.equal(w.Slots.read(1).flags.naihe,'mem');assert.equal(w.Samsara.peekLegacy(true),null);
});
test('committed recovery wins over title bridge checks and duplicate callbacks',async()=>{
 const w=setup();w.flags.slotsGetThrowAfterSet=1;await w.create('已存',0);assert(w.ctx.__resumeCreated);
 w.flags.slotsGetThrowAfterSet=0;w.flags._wroteSlots=false;
 await w.el('#btn-new').onclick();await tick();assert(!w.ctx.routes);assert(!w.ctx.village);assert(w.el('#naihe').hidden);assert.equal(w.Slots.read(0).name,'已存');assert(!w.Slots.read(1));
});
test('strict API reads reject default bridge/choice/dismiss; restored state unchanged',async()=>{
 const w=setup();await ended(w);for(const expr of ['Samsara.bridgeOpen(true)','Samsara.chooseNaihe("mem")','Samsara.dismissBridge()']){
   const before=Object.fromEntries(w.storage);w.arm('moxian.meta');assert.throws(()=>w.run(expr));assert.deepEqual(Object.fromEntries(w.storage),before);w.restore();
 }
});
test('no-Samsara pending legacy uses real effects, no village, consumes once',async()=>{
 const w=setup(true);w.Slots.writeEffect('moxian.legacy',JSON.stringify({v:1,wx:2}));await w.el('#btn-new').onclick();await tick();assert.equal(w.ctx.routes,1);assert(!w.ctx.village);await w.create();assert.equal(w.Slots.read(1).wx,7);assert.equal(w.Slots.readEffect('moxian.legacy'),null);
});

for(const continuous of [false,true])test(`menu reset guards before clearing source continuous=${continuous}`,async()=>{
 const w=setup();await ended(w);w.run('openMenu()');const before=Object.fromEntries(w.storage);w.arm('moxian.meta',0,continuous);
 const reset=()=>w.ctx.sheet.onclick({target:{closest:()=>({dataset:{m:'reset'}})}});
 await reset();untouched(w,before);assert(w.ctx.lastToast.includes('重试'));w.restore();await reset();assert(!w.el('#naihe').hidden);
 await w.el('#naihe-opts').children.at(-1).onclick();assert.deepEqual(Object.fromEntries(w.storage),before);
 await reset();await w.choice().onclick();assert(!w.Slots.read(0));await w.create();assert.equal(w.Slots.read(1).flags.naihe,'mem');
});
test('reborn cancel returns to end; repeated callbacks cannot record or create twice',async()=>{
 const w=setup();await ended(w,true);const lives=w.Samsara.loadMeta(true).lives;await w.el('#btn-reborn').onclick();const old=w.choice();await w.el('#naihe-opts').children.at(-1).onclick();assert(!w.el('#end').hidden);assert(w.Samsara.bridgeOpen(true));
 await w.el('#btn-reborn').onclick();await old.onclick();assert(w.Samsara.bridgeOpen(true));await w.choice().onclick();await w.el('#btn-reborn').onclick();assert.equal(w.ctx.routes,1);assert.equal(w.Samsara.loadMeta(true).lives,lives);await w.create();assert.equal(w.Slots.read(1).flags.naihe,'mem');
});

test('ascend dismiss read retry does not record a second life or offer bridge',async()=>{
 const w=setup();await w.create('前卷',0);w.run("S.ascended=true;S.ending='ascend';S.age=80");w.arm('moxian.meta');w.fault.scope='at Object.dismissBridge';w.run("showEnd('ascend')");assert(w.fault.hits);const lives=w.Samsara.loadMeta(true).lives;w.restore();await w.el('#btn-reborn').onclick();assert.equal(w.ctx.routes,1);assert(w.el('#naihe').hidden);assert.equal(w.Samsara.loadMeta(true).lives,lives);
});
test('choice second write read failure stays on bridge, then retry inherits once',async()=>{
 const w=setup();await ended(w);await w.open();w.arm('moxian.meta');w.fault.scope='at saveMeta';await w.choice().onclick();assert(w.fault.hits);assert(!w.ctx.doneCount);assert(!w.el('#naihe').hidden);w.restore();assert(w.Samsara.bridgeOpen(true));assert(w.Samsara.peekLegacy(true));await w.choice().onclick();await w.create();assert.equal(w.Slots.read(1).flags.naihe,'mem');assert.equal(w.Samsara.peekLegacy(true),null);
});
test('Samsara without Slots uses actual raw storage, strict read throws',()=>{
 const st=makeStorage();const c=vm.createContext({localStorage:st.localStorage,NPCS:{},console,Date,JSON,Math});vm.runInContext(fs.readFileSync(path.join(ROOT,'js/samsara.js'),'utf8'),c);
 const a=vm.runInContext('Samsara',c);assert.equal(a.bridgeOpen(true),false);st.storage.set('moxian.meta',JSON.stringify({lives:1,backfilled:1,bridge:{open:1,mem:{el:'木'}}}));assert(a.bridgeOpen(true));const get=st.localStorage.getItem;st.localStorage.getItem=()=>{throw Error('raw read')};assert.throws(()=>a.bridgeOpen(true));assert.throws(()=>a.chooseNaihe('mem'));st.localStorage.getItem=get;assert.equal(a.chooseNaihe('mem').kind,'mem');assert.equal(a.bridgeOpen(true),false);
});

for(const pending of [false,true])test(`real showEnd without Samsara pending bridge=${pending}`,async()=>{
 const w=setup(true);await w.create('前卷',0);w.run("S.dead=true;S.ending='zuohua'");
 if(pending)w.Slots.writeEffect('moxian.meta',JSON.stringify({lives:1,bridge:{open:1}}));
 w.run("showEnd('zuohua')");w.arm('moxian.meta');await w.el('#btn-reborn').onclick();assert(!w.ctx.routes);assert(w.ctx.lastToast.includes('重试'));w.restore();await w.el('#btn-reborn').onclick();
 assert.equal(w.ctx.routes||0,pending?0:1);if(!pending){await w.create();assert(w.Slots.read(1));}
});
(async()=>{let failed=0;for(const [n,f]of tests){try{await f();console.log('PASS '+n)}catch(e){failed++;console.error('FAIL '+n+'\n'+e.stack)}}console.log(JSON.stringify({passed:tests.length-failed,failed}));if(failed)process.exitCode=1;})();
