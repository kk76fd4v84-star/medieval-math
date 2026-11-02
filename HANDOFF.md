# Medieval Math — handoff (2 Nov 2026)

## How to play
Unzip, then open `index.html` in Chrome (double-click works; or run `python3 -m http.server` in the folder and open http://localhost:8000).
- Keyboard: number keys or arrows + Enter.
- Mouse: click the tavern door, NPCs, the TAVERN FARE sign, and the plaques.
- Space advances bubbles; Esc skips the intro.

## What's in this build
- **Intro:** the skeleton narrator on his rock (Magnus's art) instead of the dragon. The VO hooks vo_intro_01..08 play `assets/audio/vo/<id>.ogg` when the files exist. They haven't been recorded yet: Charlie is doing them with ElevenLabs Starter, which Magnus approved.
- **Combat:**
  - Weak swing / Hard swing / Heal plaques.
  - Party hearts top left, 2 per member; the hero dies last.
  - The purse sits under the hearts.
  - The hunter meter is orange dots, with a skull chasing a helmet.
  - Monster hearts: at most one row of 10.
  - Darkest Dungeon style lunges both ways (0.55 s).
  - Fights are mandatory; only some optional, risky ones can be declined.
  - Enemies slide in on the ground line.
  - From 5 leagues on, there are fights with 2 or 3 enemies, and the sword hits the front 2.
  - Combat SFX are Charlie's steps, swings and hits.
- **Sums:** large and centred. They auto-shrink so they're never cut (`fitSums` in src/game.js).
- **Tavern:**
  - The interior fills the screen; seated NPCs sit behind tables.
  - Selection works with hotspots plus click.
  - The TAVERN FARE sign swings when picked. Mead gives one battle of stupidity (limit 1 per visit), stew heals +1 heart (limit 2 per visit).
  - Recruiting: "Join my party?", then the NPC's reply, then a sum.
- **Riddles:** the riddle sits in Magnus's frame where the sum usually is, with the answers as plaques underneath.
- **Sky:** Magnus's clouds and birds, now drawn at 0.55× and 0.5× (`cloudMul` / `birdMul` in src/engine/scenery.js). There are no mist bands.
- **Cobra's v19 art merge:**
  - The background dragon on its hill at Frank's stop.
  - The mega boss with all 6 eat drawings.
  - Brutal deaths: eaten, torn apart, arrows.
  - The coif's own death.
  - Toad and ogre as road enemies.
  - See AUDIT_ART.md.

## Open questions for Magnus
1. Is Frank's stop the right place for the hill dragon to first appear?
2. Toad and ogre stats (7 hearts, 1 damage) and their placement just before the boss: are these OK?
3. The skeleton narrator is drawn large: his skull is about 2× the knight's helmet. Shrink him?
4. The 84 low-res v2 idle loops are not used (see below).

## Known issues / next steps
- vo_further_than_ever still says the long line, while its bubble now says "Further than ever before!".
- Red damage numbers float a bit high.
- Frank's bubble text is tight against the bubble edge.
- The multi-enemy pool is goblin and rabbit only.
- The knight has no attack drawing, so he lunges in his standing pose.
- Open from before: the distance ⚐ display, strip-join patches, Black Knight height.
- Missing art (MISSING_ART.md):
  - deaths for 4 companions
  - deaths or kills for the dragon, toad, ogre, goblin, skeleton and Black Knight
  - dragon jaw layers
  - attack and hurt clips for monsters
  - knight attack pose
  - Bridgekeeper
- The ogre sheet has thin lines at its cell edges.

## Rules (from Magnus)
- Follow the design docs exactly.
- Art is drawn at its exact size, with one global factor at most (artScale 0.6).
- No grey labelled placeholder boxes.
- "Clean" means no clutter, but frequent actions stay one keypress with their options visible.
- All characters are skeletons in hooded style; there are no humans.

## Code map
- `src/game.js`: flow, combat, strikes.
- `src/engine/scenery.js`: layers, sky.
- `src/data/*`: content and balance; TEMP_BALANCE holds the tunables.
- `src/config/`: art configs.
- `tests/*.test.js`: Playwright tests, run with `python3 -m http.server 8799`.
- `README.md`: the full history.

## v12b patch (2 Nov 2026)
Unzip `KnightMath_v12b_patch.zip` over your `~/Downloads/knight-math-game` folder (it only holds the changed files).
- **Narrator is knight-sized** (your request): `artMul 0.55` in `src/config/narrator_apply.js`. Hood top to rock base goes from 998 to 549 layout units; the hero knight is 534. His skull is now about the size of the companions' skull faces. The rock base stays on the ground line, and the bubble and head box follow him.
- **Coif knight is the right size** (your request): `artMul 1.24` on follower_5 in `src/config/art_v18_apply.js`. He was 415 tall against hero 534 and companions 476–547 (mean 514); he is now 515. One factor covers idle, walk, attack, hurt, death, and the tavern / recruit lineup.
- **Long sums never cut:** your engraved digits have a fixed size, so shrinking the font wasn't enough. `fitSums` now also scales the whole sum down and centres it when it would stick out.
- Screenshots: `screenshots/v12b/`.

## v12c patch (2 Nov 2026)
Unzip `KnightMath_v12c_patch.zip` over `~/Downloads/knight-math-game`. It includes v12b, so you don't need v12b separately.
- **Answer timer** (your request): the divider line under the ground is now the timer for battle sums (normal fights, group fights, bosses, the mega boss).
  - It fills in the ornament's orange from the centre ornament out to both ends. It tints your divider ink itself, with no text or numbers.
  - You get 20 s per sum (`KM_DATA.combat.answerSecs` in `src/data/combat.js`; 0 turns it off).
  - When it fills up, it counts exactly like a wrong answer: the wrong sound, hunters +1, the sum shown corrected, and every living enemy lunges and strikes. Then you're back to choosing a move, and the next sum starts a fresh timer.
  - Any answer resets it. It pauses during strikes, deaths, the scene toast, the sacrifice prompt and while enemies walk up. It doesn't run for riddles, recruiting, Frank, the tavern or the intro.
  - There's a soft tick (the existing `type_blip` sound) in the last 3 s. No new audio.
  - Tests can switch it off with `?notimer`.
- **Intro voice pacing:** when a line has a recording, its bubbles move along with the voice (by length of text), and the next line comes 0.6 s after the clip ends. Without a recording, Space shows one bubble at a time. Space during a clip still moves on.
- Screenshots: `screenshots/v12c/`.

## v12e (2 Nov 2026): tavern approach + plaque buttons
- **No small road tavern.** The road facade actor (`tavern_facade`, drawn by `drawFacade` from `KM_ART7.scenes["tavern-exterior"]`) is no longer added when Magnus's full `tavern-arrival` scene exists (`buildWorld`, src/game.js). The only tavern you see is the big arrival scene.
- **Go in / Walk on fade in.** They now appear 0.3 s after the arrival scene has fully faded in (`.opts.arrive` → `.in`, set in the frame loop). Clicks are ignored until then.
- **One button style.** Every choice is the battle's open plaque (`button.opt.plaque` + `BANNER`). That covers the title, intro (Next / Skip), name OK, tavern arrival, Sacrifice picker, camp/shop heals, scroll and gear (`.plaque.mini`), game over and recruit prompts. Riddle answers keep Magnus's v18 answer-frame art.
- **No visible key labels.** The `<kbd>` badges, the red seals on the move plaques and the riddle A/B/C/S letters are all gone. Every keyboard shortcut still works. The intro "▸" now reads "Next", the name "✓" reads "OK", and the tavern "← → to look" reads "Look around".
- `__km.debugJump` (only with ?debug) also matches a rest type, e.g. `debugJump("tavern")`.
- Screenshots: `screenshots/v12e/before_*.png` and `after_*.png`.
- Tests: `play.test.js` checks updated to "no key labels" (and it now also asserts no `<kbd>` in the riddle panel). Still failing from before v12e: the intro sentences are too long for one bubble (play/speech), `narrator.test` vo_story_02 chunk wait, and `mead.test` ends in a boss game over. All three fail the same way on the pre-v12e code.

## v12f (2 Nov 2026): loading bar + faster first load + Safari VO
- **Loading bar** (`src/engine/loader.js` + CSS `#kmLoader`): parchment background, Magnus's divider with the answer timer's orange fill growing from the centre out, and a small "Loading". Progress is measured in real bytes (`src/config/asset_sizes.js`, rewritten by `tools/asset_sizes.py` on every deploy).
- **First load cut:** `KM.Assets.loadImg` asks `KM.Loader.gate()` before loading. Only the title/intro UI, hero, narrator and the road layers the title actually draws (`KM.Scenery` ok() → `KM.Loader.want`) load first. Everything else waits and streams in after the bar. The tavern and camp scenes now preload after the bar.
- **Safari:** the VO recordings now have .mp3 twins next to the .ogg files in incoming/vo_narrator/ (SFX and music already had mp3).
- The browser tab title is now "Medieval Math".
- narrator.test now uses Charlie's real vo_story_01..04. All 4 play, every part advances by itself and the name prompt follows. The missing-file check now forces 02 to 404 with a regex route; the old glob `vo_story_0[2-4]*` never matched, which is why the test "stalled".

## v12g (2 Nov 2026): graves on the road, solid background, narrator stays
- **Graves:** a past death's grave used to ride the hill lane (mid parallax, speed 0.3). Its position was clamped to at least cam 2600, so a grave from an early death showed behind the narrator on the title. Graves are now ground props: road x = the death spot (that encounter's halt + saved offset + `GR.ahead`), on `W.groundY`, at artScale. They're drawn behind the party, and the party halts `GR.respectAt` (520) before one to pay respects. There's no clamp, so a grave only shows where you died. Multiple deaths at one spot add a second, solid stone.
- **No see-through:** road props were drawn at alpha 0.85 (`propAlpha`), the second grave stone at 0.8, the distant hill creatures at 0.85 with a washed-out contrast/brightness filter, and the sky dragon at 0.7. All are now drawn at full opacity (the distant creature is just greyscale). Parallax strips and trees fill a "silhouette" with parchment so the layers behind them are hidden. That silhouette was the art's soft alpha (near-forest ~30 % partial, trees 15–29 %), so back layers showed through the canopies. It's now hardened to solid once per cached copy (`solidOf` in scenery.js).
- **Narrator stays:** `startJourney` no longer removes him. He stays on his rock, says nothing, and scrolls off as the party walks past.
- The small dark mounds in v12d/move_choice.png were not graves (the grave list was empty). They're pebbles in the random foreground ground strip.
- Screenshots: `screenshots/v12g/before_*` / `after_*` (title, walkoff_0..7, road_grave, road_1_frank / road_2_tavern / road_3_boss).

## v12k (2 Nov 2026): fire bottle, a spelling attack
- **Buy:** the tavern's fare sign now has a third plaque, **Fire bottle** (Maggi's flask stamp + price 6). You can carry 2; the plaque greys out at 2. Saved with the run (`bottles`).
- **Use:** while you carry one, **Fire bottle** is a battle move (after Heal; silent key F). A slightly hard 8–12 letter word (`src/data/words.js`) appears in Maggi's engraved letters. Type it within **7 s** (the divider timer).
  - A right letter turns burnt orange and plays a sound. A wrong letter shows in red (her `wrong/` letters, a small shake) with a bad sound, and blocks until Backspace removes it. Letters not yet typed are ink at 35%; the next one bobs and is underlined.
  - **Done:** the bottle spins through the air to the middle enemy, smashes, and Maggi's woodblock fire bursts under **every** enemy. Each takes one weak-swing hit with the hit flash (on burst frame 2), then the fire lingers ~2 s and fades.
  - **Too slow:** it fizzles. The bottle is used up, nobody takes damage, the word greys out, and the enemies strike as usual. No hunters step (`hunters: 0`).
- **Sounds (existing only, no new audio):** two new events in `assets/audio_map.json` that reuse Charlie's files: `spell_letter_ok` = the anvil strikes from `correct` at volume 0.5, `spell_letter_bad` = the clunks from `wrong` at 0.7. Throw = `swing_hard`, fizzle = `wrong`, hit = the usual hit sound.
- **Code (kept small for the Godot port):**
  - `src/data/items.js`: every fire bottle tunable (price, max, spellSecs, damage, sounds, lines, art paths and fx timing).
  - `src/data/words.js`: the word list.
  - `src/modes/spelling.js` (`KM.Spelling`): the word challenge as pure logic (`start`, `key`, `pickWord`) plus `drawWord()`, the one function that decides how letters look.
  - `src/engine/firefx.js` (`KM.FireFx`): the throw, smash, burst and linger drawings. Visual only; `start()` returns when the hit lands.
  - `src/game.js`: `pickFire` / `spellKey` / `fireThrow` / `fireFizzle` / `buyBottle`. The sword hit was split into `hitFoes` + `settleHits`, which the fire reuses. The answer timer now takes per-question seconds (`tmr.secs`) and also runs in the `spell` phase.
- **Art (swap by one path):** the fire is `assets/items/fire_bottle/v2/` (Maggi's woodblock redo; v1 is not used), set in `items.js` `art.dir`. The letters are `assets/alphabet/v1/` (ink, `correct/`, `wrong/`), set in `src/config/alphabet.js` (`KM_ALPHABET`; set it to null to fall back to the sum's font). The word is drawn at artScale and scaled down to fit 1300 stage px.
- Screenshots: `screenshots/v12k/` 01_shop, 01b_shop_two_bought, 02_word_half_typed, 03_wrong_letter_red, 04_success_hit, 05_fizzle.
- Tests: `tests/firebottle.test.js` (new, PASS). `group.test`, `narrator.test` and `mead.test` PASS. `spell.test` still fails one old check that expects the visible key labels removed in v12e.

## v12m (2 Nov 2026): forged letters, Charlie's letter sounds, fire art v4
- **Letters (Magnus):** every letter starts **grey** (Maggi's ink letters tinted #8a8580, full opacity; the 35% look is gone). A **right** letter flashes hot orange with a warm glow and **cools to black ink** over 0.7 s, like forged metal. A **wrong** key plays a water hiss and the **current letter shakes and stays grey**. No red letters and **no Backspace step**: you just type the right letter next (Backspace does nothing).
  - Tinting is done in code: `KM.Spelling.preload()` tints each ink PNG with `source-atop` into grey / hot / cooled data URLs (once). A done letter is a black layer under a hot layer whose opacity + glow fade out (CSS `kmCool`). Re-renders keep each letter's place in its animation (negative `animation-delay` from the time it was typed), so cooled letters never flash again. `correct/` and `wrong/` PNGs are no longer used.
  - **Tunables:** `KM_DATA.items.fireBottle.letters` in `src/data/items.js`: `grey`, `hot`, `cooled`, `glow`, `glowPx`, `coolSecs`, `shakeSecs`, `shakePx` (passed to CSS as variables).
  - `KM.Spelling.key()` now returns `"ok" | "done" | "bad" | null`; state is `{ word, n, at, missAt }`.
- **Sounds (Charlie, ElevenLabs):** `spell_letter_ok` = `sfx/spell_ok_1..4` at 0.65, random, never the same twice in a row. `spell_letter_bad` = `sfx/spell_miss_1..2` (water hiss) at 0.8. `.mp3` twins for Safari.
  - Ready but silent (no files yet, so no requests): `fire_throw`, `fire_smash`, `fire_ignite` (peak on burst frame 2), `fire_crackle` (loop, 300 ms fade; needs a stop/fade hook in audio.js), `fire_fizzle`, `goblin_burn`. Each has `files: []` and the planned names in `_next`. When they land: move `_next` into `files`, run `python3 tools/build_audio_map.py`, and play them from `fireThrow` / `fireFizzle` (src/game.js) and `KM.FireFx` (src/engine/firefx.js).
- **Fire art v4 (Magnus approved):** `assets/items/fire_bottle/v4/` (one-colour woodcut, washed-out ochre #D9B46A; same names, cells, anchors and timing). Only the files the game uses were copied (icon, item, 3 atlases, NOTES.md). **v2 was removed** from the game. `items.js` `art.dir` points at v4.
- Screenshots `screenshots/v12m/`: 01_all_grey, 02_letter_glowing_orange, 03_letters_cooled_black, 04_wrong_key_shake, 05_fire_hit_v4, 06_fizzle (+ 01_shop, 01b_shop_two_bought).
- Tests: `firebottle.test` updated for the new rules (grey, hot, cooled, shake, no Backspace, Charlie's sounds, v4 art). PASS. `group.test` and `narrator.test` PASS (group can flake on the hearts check when run in parallel with others; it passes alone). `spell.test`: the old "1 Weak" label check now checks there are no key labels and passes. The test still exits FAIL on pre-existing console 404s from the VO lookup (`vo_name_prompt`, `vo_after_name`, `vo_spell_cast`, `vo_spell_wear_off` have no files yet).

## v12n (2 Nov 2026): fire bottle sounds (Charlie, ElevenLabs)
- **Files:** `assets/audio/sfx/fire_throw_1`, `fire_smash_1`, `fire_ignite_1`, `fire_crackle_loop`, `fire_fizzle_1`, `goblin_burn_1..2` (.ogg + .mp3; details in `assets/audio/sfx/NOTES_fire.md`).
- **Events** (`assets/audio_map.json`, volumes from Charlie's notes): `fire_throw` 0.8, `fire_smash` 0.9, `fire_ignite` 1.0, `fire_crackle` 0.65 (loop), `fire_fizzle` 0.8, `goblin_burn` 0.8 (2 variants, never the same twice in a row).
- **Sequence** (cued by `KM.FireFx` on the art's own clock, so it follows the frame timing in `items.js` `art`):
  - throw on release (the game; replaces `swing_hard`)
  - smash on impact
  - ignite once at burst frame 1 (smash + 210 ms), so its peak lands on burst frame 2 = the hit
  - one `goblin_burn` per enemy hit, 60 ms apart, the 3rd and later at 0.7
  - crackle loop from the lingering phase
  - when the fire fades: the crackle fades out (300 ms) and `fire_fizzle` plays
  - Too slow: `fire_fizzle` instead of `wrong`.
- **Tunables:** `KM_DATA.items.fireBottle.sfx`: event names plus `burnStagger`, `burnGainAfter2`, `crackleFadeSecs`.
- **audio.js:** `play(ev, { gain })` (gain multiplies the map volume). New `loop(ev)`, `stop(ev, fadeSecs)`, `stopLoops(secs)` and `looping()`. Loops are plain `<audio loop>`: the .ogg loops seamlessly, and Safari's .mp3 may have a tiny gap at the wrap (Web Audio would fix it if it's noticeable). Loops stop when muted or when the tab is hidden.
- **Crackle never left behind:** `KM.FireFx.stop()` fades it out when the fire ends, and `game.js update()` stops the fire as soon as the mode isn't `encounter` (battle won, death, scene change).
- **Tests:** `firebottle.test` now checks the cue times on the fire clock, that the crackle loops and then stops, that the fire stops out of battle, that there are no 404s for sounds or item art, and that the fizzle sound is `fire_fizzle`. PASS. `group` and `narrator` PASS.
- Nobody has listened to the new sounds yet (Charlie's checks are measurements only); Magnus should give them an ear.

## v12o (2 Nov 2026): tavern interior with seated knights and a bar
Magnus: "There are actual knight sitting sprites and a bar. Improve this scene."
- **Recruits sit, whole body, feet on the floor.** Magnus's seated poses (`assets/v11/ui/seated-feather.png` / `seated-scarf.png`, from `incoming/magnus_art/sitting_plume_knight.png` / `sitting_kettlehat.png`) are no longer clipped at a tabletop. The feather knight sits on a bar stool, the kettle-hat on a low stool. Both face the party. The v11b head match to the walk sheets is kept (0.52 / 0.5).
- **The bar.** Magnus's v8 bar counter (with barrels and a mug, cropped from `assets/v10/paper/scenes/tavern-foreground.png`) stands against the back wall under the mug shelf. The recruits sit in front of it. The stools are cropped from `tavern-bar-seats.png` and `tavern-seats.png`. The trestle tables (`tavern-table.png`) are gone.
- **No seated pose yet** for moustache, stripe and coif. When one of them is a recruit, he stands at his seat by the bar, facing the party (MISSING ART: their seated poses).
- **All data:** `src/data/tavern.js` (`KM_DATA.tavernRoom`) holds the prop crops, the seat x positions for 1, 2 or 3 recruits, the depth (`back`), the sitter fits (mul, hip, seatX, foot, stool) and the barkeep's voice anchor. `src/game.js` has `propRect`, `drawProp` and `seatGeom(j, n)`. `seatGeom` is pure geometry, shared by drawing and the click/highlight hotspots (a sitter's hotspot is his drawing).
- **Question for Magnus: prop scale.** The v8 room layers are painted at a smaller pixel scale than the characters. At plain artScale the stools would be too low for the seated hips. The room props therefore share one extra factor, `propMul 1.4` (like `buildingMul` for the facade). With it the bar stool seat is about 4 px from the feather knight's hip and the low stool about 2 px from the kettle-hat's.
- **Fixes:** the interior drew the party twice, so the hero's bubbles came out doubled; it now draws once, after the sign. Speech bubbles now avoid the TAVERN FARE sign. The barkeep's bubble comes from behind the bar (`keeperAt`).
- **Recruits per tavern** is still `[2, 2]` (reststops.js). The layout also has seats for 3.
- Screenshots: `screenshots/v12o/before_*` / `after_*` (default, selected, speech; after also has `three` and `standing`). Shot script: `/tmp/v12o/shot.js`. Backups: `/workspace/bak_v12o/`.

## v12p (2 Nov 2026): seated tavern knights scaled to the player
Magnus: "Better but they look too big, compared to the player."
- Measured against the hero as drawn in the scene (533 layout units = 355 stage px tall; great helm ~93 stage px wide).
- **Seated mul (src/data/tavern.js `sitters`):** feather 0.52 -> 0.42, kettle-hat 0.50 -> 0.44. Height drawn, head to soles: feather 428 -> 346 stage px (121 % -> 97 % of the hero, plume included), kettle-hat 353 -> 310 (99 % -> 87 %).
- **Trade-off:** Magnus's seated drawings have smaller heads per body than the walk sheets. With bodies at a normal sitting size, the helmets are ~80 % of the hero's: feather helm ~94 -> ~76 stage px, kettle-hat brim ~107 -> ~94. Matching heads exactly would make the sitters taller than the standing hero again.
- **Room props:** `propMul` 1.4 -> 1.1. The bar stool seat is ~14 layout units above the feather's hip (hidden behind him). The low stool is ~9 under the kettle-hat's hip. The counter shrinks with them.
- **Standing fallback** (moustache / stripe / coif): unchanged. These are the same walk sprites at the same scale as the party.
- Screenshots: `screenshots/v12p/after_default.png`, `head_compare.png` (hero | feather | kettle-hat heads, v12o vs v12p, same 2x zoom), `before_after_default.png`. Backups: `/workspace/bak_v12p/`.

## v12q (3 Nov 2026): Maggi's wall menu sign + ornamented button frames
Magnus (via Maggi): "The buttons of the mead stew etc, I want the wall menu to look like that and there is where that menue is. But all other buttons that show up below I want to have that frame you have done now."
- **Wall menu = Maggi's hanging sign.** The art is `assets/ui/tavern_ui_v1/tavern_sign.png`. I used the plain variant: its text-safe rect is bigger. It replaces Magnus's old TAVERN FARE sign in the interior.
  - **The lines:** Mead / Stew / Fire bottle are clickable lines on the board. Each has Maggi's mug / bowl icon (`icon_mead.png` / `icon_stew.png`, keyed from her `work/icons_key.png`) or the fire bottle stamp, then the name in Georgia, dark ink `#1b1410`, then the purse + price, right-aligned.
  - **Controls:** hover or the arrows light a line with an orange underline. Click, Enter, or the silent keys 1 / 2 / 3 buy it.
  - **Greyed lines:** an item you can't have (no gold, full hearts, at the limit, mead already waiting, 2 bottles) is greyed, both text and icon.
  - **Swing:** a buy (or a refused one) knocks the board, which swings about the chains' bar. The iron bracket stays put.
  - The barkeep lines and the per-visit limits are unchanged; the existing purchase functions do the refusing.
  - The three item plaques are gone from the strip. With a sign line selected, the strip is empty.
- **Sign size: scale 0.39 at stage (158, 48)**, instead of the README's 0.36 at (172, 56). At 0.36 "Fire bottle" + price only fit by shrinking the text to about 21 px. At 0.39 the lines are 23 px Georgia with 30 px icons, each line about 62 px tall to click. The sign's right edge (x 406) stays clear of the solo hero's helm (x ≈ 418).
  - **Readability:** fine on a 1600-wide window. On a small laptop window (~0.75 scale) the text is about 17 px: readable but small. A bigger board from Maggi would help.
  - All numbers live in `KM_DATA.tavernRoom.sign` (src/data/tavern.js). The text shrinks to fit if a line is too wide.
  - Code: `signGeom`, `fareItems`, `fareLines`, `drawSign`, `buyFare` in game.js. Spots are now `fare:mead|stew|fire`, then the recruits, then the door. `__km.fare()` reports each line's state.
- **Every strip button** (`button.opt.plaque`: battle moves, Go in / Walk on, Go outside, camp, shop, recruit prompts, title, intro, name OK, game over, Sacrifice picker, gear minis) now wears Maggi's frame.
  - CSS `border-image` from `button_frame@2x.png`, horizontal-only 9-slice (slice 75 124 fill; caps 38/62 px at 90 px height, scaled with each button's fixed `--bh` height: 84 / 70 / 64 / 46).
  - Hover and keyboard focus: `_hover` frame + 2 px lift + orange underline.
  - Disabled: `_disabled` frame, grey text, greyscale icons, NO extra opacity.
  - Config: `src/config/ui_frames.js` (`KM_UI.frame`), copied into CSS variables at boot. The old SVG banner (`BANNER`) is now empty.
  - Riddle answers (`.ansf`) keep Magnus's answer frame.
- **Fire bottle: no goblin yelps** (Magnus). `goblin_burn` is removed from `items.js` sfx (with `burnStagger` / `burnGainAfter2`) and from `firefx.js` cues. Throw, smash, ignite, the crackle loop, fizzle and the spelling letter sounds are unchanged.
  - The `goblin_burn_1/2` files and their audio map entry are still on disk but nothing plays them.
  - firebottle.test.js now checks that no `goblin_burn` plays.
- Tests updated to use the sign lines: mead, firebottle, play (battle frame check, tavern entering + sign checks).
- Screenshots: `screenshots/v12q/`: battle_choose (Weak / Hard / Heal disabled at full hearts / Stupidity in the new frames), battle_hover, tavern_default, tavern_sign_hover_fire, tavern_sign_fire_greyed (+ `_sign_crop` zooms), tavern_arrival, tavern_door_buttons, title, name. Backups: `/workspace/bak_v12q/src_tests_css.tgz`.

## v12r (3 Nov 2026): music preloads with the loading bar + centred frame labels (+ Magnus's v12r batch)
- **Music with the bar** (Magnus: "make sure the music is loaded before the game starts"). `KM_DATA.music.preload: ["title", "world"]` (src/data/music.js) = the categories whose first track loads WITH the bar: `KM.Music.preload()` picks the title track (quest_theme) and one random road track, `KM.Loader.fetch()` (new, src/engine/loader.js) streams their real bytes into the bar (sizes from `KM_ASSET_SIZES`; tools/asset_sizes.py now covers .mp3/.ogg/.m4a/.wav), holds each as a blob: URL and waits for `canplaythrough` (8 s cap) before the bar can finish. The rest still streams. Music ships as .mp3 only (plays everywhere incl. Safari). **First load +6.1–8.0 MB** (quest_theme 3.83 MB + one road track 2.32–4.19 MB); locally ~19.5 → ~27 MB in the bar. Throttled run (40 Mbps): bar done at 6.6 s, both tracks decoded (readyState 4).
- **No music dip under the narrator** (Magnus: "Don't lower the music when the narrator speaks"): `duckVoice: 1` (was 0.3). The mechanism stays.
- **Bard songs only inside the tavern** (Magnus). All 9 tavern tracks are sung (lyrics in their mp3 tags); the category is tagged `vocal: true, where: "tavern-interior"`. `KM.Music.setPlace()` is fed from `S.view` each frame; a `where`-tagged category outside its place plays the scene's `outside` (rest_tavern: `outside: "world"`, default `KM_DATA.music.outside`) = the road music keeps playing on the arrival / exterior, and crossfades to a bard song on going in and back out on leaving. mead.test checks all three.
- **Centred frame labels**: one setting `KM_UI.frame.labelLift: 0.036` (src/config/ui_frames.js) = extra bottom padding of 2 × 0.036 × height on every `.plaque` size (84/70/64/56/46) and state, so text + icons sit 3 px (84) higher, optically centred between the frame's ink lines (measured: x-height centre on the line centre). Crops: `screenshots/v12r/title_buttons_before_after.png`, `battle_buttons_before_after.png`.
- **Graves on the ground** (Magnus: "The grave sits too high"): the markers' alpha bottom was ~80 source px above their anchor. tools/measure_feet.js now measures the grave markers too → `KM_FEET.grave_*` (74–82); the mound base lands on W.groundY (within 1 unit) in road and battle views. graves.test.js checks every marker. `screenshots/v12r/grave_ground.png`.
- **Riddle answers in Maggi's frame**: `.opt.plaque.ansf` (normal / hover / disabled frame, label lift), one evenly spaced 64 px row under the question (question frame untouched; Maggi is redrawing it). `assets/v18/answer-frame.png` stays on disk, unused. Longest answer set fits (82–1518 px). play.test updated. `screenshots/v12r/riddle.png`, `riddle_longest_answers.png`.
- **Recruits face the party** (Magnus): one rule, `KM_DATA.party.npcFaceParty` + `recruitArt: "follower_"` (src/data/knights.js): drawActor mirrors every recruitable knight standing as an NPC (roadside recruit, rest-stop candidates; camp / tavern standing ones already were). Once he joins he is a party member and walks right. `screenshots/v12r/recruit_faces_party.png`.
- **Carved digits**: the pack's digit slices were fixed 177 px cuts of `numerals-sheet.png`, so the 0 lost its right side (and sat 54 px in = the odd gap), 8 / 9 lost a sliver. `tools/reslice_digits.py` re-slices every digit around its own ink (+12 px each side) → `assets/v7/numerals/digit-N.png` + `assets/v10/ink/glyph-digit-N.png` (old ones in /workspace/bak_v12r/digits/). New `tests/digits.test.js`: no clipping, all 100 pairs the same 24 px gap. `screenshots/v12r/digits_before.png` / `digits_after.png`. (The touch-pad keys still show the glyphs bigger than the key: pre-existing, inline size wins over `.digits .key .glyph`.)
- **Move rows never overflow** (Magnus: "the buttons are outside of frame"): `KM_UI.moves` (ui_frames.js) + `fitMoves()` (game.js, after every showPanel): buttons never shrink (label + icon + both caps), the row takes the first of `heights` [84, 70] that fits in the strip minus 24 px a side, else two centred rows at 58 px (attacks | items/specials, split at `.brk`) with a smaller prompt. New `tests/moves.test.js` (basic / spell / fire+spell+sacrifice / full kit: every button inside the stage, labels inside the caps, below prompt + divider). `screenshots/v12r/battle_full_kit.png`.
- **Shop / camp menu in words** (Magnus: "I have no idea what the menu means"): `KM_DATA.restStops.menuWords`. Heals read "Poultice: +3 hearts", the scroll "Scroll of Stupidity"; gear rows are labelled "Weapon +1 · 9" / "Armour +1 · 7" (+ purse) above one framed button per knight with his name + filled / empty ink rings, "Max" when full (plain frame), greyed `_disabled` frame when unaffordable. With a gear table the left column stacks heal / scroll / recruit + Walk on at 56 px so 4 knights fit; all text ≥ 28 px; the scroll icon is hidden next to a gear table (the words say it). Shop greeting: "Better gear for your lads. Pick a knight." `screenshots/v12r/gear_row.png` (2 knights) / `gear_row_4knights.png` (afford / broke, shop + camp), `shop.png`.
- **Shop art**: the shop never had art (MISSING_ART #23: `shop` / `shop_keeper` were silhouettes). `art: "stall"` on the shop type draws Magnus's stall + seller (assets/v11/ui/scroll-stall.png, scroll-seller.png, at their stall scale on the ground line) and keeps its recruit candidates. Still no art of their own: the shop building / Honest Edmund, the camp keeper (Old Wally) and barkeep (only in the painted scenes).
- **Narrator VO (Charlie, Callum)**: vo_further_than_ever (replaces the Chatterbox take), vo_name_prompt, vo_after_name (no name in the clip; the bubble keeps {name}), vo_gameover_01..03 (random), vo_victory → `assets/audio/vo/` (.ogg + .mp3), listed in assets/audio_map.json. Name prompt / game over / victory bubbles are paced across their clip like the story lines (`paceVO`). **VO lookup = the map only**: ids with no files (vo_spell_cast, vo_spell_wear_off, vo_member_dies) are silent without a request; the old by-name probing (and its 404s) is gone. `takes/` unused.
- **Scroll SFX (Charlie)**: `scroll_buy` (0.8) on buying, `scroll_get` (0.7) 0.25 s later as it goes into the pack (`gainScroll()`, any future gain path too), `scroll_use` (0.9) on casting; random variant, never twice in a row (KM.Audio.pick). Names + delay in `KM_DATA.spell.sfx`, volumes in the map.
- **Answer timer always starts** (Magnus: "Very often the math timer does not start"): one start point, `startAnswerTimer(secs)` (game.js), called by `ask()` for every battle sum (pickAction passes `C.answerSecs`; recruits / Frank pass none) and by the fire bottle word; `ask()` clears any old timer first. The hold check (`timerPause`, also `__km.timerWhy()`) now ignores dead / gone / inactive foes (their act or walk-in never ticks, so it could freeze the bar for the rest of a fight), and any hold longer than `KM_DATA.combat.answerPauseMax` (3 s) lets the timer run anyway. Not reproduced deterministically in a clean run, so the stale-hold cap is the safety net. New `tests/timer.test.js`: starter fight, next sum after right / wrong / time-out, Esc back, scroll mid-sum (fresh timer), stale act on a dead foe, never-ending hold, fire bottle word, group fight after a foe drops.
- **Walking slowdown fix (from the parent, /workspace/km_leak/leak_fix.diff)**: src/engine/audio.js pools up to 4 `<audio>` elements per file instead of `new Audio()` per footstep; `KM.Audio.poolSize()`. sfx + firebottle re-run PASS.
- **file:// still works**: the music preload skips fetch() under file:// (it is refused there) and preloads the plain URL through the channel's `<audio>` element (canplaythrough); fetch errors fall back the same way. file.test PASS.
- Tests (3 Nov): mead, firebottle (?debug), spell, graves, narrator, digits, moves, timer, sfx, file PASS, no page errors, no 404s; play.test = 104 ok + the known narrator-bubble check only (intro sentences too long for one bubble, pre-v12e). Loader: bar total ~28.1 MB, done at 7.0 s throttled to 40 Mbps (title + world blobs readyState 4), 1.3 s unthrottled. Backups: /workspace/bak_v12r/. Note: the move-row CSS block (.opts.moves.fit / .tworow / .brk) sits at the very end of style.css; keep it there when appending.

## v12s (3 Nov 2026): Maggi's riddle question frame
- The riddle question now sits in Maggi's approved 9-slice frame (`assets/ui/tavern_ui_v1/riddle/riddle_question_frame@2x.png` + README; slice 80/124 fill, corners 40×62 at 1x). It replaces the thin `riddle-frame.png`, which stays on disk unused. Settings are in `KM_UI.riddleQ` (src/config/ui_frames.js); game.js copies them into `--rq-*` CSS vars at boot.
- Georgia 40 px, centred, inside her text-safe inset (64 / 20 px at 1x). The strip is only 184 px tall, so the frame is drawn at `scale: 0.8` (130 -> 104 px tall) to leave room for the 64 px answer row (6 px gap, about 5 px clear at the bottom). Width starts at 900 and grows to 1360 so every current riddle stays on one line (the longest, 61 chars, is 1110 wide). Past that the text wraps and the box grows taller; `fitRiddleQ()` then steps the font down to `minFont` 26 until the frame and answers fit in the strip (checked with a 182-char test).
- The `.long` class is no longer used. Tests: play (105 ok, known narrator-bubble check only), v18 PASS, speech = the same known intro check. `screenshots/v12s/riddle.png`. Backup: /workspace/bak_v12s/.
