// v12k (Magnus): items you buy and carry. One entry per item; every number here is a tunable (TEMP_BALANCE).
// Fire bottle: bought at the tavern, carry at most `max`. In battle it is a move: spell the word before the divider
// timer fills (`spellSecs`) and the bottle bursts into fire on EVERY living enemy (one weak-swing hit each, with the hit
// flash). Too slow: it fizzles (used up, no damage) and the enemies strike as usual. Logic: src/modes/spelling.js
// (the word challenge) + src/engine/firefx.js (the throw and fire drawings) + small hooks in src/game.js.
window.KM_DATA = window.KM_DATA || {};
KM_DATA.items = {
  fireBottle: {
    TEMP_BALANCE: true,
    name: "Fire bottle",
    key: "F",               // silent shortcut on your turn (no visible key labels)
    price: 6,               // gold at the tavern
    max: 2,                 // most you can carry
    start: 0,               // bottles at the start of a new game
    sellAt: ["tavern"],     // rest-stop types that sell it (on the tavern's fare sign)
    spellSecs: 7,           // seconds to spell the word (the divider timer)
    words: "fire",          // word list in KM_DATA.words
    damage: "weak",         // each living enemy takes one weak-swing hit
    hunters: 0,             // hunters steps on a fizzle (0 = none; a wrong sum costs 1)
    // sounds: existing SFX only (src/config/audio_map.js events). Charlie can make proper ones later.
    sfx: { letterOk: "spell_letter_ok", letterBad: "spell_letter_bad", throw: "swing_hard", fizzle: "wrong" },
    lines: {
      light: ["Spell it before the wick burns down!"],
      throw: ["Catch!", "Warm yourselves, lads!", "Fire! Lovely fire!"],
      fizzle: ["It fizzled. Damp wick.", "Pffft. Well, that was a waste."],
      buy: ["One fire bottle. Throw it AWAY from you, love.", "Fire in a bottle. Don't drink it."],
      full: "You can't carry more than two, love."
    },
    // Maggi's woodblock v2 art (assets/items/fire_bottle/NOTES.md). All drawn at artScale (source px x 0.6).
    art: {
      dir: "assets/items/fire_bottle/v2/", // Maggi's woodblock v2 (swap the look here)
      icon: "bottle_icon.png",          // 128x128, the move plaque + the tavern sign
      item: "bottle_item.png",          // 224x224, pivot = centre, spins in flight
      throwSecs: 0.5, spinDeg: 540, arcH: 260, // flight time, spin (deg/s), arc height (stage px)
      cell: [640, 368], anchor: [320, 368], belowFoot: 10, // fire patch: bottom-centre at the enemy's foot x, 10 stage px below
      spread: 0.06,                     // seconds between bursts, from the impact outward
      smash: { atlas: "atlas_fire_smash.png", frames: 3, ms: 70 },
      burst: { atlas: "atlas_fire_burst.png", frames: 4, ms: 85, hitFrame: 1 }, // damage + hit flash on burst frame 2
      linger: { atlas: "atlas_fire_linger.png", frames: 4, ms: 125, secs: 2, fadeSecs: 0.3 }
    }
  }
};
