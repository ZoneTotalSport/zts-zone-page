#!/usr/bin/env python3
"""
verifie-partage-articles.py — controle du partage social des articles.

    python3 _scripts/verifie-partage-articles.py            # les 25 articles
    python3 _scripts/verifie-partage-articles.py articles/color-run.html

Code de sortie 1 si un controle bloquant echoue.

POURQUOI CE SCRIPT EXISTE
    `verifie-habillage.py` ne scanne que `apps/`. Il ne regarde JAMAIS
    `articles/` : il reste vert meme si tout le partage social est casse.
    Le prescan du 24 aout 2026 l'a constate — d'ou ce fichier, ecrit AVANT
    les commits qu'il doit juger.

CONTROLES

 1  LES CINQ BALISES (bloquant)
    og:title, og:description, og:image, og:url, twitter:card. Sans elles,
    une carte partagee sur Facebook ou Messenger sort en lien nu.

 2  L'IMAGE EXISTE (bloquant)
    og:image est une URL absolue https://zonetotalsport.ca/... — on la
    ramene a un chemin sur disque et on verifie qu'un fichier repond. Une
    URL qui pointe dans le vide donne une carte sans image, en silence.
    Les URL externes (Unsplash) sont acceptees mais SIGNALEES : la carte
    d'apercu depend alors d'un serveur tiers.

 3  TAILLE DE L'IMAGE (avertissement)
    Minimum Facebook : 1200x630. En dessous, l'apercu bascule en petite
    vignette carree a gauche du titre au lieu de la grande carte.

 4  COHERENCE DES URL (bloquant)
    og:url == <link rel=canonical> == le nom du fichier. Un copier-coller
    d'un article a l'autre envoie les partages vers le mauvais texte —
    la panne la plus couteuse et la plus invisible du lot.

 5  UN BLOC DE PARTAGE, UN SEUL, ET QUI PARTAGE VRAIMENT (bloquant)
    On ne compte pas les blocs mais les LIENS SHARER — un bloc de partage
    en contient exactement un vers facebook.com/sharer. Zero : la page ne
    partage rien. Deux ou plus : les blocs concurrents sont revenus.

    Un titre « Partager : » sans aucun lien sharer sous la main est traite
    comme une erreur a part. C'est le piege trouve dans
    un-jeu-trois-versions.html le 24 aout 2026 : le bloc affichait les
    icones Facebook et Instagram de ZTS, mais elles pointaient vers les
    PROFILS du site. Le lecteur croyait partager l'article et atterrissait
    sur la page d'accueil de Facebook. Pire qu'un bloc absent : un bloc
    absent se voit.

 6  DIMENSIONS DECLAREES (avertissement)
    og:image:width / og:image:height. Sans elles, Facebook doit telecharger
    l'image avant de savoir la dessiner : au tout premier partage, la carte
    sort souvent sans image.
"""

import glob
import os
import re
import struct
import sys
import urllib.parse

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PREFIXE_SITE = 'https://zonetotalsport.ca/'
LARGEUR_MIN, HAUTEUR_MIN = 1200, 630


def dimensions(chemin):
    """Largeur/hauteur d'un PNG, JPEG ou WebP, lues dans l'en-tete du fichier.

    On lit les octets a la main plutot que d'exiger Pillow : le script doit
    tourner sur une machine nue et en CI sans rien installer.
    """
    try:
        with open(chemin, 'rb') as f:
            d = f.read(65536)
    except OSError:
        return None

    if d[:8] == b'\x89PNG\r\n\x1a\n':
        return struct.unpack('>II', d[16:24])

    if d[:2] == b'\xff\xd8':                      # JPEG : on marche les segments
        i = 2
        try:
            while i < len(d):
                if d[i] != 0xFF:
                    i += 1
                    continue
                marqueur = d[i + 1]
                if marqueur in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6,
                                0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                    h, w = struct.unpack('>HH', d[i + 5:i + 9])
                    return (w, h)
                i += 2 + struct.unpack('>H', d[i + 2:i + 4])[0]
        except (struct.error, IndexError):
            return None

    if d[:4] == b'RIFF' and d[8:12] == b'WEBP' and d[12:16] == b'VP8X':
        return (1 + int.from_bytes(d[24:27], 'little'),
                1 + int.from_bytes(d[27:30], 'little'))

    return None


def balise(html, nom):
    """Contenu d'un <meta property=...> ou <meta name=...>, attributs dans n'importe quel ordre."""
    for attr in ('property', 'name'):
        m = re.search(
            r'<meta[^>]+' + attr + r'=["\']' + re.escape(nom) + r'["\'][^>]+content=["\']([^"\']*)',
            html, re.I)
        if m:
            return m.group(1)
        m = re.search(
            r'<meta[^>]+content=["\']([^"\']*)["\'][^>]+' + attr + r'=["\']' + re.escape(nom) + r'["\']',
            html, re.I)
        if m:
            return m.group(1)
    return None


def controle(chemin):
    """Retourne (erreurs, avertissements) pour un article."""
    err, avert = [], []
    nom = os.path.basename(chemin)
    with open(chemin, encoding='utf-8', errors='replace') as f:
        html = f.read()

    # 1 — les cinq balises
    valeurs = {}
    for cle in ('og:title', 'og:description', 'og:image', 'og:url', 'twitter:card'):
        valeurs[cle] = balise(html, cle)
        if not valeurs[cle]:
            err.append('BALISE : %s absente.' % cle)

    if valeurs.get('twitter:card') and valeurs['twitter:card'] != 'summary_large_image':
        avert.append('CARTE : twitter:card vaut "%s" — attendu summary_large_image.'
                     % valeurs['twitter:card'])

    # 2 + 3 + 6 — l'image
    img = valeurs.get('og:image')
    if img:
        if img.startswith(PREFIXE_SITE):
            rel = urllib.parse.unquote(img[len(PREFIXE_SITE):])
            disque = os.path.join(RACINE, rel)
            if not os.path.exists(disque):
                err.append('IMAGE : og:image ne repond pas sur disque — %s' % rel)
            else:
                d = dimensions(disque)
                if d is None:
                    avert.append('IMAGE : format non lu (ni PNG, ni JPEG, ni WebP) — %s' % rel)
                elif d[0] < LARGEUR_MIN or d[1] < HAUTEUR_MIN:
                    avert.append('IMAGE : %dx%d, sous le minimum %dx%d de Facebook — %s'
                                 % (d[0], d[1], LARGEUR_MIN, HAUTEUR_MIN, rel))
        elif img.startswith('http'):
            avert.append('IMAGE : og:image est hebergee ailleurs — la carte d\'apercu '
                         'depend d\'un serveur tiers. %s' % img[:70])
        else:
            err.append('IMAGE : og:image doit etre une URL absolue — %s' % img[:70])

        if not balise(html, 'og:image:width') or not balise(html, 'og:image:height'):
            avert.append('IMAGE : og:image:width/height absentes — au premier partage, '
                         'Facebook sert souvent la carte sans image.')

    # 4 — coherence des URL
    ogu = valeurs.get('og:url')
    m = re.search(r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']*)', html, re.I)
    canonical = m.group(1) if m else None
    if not canonical:
        err.append('URL : <link rel="canonical"> absent.')
    if ogu and canonical and ogu != canonical:
        err.append('URL : og:url et canonical divergent — %s vs %s' % (ogu, canonical))
    if ogu and not ogu.endswith('/' + nom):
        err.append('URL : og:url ne designe pas ce fichier — %s (attendu .../%s)' % (ogu, nom))

    # 5 — un bloc de partage, un seul, et qui partage vraiment.
    # On compte les liens sharer, pas les blocs : un bloc en porte
    # exactement un, et les trois variantes historiques (cercles Tailwind,
    # pilules .share-btn, initiales .share-ic) le portent toutes.
    sharers = len(re.findall(r'facebook\.com/sharer', html))
    annonce = re.search(r'>\s*(?:Partager|Share)\s*:?\s*<', html) is not None
    if sharers == 0:
        if annonce:
            err.append('PARTAGE : un titre « Partager : » sans aucun lien sharer — '
                       'les icones pointent vers les profils de ZTS, pas vers un '
                       'partage. Le lecteur croit partager et ne partage rien.')
        else:
            err.append('PARTAGE : aucun lien de partage dans la page.')
    elif sharers > 1:
        err.append('PARTAGE : %d blocs concurrents — ils servent des reseaux '
                   'differents dans des styles differents.' % sharers)

    return err, avert


def main():
    cibles = sys.argv[1:] or sorted(glob.glob(os.path.join(RACINE, 'articles', '*.html')))
    total_err = total_avert = 0

    for chemin in cibles:
        if not os.path.isabs(chemin):
            chemin = os.path.join(RACINE, chemin)
        err, avert = controle(chemin)
        nom = os.path.basename(chemin)[:-5]
        etat = 'ECHEC ' if err else ('AVERTI' if avert else 'OK    ')
        print('  %s    %s' % (etat, nom))
        for e in err:
            print('              err.      %s' % e)
        for a in avert:
            print('              avert.    %s' % a)
        total_err += len(err)
        total_avert += len(avert)

    print('\n%d article(s) — %d bloquant(s), %d avertissement(s)'
          % (len(cibles), total_err, total_avert))
    return 1 if total_err else 0


if __name__ == '__main__':
    sys.exit(main())
