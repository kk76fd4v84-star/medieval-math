# Dedupe Magnus's v18 pack against everything we already have (file sha256, decoded-pixel sha256, perceptual dHash + alpha mask).
import hashlib, os, json, glob
from PIL import Image, ImageFile
import numpy as np
from concurrent.futures import ProcessPoolExecutor
ImageFile.LOAD_TRUNCATED_IMAGES = True
ROOT = "/workspace/knight-math-game"
NEW = ROOT + "/incoming/magnus_zip_1101"
SCOPE = ["incoming/magnus_art", "incoming/pack_v13", "incoming/medieval_math_handoff", "assets"]
def sig(p):
    try:
        raw = open(p, "rb").read(); fh = hashlib.sha256(raw).hexdigest()
        im = Image.open(p); im.seek(0); im = im.convert("RGBA"); a = np.asarray(im)
        ph = hashlib.sha256(a.tobytes() + str(a.shape).encode()).hexdigest()
        bg = Image.new("RGBA", im.size, (255, 255, 255, 255)); bg.alpha_composite(im)
        g = np.asarray(bg.convert("L").resize((17, 16), Image.LANCZOS)).astype(int)
        dh = (g[:, 1:] > g[:, :-1]).flatten()
        al = np.asarray(im.getchannel("A").resize((16, 16))).astype(int).flatten() > 127
        return p, fh, ph, dh.tolist(), al.tolist(), im.size
    except Exception:
        return p, None, None, None, None, None
def files(d): return [f for f in glob.glob(d + "/**/*", recursive=True) if f.lower().endswith((".png", ".gif"))]
if __name__ == "__main__":
    old = [f for d in SCOPE for f in files(ROOT + "/" + d)]
    new = files(NEW)
    with ProcessPoolExecutor() as ex: O = list(ex.map(sig, old, chunksize=8)); N = list(ex.map(sig, new))
    O = [o for o in O if o[1]]
    out = []
    for p, fh, ph, dh, al, sz in N:
        rel = os.path.relpath(p, NEW)
        if fh is None: out.append((rel, "UNREADABLE", "", "")); continue
        same = [o for o in O if o[1] == fh]
        if same: out.append((rel, "SAME FILE", os.path.relpath(same[0][0], ROOT), "")); continue
        samep = [o for o in O if o[2] == ph]
        if samep: out.append((rel, "SAME PIXELS", os.path.relpath(samep[0][0], ROOT), "")); continue
        dhn = np.array(dh); aln = np.array(al); best = None
        for o in O:
            d = int((dhn != np.array(o[3])).sum()) + int((aln != np.array(o[4])).sum()) // 2
            ar = abs(np.log((sz[0] / sz[1]) / (o[5][0] / o[5][1])))
            score = d + 60 * ar
            if best is None or score < best[0]: best = (score, o)
        s, o = best
        out.append((rel, "SIMILAR" if s <= 40 else "NEW", os.path.relpath(o[0], ROOT), "dist %.0f, %dx%d vs %dx%d" % (s, sz[0], sz[1], o[5][0], o[5][1])))
    json.dump(out, open("/tmp/dedupe_v18.json", "w"), indent=1)
    for r in out: print(" | ".join(r))
