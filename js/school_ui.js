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
  function art(){return `<svg class="school-art" width="960" height="500" viewBox="0 0 960 500" role="img" aria-label="窗下书案。名册摊在中间，毛笔停在砚边，黄历合着放在案右。">
  <defs><linearGradient id="school-wood" x2="0" y2="1"><stop stop-color="#5c5142"/><stop offset="1" stop-color="#2a2824"/></linearGradient><linearGradient id="school-sleeve" x2="1"><stop stop-color="#1c211d"/><stop offset=".5" stop-color="#4c5344"/><stop offset="1" stop-color="#171b17"/></linearGradient></defs>
  <path d="M48 214L86 36 360 16 334 206Z" fill="#c4c5ad" opacity=".28"/>
  <g fill="none" stroke="#37362c"><path d="M60 218L96 32 364 12M186 26L170 210M274 20L258 206M78 104L348 84" stroke-width="11"/><path d="M80 122L344 102M184 28L172 208" stroke-width="2"/></g>
  <g fill="#373b30" opacity=".72"><path d="M230 204Q210 112 252 38L242 116 286 64 254 142 294 122 246 166 244 206Z"/><path d="M222 156Q172 100 164 60Q196 80 230 132M256 136Q304 82 328 80Q318 112 262 156"/></g>
  <path d="M0 300L920 248 960 470 0 500Z" fill="url(#school-wood)"/>
  <g stroke="#d6c3a0" opacity=".22" fill="none"><path d="M30 328L930 278M18 368Q480 328 946 318M12 438Q490 398 952 378"/></g>
  <g class="school-register"><path d="M268 278L578 260 628 438 304 460Z" fill="#cbbda0"/><path d="M276 270L584 254 624 428 308 448Z" fill="#f4ecda"/><path d="M294 286L566 272M318 426L604 408" stroke="#a15b48" opacity=".55"/><path d="M318 304L340 418M372 300L394 414M430 296L452 410M488 292L510 406M544 288L566 402" stroke="#a15b48" opacity=".28"/><text x="326" y="322" font-size="18" fill="#504638">入塾名册</text><text class="school-name-ink" x="292" y="408" font-size="42" fill="#1c1914"></text></g>
  <path d="M132 360Q120 316 172 304Q230 304 238 340L226 370Q172 392 132 360" fill="#1d211d"/><ellipse cx="184" cy="332" rx="32" ry="14" fill="#080f0c"/>
  <g class="school-brush-hand"><path d="M168 468L148 386Q136 362 148 340L172 306Q182 292 190 300Q196 308 186 326L180 348 202 326Q214 316 220 326L216 352Q238 346 244 362L242 394 266 466Z" fill="#c9b590"/><path d="M186 332L208 344 218 334M190 352L224 364M184 368L216 378" fill="none" stroke="#8b7556" stroke-width="2"/><path d="M158 426L232 404 264 474H168Z" fill="#b3ad96"/><path d="M164 422L234 402" stroke="#e7dbc1" stroke-width="12"/><path d="M180 314L214 208" stroke="#59442c" stroke-width="8"/><path d="M180 312L166 350Q164 364 160 372Q174 366 180 352L188 314Z" fill="#1c201b"/><path d="M212 210L218 196" stroke="#b0a17f" stroke-width="3"/></g>
  <g class="school-book"><path class="school-leaf" d="M700 214L844 230 824 356 680 338Z" fill="#f6eedc"/><text class="school-leaf-mark" x="736" y="270" font-size="26" fill="#2c261c">正月</text><text class="school-leaf-mark" x="748" y="302" font-size="18" fill="#6d5e48">一日</text><g class="school-cover"><path d="M692 206L840 222 820 350 672 332Z" fill="#343b32"/><path d="M704 218L720 220 702 340 686 338Z" fill="#c4b48e"/><path d="M718 238L700 236M716 262L698 260M714 286L696 284M712 310L694 308" stroke="#efe4cc" stroke-width="2"/><path d="M760 248L800 254 790 316 750 310Z" fill="#efe4cc"/><text x="768" y="278" font-size="20" fill="#242820">黄</text><text x="768" y="302" font-size="20" fill="#242820">历</text></g></g>
  <g class="school-giving"><path d="M868 168Q786 196 724 252L670 286Q652 294 658 308Q670 318 692 306L728 286Q712 310 684 324Q670 334 680 344Q690 352 712 336L764 298Q806 280 876 260Z" fill="#bcaa87"/><path d="M686 304L716 282M696 326L736 294" stroke="#76664e" stroke-width="2" fill="none"/><path d="M888 142L770 210 804 304 920 270Z" fill="url(#school-sleeve)"/><path d="M774 212L800 296" stroke="#d2c6a9" stroke-width="11"/></g>
  <g class="school-receiving"><path d="M498 392L486 322Q462 290 470 268Q476 252 486 262L504 286Q524 258 546 246Q562 240 568 252L540 278Q574 262 580 276Q582 290 560 304L538 328 550 394Z" fill="#c9b590"/><path d="M494 358L544 344 566 396H498Z" fill="#b3ad96"/><path d="M496 352L546 338" stroke="#e7dbc1" stroke-width="10"/></g>
  </svg>`;}
  function clear(){draft=null;}
  async function open(){
    if(!draft){const a=new Uint32Array(1);crypto.getRandomValues(a);draft={seed:a[0],name:'',sex:null};}
    const d=draft,o=overlay('六岁 · 学堂报到'),h=o.host;h.classList.add('school-opening');
    const stage=node('div','school-stage');stage.dataset.pose='desk';stage.innerHTML=art();h.appendChild(stage);
    const copy=node('div','school-copy'),title=node('h2','', '山村 · 清晨'),text=node('p','school-dialogue'),choices=node('div','school-choices'),foot=node('div','school-controls');
    copy.append(title,text,choices);h.append(copy,foot);let ended=false,acting=false;
    return new Promise(resolve=>{
      function done(ok){if(ended)return;ended=true;o.close();resolve({ok,draft:d});}
      h.onCancel=()=>done(false);button(foot,'返回卷首',()=>done(false));
      function scene(t,line){title.textContent=t;text.textContent=line;choices.innerHTML='';}
      async function write(){
        acting=true;stage.dataset.pose='write';
        const ink=stage.querySelector('.school-name-ink'),hand=stage.querySelector('.school-brush-hand');
        const chars=Array.from(d.name);ink.textContent='';
        ink.setAttribute('font-size',chars.length>6?'28':chars.length>4?'34':'42');
        chars.forEach((ch,i)=>{const t=document.createElementNS('http://www.w3.org/2000/svg','tspan');t.textContent=ch;if(i)t.setAttribute('dx','8');t.setAttribute('fill-opacity','0');ink.appendChild(t);});
        const beats=Math.min(4,Math.max(2,chars.length)),ms=reduced()?160:1760;
        const frames=[{transform:'translate(-10px,16px) rotate(-18deg)',offset:0}];
        for(let s=0;s<beats;s++){const x=28+s*(200/(beats-1||1));frames.push({transform:'translate('+x+'px,-8px) rotate(-4deg)',offset:(s+1)/(beats+1)});}
        frames.push({transform:'translate(70px,-150px) rotate(18deg)'});
        const stamp=typeof performance!=='undefined'&&performance.now?performance.now():0;
        const reveal=()=>{
          const u=reduced()||!stamp?1:Math.min(1,((typeof performance!=='undefined'?performance.now():stamp)-stamp)/ms);
          const shown=Math.ceil(u*chars.length);
          for(let i=0;i<shown&&ink.children[i];i++)ink.children[i].setAttribute('fill-opacity','1');
          if(u<1&&typeof requestAnimationFrame==='function')requestAnimationFrame(reveal);
        };
        if(typeof requestAnimationFrame==='function'&&!reduced())requestAnimationFrame(reveal);
        else for(let i=0;i<chars.length;i++)ink.children[i].setAttribute('fill-opacity','1');
        await o.move(hand,frames,ms);
        for(let i=0;i<chars.length;i++)if(ink.children[i])ink.children[i].setAttribute('fill-opacity','1');
        acting=false;if(ended)return;
        stage.dataset.pose='named';
        scene('名册上有了你', '先生低头看了一眼：“'+d.name+'，记下了。家中来的，是儿子还是女儿？”');
        button(choices,'“我是家里的儿子。”',()=>sex('m'));button(choices,'“我是家里的女儿。”',()=>sex('f'));
      }
      function sex(value){d.sex=value;scene('先生应声', '“'+d.name+'，好孩子。”先生朝窗边的座位点点头。“'+(value==='f'?'这位小姑娘':'这位小郎君')+'也坐近些，今天先认日子。”');button(choices,'坐到窗边，听先生讲',lesson);}
      function name(){scene('先生点名', '“门口那孩子，满六岁了吧？到案前来。你叫什么名字？”');
        const input=node('input','school-name');input.maxLength=12;input.value=d.name;input.placeholder='在名册上写下名字';input.setAttribute('aria-label','向先生报上姓名');choices.append(input);
        button(choices,'报上名字，提笔落在名册上',()=>{if(acting)return;const value=input.value.trim().replace(/[<>\u0000-\u001f]/g,'').slice(0,12);if(!value){text.textContent='先生把笔放回你手边：“慢慢想，不着急。想好了再告诉我。”';input.focus();return;}d.name=value;choices.innerHTML='';text.textContent='你说：“我叫'+value+'。”先生扶正名册：“好，亲手写在这里。”';write();});input.focus();}
      function lesson(){scene('认年月日', '先生翻开历本：“大黎开国皇帝创历，是让各地记日有共同的准头。一年十二个月，大小月三十或三十一日。今日是大黎'+Dali.config.startYear+'年一月一日。先学会记日，也就能记住自己走过的路。”');button(choices,'“先生，我记住了。”',give);}
      async function give(){
        scene('把历本接到手里', '“'+d.name+'，这本给你。宜忌只是做事的小提醒，忌日也能做，宜日也未必成。今天报名的事，已经妥当了。”');
        acting=true;const book=stage.querySelector('.school-book'),hand=stage.querySelector('.school-giving'),child=stage.querySelector('.school-receiving');
        stage.dataset.pose='reach';
        await o.move(hand,[{transform:'translate(210px,-36px)'},{transform:'translate(0,0)'}],reduced()?160:720);
        stage.dataset.pose='carry';
        await Promise.all([
          o.move(hand,[{transform:'translate(0,0)'},{transform:'translate(-16px,108px)'}],reduced()?180:1080),
          o.move(book,[{transform:'translate(0,0)'},{transform:'translate(-16px,108px)'}],reduced()?180:1080)
        ]);
        stage.dataset.pose='catch';
        await o.move(child,[{transform:'translate(240px,260px)'},{transform:'translate(210px,96px)'}],reduced()?140:640);
        stage.dataset.pose='release';
        await o.move(hand,[{transform:'translate(-16px,108px)'},{transform:'translate(240px,-60px)'}],reduced()?140:560);
        acting=false;if(ended)return;
        text.textContent='你双手接住历本，摸到纸角。先生松开手：“收好了。放学还要回家吃饭；往后的事，一天一天学。”';
        button(choices,'翻开今天这一页',async()=>{
          if(acting||ended)return;acting=true;choices.innerHTML='';
          title.textContent='自己的第一本历';text.textContent='你把封面掀开。';
          stage.dataset.pose='open';
          await o.move(stage.querySelector('.school-cover'),[{transform:'translate(0,0)',opacity:1},{transform:'translate(-40px,-16px) rotate(-14deg)',opacity:0}],reduced()?160:820);
          acting=false;if(ended)return;
          text.textContent='大黎'+Dali.config.startYear+'年一月一日。你在页角认出“正月”两字，先生点头：“对，这就是一年开头。”';
          button(choices,'把历本收好，开始今天的生活',()=>done(true));
        });
      }
      scene('山村 · 清晨','山外的仙门很远，村里的炊烟很近。你是青石村一户寻常人家的孩子。满六岁这年，家里把书袋交给你，让你沿着晨光去学堂。');
      o.move(stage,[{transform:'translate(0,24px)',opacity:0},{transform:'translate(0,0)',opacity:1}],900);
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
      const v=School.ensure(s);title.textContent='青石村 · '+Dali.label(s);line.textContent=message||(v.days?('院门仍朝着旧路。'+(s.age<16?'放学后，家里还有些轻省活计。':'手里有了本事，也要照料灶间与乡邻。')):'历本还温着。今天可以在窗下认字，也可以跟家里去田里。');
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
