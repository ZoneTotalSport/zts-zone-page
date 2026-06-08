#!/usr/bin/env python3
"""
Seed reproductible — ajoute le champ `univers[]` (eps|camps|sdg) à chaque jeu de
apps/jeux/data/jeux-merged.json, par règles DÉTERMINISTES (aucune IA).

Décisions (voir apps/planificateur/CLAUDE.md) :
  - Catalogue = JSON statique (pas Firestore). Le `slug`/`id` est la clé stable.
  - `univers` est un ARRAY (1 à 3 univers par jeu).

Règles de tagging :
  eps   = filet le plus large : tag par défaut sur TOUT, SAUF jeux purement
          extérieur/eau sans option intérieure (en cas de doute → garder eps).
  camps = (espace extérieur) OU (nbJoueursMax >= 30) OU (mot-clé eau)
          OU (catégorie ∈ CAMP_CATS, incl. ludiques = animation type camp).
  sdg   = (catégorie ∈ SDG_BOOST) ET (matériel minimal ≤1 obligatoire)
          ET (pas purement extérieur).  [ni espace réduit ni durée : non discriminants]

Flag : les jeux catégorie "secondaire" reçoivent `secondaire: true` (restent eps,
       niveau ado à signaler dans l'UI).

Idempotent : ré-exécuter écrase proprement `univers`/`secondaire`.
Format : JSON minifié UTF-8 (separators=(',',':'), ensure_ascii=False, sans newline final).
"""
import json, re, sys, collections
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "apps/jeux/data/jeux-merged.json"

MATERIEL_MINIMAL_MAX = 1
NBJOUEURS_ELEVE_MIN  = 30
CAMP_CATS = {"afrique-asie","ameriques-europe","autochtones","olympiques",
             "traditionnels","exterieur","ludiques"}
SDG_BOOST = {"prescolaire","sans-materiel","ludiques","cooperatifs"}

WATER_RE   = re.compile(r"\b(eau|piscine|aquatique|baignade|nautique|plage)\b", re.I)
OUTDOOR_RE = re.compile(r"(ext[ée]rieur|terrain|cour d|cour\b|for[êe]t|\bparc|neige|enneig|"
                        r"plage|patinoire|gazonn|asphalt|sentier|bois[ée]|urbain|naturel|"
                        r"nature|plein air|pente|sablonneux|\bsable)", re.I)
INDOOR_SMALL_RE = re.compile(r"(classe|salle|\blocal|int[ée]rieur|polyvalent|partout|"
                             r"peu d.espace|petit espace|aucun espace|motricit|danse|sc[èe]ne)", re.I)
GYM_RE = re.compile(r"gymnase", re.I)


def n_oblig(materiel):
    c = 0
    for it in (materiel or []):
        if isinstance(it, dict):
            if it.get("obligatoire", True):
                c += 1
        else:
            c += 1
    return c


def tag_univers(x):
    esp = x.get("espace") or ""
    cat = x.get("category") or ""
    blob = esp + " " + str(x.get("title") or "") + " " + " ".join(map(str, x.get("tags") or []))
    indoor_any = bool(INDOOR_SMALL_RE.search(esp)) or bool(GYM_RE.search(esp))
    outdoor    = bool(OUTDOOR_RE.search(esp))
    water      = bool(WATER_RE.search(blob))
    purely_out = (outdoor or water) and not indoor_any
    mat_min    = n_oblig(x.get("materiel")) <= MATERIEL_MINIMAL_MAX
    jmax       = x.get("nbJoueursMax")
    nb_eleve   = isinstance(jmax, (int, float)) and jmax >= NBJOUEURS_ELEVE_MIN

    U = set()
    if not purely_out:
        U.add("eps")
    if outdoor or nb_eleve or water or cat in CAMP_CATS:
        U.add("camps")
    if cat in SDG_BOOST and mat_min and not purely_out:
        U.add("sdg")
    # garde-fou : jamais 0 univers (en théorie impossible, mais on garantit eps)
    if not U:
        U.add("eps")
    # ordre stable
    return [u for u in ("eps", "camps", "sdg") if u in U]


def main():
    items = json.loads(DATA.read_text(encoding="utf-8"))
    counts = collections.Counter()
    combos = collections.Counter()
    sec = 0
    for x in items:
        x["univers"] = tag_univers(x)
        for u in x["univers"]:
            counts[u] += 1
        combos[tuple(x["univers"])] += 1
        if (x.get("category") or "") == "secondaire":
            x["secondaire"] = True
            sec += 1
        elif "secondaire" in x:
            del x["secondaire"]
    out = json.dumps(items, ensure_ascii=False, separators=(",", ":"))
    DATA.write_text(out, encoding="utf-8")  # pas de newline final (format d'origine)

    print(f"Jeux traités : {len(items)}")
    for u in ("eps", "camps", "sdg"):
        print(f"  {u:6} {counts[u]:5}  ({100*counts[u]//len(items)}%)")
    print(f"  secondaire (flag) : {sec}")
    print("Combinaisons :", {("+".join(k) if k else "∅"): v for k, v in combos.most_common()})


if __name__ == "__main__":
    main()
