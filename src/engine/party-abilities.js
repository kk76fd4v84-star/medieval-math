// Role rules are independent of artwork, names and save-file age.
window.KM = window.KM || {};
KM.PartyAbilities = (() => {
  const role = m => m.role || ({frank:'priest',timmy:'firestarter',executioner:'executioner'}[m.companionId]) || 'knight';
  // Individual equipment caps apply to all shops and restored saves. Armour is consumable.
  const gearCap = (kind, shopCap = Infinity) => Math.max(0, Math.min(3, KM_DATA.party[kind === 'weapon' ? 'maxWeapon' : 'maxArmor'], shopCap));
  const normalizeGear = m => ({...m, weapon:Math.min(gearCap('weapon'),Math.max(0,Math.floor(Number(m.weapon)||0))), armor:Math.min(gearCap('armor'),Math.max(0,Number(m.armor)||0))});
  const alive = m => !m.dying && !m.eaten;
  const members = (party, r) => party.filter(m => alive(m) && role(m) === r);
  // Only new-run heroes carry this origin. Existing saves keep their approved knight.
  const villager = m => m?.id === 'hero' && m.origin === 'villager';
  const unarmed = m => villager(m) && !(m.weapon > 0);
  // knightStart switch: the starter knight (chipped sword) until the first weapon upgrade, then the existing knight art
  const heroArt = m => m?.id === 'hero' && m.origin === 'starter' && !(m.weapon > 0) && KM_ART.entities.hero_starter ? 'hero_starter'
    : !villager(m) || (m.armorTrained && m.weapon > 0) ? 'hero'
    : m.armorTrained ? 'villager_armour' : m.weapon > 0 ? 'villager_sword' : 'villager';
  const life = () => KM_DATA.party.heartsPerMember;
  const maxHp = party => party.reduce((n,m) => n + life(m), 0);
  const bonus = (party,r) => 1 + .5 * Math.max(0, members(party,r).length - 1);
  const swordBase = party => {
    const m = members(party,'knight')[0];
    return KM_DATA.combat.weakBase + Math.floor((m && m.base || 2) / KM_DATA.combat.weakPer) + members(party,'knight').reduce((n,m)=>n+(m.weapon||0),0)/Math.max(1,members(party,'knight').length);
  };
  const weak = party => swordBase(party) * bonus(party,'knight');
  const hard = party => (swordBase(party) * KM_DATA.combat.hardMul + KM_DATA.combat.hardAdd) * bonus(party,'knight');
  // Priests progress through utility, not healing amount: heal -> resurrect -> easier maths.
  const heal = party => KM_DATA.combat.healHearts;
  const priestLevel = (party, action) => members(party,'priest').length>=3 ? (action==='resurrect'?'normal':'easy') : (action==='resurrect'?'hard':null);
  const fire = party => (KM_DATA.combat.weakBase + members(party,'firestarter').reduce((n,m)=>Math.max(n,m.weapon || 0),0)) * bonus(party,'firestarter');
  const executionReady = foe => !!(foe && !foe.gone && foe.hp > 0 && foe.maxHp > 0 && foe.hp <= foe.maxHp / 2);
  const execute = (party,foe) => (KM_DATA.combat.weakBase + members(party,'executioner').reduce((n,m)=>Math.max(n,m.weapon || 0),0)) * bonus(party,'executioner') * (executionReady(foe) ? 2 : 1);
  // Spend unhealed battle damage against the rear-most companion first. Hero is always last.
  function casualties(party, lost, hp) {
    const order = party.filter(m=>m.id!=='hero').reverse().concat(party.filter(m=>m.id==='hero'));
    let count=0;
    for (const m of order) { if (lost < life(m) && hp > 0) break; lost=Math.max(0,lost-life(m)); count++; }
    return {count,lost};
  }
  const armour = party => party.reduce((n,m)=>n+Math.max(0,m.armor||0),0);
  function absorb(party, damage){
    let remaining=Math.max(0,damage),blocked=0;
    const order=party.filter(m=>m.id!=='hero').reverse().concat(party.filter(m=>m.id==='hero'));
    for(const m of order){const used=Math.min(remaining,Math.max(0,m.armor||0));m.armor=Math.max(0,(m.armor||0)-used);remaining-=used;blocked+=used;if(!remaining)break;}
    return {blocked,hearts:remaining};
  }
  return {gearCap,normalizeGear,villager,unarmed,heroArt,armour,absorb,role,alive,members,life,maxHp,bonus,weak,hard,heal,priestLevel,fire,executionReady,execute,casualties};
})();
