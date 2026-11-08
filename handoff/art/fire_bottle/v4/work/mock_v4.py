import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageChops
from scipy import ndimage as ndi
O='/workspace/handoff_to_maggi/fire_bottle/v4/'
rng=np.random.default_rng(7)
# --- soot overlay 512x512: soot rising from the bottom, blotchy, with ink hatching
N=512
yy,xx=np.mgrid[0:N,0:N]/N
noise=sum(ndi.zoom(rng.random((4*2**k,4*2**k)),N/(4*2**k),order=3)[:N,:N]/(2**k) for k in range(4))
noise=(noise-noise.min())/(noise.max()-noise.min())
grad=np.clip((yy-0.5)/0.45,0,1)            # stronger toward bottom
a=np.clip((noise*0.8+grad*0.9-0.85)*2.0,0,1)*0.6
img=Image.new('RGBA',(N,N),(0,0,0,0))
col=np.zeros((N,N,4),np.uint8); col[...,0]=46; col[...,1]=30; col[...,2]=22; col[...,3]=(a*255).astype(np.uint8)
img=Image.fromarray(col,'RGBA')
# hatching strokes inside soot areas
h=Image.new('L',(N,N),0); d=ImageDraw.Draw(h)
for i in range(-N,N,9):
    d.line([(i,N),(i+N*0.6,0)],fill=255,width=2)
hm=np.asarray(h)/255*np.clip((a-0.25)*2,0,1)*0.6
ha=np.maximum(a, hm)
col[...,3]=(np.clip(ha,0,1)*255).astype(np.uint8)
Image.fromarray(col,'RGBA').filter(ImageFilter.GaussianBlur(0.6)).save(O+'singed_overlay.png')
TINT=(214,190,170)   # multiply colour  #A8846E

def singe(sprite, strength=1.0):
    sp=sprite.convert('RGBA'); w,h=sp.size
    rgb=np.asarray(sp).astype(float)
    t=np.array(TINT)/255; mul=1-(1-t)*strength
    rgb[...,:3]*=mul
    out=Image.fromarray(rgb.astype(np.uint8),'RGBA')
    ov=Image.open(O+'singed_overlay.png').resize((w,h),Image.LANCZOS)
    ova=np.asarray(ov).astype(float); ova[...,3]*=np.asarray(sp)[...,3]/255*strength   # source-atop
    out.alpha_composite(Image.fromarray(ova.astype(np.uint8),'RGBA'))
    return out

gob=Image.open('/workspace/knight-math-game/assets/v7/characters/goblin.png').convert('RGBA')
gob=gob.crop(gob.getbbox())
# demo side by side
demo=Image.open('/workspace/knight-math-game/assets/v7/ui/parchment.png').convert('RGBA').resize((gob.width*2+60,gob.height+40))
demo.alpha_composite(gob,(20,20)); demo.alpha_composite(singe(gob),(gob.width+40,20))
demo.convert('RGB').save(O+'singed_demo_goblin.jpg',quality=90)

# --- mockup (v2, measured: screenshot goblin at x984 y180, 364x480, feet y660 in 1600x900)
scene=Image.open('/workspace/knight-math-game/screenshots/03b_combat_turn_weak_hard_heal.png').convert('RGBA').resize((1600,900),Image.LANCZOS)
def gametone(im):
    a=np.asarray(im).astype(float); a[...,0]=a[...,0]*0.745+28; a[...,1]=a[...,1]*0.737+21; a[...,2]=a[...,2]*0.766+12.6
    return Image.fromarray(np.clip(a,0,255).astype(np.uint8),'RGBA')
G=(364,480); FEET=660
g=gametone(gob.resize(G,Image.LANCZOS)); gs=gametone(singe(gob).resize(G,Image.LANCZOS))
X0=984; offs=[-235,0,235]    # three goblins: left, original, right
FS=0.6
def fx(name):
    f=Image.open(O+'fx/'+name); return f.resize((round(f.width*FS),round(f.height*FS)),Image.LANCZOS)
def goblins(p,singed):
    for o in [0,-235,235]:  # back to front: original first, so neighbours overlap a bit
        p.alpha_composite(gs if singed else g,(X0+o,FEET-G[1]))
def fires(p,name):
    for o in offs:
        f=fx(name); cx=X0+G[0]//2+o
        p.alpha_composite(f,(cx-f.width//2,FEET+12-f.height))
# panel A: bottle in flight + smash at middle goblin
pA=scene.copy(); goblins(pA,False)
f=fx('fire_smash_2.png'); cx=X0+G[0]//2; pA.alpha_composite(f,(cx-f.width//2,FEET+12-f.height))
bot=Image.open(O+'bottle_item.png').resize((134,134),Image.LANCZOS).rotate(-30,Image.BICUBIC)
pA.alpha_composite(bot,(820,230))
pB=scene.copy(); goblins(pB,False); fires(pB,'fire_burst_2.png')
pC=scene.copy(); goblins(pC,True); fires(pC,'fire_linger_1.png')
out=Image.new('RGB',(1600,900*3+40),(40,30,24))
for i,p in enumerate([pA,pB,pC]): out.paste(p.convert('RGB'),(0,i*920))
out.save(O+'mockup_fire_goblin.jpg',quality=88)
out.resize((800,1370),Image.LANCZOS).save('chk_mock_v2.jpg')
pB.convert('RGB').crop((700,300,1600,720)).save('chk_mock_crop.jpg')
