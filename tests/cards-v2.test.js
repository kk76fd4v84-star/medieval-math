// Cards v2 (switch cardsV2): stacking levels, Cleave diminishing hits, Weighted Axe, card values, band shrink.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..'),ctx={location:{search:'?cardsv2=1&meterpressure=1'},URLSearchParams};ctx.window=ctx;vm.createContext(ctx);
for(const f of ['src/data/combat.js','src/data/knights.js','src/data/balance_try.js','src/data/meter_pressure.js','src/data/upgrade_cards.js','src/engine/balance-try.js','src/engine/party-abilities.js','src/engine/timing.js','src/engine/meter-pressure.js','src/engine/upgrade-cards.js','src/modes/fellowship.js'])
  if(fs.existsSync(path.join(root,f)))vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
const {Cards:C,Fellowship:F,MeterPressure:MP}=ctx.KM;
assert(C.v2&&ctx.KM.BalanceTry.on('cards'),'cardsv2 turns cards on');
const S={cards:[],party:[{id:'hero',role:'knight'},{id:'f1',role:'executioner'},{id:'f2',role:'darkWizard'}]};
for(let i=0;i<5;i++)S.cards.push('cleave');
assert.equal(C.lv(S,'cleave'),5);assert(!C.offer(S,()=>.5).some(c=>c.id==='cleave'),'a maxed card is not offered');
S.cards.push('high_voltage');assert(!C.offer(S).some(c=>c.id==='high_voltage'));assert.equal(C.wizardDamage(S),3);assert.equal(C.missChip(S),1);
assert.deepEqual([...C.at(S,'cleave','cleave')],[1,.95,.5]);
const foes=()=>[{id:'goblin',hp:10,maxHp:10},{id:'goblin',hp:10,maxHp:10},{id:'goblin',hp:10,maxHp:10}];
const knight=[{id:'hero',role:'knight'}];
const base=F.plan(knight,foes(),1,{v2:{cleave:[1,.5],knight:0,fire:0}})[0];
assert.deepEqual(base.impacts.map(h=>h.amount),[3,1.5],'no Cleave: 100% then 50%');
const cl=F.plan(knight,foes(),1,{v2:{cleave:[1,.95,.5],knight:2,fire:0}})[0];
assert.deepEqual(cl.impacts.map(h=>+h.amount.toFixed(2)),[5,4.75,2.5],'level-5 Cleave + Swing +2 hits three');
const low=[{id:'goblin',hp:2,maxHp:10}],ex=[{id:'f1',role:'executioner'}];
const a0=F.plan(ex,low,1,{v2:{cleave:[1,.5],knight:0,fire:0}})[0].amount,a1=F.plan(ex,low.map(f=>({...f})),1,{v2:{cleave:[1,.5],knight:0,fire:0,axe:{under:.25,bonus:.2}}})[0].amount;
assert(Math.abs(a1-a0*1.2)<1e-9,'Weighted Axe +20% under 25% health');
const skip=F.plan(ex,low,1,{v2:{cleave:[1,.5],knight:0,fire:0,skip:new Set(ex)}});assert.equal(skip.length,0,'a stuck axe skips his turn');
const w0=MP.windows({}),w1=MP.windows({shrink:{crit:.03,block:.03}});assert(w1.crit<w0.crit&&w1.block<w0.block,'Cleave / Shield Wall narrow the bands');
console.log('PASS: cards v2 levels, Cleave falloff, Weighted Axe, stuck axe, band shrink');
