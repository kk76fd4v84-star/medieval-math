// Complete scenery silhouettes on continuous hills. No opacity fades or chopped tile props.
window.KM = window.KM || {};
KM.ModularScenery = (()=>{
 const sizes={"copse": {"width": 421, "height": 290}, "tree": {"width": 459, "height": 435}, "dead-tree": {"width": 396, "height": 452}, "rocks": {"width": 394, "height": 205}, "cliff": {"width": 577, "height": 277}, "bush": {"width": 361, "height": 198}, "castle": {"width": 639, "height": 395}, "village": {"width": 691, "height": 289}, "church": {"width": 628, "height": 428}, "field": {"width": 680, "height": 311}, "hills": {"width": 2172, "height": 724}}, root='assets/modular-world/';
 const img=name=>KM.Assets.loadImg(root+name+'.png');
 function preload(){Object.keys(sizes).forEach(img);img('hills-mirror');img('hill-dragon');['forest','meadow','rocky','tundra'].forEach(b=>img('ground-'+b));}
 function paint(ctx,name,x,feet){const im=img(name),sz=sizes[name],g=KM_LAYOUT.art;if(!im._ok)return;
   KM.Scenery.drawInked(ctx,im,x,feet-sz.height*g,sz.width*g,sz.height*g);}
 function hills(ctx,cam,speed,bottom){const g=KM_LAYOUT.art,w=2172*g,offset=cam*speed,first=Math.floor(offset/w);
   for(let i=first;i*w-offset<KM_LAYOUT.viewW;i++){
     const im=img(i%2?'hills-mirror':'hills');if(im._ok)KM.Scenery.drawInked(ctx,im,i*w-offset,bottom-724*g,w+1/KM_LAYOUT.k,724*g);
   }
 }
 const palettes={'fields':['field','bush','copse'],'village':['village','church','bush'],'near-forest':['tree','copse','tree','dead-tree'],'barren-rocks':['rocks','dead-tree','rocks'],'canyon':['cliff','rocks','cliff']};
 function draw(ctx,cam,t,hooks){
   const g=KM_LAYOUT.art,vw=KM_LAYOUT.viewW;
   hills(ctx,cam,.08,790);
   hills(ctx,cam,.3,1030);
   const castleX=1150-cam*.08;
   if(castleX>-sizes.castle.width*g&&castleX<vw)paint(ctx,'castle',castleX,660);
   // Sparse complete copses on the far hill. All objects may scroll out of the
   // viewport naturally; their source silhouettes never end at a tile boundary.
   const spacing=1700,off=cam*.08;
   for(let i=Math.floor(off/spacing)-1;i*spacing-off<vw;i++)if(i%3!==0)paint(ctx,'copse',i*spacing-off+170,740);
   const step=940,midOff=cam*.3,first=Math.floor(midOff/step)-1;
   for(let i=first;i*step-midOff<vw;i++){
     const x=i*step-midOff+100,biome=KM.Scenery.midBiomeAt(x+300,cam),pool=palettes[biome]||palettes.fields;
     const name=pool[((i%pool.length)+pool.length)%pool.length];paint(ctx,name,x,900+(i%2?15:0));
   }
   // Frank's creature remains a whole landmark; ordinary hills never use its
   // old full-width rectangular terrain tile.
   const sw=hooks&&hooks.swaps&&hooks.swaps.mid;
   if(sw&&sw.on&&window.KM_ART19){
     const im=img('hill-dragon'),x=sw.at-cam*.3+1440*g,y=KM_DATA.scenery.mid.bottom-(724-325)*g;
     paint(ctx,'rocks',x-35,y+145*g+38);
     if(im._ok)KM.Scenery.drawInked(ctx,im,x,y,320*g,145*g);
   }
 }
 return {preload,draw};
})();
