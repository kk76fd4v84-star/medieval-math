"""Preserve ImageGen RGB; clean only low-alpha extraction fringe and near-opaque matte.
Magnus explicitly authorised deterministic pixel/edge cleanup earlier in this chat.
"""
from pathlib import Path
from PIL import Image
import numpy as np

source = Path('/Users/magnusjansson/.codex/generated_images/01a193c0-0a31-7800-b92c-2684d1f1dc20/exec-fbdaf1b0-3b02-4086-b3c3-5a38880ce307.png')
out = Path(__file__).parent
a = np.array(Image.open(source).convert('RGBA'))
alpha = a[:, :, 3].astype(float)
a[:, :, 3] = np.clip((alpha - 12) * 255 / (240 - 12), 0, 255).round().astype('uint8')
a[a[:, :, 3] == 0, :3] = 0
assert a[a.shape[0]//2, a.shape[1]//2, 3] == 0
assert a[int(a.shape[0]*.95), a.shape[1]//2, 3] == 255
Image.fromarray(a).save(out/'tunnel-slice.png')
