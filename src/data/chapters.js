// Campaign order and the gate shown between chapters. Data only; game.js reads it.
// village -> The Hollow Wood -> the crypt (the tomb level), entered after the Hollow Wood's last boss.
window.KM_DATA = window.KM_DATA || {};
KM_DATA.chapters = {
  next: { village: "hollowwood", hollowwood: "tomb" },
  gates: {
    hollowwood: { title: "The Hollow Wood", line: "Beyond the village, the graves have begun to stir.", enter: "Enter the wood" },
    tomb: { title: "The Crypt", line: "Beneath the graveyard, a crypt door has ground open.", enter: "Enter the crypt" }
  }
};
