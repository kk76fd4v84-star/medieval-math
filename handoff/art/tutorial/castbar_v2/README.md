# Cast bar tutorial v2
PIL only, ZERO generations. v1 untouched. Removed all supplemental copy below four icon rows. Shortened/rebalanced panel, with single Onward! button beneath.

## Files
- tutorial_frame.png: 1100×670 RGBA, transparent outside rounded frame.
- mockup.jpg: 1600×900, panel at (250,115) on game parchment.
- work/build.py: composer, reads exact game art retained in v1/work/current_play/assets.

## Exact displayed text for programmer
Title: Read the cast bar
Subtitle: Answer correctly. Where you stop changes the hit.
Mini bar captions: Earlier / Later
Rows:
1. Block: will block next incoming damage and crit.
2. Crit: double damage.
3. Normal: full damage.
4. Weak: half damage.
Button: Onward!

Block wording copied verbatim from Magnus's requested string, not rephrased or treated as a new verified code behaviour. Other three rows retain v1 wording. No counterattack sentence, Enemy tricks text, pressure tags, or trail sentence remains. This is visual copy revision, not combat-code integration.

## Integration
Button rectangle in panel coordinates: x400 y550 width300 height90. Title Gelasio semibold 44; subtitle 27; four rows 30; button 34. Icons are actual shipped timing-woodcut/{block,crit,normal,weak}.png; mini-bar uses shipped track.png/fill.png, unchanged baseline endpoints. Original art provenance is latest play commit 32f804f1c4b37aab45287d09c4f63436e904050b, as documented in v1. No new pull or game edits needed for this copy/layout change.
