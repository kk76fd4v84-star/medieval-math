# Combat & walk SFX — knight math game (v1, 1 Nov 2026)

Nineteen walk and attack sounds in the same family as the blacksmith set: gritty medieval, a little humour, nothing gory. They are made only from **real recordings**: Freesound high-quality previews and Kenney's *Impact Sounds* pack. Processing was limited to trimming, EQ, light layering, small pitch offsets on footsteps and the heavy swing, one short room reverb (boss hit only), fades and gain/peak limiting. Nothing was synthesised and nothing was paid for.

**Licences:** every source is **CC0 1.0**: free for commercial use, **no attribution required** (authors are credited below as a courtesy). On 1 Nov 2026 the licence was confirmed on each Freesound sound's own page. Each page links only to `creativecommons.org/publicdomain/zero/1.0/`. Kenney's pack ships with a License.txt that says *Creative Commons Zero, CC0*.

Formats: each sound is `.ogg` (Vorbis q6, 48 kHz stereo) **and** `.mp3` (192 kb/s, 48 kHz). 24-bit WAV masters are in `_masters/`. `sfx_combat_preview.mp3` plays all 19 in the order below, with 0.6 s gaps and an extra 0.6 s between groups.

## Files and measurements

ffmpeg `ebur128=peak=true` on the OGGs. Files shorter than 0.4 s were padded with silence to one 400 ms gating block before measuring; on its own, ebur128 gives -70 for such short files.

| file | duration | integrated | true peak (ogg) | true peak (mp3) |
|---|---|---|---|---|
| sfx_step_01 | 0.399s | -17.1 LUFS | -2.2 dBTP | TP dBTP |
| sfx_step_02 | 0.369s | -17.4 LUFS | -2.1 dBTP | TP dBTP |
| sfx_step_03 | 0.382s | -17.3 LUFS | -1.8 dBTP | TP dBTP |
| sfx_step_04 | 0.431s | -17.3 LUFS | -2.0 dBTP | TP dBTP |
| sfx_step_05 | 0.390s | -17.5 LUFS | -1.8 dBTP | TP dBTP |
| sfx_step_06 | 0.411s | -17.2 LUFS | -2.2 dBTP | TP dBTP |
| sfx_swing_01 | 0.299s | -17.0 LUFS | -4.2 dBTP | TP dBTP |
| sfx_swing_02 | 0.332s | -17.1 LUFS | -2.8 dBTP | TP dBTP |
| sfx_swing_03 | 0.455s | -17.1 LUFS | -2.3 dBTP | TP dBTP |
| sfx_swing_04 | 0.532s | -17.8 LUFS | -4.3 dBTP | TP dBTP |
| sfx_hit_flesh_01 | 0.317s | -17.5 LUFS | -1.6 dBTP | TP dBTP |
| sfx_hit_flesh_02 | 0.183s | -17.6 LUFS | -1.5 dBTP | TP dBTP |
| sfx_hit_flesh_03 | 0.353s | -18.0 LUFS | -2.4 dBTP | TP dBTP |
| sfx_hit_flesh_04 | 0.329s | -17.8 LUFS | -1.5 dBTP | TP dBTP |
| sfx_hit_armour_01 | 0.383s | -17.5 LUFS | -3.8 dBTP | TP dBTP |
| sfx_hit_armour_02 | 0.389s | -17.7 LUFS | -3.6 dBTP | TP dBTP |
| sfx_hit_armour_03 | 0.351s | -17.6 LUFS | -3.4 dBTP | TP dBTP |
| sfx_hit_armour_04 | 0.474s | -17.5 LUFS | -3.1 dBTP | TP dBTP |
| sfx_hit_boss_01 | 0.708s | -17.3 LUFS | -1.9 dBTP | TP dBTP |

## Per-file sources and processing

### sfx_step_01
- "Footsteps_Boots_Gritty_Ground_(Gravel).wav" by **Nox_Sound**, https://freesound.org/s/530589/ (CC0 1.0): boot step at 0.020 s
- "Armor Chinks.WAV" by **lukabea**, https://freesound.org/s/707667/ (CC0 1.0): armour chink at 67.751 s, about -8 dB, 25 ms after the heel
- Kenney *Impact Sounds* (kenney.nl, CC0): Kenney Impact Sounds `footstep_grass_000.ogg`, about -12 dB, for grass/soil texture
- Processing: Boot high-passed at 60 Hz; chink high-passed at 1.5 kHz; grass at 150 Hz. Pitch +0.0 semitones (resample) for variation; weight: neutral. Cut to 0.46 s max, tail trimmed at -42 dB with an 80 ms fade. Normalised to about -17 LUFS (-16 to -18), true peak under -1 dBTP; cosine fades in and out.

### sfx_step_02
- "Footsteps_Boots_Gritty_Ground_(Gravel).wav" by **Nox_Sound**, https://freesound.org/s/530589/ (CC0 1.0): boot step at 2.152 s
- "Armor Chinks.WAV" by **lukabea**, https://freesound.org/s/707667/ (CC0 1.0): armour chink at 71.824 s, about -8 dB, 35 ms after the heel
- Kenney *Impact Sounds* (kenney.nl, CC0): Kenney Impact Sounds `footstep_grass_002.ogg`, about -12 dB, for grass/soil texture
- Processing: Boot high-passed at 60 Hz; chink high-passed at 1.5 kHz; grass at 150 Hz. Pitch -1.2 semitones (resample) for variation; weight: +2 dB at 120 Hz (heavier). Cut to 0.46 s max, tail trimmed at -42 dB with an 80 ms fade. Normalised to about -17 LUFS (-16 to -18), true peak under -1 dBTP; cosine fades in and out.

### sfx_step_03
- "Footsteps_Boots_Gritty_Ground_(Gravel).wav" by **Nox_Sound**, https://freesound.org/s/530589/ (CC0 1.0): boot step at 4.251 s
- "Armor Chinks.WAV" by **lukabea**, https://freesound.org/s/707667/ (CC0 1.0): armour chink at 104.013 s, about -8 dB, 45 ms after the heel
- Kenney *Impact Sounds* (kenney.nl, CC0): Kenney Impact Sounds `footstep_grass_001.ogg`, about -12 dB, for grass/soil texture
- Processing: Boot high-passed at 60 Hz; chink high-passed at 1.5 kHz; grass at 150 Hz. Pitch +0.8 semitones (resample) for variation; weight: neutral. Cut to 0.46 s max, tail trimmed at -42 dB with an 80 ms fade. Normalised to about -17 LUFS (-16 to -18), true peak under -1 dBTP; cosine fades in and out.

### sfx_step_04
- "Footsteps_Boots_Gritty_Ground_(Gravel).wav" by **Nox_Sound**, https://freesound.org/s/530589/ (CC0 1.0): boot step at 6.359 s
- "Armor Chinks.WAV" by **lukabea**, https://freesound.org/s/707667/ (CC0 1.0): armour chink at 122.453 s, about -8 dB, 25 ms after the heel
- Kenney *Impact Sounds* (kenney.nl, CC0): Kenney Impact Sounds `footstep_grass_003.ogg`, about -12 dB, for grass/soil texture
- Processing: Boot high-passed at 60 Hz; chink high-passed at 1.5 kHz; grass at 150 Hz. Pitch -2.0 semitones (resample) for variation; weight: +3 dB at 120 Hz (heaviest). Cut to 0.46 s max, tail trimmed at -42 dB with an 80 ms fade. Normalised to about -17 LUFS (-16 to -18), true peak under -1 dBTP; cosine fades in and out.

### sfx_step_05
- "Footsteps_Boots_Gritty_Ground_(Gravel).wav" by **Nox_Sound**, https://freesound.org/s/530589/ (CC0 1.0): boot step at 8.400 s
- "Armor Chinks.WAV" by **lukabea**, https://freesound.org/s/707667/ (CC0 1.0): armour chink at 52.701 s, about -8 dB, 35 ms after the heel
- Kenney *Impact Sounds* (kenney.nl, CC0): Kenney Impact Sounds `footstep_grass_004.ogg`, about -12 dB, for grass/soil texture
- Processing: Boot high-passed at 60 Hz; chink high-passed at 1.5 kHz; grass at 150 Hz. Pitch +0.4 semitones (resample) for variation; weight: 140 Hz high-pass (lightest). Cut to 0.46 s max, tail trimmed at -42 dB with an 80 ms fade. Normalised to about -17 LUFS (-16 to -18), true peak under -1 dBTP; cosine fades in and out.

### sfx_step_06
- "Footsteps_Boots_Gritty_Ground_(Gravel).wav" by **Nox_Sound**, https://freesound.org/s/530589/ (CC0 1.0): boot step at 9.416 s
- "Armor Chinks.WAV" by **lukabea**, https://freesound.org/s/707667/ (CC0 1.0): armour chink at 89.233 s, about -8 dB, 45 ms after the heel
- Kenney *Impact Sounds* (kenney.nl, CC0): Kenney Impact Sounds `footstep_grass_000.ogg`, about -12 dB, for grass/soil texture
- Processing: Boot high-passed at 60 Hz; chink high-passed at 1.5 kHz; grass at 150 Hz. Pitch -0.6 semitones (resample) for variation; weight: +1 dB at 120 Hz. Cut to 0.46 s max, tail trimmed at -42 dB with an 80 ms fade. Normalised to about -17 LUFS (-16 to -18), true peak under -1 dBTP; cosine fades in and out.

### sfx_swing_01
- "Sword Swipes" by **deleted_user_6479820 (account since deleted; sound still public)**, https://freesound.org/s/380488/ (CC0 1.0): swipe at 3.455–3.770 s
- Processing: 90 Hz high-pass, 4 ms fade-in and 60 ms fade-out. Dry. Normalised to about -17 LUFS (-16 to -18), true peak under -1 dBTP; cosine fades in and out.

### sfx_swing_02
- "Sword Swipes" by **deleted_user_6479820 (account since deleted; sound still public)**, https://freesound.org/s/380488/ (CC0 1.0): swipe at 4.147–4.500 s
- Processing: 90 Hz high-pass, 4 ms fade-in and 60 ms fade-out. Dry. Normalised to about -17 LUFS (-16 to -18), true peak under -1 dBTP; cosine fades in and out.

### sfx_swing_03
- "Clean fast Swoosh.aiff" by **Danjocross**, https://freesound.org/s/507466/ (CC0 1.0): 0.12–0.62 s
- Processing: 90 Hz high-pass, 20 ms fade-in and 150 ms fade-out. Dry. Normalised to about -17 LUFS (-16 to -18), true peak under -1 dBTP; cosine fades in and out.

### sfx_swing_04
- "Sword Swipes" by **deleted_user_6479820 (account since deleted; sound still public)**, https://freesound.org/s/380488/ (CC0 1.0): longest swipe at 1.092–1.600 s, pitched down 2 semitones
- "FX - Swoosh - Low Pitch" by **bolkmar**, https://freesound.org/s/475135/ (CC0 1.0): low swoosh at 0.05–0.62 s, -2 dB
- Processing: Layered for a heavier swing; 120 ms fade-out. Dry. Normalised to about -17 LUFS (-16 to -18), true peak under -1 dBTP; cosine fades in and out.

### sfx_hit_flesh_01
- "Punch Punching Fist To Skin Hit" by **deleted_user_7146007 (account since deleted; sound still public)**, https://freesound.org/s/383882/ (CC0 1.0): punch at 10.872 s
- "clothing and punching" by **launemax**, https://freesound.org/s/250031/ (CC0 1.0): low body thump at 56.856 s, low-passed at 3 kHz
- Processing: 45 Hz high-pass; tail trimmed at -55 dB; gentle peak limiting. Normalised to about -17 LUFS (-16 to -18), true peak under -1 dBTP; cosine fades in and out.

### sfx_hit_flesh_02
- "Punch_02.wav" by **thefsoundman**, https://freesound.org/s/118513/ (CC0 1.0): 0.045–0.25 s
- "clothing and punching" by **launemax**, https://freesound.org/s/250031/ (CC0 1.0): low thump at 16.331 s, low-passed at 3 kHz
- Processing: Same as flesh_01. Normalised to about -17 LUFS (-16 to -18), true peak under -1 dBTP; cosine fades in and out.

### sfx_hit_flesh_03
- "Major punch" by **janbezouska**, https://freesound.org/s/399183/ (CC0 1.0): punch body at 0.095–0.50 s, without its pre-whoosh
- "clothing and punching" by **launemax**, https://freesound.org/s/250031/ (CC0 1.0): low thump at 11.732 s, low-passed at 3 kHz
- Processing: Same as flesh_01. The heaviest of the four. Normalised to about -17 LUFS (-16 to -18), true peak under -1 dBTP; cosine fades in and out.

### sfx_hit_flesh_04
- "Punch Punching Fist To Skin Hit" by **deleted_user_7146007 (account since deleted; sound still public)**, https://freesound.org/s/383882/ (CC0 1.0): punch at 1.454 s
- "splat.ogg" by **gprosser**, https://freesound.org/s/360942/ (CC0 1.0): splat at 0.035–0.42 s, about -7 dB, 15 ms later
- Processing: **Comic squelch.** The splat sits under the punch, short and wet but not gory. Normalised to about -17 LUFS (-16 to -18), true peak under -1 dBTP; cosine fades in and out.

### sfx_hit_armour_01
- "S09-02 metal armor helmet open & close; hinges and clanks.wav" by **craigsmith**, https://freesound.org/s/675817/ (CC0 1.0): armour/helmet clank at 13.619 s
- "Sword - Metallic hits, train" by **Vrymaa**, https://freesound.org/s/734606/ (CC0 1.0): sword strike at 3.600 s, -6 dB, high-passed at 200 Hz
- Processing: 60 Hz high-pass; tail trimmed at -45 dB with a 60 ms fade. Dry. Normalised to about -17 LUFS (-16 to -18), true peak under -1 dBTP; cosine fades in and out.

### sfx_hit_armour_02
- "S09-02 metal armor helmet open & close; hinges and clanks.wav" by **craigsmith**, https://freesound.org/s/675817/ (CC0 1.0): clank at 10.686 s
- "More Metal Imapcts - Various" by **mihnelis**, https://freesound.org/s/867743/ (CC0 1.0): metal impact at 11.345 s, -7 dB
- Processing: Same as armour_01. Normalised to about -17 LUFS (-16 to -18), true peak under -1 dBTP; cosine fades in and out.

### sfx_hit_armour_03
- "S09-02 metal armor helmet open & close; hinges and clanks.wav" by **craigsmith**, https://freesound.org/s/675817/ (CC0 1.0): clank at 15.303 s
- "clank.wav" by **Empiremonkey**, https://freesound.org/s/616492/ (CC0 1.0): clank at 0.085 s, -6 dB
- Processing: Same as armour_01. Normalised to about -17 LUFS (-16 to -18), true peak under -1 dBTP; cosine fades in and out.

### sfx_hit_armour_04
- "Bonk.wav" by **Harrisando**, https://freesound.org/s/466202/ (CC0 1.0): bonk at 0.20–0.75 s
- "S09-02 metal armor helmet open & close; hinges and clanks.wav" by **craigsmith**, https://freesound.org/s/675817/ (CC0 1.0): clank at 11.587 s, -7 dB
- Processing: **Comic bonk** on a helmet; 120 ms fade-out. Normalised to about -17 LUFS (-16 to -18), true peak under -1 dBTP; cosine fades in and out.

### sfx_hit_boss_01
- "Heavy Impacts" by **Nightflame**, https://freesound.org/s/397596/ (CC0 1.0): low impact at 9.600 s
- "S09-02 metal armor helmet open & close; hinges and clanks.wav" by **craigsmith**, https://freesound.org/s/675817/ (CC0 1.0): armour crunch at 10.686 s, -2.5 dB
- "Sword - Metallic hits, train" by **Vrymaa**, https://freesound.org/s/734606/ (CC0 1.0): sword strike at 4.06 s, -8 dB
- "ANI Big Pipe Hit" by **ani_music**, https://freesound.org/s/244983/ (CC0 1.0): pipe boom, -7 dB, low-passed at 6 kHz
- Processing: Four layers; short room reverb (RT about 0.55 s, 14 % wet) for the tail; tail trimmed at -50 dB with a 300 ms fade; peak limiting of about 2 dB to reach the loudness target. Normalised to about -17 LUFS (-16 to -18), true peak under -1 dBTP; cosine fades in and out.

## Source list (all CC0 1.0, confirmed on each page on 1 Nov 2026)

| id | sound | author | page |
|---|---|---|---|
| 530589 | Footsteps_Boots_Gritty_Ground_(Gravel).wav | Nox_Sound | https://freesound.org/s/530589/ |
| 707667 | Armor Chinks.WAV | lukabea | https://freesound.org/s/707667/ |
| 380488 | Sword Swipes | deleted_user_6479820 (account since deleted; sound still public) | https://freesound.org/s/380488/ |
| 507466 | Clean fast Swoosh.aiff | Danjocross | https://freesound.org/s/507466/ |
| 475135 | FX - Swoosh - Low Pitch | bolkmar | https://freesound.org/s/475135/ |
| 383882 | Punch Punching Fist To Skin Hit | deleted_user_7146007 (account since deleted; sound still public) | https://freesound.org/s/383882/ |
| 250031 | clothing and punching | launemax | https://freesound.org/s/250031/ |
| 118513 | Punch_02.wav | thefsoundman | https://freesound.org/s/118513/ |
| 399183 | Major punch | janbezouska | https://freesound.org/s/399183/ |
| 360942 | splat.ogg | gprosser | https://freesound.org/s/360942/ |
| 675817 | S09-02 metal armor helmet open & close; hinges and clanks.wav | craigsmith | https://freesound.org/s/675817/ |
| 734606 | Sword - Metallic hits, train | Vrymaa | https://freesound.org/s/734606/ |
| 867743 | More Metal Imapcts - Various | mihnelis | https://freesound.org/s/867743/ |
| 616492 | clank.wav | Empiremonkey | https://freesound.org/s/616492/ |
| 466202 | Bonk.wav | Harrisando | https://freesound.org/s/466202/ |
| 397596 | Heavy Impacts | Nightflame | https://freesound.org/s/397596/ |
| 244983 | ANI Big Pipe Hit | ani_music | https://freesound.org/s/244983/ |
| Kenney | Impact Sounds: footstep_grass_000..004 | Kenney Vleugels (kenney.nl) | https://kenney.nl/assets/impact-sounds |

## Checks (1 Nov 2026)
- Loudness: all 19 sit between -17.0 and -18.0 LUFS (OGG); the MP3s are within 0.3 LU. True peak: all at -1.5 dBTP or lower (OGG and MP3).
- Clicks: a high-frequency discontinuity scan (10 kHz high-pass, peak vs local RMS) on every master. The only reading above the threshold is the intended bonk attack in armour_04 at 20 ms. The highest of the others are natural gravel and chainmail transients in the steps (10–13). Every file starts and ends at zero.
- Durations: steps 0.37–0.43 s, swings 0.30–0.53 s, flesh 0.18–0.35 s, armour 0.35–0.47 s, boss 0.71 s.

## Rebuild
The scripts and raw downloads are in `/workspace/snd_knight/` (`build2.py`, `km.py`, `check2.py`, `sources.json`, `raw/`). They are outside the game folder.
