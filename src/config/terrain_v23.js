// Airy woodland variations; original v22 assets remain available.
(function(){
 const art={
  "bare-hill": {
    "img": "assets/terrain-v23/bare-hill.png",
    "size": [
      2172,
      724
    ],
    "baseline": 707,
    "source": "/Users/magnusjansson/.codex/generated_images/01a193c0-0a31-7800-b92c-2684d1f1dc20/exec-d37721e9-18ea-4b3a-89a3-688193071ad2.png"
  },
  "windswept-hill": {
    "img": "assets/terrain-v23/windswept-hill.png",
    "size": [
      2172,
      724
    ],
    "baseline": 691,
    "source": "/Users/magnusjansson/.codex/generated_images/01a193c0-0a31-7800-b92c-2684d1f1dc20/exec-1bba2646-5933-4c6f-b6df-76a6670b26f6.png"
  },
  "quiet-hill": {
    "img": "assets/terrain-v23/quiet-hill.png",
    "size": [
      2172,
      724
    ],
    "baseline": 688,
    "source": "/Users/magnusjansson/.codex/generated_images/01a193c0-0a31-7800-b92c-2684d1f1dc20/exec-cdde0e80-53a2-4d01-8e54-43986982d324.png"
  }
};
 Object.assign(KM_ART7.parallax,art);
 KM_DATA.scenery.mid.variants={"near-forest":["bare-hill","windswept-hill","quiet-hill"]};
 KM_DATA.scenery.mid.biomeScale["near-forest"]=1.45;
})();
