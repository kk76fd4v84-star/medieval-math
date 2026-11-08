// Brawl mode (src/brawl.js): ghost records, matchmaking (easy -> hard, up after a win), replay, route, the ghost clock.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
function load(on){
  const mem={},ctx={localStorage:{getItem:k=>k in mem?mem[k]:null,setItem:(k,v)=>{mem[k]=String(v);}},document:{querySelector:()=>({content:'test-build'})}};
  ctx.window=ctx;vm.createContext(ctx);
  for(const f of ['src/data/combat.js','src/data/brawl.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
  vm.runInContext(`KM={BalanceTry:{on:k=>k==='brawl'&&${on}},PartyAbilities:{role:m=>m.role||'knight',life:()=>2},Assets:{loadImg:src=>({src,_ok:true})}};KM_ART={entities:{hero:{seq:{idle:'stand_hero'}},follower_4:{seq:{idle:'stand_stripe'}}}};KM_ART7={sequences:{stand_hero:{img:'assets/v10/walks/hero-walk.png'},stand_stripe:{img:'assets/v10/walks/stripe-walk.png'}}};`,ctx);
  vm.runInContext(fs.readFileSync(path.join(root,'src/brawl.js'),'utf8'),ctx);
  const B=ctx.KM.Brawl,S={runId:'r1',name:'Magnus',challengeMode:'fellowship',chapter:'village',stop:7,party:[{name:'Magnus',role:'knight',weapon:1}],meterGear:{}};
  B.init({S,T:s=>s,say(){},shortName:s=>s,artId:m=>m.art||'hero'});return {B,S,mem,D:ctx.KM_DATA.brawl};
}
const J=x=>JSON.parse(JSON.stringify(x));
// matchmaking: seeds ranked easy -> hard, start at the easiest, one step up per ghost beaten
{ const {B,D}=load(true),list=B.pool();
  assert.deepEqual(list.map(r=>r.name),D.seeds.map(s=>s.name),'seed ghosts rank easy -> hard by skill');
  for(let i=1;i<list.length;i++)assert(B.skill(list[i])>B.skill(list[i-1]));
  assert.equal(B.opponent(list,0).name,D.seeds[0].name,'start against the easiest');
  B.won({type:'math',brawl:{}});B.won({type:'math',brawl:{}});
  const road=Array.from({length:14},(_,i)=>({type:'math',enemy:'goblin',idx:i}));
  const ghosts=B.route(road,{runId:'seed-check'}).filter(st=>st.brawl);
  assert(ghosts.length>0,'ghost stops on the road');assert.equal(ghosts[0].brawl.step,2,'after two wins the next ghost is two steps up');
  assert.equal(ghosts[0].brawl.name,'Sir '+list[2].name);
  assert.deepEqual(J(B.route(road,{runId:'seed-check'})),J(B.route(road,{runId:'seed-check'})),'same run, same road');
  for(const g of ghosts){assert.equal(g.type,'math');assert(['sighting','ambush'].includes(g.brawl.kind));
    const rec=list.find(r=>r.runId===g.brawl.ghost);assert.deepEqual(J([g.enemy,...g.group]),J(B.members(rec).map(m=>m.art)),'the whole ghost team stands on the road');} }
// the ghost team: recorded art first, else by role; leader = the hero art; plain knights take the follower looks in turn
{ const {B,D}=load(true),lady=B.pool().find(r=>r.name==='Quicksum');
  assert.deepEqual(J(B.members(lady).map(m=>m.art)),[D.art.leader,D.art.darkWizard,D.art.priest,D.art.knight[0]]);
  assert.equal(B.members(lady)[0].name,'Sir Quicksum','one Sir, added in one place');assert.equal(B.members({name:'Sir Brisk',party:[]})[0].name,'Sir Brisk','never Sir Sir');
  assert.deepEqual(J(B.members({name:'X',party:[{role:'knight',art:'hero_starter'},{role:'knight',art:'follower_3'}]}).map(m=>m.art)),['hero_starter','follower_3']);
  assert.equal(B.members({name:'X',party:Array(6).fill({role:'knight'})}).length,4,'at most four, like the enemy row');
  // its hearts row: two per member, lit by the team's health left
  const S={stop:3,enc:{st:{brawl:{ghost:lady.runId}}},actors:[0,1,2,3].map(k=>({stop:3,ghost:true,extra:k||undefined,hp:k<2?0:6,maxHp:6}))};
  B.init({S,T:s=>s,say(){}});const h=B.team();assert.equal(h.members.length,4);assert.equal(h.hp,4,'half the team health = 4 of 8 hearts');
  assert.equal(h.armour,0);assert.deepEqual(Object.keys(h).sort(),['armour','hp','members'],'only hearts beside the hearts: no name, no icon'); }
// difficulty: 1..10 from skill, seeds spread easy -> hard, a row of `count` icons with N lit
{ const {B,D}=load(true),seeds=B.pool().filter(r=>r.player==='seed'),n=seeds.map(B.rating);
  assert.deepEqual(J(n),[1,2,4,4,7,10],'seed ratings: '+n);for(let i=1;i<n.length;i++)assert(n[i]>=n[i-1]);
  assert.equal(B.rating({answers:[]}),1,'no answers: 1');assert.equal(B.rating({answers:[{op:'+',ms:500,correct:true}]}),D.rating.count,'clamped to the top');
  assert(D.rating.icon.length>10,'placeholder icon entry');
  const T=t=>B.tier(t)&&B.tier(t).img;assert.equal(T(1),D.rating.tiers[0].img);assert.equal(T(10),D.rating.tiers.at(-1).img);
  const keep=D.rating.tiers;D.rating.tiers=[{minRating:1,img:'a'},{minRating:3,img:'b'},{minRating:5,img:'c'},{minRating:7,img:'d'},{minRating:9,img:'e'}];
  assert.deepEqual([1,2,3,4,5,6,7,8,9,10].map(T).join(''),'aabbccddee','five tiers: no code change');D.rating.tiers=keep; }
// replay: the ghost's own answers for that operator in recorded order, looping; others fall back to all answers
{ const {B}=load(true),rec={answers:[{op:'+',ms:2000,correct:true},{op:'×',ms:5000,correct:false},{op:'+',ms:3000,correct:true}]},next=B.replay(rec);
  assert.deepEqual([next('+').ms,next('+').ms,next('+').ms],[2000,3000,2000]);assert.equal(next('×').ms,5000);assert.equal(next('÷').ms,2000);
  // the ghost clock: a right answer sets the bar to its time (clamped); a wrong one keeps the usual time
  const sure=B.pool().find(r=>r.answers.find(x=>x.op==='+').correct),e={st:{brawl:{ghost:sure.runId}},revealed:true,problem:{text:'3 + 4'},act:{}};
  const b=B.secs(e,20);assert(b>=1.5&&b<=12,'ghost time in bounds: '+b);
  assert.equal(B.secs({st:{},revealed:true,problem:{text:'3 + 4'}},20),20,'not a ghost fight: unchanged');
  const w={st:{brawl:{ghost:'x'}},revealed:true,problem:{text:'3 + 4'},act:{},ghostNext:()=>({ms:900,correct:false})};assert.equal(B.secs(w,20),20,'wrong ghost answer: usual time'); }
// recording: Cobra's run shape, saved at the run end, then part of the pool
{ const {B,S,mem}=load(true);
  B.answered({problem:{text:'6 × 7'},q:{level:'hard'},tmr:{t:3.25},answerTiming:{grade:'crit'}},true);B.answered({problem:{text:'9 − 4'},q:{},tmr:{t:6}},false);
  B.won({type:'boss'});B.runEnd(S,true);
  const [rec]=JSON.parse(mem['knightMath.brawl.runs']);
  assert.deepEqual(Object.keys(rec).sort(),['answers','build','createdAt','gear','mode','name','party','player','result','runId','v'].sort());
  assert.equal(rec.v,1);assert.deepEqual(rec.answers[0],{op:'×',a:6,b:7,level:'hard',ms:3250,correct:true,outcome:'crit'});
  assert.equal(rec.party[0].art,'hero');assert.deepEqual(rec.result,{area:'village',depth:7,bossesKilled:1,died:true});assert.deepEqual(rec.gear,{weapon:1,armour:0,helm:0,lantern:0});
  assert(B.pool().some(r=>r.runId==='r1'),'the recorded run joins the ghost pool'); }
// the ghost look: Maggi's sheets, one per art id, swapped in for that art's own sheet only; no sheet = the original
{ const {B,D}=load(true);
  for(const id of ['hero','hero_starter','follower_1','follower_2','follower_3','frank','timmy','executioner','dark_wizard'])assert(fs.existsSync(path.join(root,D.sheets[id])),'ghost sheet for '+id);
  assert.equal(B.sheet({src:'http://x/assets/v10/walks/hero-walk.png'},'hero').src,D.sheets.hero,'a ghost knight draws the black sheet');
  assert.equal(B.sheet({src:'http://x/assets/other.png'},'hero'),null,'other images (e.g. the rear atlas) stay');
  assert.equal(B.sheet({src:'http://x/assets/v10/walks/stripe-walk.png'},'follower_4'),null,'no sheet yet: the original, untinted');
  const src=fs.readFileSync(path.join(root,'src/brawl.js'),'utf8');assert(!/getImageData|hsl\(/.test(src),'no code recolour'); }
// on screen a rival party is just another party: no ghost / spooky words in any shown string (Magnus); "ghost" stays in code
{ const {D}=load(true),shown=[];const walk=v=>typeof v==='string'?shown.push(v):v&&typeof v==='object'&&Object.values(v).forEach(walk);
  walk(D.lines);D.seeds.forEach(s=>shown.push(s.name));
  for(const s of shown)assert(!/ghost|spect|phantom|spirit|haunt|undead|wraith|spook|see-through|pale|grey|gray/i.test(s),'on-screen brawl text: '+s);
  const src=fs.readFileSync(path.join(root,'src/brawl.js'),'utf8');
  assert(!/(label|note): *['"`][^'"`]*ghost/i.test(src),'no ghost wording in card labels'); }
// switch off: no effect at all
{ const {B,mem}=load(false),road=[{type:'math'},{type:'math'},{type:'math'},{type:'math'},{type:'math'},{type:'math'},{type:'math'}];
  assert.equal(B.route(road,{runId:'x'}),road);assert.equal(B.team(),null);B.answered({problem:{text:'1 + 1'}},true);B.won({brawl:{}});assert.deepEqual(Object.keys(mem),[]); }
console.log('PASS: brawl: seeds easy -> hard, matchmaking steps up per win, deterministic ghost stops, the ghost team (art + hearts + sheets), per-operator replay + ghost clock, run record format, off = no effect.');
