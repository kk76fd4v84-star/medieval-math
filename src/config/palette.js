// Concept colour families, not a strict colour limit (Magnus, Nov 5). Keep natural ink variation.
window.KM_PALETTE={
  ink:'#24241c', shadow:'#6c6050', leather:'#80644c', paper:'#e4ccb4', light:'#ecdcc4', orange:'#ac5c24',
  profiles:[
    {match:'assets/villager-start/tavern-cloth.png',paper:[248,202,150],kind:'scene'},
    {match:'assets/tavern-pov/room.png',paper:[246,202,152],kind:'scene'},
    {match:'assets/v7/scenes/exterior-facade-cut.png',paper:[250,224,184],kind:'scene'},
    {match:'assets/tavern-pov/visitors-v2.png',paper:[238,204,168],kind:'sprite'},
    {match:'assets/tavern-pov/specialists-seated.png',paper:[240,212,176],kind:'sprite'},
    // Keep the wizard's original black ink, warm skin and leather variation, like the approved knight.
    {match:'assets/wizard-riddles/v22/wizard.png',paper:[242,214,177],kind:'sprite',preserve:true},
    {match:'assets/villager-start/v22/villager_armour-',paper:[240,222,192],kind:'sprite',accentRatio:1.4},
    {match:'assets/villager-start/v22/villager-walk.png',paper:[244,209,168],kind:'sprite',materialMask:'assets/villager-start/materials/villager-cloth.png'},
    {match:'assets/villager-start/v22/villager_sword-walk.png',paper:[244,209,168],kind:'sprite',materialMask:'assets/villager-start/materials/villager_sword-cloth.png'},
    {match:'assets/villager-start/v22/',paper:[244,209,168],kind:'sprite'},
    // This enemy keeps its original ink, skin and scarf. Clothing gains muted, worn fabric colour.
    {match:'assets/enemies-small/rabid_villager.png',paper:[237,214,184],kind:'sprite',preserve:true,excludeMaterials:[[[280,451],[350,447],[1167,674],[1186,701],[1169,729],[352,508],[280,488]],[[923,571],[965,583],[1006,666],[972,702],[942,699],[893,670],[907,616]]],materials:[
      {colour:'#9a7954',polygon:[[474,26],[748,0],[880,69],[1013,161],[965,233],[852,245],[794,191],[678,183],[585,148],[486,137]]},
      {colour:'#9a876c',polygon:[[804,277],[879,285],[971,327],[966,394],[931,458],[863,479],[807,517],[756,506],[748,455],[777,405],[790,332]]},
      {colour:'#9a876c',polygon:[[688,558],[775,560],[853,588],[903,625],[991,640],[1004,732],[1055,786],[1027,861],[905,897],[867,916],[848,881],[815,910],[751,863],[703,842],[659,854],[655,795],[677,739],[670,654]]},
      {colour:'#806448',polygon:[[555,824],[671,863],[664,946],[719,987],[759,1054],[670,1098],[530,1105],[378,1140],[301,1118],[289,1075],[374,1035],[432,1000],[481,921]]},
      {colour:'#806448',polygon:[[1051,874],[1175,940],[1216,992],[1298,1031],[1324,1093],[1268,1124],[1061,1102],[975,1086],[987,1038],[1016,996],[1028,947]]}
    ]}
  ]
};
