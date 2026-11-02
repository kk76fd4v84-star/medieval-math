// v12k fire bottle effect (Maggi's v4 woodcut art, assets/items/fire_bottle/v4/NOTES.md). Drawings + their sound cues
// only: the game decides the damage. start() returns the seconds until the hit (burst frame 2) so the game can schedule it.
//   const hitAt = KM.FireFx.start({ from: {x, y}, targets: [{x, y}, ...] })   // layout units: enemy foot x / ground y
//   KM.FireFx.update(dt); KM.FireFx.draw(ctx)                               // every frame (ctx in layout units)
//   KM.FireFx.stop()                                                        // cut it short (battle over / scene change)
// v12n sounds (KM_DATA.items.fireBottle.sfx), cued on the same clock as the frames: smash on impact, ignite at burst
// frame 1, one yelp per target at the hit, the crackle loop while it lingers, then the crackle fades + the fizzle.
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
    const bDur = A.burst.frames * A.burst.ms / 1000, fadeAt = burstAt + bDur + A.linger.secs; // fadeAt: the centre patch starts to fade
    const end = Math.max(...targets.map(p => p.at)) + bDur + A.linger.secs + A.linger.fadeSecs;
    fx = { t: 0, from: o.from, to: { x: mid.x, y: mid.y }, targets, smashAt, hitAt, end, cues: cues(smashAt, burstAt, hitAt, bDur, fadeAt, targets.length) };
    return hitAt;
  }
  // [seconds, sound] in time order; each runs once when the clock passes it
  function cues(smashAt, burstAt, hitAt, bDur, fadeAt, n) {
    const F = KM_DATA.items.fireBottle.sfx, A = KM.Audio, c = [];
    c.push([smashAt, () => A.play(F.smash)], [burstAt, () => A.play(F.ignite)]);
    // v12q (Magnus): no goblin yelps on the hit
    c.push([burstAt + bDur, () => A.loop(F.crackle)], [fadeAt, () => { A.stop(F.crackle, F.crackleFadeSecs); A.play(F.fadeOut); }]);
    return c.sort((a, b) => a[0] - b[0]);
  }
  function update(dt) {
    if (!fx) return; fx.t += dt;
    while (fx.cues.length && fx.cues[0][0] <= fx.t) fx.cues.shift()[1]();
    if (fx.t >= fx.end) stop();
  }
  function stop() { if (!fx) return; fx = null; KM.Audio.stop(KM_DATA.items.fireBottle.sfx.crackle, KM_DATA.items.fireBottle.sfx.crackleFadeSecs); }
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

  return { start, update, stop, draw, active, preload, state: () => fx && { t: fx.t, hitAt: fx.hitAt, end: fx.end, targets: fx.targets.length } };
})();
