#!/usr/bin/env python3
"""Refonte 'Hero Mode XXL' sur tous les articles du blog ZTS.
Remplace header/nav, hero-full et footer par les nouveaux blocs.
Le contenu de <main> reste intact."""
import re, os, glob, html

ARTICLES_DIR = os.path.dirname(os.path.abspath(__file__))

# ===== Métadonnées par slug (récupérées de blog.html) =====
META = {
  "50-jeunes-un-gymnase":         {"cat":"Gestion de classe","cycle":"Tous cycles","time":"25 min","date":"29 avr. 2026"},
  "syndrome-gymnase":             {"cat":"Gestion de classe","cycle":"Tous cycles","time":"6 min", "date":"10 mars 2026"},
  "sae-course":                   {"cat":"SAÉ",              "cycle":"Cycle 3",    "time":"12 min","date":"29 sept. 2024"},
  "avance-annee-scolaire":        {"cat":"Ressources",       "cycle":"Tous cycles","time":"9 min", "date":"10 juil. 2024"},
  "jeux-course-1er-cycle":        {"cat":"Jeux et activités","cycle":"Cycle 1",    "time":"13 min","date":"7 juin 2024"},
  "systeme-emulation-dollar":     {"cat":"Gestion de classe","cycle":"Tous cycles","time":"10 min","date":"7 avr. 2024"},
  "color-run":                    {"cat":"Jeux et activités","cycle":"Tous cycles","time":"16 min","date":"3 mars 2024"},
  "systeme-emulation-dollars-ecole":{"cat":"Gestion de classe","cycle":"Cycles 2-3","time":"17 min","date":"14 janv. 2024"},
  "eleves-cotes-eps":             {"cat":"Ressources",       "cycle":"Tous cycles","time":"45 min","date":"23 sept. 2023"},
  "rentree-scolaire":             {"cat":"Vie enseignante",  "cycle":"Tous cycles","time":"13 min","date":"19 août 2023"},
  "classes-difficiles-partie-3":  {"cat":"Gestion de classe","cycle":"Tous cycles","time":"37 min","date":"17 août 2023"},
  "classes-difficiles-partie-2":  {"cat":"Gestion de classe","cycle":"Tous cycles","time":"27 min","date":"11 juin 2023"},
  "classes-difficiles-partie-1":  {"cat":"Gestion de classe","cycle":"Tous cycles","time":"27 min","date":"29 mai 2023"},
  "suppleance-ecoles":            {"cat":"Vie enseignante",  "cycle":"Tous cycles","time":"23 min","date":"15 avr. 2023"},
  "foobaskill":                   {"cat":"Jeux et activités","cycle":"Cycles 2-3", "time":"9 min", "date":"14 avr. 2023"},
  "nawatobi":                     {"cat":"Jeux et activités","cycle":"Tous cycles","time":"8 min", "date":"7 avr. 2023"},
  "courbe-plaisir-jeu":           {"cat":"Jeux et activités","cycle":"Tous cycles","time":"13 min","date":"8 mars 2023"},
  "harcelement-enseignants":      {"cat":"Vie enseignante",  "cycle":"Tous cycles","time":"8 min", "date":"3 mars 2023"},
  "respect-eps":                  {"cat":"Gestion de classe","cycle":"Tous cycles","time":"15 min","date":"20 févr. 2023"},
  "comportements-perturbateurs":  {"cat":"Gestion de classe","cycle":"Tous cycles","time":"10 min","date":"15 févr. 2023"},
  "faire-bouger-enfants":         {"cat":"Jeux et activités","cycle":"Tous cycles","time":"12 min","date":"10 févr. 2023"},
  "bienfaits-sport-enfants":      {"cat":"Bienfaits du sport","cycle":"Tous cycles","time":"8 min","date":"5 févr. 2023"},
}

NEW_HEADER = '''<!-- ZTS HEADER REFONTE -->
<header class="zts-new-header">
  <div class="zts-new-header-inner">
    <a href="https://zonetotalsport.ca/" class="zts-new-logo">
      <h1 class="font-lucky-new">ZONE <span class="zts-yellow">TOTAL</span> SPORT</h1>
      <span class="zts-new-tag">Pédagogie Primaire</span>
    </a>
    <nav class="zts-new-nav">
      <a href="https://zonetotalsport.ca/" class="zts-new-link"><i data-lucide="home"></i><span>Accueil</span></a>
      <a href="https://zonetotalsport.ca/?open=https%3A%2F%2Feducatifs.zonetotalsport.ca" class="zts-new-link"><i data-lucide="wrench"></i><span>Outils</span></a>
      <a href="https://zonetotalsport.ca/?open=https%3A%2F%2Fjeux.zonetotalsport.ca" class="zts-new-link"><i data-lucide="gamepad-2"></i><span>Jeux</span></a>
      <a href="../blog.html" class="zts-new-link active"><i data-lucide="pen-line"></i><span>Blog</span></a>
      <a href="../wix/donation.html" class="zts-new-link zts-new-donate"><i data-lucide="heart"></i><span>Dons</span></a>
    </nav>
  </div>
</header>
<!-- /ZTS HEADER REFONTE -->'''

def make_hero(title_html, desc, img_src, img_alt, cat, cycle, time, date):
    """Hero XXL: titre Luckiest Guy massif + image sticker pivotée."""
    # Highlight a key word in yellow if possible
    title_yellow = title_html
    for kw in ["gymnase","jeux","élèves","sport","classe","école","cours","activité","plaisir","jeu"]:
        m = re.search(r'\b'+kw+r'\b', title_html, re.IGNORECASE)
        if m:
            w = m.group(0)
            title_yellow = title_html.replace(w, f'<span class="zts-yellow">{w}</span>', 1)
            break
    return f'''<!-- ZTS HERO XXL -->
<section class="zts-new-hero">
  <div class="zts-new-hero-inner">
    <div class="zts-new-hero-text">
      <a href="../blog.html" class="zts-new-back"><i data-lucide="arrow-left"></i> Retour au blog</a>
      <span class="zts-new-cat-badge">{html.escape(cat)}</span>
      <h2 class="zts-new-hero-title">{title_yellow}</h2>
      <p class="zts-new-hero-desc">{html.escape(desc)}</p>
      <div class="zts-new-hero-meta">
        <span><i data-lucide="calendar"></i> {date}</span>
        <span><i data-lucide="clock"></i> {time}</span>
        <span><i data-lucide="layers"></i> {cycle}</span>
      </div>
    </div>
    <div class="zts-new-hero-img-wrap">
      <div class="zts-new-hero-img">
        <img src="{img_src}" alt="{html.escape(img_alt)}">
      </div>
      <div class="zts-new-hero-badge">
        <div class="zts-new-hero-badge-icon"><i data-lucide="book-open"></i></div>
        <div>
          <p class="zts-new-hero-badge-t">ARTICLE</p>
          <p class="zts-new-hero-badge-s">Lecture {time}</p>
        </div>
      </div>
    </div>
  </div>
</section>
<!-- /ZTS HERO XXL -->'''

NEW_FOOTER = '''<!-- ZTS FOOTER REFONTE -->
<footer class="zts-new-footer">
  <div class="zts-new-footer-inner">
    <h2 class="zts-new-footer-logo">ZONE <span class="zts-yellow">TOTAL</span> SPORT</h2>
    <nav class="zts-new-footer-nav">
      <a href="https://zonetotalsport.ca/">Accueil</a>
      <a href="https://zonetotalsport.ca/?open=https%3A%2F%2Feducatifs.zonetotalsport.ca">Outils</a>
      <a href="../blog.html" class="active">Blog</a>
      <a href="../wix/donation.html">Dons</a>
    </nav>
    <div class="zts-new-footer-social">
      <a href="https://www.facebook.com/profile.php?id=100090661918934" target="_blank" rel="noopener"><i data-lucide="facebook"></i></a>
      <a href="https://www.instagram.com/zonetotalsport/" target="_blank" rel="noopener"><i data-lucide="instagram"></i></a>
      <a href="https://zonetotalsport.ca/"><i data-lucide="globe"></i></a>
    </div>
    <p class="zts-new-footer-copy">© 2026 ZONE TOTAL SPORT • PASSIONNÉMENT PROFS</p>
  </div>
</footer>
<!-- /ZTS FOOTER REFONTE -->'''

# Sidebar bloc inséré AVANT le footer
SIDEBAR_BLOCK = '''<!-- ZTS SIDEBAR REFONTE -->
<section class="zts-new-aside-section">
  <div class="zts-new-aside-inner">
    <div class="zts-new-tools">
      <h3 class="zts-new-tools-title">ESPACE OUTILS</h3>
      <p class="zts-new-tools-sub">Téléchargez nos ressources prêtes à l'emploi pour vos cours.</p>
      <div class="zts-new-tools-grid">
        <a href="https://zonetotalsport.ca/?open=https%3A%2F%2Feducatifs.zonetotalsport.ca" class="zts-new-tool-link">
          <div class="zts-new-tool-icon"><i data-lucide="calendar"></i></div>
          <span>Plan annuel</span>
        </a>
        <a href="https://zonetotalsport.ca/?open=https%3A%2F%2Fjeux.zonetotalsport.ca" class="zts-new-tool-link">
          <div class="zts-new-tool-icon"><i data-lucide="trophy"></i></div>
          <span>Recueil de jeux</span>
        </a>
        <a href="https://zonetotalsport.ca/?open=https%3A%2F%2Fsae.zonetotalsport.ca" class="zts-new-tool-link">
          <div class="zts-new-tool-icon"><i data-lucide="clipboard-check"></i></div>
          <span>SAÉ & grilles</span>
        </a>
      </div>
      <a href="https://zonetotalsport.ca/" class="zts-new-tools-cta">TOUT VOIR !</a>
    </div>
    <div class="zts-new-blog-cta">
      <h3 class="zts-new-tools-title">PLUS D'ARTICLES</h3>
      <p class="zts-new-tools-sub">Découvre tous les articles du blogue EPS.</p>
      <a href="../blog.html" class="zts-new-blog-cta-btn">Voir le blog <i data-lucide="arrow-right"></i></a>
    </div>
  </div>
</section>
<!-- /ZTS SIDEBAR REFONTE -->'''

# ===== Patterns regex =====
# Header: 2 cas — <header class="zts-header">…</header> OU <nav class="bg-dark/95…">…</nav>
RE_HEADER_ZTS = re.compile(r'<header class="zts-header">.*?</header>', re.DOTALL)
RE_NAV_DARK   = re.compile(r'<nav class="bg-dark/95[^"]*"[^>]*>.*?</nav>', re.DOTALL)
RE_HERO       = re.compile(r'<div class="hero-full[^"]*"[^>]*>.*?</div>\s*(?=<!--|<main|<section|<article)', re.DOTALL)
# Footer principal yellow-sun (toujours présent)
RE_FOOTER_YS  = re.compile(r'<footer class="bg-yellow-sun[^"]*"[^>]*>.*?</footer>', re.DOTALL)
# Bandeau dark sous le footer principal (présent dans certains articles)
RE_FOOTER_DARK= re.compile(r'<div class="bg-dark py-4 px-6[^"]*"[^>]*>.*?</div>\s*(?=<script|</body)', re.DOTALL)

# Métadonnées extractables
RE_OG_DESC    = re.compile(r'<meta\s+property="og:description"\s+content="([^"]+)"')
RE_OG_IMG     = re.compile(r'<meta\s+property="og:image"\s+content="([^"]+)"')
RE_OG_TITLE   = re.compile(r'<meta\s+property="og:title"\s+content="([^"]+)"')
RE_HERO_IMG   = re.compile(r'<div class="hero-full[^>]*>\s*<img\s+src="([^"]+)"\s+alt="([^"]+)"', re.DOTALL)
RE_TITLE      = re.compile(r'<title>([^<]+)</title>')


def extract_meta(content, slug):
    m = META.get(slug, {})
    cat = m.get("cat","Article")
    cycle = m.get("cycle","Tous cycles")
    time = m.get("time","10 min")
    date = m.get("date","")

    og_title = (RE_OG_TITLE.search(content) or [None,""])[1] if RE_OG_TITLE.search(content) else ""
    if not og_title:
        og_title = (RE_TITLE.search(content) or [None,""])[1] if RE_TITLE.search(content) else slug
    # Coupe " | Zone Total Sport" et autres suffixes
    title = re.split(r'\s*\|\s*', og_title)[0].strip()

    desc = (RE_OG_DESC.search(content) or [None,""])[1] if RE_OG_DESC.search(content) else ""

    # Image hero
    hero_match = RE_HERO_IMG.search(content)
    if hero_match:
        img_src, img_alt = hero_match.group(1), hero_match.group(2)
        # Préfixe relatif si nécessaire
        if not img_src.startswith(('http','/','../')):
            pass  # déjà relatif au dossier articles
    else:
        og_img = (RE_OG_IMG.search(content) or [None,""])[1] if RE_OG_IMG.search(content) else ""
        img_src = og_img if og_img else "../mr-root-bureau.png"
        img_alt = title

    return title, desc, img_src, img_alt, cat, cycle, time, date


def transform(path):
    with open(path, encoding='utf-8') as f:
        content = f.read()
    slug = os.path.splitext(os.path.basename(path))[0]

    # Skip si déjà refait
    if 'ZTS HEADER REFONTE' in content:
        return f"= {slug} (déjà refait)"

    title, desc, img, alt, cat, cycle, time, date = extract_meta(content, slug)
    hero_html = make_hero(html.escape(title, quote=False), desc, img, alt, cat, cycle, time, date)

    # 1) Replace header
    new_content, n_h = RE_HEADER_ZTS.subn(NEW_HEADER, content, count=1)
    if n_h == 0:
        new_content, n_h = RE_NAV_DARK.subn(NEW_HEADER, content, count=1)

    # 2) Replace hero-full (avec son contenu)
    new_content, n_hero = RE_HERO.subn(hero_html, new_content, count=1)
    # Fallback si le pattern lookahead n'a pas matché (hero suivi par autre chose)
    if n_hero == 0:
        # Try a simpler pattern that captures the closing div based on indentation
        new_content2 = re.sub(
            r'<div class="hero-full[^"]*"[^>]*>.*?</div>\s*\n\s*(?=<)',
            hero_html + '\n\n  ',
            new_content, count=1, flags=re.DOTALL
        )
        if new_content2 != new_content:
            new_content = new_content2; n_hero = 1

    # 3) Replace footer + bandeau dark
    new_content, n_f = RE_FOOTER_YS.subn(NEW_FOOTER, new_content, count=1)
    new_content, n_fd = RE_FOOTER_DARK.subn('', new_content, count=1)

    # 4) Insert sidebar block before new footer
    new_content = new_content.replace(NEW_FOOTER, SIDEBAR_BLOCK + '\n\n' + NEW_FOOTER, 1)

    if new_content == content:
        return f"! {slug} (aucun changement)"

    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    return f"✓ {slug}  [hdr={n_h} hero={n_hero} ftr={n_f} dark={n_fd}]"


if __name__ == '__main__':
    files = sorted(glob.glob(os.path.join(ARTICLES_DIR, '*.html')))
    for p in files:
        print(transform(p))
