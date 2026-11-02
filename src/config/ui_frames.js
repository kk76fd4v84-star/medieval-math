// v12q (Magnus: "all other buttons that show up below I want to have that frame you have done now"): Maggi's ornamented
// ink button frame (assets/ui/tavern_ui_v1/, README.md there) for every strip button (.opt.plaque). Horizontal-only
// 9-slice: the caps keep their size, only the middle stretches; height fixed per button size (uniform scale of 90 px).
// game.js copies these into CSS variables at boot; style.css does the rest (no per-button code).
window.KM_UI = {
  frame: {
    root: "assets/ui/tavern_ui_v1/",
    normal: "button_frame@2x.png", hover: "button_frame_hover@2x.png", disabled: "button_frame_disabled@2x.png",
    slice: [75, 124],          // @2x source px: top/bottom, left/right
    border: [38, 62],          // 1x px at the frame's own 90 px height (scaled with the button height in CSS)
    h: 90,                     // the frame's 1x height
    // v12r (Magnus): label (text + icons) lift, as a fraction of the button height, so it sits optically centred
    // between the frame's top and bottom ink lines (Georgia sits low in its line box). 0 = plain box centre.
    labelLift: 0.036
  },
  // v12r (Magnus: "the buttons are outside of frame"): a row of move buttons (.opts.moves) never shrinks a button below
  // label + icon + both caps (the text stays out of the flourishes) and always fits inside the strip with `margin` px
  // each side. game.js fitMoves() tries each single-row height in turn; if none fits, the row splits into two centred
  // rows at twoRowH (attacks on top, items / specials below, at the .brk marker) and the prompt shrinks to twoRowPrompt.
  moves: { heights: [84, 70], twoRowH: 58, margin: 24, font: 0.405, icon: 0.45, spell: 0.55, twoRowPrompt: 34, rowGap: 6 }
};
