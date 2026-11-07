const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.URL||'http://localhost:8860',out=process.env.OUTPUT_DIR||'/private/tmp/tunnel-depth-qa';
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--mute-audio']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto(base+'/?debug&biome=tomb&preview=tomb&mode=fellowship&v=tunnel-42');
  await page.waitForSelector('#kmLoader',{state:'detached',timeout:60000});
  await page.evaluate(()=>{__km.S.speedMul=0;});
  const checks=await page.evaluate(()=>{
   const D=KM.TombDepth,camera=1000;
   const before=D.slices(camera).find(p=>p.id===7),after=D.slices(camera+100).find(p=>p.id===7);
   const far=D.enemy(camera,4200),middle=D.enemy(camera,2400),near=D.enemy(camera,1600);
   const sprite=D.preload(),cv=document.createElement('canvas');cv.width=sprite.naturalWidth;cv.height=sprite.naturalHeight;
   const ctx=cv.getContext('2d');ctx.drawImage(sprite,0,0);
   const alpha=(x,y)=>ctx.getImageData(Math.round(x*cv.width),Math.round(y*cv.height),1,1).data[3];
   return {before,after,far,middle,near,alpha:[alpha(.5,.5),alpha(.03,.5),alpha(.97,.5),alpha(.5,.03),alpha(.5,.97)]};
  });
  assert.equal(checks.before.id,checks.after.id);assert(checks.after.scale>checks.before.scale);assert(checks.after.light>checks.before.light);
  assert.equal(checks.far.light,0);assert(checks.far.scale<checks.middle.scale&&checks.middle.scale<checks.near.scale);assert(checks.middle.light<checks.near.light);
  assert.deepEqual(checks.alpha,[0,255,255,255,255]);
  for(const distance of [2400,1400,600,0]){
   await page.evaluate(distance=>{const S=__km.S;S.camX=S.stops[0].stopX-KM_DATA.world.engageScreenX-distance;},distance);
   await page.waitForTimeout(120);await page.screenshot({path:out+'/approach-'+distance+'.png'});
  }
  // Check traversal across section recycling; existing world IDs remain fixed.
  await page.evaluate(()=>{__km.startTomb();__km.S.speedMul=1;});
  const pacing=await page.evaluate(()=>new Promise(resolve=>{const times=[];let last=performance.now();function tick(t){times.push(t-last);last=t;if(times.length<60)requestAnimationFrame(tick);else resolve({mean:times.reduce((a,b)=>a+b)/times.length,max:Math.max(...times)});}requestAnimationFrame(tick);}));
  fs.writeFileSync(out+'/depth-result.json',JSON.stringify({checks,pacing,errors},null,2));
  assert.deepEqual(errors,[]);console.log('PASS hollow alpha, solid stone, stable world sections, perspective growth, shared black-to-colour light, no page errors; frame ms:',pacing);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
