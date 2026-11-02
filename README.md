# Scruffy Knights & Sums (working title): prototype v11

This is a seamless 2D side-scrolling math quest: Baldur's Gate-style choices and dice, with Monty Python-style humour.
It uses plain HTML5 canvas, JS and CSS. There is no engine and no build step. The stage is a fixed 1600×900 and scales to fit the window.
**v7 uses Magnus's art/design handoff** (`incoming/medieval_math_handoff/`, read-only; the files used are copied byte-for-byte into
`assets/v7/` by `tools/import_v7.py`) and follows `GAME_DESIGN.txt` for the rules. Anything without approved art is still an
ink-outlined placeholder box: see **MISSING_ART.md** for the list Magnus can paint.

## Run
- **Use the local server:** `python3 -m http.server 8799` in this folder (or double-click `Play.command` in the package), then open
  http://localhost:8799/ . Opened straight from disk (file://) the pictures are now identical (v10: all tinting is precomputed),
  but `audio_map.json` can't load there, so SFX/VO are silent; the tests expect the server (except `tests/file.test.js`).

**Controls (keyboard only):** every option shows its key in a box, and the options can also be clicked. **Z** = Spell of Stupidity (road / your turn / mid-sum; buys a scroll at a tavern or shop).
- **Title:** Enter starts or continues. With a save, N = new game, C = continue.
- **Intro:** Space or Enter shows the next bubble, Esc skips. Type your name, then Enter.
- **Something in the mist (fights):** Enter = commit to the fight (its strength is hidden until you do), A = avoid it (hunters +1; bosses can't be avoided).
- **Combat turn:** 1 = Weak (easy sum), 2 = Hard (hard sum, more damage), 3 = Heal (random sum, +2♥, 2 per fight), Z = Spell of Stupidity, S = sacrifice a knight to flee. Dragon: R = roll the D20, S = sacrifice (+3 to the D20).
- **A sum:** type the digits, Backspace deletes, Enter answers, Esc = back to the turn choice.
- **Riddle:** 1, 2 or 3; S = sacrifice a knight to skip. **Sacrifice menu:** 1–3 picks a follower, Esc cancels.
- **Recruit:** Enter = recruit (one sum). After a failed sum: D = D20 contest, N = forget it.
- **Frank the priest:** 1 = agree (fight the turd dragon), 2 = disagree (talk him down with one sum).
- **Tavern:** outside I = go inside, Enter = walk on. Inside: H/J heal, 1–2 recruit at the table (by maths), Q W E R / A S D F = sword / armour for party member 1–4, T / B = talk at the table / bar, X or Esc (or click the painted EXIT) = back outside, Enter = walk on.
- **Campsite / shop:** H heal, 1 recruit (by maths), A S D F armour (and Q W E R swords at the shop), Enter = break camp / walk on.
- **Music:** M mutes/unmutes, `[` `]` volume. **Graves:** nothing to press. **Game over:** Enter retries from the last rest stop, N = new game.

The on-screen number pad is off (`touchPad: true` in `src/config/layout.js` brings it back for a touch build).

## v11b-2: one-keypress tavern, recruit conversation, fare limits, v18 riddle keeper + friendly coif

**Clean = no clutter, not hidden options (Magnus).** The tavern shows the highlighted thing's options at once, one key each:
the sign → `1 Mead`, `2 Stew` (buy again without reopening); a recruit → `1 Join my party?`; the door → `1 Go outside`,
`2 Walk on`. ←/→ (A/D) move the highlight, Enter = the main action, Esc = go outside. No open/close step, no Back plaque.
Keypresses: enter the tavern **I** (sign already highlighted); mead **1**; stew **2** (each repeatable up to the limit);
recruit **→** (1-2×) then **1**, then type the sum + Enter; leave **Esc** then **Enter** (Walk on) or **→** to the door then **2**.

**Fare limits per tavern visit (TEMP_BALANCE, `src/data/reststops.js` → `tavern.limits`):** `mead: 1`, `stew: 2`,
`lot: "That's your lot."`. Counted per tavern stop (going outside and back in does not reset). At the limit the plaque greys
out and the barkeep says "That's your lot." (again if the key is pressed). Mead never stacks: at most one battle's effect,
waiting or running ("One mead at a time, love." if a mead is still waiting from an earlier tavern).

**Recruit conversation (Magnus: "join my party? and then math with his answer after"):** highlight a recruit → `1 Join my
party?` → hero bubble "Join my party?" → the recruit's challenge bubble (three per look, `KM_DATA.recruitTalk.challenge`)
→ the carved sum, big and centred. Right: "Fine, I'm in." (or a variant), he joins (+2 hearts), stands up and walks with
the party. Wrong: hunters +1, a refusal + "Roll me for it, then?" with `D Roll for it` / `N No` → the handoff's D20 contest.
Each candidate now has a look (`st.candSkins`, rotating through all 5 looks) and joins as that look.

**v18 pack (incoming/magnus_zip_1101/medieval-math-riddles-v18, START_HERE followed; tools/import_v18.py → assets/v18,
src/config/art_v18.js; wiring src/config/art_v18_apply.js):**
- **Riddle keeper + rock:** `riddle-keeper.png` is the bridgekeeper; `rock.png` is a separate foreground layer drawn
  right after him (background → keeper → rock → strip UI), never merged; the keeper is static (one drawing). Placement
  from the pack preview: keeper centred over the rock, his bottom 55 source px above the rock's foot line, rock foot on the
  ground. **Scale exception:** both at 0.386 × artScale (0.232 stage px/source px), the coif atlases' own density
  (atlas/source 0.386), so he stands ~304 stage px like the coif beside him in the pack preview (at plain artScale he
  would be ~755 px, taller than the 655 px road). The preview squashes the rock (x 0.304 / y 0.265); we keep it uniform.
- **Riddle answers:** in his `answer-frame.png`, 2 columns, keys **A B C** (+ **S Sacrifice** in the 4th slot; 1-3 still
  work silently). Frame drawn 51 px tall like the pack, ends at the pack's 0.509 width (160 px each), only the ink-free
  middle widens (740 px buttons) so 26-letter answers sit between the lines. Hit area 52 px, not 88: the strip is 240 px
  and the question frame sits above (riddle frame now 84 px tall = 0.122 stage/src). No "The keeper asks", no "Try again".
- `dialogue-frame.png` is byte-identical to the `riddle_frame.png` already used; `ground-math-divider.png` is the same drawing as
  `divider_line.png` re-cropped and stretched ×1.026, so ours stays; `hero.png` / `hills.png` are identical to files we have.
- **Friendly coif = companion look #5 (`follower_5`):** walk 12 × 100 ms and idle 8 × 300 ms (512 cells, pivot [256,480]);
  attack 150/180/90/260 ms, hurt 350 ms, death 200/350/130/1100 ms held (768 cells, pivot [384,680]); each clip its own
  sequence, cell and pivot. Per-clip calibration 1.0 for all (head ~88-91 atlas px in every clip; contact sheet
  screenshots/v18/coif_clips.png). Drawn at artScale like every atlas: ~276 stage px, 0.775 × the hero. Walk plays at the
  pack's 100 ms: his root motion (~60 atlas px/s) is slower than the road, so his feet slide (4.4× playback would match).
  No seated coif yet (stands at the table, MISSING_ART #43). Tests: `tests/v18.test.js`.

**Seated sprites (Magnus):** the 0.5 adjustment stays unless a pair is off by > 3 %; head/helmet AND shoulders measured
against the walk atlas on the alpha outline (source px): feather great-helm 279 vs 149 wide (0.534), 240 vs 126 tall
(0.525), shoulders 387 vs 200 (0.517) → per-pair **0.52**; scarf kettle-hat brim 355 vs 160 (0.451), hat 124 vs 56 tall
(0.452), shoulders 382 vs 225 (0.589): head and shoulders disagree (the seated sheet is broader-shouldered than the
hunched walk), the error-splitting compromise (0.515) is within 3 % → **0.5 kept** (head ~11 % big, shoulders ~15 %
narrow; source mismatch, for the pack's maker). Hips sit on a bench line 57 stage px above the floor (seat-contact rows
feather 1010, scarf 880, by eye ±15 px), table drawn in front, everything below the tabletop hidden. Gameplay-size
comparison: screenshots/v11b/seated_vs_walk_gameplay_1600x900.png (+ 1:1 crop). Linework at 0.5: ink coverage and
dark-stroke runs match the walks (35–37 % dark, median stroke 3 px both); hatching on the seated mail reads slightly finer.

**Voice-over:** the only VO with a file is `vo_further_than_ever` (Charlie's bard take 1, byte-identical to
takes/…take1.ogg, Vorbis 5.8 s). It was silent when the game is opened from disk: `audio_map.json` was fetched, and
browsers refuse fetch() on file://, so the map stayed empty. The map now also ships as `src/config/audio_map.js`
(tools/build_audio_map.py; re-run after editing the json); http still re-reads the json. Playback starts after the first
keypress (sticky user activation). It fires once per run when you pass your previous best distance, so never on the very
first run (GAME_DESIGN: "snapshot best distance at run start and trigger once when crossing it"). Its bubble reads
"Further than ever before!" while the recording says the older line. Every other VO hook (vo_intro_01–08,
vo_name_prompt, vo_after_name, vo_victory, vo_gameover_01–03, vo_spell_cast, vo_spell_wear_off, vo_member_dies) has
no file yet. `tests/file.test.js` checks the clip resolves and plays from file://.

**No skipping fights:** ordinary fights are mandatory (no Avoid; `combat.avoidable.math = false`). The only optional
fight is GAME_DESIGN's special encounter (Frank's turd dragon, seen on its hill): `1 Fight it (risky)` / `2 Talk him down
(safe)`; declining is the restraint sum (failure = hunters +1, per the doc).

**Feet on the ground:** ordinary foes stand ON the ground line from the moment they slide in from the right (grey until
the commit, strength hidden), never on the raised mid lane; the attack lunge no longer hops. Each drawing's pivot is
corrected by its measured foot gap (`src/config/feet.js`, tools/measure_feet.js: goblin 6.7, skeleton 7.8, enchanter 7.8,
black knight 90, hermit 2.2, rabbit −1.1 source px). The riddle keeper keeps his rock placement. `tests/feet.test.js`
checks every enemy frame's lowest pixel and every live sample (slide-in, approach, fight) within 3–4 px.

**Mouse:** scene hotspots show a pointer + the dashed ink highlight on hover and are used by a click: the doorway on the
tavern exterior (source rect [1670, 520, 270, 380] of reference_tavern_fullscreen) goes in (I still works); inside, the
sign swings / shows Mead + Stew, a recruit asks "Join my party?", the door goes outside. Hovering = highlighting.

**Sound hooks (no files yet; for the sound designer):** `step` on the hero's foot contacts (frames 0 and 4 of the
8-frame v13 walk; 0 and 6 for a 12-frame walk) → sfx/sfx_step_01–04.ogg; `swing_weak` / `swing_hard` at the party's
wind-up → sfx_swing_weak_01–03, sfx_swing_hard_01–03; `hit_weak` / `hit_hard` on the impact pose (+0.18 s) →
sfx_hit_weak_01–03, sfx_hit_hard_01–03; `swing_enemy` → sfx_swing_enemy_01–03; `hit_party` → sfx_hit_party_01–03;
`hit_blocked` → sfx_hit_blocked_01–02 (all under assets/audio/sfx/, list them in audio_map.json, re-run
tools/build_audio_map.py).

## v11b: battle layout from Magnus's mockup, heart rule, painted bubbles, sky, full-screen tavern, scroll stall

**Layout (incoming/magnus_art/layout_mockup_battle.png):** party hearts top-left of the scene (2 per member, no label, no
"2/2"), Magnus's purse + gold right under them, the hunter meter top-centre (orange dots joined by ink lines, an ink skull
for the hunters moving one dot per failed sum, a helmet for the party; no caption), distance top-right. The strip is
240 stage px (scene 660): "Choose your move." in large serif over one row of ink banner buttons (wax-seal key, small icon,
name): **1 Weak swing, 2 Hard swing, 3 Heal** (greyed when unavailable) and, after an ink divider, **Z Stupidity** (only
while you hold a scroll). The sum: the question is centred on the screen; typed digits appear to its right (no placeholder
line). The monster's hearts are small hearts above it in the scene (rows of 10). All scenery y moved down 90 layout units.

**Speech bubbles:** Magnus's painted "Speech left/right" (medieval-math-animation-pack-v2 art/sprites/ui-0.png, ui-1.png,
copied byte-identical by tools/import_v11.py) at source px x 0.6, 30 px text, max 2 lines in the 249 px text box, placed
to avoid heads, the HUD overlays, the dice and each other.

**Heart rule (Magnus):** hero 2 hearts, +2 per companion. Every 2 hearts lost in ONE battle a member dies horribly
(companions first, last-joined first; the hero only when no companion is left), hooks sfx `member_death` + VO
`vo_member_dies`; stand-in death = the hero's approved knight-death (MISSING_ART #7). Heal gives back battle losses.
TEMP_BALANCE: every enemy hits for 1; black knight 7 HP, skeleton 12 HP; hearts refill after a won fight; armour gives an
8 % block chance per level (max 40 %) instead of hearts. Save v6 (v5 -> v6: hp = 2 x party size).

**Sky:** Magnus's 6 clouds (clouds_sheet_6.png, 2 columns x 3 rows, already on transparent) and birds (birds_sheet_8.png,
2 rows x 4 frames) at source px x 0.6, behind the back layer. Clouds: an endless seeded row (per run seed), each cloud at
least 650 layout units after the previous one ends, the row drifting 9 layout units/s plus 0.08 x camera (the back
layer's rate), tops 110-250 (sky band); so they can never overlap, ~2 on screen. Birds: every 28-70 s (seeded) a single bird
(55 %) or a flock of 2-3 crosses at cloud depth (95-140 layout units/s + 0.1 x camera, band 150-330), flapping ping-pong
1-2-3-4-3-2 at ~9 fps with a slight bob. They are drawn on the canvas before the scenery, so speech bubbles and the meter
(DOM, top) are always above them. **Mist bands removed** (Magnus: "skip the mist gradients"); the ink/paper tint stays.

**Tavern, full screen:** tavern_interior_fullscreen.png (3532x1762) is the interior and reference_tavern_fullscreen.png
(3512x1764) the arrival exterior. One uniform scale puts each painting's floor ink line (rows 1195 / 1203) on the game's
ground line: 0.548 / 0.545 stage px per source px (= 0.914 / 0.908 x artScale), centred, ~168 / ~157 stage px cropped at each
side, drawn to the canvas bottom; the paper is graded to the strip parchment (per-channel gain); re-saved as optimised
lossless PNG (10.7 MB -> 7.3 MB, 10.2 MB -> 7.0 MB). Dropped: the v8 layered tavern (bar/table/stool layers, seat anchors,
bar slots, the small framed box) and the walk-to-the-door fade (I goes straight in). The camp keeps its v8 layered scene.
Opt-in preview for the v8 scenes / facade: `index.html?viewFit=cover&buildingMul=1.832` (off by default; question for Magnus).

**Tavern interior (Magnus: "you only see info on what you click on"; the open/close step below is SUPERSEDED by the one-keypress tavern in v11b-2):** the room fills the scene (cropped on the left so
the door stays in view); recruits sit behind Magnus's v8 tavern table (layers/props/table.png at source px x 0.6, everything
below the tabletop hidden). The strip is empty by default; Left/Right (or A/D) move a dashed ink highlight + a name bubble
between the tavern menu (Magnus's TAVERN FARE sign on the wall), each recruit and the door; Enter (or a click) shows only that thing's options
(menu: Mead and Stew plaques with prices; recruit: Recruit (a sum), Talk; door: Go outside, Walk on); Esc goes back (Esc at the top
= back outside). The side gear panel is gone from the tavern (gear is bought at the shop).

**Divider:** Magnus's divider_line.png (already on transparent, trimmed) replaces the CSS / strip_bg divider in every scene:
26.5 stage px under the ground line, ornament centred on x 800 (the centred question), one uniform scale 0.742 stage px per
source px (1.237 x artScale) so it spans 98.1 % of the width like reference_composition_divider.png.

**Roadside scroll stall:** new rest type `stall` (rotation tavern, stall, campsite, shop): scroll_stall.png in front of
scroll_seller.png (his lower body hidden by the counter), sizes from reference_scroll_stall.png against the knight: stall
0.630 stage px/source px (1.05 x artScale), seller 0.328 (0.546 x artScale); one shared factor is impossible because the two
sheets are painted at different pixel scales. Z buys a scroll (also at the tavern and shop). Magnus's spell icon
(spell_stupidity_icon.png) is used on the Stupidity button, the active countdown, the scroll for sale and the cast bubble.

## v11: speech bubbles, no small text, Spell of Stupidity
Magnus: *"it is way too much small text … clear simple speech bubbles, and absolute destruction of unnecessary small texts"*,
then *"Add the spell of stupidity. It lowers the difficulty. For a while."*

**What changed**
- **Every line of dialogue is a speech bubble above its speaker in the scene.** This covers the narrator dragon, enemies,
  riddlers, recruits, Frank, the hunters, graves, the shop keeper, the bartender / Old Wally (their bubbles point at the bar / the fire
  until their art exists) and party chatter.
  - Bubbles use 30 px Georgia on the 1600×900 stage, with at most 2 short lines (≤ 460 px wide), 36 px line height and 20/12 px padding.
  - They have a parchment fill (#f6ebcf), a 3 px ink outline, rounded corners and a tail pointing at the speaker's head.
  - Long text is split into several bubbles shown one after another, never shrunk. Each bubble is split by sentence, and short sentences share a bubble.
  - A bubble stays up for 2.2 s + 0.06 s per character, capped at 5.5 s (`KM_LAYOUT.speech`).
  - A question (riddle, recruit offer, Frank, approach, sacrifice) keeps its last bubble up while its choice is open.
  - The intro waits for Space.
  - Each speaker has one bubble at a time.
  - Placement avoids other bubbles, the dice, the toast and every character's head. The tests check: bubbles never overlap, never cover a head, ≥ 28 px, ≤ 2 lines, and stay inside the scene.
- **The strip now holds only three kinds of thing:** the big carved sum, a few large key options (36 px, key first, e.g. `1 Weak  2 Hard  3 Heal`), and one icon status row.
  - Nothing in the strip is under 28 px; the test fails on any smaller text.
- **The status row (icons + big numbers, no words):** ♥ hearts, a gold coin with the amount, the Spell of Stupidity (just the ✶ icon while you hold at least one scroll; nothing at 0 scrolls), the King's hunters track, and ⚐ leagues travelled.
  - The hunters track is ♞ + 12 blocks, filled = closed in, + ⛨ = you.
  - A struck-through ♪ appears only when the music is muted.
- **The Spell of Stupidity** (`src/data/spell.js`, every number marked TEMP_BALANCE):
  - You start each new game with **1 scroll**. More scrolls can be bought for **5 gold** at taverns and shops (Z there; max 9).
  - **Z casts it:** on the road, on your turn in a fight (the panel shows `Z ✶ Spell`), or while a sum is open, which turns that sum stupid too.
  - The **next 5 sums** use the new `stupid` maths level: single digits, + and − only, never negative (e.g. `6 − 3`, `1 + 2`). Then it wears off.
  - A fight won with any stupid sum pays **half gold** (TEMP_BALANCE, rounded down). Riddles are unaffected.
  - Casting: the hero says, in one bubble, e.g. "Your brain goes soft and warm. Lovely." A ✶ floats up.
  - **Shown only when you hold a scroll** (Magnus: "either you have a spell or you don't"): the status row shows just the ✶ icon (no key badge, no count) and the choice row shows `Z ✶ Spell`. At 0 scrolls both are hidden completely, with no greyed-out option. The choice option is also hidden while a spell is already running. There is no on-screen countdown of the remaining easy sums any more.
  - Wearing off: "Ow. My brain is back. Sums are hard again."
  - With no scroll left, Z gets "No scrolls left. I'll have to think. Ugh." Casting again while it is active gets "Steady on. I'm already quite stupid enough."
  - Hooks (silent until files are added to `assets/audio_map.json`):
    - sound events `spell_cast` / `spell_wear_off`
    - VO ids `vo_spell_cast` / `vo_spell_wear_off`
  - **Why Z and not S:** S is already Sacrifice in fights and riddles, and armour for party member 2 at rest stops.
  - **Save:** run save `version 5`. The **v4→v5** migration adds `spells: 1, spellLeft: 0` (also to the checkpoint) and keeps all progress (tested with a v4 save holding 77 gold).
- Art sizes, the tint, the walks and the foreground are untouched.

### v11 text inventory: every text the game showed, and what was done to it
| State | Text in v10 | v11 |
|---|---|---|
| Title | "Scruffy Knights & Sums" (h1) | kept (72 px) |
| Title | tagline "a quest of the mind · no phones · no help · just play" | **removed** |
| Title | `[Enter] continue` / `[N] new game` small option lines | large options `Enter Continue  N New game` |
| Intro | speaker label "Little Dragon" (17 px italic) | **removed** (the bubble's tail shows who speaks) |
| Intro | 8 narrator lines typed out in the strip (34 px) | **speech bubbles** above the narrator; long lines split; Space = next bubble, Esc = skip |
| Intro | corner captions `[Space] next` `[Esc] skip` (15 px) | large `Space ▸  Esc Skip` |
| Name entry | "What's your name?" prompt text in the strip | **bubble** from the narrator; the strip only has the big name field (56 px) + `Enter ✓` |
| Name entry | "{name}? Really? …" reply | **bubbles** |
| Walking | HUD row (14 px): "Sir Name", ♥ row, "12 gold", "power 3", "party 2/4", "1.6 leagues", hunters dots, road icons "· · ⚔ ·", "♪ 70% [M]" | **replaced** by the icon row (♥ icons, coin + number, hunters track, ⚐ distance); name, power, party count, road dots and music % **removed** |
| Walking | "on the road…" / "next: Tavern" lines | **removed** |
| Walking | boss banner "Mid-boss: something big blocks the road" (44 px) | hero **bubble** "Something big blocks the road!" |
| Walking | "paying respects…" at graves | **removed** (the bow + the grave's bubble say it) |
| Walking | grave epitaph bark (1 line, cut) + full text in the strip | full epitaph as grave **bubbles** (split) |
| Walking | "further than ever" narrator line in the strip | **removed**; the big scene toast + VO stay |
| Hidden strength | "something waits in the mist · strength unknown" fine print | **removed**; hero bubble "Something lurks in the mist..." (bosses: "It blocks the whole road. No way around!") |
| Hidden strength | `[Enter] commit to the fight` `[A] avoid it (hunters +1)` | `Enter Fight  A Avoid` |
| Combat | "Goblin · ♥♥♥♡ · hits 1 ♥ · your power 3" fine print | one big enemy ♥ row only |
| Combat | `[1] weak swing · easy sum · 2 dmg`, `[2] hard swing · hard sum · 5 dmg`, `[3] heal · random sum · +2 ♥ · 2 left`, `[S] sacrifice a knight to flee` | `1 Weak  2 Hard  3 Heal` (+ `Z ✶ Spell`, `S Sacrifice`); Heal greys out when used up |
| Combat | result messages ("Wrong! The goblin hits you for 1") (17 px) | **removed**; enemy **bubble** "Wrong! It's 42!" + floats (−2, −1 ♥) |
| Combat | enemy taunts / defeat lines (one-line barks) | **bubbles** |
| Math | title "weak swing · easy sum" above the sum | **removed** |
| Math | the carved sum + answer slot | **kept**, the focus of the strip |
| Math | hint "type your answer · enter to strike" (13 px) | **removed** |
| Math | `[Esc] back` caption | **removed** (Esc still goes back) |
| Math | wrong-answer message under the sum | **removed**; the corrected sum is shown carved (`19 − 9 = 10`) and the enemy says it |
| Riddle | "The Bridgekeeper: Stop! Answer me this question…" taunt + "The Bridgekeeper asks" + the question in the strip | the question as a **bubble** from the riddler, straight away, staying up until answered; the taunt is **dropped** (it delayed the question by ~5 s). **v11b: superseded**: question in the riddle frame in the strip, short taunt bubble only |
| Riddle | three choice lines (22 px) | three big options `1 …  2 …  3 …` (34 px); a wrong one is struck through |
| Riddle | "Wrong: the hunters gain a block. One more try." | **removed**; the riddler's bubble repeats the question |
| Recruit | "Sir X · trait · power +2" fine print + "\"Prove you can count and I'll follow you anywhere.\"" + `[Enter] recruit (one sum)` `[N] no thanks` | candidate **bubbles** (their join line + "Prove you can count. Then I'm yours."); `Enter Recruit  N No` |
| Recruit | "Your party is full (4 including you)." | **removed**; candidate **bubble** "Full party? Bah…"; `Enter Walk on` |
| D20 contest | "D20 contest · rolling…" + "you vs X" + result sentence | **removed**; the dice roll in the scene; the candidate / new member speaks the result |
| D20 contest | offer paragraph | candidate **bubble**; `D Dice  N No` |
| Mega boss D20 | "rolling the D20…", "base + ? vs 30", flavour + "rolled N" | **removed**; after the roll the strip shows the carved `power + roll = total`; the hero / dragon speaks the outcome |
| Mega boss | `[R] roll the D20 · need 14+`, `[S] sacrifice a knight (+3 to the D20)` | `R Roll ⚀ 14+`, `S Sacrifice` |
| Frank | "Frank the Priest · on the hill: a turd dragon (strength unknown)" + question + 2 long options | Frank's **bubble**; `1 Fight it  2 Talk him down` |
| Sacrifice | "Who takes one for the team?" + rows "Sir X · power 3" + `[Esc] cancel` | hero **bubble**; `1 Name  2 Name …  Esc Cancel` |
| Sacrifice | the sacrificed knight's farewell, the enemy reaction | **bubbles** |
| Hunters | "The King's Hunters: There they are! …" in the say-line | hunter **bubble** |
| Hunters | "hunters +1" floating number | **kept** (46 px) |
| Tavern outside | narration paragraph about the tavern + options | **removed**; `I Go in  Enter Walk on` |
| Rest stops | stop name + keeper greeting paragraph | keeper **bubble** (shop keeper on the road; bartender → bar, Old Wally → fire) |
| Rest stops | heal lines "[H] bowl of stew (+2♥) · 4 gold" | `H Stew +2♥ ●4` (short label, heart, coin icon) |
| Rest stops | recruit lines "[1] Sir Gerald the Mostly Brave · power 2 · one sum" | `1 Gerald` |
| Rest stops | gear table header "sword (6g) / armour (6g)" + per-member rows "Sir X  [Q] sword 1/3  [A] armour 0/3" | a column per member (first name) and two icon rows `⚔ ●6` / `⛨ ●6` with `Q ○○○` / `A ●○○` pip buttons |
| Rest stops | messages ("Sir X looks marginally less scruffy.") | keeper **bubbles** ("Sir X! Marginally less scruffy.") |
| Rest stops | talk lines `[T] talk at the table` `[B] talk at the bar` | `T Table  B Bar`; the answers are **bubbles** |
| Rest stops | `[X] leave` `[Enter] walk on / break camp` | `X Leave  Enter Walk on / Break camp` |
| Rest stops | (new) | `Z ✶ ●5` Spell of Stupidity scroll at taverns and shops |
| Status row | (new) spell `Z ✶ 1` / countdown pips | just the ✶ icon while holding ≥ 1 scroll; hidden at 0 |
| Death | "Sir X has fallen…" | **removed** (the drawn death says it) |
| Game over | h1 "Game over" | kept |
| Game over | narrator line in the say-line + "Killed by X · 3.2 leagues · best 4.0" + "correct 12 · wrong 3 · knights sacrificed 1" | narrator **bubbles** ("Killed by a rabbit. …"); one big line `⚐ 3.2 leagues` (+ `★ best`); stats **removed** |
| Game over | `[Enter] retry from the last rest stop` `[N] new game` | `Enter Retry  N New game` |
| Victory | "Victory, Sir X!" + "Your journey: N leagues · a new best!" + stats fine print | `Victory!` + big `⚐ N leagues ★ best`; stats **removed**; narrator **bubbles** |
| Floats | "−2", "−1 ♥", "+2 ♥", "+12 gold", "Gerald joins!", "hunters +1" | **kept** (46 px bold, short) |
| D20 | "you" / "them" labels on the contest dice (34 px) | kept |
| Placeholders | 22 px name caption under every placeholder box | **removed** (the box label stays until the art exists) |
| Music | "♪ 70% [M]" in the HUD | **removed**; only a struck ♪ while muted (M and [ ] still work) |

## v10: v13 walks, v11 foreground strips, tint fixed for file:// (pack_v13)
Read: `incoming/pack_v13/START_HERE.txt` (use walks **v13** only; v10 rejected, v12 lacks the pelvis/upper-body fix; foreground
strips unchanged in v11), `medieval-math-walks-v13/README.txt` + `*-animation.json` + `rigs/*.json` + `runtime.js` + `VALIDATION.json`,
`medieval-math-biomes-v11/README.txt` + `manifest.json` + `choose-strip.js` + `VALIDATION.txt`, and the handoff's
`layer-stack.json` / `GAME_DESIGN.txt`. `tools/import_v10.py` copies the files byte-for-byte into `assets/v10/` and writes
`src/config/art_v10.js`; `src/config/art_v10_apply.js` wires them.
- **Walks:** hero (replaces the 'stripe' stand-in) and the four companions (follower looks 1-4 = scarf, feather, moustache,
  stripe) use the README's ENGINE format: one 6144x768 atlas each, eight 768x768 keys x 125 ms, looping 1 s, pivot [384,680],
  measured standTop. (`runtime.js` is the pack's "live engine-neutral Canvas reference"; the atlases are its engine export, and
  they keep the game's frame-by-frame drawing path.) Size = atlas px x the one global 0.6 (the pack baked its rig scales in).
  **Travel speed** (README: rootMotionSpeed x display scale x playback rate): the road moves at the hero's root motion at
  playback 1.0 = 235.64 x 0.6 = 141.4 stage px/s (walkSpeed 212 layout u/s, was 420: the walk is slower, by the book); the
  companions play at 0.897 so their 262.73 px/s root motion matches the same road (no foot sliding). The procedural bob is off
  for them. **Limitations (README):** walk only. Standing = the walk's first key (both feet planted) held; no idle / attack /
  heal / hurt drawings (combat lunges stay procedural); the hero's death is still the approved knight-death atlas.
- **frontGround:** the 12 v11 strips (2172x300, ground line y=270 on our ground line 893), at source px x 0.6, parallax 1.0
  (layer-stack front), tiled with `choose-strip.js` exactly (`visible()` positions, `choose(biome, tileIndex, runSeed)`,
  seed = hash of the saved run id, so it is stable across redraws, saves and revisits). Drawn **above the actors, below the UI**
  (the strips' README/manifest `z: above-actors-below-UI`, "low enough for boots overlap"; layer-stack.json lists frontGround
  just before the party, the newer strip README wins). Same paper treatment as all scenery (paper -> parchment, white never
  made transparent). **Biomes:** fields/village -> meadow, near-forest (and tree-props) -> forest, canyon -> rocky,
  barren-rocks -> rocky or tundra (no tundra mid strip exists, so tundra is a variety option there, stable per tile).
- **Parallax** now uses layer-stack.json: back 0.08 (castle, hills, distant woods; were 0.03/0.07/0.14), mid 0.3 (was 0.42), front 1.0.
- **Tint fix:** the mismatch Magnus saw is the file:// fallback: opened from disk, a canvas cannot read pixels back
  (tainted), so v9 silently drew every strip/tree paper-WHITE and the strip below as a flat colour band (reproduced:
  `screenshots/16_file_protocol_v10.png` is now correct). v10 precomputes the ink layers, glyph inks and divider ink offline
  (same maths, `tools/import_v10.py` -> `assets/v10/ink/`, within 3.2 levels of the browser result) and paints the strip's
  parchment into a canvas instead of a data URL, so file:// and http:// look identical. Re-check against the references:
  our parchment was a little yellower than the reference paper (median 221,194,159 vs 222,197,166), so the parchment/sky
  are graded per channel (x1.0045, 1.0155, 1.044; `assets/v10/paper/`, `tint.paperGrade: false` restores the painted tone),
  and the camp / tavern layers get the same gain so they stay in tone with it. The tavern facade on the road gets the
  scenery paper -> parchment treatment (its walls were paper-white against the parchment).
  Glyph slices: slivers of neighbouring glyphs caught in the v7 slices (e.g. left of the 1) are dropped from the ink.
- Tests: `tests/play.test.js` adds the v10 checks (walk size/timing/speed, foreground joins/seed/tint, offline==browser ink),
  `tests/file.test.js` runs the game from file://. Proofs: `screenshots/v10_vs_reference.png`, `v10_walks.gif`,
  `v10_walks_stripe.gif`, `v10_walks_strip.png`, `v10_biome_*.png`, `v10_fg_join_crop.png` (tools/v10_capture.js + v10_assemble.py).

## v9: one continuous parchment (Magnus approved the tint)
The parallax strips and trees have opaque paper-white interiors (~#FBF8EB). They are now drawn so that their paper becomes the parchment, like the reference. Sizes are unchanged (source px × 0.6), and the characters do not go through this.

How the strips and trees are drawn (`src/engine/scenery.js`):
- **Paper white:** each image's own paper white W is measured once, as the per-channel median of its bright, near-opaque pixels.
- **Ink separation:** a colour-to-alpha pass separates the ink: `a = (lum W − lum P) / lum W` and `ink = (P − (1−a)·W) / a`. Solid ink keeps its painted colour exactly.
- **Each frame:** the layer's silhouette (its original alpha) is filled with the exact parchment pixels behind the scene, then the ink is drawn on top. Per pixel, the result is `P + (1−a)·(parchment − W)`. Paper becomes the parchment pixel behind it, so there is no step where an opaque interior meets transparent surroundings.
- **Speed:** silhouettes and ink layers are resampled to stage size once. The parchment, mist and ground-fade layers are rendered once and only copied each frame.

The parchment itself:
- The parchment and sky crops were not seamless. Their darker vignette edges are left out, and each tile is made seamless once by cross-fading 240 / 80 source px of the far edge into the near edge. There is no mirroring and no stretching (`paper` / `skyPaper` in `src/data/scenery.js`).
- The sky's lower edge melts into the parchment.
- The mid strip's lower ink fades into the same parchment pixels; the old flat colour band is gone.

**Mist:** the rear mist is lowered from 0.55 to 0.30 and the front from 0.30 to 0.14. It is now made of the parchment pixels themselves, so it fades the ink with distance while the paper keeps the reference's even tone.
- I measured the reference's paper and it is flat from top to bottom. A white mist at these strengths made a milky band, about 4–9 levels lighter.
- GAME_DESIGN says "white gradient mist". The handoff's white was its paper colour, so parchment mist is the equivalent here. Add `color: "255,253,246"` to `rearMist` / `frontMist` to switch back to white.

The distant hidden-strength creature stays greyscale behind the front mist.

**Strip:** the HTML strip below the scene continues the same parchment tiles as the scene, so the whole 1600×900 stage is one continuous sheet.
- The painted ground divider (strip_bg rows 0–22) is laid on top as ink only.
- The old 174 px band and the flat CSS colour below it are gone. The flat colour is now only a fallback.

**Carved digits/operators:** the slices keep only their ink, via the same colour-to-alpha against their own paper (GIMP-style per channel, so the orange is kept). This removes the lighter boxes around each glyph. Glyph size is unchanged.

**Proof:**
- `screenshots/tint_check_vs_reference.png`: reference vs our combat screen in the near-forest biome.
- `screenshots/tint_edge_crop.png`: 1:1 crops of strip tops against the sky, back hills and village silhouettes, and the mid strip's bottom edge.
- `screenshots/tint_seam_crop.png`: 1:1 crop across the scene/strip boundary.
- `tools/tint_check.js` regenerates the capture.
- The play test checks that no scenery pixel is lighter than the parchment behind it (0 found), that the strips are tinted, and that the strip uses the continuous sheet.

## v8: art at its exact original size (Magnus)
**One global factor, nothing else:** every image is drawn at **source px × 0.6 = stage px** on the 1600×900 stage
(`KM_LAYOUT.artScale` in `src/config/layout.js`). There are no per-layer, per-character, per-prop or per-pose factors left.
These were deleted:
- castle 0.62, hills 0.75, woods 0.62, mid 0.72, midLane 0.55, trees 0.42, sky 1.25, the parchment tile fit
- the character box-fit heights, the sequence fit, facadeScale 1.2, the graves laneScale and the 0.8 second stone
- the rest-view party/candidate 0.6/0.72, the bartender 1.3, the EXIT 150-px fit, the D20 340-px size and the newt 0.35 shrink
- the 580/900 shrink of the art

Positions still use a 900-unit layout grid (unit → stage px = 600/900). Art is compensated (`KM_LAYOUT.art = 0.6 / k`), so the grid never changes an image's size.
The play test checks that every cutout and tree resolves to exactly 0.6 and that no `scale` key is left in the scenery data.

**Why 0.6:** this factor reproduces the reference composition (`locked-style-game-math-v2-glint.png`):
- the scene is the top 600 px (2/3; the reference divider sits at ~64%)
- the knight is ~415 px tall, ~69% of the scene (reference ~68%)
- the goblin is 478 px (reference ~76% of the scene) and the skeleton 528 px (reference ~94%)
- the 724-px parallax strips become 434 px, so the landscape fills the scene behind the characters

**Proof:**
- `screenshots/size_check_vs_reference.png`: the reference on the left, our combat screen on the right (1600×900 capture), both at the same height.
- `screenshots/size_lineup_1to1.png`: every character, sequence frame and grave at source × 0.6, standing on the ground separator.
- `tools/size_check.js` regenerates the capture and `screenshots/size_table.json`. `tools/size_lineup.py` regenerates the lineup.

| Asset | Source px | Drawn on the 1600×900 stage | Factor (w × h) |
|---|---|---|---|
| hero (companion-stripe.png) | 518×759 | 310.8×455.4 | 0.6 × 0.6 |
| follower_1 (companion-scarf.png) | 519×759 | 311.4×455.4 | 0.6 × 0.6 |
| follower_2 (companion-feather.png) | 518×759 | 310.8×455.4 | 0.6 × 0.6 |
| follower_3 (companion-moustache.png) | 518×759 | 310.8×455.4 | 0.6 × 0.6 |
| goblin (goblin.png) | 609×797 | 365.4×478.2 | 0.6 × 0.6 |
| black_knight (black_knight.png) | 1024×1536 | 614.4×921.6 | 0.6 × 0.6 |
| skeleton_knight (skeleton.png) | 584×887 | 350.4×532.2 | 0.6 × 0.6 |
| enchanter (warlock.png) | 474×724 | 284.4×434.4 | 0.6 × 0.6 |
| hermit (scholar.png) | 389×506 | 233.4×303.6 | 0.6 × 0.6 |
| frank (friar.png) | 350×452 | 210×271.2 | 0.6 × 0.6 |
| grave_rabbit (grave-rabbit.png) | 525×749 | 315×449.4 | 0.6 × 0.6 |
| grave_dragon (grave-dragon.png) | 524×749 | 314.4×449.4 | 0.6 × 0.6 |
| grave_toad (grave-toad.png) | 525×749 | 315×449.4 | 0.6 × 0.6 |
| grave_goblin (grave-goblin.png) | 524×749 | 314.4×449.4 | 0.6 × 0.6 |
| sequence knight_death cell | 768×768 | 460.8×460.8 | 0.6 × 0.6 |
| sequence rabbit_idle cell | 768×768 | 460.8×460.8 | 0.6 × 0.6 |
| sequence rabbit_hit cell | 768×768 | 460.8×460.8 | 0.6 × 0.6 |
| sequence rabbit_death cell | 768×768 | 460.8×460.8 | 0.6 × 0.6 |
| parallax castle | 2172×724 | 1303.2×434.4 | 0.6 × 0.6 |
| parallax hills | 2172×724 | 1303.2×434.4 | 0.6 × 0.6 |
| parallax distant-woods | 2172×724 | 1303.2×434.4 | 0.6 × 0.6 |
| parallax village | 2172×724 | 1303.2×434.4 | 0.6 × 0.6 |
| parallax tree-props | 2172×724 | 1303.2×434.4 | 0.6 × 0.6 |
| parallax near-forest | 2172×724 | 1303.2×434.4 | 0.6 × 0.6 |
| parallax barren-rocks | 2172×724 | 1303.2×434.4 | 0.6 × 0.6 |
| parallax canyon | 2172×724 | 1303.2×434.4 | 0.6 × 0.6 |
| parallax fields | 2172×724 | 1303.2×434.4 | 0.6 × 0.6 |
| tree 0 | 580×709 | 348×425.4 | 0.6 × 0.6 |
| tree 1 | 713×681 | 427.8×408.6 | 0.6 × 0.6 |
| tree 2 | 277×701 | 166.2×420.6 | 0.6 × 0.6 |
| tree 3 | 476×701 | 285.6×420.6 | 0.6 × 0.6 |
| sky | 1774×230 | 1064.4×138 | 0.6 × 0.6 |
| parchment tile | 1774×247 | 1064.4×148.2 | 0.6 × 0.6 |
| rest scene camp (all layers) | 1774×887 | 1064.4×532.2 | 0.6 × 0.6 |
| rest scene tavern-interior (all layers) | 1774×887 | 1064.4×532.2 | 0.6 × 0.6 |
| tavern facade crop | 1040×558 | 624×334.8 | 0.6 × 0.6 |
| d20 cell | 512×512 | 307.2×307.2 | 0.6 × 0.6 |
| strip_bg (CSS) | 1774×290 | 1064.4×174 | 0.6 × 0.6 |
| glyph 7 (DOM) | 177×190 | 106.2×114 | 0.5999 × 0.6 |

The glyph width reads 0.5999 only because the browser lays it out at sub-pixel precision. Every sequence cell and frame uses the same 0.6.

### What genuinely can't fit at 1:1 (shown honestly, not secretly scaled)
1. **Black Knight**: the figure is 1529 source px → **917 stage px**, taller than the whole 900 stage and the 600-px scene. In the game his head and shoulders run off the top of the scene, which is literally 1:1. He needs a smaller source (the other characters are 423–880 px) or Magnus's OK for a different size.
2. **Knight death sequence vs the hero stand-in**:
   - The drawn death frames show a 495-px knight (297 stage px). The v6 companion "stripe" that stands in for the hero is 692 px (415 stage px).
   - At 1:1 the knight therefore looks ~28% smaller while he dies.
   - The packs were painted at different pixel scales. Fix on the art side: an approved hero idle/walk at the death atlas scale, or the death frames at the companion scale.
3. **Layered rest scenes (camp / tavern interior, 1774×887)**:
   - They are drawn at 1:1 × 0.6 = 1064×532: centred, with their own ground line on ours, clipped there, and inside an ink frame.
   - They no longer fill the 1600 width. The world scenery shows around them.
   - The pack's depth proof puts a ~216-px knight in the camp, so the scenes are painted at ~1/3 of the character cutouts' scale. 1:1 party members can't sit on the stumps or stools.
   - The party therefore stands on our ground line in front of the scene (left) and the recruits stand on the right.
   - Seated poses at scene scale are MISSING ART. The bartender slot is empty.
4. **Tavern facade on the road**: 1040×558 → 624×335. The painted door is 132 px tall next to a 415-px knight, so he walks to the door and fades (no shrink).
5. **EXIT sign art (2172×724)**: this would be ~1303 px wide at 1:1, so it is not drawn. [X]/Esc and the strip's "exit the tavern" option still work.
6. **Carved maths**:
   - The digit slices are 177×190 → 106×114 px, with operators at 60 px.
   - The reference shows its digits at ~240 px next to a ~395-px knight, so ours are about half the reference size relative to the characters. The slices were cut from the master at a smaller pixel scale than the cutouts.
   - Bigger digits need larger slices from Magnus. They are not upscaled.
7. **Graves (525×749 → 315×449)** are big on the hill lane and stand beside the party when it pays respects.
8. **The distant hidden-strength creature** is the same size as when it fights. It is only greyed and set behind the mist.

The stray green box at the top of the walking scene was the Little Dragon narrator placeholder flying off. It is now removed when the journey starts.

## v7: Magnus's handoff, what's in
- **World:** parchment + sky (clouds, birds), back strips (castle landmark placed once, hills, distant woods), mid biome strips (v11b: no mist bands)
  (fields → village → near forest → rocks → canyon, two tiles each), the hill lane (distant creatures + graves), a lighter **front mist**,
  roadside trees from the tree props, then the party. Feet stand on the painted ground line, which is also the scene/strip separator.
  All numbers in `src/data/scenery.js`. Old box obstacles/props/sky dragon are off (`world.boxScenery: false`) until there's art.
- **Party:** hero + up to 3 followers (GAME_DESIGN max 4). The hero is a STAND-IN (v6 companion "stripe"): there's no approved bucket-knight idle/walk yet.
  Followers use the scarf / feather / moustache companions, one skin each.
- **Hidden strength:** fights first appear small and grey on the hill lane in the mist. Commit → the creature steps forward in colour, its hearts and attack show, and only then the battle music starts.
- **Turn combat (GAME_DESIGN):** choose weak / hard / heal → solve → a surviving enemy takes its turn; a dead enemy never attacks.
  A failed problem: the action does nothing, the **hunters advance one block**, then the normal enemy turn (no extra penalty).
- **Hunters:** dotted pursuit track in the stats line (12 blocks). Full track = the hunters arrive and the run ends (PROVISIONAL).
- **D20:** Magnus's 20 roll atlases (40 frames × 50 ms, settle at 1.6 s). The result is chosen first, then `roll-to-N` plays once and holds. Dragon: power + d20 (+3 per sacrifice) vs 22. Recruit contest: your d20 vs theirs.
- **Recruiting by maths** everywhere (ditch, tavern table, camp wanderer, shop sellsword); a failed sum = hunters +1 and the offer of a D20 contest.
- **Frank:** agree = fight the turd dragon (box); disagree = a restraint sum → "No, Frank. No turd dragons today."
- **Rest stops:** tavern = painted facade + dark door backing on the roadside, the hero steps into the doorway, then the **layered interior** (table + bar talk points, bartender slot, EXIT sign). Campsite = **layered camp scene** with the party at the four seat anchors. Shop = boxes (no art).
- **Deaths:** the hero plays the **approved drawn knight death** (5 drawings, per-frame holds, last frame held, no tweening). The rabbit uses its drawn hit and death frames (corpse stays). Others have no drawn death yet, so they hold a moment and vanish in 3 hard steps (no puppet falls).
- **Graves:** each death records killer, encounter, run id; the grave stands on the hill lane just before the encounter that killed you, with the killer's emblem (rabbit / dragon / goblin / toad art; others are labelled boxes). The epitaph adds "Killed by …".
- **Further than ever:** once per run, when you pass your best distance: scene toast "You're venturing further than you ever have, you clever thing." + the narrator line in the strip + `vo_further_than_ever`.
- **SFX:** Charlie's blacksmith set in `assets/audio/sfx/` (files untouched): `correct` → sfx_correct_01..03 (anvil strikes), `wrong` → sfx_wrong_01..03 (clunk, mis-hit, quench hiss), random pick, never the same file twice in a row (`assets/audio_map.json`).

### Provisional choices (not decided by GAME_DESIGN or chat; all easy to change)
- **Temporary balance** (`src/data/combat.js`, `TEMP_BALANCE: true`): weak = 3 + power/4, hard = 2×weak + 1, heal +2♥ ×2 per fight; goblin 6/1, rabbit 5/1, black knight 9/1, skeleton 18/2, turd dragon 10/1, dragon 30/2 (HP/attack); dragon power 22 on a D20; hunters 12 blocks, avoid costs 1.
- Hunters catching you = run over (killer "hunters"); they never fall back.
- Riddles: a wrong answer moves the hunters (instead of the old heart cost); still one more go, then pass with nothing.
- Party max 4 incl. the hero (GAME_DESIGN) replaces the chat's "hero + 4"; old saves send extra followers home (`leftParty`).
- Recruit contest: single d20 each, ties re-rolled before showing. Frank: a failed restraint sum = he charges and you must fight; Frank never joins.
- Graves: only run-ending player deaths make graves; the killer does not respawn at its grave; a shared grave shows the latest killer's emblem.
- Rest views: characters stand beside seats (no seated poses), the bartender is a box behind the bar, the camp keeper has no slot.
- Impulsive party members engaging on their own (GAME_DESIGN idea) is not implemented.

**Size:** `assets/v7` is ~218 MB (dice atlases alone ~169 MB, ~8 MB each, loaded only when that roll happens) + ~57 MB music.

## Screen layout (v3)
The layout follows Magnus's concept: the scene on top, a divider line, and the engraved number strip below. It is all set in **`src/config/layout.js`**:
- **Scene (top, 1600×600 since v8):** the scrolling world, characters, art and **one-line bark bubbles only**. Barks are cut to `bark.maxChars` (44). The full line always appears in the strip's speaker line.
- **Strip (bottom, the remaining 300 px):** the divider band, then a quiet one-line stats line in the bottom-left corner (name, hearts, gold, strength, party, road progress). The centred main UI holds all text and interactive UI, in plain text on parchment (no boxed buttons or panels):
  - the speaker line
  - intro and dialogue text, and name entry
  - the sum, written large and centred, with an underline answer slot. Engraved glyph slots apply to both. The digit pad and operator row only appear with `touchPad: true`.
  - riddles with 3 choices
  - the sacrifice menu
  - recruit prompts
  - dice choice and result text (the die itself rolls in the scene)
  - rest stops (heal, recruit, gear)
  - the road status and boss announcements while walking
  - title, game over and victory
- To change the split, change `scene.h`. 560–600 all work. The strip takes the rest automatically.

### How art maps into the scene
**v8:** every image is drawn at **source px × `KM_LAYOUT.artScale` (0.6)** in stage px, whatever its kind; see "v8" above. Positions (feet lines, x slots) use a 900-unit layout grid drawn with `k = scene.h / artSpaceH` (600/900), and art sizes compensate for `k`. The older notes below describe that grid.

So a stage-px anchor `(x, y)` lands at `(x·k, y·k)` in the scene area. The visible scene is `viewW = 1600/k ≈ 2483` scene px wide, so a 2400×900 panorama spans roughly the whole view. Parallax layers are fitted to the 900 height and tiled. The feet line is `groundY` 820 in `src/data/world.js`. Box placeholder sizes are in the same scene px.

### Skinning the strip
`KM_ART.ui.strip_bg` takes a parchment background (1600 × strip height, tiled horizontally) and `KM_ART.ui.divider` takes the ornamental rule. Each accepts `{ art: "topic:id" }` (cutout or background from a pack) or `{ img: "assets/..." }`. When a slot is empty, a CSS parchment fill and a drawn double rule with a centre diamond are used.

## The loop
Road (`src/data/encounters.js` + auto rest stops): goblin → tavern → riddle → killer rabbit → campsite → recruit → skeleton (mid-boss) → shop →
Frank (special) → riddle → black knight → tavern → riddle → goblin → campsite → dragon (mega). Rest stops are the checkpoints.
See the v7 section above for how each stop plays.

## Files
v7 additions: `src/data/combat.js` (turn combat, hunters, D20, TEMP balance), `src/data/scenery.js` (parallax, mist, lanes, view scales),
`src/engine/scenery.js` (parallax + mist renderer), `src/engine/d20.js` (D20 atlas player), `src/engine/restview.js` (layered camp/tavern scenes),
`src/config/art_v7.js` (GENERATED by `tools/import_v7.py`: paths, anchors, sequences, scenes), `src/config/art_v7_apply.js` (which entity uses which art),
`assets/v7/` (copied handoff art + `IMPORT_LOG.txt`), `assets/audio/sfx/` (Charlie's SFX + NOTES.md), `MISSING_ART.md`.

```
index.html, style.css
src/config/layout.js       ← screen split (scene / strip), scene-space scale, bark length
src/config/art_config.js   ← ONE place mapping entity ids → art (with box fallback), glyphs, strip skin, parallax layers
src/data/                  ← content, no engine code
  dialogue.js  encounters.js  enemies.js  knights.js (recruit pool)  reststops.js  graves.js  music.js  riddles.js (16)  math_levels.js  world.js
src/engine/
  assets.js   art-pack loader + drawEntity (feet-anchored) with box fallback
  world.js    parallax layers (art panoramas tiled, else procedural boxes)
  road.js     builds the road: encounters + auto-inserted rest stops
  save.js     localStorage, versioned schema + migrations (run save + profile)
  audio.js    sound hook points + voice-over → assets/audio_map.json
  music.js    music system (scenes, crossfades, shuffle, ducking, mute/volume)
  mathgen.js  problem generators
src/game.js                 state machine, camera, encounters, UI, rendering
assets/audio/music/<cat>/    Magnus's soundtrack (ascii names); originals in incoming/music_v1/
assets/audio_map.json       event → files (all empty = silent hooks); files go in assets/audio/
assets/v1/_example/         template topic json (not loaded)
tests/play.test.js          full headless playthrough + save-migration check (zero page errors required)
tests/graves.test.js        graves, respects, further-than-ever, VO hooks, profile migration, deaths cap
tests/artpack.test.js       loader test using tests/fixtures/v1/testpack (needs the static server)
screenshots/                captures from the tests
versions/v1..v6/            frozen snapshots
```

## Plugging in art
Art comes as transparent PNG cut-outs in versioned folders `assets/v<N>/<topic>/`, each with a `<topic>.json` (see `assets/v1/_example/_example.json`):
- **backgrounds:** `{ id: { file, size: [1600 or 2400, 900] } }`. These are tiled horizontally as parallax layers.
- **cutouts:** `{ id: { file, size, anchor: [x, y] } }`. The anchor is the **bottom-centre feet point** in image px. `hotspots` are kept as well.
- **animations:** `{ action: { frames: ["anim/<char>/<action>_1.png", ...], order, ms, loop, anchor } }`
- **placements:** `{ id: { x, y, scale } }`. A cutout's `scale` is used unless `art_config.js` sets its own.

To use a pack:
1. Add `"assets/v1/<topic>/<topic>.json"` to `KM_ART.packs` in `src/config/art_config.js`.
2. Point entities at it, e.g. `hero: { art: "knights:hero", anims: { walk: "knights:walk", idle: "knights:idle" }, box: {...} }`.
3. Point layers at it, e.g. `mountains: { art: "road:mountains" }`.

**Scale (v8):** none per item. Pack `placements[id].scale` and `art_config` `scale` are ignored for art. Art is source px × `KM_LAYOUT.artScale`, and only placeholder boxes use their box size.

**Art slots added in v5:** `follower_1`…`follower_5` (recruit looks), `tavern`, `campsite`, `shop` (exteriors) with `tavern_keeper`, `camp_keeper`, `shop_keeper`, and `grave` / `grave_furthest`.

**Action slots** (`anims` keys): `idle`, `walk`, `attack`, `hurt`, `fall`, `respects` (bow/kneel at a grave; fallback = a small bow/dip). Attack plays on a correct answer (hero) or a wrong one (enemy). Hurt plays on whoever got hit. When a slot is missing, a procedural fallback runs: attack = lunge, hurt = red flash/blink + shake, fall = topple. The `attack` and `hurt` sound hooks fire too.

**Engraved digits:** `KM_ART.glyphs` has slots `digit_0`…`digit_9`, `op_plus`, `op_minus`, `op_times`, `op_divide` and `op_equals`. Each takes `{ art: "numbers:digit_7" }` or `{ img: "assets/..." }`. They are used by the sum display, the answer box and the number pad. Without art they fall back to text.

**Props** sit in a back lane (`propLaneY`/`propScale` in `src/data/world.js`). They are never placed where the party or an encounter stands at a halt, or on an obstacle. **Speech bubbles** are laid out each frame to avoid the HUD, panel, die, other characters and each other.

Anything missing falls back to its box. Entities are drawn with their feet on the road line (`groundY` 820 scene px in `src/data/world.js`). The engine animates the actions `walk`, `idle` and `fall`.

## Voice-over
Any dialogue line in `src/data/` can be a plain string or `{ text, vo }`. The text always shows; `vo` is a clip id that plays through `KM.Audio.voice(id)` (one voice at a time) **only if** `assets/audio_map.json` lists a file for it, otherwise it is silent.
- **Ids so far:** dragon intro `vo_intro_01` … `vo_intro_08` (one per intro line, in order), `vo_name_prompt`, `vo_after_name`, `vo_gameover_01`…`03`, `vo_victory`, narrator `vo_further_than_ever`.
- **File naming:** `assets/audio/vo/<id>.ogg` (e.g. `assets/audio/vo/vo_intro_03.ogg`), then list it: `"vo_intro_03": { "files": ["vo/vo_intro_03.ogg"], "vol": 1.0 }`. To voice a new line, give it a new `vo_<scene>_<nn>` id and add a map entry.
- Like all audio, it needs the http server (file:// can't load `audio_map.json`).

## Music
Magnus's own soundtrack (24 tracks, used exactly as delivered, no re-editing). The originals stay in `incoming/music_v1/A knights quest/`; ascii-named copies live in `assets/audio/music/<category>/`. **Everything is assigned in `src/data/music.js`**: move a file between category lists, change a category's `vol`, or point a scene at another category.

| Category | Used for | Tracks (`assets/audio/music/…`) |
|---|---|---|
| `title` | title screen, dragon intro, victory | `world/quest_theme.mp3` |
| `world` | walking/travel, graves, riddles (ducked to 60%), recruit stops (75%) | `world/quest_theme`, `march_of_the_brave_1..3`, `march_of_the_pilgrim_1..2` |
| `battle` | normal math fights | `battle/brisk_battle_stomp_1..2`, `questing_march_1..2` |
| `wizard` | mid-boss (Skeleton Knight) and any future wizard (`enemyScenes`) | `wizard/the_wizards_march.mp3` |
| `heavy_boss` | dragon mega boss | `heavy_boss/steel_and_sorcery_1..2` |
| `tavern` | tavern rest stop | `tavern/off_with_their_heads_1..4`, `raise_a_cup_pass_it_round_1..2`, `raise_your_cup`, `rogue_with_a_steady_face_1..2` |
| `camp` | campsite rest stop | `camp/march_of_the_lonely_recorders_1..2` |
| `shop` | shop rest stop: camp tracks at `vol: 0.5` (no dedicated track yet) | (uses `camp`) |
| (silence) | game over | |

How it behaves (`src/engine/music.js`):
- **Scenes:** the game calls `KM.Music.setScene(...)`: `title`, `intro`, `walk`, `battle`, `boss`, `mega`, `riddle`, `recruit`, `rest_tavern|campsite|shop`, `gameover`, `win`. Fight music starts only when an encounter actually engages (not while it walks in); after the fight the road music comes back.
- **Crossfades:** `crossfade` (1.2 s) between categories, independent of game speed.
- **World music resumes** where it left off (`resume: true`). Fight, rest stop and boss categories start a fresh shuffled track each time (`resume: false`).
- **Shuffle:** each category shuffles its list, never repeats the track it just played (nor the one you just heard elsewhere), and rolls on to the next track when one ends.
- **Ducking:** music drops to `duckVoice` (30%) while a voice-over clip plays; riddles/recruits use the per-scene `duck`.
- **Autoplay:** browsers block sound until the first keypress or click, so music starts then (the title shows Quest Theme as soon as you press a key).
- **Settings:** volume (default `volume` 0.7) and mute are saved in the profile record and survive new games.
- **Size:** the full set is about **57 MB** of mp3. The sibling panda game's single-file build has a 25 MB limit, but this game is not single-file: the tracks stream from `assets/` (file:// or the local server both work; `python3 -m http.server` is fine). `preload` is only set on a track when it is about to play.

## Saves
Two localStorage records, each with its own `version` and `migrations[n]` (n → n+1) in `save.js`. Never edit old migrations; add new ones.
- **`knightMath.save`** (the current run, `version: 5`): v1→v2, v2→v3, **v4→v5** (game v11: `spells: 1`, `spellLeft: 0`), and **v3→v4** (game v7): the stop is remapped to the first stop after the same number of battles (the road gained Frank's stop), followers above 3 go home (`leftParty`), followers get skins 1–3, `hunters: 0`. Tested.
- **`knightMath.profile`** (kept across new games, `version: 4`): best journey, deaths for graves, music settings. **v3→v4**: old deaths get `deathId`, `runId: "legacy"`, `route`, `progress: null`, `killer: "unknown"`, `marker: "grave"` (placed by their old distance). Tested.

On every update the previous save is copied to `.prev`, and an unreadable save is kept as `.bak`.

## Tests
```
python3 -m http.server 8799 &
node tests/play.test.js        # full playthrough with every v7 rule, SFX mapping, save migrations
node tests/graves.test.js      # graves + emblems, toast, drawn death, hunters capture, profile migrations
URL=http://localhost:8799/ node tests/artpack.test.js
node tests/spell.test.js       # v11 Spell of Stupidity: cast, 5 stupid sums, wear-off, half gold, save v4 -> v5
node tests/file.test.js        # opened from file:// (tint + strip sheet)
node tests/speech.test.js      # every bubble = whole sentences, max 2 lines
node tests/mead.test.js        # tavern fare: sign, stew, mead, per-visit limits
node tests/v18.test.js         # v18 coif clips + riddle keeper / rock
```
All of them fail on any page error or console error. Playwright falls back to `/workspace/pwtest/node_modules/playwright`.
- **Seated poses (tavern):** `assets/v11/ui/seated-feather.png` (from `sitting_plume_knight.png`, 803x1385) and `seated-scarf.png` (from `sitting_kettlehat.png`, 870x1189), trimmed only (already transparent). Recruits whose skin is feather/scarf sit behind the v8 table, mirrored to face the party, feet on the floor (sunk `SEAT_SINK` 60 stage px), clipped at the tabletop, table drawn in front. The sheets are painted at ~2x the walk atlases (helmet 321 vs 165 px, kettle brim 405 vs 201), so they draw at `L.art x seatMul 0.5` (= 0.3 stage px per source px) to keep heads the same size as the walks. Other skins fall back to the clipped standing cutout.
- **Riddle screen (Magnus):** the riddle sits where the big numbers usually are, inside his `riddle_frame.png` (`assets/v11/ui/riddle-frame.png`, 2123x686 trimmed, already transparent). One uniform scale of **0.169 stage px per source px** (frame 116 stage px tall; = 0.28x artScale, the frame's native 686 px would be 412 stage px at artScale 0.6, taller than the whole 240 px strip). Width fits the riddle with a CSS border-image 9-slice: both 622 px corner halves (each with its full line segment) are kept intact, only the ink-free middle widens; no vertical stretch. Question in 40px Georgia (34px if > 58 chars), centred, max 2 lines. Answers under it as the battle's plaque buttons (seal key + answer); a wrong answer greys out like Heal; `S Sacrifice` is a plaque too while you have knights. The riddler only says one short bark bubble when the riddle starts ("A riddle for you." or a short variant, `riddleTaunt` arrays in enemies.js), "WRONG! One more go." no longer repeats the question.
- **Placeholders:** no labelled grey boxes anywhere; missing art draws a minimal unlabelled ink silhouette (see MISSING_ART.md).
- **Speech rule (v11b):** a bubble holds whole sentences only. Every sentence must fit one painted bubble (2 lines at the bubble's 249 px text width, 30px Georgia, about 19 characters per line). A text is split only between sentences, and "..." followed by a lowercase word is not a sentence end. Lines that broke this were rewritten as short whole sentences (intro, name prompt, victory, recruit offer, Shrubbington/Thwackwell joins, bridgekeeper/hermit taunts, tavern/camp greets, four epitaphs, Frank refusal, armour line, "further than ever" bubble). `tests/speech.test.js` scans every speech string (with 16-letter names and 4-digit numbers); `tests/play.test.js` re-checks everything said in a run. NOTE: the only recorded VO, `vo_further_than_ever.ogg`, still says "The knight ventures further into the unknown than ever before." while its bubble now reads "Further than ever before!".
- **Tavern default view:** (v11b-2: the sign's Mead / Stew plaques show at once) no "Look around" hint; the highlight starts on the first thing (the TAVERN FARE sign; no name bubble on the sign itself).
- **Tavern fare (Magnus):** "mead lowers intelligence as scroll of stupidity but just for 1 battle and stew heals 1 heart". The tavern menu is his `tavern_fare_sign.png` hanging on the interior wall (nail at interior source px [1184, 150]; ONE uniform scale 0.19 stage px per sign source px = 0.317x artScale, so it is ~258 stage px tall next to the 355 px knight). It is the first highlighted thing on entering; picking or clicking it swings it about the nail: angle = 8° · e^(−t/0.36 s) · cos(2πt/0.8 s), stopped after 1.5 s; highlighting it with ←/→ gives a 3° nudge. No name bubble on the sign (it reads TAVERN FARE itself). Its options are plaques: `1 Mead 3`, `2 Stew 2` (shown as soon as the sign is highlighted; v11b-2 limits 1 mead / 2 stew per visit).
  - **Stew** (H or 2 in the menu): +1 heart for 2 gold, capped at the max (greyed out at full hearts).
  - **Mead** (J or 1 in the menu): 3 gold. Waits for the next battle (`S.mead = 1`, the stupidity icon shows without a count); when that battle starts every one of its sums is a stupid sum (single-digit + and −), then it wears off with the battle ("The mead wears off. Ugh."). One mead at a time. Riddles, recruits and Frank's sums before that battle are not affected. A won mead battle pays half gold, like a scroll (`spell.goldMul`).
  - **Scroll during a mead battle:** refused ("The mead's doing that already."), no scroll used, and the Stupidity plaque is hidden for that battle. A scroll cast on the road while a mead is waiting works as normal; mead sums never use up a scroll's 5 sums.
  - **Ale is gone; the tavern no longer sells scrolls** (the sign only lists Mead and Stew); scrolls are sold at the roadside stall and the shop (`spell.sellAt`).
  - **Save v7:** `mead` (0/1). A mead active mid-battle is saved as waiting (the checkpoint replays that battle). v6 → v7 migration adds `mead: 0`.
  - Tests: `tests/mead.test.js` (sign hotspot, swing and settle, stew +1 capped, mead waits / saves / applies to all sums of one battle / Z refused / ends); `tests/play.test.js` checks the sign hotspot and the plaques.


## v11b-3 (strikes, groups, Cobra's v19 merge)
* **Darkest-Dungeon-style strikes** (`STRIKE` in src/game.js, 0.55 s): snap into the strike pose (the drawn `attack` clip where one exists, e.g. the coif), wind-up 0-12 %, lunge across to the target 12-38 % (re-aimed every frame while closing, so a foe stepping up is still met), impact hold 38-60 % (hit SFX, the target's drawn hurt frame or flash + 26-unit knockback, screen shake), slide back 60-100 %. Feet stay on the ground line (dy 0). Both ways: hero -> front foe (the sword still hits the front 2), each foe -> the knight. Contact distance = pivot distance - 0.75 x (half widths, KM_WIDE).
* **Groups** (`combat.groups`, TEMP_BALANCE): none before 5 leagues; 50 % of ordinary fights from 5, 80 % from 8; a group is 3 foes 50 % of the time; pool goblin / killer rabbit; 40-unit gap; sword hits 2; +50 % gold per extra foe. The row never overlaps the knight and must fit on screen: the widest extra is swapped for the narrowest pool monster (else dropped). tests/group.test.js.
* **Foe hearts**: one row at most (10), each heart = max HP / 10, rounded up (the mega boss had ~24 hearts).
* **Cobra's v19 art audit merged** (cobra_report/changes.patch + assets/v19 byte-for-byte; AUDIT_ART.md): background hill dragon at Frank's stop, mega boss = v8 dragon-sequence incl. its 6 eating drawings, brutal deaths (dragon / toad / ogre eat, rabbits tear apart, hunters' arrows), the coif's own death, toad + ogre road enemies, tests/packanims.test.js. Screens: `node tools/capture_v19.js` -> screenshots/v11b/v19.
