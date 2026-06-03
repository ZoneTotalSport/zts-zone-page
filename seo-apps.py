#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Injecte les balises SEO manquantes dans chaque apps/*/index.html (idempotent, tag par tag)
   puis régénère le bloc <!-- ZTS-APPS --> du sitemap.xml."""
import os, re, html, glob, datetime

BASE = "https://zonetotalsport.ca/apps/"
ROOT = os.path.dirname(os.path.abspath(__file__))

# Descriptions FR sur mesure (≈150 car). Clé = nom du dossier.
DESC = {
 "activites-duree":"Trouve des activités d'éducation physique filtrées par durée. Outil gratuit pour profs d'ÉPS, camps et services de garde au gymnase.",
 "agenda":"Agenda scolaire numérique pour l'éducation physique. Organise tes cours, périodes et groupes. Outil gratuit Zone Total Sport.",
 "bricolages":"Idées de bricolages sans préparation pour camps de jour et services de garde. Activités créatives clés en main, gratuites.",
 "brise-glace":"Jeux brise-glace pour débuter un cours, un camp ou une rencontre de groupe. Activités d'animation gratuites et rapides.",
 "chansons-camp":"Recueil de chansons et cris de ralliement pour camps de jour. Paroles et idées d'animation gratuites pour moniteurs.",
 "comptines":"Comptines et chansons pour les tout-petits en service de garde, maternelle et camp. Recueil gratuit pour animateurs.",
 "cours-maternelle":"90 cours d'éducation physique clés en main pour la maternelle. Planifications gratuites, motricité 4-6 ans, mode TBI.",
 "echauffements":"Banque d'échauffements dynamiques pour l'éducation physique. Idées rapides pour préparer le corps avant l'effort. Gratuit.",
 "educatifs":"Éducatifs et exercices techniques d'ÉPS par sport. Progressions pédagogiques clés en main pour le gymnase. Gratuit.",
 "enigmes":"Énigmes et devinettes pour animer camps, classes et services de garde. Banque de défis ludiques gratuits.",
 "evaluation":"Carnet d'évaluation en éducation physique. Suivi des compétences PFEQ, notes et observations. Outil gratuit pour profs d'ÉPS.",
 "generateur":"Générateur de situations d'apprentissage par intelligence artificielle pour l'éducation physique. Crée une SAÉ PFEQ en secondes.",
 "grands-jeux":"Grands jeux thématiques pour camps de jour et journées spéciales. Scénarios d'animation clés en main, gratuits.",
 "grille":"Grille horaire pour l'éducation physique. Organise tes périodes, groupes et locaux. Outil de planification gratuit.",
 "intervention-groupe":"Le couteau suisse de la gestion de groupe en ÉPS : minuteur, équipes, bruitmètre, dessin. Outils d'intervention gratuits au gymnase.",
 "jeux-calmes":"Jeux calmes pour le retour au calme, la classe et les fins de journée. Banque d'activités douces gratuites.",
 "jeux-eau":"Jeux d'eau rafraîchissants pour camps de jour et journées chaudes. Idées d'animation extérieure gratuites.",
 "jeux-par-theme":"Jeux d'éducation physique classés par thème. Trouve l'activité parfaite selon ton intention pédagogique. Gratuit.",
 "jeux-rapides":"Jeux rapides à sortir n'importe quand au gymnase ou en camp. Activités courtes sans matériel, gratuites.",
 "jeux":"Répertoire mondial de 1439 jeux d'éducation physique. Filtre par catégorie, âge et matériel. Banque gratuite pour profs d'ÉPS.",
 "journee-pedago":"Idées d'activités pour journées pédagogiques en service de garde. Programmation clés en main gratuite pour animateurs.",
 "moyens-action":"Calendrier des moyens d'action en éducation physique PFEQ. Planifie ton année selon les compétences. Outil gratuit.",
 "musique":"Playlists musicales pour l'éducation physique : échauffement, jeux, retour au calme. Sélections gratuites pour le gymnase.",
 "noms-de-clans":"Générateur de noms d'équipes et de clans pour camps, olympiades et tournois. Idées originales instantanées, gratuit.",
 "olympiades-scolaires":"Organise des olympiades scolaires clés en main. Épreuves, rotations et pointage pour l'éducation physique. Gratuit.",
 "olympiades":"Olympiades et tournois prêts à animer pour camps et écoles. Épreuves et formats variés gratuits.",
 "omnigroupe":"Le couteau suisse des outils d'intervention de groupe en ÉPS : minuteur, équipes, séquenceur, dessin. Gratuit pour le gymnase.",
 "plan-b-meteo":"Plan B météo : activités intérieures de rechange quand le terrain extérieur est inaccessible. Idées ÉPS gratuites.",
 "plan-b-pluie":"Plan B jours de pluie : jeux et activités intérieures clés en main pour camps et services de garde. Gratuit.",
 "planificateur":"Planificateur pédagogique pour l'éducation physique. Bâtis tes cours et ta progression annuelle PFEQ. Outil gratuit.",
 "planification":"Outil de planification en éducation physique. Structure tes cours, cycles et compétences. Gratuit pour profs d'ÉPS.",
 "rallyes":"Rallyes et chasses au trésor clés en main pour camps et écoles. Parcours d'énigmes prêts à animer, gratuits.",
 "roue-responsabilites":"Roue de responsabilités à faire tourner pour distribuer les tâches en classe ou en camp. Outil d'animation gratuit.",
 "sae":"Banque de situations d'apprentissage et d'évaluation (SAÉ) PFEQ en éducation physique. 900+ SAÉ gratuites pour profs d'ÉPS.",
 "scoreboard":"Tableau de pointage numérique pour basketball, hockey et football. Affichage TNI plein écran. Scoreboard gratuit pour le gymnase.",
 "sos-conflits":"SOS conflits : stratégies de résolution de conflits entre élèves au gymnase et en camp. Outil d'intervention gratuit.",
 "suppleance":"Trousse de suppléance en éducation physique. Plans de cours prêts à donner pour remplaçants. Outil gratuit.",
 "tni":"Tableau blanc numérique interactif pour l'éducation physique. Dessine, annote et anime au TNI. Outil gratuit.",
 "transitions":"Boîte à outils de transitions pour le gymnase : minuteur, signaux, retour au calme. Outils d'animation ÉPS gratuits.",
 "veillee-feu-de-camp":"Idées de veillées et de feux de camp pour camps de jour. Animations, sketchs et chansons clés en main, gratuites.",
}

def has(content, pattern):
    return re.search(pattern, content, re.I) is not None

def app_title(content):
    m = re.search(r'<title>(.*?)</title>', content, re.I|re.S)
    return html.unescape(m.group(1).strip()) if m else "Zone Total Sport"

report = []
processed = []
for f in sorted(glob.glob(os.path.join(ROOT, "apps", "*", "index.html"))):
    name = os.path.basename(os.path.dirname(f))
    with open(f, encoding="utf-8") as fh:
        c = fh.read()
    if "<title>" not in c.lower():
        report.append((name, "SKIP (pas de <title>)", {}))
        continue
    url = BASE + name + "/"
    title = app_title(c)
    desc = DESC.get(name)
    added = {}

    block = []
    # description
    if not has(c, r'name=["\']description["\']'):
        if desc:
            block.append(f'<meta name="description" content="{html.escape(desc)}">')
            added["desc"] = "ajouté"
        else:
            added["desc"] = "MANQUE (pas de texte)"
    else:
        added["desc"] = "déjà présent"
    # canonical
    if not has(c, r'rel=["\']canonical["\']'):
        block.append(f'<link rel="canonical" href="{url}">')
        added["canonical"] = "ajouté"
    else:
        added["canonical"] = "déjà présent"
    # hreflang
    if not has(c, r'hreflang'):
        block.append(f'<link rel="alternate" hreflang="fr-CA" href="{url}">')
        block.append(f'<link rel="alternate" hreflang="fr" href="{url}">')
        block.append(f'<link rel="alternate" hreflang="en" href="{url}?lang=en">')
        block.append(f'<link rel="alternate" hreflang="x-default" href="{url}">')
        added["hreflang"] = "ajouté"
    else:
        added["hreflang"] = "déjà présent"
    # open graph
    if not has(c, r'property=["\']og:'):
        ogd = desc or title
        block.append(f'<meta property="og:title" content="{html.escape(title)}">')
        block.append(f'<meta property="og:description" content="{html.escape(ogd)}">')
        block.append('<meta property="og:type" content="website">')
        block.append(f'<meta property="og:url" content="{url}">')
        block.append('<meta property="og:image" content="https://zonetotalsport.ca/favicon.png">')
        block.append('<meta property="og:locale" content="fr_CA">')
        block.append('<meta property="og:site_name" content="Zone Total Sport">')
        block.append('<meta name="twitter:card" content="summary">')
        added["og"] = "ajouté"
    else:
        added["og"] = "déjà présent"

    if block:
        snippet = "\n  <!-- ZTS-SEO -->\n  " + "\n  ".join(block) + "\n  <!-- /ZTS-SEO -->"
        c2 = re.sub(r'(</title>)', lambda m: m.group(1) + snippet, c, count=1, flags=re.I)
        with open(f, "w", encoding="utf-8") as fh:
            fh.write(c2)
    processed.append(name)
    report.append((name, "OK", added))

# ---- Sitemap : régénère le bloc des apps ----
sm_path = os.path.join(ROOT, "sitemap.xml")
today = datetime.date.today().isoformat()
entries = []
for name in processed:
    url = BASE + name + "/"
    entries.append(
f"""  <url>
    <loc>{url}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <xhtml:link rel="alternate" hreflang="fr" href="{url}"/>
    <xhtml:link rel="alternate" hreflang="en" href="{url}?lang=en"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="{url}"/>
  </url>""")
apps_block = "\n  <!-- ZTS-APPS -->\n" + "\n".join(entries) + "\n  <!-- /ZTS-APPS -->\n"

with open(sm_path, encoding="utf-8") as fh:
    sm = fh.read()
if "<!-- ZTS-APPS -->" in sm:
    sm = re.sub(r'\n?  <!-- ZTS-APPS -->.*?<!-- /ZTS-APPS -->\n?', '\n', sm, flags=re.S)
sm = re.sub(r'  <url>\s*<loc>https://zonetotalsport\.ca/apps/.*?</url>\n', '', sm, flags=re.S)
sm = sm.replace("</urlset>", apps_block + "</urlset>")
with open(sm_path, "w", encoding="utf-8") as fh:
    fh.write(sm)

# ---- Compte rendu ----
print("="*72)
print(f"COMPTE RENDU SEO — {len(processed)} apps traitees — {today}")
print("="*72)
cols = ["desc","canonical","hreflang","og"]
def mark(v):
    return {"ajouté":"[+]","déjà présent":"[ok]","MANQUE (pas de texte)":"[X]"}.get(v, v)
print(f'{"APP":22} {"desc":8} {"canon":8} {"hreflang":10} {"og":8}')
print("-"*72)
miss = []
for name, status, a in report:
    if status != "OK":
        print(f"{name:22} {status}")
        continue
    row = [mark(a.get(k,"")) for k in cols]
    print(f'{name:22} {row[0]:8} {row[1]:8} {row[2]:10} {row[3]:8}')
    if "[X]" in row: miss.append(name)
print("-"*72)
print("Legende : [+] ajoute   [ok] deja present   [X] manquant")
tot_added = sum(1 for _,s,a in report if s=="OK" for k in cols if a.get(k)=="ajouté")
print(f"Balises ajoutees au total : {tot_added}")
print(f"Apps dans sitemap.xml : {len(processed)}")
if miss:
    print(f"!! Descriptions manquantes : {', '.join(miss)}")
else:
    print("OK Toutes les apps ont desc + canonical + hreflang FR/EN + Open Graph")
