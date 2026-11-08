// Cast bar (switch castBar): change detection + direction colour, the switch is off by default, and in the game
// a shop weapon / armour buy moves an icon the good way (green), a HEAVY foe at a fight's start the bad way (red),
// and the meter is on screen outside fights only with the switch on.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),Module=require('node:module'),assert=require('node:assert/strict');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
// ---- 1) pure engine
function engine(search){
  const ctx={console,URLSearchParams,location:{search}};ctx.window=ctx;vm.createContext(ctx);
  for(const f of ['src/data/combat.js','src/data/knights.js','src/data/balance_try.js','src/data/meter_pressure.js','src/data/cast_bar.js','src/engine/timing.js','src/engine/balance-try.js','src/engine/meter-pressure.js','src/engine/cast-bar.js'])
    vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
  return ctx;
}
const E=engine('?castbar=1&meterpressure=1'),CB=E.KM.CastBar,CD=E.KM_DATA.castBar,MP=E.KM.MeterPressure;
assert.equal(engine('').KM.CastBar.on(),false,'off by default');assert.equal(E.KM_DATA.balanceTry.castBar,false);assert.equal(CB.on(),true);
for(const k of ['shakeMs','slideMs','holdMs','shrinkMs','inkFadeMs'])assert(CD[k]>=0,k+' in data');
assert.deepEqual([CD.shakeMs,CD.slideMs,CD.shrinkMs],[1000,1000,1000],'Magnus: a full second shake, slide, catch-up');assert.equal(CD.holdMs,0,'strictly one after the other');
assert.deepEqual({...CD.sfx},{shake:'meter_shake',good:'meter_tick_up',bad:'meter_tock_down',roar:'dragon_roar'});
assert.equal(CD.shiftBy.join(),'boss,mega','only bosses shift the icons');
const G=fs.readFileSync(path.join(root,'src/game.js'),'utf8');assert.match(G,/e\.pressureReady!==false&&\(!KM\.CastBar\?\.on\(\)\|\|D\.castBar\.shiftBy\.includes/,'non-boss pressure off with the cast bar');
// Charlie's 1 s sounds: mapped, both formats in assets/audio/sfx, the placeholder tick gone
const map=JSON.parse(fs.readFileSync(path.join(root,'assets/audio_map.json'),'utf8'));
for(const id of [CD.sfx.shake,CD.sfx.good,CD.sfx.bad]){assert.deepEqual(map[id].files,['sfx/'+id+'.ogg'],id);for(const f of ['ogg','mp3'])assert(fs.existsSync(path.join(root,'assets/audio/sfx/'+id+'.'+f)),id+'.'+f);}
assert.equal(map.meter_shake.vol,0.55);assert.equal(map.meter_tick_up.vol,0.8);assert.equal(map.meter_tock_down.vol,0.8);assert(!map.meter_tick&&!CD.ticks,'placeholder tick dropped');assert.deepEqual(map.dragon_roar.files,['sfx/boss_roar_31.wav']);
assert.notEqual(CB.colour(true),CB.colour(false));assert.equal(CB.colour(true),CD.colours.good);assert.equal(CB.colour(false),CD.colours.bad);
const pos=w=>({block:w.block,crit:w.crit,normal:w.normal,weak:1});
const plain=x=>JSON.parse(JSON.stringify(x));
// nothing moved / no previous meter / tiny rounding -> no animation; weak never moves
assert.deepEqual(plain(CB.changes(null,pos(MP.windows()))),[]);
assert.deepEqual(plain(CB.changes(pos(MP.windows()),pos(MP.windows()))),[]);
assert.deepEqual(plain(CB.changes({block:.25,crit:.5,normal:.75,weak:1},{block:.252,crit:.5,normal:.75,weak:.5})),[]);
// a HEAVY + SLIPPERY foe arriving: block and crit move left = hurts (red)
let c=plain(CB.changes(pos(MP.windows()),pos(MP.windows({foes:[{id:'skeleton_knight'}]}))));
assert.deepEqual(c.map(x=>[x.id,x.good]),[['block',false],['crit',false]]);assert(Math.abs(c[0].to-.15)<1e-9&&Math.abs(c[0].from-.25)<1e-9);
// ...and the foe gone after the fight: back to the right = helps (green)
c=plain(CB.changes(pos(MP.windows({foes:[{id:'skeleton_knight'}]})),pos(MP.windows())));assert(c.length===2&&c.every(x=>x.good));
// weapon / armour levels: right = helps
assert.deepEqual(plain(CB.changes(pos(MP.windows()),pos(MP.windows({weapon:1})))).map(x=>[x.id,x.good]),[['crit',true]]);
assert.deepEqual(plain(CB.changes(pos(MP.windows()),pos(MP.windows({armour:1})))).map(x=>[x.id,x.good]),[['block',true]]);
// a QUICK-only foe moves no icon (it only speeds the needle)
assert.deepEqual(plain(CB.changes(pos(MP.windows()),pos(MP.windows({foes:[{id:'rabid_dog'}]})))),[]);
// ---- 2) the game: the meter's windows as painted, shop buy and a heavy foe
const base=fs.readFileSync(path.join(root,'tests/party-roles.test.js'),'utf8').split('const PA=')[0]
 .replace("search:'?debug&notimer'","search:'?debug'")
 .replace('submitAnswer};','submitAnswer,paintTimingLegend,renderRest,chooseGear,assignGear};');
const withCB=search=>base.replace("search:'?debug'",`search:'${search}'`).replace("'src/modes/spelling.js'])run(f);","'src/modes/spelling.js','src/engine/balance-try.js','src/engine/meter-pressure.js','src/engine/cast-bar.js'])run(f);");
function exec(body){const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(body,__filename);return m.exports;}
const probe=`
const CB=scope.KM.CastBar,seen=[];scope.KM.TimingBar={update:(w,o)=>seen.push({w:{block:w.block,crit:w.crit,normal:w.normal,weak:1},visible:o.visible})};
const paint=()=>{g.paintTimingLegend();return seen[seen.length-1];};
reset();const walk=paint();
// shop: buy a weapon and an armour level through the real rest-stop flow
S.routeVersion=3;g.buildWorld(0);const i=S.stops.findIndex(s=>s.rest==='shop');S.stop=i;const st=S.stops[i];S.camX=st.stopX-D.world.engageScreenX;
g.engage(st,S.actors.find(a=>a.stop===i&&a.main));flush(3);if(S.enc.phase!=='rest')g.renderRest();S.enc.cardPick=false;S.gold=99;g.renderRest();
const shop0=paint();g.chooseGear('weapon');g.assignGear(0);const shop1=paint();g.chooseGear('armor');g.assignGear(0);const shop2=paint();
// fight start against a HEAVY foe, then the fight over
reset();const calm=paint();at('goblin');flush(1);const e=S.enc;e.act.id='skeleton_knight';e.foes=[e.act];const fight=paint();
S.enc=null;S.mode='walk';const after=paint();
module.exports={walk,shop0,shop1,shop2,calm,fight,after,c:(a,b)=>JSON.parse(JSON.stringify(CB?CB.changes(a.w,b.w):[]))};`;
const on=exec(withCB('?debug&castbar=1&meterpressure=1')+probe);
assert.equal(on.walk.visible,true,'switch on: meter on screen while walking');assert.equal(on.shop0.visible,true,'and at the shop');
assert.deepEqual(on.c(on.shop0,on.shop1).map(x=>[x.id,x.good]),[['crit',true]],'weapon buy: crit icon right, green');
assert.deepEqual(on.c(on.shop1,on.shop2).map(x=>[x.id,x.good]),[['block',true]],'armour buy: block icon right, green');
const hit=on.c(on.calm,on.fight);assert(hit.length&&hit.every(x=>!x.good)&&hit.some(x=>x.id==='block'),'heavy foe at the fight start: red');
assert(on.c(on.fight,on.after).every(x=>x.good)&&on.c(on.fight,on.after).length,'pressure gone after the fight: green');
const off=exec(withCB('?debug&meterpressure=1')+probe);
assert.equal(off.walk.visible,false,'switch off: meter only in fights, as before');assert.equal(off.fight.visible,true);
console.log('PASS: cast bar change detection + green/red direction, data timings + sfx ids, off by default, shop buy green, heavy foe red, always visible only with the switch.');
