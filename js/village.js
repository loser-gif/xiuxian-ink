/* 纸上仙途 · 村童。成长点只作资格；正式效果仅由所选一项启动。 */
'use strict';
const Village = (() => {
  const stages = ['grab', 'six', 'nine', 'rain'];
  const axes = {wood:'B',book:'L',pouch:'P',school:'L',study:'L',farm:'B',craft:'C',observe:'P',count:'L',carry:'B',soup:'P',rope:'C'};
  const allowed = [['wood','book','pouch'],['school','farm','craft'],['study','farm','craft','observe'],['count','carry','soup','rope']];
  const talents = ['熟读成诵','筋骨耐劳','巧手省料','观风察微','执尺通文','山野识采','诸事兼习','有备而行'];
  const effects = ['炼气期基础功法研读进度多百分之三。','前三次普通受伤少一点，同类取最大。','前三次修补抵一份普通耗材。','前三处山路探查多一条可用线索。','基础器物入门研读进度多百分之三。','前三次有出产的普通采集多一份。','三份筹备，用时选灵石、材料或药布。','额外三灵石，可付三次普通补给。'];
  const routes = {money:'带上盘缠，先去做乡邻说的差事',letter:'带上先生的信，去镇上赴约',tools:'卷好村匠的工具，去交入门活',booktag:'拆修旧书，收好夹层里的铜签',swordcore:'修开旧木柄，用布裹好铁芯',bead:'继续留心小珠，将香囊贴身收好'};
  function draft(seed) {
    if (seed == null) { const a = new Uint32Array(1); globalThis.crypto.getRandomValues(a); seed = a[0] % 32; }
    if (!Number.isInteger(seed) || seed < 0 || seed > 31) throw Error('origin seed');
    return {originSeed:seed,sex:'m'};
  }
  function choose(d, stage, value) {
    const i = stages.indexOf(stage);
    if (i < 0 || allowed[i].indexOf(value) < 0) throw Error('stage choice');
    if (i && !d[stages[i-1]]) throw Error('stage order');
    d[stage] = value;
    stages.slice(i+1).forEach(k => delete d[k]);
    delete d.route; delete d.talent; delete d.confirmed;
    return qualify(d);
  }
  function qualify(d) {
    const p = {L:0,B:0,P:0,C:0};
    stages.forEach((k,i) => { if (allowed[i].indexOf(d[k]) >= 0) p[axes[d[k]]] += 2; });
    const complete = stages.every((k,i) => allowed[i].indexOf(d[k]) >= 0);
    const read = d.six === 'school' || d.nine === 'study', craft = d.six === 'craft' || d.nine === 'craft', farm = d.six === 'farm' || d.nine === 'farm';
    const turned = (d.six === 'school' ? 'study' : d.six) !== d.nine;
    const ts = [p.L>=4 && (d.nine==='study'||d.rain==='count'),p.B>=4&&farm&&(d.nine==='farm'||d.rain==='carry'),p.C>=4&&craft&&(d.nine==='craft'||d.rain==='rope'),p.P>=4&&d.nine==='observe'&&(d.grab==='pouch'||d.rain==='soup'),p.L>=2&&p.C>=2&&d.rain==='rope'&&(read||craft),p.B>=2&&p.P>=2&&farm&&d.rain==='soup',Object.values(p).filter(n=>n>0).length>=3&&Object.values(p).every(n=>n<=4)&&turned,true];
    const rs = ['money'];
    if (read && p.L>=2) rs.push('letter');
    if (craft && p.C>=2) rs.push('tools');
    if (d.grab==='book'&&p.L>=4&&p.C>=2&&craft&&d.rain==='rope') rs.push('booktag');
    if (d.grab==='wood'&&p.B>=4&&p.C>=2&&craft&&['rope','carry'].includes(d.rain)) rs.push('swordcore');
    if (d.originSeed===0&&d.grab==='pouch'&&d.six==='school'&&d.nine==='observe'&&d.rain==='soup') rs.push('bead');
    return {p,complete,talents:complete?ts.map((yes,i)=>yes?i+1:0).filter(Boolean):[],routes:complete?rs:[]};
  }
  function valid(d) { const q=qualify(d); return q.complete && ['m','f'].includes(d.sex) && q.talents.includes(d.talent) && q.routes.includes(d.route) && d.confirmed; }
  function apply(s,d) {
    if (s.village || !valid(d)) return false;
    s.village = {version:1,history:JSON.parse(JSON.stringify(d)),talent:d.talent,route:d.route,material:0,medicine:0,tools:d.route==='tools',coupons:d.talent===7?3:0,used:{},basic:0,art:0,goal:false,breaths:0,relic:['booktag','swordcore','bead'].includes(d.route)?d.route:null,awake:false,stored:0,capacity:0,fullAt:0,release:false,explore:null};
    s.ls += (d.route==='money'?6:2)+(d.talent===8?3:0);
    return true;
  }
  function left(v,key) { return Math.max(0,3-(v.used[key]||0)); }
  function spend(v,key) { v.used[key]=(v.used[key]||0)+1; }
  function injury(s,n,other) {
    const v=s.village;
    if (!v || v.talent!==2 || n<=0 || !left(v,'injury')) return other;
    spend(v,'injury'); return Math.min(other,Math.max(0,n-1));
  }
  // Core supplies the same action pre-state base: no positive bonuses, but all gainMul penalties.
  function breathing(s,base,success,add) {
    const v=s.village; if (!v || !success || s.dead || s.ascended || base<=0) return;
    v.breaths++;
    if (v.relic!=='bead'||!v.awake) return;
    if (!v.capacity) v.capacity=Math.max(1,base); // one unbonused action at awakening's first breath, fixed thereafter
    if (v.release && v.stored+1e-9>=v.capacity && v.fullAt<v.breaths) {
      if (add(Math.min(Math.floor(v.stored+1e-9),base)) !== false) { v.stored=0; v.fullAt=0; v.release=false; }
    }
    v.stored=Math.min(v.capacity,v.stored+base/10);
    if (v.stored+1e-9>=v.capacity && !v.fullAt) v.fullAt=v.breaths;
  }
  function action(s,id,emit) {
    const v=s.village; if (!v||s.dead||s.ascended) return {err:'此时不能办事'};
    const say=text=>({text});
    const cost=(n)=> { if(v.material<n)return false; v.material-=n; return true; };
    const time=()=>{Core.passTime(s,1,emit);return !s.dead&&!s.ascended;};
    const ended=()=>say('此生已尽，差事未成。');
    if (id==='release') { if(!v.awake||v.relic!=='bead'||!v.capacity||v.stored+1e-9<v.capacity)return {err:'尚未储满'}; v.release=!v.release; return say(v.release?'下次成功吐纳时放出储息。':'暂留储息。'); }
    if (id.indexOf('coupon:')===0) {
      const k=id.split(':')[1]; if(!v.coupons||!['money','material','medicine'].includes(k))return {err:'筹备已用完'};
      v.coupons--; if(k==='money')s.ls++;else v[k]++; return say('用去一份筹备。');
    }
    if(id==='supply') { if(s.ls<1)return {err:'需一灵石'};s.ls--;v.material++;return say('一灵石换一份普通麻纸木料。'); }
    if(id==='heal') { if(!v.medicine||s.inj<=0)return {err:'需药布与伤势'};v.medicine--;s.inj=Math.max(0,s.inj-1);return say('药布包扎，伤势减一。'); }
    if(id==='job'||id==='letter') {
      if(id==='letter'&&(v.route!=='letter'||v.letterDone))return {err:'没有待交书信'};
      if(!time())return ended();s.ls+=2;v.goal=true;if(id==='letter')v.letterDone=true;
      return say(id==='letter'?'镇上接应人收下先生书信，请你送完一袋米，付了二灵石。日后仍可来接普通差事。':'替乡邻送完一袋米，得二灵石。下一段路费有了着落。');
    }
    if(id==='gather') {const found=Math.random()>=.2;if(!time())return ended();let n=found?1:0;if(n>0&&v.talent===6&&left(v,'gather')){n++;spend(v,'gather');}v.material+=n;return say('在熟悉的山脚拾取干木与麻草，得普通材料'+n+'份。');}
    if(id==='basic'||id==='basicPaid'||id==='art') {
      const art=id==='art', paid=id==='basicPaid';
      if(art&&v.art>=100)return {err:'器物入门已学成'};
      if(!art && s.gf && s.gfs[s.gf].lv>=9)return {err:'这门功法已修满'};
      if(!art && s.gf && GONGFA[s.gf].grade!==0)return {err:'请先转修一门凡品基础功法'};
      if(paid&&!cost(1))return {err:'临帖需一份普通材料；也可免费研读'};
      if(!time())return ended();let n=paid?5:4;n*= (art?v.talent===5:v.talent===1&&s.realm===0)?1.03:1;
      if(art){v.art=Math.min(100,v.art+n);if(v.art>=100)v.tools=true;}
      else {v.basic+=n;if(!s.gf&&v.basic>=20)Core.learn(s,'qingming',[],emit);else if(s.gf)Core.practice(s,n,[],emit);}
      if(paid&&v.relic==='booktag'&&v.awake&&left(v,'booktag')){v.material++;spend(v,'booktag');}
      return say((art?'看器物图谱，入门':'研读基础功法，学习')+'进度增加'+n.toFixed(2)+'。'+(art&&v.tools?'已能自制基础工具。':''));
    }
    if(id==='repair') {
      const materialCut=v.talent===3&&left(v,'craft')?1:0;
      const maintenanceCut=v.tools&&v.relic==='swordcore'&&v.awake&&left(v,'maintenance')?1:0;
      const maintenance=v.tools?1:0; // borrowed tools at ordinary bench have no player maintenance expense
      const amount=2-materialCut+maintenance-maintenanceCut;
      if(!cost(amount))return {err:'修补需'+amount+'份普通材料（含自有工具维护）'};
      if(materialCut)spend(v,'craft');if(maintenanceCut&&maintenance)spend(v,'maintenance');
      const pay=v.tools?5:3;if(!time())return ended();s.ls+=pay;v.goal=true;
      if(v.relic==='swordcore'&&!v.awake){v.awake=true;v.tools=true;}
      return say('在镇上匠人的案前修好木筐，得'+pay+'灵石。'+(v.relic==='swordcore'?'旧铁芯嵌进工具，今后前三次维护各省一份普通材料。':''));
    }
    if(id==='awaken') {
      if(v.awake||!v.relic)return {err:'无需解封'};
      if(v.relic==='swordcore')return {err:'请完成一次普通修补'};
      if(v.relic==='booktag') {if(!Object.keys(s.gfs).some(id=>GONGFA[id]&&GONGFA[id].grade===0))return {err:'先学会一门基础功法'};if(!time())return ended();v.awake=true;return say('镇上抄书人带你辨清铜签细纹，固定解封。');}
      if(v.breaths<10||!v.goal)return {err:'需十次成功基础吐纳与一个普通目标'};
      if(!cost(1))return {err:'需一份普通材料'};v.awake=true;return say('初次祭炼完成。小珠一格储息，从下次基础吐纳开始积蓄。');
    }
    if(id==='explore') {
      if(v.explore)return {err:'先走完眼前这段路'};
      v.explore={safe:v.breaths%2===0?'ridge':'bank'};
      let line='山脚两条采集小路，一条沿坡，一条临岸。可以折返。';
      if(v.talent===4&&left(v,'clue')){spend(v,'clue');line+=v.explore.safe==='ridge'?'岸边新水痕漫过脚印，走高坡可避开湿滑处。':'高坡碎石新落，沿岸干燥石径更稳。';}
      v.explore.text=line;return say(line);
    }
    if(['ridge','bank','retreat'].includes(id)&&v.explore) {
      const safe=v.explore.safe;v.explore=null;if(id==='retreat')return say('回到镇上，未冒险。');if(!time())return ended();
      if(id===safe){if(Math.random()<.25)return say('石径虽稳，能用的干木已被收尽。今日没有出产。');v.material+=2;return say('沿干燥石径拾得两份普通材料。');}
      Core.applyFx(s,{inj:1},emit);return say('踩在湿滑碎石上，擦伤了手。');
    }
    return {err:'眼前没有这件事'};
  }
  return {draft,choose,qualify,valid,apply,talents,effects,routes,action,breathing,injury,left};
})();
