from PIL import Image,ImageDraw,ImageFont
import numpy as np,shutil
from pathlib import Path
O=Path('/workspace/handoff_to_maggi/meter_icons/v1')
p='/cursor/stores/user/grok-bot/agents/d95469bd-89ee-41dd-a45b-47f154a52ad8/assets/4c3ccf45ca58db9bc2adbdb33ea396c9eea9eed98b68038db831dc4401b6b2c8.jpg'
shutil.copy(p,O/'work/generated_sheet.jpg');src=Image.open(p).convert('RGB');w,h=src.size
names=['quick','heavy','slippery','shrouded','helm','lantern']
for i,name in enumerate(names):
 col=i%2;row=i//2;im=src.crop((round(col*w/2),round(row*h/3),round((col+1)*w/2),round(h*.64 if row==1 else (row+1)*h/3)))
 a=np.array(im).astype(float);r,g,b=a[:,:,0],a[:,:,1],a[:,:,2]
 pink=(r>75)&(b>45)&(r-g>40)&(b-g>28)
 alpha=np.where(pink,0,255).astype('uint8')
 # Remove residual purple JPEG chroma from dark edge pixels, not cream/orange ink.
 spill=(b>g+8)&(r>g+8)&(b>r*.40)
 for ch in [0,2]:a[:,:,ch][spill]=g[spill]
 rgba=Image.fromarray(np.dstack([a.astype('uint8'),alpha]),'RGBA')
 bb=rgba.getbbox();rgba=rgba.crop(bb);rgba.thumbnail((224,224),Image.Resampling.LANCZOS)
 canvas=Image.new('RGBA',(256,256));canvas.alpha_composite(rgba,((256-rgba.width)//2,(256-rgba.height)//2));canvas.save(O/(name+'.png'))
 canvas.resize((64,64),Image.Resampling.LANCZOS).save(O/'64'/(name+'.png'))
bg=Image.open('/workspace/knight-math-game/assets/v7/ui/parchment.png').convert('RGB').resize((1080,760)).convert('RGBA');d=ImageDraw.Draw(bg)
f='/usr/share/fonts/truetype/sand-box/google/Gelasio/Gelasio-VariableFont_wght.ttf';ft=ImageFont.truetype(f,24);small=ImageFont.truetype(f,15)
for i,name in enumerate(names):
 x=20+(i%3)*355;y=10+(i//3)*375
 bg.alpha_composite(Image.open(O/(name+'.png')),(x+40,y+30))
 d.text((x+110,y+7),name.title(),font=ft,fill='#140E0A')
 bg.alpha_composite(Image.open(O/'64'/(name+'.png')),(x+70,y+292))
 bg.alpha_composite(Image.open(O/'64'/(name+'.png')).resize((48,48),Image.Resampling.LANCZOS),(x+180,y+300))
 d.text((x+77,y+355),'64 px',font=small,fill='#140E0A');d.text((x+179,y+355),'48 px',font=small,fill='#140E0A')
bg.convert('RGB').save(O/'icon_sheet.jpg',quality=96)
