// Asset loader: versioned art packs (topic json) -> registry, with box fallback.
window.KM = window.KM || {};
KM.Assets = (function () {
  const reg = { bg: {}, cut: {}, anim: {}, topics: {} };
  const imgCache = {};
  function loadImg(src) {
    if (imgCache[src]) return imgCache[src];
    const im = new Image();
    im._ok = false;
    im.onload = () => { im._ok = true; };
    im.onerror = () => { im._bad = true; console.info("[art] missing image, using box:", src); };
    im.src = src;
    imgCache[src] = im;
    return im;
  }
  function register(path, j) {
    const dir = path.slice(0, path.lastIndexOf("/") + 1);
    const topic = path.slice(path.lastIndexOf("/") + 1).replace(/\.json$/, "");
    reg.topics[topic] = j;
    for (const [id, b] of Object.entries(j.backgrounds || {}))
      reg.bg[topic + ":" + id] = { img: loadImg(dir + b.file), size: b.size || [1600, 900] };
    for (const [id, c] of Object.entries(j.cutouts || {}))
      reg.cut[topic + ":" + id] = { img: loadImg(dir + c.file), size: c.size, anchor: c.anchor || [c.size[0] / 2, c.size[1]], hotspots: c.hotspots || [] };
    for (const [id, a] of Object.entries(j.animations || {})) {
      const frames = a.frames.map(f => loadImg(dir + f));
      const order = a.order || frames.map((_, i) => i + 1);
      const ms = Array.isArray(a.ms) ? a.ms : order.map(() => a.ms || 120);
      reg.anim[topic + ":" + id] = { frames, order, ms, total: ms.reduce((s, x) => s + x, 0), loop: a.loop !== false, anchor: a.anchor, canvas: a.canvas };
    }
  }
  async function loadPacks(list) {
    if (!list || !list.length) return;
    if (!/^https?:/.test(location.protocol)) { console.info("[art] packs need a static server; using boxes"); return; }
    for (const p of list) {
      try { const r = await fetch(p); if (!r.ok) throw new Error(r.status); register(p, await r.json()); }
      catch (e) { console.info("[art] could not load pack", p, e.message); }
    }
  }
  function ok(im) { return im && im._ok && im.naturalWidth > 0; }
  // ---- drawn frame sequences (atlas cells with per-frame holds; KM_ART7.sequences). No tweening between drawings.
  const SEQ = () => (window.KM_ART7 && KM_ART7.sequences) || {};
  const r7 = p => (/^assets\//.test(p) ? p : ((window.KM_ART7 && KM_ART7.root) || "") + p);
  function seqDur(id) { const s = SEQ()[id]; return s ? s.frames.reduce((a, f) => a + f.ms, 0) / 1000 : 0; }
  function seqFrame(id, t) {
    const s = SEQ()[id]; if (!s) return null;
    const total = s.frames.reduce((a, f) => a + f.ms, 0); let ms = t * 1000;
    if (s.loop) ms %= total; else if (ms >= total) return { s, f: s.frames[s.frames.length - 1], i: s.frames.length - 1, done: true }; // hold the last drawing
    let i = 0; while (i < s.frames.length - 1 && ms >= s.frames[i].ms) { ms -= s.frames[i].ms; i++; }
    return { s, f: s.frames[i], i, done: false };
  }
  function seqPick(id, t) {
    const r = seqFrame(id, t); if (!r) return null; const im = loadImg(r7(r.s.img)); if (!ok(im)) return null;
    return { img: im, src: [r.f.x, r.f.y, r.f.w, r.f.h], anchor: [r.s.pivot[0], r.s.pivot[1]], top: r.s.standTop, mul: r.s.mul, frame: r.i, done: r.done, seq: id };
  }
  // Pick a drawable for entity id + action at time t (s). Returns {img, anchor} or null.
  function pick(id, action, t, seqId, seqT) {
    const cfg = KM_ART.entities[id] || {};
    if (seqId) { const d = seqPick(seqId, seqT || 0); if (d) return d; }
    const sq = cfg.seq && (cfg.seq[action] || cfg.seq.idle);
    if (sq) { const d = seqPick(sq, cfg.seq[action] ? t : 0); if (d) return d; }
    const animRef = cfg.anims && cfg.anims[action];
    const a = animRef && reg.anim[animRef];
    if (a) {
      let ms = (t * 1000) % a.total; if (!a.loop && t * 1000 >= a.total) ms = a.total - 1;
      let i = 0; while (ms >= a.ms[i]) { ms -= a.ms[i]; i++; }
      const im = a.frames[a.order[i] - 1];
      if (ok(im)) return { img: im, anchor: a.anchor || [im.naturalWidth / 2, im.naturalHeight] };
    }
    const c = cfg.art && reg.cut[cfg.art];
    if (c && ok(c.img)) return { img: c.img, anchor: c.anchor };
    if (cfg.img) { const im = loadImg(cfg.img); if (ok(im)) return { img: im, anchor: cfg.anchor || [im.naturalWidth / 2, im.naturalHeight], top: cfg.top }; }
    return null;
  }
  // v8 (Magnus): art is NEVER fitted or scaled per entity/pose. Every image = source px x the ONE global factor
  // KM_LAYOUT.artScale (KM_LAYOUT.art in layout units). Only missing-art placeholder boxes use their box size.
  // Reported exceptions only: cfg.artMul (whole entity, e.g. the v18 riddle keeper + rock) and a sequence's per-clip
  // calibration d.mul (v18 coif clips, all 1.0). Everything else is exactly artScale.
  function artScale(cfg, d) { return d ? KM_LAYOUT.art * ((cfg && cfg.artMul) || 1) * (d.mul || 1) : 1; }
  function hasAnim(id, action) {
    const cfg = KM_ART.entities[id] || {}; const a = cfg.anims && cfg.anims[action] && reg.anim[cfg.anims[action]];
    if (cfg.seq && cfg.seq[action] && seqPick(cfg.seq[action], 0)) return true;
    return !!(a && a.frames.some(ok));
  }
  // Draw entity with its feet (bottom-centre) at x,y in layout units.
  // o: { action, t (s since action start), scale, rot, flip, alpha, flash, hurt, name }
  let tintC = null; const tintCv = (w, h) => { tintC = tintC || document.createElement("canvas"); if (tintC.width < w) tintC.width = w; if (tintC.height < h) tintC.height = h; return tintC; };
  const SIL_NONE = /^(log|rock|puddle|signpost|dead_cart|haystack|gallows_tree|shrubbery)$/;
  function drawEntity(ctx, id, x, y, o = {}) {
    const cfg = KM_ART.entities[id] || { box: { w: 60, h: 60, color: "#f0f", label: id } };
    const d = pick(id, o.action || "idle", o.t || 0, o.seq, o.seqT);
    // art: native px x global factor (o.scale is ignored for art; it only sizes placeholder boxes)
    const sc = d ? artScale(cfg, d) : (o.scale || 1);
    ctx.save();
    // feet ON the ground line: measured gap between the pivot and the drawing's lowest pixel (src/config/feet.js)
    const ft = d && window.KM_FEET && KM_FEET[id]; ctx.translate(x, y + (ft ? ft * sc : 0));
    if (o.rot) ctx.rotate(o.rot);
    if (o.flip) ctx.scale(-1, 1);
    ctx.globalAlpha *= (o.alpha == null ? 1 : o.alpha);
    if (o.filter) ctx.filter = o.filter;
    if (d) {
      const sw = d.src ? d.src[2] : d.img.naturalWidth, sh = d.src ? d.src[3] : d.img.naturalHeight;
      const blit = c => d.src ? c.drawImage(d.img, d.src[0], d.src[1], d.src[2], d.src[3], 0, 0, sw, sh) : c.drawImage(d.img, 0, 0, sw, sh);
      if (o.hurt) { // Magnus: no transparency on hurt. Full-opacity drawing with a brief red flash over its own pixels only
        const fc = tintCv(sw, sh), c = fc.getContext("2d"); c.globalCompositeOperation = "source-over"; c.clearRect(0, 0, sw, sh); blit(c);
        c.globalCompositeOperation = "source-atop"; c.fillStyle = "rgba(196,40,24,0.55)"; c.fillRect(0, 0, sw, sh);
        ctx.drawImage(fc, 0, 0, sw, sh, -d.anchor[0] * sc, -d.anchor[1] * sc, sw * sc, sh * sc);
      } else if (d.src) ctx.drawImage(d.img, d.src[0], d.src[1], d.src[2], d.src[3], -d.anchor[0] * sc, -d.anchor[1] * sc, d.src[2] * sc, d.src[3] * sc);
      else ctx.drawImage(d.img, -d.anchor[0] * sc, -d.anchor[1] * sc, d.img.naturalWidth * sc, d.img.naturalHeight * sc);
    } else {
      // v11b (Magnus): missing art is a minimal ink silhouette (hooded figure, no box, no label); listed in MISSING_ART.md
      const b = cfg.box; const w = b.w * sc, h = b.h * sc, hr = Math.min(w * 0.22, h * 0.09);
      ctx.fillStyle = o.hurt ? "#8e2416" : "#2a1d12"; ctx.globalAlpha *= o.flash ? 0.4 : 0.82;
      const kind = SIL_NONE.test(id) ? "none" : /^grave/.test(id) ? "grave" : /^(tavern|campsite|shop)$/.test(id) ? "house" : "figure";
      if (kind === "none") { ctx.restore(); return; } // decorative props: nothing until painted
      if (kind === "grave") { ctx.beginPath(); ctx.moveTo(-w * 0.4, 0); ctx.lineTo(-w * 0.4, -h * 0.7); ctx.arc(0, -h * 0.7, w * 0.4, Math.PI, 0); ctx.lineTo(w * 0.4, 0); ctx.closePath(); ctx.fill(); ctx.restore(); return; }
      if (kind === "house") { ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(-w / 2, -h * 0.6); ctx.lineTo(0, -h); ctx.lineTo(w / 2, -h * 0.6); ctx.lineTo(w / 2, 0); ctx.closePath(); ctx.fill(); ctx.restore(); return; }
      ctx.beginPath(); ctx.arc(0, -h + hr * 1.15, hr, 0, Math.PI * 2); ctx.fill();         // head
      ctx.beginPath(); ctx.moveTo(-hr * 1.1, -h + hr * 2.1); ctx.quadraticCurveTo(-w * 0.42, -h * 0.72, -w * 0.4, 0); // robe
      ctx.lineTo(w * 0.4, 0); ctx.quadraticCurveTo(w * 0.42, -h * 0.72, hr * 1.1, -h + hr * 2.1); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  // Visible size in stage px (for bubbles / lane checks).
  function entitySize(id, scale) {
    const cfg = KM_ART.entities[id]; if (!cfg) return [100, 100];
    const d = pick(id, "idle", 0), sc = d ? artScale(cfg, d) : (scale || 1);
    if (d && d.src) return [(d.src[2] * 0.7) * sc, (d.anchor[1] - (d.top || 0)) * sc];
    if (d) return [d.img.naturalWidth * sc, (d.anchor[1] - (d.top || 0)) * sc];
    return [cfg.box.w * sc, cfg.box.h * sc];
  }
  function entityHeight(id, scale) { return entitySize(id, scale)[1]; }
  // Engraved digit / operator glyphs for the sum display + number pad, text fallback.
  const GLYPH_OF = { "+": "op_plus", "-": "op_minus", "−": "op_minus", "×": "op_times", "x": "op_times", "÷": "op_divide", "/": "op_divide", "=": "op_equals" };
  function glyphImg(ch) {
    const slot = /\d/.test(ch) ? "digit_" + ch : GLYPH_OF[ch]; if (!slot) return null;
    return slotSrc((KM_ART.glyphs || {})[slot]);
  }
  // Resolve a slot { art: "topic:id" } (cutout or background) or { img: path } to a loaded image src, else null.
  function slotSrc(g) {
    if (!g) return null;
    const c = g.art && (reg.cut[g.art] || reg.bg[g.art]); if (c && ok(c.img)) return c.img.src;
    if (g.img) { const im = loadImg(g.img); if (ok(im)) return im.src; }
    return null;
  }
  const uiSrc = slot => slotSrc((KM_ART.ui || {})[slot]);
  // v9: engraved glyph slices carry their own paper (a lighter/different parchment than ours); keep only their INK
  // (colour-to-alpha against the slice's own paper = median of its border pixels), so the sum sits on our one parchment
  // sheet with no boxes. Same size (natural px x artScale). Computed once per glyph; fallback = the slice as painted.
  const inkGlyph = new Map();
  function glyphInk(im) {
    if (inkGlyph.has(im.src)) return inkGlyph.get(im.src);
    // v10: precomputed offline by tools/import_v10.py (same maths) -> works from file:// (no getImageData/toDataURL)
    const A10 = window.KM_ART10, key = (s => s.slice(Math.max(0, s.lastIndexOf("assets/"))))(decodeURI(im.src));
    const tintOn = !(KM_DATA.scenery && KM_DATA.scenery.tint && KM_DATA.scenery.tint.precomputed === false);
    if (A10 && tintOn && A10.glyphInk[key]) { inkGlyph.set(im.src, A10.glyphInk[key]); return A10.glyphInk[key]; }
    let url = null;
    try {
      const w = im.naturalWidth, h = im.naturalHeight, c = document.createElement("canvas"); c.width = w; c.height = h;
      const g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(im, 0, 0); const d = g.getImageData(0, 0, w, h), p = d.data;
      const border = [[], [], []], B = 5;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x < B || y < B || x >= w - B || y >= h - B) { const i = (y * w + x) * 4; for (let k = 0; k < 3; k++) border[k].push(p[i + k]); }
      const W = border.map(v => { v.sort((a, b) => a - b); return v[v.length >> 1]; });
      KM.Assets.colorToAlpha(p, W, 0.06);
      g.putImageData(d, 0, 0); url = c.toDataURL("image/png");
    } catch (e) { url = null; }
    inkGlyph.set(im.src, url); return url;
  }
  // GIMP-style colour-to-alpha against paper colour W: a = max_c (W_c - P_c) / W_c (never negative ink, colours kept),
  // ink = (P - (1 - a) W) / a, so ink over our parchment = P + (1 - a) (parchment - W). Paper grain below `floor`
  // fades out smoothly (alpha x smoothstep(floor, 2 floor, a)); real ink (a >= 2 floor) keeps its exact alpha.
  function colorToAlpha(p, W, floor) {
    for (let i = 0; i < p.length; i += 4) {
      if (!p[i + 3]) continue;
      let a = 0; for (let k = 0; k < 3; k++) { const v = (W[k] - p[i + k]) / W[k]; if (v > a) a = v; }
      if (a <= floor) { p[i + 3] = 0; continue; } if (a > 1) a = 1;
      for (let k = 0; k < 3; k++) { const v = (p[i + k] - (1 - a) * W[k]) / a; p[i + k] = v < 0 ? 0 : v > 255 ? 255 : v; }
      const t = Math.min(1, (a - floor) / floor), sm = t * t * (3 - 2 * t);
      p[i + 3] = Math.round(a * sm * p[i + 3]);
    }
  }
  // Returns HTML for a string: each char as <img class="glyph"> if painted, else <span class="gtext">.
  function glyphHTML(str) {
    return String(str).split("").map(ch => {
      if (ch === " ") return '<span class="gsp"></span>';
      const src = glyphImg(ch);
      // v8: carved glyphs at source px x the global factor (177x190 digit slices -> 106x114 stage px)
      const im = src && Object.values(imgCache).find(i => i.src === src);
      const sz = im && ok(im) ? ` style="width:${+(im.naturalWidth * KM_LAYOUT.artScale).toFixed(2)}px;height:${+(im.naturalHeight * KM_LAYOUT.artScale).toFixed(2)}px"` : "";
      const safe = ch.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
      const ink = im && ok(im) ? glyphInk(im) : null;
      return src ? `<img class="glyph native${ink ? " ink" : ""}" src="${ink || src}" alt="${safe}"${sz}>` : `<span class="gtext">${safe}</span>`;
    }).join("");
  }
  // Preload glyph images that are direct paths so they are ready by the first sum.
  function preloadGlyphs() { for (const g of Object.values(Object.assign({}, KM_ART.glyphs, KM_ART.ui))) if (g && g.img) loadImg(g.img); if (window.KM_ART10) Object.values(KM_ART10.glyphInk).forEach(loadImg); }
  function background(ref) { const b = ref && reg.bg[ref]; return b && ok(b.img) ? b : null; }
  const hasArt = id => !!pick(id, "idle", 0);
  return { hasArt, colorToAlpha, seqDur, seqFrame, seqPick, loadPacks, register, drawEntity, entityHeight, entitySize, hasAnim, artScale, glyphHTML, glyphImg, uiSrc, preloadGlyphs, background, reg, loadImg };
})();
