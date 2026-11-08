// Party levels: courage cancels foe intimidation in the meter (switch partyLevels). Recruit code data sane.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..'),ctx={location:{search:'?meterpressure=1&partylevels=1'},URLSearchParams};ctx.window=ctx;vm.createContext(ctx);
for(const f of ['src/data/combat.js','src/data/knights.js','src/data/balance_try.js','src/data/meter_pressure.js','src/data/party_levels.js','src/engine/balance-try.js','src/engine/timing.js','src/engine/meter-pressure.js'])
  if(fs.existsSync(path.join(root,f)))vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
const MP=ctx.KM.MeterPressure,PL=ctx.KM_DATA.partyLevels;
const w=(foes,courage)=>MP.windows({foes,extra:PL.foes,courage});
const sq0=w(['rabid_squirrel'],0),sq1=w(['rabid_squirrel'],1);
assert(sq0.enemyPressure.crit>0,'a fresh party is intimidated by a squirrel');
assert.equal(sq1.enemyPressure.crit,0,'a full level-5 party shrugs it off');
const g=w(['black_knight'],1);assert.equal(g.enemyPressure.block,0);assert.equal(g.quick,0);
const big=w(['dragon'],PL.cancel.big),none=w(['dragon'],0);assert(big.enemyPressure.block>0&&big.enemyPressure.block<none.enemyPressure.block,'big bosses stay scary');
assert.equal(w([],0).enemyPressure.crit,0);
assert.equal(ctx.KM_DATA.balanceTry.partyLevels,false);assert.equal(ctx.KM_DATA.balanceTry.recruitCode,false);
assert.equal(ctx.KM_DATA.recruitCode.digits,6);assert.equal(ctx.KM_DATA.recruitCode.secs,5);
console.log('PASS: party levels cancel intimidation (normal fully, big bosses partly); switches off by default');
