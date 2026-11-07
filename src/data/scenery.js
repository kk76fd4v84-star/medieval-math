// v8 world scenery: Magnus's parallax strips + separate white gradient mist (GAME_DESIGN "PARALLAX").
// Back-to-front: parchment -> back scenery -> rear mist -> mid scenery + distant creatures/graves -> front mist -> trees/road/party -> effects.
// Positions in layout units (v11b: 990-tall grid; every y is the v10 value + 90, so the scenery keeps its place over the ground). NO SCALES: every strip/tree/sky image is drawn at source px x KM_LAYOUT.artScale.
// speed = parallax factor (1 = moves with the road). bottom = where the strip's base sits. Not verified seamless tiles (see README).
// v10 parallax = the handoff's layer-stack.json (encounter-pack-v3/art): back 0.08, mid 0.3, front 1.0.
// Draw order = layer-stack drawOrderBackToFront (paper, backScenery, rearMist, midScenery, midCreature, frontMist,
// frontGround, party, ...) EXCEPT that the v11 foreground strips' own README/manifest say "draw above characters, below UI"
// (z: above-actors-below-UI, "low enough for boots overlap"), which is the newer, specific instruction for these strips.
window.KM_DATA = window.KM_DATA || {};
KM_DATA.scenery = {
  enabled: true,               // false = old procedural box world
  sky: { speed: 0.02, y: 0 },
  // parchment / sky tiles: source rect [x, y, w, h] without the crops' darker vignette edges, made seamless once by
  // cross-fading `overlap` source px of the far edge into the near edge (drawn at source px x artScale, never stretched)
  paper: { rect: [120, 0, 1580, 247], overlap: [240, 80] },
  skyPaper: { rect: [140, 0, 1560, 230], overlap: 240, fade: 80 },
  // strip: the painted ground divider's ink, from strip_bg rows y..y+h (cols without the vignette), mirrored like the tiles
  divider: { rect: [120, 0, 1580, 22], floor: 0.06 },                 // source rows at the bottom of the sky crop that melt into the parchment (no straight edge)
  // Depth increases toward the road: castle .08, cliffs .12, hills .16, woods .22, near .30, ground 1.0.
  back: [
    { strip: "castle", speed: 0.08, bottom: 730, once: 1150 },   // landmark, placed once (layer-stack back = 0.08)
    { strip: "hills", speed: 0.16, bottom: 790 },
    { strip: "distant-woods", speed: 0.22, bottom: 830 }
  ],
  // v9: paper-white interiors take the parchment behind them (see src/engine/scenery.js); paperPercentile picks each
  // image's paper white from its own bright pixels (0.5 = per-channel median: paper grain maps to exactly the parchment)
  // v10: precomputed = use tools/import_v10.py's offline ink + graded parchment (works from file://); paperGrade = the
  // parchment/sky graded to the reference's paper tone (false = the parchment exactly as painted)
  tint: { enabled: true, paperPercentile: 0.5, precomputed: true, paperGrade: true },
  rearMist: null,   // v11b (Magnus: "skip the mist gradients between layers"): no parchment mist bands (was alpha 0.3, 510-890)    // between back and mid (rear fades more). Parchment mist; add color: "255,253,246" for white
  // A leisurely countryside route: long meadows, brief hamlets, then occasional woods.
  // Camps remain road encounters; rocks/canyon belong much later, never the introduction.
  mid: { speed: 0.3, bottom: 950, segment: 1, biomes: [
    "fields", "fields", "village", "fields", "fields", "fields",
    "near-forest", "fields", "fields", "village", "fields",
    "near-forest", "near-forest", "fields", "barren-rocks", "fields",
    "barren-rocks", "canyon", "canyon", "fields", "fields"
  ] },
  midLane: { y: 860, speed: 0.3 },               // distant creatures (hidden strength: grey + mist, NOT shrunk) + graves
  frontMist: null,  // v11b: removed (was alpha 0.14, 730-970). The ink/paper tint of every layer stays
  // the mid strip's lower edge melts into the parchment ground (parchment-coloured, not mist)
  groundFade: { from: 880, to: 960 },   // fades to the SAME parchment pixels (no flat colour)
  // v10 frontGround: the v11 strips (ground line y=270 on groundY), parallax 1.0, drawn over the actors' feet.
  // Mid biome -> foreground biome. No tundra mid strip exists (fields/village/near-forest/barren-rocks/canyon), so tundra is
  // a VARIETY option: barren-rocks tiles pick rocky or tundra (stable per tile + run seed).
  front: { enabled: true, speed: 1, groundY: 983,
    biomes: { fields: ["meadow"], village: ["meadow"], "near-forest": ["forest"], "barren-rocks": ["rocky", "tundra"], canyon: ["rocky"], "tree-props": ["forest"] } },
  trees: { speed: 1, y: 983, every: [1500, 2600], clearance: 260, alpha: 1 },
  groundY: 983                                                  // feet line: the strip's painted divider is the ground
};
