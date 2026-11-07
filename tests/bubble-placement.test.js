const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..'),c={};c.window=c;vm.createContext(c);
for(const f of ['src/config/art_v11.js','src/engine/speech-bubbles.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);
const art={};for(const side of ['left','right']){const b=c.KM_ART11.bubbles[side];art[side]={w:b.size[0]*.6,h:b.size[1]*.6,body:b.body.map(v=>v*.6),flip:b.flip,im:{}};}
const B=c.KM.SpeechBubbles,overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
for(const x of [40,300,600,1000,1300,1560]){
 const r=B.place({mouth:{x,y:350},speakerX:x,width:1600,height:660,art});assert(r);assert.equal(r.side,x<800?'left':'right');assert.equal(r.x+r.w/2,800);assert.equal(r.w,art.left.w);assert.equal(r.h,art.left.h);
 const calls=[];B.drawFrame(new Proxy({},{get:(_,k)=>(...a)=>calls.push([k,...a])}),art[r.side],r);
 assert.equal(calls.filter(a=>a[0]==='drawImage').length,1);assert(!calls.some(a=>['transform','clip','rotate'].includes(a[0])));const scales=calls.filter(a=>a[0]==='scale');assert.equal(scales.length,x<800?0:1);if(scales.length)assert.deepEqual(scales[0],['scale',-1,1]);
}
const face={x:650,y:220,w:250,h:90},r=B.place({mouth:{x:300,y:390},speakerX:300,width:1600,height:660,art,heads:[face]});assert(r);assert(!overlap(r,face));assert.equal(r.x+r.w/2,800);
const all={x:0,y:0,w:1600,h:660};assert.equal(B.place({mouth:{x:300,y:400},speakerX:300,width:1600,height:660,art,heads:[all]}),null);
const l=B.place({mouth:{x:300,y:350},speakerX:300,width:1600,height:660,art,count:2});const rr=B.place({mouth:{x:1300,y:350},speakerX:1300,width:1600,height:660,art,count:2,avoid:[l]});assert(l&&rr);assert(!overlap(l,rr));
console.log('PASS: fixed-size centred bubbles, horizontal mirror only, one unwarped image draw, face clearance and paired separation.');
