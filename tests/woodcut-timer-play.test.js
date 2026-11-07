// Real browser paths; isolated storage and muted audio. No edits to the user's running session.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.URL||'http://localhost:8801',out=process.env.OUTPUT_DIR||require('node:path').join(require('node:os').tmpdir(),'medieval-math-woodcut-review');
const chrome=process.env.CHROME_PATH||(fs.existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined);
(async()=>{fs.mkdirSync(out,{recursive:true});const b=await chromium.launch({executablePath:chrome,args:['--mute-audio']});
 try{const context=await b.newContext({viewport:{width:1600,height:900}}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 async function load(query){await p.goto(base+'/?debug&'+query);await p.waitForSelector('#kmLoader',{state:'detached',timeout:60000});}
 async function freeze(f){await p.evaluate(f=>{__km.S.speedMul=0;__km.S.enc.tmr.t=__km.S.enc.tmr.secs*f;},f);await p.waitForTimeout(1100);}
 for(const mode of ['math','knight','fellowship']){
  await load('mode='+mode+'&preview=goblin');
  if(mode!=='fellowship'){await p.click('[data-act="commit"]');await p.click(mode==='knight'?'[data-act="knightPlay"]':'[data-act="pickWeak"]');}
  await p.waitForFunction(()=>__km.S.enc?.phase==='math');await freeze(.19);
  const first=await p.evaluate(()=>({w:__km.S.enc.tmr.windows,actual:Object.fromEntries([...document.querySelectorAll('.timing-emblem')].map(b=>[b.dataset.outcome,+b.dataset.threshold])),fill:parseFloat(document.querySelector('#dvfill').style.width),images:[...document.querySelectorAll('.timing-emblem img')].every(i=>i.complete&&i.naturalWidth),glow:getComputedStyle(document.querySelector('#dvfill')).filter,music:__km.music()}));
  assert.deepEqual(first.actual,{block:first.w.block,crit:first.w.crit,normal:first.w.normal,weak:1});assert.equal(first.fill,19);assert(first.images);assert.equal(first.glow,'none');assert(first.music.muted);
  await p.screenshot({path:out+'/'+mode+'.png'});
  const block=p.locator('[data-outcome="block"]');await block.hover();assert(await block.locator('[role="tooltip"]').isVisible());assert((await block.getAttribute('aria-label')).includes('Block'));
  // Hover/click/Enter on an icon must never submit the problem.
  const q=await p.evaluate(()=>__km.S.enc.problem.text);await block.click();await p.keyboard.press('Enter');assert.equal(await p.evaluate(()=>__km.S.enc.problem.text),q);
  await p.locator('#stage').click({position:{x:800,y:100}});await p.keyboard.type(String(await p.evaluate(()=>__km.answer())));await p.keyboard.press('Enter');await p.waitForTimeout(100);
  assert.equal(await p.locator('.timing-hit').getAttribute('data-fraction'),'0.19');assert(await p.locator('.timing-hit').isVisible());await p.screenshot({path:out+'/'+mode+'-hit.png'});
 }
 await load('biome=tomb&preview=tomb&mode=fellowship');await p.waitForFunction(()=>__km.S.enc?.phase==='math');await freeze(.19);await p.screenshot({path:out+'/tomb.png'});
 // A full rail remains on screen and never crosses into the sum or outside the viewport.
 await freeze(1);await p.setViewportSize({width:1024,height:768});await p.waitForTimeout(100);
 const rect=await p.locator('.timing-rail').boundingBox();assert(rect.x>=0&&rect.x+rect.width<=1024);assert.equal(await p.locator('#dvfill').evaluate(e=>e.style.width),'100%');
 await p.screenshot({path:out+'/tomb-small-full.png'});
 await p.setViewportSize({width:1600,height:900});await p.evaluate(()=>KM.I18n.set('ja'));await p.waitForTimeout(100);await p.locator('[data-outcome="crit"]').hover();assert((await p.locator('[data-outcome="crit"]').getAttribute('aria-label')).includes('会心'));await p.screenshot({path:out+'/japanese-tooltip.png'});
 // Riddles keep their own reward rules, using the same ink fill, without combat labels.
 await load('preview=riddle&mode=fellowship');await p.waitForFunction(()=>__km.S.enc?.phase==='riddle');await freeze(.37);assert(await p.locator('#dvfill').isVisible());assert(await p.locator('.timing-legend').evaluate(e=>e.hidden));assert.equal(await p.locator('#dvfill').evaluate(e=>e.style.width),'37%');await p.screenshot({path:out+'/riddle.png'});
 assert.deepEqual(errors,[]);console.log('PASS: 3 outdoor modes, tomb, riddle, EN/JA tooltips, exact threshold/fill/answer alignment, full bar, narrow viewport, icon input isolation, all assets loaded; audio muted.');
 fs.writeFileSync(out+'/result.json',JSON.stringify({pass:true,errors},null,2));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
