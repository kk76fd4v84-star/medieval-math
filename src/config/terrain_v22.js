// Repaired artwork with drawn ends. No runtime clipping or stretching.
(function(){
 const terrain={
  "castle": {
    "img": "assets/terrain-v22/castle.png",
    "size": [
      2172,
      724
    ],
    "bbox": [
      210,
      214,
      1947,
      668
    ],
    "baseline": 668,
    "edgePixels": 0,
    "source": "/Users/magnusjansson/.codex/generated_images/01a193c0-0a31-7800-b92c-2684d1f1dc20/exec-dc15e347-e6f9-4952-9719-aa128aebc20b.png"
  },
  "hills": {
    "img": "assets/terrain-v22/hills.png",
    "size": [
      2172,
      724
    ],
    "bbox": [
      48,
      387,
      2124,
      578
    ],
    "baseline": 578,
    "edgePixels": 0,
    "source": "/Users/magnusjansson/.codex/generated_images/01a193c0-0a31-7800-b92c-2684d1f1dc20/exec-f6707962-babb-4b93-b74b-42568519d7a4.png"
  },
  "distant-woods": {
    "img": "assets/terrain-v22/distant-woods.png",
    "size": [
      2172,
      724
    ],
    "bbox": [
      54,
      432,
      2117,
      632
    ],
    "baseline": 632,
    "edgePixels": 0,
    "source": "/Users/magnusjansson/.codex/generated_images/01a193c0-0a31-7800-b92c-2684d1f1dc20/exec-423913a9-c39f-4725-b02d-483fc5e42de1.png"
  },
  "village": {
    "img": "assets/terrain-v22/village.png",
    "size": [
      2172,
      724
    ],
    "bbox": [
      31,
      160,
      2142,
      642
    ],
    "baseline": 642,
    "edgePixels": 0,
    "source": "/Users/magnusjansson/.codex/generated_images/01a193c0-0a31-7800-b92c-2684d1f1dc20/exec-d1d4e506-4f43-4e78-af04-ce9f80747233.png"
  },
  "near-forest": {
    "img": "assets/terrain-v22/near-forest.png",
    "size": [
      2172,
      724
    ],
    "bbox": [
      190,
      78,
      1982,
      655
    ],
    "baseline": 655,
    "edgePixels": 0,
    "source": "/Users/magnusjansson/.codex/generated_images/01a193c0-0a31-7800-b92c-2684d1f1dc20/exec-0e09e51e-61f7-442b-83b3-05aee4c1ba9c.png"
  },
  "barren-rocks": {
    "img": "assets/terrain-v22/barren-rocks.png",
    "size": [
      2172,
      724
    ],
    "bbox": [
      24,
      256,
      2149,
      641
    ],
    "baseline": 641,
    "edgePixels": 0,
    "source": "/Users/magnusjansson/.codex/generated_images/01a193c0-0a31-7800-b92c-2684d1f1dc20/exec-1d17c455-2669-405e-bf68-2ceab86ef821.png"
  },
  "canyon": {
    "img": "assets/terrain-v22/canyon.png",
    "size": [
      2172,
      724
    ],
    "bbox": [
      16,
      252,
      2158,
      601
    ],
    "baseline": 601,
    "edgePixels": 0,
    "source": "/Users/magnusjansson/.codex/generated_images/01a193c0-0a31-7800-b92c-2684d1f1dc20/exec-48fb26eb-cd30-40b4-94f6-3f4302ee7d4f.png"
  },
  "fields": {
    "img": "assets/terrain-v22/fields.png",
    "size": [
      2172,
      724
    ],
    "bbox": [
      9,
      279,
      2164,
      594
    ],
    "baseline": 594,
    "edgePixels": 0,
    "source": "/Users/magnusjansson/.codex/generated_images/01a193c0-0a31-7800-b92c-2684d1f1dc20/exec-abcd03c5-4c9c-4569-a965-5a8aef76e3cc.png"
  },
  "dragon-hill": {
    "img": "assets/terrain-v22/dragon-hill.png",
    "size": [
      2172,
      724
    ],
    "bbox": [
      61,
      314,
      2110,
      588
    ],
    "baseline": 588,
    "edgePixels": 0,
    "source": "/Users/magnusjansson/.codex/generated_images/01a193c0-0a31-7800-b92c-2684d1f1dc20/exec-9a249ada-6958-49d1-8ce2-607d13d06a50.png"
  }
};
 Object.entries(terrain).forEach(([id,q])=>{if(KM_ART7.parallax[id])Object.assign(KM_ART7.parallax[id],q);});
 KM_ART7.parallax["dragon-hill"].dragon=[1390,300,1670,444];
 KM_DATA.scenery.terrainOverlap=640;
 // Compensate for the space occupied by the repaired empty ends.
 KM_DATA.scenery.terrainScale=1.25;
 // The nearer settlements/woods are larger and meet the foreground grass.
 KM_DATA.scenery.mid.artScale=1.65;
 KM_DATA.scenery.mid.bottom=1010;
 KM_DATA.scenery.mid.biomeScale={fields:1.95};
 KM_DATA.scenery.mountains={strip:"canyon", biome:"canyon", speed:0.12, artScale:2.5, bottom:850, nearStrip:"barren-rocks", nearScale:1.2};
 window.KM_TERRAIN_REPAIR=terrain;
})();
