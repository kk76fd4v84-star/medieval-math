// Real controller/data, silent audio doubles. No audio output.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..'),assetRoot=process.env.ASSET_ROOT||root;
const audios=[],ticks=[];let now=0;
class Audio {
 constructor(){this.paused=true;this.events={};this.currentTime=0;audios.push(this);}
 addEventListener(k,f){this.events[k]=f;}
 play(){this.paused=false;return Promise.resolve();}
 pause(){this.paused=true;}
}
const c={Audio,console,setInterval:f=>ticks.push(f),performance:{now:()=>now},addEventListener(){},
 document:{visibilityState:'visible',addEventListener(){}},localStorage:{setItem(){}},navigator:{},KM:{}};
c.window=c;vm.createContext(c);
for(const f of ['src/data/music.js','src/engine/music.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);
const M=c.KM.Music,D=c.KM_DATA.music;
const tick=()=>{for(let i=0;i<30;i++){now+=50;ticks.forEach(f=>f());}};
for(const cat of ['graveyard','tomb','tomb_battle','tomb_boss']){
 for(const f of D.categories[cat].tracks)assert(fs.existsSync(path.join(assetRoot,D.root,f)),f);
}
M.setScene('walk','tomb');M.unlock();assert.equal(M.state().cat,'tomb');
assert(M.state().muted);assert(audios.every(a=>a.paused),'chapter selection must not opt into music');
M.toggleMute();tick();const walk=M.state().track;M.channels.tomb.el.currentTime=32;
M.setScene('battle','tomb');tick();assert.equal(M.state().track,'Tomb regular battle.mp3');
assert(M.channels.tomb.el.paused,'exploration fades out during combat');
M.setScene('walk','tomb');tick();assert.equal(M.state().track,walk);assert.equal(M.state().time,32);
// Each two-track category alternates across shuffle boundaries, including re-entry.
for(const [scene,cat]of [['walk','tomb'],['boss','tomb_boss']]){
 M.setScene(scene,'tomb');const list=[M.state().track];
 for(let i=0;i<7;i++){M.channels[cat].el.events.ended();list.push(M.state().track);}
 assert.equal(new Set(list).size,2);
 for(let i=1;i<list.length;i++)assert.notEqual(list[i],list[i-1]);
}
const boss=M.state().track;M.setScene('walk','tomb');M.setScene('boss','tomb');assert.notEqual(M.state().track,boss);
M.setScene('mega','tomb');assert.equal(M.state().cat,'tomb_boss');
M.setScene('win','tomb');tick();assert.equal(M.state().cat,'tomb');assert(M.channels.tomb_boss.el.paused);
M.setScene('gameover','tomb');tick();assert.equal(M.state().cat,null);assert(audios.every(a=>a.paused));
M.setScene('walk','hollowwood');assert.equal(M.state().track,'Graveyard music.mp3');
M.setScene('riddle','hollowwood');assert.equal(M.state().cat,'graveyard');assert.equal(M.state().sceneDuck,.6);
M.setScene('recruit','hollowwood');assert.equal(M.state().sceneDuck,.75);
M.setScene('rest_tavern','hollowwood');assert.equal(M.state().cat,'graveyard','no sung tavern music outside');
M.setPlace('tavern-interior');assert.equal(M.state().cat,'tavern');
M.setPlace(null);assert.equal(M.state().cat,'graveyard','leaving tavern uses chapter music');
for(const [scene,cat]of [['battle','battle'],['boss','wizard'],['mega','heavy_boss'],['rest_campsite','camp'],['rest_shop','shop']]){
 M.setScene(scene,'hollowwood');assert.equal(M.state().cat,cat,'keep existing score for '+scene);
}
M.setScene('walk','village');assert.equal(M.state().cat,'world');
M.setScene('walk','tomb');M.setMuted(true);tick();assert(audios.every(a=>a.paused));
M.setScene('boss','tomb');M.setScene('walk','hollowwood');tick();assert(audios.every(a=>a.paused));assert(M.state().muted);
console.log('PASS: chapter music files, silent startup, exploration resume, shuffled tomb/boss tracks, combat/victory/death transitions, graveyard tavern restrictions, unchanged village/rest tracks, immediate mute.');
