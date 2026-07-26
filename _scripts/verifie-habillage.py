#!/usr/bin/env python3
"""
verifie-habillage.py — controle de conformite d'une app migree.

A lancer sur CHAQUE app apres migration, et sur tout le depot avant un
deploiement. Code de sortie 1 si un controle bloquant echoue.

    python3 _scripts/verifie-habillage.py                 # toutes les apps migrees
    python3 _scripts/verifie-habillage.py apps/suppleance # une seule

CONTROLES

 1  ORDRE DE CHARGEMENT (bloquant)
    assets/ztsh-shell.css doit venir APRES shared/zts.css, zts-header.css et
    zts-ultra.css. Sinon les surcharges du shell perdent la cascade et
    l'habillage est partiellement inactif — sans aucune erreur visible.
    C'est le controle le plus important du lot : la panne est silencieuse.

 2  PAIRE CSS/JS (bloquant)
    Une app qui charge le JS sans le CSS pose body.ztsh-on sans rien pour
    l'habiller. L'inverse charge du CSS que rien n'active.

 3  APPEL DE MONTAGE (bloquant)
    ZTSShell.monter() doit etre appele, avec une densite connue.

 4  ENVELOPPE (avertissement)
    <div class="ztsh-page"> attendue. Absente, la marge du rail vertical
    n'est pas reservee — sans consequence en densite travail ou projection,
    ou la variable vaut 0.

 5  TAILLE DU DIFF (avertissement, si git dispo)
    Plus de 30 lignes ajoutees : le contrat demande de s'arreter et
    d'expliquer.
"""

import os
import re
import subprocess
import sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APPS = os.path.join(RACINE, "apps")
CSS_AVANT = ["shared/zts.css", "zts-header.css", "zts-ultra.css"]
DENSITES = ["vitrine", "travail", "projection"]


def controle(chemin):
    """Retourne (bloquants, avertissements) pour une app."""
    f = os.path.join(chemin, "index.html")
    if not os.path.exists(f):
        return None
    c = open(f, encoding="utf-8", errors="replace").read()
    if "ztsh-shell" not in c:
        return None  # app non migree, hors perimetre

    bloq, aver = [], []
    nom = os.path.basename(chemin)

    # 1 — ordre de chargement
    pos_shell = c.find("ztsh-shell.css")
    for autre in CSS_AVANT:
        p = c.find(autre)
        if p != -1 and p > pos_shell:
            bloq.append(
                f"ORDRE : {autre} est charge APRES ztsh-shell.css. "
                f"Les surcharges du shell perdent la cascade."
            )

    # 2 — paire CSS/JS
    a_css = "ztsh-shell.css" in c
    a_js = "ztsh-shell.js" in c
    if a_js and not a_css:
        bloq.append("PAIRE : le JS est charge sans le CSS.")
    if a_css and not a_js:
        bloq.append("PAIRE : le CSS est charge sans le JS — rien ne montera le shell.")

    # 3 — appel de montage
    m = re.search(r"ZTSShell\.monter\(\s*\{([^}]*)\}", c)
    if not m:
        bloq.append("MONTAGE : aucun appel a ZTSShell.monter().")
    else:
        d = re.search(r"densite\s*:\s*['\"](\w+)['\"]", m.group(1))
        if not d:
            bloq.append("MONTAGE : monter() sans densite explicite.")
        elif d.group(1) not in DENSITES:
            bloq.append(f"MONTAGE : densite inconnue « {d.group(1) } ».")

    # 4 — enveloppe
    if 'class="ztsh-page"' not in c:
        aver.append("ENVELOPPE : <div class=\"ztsh-page\"> absente.")

    # 5 — taille du diff
    try:
        out = subprocess.run(
            ["git", "diff", "--numstat", "main", "--", f"apps/{nom}/index.html"],
            cwd=RACINE, capture_output=True, text=True, timeout=10,
        ).stdout.strip()
        if out:
            ajouts, suppr = out.split()[0], out.split()[1]
            if ajouts.isdigit() and int(ajouts) > 30:
                aver.append(f"DIFF : {ajouts} lignes ajoutees, au-dela des 30 du contrat.")
            if suppr.isdigit() and int(suppr) > 0:
                bloq.append(f"DIFF : {suppr} ligne(s) SUPPRIMEE(S) dans le fichier d'app.")
    except Exception:
        pass

    return bloq, aver


def main():
    cibles = sys.argv[1:]
    if cibles:
        dossiers = [c if os.path.isabs(c) else os.path.join(RACINE, c) for c in cibles]
    else:
        dossiers = [
            os.path.join(APPS, d) for d in sorted(os.listdir(APPS))
            if os.path.isdir(os.path.join(APPS, d)) and not d.startswith("_")
        ]

    total_b, total_a, migrees = 0, 0, 0
    for d in dossiers:
        r = controle(d)
        if r is None:
            continue
        migrees += 1
        bloq, aver = r
        nom = os.path.basename(d)
        if not bloq and not aver:
            print(f"  OK        {nom}")
            continue
        print(f"  {'ECHEC' if bloq else 'AVERTI'}    {nom}")
        for b in bloq:
            print(f"              BLOQUANT  {b}")
        for a in aver:
            print(f"              avert.    {a}")
        total_b += len(bloq)
        total_a += len(aver)

    print()
    if not migrees:
        print("Aucune app migree trouvee.")
        return 0
    print(f"{migrees} app(s) migree(s) — {total_b} bloquant(s), {total_a} avertissement(s)")
    return 1 if total_b else 0


if __name__ == "__main__":
    sys.exit(main())
