// Browser routing and real MP3 decode, without producing audio.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const base=process.env.URL||'http://localhost:8860';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--mute-audio']});
 try{
  const context=await browser.newContext();
  await context.addInitScript(()=>{
   // Test the explicit opt-in button with silent media doubles, never actual play().
   const playing=new WeakSet();
   Object.defineProperty(HTMLMediaElement.prototype,'paused',{get(){return !playing.has(this);}});
   HTMLMediaElement.prototype.play=function(){playing.add(this);return Promise.resolve();};
   HTMLMediaElement.prototype.pause=function(){playing.delete(this);};
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  async function open(query){
   await page.goto(base+'/'+query);await page.waitForSelector('#kmLoader',{state:'detached',timeout:60000});
   assert(await page.evaluate(()=>KM.Music.state().muted),'new page stays muted');
  }
  async function category(cat){await page.waitForFunction(c=>__km.music().cat===c,cat,{timeout:15000});}
  async function jump(id){
   assert(await page.evaluate(id=>{
    const st=__km.debugJump(id,[1,2,3]);if(!st)return false;
    __km.S.camX=st.stopX-KM_DATA.world.engageScreenX;__km.S.speedMul=1;return true;
   },id));
  }
  await open('?debug&biome=tomb&preview=tomb&mode=fellowship');
  await page.evaluate(()=>__km.S.speedMul=0);await category('tomb');
  const decoded=await page.evaluate(async()=>{
   const d=KM_DATA.music,ac=new OfflineAudioContext(2,1,48000),result=[];
   for(const key of ['graveyard','tomb','tomb_battle','tomb_boss'])for(const file of d.categories[key].tracks){
    const res=await fetch(d.root+file);if(!res.ok)throw Error(file+': '+res.status);
    const b=await ac.decodeAudioData(await res.arrayBuffer());result.push({file,duration:b.duration,channels:b.numberOfChannels});
   }
   return result; // Offline context never connects to audio hardware.
  });
  assert.equal(decoded.length,6);assert(decoded.every(d=>d.duration>120&&d.channels===2));
  await page.click('[data-act="toggleMusic"]');assert(await page.evaluate(()=>__km.music().playing));
  await page.evaluate(()=>__km.S.speedMul=1);await category('tomb_battle');
  await jump('tomb_warden');await category('tomb_boss');
  await page.evaluate(()=>__km.tombEnd(true));await category('tomb');
  await page.evaluate(()=>__km.tombEnd(false));await category(null);
  await page.waitForFunction(()=>Object.values(KM.Music.channels).every(c=>c.el.paused));
  await page.click('[data-act="tombRestart"]');await category('tomb');
  await page.click('[data-act="toggleMusic"]');assert(await page.evaluate(()=>Object.values(KM.Music.channels).every(c=>c.el.paused)));
  await jump('tomb_warden');await category('tomb_boss');assert(await page.evaluate(()=>__km.music().muted));
  await open('?debug&biome=hollowwood&preview=hollowwood&mode=fellowship');
  await jump('riddle');await category('graveyard');
  await jump('grave_spider');await category('battle');
  await jump('tavern');await page.waitForFunction(()=>__km.phase()==='tavernOut');await category('graveyard');
  await page.click('[data-act="goInside"]');await category('tavern');
  await page.click('[data-act="leaveInside"]');await category('graveyard');
  // Actual chapter entry hook; then a fresh village must reset the music context.
  await open('?debug&mode=fellowship');
  await page.evaluate(()=>{__km.S.chapter='village';__km.chapterGate();__km.enterWood();});
  await category('graveyard');assert.equal(await page.evaluate(()=>__km.music().chapter),'hollowwood');
  await open('?debug&mode=fellowship');await category('world');
  await page.click('#newGameBtn');assert.equal(await page.evaluate(()=>__km.music().chapter),'village');await category('world');
  assert.deepEqual(errors,[]);console.log('PASS browser: all six MP3s decode, tomb walk/battle/boss/end/replay, graveyard battle/tavern/entry, village reset, mute survives transitions. Silent media doubles.');
  console.log(JSON.stringify(decoded));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
