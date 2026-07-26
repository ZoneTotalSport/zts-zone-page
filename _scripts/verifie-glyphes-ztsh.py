#!/usr/bin/env python3
"""
verifie-glyphes-ztsh.py — garde-fou de la police de marque.

POURQUOI
    /fonts/ZoneTotalSport.ttf contient 145 glyphes, dont la quasi-totalite
    des accents francais. Deux familles lui manquent quand meme.

    LETTRES ACCENTUEES — les sept identifiees au prescan :

        Ù  Ÿ  Æ  Œ  ÿ  æ  œ

    Le navigateur bascule de police PAR CARACTERE. Un titre contenant « OU »
    avec accent grave, ou « CŒUR », se retrouve donc a cheval sur deux
    polices en plein milieu d'un mot — ZoneTotalSport pour les lettres
    couvertes, Luckiest Guy pour les autres. C'est tres visible.

    « OU » (accent grave) et « CŒUR » sont les deux cas les plus probables
    dans les titres de Zone Total Sport.

    PONCTUATION TYPOGRAPHIQUE — trouvee en elargissant le releve, et au
    moins aussi probable en pratique :

        ’   apostrophe typographique  (U+2019)  → « L’ECOLE »
        «   »  guillemets francais              → citations en titre
        —   tiret cadratin            (U+2014)  → incises
        °   degre                                → « 18°C »

    L'apostrophe DROITE ' (U+0027) est couverte, elle. C'est la courbe qui
    ne l'est pas — et c'est celle que produisent la plupart des editeurs de
    texte par correction automatique. Cas le plus insidieux du lot.

REGLE DE REDACTION — dans tout texte de .ztsh-titre
    apostrophe   toujours la DROITE   '    jamais la courbe ’
    guillemets   toujours les DROITS  "    jamais les francais
    tiret        toujours le SIMPLE   -    jamais le cadratin
    degre        ecrire le mot << degres >>
    ligatures    OE et AE en deux lettres

    Ce n'est pas une preference typographique, c'est une contrainte de la
    police. Un titre qui melange deux polices en plein mot se voit
    immediatement.

CE QUE FAIT LE SCRIPT
    Scanne les fichiers HTML a la recherche d'elements portant la classe
    .ztsh-titre (le seul endroit ou ZoneTotalSport est employee).

    BLOQUANT (sortie 1)      la ponctuation ’ « » — °
                             Elle est partout et la correction automatique la
                             produit sans qu'on la voie.
    AVERTISSEMENT (sortie 0) les sept lettres rares, plus < > | ~
                             On vit avec en attendant les glyphes.

USAGE
    python3 _scripts/verifie-glyphes-ztsh.py            # scanne tout le depot
    python3 _scripts/verifie-glyphes-ztsh.py apps/tni   # scanne un dossier

    Utilisable tel quel comme etape de build ou hook pre-commit.

NOTE
    Faire dessiner les douze glyphes manquants est le vrai correctif, et il
    est bon marche. Chantier separe — voir TICKET-GLYPHES-ZTS.md. Une fois
    fait, le bloc BLOQUANTS/AVERTIS ci-dessous se vide, et le script le
    signale tout seul en relisant le TTF.
"""

import os
import re
import sys

# Releves avec fontTools sur /fonts/ZoneTotalSport.ttf le 25 juillet 2026.
# Restreint a ce qui peut raisonnablement apparaitre dans un titre FR-QC.
# Les manquants hors francais (Á Ã Å Ì Í Ñ Ò Ó Õ Ú Ý…) ne sont pas listes.
#
# DEUX NIVEAUX DE SEVERITE
#   BLOQUANT      la ponctuation typographique. Elle est partout, et la
#                 correction automatique la produit sans qu'on la voie.
#                 Sortie 1 : la construction s'arrete.
#   AVERTISSEMENT les sept lettres rares. On peut vivre avec en attendant
#                 que les glyphes soient dessines. Sortie 0.
BLOQUANTS = set("’«»—°")
AVERTIS   = set("ÙŸÆŒÿæœ") | set("<>|~")
MANQUANTS = BLOQUANTS | AVERTIS

# Suggestions de remplacement, affichees dans le rapport.
REMPLACEMENTS = {
    "’": "apostrophe droite '",
    "«": 'guillemets droits "',
    "»": 'guillemets droits "',
    "—": "tiret demi-cadratin - ou deux points",
    "°": "le mot « degres »",
    "Œ": "OE en deux lettres",
    "œ": "oe en deux lettres",
    "Æ": "AE en deux lettres",
    "æ": "ae en deux lettres",
    "Ù": "reformuler (« OU » en majuscules accentuees)",
    "Ÿ": "reformuler",
    "ÿ": "reformuler",
}

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IGNORES = {"node_modules", ".git", "_archive", "dist", "build"}

# Capture le contenu textuel d'un element portant la classe ztsh-titre.
MOTIF = re.compile(
    r'<([a-zA-Z][\w-]*)[^>]*\bclass\s*=\s*["\'][^"\']*\bztsh-titre\b[^"\']*["\'][^>]*>(.*?)</\1>',
    re.S,
)
BALISES = re.compile(r"<[^>]+>")


def depuis_police(chemin_ttf):
    """Recalcule les manquants en lisant le TTF. Necessite fontTools.

    Ne teste que le jeu utile au francais quebecois : un titre ZTS
    n'ecrira pas en espagnol ou en portugais.
    """
    try:
        from fontTools.ttLib import TTFont
    except ImportError:
        return None
    couverts = set(TTFont(chemin_ttf).getBestCmap().keys())
    candidats = "ÀÂÄÆÇÈÉÊËÎÏÔÖÙÛÜŸŒàâäæçèéêëîïôöùûüÿœ<>|~«»–—’…°"
    return {c for c in candidats if ord(c) not in couverts}


def scanne(cible):
    signalements = []
    if os.path.isfile(cible):
        marche = [(os.path.dirname(cible) or ".", [], [os.path.basename(cible)])]
    else:
        marche = os.walk(cible)
    for dossier, sous, fichiers in marche:
        sous[:] = [d for d in sous if d not in IGNORES]
        for f in fichiers:
            if not f.endswith((".html", ".htm")):
                continue
            chemin = os.path.join(dossier, f)
            try:
                with open(chemin, encoding="utf-8", errors="replace") as fh:
                    contenu = fh.read()
            except OSError:
                continue
            if "ztsh-titre" not in contenu:
                continue
            for m in MOTIF.finditer(contenu):
                texte = BALISES.sub("", m.group(2))
                bloq = sorted({c for c in texte if c in BLOQUANTS})
                aver = sorted({c for c in texte if c in AVERTIS})
                if bloq or aver:
                    ligne = contenu[: m.start()].count("\n") + 1
                    signalements.append(
                        (
                            os.path.relpath(chemin, RACINE),
                            ligne,
                            bloq,
                            aver,
                            texte.strip()[:70],
                        )
                    )
    return signalements


def main():
    cibles = sys.argv[1:] or [RACINE]
    ttf = os.path.join(RACINE, "fonts", "ZoneTotalSport.ttf")
    if os.path.exists(ttf):
        recalcul = depuis_police(ttf)
        if recalcul is not None and recalcul != MANQUANTS:
            print("Note : la couverture du TTF a change depuis le dernier releve.")
            print("       Manquants reels :", "".join(sorted(recalcul)))
            print("       Mets a jour MANQUANTS dans ce script.\n")

    tous = []
    for c in cibles:
        tous += scanne(c if os.path.isabs(c) else os.path.join(RACINE, c))

    if not tous:
        print("OK — aucun caractere non couvert dans un .ztsh-titre.")
        return 0

    bloquants = [s for s in tous if s[2]]
    avertis   = [s for s in tous if s[3] and not s[2]]

    if bloquants:
        print(f"BLOQUANT — {len(bloquants)} titre(s) avec ponctuation non couverte :\n")
        for chemin, ligne, bloq, aver, extrait in bloquants:
            print(f"  {chemin}:{ligne}")
            print(f"      titre : {extrait}")
            for ch in bloq + aver:
                print(f"      {ch} → {REMPLACEMENTS.get(ch, 'reformuler')}")
            print()

    if avertis:
        print(f"Avertissement — {len(avertis)} titre(s) avec une lettre rare :\n")
        for chemin, ligne, bloq, aver, extrait in avertis:
            print(f"  {chemin}:{ligne}  {' '.join(aver)}  |  {extrait}")
        print()

    print("Le navigateur bascule de police PAR CARACTERE : le mot se retrouve")
    print("a cheval sur deux polices. Reformule, ou passe le titre en Luckiest")
    print("Guy avec .ztsh-titre--punch.")
    if bloquants:
        print()
        print("REGLE DE REDACTION — dans un .ztsh-titre :")
        print("  apostrophe   toujours la DROITE  '   jamais la courbe")
        print("  guillemets   toujours les DROITS \"   jamais les francais")
        print("  tiret        toujours le SIMPLE  -   jamais le cadratin")
        print("  degre        ecrire le mot << degres >>")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
