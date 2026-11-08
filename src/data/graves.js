// Graves of past deaths. Every death is remembered (see KM.Save.profile) and shows up as a grave
// on the road in later runs, at the spot where it happened. Edit the jokes freely.
window.KM_DATA = window.KM_DATA || {};
KM_DATA.graves = {
  max: 20,              // how many deaths are remembered (oldest dropped first; the furthest is always kept)
  ahead: 260,           // grave sits this far (road px) in front of where the hero stood when he fell (v12g: on the ground line)
  respectAt: 520,       // v12g: the party halts this far before the grave to pay respects (grave just in front of the hero)
  merge: 240,           // deaths closer than this share one grave stop (stacked stones)
  respectsSecs: 2.4,    // how long the party stops to pay respects
  stopToRespect: false, // Magnus 2026-11-08: the party no longer stops and bows at crosses (true brings it back)
  // {name} = the fallen player's name, {d} = leagues. Bark is one line in the scene; full text goes to the strip.
  epitaphs: [
    "Here lies Sir {name}. Died at {d} leagues. Probably doing long division.",
    "Sir {name}. Carried the one. Dropped it. ({d} leagues)",
    "R.I.P. Sir {name}. {d} leagues. Forgot to borrow from the tens.",
    "Here lies Sir {name}. Insisted 7 times 8 was 54.",
    "Sir {name}. {d} leagues. Thought the riddle was optional.",
    "R.I.P. Sir {name}. Slain by a remainder.",
    "Sir {name}. Brave. Bold. Off by one. ({d} leagues)",
    "Here lies Sir {name}. Counted on fingers. Ran out of fingers."
  ],
  respects: ["*bows*", "Rest well, tin can.", "*kneels solemnly*", "Poor sod.", "*removes bucket*"],
  // v7: once per run, when the journey passes the previous BEST distance: a scene toast (GAME_DESIGN wording)
  // + the bard/narrator line in the strip + voice clip (chat request).
  further: { who: "Narrator", text: "Further than ever before!", vo: "vo_further_than_ever",
             toast: "You're venturing further than you ever have, you clever thing.", toastSecs: 4.5 },
  // v7: graves stand on the hill (mid layer) just BEFORE the encounter where the knight fell
  before: 700,          // camera px before that encounter's halt where the party stops to pay respects
  // killer -> grave marker entity (emblem art: rabbit, dragon, goblin, toad; the rest are labelled boxes = MISSING ART)
  markers: { killer_rabbit: "grave_rabbit", dragon: "grave_dragon", goblin: "grave_goblin", toad: "grave_toad", ogre: "grave_goblin", /* v6 graves: the 4th emblem was meant as the ogre ("goblin-like, not an accurate ogre portrait") */
             skeleton_knight: "grave_skeleton_knight", black_knight: "grave_black_knight", hunters: "grave_hunters", turd_dragon: "grave_turd_dragon" },
  killedBy: { killer_rabbit: "a rabbit", dragon: "the dragon", goblin: "a goblin", skeleton_knight: "a skeleton", black_knight: "the Black Knight",
              hunters: "the King's hunters", toad: "a toad", ogre: "the ogre", turd_dragon: "a turd dragon", unknown: "something" },
  laneScale: 1.05       // (unused since v12g: graves are drawn at artScale on the road)
};
