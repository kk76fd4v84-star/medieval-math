from PIL import Image,ImageDraw,ImageFont,ImageFilter
from pathlib import Path
import sys
sys.path.insert(0,'/workspace/handoff_to_maggi/tavern_ui/riddle/v1/work')
from qframe import make
O=Path('/workspace/handoff_to_maggi/meter_tips/v4')
A=Path('/workspace/handoff_to_maggi/tutorial/castbar_v1/work/current_play/assets')
T=Path('/workspace/mm_repo/assets/timing-woodcut')
FONT='/usr/share/fonts/truetype/sand-box/google/Gelasio/Gelasio-VariableFont_wght.ttf';INK='#140E0A'
def f(n,b=False):
    q=ImageFont.truetype(FONT,n)
    if b:q.set_variation_by_axes([650])
    return q
BOX={'block':(40,46),'crit':(90,46),'normal':(96,46),'weak':(64,46)}
def ic(name,scale=1.0,alpha=1.0):
    im=Image.open(T/(name+'.png')).convert('RGBA');b=BOX[name];im.thumbnail((int(b[0]*scale),int(b[1]*scale)),Image.Resampling.LANCZOS)
    if alpha<1:
        a=im.split()[3].point(lambda v:int(v*alpha));im.putalpha(a)
    return im
def put(p,im,cx,cy):p.alpha_composite(im,(round(cx-im.width/2),round(cy-im.height/2)))
def track(p,x0,x1,y,h=11):
    tr=Image.open(T/'track.png').convert('RGBA')
    if h!=11: tr=tr.resize((tr.width,h))
    x=x0
    while x<x1:
        w=min(tr.width,x1-x);p.alpha_composite(tr.crop((0,0,w,tr.height)),(x,y));x+=w
def trail(p,xa,xb,y,good,h=16):
    a,b=sorted((int(round(xa)),int(round(xb))))
    if b-a<4:return
    fl=Image.open(Path('/workspace/handoff_to_maggi/castbar_preview/v1')/('fill_good.png' if good else 'fill_bad.png')).convert('RGBA')
    # 9-slice horizontally so the ragged ends stay the same
    s=6;L=fl.crop((0,0,s,fl.height));R=fl.crop((fl.width-s,0,fl.width,fl.height));M=fl.crop((s,0,fl.width-s,fl.height))
    w=b-a;M=M.resize((max(1,w-2*s),fl.height))
    st=Image.new('RGBA',(w,fl.height));st.alpha_composite(L,(0,0));st.alpha_composite(M,(s,0));st.alpha_composite(R,(w-s,0))
    st=st.resize((w,h),Image.Resampling.LANCZOS);p.alpha_composite(st,(a,y-2))
def bar(p,x0,x1,y,pos,moves,scale=1.0):
    """pos: name->frac (new); moves: name->old frac"""
    track(p,x0,x1,y)
    for n,old in moves.items():
        new=pos[n];trail(p,x0+old*(x1-x0),x0+new*(x1-x0),y,new>old)
    for n,fr in pos.items():
        put(p,ic(n,scale),x0+fr*(x1-x0)-(32*scale if n=='weak' else 0),y+3)
def tip(title,text,base,pos,moves,out,art):
    W,H=1100,860
    p=Image.open(A/'v7/ui/parchment.png').convert('RGB').resize((W,H)).convert('RGBA');d=ImageDraw.Draw(p)
    p.alpha_composite(make(W,H))
    def center(t,y,n,bold=False):
        ft=f(n,bold);d.text(((W-d.textlength(t,font=ft))/2,y),t,font=ft,fill=INK)
    center(title,32,44,True)
    # wrap text
    ft=f(29);words=text.split();lines=[];cur=''
    for w_ in words:
        t=(cur+' '+w_).strip()
        if d.textlength(t,font=ft)>860:lines.append(cur);cur=w_
        else:cur=t
    lines.append(cur)
    for i,l in enumerate(lines):center(l,100+i*42,29)
    ai=Image.open(O/art);ai.thumbnail((760,300),Image.Resampling.LANCZOS);ay=100+len(lines)*42+10;p.alpha_composite(ai,((W-ai.width)//2,ay))
    y0=ay+ai.height+45
    x0,x1=230,950
    lab=f(24,True)
    d.text((95,y0-8),'Before',font=lab,fill=INK)
    bar(p,x0,x1,y0,base,{})
    y1=y0+85
    d.text((95,y1-8),'After',font=lab,fill=INK)
    bar(p,x0,x1,y1,pos,moves)
    d.text((x0,y1+32),'Earlier',font=f(21),fill=INK);d.text((x1-55,y1+32),'Later',font=f(21),fill=INK)
    button=Image.open('/workspace/handoff_to_maggi/tavern_ui/v1/button_frame.png').convert('RGBA');p.alpha_composite(button,(400,H-120));center('Onward!',H-101,34,True)
    mask=Image.new('L',(W,H));ImageDraw.Draw(mask).rounded_rectangle((1,1,W-2,H-2),radius=17,fill=255);p.putalpha(mask.filter(ImageFilter.GaussianBlur(.35)))
    p.save(O/out)
    return p
base={'block':.25,'crit':.5,'normal':.75,'weak':1}
party=tip('A bigger party',"With a larger party comes bigger damage. However, more people also means more arguing about who swings first, so you get less time to block or land a critical hit.",
    base,{'block':.17,'crit':.40,'normal':.75,'weak':1},{'block':.25,'crit':.5},'tip_party.png','art_party.png')
gear=tip('Better gear',"Better gear compensates for your party not being able to agree on anything.",
    base,{'block':.33,'crit':.60,'normal':.75,'weak':1},{'block':.25,'crit':.5},'tip_gear.png','art_gear.png')
