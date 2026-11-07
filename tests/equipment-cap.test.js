const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),Module=require('node:module');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
const harness=fs.readFileSync(path.join(root,'tests/rest-road.test.js'),'utf8').split('const PA=scope.KM.PartyAbilities;')[0];
const checks=`
const PA=scope.KM.PartyAbilities;
reset();S.gold=999;at('shop');
// Even a future shop authored with a higher tier cannot exceed the individual cap.
D.restStops.types.shop.gear.maxWeapon=10;D.restStops.types.shop.gear.maxArmor=10;
for(const kind of ['weapon','armor']){
 for(let i=0;i<3;i++)g.restBuy(kind,0);
 assert.equal(S.party[0][kind],3);
 const money=S.gold;g.restBuy(kind,0);assert.equal(S.party[0][kind],3);assert.equal(S.gold,money);
}
// Consumed silver hearts can be replaced, but never accumulated above three.
PA.absorb(S.party,2);assert.equal(S.party[0].armor,1);g.restBuy('armor',0);assert.equal(S.party[0].armor,2);
const c=g.core();c.party[0].weapon=9;c.party[0].armor=8;const money=c.gold;g.applyCore(c);
assert.equal(S.party[0].weapon,3);assert.equal(S.party[0].armor,3);assert.equal(S.gold,money);
const saved=g.core();g.applyCore(saved);assert.equal(S.party[0].weapon,3);
assert.equal(scope.KM.Progression.shop(D.restStops.types.shop,8).gear.maxWeapon,3);
console.log('PASS: three equipment levels, guarded purchases, armour replacement, over-cap saves and shop tiers.');
`;
const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(harness+checks,__filename);
