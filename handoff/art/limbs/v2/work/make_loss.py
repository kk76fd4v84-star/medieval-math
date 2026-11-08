from pathlib import Path
from PIL import Image, ImageDraw, ImageChops, ImageFont
import math,json,hashlib
W=Path(__file__).parent; OUT=W.parent; V1=OUT.parent/'v1'; OLD=V1/'work'; INK='#211c17'; ORANGE='#e78b35'; PAPER='#dfceaa'
# All positions are authored in native, untrimmed cell pixels. PIL only.
DATA=[
 dict(name='frank',source='frank.png',sheet='frank',cell=512,pivot=(256,475),arm=[(189,170),(220,185),(208,225),(198,250),(183,294),(158,302),(138,280),(140,239),(159,202)],stump=(205,194),knee=(172,399),leg=[(130,401),(188,399),(191,423),(179,444),(185,473),(143,476),(119,438),(118,413)],peg=[(155,418),(181,420),(178,484),(137,484)],armtarget=(102,248),legtarget=(89,366)),
 dict(name='executioner',source='executioner.png',sheet='executioner',cell=512,pivot=(256,480),arm=[(204,195),(243,196),(247,228),(262,245),(282,260),(284,285),(266,298),(248,291),(229,271),(213,249)],stump=(231,220),knee=(153,389),leg=[(109,389),(173,387),(177,405),(162,431),(160,469),(135,480),(96,438),(88,405)],peg=[(135,408),(165,411),(160,489),(114,486)],armtarget=(122,249),legtarget=(79,357)),
 dict(name='timmy',source='timmy.png',sheet='timmy',cell=512,pivot=(256,460),arm=[(286,188),(309,190),(321,176),(332,150),(361,153),(374,175),(373,237),(346,245),(317,255),(291,261),(278,236)],stump=(301,218),knee=(194,359),leg=[(172,351),(207,361),(189,386),(163,410),(177,435),(179,455),(134,459),(112,434),(106,395)],peg=[(167,378),(192,391),(165,452),(129,455),(128,430)],armtarget=(414,248),legtarget=(90,355)),
 dict(name='follower_5',source='coif-walk-atlas.png',sheet='follower_5_walk',cell=512,pivot=(256,480),arm=[(191,193),(220,205),(209,237),(198,266),(195,292),(204,313),(197,334),(173,340),(152,321),(158,291),(165,266),(170,234),(180,210)],stump=(200,213),knee=(259,374),leg=[(245,375),(276,382),(260,407),(257,439),(285,456),(287,480),(204,482),(205,451),(217,409)],peg=[(243,385),(271,392),(244,484),(215,483)],armtarget=(104,263),legtarget=(126,388)),
 dict(name='dark_wizard',source='wizard.png',sheet='dark_wizard',cell=512,pivot=(270,482),arm=[(153,196),(182,210),(179,244),(174,272),(178,295),(170,317),(145,325),(127,306),(127,286),(134,257),(139,229)],stump=(165,225),knee=(165,402),leg=[(143,402),(180,405),(180,427),(171,445),(201,465),(205,482),(129,483),(115,460),(114,445)],peg=[(151,420),(181,422),(185,490),(146,491)],armtarget=(73,268),legtarget=(79,386))]
for i,skin in enumerate(['scarf','feather','moustache','stripe'],1):
 DATA.insert(2+i,dict(name=f'follower_{i}',source=skin+'-walk.png',sheet=f'follower_{i}_walk',cell=768,pivot=(384,680),arm=[(288,316),(335,335),(315,369),(307,407),(307,433),(314,458),(309,495),(277,508),(235,491),(229,454),(242,414),(242,375),(243,347),(263,321)],stump=(304,341),knee=(379.102,567.065),leg=[(353,565),(390,576),(369,617),(366,646),(399,660),(401,680),(269,681),(269,660),(292,618),(322,582)],peg=[(355,580),(391,592),(347,687),(297,685),(306,634),(299,615),(324,579)],armtarget=(167,432),legtarget=(199,556)))
DATA.sort(key=lambda a: ['frank','executioner','timmy','follower_1','follower_2','follower_3','follower_4','follower_5','dark_wizard'].index(a['name']))

def extract(im,poly):
 mask=Image.new('L',im.size);ImageDraw.Draw(mask).polygon(poly,fill=255)
 out=im.copy();out.putalpha(ImageChops.darker(im.getchannel('A'),mask));return out

def point_rotate(p,angle,pivot):
 # Pillow positive angle, in screen coordinates.
 a=math.radians(angle); x,y=p[0]-pivot[0],p[1]-pivot[1]
 return (pivot[0]+math.cos(a)*x+math.sin(a)*y,pivot[1]-math.sin(a)*x+math.cos(a)*y)

def flying(part,angle,target):
 box=part.getbbox(); cut=part.crop(box);cut=cut.rotate(angle,resample=Image.Resampling.BICUBIC,expand=True)
 return cut,(round(target[0]-cut.width/2),round(target[1]-cut.height/2))

def burst(im,p,side,scale):
 # Deliberately angular wedges, not droplets or gore.
 S=3; lay=Image.new('RGBA',(im.width*S,im.height*S));d=ImageDraw.Draw(lay)
 def poly(pts,fill):d.polygon([(round(x*S),round(y*S)) for x,y in pts],fill=fill)
 for j,(ang,length) in enumerate([(-65,30),(-30,40),(8,35),(49,27)]):
  a=math.radians(ang);u=(side*math.cos(a),math.sin(a));v=(-u[1],u[0]);start=15*scale;end=(15+length)*scale;wid=(5 if j%2 else 4)*scale
  pts=[(p[0]+u[0]*start-v[0]*wid/2,p[1]+u[1]*start-v[1]*wid/2),(p[0]+u[0]*end,p[1]+u[1]*end),(p[0]+u[0]*(start+6*scale)+v[0]*wid,p[1]+u[1]*(start+6*scale)+v[1]*wid)]
  poly(pts,INK if j%2==0 else ORANGE)
 lay=lay.resize(im.size,Image.Resampling.LANCZOS);return Image.alpha_composite(im,lay)

def make():
 records=[]; normals={}; v1hash={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in V1.glob('*.png')}
 for m in DATA:
  c=m['cell'];sz=(c,c);orig=Image.open(OLD/'originals'/m['source']).convert('RGBA').crop((0,0,c,c));normals[m['name']]=orig
  for limb in ['arm','leg']:
   body=Image.open(V1/(m['sheet']+'_no_'+limb+'.png')).convert('RGBA').crop((0,0,c,c))
   if limb=='leg':
    # Loss is BEFORE fitting a peg: remove the v1 wooden shaft, retain knee wrap.
    ImageDraw.Draw(body).polygon(m['peg'],fill=(0,0,0,0))
    tips={'frank':(158,461),'executioner':(139,464),'timmy':(148,444),'follower_5':(231,474),'dark_wizard':(166,469)}
    k=m['knee'];tip=tips.get(m['name'],(318,672));dx,dy=tip[0]-k[0],tip[1]-k[1];length=math.hypot(dx,dy);u=(dx/length,dy/length);v=(-u[1],u[0]);start=11 if m['cell']==768 else 9
    pts=[(k[0]+u[0]*t+v[0]*w,k[1]+u[1]*t+v[1]*w) for t,w in [(start,-12),(start,12),(length+15,15),(length+15,-15)]]
    ImageDraw.Draw(body).polygon(pts,fill=(0,0,0,0))
   part=extract(orig,m[limb]);part.save(W/(m['name']+'_removed_'+limb+'.png'))
   angle=5.0 if limb=='arm' else 6.5
   body=body.rotate(angle,resample=Image.Resampling.BICUBIC,center=m['pivot'])
   target=m[limb+'target'];side=1 if m['name']=='timmy' and limb=='arm' else -1
   chunk,pos=flying(part,(-42 if side<0 else 40) if limb=='arm' else -63,target)
   result=Image.new('RGBA',sz);result.alpha_composite(body);result.alpha_composite(chunk,pos)
   p=point_rotate(m['stump'] if limb=='arm' else m['knee'],angle,m['pivot'])
   result=burst(result,p,side,c/512)
   # Canonical clean transparency, without resampling colour into a background.
   alpha=result.getchannel('A');clean=Image.new('RGBA',sz);clean.paste(result,(0,0),Image.eval(alpha,lambda a:255 if a>=8 else 0));result=clean
   name=f"{m['name']}_lose_{limb}.png";result.save(OUT/name)
   saved=Image.open(OUT/name);assert saved.size==sz and saved.mode=='RGBA'
   bbox=saved.getchannel('A').point(lambda a:255 if a>=32 else 0).getbbox();assert bbox and bbox[0]>0 and bbox[1]>0 and bbox[2]<c and bbox[3]<c,(name,bbox)
   records.append(dict(file=name,cell=list(sz),pivot=list(m['pivot']),anchor=list(m['pivot']),source_frame=0,source=m['source'],v1_body=m['sheet']+'_no_'+limb+'.png',body_rotation_degrees=angle,alpha_bbox=bbox,sha256=hashlib.sha256((OUT/name).read_bytes()).hexdigest()))
 assert v1hash=={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in V1.glob('*.png')}
 (W/'verification.json').write_text(json.dumps(dict(frames=records,v1_pngs_unchanged=True,generations=0),indent=2));(OUT/'frames.json').write_text(json.dumps(records,indent=2))
 preview(DATA[:3],normals,'preview.jpg');preview(DATA,normals,'preview_all.jpg')

def preview(rows,normals,file):
 width=1260; rh=370;im=Image.new('RGB',(width,110+rh*len(rows)),PAPER);d=ImageDraw.Draw(im)
 font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'; f=ImageFont.truetype(font,25);small=ImageFont.truetype(font,18);title=ImageFont.truetype(font,30)
 d.text((30,18),'MEDIEVAL MATH / MOMENT OF LOSS',font=title,fill=INK)
 for x,s in zip([175,555,935],['NORMAL','LOSE ARM','LOSE LEG']):d.text((x,70),s,font=f,fill=INK)
 for i,m in enumerate(rows):
  y=110+i*rh; d.line((24,y,width-24,y),fill='#a38c66',width=2);d.text((28,y+12),m['name'].replace('_',' ').upper(),font=small,fill=INK)
  normal=normals[m['name']]; nb=normal.getbbox();scale=280/(nb[3]-nb[1]);px=m['pivot'];base=y+335
  for j,img in enumerate([normal]+[Image.open(OUT/(m['name']+'_lose_'+a+'.png')).convert('RGBA') for a in ['arm','leg']]):
   thumb=img.resize((round(img.width*scale),round(img.height*scale)),Image.Resampling.LANCZOS);x=230+j*390-round(px[0]*scale);yy=base-round(px[1]*scale);im.paste(thumb,(x,yy),thumb)
 im.save(OUT/file,quality=95)
if __name__=='__main__':make()
