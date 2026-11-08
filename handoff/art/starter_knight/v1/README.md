# Starter great-helm knight v1
ZERO image generations. Existing knight blade edited with PIL/NumPy/OpenCV; same covered face, armour, body proportions, shield, pose timing, source canvas and animation. All outputs are new; existing assets and game code untouched.

## Findings: current setup
Inspected /workspace/knight-math-game/assets and the more complete/current local repo /workspace/mm_repo. Relevant current code is mm_repo/src/engine/party-abilities.js and src/config/villager-art.js, art_v10_apply.js, layout.js.

- New-run hero with origin:'villager' currently uses villager when weapon=0; villager_sword when weapon>0; villager_armour when armorTrained but weapon=0; full hero knight when armorTrained AND weapon>0. Non-villager origins retain the knight. Weapon stats are capped at 0..3, but there are NOT separate drawn knight sword-tier atlases for each numerical level.
- Current villager art: assets/villager-start/v22/villager-walk.png, villager_sword-walk.png, villager_armour-walk.png. All 6144×768 RGBA: eight 768×768 frames, x=i*768, y=0, 125ms, pivot [384,680], 1-second loop. Corresponding *-poses.png sheets are 1536×768, two 768×768 poses. frames.json describes them. v20/v21 and walks-henry variants are older alternatives, not the current configured set.
- Current covered-face knight walk/stand: assets/v10/walks/hero-walk.png, 6144×768, same eight frames/pivot/timing. Folder name v10 is historical: README/code say approved v13 full-body rig. Stand/idle uses frame 0; attacks/lunges are procedural, not separate drawn attack tiers. Hero animation standTop=88 and rootMotionSpeed=235.63636363636363 atlas px/s.
- Art is drawn at the global 0.6 stage-px/source-px scale (src/config/layout.js). Mockup uses exactly this scale, then 2× that display size. Export cell itself stays 768×768.
- Legacy full knight cutout assets/v7/characters/black_knight.png is 1024×1536 and has the sword baked in. Knight-death and knight-arrow-death are separate legacy sequence sheets, NOT changed by this handoff.

### Is the sword separate?
NOT a usable independent runtime weapon. The game draws baked walk atlases. The approved rig source under assets/villager-start/v20/approved-v13/parts/ has forearm, hand, guard AND sword all inside hero-frontFore.png (1421×1107). hero-sword.png exists but is fully transparent (same canvas). The rig has a sword slot, but it currently contributes nothing. Runtime.js explicitly draws the frontFore assembly together. Therefore editing an empty sword slot would not replace the current blade: this delivery edits the assembly AND supplies a rebuilt eight-frame atlas.

## Deliverables / proposed integration mapping
- starter-knight-walk.png: 6144×768 RGBA; ADD as a new starter knight atlas parallel to assets/v10/walks/hero-walk.png. Keep the intact atlas for upgraded gear.
- starter-knight-idle.png: 768×768, same frame 0; optional convenience (engine can keep using atlas frame 0).
- frame_00.png ... frame_07.png: 768×768 individual frames.
- starter-knight-animation.json: frame rects, 125ms, pivot [384,680], duration and root speed preserved; image points to starter-knight-walk.png. Rig path is an inherited source reference, NOT a bundled replacement rig.
- hero-frontFore-starter.png: 1421×1107 RGBA; alternative source assembly for assets/villager-start/v20/approved-v13/parts/hero-frontFore.png when rebuilding a starter rig. Don't globally overwrite the current assembly if upgraded knights still need their good blade.
- starter-blade-only.png: same source canvas, only the damaged blade for inspection/future rig separation. NOT a drop-in hero-sword.png replacement while old blade remains in frontFore; that would double the blade.
- mockup.jpg: starter/current side by side at game scale and 2× zoom.
- frames_preview.jpg and walk_preview.gif: all eight poses/loop.
- work/build.py, arm.jpg, blade_comparison.jpg: reproducible local edit and close inspection.

Suggested programmer action (NOT done): register a new starter hero art ID using this atlas and same sequence metadata; route a new starting knight to it, use the existing hero atlas after weapon upgrade. Remove/adjust the current villager-origin art routing separately. Gear/balance behaviour not changed here.

## Blade treatment / checks
Shortened about 18%, kinked tip, three deep edge chips, rust wash and small oxide scores. Original black woodcut hatching retained. Existing guard, hand and arm unchanged. Exact source rig transforms used to edit the old blade across all eight frames; existing clean hero-body source restores tunic behind the shorter/chipped blade. Inspected side-by-side and all eight frames.

## Weak spots
Small chips/rust naturally become subtler at game size; shorter bent silhouette is the primary tell. Guard and armour remain relatively good (intentional: only starting sword requested). No rag grip added because fingers obscure most grip. Exposed background under the shortened blade is reconstructed from the existing clean tunic cutout rather than a new painting; tiny resampling seams may appear at source zoom. Death-specific swords remain intact until separate death sequences are revised. This is an asset handoff, not live-game integration or a claim that routing has already changed.
