// Real loot callbacks and complete shop-to-shop route budgets; no user storage or audio.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
const harness=fs.readFileSync(path.join(root,'tests/party-roles.test.js'),'utf8').split('const PA=')[0]
 .replace('submitAnswer};','submitAnswer,enemyDeath,collectLoot};');
const checks=`
function battle(id,n=1,assisted=false){
 reset();S.view=null;S.loot=[];S.gold=5;S.spellLeft=0;S.mead=0;at('goblin');flush(1);
 const e=S.enc;e.st.enemy=id;e.st.gold=50;e.stupidUsed=assisted;
 e.act.id=id;e.foes=[e.act];for(let i=1;i<n;i++)e.foes.push({...e.act,extra:i,x:e.act.x+200*i});
 for(const a of e.foes){g.enemyDeath(a);g.enemyDeath(a);}
 assert.equal(S.gold,5,'damage/death does not pay until the body is crossed');
 return S.loot.reduce((n,q)=>n+q.amount,0);
}
for(const id of ['rabid_villager','goblin','ogre'])assert.equal(battle(id),3);
for(const id of ['black_knight','skeleton_knight'])assert.equal(battle(id),4);
assert.equal(battle('turd_dragon'),2);assert.equal(battle('dragon'),8);
assert.equal(battle('goblin',3),6,'group total is split, not paid per enemy');
assert.equal(battle('goblin',3,true),3,'scroll penalty applies once to the total');
for(const id of ['rabid_squirrel','killer_rabbit','rabid_dog','toad'])assert.equal(battle(id,3),0);
// Already-earned purses and pending pickups survive a reload without being reduced or duplicated.
battle('goblin');S.gold=47;S.loot[0].amount=19;const saved=JSON.parse(JSON.stringify(g.core()));g.applyCore(saved);
assert.equal(S.gold,47);assert.equal(S.loot[0].amount,19);
S.mode='walk';S.camX=S.loot[0].x-S.party[0].sx+1;g.collectLoot();g.collectLoot();assert.equal(S.gold,66);assert.equal(S.loot.length,0);
// A fast, first-try saver can narrowly buy a sword and armour at all three shops.
// Test 100 deterministic routes, including optional Frank fight; no adaptive purse cap.
for(let seed=0;seed<100;seed++){
 let wallet=5,shops=0;const route=scope.KM.Progression.route('economy-'+seed,3);
 for(const st of route){
  if(st.type==='riddle')wallet+=st.gold*2;
  else if(st.enemy){
   const ids=[st.enemy,...(st.group||[])].filter(id=>D.enemies[id]?.dropsCoins!==false);
   if(ids.length)wallet+=Math.floor(D.combat.economy.purses[st.enemy]*(1+.5*(ids.length-1)));
  }else if(st.rest==='shop'){
   const gear=scope.KM.Progression.shop(D.restStops.types.shop,st.shopTier).gear;
   assert(wallet>=gear.weaponCost+gear.armorCost,'two gear items with careful saving');
   assert(wallet<gear.armorCost*3,'not enough to armour three people at once');
   wallet-=gear.weaponCost+gear.armorCost;shops++;
  }
 }
 assert.equal(shops,3);
}
console.log('PASS: small purses, animal exclusion, group/scroll totals, deferred once-only pickups, preserved savings and old loot, 100 complete routes with two meaningful upgrades per shop.');
`;
const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(harness+checks,__filename);
