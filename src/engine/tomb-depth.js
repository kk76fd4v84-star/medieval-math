// Hollow illustrated sections, projected from fixed world positions. No room-zoom loop.
window.KM=window.KM||{};
KM.TombDepth=(()=>{
 const images=['assets/tomb/v41/tunnel-slice.png','assets/tomb/v42/burial.png','assets/tomb/v42/roots.png'];
 const cfg=Object.freeze({focal:800,spacing:340,far:6200,width:4400,eyeY:330,floorY:850,enemyNear:600,lightNear:500,lightFar:2800});
 const clamp=n=>Math.max(0,Math.min(1,n));
 const curve=z=>460*Math.sin(z/1600)+105*Math.sin(z/710);
 const rise=z=>24*Math.sin(z/1500);
 // Fixed runs of stone, niches and root-cracked masonry. Never random per frame.
 const sectionTypes=[0,0,0,1,1,0,0,2,2,2,0,1,1,0,0,2];
 const variant=id=>sectionTypes[((id%sectionTypes.length)+sectionTypes.length)%sectionTypes.length];
 function light(z){const t=clamp((cfg.lightFar-z)/(cfg.lightFar-cfg.lightNear));return t*t*(3-2*t);}
 function project(camera,z){
  const scale=cfg.focal/(cfg.focal+Math.max(-500,z));
  return {z,scale,x:1200+(curve(camera+z)-curve(camera))*scale,
   y:cfg.eyeY+(rise(camera+z)-rise(camera))*scale,light:light(z)};
 }
 function slices(camera){
  const result=[],first=Math.ceil(camera/cfg.spacing);
  for(let id=first;id*cfg.spacing-camera<=cfg.far;id++){
   const p=project(camera,id*cfg.spacing-camera);result.push({...p,id,variant:variant(id),kind:'wall'});
  }
  return result;
 }
 function enemy(camera,world,offset=0){
  const p=project(camera,Math.max(cfg.enemyNear,world-camera));
  const scale=p.scale*(cfg.focal+cfg.enemyNear)/cfg.focal;
  return {...p,x:p.x+offset*scale,y:p.y+cfg.floorY*p.scale,scale};
 }
 function preload(){return KM.Assets.loadImg(images[0]);}
 function preloadAll(){return images.map(path=>KM.Assets.loadImg(path));}
 function draw(ctx,camera,objects,drawObject){
  const art=preloadAll();
  ctx.save();ctx.beginPath();ctx.rect(0,0,2400,990);ctx.clip();
  ctx.fillStyle='#000';ctx.fillRect(0,0,2400,990);
  const layers=slices(camera).concat(objects).sort((a,b)=>b.z-a.z);
  for(const p of layers){
   if(p.kind!=='wall'){ctx.save();drawObject(p);ctx.restore();continue;}
   const im=art[p.variant];
   if(!im._ok)continue;
   const w=cfg.width*p.scale,h=w*im.naturalHeight/im.naturalWidth;
   // Brightness changes RGB, not alpha: nearer walls always occlude deeper art.
   ctx.filter='brightness('+p.light+')';
   ctx.drawImage(im,p.x-w/2,p.y-h/2,w,h);
  }
  ctx.restore();
 }
 return {cfg,light,project,slices,enemy,preload,preloadAll,variant,draw};
})();
