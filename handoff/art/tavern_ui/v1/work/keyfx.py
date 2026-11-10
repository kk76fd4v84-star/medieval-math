import numpy as np
from PIL import Image
from scipy import ndimage as ndi
def key(path, lo=40, hi=110, up=1, min_island=8, fill_holes=False):
    im=Image.open(path).convert('RGB')
    if up!=1: im=im.resize((im.width*up,im.height*up),Image.LANCZOS)
    a=np.asarray(im).astype(float)
    border=np.concatenate([a[0],a[-1],a[:,0],a[:,-1]])
    bg=np.median(border,axis=0)
    d=np.sqrt(((a-bg)**2).sum(-1))
    # magenta-ness: high R and B, low G -> extra guard: pixels where G much lower than both R,B and close in hue
    alpha=np.clip((d-lo)/(hi-lo),0,1)
    if fill_holes:
        fg=ndi.binary_fill_holes(alpha>0.5)
        core=ndi.binary_erosion(fg,iterations=3)
        alpha[core]=1
    al=alpha[...,None]
    rgb=np.where(al>0.02,(a-(1-al)*bg)/np.maximum(al,0.02),0)
    rgb=np.clip(rgb,0,255)
    # despill: limit pink tint on edges -> clamp B and R excess relative to G on low-alpha
    edge=(alpha<0.95)&(alpha>0)
    r,g,b=rgb[...,0],rgb[...,1],rgb[...,2]
    mb=np.minimum(b, np.maximum(g, r*0.55))
    rgb[...,2]=np.where(edge,mb,b)
    m=alpha>0.4
    lab,n=ndi.label(m)
    if n:
        sizes=ndi.sum(m,lab,range(1,n+1))
        small=np.isin(lab,np.where(sizes<min_island)[0]+1)
        alpha[small]=0
    # kill faint haze
    alpha[alpha<0.06]=0
    return Image.fromarray(np.dstack([rgb,alpha*255]).astype(np.uint8),'RGBA'), bg
