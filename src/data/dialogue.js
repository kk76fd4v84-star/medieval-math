// Narrator + flavour text. Edit freely; engine reads window.KM_DATA.dialogue.
window.KM_DATA = window.KM_DATA || {};
// Any line may be a plain string or { text, vo }. vo = voice clip id (see README "Voice-over"):
// it plays assets/audio/vo/<id>.ogg if audio_map.json lists that file, otherwise silent. Text always shows.
KM_DATA.dialogue = {
  narrator: "narrator", // Magnus's skeleton on his rock (src/config/narrator_apply.js)
  // v12c (Magnus, 2 Nov): new story intro. The old rant (vo_intro_01..08) is kept in intro_rant_v12 below.
  intro: [
    { text: "The knight was hunted by the King of Mathematical Solutions.", vo: "vo_story_01" },
    { text: "The knight stood up to the king, wanting to use his own brain.", vo: "vo_story_02" },
    { text: "This made the King of Math furious. He sent out a hunting party to slay the knight.", vo: "vo_story_03" },
    { text: "Now, the story of the Math Knight begins.", vo: "vo_story_04" }
  ],
  intro_rant_v12: [
    { text: "Hey there.", vo: "vo_intro_01" },
    { text: "Ever feel actually fucking stupid?", vo: "vo_intro_02" },
    { text: "Well. Let's test your mind.", vo: "vo_intro_03" },
    { text: "And remember. This is no mere challenge. It's a journey of the mind! A quest of the soul! A—", vo: "vo_intro_04" },
    { text: "Oh wait. I'll keep it short. Attention spans and all.", vo: "vo_intro_05" },
    { text: "Bla bla bla NO PHONES. Bla bla NO HELP. Bla bla.", vo: "vo_intro_06" },
    { text: "Just play.", vo: "vo_intro_07" },
    { text: "Now go on your adventure!", vo: "vo_intro_08" }
  ],
  namePrompt: { text: "But first... your name? You scruffy little tin can.", vo: "vo_name_prompt" },
  afterName: { text: "{name}? Really? ...Fine. Off you go, Sir {name}. Try not to die.", vo: "vo_after_name" },
  gameOverJourney: "Your journey: {d} leagues",
  gameOver: [{ text: "You have died. Mostly.", vo: "vo_gameover_01" }, { text: "Tis but a flesh wound. Also you are dead.", vo: "vo_gameover_02" }, { text: "The minstrels will sing of this. Badly.", vo: "vo_gameover_03" }],
  victory: { text: "The dragon is defeated! Your brain was tested. Verdict: adequate.", vo: "vo_victory" },
  wrong: ["Wrong!", "Nope.", "Is that your final answer? It shouldn't be.", "Your mother was a hamster.", "Ni!"],
  right: ["Correct!", "Huzzah!", "Brain: functional.", "Splendid!", "Not bad, tin can."]
};
