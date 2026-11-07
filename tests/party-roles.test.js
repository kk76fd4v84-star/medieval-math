// Exercise the real game functions in a DOM/audio-free VM. No browser or saved game is modified.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = process.env.GAME_ROOT || path.resolve(__dirname, '..');
const noop = () => {}, nodes = new Map(), memory = new Map();
const ctx = new Proxy({ measureText: s => ({width: String(s).length * 12}), createLinearGradient: () => ({addColorStop: noop}) }, {get:(o,k)=>o[k] || noop});
const node = () => ({innerHTML:'',style:{setProperty:noop},dataset:{},classList:{add:noop,remove:noop,toggle:noop},addEventListener:noop,focus:noop,blur:noop,
  querySelector:()=>null,querySelectorAll:()=>[],getContext:()=>ctx,getBoundingClientRect:()=>({x:0,y:0,left:0,top:0,right:1600,bottom:900,width:1600,height:900}),offsetWidth:1600});
const scope = {console,URLSearchParams,location:{search:'?debug&notimer'},performance:{now:()=>0},innerWidth:1600,innerHeight:900,
  MutationObserver:class{observe(){}},setTimeout:noop,requestAnimationFrame:noop,addEventListener:noop,getComputedStyle:()=>({fontSize:'30px',columnGap:'0'}),Image:class{constructor(){this._ok=true;this.naturalWidth=512;this.naturalHeight=512;}},
  document:{getElementById:id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);},createElement:node,querySelectorAll:()=>[],addEventListener:noop,documentElement:{style:{setProperty:noop}}},
  localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)},KM:{}};
scope.window=scope;vm.createContext(scope);
const run = f => vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),scope,{filename:f});
const tags=[...fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]);
for(const f of tags.filter(f=>/^src\/(config|data)\//.test(f)&& !f.includes('specialists') && !f.includes('wizard-art')))run(f);
for(const f of ['src/engine/score.js','src/engine/timing.js','src/engine/progression.js','src/engine/road.js','src/engine/companion-graves.js','src/engine/save.js','src/engine/mathgen.js','src/engine/dragon-approach.js','src/engine/party-abilities.js','src/engine/dark-wizard.js','src/modes/spelling.js'])run(f);
scope.KM.Audio={play:noop,text:s=>typeof s==='string'?s:s.text,voice:noop,stopVoice:noop,stop:noop,voOf:()=>null};
scope.KM.Music={setScene:noop,settings:()=>({}),setPlace:noop};
scope.KM.Assets={drawEntity:noop,glyphHTML:String,entitySize:id=>[280,id==='frank'?378:531],entityHeight:id=>id==='frank'?378:831,hasAnim:()=>false,loadImg:()=>({_ok:false}),seqDur:()=>1};
scope.KM.Scenery={available:()=>true,treeWidth:()=>100};scope.KM.FireFx={stop:noop,active:()=>false,update:noop,start:()=>.5};scope.KM.RestView={};scope.KM.RoadCamp={draw:noop};scope.KM.TavernPOV={};
scope.KM.D20={roll:(result,label)=>({result,label}),update:noop};
let game=fs.readFileSync(path.join(root,'src/game.js'),'utf8');
game=game.slice(0,game.indexOf('  (async function boot()'))+`window.testGame={S,buildWorld,newMember,followerFrom,recruitCand,canHeal,artId,core,applyCore,renderChoice,pickAction,turnRight,startFrank,frankNo,commit,updateDragonApproach,finishEncounter,engage,renderRecruit,renderWalk,memberDies,afterHits,renderSacrifice,doSacrifice,contest,recruitFlow,drawParty,drawActor,draw,update,partyPose,maxHp,weakDmg,hardDmg,pickFire,spellKey,firestarter,executioner,canResurrect,priests,renderRiddle,castSpell,submitAnswer};})();`;
vm.runInContext(game,scope,{filename:'src/game.js'});
const g=scope.testGame,S=g.S,D=scope.KM_DATA;
function flush(seconds=3){S.t+=seconds;const due=S.timers.filter(t=>t.at<=S.t);S.timers=S.timers.filter(t=>t.at>S.t);for(const t of due)t.fn();}
function reset(withFrank=false){
  S.routeVersion=0;S.restUses={};S.tavernRecruits={};S.enc=null;S.ink=null;S.deathDepth=null;S.timers=[];S.dying=null;S.dragonSlain=false;S.mode='walk';S.hunters=0;S.stop=0;S.party=[g.newMember('hero',600)];
  if(withFrank)S.party.push(g.followerFrom(D.companions.frank,360));
  S.hp=g.maxHp();g.buildWorld(0);S.dist=0;S.camX=0;
}
function at(id){S.stop=S.stops.findIndex(s=>s.id===id || s.enemy===id);assert(S.stop>=0);const st=S.stops[S.stop];S.camX=st.stopX-D.world.engageScreenX;const a=S.actors.find(a=>a.stop===S.stop&&a.main);g.engage(st,a);if(st.type==='math')g.commit();return st;}

const PA=scope.KM.PartyAbilities;
function add(id){const m=g.followerFrom(D.companions[id],300);S.party.push(m);S.hp=g.maxHp();return m;}
function begin(who='goblin'){at(who);flush(1);}
reset();begin();S.hp=1;g.renderChoice();assert(!nodes.get('panel').innerHTML.includes('pickHeal'));assert(!nodes.get('panel').innerHTML.includes('sacrifice'));g.pickAction('heal');assert.equal(S.enc.phase,'choose');g.renderSacrifice();assert(!S.enc.sub);
// Real recruitment preserves named role and two-heart contribution, including save migration.
reset();at('recruit_frank');g.recruitFlow(S.enc.st,0,noop);S.enc.q.onRight();assert(g.canHeal());assert.equal(S.hp,4);assert.equal(S.party[1].name,'Frank the Mad Priest');
const saved=JSON.parse(JSON.stringify(g.core()));g.applyCore(saved);assert.equal(S.hp,4);assert.equal(g.maxHp(),4);delete saved.rolesVersion;saved.hp=4;g.applyCore(saved);assert.equal(S.hp,4);
reset(true);begin();S.hp=3;S.enc.lost=1;g.turnRight('heal');assert.equal(S.hp,4);assert.equal(S.enc.lost,0);
// Matching knights: hero + 1 adds EXACTLY 50%, +2 adds 100%, without double-counting party strength.
reset();const weak=g.weakDmg(),hard=g.hardDmg();S.party.push(g.followerFrom(D.recruitPool[0],300));assert.equal(g.weakDmg(),weak*1.5);assert.equal(g.hardDmg(),hard*1.5);S.party.push(g.followerFrom(D.recruitPool[1],100));assert.equal(g.weakDmg(),weak*2);
reset(true);assert.equal(g.weakDmg(),weak);assert.equal(g.maxHp(),4);
// Two-heart specialist dies first when at the rear; hero is last, two-heart knights still survive one unhealed hit.
reset();add('timmy');begin();S.hp=3;S.enc.lost=1;g.afterHits('goblin',noop);assert.equal(S.party.length,2);assert(!S.party[1].dying);
reset(true);begin();S.hp=2;S.enc.lost=2;g.afterHits('goblin',noop);assert(S.party[1].dying);assert(!g.canHeal());flush(2);assert.equal(S.party.length,1);assert.equal(S.enc.fallen.length,1);
// Non-priests cannot sacrifice through the menu OR a forged action.
reset();const t=add('timmy');begin();g.renderSacrifice();assert(!S.enc.sub);S.enc.sub='sacrifice';g.doSacrifice(t.id);assert.equal(S.party.length,2);
reset(true);begin();g.renderSacrifice();g.doSacrifice(S.party[1].id);assert.equal(S.party.length,1);
// Two priests unlock resurrection only when a casualty exists; three lower both priest maths levels.
reset(true);add('frank');const knight=g.followerFrom(D.recruitPool[0],150);S.party.push(knight);S.hp=g.maxHp();begin();assert.equal(PA.heal(S.party),2);assert(!g.canResurrect());g.renderChoice();assert.match(nodes.get('panel').innerHTML,/pickResurrect[^>]*disabled/);
S.enc.lost=2;S.hp-=2;g.afterHits('goblin',noop);flush(2);assert(g.canResurrect());g.renderChoice();g.pickAction('resurrect');assert.equal(S.enc.q.level,'hard');g.turnRight('resurrect');assert.equal(S.party.length,4);assert.equal(S.hp,g.maxHp()-1);assert(!g.canResurrect());assert.equal(S.enc.fallen.length,0);assert.equal(S.enc.lost,1);
S.enc.lost++;S.hp--;g.afterHits('goblin',noop);flush(2);assert.equal(S.party.length,3);
reset(true);add('frank');add('frank');begin();assert.equal(PA.heal(S.party),2);assert.equal(PA.priestLevel(S.party,'heal'),'easy');assert.equal(PA.priestLevel(S.party,'resurrect'),'normal');S.hp=3;g.pickAction('heal');assert.equal(S.enc.q.level,'easy');
// Executioner only multiplies, even under mead or a scroll cast during the problem. Threshold includes exactly half.
reset();add('executioner');begin();const foe=S.enc.act;foe.maxHp=10;foe.hp=5;assert.equal(PA.execute(S.party,foe),6);foe.hp=4.9;assert.equal(PA.execute(S.party,foe),6);
for(let i=0;i<60;i++){g.renderChoice();g.pickAction('execute');assert.match(S.enc.problem.text,/^\d+ × \d+$/);}
S.spells=1;S.spellLeft=0;g.castSpell();assert.match(S.enc.problem.text,/^\d+ × \d+$/);assert(S.enc.problem.stupid);assert(S.enc.problem.answer<=25);
reset();begin();g.pickAction('execute');assert.equal(S.enc.phase,'choose');
// Timmy owns the move; it uses word typing, no item stock and no shop bottle.
reset();begin();S.bottles=2;g.pickFire();assert.equal(S.enc.phase,'choose');assert.equal(D.items.fireBottle.sellAt.length,0);
reset();add('timmy');begin();g.pickFire();assert.equal(S.enc.phase,'spell');const word=S.enc.spell.word;assert.equal(word.split(' ').length,1);for(const c of word)g.spellKey(c);assert.equal(S.enc.phase,'busy');assert.equal(S.enc.spell.n,word.length);assert.equal(S.bottles,2);
reset();at('recruit_frank');g.recruitFlow(S.enc.st,0,noop);S.enc.q.onWrong();assert.equal(S.enc.phase,'contestOffer');scope.__km.forceContest=[20,1];g.contest();S.diceDone();assert(g.canHeal());assert.equal(S.party.length,2);
assert(D.recruitPool.filter(m=>m.role==='priest').length>=2);
// V2 keeps landmark coordinates and scale fixed, shrinks the party to crest then hides it behind real hill alpha.
reset(true);at('frank');const cam=S.camX,dist=S.dist,stop=S.stop;g.commit();const d=scope.KM.DragonApproach;const land=d.landmark(S),p0=g.partyPose(S.party[0]);g.updateDragonApproach(2.9);const p1=g.partyPose(S.party[0]);assert(p1.scale<p0.scale&&p1.y<p0.y&&p1.rear);assert.equal(d.landmark(S).x,land.x);assert.equal(d.landmark(S).dragonScale,land.dragonScale);assert(!S.enc.revealed);
g.updateDragonApproach(2.9);assert.equal(S.enc.depth.mode,'cover');assert(!S.enc.revealed);assert(g.partyPose(S.party[0]).occlude);g.updateDragonApproach(.48);assert(d.arena(S));assert(S.enc.revealed);g.updateDragonApproach(.7);for(let t=0;t<3;t+=.05)flush(.05);assert.equal(S.enc.phase,'choose');g.drawParty(false);g.finishEncounter();assert.equal(S.enc.phase,'leaveDragon');g.updateDragonApproach(.48);assert.equal(S.enc,null);assert.equal(S.stop,stop+1);assert.equal(S.camX,cam);assert.equal(S.dist,dist);g.updateDragonApproach(.7);assert.equal(S.ink,null);
reset();at('frank');assert.equal(S.enc,null);assert.equal(S.hunters,0);
reset(true);at('frank');g.frankNo();S.enc.q.onRight();flush();assert.equal(S.enc,null);
reset(true);at('frank');g.frankNo();S.enc.q.onWrong();flush(1);assert.equal(S.enc.phase,'enterDragon');assert.equal(S.hunters,1);
console.log('PASS: role recruitment/save migration, two-heart casualties, heal gating, priest-only sacrifice, resurrection/capacity, 3-priest maths, matching damage, execution threshold/multiplication under scroll, word-typing fire ownership, fixed-world crest approach, ink arena and road return.');
