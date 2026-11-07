// ===== LAYOUT: the one place to tune the screen split =====
// Stage is a fixed 1600x900 scaled to fit the window.
//  - SCENE (top): scrolling world, characters, art and ALL dialogue as speech bubbles above the speaker (v11).
//  - STRIP (bottom): the carved sum, a few large key options, and the icon status row (hearts, gold, hunters, distance).
// Positions (feet lines, x slots) are in a 900-unit layout grid: unit -> stage px = k = scene.h / artSpaceH.
// ART SIZE (v8, Magnus): every image is drawn at its SOURCE pixels times ONE global factor, artScale:
//   stage px = source px x artScale   (no per-layer / per-character / per-prop / per-pose factors anywhere).
// L.art = artScale / k converts source px into layout units, so k never changes an image's size.
window.KM_LAYOUT = {
  stage: { w: 1600, h: 900 },
  // v11b (Magnus: "the area below the feet where the math is could be less tall"): scene 600 -> 660 stage px, strip
  // 300 -> 240. k stays 2/3 (artSpaceH grows with it), so every image keeps its exact size (source px x artScale); all
  // authored y positions moved down by LIFT = 90 layout units (= 60 stage px): the ground is lower, the sky taller.
  scene: { x: 0, y: 0, w: 1600, h: 660 },
  // v11b QUESTION FOR MAGNUS (off by default = every image stays source px x artScale): the v8 rest scenes (1774x887
  // canvas) and the tavern facade are painted at a SMALLER pixel scale than the characters, so at artScale they read as a
  // small box / a doll's house. viewFit "cover" = the interior's room (canvas top .. its floor line) fills the scene edge
  // to edge: x1.832 artScale (1.099 stage px per source px), centred, ~175 stage px cropped each side. buildingMul =
  // an extra factor for the tavern facade only (1.832 = same pixel scale as the "cover" interior). Preview without
  // editing: index.html?viewFit=cover&buildingMul=1.832
  viewFit: "artScale", buildingMul: 2.6,
  artScale: 0.6,                           // THE global factor: source px -> stage px for ALL art (see README "v8")
  artSpaceH: 990,                          // height of the layout grid (v11b: 900 + LIFT 90; k = 660 / 990 = 2/3 unchanged)
  dividerH: 46,                            // v11b: band at the top of the strip holding Magnus's divider (ground line + 26.5 px, ornament ~49 px tall)
  // v11 speech bubbles (stage px): big font, short lines, long text split into several bubbles shown one after another
  speech: { font: 30, lineH: 36, maxW: 460, maxLines: 2, padX: 20, padY: 12, minSecs: 2.2, perChar: 0.06, maxSecs: 5.5 },
  touchPad: false                          // on-screen 0-9 pad + operator row (off: keyboard only; for a future phone build)
};
(function (L) {
  L.k = L.scene.h / L.artSpaceH;           // scene px -> stage px
  L.viewW = L.scene.w / L.k;               // visible width in scene px
  L.art = L.artScale / L.k;                // source px -> layout units (= artScale in stage px)
  L.strip = { x: 0, y: L.scene.y + L.scene.h, w: L.stage.w, h: L.stage.h - L.scene.h - L.scene.y };
})(window.KM_LAYOUT);

// v11b preview switches (see viewFit above): ?viewFit=cover&buildingMul=1.832
(function () { try { const q = new URLSearchParams(location.search); if (q.get("viewFit")) KM_LAYOUT.viewFit = q.get("viewFit"); if (q.get("buildingMul")) KM_LAYOUT.buildingMul = +q.get("buildingMul") || 1; } catch (e) {} })();
