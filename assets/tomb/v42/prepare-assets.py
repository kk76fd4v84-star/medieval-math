from pathlib import Path
from PIL import Image
import numpy as np
import json

out=Path(__file__).parent
source=Path('/Users/magnusjansson/.codex/generated_images/01a193c0-0a31-7800-b92c-2684d1f1dc20')
sources={'burial':'exec-a0e46bf5-0634-48cd-b591-5c68430d74b9.png','roots':'exec-01cce761-f9c6-48b5-b7a5-33cc62938ae3.png','forward-fall':'exec-820376f3-95d3-4dd8-91ed-0b50c814daf1.png'}
manifest={}
for name,file in sources.items():
 a=np.array(Image.open(source/file).convert('RGBA'))
 # Previously authorised deterministic matte cleanup; preserve all drawn RGB.
 a[:,:,3]=np.clip((a[:,:,3].astype(float)-12)*255/228,0,255).round().astype('uint8')
 a[a[:,:,3]==0,:3]=0
 Image.fromarray(a).save(out/(name+'.png'))
 manifest[name]={'size':[a.shape[1],a.shape[0]],'source':str(source/file)}
 if name=='forward-fall':
  roles={}
  for col,role in enumerate(['knight','priest','wizard','fire']):
   frames=[]
   for row in range(3):
    x0,x1=round(col*a.shape[1]/4),round((col+1)*a.shape[1]/4)
    y0,y1=round(row*a.shape[0]/3),round((row+1)*a.shape[0]/3)
    cut=a[y0:y1,x0:x1,3];yy,xx=np.nonzero(cut>24)
    # Pixel-tight extraction only; no redraw or resampling.
    x,y=int(xx.min()+x0),int(yy.min()+y0);w,h=int(xx.max()-xx.min()+1),int(yy.max()-yy.min()+1)
    frames.append([x,y,w,h])
   roles[role]={'frames':frames,'standHeight':frames[0][3]}
  (out/'fall-frames.json').write_text(json.dumps(roles,indent=2))
  print(roles)
(out/'manifest.json').write_text(json.dumps(manifest,indent=2))
