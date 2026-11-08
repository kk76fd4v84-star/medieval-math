// One-time tutorial frames (shown once per save). Layout + words: Maggi's castbar_v3 mockup (handoff_to_maggi/tutorial/castbar_v3).
// Cast bar: switch castBar (?castbar=1), before the first sum of a run. All words live here; swap freely.
window.KM_DATA = window.KM_DATA || {};
KM_DATA.tutorial = {
  castBar: {
    saveKey: "knightMath.tutorial.castBar",
    title: "Read the cast bar",
    intro: "Answer before an icon to gain its effect.",
    ends: ["Earlier", "Later"],
    icons: [  // left to right along the bar (at = mini-bar spot, 0..1); icon = assets/timing-woodcut/<icon>.png
      { icon: "block", at: 0.25, text: "Block: will block next incoming damage and crit." },
      { icon: "crit", at: 0.5, text: "Crit: double damage." },
      { icon: "normal", at: 0.75, text: "Normal: full damage." },
      { icon: "weak", at: 1, text: "Weak: half damage." }
    ],
    // optional small lines under the rows (none in v3): strike: "...", trail: "...", tricks: { title, lines } (meterPressure only)
    button: "Onward!"
  },
  // one-time tips the first time the cast bar shifts for a reason (Magnus 2026-11-09); same frame, words only
  tips: {
    party: {
      saveKey: "knightMath.tutorial.partyTip",
      title: "A bigger party",
      text: "With a larger party comes the bigger damage. However, more people also means more arguing about who swings first, so you get less time to block or land a critical hit.",
      button: "Got it"
    },
    gear: {
      saveKey: "knightMath.tutorial.gearTip",
      title: "Better gear",
      text: "Better gear makes up for a party that can't agree on anything. Armour, weapons and other nice... stuff win your time back.",
      button: "Got it"
    }
  }
};
