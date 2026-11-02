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
    // sounds: events in assets/audio_map.json (Charlie's ElevenLabs set, assets/audio/sfx/NOTES_fire.md). The fire sounds
    // are cued by KM.FireFx on the art's own clock: throw on release, smash on impact, ignite at burst frame 1 (its peak
    // lands on burst frame 2 = the hit), a yelp per enemy hit, crackle loop while it lingers, fizzle as the fire fades.
    sfx: {
      letterOk: "spell_letter_ok", letterBad: "spell_letter_bad",
      throw: "fire_throw", smash: "fire_smash", ignite: "fire_ignite", burn: "goblin_burn",
      crackle: "fire_crackle", fadeOut: "fire_fizzle", // the lingering loop, and the sound as the fire dies
      fizzle: "fire_fizzle",                             // too slow: the bottle fizzles
      burnStagger: 0.06,        // seconds between the enemies' yelps
      burnGainAfter2: 0.7,      // the 3rd and later yelps are quieter
      crackleFadeSecs: 0.3      // the crackle's fade-out (with the fire's fade)
    },
    // v12m (Magnus): how the word's letters look. Maggi's ink letters are tinted in code (source-atop) to these colours.
    // Not typed yet = grey. A right letter flashes hot with a warm glow, then cools to black ink like forged metal.
    // A wrong key: the current letter shakes and stays grey (no red, no Backspace; just type the right one next).
    letters: {
      grey: "#8a8580",      // every letter not typed yet
      hot: "#ff7a1a",       // a right letter, the moment it is typed
      cooled: "#1c140e",    // ... and what it cools to (black ink)
      glow: "#ffb04a",      // the warm glow around a hot letter
      glowPx: 14,           // glow blur radius (stage px) at its brightest
      coolSecs: 0.7,        // hot -> black
      shakeSecs: 0.32,      // the wrong-key shake
      shakePx: 9            // how far it shakes (stage px)
    },
    lines: {
      light: ["Spell it before the wick burns down!"],
      throw: ["Catch!", "Warm yourselves, lads!", "Fire! Lovely fire!"],
      fizzle: ["It fizzled. Damp wick.", "Pffft. Well, that was a waste."],
      buy: ["One fire bottle. Throw it AWAY from you, love.", "Fire in a bottle. Don't drink it."],
      full: "You can't carry more than two, love."
    },
    // Maggi's v4 woodcut art (assets/items/fire_bottle/v4/NOTES.md). All drawn at artScale (source px x 0.6).
    art: {
      dir: "assets/items/fire_bottle/v4/", // Maggi's v4 woodcut, washed-out ochre #D9B46A (Magnus approved; swap the look here)
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
