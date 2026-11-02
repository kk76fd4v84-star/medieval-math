#!/usr/bin/env python3
"""v10 import + offline tint precompute.  Re-run any time:  python3 tools/import_v10.py

1) COPIES (byte-for-byte, read-only originals in incoming/pack_v13/) into assets/v10/:
   - medieval-math-walks-v13: the five walk atlases + *-animation.json + rigs/runtime.js/README (reference only)
   - medieval-math-biomes-v11: the 12 foreground strips + manifest.json + choose-strip.js + README
2) PRECOMPUTES (derived, assets/v10/ink/ + assets/v10/paper/) everything the v9 renderer used to compute in the
   browser with getImageData/toDataURL, which a file:// page cannot do (tainted canvas -> v9 silently drew the
   scenery paper-WHITE and the strip as a flat CSS colour). Same maths as v9 src/engine/scenery.js / assets.js:
   - scenery ink (parallax strips, trees, foreground strips): luma colour-to-alpha against the image's own paper
     W = per-channel median (paperPercentile 0.5) of its near-opaque bright pixels.  a = (lum W - lum P)/lum W,
     ink = (P - (1-a) W)/a, alpha = a * alpha.  The game fills the image's ORIGINAL alpha with the parchment
     behind, then draws this ink on top (paper -> parchment, ink as painted, white pixels never made transparent).
   - glyph ink (engraved numerals/operators): GIMP max-channel colour-to-alpha against the median of the 5-px border,
     smoothstep floor 0.06 (v9 glyphInk).
   - divider ink: strip_bg rows [120,0,1580,22], paper = median of its last 4 rows, floor 0.06 (v9 dividerInkOf).
   - paper grade: the parchment / sky crops graded per channel so the parchment median equals the paper median
     of locked-style-game-math-v2-glint.png (empty-paper regions). Only a per-channel gain, no other change.
3) Writes src/config/art_v10.js (KM_ART10).
"""
import json, os, shutil
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P13 = os.path.join(ROOT, "incoming/pack_v13")
WALK, BIO = P13 + "/medieval-math-walks-v13", P13 + "/medieval-math-biomes-v11"
REF = os.path.join(ROOT, "incoming/medieval_math_handoff/MedievalMath-Handoff/output/concept-art/locked-style-game-math-v2-glint.png")
OUT = os.path.join(ROOT, "assets/v10")
A7 = json.loads((lambda s: s[s.index("{"):s.rindex("}") + 1])(open(os.path.join(ROOT, "src/config/art_v7.js")).read()))
log = []

def cp(src, dst):
    d = os.path.join(OUT, dst); os.makedirs(os.path.dirname(d), exist_ok=True); shutil.copyfile(src, d); log.append("copy " + os.path.relpath(src, P13) + " -> assets/v10/" + dst); return "assets/v10/" + dst

def save(arr, dst):
    d = os.path.join(OUT, dst); os.makedirs(os.path.dirname(d), exist_ok=True)
    Image.fromarray(np.clip(np.rint(arr), 0, 255).astype(np.uint8), "RGBA").save(d, optimize=True); return "assets/v10/" + dst

def rgba(path): return np.asarray(Image.open(path).convert("RGBA")).astype(np.float64)

# ---- 1) walks
walks = {}
for n in ["hero", "stripe", "scarf", "feather", "moustache"]:
    a = json.load(open(f"{WALK}/{n}-animation.json"))
    img = cp(f"{WALK}/{a['image']}", f"walks/{n}-walk.png"); cp(f"{WALK}/{n}-animation.json", f"walks/{n}-animation.json")
    cp(f"{WALK}/rigs/{n}.json", f"walks/rigs/{n}.json")
    walks[n] = {"img": img, "pivot": a["pivot"], "standTop": a["standTop"], "rootMotionSpeed": a["rootMotionSpeed"], "durationMs": a["durationMs"], "loop": a["loop"],
                "frames": [{"x": f["rect"][0], "y": f["rect"][1], "w": f["rect"][2], "h": f["rect"][3], "ms": f["durationMs"]} for f in a["frames"]]}
for f in ["README.txt", "runtime.js", "VALIDATION.json", "manifest.json"]: cp(f"{WALK}/{f}", "walks/" + f)
cp(f"{P13}/START_HERE.txt", "START_HERE.txt")

# ---- 1b) foreground strips
man = json.load(open(BIO + "/manifest.json"))
for s in man["strips"]: cp(f"{BIO}/{s['image']}", "foreground/" + s["image"])
for f in ["manifest.json", "choose-strip.js", "README.txt", "VALIDATION.txt"]: cp(f"{BIO}/{f}", "foreground/" + f)
fg = {"canvas": man["canvas"], "groundY": man["groundY"], "z": man["z"], "root": "assets/v10/foreground/",
      "strips": {s["biome"]: sorted([x["image"] for x in man["strips"] if x["biome"] == s["biome"]]) for s in man["strips"]}}

# ---- 2) ink
LUM = np.array([0.299, 0.587, 0.114])
def scenery_ink(src, dst, pct=0.5):
    p = rgba(src); rgb, al = p[..., :3], p[..., 3]
    m = (al >= 240) & (rgb.sum(-1) >= 660)
    W = np.array([max(1, int(np.searchsorted(np.cumsum(np.bincount(rgb[..., k][m].astype(int), minlength=256)), m.sum() * pct))) if m.any() else 255 for k in range(3)], float)
    LW = W @ LUM; a = (LW - rgb @ LUM) / LW; a = np.clip(a, 0, 1)
    out = np.zeros_like(p); keep = (a > 0) & (al > 0); aa = np.where(keep, a, 1)[..., None]
    out[..., :3] = np.clip((rgb - (1 - aa) * W) / aa, 0, 255); out[..., 3] = np.where(keep, a * al, 0)
    return save(out, dst), W.astype(int).tolist()

def c2a(p, W, floor):  # GIMP max-channel colour-to-alpha with smoothstep floor (v9 KM.Assets.colorToAlpha)
    rgb, al = p[..., :3], p[..., 3]; W = np.asarray(W, float)
    a = np.clip(((W - rgb) / W).max(-1), 0, 1); keep = (a > floor) & (al > 0); aa = np.where(keep, a, 1)[..., None]
    t = np.clip((a - floor) / floor, 0, 1); sm = t * t * (3 - 2 * t)
    out = np.zeros_like(p); out[..., :3] = np.clip((rgb - (1 - aa) * W) / aa, 0, 255); out[..., 3] = np.where(keep, a * sm * al, 0); return out

ink = {}
R7 = os.path.join(ROOT, "assets/v7/")
for k, v in A7["parallax"].items():
    path = "assets/v7/" + v["img"]; o, W = scenery_ink(R7 + v["img"], "ink/parallax-" + os.path.basename(v["img"])); ink[path] = {"img": o, "paper": W}
for t in A7["trees"]:
    path = "assets/v7/" + t["img"]; o, W = scenery_ink(R7 + t["img"], "ink/" + os.path.basename(t["img"])); ink[path] = {"img": o, "paper": W}
# the tavern facade stands on the road like the scenery: same paper -> parchment treatment (its walls are paper-white)
fc = A7["scenes"]["tavern-exterior"]["facadeCrop"]["img"]; o, W = scenery_ink(R7 + fc, "ink/" + os.path.basename(fc)); ink["assets/v7/" + fc] = {"img": o, "paper": W}
for lst in fg["strips"].values():
    for s in lst:
        path = fg["root"] + s; o, W = scenery_ink(os.path.join(ROOT, path), "ink/fg-" + os.path.basename(s)); ink[path] = {"img": o, "paper": W}

glyphs, trimmed = {}, {}
for slot, g in A7["glyphs"].items():
    p = rgba(os.path.join(ROOT, g["img"])); h, w = p.shape[:2]; B = 5
    bm = np.zeros((h, w), bool); bm[:B] = bm[-B:] = True; bm[:, :B] = bm[:, -B:] = True
    W = [int(np.sort(p[..., k][bm])[bm.sum() >> 1]) for k in range(3)]
    ink_g = c2a(p, W, 0.06)
    # the master-reference slices (v7 crops) sometimes catch an edge of the NEIGHBOURING glyph (e.g. digit-1 shows a sliver
    # of the 7/x to its left). Drop ink that touches the left/right border and is separated from the central glyph by
    # >= 3 empty columns (the glyph itself is untouched; slice size unchanged).
    colsum = ink_g[..., 3].sum(0); empty = colsum < 255 * 4; cx = w // 2  # < ~4 px of ink = paper grain only
    l = cx
    while l > 0 and not all(empty[max(0, l - 3):l]): l -= 1
    r = cx
    while r < w and not all(empty[r:r + 3]): r += 1
    if l > 0: ink_g[:, :max(0, l - 3), 3] = 0
    if r < w: ink_g[:, r + 3:, 3] = 0
    trimmed[g["img"]] = [int(max(0, l - 3)), int(w - min(w, r + 3))]
    glyphs[g["img"]] = save(ink_g, "ink/glyph-" + os.path.basename(g["img"]))

sb = rgba(R7 + A7["strip_bg"]["img"]); x0, y0, dw, dh = 120, 0, 1580, 22; band = sb[y0:y0 + dh, x0:x0 + dw]
Wd = [int(np.sort(band[-4:, :, k].ravel())[band[-4:, :, k].size >> 1]) for k in range(3)]
divider = save(c2a(band, Wd, 0.06), "ink/divider.png")

# ---- paper grade (per-channel gain: our parchment tile median -> reference paper median)
ref = np.asarray(Image.open(REF).convert("RGB")).astype(float)
REF_BOXES = [(60, 700, 200, 880), (1500, 820, 1740, 890), (300, 20, 700, 120), (1100, 150, 1300, 300)]  # empty paper in the reference
def paper_med(a, boxes):
    px = np.concatenate([a[b[1]:b[3], b[0]:b[2], :3].reshape(-1, 3) for b in boxes]); px = px[px @ LUM > 150]; return np.median(px, 0)
target = paper_med(ref, REF_BOXES)
parch = rgba(R7 + A7["parchment"]["img"]); ours = paper_med(parch, [(120, 0, 1700, 247)])
gain = target / ours
def graded(src, dst):
    p = rgba(src); p[..., :3] = np.clip(p[..., :3] * gain, 0, 255); return save(p, dst)
# the layered rest scenes (camp / tavern) and the tavern facade carry the same painted paper: same gain, so they stay
# exactly in tone with the graded parchment around them (keyed by their assets/v7-relative path)
scene_imgs = sorted({l["img"] for sc in A7["scenes"].values() for l in sc.get("layers", []) if l.get("img")} |
                    {sc[k]["img"] for sc in A7["scenes"].values() for k in ("facadeCrop", "doorBackingCrop") if k in sc})
scenes_graded = {si: graded(R7 + si, "paper/" + si) for si in scene_imgs}
paper = {"parchment": graded(R7 + A7["parchment"]["img"], "paper/parchment.png"), "sky": graded(R7 + A7["sky"]["img"], "paper/sky.png"), "scenes": scenes_graded,
         "gain": [round(x, 4) for x in gain], "reference": [round(x, 1) for x in target], "before": [round(x, 1) for x in ours]}

art = {"root": "assets/v10/", "source": "incoming/pack_v13 (START_HERE: walks v13, foreground biomes v11)", "walks": walks, "foreground": fg,
       "ink": ink, "glyphInk": glyphs, "dividerInk": {"img": divider, "rect": [x0, y0, dw, dh], "paper": Wd}, "paper": paper}
with open(os.path.join(ROOT, "src/config/art_v10.js"), "w") as f:
    f.write("// GENERATED by tools/import_v10.py (do not edit by hand). v13 walks, v11 foreground strips, offline tint assets.\n")
    f.write("window.KM_ART10 = " + json.dumps(art, indent=1) + ";\n")
with open(os.path.join(OUT, "IMPORT_LOG.txt"), "w") as f: f.write("\n".join(log) + f"\npaper grade gain {paper['gain']} (parchment median {paper['before']} -> reference paper {paper['reference']})\n")
print("glyph neighbour slivers removed (cols left, right):", {os.path.basename(k): v for k, v in trimmed.items() if any(v)})
print("walks", list(walks), "fg", {k: len(v) for k, v in fg["strips"].items()}, "ink", len(ink), "glyphs", len(glyphs), "paper", paper)
