// The road. One continuous world: each stop sits `gap` px further along the road than the
// previous one (scaled by world.gapScale). Rest stops (tavern/campsite/shop) are inserted
// automatically after battles, see reststops.js.
// types: math | boss | mega | riddle | recruit
//   math/boss: hits = correct answers needed, level = mathLevels key, dmg = hearts lost per wrong
//   recruit: a random scruffy knight in a ditch joins after one easy sum
//   mega: turn combat OR a D20 roll (party power + d20 vs KM_DATA.combat.d20.dragonPower)
//   special "frank": Frank the priest wants to investigate a distant turd dragon (agree = fight, disagree = restraint maths)
// v7: enemy HP / attack live in src/data/combat.js (TEMP balance). `hits`/`dmg` below are legacy (unused by turn combat).
window.KM_DATA = window.KM_DATA || {};
KM_DATA.encounters = [
  { type: "math",    enemy: "goblin",          level: "normal", hits: 1, gold: 6,  dmg: 1, gap: 1400, walksIn: true },
  { type: "riddle",  npc: "bridgekeeper",      gold: 4, dmg: 1, gap: 1400 },
  { type: "math",    enemy: "killer_rabbit",   level: "normal", hits: 2, gold: 9,  dmg: 1, gap: 1400, walksIn: true },
  { type: "recruit", level: "easy",            gap: 1300 },
  { type: "boss",    enemy: "skeleton_knight", level: "hard",   hits: 3, gold: 20, dmg: 2, gap: 1600, walksIn: true, label: "MID-BOSS" },
  { type: "special", id: "frank", npc: "frank", enemy: "turd_dragon", level: "normal", gold: 8, gap: 1500 },
  { type: "riddle",  npc: "enchanter",         gold: 4, dmg: 1, gap: 1400 },
  { type: "math",    enemy: "black_knight",    level: "normal", hits: 2, gold: 10, dmg: 1, gap: 1400 },
  { type: "riddle",  npc: "hermit",            gold: 4, dmg: 1, gap: 1400 },
  { type: "math",    enemy: "goblin",          level: "normal", hits: 2, gold: 10, dmg: 1, gap: 1300, walksIn: true },
  { type: "math",    enemy: "toad",            level: "normal", hits: 2, gold: 10, dmg: 1, gap: 1500, walksIn: true }, // v19 TEMP placement: large creature (v6/v8 toad eating sheet)
  { type: "math",    enemy: "ogre",            level: "normal", hits: 2, gold: 12, dmg: 1, gap: 1500, walksIn: true }, // v19 TEMP placement: large creature (v6/v8 ogre eating sheet)
  { type: "mega",    enemy: "dragon", power: 22, level: "hard", hits: 3, gold: 50, dmg: 2, diceDmg: 2, sacrificeBonus: 3, gap: 1900, walksIn: true, label: "MEGA BOSS" }
];
