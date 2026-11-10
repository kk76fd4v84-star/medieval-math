# Cast-bar tutorial v1
No image generations. PIL-only asset composition. No game integration.

## Deliverables
- tutorial_frame.png: 1000×820 RGBA, parchment inside, transparent anti-aliased rounded outer corners, same cut-ink frame language as upgrade cards.
- mockup.jpg: panel at (300,40) on actual game parchment, 1600×900.
- work/build.py: composer; work/current_play/: exact fetched source/assets used.
Main labels are Gelasio 31px, title 44px, supplemental lines 22–27px; one dismiss button, no badge cluster. Onward! is visual art only; integration must attach the dismiss hitbox (panel coordinates x350 y718 w300 h90).

## Freshness / provenance
Requested /workspace/knight-math-game is an older non-Git asset snapshot without the current timing-woodcut files. Found the matching complete repo at /workspace/mm_repo (remote https://github.com/kk76fd4v84-star/medieval-math.git). Queried remote play and fetched its latest commit 32f804f1c4b37aab45287d09c4f63436e904050b. Extracted only relevant files with git archive; did NOT switch, merge, reset or overwrite the working checkout, which has another branch and local changes. This panel reflects fetched play, not the stale requested snapshot.

## Exact labels and code mapping at that commit
Header: Read the cast bar.
Instruction: Answer correctly. Where you stop changes the hit.
- Block: normal hit; block their turn. — src/engine/timing-bar.js lines 76–79, especially 77: normal damage and block the entire enemy turn without silver-heart expenditure.
- Crit: double damage. — same file line 76 (2×); src/engine/timing.js gradeFraction lines 34–40.
- Normal: full damage. — timing-bar.js line 78; timing.js multiplier fallback 1.
- Weak: half damage. — timing-bar.js line 79; timing.js late multiplier; src/data/combat.js timing.
- Outside Block, surviving enemies usually strike back. — timing-bar.js lines 76,78,79. “Usually” deliberately allows forgiving enemies: lines 81–86 say their correct answers always block. Deadline enemies have a full-bar strike exception (lines 87–88).
- Enemy tricks · when enabled.
  FAST: less time · HEAVY: less Block
  SLIPPERY: less Crit · INK: hides the bar
  — src/data/meter_pressure.js lines 3–9; src/engine/meter-pressure.js lines 16–36. Shrouded is internally `shroud`, on-screen tag INK; Quick is on-screen FAST. No invented renamed tags or pictures.
- Moving trail: green helps; red hurts. — src/data/cast_bar.js lines 1–3 and colours line 15; src/engine/timing-bar.js animate.
- Onward! — proposed tutorial dismiss label, not a game mechanic.

## Real images / colours / bar geometry
All four icons copied from current play assets/timing-woodcut/{block,crit,normal,weak}.png: shield / flaming sword / plain sword / stick. Track and orange elapsed fill are the actual track.png and fill.png. src/engine/timing-bar.js lines 5–6,16 establish icons and widths. Endpoints are 25%,50%,75%,100% in the baseline mockup (data/combat.js line 8); equipment, companions and enemy pressure move them. Block and Crit pictures mark window ENDS, not centres (timing-bar.js lines 90–101). No fabricated four-colour band background: actual rail is black engraved track with orange fill, and red hatched lost-window spans when applicable (style.css 329–330,460). No pressure loss shown in this neutral mini-bar.

Current play has NO assets/meter_pressure/ directory, so the game really uses plain FAST/HEAVY/SLIPPERY/INK tags, not the separately commissioned meter_icons handoff. This panel uses text likewise. Good/bad trail colours are #3f8a2c / #b3261e. Shroud overlay ink is #292018 (style.css 537). The real icons already carry cream/black/rust-orange art; they are not recoloured.

## Feature gates / open decisions
src/data/balance_try.js defaults meterPressure:false and castBar:false (lines 11,15). They activate through the corresponding balance switch / ?meterpressure=1 and ?castbar=1. The tutorial includes these supplemental explanations because requested, explicitly labels enemy tricks conditional. On integration, hide the Enemy tricks text when pressure is disabled and hide the moving-trail sentence when castBar is disabled. No always-on pressure icons are claimed. The exact initial enemy may be forgiving: decide whether its intro should suppress the generic counterattack sentence. Core four meanings are verified, not open questions.

Weak spots: this single static panel cannot adapt thresholds/gates per run until coded; sample mini-bar illustrates baseline positions only. Enemy tricks and trail copy are secondary small text but still 22–27px at native game stage. Not wired to appear at startup or dismiss. No new artwork generated.
