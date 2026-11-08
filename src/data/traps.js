// Trap stops (Magnus 2026-11-09; art: Maggi's grail trap v3, approved by Magnus). A grail sits on a bear trap on the road:
// the hero disarms it with multiplication sums. All right = the trap is jammed shut and the party gets an upgrade
// (a card pick when cards are on, else gold). One wrong = it snaps: a companion loses an arm (crit band narrower) or a leg
// (block band narrower); the hero never loses limbs, only a heart when nobody else can be hurt.
// The walk-onto-the-trap loss animation (Maggi's limbs v2 + preview_trap_loss) waits for Magnus's OK.
// Numbers marked PROVISIONAL need Magnus's OK.
window.KM_DATA = window.KM_DATA || {};
KM_DATA.traps = {
  at: [0.35, 0.7],          // PROVISIONAL: a trap is set this far along the road (fraction of stops), before that stop
  gap: 1300,                // road px before the trap stop (like other stops)
  sums: 2,                  // PROVISIONAL: multiplication sums to disarm
  level: "execution",       // multiplication ranges from the executioner's sums (grow with the road stage)
  gold: 8,                  // PROVISIONAL: reward when cards are off or none are left
  heroHearts: 1,            // PROVISIONAL: hearts the hero loses when no companion can be hurt (never the last one)
  limbCost: { arm: { crit: 0.03 }, leg: { block: 0.03 } }, // PROVISIONAL: band narrowing per injured companion
  art: { open: "assets/traps/v3/trap_open_grail.png", sprung: "assets/traps/v3/trap_sprung.png", w: 300, dx: -550, dy: 0 }, // 440x304, anchor bottom centre
  sfx: { snap: "hit_blocked", jam: "hit_armour" },
  say: {
    spot: ["A grail. On a bear trap. Subtle.", "Nobody touch the shiny cup."],
    jammed: ["Jammed it. The grail is ours.", "Ha! Not today, trap."],
    snap: { arm: ["My arm! Or... where my arm was.", "I only needed one anyway."], leg: ["Ow. I liked that leg.", "I'll hop the rest of the way."] },
    heroSnap: ["Ow! My fingers!"]
  }
};
