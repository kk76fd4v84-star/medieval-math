// Actual game handlers, in-memory saves and silent audio. Legacy runs remain knights.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
let harness=fs.readFileSync(path.join(root,'tests/party-roles.test.js'),'utf8');
harness=harness.slice(0,harness.indexOf('const PA='))
 .replace('submitAnswer};','submitAnswer,newGame,submitName,startJourney,showTitle,continueGame,restBuy,renderRest,retry,deathDur};')
 .replace('s.enemy===id','s.enemy===id || s.rest===id');
const checks=`
const PA=scope.KM.PartyAbilities;
reset();S.name='Old Knight';S.party[0].weapon=2;S.party[0].armor=1;S.hp=2;
const old=JSON.parse(JSON.stringify(g.core()));scope.KM.Save.write(old);
const oldSave=memory.get(scope.KM.Save.KEY);
g.newGame();assert.equal(S.mode,'name');assert.equal(S.intro,null);
assert.equal(memory.get(scope.KM.Save.KEY),oldSave,'opening name entry must not delete the previous run');
assert.equal(S.hp,2);assert.equal(g.maxHp(),2);assert.equal(S.spells,0);
assert.equal(S.party[0].weapon,0);assert.equal(S.party[0].armor,0);assert.equal(g.artId(S.party[0]),'villager');
assert(nodes.get('panel').innerHTML.includes('nameInput'));assert(!nodes.get('panel').innerHTML.includes('nextLine'));
scope.document.getElementById('nameInput').value='  Alex  ';g.submitName();assert.equal(S.mode,'walk');assert.equal(S.name,'Alex');assert.equal(S.intro,null);assert(S.checkpoint);
const starterSave=JSON.parse(JSON.stringify(g.core()));g.applyCore(starterSave);assert.equal(S.hp,2);assert.equal(g.artId(S.party[0]),'villager');
// One squirrel introduces the bite before the pack; the third fight varies by seed.
const first=S.stops.filter(s=>s.type==='math').slice(0,3);
assert.equal(first[0].enemy,'rabid_squirrel');assert.deepEqual(Array.from(first,s=>1+s.group.length),[1,3,1]);assert(['rabid_dog','killer_rabbit'].includes(first[2].enemy));
at(first[0].enemy);flush(1);g.renderChoice();assert.match(nodes.get('panel').innerHTML,/Light stick swing/);assert(!nodes.get('panel').innerHTML.includes('Weak swing'));
at('shop');S.gold=40;S.hp=1;const hero=S.party[0],max=g.maxHp();
g.restBuy('armor',0);assert.equal(hero.armor,1);assert(hero.armorTrained);assert.equal(g.maxHp(),max);assert.equal(S.hp,1,'buying armour must not heal the old wound');assert.equal(g.artId(hero),'villager_armour');
PA.absorb(S.party,1);assert.equal(hero.armor,0);assert.equal(g.maxHp(),2);assert.equal(g.artId(hero),'villager_armour');
g.restBuy('armor',0);assert.equal(S.hp,1,'replenishing armour must not heal or add maximum hearts');assert.equal(g.maxHp(),2);
const weak=g.weakDmg(),hard=g.hardDmg();g.restBuy('weapon',0);assert(g.weakDmg()>weak&&g.hardDmg()>hard);assert.equal(g.artId(hero),'hero');
const equipped=JSON.parse(JSON.stringify(g.core()));g.applyCore(equipped);assert.equal(g.maxHp(),2);assert.equal(g.artId(S.party[0]),'hero');
// Sword-first purchase keeps the cloth health and appearance until armour is bought.
g.newGame();at('shop');S.gold=30;g.restBuy('weapon',0);assert.equal(g.maxHp(),2);assert.equal(g.artId(S.party[0]),'villager_sword');
g.restBuy('armor',0);assert.equal(g.maxHp(),2);assert.equal(g.artId(S.party[0]),'hero');
// Inadequate funds do not unlock art, permanent health or equipment.
g.newGame();at('shop');S.gold=0;g.restBuy('armor',0);g.restBuy('weapon',0);assert.equal(g.maxHp(),2);assert.equal(g.artId(S.party[0]),'villager');
S.party[0].dying={t:0};g.deathDur(S.party[0],'killer_rabbit');assert(!S.party[0].dying.seq,'unarmoured deaths cannot turn into the knight');
g.applyCore(old);assert.equal(g.maxHp(),2);assert.equal(S.hp,2);assert.equal(g.artId(S.party[0]),'hero');assert.equal(S.party[0].weapon,2);
g.newGame();scope.document.getElementById('nameInput').value='<Alex>';g.submitName();assert.equal(S.name,'<Alex>');assert.equal(S.mode,'walk');
g.retry();assert.equal(S.name,'<Alex>');assert.equal(S.hp,2);assert.equal(S.party[0].origin,'villager');assert.equal(S.mode,'walk');
for(const id of ['villager','villager_sword','villager_armour']){
 const e=scope.KM_ART.entities[id],seq=scope.KM_ART7.sequences[e.seq.walk];assert.equal(seq.frames.length,8);assert(e.noFallbackDeath);
 for(const f of seq.frames){assert(f.x>=0&&f.y>=0&&f.x+f.w<=6144&&f.y+f.h<=768);assert(f.pivot[1]>f.top);}
}
for(const f of ['src/i18n/ja.js','src/i18n/ja-content.js','src/engine/i18n.js'])run(f);
scope.KM.I18n.set('ja');assert.equal(scope.KM.I18n.t('Begin'),'出発');assert.equal(scope.KM.I18n.t('Quick punch'),'軽い拳');
console.log('PASS: direct name → walking, no pre-name save deletion, unarmed two-heart start, early animals, sword/armour order, two red hearts even after armour, consumable armour, legacy saves, retry and authored frame bounds.');
`;
const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(harness+checks,__filename);
