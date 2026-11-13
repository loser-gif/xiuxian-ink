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
    function key(e){const layers=document.body.querySelectorAll('.school-screen');if(layers[layers.length-1]!==host)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(host.onCancel)host.onCancel();else close();}if(e.key==='Tab'){const items=Array.from(host.querySelectorAll('button,input')).filter(n=>!n.disabled&&!n.hidden);if(!items.length)return;const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}
    document.addEventListener('keydown',key,true);
    return {host,close};
  }
  function clear(){draft=null;}
  async function open(){
    if(!draft){const a=new Uint32Array(1);crypto.getRandomValues(a);draft={seed:a[0],name:'',sex:null};}
    const d=draft,o=overlay('青石村'),h=o.host;h.classList.add('school-opening');
    const copy=node('div','school-copy'),kicker=node('p','school-kicker','青石村'),title=node('h2'),text=node('p','school-dialogue'),nameLine=node('p','school-name-line'),choices=node('div','school-choices'),foot=node('div','school-controls');
    copy.append(kicker,title,text,nameLine,choices);h.append(copy,foot);
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
        const input=node('input','school-name');input.maxLength=12;input.value=d.name;input.placeholder='告诉先生';input.setAttribute('aria-label','向先生报上姓名');
        input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submit();}});
        choices.append(input);
        button(choices,'告诉先生',submit);
        input.focus();
        function submit(){
          const value=input.value.trim().replace(/[<>\u0000-\u001f]/g,'').slice(0,12);
          if(!value){text.textContent='先生没有催。“想好了再说。名字是你自己的。”';input.focus();return;}
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
    const o=overlay('黄历'),h=o.host;h.classList.add('almanac-screen');let offset=0;
    const book=node('div','almanac-book'),left=node('div','almanac-binding'),page=node('div','almanac-page'),nav=node('nav','school-controls');left.textContent='大黎历';book.append(left,page);h.append(book,nav);
    function wipe(el){if(el.replaceChildren)el.replaceChildren();else while(el.firstChild)el.firstChild.remove();}
    function draw(){wipe(page);const d=Dali.today(s,offset),om=Dali.omen(s,offset);page.append(node('p','almanac-year','大黎'+d.year+'年'),node('h2','',d.month+'月'+d.day+'日'),node('p','', ['春','夏','秋','冬'][d.season]+' · '+(offset===0?'今日':offset>0?'往后'+offset+'日':'此前'+(-offset)+'日')),node('p','almanac-good','宜 '+om.good),node('p','','忌 '+om.bad),node('p','almanac-note','抄书、帮工、修补的原有胜算，宜增、忌减'+Math.round(Math.min(Dali.config.shift,Dali.config.maxShift)*100)+'个百分点。不保证做成，也不拦你。翻页不消耗光阴。'));}
    function turn(n){offset+=n;draw();}
    button(nav,'前一日',()=>turn(-1));button(nav,'回今日',()=>{offset=0;draw();});button(nav,'后一日',()=>turn(1));button(nav,'合上历本',o.close);draw();nav.firstChild.focus();
  }
  function atlas(s,go){
    const v=s&&s.school;if(!v||!v.chart)return;
    const o=overlay('大黎疆域'),h=o.host;h.classList.add('almanac-screen');
    const book=node('div','almanac-book'),left=node('div','almanac-binding'),page=node('div','almanac-page'),nav=node('nav','school-controls');
    left.textContent='疆域';book.append(left,page);h.append(book,nav);
    page.append(node('p','almanac-year','大黎疆域'));
    page.append(node('h2','','九州'));
    page.append(node('p','','青石村在青石镇西头，同属青州。认得地名，还不是能去。'));
    School.provinces.forEach(p=>{
      const line=node('p',p.home?'almanac-good':'');
      if(p.home){
        line.textContent=p.name+' · '+p.places[0]+'（含青石村）'+(s.loc==='taohua'?' · 人在桃花溪':' · 你在这里');
        page.append(line);
        if(v.road>=1&&s.loc!=='taohua')button(page,'沿镇东小路去桃花溪',()=>{o.close();if(go)go('taohua');});
        else if(s.loc==='taohua')button(page,'走回青石村',()=>{o.close();if(go)go('qingshi');});
        else page.append(node('p','','镇东小路还没走通。桃花溪、青冥山门只是名字。'));
        page.append(node('p','','青冥山门在州内更远处。这一龄，没有非去不可的理由。'));
      }else{
        const known=p.places.some(name=>{
          if(typeof LOCS==='undefined')return false;
          const loc=LOCS.find(l=>l.name===name);
          return loc&&s.found&&s.found[loc.id];
        });
        line.textContent=p.name+' · '+(known?p.places.join('、'):'未踏足 · 传闻');
        page.append(line);
      }
    });
    button(nav,'合上图',o.close).focus();
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
