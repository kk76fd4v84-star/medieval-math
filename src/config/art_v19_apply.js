// v19 (Cobra art audit, AUDIT_ART.md): wiring for tools/import_v19.py's KM_ART19. Rules followed (root GAME_DESIGN.txt,
// MEDIEVAL_MATH_HANDOFF.txt, v8 ENGINE_IMPORT.txt, v3/v5/v6 READMEs):
//  * every clip = its v8 atlas cells + per-frame durationMs, hard pose changes, no loop, no tweening (ENGINE_IMPORT 5);
//    drawn at the ONE artScale (mul 1: ENGINE_IMPORT 7/10 forbid per-pose downscaling; no per-clip calibration is
//    required by these docs, unlike the v18 coif);
//  * MEGA BOSS dragon = the v6/v8 dragon-sequence: stands as its last drawing (mouth closed, victim gone) and plays all six
//    drawings when it eats a member ("Large creatures may abruptly eat/kill a member"; "Eating: caught in mouth -> brutal
//    bite -> tossed upward -> folded catch -> boots disappear -> final closed mouth and crunch. Hide victim.");
//    the composite sheets have the victim baked in (v6 README), so the victim's own sprite is hidden while it plays;
//  * toad / ogre: the two other large-creature eating sheets, as road enemies (TEMP placement, src/data/encounters.js);
//  * killer rabbit kills = the rabbits-flat-blood sequence ("Rabbit death: swarm/latch -> opposing pulls -> torn apart ->
//    pieces land -> aftermath"), drawn where the victim stood, aftermath held like a corpse;
//  * the King's hunters' capture = the arrow variant of the approved death ("keeps arrows anchored to wounds");
//  * background dragon (GAME_DESIGN PARALLAX + SPECIAL ENCOUNTERS, v3 README): the "small monochrome snake dragon on a
//    SIMPLE rounded hill" strip replaces one tile of the mid scenery row (v3 layer-stack: midCreature), placed so it sits on its hill when Frank
//    stops the party ("A small creature is visible sitting on a simple hill... Frank proposes approaching it"); after a
//    commit it leaves the hill and comes closer as dragon-colour-cutout ("moves closer, gains muted colour").
(function () {
  const A = window.KM_ART19, A7 = window.KM_ART7; if (!A || !A7) return;
  const E = KM_ART.entities, set = (id, o) => { E[id] = Object.assign({}, E[id] || {}, o); };
  Object.entries(A.sequences).forEach(([k, s]) => { A7.sequences[k] = s; });
  const creature = (id, n, status) => set(id, { img: undefined, anchor: undefined, top: undefined, art: null, seq: { idle: n + "_idle" }, eatSeq: n + "_eat", status });
  creature("dragon", "dragon", "v8 dragon-sequence (MEGA BOSS): idle = drawing 6, eating = drawings 1-6");
  creature("toad", "toad", "v8 toad-sequence: idle = drawing 6, eating = drawings 1-6");
  creature("ogre", "ogre", "v8 ogre-sequence: idle = drawing 6, eating = drawings 1-6");
  ["ogre_idle","ogre_eat"].forEach(id=>{ A7.sequences[id].img="assets/v19/sequences/ogre-sequence-clean.png"; });
  E.ogre.artMul = 1.85; // Same scale for idle, attacks, eating, bounds and HP anchors.
  E.toad.box = E.toad.box || { w: 300, h: 260, color: "#6a7a3a", label: "TOAD" }; E.ogre.box = E.ogre.box || { w: 300, h: 360, color: "#8a7a5a", label: "OGRE" };
  Object.assign(E.dragon,{img:"assets/bosses/mud-dragon-coiled.png",anchor:[700,1161],top:13,seq:null,eatSeq:null,artMul:1.08,sayAt:[-400,-600],status:"Three-headed mud dragon final boss"});
  set("turd_dragon", { img: A.colourDragon.img, anchor: A.colourDragon.anchor, top: A.colourDragon.top, art: null, onHill: true, status: "v3 dragon-colour-cutout (close reveal of the hill dragon)" });
  // killer -> brutal death. at "killer": the killer's own sheet plays (victim baked in, victim hidden); at "victim": the
  // composite plays where the victim stood and its last drawing is held as the corpse.
  KM_ART.brutal = {
     toad: { seq: "toad_eat", at: "killer" }, ogre: { seq: "ogre_eat", at: "killer" },
    killer_rabbit: { seq: "rabbits_tear", at: "victim" }, hunters: { seq: "knight_arrow_death", at: "victim" }
  };
  // the hill dragon strip: a back-layer parallax strip like the others (offline ink for the parchment tint)
  A7.parallax["dragon-hill"] = { img: A.hill.img, size: A.hill.size, bbox: A.hill.bbox, dragon: A.hill.dragon };
  if (window.KM_ART10 && KM_ART10.ink) KM_ART10.ink[A.hill.img] = { img: A.hill.ink, paper: A.hill.paper };
  // v3 layer-stack.json + preview: the distant creature strip is the MID layer (z 3, "midScenery/midCreature", parallax
  // 0.3) in front of the back hills and the rear mist; so it replaces one tile of the mid row (not the 0.08 back row)
  KM_DATA.scenery.mid.swap = { strip: "dragon-hill", stop: "frank", screenX: 2050 };
  // pack animations that are deliberately NOT drawn, with the handoff's own reason (tests/packanims.test.js checks that
  // every pack animation is either wired above / by earlier importers or listed here)
  KM_ART.packUnused = {
    "medieval-math-production-v8/atlases/legacy-parts-attack.png": "v8 README/manifest: LEGACY technical reference, earlier helmet, 'not approved final hero'",
    "medieval-math-production-v8/atlases/knight-eaten.png": "v5 README: separate victim poses for a LAYERED jaw rig; 'dragon jaw artwork NOT included' -> the composite dragon/toad/ogre sheets are used instead",
    "medieval-math-death-sprites-v5/eaten": "same six victim poses as knight-eaten.png (needs the missing jaw layers)",
    "medieval-math-creatures-v6/rabbits": "superseded by rabbits-flat-blood (GAME_DESIGN: flat dark brick-red blood; v8 atlas ships only the flat-blood sheet)",
    "medieval-math-encounter-pack-v3/exports": "v3 D20 sheets superseded by the v8 dice (v8 README: 'older v3 sheets are superseded for dice')",
    "medieval-math-animation-pack-v2/exports": "whole-sprite breathing/sway loops at 320x384 export size of pre-lock art (README: 'Rig images predate locked art'); drawing them would change the cutouts' size (artScale rule) - ask Magnus",
    "medieval-math-combat-v4/knight-combat-clips.json": "rig attack/hit/death clips on the older rig art; GAME_DESIGN: 'Do not substitute puppet falls'",
    "medieval-math-combat-v4/enemy-motion.json": "whole-cutout rotate 'death' profiles (puppet falls, forbidden by GAME_DESIGN)",
    "pack_v13/medieval-math-walks-v13/parts": "rig parts behind the baked v13 walk atlases (atlases are used)",
    "magnus_zip_1101/medieval-math-riddles-v18/animation/parts": "rig parts behind the baked v18 coif atlases (atlases are used)"
  };
})();
