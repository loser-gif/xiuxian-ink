#!/usr/bin/env node
/* Minimal HTML/SVG DOM adapter; executes shipped UI event handlers. NOT rendering verification. */
'use strict';
const vm=require('vm'),fs=require('fs'),assert=require('assert');
let animations=[],seedCalls=0,audioCalls=[],reduce=false,motionCallback=null;const media={get matches(){return reduce},addEventListener(k,fn){this.change=fn},removeEventListener(){delete this.change}};
class Node {
 constructor(tag='div'){this.tagName=tag;this.children=[];this.dataset={};this.attrs={};this.style={};this.textContent='';this.listeners={};this.parentNode=null;this.disabled=false;this._classes=new Set();this.classList={add:(...s)=>s.forEach(x=>this._classes.add(x)),remove:(...s)=>s.forEach(x=>this._classes.delete(x)),toggle:(s,on)=>{on=on===undefined?!this._classes.has(s):on;on?this._classes.add(s):this._classes.delete(s);},contains:s=>this._classes.has(s)};}
 set className(x){this._classes=new Set(x.split(/\s+/));} get className(){return [...this._classes].join(' ');}
 setAttribute(k,v){this.attrs[k]=v;if(k==='class')this.className=v;if(k.startsWith('data-'))this.dataset[k.slice(5)]=v;}
 appendChild(n){if(n.parentNode)n.remove();n.parentNode=this;this.children.push(n);return n;}
 remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(x=>x!==this);}
 addEventListener(k,f){this.listeners[k]=f;}
 removeEventListener(k){delete this.listeners[k];}
 focus(){document.activeElement=this;}
 click(){if(!this.disabled&&this.onclick)return this.onclick.call(this,{target:this});}
 set innerHTML(s){this.children=[];let stack=[this];for(const tok of s.match(/<[^>]+>|[^<]+/g)||[]){if(tok.startsWith('</')){if(stack.length>1)stack.pop();}else if(tok.startsWith('<')){const m=tok.match(/^<([\w-]+)/);if(!m)continue;const n=new Node(m[1]);for(const a of tok.matchAll(/([\w-]+)="([^"]*)"/g))n.setAttribute(a[1],a[2]);stack[stack.length-1].appendChild(n);if(!tok.endsWith('/>')&&!['input','br','hr'].includes(m[1]))stack.push(n);}else stack[stack.length-1].textContent+=tok;}}
 querySelectorAll(sel){const match=n=>sel[0]==='.'?n._classes.has(sel.slice(1)):sel[0]==='['?n.dataset[sel.slice(6,-1)]!==undefined:n.tagName===sel;const out=[];const visit=n=>{for(const c of n.children){if(match(c))out.push(c);visit(c);}};visit(this);return out;}
 querySelector(s){return this.querySelectorAll(s)[0]||null;}
 animate(frames,opts){const a={element:this,frames,opts,state:'running',pause(){this.state='paused'},play(){this.state='running'},cancel(){this.state='cancelled'},finish(){if(this.state==='finished'||this.state==='cancelled')return;this.state='finished';if(this.onfinish)this.onfinish()}};animations.push(a);return a;}
}
const document={body:new Node('body'),documentElement:new Node('html'),createElement:t=>new Node(t),createElementNS:(ns,t)=>new Node(t),hidden:false,listeners:{},addEventListener(k,f){this.listeners[k]=f},removeEventListener(k){delete this.listeners[k]}};
class Audio {constructor(){this.sampleRate=100;}createBuffer(){return {getChannelData:()=>new Float32Array(200)}}createBufferSource(){return {connect(){},start(){audioCalls.push('start')},stop(){audioCalls.push('stop')}}}createBiquadFilter(){return {frequency:{value:0},connect(){}}}close(){audioCalls.push('close')}suspend(){audioCalls.push('suspend')}resume(){audioCalls.push('resume')}}
const ctx=vm.createContext({console,document,Uint32Array,Math,Number,Object,Array,JSON,AudioContext:Audio,matchMedia:()=>media,MutationObserver:class {constructor(fn){motionCallback=fn}observe(){}disconnect(){motionCallback=null}},setTimeout:()=>{throw Error('untracked UI timer')},MoAudio:{setOpeningQuiet:b=>audioCalls.push('quiet:'+b)},crypto:{getRandomValues:a=>{seedCalls++;a[0]=0;return a}},window:null});ctx.window=ctx;
for(const file of ['village','village_ui'])vm.runInContext(fs.readFileSync('js/'+file+'.js','utf8'),ctx);
const {Village:V,VillageUI:UI}=vm.runInContext('({Village,VillageUI})',ctx);
function host(){return document.body.children[0];}
function click(text){const n=host().querySelectorAll('button').find(n=>n.textContent===text);assert(n,'button '+text);return n.click();}
function next(){return host().querySelector('.v-navigation').children[1].click();}
const labels={wood:'拿旧木剑',book:'拿启蒙书册',pouch:'拿粗布香囊',school:'去村塾读书认字',farm:'随家人做活',craft:'跟村匠学艺',study:'读书认字',observe:'观察草木天气',count:'清点物资、传话',carry:'在高坡搬轻物',soup:'看火送姜汤',rope:'棚下理绳'};
function finish(){animations.filter(a=>a.state==='running').forEach(a=>a.finish());}
function skip(){click('略过动作');}
function assertGate(){assert(host().querySelector('.v-navigation').children.slice(-1)[0].disabled);assert(host().querySelector('.v-choices').querySelectorAll('button').every(b=>b.disabled));}
function choose(text){assertGate();const stage=host().dataset.scene;next();assert.equal(host().dataset.scene,stage);finish();click(text);next();assertGate();next();assert.equal(host().dataset.scene,stage);finish();}
function browse(text,button){for(let i=0;i<12;i++){finish();if(host().querySelectorAll('button').some(n=>n.textContent===text)){click(text);return;}click(button);}throw Error('unreachable '+text);}
(async()=>{
 const cases=[[['book','school','craft','rope'],3,'money'],[['book','farm','craft','soup'],6,'tools'],[['book','school','study','count'],1,'letter'],[['book','school','craft','rope'],5,'booktag'],[['book','farm','craft','soup'],7,'tools'],[['wood','farm','craft','carry'],2,'swordcore'],[['pouch','school','observe','soup'],4,'bead']];
 for(const a of ['wood','book','pouch'])for(const b of ['school','farm','craft'])for(const c of ['study','farm','craft','observe'])for(const e of ['count','carry','soup','rope'])cases.push([[a,b,c,e],8,'money']);
 for(const sex of ['男','女'])for(const [route,t,outcome] of cases){
 UI.clear();const promise=UI.open();choose(sex);
 const grip=host().querySelector('.v-infant-grip');assert.equal(grip.dataset.contact,'510,350');assert.equal(grip.querySelector('.v-infant-fingers').dataset.contact,'510,350');assert.equal(grip.parentNode,host().querySelector('.v-father').parentNode);
 assert(!animations.filter(a=>a.state!=='cancelled').some(a=>a.element.classList.contains('v-hand')));next();
 for(const k of route){choose(labels[k]);const before=host().dataset.scene;skip();assert.equal(host().dataset.scene,before);
 const contact=host().querySelector('.v-contact');if(contact){assert.equal(contact.parentNode,host().querySelector('.v-camera'));assert(contact.children.length>=2);assert.equal(contact.dataset.contact,contact.querySelector('.v-contact-hand').dataset.contact);}
 if(k==='wood'){const taps=animations.find(a=>a.element.classList.contains('v-tapping')&&a.state==='finished');assert.equal(taps.frames.filter(f=>f.transform==='translate(0,-65px)').length,2);}
 if(before==='nine'&&route[1]==='school'&&k!=='study'){assert(host().querySelector('.v-chest'));const a=animations.find(a=>a.state==='finished'&&a.element.classList.contains('v-stowed-book'));assert(a);assert.equal(a.frames.slice(-1)[0].transform,'translate(240px,20px)');}
 next();}
 assert.equal(host().dataset.scene,'clue');assertGate();finish();assert(!host().querySelector('.v-packed'));next();
 assert.equal(host().dataset.clue,undefined);assert(!host().classList.contains('v-stow'));browse(V.routes[outcome],'再听后一件安排');click('确认并演出');assertGate();const held=host().querySelector('.v-packed');assert(held);assert.equal(held.children[1].dataset.contact,held.dataset.contact);
 const a=animations.find(a=>a.element===held);const xy=held.dataset.contact.split(',').map(Number);const end=a.frames.slice(-1)[0].transform.match(/translate\(([-.\d]+)px,([-.\d]+)px\)/);assert.equal(xy[0]+Number(end[1]),440);assert.equal(xy[1]+Number(end[2]),445);finish();
 click('收拾妥当，回想这些年');browse(V.talents[t-1],'想起后一段经历');click('确认这项长处');click('再想想长处');click('重新想想去向');browse(V.routes[outcome],'再听后一件安排');click('确认并演出');skip();click('收拾妥当，回想这些年');browse(V.talents[t-1],'想起后一段经历');click('确认这项长处');const finalButton=host().querySelectorAll('button').find(b=>b.textContent==='辞别家人，记下村中旧名');click('辞别家人，记下村中旧名');const exitCount=animations.length;finalButton.onclick();assert.equal(animations.length,exitCount);assert(document.body.children.length);click('暂停');assert(animations.filter(a=>!['cancelled','finished'].includes(a.state)).every(a=>a.state==='paused'));finish();assert(document.body.children.length);skip();const result=await promise;assert(result.ok&&V.valid(result.draft));assert.equal(result.draft.sex,sex==='男'?'m':'f');assert.equal(result.draft.route,outcome);
 }
 console.log('PASS 302 shipped UI paths (all 144 growth routes both sexes + fourteen named outcomes): controllable intro/action/exit gates; explicit route/talent; pause exit; contact parents and bag destination geometry');
 UI.clear();let p=UI.open();const calls=seedCalls;
 click('暂停');assert(animations.filter(a=>a.state!=='cancelled'&&a.state!=='finished').every(a=>a.state==='paused'));assertGate();click('继续演出');const partial=animations.find(a=>a.state==='running');partial.finish();document.hidden=true;document.listeners.visibilitychange();document.hidden=false;document.listeners.visibilitychange();assert.equal(partial.state,'finished');assertGate();finish();assert.equal(host().dataset.phase,'choice');skip();click('女');next();skip();click('男');assert.equal(host().querySelector('.v-navigation').children[1].textContent,'确认并演出');next();skip();next();skip();click('拿粗布香囊');next();skip();click('回看上一幕');skip();click('重播动作');assert.equal(seedCalls,calls);
 click('雨声 / 静音');document.hidden=true;document.listeners.visibilitychange();assert(audioCalls.includes('suspend'));assert(animations.filter(a=>!['cancelled','finished'].includes(a.state)).every(a=>a.state==='paused'));document.hidden=false;document.listeners.visibilitychange();click('返回卷首');assert(!(await p).ok);assert(audioCalls.includes('close'));assert(!document.listeners.visibilitychange);
 p=UI.open();assertGate();reduce=true;media.change();assert.equal(host().dataset.phase,'choice');click('返回卷首');await p;reduce=false;
 p=UI.open();assertGate();document.documentElement.dataset.motion='lite';motionCallback();assert.equal(host().dataset.phase,'choice');click('返回卷首');await p;document.documentElement.dataset.motion='';
 for(const mode of ['os','lite']){reduce=mode==='os';document.documentElement.dataset.motion=mode==='lite'?'lite':'';p=UI.open();assert.equal(seedCalls,calls);assert.equal(host().dataset.phase,'choice');click('女');next();assert.equal(host().dataset.phase,'read');assert.equal(host().dataset.scene,'birth');click('返回卷首');await p;}
 console.log('PASS reselect confirmation, skip never selects/advances, frozen seed, background/audio cleanup, OS and game lite gates');
 console.log('UNVERIFIED: rendering, collision outside declared contacts, mobile/desktop aesthetics, audio. No browser used.');
})().catch(e=>{console.error(e);process.exitCode=1});
