# Grail trap v3 — review only

Pillow-only processing of the two supplied drawings. No generations; no changes to v1/v2 or the game/repository.

## Files
- `trap_open_grail.png`: 440 × 304 RGBA, orange grail, iron, rays, grass and pebbles.
- `trap_sprung.png`: 440 × 304 RGBA, raised shut jaws, impact rays, dust puffs and ground details.
- `preview_scene.jpg`: 1638 × 497, two copies of the actual fight14 screenshot, traps placed between the existing fighters.
- `preview_trap_loss.jpg`: 1440 × 540, three-step Frank sequence on a crop of that same screenshot. Approach → loss event with jaws composited in front of his lower leg → approved peg-leg frame walking away, leaving the trap behind.
- `work/open_source.jpg`, `work/sprung_source.jpg`: unmodified supplied JPEGs.
- `work/cut.py`: reproducible Pillow processing and previews.
- `work/edge_proof.jpg`: 920 × 340, darker alternate parchment for checking transparency.
- Existing `work/world_ref.png` and `work/bg_ref.png` preserved.

## Registration
Both sprites share source coordinates, scale and a 440 × 304 canvas. Pivot/ground anchor: **(220, 304), bottom centre**; do not trim each independently. Main iron feet sit roughly 32 pixels above the anchor, while loose stones/grass extend to the ground anchor. At gameplay preview width 160 px, the canvas height is 111 px. Keep the same anchor, draw width and ground line when swapping states.

Edge-connected paper is flood-filled against ink contours; jaw-loop background pockets are additionally opened explicitly. Remaining isolated ink uses a decontaminated dark matte, avoiding a pale rectangular paper patch. Opaque iron retains the original parchment tint. Dust-cloud interiors and loop interiors are transparent; their ink outlines remain.

Frank uses the documented cell/pivot (512 × 512, 256,475) at constant 0.60 scale, original frame 0, v2 `frank_lose_leg.png`, then frame 0 of v1 `frank_no_leg.png`. No character is auto-trimmed. The trap is drawn after the event sprite, putting its jaws in front of his leg.

## Review caveats
These are static timing/layout proposals, not an implemented animation. Frank's existing event frame is a cut-out recoil with unchanged expression. The supplied sprung drawing has a small central jaw gap and no grail; this source geometry is retained. Some fine grass/ray hatching is delicate at small gameplay sizes. Ground pebbles retain a little internal parchment, intentionally; no broad exterior paper halo was visible on the darker proof. The two supplied views are not mechanically identical projections, so a short snap transition is preferable to a smooth morph. Magnus has not approved this v3 yet.
