import numpy as np,sys
from PIL import Image
from scipy import ndimage as nd
im=Image.open('../../v3/work/terrify_gen1.jpg').convert('RGB');a=np.asarray(im).astype(int)
bg=np.median(np.concatenate([a[:5].reshape(-1,3),a[-5:].reshape(-1,3)]),0)
near=(np.abs(a-bg).sum(2)<40)
lab,_=nd.label(near);edge=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
out=np.isin(lab,list(edge));alpha=(~out).astype(np.uint8)*255
alpha=np.asarray(Image.fromarray(alpha).filter(__import__('PIL.ImageFilter').ImageFilter.GaussianBlur(.8)))
rgba=np.dstack([a.astype(np.uint8),alpha]);art=Image.fromarray(rgba,'RGBA');art=art.crop(art.getbbox())
art.save('../art_terrify.png')
sys.argv=['x'];src=open('/workspace/handoff_to_maggi/meter_tips/v2/work/build.py').read().split('# card badges')[0]
src=src.replace("O=Path('/workspace/handoff_to_maggi/meter_tips/v2')","O=Path('/workspace/handoff_to_maggi/meter_tips/v4')")
src=src.split('base={')[0]
exec(src)
base={'block':.25,'crit':.5,'normal':.75,'weak':1}
tip('A terrifying foe',"Some creatures terrify you, and make the fight harder than it should be. But the more you and your fellowship level up, the braver you become, and these things will affect you less.",
    base,{'block':.15,'crit':.36,'normal':.75,'weak':1},{'block':.25,'crit':.5},'tip_terrify.png','art_terrify.png')
