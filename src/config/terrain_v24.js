// Lower-edge repairs. Keep the source anchors and object scale unchanged.
(function(){
 const replacements={
  "castle": "assets/terrain-clean/castle.png",
  "hills": "assets/terrain-clean/hills.png",
  "distant-woods": "assets/terrain-clean/distant-woods.png",
  "village": "assets/terrain-clean/village.png",
  "near-forest": "assets/terrain-clean/near-forest.png",
  "barren-rocks": "assets/terrain-clean/barren-rocks.png",
  "canyon": "assets/terrain-clean/canyon.png",
  "fields": "assets/terrain-clean/fields.png",
  "dragon-hill": "assets/terrain-clean/dragon-hill.png",
  "bare-hill": "assets/terrain-clean/bare-hill.png",
  "windswept-hill": "assets/terrain-clean/windswept-hill.png",
  "quiet-hill": "assets/terrain-clean/quiet-hill.png"
};
 for(const [id,img] of Object.entries(replacements)) KM_ART7.parallax[id].img=img;
 // Restore the near scenery before the earlier grass-overlap workaround.
 KM_DATA.scenery.mid.bottom=950;
 KM_DATA.scenery.groundFade=null;
 Object.assign(KM_ART7.parallax,{
  "village-houses-a": {
    "img": "assets/terrain-clean/village-houses-a.png",
    "size": [
      2172,
      724
    ],
    "baseline": 642
  },
  "village-houses-b": {
    "img": "assets/terrain-clean/village-houses-b.png",
    "size": [
      2172,
      724
    ],
    "baseline": 642
  },
  "village-church": {
    "img": "assets/terrain-clean/village-church.png",
    "size": [
      2172,
      724
    ],
    "baseline": 642
  }
});
 KM_DATA.scenery.mid.variants.village=["village-houses-a","village-houses-b"];
 // One church in the world, separate from all repeating cottage strips.
 KM_DATA.scenery.mid.landmark={strip:"village-church", biome:"village", tileOffset:0.65, anchorX:1110, rise:45};
})();
