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
    h: 90                      // the frame's 1x height
  }
};
