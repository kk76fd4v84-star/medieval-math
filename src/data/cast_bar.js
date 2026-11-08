// Cast bar (switch: KM_DATA.balanceTry.castBar, ?castbar=1). The timing meter stays on screen all the time, and when a
// band end moves (upgrade card, shop gear, camp armour, a foe's meter pressure at a fight's start / gone after it) its
// icon shakes, slides to the new place and leaves a trail drawn like the orange timer fill: green = helps, red = hurts.
// Looks only; no balance values here.
window.KM_DATA = window.KM_DATA || {};
KM_DATA.castBar = {
  icons: ["block", "crit", "normal"],   // icons that can move (weak always sits at the meter's end)
  minMove: 0.005,                       // smaller moves (rounding) are ignored
  // Magnus 2026-11-08: three strict phases of a full second each
  shakeMs: 1000, shakePx: 3,            // 1) the icon shakes
  slideMs: 1000,                        // 2) it slides to its new place, the trail grows behind it (ticks play here)
  holdMs: 0,                            //    (no pause between)
  shrinkMs: 1000,                       // 3) the trail catches up to the icon
  inkFadeMs: 400,                       // ink (shroud) just fades in
  ease: "cubic-bezier(.2,.75,.25,1)",
  colours: { good: "#3f8a2c", bad: "#b3261e" },
  // optional sounds, silent if no file is mapped for them
  sfx: { shake: "meter_shake", good: "meter_slide_good", bad: "meter_slide_bad", tick: "meter_tick" },
  // clock winding during the slide: one tick per rate, spread over the slide, the last one at the slide's end.
  // Charlie's wooden ratchet click (meter_tick); rate = playback speed (also pitch), limited to 0.8..1.2 by the audio code.
  // good: "tick tick tick tiiick" (rising, last one slower = longer); bad: "tock tock tock tocckk" (low, falling)
  ticks: { good: [1.05, 1.12, 1.2, 0.9], bad: [0.9, 0.87, 0.84, 0.8] }
};
