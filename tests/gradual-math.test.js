// Gradual maths ladder behind ?gradual=1: answers stay in range and the climb is slow.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
function load(search){
  const ctx={window:{},location:{search},URLSearchParams,Math,console};ctx.window=ctx;vm.createContext(ctx);
  for(const f of ['src/data/balance_try.js','src/engine/mathgen.js','src/engine/balance-try.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
  ctx.KM.PartyAbilities={role:m=>m.role};return ctx;
}
const on=load('?gradual=1'),BT=on.KM.BalanceTry,G=on.KM.MathGen,B=on.KM_DATA.balanceTry;
assert(BT.on('gradual')&&BT.on('whoActs'));
const knight=[{role:'knight',weapon:0}];
const lv=c=>BT.pickLeader(knight,{foes:1,correct:c}).level;
assert.equal(lv(0),'g_plus_1');assert.equal(lv(4),'g_plus_1');assert.equal(lv(5),'g_plus_2');assert.equal(lv(1000),'g_mix_2');
for(let i=0;i<300;i++){
  assert(G.make('g_plus_1').answer<=10);assert(G.make('g_plus_2').answer>=11);assert(G.make('g_minus_1').answer<=10);
  const m=G.make('g_mix_1');assert(m.answer>=0&&/ \+ .* − /.test(m.text));
  const x=G.make('g_mix_2');assert(/ \+ \d+ × /.test(x.text));
}
const off=load('');assert(!off.KM.BalanceTry.on('gradual'));
assert.equal(off.KM.BalanceTry.pickLeader(knight,{foes:1,correct:50}).level,'plus_1','switch off: old levels');
console.log('PASS: gradual ladder (≤10, >10, mixed sums), slow climb by right answers, off = old levels.');
