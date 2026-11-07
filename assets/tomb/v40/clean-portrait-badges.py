from PIL import Image
from pathlib import Path
p=Path(__file__).resolve().parent/'portraits-source.png'
im=Image.open(Path(__file__).resolve().parents[3]/'art-direction/concepts/tomb-concept-v1.png').convert('RGBA')
# Remove only concept-painted hearts inside their plaques; all portrait/frame strokes stay original.
patch=im.crop((647,600,677,620))
for box in [(553,666,601,684),(729,666,777,684),(901,666,949,684),(1076,666,1123,684)]:
 im.paste(patch.resize((box[2]-box[0],box[3]-box[1])),box)
im.save(p)
