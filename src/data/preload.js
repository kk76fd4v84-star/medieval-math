// What the loading bar must have loaded AND decoded before the game starts (Magnus: "make sure the game is actually
// loaded with the loading bar" — the sum's + − × ÷ = must show the moment its timer starts). Read by KM.Loader / KM.Assets.
window.KM_DATA = window.KM_DATA || {};
KM_DATA.preload = {
  // images matching these join the loading bar's first set (on top of KM.Loader's title / road set)
  firstSet: ["/numerals/", "/ink/glyph", "/alphabet/", "/timing-woodcut/", "/v18/answer-frame", "/party-roles/"],
  // fight UI pictures drawn as plain <img> (not through KM.Assets): loaded + decoded with the bar
  images: ["block", "crit", "normal", "weak", "fill", "fill_good", "fill_bad", "track", "divider"].map(n => `assets/timing-woodcut/${n}.png`),
  // combat sounds warmed with the bar (missing ids are skipped); music keeps streaming as before
  sfx: ["correct", "wrong", "key_tap", "type_blip", "hit_flesh", "hit_armour", "hit_boss", "hit_party", "hit_blocked",
        "heart_crack", "heart_break", "cue_knight", "cue_healer", "cue_fire", "cue_wizard", "cue_executioner"],
  sfxWaitMs: 4000,  // never hold the bar longer than this for one sound
  // Magnus: "stuff is still not loaded". all = every image the game can show (src/config/preload_images.js, made by
  // tools/preload_capture.js) loads + decodes with the bar, nothing is held back for after it; every sound effect is
  // fetched once with the bar too (played from memory). Music keeps streaming. false = the old first set only.
  all: true,
  // Magnus 2026-11-09: the narrator and the knight popped in after the bar in Safari (it drops decoded pictures).
  // Images matching these are decoded again and drawn once off-screen right before the bar closes.
  warm: ["narrator_skeleton", "/walks/hero", "starter-knight/"],
  skip: []          // path parts left out of `all` (e.g. "/dice/roll-to-" if the dice sheets make loading too long)
};
