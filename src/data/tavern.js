// v12o tavern interior layout (Magnus: "There are actual knight sitting sprites and a bar. Improve this scene").
// Pure data, read by drawTavernInside / tvSpots in src/game.js (Godot: one scene resource).
// Units: x / back / keeperAt are LAYOUT units (900-unit grid like world.js; stage px = layout x 2/3).
// Sizes: every image is drawn at its source px x KM_LAYOUT.artScale x the mul named here (no other factors).
window.KM_DATA = window.KM_DATA || {};
KM_DATA.tavernRoom = {
  // Magnus's v8 tavern layers (1774x887 canvases, paper-graded v10 copies via KM.RestView.img). They are painted at a
  // smaller pixel scale than the characters, so the room props share ONE extra factor (like buildingMul for the facade),
  // chosen so the stool seats meet the seated poses' hips. crop = [x, y, w, h] in the layer's source px.
  propMul: 1.1,                // v12p: 1.4 -> 1.1 with the smaller sitters (bar stool seat ~14 layout px above the feather hip, hidden behind him; low stool ~9 under the kettle-hat's)
  props: {
    counter:  { img: "scenes/tavern-foreground.png", crop: [815, 242, 703, 333] }, // the bar counter with its barrels + mug
    barStool: { img: "scenes/tavern-bar-seats.png",  crop: [1028, 426, 112, 148] },
    lowStool: { img: "scenes/tavern-seats.png",      crop: [96, 455, 105, 112] }
  },
  // the counter stands against the back wall under the mug shelf; back = how far its foot line is above the ground line
  bar: { x: 1470, back: 46 },
  // recruit seats in front of the bar, by number of recruits (left to right); back = depth of their foot line
  seats: { 1: [1380], 2: [1170, 1740], 3: [1110, 1470, 1830] },
  seatBack: 10,
  // Magnus's seated poses (KM_ART11.seated). v12p (Magnus: "they look too big, compared to the player"): mul is set by
  // BODY size against the hero as drawn (hero 533 layout tall): 0.52 / 0.5 -> 0.42 / 0.44, so a sitter's head top is ~0.9
  // of the hero's height (a person on a stool). The seated drawings have smaller heads per body than the walk sheets, so
  // their helmets are then ~75-80 % of the hero's (head-matched they would be ~120 % of his height);
  // hip = source row the seat meets; seatX = source column of the seat centre; foot = source row of the soles.
  // A skin without a seated pose stands at its seat by the bar, facing the party.
  sitters: {
    feather: { mul: 0.42, hip: 1030, seatX: 470, foot: 1378, stool: "barStool" },
    scarf:   { mul: 0.44, hip: 880,  seatX: 520, foot: 1182, stool: "lowStool" }
  },
  hotspotW: 360,               // layout units: click / highlight width around a STANDING recruit (a sitter's is his drawing)
  keeperAt: [1470, 330]        // the barkeep's voice (no barkeep art yet): behind the bar, under the mug shelf
};

// v12q (Magnus: "I want the wall menu to look like that and there is where that menu is"): Maggi's hanging sign
// (assets/ui/tavern_ui_v1/tavern_sign.png, plain variant: more room for text) IS the menu. Mead / Stew / Fire bottle are
// the clickable lines on its board (icon, name, purse + price), Georgia in dark ink. Stage px here (README numbers).
KM_DATA.tavernRoom.sign = {
  root: "assets/ui/tavern_ui_v1/", img: "tavern_sign.png", size: [637, 875],
  atStage: [158, 48],          // top-left on the 1600x900 stage (README: (172,56) at 0.36; nudged left/up for the bigger scale)
  scale: 0.39,                 // stage px per sign px (README 0.36; +8 % so "Fire bottle" + price fit at a readable 23 px)
  safe: [95, 320, 480, 480],   // text-safe rect on the board (sign px)
  pivot: [335, 100],           // the chains hang from the bracket bar here: the board swings about it, the bracket stays put
  fixed: [[0, 0, 637, 100], [0, 100, 56, 152]], // the bracket (bar + wall plate): never swings
  font: 23, icon: 30, gap: 8, purse: 20,   // stage px
  ink: "#1b1410", off: "#9a8e80", lit: "#c46228", underline: 3,
  icons: { mead: "icon_mead.png", stew: "icon_stew.png" }, // Maggi's keyed mug + bowl; the fire bottle uses its item icon
  swing: { deg: 5, period: 0.8, tau: 0.36, dur: 1.5 }      // a buy (or a refused one) knocks the board
};

// Tavern recruit cards (Magnus: "larger cards so you see what they can do"). Pure data, read by recruitCard in src/game.js.
KM_DATA.recruitCards = {
  title: "Choose one companion from this tavern.",
  roles: {
    knight:      { title: "Knight",      attack: "Answers + sums. Cleaves two foes." },
    priest:      { title: "Priest",      attack: "Answers − sums. Heals the party." },
    firestarter: { title: "Firestarter", attack: "Types fire words. Burns every foe." },
    executioner: { title: "Executioner", attack: "Answers × sums. Finishes wounded foes." },
    darkWizard:  { title: "Dark Wizard", attack: "Answers × sums. Strikes every foe." }
  }
};
