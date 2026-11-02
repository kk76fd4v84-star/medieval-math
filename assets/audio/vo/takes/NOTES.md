# vo_further_than_ever: bard narrator test takes (free local test)

Line: "The knight ventures further into the unknown than ever before."
Generated 2026-11-01 on the box, CPU only. Nothing in the game is wired to these yet.

## Takes
| File | Delivery | Model / voice | Generation settings | Post |
|---|---|---|---|---|
| take1.ogg (5.8 s) | Warm and steady: deepest voice (~89 Hz median), even pace, small natural beat after "unknown" | Chatterbox TTS (ResembleAI/chatterbox, original 0.5B), zero-shot from synthetic ref "lewis_low" | exaggeration 0.3, cfg_weight 0.4, temp 0.8, seed 4 | pitch x0.98, tempo x0.93, room RT 0.45 s, wet -17 dB |
| take2.ogg (6.7 s) | Theatrical: slowest and most sung, ~0.7 s dramatic pause before "into the unknown", second beat before "than ever before" | Chatterbox, ref "george_low" | text with em-dashes, exaggeration 0.7, cfg_weight 0.3, temp 0.8, seed 5; pause stretched 0.44 to 0.7 s in edit | pitch x0.95, tempo x0.95, RT 0.5 s, wet -16 dB |
| take3.ogg (5.1 s) | Drier and wry: quicker, more conversational, short knowing beat before "than ever before" | Chatterbox, ref "fable_low" | exaggeration 0.3, cfg_weight 0.4, temp 0.8, seed 3; beat stretched to ~0.42 s in edit | pitch x0.96, tempo x0.95, RT 0.4 s, wet -18 dB |

preview.mp3: take1, take2 and take3 in a row with 1 s gaps (19.6 s, 192 kbps).

## Reference voices (no real person cloned)
Chatterbox needs a reference clip. Each reference was a ~15 to 20 s storytelling passage that I wrote, read by **Kokoro-82M** stock British male voices (bm_lewis, bm_george, bm_fable) at speed 0.8, then lowered 10% in pitch for age. These are synthetic voices, not recordings of an identifiable person.

## Post chain
librosa trim, optional pause stretch at a measured silence, resample to 48 kHz (soxr), rubberband pitch/tempo (formants shifted with the pitch for a bigger, older timbre), HPF 70 Hz, low shelf +2.5 dB at 220 Hz, -2 dB at 3.2 kHz, high shelf -3 dB at 9.5 kHz, de-esser, 2.2:1 compressor, synthetic small wood-room IR (stereo, LPF 4.5 kHz), faint pink room-tone bed at about -63 dBFS RMS, 0.45 s pre-roll and 0.9 s tail with fade in/out, normalised to -18 LUFS, limiter, Vorbis q6, 48 kHz stereo.

Measured on the final OGGs (ffmpeg ebur128): take1 -18.1 LUFS / -4.4 dBTP, take2 -17.9 / -5.0, take3 -18.0 / -5.9.

## Transcription check (faster-whisper tiny.en and small.en, CPU int8)
All 3 takes read back as "The [k]night ventures further into the unknown than ever before." with both models. "night" is just a homophone, and there were no missing, extra or garbled words.

## Rejected candidates
I generated 45 Chatterbox and 16 Kokoro candidates (raw files in /workspace/tts-work). 4 failed the transcription check (dropped words or garbled starts). I chose between the rest on pitch, pace, pause placement and an automatic quality estimate (torchaudio SQUIM). I could not listen to them.

## Licences
- Chatterbox TTS (resemble-ai/chatterbox): MIT. Outputs carry Resemble's inaudible Perth watermark, which is built in and on by default.
- Kokoro-82M (hexgrad) and its voices: Apache-2.0.
- faster-whisper: MIT. Whisper weights: MIT.
- Room IR and room tone: generated procedurally here, with no third-party samples.

## Regenerate
venv: /workspace/tts-env (Python 3.11, torch 2.6.0+cpu, chatterbox-tts 0.1.7, kokoro). Scripts: /workspace/tts-work/{ref2.py, cb2.py, post.py, takes.json, ana.py}.
