/* Programmatic paper theatre: articulated foreground hands and props, no external art. */
'use strict';
const VillageUI = (() => {
  let savedDraft=null;
  const labels={wood:'拿旧木剑',book:'拿启蒙书册',pouch:'拿粗布香囊',school:'去村塾读书认字',farm:'随家人做活',craft:'跟村匠学艺',study:'读书认字',observe:'观察草木天气',count:'清点物资、传话',carry:'在高坡搬轻物',soup:'看火送姜汤',rope:'棚下理绳'};
  const stages=['birth','grab','six','nine','rain','clue','leave'];
  const options=[['m','f'],['wood','book','pouch'],['school','farm','craft'],['study','farm','craft','observe'],['count','carry','soup','rope']];
  function art() {
    return `<svg class="village-art" viewBox="0 0 900 540" role="img" aria-label="村中生活，手与旧物的近景">
    <defs><filter id="vp-paper"><feTurbulence baseFrequency=".045" numOctaves="3" seed="7"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".13"/></feComponentTransfer><feBlend in="SourceGraphic" mode="multiply"/></filter><linearGradient id="vp-wash" x2="0" y2="1"><stop stop-color="#b0b6a4"/><stop offset="1" stop-color="#e8dcc0"/></linearGradient><radialGradient id="vp-lid"><stop offset=".63" stop-color="#171713" stop-opacity="0"/><stop offset=".96" stop-color="#171713"/></radialGradient></defs>
    <g class="v-camera" filter="url(#vp-paper)"><rect width="900" height="540" fill="#e6dbc2"/>
    <g class="v-outside"><path d="M0 240Q90 80 220 205Q380 40 560 220Q740 85 900 240V540H0" fill="url(#vp-wash)"/><path d="M0 365Q280 290 900 370V540H0" fill="#9b9d83"/><path d="M600 335Q520 415 890 500L900 540H700Q410 420 520 345" fill="#c8d4cd"/><path d="M86 420Q120 230 100 10M105 185Q180 115 260 105M102 200L30 125" fill="none" stroke="#555b46" stroke-width="25"/><path d="M0 45Q120-30 315 70L260 130Q90 85 0 150" fill="#717c57" opacity=".7"/></g>
    <g class="v-room"><path d="M0 0H900V60H0M40 0V540M860 0V540" fill="#6b5840"/><path d="M600 90H805V290H600Z" fill="#bac7b7" stroke="#756047" stroke-width="14"/><path d="M670 90V290M740 90V290M600 190H805" stroke="#756047" stroke-width="8"/></g>
    <g class="v-parent"><path d="M-60-40Q160-95 320 10L350 220Q230 335 40 315L-60 180" fill="#636c65"/><path d="M150-50L305 10L207 186L85 76Z" fill="#d0c9b4"/><path d="M114-30L252 68L195 143L61 16" fill="none" stroke="#e5ddc5" stroke-width="19"/><path d="M305-60Q345 70 273 149Q309 40 220-30" fill="#33382e"/><path d="M730-70Q830-20 950 10L950 260L771 219L698 63" fill="#847860"/><path d="M744-10L794 97L894 7" fill="none" stroke="#c5bca3" stroke-width="20"/></g>
    <path class="v-table" d="M100 332L800 310L910 510L0 530Z" fill="#a98c64" stroke="#6d5e44" stroke-width="5"/>
    <g class="v-tray"><ellipse cx="450" cy="376" rx="255" ry="106" fill="#bba475" stroke="#756446" stroke-width="12"/><ellipse cx="450" cy="376" rx="240" ry="92" fill="none" stroke="#e0cda3" stroke-width="4" stroke-dasharray="4 8"/>
    <g class="v-book"><path d="M345 322L440 310L475 413L370 430Z" fill="#747e75" stroke="#514e3b" stroke-width="4"/><path d="M352 327L435 318L463 404L377 420Z" fill="#e5d6b3"/><path class="v-page" d="M354 327L435 318L463 404L377 420Z" fill="#f0e3c4" stroke="#87785d"/><path d="M379 345L420 339M384 358L425 352M388 371L429 365" stroke="#585340" stroke-width="3"/></g>
    <g class="v-wood"><path d="M215 340L233 326L320 395L307 410Z" fill="#a77447" stroke="#664a32" stroke-width="4"/><path d="M274 402L304 370M292 405L318 429" stroke="#765137" stroke-width="13"/></g>
    <g class="v-pouch"><path d="M538 345Q510 397 544 419Q588 436 610 399L590 342Z" fill="#9d7966" stroke="#625842" stroke-width="4"/><path d="M541 347Q568 360 591 345M563 350Q530 318 542 319Q560 317 568 350Q598 320 602 336Q600 350 568 350" fill="none" stroke="#d1bd8f" stroke-width="5"/></g></g>
    <g class="v-work"><path class="v-bag" d="M320 410Q420 355 540 412L565 510Q430 550 305 505Z" fill="#88866c" stroke="#595a48" stroke-width="5"/><g class="v-money"><path d="M395 355Q365 425 425 439Q490 440 465 355Z" fill="#9d8463"/><path d="M395 359L464 359" stroke="#d1bf92" stroke-width="5"/></g><path class="v-basket" d="M350 350L370 438L500 438L520 350Z M370 350Q435 240 500 350" fill="#ae9068" stroke="#655941" stroke-width="8"/><path class="v-ruler" d="M370 365L570 335L576 353L376 383Z" fill="#d7b67d" stroke="#685a40" stroke-width="3"/><path class="v-rope" d="M350 390Q430 300 470 380Q420 460 390 370Q450 320 570 400" fill="none" stroke="#bca578" stroke-width="12"/><g class="v-soup"><path d="M385 350Q400 415 485 395L510 350Z" fill="#716b56"/><path d="M410 328Q397 308 420 286M450 327Q432 299 455 275" fill="none" stroke="#e8dfcd" stroke-width="5"/></g><path class="v-letter" d="M380 330L530 335L520 415L375 407Z" fill="#e9dbb8" stroke="#74694f" stroke-width="3"/><path class="v-leaf" d="M450 410Q360 300 445 295Q500 330 450 410M450 410Q550 300 580 350Q555 410 450 410" fill="#79835f"/></g>
    <g class="v-shelter"><path d="M70 260L140 150H740L830 260Z" fill="#706a54"/><path d="M140 255V500M760 255V500" stroke="#675640" stroke-width="15"/><path d="M80 490H820" stroke="#76694e" stroke-width="12"/></g>
    <g class="v-adults" fill="#5c6659" stroke="#5c6659" stroke-width="8"><path d="M605 285l-10 35 25 15 10-30M650 290l-10 30 20 10 10-35M700 300l-15 25 25 10 10-30"/><path d="M590 325l-15 24m35-14 10 20m25-25-10 25m25-20 15 20m20-20-10 25"/><path d="M570 346h170" stroke="#827b60"/></g>
    <g class="v-chest"><path d="M590 420H740V495H590Z" fill="#8b7050" stroke="#5d513e" stroke-width="5"/><path class="v-chest-lid" d="M585 420H745V405H585Z" fill="#a08a62" stroke="#5d513e" stroke-width="5"/></g>
    <g class="v-schoolbag"><path d="M220 330h75v100h-75Z M230 330q25-85 55 0" fill="#9b9379" stroke="#625e4b" stroke-width="6"/></g>
    <g class="v-child-shirt" data-contact="450,320"><path d="M380 300l45-15 25 35 25-35 45 15 35 220H345Z" fill="#b5af96" stroke="#79755f" stroke-width="4"/><path d="M425 285l25 35 25-35M450 320l-20 45" fill="none" stroke="#e0d5b6" stroke-width="9"/></g>
    <path class="v-stalks" d="M305 425l30-40m-24 30 0-20m10 7 18-3m-5-12 10-3" fill="none" stroke="#8c8760" stroke-width="6"/>
    <path class="v-plank" d="M420 390h170v20H420Z" fill="#ae8d5f" stroke="#6a5d43" stroke-width="3"/>
    <path class="v-sandstone" d="M440 377l20-4 10 16-24 3Z" fill="#8a8b78" stroke="#65634f" stroke-width="3"/>
    <g class="v-housework"><path class="v-clothes" d="M110 210h95l20 35-25 15-5-15v65h-70v-65l-5 15-25-15Z" fill="#b3aa8b" stroke="#6d6b56" stroke-width="3"/><path d="M80 210h175" stroke="#766d54" stroke-width="3"/><g class="v-chicken"><path d="M170 465q-35-35-58-5q12 30 45 20l17-12 12-5-12-4Z" fill="#928468"/><path d="M130 480v15m15-15v15" stroke="#766448" stroke-width="3"/></g><path class="v-grain" d="M160 420l3 3m-14 8 3 3m12 5 3 3m-15 7 3 3" stroke="#ac925d" stroke-width="4"/></g>
    <path class="v-needle" d="M375 365l12-18m-12 18q-30 20-8 30" stroke="#82714c" stroke-width="3" fill="none"/>
    <path class="v-book-seam" d="M365 330l25 90m-20-78 9-2m-5 18 9-2" stroke="#8f774c" stroke-width="4" fill="none"/>
    <path class="v-handle-crack" d="M298 395l9 8-2 8 8 8" stroke="#3f4439" stroke-width="4" fill="none"/>
    <path class="v-stove" d="M680 390h75v60h-75Z M695 415h40v25h-40Z" fill="#82755a" stroke="#514e3d" stroke-width="5"/><g class="v-lamp"><path d="M690 390h55l-12 20h-30Z M716 408v30h-25 50" fill="#6e6049" stroke="#6e6049" stroke-width="6"/><path class="v-flame" d="M716 390q-20-18 3-46q16 32-3 46" fill="#c19b52"/></g>
    <path class="v-windboard" d="M665 350v75h-35v-65Z" fill="#8e7c5a"/>
    <path class="v-booktag" d="M399 340h12v58h-12Z" fill="#a98c54" stroke="#62573c"/>
    <path class="v-swordcore" d="M295 380l10-5 20 45-10 5Z" fill="#5b5d52" stroke="#393f36"/>
    <circle class="v-bead" cx="565" cy="390" r="9" fill="#c9c5a4" stroke="#7d816c"/>
    <path class="v-bag-tie" d="M380 420q60-30 120 0M440 420q-60-55-45-15q15 20 45 15q60-55 45-15q-15 20-45 15" fill="none" stroke="#c5b184" stroke-width="7"/>
    <g class="v-knot"><path d="M420 380q40-40 40 0q-40 40-40 0Z" fill="none" stroke="#bca578" stroke-width="10"/></g><path class="v-rope-end" d="M440 380q70 25 110-10" stroke="#bca578" stroke-width="10" fill="none"/>
    <g class="v-parent-contact" data-contact="510,350"><g class="v-father" data-contact="510,350"><path d="M900 250Q760 240 650 305L520 330Q488 340 500 357Q520 370 550 353L664 345Q780 315 900 334" fill="#b59a78" stroke="#705c45" stroke-width="3"/><path d="M900 230L780 246L800 346L900 365" fill="#777a68"/></g>
    <g class="v-infant-grip" data-contact="510,350"><path d="M485 420l5-58q2-16 16-12l20 12-8 58Z" fill="#c9ac88" stroke="#7c674e" stroke-width="3"/><path class="v-infant-fingers" data-contact="510,350" d="M495 362q-4-22 15-12q18-5 13 10M497 372q-2-16 18-10" fill="none" stroke="#c9ac88" stroke-width="10"/></g>
    </g><g class="v-hand"><path d="M310 575L350 455Q348 430 369 411L401 379Q413 371 418 383L398 414L429 388Q445 377 447 392L423 420L453 400Q468 392 469 407L437 438Q412 469 397 483L390 575" fill="#c9ac88" stroke="#7c674e" stroke-width="3"/><path class="v-fingers" d="M398 417Q448 379 452 399L422 431M408 429Q451 400 455 420L428 445" fill="none" stroke="#c9ac88" stroke-width="12"/><path d="M300 550L338 466L408 496L398 570" fill="#dcd1b5" stroke="#8e8265" stroke-width="5"/></g>
    <g class="v-hand v-right"><path d="M620 575L590 467Q585 445 564 424L532 391Q517 383 512 397L535 425L505 405Q491 397 488 411L520 449Q539 469 545 491L547 575" fill="#c9ac88" stroke="#7c674e" stroke-width="3"/><path d="M540 510L605 480L635 575H545" fill="#dcd1b5" stroke="#8e8265" stroke-width="5"/></g>
    <circle class="v-warm" cx="560" cy="387" r="10" fill="#d8ba6d" opacity=".5"/>
    <g class="v-rain" stroke="#ced5cb" stroke-width="2" opacity=".65"><path d="M20 0L0 90M100 25L60 160M210 0L170 180M340 0L300 170M470 0L430 160M600 0L550 180M730 0L680 200M870 0L820 180"/></g></g>
    <g class="v-eyes"><rect class="v-lid-top" width="900" height="275" fill="#171713"/><rect class="v-lid-bottom" y="265" width="900" height="275" fill="#171713"/><rect width="900" height="540" fill="url(#vp-lid)"/></g></svg>`;
  }
  function open() {
    const d=savedDraft||(savedDraft=Village.draft());
    return new Promise(resolve=>{
      let index=0, selected=null, performed=false, anims=[], paused=false, audio=null, source=null, settled=false;
      let generation=0, pending=0, ready=null, busy=false, next=null, leaving=false, leavePart='route', routeAt=0, talentAt=0;
      const host=document.createElement('section');host.className='village-screen';host.setAttribute('role','dialog');host.setAttribute('aria-modal','true');host.setAttribute('aria-label','村童成长');
      host.innerHTML='<div class="village-frame">'+art()+'</div><div class="village-copy"><h2></h2><p class="v-narrative"></p><div class="v-choices"></div><p class="v-effect" aria-live="polite"></p><div class="v-navigation"></div></div><nav class="v-controls"></nav>';
      document.body.appendChild(host);
      if (typeof MoAudio !== 'undefined') MoAudio.setOpeningQuiet(true);
      const el=q=>host.querySelector(q), all=q=>host.querySelectorAll(q);
      const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.motion==='lite';
      function gate(on) {
        busy=on;host.dataset.phase=on?(performed?'action':'intro'):(performed?'read':'choice');
        el('.v-choices').querySelectorAll('button').forEach(b=>b.disabled=on);
        if(next)next.disabled=on;
      }
      function stop(){generation++;ready=null;anims.forEach(a=>a.cancel());anims=[];pending=0;}
      function move(q,frames,duration=2000,delay=0){(q===':host'?[host]:all(q)).forEach(e=>{
        if(!e.animate){Object.assign(e.style,frames[frames.length-1]);return;}
        const token=generation;
        const a=e.animate(frames,{duration,delay,fill:'forwards',easing:'ease-in-out'});anims.push(a);pending++;
        a.onfinish=()=>{if(token!==generation||a._vDone)return;a._vDone=true;pending--;if(!pending&&ready){const done=ready;ready=null;done();}};
        if(paused||document.hidden)a.pause();
      });}
      function seal(done){ready=done;if(!pending){ready=null;done();}else if(reduced())anims.forEach(a=>a.finish());}
      function run(draw,done){stop();gate(true);draw();seal(()=>{gate(false);if(done)done();});}
      function soundOff(){if(source){source.stop();source=null;}if(audio){audio.close();audio=null;}}
      function cleanup(ok){if(settled)return;settled=true;stop();soundOff();if(typeof MoAudio !== 'undefined')MoAudio.setOpeningQuiet(false);document.removeEventListener('visibilitychange',visibility);document.removeEventListener('keydown',key);if(observer)observer.disconnect();if(media.removeEventListener)media.removeEventListener('change',motionChange);else if(media.removeListener)media.removeListener(motionChange);host.remove();resolve({ok,draft:d});}
      function visibility(){anims.forEach(a=>{if(!a._vDone){if(document.hidden||paused)a.pause();else a.play();}});if(audio){if(document.hidden||paused)audio.suspend();else audio.resume();}}
      document.addEventListener('visibilitychange',visibility);
      const media=matchMedia('(prefers-reduced-motion: reduce)');
      const motionChange=()=>{if(reduced())anims.forEach(a=>a.finish());};
      if(media.addEventListener)media.addEventListener('change',motionChange);
      else if(media.addListener)media.addListener(motionChange);
      const observer=typeof MutationObserver!=='undefined'?new MutationObserver(motionChange):null;
      if(observer)observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});
      function key(e){
        if(e.key==='Escape'){e.preventDefault();cleanup(false);return;}
        if(e.key==='Tab'){
          const list=Array.from(all('button')).filter(b=>!b.disabled),first=list[0],last=list[list.length-1];
          if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
          else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
        }
      }
      document.addEventListener('keydown',key);
      function button(parent,text,fn){const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=function(e){if(!settled&&(!leaving||parent===controls))fn.call(this,e);};parent.appendChild(b);return b;}
      const controls=el('.v-controls');
      button(controls,'暂停',function(){paused=!paused;this.textContent=paused?'继续演出':'暂停';visibility();});
      button(controls,'略过动作',()=>anims.forEach(a=>a.finish()));
      button(controls,'重播动作',()=>{if(!leaving&&(index!==6||leavePart==='route'))scene(performed);});
      button(controls,'雨声 / 静音',()=>{
        if(audio){soundOff();return;}const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
        audio=new AC();const b=audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate),a=b.getChannelData(0);let z=17;
        for(let i=0;i<a.length;i++){z=(z*16807)%2147483647;a[i]=(z/2147483647-.5)*.12;}
        source=audio.createBufferSource();source.buffer=b;source.loop=true;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=650;source.connect(filter);filter.connect(audio.destination);source.start();visibility();
      });
      button(controls,'返回卷首',()=>cleanup(false));
      // Each held entity and its hand share an SVG parent and a declared contact coordinate.
      // Translating that parent preserves contact throughout the path (including skips).
      function hold(selector,x,y,name) {
        const prop=el(selector),g=document.createElementNS('http://www.w3.org/2000/svg','g');
        g.setAttribute('class','v-contact '+name);g.setAttribute('data-contact',x+','+y);
        el('.v-camera').appendChild(g);g.appendChild(prop);
        const hand=document.createElementNS('http://www.w3.org/2000/svg','path');
        hand.setAttribute('class','v-contact-hand');hand.setAttribute('data-contact',x+','+y);
        hand.setAttribute('d','M'+(x-14)+' '+(y+70)+' L'+(x-18)+' '+(y+12)+' Q'+(x-18)+' '+(y-8)+' '+x+' '+y+' L'+(x+12)+' '+(y+8)+' L'+(x+19)+' '+(y+65)+'Z');
        hand.setAttribute('fill','#c9ac88');hand.setAttribute('stroke','#7c674e');g.appendChild(hand);return '.'+name;
      }
      function scene(action){
        run(()=>{
          el('.village-frame').innerHTML=art();
          const st=stages[index],k=selected;host.dataset.scene=st;host.dataset.action=k||'';host.dataset.keep=d.grab||'';
          delete host.dataset.clue;host.classList.remove('v-stow');
          host.classList.toggle('v-acted',!!action);
          const rare=d.originSeed===0&&(index===0||(d.grab==='pouch'&&((index===1&&action)||(index===3&&k==='observe')||(index===4&&d.nine==='observe'&&k==='soup')||(index>=5&&Village.qualify(d).routes.includes('bead')))));
          host.classList.toggle('v-rare',rare);
          move('.v-rain',[{transform:'translate(0,-30px)',opacity:.3},{transform:'translate(-12px,40px)',opacity:.7},{transform:'translate(-24px,95px)',opacity:.2}],3200);
          move('.v-flame',[{transform:'scale(1)',opacity:.7},{transform:'scale(.85,1.2)',opacity:1},{transform:'scale(1.05,.9)',opacity:.8}],3200);
          if(!action){
            move('.v-camera',[{opacity:.2},{opacity:1}],1200);
            if(st==='birth'){
              move(':host',[{background:'#171713'},{background:'#e8dfca'}],1800);
              move('.v-lid-top',[{transform:'translateY(0)'},{transform:'translateY(-210px)',offset:.3},{transform:'translateY(0)',offset:.5},{transform:'translateY(-280px)'}],4400);
              move('.v-lid-bottom',[{transform:'translateY(0)'},{transform:'translateY(210px)',offset:.3},{transform:'translateY(0)',offset:.5},{transform:'translateY(280px)'}],4400);
              move('.v-father',[{transform:'translateX(160px)'},{transform:'translateX(0)'}],2400);
            }
            if(st==='grab')move('.v-tray',[{transform:'translateY(-130px)'},{transform:'translateY(0)'}],2200);
            if(st==='six')move('.v-father',[{transform:'translate(-90px,-60px)'},{transform:'translate(-60px,-30px)'},{transform:'translate(-90px,-60px)'}],2600);
            if(st==='clue'){
              const q=Village.qualify(d);host.dataset.clue=q.routes.includes('booktag')?'booktag':q.routes.includes('swordcore')?'swordcore':q.routes.includes('bead')?'bead':'';
              if(q.routes.includes('booktag')){
                hold('.v-book',385,410,'v-repair-book');
                move('.v-page',[{transform:'scaleX(1)'},{transform:'scaleX(.3)'},{transform:'scaleX(1)'}],2600);
                move(hold('.v-needle',375,365,'v-stitching'),[{transform:'translate(0,0)'},{transform:'translate(8px,25px)'},{transform:'translate(-4px,8px)'},{transform:'translate(12px,40px)'}],2600);
              }
              if(q.routes.includes('swordcore'))move(hold('.v-sandstone',450,380,'v-repair-handle'),[{transform:'translate(-150px,20px)'},{transform:'translate(-130px,35px)'},{transform:'translate(-150px,20px)'}],2600);
              if(q.routes.includes('bead'))move('.v-warm',[{opacity:.2},{opacity:.7},{opacity:.2}],3000);
            }
            return;
          }
          if(st==='birth'){
            // Dedicated infant grip at the father's fingertip; no generic hand transforms.
            el('.v-lid-top').style.display='none';el('.v-lid-bottom').style.display='none';
            move('.v-infant-grip',[{transform:'translate(0,60px)'},{transform:'translate(0,0)'}],1800);
            move('.v-infant-fingers',[{transform:'rotate(-18deg)'},{transform:'rotate(0deg)'}],900,1800);
            return;
          }
          if(st==='leave'){
            const key={money:'.v-money',letter:'.v-letter',tools:'.v-ruler',booktag:'.v-booktag',swordcore:'.v-swordcore',bead:'.v-bead'}[k];
            const pt={money:[425,370],letter:[400,360],tools:[400,360],booktag:[405,360],swordcore:[300,395],bead:[565,390]}[k];
            const held=hold(key,pt[0],pt[1],'v-packed');
            // Extraction from the old object's contact point, then into bag mouth at (440,445).
            move(held,[{transform:'translate(0,0)'},{transform:'translate(0,-90px)',offset:.4},{transform:'translate('+(440-pt[0])+'px,'+(445-pt[1])+'px)',opacity:1,offset:.9},{transform:'translate('+(440-pt[0])+'px,'+(445-pt[1])+'px)',opacity:0}],3200);
            move('.v-bag-tie',[{transform:'scaleX(1)'},{transform:'scaleX(.55)'}],1000,3200);return;
          }
          if(k==='book'||k==='school'||k==='study'){
            hold('.v-book',385,410,'v-reading');move('.v-page',[{transform:'scaleX(1)'},{transform:'scaleX(-.7)'}],2200);
            if(st==='nine'&&d.six!=='school')move('.v-father',[{transform:'translate(160px,0)'},{transform:'translate(-80px,0)'},{transform:'translate(-40px,0)'}],2600);
            if(k==='school'){
              move(hold('.v-schoolbag',245,340,'v-shouldering'),[{transform:'translateY(50px)'},{transform:'translate(-80px,-70px)'}],2200);
              move('.v-grain',[{transform:'translateY(-30px)',opacity:1},{transform:'translateY(30px)',opacity:0}],1000,2200);
              move('.v-chicken',[{transform:'rotate(0deg)'},{transform:'rotate(10deg)'},{transform:'rotate(0deg)'}],1000,2200);
              move(hold('.v-clothes',150,220,'v-gather-cloth'),[{transform:'translateY(0)'},{transform:'translate(70px,130px)'}],1500,3200);
            }
          }
          if(k==='wood')move(hold('.v-wood',306,412,'v-tapping'),[{transform:'translate(0,0)'},{transform:'translate(0,-65px)',offset:.22},{transform:'translate(0,0)',offset:.4},{transform:'translate(0,-65px)',offset:.65},{transform:'translate(0,0)'}],2600);
          if(k==='pouch')move(hold('.v-pouch',550,378,'v-embrace'),[{transform:'translate(0,0)'},{transform:'translate(-70px,80px)'}],2200);
          if(st==='nine'&&d.six==='school'&&k!=='study'){
            host.classList.add('v-stow');move(hold('.v-book',385,410,'v-stowed-book'),[{transform:'translate(0,0)'},{transform:'translate(240px,-60px)',offset:.5},{transform:'translate(240px,20px)',opacity:0}],2400);
            move('.v-chest-lid',[{transform:'rotate(-45deg)'},{transform:'rotate(0deg)'}],1000,2400);
          }else host.classList.remove('v-stow');
          if(st==='rain'){
            const p=Village.qualify(Object.assign({},d,{rain:null})).p,axis={count:'L',carry:'B',soup:'P',rope:'C'}[k];
            if(p[axis]<2)move('.v-father',[{transform:'translate(120px,-40px)'},{transform:'translate(-80px,0)'},{transform:'translate(0,-20px)'}],1800);
          }
          if(k==='farm'||k==='carry')move(hold('.v-basket',375,350,'v-carrying'),[{transform:'translate(0,0)'},{transform:'translate(-100px,-55px)',offset:.3},{transform:'translate(100px,-55px)',offset:.7},{transform:'translate(0,0)'}],3400,k==='farm'?1500:0);
          if(k==='craft'){
            move(hold('.v-ruler',400,360,'v-measuring'),[{transform:'translateX(-30px)'},{transform:'translateX(30px)'},{transform:'translateX(-30px)'}],2200);
            move(hold('.v-sandstone',450,380,'v-sanding'),[{transform:'translateX(0)'},{transform:'translateX(80px)'},{transform:'translateX(0)'},{transform:'translateX(80px)'}],2000,2200);
          }
          if(k==='farm')move(hold('.v-stalks',320,405,'v-picking'),[{transform:'translate(0,0)'},{transform:'translate(110px,-60px)',offset:.6},{transform:'translate(110px,-20px)',opacity:0}],1500);
          if(k==='soup'){
            move('.v-windboard',[{transform:'rotate(-25deg)'},{transform:'rotate(0deg)'}],900);
            move(hold('.v-soup',400,365,'v-serving'),[{transform:'translate(0,0)'},{transform:'translate(110px,-50px)'},{transform:'translate(170px,-15px)'}],2400,900);
          }
          if(k==='count')move(hold('.v-letter',400,360,'v-counting'),[{transform:'translateY(0)'},{transform:'translateY(-60px)'}],2000);
          if(k==='rope'){
            hold('.v-rope',390,370,'v-knotting');move('.v-rope-end',[{transform:'translate(-55px,0)'},{transform:'translate(0,0)'}],2000);
            move('.v-knot',[{opacity:0},{opacity:1}],900,1800);
          }
          if(k==='observe')move('.v-leaf',[{transform:'rotate(-10deg)'},{transform:'rotate(8deg)'}]);
        });
      }
      function narrative(){
        if(index===0)return '母亲：总算平安落地了。外头风停了，快抱近些让我看看。父亲：手脚舒展，哭声也亮，是个精神的'+((selected||d.sex)==='f'?'女儿':'儿子')+'。这里是寻常村民的家。';
        if(index===1)return '父亲：满周岁了。小家伙，看看这匾里三样东西，自己伸手拿一件。母亲将竹匾放稳，两只小手从袖口探出来。';
        if(index===2)return '父亲理平你的衣领：开春满六岁了。村里有先生教认字，田头有轻省活计，村西也能学手艺。你想先去哪一头？仍要帮家里做些力所能及的事。';
        if(index===3)return d.six==='school'?'母亲：这三年你认了不少字。往后照常入塾，还是换个重心做活、学艺、留心草木？停学便把书收好，识字的底子还在。':'父亲：满九岁了。往后跟着认字读书、务农、学艺，还是留心草木天气？转读书时，长辈会在灯下带你拿笔认字。';
        if(index===4)return '盛夏雨里，成年乡邻在远处加固河堰。你留在安全的高岸棚下。管事乡邻：水边有大人盯着，这儿四桩岸上的活计，挑顺手的搭把手！';
        if(index===5){const q=Village.qualify(d);return '十四岁，附近传来测灵的消息。家里先匀出盘缠，也打听到镇上普通差事。'+(q.routes.includes('letter')?'先生愿写封信，先放在案上。':'')+(q.routes.includes('tools')?'村匠说外头有学徒活，工具留待出门再定。':'')+(q.routes.includes('booktag')?'修书时，你看见书脊夹层里一件硬物，尚未拆开。':'')+(q.routes.includes('swordcore')?'修木柄时，裂纹深处露出旧铁芯，尚未取出。':'')+(q.routes.includes('bead')?'灯下，小珠又随呼吸应和。':'')+'此时只记下线索，离村还在以后。';}
        return '十六岁临行，老树下，乡邻还记得那年你'+labels[d.rain]+'。父亲：附近来了测灵的人，你去试试，先把眼前差事做好。母亲：路上顾好冷暖，安顿下来记得捎信。周岁旧物仍在行囊边。';
      }
      function exitScene(){
        if(leaving||settled)return;
        leaving=true;
        run(()=>{
          move('.village-frame',[{opacity:1},{opacity:0}],650);
          move('.village-copy',[{opacity:1},{opacity:0}],650);
          host.style.background='#171713';
        },()=>cleanup(true));
      }
      function renderLeave(choices,nav){
        const q=Village.qualify(d);
        if(leavePart==='route'){
          routeAt=Math.min(routeAt,q.routes.length-1);const k=q.routes[routeAt];
          const cost=k==='money'?'六灵石，先送米筹路费。':'二灵石，'+(k==='letter'?'带信赴约，只约普通差事。':k==='tools'?'带基础工具，接修补活。':'封存旧物，先做普通差事再解封；不带书信或工具。');
          el('.v-effect').textContent=cost+'原有二十灵石照旧。';
          const browse=delta=>{routeAt=(routeAt+delta+q.routes.length)%q.routes.length;selected=null;performed=false;delete d.confirmed;render();};
          button(choices,'再听前一件安排',()=>browse(-1));
          button(choices,Village.routes[k],()=>{selected=k;performed=false;next.textContent='确认并演出';el('.v-effect').textContent='已选。'+cost+'原有二十灵石照旧。';});
          button(choices,'再听后一件安排',()=>browse(1));
          const count=document.createElement('p');count.textContent='可听的安排：'+(routeAt+1)+' / '+q.routes.length;choices.appendChild(count);
          next=button(nav,'确认并演出',()=>{
            if(busy)return;
            if(performed){leavePart='talent';render();return;}
            if(!selected)return;d.route=selected;performed=true;scene(true);next.textContent='收拾妥当，回想这些年';
          });
        }else if(leavePart==='talent'){
          const t=q.talents[talentAt%q.talents.length];
          el('.v-effect').textContent=Village.effects[t-1]+'只认这一项，其余经历仍记在心里。';
          const browse=delta=>{talentAt=(talentAt+delta+q.talents.length)%q.talents.length;render();};
          button(choices,'想起前一段经历',()=>browse(-1));
          button(choices,Village.talents[t-1],()=>{selected=t;next.textContent='确认这项长处';});
          button(choices,'想起后一段经历',()=>browse(1));
          const count=document.createElement('p');count.textContent='可认的长处：'+(talentAt+1)+' / '+q.talents.length;choices.appendChild(count);
          button(nav,'重新想想去向',()=>{leavePart='route';render();});
          next=button(nav,'确认这项长处',()=>{if(busy||!selected)return;d.talent=selected;leavePart='ready';render();});
        }else{
          el('.v-effect').textContent=Village.routes[d.route]+'。'+Village.talents[d.talent-1]+'：'+Village.effects[d.talent-1];
          button(nav,'再想想长处',()=>{leavePart='talent';render();});
          next=button(nav,'辞别家人，记下村中旧名',()=>{if(busy)return;d.confirmed=true;exitScene();});
        }
      }
      function render(){
        stop();selected=null;performed=false;next=null;host.classList.remove('v-stow');
        el('h2').textContent=['初生 · 怀抱','周岁 · 伸手','六岁 · 日常','九岁 · 转向','十二岁 · 高岸雨棚','十四岁 · 消息','十六岁 · 临行'][index];
        el('.v-narrative').textContent=narrative();el('.v-effect').textContent='';
        const choices=el('.v-choices'),nav=el('.v-navigation');choices.innerHTML='';nav.innerHTML='';
        if(index<5)options[index].forEach(k=>{const b=button(choices,index===0?(k==='m'?'男':'女'):labels[k],()=>{
          if(busy)return;selected=k;performed=false;delete d.confirmed;
          choices.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));
          next.textContent='确认并演出';el('.v-narrative').textContent=narrative();el('.v-effect').textContent='已选，确认后亲手做这件事。';
        });});
        button(nav,'回看上一幕',()=>{if(index>0&&!leaving){index--;leavePart='route';render();}}).disabled=index===0;
        if(index===6){renderLeave(choices,nav);if(leavePart==='route')scene(false);else gate(false);return;}
        next=button(nav,index===5?'记下消息，待到临行':'确认并演出',()=>{
          if(busy)return;
          if(index===5){index++;leavePart='route';render();return;}
          if(!performed){
            if(!selected)return;if(index===0)d.sex=selected;else Village.choose(d,stages[index],selected);
            performed=true;scene(true);next.textContent='读完了，继续';
            if(index===2)el('.v-effect').textContent={school:'先生：先把笔拿稳，字要一笔一划认清楚。傍晚归家，仍帮着喂鸡收衣。',farm:'母亲：先捡轻省的柴草，累了就在田埂石上歇会儿。',craft:'老村匠：先学看尺、理工具，手稳了再碰刨子。'}[selected];
            if(index===3)el('.v-effect').textContent=selected==='study'?(d.six==='school'?'照常入塾，早晚兼顾家务。':'长辈在灯下指点笔画，你从头认字。'):d.six==='school'?'你把书收好，辞别学堂。此后生活重心变了，认得的字不会忘。':'你拿起手边家什，开始往新的方向用心。';
            if(index===4){const p=Village.qualify(Object.assign({},d,{rain:null})).p,key={count:'L',carry:'B',soup:'P',rope:'C'}[selected];el('.v-effect').textContent=p[key]>=2?'沿用以前学过的本事，稳稳做完这桩活。':'乡邻先示范，你照着做，两人互相搭把手。';}
            return;
          }
          index++;render();
        });scene(false);
      }
      render();const first=all('button')[0];if(first)first.focus();
    });
  }
  function clear(){savedDraft=null;}
  return {open,clear};
})();
