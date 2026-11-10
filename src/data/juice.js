// Juice (switch juice, ?juice=1, Magnus 2026-11-08): number entry feels forged, heavy metal. Read by src/engine/juice.js.
// Every key has its own sound, played the instant the key goes down (Web Audio, decoded at load).
// sounds: sound id -> file in assets/audio/sfx/ (no extension; .ogg, or .mp3 where the browser has no Vorbis) + volume.
// A new set: copy the files into assets/audio/sfx/ and edit file / vol here. pitch = random +- share per hit; ms in ms, sizes in px.
window.KM_DATA = window.KM_DATA || {};
KM_DATA.juice = {
  sounds: { // Charlie v6 (incoming/sfx_keys README): each digit one step of a minor scale, hammer + chug
    name_ring_1: { file: "name_ring_1", vol: 0.7 }, name_ring_2: { file: "name_ring_2", vol: 0.7 }, name_ring_3: { file: "name_ring_3", vol: 0.7 },
    name_ring_4: { file: "name_ring_4", vol: 0.7 }, name_ring_5: { file: "name_ring_5", vol: 0.7 }, // name letters: hammer on anvil, heavy (Magnus: "anvil, metal hammer, heavy metal")
    key_digit_0: { file: "key_digit_0", vol: 0.8 }, key_digit_1: { file: "key_digit_1", vol: 0.8 },
    key_digit_2: { file: "key_digit_2", vol: 0.8 }, key_digit_3: { file: "key_digit_3", vol: 0.8 },
    key_digit_4: { file: "key_digit_4", vol: 0.8 }, key_digit_5: { file: "key_digit_5", vol: 0.8 },
    key_digit_6: { file: "key_digit_6", vol: 0.8 }, key_digit_7: { file: "key_digit_7", vol: 0.8 },
    key_digit_8: { file: "key_digit_8", vol: 0.8 }, key_digit_9: { file: "key_digit_9", vol: 0.8 },
    key_delete:        { file: "key_delete",        vol: 0.6 },  // blade dragged back across metal
    key_enter_heavy:   { file: "key_enter_heavy",   vol: 1.0 },  // three hammers + ringing power chord
    enter_wrong:       { file: "enter_wrong",       vol: 0.8 },
    enter_miss_whoosh: { file: "enter_miss_whoosh", vol: 0.7 }
  },
  digits: ["key_digit_0", "key_digit_1", "key_digit_2", "key_digit_3", "key_digit_4", "key_digit_5", "key_digit_6", "key_digit_7", "key_digit_8", "key_digit_9"], // key 0..9
  text:  { pitch: 0.03, back: "key_delete", enter: "key_enter_heavy",                  // name entry: a character plays letters[char code % n] (A = a)
           letters: null, // Magnus 2026-11-09: name letters use the same sounds as typing math (the digit sounds)
           rate: [0.94, 1.12], spread: 11 },  // + each letter its own fixed pitch: A..Z step through rate by (index * spread) % 26, so neighbours differ
  name:  { hot: "#ff3d0f", cooled: "#2a1d12", glow: "#ff8a2a", glowPx: 18, coolSecs: 1.1 }, // each typed name letter: fire red-orange, cools to black ink (always on)
  digit: { pitch: 0.03, ms: 130, drop: 18, squash: 0.78, spark: true },                 // lands heavy: drop + thud squash
  back:  { sfx: ["key_delete"], pitch: 0.03 },                                           // delete
  enter: { sfx: ["key_enter_heavy"], pitch: 0.02, ms: 170, squash: 0.84, shake: 0.07 },  // right: the very heavy Enter + nudge
  wrong: { sfx: ["enter_wrong", "enter_miss_whoosh"], pitch: 0.03, ms: 200, shake: 0.1 } // wrong: blocked / whoosh, in turn
};
