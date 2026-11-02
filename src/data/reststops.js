// Rest stops appear on the road after battles (seamless, no screen cut).
// every: a rest stop after every N battles (math/boss). rotation cycles the stop types.
// heals: key + label + hearts + cost (once = only once per visit). recruits: [min,max] candidates waiting.
// recruitCost: gold to sign one up. gear: what this stop sells (levels go up to KM_DATA.party max).
// v7: recruiting is by MATHS (a recruit sum); a failed sum advances the hunters and offers a D20 contest
// (single opposing d20 rolls, ties re-rolled; PROVISIONAL). view = layered scene shown while stopped
// (KM_ART7.scenes: "camp" = campfire with 4 party seats, "tavern" = exterior facade -> interior with table/bar talk points + EXIT).
window.KM_DATA = window.KM_DATA || {};
KM_DATA.restStops = {
  every: 1,
  rotation: ["tavern", "stall", "campsite", "shop"], // v11b: + Magnus's roadside scroll stall
  types: {
    tavern: {
      label: "Tavern", name: "The Gristle & Flagon", exterior: "tavern", keeper: "tavern_keeper", keeperName: "Mistress Gristle", view: "tavern",
      greet: "Sit down. Wipe your boots. Don't touch the stew pot.",
      // v11b (Magnus's sign: TAVERN FARE / MEAD / STEW): "mead lowers intelligence as scroll of stupidity but just for 1 battle
      // and stew heals 1 heart". TEMP_BALANCE prices.
      heals: [{ key: "H", label: "bowl of stew", short: "Stew", hearts: 1, cost: 2 }],
      // TEMP_BALANCE (Magnus): per tavern VISIT (re-counted on every new tavern stop). At the limit the plaque greys out
      // and the barkeep says `lot`. Mead never stacks anyway: at most one battle's effect waiting or running.
      limits: { mead: 1, stew: 2, lot: "That's your lot." },
      mead: { key: "J", short: "Mead", cost: 3, buy: "One mead. Your next fight gets easier.", wearOff: "The mead wears off. Ugh.", already: "One mead at a time, love." },
      recruits: [2, 2], recruitCost: 0, recruitVerb: "talk them round at the table",
      gear: { maxWeapon: 1, maxArmor: 1, weaponCost: 12, armorCost: 10 }
    },
    campsite: {
      label: "Campsite", name: "A smoky campsite", exterior: "campsite", keeper: "camp_keeper", keeperName: "Old Wally", view: "camp",
      greet: "Fire's free. Logs are free. Advice is worth less.",
      heals: [{ key: "H", label: "rest by the fire", short: "Rest", hearts: 2, cost: 0, once: true }],
      recruits: [0, 1], recruitCost: 0, recruitVerb: "invite the wanderer along",
      gear: { maxWeapon: 0, maxArmor: 1, weaponCost: 0, armorCost: 6 }
    },
    // v11b: Magnus's roadside SCROLLS stall (scroll_stall.png + scroll_seller.png, KM_ART11.stall): buy Spell of Stupidity scrolls
    stall: {
      label: "Scroll stall", name: "Scrolls", exterior: "scroll_stall", keeper: "scroll_seller", keeperName: "Mumbleweed the Seller", view: "stall",
      greet: "Scrolls! Lovely stupid scrolls!",
      heals: [], recruits: [0, 0], recruitCost: 0, recruitVerb: "",
      gear: { maxWeapon: 0, maxArmor: 0, weaponCost: 0, armorCost: 0 }
    },
    shop: {
      label: "Shop", name: "Honest Edmund's Arms & Bits", exterior: "shop", keeper: "shop_keeper", keeperName: "Honest Edmund",
      greet: "Finest gear in the realm! Barely used! Mostly by the dead!",
      heals: [{ key: "H", label: "healing poultice", short: "Poultice", hearts: 3, cost: 6 }],
      recruits: [0, 1], recruitCost: 0, recruitVerb: "talk the sellsword round",
      gear: { maxWeapon: 3, maxArmor: 3, weaponCost: 9, armorCost: 7 }
    }
  }
};
