# v8 proof: every character / sequence frame / grave at source px x 0.6, feet on the ground separator of a 1600x900 stage.
import json
from PIL import Image, ImageDraw, ImageFont
R='assets/v7/'
s=open('src/config/art_v7.js').read(); j=json.loads(s[s.index('{'):s.rindex('}')+1])
G=0.6; W,H=1600,900; GROUND=595; NP=4
bg=Image.new('RGB',(W*NP,H),(236,222,190)); d=ImageDraw.Draw(bg)
f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',24)
fb=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',26)
for p in range(NP):
  ox=p*W; d.rectangle([ox,0,ox+W-1,H-1],outline=(27,20,16),width=3); d.line([ox,600,ox+W,600],fill=(27,20,16),width=4)
  d.text((ox+14,850),f"stage {p+1}/{NP} (1600x900): scene = top 600 px, ground separator at y=600, all art = source px x {G}",fill=(27,20,16),font=f)
items=[]
for k in ['companion_stripe','companion_scarf','companion_feather','companion_moustache','goblin','skeleton','warlock','scholar','friar']:
  c=j['cutouts'][k]; items.append((k, Image.open(R+c['img']).convert('RGBA'), c['anchor'], c.get('top',0)))
def cell(seq, i=0):
  q=j['sequences'][seq]; fr=q['frames'][i]; im=Image.open(R+q['img']).convert('RGBA').crop((fr['x'],fr['y'],fr['x']+fr['w'],fr['y']+fr['h'])); return im, q['pivot'], q.get('standTop',0)
im,pv,top=cell('knight_death',0); items.append(('knight_death f0',im,pv,top))
im,pv,top=cell('rabbit_idle',0); items.append(('rabbit f0',im,pv,top))
g=j['graves']['rabbit']; items.append(('grave-rabbit',Image.open(R+g['img']).convert('RGBA'),g['anchor'],g['top']))
bk=j['cutouts']['black_knight']; items.append(('black_knight',Image.open(R+bk['img']).convert('RGBA'),bk['anchor'],bk['top']))
x=40; panel=0
for name,im,anc,top in items:
  w,h=im.size; bb=im.getbbox() or (0,0,w,h); fw=max((bb[2]-bb[0])*G,260)
  if x+fw>panel*W+W-20: panel+=1; x=panel*W+40
  sm=im.resize((round(w*G),round(h*G)),Image.LANCZOS)
  bg.paste(sm,(round(x-bb[0]*G),round(GROUND-anc[1]*G)),sm)
  fh=(anc[1]-top)*G
  d.text((x,GROUND+30),name,fill=(27,20,16),font=f); d.text((x,GROUND+60),f"{round(anc[1]-top)} -> {fh:.0f} px",fill=(120,30,20),font=f)
  if GROUND-fh<0: d.text((x,GROUND+95),f"TOO TALL: {fh-GROUND:.0f} px above the stage",fill=(180,20,20),font=fb)
  x+=fw+40
bg.save('screenshots/size_lineup_1to1.png'); print(bg.size)
