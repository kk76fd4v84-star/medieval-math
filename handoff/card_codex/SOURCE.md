# Card codex → game mapping
Source: kk76fd4v84-star/medieval-math, branch tavern-cards (PR #8), file `src/data/upgrade_cards.js` (`KM_DATA.upgradeCards.list`). Engine: `src/engine/upgrade-cards.js` (`KM.Cards`). Original data: cards_source.json. Generator: gen.py.

| Codex field | In code |
|---|---|
| id, name, owner | `id`, `name`, `owner` (`"any"` = `owner: null`) |
| operation | not stored; derived from owner via the who-acts table (knight +, firestarter/darkWizard ×) |
| tier | not in code; taken from Game lead's ruleset (common/rare/trade-off) |
| offered | not per card; `KM.Cards.offer()` shows `offered: 2` random unheld cards at each rest stop (game.js ~1776), only if owner is alive |
| hit_effect / miss_or_cost | descriptive; for Dark Wizard cards these are `text` / `costText`. Other cards' text is baked into the PNG (`img`) – text edits need new art from Maggi |
| knightTargets | `effect.knightTargets` – extra front targets (fellowship.js `live.slice(0,2+n)`) |
| burn | `effect.burn` – burn damage per turn on Firestarter hits |
| wizardDamage | `effect.wizardDamage` – added to Dark Wizard damage |
| cleanRefill | `effect.cleanRefill: true` (1) – armour refill after a no-loss fight (game.js ~1279) |
| levelCost_<role> | `cost.level.<role>` – sum-level increase via `KM.Cards.levelBonus` |
| missChip | `cost.missChip` – heart units lost on a miss, never the last (game.js ~876) |
| combos | NOT in code (no combo field/logic for cards; only the combo_sting sound exists) |
| notes, _deleted | Magnus's notes / delete flag only |

Edits file: `card_codex_edits.json` = `{cards:[...], changed:{id:[fields]}}`; `_oid` is the original id (if he renamed an id).
