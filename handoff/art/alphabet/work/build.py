import numpy as np, json, os
from PIL import Image
OUT='/workspace/handoff_to_maggi/alphabet'
CH=190; BASE=173; CAP=162; SB=16
GAMMA=float(os.environ.get('GAMMA','1.0'))
sheets={'ABCDE':[(63,308),(325,527),(550,761),(787,1012),(1027,1221)],
'FGHIJ':[(95,288),(318,565),(596,852),(899,1002),(1033,1195)],
'KLMNO':[(71,289),(314,487),(510,771),(796,1002),(1024,1228)],
'PQRST':[(70,266),(299,537),(565,791),(822,996),(1027,1227)],
'UVWXYZ':[(55,225),(251,427),(447,694),(718,897),(906,1074),(1089,1239)]}
glyphs={}
for n,runs in sheets.items():
    im=Image.open(f'k_{n}.png'); a=np.asarray(im)
    tops=[];bots=[]
    for (x0,x1),L in zip(runs,n):
        m=a[:,x0:x1,3]>40; r=np.where(m.sum(1)>2)[0]
        tops.append(r.min()); bots.append(r.max())
    top=np.median(tops); bot=np.median(bots)
    s=CAP/(bot-top)
    for (x0,x1),L,t,b in zip(runs,n,tops,bots):
        crop=im.crop((x0-2,0,x1+2,im.height))
        aa=np.asarray(crop).astype(float)
        crop=Image.fromarray(aa.astype(np.uint8),'RGBA')
        w=round(crop.width*s); h=round(crop.height*s)
        sc_=crop.resize((w,h),Image.LANCZOS)
        y=round(BASE-bot*s)   # sheet baseline -> BASE
        adv=w+2*SB-4
        cell=Image.new('RGBA',(adv,CH),(0,0,0,0))
        cell.alpha_composite(sc_,(SB-2,0) if False else (SB-2,0),(0,max(0,-y),w,min(h,CH-y)))  if False else None
        tmp=Image.new('RGBA',(adv,CH+400),(0,0,0,0)); tmp.alpha_composite(sc_,(SB-2,y+200))
        cell=tmp.crop((0,200,adv,200+CH))
        lost=np.asarray(tmp)[...,3]; lost=(lost[:200].sum()+lost[200+CH:].sum())
        glyphs[L]=(cell,adv,lost)
# Q: dedicated short-tail drawing; squash the part below the baseline to fit the 190 cell
im=Image.open('k_Q.png'); x0,x1,top,bb,bot=429,868,89,542,619
crop=im.crop((x0-2,0,x1+3,im.height))
s=CAP/(bb-top)*0.97
q=crop.resize((round(crop.width*s),round(crop.height*s)),Image.LANCZOS)
by=round(bb*s); ty=round(top*s); tail=round((bot-bb)*s)
upper=q.crop((0,ty-4,q.width,by)); lower=q.crop((0,by,q.width,by+tail+3))
room=CH-1-BASE-1
lower=lower.resize((q.width,min(room,lower.height)),Image.LANCZOS)
adv=q.width+2*SB-4
cell=Image.new('RGBA',(adv,CH),(0,0,0,0))
cell.alpha_composite(upper,(SB-2,BASE+1-upper.height+0)); cell.alpha_composite(lower,(SB-2,BASE+1))
glyphs['Q']=(cell,adv,0)
from PIL import ImageFilter
def weight(cell):
    a=np.asarray(cell).astype(float); al=a[...,3]/255
    fat=np.asarray(cell.getchannel('A').filter(ImageFilter.MaxFilter(3))).astype(float)/255
    al=np.maximum(al, fat*0.55)            # thicken strokes ~1px like the heavier digit cut
    al=al**GAMMA
    # ink where thickened: use near-black
    k=(al>a[...,3]/255+0.05)
    a[k,:3]=[8,8,6]
    a[...,3]=al*255
    return Image.fromarray(np.clip(a,0,255).astype(np.uint8),'RGBA')
glyphs={L:(weight(c),adv,lost) for L,(c,adv,lost) in glyphs.items()}
os.makedirs(OUT,exist_ok=True)
CW=max(g[1] for g in glyphs.values())
atlas=Image.new('RGBA',(CW*26,CH),(0,0,0,0)); meta={}
for i,L in enumerate('ABCDEFGHIJKLMNOPQRSTUVWXYZ'):
    cell,adv,lost=glyphs[L]; cell.save(f'{OUT}/{L}.png')
    ox=i*CW+(CW-adv)//2; atlas.alpha_composite(cell,(ox,0))
    meta[L]={'atlas_x':i*CW,'glyph_x_in_cell':(CW-adv)//2,'advance':adv}
    if lost: print('clipped',L,lost)
atlas.save(f'{OUT}/atlas_alphabet.png')
json.dump({'cell':[CW,CH],'baseline_y':BASE,'cap_height':CAP,'order':'ABCDEFGHIJKLMNOPQRSTUVWXYZ','letters':meta},open(f'{OUT}/glyphs.json','w'),indent=1)
print('cell',CW,CH,{L:m['advance'] for L,m in meta.items()})
