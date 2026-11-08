// Balance experiments, each behind its own switch (all OFF by default, so the game plays as before).
// Turn one on for a test run with the page address, e.g. ?curve=1&halfhearts=1&camparmour=1
// (start a NEW run after switching halfhearts, because it changes how hearts are counted).
// Values are provisional starting points to tune in playtests.
window.KM_DATA = window.KM_DATA || {};
KM_DATA.balanceTry = {
  curve: false,       // smoother difficulty: packs take turns, Fellowship enemy health ramps, bosses hit hard only when they roar
  halfHearts: false,  // ordinary hits take half a heart; boss roar blows take a full heart; heals scale to match
  campArmour: false,  // resting at camp mends bought armour back to its best level
  cards: false,       // Fellowship upgrade cards at rest stops (src/data/upgrade_cards.js); turns on whoActs for their maths costs
  meterPressure: false, // difficulty from the timing meter: foe pressures + helm / lantern (src/data/meter_pressure.js)
  gradual: false,     // slow step-by-step maths ladder (see `ladder` below); turns on whoActs
  whoActs: false,
  knightStart: false, // a new run starts as the covered-face knight (Maggi's starter art, chipped sword) instead of the villager
  brawl: false,       // ghosts of recorded runs on the road: sightings + ambushes (src/data/brawl.js, src/brawl.js)
  pauseMenu: false,  // music on/off lives in a pause menu (P or the top-right pause button; the world stops); the stage's music button and distance flag hide (Magnus 2026-11-08)
  toughFoes: false,   // stronger foes take more blows: Fellowship health x `tough` below, on top of the curve (Magnus 2026-11-08)
  chestCards: false,  // upgrade cards only from chests behind stronger foes, none in shops (src/data/chest_cards.js); turns on cards
  castBar: false,     // looks only: the timing meter always on screen; moved band ends shake + slide with a green / red trail (src/data/cast_bar.js)     // Fellowship: each sum belongs to one member (+ knights, − healers, × fire / wizard / executioner); their strike counts double
  // curve: Fellowship enemy health = base hp x min(max, start + step x battles fought this run)
  health: { start: 2.0, step: 0.05, max: 2.6 },
  // toughFoes: health multiplier per foe id (missing = 1). Aim: strong foes 3-4 right answers, bosses / dragons 5-7
  tough: { goblin: 1.6, toad: 1.4, ogre: 1.4, troll: 1.4, skeleton_knight: 1.6, black_knight: 2.0, turd_dragon: 2.0, dragon: 1.0 },
  battlesBefore: { village: 0, hollowwood: 10, tomb: 18 }, // battles a run has usually fought before each chapter
  packsTakeTurns: true, // groups attack one at a time (Hollow Wood already does)
  boss: { atk: 1, roarEvery: 3, roarAtk: 2 }, // boss / mega boss: 1 per hit, every 3rd enemy turn is a 2-hit roar
  // whoActs: base weight and sum per role; a member's level = 1 + weapon upgrades (upgrade cards later), capped at 3
  roles: {
    knight:      { cue: "cue_knight", sign: "+", weight: 5 },
    priest:      { cue: "cue_healer", sign: "−", weight: 3 },
    firestarter: { cue: "cue_fire", sign: "×", weight: 1 },
    darkWizard:  { cue: "cue_wizard", sign: "×", weight: 1 },
    executioner: { cue: "cue_executioner", sign: "×", weight: 1 }
  },
  levelWeight: 1, // each level above 1 adds this to the member's weight
  // the fight multiplies weights before every sum (roles not listed stay x1)
  situations: {
    small: { knight: 2, firestarter: 0.5, darkWizard: 0.5 },        // 1-2 enemies
    pack:  { firestarter: 3, darkWizard: 3, executioner: 0.5 },     // 3 or more enemies
    boss:  { firestarter: 0.5, darkWizard: 0.5, executioner: 3 },   // boss or mega boss
    hurt:  { priest: 2 }                                            // party below half hearts
  },
  leaderMultiplier: 2,
  // gradual: each sign climbs its ladder one step per `everyCorrect` right answers this run;
  // each upgrade (weapon or card cost) starts that member one step higher. Edit the ladders freely.
  everyCorrect: 5,
  ladder: {
    "+": ["g_plus_1", "g_plus_2", "g_plus_3", "g_plus_4", "g_plus_5", "g_mix_1", "g_mix_2"],
    "−": ["g_minus_1", "g_minus_2", "g_minus_3", "g_minus_4", "g_mix_1"],
    "×": ["g_times_1", "g_times_2", "g_times_3", "g_times_4", "g_mix_2"]
  },
  sums: { "+": ["plus_1", "plus_2", "plus_3"], "−": ["minus_1", "minus_2", "minus_3"], "×": ["times_1", "times_2", "times_3"] }
};
// sum ranges per level, kept inside the 10-15 second head-maths rule
Object.assign(KM_DATA.mathLevels = KM_DATA.mathLevels || {}, {
  plus_1:  [{ type: "add", weight: 1, a: [2, 9],   b: [2, 9] }],
  plus_2:  [{ type: "add", weight: 1, a: [11, 49], b: [2, 9] }],
  plus_3:  [{ type: "add", weight: 1, a: [15, 69], b: [11, 29] }],
  minus_1: [{ type: "sub", weight: 1, a: [6, 18],  b: [2, 9] }],
  minus_2: [{ type: "sub", weight: 1, a: [20, 59], b: [2, 9] }],
  minus_3: [{ type: "sub", weight: 1, a: [30, 89], b: [11, 29] }],
  times_1: [{ type: "mul", weight: 1, a: [2, 5],   b: [2, 5] }],
  times_2: [{ type: "mul", weight: 1, a: [2, 6],   b: [2, 9] }],
  times_3: [{ type: "mul", weight: 1, a: [3, 9],   b: [3, 9] }],
  // gradual ladder (min / max = allowed answer range)
  g_plus_1:  [{ type: "add", weight: 1, a: [1, 9],   b: [1, 9], max: 10 }],              // answer up to 10
  g_plus_2:  [{ type: "add", weight: 1, a: [3, 9],   b: [3, 9], min: 11 }],              // over 10
  g_plus_3:  [{ type: "add", weight: 1, a: [11, 39], b: [2, 9] }],                       // one double digit + one single
  g_plus_4:  [{ type: "add", weight: 1, a: [11, 39], b: [11, 29] }],                     // two double digits
  g_plus_5:  [{ type: "add", weight: 1, a: [20, 59], b: [11, 39] }],
  g_minus_1: [{ type: "sub", weight: 1, a: [3, 10],  b: [1, 9] }],                       // within 10
  g_minus_2: [{ type: "sub", weight: 1, a: [11, 19], b: [2, 9] }],
  g_minus_3: [{ type: "sub", weight: 1, a: [20, 49], b: [2, 9] }],
  g_minus_4: [{ type: "sub", weight: 1, a: [30, 69], b: [11, 29] }],
  g_times_1: [{ type: "mul", weight: 1, a: [2, 3],   b: [2, 5] }],
  g_times_2: [{ type: "mul", weight: 1, a: [2, 5],   b: [2, 5] }],
  g_times_3: [{ type: "mul", weight: 1, a: [2, 5],   b: [2, 9] }],
  g_times_4: [{ type: "mul", weight: 1, a: [3, 9],   b: [3, 9] }],
  g_mix_1:   [{ type: "chain", weight: 1, a: [10, 39], b: [5, 19], c: [5, 19] }],         // e.g. 32 + 16 − 16
  g_mix_2:   [{ type: "add_mul", weight: 1, a: [5, 20], b: [2, 5], c: [2, 3] }]           // e.g. 10 + 5 × 3
});
