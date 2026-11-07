const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
let harness=fs.readFileSync(path.join(root,'tests/rest-road.test.js'),'utf8').split('const PA=scope.KM.PartyAbilities;')[0];
harness=harness.replace('let game=',"run('src/engine/hollowwood.js');let game=").replace('window.testGame={S,','window.testGame={chapterGate,enterWood,showWin,awakenBell,leaveBell,S,');
const checks=`
const HW=scope.KM.HollowWood;
for(let seed=0;seed<20;seed++){
 const a=HW.route(seed),b=HW.route(seed);assert.deepEqual(a,b);assert.equal(a.length,18);
 assert.equal(a[0].rest,'campsite');assert.equal(a.at(-2).enemy,'parish_collector');assert.equal(a.at(-1).type,'optional');
 for(const st of a){for(const id of [st.enemy,...(st.group||[])].filter(Boolean)){assert(D.enemies[id]);assert(D.combat.enemies[id]);assert(fs.existsSync(path.join(root,scope.KM_ART.entities[id].img)));}
 assert(st.gap>=1600);if(st.shopTier)assert(st.shopTier<=3);}
}
reset(true);S.routeVersion=3;S.party[0].weapon=3;S.party[1].armor=2;S.hp=3;S.gold=8;S.score=19;S.dist=25000;S.hunters=2;S.chapter='village';
const old=JSON.parse(JSON.stringify(g.core()));g.showWin();assert.equal(S.mode,'chapter');g.enterWood();g.updateDragonApproach(.49);assert.equal(S.chapter,'hollowwood');assert.equal(S.mode,'walk');
for(const k of ['hp','gold','score','dist','hunters'])assert.equal(S[k],old[k],k+' must survive chapter entry');
assert.equal(S.party[0].weapon,3);assert.equal(S.party[1].armor,2);assert.equal(S.stops[0].rest,'campsite');
const saved=JSON.parse(JSON.stringify(g.core()));g.applyCore(saved);assert.equal(S.chapter,'hollowwood');assert.equal(S.stops[0].rest,'campsite');assert.equal(S.hp,3);
// A declining optional boss costs nothing and never commits an attack.
at('bell_beneath');assert.equal(S.enc.phase,'optional');const coins=S.gold,hp=S.hp,stop=S.stop;g.leaveBell();assert.equal(S.hp,hp);assert.equal(S.gold,coins);assert.equal(S.stop,stop+1);assert.equal(S.mode,'walk');
// Deliberate opt-in changes distant scenery to the existing boss/pressure flow.
g.applyCore(saved);at('bell_beneath');g.awakenBell();g.updateDragonApproach(.49);assert.equal(S.enc.phase,'bossEntrance');assert.equal(S.enc.act.distant,false);assert(S.enc.foes.length===1);assert.equal(S.enc.hp,D.combat.enemies.bell_beneath.hp);
// A pre-chapter save remains in the original countryside.
delete old.chapter;g.applyCore(old);assert.equal(S.chapter,'village');assert.equal(S.stops[0].enemy,'rabid_squirrel');
console.log('PASS: deterministic Hollow Wood route/assets, wounded party/gear/economy carryover, chapter save/load, optional decline/commit, old saves stay countryside.');
`;
const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(harness+checks,__filename);
