# Medieval Math — moment-of-loss frames / v2

18 single-cell RGBA PNGs for nine living companions. PIL only; **zero generations**. v1 files are untouched. No repository edits, integration, commit or push.

## Registration and usage

Untrimmed source walk frame 0 is the reference pose. Coordinates below are cell-local pixels measured from the upper-left; **pivot = anchor**. The registration point and canvas stay fixed while the cut-out flinches 5° (arm) / 6.5° (leg) around that point. Reuse the original draw scale/artMul; do not auto-trim or recalculate the anchor from the flying limb. Each file is one hurt/event frame, not an atlas. `frames.json` supplies explicit machine-readable registration. PNG itself has no game-pivot metadata.

| File | Cell size | Pivot / anchor | Source |
|---|---|---|---|
| `frank_lose_arm.png` | 512 × 512 | (256, 475) | `assets/party-roles/frank.png`, frame 0 |
| `frank_lose_leg.png` | 512 × 512 | (256, 475) | `assets/party-roles/frank.png`, frame 0 |
| `executioner_lose_arm.png` | 512 × 512 | (256, 480) | `assets/party-roles/executioner.png`, frame 0 |
| `executioner_lose_leg.png` | 512 × 512 | (256, 480) | `assets/party-roles/executioner.png`, frame 0 |
| `timmy_lose_arm.png` | 512 × 512 | (256, 460) | `assets/party-roles/timmy.png`, frame 0 |
| `timmy_lose_leg.png` | 512 × 512 | (256, 460) | `assets/party-roles/timmy.png`, frame 0 |
| `follower_1_lose_arm.png` | 768 × 768 | (384, 680) | `assets/v10/walks/scarf-walk.png`, frame 0 |
| `follower_1_lose_leg.png` | 768 × 768 | (384, 680) | `assets/v10/walks/scarf-walk.png`, frame 0 |
| `follower_2_lose_arm.png` | 768 × 768 | (384, 680) | `assets/v10/walks/feather-walk.png`, frame 0 |
| `follower_2_lose_leg.png` | 768 × 768 | (384, 680) | `assets/v10/walks/feather-walk.png`, frame 0 |
| `follower_3_lose_arm.png` | 768 × 768 | (384, 680) | `assets/v10/walks/moustache-walk.png`, frame 0 |
| `follower_3_lose_leg.png` | 768 × 768 | (384, 680) | `assets/v10/walks/moustache-walk.png`, frame 0 |
| `follower_4_lose_arm.png` | 768 × 768 | (384, 680) | `assets/v10/walks/stripe-walk.png`, frame 0 |
| `follower_4_lose_leg.png` | 768 × 768 | (384, 680) | `assets/v10/walks/stripe-walk.png`, frame 0 |
| `follower_5_lose_arm.png` | 512 × 512 | (256, 480) | `assets/v18/coif-walk-atlas.png`, frame 0 |
| `follower_5_lose_leg.png` | 512 × 512 | (256, 480) | `assets/v18/coif-walk-atlas.png`, frame 0 |
| `dark_wizard_lose_arm.png` | 512 × 512 | (270, 482) | `assets/wizard-riddles/v22/wizard.png`, frame 0 |
| `dark_wizard_lose_leg.png` | 512 × 512 | (270, 482) | `assets/wizard-riddles/v22/wizard.png`, frame 0 |

Specialist pivots come from `assets/party-roles/sprites.json`, first walk frame: Frank (256,475), Executioner (256,480), Timmy (256,460). Followers 1–4 use (384,680) from `art_v10.js` / their animation metadata. Coif follower 5 uses the **512² walk/idle** registration (256,480), not its separate 768² action registration. Wizard uses (270,482) from `wizard-art.js`.

## Coverage and exclusions

- Frank, Executioner, Timmy; follower 1 scarf, 2 feather, 3 moustache, 4 stripe, 5 coif; dark wizard. Two loss frames each.
- These are one arm-loss / one leg-loss event per character, shared across its v1 animation set. Coif idle/walk/action/hurt/death do not need duplicate event drawings: these new event cells deliberately use its walk/idle canvas, as requested. Its 768² attack/hurt/death atlases must not be swapped directly with these 512² PNGs without switching to the documented walk/idle registration.
- Shared rear-walk atlas skipped: it is a scene-specific collection of tightly cropped, variable rectangles, not a uniform hurt cell. Flying limbs would cross neighbouring atlas rectangles; the requested single frontal/side hurt frame already covers each living character. No rear-loss events supplied.
- Player/hero remains excluded. Follower 6–8 placeholders, superseded static cutouts and dead ghosts remain excluded as in v1.

## Art and review

Body cut-outs use the approved v1 injuries. A leg-loss event shows the wrapped knee **before a wooden peg is fitted**; the v1 peg shaft is removed. Detached arm / original lower-leg-and-boot pixels are clipped directly from the intact original, then rotated and displaced. Timmy’s bottle goes with its hand; main torch, axe, book and staff remain with the body. No red, blood, gore, soft glow or realistic splatter: only a few angular black/orange carved impact wedges.

`preview.jpg` is 1260×1220 with the three specialists, normal / arm-loss / leg-loss. Their normal silhouettes are about 280 px high at the native JPG size. `preview_all.jpg` is 1260×3440 with all nine, also normal / arm-loss / leg-loss. Both previews use the same registration and scale within each row, on parchment.

Weak spots: this is a cut-out flinch, so faces are not newly redrawn in pain and a planted foot rotates slightly. Some source limbs partly occlude clothing; detached sleeve edges are therefore polygon-cut rather than anatomically reconstructed. Knee wraps are small at gameplay scale. In-engine event timing and transition into the approved v1 bandaged/peg state still need testing; no integration or playback test was made.

## Reproducibility / verification

- `work/make_loss.py`: Pillow + Python standard library, native-coordinate polygon masks, rigid transforms, burst marks and previews. Reads v1 only; writes v2 only.
- `work/*_removed_arm.png`, `work/*_removed_leg.png`: unrotated original-pixel limb cutouts for inspection.
- `work/verification.json`: 18 dimension/mode checks, visible-alpha bounds (no clipped body/limb/burst), hashes, original v1 PNG hash-preservation check.
- `work/source_validation.json`: every cached v1 original verified byte-identical to `git show origin/play:<path>` for this run. `work/source_commit.txt` gives the reference commit.
- Source config excerpts are saved under `work/`. Frames were visually checked in both previews, and remaining wooden-peg slivers were removed. Transparent pixels are clean; no parchment is baked into game PNGs.
- Rebuild: `python3 /workspace/handoff_to_maggi/limbs/v2/work/make_loss.py` (Pillow required).

Await visual approval of v2 before wiring.
