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
 append(...nodes){nodes.forEach(n=>this.appendChild(n));}
 replaceChildren(...nodes){this.children=[];this.append(...nodes);}
 get firstChild(){return this.children[0];}
 getAttribute(k){return this.attrs[k]==null?null:this.attrs[k];}
 removeAttribute(k){delete this.attrs[k];}
 querySelectorAll(sel){const match=n=>sel[0]==='.'?n._classes.has(sel.slice(1)):sel[0]==='['?n.dataset[sel.slice(6,-1)]!==undefined:n.tagName===sel;const out=[];const visit=n=>{for(const c of n.children){if(match(c))out.push(c);visit(c);}};visit(this);return out;}
 querySelector(s){return this.querySelectorAll(s)[0]||null;}
 animate(frames,opts){let resolve;const a={element:this,frames,opts,playState:'running',finished:new Promise(r=>resolve=r),pause(){this.playState='paused'},play(){this.playState='running'},cancel(){this.playState='idle';resolve()},finish(){this.playState='finished';resolve()}};animations.push(a);return a;}

}
const document={body:new Node('body'),documentElement:new Node('html'),createElement:t=>new Node(t),createElementNS:(ns,t)=>new Node(t),hidden:false,listeners:{},addEventListener(k,f){this.listeners[k]=f},removeEventListener(k){delete this.listeners[k]}};

document.getElementById=()=>null;
const ctx=vm.createContext({console,document,Uint32Array,Math,JSON,Promise,matchMedia:()=>media,crypto:{getRandomValues:a=>{seedCalls++;a[0]=123;return a}}});
for(const file of ['calendar','school_ui'])vm.runInContext(fs.readFileSync('js/'+file+'.js','utf8'),ctx);
const UI=vm.runInContext('SchoolUI',ctx);
function host(){return document.body.children[document.body.children.length-1];}
function click(text){const n=host().querySelectorAll('button').find(n=>n.textContent===text);assert(n,text);return n.click();}
async function finish(){animations.forEach(a=>a.finish());for(let i=0;i<12;i++)await Promise.resolve();}
(async()=>{
 let p=UI.open();click('返回卷首');assert(!(await p).ok);assert.equal(seedCalls,1);assert.equal(document.body.children.length,0);
 p=UI.open();assert.equal(seedCalls,1);click('沿村路走到学堂');click('报上名字，提笔落在名册上');assert(host().querySelector('input'));host().querySelector('input').value='青禾';click('报上名字，提笔落在名册上');
 assert(!host().querySelectorAll('button').some(n=>n.textContent.includes('儿子')),'name action gates reply');await finish();click('“我是家里的女儿。”');assert(host().querySelector('.school-dialogue').textContent.includes('小姑娘'));click('坐到窗边，听先生讲');click('“先生，我记住了。”');await finish();
 assert(animations.some(a=>a.element.className==='school-book'&&a.frames.some(f=>String(f.transform).includes('110px'))),'book really moves');assert(animations.some(a=>a.element.className==='school-brush-hand'),'brush-hand moves during writing');
 click('翻开今天这一页');click('把历本收好，开始今天的生活');const result=await p;assert(result.ok&&result.draft.name==='青禾'&&result.draft.sex==='f');assert.equal(document.body.children.length,0);
 UI.clear();reduce=true;p=UI.open();click('沿村路走到学堂');host().querySelector('input').value='小石';click('报上名字，提笔落在名册上');await finish();click('“我是家里的儿子。”');click('坐到窗边，听先生讲');click('“先生，我记住了。”');await finish();assert.equal(host().querySelector('.school-book').style.transform,'translate(-25px,110px)');click('翻开今天这一页');click('把历本收好，开始今天的生活');assert((await p).ok);
 const state={name:'青禾',months:72,calendar:{birthYear:95,birthMonth:1,birthDay:1,seed:123,unlocked:true}};UI.calendar(state);const old=state.months;click('后一日');assert(host().querySelector('h2').textContent==='1月2日');click('回今日');assert(host().querySelector('h2').textContent==='1月1日');assert.equal(state.months,old);click('合上历本');assert.equal(document.body.children.length,0);
 console.log('PASS shipped SchoolUI handlers: cancel/retry seed, empty name, writing gate, gender reply, hand/book motion commands, reduced final pose, handover, calendar page navigation; NO rendered visual/audio acceptance');
})().catch(e=>{console.error(e);process.exitCode=1});
