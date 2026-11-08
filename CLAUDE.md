CURRENT ENTRY POINT (9 November 2026): read CLAUDE_HANDOFF.md first. Everything below is older history.

CURRENT ENTRY POINT (7 November 2026): read GROK_HANDOFF.md first for the
consolidated current state. Historical notes below remain useful but may be superseded.

CURRENT TIMER (woodcut-timer-46): use the approved swamp-concept icons and thin
flat orange progress rail ABOVE the separate ornamental divider, across all modes.
Source cutouts: assets/timing-woodcut/; preserve the existing combat/score thresholds,
gear and pressure movement, hit pin and bilingual tooltips. No broad glow or upright
sword/devil substitute. See HANDOFF.md and muted browser checks.

CURRENT CORPSE PLACEMENT (corpse-floor-45): tomb fall sprites render about 13%
smaller. Held pitch/landed poses are foreshortened and lean toward the tunnel
centre to lie along the floor, still close with lower bodies below the scene edge.
Same drawings, timings and world positions; skeleton persistence stays unchanged.

CURRENT MUSIC (chapter-music-44, 6 November 2026): Hollow Wood/graveyard uses
Magnus's new Graveyard music.mp3. Tomb has two shuffled exploration tracks, one
regular battle track and two shuffled boss tracks. Chapter-aware scene routing,
exploration resumes after fights; tomb entry/replay/end now set music explicitly.
Keep per-page opt-in, immediate mute and cross-tab silence. Test without audio.
See HANDOFF.md and src/data/music.js for the exact mapping.

CURRENT TUNNEL (tunnel-43): large close falls, lower bodies below the frame.
Deaths leave prone skeletons for later tunnel runs, locally stored separately in
knightMath.tomb.memorials.v1. Fresh bodies only in current run; resurrection removes
its own marker. Preserve campaign/profile/leaderboard data. See HANDOFF.md and
tomb-memorials.js. Never restore tiny full-body falls or dim dead portraits.

CURRENT TUNNEL (tunnel-42): stronger bends and three fixed world-section variants
(stone, burial niches, roots). Deaths remove portraits immediately and play three
rear-view drawn fall poses; bodies remain on the floor and move with world depth.
Four test outfits have matching art. Revive clears the corpse and restores the
portrait by member ID. Replay clears bodies. See HANDOFF.md and tomb-falls.js.
Still an isolated preview; preserve campaign saves and all existing risk rules.

CURRENT TUNNEL (tunnel-41): the playable tomb now uses repeated hollow stone
sections with a transparent central opening, perspective growth, gentle bends and
black-to-colour depth lighting. Enemies share the projection/lighting and world depth.
See HANDOFF.md and src/engine/tomb-depth.js. Keep this; the old single-room zoom is
superseded. It remains an isolated preview; campaign saves are untouched.

CURRENT TOMB / REPLACEMENT (tomb-40): full parties can solve to recruit, then
choose a companion to replace (never the player). Gear leaves with its owner;
shared wounds stay. Seeded 1-in-3 dismissal hostility, saved until resolved; same
sprite fights outside, no loot; one recruit per camp/tavern. See HANDOFF.md.
The approved tomb has an ISOLATED playable first-person test at
?debug&biome=tomb&preview=tomb&mode=fellowship. Not yet connected to the campaign.
Keep normal saves and the existing power/difficulty/risk rules intact.

CURRENT CHAPTER / GEAR (hollowwood-39): per-character weapon +3, held armour 3
max, guarded purchases and save normalization. Consumed armour remains replenishable.
The Hollow Wood is a second playable chapter after the countryside, carrying living
party/gear/wounds/score through an ink transition. Four new enemies, large Collector
boss (NO belly/shoulder faces), optional distant Bell Beneath. See HANDOFF.md for
assets, provisional balance, test link, and static-cutout animation limitation.
Keep all existing power/difficulty/risk and party-pressure rules below.

CURRENT PARTY PRESSURE (party-pressure-38): each living companion pulls block and
crit endpoints back 5 percentage points (max 15). Dead companions release pressure
AND lose their equipment contribution. Freeze windows per question; update on the
next. Gear benefits, enemy pressure and their floors remain. Riddle/score cutoffs do
not move. See the current HANDOFF.md / GAME_DESIGN.txt notes and tests.

# Medieval Math: notes for AI coding agents

CURRENT BALANCE (stakes-37): first timer band blocks with normal damage; second
band crits but allows retaliation (base boundaries 25/50%). These are distinct rewards.
Purses are reduced to roughly two meaningful gear purchases per shop for a careful
saver. Keep saved balances. See the latest GAME_DESIGN.txt / HANDOFF.md notes.


CURRENT MODES (5 November 2026): The Village Idiot = choose an action, then maths;
The Knight = a party card deck, then maths; The Fellowship = pure maths with every
living companion attacking on each success, no combat selection. Fellowship has
its own save/scoreboard and fixed 2× enemy HP; weapon upgrades increase each owner's
contribution. Role volleys: knights cleave two, wizard/fire hit all; failed combat
sums add one shared party damage per caster (armour first). Priests heal when wounded,
otherwise staff attack; executioners double damage at half HP. Keep actual riddles
and the original hihuuu greeting. See fellowship-roles-36 at the top of the handoff.
The Bard is retired; preserve its archived saves/scores. See the current notes at
the top of GAME_DESIGN.txt and HANDOFF.md for Fellowship tuning and exceptions.

CURRENT UI (action-cards-34): use the shared large square action cards for Village
Idiot combat, shops and camp/road actions; retain framed riddles and tavern dialogue.
The Knight keeps its actual deck. Magic/fire reward and failure risk remain central.

## CORE DESIGN RULE — POWER, DIFFICULTY AND RISK

**Non-negotiable, confirmed by Magnus on 5 November 2026:** weak attacks are easier
and weaker; strong attacks are harder and stronger; powerful spells are hard and
risky. Preserve this relationship in every challenge format and future port.
Temporary buffs and upgrades may deliberately reduce execution difficulty; never
silently cancel their benefit by scaling difficulty back up. A powerful found
sword or mage staff can initially demand a formidable challenge; blacksmith
refinement makes it manageable for later biomes without merely stripping its power.
Failed fire-bottle throws can ignite the player's own party, with another living
companion reacting in written dialogue. Communicate damage, difficulty and risk
clearly before commitment. Preserve existing buff durations and wizard backfire rules.

Fellowship now has per-caster fire/lightning backfires and a companion reaction.
The Knight's existing backfires remain. Village Idiot fire-failure changes and
weapon/refinement progression remain **approved design awaiting implementation**.
Read [GAME_DESIGN.txt](GAME_DESIGN.txt) for the full rule and implementation status. This rule supersedes
conflicting historical notes; do not flatten it during balancing.

Plain HTML/JS canvas game (1600x900 stage), no build step. Live: https://kk76fd4v84-star.github.io/medieval-math/

Read first:
- `art-direction/STYLE_GUIDE.md` and `art-direction/approved-concept-eyes.png`: mandatory visual comparison before any art/rendering change. Reference colour families and per-asset calibration live in `src/config/palette.js`.
- `HANDOFF.md`: version-by-version log of every design decision and change (current decisions at the top). Follow it.
- `README.md`: architecture, data files, voice-over hooks, art config.

Run locally: `python3 -m http.server 8799` in the repo root, then open http://localhost:8799/ (`?debug` adds `__km` helpers, `?notimer` disables the answer timer).
Tests: Playwright scripts in `tests/` (e.g. `URL=http://localhost:8799/index.html node tests/play.test.js`).

House rules (from the designer, Magnus):
- Keep code simple, clean and super structured: data in `src/data/` and `src/config/`, logic in small modules. A Godot port is planned later.
- Draw art at its exact source size × the single global `artScale` (0.6). Use only the provided art; don't generate new art.
- Clean UI with no clutter and no key labels on buttons (mouse or trackpad first; the keys still work). Every bottom button uses Maggi's ornamented 9-slice frame (`src/config/ui_frames.js`).
- Keep sums suitable for mental arithmetic. Challenge difficulty and time budgets follow the current game tuning and the core power/difficulty/risk rule above; the old fixed 35-second note is superseded.
- Voice acting is removed (4 Nov 2026), except the requested original riddler hihuuu greeting SFX (5 Nov). Keep written dialogue and SFX. Music starts off; never enable it while testing. Historical VO instructions are superseded.
