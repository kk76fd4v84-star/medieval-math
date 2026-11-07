"""Import the artist's single photographed pen sheet. Coordinates refer to its original pixels."""
from pathlib import Path
import json, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps, ImageFont

source=Image.open(sys.argv[1]).convert('L')
out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
# Outlines delimit neighbours on this packed sheet; they never become visible marks.
items={
 'imp':[(235,269),(510,269),(520,520),(618,535),(618,603),(235,603)],'maw':[(592,48),(1124,48),(1124,612),(644,612),(645,444),(588,430)],'coif':(1172,185,1403,447),
 'fence':(1640,39,2112,214),'post':(2124,77,2434,257),'sign':[(2235,277),(2493,277),(2493,478),(2298,478),(2298,362),(2235,358)],
 'cottage':[(1600,261),(2160,261),(2207,363),(2207,395),(2277,403),(2284,647),(2382,682),(2382,757),(1600,758)],
 'cross-a':(82,609,284,937),'cross-b':(315,625,494,891),'cross-c':(571,625,725,865),
 'stack-small':(826,757,1107,1010),'stack-large':(1110,509,1555,1030),
 'castle':[(3,1390),(199,1319),(251,1168),(320,1182),(329,1043),(376,1032),(382,1023),(414,1028),(427,984),(489,951),(496,849),(577,848),(646,910),(652,992),(795,1023),(833,1097),(984,1123),(1047,1295),(1130,1377),(1261,1420),(1261,1472),(3,1472)],
 'hill':[(3,1525),(1105,1524),(1198,1639),(1275,1694),(1365,1745),(1365,1773),(3,1773)],
 'hermit':[(1259,1280),(1391,1233),(1426,1120),(1579,1102),(1649,1191),(1702,1227),(1716,1328),(1717,1541),(1745,1724),(1757,1764),(1639,1769),(1350,1729),(1270,1441)],
 'knight':[(1606,899),(1640,894),(1739,1050),(1824,966),(1913,946),(2030,1037),(2035,1091),(2077,1117),(2082,1216),(2103,1392),(2164,1454),(2152,1530),(2200,1640),(2240,1712),(2229,1740),(1750,1740),(1750,1640),(1802,1590),(1816,1455),(1763,1431),(1749,1336),(1735,1251),(1604,946)],
 'rushes':(1702,760,2475,921),'daisies':(2080,969,2502,1114),'clover':(2143,1141,2481,1285)
}
# These substrate regions close deliberately open base/hem contours by hand. The
# photographed ink is always sampled independently, including all loose hatch marks.
supports={
 'castle':[[(13,1443),(162,1377),(281,1345),(396,1330),(502,1335),(626,1322),(705,1338),(861,1335),(1020,1370),(1230,1432),(1058,1408),(844,1388),(645,1377),(413,1390),(215,1384)]],
 'cottage':[[(1710,479),(1754,432),(1781,397),(1802,343),(2055,304),(2139,418),(2183,459),(2247,445),(2244,682),(2302,697),(2240,696),(2140,681),(2050,686),(1978,696),(1857,685),(1734,704),(1715,698)]],
 'stack-small':[[(874,973),(897,906),(925,857),(958,828),(994,858),(1029,909),(1046,971)]],
 'stack-large':[[(1157,985),(1189,841),(1218,733),(1257,638),(1304,601),(1374,641),(1440,734),(1477,856),(1499,976)]],
 'coif':[[(1208,310),(1246,238),(1309,222),(1360,274),(1376,383),(1342,410),(1312,374),(1278,391),(1232,384),(1209,405)]],
 'hermit':[[(1442,1400),(1500,1331),(1594,1269),(1660,1280),(1694,1332),(1680,1482),(1701,1582),(1654,1569),(1589,1585),(1524,1612),(1490,1572),(1445,1580)]],

}
pigments={
 'castle':[([(382,1054),(409,1060),(438,1067),(413,1070),(382,1066)],(168,107,62)), ([(520,866),(544,870),(568,870),(547,877),(519,883)],(168,107,62))]
}
def polygon_mask(points,size,box):
 mask=Image.new('L',size);ImageDraw.Draw(mask).polygon([(x-box[0],y-box[1]) for x,y in points],fill=255);return mask

assets={}
for name,zone in items.items():
 if isinstance(zone,list):
  xs,ys=zip(*zone);box=(min(xs),min(ys),max(xs)+1,max(ys)+1)
 else:box=zone
 roi=source.crop(box); allowed=np.asarray(polygon_mask(zone,roi.size,box)) if isinstance(zone,list) else np.full((roi.height,roi.width),255)
 gray=np.asarray(roi,dtype='float32');local=np.asarray(roi.filter(ImageFilter.GaussianBlur(10)),dtype='float32')
 # Local contrast removes the embossing of the paper without losing pressure variation.
 strength=np.clip(np.minimum((185-gray)/74,(local-gray-17)/65),0,1) * allowed/255
 # Black lines have real black cores; faint wrinkles and dust rarely touch one.
 faint=Image.fromarray(np.uint8(strength*255)); seeds=faint.point(lambda p:255 if p>=84 else 0)
 seen=np.asarray(seeds.filter(ImageFilter.MaxFilter(5)))>0
 strength*=seen
 # Close small pen breaks to make closed regions opaque; exterior pixels retain line antialiasing only.
 barrier=Image.fromarray(np.uint8(strength>.15)*255).filter(ImageFilter.MaxFilter(7))
 framed=ImageOps.expand(barrier,border=1,fill=0);ImageDraw.floodfill(framed,(0,0),128)
 enclosed=np.asarray(framed)[1:-1,1:-1]!=128
 interior=Image.fromarray(enclosed.astype('uint8')*255).filter(ImageFilter.MinFilter(7))
 solid=np.asarray(interior)>0
 for poly in supports.get(name,[]):solid=solid | (np.asarray(polygon_mask(poly,roi.size,box))!=0)
 def enclosed_at(x,y):
  mask=barrier.copy();point=(x-box[0],y-box[1])
  if mask.getpixel(point)!=0:return np.zeros_like(solid)
  ImageDraw.floodfill(mask,point,128)
  region=np.asarray(mask)==128
  if region[0].any() or region[-1].any() or region[:,0].any() or region[:,-1].any():return np.zeros_like(region)
  return np.asarray(Image.fromarray(region.astype('uint8')*255).filter(ImageFilter.MaxFilter(7)))>0
 if name=='knight':
  for xy in [(1870,1306),(1873,1405)]:solid=solid & ~enclosed_at(*xy)
 if name=='hill':
  # The photograph cuts off the left slope. Keep the artist's hill intact, and
  # reserve the ground below the ridge so distant ink cannot show through it.
  h,w=strength.shape
  x=np.arange(w); ridge=np.argmax(strength>.35,axis=0)
  valid=(strength>.35).any(axis=0)
  ridge=np.interp(x,x[valid],ridge[valid])
  ridge=np.asarray(Image.fromarray(ridge[None,:].astype('uint8')).filter(ImageFilter.MedianFilter(5)))[0]
  depth=np.minimum(100,np.minimum(np.maximum(0,w-20-x)*.34,200))
  solid |= (np.arange(h)[:,None]>=ridge)&(np.arange(h)[:,None]<=ridge+depth)&valid
 alpha=np.where(solid,1,strength)
 # Semi-transparent exterior strokes carry ink RGB, never a pale matte.
 paper=np.empty((*gray.shape,3),dtype='float32');paper[:]=[229,213,187] if name in ('knight','imp','maw','hermit','coif') else [246,242,232]
 for points,colour in pigments.get(name,[]):paper[np.asarray(polygon_mask(points,roi.size,box))>0]=colour
 if name=='knight':
  plume=[(1879,1014),(1888,1008),(1913,1006),(1930,1011),(1943,1025),(1951,1038),(1976,1048),(2010,1058),(1964,1052),(1932,1056),(1915,1041),(1898,1028)]
  paper[(np.asarray(polygon_mask(plume,roi.size,box))>0)&solid]=[170,107,61]
  # The split hanging surcoat, bounded by the belt and ragged hem.
  cloth=[(1985,1386),(2008,1383),(2027,1380),(2024,1438),(2010,1495),(1992,1535),(1986,1502),(1978,1541),(1975,1508),(1969,1481)]
  paper[(np.asarray(polygon_mask(cloth,roi.size,box))>0)&solid]=[167,105,60]
 ink=np.array({'castle':[83,71,58],'hill':[122,107,85],'cottage':[69,57,44]}.get(name,[44,39,32]));rgb=np.where(solid[:,:,None],paper*(1-strength[:,:,None])+ink*strength[:,:,None],ink)
 img=Image.fromarray(np.dstack((rgb,alpha*255)).astype('uint8'),'RGBA');trim=img.getbbox()
 img=img.crop(trim)
 if name=='hill':
  # Complete the clipped left end with the sheet's own taper. Match ridge height at the join.
  pixels=np.array(img)
  def first_stroke(col):
   dark=(pixels[:,col,0]<180)&(pixels[:,col,3]>45)
   return np.flatnonzero(dark)[0] if dark.any() else img.height
  seam=min(range(int(img.width*.68),int(img.width*.9)),key=lambda i:abs(first_stroke(i)-first_stroke(0)))
  cap=ImageOps.mirror(img.crop((seam,0,img.width,img.height)))
  dy=int(first_stroke(0)-first_stroke(seam));assembled=Image.new('RGBA',(cap.width+img.width-1,img.height+abs(dy)))
  assembled.paste(cap,(0,max(0,dy)));assembled.paste(img,(cap.width-1,max(0,-dy)));img=assembled
 if name=='knight':img=ImageOps.mirror(img)
 # Leave a transparent gutter around each sprite for filtering on the GPU.
 img=ImageOps.expand(img,border=3,fill=(0,0,0,0));img.save(out/(name+'.png'),optimize=True)
 px={'knight':.40,'imp':.44,'maw':.67,'hermit':.53}.get(name,.5)
 assets[name]={'pivot':[round(img.width*px),img.height-3],'width':img.width,'height':img.height,'sourceCrop':[box[0]+trim[0],box[1]+trim[1],box[0]+trim[2],box[1]+trim[3]],'mirrored':name=='knight'}
(out/'sprites.json').write_text(json.dumps(assets,indent=2)+'\n')
if len(sys.argv)>3:
 # One shared reduction, matching the game's 0.6 source-to-stage artScale.
 # Never thumbnail each drawing into an equal-sized cell: that hides its true proportions.
 from PIL import ImageFont
 scale=.6;gap=36;width=1600
 rows=[['knight','hermit','maw','imp','coif'],['castle','cottage'],
       ['fence','post','sign','stack-small','stack-large'],
       ['cross-a','cross-b','cross-c','rushes','daisies','clover'],['hill']]
 row_heights=[max(round(assets[name]['height']*scale) for name in row) for row in rows]
 sheet=Image.new('RGB',(width,100+sum(row_heights)+len(rows)*68+24),(229,213,187));d=ImageDraw.Draw(sheet)
 title_font=ImageFont.load_default(size=26);font=ImageFont.load_default(size=18)
 d.text((36,22),'Your drawings at one shared scale',font=title_font,fill='#302218')
 d.text((36,61),'Every sprite: 60% of source pixels. Proportions match the sheet. No individual fitting.',font=font,fill='#51463a')
 y=100
 for row,row_height in zip(rows,row_heights):
  widths=[round(assets[name]['width']*scale) for name in row];x=(width-sum(widths)-gap*(len(row)-1))//2
  for name,w in zip(row,widths):
   img=Image.open(out/(name+'.png'));img=img.resize((w,round(img.height*scale)),Image.Resampling.LANCZOS)
   sheet.paste(img,(x,y+row_height-img.height),img)
   d.text((x,y+row_height+12),name.replace('-',' '),font=font,fill='#302218');x+=w+gap
  y+=row_height+68
 sheet.save(sys.argv[3])
