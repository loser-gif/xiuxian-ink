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
    function close(){if(closed)return;closed=true;document.removeEventListener('keydown',key,true);host.remove();if(app){if(old===null)app.removeAttribute('aria-hidden');else app.setAttribute('aria-hidden',old);}if(prior&&prior.focus)prior.focus();}
    function key(e){const layers=document.body.querySelectorAll('.school-screen');if(layers[layers.length-1]!==host)return;const typing=e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA');if(!typing&&/^[1-9]$/.test(e.key)){e.preventDefault();e.stopImmediatePropagation();return;}if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(host.onCancel)host.onCancel();else close();}if((e.key==='ArrowLeft'||e.key==='ArrowRight')&&host.onArrow){e.preventDefault();host.onArrow(e.key==='ArrowRight'?1:-1);}if(e.key==='Tab'){const items=Array.from(host.querySelectorAll('button,input')).filter(n=>!n.disabled&&!n.hidden);if(!items.length)return;const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}
    document.addEventListener('keydown',key,true);
    return {host,close};
  }
  function clear(){draft=null;}
  async function open(){
    if(!draft){const a=new Uint32Array(1);crypto.getRandomValues(a);draft={seed:a[0],name:'',sex:null};}
    const d=draft,o=overlay('青石村'),h=o.host;h.classList.add('school-opening');if(!reduced())h.classList.add('school-arrive');
    const copy=node('div','school-copy'),kicker=node('p','school-kicker','青石村'),title=node('h2'),text=node('p','school-dialogue'),nameLine=node('p','school-name-line'),err=node('p','school-error'),choices=node('div','school-choices'),foot=node('div','school-controls'),rail=node('div','school-rail');
    rail.append(node('span','vt'));rail.firstChild.append(node('span','vcol'));[...'青石村'].forEach(ch=>{const i=node('i',null,ch);rail.firstChild.firstChild.append(i);});
    copy.append(kicker,title,text,nameLine,err,choices);h.append(rail,copy,foot);
    const intro=['青石村在青石镇西头。老槐、石板，一座书塾。','镇上的人说，很远的地方有仙门。村里先要吃饭，认字，认得回家的路。','满六岁这年，家里让你去书塾。先生还没问你的名字。'];
    let ended=false,step=0;
    return new Promise(resolve=>{
      function done(ok){if(ended)return;ended=true;o.close();resolve({ok,draft:d});}
      h.onCancel=()=>done(false);
      const back=button(foot,'返回卷首',()=>done(false));
      let skip=null;
      function scene(t,line){title.textContent=t;text.textContent=line;choices.innerHTML='';}
      function showName(){
        nameLine.textContent=d.name;
        nameLine.classList.toggle('ink',!reduced());
      }
      function askSex(){
        scene('先生看着你','“'+d.name+'。家里来的，是儿子，还是女儿？”');
        button(choices,'“我是儿子。”',()=>sex('m'));
        button(choices,'“我是女儿。”',()=>sex('f')).focus();
      }
      function sex(value){
        d.sex=value;
        scene('先生应了一声',(value==='f'?'“女儿。好。”':'“儿子。好。”')+'先生侧过身，让出窗下的位子。“先坐下。日子和地图，等你认得人，再给你。”');
        button(choices,'在位子上坐下',()=>done(true)).focus();
      }
      function askName(){
        if(skip){skip.remove();skip=null;}
        scene('先生问你','“门口的孩子，到窗下来。你叫什么名字？”');
        const field=node('div','school-name-field');
        const input=node('input','school-name');input.maxLength=12;input.value=d.name;input.placeholder='你的名字';input.setAttribute('aria-label','向先生报上姓名');
        input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submit();}});
        field.append(input,node('i','field-line'));
        choices.append(field);
        button(choices,'告诉先生',submit);
        input.focus();
        function submit(){
          const value=input.value.trim().replace(/[<>\u0000-\u001f]/g,'').slice(0,12);
          if(!value){err.textContent='想好了再说。名字是你自己的。';text.textContent='先生没有催。“想好了再说。名字是你自己的。”';input.focus();return;}
          err.textContent='';
          d.name=value;showName();
          scene('名册上','你说：“我叫'+value+'。”先生重复了一遍，在名册上写下这几个字。');
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
      page.append(node('p','',seasons[Math.floor((m-1)/3)]+' · 此月'+len+'日'+(here?' · 今日在'+today.day+'日':'')));
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
      detail.append(node('p','almanac-good','大黎'+y+'年'+m+'月'+sel+'日'+(off===0?' · 今日':'')+(term?' · '+term:'')));
      detail.append(node('p','','宜 '+om.good));
      detail.append(node('p','','忌 '+om.bad));
      detail.append(node('p','almanac-note','抄书、帮工、修补的原有胜算，宜增、忌减'+Math.round(Math.min(Dali.config.shift,Dali.config.maxShift)*100)+'个百分点。不保证做成，也不拦你。翻看不消耗光阴。'));
      page.append(detail);
    }
    h.onArrow=dir=>{const len=Dali.config.months[m-1];sel+=dir;if(sel<1){shiftMonth(-1);sel=Dali.config.months[m-1];draw();return;}if(sel>len){shiftMonth(1);sel=1;draw();return;}draw();};
    button(nav,'上一月',()=>shiftMonth(-1));button(nav,'回今日',()=>{y=today.year;m=today.month;sel=today.day;draw();});button(nav,'下一月',()=>shiftMonth(1));button(nav,'合上历本',o.close);draw();
    const marked=page.querySelector('.almanac-day.on')||nav.firstChild;if(marked&&marked.focus)marked.focus();
  }
  function atlas(s,go){
    const v=s&&s.school;if(!v||!v.chart)return;
    const map=document.getElementById('map');
    if(!map||typeof InkMap==='undefined'||typeof LOCS==='undefined')return;
    const anchor={青州:'qingshi',云州:'yunyue',帝畿:'jingcheng',岭州:'heifeng',幽州:'gufu',雾州:'xuewu',荒州:'xihuang',海州:'beihai',天州:'yunhai'};
    const towns=[{id:'qingshi',name:'青石镇'},{id:'taohua',name:'桃花溪'},{id:'shanmen',name:'青冥山门'}];
    let view='realm',sel='青州';
    function wipe(el){while(el.firstChild)el.firstChild.remove();}
    function byId(id){return LOCS.find(l=>l.id===id);}
    function vname(text){const slip=node('span','tag-slip'),vt=node('span','vt'),col=node('span','vcol');[...text].forEach(ch=>col.append(node('i',null,ch)));vt.append(col);slip.append(vt);return slip;}
    function close(){map.classList.remove('open','ready','map-school');wipe(map);map.hidden=true;}
    wipe(map);
    const head=node('div','map-head'),ttl=node('div','map-ttl'),where=node('span');
    ttl.append(node('b',null,'大黎'),where,node('span',null,'淡墨为足迹，朱砂为此身'));
    const back=node('button','map-btn','返回九州');back.type='button';back.onclick=()=>{view='realm';sel='青州';paint();};
    const shut=node('button','map-close','合上图');shut.id='map-close';shut.type='button';shut.setAttribute('aria-label','合上图');shut.onclick=close;
    head.append(ttl,back,shut);
    const wrap=node('div','map-scroll-wrap'),scroll=node('div','map-scroll'),canvas=node('div','map-canvas');
    scroll.id='map-scroll';canvas.id='map-canvas';
    const far=node('img','map-far'),img=node('img','map-img');far.alt='';img.alt='';
    const marks=node('div','map-marks');
    canvas.append(far,img);
    if(document.createElementNS&&InkMap.roadPath){
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('class','map-road');svg.setAttribute('viewBox','0 0 '+InkMap.MW+' '+InkMap.MH);svg.setAttribute('preserveAspectRatio','none');
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('class','road-known');path.setAttribute('d',InkMap.roadPath(0,2));
      svg.appendChild(path);canvas.append(svg);
    }
    canvas.append(marks);scroll.append(canvas);wrap.append(node('div','map-roller l'),scroll,node('div','map-roller r'));
    const card=node('div','map-card');card.id='map-card';
    map.append(head,wrap,card);
    map.hidden=false;map.classList.add('open','map-school');
    function tag(name,id,fn){
      const loc=byId(id);if(!loc)return;
      const b=node('button','map-tag');b.type='button';b.style.left=(loc.x*100)+'%';b.style.top='22%';
      if(name===sel)b.classList.add('sel');
      b.append(vname(name));b.onclick=fn;marks.append(b);
      const pt=node('i','map-pt');pt.style.left=(loc.x*100)+'%';pt.style.top='74%';marks.append(pt);
    }
    function cardText(title,body,action){
      wipe(card);
      const headLine=node('div','mc-head');
      headLine.append(node('span','mc-seal',title.slice(0,1)),node('div','mc-name',title));
      card.append(headLine,node('p','mc-desc',body));
      if(action){const row=node('div','mc-btns');const b=button(row,action[0],action[1]);b.classList.add('mc-btn','on');card.append(row);}
    }
    function paint(){
      wipe(marks);back.hidden=view==='realm';
      where.textContent=view==='realm'?'九州 · 点开一州':'青州 · 青石镇在西头';
      if(view==='realm'){
        School.provinces.forEach(p=>{
          const id=anchor[p.name];
          tag(p.name,id,()=>{
            sel=p.name;
            if(p.home){view='town';sel='青石镇';paint();return;}
            paint();
          });
        });
        const home=sel==='青州';
        const p=School.provinces.find(x=>x.name===sel)||School.provinces[0];
        cardText(p.name,home?'青石村在青石镇西头。再点这一州，才看见镇子和脚下的路。':'未踏足 · 传闻。'+p.places.join('、')+'只是名字，没有上路的办法。',home?['进入青州',()=>{view='town';sel='青石镇';paint();}]:null);
      }else{
        towns.forEach(t=>tag(t.name,t.id,()=>{sel=t.name;paint();}));
        if(sel==='青石镇'){
          const away=s.loc==='taohua';
          cardText('青石镇',away?'人在桃花溪。回头要再走这些天。':(v.road<1?'你在村里。镇东小路还没走通，桃花溪只是名字。':'你在村里。镇东小路通着桃花溪，要走数日，吃自己的口粮。'),v.road<1?null:(away?['走回青石村',()=>{close();if(go)go('qingshi');}]:['沿镇东小路去桃花溪',()=>{close();if(go)go('taohua');}]));
        }else if(sel==='桃花溪'){
          cardText('桃花溪',v.road<1?'知道这条溪，还不等于能去。':'沿镇东小路要走数日。青冥山门更远，这一龄不去。',v.road<1?null:(s.loc==='taohua'?['走回青石村',()=>{close();if(go)go('qingshi');}]:['沿镇东小路去桃花溪',()=>{close();if(go)go('taohua');}]));
        }else cardText('青冥山门','州内更远处。这一龄只记下名字，没有非去不可的理由。');
      }
      const here=byId(s.loc==='taohua'?'taohua':'qingshi');
      if(here){const me=node('div','map-me');me.style.left=(here.x*100)+'%';me.style.top='74%';me.append(node('i','me-dot'));marks.append(me);}
    }
    paint();
    try{
      const job=InkMap.paint&&InkMap.paint();
      if(job&&job.then)job.then(art=>{if(art&&art.url){img.src=art.url;if(art.farUrl)far.src=art.farUrl;}map.classList.add('ready');}).catch(()=>map.classList.add('ready'));
      else map.classList.add('ready');
    }catch(e){map.classList.add('ready');}
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
