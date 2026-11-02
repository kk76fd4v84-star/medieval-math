#!/usr/bin/env python3
"""Assemble the v10 proof images from tools/v10_capture.js output (+ the reference):
 screenshots/v10_walks.gif          party walking over the frontGround (12 fps = real time, 2 cycles; hero, scarf, feather, moustache)
 screenshots/v10_walks_stripe.gif   same with 'stripe' in the party
 screenshots/v10_walks_strip.png    frame strip: 12 frames of one cycle (both parties), 1:1 crops of the stage
 screenshots/v10_vs_reference.png   locked-style-game-math-v2-glint.png (left) vs our 1600x900 combat screen (right), same height
"""
import os, glob
from PIL import Image, ImageDraw
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); S = R + "/screenshots"
REF = R + "/incoming/medieval_math_handoff/MedievalMath-Handoff/output/concept-art/locked-style-game-math-v2-glint.png"
CROP = (0, 200, 1150, 640)
def gif(tag, out):
    fr = [Image.open(f).convert("RGB").crop(CROP) for f in sorted(glob.glob(f"{S}/v10_walk_frames{tag}/*.png"))]
    fr = [f.resize((f.width * 2 // 3, f.height * 2 // 3), Image.LANCZOS) for f in fr]
    fr[0].save(out, save_all=True, append_images=fr[1:], duration=83, loop=0, optimize=True); return len(fr)
n1 = gif("", S + "/v10_walks.gif"); n2 = gif("_stripe", S + "/v10_walks_stripe.gif")
rows = []
for tag in ["", "_stripe"]:
    fr = [Image.open(f).convert("RGB").crop(CROP) for f in sorted(glob.glob(f"{S}/v10_walk_frames{tag}/*.png"))[:12]]
    w, h = fr[0].size; sheet = Image.new("RGB", (w * 4, h * 3), "white")
    for i, f in enumerate(fr):
        sheet.paste(f, ((i % 4) * w, (i // 4) * h)); ImageDraw.Draw(sheet).text(((i % 4) * w + 8, (i // 4) * h + 8), f"t={i*83} ms", fill=(40, 30, 20))
    rows.append(sheet)
strip = Image.new("RGB", (rows[0].width, rows[0].height * 2 + 20), "white"); strip.paste(rows[0], (0, 0)); strip.paste(rows[1], (0, rows[0].height + 20))
strip = strip.resize((strip.width // 2, strip.height // 2), Image.LANCZOS); strip.save(S + "/v10_walks_strip.png")
ref = Image.open(REF).convert("RGB"); ours = Image.open(S + "/v10_combat_1600x900.png").convert("RGB")
H = 900; ref = ref.resize((round(ref.width * H / ref.height), H), Image.LANCZOS)
c = Image.new("RGB", (ref.width + 20 + ours.width, H + 40), "white"); c.paste(ref, (0, 40)); c.paste(ours, (ref.width + 20, 40))
d = ImageDraw.Draw(c); d.text((10, 12), "REFERENCE locked-style-game-math-v2-glint.png (scaled to 900 px high)", fill=(0, 0, 0)); d.text((ref.width + 30, 12), "OURS v10, 1600x900 stage, 1:1 (combat, near-forest)", fill=(0, 0, 0))
c.save(S + "/v10_vs_reference.png"); print("gif frames", n1, n2, "strip", strip.size, "vs", c.size)
