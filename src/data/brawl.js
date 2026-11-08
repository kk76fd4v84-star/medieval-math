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
  // difficulty: ONE icon under the rival's hearts (top right, mirroring your purse under your hearts), more serious as the
  // rating rises. rating N = 1 + (count-1) x (skill - lo) / (hi - lo), rounded, clamped 1..count (skill = accuracy / median
  // answer seconds; seeds: Dawdle 1 ... Quicksum 10). tiers: the last entry with minRating <= N is shown (any number of
  // tiers works). Maggi's art (handoff_to_maggi/brawl_rank) goes in assets/brawl/rank/; a file not there (yet) falls back
  // to the placeholder: icon (ink skull) drawn at a size growing from px[0] (N = 1) to px[1] (N = count).
  rating: { count: 10, skill: [0.06, 0.35],
    tiers: [
      { minRating: 1, img: "assets/brawl/rank/rank_01.png" },
      { minRating: 2, img: "assets/brawl/rank/rank_02.png" },
      { minRating: 3, img: "assets/brawl/rank/rank_03.png" },
      { minRating: 4, img: "assets/brawl/rank/rank_04.png" },
      { minRating: 5, img: "assets/brawl/rank/rank_05.png" },
      { minRating: 6, img: "assets/brawl/rank/rank_06.png" },
      { minRating: 7, img: "assets/brawl/rank/rank_07.png" },
      { minRating: 8, img: "assets/brawl/rank/rank_08.png" },
      { minRating: 9, img: "assets/brawl/rank/rank_09.png" },
      { minRating: 10, img: "assets/brawl/rank/rank_10.png" }
    ],
    px: [22, 46],
    icon: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3c-7 0-11 4.6-11 10.4 0 3.6 1.7 6 4 7.4V25h3v-2.4h1.6V25h4.8v-2.4H20V25h3v-4.2c2.3-1.4 4-3.8 4-7.4C27 7.6 23 3 16 3z" fill="#efe0c0" stroke="#2a1d12" stroke-width="2.2" stroke-linejoin="round"/><path d="M9 13.4c1-2.1 4.3-2.3 5.2-.4.6 1.5-.6 3.4-2.5 3.4-2.1 0-3.2-1.5-2.7-3zM23 13.4c-1-2.1-4.3-2.3-5.2-.4-.6 1.5.6 3.4 2.5 3.4 2.1 0 3.2-1.5 2.7-3z" fill="#2a1d12"/></svg>' },
  // the ghost look: Maggi's hand-recoloured sheets (handoff_to_maggi/ghost_black_knights/v1): fabric black, accents orange;
  // steel, weapons, hands and faces untouched. Same size + layout as the originals; a ghost draws its sheet instead.
  // Art without a sheet (follower_4 / follower_5, the shared rear atlas) draws its original, untinted.
  sheets: {
    hero: "assets/brawl/ghost/hero_walk_ghost.png",
    hero_starter: "assets/brawl/ghost/hero_starter_walk_ghost.png",
    follower_1: "assets/brawl/ghost/follower_1_walk_ghost.png",
    follower_2: "assets/brawl/ghost/follower_2_walk_ghost.png",
    follower_3: "assets/brawl/ghost/follower_3_walk_ghost.png",
    frank: "assets/brawl/ghost/frank_ghost.png",
    timmy: "assets/brawl/ghost/timmy_ghost.png",
    executioner: "assets/brawl/ghost/executioner_ghost.png",
    dark_wizard: "assets/brawl/ghost/dark_wizard_ghost.png"
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
  // party chatter and titles: ON SCREEN these are simply other parties ({sir} = their leader, e.g. "Sir Abacus").
  // Never "ghost" / spooky words on screen (Magnus): "ghost" is a behind-the-scenes word only (tests/brawl.test.js).
  lines: {
    sighting: [
      "Is that {sir} up ahead? Dressed for his own funeral, by the look of it.",
      "Another party! They're counting on their fingers. All of them.",
      "{sir}'s lot. Still doing sums. Nobody told them the war ended.",
      "That lot are waving. Or adding. Hard to tell from here."
    ],
    ambush: [
      "Ambush! {sir}'s lot, and they've brought an abacus.",
      "We've walked straight into {sir}. Awkward. Very awkward."
    ],
    challenge: "Challenge", ignore: "Ignore", fight: "Fight", flee: "Flee", sacrifice: "Leave {name}",
    sightingTitle: "{sir}", ambushTitle: "Ambush! {sir}",
    fleeOk: "We ran. It cost us {coins} coins of dignity.", fleeFail: "They're faster than they look!",
    sir: "Sir {name}",                       // every rival leader is called this (names are stored bare)
    thinking: "…"
  }
};
