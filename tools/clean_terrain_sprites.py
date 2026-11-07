#!/usr/bin/env python3
"""Clean the 15 active terrain strips without changing their canvas or layout anchors.
Dependencies: Pillow, NumPy, SciPy. Run from any directory:
    python tools/clean_terrain_sprites.py
Original v24 exports are read-only inputs. Outputs go to assets/terrain-clean/.
"""
from pathlib import Path
import json, hashlib, argparse
import numpy as np
from PIL import Image
from scipy import ndimage as nd
def clean(a,matte=True):
 rgb=a[:,:,:3].astype(np.float32);al=a[:,:,3];lum=rgb @ np.array([.299,.587,.114],np.float32);ch=rgb.max(2)-rgb.min(2)
 b=a.copy();paper=np.array([251,245,231],np.float32)
 if matte:
  base=nd.percentile_filter(np.where(al>180,lum,255),percentile=70,size=9)
  flat=(base>58)&(base<180)&(ch<45)&(al>140)
  # Only broad mid-grey matte near the cutout edge. Keep ground hatching and solid dark ink.
  edge=nd.distance_transform_edt(al>180)
  flat &= edge<55
  dist,near=nd.distance_transform_edt(~flat,return_indices=True)
  area=(dist<5)&(lum<210)&(ch<45)&(al>0)
  bg=base[tuple(near)]
  strength=np.clip((bg-lum-3)/np.maximum(24,bg-35),0,1)
  corrected=paper[None,None,:]*(1-strength[:,:,None])+np.minimum(rgb,35)*strength[:,:,None]
  b[:,:,:3]=np.where(area[:,:,None],np.maximum(rgb,corrected),rgb).astype(np.uint8)
  core=(lum<58)&(al>150)
  enclosed=nd.binary_fill_holes(nd.binary_closing(core,iterations=1))
  # Clear matte outside the surviving contours; retain pale interiors enclosed by ink.
  inkdist=nd.distance_transform_edt(~core)
  remove=area&(strength<.10)&(~enclosed)&(inkdist>1.15)&(edge<32)
  b[remove,3]=0
 # Remove low-alpha fuzzy fringe; keep a narrow antialias transition.
 alpha=b[:,:,3].astype(float)
 b[:,:,3]=np.where(alpha<85,0,np.where(alpha>200,255,(alpha-85)*255/115)).astype(np.uint8)
 b[b[:,:,3]==0,:3]=0
 return b

if __name__ == '__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1]);args=parser.parse_args();root=args.root
 out=root/'assets/terrain-clean';out.mkdir(parents=True,exist_ok=True);report=[]
 for p in sorted((root/'assets/terrain-v24').glob('*.png')):
  a=np.array(Image.open(p).convert('RGBA'));b=clean(a);lum=a[:,:,:3] @ [.299,.587,.114];ink=(a[:,:,3]>200)&(lum<30);paper=(a[:,:,3]>220)&(lum>215)
  assert a.shape==b.shape and np.array_equal(a[:,:,:3][ink],b[:,:,:3][ink])
  assert np.all(b[:,:,3][ink]==255) and np.all(b[:,:,3][paper]==255)
  dst=out/p.name;Image.fromarray(b).save(dst)
  report.append({'source':str(p.relative_to(root)),'clean':str(dst.relative_to(root)),'size':[a.shape[1],a.shape[0]],'source_sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'changed_rgb_pixels':int(np.any(a[:,:,:3]!=b[:,:,:3],axis=2).sum()),'removed_fringe_pixels':int(((a[:,:,3]>0)&(b[:,:,3]==0)).sum()),'opaque_ink_preserved':True,'opaque_paper_preserved':True})
 (root/'review').mkdir(exist_ok=True);(root/'review/terrain-cleanup-audit.json').write_text(json.dumps(report,indent=2))
 print('Cleaned',len(report),'strips. Canvas dimensions, dark ink RGB and opaque pale interiors verified.')
