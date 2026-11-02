// v11 (Magnus: "Add the spell of stupidity. It lowers the difficulty. For a while.")
// A consumable: cast with Z on the road or on your turn in a fight; the next `problems` sums use the "stupid" maths
// level (single digits, + and - only), then it wears off. TEMP_BALANCE values are marked; tune freely.
window.KM_DATA = window.KM_DATA || {};
KM_DATA.spell = {
  key: "Z",              // cast (road / your turn / mid-sum); at a tavern or shop Z buys one
  start: 1,              // TEMP_BALANCE: scrolls at the start of a new game
  problems: 5,           // TEMP_BALANCE: how many sums it lasts
  level: "stupid",       // KM_DATA.mathLevels.stupid
  price: 5,              // TEMP_BALANCE: gold per scroll at the tavern and the shop (not the campsite)
  sellAt: ["stall", "shop"], // v11b: the roadside scroll stall first; the tavern sells mead instead (its sign: Mead, Stew)
  goldMul: 0.5,          // TEMP_BALANCE: a fight won with any stupid sum pays half gold (rounded down)
  max: 9,
  // v11b: every line fits ONE painted bubble (2 lines at 30 px in its 249 px text width)
  cast: [
    { text: "Your brain goes soft and warm. Lovely.", vo: "vo_spell_cast" },
    { text: "I feel much less clever. Hooray!", vo: "vo_spell_cast" },
    { text: "Ooh. Small sums and puppies!", vo: "vo_spell_cast" }
  ],
  wearOff: [
    { text: "Ow. My brain is back.", vo: "vo_spell_wear_off" },
    { text: "The stupid wears off. Pity. It was nice.", vo: "vo_spell_wear_off" }
  ],
  already: "Steady on. I'm stupid enough.",
  meadAlready: "The mead's doing that already.", // a scroll during a mead battle: refused, no scroll used
  none: "No scrolls left. I'll have to think. Ugh.",
  sfx: { cast: "spell_cast", wearOff: "spell_wear_off" }
};
