#!/usr/bin/env python3
"""v19 (Cobra, art audit): import the handoff animations the game did not use yet.  Re-run any time:
    python3 tools/import_v19.py
Originals in incoming/ are read-only: every PNG is COPIED byte-for-byte into assets/v19/. The only derived file is the
offline scenery ink of the dragon hill strip (same maths as tools/import_v10.py scenery_ink), so it takes the parchment
like every other parallax strip. Writes src/config/art_v19.js (KM_ART19). No repainting, no scaling, no new art.

Imported (sources = medieval-math-production-v8/atlases/manifest.json, 768 cells, per-frame durationMs, no loop):
  dragon-sequence, toad-sequence, ogre-sequence (six-frame composite eating sheets, v6 creatures), the
  rabbits-flat-blood-sequence (rabbits tear a knight apart) and knight-arrow-death (approved death with arrows, v5).
  medieval-math-encounter-pack-v3/art: dragon-hill-layer.png (small monochrome snake dragon on a simple rounded hill,
  2172x724 like the other parallax strips) and dragon-colour-cutout.png (the separate coloured dragon for the close reveal).
"""
import hashlib, json, os, shutil
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
H = os.path.join(ROOT, "incoming/medieval_math_handoff/MedievalMath-Handoff/output")
V8, V3 = H + "/medieval-math-production-v8", H + "/medieval-math-encounter-pack-v3"
OUT = os.path.join(ROOT, "assets/v19")
log = []

def cp(src, dst):
    d = os.path.join(OUT, dst); os.makedirs(os.path.dirname(d), exist_ok=True); shutil.copyfile(src, d)
    log.append("copy " + os.path.relpath(src, H) + " -> assets/v19/" + dst); return "assets/v19/" + dst

LUM = np.array([0.299, 0.587, 0.114])
def scenery_ink(src, dst, pct=0.5):  # == tools/import_v10.py scenery_ink
    p = np.asarray(Image.open(src).convert("RGBA")).astype(np.float64); rgb, al = p[..., :3], p[..., 3]
    m = (al >= 240) & (rgb.sum(-1) >= 660)
    W = np.array([max(1, int(np.searchsorted(np.cumsum(np.bincount(rgb[..., k][m].astype(int), minlength=256)), m.sum() * pct))) if m.any() else 255 for k in range(3)], float)
    LW = W @ LUM; a = np.clip((LW - rgb @ LUM) / LW, 0, 1)
    out = np.zeros_like(p); keep = (a > 0) & (al > 0); aa = np.where(keep, a, 1)[..., None]
    out[..., :3] = np.clip((rgb - (1 - aa) * W) / aa, 0, 255); out[..., 3] = np.where(keep, a * al, 0)
    d = os.path.join(OUT, dst); os.makedirs(os.path.dirname(d), exist_ok=True)
    Image.fromarray(np.clip(np.rint(out), 0, 255).astype(np.uint8), "RGBA").save(d, optimize=True)
    log.append("derived ink " + os.path.relpath(src, ROOT) + " -> assets/v19/" + dst); return "assets/v19/" + dst, W.astype(int).tolist()

man = json.load(open(V8 + "/atlases/manifest.json")); anims = {a["id"]: a for a in man["animations"]}
def cell_bbox(im, f): return im.crop((f["x"], f["y"], f["x"] + f["w"], f["y"] + f["h"])).split()[-1].getbbox()
seqs = {}
def seq(aid, key, idle_frame=None, status=""):
    a = anims[aid]; img = cp(V8 + "/atlases/" + a["image"], "sequences/" + a["image"])
    piv = a.get("pivot") or man["pivot"]; pivot = [piv[0] * man["frameWidth"], piv[1] * man["frameHeight"]]
    im = Image.open(os.path.join(ROOT, img))
    fr = [{"x": f["x"], "y": f["y"], "w": f["w"], "h": f["h"], "ms": f["durationMs"], "pose": os.path.basename(f.get("source", "")).replace(".png", "")} for f in a["frames"]]
    bb = [cell_bbox(im, f) for f in a["frames"]]
    o = {"img": img, "cell": [man["frameWidth"], man["frameHeight"]], "pivot": pivot, "frames": fr, "loop": False, "mul": 1,
         "standTop": min(b[1] for b in bb), "status": (status + " | " if status else "") + a.get("status", ""), "atlasId": aid,
         "sha256": hashlib.sha256(open(os.path.join(ROOT, img), "rb").read()).hexdigest()}
    seqs[key] = o
    if idle_frame is not None:  # the creature alone (victim swallowed / hidden): its standing drawing, same cell + pivot
        seqs[key.replace("_eat", "_idle")] = dict(o, frames=[fr[idle_frame]], loop=True, standTop=bb[idle_frame][1], status="idle = last drawing of " + aid + " (victim already swallowed)")
    return o

seq("dragon-sequence", "dragon_eat", 5, "MEGA BOSS dragon eats a member")
seq("toad-sequence", "toad_eat", 5, "large creature: toad eats a member")
seq("ogre-sequence", "ogre_eat", 5, "large creature: ogre eats a member")
seq("rabbits-flat-blood-sequence", "rabbits_tear", None, "rabbit death: swarm, latch, pull, tear, land, aftermath (flat blood)")
seq("knight-arrow-death", "knight_arrow_death", None, "arrow variant of the approved knight death")

# background dragon: the hill strip (back layer) + the coloured close-reveal cutout
hill = cp(V3 + "/art/dragon-hill-layer.png", "parallax/dragon-hill.png")
him = Image.open(os.path.join(ROOT, hill)); hb = him.split()[-1].getbbox()
ink, W = scenery_ink(os.path.join(ROOT, hill), "ink/parallax-dragon-hill.png")
# where the little dragon sits in the strip (source px)
drag = [1445, 330, 1750, 465]  # measured by eye on the strip (screenshots/v19/hill_dragon_crop.png): head left, tail curl right
cut = cp(V3 + "/art/dragon-colour-cutout.png", "characters/dragon-colour-cutout.png")
cim = Image.open(os.path.join(ROOT, cut)); cb = cim.split()[-1].getbbox()
art = {"root": "assets/v19/", "source": "incoming/medieval_math_handoff (v8 atlases, v3 encounter art)", "sequences": seqs,
       "hill": {"img": hill, "size": list(him.size), "bbox": list(hb), "dragon": drag, "ink": ink, "paper": W},
       "colourDragon": {"img": cut, "size": list(cim.size), "anchor": [round((cb[0] + cb[2]) / 2), cb[3]], "top": cb[1]}}
with open(os.path.join(ROOT, "src/config/art_v19.js"), "w") as f:
    f.write("// GENERATED by tools/import_v19.py (do not edit by hand). Handoff animations the game did not use before v19.\n")
    f.write("window.KM_ART19 = " + json.dumps(art, indent=1) + ";\n")
with open(os.path.join(OUT, "IMPORT_LOG.txt"), "w") as f: f.write("\n".join(log) + "\n")
print("\n".join(log)); print("dragon in hill strip", drag, "cutout", cim.size, cb)
