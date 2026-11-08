# Medieval Math: handoff to Claude (9 November 2026, build brawl-29)

Read this first. It is the current state of the game. CLAUDE.md, GROK_HANDOFF.md and HANDOFF.md are older history and may be out of date.

## What it is
Medieval Math is Magnus Jansson's math game. A knight and a fellowship walk a road and fight by answering sums against timing meters. It is plain HTML, JS and canvas, with no build step and no framework.
- Active branch: `brawl-mode`. GitHub Pages serves the `play` branch: https://kk76fd4v84-star.github.io/medieval-math/
- Deploy: commit to `brawl-mode`, run `git push origin brawl-mode`, then `git push -f origin brawl-mode:play`. Force-pushing `play` is fine; never force-push any other branch. Bump `?v=brawl-N` on every changed script in `index.html`, plus `<meta name="km-build">`, which is shown on the loading screen.
- Run it locally: `python3 -m http.server 8798` in the repo root. Sounds and art packs need http, not file://.
- Full test link (all switches on): `index.html?mode=fellowship&curve=1&halfhearts=1&camparmour=1&whoacts=1&cards=1&gradual=1&meterpressure=1&castbar=1&knightstart=1&chestcards=1&toughfoes=1&brawl=1&pausemenu=1&juice=1&recruitcode=1&partylevels=1&cardsv2=1&traps=1`

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
- Every character is a skeleton, never a human.
- Escape opens pause while walking or fighting, and Escape or P closes it. Screens where Escape already has a job keep that job.
- Batch work, test locally, push once, then quick-check the live site. Keep usage lean.

## Recent builds
- brawl-19: recruit speed code (6 digits, 5 s meter) and party levels 1 to 5 (`src/data/party_levels.js`). Levels cancel a monster's intimidation: normal foes are fully cancelled at level 5, bosses by 50%.
- brawl-20 and brawl-23: upgrade cards v2 (`src/data/upgrade_cards.js`), using Maggi's v10 card art in `assets/ui/cards/v10/`. "LEVEL n/max" is printed in the level slot. The knight's base swing does 100% to the first enemy and 50% to the second.
- brawl-21: missing-limb sheets (`src/data/limbs.js`, `assets/limbs/v1/`).
- brawl-22: trap stops (`src/data/traps.js`, art in `assets/traps/v3/`). Two multiplication sums disarm a trap for a card pick or gold. A failure costs a companion an arm (crit window worse) or a leg (block worse); with no companion, the hero loses a heart, never the last. The numbers are PROVISIONAL and wait for Magnus's OK.
- brawl-24 to 29, name entry: every letter plays a heavy hammer-on-anvil hit (`assets/audio/sfx/name_ring_1-5`, data `KM_DATA.juice.text.letters`, each letter its own pitch). Each letter flashes fire red-orange, then cools to black ink (`KM_DATA.juice.name`). This is always on, not only with the juice switch. The first key unlocks Web Audio and then plays. A .ogg that won't decode falls back to its .mp3, which is meant for Safari.
- brawl-26: the narrator and the knight's sprites are decoded again and drawn off-screen just before the bar closes (`KM_DATA.preload.warm`). This is meant to fix their pop-in after loading in Safari.

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
- Maggi's handoff art lives outside the repo, on the agents' shared computer at `/workspace/handoff_to_maggi/`. Copy approved files into `assets/` before wiring them.
