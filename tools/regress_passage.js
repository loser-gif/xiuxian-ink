#!/usr/bin/env node
'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = process.argv[2] || 'http://127.0.0.1:8766/';
const out = path.resolve(process.argv[3] || 'passage-checks');
fs.mkdirSync(out, { recursive: true });
const checks = [], errors = [];
function check(name, ok, detail) { checks.push({ name, ok: !!ok, detail }); if (!ok) console.error('FAIL', name, detail); }
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXE, env: { ...process.env, TEMP: out, TMP: out } });
  async function make(w = 1440, h = 900, theme = 'day', opts = {}) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 700, hasTouch: w < 700, deviceScaleFactor: w === 440 ? 3 : 1, serviceWorkers: 'block', reducedMotion: opts.reduce ? 'reduce' : 'no-preference' });
    await ctx.addInitScript(({theme,opts}) => {
      localStorage.setItem('moxian.look', JSON.stringify({ theme, motion: opts.lite ? 'lite' : 'full', font: opts.font || 'md' }));
      if (opts.noAnimate) Element.prototype.animate = undefined;
    }, {theme,opts});
    const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.goto(url); await p.waitForFunction(() => window.__moxian && document.body.classList.contains('voyage'));
    if (!opts.reduce && !opts.lite) await p.keyboard.press('Escape');
    await p.waitForFunction(() => document.body.classList.contains('voyage-live')); await p.waitForTimeout(380);
    await p.evaluate(() => { window.__paper = document.querySelector('#paper canvas'); window.__paperWashes = 0; const old = FX.wash; FX.wash = (...args) => { __paperWashes++; return old(...args); }; });
    return {ctx,p};
  }
  async function done(p, screen) {
    await p.waitForFunction(screen => document.body.dataset.screen === screen && !document.body.classList.contains('paper-turning'), screen);
    return p.evaluate(() => ({ paper: __paper === document.querySelector('#paper canvas'), washes: __paperWashes, leftovers: document.querySelectorAll('.paper-scene,.paper-word,.paper-guard,.paper-recall').length, locked: document.querySelector('#app').hasAttribute('aria-busy'), focus: document.activeElement.id || document.activeElement.className }));
  }
  async function seed(p, name = '顾长生', goal = true) {
    await p.locator('#inp-name').fill(name);
    await p.evaluate(({name,goal}) => {
      __moxian.newGame(name, {lg:LINGGEN.find(x=>x.id==='san'),els:['金','木','火'],wx:5,luck:1},{id:'dx'},'qingshi');
      __moxian.S.flags.guide=0;
      if (goal) Life.setGoal(__moxian.S,'wendao',false);
      __moxian.save();
    }, {name,goal});
  }
  async function menu(p) {
    await p.reload(); await p.waitForFunction(()=>document.body.classList.contains('voyage'));
    await p.keyboard.press('Escape'); await p.waitForFunction(()=>document.body.classList.contains('voyage-live')); await p.waitForTimeout(380);
    await p.evaluate(()=>{window.__paper=document.querySelector('#paper canvas');window.__paperWashes=0;});
  }
  try {
    for (const [w,h] of [[320,568],[375,812],[390,844],[440,956],[844,390],[1280,800],[1440,900],[1920,1080]]) {
      for (const theme of ['day','night']) {
        const {ctx,p}=await make(w,h,theme);
        const label=w+'-'+theme;
        const start=Date.now();await p.locator('#btn-new').click();
        await p.waitForTimeout(100);
        const snap=await p.evaluate(()=>({copies:document.querySelectorAll('.paper-scene canvas').length,originals:document.querySelectorAll('#scenery canvas').length,dupes:[...document.querySelectorAll('[id]')].map(e=>e.id).filter((id,i,a)=>a.indexOf(id)!==i),mask:getComputedStyle(document.querySelector('.paper-scene')).maskImage,locked:document.querySelector('#app').getAttribute('aria-busy')}));
        check(label+'-scenery-preserved',snap.copies===snap.originals&&snap.copies>0&&!snap.dupes.length&&snap.locked==='true'&&snap.mask.startsWith('url('),{copies:snap.copies,originals:snap.originals,dupes:snap.dupes,locked:snap.locked,masked:snap.mask.startsWith('url(')});
        const opened=await done(p,'create');
        check(label+'-open-completes',Date.now()-start>=2400&&opened.paper&&!opened.washes&&!opened.leftovers&&!opened.locked,opened);
        await seed(p,w===320?'南宫长生听雨':'南宫听雨');
        const named=await done(p,'main');
        check(label+'-name-enters',named.paper&&!named.washes&&!named.leftovers&&await p.locator('#h-name').textContent()===(w===320?'南宫长生听雨':'南宫听雨'),named);
        await menu(p);
        await p.evaluate(()=>{window.__flight=[];window.__sampleFlight=setInterval(()=>{if(document.body.dataset.screen!=='main')return;const es=['#h-name','#h-realm','#journal-title','#log'].map(s=>document.querySelector(s));__flight.push({rects:es.map(e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height].map(v=>Math.round(v*10)/10);}),ghosts:document.querySelectorAll('.paper-word').length,recall:!!document.querySelector('.paper-recall')});},30);});
        await p.locator('#btn-continue').click();
        if(w===390||w===1440){await p.waitForTimeout(750);await p.screenshot({path:path.join(out,'resume-mid-'+label+'.jpg'),type:'jpeg',quality:82});}
        const resumed=await done(p,'main');
        const state=await p.evaluate(()=>{clearInterval(__sampleFlight);return{flight:__flight,age:__moxian.S.age,name:__moxian.S.name,version:__moxian.S.v,width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,logAtEnd:document.querySelector('#log').scrollHeight-document.querySelector('#log').scrollTop-document.querySelector('#log').clientHeight<2};});
        check(label+'-resume-clean',resumed.paper&&!resumed.leftovers&&!resumed.locked&&state.version===16&&state.age===16&&state.logAtEnd&&state.width<=w&&state.height<=h,{resumed,state});
        const fixed=state.flight.length>5&&state.flight.every(f=>!f.ghosts&&JSON.stringify(f.rects)===JSON.stringify(state.flight[0].rects));
        check(label+'-ink-stays-in-place',fixed&&state.flight.some(f=>f.recall),{samples:state.flight.length,fixed,recall:state.flight.some(f=>f.recall)});
        if(w===390||w===440||w===1440)await p.screenshot({path:path.join(out,'main-'+label+'.jpg'),type:'jpeg',quality:82});
        await ctx.close();
      }
    }
    for (const opt of [{reduce:true},{lite:true},{noAnimate:true}]) {
      const {ctx,p}=await make(390,844,'day',opt);const start=Date.now();await p.locator('#btn-new').click();const s=await done(p,'create');
      check('quiet-'+Object.keys(opt)[0],Date.now()-start<1200&&!s.leftovers&&!s.locked,s);await ctx.close();
    }
    for (const reason of ['escape','resize','hidden','reduce','lite','snapshot-failure']) {
      const {ctx,p}=await make();
      if(reason==='snapshot-failure')await p.evaluate(()=>{const old=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(source,...args){if(source instanceof HTMLCanvasElement&&source.closest('#scenery')&&!this.canvas.isConnected&&this.canvas.style.animationName==='none'){CanvasRenderingContext2D.prototype.drawImage=old;throw Error('test unavailable snapshot');}return old.call(this,source,...args);};});
      await p.locator('#btn-new').click();await p.waitForTimeout(120);
      if(reason==='escape')await p.keyboard.press('Escape');
      if(reason==='resize')await p.setViewportSize({width:390,height:844});
      if(reason==='hidden')await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
      if(reason==='reduce')await p.emulateMedia({reducedMotion:'reduce'});
      if(reason==='lite')await p.evaluate(()=>__moxian.applyLook({motion:'lite'}));
      const s=await done(p,'create');check('interrupt-'+reason,!s.leftovers&&!s.locked&&s.paper,s);await ctx.close();
    }
    const {ctx,p}=await make();await p.locator('#btn-new').click();await done(p,'create');await seed(p,'守卷人',false);
    await p.waitForTimeout(900);check('goal-waits-for-name-arrival',await p.locator('#goal-cer').isHidden());await done(p,'main');await p.locator('#goal-cer').waitFor();
    check('goal-appears-after-arrival',!await p.evaluate(()=>document.body.classList.contains('paper-turning')));
    await p.evaluate(()=>{Life.setGoal(__moxian.S,'wendao',false);__moxian.save();});await menu(p);
    const before=await p.evaluate(()=>{const s=Slots.readActive();return {log:JSON.stringify(s.log),age:s.age,months:s.months};});
    await p.locator('#btn-continue').click();await p.keyboard.down('Digit1');await p.mouse.click(20,20);await done(p,'main');await p.keyboard.down('Digit1');await p.waitForTimeout(200);
    check('held-key-does-not-act-on-arrival',await p.evaluate(b=>JSON.stringify(__moxian.S.log)===b.log&&__moxian.S.age===b.age&&__moxian.S.months===b.months,before));
    await p.keyboard.up('Digit1');await p.locator('[data-act=bag]').click();await p.locator('#sheet').waitFor();check('controls-work-after-arrival',true);await ctx.close();
    check('no-browser-errors',errors.length===0,errors);
  } catch(e) {checks.push({name:'runner',ok:false,error:e.stack});console.error(e.stack);}
  finally {await browser.close();fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({checks,errors},(k,v)=>k==='flight'?{samples:v.length}:v,2));const failed=checks.filter(x=>!x.ok);console.log(JSON.stringify({passed:checks.length-failed.length,failed:failed.length}));if(failed.length)process.exitCode=1;}
})();
