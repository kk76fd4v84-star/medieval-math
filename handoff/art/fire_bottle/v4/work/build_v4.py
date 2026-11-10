import numpy as np, os
from PIL import Image
OUT='/workspace/handoff_to_maggi/fire_bottle/v4'
import sys
FILL=np.array([int(sys.argv[1][i:i+2],16) for i in (0,2,4)],float) if len(sys.argv)>1 else np.array([214,180,104.])
os.makedirs(OUT+'/fx/wide',exist_ok=True)
ORANGE=np.array([210,105,30.]); INK=np.array([20,14,10.]); PAPER=np.array([236,222,196.])
CW,CH=640,368; PAD=4
def quant(im, paper_mode='clear'):
    """force every pixel to black ink, the single orange, (or paper / clear for pale unsaturated smoke)"""
    a=np.asarray(im).astype(float); rgb=a[...,:3]; al=a[...,3]/255
    lum=0.3*rgb[...,0]+0.59*rgb[...,1]+0.11*rgb[...,2]
    sat=rgb.max(-1)-rgb.min(-1)
    Lo=0.3*ORANGE[0]+0.59*ORANGE[1]+0.11*ORANGE[2]
    t=np.clip((Lo-lum)/(Lo-40),0,1)                       # 0 = orange, 1 = ink
    t=np.clip((t-0.3)/0.3,0,1)                            # posterise: flat orange or black ink, only AA between
    pale=np.clip((lum-120)/40,0,1)*np.clip((90-sat)/40,0,1)   # beige/cream, unsaturated light
    out=FILL*(1-t[...,None])+INK*t[...,None]
    if paper_mode=='clear':
        al=al*(1-pale*(1-t))                                # pale interiors drop out, ink stays
    else:
        pale=np.clip((lum-135)/30,0,1)*np.clip((140-sat)/30,0,1)
        pale=np.clip((pale-0.35)/0.2,0,1)*(1-t)
        out=out*(1-pale[...,None])+PAPER*pale[...,None]
    return Image.fromarray(np.dstack([out,al*255]).clip(0,255).astype(np.uint8),'RGBA')
def tight(im): return im.crop(im.getbbox())
def ground_row(im):
    a=np.asarray(im)[...,3]>128; rows=np.where(a.sum(1)>max(3,a.shape[1]*0.02))[0]; return rows.max()
def place(im,cw=CW,ch=CH,pad=PAD):
    im=tight(im); g=ground_row(im); c=Image.new('RGBA',(cw,ch),(0,0,0,0))
    x=(cw-im.width)//2; y=ch-pad-1-g; assert im.width<=cw and y>=0,(im.size,y)
    c.alpha_composite(im,(x,y)); return c
def rs(im,w,h): return im.resize((round(w),round(h)),Image.LANCZOS)
frames={}
sm=quant(Image.open('smash_key.png'))
frames['smash']=[]
for x0,x1 in [(16,388),(417,824),(848,1264)]:
    f=tight(sm.crop((x0-4,0,x1+4,sm.height))); s=0.72; frames['smash'].append(place(rs(f,f.width*s,f.height*s)))
bu=quant(Image.open('burst_key.png'))
YK=[1.0,1.12,1.04,1.0]; frames['burst']=[]
for (y0,y1),k in zip([(9,322),(322,637),(637,954),(954,1258)],YK):
    f=tight(bu.crop((0,y0,bu.width,y1))); s=600/f.width
    frames['burst'].append(place(rs(f,600,min(f.height*s*k,CH-PAD-2))))
li=quant(Image.open('linger_key.png'))
frames['linger']=[]
L=[tight(li.crop((0,y0-6,li.width,y1+6))) for y0,y1 in [(34,335),(356,638),(659,930),(947,1215)]]
H=np.mean([f.height*600/f.width for f in L])          # same width, common height -> variants line up
for f in L: frames['linger'].append(place(rs(f,600,H)))
for ph,fl in frames.items():
    at=Image.new('RGBA',(CW*len(fl),CH),(0,0,0,0))
    for i,f in enumerate(fl): f.save(f'{OUT}/fx/fire_{ph}_{i+1}.png'); at.alpha_composite(f,(i*CW,0))
    at.save(f'{OUT}/fx/atlas_fire_{ph}.png')
# wide: one drawing; loop = the 4 linger variants can't be reused at this width, so 4 frames by horizontal
# offset-free subtle redraw is not available -> use shifted crops of a 2x-mirrored band (tongues move, base fixed)
w=tight(quant(Image.open('wide_key.png'))); w=rs(w,1500,330)
WW,WH=1520,340; wf=[]
for i in range(4):
    # frame i: cyclic horizontal slip of tongue tops only (base pinned) gives a flicker that loops
    a=np.asarray(w).astype(float); H_,W_=a.shape[:2]
    yy=np.arange(H_)[:,None]; hfac=np.clip((H_-1-yy)/H_,0,1)**1.5
    ph=2*np.pi*i/4; out=np.zeros_like(a)
    xs=np.arange(W_)[None,:]
    from scipy import ndimage as ndi
    dx=7*hfac*np.sin(ph+xs/45.0)
    for c in range(4): out[...,c]=ndi.map_coordinates(a[...,c],[np.repeat(yy,W_,1),xs-dx],order=1)
    f=place(Image.fromarray(out.clip(0,255).astype(np.uint8),'RGBA'),WW,WH); wf.append(f); f.save(f'{OUT}/fx/wide/fire_linger_wide_{i+1}.png')
at=Image.new('RGBA',(WW*4,WH),(0,0,0,0))
for i,f in enumerate(wf): at.alpha_composite(f,(i*WW,0))
at.save(f'{OUT}/fx/wide/atlas_fire_linger_wide.png')
# bottle + icon: recolour v2 art to ink + the one orange (+ parchment for the rag/cork/flask paper areas)
V2='/workspace/handoff_to_maggi/fire_bottle/v2/'
for f in ['bottle_item.png','bottle_item@2x.png','bottle_icon.png','bottle_icon_40px.png']:
    quant(Image.open(V2+f),'paper').save(f'{OUT}/{f}')
print('ok')
