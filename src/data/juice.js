// Juice (switch juice, ?juice=1, Magnus 2026-11-08): number entry feels forged, sword-battle heavy. Read by src/engine/juice.js.
// sfx = audio_map event ids (Charlie's incoming/sfx_keys: files + volumes live in assets/audio_map.json); a list alternates.
// gain multiplies the map volume; pitch = random +- share per play. Times in ms, sizes in stage px.
window.KM_DATA = window.KM_DATA || {};
KM_DATA.juice = {
  digit: { sfx: ["key_cling"], gain: 1, pitch: 0.05, ms: 130, drop: 18, squash: 0.78, spark: true }, // lands heavy: drop + thud squash
  back:  { sfx: ["key_backspace"], gain: 1, pitch: 0.03 },                                         // soft
  enter: { sfx: ["key_enter_kosh"], gain: 1, pitch: 0.04, ms: 170, squash: 0.84, shake: 0.07 },     // right: the big ka-CHUNG + nudge
  wrong: { sfx: ["enter_wrong", "enter_miss_whoosh"], gain: 1, pitch: 0.03, ms: 200, shake: 0.1 }  // wrong: blocked ka-tunk / whoosh, in turn
};
