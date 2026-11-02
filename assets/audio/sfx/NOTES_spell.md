# Spell attack SFX (fire bottle spelling attack)

Made with the ElevenLabs Sound Effects API (`/v1/sound-generation`) on Magnus's Starter account, then mastered with ffmpeg/numpy.

## Files
| File | Length | Loudness (momentary max) | True peak | Sound |
|---|---|---|---|---|
| spell_ok_1 | 0.26 s | -18.0 LUFS | -10.0 dBTP | Small warm anvil ting (base pitch, about 2.0 kHz fundamental with inharmonic partials), clean decay |
| spell_ok_2 | 0.24 s | -18.0 LUFS | -9.8 dBTP | Same ting +1 semitone, with a faint ember crackle under the tail |
| spell_ok_3 | 0.28 s | -18.0 LUFS | -10.1 dBTP | Same ting -1 semitone, slightly longer and darker, clean |
| spell_ok_4 | 0.22 s | -18.0 LUFS | -9.6 dBTP | Same ting +2 semitones, shortest, with a faint ember crackle |
| spell_miss_1 | 0.45 s | -18.0 LUFS | -7.3 dBTP | Water-on-hot-iron quench hiss with a low steam gurgle underneath |
| spell_miss_2 | 0.42 s | -18.0 LUFS | -5.6 dBTP | Duller, shorter quench hiss with a sputter and a gurgle |

Each sound comes as `.ogg` (Vorbis q6, 48 kHz) and `.mp3` (LAME V2, 48 kHz, for Safari).
`spell_preview.mp3` has 10 ok sounds at 0.12–0.18 s spacing, a gap, then miss_1 and miss_2.

## Use in game
- Pick a random ok variant for each letter and avoid repeating the last one. Rotating through 1→2→3→4 also works.
- Suggested volume: ok at about 0.6–0.7 (they repeat 8–12 times quickly), miss at about 0.8. Both are mastered to the same loudness, so the miss stands out a little at those settings.
- If you'd rather not use a gain node, the ok set at volume 1.0 sits just under the combat hits (sfx_hit_armour_01 measures -17.5).

## Mastering
- High-pass at 40 Hz on the ok sounds and 60 Hz on the misses, which also removes DC.
- Head trimmed so the transient lands at about 0–2 ms, with a 1 ms fade-in and a cosine fade-out (80 ms on ok, 120 ms on miss).
- The ok variants all come from one ElevenLabs take (ok_e) using varispeed pitch shifts of 0, +1, -1 and +2 semitones. ok_2 and ok_4 add the crackle tail from take ok_a at -16 dB.
- The misses are hiss takes miss_a and miss_b, each layered with the low gurgle from miss_c (at -8 dB). Harshness is tamed gently with a -6.5 dB (miss_1) or -4.5 dB (miss_2) bell at 9.5 kHz (Q 0.7) and -1.5 dB at 6.5 kHz. Air above 12 kHz is kept, with no low-pass.
- Loudness is matched to -18 LUFS momentary-max, which suits sub-400 ms sounds. True peak stays at or below -5.6 dBTP everywhere.
- Click/discontinuity scan found 0 spikes. All files start and end at zero.
- 24-bit WAV masters and all raw ElevenLabs takes (including the rejected ones) are in `_masters/spell/`.

## Generations and credits
The `character-cost` response header gives the credits per call: 5 credits for each 0.5 s call and 6 for each 0.6 s call.
**Total: 53 credits over 10 generations.**

| Take | Duration (s) | Prompt influence | Credits | Prompt |
|---|---|---|---|---|
| ok_a | 0.5 | 0.6 | 5 | A single small hammer tink on a glowing hot anvil, bright short metallic ping with a tiny ember crackle, medieval forge, dry close recording, no reverb |
| ok_b | 0.5 | 0.6 | 5 | Satisfying forge pop: a hot ember snaps with a soft warm metallic tink, very short, close, dry, pleasant, medieval blacksmith |
| ok_c | 0.5 | 0.65 | 5 | Tiny light hammer tap on hot glowing iron, soft rounded metallic clink with a brief sizzle tail, short single hit, dry close |
| ok_d | 0.5 | 0.5 | 5 | Small crisp sizzle-tink as a glowing hot metal rune is stamped, warm short metallic chime, satisfying, magical medieval forge, single hit |
| miss_a | 0.6 | 0.6 | 6 | Short quench hiss: drop of water on red hot iron, quick steam sizzle that dies away, close, dry, medieval forge |
| miss_b | 0.6 | 0.6 | 6 | Hot metal dipped briefly in water, short dull steam hiss with a low sputter, disappointed, close recording, no reverb |
| ok_e | 0.5 | 0.6 | 5 | One light blacksmith hammer strike on a small anvil horn, warm full-bodied metallic ting with a solid low thud underneath, short ring, satisfying, not shrill, dry close recording |
| ok_f | 0.5 | 0.55 | 5 | Glowing hot iron struck once with a small hammer, chunky warm clink with soft spark crackle, short, mid-range tone, pleasant game reward sound, no reverb |
| ok_g | 0.5 | 0.6 | 5 | Small wooden-handled hammer taps a hot horseshoe once, round warm clank with a quick ember pop, short, low-mid metallic, satisfying, close and dry |
| miss_c | 0.6 | 0.6 | 6 | Red hot iron plunged into a water bucket, short deep bubbling steam hiss with a low gurgle, fades quickly, warm, not harsh, close, dry |

Rejected takes:
- ok_b: a pure 2.4 kHz beep.
- ok_c and ok_f: thin, mostly above 8 kHz.
- ok_d: a 4.5 kHz shrill ping.
- ok_g: mostly low rumble.
- ok_a: kept only for its crackle tail.
- miss_c: a gurgle with no hiss, so it's used only as a layer.

## Caveat
Nobody has listened to these. Every check is a measurement: spectrum, envelope, loudness and the click scan.
