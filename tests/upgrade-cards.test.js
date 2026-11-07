// Upgrade cards behind ?cards=1: offers at rest stops, one pick, effects and costs.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
const harness=fs.readFileSync(path.join(root,'tests/party-roles.test.js'),'utf8').split('const PA=')[0]
 .replace("search:'?debug&notimer'","search:'?debug&cards=1&halfhearts=1'")
 .replace("'src/modes/spelling.js'])run(f);","'src/modes/spelling.js','src/engine/balance-try.js','src/engine/upgrade-cards.js'])run(f);")
 .replace('submitAnswer};','submitAnswer,setChallengeMode,renderRest,takeCard,defeatEnemy};')
 .replace('s.enemy===id','s.enemy===id || s.rest===id || s.type===id');
const checks=`
run('src/modes/fellowship.js');
const BT=scope.KM.BalanceTry,K=scope.KM.Cards,F=scope.KM.Fellowship;
const advance=(sec=3)=>{for(let i=0;i<Math.ceil(sec/.02);i++)flush(.02);};
assert(BT.on('cards')&&BT.on('whoActs'),'cards turns on who acts');
function fresh(n=1,where='goblin'){
 reset();g.setChallengeMode('fellowship');S.routeVersion=3;S.runId='cards';S.stats={correct:0,wrong:0,riddles:0};S.score=0;S.scoreLedger=scope.KM.Score.empty();S.spells=0;S.spellLeft=0;S.mead=0;S.floats=[];S.cards=[];
 for(let i=1;i<n;i++)S.party.push(g.followerFrom(D.recruitPool[i-1],300));S.hp=g.maxHp();g.buildWorld(0);at(where);advance(3);return S.enc;
}
// offers: only cards the party can use; Embers needs a Firestarter
fresh(1,'campsite');
const ids=()=>K.offer(S).map(c=>c.id);
for(let i=0;i<20;i++)assert(!ids().includes('embers'));
g.renderRest();assert.match(nodes.get('panel').innerHTML,/openCards/);
S.enc.cardPick=true;g.renderRest();assert.match(nodes.get('panel').innerHTML,/takeCard/);
const pick=S.enc.cardOptions[0];g.takeCard(pick);assert.deepEqual(S.cards,[pick]);assert(S.enc.used.card);
g.renderRest();assert.doesNotMatch(nodes.get('panel').innerHTML,/openCards/,'one pick per stop');
// cleave: knights reach a third enemy, knight sums one level harder
S.cards=['cleave'];
const foes=[0,1,2].map(()=>({hp:50,maxHp:50}));
let plan=F.plan(S.party,foes,1,{knightTargets:K.knightTargets(S)});assert.equal(plan[0].impacts.length,3);
assert.equal(K.levelBonus(S,'knight'),1);
const l=BT.pickLeader(S.party,{foes:1},()=>0,r=>K.levelBonus(S,r));assert.equal(l.level,'plus_2');
// embers: firestarter sets burning, burning foes tick next volley
S.cards=['embers'];const timmy={id:'t',role:'firestarter',companionId:'timmy'};
const f2=[{hp:50,maxHp:50}];plan=F.plan([timmy],f2,1,{burn:K.burn(S)});assert.equal(f2[0].burning,1);
plan=F.plan([timmy],f2,1,{burn:K.burn(S)});assert(plan[0].impacts.some(h=>h.burn&&h.amount===1));
assert.equal(K.levelBonus(S,'firestarter'),2);
// swing and a miss: a miss chips one unit, never the last
let e=fresh(2);S.cards=['swing_and_a_miss'];const hp=S.hp;e.input=String(e.problem.answer+1);e.tmr.t=e.tmr.secs*.5;g.submitAnswer();advance(3);assert(S.hp<hp,'miss chips the ally');
// shield wall: clean fight refills armour
e=fresh(1);S.cards=['shield_wall'];S.party[0].armor=0;S.party[0].armorTop=2;e.lost=0;g.defeatEnemy();assert.equal(S.party[0].armor,2);
console.log('PASS: upgrade cards offered by party, one pick per stop, cleave reach + harder knight sums, embers burn ticks, swing chip, shield wall refill.');
`;
const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(harness+checks,__filename);
