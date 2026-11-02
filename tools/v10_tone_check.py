#!/usr/bin/env python3
"""v10 tone re-check vs the references (writes screenshots/v10_tone_table.json):
paper = median of bright pixels (luma > 150) in empty-paper boxes; ink = median colour of dark (luma < 70) and mid (70-120) pixels
in the scenery band; seam = paper median just above the scene's bottom edge vs just below it in the HTML strip (stage y 570-596 vs 618-650)."""
import json, os, numpy as np
from PIL import Image
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); S = R + "/screenshots"
H = R + "/incoming/medieval_math_handoff/MedievalMath-Handoff/output/"
LUM = np.array([.299, .587, .114])
def load(p): return np.asarray(Image.open(p).convert("RGB")).astype(float)
def med(a, boxes, lo, hi):
    px = np.concatenate([a[b[1]:b[3], b[0]:b[2]].reshape(-1, 3) for b in boxes]); L = px @ LUM; m = (L >= lo) & (L < hi)
    return [round(x) for x in np.median(px[m], 0)] if m.any() else None
rows = {}
g = load(H + "concept-art/locked-style-game-math-v2-glint.png"); m = load(H + "style-reference/LOCKED-MASTER-REFERENCE.png")
rows["REF glint"] = {"paper": med(g, [(60, 700, 200, 880), (300, 20, 700, 120), (1100, 150, 1300, 300)], 150, 256), "ink_dark": med(g, [(0, 150, 1757, 520)], 0, 70), "ink_mid": med(g, [(0, 150, 1757, 520)], 70, 120)}
rows["REF master"] = {"paper": med(m, [(50, 50, 400, 150), (50, 900, 300, 1000)], 150, 256), "ink_dark": med(m, [(0, 150, 2008, 600)], 0, 70), "ink_mid": med(m, [(0, 150, 2008, 600)], 70, 120)}
shots = [("combat near-forest", "v10_combat_1600x900.png")] + [("road " + b, f"v10_biome_{b}.png") for b in ["fields", "village", "near-forest", "barren-rocks", "canyon"]] + \
        [("tavern exterior", "07_tavern_exterior.png"), ("tavern interior", "07b_tavern_interior.png"), ("camp", "07c_camp_interior.png"), ("file:// road", "16_file_protocol_v10.png")]
for name, f in shots:
    a = load(S + "/" + f); h, w = a.shape[:2]; k = h / 900; y = lambda v: int(v * k)
    sc = [(0, y(150), w, y(560))]
    above, below = med(a, [(0, y(570), w, y(596))], 150, 256), med(a, [(0, y(618), w, y(650))], 150, 256)
    rows[name] = {"paper": med(a, [(int(20 * k), y(20), int(400 * k), y(110)), (int(20 * k), y(700), int(400 * k), y(760))], 150, 256),
                  "ink_dark": med(a, sc, 0, 70), "ink_mid": med(a, sc, 70, 120), "paper_above_scene_edge": above, "paper_below_in_strip": below}
json.dump(rows, open(S + "/v10_tone_table.json", "w"), indent=1)
for k, v in rows.items(): print(f"{k:22s}", v)
