FOREGROUND BIOMES — v11
12 RGBA strips: forest, barren tundra, rocky ground, meadow plains; three variations each. All 2172x300; ground line y=270. Each uses shared 80px joining sections from the v9 strip, with matching left/right boundary columns across every variant. Original illustration sheets retained under sources. Art generated with built-in imagegen using approved hills reference, then cropped and registered for export.

Draw above characters, below UI. Align y=270 to the character ground baseline. Transparent space above; pale interior areas retain occlusion. Use consistent paper colour treatment with the other scenery; don't make white pixels transparent. No gradients or shadows added. These are low ground details, not full biome scenery backgrounds.

choose-strip.js returns a stable variant from biome, world tile index and run seed. Do NOT choose randomly every render frame: that flickers. Store/reuse the run seed. visible(cameraX,viewWidth,scale) returns tile positions. Draw selected PNG at x and at groundScreenY-270*scale, at 2172*scale by 300*scale. Use biomeAt(worldTileIndex) from the game to select an area's mood. Every edge is compatible even when biome changes; gradual longer biome transitions remain a game design choice. All reference paths are relative to this folder.

Matching boundary pixels and transparent tops verified for all twelve. Contact sheet is flattened for viewing only; use strips/*.png in engine.
