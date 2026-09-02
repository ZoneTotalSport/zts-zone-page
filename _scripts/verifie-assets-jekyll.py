#!/usr/bin/env python3
"""
verifie-assets-jekyll.py — aucun asset servi ne doit vivre sous un dossier `_*`.

    python3 _scripts/verifie-assets-jekyll.py

Code de sortie 1 si un controle bloquant echoue.

POURQUOI CE SCRIPT EXISTE

    Le 2 septembre 2026, la vague 1 du chantier SITE IMPECCABLE a deplace
    `campagne/` vers `_data/campagne/`. Le depot etait coherent, les liens
    internes tous valides, les trois controles au vert, la PR fusionnee.
    Et le site a casse en production.

    GitHub Pages fait tourner Jekyll par defaut. Jekyll a DEUX comportements
    qui n'existent nulle part dans le depot, et qu'aucun controle local ne
    voyait :

    1. Tout fichier ou dossier de premier niveau dont le nom commence par `_`
       est EXCLU du site publie. `_data/`, `_scripts/`, `_patches/`,
       `_campagne/` existent dans git et sont INVISIBLES en production. Un
       asset qui atterrit la-dedans rend 404 sans que rien, localement, ne
       l'indique.

    2. `_data/` est en plus un dossier RESERVE : Jekyll y lit chaque fichier
       comme une source de donnees et exige du YAML, du JSON ou du CSV
       valide. Y deposer du `.html` ou du `.md` fait ECHOUER LE BUILD. C'est
       ce qui est arrive : le build est tombe, Pages a continue de servir un
       vieux deploiement, et Joey a constate en prod des regressions qui
       n'existaient dans aucun fichier du depot.

    Le correctif du build a ete pris a la main (`_campagne/`). Ce script
    existe pour que le PROCHAIN deplacement ne repose pas sur le fait que
    quelqu'un se souvienne de la regle.

CE QUE LE SCRIPT CONTROLE

    Pour chaque page HTML publiee, chaque `href`/`src` local est resolu, et
    le chemin obtenu est refuse s'il tombe sous un dossier de premier niveau
    commencant par `_`. Les gabarits (`{{ }}`, `${ }`), les URL externes et
    les ancres sont ignores.

CE QU'IL NE CONTROLE PAS

    Les chemins construits en JavaScript par concatenation. Ils sont hors de
    portee d'une lecture statique — c'est la limite connue de ce controle.
"""

import os
import re
import sys
import urllib.parse

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Prefixes ignores : rien de tout cela n'est un chemin de fichier local.
EXTERNE = ('http://', 'https://', '//', 'mailto:', 'tel:', 'data:',
           'javascript:', 'about:', '#')

ATTRIBUT = re.compile(r'(?:href|src|srcset)\s*=\s*["\']([^"\'>]+)["\']')


def pages_publiees():
    """Les HTML que GitHub Pages sert, donc hors dossiers `_*` et `.git`."""
    for base, dossiers, fichiers in os.walk(RACINE):
        rel = os.path.relpath(base, RACINE)
        # `rel` vaut "." a la racine : ce n'est pas un dossier exclu, c'est le
        # point de depart. Le confondre avec un nom en `.` vidait le parcours
        # des le premier tour et le script annoncait « 0 page ».
        if rel != '.':
            premier = rel.split(os.sep)[0]
            if premier.startswith(('_', '.')):
                dossiers[:] = []
                continue
        dossiers[:] = [d for d in dossiers
                       if not d.startswith('.') and d != 'node_modules']
        for f in fichiers:
            if f.endswith('.html'):
                yield os.path.join(base, f)


def sous_dossier_underscore(chemin_rel):
    """Le chemin tombe-t-il sous un dossier de PREMIER NIVEAU en `_` ?"""
    premier = chemin_rel.replace(os.sep, '/').split('/')[0]
    return premier.startswith('_')


def main():
    fautes = []
    n_pages = 0

    for page in pages_publiees():
        n_pages += 1
        try:
            with open(page, encoding='utf-8', errors='ignore') as fh:
                texte = fh.read()
        except OSError:
            continue

        base = os.path.dirname(page)
        for brut in ATTRIBUT.findall(texte):
            # `srcset` porte « url 1x, url 2x » : on ne garde que la premiere
            # URL. Sur un `href`/`src` normal, split() rend la valeur entiere.
            morceaux = brut.split(',')[0].split()
            if not morceaux:
                continue
            url = morceaux[0].split('#')[0].split('?')[0].strip()
            if not url or url.startswith(EXTERNE):
                continue
            # Gabarits : le chemin n'est pas connu a la lecture.
            if '{{' in url or '${' in url or '{%' in url:
                continue

            url = urllib.parse.unquote(url)
            if url.startswith('/'):
                cible = url.lstrip('/')
            else:
                cible = os.path.relpath(
                    os.path.normpath(os.path.join(base, url)), RACINE)

            if sous_dossier_underscore(cible):
                fautes.append((os.path.relpath(page, RACINE), brut, cible))

    if fautes:
        print()
        print("COMMIT REFUSE — asset(s) sous un dossier `_*`.")
        print()
        print("Jekyll n'publie AUCUN dossier de premier niveau commencant par")
        print("`_`. Ces fichiers existent dans git et repondent 404 en")
        print("production. La panne serait invisible ici : liens coherents,")
        print("build possiblement vert, et le site casse quand meme.")
        print()
        for page, brut, cible in fautes:
            print(f"  {page}")
            print(f"      referme  {brut}")
            print(f"      resolu   {cible}")
        print()
        print("Deplace l'asset hors du dossier `_*` (par exemple sous")
        print("`assets/`), ou retire la reference.")
        return 1

    print(f"OK — {n_pages} page(s) publiee(s), aucun asset sous un dossier `_*`.")
    return 0


if __name__ == '__main__':
    sys.exit(main())
