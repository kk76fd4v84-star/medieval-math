// End-of-run accounting. S.score remains the authoritative earned total for old saves.
window.KM = window.KM || {};
KM.Score = (() => {
  const count = n => Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
  const empty = () => ({answers:[0,0,0,0], riddles:[0,0], scrolls:0, penalty:0});
  function copy(s) {
    const r=empty();
    r.answers=r.answers.map((_,i)=>count(s?.answers?.[i]));
    r.riddles=r.riddles.map((_,i)=>count(s?.riddles?.[i]));
    r.scrolls=count(s?.scrolls);r.penalty=count(s?.penalty);return r;
  }
  function record(s, points, kind, penalty=0) {
    if(kind==='riddle')s.riddles[points===2?1:0]++;
    else s.answers[Math.max(0,Math.min(3,points-1))]++;
    if(penalty){s.scrolls++;s.penalty+=penalty;}
  }
  function rows(ledger, earned, survivors, mode="math") {
    const s=copy(ledger), out=[];
    const add=(label,n,each)=>{if(n)out.push({label,count:n,each,points:n*each});};
    ['Answers · 75% or later','Answers · 50–75% of the timer','Answers · 25–50% of the timer','Answers · before 25% of the timer']
      .map((label,i)=>({label,i})).reverse().forEach(({label,i})=>add(label,s.answers[i],i+1));
    add('Riddles · before 50% of the timer',s.riddles[1],2);
    add('Riddles · 50% or later',s.riddles[0],1);
    if(s.penalty)out.push({label:'Scroll-assisted answers',count:s.scrolls,each:-2,points:-s.penalty});
    const tracked=out.reduce((n,r)=>n+r.points,0);
    if(earned!==tracked)out.unshift({label:'Earlier answers · saved before this tally',points:earned-tracked});
    add('Surviving party members · including you',survivors,2);
    if(!out.length)out.push({label:'No correct answers this run',points:0});
    return out;
  }
  // Count each category into the total, including deductions.
  function tally(rows,time){
    let cursor=.35,total=0,shown=0,active=-1;
    const values=rows.map((r,i)=>{
      const duration=Math.min(2.2,.6+Math.abs(r.points)*.06),u=Math.max(0,Math.min(1,(time-cursor)/duration));
      if(time>=cursor){shown=i+1;if(u<1)active=i;}
      const value=Math.sign(r.points)*Math.floor(Math.abs(r.points)*u);total+=value;cursor+=duration+.32;return value;
    });
    return {values,total,shown,active,complete:time>=cursor-.32};
  }
  return {empty,copy,record,rows,tally};
})();
