const fs=require('fs'),path=require('path'),assert=require('assert/strict');const {createCanvas,loadImage}=require('@napi-rs/canvas');
const game=path.resolve(__dirname,'..'),stage=game,old=game+'/assets/villager-start/v20',out=stage+'/assets/villager-start/v22',runtime=require(old+'/runtime.js');
const r=JSON.parse(fs.readFileSync(game+'/assets/villager-start/v21/rig.json'));
function canvas(w,h){return createCanvas(w,h)}
function masked(im,polys,w=1037,h=1517){const c=canvas(w,h),x=c.getContext('2d');x.beginPath();for(const poly of polys){poly.forEach(([a,b],i)=>x[i?'lineTo':'moveTo'](a,b));x.closePath()}x.clip();x.drawImage(im,0,0,w,h);return c;}
function harden(c){const x=c.getContext('2d'),d=x.getImageData(0,0,c.width,c.height);for(let i=3;i<d.data.length;i+=4)d.data[i]=d.data[i]>=180?255:0;x.putImageData(d,0,0);return c;}
(async()=>{
 fs.mkdirSync(out+'/parts',{recursive:true});
 const gen=await loadImage(out+'/source.png'),source=canvas(1037,1517);source.getContext('2d').drawImage(gen,0,0,1037,1517);harden(source);
 const head=masked(source,[[[580,280],[940,280],[940,605],[778,606],[735,645],[681,641],[629,609],[601,558],[580,500]]]);
 const fore=masked(source,[[[213,700],[322,710],[334,763],[302,824],[285,873],[279,919],[258,944],[274,951],[345,983],[456,1034],[536,1070],[621,1110],[645,1130],[645,1149],[626,1159],[570,1130],[459,1075],[353,1031],[248,994],[231,1009],[182,999],[150,982],[128,948],[132,919],[155,903],[167,887],[178,839],[185,775]]]);
 // Keep the approved upper sleeve cutout; replace only the gripping hand and its attached stick.
 const existing=await loadImage(old+'/parts/frontFore.png'),front=canvas(1037,1517),fx=front.getContext('2d');fx.save();fx.beginPath();fx.rect(0,0,1037,869);fx.clip();fx.drawImage(existing,0,0);fx.restore();fx.save();fx.beginPath();fx.rect(0,869,1037,648);fx.clip();fx.drawImage(fore,0,0);fx.restore();
 const stick=masked(source,[[[130,906],[175,907],[176,958],[143,954],[128,940]],[[246,947],[274,951],[345,983],[456,1034],[536,1070],[621,1110],[645,1130],[645,1149],[626,1159],[570,1130],[459,1075],[353,1031],[244,994]]]);
 for(const[n,img]of Object.entries({head,frontFore:front,stick}))fs.writeFileSync(out+'/parts/'+n+'.png',img.toBuffer('image/png'));
 const parts={};for(const[n,f]of Object.entries(r.parts))parts[n]=await loadImage(old+'/'+f);parts.head=head;
 const sword=await loadImage(old+'/parts/sword.png');
 const hr=JSON.parse(fs.readFileSync(old+'/approved-v13/rigs/hero.json')),hp={};for(const[n,f]of Object.entries(hr.parts))hp[n]=await loadImage(old+'/approved-v13/'+f);
 const empty=canvas(hp.frontFore.width,hp.frontFore.height),ex=empty.getContext('2d');ex.translate(432,500);ex.rotate(Math.atan2(155,-77)-Math.atan2(95,-35));ex.scale(Math.hypot(155,77)/Math.hypot(95,35),Math.hypot(155,77)/Math.hypot(95,35));ex.drawImage(await loadImage(old+'/approved-v13/parts/scarf-frontFore.png'),-145,-375);hp.frontFore=empty;
 const armStick=canvas(hp.frontFore.width,hp.frontFore.height),ax=armStick.getContext('2d');ax.translate(...hr.upper.wrist);ax.scale(1/.84,1/.84);ax.drawImage(stick,-217,-942);hp.sword=armStick;
 const data={};for(const[id,images,rig]of [['villager',{...parts,frontFore:front},r],['villager_sword',{...parts,sword},r],['villager_armour',hp,hr]]){
  const atlas=canvas(6144,768),a=atlas.getContext('2d'),preview=canvas(1536,768),p=preview.getContext('2d');p.fillStyle='#e4ccb4';p.fillRect(0,0,1536,768);const frames=[];
  for(let i=0;i<8;i++){const f=canvas(768,768),c=f.getContext('2d');runtime.render(c,images,rig,i/8);a.drawImage(f,i*768,0);p.drawImage(f,i%4*384,Math.floor(i/4)*384,384,384);const px=c.getImageData(0,0,768,768).data;let top=768,bottom=0;for(let y=0;y<768;y++)for(let x=0;x<768;x++)if(px[(y*768+x)*4+3]>180){top=Math.min(top,y);bottom=Math.max(bottom,y);assert(x>0&&x<767&&y>0&&y<767,'frame clipped')};frames.push({x:i*768,y:0,w:768,h:768,ms:125,pivot:[384,680],top,bottom});}
  fs.writeFileSync(out+'/'+id+'-walk.png',atlas.toBuffer('image/png'));fs.writeFileSync(out+'/'+id+'-poses.png',preview.toBuffer('image/png'));data[id]={frames,rootMotionSpeed:rig.step/rig.stance*rig.scale/rig.duration,idleFrame:frames[0],image:'assets/villager-start/v22/'+id+'-walk.png',idleImage:'assets/villager-start/v22/'+id+'-walk.png'};
 }
 fs.writeFileSync(out+'/frames.json',JSON.stringify(data,null,2));fs.writeFileSync(out+'/rig.json',JSON.stringify(r,null,2));
 let cfg=fs.readFileSync(stage+'/src/config/villager-art.js','utf8');cfg=cfg.replace(/const outfits=.*;\n for\(/,'const outfits='+JSON.stringify(data)+';\n for(');fs.writeFileSync(stage+'/src/config/villager-art.js',cfg);
 const wi=await loadImage(stage+'/assets/wizard-riddles/v22/source.png'),wc=canvas(1536,1024);wc.getContext('2d').drawImage(wi,0,0,1536,1024);harden(wc);fs.writeFileSync(stage+'/assets/wizard-riddles/v22/wizard.png',wc.toBuffer('image/png'));
 console.log('Built same eight-frame walk, cap/hand attachment, armour stick; original body/legs unchanged. Cleaned wizard alpha.');
})();
