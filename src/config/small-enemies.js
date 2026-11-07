// Cutouts are calibrated against the approved hero; coordinates are layout units.
Object.assign(KM_ART.entities,{
  "rabid_squirrel": {
    "img": "assets/enemies-small/rabid_squirrel.png",
    "anchor": [
      628,
      1177
    ],
    "top": 12,
    "artMul": 0.20267,
    "box": {
      "w": 212.5,
      "h": 212.5
    },
    "noFallbackDeath": true,
    "status": "Prototype cutout; existing snap/hit reactions, no dedicated frame animation yet."
  },
  "rabid_dog": {
    "img": "assets/enemies-small/rabid_dog.png",
    "anchor": [
      798,
      921
    ],
    "top": 361,
    "artMul": 0.525794,
    "box": {
      "w": 589,
      "h": 265
    },
    "noFallbackDeath": true,
    "status": "Prototype cutout; existing snap/hit reactions, no dedicated frame animation yet."
  },
  "rabid_villager": {
    "img": "assets/enemies-small/rabid_villager.png",
    "anchor": [
      648,
      1119
    ],
    "top": 19,
    "artMul": 0.474747,
    "box": {
      "w": 527,
      "h": 470
    },
    "noFallbackDeath": true,
    "status": "Prototype cutout; existing snap/hit reactions, no dedicated frame animation yet."
  }
});

Object.assign(KM_WIDE,{rabid_squirrel:[-106.25,106.25],rabid_dog:[-295,295],rabid_villager:[-264,264]});
Object.assign(KM_TALL,{rabid_squirrel:212.5,rabid_dog:265,rabid_villager:470});
