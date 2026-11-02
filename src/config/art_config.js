// ===== ART CONFIG: the ONE place that maps entity ids -> art =====
// Every entity draws as a labelled box until real art is present.
//
// Art arrives as versioned packs: assets/v<N>/<topic>/<topic>.json + PNG cut-outs.
// List the topic json files in `packs`. A pack json may contain:
//   backgrounds: { id: { file, size:[1600|2400, 900] } }          -> ref "topic:id"
//   cutouts:     { id: { file, size:[w,h], anchor:[x,y], hotspots? } } (anchor = bottom-centre feet, image px)
//   animations:  { action: { frames:["anim/<char>/<action>_1.png",...], order:[1,2,3,2], ms:[..], loop, anchor:[x,y] } }
//   placements:  { id: { x, y } }  (layout units; v8: any `scale` is ignored, art = source px x KM_LAYOUT.artScale)
// Refs below use "topic:id" (cutout/background) and anims use "topic:action".
// You can also point straight at a file: { img: "assets/foo.png", anchor:[x,y] } (works from file://).
// NOTE: pack json is fetched, so packs need a static server (python3 -m http.server).
window.KM_ART = {
  stage: [1600, 900],
  packs: [
    // "assets/v1/knights/knights.json",
    // "assets/v1/road/road.json",
  ],

  entities: {
    // id: { art: "topic:cutout", anims: { walk: "topic:walk", idle: "topic:idle" }, box: fallback }
    // v8: art is never fitted/scaled per entity: source px x KM_LAYOUT.artScale. Box sizes (placeholders only) are layout units.
    // Action slots the engine plays: idle, walk, attack, hurt, fall, respects (bow/kneel at a grave). Missing slot -> procedural fallback
    // (attack = lunge, hurt = red flash/blink + shake, fall = topple, respects = bow/dip). t restarts at 0 for attack/hurt/fall.
    hero:             { art: null, anims: {}, box: { w: 140,  h: 300, color: "#9aa3ad", label: "HERO" } },
    // followers: recruit pool entries pick a look 1-8 (src/data/knights.js); name is drawn under the label
    follower_1: { art: null, anims: {}, box: { w: 140, h: 290, color: "#b5774a", label: "FOLLOWER" } },  // v7: followers 1-3 = the three companion skins
    follower_2: { art: null, anims: {}, box: { w: 140, h: 280, color: "#7f9a6a", label: "FOLLOWER" } },
    follower_3: { art: null, anims: {}, box: { w: 140, h: 300, color: "#6a8fb0", label: "FOLLOWER" } },
    follower_4: { art: null, anims: {}, box: { w: 140, h: 285, color: "#c9b9d8", label: "FOLLOWER" } },
    follower_5: { art: null, anims: {}, box: { w: 140, h: 270, color: "#8c6f5a", label: "FOLLOWER", text: "#fff" } },
    follower_6: { art: null, anims: {}, box: { w: 140, h: 295, color: "#5f8f7f", label: "FOLLOWER" } },
    follower_7: { art: null, anims: {}, box: { w: 140, h: 290, color: "#d1a95b", label: "FOLLOWER" } },
    follower_8: { art: null, anims: {}, box: { w: 140, h: 310, color: "#9b8f80", label: "FOLLOWER" } },

    goblin:           { art: null, anims: {}, box: { w: 160,  h: 230, color: "#6f8f3a", label: "GOBLIN" } },
    killer_rabbit:    { art: null, anims: {}, box: { w: 110,  h: 130,  color: "#f2f2f2", label: "RABBIT" } },
    black_knight:     { art: null, anims: {}, box: { w: 170, h: 340, color: "#2b2b2b", label: "BLACK KNIGHT", text: "#fff" } },
    skeleton_knight:  { art: null, anims: {}, box: { w: 190, h: 400, color: "#d8d2bf", label: "SKELETON KNIGHT" } },
    dragon:           { art: null, anims: {}, box: { w: 620, h: 520, color: "#8e2b22", label: "DRAGON (MEGA BOSS)", text: "#fff" } },
    bridgekeeper:     { art: null, anims: {}, box: { w: 150,  h: 320, color: "#7a5c8e", label: "BRIDGEKEEPER", text: "#fff" } },
    enchanter:        { art: null, anims: {}, box: { w: 150,  h: 340, color: "#3b4a8a", label: "TIM", text: "#fff" } },
    hermit:           { art: null, anims: {}, box: { w: 140,  h: 270, color: "#8a7a55", label: "HERMIT" } },
    // graves of past deaths (one per death spot; the furthest death gets its own variant)
    grave:            { art: null, anims: {}, box: { w: 150, h: 220, color: "#8d8a80", label: "GRAVE" } },   // unknown killer (no emblem art yet)
    grave_skeleton_knight: { art: null, anims: {}, box: { w: 150, h: 220, color: "#d8d2bf", label: "GRAVE ☠ SKELETON" } },
    grave_black_knight:    { art: null, anims: {}, box: { w: 150, h: 220, color: "#2b2b2b", label: "GRAVE ✠ BLACK KNIGHT" } },
    grave_hunters:         { art: null, anims: {}, box: { w: 150, h: 220, color: "#8e2b22", label: "GRAVE ⚔ HUNTERS" } },
    grave_turd_dragon:     { art: null, anims: {}, box: { w: 150, h: 220, color: "#6b5a3a", label: "GRAVE · TURD DRAGON" } },
    frank:            { art: null, anims: {}, box: { w: 140, h: 270, color: "#7a5a3a", label: "FRANK" } },
    turd_dragon:      { art: null, anims: {}, box: { w: 520, h: 300, color: "#6b5a3a", label: "TURD DRAGON", text: "#fff" } },
    hunter:           { art: null, anims: {}, box: { w: 140, h: 290, color: "#5a4a3a", label: "KING'S HUNTER", text: "#fff" } },
    // rest stops: exterior + keeper NPC (art slots)
    tavern:           { art: null, anims: {}, box: { w: 520, h: 380, color: "#9a6b3f", label: "TAVERN", text: "#fff" } },
    newt:             { art: null, anims: {}, box: { w: 120, h: 50, color: "#6a8a3a", label: "NEWT" } },
    tavern_keeper:    { art: null, anims: {}, box: { w: 150, h: 270, color: "#c78f6a", label: "BARKEEP" } },
    campsite:         { art: null, anims: {}, box: { w: 420, h: 200, color: "#c9a25a", label: "CAMPSITE" } },
    camp_keeper:      { art: null, anims: {}, box: { w: 140, h: 250, color: "#8a7a55", label: "OLD WALLY" } },
    shop:             { art: null, anims: {}, box: { w: 460, h: 340, color: "#7a8c9e", label: "SHOP", text: "#fff" } },
    shop_keeper:      { art: null, anims: {}, box: { w: 150, h: 280, color: "#b9a77a", label: "SHOPKEEP" } },

    // obstacles & props
    log:          { art: null, box: { w: 190, h: 50,  color: "#6b4a2b", label: "LOG", text: "#fff" } },
    rock:         { art: null, box: { w: 120,  h: 80,  color: "#7d7d7d", label: "ROCK" } },
    puddle:       { art: null, box: { w: 220, h: 16,  color: "#5a7ea0", label: "" } },
    signpost:     { art: null, box: { w: 110,  h: 210, color: "#8b6a3e", label: "CAMELOT →" } },
    dead_cart:    { art: null, box: { w: 260, h: 140,  color: "#5d4a3a", label: "BRING OUT YER DEAD", text: "#fff" } },
    haystack:     { art: null, box: { w: 180, h: 120,  color: "#d9c36a", label: "HAY" } },
    gallows_tree: { art: null, box: { w: 150,  h: 340, color: "#4a3a2a", label: "SPOOKY TREE", text: "#fff" } },
    shrubbery:    { art: null, box: { w: 170, h: 95,  color: "#3f7a3a", label: "A SHRUBBERY", text: "#fff" } },
    sky_dragon:   { art: null, box: { w: 200, h: 80,  color: "#3a2a2a", label: "DRAGON?", text: "#fff" } }
  },

  // Engraved digits/operators used by the sum display and the number pad (text fallback).
  // e.g. digit_7: { art: "numbers:digit_7" } or { img: "assets/v1/numbers/digit_7.png" }
  glyphs: {
    digit_0: {}, digit_1: {}, digit_2: {}, digit_3: {}, digit_4: {},
    digit_5: {}, digit_6: {}, digit_7: {}, digit_8: {}, digit_9: {},
    op_plus: {}, op_minus: {}, op_times: {}, op_divide: {}, op_equals: {}
  },

  // Bottom UI strip skin (parchment background + divider band). Same ref forms as glyphs.
  // Missing -> CSS parchment fill and a drawn double-rule divider with a centre diamond.
  ui: {
    strip_bg: {},   // e.g. { art: "ui:strip_bg" } 1600 x strip height (320 at default split), tiles horizontally
    divider: {}     // e.g. { art: "ui:divider" }  1600 x dividerH-ish ornamental rule
  },

  // Parallax layers, back to front. speed = fraction of camera movement.
  // art: "topic:backgroundId" (1600x900 or 2400x900, scene space, tiled horizontally).
  layers: [
    { id: "sky",       speed: 0.0,  art: null, kind: "sky" },
    { id: "mountains", speed: 0.08, art: null, kind: "mountains", color: "#8796b0" },
    { id: "castles",   speed: 0.2,  art: null, kind: "castles",   color: "#9fb08f" },
    { id: "trees",     speed: 0.45, art: null, kind: "trees",     color: "#4f7a45" },
    { id: "ground",    speed: 1.0,  art: null, kind: "ground",    color: "#a68a5b" }
  ],
  foreground: [
    { id: "front_grass", speed: 1.35, art: null, kind: "grass", color: "#3e6b34" }
  ]
};
