# Answer-feedback SFX — blacksmith set (v1, 1 Nov 2026)

All six sounds are made from **real recordings only** (no synthesis). Processing was limited to trimming, EQ, light layering (only in correct_02, which joins two strikes from one recording), a light short "forge room" reverb, fades and gain/limiting.

**Licences:** every source is **CC0 1.0** (public-domain dedication; free for commercial use, **no attribution required**). The licence was checked on each sound's own Freesound page when it was downloaded (1 Nov 2026); the build script refuses any page that isn't CC0. The audio was taken from Freesound's public high-quality preview stream (Vorbis ~192 kb/s, 44.1 kHz, resampled to 48 kHz). Authors are credited below as a courtesy.

| file | dur | integrated | true peak | what it is |
|---|---|---|---|---|
| sfx_correct_01.ogg | 1.19 s | -16.6 LUFS | -4.4 dBTP | one clean, resonant hammer strike on a steel anvil, natural ring |
| sfx_correct_02.ogg | 1.30 s | -15.9 LUFS | -2.7 dBTP | **tink-TANG** double strike: light tap, then a full ringing strike |
| sfx_correct_03.ogg | 0.99 s | -17.3 LUFS | -2.4 dBTP | single strike on a bigger 125 kg anvil, different ring |
| sfx_wrong_01.ogg | 0.81 s | -18.1 LUFS | -2.5 dBTP | dull, dead metal clunk |
| sfx_wrong_02.ogg | 0.84 s | -18.0 LUFS | -2.5 dBTP | soft mis-hit thud on metal with a small bounce |
| sfx_wrong_03.ogg | 1.19 s | -17.8 LUFS | -3.0 dBTP | short hiss of hot steel quenched in water |

(Values measured on the OGGs with ffmpeg `ebur128=peak=true`.) Format: OGG Vorbis q6, 48 kHz stereo. 24-bit WAV masters are in `_masters/`. `sfx_preview.mp3` plays all six in the order above with 0.8 s gaps.

Wrong sounds sit about 1–2 LU below the correct ones and are softened in the top end (high shelf -3 to -4 dB) so they are not harsh for kids.

## Per-file sources and processing

### sfx_correct_01.ogg
- Source: "Hammer and anvil" by **Duasun**, https://freesound.org/people/Duasun/sounds/321889/ (CC0 1.0). Strike at 2.534 s, 1.35 s cut.
- Processing: 70 Hz high-pass; -2 dB bell at 5.2 kHz and -2 dB shelf above 9 kHz (keeps it bright, not shrill); +2 dB around 220 Hz for hammer body; light forge-room reverb (RT ~0.45 s, 10 % wet); tail trimmed at -50 dB with a 0.25 s cosine fade; normalised to about -17 LUFS, true peak under -1.5 dBTP.

### sfx_correct_02.ogg (double strike)
- Source: the same Duasun recording, https://freesound.org/people/Duasun/sounds/321889/ (CC0 1.0). The "tink" is the light strike at 8.990 s (0.30 s, -7.5 dB, quick fade); the "TANG" is the full strike at 5.226 s (1.25 s), placed 0.19 s later.
- Processing: same EQ, reverb, tail trim and limiting as correct_01; normalised to about -16 LUFS.

### sfx_correct_03.ogg
- Source: "Anvil - Lokomo 125 kg - Hammer on 6mm steel 1 time" by **ldezem**, https://freesound.org/people/ldezem/sounds/386129/ (CC0 1.0). 0–1.35 s.
- Processing: 1.5 ms fade-in (the upload starts right on the transient); same EQ and reverb as above; tail trim and fade; about -17 LUFS.

### sfx_wrong_01.ogg
- Source: "Metallic clunk.wav" by **michael_grinnell**, https://freesound.org/people/michael_grinnell/sounds/512475/ (CC0 1.0). 0.045–0.98 s.
- Processing: 60 Hz high-pass; -3 dB shelf above 7 kHz; light room reverb (8 %); tail trim and fade; about -18 LUFS, true peak under -2 dBTP.

### sfx_wrong_02.ogg
- Source: "metal-thud.wav" by **CaptainYulef**, https://freesound.org/people/CaptainYulef/sounds/638613/ (CC0 1.0). 0.035–0.90 s, including its natural small bounce.
- Processing: 50 Hz high-pass; -3 dB shelf above 7 kHz; light room reverb (8 %); tail trim and fade; about -18 LUFS.

### sfx_wrong_03.ogg
- Source: "Steel - Hot steel into water" by **ldezem**, https://freesound.org/people/ldezem/sounds/386212/ (CC0 1.0). 0.12–1.35 s.
- Processing: 120 Hz high-pass; one bubble pop at 0.075 s smoothed (declick); exponential decay envelope so the hiss dies away; -4 dB shelf above 6 kHz and a gentle 12 kHz low-pass to keep it soft; 0.4 s fade; about -18 LUFS.

## Checks (1 Nov 2026)
- Loudness and true peak: ffmpeg ebur128 (table above). All between -15.9 and -18.1 LUFS integrated; all true peaks at -2.4 dBTP or lower.
- Clicks: a high-frequency discontinuity scan (10 kHz high-pass, peak vs local RMS) found nothing above the threshold. The highest reading is the intended hammer transient in correct_02. Every file starts and ends at (near) zero with cosine fades.
- Durations: all between 0.81 and 1.30 s.

## Rebuild
The scripts are in `/workspace/snd_knight/` (`build.py`, `km.py`, `dl.py`, `sources.json`, raw downloads in `raw/`). They are outside the game folder.
