#!/usr/bin/env python3
"""Corrections post-refonte :
   1. Décoder les entités HTML doubles-encodées dans les hero (L&amp;#x27; → L')
   2. Masquer le H1 dupliqué dans <main> (hero affiche déjà le titre)
"""
import re, os, glob, html

ARTICLES_DIR = os.path.dirname(os.path.abspath(__file__))

def fix(path):
    with open(path, encoding='utf-8') as f:
        c = f.read()
    orig = c

    # ===== 1. Fix entités doubles-encodées dans le bloc Hero XXL =====
    m = re.search(r'<!-- ZTS HERO XXL -->.*?<!-- /ZTS HERO XXL -->', c, re.DOTALL)
    if m:
        block = m.group(0)
        # Décode les entités numériques échappées (&amp;#x27; → ')
        # puis ré-encode proprement les caractères dangereux
        fixed = block
        # Décodage des séquences &amp;#... → caractère réel
        fixed = re.sub(r'&amp;#x([0-9a-fA-F]+);', lambda mm: chr(int(mm.group(1),16)), fixed)
        fixed = re.sub(r'&amp;#(\d+);',          lambda mm: chr(int(mm.group(1))),     fixed)
        fixed = fixed.replace('&amp;quot;', '"').replace('&amp;amp;', '&')
        # Ne touche pas aux & déjà bien échappés ailleurs
        c = c.replace(block, fixed)

    # ===== 2. Masquer le premier <h1> dans <main> (titre dupliqué) =====
    # Pattern : premier <h1 class="font-bangers..."> ... </h1> APRÈS le hero XXL
    main_match = re.search(r'(<!-- /ZTS HERO XXL -->.*?<main[^>]*>.*?)(<h1[^>]*class="[^"]*font-bangers[^"]*"[^>]*>.*?</h1>)',
                           c, re.DOTALL)
    if main_match:
        h1 = main_match.group(2)
        # Remplace par version masquée (hidden) pour ne pas casser le layout/SEO
        if 'data-zts-hidden' not in h1:
            new_h1 = h1.replace('<h1 ', '<h1 data-zts-hidden hidden ', 1)
            c = c.replace(h1, new_h1, 1)

    # ===== 3. Aussi masquer la "fiche auteur" répétée si juste après le H1 =====
    # (optionnel — laissons pour l'instant)

    if c != orig:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(c)
        return f"✓ {os.path.basename(path)}"
    return f"= {os.path.basename(path)} (rien à faire)"


if __name__ == '__main__':
    files = sorted([p for p in glob.glob(os.path.join(ARTICLES_DIR, '*.html'))
                    if not os.path.basename(p).startswith('_')])
    for p in files:
        print(fix(p))
