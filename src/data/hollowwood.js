// Second chapter. Fixed authored threats, seeded small-pack variety; gear never raises enemy power.
window.KM_DATA=window.KM_DATA||{};
KM_DATA.hollowwood={
  id:'hollowwood',name:'The Hollow Wood',
  assets:'assets/hollowwood/v39/',
  route:[
    {type:'rest',rest:'campsite',gap:1700},
    {enemy:'grave_spider',gap:1800},
    {enemy:'hollow_skeleton',group:['hollow_zombie'],relay:true,gap:1900},
    {type:'riddle',npc:'bridgekeeper',gold:4,dmg:1,gap:1600},
    {type:'rest',rest:'shop',shopTier:2,gap:1700},
    {enemy:'hollow_zombie',group:['hollow_zombie'],relay:true,gap:2000},
    {enemy:'root_horror',gap:1800},
    {type:'rest',rest:'tavern',gap:1800},
    {enemy:'grave_spider',group:['grave_spider','hollow_skeleton'],relay:true,gap:1800},
    {type:'riddle',npc:'bridgekeeper',gold:4,dmg:1,gap:1700},
    {type:'rest',rest:'campsite',gap:1600},
    {enemy:'root_horror',group:['hollow_zombie'],relay:true,gap:1900},
    {enemy:'hollow_skeleton',group:['hollow_zombie','grave_spider'],relay:true,gap:1900},
    {type:'rest',rest:'shop',shopTier:3,gap:1700},
    {type:'riddle',npc:'bridgekeeper',gold:4,dmg:1,gap:1600},
    {type:'rest',rest:'campsite',gap:1800},
    {type:'boss',enemy:'parish_collector',gap:2500},
    {type:'optional',id:'bell-beneath',enemy:'bell_beneath',gap:2600}
  ]
};
Object.assign(KM_DATA.enemies,{
 hollow_skeleton:{name:'The Late Watchman',taunt:'You are late. I am later.',defeat:'Back to the night shift...',material:'armour'},
 hollow_zombie:{name:'Unearthed Villager',taunt:'Five more minutes. I was buried.',defeat:'Wake me for supper.',material:'flesh'},
 grave_spider:{name:'Grave Spider',taunt:'*eight legs, no manners*',defeat:'*a very dry crunch*',material:'flesh',dropsCoins:false},
 root_horror:{name:'Grasping Roots',taunt:'*the earth reaches back*',defeat:'*wood splits beneath the road*',material:'flesh',dropsCoins:false},
 parish_collector:{name:'The Parish Collector',taunt:'All debts are collected. Even the dead ones.',defeat:'I shall be... writing a complaint.',material:'flesh',boss:true},
 bell_beneath:{name:'The Bell Beneath',taunt:'There is room for one more beneath the bell.',defeat:'*at last, the bell is silent*',material:'armour',boss:true}
});
Object.assign(KM_DATA.combat.enemies,{
 hollow_skeleton:{hp:12,atk:1},hollow_zombie:{hp:14,atk:1},grave_spider:{hp:9,atk:1},
 root_horror:{hp:17,atk:1},parish_collector:{hp:48,atk:2},bell_beneath:{hp:64,atk:2}
});
Object.assign(KM_DATA.combat.patterns,{
 hollow_skeleton:{block:.05},hollow_zombie:{},grave_spider:{deadline:true},
 root_horror:{block:.08},
 parish_collector:{crit:.08,block:.10,roar:true},
 bell_beneath:{crit:.10,block:.15,roar:true,deadline:true}
});
Object.assign(KM_DATA.combat.economy.purses,{hollow_skeleton:3,hollow_zombie:3,parish_collector:8,bell_beneath:10});

for(const id of ['hollow_skeleton','hollow_zombie','grave_spider','root_horror','parish_collector','bell_beneath'])KM_DATA.graves.killedBy[id]=KM_DATA.enemies[id].name;
