# Medieval Math: notes for AI coding agents

Plain HTML/JS canvas game (1600x900 stage), no build step. Live: https://kk76fd4v84-star.github.io/medieval-math/

Read first:
- `HANDOFF.md`: version-by-version log of every design decision and change (newest at the bottom). Follow it.
- `README.md`: architecture, data files, voice-over hooks, art config.

Run locally: `python3 -m http.server 8799` in the repo root, then open http://localhost:8799/ (`?debug` adds `__km` helpers, `?notimer` disables the answer timer).
Tests: Playwright scripts in `tests/` (e.g. `URL=http://localhost:8799/index.html node tests/play.test.js`).

House rules (from the designer, Magnus):
- Keep code simple, clean and super structured: data in `src/data/` and `src/config/`, logic in small modules. A Godot port is planned later.
- Draw art at its exact source size × the single global `artScale` (0.6). Use only the provided art; don't generate new art.
- Clean UI with no clutter and no key labels on buttons (mouse or trackpad first; the keys still work). Every bottom button uses Maggi's ornamented 9-slice frame (`src/config/ui_frames.js`).
- Sums must be solvable in your head in about 10–15 s (35 s answer timer).
- All narrator VO uses the ElevenLabs "Callum" voice (see `incoming/vo_narrator/NOTES.md`).
