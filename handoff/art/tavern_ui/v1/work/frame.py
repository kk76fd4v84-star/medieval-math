import numpy as np, os
from PIL import Image
from scipy import ndimage as ndi
OUT='/workspace/handoff_to_maggi/tavern_ui/v1'
R=Image.open('/workspace/handoff_to_maggi/tavern_ui/riddle-frame.png').convert('RGBA'); W,H=R.size
CW,CHh=248,150          # corner crop (source px)
SIDE=(305,365)          # side piece with the small diamond (source rows)
TILE=(300,500)          # plain line segment for the stretch middle (source cols)
def crop(x0,y0,x1,y1): return R.crop((x0,y0,x1,y1))
def build_source(mid_w=704):
    hs=CHh*2+(SIDE[1]-SIDE[0]); ws=CW*2+mid_w
    c=Image.new('RGBA',(ws,hs),(0,0,0,0))
    c.alpha_composite(crop(0,0,CW,CHh),(0,0))
    c.alpha_composite(crop(W-CW,0,W,CHh),(ws-CW,0))
    c.alpha_composite(crop(0,H-CHh,CW,H),(0,hs-CHh))
    c.alpha_composite(crop(W-CW,H-CHh,W,H),(ws-CW,hs-CHh))
    c.alpha_composite(crop(0,SIDE[0],CW,SIDE[1]),(0,CHh))
    c.alpha_composite(crop(W-CW,SIDE[0],W,SIDE[1]),(ws-CW,CHh))
    tw=TILE[1]-TILE[0]; x=CW
    top=crop(TILE[0],0,TILE[1],CHh); bot=crop(TILE[0],H-CHh,TILE[1],H)
    while x<ws-CW:
        w=min(tw,ws-CW-x)
        c.alpha_composite(top.crop((0,0,w,CHh)),(x,0)); c.alpha_composite(bot.crop((0,0,w,CHh)),(x,hs-CHh)); x+=w
    return c
def masks(im):
    a=np.asarray(im).astype(float); r,g,b,al=[a[...,i] for i in range(4)]
    orange=(al>20)&(r>130)&(r-g>45)&(r-b>70)
    return a,orange
def state(im,st):
    a,orange=masks(im); out=a.copy()
    ink=(a[...,3]>20)&~orange
    if st in ('normal','disabled'):
        out[orange,3]=0                       # leaves hollow: ink outline only
    if st=='hover':
        # fill the small black diamonds (sides + line ends) with orange, keeping a black rim
        dark=(a[...,3]>200)&~orange&(a[...,:3].mean(-1)<80)
        band=np.zeros_like(dark); hs=a.shape[0]; ws=a.shape[1]
        band[CHh-10:hs-CHh+10,:70]=True; band[CHh-10:hs-CHh+10,ws-70:]=True
        inner=ndi.binary_erosion(dark&band,iterations=3)
        out[inner,:3]=[196,98,40]                      # side diamonds: orange core, black rim
        lab,n=ndi.label(dark)
        for i in range(1,n+1):
            m=lab==i; k=m.sum()
            if 60<=k<=220:                             # the small round dots by the lines
                out[ndi.binary_erosion(m,iterations=1),:3]=[196,98,40]
    if st=='disabled':
        out[ink,:3]=[118,106,94]; out[...,3]*=0.55
    return Image.fromarray(np.clip(out,0,255).astype(np.uint8),'RGBA')
if __name__=='__main__':
    os.makedirs(OUT,exist_ok=True)
    src=build_source()                        # 1200x360 source = 300x90 at 0.25
    for scale,suf in [(0.25,''),(0.5,'@2x')]:
        sz=(round(src.width*scale),round(src.height*scale))
        for st in ['normal','hover','disabled']:
            im=state(src,st).resize(sz,Image.LANCZOS)
            name=f'button_frame{"" if st=="normal" else "_"+st}{suf}.png'
            im.save(f'{OUT}/{name}')
            cap=round(CW*scale)
            im.crop((0,0,cap,sz[1])).save(f'{OUT}/button_cap_left{"" if st=="normal" else "_"+st}{suf}.png')
            im.crop((sz[0]-cap,0,sz[0],sz[1])).save(f'{OUT}/button_cap_right{"" if st=="normal" else "_"+st}{suf}.png')
            mw=round((TILE[1]-TILE[0])*scale)
            im.crop((cap,0,cap+mw,sz[1])).save(f'{OUT}/button_mid{"" if st=="normal" else "_"+st}{suf}.png')
    print(src.size)
