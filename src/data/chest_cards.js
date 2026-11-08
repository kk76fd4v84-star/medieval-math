// Chest cards (switch: KM_DATA.balanceTry.chestCards, ?chestcards=1; turns on the upgrade cards). Magnus 2026-11-08:
// upgrade cards ONLY come from treasure chests guarded by stronger foes; shops just sell things.
// The chest stands on the layer behind the guard; when the fight is won it shines, unlocks, and the card pick opens.
window.KM_DATA = window.KM_DATA || {};
KM_DATA.chestCards = {
  guards: ["goblin", "ogre", "troll", "skeleton_knight", "black_knight", "turd_dragon", "dragon"],  // stop's main foe
  chest: {
    img: null,            // painted chest (closed) when Maggi delivers one, e.g. "assets/chest/v1/chest.png"; null = ink placeholder
    openImg: null,        // painted open chest; null = placeholder
    dx: 190, dy: 40,      // behind the guard: this far right of its home spot and this far up the ground (layout units)
    scale: 1.4, w: 150, h: 112  // placeholder size (layout units) x scale
  },
  shine: { ms: 1400, radius: 340, colour: "255,196,64", rays: 12, rayColour: "255,170,30" },  // glow behind the chest after the fight, then the pick opens
  delayMs: 900,           // after the last foe falls (its death animation) before the shine
  sfx: { unlock: "chest_unlock", shine: "chest_shine" }      // optional, silent until Charlie's files are mapped
};
