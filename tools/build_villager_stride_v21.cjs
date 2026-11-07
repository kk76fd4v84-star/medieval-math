// Re-bake existing rigid cutouts; no artwork changes. Usage: node tools/build_villager_stride_v21.cjs [game-root] [output-dir]
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const game=process.argv[2]||path.resolve(__dirname,'..'),source=path.join(game,'assets/villager-start/v20'),out=process.argv[3]||path.join(game,'assets/villager-start/v21');
const runtime=require(source+'/runtime.js'),r=JSON.parse(fs.readFileSync(source+'/rig.json'));
r.step*=1.3; // At fixed road speed this gives 1/1.3 playback cadence: 23% fewer footfalls.
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const parts={};for(const[n,f]of Object.entries(r.parts))parts[n]=await loadImage(source+'/'+f);
 const sword=await loadImage(source+'/parts/sword.png');
 for(let i=0;i<=1000;i++){const p=runtime.pose(r,i/1000);for(const l of p.legs){
  assert(Math.abs(Math.hypot(l.knee[0]-l.hip[0],l.knee[1]-l.hip[1])-r.thighLength)<1e-6);
  assert(Math.abs(Math.hypot(l.ankle[0]-l.knee[0],l.ankle[1]-l.knee[1])-r.shinLength)<1e-6);
  if(l.foot.planted){assert.equal(l.foot.rotation,0);assert.equal(l.ankle[1],r.ankleY);}
 }}
 assert.deepEqual(runtime.pose(r,0),runtime.pose(r,1));
 const data={};
 for(const[id,images]of [['villager',parts],['villager_sword',{...parts,sword}]]){
  const atlas=createCanvas(6144,768),a=atlas.getContext('2d'),preview=createCanvas(1536,768),p=preview.getContext('2d');p.fillStyle='#ead9b8';p.fillRect(0,0,1536,768);const frames=[];
  for(let i=0;i<8;i++){
   const f=createCanvas(768,768),c=f.getContext('2d');runtime.render(c,images,r,i/8);a.drawImage(f,i*768,0);p.drawImage(f,i%4*384,Math.floor(i/4)*384,384,384);
   const px=c.getImageData(0,0,768,768).data;let top=768,bottom=0;for(let y=0;y<768;y++)for(let x=0;x<768;x++)if(px[(y*768+x)*4+3]>180){top=Math.min(top,y);bottom=Math.max(bottom,y);assert(x>0&&x<767&&y>0&&y<767,'frame clips');}
   frames.push({x:i*768,y:0,w:768,h:768,ms:125,pivot:[384,680],top,bottom});
  }
  fs.writeFileSync(out+'/'+id+'-walk.png',atlas.toBuffer('image/png'));fs.writeFileSync(out+'/'+id+'-poses.png',preview.toBuffer('image/png'));
  data[id]={frames,rootMotionSpeed:r.step/r.stance*r.scale/r.duration};
 }
 fs.writeFileSync(out+'/frames.json',JSON.stringify(data,null,2));fs.writeFileSync(out+'/rig.json',JSON.stringify(r,null,2));
 console.log('PASS: 30% longer stride; reachable fixed-length limbs, flat planted feet, seamless loop and unclipped eight-frame atlases.');
})();
