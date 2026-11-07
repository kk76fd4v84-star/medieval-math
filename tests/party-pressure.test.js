// Current living roster controls combat pressure; no permanent recruitment counter.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
const harness=fs.readFileSync(path.join(root,'tests/party-roles.test.js'),'utf8').split('const PA=')[0]
 .replace("search:'?debug&notimer'","search:'?debug'")
 .replace('s.enemy===id','s.enemy===id || s.type===id')
 .replace('submitAnswer};','submitAnswer,setChallengeMode,playKnight,combatWindows};');
const checks=`
run('src/modes/knight.js');run('src/modes/knight-hand.js');run('src/modes/fellowship.js');
const TI=scope.KM.Timing,close=(a,b)=>assert(Math.abs(a-b)<1e-9,a+' != '+b);
for(let n=0;n<=3;n++){
 const w=TI.windows({companions:n});close(w.block,.25-.05*n);close(w.crit,.5-.05*n);assert.equal(w.normal,.75);
 assert(TI.gradeFraction(w.block,w).block);assert(TI.gradeFraction(w.block+.00001,w).crit);assert(!TI.gradeFraction(w.crit,w).crit);
 const gear=TI.windows({companions:n,weapon:1,armour:1});close(gear.block-w.block,.05);close(gear.crit-w.crit,.05);
 for(const f of [.1,.3,.6,.8])assert.equal(TI.gradeFraction(f,w).points,TI.gradeFraction(f).points,'party size must not alter score tiers');
}
const boss=TI.windows({companions:3,pressure:{crit:.1,block:.15}});close(boss.block,.05);close(boss.crit,.25);close(boss.partyPressure.block,.15);close(boss.enemyPressure.block,.05);
const cap=TI.windows({companions:99,weapon:99,armour:99,pressure:{crit:99,block:99}});close(cap.block,.05);close(cap.crit,.2);assert.equal(cap.partyPressure.count,3);
for(const mode of ['math','knight','fellowship']){
 reset();S.view=null;S.toast=null;g.setChallengeMode(mode);
 const companions=['frank','timmy','executioner'].map(id=>g.followerFrom(D.companions[id],300));
 S.party.push(...companions);S.hp=g.maxHp();
 at('goblin');flush(1);
 close(g.combatWindows().block,.1);close(g.combatWindows().crit,.35);
 if(mode==='knight'){S.enc.deck.hand[0]=scope.KM.Knight.library(S.party).find(c=>c.owners.includes('hero')&&c.level==='easy'&&!c.combo).id;g.playKnight(0);}else if(mode==='math')g.pickAction('weak');
 const frozen=S.enc.tmr.windows;close(frozen.block,.1);
 companions[2].dying={t:0};close(g.combatWindows().block,.15);close(frozen.block,.1);
 companions[1].eaten=true;close(g.combatWindows().block,.2);
 S.party=S.party.filter(m=>m.id==='hero'||m===companions[0]);close(g.combatWindows().block,.2);
 // Resurrection/recruitment uses current members, including across a save/load round trip.
 S.party.push({...companions[2],dying:null,eaten:false});close(g.combatWindows().block,.15);
 const saved=JSON.parse(JSON.stringify(g.core()));g.applyCore(saved);close(g.combatWindows().block,.15);
 S.party=S.party.filter(m=>m.id==='hero');close(g.combatWindows().block,.25);close(g.combatWindows().crit,.5);
}
// A dead member releases party pressure AND removes that member's gear contribution.
reset();S.view=null;S.toast=null;g.setChallengeMode('fellowship');
const geared=g.followerFrom(D.recruitPool[0],300);geared.weapon=3;geared.armor=2;S.party.push(geared);S.hp=g.maxHp();
at('goblin');flush(1);close(g.combatWindows().block,.30);close(g.combatWindows().crit,.60);
const active=S.enc.tmr.windows;geared.dying={t:0};
close(g.combatWindows().block,.25);close(g.combatWindows().crit,.50);close(active.block,.30);close(active.crit,.60);
// A surviving character's equal weapon bonus is not accidentally taken away too.
S.party[0].weapon=3;close(g.combatWindows().crit,.65);
geared.eaten=true;geared.dying=null;close(g.combatWindows().block,.25);close(g.combatWindows().crit,.65);
S.timers=[];at('riddle');close(S.enc.tmr.windows.block,.25);close(S.enc.tmr.windows.crit,.5);
console.log('PASS: 0–3 companions, gear offsets, pressure floors, actual roster deaths/eating/restoration/save reload in all modes, frozen questions and unchanged scoring.');
`;
const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(harness+checks,__filename);
