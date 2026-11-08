from PIL import Image,ImageDraw,ImageFont,ImageFilter
from pathlib import Path
import numpy as np,shutil,json
R=Path('/workspace/handoff_to_maggi/upgrade_cards');O=R/'v10';W=O/'work';S=R/'v9'
F='/usr/share/fonts/truetype/sand-box/google/Gelasio/Gelasio-VariableFont_wght.ttf'
INK='#140E0A';PAPER='#E9D8B6';GOLD='#D9B46A'
blank=Image.open(S/'layout_template.png').convert('RGBA')
ART=(115,170,485,365);TITLE=(184,30,516,90);OWNER=(184,105,525,123);LEVEL=(204,128,505,147);REWARD=(58,380,542,505);COST=(58,680,542,829)
cards=[
('cleave','Cleave','KNIGHT',"Your knight's second target takes more damage. At level 5 he hits a third.","Crits get a little harder."),
('swing_and_a_miss','Swing and a Miss','KNIGHT',"Your knight hits harder.","Once a run, a miss hits the companion behind him for a quarter of their life."),
('embers','Embers','FIRESTARTER',"Fire does more damage.","A miss may set an ally on fire."),
('shield_wall','Shield Wall','ANY',"The enemy's first attack each fight may be blocked.","The block window shrinks a little."),
('thunder_fist','Thunder Fist','DARK WIZARD',"A right answer may stun an enemy.","Wizard sums get harder."),
('high_voltage','High Voltage','DARK WIZARD',"Right answer: lightning hits every enemy harder (+3).","A miss shocks one ally."),
('rallying_cry','Rallying Cry','KNIGHT',"Your party may strike twice.","Angry foes may strike the moment the meter runs out."),
('weighted_axe','Weighted Axe','EXECUTIONER',"More damage against badly hurt enemies.","A miss sticks the axe in the ground: he skips his next turn.")]
paths={'thunder_fist':'93d33c70cba4e62e3e48ef6629b992dbfd18b48bbc440bc462f8fa88ab6928eb','rallying_cry':'eb5e6fb1f4d244bf200c81936653c70147e15ff75845154a7848f8bdd365701c','weighted_axe':'5f3c32de79a89fc9973440cde847358038e58751db6ae69b18021e8aea0ebc0c'}
G=Path('/cursor/stores/user/grok-bot/agents/d95469bd-89ee-41dd-a45b-47f154a52ad8/assets')
def font(n,b=False):
 f=ImageFont.truetype(F,n)
 if b:f.set_variation_by_axes([650])
 return f
checks=[]
def text(c,t,box,n,color=INK,b=False):
 d=ImageDraw.Draw(c);x0,y0,x1,y1=box
 while True:
  f=font(n,b);lines=[];ln=''
  for w in t.split():
   q=(ln+' '+w).strip()
   if d.textlength(q,font=f)>x1-x0 and ln:lines.append(ln);ln=w
   else:ln=q
  if ln:lines.append(ln)
  step=round(n*1.22);height=step*len(lines)
  if height<=y1-y0:break
  n-=1
 assert n>=24 or box==OWNER
 y=y0+(y1-y0-height)/2
 bounds=[]
 for ln in lines:
  bb=d.textbbox((0,0),ln,font=f);x=(x0+x1-d.textlength(ln,font=f))/2
  # Position each actual glyph box inside its line cell.
  pos=(x,y+(step-(bb[3]-bb[1]))/2-bb[1]);d.text(pos,ln,font=f,fill=color)
  rect=d.textbbox(pos,ln,font=f);assert rect[0]>=x0-1 and rect[2]<=x1+1 and rect[1]>=y0 and rect[3]<=y1
  bounds.append(rect);y+=step
 checks.append({'text':t,'size':n,'box':box,'glyph_bounds':bounds})
def art_new(name):
 src=G/(paths[name]+'.jpg');shutil.copy(src,W/(name+'_generated.jpg'))
 im=Image.open(src).convert('RGB');a=np.asarray(im).astype(float)
 # Crop tightly to visible dark ink; same fit field as v9.
 mask=(a.mean(2)<155);ys,xs=np.where(mask);box=(max(0,xs.min()-14),max(0,ys.min()-14),min(im.width,xs.max()+15),min(im.height,ys.max()+15))
 im=im.crop(box);im.save(W/(name+'_source.png'));im.thumbnail((370,195),Image.Resampling.LANCZOS)
 a=np.array(im).astype(float);al=np.maximum(np.clip((225-a.mean(2))/100,0,1),np.clip((a.max(2)-a.min(2)-26)/55,0,1)*.95)
 edge=Image.new('L',im.size);ImageDraw.Draw(edge).rounded_rectangle((3,3,im.width-4,im.height-4),radius=8,fill=255)
 al*=np.asarray(edge.filter(ImageFilter.GaussianBlur(2)))/255
 tile=Image.fromarray(np.dstack([a.astype('uint8'),(al*255).astype('uint8')]),'RGBA');tile.save(W/(name+'_cutout.png'))
 return tile
new={k:art_new(k) for k in paths}
for name,title,owner,effect,cost in cards:
 c=blank.copy()
 # Preserve actual framed portraits from approved cards.
 psrc='embers' if name=='embers' else 'cleave'
 src=Image.open(S/(psrc+'.png')).convert('RGBA');c.paste(src.crop((60,7,183,143)),(60,7))
 # Clear title/owner/level region with exact untouched template pixels.
 for box in [TITLE,(184,94,525,146)]:c.paste(blank.crop(box),box[:2])
 if owner=='DARK WIZARD':
  c.paste(Image.open(R/'wizard/work/wizard_tomb_portrait.png'),(63,17))
  d=ImageDraw.Draw(c);d.ellipse((150,108,182,140),fill=INK,outline=PAPER,width=2);d.text((157,109),'×',fill=PAPER,font=font(26))
 if name=='weighted_axe':
  # No executioner exists in the supplied tomb sheet: preserve knight frame, replace interior with actual sprite head.
  head=Image.open(W/'executioner_ref.png').convert('RGBA').crop((238,21,358,167)).resize((82,96),Image.Resampling.LANCZOS)
  from scipy.ndimage import binary_fill_holes
  from scipy.spatial import ConvexHull
  a=np.array(head);yy,xx=np.where(a[:,:,:3].mean(2)>72);pts=np.column_stack([xx,yy]);hull=ConvexHull(pts);mask=Image.new('L',head.size);ImageDraw.Draw(mask).polygon([tuple(p) for p in pts[hull.vertices]],fill=255);a[:,:,3]=np.array(mask);head=Image.fromarray(a)
  paper=Image.open('/workspace/knight-math-game/assets/v7/ui/parchment.png').convert('RGBA').resize((600,900));c.paste(paper.crop((72,23,164,121)),(72,23));c.alpha_composite(head,(76,27))
 if name in ['cleave','swing_and_a_miss','embers','shield_wall']:
  c.paste(Image.open(S/(name+'.png')).crop(ART),ART[:2])
 elif name=='high_voltage':c.paste(Image.open(R/'wizard/overcharge.png').crop(ART),ART[:2])
 else:
  tile=new[name];c.alpha_composite(tile,(115+(370-tile.width)//2,170+(195-tile.height)//2))
 # Keep v9 symbolic cost medallion zone; use a neutral carved caution diamond rather than stale arithmetic.
 d=ImageDraw.Draw(c);d.polygon([(300,586),(321,615),(300,644),(279,615)],outline=GOLD,width=3);d.line((300,600,300,619),fill=GOLD,width=3);d.ellipse((298,626,302,630),fill=GOLD)
 c.save(O/(name+'_text_free.png'))
 text(c,title,TITLE,30,b=True);text(c,owner,OWNER,17);text(c,effect,REWARD,32);text(c,cost,COST,34,PAPER)
 c.save(O/(name+'.png'))
bg=Image.open('/workspace/knight-math-game/assets/v7/ui/parchment.png').convert('RGB').resize((2480,1840)).convert('RGBA')
for i,card in enumerate(cards):bg.alpha_composite(Image.open(O/(card[0]+'.png')),(16+(i%4)*616,20+(i//4)*910))
bg.convert('RGB').save(O/'sheet.jpg',quality=96)
bg.resize((1240,920),Image.Resampling.LANCZOS).convert('RGB').save(O/'sheet_50pct.jpg',quality=95)
ann=blank.copy();d=ImageDraw.Draw(ann)
for box,label in [(TITLE,'TITLE'),(OWNER,'OWNER'),(LEVEL,'LEVEL 2/5'),(ART,'ART'),(REWARD,'EFFECT'),(COST,'COST')]:d.rectangle(box,outline='#B5561C',width=2);d.text(box[:2],label,fill='#B5561C',font=font(14))
ann.save(O/'layout_safe_boxes.png');json.dump(checks,open(W/'text_fit_checks.json','w'),indent=2)
