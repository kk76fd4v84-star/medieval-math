// Silent integration checks of the live game paths, no browser/save/audio side effects.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
let harness=fs.readFileSync(path.join(root,'tests/party-roles.test.js'),'utf8');
harness=harness.slice(0,harness.indexOf('const PA='))
 .replace('submitAnswer};','submitAnswer,canExecute,canRecruit,recruitFlowTalk,tvJoin,restRecruit,renderTavernInside,renderRest,partyHeartsRect,drawHearts,rowSlots,addGroup,laneOf,wideOf,stepUp};')
 .replace('s.enemy===id','s.enemy===id || s.rest===id');
const checks=`
const PA=scope.KM.PartyAbilities;
function add(id){S.party.push(g.followerFrom(D.companions[id],300));S.hp=g.maxHp();}
function panel(){return nodes.get('panel').innerHTML;}
reset();add('executioner');at('goblin');flush(1);
const foe=S.enc.act;foe.maxHp=10;foe.hp=5.01;g.renderChoice();
assert.match(panel(),/pickExecute[^>]*disabled/);g.pickAction('execute');assert.equal(S.enc.phase,'choose');
g.turnRight('execute');assert(!S.party[1].act);assert.equal(S.enc.phase,'choose');
foe.hp=5;g.renderChoice();assert(g.canExecute());assert(!/pickExecute[^>]*disabled/.test(panel()));g.pickAction('execute');assert.equal(S.enc.phase,'math');assert.match(S.enc.problem.text,/×/);
foe.hp=6;S.enc.foes.push({...foe,x:foe.x+300,hp:1});g.renderChoice();assert(!g.canExecute(),'wounded rear enemy must not unlock Execute against healthy front');
foe.hp=0;foe.gone=true;assert(g.canExecute());S.enc.foes[1].hp=0;assert(!g.canExecute());
reset();at('goblin');flush(1);g.renderChoice();assert(!panel().includes('pickExecute'));
// A successful recruit consumes only this tavern, persists independently of party membership, and leaves the other visible.
run('src/engine/tavern-pov.js');
reset();const st=at('tavern'),other=st.cands[1].name;S.view={id:'tavern-interior',a:1};g.renderTavernInside();assert.match(panel(),/Choose a companion/);
const before=g.core();g.recruitFlowTalk(st,0);S.enc.q.onRight();assert.equal(S.party.length,2);assert(!g.canRecruit(st));assert.equal(st.cands[1].name,other);assert.match(panel(),/One recruit per tavern/);
assert.equal(Object.keys(before.tavernRecruits).length,0,'checkpoint snapshot must not mutate');
assert(!g.recruitCand(st,1));g.tvJoin(1);g.restRecruit(1);g.recruitFlowTalk(st,1);assert.equal(S.enc.phase,'rest');
S.enc.tv.sel=1;g.renderTavernInside();assert.match(panel(),/tvJoin[^>]*disabled/);
S.view=null;g.renderRest();S.view={id:'tavern-interior',a:1};g.renderTavernInside();assert(!g.canRecruit(st));
const saved=JSON.parse(JSON.stringify(g.core()));g.applyCore(saved);assert(!g.canRecruit(S.stops[st.idx]));S.party=[S.party[0]];assert(!g.canRecruit(S.stops[st.idx]),'death must not reopen the same tavern choice');
const next=S.stops.find(q=>q.rest==='tavern'&&q.idx!==st.idx);assert(g.canRecruit(next));assert(g.recruitCand(next,0));
delete saved.tavernRecruits;g.applyCore(saved);assert(g.canRecruit(S.stops[st.idx]),'legacy saves default safely');
// A failed tavern sum sends that candidate away. The surviving candidate can still join.
reset();const tav=at('tavern');g.recruitFlow(tav,0,()=>{});S.enc.q.onWrong();
assert.equal(tav.cands[0],null);assert(!S.enc.contest);assert(g.canRecruit(tav));
g.recruitFlow(tav,1,()=>{});S.enc.q.onRight();assert(!g.canRecruit(tav));assert.equal(S.party.length,2);
reset();const shop=at('shop');shop.cands=[{...D.recruitPool[0]},{...D.recruitPool[1]}];assert(g.recruitCand(shop,0));assert(g.recruitCand(shop,1));
// Red hearts are painted first at the SAME coordinates as silver. Removing armour changes neither HUD nor purse row.
reset();S.enc=null;S.mode='walk';add('frank');const plain=g.partyHeartsRect();S.party[0].armor=1;S.party[1].armor=3;
const fills=[];let pt;ctx.moveTo=(x,y)=>{pt=[x,y];};ctx.fill=()=>fills.push({at:pt.slice(),col:ctx.fillStyle});g.drawHearts();
const red=fills.filter(f=>f.col==='#b3321f'),silver=fills.filter(f=>f.col==='#b8b9b4');assert.equal(red.length,4);assert.equal(silver.length,4);assert.equal(new Set(fills.map(f=>f.at[1])).size,1);assert.equal(g.partyHeartsRect().h,plain.h);assert.deepEqual(silver.map(f=>f.at[0]).sort((a,b)=>a-b),red.slice(0,4).map(f=>f.at[0]));
// Move all the armour to the last companion: display must still begin at the first heart.
S.party[0].armor=0;S.party[1].armor=2;fills.length=0;g.drawHearts();
assert.deepEqual(fills.filter(f=>f.col==='#b8b9b4').map(f=>f.at[0]).sort((a,b)=>a-b),red.slice(0,2).map(f=>f.at[0]));
PA.absorb(S.party,1);fills.length=0;g.drawHearts();assert.deepEqual(fills.filter(f=>f.col==='#b8b9b4')[0].at,red[0].at);
S.party.forEach(m=>m.armor=0);assert.deepEqual(g.partyHeartsRect(),plain);
// Group positions reserve the full hero width at world creation, before companions join. Keep all four enemies.
reset();const groupStop=S.stops.find(q=>q.type==='math');groupStop.group=['goblin','killer_rabbit','goblin'];g.addGroup(groupStop,groupStop.idx);
assert.equal(groupStop.group.length,3);
const ids=['goblin','goblin','killer_rabbit','goblin'];const slots=g.rowSlots(groupStop,ids),cam=groupStop.stopX-D.world.engageScreenX;
for(let i=0;i<slots.length;i++){assert(slots[i]-cam+g.wideOf(ids[i])[0]>=D.world.partyScreenX+g.wideOf('hero')[1]+79);assert(slots[i]-cam+g.wideOf(ids[i])[1]<=scope.KM_LAYOUT.viewW-39);if(i)assert(slots[i]>slots[i-1]);}
for(const id of ['frank','timmy','executioner'])add(id);assert.deepEqual(g.rowSlots(groupStop,ids),slots);
assert.equal(g.laneOf({distant:true,id:'goblin'}),null);assert.equal(g.laneOf({closing:{t:0,dur:.7}}),null);
assert.equal(g.laneOf({distant:true,hill:true}).alpha,1);
console.log('PASS: Execute eligibility/front targeting; one tavern choice through maths, dice, re-entry, saves and legacy saves; armour overlay/draw order; four opaque enemy slots clear of full party.');
`;
const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(harness+checks,__filename);
