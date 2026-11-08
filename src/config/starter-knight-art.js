// Starter knight (switch: KM_DATA.balanceTry.knightStart, ?knightstart=1). Maggi's v1 handoff
// (handoff_to_maggi/starter_knight/v1): the same covered-face knight walk atlas (6144x768, eight 768 cells, 125 ms,
// pivot [384,680], same root speed) with a short, chipped, rusty sword baked into the forearm. A run started with the
// switch on uses it until the first weapon upgrade, then the existing knight art (PartyAbilities.heroArt).
(function () {
  const A = window.KM_ART10, A7 = window.KM_ART7; if (!A || !A7 || !A.walks.hero) return;
  const img = "assets/starter-knight/v1/starter-knight-walk.png", h = A.walks.hero, id = "hero_starter";
  A.walks[id] = Object.assign({}, h, { img });
  const base = { img, cell: [768, 768], pivot: h.pivot, standTop: h.standTop, rootMotionSpeed: h.rootMotionSpeed, status: "starter knight v1 (Maggi)" };
  A7.sequences["walk_" + id] = Object.assign({}, base, { frames: h.frames, loop: h.loop });
  A7.sequences["stand_" + id] = Object.assign({}, base, { frames: [h.frames[0]], loop: false });
  KM_ART.entities[id] = Object.assign({}, KM_ART.entities.hero, { seq: { idle: "stand_" + id, walk: "walk_" + id }, walk: id, status: "starter knight v1 (Maggi)" });
  for (const T of [window.KM_FEET, window.KM_TALL, window.KM_WIDE]) if (T && T.hero !== undefined) T[id] = T.hero;
  if (window.KM_REAR_PARTY && KM_REAR_PARTY.frames.hero) KM_REAR_PARTY.frames[id] = KM_REAR_PARTY.frames.hero; // seen from behind: the same
})();
