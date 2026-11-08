from PIL import Image,ImageDraw,ImageFont,ImageFilter
from pathlib import Path
import sys
sys.path.insert(0,'/workspace/handoff_to_maggi/tavern_ui/riddle/v1/work')
from qframe import make
O=Path('/workspace/handoff_to_maggi/tutorial/castbar_v3');A=Path('/workspace/handoff_to_maggi/tutorial/castbar_v1/work/current_play/assets');W,H=1100,670
FONT='/usr/share/fonts/truetype/sand-box/google/Gelasio/Gelasio-VariableFont_wght.ttf';INK='#140E0A';OR='#ac5c24'
def f(n,b=False):
 q=ImageFont.truetype(FONT,n)
 if b:q.set_variation_by_axes([650])
 return q
p=Image.open(A/'v7/ui/parchment.png').convert('RGB').resize((W,H)).convert('RGBA');d=ImageDraw.Draw(p)
p.alpha_composite(make(W,H))
def center(t,y,n=28,fill=INK,bold=False):
 ft=f(n,bold);d.text(((W-d.textlength(t,font=ft))/2,y),t,font=ft,fill=fill)
def icon(name,xy,box):
 im=Image.open(A/'timing-woodcut'/(name+'.png')).convert('RGBA');im.thumbnail(box,Image.Resampling.LANCZOS);p.alpha_composite(im,(round(xy[0]-im.width/2),round(xy[1]-im.height/2)))
center('Read the cast bar',32,44,bold=True)
center('Answer before an icon to gain its effect.',91,27)
# Faithful ink track, orange elapsed fill, endpoint emblems — no invented coloured bands.
x0,x1,y=150,950,189
track=Image.open(A/'timing-woodcut/track.png').convert('RGBA')
for x in range(x0,x1,260):p.alpha_composite(track.crop((0,0,min(260,x1-x),11)),(x,y))
fill=Image.open(A/'timing-woodcut/fill.png').convert('RGBA').resize((140,16),Image.Resampling.LANCZOS);p.alpha_composite(fill,(x0,y-2))
for name,frac,box in [('block',.25,(40,46)),('crit',.5,(90,46)),('normal',.75,(96,46)),('weak',1,(64,46))]:icon(name,(x0+frac*(x1-x0)-(32 if name=='weak' else 0),y+3),box)
d.text((x0,221),'Earlier',font=f(21),fill=INK);d.text((x1-55,221),'Later',font=f(21),fill=INK)
rows=[('block','Block: will block next incoming damage and crit.'),('crit','Crit: double damage.'),('normal','Normal: full damage.'),('weak','Weak: half damage.')]
for i,(name,text) in enumerate(rows):
 yy=282+i*58;icon(name,(175,yy+18),(100,45));d.text((255,yy),text,font=f(30),fill=INK)
# One dismiss button; no extra badge cluster.
button=Image.open('/workspace/handoff_to_maggi/tavern_ui/v1/button_frame.png').convert('RGBA');p.alpha_composite(button,(400,550));center('Onward!',569,34,bold=True)
mask=Image.new('L',(W,H));ImageDraw.Draw(mask).rounded_rectangle((1,1,W-2,H-2),radius=17,fill=255);mask=mask.filter(ImageFilter.GaussianBlur(.35));p.putalpha(mask)
p.save(O/'tutorial_frame.png')
bg=Image.open(A/'v7/ui/parchment.png').convert('RGB').resize((1600,900)).convert('RGBA');bg.alpha_composite(p,(250,115));bg.convert('RGB').save(O/'mockup.jpg',quality=96)
