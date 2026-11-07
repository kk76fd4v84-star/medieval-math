// Fellowship upgrade cards (Maggi's v9 art, approved by Magnus). Behind the `cards` switch (?cards=1), off by default.
// One pick per rest stop (camp, scroll stand / shop, tavern). Costs raise the owner's sum level (needs the who-acts table,
// which the cards switch turns on) or chip the party on a miss. Text is baked into the PNGs.
window.KM_DATA = window.KM_DATA || {};
KM_DATA.upgradeCards = {
  offered: 2, // cards shown per pick
  list: [
    { id: "cleave", owner: "knight", img: "assets/ui/cards/cleave.png", name: "Cleave",
      effect: { knightTargets: 1 }, cost: { level: { knight: 1 } } },          // knight sums get two digits
    { id: "swing_and_a_miss", owner: "knight", img: "assets/ui/cards/swing_and_a_miss.png", name: "Swing and a Miss",
      effect: { knightTargets: 1 }, cost: { missChip: 1 } },                  // 1 heart unit (½ heart with half-hearts), never the last
    { id: "embers", owner: "firestarter", img: "assets/ui/cards/embers.png", name: "Embers",
      effect: { burn: 1 }, cost: { level: { firestarter: 2 } } },             // fire sums climb to tables up to 9
    { id: "shield_wall", owner: null, img: "assets/ui/cards/shield_wall.png", name: "Shield Wall",
      effect: { cleanRefill: true }, cost: {} }                               // armour refills after a fight with no hearts lost
  ]
};
