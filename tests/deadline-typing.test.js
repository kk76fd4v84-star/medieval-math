// Regression (Magnus: "right answers marked wrong", worst on the dragons): a deadline foe's strike at a full bar
// must not swallow digits or Enter typed during the strike, and every generated sum's answer must match its text.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
const harness=fs.readFileSync(path.join(root,'tests/party-roles.test.js'),'utf8').split('const PA=')[0]
.replace("search:'?debug&notimer'","search:'?debug'")
.replace('submitAnswer};','submitAnswer,setChallengeMode,tickAnswerTimer,typeKey};');
const checks=`
function step(secs=3){for(let t=0;t<secs;t+=.05)flush(.05);}
function fresh(id){
 reset();S.stats={correct:0,wrong:0,riddles:0};S.view=null;S.toast=null;S.spellLeft=0;S.mead=0;S.floats=[];g.setChallengeMode('math');
 at('goblin');flush(1);const e=S.enc;e.act.id=id;e.act.hp=e.act.maxHp=e.hp=e.maxHp=100;e.foes=[e.act];S.hp=g.maxHp();return e;
}
const type=s=>{for(const ch of s)g.typeKey(ch);};
for(const id of ['rabid_dog','dragon','turd_dragon']){
 // whole answer and Enter typed while the foe strikes: kept, then submitted once the strike ends
 let e=fresh(id);g.pickAction('weak');const ans=String(e.problem.answer);g.tickAnswerTimer(99);
 assert.equal(e.phase,'deadline',id+' strikes at a full bar');type(ans);g.typeKey('enter');assert.equal(e.input,ans,id+' digits kept mid-strike');
 step();assert.equal(S.stats.wrong,0,id+' correct answer not marked wrong');assert.equal(S.stats.correct,1,id+' queued Enter submits after the strike');
 // first digit typed mid-strike, the rest after it: still the full answer
 e=fresh(id);g.pickAction('weak');e.problem={text:'9 + 5',answer:14,type:'add'};g.tickAnswerTimer(99);type('1');step();assert.equal(e.phase,'math');
 type('4');assert.equal(e.input,'14');g.typeKey('enter');assert.equal(S.stats.wrong,0);assert.equal(S.stats.correct,1,id+' split typing counts as right');
}
// every maths level (gradual ladder included): the answer is the value of the shown sum
const ev=t=>Function('return '+t.replace(/−/g,'-').replace(/×/g,'*').replace(/÷/g,'/'))();
for(const L of Object.keys(D.mathLevels))for(let i=0;i<400;i++){const p=scope.KM.MathGen.make(L);assert.equal(ev(p.text),p.answer,L+': '+p.text);}
for(let i=0;i<400;i++){const p=scope.KM.MathGen.multiply(i%2===0,[3,12]);assert.equal(ev(p.text),p.answer,p.text);}
console.log('PASS: deadline strikes keep typed digits and a queued Enter (rabid dog, dragon, turd dragon); every level\\'s answer equals its shown sum.');
`;
function execute(body){const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(body,__filename);}
execute(harness+checks);
