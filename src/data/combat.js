// v7 turn-based combat + pursuit (GAME_DESIGN.txt "TURN-BASED COMBAT", "HUNTERS / DEATH", "PARTY / RECRUITMENT").
// !!! TEMPORARY BALANCE VALUES — provisional, clearly labelled, to be tuned in playtests. !!!
window.KM_DATA = window.KM_DATA || {};
KM_DATA.combat = {
  TEMP_BALANCE: true,
  // v12c (Magnus): the divider under the ground fills while a battle sum waits; full = the enemies strike as on a wrong
  // answer, then the next sum resets it. Seconds per battle sum (0 = off). Tests can open the game with ?notimer.
  answerSecs: 35, // v12h (Magnus): 35 s
  // v12h (Magnus): the very first normal fights use simpler sums (weak -> starter_easy, hard -> starter_hard)
  starterFights: 2,
  answerTickLast: 3, answerTickSfx: "type_blip",
  answerPauseMax: 3, // v12r: the timer holds for strikes / toasts at most this many seconds in a row, then runs anyway (never stuck)
  // One turn = choose an action, solve its problem, then a SURVIVING enemy acts. Dead enemies never retaliate.
  // A failed problem: the action does nothing, hunters advance ONE block, then the normal enemy turn (no extra hit).
  actions: {
    weak: { key: "1", label: "Weak swing", level: "easy" },   // v11b label = hit strength (Magnus)      // dmg = weakBase + floor(power / weakPer)
    hard: { key: "2", label: "Hard swing", level: "hard" },      // dmg = weak dmg * hardMul + hardAdd
    heal: { key: "3", label: "heal", levels: ["easy", "normal", "hard"] } // random question; uses the turn
  },
  weakBase: 3, weakPer: 4,          // party power 2 -> 3 dmg (2 weak hits on a 6 HP goblin), power 8 -> 5
  hardMul: 2, hardAdd: 1,           // power 2 -> 7 dmg (clear advantage; bosses still need several)
  armourBlockPer: 0.08, armourBlockMax: 0.4, // v11b TEMP_BALANCE: chance per party armour level that an enemy hit is turned aside
  healHearts: 2, healsPerFight: 2,  // heal charges per fight: no infinite safe stall (enemy still gets its turn)
  // enemy stats are HIDDEN until the party commits to the fight (then the creature comes closer and is revealed)
  // v11b TEMP_BALANCE for the heart rule (2 hearts per member; 2 lost in one battle = a member dies; hearts refill after
  // a won fight): every enemy hits for 1, and HP is set so correct play costs at most ~1 heart per fight
  // (goblin 6 = 2 weak or 1 hard, black knight 7 = 1 hard, skeleton 12 = 2 hard). Was: black knight 9, skeleton 18/2, dragon atk 2.
  enemies: {
    goblin:          { hp: 6,  atk: 1 },
    killer_rabbit:   { hp: 5,  atk: 1 },
    black_knight:    { hp: 7,  atk: 1 },
    skeleton_knight: { hp: 12, atk: 1 },
    toad:            { hp: 7,  atk: 1 },   // v19 TEMP_BALANCE (= black knight: one hard swing)
    ogre:            { hp: 7,  atk: 1 },   // v19 TEMP_BALANCE
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
