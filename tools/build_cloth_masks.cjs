// Material IDs for the existing rigid attachments, rendered with their exact walk transforms.
// White = cloth, black = occluding skin/equipment. Does not alter source art or animation.
const fs=require('fs'),path=require('path'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..'),out=process.env.OUTPUT_DIR||path.join(root,'assets/villager-start/materials');
const runtime=require(root+'/assets/villager-start/v20/runtime.js'),r=JSON.parse(fs.readFileSync(root+'/assets/villager-start/v21/rig.json'));
function polygon(x,pts){x.beginPath();pts.forEach((p,i)=>x[i?'lineTo':'moveTo'](...p));x.closePath();x.fill();}
function material(im,n){const c=createCanvas(im.width,im.height),x=c.getContext('2d');x.drawImage(im,0,0);x.globalCompositeOperation='source-in';x.fillStyle='#000';x.fillRect(0,0,c.width,c.height);
 x.globalCompositeOperation='source-atop';x.fillStyle='#fff';if(['body','frontJoint','frontUpper','backJoint','backUpper'].includes(n))x.fillRect(0,0,c.width,c.height);
 if(n==='frontFore')x.fillRect(0,0,c.width,865);if(n==='backFore')x.fillRect(0,0,c.width,940);
 if(n==='body'){x.fillStyle='#000';polygon(x,[[632,554],[766,586],[752,672],[706,689],[673,641]]);}
 return c;}
(async()=>{fs.mkdirSync(out,{recursive:true});const parts={};for(const[n,f]of Object.entries(r.parts))parts[n]=material(await loadImage(root+'/assets/villager-start/v20/'+f),n);parts.head=material(await loadImage(root+'/assets/villager-start/v22/parts/head.png'),'head');
 for(const id of ['villager','villager_sword']){const p={...parts};if(id==='villager')p.frontFore=material(await loadImage(root+'/assets/villager-start/v22/parts/frontFore.png'),'frontFore');else p.sword=material(await loadImage(root+'/assets/villager-start/v20/parts/sword.png'),'sword');
 const c=createCanvas(6144,768),x=c.getContext('2d');for(let i=0;i<8;i++){x.save();x.translate(i*768,0);runtime.render(x,p,r,i/8);x.restore();}fs.writeFileSync(out+'/'+id+'-cloth.png',c.toBuffer('image/png'));}
 console.log('Baked both cloth masks using unchanged 8-frame rig, size and pivots.');})();
