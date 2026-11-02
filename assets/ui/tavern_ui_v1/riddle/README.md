# Riddle question frame v1 (Maggi)

Built from the same riddle-frame ink pieces, at the same 0.25 source scale, as `tavern_ui/v1/button_frame.png`. On stage, the stroke (~2 px at 1x) and the corner flourishes (62×40) are identical to the 300×90 answer buttons, so the frame and buttons read as one set. It is NOT the thin riddle-frame.png look. No text is baked in.

## Files (transparent PNG)
| file | 1x | @2x | notes |
|---|---|---|---|
| riddle_question_frame(.png / @2x.png) | 900×130 | 1800×260 | **default**: hollow leaves, matches the normal answer buttons |
| riddle_question_frame_filled | 900×130 | 1800×260 | same, plus a subtle parchment fill inside (rgba(240,228,200,0.55)). Use it if the question sits on a busy/stained background |
| riddle_question_frame_accent / _accent_filled | 900×130 | 1800×260 | orange leaves + dots (like button hover / divider). Optional; may read as "selected" next to the answer buttons |
| mockup_riddle.jpg | 1600×640 | | the riddle screen redone: question frame + answers in button_frame (A towel = hover) + 3-line stretch test (filled version) |

## 9-slice
- Slice margins: **1x: top 40, right 62, bottom 40, left 62**. **@2x: 80 / 124 / 80 / 124**.
- Corners (62×40 at 1x) never stretch. Top/bottom edges are a plain ink line, so stretch or repeat both work. Side edges are a plain vertical line, so stretch. The centre is empty (or the uniform fill in `_filled`).
- No side diamonds are in the stretched zones. The diamonds/dots only live in the corner flourishes, so stretching in both directions is safe.
- **Min size:** 124×80 at 1x (corners touching). Use ≥ 300×100 in practice.
- **Text-safe area:** inset 64 px left/right and 20 px top/bottom (1x). For 900×130 that is x 64–836, y 20–110 (772×90): 1 line, or 2 lines of Georgia 36–40 px at line-height 1.15. For 3 lines use height ≈ 200 (tested in the mockup).

## CSS
```css
.riddle-question{
  width:900px; min-height:130px; box-sizing:border-box;
  border-style:solid; border-width:40px 62px;          /* = 1x slice margins */
  border-image:url(riddle_question_frame@2x.png) 80 124 fill / 40px 62px stretch;
  /* or riddle_question_frame_filled@2x.png for the parchment fill */
  padding:0 2px; margin:0 auto;
  display:flex; align-items:center; justify-content:center; text-align:center;
  font:40px/1.15 Georgia,serif; color:#1b1410;
}
```
CSS keeps the content inside the 40 px border. At 130 high the content box is 50 px (one line). Two or three lines just grow the box (it stays a clean 9-slice). If you want two 40 px lines without growing, draw the text over the frame (canvas/absolute) inside the text-safe area above, or use `border-width:20px 62px` with `border-image-outset:20px 0`.

Answers: use `tavern_ui/v1/button_frame*.png` (margins 62/38 at 1x), height 84–90, as in the mockup.

work/ holds qframe.py (builder: `make(w,h,state,filled,scale)` renders any size directly) and mock.py.
