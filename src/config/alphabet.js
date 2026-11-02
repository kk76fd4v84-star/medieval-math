// v12k Maggi's engraved capital alphabet A-Z (assets/alphabet/v1/NOTES.md), for the fire bottle's spelling word.
// Ink-only like the sum digits; drawn at source px x artScale. One PNG per letter: ink (not typed yet, shown at 35%),
// correct/ (burnt orange #B5561C, typed right), wrong/ (madder red #7A1F14, typed wrong).
// To swap the look (Magnus hasn't approved it yet): point `dir` at another folder with the same layout, or set
// window.KM_ALPHABET = null to fall back to the sum's font. Widths = each PNG's width (its advance box), height 190.
window.KM_ALPHABET = {
  dir: "assets/alphabet/v1/", done: "correct/", bad: "wrong/", h: 190, baseline: 173,
  maxW: 1300, // stage px: a longer word is scaled down to fit
  w: {"A": 191, "B": 163, "C": 168, "D": 178, "E": 157, "F": 151, "G": 184, "H": 190, "I": 95, "J": 131, "K": 180, "L": 149, "M": 210, "N": 172, "O": 171, "P": 160, "Q": 182, "R": 180, "S": 146, "T": 163, "U": 170, "V": 175, "W": 233, "X": 178, "Y": 169, "Z": 154}
};
