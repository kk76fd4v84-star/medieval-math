window.KM=window.KM||{};
KM.DarkWizard=(()=>{
 const present=party=>KM.PartyAbilities.members(party,'darkWizard');
 const damage=party=>KM_DATA.darkWizard.damage*KM.PartyAbilities.bonus(party,'darkWizard');
 const backfire=f=>KM_DATA.darkWizard.backfire[Math.min(3,Math.max(0,Math.floor((Number.isFinite(f)?f:1)*4)))];
 const unlocked=()=>!!KM.Save.profile().unlocks?.darkWizard;
 function record(s,key,persist=true){
  s.riddleSolved=s.riddleSolved||[];
  if(!s.riddleSolved.includes(key))s.riddleSolved.push(key);
  if(s.riddleSolved.length<KM_DATA.darkWizard.requiredRiddles||unlocked()||s.wizardUnlocked)return false;
  s.wizardUnlocked=true;if(persist)KM.Save.unlock('darkWizard');return true;
 }
 // Hand-inked lightning strokes: short discrete flashes, no glossy full-screen strobe.
 function draw(ctx,fx){
  if(!fx||fx.t>.55)return;
  const frame=Math.floor(fx.t*12);if(frame===2||frame===5)return;
  ctx.save();ctx.lineJoin='miter';ctx.lineCap='butt';
  for(const [i,p]of fx.targets.entries()){
   const points=[];for(let n=0;n<=7;n++)points.push([p.x+(n===7?0:Math.sin(n*9+i*7+frame)*27),30+(p.y-30)*n/7]);
   for(const [colour,width]of [['#271d16',10],['#dc9c49',5],['#f5e5bf',2]]){ctx.strokeStyle=colour;ctx.lineWidth=width;ctx.beginPath();points.forEach(([x,y],j)=>j?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}
  }ctx.restore();
 }
 return{present,damage,backfire,unlocked,record,draw};
})();
