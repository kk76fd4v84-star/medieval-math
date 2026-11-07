const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');
const base=process.env.URL||'http://localhost:8860',out=process.env.OUTPUT_DIR||require('node:os').tmpdir()+'/knight-tomb-qa';
(async()=>{fs.mkdirSync(out,{recursive:true});const b=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--mute-audio']});let p;try{
 const context=await b.newContext({viewport:{width:1440,height:900}});p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 const seeds={'knightMath.save.fellowship':'{"test":"preserve this run"}','knightMath.leaderboard':'{"test":"preserve scores"}','knightMath.profile':JSON.stringify({version:5,best:{leagues:6,name:'Save test'},deaths:[],companionGraves:[],music:{muted:true,volume:.2}})};
 await context.addInitScript(data=>{if(!sessionStorage.getItem('seeded')){for(const [k,v]of Object.entries(data))localStorage.setItem(k,v);sessionStorage.setItem('seeded','1');}},seeds);
 await p.goto(base+'/?debug&biome=tomb&preview=tomb&mode=fellowship');await p.waitForSelector('#kmLoader',{state:'detached',timeout:60000});
 await p.waitForFunction(()=>__km.S.enc?.phase==='math',null,{timeout:20000});
 await p.evaluate(()=>__km.S.speedMul=0);await p.screenshot({path:out+'/tomb-ready.png'});
 // Use actual keyboard submission; faster test clock only advances animations/walking between questions.
 let bossSeen=false,questions=0;
 for(let i=0;i<100;i++){
  const s=await p.evaluate(()=>({mode:__km.S.mode,phase:__km.S.enc?.phase,answer:__km.answer(),stop:__km.S.stop,q:__km.S.stats.correct,hp:__km.S.hp}));
  if(s.mode==='win')break;assert.notEqual(s.mode,'gameover','fast correct answers should clear test');
  if(s.phase==='math'){
   if(s.stop===2)bossSeen=true;
   const q=s.q;await p.evaluate(()=>{__km.S.speedMul=0;__km.S.enc.tmr.t=0;});await p.keyboard.type(String(s.answer));await p.keyboard.press('Enter');questions++;
   await p.evaluate(()=>__km.S.speedMul=1);
   if(questions===1){await p.waitForTimeout(680);await p.screenshot({path:out+'/tomb-volley.png'});}
   await p.evaluate(()=>__km.S.speedMul=5);
   await p.waitForFunction(old=>__km.S.mode==='win'||__km.S.mode==='gameover'||(__km.S.enc?.phase==='math'&&__km.S.enc.input==='')||__km.S.mode==='walk',q,{timeout:15000});
  }else{await p.evaluate(()=>__km.S.speedMul=5);await p.waitForTimeout(100);}
 }
 assert.equal(await p.evaluate(()=>__km.S.mode),'win');assert(bossSeen);assert(questions>3);await p.screenshot({path:out+'/tomb-clear.png'});
 for(const [k,v]of Object.entries(seeds))assert.deepEqual(JSON.parse(await p.evaluate(k=>localStorage.getItem(k),k)),JSON.parse(v),'preview changed '+k);
 await p.click('[data-act="tombRestart"]');assert.deepEqual(await p.evaluate(()=>[__km.S.party.length,__km.S.hp,__km.S.speedMul,__km.S.stop]),[4,8,1,0]);
 // A failure uses the existing fire/lightning backlash; portraits reflect casualties.
 await p.waitForFunction(()=>__km.S.enc?.phase==='math',null,{timeout:20000});
 await p.evaluate(()=>{__km.S.speedMul=0;__km.S.party.forEach(m=>m.armor=0);});
 await p.keyboard.type(String((await p.evaluate(()=>__km.answer()))+1));await p.keyboard.press('Enter');await p.evaluate(()=>__km.S.speedMul=4);
 await p.waitForFunction(()=>__km.S.party.length<4,null,{timeout:15000});await p.evaluate(()=>__km.S.speedMul=0);await p.screenshot({path:out+'/tomb-casualty.png'});
 assert(await p.evaluate(()=>__km.S.hp<8));
 await p.evaluate(()=>{KM.I18n.set('ja');__km.startTomb();});await p.waitForTimeout(100);await p.screenshot({path:out+'/tomb-japanese.png'});assert((await p.locator('#hud').innerText()).includes('墓所'));
 console.log('PASS tomb: '+questions+' real answers, all three encounters/boss, victory/replay, role backfire/casualty, Japanese, saved run/score/profile unchanged.');
 // Tavern: full party, solve to recruit, cancel once then choose replacement and fight outside.
 await p.goto(base+'/?debug&preview=tavern&mode=fellowship');await p.waitForSelector('#kmLoader',{state:'detached',timeout:60000});
 await p.evaluate(()=>{KM.I18n.set('en');__km.debugJump('tavern',[1,2,3]);const S=__km.S;S.camX=S.stops[S.stop].stopX-KM_DATA.world.engageScreenX;S.speedMul=1;});
 await p.waitForFunction(()=>__km.S.enc?.phase==='tavernOut');await p.click('[data-act="goInside"]');await p.waitForFunction(()=>__km.S.view?.id==='tavern-interior'&&__km.S.enc.phase==='rest');
 await p.locator('[data-act="selectTavern"]').nth(1).click();await p.click('[data-act="tvJoin"]');await p.waitForFunction(()=>__km.S.enc.phase==='math',null,{timeout:10000});
 await p.keyboard.type(String(await p.evaluate(()=>__km.answer())));await p.keyboard.press('Enter');await p.waitForFunction(()=>__km.S.enc.phase==='replace');
 await p.screenshot({path:out+'/replace-choice.png'});
 const boxes=await p.locator('.replacement-panel button').evaluateAll(bs=>bs.map(b=>({b:b.getBoundingClientRect().bottom,h:b.getBoundingClientRect().height})));assert(boxes.every(q=>q.b<=900&&q.h>80));
 await p.click('[data-act="keepParty"]');assert.equal(await p.evaluate(()=>__km.S.party.length),4);
 await p.locator('[data-act="selectTavern"]').nth(1).click();await p.click('[data-act="tvJoin"]');await p.waitForFunction(()=>__km.S.enc.phase==='math',null,{timeout:10000});
 await p.keyboard.type(String(await p.evaluate(()=>__km.answer())));await p.keyboard.press('Enter');await p.waitForFunction(()=>__km.S.enc.phase==='replace');
 const id=await p.evaluate(()=>{const S=__km.S,m=S.party[1];m.weapon=2;m.armor=1;for(let i=0;i<100;i++){S.runId='qa'+i;if(KM.Recruitment.hostile(S.runId,S.chapter,S.stop,m))break;}return m.id;});
 await p.click('[data-act="replaceMember"][data-id="'+id+'"]');await p.waitForFunction(()=>__km.S.enc?.dismissal&&__km.S.enc.phase==='math',null,{timeout:15000});
 await p.evaluate(()=>__km.S.speedMul=0);await p.screenshot({path:out+'/dismissed-fight.png'});assert.equal(await p.evaluate(()=>__km.S.view),null);assert.equal(await p.evaluate(()=>__km.S.party.length),4);
 console.log('PASS full-party tavern UI: solve, cancel, solve, replace, ink exit, same companion hostile, real math combat.');
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/browser-result.json',JSON.stringify({questions,bossSeen,errors},null,2));
 }catch(e){if(p)await p.screenshot({path:out+'/failure.png'});throw e;}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
