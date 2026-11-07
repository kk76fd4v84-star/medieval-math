// The real resolver in an isolated VM: never touch player storage or play audio.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
const harness=fs.readFileSync(path.join(root,'tests/party-roles.test.js'),'utf8').split('const PA=')[0]
 .replace("search:'?debug&notimer'","search:'?debug'")
 .replace('submitAnswer};','submitAnswer,setChallengeMode,tickAnswerTimer,combatWindows,renderRest,chooseGear,assignGear,enemyTurn,renderMath,answerRiddle};')
 .replace('s.enemy===id','s.enemy===id || s.rest===id || s.type===id');
const checks=`
run('src/modes/fellowship.js');run('src/modes/knight.js');run('src/modes/knight-hand.js');run('src/engine/leaderboard.js');
const F=scope.KM.Fellowship;
const audio=[];scope.KM.Audio.play=ev=>audio.push(ev);scope.KM.FireFx.hitDelay=()=>.795;
const fires=[];scope.KM.FireFx.start=o=>{fires.push(o);return .795;};
const advance=(sec=3)=>{for(let i=0;i<Math.ceil(sec/.02);i++)flush(.02);};
function fresh(n=1,enemy='goblin'){
 reset();g.setChallengeMode('fellowship');S.routeVersion=3;S.runId='fellowship-test';S.stats={correct:0,wrong:0,riddles:0};S.score=0;S.scoreLedger=scope.KM.Score.empty();S.spells=0;S.spellLeft=0;S.mead=0;S.floats=[];S.toast=null;S.view=null;
 for(let i=1;i<n;i++)S.party.push(g.followerFrom(D.recruitPool[i-1],300));S.hp=g.maxHp();g.buildWorld(0);at(enemy);advance(3);
 assert.equal(S.enc.phase,'math');assert.equal(S.enc.action,'fellowship');assert(!S.enc.q.back);assert(!nodes.get('panel').innerHTML.includes('action-card'));
 return S.enc;
}
const reply=(f,ok=true)=>{const e=S.enc;e.tmr.t=e.tmr.secs*f;e.input=String(e.problem.answer+(ok?0:1));g.submitAnswer();};
for(const [f,mult,block,points] of [[.1,1,true,4],[.10001,2,false,4],[.25,2,false,3],[.34999,2,false,3],[.35,1,false,3],[.5,1,false,2],[.6,1,false,2],[.75,1,false,1],[1.3,.5,false,1]]){
 const e=fresh(4);e.act.hp=e.act.maxHp=e.hp=e.maxHp=300;reply(f);const score=S.score;g.submitAnswer();assert.equal(S.score,score,'double submit cannot score twice');
 advance(2.8);assert.equal(e.act.hp,300-12*mult);assert.equal(S.hp,block?8:7);assert.equal(S.score,points,'one score, not four');assert.equal(e.phase,'math');assert(e.q);
 assert(S.floats.some(f=>f.fellowship&&f.total));
}
let e=fresh(4);e.act.hp=e.act.maxHp=e.hp=e.maxHp=300;reply(.1,false);advance();assert.equal(e.act.hp,300);assert.equal(S.hp,7);assert.equal(S.hunters,1);assert.equal(S.stats.wrong,1);assert.equal(S.score,0);
e=fresh(2);e.act.hp=e.act.maxHp=e.hp=e.maxHp=300;const q=e.q;g.tickAnswerTimer(99);advance();assert.equal(e.q,q);assert.equal(S.hp,4);reply(1.4);advance();assert.equal(S.hp,3);assert.equal(e.act.hp,297);
// Two exposed critical answers can kill a companion even when both answers are correct.
e=fresh(4);e.act.hp=e.act.maxHp=e.hp=e.maxHp=300;reply(.3);advance(3);assert.equal(S.hp,7);reply(.3);advance(5);assert.equal(S.party.length,3);assert.equal(S.hp,6);assert.equal(e.act.hp,252);assert(!S.party[0].dying);
// Fixed health never auto-scales to cancel party/gear benefits.
e=fresh(1);assert.equal(e.maxHp,D.combat.enemies.goblin.hp*2);const hp=e.maxHp;e=fresh(4);assert.equal(e.maxHp,hp);
S.party[2].weapon=2;assert.equal(F.total(S.party),16);e.act.hp=e.act.maxHp=e.hp=e.maxHp=300;reply(.6);advance();assert.equal(e.act.hp,284);
// Shared equipped timing windows, question snapshot, silver hearts preserved by a block.
e=fresh(2);S.party[1].weapon=2;S.party[1].armor=2;g.renderChoice();assert.equal(e.tmr.windows.crit,.55);assert.equal(e.tmr.windows.block,.30);S.party[1].weapon=3;assert.equal(e.tmr.windows.crit,.55);reply(.29);advance();assert.equal(S.hp,4);assert.equal(S.party[1].armor,2);
// Plan switches target after the first member kills it; dead party members never contribute.
e=fresh(4,'squirrel-pack');const order=e.foes.slice().sort((a,b)=>a.x-b.x);order.forEach(f=>f.hp=3);const plan=F.plan(S.party,order);assert.equal(plan.length,4);assert.equal(plan[0].target,order[0]);assert.equal(plan[0].impacts.length,2);assert.equal(plan[0].impacts[1].target,order[1]);assert.equal(plan[1].target,order[2]);
S.party[3].dying={t:0};assert.equal(F.plan(S.party,order).length,3);delete S.party[3].dying;reply(.4);advance(1.2);assert(order.every(f=>f.hp===0&&(f.gone||['vanish','corpse'].includes(f.state))));assert(e.won);assert.equal(S.hp,8);
// Deadline strikes remain one per question; answering afterwards doesn't get a second bite.
e=fresh(2,'rabid_dog');e.act.hp=e.act.maxHp=e.hp=e.maxHp=300;g.tickAnswerTimer(99);advance(1);assert.equal(S.hp,3);reply(1.2);advance(3);assert.equal(S.hp,3);assert.equal(e.phase,'math');
// A casualty is removed before the next question and cannot attack from the grave.
e=fresh(2);S.hp=3;e.lost=1;e.act.hp=e.act.maxHp=e.hp=e.maxHp=300;reply(.9,false);advance(5);assert.equal(S.party.length,1);assert.equal(e.phase,'math');reply(.1);advance(3);assert.equal(e.act.hp,297);
// Consumables are automatic; a full bar alone never consumes the armed sum.
e=fresh();S.spells=1;g.renderChoice();assert.equal(S.spells,0);assert.equal(S.spellLeft,1);assert(e.problem.scrollAssisted);g.tickAnswerTimer(99);assert.equal(S.spellLeft,1);reply(.1);advance();assert.equal(S.spellLeft,0);assert.equal(S.score,2);
// The original riddler, greeting SFX, choices, score and unlock progress are restored.
fresh();S.timers=[];S.spells=1;audio.length=0;at('riddle');assert.equal(S.enc.phase,'riddle');assert(S.enc.riddle);assert.equal(audio.filter(ev=>ev==='riddle').length,1);assert.match(nodes.get('panel').innerHTML,/ansgrid/);assert.equal(S.spells,1);
S.enc.tmr.t=S.enc.tmr.secs*.3;g.answerRiddle(S.enc.riddle.answer);assert.equal(S.score,2);assert.equal(S.stats.riddles,1);assert.equal(S.scoreLedger.riddles[1],1);assert.equal(S.scoreLedger.answers.reduce((n,v)=>n+v,0),0);assert.equal(S.spells,1);
// Failed road recruitment leaves, with no dice offer.
fresh();S.timers=[];at('recruit_frank');g.recruitFlow(S.enc.st,0,()=>{});reply(.5,false);assert.notEqual(S.enc.phase,'contestOffer');assert(!S.enc.contest);
// Real role volleys: AoE, priest utility, execution threshold, per-caster backfire.
function roles(ids,group=false){
 const e=fresh(1,group?'squirrel-pack':'goblin');
 for(const id of ids)S.party.push(g.followerFrom(D.companions[id],300));S.hp=g.maxHp();
 for(const f of e.foes)f.hp=f.maxHp=300;e.hp=e.maxHp=300;g.renderChoice();return e;
}
e=roles(['darkWizard','timmy'],true);fires.length=0;reply(.1);advance(1.7);
assert.deepEqual(Array.from(e.foes,f=>f.hp),[286,286,289],'knight hits first two; lightning 7 + fire 4 hit all three');
assert.equal(S.hp,6);assert.equal(e.fellowshipVolley.total,39);assert.equal(e.fellowshipVolley.landed,3);assert.equal(fires.length,1);assert.equal(fires[0].targets.length,3);assert(S.lightning.targets.length===3);
e=roles(['darkWizard','darkWizard','timmy'],true);fires.length=0;reply(.4,false);advance(1.1);
assert.deepEqual(Array.from(e.foes,f=>f.hp),[282,282,282]);assert.equal(S.hp,5,'one shared heart per caster, not one per member');assert.equal(e.fellowshipVolley.backfire,3);assert.equal(e.fellowshipVolley.landed,3);assert.equal(S.hunters,1);assert.equal(S.score,0);assert.equal(S.stats.wrong,1);assert.equal(fires[0].targets.length,7);assert.equal(S.lightning.targets.length,7);
advance(6);assert.equal(S.party.length,2,'three backfire hearts plus one enemy response causes two companion deaths');assert.equal(S.hp,4);assert.equal(e.phase,'math');
// Fixed backfire cost ignores early/late timing; armour absorbs normally, and empty timers do not cast it.
for(const f of [.1,.95]){e=roles(['darkWizard']);S.party[0].armor=2;const before=e.act.hp;g.tickAnswerTimer(999);assert.equal(S.hp,4);assert.equal(e.act.hp,before);reply(f,false);advance(.3);assert.equal(S.hp,4);assert.equal(S.party[0].armor,1);assert.equal(e.act.hp,293);assert.equal(e.answerTiming,null);advance(3);assert.equal(S.hp,4);assert.equal(S.party[0].armor,0);assert.equal(e.phase,'math');}
// No extra cast/score on double submit; no risky ally means no friendly fire.
e=roles(['timmy','timmy']);fires.length=0;reply(.6,false);g.submitAnswer();advance(1.1);assert.equal(S.hp,4);assert.equal(e.act.hp,292);assert.equal(fires.length,2);assert(fires.every(f=>f.append));assert.equal(S.stats.wrong,1);assert.equal(S.hunters,1);
e=roles(['frank']);S.hp=3;e.lost=1;reply(.1);advance(.7);assert.equal(S.hp,4);assert.equal(e.lost,0);assert.equal(e.heals,1);assert.equal(e.act.hp,297);advance(3);reply(.1);advance(.7);assert.equal(e.act.hp,291,'full-health priest uses staff');assert.equal(e.heals,1);
e=roles(['frank','frank']);S.hp=4;e.lost=2;reply(.1);advance(.8);assert.equal(S.hp,6);assert.equal(e.lost,0);assert.equal(e.heals,0);assert.equal(e.act.hp,297);advance(3);S.hp=5;e.lost=1;reply(.1);advance(.8);assert.equal(S.hp,5);assert.equal(e.act.hp,288,'spent heal limit means staff attacks');
e=roles(['frank']);S.hp=3;e.lost=1;reply(.4,false);advance(.4);assert.equal(S.hp,3);assert.equal(e.heals,2);assert.equal(e.act.hp,300,'priests never heal a wrong sum');
e=roles(['executioner']);e.act.hp=e.hp=150;reply(.1);advance(.7);assert.equal(e.act.hp,141,'executioner doubles damage against half-health foe');
e=roles(['executioner']);reply(.1);advance(.7);assert.equal(e.act.hp,294,'ordinary axe hit above half health');
e=roles(['darkWizard']);S.party[1].weapon=2;reply(.1);advance(.7);assert.equal(e.act.hp,286,'personal wizard gear adds damage');
// Even killing the last foe with a failed cast cannot cancel its health loss or death.
e=roles(['darkWizard']);S.hp=1;e.lost=3;e.act.hp=e.hp=1;reply(.5,false);advance(6);assert.equal(S.hp,0);assert(S.dying);assert(!e.won);
// Riddle failures use their own revenge/attempt rules, never party spell backfires.
e=roles(['darkWizard']);S.timers=[];at('riddle');const n=S.hp;g.answerRiddle((S.enc.riddle.answer+1)%S.enc.riddle.choices.length);assert.equal(S.hp,n-1);assert.equal(S.hunters,1);assert(!S.enc.fellowshipVolley);
// Mode-specific persistence survives a fresh load and never changes legacy slots/boards.
const save=scope.KM.Save,lb=scope.KM.Leaderboard;
for(const mode of ['math','knight','fellowship']){g.setChallengeMode(mode);save.write({challengeMode:mode,name:mode});lb.record({mode,id:'same-id',name:mode,score:12});}
for(const mode of ['math','knight','fellowship']){g.setChallengeMode(mode);assert.equal(save.load().name,mode);assert.equal(lb.list(mode).length,1);assert.equal(lb.list(mode)[0].name,mode);}
console.log('PASS: Fellowship auto-maths, role volleys, AoE, stacked backfire, priest heals, executioner, all timing boundaries, once-only scores/retaliation, upgrades, fixed HP, group targeting, deadlines, casualties, auto scroll, original riddler + greeting, no dice, isolated saves/boards.');
`;
const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(harness+checks,__filename);
