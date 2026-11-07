// Scenery that passes by while walking. All positions/sizes are SCENE px (900-tall art space;
// x is measured from the left edge of the visible scene, which is KM_LAYOUT.viewW wide).
window.KM_DATA = window.KM_DATA || {};
KM_DATA.world = {
  groundY: 983,          // feet line (scene px). v7: feet stand on the strip's painted ground divider. v11b: 893 + 90 (shorter strip)
  partyScreenX: 820,     // hero feet x in the view (v8: wider spacing for 1:1 figures)
  slotSpacing: 240,      // distance between party members
  soloBack: 240,         // v12j (Magnus): a lone hero stands this far behind partyScreenX; the front steps forward as the party fills (full party = partyScreenX)
  engageScreenX: 1750,   // where encounters stop (view x) in front of the party
  walkSpeed: 420,        // fallback; calibrated from the hero walk atlas below
  walkSpeedMultiplier: 1.8, // travel and animation: 20% faster
  enemyWalkSpeed: 260,
  gapScale: 1.8,         // multiplies the `gap` values in encounters.js
  hopHeight: 120,
  // obstacles the party hops over; never placed where the party or an encounter stands at a halt
  obstacleEvery: [900, 1500],
  obstacleKinds: ["log", "rock", "puddle"],
  // roadside props live in a back lane behind the road, also kept clear of halt spots
  propEvery: [700, 1200],
  propKinds: ["signpost", "dead_cart", "haystack", "gallows_tree", "shrubbery"],
  propLaneY: 850, propScale: 0.8, propAlpha: 1 /* v12g: solid (was 0.85) */, propClearance: 80,
  skyEventEvery: [14, 24], // seconds between distant dragon fly-bys
  // v7: with the painted scenery (KM_DATA.scenery) the old box obstacles / props / sky dragon are off (no approved art)
  boxScenery: false,
  pxPerLeague: 3000,       // journey meter: scene px walked per league
  restGap: 1300            // road gap before an auto-inserted rest stop (x gapScale)
};
