from PIL import Image,ImageDraw,ImageFont
import numpy as np,cv2,math,json
from pathlib import Path
O=Path('/workspace/handoff_to_maggi/starter_knight/v1');B=Path('/workspace/mm_repo');PART=B/'assets/villager-start/v20/approved-v13/parts'
arm=Image.open(PART/'hero-frontFore.png').convert('RGBA');a=np.array(arm);h,w=a.shape[:2]
base=np.array([414.,682.]);D=np.array([.94,.341]);D/=np.linalg.norm(D);N=np.array([-D[1],D[0]])
y,x=np.mgrid[:h,:w];u=(x-base[0])*D[0]+(y-base[1])*D[1];v=(x-base[0])*N[0]+(y-base[1])*N[1]
blade=(u>16)&(np.abs(v)<60)&(a[:,:,3]>0)
old=a.copy();old[~blade]=0
# Inverse warp: shorter blade, down-kinked towards the tip.
us=u/.82;vs=v-np.maximum(u-125,0)*.23
mapx=(base[0]+us*D[0]+vs*N[0]).astype('float32');mapy=(base[1]+us*D[1]+vs*N[1]).astype('float32')
new=cv2.remap(old,mapx,mapy,cv2.INTER_CUBIC,borderMode=cv2.BORDER_CONSTANT)
# Rust wash keeps original engraved black cuts.
rng=np.random.default_rng(15);bright=new[:,:,:3].mean(2);wash=np.clip((bright-55)/180,0,1)
for ch,col in enumerate([159,101,51]):new[:,:,ch]=np.clip(new[:,:,ch]*(1-wash*.50)+col*wash*.50,0,255)
ni=Image.fromarray(new);nd=ImageDraw.Draw(ni)
def uv(uu,vv):return tuple(base+D*uu+N*vv)
# Deep asymmetrical chips, readable at game scale, and a clipped tip.
for uu,side in [(87,-1),(154,1),(222,-1)]:
 bend=max(uu-125,0)*.23
 pts=[uv(uu-12,bend+side*45),uv(uu+13,bend+side*45),uv(uu+3,bend+side*4)]
 nd.polygon(pts,fill=(0,0,0,0))
# Oxide pits and short carved scoring marks.
for _ in range(35):
 uu=rng.uniform(35,260);vv=rng.uniform(-9,9)+max(uu-125,0)*.23;p=uv(uu,vv)
 if ni.getpixel((round(p[0]),round(p[1])))[3]>180:nd.line([p,uv(uu+4,vv+1)],fill=(48,29,17,220),width=2)
new=np.array(ni)
edited=a.copy();edited[blade]=0;out=Image.fromarray(edited);out.alpha_composite(ni)
out.save(O/'hero-frontFore-starter.png');ni.save(O/'starter-blade-only.png')
# Preserve the exact original atlas body pixels. Only remove/replace transformed blade.
rig=json.load(open(B/'assets/v10/walks/rigs/hero.json'));orig=Image.open(B/'assets/v10/walks/hero-walk.png').convert('RGBA');atlas=orig.copy()
def T(x,y):return np.array([[1,0,x],[0,1,y],[0,0,1.]])
def R(t):return np.array([[math.cos(t),-math.sin(t),0],[math.sin(t),math.cos(t),0],[0,0,1.]])
def hinge(origin,ang):return T(*origin)@R(ang)@T(-origin[0],-origin[1])
for i in range(8):
 p=i/8;drop=3.5*math.sin(p*2*2*math.pi)-1.5*math.cos(p*2*2*math.pi)
 hip=[rig['hip'][0],rig['hip'][1]+drop*rig['weightScale']]
 torso=-.035*math.sin(p*2*math.pi-.15);fa=-rig['upper']['armSwing']*math.cos(p*2*math.pi);ff=.055*math.sin(p*2*math.pi-.5)
 sc=rig['scale'];scale=np.diag([sc,sc,1.])
 M=T(384,680)@scale@T(-rig['hip'][0],-rig['baseline'])@T(*hip)@R(torso)@T(-rig['bindHip'][0],-rig['bindHip'][1])@hinge(rig['upper']['frontShoulder'],fa)@hinge(rig['upper']['frontElbow'],ff)
 om=cv2.warpAffine(old,M[:2],(768,768),flags=cv2.INTER_CUBIC);nn=cv2.warpAffine(new,M[:2],(768,768),flags=cv2.INTER_CUBIC)
 frame=np.array(orig.crop((i*768,0,(i+1)*768,768)));erase=om[:,:,3]>1
 frame[erase]=0
 # Recover the existing clean tunic under the old baked-in blade.
 body=np.array(Image.open(PART/'hero-body.png').convert('RGBA'))
 MB=T(384,680)@scale@T(-rig['hip'][0],-rig['baseline'])@T(*hip)@R(torso)@T(-rig['bindHip'][0],-rig['bindHip'][1])
 under=cv2.warpAffine(body,MB[:2],(768,768),flags=cv2.INTER_CUBIC)
 frame[erase]=under[erase]
 f=Image.fromarray(frame);f.alpha_composite(Image.fromarray(nn));atlas.paste(f,(i*768,0));f.save(O/f'frame_{i:02d}.png')
atlas.save(O/'starter-knight-walk.png');atlas.crop((0,0,768,768)).save(O/'starter-knight-idle.png')
meta=json.load(open(B/'assets/v10/walks/hero-animation.json'));meta['image']='starter-knight-walk.png';meta['id']='starter_knight';(O/'starter-knight-animation.json').write_text(json.dumps(meta,indent=2))
# Game-size comparison (.6 global artScale) and exact 2x display enlargement.
P=Image.open(B/'assets/v7/ui/parchment.png').convert('RGB').resize((1850,1600)).convert('RGBA');d=ImageDraw.Draw(P);font=ImageFont.truetype('/usr/share/fonts/truetype/sand-box/google/Gelasio/Gelasio-VariableFont_wght.ttf',30)
for j,(im,label) in enumerate([(atlas,'STARTER — bent, chipped, rusty'),(orig,'CURRENT — intact blade')]):
 d.text((50+j*890,20),label,font=font,fill='#140E0A')
 for k,s in enumerate([.6,1.2]):
  f=im.crop((0,0,768,768));f=f.resize((round(768*s),round(768*s)),Image.Resampling.LANCZOS)
  P.alpha_composite(f,(15+j*900,65 if k==0 else 620))
 d.text((50+j*890,555),'Game size: source ×0.6',font=font,fill='#140E0A');d.text((50+j*890,1540),'2× game-size zoom',font=font,fill='#140E0A')
P.convert('RGB').save(O/'mockup.jpg',quality=95)
# Arm detail inspection
z=Image.new('RGBA',(1250,450),'#e9d8b6')
for i,im in enumerate([out,arm]):z.alpha_composite(im.crop((250,480,850,860)),(i*625,20))
z.convert('RGB').save(O/'work/blade_comparison.jpg')
print('Built starter arm and all 8 knight atlas frames; no generations')
