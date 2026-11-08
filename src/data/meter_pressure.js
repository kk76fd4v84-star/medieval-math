// Meter pressure (switch: KM_DATA.balanceTry.meterPressure, ?meterpressure=1). Difficulty from the timing meter, not harder sums.
// Foes push the meter; gear pushes back. Per type only the strongest living foe counts. SUGGESTED values, tune in playtests.
//   quick = share of the answer time taken away (faster needle)   heavy = block band narrower
//   slippery = crit band narrower                                  shroud = width of meter hidden in ink (from the block band's end)
window.KM_DATA = window.KM_DATA || {};
KM_DATA.meterPressure = {
  limits: { critMin: .20, blockMin: .05, bandGap: .05, quickMax: .15, inkMax: .20 },
  tags: { quick: "FAST", heavy: "HEAVY", slippery: "SLIPPERY", shroud: "INK" },   // plain-text tags by the meter
  art: "assets/meter_pressure/",   // optional {quick,heavy,slippery,shroud,helm,lantern}.png; the text tag / shop glyph stays until one exists
  sfx: { quick: "pressure_quick", heavy: "pressure_heavy", slippery: "pressure_slippery", shroud: "pressure_shroud", helm: "helm_buy", lantern: "lantern_buy" },
  foes: {
    killer_rabbit:    { quick: .10 },
    rabid_dog:        { quick: .10 },
    goblin:           { slippery: .05 },
    turd_dragon:      { heavy: .10, slippery: .05, shroud: .10 },
    skeleton_knight:  { heavy: .10, slippery: .05 },
    toad:             { shroud: .10 },
    ogre:             { heavy: .05 },
    black_knight:     { quick: .05, heavy: .10, slippery: .05 },
    dragon:           { quick: .10, heavy: .15, slippery: .10 },
    hollow_skeleton:  { heavy: .05 },
    hollow_zombie:    { heavy: .03 },
    grave_spider:     { quick: .10 },
    root_horror:      { heavy: .08, shroud: .10 },
    parish_collector: { quick: .05, heavy: .10, slippery: .08 },
    bell_beneath:     { heavy: .15, slippery: .10, shroud: .15 },
    tomb_sentry:      { heavy: .04 },
    tomb_warden:      { heavy: .04, slippery: .04, shroud: .10 }
  },
  // weapon / armour = the existing per-member levels (steps = combat.timing weaponStep / armourStep);
  // armour cancels heavy first, then wins back the companions' block pressure. helm / lantern = party-wide levels.
  gear: {
    weapon:  { counters: "slippery", max: 3 },
    armour:  { counters: "heavy",    max: 3 },
    helm:    { counters: "quick",  step: .05, max: 2, cost: [8, 10], name: "Helm",    note: "Slower needle" },
    lantern: { counters: "shroud", step: .05, max: 2, cost: [6, 6],  name: "Lantern", note: "Clears the ink" }
  },
  // which stops sell helm / lantern: shop<tier>, tavern<n> (n-th tavern of the route), <chapter>:shop
  sell: {
    helm:    ["shop2", "shop3", "hollowwood:shop"],
    lantern: ["tavern2", "shop3", "hollowwood:shop"]
  }
};
