// Cast bar (switch castBar), Magnus 2026-11-08: the icons ONLY slide in a boss shift (roar) and back when that boss's
// pressure is gone. Tavern in / out (with a recruit), camp, shop buys, a riddle, a normal fight, scenes: they snap (no
// shake, sound or trail). The trail and the lost-window band are the orange fill picture with only the colour swapped.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
// ---- 1) pure: KM.CastBar.motion
const vm=require('node:vm'),ctx={console,URLSearchParams,location:{search:'?castbar=1'}};ctx.window=ctx;vm.createContext(ctx);
for(const f of ['src/data/balance_try.js','src/data/cast_bar.js','src/engine/balance-try.js','src/engine/cast-bar.js'])vm.runInContext(read(f),ctx);
const CB=ctx.KM.CastBar,A={block:.25,crit:.5,normal:.75,weak:1},B={block:.15,crit:.4,normal:.75,weak:1},C={block:.3,crit:.5,normal:.75,weak:1};
{const st={};assert.equal(CB.motion(st,false,A,C),'snap','a companion / gear change: snap');
 assert.equal(CB.motion(st,true,A,B),'roar','the boss shift');assert.equal(CB.motion(st,true,B,{...B,block:.1}),'snap','a second change in the boss fight: snap');
 assert.equal(CB.motion(st,true,{...B,block:.1},A),'restore','back to the layout it found: slides back');assert.equal(CB.motion(st,false,A,C),'snap','after: snap again');
 const s2={};CB.motion(s2,true,A,B);assert.equal(CB.motion(s2,false,B,C),'snap','fight over somewhere new (e.g. a companion died): snap');assert.equal(CB.motion(s2,false,C,A),'snap','memory cleared');}
// ---- 2) the game: every scene's meter paint, folded through motion exactly as timing-bar.js does
const trail=read('tests/cast-bar-trail.test.js');
const base=read('tests/party-roles.test.js').split('const PA=')[0].replace("search:'?debug&notimer'","search:'?debug&castbar=1&meterpressure=1'")
 .replace('submitAnswer};','submitAnswer,paintTimingLegend,renderRest,chooseGear,assignGear};')
 .replace("'src/modes/spelling.js'])run(f);","'src/modes/spelling.js','src/engine/balance-try.js','src/engine/meter-pressure.js','src/engine/cast-bar.js'])run(f);");
assert(trail.includes("submitAnswer,paintTimingLegend"),'harness as in cast-bar-trail');
const probe=`
const CB=scope.KM.CastBar,log=[];let last=null;const st={};
scope.KM.TimingBar={update:(w,o)=>{const p={block:w.block,crit:w.crit,normal:w.normal,weak:1},prev=o.visible?last:null;last=o.visible?p:null;
  if(prev)log.push([cur,CB.motion(st,o.roar,prev,p),CB.changes(prev,p).length,!!o.roar]);}};
let cur='';const paint=l=>{cur=l;g.paintTimingLegend();};
const stopAt=f=>{const i=S.stops.findIndex(f);S.stop=i;const s=S.stops[i];S.camX=s.stopX-D.world.engageScreenX;g.engage(s,S.actors.find(a=>a.stop===i&&a.main));flush(3);return s;};
const fight=(f,l)=>{stopAt(f);for(let i=0;i<200;i++)flush(.02);const e=S.enc;e.revealed=true;e.pressureReady=true;e.act.hp=e.act.maxHp=20;e.act.state='idle';e.act.active=true;paint(l+' start');return e;};
reset();S.routeVersion=3;g.buildWorld(0);paint('walk');
S.view={id:'tavern-interior'};paint('tavern inside');S.party.push(g.followerFrom(D.recruitPool[0],700,1));paint('tavern recruit');S.view=null;paint('tavern exit');
S.party.push(g.followerFrom(D.recruitPool[1],760,2));paint('road: another companion');
stopAt(s=>s.rest==='campsite');if(S.enc.phase!=='rest')g.renderRest();paint('camp');S.enc=null;S.mode='walk';paint('camp left');
stopAt(s=>s.rest==='shop');if(S.enc.phase!=='rest')g.renderRest();S.enc.cardPick=false;S.gold=99;g.renderRest();paint('shop');g.chooseGear('weapon');g.assignGear(0);paint('shop weapon');g.chooseGear('armor');g.assignGear(0);paint('shop armour');S.enc=null;S.mode='walk';paint('shop left');
stopAt(s=>s.type==='riddle');paint('riddle');if(S.enc)S.enc.revealed=true;paint('riddle revealed');S.enc=null;S.mode='walk';paint('riddle left');
fight(s=>s.enemy==='goblin','goblin');S.enc=null;S.mode='walk';paint('goblin over');
S.party.pop();paint('a companion leaves');
const e=fight(s=>s.type==='boss','boss');e.act.hp=0;paint('boss dies');S.enc=null;S.mode='walk';paint('boss over');
module.exports=log;`;
const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(base+probe,__filename);const log=m.exports;
const moving=log.filter(r=>r[1]!=='snap').map(r=>r[0]+': '+r[1]);
assert.deepEqual(moving,['boss start: roar','boss dies: restore'],'only the boss slides the icons: '+JSON.stringify(log));
assert(log.some(r=>r[1]==='snap'&&r[2]>0),'some non-boss paints did change the windows (they snap): '+JSON.stringify(log.filter(r=>r[2])));
// ---- 3) looks: trail + band = #dvfill geometry and picture, colour swapped; snapping by default
const css=read('style.css'),rule=sel=>(css.match(new RegExp(sel.replace(/[.#[\]"=]/g,'\\$&')+'\\{([^}]*)\\}'))||[])[1]||'';
const geo=r=>['height:12px','box-sizing:border-box','border:4px solid transparent'].every(x=>r.includes(x))&&/6 fill \/ 4px \/ 0 round/.test(r);
assert(geo(rule('#dvfill'))&&geo(rule('.cb-trail'))&&geo(rule('.pressure-band')),'same height, border, slice as the orange fill');
assert(/fill_good\.png/.test(rule('.cb-trail'))&&/fill_bad\.png/.test(rule('.cb-trail[data-good="false"]'))&&/fill_bad\.png/.test(rule('.pressure-band')));
assert(!/gradient|outline|box-shadow|glow|border-left|border-right/.test(rule('.cb-trail')+rule('.pressure-band')),'no stripes, outlines or glow');
assert(rule('.cb-trail').includes('top:-6px')&&rule('.timing-ink').includes('inset:-7px')&&rule('#dvfill').includes('top:1px'),'trail on the fill line (-7 + 1)');
assert(/\.timing-rail\.castbar \.timing-emblem,\.timing-rail\.castbar \.pressure-band,\.timing-rail\.castbar \.timing-ink\{transition:none\}/.test(css),'cast bar: positions snap unless a boss shift animates');
assert(!/CastBar\.tint|colour\(/.test(read('src/engine/timing-bar.js')),'no runtime recolour');
for(const f of ['fill_good','fill_bad'])assert(read('src/data/preload.js').includes('"'+f+'"'),f+' preloaded');
console.log('PASS: cast bar motion: only a boss roar slides the icons (and back when it is gone); tavern / recruit / camp / shop / riddle / fight / companions snap; trail + band = the fill picture, colour swapped.');
