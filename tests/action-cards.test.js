// Real choice callbacks with inert DOM/audio; no player storage touched.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
const harness=fs.readFileSync(path.join(root,'tests/party-roles.test.js'),'utf8').split('const PA=')[0]
.replace('submitAnswer};','submitAnswer,setChallengeMode,renderRest,chooseGear,assignGear,cancelGear};')
.replace('s.enemy===id','s.enemy===id || s.rest===id');
const checks=`
const html=()=>nodes.get('panel').innerHTML;
function choose(){at('goblin');flush(1);g.renderChoice();}
reset();g.setChallengeMode('math');S.spells=0;S.spellLeft=0;S.mead=0;choose();
assert.equal((html().match(/class="knight-card action-card"/g)||[]).length,2);
assert(!html().includes('Next draw'));assert(html().includes('<b>'+g.weakDmg()+'</b> damage'));
S.party[0].weapon=2;g.renderChoice();assert(html().includes('<b>'+g.hardDmg()+'</b> damage'));
for(const id of ['frank','timmy','executioner'])S.party.push(g.followerFrom(D.companions[id],300));
S.hp=g.maxHp();S.spells=1;S.enc.st.type='mega';g.renderChoice();
assert.equal((html().match(/class="knight-card action-card"/g)||[]).length,8);
assert.match(html(),/data-act="pickHeal"[^>]*disabled/);assert.match(html(),/data-act="pickExecute"[^>]*disabled/);
const spells=S.spells;g.castSpell();assert.equal(S.spells,spells-1);assert.match(html(),/data-act="castSpell"[^>]*disabled/);assert(html().includes('Armed for this sum'));
g.pickAction('hard');assert.equal(S.enc.phase,'math');assert(S.enc.problem.scrollAssisted);
reset();S.view=null;S.gold=100;at('shop');g.chooseGear('armor');assert.equal((html().match(/data-act="chooseGear"/g)||[]).length,0,'modal replaces base cards');
const before=S.gold;g.cancelGear();assert.equal(S.gold,before);assert(html().includes('data-act="chooseGear"'));
g.chooseGear('armor');g.assignGear(0);assert.equal(S.party[0].armor,1);assert(S.gold<before);assert(!html().includes('role="dialog"'));
console.log('PASS: persistent action row, live damage upgrades, eight role actions, disabled heal/execute, scroll refresh and isolated recipient modal.');
`;
const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(harness+checks,__filename);
