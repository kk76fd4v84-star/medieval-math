from PIL import Image,ImageDraw,ImageFilter
import numpy as np,math,random
from scipy import ndimage
O='/workspace/handoff_to_maggi/chest/v1/'
def cutout(src):
    im=Image.open(src).convert('RGB');a=np.asarray(im).astype(int)
    bg=np.median(a[:10].reshape(-1,3),axis=0)
    near=(np.abs(a-bg).sum(2)<38)
    lab,n=ndimage.label(near)
    edge=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    bgmask=np.isin(lab,list(edge))
    # keep loose ground stipple dots out: remove small specks after
    obj=~bgmask
    obj=ndimage.binary_opening(obj,iterations=1)
    lab2,n2=ndimage.label(obj);sizes=ndimage.sum(obj,lab2,range(1,n2+1))
    keep=np.isin(lab2,[i+1 for i,s in enumerate(sizes) if s>3000])
    keep=ndimage.binary_fill_holes(keep)
    al=Image.fromarray((keep*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.7))
    rgba=im.convert('RGBA');rgba.putalpha(al)
    return rgba.crop(rgba.getbbox())
c=cutout('closed_gen1.jpg');o=cutout('open_gen1.jpg')
print(c.size,o.size)
# match rock widths (rock base is the widest part at bottom): scale so widths equal
W=420
def norm(im):return im.resize((W,round(im.height*W/im.width)),Image.Resampling.LANCZOS)
c=norm(c);o=norm(o)
H=max(c.height,o.height)
for im,name in [(c,'chest.png'),(o,'chest_open.png')]:
    canvas=Image.new('RGBA',(W,H));canvas.alpha_composite(im,(0,H-im.height));canvas.save(O+name)
# shine: black woodcut rays
S=680;sh=Image.new('RGBA',(S*2,S*2));d=ImageDraw.Draw(sh);cx=cy=S;random.seed(7)
n=20
for i in range(n):
    a=i*2*math.pi/n+random.uniform(-.04,.04)
    r0=S*0.36;r1=S*random.choice([0.78,0.92,0.70,0.98]);w=random.uniform(.055,.075)
    p=[(cx+r0*math.cos(a-w*.4),cy+r0*math.sin(a-w*.4)),(cx+r1*math.cos(a),cy+r1*math.sin(a)),(cx+r0*math.cos(a+w*.4),cy+r0*math.sin(a+w*.4))]
    # tapered wedge from inner edge
    p=[(cx+r0*math.cos(a-w),cy+r0*math.sin(a-w)),(cx+r1*math.cos(a),cy+r1*math.sin(a)),(cx+r0*math.cos(a+w),cy+r0*math.sin(a+w))]
    d.polygon(p,fill=(20,14,10,255))
    # short hatch rays between
    b=a+math.pi/n;r2=S*random.uniform(.45,.6)
    d.line([(cx+S*.34*math.cos(b),cy+S*.34*math.sin(b)),(cx+r2*math.cos(b),cy+r2*math.sin(b))],fill=(20,14,10,255),width=9)
# carve rough edges: random nicks
arr=np.asarray(sh).copy();noise=np.random.RandomState(3).rand(*arr.shape[:2])
arr[...,3]=np.where(noise<0.06,0,arr[...,3]);sh=Image.fromarray(arr)
sh=sh.resize((S,S),Image.Resampling.LANCZOS);sh.save(O+'shine.png')
# preview on scenery
bg=Image.open('field_ref_flat.jpg').convert('RGBA').resize((1200,550))
pv=Image.new('RGBA',(1500,620),(236,222,190,255));
for k,(im) in enumerate([c,o]):
    x=60+k*720;pv.alpha_composite(bg.crop((0,0,700,550)).resize((700,550)),(x-40,40))
    s2=sh.resize((520,520));ci0=im.resize((300,round(im.height*300/im.width)));pv.alpha_composite(s2,(x+310-260,560-ci0.height//2-260))
    ci=im.resize((300,round(im.height*300/im.width)));pv.alpha_composite(ci,(x+310-150,560-ci.height))
pv.convert('RGB').save(O+'preview.jpg',quality=92)
