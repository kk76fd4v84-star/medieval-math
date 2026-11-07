// Tomb-only local history, separate from campaign saves, scores and road graves.
window.KM=window.KM||{};
KM.TombMemorials=(()=>{
 const key='knightMath.tomb.memorials.v1',image='assets/tomb/v43/fallen-skeleton.png';
 const valid=m=>m&&typeof m.id==='string'&&typeof m.runId==='string'&&Number.isFinite(m.world)&&Number.isFinite(m.offset);
 function read(){
  try{const data=JSON.parse(localStorage.getItem(key));return data?.version===1&&Array.isArray(data.markers)?data.markers.filter(valid):[];}catch(_){return [];}
 }
 function write(markers){try{localStorage.setItem(key,JSON.stringify({version:1,markers}));}catch(_){/* Private/storage-limited browsing still permits the current run. */}}
 function remember(S,b){
  const id=S.runId+':'+b.id,markers=read();
  if(markers.some(m=>m.id===id))return id;
  const world=b.camera-90;
  const nearby=markers.filter(m=>Math.abs(m.deathWorld-world)<180&&Math.abs(m.deathOffset-b.offset)<180).length;
  // Keep the same death area, but let repeated losses form a small scatter of bones.
  const offsets=[0,-130,130,-240,240],depths=[0,75,-60,140,-110];
  markers.push({id,runId:S.runId,world:world+depths[nearby%depths.length],offset:b.offset+offsets[nearby%offsets.length],deathWorld:world,deathOffset:b.offset});
  write(markers);return id;
 }
 function forget(id){if(id)write(read().filter(m=>m.id!==id));}
 function reset(S){S.tombMemorials=read().filter(m=>m.runId!==S.runId);}
 const preload=()=>KM.Assets.loadImg(image);
 function objects(S){
  return (S.tombMemorials||[]).map(m=>{
   const z=m.world-S.camX,p=KM.TombDepth.project(S.camX,z);
   return {...p,kind:'memorial',x:p.x+m.offset*p.scale,y:p.y+KM.TombDepth.cfg.floorY*p.scale};
  }).filter(p=>p.z>-500&&p.z<KM.TombDepth.cfg.far);
 }
 function draw(ctx,p){
  const im=preload();if(!im._ok)return;
  const h=540*p.scale,w=h*im.naturalWidth/im.naturalHeight;
  ctx.save();ctx.filter='brightness('+p.light+')';ctx.drawImage(im,p.x-w/2,p.y-h,w,h);ctx.restore();
 }
 return {key,read,remember,forget,reset,preload,objects,draw};
})();
