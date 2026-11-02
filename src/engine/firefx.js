// v12k fire bottle effect (Maggi's woodblock v2 art, assets/items/fire_bottle/NOTES.md). Visual only: the game decides
// the damage. start() returns the seconds until the hit (burst frame 2) so the game can schedule it on its own clock.
//   const hitAt = KM.FireFx.start({ from: {x, y}, targets: [{x, y}, ...] })   // layout units: enemy foot x / ground y
//   KM.FireFx.update(dt); KM.FireFx.draw(ctx)                               // every frame (ctx in layout units)
// Sequence: the bottle spins through an arc to the middle target -> smash there -> a fire patch bursts at every
// target (spreading outward) -> lingering loop -> fade. All art at artScale (source px x 0.6 stage px).
window.KM = window.KM || {};
KM.FireFx = (function () {
  const cfg = () => KM_DATA.items.fireBottle.art;
  const img = f => KM.Assets.loadImg(cfg().dir + f);
  let fx = null; // { t, from, to, targets: [{x, y, at, flip}], smashAt, hitAt, end }

  function start(o) {
    const A = cfg(), ts = o.targets.slice().sort((a, b) => a.x - b.x), mid = ts[Math.floor((ts.length - 1) / 2)];
    const smashAt = A.throwSecs, burstAt = smashAt + A.smash.frames * A.smash.ms / 1000;
    const targets = ts.map((p, i) => ({ x: p.x, y: p.y, flip: i % 2 === 1, at: burstAt + A.spread * Math.abs(i - ts.indexOf(mid)) }));
    const hitAt = burstAt + A.burst.hitFrame * A.burst.ms / 1000;
    const end = Math.max(...targets.map(p => p.at)) + A.burst.frames * A.burst.ms / 1000 + A.linger.secs + A.linger.fadeSecs;
    fx = { t: 0, from: o.from, to: { x: mid.x, y: mid.y }, targets, smashAt, hitAt, end };
    return hitAt;
  }
  function update(dt) { if (fx && (fx.t += dt) >= fx.end) fx = null; }
  const active = () => !!fx;

  // one cell of a phase atlas, bottom-centre at (x, y), at artScale
  function cell(ctx, phase, i, x, y, alpha, flip) {
    const A = cfg(), im = img(A[phase].atlas); if (!im._ok) return;
    const s = KM_LAYOUT.art, [cw, ch] = A.cell, [ax, ay] = A.anchor;
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
    ctx.drawImage(im, i * cw, 0, cw, ch, -ax * s, -ay * s, cw * s, ch * s); ctx.restore();
  }
  function draw(ctx) {
    if (!fx) return; const A = cfg(), t = fx.t, below = A.belowFoot / KM_LAYOUT.k;
    if (t < fx.smashAt) { // the bottle in flight: an arc, spinning about its centre
      const u = t / fx.smashAt, im = img(A.item), s = KM_LAYOUT.art; if (!im._ok) return;
      const x = fx.from.x + (fx.to.x - fx.from.x) * u, y = fx.from.y + (fx.to.y - 60 - fx.from.y) * u - Math.sin(Math.PI * u) * A.arcH / KM_LAYOUT.k;
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * A.spinDeg * Math.PI / 180); ctx.drawImage(im, -im.naturalWidth * s / 2, -im.naturalHeight * s / 2, im.naturalWidth * s, im.naturalHeight * s); ctx.restore();
      return;
    }
    const sm = Math.floor((t - fx.smashAt) / (A.smash.ms / 1000));
    if (sm < A.smash.frames) cell(ctx, "smash", sm, fx.to.x, fx.to.y + below, 1);
    const bDur = A.burst.frames * A.burst.ms / 1000;
    for (const p of fx.targets) {
      const u = t - p.at; if (u < 0) continue;
      if (u < bDur) { cell(ctx, "burst", Math.floor(u / (A.burst.ms / 1000)), p.x, p.y + below, 1, p.flip); continue; }
      const v = u - bDur, fade = v > A.linger.secs ? Math.max(0, 1 - (v - A.linger.secs) / A.linger.fadeSecs) : 1;
      if (fade > 0) cell(ctx, "linger", Math.floor(v / (A.linger.ms / 1000)) % A.linger.frames, p.x, p.y + below, fade, p.flip);
    }
  }
  function preload() { const A = cfg(); [A.item, A.smash.atlas, A.burst.atlas, A.linger.atlas].forEach(img); }

  return { start, update, draw, active, preload, state: () => fx && { t: fx.t, hitAt: fx.hitAt, end: fx.end, targets: fx.targets.length } };
})();
