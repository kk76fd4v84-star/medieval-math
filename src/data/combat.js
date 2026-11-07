// v7 turn-based combat + pursuit (GAME_DESIGN.txt "TURN-BASED COMBAT", "HUNTERS / DEATH", "PARTY / RECRUITMENT").
// !!! TEMPORARY BALANCE VALUES — provisional, clearly labelled, to be tuned in playtests. !!!
window.KM_DATA = window.KM_DATA || {};
KM_DATA.combat = {
  TEMP_BALANCE: true,
  // Every maths path is timed by Progression.seconds; this is a defensive fallback.
  // Safe hit first; critical hits occupy the next, exposed band. Both thresholds remain upgradeable.
  timing: { critBefore: .5, blockThrough: .25, normalThrough: .75,
    weaponStep: .05, armourStep: .05, critCap: .7, blockCap: .45,
    companionStep: .05, companionCap: 3, // living companions only; deaths release the pressure
    critMultiplier: 2, lateMultiplier: .5, riddleGoldMultiplier: 2,
    riddleSecs: 30,
    // answer seconds per sum (KM.Progression.seconds): [below, secs] by the largest number, first match wins
    seconds: { manyNumbers: 24, div: 16,
      mul: [[6, 12], [11, 16]], mulElse: 20,
      add: [[10, 8], [20, 10], [40, 12], [70, 16]], addElse: 18 } }, // provisional reading time; riddles award coins, never attack damage
  // Fixed enemy traits: never scale pressure to the player's purchases.
  patterns: {
    rabid_squirrel: { forgiving: true }, killer_rabbit: { forgiving: true },
    rabid_dog: { deadline: true },
    ogre: { block: .05 }, black_knight: { crit: .05, block: .10, roar: true },
    skeleton_knight: { crit: .05, block: .10, roar: true },
    dragon: { crit: .10, block: .15, roar: true, deadline: true },
    turd_dragon: { crit: .05, block: .10, roar: true, deadline: true }
  },
  // Small purses, not a windfall per kill. Animals still pay nothing. Riddle bonuses stay earned.
  // Savings should buy about two items at the next shop, not every upgrade for four people.
  economy: { purses: { rabid_villager: 3, goblin: 3, ogre: 3,
    skeleton_knight: 4, black_knight: 4, turd_dragon: 2, dragon: 8 }, fallbackMultiplier: .3 },
  answerSecs: 24, // fallback only; Progression times every generated problem by its complexity.
  // v12h (Magnus): the very first normal fights use simpler sums (weak -> starter_easy, hard -> starter_hard)
  starterFights: 2,
  answerTickLast: 3, answerTickSfx: "type_blip",
  answerPauseMax: 3, // v12r: the timer holds for strikes / toasts at most this many seconds in a row, then runs anyway (never stuck)
  // One turn = choose an action, solve its problem, then a SURVIVING enemy acts. Dead enemies never retaliate.
  // The full timer waits for a submission. A wrong submitted answer advances hunters once, then the enemy turn.
  actions: {
    weak: { key: "1", label: "Weak swing", level: "easy" },   // v11b label = hit strength (Magnus)      // dmg = weakBase + floor(power / weakPer)
    hard: { key: "2", label: "Hard swing", level: "hard" },      // dmg = weak dmg * hardMul + hardAdd
    resurrect: {key:"5",label:"Resurrect",level:"hard"},
    execute: {key:"4",label:"Execute",level:"execution"},
    heal: { key: "3", label: "heal", levels: ["easy", "normal", "hard"] } // random question; uses the turn
  },
  weakBase: 3, weakPer: 4,          // party power 2 -> 3 dmg (2 weak hits on a 6 HP goblin), power 8 -> 5
  hardMul: 2, hardAdd: 1,           // power 2 -> 7 dmg (clear advantage; bosses still need several)
  armourBlockPer: 0.08, armourBlockMax: 0.4, // v11b TEMP_BALANCE: chance per party armour level that an enemy hit is turned aside
  healHearts: 2, healsPerFight: 2,  // heal charges per fight: no infinite safe stall (enemy still gets its turn)
  // enemy stats are HIDDEN until the party commits to the fight (then the creature comes closer and is revealed)
  // First progression playtest. All ordinary hits cost 1; wounds persist across victories.
  enemies: {
    rabid_squirrel:  { hp: 3, atk: 1 },
    rabid_dog:       { hp: 4, atk: 1 },
    rabid_villager:  { hp: 7, atk: 1 },
    goblin:          { hp: 8,  atk: 1 },
    killer_rabbit:   { hp: 5,  atk: 1 },
    black_knight:    { hp: 14,  atk: 1 },
    skeleton_knight: { hp: 12, atk: 1 },
    toad:            { hp: 9,  atk: 1 },   // v19 TEMP_BALANCE (= black knight: one hard swing)
    ogre:            { hp: 12,  atk: 1 },   // v19 TEMP_BALANCE
    turd_dragon:     { hp: 10, atk: 1 },
    dragon:          { hp: 30, atk: 1 }
  },
  // D20 (replaces the old d6): dragon = party power + d20 (+ sacrifice bonuses) must meet its power
  d20: { dragonPower: 22, sacrificeBonus: 3 },
  // the king's hunters: a dotted minimap; every failed problem moves them one block closer
  hunters: { blocks: 12, avoidCost: 1, onCapture: "gameover" }, // PROVISIONAL capture rule (GAME_DESIGN: "TBD")
  // Magnus: ordinary fights are mandatory (no skip / flee / avoid). The only optional fights are GAME_DESIGN's special
  // encounters (a creature seen as distant scenery; Frank wants to investigate the turd dragon: agree = fight,
  // disagree = restraint maths). Declining there is framed as the safe choice. Bosses block the road.
  avoidable: { math: false, special: true, boss: false, mega: false },
  recruitLevel: "normal",
  // TEMP_BALANCE multi-enemy fights (Magnus: "not early but after a while, swords hit 2 enemies at a time"). GAME_DESIGN
  // has no group rules. Only ordinary "math" fights (never the boss / mega boss / Frank's dragon). A stop's chance of a
  // group depends on how far down the road it is (leagues = road px / world.pxPerLeague): none before fromLeague,
  // then chance, from lateLeague lateChance; a group is 2 enemies, or 3 with chance3 (only from lateLeague).
  // The stop's own enemy is in front; the others come from pool. Gold x (1 + goldPerExtra per extra enemy).
  groups: { fromLeague: 5, chance: 0.5, lateLeague: 8, lateChance: 0.8, chance3: 0.5, pool: ["goblin", "killer_rabbit"], gap: 40, swordHits: 2, goldPerExtra: 0.5, TEMP_BALANCE: true }
};
