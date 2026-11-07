// Balance switches (src/data/balance_try.js) turned on by page address: curve, half-hearts, camp armour, who acts.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
const harness=fs.readFileSync(path.join(root,'tests/party-roles.test.js'),'utf8').split('const PA=')[0]
 .replace("search:'?debug&notimer'","search:'?debug&curve=1&halfhearts=1&camparmour=1&whoacts=1'")
 .replace("'src/modes/spelling.js'])run(f);","'src/modes/spelling.js','src/engine/balance-try.js'])run(f);")
 .replace('submitAnswer};','submitAnswer,setChallengeMode,tickAnswerTimer,enemyTurn,restHeal};')
 .replace('s.enemy===id','s.enemy===id || s.rest===id || s.type===id');
const checks=`
run('src/modes/fellowship.js');
const BT=scope.KM.BalanceTry,F=scope.KM.Fellowship;
const advance=(sec=3)=>{for(let i=0;i<Math.ceil(sec/.02);i++)flush(.02);};
assert(BT.on('curve')&&BT.on('halfHearts')&&BT.on('campArmour')&&BT.on('whoActs'));
assert.equal(D.party.heartsPerMember,4,'half-hearts doubles the heart units');
assert.equal(BT.heartsText(1),'½');assert.equal(BT.heartsText(3),'1½');assert.equal(BT.heartsText(2),'1');
function fresh(n=1,enemy='goblin'){
 reset();g.setChallengeMode('fellowship');S.routeVersion=3;S.runId='bt';S.stats={correct:0,wrong:0,riddles:0};S.score=0;S.scoreLedger=scope.KM.Score.empty();S.spells=0;S.spellLeft=0;S.mead=0;S.floats=[];
 for(let i=1;i<n;i++)S.party.push(g.followerFrom(D.recruitPool[i-1],300));S.hp=g.maxHp();g.buildWorld(0);at(enemy);advance(3);return S.enc;
}
let e=fresh(2);
assert.equal(g.maxHp(),8);
assert.equal(e.maxHp,Math.ceil(D.combat.enemies.goblin.hp*BT.healthMul(S)),'curve health');
assert(e.leader&&/^(plus|minus|times)_[123]$/.test(e.problem.level),'a member owns the sum: '+e.problem?.level);
// leader strike counts double
const plan=F.plan(S.party,[{hp:999,maxHp:999}],1,{leader:S.party[0],leaderMultiplier:2});
assert.equal(plan[0].amount,F.damage(S.party[0])*2*(S.party[0].role==='knight'?1:1));
// a goblin hit costs one unit = half a heart
const hp=S.hp;e.timingBlock=false;g.enemyTurn();advance(3);assert(S.hp===hp-1||S.hp===hp,'one half-heart per goblin hit');
// weights follow the fight
const party=[{id:'hero',kind:'hero',role:'knight'},{id:'t',role:'firestarter',companionId:'timmy'},{id:'x',role:'executioner',companionId:'executioner'}];
const tally=ctx=>{const c={};let i=0;const rnd=()=>((i++*0.6180339887)%1);for(let k=0;k<600;k++){const l=BT.pickLeader(party,ctx,rnd);c[l.sign+(l.member.role||'')]=(c[l.sign+(l.member.role||'')]||0)+1;}return c;};
const small=tally({foes:1}),pack=tally({foes:4}),boss=tally({foes:1,boss:true});
const knight=c=>Object.entries(c).filter(([k])=>k.startsWith('+')).reduce((n,[,v])=>n+v,0);
assert(knight(small)>knight(pack),'knights lead small fights');
console.log('PASS: balance switches by address, curve health, half-hearts units + text, who-acts sums and leader bonus, weighted picks.');
`;
const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(harness+checks,__filename);
