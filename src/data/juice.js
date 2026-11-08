// Juice (switch juice, ?juice=1, Magnus 2026-11-08): number entry feels forged, sword-battle heavy. Read by src/engine/juice.js.
// sfx = audio_map event ids (Charlie's incoming/sfx_keys v3 files live in assets/audio_map.json at volume 1); a list alternates.
// vol = each sound's volume (tune here); gain = a whole row's extra multiplier; pitch = random +- share per play. Times in ms, sizes in stage px.
window.KM_DATA = window.KM_DATA || {};
KM_DATA.juice = {
  vol: { key_cling: 0.8, key_enter_kosh: 1.0, enter_wrong: 0.8, enter_miss_whoosh: 0.8, key_backspace: 0.35 }, // Magnus/Charlie v3
  digit: { sfx: ["key_cling"], gain: 1, pitch: 0.05, ms: 130, drop: 18, squash: 0.78, spark: true }, // lands heavy: drop + thud squash
  back:  { sfx: ["key_backspace"], gain: 1, pitch: 0.03 },                                         // soft
  enter: { sfx: ["key_enter_kosh"], gain: 1, pitch: 0.04, ms: 170, squash: 0.84, shake: 0.07 },     // right: the big ka-CHUNG + nudge
  wrong: { sfx: ["enter_wrong", "enter_miss_whoosh"], gain: 1, pitch: 0.03, ms: 200, shake: 0.1 }  // wrong: blocked ka-tunk / whoosh, in turn
};
