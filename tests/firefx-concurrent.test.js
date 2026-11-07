// Multiple firestarters keep their own bottle flights; legacy callers replace the effect.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const scope={KM:{Assets:{loadImg:()=>({_ok:false})},Audio:{play:()=>{},loop:()=>{},stop:()=>{}}},KM_LAYOUT:{art:.6,k:1}};scope.window=scope;vm.createContext(scope);
for(const f of ['src/data/items.js','src/engine/firefx.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),scope);
const fx=scope.KM.FireFx,o={from:{x:1,y:2},targets:[{x:3,y:4}]};
assert.equal(fx.start(o),fx.hitDelay());fx.update(.1);fx.start({...o,append:true});assert.equal(fx.state().casts,2);assert.equal(fx.state().t,0);fx.draw({});
fx.start(o);assert.equal(fx.state().casts,1);fx.update(8);assert.equal(fx.state(),null);assert(!fx.active());
fx.start(o);fx.start({...o,append:true});fx.stop();assert(!fx.active());
console.log('PASS: independent concurrent bottles, frame-timed hit delay, legacy replacement, complete cleanup.');
