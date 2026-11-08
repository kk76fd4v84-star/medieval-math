# Medieval Math – number-entry SFX v9 (Magnus's pack, minimal processing)
Each file is Magnus's original audio, only cut, resampled and gain-adjusted. Source: `_magnus_pack/`. v8 is backed up in `_v8/`. Build script: `_raw/build_keys_v9.py`.
Processing is only:
- a cut starting right at the transient (onset at sample 0)
- a 3 ms fade at the very end
- 44.1 → 48 kHz resampling (soxr), keeping the original stereo
- one clean gain per file. Digits are set to -20 LUFS, Enter to -15 LUFS. Where -20 LUFS would push a peak over -1 dBTP, the gain is lower instead.
No pitch shifting, EQ, layering, compression or limiting.
Output: 48 kHz 24-bit stereo WAV, plus .ogg q6 and .mp3 V2.
Digits run roughly darker to brighter, ordered by measured brightness (spectral centroid).

| File | Source hit | Duration | Loudness | True peak | Game volume |
|---|---|---|---|---|---|
| key_digit_0 | Blacksmith 08, hit 1 of the run | 120 ms | -20.0 LUFS | -9.1 dBTP | 0.8 |
| key_digit_1 | Blacksmith 07, hit 4 | 124 ms | -20.0 | -9.2 | 0.8 |
| key_digit_2 | Blacksmith 07, hit 2 | 129 ms | -20.0 | -9.7 | 0.8 |
| key_digit_3 | Blacksmith 08, hit 4 | 142 ms | -20.0 | -11.5 | 0.8 |
| key_digit_4 | Blacksmith 02, whole hit | 339 ms | -20.9 (peak-capped) | -1.0 | 0.8 |
| key_digit_5 | Blacksmith 06, hit 4 | 138 ms | -20.0 | -12.0 | 0.8 |
| key_digit_6 | Blacksmith 05, whole hit | 332 ms | -21.7 (peak-capped) | -1.0 | 0.8 |
| key_digit_7 | Blacksmith 01, whole hit | 347 ms | -20.0 | -1.4 | 0.8 |
| key_digit_8 | Blacksmith 08, hit 6 | 133 ms | -20.0 | -7.8 | 0.8 |
| key_digit_9 | Blacksmith 06, hit 5 | 126 ms | -20.0 | -11.7 | 0.8 |
| key_enter_heavy | Blacksmith 03, whole strike | 1049 ms | -15.0 | -1.4 | 1.0 |
| key_delete | Locker 10, whole | 249 ms | -20.0 | -2.3 | 0.6 |
| enter_wrong | unchanged | 300 ms | -20.4 | -3.8 | 0.8 |
| enter_miss_whoosh | unchanged | 326 ms | -27.5 | -12.3 | 0.7 |

Hits from the Blacksmith 06/07/08 runs end about 25 ms before the next strike in the original, because the strikes overlap in the recording.
keys_preview.mp3: digits 0–9, then 3 7 2 Enter, delete, wrong and miss.
