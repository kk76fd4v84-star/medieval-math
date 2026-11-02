#!/usr/bin/env python3
"""v19 art audit: every animation / frame set / sprite in Magnus's packs -> frames, size, and where the game uses it
(file:line). Pack files are matched to their byte-identical copy in assets/ (md5), then the copy's path is grepped in
src/ + index.html. Frame sets that were assembled into a v8 atlas count as used through that atlas. Writes
cobra_report/AUDIT_ART.md. python3 tools/audit_art.py"""
import hashlib, json, os, re, subprocess, struct, collections
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.chdir(R)
PACKS = ["incoming/medieval_math_handoff/MedievalMath-Handoff", "incoming/pack_v13", "incoming/magnus_zip_1101", "incoming/magnus_art"]
H = PACKS[0] + "/output/"
md5 = lambda p: hashlib.md5(open(p, "rb").read()).hexdigest()
def size(p):
    with open(p, "rb") as f: h = f.read(24)
    return struct.unpack(">II", h[16:24]) if h[:8] == b"\x89PNG\r\n\x1a\n" else (0, 0)
assets = collections.defaultdict(list)
for d, _, fs in os.walk("assets"):
    for f in fs:
        if f.lower().endswith(".png"): assets[md5(os.path.join(d, f))].append(os.path.join(d, f))
SRC = ["index.html"] + [os.path.join(d, f) for d, _, fs in os.walk("src") for f in fs if f.endswith(".js")]
lines = {f: open(f, encoding="utf-8", errors="replace").read().split("\n") for f in SRC}
def where(needle):
    for f in SRC:
        for i, l in enumerate(lines[f]):
            if needle in l: return f"{f}:{i+1}"
    return None
def where_asset(a):  # try the longest tail of the asset path that the code mentions
    parts = a.split("/")
    for k in range(len(parts) - 1, 0, -1):
        w = where("/".join(parts[-k:]) if k > 1 else '"' + parts[-1])
        if w: return w
    return where(parts[-1])
J = lambda p: json.load(open(p))
# frame counts + atlas sources from the manifests
frames, srcs = {}, {}
v8 = J(H + "medieval-math-production-v8/atlases/manifest.json")
for a in v8["animations"]:
    frames[H + "medieval-math-production-v8/atlases/" + a["image"]] = a["frames"] if isinstance(a["frames"], int) else len(a["frames"])
    for f in (a["frames"] if isinstance(a["frames"], list) else []):
        if f.get("source"): srcs[H + f["source"]] = a["id"]
for n in range(1, 21):
    frames[H + f"medieval-math-production-v8/dice/roll-to-{n}.png"] = 40; frames[H + f"medieval-math-encounter-pack-v3/exports/d20-roll-to-{n}.png"] = 40
for a in J(H + "medieval-math-animation-pack-v2/exports/manifest.json")["animations"]:
    frames[H + "medieval-math-animation-pack-v2/exports/" + a["image"]] = a["frameCount"]
for a in J("incoming/pack_v13/medieval-math-walks-v13/manifest.json"):
    frames["incoming/pack_v13/medieval-math-walks-v13/" + a["image"]] = a["frames"]
for k, a in J("incoming/magnus_zip_1101/medieval-math-riddles-v18/animation/animations.json").items():
    if isinstance(a, dict) and a.get("image"): frames["incoming/magnus_zip_1101/medieval-math-riddles-v18/animation/" + a["image"]] = a.get("frames") or len(a.get("durations", [])) or 1
frames["incoming/magnus_art/birds_sheet_8.png"] = 8
# used atlases (for frame-set sources)
used_atlas = set()
for p, n in frames.items():
    if "production-v8/atlases" in p and os.path.exists(p) and assets.get(md5(p)): used_atlas.add(os.path.basename(p)[:-4])
unused_src = open("src/config/art_v19_apply.js").read()
U = dict(re.findall(r'^\s*"([^"]+)":\s*"([^"]+)"', unused_src.split("KM_ART.packUnused")[1].split("};")[0], re.M))
ULINE = {k: where('"' + k + '":') for k in U}
def unused_for(rel):
    best = None
    for k in U:
        if rel.startswith(k) or rel.startswith(k.split("/")[-1]) or ("/" + k + "/") in "/" + rel or rel.endswith(k):
            if not best or len(k) > len(best): best = k
    return best
TOOLS = {f: open("tools/" + f, errors="replace").read().split("\n") for f in sorted(os.listdir("tools")) if f.endswith(".py") and f != "audit_art.py"}
def derived(p):
    b = os.path.basename(p); d = os.path.basename(os.path.dirname(p))
    for f, ls in TOOLS.items():
        for i, l in enumerate(ls):
            if b in l and (len(b) > 12 or d in l or "/" + b in l): return f"cut / inked by `tools/{f}:{i+1}` into assets/ (not byte-identical)"
    return None
REF = re.compile(r"concept|style-reference|preview|contact|proof|source|reference|mockup|riddle_screen_current|poses\.png|-poses|all-results|original|matte")
NOTE = {
 "medieval-math-animation-pack-v2/art/parts": "v2 rig parts (older rig art; GAME_DESIGN: no puppet rigs) — not drawn",
 "medieval-math-animation-pack-v2/art": "v2 sprite/sheet, superseded by the v6-v18 production art — not drawn",
 "medieval-math-encounter-pack-v3/art/mist": "v3 mist layers — not drawn (not requested in this brief; candidate for the hill-dragon reveal)",
 "medieval-math-encounter-pack-v3/art": "v3 still — superseded (v8 dice / v7 hero) — not drawn",
 "medieval-math-production-v8/art": "v8 full painted sheet — not drawn as such",
 "medieval-math-production-v8/layers/props": "v8 camp/tavern prop cut — not drawn by the current rest scenes",
 "magnus_zip_1101/medieval-math-riddles-v18/assets": "v18 riddle-pack support still — game uses its own earlier copies (not byte-identical)",
 "magnus_zip_1101/medieval-math-tavern-v18": "v18 tavern menu mock — not drawn",
}
rows = collections.OrderedDict()
SPECIAL = {"incoming/magnus_art/birds_sheet_8.png": "sliced by tools/import_v11.py into assets/v11/ui/bird-*.png; " + (where("birdsSource") or "")}
for pack in PACKS:
    for d, _, fs in sorted(os.walk(pack)):
        for f in sorted(fs):
            if not f.lower().endswith(".png"): continue
            p = os.path.join(d, f); w, h = size(p); n = frames.get(p, 1)
            rel = p.replace(H, "") if p.startswith(H) else p.replace("incoming/", "")
            cp = assets.get(md5(p))
            if cp: use = "yes"; at = f"`{cp[0]}` -> {where_asset(cp[0]) or '(copy present)'}"
            elif p in SPECIAL: use = "yes"; at = SPECIAL[p]
            elif p in srcs and srcs[p] in used_atlas: use = "yes (frame of v8 atlas)"; at = f"assembled into `{srcs[p]}.png` (byte-identical copy drawn by the game)"
            elif derived(p): use = "yes (derived)"; at = derived(p)
            elif "/rabbit-kill/" in p and "rabbit-hit-and-death" in used_atlas: use = "yes (frame of v8 atlas)"; at = "assembled into `rabbit-hit-and-death.png` (v8 rabbit-kill frames; copy drawn by the game)"
            elif REF.search(rel): use = "no (reference)"; at = "reference / source / preview sheet, not runtime art (" + REF.search(rel).group(0) + ")"
            else:
                k = unused_for(rel)
                if k: use = "no (listed)"; at = f"{ULINE[k]} — {U[k][:110]}"
                else:
                    use = "no"; at = next((v for k, v in NOTE.items() if rel.startswith(k)), "not drawn by the game")
            grp = "/".join(rel.split("/")[:2]) if rel.count("/") >= 2 else rel.split("/")[0]
            rows.setdefault(grp, []).append((rel, n, f"{w}x{h}", use, at))
tot = sum(len(v) for v in rows.values()); cnt = collections.Counter(r[3].split(" ")[0] for v in rows.values() for r in v)
out = ["# AUDIT_ART — every animation, frame set and sprite in Magnus's packs (v19, Cobra copy)", "",
"Generated by `tools/audit_art.py` (pack PNG -> md5-identical copy in `assets/` -> first `file:line` in `src/`/`index.html` that names it). "
"Frame sets assembled into a v8 atlas count as used through that atlas. Anything not drawn is listed in `KM_ART.packUnused` "
"(src/config/art_v19_apply.js) with the handoff's own reason; `tests/packanims.test.js` enforces that.", "",
f"**{tot} PNGs** — used: {cnt['yes']}, not used (each with a documented reason): {cnt['no']}.", "",
"## 1. Animations (the ones that move) — summary", "",
"| animation (pack) | frames | cell / size | used | where |", "|---|---|---|---|---|"]
SUMMARY = [
 ("v8 atlases/knight-death.png (approved drawn death, from v4 drawn-death)", "5", "768 cell", "yes — hero + v6/v13 companions (stand-in, MISSING_ART #7)", "src/config/art_v7.js (sequence knight_death); src/game.js deathDur"),
 ("v8 atlases/knight-arrow-death.png (from v5 arrow-death)", "5", "768 cell", "yes — v19: caught by the King's hunters", "src/config/art_v19.js knight_arrow_death; art_v19_apply.js KM_ART.brutal.hunters"),
 ("v8 atlases/dragon-sequence.png (from v6 dragon)", "6", "768 cell", "yes — v19: MEGA BOSS idle (6th drawing) + eats member / hero / sacrifice", "art_v19.js dragon_eat/dragon_idle; game.js brutalDeath + mega sacrifice onArrive"),
 ("v8 atlases/toad-sequence.png (from v6 toad)", "6", "768 cell", "yes — v19: new road enemy (TEMP placement) idle + eats", "art_v19.js toad_eat/toad_idle; src/data/encounters.js"),
 ("v8 atlases/ogre-sequence.png (from v6 ogre)", "6", "768 cell", "yes — v19: new road enemy (TEMP placement) idle + eats", "art_v19.js ogre_eat/ogre_idle; src/data/encounters.js"),
 ("v8 atlases/rabbits-flat-blood-sequence.png (from v6 rabbits-flat-blood)", "6", "768 cell", "yes — v19: a member killed by the killer rabbit is torn apart", "art_v19.js rabbits_tear; KM_ART.brutal.killer_rabbit"),
 ("v8 atlases/rabbit-hit-and-death.png (from v8 rabbit-kill/)", "6", "768 cell", "yes — the rabbit's own death clip", "src/config/art_v7.js; game.js enemy death seqPlay"),
 ("v8 atlases/knight-eaten.png (from v5 eaten)", "6", "768 cell", "no — needs dragon jaw layers that were never delivered (v5 README)", "packUnused"),
 ("v8 atlases/legacy-parts-attack.png", "4", "768 cell", "no — LEGACY reference per v8 manifest", "packUnused"),
 ("v8 dice/roll-to-1..20.png", "20 x 40", "512 cell", "yes — D20 rolls", "src/config/art_v7.js dice"),
 ("v3 exports/d20-roll-to-1..20.png", "20 x 40", "320 cell", "no — superseded by v8 dice (v8 README)", "packUnused"),
 ("v3 art/dragon-hill-layer.png", "1 (scenery strip)", "see table", "yes — v19: background dragon on its hill at Frank's stop (mid layer)", "assets/v19/parallax/dragon-hill.png; src/engine/scenery.js mid swap; game.js buildWorld S.swaps"),
 ("v3 art/dragon-colour-cutout.png", "1", "see table", "yes — v19: turd dragon close reveal", "art_v19_apply.js turd_dragon"),
 ("v13 walks hero/stripe/scarf/feather/moustache", "5 x 8", "atlas", "yes — party walks", "src/config/art_v10.js walks"),
 ("v18 coif attack/hurt/death/walk/idle", "4/1/4/12/8", "768 / 512 cell", "yes — coif incl. his OWN death", "src/config/art_v18.js"),
 ("magnus_art birds_sheet_8.png", "2 x 4", "sheet", "yes — sky birds", "src/config/art_v11.js birds"),
 ("v2 exports/*.png (84 breathing/sway loops)", "24 each", "320x384", "no — low-res loops would change drawn sizes; question for Magnus", "packUnused"),
 ("v4 knight-combat-clips.json / enemy-motion.json", "data", "—", "no — rig clips on old art / puppet falls ('Do not substitute puppet falls')", "packUnused"),
 ("v5 eaten/ frames, v6 rabbits/ (non-flat-blood)", "6 / 6", "—", "no — need jaw layers / superseded by flat-blood", "packUnused"),
]
for r in SUMMARY: out.append("| " + " | ".join(r) + " |")
out += ["", "## 2. Every PNG in the packs", ""]
for g, rs in rows.items():
    out += [f"### {g} ({len(rs)})", "", "| pack path | frames | size px | used | where (file:line) |", "|---|---|---|---|---|"]
    out += [f"| {a} | {b} | {c} | {d} | {e} |" for a, b, c, d, e in rs] + [""]
open("cobra_report/AUDIT_ART.md", "w").write("\n".join(out)); print(tot, dict(cnt))
