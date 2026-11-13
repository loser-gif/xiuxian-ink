/* Scene-local paper, hands and tools. No generated raster art or new portrait system. */
'use strict';
const SchoolUI = (() => {
  let draft=null, lifeHost=null;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.motion==='lite';
  function node(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;}
  function button(parent,text,fn){const b=node('button','school-choice',text);b.type='button';b.onclick=fn;parent.appendChild(b);return b;}
  function overlay(label){
    const prior=document.activeElement,host=node('section','school-screen');host.setAttribute('role','dialog');host.setAttribute('aria-modal','true');host.setAttribute('aria-label',label);
    document.body.appendChild(host);const app=document.getElementById('app'),old=app&&app.getAttribute('aria-hidden');if(app)app.setAttribute('aria-hidden','true');
    let closed=false;const animations=[];
    const visibility=()=>animations.forEach(a=>{if(a.playState!=='finished'){if(document.hidden)a.pause();else a.play();}});
    function close(){if(closed)return;closed=true;animations.forEach(a=>a.cancel());document.removeEventListener('keydown',key,true);document.removeEventListener('visibilitychange',visibility);host.remove();if(app){if(old===null)app.removeAttribute('aria-hidden');else app.setAttribute('aria-hidden',old);}if(prior&&prior.focus)prior.focus();}
    function key(e){const layers=document.body.querySelectorAll('.school-screen');if(layers[layers.length-1]!==host)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(host.onCancel)host.onCancel();else close();}if(e.key==='Tab'){const items=Array.from(host.querySelectorAll('button,input')).filter(n=>!n.disabled&&!n.hidden);if(!items.length)return;const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}
    document.addEventListener('keydown',key,true);document.addEventListener('visibilitychange',visibility);
    async function move(el,frames,ms){if(!el||closed)return;if(!el.animate||reduced()){Object.keys(frames[frames.length-1]).forEach(k=>{if(k!=='offset')el.style[k]=frames[frames.length-1][k];});return;}const a=el.animate(frames,{duration:ms,fill:'forwards',easing:'ease-in-out'});animations.push(a);if(document.hidden)a.pause();try{await a.finished;}catch(e){} }
    return {host,close,move};
  }
  function art(){return `<svg class="school-art" viewBox="0 0 900 470" role="img" aria-label="窗下书案，纸上名册、毛笔与待授的历本">
  <defs><linearGradient id="school-wood" x2="0" y2="1"><stop stop-color="#594d3d"/><stop offset="1" stop-color="#292723"/></linearGradient><linearGradient id="school-sleeve"><stop stop-color="#292d29"/><stop offset=".55" stop-color="#53584b"/><stop offset="1" stop-color="#20241f"/></linearGradient></defs>
  <path d="M35 230L65 44 350 24 327 223Z" fill="#b8b9a2" opacity=".22"/>
  <g fill="none" stroke="#37362c"><path d="M47 235L70 39 354 20M155 33L140 226M251 27L234 223M64 112L340 96" stroke-width="10"/><path d="M65 128L336 110M153 34L141 224" stroke-width="2"/></g>
  <g fill="#373b30" opacity=".7"><path d="M200 220Q185 126 224 50L215 126 254 77 225 151 261 130 218 176 216 223Z"/><path d="M195 175Q150 119 144 82Q171 100 202 152M226 154Q270 102 290 101Q283 128 232 173"/></g>
  <path d="M26 275L812 214 930 438 0 480Z" fill="url(#school-wood)"/>
  <g stroke="#d6c3a0" opacity=".22" fill="none"><path d="M80 298L775 246M40 326Q470 284 819 280M24 408Q445 366 871 352M20 430L895 378"/><path d="M54 311L791 261M35 391L850 337" stroke-width="3" stroke-dasharray="115 12 46 8"/></g>
  <g class="school-register"><path d="M252 260L528 245 580 430 279 450Z" fill="#c5b695"/><path d="M258 252L533 240 576 421 282 439Z" fill="#efe6d3"/><path d="M271 268L521 256M285 418L561 403" stroke="#a15b48" opacity=".5"/><path d="M290 277L311 410M337 274L358 407M387 270L408 402M437 268L458 400M487 263L509 395" stroke="#a15b48" opacity=".27"/><text x="292" y="301" font-size="18" fill="#504638">入塾名册</text><text class="school-name-ink" x="318" y="359" font-size="36" fill="#26231d"></text></g>
  <g class="school-book"><path d="M594 193L726 209 708 328 574 309Z" fill="#202d2c"/><path d="M594 200L719 214 703 322 579 305Z" fill="#d6c9aa"/><path class="school-cover" d="M590 192L722 207 705 316 575 300Z" fill="#3b4237"/><path d="M600 202L613 204 597 300 585 299Z" fill="#b9aa87"/><path d="M605 217L590 215M603 236L588 234M600 255L585 253M597 274L582 272" stroke="#e9dfc6" stroke-width="2"/><path d="M657 217L689 221 682 279 650 275Z" fill="#e9dfc6"/><text x="664" y="241" font-size="16" fill="#292c24">黄</text><text x="660" y="261" font-size="16" fill="#292c24">历</text></g>
  <g class="school-giving"><path d="M940 113Q847 137 783 194L726 228Q710 234 714 247Q724 257 744 247L778 230Q766 249 739 262Q727 271 735 280Q744 287 764 273L817 238Q860 221 927 204Z" fill="#bcaa87"/><path d="M741 245L768 227M750 264L786 237" stroke="#76664e" stroke-width="2" fill="none"/><path d="M940 90L821 153 851 242 940 215Z" fill="url(#school-sleeve)"/><path d="M824 155L847 234" stroke="#d2c6a9" stroke-width="10"/><path d="M849 161L868 214 910 177M883 142L896 179" stroke="#151c18" stroke-width="3" fill="none"/></g>
  <g class="school-brush-hand"><path d="M450 473L425 387Q412 365 421 341L438 305Q446 292 453 299Q458 307 450 324L445 344 463 324Q473 316 479 325L476 349Q496 345 501 360L500 391 521 470Z" fill="#c9b590"/><path d="M447 347L468 357 477 348M451 366L483 377M446 381L474 390" fill="none" stroke="#8b7556" stroke-width="2"/><path d="M442 431L507 411 536 480H451Z" fill="#b3ad96"/><path d="M447 427L509 410" stroke="#e7dbc1" stroke-width="12"/><path d="M451 333L480 238" stroke="#59442c" stroke-width="8"/><path d="M451 332L440 366Q439 378 435 386Q447 381 451 367L458 334Z" fill="#1c201b"/><path d="M479 240L483 227" stroke="#b0a17f" stroke-width="3"/></g>
  <g class="school-receiving"><path d="M610 489L601 424Q580 394 585 374Q590 360 599 369L614 391Q631 365 651 354Q665 349 671 360L646 384Q677 369 681 382Q683 394 663 407L644 429 654 490Z" fill="#c9b590"/><path d="M607 456L651 444 670 490H610Z" fill="#b3ad96"/><path d="M608 451L652 439" stroke="#e7dbc1" stroke-width="10"/></g>
  <path d="M120 327Q112 292 152 281Q198 282 204 310L196 333Q152 350 120 327" fill="#1d211d"/><ellipse cx="161" cy="306" rx="28" ry="12" fill="#080f0c"/>
  </svg>`;}
  function clear(){draft=null;}
  async function open(){
    if(!draft){const a=new Uint32Array(1);crypto.getRandomValues(a);draft={seed:a[0],name:'',sex:null};}
    const d=draft,o=overlay('六岁 · 学堂报到'),h=o.host;h.classList.add('school-opening');
    const stage=node('div','school-stage');stage.innerHTML=art();h.appendChild(stage);
    const copy=node('div','school-copy'),title=node('h2','', '山村 · 清晨'),text=node('p','school-dialogue'),choices=node('div','school-choices'),foot=node('div','school-controls');
    copy.append(title,text,choices);h.append(copy,foot);let ended=false,acting=false;
    return new Promise(resolve=>{
      function done(ok){if(ended)return;ended=true;o.close();resolve({ok,draft:d});}
      h.onCancel=()=>done(false);button(foot,'返回卷首',()=>done(false));
      function scene(t,line){title.textContent=t;text.textContent=line;choices.innerHTML='';}
      function inkName(){const ink=stage.querySelector('.school-name-ink');ink.textContent=d.name;ink.setAttribute('font-size',Math.min(36,220/Array.from(d.name).length));}
      async function write(){
        acting=true;inkName();const ink=stage.querySelector('.school-name-ink');
        await Promise.all([o.move(stage.querySelector('.school-brush-hand'),[{transform:'translate(-95px,-15px) rotate(-7deg)'},{transform:'translate(-60px,5px) rotate(3deg)',offset:.25},{transform:'translate(-30px,-10px) rotate(-4deg)',offset:.5},{transform:'translate(0px,0px) rotate(0deg)',offset:.75},{transform:'translate(35px,-30px) rotate(6deg)'}],2000),o.move(ink,[{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0 0 0)'}],1900)]);
        acting=false;if(ended)return;
        scene('名册上有了你', '先生低头看了一眼：“'+d.name+'，记下了。家中来的，是儿子还是女儿？”');
        button(choices,'“我是家里的儿子。”',()=>sex('m'));button(choices,'“我是家里的女儿。”',()=>sex('f'));
      }
      function sex(value){d.sex=value;scene('先生应声', '“'+d.name+'，好孩子。”先生朝窗边的座位点点头。“'+(value==='f'?'这位小姑娘':'这位小郎君')+'也坐近些，今天先认日子。”');button(choices,'坐到窗边，听先生讲',lesson);}
      function name(){scene('先生点名', '“门口那孩子，满六岁了吧？到案前来。你叫什么名字？”');
        const input=node('input','school-name');input.maxLength=12;input.value=d.name;input.placeholder='在名册上写下名字';input.setAttribute('aria-label','向先生报上姓名');choices.append(input);
        button(choices,'报上名字，提笔落在名册上',()=>{if(acting)return;const value=input.value.trim().replace(/[<>\u0000-\u001f]/g,'').slice(0,12);if(!value){text.textContent='先生把笔放回你手边：“慢慢想，不着急。想好了再告诉我。”';input.focus();return;}d.name=value;choices.innerHTML='';text.textContent='你说：“我叫'+value+'。”先生扶正名册：“好，亲手写在这里。”';write();});input.focus();}
      function lesson(){scene('认年月日', '先生翻开历本：“大黎开国皇帝创历，是让各地记日有共同的准头。一年十二个月，大小月三十或三十一日。今日是大黎'+Dali.config.startYear+'年一月一日。先学会记日，也就能记住自己走过的路。”');button(choices,'“先生，我记住了。”',give);}
      async function give(){
        scene('把历本接到手里', '“'+d.name+'，这本给你。宜忌只是做事的小提醒，忌日也能做，宜日也未必成。今天报名的事，已经妥当了。”');acting=true;
        await Promise.all([o.move(stage.querySelector('.school-book'),[{transform:'translate(0,0)'},{transform:'translate(-20px,60px)',offset:.55},{transform:'translate(-25px,110px)'}],1800),o.move(stage.querySelector('.school-giving'),[{transform:'translate(0,0)'},{transform:'translate(-20px,60px)',offset:.55},{transform:'translate(-25px,110px)'}],1800),o.move(stage.querySelector('.school-receiving'),[{transform:'translate(0,65px)'},{transform:'translate(0,0)'}],1800)]);
        acting=false;if(ended)return;text.textContent='你双手接住历本，摸到纸角。先生松开手：“收好了。放学还要回家吃饭；往后的事，一天一天学。”';
        button(choices,'翻开今天这一页',()=>{scene('自己的第一本历', '大黎'+Dali.config.startYear+'年一月一日。你在页角认出“正月”两字，先生点头：“对，这就是一年开头。”');o.move(stage.querySelector('.school-cover'),[{transform:'scaleX(1)'},{transform:'scaleX(-.8)'}],750);button(choices,'把历本收好，开始今天的生活',()=>done(true));});
      }
      scene('山村 · 清晨','山外的仙门很远，村里的炊烟很近。你是青石村一户寻常人家的孩子。满六岁这年，家里把书袋交给你，让你沿着晨光去学堂。');
      o.move(stage,[{transform:'translate(0,30px) scale(1.04)',opacity:0},{transform:'translate(0,0) scale(1)',opacity:1}],2200);
      button(choices,'沿村路走到学堂',name).focus();
    });
  }
  function calendar(s){
    const o=overlay('黄历'),h=o.host;h.classList.add('almanac-screen');let offset=0;
    const book=node('div','almanac-book'),left=node('div','almanac-binding'),page=node('div','almanac-page'),nav=node('nav','school-controls');left.textContent='大黎历';book.append(left,page);h.append(book,nav);
    function draw(){page.innerHTML='';const d=Dali.today(s,offset),om=Dali.omen(s,offset);page.append(node('p','almanac-year','大黎'+d.year+'年'),node('h2','',d.month+'月'+d.day+'日'),node('p','', ['春','夏','秋','冬'][d.season]+' · '+(offset===0?'今日':offset>0?'往后'+offset+'日':'此前'+(-offset)+'日')),node('p','almanac-good','宜 '+om.good),node('p','','忌 '+om.bad),node('p','almanac-note','抄书、帮工、修补原有的成事胜算，宜增、忌减'+Math.round(Math.min(Dali.config.shift,Dali.config.maxShift)*100)+'个百分点。不会保证成事，也不拦你做事。报名、读书与家中田活照常。翻页只看日期，不消耗光阴。'));}
    function turn(n){offset+=n;draw();o.move(page,[{transform:'rotateY(-16deg)',opacity:.65},{transform:'rotateY(0)',opacity:1}],420);}
    button(nav,'前一日',()=>turn(-1));button(nav,'回今日',()=>{offset=0;draw();});button(nav,'后一日',()=>turn(1));button(nav,'合上历本',o.close);draw();nav.firstChild.focus();
  }
  function closeLife(){if(lifeHost){lifeHost.close();lifeHost=null;}}
  function life(state,perform){
    closeLife();const o=overlay('青石村的日子');lifeHost=o;const h=o.host;h.classList.add('school-life');let s=state,count=7;
    const title=node('h2'),line=node('p','school-dialogue'),record=node('p','school-record'),scene=node('div','school-life-scene'),choices=node('div','school-choices'),controls=node('div','school-controls');h.append(title,line,record,scene,choices,controls);
    button(controls,'翻看黄历',()=>calendar(s));button(controls,'收起，回到卷上',closeLife);
    function doAction(id){const out=perform(id,count);if(out.state)s=out.state;if(out.err){line.textContent=out.err;return;}draw(out.text);}
    function draw(message){
      const v=School.ensure(s);title.textContent='青石村 · '+Dali.label(s);line.textContent=message||('院门仍朝着旧路。'+(s.age<16?'放学后，家里还有些轻省活计。':'手里有了本事，也要照料灶间与乡邻。'));
      record.textContent=s.age+'岁 · '+School.job(s)+' · 口粮 '+Math.floor(v.food)+' · 铜钱 '+Math.floor(v.copper)+'文 · 精神 '+Math.floor(v.health)+'\n识字 '+Math.floor(v.letters)+' / 农事 '+Math.floor(v.farm)+' / 手艺 '+Math.floor(v.craft)+' · 家中 '+Math.floor(v.family)+' / 师生 '+Math.floor(v.teacher)+' / 乡邻 '+Math.floor(v.neighbor);
      choices.innerHTML='';scene.innerHTML='';
      if(v.pending!==null){scene.append(node('p','','换季了。'+['乡邻来约你修整村塾的桌凳。','村口有人送来消暑的茶，请你一道坐坐。','村中收成入仓，家里等你回去理一理旧物。','窗纸该换了，乡邻问你可有空帮忙。'][v.pending]));button(choices,'应邀去帮乡邻',()=>doAction('neighbor'));button(choices,'先陪家里人坐坐',()=>doAction('home'));return;}
      const span=node('div','school-duration');span.append(node('span','','安排这段日子：'));[1,7,30,90].forEach(n=>{const b=button(span,n+'日',()=>{count=n;draw(line.textContent);});b.setAttribute('aria-pressed',String(count===n));});scene.append(span);
      Object.keys(School.activities).filter(id=>School.available(s,id)).forEach(id=>{const a=School.activities[id],q=School.quote(s,id);button(choices,a.name+(q?' · 今日'+Math.round(q.p*100)+'%':''),()=>doAction(id));});
      button(choices,'去米铺买二十份口粮 · 十文',()=>doAction('buy'));
      if(s.age>=12&&!v.entered){const seek=node('div','school-search');seek.append(node('p','',v.clue===0?'茶摊上偶有山外的传闻。要不要听，由你自己拿主意。':['','传闻：旧山道有刻碑。','线索：半碑的刻痕待核对。','求证：刻痕与旧拓本对上了。','方法：引气笔记已补齐，尚未踏入仙途。'][v.clue]));
        button(seek,v.pausedSearch?'重新打开寻访笔记':'暂且不追，过村中日子',()=>doAction('pause'));
        if(!v.pausedSearch)button(seek,v.clue>=4?'依照笔记，亲自尝试引气':'循上次线索寻访 · 三日',()=>doAction(v.clue>=4?'enter':'seek'));choices.append(seek);}
    }
    draw();controls.firstChild.focus();
  }
  return {open,clear,calendar,life,closeLife};
})();
