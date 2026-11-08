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
  slideMs: 1000,                        // 2) it slides to its new place, the trail grows behind it (tick_up / tock_down play here)
  holdMs: 0,                            //    (no pause between)
  shrinkMs: 1000,                       // 3) the trail catches up to the icon
  inkFadeMs: 400,                       // ink (shroud) just fades in
  ease: "cubic-bezier(.2,.75,.25,1)",
  plainIn: ["tavern-interior"],         // Magnus: the plain divider (no cast bar) on these screens, e.g. choosing a companion
  // the trail (and the lost-window band) = the orange timer fill picture with only the orange swapped (Maggi, castbar_preview v1)
  fills: { good: "assets/timing-woodcut/fill_good.png", bad: "assets/timing-woodcut/fill_bad.png" },
  // Charlie's 1 s sounds (assets/audio/sfx, mapped in audio_map): shake at the start of the shake, tick_up / tock_down at the start of the slide
  // Magnus 2026-11-08: the icons ONLY slide in a boss shift (roar + shake + tick / tock + trail), and back when that boss
  // is gone. Any other change of the windows (companions, gear, scenes) snaps silently: KM.CastBar.motion decides.
  // Magnus: only bosses change the icons, with a roar. Other foes / NPCs (the riddle guy, ...) never move them: their
  // meter pressure is not applied while the cast bar is on. Party gear (shop buys) still moves them.
  shiftBy: ["boss", "mega"],            // stop types whose foes may shift the cast bar icons
  sfx: { shake: "meter_shake", good: "meter_tick_up", bad: "meter_tock_down", roar: "dragon_roar" }  // roar = Charlie's boss_roar_31
};
