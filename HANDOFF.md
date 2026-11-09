# Medieval Math: handoff (9 November 2026, build brawl-30)

Read this first. It is the current state of the game. CLAUDE.md, GROK_HANDOFF.md and docs/HANDOFF_HISTORY.md are older history and may be out of date.

## What it is
Medieval Math is Magnus Jansson's math game. A knight and a fellowship walk a road and fight by answering sums against timing meters. It is plain HTML, JS and canvas, with no build step and no framework.
- Active branch: `brawl-mode`. GitHub Pages serves the `play` branch: https://kk76fd4v84-star.github.io/medieval-math/
- Deploy: commit to `brawl-mode`, run `git push origin brawl-mode`, then `git push -f origin brawl-mode:play`. Force-pushing `play` is fine; never force-push any other branch. Bump `?v=brawl-N` on every changed script in `index.html`, plus `<meta name="km-build">`, which is shown on the loading screen.
- Run it locally: `python3 -m http.server 8798` in the repo root. Sounds and art packs need http, not file://.
- Full test link (all switches on): `index.html?mode=fellowship&curve=1&halfhearts=1&camparmour=1&whoacts=1&cards=1&gradual=1&meterpressure=1&castbar=1&knightstart=1&chestcards=1&toughfoes=1&brawl=1&pausemenu=1&juice=1&recruitcode=1&partylevels=1&cardsv2=1&traps=1`


### brawl-32 (Magnus 2026-11-09)
- Terrify tip (`tutorial.tips.scared`) now uses Magnus's text and `assets/ui/tips/v4/art_terrify.png`. It shows first; closing it plays the roar (`roar`/`roarGain`) plus a shake, and the sum's meter then plays the icon shake and red slide back.
- Party tip (`art_party.png`) now shows in the tavern before your first recruit (`ask()`), not after.
- Gear tip (`art_gear.png`) now shows as you first reach a scroll stall or shop (`startRest()`), not after.
- `tipDialog` renders `t.art` as `<img class="tut-art">` (css in style.css).
- OPEN: small icon on each tavern recruit card for what the member affects (striking/crit, armour/block). Not built yet; reuse the crit/block icons from `assets/timing-woodcut/` in the recruit card render. Also verify all three tips by playing (only a smoke test was run).

## URL switches (all default off; `?name=1` turns one on)
- `mode=fellowship`: Fellowship mode, the main focus of the game.
- `curve`: smoother difficulty. Packs take turns, Fellowship enemy health ramps up, and bosses hit hard only when they roar.
- `halfhearts`: ordinary hits take half a heart, boss roar blows a full heart, and heals scale to match.
- `camparmour`: resting at camp mends bought armour.
- `whoacts`: who in the party acts on each answer.
- `cards`: upgrade cards (`src/data/upgrade_cards.js`).
- `cardsv2`: the v2 card set from Magnus's card codex, with Maggi's v10 art.
- `chestcards`: cards come only from chests behind stronger foes, never from shops.
- `gradual`: a slow step-by-step maths ladder.
- `meterpressure`: difficulty comes from the timing meter, through foe pressures, helm and lantern (`src/data/meter_pressure.js`).
- `castbar`: the timing meter is always on screen, and moved bands shake and slide with a trail (`src/data/cast_bar.js`).
- `knightstart`: a run starts as the covered-face knight with a chipped sword.
- `toughfoes`: stronger foes take more blows.
- `brawl`: recorded runs appear on the road as sightings and ambushes (`src/data/brawl.js`, `docs/brawl_run_format.md`).
- `pausemenu`: P or Escape opens the pause menu, and music on/off lives there.
- `juice`: number entry feels forged, with heavy digits and a punch on Enter (`src/data/juice.js`). Name-entry sounds are always on.
- `recruitcode`: recruiting means typing a 6-digit code before a 5 s meter ends.
- `partylevels`: party members level 1 to 5 by surviving, and levels cancel foe intimidation.
- `traps`: trap stops (`src/data/traps.js`).

## Code layout
- `src/game.js`: the main loop, flow, fights, dialogs (`cardDialog`, `artCard`, `plainCard`), road building (`buildWorld`, `withTraps`) and intro or name entry (`renderIntro`).
- `src/engine/*`: systems. `assets.js` loads and decodes images, with `preloadAll` and `warm`. `loader.js` is the loading bar. `juice.js` handles key sounds (Web Audio) and digit pop. `audio.js` and `music.js` play the other sounds and music. `balance-try.js` runs the switches.
- `src/data/*`: all tunable numbers and text. Keep data out of logic.
- `src/config/preload_images.js`: every image the game can show, all loaded with the bar.
- Switches: `BT.on(name)`, with defaults in `src/data/balance_try.js` and URL flags in `src/engine/balance-try.js`. New features always go in behind a switch.
- Debug: add `?debug` to the URL. Then use `__km.debugJump(want, looks, cards)` (it accepts stop types like `'trap'`), `__km.mode()`, `__km.phase()`, `__km.answer()`, `__km.S`, `__km.limb(i,'arm'|'leg')`, `KM.Juice.last`, `KM.Juice.state()` and `KM.Juice.ready()`.
- Tests: `node --test tests/*.test.js`. Many tests failed before this work (woodcut-timer-play, villager-start, v18, tomb-*, play and others); don't chase those. The tests rewrite `screenshots/`, so run `git checkout -- screenshots` afterwards. Use Playwright with Chrome for browser checks.

## Magnus's standing rules
- Balance numbers need his OK, and so does any of Maggi's art before it's wired in. Approval relayed by another agent only counts if it answers the exact question.
- Battle, riddle and other meter times never change. Only the recruit code meter is 5 s.
- Always fix spelling and grammar in text he gives, but keep his wording. Never show "ghost" in player-facing text.
- Fellowship mode is the focus.
- Cast bar spec: on a change, the affected icon shakes for 1 s, then slides to its new spot, leaving a plain green (good) or red (bad) trail in the orange fill art. The trail stays 1 s, then catches up into the icon like a fighting-game health bar. A boss roars, and its trail stays for the whole boss pressure. Icons sit on an unbroken bar line. Only bosses and terrify move icons; riddles and the tavern never do.
- Upgrades come only from chests, camps, scroll stands and taverns.
- Screens get short text and one button.
- Escape opens pause while walking or fighting, and Escape or P closes it. Screens where Escape already has a job keep that job.
- Batch work, test locally, push once, then quick-check the live site. Keep usage lean.

## Recent builds
- brawl-19: recruit speed code (6 digits, 5 s meter) and party levels 1 to 5 (`src/data/party_levels.js`). Levels cancel a monster's intimidation: normal foes are fully cancelled at level 5, bosses by 50%.
- brawl-20 and brawl-23: upgrade cards v2 (`src/data/upgrade_cards.js`), using Maggi's v10 card art in `assets/ui/cards/v10/`. "LEVEL n/max" is printed in the level slot. The knight's base swing does 100% to the first enemy and 50% to the second.
- brawl-21: missing-limb sheets (`src/data/limbs.js`, `assets/limbs/v1/`).
- brawl-22: trap stops (`src/data/traps.js`, art in `assets/traps/v3/`). Two multiplication sums disarm a trap for a card pick or gold. A failure costs a companion an arm (crit window worse) or a leg (block worse); with no companion, the hero loses a heart, never the last. The numbers are PROVISIONAL and wait for Magnus's OK.
- brawl-24 to 30, name entry: every letter plays the same metal sounds as typing math (brawl-30, at Magnus's request), each letter with its own pitch. The anvil test sounds `name_ring_1-5` are unused; setting `KM_DATA.juice.text.letters` would bring them back. Each letter flashes fire red-orange, then cools to black ink (`KM_DATA.juice.name`). This is always on, not only with the juice switch. The first key unlocks Web Audio and then plays. A .ogg that won't decode falls back to its .mp3, which is meant for Safari.
- brawl-26: the narrator and the knight's sprites are decoded again and drawn off-screen just before the bar closes (`KM_DATA.preload.warm`). This is meant to fix their pop-in after loading in Safari.

## Brawl mode plan
Every finished run is saved as a record (`docs/brawl_run_format.md`). Other players' runs then appear on your road as sightings and ambushes. Today those records are local seeds plus your own runs; the next step is an online server that collects runs, and which server to use is still undecided.

## Assets that aren't wired in yet (`handoff/`)
Claude can only see GitHub, so the latest version of everything from the team's shared computer has been copied here:
- `handoff/art/`: Maggi's latest version of each piece. `handoff/art/ART_HANDOFF.md` has the style rules and what's approved versus waiting. Approved and wired: trap v3 and the v10 cards. Waiting for Magnus: chest v1, limbs v2 plus the trap-loss sequence, the `meter_tips/v4` tip pictures (party and terrify), and the card badges.
- `handoff/card_codex/`: Magnus's card codex (`card_codex.html`), `CARD_SPEC_2026-11-09.md`, and his raw edits in `edits_2026-11-08.json` and `edits_2026-11-09.json`. This is the record of what he wants from the cards.
- `handoff/sfx_keys_unapproved/`: the latest key-sound set, cut from Magnus's Blacksmith pack. Magnus has NOT approved it, and the v2 set was rejected. The game currently uses `assets/audio/sfx/key_*`, which are also unapproved.

## Open: needs checking first
- **Safari:** brawl-25 to 29 aren't confirmed in real Safari. Playwright's WebKit on Linux crashes on any `<audio>` element, and that includes old builds, so test on a real Mac or iPhone.
- **Waiting for Magnus's "approve all"**, then wire in with one push:
  - Maggi's chest art `chest/v1`
  - the card badges
  - the tip pictures `meter_tips/v4/tip_party.png` and `tip_terrify.png`
  - limbs v2 and the trap-loss sequence
- **Terrify sequence (to build after the art OK):** when a creature terrifies the party, it works like a smaller boss push.
  1. The first time each kind of pushback happens, a tip card shows (art: `tip_terrify.png`). Its text: "Some creatures terrify you, and make the fight harder than it should be. But the more you and your fellowship level up the braver you become and these things will affect you less."
  2. After the player clicks past it, the creature roars, reusing the existing roars.
  3. The affected cast bar icon shakes for 1 s, then slides back with a red trail (the `fill_bad` art). The trail stays for that fight.
  4. Party levels already make the push smaller.
- **Older items:** the roar sometimes plays twice at boss start, the shared rear-walk sheet for limbs isn't wired, and the tough-foes balance and online server choice are still undecided.
- To wire approved art, copy it from `handoff/art/` into `assets/`.

### Full open list (Magnus asked 2026-11-09, collected by the team)
- Meter badges (art in `handoff/art/meter_tips/v1/badges/`) on the tavern recruit cards AND the gear cards: show which icon moves and how far.
- Limb-loss frames (`handoff/art/limbs/v2`) plus the limb-loss moment at a trap: drawn, not wired, needs Magnus's OK.
- Treasure chest closed/open with ink shine (`handoff/art/chest/v1`): waits for Magnus's OK.
- Playtest the terrify, party and gear tips (brawl-32), including that the terrify slide-back shows the red trail.
- Key sounds and loader pop-in fix on a real Safari, fresh game: unconfirmed.
- Provisional numbers for traps and cards v2: wait for Magnus's OK.
- Older asks: crypt enemies and a boss, swamp and beach biomes, online brawl opponents recorded from other players.
