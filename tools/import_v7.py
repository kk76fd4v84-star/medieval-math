#!/usr/bin/env python3
"""Import Magnus's approved art handoff into assets/v7/ and write src/config/art_v7.js.
Originals in incoming/ are read-only: files are COPIED byte-for-byte; the only derived files are
plain rectangular crops (no repainting, no scaling, no filtering), listed in DERIVED below.
Re-run any time:  python3 tools/import_v7.py
"""
import json, os, shutil
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
H = os.path.join(ROOT, "incoming/medieval_math_handoff/MedievalMath-Handoff/output")
OUT = os.path.join(ROOT, "assets/v7")
V8, V6, V4, AP = H + "/medieval-math-production-v8", H + "/medieval-math-creatures-v6", H + "/medieval-math-combat-v4", H + "/medieval-math-animation-pack-v2"
copied, derived = [], []

def cp(src, dst):
    d = os.path.join(OUT, dst); os.makedirs(os.path.dirname(d), exist_ok=True)
    shutil.copyfile(src, d); copied.append((os.path.relpath(src, H), dst)); return dst

def crop(src, box, dst, why):
    d = os.path.join(OUT, dst); os.makedirs(os.path.dirname(d), exist_ok=True)
    Image.open(src).crop(box).save(d); derived.append((os.path.relpath(src, H), list(box), dst, why)); return dst

def bbox(path):
    im = Image.open(os.path.join(OUT, path)); return im.size, im.split()[-1].getbbox()

def cut(src, dst, status):
    cp(src, dst); (w, h), bb = bbox(dst)
    return {"img": dst, "size": [w, h], "anchor": [round((bb[0] + bb[2]) / 2), bb[3]], "top": bb[1], "status": status}

art = {"root": "assets/v7/", "source": "incoming/medieval_math_handoff (Magnus, 2026-11-01)", "cutouts": {}, "sequences": {}, "graves": {}, "parallax": {}, "scenes": {}, "glyphs": {}}

# --- parchment + strip (rect crops of the v8 exterior background, which is plain painted parchment there)
ext = V8 + "/layers/exterior-background.png"
art["parchment"] = {"img": crop(ext, (0, 640, 1774, 887), "ui/parchment.png", "plain parchment below the divider, tiled behind the scene"), "size": [1774, 247]}
art["sky"] = {"img": crop(ext, (0, 0, 1774, 230), "ui/sky.png", "parchment sky with the painted cloud scribbles and birds"), "size": [1774, 230]}
art["strip_bg"] = {"img": crop(ext, (0, 597, 1774, 887), "ui/strip_bg.png", "strip background: painted ground divider (diamond) + parchment"), "size": [1774, 290], "dividerY": 6}

# --- parallax strips (2172x724, paper-white interiors, transparent surroundings)
for n in ["01-castle", "02-hills", "03-distant-woods", "04-village", "05-tree-props", "06-near-forest", "07-barren-rocks", "08-canyon", "09-fields"]:
    p = cp(H + "/concept-art/expansion-v2/parallax/%s.png" % n, "parallax/%s.png" % n)
    (w, h), bb = bbox(p); art["parallax"][n[3:]] = {"img": p, "size": [w, h], "bbox": list(bb)}
# individual trees from the tree-props sheet: split at fully transparent columns (rect crops)
im = Image.open(H + "/concept-art/expansion-v2/parallax/05-tree-props.png"); a = im.split()[3]
cols = [a.crop((x, 0, x + 1, im.height)).getbbox() is not None for x in range(im.width)]
runs, x = [], 0
while x < im.width:
    if cols[x]:
        s = x
        while x < im.width and cols[x]: x += 1
        if x - s > 60: runs.append((s, x))
    x += 1
art["trees"] = []
for i, (s, e) in enumerate(runs):
    bb = im.crop((s, 0, e, im.height)).split()[3].getbbox()
    p = crop(H + "/concept-art/expansion-v2/parallax/05-tree-props.png", (s, bb[1], e, bb[3]), "parallax/tree-%d.png" % i, "single tree cut from 05-tree-props at transparent columns")
    art["trees"].append({"img": p, "size": [e - s, bb[3] - bb[1]], "anchor": [(e - s) // 2, bb[3] - bb[1]]})

# --- characters (static cutouts; feet anchor = bottom-centre of the opaque bounds)
C = art["cutouts"]
for n in ["stripe", "scarf", "feather", "moustache"]:
    C["companion_" + n] = cut(V6 + "/companions/%s.png" % n, "characters/companion-%s.png" % n, "v6 companion design cutout (static, not rigged)")
for n, src in [("goblin", AP + "/art/sprites/goblin.png"), ("skeleton", AP + "/art/sprites/skeleton.png"), ("warlock", AP + "/art/sprites/warlock.png"),
               ("scholar", AP + "/art/sprites/scholar.png"), ("friar", AP + "/art/sprites/friar.png"),
               ("black_knight", H + "/concept-art/expansion-v2/characters/black-knight-one-arm-blood.png")]:
    C[n] = cut(src, "characters/%s.png" % n, "earlier pack cutout (animation-pack-v2 / expansion-v2): provisional, review eyes/style")

# --- drawn sequences from the v8 atlases (fixed 768 cells, per-frame holds, no interpolation, non-looping)
man = json.load(open(V8 + "/atlases/manifest.json"))
anims = {a["id"]: a for a in man["animations"]}
def seq(aid, dst, frames=None, status=None):
    a = anims[aid]; p = cp(V8 + "/atlases/" + a["image"], dst)
    piv = a.get("pivot") or man["pivot"]
    fr = [{"x": f["x"], "y": f["y"], "w": f["w"], "h": f["h"], "ms": f["durationMs"], "pose": f.get("pose") or os.path.basename(f.get("source", "")).replace(".png", "")} for f in a["frames"]]
    if frames is not None: fr = [fr[i] for i in frames]
    return {"img": p, "cell": [man["frameWidth"], man["frameHeight"]], "pivot": [piv[0] * man["frameWidth"], piv[1] * man["frameHeight"]], "frames": fr, "loop": False, "status": status or a.get("status")}
S = art["sequences"]
S["knight_death"] = seq("knight-death", "sequences/knight-death.png", status="APPROVED drawn death (combat-v4/drawn-death): stagger, heavens, knees, fall, plant")
ra = anims["rabbit-hit-and-death"]
S["rabbit_idle"] = seq("rabbit-hit-and-death", "sequences/rabbit-hit-and-death.png", frames=[0]); S["rabbit_idle"]["loop"] = True
S["rabbit_hit"] = seq("rabbit-hit-and-death", "sequences/rabbit-hit-and-death.png", frames=ra["nonlethal"])
S["rabbit_death"] = seq("rabbit-hit-and-death", "sequences/rabbit-hit-and-death.png", frames=ra["lethal"])
# rabbit standing height from the ready frame (for scale)
img = Image.open(os.path.join(OUT, "sequences/rabbit-hit-and-death.png")); bb = img.crop((0, 0, 768, 768)).split()[3].getbbox(); S["rabbit_idle"]["standTop"] = bb[1]
img = Image.open(os.path.join(OUT, "sequences/knight-death.png")); bb = img.crop((0, 0, 768, 768)).split()[3].getbbox(); S["knight_death"]["standTop"] = bb[1]

# --- graves with killer emblems (v6/graves = v8 art/graves-restored)
for n in ["rabbit", "dragon", "toad", "goblin"]:
    art["graves"][n] = cut(V6 + "/graves/%s.png" % n, "graves/grave-%s.png" % n, "v6 grave candidate with %s emblem (restored set)" % n)

# --- layered rest-stop scenes (1774x887 canvas, all layers at 0,0) + EXIT
lm = json.load(open(V8 + "/layers/manifest.json"))
for sid, sc in lm["scenes"].items():
    layers = []
    for L in sc["layers"]:
        if "image" in L: layers.append({"img": cp(V8 + "/layers/" + L["image"], "scenes/" + L["image"]), "z": L["z"]})
        else: layers.append({"slot": L["slot"], "z": L["z"]})
    o = {"canvas": lm["canvas"], "layers": layers}
    for k in ["seatAnchors", "barStaffAnchor", "facadePlacement", "doorRect"]:
        if k in sc: o[k] = sc[k]
    art["scenes"][sid] = o
art["scenes"]["tavern-exterior"]["facadeCut"] = {"img": cp(V8 + "/layers/props/facade.png", "scenes/props/facade.png"), "size": list(Image.open(V8 + "/layers/props/facade.png").size)}
art["scenes"]["tavern-exterior"]["doorBackingCrop"] = {"img": crop(V8 + "/layers/exterior-door-interior.png", tuple(lm["scenes"]["tavern-exterior"]["facadePlacement"][:2]) + (lm["scenes"]["tavern-exterior"]["facadePlacement"][0] + lm["scenes"]["tavern-exterior"]["facadePlacement"][2], lm["scenes"]["tavern-exterior"]["facadePlacement"][1] + lm["scenes"]["tavern-exterior"]["facadePlacement"][3]), "scenes/exterior-door-backing-cut.png", "door backing cropped to the facade placement rect so it registers with facade.png")}
fl = Image.open(V8 + "/layers/exterior-facade.png"); fp = lm["scenes"]["tavern-exterior"]["facadePlacement"]
art["scenes"]["tavern-exterior"]["facadeCrop"] = {"img": crop(V8 + "/layers/exterior-facade.png", (fp[0], fp[1], fp[0] + fp[2], fp[1] + fp[3]), "scenes/exterior-facade-cut.png", "facade layer cropped to its placement rect (registered with the door backing)"), "size": [fp[2], fp[3]]}
ex = cp(V8 + "/art/exit.png", "ui/exit.png"); art["exit"] = {"img": ex, "size": list(Image.open(V8 + "/art/exit.png").size), "bbox": list(Image.open(V8 + "/art/exit.png").split()[3].getbbox())}

# --- D20 roll atlases (choose result first, play roll-to-N, hold the result)
dm = json.load(open(V8 + "/dice/manifest.json"))
for n in range(1, 21):
    cp(V8 + "/dice/roll-to-%d.png" % n, "dice/roll-to-%d.png" % n); cp(V8 + "/dice/result-%d.png" % n, "dice/result-%d.png" % n)
f0 = dm["outcomes"][0]["frames"]
art["dice"] = {"roll": "dice/roll-to-{n}.png", "still": "dice/result-{n}.png", "cell": [dm["frameWidth"], dm["frameHeight"]], "cols": dm["columns"], "frames": dm["frameCount"],
               "ms": f0[0]["durationMs"], "settleMs": dm["settleMs"], "pivot": dm["pivot"], "loop": False}

# --- engraved numerals/operators (slices of the master reference numerals, animation-pack-v2 sprites)
for i in range(10): art["glyphs"]["digit_%d" % i] = {"img": "assets/v7/" + cp(AP + "/art/sprites/digit-%d.png" % i, "numerals/digit-%d.png" % i)}
for i, k in enumerate(["op_plus", "op_minus", "op_times", "op_divide", "op_equals"]): art["glyphs"][k] = {"img": "assets/v7/" + cp(AP + "/art/sprites/operator-%d.png" % i, "numerals/operator-%d.png" % i)}

art["copied"] = len(copied); art["derivedCrops"] = [{"from": a, "rect": b, "to": c, "why": d} for a, b, c, d in derived]
with open(os.path.join(ROOT, "src/config/art_v7.js"), "w") as f:
    f.write("// GENERATED by tools/import_v7.py from Magnus's handoff. Do not hand-edit; re-run the tool.\n")
    f.write("// Paths are relative to assets/v7/ unless they start with assets/.\n")
    f.write("window.KM_ART7 = " + json.dumps(art, indent=1) + ";\n")
with open(os.path.join(OUT, "IMPORT_LOG.txt"), "w") as f:
    f.write("Copied byte-for-byte (%d files):\n" % len(copied)); f.writelines("  %s -> %s\n" % c for c in copied)
    f.write("\nRectangular crops (no pixel edits):\n"); f.writelines("  %s %s -> %s  (%s)\n" % d for d in derived)
print("copied", len(copied), "derived", len(derived), "trees", len(art["trees"]))
