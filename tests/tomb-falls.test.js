const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.URL||'http://localhost:8860',out=process.env.OUTPUT_DIR||'/private/tmp/tunnel-falls-qa';
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--mute-audio']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto(base+'/?debug&biome=tomb&preview=tomb&mode=fellowship&v=tunnel-43');
  await page.waitForSelector('#kmLoader',{state:'detached',timeout:60000});
  await page.waitForFunction(()=>__km.S.enc?.phase==='math',null,{timeout:20000});
  await page.evaluate(()=>__km.S.speedMul=0);
  const variants=await page.evaluate(()=>{
   const D=KM.TombDepth;
   return D.preloadAll().map(im=>{
    const cv=document.createElement('canvas');cv.width=im.naturalWidth;cv.height=im.naturalHeight;
    const c=cv.getContext('2d');c.drawImage(im,0,0);
    return [.5,.03,.97].map(x=>c.getImageData(Math.round(x*cv.width),Math.round(.5*cv.height),1,1).data[3]);
   });
  });
  assert.deepEqual(variants,[[0,255,255],[0,255,255],[0,255,255]]);
  assert.equal(await page.evaluate(()=>new Set(KM.TombDepth.slices(1000).map(s=>s.variant)).size),3);
  for(const distance of [0,500,1200,2100]){
   await page.evaluate(d=>{__km.S.camX=__km.S.stops[0].stopX-KM_DATA.world.engageScreenX-d;},distance);
   await page.waitForTimeout(90);await page.screenshot({path:out+'/bend-'+distance+'.png'});
  }
  await page.evaluate(()=>{const S=__km.S;S.camX=S.stops[0].stopX-KM_DATA.world.engageScreenX;S.party.forEach(m=>m.armor=0);S.speedMul=1;});
  await page.keyboard.type(String((await page.evaluate(()=>__km.answer()))+1));await page.keyboard.press('Enter');
  await page.waitForFunction(()=>__km.S.tombBodies.length>0,null,{timeout:10000});
  await page.evaluate(()=>__km.S.speedMul=0);
  const casualty=await page.evaluate(()=>{const S=__km.S,b=S.tombBodies[0];return {id:b.id,role:b.role,portraits:KM.Tomb.livingPortraits(S).map(m=>m.id)};});
  assert(!casualty.portraits.includes(casualty.id),'portrait must disappear at death onset');
  for(const [name,t]of [['buckle',.08],['pitch',.30],['landed',.65]]){
   await page.evaluate(t=>{const S=__km.S;S.t=S.tombBodies[0].start+t;},t);
   await page.waitForTimeout(90);await page.screenshot({path:out+'/fall-'+name+'.png'});
  }
  await page.evaluate(()=>__km.S.speedMul=4);
  await page.waitForFunction(id=>!__km.S.party.some(m=>m.id===id),casualty.id,{timeout:10000});
  await page.evaluate(()=>__km.S.speedMul=0);
  const floor=await page.evaluate(()=>{
   const S=__km.S,b=S.tombBodies[0],a=KM.TombFalls.pose(S,b);S.camX+=80;const c=KM.TombFalls.pose(S,b);
   const m={...S.enc.fallen.find(m=>m.id===b.id)};delete m.dying;delete m.eaten;
   KM.Tomb.revive(S,m);S.party.push(m);
   return {a,c,bodies:S.tombBodies.length,revived:KM.Tomb.livingPortraits(S).some(q=>q.id===m.id),slot:KM.Tomb.portrait(S,m).x};
  });
  assert.equal(floor.c.z,floor.a.z-80);assert(floor.c.scale>floor.a.scale);assert.equal(floor.bodies,0);assert(floor.revived);
  // Each test party outfit has its own three authored poses, then remains on the floor.
  await page.evaluate(()=>{
   __km.startTomb();const S=__km.S;S.speedMul=0;S.camX=S.stops[0].stopX-KM_DATA.world.engageScreenX;
   S.party.forEach(m=>{m.dying={t:0};KM.Tomb.beginFall(S,m);});S.t+=.7;
  });
  await page.waitForTimeout(100);await page.screenshot({path:out+'/four-floor-bodies.png'});
  assert.equal(await page.evaluate(()=>KM.Tomb.livingPortraits(__km.S).length),0);
  await page.emulateMedia({reducedMotion:'reduce'});
  assert(await page.evaluate(()=>{const S=__km.S;S.t=S.tombBodies[0].start;return KM.TombFalls.objects(S).every(p=>p.frame===2);}));
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>__km.startTomb());
  assert.equal(await page.evaluate(()=>__km.S.tombBodies.length),0);
  // Real failures all the way to the main player's death use the same floor-body path.
  let heroFall=false;
  for(let i=0;i<8;i++){
   await page.waitForFunction(()=>__km.S.enc?.phase==='math'||['dying','gameover'].includes(__km.S.mode),null,{timeout:20000});
   const mode=await page.evaluate(()=>__km.S.mode);if(['dying','gameover'].includes(mode))break;
   await page.evaluate(()=>{__km.S.party.forEach(m=>m.armor=0);__km.S.speedMul=1;});
   await page.keyboard.type(String((await page.evaluate(()=>__km.answer()))+1));await page.keyboard.press('Enter');
   await page.waitForFunction(()=>__km.S.enc?.phase!=='math',null,{timeout:3000});
   await page.evaluate(()=>__km.S.speedMul=5);
  }
  await page.waitForFunction(()=>__km.S.mode==='gameover',null,{timeout:15000});
  heroFall=await page.evaluate(()=>__km.S.tombBodies.some(b=>b.id==='hero'));
  assert(heroFall);await page.screenshot({path:out+'/hero-fall.png'});
  assert.deepEqual(errors,[]);
  fs.writeFileSync(out+'/results.json',JSON.stringify({variants,casualty,floor,heroFall,errors},null,2));
  console.log('PASS: varied opaque sections; real backfire removes portrait and plays forward fall; body stays in world; revival by ID; all four outfits; reduced motion; replay reset; real hero death.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
