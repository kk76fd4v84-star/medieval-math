// Cast bar (switch: KM_DATA.balanceTry.castBar, ?castbar=1). The timing meter stays on screen all the time, and when a
// band end moves (upgrade card, shop gear, camp armour, a foe's meter pressure at a fight's start / gone after it) its
// icon shakes, slides to the new place and leaves a trail drawn like the orange timer fill: green = helps, red = hurts.
// Looks only; no balance values here.
window.KM_DATA = window.KM_DATA || {};
KM_DATA.castBar = {
  icons: ["block", "crit", "normal"],   // icons that can move (weak always sits at the meter's end)
  minMove: 0.005,                       // smaller moves (rounding) are ignored
  shakeMs: 220, shakePx: 3,             // tiny shake before the slide
  slideMs: 650,                         // icon slides to its new place, the trail grows behind it
  holdMs: 1000,                         // the trail stays this long...
  shrinkMs: 450,                        // ...then shrinks / catches up to the icon
  inkFadeMs: 400,                       // ink (shroud) just fades in
  ease: "cubic-bezier(.2,.75,.25,1)",
  colours: { good: "#3f8a2c", bad: "#b3261e" },
  // optional sounds, silent if no file is mapped for them
  sfx: { shake: "meter_shake", good: "meter_slide_good", bad: "meter_slide_bad" }
};
