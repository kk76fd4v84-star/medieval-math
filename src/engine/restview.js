// Layered rest-stop scenes from Magnus's v8 bundle (KM_ART7.scenes, 1774x887 canvas, full-canvas layers at 0,0,
// normal alpha, manifest z-order). v8: the whole 1774x887 canvas is drawn at 1:1 source px x the ONE global factor
// (KM_LAYOUT.artScale), centred, with its own ground divider on our ground line; clipped at that line (the canvas's
// own lower parchment band is not drawn over the strip). map(x, y): canvas px -> layout units.
window.KM = window.KM || {};
KM.RestView = (function () {
  // v11b: Magnus's FULL-SCREEN scenes (KM_ART11.scenes: tavern-interior, tavern-arrival) replace the v8 layered tavern.
  // One uniform scale puts the painted floor line (floorRow) on our ground line; the width then overfills the scene and
  // is centred (edge to edge, proportions exact, no stretch); drawn to the canvas bottom (its parchment meets the strip).
  const ALIGN = { "tavern-interior": 1 };
  const full = id => window.KM_ART11 && KM_ART11.scenes && KM_ART11.scenes[id];
  const fullImg = id => KM.Assets.loadImg(KM_ART11.root + full(id).img);
  const sc = id => full(id) ? { full: true, canvas: full(id).size, layers: [], floorRow: full(id).floorRow } : window.KM_ART7 && KM_ART7.scenes[id];
  // v10: the paper-graded copies (tools/import_v10.py, same per-channel gain as the parchment) unless tint.paperGrade is off
  const gradedOf = p => { const A = window.KM_ART10, T = KM_DATA.scenery && KM_DATA.scenery.tint; return A && T && T.precomputed !== false && T.paperGrade !== false && A.paper.scenes && A.paper.scenes[p]; };
  const img = p => KM.Assets.loadImg(gradedOf(p) || KM_ART7.root + p);
  const ok = im => im && im._ok && im.naturalWidth > 0;
  // ground divider row in each canvas (measured): the scene's ground line is placed on our strip divider
  const DIV = { camp: 629, "tavern-interior": 596, "tavern-exterior": 603 };
  function available(id) { if (full(id)) return ok(fullImg(id)); const s = sc(id); return !!(s && s.layers.filter(l => l.img).every(l => ok(img(l.img)))); }
  function preload(id) { if (full(id)) return fullImg(id); const s = sc(id); if (s) s.layers.forEach(l => l.img && img(l.img)); }
  function mapper(id) {
    const VW = KM_LAYOUT.viewW, gy = KM_DATA.world.groundY, cover = KM_LAYOUT.viewFit === "cover";
    // alignX: where the overfill is cropped (0.5 = both sides; tavern interior 1 = crop the left so its door stays in view)
    if (full(id)) { const F = full(id), s = gy / F.floorRow, al = ALIGN[id] != null ? ALIGN[id] : 0.5, x0 = (VW - F.size[0] * s) * al, y0 = 0;
      const m = (x, y) => [x0 + x * s, y0 + y * s]; m.s = s; m.x0 = x0; m.y0 = y0; m.clipY = KM_LAYOUT.artSpaceH; m.cover = true; m.full = true; m.mul = s / KM_LAYOUT.art; return m; }
    // "cover" (v11b, opt-in, awaiting Magnus): the room from the canvas top to its floor line fills scene top .. ground line
    const s = cover ? gy / DIV[id] : KM_LAYOUT.art, x0 = (VW - sc(id).canvas[0] * s) / 2, y0 = gy - DIV[id] * s;
    const m = (x, y) => [x0 + x * s, y0 + y * s]; m.s = s; m.x0 = x0; m.y0 = y0; m.clipY = gy; m.cover = cover; m.mul = s / KM_LAYOUT.art; return m;
  }
  // full scenes: a painted divider below clipRow gives way to ours
  function draw(ctx, id, slots, alpha) {
    const s = sc(id); if (!s) return false;
    const m = mapper(id);
    if (s.full) { const im = fullImg(id); if (ok(im)) { ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.imageSmoothingQuality = "high"; const cr = full(id).clipRow; if (cr) { ctx.beginPath(); ctx.rect(m.x0, m.y0, s.canvas[0] * m.s, cr * m.s); ctx.clip(); } ctx.drawImage(im, m.x0, m.y0, s.canvas[0] * m.s, s.canvas[1] * m.s); ctx.restore(); } return true; }
    ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.beginPath(); ctx.rect(m.x0, m.y0, s.canvas[0] * m.s, m.clipY - m.y0); ctx.clip();
    for (const L of s.layers.slice().sort((a, b) => a.z - b.z)) {
      if (L.img) { const im = img(L.img); if (ok(im)) ctx.drawImage(im, m.x0, m.y0, s.canvas[0] * m.s, s.canvas[1] * m.s); }
      else if (slots && slots[L.slot]) slots[L.slot](ctx, m);
    }
    ctx.restore();
    if (m.cover) return true; // edge to edge: no frame
    ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.strokeStyle = "#1b1410"; ctx.lineWidth = 4; // ink frame: "its own canvas"
    ctx.strokeRect(m.x0, m.y0, s.canvas[0] * m.s, m.clipY - m.y0); ctx.restore(); return true;
  }
  return { draw, available, preload, mapper, scene: sc, img };
})();
