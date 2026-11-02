# Fire Bottle (firebomb) art: Medieval Math, **v4 (one-colour medieval woodcut, washed-out ochre)**

v4 is v3 recoloured after Magnus's note "Washed out ocre yellow": the same drawings, frames and geometry, with the single fill swapped from orange to a pale faded-watercolour ochre.
- (v3 followed his medieval woodcut fire references and "I want just one color".)
- **Same file names, cell sizes, frame counts, anchors and timing as v1/v2**, so the only code change is the path: `fire_bottle/` becomes `fire_bottle/v4/`.
- **Flames:** drawn like 16th-century hand-coloured woodcuts: tall licking S-curved tongues, black carved outlines, parallel hatching inside, and transparent gaps between the tongues.
- **Colour:** **ONE flat washed-out ochre, `#D9B46A` (217,180,106)**, plus black ink (#140E0A).
  - It's lighter and less saturated than #C9A24A, and stays distinct from the game parchment (about #DDC29F) through its more yellow hue. No extra darkening was needed.
  - Every fx pixel was forced in code to ochre, ink, or the anti-aliased edge between them, so there's no yellow, red, cream, gradient or glow.
- **Smoke:** black-ink curls only. Their pale insides are removed, so they're uncoloured. The smoke cloud in smash_2 uses the same ochre.
- **Lingering loop:** 4 **really redrawn variants** of the same fire, not warped. They're scaled to the same width (600) and height and pinned to the same ground line, so they flicker like a woodcut "boil".
- **Bottle item and icon:** the v2 art recoloured to ink + #D9B46A (+ parchment #ECDEC4 on the icon's flask).
- v1, v2 and v3 are untouched.

All PNGs are transparent RGBA and contain no text. Style: one-colour hand-coloured woodcut, black ink + #D9B46A.
Game scale: the goblin draws at about 0.6 of its native size (native 609x797 becomes roughly 364x480 stage px on the 1600x900 stage), so every fx below is sized for **draw scale 0.6**.

## Item
| file | size | notes |
|---|---|---|
| `bottle_icon.png` | 128x128 | Move-plaque icon (parchment flask stamp, thick black outline, carved hatch lines, small #D9B46A flame). Centred. Reads at 40 px (`bottle_icon_40px.png`, `bottle_icon_40px_check.png` next to the skull and sword). |
| `bottle_item.png` | 224x224 | Woodcut clay firebomb (clay, cork, rag and flame all #D9B46A plus ink), bottle 135x200, **centred in the canvas, so pivot = (112,112) = canvas centre**. Rotate it around the centre for the thrown spin. |
| `bottle_item@2x.png` | 448x448 | The same bottle at 400 px tall, for the shop or inventory close-ups. Pivot is the centre. |

Throw suggestion: an arc from the knight to the impact point in 450-550 ms, spinning about 540 deg/s around the centre, drawn at scale 0.6-0.7. On impact, hide the bottle and start `smash_1` at the impact x on the ground line.

## Fire FX: per-enemy patch (the main set)
I chose a **narrow patch repeated once per enemy** (native content about 600 px wide, which is about **360 stage px at 0.6**), not a single 900 px sheet.
- **Every cell is 640x368.**
- **Anchor is bottom-centre (320,368).** Row 368 is the ground line: the base of the fire or puddle sits 1-4 px above the bottom edge on every frame.
- **Draw it with its bottom-centre at (enemy foot x, enemy foot y + about 10)**, in front of the enemy, so the flames lick over the feet.

| phase | files | atlas | frames | suggested timing |
|---|---|---|---|---|
| smash and splash | `fx/fire_smash_1..3.png` | `fx/atlas_fire_smash.png` (1920x368, 3 cells) | 1 cracking flask, 2 splash with an ochre woodcut smoke cloud, 3 shards and a puddle catching fire | 70 ms each (about 14 fps), once |
| fire burst | `fx/fire_burst_1..4.png` | `fx/atlas_fire_burst.png` (2560x368, 4 cells) | 1 whoosh, 2 tallest peak, 3 sinking with ink-only smoke curls (4 also has a few fading curls), 4 settled | 85 ms each (about 12 fps), once. **Apply the area damage and hit flash on burst_2.** |
| lingering loop | `fx/fire_linger_1..4.png` | `fx/atlas_fire_linger.png` (2560x368, 4 cells) | 4 hand-drawn variants (boil loop, 4 then back to 1) | 125 ms each (8 fps), loop 1.5-2.5 s, then fade alpha to 0 over 300 ms |

Atlas cells are equal, left to right, with no padding: cell i is at x = i*640.

**Sequence:** smash (at the impact point, usually the middle enemy) → burst on every enemy (start them 0/60/120 ms apart from the impact outward for a spreading feel) → lingering loop.
`burst_4` and `linger_1` are different drawings with the same width and ground line. The switch is a small boil, not a pop.

**Repeating per enemy:** place one patch per enemy at its foot x. With enemies spaced about 235 stage px apart, the 360 px patches overlap and read as one continuous fire line (see the mockup). For a single enemy, just draw one. You can mirror alternate patches horizontally (scaleX -1) so the repeats don't look identical.

## Optional: one wide strip
`fx/wide/fire_linger_wide_1..4.png` holds 4 loop frames and `fx/wide/atlas_fire_linger_wide.png` the atlas (6080x340).
- Each cell is 1520x340, and the content is 1500 px wide, which is **900 stage px at 0.6**.
- The anchor is bottom-centre and the timing is the same as the lingering loop.
- It comes from a separate drawing, squashed about 30% vertically to fit the v1 1520x340 cell, so its tongues are stubbier than the patches. Its 4 frames are a gentle code sway of that one drawing, not redrawn. Use it only if you'd rather have a single sheet under the whole group than per-enemy patches.

## Singed / burnt look for hit enemies (optional)
- `singed_overlay.png` (512x512): soot that is darkest at the bottom and fades out by the middle, with light hatching.
  - Stretch it to the enemy sprite's bounds and draw it with **`globalCompositeOperation = 'source-atop'`** (clipped to the sprite) at alpha 0.6-1.0.
- **Tint: multiply the sprite by `#D6BEAA` (214,190,170).** You can do this with a canvas filter, an offscreen multiply, or `filter: brightness(0.85) sepia(0.25)` as a cheap stand-in.
- Suggested timing: full singe on the burst_2 hit, then fade the singe out over about 1.5 s, or keep it while the enemy burns.
- Demo: `singed_demo_goblin.jpg` (left normal, right singed).

## Mockup and preview
- `mockup_fire_goblin.jpg` (1600x2740) has 3 stacked 1600x900 panels on the real battle screen with 3 goblins:
  - A: the bottle in flight and smash_2 at the middle goblin.
  - B: burst_2 under all 3.
  - C: linger_1 with the singed goblins.
  - The fx are drawn at 0.6.
- `preview_fire_anim.gif`: the full smash → burst → linger timing on parchment.

## Source / work
- `work/` holds the magenta sources, the keying (`keyfx.py`) and build scripts (`build_v4.py <HEX>` re-runs the one-colour `quant()` with any fill colour, `mock_v4.py`) for v4.
- The burst peak is stretched slightly in code (frame 2 ×1.12, frame 3 ×1.04). The lingering frames are 4 generated drawings, not warps.
