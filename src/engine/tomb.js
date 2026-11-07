// First-person view adapter. Combat, timing, roles and wounds remain in the real game.
window.KM=window.KM||{};
KM.Tomb=(()=>{
 const root='assets/tomb/v40/',clamp=n=>Math.max(0,Math.min(1,n));
 const requested=()=>{const q=new URLSearchParams(location.search);return q.has('debug')&&q.get('preview')==='tomb';};
 const active=S=>S.chapter==='tomb';
 const route=()=>KM_DATA.tomb.route.map((q,i)=>({...q,group:q.group?.slice(),walksIn:true,src:'tomb:'+i,level:'normal',gold:0}));
 const preload=()=>[...KM.TombDepth.preloadAll(),KM.TombFalls.preload(),KM.TombMemorials.preload(),...['sentry.png','portraits-source.png'].map(f=>KM.Assets.loadImg(root+f))];
 const reduced=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const roster=S=>S.tombRoster||S.party;
 function portrait(S,m){const i=Math.max(0,roster(S).findIndex(q=>q.id===m.id)),n=roster(S).length;return {x:1200+(i-(n-1)/2)*240,y:752,w:198,h:214};}
 const beginFall=(S,m)=>KM.TombFalls.begin(S,m,portrait(S,m).x);
 const revive=(S,m)=>KM.TombFalls.revive(S,m);
 const livingPortraits=S=>roster(S).map(slot=>S.party.find(m=>m.id===slot.id&&!m.dying&&!m.eaten)).filter(Boolean);
 function partyPose(S,m){if(!active(S))return null;const p=portrait(S,m);return {x:p.x,y:p.y+150,scale:.2,rear:false};}
 function actorPose(S,a){
  if(!active(S)||!a?.foe)return null;
  const st=S.stops[a.stop];if(!st)return null;
  const peers=S.actors.filter(f=>f.stop===a.stop&&f.foe).sort((a,b)=>(a.extra||0)-(b.extra||0));
  const i=peers.indexOf(a),offset=(i-(peers.length-1)/2)*500;
  const world=st.stopX-KM_DATA.world.engageScreenX+KM.TombDepth.cfg.enemyNear;
  return KM.TombDepth.enemy(S.camX,world,offset);
 }
 function drawEnemy(ctx,S,a,hooks){
  const p=actorPose(S,a);if(!p||a.stop<S.stop||a.dead)return;
  const anim=a.act,k=anim?clamp(anim.t/anim.dur):0;
  const lunge=anim?.name==='attack'?Math.sin(Math.PI*k):0;
  const hurt=anim?.name==='hurt'?Math.sin(k*25)*(1-k)*12:0;
  const roar=anim?.name==='roar'?Math.sin(Math.PI*k)*.035:0;
  const s=p.scale*(1+lunge*.20+roar),x=p.x+hurt,y=p.y+lunge*45;
  // One fixed source drawing: held poses, forward lunge and recoil, never a side walk.
  ctx.save();ctx.filter='brightness('+p.light+')';ctx.translate(x,y);ctx.scale(s,s);
  KM.Assets.drawEntity(ctx,a.id,0,0,{alpha:a.alpha??1,t:S.t,action:'idle',hurt:anim?.name==='hurt'&&k<.2});
  ctx.restore();a.drawX=x;a.drawY=y;
  const [w,h]=KM.Assets.entitySize(a.id);hooks.occupy(a,x-w*s/2,y-h*s,w*s,h*s);
  if(a.active&&a.stop===S.stop&&p.z<1100)hooks.say(a,x,y-h*s,{x,y:y-h*s*.85});
  if(anim?.name==='hurt'&&k<.48&&!reduced()){
   ctx.save();ctx.strokeStyle='#ac5c24';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x-70*s,y-h*s*.66);ctx.lineTo(x+70*s,y-h*s*.45);ctx.stroke();ctx.restore();
  }
 }
 function portraits(ctx,S,hooks){
  const im=KM.Assets.loadImg(root+'portraits-source.png');if(!im._ok)return;
  const crops=[[506,540,138,150],[681,540,139,150],[855,540,139,150],[1028,540,139,150]];
  let hpIndex=0;const hearts=[];
  for(const m of livingPortraits(S)){
   const p=portrait(S,m),role=KM.PartyAbilities.role(m);
   const src=crops[role==='priest'?1:role==='darkWizard'?2:role==='firestarter'?3:0];
   const a=m.act,k=a?clamp(a.t/a.dur):0,acting=a?.name==='attack'||a?.name==='bless';
   const lift=acting&&!reduced()?-10*Math.sin(k*Math.PI):0;
   ctx.save();ctx.translate(p.x,p.y+lift);
   ctx.drawImage(im,...src,-p.w/2,0,p.w,p.h);
   if(acting){ctx.strokeStyle='#ac5c24';ctx.lineWidth=4;ctx.strokeRect(-p.w/2-4,-4,p.w+8,p.h+8);}
   if(a?.name==='hurt'&&k<.6){ctx.strokeStyle='#9a3426';ctx.lineWidth=6;ctx.strokeRect(-p.w/2-2,-2,p.w+4,p.h+4);}
   ctx.restore();
   const foot=p.y+p.h;
   for(let i=0;i<2;i++){
    const full=hpIndex++<S.hp;hooks.heart((p.x-31+i*34)*KM_LAYOUT.k,(foot-35+lift)*KM_LAYOUT.k,20,full,'#b3321f');
    hearts.push({x:(p.x-31+i*34)*KM_LAYOUT.k,y:(foot-35+lift)*KM_LAYOUT.k});
   }
   hooks.occupy(m,p.x-p.w/2,p.y,p.w,p.h);
   hooks.say(m,p.x,p.y,{x:p.x,y:p.y+50});
  }
  for(let i=0;hearts.length&&i<KM.PartyAbilities.armour(S.party);i++){const p=hearts[i%hearts.length],stack=Math.floor(i/hearts.length);hooks.heart(p.x-stack*4,p.y-stack*4,20,true,'#b8b9b4');}
 }
 function draw(ctx,S,hooks){
  const enemies=S.actors.filter(a=>a.foe&&a.stop>=S.stop&&!a.dead).map(a=>({...actorPose(S,a),kind:'enemy',actor:a}));
  // Floor fire sits behind a falling companion, rather than hiding the death pose.
  const objects=enemies.concat(KM.TombFalls.objects(S),KM.TombMemorials.objects(S));
  if(KM.FireFx.active())objects.push({kind:'fire',z:440});
  KM.TombDepth.draw(ctx,S.camX,objects,p=>{
   if(p.kind==='body')KM.TombFalls.draw(ctx,p);
   else if(p.kind==='memorial')KM.TombMemorials.draw(ctx,p);
   else if(p.kind==='fire'){ctx.filter='none';KM.FireFx.draw(ctx);}
   else drawEnemy(ctx,S,p.actor,hooks);
  });
  portraits(ctx,S,hooks);
 }
 return {requested,active,route,preload,portrait,livingPortraits,partyPose,actorPose,beginFall,revive,draw};
})();
