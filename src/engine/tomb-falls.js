// Drawn rear-view deaths: buckle, pitch forward, then stay on the tunnel floor.
window.KM=window.KM||{};
KM.TombFalls=(()=>{
 const image='assets/tomb/v42/forward-fall.png',duration=.78;
 const art={
  knight:{frames:[[71,31,234,313],[39,419,285,289],[21,790,310,275]],standHeight:313},
  priest:{frames:[[428,41,236,308],[414,419,280,288],[400,795,277,272]],standHeight:308},
  darkWizard:{frames:[[783,20,246,330],[763,393,298,322],[738,779,325,288]],standHeight:330},
  firestarter:{frames:[[1165,49,232,303],[1153,434,255,281],[1134,793,267,275]],standHeight:303}
 };
 const reduced=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const preload=()=>KM.Assets.loadImg(image);
 function begin(S,m,portraitX){
  const bodies=S.tombBodies||(S.tombBodies=[]);
  if(!bodies.some(b=>b.id===m.id)){
   const b={id:m.id,role:KM.PartyAbilities.role(m),start:S.t,camera:S.camX,offset:(portraitX-1200)*1.12};
   b.memorialId=KM.TombMemorials.remember(S,b);bodies.push(b);
  }
  return duration;
 }
 function revive(S,m){
  for(const b of S.tombBodies||[])if(b.id===m.id)KM.TombMemorials.forget(b.memorialId);
  S.tombBodies=(S.tombBodies||[]).filter(b=>b.id!==m.id);
 }
 function pose(S,b){
  const elapsed=Math.max(0,S.t-b.start),progress=reduced()?1:Math.min(1,elapsed/.48);
  const travel=progress*progress*(3-2*progress);
  // Close to the camera: the lower half stays below the scene edge throughout.
  const z=b.camera-210+120*travel-S.camX,p=KM.TombDepth.project(S.camX,z);
  const frame=reduced()?2:elapsed<.18?0:elapsed<.48?1:2;
  return {...p,kind:'body',body:b,frame,x:p.x+b.offset*p.scale,y:p.y+KM.TombDepth.cfg.floorY*p.scale};
 }
 function objects(S){return (S.tombBodies||[]).map(b=>pose(S,b)).filter(p=>p.z>-500&&p.z<KM.TombDepth.cfg.far);}
 function draw(ctx,p){
  const im=preload();if(!im._ok)return;
  const a=art[p.body.role]||art.knight,src=a.frames[p.frame],scale=530/a.standHeight*p.scale;
  const w=src[2]*scale,h=src[3]*scale;
  // Held drawings settle into the floor plane instead of remaining an upright billboard.
  // Keep the waist close/below the frame; the head leans toward the tunnel centre.
  const flat=[1,.86,.70][p.frame],y=p.y-(1-flat)*340*p.scale;
  const lean=Math.max(-.22,Math.min(.22,(p.x-1200)/Math.max(1,p.y-KM.TombDepth.cfg.eyeY)))*(1-flat)/.30;
  ctx.save();ctx.filter='brightness('+p.light+')';
  ctx.translate(p.x,y);ctx.transform(1,0,lean*flat,flat,0,0);
  ctx.drawImage(im,...src,-w/2,-h,w,h);
  ctx.restore();
 }
 return {preload,begin,revive,pose,objects,draw,duration};
})();
