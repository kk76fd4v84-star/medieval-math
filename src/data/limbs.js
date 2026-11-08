// Companion injuries (Maggi's limbs v1, approved by Magnus 2026-11-09): a member with `limb: "arm"` or `"leg"` draws a
// same-layout stand-in of its sheet (bandaged missing arm / wooden peg). The hero never loses limbs.
// Sheets load the first time someone is hurt; until then the intact sheet shows. Nothing here sets `limb` yet:
// the trap stops will (src/data/traps.js, once its art is approved). Shared rear-walk sheet not wired yet (one look per sheet).
window.KM_DATA = window.KM_DATA || {};
KM_DATA.limbs = {
  dir: "assets/limbs/v1/",
  sheets: { // original sheet -> stand-in name; file = dir + name + "_no_" + limb + ".png"
    "assets/party-roles/frank.png": "frank",
    "assets/party-roles/executioner.png": "executioner",
    "assets/party-roles/timmy.png": "timmy",
    "assets/wizard-riddles/v22/wizard.png": "dark_wizard",
    "assets/v10/walks/scarf-walk.png": "follower_1_walk",
    "assets/v10/walks/feather-walk.png": "follower_2_walk",
    "assets/v10/walks/moustache-walk.png": "follower_3_walk",
    "assets/v10/walks/stripe-walk.png": "follower_4_walk",
    "assets/v18/coif-walk-atlas.png": "follower_5_walk",
    "assets/v18/coif-idle-atlas.png": "follower_5_idle",
    "assets/v18/coif-attack-atlas.png": "follower_5_attack",
    "assets/v18/coif-hurt-atlas.png": "follower_5_hurt",
    "assets/v18/coif-death-atlas.png": "follower_5_death"
  }
};
