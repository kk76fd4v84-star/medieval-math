// Real game entry points, silent VM: timing boundaries, retaliation, riddle rewards and one-sum scrolls.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
let harness=fs.readFileSync(path.join(root,'tests/party-roles.test.js'),'utf8');
harness=harness.slice(0,harness.indexOf('const PA='))
 .replace("search:'?debug&notimer'","search:'?debug'")
 .replace('submitAnswer};','submitAnswer,tickAnswerTimer,ask,enemyTurn,startRiddle,answerRiddle,spellTick,actions,gameOver,showWin,newGame,retry,scoreSummary};')
 .replace('s.enemy===id','s.enemy===id || s.type===id');
const checks=`
function fresh(){reset();S.gold=0;S.score=0;S.spells=0;S.spellLeft=0;S.mead=0;S.view=null;S.toast=null;S.floats=[];S.voices=[];}
function add(id){S.party.push(g.followerFrom(D.companions[id],300));S.hp=g.maxHp();}
function begin(){at('goblin');flush(1);S.enc.foes=[S.enc.act];S.enc.act.hp=S.enc.act.maxHp=100;S.enc.hp=S.enc.maxHp=100;}
function elapsed(f){assert(S.enc.tmr);S.enc.tmr.t=S.enc.tmr.secs*f;}
function right(){S.enc.input=String(S.enc.problem.answer);g.submitAnswer();}
function runFor(secs){for(let t=0;t<secs;t+=.05)flush(.05);}
function answer(move,f){g.pickAction(move);elapsed(f);right();}
// Exact boundaries: half damage remains fractional (3 -> 1.5); no rounding bonus.
for(const [f,mul,block] of [[0,1,true],[.24999,1,true],[.25,1,true],[.25001,2,false],[.49999,2,false],[.5,1,false],[.50001,1,false],[.74999,1,false],[.75,1,false],[.75001,.5,false],[1,.5,false],[3,.5,false]]){
 for(const move of ['weak','hard','execute']){
  fresh();if(move==='execute')add('executioner');begin();
  if(move==='execute'){S.enc.act.maxHp=200;S.enc.maxHp=200;}
  const base=move==='execute'?scope.KM.PartyAbilities.execute(S.party,S.enc.act):move==='weak'?g.weakDmg():g.hardDmg();
  const foe=S.enc.act;answer(move,f);flush(.22);
  const endBlock=move==='execute'?.2:.25,endCrit=move==='execute'?.45:.5;
  const expectedBlock=f<=endBlock,expectedCrit=!expectedBlock&&f<endCrit,expectedMul=expectedCrit?2:f>.75?.5:1;
  assert.equal(foe.hp,100-base*expectedMul,move+' at '+f);assert.equal(S.enc.answerTiming.block,expectedBlock);assert(!foe.stunned);
  assert.equal(S.floats.some(v=>v.text.startsWith('crit ')),expectedCrit);
 }
}
// Very fast answers block exactly one enemy turn, then a normal answer receives the usual hit.
fresh();begin();const first=S.enc.act,hp=S.hp;answer('weak',.1);runFor(2);assert.equal(S.hp,hp);assert.equal(S.enc.phase,'choose');assert(!first.stunned);assert(S.floats.some(v=>v.text==='blocked!'));
answer('weak',.6);runFor(2);assert.equal(S.hp,hp-1);
// Unprotected normal and weak damage allow retaliation.
for(const f of [.50001,.8]){fresh();begin();const hp=S.hp;answer('weak',f);runFor(2);assert.equal(S.hp,hp-1);}
// A timing block protects against all three foes, even the untouched one.
fresh();begin();const e=S.enc,foe=e.act;e.foes=[foe,{...foe,x:foe.x+200},{...foe,x:foe.x+400}];const groupHp=S.hp;answer('weak',.1);runFor(2);assert.equal(S.hp,groupHp);assert.equal(e.foes[2].hp,100);assert(e.foes.every(f=>!f.stunned));
// Killing the last enemy grants victory without scheduling an enemy attack.
fresh();begin();S.enc.act.hp=S.enc.hp=3;const winHp=S.hp;answer('weak',.1);runFor(2);assert.equal(S.hp,winHp);assert.equal(S.enc,null);
// All letters must be typed, measured on the last one. A wrong letter doesn't restart the timer.
for(const [f,mul,block] of [[.1,1,true],[.3,2,false],[.6,1,false],[.8,.5,false]]){
 fresh();add('timmy');begin();const a=S.enc.act;g.pickFire();elapsed(f);const before=S.enc.tmr.t;g.spellKey('!');assert.equal(S.enc.tmr.t,before);
 for(const ch of S.enc.spell.word)g.spellKey(ch);flush(.51);assert.equal(a.hp,100-scope.KM.PartyAbilities.fire(S.party)*mul);assert.equal(S.enc.answerTiming.block,block);assert(!a.stunned);
}
// A full timer stays pending; late correct submissions still land half damage exactly once.
for(const kind of ['math','spell']){
 fresh();if(kind==='spell')add('timmy');begin();const a=S.enc.act,wrong=S.stats.wrong,hp=S.hp;
 if(kind==='math')g.pickAction('weak');else g.pickFire();elapsed(1);const q=S.enc.q;
 g.tickAnswerTimer(100);runFor(2);assert.equal(S.enc.q,q);assert.equal(S.enc.tmr.t,S.enc.tmr.secs);assert.equal(S.hp,hp);assert.equal(S.hunters,0);assert.equal(S.stats.wrong,wrong);
 if(kind==='math')right();else for(const ch of S.enc.spell.word)g.spellKey(ch);
 runFor(3);assert.equal(a.hp,100-(kind==='math'?g.weakDmg():scope.KM.PartyAbilities.fire(S.party))*.5);assert.equal(S.stats.wrong,wrong);assert.equal(S.hp,hp-1);
}
// Armour extends protection without being spent on a timing block. It is still consumed on a later hit.
fresh();begin();S.party[0].armor=2;answer('weak',.34);runFor(2);assert.equal(S.hp,2);assert.equal(S.party[0].armor,2);
answer('weak',.36);runFor(2);assert.equal(S.party[0].armor,1);assert.equal(S.hp,2);
// Weapon upgrades extend the selected attack's crit window; points retain their original bands.
fresh();begin();S.party[0].weapon=2;const upgraded=g.weakDmg();answer('weak',.34);flush(.22);assert.equal(S.enc.act.hp,100-upgraded*2);assert.equal(S.score,3);
const cap=scope.KM.Timing.windows({weapon:999,armour:999});assert.equal(cap.crit,.7);assert.equal(cap.block,.45);assert.equal(cap.normal,.75);
fresh();begin();g.pickAction('weak');elapsed(.05);S.enc.input=String(S.enc.problem.answer+1);g.submitAnswer();runFor(2);assert.equal(S.enc.act.hp,100);assert.equal(S.hp,g.maxHp()-1);assert.equal(S.hunters,1);
// Healing is never doubled or halved, and never stuns. Resurrection also stays one heart.
for(const f of [.1,.9]){fresh();add('frank');begin();S.hp=1;S.enc.lost=g.maxHp()-1;answer('heal',f);assert.equal(S.hp,3);assert(!S.enc.act.stunned);}
fresh();add('frank');add('frank');begin();S.enc.fallen=[g.followerFrom(D.recruitPool[0],150)];const beforeRez=S.hp;answer('resurrect',.1);assert.equal(S.hp,beforeRez+1);assert(!S.enc.act.stunned);
// Riddles: first try before 50% = double coins; every later band = normal coins, never attacks.
for(const f of [.1,.25,.49999,.5,.75,.99]){fresh();at('riddle');const e=S.enc,hp=S.hp,gold=e.st.gold;elapsed(f);g.answerRiddle(e.riddle.answer);assert.equal(S.gold,gold*(f<.5?2:1));assert.equal(S.hp,hp);assert.equal(S.enc,null);}
fresh();at('riddle');const r=S.enc;elapsed(.1);g.answerRiddle((r.riddle.answer+1)%r.riddle.choices.length);assert.equal(S.hunters,1);elapsed(.1);g.answerRiddle(r.riddle.answer);assert.equal(S.gold,0);
// Riddle reading never auto-submits, even with a full bar.
fresh();at('riddle');elapsed(.4);const clock=S.enc.tmr;g.renderRiddle();assert.equal(S.enc.tmr,clock);const rHp=S.hp,wrong=S.stats.wrong;g.tickAnswerTimer(clock.secs);assert.equal(S.stats.wrong,wrong);assert.equal(S.hunters,0);assert.equal(S.hp,rHp);assert.equal(S.enc.tmr.t,clock.secs);
g.answerRiddle(S.enc.riddle.answer);assert.equal(S.enc,null);assert.equal(S.hunters,0);assert.equal(S.hp,rHp);
// Scroll applies to just one maths problem on success, wrong answer, timeout OR cancelling.
assert.equal(D.spell.problems,1);
for(const outcome of ['right','wrong','timeout','back']){
 fresh();begin();S.spells=1;g.castSpell();assert.equal(S.spellLeft,1);assert.equal(S.spells,0);g.pickAction('weak');assert(S.enc.problem.stupid);
 if(outcome==='right')right();else if(outcome==='wrong'){S.enc.input=String(S.enc.problem.answer+1);g.submitAnswer();}else if(outcome==='timeout'){g.tickAnswerTimer(S.enc.tmr.secs);assert.equal(S.spellLeft,1);right();}else g.actions.mathBack();
 assert.equal(S.spellLeft,0,outcome);g.ask('normal',noop,noop,noop);assert(!S.enc.problem.stupid,outcome+' leaked into next sum');
}
// Cast during a question resets its timer and simplifies just that sum.
fresh();begin();g.pickAction('hard');elapsed(.8);S.spells=1;g.castSpell();assert(S.enc.problem.stupid);assert.equal(S.enc.tmr.t,0);right();assert.equal(S.spellLeft,0);g.ask('normal',noop,noop,noop);assert(!S.enc.problem.stupid);
// Pending scroll survives a typing challenge or riddle. Mead does not consume it either.
fresh();add('timmy');begin();S.spells=1;g.castSpell();g.pickFire();for(const ch of S.enc.spell.word)g.spellKey(ch);assert.equal(S.spellLeft,1);
fresh();S.spells=1;g.castSpell();at('riddle');g.answerRiddle(S.enc.riddle.answer);assert.equal(S.spellLeft,1);
fresh();begin();S.spellLeft=1;S.mead=2;S.enc.mead=true;g.pickAction('weak');right();assert.equal(S.spellLeft,1);g.ask('normal',noop,noop,noop);assert(S.enc.problem.stupid);
// Older saves with 5 remaining sums become one, preserving charges.
fresh();const old=g.core();old.spellLeft=5;old.spells=2;g.applyCore(old);assert.equal(S.spellLeft,1);assert.equal(S.spells,2);
// Missing/stale timers never grant crits; ticks are at the same exact fractions as the fill.
const q={};assert.equal(scope.KM.Timing.grade(null,q).multiplier,1);assert.equal(scope.KM.Timing.grade({q:{},t:0,secs:10},q).multiplier,1);
const markers=scope.KM.Timing.markers(2128,66,31.5);for(const f of [.25,.5,.75])assert(markers.includes('data-threshold="'+f+'"'));
// End-of-run score: all quarter boundaries and scroll deductions, including negative points.
for(const [f,points] of [[0,4],[.24999,4],[.25,3],[.49999,3],[.5,2],[.74999,2],[.75,1],[.99999,1]]){
 for(const scroll of [false,true]){
  fresh();begin();if(scroll){S.spells=1;g.castSpell();}answer('weak',f);assert.equal(S.score,points-(scroll?2:0));
  right();assert.equal(S.score,points-(scroll?2:0),'duplicate submission awarded points');
 }
 fresh();add('timmy');begin();g.pickFire();elapsed(f);for(const ch of S.enc.spell.word)g.spellKey(ch);assert.equal(S.score,points);g.spellKey('a');assert.equal(S.score,points);
 fresh();at('riddle');elapsed(f);const choice=S.enc.riddle.answer;g.answerRiddle(choice);assert.equal(S.score,f<.5?2:1);g.answerRiddle(choice);assert.equal(S.score,f<.5?2:1);
}
// Wrong/timeout/cancel produce no points and no extra scroll deduction.
for(const fail of ['wrong','timeout','back']){
 fresh();begin();S.spells=1;g.castSpell();g.pickAction('weak');
 if(fail==='wrong'){S.enc.input=String(S.enc.problem.answer+1);g.submitAnswer();}else if(fail==='timeout'){g.tickAnswerTimer(S.enc.tmr.secs);assert.equal(S.spellLeft,1);S.enc.input=String(S.enc.problem.answer+1);g.submitAnswer();}else g.actions.mathBack();
 assert.equal(S.score,0);assert.equal(S.spellLeft,0);
}
// Mead isn't a scroll penalty; pending scrolls don't penalise word/riddle answers.
fresh();begin();S.mead=2;S.enc.mead=true;S.spellLeft=1;answer('weak',.1);assert.equal(S.score,4);
fresh();add('timmy');begin();S.spellLeft=1;g.pickFire();elapsed(.6);for(const ch of S.enc.spell.word)g.spellKey(ch);assert.equal(S.score,2);
fresh();S.spellLeft=1;at('riddle');elapsed(.1);g.answerRiddle(S.enc.riddle.answer);assert.equal(S.score,2);
// Healing/recruitment/restraint maths use the same solution scoring. No points for simply choosing a move.
fresh();add('frank');begin();S.hp--;g.pickAction('heal');assert.equal(S.score,0);elapsed(.3);right();assert.equal(S.score,3);
fresh();at('recruit_frank');g.recruitFlow(S.enc.st,0,noop);elapsed(.6);right();assert.equal(S.score,2);
fresh();at('riddle');const rr=S.enc;g.answerRiddle((rr.riddle.answer+1)%rr.riddle.choices.length);assert.equal(S.score,0);elapsed(.6);g.answerRiddle(rr.riddle.answer);assert.equal(S.score,1);assert.equal(S.gold,0);
// Running score survives saves/checkpoints, including negatives; old saves start at zero.
fresh();S.score=-1;const scoreSave=JSON.parse(JSON.stringify(g.core()));g.applyCore(scoreSave);assert.equal(S.score,-1);delete scoreSave.score;g.applyCore(scoreSave);assert.equal(S.score,0);
S.score=27;g.gameOver('goblin',S.stops[0]);assert.match(nodes.get('panel').innerHTML,/Final score 27/);assert.match(nodes.get('panel').innerHTML,/data-final-score="27"/);
S.score=-1;g.showWin();assert.match(nodes.get('panel').innerHTML,/Final score 1/);assert.match(nodes.get('panel').innerHTML,/Victory!/);
// Two points per living member (hero included), computed only for the final result.
fresh();S.score=27;S.mode='win';assert.equal(g.scoreSummary().bonus,2);assert.equal(g.scoreSummary().total,29);
add('frank');add('timmy');add('executioner');assert.equal(g.scoreSummary().bonus,8);assert.equal(g.scoreSummary().total,35);
S.hp=1;assert.equal(g.scoreSummary().bonus,8,'wounded survivors count');S.party[1].dying={t:1};S.party[2].eaten=true;assert.equal(g.scoreSummary().bonus,4);
assert.equal(g.scoreSummary().total,31);assert.equal(S.score,27);g.scoreSummary();assert.equal(S.score,27,'redraw must not add the bonus again');
S.mode='gameover';assert.equal(g.scoreSummary().bonus,0);assert.equal(g.scoreSummary().total,27);
g.newGame();assert.equal(S.score,0);S.score=12;g.retry();assert.equal(S.score,0);
console.log('PASS: 4/3/2/1 maths and typing score; 2/1 riddle score; scroll -2 including negatives; no failure or duplicate awards; mead unaffected; save migration; final score on death/victory; new-run reset.');
console.log('PASS: all timing boundaries on weak/hard/execute/fire; one protected enemy turn; untouched enemies blocked; lethal/wrong/full-bar paths; unchanged healing/resurrection; timed riddle coin tiers/retry/late input; one-sum scroll success/wrong/timeout/cancel/mid-cast/save migration; marker alignment.');
`;
function execute(body){const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(body,__filename);}
execute(harness+checks);
execute(harness.replace("search:'?debug'","search:'?debug&notimer'")+`reset();at('goblin');flush(1);const a=S.enc.act,base=g.weakDmg();a.hp=S.enc.hp=100;g.pickAction('weak');S.enc.input=String(S.enc.problem.answer);g.submitAnswer();flush(.22);assert.equal(a.hp,100-base);assert(!a.stunned);assert.equal(S.score,1);`);
