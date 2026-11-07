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
for(const f of ['src/engine/score.js','src/engine/timing.js','src/engine/progression.js','src/engine/road.js','src/engine/save.js','src/engine/mathgen.js','src/engine/dragon-approach.js','src/engine/party-abilities.js','src/engine/dark-wizard.js','src/modes/spelling.js'])run(f);
scope.KM.Audio={play:noop,text:s=>typeof s==='string'?s:s.text,voice:noop,stopVoice:noop,stop:noop,voOf:()=>null};
scope.KM.Music={setScene:noop,settings:()=>({}),setPlace:noop};
scope.KM.Assets={drawEntity:noop,glyphHTML:String,entitySize:id=>[280,id==='frank'?378:531],entityHeight:id=>id==='frank'?378:831,hasAnim:()=>false,loadImg:()=>({_ok:false}),seqDur:()=>1};
scope.KM.Scenery={available:()=>true,treeWidth:()=>100};scope.KM.FireFx={stop:noop,active:()=>false,update:noop,start:()=>.5};scope.KM.RestView={};scope.KM.RoadCamp={draw:noop};scope.KM.TavernPOV={};
scope.KM.D20={roll:(result,label)=>({result,label}),update:noop};
let game=fs.readFileSync(path.join(root,'src/game.js'),'utf8');
game=game.slice(0,game.indexOf('  (async function boot()'))+`window.testGame={S,buildWorld,newMember,followerFrom,recruitCand,canHeal,artId,core,applyCore,renderChoice,pickAction,turnRight,startFrank,frankNo,commit,updateDragonApproach,finishEncounter,engage,renderRecruit,renderWalk,memberDies,afterHits,renderSacrifice,doSacrifice,contest,recruitFlow,drawParty,drawActor,draw,update,partyPose,maxHp,weakDmg,hardDmg,pickFire,spellKey,firestarter,executioner,canResurrect,priests,renderRiddle,castSpell,submitAnswer,startRest,renderRest,leaveRest,chooseGear,cancelGear,assignGear,buySpell,restBuy,updateWalk};})();`;
vm.runInContext(game,scope,{filename:'src/game.js'});
const g=scope.testGame,S=g.S,D=scope.KM_DATA;
function flush(seconds=3){S.t+=seconds;const due=S.timers.filter(t=>t.at<=S.t);S.timers=S.timers.filter(t=>t.at>S.t);for(const t of due)t.fn();}
function reset(withFrank=false){
  S.routeVersion=0;S.restUses={};S.enc=null;S.ink=null;S.deathDepth=null;S.timers=[];S.dying=null;S.dragonSlain=false;S.mode='walk';S.hunters=0;S.stop=0;S.party=[g.newMember('hero',600)];
  if(withFrank)S.party.push(g.followerFrom(D.companions.frank,360));
  S.hp=g.maxHp();g.buildWorld(0);S.dist=0;S.camX=0;
}
function at(id){S.stop=S.stops.findIndex(s=>s.id===id || s.enemy===id || s.rest===id);assert(S.stop>=0);const st=S.stops[S.stop];S.camX=st.stopX-D.world.engageScreenX;const a=S.actors.find(a=>a.stop===S.stop&&a.main);g.engage(st,a);if(st.type==='math')g.commit();return st;}


const PA=scope.KM.PartyAbilities;
reset(true);assert.equal(g.maxHp(),4);let v1=JSON.parse(JSON.stringify(g.core()));v1.rolesVersion=1;v1.hp=2;g.applyCore(v1);assert.equal(S.hp,3);const v2=g.core();g.applyCore(v2);assert.equal(S.hp,3);v1.hp=0;g.applyCore(v1);assert.equal(S.hp,0);
// Convert mixed older parties in every run slot; never heal on repeated loads or kill a living save.
for(const mode of ['knight','math']){
 const s={...v1,challengeMode:mode,rolesVersion:2,hp:4};g.applyCore(s);assert.equal(S.hp,3);
 const current=g.core();assert.equal(current.rolesVersion,3);g.applyCore(current);assert.equal(S.hp,3);
 for(const [hp,expected] of [[5,4],[1,1],[.5,.5],[0,0]]){g.applyCore({...s,hp});assert.equal(S.hp,expected);}
}
reset();S.gold=60;at('shop');g.renderRest();assert(nodes.get('panel').innerHTML.includes('action-row'));assert(!nodes.get('panel').innerHTML.includes('gear-shade'));
const gold=S.gold,spells=S.spells;g.buySpell();assert.equal(S.spells,spells+1);assert.equal(S.gold,gold-D.spell.price);assert(!S.enc.gearChoice);
const before=S.gold;g.chooseGear('weapon');assert.equal(S.gold,before);assert.match(nodes.get('panel').innerHTML,/Who gets the sword/);g.cancelGear();assert.equal(S.gold,before);assert.equal(S.party[0].weapon,0);
g.chooseGear('weapon');g.assignGear(0);assert.equal(S.gold,before-D.restStops.types.shop.gear.weaponCost);assert.equal(S.party[0].weapon,1);assert(!S.enc.gearChoice);g.assignGear(0);assert.equal(S.party[0].weapon,1);
g.chooseGear('armor');S.gold=0;g.assignGear(0);assert.equal(S.party[0].armor,0);assert(S.enc.gearChoice);g.cancelGear();
reset();const camp=at('campsite'),cam=S.camX,stop=S.stop;assert.equal(S.view,null);assert(nodes.get('panel').innerHTML.includes('Make camp'));g.leaveRest();assert.equal(S.stop,stop+1);assert.equal(S.camX,cam);assert(S.stops.includes(camp));assert.equal(S.mode,'walk');
run('src/engine/road-camp.js');const rc=scope.KM.RoadCamp,one=rc.placement(camp,cam),two=rc.placement(camp,cam+120);assert.equal(one.x-two.x,120);assert.equal(one.y,two.y);
assert.equal(D.world.walkSpeedMultiplier,1.8);assert.equal(PA.life({role:'priest'}),2);assert.equal(PA.life({role:'executioner'}),2);assert.equal(PA.life({role:'knight'}),2);assert.equal(PA.life({role:'firestarter'}),2);
console.log('PASS: two-heart wound-preserving save migration, scroll inventory, recipient popup/cancel/charge once, insufficient funds, camp world continuity and 50% speed increase.');
