"""v12r (Magnus: "0 is often cut and there is a strange space to the other number before it").
The animation pack's digit sprites (art/sprites/digit-N.png, copied to assets/v7/numerals/) are fixed 177-px-wide
slices of numerals-sheet.png, but the painted digits are not evenly spaced on the sheet: the 0 lost its right side
(and sat 54 px right of its slice edge = the gap before it), the 8 and 9 lost a sliver on the left.
This re-slices every digit from the sheet around ITS OWN ink: crop between the gaps to its neighbours, find the ink
columns (colour-to-alpha against the sheet paper, same maths as tools/import_v10.py), then cut the slice at the ink
bounds + SIDE px on each side (same side bearing for every digit = even gaps), rows ROWS (190 px, as before).
Writes assets/v7/numerals/digit-N.png (paper slice; its size sets the drawn size) and assets/v10/ink/glyph-digit-N.png
(ink-only glyph the game shows). Run: python3 tools/reslice_digits.py
"""
import os, numpy as np
from scipy import ndimage
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHEET = os.path.join(ROOT, "incoming/medieval_math_handoff/MedievalMath-Handoff/output/medieval-math-animation-pack-v2/art/numerals-sheet.png")
SIDE, ROWS, FLOOR, INK_MIN = 12, (9, 199), 0.06, 0.25   # side bearing (source px), slice rows, c2a floor, ink alpha for bounds

def c2a(p, W, floor):  # GIMP max-channel colour-to-alpha with smoothstep floor (same as tools/import_v10.py)
    rgb, al = p[..., :3], p[..., 3]; W = np.asarray(W, float)
    a = np.clip(((W - rgb) / W).max(-1), 0, 1); keep = (a > floor) & (al > 0); aa = np.where(keep, a, 1)[..., None]
    t = np.clip((a - floor) / floor, 0, 1); sm = t * t * (3 - 2 * t)
    out = np.zeros_like(p); out[..., :3] = np.clip((rgb - (1 - aa) * W) / aa, 0, 255); out[..., 3] = np.where(keep, a * sm * al, 0); return out

S = np.asarray(Image.open(SHEET).convert("RGBA")).astype(np.float64)
band = S[ROWS[0]:ROWS[1]]
lum = band[..., :3].mean(-1); dark = (lum < 90).sum(0)
runs, s = [], None
for x, v in enumerate(dark):
    if v > 2 and s is None: s = x
    if v <= 2 and s is not None:
        if x - s > 8: runs.append((s, x - 1))
        s = None
assert len(runs) == 10, runs
out = []
for d, (a, b) in enumerate(runs):
    lo = (runs[d - 1][1] + a) // 2 if d else 0; hi = (b + runs[d + 1][0]) // 2 if d < 9 else S.shape[1]
    reg = band[:, lo:hi]; h, w = reg.shape[:2]; B = 5
    bm = np.zeros((h, w), bool); bm[:B] = bm[-B:] = True; bm[:, :B] = bm[:, -B:] = True
    W = [int(np.sort(reg[..., k][bm])[bm.sum() >> 1]) for k in range(3)]
    ink = c2a(reg, W, FLOOR); m = ink[..., 3] > 255 * INK_MIN
    lab, n = ndimage.label(ndimage.binary_dilation(m, iterations=3))      # parts closer than ~6 px join the glyph (the 0's sparkles)
    core = set(np.unique(lab[:, a - lo:b - lo + 1])) - {0}                 # components touching the dark core = the digit
    glyph = np.isin(lab, list(core)) & m; cols = np.where(glyph.any(0))[0]
    l, r = cols.min(), cols.max()
    x0, x1 = lo + l - SIDE, lo + r + 1 + SIDE
    assert x0 >= lo - 2 and x1 <= hi + 2, (d, x0, x1, lo, hi)
    sl = band[:, x0:x1]; inkS = c2a(sl, W, FLOOR)
    g2 = np.zeros(inkS.shape[:2], bool); gx0 = x0 - lo   # the digit mask in slice coordinates; stray specks (> INK_MIN) off it = paper
    g2[:, max(0, -gx0):min(inkS.shape[1], w - gx0)] = glyph[:, max(0, gx0):max(0, gx0) + min(inkS.shape[1], w - gx0) - max(0, -gx0)]
    stray = (inkS[..., 3] > 255 * INK_MIN) & ~ndimage.binary_dilation(g2, iterations=2); inkS[stray, 3] = 0
    inkS[:, :2, 3] = 0; inkS[:, -2:, 3] = 0                      # the side bearing is paper: no grain on the very edge
    Image.fromarray(np.clip(np.rint(sl), 0, 255).astype(np.uint8), "RGBA").save(os.path.join(ROOT, "assets/v7/numerals/digit-%d.png" % d), optimize=True)
    Image.fromarray(np.clip(np.rint(inkS), 0, 255).astype(np.uint8), "RGBA").save(os.path.join(ROOT, "assets/v10/ink/glyph-digit-%d.png" % d), optimize=True)
    out.append((d, x0, x1, x1 - x0))
print("digit, sheet x0, x1, slice width:", out)
