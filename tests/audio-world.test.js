// Real music controller and data with silent media doubles; never emits audio.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
const assetRoot=process.env.ASSET_ROOT||root;
const code=f=>fs.readFileSync(path.join(root,f),'utf8');
const callbacks={},instances=[];
class Audio {
 constructor(){this.paused=true;this.events={};instances.push(this);}
 addEventListener(k,f){this.events[k]=f;}
 play(){this.paused=false;return Promise.resolve();}
 pause(){this.paused=true;}
}
const c={Audio,console,setInterval(){},performance:{now:()=>0},addEventListener:(k,f)=>callbacks[k]=f,
 document:{visibilityState:'visible',addEventListener(){}},localStorage:{setItem(){}},navigator:{},KM:{}};
c.window=c;vm.createContext(c);
for(const f of ['src/data/music.js','src/engine/music.js'])vm.runInContext(code(f),c);
const M=c.KM.Music,D=c.KM_DATA.music;
assert.equal(D.scenes.title.cat,'world');assert.equal(D.scenes.intro.cat,'world');assert.equal(D.scenes.walk.cat,'world');
const world=Array.from(D.categories.world.tracks);assert.equal(world.length,6);
for(const track of world)assert(fs.existsSync(path.join(assetRoot,D.root,track)),track);
M.setScene('title');callbacks.pointerdown();assert(!M.state().playing,'page stays silent until explicit music button');
M.toggleMute();assert(M.state().playing);assert(world.includes(M.state().track));
const first=M.state().track;M.setScene('intro');M.setScene('walk');assert.equal(M.state().track,first,'intro to road continues the same track');
const played=[first];for(let i=0;i<17;i++){M.channels.world.el.events.ended();played.push(M.state().track);}
for(let i=1;i<played.length;i++)assert.notEqual(played[i],played[i-1],'no immediate repeat, including shuffle boundaries');
for(let i=0;i<played.length;i+=6)assert.equal(new Set(played.slice(i,i+6)).size,6,'each song occurs once per shuffled cycle');
M.setScene('battle');M.setScene('walk');assert.equal(M.state().track,played.at(-1),'world track resumes after combat');
M.setMuted(true);assert(instances.every(a=>a.paused),'music control stops every channel immediately');
const map=JSON.parse(code('assets/audio_map.json'));vm.runInContext(code('src/config/audio_map.js'),c);
// Descriptive _note/_comment metadata may differ; compare every runtime field.
const runtimeMap=m=>Object.fromEntries(Object.entries(m).filter(([k])=>!k.startsWith('_')).map(([k,v])=>[k,Object.fromEntries(Object.entries(v).filter(([f])=>!f.startsWith('_')))]));
assert.deepEqual(runtimeMap(JSON.parse(JSON.stringify(c.KM_AUDIO_MAP))),runtimeMap(map),'file and HTTP runtime maps agree');
for(const key of ['correct','wrong']){assert.equal(map[key].files.length,3);for(const f of map[key].files)assert(f.endsWith('.wav'));}
for(const [event,m] of Object.entries(map)){
 if(event.startsWith('vo_')||!Array.isArray(m.files))continue;
 for(const f of [...m.files,...(m.rare?[m.rare.file]:[])]){
  assert(fs.existsSync(path.join(assetRoot,'assets/audio',f)),event+': '+f);
  if(f.endsWith('.ogg'))assert(fs.existsSync(path.join(assetRoot,'assets/audio',f.replace(/\.ogg$/,'.mp3'))),event+': missing browser fallback');
 }
}
console.log('PASS: six real world tracks, shared title/intro/road queue, three complete shuffle cycles without immediate repeats, combat resume, immediate mute, matching maps and all SFX/browser fallback files present.');
