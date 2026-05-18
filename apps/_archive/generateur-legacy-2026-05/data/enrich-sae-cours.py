#!/usr/bin/env python3
"""Enrichit chaque SAÉ avec un tableau cours[] (3-10 cours).

Stratégie heuristique :
- N = clamp(3, 10, duree_periodes || 5)
- Distribue le contenu de `deroulement` sur N cours selon une progression pédagogique
- Réutilise `variantes` pour générer des éducatifs progressifs
- Génère echauffement/retour_au_calme adaptés au moyen_action
"""
import json, re, sys, os, glob, copy
from pathlib import Path

ROOT = Path(__file__).parent / "sae"

# ─── Helpers ─────────────────────────────────────────────────────────

def parse_duree(s, default=45):
    if not s: return default
    m = re.search(r"(\d+)", str(s))
    return int(m.group(1)) if m else default

def clamp(n, lo, hi): return max(lo, min(hi, n))

# Échauffements templates par moyen d'action
ECHAUFFEMENT_TEMPLATES = {
    "balle": "Course légère 2 min, puis manipulation libre du ballon (10 dribbles main droite, 10 main gauche). Étirements dynamiques épaules/poignets.",
    "ballon": "Course en cercle 2 min, jonglage à 2 mains. Mobilisation des chevilles, genoux, hanches. Petit défi de précision en passes.",
    "raquette": "Course souple 2 min, prise de raquette et balancements doux. Échanges en douceur sans cible. Étirements des avant-bras.",
    "baton": "Échauffement articulaire complet (poignets, coudes, épaules). Manipulation du bâton sans crosser. Petits déplacements latéraux.",
    "corde": "Course 2 min, sauts simples sur place. Mobilisation chevilles/mollets. 30 sauts à la corde individuels en rythme libre.",
    "cerceau": "Course en évitant des cerceaux au sol. Sauts pieds joints dans/hors cerceau. Étirements jambes et bras.",
    "courir": "Course progressive 3 min (lente → rapide). Talons-fesses, montées de genoux. Petits sprints courts (10 m).",
    "sauter": "Échauffement articulaire complet, sauts pieds joints, sauts à cloche-pied alternés. Étirements mollets/quadriceps.",
    "grimper": "Mobilisation épaules, poignets, dos. Course légère puis pompes au mur. Étirements complets membres supérieurs.",
    "equilibre": "Marche talon-pointe, équilibre unipodal (10 sec chaque pied). Mobilisation chevilles, gainage léger 30 sec.",
    "lutte": "Échauffement articulaire complet. Roulades avant/arrière douces. Travail postures de base sans contact. Étirements profonds.",
    "duel": "Course souple, déplacements latéraux, fentes. Travail réflexes (réagir à un signal). Étirements complets.",
    "danse": "Marche rythmée sur musique douce, ondulations buste/bras. Isolations corporelles (tête, épaules, hanches). Mobilité articulaire.",
    "expression": "Marche libre dans l'espace, jeu d'imitation (animaux, machines). Expressions faciales, ondulations corporelles.",
    "cooperation": "Cercle d'équipe : passe de regards, mains tapées en rythme. Petit jeu d'écoute en groupe. Mobilisation articulaire.",
    "default": "Course souple 3 min dans l'espace de jeu. Mobilisation articulaire (chevilles, genoux, hanches, épaules). Étirements dynamiques courts.",
}

RETOUR_CALME_TEMPLATES = [
    "Marche lente en cercle, respiration profonde (4 temps inspirer / 4 temps expirer). Étirements globaux 5 min : jambes, dos, bras.",
    "Cercle final assis. Chacun nomme un moment qu'il a aimé du cours. Étirements doux assis (jambes tendues, dos rond, ouverture hanches).",
    "Position allongée 2 min, yeux fermés, respiration calme. Visualisation positive du prochain cours. Réveil corporel doux.",
    "Pouce levé / pouce baissé : auto-évaluation de la séance. Cercle de paroles : « j'ai appris... ». Étirements en duo (dos contre dos).",
    "Massages doux des épaules en cercle (chacun masse celui devant lui). Respiration synchronisée. Salutation finale en équipe.",
]

CONSIGNES_SECURITE_DEFAULT = [
    "Lacets attachés, bijoux retirés, vêtements adaptés.",
    "Espace de jeu dégagé, vérifier le sol avant chaque atelier.",
    "Boire de l'eau régulièrement, signaler toute douleur.",
    "Respect des consignes de l'enseignant·e à tout moment.",
]

def echauf_for_moyen(moyen):
    if not moyen: return ECHAUFFEMENT_TEMPLATES["default"]
    m = moyen.lower()
    for k, v in ECHAUFFEMENT_TEMPLATES.items():
        if k in m: return v
    return ECHAUFFEMENT_TEMPLATES["default"]

def split_text_into_chunks(text, n):
    """Découpe un texte (deroulement.partie_principale_X concaténé) en n morceaux pédagogiques."""
    if not text: return [""] * n
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    if len(sentences) <= n:
        return sentences + [""] * (n - len(sentences))
    chunks = []
    per = len(sentences) // n
    rest = len(sentences) % n
    idx = 0
    for i in range(n):
        take = per + (1 if i < rest else 0)
        chunks.append(" ".join(sentences[idx:idx+take]))
        idx += take
    return chunks

# ─── Génération cours ─────────────────────────────────────────────────

def phase_title(i, N, theme):
    if i == 1: return f"Découverte et exploration — {theme}"
    if i == N: return f"Bilan et évaluation finale"
    if i == N - 1: return f"Tâche complexe — {theme} en contexte"
    if N >= 5 and i == 2: return f"Initiation technique de base"
    if N >= 6 and i == N - 2: return f"Consolidation et stratégie d'équipe"
    return f"Apprentissage progressif — étape {i - 1}"

def phase_objectif(i, N, intentions):
    if i == 1: return f"Découvrir l'activité, susciter la curiosité, mobiliser les premières habiletés. {intentions or ''}".strip()
    if i == N: return "Évaluer les apprentissages, faire un retour réflexif sur la progression et célébrer les réussites."
    if i == N - 1: return f"Mettre en application l'ensemble des apprentissages dans une tâche complexe authentique."
    return f"Approfondir les apprentissages, complexifier la tâche, développer la coopération et l'autonomie."

def build_educatifs(i, N, variantes, partie_text):
    """Génère 2-4 éducatifs pour le cours i."""
    edu = []
    if i == 1:
        edu.append({
            "nom": "Exploration libre",
            "duree_min": 8,
            "description": "Manipulation et exploration libres du matériel pour se familiariser. Aucune consigne précise — observer comment les élèves s'approprient l'activité.",
            "consignes": "Laisser jouer librement, intervenir seulement pour la sécurité.",
            "variante": "En binôme pour les élèves plus timides."
        })
        edu.append({
            "nom": "Premier défi guidé",
            "duree_min": 10,
            "description": "Défi simple proposé à toute la classe pour structurer l'exploration : reproduire un geste démontré par l'enseignant·e.",
            "consignes": "Démonstration claire, répétition lente, rétroaction immédiate.",
            "variante": "Adapter la distance ou le nombre de répétitions selon le niveau."
        })
        return edu
    if i == N:
        edu.append({
            "nom": "Mini-épreuve d'évaluation",
            "duree_min": 15,
            "description": "Chaque élève (ou équipe) réalise une courte démonstration des habiletés clés acquises durant la SAÉ. Auto-évaluation guidée.",
            "consignes": "Grille d'observation simple. Encourager, ne pas juger.",
            "variante": "Évaluation par les pairs avec une grille co-construite."
        })
        edu.append({
            "nom": "Retour réflexif en groupe",
            "duree_min": 10,
            "description": "Cercle de discussion : « Ce que j'ai appris », « Ce qui était difficile », « Ce que j'aimerais refaire ».",
            "consignes": "Tour de parole, écoute active, pas de jugement.",
            "variante": "Dessin libre ou journal de bord pour les élèves moins à l'aise à l'oral."
        })
        return edu
    # Cours intermédiaires : utiliser les variantes existantes
    var_take = []
    if isinstance(variantes, list) and len(variantes) > 0:
        idx_start = (i - 2) % len(variantes)
        var_take = [variantes[(idx_start + k) % len(variantes)] for k in range(min(2, len(variantes)))]
    chunk = partie_text or ""
    if chunk:
        edu.append({
            "nom": f"Atelier technique — étape {i - 1}",
            "duree_min": 12,
            "description": chunk[:400],
            "consignes": "Stations de 4-5 élèves, rotation toutes les 5 min, démonstration au début.",
            "variante": "Différenciation : niveaux de difficulté affichés à chaque station."
        })
    for j, v in enumerate(var_take):
        edu.append({
            "nom": f"Variante {j + 1} — défi progressif",
            "duree_min": 8,
            "description": str(v),
            "consignes": "Introduire après maîtrise du geste de base. Encourager les essais.",
            "variante": "Inverser les rôles, augmenter le rythme, ajouter une contrainte."
        })
    if not edu:
        edu.append({
            "nom": "Pratique guidée",
            "duree_min": 15,
            "description": "Reprise des habiletés du cours précédent avec une nouvelle contrainte ajoutée.",
            "consignes": "Démonstration brève, pratique en binômes, rétroaction de l'enseignant·e.",
            "variante": "Augmenter ou réduire la complexité selon la classe."
        })
    return edu

def build_activite_principale(i, N, sae):
    titre = sae.get("titre", "")
    if i == 1:
        return f"Mini-jeu d'introduction : {titre}. Règles simplifiées au maximum, accent sur le plaisir et la découverte. Toutes et tous participent dès la première minute."
    if i == N:
        return f"Présentation finale en équipe ou individuelle. Chaque groupe démontre sa progression devant les autres. Applaudissements et rétroaction positive."
    if i == N - 1:
        tc = sae.get("tache_complexe", "")
        return f"Tâche complexe : {tc[:400]}" if tc else f"Application réelle de la SAÉ {titre} en contexte authentique. Équipes équilibrées, arbitrage partagé, focus sur la coopération."
    return f"Mise en situation de jeu avec contraintes progressives. Petits matchs de 3-5 min, rotation des équipes, intégration des nouvelles règles apprises."

def build_cours(i, N, sae, deroulement, parts_chunks, theme):
    duree = parse_duree(sae.get("duree_par_periode"), 45)
    materiel = sae.get("materiel", []) if isinstance(sae.get("materiel"), list) else []
    moyen = sae.get("moyen_action") or sae.get("moyen") or ""
    intentions = sae.get("intentions_pedagogiques") or sae.get("intentions") or ""
    variantes = sae.get("variantes", []) if isinstance(sae.get("variantes"), list) else []

    cours = {
        "numero": i,
        "titre": phase_title(i, N, theme),
        "duree_min": duree,
        "objectif": phase_objectif(i, N, intentions),
        "echauffement": (deroulement.get("mise_en_train") if (i == 1 and deroulement.get("mise_en_train")) else echauf_for_moyen(moyen)),
        "educatifs": build_educatifs(i, N, variantes, parts_chunks[i - 1] if i - 1 < len(parts_chunks) else ""),
        "activite_principale": build_activite_principale(i, N, sae),
        "retour_au_calme": deroulement.get("retour_au_calme") if (i == N and deroulement.get("retour_au_calme")) else RETOUR_CALME_TEMPLATES[(i - 1) % len(RETOUR_CALME_TEMPLATES)],
        "materiel_specifique": materiel[: max(3, min(len(materiel), 6))] if materiel else [],
        "consignes_securite": sae.get("consignes_securite") or " ".join(CONSIGNES_SECURITE_DEFAULT),
    }
    return cours

def enrich_sae(sae):
    if not isinstance(sae, dict): return sae
    if isinstance(sae.get("cours"), list) and len(sae["cours"]) >= 3:
        return sae  # déjà enrichi

    n_orig = sae.get("duree_periodes") or sae.get("nombre_periodes") or 5
    try: n_orig = int(n_orig)
    except: n_orig = 5
    N = clamp(n_orig, 3, 10)

    deroulement = sae.get("deroulement") or {}
    if not isinstance(deroulement, dict): deroulement = {}
    parts_concat = " ".join(
        v for k, v in deroulement.items()
        if k.startswith("partie_principale") and isinstance(v, str)
    )
    parts_chunks = split_text_into_chunks(parts_concat, max(1, N - 2))
    parts_chunks = [""] + parts_chunks + [""]  # padding cours 1 et cours N

    titre = sae.get("titre", "")
    theme = re.sub(r"^[^—:]*[—:]\s*", "", titre).strip() or titre.split(" ")[0] if titre else "l'activité"

    cours = [build_cours(i, N, sae, deroulement, parts_chunks, theme) for i in range(1, N + 1)]
    sae["cours"] = cours
    sae["nombre_periodes"] = N
    return sae

def process_file(path, write=True):
    d = json.load(open(path, encoding="utf-8"))
    arr_holder = None
    if isinstance(d, list):
        arr = d; arr_holder = ("list", d)
    elif isinstance(d, dict) and isinstance(d.get("sae"), list):
        arr = d["sae"]; arr_holder = ("dict", d)
    elif isinstance(d, dict) and isinstance(d.get("saes"), list):
        arr = d["saes"]; arr_holder = ("dict_saes", d)
    elif isinstance(d, dict) and isinstance(d.get("activites"), list):
        arr = d["activites"]; arr_holder = ("dict_act", d)
    else:
        return 0
    n = 0
    for s in arr:
        before = isinstance(s, dict) and isinstance(s.get("cours"), list) and len(s["cours"]) >= 3
        enrich_sae(s)
        after = isinstance(s.get("cours"), list) and len(s["cours"]) >= 3
        if (not before) and after: n += 1
    if write:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(d, f, ensure_ascii=False, indent=2)
    return n

# ─── CLI ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    args = sys.argv[1:]
    pilot = "--pilot" in args
    files = sorted(glob.glob(str(ROOT / "*.json")))
    if pilot:
        # Pilote : 1 SAÉ par fichier majeur
        target_files = [f for f in files if "primaire" in f or "secondaire" in f or "cooperation" in f or "manipulation" in f or "prescolaire" in f][:5]
        # Ne traiter que la première SAÉ de chaque
        for fp in target_files:
            d = json.load(open(fp, encoding="utf-8"))
            arr = d if isinstance(d, list) else d.get("sae", []) if isinstance(d, dict) else []
            if arr and isinstance(arr[0], dict):
                enrich_sae(arr[0])
                with open(fp, "w", encoding="utf-8") as f:
                    json.dump(d, f, ensure_ascii=False, indent=2)
                print(f"PILOT ✓ {os.path.basename(fp)} — SAÉ #0 enrichie ({len(arr[0]['cours'])} cours)")
    else:
        total = 0
        for fp in files:
            n = process_file(fp)
            print(f"  {os.path.basename(fp)} : +{n} SAÉ enrichies")
            total += n
        print(f"\nTOTAL : {total} SAÉ bonifiées")
