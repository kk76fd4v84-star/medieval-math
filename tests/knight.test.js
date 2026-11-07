// Exercise the playable card/maths/retaliation paths without touching browser storage.
const fs=require('fs'),path=require('path'),Module=require('module');
const R=process.env.GAME_ROOT||path.resolve(__dirname,'..');
let h=fs.readFileSync(R+'/tests/party-roles.test.js','utf8').split('const PA=')[0]
  .replace('submitAnswer};','submitAnswer,setChallengeMode,playKnight,armKnightScroll,restBuy,tickAnswerTimer};');
const checks=`
run('src/modes/knight.js');run('src/modes/knight-hand.js');run('src/engine/leaderboard.js');
const K=scope.KM.Knight,pa=scope.KM.PartyAbilities;
function start(){reset();g.setChallengeMode('knight');S.party[0].origin='villager';S.spells=0;S.spellLeft=0;S.mead=0;S.score=0;S.stats={correct:0,wrong:0};S.hp=g.maxHp();}
function battle(){at('goblin');flush(1);assert.equal(S.enc.phase,'cards');return S.enc;}
function steps(){for(let i=0;i<9;i++)flush(.7);}
function answer(ok){S.enc.input=String(ok?S.enc.problem.answer:S.enc.problem.answer+1000);g.submitAnswer();}
function add(id){S.party.push(g.followerFrom(D.companions[id],300));S.hp=g.maxHp();}
start();let e=battle(),foe=e.act;foe.hp=foe.maxHp=e.hp=e.maxHp=30;
const initial=K.library(S.party).find(c=>c.id==='hero:0');assert.equal(initial.name,'Stick jab');
const idle=e.deck.hand[1],next=e.deck.queue[0];g.playKnight(0,foe);assert.equal(e.phase,'math');assert.equal(e.q.back,null);
g.playKnight(1,foe);assert.equal(e.deck.pending,'hero:0');answer(true);assert.equal(foe.hp,30);
steps();assert.equal(e.phase,'cards');assert.equal(foe.hp,30-initial.damage);assert.equal(S.hp,1);assert.equal(e.deck.hand[0],next);assert.equal(e.deck.hand[1],idle);
g.playKnight(0,foe);answer(true);steps();assert.equal(S.hp,1,'guard absorbs the next hit only');assert.equal(e.cardGuard,0);
start();e=battle();S.spells=1;assert(g.armKnightScroll());assert.equal(S.spells,0);
g.playKnight(1);assert(e.problem.scrollAssisted);assert.equal(e.problem.level,'stupid');answer(false);steps();assert.equal(e.phase,'cards');assert.equal(S.spellLeft,0);assert.equal(S.hunters,1);assert(!e.deck.hand.includes('hero:1'));
start();add('frank');add('timmy');e=battle();e.act.hp=e.act.maxHp=e.hp=e.maxHp=99;
assert.equal(e.deck.hand.length,3);let all=K.library(S.party);assert.equal(all.filter(c=>!c.combo&&c.owners.length).length,6);assert(all.some(c=>c.name==='Holy fire'));
const fire=all.find(c=>c.name==='Holy fire');e.deck.hand[0]=fire.id;const hp=S.hp;
g.playKnight(0);assert.equal(e.phase,'math');assert.equal(e.q.level,'hard');answer(false);assert.equal(S.hp,hp-3);
const gone=S.party.pop();K.deal(e.deck,S.party);const ids=[...e.deck.hand,...e.deck.queue];assert(!ids.includes(fire.id));assert(!ids.some(id=>id.startsWith(gone.id+':')));
start();e=battle();const old=K.library(S.party)[0];const shop=D.restStops.types.shop;
e.st={type:'rest',rest:'shop',cands:[]};e.used={};S.gold=50;g.restBuy('weapon',0);assert.equal(S.party[0].weapon,1);
const upgrade=K.library(S.party)[0];assert.equal(old.id,upgrade.id);assert.equal(upgrade.name,'Sword thrust');assert(upgrade.damage>old.damage);
start();e=battle();const other={...e.act,x:e.act.x+100,hp:20,maxHp:20};e.foes.push(other);const firstHp=e.act.hp;
g.playKnight(0,other);answer(true);flush(.35);assert.equal(e.act.hp,firstHp);assert.equal(other.hp,17);
start();add('executioner');add('darkWizard');all=K.library(S.party);assert(all.some(c=>c.name==='Storm axe'));const deck=K.create(S.party,()=>.3);
for(let i=0;i<60;i++){const id=deck.hand[i%3],queued=deck.queue[0];assert(K.commit(deck,i%3));assert(!K.commit(deck,0));K.deal(deck,S.party);assert.equal(deck.hand[i%3],queued);assert.equal(deck.queue.at(-1),id);assert.equal(new Set([...deck.hand,...deck.queue]).size,all.length);}
const save=scope.KM.Save,lb=scope.KM.Leaderboard;for(const mode of ['math','knight']){g.setChallengeMode(mode);save.write({...g.core(),name:mode});lb.record({id:'same',name:mode,mode,score:10});}
for(const mode of ['math','knight']){g.setChallengeMode(mode);assert.equal(save.load().name,mode);assert.equal(lb.list(mode).length,1);assert.equal(lb.list(mode)[0].name,mode);}
console.log('PASS Knight: card commit → maths → combat → one refill, guard, scroll, failure, combos and casualties, real shop upgrades, selected enemy, independent saves and boards.');
`;
const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(h+checks,__filename);
