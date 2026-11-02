// v12o tavern interior layout (Magnus: "There are actual knight sitting sprites and a bar. Improve this scene").
// Pure data, read by drawTavernInside / tvSpots in src/game.js (Godot: one scene resource).
// Units: x / back / keeperAt are LAYOUT units (900-unit grid like world.js; stage px = layout x 2/3).
// Sizes: every image is drawn at its source px x KM_LAYOUT.artScale x the mul named here (no other factors).
window.KM_DATA = window.KM_DATA || {};
KM_DATA.tavernRoom = {
  // Magnus's v8 tavern layers (1774x887 canvases, paper-graded v10 copies via KM.RestView.img). They are painted at a
  // smaller pixel scale than the characters, so the room props share ONE extra factor (like buildingMul for the facade),
  // chosen so the stool seats meet the seated poses' hips. crop = [x, y, w, h] in the layer's source px.
  propMul: 1.4,
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
  // Magnus's seated poses (KM_ART11.seated). mul = head matched to the walk sheets (v11b measurements, kept);
  // hip = source row the seat meets; seatX = source column of the seat centre; foot = source row of the soles.
  // A skin without a seated pose stands at its seat by the bar, facing the party.
  sitters: {
    feather: { mul: 0.52, hip: 1030, seatX: 470, foot: 1378, stool: "barStool" },
    scarf:   { mul: 0.5,  hip: 880,  seatX: 520, foot: 1182, stool: "lowStool" }
  },
  hotspotW: 360,               // layout units: click / highlight width around a STANDING recruit (a sitter's is his drawing)
  keeperAt: [1470, 330]        // the barkeep's voice (no barkeep art yet): behind the bar, under the mug shelf
};
