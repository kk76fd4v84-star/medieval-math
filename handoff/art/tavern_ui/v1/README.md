# Tavern UI v1 (Maggi) – hanging sign + ornamented button frames

Style: woodblock ink on parchment, black ink plus the game's orange (196,98,40). No baked text anywhere.
The frame line work is cut straight from riddle-frame.png, so it matches the riddle frame and divider exactly.

## Sign
| file | size | notes |
|---|---|---|
| tavern_sign.png | 637×875 RGBA | plain weathered board, iron bracket + chains, transparent bg |
| tavern_sign_framed.png | 637×875 | optional variant: the thin ornamented ink frame inset on the board |
| tavern_sign_mockup.png / tavern_sign_framed_mockup.png | 637×875 | example only (Mead / Stew / Fire bottle, Georgia-style font, 72px icons) |

- Board area: x 55–615, y 242–865 (bracket/chains above it).
- **Text-safe rect (plain):** x 95–575, y 320–800 (480×480).
- **Text-safe rect (framed):** x 125–545, y 350–770 (420×420).
- In the 1600×900 scene it is drawn at scale ≈0.36 at (172,56) → about 230×315 on stage. At that size, use menu text of about 22–24px with 26px icons. Dark ink text (#1b1410) on the pale board reads best.

## Button frame (ornamented ink, like riddle-frame / divider)
States: `` (normal), `_hover` (hover/selected: orange leaves, orange diamond cores and dots), `_disabled` (faded ink (118,106,94) at 55% alpha).
Each state comes at 1× and @2x (use @2x for crispness, drawn at half size).

| piece | 1× | @2x |
|---|---|---|
| button_frame{state}.png (full 9-slice source) | 300×90 | 600×180 |
| button_cap_left{state}.png | 62×90 | 124×180 |
| button_mid{state}.png (tileable/stretchable) | 50×90 | 100×180 |
| button_cap_right{state}.png | 62×90 | 124×180 |

**9-slice margins (1×):** left 62, right 62, top 38, bottom 38 (@2x: 124 / 124 / 75 / 75).
- Stretch **horizontally only**: draw the left cap and the right cap at fixed width, and stretch or tile the middle (mid piece, or frame x 62–238).
- Keep height fixed (90 at 1×; the game's 84px plaque is fine as a uniform scale of 0.93). The vertical middle (about 14px) holds the side diamonds, so a vertical stretch distorts them. If you need it taller, scale the whole thing uniformly.
- Content-safe inner area: x 62 … w-62, y 22–68 (1×). Icons + label + purse/price go there.
- CSS option: `border-image: url(button_frame@2x.png) 75 124 fill / 38px 62px stretch;` with the matching hover/disabled images (or `filter`-free swaps).
- Hover in the mockup: frame_hover + 2px lift + orange underline under the label. Disabled: frame_disabled + greyed text/icons (the frame is already faded, so don't also apply opacity .35 or it vanishes).

## Previews
- mockup_tavern_ui.jpg – after_default.png with the new sign replacing the old menu, and the new frames on the 3 buttons (Mead = hover, Stew = normal, Fire bottle = disabled).
- button_states_preview.png – the 3 states at 300 wide and stretched to 440 wide.

work/ holds the build scripts (frame.py, sign_mock.py) and sources.
