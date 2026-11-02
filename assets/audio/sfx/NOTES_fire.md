# Fire Bottle (clay firebomb) SFX

These were made with the ElevenLabs Sound Effects API (`/v1/sound-generation`) on Magnus's Starter account, then mastered with ffmpeg/numpy.
Each sound comes as `.ogg` (Vorbis q6, 48 kHz) and `.mp3` (LAME V2, 48 kHz), and every sound is stereo.

## Files
| File | Length | Loudness (momentary max) | True peak | Sound |
|---|---|---|---|---|
| fire_throw_1 | 0.60 s | -20.0 LUFS | -2.7 dBTP | Spinning-bottle air whoosh that swells to a peak at about 134 ms and passes, with a brighter fluttery fire layer on top |
| fire_smash_1 | 0.42 s | -19.7 LUFS | -2.9 dBTP | Sharp clay crack with a low thump, then a wet, gooey splatter |
| fire_ignite_1 | 1.10 s | -16.0 LUFS | -3.3 dBTP | A 110 ms rush-in that blooms into a deep WHOOMPH with a full-range flame roar, then decays |
| fire_crackle_loop | 2.00 s | -25.7 LUFS | -2.4 dBTP | Steady oil-fire crackle with pops over a low flame rumble. It loops seamlessly. |
| fire_fizzle_1 | 0.75 s | -21.0 LUFS | -9.0 dBTP | Low sputtering flames dying out, with a soft hiss and last pops |
| goblin_burn_1 | 0.50 s | -18.0 LUFS | -9.6 dBTP | Goblin "yowch" yelp whose pitch falls from about 540 to 420 Hz, centred around 1 kHz |
| goblin_burn_2 | 0.45 s | -18.0 LUFS | -9.4 dBTP | Croaky, raspy, irregular goblin hurt cry |

`fire_preview.mp3` (5.1 s) plays the whole move in sequence:
- throw at 0.10 s
- smash at 0.60 s
- ignite at 0.81 s
- crackle from 1.15 s, with a 300 ms fade at 2.65 s
- fizzle at 2.65 s
- yelps at 3.80 s and 4.60 s

## Timing and wiring
- **fire_throw_1:** start it on release. Its swell peaks at about 134 ms and it's done by 0.6 s, so it fits the 450–550 ms arc.
- **fire_smash_1:** start it on impact, at `smash_1`. The crack is at 0–1 ms.
- **fire_ignite_1:** start it at `burst_1`, which is smash start + 210 ms.
  - **The body peak is at 119 ms** (50 ms RMS window; the 20 ms window gives about 107 ms, and the 100 ms window about 132 ms).
  - So the peak lands on **burst frame 2 (85–170 ms)**.
  - Play it once per throw, not once per goblin. If you stagger it per goblin, play extra copies at about 0.5 volume.
- **fire_crackle_loop:** start it at `linger_1` (burst start + 340 ms) with `loop = true`. A 50–100 ms fade-in is fine. The game does the 300 ms fade-out.
  - The loop is exactly 96000 samples (2.000 s).
  - With Web Audio, set `loopStart = 0` and `loopEnd = 2.0`. That also protects against MP3 encoder padding on Safari.
  - With an `<audio loop>` element, MP3 may add a tiny gap on some browsers. Prefer OGG, or Web Audio.
- **fire_fizzle_1:** start it when the fire fade-out begins.
- **goblin_burn_1/2:** play them on burst frame 2 (the damage), one per hit goblin, alternating. For 3 goblins, offset them 0/60/120 ms and drop the third to about 0.7 volume.
- **Suggested volumes:** throw 0.8, smash 0.9, ignite 1.0, crackle 0.6–0.7, fizzle 0.8, goblins 0.8.

## Mastering
- High-pass at 30 Hz (80 Hz on the goblins), which also removes DC.
- Head trimmed so the transient lands at about 0–2 ms. The throw starts its swell at 0 ms and reaches -20 dB at 29 ms.
- 1 ms fade-in and a cosine fade-out on everything except the loop.
- Loudness is matched on momentary max. The levels are:
  - ignite -16 (the big moment)
  - goblins -18
  - smash about -20
  - throw -20
  - fizzle -21
  - crackle -26 (a bed)
- **Smash and crackle** go through a fast lookahead limiter (2 ms) with at most about 5.5 dB of gain reduction, applied only to the sharp crack and the biggest pops. The crackle loop was limited while tiled ×3, so the wrap is consistent.
- **Layers:**
  - throw = throw_b + throw_a (-6 dB, peak-aligned)
  - smash = smash_a + smash_c (-6 dB, +12 ms)
  - ignite = ignite_b with a -10 dB→0 dB swell over 110 ms and a 4 dB decay after 170 ms, plus ignite_c (punchy low whump) layered at +80 ms
- **Loop:** crackle_a from 0.45 to 2.45 s, with a 100 ms equal-power crossfade between the tail and the head.
- **Loop check:** the wrap step is 0.0001 (OGG) and 0.0004 (MP3), against a median sample step of 0.0015. The 50 ms RMS across the wrap is -34.4 and -36.3 dB, against a loop median of -34.4.
- Click/discontinuity scan found 0 spikes in every file. Every one-shot starts and ends at zero.
- The 24-bit WAV masters and all 15 raw ElevenLabs takes are in `_masters/fire/`.

## Picks and why
- **Throw:** throw_b has a pass-by envelope with whoosh body at 250 Hz–1 kHz. throw_a adds the bright flutter (8–16 kHz).
- **Smash:** smash_a is the only full-range take, with a sharp crack plus a low thump. smash_b is all highs above 2 kHz, so it's thin. smash_c is used as the splat layer.
- **Ignite:** ignite_b is the only full-range take, with low whomp and flame rush up to 8–16 kHz. ignite_a and ignite_c are dark, about -28 dB at 4 kHz. ignite_a also peaks late, at 286 ms. ignite_c is used for punch.
- **Crackle:** crackle_a has fuller mids and natural stereo. crackle_b has a hole at 1–2 kHz, about -23 dB.
- **Fizzle:** fizzle_a really sputters out over 0.7 s. fizzle_b dies in 60 ms.
- **Goblins:** gob_a and gob_c are mid-pitched and voiced around 1 kHz. gob_b is a sustained squeal at 1.5 kHz or above, which risks being shrill, so I rejected it.

## Generations and credits
The `character-cost` response header showed about 10 credits per second of generated audio.
**Total: 159 credits over 15 generations.** The spell set before this used 53.

| Take | Duration (s) | Prompt influence | Credits | Prompt |
|---|---|---|---|---|
| throw_a | 0.7 | 0.6 | 7 | A clay bottle thrown hard through the air, quick whoosh past with a burning cloth rag fuse fluttering and flapping, short, close, dry, medieval |
| throw_b | 0.7 | 0.5 | 7 | Fast spinning flaming bottle flying by, rushing air whoosh with fire flutter, short pass-by, no impact, no reverb |
| smash_a | 0.5 | 0.6 | 5 | Clay flask shattering on stone ground with a thick wet oily splash, sharp crack at the start, short, close, dry |
| smash_b | 0.5 | 0.6 | 5 | Ceramic pot smashes and breaks, pottery shards scatter with a heavy liquid splash of oil, sharp impact, short |
| smash_c | 0.5 | 0.5 | 5 | Glass and clay bottle bursting on impact with a gooey splatter, crunchy break, short, punchy, dry |
| ignite_a | 1.2 | 0.6 | 12 | Big satisfying whoomph of spilled oil igniting into a fireball, deep low fire whoosh burst then flames, immediate start, close, dry |
| ignite_b | 1.2 | 0.6 | 12 | Massive fire ignition burst, gasoline catching fire with a deep powerful woomp and roaring flame rush, sudden start, no reverb |
| ignite_c | 1.2 | 0.5 | 12 | Fireball erupts from the ground, punchy deep whump with rushing flames, cinematic but short, starts instantly |
| crackle_a | 3.0 | 0.5 | 30 | Steady crackling oil fire burning on the ground, wood and oil crackle and pops, constant soft flame roar, close, dry, continuous |
| crackle_b | 3.0 | 0.5 | 30 | Campfire burning steadily with lots of small crackles and pops and a gentle flame rumble, constant texture, no wind |
| fizzle_a | 0.8 | 0.6 | 8 | Small fire dying out, flames sputtering and fizzling out to nothing with a last few pops and a soft hiss, short |
| fizzle_b | 0.8 | 0.5 | 8 | Burning oil flames sputter, flicker and go out, gentle fizzle and smoke puff, quick fade to silence |
| gob_a | 0.6 | 0.6 | 6 | Small goblin creature yelps in pain from being burned, short raspy comic gremlin squeal ouch, not human, not too high |
| gob_b | 0.6 | 0.6 | 6 | Little goblin monster gets singed, short gravelly hurt grunt yelp, cartoon creature, comic and grim, mid pitched |
| gob_c | 0.6 | 0.5 | 6 | Tiny imp creature hurt cry, short croaky yelp of pain, video game monster vocal, raspy, not shrill |

## Caveat
Nobody has listened to these. Every check is a measurement: spectrum, envelope, pitch track, loudness, the click scan and the loop-wrap check.
