// An isolated three-room camera/combat test, not yet the third campaign chapter.
(function(){
 const D=KM_DATA;
 D.tomb={route:[
  {type:'math',enemy:'tomb_sentry',gap:1100,battleNo:2},
  {type:'math',enemy:'tomb_sentry',group:['tomb_sentry'],relay:true,gap:1200,battleNo:3},
  {type:'boss',enemy:'tomb_warden',gap:1400,battleNo:5}
 ]};
 Object.assign(D.enemies,{
  tomb_sentry:{name:'Tomb Sentry',taunt:'Keep your voice down. We are trying to be dead.',defeat:'I was enjoying the peace.',material:'armour',dropsCoins:false},
  tomb_warden:{name:'The Last Watch',taunt:'Nobody leaves before the end of my shift.',defeat:'Finally. A day off.',material:'armour',boss:true,dropsCoins:false}
 });
 Object.assign(D.combat.enemies,{tomb_sentry:{hp:16,atk:1},tomb_warden:{hp:35,atk:2}});
 Object.assign(D.combat.patterns,{tomb_sentry:{},tomb_warden:{block:.04,crit:.04,roar:true,deadline:true}});
 for(const id of ['tomb_sentry','tomb_warden'])D.graves.killedBy[id]=D.enemies[id].name;
})();
