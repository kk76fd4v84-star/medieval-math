# Narrator VO — story lines (final, 2 Nov 2026)

**Voice:** ElevenLabs premade voice **Callum**, voice_id `N2lVS1w4EtoT3dr4eOWO`. This is a public library voice; nothing was cloned from any real person.
**Model:** `eleven_multilingual_v2`.
**Settings** (the same as Magnus's pick, audition `voice_c_blend_01`): stability **0.62**, similarity_boost **0.78**, style **0.32**, speed **1.08**, use_speaker_boost on. The text has no bracketed directions. Takes vary only by the request `seed`.
**Licence:** generated on Magnus's ElevenLabs account. Per the brief, it's on the **Starter** plan; ElevenLabs' paid plans (Starter and up) include a commercial-use licence for generated audio. The API key here can't read the subscription, so the plan tier wasn't checked from the box.

## Files

| file | line | chosen take (seed) | duration | loudness | true peak | median pitch |
|---|---|---|---|---|---|---|
| vo_story_01.ogg | "The knight was hunted by the King of Mathematical Solutions." | take 2 (seed 2202) | 3.95 s | -17.3 LUFS | -2.6 dBTP | 103 Hz |
| vo_story_02.ogg | "The knight stood up to the king, wanting to use his own brain." | take 4 (seed 4404) | 3.61 s | -17.3 LUFS | -2.6 dBTP | 86 Hz |
| vo_story_03.ogg | "This made the King of Math furious. He sent out a hunting party to slay the knight." | take 5 (seed 5505) | 5.12 s | -17.3 LUFS | -2.4 dBTP | 101 Hz |
| vo_story_04.ogg | "Now, the story of the Math Knight begins." | take 4 (seed 4404) | 2.86 s | -17.2 LUFS | -2.4 dBTP | 108 Hz |

- Format: OGG Vorbis q6, 48 kHz mono. Loudness and peak were measured on the OGGs with ffmpeg `ebur128=peak=true`.
- `vo_story_preview.mp3` (19.1 s): all four lines in order, with 0.8 s gaps.
- `_masters/vo_story_0N.wav`: 24-bit, 48 kHz masters.
- `_masters/alt_takes/`: every raw API take (MP3, 44.1 kHz, 128 kb/s).
  - Seeds 1101, 2202 and 3303 are takes 1–3 for every line.
  - Seeds 4404, 5505 and 6606 are extra takes 4–6, made for lines 2–4 only, to get closer to the reference pitch.

## How the takes were chosen
- **Words:** every take was transcribed with faster-whisper. The chosen takes are word-exact under Whisper large-v3; "Math Knight"/"Night" is a spelling homophone only.
- **Pitch and timbre:** the reference is blend_01, about 102–117 Hz median per sentence.
  - The chosen takes are the closest without garbles: 01 = 103, 03 = 101, 04 = 108 Hz.
  - Line 02 is the outlier at 86 Hz. All six of its takes came out at 79–91 Hz; take 4 was the highest clean one.
- **Rejected:**
  - 02 take 5: the first word was garbled ("I stood up…").
  - 03 takes 1 and 4: they jumped high, to 133–139 Hz.
  - 04 takes 3 and 6: the pitch tracker failed or read about 52 Hz, a likely croak or vocal fry.

## Processing (per line)
1. 60 Hz high-pass, which only removes sub-rumble.
2. Trim: 80 ms before speech onset. Lines 01 and 04 started sooner, so silence was added to make up the 80 ms. The tail runs to 250 ms after the last speech above -50 dB.
3. Cosine fades: in over 20 ms (shorter where the pre-roll was short), out over 150 ms.
4. A gentle compressor (2:1 above -20 dBFS, 8 ms attack, 120 ms release), about 2–4 dB on peaks, so the lines can sit at -17 LUFS without being squashed.
5. Gain to -17.3 LUFS, then a soft peak limiter to keep true peak at or below -2 dBTP. The lines are matched within 0.1 LU.

No reverb or room was added; blend_01 had none either, so the timbre stays as generated.

## Checks
- Clicks: a 10 kHz high-pass discontinuity scan. Lines 02–04 read 9–11, which is normal speech consonants. Line 01 reads 16 at 1.12 s; this is a consonant transient already in the raw ElevenLabs take, not an edit. Every file starts and ends at zero.
- Transcription of the final OGGs with Whisper large-v3: all four are word-exact.

# Narrator VO: game lines (3 Nov 2026)

These use the same voice, model and settings as vo_story_* (Callum `N2lVS1w4EtoT3dr4eOWO`, eleven_multilingual_v2, stability 0.62 / similarity 0.78 / style 0.32 / speed 1.08 / speaker boost on, no bracket directions) and the same processing chain.
- Each line comes as OGG Vorbis q6 at 48 kHz mono, plus an `.mp3` twin (LAME V2, 48 kHz mono).
- Masters are in `_masters/`, and every raw take is in `_masters/alt_takes/vo_*_sNNNN.mp3`.
- The loudness is integrated LUFS, measured on the OGG with ffmpeg ebur128. True peak is at or below -2.2 dBTP on every OGG.

- vo_further_than_ever.ogg: "Further than ever before!" (seed 2202), 1.68 s, -17.3 LUFS
- vo_name_prompt.ogg: "But first... your name? You scruffy little tin can." (seed 2202), 4.28 s, -17.3 LUFS
- vo_after_name.ogg: "Really? ...Fine. Off you go. Try not to die." (seed 4404), 4.07 s, -17.3 LUFS
- vo_gameover_01.ogg: "You have died. Mostly." (seed 2202), 1.69 s, -17.3 LUFS
- vo_gameover_02.ogg: "Tis but a flesh wound. Also you are dead." (seed 5505), 3.10 s, -17.3 LUFS
- vo_gameover_03.ogg: "The minstrels will sing of this. Badly." (seed 2202), 2.60 s, -17.3 LUFS
- vo_victory.ogg: "The dragon is defeated! Your brain was tested. Verdict: adequate." (seed 2202), 5.56 s, -17.3 LUFS

`vo_narrator_lines_preview.mp3` (28.9 s) plays all 7 lines in order, with 0.8 s gaps.

## Retakes
- vo_after_name and vo_gameover_02 had extra takes because seed 2202 came out far above the narrator's pitch: 162 and 195 Hz median, against 86–108 Hz for vo_story_*.
- Chosen takes:
  - vo_after_name, seed 4404: 120 Hz.
  - vo_gameover_02, seed 5505: 107 Hz.
- Rejected: vo_after_name seed 5505 dropped the words "Try not to die" and left a 1.9 s gap.
- **Words:** every chosen take is word-exact under Whisper (medium.en, and large-v3 with word timestamps).
- **Median pitch of the others:**
  - vo_further_than_ever: 136 Hz.
  - vo_gameover_01 and vo_gameover_03: 130 Hz.
  - vo_name_prompt: 108 Hz.
  - vo_victory: 97 Hz.

  The exclamations sit a little higher than the story lines.
- **Credits:** 183 in total for 11 TTS calls, from the `character-cost` response header. That's about 0.4 credits per character.
