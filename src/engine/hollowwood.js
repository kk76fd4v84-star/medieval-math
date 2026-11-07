// A chapter-specific stage, using the existing opaque parchment compositor.
window.KM=window.KM||{};
KM.HollowWood=(()=>{
 const files=['graveyard','trees','abbey','thorn'];
 const root=()=>KM_DATA.hollowwood.assets;
 const requested=()=>new URLSearchParams(location.search).get('biome')==='hollowwood';
 const active=S=>S.chapter==='hollowwood';
 const unlock=()=>{try{localStorage.setItem('knightMath.hollowwoodUnlocked','1');}catch(_){}};
 const unlocked=()=>{try{return localStorage.getItem('knightMath.hollowwoodUnlocked')==='1';}catch(_){return false;}};
 function route(seed){
   const rng=KM.Progression.random(seed+':hollowwood');let battle=8;
   return KM_DATA.hollowwood.route.map((row,i)=>{
     const q={...row,group:row.group?.slice()};
     if(q.enemy){q.type=q.type||'math';q.walksIn=q.type!=='optional';q.battleNo=++battle;q.level='normal';q.gold=KM_DATA.combat.economy.purses[q.enemy]||0;}
     else q.battleNo=battle;
     // The first encounter and bosses stay authored; one late pack changes which undead leads.
     if(i===12&&rng()<.5)[q.enemy,q.group[0]]=[q.group[0],q.enemy];
     return {...q,src:'hollowwood:'+i,chapter:'hollowwood'};
   });
 }
 function preload(){return files.concat(['skeleton','zombie','spider','roots','abomination','bellwraith']).map(id=>KM.Assets.loadImg(root()+id+'.png'));}
 function tile(ctx,id,cam,{speed,y,width,pitch,offset=0,mirror=false}){
   const im=KM.Assets.loadImg(root()+id+'.png');if(!im._ok)return;
   const h=width*im.naturalHeight/im.naturalWidth;
   const from=Math.floor((cam*speed-offset-width)/pitch),to=Math.ceil((cam*speed-offset+KM_LAYOUT.viewW)/pitch);
   for(let i=from;i<=to;i++){
     const x=offset+i*pitch-cam*speed;
     // No change of variant on camera movement. Only translate complete cutouts.
     if(mirror&&i%2){ctx.save();ctx.translate(x+width,0);ctx.scale(-1,1);KM.Scenery.drawInked(ctx,im,0,y-h,width,h);ctx.restore();}
     else KM.Scenery.drawInked(ctx,im,x,y-h,width,h);
   }
 }
 function draw(ctx,cam,t,hooks={}){
   KM.Scenery.drawSky(ctx,cam,t,hooks.seed);
   const im=KM.Assets.loadImg(root()+'abbey.png');
   if(im._ok){const width=1900,h=width*im.naturalHeight/im.naturalWidth,x=950-cam*.045;
     KM.Scenery.drawInked(ctx,im,x,780-h,width,h);}
   // Distant trees, then spaced graves and near trees. Air between clumps is deliberate.
   tile(ctx,'trees',cam,{speed:.13,y:800,width:1050,pitch:2700,offset:1900});
   hooks.graveLane?.(0);
   tile(ctx,'graveyard',cam,{speed:.26,y:915,width:2250,pitch:2800,offset:200});
   tile(ctx,'trees',cam,{speed:.42,y:952,width:1500,pitch:3300,offset:2450});
   hooks.midLane?.();
 }
 function foreground(ctx,cam){tile(ctx,'thorn',cam,{speed:1,y:KM_DATA.world.groundY+26,width:1050,pitch:980,offset:0});}
 // The optional boss remains a slow-moving distant landmark until deliberately awakened.
 function pose(S,a){
   if(a.id!=='bell_beneath'||!a.distant)return null;
   const st=S.stops[a.stop],halt=st.stopX-KM_DATA.world.engageScreenX;
   return {x:1850+(halt-S.camX)*.14,y:780,scale:.42,filter:''};
 }
 return {requested,active,unlock,unlocked,route,preload,draw,foreground,pose};
})();
