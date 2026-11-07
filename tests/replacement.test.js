const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
const harness=fs.readFileSync(path.join(root,'tests/rest-road.test.js'),'utf8').split('const PA=scope.KM.PartyAbilities;')[0]
 .replace('let game=',"run('src/engine/recruitment.js');run('src/modes/fellowship.js');run('src/modes/knight.js');run('src/modes/knight-hand.js');let game=")
 .replace('window.testGame={S,','window.testGame={completeRecruit,replaceMember,keepParty,beginDismissalBattle,finishDismissalBattle,finishEncounter,canRecruit,setChallengeMode,defeatEnemy,S,');
const checks=`
const R=scope.KM.Recruitment;
const partyState=()=>JSON.stringify(S.party.map(({sp,...m})=>m));
function full(mode='math'){
 reset();g.setChallengeMode(mode);S.pendingDismissal=null;S.tavernRecruits={};S.routeVersion=3;S.chapter='village';S.fid=0;S.runId='replace-test';
 for(const id of ['frank','timmy','executioner'])S.party.push(g.followerFrom(D.companions[id],300));
 S.party[1].weapon=3;S.party[1].armor=2;S.hp=7;g.buildWorld(0);const st=at('campsite');
 st.cands=[{...D.recruitPool[0]}];st.candSkins=[5];return st;
}
for(const mode of ['math','knight','fellowship']){
 let st=full(mode),done=[];assert(g.canRecruit(st));
 const original=partyState(),hp=S.hp;
 g.completeRecruit(st,0,(...v)=>done.push(v),'Welcome.');assert.equal(S.enc.phase,'replace');
 assert.equal(partyState(),original);g.replaceMember('hero');assert.equal(partyState(),original);
 g.keepParty();assert.equal(partyState(),original);assert.equal(S.hp,hp);assert(st.cands[0]);assert.equal(done.length,1);
 // Peaceful and angry branches use actual seeded outcomes (never Math.random stubs).
 for(const hostile of [false,true]){
  st=full(mode);const old=S.party[1];for(let n=0;n<200;n++){S.runId='seed'+n;if(R.hostile(S.runId,S.chapter,st.idx,old)===hostile)break;}
  assert.equal(R.hostile(S.runId,S.chapter,st.idx,old),hostile);const coins=S.gold,oldId=old.id;done=[];
  g.completeRecruit(st,0,(...v)=>done.push(v),'Welcome.');g.replaceMember(oldId);
  assert.equal(S.party.length,4);assert.equal(S.party[0].id,'hero');assert(!S.party.includes(old));assert.equal(S.hp,7);
  assert.equal(S.party[1].name,D.recruitPool[0].name);assert.equal(S.party[1].weapon,0);assert.equal(S.party[1].armor,0);
  assert.equal(S.gold,coins);assert.equal(st.cands[0],null);assert(!g.canRecruit(st));
  const snapshot=JSON.stringify(g.core());g.replaceMember(oldId);assert.equal(JSON.stringify(g.core()),snapshot,'double click changes nothing');
  if(hostile){
   assert.equal(S.pendingDismissal.member.weapon,3);assert.equal(S.pendingDismissal.member.armor,2);
   g.applyCore(JSON.parse(snapshot));assert(S.pendingDismissal,'reload preserves fight');g.beginDismissalBattle();
   assert(S.enc.dismissal);assert.equal(S.view,null);assert.equal(S.enc.foes.length,1);assert.equal(S.enc.act.name,old.name);
   assert.equal(S.enc.maxHp,mode==='fellowship'?28:14);assert.equal(S.enc.atk,2);assert.equal(done.length,0);
   // Winning returns to the SAME camp; no loot and no extra recruit exploit.
   S.enc.hp=S.enc.act.hp=0;g.defeatEnemy();flush(1.1);
   assert.equal(S.pendingDismissal,null);assert.equal(S.enc.st.rest,'campsite');assert.equal(S.stop,st.idx);assert.equal(S.gold,coins);assert.equal(S.loot.length,0);
   assert(!g.canRecruit(S.enc.st));
  }else{assert.equal(done.length,1);assert(!S.pendingDismissal);assert(S.actors.some(a=>a.departure&&a.name===old.name));}
 }
}
// A failed full-party camp challenge removes only the candidate, never a companion.
let failedStop=full();const beforeFailure=partyState();let failedDone=null;
g.recruitFlow(failedStop,0,ok=>failedDone=ok);S.enc.input=String(S.enc.problem.answer+1);g.submitAnswer();
assert.equal(failedDone,false);assert.equal(partyState(),beforeFailure);assert.equal(failedStop.cands[0],null);assert(!S.pendingDismissal);
// A roadside confrontation resolves to the NEXT stop, without replaying recruitment.
let road=full();road.type='recruit';delete road.rest;const outgoing=S.party[1];
for(let n=0;n<100;n++){S.runId='road'+n;if(R.hostile(S.runId,S.chapter,road.idx,outgoing))break;}
g.completeRecruit(road,0,()=>{},'Welcome.');g.replaceMember(outgoing.id);g.beginDismissalBattle();
const roadIndex=S.stop;S.enc.act.hp=S.enc.hp=0;g.defeatEnemy();flush(1.1);
assert.equal(S.stop,roadIndex+1);assert.equal(S.mode,'walk');assert(!S.pendingDismissal);
// Below capacity, ordinary recruits keep their original two-heart join behavior.
reset();S.pendingDismissal=null;S.tavernRecruits={};const st=at('campsite');st.cands=[{...D.recruitPool[0]}];S.hp=1;
let joined=false;g.completeRecruit(st,0,ok=>joined=ok,'Welcome.');assert(joined);assert.equal(S.party.length,2);assert.equal(S.hp,3);
console.log('PASS: replacement in all 3 modes, cancel/player guard, wounds and gear ownership, seeded hostility, pending fight save/reload, real combat stats, same-stop return, single recruit and no loot.');
`;
const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(harness+checks,__filename);
