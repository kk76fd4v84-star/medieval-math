// Integration coverage for the staged roguelite rules. Runs without browser, audio or saved-user data.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
let harness=fs.readFileSync(path.join(root,'tests/party-roles.test.js'),'utf8');
harness=harness.slice(0,harness.indexOf('const PA='))
 .replace('submitAnswer};','submitAnswer,defeatEnemy,restHeal,restBuy,renderRest,canRecruit,retry,ask,hearts};')
 .replace('s.enemy===id','s.enemy===id || s.rest===id');
const checks=`
const P=scope.KM.Progression,PA=scope.KM.PartyAbilities;
const small=new Set(['rabid_squirrel','rabid_dog','killer_rabbit']);let openings=new Set();
for(let seed=0;seed<100;seed++){
 const route=P.route('test'+seed),foes=route.filter(s=>['math','boss','mega'].includes(s.type));
 assert.equal(foes.length,12);assert.equal(new Set(foes.slice(0,3).map(s=>s.enemy)).size,3);
 assert(foes.slice(0,3).every(s=>small.has(s.enemy)&&s.group.length===0));
 assert.equal(foes[3].enemy,'rabid_villager');assert.equal(foes[5].enemy,'goblin');
 assert.deepEqual(Array.from(foes.slice(-3),s=>s.enemy),['ogre','black_knight','dragon']);
 assert(route.findIndex(s=>s.rest==='shop')<route.findIndex(s=>s.type==='boss'));
 assert.equal(route.filter(s=>s.rest==='campsite').length,2);
 assert.deepEqual(Array.from(route.filter(s=>s.rest==='shop'),s=>s.shopTier),[1,2,3]);
 assert.equal(JSON.stringify(route),JSON.stringify(P.route('test'+seed)));openings.add(foes.slice(0,3).map(s=>s.enemy).join(','));
}
assert.equal(openings.size,6,'all six small-enemy openings available across restarts');
const old=scope.KM.Road.build(0);assert.equal(old[0].enemy,'goblin');assert.equal(old[1].rest,'tavern');
function fresh(){reset();S.routeVersion=1;S.runId='playtest';S.spellLeft=0;S.mead=0;S.view=null;g.buildWorld(0);}
fresh();const save=JSON.parse(JSON.stringify(g.core()));g.applyCore(save);assert.equal(S.routeVersion,1);assert.equal(S.stops[0].enemy,P.route('playtest')[0].enemy);delete save.routeVersion;g.applyCore(save);assert.equal(S.routeVersion,0);assert.equal(S.stops[0].enemy,'goblin');
// Victory preserves wounds; committing to another fight carries its unhealed damage threshold.
fresh();at(S.stops[0].enemy);flush(1);S.hp=1;g.defeatEnemy();assert.equal(S.hp,1);flush(1);const next=S.stops.find(s=>s.battleNo===2&&s.type==='math');at(next.enemy);flush(1);assert.equal(S.enc.lost,1);g.afterHits(next.enemy,noop);assert.equal(S.party.length,1);
// Every camp has exactly one recruit. Full heal is free, optional, once per camp and survives reload.
fresh();S.hp=1;S.gold=10;const camp=at('campsite');assert.equal(camp.cands.length,1);assert.equal(S.hp,1);assert.equal(S.enc.phase,'rest');let html=nodes.get('panel').innerHTML;
assert(html.includes('Make camp'));assert(!/shop-shelf|chooseGear|buySpell|restBuy|Poultice/.test(html));
g.restHeal('H');assert.equal(S.hp,2);assert.equal(S.gold,10);assert(S.enc.used.H);S.hp=1;g.restHeal('H');assert.equal(S.hp,1);
const snap=JSON.parse(JSON.stringify(g.core()));g.applyCore(snap);at('campsite');assert(S.enc.used.H);g.restHeal('H');assert.equal(S.hp,1);
assert(g.recruitCand(S.enc.st,0));assert.equal(S.party.length,2);assert(!g.canRecruit(S.enc.st));
const taken=JSON.parse(JSON.stringify(g.core()));g.applyCore(taken);at('campsite');assert.equal(S.enc.st.cands.length,0);assert(!g.canRecruit(S.enc.st));
// Full party blocks recruitment; another camp heals again and offers one new candidate.
fresh();while(S.party.length<4)S.party.push(g.followerFrom(D.recruitPool[S.party.length],300));S.hp=g.maxHp();const full=at('campsite');assert.equal(full.cands.length,1);assert(!g.canRecruit(full));assert(!g.recruitCand(full,0));
const last=S.stops.findLast(s=>s.rest==='campsite');S.stop=last.idx;S.hp=1;g.engage(last,S.actors.find(a=>a.stop===S.stop&&a.main));g.restHeal('H');assert.equal(S.hp,g.maxHp());
// Shop tiers matter, and the first purchased sword actually improves both attacks.
fresh();const firstShop=at('shop'),weak=g.weakDmg(),hard=g.hardDmg();S.gold=12;g.restBuy('weapon',0);assert.equal(S.gold,5);assert(g.weakDmg()>weak&&g.hardDmg()>hard);g.restBuy('weapon',0);assert.equal(S.gold,5);g.restBuy('armor',0);assert.equal(S.gold,0);assert.equal(S.party[0].armor,1);
// Simpler questions are quicker; later multi-step questions have time to think.
assert.equal(P.seconds({text:'6 + 2',type:'add'}),8);assert.equal(P.seconds({text:'16 − 7',type:'sub'}),10);
assert.equal(P.seconds({text:'7 × 8',type:'mul'}),16);assert.equal(P.seconds({text:'7 × 8 + 12',type:'mul_add'}),24);
assert.equal(P.level('hard',{battleNo:1},[]),'starter_hard');assert.equal(P.level('hard',{battleNo:6},[]),'march_hard');assert.equal(P.level('hard',{battleNo:10},[]),'hard');
// Losing a new-route run restarts from the opening with the same name, no free checkpoint gear.
fresh();S.name='Magnus';S.party[0].weapon=2;S.gold=30;S.hp=1;g.retry();assert.equal(S.name,'Magnus');assert.equal(S.stop,0);assert.equal(S.party.length,1);assert.equal(S.party[0].weapon,0);assert.equal(S.gold,5);assert.equal(S.hp,2);assert.equal(S.party[0].origin,'villager');assert.equal(S.mode,'walk');assert(small.has(S.stops[0].enemy));
console.log('PASS: 100 seeded curves, early animals only, progressive enemies/shops, legacy/save route stability, persistent wounds, camp full recovery and single recruit, camp save limits, full party gating, useful upgrades, timer curve and fresh-run reset.');
`;
const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(harness+checks,__filename);
