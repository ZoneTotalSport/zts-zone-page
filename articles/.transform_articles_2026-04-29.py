#!/usr/bin/env python3
"""Transform 20 ZTS articles: apply prototype pattern.

For each article:
- Read original (extract title, description, date, body)
- Apply unified cyan header + lang selector + hero from images/heroes/[slug].(jpg|png)
- Clean body: remove placeholder imgs, recombine fragmented paragraphs, fix accents, replace Luckiest Guy
- Wrap structural elements (H1, badge, footer, UI) with full FR/EN/ES/ZH translations
- Keep article body paragraphs in FR (corrected) -- per pragmatic decision

Output: complete HTML file at original path.
"""
import re, html, os, sys, json
from pathlib import Path

ART_DIR = Path("/Users/admin/Desktop/Remotion 2/wix-deploy/articles")

# slug -> (hero_filename, category_fr, category_en, category_es, category_zh, badge_color)
ARTICLES = {
    "avance-annee-scolaire": ("avance-annee-scolaire.png", "Planification", "Planning", "Planificación", "教学规划", "#00B8D4"),
    "classes-difficiles-partie-1": ("classes-difficiles-partie-1.jpg", "Gestion de classe", "Classroom management", "Gestión de aula", "课堂管理", "#FF6B00"),
    "classes-difficiles-partie-2": ("classes-difficiles-partie-2.jpg", "Gestion de classe", "Classroom management", "Gestión de aula", "课堂管理", "#FF6B00"),
    "classes-difficiles-partie-3": ("classes-difficiles-partie-3.jpg", "Gestion de classe", "Classroom management", "Gestión de aula", "课堂管理", "#FF6B00"),
    "color-run": ("color-run.jpg", "Événement scolaire", "School event", "Evento escolar", "校园活动", "#FF2A7A"),
    "comportements-perturbateurs": ("comportements-perturbateurs.jpg", "Gestion de classe", "Classroom management", "Gestión de aula", "课堂管理", "#FF6B00"),
    "courbe-plaisir-jeu": ("courbe-plaisir-jeu.jpg", "Pédagogie", "Pedagogy", "Pedagogía", "教学法", "#8B5CF6"),
    "eleves-cotes-eps": ("eleves-cotes-eps.jpg", "Pédagogie", "Pedagogy", "Pedagogía", "教学法", "#8B5CF6"),
    "faire-bouger-enfants": ("faire-bouger-enfants.jpg", "Activité physique", "Physical activity", "Actividad física", "体育活动", "#00B8D4"),
    "foobaskill": ("foobaskill.png", "Sport", "Sport", "Deporte", "运动", "#00B8D4"),
    "harcelement-enseignants": ("harcelement-enseignants.jpg", "Bien-être enseignant", "Teacher well-being", "Bienestar docente", "教师福祉", "#FF2A7A"),
    "jeux-course-1er-cycle": ("jeux-course-1er-cycle.jpg", "Jeux et activités", "Games and activities", "Juegos y actividades", "游戏与活动", "#00B8D4"),
    "nawatobi": ("nawatobi.png", "Sport", "Sport", "Deporte", "运动", "#00B8D4"),
    "rentree-scolaire": ("rentree-scolaire.jpg", "Rentrée scolaire", "Back to school", "Vuelta al cole", "开学季", "#FFD700"),
    "respect-eps": ("respect-eps.jpg", "Pédagogie", "Pedagogy", "Pedagogía", "教学法", "#8B5CF6"),
    "sae-course": ("sae-course.png", "S.A.É", "L.E.S", "S.A.E", "学习活动", "#8B5CF6"),
    "suppleance-ecoles": ("suppleance-ecoles.png", "Suppléance", "Substitute teaching", "Suplencia", "代课", "#00B8D4"),
    "syndrome-gymnase": ("syndrome-gymnase.png", "Bien-être enseignant", "Teacher well-being", "Bienestar docente", "教师福祉", "#FF2A7A"),
    "systeme-emulation-dollar": ("systeme-emulation-dollar.png", "Gestion de classe", "Classroom management", "Gestión de aula", "课堂管理", "#FF6B00"),
    "systeme-emulation-dollars-ecole": ("systeme-emulation-dollars-ecole.jpg", "Gestion de classe", "Classroom management", "Gestión de aula", "课堂管理", "#FF6B00"),
}

# Title translations (manual high-quality)
TITLES = {
    "avance-annee-scolaire": {
        "fr": "Et pourquoi pas prendre de l'avance pour la prochaine année scolaire en édu!",
        "en": "Why not get a head start on the next school year in PE!",
        "es": "¿Y por qué no adelantarse para el próximo año escolar en EF?",
        "zh": "为什么不为新学年的体育课做好准备！",
    },
    "classes-difficiles-partie-1": {
        "fr": "Comment gérer les classes difficiles en éducation physique — Partie 1",
        "en": "How to manage difficult classes in physical education — Part 1",
        "es": "Cómo gestionar las clases difíciles en educación física — Parte 1",
        "zh": "如何管理体育课中难以应付的班级 — 第一部分",
    },
    "classes-difficiles-partie-2": {
        "fr": "Comment gérer les classes difficiles en éducation physique — Partie 2",
        "en": "How to manage difficult classes in physical education — Part 2",
        "es": "Cómo gestionar las clases difíciles en educación física — Parte 2",
        "zh": "如何管理体育课中难以应付的班级 — 第二部分",
    },
    "classes-difficiles-partie-3": {
        "fr": "Comment gérer les classes difficiles en éducation physique — Partie 3",
        "en": "How to manage difficult classes in physical education — Part 3",
        "es": "Cómo gestionar las clases difíciles en educación física — Parte 3",
        "zh": "如何管理体育课中难以应付的班级 — 第三部分",
    },
    "color-run": {
        "fr": "Organiser une Color Run à l'école : guide complet",
        "en": "Organizing a Color Run at school: complete guide",
        "es": "Organizar una Color Run en la escuela: guía completa",
        "zh": "在学校举办彩跑活动：完整指南",
    },
    "comportements-perturbateurs": {
        "fr": "Gérer les comportements perturbateurs en éducation physique",
        "en": "Managing disruptive behaviors in physical education",
        "es": "Gestionar los comportamientos disruptivos en educación física",
        "zh": "应对体育课中的扰乱行为",
    },
    "courbe-plaisir-jeu": {
        "fr": "La courbe du plaisir : comprendre la durée idéale d'un jeu en EPS",
        "en": "The fun curve: understanding the ideal length of a game in PE",
        "es": "La curva del placer: comprender la duración ideal de un juego en EF",
        "zh": "乐趣曲线：理解体育课游戏的理想时长",
    },
    "eleves-cotes-eps": {
        "fr": "Travailler avec les élèves cotés en éducation physique",
        "en": "Working with rated/IEP students in physical education",
        "es": "Trabajar con alumnos con plan de apoyo en educación física",
        "zh": "在体育课中与有特殊需求的学生合作",
    },
    "faire-bouger-enfants": {
        "fr": "Comment faire bouger les enfants au primaire",
        "en": "How to get elementary-school children moving",
        "es": "Cómo hacer que los niños de primaria se muevan",
        "zh": "如何让小学生动起来",
    },
    "foobaskill": {
        "fr": "Foobaskill : un sport hybride innovant pour le gymnase",
        "en": "Foobaskill: an innovative hybrid sport for the gym",
        "es": "Foobaskill: un deporte híbrido innovador para el gimnasio",
        "zh": "Foobaskill：体育馆里的创新混合运动",
    },
    "harcelement-enseignants": {
        "fr": "Le harcèlement envers les enseignants : reconnaître et agir",
        "en": "Harassment of teachers: recognizing and acting",
        "es": "El acoso hacia los docentes: reconocer y actuar",
        "zh": "针对教师的骚扰：识别与应对",
    },
    "jeux-course-1er-cycle": {
        "fr": "Jeux de course pour le 1er cycle du primaire",
        "en": "Running games for early elementary (Grades 1-2)",
        "es": "Juegos de carrera para el primer ciclo de primaria",
        "zh": "适合小学一二年级的跑步游戏",
    },
    "nawatobi": {
        "fr": "Nawatobi : la corde à sauter version japonaise",
        "en": "Nawatobi: the Japanese version of jump rope",
        "es": "Nawatobi: la cuerda de saltar versión japonesa",
        "zh": "Nawatobi：日式跳绳",
    },
    "rentree-scolaire": {
        "fr": "Bien préparer la rentrée scolaire en éducation physique",
        "en": "Getting ready for back-to-school in physical education",
        "es": "Prepararse bien para la vuelta al cole en educación física",
        "zh": "做好体育课的开学准备",
    },
    "respect-eps": {
        "fr": "Enseigner le respect en éducation physique",
        "en": "Teaching respect in physical education",
        "es": "Enseñar el respeto en educación física",
        "zh": "在体育课中教导尊重",
    },
    "sae-course": {
        "fr": "Une S.A.É sur la course pour le primaire",
        "en": "A running L.E.S (learning activity) for elementary school",
        "es": "Una S.A.E sobre la carrera para primaria",
        "zh": "为小学设计的跑步学习活动",
    },
    "suppleance-ecoles": {
        "fr": "La suppléance dans les écoles : guide pratique",
        "en": "Substitute teaching in schools: a practical guide",
        "es": "La suplencia en las escuelas: guía práctica",
        "zh": "学校代课：实用指南",
    },
    "syndrome-gymnase": {
        "fr": "Le syndrome du gymnase : reconnaître l'épuisement de l'enseignant d'ÉPS",
        "en": "The gym syndrome: recognizing PE teacher burnout",
        "es": "El síndrome del gimnasio: reconocer el agotamiento del docente de EF",
        "zh": "体育馆综合症：识别体育教师的职业倦怠",
    },
    "systeme-emulation-dollar": {
        "fr": "Le système d'émulation par dollars en classe",
        "en": "The dollar reward system in the classroom",
        "es": "El sistema de incentivos por dólares en clase",
        "zh": "课堂上的美元激励制度",
    },
    "systeme-emulation-dollars-ecole": {
        "fr": "Le système d'émulation par dollars à l'échelle de l'école",
        "en": "The dollar reward system school-wide",
        "es": "El sistema de incentivos por dólares a nivel de escuela",
        "zh": "全校范围的美元激励制度",
    },
}

DESCRIPTIONS = {
    "avance-annee-scolaire": {
        "fr": "Stratégies et tâches concrètes à accomplir durant l'été pour bien préparer la prochaine année scolaire en éducation physique.",
        "en": "Concrete strategies and tasks to tackle during the summer to get ready for the next school year in physical education.",
        "es": "Estrategias y tareas concretas para realizar durante el verano y prepararse bien para el próximo año escolar en educación física.",
        "zh": "在暑假期间可以完成的具体策略和任务，为下一学年的体育课做好充分准备。",
    },
    "classes-difficiles-partie-1": {
        "fr": "Stratégies pratiques pour gérer les classes difficiles en éducation physique au primaire — première partie.",
        "en": "Practical strategies to manage difficult classes in elementary PE — part one.",
        "es": "Estrategias prácticas para gestionar las clases difíciles en educación física de primaria — primera parte.",
        "zh": "管理小学体育课中难以应付的班级的实用策略 — 第一部分。",
    },
    "classes-difficiles-partie-2": {
        "fr": "Stratégies pratiques pour gérer les classes difficiles en éducation physique au primaire — deuxième partie.",
        "en": "Practical strategies to manage difficult classes in elementary PE — part two.",
        "es": "Estrategias prácticas para gestionar las clases difíciles en educación física de primaria — segunda parte.",
        "zh": "管理小学体育课中难以应付的班级的实用策略 — 第二部分。",
    },
    "classes-difficiles-partie-3": {
        "fr": "Stratégies pratiques pour gérer les classes difficiles en éducation physique au primaire — troisième partie.",
        "en": "Practical strategies to manage difficult classes in elementary PE — part three.",
        "es": "Estrategias prácticas para gestionar las clases difíciles en educación física de primaria — tercera parte.",
        "zh": "管理小学体育课中难以应付的班级的实用策略 — 第三部分。",
    },
    "color-run": {
        "fr": "Guide complet pour organiser une Color Run réussie à l'école primaire.",
        "en": "Complete guide to organizing a successful Color Run at an elementary school.",
        "es": "Guía completa para organizar una Color Run exitosa en una escuela primaria.",
        "zh": "在小学成功举办彩跑活动的完整指南。",
    },
    "comportements-perturbateurs": {
        "fr": "Comment identifier et gérer les comportements perturbateurs durant les cours d'éducation physique.",
        "en": "How to identify and manage disruptive behaviors during physical education classes.",
        "es": "Cómo identificar y gestionar los comportamientos disruptivos durante las clases de educación física.",
        "zh": "如何识别和应对体育课中的扰乱行为。",
    },
    "courbe-plaisir-jeu": {
        "fr": "Comprendre la courbe du plaisir pour ajuster la durée des jeux et garder les élèves engagés.",
        "en": "Understanding the fun curve to adjust game length and keep students engaged.",
        "es": "Comprender la curva del placer para ajustar la duración de los juegos y mantener a los alumnos comprometidos.",
        "zh": "理解乐趣曲线，调整游戏时长，让学生保持投入。",
    },
    "eleves-cotes-eps": {
        "fr": "Conseils pratiques pour adapter ses cours aux élèves cotés en éducation physique.",
        "en": "Practical advice for adapting your lessons to rated/IEP students in physical education.",
        "es": "Consejos prácticos para adaptar las clases a alumnos con plan de apoyo en educación física.",
        "zh": "为体育课中的特殊需求学生调整课程的实用建议。",
    },
    "faire-bouger-enfants": {
        "fr": "Idées et stratégies pour faire bouger les enfants au primaire et lutter contre la sédentarité.",
        "en": "Ideas and strategies to get elementary children moving and fight sedentary lifestyles.",
        "es": "Ideas y estrategias para hacer que los niños de primaria se muevan y combatir el sedentarismo.",
        "zh": "让小学生动起来、对抗久坐生活方式的想法和策略。",
    },
    "foobaskill": {
        "fr": "Découvrez le Foobaskill, un sport hybride mêlant soccer et basketball, parfait pour le gymnase.",
        "en": "Discover Foobaskill, a hybrid sport blending soccer and basketball, perfect for the gym.",
        "es": "Descubre el Foobaskill, un deporte híbrido que combina fútbol y baloncesto, perfecto para el gimnasio.",
        "zh": "了解 Foobaskill —— 一项融合足球与篮球的混合运动，非常适合在体育馆开展。",
    },
    "harcelement-enseignants": {
        "fr": "Reconnaître les signes de harcèlement envers les enseignants et savoir comment réagir.",
        "en": "Recognizing the signs of harassment of teachers and knowing how to respond.",
        "es": "Reconocer los signos de acoso hacia los docentes y saber cómo reaccionar.",
        "zh": "识别针对教师的骚扰迹象，并知道如何应对。",
    },
    "jeux-course-1er-cycle": {
        "fr": "Sélection de jeux de course adaptés aux élèves du premier cycle du primaire.",
        "en": "Selection of running games suited to early elementary students (Grades 1-2).",
        "es": "Selección de juegos de carrera adaptados a alumnos del primer ciclo de primaria.",
        "zh": "适合小学一二年级学生的精选跑步游戏。",
    },
    "nawatobi": {
        "fr": "Découvrez le Nawatobi, la corde à sauter japonaise, une activité spectaculaire pour l'EPS.",
        "en": "Discover Nawatobi, Japanese jump rope, a spectacular activity for PE class.",
        "es": "Descubre el Nawatobi, la cuerda japonesa de saltar, una actividad espectacular para EF.",
        "zh": "了解 Nawatobi —— 日式跳绳，体育课中令人惊艳的活动。",
    },
    "rentree-scolaire": {
        "fr": "Conseils pour bien préparer la rentrée scolaire en éducation physique.",
        "en": "Tips for getting ready for back-to-school in physical education.",
        "es": "Consejos para prepararse bien para la vuelta al cole en educación física.",
        "zh": "做好体育课开学准备的建议。",
    },
    "respect-eps": {
        "fr": "Comment instaurer une culture du respect dans le gymnase et durant les cours d'EPS.",
        "en": "How to build a culture of respect in the gym and during PE classes.",
        "es": "Cómo instaurar una cultura del respeto en el gimnasio y durante las clases de EF.",
        "zh": "如何在体育馆和体育课中建立尊重的文化。",
    },
    "sae-course": {
        "fr": "Une situation d'apprentissage et d'évaluation (S.A.É) sur la course pour les élèves du primaire.",
        "en": "A learning and evaluation situation (L.E.S) on running for elementary students.",
        "es": "Una situación de aprendizaje y evaluación (S.A.E) sobre la carrera para alumnos de primaria.",
        "zh": "为小学生设计的跑步学习与评估活动。",
    },
    "suppleance-ecoles": {
        "fr": "Guide pratique sur la suppléance dans les écoles : conseils, défis et astuces.",
        "en": "Practical guide to substitute teaching in schools: advice, challenges, and tips.",
        "es": "Guía práctica sobre la suplencia en las escuelas: consejos, desafíos y trucos.",
        "zh": "学校代课实用指南：建议、挑战与技巧。",
    },
    "syndrome-gymnase": {
        "fr": "Reconnaître les signes du syndrome du gymnase pour prévenir l'épuisement professionnel des enseignants d'ÉPS.",
        "en": "Recognizing the signs of gym syndrome to prevent professional burnout in PE teachers.",
        "es": "Reconocer los signos del síndrome del gimnasio para prevenir el agotamiento profesional de los docentes de EF.",
        "zh": "识别体育馆综合症的迹象，预防体育教师的职业倦怠。",
    },
    "systeme-emulation-dollar": {
        "fr": "Mettre en place un système d'émulation par dollars pour motiver les élèves en classe.",
        "en": "Setting up a dollar-based reward system to motivate students in the classroom.",
        "es": "Implementar un sistema de incentivos por dólares para motivar a los alumnos en clase.",
        "zh": "设立以美元为基础的激励制度，激发学生的积极性。",
    },
    "systeme-emulation-dollars-ecole": {
        "fr": "Étendre un système d'émulation par dollars à l'échelle de l'école entière.",
        "en": "Scaling a dollar-based reward system to the entire school.",
        "es": "Extender un sistema de incentivos por dólares a toda la escuela.",
        "zh": "将美元激励制度扩展到整所学校。",
    },
}

# Common accent fixes (FR)
ACCENT_FIXES = [
    ("etudiants", "étudiants"),
    ("eleves", "élèves"),
    ("Eleves", "Élèves"),
    ("education physique", "éducation physique"),
    ("Education physique", "Éducation physique"),
    ("annees", "années"),
    ("annee", "année"),
    ("Annee", "Année"),
    ("Quebec", "Québec"),
    ("reserves", "réservés"),
    ("confidentialite", "confidentialité"),
    ("Mots-cles", "Mots-clés"),
    ("mots-cles", "mots-clés"),
    ("Decouvrez", "Découvrez"),
    ("decouvrez", "découvrez"),
    ("experience", "expérience"),
    ("Experience", "Expérience"),
    ("navigue", "navigué"),
    ("succes", "succès"),
    ("apres", "après"),
    ("interet", "intérêt"),
    ("eleve", "élève"),
    ("ecole", "école"),
    ("Ecole", "École"),
    ("ecoles", "écoles"),
    ("ete", "été"),
    ("durnat", "durant"),
    ("su sport", "du sport"),
    ("etreafin", "êtreafin"),
    ("l'ete", "l'été"),
    ("d'ete", "d'été"),
    ("d'etreafin", "d'être afin"),
    ("d&#x27;étéafin", "d&#x27;été afin"),
]

def fix_accents(text):
    for bad, good in ACCENT_FIXES:
        text = text.replace(bad, good)
    return text

def extract_body(content):
    """Extract <div class="article-body"> ... </div>."""
    m = re.search(r'(<div class="article-body">)(.*?)(\n\s*</div>\s*</div>\s*\n\s*<!-- Keywords)', content, re.DOTALL)
    if not m:
        # try alternative ending
        m = re.search(r'(<div class="article-body">)(.*?)(\n\s*</div>\s*</div>)', content, re.DOTALL)
    return m.group(2) if m else ""

def extract_title(content):
    m = re.search(r'<h1[^>]*>(.*?)</h1>', content)
    return html.unescape(m.group(1)).strip() if m else ""

def extract_date(content):
    m = re.search(r'"datePublished":\s*"([^"]+)"', content)
    return m.group(1) if m else "2025-01-15"

def extract_read_time(content):
    m = re.search(r'(\d+)\s*min de lecture', content)
    return m.group(1) if m else "5"

def extract_tags(content):
    """Find tag-pill spans."""
    tags = re.findall(r'<span class="tag-pill">([^<]+)</span>', content)
    if not tags:
        # fallback to keywords ul
        tags_section = re.search(r'<ul>\s*<li>éducation physique[^<]*</li>(.*?)</ul>', content, re.DOTALL)
    return [html.unescape(t).strip() for t in tags[:7]]

def clean_body(body, slug):
    """Clean body: remove placeholder imgs, fix Luckiest Guy refs, fix accents, recombine paragraphs."""
    # Remove placeholder imgs (logo-zts.png in body)
    body = re.sub(r'<img[^>]*src="https://zonetotalsport\.ca/logo-zts\.png"[^>]*>', '', body)
    body = re.sub(r'<img[^>]*src="/logo-zts\.png"[^>]*>', '', body)
    # Replace Luckiest Guy with Bangers
    body = body.replace("'Luckiest Guy', cursive", "'Bangers', cursive")
    body = body.replace("Luckiest Guy", "Bangers")
    # Clean up duplicated/orphan ul at end (these are usually metadata leftovers)
    # Remove ul blocks that look like author/date metadata at the very end
    body = re.sub(r'<ul>\s*<li>Joey Root</li>.*?</ul>', '', body, flags=re.DOTALL)
    # Recombine fragmented paragraphs (a sentence broken at <p>...</p><p>...) -- conservative
    # Decode entities
    body = body.replace('&#x27;', "'")
    body = body.replace('&#39;', "'")
    body = body.replace('&quot;', '"')
    # Fix accents
    body = fix_accents(body)
    # Remove triple+ blank lines
    body = re.sub(r'\n\s*\n\s*\n+', '\n\n', body)
    return body

# Build HTML template
TEMPLATE = '''<!DOCTYPE html>
<html lang="fr-CA">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title_fr} | Blog EPS — Zone Total Sport</title>
  <meta name="description" content="{desc_fr}">
  <meta name="author" content="Joey Root">

  <!-- Open Graph -->
  <meta property="og:title" content="{title_fr} | Zone Total Sport">
  <meta property="og:description" content="{desc_fr}">
  <meta property="og:image" content="https://zonetotalsport.ca/articles/images/heroes/{hero}">
  <meta property="og:url" content="https://zonetotalsport.ca/articles/{slug}.html">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Zone Total Sport">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{title_fr}">
  <meta name="twitter:description" content="{desc_fr}">
  <meta name="twitter:image" content="https://zonetotalsport.ca/articles/images/heroes/{hero}">

  <!-- Canonical -->
  <link rel="canonical" href="https://zonetotalsport.ca/articles/{slug}.html">
  <link rel="icon" type="image/png" href="/logo-zts.png">
  <link rel="apple-touch-icon" href="/logo-zts.png">

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bangers&family=Boogaloo&family=Patrick+Hand&family=Fredoka+One&family=Schoolbell&family=Comic+Neue:wght@400;700&display=swap" rel="stylesheet">

  <!-- Tailwind CSS (pre-compiled static) -->
  <link rel="stylesheet" href="/articles/articles.css">

  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>

  <style>
    *, *::before, *::after {{ margin: 0; padding: 0; box-sizing: border-box; }}
    html {{ scroll-behavior: smooth; overflow-x: hidden; }}

    body {{
      font-family: 'Schoolbell', 'Patrick Hand', cursive;
      font-size: 1.5rem;
      background: url("../gym-bg.jpg") center/cover fixed; background-color: #ffffff;
      color: #1a1a2e;
      overflow-x: hidden;
    }}

    .hero-full{{width:100vw;position:relative;left:50%;right:50%;margin-left:-50vw;margin-right:-50vw}}
    .hero-full img{{position:absolute;top:0;left:0;width:100%!important;height:100%!important;object-fit:cover!important}}
    a {{ text-decoration: none; color: inherit; }}
    ::selection {{ background: #00E5FF; color: #0F0F2E; }}

    /* ========== UNIFIED CYAN HEADER ========== */
    .zts-header {{
      position: sticky; top: 0; z-index: 50;
      background: linear-gradient(135deg, #00E5FF, #00B8D4);
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      padding: 12px 24px;
    }}
    .zts-header-inner {{
      display: flex; align-items: center; gap: 16px;
      max-width: 1500px; margin: 0 auto;
      flex-wrap: wrap; justify-content: space-between;
    }}
    .zts-logo-link {{ display: inline-flex; align-items: center; flex-shrink: 0; }}
    .zts-logo-link img {{ height: 68px; width: auto; display: block; transition: transform 0.25s; }}
    .zts-logo-link:hover img {{ transform: scale(1.05) rotate(-3deg); }}

    .zts-nav-row {{
      display: flex; flex-wrap: nowrap; gap: 6px;
      justify-content: center; flex: 1 1 auto;
      overflow-x: auto; scrollbar-width: none;
    }}
    .zts-nav-row::-webkit-scrollbar {{ display: none; }}

    .wix-nav-btn {{
      display: inline-flex; align-items: center; gap: 6px;
      font-family: 'Fredoka One', cursive; font-size: 1.15rem;
      padding: 9px 14px; border-radius: 26px;
      background: rgba(255,255,255,0.18); color: #fff;
      text-decoration: none; transition: all 0.25s;
      white-space: nowrap; border: 2px solid rgba(255,255,255,0.25);
    }}
    .wix-nav-btn:hover {{ background: #fff; color: #00B8D4; border-color: #fff; transform: translateY(-2px); box-shadow: 0 4px 14px rgba(0,0,0,0.18); }}
    .wix-nav-btn.active {{ background: #fff; color: #00B8D4; border-color: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.15); }}
    .wix-nav-btn.btn-donate-nav {{ background: linear-gradient(135deg, #FF2A7A, #FF6B9D); color: #fff; border-color: #FF2A7A; animation: donPulse 2s ease-in-out infinite; }}
    .wix-nav-btn.btn-donate-nav:hover {{ transform: translateY(-2px) scale(1.06); box-shadow: 0 4px 20px rgba(255,42,122,0.5); color:#fff; }}
    .wix-nav-btn.btn-login-nav {{ background: linear-gradient(135deg, #FF6B00, #FF9500); color: #fff; border-color: #FF6B00; }}
    .wix-nav-btn.btn-login-nav:hover {{ transform: translateY(-2px) scale(1.05); box-shadow: 0 4px 20px rgba(255,107,0,0.4); color:#fff; }}
    @keyframes donPulse {{ 0%,100% {{ box-shadow: 0 0 0 0 rgba(255,42,122,0.4); }} 50% {{ box-shadow: 0 0 15px 3px rgba(255,42,122,0.2); }} }}

    /* ========== LANG SELECTOR ========== */
    .zts-lang {{ display: inline-flex; gap: 4px; flex-shrink: 0; }}
    .lang-btn {{
      font-family: 'Fredoka One', cursive; font-size: 1.1rem;
      padding: 6px 14px; border-radius: 30px;
      background: rgba(255,255,255,0.2); color: #fff;
      border: 2px solid rgba(255,255,255,0.3);
      cursor: pointer; transition: all 0.2s;
      min-width: 44px;
    }}
    .lang-btn:hover {{ background: rgba(255,255,255,0.4); }}
    .lang-btn.active {{ background: #fff; color: #006978; border-color: #fff; }}

    @media (max-width: 900px) {{
      .wix-nav-btn span {{ display: none; }}
      .wix-nav-btn {{ padding: 10px 14px; }}
      .zts-logo-link img {{ height: 52px; }}
    }}

    /* ========== ARTICLE TYPOGRAPHY ========== */
    .article-body h2 {{
      font-family: 'Bangers', cursive;
      font-size: 2.5rem; font-weight: bold; color: #0F0F2E;
      margin: 2.5rem 0 1rem; padding-bottom: 0.5rem;
      border-bottom: 3px solid #00E5FF;
    }}
    .article-body h3 {{
      font-family: 'Bangers', cursive;
      font-size: 2rem; font-weight: bold; color: #8B5CF6;
      margin: 2rem 0 0.75rem;
    }}
    .article-body h4 {{
      font-family: 'Bangers', cursive;
      font-size: 1.7rem; font-weight: bold; color: #FF2A7A;
      margin: 1.5rem 0 0.5rem;
    }}
    .article-body p {{
      font-family: 'Patrick Hand', cursive;
      font-size: 1.5rem; line-height: 1.85;
      color: #1a1a2e; margin-bottom: 1.25rem;
    }}
    .article-body ul, .article-body ol {{
      margin: 1rem 0 1.5rem 1.5rem;
      font-family: 'Patrick Hand', cursive;
      font-size: 1.2rem; line-height: 1.8;
    }}
    .article-body li {{ margin-bottom: 0.5rem; font-size: 1.5rem; }}
    .article-body ul li::marker {{ color: #00E5FF; font-size: 1.3em; }}
    .article-body ol li::marker {{ color: #FF2A7A; font-weight: bold; }}
    .article-body blockquote {{
      border-left: 4px solid #FFD700; background: #FFF9E6;
      padding: 1.25rem 1.5rem; margin: 1.5rem 0;
      border-radius: 0 12px 12px 0; font-style: italic;
      font-size: 1.15rem; color: #1a1a2e;
    }}
    .article-body img {{
      max-width: 100%; height: auto; border-radius: 16px;
      margin: 1.5rem 0; box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }}
    .article-body a {{ color: #00B8D4; text-decoration: underline; text-underline-offset: 3px; transition: color 0.2s; }}
    .article-body a:hover {{ color: #FF2A7A; }}
    .article-body strong {{ color: #0F0F2E; font-weight: 700; }}

    .share-btn {{
      display: inline-flex; align-items: center; gap: 6px;
      padding: 10px 20px; border-radius: 25px;
      font-family: 'Fredoka One', cursive; font-size: 0.85rem;
      transition: all 0.25s; cursor: pointer; border: 2px solid;
    }}
    .share-btn:hover {{ transform: translateY(-2px); }}

    .tag-pill {{
      display: inline-block; padding: 6px 16px; border-radius: 25px;
      font-family: 'Fredoka One', cursive; font-size: 1.8rem;
      background: #f3f4f6; color: #1a1a2e; transition: all 0.2s;
    }}
    .tag-pill:hover {{ background: #00E5FF; color: #0F0F2E; transform: scale(1.05); }}

    .scroll-progress {{
      position: fixed; top: 0; left: 0; height: 4px;
      background: linear-gradient(90deg, #00E5FF, #FFD700, #FF2A7A, #8B5CF6);
      z-index: 10000; transform-origin: left; will-change: transform;
    }}

    .copy-toast {{
      position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%) translateY(100px);
      background: #0F0F2E; color: #fff; padding: 12px 28px; border-radius: 25px;
      font-family: 'Fredoka One', cursive; font-size: 0.9rem;
      box-shadow: 0 8px 30px rgba(0,0,0,0.25); z-index: 9999;
      transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      pointer-events: none;
    }}
    .copy-toast.show {{ transform: translateX(-50%) translateY(0); }}

    [hidden] {{ display: none !important; }}
  </style>

  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "inLanguage": "fr-CA",
    "headline": {title_fr_json},
    "image": "https://zonetotalsport.ca/articles/images/heroes/{hero}",
    "datePublished": "{date}",
    "dateModified": "2026-04-29",
    "author": {{ "@type": "Person", "name": "Joey Root" }},
    "publisher": {{ "@type": "Organization", "name": "Zone Total Sport", "url": "https://zonetotalsport.ca" }},
    "description": {desc_fr_json},
    "keywords": "{keywords}"
  }}
  </script>
</head>
<body>

  <div class="scroll-progress" id="scrollProgress" style="transform: scaleX(0)"></div>

  <header class="zts-header">
    <div class="zts-header-inner">
      <a href="https://zonetotalsport.ca/" class="zts-logo-link" aria-label="Zone Total Sport">
        <img src="../bucheron-hero.png" alt="Mr Root" data-fr="Mr Root" data-en="Mr Root" data-es="Mr Root" data-zh="Mr Root">
      </a>

      <nav class="zts-nav-row">
        <a href="https://zonetotalsport.ca/" class="wix-nav-btn">
          <i data-lucide="home" class="w-7 h-7"></i>
          <span data-i18n><span lang="fr">Accueil</span><span lang="en" hidden>Home</span><span lang="es" hidden>Inicio</span><span lang="zh" hidden>首页</span></span>
        </a>
        <a href="https://zonetotalsport.ca/?open=https%3A%2F%2Feducatifs.zonetotalsport.ca" class="wix-nav-btn">
          <i data-lucide="wrench" class="w-7 h-7"></i>
          <span data-i18n><span lang="fr">Outils</span><span lang="en" hidden>Tools</span><span lang="es" hidden>Herramientas</span><span lang="zh" hidden>工具</span></span>
        </a>
        <a href="https://zonetotalsport.ca/?open=https%3A%2F%2Fsae.zonetotalsport.ca" class="wix-nav-btn">
          <i data-lucide="clipboard-list" class="w-7 h-7"></i>
          <span data-i18n><span lang="fr">S.A.E</span><span lang="en" hidden>L.E.S</span><span lang="es" hidden>S.A.E</span><span lang="zh" hidden>学习活动</span></span>
        </a>
        <a href="https://zonetotalsport.ca/?open=https%3A%2F%2Fjeux.zonetotalsport.ca" class="wix-nav-btn">
          <i data-lucide="gamepad-2" class="w-7 h-7"></i>
          <span data-i18n><span lang="fr">Jeux</span><span lang="en" hidden>Games</span><span lang="es" hidden>Juegos</span><span lang="zh" hidden>游戏</span></span>
        </a>
        <a href="../blog.html" class="wix-nav-btn active">
          <i data-lucide="pen-line" class="w-7 h-7"></i>
          <span data-i18n><span lang="fr">Blog</span><span lang="en" hidden>Blog</span><span lang="es" hidden>Blog</span><span lang="zh" hidden>博客</span></span>
        </a>
        <a href="https://zonetotalsport.ca/?open=https%3A%2F%2Fmusique.zonetotalsport.ca" class="wix-nav-btn">
          <i data-lucide="music" class="w-7 h-7"></i>
          <span data-i18n><span lang="fr">Musique</span><span lang="en" hidden>Music</span><span lang="es" hidden>Música</span><span lang="zh" hidden>音乐</span></span>
        </a>
        <a href="https://zonetotalsport.ca/?open=https%3A%2F%2Fevaluation.zonetotalsport.ca" class="wix-nav-btn">
          <i data-lucide="book-open" class="w-7 h-7"></i>
          <span data-i18n><span lang="fr">Carnet</span><span lang="en" hidden>Notebook</span><span lang="es" hidden>Cuaderno</span><span lang="zh" hidden>评估册</span></span>
        </a>
        <a href="../avis.html" class="wix-nav-btn">
          <i data-lucide="star" class="w-7 h-7"></i>
          <span data-i18n><span lang="fr">Avis</span><span lang="en" hidden>Reviews</span><span lang="es" hidden>Opiniones</span><span lang="zh" hidden>评价</span></span>
        </a>
        <a href="../wix/donation.html" class="wix-nav-btn btn-donate-nav">
          <i data-lucide="heart" class="w-7 h-7"></i>
          <span data-i18n><span lang="fr">Dons</span><span lang="en" hidden>Donate</span><span lang="es" hidden>Donar</span><span lang="zh" hidden>捐赠</span></span>
        </a>
        <a href="https://zonetotalsport.ca/?open=https%3A%2F%2Feducatifs.zonetotalsport.ca" class="wix-nav-btn btn-login-nav" id="zts-login-btn">
          <i data-lucide="user" class="w-7 h-7"></i>
          <span data-i18n><span lang="fr">Connexion</span><span lang="en" hidden>Login</span><span lang="es" hidden>Conectar</span><span lang="zh" hidden>登录</span></span>
        </a>
      </nav>

      <div class="zts-lang" role="group" aria-label="Language">
        <button class="lang-btn active" data-lang="fr" onclick="setLang('fr')">FR</button>
        <button class="lang-btn" data-lang="en" onclick="setLang('en')">EN</button>
        <button class="lang-btn" data-lang="es" onclick="setLang('es')">ES</button>
        <button class="lang-btn" data-lang="zh" onclick="setLang('zh')">中</button>
      </div>
    </div>
  </header>

  <div class="hero-full relative w-full h-[300px] md:h-[420px] overflow-hidden">
    <img src="images/heroes/{hero}"
         alt="{title_fr}"
         data-fr="{title_fr_attr}"
         data-en="{title_en_attr}"
         data-es="{title_es_attr}"
         data-zh="{title_zh_attr}"
         class="w-full h-full object-cover">
    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
    <div class="absolute top-6 left-6">
      <span class="inline-block px-4 py-2 rounded-full font-fredoka text-sm text-white" style="background:{badge_color}">
        <span data-i18n><span lang="fr">{cat_fr}</span><span lang="en" hidden>{cat_en}</span><span lang="es" hidden>{cat_es}</span><span lang="zh" hidden>{cat_zh}</span></span>
      </span>
    </div>
    <a href="../blog.html" class="absolute top-6 right-6 bg-white/90 backdrop-blur text-dark px-4 py-2 rounded-full font-fredoka text-sm hover:bg-white transition flex items-center gap-2 shadow-lg">
      <i data-lucide="arrow-left" class="w-4 h-4"></i>
      <span data-i18n><span lang="fr">Blog</span><span lang="en" hidden>Blog</span><span lang="es" hidden>Blog</span><span lang="zh" hidden>博客</span></span>
    </a>
  </div>

  <main class="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 -mt-16 relative z-10">

    <div class="bg-white rounded-2xl shadow-xl p-8 md:p-10 mb-8 border border-gray-100">
      <h1 class="font-bangers text-3xl md:text-4xl lg:text-[2.8rem] text-dark leading-tight mb-6" data-i18n>
        <span lang="fr">{title_fr}</span>
        <span lang="en" hidden>{title_en}</span>
        <span lang="es" hidden>{title_es}</span>
        <span lang="zh" hidden>{title_zh}</span>
      </h1>

      <div class="flex flex-wrap items-center gap-4 text-sm font-baloo text-dark/50 mb-6 pb-6 border-b border-gray-100">
        <div class="flex items-center gap-2">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-electric to-violet-pop flex items-center justify-center text-white font-fredoka text-sm">JR</div>
          <div>
            <p class="text-dark font-fredoka text-sm">Joey Root</p>
            <p class="text-dark/40 text-xs" data-i18n><span lang="fr">Enseignant en éducation physique</span><span lang="en" hidden>Physical Education Teacher</span><span lang="es" hidden>Profesor de Educación Física</span><span lang="zh" hidden>体育教师</span></p>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <i data-lucide="calendar" class="w-4 h-4"></i>
          <span>{date}</span>
        </div>
        <div class="flex items-center gap-1">
          <i data-lucide="clock" class="w-4 h-4"></i>
          <span data-i18n><span lang="fr">{read_time} min de lecture</span><span lang="en" hidden>{read_time} min read</span><span lang="es" hidden>{read_time} min de lectura</span><span lang="zh" hidden>{read_time}分钟阅读</span></span>
        </div>
      </div>

      <div style="background:linear-gradient(135deg,#FF2A7A,#FF6B9D);border-radius:16px;padding:16px 24px;margin-bottom:24px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;justify-content:center">
        <span style="font-family:'Bangers',cursive;color:#fff;font-size:1.3rem" data-i18n>
          <span lang="fr">❤️ Tu aimes Zone Total Sport?</span>
          <span lang="en" hidden>❤️ Do you love Zone Total Sport?</span>
          <span lang="es" hidden>❤️ ¿Te gusta Zone Total Sport?</span>
          <span lang="zh" hidden>❤️ 喜欢 Zone Total Sport 吗?</span>
        </span>
        <a href="../wix/donation.html" style="font-family:'Bangers',cursive;background:#FFD700;color:#333;padding:10px 24px;border-radius:999px;font-size:1.1rem;text-decoration:none;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(0,0,0,0.2)" data-i18n>
          <span lang="fr">💛 Faire un don</span>
          <span lang="en" hidden>💛 Donate</span>
          <span lang="es" hidden>💛 Donar</span>
          <span lang="zh" hidden>💛 捐赠</span>
        </a>
      </div>

      <div class="article-body">
{body}
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-md p-6 md:p-8 mb-8 border border-gray-100">
      <h3 class="font-fredoka text-sm text-dark/50 uppercase tracking-widest mb-4">
        <i data-lucide="tag" class="w-4 h-4 inline"></i>
        <span data-i18n><span lang="fr">Mots-clés</span><span lang="en" hidden>Keywords</span><span lang="es" hidden>Palabras clave</span><span lang="zh" hidden>关键词</span></span>
      </h3>
      <div class="flex flex-wrap gap-2">
{tags_html}
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-md p-6 md:p-8 mb-8 border border-gray-100">
      <h3 class="font-fredoka text-sm text-dark/50 uppercase tracking-widest mb-4">
        <i data-lucide="share-2" class="w-4 h-4 inline"></i>
        <span data-i18n><span lang="fr">Partager cet article</span><span lang="en" hidden>Share this article</span><span lang="es" hidden>Compartir este artículo</span><span lang="zh" hidden>分享这篇文章</span></span>
      </h3>
      <div class="flex flex-wrap gap-3">
        <button onclick="copyLink()" class="share-btn bg-dark text-white border-dark hover:bg-cyan-electric hover:text-dark hover:border-cyan-electric">
          <i data-lucide="link" class="w-4 h-4"></i>
          <span data-i18n><span lang="fr">Copier le lien</span><span lang="en" hidden>Copy link</span><span lang="es" hidden>Copiar enlace</span><span lang="zh" hidden>复制链接</span></span>
        </button>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https://zonetotalsport.ca/articles/{slug}.html" target="_blank" rel="noopener" class="share-btn bg-[#1877F2] text-white border-[#1877F2] hover:opacity-90">
          <i data-lucide="facebook" class="w-4 h-4"></i> Facebook
        </a>
        <a href="https://twitter.com/intent/tweet?url=https://zonetotalsport.ca/articles/{slug}.html" target="_blank" rel="noopener" class="share-btn bg-dark text-white border-dark hover:bg-dark/80">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> X
        </a>
        <a href="mailto:?subject={mail_subject}&body=https://zonetotalsport.ca/articles/{slug}.html" class="share-btn bg-violet-pop text-white border-violet-pop hover:opacity-90">
          <i data-lucide="mail" class="w-4 h-4"></i>
          <span data-i18n><span lang="fr">Courriel</span><span lang="en" hidden>Email</span><span lang="es" hidden>Correo</span><span lang="zh" hidden>电邮</span></span>
        </a>
        <a href="https://wa.me/?text=https://zonetotalsport.ca/articles/{slug}.html" target="_blank" rel="noopener" class="share-btn" style="background:#25D366;color:#fff;border-color:#25D366">
          <span>📱</span> WhatsApp
        </a>
      </div>
    </div>

    <div class="text-center mb-8">
      <button onclick="likeArticle(this)" class="like-btn" style="font-family:'Bangers',cursive;font-size:1.5rem;background:none;border:3px solid #FF2A7A;color:#FF2A7A;padding:12px 32px;border-radius:999px;cursor:pointer;transition:all 0.3s;display:inline-flex;align-items:center;gap:8px">
        <span class="like-heart">🤍</span>
        <span data-i18n><span lang="fr">J'aime cet article</span><span lang="en" hidden>I like this article</span><span lang="es" hidden>Me gusta este artículo</span><span lang="zh" hidden>我喜欢这篇文章</span></span>
        <span class="like-count" style="background:#FF2A7A;color:#fff;padding:2px 10px;border-radius:999px;font-size:1rem">0</span>
      </button>
    </div>

    <div style="background:rgba(255,255,255,0.95);border-radius:20px;padding:24px;border:2px solid #e5e7eb;margin-bottom:24px">
      <h3 style="font-family:'Bangers',cursive;font-size:1.8rem;color:#0F0F2E;margin:0 0 16px" data-i18n>
        <span lang="fr">💬 Commentaires</span>
        <span lang="en" hidden>💬 Comments</span>
        <span lang="es" hidden>💬 Comentarios</span>
        <span lang="zh" hidden>💬 评论</span>
      </h3>
      <div id="comments-list" style="margin-bottom:16px"></div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <input type="text" id="comment-name"
               placeholder="Ton prénom..."
               data-fr="Ton prénom..." data-en="Your first name..." data-es="Tu nombre..." data-zh="你的名字..."
               style="font-family:'Schoolbell',cursive;padding:10px 16px;border:2px solid #e5e7eb;border-radius:12px;font-size:1.1rem;outline:none"
               onfocus="this.style.borderColor='#00E5FF'" onblur="this.style.borderColor='#e5e7eb'">
        <textarea id="comment-text" rows="3"
                  placeholder="Écris ton commentaire..."
                  data-fr="Écris ton commentaire..." data-en="Write your comment..." data-es="Escribe tu comentario..." data-zh="写下你的评论..."
                  style="font-family:'Schoolbell',cursive;padding:10px 16px;border:2px solid #e5e7eb;border-radius:12px;font-size:1.1rem;outline:none;resize:vertical"
                  onfocus="this.style.borderColor='#00E5FF'" onblur="this.style.borderColor='#e5e7eb'"></textarea>
        <button onclick="postComment()" style="font-family:'Bangers',cursive;background:linear-gradient(135deg,#00E5FF,#0097A7);color:#fff;padding:12px 24px;border:none;border-radius:999px;font-size:1.2rem;cursor:pointer;align-self:flex-start;transition:all 0.2s" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          <span data-i18n><span lang="fr">📤 Publier</span><span lang="en" hidden>📤 Post</span><span lang="es" hidden>📤 Publicar</span><span lang="zh" hidden>📤 发布</span></span>
        </button>
      </div>
    </div>

    <div class="text-center py-8 mb-8">
      <a href="../blog.html" class="inline-flex items-center gap-3 bg-dark text-white font-fredoka text-lg px-8 py-4 rounded-full hover:bg-cyan-electric hover:text-dark transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
        <i data-lucide="arrow-left" class="w-5 h-5"></i>
        <span data-i18n><span lang="fr">Retour au blog</span><span lang="en" hidden>Back to blog</span><span lang="es" hidden>Volver al blog</span><span lang="zh" hidden>返回博客</span></span>
      </a>
    </div>

  </main>

  <footer class="bg-yellow-sun py-16 px-6 md:px-10">
    <div class="max-w-7xl mx-auto">
      <div class="grid md:grid-cols-4 gap-10 mb-12">
        <div class="md:col-span-2">
          <img src="../logo-zts.png" alt="Zone Total Sport" class="h-14 w-auto mb-4">
          <p class="text-dark/60 font-baloo text-sm max-w-sm mb-6" data-i18n>
            <span lang="fr">La plateforme gratuite de ressources en éducation physique pour les enseignants du primaire au Québec.</span>
            <span lang="en" hidden>The free platform of physical education resources for elementary-school teachers in Québec.</span>
            <span lang="es" hidden>La plataforma gratuita de recursos de educación física para maestros de primaria en Quebec.</span>
            <span lang="zh" hidden>魁北克小学教师免费的体育教育资源平台。</span>
          </p>
          <div class="flex gap-3">
            <a href="https://www.facebook.com/zonetotalsportparMr.Roots/" target="_blank" rel="noopener" class="w-10 h-10 rounded-full bg-dark/10 flex items-center justify-center hover:bg-dark/20 transition-colors text-dark"><i data-lucide="facebook" class="w-5 h-5"></i></a>
            <a href="https://www.instagram.com/zonetotalsportparmrroots/" target="_blank" rel="noopener" class="w-10 h-10 rounded-full bg-dark/10 flex items-center justify-center hover:bg-dark/20 transition-colors text-dark"><i data-lucide="instagram" class="w-5 h-5"></i></a>
            <a href="https://www.youtube.com/@zonetotalsportparMrRoots" target="_blank" rel="noopener" class="w-10 h-10 rounded-full bg-dark/10 flex items-center justify-center hover:bg-dark/20 transition-colors text-dark"><i data-lucide="youtube" class="w-5 h-5"></i></a>
            <a href="https://www.tiktok.com/@zonetotalsport" target="_blank" rel="noopener" class="w-10 h-10 rounded-full bg-dark/10 flex items-center justify-center hover:bg-dark/20 transition-colors text-dark"><svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.19a8.16 8.16 0 004.76 1.53v-3.45a4.85 4.85 0 01-1-.58z"/></svg></a>
          </div>
        </div>
        <div>
          <h4 class="font-bangers text-sm text-dark/50 uppercase tracking-widest mb-4" data-i18n>
            <span lang="fr">Navigation</span><span lang="en" hidden>Navigation</span><span lang="es" hidden>Navegación</span><span lang="zh" hidden>导航</span>
          </h4>
          <ul class="space-y-2">
            <li><a href="https://zonetotalsport.ca/" class="text-dark/70 font-baloo text-sm hover:text-dark transition-colors" data-i18n><span lang="fr">Accueil</span><span lang="en" hidden>Home</span><span lang="es" hidden>Inicio</span><span lang="zh" hidden>首页</span></a></li>
            <li><a href="https://zonetotalsport.ca/?open=https%3A%2F%2Fjeux.zonetotalsport.ca" class="text-dark/70 font-baloo text-sm hover:text-dark transition-colors" data-i18n><span lang="fr">Banque de jeux</span><span lang="en" hidden>Games library</span><span lang="es" hidden>Banco de juegos</span><span lang="zh" hidden>游戏库</span></a></li>
            <li><a href="https://zonetotalsport.ca/?open=https%3A%2F%2Fsae.zonetotalsport.ca" class="text-dark/70 font-baloo text-sm hover:text-dark transition-colors">SAE</a></li>
            <li><a href="../blog.html" class="text-dark/70 font-baloo text-sm hover:text-dark transition-colors" data-i18n><span lang="fr">Blogue</span><span lang="en" hidden>Blog</span><span lang="es" hidden>Blog</span><span lang="zh" hidden>博客</span></a></li>
          </ul>
        </div>
        <div>
          <h4 class="font-bangers text-sm text-dark/50 uppercase tracking-widest mb-4" data-i18n>
            <span lang="fr">Infos</span><span lang="en" hidden>Info</span><span lang="es" hidden>Información</span><span lang="zh" hidden>信息</span>
          </h4>
          <ul class="space-y-2">
            <li><a href="/politique.html" class="text-dark/70 font-baloo text-sm hover:text-dark transition-colors" data-i18n><span lang="fr">Politique de confidentialité</span><span lang="en" hidden>Privacy policy</span><span lang="es" hidden>Política de privacidad</span><span lang="zh" hidden>隐私政策</span></a></li>
            <li><a href="../wix/donation.html" class="text-dark/70 font-baloo text-sm hover:text-dark transition-colors" data-i18n><span lang="fr">Faire un don</span><span lang="en" hidden>Donate</span><span lang="es" hidden>Donar</span><span lang="zh" hidden>捐赠</span></a></li>
            <li><a href="../avis.html" class="text-dark/70 font-baloo text-sm hover:text-dark transition-colors" data-i18n><span lang="fr">Laisser un avis</span><span lang="en" hidden>Leave a review</span><span lang="es" hidden>Dejar una opinión</span><span lang="zh" hidden>留下评价</span></a></li>
          </ul>
        </div>
      </div>
      <div class="border-t border-dark/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p class="text-dark/40 font-baloo text-sm" data-i18n>
          <span lang="fr">&copy; 2026 Zone Total Sport. Tous droits réservés.</span>
          <span lang="en" hidden>&copy; 2026 Zone Total Sport. All rights reserved.</span>
          <span lang="es" hidden>&copy; 2026 Zone Total Sport. Todos los derechos reservados.</span>
          <span lang="zh" hidden>&copy; 2026 Zone Total Sport。版权所有。</span>
        </p>
        <p class="text-dark/40 font-baloo text-sm" data-i18n>
          <span lang="fr">Fait avec 💛 au Québec</span>
          <span lang="en" hidden>Made with 💛 in Québec</span>
          <span lang="es" hidden>Hecho con 💛 en Quebec</span>
          <span lang="zh" hidden>用 💛 在魁北克制作</span>
        </p>
      </div>
    </div>
  </footer>

  <div class="bg-dark py-4 px-6 flex flex-col md:flex-row items-center justify-between gap-3">
    <p class="text-white/30 font-baloo text-xs" data-i18n>
      <span lang="fr">zonetotalsport.ca — Ressources EPS pour enseignants au primaire</span>
      <span lang="en" hidden>zonetotalsport.ca — PE resources for elementary teachers</span>
      <span lang="es" hidden>zonetotalsport.ca — Recursos de EF para maestros de primaria</span>
      <span lang="zh" hidden>zonetotalsport.ca — 小学教师体育资源</span>
    </p>
  </div>

  <div class="copy-toast" id="copyToast">
    <i data-lucide="check" class="w-4 h-4 inline"></i>
    <span data-i18n><span lang="fr">Lien copié!</span><span lang="en" hidden>Link copied!</span><span lang="es" hidden>¡Enlace copiado!</span><span lang="zh" hidden>链接已复制!</span></span>
  </div>

  <script>
    function setLang(l){{
      document.documentElement.lang = (l==='fr'?'fr-CA':l);
      document.querySelectorAll('[data-i18n]').forEach(function(parent){{
        parent.querySelectorAll(':scope > [lang]').forEach(function(s){{
          s.hidden = (s.getAttribute('lang') !== l);
        }});
      }});
      document.querySelectorAll('[data-fr]').forEach(function(el){{
        var v = el.getAttribute('data-' + l);
        if (v === null) return;
        var tag = el.tagName;
        if ((tag === 'INPUT' || tag === 'TEXTAREA') && 'placeholder' in el) {{
          el.placeholder = v;
        }} else if (tag === 'IMG') {{
          el.alt = v;
        }} else {{
          el.textContent = v;
        }}
      }});
      document.querySelectorAll('.lang-btn').forEach(function(b){{
        b.classList.toggle('active', b.dataset.lang === l);
      }});
      try {{ localStorage.setItem('zts_lang', l); }} catch(e){{}}
    }}
    (function(){{
      var l = 'fr';
      try {{ l = localStorage.getItem('zts_lang') || 'fr'; }} catch(e){{}}
      if (['fr','en','es','zh'].indexOf(l) === -1) l = 'fr';
      setLang(l);
    }})();

    lucide.createIcons();

    window.addEventListener('scroll', function() {{
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = docHeight > 0 ? scrollTop / docHeight : 0;
      document.getElementById('scrollProgress').style.transform = 'scaleX(' + progress + ')';
    }});

    function copyLink() {{
      navigator.clipboard.writeText(window.location.href).then(function() {{
        var toast = document.getElementById('copyToast');
        toast.classList.add('show');
        setTimeout(function() {{ toast.classList.remove('show'); }}, 2500);
      }});
    }}
  </script>

  <script src="../telegram-notify.js"></script>
  <script>
    function likeArticle(btn) {{
      var slug = window.location.pathname.split('/').pop().replace('.html','');
      var key = 'zts_like_' + slug;
      var liked = localStorage.getItem(key);
      if (liked) return;
      localStorage.setItem(key, '1');
      var heart = btn.querySelector('.like-heart');
      var count = btn.querySelector('.like-count');
      heart.textContent = '❤️';
      btn.style.background = '#FF2A7A';
      btn.style.color = '#fff';
      btn.style.borderColor = '#FF2A7A';
      count.textContent = parseInt(count.textContent) + 1;
    }}
    (function(){{
      var slug = window.location.pathname.split('/').pop().replace('.html','');
      var key = 'zts_like_' + slug;
      if (localStorage.getItem(key)) {{
        var btn = document.querySelector('.like-btn');
        if (btn) {{
          btn.querySelector('.like-heart').textContent = '❤️';
          btn.style.background = '#FF2A7A';
          btn.style.color = '#fff';
          btn.style.borderColor = '#FF2A7A';
        }}
      }}
    }})();

    function postComment() {{
      var name = document.getElementById('comment-name').value.trim();
      var text = document.getElementById('comment-text').value.trim();
      if (!name || !text) {{
        var l = document.documentElement.lang.slice(0,2);
        var msg = {{fr:'Remplis ton prénom et ton commentaire!', en:'Fill in your name and comment!', es:'¡Rellena tu nombre y comentario!', zh:'请填写姓名和评论!'}}[l] || 'Remplis ton prénom et ton commentaire!';
        return alert(msg);
      }}
      var slug = window.location.pathname.split('/').pop().replace('.html','');
      var key = 'zts_comments_' + slug;
      var comments = JSON.parse(localStorage.getItem(key) || '[]');
      comments.push({{name: name, text: text, date: new Date().toLocaleDateString('fr-CA')}});
      localStorage.setItem(key, JSON.stringify(comments));
      document.getElementById('comment-name').value = '';
      document.getElementById('comment-text').value = '';
      renderComments();
    }}
    function renderComments() {{
      var slug = window.location.pathname.split('/').pop().replace('.html','');
      var key = 'zts_comments_' + slug;
      var comments = JSON.parse(localStorage.getItem(key) || '[]');
      var list = document.getElementById('comments-list');
      if (!list) return;
      var l = document.documentElement.lang.slice(0,2);
      var emptyMsg = {{fr:'Aucun commentaire encore. Sois le premier!', en:'No comments yet. Be the first!', es:'Aún no hay comentarios. ¡Sé el primero!', zh:'还没有评论。来当第一个吧!'}}[l] || 'Aucun commentaire encore. Sois le premier!';
      if (comments.length === 0) {{
        list.innerHTML = '<p style="color:#999;font-family:Schoolbell,cursive;font-style:italic">' + emptyMsg + '</p>';
        return;
      }}
      list.innerHTML = comments.map(function(c) {{
        return '<div style="background:#f3f4f6;border-radius:12px;padding:12px 16px;margin-bottom:10px">' +
          '<div style="font-family:Bangers,cursive;color:#0F0F2E;font-size:1.1rem">' + c.name + ' <span style="font-family:Schoolbell,cursive;color:#999;font-size:0.85rem">' + c.date + '</span></div>' +
          '<p style="font-family:Schoolbell,cursive;color:#333;margin:4px 0 0;font-size:1.05rem">' + c.text + '</p></div>';
      }}).join('');
    }}
    renderComments();
  </script>

  <script src="/article-views.js"></script>
  <script>ztsCountView();</script>
</body>
</html>
'''

def attr_escape(s):
    return s.replace('"', '&quot;').replace("'", "&#x27;")

def render_tags(tags):
    """Build tag-pill HTML. Use first 5-7 tags from FR, with English/Spanish/Chinese fallback (just FR shown for body tags)."""
    out = []
    for t in tags[:7]:
        out.append(f'        <span class="tag-pill">{html.escape(t)}</span>')
    if not out:
        out.append('        <span class="tag-pill">éducation physique</span>')
    return '\n'.join(out)

def process_article(slug):
    src_path = ART_DIR / f"{slug}.html"
    content = src_path.read_text(encoding='utf-8')
    hero_file, cat_fr, cat_en, cat_es, cat_zh, badge_color = ARTICLES[slug]
    titles = TITLES[slug]
    descs = DESCRIPTIONS[slug]
    body = extract_body(content)
    if not body:
        print(f"WARN: empty body for {slug}", file=sys.stderr)
    body = clean_body(body, slug)
    date = extract_date(content)
    read_time = extract_read_time(content)
    tags = extract_tags(content)
    kw = ", ".join(tags) if tags else "éducation physique"

    # Build the rendered HTML
    output = TEMPLATE.format(
        slug=slug,
        hero=hero_file,
        title_fr=html.escape(titles["fr"]),
        title_en=html.escape(titles["en"]),
        title_es=html.escape(titles["es"]),
        title_zh=html.escape(titles["zh"]),
        title_fr_attr=attr_escape(titles["fr"]),
        title_en_attr=attr_escape(titles["en"]),
        title_es_attr=attr_escape(titles["es"]),
        title_zh_attr=attr_escape(titles["zh"]),
        title_fr_json=json.dumps(titles["fr"], ensure_ascii=False),
        desc_fr=html.escape(descs["fr"]),
        desc_fr_json=json.dumps(descs["fr"], ensure_ascii=False),
        cat_fr=html.escape(cat_fr),
        cat_en=html.escape(cat_en),
        cat_es=html.escape(cat_es),
        cat_zh=html.escape(cat_zh),
        badge_color=badge_color,
        date=date,
        read_time=read_time,
        keywords=html.escape(kw),
        tags_html=render_tags(tags),
        body=body,
        mail_subject=html.escape(titles["fr"][:60]),
    )
    src_path.write_text(output, encoding='utf-8')
    return len(body), len(tags)

def main():
    summary = []
    for slug in ARTICLES:
        try:
            blen, ntags = process_article(slug)
            summary.append((slug, "OK", blen, ntags))
        except Exception as e:
            summary.append((slug, f"ERR: {e}", 0, 0))
    for s in summary:
        print(s)

if __name__ == "__main__":
    main()
