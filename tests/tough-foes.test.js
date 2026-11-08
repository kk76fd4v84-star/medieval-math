// Tough foes behind ?toughfoes=1 (Magnus): strong foes take more blows; data-only multipliers, off by default.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
const harness=search=>fs.readFileSync(path.join(root,'tests/party-roles.test.js'),'utf8').split('const PA=')[0]
 .replace("search:'?debug&notimer'",`search:'${search}'`)
 .replace("'src/modes/spelling.js'])run(f);","'src/modes/spelling.js','src/engine/balance-try.js'])run(f);")
 .replace('submitAnswer};','submitAnswer,setChallengeMode};');
const body=`run('src/modes/fellowship.js');const out={};
for(const id of ['goblin','rabid_squirrel']){reset();g.setChallengeMode('fellowship');S.routeVersion=3;S.hp=g.maxHp();g.buildWorld(0);at(id);for(let i=0;i<150;i++)flush(.02);out[id]=S.enc.act.maxHp;}
module.exports=out;`;
function exec(src){const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(src,__filename);return m.exports;}
const off=exec(harness('?debug&notimer')+body),on=exec(harness('?debug&notimer&toughfoes=1')+body);
const vm=require('node:vm'),ctx={};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'src/data/balance_try.js'),'utf8'),ctx);const B=ctx.KM_DATA.balanceTry;
assert.equal(B.toughFoes,false,'off by default');
for(const [id,k] of Object.entries(B.tough))assert(k>=1&&k<=3,id+' multiplier in range');
assert(B.tough.black_knight>=B.tough.goblin&&B.tough.turd_dragon>=B.tough.goblin,'bosses at least as tough as goblins');
assert.equal(on.goblin,Math.ceil(off.goblin*B.tough.goblin),'goblin health x its multiplier');
assert.equal(on.rabid_squirrel,off.rabid_squirrel,'weak foes unchanged');
console.log('PASS: tough foes: off by default, strong foe health x data multiplier, weak foes unchanged.',JSON.stringify({off,on}));
