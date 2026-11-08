import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont
from frame import R, W, H, CW, CHh, SIDE, TILE, crop, state
O='/workspace/handoff_to_maggi/tavern_ui/v1/'
FONT='/usr/share/fonts/truetype/sand-box/google/Gelasio/Gelasio-VariableFont_wght.ttf'
INK=(27,20,16,255)
sign=Image.open(O+'tavern_sign.png')
ic=Image.open('icons_key.png'); mug=ic.crop((0,0,246,ic.height)); bowl=ic.crop((398,0,ic.width,ic.height))
mug=mug.crop(mug.getbbox()); bowl=bowl.crop(bowl.getbbox())
bottle=Image.open('/workspace/handoff_to_maggi/fire_bottle/v4/bottle_icon.png'); bottle=bottle.crop(bottle.getbbox())
def fit(im,h): return im.resize((round(im.width*h/im.height),h),Image.LANCZOS)
def tall_frame(w_src,h_src):
    """riddle-frame corners + plain side lines + one side diamond, any size (source px)"""
    c=Image.new('RGBA',(w_src,h_src),(0,0,0,0))
    plain=lambda x0:crop(x0,160,x0+CW,240)    # plain vertical line rows
    for x0,dx in [(0,0),(W-CW,w_src-CW)]:
        y=CHh; mid=(h_src-SIDE[1]+SIDE[0])//2
        while y<h_src-CHh:
            if y<=mid<y+80 or (mid<=y and not hasattr(c,'_d')):
                pass
            p=plain(x0); hh=min(80,h_src-CHh-y); c.alpha_composite(p.crop((0,0,CW,hh)),(dx,y)); y+=hh
        c.alpha_composite(crop(x0,SIDE[0],x0+CW,SIDE[1]),(dx,mid))
    c.alpha_composite(crop(0,0,CW,CHh),(0,0)); c.alpha_composite(crop(W-CW,0,W,CHh),(w_src-CW,0))
    c.alpha_composite(crop(0,H-CHh,CW,H),(0,h_src-CHh)); c.alpha_composite(crop(W-CW,H-CHh,W,H),(w_src-CW,h_src-CHh))
    top=crop(TILE[0],0,TILE[1],CHh); bot=crop(TILE[0],H-CHh,TILE[1],H); x=CW; tw=TILE[1]-TILE[0]
    while x<w_src-CW:
        w=min(tw,w_src-CW-x); c.alpha_composite(top.crop((0,0,w,CHh)),(x,0)); c.alpha_composite(bot.crop((0,0,w,CHh)),(x,h_src-CHh)); x+=w
    return c
# framed variant: board x 55..615, y 242..865 -> frame inset
FX0,FY0,FX1,FY1=78,268,594,846
k=0.4
fr=tall_frame(round((FX1-FX0)/k),round((FY1-FY0)/k))
fr=state(fr,'normal').resize((FX1-FX0,FY1-FY0),Image.LANCZOS)
framed=sign.copy(); framed.alpha_composite(fr,(FX0,FY0)); framed.save(O+'tavern_sign_framed.png')
def menu(base, safe):
    m=base.copy(); d=ImageDraw.Draw(m)
    f=ImageFont.truetype(FONT,66); f.set_variation_by_axes([600])
    x0,y0,x1,y1=safe; rows=[('Mead',mug),('Stew',bowl),('Fire bottle',bottle)]
    lh=(y1-y0)/3
    for i,(t,icn) in enumerate(rows):
        cy=y0+lh*(i+0.5); ih=72; g=fit(icn,ih)
        tw=d.textlength(t,font=f); total=g.width+18+tw
        x=(x0+x1)/2-total/2
        m.alpha_composite(g,(round(x),round(cy-ih/2)))
        d.text((x+g.width+18,cy),t,font=f,fill=INK,anchor='lm')
    return m
SAFE=(95,320,575,800); SAFE_F=(125,350,545,770)
menu(sign,SAFE).save(O+'tavern_sign_mockup.png'); menu(framed,SAFE_F).save(O+'tavern_sign_framed_mockup.png')

# ---------- scene mockup
scene=np.asarray(Image.open('/workspace/handoff_to_maggi/tavern_ui/after_default.png').convert('RGB')).copy()
lum=scene.mean(-1); reg=np.zeros(scene.shape[:2],bool); reg[62:352,212:428]=True; reg[292:352,419:428]=False; reg[:140,419:]=False
dark=(lum<165)&reg
# old sign body: solid area -> fill the whole board region
board=np.zeros_like(reg); board[150:345,225:405]=True; 
m=cv2.dilate(((dark|board)&reg).astype(np.uint8)*255,np.ones((5,5),np.uint8))
mask=m
scene=cv2.inpaint(scene,mask,5,cv2.INPAINT_TELEA)
# put paper grain back into the filled pixels (borrowed from a clean wall patch)
orig=np.asarray(Image.open('/workspace/handoff_to_maggi/tavern_ui/after_default.png').convert('RGB')).astype(float)
patch=orig[745:855,20:330]; hp=patch-cv2.GaussianBlur(patch,(0,0),4)
ph,pw=hp.shape[:2]; tile=np.tile(hp,(scene.shape[0]//ph+1,scene.shape[1]//pw+1,1))[:scene.shape[0],:scene.shape[1]]
mf=(cv2.GaussianBlur(mask.astype(float),(0,0),2)/255)[...,None]
scene=np.clip(scene+tile*mf*0.8,0,255).astype(np.uint8)
# old buttons: replace with clean parchment from the empty strip at the left
for x0,x1 in [(355,625),(636,896),(910,1240)]:
    w=x1-x0; src=scene[748:852,20:20+w].copy() if w<=330 else None
    if src is None: src=np.concatenate([scene[748:852,20:330],scene[748:852,20:20+w-310]],1)
    scene[748:852,x0:x1]=src
S=Image.fromarray(scene).convert('RGBA')
ms=menu(framed,SAFE_F) if False else menu(sign,SAFE)
sc=0.36; ms=ms.resize((round(ms.width*sc),round(ms.height*sc)),Image.LANCZOS); S.alpha_composite(ms,(172,56))
# buttons from the 9-slice frame
src=Image.open(O+'button_frame@2x.png')
def button(w,h,st):
    f=Image.open(O+f'button_frame{"" if st=="normal" else "_"+st}@2x.png')
    s2=h/90; L=round(50*2*s2) if False else None
    # 9-slice: left/right 50 px (1x), stretch the middle columns
    fw,fh=f.size; cap=124
    hh=round(h*2); f=f.resize((round(fw*hh/fh),hh),Image.LANCZOS); cap=round(cap*hh/fh)
    out=Image.new('RGBA',(w*2,hh),(0,0,0,0))
    out.alpha_composite(f.crop((0,0,cap,hh)),(0,0)); out.alpha_composite(f.crop((f.width-cap,0,f.width,hh)),(w*2-cap,0))
    mid=f.crop((cap,0,f.width-cap,hh)).resize((w*2-2*cap,hh),Image.LANCZOS); out.alpha_composite(mid,(cap,0))
    return out.resize((w,h),Image.LANCZOS)
purse=Image.open('/workspace/knight-math-game/assets/v11/ui/money-purse.png'); purse=purse.crop(purse.getbbox())
f34=ImageFont.truetype(FONT,34)
d=ImageDraw.Draw(S)
items=[('Mead',mug,'3','hover'),('Stew',bowl,'2','normal'),('Fire bottle',bottle,'6','disabled')]
widths=[]
for t,icn,p,st in items:
    widths.append(round(40+12+d.textlength(t,font=f34)+14+30+6+d.textlength(p,font=f34)+2*58))
gap=24; total=sum(widths)+gap*2; x=(1600-total)//2; y=758
for (t,icn,p,st),w in zip(items,widths):
    b=button(w,84,st); layer=Image.new('RGBA',S.size,(0,0,0,0)); layer.alpha_composite(b,(x,y))
    dl=ImageDraw.Draw(layer); cx=x+58; cy=y+42
    g=fit(icn,40); layer.alpha_composite(g,(cx,cy-20)); cx+=g.width+12
    col=(27,20,16,255)
    dl.text((cx,cy),t,font=f34,fill=col,anchor='lm'); tw=dl.textlength(t,font=f34)
    if st=='hover': dl.line([(cx,cy+22),(cx+tw,cy+22)],fill=(196,98,40,255),width=2)
    cx+=tw+14; pu=fit(purse,32); layer.alpha_composite(pu,(round(cx),cy-17)); cx+=pu.width+6
    dl.text((cx,cy),p,font=f34,fill=col,anchor='lm')
    if st=='disabled':
        a=np.asarray(layer).astype(float); g_=a[...,:3].mean(-1,keepdims=True); a[...,:3]=g_*0.6+np.array([118,106,94])*0.4; a[...,3]*=0.45
        layer=Image.fromarray(a.astype(np.uint8),'RGBA')
    if st=='hover':
        layer=layer.transform(layer.size,Image.AFFINE,(1,0,0,0,1,2))   # 2 px lift like the CSS hover
    S.alpha_composite(layer); x+=w+gap
S.convert('RGB').save(O+'mockup_tavern_ui.jpg',quality=90)
