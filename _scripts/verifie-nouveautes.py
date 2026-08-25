#!/usr/bin/env python3
"""
verifie-nouveautes.py — coherence de shared/nouveautes.json.

    python3 _scripts/verifie-nouveautes.py

Code de sortie 1 si un controle bloquant echoue.

POURQUOI CE SCRIPT EXISTE
    La section « Quoi de neuf » de l'accueil ne lit qu'un fichier tenu a la
    MAIN. Rien, dans le site, ne casse quand ce fichier derive : une date
    fausse, une URL morte ou un article absent du blogue s'affichent aussi
    bien qu'une entree juste. C'est exactement le genre de panne muette que
    le depot garde en CI (voir .github/workflows/verifie-habillage.yml).

CONTROLES

 1  FORME DU FICHIER (bloquant)
    JSON valide, une liste « nouveautes », et sur chaque entree : titre.fr,
    type dans {app, article}, date AAAA-MM-JJ reelle et pas dans le futur,
    url absolue depuis la racine. Une URL en double est refusee aussi : deux
    fois la meme page occuperait deux des trois cartes.

 2  LA PAGE EXISTE (bloquant)
    /apps/X/ -> apps/X/index.html, /articles/x.html -> articles/x.html.
    Une carte qui envoie sur un 404 est pire que pas de carte.

 3  ARTICLE : ACCORD AVEC LE BLOGUE (bloquant sur la date)
    blog.html porte le tableau POSTS, qui est la source des dates d'articles.
    Un article annonce ici doit y figurer, a la MEME date. Sans ce controle,
    l'accueil et le blogue finissent par annoncer deux jours differents pour
    le meme texte. Le titre francais est compare aussi, mais en simple
    AVERTISSEMENT : une reformulation volontaire ne doit pas rougir la CI.

 4  APP : ELLE DOIT ETRE LISTEE QUELQUE PART (bloquant)
    Regle prise le 25 aout 2026. Une app n'entre dans « Quoi de neuf » que si
    shared/zts-menu.js ou un des trois hubs metier la porte deja. Deux apps
    en ligne ne sont volontairement pas dans la liste pour cette raison —
    /apps/decodage/ et /apps/studio-jeu/ — et ce controle est ce qui empeche
    qu'elles y rentrent par distraction.

 5  ORDRE DU FICHIER (avertissement)
    L'accueil trie par date decroissante, et a date egale garde l'ordre du
    fichier. Un fichier deja trie se lit donc comme ce que le site montre.
"""

import json
import os
import re
import sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FICHIER = os.path.join(RACINE, 'shared', 'nouveautes.json')
BLOG = os.path.join(RACINE, 'blog.html')
VITRINES = ['shared/zts-menu.js', 'ep.html', 'service-de-garde.html', 'camps-de-jour.html']

erreurs, avertissements = [], []


def bloque(msg):
    erreurs.append(msg)


def signale(msg):
    avertissements.append(msg)


def jours_dans_le_mois(a, m):
    if m in (1, 3, 5, 7, 8, 10, 12):
        return 31
    if m in (4, 6, 9, 11):
        return 30
    return 29 if (a % 4 == 0 and (a % 100 != 0 or a % 400 == 0)) else 28


def date_valide(s):
    if not re.match(r'^\d{4}-\d{2}-\d{2}$', s or ''):
        return False
    a, m, j = (int(x) for x in s.split('-'))
    return 1 <= m <= 12 and 1 <= j <= jours_dans_le_mois(a, m)


def posts_du_blogue():
    """URL d'article -> (date, titre francais), lu dans le tableau POSTS."""
    posts = {}
    with open(BLOG, encoding='utf-8') as f:
        for ligne in f:
            if 'url:"articles/' not in ligne:
                continue
            url = re.search(r'url:"(articles/[^"]+)"', ligne)
            date = re.search(r'\bd:"(\d{4}-\d{2}-\d{2})"', ligne)
            titre = re.search(r'title:\{fr:"((?:[^"\\]|\\.)*)"', ligne)
            if url and date:
                titre_fr = titre.group(1).replace('\\"', '"') if titre else None
                posts['/' + url.group(1)] = (date.group(1), titre_fr)
    return posts


def vitrines_texte():
    tout = ''
    for chemin in VITRINES:
        p = os.path.join(RACINE, chemin)
        if os.path.exists(p):
            with open(p, encoding='utf-8') as f:
                tout += f.read()
        else:
            signale("vitrine introuvable, non lue : %s" % chemin)
    return tout


def chemin_sur_disque(url):
    """URL du site -> chemin de fichier attendu, ou None si la forme est inconnue."""
    if url.endswith('/'):
        return os.path.join(RACINE, url.strip('/'), 'index.html')
    if url.endswith('.html'):
        return os.path.join(RACINE, url.lstrip('/'))
    return None


def main():
    if not os.path.exists(FICHIER):
        print('REFUSE — shared/nouveautes.json est introuvable.')
        return 1

    try:
        with open(FICHIER, encoding='utf-8') as f:
            data = json.load(f)
    except ValueError as e:
        print('REFUSE — shared/nouveautes.json n\'est pas du JSON valide : %s' % e)
        return 1

    liste = data.get('nouveautes')
    if not isinstance(liste, list) or not liste:
        print('REFUSE — la cle « nouveautes » manque ou est vide.')
        return 1

    posts = posts_du_blogue()
    vitrines = vitrines_texte()
    vues = {}

    # AUJOURD'HUI vient de la date systeme du runner, en UTC : une entree datee
    # de demain est refusee, une entree datee d'aujourd'hui passe partout.
    import datetime
    aujourdhui = datetime.datetime.utcnow().strftime('%Y-%m-%d')

    for i, n in enumerate(liste, 1):
        ou = 'entree %d' % i
        if not isinstance(n, dict):
            bloque('%s : ce n\'est pas un objet.' % ou)
            continue

        titre = (n.get('titre') or {}).get('fr')
        if not titre:
            bloque('%s : titre.fr manquant.' % ou)
        else:
            ou = 'entree %d (« %s »)' % (i, titre)
        if not (n.get('titre') or {}).get('en'):
            signale('%s : pas de titre anglais, l\'accueil retombera sur le francais.' % ou)

        type_ = n.get('type')
        if type_ not in ('app', 'article'):
            bloque('%s : type « %s » inconnu, attendu « app » ou « article ».' % (ou, type_))

        date = n.get('date') or ''
        if not date_valide(date):
            bloque('%s : date « %s » invalide, attendu AAAA-MM-JJ.' % (ou, date))
        elif date > aujourdhui:
            bloque('%s : date %s dans le futur — ce n\'est pas une mise en ligne.' % (ou, date))

        url = n.get('url') or ''
        if not url.startswith('/'):
            bloque('%s : url « %s » doit partir de la racine du site (/apps/... ou /articles/...).' % (ou, url))
            continue
        if url in vues:
            bloque('%s : url deja annoncee a l\'entree %d — %s' % (ou, vues[url], url))
        vues[url] = i

        # 2 — la page existe
        cible = chemin_sur_disque(url)
        if cible is None:
            bloque('%s : forme d\'url inconnue — %s' % (ou, url))
        elif not os.path.exists(cible):
            bloque('%s : la page n\'existe pas dans le depot — %s' % (ou, url))

        # 3 — article : accord avec blog.html
        if type_ == 'article':
            if url not in posts:
                bloque('%s : absent du tableau POSTS de blog.html — %s' % (ou, url))
            else:
                date_blog, titre_blog = posts[url]
                if date_blog != date:
                    bloque('%s : date %s ici, %s dans blog.html. Les deux pages '
                           'annonceraient deux jours differents.' % (ou, date, date_blog))
                if titre_blog and titre and titre_blog != titre:
                    signale('%s : titre different de blog.html — la, c\'est « %s ».' % (ou, titre_blog))

        # 4 — app : listee quelque part
        if type_ == 'app':
            nom = url.strip('/').split('/')[-1]
            if ('apps/' + nom) not in vitrines and ("app: '" + nom + "'") not in vitrines:
                bloque('%s : /apps/%s/ n\'est listee ni dans shared/zts-menu.js ni dans un hub. '
                       'Regle du 25 aout 2026 : on n\'envoie pas vers une app qu\'aucun menu '
                       'n\'assume. Ajoute-la au menu, ou retire-la d\'ici.' % (ou, nom))

    # 5 — ordre du fichier
    dates = [n.get('date') for n in liste if isinstance(n, dict) and n.get('date')]
    if dates != sorted(dates, reverse=True):
        signale('le fichier n\'est pas trie du plus recent au plus ancien. L\'accueil trie '
                'quand meme, mais le fichier ne se lit plus comme ce que le site montre.')

    for a in avertissements:
        print('AVERTISSEMENT — %s' % a)
    for e in erreurs:
        print('REFUSE — %s' % e)

    if erreurs:
        print('\n%d controle(s) bloquant(s) en echec sur %d entree(s).' % (len(erreurs), len(liste)))
        return 1

    print('OK — %d mise(s) en ligne, %d avertissement(s). Les 3 plus recentes : %s'
          % (len(liste), len(avertissements),
             ', '.join('%s (%s, %s)' % ((n.get('titre') or {}).get('fr'), n.get('type'), n.get('date'))
                       for n in sorted([x for x in liste if isinstance(x, dict)],
                                       key=lambda x: x.get('date') or '', reverse=True)[:3])))
    return 0


if __name__ == '__main__':
    sys.exit(main())
