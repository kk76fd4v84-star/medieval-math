// Run against the real scenery renderer without a browser or image decoding.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = process.env.GAME_ROOT || path.resolve(__dirname, '..');
function canvas() {
  const c = { width:1600, height:900 };
  c.getContext = () => ({ canvas:c, drawImage(){}, setTransform(){}, translate(){}, scale(){}, fillRect(){}, clearRect(){}, createLinearGradient(){return {addColorStop(){}};} });
  return c;
}
const images = new Map();
const scope = {console, URLSearchParams, location:{search:''}, document:{createElement:canvas}, KM:{Assets:{loadImg(src){
  if(!images.has(src))images.set(src,{src,_ok:true,naturalWidth:2172,naturalHeight:724});
  return images.get(src);
}}}};
scope.window=scope;vm.createContext(scope);
for(const f of ['src/config/layout.js','src/config/art_v7.js','src/data/scenery.js']) vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),scope,{filename:f});
scope.KM_ART7.parallax['dragon-hill']={size:[2172,724],baseline:642};
for(const f of ['src/config/terrain_v22.js','src/config/terrain_v23.js','src/config/terrain_v24.js','src/engine/scenery.js']) vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),scope,{filename:f});
scope.KM_DATA.scenery.tint.enabled=false;
scope.KM_ART10={foreground:{canvas:[2172,300]}};
const C=scope.KM_DATA.scenery, S=scope.KM.Scenery;
const layerSpeeds=[C.back.find(q=>q.strip==='castle').speed,C.mountains.speed,C.back.find(q=>q.strip==='hills').speed,C.back.find(q=>q.strip==='distant-woods').speed,C.mid.speed,C.front.speed];
assert(layerSpeeds.every((speed,i)=>speed>0 && (!i || speed>layerSpeeds[i-1])), 'Every nearer scenery layer must move faster: '+layerSpeeds.join(' < '));
function capture(cam, swaps={}) {
  const calls=[];
  const ctx={canvas:canvas(),drawImage(im,x,y,w,h){if(im.src)calls.push({src:im.src,x,y,w,h});}};
  S.draw(ctx,cam,0,{seed:1,swaps});S.foreground(ctx,cam,1,500);
  return calls;
}
const rates=new Map([...C.back.map(q=>[scope.KM_ART7.parallax[q.strip].img,q.speed]),[scope.KM_ART7.parallax.canyon.img,C.mountains.speed],[scope.KM_ART7.parallax['barren-rocks'].img,C.mid.speed],['assets/modular-world/ground-rocky.png',C.front.speed]]);
function rate(src){return rates.get(src.replace(/#reflected$/,''));}
// Wide camera sweep includes repeated-strip boundaries and the canyon region.
let checked=0;
for(let cam=100000;cam<=145000;cam+=173) {
  const before=capture(cam),after=capture(cam+2);
  const ordered=before.filter(q=>rate(q.src)!==undefined).map(q=>rate(q.src));
  assert(ordered.every((r,i)=>!i||r>=ordered[i-1]),'Draw order must agree with depth at camera '+cam);
  for(const a of before) {
    const speed=rate(a.src);if(speed===undefined||a.x+a.w<50||a.x>2350)continue;
    assert(after.some(b=>a.src===b.src && Math.abs(b.x-(a.x-2*speed))<1e-7), 'Layer jumped or moved incorrectly at camera '+cam+': '+a.src);
    checked++;
  }
}
console.log('PASS: depth order, leftward motion and strip-boundary continuity ('+checked+' placements).');

// The encounter anchor must never move the landscape origin or foreground.
C.mid.swap={strip:'dragon-hill'};
const original=capture(0), anchored=capture(0,{mid:{at:-18000,on:true}});
assert.deepEqual(anchored,original,'A distant encounter must not shift the opening scenery');
assert(!anchored.some(q=>q.src.includes('/canyon.')), 'No canyon in the introduction');
assert(anchored.some(q=>q.src.includes('/castle.')), 'The castle frames the introduction');
for(let cam=0;cam<10000;cam+=500) assert.equal(S.midBiomeAt(820,cam),'fields');
assert.equal(S.midBiomeAt(820,18000),'village');
assert.equal(S.midBiomeAt(820,26000),'fields');
assert.equal(S.midBiomeAt(820,40000),'fields');
console.log('PASS: castle/meadow opening, slow countryside route, encounter-independent terrain.');
