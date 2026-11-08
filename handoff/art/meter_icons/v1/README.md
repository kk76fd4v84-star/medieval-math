# Meter-pressure icons v1
Exactly ONE image generation. Six isolated woodblock icons generated as a sheet, cut/keyed locally, purple spill removed, centred with transparent padding. No parchment rectangle. No game integration.

Each PNG is 256×256 RGBA; 64/ contains matching 64×64 transparent versions:
- quick.png — running hare: needle moves faster.
- heavy.png — iron anvil: narrower block band.
- slippery.png — eel: narrower critical band.
- shrouded.png — ink splash: ink hides part of the meter.
- helm.png — great helm gear: gives back meter time.
- lantern.png — medieval yellow-flame lantern gear: clears ink.

icon_sheet.jpg shows all six on actual game parchment at 256, 64 and 48px. Inspected small-size readability. Silhouettes remain distinct; fine gouge hatching naturally merges at small sizes. Eel can resemble a snake at 48px, though its finless curved body and no tongue favour eel. Hare is deliberately wider than tall. Lantern's small flame is clearer at 64 than 48px. Background is transparent, so very dark UI may need a light backplate provided by the game.

work/generated_sheet.jpg preserves the single generation; work/build.py reproduces keying, crops and exports. Purple regions inside shapes are transparent too. A neighbouring lantern-handle fragment at the source cell boundary was excluded from the ink-splash crop.
