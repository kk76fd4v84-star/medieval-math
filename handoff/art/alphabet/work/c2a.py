import numpy as np
from PIL import Image
def c2a(path, floor=0.06):
    a=np.asarray(Image.open(path).convert('RGB')).astype(float)
    B=5; border=np.concatenate([a[:B].reshape(-1,3),a[-B:].reshape(-1,3),a[:,:B].reshape(-1,3),a[:,-B:].reshape(-1,3)])
    W=np.median(border,0)
    al=np.max((W-a)/W,axis=-1); al=np.clip(al,0,1)
    ink=np.where(al[...,None]>0,(a-(1-al[...,None])*W)/np.maximum(al[...,None],1e-3),0)
    ink=np.clip(ink,0,255)
    t=np.clip((al-floor)/floor,0,1); sm=t*t*(3-2*t)
    A=np.where(al<=floor,0,al*sm)
    return Image.fromarray(np.dstack([ink,A*255]).astype(np.uint8),'RGBA'), W
