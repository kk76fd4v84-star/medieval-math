// Replacement decisions are deterministic per run/stop/person, so reload cannot reroll resentment.
window.KM=window.KM||{};
KM.Recruitment=(()=>{
 function snapshot(m,art){return {id:m.id,name:m.name,role:KM.PartyAbilities.role(m),companionId:m.companionId,art,skin:m.skin,base:m.base,weapon:m.weapon||0,armor:m.armor||0};}
 function hostile(run,chapter,stop,m){return KM.Progression.random(`${run}:${chapter}:${stop}:dismiss:${m.id}`)()<1/3;}
 // Equipment remains with the dismissed person. Armour is represented in enemy endurance.
 function combat(m){return {hp:6+2*(m.weapon||0)+(m.armor||0),atk:1+Math.floor((m.weapon||0)/2)};}
 return {snapshot,hostile,combat};
})();
