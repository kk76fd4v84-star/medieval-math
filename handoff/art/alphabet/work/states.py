import numpy as np, json, os
from PIL import Image, ImageDraw
O='/workspace/handoff_to_maggi/alphabet/'
COL={'correct':(181,86,28),'wrong':(122,31,20)}   # #B5561C burnt orange, #7A1F14 madder red
for st,c in COL.items():
    os.makedirs(O+st,exist_ok=True)
    for f in ['atlas_alphabet.png']+[L+'.png' for L in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ']:
        a=np.asarray(Image.open(O+f)).copy(); a[...,:3]=c
        Image.fromarray(a,'RGBA').save(O+st+'/'+f)
# preview
P=Image.open('/workspace/knight-math-game/assets/v7/ui/parchment.png').convert('RGBA')
c=P.resize((2000,1080)).copy(); d=ImageDraw.Draw(c)
x=30;y=20
for L in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ':
    g=Image.open(O+L+'.png')
    if x+g.width>1980: x=30;y+=200
    c.alpha_composite(g,(x,y)); x+=g.width
y+=230
def word(states,y,x=30):
    for L,st in zip('DRAGON',states):
        g=Image.open(O+(st+'/' if st in COL else '')+L+'.png')
        if st=='pending':
            a=np.asarray(g).copy(); a[...,3]=(a[...,3]*0.35).astype(np.uint8); g=Image.fromarray(a,'RGBA')
        c.alpha_composite(g,(x,y)); x+=g.width
    return x
x=word(['correct','correct','correct','wrong','pending','pending'],y)
# digits for comparison
x+=60
for dgt in '7+3':
    f={'+':'/workspace/knight-math-game/assets/v10/ink/glyph-operator-0.png'}.get(dgt,f'/workspace/knight-math-game/assets/v10/ink/glyph-digit-{dgt}.png')
    g=Image.open(f); yy=y+(190-g.height)//2 if dgt=='+' else y
    c.alpha_composite(g,(x,yy)); x+=g.width
y+=210
word(['correct']*6,y)
c.convert('RGB').save(O+'preview_alphabet.png')
