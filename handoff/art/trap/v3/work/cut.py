from PIL import Image,ImageDraw,ImageFilter,ImageChops,ImageFont
from pathlib import Path
P=Path('/workspace/handoff_to_maggi/trap/v3');W=P/'work'
def cut(name,seeds):
 im=Image.open(W/(name+'_source.jpg')).convert('RGB').resize((1024,768),Image.Resampling.LANCZOS);g=im.convert('L')
 barrier=g.point(lambda v:255 if v<145 else 0).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
 flood=barrier.copy()
 for seed in [(0,0)]+seeds:
  ImageDraw.floodfill(flood,seed,128,thresh=0)
 # Background includes outside and explicitly seeded loop interiors. Ink matte has no paper colour contamination.
 outside=flood.point(lambda v:255 if v==128 else 0)
 alpha=Image.new('L',im.size);rgb=Image.new('RGB',im.size);ap=alpha.load();rp=rgb.load();ip=im.load();op=outside.load();gp=g.load()
 for y in range(im.height):
  for x in range(im.width):
   if not (65<x<950 and 50<y<665):continue
   if not op[x,y]:ap[x,y]=255;rp[x,y]=ip[x,y]
   else:
    a=max(0,min(255,round((175-gp[x,y])*255/145)))
    if a:ap[x,y]=a;rp[x,y]=(28,26,20)
 # Explicitly clear enclosed jaw-loop background pockets, keeping their ink hatching/grass.
 holes=Image.new('L',im.size);hd=ImageDraw.Draw(holes)
 if name=='open':
  hd.polygon([(170,448),(200,411),(222,491),(248,442),(276,511),(298,479),(321,536),(346,500),(361,533),(403,510),(401,466),(416,448),(400,428),(370,414),(340,401),(304,392),(262,388),(220,392),(190,405)],fill=255)
  hd.polygon([(587,445),(614,430),(656,416),(710,411),(762,416),(810,435),(836,467),(814,506),(785,464),(752,529),(723,495),(694,557),(668,527),(645,570),(620,550),(605,516),(590,497)],fill=255)
 hp=holes.load()
 for y in range(im.height):
  for x in range(im.width):
   if hp[x,y]:ap[x,y]=max(0,min(255,round((175-gp[x,y])*255/145)));rp[x,y]=(28,26,20)
   r,gc,b=ip[x,y]
   if name=='open' and 420<x<590 and 205<y<325 and r>160 and gc<165 and b<100:ap[x,y]=255;rp[x,y]=ip[x,y]
 # Ground paper removed even where hatching accidentally encloses large cells, but retain iron and pebbles.
 keep=Image.new('L',im.size);d=ImageDraw.Draw(keep)
 if name=='open':
  d.polygon([(130,290),(885,290),(885,595),(610,603),(565,563),(445,565),(390,585),(135,558)],fill=255)
  d.rectangle((400,170,610,555),fill=255)
 else:
  d.polygon([(275,180),(745,180),(745,480),(700,510),(710,611),(600,616),(500,565),(390,603),(300,603),(300,550),(465,505),(275,480)],fill=255)
  d.ellipse((134,341,223,432),fill=255);d.ellipse((776,350,878,441),fill=255)
 # Remove ground-paper islands outside silhouette; keep dark marks without halos.
 kp=keep.load()
 for y in range(440,665):
  for x in range(65,950):
   if not kp[x,y] and gp[x,y]>145:ap[x,y]=max(0,min(255,round((175-gp[x,y])*255/145)));rp[x,y]=(28,26,20)
 out=rgb.convert('RGBA');out.putalpha(alpha)
 # Identical source registration and scale, bottom-centred; not independent auto-scaling.
 out=out.crop((65,50,955,665)).resize((440,304),Image.Resampling.LANCZOS)
 out.save(P/('trap_open_grail.png' if name=='open' else 'trap_sprung.png'));return out
op=cut('open',[(300,430),(750,445)])
sp=cut('sprung',[(505,395)])
bg=Image.open('/workspace/shots/fight14.png').convert('RGBA').resize((819,461),Image.Resampling.LANCZOS)
def trap(canvas,art,x,y,width):
 r=art.resize((width,round(art.height*width/art.width)),Image.Resampling.LANCZOS);canvas.alpha_composite(r,(round(x-width/2),round(y-r.height)))
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
scene=Image.new('RGBA',(bg.width*2,bg.height+36),(235,218,185))
for i,(art,title) in enumerate([(op,'OPEN — ground lane'),(sp,'SPRUNG — ground lane')]):
 c=bg.copy();trap(c,art,403,331,160);scene.alpha_composite(c,(i*bg.width,36));ImageDraw.Draw(scene).text((i*bg.width+14,8),title,font=font,fill=(25,24,20))
scene.convert('RGB').save(P/'preview_scene.jpg',quality=94)
# Use real screenshot terrain between fighters; cropped to keep action readable without duplicating the hero.
terrain=bg.crop((290,95,532,338)).resize((480,486),Image.Resampling.LANCZOS)
orig=Image.open('/workspace/handoff_to_maggi/limbs/v1/work/originals/frank.png').convert('RGBA').crop((0,0,512,512))
loss=Image.open('/workspace/handoff_to_maggi/limbs/v2/frank_lose_leg.png').convert('RGBA')
peg=Image.open('/workspace/handoff_to_maggi/limbs/v1/frank_no_leg.png').convert('RGBA').crop((0,0,512,512))
def person(c,im,x,y):
 s=.60;r=im.resize((307,307),Image.Resampling.LANCZOS);c.alpha_composite(r,(round(x-256*s),round(y-475*s)))
strip=Image.new('RGBA',(1440,540),(235,218,185))
for i,title in enumerate(['1  APPROACH','2  SNAP — loss at the trap','3  WALK ON — trap stays']):
 c=terrain.copy()
 if i==0:trap(c,op,330,474,163);person(c,orig,145,470)
 elif i==1:
  person(c,loss,255,470);trap(c,sp,238,474,150)
 else:trap(c,sp,130,474,150);person(c,peg,353,470)
 strip.alpha_composite(c,(i*480,54));ImageDraw.Draw(strip).text((i*480+12,17),title,font=font,fill=(25,24,20))
strip.convert('RGB').save(P/'preview_trap_loss.jpg',quality=94)
# Alternate parchment proof for edge inspection.
proof=Image.new('RGBA',(920,340),(180,167,130))
proof.alpha_composite(op,(10,18));proof.alpha_composite(sp,(470,18));proof.convert('RGB').save(W/'edge_proof.jpg',quality=95)
