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
