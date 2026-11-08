import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
def key(path, bgcol=None, thr_lo=30, thr_hi=90, up=2):
    im=Image.open(path).convert('RGB')
    im=im.resize((im.width*up,im.height*up),Image.LANCZOS)
    a=np.asarray(im).astype(float)
    if bgcol is None:
        border=np.concatenate([a[0],a[-1],a[:,0],a[:,-1]])
        bgcol=np.median(border,axis=0)
    d=np.sqrt(((a-bgcol)**2).sum(-1))
    print('bg',bgcol)
    # background = connected to border with d<thr_hi
    cand=d<thr_hi
    lab,n=ndi.label(cand)
    edge=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    bg=np.isin(lab,list(edge))
    alpha=np.clip((d-thr_lo)/(thr_hi-thr_lo),0,1)
    alpha[~bg]=1.0
    # solid core: fill holes of foreground
    fg=ndi.binary_fill_holes(~bg)
    core=ndi.binary_erosion(fg,iterations=3*up)
    alpha[core]=1
    alpha[~fg]=0 if False else alpha[~fg]
    # decontaminate colour on edge: unmix bg
    al=alpha[...,None]
    rgb=np.where(al>0.01,(a-(1-al)*bgcol)/np.maximum(al,0.01),0)
    rgb=np.clip(rgb,0,255)
    # remove tiny islands
    m=alpha>0.5
    lab2,n2=ndi.label(m)
    sizes=ndi.sum(m,lab2,range(1,n2+1))
    for i,s in enumerate(sizes):
        if s<200*up*up: alpha[lab2==i+1]=0
    out=np.dstack([rgb,alpha*255]).astype(np.uint8)
    return Image.fromarray(out,'RGBA')
