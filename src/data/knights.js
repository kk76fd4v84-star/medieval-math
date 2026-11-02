// Party (v7, GAME_DESIGN): MAX FOUR members INCLUDING the player = hero + up to 3 followers.
// Power ("strength"): every member adds base + weapon level. Hero base 2, followers base 1-2, weapon 0-3.
// A full party (4) is ~6-8 base, ~10-12 with upgrades; capped at strengthCap (12). Casualties leave the roster once.
// Hearts (v11b, Magnus): 2 per party member (hero 2, +2 per companion, max 8). Every 2 hearts lost in one battle,
// a member dies (companions first, the hero last). Armour no longer adds hearts (see combat.armourBlockPer).
window.KM_DATA = window.KM_DATA || {};
KM_DATA.party = { maxFollowers: 3, skins: 3, strengthCap: 12, heartsPerMember: 2, maxWeapon: 3, maxArmor: 3, heroBase: 2 };
KM_DATA.knights = { hero: { name: "{name}", base: 2 } }; // legacy lookups
// Recruit pool. look = which follower_<n> art slot draws them (src/config/art_config.js).
KM_DATA.recruitPool = [
  { name: "Sir Rustalot",          base: 2, look: 1, trait: "squeaks when he walks",              join: "Me armour squeaks but me heart is true!",            sacrifice: "Tell my horse... I never had a horse." },
  { name: "Sir Mildew",            base: 1, look: 2, trait: "slightly damp at all times",         join: "I've been sat in this ditch for a fortnight. Let's go.", sacrifice: "I'll hold them off! Probably!" },
  { name: "Dame Soggybottom",      base: 2, look: 3, trait: "has fallen in every moat in England", join: "Fell in a moat. Twice. I'm in.",                    sacrifice: "Run! No, not me. YOU." },
  { name: "Sir Not-Quite-Appearing", base: 1, look: 4, trait: "only partially here",              join: "I'm... mostly with you.",                            sacrifice: "Don't worry, I was barely here anyway." },
  { name: "Brother Mutterwick",    base: 1, look: 5, trait: "chants the wrong numbers",           join: "Seven, eleven, a fish... I'm coming!",               sacrifice: "Pray for me. Count for me. Mostly count." },
  { name: "Sir Shrubbington",      base: 2, look: 6, trait: "demands a nice shrubbery",           join: "Bring me a shrubbery later. Then we're square.",       sacrifice: "Plant something pretty where I fall!" },
  { name: "Sir Clip-Clop",         base: 2, look: 7, trait: "no horse, just two half coconuts",   join: "*clip clop* Right behind you!",                      sacrifice: "*clip... clop...*" },
  { name: "Dame Wobblesworth",     base: 1, look: 8, trait: "armour two sizes too big",           join: "I'll grow into it. Onwards!",                        sacrifice: "At least I'll fit in the afterlife." },
  { name: "Sir Lance-a-Little",    base: 2, look: 1, trait: "very small lance, very big ego",     join: "Size isn't everything. Let's ride.",                 sacrifice: "Remember my tiny lance!" },
  { name: "Sir Gerald the Mostly Brave", base: 2, look: 2, trait: "brave until anything happens", join: "I'm brave! Ish. Fine, I'll come.",                    sacrifice: "Why is it always the mostly brave ones?" },
  { name: "Sir Pottage",           base: 1, look: 3, trait: "always eating",                      join: "Is there food on this quest? Then yes.",             sacrifice: "Save me a bowl..." },
  { name: "Sir Quibble",           base: 1, look: 4, trait: "argues about everything",            join: "I object to joining. I'm joining.",                  sacrifice: "I'd like to formally dispute this!" },
  { name: "Dame Hedgewick",        base: 2, look: 5, trait: "carries a spare hedge",              join: "Never know when you'll need a hedge.",               sacrifice: "Hide behind the hedge! The HEDGE!" },
  { name: "Sir Snoresalot",        base: 1, look: 6, trait: "falls asleep mid-battle",            join: "Zzz... wha? Yes. Coming. Zzz.",                      sacrifice: "Wake me when it's over... oh." },
  { name: "Sir Neeeville",         base: 2, look: 7, trait: "says 'Nee!' at people he dislikes",  join: "Nee! (That means yes.)",                             sacrifice: "NEEEEEEE!" },
  { name: "Brother Thwackwell",    base: 2, look: 8, trait: "hits himself with a tray for luck",  join: "*thwack* Good omen!",                       sacrifice: "One last thwack for luck!" }
];
// v11b recruit talk (Magnus: "Like join my party? and then math with his answer after"). Select a seated NPC, pick
// "Join my party?", the hero asks, the NPC answers with a challenge, the carved sum appears, then yes / refusal (+ D20 offer).
// Lines per companion look (skin). Every line fits one painted bubble (tests/speech.test.js).
KM_DATA.recruitTalk = {
  ask: "Join my party?",
  challenge: {
    scarf:     ["Only if you can count my debts.", "Count my teeth first. Go on.", "Prove you're no fool."],
    feather:   ["Only if you can add up my feathers.", "First, a sum. Then glory.", "Count like a knight!"],
    moustache: ["Only if you can sum my wages.", "Do this sum. Then we'll talk.", "Numbers first, friend."],
    stripe:    ["Only if you can count my scars.", "Add this up, tin can.", "Show me you can count."],
    coif:      ["Only if you can count my links.", "One sum. Then I'm yours.", "Count for me, kindly."]
  },
  yes: ["Fine, I'm in.", "Right. Lead on.", "Huzzah! Count me in.", "Very well. Onwards."],
  no: ["Wrong! I'm staying.", "Nope. Can't count, can't come.", "Ha! Try harder."],
  offer: "Roll me for it, then?"
};
