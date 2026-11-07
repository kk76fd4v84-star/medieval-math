// Real challenge callbacks across both modes, without browser audio or player storage.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
let harness=fs.readFileSync(path.join(root,'tests/party-roles.test.js'),'utf8').split('const PA=')[0]
 .replace("search:'?debug&notimer'","search:'?debug'")
 .replace('submitAnswer};','submitAnswer,setChallengeMode,playKnight,tickAnswerTimer,combatWindows};');
const checks=`
run('src/modes/knight.js');run('src/modes/knight-hand.js');
function fresh(mode){reset();S.stats={correct:0,wrong:0,riddles:0};S.toast=null;S.view=null;S.spellLeft=0;S.mead=0;S.floats=[];g.setChallengeMode(mode);at('goblin');flush(1);S.enc.act.hp=S.enc.act.maxHp=S.enc.hp=S.enc.maxHp=100;}
function step(){for(let i=0;i<65;i++)flush(.05);}
function choose(mode){if(mode==='knight')g.playKnight(0);else g.pickAction('weak');}
function reply(mode,f,ok=true){
 S.enc.tmr.t=S.enc.tmr.secs*f;S.enc.input=String(S.enc.problem.answer+(ok?0:1));g.submitAnswer();
}
for(const mode of ['math','knight']){
 for(const [f,mul,protectedTurn] of [[.1,1,true],[.3,2,false],[.6,1,false],[.9,.5,false]]){
  fresh(mode);const e=S.enc,base=mode==='knight'?scope.KM.Knight.library(S.party).find(c=>c.id===e.deck.hand[0]).damage:g.weakDmg();
  choose(mode);reply(mode,f);step();assert.equal(e.act.hp,100-base*mul,mode+' damage '+f);assert.equal(S.hp,protectedTurn?2:1,mode+' block '+f);assert(!e.act.stunned);
 }
 fresh(mode);choose(mode);reply(mode,.1,false);step();assert.equal(S.hp,1,mode+' wrong early answer still fails');assert.equal(S.hunters,1);
 fresh(mode);choose(mode);const e=S.enc,q=e.q;
 g.tickAnswerTimer(99);
 step();assert.equal(e.q,q);assert.equal(S.hp,2);assert.equal(S.hunters,0);assert.equal(S.stats.wrong,0);
 e.input=String(e.problem.answer);g.submitAnswer();
 step();assert.equal(S.hp,1,mode+' resolves only on input');
}
// Timing block protects every incoming hit and leaves consumable armour untouched.
fresh('knight');let e=S.enc;S.party[0].armor=2;e.foes=[e.act,{...e.act,x:e.act.x+250}];choose('knight');reply('knight',.34);step();assert.equal(S.hp,2);assert.equal(S.party[0].armor,2);
// Selected-card ownership determines weapon benefit, not the strongest unrelated companion.
fresh('knight');S.party.push(g.followerFrom(D.recruitPool[0],300));S.party[1].weapon=3;S.party[0].weapon=0;
choose('knight');assert.equal(S.enc.tmr.windows.crit,.45);
fresh('knight');S.party[0].weapon=2;choose('knight');assert.equal(S.enc.tmr.windows.crit,.6);const snapshot=S.enc.tmr.windows;S.party[0].weapon=8;assert.equal(S.enc.tmr.windows,snapshot);
console.log('PASS: all-mode crit/block/normal/weak outcomes; wrong-answer risks; full-bar waiting; group protection; armour preservation; selected weapon ownership and frozen question windows.');
`;
const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(harness+checks,__filename);
