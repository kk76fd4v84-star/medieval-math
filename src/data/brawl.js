// Brawl mode (switch: KM_DATA.balanceTry.brawl, ?brawl=1). Pure data, read by src/brawl.js. Magnus 2026-11-08:
// ghosts of other players' runs on the road: seen on a far hill (Challenge / Ignore) or walked into (Fight / Flee / Sacrifice).
// v1 is offline: the ghost pool = runs recorded on this device + the seed ghosts below. Run format: docs/brawl_run_format.md.
window.KM_DATA = window.KM_DATA || {};
KM_DATA.brawl = {
  storage: { runs: "knightMath.brawl.runs", rank: "knightMath.brawl.rank", player: "knightMath.brawl.player", keep: 20 },
  // where ghosts show up on a route: after `from` stops, at most one per gap of `gap` stops; chance per eligible gap
  route: { from: 3, gap: 6, sighting: 0.35, ambush: 0.2, gapPx: 1300, level: "normal", gold: 6 },
  // a ghost team looks like a real party: a recorded run keeps each member's art; seeds (and old records) draw by role.
  // The leader is the knight; plain knights take the follower looks in turn. They stand on the right, facing the party.
  art: { leader: "hero", knight: ["follower_1", "follower_2", "follower_3"], priest: "frank", firestarter: "timmy", executioner: "executioner", darkWizard: "dark_wizard" },
  hud: { top: 150, right: 18, name: { font: "bold 30px Georgia, serif", ink: "#2a1d12", gap: 10 } }, // ghost hearts top right (stage px), under the music button; "Sir <name>" above them
  // the ghost look (Magnus: "black clothes with orange details ... a little bit of a black knight vibe"): each sprite image is
  // recoloured ONCE (cached). Pixels are sorted by hue / saturation / lightness (0-360, 0-1, 0-1): undyed cloth, orange dye
  // (and skin, which shares its colours), dark ink. A target keeps the pixel's shading between its dark and light ends.
  // Metal, steel and skin stay. Per sprite: what cloth / dye become, its own colour ranges where the woodcut's linen and
  // steel share colours (`range`), and whether dark emblems sewn on the dye (the tabard cross) turn orange: solid ink
  // (`solid` px around it all dark) with dye on all four sides within `holes` source px.
  // `head`: in the top share of each frame (cells = the image height) pixels at least this saturated keep (skin, where skin and cloth share colours).
  paint: {
    black: ["#100e0d", "#4a433e"], orange: ["#5a2408", "#f08a36"],
    cloth: { h: [10, 50], s: [0.1, 0.45], l: [0.3, 0.8] },
    dye:   { h: [8, 40],  s: [0.45, 1],   l: [0.28, 0.9] },
    ink: 0.3, holes: 60, solid: 2,
    sprites: {
      default:      { cloth: "black", dye: "keep" },                    // scarf / hood / belt stay orange; faces and hands keep
      hero:         { cloth: "keep", dye: "black", holes: "orange", range: { dye: { h: [8, 30] } } }, // no skin: black tabard, orange cross; steel (yellower) stays
      hero_starter: { cloth: "keep", dye: "black", holes: "orange", range: { dye: { h: [8, 30] } } },
      follower_2:   { cloth: "black", dye: "black", holes: "orange", range: { dye: { h: [8, 30] }, cloth: { h: [10, 31], l: [0.3, 0.62] } } }, // black tabard, orange wheel
      follower_3:   { cloth: "black", dye: "keep", head: { top: 0.34, s: 0.38 }, range: { dye: { h: [8, 27] }, cloth: { h: [27, 36], s: [0.08, 1], l: [0.3, 0.92] } } }, // linen = skin colours: skin-saturated pixels in his head (top 34 % of a cell) keep
      dark_wizard:  { cloth: "black", dye: "keep", range: { cloth: { s: [0.38, 1], l: [0.3, 0.8] }, dye: { s: [0.95, 1] } } }                // robe vs beard and face
    }
  },
  foe: { hpPerAnswer: 3, atk: 1 },          // a ghost's health = hpPerAnswer x its rank step (+ the run's usual health rules)
  replay: { minSecs: 1.5, maxSecs: 12 },     // a ghost answers at its recorded time, kept inside these bounds
  flee: { chance: 0.6, cost: 2 },            // Flee: chance to get away; it costs this many coins (or what you have)
  // ghost skill = accuracy / median seconds; seeds are generated into the same run format (easy -> hard)
  seeds: [
    { name: "Dawdle",            party: ["knight"],                         secs: 7.5, spread: 0.30, accuracy: 0.60 },
    { name: "Fumblewick",        party: ["knight", "knight"],               secs: 6.0, spread: 0.25, accuracy: 0.70 },
    { name: "Middling",          party: ["knight", "priest"],               secs: 5.0, spread: 0.25, accuracy: 0.78 },
    { name: "Brisk",             party: ["knight", "knight", "priest"],     secs: 4.0, spread: 0.20, accuracy: 0.85 },
    { name: "Abacus",            party: ["knight", "executioner", "priest"], secs: 3.0, spread: 0.15, accuracy: 0.92 },
    { name: "Quicksum",          party: ["knight", "darkWizard", "priest", "knight"], secs: 2.2, spread: 0.12, accuracy: 0.96 }
  ],
  seedAnswers: { ops: ["+", "−", "×", "÷"], each: 6, opSecs: { "+": 1, "−": 1.15, "×": 1.35, "÷": 1.5 } },
  // party chatter ({ghost} = the ghost's name). Own jokes only.
  lines: {
    sighting: [
      "Is that {ghost} up ahead? Dressed for his own funeral, by the look of it.",
      "A ghost party! They're counting on their fingers. All of them.",
      "{ghost}'s ghost. Still doing sums. Death is no excuse, apparently.",
      "That lot are waving. Or adding. Hard to tell with spectres."
    ],
    ambush: [
      "Ghosts on the road! {ghost}'s lot, and they've brought an abacus.",
      "We've walked straight into {ghost}. Awkward. Very awkward."
    ],
    challenge: "Challenge", ignore: "Ignore", fight: "Fight", flee: "Flee", sacrifice: "Leave {name}",
    sightingTitle: "A ghost party: {ghost}", ambushTitle: "Ambush! {ghost}",
    fleeOk: "We ran. It cost us {coins} coins of dignity.", fleeFail: "They're faster than they look!",
    sir: "Sir {name}",                       // every ghost is called this (names are stored bare)
    thinking: "…", ghostWon: "Too slow, living one!", lost: "Back to the hill with you!"
  }
};
