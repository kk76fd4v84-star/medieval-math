// Exercise the shipped encounter resolver; no audio, server or real player save.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const root=process.env.GAME_ROOT||path.join(__dirname,'..');
const harness=fs.readFileSync(path.join(root,'tests/party-roles.test.js'),'utf8').split('const PA=')[0]
 .replace('submitAnswer};','submitAnswer,setChallengeMode,playKnight,armKnightScroll,enemyTurn,intentDamage};');
const checks=`
run('src/modes/knight.js');run('src/modes/knight-hand.js');
const thirds=new Set();for(let i=0;i<80;i++){
 const road=scope.KM.Progression.route('seed-'+i,3),f=road.filter(s=>['math','boss','mega'].includes(s.type));
 assert.equal(f.length,12);assert.deepEqual(Array.from(f.slice(0,7),s=>s.group.length+1),[1,3,1,1,2,1,3]);
 assert.equal(f[0].enemy,'rabid_squirrel');assert.equal(f[1].id,'squirrel-pack');assert(f[1].relay);
 assert.deepEqual(Array.from([f[1].enemy,...f[1].group]),Array(3).fill('rabid_squirrel'));
 thirds.add(f[2].enemy);
 for(const version of [1,2]){const originals=scope.KM.Progression.route('seed-'+i,version).filter(s=>s.type==='math').slice(0,3);assert(originals.every(s=>!s.group.length));assert.equal(new Set(originals.map(s=>s.enemy)).size,3);}
}assert.deepEqual(thirds,new Set(['rabid_dog','killer_rabbit']));
function pack(mode='knight'){reset();g.setChallengeMode(mode);S.routeVersion=3;S.runId='pack-test';S.party[0].origin='villager';S.spells=1;S.spellLeft=0;S.mead=0;g.buildWorld(0);at('squirrel-pack');flush(1);return S.enc;}
function advance(){for(let i=0;i<10;i++)flush(.7);}
function order(e){return e.foes.slice().sort((a,b)=>a.homeX-b.homeX);}
for(const mode of ['math','knight']){
 const e=pack(mode),[first,middle,last]=order(e);assert.equal(e.packAttacker,last);
 assert.equal(g.intentDamage(e,first),0);assert.equal(g.intentDamage(e,last),1);
 g.enemyTurn();advance();assert.equal(S.hp,1,'exactly one bite');assert.equal(e.packAttacker,first);
 first.stunned=true;g.enemyTurn();advance();assert.equal(S.hp,1,'stunned attacker gives no substitute bite');assert.equal(e.packAttacker,middle);
}
const e=pack(),[first,middle,last]=order(e);g.armKnightScroll();assert.equal(e.packAttacker,last,'scroll cannot reroll intent');
g.playKnight(0,last);e.input=String(e.problem.answer);g.submitAnswer();advance();assert.equal(last.hp,0);assert.equal(S.hp,2);assert.equal(e.packAttacker,first);
g.playKnight(1,middle);e.input=String(e.problem.answer);g.submitAnswer();advance();assert.equal(middle.hp,0);assert.equal(S.hp,2);assert.equal(e.packAttacker,first,'correct answer blocks the sole survivor');
console.log('PASS: seeded new and legacy openings; rear squirrel telegraphs first; only the planned bite lands; death or stun cancels it; scroll leaves intent alone; both modes.');
`;
const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(harness+checks,__filename);
