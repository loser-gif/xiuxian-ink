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
    Dali.ensure(s);return v;
  }
  function begin(s,d) {
    s.school={v:1,roll:d.seed||1};ensure(s);
    const shift=72-s.months;
    Object.keys(s.npc||{}).forEach(id=>{const n=s.npc[id];if(n.life){n.life.lastSeen+=shift;n.life.lastBeat+=shift;}});
    if(s.shi && typeof s.shi.next === 'number')s.shi.next+=shift;
    s.months=72;s.calendar={birthYear:Dali.config.startYear-6,birthMonth:1,birthDay:1,seed:d.seed||1,unlocked:true};
    s.who={sex:d.sex,mate:'any'};s.origin='village';s.gf=null;
    if(s.gfs.qingming && !s.gfs.qingming.broken)delete s.gfs.qingming;
    s.xw=0;
    s.flags.guide=0;s.school.seasonAt=Dali.today(s).year*4+Dali.today(s).season;Core.sync(s);
  }
  function random(v){v.roll=(Math.imul(v.roll,1664525)+1013904223)>>>0;return v.roll/4294967296;}
  function job(s){const v=ensure(s);return s.age<16?'村中学童':v.craft>=120?'木匠':v.letters>=120?'抄书人':v.farm>=120?'农人':'镇上帮工';}
  function quote(s,id){const a=activities[id];if(!a||!a.kind)return null;const v=ensure(s),base=Math.min(.9,a.base+Math.min(200,v[a.skill])*.001);return {base,p:Dali.probability(s,a.kind,base),kind:a.kind};}
  function available(s,id){const a=activities[id];return !!(a&&s.age>=a.age);}
  function day(s,emit) {
    const v=ensure(s),before=s.age;
    Core.passTime(s,Dali.span(s,1)/Core.timeMonths(s,1),emit);
    if(s.dead||s.ascended)return false;
    v.days++;v.food=Math.max(0,v.food-1);
    if(s.age<16&&v.food<5)v.food+=7;
    if(s.age>=16&&v.food<1){if(v.copper>=2){v.copper-=2;v.food+=3;}else v.health=Math.max(15,v.health-2);}
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
    let scene=a.scene;
    if(id==='study'&&v.letters>=40)scene='你翻过已读熟的几页，自己把新句读完。先生听到疑难处，才与你一道细讲。';
    if(id==='craft'){
      if(v.craft===0)scene=(s.age===9?'到了能进匠棚学艺的年纪，你头一回拿起木尺。':'你头一回到匠棚学艺，拿起木尺。')+'村匠扶正尺头，让你先沿板边画一道直线。';
      else if(v.craft>=40)scene='你自己量好尺寸，把板边磨平。村匠接过来看了看，只指着一处细痕与你商量。';
    }
    if(id==='work'&&v.farm>=40)scene='你搬起货来手脚稳当，不必再等乡邻指点。清点时，你报过一件，对方便在单上记下一件。';
    for(let i=0;i<count;i++){
      const q=quote(s,id),success=!q||random(v)<q.p;last=q;
      if(!day(s,emit))break;
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
    return {days:done,success:ok,first,last,text:scene+' 共过'+done+'日。'+(first?'成事'+ok+'回；首日原胜算'+Math.round(first.base*100)+'%，历象后'+Math.round(first.p*100)+'%。逐日按当天历象结算，未成也有一文辛苦钱。':'')+(v.pending!==null?invitation:'')};
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
      v.entered=true;
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
  return {activities,mortal,ensure,begin,job,quote,available,action,migration};
})();
