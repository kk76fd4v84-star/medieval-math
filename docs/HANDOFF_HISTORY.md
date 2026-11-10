# Current project handoff — 7 November 2026

Start with [GROK_HANDOFF.md](GROK_HANDOFF.md) for the consolidated current rules,
implemented features and unfinished work. [VERIFICATION.md](VERIFICATION.md)
records this export’s checks; [GITHUB_PUBLISH.md](GITHUB_PUBLISH.md) covers updating
the existing repository. The notes below are historical and can be superseded.

---

WOODCUT TIMER — woodcut-timer-46 (6 November 2026)
- Magnus chose the icons and slim progress line in the swamp tunnel concept.
- Shared across Village Idiot, Knight and Fellowship, outdoors and inside the tomb.
  The progress rail now sits above a separate fine ornamental divider. Flat worn
  orange fill replaces the broad glowing wash. Small shield, horizontal flaming
  sword, horizontal ordinary sword and twig reuse the actual reference pixels.
- Assets: assets/timing-woodcut/. source.json records exact concept crop coordinates
  and paper-matte cleanup; original enclosed ink/colour retained, no art redraw.
- Keep the current 25% block / 50% crit / 75% normal base boundaries, equipped
  windows, party/enemy pressure, frozen questions, full-bar waiting/deadlines,
  score rules and hit pin. This is a visual update, not a balance change.
  Emblems, red lost-window bands, fill and answer pin share one coordinate axis.
  Hover and keyboard tooltips remain in English/Japanese. Riddle/recruit timers
  use the same rail without misleading combat icons.
- Muted browser checks cover all three modes, tomb, riddles, both tooltip languages,
  full fill, narrow screen, real submissions/hit pins and non-submitting icons.
  Timing/block, party pressure, enemy pressure, Fellowship and maths timer checks pass.
- Visual proof: review/woodcut-timer-46/. Backup: backups/woodcut-timer-46/.

FIRST-PERSON SWAMP CONCEPT — 6 November 2026
- Magnus asked what a walk tunnel in the swamp graphic would look like.
- Proposal: art-direction/concepts/swamp-tunnel-concept-v1.png. Same bog creatures,
  woodcut trees, hanging moss and muddy plank path, now viewed from inside the world.
  Open root arches recede around a bend; nearby toad and a distant bog revenant.
- Intended motion if implemented: offset hollow tree/root surrounds grow toward
  the camera, with floor sections and foes sharing depth, emerging from dark ink.
  Four party portraits and the maths/timing UI remain below the action.
- Built-in image_gen; exact prompt and references in the matching .json file.
- CONCEPT ONLY, awaiting review. Not playable, not separated art, and no decision
  yet to replace the side-scrolling swamp or assign a campaign chapter.

SWAMP CONCEPT — 6 November 2026
- New visual proposal: art-direction/concepts/swamp-concept-v1.png.
- Requested mood: Monty Python mixed with Moonstone: A Hard Day's Knight, in the
  existing game's parchment/woodcut style. Original knight reference retained.
- Bog pools, crooked mossy willows, sinking ruined keep and rotten crossing;
  pot-helmet predatory toad, ragged bog revenant and a distant submerged beast.
- Built-in image_gen; exact prompt/provenance: art-direction/concepts/swamp-concept-v1.json.
- CONCEPT ONLY, awaiting user review. Not a playable biome or layered asset pack;
  placement in the campaign remains undecided. Approved beach direction unchanged.

MOONLIT BEACH CONCEPT — 6 November 2026
- First chapter-four visual proposal: art-direction/concepts/beach-concept-v1.png.
- Built-in image_gen using the approved concept as the visual reference; exact
  prompt and provenance: art-direction/concepts/beach-concept-v1.json.
- Return to side view after the tomb: moon, dark engraved ocean, distant ruins and
  sea serpent; foreground barnacle crab and ragged trident-bearing sea creature.
  Original parchment/ink style, restrained orange and maths below the ground.
- APPROVED VISUAL DIRECTION: Magnus replied "I like it" on 6 November 2026.
  Use this concept as the reference for future beach layers and creatures.
  Concept only: the beach is not implemented or playable, and this image is not
  a layered asset pack. No campaign progression changed.

TOMB CORPSE FLOOR ALIGNMENT — corpse-floor-45 (6 November 2026)
- Magnus requested a slightly smaller corpse aligned with the tunnel floor.
- Reuse the existing v42 three-pose atlas. Display scale is 530 instead of 610
  (about 13% smaller). Pitch and landing apply held foreshortening (0.86/0.70),
  with an inward perspective lean and a compensating vertical placement so the
  upper body stays visible close to the camera and legs remain below the frame.
- No art regeneration, palette change, extra animation frames or timing changes.
  Body world positions, depth occlusion, revival and next-run skeleton records
  are unchanged. Music remains chapter-music-44 with per-page opt-in.
- Visually checked all three held poses in-game and all four landed outfits.
  Existing tomb-falls and tomb-memorials browser checks pass with audio muted:
  actual casualty/hero death, portrait removal, world movement, revival, reduced
  motion, replay, skeleton persistence and preservation of campaign data.
- Test: /?debug&biome=tomb&preview=tomb&mode=fellowship&v=corpse-floor-45
- Backup: backups/corpse-floor-45/. Proofs: review/corpse-floor-45/.

CHAPTER MUSIC — chapter-music-44 (6 November 2026)
CURRENT IMPLEMENTATION; Magnus supplied six new MP3 files in assets/audio/music/.
- Hollow Wood/graveyard exploration: Graveyard music.mp3. Riddles and recruitment
  keep this track at their existing lower volume; tavern exterior also uses it.
- Tomb exploration: Tomb music regular.mp3 + Tomb music regular 2.mp3.
- Tomb normal combat: Tomb regular battle.mp3.
- Tomb boss combat: Tomb Boss Battle Music1.mp3 + Tomb Boss battlemusic 2.mp3.
- Exploration and boss pairs shuffle without immediate repeats. Exploration resumes
  at its previous position after a fight. Existing 1.2-second crossfades remain.
- Village music and Hollow Wood battle/boss/camp/shop music keep their existing
  assignments. Sung tavern music is still restricted to the actual tavern interior.
- src/data/music.js defines chapter overrides; music.setScene(scene, chapter)
  resolves them. All game scene requests use musicScene(), passing S.chapter so
  continued saves, chapter entry and new runs select the correct music. Tomb start
  and replay now select exploration explicitly; tomb victory returns to it and
  death fades to silence. The campaign chapter gate also leaves combat music.
- Source recordings and filenames are unchanged. No auto-unmute: each new page
  starts silent, the Music button opts in, hidden/closed tabs and OS pause stop it,
  and another game tab silences the first. Tests must never play audible music.
- Verified: all six MP3s decode in the browser (stereo, 132–184 seconds); silent
  controller tests cover shuffle, resume, mute and routing; headless browser checks
  cover actual tomb combat/boss/replay/end, Hollow Wood entry/battle/tavern and
  fresh village routing. Existing audio-world, music-silence, party-roles and
  rest-road tests pass. Audio-world comparison now ignores descriptive metadata
  (_note/_comment); runtime audio settings remain fully checked.
- Tomb remains an isolated three-encounter preview. Play with the new audio:
  /?debug&biome=tomb&preview=tomb&mode=fellowship&v=chapter-music-44
  Graveyard: /?debug&biome=hollowwood&preview=hollowwood&mode=fellowship&v=chapter-music-44
  Normal game: /?mode=fellowship&v=chapter-music-44
- Backup: backups/chapter-music-44/. No save data or gameplay balance changes.

CLOSE FALLS + PERSISTENT TOMB SKELETONS — tunnel-43 (6 November 2026)
CURRENT TOMB DEATH PRESENTATION, requested by Magnus.
- Reuse the same three drawn rear-view death poses, closer and larger. Heads, arms
  and torso are visible; waist/lower body extend below the scene, clipped above the
  maths divider. No new character redesign, no miniature full-body fall.
- Each actual friendly death, including the main player, records its tunnel position.
  On the NEXT tunnel run, a prone skeletal-remains sprite marks that area. The current
  run shows the fresh body only. Markers share tunnel perspective, darkness and
  occlusion. Repeated deaths in one spot get modest local lateral/depth offsets.
- Persist locally in the dedicated knightMath.tomb.memorials.v1 key. This is an
  explicit exception to the preview's former no-persistence rule: campaign saves,
  leaderboards and road-grave profiles remain untouched. Same browser/site required.
  Markers survive replay and reload. Resurrection deletes only that run/member's
  marker; earlier skeletons remain. Merely dismissing a companion is not a death.
- New sprite: assets/tomb/v43/fallen-skeleton.png, built-in image_gen with approved
  concept and rear-death pose references; prompt/provenance in prompts.json.
  Only a generated alpha-fringe cleanup and tight crop were applied in code.
- src/engine/tomb-memorials.js owns local history/drawing; tomb-falls.js owns close
  poses. Tomb test remains three encounters, isolated from campaign progression.
- Play: /?debug&biome=tomb&preview=tomb&mode=fellowship&v=tunnel-43
- Verified real fatal backfire, upper-body framing, next-run and reload skeleton,
  no duplicate marker, resurrection removal, and preserved campaign data. Full
  passage combat/win/replay and Japanese/regression checks run muted.

TUNNEL BENDS, VARIANTS AND FORWARD DEATHS — tunnel-42 (6 November 2026)
CURRENT TOMB PRESENTATION; replaces the crossed-out portrait treatment below.
- Stronger smooth horizontal bends, with a small height variation. Three hollow
  sections: original stone, burial niches/coffin shelves, and root-cracked masonry.
  Section types are fixed to world IDs in short runs; they never change randomly
  while visible. Keep the transparent openings, opaque stone and black-to-colour
  depth lighting. No end wall or opacity-faded scenery.
- On an actual party death, remove that portrait immediately. Show the matching
  rear-facing body buckle, pitch forward and land face-down in three drawn poses.
  The body remains at its world position and passes below the camera as you walk on.
  It does not become a dim portrait or a rotated portrait rectangle. Floor fire is
  behind the falling body so a backfire does not obscure the animation.
- New authored fall outfits cover this test's knight, orange-hooded Frank, Dark
  Wizard and coif-wearing Timmy. Other future outfits need their own matching art.
  Source crops and prompt/provenance are in assets/tomb/v42/. No skeletal tweening.
- src/engine/tomb-falls.js owns the visual sequence only. The existing combat system
  still decides casualties, wounds, equipment loss and timing pressure. Portraits
  use member IDs, including resurrected copies; revival removes the corpse. Replay
  clears corpses. Reduced-motion setting goes straight to the landed pose.
- Isolated test: /?debug&biome=tomb&preview=tomb&mode=fellowship&v=tunnel-42
  Campaign connection and additional boss art remain future work. Normal saves,
  scores and graves are not written by this preview. Keep the power/risk rule below.
- QA: real keyboard combat through all three fights, boss, win/replay, real fatal
  backfire and main-player death; all four outfit poses; world-anchored corpses,
  revival and reduced motion; opaque walls/open centres; Japanese and save isolation.
  Muted browser tests, visual screenshots checked, no console/asset-load errors.

HOLLOW TUNNEL LAYERS — tunnel-41 (6 November 2026)
CURRENT TOMB RENDERER; supersedes the single-room camera zoom in tomb-40.
- Magnus approved the one hollow stone-section sprite, then requested it built into
  the playable tunnel with enemies emerging from pitch black alongside the world.
- Same isolated test URL: /?debug&biome=tomb&preview=tomb&mode=fellowship&v=tunnel-41
  Still not connected to the campaign. Normal saved runs and leaderboards untouched.
- assets/tomb/v41/tunnel-slice.png is a single ceiling/walls/floor surround with a
  large genuinely transparent opening and no end wall. Stone interiors are opaque.
  Built-in image_gen used both approved concepts. Exact prompt/provenance and alpha
  cleanup script are beside the PNG; only low-alpha fringe/near-opaque matte cleaned.
- src/engine/tomb-depth.js projects fixed world sections toward the camera. They
  enlarge and move offscreen as the camera passes; they are never looped screen zooms.
  Smooth small world-space offsets suggest bends. Far art is RGB black; it restores
  its source colour as it reaches the player. Brightness changes, NOT opacity fades.
- Enemies share that perspective, path and lighting, and are drawn between wall
  layers in depth order. Future encounters already exist down the corridor instead
  of spawning sideways. They stop in front of the party for the existing combat.
- Party portraits, actual maths/timing rules, role volleys/backfires, boss behaviour,
  casualties and replay are retained. One repeated section is intentional for this
  test; distinct rooms/branching paths are future artwork/gameplay, not claimed here.
- Validation: real browser alpha/depth checks, 8 submitted answers through all three
  fights, replay, backfire casualty, Japanese layout and unchanged saves/scores.
  Muted QA; no console or asset-load errors.

TOMB PLAY TEST + PARTY REPLACEMENT — tomb-40 (6 November 2026)
CURRENT IMPLEMENTATION; replaces the concept-only status of the tomb below.

PARTY REPLACEMENT (ALL THREE MODES)
- A full party may attempt roadside, camp or tavern recruitment. Solve the existing
  challenge first; only on success choose a companion to dismiss, or keep the party.
  The main player cannot be dismissed. Failed recruitment never removes a member.
- Preserve the four-person cap, current shared wounds, score and purse. The newcomer
  gets fresh zero-upgrade equipment; outgoing weapon/armour and their timing benefits
  leave with the owner. Swapping is not a free heal. Same party size = same pressure.
- Retain the one-successful-recruit limit per camp/tavern. Successful candidates are
  recorded as consumed seats, including road recruits, across save/load.
- PROVISIONAL tuning: 1 in 3 dismissals becomes hostile. The replacement screen warns
  explicitly. Outcome is seeded by run/chapter/stop/member; reloading cannot reroll it.
- Peaceful departures use the existing rear-facing walk on the road. Hostile tavern
  dismissals move through an ink transition outside, then fight the SAME companion
  sprite facing the party. New recruit helps fight. Normal mode maths/card rules apply.
- Former companion has base HP 6 + 2 per weapon level + held armour; attack 1 + floor
  (weapon level / 2). Fellowship uses its existing 2x enemy HP. These are prototype
  enemy statistics, not party hearts. Role-specific enemy spells are not added here.
- No copper/equipment drop from this confrontation. Dismissal itself is not a death
  and creates no grave. Unfinished hostility is saved; loading resumes that fight.
  Victory returns to the same rest stop (outside the tavern) or continues the road.
- Logic coverage: all modes, cancel/main-player guard, wounds/gear, seeded hostile
  and peaceful outcomes, pending fight save/load, combat stats, no loot/repeat recruit.

PLAYABLE TOMB CAMERA TEST
- Magnus approved art-direction/concepts/tomb-concept-v1.png and asked to try it.
- URL: /?debug&biome=tomb&preview=tomb&mode=fellowship&v=tomb-40
- Isolated three-encounter test: one sentry, two sentries, then The Last Watch. Starts
  with knight, Frank, Dark Wizard, Timmy; 8 shared HP, sword +1 and armour 1.
- Actual game resolver: maths, timing bands, party pressure, priest healing, fire
  and lightning, backfires, enemy intent, boss roar/deadline and casualties. Portraits
  highlight during attacks and show live hearts/armour; fallen slots stay crossed out.
- Front-facing sentries approach as the corridor gently pushes toward the camera.
  Background and math strip share the same parchment. This is one illustrated room
  with a camera push, NOT a completed 3D/grid dungeon. Motion is held cutout lunges,
  recoil and existing combat effects, not a newly authored frame-by-frame atlas.
- The test warden currently reuses the sentry art at a larger scale; boss artwork
  and further rooms are later production work. No new monster designs claimed.
- Explicit debug preview: does not replace campaign run, death records or leaderboard.
  Replay starts a clean test party; Return to the road opens the normal game menu.
- First-person campaign transition after Hollow Wood and the moonlit coast remain
  future work. The live campaign still ends after Hollow Wood, as v39 did.
- Art: assets/tomb/v40/room.png (empty plate), room-ink.png (paper extraction),
  sentry.png (transparent cutout), portraits-source.png (approved concept portraits,
  painted hearts cleared only inside their plaques so runtime hearts are accurate).
  Built-in image_gen used the approved tomb concept as reference. Exact prompts:
  assets/tomb/v40/prompts.json; source sizes/paths in manifest.json. Processing scripts
  retained beside these files. No replacement of approved outdoor art.
- Muted headless browser: all 3 encounters cleared through real typed answers,
  replay and backfire casualty checked, Japanese view checked, save/profile/score
  preservation checked. Tavern: solved/cancelled/re-solved, selected companion,
  transitioned outside and entered real hostile combat. Existing role, deck, wound,
  pressure and Hollow Wood tests remain passing.

FUTURE CHAPTER CONCEPT — TOMB PASSAGE TO MOONLIT COAST (5 November 2026)
Campaign route still planned. Tomb concept approved; isolated playable test described above.
- At the end of The Hollow Wood, enter a tomb passage: chapter three changes the
  world camera to first-person dungeon crawling. Enemies face the party down the
  tunnel; the party is represented by portraits rather than full road sprites.
- Keep the existing maths, timer, block/crit and role rules below the illustration.
  The perspective changes; no new combat rules have been agreed.
- After defeating the tomb boss, emerge into chapter four: a beach at night, moon
  and ocean in the background, creepy water creatures and mythical beings.
- Preserve the approved woodcut/book art style through both camera changes.
- Current v39 still ends after the Hollow Wood optional boss/decline. The tomb
  and coast are future work, not hidden completed levels.

THE HOLLOW WOOD + EQUIPMENT LIMITS — hollowwood-39 (5 November 2026)
CURRENT IMPLEMENTATION; supersedes the older "next approved biome" note below.

EQUIPMENT
- Each living character can hold at most weapon +3 and armour 3. Shops, recipient
  selection, direct purchase and restored saves enforce the same cap. Capped items
  cannot take payment. Shop tier 1/2/3 may offer a lower cap, never a higher one.
- Armour remains consumable silver hearts. Lost armour may be bought back up to 3;
  this is not a lifetime limit of three armour purchases. Red health remains 2 each.
- No changes to +5-point gear timing benefits, party pressure, death-owned gear
  removal, frozen question windows, fixed score cutoffs or power/difficulty/risk.

CHAPTER TWO: THE HOLLOW WOOD
- The original countryside route stays intact. After its final encounter, offer
  Enter the wood or Finish this run. Entering uses an ink transition and preserves
  surviving party, wounds, equipment, coppers, pursuit, score and total distance.
  No free heal on transition. The first camp can heal if the player chooses it.
- Chapter is saved in run/checkpoint data. Old saves without it remain village.
  Death records are chapter-tagged so graves do not appear in the wrong setting.
- 18 slowly spaced stops: four enemy types, mixed relay packs, three riddles,
  camps with one recruit, shops, tavern, mandatory abomination and optional boss.
  Existing townsfolk/services are reused; this update does not repaint the tavern.
- Skeleton watchman (12 HP), zombie villager (14), grave spider (9), root horror
  (17); Fellowship applies its existing fixed 2x HP. Single attacks normally 1.
  Spider attacks once at a full timer; skeleton/roots apply fixed block pressure.
- The Parish Collector: huge stitched gravedigger, cage of skulls, bell and shovel;
  48 HP / 2 attack, roar pushes crit/block back 8/10 percentage points.
  Magnus requested REMOVAL of the faces on belly/shoulder. Final sprite has only
  the original living head, plain stitched torso, and skulls retained inside cage.
- The Bell Beneath: distant optional six-armed shrouded creature with a chest bell;
  64 HP / 2 attack, roar pushes crit/block back 10/15 points, full-bar deadline.
  Awaken deliberately or leave sleeping without damage/coin/pursuit penalty.
  Defeating or bypassing it ends the chapter and opens the existing score tally.
- Pressure is fixed by enemy, never scaled to erase the benefit of bought gear.
  Existing risky magic/fire, priest heal/staff, executioner and mode flows remain.
- All new labels, prompts, enemy names and barks have Japanese translations.

ART / RENDERING
- 10 transparent production cutouts in assets/hollowwood/v39/: abbey landmark,
  graveyard island, complete dead-tree clump with watcher, low bramble foreground,
  skeleton, zombie, spider, roots, abomination, optional bell creature.
- Original concept remains the style authority. Built-in image_gen generated art;
  prompts.json records prompts and source provenance. The abomination edit is
  recorded there. manifest.json records crop bounds, dimensions and alpha padding.
- Image interiors made opaque, edge antialias retained. Four landscape assets have
  precomputed ink; the existing compositor masks scenery with its silhouette and
  fills with the same shared parchment as the game. No mist/alpha fade at joins.
- Layer scroll speeds: abbey .045, far trees .13, graves .26, near trees .42,
  foreground 1.0, all leftward when walking right. Sparse gaps are intentional;
  whole objects travel through the viewport without cropping source pieces.
- The near foreground is low enough to expose feet/legs. The abbey is one distant
  landmark, not a tiled row of churches. Background spacing is deterministic.
- New enemies use existing idle/attack/hurt/death fallback motion; these are static
  painted cutouts, NOT bespoke frame-by-frame death sprite sheets. Fine balance
  and user visual approval still need playtesting. Do not claim either is final.

PLAY / VERIFICATION
- Real game: /?mode=fellowship&v=hollowwood-39 (continue your current save).
- Separate no-save test: /?debug&biome=hollowwood&mode=fellowship&preview=hollowwood&v=hollowwood-39
  Starts at the woodland camp with a knight, priest and firestarter, 10 coppers,
  one weapon/armour upgrade. Timer is active; debug test does not write run scores.
- All three modes support the chapter. Keep music off in automated checks.
- tests/equipment-cap.test.js covers caps, spending, replacement armour and saves.
  tests/hollowwood.test.js covers seeded route, assets, chapter carryover/save,
  optional boss decline/commit and legacy countryside save behaviour.
- Muted isolated browser checks cover camp walk-in, first combat volley, all enemy
  renders, distant/active bonus boss, chapter transition, mode UI and Japanese.
- The normal user game tab was not navigated, restarted or altered during testing.

LIVING PARTY PRESSURE + JAPANESE REVIEW — party-pressure-38 (5 November 2026)
Current combat tuning across Village Idiot, Knight and Fellowship:
- Each LIVING companion (not the main player) pulls BOTH block and crit endpoints
  back 5 percentage points. Cap: three companions / 15 points. No permanent recruit
  counter: deaths/eating/removal release their pressure; resurrection restores it.
- Solo ungeared block/crit endpoints: 25/50%. With 1, 2, 3 companions: 20/45%,
  15/40%, 10/35%. Normal/weak cutoff remains 75%. Icons are ENDPOINTS, not starts.
- A dead companion also loses ALL their equipment contribution to the meter.
  Existing gear aggregation is preserved: armour sums across living wearers;
  weapons use the highest eligible living owner (selected card/role in Knight/
  Village Idiot, any living member in Fellowship). If another living owner has
  the same weapon benefit, that surviving contribution remains. Do not bank dead gear.
- Order: equipment and its existing caps, living-party penalty, enemy pressure,
  then existing safety floors (block 5%, crit 20%, at least 5 points between).
  Gear still provides its +5-point steps where caps/floors allow. Red bands show
  total lost range; tooltips separately identify party and enemy pressure.
- Snapshot windows for an active question; roster/gear changes apply to the next
  question. This prevents a death during a deadline strike moving the target while
  the player is still typing. Round numerical boundaries to avoid float artefacts.
- Riddles/recruitment have no combat penalty; their timer markers and scoring stay
  at base values. Answer-score tiers, riddle bonuses, damage, HP, enemy patterns,
  purse tuning and saves are otherwise unchanged.

JAPANESE REVIEW:
- Reviewed current UI/dialogue dictionary, twelve native Japanese riddles and all
  sixteen kana/romaji pairs. Fixed awkward attack/role labels, plural quantities,
  AoE damage wording, an armed-scroll label, distance units and leaderboard heading.
- Dictionary fragments now match whole English phrases in one pass, avoiding
  replacements inside words; companion names also localize inside card metadata.
  Explicit no-translate markup protects text AND accessibility attributes.
- Refrigerator wordplay is written in kana. Removed an ambiguous pumpkin distractor
  from the egg riddle; made the drum clue more specific. Answer IDs/order preserved.
- Japanese typing remains displayed kana + typed romaji; added a half-width Latin
  input hint. English typing, stable IDs and player save data remain unchanged.
- Checked actual title/name, action cards, Knight hand, Fellowship timing tooltips,
  riddles, word input, shop, camp, tavern, score tally and leaderboard in a muted
  isolated browser. No panel overflow/errors in these checked 1440x900 views.
- Tests cover current living count, removal of owned gear, shared gear ownership,
  exact cutoffs, pressure floors, frozen questions, saves and unchanged score tiers;
  combat, cards, economy, leaderboard, Japanese content/formatting regressions pass.

Historical v38 status: the woodland was not part of v38. See hollowwood-39 above.

TIMING RISK, SCARCE COPPERS AND CROSS GRAVES — stakes-37 (5 November 2026)
Current rule; supersedes earlier crit/block tuning. Applies globally to The Village
Idiot, The Knight and The Fellowship. Magnus wants more dangerous fights and scarce
purchases. Keep the core power/difficulty/risk rule; do not inflate maths difficulty.

- At baseline, a correct answer at 0–25% gives NORMAL damage and blocks the entire
  enemy turn. Above 25% and before 50% gives DOUBLE damage but NO timing block:
  surviving enemies retaliate. 50–75% is normal damage without block; above 75%
  is half damage without block. The bands are distinct, not cumulative.
- Armour moves the block boundary +5 percentage points per level, capped at 45%.
  Weapons move the crit endpoint +5 points per level, capped at 70%. Enemy pressure
  moves the matching boundaries back, retaining the red lost-window indication.
  Under extreme pressure, crit ends no earlier than 20%, block no earlier than 5%,
  and the crit band retains at least 5 points. Current authored enemy pressures
  preserve the full intended equipment benefit. Windows freeze per question.
- Keep forgiving squirrel/rabbit behaviour (correct = block), deadline attackers,
  armour absorption, two hearts per person, hero dies last, and caster backfires.
  Timer expiry does not auto-submit. Ordinary foes wait for the answer.
- Score thresholds stay 4/3/2/1 at 25/50/75%, with existing riddle scoring and scroll
  penalty. A safe early hit earns more score than waiting deliberately for a crit.
- Icons now run shield, flaming sword, normal attack, weak stick from left to right.
  English/Japanese tooltips describe retaliation correctly; the hit marker remains.

ECONOMY PLAYTEST (not adaptive):
- Start with 5 coppers. Ordinary villager/goblin/ogre encounter purse: 3; skeleton
  and black knight: 4; optional turd dragon: 2; final dragon: 8. Unknown old encounter
  types get 30% of their legacy reward. Animals still drop none. See combat.economy.
- Existing group bonus is applied once to the eligible encounter purse and split
  between coin-bearing bodies. Animals do not enlarge it. Scroll-assisted fights
  still halve it. Pickups happen only when walking past the dead enemy, once.
- Riddles retain first-try 4 coppers / fast 8; second-try solves pay zero. Prices
  stay unchanged: shop tiers offer sword/armour at 7/5, 10/7 and 13/9.
- A saver with fast first-try riddles can narrowly afford one sword plus one armour
  at each shop. Without spending elsewhere, first-shop wallet is 13, second 18,
  third 25–26 (including optional dragon); no adaptive wallet cap. Food, scrolls,
  skipped encounters and missed bonuses trade against equipment. Banking remains
  valid and can enable more later. Existing wallets and queued pickups are preserved.

VISUAL FIXES:
- All death marker IDs, including older saves and missing killer-specific art, draw
  the existing opaque wooden cross used for companions. Remove the translucent
  rounded tombstone fallback. Road crosses are 1.6× the background cross, and their
  measured bounds match. Saved death metadata, respects dialogue, world locations,
  companion spacing/depths and resurrection cleanup remain intact.
- Dark Wizard retains his existing six poses, silhouette, scale, eye glints and hat.
  Preserve his source black ink, warm skin and pouch rather than flattening through
  the grey palette remap. The shared atlas applies this to world and tavern poses.

QA: timing boundary/retaliation tests across all three modes, two correct exposed
crits causing a companion casualty, upgrades/pressure/deadlines, 100 seeded economy
routes, deferred pickups and saved balances, companion-grave persistence/spacing.
Muted isolated browser: visible markers and EN/JP tooltips, actual crit counter,
opaque legacy crosses, wizard before/after beside party and seated in tavern.
Artwork changes have been inspected; user approval is not claimed. No music played.

THE FELLOWSHIP — ROLE VOLLEYS / fellowship-roles-36 (5 November 2026)
Supersedes the basic-attack-only and arithmetic-riddler rules in fellowship-35.
One arithmetic answer still controls the whole party. No combat move selection.
Each living character now performs their own role action:
- Knights: full personal damage to the first TWO surviving enemies. Later knights
  move to the next surviving targets after earlier reserved hits kill a foe.
- Dark Wizards: lightning hits ALL surviving enemies; 7 + 2 × personal weapon level
  per enemy before the existing crit/normal/weak timing multiplier.
- Firestarters: actual bottle throws and fire on ALL surviving enemies; 4 + 2 ×
  personal weapon level per enemy before timing. Multiple bottles coexist; one
  throw must not erase another. Fire damage lands with the impact animation.
- Priests: when wounded, heal ONE shared heart instead of attacking (confirmed by
  Magnus); otherwise staff-hit the first enemy for 3 + 2 × weapon level. The existing
  shared limit is TWO heals per battle, not two per priest. Reserve heals to avoid
  several priests wasting a heal on the same missing heart. Healing reduces unhealed
  damage; when charges run out, priests use their staff even if still wounded.
- Executioners: one axe hit for 3 + 2 × weapon level, doubled against a foe at or
  below half HP. Prefer a wounded foe; use an ordinary axe hit when none qualify.
- Knight baseline remains 3 + 2 × weapon level. Per-caster contributions already
  stack; no extra matching-role multiplier is added on top. Values are playtest tuning.

WRONG COMBAT ANSWERS:
- Knights, priests and executioners do not attack or heal.
- Every living wizard/firestarter still discharges their normal spell onto the
  enemies, and EACH caster adds ONE damage to the shared party pool. This is one
  damage per CASTER, not per party member. Two wizards + Timmy means three damage.
- Existing silver armour absorbs first; remaining damage removes red hearts.
  Only red-heart loss counts toward casualties. No timing crit/block or early-answer
  backfire multiplier protects or increases these failed casts.
- Hunters advance once, score stays zero. After the volley, resolve self-inflicted
  casualties BEFORE enemy deaths/victory, then the normal surviving-enemy response.
  A last-enemy kill cannot cancel friendly-fire deaths. Hero still dies last.
- Deadline enemies still get at most one strike per question. Failed riddles and
  recruitment do NOT unleash party spells; those encounters retain their own rules.

RIDDLE STOPS:
Restore the actual English/Japanese riddles, framed answer choices, timer/coin/score
rules, two attempts and three-riddle wizard unlock. Play the original greeting SFX
once per encounter: event riddle -> assets/audio/sfx/riddle_hihuuu.ogg (mp3 fallback).
This is the requested greeting exception; other removed voice acting stays off.
The wizard/eyeball confrontation and 1-damage riddler revenge remain. Scrolls are
saved for the next MATH question, never consumed by a riddle.

Keep Fellowship's fixed 2× enemy HP, independent save/scoreboard, auto scrolls,
existing crit/block/pressure windows, damage bursts and total. Burst amounts are
that character's total across affected foes (including overkill); the last figure
sums the volley. Other modes retain their current combat rules.

QA: tests/fellowship.test.js exercises role targeting, upgrades, priest limits,
execution threshold, stacked friendly fire, armour, simultaneous last-foe/player
kills, death ordering, scoring, timers, riddles/audio hook, persistence. Fire effect
concurrency has its own test. Muted browser checks cover visible spells, EN/JP riddles,
actual greeting-file resolution, healing and multiple-caster failures.

THE FELLOWSHIP — fellowship-35 (5 November 2026)
A separate pure-maths mode requested by Magnus. One sum triggers one coordinated
basic attack from every living party member. Combat starts automatically on arrival;
the next sum appears after the volley and surviving enemies' response. No combat
cards, move selection, target selection, word typing, sacrifice or dice in this mode.
Shops, recruitment, camps, taverns and travel retain their between-fight choices.
The Village Idiot and The Knight keep their current rules and UI.

FIRST PLAYTEST BALANCE (provisional, src/modes/fellowship.js):
- Each member contributes 3 + 2 × their weapon upgrade level. Contributions add;
  no extra matching-role multiplier in this mode. A sword upgrade changes 3 to 5.
- All roles use basic attacks here: no automatic healing, AoE execution, risky
  fire-bottle/lightning cast or backfire. This is the explicit pure-maths exception
  to action selection; the power/difficulty/risk rule remains in the other modes.
- Enemy health is 2× the existing species value, rounded up. Never scale it with
  current party size or purchases: recruiting/upgrading must retain its benefit.
- Early sums use the easy opening pool; later sums use normal mental arithmetic.
  Equipment and recruits increase damage without silently increasing maths difficulty.
- Crit, block, late half-damage, equipment timing-window shifts, enemy pressure,
  forgiving animals, deadline attackers and the hit marker all retain their rules.
- Wrong answers deal no party damage to the enemy and advance hunters once. Resolve
  one enemy response. Deadline enemies cannot hit twice for the same question.
- Four strikes land 0.11 seconds apart as one short volley, not four decision turns.
  Each member has an existing attack pose, stamped damage number and impact sound;
  numbers spread out, then clear into one total. Avoid face/intent overlap, new art,
  glossy effects or full-screen flashes. Respect reduced-motion preference.
- Target reservations move remaining companions to the next surviving enemy.
  Deaths/rewards settle once after the whole volley; all members animate even on
  overkill. The displayed total is attack power delivered, including overkill.
- Only one score award per solved sum, never per party member or damage burst.
- Bought/found scrolls automatically ease the next maths problem, retaining the
  -2 point penalty. Mead takes priority and preserves scrolls. No mid-sum scroll
  shortcut in this mode; the shop explains automatic next-sum use.
- Riddler stops offer arithmetic instead of multiple-choice riddles; keep their
  coin reward, two-attempt limit, riddle scoring and Dark Wizard unlock progression.
  Failed recruits leave, with no dice fallback.
- Two hearts per character, persistent wounds, armour absorption, camps and tavern
  healing remain. Recruitment and gear still use existing character artwork.

PERSISTENCE / QA:
Use mode=fellowship; own run key knightMath.save.fellowship and own local scoreboard.
Keep existing math/Knight saves and archived Bard data intact. Preview:
?debug&mode=fellowship&preview=fellowship shows four equipped/mixed companions.
The preview never records a run score. Start normally with ?mode=fellowship.
Gameplay tests cover timing boundaries, four contributors, upgrades, static HP,
spill to the next target, wrong answers, deaths, deadline strikes, score duplication,
scrolls, arithmetic riddler and independent persistence. Browser checks are muted.

LARGE ACTION CARDS — action-cards-34 (5 November 2026)
The Village Idiot now uses a horizontal row of persistent square action cards,
matching The Knight's existing frames. Cards show the owning character, difficulty,
base damage/effect and important conditions. More party roles add their abilities;
matching roles continue to strengthen their existing move rather than duplicating it.
The Village Idiot still chooses an action then solves; automatic party attacks remain
an idea under discussion, not implemented. Crit/block/pressure/hit-marker rules stay.
Roadside shops, camp, encounter commitment, roadside recruitment and combat sacrifice
choices use the same cards. Shop cards show existing icons/prices/effects; gear opens
recipient cards, scrolls enter inventory. Riddles, tavern conversations/navigation,
Frank's dialogue, title and end screens retain their existing framed layouts.

Magnus reaffirmed that magic/fire must be powerful on success and dangerous on failure.
This UI pass does not rebalance attacks. The Knight's fire backfire and wizard lightning
backfire are preserved and labelled. Existing Village Idiot typing still tolerates wrong
letters and waits at full bar; a distinct fire-failure rule remains unfinished and must
not be described as delivered by this UI edit. Its card accurately says word typing and
all-foe damage, rather than claiming that a typo burns the party.

DESIGN MEMO — 5 November 2026 (hypothesis, not an implementation request)
Magnus enjoys equipment/loot from defeated enemies and seeing his party look cooler.
His wife may mainly enjoy the maths; the actual audience is not yet validated.
Desired journey: each area feels like a short adventure, leading to a new setting and
possibly higher difficulty. Keep the core loop simple: solve manageable maths, use
the timer's crit/block windows, and make mage power require a harder challenge.
Potential audiences to test separately: maths-first players and players motivated by
loot, party growth and exploration. Look for voluntary retries and return sessions,
not just positive comments. Do not assume an appetite for mandatory deck/inventory
management. Loot drop rules, visual equipment expansion and area unlock tuning are
ideas to prototype separately; none are added by this card UI pass.

TWO MODES — two-modes-33 (5 November 2026)
Magnus removed The Bard. The only playable modes are The Village Idiot (maths)
and The Knight (cards followed by maths). Retired URL/preference values fall back
to maths. The Bard's timing-only engine, UI, audio helper and obsolete tests have
been removed; existing Bard saves/scores are preserved as archived data and never
mixed into the current leaderboards. Other music tracks are unchanged.
Combat's crit/block meter, hit marker, enemy pressure and deadlines remain in both
current modes. This entry supersedes all historical three-mode/Bard instructions below.

NOVEMBER 5 — HIT POSITION PIN (hit-marker-32)
A small orange ink pin lands at the resolved timing position on a correct combat
answer. It remains through the attack and enemy response, and clears with the next
hand/move, new question or encounter exit. The fill and threshold positions stay
at that question's snapshot while the pin is visible. Maths/cards use submission
time; word attacks use the final letter; Bard uses the same worst strike error
that grades the attack. Answers beyond the full bar pin at 100%. Wrong answers,
passive deadline strikes and missing timers do not create a hit pin. No damage,
scoring, pressure or difficulty rules change.

NOVEMBER 5 — LEARNABLE ENEMY PATTERNS AND BOSS PRESSURE (enemy-pressure-31)
This supersedes the blanket full-bar waiting rule below ONLY for explicitly
marked impatient enemies. It applies to all three modes, including typing attacks.

Enemy traits are fixed in src/data/combat.js, never scaled against bought gear:
- Rabid squirrels and killer rabbits: a correct answer always blocks THEIR attack,
  however late. Wrong answers still allow a hit. Damage and score timing tiers stay.
- Rabid dogs: impatient; strike once when an unanswered challenge reaches 100%.
- Ogres: shorten the block window by 5 percentage points.
- Black Knight and Skeleton Knight: shorten crit by 5 and block by 10 points.
- Both dragons: roar and strike at the deadline. Gristlefang removes 10 crit/15
  block points; the hill dragon removes 5/10. These are provisional tuning values.

Boss entrance: after committing, show original equipment-adjusted windows, a brief
roar/recoil and shake, then slide markers left over 0.9 seconds. Red hatched spans
show the exact difference between original and reduced thresholds. Action choices
appear after the 2.6-second entrance. No answer clock runs during the entrance.
The original roar slot was empty: a short original synthesized, non-looping growl
is now supplied as assets/audio/sfx/boss_roar_31.wav at restrained gain. Music and
voice settings are unchanged. Characters reuse their current art, with a slight
whole-sprite recoil; this is not a newly drawn open-mouth animation.

Pressure uses the strongest living source for each cutoff, not the sum of every
monster. Crit remains at least 10%, block at least 20% and never below crit. Gear
still widens windows; normal/weak stays at 75%. Windows freeze when a question
starts. A killed pressure source releases its penalty on the next question.
Tooltips explain current thresholds and red spans; intent labels distinguish
Correct = block, Full bar, and Pressure. English/Japanese text included.

An impatient deadline strike keeps the question and typed answer, consumes armour
normally, and marks that foe's response spent. It cannot repeat while waiting,
and that same foe cannot retaliate a second time on the late answer. Other living
foes still get their own normal response. Wrong submissions keep their hunter and
spell/backfire consequences; expiry itself is not a wrong answer or scroll use.
Input resumes after the brief attack/casualty sequence. If a committed card owner
is killed by that strike, its card is spent and the next hand is dealt. Otherwise
finish the same answer. Riddles/recruitment remain free of automatic attacks.
Bard deadlines use elapsed sweep time; its crit/block grades still use accuracy.
Any correct rhythm blocks a forgiving enemy, while missed rhythms still fail.

Validation: enemy-pressure, timing-block, timing-crit, math-timer, bard, knight,
squirrel-pack, party-roles and armour checks; muted browser tests of all modes,
entrance ordering, actual marker/band positions, single counter then late input,
roar asset resolution and English/Japanese tooltips. Saved-run formats unchanged.

NOVEMBER 5 — TIMING BLOCKS AND EQUIPMENT WINDOWS (timing-block-30)
This is the current rule in The Village Idiot, The Bard and The Knight, including
Sketchbook March. It supersedes earlier auto-timeout and crit/stun descriptions.

Baseline successful combat outcomes:
- Before 25%: 2x critical damage AND block the whole incoming enemy turn.
- From 25% through 50%: normal damage AND block the whole incoming enemy turn.
- Above 50% through 75%: normal damage; surviving enemies counterattack.
- Above 75%, including 100% and later: half damage; surviving enemies counterattack.
A timing block is protection, not stun. Enemies animate their strikes and show
blocked feedback, but consume neither red hearts nor silver armour. It covers all
attacking enemies, including enemies the player did not target, for this turn only.
Healing/resurrection amounts remain fixed; an early success also earns protection.
Wrong submitted answers still fail, advance hunters and allow the enemy response.
Fire/lightning retain their existing failure and backfire rules.

A full maths, typing or riddle timer stays full and waits for input. No automatic
failure, damage, hunter advance, score award or scroll consumption occurs on expiry.
The answer still resolves normally when submitted. Recruits wait for that answer.
Bard retains its rhythm targets: grading uses worst strike error relative to the
window's half-width, not total sweep time. Its outcome divider shows this error.
Missing a target locks in failure, but no damage/backfire occurs until the next
press (labelled Resolve miss). Targets cannot be rerolled by waiting.

Four small ink emblems sit at the outcome cutoffs: flaming sword, shield, sword
and devil, stick. Mouse hover or keyboard focus explains the actual current
percentage/effect. The same configured cutoffs position icons, ink ticks and grade
the answer. Tooltips support English and Japanese.

PROVISIONAL UPGRADE TUNING: each weapon level on the acting character adds 5
percentage points to the crit cutoff, capped at 45%. Knight cards use their owners;
combos use the highest owner weapon. Other attacks use their role's highest weapon.
Each remaining silver heart in the living party adds 5 percentage points to the
block cutoff, capped at 70%. Spent armour reduces the NEXT question's window.
Snapshot the windows when a question/rhythm begins; never move the goalposts during
that challenge. The normal/weak boundary remains 75%. Scroll/mead still ease the
challenge independently. Powerful actions still require harder/riskier challenges.

Score thresholds remain 4/3/2/1 for the original quarters and 2/1 for riddles;
upgraded combat windows don't increase score, and late correct answers earn 1.
Riddle bonus copper still uses the original first half, independent of gear.
Tests: timing-block, timing-crit, math-timer, bard, knight, squirrel-pack,
party-roles and armour; muted browser checks exercise all modes and the hover UI.

NOVEMBER 5 — SKETCHBOOK SOURCE PROPORTIONS (sheet-scale-29)
The opt-in /?biome=sketchbook&mode=knight road uses Magnus's supplied pen drawing.
All 18 world sprites share KM_LAYOUT.artScale (0.6 source-to-stage pixels); actor
artMul is 1. The former independent creature heights and scenery widths are removed.
Parallax changes movement and placement only. This preserves the source sheet's
relative drawn sizes, not hypothetical life-size buildings. The coif is a head study
used as a title portrait. review/sketchbook/sprites.jpg now shows a shared scale,
including repeated props, instead of equal-sized thumbnails. See its README and
tools/import_sketchbook.py. Single-pose actors and campaign-save isolation remain.

NOVEMBER 5 — SQUIRREL PACKS (squirrel-pack-27)
New roads in all modes start with one squirrel. Fight two has three, after the first tavern and riddle. Each marked pack announces one attacker at a time; the others circle. Killing or stunning that attacker cancels this turn’s bite. Subsequent turns rotate through living enemies. Later packs mix villagers, goblins and animals. Existing saved roads retain their encounter order. Knight playtest: /?debug&mode=knight&preview=squirrel-pack&v=squirrel-pack-27

NOVEMBER 5 — CURRENT PARTY HEALTH (two-hearts-26)
All three modes: every party member, including the player, contributes two red
hearts. A full four-person party has eight. First armour still changes the
villager's outfit; silver hearts absorb damage but no longer add or refill red
hearts. Two unhealed red damage is the casualty threshold, companions first.
Enemy HP stays per encounter. This supersedes the older cloth/armour values below.

NOVEMBER 5 — THE KNIGHT / THE BARD (knight-deck-25)
This section supersedes the two-mode description and old Bard tuning below.
Title modes: The Village Idiot (traditional maths), The Bard (timing), The Knight
(party-built cards resolved by maths). Separate run slots and local boards. Older
saves remain in their original mode. The road, art, shop and travel remain shared.

THE KNIGHT — one card, one sum, surviving enemies respond
Each living character supplies exactly two personal cards. Everyone shares one
Brace & jab: it keeps a waiting card in the deck even when the traveller is alone.
The solo opener offers the light and heavy attacks. With companions, hold three
cards. The first hand contains at least one easy card. No energy or end-turn button.
Square action and item cards and the next draw appear beneath the ground. Each enemy shows its own intent above its hearts after commitment.
Drag an attack onto the desired enemy, click a card or use keys 1–3 for the first
eligible enemy. Letting go away from a foe cancels. Only committing starts the sum.
Wrong answers/timeouts spend the card too. Kept cards stay in their slots. After
the enemy phase the spent card joins the back of the queue; the previously shown
next card fills just the empty slot. Winning ends the fight without a retaliation.
Fast correct answers retain existing crit/stun scoring. Item cards are modifiers:
drag a Scroll of Stupidity onto an attack, or click the scroll to prepare it before
the attack. It eases only that sum and keeps the scoring penalty; it grants no
extra attack. Mead retains its one-battle duration. A brace absorbs an incoming
hit before armour and expires at the next hand; it cannot build up across turns.

Power still costs difficulty and risky spells can backfire. Example: alone with no
weapon, Stick jab does 3 base damage on an easy sum and Overhead stick does 5 on
a hard one. The first sword replaces them with Sword thrust (4) and Sword cleave
(7), in the same slots. Damage is calculated from the actual owner's weapon when
the card is shown; buying a sword for a companion upgrades that companion. Armoured
parties get 2 block from Brace instead of 1 while any temporary armour remains.
Combinations add one card per recipe: knight + priest = Blessed blade (strike and
heal); two knights = Crosscut; priest + Timmy = Holy fire (all foes; failure burns
the party); wizard + executioner = Storm axe (lightning that can hit both sides);
two priests = Wake the fallen (can revive an eligible casualty once per fight).
Casualties remove their cards and broken combos before the next hand. Removed
members can come back via resurrection. Riddles and roadside recruitment still
use their normal encounters. No deck editor or second exploration deck.

WHY THIS DECK: Mega Crit's founders explain how showing enemy intent let players
plan. The Knight shows the upcoming attacks as damage, so Brace is a deliberate
choice. Team Lazerbeam's Shroom and Gloom grows existing cards and separates
exploring from combat. Here equipment grows the same card; walking, shops and
recruiting already handle exploration. Retaining the rest of the hand and showing
the next draw is our own one-card-per-turn adaptation, not either game's rules.
Sources: https://arstechnica.com/video/watch/war-stories-slay-the-spire-war-stories/
https://teamlazerbeam.itch.io/shroom-and-gloom

THE BARD — provisional difficulty for playtesting: battles 1–3 / 4–7 / 8+.
Weak swings: 1 / 2 / 2 marks, 200 / 175 / 150 ms each. Hard swings: 3 / 3 / 4
marks, 120 / 100 / 85 ms each. Lightning: 4 / 5 / 5 marks, 95 / 82 / 72 ms.
Phrases combine close pairs and longer rests. All marks are visible while arming,
the sweep speed is constant within a phrase, and scrolls widen the same marks in
place instead of rerolling. The escalating hit sounds and precision scoring remain.

NOVEMBER 5 — THE BARD TIMING TEST MODE (the-bard-24)

Latest approved mode names: THE VILLAGE IDIOT = maths; THE BARD = orange timing bar.
The title screen selects the mode before New game / Continue. The existing world,
party, gear and core power/difficulty/risk rule apply in both modes.

The Bard replaces every challenge input: combat maths, Timmy's typing, recruitment,
Frank restraint and the riddler's encounters all use the orange bar. No maths or
word entry, riddle-answer options, recruitment dice fallback or boss D20 in this mode.
The Village Idiot retains its current maths, typing, riddles and existing rules.

BARD TEST TUNING (provisional; adjust after playtesting)
- Begin with Space/Enter or the button. One pass travels left to right; press Space,
  Enter or the Strike button once inside every orange target. Held-key repeats are
  ignored. Hitting outside a target or passing one without hitting fails once.
- Weak: 1 wide target; hard: 3 narrower targets. Healing/recruitment/restraint: 2;
  fire/execute/resurrection: 3 tighter targets; Dark lightning: 4 very tight targets.
- Scroll of Stupidity widens the NEXT timing challenge's targets by 50%, then expires
  on success/failure; its -2 score penalty still applies. Cast before the pass starts.
  Mead widens targets for one battle. Three priests further ease heal/resurrect.
  This mode-specific adaptation does not change the maths mode's buff scope.
- Precision determines rewards, not the time of the final target: use the least
  accurate hit. Error within 25/50/75/100% of the target half-width earns 4/3/2/1
  points, with the same 2x crit+stun / 2x crit / normal / half-damage tiers.
  The keeper gives 2 points for precise rhythm, otherwise 1, and retains his rewards
  and three-encounter wizard unlock. The tally uses accuracy labels in The Bard.
- Fire failure in The Bard burns every living party member for 1 damage before
  armour; shared red-heart/casualty handling applies. A living teammate complains.
  The Dark Wizard retains the existing timing-scaled lightning backfire to both sides.
  Maths-mode Timmy backfire and blacksmith refinement remain future implementation.

HIT FEEDBACK — INCREASINGLY REWARDING
Every successful target builds doink -> DOING -> DOOOINK: the existing comic armour
bonk increases gain and drops pitch, the target pulses more strongly and the scene
jolts slightly. The timing track/cursor itself never shakes or changes speed from a
hit. Final target executes the full attack; intermediate beats do not deal damage.
No voice acting, new music autoplay or written sound-effect artwork was added.

PERSISTENCE / INTEGRATION
Independent run slots: knightMath.save (existing maths), knightMath.save.bard (Bard).
Old saves/scores without a mode remain maths. Leaderboard entries are partitioned by
mode (50 each), including end-of-run ranking/tally. Starting/clearing a Bard run never
clears the maths run. Global profile unlocks/memorials remain shared in this prototype.
?mode=bard selects The Bard on the title screen; mode choice is saved locally.
Engine: src/modes/bard.js; callbacks/input/UI: src/game.js; SFX: src/engine/audio.js.

Verified: deterministic boundaries, missed targets, repeats, graded damage/points,
mead/scrolls, fire/lightning backfire, tavern/road recruits, keeper, independent saves,
legacy score separation and unchanged maths paths. Muted isolated-browser checks:
mode controls, name entry, live cursor/Space input, three escalating audio events,
EN/JA layout, tavern and keeper timing challenges; no runtime errors. Audio progression
was checked through file/cue/gain/pitch tests; final subjective sound balance awaits play.
Screenshots/checks: review/the-bard-24/. No artwork or user storage was edited.

NOVEMBER 5, 2026 — CORE DESIGN RULE — POWER, DIFFICULTY AND RISK
NON-NEGOTIABLE DESIGN PILLAR. Explicitly confirmed by Magnus.
This rule takes precedence over conflicting older balance or handoff notes below.
Do not flatten or remove it during balancing, new modes, upgrades or future ports.

STRONGER ATTACKS REQUIRE HARDER CHALLENGES; DANGEROUS ACTIONS ADD FAILURE RISK.
- Weak swing: easier challenge, lower damage, the safer choice.
- Hard swing: harder challenge, higher damage. The extra power must be earned.
- Powerful spells: hard challenges and dangerous failure consequences.
- Preserve this relationship in maths, word typing and any future challenge mode.
  A change of input format must not turn the strongest attack into a free choice.
  Timing, rhythm and number-sequence alternatives are still discussion ideas;
  this rule does not establish them as implemented or scheduled features.

TEMPORARY HELP AND LASTING PROGRESSION
- Stronger attacks start harder, but temporary buffs and upgrades can make their
  challenges easier to perform. That improvement is intentional player progress.
- Do not silently increase challenge difficulty again to cancel a buff or upgrade.
  Make the distinction between base difficulty and modified difficulty explicit.
- Respect the existing scope of each buff: Scroll of Stupidity affects the next
  maths problem only; mead affects one battle. This rule does not extend either.
- A newly found, very powerful sword or mage staff may be usable immediately but
  demand a formidable challenge. The player can try it and experience that risk.
- A blacksmith can refine that weapon into something more manageable and reliable
  for progression into new biomes. The purpose is to make its powerful action
  practical to use, not merely raise damage or downgrade it into weak ordinary loot.
- Preserve meaningful weak/hard/spell choices as the player progresses. Exact
  damage, difficulty steps, upgrade costs and crafting details remain to be tuned;
  none are invented or confirmed by this note.

FIRE BOTTLES AND PARTY REACTIONS
- Timmy the Firestarter keeps his word-typing fire attacks and bottles/torch role.
  Failed bottle throws can accidentally set the player's own party on fire.
  This is a real gameplay consequence, not only a harmless visual gag.
- Another living companion comments on a teammate's failure with a short, absurd
  in-character written reaction. Keep one speech bubble per speaker, clear of
  faces. Voice acting remains removed. If nobody else is alive, omit the reaction.
- Backfire damage, duration, mitigation and interaction with existing enemy turns
  need explicit balancing; do not guess a numeric rule or stack extra punishments
  accidentally. Keep the current Dark Wizard backfire rules unless separately changed.

READABILITY
Show what an action does, its normal damage, challenge difficulty and meaningful
backfire risk before commitment. Show when a buff or upgrade reduces difficulty.
Use the existing concise UI; do not bury this information in extra menu screens.

IMPLEMENTATION STATUS — DESIGN RECORDED, NOT A GAMEPLAY PATCH
Existing weak/hard challenge differences, buffs and Dark Wizard backfires are the
starting point. Party-fire bottle failures, companion failure reactions, per-weapon
challenge requirements and blacksmith refinement are approved design work to
implement and verify. This documentation update does not claim they are playable.
Do not describe these features as delivered until checked in the actual game.

Future changes must demonstrate: weak is easier than hard at comparable conditions;
high-power actions carry meaningful difficulty/risk; an advertised buff/refinement
actually makes execution easier; failure consequences match the displayed promise.

NOVEMBER 5 — TAVERN DEPARTURES, COPPERS, DAMAGE LABELS (tavern-coppers-23)

Latest user decisions:
- Failed or timed-out tavern recruitment: that guest gets up and leaves. No D20 retry.
  Other candidates stay available until one successfully joins; cancelled maths does not evict anyone.
- One speech bubble per logical speaker, including during the outdoor/POV transition.
- Weak/hard (and stick) swing buttons show calculated normal damage per target. Equipment and matching
  companions feed the displayed value; the established timing crit/stun/late-hit rules still apply.
- Currency is coppers. New runs start with 5. Existing wallets are preserved, not reset or converted.
- Combat money is queued at defeated enemies' world positions. Walking over it collects it once,
  plays the existing coin SFX and shows +N coppers near the hero, after damage. Pending loot is saved.
  Squirrels, dogs, rabbits and toads never drop money and do not increase mixed-group rewards.
  Riddles retain their immediate performance reward, now labelled coppers.
- The local leaderboard survives browser/app sessions on the same origin/profile. It already uses
  knightMath.leaderboard.v1 independently of run saves; confirmed by closing and reopening an isolated
  Chrome process, then starting a new run. No server or user-profile changes were needed.
- Magnus withdrew the strict colour limit. Use the approved concept as visual reference, preserve the
  knight, allow restrained earth-tone variation. Starter cap and shirt are dirty orange with existing
  print texture; enemy peasant clothing/cap/boots use muted fabric/leather colours rather than all paper.

Implementation: runtime garment masks baked with the unchanged v21 rigid walk and original cutouts;
no character redraw, silhouette, pivots or cadence changes. tools/build_cloth_masks.cjs rebuilds both
masks in assets/villager-start/materials. Palette renderer is calibrated per asset, not a universal
quantiser. Source PNGs are retained. Tavern departure reuses the matching existing coif/helmet or
specialist walk, clipped behind the table. This is a short prototype stand/turn/exit, not newly drawn
frame-by-frame stand-up artwork. Missing seated costume variants remain a broader art limitation.

Checks: tavern-loot integration suite covers wrong/timeout, cancellation/success, persistence,
one bubble per speaker, delayed once-only loot, mixed animal groups, old wallets and live damage.
Roles, camp/shop, starter, progression, timing/score, wizard/Japanese and leaderboard suites pass.
Muted isolated browser checks: one recruitment bubble; departure stages; damage then road pickup;
EN/JA two-row buttons; new-run 5 coppers; actual starter/enemy colour rendering; no runtime errors.
Leaderboard survived a complete browser close/reopen and New game in the isolated test profile.
User saves, scores and audio preferences were not modified. Proofs: review/tavern-coppers-23/.
Backups: backups/tavern-coppers-23/. New colours remain subject to Magnus's visual review.

NOVEMBER 4 — PALETTE LOCK, TITLE SPACE, CAP/STICK, WIZARD (world-polish-22)

Magnus requires explicit allowed colours and comparison to the corrected concept. Read
art-direction/STYLE_GUIDE.md; the approved eye-glint concept is copied beside it. Palette constants
and calibrated render-time treatment are in src/config/palette.js and src/engine/palette.js.
Do not use the earliest staring-eyes concept as the face reference. New art is pending user review.

Title/subtitle moved to centred sky; navigation fits the lower strip. Starter gains fitted leather
cap covering ears and a wooden stick, attached to existing v20 cutouts and v21 stride. No stats added;
sword purchase replaces stick, armour replaces cap; armour-only retains stick. Wizard faces are
slightly friendlier, with eyes/glints, and hat tip consistently points left in top-row walk poses.
Tavern room uses shared parchment compositing; exterior calibration bypasses old salmon-tinted ink.
Palette converts affected sprite fills to approved neutral parchment/brown/orange families.
Squirrels enlarged 25%, with matching bounds. Original sources and prior assets retained.
Validated in a muted isolated browser: all three outfit atlases loaded and visually checked,
correct 30% longer stride metadata, both tavern sleeve variants, exterior palette, title in English
and Japanese with/without Continue, no runtime errors. Starter, wizard/Japanese and score tests pass.
QA images live beside the guide. User art approval is still pending.

Builtin image edits; prompts in art-direction/generation-prompts.json. Source alpha cleanup follows
the user's prior explicit authorisation; no change to original sprite geometry for colour grading.

NOVEMBER 4 — LONGER VILLAGER STRIDE (stride-21)

Magnus requested longer steps and less frequent planting. Unequipped/sword-only villager walks
now use 30% longer foot travel, rebaked from the same v20 cutouts and rigid animation equations.
Root-motion metadata increases from 235.636 to 306.327 px/s; the existing walkRate calculation
therefore lowers cadence by 23.08% at the unchanged road speed. Footsteps follow the new cadence.
Idle, artwork, character scale and original armoured knight motion remain as before.
Validated 1001 poses: fixed limb lengths, reachable targets, flat planted feet, loop closure,
no atlas clipping. Rebuild: tools/build_villager_stride_v21.cjs (@napi-rs/canvas required).

NOVEMBER 4 — WOODCUT STARTER, ORIGINAL WALK MOTION, LOCAL SCORES (woodcut-score-20)

Magnus rejected the pale, softly shaded Henry-like starter. New warm woodcut cutout approved as
"Better" in chat. Straight hair retained. Source drawn using builtin imagegen against the scarf
companion; prompt in assets/villager-start/v20/generation-prompt.json. The old 4-frame march is replaced
by 8 x 125ms atlases baked from the approved v13 rigid-cutout runtime: same 55% stance, on-screen stride,
foot lift, counter-sway, head/arm motion and cycle period. This is the old approved walk system;
DO NOT revive the cancelled v26-v31 humanoid-rig experiment. New cloth limbs are rigid attachments,
not eight independently generated pictures. Each outfit has the same scale and pivot as the knight.
Sword-only uses the same body/rig plus the old sword. Armour-only uses the original knight's parts
with an empty hand. Full gear still uses the untouched approved hero atlas. Existing saves retained.
Sources, cut parts, rig and rebuild tool are included. Only authorised alpha cleanup was applied.

Footsteps still use the six original knight recordings; the files had not changed. The mix is now
quieter (hero .32, companions .14), sounds follow the visible outfit, and companion impacts do not
stack on the hero's beat. World speed and music settings are unchanged.

Validation: starter/equipment, audio, accounting and leaderboard tests pass. Checked in a muted
headless browser: walk active, count-up progressing within each category, rankings/escaping/layout,
no console errors, and no saved score from preview. User storage was not used for tests.

Local leaderboard approved by Magnus: completed normal runs recorded once per runId in a separate
knightMath.leaderboard.v1 key. Top 50 retained, top 10 shown plus the current run if below tenth.
Order: score descending, then distance, then oldest date. New games and save clears do not erase it.
Debug/preview/notimer runs do not enter the rankings. No server, no invented historical scores.
Score banner now increments each category and the total visibly, including scroll deductions and
survivor bonus. Show total skips the count-up; Leaderboard opens rankings; Continue closes it.
Leaderboard also accessible on title and end screens. English/Japanese labels included.

NOVEMBER 4 — STRAIGHT HAIR CORRECTION (straight-hair-19)

Magnus explicitly rejected the curly-looking hair. All eight bareheaded player frames now use
short straight brown hair, a flat fringe and straight engraved strands. Retain this hair texture
for future variants. Henry-like face and current clothing/poses remain the visual reference.
Active atlas: assets/villager-start/walks-henry-straight.png; matching frame measurements in
frames-henry-straight.json. Same 1448 x 1086 canvas and 362px cells; foot baselines measured again.
Original helmeted row and approved fully equipped knight still use their earlier assets.
Builtin imagegen edit; prompt saved in assets/villager-start/straight-hair-prompt.json.
Same authorised alpha cleanup as the prior version. Previous art remains available.

NOVEMBER 4 — HENRY-INSPIRED VILLAGER FACE (henry-look-18)

Magnus requested that the main character look a bit more like Henry from Kingdom Come: Deliverance.
The eight bareheaded walk frames (unarmed and sword-only outfits) now have short brown cropped hair,
a younger fuller face, square jaw, natural short nose and faint stubble, in the existing woodcut style.
New versioned asset: assets/villager-start/walks-henry.png, 1448 x 1086. Frames remain 362px cells.
Per-frame foot pivots/top bounds measured again. Original helmeted row and fully equipped knight
still reference their original artwork. Gameplay, outfits, frame order and timing are unchanged.
Created with builtin imagegen; exact prompt in assets/villager-start/henry-edit-prompt.json.
The same previously authorised alpha cleanup removes matte fringes and makes interiors solid.
Original atlas and previous configuration are preserved. This remains a four-frame prototype walk.

NOVEMBER 4 — DIRECT NAME ENTRY / VILLAGER START (villager-start-17)

Implemented after Magnus's approval to start as an unequipped village nobody.
New game now immediately focuses the name field. Enter / Begin starts walking; no Next or Skip
before or after the name. Merely opening name entry does not erase the previous save; submitting
replaces it. Continue keeps the old run, equipment, wounds and knight appearance.
New-run hero: origin=villager, two red hearts, zero weapon, zero armour, zero scrolls and bottles.
The existing version-2 opening curve is retained: three small animal battles with simple maths,
then villagers, goblins and larger enemies. Seeded variety, road scenery and stop indices remain stable.
Unarmed moves are Quick punch / Heavy punch (same existing easy/hard maths and damage formula).
Buying a sword adds the normal weapon bonus and switches to sword attacks. The FIRST armour purchase
sets armorTrained=true, raises max health from 2 to 3 and fills only that new heart. Existing wounds
remain. Subsequent armour purchases only replenish the consumable silver armour; spending it does
not remove training, the extra maximum heart or the outfit. This is a prototype balance choice.
Cloth, sword-only and armour-only outfits use separate atlas rows. Both sword + armour training
restore the existing approved hero art and walk unchanged. Old saves without origin stay knights.
The unarmoured tavern POV uses cloth sleeves and bare hands. Entering the tavern and dragon depth
fallbacks respect the current outfit. Unarmoured deaths do not substitute the old armoured corpse.

Assets: assets/villager-start/walks.png (1448 x 1086, 4 x 3 cells of 362 px), frames.json,
tavern-cloth.png and prompts.json. Created with builtin imagegen using the approved references;
only the previously authorised deterministic alpha cleanup was applied (alpha >=180 becomes solid).
Measured per-frame foot baselines, shared 592/325 size calibration against the approved knight.
Limitations: four drawn walking poses per starter outfit, procedural combat lunge and simple stepped
fall. These are prototype animations, not a new bone rig or a complete bespoke death/attack pack.
The existing knight's animation sheets are untouched. No claims of final polished starter animation.
Validation: villager-start integration tests cover direct name -> road, saved-run protection,
legacy saves, two/three heart rules, both purchase orders, no repeated healing, retry and atlas bounds.
Related combat, roles, timers, scoring, graves, recruitment and Japanese regression suites pass.
Browser verification: name field immediately focused; Enter led directly to the road, with two
hearts and the unarmed outfit visible. No browser errors. Audio regression suites also pass.
Use ?debug&preview=start for isolated name-entry testing (no user run saves).

NOVEMBER 4 — AUDIO REPAIR / SHUFFLED WORLD MUSIC (audio-world-16)

Magnus has explicitly allowed music again. The music button is used to enable it; keep the immediate
mute, hidden-tab silence and cross-tab stop protections. Voice acting remains removed.
Title, intro, road and victory now use the same world channel and its six existing tracks. Every
shuffle cycle plays all six once, avoids adjacent repeats across cycle boundaries, and the road
track resumes after fights. No fixed Quest Theme on every opening. No new music was generated.
Correct/wrong SFX used OGG files whose MP3 fallbacks were missing. Both audio maps now point to the
six existing WAV masters. All other active SFX files and their browser fallbacks were checked.
Playback rejections now produce a concise console warning instead of silently hiding a failure.
Validation: audio-world, music-silence and no-voice suites passed using silent media doubles.
Browser verification page: review/audio-world-16/sound-check.html (six brief SFX, no music/VO).

Design discussion, not implemented: start as an unequipped village nobody, earn the first gear and
companions while escaping the village; early squirrels/simple sums, then harder stages. First map
name The Village Idiot already exists. Initial HP, starter weapon/art and stage boundaries still
need design/implementation; do not describe the villager start as already playable.

NOVEMBER 4 — THE VILLAGE IDIOT / JAPANESE / DARK WIZARD (village-jp-15b)

The first map is named The Village Idiot (Japanese: 村のまぬけ). The game name remains Medieval Math.
English / 日本語 buttons appear on the opening screen; choice persists separately in knightMath.language.
Japanese includes UI, story/current barks, score tally, tavern menu, 12 native Japanese riddles and 16
kana/romaji typing words. Type the displayed Latin letters; kana above provides the Japanese reading.
English save identities and math values are unchanged. The hand-painted shop sign remains the proper
name SCROLLS AND STUFF in its original illustration; shop UI is translated.

Solve three DISTINCT riddle encounters in a run to unlock the Dark Wizard. Progress saves with the run;
unlock survives death/new games in knightMath.profile.unlocks.darkWizard. Retrying the same riddle
cannot farm unlock progress. Debug previews never grant the persistent unlock.
New runs use routeVersion 2: same slow countryside curve, plus a roadside wizard offer after the third
riddle. Locked offer is skipped. It becomes available immediately when that third riddle unlocks him.
On later runs he may be offered in a tavern (seeded 60% at each eligible tavern); otherwise by his rock.
Only one wizard offer per built route. Old routeVersion 0/1 saves keep exact stop indices; their unlock
becomes recruitable on a subsequent run if no tavern remains ahead. Tavern still allows ONE recruit.

Dark Wizard: cloth, TWO hearts, black ragged pointed hat with the riddler's eyeball taped to its front.
Dark lightning is gated by his living presence (shortcut 6), hard maths subject to normal curve/scrolls.
Prototype balance: correct = 7 damage to EVERY living enemy, multiplied by matching-wizard bonus and
existing answer timing (crit/stun/weak-hit). Wrong/timeout = lightning on EVERY living combatant on
BOTH sides. Backfire damage per target by elapsed-time quarter: 3 / 2 / 1 / 0.5. Timeout = 0.5.
Each party member's armour absorbs their own lightning first. Remaining red damage enters normal
shared casualty rules. Enemy survivors retaliate normally. Simultaneous party wipe takes priority.
Wrong-answer hunters +1; normal success score / scroll -2 rules remain intact.

With a wizard in party the riddler says: “You! And my EYE!” A wrong answer OR timeout deals one red
heart to that wizard, records his personal riddle wound, and makes the riddler disappear immediately
(no second answer). Two unhealed riddle wounds kill that wizard; healing removes these wounds first.
Companion grave rules still apply. No generic companion is chosen for this specific retaliation.

ART: assets/wizard-riddles/wizard.png is a 1536×1024 RGBA atlas, 3×2 cells of 512 pixels.
Top row = walk A / walk B / idle; bottom = casting / seated / rear. All side poses face right; road
recruits are mirrored toward the party. Config wizard-art.js holds per-pose pivots and scale (1.25),
with the seated upper body cropped only at runtime to meet the tavern tabletop. Two-frame walking
is a prototype held-pose loop, not a new bone rig. A custom drawn wizard death is NOT provided;
he uses the existing specialist death fallback. Existing approved knight art and walks are unchanged.
Two additional riddler peeks: riddler-left.png and riddler-over.png. These are combined character+rock
cutouts; the original pose still has separate keeper/rock layers. Third encounter draws the over-rock
pose smaller, higher and at 0.55 camera movement in the mid lane. Portraits remain opaque, with clean
alpha outside. The code cleanup only normalises low-alpha fringes, preserving original solid RGB.
Prompts retained beside the PNGs. No synthetic extra puppet poses were added.

Music remains OFF; voice acting stays removed. Existing sound effects remain.
Checks: 11 silent integration suites, including multi-enemy lightning/backfire, armour, direct riddler
retaliation/healing, unlock persistence/preview isolation, camp/shop/score regressions and language
content. Browser reviewed English/Japanese start, riddles near/far, kana/romaji, wizard combat,
retaliation and seated tavern art. Screenshots: review/village-jp-15/.
Normal game: http://localhost:8801/?v=village-jp-15b (NO debug/preview parameters).


# Latest update — scrolls-stuff-14 (4 November 2026)

- Normal game: `/?v=scrolls-stuff-14`. **Voice acting removed; written dialogue and sound effects remain. Music stays off.** Audio has no VO media element, loading, gesture unlock or playback. Legacy voice hooks are silent no-ops. Never re-enable voice from historical instructions below.
- Shop and stall are named **Scrolls and Stuff**. New transparent painted booth/sign: `assets/v11/ui/scrolls-and-stuff.png` (1254×1254), narrower at the old height, stocked with scrolls/books, swords, helmet, mail and shield. Existing shady seller stays separate behind the counter. Config: `src/config/art_v11.js`; source edit prompt beside PNG. No other character art changed.
- Buying a sword or armour plays `buy_gear` only after a valid recipient purchase. It uses three existing blacksmith anvil recordings, their browser-compatible WAV masters. No sound when opening/cancelling the recipient chooser or when purchase fails. Both audio maps updated.
- Camp recruitment failure or timeout: hunter advances normally; candidate turns away and walks into the picture using existing rear sprites, getting smaller/higher over 4.5 seconds. He remains a small distant figure until the party leaves. No dice offer and no replacement candidate on revisiting/loading that camp. Other recruitment dice rules unchanged.
- Final survival bonus: **+2 per living party member, including the main knight**, at victory. Dead/dying/eaten members do not count. Death is a party wipe with no survivors. This is computed at the end, never repeatedly added to earned score.
- Both endings open a quiet parchment score banner. Rows explain timing-band points, riddle points, scroll deductions, then surviving party members. Rows reveal and add into a running total; Show total skips the tally, Continue returns to the ending. Enter/Space/Escape follow the same two-step flow. No music or voice accompanies it.
- `src/engine/score.js` maintains a saved accounting ledger; `src/engine/score-banner.js` handles presentation. Existing scoring rules remain 4/3/2/1 for math/words, 2/1 for riddles, -2 per correct scroll-assisted sum. Earlier unitemized saved points appear as Earlier answers rather than fabricated timing details. New run resets both ledger and score. Preview score fixture: 27 earned +2 sole survivor =29.
- Silent tests: `shop-score-camp.test.js`, `no-voice.test.js`, plus timing, party, rest, timer, curve, armour, graves and music-silence suites. Browser proofs: `review/scrolls-stuff-14/`. Backup: `backups/scrolls-stuff-14/`. No GitHub changes or live-save reset.

---

# Historical update — timing-score-13 (4 November 2026)

- Normal game: `/?v=timing-score-13`. Includes all timing-crit-12 changes below. **Music stays off.**
- Added final score to both death and victory screens using carved numerals. No extra active-game HUD clutter. Maths/word solutions score **4 / 3 / 2 / 1** in the four timer quarters. Correct riddles score **2 before halfway, otherwise 1** (including a correct retry; retry still pays no coins).
- Correct scroll-assisted maths subtracts **2** from that award: **2 / 1 / 0 / -1**. Negative totals allowed. Mead does not deduct points. Incorrect/expired/cancelled answers and dice rolls score zero.
- All maths entry points count, including recruitment, healing/resurrection and talking Frank down. Score is saved with the run and checkpoint; old saves default to 0 rather than inventing historical timing. New runs reset to 0.
- `src/engine/timing.js` returns damage grade and points from the same elapsed fraction. Guarded answer handlers award once before consuming the scroll. Explicit `problem.scrollAssisted` distinguishes scrolls from mead.
- Silent VM coverage: exact thresholds, scroll negatives, all attack types, riddle rewards, duplicate submissions, saves/old saves/new run, death and victory markup. Browser-only fixtures: `/?debug&preview=score` and `/?debug&preview=score-win`, sample 27 points, no save writes. Not a start-page change.
- Proof and validation: `review/timing-score-13/`. Earlier timer proofs: `review/timing-crit-12/`. Backups: `backups/timing-score-13/` and `backups/timing-crit-12/`.

---

# Historical update — timing-crit-12 (4 November 2026)

- Normal game: `/?v=timing-crit-12`. Music remains off; no saves reset.
- Divider now has black threshold lines at 25%, 50%, 75%. Same fraction drives the fill and outcomes (`src/engine/timing.js`, rules in `src/data/combat.js`). Preserve the central ornament.
- Correct attack before 25%: **2x crit + one-turn stun** on hit survivors. Before 50%: **2x crit**. Before 75%: normal. From 75%: half damage (fractional, no rounding up). Expiry: no hit, existing failure. Wrong answers never crit. `crit`/`stunned` float text; untouched group members still retaliate. Heal/resurrect/D20 unchanged.
- Riddles remain encounters: first correct answer before 50% = double coins, otherwise normal coins. No late penalty or combat. Provisional 30-second reading timer. Wrong/timeout advances hunters and allows one no-reward retry, then exits. Rerendering menus never restarts that clock.
- **Scroll of Stupidity now affects one maths problem only**, including recruitment/restraint/healing. Answer, timeout or backing out ends it. Mid-sum cast before typing replaces that sum, with a fresh timer. Words/riddles do not use it. Mead remains one battle. Loaded old remaining counts clamp to one, keeping inventory charges.
- Validation: focused silent VM suites cover exact band boundaries on every attack, one-turn stun, group survivors, expiration/input race, riddle coins/retry, scroll consumption/save migration, plus prior timer/party/armour/camp/route/music regressions. Browser proof and final results: `review/timing-crit-12/VALIDATION.txt`.
- 2x crit, 30-second riddle timer and 2x fast-riddle coins are provisional playtest values. No new art or changes to world/hero rigs.
- Backup of replaced files: `backups/timing-crit-12/`.

---

# Historical update — rogue-curve-11 (4 November 2026)

- Work in `/Users/magnusjansson/A Hard Days Math`. Music remains off. Normal play: `/?v=rogue-curve-11`.
- New games use a seeded 12-fight progression: one squirrel, then three squirrels, then one dog or rabbit; rabid villagers and mixed packs, skeleton, toad, ogre, Black Knight, dragon. See `src/engine/progression.js`. Old saved routes retain their indices; **New game** opts into the new pacing.
- Wounds persist after victories and into subsequent encounter casualty checks. Camps offer **Make camp → full red HP**, exactly one recruit if room, and Walk on. No gear or sales in camps. Rest and one-successful-recruit limits persist per camp across reloads. Priests/stew still heal; rest does not restore armour or resurrect.
- Shop tiers after fights 2/6/11 (gear caps 1/2/3; swords 7/10/13, armour 5/7/9). Other recovery stops after 1/4/8/10. First sword upgrades now increase damage immediately; every knight's weapon contributes to the mean sword bonus before matching-class bonuses.
- All maths paths have a left-to-right glowing divider timer. Deadlines now vary from 8–24 seconds with actual question complexity; opening/middle/late question ranges rise gradually. Scroll/mead questions keep at least 16 seconds, and mid-question scrolls preserve any longer deadline. Timmy's typing retains its own timer. Untimed mode requires explicit debug+notimer.
- Armour overlays remain packed at the far left of the whole HP row. Previous Execute/tavern-choice/formation fixes retained.
- Death on a new route offers a fresh run with the same name, no gear/money/companions, and skips intro. Persistent graves/best-distance remain. Legacy checkpoint retry remains for legacy saves.
- New built-in ImageGen art: `assets/enemies-small/{rabid_squirrel,rabid_dog,rabid_villager}.png`. Exact prompt set and alpha audit: `review/rogue-curve-11/`. User-authorised code cleanup removes low-alpha fringe; opaque RGB is unchanged. These are cutouts using existing snap reactions, **not full animation sheets**. The failed rabbit-like squirrel output was rejected.
- Validation: all nine focused VM suites passed (including 100 seeded routes); browser checked new enemy scale, clean edges and camp full healing with one recruit/no shop. No console errors; music stayed off. Proofs and limitations: `review/rogue-curve-11/VALIDATION.txt`.
- Balance numbers are provisional for playtesting; no claim of a fully tuned roguelite or complete animation pack.
- Backups before this update: `backups/rogue-curve-11/`. The prior left-packed armour/timer work has its own `backups/left-timer-20261104/` backup.

---

# Historical update — left-timer-10 (4 November 2026)

- Armour overlays start at the far left of the entire red-heart row, using total party armour; equipment ownership does not position the silver hearts. Remaining armour stays packed to the left as it is used.
- All generated maths questions now default to 35 seconds, including every recruitment path and Frank's restraint sum. A fully open tavern no longer pauses it. Word attacks keep their own shorter timer. Timeouts retain each question's normal failure consequences.
- Divider fills left to right (including the centre ornament), with brighter orange ink and a stronger warm glow. New questions / scroll replacements reset it immediately. Untimed review mode requires both debug and notimer.
- Music remains off. Normal URL: `/?v=left-timer-10`.

---

# Latest update — choice-armour-9 (4 November 2026)

- Execute is disabled above 50% HP, enabled at or below half for the front living target. Button, keyboard, and answer resolution share the gate; multiplication and double damage apply.
- One successful recruit per tavern stop per run, including D20 wins. Failed attempts do not spend the choice. Saved by stable stop index; re-entering/reloading does not reset it. Other recruitment locations are unchanged.
- Silver armour hearts cover red hearts in the same HUD row. Damage exposes the red beneath; no extra row or purse shift. Extra armour over a cloth member's capacity uses small horizontal plate offsets.
- Enemy groups use four positions on their side, reserve the full party's width, and may overlap each other. No more replacing/dropping enemies to fit. Normal enemies are solid and coloured before Fight too. The hill dragon keeps its separate distant treatment.
- Music remains off. Tests use fake audio. Cache revision: choice-armour-9.
- Validation: choice-armour, party-roles, armour, rest-road and music-silence VM tests passed. Browser checked the single-row armour, successful tavern recruitment locking the other visitor, the four-enemy formation, and Execute switching from disabled to enabled after a weak hit left the front goblin at exactly half health. Proof images: `review/choice-armour-9/`. Silent formation preview: `/?debug&notimer&preview=formation`. Normal play remains the plain root URL.
- Backup of changed originals: `backups/choice-armour-20261104/`.

---

# Latest update — rest-road-8 (4 November 2026)

- Companion-only cross graveyards are implemented in `src/engine/companion-graves.js`; separate profile v5 `companionGraves` records persist beyond new games. Same-area deaths get stable free slots at 3 depths. Resurrection removes its own grave. Main-player memorials remain unchanged; enemy deaths create no graves. Preview `/?debug&notimer&preview=graveyard` uses 12 temporary records and never writes them to the profile.
- Health: cloth 2 / armoured 3 red hearts. Armour is consumable silver hearts over red, deterministic absorption and spillover, with “blocked!” even when the last armour is spent. Only red loss counts for casualties. Healing affects red only. Migration preserves existing wounds.
- Camp now uses road props, not a boxed scene. Tavern exterior enlarged; first-person room/table + separate seated visitors actually rendered. Two distinct poses, role-correct hood/coif portraits, hands on table, separate named controls, contextual fare/recruit options. Exterior/enter/exit/walk-on checked in browser.
- Cache revision: rest-road-8. Clean icon filenames end in `-cutout.png`; cleaned troll atlas is `assets/v19/sequences/ogre-sequence-clean.png`. Original names can remain cached in older tabs.
- Shop reuses existing sword/armour drawings; exterior paper mattes removed. Right-side icons/prices, scroll direct inventory, equipment recipient popup; no money charged on open/cancel.
- Bubbles are fixed-proportion images, centred and horizontally mirrored only. Face avoidance moves the whole frame; no stretched tails.
- Walk multiplier 1.8. Troll 1.85x with corrected feet/HP bounds and baked rectangle borders removed from all six frames.
- Final boss now uses `assets/bosses/mud-dragon-coiled.png`, enlarged beyond the upper screen edge. All 3 heads visible. Old one-headed eating animation deliberately disconnected; matching new boss eating animation remains unmade. Frank's hill encounter remains separate.
- New raster art made with built-in image_gen, referenced from approved game art. Exact prompts: `review/rest-road-7/ART_PROMPTS.json`. Active seated art: `assets/tavern-pov/visitors-v2.png` and `specialists-seated.png`; room: `room.png`. Do not substitute the first same-pose visitor draft.
- Silent VM tests: party-roles, armour, rest-road, bubble-placement, music-silence, companion-graves. Browser proof images under `review/rest-road-7/`. Preview modes never overwrite a real run; use the plain root URL for normal play.
- Do not enable music. No GitHub operations performed. Existing backup: `backups/rest-road-20261104-063529`.

---

# Current handoff — 4 November 2026

Read `GAME_DESIGN.txt` for the current consolidated rules. This section supersedes the historical notes below.

- Work in `/Users/magnusjansson/A Hard Days Math`. The chat's attached `Rats_Ai_Testpilot` folder is an unrelated project. Do not edit it for this game.
- **Do not play music while working/testing.** Music now starts muted on every load, even with an old unmuted profile. The visible Music button / M is the only opt-in. Volume keys and game actions do not enable it. Muting pauses every channel immediately and silences other updated tabs; hidden tabs mute themselves. OS media Pause/Stop also mutes. Old already-running tabs require a reload to get the fix. Fake-audio tests avoid audible testing.
- Every riddle stop now uses the approved black-robed, one-eyed keeper with his separate foreground rock. He replaces the enchanter and hermit at their existing spots; all three riddle encounters and their spacing/rewards remain. Preview: `/?debug&notimer&preview=riddle`.
- Previous bucket-helmet hero and baked walk retained. The cancelled custom rig stays cancelled.
- Party max four; hero, ordinary knights and firestarters have three hearts, priests/executioners two. Healing reduces unhealed battle damage. Hero dies last.
- Matching attacking classes add 50% damage per additional living member. Priests instead unlock Heal/Sacrifice at one, Resurrect at two, easier priest maths at three. Heal amount does not stack. Extra priest recruits are available.
- Frank is the Mad Priest, with orange hood up and the same approximate standing height as the knights. Only a priest may be sacrificed. Hide abilities without their required living member.
- Timmy uses the chainmail-coif design, bottles and a torch. **Word-typing attacks**, not two words or two uses. Existing fire visuals are reused; bottles are no longer sold.
- Executioner: cloth/black hood, two hearts, multiplication only, Execute only at 50% HP or less, for double damage.
- Move prompt sits above up to two rows of four plaques. Birds are 50% smaller than before this update.
- Dragon transition V2: fixed road/world, shrinking rear-view party climbs to the hill crest then disappears behind it; ink wipe to hilltop combat with sky only; ink return to the same road position. Strength is hidden until commitment/arrival.
- Provisional balance: Resurrect once per battle with one restored heart; Heal up to two hearts/two uses; fire one word/seven seconds. These are tunable choices, not additional user-approved requirements.
- The three new specialist sheets are **prototype two-contact walks and single action poses**, not a complete production animation pack. Some brutal death sequences still use stand-in art. See `assets/party-roles/GENERATION.txt` and `sprites.json`.
- Tests: `node tests/music-silence.test.js`, `node tests/party-roles.test.js`, `node tests/scenery-depth.test.js`. `tests/frank-encounter.test.js` forwards to the updated role suite, including Frank's maths and D20 recruitment.
- Preview URLs: `/?debug&notimer&preview=roles`, `preview=priests`, `preview=twins`, `preview=dragon`, `preview=frank`, `preview=heal-locked`. These do not overwrite the run save.

---

# Historical notes (superseded where they conflict with the current section)

## Frank recruitment and the hill dragon (3 Nov 2026)

- The named roadside recruit after the rabbit is Frank the Priest, before the skeleton boss. Recruitment uses the existing sum, then D20 fallback on failure. He occupies one of the four party slots and brings two hearts.
- The battle Heal action requires a living Frank in the party. Death or sacrifice removes this access immediately. Stew and camp recovery retain their established rules.
- The distant dragon only triggers Frank's challenge if he is in the party. Agree to fight, or solve restraint maths to talk him down. Success passes safely; failure advances the hunters once and commits to the fight. Enemy strength remains hidden until commitment and arrival.
- Agreement sends the whole party diagonally into the image, using the approved rear-view two-pose atlas, then perspective-scaled side-view battle sprites beneath the dragon's hill. Road camera/distance freeze during the detour. Victory returns survivors to the road before progression resumes.
- Approved rear atlas, exact source rectangles, clean separated hill, and built-in image_gen prompts: `assets/frank-encounter/`. These are simple two-pose walk cutouts, not a new bone rig. Frank's road-side artwork remains the existing friar cutout; it has no dedicated side-walk/death sheet.
- `?debug&preview=dragon` previews with Frank + two knights; `?debug&preview=frank` previews recruiting. Preview mode does not write the run save.
- Old saves retain their stop and party. A run already past Frank's recruitment does not receive him retroactively; start a new run to recruit him.

# Medieval Math — handoff (2 Nov 2026)

## Current direction — previous knight restored (3 Nov 2026)

Magnus cancelled the entire custom humanoid rig/artwork experiment (v26–v31). Its editor, runtime, new art and exports were removed from the active project. The game again uses its earlier bucket-helmet knight and existing v13 baked walk sequences via the original asset renderer. Attacks/deaths and companion sequences are retained.

Preserve the environment work, including countryside opening, depth/parallax corrections, repaired scenery, loading art and tavern transitions. Focus next on game mechanics. Do not resume the cancelled rig or redesign the knight unless Magnus explicitly requests it.

Magnus asks that capability/quality uncertainty be stated before substantial work or credit use. Demonstrate an uncertain approach with a small test before expanding it; technical checks alone are not visual-quality approval.

## How to play
Unzip, then open `index.html` in Chrome (double-click works; or run `python3 -m http.server` in the folder and open http://localhost:8000).
- Keyboard: number keys or arrows + Enter.
- Mouse: click the tavern door, NPCs, the TAVERN FARE sign, and the plaques.
- Space advances bubbles; Esc skips the intro.

## What's in this build
- **Intro:** the skeleton narrator on his rock (Magnus's art) instead of the dragon. The VO hooks vo_intro_01..08 play `assets/audio/vo/<id>.ogg` when the files exist. They haven't been recorded yet: Charlie is doing them with ElevenLabs Starter, which Magnus approved.
- **Combat:**
  - Weak swing / Hard swing / Heal plaques.
  - Party hearts top left, 2 per member; the hero dies last.
  - The purse sits under the hearts.
  - The hunter meter is orange dots, with a skull chasing a helmet.
  - Monster hearts: at most one row of 10.
  - Darkest Dungeon style lunges both ways (0.55 s).
  - Fights are mandatory; only some optional, risky ones can be declined.
  - Enemies slide in on the ground line.
  - From 5 leagues on, there are fights with 2 or 3 enemies, and the sword hits the front 2.
  - Combat SFX are Charlie's steps, swings and hits.
- **Sums:** large and centred. They auto-shrink so they're never cut (`fitSums` in src/game.js).
- **Tavern:**
  - The interior fills the screen; seated NPCs sit behind tables.
  - Selection works with hotspots plus click.
  - The TAVERN FARE sign swings when picked. Mead gives one battle of stupidity (limit 1 per visit), stew heals +1 heart (limit 2 per visit).
  - Recruiting: "Join my party?", then the NPC's reply, then a sum.
- **Riddles:** the riddle sits in Magnus's frame where the sum usually is, with the answers as plaques underneath.
- **Sky:** Magnus's clouds and birds, now drawn at 0.55× and 0.5× (`cloudMul` / `birdMul` in src/engine/scenery.js). There are no mist bands.
- **Cobra's v19 art merge:**
  - The background dragon on its hill at Frank's stop.
  - The mega boss with all 6 eat drawings.
  - Brutal deaths: eaten, torn apart, arrows.
  - The coif's own death.
  - Toad and ogre as road enemies.
  - See AUDIT_ART.md.

## Open questions for Magnus
1. Is Frank's stop the right place for the hill dragon to first appear?
2. Toad and ogre stats (7 hearts, 1 damage) and their placement just before the boss: are these OK?
3. The skeleton narrator is drawn large: his skull is about 2× the knight's helmet. Shrink him?
4. The 84 low-res v2 idle loops are not used (see below).

## Known issues / next steps
- vo_further_than_ever still says the long line, while its bubble now says "Further than ever before!".
- Red damage numbers float a bit high.
- Frank's bubble text is tight against the bubble edge.
- The multi-enemy pool is goblin and rabbit only.
- The knight has no attack drawing, so he lunges in his standing pose.
- Open from before: the distance ⚐ display, strip-join patches, Black Knight height.
- Missing art (MISSING_ART.md):
  - deaths for 4 companions
  - deaths or kills for the dragon, toad, ogre, goblin, skeleton and Black Knight
  - dragon jaw layers
  - attack and hurt clips for monsters
  - knight attack pose
  - Bridgekeeper
- The ogre sheet has thin lines at its cell edges.

## Rules (from Magnus)
- Follow the design docs exactly.
- Art is drawn at its exact size, with one global factor at most (artScale 0.6).
- No grey labelled placeholder boxes.
- "Clean" means no clutter, but frequent actions stay one keypress with their options visible.
- Historical note removed: the cast includes the approved human knights and other creatures; do not convert everyone into skeletons.

## Code map
- `src/game.js`: flow, combat, strikes.
- `src/engine/scenery.js`: layers, sky.
- `src/data/*`: content and balance; TEMP_BALANCE holds the tunables.
- `src/config/`: art configs.
- `tests/*.test.js`: Playwright tests, run with `python3 -m http.server 8799`.
- `README.md`: the full history.

## v12b patch (2 Nov 2026)
Unzip `KnightMath_v12b_patch.zip` over your `~/Downloads/knight-math-game` folder (it only holds the changed files).
- **Narrator is knight-sized** (your request): `artMul 0.55` in `src/config/narrator_apply.js`. Hood top to rock base goes from 998 to 549 layout units; the hero knight is 534. His skull is now about the size of the companions' skull faces. The rock base stays on the ground line, and the bubble and head box follow him.
- **Coif knight is the right size** (your request): `artMul 1.24` on follower_5 in `src/config/art_v18_apply.js`. He was 415 tall against hero 534 and companions 476–547 (mean 514); he is now 515. One factor covers idle, walk, attack, hurt, death, and the tavern / recruit lineup.
- **Long sums never cut:** your engraved digits have a fixed size, so shrinking the font wasn't enough. `fitSums` now also scales the whole sum down and centres it when it would stick out.
- Screenshots: `screenshots/v12b/`.

## v12c patch (2 Nov 2026)
Unzip `KnightMath_v12c_patch.zip` over `~/Downloads/knight-math-game`. It includes v12b, so you don't need v12b separately.
- **Answer timer** (your request): the divider line under the ground is now the timer for battle sums (normal fights, group fights, bosses, the mega boss).
  - It fills in the ornament's orange from the centre ornament out to both ends. It tints your divider ink itself, with no text or numbers.
  - You get 20 s per sum (`KM_DATA.combat.answerSecs` in `src/data/combat.js`; 0 turns it off).
  - When it fills up, it counts exactly like a wrong answer: the wrong sound, hunters +1, the sum shown corrected, and every living enemy lunges and strikes. Then you're back to choosing a move, and the next sum starts a fresh timer.
  - Any answer resets it. It pauses during strikes, deaths, the scene toast, the sacrifice prompt and while enemies walk up. It doesn't run for riddles, recruiting, Frank, the tavern or the intro.
  - There's a soft tick (the existing `type_blip` sound) in the last 3 s. No new audio.
  - Tests can switch it off with `?notimer`.
- **Intro voice pacing:** when a line has a recording, its bubbles move along with the voice (by length of text), and the next line comes 0.6 s after the clip ends. Without a recording, Space shows one bubble at a time. Space during a clip still moves on.
- Screenshots: `screenshots/v12c/`.

## v12e (2 Nov 2026): tavern approach + plaque buttons
- **No small road tavern.** The road facade actor (`tavern_facade`, drawn by `drawFacade` from `KM_ART7.scenes["tavern-exterior"]`) is no longer added when Magnus's full `tavern-arrival` scene exists (`buildWorld`, src/game.js). The only tavern you see is the big arrival scene.
- **Go in / Walk on fade in.** They now appear 0.3 s after the arrival scene has fully faded in (`.opts.arrive` → `.in`, set in the frame loop). Clicks are ignored until then.
- **One button style.** Every choice is the battle's open plaque (`button.opt.plaque` + `BANNER`). That covers the title, intro (Next / Skip), name OK, tavern arrival, Sacrifice picker, camp/shop heals, scroll and gear (`.plaque.mini`), game over and recruit prompts. Riddle answers keep Magnus's v18 answer-frame art.
- **No visible key labels.** The `<kbd>` badges, the red seals on the move plaques and the riddle A/B/C/S letters are all gone. Every keyboard shortcut still works. The intro "▸" now reads "Next", the name "✓" reads "OK", and the tavern "← → to look" reads "Look around".
- `__km.debugJump` (only with ?debug) also matches a rest type, e.g. `debugJump("tavern")`.
- Screenshots: `screenshots/v12e/before_*.png` and `after_*.png`.
- Tests: `play.test.js` checks updated to "no key labels" (and it now also asserts no `<kbd>` in the riddle panel). Still failing from before v12e: the intro sentences are too long for one bubble (play/speech), `narrator.test` vo_story_02 chunk wait, and `mead.test` ends in a boss game over. All three fail the same way on the pre-v12e code.

## v12f (2 Nov 2026): loading bar + faster first load + Safari VO
- **Loading bar** (`src/engine/loader.js` + CSS `#kmLoader`): parchment background, Magnus's divider with the answer timer's orange fill growing from the centre out, and a small "Loading". Progress is measured in real bytes (`src/config/asset_sizes.js`, rewritten by `tools/asset_sizes.py` on every deploy).
- **First load cut:** `KM.Assets.loadImg` asks `KM.Loader.gate()` before loading. Only the title/intro UI, hero, narrator and the road layers the title actually draws (`KM.Scenery` ok() → `KM.Loader.want`) load first. Everything else waits and streams in after the bar. The tavern and camp scenes now preload after the bar.
- **Safari:** the VO recordings now have .mp3 twins next to the .ogg files in incoming/vo_narrator/ (SFX and music already had mp3).
- The browser tab title is now "Medieval Math".
- narrator.test now uses Charlie's real vo_story_01..04. All 4 play, every part advances by itself and the name prompt follows. The missing-file check now forces 02 to 404 with a regex route; the old glob `vo_story_0[2-4]*` never matched, which is why the test "stalled".

## v12g (2 Nov 2026): graves on the road, solid background, narrator stays
- **Graves:** a past death's grave used to ride the hill lane (mid parallax, speed 0.3). Its position was clamped to at least cam 2600, so a grave from an early death showed behind the narrator on the title. Graves are now ground props: road x = the death spot (that encounter's halt + saved offset + `GR.ahead`), on `W.groundY`, at artScale. They're drawn behind the party, and the party halts `GR.respectAt` (520) before one to pay respects. There's no clamp, so a grave only shows where you died. Multiple deaths at one spot add a second, solid stone.
- **No see-through:** road props were drawn at alpha 0.85 (`propAlpha`), the second grave stone at 0.8, the distant hill creatures at 0.85 with a washed-out contrast/brightness filter, and the sky dragon at 0.7. All are now drawn at full opacity (the distant creature is just greyscale). Parallax strips and trees fill a "silhouette" with parchment so the layers behind them are hidden. That silhouette was the art's soft alpha (near-forest ~30 % partial, trees 15–29 %), so back layers showed through the canopies. It's now hardened to solid once per cached copy (`solidOf` in scenery.js).
- **Narrator stays:** `startJourney` no longer removes him. He stays on his rock, says nothing, and scrolls off as the party walks past.
- The small dark mounds in v12d/move_choice.png were not graves (the grave list was empty). They're pebbles in the random foreground ground strip.
- Screenshots: `screenshots/v12g/before_*` / `after_*` (title, walkoff_0..7, road_grave, road_1_frank / road_2_tavern / road_3_boss).

## v12k (2 Nov 2026): fire bottle, a spelling attack
- **Buy:** the tavern's fare sign now has a third plaque, **Fire bottle** (Maggi's flask stamp + price 6). You can carry 2; the plaque greys out at 2. Saved with the run (`bottles`).
- **Use:** while you carry one, **Fire bottle** is a battle move (after Heal; silent key F). A slightly hard 8–12 letter word (`src/data/words.js`) appears in Maggi's engraved letters. Type it within **7 s** (the divider timer).
  - A right letter turns burnt orange and plays a sound. A wrong letter shows in red (her `wrong/` letters, a small shake) with a bad sound, and blocks until Backspace removes it. Letters not yet typed are ink at 35%; the next one bobs and is underlined.
  - **Done:** the bottle spins through the air to the middle enemy, smashes, and Maggi's woodblock fire bursts under **every** enemy. Each takes one weak-swing hit with the hit flash (on burst frame 2), then the fire lingers ~2 s and fades.
  - **Too slow:** it fizzles. The bottle is used up, nobody takes damage, the word greys out, and the enemies strike as usual. No hunters step (`hunters: 0`).
- **Sounds (existing only, no new audio):** two new events in `assets/audio_map.json` that reuse Charlie's files: `spell_letter_ok` = the anvil strikes from `correct` at volume 0.5, `spell_letter_bad` = the clunks from `wrong` at 0.7. Throw = `swing_hard`, fizzle = `wrong`, hit = the usual hit sound.
- **Code (kept small for the Godot port):**
  - `src/data/items.js`: every fire bottle tunable (price, max, spellSecs, damage, sounds, lines, art paths and fx timing).
  - `src/data/words.js`: the word list.
  - `src/modes/spelling.js` (`KM.Spelling`): the word challenge as pure logic (`start`, `key`, `pickWord`) plus `drawWord()`, the one function that decides how letters look.
  - `src/engine/firefx.js` (`KM.FireFx`): the throw, smash, burst and linger drawings. Visual only; `start()` returns when the hit lands.
  - `src/game.js`: `pickFire` / `spellKey` / `fireThrow` / `fireFizzle` / `buyBottle`. The sword hit was split into `hitFoes` + `settleHits`, which the fire reuses. The answer timer now takes per-question seconds (`tmr.secs`) and also runs in the `spell` phase.
- **Art (swap by one path):** the fire is `assets/items/fire_bottle/v2/` (Maggi's woodblock redo; v1 is not used), set in `items.js` `art.dir`. The letters are `assets/alphabet/v1/` (ink, `correct/`, `wrong/`), set in `src/config/alphabet.js` (`KM_ALPHABET`; set it to null to fall back to the sum's font). The word is drawn at artScale and scaled down to fit 1300 stage px.
- Screenshots: `screenshots/v12k/` 01_shop, 01b_shop_two_bought, 02_word_half_typed, 03_wrong_letter_red, 04_success_hit, 05_fizzle.
- Tests: `tests/firebottle.test.js` (new, PASS). `group.test`, `narrator.test` and `mead.test` PASS. `spell.test` still fails one old check that expects the visible key labels removed in v12e.

## v12m (2 Nov 2026): forged letters, Charlie's letter sounds, fire art v4
- **Letters (Magnus):** every letter starts **grey** (Maggi's ink letters tinted #8a8580, full opacity; the 35% look is gone). A **right** letter flashes hot orange with a warm glow and **cools to black ink** over 0.7 s, like forged metal. A **wrong** key plays a water hiss and the **current letter shakes and stays grey**. No red letters and **no Backspace step**: you just type the right letter next (Backspace does nothing).
  - Tinting is done in code: `KM.Spelling.preload()` tints each ink PNG with `source-atop` into grey / hot / cooled data URLs (once). A done letter is a black layer under a hot layer whose opacity + glow fade out (CSS `kmCool`). Re-renders keep each letter's place in its animation (negative `animation-delay` from the time it was typed), so cooled letters never flash again. `correct/` and `wrong/` PNGs are no longer used.
  - **Tunables:** `KM_DATA.items.fireBottle.letters` in `src/data/items.js`: `grey`, `hot`, `cooled`, `glow`, `glowPx`, `coolSecs`, `shakeSecs`, `shakePx` (passed to CSS as variables).
  - `KM.Spelling.key()` now returns `"ok" | "done" | "bad" | null`; state is `{ word, n, at, missAt }`.
- **Sounds (Charlie, ElevenLabs):** `spell_letter_ok` = `sfx/spell_ok_1..4` at 0.65, random, never the same twice in a row. `spell_letter_bad` = `sfx/spell_miss_1..2` (water hiss) at 0.8. `.mp3` twins for Safari.
  - Ready but silent (no files yet, so no requests): `fire_throw`, `fire_smash`, `fire_ignite` (peak on burst frame 2), `fire_crackle` (loop, 300 ms fade; needs a stop/fade hook in audio.js), `fire_fizzle`, `goblin_burn`. Each has `files: []` and the planned names in `_next`. When they land: move `_next` into `files`, run `python3 tools/build_audio_map.py`, and play them from `fireThrow` / `fireFizzle` (src/game.js) and `KM.FireFx` (src/engine/firefx.js).
- **Fire art v4 (Magnus approved):** `assets/items/fire_bottle/v4/` (one-colour woodcut, washed-out ochre #D9B46A; same names, cells, anchors and timing). Only the files the game uses were copied (icon, item, 3 atlases, NOTES.md). **v2 was removed** from the game. `items.js` `art.dir` points at v4.
- Screenshots `screenshots/v12m/`: 01_all_grey, 02_letter_glowing_orange, 03_letters_cooled_black, 04_wrong_key_shake, 05_fire_hit_v4, 06_fizzle (+ 01_shop, 01b_shop_two_bought).
- Tests: `firebottle.test` updated for the new rules (grey, hot, cooled, shake, no Backspace, Charlie's sounds, v4 art). PASS. `group.test` and `narrator.test` PASS (group can flake on the hearts check when run in parallel with others; it passes alone). `spell.test`: the old "1 Weak" label check now checks there are no key labels and passes. The test still exits FAIL on pre-existing console 404s from the VO lookup (`vo_name_prompt`, `vo_after_name`, `vo_spell_cast`, `vo_spell_wear_off` have no files yet).

## v12n (2 Nov 2026): fire bottle sounds (Charlie, ElevenLabs)
- **Files:** `assets/audio/sfx/fire_throw_1`, `fire_smash_1`, `fire_ignite_1`, `fire_crackle_loop`, `fire_fizzle_1`, `goblin_burn_1..2` (.ogg + .mp3; details in `assets/audio/sfx/NOTES_fire.md`).
- **Events** (`assets/audio_map.json`, volumes from Charlie's notes): `fire_throw` 0.8, `fire_smash` 0.9, `fire_ignite` 1.0, `fire_crackle` 0.65 (loop), `fire_fizzle` 0.8, `goblin_burn` 0.8 (2 variants, never the same twice in a row).
- **Sequence** (cued by `KM.FireFx` on the art's own clock, so it follows the frame timing in `items.js` `art`):
  - throw on release (the game; replaces `swing_hard`)
  - smash on impact
  - ignite once at burst frame 1 (smash + 210 ms), so its peak lands on burst frame 2 = the hit
  - one `goblin_burn` per enemy hit, 60 ms apart, the 3rd and later at 0.7
  - crackle loop from the lingering phase
  - when the fire fades: the crackle fades out (300 ms) and `fire_fizzle` plays
  - Too slow: `fire_fizzle` instead of `wrong`.
- **Tunables:** `KM_DATA.items.fireBottle.sfx`: event names plus `burnStagger`, `burnGainAfter2`, `crackleFadeSecs`.
- **audio.js:** `play(ev, { gain })` (gain multiplies the map volume). New `loop(ev)`, `stop(ev, fadeSecs)`, `stopLoops(secs)` and `looping()`. Loops are plain `<audio loop>`: the .ogg loops seamlessly, and Safari's .mp3 may have a tiny gap at the wrap (Web Audio would fix it if it's noticeable). Loops stop when muted or when the tab is hidden.
- **Crackle never left behind:** `KM.FireFx.stop()` fades it out when the fire ends, and `game.js update()` stops the fire as soon as the mode isn't `encounter` (battle won, death, scene change).
- **Tests:** `firebottle.test` now checks the cue times on the fire clock, that the crackle loops and then stops, that the fire stops out of battle, that there are no 404s for sounds or item art, and that the fizzle sound is `fire_fizzle`. PASS. `group` and `narrator` PASS.
- Nobody has listened to the new sounds yet (Charlie's checks are measurements only); Magnus should give them an ear.

## v12o (2 Nov 2026): tavern interior with seated knights and a bar
Magnus: "There are actual knight sitting sprites and a bar. Improve this scene."
- **Recruits sit, whole body, feet on the floor.** Magnus's seated poses (`assets/v11/ui/seated-feather.png` / `seated-scarf.png`, from `incoming/magnus_art/sitting_plume_knight.png` / `sitting_kettlehat.png`) are no longer clipped at a tabletop. The feather knight sits on a bar stool, the kettle-hat on a low stool. Both face the party. The v11b head match to the walk sheets is kept (0.52 / 0.5).
- **The bar.** Magnus's v8 bar counter (with barrels and a mug, cropped from `assets/v10/paper/scenes/tavern-foreground.png`) stands against the back wall under the mug shelf. The recruits sit in front of it. The stools are cropped from `tavern-bar-seats.png` and `tavern-seats.png`. The trestle tables (`tavern-table.png`) are gone.
- **No seated pose yet** for moustache, stripe and coif. When one of them is a recruit, he stands at his seat by the bar, facing the party (MISSING ART: their seated poses).
- **All data:** `src/data/tavern.js` (`KM_DATA.tavernRoom`) holds the prop crops, the seat x positions for 1, 2 or 3 recruits, the depth (`back`), the sitter fits (mul, hip, seatX, foot, stool) and the barkeep's voice anchor. `src/game.js` has `propRect`, `drawProp` and `seatGeom(j, n)`. `seatGeom` is pure geometry, shared by drawing and the click/highlight hotspots (a sitter's hotspot is his drawing).
- **Question for Magnus: prop scale.** The v8 room layers are painted at a smaller pixel scale than the characters. At plain artScale the stools would be too low for the seated hips. The room props therefore share one extra factor, `propMul 1.4` (like `buildingMul` for the facade). With it the bar stool seat is about 4 px from the feather knight's hip and the low stool about 2 px from the kettle-hat's.
- **Fixes:** the interior drew the party twice, so the hero's bubbles came out doubled; it now draws once, after the sign. Speech bubbles now avoid the TAVERN FARE sign. The barkeep's bubble comes from behind the bar (`keeperAt`).
- **Recruits per tavern** is still `[2, 2]` (reststops.js). The layout also has seats for 3.
- Screenshots: `screenshots/v12o/before_*` / `after_*` (default, selected, speech; after also has `three` and `standing`). Shot script: `/tmp/v12o/shot.js`. Backups: `/workspace/bak_v12o/`.

## v12p (2 Nov 2026): seated tavern knights scaled to the player
Magnus: "Better but they look too big, compared to the player."
- Measured against the hero as drawn in the scene (533 layout units = 355 stage px tall; great helm ~93 stage px wide).
- **Seated mul (src/data/tavern.js `sitters`):** feather 0.52 -> 0.42, kettle-hat 0.50 -> 0.44. Height drawn, head to soles: feather 428 -> 346 stage px (121 % -> 97 % of the hero, plume included), kettle-hat 353 -> 310 (99 % -> 87 %).
- **Trade-off:** Magnus's seated drawings have smaller heads per body than the walk sheets. With bodies at a normal sitting size, the helmets are ~80 % of the hero's: feather helm ~94 -> ~76 stage px, kettle-hat brim ~107 -> ~94. Matching heads exactly would make the sitters taller than the standing hero again.
- **Room props:** `propMul` 1.4 -> 1.1. The bar stool seat is ~14 layout units above the feather's hip (hidden behind him). The low stool is ~9 under the kettle-hat's hip. The counter shrinks with them.
- **Standing fallback** (moustache / stripe / coif): unchanged. These are the same walk sprites at the same scale as the party.
- Screenshots: `screenshots/v12p/after_default.png`, `head_compare.png` (hero | feather | kettle-hat heads, v12o vs v12p, same 2x zoom), `before_after_default.png`. Backups: `/workspace/bak_v12p/`.

## v12q (3 Nov 2026): Maggi's wall menu sign + ornamented button frames
Magnus (via Maggi): "The buttons of the mead stew etc, I want the wall menu to look like that and there is where that menue is. But all other buttons that show up below I want to have that frame you have done now."
- **Wall menu = Maggi's hanging sign.** The art is `assets/ui/tavern_ui_v1/tavern_sign.png`. I used the plain variant: its text-safe rect is bigger. It replaces Magnus's old TAVERN FARE sign in the interior.
  - **The lines:** Mead / Stew / Fire bottle are clickable lines on the board. Each has Maggi's mug / bowl icon (`icon_mead.png` / `icon_stew.png`, keyed from her `work/icons_key.png`) or the fire bottle stamp, then the name in Georgia, dark ink `#1b1410`, then the purse + price, right-aligned.
  - **Controls:** hover or the arrows light a line with an orange underline. Click, Enter, or the silent keys 1 / 2 / 3 buy it.
  - **Greyed lines:** an item you can't have (no gold, full hearts, at the limit, mead already waiting, 2 bottles) is greyed, both text and icon.
  - **Swing:** a buy (or a refused one) knocks the board, which swings about the chains' bar. The iron bracket stays put.
  - The barkeep lines and the per-visit limits are unchanged; the existing purchase functions do the refusing.
  - The three item plaques are gone from the strip. With a sign line selected, the strip is empty.
- **Sign size: scale 0.39 at stage (158, 48)**, instead of the README's 0.36 at (172, 56). At 0.36 "Fire bottle" + price only fit by shrinking the text to about 21 px. At 0.39 the lines are 23 px Georgia with 30 px icons, each line about 62 px tall to click. The sign's right edge (x 406) stays clear of the solo hero's helm (x ≈ 418).
  - **Readability:** fine on a 1600-wide window. On a small laptop window (~0.75 scale) the text is about 17 px: readable but small. A bigger board from Maggi would help.
  - All numbers live in `KM_DATA.tavernRoom.sign` (src/data/tavern.js). The text shrinks to fit if a line is too wide.
  - Code: `signGeom`, `fareItems`, `fareLines`, `drawSign`, `buyFare` in game.js. Spots are now `fare:mead|stew|fire`, then the recruits, then the door. `__km.fare()` reports each line's state.
- **Every strip button** (`button.opt.plaque`: battle moves, Go in / Walk on, Go outside, camp, shop, recruit prompts, title, intro, name OK, game over, Sacrifice picker, gear minis) now wears Maggi's frame.
  - CSS `border-image` from `button_frame@2x.png`, horizontal-only 9-slice (slice 75 124 fill; caps 38/62 px at 90 px height, scaled with each button's fixed `--bh` height: 84 / 70 / 64 / 46).
  - Hover and keyboard focus: `_hover` frame + 2 px lift + orange underline.
  - Disabled: `_disabled` frame, grey text, greyscale icons, NO extra opacity.
  - Config: `src/config/ui_frames.js` (`KM_UI.frame`), copied into CSS variables at boot. The old SVG banner (`BANNER`) is now empty.
  - Riddle answers (`.ansf`) keep Magnus's answer frame.
- **Fire bottle: no goblin yelps** (Magnus). `goblin_burn` is removed from `items.js` sfx (with `burnStagger` / `burnGainAfter2`) and from `firefx.js` cues. Throw, smash, ignite, the crackle loop, fizzle and the spelling letter sounds are unchanged.
  - The `goblin_burn_1/2` files and their audio map entry are still on disk but nothing plays them.
  - firebottle.test.js now checks that no `goblin_burn` plays.
- Tests updated to use the sign lines: mead, firebottle, play (battle frame check, tavern entering + sign checks).
- Screenshots: `screenshots/v12q/`: battle_choose (Weak / Hard / Heal disabled at full hearts / Stupidity in the new frames), battle_hover, tavern_default, tavern_sign_hover_fire, tavern_sign_fire_greyed (+ `_sign_crop` zooms), tavern_arrival, tavern_door_buttons, title, name. Backups: `/workspace/bak_v12q/src_tests_css.tgz`.

## v12r (3 Nov 2026): music preloads with the loading bar + centred frame labels (+ Magnus's v12r batch)
- **Music with the bar** (Magnus: "make sure the music is loaded before the game starts"). `KM_DATA.music.preload: ["title", "world"]` (src/data/music.js) = the categories whose first track loads WITH the bar: `KM.Music.preload()` picks the title track (quest_theme) and one random road track, `KM.Loader.fetch()` (new, src/engine/loader.js) streams their real bytes into the bar (sizes from `KM_ASSET_SIZES`; tools/asset_sizes.py now covers .mp3/.ogg/.m4a/.wav), holds each as a blob: URL and waits for `canplaythrough` (8 s cap) before the bar can finish. The rest still streams. Music ships as .mp3 only (plays everywhere incl. Safari). **First load +6.1–8.0 MB** (quest_theme 3.83 MB + one road track 2.32–4.19 MB); locally ~19.5 → ~27 MB in the bar. Throttled run (40 Mbps): bar done at 6.6 s, both tracks decoded (readyState 4).
- **No music dip under the narrator** (Magnus: "Don't lower the music when the narrator speaks"): `duckVoice: 1` (was 0.3). The mechanism stays.
- **Bard songs only inside the tavern** (Magnus). All 9 tavern tracks are sung (lyrics in their mp3 tags); the category is tagged `vocal: true, where: "tavern-interior"`. `KM.Music.setPlace()` is fed from `S.view` each frame; a `where`-tagged category outside its place plays the scene's `outside` (rest_tavern: `outside: "world"`, default `KM_DATA.music.outside`) = the road music keeps playing on the arrival / exterior, and crossfades to a bard song on going in and back out on leaving. mead.test checks all three.
- **Centred frame labels**: one setting `KM_UI.frame.labelLift: 0.036` (src/config/ui_frames.js) = extra bottom padding of 2 × 0.036 × height on every `.plaque` size (84/70/64/56/46) and state, so text + icons sit 3 px (84) higher, optically centred between the frame's ink lines (measured: x-height centre on the line centre). Crops: `screenshots/v12r/title_buttons_before_after.png`, `battle_buttons_before_after.png`.
- **Graves on the ground** (Magnus: "The grave sits too high"): the markers' alpha bottom was ~80 source px above their anchor. tools/measure_feet.js now measures the grave markers too → `KM_FEET.grave_*` (74–82); the mound base lands on W.groundY (within 1 unit) in road and battle views. graves.test.js checks every marker. `screenshots/v12r/grave_ground.png`.
- **Riddle answers in Maggi's frame**: `.opt.plaque.ansf` (normal / hover / disabled frame, label lift), one evenly spaced 64 px row under the question (question frame untouched; Maggi is redrawing it). `assets/v18/answer-frame.png` stays on disk, unused. Longest answer set fits (82–1518 px). play.test updated. `screenshots/v12r/riddle.png`, `riddle_longest_answers.png`.
- **Recruits face the party** (Magnus): one rule, `KM_DATA.party.npcFaceParty` + `recruitArt: "follower_"` (src/data/knights.js): drawActor mirrors every recruitable knight standing as an NPC (roadside recruit, rest-stop candidates; camp / tavern standing ones already were). Once he joins he is a party member and walks right. `screenshots/v12r/recruit_faces_party.png`.
- **Carved digits**: the pack's digit slices were fixed 177 px cuts of `numerals-sheet.png`, so the 0 lost its right side (and sat 54 px in = the odd gap), 8 / 9 lost a sliver. `tools/reslice_digits.py` re-slices every digit around its own ink (+12 px each side) → `assets/v7/numerals/digit-N.png` + `assets/v10/ink/glyph-digit-N.png` (old ones in /workspace/bak_v12r/digits/). New `tests/digits.test.js`: no clipping, all 100 pairs the same 24 px gap. `screenshots/v12r/digits_before.png` / `digits_after.png`. (The touch-pad keys still show the glyphs bigger than the key: pre-existing, inline size wins over `.digits .key .glyph`.)
- **Move rows never overflow** (Magnus: "the buttons are outside of frame"): `KM_UI.moves` (ui_frames.js) + `fitMoves()` (game.js, after every showPanel): buttons never shrink (label + icon + both caps), the row takes the first of `heights` [84, 70] that fits in the strip minus 24 px a side, else two centred rows at 58 px (attacks | items/specials, split at `.brk`) with a smaller prompt. New `tests/moves.test.js` (basic / spell / fire+spell+sacrifice / full kit: every button inside the stage, labels inside the caps, below prompt + divider). `screenshots/v12r/battle_full_kit.png`.
- **Shop / camp menu in words** (Magnus: "I have no idea what the menu means"): `KM_DATA.restStops.menuWords`. Heals read "Poultice: +3 hearts", the scroll "Scroll of Stupidity"; gear rows are labelled "Weapon +1 · 9" / "Armour +1 · 7" (+ purse) above one framed button per knight with his name + filled / empty ink rings, "Max" when full (plain frame), greyed `_disabled` frame when unaffordable. With a gear table the left column stacks heal / scroll / recruit + Walk on at 56 px so 4 knights fit; all text ≥ 28 px; the scroll icon is hidden next to a gear table (the words say it). Shop greeting: "Better gear for your lads. Pick a knight." `screenshots/v12r/gear_row.png` (2 knights) / `gear_row_4knights.png` (afford / broke, shop + camp), `shop.png`.
- **Shop art**: the shop never had art (MISSING_ART #23: `shop` / `shop_keeper` were silhouettes). `art: "stall"` on the shop type draws Magnus's stall + seller (assets/v11/ui/scroll-stall.png, scroll-seller.png, at their stall scale on the ground line) and keeps its recruit candidates. Still no art of their own: the shop building / Honest Edmund, the camp keeper (Old Wally) and barkeep (only in the painted scenes).
- **Narrator VO (Charlie, Callum)**: vo_further_than_ever (replaces the Chatterbox take), vo_name_prompt, vo_after_name (no name in the clip; the bubble keeps {name}), vo_gameover_01..03 (random), vo_victory → `assets/audio/vo/` (.ogg + .mp3), listed in assets/audio_map.json. Name prompt / game over / victory bubbles are paced across their clip like the story lines (`paceVO`). **VO lookup = the map only**: ids with no files (vo_spell_cast, vo_spell_wear_off, vo_member_dies) are silent without a request; the old by-name probing (and its 404s) is gone. `takes/` unused.
- **Scroll SFX (Charlie)**: `scroll_buy` (0.8) on buying, `scroll_get` (0.7) 0.25 s later as it goes into the pack (`gainScroll()`, any future gain path too), `scroll_use` (0.9) on casting; random variant, never twice in a row (KM.Audio.pick). Names + delay in `KM_DATA.spell.sfx`, volumes in the map.
- **Answer timer always starts** (Magnus: "Very often the math timer does not start"): one start point, `startAnswerTimer(secs)` (game.js), called by `ask()` for every battle sum (pickAction passes `C.answerSecs`; recruits / Frank pass none) and by the fire bottle word; `ask()` clears any old timer first. The hold check (`timerPause`, also `__km.timerWhy()`) now ignores dead / gone / inactive foes (their act or walk-in never ticks, so it could freeze the bar for the rest of a fight), and any hold longer than `KM_DATA.combat.answerPauseMax` (3 s) lets the timer run anyway. Not reproduced deterministically in a clean run, so the stale-hold cap is the safety net. New `tests/timer.test.js`: starter fight, next sum after right / wrong / time-out, Esc back, scroll mid-sum (fresh timer), stale act on a dead foe, never-ending hold, fire bottle word, group fight after a foe drops.
- **Walking slowdown fix (from the parent, /workspace/km_leak/leak_fix.diff)**: src/engine/audio.js pools up to 4 `<audio>` elements per file instead of `new Audio()` per footstep; `KM.Audio.poolSize()`. sfx + firebottle re-run PASS.
- **file:// still works**: the music preload skips fetch() under file:// (it is refused there) and preloads the plain URL through the channel's `<audio>` element (canplaythrough); fetch errors fall back the same way. file.test PASS.
- Tests (3 Nov): mead, firebottle (?debug), spell, graves, narrator, digits, moves, timer, sfx, file PASS, no page errors, no 404s; play.test = 104 ok + the known narrator-bubble check only (intro sentences too long for one bubble, pre-v12e). Loader: bar total ~28.1 MB, done at 7.0 s throttled to 40 Mbps (title + world blobs readyState 4), 1.3 s unthrottled. Backups: /workspace/bak_v12r/. Note: the move-row CSS block (.opts.moves.fit / .tworow / .brk) sits at the very end of style.css; keep it there when appending.

## v12s (3 Nov 2026): Maggi's riddle question frame
- The riddle question now sits in Maggi's approved 9-slice frame (`assets/ui/tavern_ui_v1/riddle/riddle_question_frame@2x.png` + README; slice 80/124 fill, corners 40×62 at 1x). It replaces the thin `riddle-frame.png`, which stays on disk unused. Settings are in `KM_UI.riddleQ` (src/config/ui_frames.js); game.js copies them into `--rq-*` CSS vars at boot.
- Georgia 40 px, centred, inside her text-safe inset (64 / 20 px at 1x). The strip is only 184 px tall, so the frame is drawn at `scale: 0.8` (130 -> 104 px tall) to leave room for the 64 px answer row (6 px gap, about 5 px clear at the bottom). Width starts at 900 and grows to 1360 so every current riddle stays on one line (the longest, 61 chars, is 1110 wide). Past that the text wraps and the box grows taller; `fitRiddleQ()` then steps the font down to `minFont` 26 until the frame and answers fit in the strip (checked with a 182-char test).
- The `.long` class is no longer used. Tests: play (105 ok, known narrator-bubble check only), v18 PASS, speech = the same known intro check. `screenshots/v12s/riddle.png`. Backup: /workspace/bak_v12s/.


## Loading castle and ink-wisp reveal (3 Nov 2026)
- Existing v10 ink castle and two trees frame the loader, at global artScale. No new art.
- src/engine/loading-art.js owns composition, 1.45-second eroding ink reveal and cleanup; loader.js tracks these images with the existing real asset progress. Music preload stays unchanged.
- The progress rule fades first; artwork erodes into rising fragments of its own ink, then parchment fades into the title. Reduced motion uses a short fade. Keyboard input is blocked until reveal completes.
- Original files backed up locally in /tmp/math-loading-before for this edit session.


## Road tavern continuity and scenery compositing (3 Nov 2026)
- Tavern facade now exists on the scrolling road before arrival and remains there after departure. Reaching it no longer swaps to the fullscreen exterior. Go in / clickable doorway uses a short opaque parchment transition to the interior. Go outside returns to the same camera position, then Walk on passes the building. Keyboard and pointer actions blocked during room switch.
- Scenery overlap compositing is per solid cutout, not all silhouettes then all ink. Interior no longer draws outdoor scenery underneath. Repeated back/mid terrain alternates reflected copies for matching same-biome edges. Parchment tile destinations snap to device pixels to remove fractional-row hairlines.
- Browser verified: arrival, entry, exit at identical camera position, departure with facade retained; no page errors. Legacy artwork still has internal cut/cap joins and mixed-biome transitions that need further visual cleanup; do not claim all source art is seamless.
- NEW DESIGN DIRECTION: first-person tavern table concept requested. Player forearms and mead in foreground; optional visitors opposite, including empty seats. This supersedes side-view interior art direction when approved/implemented. Current side-view interior retained while concept is reviewed.

## Modular background review (3 Nov 2026)
- Reused the existing v20 artwork in assets/modular-world: complete trees, copses, cliffs, rocks, village, church, field, castle and continuous mirrored hills. src/engine/modular-scenery.js places them as individual solid parchment-backed objects. No terrain fade joins. Draw terrain before the landmark bases to avoid cutting across the copse.
- Removed pasted end-cap rectangles from foreground rendering by using the central 1940px of each biome's first strip and alternating reflected repeats. This currently uses one foreground variant per biome; the other source variants remain on disk. Biome boundaries still deserve visual review during long travel; no claim that every possible composition has been approved.
- Preserved the distant dragon landmark using a crop of the existing v19 dragon, drawn on a rocky base while its encounter swap is active.
- scenery-review.html offers Walk/Pause, biome selection and a camera scrubber. Checked five biome views and scrolling in Chromium with zero page errors; visually reviewed meadow and canyon after the final foreground fix. Hills are deliberately sparse and repetitive at present; visual approval is pending.
- Priority remains background review first. Approved first-person tavern source art exists but is not integrated. Character construction changes have not started.

## Correction: preserve the approved landscape (3 Nov 2026)
Magnus rejected the modular scenery review: it changed the composition and reduced detail far below the concept. Restore and preserve the existing v7/v10 full landscape strips, their density, linework, scale and layering. Fix seams locally; do not replace them with sparse hills and scattered props. The modular renderer is now disabled and no longer loaded/preloaded. Original back/mid scenery and original dragon hill swap are restored. Per-object solid parchment compositing, device-pixel parchment alignment and foreground cap removal remain. Browser checked all five biome selections without page errors; visually checked restored meadow and forest. Mixed-biome seams remain unfinished and must not be described as seamless or approved.

## Solid tapered terrain overlaps (3 Nov 2026)
- Per Magnus: taper the existing pieces and overlap them. Scenery now caches solid curved end masks for the original back/mid strips, with 640 source pixels of overlap and 400-pixel tapered ends. Both the ink and opaque parchment silhouette receive the same geometry; no alpha fades or replacement artwork.
- Terrain remains at the original scale. Biome lookup and review camera positions use the shorter repeated spacing. The original distant dragon tile remains supported.
- Five-biome browser pass completed without page errors; canyon composition visually inspected after the change. This is a runtime edge treatment, not newly painted endings for every tree or cliff.

## v22 actual landscape sprite repairs (3 Nov 2026)
Magnus identified the earlier curved masks slicing through branches and cliffs. Those masks are removed entirely. The actual sprite silhouettes are repaired with ImageGen edits of the original artwork: full objects set inward, bare descending ground at the ends, transparent exterior and pale opaque interiors. Nine separate files in assets/terrain-v22, retaining originals. src/config/terrain_v22.js overrides just these terrain references after art_v19_apply.js. Native 2172x724 size, unchanged global art scale. Per-sprite baseline metadata aligns the real ground despite transparent bottom margins. 640 source-pixel overlap, no terrain opacity fades. Dragon hill metadata adjusted to the repaired landmark location. Forest/rocks/canyon reviewed individually; fields revised after the screenshot of its steep left shoulder. Existing separate tree props are untouched.
Validation: all nine sprites have transparent canvas margins; five biome-boundary screenshots visually reviewed; 60 scrolling positions exercised without page errors. Review page still at scenery-review.html. Do not reintroduce masks or substitute sparse modular scenery. Deliverable with sprite PNGs, metadata, prompts, usage and QA screenshots: Rats_Ai_Testpilot/output/terrain-repair-v22.zip.

## Repaired terrain visual scale (3 Nov 2026)
Magnus found the new landscape sprites too small. Added scenery.terrainScale=1.25 to compensate for their new empty margins and inset silhouettes. Applies uniformly to landscape artwork only, preserving aspect ratio. Baselines and overlap spacing use the same factor, so the ground stays fixed. Castle centre is preserved; Frank's distant-dragon anchor and the biome preview selector use the corrected spacing. Browser pass across five biomes: no page errors; meadow and forest inspected visually. Source PNGs are unchanged.

## Near-layer depth and ground contact (3 Nov 2026)
Magnus approved the castle scale but wanted villages/trees larger and no pale gap above the feet. Kept distant scenery at 1.25 and added mid.artScale=1.65 (32% larger than the prior near layer). Moved mid.bottom from 950 to 1010 so the drawn ground overlaps behind foreground grass at 983. Mid tile spacing, biome lookup, review camera and Frank anchor share this scale; the castle and back hills retain their previous settings. Five-biome browser pass had no errors; village and forest screenshots visually inspected for ground contact and size.

## Canyon depth and nearer rock scale (3 Nov 2026)
Canyon cliffs now draw as massive distant landmarks BEFORE the hills/woods, with scale 2.5, parallax speed 0.12, baseline 850. Landmark placement is centred on each canyon biome and scrolls continuously into/out of view. They no longer occupy near terrain tiles. Canyon near tiles use the repaired barren-rocks sprite; after Magnus's feedback, nearScale is 1.2 (up from 0.85, ~41% bigger). Copies overlap using ceil(step/advance) so there is no spacing gap. Mid ground remains at 1010 behind foreground grass. Village/forest and castle scale settings retained. Preview script URLs versioned to terrain-canyon-depth2 so changes load reliably.

## Field proportions (3 Nov 2026)
Magnus found fences and haystacks too small beside the knight. Added mid.biomeScale.fields=2.5 (~52% larger than mid.artScale 1.65). Draw each enlarged field centred on its existing tile, using its ground baseline; overlap increases instead of stretching or clipping. Other biomes and the distant castle/mountains keep their own scales. Preview cache version: terrain-fields250.

Field correction: Magnus rejected 2.5 as too large, with coarse haystack linework. Reduced fields to 1.95, approximately 18% above the prior 1.65 and 22% below the rejected 2.5. Avoid solving prop proportions with excessive whole-sprite magnification. Preview version terrain-fields195.


## Airy woodland variation (3 Nov 2026)
Magnus clarified the original concept's atmosphere: open hills, scattered crooked bare trees, fine distant linework and sparse ground hatching. Added three 2172x724 transparent sprites in assets/terrain-v23. src/config/terrain_v23.js registers them and selects them as near-forest variants; original v22 dense forest remains available on disk. Stable per-tile selection cycles through all three over successive regions; revisiting a camera position does not shuffle the art. Woodland scale is 1.45 because these drawings' trees occupy more of the source height; other terrain scales remain as previously tuned. Original alpha supplies solid parchment occlusion, with ink composited separately as before. No runtime taper masks or new fog/fade bands. Ground ends are drawn into the art.
Preview version terrain-airy-v23; dropdown Open woodland. Extended review scrubber to 180000 so subsequent woodland variants can be inspected. New sources retain transparent canvas margins (no edge pixels above alpha 20). Generated with ImageGen from the approved concept and crooked-tree detail; prompts and metadata copied into Rats_Ai_Testpilot/output/airy-woodland-v23. Visual approval remains Magnus's; do not describe all scenery as perfect or all seams as approved.


## v24: restore terrain height and remove lower outlines (3 Nov 2026)
Magnus reversed the earlier decision to bury the terrain bases behind foreground grass. src/config/terrain_v24.js restores mid.bottom from 1010 to 950: 60 layout units / 40 native stage pixels upward. Existing scales and distant landmark heights remain unchanged. No runtime masking or fog bands were added; groundFade is explicitly null.
Nine v22 terrain images were edited with built-in ImageGen to remove their continuous bottom contour and finish their ground with broken engraved marks (castle, hills, distant woods, village, dense forest, rocks, canyon, fields, dragon hill). One faulty hill export with stray outside marks was rejected and cleaned. All nine retain 2172x724 canvases and transparent margins. Original source anchors remain, preserving upper artwork placement. The three airy woodland images keep their v23 originals: their lower edges were already unoutlined, and the attempted new edit unnecessarily thickened the delicate branches. They move upward with the whole mid layer. Originals and rejected edits remain available.

## v24: quieter village and unique church (3 Nov 2026)
Magnus found the village too crowded and repeated churches unacceptable. Two new transparent cottage strips each contain only two separated houses, with open ground. They are village variants and contain no churches. The church is a separate sprite, drawn once at a fixed world position via mid.landmark, outside the repeating/mirroring loop. It is drawn before the cottages so opaque foreground foundations occlude its base correctly. Subsequent village regions repeat only cottages; no second church is spawned. Dense village sprite remains as a spare, not the active row.
Preview cache version terrain-ground-v24c. Main changes: assets/terrain-v24, src/config/terrain_v24.js, landmark block in src/engine/scenery.js, versioned scripts in index.html and scenery-review.html. Editing prompts, source mapping, output PNGs and screenshots: Rats_Ai_Testpilot/output/terrain-ground-v24. JavaScript syntax checks passed. Meadow, village arrival/departure, woods and rocky scenery visually checked; no claim of pixel-identical generative edits or blanket approval of every future terrain composition.

Final cache version terrain-ground-v24d. Restored woodland images have explicit approved-v23 asset query keys so browser caches cannot retain the rejected redraw after a source file copy. Final canyon and woodland views were also checked.


## v25–26: consistent depth and a countryside opening (3 Nov 2026)
Parallax order now matches occlusion: castle .08, cliffs .12, hills .16, distant woods .22, near scenery .30, ground 1. All subtract the forward camera movement. Regression tests exercise actual renderer placements across tile boundaries.
The introduction incorrectly opened in the canyon because Frank's dragon anchor shifted the entire biome row (including the foreground and mountains). Landmarks now have independent anchors; the landscape starts at world zero. The opening route is meadows → short village → long meadows/camps → occasional woodland, with rocky terrain and canyon much later. Rest stop gameplay remains independent. Review selector resolves actual route positions instead of assuming equally spaced biomes. Cache version countryside-v26.


2026-11-04 — clean sprite edges and inward dialogue
- Speech frames are squarer woodcut rectangles. Left speakers have a bottom-left tail and the frame extends right toward centre; right speakers use the mirrored frame and bottom-right tail. Text is never mirrored. The painted tail remains aimed at the mouth when avoiding HUD elements and faces.
- Canonical generated frame: assets/v11/ui/speech-square.png; native source 1717x916, layout size 491x262 before global artScale. src/engine/speech-bubbles.js handles placement and tail attachment.
- Terrain: assets/terrain-clean/ contains pixel-cleaned copies of all 15 active v24 strips. Native 2172x724 canvases, anchors, baselines and scale metadata remain the same. Original assets/terrain-v24 files remain for rollback. The cleanup removes broad near-edge grey matte and soft alpha fringe, preserves opaque dark ink RGB and pale opaque interiors, and avoids renderer silhouette expansion for these exports.
- Audit: review/terrain-cleanup-audit.json and review/terrain-before-after.png. Reproduce with tools/clean_terrain_sprites.py (Pillow, NumPy, SciPy). No character designs or animation poses were regenerated for this repair.
- Review: /?debug&notimer&preview=bubbles&v=clean-ink-1 and /scenery-review.html?v=clean-ink-1. Normal / starts normally; review routes are opt-in. Music stays muted at startup.

Dialogue placement refinement: prefer the centre of the screen (paired frames on either side of centre when two characters speak). Actual face/visor anchors are measured for the main knight, four original companions and three specialists. Body and tail must both clear face rectangles; no collision-cost tradeoff can allow covering a face. If no safe slot exists, defer the bark. Preview version: centred-bubbles-3.
Bubble source prompt and tool provenance: assets/v11/ui/speech-square.prompt.txt.
