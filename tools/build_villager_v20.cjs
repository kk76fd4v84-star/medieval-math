const fs=require('fs'),path=require('path');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'../assets/villager-start/v20'),runtime=require(root+'/runtime.js');
function mask(img,poly){const c=createCanvas(img.width,img.height),x=c.getContext('2d');x.beginPath();poly.forEach((p,i)=>x[i?'lineTo':'moveTo'](...p));x.closePath();x.clip();x.drawImage(img,0,0);return c;}
(async()=>{
 const raw=await loadImage(root+'/source.png'),img=createCanvas(raw.width,raw.height),ix=img.getContext('2d');ix.drawImage(raw,0,0);
 const pixels=ix.getImageData(0,0,raw.width,raw.height);for(let p=3;p<pixels.data.length;p+=4)pixels.data[p]=pixels.data[p]>=180?255:0;ix.putImageData(pixels,0,0);
 const polys={
 body:[[409,520],[579,500],[643,540],[691,608],[756,658],[760,724],[715,785],[674,841],[656,901],[675,977],[763,1038],[734,1057],[673,1064],[644,1103],[615,1100],[593,1171],[573,1160],[551,1214],[526,1173],[504,1180],[474,1146],[445,1156],[427,1125],[396,1135],[377,1101],[353,1113],[333,1090],[303,1112],[291,1082],[235,1101],[257,1045],[287,986],[327,913],[343,858],[381,808],[388,749],[407,694],[415,642]],
 head:[[580,280],[940,280],[940,605],[778,606],[735,645],[681,641],[629,609],[601,558],[580,500]],
 frontUpper:[[410,524],[510,528],[572,566],[539,627],[472,697],[385,748],[320,789],[251,782],[205,730],[219,678],[283,615],[350,567]],
 frontFore:[[213,700],[322,710],[334,763],[302,824],[285,873],[279,919],[284,965],[267,1003],[239,1031],[207,1021],[175,991],[139,957],[156,891],[178,839],[185,775]],
 backUpper:[[700,678],[764,694],[805,756],[845,835],[824,896],[768,906],[697,857],[660,798]],
 backFore:[[775,844],[834,837],[887,902],[960,955],[962,1079],[908,1105],[848,1076],[829,1023],[825,971],[785,925],[757,883]],
 thigh:[[628,1024],[713,1049],[784,1075],[829,1138],[819,1199],[768,1221],[715,1190],[668,1140],[610,1081]],
 shin:[[722,1165],[819,1167],[822,1227],[788,1296],[757,1364],[763,1403],[677,1403],[662,1359],[681,1309],[696,1255]],
 boot:[[647,1367],[772,1367],[777,1402],[850,1403],[953,1436],[969,1469],[634,1469]]
 };
 const parts={};for(const[n,p]of Object.entries(polys))parts[n]=mask(img,p);
 // Sleeve overlaps stay hidden by the tunic, like the approved companion rig.
 for(const n of ['frontUpper','frontFore','backUpper','backFore']){const x=parts[n].getContext('2d');x.globalCompositeOperation='destination-out';x.drawImage(parts.body,0,0);x.globalCompositeOperation='source-over';}
 for(const[n,x,y,rad]of [['frontJoint',446,598,35],['backJoint',733,736,24],['neckJoint',672,612,25]]){const c=createCanvas(img.width,img.height),cx=c.getContext('2d');cx.beginPath();cx.arc(x,y,rad,0,Math.PI*2);cx.clip();cx.drawImage(img,0,0);parts[n]=c;}
 // Same v13 equations, 55% stance and on-screen step/lift as the approved hero.
 const r={id:'villager',format:'articulated-sidewalk-v3',hipSockets:[[38.12,12.71],[-38.12,-12.71]],upper:{frontShoulder:[446,598],frontElbow:[282,754],backShoulder:[733,736],backElbow:[801,868],neck:[672,612],wrist:[217,942],armSwing:.105},duration:1,stance:.55,scale:.51,baseline:1457,bindHip:[550,1055],hip:[550,1055],partHip:[650,1036],partKnee:[765,1176],partAnkle:[716,1381],ankleY:1381,step:240*.54/.51,lift:54*.54/.51,weightScale:1.5*.54/.51};
 r.thighLength=Math.hypot(r.partKnee[0]-r.partHip[0],r.partKnee[1]-r.partHip[1]);r.shinLength=Math.hypot(r.partAnkle[0]-r.partKnee[0],r.partAnkle[1]-r.partKnee[1]);
 r.parts={};for(const[n,c]of Object.entries(parts)){fs.writeFileSync(root+'/parts/'+n+'.png',c.toBuffer('image/png'));r.parts[n]='parts/'+n+'.png';}
 fs.writeFileSync(root+'/rig.json',JSON.stringify(r,null,2));
 const pack=root+'/approved-v13';
 const swordSource=await loadImage(pack+'/parts/hero-frontFore.png');
 const blade=mask(swordSource,[[263,641],[286,623],[321,635],[329,657],[403,684],[419,657],[443,628],[456,635],[444,664],[458,673],[726,759],[784,828],[694,816],[428,724],[408,748],[390,742],[400,715],[317,682],[277,672]]);
 const sword=createCanvas(img.width,img.height),sx=sword.getContext('2d');sx.translate(223,952);sx.scale(.84,.84);sx.drawImage(blade,-355,-675);fs.writeFileSync(root+'/parts/sword.png',sword.toBuffer('image/png'));
 const hr=JSON.parse(fs.readFileSync(pack+'/rigs/hero.json')),hp={};for(const[n,f]of Object.entries(hr.parts))hp[n]=await loadImage(pack+'/'+f);
 const emptyFore=createCanvas(hp.frontFore.width,hp.frontFore.height),fx=emptyFore.getContext('2d');fx.translate(432,500);fx.rotate(Math.atan2(155,-77)-Math.atan2(95,-35));fx.scale(Math.hypot(155,77)/Math.hypot(95,35),Math.hypot(155,77)/Math.hypot(95,35));fx.drawImage(await loadImage(pack+'/parts/scarf-frontFore.png'),-145,-375);hp.frontFore=emptyFore;delete hp.sword;
 const metadata={};
 for(const [id,images,rig]of [['villager',parts,r],['villager_sword',{...parts,sword},r],['villager_armour',hp,hr]]){
 const atlas=createCanvas(6144,768),a=atlas.getContext('2d'),preview=createCanvas(2048,768),p=preview.getContext('2d');p.fillStyle='#ead9b8';p.fillRect(0,0,2048,768);
 const frames=[];
 for(let i=0;i<8;i++){const frame=createCanvas(768,768);runtime.render(frame.getContext('2d'),images,rig,i/8);a.drawImage(frame,i*768,0);p.drawImage(frame,(i%4)*512,Math.floor(i/4)*384,384,384);const d=frame.getContext('2d').getImageData(0,0,768,768).data;let top=768,bottom=0;for(let y=0;y<768;y++)for(let x=0;x<768;x++)if(d[(y*768+x)*4+3]>180){top=Math.min(top,y);bottom=Math.max(bottom,y);}frames.push({x:i*768,y:0,w:768,h:768,ms:125,pivot:[384,680],top,bottom});}
 fs.writeFileSync(root+'/'+id+'-walk.png',atlas.toBuffer('image/png'));fs.writeFileSync(root+'/'+id+'-poses.png',preview.toBuffer('image/png'));metadata[id]={frames,rootMotionSpeed:rig.step/rig.stance*rig.scale/rig.duration};
 }
 fs.writeFileSync(root+'/frames.json',JSON.stringify(metadata,null,2));
 console.log(JSON.stringify({source:[img.width,img.height],rig:r,atlas:[6144,768]}));
})();
