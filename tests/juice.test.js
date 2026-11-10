// Juice (switch juice, ?juice=1): every key its own sound from data (Web Audio, decoded at load), started in the key handler;
// off = nothing; every mapped file shipped (.ogg + .mp3).
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
function load(on){const started=[],fetched=[];
  class Ctx{constructor(){this.state='running';this.destination={};}createGain(){return {gain:{value:1},connect(){}};}
    createBufferSource(){const s={playbackRate:{value:1},connect(g){s.g=g;},start(){started.push([s.buffer.id,s.g.gain.value,s.playbackRate.value]);}};return s;}
    decodeAudioData(a){return Promise.resolve({id:a.id});}resume(){}}
  const ctx={document:{documentElement:{style:{setProperty(){}}}},location:{protocol:'http:'},AudioContext:Ctx,Audio:class{canPlayType(){return 'probably';}},
    addEventListener(){},performance:{now:()=>0},console,Promise,Object,Math,
    fetch:u=>{fetched.push(u);return Promise.resolve({arrayBuffer:()=>Promise.resolve({id:u.replace(/^.*\/|\.ogg$/g,'')})});}};
  ctx.window=ctx;vm.createContext(ctx);vm.runInContext(read('src/data/juice.js'),ctx);
  vm.runInContext(`KM={BalanceTry:{on:k=>k==='juice'&&${on}},Audio:{muted:()=>false}};`,ctx);vm.runInContext(read('src/engine/juice.js'),ctx);
  return {J:ctx.KM.Juice,D:ctx.KM_DATA.juice,started,fetched};}
const g0=read('src/game.js');
(async()=>{
{ const {J,started,fetched}=load(false);J.init();assert.equal(J.press('4',null),false,'off: not handled');assert.equal(fetched.length+started.length,0,'off: nothing loaded or played'); }
const {J,D,started,fetched}=load(true);J.init();await new Promise(r=>setTimeout(r,0));await new Promise(r=>setTimeout(r,0));
assert.equal(J.ready(),Object.keys(D.sounds).length,'every sound decoded up front');
assert.equal(new Set(fetched).size,fetched.length,'each file fetched once');
for(let k=0;k<10;k++){J.press(String(k));assert.equal(J.last.id,'key_digit_'+k,'digit '+k+' has its own sound id');assert(J.last.started,'started at once (no await)');}
assert.deepEqual(started.slice(0,10).map(s=>s[0]),[...D.digits],'each digit plays its own file');assert(started.slice(0,10).every(s=>s[1]===0.8),'digits at 0.8');
J.press('back');assert.equal(J.last.id,'key_delete');assert.equal(started.at(-1)[1],0.6,'delete volume from data');
J.press('enter',true);assert.equal(J.last.id,'key_enter_heavy');assert.equal(started.at(-1)[0],'key_enter_heavy');assert.equal(started.at(-1)[1],1);
const n=started.length;J.press('enter',null);assert.equal(started.length,n,'Enter with nothing typed: silent');
J.press('enter',false);J.press('enter',false);assert.deepEqual(started.slice(-2).map(s=>s[0]),['enter_wrong','enter_miss_whoosh'],'wrong: blocked, then whoosh');assert.deepEqual(started.slice(-2).map(s=>s[1]),[0.8,0.7]);
for(const s of started)assert(Math.abs(s[2]-1)<=0.03+1e-9,'pitch jitter small');
assert.deepEqual(D.digits.length,10);
const m=started.length;assert(J.text('A')&&J.text('a')&&J.text('A'));assert.deepEqual(started.slice(m).map(s=>s[0]),[D.digits[5],D.digits[5],D.digits[5]],'name letters: char code % 10 (A = a)');
assert(started.slice(m).every(x=>x[2]===started[m][2]),'same letter, same pitch (no jitter)');
const R=[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(c=>J.letterRate(c));assert.equal(new Set(R).size,26,'every letter its own pitch');assert(R.every(r=>r>=0.85-1e-9&&r<=1.2+1e-9),'within 0.85-1.2');
assert(R.every((r,i)=>i===0||Math.abs(r-R[i-1])>0.05),'neighbouring letters differ');J.text('A');assert.equal(J.last.rate,J.letterRate('A'));J.press('7');assert.equal(J.last.rate,1,'maths digits unchanged');
J.text('Backspace');assert.equal(J.last.id,'key_delete');J.text('Enter');assert.equal(J.last.id,'key_enter_heavy');assert.equal(J.text('Shift'),false,'no sound for Shift');
assert.match(g0,/S\.mode === "name"[^]*?JU\.text\(k\)/,'name entry keydown plays');
for(const [id,s] of Object.entries(D.sounds))for(const x of ['ogg','mp3'])assert(fs.existsSync(path.join(root,'assets/audio/sfx',s.file+'.'+x)),id+' -> '+s.file+'.'+x);
const g=read('src/game.js'),tk=g.slice(g.indexOf('function typeKey'),g.indexOf('function submitAnswer'));
assert(tk.indexOf('JU.press(')<tk.indexOf('e.input = e.input.slice')&&tk.indexOf('JU.press(')<tk.indexOf('innerHTML'),'the sound starts before input/render work');
assert.match(g,/addEventListener\("pointerdown"[^]*?typeKey\(b\.dataset\.key\)/,'on-screen keys act on pointerdown');
const ctx={};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(read('src/data/balance_try.js'),ctx);assert.equal(ctx.KM_DATA.balanceTry.juice,false,'off by default');
console.log('PASS: juice: off = nothing; 10 digit sounds + delete + heavy Enter + wrong pair, name letters too, from data, decoded at load, started in the key handler; files shipped.');
})().catch(e=>{console.error(e);process.exit(1);});
