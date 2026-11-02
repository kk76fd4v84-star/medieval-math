// Music: Magnus's own tracks (assets/audio/music/<category>/), used exactly as delivered (no re-editing).
// Reassign freely: move a file into another category's list, or point a scene at another category.
window.KM_DATA = window.KM_DATA || {};
KM_DATA.music = {
  root: "assets/audio/music/",
  volume: 0.7,          // default music volume 0..1 (player setting overrides; saved in the profile)
  crossfade: 1.2,       // seconds for a crossfade between categories (scene changes)
  duckVoice: 1,         // music multiplier while a voice-over clip is playing. v12r (Magnus: "Don't lower the music when the narrator speaks"): 1 = no dip (was 0.3)
  volumeStep: 0.1,      // [ and ] change the music volume by this much
  // v12r: categories whose first track loads WITH the loading bar (bytes counted, decoded before the bar ends):
  // the title / intro music and the first road track (picked at random from world, not the title's track).
  // Everything else streams when its scene starts. Music ships as .mp3 only (plays in every browser incl. Safari).
  preload: ["title", "world"],
  outside: "world",     // v12r: what plays instead of a `where`-tagged (vocal) category outside its place: the road music

  // category: { tracks, vol (category gain), resume (true = continue the paused track where it left off,
  //             false = start a fresh shuffled track each time) }. `use` borrows another category's tracks.
  // Tracks shuffle with no immediate repeat and roll on to the next one when a track ends.
  categories: {
    title: { vol: 1.0, resume: true, tracks: ["world/quest_theme.mp3"] },
    world: { vol: 0.85, resume: true, tracks: [
      "world/quest_theme.mp3", "world/march_of_the_brave_1.mp3", "world/march_of_the_brave_2.mp3", "world/march_of_the_brave_3.mp3",
      "world/march_of_the_pilgrim_1.mp3", "world/march_of_the_pilgrim_2.mp3"] },
    camp: { vol: 0.9, resume: false, tracks: ["camp/march_of_the_lonely_recorders_1.mp3", "camp/march_of_the_lonely_recorders_2.mp3"] },
    shop: { use: "camp", vol: 0.5, resume: false },   // no dedicated shop track yet: camp music, quieter
    // v12r (Magnus: "only play the bard music with voices inside the actual tavern"): every tavern track is a sung bard
    // song (lyrics in the mp3 tags). `where` = the only game view this category may play in (KM.Music.setPlace, fed
    // from S.view); anywhere else a scene asking for it gets its `outside` category (or KM_DATA.music.outside).
    tavern: { vol: 0.9, resume: false, vocal: true, where: "tavern-interior", tracks: [
      "tavern/off_with_their_heads_1.mp3", "tavern/off_with_their_heads_2.mp3", "tavern/off_with_their_heads_3.mp3", "tavern/off_with_their_heads_4.mp3",
      "tavern/raise_a_cup_pass_it_round_1.mp3", "tavern/raise_a_cup_pass_it_round_2.mp3", "tavern/raise_your_cup.mp3",
      "tavern/rogue_with_a_steady_face_1.mp3", "tavern/rogue_with_a_steady_face_2.mp3"] },
    battle: { vol: 0.9, resume: false, tracks: [
      "battle/brisk_battle_stomp_1.mp3", "battle/brisk_battle_stomp_2.mp3", "battle/questing_march_1.mp3", "battle/questing_march_2.mp3"] },
    wizard: { vol: 0.95, resume: false, tracks: ["wizard/the_wizards_march.mp3"] },
    heavy_boss: { vol: 1.0, resume: false, tracks: ["heavy_boss/steel_and_sorcery_1.mp3", "heavy_boss/steel_and_sorcery_2.mp3"] }
  },

  // game scene -> { cat (null = fade to silence), duck (extra multiplier), outside (cat when `cat` is tagged `where`
  //                 and the current view is not that place) }
  scenes: {
    title:        { cat: "title" },
    intro:        { cat: "title" },
    walk:         { cat: "world" },          // travelling; also graves
    battle:       { cat: "battle" },         // normal math fights (starts only when the fight engages)
    boss:         { cat: "wizard" },         // mid-boss (default for type "boss")
    mega:         { cat: "heavy_boss" },     // dragon
    riddle:       { cat: "world", duck: 0.6 },  // riddles keep the road music, a bit quieter
    recruit:      { cat: "world", duck: 0.75 },
    rest_tavern:  { cat: "tavern", outside: "world" },  // v12r: bard songs inside only; arrival/exterior keeps the road music
    rest_campsite:{ cat: "camp" },
    rest_shop:    { cat: "shop" },
    rest_stall:   { cat: "world" },  // v11b roadside scroll stall: the road music keeps playing
    gameover:     { cat: null },
    win:          { cat: "title" }
  },
  // per-enemy override of the fight scene (e.g. any future wizard enemy -> "boss")
  enemyScenes: { skeleton_knight: "boss", dragon: "mega" }
};
