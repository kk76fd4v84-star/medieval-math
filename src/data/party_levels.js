// Recruit codes (switch recruitCode, ?recruitcode=1) and party levels (switch partyLevels, ?partylevels=1). Magnus 2026-11-09.
// PROVISIONAL numbers: tune in playtests (Magnus OKs balance).
window.KM_DATA = window.KM_DATA || {};
KM_DATA.recruitCode = {
  digits: 6, secs: 5,   // companions test speed, not brains: type the code before the 5 s meter ends (battle meters keep their own times)
  fail: { contest: "Too slow! Roll me for it, then.", leave: "Too slow. Maybe another time." }
};
KM_DATA.partyLevels = {
  max: 5,
  winsFor: [0, 2, 5, 9, 14],     // fights won while alive to reach level 1..5
  // a party's courage = (average level of the living party - 1) / (max - 1); it cancels this share of a foe's intimidation
  cancel: { normal: 1, big: 0.5 }, // level-5 party: normal foes fully neutralised, big bosses only half
  big: ["boss", "mega"],           // stop types whose foes count as big bosses
  // early critters that intimidate a fresh party (merged into meterPressure.foes while partyLevels is on)
  foes: { rabid_squirrel: { slippery: .05 }, killer_rabbit: { quick: .10, slippery: .03 } },
  levelUp: "Level {n}!"
};
