const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
const played=[],events=[],made=[];
class FakeAudio{constructor(src){this.src=src;this.paused=true;made.push(this);}canPlayType(){return 'probably';}play(){played.push(this.src);return Promise.resolve();}pause(){this.paused=true;}}
const scope={Audio:FakeAudio,location:{protocol:'file:'},document:{addEventListener:(name,fn)=>events.push(name)},console,KM:{}};scope.window=scope;vm.createContext(scope);
for(const file of ['src/config/audio_map.js','src/engine/audio.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),scope);
const A=scope.KM.Audio;A.voice('vo_intro_01');A.voice('vo_victory',{onStart:()=>assert.fail('voice must not start')});A.play('vo_intro_01');A.loop('vo_intro_01');
assert.equal(played.length,0);assert.equal(made.length,1);assert(!A.voBusy());assert.equal(A.text({text:'Still written',vo:'vo_intro_01'}),'Still written');assert.equal(A.voOf({vo:'vo_intro_01'}),null);assert(!events.includes('pointerdown'));assert(!events.includes('keydown'));
A.play('buy_gear');assert.equal(played.length,1);assert.match(played[0],/sfx_correct_0[123]\.wav$/);
const map=JSON.parse(fs.readFileSync(path.join(root,'assets/audio_map.json'),'utf8'));assert.deepEqual(Array.from(A.map().buy_gear.files),map.buy_gear.files);
for(const file of map.buy_gear.files)assert(fs.existsSync(path.join(process.env.ASSET_ROOT||root,'assets/audio',file)));
console.log('PASS: no voice playback, voice element or unlock listener; written dialogue kept; blacksmith purchase resolves to existing WAV SFX.');
