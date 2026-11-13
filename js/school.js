/* One continuous life: school, work, household, and an optional road to cultivation. */
'use strict';
const School = (() => {
  const activities = {
    study:{name:'到窗下读书',age:6,skill:'letters',gain:1,scene:'先生把字帖移近。你读过一行，再把不会的字指给他看。'},
    farm:{name:'随家里照料田地',age:6,skill:'farm',gain:1,scene:'田埂上的草渐渐短了。你收好农具，把今天的口粮带回灶间。'},
    craft:{name:'去匠棚学手艺',age:9,skill:'craft',gain:1,scene:'木尺贴住板沿。村匠看过你的手势，才让你把细处再磨一遍。'},
    copy:{name:'替书铺抄书',age:12,skill:'letters',gain:.6,kind:'抄书',base:.65,scene:'书铺摊开旧稿。掌柜验过字迹，按抄成的页数结了铜钱。'},
    work:{name:'到镇上帮工',age:12,skill:'farm',gain:.6,kind:'帮工',base:.7,scene:'你与乡邻一起卸货、清点。收工时，大家坐在檐下分茶。'},
    repair:{name:'接一单木器修补',age:16,skill:'craft',gain:.8,kind:'修补',base:.65,scene:'旧凳重新站稳。邻人试坐过，留下一把铜钱，下回还来找你。'},
    visit:{name:'回家与乡邻坐坐',age:6,scene:'你帮着摆好碗筷，听完一桩近事。有人记着你，也有人等你搭一把手。'},
    rest:{name:'留在家中歇息',age:6,scene:'灶火温着饭。你收起手里的活，睡过一夜，精神慢慢养回来。'}
  };
  function mortal(s){return !!(s&&s.school&&!s.school.entered);}
  function ensure(s) {
    if(!s.school)return null;
    const v=s.school;
    const defaults={v:1,entered:false,food:30,copper:12,letters:0,farm:0,craft:0,health:100,family:50,teacher:20,neighbor:20,days:0,seasonAt:0,pending:null,clue:0,proof:0,practice:0,pausedSearch:false,job:'未定',roll:1};
    Object.keys(defaults).forEach(k=>{if(v[k]==null)v[k]=defaults[k];});
    if(!v.people||typeof v.people!=='object')v.people={teacher:0,kin:0,mate:0,maker:0};
    ['teacher','kin','mate','maker'].forEach(k=>{if(typeof v.people[k]!=='number')v.people[k]=0;});
    if(typeof v.almanac!=='boolean')v.almanac=v.days>0;
    if(typeof v.chart!=='number')v.chart=v.days>30?1:0;
    if(v.pace!==3&&v.pace!==7&&v.pace!==30&&v.pace!==90)v.pace=7;
    if(typeof v.road!=='number')v.road=0;
    if(typeof v.affair!=='number')v.affair=0;
    if(v.affairChoice==null)v.affairChoice='';
    if(!v.place)v.place='school';
    if(v.intent==null)v.intent='';
    if(typeof v.homecoming!=='number')v.homecoming=0;
    if(v.work!=='farm'&&v.work!=='craft'&&v.work!=='work'&&v.work!=='copy'&&v.work!=='repair')v.work='';
    if(typeof v.guideMute!=='number')v.guideMute=-1;
    Dali.ensure(s);
    if(!v.almanac&&s.calendar)s.calendar.unlocked=false;
    return v;
  }
  function begin(s,d) {
    s.school={v:1,roll:d.seed||1};ensure(s);
    const shift=72-s.months;
    Object.keys(s.npc||{}).forEach(id=>{const n=s.npc[id];if(n.life){n.life.lastSeen+=shift;n.life.lastBeat+=shift;}});
    if(s.shi && typeof s.shi.next === 'number')s.shi.next+=shift;
    s.months=72;s.calendar={birthYear:Dali.config.startYear-6,birthMonth:1,birthDay:1,seed:d.seed||1,unlocked:false};
    s.who={sex:d.sex,mate:'any'};s.origin='village';s.gf=null;
    if(s.gfs.qingming && !s.gfs.qingming.broken)delete s.gfs.qingming;
    s.xw=0;
    s.flags.guide=0;s.loc='qingshi';s.found={qingshi:1};
    s.school.almanac=false;s.school.chart=0;s.school.pace=7;s.school.road=0;s.school.affair=0;s.school.affairChoice='';s.school.place='school';s.school.intent='';s.school.homecoming=0;s.school.work='';
    s.school.people={teacher:0,kin:0,mate:0,maker:0};
    s.school.seasonAt=Dali.today(s).year*4+Dali.today(s).season;Core.sync(s);
  }
  const paces=[3,7,30,90];
  const paceWord=n=>({3:'三日',7:'七日',30:'三十日',90:'九十日'}[n]||'七日');
  function cyclePace(s){const v=ensure(s);const i=paces.indexOf(v.pace);v.pace=paces[(i+1)%paces.length];return v.pace;}
  function placeName(s){
    if(!s||!s.school)return '青石村';
    if(s.loc==='taohua')return '桃花溪';
    if(s.school.chart)return '青石村 · 青石镇';
    return '青石村';
  }
  function metCount(v){return ['teacher','kin','mate','maker'].reduce((n,k)=>n+(v.people[k]>0?1:0),0);}
  function works(s){
    const v=ensure(s);if(!v)return ['farm'];
    const list=['farm'];
    if(s.age>=9&&v.people.maker>0)list.push('craft');
    if(s.age>=12){list.push('work');list.push('copy');}
    if(s.age>=16)list.push('repair');
    return list;
  }
  function workNow(s){
    const v=ensure(s);if(!v)return 'farm';
    const list=works(s);
    if(list.indexOf(v.work)>=0)return v.work;
    if(s.age>=9&&v.people.maker>0&&list.indexOf('craft')>=0)return 'craft';
    return 'farm';
  }
  function cycleWork(s){
    const list=works(s);const v=ensure(s);
    if(list.length<2){cyclePace(s);return workNow(s);}
    const i=list.indexOf(workNow(s));
    v.work=list[(i+1)%list.length];
    return v.work;
  }
  function workWord(id){return {farm:'田里',craft:'匠棚',work:'帮工',copy:'抄书',repair:'修补'}[id]||'田里';}
  function beatTitle(kind){return {study:'窗下',farm:'田头',craft:'匠棚',copy:'抄书',work:'帮工',repair:'修补',visit:'走访',rest:'灶前',neighbor:'乡邻',home:'家里'}[kind]||'青石';}
  function memory(v){
    if(v.affair!==2)return '';
    if(v.affairChoice==='teacher')return ' 阿娘还记得你那天没下田。';
    if(v.affairChoice==='kin')return ' 小禾见了你，说案已经钉好，字也补上了。';
    if(v.affairChoice==='maker')return ' 周叔提起你抬过的那根木。';
    return '';
  }
  function random(v){v.roll=(Math.imul(v.roll,1664525)+1013904223)>>>0;return v.roll/4294967296;}
  function job(s){const v=ensure(s);return s.age<16?'村中学童':v.craft>=120?'木匠':v.letters>=120?'抄书人':v.farm>=120?'农人':'镇上帮工';}
  function quote(s,id){const a=activities[id];if(!a||!a.kind)return null;const v=ensure(s),base=Math.min(.9,a.base+Math.min(200,v[a.skill])*.001);return {base,p:Dali.probability(s,a.kind,base),kind:a.kind};}
  function available(s,id){const a=activities[id];return !!(a&&s.age>=a.age);}
  function atHome(s){return !s||!s.loc||s.loc==='qingshi';}
  function villageMode(s){return !!(s&&s.school&&(!s.school.entered||(s.school.homecoming&&atHome(s))));}
  function day(s,emit,opt) {
    const v=ensure(s),before=s.age;
    Core.passTime(s,Dali.span(s,1)/Core.timeMonths(s,1),emit);
    if(s.dead||s.ascended)return false;
    v.days++;v.food=Math.max(0,v.food-1);
    const away=(opt&&opt.away)||!atHome(s);
    if(!away&&s.age<16&&v.food<5){v.food+=7;if(opt&&opt.note)opt.note.relief=(opt.note.relief||0)+1;}
    if(!away&&s.age>=16&&v.food<1){if(v.copper>=2){v.copper-=2;v.food+=3;}else v.health=Math.max(15,v.health-2);}
    if(s.age!==before&&emit)emit({title:'生辰',text:'今日满'+s.age+'岁。家里的旧书与手边本事，都跟着你走到了这一天。'});
    const q=Dali.today(s),season=q.year*4+q.season;
    if(v.seasonAt!==season){v.seasonAt=season;v.pending=q.season;}
    v.job=job(s);return true;
  }
  function action(s,id,count,emit) {
    const v=ensure(s);if(!v||s.dead||s.ascended)return {err:'这一卷已收。'};
    if(v.pending!==null&&id!=='neighbor'&&id!=='home')return {err:'先回应眼前的人，再安排往后的日子。'};
    if(id==='neighbor'||id==='home'){
      if(v.pending===null)return {err:'眼前没有待回应的事。'};
      if(id==='neighbor'){v.neighbor=Math.min(100,v.neighbor+6);v.food+=3;}
      else {v.family=Math.min(100,v.family+6);v.health=Math.min(100,v.health+8);}
      v.pending=null;return {text:id==='neighbor'?'你应下乡邻的邀约，一道收拾村里的公用家什。临走时分到了三份饭食。':'你陪家里人坐了一晚，把近来的话慢慢说完。'};
    }
    if(id==='buy') {if(v.copper<10)return {err:'十文能换二十份口粮；先做些家里的田活也能有饭吃。'};v.copper-=10;v.food+=20;return {text:'米袋放回灶间：用十文换来二十份口粮。'};}
    if(id==='pause'){v.pausedSearch=!v.pausedSearch;return {text:v.pausedSearch?'你把寻访笔记收好。眼前的日子一样值得过。':'你重新翻开寻访笔记，仍从上次记下的地方走。'};}
    if(id==='seek'||id==='enter')return seek(s,id,emit);
    if(!available(s,id))return {err:'年岁还小，先做眼前能做的事。'};
    const a=activities[id];count=Math.max(1,Math.min(90,Math.floor(count)||1));let done=0,ok=0,first=quote(s,id),last=first;
    const note={relief:0};
    let scene=a.scene;
    if(id==='study'&&v.letters>=40)scene='你翻过已读熟的几页，自己把新句读完。先生听到疑难处，才与你一道细讲。';
    if(id==='craft'){
      if(v.craft===0)scene=(s.age===9?'到了能进匠棚学艺的年纪，你头一回拿起木尺。':'你头一回到匠棚学艺，拿起木尺。')+'村匠扶正尺头，让你先沿板边画一道直线。';
      else if(v.craft>=40)scene='你自己量好尺寸，把板边磨平。村匠接过来看了看，只指着一处细痕与你商量。';
    }
    if(id==='work'&&v.farm>=40)scene='你搬起货来手脚稳当，不必再等乡邻指点。清点时，你报过一件，对方便在单上记下一件。';
    for(let i=0;i<count;i++){
      const q=quote(s,id),success=!q||random(v)<q.p;last=q;
      if(!day(s,emit,{note:note}))break;
      done++;if(a.skill)v[a.skill]=Math.min(1000,v[a.skill]+a.gain);
      if(id==='study')v.teacher=Math.min(100,v.teacher+.1);
      if(id==='farm'){v.food+=3;v.copper+=s.age>=16?1:0;}
      if(id==='craft')v.neighbor=Math.min(100,v.neighbor+.05);
      if(q){if(success){ok++;v.copper+=id==='repair'?8:5;}else v.copper+=1;}
      if(id==='visit'){v.family=Math.min(100,v.family+1);v.neighbor=Math.min(100,v.neighbor+.5);v.health=Math.min(100,v.health+1);}
      if(id==='rest')v.health=Math.min(100,v.health+4);
      if(v.pending!==null)break;
    }
    v.job=job(s);
    if(s.age>=16&&(a.kind||id==='farm'||id==='craft'))scene='你如今是'+v.job+'。'+scene;
    const invitation=s.age>=16?'换季时，乡邻在门外唤你，说村里正有活想请你这位'+v.job+'搭把手。':v.neighbor>=50?'换季时，熟识的乡邻在门外唤你，隔着院子便说起近况。':'换季时，乡邻在门外唤你。';
    const relief=note.relief?(' 人在家里，口粮见底时家里补过'+note.relief+'次，每次七份。人在路上没有这碗饭。'):'';
    return {days:done,success:ok,first,last,relief:note.relief,text:scene+' 共过'+done+'日。'+(first?'成事'+ok+'回；首日原胜算'+Math.round(first.base*100)+'%，历象后'+Math.round(first.p*100)+'%。逐日按当天历象结算，未成也有一文辛苦钱。':'')+relief+(v.pending!==null?invitation:'')};
  }
  function seek(s,id,emit) {
    const v=ensure(s);if(s.age<12)return {err:'先在村里读书做事；十二岁后可独自打听远路。'};
    if(v.pausedSearch)return {err:'寻访笔记已收好；想再走时可重新打开。'};
    if(id==='enter'){
      if(v.entered)return {err:'你已经能引气。'};
      if(v.clue<4)return {err:'尚未读懂入门法，不可贸然引气。'};
      if(v.health<40)return {err:'身子疲乏，先歇息养好精神。'};
      if(!day(s,emit))return {text:'此生光阴至此，笔记留在案头。'};
      v.practice++;
      if(v.practice<3)return {text:'你依照法门静坐，气息仍散。已稳住第'+v.practice+'段呼吸；还需亲自再试。'};
      v.entered=true;v.homecoming=0;v.intent='';
      s.found=s.found||{};s.found.qingshi=1;if(!s.found.taohua)s.found.taohua=1;s.found.shanmen=1;s.found.yunyue=1;
      if(s.gfs.qingming){delete s.gfs.qingming.broken;s.gf='qingming';if(s.flags.brokenPage==='qingming')delete s.flags.brokenPage;}
      else Core.learn(s,'qingming',[],null,false);
      Core.sync(s);
      return {entered:true,text:'第三段呼吸接续起来，一缕灵气留在丹田。你学会《'+GONGFA.qingming.name+'》，从此可以吐纳、访山与修持。村里的家与手艺仍在，随时可以回来。'};
    }
    if(v.entered)return {text:'入门法已经记熟，修行还要自己一步一步走。'};
    if(v.clue>=4)return {text:'方法已求得。愿不愿尝试引气，由你自己决定。'};
    if(v.clue===2&&v.letters<30&&v.craft<30)return {err:'碑上的字与刻痕还认不清。先读书或学艺，积累到三十，再来核对；线索不会消失。'};
    for(let i=0;i<3;i++){if(!day(s,emit))return {text:'此生光阴至此，寻访笔记留给后来人。'};if(v.pending!==null) return {text:'远行暂缓，先回应换季时家中的来人；线索还在。'};}
    v.clue++;
    return {text:[ '', '茶摊有人说，旧山道的碑曾留有吐纳之法。你只记下方向，尚不知是真是假。', '你走到旧山道，找到半块刻碑。回村时抄下刻痕，准备找人核对。', '你把字句与匠棚的旧拓本逐一比过，确认这不是货郎的夸口。缺页还在守山人的旧书中。', '守山人听你说明来意，借出旧书。你把碑文补齐，终于读懂引气的方法；书还回去，笔记留在手里。'][v.clue]};
  }
  function migration(s) {ensure(s);Dali.ensure(s);}
  function afterBeat(s,kind,out){
    const v=ensure(s);let extra='';
    const hadAlmanac=v.almanac,hadChart=v.chart,hadAffair=v.affair;
    if(kind==='study'){
      v.people.teacher+=1;v.place='school';
      if(!v.almanac&&v.letters>=2){
        v.almanac=true;if(s.calendar)s.calendar.unlocked=true;
        extra=' 先生把一本黄历推过来：“先认今天。宜是提醒，忌也不拦你。不必天天来对。”';
      }else extra=' 沈先生的位子在窗边。'+(v.people.teacher===1?'他只问你认不认自己的名字。':'');
    }else if(kind==='farm'){
      v.place='field';v.people.kin+=1;
      extra=' 阿娘在田头。'+(v.people.kin===1?'她让你把草篮放正，又指了指镇西的炊烟：家在那边。':'');
    }else if(kind==='craft'||kind==='repair'){
      v.place='shed';v.people.maker+=1;
      extra=kind==='repair'?' 邻人来取修好的木器。周叔说铜钱你自己收。':' 周叔在棚里。木尺比你的手长。';
    }else if(kind==='copy'||kind==='work'){
      v.place='town';
      extra=kind==='copy'?' 书铺掌柜点过页数，铜钱按页给你。':' 镇上卸完货，檐下还有一碗茶。';
    }else if(kind==='visit'){
      const who=['teacher','kin','maker','mate'][Dali.today(s).day%4];
      v.people[who]+=1;
      v.place=who==='teacher'||who==='mate'?'school':who==='maker'?'shed':'home';
      extra=who==='teacher'?' 沈先生还在塾里，案上有未干的墨。':who==='kin'?' 阿娘在灶前，问你今天认了几个字。':who==='maker'?' 周叔放下刨子，说镇东的路不好走，小孩子别一个人跑。':' 同窗小禾把抄坏的一页给你看，说先生没有骂她。';
      if(!v.chart&&v.almanac&&v.people.teacher>0&&v.people.kin>0){
        v.chart=1;
        extra+=' 你跟到村口。西头是青石村，石板路过去才是青石镇。这张镇图你记下了。远方只是地名。';
      }
      if(v.chart&&v.affair===0&&metCount(v)>=3){
        v.affair=1;
        extra+=' 塾门新贴一张纸：案腿断了。先生要人扶着，周叔要人抬木，阿娘说田里也等着你。';
      }
      extra+=memory(v);
    }else if(kind==='rest'){
      v.place='home';
      extra=' 你在家里歇着。灶火还温。';
    }
    if(v.pending!==null&&out&&kind!=='neighbor'&&kind!=='home')extra+='';
    if(out){
      out.text=(out.text||'')+extra;
      if(!out.title)out.title=!hadAlmanac&&v.almanac?'黄历':(!hadChart&&v.chart?'镇图':(hadAffair===0&&v.affair===1?'塾门':beatTitle(kind)));
    }
    return out;
  }
  function resolveAffair(s,kind,emit){
    const v=ensure(s);
    const actId=kind==='study'?'study':kind==='farm'?'farm':kind==='visit'?'visit':'rest';
    if(kind==='rest'){
      v.affairChoice='later';
      const out=action(s,'rest',Math.min(v.pace,3),emit);
      if(out.err)return out;
      out.text='你说等一等。案还断着，人也还在。明天再决定，不会因此断了这条路。';
      out.title='改日';
      return out;
    }
    const out=action(s,actId,Math.min(v.pace,7),emit);
    if(out.err)return out;
    v.affair=2;v.road=1;
    if(kind==='study'){v.affairChoice='teacher';v.people.teacher+=2;out.text='你留在塾里扶住断案。先生点头。小禾把纸铺在完好的半边。阿娘傍晚只说：田里的草，我自己拔了。';}
    else if(kind==='farm'){v.affairChoice='maker';v.people.maker+=2;out.text='你到棚里帮周叔抬木。案腿当晚钉好，小禾第二天能写字。阿娘知道你没下田，仍把饭留在锅里。';}
    else {v.affairChoice='kin';v.people.kin+=2;out.text='你回田里帮阿娘。书塾的案，周叔次日自己钉上。小禾抱怨坐得不稳，先生说知道了。';}
    out.text+=' 镇东小路你走得懂了。去桃花溪要数日，吃自己的口粮，不能一眨眼到。';
    if(!v.chart)v.chart=1;
    out.title='塾门';
    return out;
  }
  function play(s,kind,emit){
    const v=ensure(s);if(!v||s.dead||s.ascended)return {err:'这一卷已收。'};
    if(kind==='enter'){const out=seek(s,'enter',emit);if(out&&!out.err&&!out.title)out.title=out.entered?'初次引气':'引气';return out;}
    if(v.pending!==null&&kind!=='visit'&&kind!=='rest')return {err:'门口有人等你。走访是应乡邻，度日是陪家里。'};
    if(v.pending!==null&&kind==='visit'){const out=action(s,'neighbor',1,emit);if(out&&!out.err)out.title='乡邻';return out;}
    if(v.pending!==null&&kind==='rest'){const out=action(s,'home',1,emit);if(out&&!out.err)out.title='家里';return out;}
    if(v.affair===1)return resolveAffair(s,kind,emit);
    if(kind==='seek'){const out=seek(s,'seek',emit);if(out&&!out.err&&!out.title)out.title='寻访';return out;}
    if(kind==='visit'&&v.intent==='seek'&&s.loc==='taohua'&&s.age>=12&&v.road>=1&&v.clue<4&&!v.pausedSearch){const out=seek(s,'seek',emit);if(out&&!out.err&&!out.title)out.title='寻访';return out;}
    const id=kind==='study'?'study':kind==='farm'?workNow(s):kind==='visit'?'visit':'rest';
    const out=action(s,id,v.pace,emit);
    if(out.err)return out;
    return afterBeat(s,id,out);
  }
  function guideStep(s){
    const v=s&&s.school;if(!v||v.entered)return 4;
    if(!v.almanac)return 0;
    if(!(v.people&&v.people.kin>0))return 1;
    if(!v.chart)return 2;
    if(v.affair===1)return 3;
    return 4;
  }
  function guideLine(s){
    const step=guideStep(s);
    return ['先到窗下读书。先生会把黄历放在你手边。','黄历有了。去做活，到田头见阿娘。','走到村口。镇图要你自己认下来。','塾门贴了新纸。读书、做活、走访，是三种不同的帮忙。',''][step]||'';
  }
  function roadDays(s){return s.age<12?6:4;}
  function travel(s,dest,emit){
    const v=ensure(s);if(!v||s.dead||s.ascended)return {err:'这一卷已收。'};
    if(v.road<1)return {err:'镇东的路还没走通。图上的远方只是传闻。'};
    if(dest!=='taohua'&&dest!=='qingshi')return {err:'知道地名，还不等于能去。'};
    if(dest==='taohua'&&s.loc==='taohua')return {err:'你已经在溪边。'};
    if(dest==='qingshi'&&(s.loc==='qingshi'||!s.loc))return {err:'你就在青石。'};
    if(v.pending!==null)return {err:'门口有人等你。先应了再上路。'};
    const days=roadDays(s);
    if(v.food<days)return {err:'这段路要走'+days+'日，口粮只够'+Math.floor(v.food)+'日。先备足再上路。'};
    const foodBefore=v.food;
    for(let i=0;i<days;i++){if(!day(s,emit,{away:true}))return {text:'路走到一半，光阴到了头。',days:i};}
    if(v.food!==foodBefore-days)v.food=foodBefore-days;
    s.loc=dest;s.found=s.found||{};s.found[dest]=1;
    v.place=dest==='qingshi'?'village':'creek';
    v.homecoming=0;
    const left=Math.floor(v.food);
    return {traveled:dest,title:'出镇',days:days,text:dest==='taohua'
      ?'你沿镇东小路走了'+days+'日，吃掉'+days+'份口粮，还剩'+left+'份。桃花溪到了。回头同样要再走这些天。'
      :'你用了'+days+'日走回青石村，吃掉'+days+'份口粮，还剩'+left+'份。先看见的是村口的老槐。'};
  }
  const provinces=[
    {name:'青州',places:['青石镇','桃花溪','青冥山门'],home:true},
    {name:'云州',places:['云岳坊']},
    {name:'帝畿',places:['大黎京城']},
    {name:'岭州',places:['黑风岭']},
    {name:'幽州',places:['古修洞府']},
    {name:'雾州',places:['血雾谷']},
    {name:'荒州',places:['西荒']},
    {name:'海州',places:['北海']},
    {name:'天州',places:['云海天阶']}
  ];
  return {activities,mortal,ensure,begin,job,quote,available,action,migration,play,travel,cyclePace,paceWord,placeName,provinces,works,workNow,cycleWork,workWord,atHome,villageMode,roadDays,guideStep,guideLine};
})();
