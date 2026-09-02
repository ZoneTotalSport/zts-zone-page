#!/usr/bin/env python3
"""
verifie-grille-mobile.py — une grille tient-elle dans 390 px ?

    python3 _scripts/verifie-grille-mobile.py                 # toutes les apps
    python3 _scripts/verifie-grille-mobile.py apps/jeux       # une seule

Code de sortie 1 si un controle bloquant echoue.

POURQUOI CE SCRIPT EXISTE

    Le 2 septembre 2026, apps/jeux est parti en production avec
    `grid-template-columns: repeat(2, 1fr)` comme regle de base. Sur un
    iPhone de 390 px, cela donne deux colonnes de 159 px — et les cartes se
    sont CHEVAUCHEES, avec debordement horizontal du body.

    Deux choses se combinaient :

    1. Deux colonnes a 390 px, c'est trop etroit pour la carte.
    2. `1fr` vaut `minmax(auto, 1fr)`. Une piste ainsi definie ne descend
       JAMAIS sous la largeur min-content de son contenu : quand le titre est
       plus large que la piste, la piste s'elargit et la grille deborde de
       son conteneur au lieu de faire retrecir le texte. `minmax(0, 1fr)`
       autorise le retrecissement.

    Aucun controle ne voyait ca. La QA tournait dans un faux DOM, qui n'a pas
    de mise en page, et l'emulateur de viewport du navigateur ne repondait
    pas. Or le calcul, lui, se fait sans rien emuler : c'est de
    l'arithmetique sur la feuille de style.

CE QUE LE SCRIPT CONTROLE, POUR CHAQUE PALIER <= 390 px

    a) somme des colonnes + gaps + paddings <= 390 px ;
    b) aucune piste en `1fr` nu — `minmax(0, 1fr)` exige.

CE QU'IL NE CONTROLE PAS

    Le rendu reel. Il dit qu'une grille NE PEUT PAS deborder par construction ;
    il ne dit pas qu'elle est belle. La capture de Joey reste la derniere ligne.

POURQUOI IL N'EST PAS AU HOOK

    Passe sur les 49 apps, il signale 21 grilles — mais l'essentiel sont des
    CALENDRIERS : `.p-cal-grid` a 7 colonnes, ce sont les 7 jours de la
    semaine, et `.calendar-grid` a 10 colonnes est une trame de mois. Une
    cellule de calendrier n'a pas a faire 240 px ; la regle « minimum lisible »
    ne vaut que pour une grille de CARTES.

    Le brancher au hook bloquerait donc du travail parfaitement legitime sur
    quatre autres apps. Il se lance a la main, sur le pilier qu'on livre, au
    moment de remplir GRILLE-SORTIE-APP.md :

        python3 _scripts/verifie-grille-mobile.py apps/jeux

    Les 21 signalements sur les autres apps restent une information utile —
    a regarder quand chacune passera sa grille de sortie, pas avant.
"""

import os
import re
import sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LARGEUR_CIBLE = 390          # iPhone portrait, le plus etroit du parc
CARTE_MIN_LISIBLE = 240      # sous cette largeur, une carte de jeu se casse

# `@media(max-width:NNNpx)` ... ou pas de media du tout (= palier de base)
RE_MEDIA = re.compile(r'@media\s*\(\s*(max|min)-width\s*:\s*(\d+)px\s*\)')
RE_GRID = re.compile(r'grid-template-columns\s*:\s*([^;}]+)')
RE_REPEAT = re.compile(r'repeat\(\s*(\d+)\s*,\s*(.+?)\s*\)\s*(?:!important)?\s*$')
RE_BLOC = re.compile(r'([.#][\w-]+)\s*\{([^{}]*)\}')
RE_PX = re.compile(r'(\d+(?:\.\d+)?)px')


def px(decl, propriete, defaut=0.0):
    """Premiere longueur en px d'une declaration `propriete: ...`."""
    m = re.search(propriete + r'\s*:\s*([^;}]+)', decl)
    if not m:
        return defaut
    v = RE_PX.search(m.group(1))
    return float(v.group(1)) if v else defaut


def blocs_grille(css):
    """(selecteur, declaration, media) pour chaque regle de grille qui
    s'applique reellement a 390 px.

    Le contexte @media est suivi par PROFONDEUR D'ACCOLADES, pas devine en
    comptant les « @media » qui precedent : la premiere version le devinait,
    ratait `.game-grid` et signalait a tort une colonne unique. Un controle
    qui se trompe est pire qu'un controle absent.
    """
    out = []
    pile = []          # media ouverts : (sens, valeur, profondeur)
    prof = 0
    i = 0
    n = len(css)
    while i < n:
        m_at = css.find('@media', i)
        m_rule = RE_BLOC.search(css, i)

        # Prochaine accolade fermante, pour depiler
        j = css.find('}', i)

        candidats = [x for x in (m_at, j, m_rule.start() if m_rule else -1) if x != -1]
        if not candidats:
            break
        nxt = min(candidats)

        if nxt == m_at:
            mm = RE_MEDIA.search(css, m_at)
            ouvre = css.find('{', m_at)
            if mm and ouvre != -1 and mm.start() < ouvre:
                prof += 1
                pile.append((mm.group(1), int(mm.group(2)), prof))
            i = (ouvre + 1) if ouvre != -1 else m_at + 6
            continue

        if m_rule and nxt == m_rule.start():
            sel, decl = m_rule.group(1), m_rule.group(2)
            if 'grid-template-columns' in decl:
                # Ce media s'applique-t-il a 390px ?
                applique = True
                for sens, val, _ in pile:
                    if sens == 'min' and val > LARGEUR_CIBLE: applique = False
                    if sens == 'max' and val < LARGEUR_CIBLE: applique = False
                if applique:
                    out.append((sel, decl, tuple(pile)))
            i = m_rule.end()
            continue

        # accolade fermante : on depile si elle ferme un @media
        prof_avant = prof
        if pile and pile[-1][2] == prof:
            pile.pop(); prof -= 1
        i = j + 1
    return out


def controle(app):
    chemin = os.path.join(RACINE, app, 'index.html')
    if not os.path.exists(chemin):
        return [], []
    with open(chemin, encoding='utf-8', errors='ignore') as f:
        css = f.read()

    # LA CASCADE : pour un meme selecteur, c'est la DERNIERE regle applicable
    # qui gagne. Sans ca, une regle de base surchargee par un
    # `@media(max-width:639px)` plus bas serait comptee comme si elle
    # s'appliquait encore — et le controle refuserait un fichier deja correct.
    dernier = {}
    for sel, decl, media in blocs_grille(css):
        dernier[sel] = (sel, decl, media)

    bloq, aver = [], []
    for sel, decl, media in dernier.values():
        g = RE_GRID.search(decl).group(1).strip()
        gap = px(decl, r'(?<!row-)gap', 0.0)
        pad = px(decl, r'padding', 0.0)

        r = RE_REPEAT.search(g)
        if r:
            n = int(r.group(1))
            piste = r.group(2).strip()
        elif g.strip() in ('1fr', 'minmax(0,1fr)', 'minmax(0, 1fr)'):
            n, piste = 1, g.strip()
        else:
            continue

        # b) piste non retrecissable — seulement si PLUSIEURS colonnes.
        #    Avec une seule piste il n'y a rien a cote pour deborder.
        if n > 1 and re.fullmatch(r'1fr', piste):
            bloq.append(f"{sel} : `repeat({n}, 1fr)` — piste NON retrecissable. "
                        f"`1fr` = `minmax(auto,1fr)` : la piste ne descend jamais sous "
                        f"la largeur min-content, donc la grille deborde au lieu "
                        f"d'enrouler. Ecrire `minmax(0,1fr)`.")

        # a) arithmetique de largeur
        dispo = LARGEUR_CIBLE - 2 * pad - (n - 1) * gap
        parcarte = dispo / n if n else dispo
        if dispo < 0:
            bloq.append(f"{sel} : {n} colonnes + {gap}px de gap + {pad}px de padding "
                        f"depassent {LARGEUR_CIBLE}px a eux seuls.")
        elif n > 1 and parcarte < CARTE_MIN_LISIBLE:
            bloq.append(f"{sel} : {n} colonnes a {LARGEUR_CIBLE}px donnent "
                        f"{parcarte:.0f}px par carte (minimum lisible "
                        f"{CARTE_MIN_LISIBLE}px). Passer a UNE colonne sous 640px.")
        else:
            aver.append(f"{sel} : {n} colonne(s), {parcarte:.0f}px par carte — OK")
    return bloq, aver


def main():
    cibles = sys.argv[1:]
    if not cibles:
        base = os.path.join(RACINE, 'apps')
        cibles = ['apps/' + d for d in sorted(os.listdir(base))
                  if os.path.isdir(os.path.join(base, d)) and not d.startswith('_')]

    total_bloq = 0
    for app in cibles:
        bloq, aver = controle(app)
        if not bloq and not aver:
            continue
        etat = 'ECHEC' if bloq else 'OK   '
        print(f"  {etat}  {app}")
        for b in bloq:
            print(f"          BLOQUANT  {b}")
        for a in aver:
            print(f"          {a}")
        total_bloq += len(bloq)

    print()
    if total_bloq:
        print(f"COMMIT REFUSE — {total_bloq} grille(s) qui deborderaient a {LARGEUR_CIBLE}px.")
        return 1
    print(f"OK — aucune grille ne deborde a {LARGEUR_CIBLE}px.")
    return 0


if __name__ == '__main__':
    sys.exit(main())
