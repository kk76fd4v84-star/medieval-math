// Silent checks of real maths entry points and timeout callbacks, including tavern questions.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
let harness=fs.readFileSync(path.join(root,'tests/party-roles.test.js'),'utf8');
harness=harness.slice(0,harness.indexOf('const PA='))
 .replace("search:'?debug&notimer'","search:'?debug'")
 .replace('submitAnswer};','submitAnswer,tickAnswerTimer,timerPause,dividerFill,ask,recruitFlowTalk};')
 .replace('s.enemy===id','s.enemy===id || s.rest===id');
const checks=`
function add(id){S.party.push(g.followerFrom(D.companions[id],300));S.hp=g.maxHp();}
function began(){at('goblin');flush(1);}
function runs(secs=S.enc.tmr.secs){assert(S.enc.tmr);assert.equal(S.enc.tmr.q,S.enc.q);assert.equal(S.enc.tmr.secs,secs);const t=S.enc.tmr.t;g.tickAnswerTimer(.2);assert.equal(S.enc.tmr.t,t+.2);}
for(const move of ['weak','hard','heal','execute','resurrect']){
 reset();if(move==='heal'||move==='resurrect')add('frank');if(move==='resurrect')add('frank');if(move==='execute')add('executioner');began();
 if(move==='heal')S.hp--;if(move==='execute')S.enc.act.hp=S.enc.act.maxHp/2;if(move==='resurrect')S.enc.fallen=[g.followerFrom(D.recruitPool[0],300)];
 g.pickAction(move);runs();
}
for(const place of ['recruit_frank','campsite','shop']){reset();const st=at(place);if(!st.cands.length)st.cands=[{...D.recruitPool[0]}];g.recruitFlow(st,0,noop);runs();}
reset();const tavern=at('tavern');S.view={id:'tavern-interior',a:1,to:1};g.recruitFlowTalk(tavern,0);runs();assert.equal(g.timerPause(S.enc),null);
// Full bars wait on all recruitment/restraint questions; only a wrong submission runs failure logic.
const hp=S.hp,wrong=S.stats.wrong,q=S.enc.q;g.tickAnswerTimer(S.enc.tmr.secs);assert.equal(S.enc.phase,'math');assert.equal(S.enc.q,q);assert.equal(S.hunters,0);assert.equal(S.hp,hp);assert.equal(S.stats.wrong,wrong);assert(!S.tavernRecruits[tavern.idx]);
S.view=null;S.enc.input=String(S.enc.problem.answer+1);g.submitAnswer();assert.equal(S.hunters,1);
reset(true);at('frank');g.frankNo();runs();g.tickAnswerTimer(S.enc.tmr.secs);assert.equal(S.hunters,0);assert.equal(S.enc.phase,'math');S.enc.input=String(S.enc.problem.answer+1);g.submitAnswer();assert.equal(S.hunters,1);flush(1);assert.equal(S.enc.phase,'enterDragon');
// Fresh questions and scroll replacements immediately clear the previous fill and elapsed time.
reset();began();g.pickAction('weak');g.tickAnswerTimer(2);S.spells=1;S.spellLeft=0;g.castSpell();assert.equal(S.enc.tmr.t,0);assert.equal(nodes.get('dvfill').style.opacity,'0');runs();
let expired=0;g.ask('normal',noop,()=>expired++,noop);g.tickAnswerTimer(35);assert.equal(expired,0);g.tickAnswerTimer(2);assert.equal(expired,0);g.ask('normal',noop,noop,noop);assert.equal(nodes.get('dvfill').style.opacity,'0');assert.equal(S.enc.tmr.t,0);
S.enc.input=String(S.enc.problem.answer);g.submitAnswer();g.tickAnswerTimer(40);assert.equal(expired,0);assert.equal(nodes.get('dvfill').style.opacity,'0');
// Active holds are bounded, dead foes do not hold it, and a static room is not a transition.
reset();began();g.pickAction('weak');S.enc.act.act={name:'attack',dur:1e9};g.tickAnswerTimer(1);assert.equal(S.enc.tmr.t,0);g.tickAnswerTimer(3);assert(S.enc.tmr.t>0);S.enc.act.dead=true;assert.equal(g.timerPause(S.enc),null);
reset();add('timmy');began();g.pickFire();runs(D.items.fireBottle.spellSecs);
for(const f of [0,.25,.5,1]){g.dividerFill(f);const style=nodes.get('dvfill').style;assert.equal(style.width,(f*100)+'%');assert.equal(style.opacity,f?'1':'0');}
console.log('PASS: timers advance for every combat action, roadside/camp/shop/tavern recruits and Frank; full bars wait; explicit failure consequences once; scroll/fresh reset; room and stale holds; typing timer; left-to-right fill.');
`;
function execute(body){const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(body,__filename);}
execute(harness+checks);
execute(harness.replace("search:'?debug'","search:'?notimer'")+`reset();at('goblin');flush(1);g.pickAction('weak');assert(S.enc.tmr,'normal game cannot disable its timer with notimer alone');`);
execute(harness.replace("search:'?debug'","search:'?debug&notimer'")+`reset();at('goblin');flush(1);g.pickAction('weak');assert(!S.enc.tmr,'explicit untimed debug previews remain available');`);
