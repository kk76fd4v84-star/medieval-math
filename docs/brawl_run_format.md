# Brawl ghost run format (v1)

One finished run (death or victory) with brawl mode on (`?brawl=1`) is saved as one JSON record in
`localStorage["knightMath.brawl.runs"]` (an array, newest last, last 20 kept). The same record is what a server
would receive later (one POST per finished run). Seed ghosts in `src/data/brawl.js` are generated into this shape too.

```json
{
  "v": 1,
  "runId": "run-k3j9…",            // the game's run id
  "player": "p-4f8a2c1d",          // random per device (localStorage "knightMath.brawl.player")
  "name": "Magnus",                // the name typed at the start
  "build": "brawl-1",              // <meta name="km-build">
  "mode": "fellowship",
  "createdAt": "2026-11-08T03:10:00.000Z",
  "party": [{ "name": "Magnus", "role": "knight", "art": "hero", "weapon": 1, "armour": 0 }],
  "gear": { "weapon": 1, "armour": 0, "helm": 0, "lantern": 0 },
  "answers": [
    { "op": "×", "a": 6, "b": 7, "level": "hard", "ms": 3250, "correct": true, "outcome": "crit" }
  ],
  "result": { "area": "village", "depth": 12, "bossesKilled": 1, "died": true }
}
```

- `op` is one of `+ − × ÷` (the sum's own signs); `a`, `b` are its first two numbers.
- `ms` is answer-bar time (pauses for animations are not counted); `null` if the sum had no timer.
- `outcome` is the timing grade (`block`, `crit`, `normal`, `weak`) for a right answer, `null` for a wrong one.
- `party[].art` is the sprite the member was drawn with; the ghost team is drawn with it (records without it: art by role,
  `KM_DATA.brawl.art`). A ghost team shows on the right, facing the party, with its hearts mirrored at the top right.
- `result.depth` is the stop index reached; `area` the chapter.

Skill (for matchmaking) = share of right answers / median seconds of the right ones. The pool is ranked by it,
easiest first; each ghost beaten moves the player one step up (`localStorage["knightMath.brawl.rank"]`).
