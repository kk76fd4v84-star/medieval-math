// knightStart switch: a new run starts as the covered-face knight with Maggi's starter art (chipped sword) instead of
// the villager; the first weapon upgrade switches to the existing knight art. Off by default = the villager start.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(html.indexOf('starter-knight-art.js')>html.indexOf('villager-art.js'),'starter art registers after the villager art');
for(const f of ['assets/starter-knight/v1/starter-knight-walk.png'])assert(fs.existsSync(path.join(root,f)),f);
assert(fs.readFileSync(path.join(root,'src/config/preload_images.js'),'utf8').includes('assets/starter-knight/v1/starter-knight-walk.png'),'loads with the bar');
const base=fs.readFileSync(path.join(root,'tests/party-roles.test.js'),'utf8').split('const PA=')[0].replace('submitAnswer};','submitAnswer,showTitle};');
const run=search=>base.replace("search:'?debug&notimer'",`search:'${search}'`).replace("'src/modes/spelling.js'])run(f);","'src/modes/spelling.js','src/engine/balance-try.js'])run(f);");
function exec(body){const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(body,__filename);return m.exports;}
const probe=`const PA=scope.KM.PartyAbilities,E=scope.KM_ART.entities,SQ=scope.KM_ART7.sequences;
g.showTitle();const h=S.party[0];const out={origin:h.origin||null,art:g.artId(h)};
h.weapon=1;out.armed=g.artId(h);h.weapon=0;h.armor=2;out.armour=g.artId(h);
out.entity=!!E.hero_starter&&SQ.walk_hero_starter.img;out.frames=JSON.stringify(SQ.walk_hero_starter.frames)===JSON.stringify(SQ.walk_hero.frames);
out.saved=JSON.parse(JSON.stringify(g.core())).party[0].origin||null;module.exports=out;`;
const on=exec(run('?debug&notimer&knightstart=1')+probe),off=exec(run('?debug&notimer')+probe);
assert.equal(off.origin,'villager');assert.equal(off.art,'villager','switch off: villager start as before');
assert.equal(on.origin,'starter');assert.equal(on.art,'hero_starter','switch on: starter knight');
assert.equal(on.armed,'hero','first weapon upgrade: the existing knight art');
assert.equal(on.armour,'hero_starter','armour alone keeps the starter sword');
assert.equal(on.entity,'assets/starter-knight/v1/starter-knight-walk.png');assert(on.frames,'same cells / timing / pivot as the knight walk');
assert.equal(on.saved,'starter','saved with the run');
console.log('PASS: knightStart off = villager; on = starter knight art until the first weapon upgrade, then the knight; same walk cells; preloaded; saved.');
