// Fellowship upgrade cards (Maggi's v9 art, approved by Magnus). Behind the `cards` switch (?cards=1), off by default.
// One pick per rest stop (camp, scroll stand / shop, tavern). Costs raise the owner's sum level (needs the who-acts table,
// which the cards switch turns on) or chip the party on a miss. Text is baked into the PNGs.
window.KM_DATA = window.KM_DATA || {};
KM_DATA.upgradeCards = {
  offered: 2, // cards shown per pick
  list: [
    { id: "cleave", owner: "knight", img: "assets/ui/cards/cleave.png?v=3t", name: "Cleave",
      effect: { knightTargets: 1 }, cost: { level: { knight: 1 } } },          // knight sums get two digits
    { id: "swing_and_a_miss", owner: "knight", img: "assets/ui/cards/swing_and_a_miss.png?v=3t", name: "Swing and a Miss",
      effect: { knightTargets: 1 }, cost: { missChip: 1 } },                  // 1 heart unit (½ heart with half-hearts), never the last
    { id: "embers", owner: "firestarter", img: "assets/ui/cards/embers.png", name: "Embers",
      effect: { burn: 1 }, cost: { level: { firestarter: 2 } } },             // fire sums climb to tables up to 9
    { id: "shield_wall", owner: null, img: "assets/ui/cards/shield_wall.png", name: "Shield Wall",
      effect: { cleanRefill: true }, cost: {} },                               // armour refills after a fight with no hearts lost
    // Dark Wizard (Maggi, 2026-11-08). `text` is the fallback if an image is missing
    { id: "storm_surge", owner: "darkWizard", img: "assets/ui/cards/storm_surge.png", name: "Storm Surge",
      text: "Right answer: lightning hits every enemy harder (+3).", costText: "Wizard sums get harder.",
      effect: { wizardDamage: 3 }, cost: { level: { darkWizard: 1 } } },
    { id: "overcharge", owner: "darkWizard", img: "assets/ui/cards/overcharge.png", name: "Overcharge",
      text: "Right answer: lightning hits every enemy much harder (+6).", costText: "A miss shocks one ally.",
      effect: { wizardDamage: 6 }, cost: { missChip: 1 } }
  ]
};

// Cards v2 (Magnus's card codex edits 2026-11-09, behind the `cardsV2` switch, ?cardsv2=1, which turns `cards` on).
// Picking a card again raises its level (up to max). Per-level values are arrays, index = level - 1.
// Numbers Magnus did not give are PROVISIONAL (marked *) until he OKs them. Art: Maggi's v10 cards (600x900, text baked
// in, art.dir + id + ".png"); the game prints LEVEL n/max into the empty level slot. `text` / `costText` stay as the
// fallback text card when a picture is missing.
KM_DATA.upgradeCardsV2 = {
  offered: 2,
  art: { dir: "assets/ui/cards/v10/", size: [600, 900], level: { box: [204, 128, 505, 147], font: 15, ink: "#140E0A" } },
  knightSecondHit: 0.5,          // every knight swing: 100% on the first foe, 50% on the second (Cleave raises it)
  list: [
    { id: "cleave", owner: "knight", name: "Cleave", max: 5,
      text: "Your knight's second target takes more damage. At level 5 he hits a third.", costText: "Crits get a little harder.",
      cleave: [[1, .65], [1, .75], [1, .85], [1, .95], [1, .95, .5]],          // share of damage per target; third at 50%*
      shrink: { crit: .03 } },                                                  // * crit band, taken once on the first pick
    { id: "swing_and_a_miss", owner: "knight", name: "Swing and a Miss", max: 3,
      text: "Your knight hits harder.", costText: "Once a run, a miss hits the companion behind him for a quarter of their life.",
      knightDamage: [1, 2, 3],                                                  // * extra damage per knight swing
      backswing: { share: .25, onceARun: true } },
    { id: "embers", owner: "firestarter", name: "Embers", max: 4,
      text: "Fire does more damage.", costText: "A miss may set an ally on fire.",
      fireDamage: [1, 2, 3, 4],                                                 // * extra damage per fire hit
      friendlyFire: [.05, .10, .15, .20], friendlyFireUnits: 1 },              // chance on a miss; 1 heart unit*, never the last
    { id: "shield_wall", owner: null, name: "Shield Wall", max: 4,
      text: "The enemy's first attack each fight may be blocked.", costText: "The block window shrinks a little.",
      firstBlock: [.5, .6, .7, .8],                                             // 60% / 70% * in between
      shrink: { block: .03 } },                                                 // *
    { id: "thunder_fist", owner: "darkWizard", name: "Thunder Fist", max: 3,
      text: "A right answer may stun an enemy.", costText: "Wizard sums get harder.",
      stunChance: .25, stuns: [1, 2, 3], level: { darkWizard: 1 } },
    { id: "high_voltage", owner: "darkWizard", name: "High Voltage", max: 1,
      text: "Right answer: lightning hits every enemy harder (+3).", costText: "A miss shocks one ally.",
      wizardDamage: [3], missChip: 1 },
    { id: "rallying_cry", owner: "knight", name: "Rallying Cry", max: 1,
      text: "Your party may strike twice.", costText: "Angry foes may strike the moment the meter runs out.",
      strikeAgain: .05, angerChance: .05 },
    { id: "weighted_axe", owner: "executioner", name: "Weighted Axe", max: 5,
      text: "More damage against badly hurt enemies.", costText: "A miss sticks the axe in the ground: he skips his next turn.",
      lowHealth: .25, axeBonus: [.2, .4, .6, .8, 1] }                           // * steps of 20%
  ]
};
