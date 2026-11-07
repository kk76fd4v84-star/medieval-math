// Real casualty/resurrection paths, profile persistence, and many deaths at one location.
const fs=require('node:fs'),path=require('node:path');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
let harness=fs.readFileSync(path.join(root,'tests/party-roles.test.js'),'utf8');
harness=harness.slice(0,harness.indexOf('const PA='));
harness=harness.replace('submitAnswer};','submitAnswer,buryCompanion,buildCompanionGraves};');
const checks=`
const store=scope.KM.Save,gr=scope.KM.CompanionGraves;
memory.set(store.PKEY,JSON.stringify({version:4,deaths:[{deathId:'hero-old',x:100}],best:{leagues:9},music:{muted:true}}));
assert.equal(store.profile().version,5);assert.equal(store.deaths().length,1);assert.equal(store.best().leagues,9);assert.equal(store.companionGraves().length,0);
reset(true);at('goblin');flush(1);const m=S.party[1];g.memberDies(m,noop,'goblin');g.memberDies(m,noop,'goblin');flush(2);
assert.equal(store.companionGraves().length,1);assert.equal(S.companionGraves.length,1);assert.equal(S.party.length,1);assert.equal(store.deaths().length,1);
const first=JSON.stringify(S.companionGraves[0]);g.buildCompanionGraves();assert.equal(JSON.stringify(S.companionGraves[0]),first);
store.clear();assert.equal(store.companionGraves().length,1);
g.buryCompanion(S.party[0],'goblin');assert.equal(store.companionGraves().length,1);
// Every companion, including a sacrificed priest, gets a simple marker.
reset(true);at('goblin');flush(1);g.renderSacrifice();g.doSacrifice(S.party[1].id);assert.equal(store.companionGraves().length,2);
// Resurrection removes only that exact death, leaving earlier graves untouched.
reset(true);S.party.push(g.followerFrom(D.companions.frank,200));S.party.push(g.followerFrom(D.recruitPool[0],100));S.hp=g.maxHp();at('goblin');flush(1);
g.memberDies(S.party[3],noop,'goblin');flush(2);assert.equal(store.companionGraves().length,3);assert(g.canResurrect());
g.turnRight('resurrect');assert.equal(store.companionGraves().length,2);assert.equal(S.companionGraves.length,2);assert(!S.party[3].graveId);
const many=[];for(let i=0;i<120;i++){const d={deathId:'grave-'+i,wx:10000+i%3*150};Object.assign(d,gr.place(d,many));many.push(d);}
assert.equal(new Set(many.map(d=>d.layer)).size,3);
for(let i=0;i<many.length;i++)for(let j=0;j<i;j++)if(many[i].layer===many[j].layer){
 const p=gr.position(many[i],10000),q=gr.position(many[j],10000);assert(Math.abs(p.x-q.x)>=130);
}
for(const d of many.slice(0,3)){const p=gr.position(d,10000),q=gr.position(d,10100);assert(q.x<p.x);assert(Math.abs((p.x-q.x)-100*p.speed)<1e-8);}
console.log('PASS: companion-only graves, actual deaths and sacrifice, deduplication, resurrection cleanup, persistent/migrated profiles, 120 spaced markers in 3 depth layers, correct parallax direction.');
`;
const Module=require('node:module'),m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(harness+checks,__filename);
