#!/usr/bin/env python3
"""Rebuild des 22 articles avec le mockup 'Article Hero XXL' fourni par l'utilisateur.
Remplace en bloc HEADER/HERO/SIDEBAR/FOOTER + wrap le main en carte blanche prose."""
import re, os, glob, html

ARTICLES_DIR = os.path.dirname(os.path.abspath(__file__))

# ===== Métadonnées par slug (titre, desc, cat, cycle, time, date, img Unsplash fallback) =====
META = {
  "un-jeu-trois-versions":          {"cat":"Gestion de classe","cycle":"Tous cycles","time":"31 min","date":"27 juill. 2026","img":"images/heroes/un-jeu-trois-versions.jpg"},
  "50-jeunes-un-gymnase":         {"cat":"Gestion de classe","cycle":"Tous cycles","time":"25 min","date":"29 avr. 2026","img":"images/Images%20article%2050%20jeunes%20gymnase%20/image%201%20article%20blig%2050%20jeunes%201%20gymnase.png"},
  "syndrome-gymnase":             {"cat":"Gestion de classe","cycle":"Tous cycles","time":"6 min", "date":"10 mars 2026","img":"https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&h=600&fit=crop"},
  "sae-course":                   {"cat":"SAÉ",              "cycle":"Cycle 3",    "time":"12 min","date":"29 sept. 2024","img":"https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1200&h=600&fit=crop"},
  "avance-annee-scolaire":        {"cat":"Ressources",       "cycle":"Tous cycles","time":"9 min", "date":"10 juil. 2024","img":"https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=600&fit=crop"},
  "jeux-course-1er-cycle":        {"cat":"Jeux et activités","cycle":"Cycle 1",    "time":"13 min","date":"7 juin 2024",  "img":"https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=1200&h=600&fit=crop"},
  "systeme-emulation-dollar":     {"cat":"Gestion de classe","cycle":"Tous cycles","time":"10 min","date":"7 avr. 2024",  "img":"https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&h=600&fit=crop"},
  "color-run":                    {"cat":"Jeux et activités","cycle":"Tous cycles","time":"16 min","date":"3 mars 2024",  "img":"https://images.unsplash.com/photo-1496024840928-4c417adf211d?w=1200&h=600&fit=crop"},
  "systeme-emulation-dollars-ecole":{"cat":"Gestion de classe","cycle":"Cycles 2-3","time":"17 min","date":"14 janv. 2024","img":"https://images.unsplash.com/photo-1684145344919-4dd45da4eef1?w=1200&h=600&fit=crop"},
  "eleves-cotes-eps":             {"cat":"Ressources",       "cycle":"Tous cycles","time":"45 min","date":"23 sept. 2023","img":"https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&h=600&fit=crop"},
  "rentree-scolaire":             {"cat":"Vie enseignante",  "cycle":"Tous cycles","time":"13 min","date":"19 août 2023", "img":"https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=600&fit=crop"},
  "classes-difficiles-partie-3":  {"cat":"Gestion de classe","cycle":"Tous cycles","time":"37 min","date":"17 août 2023", "img":"https://images.unsplash.com/photo-1529390079861-591de354faf5?w=1200&h=600&fit=crop"},
  "classes-difficiles-partie-2":  {"cat":"Gestion de classe","cycle":"Tous cycles","time":"27 min","date":"11 juin 2023", "img":"https://images.unsplash.com/photo-1758876019128-e76eebf402bd?w=1200&h=600&fit=crop"},
  "classes-difficiles-partie-1":  {"cat":"Gestion de classe","cycle":"Tous cycles","time":"27 min","date":"29 mai 2023",  "img":"https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&h=600&fit=crop"},
  "suppleance-ecoles":            {"cat":"Vie enseignante",  "cycle":"Tous cycles","time":"23 min","date":"15 avr. 2023",  "img":"https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&h=600&fit=crop"},
  "foobaskill":                   {"cat":"Jeux et activités","cycle":"Cycles 2-3", "time":"9 min", "date":"14 avr. 2023",  "img":"https://images.unsplash.com/photo-1755241113952-45f5d3eb8be3?w=1200&h=600&fit=crop"},
  "nawatobi":                     {"cat":"Jeux et activités","cycle":"Tous cycles","time":"8 min", "date":"7 avr. 2023",   "img":"https://images.unsplash.com/photo-1482368395386-c40ff5165e15?w=1200&h=600&fit=crop"},
  "courbe-plaisir-jeu":           {"cat":"Jeux et activités","cycle":"Tous cycles","time":"13 min","date":"8 mars 2023",   "img":"https://images.unsplash.com/photo-1680024435561-915cc268b3a9?w=1200&h=600&fit=crop"},
  "harcelement-enseignants":      {"cat":"Vie enseignante",  "cycle":"Tous cycles","time":"8 min", "date":"3 mars 2023",   "img":"https://images.unsplash.com/photo-1516534775068-ba3e7458af70?w=1200&h=600&fit=crop"},
  "respect-eps":                  {"cat":"Gestion de classe","cycle":"Tous cycles","time":"15 min","date":"20 févr. 2023", "img":"https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=1200&h=600&fit=crop"},
  "comportements-perturbateurs":  {"cat":"Gestion de classe","cycle":"Tous cycles","time":"10 min","date":"15 févr. 2023", "img":"https://images.unsplash.com/photo-1758270705031-ebd46917a454?w=1200&h=600&fit=crop"},
  "faire-bouger-enfants":         {"cat":"Jeux et activités","cycle":"Tous cycles","time":"12 min","date":"10 févr. 2023", "img":"https://images.unsplash.com/photo-1655842556539-db2d2099ded1?w=1200&h=600&fit=crop"},
  "bienfaits-sport-enfants":      {"cat":"Bienfaits du sport","cycle":"Tous cycles","time":"8 min","date":"5 févr. 2023",  "img":"https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1200&h=600&fit=crop"},
}

# ===== TEMPLATE HEADER (mockup faithful) =====
def render_header():
    return '''<!-- ZTS HEADER REFONTE -->
<header class="bg-ztsBlue border-b-4 border-ztsDarkBlue sticky top-0 z-50 py-3 shadow-lg">
  <div class="container mx-auto px-4 flex justify-between items-center">
    <a href="https://zonetotalsport.ca/" class="flex flex-col items-start text-left group">
      <h1 class="text-2xl md:text-3xl font-luckiest text-white flex items-center gap-2 text-outline">
        ZONE <span class="text-ztsYellow">TOTAL</span> SPORT
      </h1>
      <span class="text-[10px] font-black text-ztsDeep uppercase tracking-[0.2em] leading-none">Pédagogie Primaire</span>
    </a>
    <nav class="flex items-center gap-2 md:gap-3">
      <a href="../blog.html" class="hidden md:inline-flex items-center gap-2 text-white font-bold hover:bg-white/20 px-4 py-2 rounded-full transition-all">
        <i data-lucide="arrow-left" class="w-4 h-4"></i> Blog
      </a>
      <a href="https://zonetotalsport.ca/" class="bg-ztsYellow text-ztsDeep px-6 py-2 rounded-full font-luckiest text-lg hover:bg-white hover:scale-105 transition-all shadow-md">
        ZTS <i data-lucide="trophy" class="inline w-5 h-5 ml-1"></i>
      </a>
    </nav>
  </div>
</header>
<!-- /ZTS HEADER REFONTE -->'''


def render_hero(title, cat, time, date, author="Joey Root"):
    # Highlight a key word in yellow
    title_yellow = html.escape(title)
    for kw in ["gymnase","jeux","élèves","sport","classe","école","cours","activité","plaisir","jeu","corde","respect","comportement","bonheur"]:
        m = re.search(r'\b'+kw+r'\b', title_yellow, re.IGNORECASE)
        if m:
            w = m.group(0)
            title_yellow = title_yellow.replace(w, f'<span class="text-ztsYellow">{w}</span>', 1)
            break
    return f'''<!-- ZTS HERO XXL -->
<section class="relative hero-gradient pt-20 pb-32 overflow-hidden text-center">
  <div class="container mx-auto px-4 relative z-10">
    <div class="max-w-4xl mx-auto">
      <div class="mb-8 flex justify-center gap-3 flex-wrap">
        <span class="bg-ztsYellow text-ztsDeep font-luckiest px-5 py-1.5 rounded-xl text-sm -rotate-2 shadow-lg uppercase">{html.escape(cat)}</span>
        <span class="bg-black/20 text-white font-bold px-4 py-1.5 rounded-xl text-sm backdrop-blur-sm tracking-wider uppercase">{time} de lecture</span>
      </div>
      <h2 class="text-4xl md:text-6xl lg:text-7xl font-luckiest text-white mb-10 leading-[1.1] text-outline uppercase">{title_yellow}</h2>
      <div class="flex items-center justify-center gap-6 font-bold text-cyan-50">
        <div class="w-14 h-14 bg-ztsYellow rounded-full overflow-hidden border-4 border-white shadow-2xl flex items-center justify-center text-ztsDeep font-luckiest text-xl">JR</div>
        <div class="text-left">
          <p class="text-white font-luckiest text-lg leading-tight uppercase">{html.escape(author)}</p>
          <p class="text-cyan-200 text-sm">Publié le {date}</p>
        </div>
      </div>
    </div>
  </div>
</section>
<!-- /ZTS HERO XXL -->'''


def render_main_open():
    """Ouvre le grid 12-col + carte blanche prose. La sidebar suit dans le même grid."""
    return '''<main class="container mx-auto px-4 -mt-16 relative z-30 pb-20">
  <div class="grid lg:grid-cols-12 gap-8 lg:gap-12">
    <article class="lg:col-span-8 bg-white rounded-[3rem] shadow-2xl p-6 md:p-12 lg:p-16 border-b-[16px] border-slate-100 text-left zts-prose">'''


def render_main_close_with_sidebar(img, cat, time):
    return f'''
      <!-- Bannière don ZTS -->
      <div class="my-12 bg-gradient-to-br from-ztsBlue to-ztsDeep rounded-[2.5rem] p-8 md:p-10 text-white text-center shadow-2xl border-b-[10px] border-black/20 relative overflow-hidden">
        <i data-lucide="heart" class="absolute -top-4 -right-4 w-32 h-32 opacity-10"></i>
        <p class="font-luckiest text-2xl md:text-3xl text-ztsYellow uppercase mb-3 leading-tight">Tu aimes Zone Total Sport ?</p>
        <p class="text-cyan-100 mb-6 max-w-xl mx-auto">100 % gratuit, propulsé par la passion. Un petit don aide à garder tout le contenu accessible aux profs d'éduc.</p>
        <a href="../wix/donation.html" class="inline-flex items-center gap-2 bg-ztsYellow text-ztsDeep font-luckiest text-xl px-10 py-4 rounded-full hover:bg-white hover:scale-105 transition-all shadow-xl uppercase">
          <i data-lucide="heart" class="w-5 h-5"></i> Faire un don
        </a>
      </div>

      <!-- Partage et retour -->
      <div class="mt-16 pt-10 border-t-4 border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
        <div class="flex items-center gap-4">
          <p class="font-black text-slate-400 uppercase text-xs tracking-[0.2em]">Partager :</p>
          <div class="flex gap-3">
            <a href="https://www.facebook.com/profile.php?id=100090661918934" target="_blank" rel="noopener" class="text-slate-300 hover:text-ztsBlue transition-colors"><i data-lucide="facebook" class="w-6 h-6"></i></a>
            <a href="https://www.instagram.com/zonetotalsport/" target="_blank" rel="noopener" class="text-slate-300 hover:text-pink-500 transition-colors"><i data-lucide="instagram" class="w-6 h-6"></i></a>
          </div>
        </div>
        <a href="../blog.html" class="bg-ztsBlue text-white px-8 py-3 rounded-2xl font-luckiest text-lg hover:bg-ztsDeep transition-all shadow-lg uppercase">
          ← Retour au blogue
        </a>
      </div>
    </article>

    <!-- Sidebar -->
    <aside class="lg:col-span-4 space-y-10 text-left">
      <div class="bg-ztsDeep rounded-[3rem] p-8 lg:p-10 text-white shadow-2xl relative overflow-hidden border-b-[12px] border-black/20 sticky top-32">
        <i data-lucide="download" class="absolute top-0 right-0 w-32 h-32 opacity-10 -mr-6 -mt-6"></i>
        <h3 class="text-2xl font-luckiest mb-4 text-ztsYellow italic leading-tight uppercase">Espace Outils</h3>
        <p class="text-cyan-100 mb-8 font-medium leading-snug">Téléchargez nos ressources gratuites pour vos cours d'éducation physique.</p>
        <div class="space-y-3 mb-8">
          <a href="https://zonetotalsport.ca/?open=https%3A%2F%2Feducatifs.zonetotalsport.ca" class="flex items-center gap-4 bg-white/10 p-4 rounded-2xl hover:bg-white/20 transition-all border border-white/5 group">
            <div class="bg-ztsYellow p-3 rounded-xl text-ztsDeep group-hover:scale-110 transition-transform"><i data-lucide="file-text" class="w-5 h-5"></i></div>
            <span class="font-luckiest text-base uppercase">Plan annuel</span>
          </a>
          <a href="https://zonetotalsport.ca/?open=https%3A%2F%2Fjeux.zonetotalsport.ca" class="flex items-center gap-4 bg-white/10 p-4 rounded-2xl hover:bg-white/20 transition-all border border-white/5 group">
            <div class="bg-ztsYellow p-3 rounded-xl text-ztsDeep group-hover:scale-110 transition-transform"><i data-lucide="trophy" class="w-5 h-5"></i></div>
            <span class="font-luckiest text-base uppercase">Recueil de jeux</span>
          </a>
          <a href="https://zonetotalsport.ca/?open=https%3A%2F%2Fsae.zonetotalsport.ca" class="flex items-center gap-4 bg-white/10 p-4 rounded-2xl hover:bg-white/20 transition-all border border-white/5 group">
            <div class="bg-ztsYellow p-3 rounded-xl text-ztsDeep group-hover:scale-110 transition-transform"><i data-lucide="clipboard-check" class="w-5 h-5"></i></div>
            <span class="font-luckiest text-base uppercase">SAÉ & grilles</span>
          </a>
        </div>
        <a href="https://zonetotalsport.ca/" class="block text-center w-full bg-ztsYellow text-ztsDeep font-luckiest text-xl py-4 rounded-3xl hover:bg-white transition-all shadow-xl uppercase">Tout voir !</a>
      </div>
    </aside>
  </div>
</main>'''


def render_footer():
    return '''<!-- ZTS FOOTER REFONTE -->
<footer class="bg-ztsDeep text-white py-20">
  <div class="container mx-auto px-4 text-center">
    <h2 class="text-4xl md:text-5xl font-luckiest tracking-[0.1em] mb-8 text-outline">
      ZONE <span class="text-ztsYellow">TOTAL</span> SPORT
    </h2>
    <nav class="flex flex-wrap justify-center gap-8 md:gap-12 mb-12 font-luckiest text-xl md:text-2xl text-ztsBlue uppercase">
      <a href="https://zonetotalsport.ca/" class="hover:text-ztsYellow transition-all">Accueil</a>
      <a href="../blog.html" class="text-ztsYellow border-b-4 border-ztsYellow">Blogue</a>
      <a href="https://zonetotalsport.ca/?open=https%3A%2F%2Feducatifs.zonetotalsport.ca" class="hover:text-ztsYellow transition-all">Outils</a>
      <a href="../wix/donation.html" class="hover:text-ztsYellow transition-all">Dons</a>
    </nav>
    <div class="max-w-2xl mx-auto border-t border-white/10 pt-10">
      <p class="text-white/30 font-black text-xs uppercase tracking-[0.5em]">© 2026 ZONE TOTAL SPORT • PASSIONNÉMENT PROFS AU QUÉBEC</p>
    </div>
  </div>
</footer>
<!-- /ZTS FOOTER REFONTE -->'''


# ===== Patterns =====
RE_HEADER  = re.compile(r'<!-- ZTS HEADER REFONTE -->.*?<!-- /ZTS HEADER REFONTE -->', re.DOTALL)
RE_HERO    = re.compile(r'<!-- ZTS HERO XXL -->.*?<!-- /ZTS HERO XXL -->', re.DOTALL)
RE_SIDEBAR = re.compile(r'<!-- ZTS SIDEBAR REFONTE -->.*?<!-- /ZTS SIDEBAR REFONTE -->', re.DOTALL)
RE_FOOTER  = re.compile(r'<!-- ZTS FOOTER REFONTE -->.*?<!-- /ZTS FOOTER REFONTE -->', re.DOTALL)
RE_MAIN    = re.compile(r'<main\b[^>]*>(.*?)</main>', re.DOTALL)
RE_TITLE   = re.compile(r'<title>([^<]+)</title>')
RE_OG_DESC = re.compile(r'<meta\s+property="og:description"\s+content="([^"]+)"')


def transform(path):
    with open(path, encoding='utf-8') as f:
        c = f.read()
    slug = os.path.splitext(os.path.basename(path))[0]
    m = META.get(slug)
    if not m:
        return f"! {slug} (slug inconnu)"

    # Title
    title_match = RE_TITLE.search(c)
    title_raw = title_match.group(1) if title_match else slug
    title = re.split(r'\s*\|\s*', title_raw)[0].strip()
    title = re.sub(r'&#x([0-9a-fA-F]+);', lambda m: chr(int(m.group(1),16)), title)
    title = re.sub(r'&#(\d+);', lambda m: chr(int(m.group(1))), title)
    title = title.replace('&amp;','&').replace('&quot;','"').replace('&apos;',"'")

    # Replace blocks
    c = RE_HEADER.sub(lambda _: render_header(), c, count=1)
    c = RE_HERO.sub(lambda _: render_hero(title, m['cat'], m['time'], m['date']), c, count=1)
    c = RE_FOOTER.sub(lambda _: render_footer(), c, count=1)

    # Remove old sidebar block (now embedded in new main grid)
    c = RE_SIDEBAR.sub('', c, count=1)

    # Replace <main ...>...</main> by new wrapper around inner content
    main_match = RE_MAIN.search(c)
    if main_match:
        inner = main_match.group(1)
        # Strip residual donation banners and old sticky author cards (they don't fit the prose card)
        inner = re.sub(r'<a[^>]+href="[^"]*donation[^"]*"[^>]*>.*?</a>', '', inner, flags=re.DOTALL)
        inner = re.sub(r'<div[^>]+class="[^"]*from-pink[^"]*"[^>]*>.*?</div>', '', inner, flags=re.DOTALL, count=1)
        inner = re.sub(r'<div[^>]+class="[^"]*bg-gradient-to-r[^"]*from-pink[^"]*"[^>]*>.*?</div>', '', inner, flags=re.DOTALL)
        # Remove deeply nested header bars / breadcrumbs at start
        inner = re.sub(r'^\s*<div[^>]*class="[^"]*scroll-progress[^"]*"[^>]*>\s*</div>', '', inner)

        new_main = render_main_open() + '\n' + inner + '\n' + render_main_close_with_sidebar(m['img'], m['cat'], m['time'])
        c = c.replace(main_match.group(0), new_main, 1)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)
    return f"✓ {slug}"


if __name__ == '__main__':
    files = sorted([p for p in glob.glob(os.path.join(ARTICLES_DIR, '*.html'))
                    if not os.path.basename(p).startswith('_')])
    for p in files:
        print(transform(p))
