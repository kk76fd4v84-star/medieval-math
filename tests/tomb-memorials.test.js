const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.URL||'http://localhost:8860',out=process.env.OUTPUT_DIR||'/private/tmp/tomb-memorials-qa';
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--mute-audio']});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto(base+'/?debug&biome=tomb&preview=tomb&mode=fellowship&v=tunnel-43');
  await page.waitForSelector('#kmLoader',{state:'detached',timeout:60000});
  await page.waitForFunction(()=>__km.S.enc?.phase==='math',null,{timeout:20000});
  const before=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>k!==KM.TombMemorials.key&&k!=='knightMath.musicSilence')));
  await page.evaluate(()=>__km.S.party.forEach(m=>m.armor=0));
  await page.keyboard.type(String((await page.evaluate(()=>__km.answer()))+1));await page.keyboard.press('Enter');
  await page.waitForFunction(()=>__km.S.tombBodies.length>0);
  await page.evaluate(()=>__km.S.speedMul=0);
  const death=await page.evaluate(()=>{const S=__km.S;return {record:KM.TombMemorials.read()[0],body:S.tombBodies[0],current:S.tombMemorials.length};});
  assert.equal(death.current,0,'fresh body must not also draw a skeleton this run');
  assert.equal(death.record.world,death.body.camera-90);
  for(const [name,t]of [['buckle',.08],['pitch',.3],['landed',.7]]){
   await page.evaluate(t=>{const S=__km.S;S.t=S.tombBodies[0].start+t;},t);
   await page.waitForTimeout(90);await page.screenshot({path:out+'/close-'+name+'.png'});
  }
  const pose=await page.evaluate(()=>{const S=__km.S;return KM.TombFalls.pose(S,S.tombBodies[0]);});
  assert.equal(pose.z,-90);assert(pose.scale>1);assert(pose.y>990,'feet must be below the art viewport');
  await page.evaluate(()=>__km.startTomb());
  assert.equal(await page.evaluate(()=>__km.S.tombBodies.length),0);
  assert.equal(await page.evaluate(()=>__km.S.tombMemorials.length),1);
  await page.evaluate(()=>{const S=__km.S;S.speedMul=0;S.camX=S.tombMemorials[0].world-650;});
  await page.waitForTimeout(100);await page.screenshot({path:out+'/next-run-skeleton.png'});
  await page.reload();await page.waitForSelector('#kmLoader',{state:'detached',timeout:60000});
  assert.equal(await page.evaluate(()=>__km.S.tombMemorials.length),1,'reload must preserve the memorial');
  await page.evaluate(()=>__km.S.speedMul=0);
  const second=await page.evaluate(()=>{
   const S=__km.S,m=S.party[1];S.camX=S.tombMemorials[0].deathWorld+90;
   m.dying={t:0};KM.Tomb.beginFall(S,m);const first=KM.TombMemorials.read().length;
   KM.Tomb.beginFall(S,m);const duplicate=KM.TombMemorials.read().length;
   KM.Tomb.revive(S,m);delete m.dying;
   return {first,duplicate,afterRevive:KM.TombMemorials.read().length};
  });
  assert.deepEqual(second,{first:2,duplicate:2,afterRevive:1});
  const after=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>k!==KM.TombMemorials.key&&k!=='knightMath.musicSilence')));
  assert.deepEqual(after,before,'tomb markers must not change campaign saves/profile/scores');
  assert.deepEqual(errors,[]);
  fs.writeFileSync(out+'/results.json',JSON.stringify({death,pose,second,errors},null,2));
  console.log('PASS: real casualty saved once; large close fall clipped below waist; skeleton next run and reload; no live-run double; revival removes only current marker; campaign data unchanged.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
