// Juice (switch juice, ?juice=1): number entry sounds + motion from data; off = nothing; Charlie's key sounds mapped and shipped.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
function load(on){const plays=[],ctx={document:{documentElement:{style:{setProperty(){}}}}};ctx.window=ctx;vm.createContext(ctx);
  vm.runInContext(read('src/data/juice.js'),ctx);vm.runInContext(`KM={BalanceTry:{on:k=>k==='juice'&&${on}},Audio:{play:(ev,o)=>__plays.push([ev,o.rate]),warm(){}}};`,Object.assign(ctx,{__plays:plays}));
  vm.runInContext(read('src/engine/juice.js'),ctx);return {J:ctx.KM.Juice,D:ctx.KM_DATA.juice,plays};}
const el=()=>{const kid={classList:{add(c){kid.c=c;}}};return {kid,lastElementChild:kid,classList:{remove(){},add(c){this.c=c;}},insertAdjacentHTML(){},offsetWidth:1};};
{ const {J,plays}=load(false),S={};J.key('4',el());J.enter(true,el(),S);assert.equal(plays.length,0,'off: silent');assert.equal(S.shake,undefined,'off: no nudge'); }
{ const {J,D,plays}=load(true),S={shake:0},b=el();
  J.key('4',b);assert.equal(plays[0][0],'key_cling');assert(Math.abs(plays[0][1]-1)<=D.digit.pitch+1e-9,'pitch within +-'+D.digit.pitch);assert.equal(b.kid.c,'juice-land','the new digit lands');
  J.key('back',el());assert.equal(plays[1][0],'key_backspace');
  J.enter(true,el(),S);assert.equal(plays[2][0],'key_enter_kosh');assert.equal(S.shake,D.enter.shake,'a right Enter nudges');
  J.enter(false,el(),S);J.enter(false,el(),S);assert.deepEqual(plays.slice(3).map(p=>p[0]),['enter_wrong','enter_miss_whoosh'],'wrong: blocked, then whoosh, in turn'); }
const map=JSON.parse(read('assets/audio_map.json')),D=load(true).D;
for(const c of Object.values(D))for(const ev of c.sfx){assert(map[ev]&&map[ev].files.length,'mapped: '+ev);for(const f of map[ev].files){assert(fs.existsSync(path.join(root,'assets/audio',f)),f);assert(fs.existsSync(path.join(root,'assets/audio',f.replace(/\.ogg$/,'.mp3'))),f+' mp3');}}
assert.deepEqual([map.key_cling.vol,map.key_enter_kosh.vol,map.enter_wrong.vol,map.enter_miss_whoosh.vol,map.key_backspace.vol],[0.6,0.9,0.7,0.7,0.5],"Charlie's volumes");
assert.equal(map.key_cling.files.length,4);assert.equal(map.key_enter_kosh.files.length,2);
const g=read('src/game.js');assert.match(g,/KM\.Juice\.key\(k, el\)/);assert.match(g,/KM\.Juice\.enter\(right,/);
const ctx={};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(read('src/data/balance_try.js'),ctx);assert.equal(ctx.KM_DATA.balanceTry.juice,false,'off by default');
console.log('PASS: juice: off = nothing; digits clang + land, backspace soft, Enter kosh + nudge, wrong alternates; Charlie\'s sounds mapped + shipped.');
