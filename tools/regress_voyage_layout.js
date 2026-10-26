#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const url=process.argv[2]||'http://127.0.0.1:8766/';
const out=path.resolve(process.argv[3]||'voyage-layout-checks');fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[];function check(name,ok,detail){checks.push({name,ok:!!ok,detail});if(!ok)console.error('FAIL',name,detail);}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXE,env:{...process.env,TEMP:out,TMP:out}});
 try{
  const ctx=await browser.newContext({viewport:{width:440,height:956},serviceWorkers:'block',isMobile:true,hasTouch:true,deviceScaleFactor:2});
  await ctx.addInitScript(()=>localStorage.setItem('moxian.look',JSON.stringify({theme:'day',motion:'full',font:'md'})));
  const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(url);await p.waitForFunction(()=>document.documentElement.dataset.voyagePhase==='paint');
  await p.waitForTimeout(1800);await p.setViewportSize({width:844,height:390});await p.waitForTimeout(200);
  check('landscape-art-reflows-during-paint',await p.locator('.splash-board').evaluate(e=>{const b=e.getBoundingClientRect(),c=e.querySelector('canvas');return b.width>b.height&&Math.abs(c.width/c.height-b.width/b.height)<.02;}));
  await p.setViewportSize({width:440,height:956});await p.waitForTimeout(200);
  check('portrait-art-reflows-during-paint',await p.locator('.splash-board').evaluate(e=>{const b=e.getBoundingClientRect(),c=e.querySelector('canvas');return b.height>b.width&&Math.abs(c.width/c.height-b.width/b.height)<.02;}));
  await p.waitForFunction(()=>document.documentElement.dataset.voyagePhase==='wave');await p.setViewportSize({width:375,height:812});await p.waitForTimeout(200);
  check('resized-boat-stays-on-paper',await p.locator('#voyage-boat').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;}));
  await p.keyboard.press('Escape');await p.waitForTimeout(400);await p.locator('#btn-new').click();await p.locator('#inp-name').waitFor();
  await p.evaluate(()=>{__moxian.newGame('南宫听雨',{lg:LINGGEN.find(x=>x.id==='san'),els:['金','木','火'],wx:5,luck:1},{id:'dx'},'qingshi');__moxian.S.flags.guide=0;__moxian.S.ls=999999;Life.setGoal(__moxian.S,'wendao',false);__moxian.render();__moxian.save();});
  await p.waitForFunction(()=>document.body.dataset.screen==='main'&&!__moxian.busy);await p.waitForTimeout(6000);
  for(const [w,h] of [[320,568],[360,640],[375,812],[390,844],[440,956],[844,390]]){
   await p.setViewportSize({width:w,height:h});await p.waitForTimeout(250);
   const g=await p.evaluate(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};return{sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight,log:rect('#log'),actions:[...document.querySelectorAll('.act')].map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};}),audio:rect('#audio-dock')};});
   check('main-'+w+'-fits',g.sw<=w&&g.sh<=h&&g.actions.every(r=>r.x>=0&&r.right<=w&&r.y>=0&&r.bottom<=h)&&g.audio.bottom<=h,g);
   check('main-'+w+'-reading-space',g.log.height>=90,g.log);
   if(w===320||w===440||w===844)await p.screenshot({path:path.join(out,'main-'+w+'.jpg'),type:'jpeg',quality:85});
  }
  await p.setViewportSize({width:390,height:844});await p.evaluate(()=>{document.documentElement.style.setProperty('--sat','47px');document.documentElement.style.setProperty('--sab','34px');__moxian.applyLook({font:'lg',theme:'night'});});await p.waitForTimeout(400);
  check('safe-area-large-text-actions-visible',await p.evaluate(()=>[...document.querySelectorAll('.act')].every(e=>e.getBoundingClientRect().bottom<=innerHeight-34)&&document.querySelector('#log').clientHeight>=90));
  await p.locator('#hud-toggle').click();await p.waitForTimeout(200);
  check('expanded-details-leave-readable-log',await p.evaluate(()=>document.querySelector('#log').clientHeight>=90&&document.documentElement.scrollWidth<=innerWidth));await p.locator('#hud-toggle').click();
  await p.locator('#play-tab-cult').click();await p.locator('#side-cult').click();await p.locator('#sheet.open').waitFor();check('mobile-cult-opens',await p.locator('#sheet-title').innerText()==='功法');await p.keyboard.press('Escape');
  await p.evaluate(()=>{document.documentElement.style.removeProperty('--sat');document.documentElement.style.removeProperty('--sab');__moxian.applyLook({font:'md',theme:'day'});});
  await p.locator('#play-menu').click();await p.locator('[data-m="title"]').click();await p.waitForFunction(()=>document.body.dataset.screen==='title');await p.waitForTimeout(4000);
  for(const [w,h] of [[320,568],[360,640],[375,812],[390,844],[440,956],[844,390]]){
   await p.setViewportSize({width:w,height:h});await p.waitForTimeout(350);
   const g=await p.evaluate(()=>{const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom};};return{sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight,title:rect(document.querySelector('.title-block')),menu:rect(document.querySelector('.title-menu')),boat:rect(document.querySelector('.boat')),buttons:[...document.querySelectorAll('.title-menu button, #audio-dock button')].filter(e=>!e.hidden).map(rect)};});
   check('saved-menu-'+w+'-all-controls-visible',g.sw<=w&&g.sh<=h&&g.buttons.every(r=>r.x>=0&&r.y>=0&&r.right<=w&&r.bottom<=h),g);
   if(w<700)check('saved-menu-'+w+'-title-and-boat-clear',g.title.bottom<g.menu.y&&g.boat.bottom<g.menu.y,g);
   if(w===320||w===440||w===844)await p.screenshot({path:path.join(out,'menu-'+w+'.jpg'),type:'jpeg',quality:85});
  }
  await p.setViewportSize({width:1440,height:900});await p.locator('#btn-continue').click();await p.waitForFunction(()=>document.body.dataset.screen==='main'&&!__moxian.busy);await p.waitForTimeout(500);
  const idle=await p.locator('#scr-main .side').evaluate(e=>{e.style.maxHeight='180px';return{color:getComputedStyle(e).scrollbarColor,width:e.clientWidth};});
  check('side-scrollbar-transparent-at-rest',idle.color.includes('rgba(0, 0, 0, 0)'),idle);
  await p.locator('#scr-main .side').evaluate(e=>{e.scrollTop=80;});await p.waitForTimeout(120);
  const scrolling=await p.locator('#scr-main .side').evaluate(e=>({color:getComputedStyle(e).scrollbarColor,width:e.clientWidth,top:e.scrollTop,active:e.classList.contains('is-scrolling')}));
  check('side-scrolls-without-layout-jump',scrolling.top>0&&scrolling.active&&scrolling.color!==idle.color&&scrolling.width===idle.width,scrolling);
  await p.waitForTimeout(1500);check('side-scrollbar-hides-after-rest',await p.locator('#scr-main .side').evaluate((e,color)=>getComputedStyle(e).scrollbarColor===color,idle.color));
  await p.locator('#side-cult').focus();check('keyboard-focus-exposes-scrollbar',await p.locator('#scr-main .side').evaluate((e,color)=>getComputedStyle(e).scrollbarColor!==color,idle.color));
  await p.locator('#scr-main .side').evaluate(e=>{e.style.maxHeight='';document.activeElement.blur();});await p.waitForTimeout(1500);await p.screenshot({path:path.join(out,'desktop-hidden-scrollbar.jpg'),type:'jpeg',quality:88});
  await ctx.close();
  const fallback=await browser.newContext({viewport:{width:375,height:812},serviceWorkers:'block'});await fallback.addInitScript(()=>{const old=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:old.call(this,type,...args);};localStorage.setItem('moxian.look',JSON.stringify({theme:'day',motion:'full',font:'md'}));});
  const fp=await fallback.newPage();fp.on('pageerror',e=>errors.push(e.message));await fp.goto(url);await fp.waitForFunction(()=>document.body.classList.contains('voyage'));await fp.keyboard.press('Escape');await fp.waitForTimeout(500);
  check('no-webgl-menu-still-usable',await fp.locator('#btn-new').evaluate(e=>!e.disabled&&getComputedStyle(e.querySelector('.bb-ink')).backgroundImage.includes('svg')));await fp.screenshot({path:path.join(out,'fallback-menu.jpg'),type:'jpeg',quality:85});await fp.locator('#btn-new').click();await fp.locator('#inp-name').waitFor();await fallback.close();
  const missing=await browser.newContext({serviceWorkers:'block'});const ep=await missing.newPage();ep.on('pageerror',e=>errors.push(e.message));await ep.route('**/img/open-*.png*',r=>r.abort());await ep.goto(url);await ep.waitForFunction(()=>document.body.classList.contains('voyage-live'));check('missing-art-releases-menu',await ep.locator('#btn-new').isEnabled());await missing.close();
  check('no-page-errors',errors.length===0,errors);
 }finally{await browser.close();fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({checks,errors},null,2));}
 console.log(checks.filter(x=>x.ok).length+'/'+checks.length+' checks passed');if(checks.some(x=>!x.ok)||errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
