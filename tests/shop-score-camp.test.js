// Actual game handlers in a silent VM. No live save, browser, music or voice is touched.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
let harness=fs.readFileSync(path.join(root,'tests/party-roles.test.js'),'utf8');
harness=harness.slice(0,harness.indexOf('const PA='))
.replace("search:'?debug&notimer'","search:'?debug'")
.replace('submitAnswer};','submitAnswer,restRecruit,restBuy,chooseGear,assignGear,tickAnswerTimer,scoreSummary,awardScore,campDeparturePose};')
.replace('s.enemy===id','s.enemy===id || s.rest===id');
const checks=`
const sounds=[];scope.KM.Audio.play=e=>sounds.push(e);
const score=scope.KM.Score;
function fresh(){reset();S.view=null;S.score=0;S.scoreLedger=score.empty();S.gold=100;S.spells=0;S.spellLeft=0;S.fid=0;}
// The filled timer waits for an answer; an incorrect answer leaves without dice. Departure is rear-facing and shrinks/upwards.
for(const timeout of [false,true]){
 fresh();const st=at('campsite'),candidate=S.actors.find(a=>a.stop===S.stop&&a.candIdx===0);assert(candidate);
 candidate.active=true;g.restRecruit(0);assert.equal(S.enc.phase,'math');
 if(timeout){g.tickAnswerTimer(S.enc.tmr.secs+1);assert.equal(S.enc.phase,'math');assert(st.cands[0]);}
 S.enc.input=String(S.enc.problem.answer+1);g.submitAnswer();
 assert.equal(S.enc.phase,'rest');assert.equal(S.enc.contest,null);assert(!st.cands[0]);assert(S.restUses[st.idx].recruitLeft);assert.equal(candidate.state,'campLeave');assert.equal(S.dice.length,0);assert.equal(S.hunters,1);assert.equal(S.party.length,1);
 const start=g.campDeparturePose(candidate);g.update(2);const mid=g.campDeparturePose(candidate);assert(mid.y<start.y);assert(mid.scale<start.scale);assert(mid.x>start.x);g.update(5);assert.equal(candidate.departure.t,4.5);
 const end=g.campDeparturePose(candidate);assert(Math.abs(end.scale-.16)<1e-9);assert(!candidate.dead);
 const saved=JSON.parse(JSON.stringify(g.core()));g.applyCore(saved);assert.equal(S.stops[st.idx].cands.length,0,'failed camper must not respawn');
}
// Camp success still recruits one member. Non-camp failure still offers dice.
fresh();at('campsite');g.restRecruit(0);S.enc.input=String(S.enc.problem.answer);g.submitAnswer();assert.equal(S.party.length,2);assert(!S.restUses[S.stop]?.recruitLeft);
fresh();at('recruit_frank');g.recruitFlow(S.enc.st,0,noop);S.enc.q.onWrong();assert.equal(S.enc.phase,'contestOffer');
// Smith hits only on an actual gear purchase, after choosing its recipient.
fresh();at('shop');sounds.length=0;g.chooseGear('weapon');assert(!sounds.includes('buy_gear'));g.assignGear(0);assert.equal(S.party[0].weapon,1);assert.equal(sounds.filter(x=>x==='buy_gear').length,1);
g.restBuy('armor',0);assert.equal(S.party[0].armor,1);assert.equal(sounds.filter(x=>x==='buy_gear').length,2);
S.gold=0;g.restBuy('weapon',0);assert.equal(sounds.filter(x=>x==='buy_gear').length,2);S.gold=100;S.party[0].weapon=99;g.restBuy('weapon',0);assert.equal(sounds.filter(x=>x==='buy_gear').length,2);
// The ledger reconciles exactly, including old saves, negative scores and survivor bonuses.
fresh();for(let points=1;points<=4;points++)g.awardScore({points},'math');g.awardScore({points:4},'word');g.awardScore({riddlePoints:2},'riddle');g.awardScore({riddlePoints:1},'riddle');g.awardScore({points:1},'math',true);
assert.equal(S.score,16);assert.equal(S.scoreLedger.scrolls,1);assert.equal(S.scoreLedger.penalty,2);assert.equal(S.scoreLedger.answers[3],2);
S.mode='win';const summary=g.scoreSummary(),rows=score.rows(S.scoreLedger,S.score,summary.survivors);assert.equal(rows.reduce((n,r)=>n+r.points,0),18);assert(rows.some(r=>r.points===-2));assert(!rows.some(r=>r.label.startsWith('Earlier')));
const saved=JSON.parse(JSON.stringify(g.core()));S.scoreLedger=score.empty();g.applyCore(saved);assert.equal(S.scoreLedger.answers[3],2);saved.score=7;delete saved.scoreLedger;g.applyCore(saved);assert.equal(score.rows(S.scoreLedger,S.score,0)[0].points,7);
assert.equal(score.rows(score.empty(),-1,0)[0].points,-1);
assert.equal(score.rows(score.empty(),0,4).reduce((n,r)=>n+r.points,0),8);
console.log('PASS: camp failure/timeout departures and persistence; camp success and roadside dice; purchase-only smith SFX; score ledger, old saves, penalties and survival reconciliation.');
`;
const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(harness+checks,__filename);
