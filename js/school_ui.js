/* 入塾是一段短的纸上文字。日子本身回到主卷，不另开一张生活表。 */
'use strict';
const SchoolUI = (() => {
  let draft=null;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.motion==='lite';
  function node(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;}
  function button(parent,text,fn){const b=node('button','school-choice',text);b.type='button';b.onclick=fn;parent.appendChild(b);return b;}
  function overlay(label){
    const prior=document.activeElement,host=node('section','school-screen');host.setAttribute('role','dialog');host.setAttribute('aria-modal','true');host.setAttribute('aria-label',label);
    document.body.appendChild(host);const app=document.getElementById('app'),old=app&&app.getAttribute('aria-hidden');if(app)app.setAttribute('aria-hidden','true');
    let closed=false;
    function close(){if(closed)return;closed=true;document.body.classList.remove('school-veil');document.removeEventListener('keydown',key,true);host.remove();if(app){if(old===null)app.removeAttribute('aria-hidden');else app.setAttribute('aria-hidden',old);}if(prior&&prior.focus)prior.focus();}
    function key(e){const layers=document.body.querySelectorAll('.school-screen');if(layers[layers.length-1]!==host)return;const typing=e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA');if(!typing&&/^[1-9]$/.test(e.key)){e.preventDefault();e.stopImmediatePropagation();return;}if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(host.onCancel)host.onCancel();else close();}if((e.key==='ArrowLeft'||e.key==='ArrowRight')&&host.onArrow){e.preventDefault();host.onArrow(e.key==='ArrowRight'?1:-1);}if(e.key==='Tab'){const items=Array.from(host.querySelectorAll('button,input')).filter(n=>!n.disabled&&!n.hidden);if(!items.length)return;const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}
    document.addEventListener('keydown',key,true);
    return {host,close};
  }
  function clear(){draft=null;}
  async function open(){
    if(!draft){const a=new Uint32Array(1);crypto.getRandomValues(a);draft={seed:a[0],name:'',sex:null};}
    document.body.classList.add('school-veil');
    const d=draft,o=overlay('青石村'),h=o.host;h.classList.add('school-opening');if(reduced())h.classList.add('is-still');
    const leaf=node('div','school-leaf'),copy=node('div','school-copy'),kicker=node('p','school-kicker','青石村'),title=node('h2'),text=node('p','school-dialogue'),nameLine=node('p','school-name-line'),err=node('p','school-error'),choices=node('div','school-choices'),foot=node('div','school-controls'),rail=node('div','school-rail');
    rail.append(node('span','vt'));rail.firstChild.append(node('span','vcol'));[...'青石村'].forEach(ch=>{const i=node('i',null,ch);rail.firstChild.firstChild.append(i);});
    const reg=node('div','register'),spine=node('div','register-spine'),sheet=node('div','register-sheet'),line1=node('div','register-line'),line2=node('div','register-line'),line3=node('div','register-line');
    const spineVt=node('span','vt'),spineCol=node('span','vcol');[...'名册'].forEach(ch=>spineCol.append(node('i',null,ch)));spineVt.append(spineCol);spine.append(spineVt);
    line1.append(nameLine);sheet.append(line1,line2,line3);reg.append(spine,sheet);reg.hidden=true;
    copy.append(kicker,title,text,reg,err,choices);leaf.append(rail,copy,foot);h.append(leaf);
    const intro=['青石村在青石镇西头。老槐、石板，一座书塾。','镇上的人说，很远的地方有仙门。村里先要吃饭，认字，认得回家的路。','满六岁这年，家里让你去书塾。先生还没问你的名字。'];
    let ended=false,step=0;
    return new Promise(resolve=>{
      let unlift=function(){};
      function done(ok){if(ended)return;ended=true;unlift();o.close();resolve({ok,draft:d});}
      h.onCancel=()=>done(false);
      const back=button(foot,'返回卷首',()=>done(false));
      let skip=null,input=null;
      function scene(t,line){title.textContent=t;text.textContent=line;while(choices.firstChild)choices.firstChild.remove();}
      function clearLine(){while(line1.firstChild)line1.firstChild.remove();}
      function showName(){
        nameLine.textContent=d.name;
        nameLine.classList.toggle('ink',!reduced());
      }
      function written(){
        reg.hidden=false;
        clearLine();
        showName();
        line1.append(nameLine);
        if(d.sex)line1.append(node('span','register-note',d.sex==='f'?'女':'子'));
      }
      function liftFor(field){
        if(typeof window==='undefined'||!window.visualViewport)return;
        const vv=window.visualViewport;
        function lift(){
          const cover=Math.max(0,window.innerHeight-vv.height-vv.offsetTop);
          h.style.paddingBottom=cover?(cover+16)+'px':'';
          h.style.alignItems=cover>80?'flex-start':'';
          if(field&&document.activeElement===field&&field.scrollIntoView)field.scrollIntoView(true);
        }
        vv.addEventListener('resize',lift);
        vv.addEventListener('scroll',lift);
        unlift=function(){vv.removeEventListener('resize',lift);vv.removeEventListener('scroll',lift);h.style.paddingBottom='';h.style.alignItems='';};
      }
      function askSex(){
        scene('先生看着你','“'+d.name+'。家里来的，是儿子，还是女儿？”');
        written();
        button(choices,'“我是儿子。”',()=>sex('m')).classList.add('school-sex');
        button(choices,'“我是女儿。”',()=>sex('f')).classList.add('school-sex');
        choices.querySelector('.school-sex').focus();
      }
      function sex(value){
        d.sex=value;
        scene('先生应了一声',(value==='f'?'“女儿。好。”':'“儿子。好。”')+'先生侧过身，让出窗下的位子。“先坐下。日子和地图，等你认得人，再给你。”');
        written();
        button(choices,'在位子上坐下',()=>done(true)).focus();
      }
      function askName(){
        if(skip){skip.remove();skip=null;}
        scene('先生问你','“门口的孩子，到窗下来。你叫什么名字？”');
        reg.hidden=false;
        clearLine();
        nameLine.textContent='';
        input=node('input','school-name');input.maxLength=12;input.value=d.name;input.setAttribute('aria-label','向先生报上姓名');input.setAttribute('enterkeyhint','done');
        input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submit();}});
        line1.append(input);
        button(choices,'告诉先生',submit).classList.add('school-seal');
        liftFor(input);
        input.focus();
        function submit(){
          const value=input.value.trim().replace(/[<>\u0000-\u001f]/g,'').slice(0,12);
          if(!value){err.textContent='想好了再说。名字是你自己的。';text.textContent='先生没有催。“想好了再说。名字是你自己的。”';input.focus();return;}
          err.textContent='';
          d.name=value;
          scene('名册上','你说：“我叫'+value+'。”先生重复了一遍，在名册上写下这几个字。');
          written();
          button(choices,'先生记下了',askSex).focus();
        }
      }
      function nextIntro(){
        if(step>=intro.length){askName();return;}
        scene(step===0?'镇西':'书塾之前',intro[step]);
        step++;
        const again=button(choices,step>=intro.length?'去书塾':'继续',nextIntro);
        again.focus();
      }
      skip=button(foot,'略过介绍',()=>{step=intro.length;askName();});
      nextIntro();
    });
  }
  function calendar(s){
    if(s&&s.school&&!s.school.almanac)return;
    const o=overlay('黄历'),h=o.host;h.classList.add('almanac-screen');
    const book=node('div','almanac-book'),left=node('div','almanac-binding'),page=node('div','almanac-page'),nav=node('nav','school-controls');
    left.textContent='大黎历';book.append(left,page);h.append(book,nav);
    const today=Dali.today(s);let y=today.year,m=today.month,sel=today.day;
    const seasons=['春','夏','秋','冬'];
    const terms={1:'入春',4:'入夏',7:'入秋',10:'入冬'};
    function wipe(el){if(el.replaceChildren)el.replaceChildren();else while(el.firstChild)el.firstChild.remove();}
    function shiftMonth(n){
      let i=(y-Dali.config.epoch)*12+(m-1)+n;
      if(i<0)i=0;
      y=Dali.config.epoch+Math.floor(i/12);m=i%12+1;
      const len=Dali.config.months[m-1];
      if(sel>len)sel=len;
      draw();
    }
    function draw(){
      wipe(page);
      const len=Dali.config.months[m-1];
      const here=y===today.year&&m===today.month;
      page.append(node('p','almanac-year','大黎'+y+'年'));
      page.append(node('h2','',m+'月'));
      const sub=node('p','almanac-sub',seasons[Math.floor((m-1)/3)]+' · 此月'+len+'日');
      if(here)sub.append(node('span','almanac-now','今日 '+today.day));
      page.append(sub);
      const grid=node('div','almanac-month');
      for(let d=1;d<=len;d++){
        const b=node('button','almanac-day',String(d));b.type='button';
        if(here&&d===today.day)b.classList.add('today');
        if(d===sel)b.classList.add('on');
        b.setAttribute('aria-label',m+'月'+d+'日');
        b.onclick=()=>{sel=d;draw();};
        grid.append(b);
      }
      page.append(grid);
      const off=Dali.ordinal(y,m,sel)-Dali.ordinal(today.year,today.month,today.day);
      const om=Dali.omen(s,off);
      const term=sel===1&&terms[m]?terms[m]:'';
      const detail=node('div','almanac-detail');
      const lead=node('p','almanac-good','大黎'+y+'年'+m+'月'+sel+'日'+(term?' · '+term:''));
      if(off===0)lead.append(node('span','almanac-now','今日'));
      detail.append(node('span','almanac-num',String(sel)),lead);
      detail.append(node('p','','宜 '+om.good));
      detail.append(node('p','','忌 '+om.bad));
      detail.append(node('p','almanac-note','抄书、帮工、修补的原有胜算，宜增、忌减'+Math.round(Math.min(Dali.config.shift,Dali.config.maxShift)*100)+'个百分点。不保证做成，也不拦你。翻看不消耗光阴。'));
      page.append(detail);
    }
    h.onArrow=dir=>{const len=Dali.config.months[m-1];sel+=dir;if(sel<1){shiftMonth(-1);sel=Dali.config.months[m-1];draw();return;}if(sel>len){shiftMonth(1);sel=1;draw();return;}draw();};
    function shutCal(){if(s.school)s.school.sawCal=1;o.close();if(typeof window!=='undefined'&&window.__moxian){if(window.__moxian.save)window.__moxian.save();if(window.__moxian.render)window.__moxian.render();}}
    h.onCancel=shutCal;
    button(nav,'上一月',()=>shiftMonth(-1));button(nav,'回今日',()=>{y=today.year;m=today.month;sel=today.day;draw();});button(nav,'下一月',()=>shiftMonth(1));button(nav,'合上历本',shutCal);draw();
    const marked=page.querySelector('.almanac-day.on')||nav.firstChild;if(marked&&marked.focus)marked.focus();
  }
  function atlas(s,go){
    const v=s&&s.school;if(!v||!v.chart)return;
    const map=document.getElementById('map');
    if(!map||typeof InkMap==='undefined'||!InkMap.paintBoard)return;
    let view='realm',sel='青州';
    function wipe(el){while(el.firstChild)el.firstChild.remove();}
    function vname(text){const slip=node('span','tag-slip'),vt=node('span','vt'),col=node('span','vcol');[...text].forEach(ch=>col.append(node('i',null,ch)));vt.append(col);slip.append(vt);return slip;}
    function close(){map.classList.remove('open','ready','map-school','map-realm','map-province','map-town');wipe(map);map.hidden=true;if(s.school)s.school.sawMap=1;if(typeof window!=='undefined'&&window.__moxian){if(window.__moxian.save)window.__moxian.save();if(window.__moxian.render)window.__moxian.render();}}
    wipe(map);
    const head=node('div','map-head'),ttl=node('div','map-ttl'),where=node('span');
    ttl.append(node('b',null,'大黎'),where,node('span',null,'淡墨为足迹，朱砂为此身'));
    const back=node('button','map-btn','返回九州');back.type='button';back.onclick=()=>{view='realm';sel='青州';paint();};
    const shut=node('button','map-close','收');shut.id='map-close';shut.type='button';shut.setAttribute('aria-label','收卷');shut.onclick=close;
    shut.innerHTML='<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="6" y="6" width="88" height="88" rx="8" fill="#b3302a"/><text x="50" y="67" text-anchor="middle" font-size="46" fill="#f3ead6">收</text></svg>';
    head.append(ttl,back,shut);
    const wrap=node('div','map-scroll-wrap'),scroll=node('div','map-scroll'),canvas=node('div','map-canvas');
    scroll.id='map-scroll';canvas.id='map-canvas';
    const img=node('img','map-img');img.alt='';
    const marks=node('div','map-marks');
    canvas.append(img,marks);scroll.append(canvas);wrap.append(node('div','map-roller l'),scroll,node('div','map-roller r'));
    const card=node('div','map-card');card.id='map-card';
    map.append(head,wrap,card);
    map.hidden=false;map.classList.add('open','map-school');
    function tagAt(place,fn){
      const b=node('button','map-tag');b.type='button';
      b.style.left=(place.x*100)+'%';b.style.top=(place.y*100)+'%';
      if(place.name===sel)b.classList.add('sel');
      if(view==='realm'&&place.name!=='青州')b.classList.add('rumor');
      b.append(vname(place.name));b.onclick=fn;marks.append(b);
    }
    function cardText(title,body,action){
      wipe(card);
      const headLine=node('div','mc-head');
      headLine.append(node('span','mc-seal',title.slice(0,1)),node('div','mc-name',title));
      card.append(headLine,node('p','mc-desc',body));
      if(action){const row=node('div','mc-btns');const b=button(row,action[0],action[1]);b.classList.add('mc-btn','on');card.append(row);}
    }
    function paint(){
      wipe(marks);
      map.classList.remove('map-realm','map-province','map-town');
      map.classList.add(view==='realm'?'map-realm':view==='province'?'map-province':'map-town');
      back.hidden=view==='realm';
      back.textContent=view==='town'?'返回青州':'返回九州';
      back.onclick=()=>{if(view==='town'){view='province';sel='青石镇';}else{view='realm';sel='青州';}paint();};
      where.textContent=view==='realm'?'九州 · 九座都在这一纸上':view==='province'?'青州 · 镇与路':'青石镇 · 村在西头';
      const kind=view==='realm'?'realm':view==='province'?'province':'town';
      const narrow=(typeof window==='undefined'?1200:(window.innerWidth||1200))<720;
      let board=null;
      try{board=InkMap.paintBoard(kind,{narrow:narrow,road:v.road>=1});}catch(e){board=null;}
      const apply=art=>{
        if(!art)return;
        if(art.url)img.src=art.url;
        wipe(marks);
        (art.places||[]).forEach(place=>{
          tagAt(place,()=>{
            sel=place.name;
            if(view==='realm'&&place.name==='青州'){view='province';sel='青石镇';paint();return;}
            if(view==='province'&&place.name==='青石镇'){view='town';sel='青石村';paint();return;}
            paint();
          });
        });
        if(view==='realm'){
          const home=sel==='青州';
          const rumor=School.provinces.find(x=>x.name===sel);
          cardText(sel,home?'青石村在这一州西头。点进去，才是镇子。':'未踏足 · 传闻。'+((rumor&&rumor.places.join('、'))||'')+'只是名字，没有上路的办法。',home?['进入青州',()=>{view='province';sel='青石镇';paint();}]:null);
        }else if(view==='province'){
          if(sel==='青冥山门')cardText('青冥山门','雾在更远处。这一龄没有路，名字也不能当成能去。');
          else if(sel==='桃花溪')cardText('桃花溪',v.road<1?'溪还在雾里。镇东的路没走通。':'沿镇东走数日，吃自己的口粮。',v.road<1?null:(s.loc==='taohua'?['走回青石村',()=>{close();if(go)go('qingshi');}]:['沿镇东小路去桃花溪',()=>{close();if(go)go('taohua');}]));
          else {
            const away=s.loc==='taohua';
            cardText('青石镇',v.road<1?'你在村里。镇东小路还没走通，桃花溪只是名字。':(away?'人在桃花溪。回头同样要走这些天。':'镇东小路通着桃花溪，要走数日。'),v.road<1?['再看镇里',()=>{view='town';sel='青石村';paint();}]:(away?['走回青石村',()=>{close();if(go)go('qingshi');}]:['沿镇东小路去桃花溪',()=>{close();if(go)go('taohua');}]));
          }
        }else{
          const away=s.loc==='taohua';
          cardText('青石镇',away?'人在桃花溪。回头同样要走这些天。':(v.road<1?'村在镇西头。往东的路在雾里断了。':'村在西头，镇东小路已经走得通。'),v.road<1?null:(away?['走回青石村',()=>{close();if(go)go('qingshi');}]:['沿镇东小路去桃花溪',()=>{close();if(go)go('taohua');}]));
        }
        const dotName=view==='town'?(awayName()):sel==='青石镇'||sel==='青石村'?'青石村':sel;
        const spot=(art.places||[]).find(p=>p.name===dotName)||(art.places||[])[0];
        if(spot&&(view!=='realm'||sel==='青州')){const me=node('div','map-me');const dotY=spot.dot!=null?spot.dot:spot.y+0.18;me.style.left=(spot.x*100)+'%';me.style.top=(dotY*100)+'%';me.append(node('i','me-dot'));marks.append(me);}
        map.classList.add('ready');
      };
      function awayName(){return s.loc==='taohua'&&v.road>=1?'桃花溪':'青石村';}
      if(board&&board.then)board.then(apply).catch(()=>map.classList.add('ready'));
      else apply(board);
    }
    paint();
  }
  function closeLife(){}
  function life(state,perform){
    const o=overlay('一段日子');const h=o.host;h.classList.add('school-life');
    const line=node('p','school-dialogue','主卷上的读书、做活、走访、度日，就是这些日子。这里只留作补记。');
    const choices=node('div','school-choices');h.append(line,choices);
    button(choices,'回到卷上',o.close).focus();
    if(perform)h._perform=perform;
    return o;
  }
  return {open,clear,calendar,atlas,life,closeLife};
})();
