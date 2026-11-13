#!/usr/bin/env node
/* Executes shipped opening handlers. Not a visual acceptance test. */
'use strict';
const vm=require('vm'),fs=require('fs'),assert=require('assert');
let reduce=false;
const media={get matches(){return reduce},addEventListener(){},removeEventListener(){}};
class Node {
 constructor(tag='div'){this.tagName=tag;this.children=[];this.dataset={};this.attrs={};this.style={};this.textContent='';this.parentNode=null;this.disabled=false;this.hidden=false;this.value='';this._classes=new Set();this.classList={add:(...s)=>s.forEach(x=>this._classes.add(x)),remove:()=>{},toggle:(s,on)=>{if(on)this._classes.add(s);else this._classes.delete(s);},contains:s=>this._classes.has(s)};}
 set className(x){this._classes=new Set(String(x||'').split(/\s+/).filter(Boolean));} get className(){return [...this._classes].join(' ');}
 setAttribute(k,v){this.attrs[k]=String(v);} getAttribute(k){return this.attrs[k]==null?null:this.attrs[k];}
 appendChild(n){if(n.parentNode)n.remove();n.parentNode=this;this.children.push(n);return n;}
 append(...nodes){nodes.forEach(n=>this.appendChild(n));}
 remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(x=>x!==this);}
 addEventListener(k,f){this['on'+k]=f;}
 focus(){document.activeElement=this;}
 click(){if(!this.disabled&&this.onclick)return this.onclick.call(this,{target:this,preventDefault(){},stopImmediatePropagation(){}});}
 querySelectorAll(sel){const out=[];const visit=n=>{for(const c of n.children){const ok=sel[0]==='.'?c._classes.has(sel.slice(1)):c.tagName===sel;if(ok)out.push(c);visit(c);}};visit(this);return out;}
 querySelector(s){return this.querySelectorAll(s)[0]||null;}
 get firstChild(){return this.children[0]||null;}
}
const mapNode=new Node('div');
const document={body:new Node('body'),documentElement:new Node('html'),createElement:t=>new Node(t),hidden:false,activeElement:null,listeners:{},addEventListener(k,f){this.listeners[k]=f},removeEventListener(k){delete this.listeners[k]},getElementById(id){return id==='map'?mapNode:null;}};
document.documentElement.dataset={motion:''};
const LOCS=[{id:'qingshi',name:'青石镇',x:.05},{id:'taohua',name:'桃花溪',x:.15},{id:'shanmen',name:'青冥山门',x:.26},{id:'yunyue',name:'云岳坊',x:.37},{id:'jingcheng',name:'大黎京城',x:.43},{id:'heifeng',name:'黑风岭',x:.52},{id:'gufu',name:'古修洞府',x:.6},{id:'xuewu',name:'血雾谷',x:.68},{id:'xihuang',name:'西荒',x:.77},{id:'beihai',name:'北海',x:.87},{id:'yunhai',name:'云海天阶',x:.96}];
const ctx=vm.createContext({console,document,Uint32Array,Math,JSON,Promise,matchMedia:()=>media,crypto:{getRandomValues:a=>{a[0]=123;return a;}},LOCS,InkMap:{MW:100,MH:100,paint(){return Promise.resolve({});},roadPath(){return '';}}});
for(const file of ['calendar','school','school_ui'])vm.runInContext(fs.readFileSync('js/'+file+'.js','utf8'),ctx);
const UI=vm.runInContext('SchoolUI',ctx);
function host(){return document.body.children[document.body.children.length-1];}
function textOf(n){return (n.textContent||'')+(n.children||[]).map(textOf).join('');}
function click(text){const n=host().querySelectorAll('button').find(b=>textOf(b)===text);assert(n,text);return n.click();}
function clickMap(text){const n=mapNode.querySelectorAll('button').find(b=>textOf(b)===text);assert(n,text);return n.click();}
(async()=>{
 let p=UI.open();click('返回卷首');assert(!(await p).ok);assert.equal(document.body.children.length,0);
 p=UI.open();click('略过介绍');click('告诉先生');assert(/想好了/.test(host().querySelector('.school-dialogue').textContent));
 host().querySelector('input').value='青禾';click('告诉先生');
 assert.equal(host().querySelector('.school-name-line').textContent,'青禾');
 click('先生记下了');click('“我是女儿。”');
 assert(/女儿/.test(host().querySelector('.school-dialogue').textContent));
 click('在位子上坐下');
 const result=await p;assert(result.ok&&result.draft.name==='青禾'&&result.draft.sex==='f');
 assert(!document.body.querySelector('.school-screen'));
 const state={name:'青禾',months:72,school:{almanac:true,chart:0,road:0},calendar:{birthYear:95,birthMonth:1,birthDay:1,seed:123,unlocked:true},found:{qingshi:1},loc:'qingshi'};
 UI.calendar(state);const old=state.months;assert.equal(host().querySelector('h2').textContent,'1月');click('2');assert([...host().querySelectorAll('p')].some(n=>/1月2日/.test(n.textContent)));click('回今日');assert([...host().querySelectorAll('p')].some(n=>/今日/.test(n.textContent)));assert.equal(state.months,old);click('合上历本');
 state.school.chart=1;let went='';UI.atlas(state,d=>{went=d;});
 assert(!mapNode.querySelectorAll('button').some(b=>/沿镇东小路/.test(textOf(b))),'locked road has no travel button');
 clickMap('青州');assert([...mapNode.querySelectorAll('p')].some(n=>/镇东小路还没走通/.test(n.textContent)));
 clickMap('返回九州');clickMap('云州');assert([...mapNode.querySelectorAll('p')].some(n=>/传闻/.test(n.textContent)));
 clickMap('合上图');
 state.school.road=1;UI.atlas(state,d=>{went=d;});clickMap('青州');clickMap('沿镇东小路去桃花溪');assert.equal(went,'taohua');
 console.log('PASS text opening, empty name, gender, calendar, locked and open town road');
})().catch(e=>{console.error(e);process.exitCode=1;});
