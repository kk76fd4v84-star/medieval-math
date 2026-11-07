// Perspective is confined to Frank's optional hill encounter. Road coordinates stay intact.
window.KM = window.KM || {};
KM.DragonApproach = (function () {
  const clamp = n => Math.max(0, Math.min(1, n));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);
  const progress = S => { const d = (S.enc && S.enc.depth) || S.deathDepth; return d ? smooth(clamp(d.p)) : 0; };
  const depth = S => (S.enc && S.enc.depth) || S.deathDepth;
  const arena = S => !!(depth(S) && depth(S).scene === 'arena');
  const moving = S => !!(S.enc && S.enc.depth && S.enc.depth.mode === "in");
  const edges = new Map();
  function crest(g, x) {
    const im = KM.Assets.loadImg('assets/frank-encounter/dragon-hill-empty.png');
    if (!im._ok) return g.dragonY;
    if (!edges.has(im)) {
      const c=document.createElement('canvas'); c.width=im.naturalWidth; c.height=im.naturalHeight;
      const z=c.getContext('2d',{willReadFrequently:true}); z.drawImage(im,0,0);
      const a=z.getImageData(0,0,c.width,c.height).data, top=[];
      for(let x=0;x<c.width;x++){let y=0;for(;y<c.height-6;y++)if(a[(y*c.width+x)*4+3]>220 && a[((y+5)*c.width+x)*4+3]>220)break;top.push(y);}
      edges.set(im,top);
    }
    const top=edges.get(im), i=Math.max(0,Math.min(top.length-1,Math.round((x-g.x)/g.w*im.naturalWidth)));
    return g.y + top[i]*g.h/im.naturalHeight;
  }
  function partyPose(S, m, i) {
    if(arena(S))return {x:1000-i*235,y:KM_DATA.world.groundY-10,scale:.82,rear:false};
    const d=depth(S),g=landmark(S);
    if(!d || !g)return {x:m.sx,y:KM_DATA.world.groundY,scale:1,rear:false};
    const u=clamp((d.p-i*.045)/(1-.135)), climb=smooth(clamp(u/.67)), down=smooth(clamp((u-.67)/.33));
    const target=g.dragonX-260-i*70, x=mix(m.sx,target,climb)+down*45;
    const ridge=crest(g,x),scale=mix(1,.32,smooth(u));
    const h=KM.Assets.entityHeight(m.id==='hero'?KM.PartyAbilities.heroArt(m):m.art||'follower_'+(m.skin||1));
    return {x,y:mix(KM_DATA.world.groundY,ridge,climb)+down*(h*.36+35),scale,rear:true,occlude:u>=.67,ridge};
  }
  function landmark(S) {
    const sw = S.swaps && S.swaps.mid, M = KM_DATA.scenery.mid;
    if (!sw || !sw.landmark) return null;
    const q = KM_ART7.parallax[M.swap.strip], s = KM_LAYOUT.art * (M.artScale || KM_DATA.scenery.terrainScale || 1);
    if(arena(S)) { const s=1.25,x=1800-1530*s,y=KM_DATA.world.groundY-70-435*s;
      return {x,y,w:q.size[0]*s,h:q.size[1]*s,dragonX:1800,dragonY:KM_DATA.world.groundY-70,dragonScale:.8,p:1}; }
    const p = progress(S), x = sw.at - S.camX * M.speed;
    return { x, y: M.bottom - q.baseline * s, w: q.size[0] * s, h: q.size[1] * s,
      dragonX: x + 1530 * s, dragonY: M.bottom + (435 - q.baseline) * s,
      dragonScale: 144 * s / KM.Assets.entityHeight("turd_dragon"), p };
  }
  function actorPose(S, a) {
    if (a.id !== "turd_dragon" || !a.hill) return null;
    const g = landmark(S); if (!g) return null;
    return { x: g.dragonX, y: g.dragonY, scale: g.dragonScale, filter: (S.enc && S.enc.revealed) || S.deathDepth ? "" : "grayscale(1) contrast(.75)" };
  }
  function drawHill(ctx, S) {
    const g = landmark(S); if (!g || g.x + g.w < 0 || g.x > KM_LAYOUT.viewW) return;
    const im = KM.Assets.loadImg("assets/frank-encounter/dragon-hill-empty.png");
    if (im._ok) KM.Scenery.drawInked(ctx, im, g.x, g.y, g.w, g.h);
  }
  function rearKey(m) { return m.id === "hero" ? KM.PartyAbilities.heroArt(m) : m.art || (m.companionId === "frank" ? "frank" : "follower_" + (m.skin || 1)); }
  function drawRear(ctx, S, m, i, pose, height) {
    const cfg = window.KM_REAR_PARTY, frames = cfg && cfg.frames[rearKey(m)]; if (!frames) return false;
    const im = KM.Assets.loadImg((cfg.images && cfg.images[rearKey(m)]) || cfg.img); if (!im._ok) return false;
    const f = frames[Math.floor((S.walkT || 0) * 5 + i * .35) % frames.length];
    // Keep each row's native proportions and a shared foot anchor; no stretching between steps.
    const rowHeight = Math.max(...frames.map(r => r[3])), k = height * pose.scale / rowHeight;
    const bob = Math.sin((S.walkT || 0) * Math.PI * 10 + i) * 1.5 * pose.scale;
    ctx.save();
    if(pose.occlude){const g=landmark(S);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(KM_LAYOUT.viewW,0);
      for(let x=KM_LAYOUT.viewW;x>=0;x-=6)ctx.lineTo(x,crest(g,x));ctx.closePath();ctx.clip();}
    ctx.drawImage(im, ...f, pose.x - f[2] * k / 2, pose.y - f[3] * k + bob, f[2] * k, f[3] * k);
    ctx.restore();
    return true;
  }
  function drawInk(ctx,S) {
    const ink=S.ink;if(!ink)return;
    const f=ink.mode==='cover'?clamp(ink.t/.48):1-clamp(ink.t/.7);if(f<=0)return;
    const w=KM_LAYOUT.viewW,h=KM_LAYOUT.artSpaceH;
    ctx.save();ctx.fillStyle='#1e1915';
    if(f>=1)ctx.fillRect(0,0,w,h);
    else { const edge=-180+(w+360)*f;ctx.beginPath();ctx.moveTo(0,0);
      for(let y=-50;y<=h+50;y+=9){const x=edge+Math.sin(y*.021+ink.t*5)*57+Math.sin(y*.071)*23;ctx.lineTo(x,y);}
      ctx.lineTo(0,h+50);ctx.closePath();ctx.fill();
      for(let j=0;j<28;j++){const y=(j*137.3)%h,x=edge+70+Math.sin(j*3.7+ink.t*5)*40;ctx.beginPath();ctx.ellipse(x,y,7+j%5*4,3+j%3*2,-.35,0,Math.PI*2);ctx.fill();}}
    ctx.restore();
  }
  function preload() {
    if (window.KM_REAR_PARTY) KM.Assets.loadImg(KM_REAR_PARTY.img);
    KM.Assets.loadImg("assets/frank-encounter/dragon-hill-empty.png");
    KM.Assets.loadImg(KM_ART.entities.turd_dragon.img);
    const frank=KM_ART.entities.frank, atlas=frank.seq?.idle && KM_ART7.sequences[frank.seq.idle];
    const file=frank.img || atlas?.img;
    if(file)KM.Assets.loadImg(/^assets\//.test(file)?file:KM_ART7.root+file);
  }
  return { progress, moving, arena, partyPose, landmark, actorPose, drawHill, drawRear, drawInk, preload };
})();
