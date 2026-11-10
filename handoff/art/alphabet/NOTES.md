# Medieval Math: engraved capital alphabet A–Z (for the fire-bottle spelling challenge)

These letters match the sum digits: `assets/v10/ink/glyph-digit-0..9.png`, which are the ink-only versions of `assets/v7/numerals/digit-*.png`.
- The digits are wired through `KM_ART.glyphs` and drawn by `KM.Assets.glyphHTML`.
- Each digit is a **177×190** slice with black ink, fine engraved hatching inside the thick strokes, and small orange diamond accents. The paper is removed by colour-to-alpha.
- The digits are drawn at natural px × `KM_LAYOUT.artScale` (177×190 becomes 106×114 stage px, about 0.6).

## How the letters were made
- **Drawing:** generated in 6 batches with the digits as the style reference: engraved Roman serif capitals (plain and legible, not blackletter) on flat cream paper.
- **Cut-out:** the paper is removed with **the same GIMP-style colour-to-alpha the game uses** (`KM.Assets.colorToAlpha`, floor 0.06, paper colour = median of the border).
- **Sizing:** scaled to the digits' cap height (162 px, y 10–173), with the strokes thickened about 1 px and alpha gamma 0.8 so the weight and darkness match the heavier digits.
- **Q:** redrawn with a short tail. The part below the baseline is squashed to fit inside the 190 cell.
- **Orange accents:** like the digits, some letters carry a small orange diamond: A, D, G, O and P.

## Files
| file | what |
|---|---|
| `A.png` … `Z.png` | One transparent PNG per letter, **190 px tall**, with width = the letter's advance. The glyph sits 15–16 px from the left edge, with the same margin on the right. |
| `atlas_alphabet.png` | 6058×190: 26 equal cells of **233×190**, in order A–Z, each letter centred in its cell. |
| `glyphs.json` | `cell`, `baseline_y`, `cap_height`, and for each letter `atlas_x` (cell left), `glyph_x_in_cell` (where the advance box starts inside the cell) and `advance`. |
| `correct/` | All 26 letters and the atlas recoloured to the "typed correctly" colour. |
| `wrong/` | The same, in the "wrong" colour. |
| `preview_alphabet.png` | A–Z on parchment, plus DRAGON with D-R-A correct, G wrong and O-N still to type (35% opacity), "7 + 3" in the existing glyphs for comparison, and DRAGON fully correct. |
| `work/` | Source sheets, `c2a.py` (the game's colour-to-alpha), `build.py` and `states.py`. |

## Metrics
- **Cell height:** 190, the same as the digits.
- **Baseline:** y = **173**, the same as the digits, whose bottoms sit at 172–174.
- **Cap height:** 162 (tops at y about 9–11).
- **Q:** its tail dips to y 187, and its body is about 3% smaller.
- **S, U, C, O and J:** they overshoot the baseline by 1–3 px, which is normal optical overshoot.
- **Advance widths (px at native size):**
  - A 191, B 163, C 168, D 178, E 157, F 151, G 184
  - H 190, I 95, J 131, K 180, L 149, M 210, N 172
  - O 171, P 160, Q 182, R 180, S 146, T 163, U 170
  - V 175, W 233, X 178, Y 169, Z 154
- **Letter spacing:** lay letters edge to edge by advance, which gives about 30 px between glyphs. The digits use a fixed 177 cell, so a mixed string can just concatenate the two.
- **Scale:** draw at the same `KM_LAYOUT.artScale` as the digits. A word like DRAGON is about 1036 px native, which is about 620 stage px at 0.6.

## States / tint
The ink is near-black, plus orange accents. Recolour **the whole glyph with a flat colour and keep its alpha**: the hatching texture comes through the alpha.

| state | colour | use |
|---|---|---|
| not yet typed | original ink, at **35% opacity** | The letters still to spell |
| typed correctly | **burnt orange `#B5561C`** (181,86,28) | Matches the goblin's hood and the orange accents |
| wrong | **madder red `#7A1F14`** (122,31,20) | The game's existing `.ops .op.on` red, a dark print red, not neon |
| current letter (optional) | original ink at 100% | You could add a small bob or scale of 1.05 |

**Code:**
- **Canvas:** draw the glyph, then `ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = '#B5561C'; ctx.fillRect(...)` on an offscreen canvas per glyph. You can also just use the `correct/` and `wrong/` PNGs (identical result).
- **HTML (`glyphHTML`):** extend `glyphImg` so `/[A-Z]/` resolves to `alphabet/<L>.png`, or to `alphabet/correct/<L>.png` and `alphabet/wrong/<L>.png` for the states. They're already ink-only, so use class `glyph native ink` (no `mix-blend-mode`).
- A wrong letter could also do a short shake (±4 px, 150 ms) before going back to pending.
