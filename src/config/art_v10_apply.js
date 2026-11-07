// v10: Magnus's v13 full-body walks (incoming/pack_v13/medieval-math-walks-v13, START_HERE: v13 only; v10 rejected,
// v12 lacks the pelvis/upper-body fix). Imported by tools/import_v10.py into assets/v10/walks (KM_ART10.walks).
// Used as the README's ENGINE format: one 6144x768 atlas per character, eight 768x768 cells x 125 ms, looping 1 s,
// pivot [384,680], measured standTop. Drawn at atlas px x the ONE global artScale (0.6) like every other piece: the
// rig's own scale (hero 0.54, companions 0.85) is already baked into the atlases by the pack, nothing is re-scaled here.
// Travel speed follows the README: speed = rootMotionSpeed x display scale x playback rate. The road moves at the HERO's
// root motion at the configured travel multiplier; each companion's playback rate is chosen so
// its own root motion matches that same road speed (no foot sliding against the parallax-1.0 front ground).
// Limitations (README): walk only. No idle, attack, heal or hurt drawings: standing = the walk's first key (frame 0,
// both feet planted), combat lunges stay procedural, the hero's death is still the approved knight-death atlas.
(function () {
  const A = window.KM_ART10, A7 = window.KM_ART7; if (!A || !A7) return;
  const E = KM_ART.entities;
  Object.entries(A.walks).forEach(([n, w]) => {
    const base = { img: w.img, cell: [768, 768], pivot: w.pivot, standTop: w.standTop, rootMotionSpeed: w.rootMotionSpeed, status: "v13 walk (pack_v13)" };
    A7.sequences["walk_" + n] = Object.assign({}, base, { frames: w.frames, loop: w.loop });
    A7.sequences["stand_" + n] = Object.assign({}, base, { frames: [w.frames[0]], loop: false });
  });
  const walker = (n, extra) => Object.assign({ img: undefined, anchor: undefined, top: undefined, seq: { idle: "stand_" + n, walk: "walk_" + n }, walk: n, status: "v13 walk atlas (Magnus, pack_v13)" }, extra || {});
  const set = (id, o) => { E[id] = Object.assign({}, E[id] || {}, o); };
  set("hero", walker("hero", { deathSeq: "knight_death" }));            // replaces the 'stripe' stand-in
  ["scarf", "feather", "moustache", "stripe"].forEach((n, i) => set("follower_" + (i + 1), walker(n)));
  KM_DATA.party.skins = 4;                                                  // four companion looks (party max stays 4 incl. hero)
  // road speed (layout units/s) = hero rootMotionSpeed (atlas px/s at playback 1) x artScale (stage px) / k (layout units)
  KM_DATA.world.walkSpeed = A.walks.hero.rootMotionSpeed * KM_LAYOUT.artScale / KM_LAYOUT.k * (KM_DATA.world.walkSpeedMultiplier || 1);
  KM_ART.walkRate = id => { const e = E[id], w = e && e.walk && A.walks[e.walk]; return w ? (KM_DATA.world.walkSpeed * KM_LAYOUT.k) / (w.rootMotionSpeed * KM_LAYOUT.artScale * (e.artMul || 1)) : 1; }; // v12b: artMul scales root motion too
})();
