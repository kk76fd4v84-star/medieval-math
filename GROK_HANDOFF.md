# Grok handoff — A Hard Day’s Math / Medieval Math

Current snapshot: **7 November 2026**, through `woodcut-timer-46`.
This is the current-state entry point. `HANDOFF.md`, `GAME_DESIGN.txt` and much of
`README.md` are chronological records; older entries contain superseded rules.
Preserve the working game and make requested changes incrementally.

## Start here

1. Read this document, `AGENTS.md` and `CLAUDE.md`.
2. Before art or rendering work, read `art-direction/STYLE_GUIDE.md` and **open
   `art-direction/approved-concept-eyes.png`**. Compare the result in the game at
   normal display size, not just on an enlarged sprite sheet.
3. Serve this folder with `python3 -m http.server 8801`. Open
   `http://localhost:8801/?mode=fellowship`. Use an available alternate port if
   a server is already running; localhost saves belong to their original port.
4. Read `VERIFICATION.md` for checks performed on this export. Use separate browser
   profiles and muted audio for tests. Never clear the designer’s browser storage.
5. Use `GITHUB_PUBLISH.md` when updating the existing GitHub repository. This export
   is not proof of a GitHub push; verify the remote and its current history first.

The game is plain HTML/CSS/JavaScript with Canvas, a 1600×900 stage and no build
step. `index.html` loads ordered scripts using the `KM` namespace. Serve it over
HTTP rather than opening it with `file://`. No API key or backend is needed to play.

## Non-negotiable design rule: power, difficulty and risk

**Weak attacks are easier and weaker. Strong attacks are harder and stronger.
Powerful magic and fire are risky. Buffs and upgrades may make execution easier;
never silently increase difficulty to cancel those benefits.**

Show damage, difficulty and failure risk before commitment. A powerful found sword
or staff can demand a formidable challenge; future blacksmith refinement should
make it manageable for later biomes. That refinement/loot progression is approved
design, **not implemented**. Fellowship’s per-caster backlash and The Knight’s
backfires exist. Village Idiot fire-failure refinements remain future work.

## Modes and current combat

| Mode | URL | Behaviour |
| --- | --- | --- |
| The Village Idiot | `?mode=math` | Large action cards; select an attack, then solve maths. |
| The Knight | `?mode=knight` | Party card deck; click or drag a card toward a foe, then solve maths. Two cards per member plus combinations/items; gear upgrades cards. |
| The Fellowship | `?mode=fellowship` | Straight to maths; success launches every living member’s role attack. No combat-choice panel. Fixed 2× enemy HP. |

**The Bard is retired.** Do not bring its menu back or reuse its archived scores
as another mode. Keep the three active modes’ saves and leaderboards separate.

### Timing: current rules, not the older crit-and-stun design

Base windows before gear, party and enemy modifiers:

| Answer timing | Damage | Defence |
| --- | --- | --- |
| Through 25% | Normal | Block the response |
| After block, strictly before 50% | 2× critical | Enemy may counter |
| 50% through 75% | Normal | Enemy may counter |
| After 75%, including a full bar | Half | Enemy may counter |

Block and critical are **distinct rewards**, not cumulative. Normally a full timer
waits for the answer instead of automatically attacking. Wrong answers trigger
failure and hunter pressure. Forgiving squirrels/rabbits allow a block on any
correct answer. Deadline enemies such as dogs/bosses can strike once when the
timer fills; the question remains answerable and must not double-counter.

- Weapon contribution moves crit later; held armour moves block later. See
  `src/engine/timing.js` and `src/data/combat.js` for exact inputs, floors and caps.
- Each living companion moves both endpoints back **5 percentage points**, at most
  15. Death releases that pressure **and removes that owner’s gear contribution**.
- Enemy pressure is fixed by its pattern. Boss entrances show the roar/pushback
  and red lost-window bands. Do not scale pressure in response to purchased gear.
- Freeze windows for each question. Changes affect the next question.
- Icons, fill and answer pin share one axis. Keep the hit-position marker.
- `?notimer` is a debug option, not the normal game difficulty.

The latest global timer is the **thin woodcut orange rail above the separate
ornamental divider**, with a shield, horizontal flaming sword, ordinary sword and
twig. Assets are in `assets/timing-woodcut/`. Preserve their proportions and EN/JA
tooltips. Do not restore a broad orange glow or generic vertical substitute icons.

### Party, health and roles

- Maximum four members including the player. **Every member has two hearts**.
- Shared wounds carry between fights; victory does not refill health. Companions
  die before the player. Healing can prevent death by reducing unhealed damage.
- Armour absorbs damage first. Silver hearts overlay red hearts, filled from the
  left; they are not an extra HUD row. Overflow damage reaches health.
- Each owner can have **weapon +3 and held armour 3** at most. Consumed armour can
  be replenished. Gear follows its owner and leaves with death or dismissal.
- Extra matching companions strengthen attacks by 50% each. Priests instead have
  utility progression: one unlocks heal/sacrifice, two resurrect, three easier
  priest maths. Preserve existing limited healing rather than stacking huge heals.
- Frank is the orange-hooded mad priest. Timmy has a chainmail coif, torch/bottles
  and word-typing attacks. Executioner uses multiplication and double damage at
  half health; normal execute choices are disabled when the target is healthier.
- Dark Wizard unlocks after three solved riddles. Keep his taped eyeball hat and
  the one-eyed riddler’s special recognition/revenge encounter.

Fellowship role volleys: knights hit the first two foes; wizard/fire hit all;
priests heal when wounded (two shared battle heals), otherwise use their staff;
executioners double damage at half HP. A wrong combat answer deals **one shared
party damage per living wizard/firestarter**, armour first. Multiple casters stack
the risk. Use each role’s actual effects and the companion failure reaction.

New runs start as the straight-haired peasant with ear-covering cap, orange tunic
and stick, progressing through equipment. Keep the approved previous knight and
walk animation. The experimental replacement humanoid/bone setup was rejected;
do not revive it or claim all artwork is a finished production rig.

## Economy, rest stops and progression

- Currency is **coppers**, starting with five. Animals do not drop money. Eligible
  corpse loot is collected when walking over it, after the attack damage feedback.
- Economy was reduced to make roughly two worthwhile purchases per shop a choice;
  this is a balance target, not a guarantee of income. Preserve existing saved money.
- Shop is **Scrolls and Stuff**. Use existing sword/armour artwork and large item
  cards. Consumables enter inventory; gear opens an owner picker. Gear purchases
  play the blacksmith effects.
- Camp is walked into naturally. Making camp restores full HP and offers one
  recruit, with no upgrades. Failed recruitment walks away; no dice retry.
- Tavern: full-sized roadside facade, walk-in/out continuity, first-person table,
  seated NPCs with distinct poses and elbows resting on the table. Named individual
  choices. At most one successful recruit per visit; a failed candidate leaves.
- At full party, solve recruitment then choose a companion to replace, never the
  player. Gear leaves with its owner and wounds remain. Seeded 1-in-3 dismissal
  hostility produces a fight outside with that person and no loot.
- Mead eases maths for one battle; stew heals one heart. Scroll of Stupidity
  affects only the **next one maths question**, not several rounds. Wrong/abandoned
  questions consume it; simply waiting at full timer does not. Keep existing
  restrictions during mead.
- Keep real riddles and the one-eyed black-robed riddler’s original “hihuuu” sound.
  He has several peeking placements/poses. Do not replace riddles with combat.
- Companion outdoor deaths leave spaced cross-grave sprites on different depths;
  not generic translucent tombstone shapes and not graves for every enemy.

## World: delivered versus proposed

| Area | Current status |
| --- | --- |
| Countryside / The Village Idiot | Playable starting chapter. Castle and meadows first, brief villages, camps and sparse trees; do not rush into canyons. |
| The Hollow Wood | Playable second chapter carrying party, gear, wounds and score. Graveyard, zombies, skeletons, spiders, roots, Parish Collector boss and optional distant Bell Beneath. Collector must have **no belly/shoulder faces**. Balance is provisional; some monsters use static cutout/lunge motion. |
| Tomb / Crypt | Joined to the campaign (branch `crypt-and-balance`): finishing the Hollow Wood opens a "The Crypt" gate; entering carries party, gear, wounds and score into the tomb level (still the three placeholder encounters: two Tomb Sentries and The Last Watch). Order lives in `src/data/chapters.js`. Winning it ends the run with the normal Victory screen. The standalone `?preview=tomb` test is unchanged. New crypt enemies and boss still to design. |
| Moonlit beach | Approved concept, intended after the tomb. **Not playable or separated into production layers.** |
| Swamp, including walk-tunnel version | Concepts only. Campaign position and implementation are undecided. Its timer artwork was adopted globally. |
| Sketchbook | Isolated experimental biome using Magnus’s scanned drawings. Not the replacement main art direction. |

Tomb test: `?debug&biome=tomb&preview=tomb&mode=fellowship`.
It uses three hollow-section variants (stone, burial niches, roots), staggered
offsets/bends, perspective growth and black-to-colour depth lighting. Enemies use
the same depth/light, not a separate overlay. There is no opaque far-end wall.

Deaths remove the portrait and play three held rear-view fall poses near the
camera. Lower bodies go below the scene edge; the latest placement is smaller and
foreshortened along the floor. Fresh bodies persist for the run. Future runs show
prone skeletons at those positions; resurrection removes that member’s marker.
Four test outfits have fall art. More companions/boss art still need production
coverage. The preview must not write normal campaign/profile/leaderboard progress;
its dedicated memorial storage is intentional.

Concepts: `art-direction/concepts/beach-concept-v1.png`,
`swamp-concept-v1.png`, `swamp-tunnel-concept-v1.png`. Their JSON files record
generation provenance. A concept approval is not approval of every later asset.

## Visual and audio guardrails

- Worn black medieval woodcut, carved hatching, warm aged parchment, restrained
  dirty orange. Preserve the approved knight identity and a coherent line weight.
- Strict palette quantization was withdrawn on 5 November. Use reference colour
  families and per-asset calibration, not blanket yellow tint or arbitrary colours.
- Small eye shadows with tiny glints where eyes exist. The riddler’s missing socket
  is intentional. Wizard should be an odd, slightly friendly human, not a demon.
- Complete solid sprite interiors; no see-through houses/trees, grey matte halos,
  chopped foliage at strip ends or artificial opacity fade disguising bad edges.
  Taper drawn terrain contours and overlap intelligently; retain open space/depth.
- Game above, maths below the ground divider. Large square action cards for Village
  Idiot/shops/camp; simpler framed riddles/tavern dialogue remain exceptions.
- Speech bubbles face the speaking side, sit centrally without covering faces and
  retain their shape. Do not stretch tails to simulate a different layout.
- **Music starts off per page.** User can opt in. Immediate mute, hidden-tab pause
  and cross-tab silence matter. Never enable sound during automated testing.
- World tracks shuffle without immediate repetition. `src/data/music.js` maps the
  supplied graveyard track, two tomb exploration tracks, regular battle and two
  boss tracks. Exploration resumes after battle; preserve the chapter routing.
- Voice acting is removed except the requested riddler greeting. Keep other SFX.
- English/Japanese are selectable. Adapted Japanese riddles and romaji typing with
  kana hints exist. Test both languages for new strings; do not claim native-speaker
  review or translate internal IDs/asset filenames.

## Score and persistent data

Answer score uses fixed elapsed fractions even when combat icons move:
before25% =4; before50% =3; before75% =2; otherwise1.
Riddle: before50% =2, otherwise1. Scroll-assisted correct maths subtracts2
(negative results allowed). End bonus is2 per surviving member, including player.
Keep the animated reason-by-reason tally and local persistent leaderboard.

| Storage | Purpose |
| --- | --- |
| `knightMath.save`, `.save.knight`, `.save.fellowship` | Separate active-mode runs, schema7 |
| `knightMath.profile` | Profile, unlocks, outdoor graves, schema5 |
| `knightMath.leaderboard.v1` | Local mode-filtered leaderboard, schema1 |
| `knightMath.tomb.memorials.v1` | Persistent tomb skeletons |

Preserve backup/previous records and archived Bard data. No player save data is
included in this source export. LocalStorage is origin-specific: localhost and
GitHub Pages **do not automatically share progress**. Do not clear storage to
“fix” a migration. Keep stable IDs and provide deliberate schema migration for changes.

## Code map and safe continuation

| Concern | Main location |
| --- | --- |
| Game state, input, encounters, rendering integration | `src/game.js` |
| Balance, enemies, questions, roles, music | `src/data/` |
| Timing windows/rail | `src/engine/timing.js`, `timing-bar.js` |
| Card/Fellowship systems | `src/modes/knight.js`, `knight-hand.js`, `fellowship.js` |
| Saves, tally, leaderboard | `src/engine/save.js`, `score.js`, `score-banner.js`, `leaderboard.js` |
| Party utility, recruitment | `src/engine/party-abilities.js`, `recruitment.js` |
| Roads/rest/POV tavern | `src/engine/road.js`, `road-camp.js`, `restview.js`, `tavern-pov.js` |
| Scenery and Hollow Wood | `src/engine/modular-scenery.js`, `scenery.js`, `hollowwood.js` |
| Tomb projection, bodies and memorials | `src/engine/tomb*.js` |
| Art metadata/palette/anchors | `src/config/`; corresponding sprites in `assets/` |
| Translation | `src/engine/i18n.js` |

`scenery-review.html` and `art-direction/index.html` are review pages, not the
normal starting game. Debug URLs should never become the default launch URL.

Some import scripts refer to the original designer’s absolute file paths or old
export locations. They are provenance/utilities, not startup requirements; inspect
them before running. Some legacy tests target retired features. Use current
focused checks and report failures honestly rather than deleting assertions.

Before shipping: validate JavaScript, check references/case-sensitive asset paths,
run relevant tests, inspect the changed scene at normal size, keep audio muted,
and refresh `src/config/asset_sizes.js` using `tools/asset_sizes.py` when assets change.
Keep current art and historical source files; do not blindly regenerate everything.

Suggested next work (only when requested): connect the approved tomb test to the
end of Hollow Wood, then build the beach from its approved concept; tune combat
through playtests; extend asset/animation coverage. Do not represent these as done.

## Balance switches (all off by default)

`src/data/balance_try.js` holds five switches and their tuning numbers; `src/engine/balance-try.js` reads them.
Try one for a run with the page address (start a **new** run after changing `halfhearts`):

- `?curve=1`: countryside packs take turns, Fellowship enemy health ramps per battle (x2.0 rising to x2.6), bosses hit for 1 and roar for 2 every 3rd enemy turn.
- `?halfhearts=1`: hearts are counted in halves; ordinary hits take half a heart, boss roars a full one; heals scale to match.
- `?camparmour=1`: making camp mends bought armour back to its best level.
- `?whoacts=1`: Fellowship sums belong to one member (+ knights, − healers, × Timmy, Dark Wizard, Executioner), weighted by the fight (1–2 enemies, 3+, boss, party hurt); that member's strike counts double and Charlie's class cue plays.
- Combine them: `?curve=1&halfhearts=1&camparmour=1&whoacts=1`. Flip a switch to `true` in the data file to make it the default.

Charlie's heart, crypt and class-cue sounds are in `assets/audio/sfx/` and mapped in `assets/audio_map.json`.
