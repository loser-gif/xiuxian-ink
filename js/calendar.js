/* 大黎历。months remains the original simulation unit; no cultivation rebalance. */
'use strict';
const Dali = (() => {
  const config = { epoch: 1, startYear: 101, months: [31,30,31,30,31,30,31,30,31,30,30,30], shift: .03, min: .05, max: .95, maxShift: .03 };
  const kinds = ['抄书','帮工','修补'];
  const yearDays = () => config.months.reduce((a,b)=>a+b,0);
  function ordinal(y,m,d) { return (y-config.epoch)*yearDays()+config.months.slice(0,m-1).reduce((a,b)=>a+b,0)+d-1; }
  function date(day) {
    day=Math.floor(day+1e-7);const y=Math.floor(day/yearDays());let n=day-y*yearDays(),m=1;
    while(n>=config.months[m-1]){n-=config.months[m-1];m++;}
    return {year:y+config.epoch,month:m,day:n+1,season:Math.floor((m-1)/3)};
  }
  function hash(s) { let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0; }
  function ensure(s) {
    if(!s.calendar || typeof s.calendar !== 'object')s.calendar={};
    const c=s.calendar;
    if(!Number.isFinite(c.birthYear))c.birthYear=config.startYear-(s.school?6:16);
    if(!Number.isInteger(c.birthMonth)||c.birthMonth<1||c.birthMonth>12)c.birthMonth=1;
    if(!Number.isInteger(c.birthDay)||c.birthDay<1||c.birthDay>config.months[c.birthMonth-1])c.birthDay=1;
    if(!Number.isFinite(c.seed))c.seed=hash(s.name+'|'+s.months+'|'+JSON.stringify(s.lgEls));
    if(typeof c.unlocked !== 'boolean')c.unlocked=true;
    return c;
  }
  function boundary(c,n) {
    const total=c.birthYear*12+c.birthMonth-1+n,y=Math.floor(total/12),m=total-y*12+1;
    return ordinal(y,m,Math.min(c.birthDay,config.months[m-1]));
  }
  function exact(s) {const c=ensure(s),n=Math.floor(s.months),f=s.months-n;return boundary(c,n)+(boundary(c,n+1)-boundary(c,n))*f;}
  function today(s,offset) {return date(exact(s)+(offset||0));}
  function age(s) {const c=ensure(s),d=today(s);return d.year-c.birthYear-(d.month<c.birthMonth||(d.month===c.birthMonth&&d.day<c.birthDay)?1:0);}
  function monthsAt(s,day) {
    const c=ensure(s),d=date(day);let n=(d.year-c.birthYear)*12+d.month-c.birthMonth;
    if(boundary(c,n)>day+1e-7)n--;
    return n+(day-boundary(c,n))/(boundary(c,n+1)-boundary(c,n));
  }
  function span(s,days) {return monthsAt(s,exact(s)+days)-s.months;}
  function label(s,offset) {const d=today(s,offset);return '大黎'+d.year+'年'+d.month+'月'+d.day+'日';}
  function omen(s,offset) {const c=ensure(s),n=hash(c.seed+':'+Math.floor(exact(s)+(offset||0)+1e-7));const good=n%3;return {good:kinds[good],bad:kinds[(good+1+(n>>>8)%2)%3]};}
  function probability(s,kind,base) {
    if(base<=0||base>=1)return base;
    const o=omen(s),delta=Math.min(config.maxShift,config.shift)*(o.good===kind?1:o.bad===kind?-1:0);
    // Never turn a near-certain action into a large clamp-induced change.
    return Math.max(Math.min(base,config.min),Math.min(Math.max(base,config.max),base+delta));
  }
  return {config,kinds,yearDays,ordinal,date,ensure,exact,today,age,span,label,omen,probability,hash};
})();
