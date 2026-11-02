// Problem generators by level. NOT a ramp: normal stays normal all game,
// bosses/specials use "hard". Each entry: type (engine-implemented) + weight + ranges.
window.KM_DATA = window.KM_DATA || {};
KM_DATA.mathLevels = {
  normal: [
    { type: "add", weight: 3, a: [10, 49], b: [10, 49] },          // 13 + 12
    { type: "sub", weight: 3, a: [20, 99], b: [10, 19] },           // 45 - 17 (never negative)
    { type: "mul", weight: 2, a: [2, 10], b: [2, 10] },             // tables
    { type: "div", weight: 2, divisor: [2, 10], quotient: [2, 10] } // exact division
  ],
  // v12h (Magnus): the very first fights (KM_DATA.combat.starterFights) start a little simpler
  starter_easy: [
    { type: "add", weight: 1, a: [2, 9], b: [2, 9] },               // 6 + 7
    { type: "sub", weight: 1, a: [10, 19], b: [1, 9] }               // 15 - 6
  ],
  starter_hard: [
    { type: "add", weight: 2, a: [10, 29], b: [5, 19] },            // 23 + 14
    { type: "mul", weight: 1, a: [2, 5], b: [2, 5] }                // 4 x 3
  ],
  easy: [
    { type: "add", weight: 1, a: [2, 20], b: [2, 20] },
    { type: "sub", weight: 1, a: [10, 30], b: [1, 9] }
  ],
  // v11 Spell of Stupidity: the easiest sums there are (single digits, + and - only, never negative)
  stupid: [
    { type: "add", weight: 1, a: [1, 5], b: [1, 4] },
    { type: "sub", weight: 1, a: [5, 9], b: [1, 4] }
  ],
  // v12l (Magnus): keep sums enjoyable under the answer timer: solvable in the head in ~10-15 s, at most one carry, no 3-digit + 3-digit
  hard: [
    { type: "add", weight: 2, a: [25, 79], b: [15, 49] },           // 47 + 36
    { type: "mul", weight: 2, a: [11, 19], b: [2, 5] },             // 16 x 4
    { type: "mul_add", weight: 2, a: [2, 9], b: [2, 9], c: [5, 20] }, // 7 x 8 + 12
    { type: "chain", weight: 1, a: [20, 50], b: [10, 30], c: [5, 15] }, // 34 + 21 - 9
    { type: "paren", weight: 1, a: [2, 9], b: [2, 6], c: [2, 5] }    // (8 + 5) x 4
  ]
};
