// v18 (Magnus, medieval-math-riddles-v18 START_HERE): wiring for tools/import_v18.py's KM_ART18.
//  * friendly-coif = recruitable companion look #5 (follower_5): walk 12 x 100 ms + idle 8 x 300 ms (512 cells, pivot
//    [256,480]); attack / hurt / death held drawings (768 cells, pivot [384,680]). Each clip is its own sequence with its
//    own cell + pivot (never one box); per-clip calibration 1.0 (heads already match, see the importer). Drawn at the
//    ONE artScale like every atlas. Walk plays at the pack's 100 ms (rate 1): its root motion (~60 atlas px/s) is slower
//    than the road, so his feet slide a little (reported; matching the road would need 4.4x playback).
//  * riddle keeper + rock: two separate layers, background -> keeper -> rock -> UI. The keeper is static (one drawing).
//    EXCEPTION to the global scale (reported): both at artMul 0.386 = the coif's atlas density (atlas/source 0.386),
//    i.e. the same painted density as the coif they were drawn beside in the pack preview. At plain artScale he would
//    stand ~755 stage px tall, taller than the 655 px road.
(function () {
  const A = window.KM_ART18, A7 = window.KM_ART7; if (!A || !A7) return;
  const E = KM_ART.entities, set = (id, o) => { E[id] = Object.assign({}, E[id] || {}, o); };
  // v12b EXCEPTION (Magnus, explicit request 2 Nov 2026: "one friendly night with a chaoin mail helmet that is the wrong
  // size"): the coif's atlases are painted smaller than the other companions. Measured visible height (alpha bbox, idle,
  // layout units): hero 534, follower_1..4 476 / 547 / 513 / 499 (mean of all five 514), coif 415 -> artMul 1.24 = 514.
  // One factor for the whole entity: idle, walk, attack, hurt, death, and standing in the tavern / recruit lineup.
  const COIF_MUL = 1.24;
  Object.entries(A.coif).forEach(([clip, c]) => { A7.sequences[clip + "_coif"] = { img: c.img, cell: c.cell, pivot: c.pivot, standTop: c.standTop, loop: c.loop, frames: c.frames, mul: c.mul, status: "v18 friendly-coif " + clip }; });
  set("follower_5", { img: undefined, anchor: undefined, top: undefined, art: null, seq: { idle: "idle_coif", walk: "walk_coif", attack: "attack_coif", hurt: "hurt_coif" }, deathSeq: "death_coif", walk: "coif", artMul: COIF_MUL, status: "v18 friendly-coif (Magnus, riddles-v18)" });
  KM_DATA.party.skins = 5;
  const KEEPER_MUL = 0.386;
  set("bridgekeeper", { img: A.keeper.img, anchor: A.keeper.anchor, top: A.keeper.bbox[1], artMul: KEEPER_MUL, front: "keeper_rock", static: true, status: "v18 riddle-keeper (Magnus)" });
  set("keeper_rock", { img: A.rock.img, anchor: A.rock.anchor, top: A.rock.bbox[1], artMul: KEEPER_MUL, box: { w: 1, h: 1 }, status: "v18 rock occluder (Magnus)" });
  KM_ART.ui.answerFrame = { img: A.answerFrame.img, size: A.answerFrame.size };
})();
