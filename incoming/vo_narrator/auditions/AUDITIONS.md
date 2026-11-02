# Narrator auditions — orange-hooded skeleton bard (2 Nov 2026)

These are audition samples only. The full VO set has not been recorded.

Every file has the same two lines, with a 0.9 s pause between them (an SSML `<break time="0.9s" />` in a single request):
1. "The knight was hunted by the King of Mathematical Solutions."
2. "This made the King of Math furious. He sent out a hunting party to slay the knight."

All three are ElevenLabs **premade (public library) voices**, called by their known voice_id. Nothing was cloned from a real person. Model: **eleven_multilingual_v2**, with speaker boost on. The API returned MP3 at 44.1 kHz 128 kb/s, because 192 kb/s needs the Creator tier. Each file was then levelled to about -17 LUFS (true peak -1.5) so they compare fairly, given 0.25 s of lead-in, and re-encoded as mono MP3 at 192 kb/s. No other processing.

| file | option | ElevenLabs voice | voice_id | stability | similarity_boost | style | speed | duration |
|---|---|---|---|---|---|---|---|---|
| voice_a_gravelly.mp3 | A: gravelly old British storyteller | George (premade; mature British, raspy) | `JBFqnCBsd6RMkjVDRZzb` | 0.45 | 0.80 | 0.40 | 0.90 | 10.6 s |
| voice_b_warm.mp3 | B: warm rich baritone bard | Brian (premade; deep, resonant narrator, American) | `nPczCjzI2devNBz1zQrb` | 0.40 | 0.80 | 0.50 | 0.95 | 9.0 s |
| voice_c_deadpan.mp3 | C: dry deadpan, wry | Callum (premade; husky, "trickster") | `N2lVS1w4EtoT3dr4eOWO` | 0.60 | 0.75 | 0.20 | 1.00 | 11.7 s |
| _masters/voice_c_alt_clyde.mp3 | C alternative: flatter, gruffer deadpan | Clyde (premade; war-veteran, gravelly) | `2EiwWnXFnvU5JabPnv8n` | 0.60 | 0.75 | 0.20 | 1.00 | 9.8 s |

- `auditions_preview.mp3` (39.4 s): each voice says "Voice A/B/C." in its own voice, then 0.5 s of silence, then its audition, then a 1 s gap.
- `_masters/`: 24-bit WAV masters of each audition, plus `raw_elevenlabs_*.mp3`, the untouched API output.
- **Checks:** a faster-whisper transcription confirmed every line is complete (Whisper writes "knight" as "night" for Brian, which is just a homophone). Median voice pitch: George 130 Hz, Brian 101 Hz (the deepest), Callum 116 Hz, Clyde 114 Hz.
- **Voices tried and dropped:** Daniel (`onwK4e9ZLuTAKqWW03F9`) and Dave (`CYw3kZ02Hs0563khs1Fj`) garbled words at style 0.35. Antoni (`ErXwobaYiN019PkySvjV`) was fine but less distinctive. Bill (`pqHfZKP75CyOlSbjOFfB`) returned 404 voice_not_found on this account.

---

# Round 2: Callum in a "posh, clipped, earnest king" direction (2 Nov 2026)

Magnus picked **C (Callum)**. The goal for this round is a posh, clipped, slightly nasal delivery that is earnest and faintly absurd, not gravelly or booming. The API text names no film or actor, and nothing was cloned.

Same two lines as round 1. All takes are by **Callum, `N2lVS1w4EtoT3dr4eOWO`**, on **eleven_v3**, which takes bracketed delivery tags in the text. In v3 the tags steer delivery and are not spoken; transcription confirmed none were read aloud. v3 takes a "stability" value only, so similarity is sent but has little effect, and style isn't used. The API output was 128 kb/s; each take was levelled to about -17 LUFS (true peak -1.5) and re-encoded as mono MP3 at 192 kb/s.

| file | model | stability | similarity | text direction (tags in the request) | duration | median pitch |
|---|---|---|---|---|---|---|
| voice_c_arthur_01.mp3 | eleven_v3 | 0.5 (Natural) | 0.75 | `[posh British accent] [earnest, clipped, regal]` line 1 `[short pause] [indignant]` line 2 | 12.5 s | 146 Hz |
| voice_c_arthur_02.mp3 | eleven_v3 | 0.0 (Creative, most animated) | 0.75 | same tags as 01 | 11.6 s | 146 Hz |
| voice_c_arthur_03.mp3 | eleven_v3 | 0.5 (Natural) | 0.75 | `[very proper upper-class British] [solemn, faintly absurd]` line 1 `[pause]` line 2 | 11.8 s | 107 Hz |
| _masters/voice_alt_daniel_arthur.mp3 | eleven_v3 | 0.5 | 0.75 | same tags as 01, but **Daniel** (`onwK4e9ZLuTAKqWW03F9`, premade British) | 10.8 s | 134 Hz |

- `voice_c_arthur_preview.mp3` (39.8 s) plays takes 01, 02 and 03 in order, with 1.2 s gaps.
- `_masters/` holds the 24-bit WAVs and the untouched API MP3s (`raw_elevenlabs_arthur_*`).
- **Tried and dropped:** two eleven_multilingual_v2 takes of Callum, with no tags:
  - stability 0.55, similarity 0.70, style 0.30, speed 1.05: median pitch 83 Hz.
  - stability 0.35, similarity 0.65, style 0.60, speed 1.0: 100 Hz.

  Both stayed low and husky, the opposite of what was asked. v2 has no way to take delivery direction.

---

# Round 3: Callum blends, keeping the British tone of the first C take (2 Nov 2026)

Magnus's feedback: the round-2 "posh/regal" v3 takes drifted too far from the British character of the first C take (`voice_c_deadpan.mp3`). Goal for this round: keep that first-C tone, with only a light clipped, faintly absurd flavour. The API text names no film or actor, and nothing was cloned.

Same two lines; all takes by **Callum, `N2lVS1w4EtoT3dr4eOWO`**. Processing is the same as before: 128 kb/s from the API, levelled to about -17 LUFS (true peak -1.5), re-encoded as mono MP3 at 192 kb/s.

| file | model | stability | similarity | style | speed | text direction | duration | median pitch |
|---|---|---|---|---|---|---|---|---|
| (reference) voice_c_deadpan.mp3 | multilingual_v2 | 0.60 | 0.75 | 0.20 | 1.00 | none | 11.7 s | 116 Hz |
| voice_c_blend_01.mp3 | eleven_multilingual_v2 | 0.62 | 0.78 | 0.32 | **1.08** | none (v2 would read tags aloud); clipped by the faster speed and higher style | 11.4 s | 110 Hz |
| voice_c_blend_02.mp3 | eleven_v3 | **1.0 (Robust)**, closest to the voice's base timbre | 0.75 | n/a | n/a | `[British] [clipped but conversational]` line 1 `[short pause]` line 2 | 12.2 s | 124 Hz |
| voice_c_blend_03.mp3 | eleven_v3 | 0.5 (Natural) | 0.75 | n/a | n/a | `[British] [clipped but conversational] [faintly amused]` line 1 `[short pause]` line 2 | 11.9 s | 107 Hz |

- `voice_c_blend_preview.mp3` (52.2 s) plays the **first C take as a reference**, then blends 01, 02 and 03, with 1.2 s gaps.
- `_masters/` holds the 24-bit WAVs and the untouched API files (`raw_elevenlabs_blend_*`).
- **Tried and dropped:**
  - v2 at stability 0.60, style 0.25, speed 1.0: almost identical to the first C take, so it added nothing.
  - v3 with `[British accent] [dry, wry]` at stability 0.5: it went high again (median 174 Hz), like round 2.
