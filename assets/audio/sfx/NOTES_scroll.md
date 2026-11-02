# Scroll of Stupidity SFX

These were made with the ElevenLabs Sound Effects API on Magnus's Starter account, then mastered with ffmpeg/numpy using the same chain as the fire bottle set.
Each sound comes as `.ogg` (Vorbis q6, 48 kHz) and `.mp3` (LAME V2, 48 kHz), and every sound is stereo.

| File | Length | Loudness (momentary max) | True peak | Suggested volume | Sound |
|---|---|---|---|---|---|
| scroll_buy_1 | 0.85 s | -17.9 LUFS | -3.2 dBTP | 0.8 | Silver coins dropped onto a wooden counter, a short slide, then a leather purse pulled shut, with a soft wooden thud under the first coin |
| scroll_buy_2 | 0.95 s | -18.0 LUFS | -6.6 dBTP | 0.8 | A coin pouch plonked onto an oak counter (wooden thud under it), a chunky jingle, then a satisfied tap |
| scroll_get_1 | 0.62 s | -20.0 LUFS | -3.7 dBTP | 0.7 | Parchment rolled up tight and tucked into a leather satchel, with a rustle and a soft leather bump (stereo) |
| scroll_get_2 | 0.72 s | -21.5 LUFS | -2.6 dBTP | 0.7 | Dry paper crinkle and rustle as the scroll is stuffed into the pack |
| scroll_use_1 | 0.55 s | -20.1 LUFS | -2.4 dBTP | 0.9 | A crisp, quick snap-open of stiff parchment, with a short papery tail |
| scroll_use_2 | 0.72 s | -18.1 LUFS | -2.8 dBTP | 0.9 | A papery whoosh-unfurl that builds over about 0.5 s to a crisp flick open (wide stereo) |

`scroll_preview.mp3` (7.3 s) plays buy_1, buy_2, get_1, get_2, use_1 and use_2 in that order.

Use: play `scroll_buy_*` on purchase, `scroll_get_*` when the scroll goes into the pack, and `scroll_use_*` when it's cast. Pick the variant at random.

## Mastering
- High-pass at 30–40 Hz and head trimmed so each sound starts at 0–2 ms. use_2 is a swell that starts at 0 ms and reaches -20 dB at about 35 ms.
- Cosine fade-out over 150 ms.
- **Coins:** every ElevenLabs coin take came out thin and very bright (the 8 kHz octave was 25–40 dB above everything below 1 kHz).
  - So the buy sounds have a gentle -3.5 dB bell at 8.5 kHz (Q 0.7).
  - They also have a separately generated wooden "thud" take (`thunk_a`) layered under the first coin hit, at -4 dB (buy_1) and -3 dB (buy_2), for weight.
  - There are no chimes or beeps; the "confirmation" is the purse cinch or the final tap.
- **Loudness:** matched on momentary max, about -18 for buy and use and -20 to -21.5 for get. A 2 ms lookahead limiter takes at most 4.9 dB off the paper snaps; get_2 and use_1 were lowered to keep it there. True peak is at or below -2.4 dBTP.
- **Click scan:** 0 discontinuities, apart from one natural paper-crackle transient in get_2 at 0.61 s. That one is in the raw take, not an edit. Every file starts and ends at zero.
- `_masters/` holds the 24-bit WAV masters and all 12 raw ElevenLabs takes.

## Picks
- **buy:** buy_a and buy_d are the only takes with a purse or pouch body, around 1 kHz. buy_b, buy_c and buy_e were coins only, all above 4 kHz.
- **get:** get_a and get_c are full-range rustle. get_b was mostly 63 Hz rumble.
- **use:** use_a and use_c are crisp and full-range. use_b was dull, -17 dB at 4 kHz.

## Credits
The `character-cost` response header gives about 10 credits per second of generated audio.
**Total: 103 credits over 12 generations.**

| Take | Duration (s) | Prompt influence | Credits | Prompt |
|---|---|---|---|---|
| buy_a | 1.0 | 0.6 | 10 | A few silver coins dropped onto a wooden tavern counter, small clinks and a soft slide, then a leather purse pulled shut, close, dry, medieval |
| buy_b | 1.0 | 0.6 | 10 | Small leather coin purse jingle as coins are handed over, then coins set down on a wooden table with a satisfying settle, close and dry, no music |
| buy_c | 1.0 | 0.5 | 10 | Medieval shop purchase: a handful of coins clinks onto a wooden counter and is swept up, short, warm, natural foley, no chime |
| get_a | 0.8 | 0.6 | 8 | Old parchment scroll quickly rolled up tight and tucked into a leather satchel, paper rustle and soft leather thump, close foley, dry |
| get_b | 0.8 | 0.6 | 8 | Rolled parchment rustling and sliding into a cloth bag, short crisp paper handling foley, close, no reverb |
| get_c | 0.8 | 0.5 | 8 | A scroll being rolled and stuffed into a pack, dry paper crinkle and rustle, short, close |
| use_a | 0.8 | 0.6 | 8 | A parchment scroll snapped open, crisp quick unroll and unfurl of stiff old paper, single motion, close foley, dry |
| use_b | 0.8 | 0.6 | 8 | Old vellum scroll unfurling with a crisp flap and rustle, dramatic but short, close, no reverb, no magic |
| use_c | 0.8 | 0.5 | 8 | Quick crisp unrolling of a dry paper scroll, flick open with a papery whoosh, short, close |
| buy_d | 1.0 | 0.6 | 10 | A heavy leather pouch of gold coins plonked down on a thick oak tavern counter, solid wooden thunk with a chunky coin jingle, then a satisfied tap, close, dry, no music |
| buy_e | 1.0 | 0.6 | 10 | Three large copper coins slapped one by one onto a wooden counter, warm woody knocks with dull clinks, then pushed across, close foley, dry |
| thunk_a | 0.5 | 0.7 | 5 | A single dull heavy thud of a full leather bag set down on a thick wooden table, deep woody knock, no metal, no jingle, close, dry |

## Caveat
Nobody has listened to these. Every check is a measurement.
