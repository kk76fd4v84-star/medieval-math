# Black-knight "ghost" team sprites — v3

v3 is the v2 set plus a fix for the executioner's cut-off foot in his attack frame. It was made with PIL and numpy only, with zero image generations. v1 and v2 have not been changed.

## Finding: the foot is cut off in the source image, not by the game
In assets/party-roles/executioner.png the attack figure (cell 5 at x 1024–1535, y 512–1023) is wider than its cell. It runs from x 971 to 1503, which is 533 px.
Its back boot and some robe tatters (53 px, about 3.7k pixels) spill into cell 4. The game draws each 512x512 cell exactly as listed in src/config/specialists.js line 2: the executioner frame 5 is {x:1024, y:512, w:512, h:512}. So the boot is clipped at x=1024.
The same spill also leaves a boot sliver at the right edge of rear cell 4.
The code is doing what it should, so nothing needs fixing there. Widening the frame rectangle in code would not help either, because the pixels from x 971 to 1023 also hold part of cell 4's own drawing.
I checked frank, timmy and wizard: no other figure crosses a cell boundary, and the executioner has no other attack cell.

## Fix (cells 4 and 5 only; all other pixels are identical to before)
- **Cell 5:** I took the whole attack figure out (spill included) and scaled it to 95% so it fits the cell. The scaling is anchored on the feet line at y=484, so his feet stay on the same ground line as the other frames. The figure now spans x 5–504 and y 33–482, with no pixels touching any cell edge.
  - He shrinks by 5% and shifts about 40 px forward (to the right) during the chop. That reads as a lunge.
  - Nothing had to be rebuilt: the boot pixels were all there, just outside the cell.
- **Cell 4:** I removed the stray boot and robe pixels that had spilled in from cell 5.
- **Ghost version:** I recoloured the full uncut figure again with the v2 rules (orange hood, black clothes, orange belt). The whole back boot keeps its original brown, and the trouser leg above it is black.

## Files
| File | What |
|---|---|
| executioner_fixed.png | NEW: our own team's executioner (original colours) with the fix. It is a drop-in replacement for assets/party-roles/executioner.png. |
| executioner_ghost.png | The v2 ghost executioner with the same fix. In brawl it goes to assets/brawl/ghost/executioner_ghost.png (src/data/brawl.js line 24). |
| everything else | Copied unchanged from v2 (see ../v2/README.md and ../v1/README.md). |

Both sheets are 1536x1024 RGBA with the same 3x2 layout. Alpha differs from the originals only in cells 4 and 5.
The 'top' value for frame 5 in specialists.js (currently 9) would now be about 33. As far as I can see, the sequence only reads frames[2].pivot and frames[2].top (specialists.js line 4), so it shouldn't need changing.

contact_sheet.jpg shows attack cell 5 and rear cell 4, before and after, for both the original-colour and ghost executioner. Each is cropped exactly as the game crops it.
