// Real enemy-pattern callbacks; no audio playback, browser or saved player data.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
const harness=fs.readFileSync(path.join(root,'tests/party-roles.test.js'),'utf8').split('const PA=')[0]
.replace("search:'?debug&notimer'","search:'?debug'")
.replace('submitAnswer};','submitAnswer,setChallengeMode,playKnight,tickAnswerTimer,combatWindows,enemyTurn,deadlineCounter};');
const checks=`
run('src/modes/knight.js');run('src/modes/knight-hand.js');
const sounds=[];scope.KM.Audio.play=id=>sounds.push(id);
function step(secs=3){for(let t=0;t<secs;t+=.05)flush(.05);}
function fresh(mode,id='goblin'){
 reset();S.stats={correct:0,wrong:0,riddles:0};S.view=null;S.toast=null;S.spellLeft=0;S.mead=0;S.floats=[];g.setChallengeMode(mode);
 at('goblin');flush(1);const e=S.enc;e.act.id=id;e.act.hp=e.act.maxHp=e.hp=e.maxHp=100;e.foes=[e.act];return e;
}
function choose(mode){if(mode==='knight')g.playKnight(0);else g.pickAction('weak');}
function full(mode){g.tickAnswerTimer(99);step();}
function reply(mode,f=1,ok=true){
 const e=S.enc;e.tmr.t=e.tmr.secs*f;e.input=String(e.problem.answer+(ok?0:1));g.submitAnswer();
}
const TI=scope.KM.Timing;
const base=TI.windows(),loss=TI.pressure([{id:'dragon'},{id:'ogre'},{id:'dragon'}]);
assert.equal(loss.crit,.1);assert.equal(loss.block,.15,'mixed foes use strongest pressure, not stacked penalties');
const w=TI.windows({pressure:loss});assert.equal(w.crit,.4);assert.equal(w.block,.1);assert.equal(w.unpressured.block,.25);
const geared=TI.windows({weapon:2,armour:2,pressure:loss});assert(Math.abs(geared.crit-.5)<1e-9);assert(Math.abs(geared.block-.2)<1e-9);
const minimum=TI.windows({pressure:{crit:5,block:5}});assert.equal(minimum.crit,.2);assert.equal(minimum.block,.05);
for(const mode of ['math','knight']){
 for(const id of ['rabid_squirrel','killer_rabbit']){
  const e=fresh(mode,id);choose(mode);reply(mode,.9);step();assert.equal(S.hp,2,mode+' correct late answer blocks '+id);assert(e.act.hp<100);
  fresh(mode,id);choose(mode);reply(mode,.1,false);step();assert.equal(S.hp,1,mode+' wrong still hurts '+id);assert.equal(S.hunters,1);
 }
 // Unmarked foes still wait indefinitely. Impatient foes strike exactly once and preserve the unanswered challenge.
 let e=fresh(mode);choose(mode);full(mode);assert.equal(S.hp,2);assert(e.q);
 e=fresh(mode,'rabid_dog');choose(mode);const q=e.q;full(mode);assert.equal(S.hp,1);assert.equal(e.q,q);assert.equal(S.hunters,0);assert.equal(S.stats.wrong,0);
 g.tickAnswerTimer(99);step();assert.equal(S.hp,1,'no repeated deadline strike');
 reply(mode,1);step();assert.equal(S.hp,1,'no duplicate counter on late answer');
 assert.equal(e.phase,mode==='knight'?'cards':'choose');
 choose(mode);assert.equal(e.deadlineStruck.size,0);reply(mode,.1);step();assert.equal(S.hp,1,'next early answer blocks normally');
}
// Word typing shares the deadline; it remains finishable and has only one response.
let e=fresh('math','rabid_dog');S.party.push(g.followerFrom(D.companions.timmy,300));S.hp=g.maxHp();g.pickFire();const word=e.spell.word,q=e.q;
g.tickAnswerTimer(99);step();assert.equal(S.hp,3);assert.equal(e.q,q);
for(const ch of word)g.spellKey(ch);step();assert.equal(S.hp,3);assert(e.act.hp<100);
// Correct against mixed foes protects only the forgiving ones; armour still absorbs real spillover.
e=fresh('math','rabid_squirrel');e.foes.push({...e.act,id:'goblin',x:e.act.x+260});choose('math');reply('math',1);step();assert.equal(S.hp,1);
e=fresh('math','rabid_dog');S.party[0].armor=4;e.foes.push({...e.act,id:'goblin',x:e.act.x+260});choose('math');full('math');assert.equal(S.party[0].armor,3);reply('math',1);step();assert.equal(S.party[0].armor,2);assert.equal(S.hp,2);
// Pressure snapshots stay put during a challenge; dead pressure sources release it for the next question.
e=fresh('math','black_knight');choose('math');assert.equal(e.tmr.windows.block,.15);S.party[0].armor=4;assert.equal(e.tmr.windows.block,.15);assert.equal(g.combatWindows().block,.35);
// Entrance order: original markers, a single roar, then pushed markers, then cards. Never start a timer during it.
reset();S.view=null;S.toast=null;g.setChallengeMode('knight');at('dragon');g.commit();e=S.enc;
assert.equal(e.phase,'bossEntrance');assert.equal(g.combatWindows().block,.25);assert(!e.q);const roars=sounds.filter(x=>x==='dragon_roar').length;
g.commit();step(.8);assert.equal(sounds.filter(x=>x==='dragon_roar').length,roars+1);assert.equal(e.pressureReady,false);
step(.3);assert.equal(e.pressureReady,true);assert.equal(g.combatWindows().block,.1);assert(!e.q);step(1.7);assert.equal(e.phase,'cards');
// Deadline casualties cannot leave a dead companion casting a committed card.
e=fresh('knight','rabid_dog');const companion=g.followerFrom(D.recruitPool[0],300);S.party.push(companion);S.hp=3;e.lost=1;
choose('knight');e.activeCard.owners=[companion.id];g.tickAnswerTimer(99);step(5);
assert.equal(S.party.length,1);assert(!e.q);assert.equal(e.phase,'cards');assert.equal(S.hp,2);
// A scroll after the first strike can help the pending sum without buying the enemy a second strike.
e=fresh('math','rabid_dog');S.spells=1;choose('math');full('math');g.castSpell();assert.equal(e.tmr.t,0);assert.equal(S.spellLeft,1);
g.tickAnswerTimer(99);step();assert.equal(S.hp,1);assert.equal(S.spellLeft,1);reply('math',.1);step();assert.equal(S.hp,1);assert.equal(S.spellLeft,0);
// Red pressure is released when its source dies, at the next challenge only.
e=fresh('math','black_knight');e.foes.push({...e.act,id:'goblin',x:e.act.x+260});choose('math');const snapshot=e.tmr.windows;
e.act.hp=0;assert.equal(snapshot.block,.15);assert.equal(g.combatWindows().block,.25);
// Delayed strikes cannot damage a new encounter after this one disappears.
e=fresh('math','rabid_dog');choose('math');g.tickAnswerTimer(99);S.enc=null;step();assert.equal(S.hp,2);
console.log('PASS: forgiving enemies, fixed pressure and upgrade preservation, staged boss entrance, one-shot deadlines in all modes/typing, mixed groups, frozen windows and stale callbacks.');
`;
const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(harness+checks,__filename);
