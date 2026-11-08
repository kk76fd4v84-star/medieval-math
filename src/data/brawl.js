// Brawl mode (switch: KM_DATA.balanceTry.brawl, ?brawl=1). Pure data, read by src/brawl.js. Magnus 2026-11-08:
// ghosts of other players' runs on the road: seen on a far hill (Challenge / Ignore) or walked into (Fight / Flee / Sacrifice).
// v1 is offline: the ghost pool = runs recorded on this device + the seed ghosts below. Run format: docs/brawl_run_format.md.
window.KM_DATA = window.KM_DATA || {};
KM_DATA.brawl = {
  storage: { runs: "knightMath.brawl.runs", rank: "knightMath.brawl.rank", player: "knightMath.brawl.player", keep: 20 },
  // where ghosts show up on a route: after `from` stops, at most one per gap of `gap` stops; chance per eligible gap
  route: { from: 3, gap: 6, sighting: 0.35, ambush: 0.2, gapPx: 1300, level: "normal", gold: 6 },
  // the ghosts' look: existing party art, pale and see-through (art ids by party slot: leader first)
  art: ["hero_starter", "follower_1", "follower_2", "follower_3"],
  look: { filter: "grayscale(1) brightness(1.45) contrast(.75)", alpha: 0.62, hillScale: 0.5 },  // hillScale: size far off on the hill
  foe: { hpPerAnswer: 3, atk: 1 },          // a ghost's health = hpPerAnswer x its rank step (+ the run's usual health rules)
  replay: { minSecs: 1.5, maxSecs: 12 },     // a ghost answers at its recorded time, kept inside these bounds
  flee: { chance: 0.6, cost: 2 },            // Flee: chance to get away; it costs this many coins (or what you have)
  // ghost skill = accuracy / median seconds; seeds are generated into the same run format (easy -> hard)
  seeds: [
    { name: "Brother Dawdle",    party: ["knight"],                         secs: 7.5, spread: 0.30, accuracy: 0.60 },
    { name: "Sir Fumblewick",    party: ["knight", "knight"],               secs: 6.0, spread: 0.25, accuracy: 0.70 },
    { name: "Dame Middling",     party: ["knight", "priest"],               secs: 5.0, spread: 0.25, accuracy: 0.78 },
    { name: "Sir Brisk",         party: ["knight", "knight", "priest"],     secs: 4.0, spread: 0.20, accuracy: 0.85 },
    { name: "The Abacus Knight", party: ["knight", "executioner", "priest"], secs: 3.0, spread: 0.15, accuracy: 0.92 },
    { name: "Lady Quicksum",     party: ["knight", "darkWizard", "priest", "knight"], secs: 2.2, spread: 0.12, accuracy: 0.96 }
  ],
  seedAnswers: { ops: ["+", "−", "×", "÷"], each: 6, opSecs: { "+": 1, "−": 1.15, "×": 1.35, "÷": 1.5 } },
  // party chatter ({ghost} = the ghost's name). Own jokes only.
  lines: {
    sighting: [
      "Is that {ghost} on the hill? He looks rather see-through today.",
      "A ghost party! They're counting on their fingers. All of them.",
      "{ghost}'s ghost. Still doing sums. Death is no excuse, apparently.",
      "Those spectres are waving. Or adding. Hard to tell with spectres."
    ],
    ambush: [
      "Ghosts on the road! {ghost}'s lot, and they've brought an abacus.",
      "We've walked straight into {ghost}. Awkward. Very awkward."
    ],
    challenge: "Challenge", ignore: "Ignore", fight: "Fight", flee: "Flee", sacrifice: "Leave {name}",
    sightingTitle: "A ghost party: {ghost}", ambushTitle: "Ambush! {ghost}",
    fleeOk: "We ran. It cost us {coins} coins of dignity.", fleeFail: "They're faster than they look!",
    thinking: "…", ghostWon: "Too slow, living one!", lost: "Back to the hill with you!"
  }
};
