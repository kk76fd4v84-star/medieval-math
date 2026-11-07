// Real damage / casualty path, with the same silent VM fixture as the party-role tests.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
let harness=fs.readFileSync(path.join(root,'tests/party-roles.test.js'),'utf8');
harness=harness.slice(0,harness.indexOf('const PA='));
harness=harness.replace('submitAnswer};','submitAnswer,foeStrike};');
const checks=`
const PA=scope.KM.PartyAbilities;
function hit(n){const e=S.enc;e.act.atk=n;g.foeStrike(e,e.act,true);flush(.5);}
reset(true);at('goblin');g.commit();flush(1);S.party[1].armor=2;hit(2);assert.equal(PA.armour(S.party),0);assert.equal(S.hp,g.maxHp());assert.equal(S.enc.lost,0);assert(!S.party[1].dying);
reset(true);at('goblin');g.commit();flush(1);S.party[1].armor=1;hit(2);assert.equal(PA.armour(S.party),0);assert.equal(S.hp,g.maxHp()-1);assert.equal(S.enc.lost,1);assert(!S.party[1].dying);assert.equal(S.party.length,2);
g.turnRight('heal');assert.equal(S.hp,g.maxHp());assert.equal(S.enc.lost,0);assert.equal(PA.armour(S.party),0);
reset(true);at('goblin');g.commit();flush(1);S.party[0].armor=1;S.party[1].armor=2;hit(2);assert.equal(S.party[0].armor,1);assert.equal(S.party[1].armor,0);assert.equal(S.hp,g.maxHp());
const saved=JSON.parse(JSON.stringify(g.core()));g.applyCore(saved);assert.equal(PA.armour(S.party),1);
console.log('PASS: armour absorbs each point, spillover loses only red hearts, blocked damage never kills, healing does not restore armour, equipment ownership and save persistence.');
`;
// Run as a CommonJS fixture so its standard-library require is available; no browser or audio.
const Module=require('node:module'),m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(harness+checks,__filename);
