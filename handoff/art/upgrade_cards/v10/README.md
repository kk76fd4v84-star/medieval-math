# Upgrade cards v10 — review only, not installed

Based on approved v9. No v9 or older files changed. Exactly THREE image generations: Thunder Fist, Rallying Cry, Weighted Axe, one each. All layout, masking, type, assembly and contact sheets made in Pillow.

## Files
All eight final cards are 600×900 transparent RGBA PNGs:
- cleave.png
- swing_and_a_miss.png
- embers.png
- shield_wall.png
- thunder_fist.png
- high_voltage.png
- rallying_cry.png
- weighted_axe.png

Each has an additional `<name>_text_free.png` counterpart, retaining its illustration, portrait, frame and caution icon, without title/owner/effect/cost text. V9 did not supply individual text-free cards; these are extra conveniences.

- sheet.jpg: 2480×1840, all eight cards, four columns/two rows.
- sheet_50pct.jpg: 1240×920 review sheet.
- layout_safe_boxes.png: labelled slot guide.
- work/build.py: reproducible Pillow assembly; work/text_fit_checks.json: per-line glyph bounding boxes and font sizes; work/: source generations, reference sprite cells, source crops and cutouts.

## Preserved layout and LEVEL slot
600×900 v9 base, Gelasio variable font, existing ornamental header, framed tomb portraits, deckled alpha silhouette, ornamented divider and printed textured near-black cost half. Banner 150px, reward and cost halves 375px each. Art always contained within x=115..485, y=170..365 (370×195), with paper keyed out for generated art, no rectangular backing.

Owner line: (184,105)-(525,123). Game-owned EMPTY LEVEL slot: **(204,128)-(505,147)**, width 301, height 19 pixels, right/bottom exclusive. Draw LEVEL 2/5 centered here, e.g. Gelasio 14–15px, ink #140E0A. No level text is baked into any PNG. This slot is empty paper, clear of the portrait badge and banner baseline.

Title box (184,30)-(516,90); effect box (58,380)-(542,505); cost box (58,680)-(542,829). Exact requested wording retained. Generic caution diamond replaces obsolete arithmetic cost glyphs. Existing four v9 illustrations and Overcharge illustration are copied directly from final card pixels without regeneration. Knight, firestarter and wizard tomb portraits/frames reused. No executioner tomb portrait exists in supplied tomb sheet: Weighted Axe uses its actual party-sprite head cutout inside the same reused frame; no generated portrait.

## Inspection / weak spots
Every final card opened with Read and visually checked; text fits without overflow. Automated actual-glyph bounds assertions also pass. All illustration tiles remain inside the common art field. Wide action scenes naturally have smaller figures than tall armour/axe/fist scenes, as in v9; the axe's vertical silhouette is narrower within the same field (not stretched).

- Shield Wall's reused armour-on-stand scene is thematic rather than an exact picture of blocking the first attack. This is the weakest old-art/text match. Not regenerated as instructed.
- Cleave still illustrates two enemies, not the third unlocked later. Swing's rear ally remains standing rather than visibly losing health. Both old art pieces intentionally reused.
- High Voltage's reused rear spark can read as the ally casting rather than receiving a shock; retained, not regenerated.
- Thunder Fist is an especially bold black fist with orange lightning cracks; it may read as a solid fist infused with lightning rather than entirely made of electricity. Visually heavier than the finer existing scenes.
- Rallying Cry shows the knight shouting with raised sword while the party advances, but his open face/helmet differs somewhat from the fully closed bucket-helmet card portrait, and he is at the rear of the group. No extra generation spent.
- Weighted Axe's sprite-derived portrait is not a tomb painting; its hood/shoulder crop is a pragmatic reuse within the old tomb frame.
- The supplied codex has progression inconsistencies with the requested short text (Cleave's third-target timing, Shield Wall and Thunder Fist max upgrades). These cards follow the explicit exact card text, not inferred numerical changes.

Await Magnus's own approval before game integration.
