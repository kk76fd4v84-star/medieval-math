from pathlib import Path
from PIL import Image
import numpy as np,json,shutil
o=Path(__file__).resolve().parent;g=Path('/Users/magnusjansson/.codex/generated_images/01a193c0-0a31-7800-b92c-2684d1f1dc20')
sources={'room':g/'exec-032ecb1c-dd10-437d-a9a1-94747e89d561.png','sentry':g/'exec-b2a1d1b5-c61d-4cec-b6d6-9b0a2216a7db.png'};manifest={}
for k,p in sources.items():
 im=Image.open(p).convert('RGBA');a=np.array(im);alpha=a[:,:,3];alpha[alpha<12]=0;alpha[alpha>=240]=255;a[:,:,3]=alpha
 if k=='sentry':
  bb=Image.fromarray(alpha).getbbox();im=Image.fromarray(a).crop(bb);out=Image.new('RGBA',(im.width+32,im.height+32));out.alpha_composite(im,(16,16));im=out
 else:im=Image.fromarray(a)
 im.save(o/(k+'.png'));manifest[k]={'source':str(p),'size':im.size}
 if k=='room':
  a=np.array(im).astype(float);sel=(a[:,:,3]>245)&(a[:,:,:3].mean(2)>180)&(a[:,:,0]-a[:,:,2]<90);paper=np.percentile(a[:,:,:3][sel],90,axis=0)
  lum=a[:,:,:3]@np.array([.299,.587,.114]);amount=np.maximum(0,(paper@np.array([.299,.587,.114])-lum)/(paper@np.array([.299,.587,.114])))
  rgb=(a[:,:,:3]-(1-amount[:,:,None])*paper)/np.maximum(.001,amount[:,:,None]);a[:,:,:3]=np.clip(rgb,0,255);a[:,:,3]*=amount
  Image.fromarray(a.astype('uint8')).save(o/'room-ink.png');manifest[k]['paper']=paper.tolist()
shutil.copy2(o.parents[2]/'art-direction/concepts/tomb-concept-v1.png',o/'portraits-source.png')
(o/'manifest.json').write_text(json.dumps(manifest,indent=2));print(json.dumps(manifest,indent=2))

# Finish by removing concept-painted health; runtime owns these values.
exec((o/'clean-portrait-badges.py').read_text())
