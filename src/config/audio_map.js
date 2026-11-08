// GENERATED from assets/audio_map.json
window.KM_AUDIO_MAP = {
  "_comment": "event -> { files: [names in assets/audio/], vol }. Empty files = silent hook. Engine calls KM.Audio.play(event). vo_* entries are voice-over clips (KM.Audio.voice): put files in assets/audio/vo/ and list them, e.g. \"files\": [\"vo/vo_intro_01.ogg\"]. Music is not here: see src/data/music.js. v12r: a vo_* id plays only the file listed here; an id with no files (or no entry) is silent (no by-name probing, no 404s).",
  "meter_shake": {
    "files": [
      "sfx/meter_shake.ogg"
    ],
    "vol": 0.55,
    "_src": "Charlie, incoming/sfx_meter (NOTES_cast.md): 1 s rattle, cast bar shake"
  },
  "meter_tick_up": {
    "files": [
      "sfx/meter_tick_up.ogg"
    ],
    "vol": 0.8,
    "_src": "Charlie, incoming/sfx_meter (NOTES_cast.md): 1 s rising ticks, cast bar slide when the change helps"
  },
  "meter_tock_down": {
    "files": [
      "sfx/meter_tock_down.ogg"
    ],
    "vol": 0.8,
    "_src": "Charlie, incoming/sfx_meter (NOTES_cast.md): 1 s falling tocks, cast bar slide when the change hurts"
  },
  "ui_click": {
    "files": [],
    "vol": 0.7
  },
  "type_blip": {
    "files": [],
    "vol": 0.4
  },
  "footstep": {
    "files": [],
    "vol": 0.5
  },
  "hop": {
    "files": [],
    "vol": 0.7
  },
  "key_tap": {
    "files": [],
    "vol": 0.6
  },
  "correct": {
    "files": [
      "sfx/_masters/sfx_correct_01.wav",
      "sfx/_masters/sfx_correct_02.wav",
      "sfx/_masters/sfx_correct_03.wav"
    ],
    "vol": 0.9,
    "_note": "Charlie's blacksmith set (anvil strikes), random pick, never the same twice in a row"
  },
  "wrong": {
    "files": [
      "sfx/_masters/sfx_wrong_01.wav",
      "sfx/_masters/sfx_wrong_02.wav",
      "sfx/_masters/sfx_wrong_03.wav"
    ],
    "vol": 0.9,
    "_note": "Charlie's blacksmith set (clunk, mis-hit, quench hiss), random pick, never the same twice in a row"
  },
  "hit": {
    "files": [],
    "vol": 0.9
  },
  "enemy_fall": {
    "files": [],
    "vol": 0.9
  },
  "coin": {
    "files": [],
    "vol": 0.8
  },
  "dice_roll": {
    "files": [],
    "vol": 0.9
  },
  "dice_land": {
    "files": [],
    "vol": 0.9
  },
  "recruit": {
    "files": [],
    "vol": 0.9
  },
  "sacrifice": {
    "files": [],
    "vol": 0.9
  },
  "buy": {
    "files": [],
    "vol": 0.8
  },
  "riddle": {
    "files": [
      "sfx/riddle_hihuuu.ogg"
    ],
    "vol": 1.0
  },
  "boss_intro": {
    "files": [],
    "vol": 1.0
  },
  "dragon_roar": {
    "files": [
      "sfx/boss_roar_31.wav"
    ],
    "vol": 0.7,
    "_note": "Short original synthesized growl; non-looping boss entrance cue."
  },
  "gameover": {
    "files": [],
    "vol": 1.0
  },
  "victory": {
    "files": [],
    "vol": 1.0
  },
  "attack": {
    "files": [],
    "vol": 0.9
  },
  "hurt": {
    "files": [],
    "vol": 0.9
  },
  "rest_tavern": {
    "files": [],
    "vol": 0.8
  },
  "rest_campsite": {
    "files": [],
    "vol": 0.8
  },
  "rest_shop": {
    "files": [],
    "vol": 0.8
  },
  "heal": {
    "files": [],
    "vol": 0.8
  },
  "respects": {
    "files": [],
    "vol": 0.7
  },
  "vo_story_01": {
    "files": [
      "vo/vo_story_01.ogg"
    ],
    "vol": 1.0
  },
  "vo_story_02": {
    "files": [
      "vo/vo_story_02.ogg"
    ],
    "vol": 1.0
  },
  "vo_story_03": {
    "files": [
      "vo/vo_story_03.ogg"
    ],
    "vol": 1.0
  },
  "vo_story_04": {
    "files": [
      "vo/vo_story_04.ogg"
    ],
    "vol": 1.0
  },
  "vo_intro_01": {
    "files": [],
    "vol": 1.0
  },
  "vo_intro_02": {
    "files": [],
    "vol": 1.0
  },
  "vo_intro_03": {
    "files": [],
    "vol": 1.0
  },
  "vo_intro_04": {
    "files": [],
    "vol": 1.0
  },
  "vo_intro_05": {
    "files": [],
    "vol": 1.0
  },
  "vo_intro_06": {
    "files": [],
    "vol": 1.0
  },
  "vo_intro_07": {
    "files": [],
    "vol": 1.0
  },
  "vo_intro_08": {
    "files": [],
    "vol": 1.0
  },
  "vo_name_prompt": {
    "files": [
      "vo/vo_name_prompt.ogg"
    ],
    "vol": 1.0,
    "_note": "v12r Charlie: Callum narrator (incoming/vo_narrator/NOTES.md)"
  },
  "vo_after_name": {
    "files": [
      "vo/vo_after_name.ogg"
    ],
    "vol": 1.0,
    "_note": "v12r Charlie: Callum narrator (incoming/vo_narrator/NOTES.md) - recorded without the name; the bubble keeps {name}"
  },
  "vo_victory": {
    "files": [
      "vo/vo_victory.ogg"
    ],
    "vol": 1.0,
    "_note": "v12r Charlie: Callum narrator (incoming/vo_narrator/NOTES.md)"
  },
  "vo_gameover_01": {
    "files": [
      "vo/vo_gameover_01.ogg"
    ],
    "vol": 1.0,
    "_note": "v12r Charlie: Callum narrator (incoming/vo_narrator/NOTES.md)"
  },
  "vo_gameover_02": {
    "files": [
      "vo/vo_gameover_02.ogg"
    ],
    "vol": 1.0,
    "_note": "v12r Charlie: Callum narrator (incoming/vo_narrator/NOTES.md)"
  },
  "vo_gameover_03": {
    "files": [
      "vo/vo_gameover_03.ogg"
    ],
    "vol": 1.0,
    "_note": "v12r Charlie: Callum narrator (incoming/vo_narrator/NOTES.md)"
  },
  "vo_further_than_ever": {
    "files": [
      "vo/vo_further_than_ever.ogg"
    ],
    "vol": 1.0,
    "_note": "v12r Charlie: Callum narrator (incoming/vo_narrator/NOTES.md)"
  },
  "spell_cast": {
    "files": [],
    "vol": 0.8
  },
  "spell_wear_off": {
    "files": [],
    "vol": 0.8
  },
  "vo_spell_cast": {
    "files": [],
    "vol": 1.0
  },
  "vo_spell_wear_off": {
    "files": [],
    "vol": 1.0
  },
  "member_death": {
    "files": [],
    "vol": 0.9
  },
  "vo_member_dies": {
    "files": [],
    "vol": 1.0
  },
  "step": {
    "files": [
      "sfx/sfx_step_01.ogg",
      "sfx/sfx_step_02.ogg",
      "sfx/sfx_step_03.ogg",
      "sfx/sfx_step_04.ogg",
      "sfx/sfx_step_05.ogg",
      "sfx/sfx_step_06.ogg"
    ],
    "vol": 0.32,
    "_note": "Original knight step files; softened mix, synced to the visible outfit contact frames."
  },
  "swing_weak": {
    "files": [
      "sfx/sfx_swing_01.ogg",
      "sfx/sfx_swing_02.ogg",
      "sfx/sfx_swing_03.ogg"
    ],
    "vol": 0.8
  },
  "swing_hard": {
    "files": [
      "sfx/sfx_swing_04.ogg"
    ],
    "vol": 0.9,
    "_note": "the heavy swing"
  },
  "swing_enemy": {
    "files": [
      "sfx/sfx_swing_01.ogg",
      "sfx/sfx_swing_02.ogg",
      "sfx/sfx_swing_03.ogg"
    ],
    "vol": 0.6
  },
  "hit_party": {
    "files": [
      "sfx/sfx_hit_armour_01.ogg",
      "sfx/sfx_hit_armour_02.ogg",
      "sfx/sfx_hit_armour_03.ogg"
    ],
    "rare": {
      "file": "sfx/sfx_hit_armour_04.ogg",
      "p": 0.125
    },
    "vol": 0.8,
    "_note": "a monster hits the (mail-clad) party"
  },
  "hit_blocked": {
    "files": [
      "sfx/sfx_hit_armour_01.ogg",
      "sfx/sfx_hit_armour_02.ogg"
    ],
    "vol": 0.7,
    "_note": "armour turned the blow aside"
  },
  "step_companion": {
    "files": [
      "sfx/sfx_step_01.ogg",
      "sfx/sfx_step_02.ogg",
      "sfx/sfx_step_03.ogg",
      "sfx/sfx_step_04.ogg",
      "sfx/sfx_step_05.ogg",
      "sfx/sfx_step_06.ogg"
    ],
    "vol": 0.14,
    "_note": "Quieter supporting steps, never doubled on the hero contact beat."
  },
  "hit_flesh": {
    "files": [
      "sfx/sfx_hit_flesh_01.ogg",
      "sfx/sfx_hit_flesh_02.ogg",
      "sfx/sfx_hit_flesh_03.ogg"
    ],
    "rare": {
      "file": "sfx/sfx_hit_flesh_04.ogg",
      "p": 0.125
    },
    "vol": 0.9,
    "_note": "fleshy monsters (enemies.js material: flesh); 04 = comic squelch, ~1 in 8"
  },
  "hit_armour": {
    "files": [
      "sfx/sfx_hit_armour_01.ogg",
      "sfx/sfx_hit_armour_02.ogg",
      "sfx/sfx_hit_armour_03.ogg"
    ],
    "rare": {
      "file": "sfx/sfx_hit_armour_04.ogg",
      "p": 0.125
    },
    "vol": 0.9,
    "_note": "armoured monsters; 04 = comic bonk, ~1 in 8"
  },
  "hit_boss": {
    "files": [
      "sfx/sfx_hit_boss_01.ogg"
    ],
    "vol": 1.0,
    "_note": "every hit in a boss / mega-boss fight"
  },
  "spell_letter_ok": {
    "files": [
      "sfx/spell_ok_1.ogg",
      "sfx/spell_ok_2.ogg",
      "sfx/spell_ok_3.ogg",
      "sfx/spell_ok_4.ogg"
    ],
    "vol": 0.65,
    "_note": "v12m fire bottle: a right letter (it glows hot, then cools). Charlie's ElevenLabs strikes, a random variant each time (never the same twice in a row)"
  },
  "spell_letter_bad": {
    "files": [
      "sfx/spell_miss_1.ogg",
      "sfx/spell_miss_2.ogg"
    ],
    "vol": 0.8,
    "_note": "v12m fire bottle: a wrong key (the letter shakes and stays grey). Charlie's ElevenLabs water hiss"
  },
  "fire_throw": {
    "files": [
      "sfx/fire_throw_1.ogg"
    ],
    "vol": 0.8,
    "_note": "v12n fire bottle: the throw (release); peaks ~134 ms, done by 0.6 s"
  },
  "fire_smash": {
    "files": [
      "sfx/fire_smash_1.ogg"
    ],
    "vol": 0.9,
    "_note": "v12n fire bottle: the bottle smashes (smash frame 1)"
  },
  "fire_ignite": {
    "files": [
      "sfx/fire_ignite_1.ogg"
    ],
    "vol": 1.0,
    "_note": "v12n fire bottle: once per throw at burst frame 1; its peak (119 ms) lands on burst frame 2 = the hit"
  },
  "fire_crackle": {
    "files": [
      "sfx/fire_crackle_loop.ogg"
    ],
    "vol": 0.65,
    "_note": "v12n fire bottle: seamless 2.000 s loop while the fire lingers (KM.Audio.loop / stop with a 300 ms fade)"
  },
  "fire_fizzle": {
    "files": [
      "sfx/fire_fizzle_1.ogg"
    ],
    "vol": 0.8,
    "_note": "v12n fire bottle: the fire dies out (as it fades) and a too-slow bottle fizzles"
  },
  "goblin_burn": {
    "files": [
      "sfx/goblin_burn_1.ogg",
      "sfx/goblin_burn_2.ogg"
    ],
    "vol": 0.8,
    "_note": "v12n fire bottle: one yelp per enemy hit, staggered (never the same twice in a row)"
  },
  "scroll_buy": {
    "files": [
      "sfx/scroll_buy_1.ogg",
      "sfx/scroll_buy_2.ogg"
    ],
    "vol": 0.8,
    "_note": "v12r Charlie: buying a Scroll of Stupidity (tavern / shop / stall)"
  },
  "scroll_get": {
    "files": [
      "sfx/scroll_get_1.ogg",
      "sfx/scroll_get_2.ogg"
    ],
    "vol": 0.7,
    "delay": 0.25,
    "_note": "v12r Charlie: the scroll goes into the pack (~250 ms after a buy; any other way a scroll is gained)"
  },
  "scroll_use": {
    "files": [
      "sfx/scroll_use_1.ogg",
      "sfx/scroll_use_2.ogg"
    ],
    "vol": 0.9,
    "_note": "v12r Charlie: casting the scroll"
  },
  "buy_gear": {
    "files": [
      "sfx/_masters/sfx_correct_01.wav",
      "sfx/_masters/sfx_correct_02.wav",
      "sfx/_masters/sfx_correct_03.wav"
    ],
    "vol": 0.8
  },
  "heart_crack": {
    "files": [
      "sfx/heart_crack_1.ogg",
      "sfx/heart_crack_2.ogg"
    ],
    "vol": 0.9,
    "_note": "Charlie: a heart is lost to an ordinary hit"
  },
  "heart_break": {
    "files": [
      "sfx/heart_break_1.ogg",
      "sfx/heart_break_2.ogg"
    ],
    "vol": 0.9,
    "_note": "Charlie: a boss blow breaks hearts"
  },
  "shield_break": {
    "files": [
      "sfx/shield_break_1.ogg"
    ],
    "vol": 0.9,
    "_note": "Charlie: the party's last armour is used up"
  },
  "heart_mend": {
    "files": [
      "sfx/heart_mend_1.ogg"
    ],
    "vol": 0.8,
    "_note": "Charlie: resting at camp"
  },
  "crypt_door": {
    "files": [
      "sfx/crypt_door_open.ogg"
    ],
    "vol": 0.9,
    "_note": "Charlie: the crypt gate grinds open"
  },
  "step_stone": {
    "files": [
      "sfx/step_stone_01.ogg",
      "sfx/step_stone_02.ogg",
      "sfx/step_stone_03.ogg",
      "sfx/step_stone_04.ogg"
    ],
    "vol": 0.5,
    "_note": "Charlie: footsteps inside the crypt"
  },
  "cue_knight": {
    "files": [
      "sfx/cue_knight_1.ogg",
      "sfx/cue_knight_2.ogg"
    ],
    "vol": 0.8,
    "_note": "Charlie: this class's sum is next (who-acts switch)"
  },
  "cue_healer": {
    "files": [
      "sfx/cue_healer_1.ogg",
      "sfx/cue_healer_2.ogg"
    ],
    "vol": 0.8,
    "_note": "Charlie: this class's sum is next (who-acts switch)"
  },
  "cue_fire": {
    "files": [
      "sfx/cue_fire_1.ogg",
      "sfx/cue_fire_2.ogg"
    ],
    "vol": 0.8,
    "_note": "Charlie: this class's sum is next (who-acts switch)"
  },
  "cue_wizard": {
    "files": [
      "sfx/cue_wizard_1.ogg",
      "sfx/cue_wizard_2.ogg"
    ],
    "vol": 0.8,
    "_note": "Charlie: this class's sum is next (who-acts switch)"
  },
  "cue_executioner": {
    "files": [
      "sfx/cue_executioner_1.ogg",
      "sfx/cue_executioner_2.ogg"
    ],
    "vol": 0.8,
    "_note": "Charlie: this class's sum is next (who-acts switch)"
  },
  "combo_sting": {
    "files": [
      "sfx/combo_sting_1.ogg"
    ],
    "vol": 0.9,
    "_note": "Charlie: first time a combo banner fires (upgrade cards)"
  },
  "key_cling": {
    "files": [
      "sfx/key_cling_1.ogg",
      "sfx/key_cling_2.ogg",
      "sfx/key_cling_3.ogg",
      "sfx/key_cling_4.ogg"
    ],
    "vol": 1.0,
    "_src": "Charlie, incoming/sfx_keys v3 (README): number entry, sword battle / blacksmith forge (juice switch): each digit; volume in src/data/juice.js"
  },
  "key_enter_kosh": {
    "files": [
      "sfx/key_enter_kosh_1.ogg",
      "sfx/key_enter_kosh_2.ogg"
    ],
    "vol": 1.0,
    "_src": "Charlie, incoming/sfx_keys v3 (README): number entry, sword battle / blacksmith forge (juice switch): a right Enter; volume in src/data/juice.js"
  },
  "enter_wrong": {
    "files": [
      "sfx/enter_wrong.ogg"
    ],
    "vol": 1.0,
    "_src": "Charlie, incoming/sfx_keys v3 (README): number entry, sword battle / blacksmith forge (juice switch): a wrong Enter (blocked ka-tunk); volume in src/data/juice.js"
  },
  "enter_miss_whoosh": {
    "files": [
      "sfx/enter_miss_whoosh.ogg"
    ],
    "vol": 1.0,
    "_src": "Charlie, incoming/sfx_keys v3 (README): number entry, sword battle / blacksmith forge (juice switch): optional, a blade swishing past; volume in src/data/juice.js"
  },
  "key_backspace": {
    "files": [
      "sfx/key_backspace.ogg"
    ],
    "vol": 1.0,
    "_src": "Charlie, incoming/sfx_keys v3 (README): number entry, sword battle / blacksmith forge (juice switch): Backspace (soft wooden tick); volume in src/data/juice.js"
  }
};
