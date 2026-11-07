# Export verification — 7 November 2026

Snapshot: current local game through `woodcut-timer-46`, prepared for Grok and an
update to the existing GitHub project. This file records local checks, **not a
successful remote push or deployment**.

## Changes made for this handoff

- Added `GROK_HANDOFF.md`, this report, `GITHUB_PUBLISH.md` and `.gitignore`.
- Added current-entry links to README, historical HANDOFF and agent instructions.
- Refreshed the loading-byte manifest from the included image/audio files (686).
- Changed the scenery review’s two links and iframe, and the tomb return link,
  to relative URLs so they stay inside a GitHub Pages repository subdirectory.
- Updated the `src/game.js` cache key for that navigation fix.
- Made the current woodcut timer browser test accept `CHROME_PATH` or Playwright’s
  bundled Chromium, and use a portable temporary output folder.
- No combat values, artwork, animation, audio content or saved player data changed.

## Checks run on the export

All 91 JavaScript files in `src/` passed `node --check`. Entry-page local script,
stylesheet and navigation references resolved. No file exceeds 8 MB.

17 focused tests passed:

```text
math-timer             timing-block           party-pressure
enemy-pressure         fellowship             equipment-cap
replacement            hollowwood             score-leaderboard
economy                action-cards           knight
mode-retirement        wizard-japanese        chapter-music
audio-world            music-silence
```

Muted Playwright checks passed using fresh browser storage:

- `woodcut-timer-play.test.js`: Village Idiot, Knight, Fellowship, tomb, riddle,
  EN/JA tooltips, fill/threshold/hit alignment, full timer, narrow viewport,
  icon input isolation and successful asset loading; no HTTP/JavaScript errors.
- `tomb-memorials.test.js`: casualty/fall, persistent skeleton on a later run and
  reload, no duplicate live body/skeleton, resurrection cleanup, campaign data
  unchanged; no HTTP/JavaScript errors. Its first invocation lacked Playwright;
  it passed after supplying the installed dependency.
- GitHub-style `/medieval-math/` local subdirectory smoke check: game and scenery
  review load; review navigation remains inside the subdirectory.

This is focused verification, not a full assertion that every historical test or
every game balance/art concern is resolved. No test touched the designer’s active
browser profile or played music.

## Repeating the checks

Runtime needs only a static server:

```sh
python3 -m http.server 8801
```

In a second terminal, from the project root:

```sh
node tests/math-timer.test.js
node tests/timing-block.test.js
node tests/party-pressure.test.js
node tests/fellowship.test.js
node tests/equipment-cap.test.js
```

For browser checks, install Playwright locally (do not commit `node_modules`),
install its Chromium, then run the timer check against the served project:

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
URL=http://localhost:8801 node tests/woodcut-timer-play.test.js
```

`CHROME_PATH` may point to an existing Chrome binary. Some older browser tests still
contain the original macOS Chrome path or use port8860; inspect their header and
set `URL`/output paths before running. Keep `--mute-audio` and isolated contexts.

The source checksum manifest lists all delivered files except itself. Backups,
bulk review images, temporary files, `.orig` copies and browser saves are excluded.
