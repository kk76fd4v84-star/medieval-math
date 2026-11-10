import json,base64,io,subprocess
from PIL import Image
ops={"knight":"+ (plus)","firestarter":"× (multiply)","darkWizard":"× (multiply)",None:"none (any party)"}
tiers={"cleave":"rare","swing_and_a_miss":"trade-off","embers":"rare","shield_wall":"common","storm_surge":"rare","overcharge":"trade-off"}
hit={"cleave":"Knight hits one extra front enemy (2 → 3 targets).","swing_and_a_miss":"Knight hits one extra front enemy (2 → 3 targets).",
"embers":"Firestarter's hit sets targets burning for 1 damage per turn.","shield_wall":"Armour refills after a fight with no hearts lost.",
"storm_surge":"Right answer: lightning hits every enemy harder (+3).","overcharge":"Right answer: lightning hits every enemy much harder (+6)."}
cost={"cleave":"Knight sums +1 level harder.","swing_and_a_miss":"A miss chips 1 heart unit (½ heart with half-hearts) off an ally; never the last heart.",
"embers":"Firestarter sums +2 levels harder.","shield_wall":"No cost.","storm_surge":"Wizard sums get harder (+1 level).","overcharge":"A miss shocks one ally (1 heart unit, never the last)."}
combos={"cleave":"Forge (with Embers) – proposed, not in code","embers":"Forge (with Cleave); Wildfire (with Inferno) – proposed, not in code"}
js=open("src/src/data/upgrade_cards.js").read()
data=json.loads(subprocess.check_output(["node","-e","global.window=global;eval(require('fs').readFileSync('src/src/data/upgrade_cards.js','utf8'));console.log(JSON.stringify(KM_DATA.upgradeCards))"]))
json.dump(data,open("cards_source.json","w"),indent=2)
cards=[]
for c in data["list"]:
  e,k=c["effect"],c["cost"]
  img=""
  try:
    im=Image.open("src/"+c["img"].split("?")[0]).convert("RGB");im.thumbnail((220,320))
    b=io.BytesIO();im.save(b,"JPEG",quality=72);img="data:image/jpeg;base64,"+base64.b64encode(b.getvalue()).decode()
  except Exception as x: print("noimg",c["id"],x)
  cards.append({"id":c["id"],"name":c["name"],"owner":c["owner"] or "any","operation":ops[c["owner"]],"tier":tiers[c["id"]],
   "offered":"Rest stops (camp, shop, tavern), 2 shown per pick; only if owner is alive" if c["owner"] else "Rest stops (camp, shop, tavern), 2 shown per pick",
   "hit_effect":hit[c["id"]],"miss_or_cost":cost[c["id"]],
   "knightTargets":e.get("knightTargets",0),"burn":e.get("burn",0),"wizardDamage":e.get("wizardDamage",0),"cleanRefill":1 if e.get("cleanRefill") else 0,
   "levelCost_knight":k.get("level",{}).get("knight",0),"levelCost_firestarter":k.get("level",{}).get("firestarter",0),"levelCost_darkWizard":k.get("level",{}).get("darkWizard",0),
   "missChip":k.get("missChip",0),**{"meterBack_"+o:e.get("meterBack",{}).get(o,0) for o in ["crit","block","normal","weak","miss"]},"combos":combos.get(c["id"],""),"notes":"","_img":img})
html=open("tpl.html").read().replace("__DATA__",json.dumps(cards))
open("card_codex.html","w").write(html)
