// Meter pressure (switch meterPressure): strongest foe per type, gear cancels but never beyond clean, clamps,
// seconds table in data = the old hard-coded table, and the switch off changes nothing.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),Module=require('node:module'),assert=require('node:assert/strict');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
// ---- 1) pure engine
function engine(search){
  const ctx={console,URLSearchParams,location:{search}};ctx.window=ctx;vm.createContext(ctx);
  for(const f of ['src/data/combat.js','src/data/knights.js','src/data/balance_try.js','src/data/meter_pressure.js','src/engine/timing.js','src/engine/progression.js','src/engine/balance-try.js','src/engine/meter-pressure.js'])
    vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
  return ctx;
}
const E=engine('?meterpressure=1'),MP=E.KM.MeterPressure,MD=E.KM_DATA.meterPressure,L=MD.limits;
assert.equal(MP.on(),true);assert.equal(engine('').KM.MeterPressure.on(),false,'off by default');assert.equal(E.KM_DATA.balanceTry.meterPressure,false);
const near=(a,b,m)=>assert(Math.abs(a-b)<1e-9,m+': '+a+' vs '+b);
// strongest foe only, per type (a pack never stacks)
const p=MP.strongest([{id:'rabid_dog'},{id:'killer_rabbit'},{id:'goblin'},{id:'ogre'}]);
assert.deepEqual({...p},{quick:.10,heavy:.05,slippery:.05,shroud:0});
// clean meter = the existing base bands
let w=MP.windows();near(w.crit,.5,'clean crit');near(w.block,.25,'clean block');assert.equal(w.quick,0);assert.equal(w.ink,null);assert.deepEqual([...w.tags],[]);
// each pressure moves its band / timer / ink; sums across types
w=MP.windows({foes:[{id:'turd_dragon'},{id:'rabid_dog'}]});
near(w.block,.15,'heavy .10');near(w.crit,.45,'slippery .05');near(w.quick,.10,'quick');assert.deepEqual([...w.ink],[.15,.25]);assert.deepEqual([...w.tags],['quick','heavy','slippery','shroud']);
assert.equal(MP.seconds(10,w),9,'quick .10 = 10% less time');assert.equal(MP.seconds(10,{}),10);
// gear cancels its own pressure, never beyond clean, then widens as before
w=MP.windows({weapon:1,foes:[{id:'goblin'}]});near(w.crit,.5,'weapon 1 cancels slippery .05 exactly');
w=MP.windows({weapon:3,foes:[{id:'goblin'}]});near(w.crit,.6,'leftover weapon levels widen as before');
w=MP.windows({helm:2,foes:[{id:'rabid_dog'}]});assert.equal(w.quick,0,'helm 2 cancels quick .10');
w=MP.windows({helm:2,foes:[{id:'black_knight'}]});assert.equal(w.quick,0,'never slower than clean');
w=MP.windows({lantern:1,foes:[{id:'toad'}]});near(w.ink[1]-w.ink[0],.05,'lantern 1 clears half the ink');
w=MP.windows({lantern:2,foes:[{id:'toad'}]});assert.equal(w.ink,null,'lantern 2 clears it');assert(!w.tags.includes('shroud'));
// armour: heavy first, then the companions' block pressure, then widening
w=MP.windows({armour:1,companions:2,foes:[{id:'ogre'}]});near(w.block,.15,'armour 1 only cancels heavy');near(w.crit,.4,'party still pushes crit');
w=MP.windows({armour:3,companions:2,foes:[{id:'ogre'}]});near(w.block,.25,'armour 2..3 wins back two companions');
w=MP.windows({armour:3,companions:0});near(w.block,.4,'no pressure: armour widens like today');
// clamps
w=MP.windows({companions:3,foes:[{id:'dragon'}]});assert(w.crit>=L.critMin);assert(w.block>=L.blockMin);assert(w.block<=w.crit-L.bandGap+1e-9);assert(w.quick<=L.quickMax);
w=MP.windows({foes:[{id:'bell_beneath'}]});assert(w.ink[1]-w.ink[0]<=L.inkMax+1e-9);assert.equal(w.ink[0],w.block,'ink starts where the block band ends');
// every foe in the data exists in combat data; every gear has levels and costs; sell lists name real gear
for(const id of Object.keys(MD.foes))assert(E.KM_DATA.combat.enemies[id]||['hollow_skeleton','hollow_zombie','grave_spider','root_horror','parish_collector','bell_beneath','tomb_sentry','tomb_warden'].includes(id),id);
for(const id of ['helm','lantern'])assert.equal(MD.gear[id].cost.length,MD.gear[id].max);
for(const id of Object.keys(MD.sell))assert(MD.gear[id]);
// shop: sells by tier / n-th tavern / chapter; costs per level; max
const stops=[{rest:'tavern'},{rest:'shop',shopTier:1},{rest:'shop',shopTier:2},{rest:'tavern'},{rest:'shop',shopTier:3}];
assert.deepEqual(stops.map(st=>MP.sells(st,stops,'road').join('+')),['','','helm','lantern','helm+lantern']);
assert.deepEqual([...MP.sells({rest:'shop',shopTier:2},[],'hollowwood')],['helm','lantern']);
const S={gold:30};assert.equal(MP.cost(S,'helm'),8);assert(MP.buy(S,'helm'));assert.equal(S.gold,22);assert.equal(MP.cost(S,'helm'),10);assert(MP.buy(S,'helm'));assert.equal(MP.cost(S,'helm'),null);assert(!MP.buy(S,'helm'));assert.equal(S.meterGear.helm,2);
assert(!MP.buy({gold:3},'lantern'),'not enough coppers');
// ---- 2) seconds table moved to data: identical to the old hard-coded rule
function oldSeconds(p){const nums=(p.text.match(/\d+/g)||[]).map(Number),type=p.type||(/×/.test(p.text)?'mul':/÷/.test(p.text)?'div':'add');
  if(nums.length>2)return 24;if(type==='mul')return Math.max(...nums)<=5?12:Math.max(...nums)<=10?16:20;if(type==='div')return 16;
  const max=Math.max(...nums);return max<10?8:max<20?10:max<40?12:max<70?16:18;}
for(let a=0;a<=120;a++)for(const b of [1,7,12,55]){for(const t of [`${a} + ${b}`,`${a} − ${b}`,`${a} × ${b}`,`${a*b} ÷ ${b}`,`${a} + ${b} − 3`])assert.equal(E.KM.Progression.seconds({text:t}),oldSeconds({text:t}),t);}
// ---- 3) the game: switch off = exactly as before (bands and timer of real fights); switch on = quick timer, tags, ink, shop items
const base=fs.readFileSync(path.join(root,'tests/party-roles.test.js'),'utf8').split('const PA=')[0]
 .replace("search:'?debug&notimer'","search:'?debug'")
 .replace('submitAnswer};','submitAnswer,combatWindows,startAnswerTimer,renderRest,buyMeterGear,setChallengeMode};');
const withMP=search=>base.replace("search:'?debug'",`search:'${search}'`).replace("'src/modes/spelling.js'])run(f);","'src/modes/spelling.js','src/engine/balance-try.js','src/engine/meter-pressure.js'])run(f);");
const probe=`
const out=[];
for(const id of ['goblin','rabid_dog','killer_rabbit','skeleton_knight','turd_dragon','ogre','dragon']){
 for(const n of [0,2]){reset();for(let i=0;i<n;i++)S.party.push(g.followerFrom(D.recruitPool[i],300));S.hp=g.maxHp();
  S.party[0].weapon=1;S.party[0].armor=1;at('goblin');flush(1);const e=S.enc;e.act.id=id;e.foes=[e.act];e.q={};
  const w=g.combatWindows();const t=g.startAnswerTimer(10);out.push([id,n,w.crit,w.block,t&&t.secs,!!w.ink,(w.tags||[]).join()]);}
}
module.exports.out=out;`;
function exec(body){const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(body,__filename);return m.exports;}
const before=exec(base+probe).out,off=exec(withMP('?debug')+probe).out,onOut=exec(withMP('?debug&meterpressure=1')+probe).out;
assert.deepEqual(off,before,'switch off: identical bands and timer seconds');
assert(before.every(r=>r[4]===10&&!r[5]&&r[6]===''));
const dog=onOut.find(r=>r[0]==='rabid_dog'&&r[1]===0);assert.equal(dog[4],9,'quick foe: shorter timer');assert.equal(dog[6],'quick');
const turd=onOut.find(r=>r[0]==='turd_dragon'&&r[1]===0);assert.equal(turd[5],true,'shroud foe: ink');assert(turd[6].includes('shroud'));
// switch on: helm in the tier-2 shop through the existing shop item flow
exec(withMP('?debug&meterpressure=1')+`
reset();S.routeVersion=3;g.buildWorld(0);const i=S.stops.findIndex(s=>s.rest==='shop'&&s.shopTier===2);assert(i>=0);S.stop=i;const st=S.stops[i];S.camX=st.stopX-D.world.engageScreenX;
g.engage(st,S.actors.find(a=>a.stop===i&&a.main));flush(3);if(S.enc.phase!=='rest')g.renderRest();S.enc.cardPick=false;S.gold=20;g.renderRest();
g.buyMeterGear('helm');assert.equal((S.meterGear||{}).helm,1);assert.equal(S.gold,12);g.buyMeterGear('lantern');assert(!(S.meterGear||{}).lantern,'lantern not sold at shop 2');
assert.equal(g.core().meterGear.helm,1,'saved');`);
exec(withMP('?debug')+`reset();S.routeVersion=3;g.buildWorld(0);const i=S.stops.findIndex(s=>s.rest==='shop'&&s.shopTier===2);S.stop=i;const st=S.stops[i];S.camX=st.stopX-D.world.engageScreenX;
g.engage(st,S.actors.find(a=>a.stop===i&&a.main));flush(3);S.gold=20;g.buyMeterGear('helm');assert(!(S.meterGear||{}).helm,'switch off: nothing to buy');assert.equal(S.gold,20);assert(!('meterGear' in g.core()),'switch off: save unchanged');`);
console.log('PASS: strongest-foe pressure, gear cancels to clean then widens, armour wins back party block, clamps, data seconds table = old, switch off identical, helm in shop 2.');
