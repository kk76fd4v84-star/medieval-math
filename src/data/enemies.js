// Enemies & NPCs. Visuals live in src/config/art_config.js (same ids).
window.KM_DATA = window.KM_DATA || {};
KM_DATA.enemies = {
  rabid_squirrel: { dropsCoins: false, name: "Rabid Squirrel", taunt: "*chitters with unreasonable confidence*", defeat: "*tiny indignant squeak*", material: "flesh" },
  rabid_dog: { dropsCoins: false, name: "Rabid Dog", taunt: "*growls through a mouthful of froth*", defeat: "*whimper*", material: "flesh" },
  rabid_villager: { name: "Rabid Villager", taunt: "Off my land! And out of my sums!", defeat: "That's... not fair...", material: "flesh" },
  goblin:          { name: "Goblin",            taunt: "Oi, tin can! Do my sums or I bite yer knees!", defeat: "Me sums! Nooo!" },
  killer_rabbit:   { dropsCoins: false, name: "Killer Rabbit",     taunt: "*nibbles menacingly*", defeat: "*squeak*" },
  black_knight:    { name: "The Black Knight",  taunt: "None shall pass! Unless they can count.", defeat: "Tis but a scratch!" },
  skeleton_knight: { name: "Skeleton Knight",   taunt: "I have no brain and even I can do these.", defeat: "*clatter clatter*", boss: true },
  dragon:          { name: "Gristlefang the Dragon", taunt: "ROAR! I am power 22. You are... a rounding error.", defeat: "Defeated... by ARITHMETIC?!", boss: true },
  toad:            { dropsCoins: false, name: "A Very Large Toad",  taunt: "*gulp* Knights. Crunchy on the outside.", defeat: "*sad croak*" },
  ogre:            { name: "The Ogre",          taunt: "Me count to three. Then me eat you. One... uh...", defeat: "Me... carried the one..." },
  turd_dragon:     { name: "A Turd Dragon",     taunt: "*steams quietly on its hill*", defeat: "*plop*" },
  frank:           { name: "Frank the Priest",  taunt: "Brothers! A dragon! We must investigate it. For God. And science." },
  hunter:          { name: "The King's Hunters", taunt: "There they are! Seize the tin can!" },
  bridgekeeper:    { name: "The Bridgekeeper",  taunt: "Stop! Answer me this. Ere the other side ye see.", riddleTaunt: ["A riddle for you.", "Stop! A riddle for you.", "Riddle time, tin can.", "Answer me this!"] },
  enchanter:       { name: "An Enchanter Named Tim", taunt: "There are some who call me... Tim. Answer this!", riddleTaunt: ["A riddle for you.", "Tim has a riddle.", "Answer this!"] },
  hermit:          { name: "Smelly Hermit",     taunt: "Riddle me this! Riddle me that! Who's afraid of the big... riddle?", riddleTaunt: ["A riddle for you.", "Riddle me this, tin can.", "Psst. A riddle."] }
};

// v11b combat SFX: which hit sound a monster makes (flesh / armour); boss fights always use the boss hit
Object.entries({ goblin: "flesh", killer_rabbit: "flesh", black_knight: "armour", skeleton_knight: "armour", dragon: "flesh", turd_dragon: "flesh", hunter: "armour", toad: "flesh", ogre: "flesh" })
  .forEach(([id, m]) => { if (KM_DATA.enemies[id]) KM_DATA.enemies[id].material = m; });
