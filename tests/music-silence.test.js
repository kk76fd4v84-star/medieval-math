// Real music controller, fake audio: these tests must never play audible media.
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict'), path = require('node:path');
const root = process.env.GAME_ROOT || path.resolve(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'src/engine/music.js'), 'utf8');
const buses = [];
function page(saved = {muted:false, volume:.7}) {
  const listeners = {}, documentListeners = {}, audios = [], timers = [], media = {}, pending = [];
  let now = 0, loads = 0;
  class Audio {
    constructor() { this.paused=true; this.volume=1; this.muted=false; this.events={}; this.calls=0; audios.push(this); }
    addEventListener(k, f) { this.events[k]=f; }
    play() { this.calls++;this.paused=false;return {then:f=>{pending.push(f);return {catch(){}};}}; }
    pause() { this.paused=true; }
  }
  class BroadcastChannel {
    constructor(name) { this.name=name;buses.push(this); }
    postMessage(data) { for (const b of buses) if(b!==this && b.name===this.name && b.onmessage)b.onmessage({data}); }
  }
  const c = {Audio,BroadcastChannel,console,setTimeout(){},clearTimeout(){},setInterval:f=>timers.push(f),performance:{now:()=>now},
    localStorage:{setItem(){}},addEventListener:(k,f)=>listeners[k]=f,
    document:{visibilityState:'visible',addEventListener:(k,f)=>documentListeners[k]=f},
    navigator:{mediaSession:{playbackState:'none',setActionHandler:(k,f)=>media[k]=f}},
    KM_DATA:{music:{volume:.7,crossfade:.1,preload:['title'],root:'/',categories:{title:{tracks:['a.mp3']},world:{tracks:['b.mp3']}},scenes:{title:{cat:'title'},walk:{cat:'world'}}}},
    KM:{Loader:{fetch(){loads++;}}}};
  c.window=c;vm.createContext(c);vm.runInContext(code,c);const m=c.KM.Music;m.settings(saved);
  const tick=()=>{now+=50;timers.forEach(f=>f());};
  const silent=()=>assert(audios.every(a=>a.paused && (a.muted || a.volume===0)));
  return {c,m,audios,listeners,documentListeners,media,pending,tick,silent,loads:()=>loads};
}
const a=page();a.m.preload();assert.equal(a.loads(),0);
a.m.setScene('title');a.listeners.pointerdown();a.listeners.keydown();a.m.setVolume(1);a.tick();a.silent();
assert(a.m.settings().muted);assert(a.audios.every(el=>el.calls===0),'saved unmute + ordinary clicks must not start music');
a.m.toggleMute();a.tick();assert(a.m.state().playing,'explicit music control can opt in');
a.m.setMuted(true);a.silent();a.pending.forEach(f=>f());a.tick();a.silent();
a.m.setScene('walk');a.tick();a.silent();a.audios.forEach(el=>el.events.ended());a.tick();a.silent();
a.m.toggleMute();a.tick();assert(a.m.state().playing);a.c.document.visibilityState='hidden';a.documentListeners.visibilitychange();a.silent();
a.c.document.visibilityState='visible';a.documentListeners.visibilitychange();a.tick();assert(a.m.state().playing&&!a.m.settings().muted,'coming back to the tab resumes the music');
const b=page();
b.m.setScene('walk');b.m.unlock();b.m.toggleMute();b.tick();assert(b.m.state().playing);
a.silent();assert(!a.m.settings().muted,'another game tab starting hushes this one but keeps the player setting');
a.m.setMuted(true);b.silent();assert(!b.m.settings().muted,'a mute elsewhere only hushes this tab');b.m.setMuted(true);
b.m.toggleMute();b.tick();b.listeners.storage({key:'knightMath.musicSilence'});b.silent();
b.m.toggleMute();b.tick();b.media.pause();b.silent();b.tick();b.silent();
b.m.toggleMute();b.tick();b.listeners.pagehide();b.silent();
const reloaded=page({muted:false,volume:1});reloaded.m.setScene('title');reloaded.m.unlock();reloaded.tick();reloaded.silent();
console.log('PASS: silent startup with legacy settings, no audio preload, gameplay/volume keys stay muted, immediate stop, pending play guard, ended/scene changes, hidden/unloaded tabs, cross-tab mute, OS pause and silent reload. Fake audio only.');
