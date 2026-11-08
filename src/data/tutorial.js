// One-time tutorial frames (shown once per save). Layout: Maggi's castbar_v1 mockup (handoff_to_maggi/tutorial/castbar_v1).
// Cast bar: switch castBar (?castbar=1), before the first sum of a run. All words live here; swap freely.
window.KM_DATA = window.KM_DATA || {};
KM_DATA.tutorial = {
  castBar: {
    saveKey: "knightMath.tutorial.castBar",
    title: "Read the cast bar",
    intro: "Answer right. Where you stop changes the hit.",
    ends: ["Earlier", "Later"],
    icons: [  // left to right along the bar (at = mini-bar spot, 0..1); icon = assets/timing-woodcut/<icon>.png
      { icon: "block", at: 0.25, text: "Block: block their turn." },
      { icon: "crit", at: 0.5, text: "Crit: double damage." },
      { icon: "normal", at: 0.75, text: "Normal: full damage." },
      { icon: "weak", at: 1, text: "Weak: half damage." }
    ],
    strike: "Outside Block, foes strike back.",
    tricks: { title: "Enemy tricks", lines: ["FAST: less time · HEAVY: less Block", "SLIPPERY: less Crit · INK: hides the bar"] }, // only with meterPressure
    trail: "Green trail helps; red hurts.",
    button: "Got it"
  }
};
