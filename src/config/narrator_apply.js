// v11b (Magnus): the narrator = his orange-hooded skeleton leaning on a rock (tools/import_narrator.py -> KM_NARRATOR).
// Replaces the "Little Dragon" stand-in box. ONE global artScale like everything else (no exception): his skull is
// 178 source px wide -> 107 stage px, the knight's bucket helm ~103 stage px in play (ratio 1.04). The rock is part of
// the drawing; the pivot is the rock's base, standing ON the ground line. sayAt = top of his skull (bubble tails aim there).
(function () {
  const N = window.KM_NARRATOR; if (!N) return;
  // v12b EXCEPTION (Magnus, explicit request 2 Nov 2026: "The skeleteon narrator in the begining should be the same size
  // as the knights"): artMul 0.55. He stands behind his rock, so hood top -> rock base is his standing height: 998 -> 549
  // layout units vs the hero knight's 534 (companions 476-547). His skull becomes ~59 stage px wide, the size of the
  // companions' skull faces (the bucket helms are bigger than the heads inside them).
  const MUL = 0.55; N.mul = MUL;
  KM_ART.entities.narrator = { img: N.img, anchor: N.anchor, top: 4, art: null, anims: {}, static: true, artMul: MUL,
    box: { w: N.size[0] * KM_LAYOUT.art * MUL, h: N.size[1] * KM_LAYOUT.art * MUL }, // only until the image has loaded
    sayAt: [N.skull.cx - N.anchor[0], N.skull.top - N.anchor[1]], status: "Magnus narrator_skeleton_rock.png (v20)" };
})();
