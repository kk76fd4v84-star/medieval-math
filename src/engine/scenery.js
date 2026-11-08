// Parallax world from KM_ART7 strips + gradient mist layers. Draws in layout units (caller applies k).
// v8: every image at source px x KM_LAYOUT.artScale (G() = KM_LAYOUT.art in layout units); no per-layer factors.
// v9 (Magnus approved): scenery painted with opaque paper-white interiors is drawn so the paper becomes OUR parchment:
//  1) once per image: "colour to alpha" against that image's own paper white W (measured from the image):
//     a = (lum(W) - lum(P)) / lum(W) (0 for paper, 1 for black ink), ink = (P - (1 - a) W) / a. Fully inked pixels (a = 1) keep their painted colour exactly.
//  2) per layer: the image's silhouette (its original alpha) is filled with the parchment exactly as it is painted behind
//     the scene (same parchment tiles + sky, same transform), then the ink is drawn on top.
//  Result per pixel = P + (1 - a) (parchment - W): paper -> the exact parchment pixel behind, ink unchanged, no seam where
//  the opaque interior meets the transparent surroundings. Sizes are untouched (source px x artScale). Characters never use this.
// v10: step 1 is PRECOMPUTED offline (tools/import_v10.py -> assets/v10/ink, KM_ART10.ink). A file:// page cannot read
//  pixels back (tainted canvas), so v9 fell back to the paper-WHITE strips there; v10 never needs getImageData/toDataURL.
//  The runtime computation stays only as a fallback for images that have no precomputed ink. The parchment / sky are the
//  graded copies (KM_ART10.paper: per-channel gain to the reference's paper tone). v10 also adds the frontGround layer.
window.KM = window.KM || {};
KM.Scenery = (function () {
  const A = () => window.KM_ART7, C = () => KM_DATA.scenery;
  const root = p => (/^assets\//.test(p) ? p : A().root + p);
  const img = p => KM.Assets.loadImg(root(p));
  const ok = im => (im && !im._ok && KM.Loader && KM.Loader.want(im), im && im._ok && im.naturalWidth > 0); // v12f: road art asked for by a draw loads first
  const VW = () => KM_LAYOUT.viewW, H = () => KM_LAYOUT.artSpaceH, G = () => KM_LAYOUT.art;
  const OV = () => 1 / KM_LAYOUT.k; // tiles overlap by one stage pixel (exact size, no stretch) so no hairline seams
  const A10 = () => window.KM_ART10, PRE = () => !!(A10() && C().tint && C().tint.precomputed !== false);
  const graded = () => PRE() && C().tint.paperGrade !== false && A10().paper;
  const parchImg = () => img(graded() ? A10().paper.parchment : A().parchment.img), skyImg = () => img(graded() ? A10().paper.sky : A().sky.img);
  const keyOf = src => { const s = decodeURI(src), i = s.lastIndexOf("assets/"); return i < 0 ? s : s.slice(i); };
  function available() { return !!(window.KM_ART7 && C() && C().enabled && ok(img(A().parallax.hills.img))); }
  function preload() {
    ["forest","meadow","rocky","tundra"].forEach(b => img("assets/modular-world/ground-"+b+".png"));
    if (A11()) { (A11().clouds || []).forEach(c => img("assets/v11/ui/" + c.img)); (A11().birds || []).forEach(b => b.frames.forEach(f => img("assets/v11/ui/" + f))); }
    if (!window.KM_ART7) return; const a = A(); [...Object.values(a.parallax).map(p => p.img), ...a.trees.map(t => t.img)].forEach(img); parchImg(); skyImg();
    if (A10()) { Object.values(A10().walks).filter(w=>w.img).forEach(w => img(w.img)); Object.values(A10().foreground.strips).flat().forEach(s => img(A10().foreground.root + s)); if (PRE()) { Object.values(A10().ink).forEach(v => img(v.img)); img(A10().dividerInk.img); } }
  }

  // ---- 1) colour-to-alpha ink layers (computed once per image; null = not possible, e.g. file:// tainted canvas)
  const inkCache = new Map(), paperOf = new Map(), WAIT = "wait";
  // -> ink canvas/image, WAIT (precomputed ink still loading: draw nothing yet, never the white paper), or null (no tint)
  function inkOf(im) {
    if (!C().tint || !C().tint.enabled) return null;
    if (inkCache.has(im)) return inkCache.get(im);
    if(KM.Palette?.profile(im))return runtimeInk(im);
    const pre = PRE() && A10().ink[keyOf(im.src)];
    if (pre) { const ii = img(pre.img); if (!ok(ii)) return ii._bad ? runtimeInk(im) : WAIT; paperOf.set(im, pre.paper); inkCache.set(im, ii); return ii; }
    return runtimeInk(im);
  }
  function runtimeInk(im) {
    if (inkCache.has(im)) return inkCache.get(im);
    let out = null;
    if(KM.Palette?.profile(im)){out=KM.Palette.ink(im);if(out){inkCache.set(im,out);paperOf.set(im,KM.Palette.profile(im).paper);return out;}}
    try {
      const w = im.naturalWidth, h = im.naturalHeight, c = document.createElement("canvas"); c.width = w; c.height = h;
      const g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(im, 0, 0);
      const d = g.getImageData(0, 0, w, h), p = d.data;
      // Safari: an image can report loaded while drawImage still reads it as fully transparent (not decoded yet). Caching
      // that empty read hid the whole background for good; read nothing -> try again on a later frame instead.
      let any = false; for (let i = 3; i < p.length; i += 4096) if (p[i]) { any = true; break; }
      if (!any) { for (let i = 3; i < p.length; i += 4) if (p[i]) { any = true; break; } if (!any) return WAIT; }
      // the paper white: per-channel high percentile of the near-opaque, bright (paper) pixels of THIS image
      const hist = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)]; let n = 0;
      for (let i = 0; i < p.length; i += 4) if (p[i + 3] >= 240 && p[i] + p[i + 1] + p[i + 2] >= 660) { hist[0][p[i]]++; hist[1][p[i + 1]]++; hist[2][p[i + 2]]++; n++; }
      const pct = C().tint.paperPercentile, W = [0, 1, 2].map(k => { if (!n) return 255; let acc = 0; for (let v = 0; v < 256; v++) { acc += hist[k][v]; if (acc >= n * pct) return Math.max(v, 1); } return 255; });
      const LW = 0.299 * W[0] + 0.587 * W[1] + 0.114 * W[2];
      for (let i = 0; i < p.length; i += 4) {
        const a0 = p[i + 3]; if (!a0) continue;
        // ink amount from luminance (paper grain / hue noise -> ~0, so paper becomes exactly the parchment)
        const a1 = (LW - (0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2])) / LW; let a = a1 > 0 ? a1 : 0;
        if (a <= 0) { p[i + 3] = 0; continue; }
        if (a > 1) a = 1;
        for (let k = 0; k < 3; k++) { const v = (p[i + k] - (1 - a) * W[k]) / a; p[i + k] = v < 0 ? 0 : v > 255 ? 255 : v; }
        p[i + 3] = Math.round(a * a0);
      }
      g.putImageData(d, 0, 0); out = c; paperOf.set(im, W);
    } catch (e) { console.info("[scenery] tint unavailable, drawing the strip as painted:", e.message); out = null; }
    inkCache.set(im, out); return out;
  }
  // ---- the parchment exactly as painted behind the scene (rebuilt until its images have loaded)
  let PB = null, pbReady = false;
  function parchmentCanvas(ctx) {
    if (PB && pbReady) return PB;
    const a = A(), K = KM_LAYOUT.k; PB = PB || document.createElement("canvas");
    PB.width = Math.round(VW() * K); PB.height = Math.round(H() * K);
    const g = PB.getContext("2d"); g.setTransform(K, 0, 0, K, 0, 0); parchment(g);
    pbReady = ok(parchImg()) && ok(skyImg()); return PB;
  }
  // ---- 2) draw a set of placements [im, x, y, w, h] of one layer through the tint
  // all scratch work is limited to the device-pixel box the layer covers (strips ~2/3 of the scene, a tree much less)
  let scr = null;
  function scratch(ctx) {
    const cv = ctx.canvas; scr = scr || document.createElement("canvas");
    if (scr.width !== cv.width || scr.height !== cv.height) { scr.width = cv.width; scr.height = cv.height; }
    return scr.getContext("2d");
  }
  // device-size caches (resampled ONCE at exactly source px x artScale, high quality) so each frame only blits
  const devCache = new Map();
  function devOf(src, key, w, h) {
    const k = key + "|" + w + "x" + h; if (devCache.has(k)) return devCache.get(k);
    const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d");
    g.imageSmoothingQuality = "high"; g.drawImage(src, 0, 0, w, h); devCache.set(k, c); return c;
  }
  // v12g (Magnus: "a lot of see-through images"): the silhouette that hides what is behind a drawing is made SOLID: the
  // painted alpha is hardened once per device-size copy (soft canopy / brush alpha -> opaque), so back layers never show through
  function solidOf(src, key, w, h) {
    // Clean exports already have opaque interiors and tight edge antialiasing.
    // Do not expand that edge into the old 12..44-alpha matte silhouette.
    if (key.includes("assets/terrain-clean/")) return devOf(src, key, w, h);
    const k = key + "|solid|" + w + "x" + h; if (devCache.has(k)) return devCache.get(k);
    const c = devOf(src, key, w, h), o = document.createElement("canvas"); o.width = w; o.height = h; const g = o.getContext("2d"); g.drawImage(c, 0, 0);
    try { const d = g.getImageData(0, 0, w, h), a = d.data; for (let i = 3; i < a.length; i += 4) a[i] = a[i] < 12 ? 0 : a[i] > 44 ? 255 : (a[i] - 12) * 8; g.putImageData(d, 0, 0); } catch (e) {}
    devCache.set(k, o); return o;
  }
  function inked(ctx, draws) {
    if (!draws.length) return;
    const inks = draws.map(d => inkOf(d[0]));
    if (inks.some(x => x === WAIT)) return;
    if (inks.some(x => !x)) { draws.forEach(d => ctx.drawImage(d[0], d[1], d[2], d[3], d[4])); return; }
    const T = ctx.getTransform();
    if (T.b || T.c) { draws.forEach(d => ctx.drawImage(d[0], d[1], d[2], d[3], d[4])); return; } // (never rotated in this game)
    // d[5] (optional) = layout x where the NEXT tile starts: the width then snaps to it (abutting tiles, no gap/overlap px)
    const place = draws.map((d, i) => { const x = Math.round(T.a * d[1] + T.e), w = d[5] != null ? Math.round(T.a * d[5] + T.e) - x : Math.round(d[3] * T.a), h = Math.round(d[4] * T.d);
      return { x, y: Math.round(T.d * d[2] + T.f), sil: solidOf(d[0], d[0].src, w, h), ink: devOf(inks[i], d[0].src + "#ink", w, h) }; });
    const cv = ctx.canvas, bx0 = Math.max(0, Math.min(...place.map(q => q.x))), by0 = Math.max(0, Math.min(...place.map(q => q.y)));
    const bx1 = Math.min(cv.width, Math.max(...place.map(q => q.x + q.sil.width))), by1 = Math.min(cv.height, Math.max(...place.map(q => q.y + q.sil.height)));
    if (bx1 <= bx0 || by1 <= by0) return;
    const B = [bx0, by0, bx1 - bx0, by1 - by0], s = scratch(ctx), pb = parchmentCanvas(ctx), ox = Math.round(T.e), oy = Math.round(T.f);
    s.setTransform(1, 0, 0, 1, 0, 0); s.globalAlpha = 1; s.filter = "none"; s.globalCompositeOperation = "source-over"; s.clearRect(B[0], B[1], B[2], B[3]);
    // Composite each solid cutout BEFORE the next one. A union mask followed by
    // all ink layers let distant lines show through overlapping foreground props.
    for (const q of place) {
      s.globalCompositeOperation="source-over";s.clearRect(...B);
      s.drawImage(q.sil,q.x,q.y);
      s.globalCompositeOperation="source-in";
      s.drawImage(pb,B[0]-ox,B[1]-oy,B[2],B[3],...B);
      s.globalCompositeOperation="source-over";s.drawImage(q.ink,q.x,q.y);
      ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(scr,...B,...B);ctx.restore();
    }
  }
  const mirrored = new WeakMap();
  function reflected(im) {
    if (mirrored.has(im)) return mirrored.get(im);
    const ii=inkOf(im); if (ii===WAIT) return null;
    const flip=src=>{const c=document.createElement("canvas");c.width=im.naturalWidth;c.height=im.naturalHeight;
      const g=c.getContext("2d");g.translate(c.width,0);g.scale(-1,1);g.drawImage(src,0,0);return c;};
    const c=flip(im);c.src=im.src+"#reflected";c.naturalWidth=c.width;c.naturalHeight=c.height;
    inkCache.set(c,ii ? flip(ii) : null);mirrored.set(im,c);return c;
  }
  // Overlap the drawn bare-ground ends; never clip complete trees or cliffs.
  const terrainOverlap = () => C().terrainOverlap || 640;
  const terrainScale = layer => G() * ((layer && layer.artScale) || C().terrainScale || 1);
  function strip(ctx, name, L, camX) {
    const p = A().parallax[name]; if (!p) return; const im = img(p.img); if (!ok(im)) return;
    const s = terrainScale(), w = p.size[0] * s, h = p.size[1] * s, y = L.bottom - (p.baseline || p.size[1])*s, step = w - terrainOverlap()*s;
    if (L.once != null) {
      const x = L.once - camX * L.speed - p.size[0]*(s-G())/2;
      if (!L.crop) return inked(ctx, [[im, x, y, w, h]]);
      const [x0, y0, x1, y1] = L.crop; // source px: only this part of the strip shows (e.g. the dragon off its hill strip)
      if (x + x1 * s < 0 || x + x0 * s > VW()) return;
      ctx.save(); ctx.beginPath(); ctx.rect(x + x0 * s, y + y0 * s, (x1 - x0) * s, (y1 - y0) * s); ctx.clip();
      inked(ctx, [[im, x, y, w, h]]); ctx.restore(); return;
    }
    const first=Math.floor(camX*L.speed/step)-1, off=camX*L.speed-first*step, draws=[];
    for (let i=first,x=-off;x<VW();i++,x+=step) {const base=(i%2) ? reflected(im) : im;const tile=base;if(tile) draws.push([tile,x,y,w,h]);}
    inked(ctx, draws);
  }
  // The parchment behind the scene (also what paper-white interiors become, and the strip below). The parchment / sky
  // crops are not seamless tiles: they are made seamless ONCE by cross-fading `overlap` source px of the far edge into the
  // near edge (no mirroring, so no symmetric stain pairs; no scaling), and the darker vignette edges are left out
  // (C().paper / skyPaper rects). The sky's lower edge melts into the parchment over skyPaper.fade source rows.
  const seamCache = new Map();
  const canvas = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
  function fadeMask(c, x0, y0, x1, y1) { // keep c's alpha only through a 1 -> 0 ramp from (x0,y0) to (x1,y1) inside that box
    const g = c.getContext("2d"); g.globalCompositeOperation = "destination-in";
    const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, "#000"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
    g.globalCompositeOperation = "source-over"; return c;
  }
  function seamless(im, r, ox, oy, fadeRows) {
    const key = im.src + JSON.stringify([r, ox, oy, fadeRows]); if (seamCache.has(key)) return seamCache.get(key);
    const w = r[2] - ox, h = r[3] - oy;
    // 1) horizontally seamless, full source height: body cols, then the far `ox` cols fading in over the first `ox` cols
    const hs = canvas(w, r[3]), hg = hs.getContext("2d");
    hg.drawImage(im, r[0], r[1], w, r[3], 0, 0, w, r[3]);
    if (ox) { const e = canvas(ox, r[3]); e.getContext("2d").drawImage(im, r[0] + w, r[1], ox, r[3], 0, 0, ox, r[3]); hg.drawImage(fadeMask(e, 0, 0, ox, 0), 0, 0); }
    // 2) vertically: rows [0, h), then rows [h, h + oy) fading in over the first `oy` rows
    const c = canvas(w, h), g = c.getContext("2d"); g.drawImage(hs, 0, 0, w, h, 0, 0, w, h);
    if (oy) { const e = canvas(w, oy); e.getContext("2d").drawImage(hs, 0, h, w, oy, 0, 0, w, oy); g.drawImage(fadeMask(e, 0, 0, 0, oy), 0, 0); }
    if (fadeRows) { g.globalCompositeOperation = "destination-in"; const gr = g.createLinearGradient(0, h - fadeRows, 0, h); gr.addColorStop(0, "#000"); gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = "#000"; g.fillRect(0, 0, w, h - fadeRows); g.fillStyle = gr; g.fillRect(0, h - fadeRows, w, fadeRows); g.globalCompositeOperation = "source-over"; }
    seamCache.set(key, c); return c;
  }
  function parchment(ctx, span) { // span: layout height to cover (default the scene; the strip continues below it)
    const im = parchImg(), sk = skyImg(), HH = span || H(), P = C().paper;
    ctx.fillStyle = "#ecdcb6"; ctx.fillRect(0, 0, VW(), HH);
    if (ok(im)) { const T = seamless(im, P.rect, P.overlap[0], P.overlap[1]), w = T.width * G(), h = T.height * G();
      const k=KM_LAYOUT.k;
      for (let y=0;y<HH;y+=h) for(let x=0;x<VW();x+=w) {
        const x0=Math.round(x*k)/k,y0=Math.round(y*k)/k;
        const x1=Math.round((x+w)*k)/k,y1=Math.round((y+h)*k)/k;
        ctx.drawImage(T,x0,y0,x1-x0,y1-y0);
      } }
    if (ok(sk)) { const S = C().skyPaper, T = seamless(sk, S.rect, S.overlap, 0, S.fade), w = T.width * G();
      for (let x = 0; x < VW(); x += w) ctx.drawImage(T, x, C().sky.y || 0, w, T.height * G()); }
  }
  function background(ctx) { // the parchment: blit the cached canvas (identical pixels to parchment())
    const pb = parchmentCanvas(ctx); ctx.drawImage(pb, 0, 0, VW(), H());
  }
  // Mist. GAME_DESIGN: separate gradient layers (rear fades more, front lighter). The handoff's "white" mist was the
  // colour of its paper-white interiors; v9 paper is the parchment, so the default mist is made of THE parchment pixels
  // (paper stays exactly the reference's even tone, only the ink fades with distance). M.color = "r,g,b" gives a flat
  // colour mist instead (e.g. "255,253,246" = the old white mist).
  function mist(ctx, M) {
    if (!M || !M.alpha) return;
    if (M.color) {
      const g = ctx.createLinearGradient(0, M.from, 0, M.to);
      g.addColorStop(0, `rgba(${M.color},0)`); g.addColorStop((M.peak - M.from) / (M.to - M.from), `rgba(${M.color},${M.alpha})`); g.addColorStop(1, `rgba(${M.color},0)`);
      ctx.fillStyle = g; ctx.fillRect(0, M.from, VW(), M.to - M.from); return;
    }
    paperGradient(ctx, [[M.from, 0], [M.peak, M.alpha], [M.to, 0]]);
  }
  // the parchment itself through a vertical alpha ramp: stops = [[y, alpha], ...] in layout units
  // screen-static, so each ramp is rendered ONCE (per config) and then blitted
  const rampCache = new Map();
  function paperGradient(ctx, stops, fillBelow) {
    const key = JSON.stringify([stops, !!fillBelow]), pb = parchmentCanvas(ctx);
    let c = pbReady && rampCache.get(key);
    if (!c) {
      const K = KM_LAYOUT.k, y0 = stops[0][0], y1 = stops[stops.length - 1][0];
      c = document.createElement("canvas"); c.width = pb.width; c.height = pb.height; const g = c.getContext("2d"); g.setTransform(K, 0, 0, K, 0, 0);
      const gr = g.createLinearGradient(0, y0, 0, y1); stops.forEach(([y, al]) => gr.addColorStop((y - y0) / (y1 - y0), `rgba(0,0,0,${al})`));
      g.fillStyle = gr; g.fillRect(0, y0, VW(), y1 - y0); if (fillBelow) { g.fillStyle = "#000"; g.fillRect(0, y1, VW(), H() - y1); }
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = "source-in"; g.drawImage(pb, 0, 0);
      if (pbReady) rampCache.set(key, c);
    }
    ctx.drawImage(c, 0, 0, VW(), H());
  }
  // Encounter landmarks have independent world anchors. Never phase the terrain
  // route around Frank: doing so can put the canyon at the new-game origin.
  // Canyon formations are distant landmarks, not roadside props. Their camera
  // anchor is centred on the canyon biome; slow parallax brings them into view
  // continuously before arrival and lets them recede afterwards.
  function mountains(ctx,camX,hooks) {
    const L=C().mountains;if(!L)return;
    const M=C().mid,q=A().parallax[L.strip],im=img(q.img);if(!ok(im))return;
    const region=(A().parallax.fields.size[0]-terrainOverlap())*terrainScale(M)*M.segment;
    const period=region*M.biomes.length/M.speed;
    const centre=((M.biomes.indexOf(L.biome)+.5)*region-VW()/2)/M.speed;
    const s=G()*L.artScale,w=q.size[0]*s,h=q.size[1]*s;
    const nearest=Math.round((camX-centre)/period);
    for(let n=nearest-1;n<=nearest+1;n++) {
      const x=VW()/2+(centre+n*period-camX)*L.speed-w/2;
      if(x+w<0||x>VW())continue;
      inked(ctx,[[im,x,L.bottom-q.baseline*s,w,h]]);
    }
  }
  function mid(ctx, camX, hooks) {
    const M = C().mid, p = A().parallax.fields, s = terrainScale(M), w = p.size[0] * s, step = w - terrainOverlap()*s, sw = M.swap && hooks && hooks.swaps && hooks.swaps.mid;
    const off = camX * M.speed;
    // A unique church; never mirror or repeat it with the village terrain row.
    // Draw before the cottages so their solid ground correctly covers its base.
    const landmark=M.landmark;
    if(landmark) {
      const q=A().parallax[landmark.strip],im=q&&img(q.img);
      if(ok(im)) {
        const centre=(M.biomes.indexOf(landmark.biome)*M.segment+landmark.tileOffset)*step;
        const x=centre-off-landmark.anchorX*s, width=q.size[0]*s;
        if(x+width>0 && x<VW()) inked(ctx,[[im,x,M.bottom-landmark.rise-q.baseline*s,width,q.size[1]*s]]);
      }
    }
    const first = Math.floor(off / step)-1, last = Math.floor((off + VW()) / step)+1, draws = [], tiles=[];
    for (let i = first; i <= last; i++) {
      const biome = M.biomes[((Math.floor(i / M.segment) % M.biomes.length) + M.biomes.length) % M.biomes.length];
      // Low rocky ground occupies the near lane in the canyon region.
      const mountain=C().mountains;
      if(mountain && biome===mountain.biome) {
        const q=A().parallax[mountain.nearStrip],im=img(q.img),ns=G()*mountain.nearScale;
        if(!ok(im))continue;
        const nw=q.size[0]*ns,nh=q.size[1]*ns,advance=(q.size[0]-terrainOverlap())*ns;
        const count=Math.max(1,Math.ceil(step/advance)),pitch=step/count;
        for(let j=0;j<count;j++) {
          const tile=(i*count+j)%2?reflected(im):im;
          if(tile)draws.push([tile,i*step-off+j*pitch,M.bottom-q.baseline*ns,nw,nh]);
        }
        continue;
      }
      // Choose a stable woodland drawing per tile; camera movement cannot shuffle it.
      const variants=M.variants&&M.variants[biome];
      const cycle=Math.floor(i/(M.biomes.length*M.segment));
      const local=((i%M.segment)+M.segment)%M.segment;
      const pick=variants&&variants[((cycle*M.segment+local)%variants.length+variants.length)%variants.length];
      const q = A().parallax[pick||biome], im = img(q.img); if (!ok(im)) continue;
      const base = (i%2 && biome !== "dragon-hill") ? reflected(im) : im;
      const tile=base;
      if(tile) {
        const bs=M.biomeScale&&M.biomeScale[biome]?G()*M.biomeScale[biome]:s;
        const bw=q.size[0]*bs;
        const d=[tile,i*step-off+(w-bw)/2,M.bottom-(q.baseline||q.size[1])*bs,bw,q.size[1]*bs];
        draws.push(d);tiles.push({i,biome,d});
      }
    }
    inked(ctx, draws);
    // Frank's dragon stays where the encounter placed it without moving any
    // biome, church, foreground or mountain. Its own paper ground overlaps here.
    if(sw && sw.on) {
      const q=A().parallax[M.swap.strip],im=q&&img(q.img),x=sw.at-off;
      if(q && ok(im) && x+q.size[0]*s>0 && x<VW())
        inked(ctx,[[im,x,M.bottom-(q.baseline||q.size[1])*s,q.size[0]*s,q.size[1]*s]]);
    }
  }
  // the mid strip's lower ink melts into the ground: a gradient of the SAME parchment pixels (no flat colour band)
  function groundFade(ctx) { const F = C().groundFade; if (F) paperGradient(ctx, [[F.from, 0], [F.to, 1]], true); }
  // ---- v11b sky life (Magnus's painted clouds + birds, KM_ART11; tools/import_v11.py). Drawn right after the parchment/sky,
  // BEHIND the back layer (castle, hills, distant woods). Everything at source px x artScale (G()), ink exactly as painted
  // (the scenery's ink is the painted black; these sheets are already ink on transparent). All placement is seeded per run.
  const SKY = () => Object.assign({ cloudTop: [110, 250], cloudGap: [650, 1500], cloudDrift: 9, cloudPar: 0.08,
    birdBand: [150, 330], birdEvery: [28, 70], birdSpeed: [95, 140], birdPar: 0.1, flapFps: 9, bob: 7 }, C().sky || {});
  const A11 = () => window.KM_ART11;
  const rngOf = seed => { let a = (seed >>> 0) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const between = (r, [a, b]) => a + r() * (b - a);
  let SK = null, skyLast = { clouds: [], birds: [] };
  const PING = [0, 1, 2, 3, 2, 1]; // wing-flap ping-pong: frames 1-2-3-4-3-2
  // keep = rects (layout units) the sky must leave clear (the monsters' hearts): a cloud or bird touching one fades out
  // over ~0.3 s and comes back once clear, so nothing pops and nothing ever sits on the hearts
  const hitsKeep = (r, keep) => keep.some(k => r.x < k.x + k.w + 14 && r.x + r.w > k.x - 14 && r.y < k.y + k.h + 14 && r.y + r.h > k.y - 14);
  const fade = (o, on, dt) => (o.a = Math.max(0, Math.min(1, (o.a == null ? 1 : o.a) + (on ? 1 : -1) * dt / 0.3)));
  function skyLife(ctx, camX, t, seed, keep) {
    keep = keep || [];
    const a11 = A11(); if (!a11 || !a11.clouds) return;
    const P = SKY(), g = G(), vw = VW();
    if (!SK || SK.seed !== seed || t < SK.t0) {
      SK = { seed, t0: t, rc: rngOf(seed * 7 + 11), rb: rngOf(seed * 13 + 5), slots: [], flocks: [], nextBird: 0, lastCam: camX, birdsSeen: 0 };
      SK.nextBird = t + between(SK.rb, [8, 24]);
    }
    // clouds: an endless seeded row in "sky space"; each next cloud starts at least cloudGap[0] after the previous one ENDS,
    // and the whole row moves as one (gentle drift + back-layer parallax), so no two clouds can ever overlap
    const off = (t - SK.t0) * P.cloudDrift + camX * P.cloudPar;
    while (!SK.slots.length || SK.slots[SK.slots.length - 1].x < off + vw + 200) {
      const prev = SK.slots[SK.slots.length - 1], i = Math.floor(SK.rc() * a11.clouds.length), Cl = a11.clouds[i];
      SK.slots.push({ i, w: Cl.size[0] * g * (P.cloudMul||0.55), h: Cl.size[1] * g * (P.cloudMul||0.55), y: between(SK.rc, P.cloudTop), x: prev ? prev.x + prev.w + between(SK.rc, P.cloudGap) : -between(SK.rc, [100, 700]) + off });
    }
    while (SK.slots.length > 1 && SK.slots[0].x + SK.slots[0].w < off - 50) SK.slots.shift();
    const clouds = [];
    const dt = Math.max(0, Math.min(0.25, t - (SK.lastT == null ? t : SK.lastT))), dcam = camX - SK.lastCam; SK.lastT = t; SK.lastCam = camX;
    SK.slots.forEach(q => { const x = q.x - off; if (x > vw || x + q.w < 0) return; const im = img("assets/v11/ui/" + a11.clouds[q.i].img);
      const al = fade(q, !hitsKeep({ x, y: q.y, w: q.w, h: q.h }, keep), dt); if (ok(im) && al > 0) { ctx.save(); ctx.globalAlpha *= al; ctx.drawImage(im, x, q.y, q.w, q.h); ctx.restore(); } if (al > 0) clouds.push({ x, y: q.y, w: q.w, h: q.h, i: q.i, a: al }); });
    // birds: now and then (seeded interval) a single bird or a flock of 2-3 crosses the sky at cloud depth
    if (a11.birds && t >= SK.nextBird) {
      const r = SK.rb, n = r() < 0.55 ? 1 : r() < 0.6 ? 2 : 3, dir = r() < 0.5 ? 1 : -1, sp = between(r, P.birdSpeed), y = between(r, P.birdBand), small = r() < 0.5 ? 1 : 0;
      const members = Array.from({ length: n }, (_, k) => ({ row: k ? (r() < 0.5 ? 1 : small) : small, dx: k ? -k * between(r, [140, 230]) : 0, dy: k ? between(r, [-45, 45]) : 0, ph: r() * 6, fps: P.flapFps * between(r, [0.85, 1.15]) }));
      SK.flocks.push({ x: dir > 0 ? -300 : vw + 300, y, dir, sp, members, born: t }); SK.birdsSeen += n;
      SK.nextBird = t + between(r, P.birdEvery);
    }
    const birds = [];
    SK.flocks.forEach(f => {
      f.x += f.dir * f.sp * dt - dcam * P.birdPar;
      f.members.forEach(m => {
        const B = a11.birds[m.row], fr = PING[Math.floor((t + m.ph) * m.fps) % PING.length], w = B.size[0] * g * ((P.birdMul||0.5)*0.5), h = B.size[1] * g * ((P.birdMul||0.5)*0.5);
        const x = f.x + f.dir * m.dx, y = f.y + m.dy + Math.sin((t + m.ph) * 2.2) * P.bob;
        const im = img("assets/v11/ui/" + B.frames[fr]), al = fade(m, !hitsKeep({ x: x - w / 2, y: y - h / 2, w, h }, keep), dt);
        if (ok(im) && al > 0) { ctx.save(); ctx.globalAlpha *= al; ctx.drawImage(im, x - w / 2, y - h / 2, w, h); ctx.restore(); }
        if (al > 0) birds.push({ x: x - w / 2, y: y - h / 2, w, h, frame: fr + 1, row: m.row, a: al });
      });
    });
    SK.flocks = SK.flocks.filter(f => (f.dir > 0 ? f.x - 900 < vw + 300 : f.x + 900 > -300));
    skyLast = { clouds, birds, flocks: SK.flocks.length, birdsSeen: SK.birdsSeen, nextBird: SK.nextBird, t };
  }
  // hooks: { midLane(ctx), seed } drawn in the right depth slot
  function draw(ctx, camX, t, hooks) {
    if(hooks?.chapter==="hollowwood")return KM.HollowWood.draw(ctx,camX,t,hooks);
    const c = C();
    background(ctx);
    skyLife(ctx, camX, t, (hooks && hooks.seed) || 1, hooks && hooks.keepOut);
    // Occlusion and movement must describe the same depth: farthest first.
    // The castle is farther than the cliffs; the hills/woods are nearer.
    const distant=c.back.map(layer=>({speed:layer.speed,layer}));
    if(c.mountains)distant.push({speed:c.mountains.speed,mountain:true});
    distant.sort((a,b)=>a.speed-b.speed).forEach(q=>{
      if(q.mountain)mountains(ctx,camX,hooks);
      else if(!(q.layer.hideWhen&&hooks?.flags?.[q.layer.hideWhen]))strip(ctx,q.layer.strip,q.layer,camX);
    });
    mist(ctx, c.rearMist);
    mid(ctx, camX, hooks);
    if(hooks?.graveLane)hooks.graveLane(0);
    if (hooks && hooks.midLane) hooks.midLane(ctx);
    mist(ctx, c.frontMist);
  }
  // trees beside the road (front scenery, drawn behind the party): positions chosen by the game (clear of halts)
  function tree(ctx, i, x) {
    const T = A().trees[i % A().trees.length], im = img(T.img); if (!ok(im)) return;
    const L = C().trees, s = G(); inked(ctx, [[im, x - T.anchor[0] * s, L.y - T.anchor[1] * s, T.size[0] * s, T.size[1] * s]]);
  }
  const treeWidth = i => { const T = A().trees[i % A().trees.length]; return T.size[0] * G(); };
  // ---- v10 frontGround (Magnus's medieval-math-biomes-v11 strips; its README + choose-strip.js, followed exactly):
  // 2172x300 strips, ground line y = 270 aligned to the character ground baseline, drawn ABOVE the actors and below
  // the UI, tile x = index * width - cameraX (parallax 1.0 = moves with the road), variant = ForegroundTiles.choose(
  // biome, tileIndex, runSeed): stable per run (never re-rolled per frame). Same paper treatment as the other scenery
  // (paper -> the parchment, white never made transparent). biomeAt(tileIndex) comes from the game.
  function fgChoose(biome, tileIndex, seed) { // == choose-strip.js choose() (copied in assets/v10/foreground/choose-strip.js)
    const biomes = ["forest", "tundra", "rocky", "meadow"]; let n = (Math.imul(tileIndex | 0, 374761393) ^ Math.imul(seed | 0, 668265263) ^ Math.imul(biomes.indexOf(biome) + 1, 1274126177)) >>> 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177) >>> 0; n = (n ^ (n >>> 16)) >>> 0; return "strips/" + biome + "-" + (n % 3 + 1) + ".png";
  }
  function fgVisible(cameraX, viewWidth, scale) { // == choose-strip.js visible()
    const w = 2172 * scale, first = Math.floor(cameraX / w);
    return Array.from({ length: Math.ceil(viewWidth / w) + 2 }, (_, i) => ({ index: first + i, x: (first + i) * w - cameraX, width: w }));
  }
  const fgWidth = () => (A10() ? A10().foreground.canvas[0] * G() : 0);
  // biomeAt(tileIndex): the mid-scenery biome that stands behind the party when the party reaches that front tile
  // (stable per tile; mid biome -> foreground biome via C().front.biomes; several options -> seeded, stable pick)
  function midBiomeAt(screenX, camX) {
    const M = C().mid, step = (A().parallax.fields.size[0]-terrainOverlap()) * terrainScale(M), i = Math.floor((screenX + camX * M.speed) / step);
    return M.biomes[((Math.floor(i / M.segment) % M.biomes.length) + M.biomes.length) % M.biomes.length];
  }
  function fgBiomeAt(tileIndex, seed, partyX) {
    const L = C().front, w = fgWidth(), cam = ((tileIndex + 0.5) * w - partyX) / L.speed, opts = L.biomes[midBiomeAt(partyX, cam)] || ["meadow"];
    if (opts.length === 1) return opts[0];
    let h = (Math.imul(tileIndex | 0, 2246822519) ^ Math.imul(seed | 0, 3266489917)) >>> 0; h = Math.imul(h ^ (h >>> 15), 668265263) >>> 0; h = (h ^ (h >>> 13)) >>> 0;
    return opts[h % opts.length]; // fair, stable per tile + run seed
  }
  function foreground(ctx, camX, seed, partyX) {
    const biomeAt = i => fgBiomeAt(i, seed, partyX);
    const F = A10() && A10().foreground, L = C().front; if (!F || !L || !L.enabled) return;
    // Use the continuous original middle, excluding the old pasted rectangular end caps.
    // Alternate reflections so each repeated edge meets its identical source edge.
    const s=G(),w=1940*s,y=L.groundY-270*s,draws=[],off=camX*L.speed;
    for(let i=Math.floor(off/w);i*w-off<VW();i++){
      const x=i*w-off,worldCenter=i*w+w/2;
      const oldIndex=Math.floor(worldCenter/fgWidth()),biome=biomeAt(oldIndex);
      const original=img('assets/modular-world/ground-'+biome+'.png');if(!ok(original))return;
      const im=i%2?reflected(original):original;if(!im)return;
      draws.push([im,x,y,w+OV(),280*s]);
    }
    inked(ctx, draws);
  }
  // ---- the HTML strip below the scene continues the SAME mirrored parchment tiles (one continuous sheet), with only the
  // INK of the painted ground divider (strip_bg's top rows, colour-to-alpha against its own paper) laid on top.
  let dividerInk = null;
  function dividerInkOf(im) {
    if (dividerInk) return dividerInk;
    if (PRE()) { const d = img(A10().dividerInk.img); return ok(d) ? (dividerInk = d) : null; }
    const D = C().divider, [x0, y0, w, h] = D.rect, c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(im, x0, y0, w, h, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h), p = d.data, med = k => { const v = []; for (let i = k + w * 4 * (h - 4); i < p.length; i += 4) v.push(p[i]); v.sort((a, b) => a - b); return v[v.length >> 1]; };
    const W = [med(0), med(1), med(2)]; // paper = the band's own bottom rows
    KM.Assets.colorToAlpha(p, W, D.floor);
    g.putImageData(d, 0, 0); return (dividerInk = c);
  }
  // v10: painted straight into a <canvas> behind the strip's content (no toDataURL: works from file:// too)
  function stripBackground(c) { // c: canvas of the strip's size in stage px -> true when painted
    const a = A(), K = KM_LAYOUT.k, sb = img(a.strip_bg.img), hPx = c.height;
    if (!C().tint || !C().tint.enabled || !ok(parchImg()) || !ok(skyImg()) || !ok(sb)) return false;
    try {
      const g = c.getContext("2d"); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height);
      const ink0 = dividerInkOf(sb); if (!ink0) return false;
      g.setTransform(K, 0, 0, K, 0, -H() * K); parchment(g, H() + hPx / K);          // the scene's sheet, continued
      const ink = dividerInkOf(sb), D = C().divider, w = D.rect[2] * G(), h = D.rect[3] * G();
      // v11b: Magnus's divider (KM_ART11.divider, placed by the game's skinStrip) replaces the strip_bg divider ink
      if (!(window.KM_ART11 && KM_ART11.divider)) for (let i = 0, x = 0; x < VW(); i++, x += w) { g.save(); g.translate(x + (i % 2 ? w : 0), H()); if (i % 2) g.scale(-1, 1); g.drawImage(ink, 0, 0, w, h); g.restore(); }
      return true;
    } catch (e) { console.info("[scenery] strip background unavailable:", e.message); return false; }
  }
  const tintInfo = () => [...paperOf.entries()].map(([im, W]) => ({ src: im.src.split("/").pop(), paper: W }));
  const drawInked = (ctx, im, x, y, w, h) => inked(ctx, [[im, x, y, w, h]]);
  const drawSky=(ctx,cam,t,seed)=>{background(ctx);skyLife(ctx,cam,t,seed||1,[]);};
  return { drawSky, sky: () => skyLast, birdsNow: () => { if (SK) SK.nextBird = 0; }, available, preload, draw, drawInked, tree, treeWidth, foreground, fgChoose, fgVisible, fgWidth, fgBiomeAt, midBiomeAt, img, ok, root, tintInfo, inkOf, runtimeInk, parchmentCanvas: () => parchmentCanvas(), stripBackground };
})();
