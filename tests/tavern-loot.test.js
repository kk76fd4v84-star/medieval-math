// Real handlers, isolated in-memory saves, no user browser or audio.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
let harness=fs.readFileSync(path.join(root,'tests/party-roles.test.js'),'utf8');
harness=harness.slice(0,harness.indexOf('const PA='))
 .replace("search:'?debug&notimer'","search:'?debug'")
 .replace('submitAnswer};','submitAnswer,newGame,submitName,recruitFlowTalk,restRecruit,tickAnswerTimer,renderRest,enemyDeath,defeatEnemy,hitFoes,settleHits,collectLoot,pushSay,speak,bubblesForTest:()=>bubbleQ};')
 .replace('s.enemy===id','s.enemy===id || s.rest===id');
const checks=`
const sounds=[];scope.KM.Audio.play=n=>sounds.push(n);
run('src/engine/tavern-pov.js');
function fresh(){reset();S.view=null;S.loot=[];S.floats=[];S.gold=5;S.dice=[];S.spellLeft=0;S.mead=0;S.fid=0;}
for(const generic of [false,true])for(const timeout of [false,true]){
 fresh();const st=at('tavern'),name=st.cands[0].name,other=st.cands[1]?.name;
 if(generic)g.restRecruit(0);else g.recruitFlowTalk(st,0);
 if(timeout){const q=S.enc.q;g.tickAnswerTimer(S.enc.tmr.secs+1);assert.equal(S.enc.q,q,'full bar waits for a submitted answer');}
 S.enc.input=String(S.enc.problem.answer+1);g.submitAnswer();
 assert.equal(S.enc.phase,'rest');assert.equal(S.enc.contest,null);assert.equal(st.cands[0],null);assert.equal(S.party.length,1);assert.equal(S.dice.length,0);assert.equal(S.hunters,1);assert.equal(st.cands[1]?.name,other);
 const d=S.enc.tavernDepartures[0];assert.equal(d.p.name,name);assert(d.r);const v=scope.KM.TavernPOV;
 assert(v.departurePose(d,S.t+.3).rise>0);assert(v.departurePose(d,S.t+1.5).x>v.departurePose(d,S.t+.6).x);assert(v.departurePose(d,S.t+3).done);
 const snapshot=JSON.parse(JSON.stringify(g.core()));g.applyCore(snapshot);assert.equal(S.stops[st.idx].cands[0],null);
}
fresh();let st=at('tavern');g.recruitFlowTalk(st,0);S.enc.q.back();assert(st.cands[0]);assert(!S.enc.tavernDepartures);
g.recruitFlowTalk(st,0);S.enc.q.onRight();assert.equal(S.party.length,2);assert(!S.enc.tavernDepartures);
// During a scene transition one logical speaker may be drawn twice: latest anchor wins.
const who={};g.speak(who,'Join my party?');g.pushSay(who,100,100);g.pushSay(who,500,200);
assert.equal(g.bubblesForTest().filter(b=>b.owner===who).length,1);assert.equal(g.bubblesForTest().find(b=>b.owner===who).x,500);
// Defeating a foe shows damage only. Coins are collected once, when walking past its world coordinate.
fresh();st=at('goblin');flush(1);const e=S.enc,a=e.act;const before=S.gold;
g.hitFoes(e,[a],999,null);g.settleHits(e,[a]);assert.equal(S.gold,before);assert(S.floats.some(f=>f.text.includes('999')));assert(!S.floats.some(f=>f.text.includes('coppers')));assert.equal(S.loot.length,1);
g.enemyDeath(a);assert.equal(S.loot.length,1,'death cannot queue the reward twice');
g.collectLoot();assert.equal(S.gold,before,'no pickup during combat');flush(1);assert.equal(S.mode,'walk');g.collectLoot();assert.equal(S.gold,before);
const pending=JSON.parse(JSON.stringify(g.core()));g.applyCore(pending);assert.equal(S.loot.length,1);
S.mode='walk';S.camX=S.loot[0].x-S.party[0].sx+1;const reward=S.loot[0].amount;g.collectLoot();assert.equal(S.gold,before+reward);assert.equal(S.loot.length,0);assert(S.floats.some(f=>f.text.includes('coppers')));g.collectLoot();assert.equal(S.gold,before+reward);
const paid=JSON.parse(JSON.stringify(g.core()));g.applyCore(paid);assert.equal(S.loot.length,0);assert.equal(S.gold,before+reward);
// Every animal is excluded, including mixed encounters; a rabbit never increases the humanoid reward.
for(const id of ['rabid_squirrel','rabid_dog','killer_rabbit','toad']){
 fresh();st=at('goblin');flush(1);S.enc.act.id=id;S.enc.act.hp=0;g.defeatEnemy();assert.equal(S.loot.length,0);assert.equal(S.gold,5);
}
fresh();st=at('goblin');flush(1);const foe=S.enc.act,rabbit={...foe,id:'killer_rabbit',extra:1,x:foe.x+200};S.enc.foes=[foe,rabbit];g.enemyDeath(foe);g.enemyDeath(rabbit);assert.equal(S.loot.length,1);assert.equal(S.loot[0].amount,D.combat.economy.purses.goblin);
// Start money changes only for new runs; existing wallets retain exactly their balance.
g.newGame();assert.equal(S.gold,5);const old=JSON.parse(JSON.stringify(g.core()));old.gold=17;g.applyCore(old);assert.equal(S.gold,17);
// Live move labels recalculate with gear and matching companions, rather than hardcoding damage.
fresh();at('goblin');flush(1);g.renderChoice();let html=nodes.get('panel').innerHTML;assert(html.includes('<b>'+g.weakDmg()+'</b> damage'));assert(html.includes('<b>'+g.hardDmg()+'</b> damage'));
S.party[0].weapon=2;S.party.push(g.followerFrom(D.recruitPool[0],300));g.renderChoice();html=nodes.get('panel').innerHTML;assert(html.includes('<b>'+g.weakDmg()+'</b> damage'));
console.log('PASS: tavern wrong answers/timeouts, get-up/exit poses, persistence/cancel/success; one bubble per speaker; deferred once-only saved pickups, no animal drops/mixed rewards; starting coppers/old wallets; live damage labels.');
`;
const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(harness+checks,__filename);
