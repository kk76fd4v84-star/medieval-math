import numpy as np, glob
from PIL import Image
from scipy import ndimage as ndi
def cov(f):
    a=np.asarray(Image.open(f))[...,3]/255
    m=ndi.binary_closing(a>0.3,iterations=3); m=ndi.binary_fill_holes(m)&ndi.binary_dilation(a>0.3,iterations=2)
    return a[m].mean(), m.sum()
d=[cov(f'/workspace/knight-math-game/assets/v10/ink/glyph-digit-{i}.png') for i in range(10)]
l=[cov(f'/workspace/handoff_to_maggi/alphabet/{L}.png') for L in 'ABCDEHMORSX']
print('digits',np.mean([x[0] for x in d]),'letters',np.mean([x[0] for x in l]))
