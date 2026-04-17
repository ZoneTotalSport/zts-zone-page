#!/usr/bin/env python3
"""Merge 4 HTML files into one accueil.html with proper JS deduplication"""
import re, os

BASE = "/Users/admin/Desktop/Remotion 2/wix-deploy/wix"

def read(name):
    with open(os.path.join(BASE, name), encoding='utf-8') as f:
        return f.read()

def extract_body(html):
    m = re.search(r'<body[^>]*>(.*?)</body>', html, re.DOTALL | re.IGNORECASE)
    return m.group(1).strip() if m else html

# Read all files
a = read('group-a-hero.html')
b = read('group-b-content.html')
c = read('group-c-footer.html')
d = read('comic-tools.html')

body_a = extract_body(a)
body_b = extract_body(b)
body_c = extract_body(c)
body_d = extract_body(d)

def remove_declaration(text, start_pattern, open_char, close_char, after_pattern=None):
    """Find a declaration matching start_pattern, then use bracket counting to find
    its exact end, and remove it (plus optional trailing after_pattern).
    Returns (new_text, was_removed)."""
    m = re.search(start_pattern, text)
    if not m:
        return text, False
    # Find the opening bracket
    open_pos = text.find(open_char, m.start())
    if open_pos == -1:
        return text, False
    # Count brackets to find matching close
    depth = 0
    pos = open_pos
    while pos < len(text):
        if text[pos] == open_char:
            depth += 1
        elif text[pos] == close_char:
            depth -= 1
            if depth == 0:
                end_pos = pos + 1
                break
        pos += 1
    else:
        return text, False
    # Include trailing semicolon and optional after_pattern
    # Skip whitespace then semicolon
    tail_pos = end_pos
    while tail_pos < len(text) and text[tail_pos] in ' \t':
        tail_pos += 1
    if tail_pos < len(text) and text[tail_pos] == ';':
        tail_pos += 1
    # Optionally match after_pattern (e.g., window.setLang = setLang;)
    if after_pattern:
        am = re.match(after_pattern, text[tail_pos:], re.DOTALL)
        if am:
            tail_pos += am.end()
    # Include leading newline/spaces before the declaration
    lead_pos = m.start()
    # Go back to start of line
    while lead_pos > 0 and text[lead_pos-1] in ' \t':
        lead_pos -= 1
    if lead_pos > 0 and text[lead_pos-1] == '\n':
        lead_pos -= 1
    new_text = text[:lead_pos] + '\n' + text[tail_pos:]
    return new_text, True

def remove_i18n_block_from_script(script_content):
    """Remove only the i18nMap array, i18n object, and setLang function from a script block.
    Leave everything else (spinSlot, shareZone, notifyParent, gamesI18n, etc.) intact."""
    # Remove any preceding comment line like // ===== i18n =====
    script_content = re.sub(r'\n[ \t]*//[ \t]*=+[ \t]*i18n[^\n]*\n', '\n', script_content)
    # Remove: const i18nMap = [...];
    script_content, _ = remove_declaration(script_content, r'const\s+i18nMap\s*=\s*\[', '[', ']')
    # Remove: const i18n = {...};
    script_content, _ = remove_declaration(script_content, r'const\s+i18n\s*=\s*\{', '{', '}')
    # Remove: function setLang(lang) {...}  window.setLang = setLang;
    script_content, _ = remove_declaration(
        script_content,
        r'function\s+setLang\s*\(lang\)\s*\{',
        '{', '}',
        after_pattern=r'[\s\n]*window\.setLang\s*=\s*setLang;\s*\n?'
    )
    return script_content

def process_scripts_in_body(body):
    """Process all <script> blocks in a body: remove duplicate i18n declarations"""
    def replacer(m):
        tag_open = m.group(1)
        content = m.group(2)
        cleaned = remove_i18n_block_from_script(content)
        return f'<script{tag_open}>{cleaned}</script>'
    return re.sub(r'<script([^>]*)>(.*?)</script>', replacer, body, flags=re.DOTALL)

# Process bodies: remove duplicate i18n from B and C (keep in unified block)
body_a_clean = process_scripts_in_body(body_a)
body_b_clean = process_scripts_in_body(body_b)
body_c_clean = process_scripts_in_body(body_c)

# Fix GROUP_ID collision in comic tools (it uses const at module level)
body_d_clean = body_d.replace("const GROUP_ID = 'comicTools';", "var COMIC_GROUP_ID = 'comicTools';")

# Unified i18n block - all translations combined
unified_i18n_script = '''<script>
// ========== UNIFIED i18n TRANSLATIONS (all groups) ==========
window.currentLang = window.currentLang || 'fr';

const i18nAllMaps = [
    // Group A
    ['[data-i18n="navJeux"]', 'navJeux'], ['[data-i18n="navRessources"]', 'navRes'],
    ['[data-i18n="navGenerateur"]', 'navGen'], ['[data-i18n="navAvis"]', 'navAvis'],
    ['[data-i18n="navDon"]', 'navDon'], ['[data-i18n="mobileDon"]', 'mobileDon'],
    ['[data-i18n="mobileJeux"]', 'navJeux'], ['[data-i18n="mobileRes"]', 'navRes'],
    ['[data-i18n="mobileGen"]', 'navGen'], ['[data-i18n="mobileAvis"]', 'navAvis'],
    ['[data-i18n="heroBadge"]', 'heroBadge'], ['[data-i18n="heroTitle"]', 'heroTitle'],
    ['[data-i18n="heroSub"]', 'heroSub'], ['[data-i18n="heroBtn1"]', 'heroBtn1'],
    ['[data-i18n="heroBtn2"]', 'heroBtn2'],
    ['[data-i18n="statJeux"]', 'statJeux'], ['[data-i18n="statSae"]', 'statSae'],
    ['[data-i18n="statEns"]', 'statEns'], ['[data-i18n="statGratuit"]', 'statGratuit'],
    ['[data-i18n="resTag"]', 'resTag'], ['[data-i18n="resTitle"]', 'resTitle'],
    ['[data-i18n="resSub"]', 'resSub'],
    ['[data-i18n="card1"]', 'card1'], ['[data-i18n="card1d"]', 'card1d'], ['[data-i18n="card1a"]', 'card1a'],
    ['[data-i18n="card2"]', 'card2'], ['[data-i18n="card2d"]', 'card2d'], ['[data-i18n="card2a"]', 'card2a'],
    ['[data-i18n="card3"]', 'card3'], ['[data-i18n="card3d"]', 'card3d'], ['[data-i18n="card3a"]', 'card3a'],
    ['[data-i18n="card4"]', 'card4'], ['[data-i18n="card4d"]', 'card4d'], ['[data-i18n="card4a"]', 'card4a'],
    ['[data-i18n="teaserTitle"]', 'teaserTitle'], ['[data-i18n="teaserSub"]', 'teaserSub'],
    ['[data-i18n="teaserBtn"]', 'teaserBtn'],
    // Group B
    ['[data-i18n="mission"]', 'mission'],
    ['[data-i18n="whyTitle"]', 'whyTitle'],
    ['[data-i18n="why1"]', 'why1'], ['[data-i18n="why1d"]', 'why1d'],
    ['[data-i18n="why2"]', 'why2'], ['[data-i18n="why2d"]', 'why2d'],
    ['[data-i18n="why3"]', 'why3'], ['[data-i18n="why3d"]', 'why3d'],
    ['[data-i18n="slotTag"]', 'slotTag'], ['[data-i18n="slotTitle"]', 'slotTitle'],
    ['[data-i18n="slotSub"]', 'slotSub'], ['[data-i18n="slotResult"]', 'slotResult'],
    ['[data-i18n="slotHow"]', 'slotHow'],
    ['[data-i18n="testTag"]', 'testTag'], ['[data-i18n="testTitle"]', 'testTitle'],
    ['[data-i18n="test1role"]', 'test1role'], ['[data-i18n="test1"]', 'test1'],
    ['[data-i18n="test2role"]', 'test2role'], ['[data-i18n="test2"]', 'test2'],
    ['[data-i18n="test3role"]', 'test3role'], ['[data-i18n="test3"]', 'test3'],
    ['[data-i18n="marqueeLabel"]', 'marqueeLabel'],
    ['[data-i18n="aluneTag"]', 'aluneTag'], ['[data-i18n="aluneTitle"]', 'aluneTitle'],
    ['[data-i18n="aluneSub"]', 'aluneSub'],
    ['[data-i18n="aluneC1"]', 'aluneC1'], ['[data-i18n="aluneD1"]', 'aluneD1'], ['[data-i18n="aluneC1d"]', 'aluneC1d'],
    ['[data-i18n="aluneC2"]', 'aluneC2'], ['[data-i18n="aluneD2"]', 'aluneD2'], ['[data-i18n="aluneC2d"]', 'aluneC2d'],
    ['[data-i18n="aluneC3"]', 'aluneC3'], ['[data-i18n="aluneD3"]', 'aluneD3'], ['[data-i18n="aluneC3d"]', 'aluneC3d'],
    ['[data-i18n="aluneC4"]', 'aluneC4'], ['[data-i18n="aluneD4"]', 'aluneD4'], ['[data-i18n="aluneC4d"]', 'aluneC4d'],
    ['[data-i18n="aluneCta"]', 'aluneCta'], ['[data-i18n="aluneBtn"]', 'aluneBtn'],
    // Group C
    ['[data-i18n="iaTag"]', 'iaTag'], ['[data-i18n="iaTitle"]', 'iaTitle'],
    ['[data-i18n="iaSub"]', 'iaSub'], ['[data-i18n="iaBadge"]', 'iaBadge'],
    ['[data-i18n="iaCardTitle"]', 'iaCardTitle'], ['[data-i18n="iaCardDesc"]', 'iaCardDesc'],
    ['[data-i18n="iaCardBtn"]', 'iaCardBtn'],
    ['[data-i18n="donTitle"]', 'donTitle'], ['[data-i18n="donSub"]', 'donSub'],
    ['[data-i18n="donBtn1"]', 'donBtn1'], ['[data-i18n="donBtn2"]', 'donBtn2'],
    ['[data-i18n="footerDesc"]', 'footerDesc'], ['[data-i18n="footerNav"]', 'footerNav'],
    ['[data-i18n="footerInfos"]', 'footerInfos'],
    ['[data-i18n="fAccueil"]', 'fAccueil'], ['[data-i18n="fJeux"]', 'fJeux'],
    ['[data-i18n="fSae"]', 'fSae'], ['[data-i18n="fBlogue"]', 'fBlogue'], ['[data-i18n="fContact"]', 'fContact'],
    ['[data-i18n="fAbout"]', 'fAbout'], ['[data-i18n="fPrivacy"]', 'fPrivacy'],
    ['[data-i18n="fDon"]', 'fDon'], ['[data-i18n="fTerms"]', 'fTerms'],
    ['[data-i18n="copyright"]', 'copyright'], ['[data-i18n="madeWith"]', 'madeWith'],
    ['[data-i18n="visitLabel"]', 'visitLabel'],
];

const i18nAll = {
    fr: {
        navJeux:'Jeux', navRes:'Ressources', navGen:'G&#233;n&#233;rateur', navAvis:'Avis',
        navDon:'<i data-lucide="heart" class="w-4 h-4"></i> Faire un don', mobileDon:'Faire un don',
        heroBadge:'+500 ressources gratuites pour l\'&#201;PS',
        heroTitle:'Ton gym,<br><span style="color:#FF2A7A">tes r&#232;gles.</span>',
        heroSub:'La plateforme <strong class="text-dark">100% gratuite</strong> qui transforme tes cours d\'&#233;ducation physique en exp&#233;riences &#233;piques.',
        heroBtn1:'G&#233;n&#233;rer un jeu', heroBtn2:'Explorer',
        statJeux:'Jeux', statSae:'SA&#201;', statEns:'Enseignants', statGratuit:'% Gratuit',
        resTag:'<i data-lucide="layers" class="w-4 h-4"></i> RESSOURCES',
        resTitle:'Tout ce qu\'il te faut,<br><span style="color:#FF2A7A">au m&#234;me endroit.</span>',
        resSub:'Des centaines de ressources pens&#233;es par et pour les profs d\'&#201;PS du primaire.',
        card1:'Banque de Jeux', card1d:'+500 jeux class&#233;s par cat&#233;gorie, &#226;ge et comp&#233;tence. Trouve le jeu parfait en secondes.', card1a:'Explorer <i data-lucide="arrow-right" class="w-4 h-4"></i>',
        card2:'SA&#201; Compl&#232;tes', card2d:'Situations d\'apprentissage cl&#233;s en main align&#233;es avec le PFEQ. Pr&#234;tes &#224; utiliser demain.', card2a:'D&#233;couvrir <i data-lucide="arrow-right" class="w-4 h-4"></i>',
        card3:'Blogue &#201;PS', card3d:'Articles, strat&#233;gies et r&#233;flexions sur l\'enseignement de l\'&#233;ducation physique au Qu&#233;bec.', card3a:'Lire <i data-lucide="arrow-right" class="w-4 h-4"></i>',
        card4:'Gestion de Classe', card4d:'Outils, routines et syst&#232;mes pour un gymnase organis&#233; et motivant. Fini le chaos!', card4a:'Organiser <i data-lucide="arrow-right" class="w-4 h-4"></i>',
        teaserTitle:'D&#233;couvre le g&#233;n&#233;rateur de jeux!', teaserSub:'50 jeux au hasard avec r&#232;gles compl&#232;tes. Parfait quand t\'es en panne d\'id&#233;es.',
        teaserBtn:'<i data-lucide="sparkles" class="w-5 h-5"></i> Essayer le g&#233;n&#233;rateur',
        mission:'Zone Total Sport, c\'est une plateforme cr&#233;&#233;e par <strong class="text-dark">des enseignants d\'&#201;PS du Qu&#233;bec</strong>, pour les enseignants d\'&#201;PS. Chaque jeu, chaque SA&#201; et chaque outil a &#233;t&#233; test&#233; sur le terrain. Notre mission : te simplifier la vie et rendre tes cours inoubliables.',
        whyTitle:'Ce qui rend la Zone<br><span style="color:#FFD700">diff&#233;rente.</span>',
        why1:'Gratuit. Pour vrai.', why1d:'Pas de freemium, pas de paywall. Toutes les ressources sont accessibles &#224; 100% sans cr&#233;er de compte.',
        why2:'Par des profs, pour des profs', why2d:'Chaque jeu et SA&#201; est cr&#233;&#233; et test&#233; par des enseignants du Qu&#233;bec. Du terrain, pas du bureau.',
        why3:'Pr&#234;t en 2 minutes', why3d:'Trouve un jeu, lis les r&#232;gles, c\'est parti. Toutes les ressources sont con&#231;ues pour &#234;tre utilisables imm&#233;diatement.',
        slotTag:'<i data-lucide="sparkles" class="w-4 h-4"></i> G&#201;N&#201;RATEUR',
        slotTitle:'Pas d\'id&#233;e?<br><span style="color:#FF2A7A">On s\'en occupe.</span>',
        slotSub:'Clique sur GO et laisse la magie op&#233;rer. Un jeu au hasard, parfait pour ta prochaine p&#233;riode!',
        slotResult:'Ton jeu du moment :', slotHow:'Comment jouer',
        testTag:'<i data-lucide="message-circle" class="w-4 h-4"></i> T&#201;MOIGNAGES',
        testTitle:'Ce qu\'ils en<br><span style="color:#8B5CF6">pensent.</span>',
        test1role:'Enseignante &#201;PS, Laval', test1:'"J\'utilise Zone Total Sport chaque semaine pour planifier mes cours. La banque de jeux est une mine d\'or! Mes &#233;l&#232;ves adorent les nouveaux jeux."',
        test2role:'Enseignant &#201;PS, Qu&#233;bec', test2:'"Le g&#233;n&#233;rateur de jeux est g&#233;nial quand je suis en panne d\'inspiration. En un clic, j\'ai une activit&#233; pr&#234;te &#224; lancer. Merci pour cette ressource!"',
        test3role:'&#201;tudiante B&#201;PEP, Montr&#233;al', test3:'"Indispensable pour mes stages! Les SA&#201; sont align&#233;es avec le programme et faciles &#224; adapter. Le site est devenu ma r&#233;f&#233;rence num&#233;ro un."',
        marqueeLabel:'Nos jeux populaires',
        aluneTag:'<i data-lucide="rocket" class="w-4 h-4"></i> &#192; VENIR',
        aluneTitle:'Ce qui s\'en vient<br><span class="gradient-text">dans la Zone!</span>',
        aluneSub:'Des nouveaut&#233;s excitantes arrivent bient&#244;t pour tes cours d\'&#201;PS!',
        aluneC1:'G&#233;n&#233;rateur IA v2', aluneD1:'Printemps 2026', aluneC1d:'La version 2 du g&#233;n&#233;rateur avec encore plus d\'options et de personnalisation!',
        aluneC2:'Application Mobile', aluneD2:'&#201;t&#233; 2026', aluneC2d:'Acc&#232;de &#224; toutes les ressources directement depuis ton t&#233;l&#233;phone, m&#234;me au gymnase!',
        aluneC3:'Mode Collaboratif', aluneD3:'Automne 2026', aluneC3d:'Partage et co-cr&#233;e des jeux avec d\'autres enseignants d\'&#201;PS partout au Qu&#233;bec!',
        aluneC4:'Tableau de Bord', aluneD4:'Hiver 2027', aluneC4d:'Suis ta progression, tes jeux favoris et tes stats de cours en un coup d\'oeil!',
        aluneCta:'Tu veux acc&#233;der &#224; tout &#231;a et bien plus?',
        aluneBtn:'<i data-lucide="crown" class="w-5 h-5"></i> Devenir membre gratuitement',
        iaTag:'<i data-lucide="sparkles" class="w-4 h-4"></i> NOUVEAUT&#201;',
        iaTitle:'Le futur de l\'&#201;PS<br><span style="color:#FF2A7A">est arriv&#233;!</span>',
        iaSub:'L\'intelligence artificielle d&#233;barque dans la Zone. Pr&#233;pare-toi!',
        iaBadge:'YOUHOU!',
        iaCardTitle:'G&#233;n&#233;rateur de Jeux IA',
        iaCardDesc:'D&#233;cris ton contexte, ton groupe et tes objectifs &#8212; l\'IA cr&#233;e un jeu sur mesure en quelques secondes. C\'est magique!',
        iaCardBtn:'<i data-lucide="zap" class="w-5 h-5"></i> D&#233;couvrir le G&#233;n&#233;rateur IA',
        donTitle:'Soutiens la<br><span style="color:#FFD700">Zone!</span>',
        donSub:'Zone Total Sport est 100% gratuit et le restera. Un petit don nous aide &#224; continuer de cr&#233;er du contenu de qualit&#233; pour les profs d\'&#201;PS.',
        donBtn1:'<i data-lucide="heart" class="w-5 h-5"></i> Faire un don',
        donBtn2:'<i data-lucide="share-2" class="w-5 h-5"></i> Partager le site',
        footerDesc:'La plateforme gratuite de ressources en &#233;ducation physique pour les enseignants du primaire au Qu&#233;bec.',
        footerNav:'Navigation', footerInfos:'Infos',
        fAccueil:'Accueil', fJeux:'Banque de jeux', fSae:'SA&#201;', fBlogue:'Blogue', fContact:'Contact',
        fAbout:'&#192; propos', fPrivacy:'Politique de confidentialit&#233;', fDon:'Faire un don', fTerms:'Conditions d\'utilisation',
        copyright:'&#169; 2026 Zone Total Sport. Tous droits r&#233;serv&#233;s.', madeWith:'Fait avec &#128155; au Qu&#233;bec',
        visitLabel:'Visiteurs :',
    },
    en: {
        navJeux:'Games', navRes:'Resources', navGen:'Generator', navAvis:'Reviews',
        navDon:'<i data-lucide="heart" class="w-4 h-4"></i> Donate', mobileDon:'Donate',
        heroBadge:'+500 free resources for PE teachers',
        heroTitle:'Your gym,<br><span style="color:#FF2A7A">your rules.</span>',
        heroSub:'The <strong class="text-dark">100% free</strong> platform that transforms your physical education classes into epic experiences.',
        heroBtn1:'Generate a game', heroBtn2:'Explore',
        statJeux:'Games', statSae:'Units', statEns:'Teachers', statGratuit:'% Free',
        resTag:'<i data-lucide="layers" class="w-4 h-4"></i> RESOURCES',
        resTitle:'Everything you need,<br><span style="color:#FF2A7A">in one place.</span>',
        resSub:'Hundreds of resources designed by and for elementary PE teachers.',
        card1:'Game Bank', card1d:'+500 games sorted by category, age and skill. Find the perfect game in seconds.', card1a:'Explore <i data-lucide="arrow-right" class="w-4 h-4"></i>',
        card2:'Full Units', card2d:'Ready-to-use learning situations aligned with the curriculum. Ready for tomorrow.', card2a:'Discover <i data-lucide="arrow-right" class="w-4 h-4"></i>',
        card3:'PE Blog', card3d:'Articles, strategies and reflections on teaching physical education in Quebec.', card3a:'Read <i data-lucide="arrow-right" class="w-4 h-4"></i>',
        card4:'Class Management', card4d:'Tools, routines and systems for an organized and motivating gymnasium. No more chaos!', card4a:'Organize <i data-lucide="arrow-right" class="w-4 h-4"></i>',
        teaserTitle:'Discover the game generator!', teaserSub:'50 random games with full rules. Perfect when you\'re out of ideas.',
        teaserBtn:'<i data-lucide="sparkles" class="w-5 h-5"></i> Try the generator',
        mission:'Zone Total Sport is a platform created by <strong class="text-dark">Quebec PE teachers</strong>, for PE teachers. Every game, every unit and every tool has been field-tested. Our mission: simplify your life and make your classes unforgettable.',
        whyTitle:'What makes the Zone<br><span style="color:#FFD700">different.</span>',
        why1:'Free. For real.', why1d:'No freemium, no paywall. All resources are 100% accessible without creating an account.',
        why2:'By teachers, for teachers', why2d:'Every game and unit is created and tested by Quebec teachers. From the field, not the desk.',
        why3:'Ready in 2 minutes', why3d:'Find a game, read the rules, let\'s go. All resources are designed to be usable immediately.',
        slotTag:'<i data-lucide="sparkles" class="w-4 h-4"></i> GENERATOR',
        slotTitle:'No ideas?<br><span style="color:#FF2A7A">We got you.</span>',
        slotSub:'Click GO and let the magic happen. A random game, perfect for your next period!',
        slotResult:'Your game of the moment:', slotHow:'How to play',
        testTag:'<i data-lucide="message-circle" class="w-4 h-4"></i> TESTIMONIALS',
        testTitle:'What they<br><span style="color:#8B5CF6">think.</span>',
        test1role:'PE Teacher, Laval', test1:'"I use Zone Total Sport every week to plan my classes. The game bank is a gold mine! My students love the new games."',
        test2role:'PE Teacher, Quebec City', test2:'"The game generator is amazing when I\'m out of inspiration. One click, and I have an activity ready to go. Thanks for this resource!"',
        test3role:'Student Teacher, Montreal', test3:'"Essential for my internships! The units are aligned with the curriculum and easy to adapt. The site has become my number one reference."',
        marqueeLabel:'Our popular games',
        aluneTag:'<i data-lucide="rocket" class="w-4 h-4"></i> COMING SOON',
        aluneTitle:'What\'s coming<br><span class="gradient-text">to the Zone!</span>',
        aluneSub:'Exciting new features are coming soon for your PE classes!',
        aluneC1:'AI Generator v2', aluneD1:'Spring 2026', aluneC1d:'Version 2 of the generator with even more options and customization!',
        aluneC2:'Mobile App', aluneD2:'Summer 2026', aluneC2d:'Access all resources directly from your phone, even in the gym!',
        aluneC3:'Collaborative Mode', aluneD3:'Fall 2026', aluneC3d:'Share and co-create games with other PE teachers across Quebec!',
        aluneC4:'Dashboard', aluneD4:'Winter 2027', aluneC4d:'Track your progress, favorite games and class stats at a glance!',
        aluneCta:'Want access to all this and more?',
        aluneBtn:'<i data-lucide="crown" class="w-5 h-5"></i> Become a free member',
        iaTag:'<i data-lucide="sparkles" class="w-4 h-4"></i> NEW FEATURE',
        iaTitle:'The future of PE<br><span style="color:#FF2A7A">is here!</span>',
        iaSub:'Artificial intelligence arrives in the Zone. Get ready!',
        iaBadge:'WOOHOO!',
        iaCardTitle:'AI Game Generator',
        iaCardDesc:'Describe your context, group and goals &#8212; AI creates a custom game in seconds. It\'s magic!',
        iaCardBtn:'<i data-lucide="zap" class="w-5 h-5"></i> Discover the AI Generator',
        donTitle:'Support the<br><span style="color:#FFD700">Zone!</span>',
        donSub:'Zone Total Sport is 100% free and always will be. A small donation helps us keep creating quality content for PE teachers.',
        donBtn1:'<i data-lucide="heart" class="w-5 h-5"></i> Donate',
        donBtn2:'<i data-lucide="share-2" class="w-5 h-5"></i> Share the site',
        footerDesc:'The free physical education resource platform for elementary teachers in Quebec.',
        footerNav:'Navigation', footerInfos:'Info',
        fAccueil:'Home', fJeux:'Game bank', fSae:'Units', fBlogue:'Blog', fContact:'Contact',
        fAbout:'About', fPrivacy:'Privacy policy', fDon:'Donate', fTerms:'Terms of use',
        copyright:'&#169; 2026 Zone Total Sport. All rights reserved.', madeWith:'Made with &#128155; in Quebec',
        visitLabel:'Visitors:',
    },
    zh: {
        navJeux:'&#28216;&#25103;', navRes:'&#36164;&#28304;', navGen:'&#29983;&#25104;&#22120;', navAvis:'&#35780;&#20215;',
        navDon:'<i data-lucide="heart" class="w-4 h-4"></i> &#25424;&#36192;', mobileDon:'&#25424;&#36192;',
        heroBadge:'+500&#20010;&#20813;&#36153;&#20307;&#32946;&#25945;&#23398;&#36164;&#28304;',
        heroTitle:'&#20320;&#30340;&#20307;&#32946;&#39302;&#65292;<br><span style="color:#FF2A7A">&#20320;&#30340;&#35268;&#21017;&#12290;</span>',
        heroSub:'<strong class="text-dark">100%&#20813;&#36153;</strong>&#30340;&#24179;&#21488;&#65292;&#35753;&#20320;&#30340;&#20307;&#32946;&#35838;&#21464;&#25104;&#21490;&#35799;&#33324;&#30340;&#20307;&#39564;&#12290;',
        heroBtn1:'&#29983;&#25104;&#28216;&#25103;', heroBtn2:'&#25506;&#32034;',
        statJeux:'&#28216;&#25103;', statSae:'&#25945;&#23398;&#21333;&#20803;', statEns:'&#25945;&#24072;', statGratuit:'% &#20813;&#36153;',
        resTag:'<i data-lucide="layers" class="w-4 h-4"></i> &#36164;&#28304;',
        resTitle:'&#20320;&#38656;&#35201;&#30340;&#19968;&#20999;&#65292;<br><span style="color:#FF2A7A">&#37117;&#22312;&#36825;&#37324;&#12290;</span>',
        resSub:'&#25968;&#30334;&#31181;&#19987;&#20026;&#23567;&#23398;&#20307;&#32946;&#25945;&#24072;&#35774;&#35745;&#30340;&#36164;&#28304;&#12290;',
        card1:'&#28216;&#25103;&#24211;', card1d:'+500&#20010;&#25353;&#31867;&#21035;&#12289;&#24180;&#40836;&#21644;&#25216;&#33021;&#20998;&#31867;&#30340;&#28216;&#25103;&#12290;', card1a:'&#25506;&#32034; <i data-lucide="arrow-right" class="w-4 h-4"></i>',
        card2:'&#23436;&#25972;&#25945;&#23398;&#21333;&#20803;', card2d:'&#19982;&#35838;&#31243;&#26631;&#20934;&#23545;&#40784;&#30340;&#21363;&#29992;&#22411;&#23398;&#20064;&#24773;&#22659;&#12290;', card2a:'&#21457;&#29616; <i data-lucide="arrow-right" class="w-4 h-4"></i>',
        card3:'&#20307;&#32946;&#21338;&#23458;', card3d:'&#20851;&#20110;&#39745;&#21271;&#20811;&#20307;&#32946;&#25945;&#23398;&#30340;&#25991;&#31456;&#21644;&#31574;&#30053;&#12290;', card3a:'&#38405;&#35835; <i data-lucide="arrow-right" class="w-4 h-4"></i>',
        card4:'&#35838;&#22530;&#31649;&#29702;', card4d:'&#35753;&#20307;&#32946;&#39302;&#20117;&#28982;&#26377;&#24207;&#30340;&#24037;&#20855;&#21644;&#31995;&#32479;&#12290;', card4a:'&#32452;&#32455; <i data-lucide="arrow-right" class="w-4 h-4"></i>',
        teaserTitle:'&#21457;&#29616;&#28216;&#25103;&#29983;&#25104;&#22120;&#65281;', teaserSub:'50&#20010;&#38543;&#26426;&#28216;&#25103;&#65292;&#38468;&#23436;&#25972;&#35268;&#21017;&#12290;',
        teaserBtn:'<i data-lucide="sparkles" class="w-5 h-5"></i> &#35797;&#35797;&#29983;&#25104;&#22120;',
        mission:'Zone Total Sport&#26159;&#30001;<strong class="text-dark">&#39745;&#21271;&#20811;&#20307;&#32946;&#25945;&#24072;</strong>&#21019;&#24314;&#30340;&#24179;&#21488;&#12290;&#27599;&#20010;&#28216;&#25103;&#21644;&#24037;&#20855;&#37117;&#32463;&#36807;&#23454;&#22320;&#27979;&#35797;&#12290;&#25105;&#20204;&#30340;&#20351;&#21629;&#65306;&#31616;&#21270;&#20320;&#30340;&#29983;&#27963;&#65292;&#35753;&#20320;&#30340;&#35838;&#31243;&#38590;&#20197;&#24536;&#24576;&#12290;',
        whyTitle:'&#26159;&#20160;&#20040;&#35753;Zone<br><span style="color:#FFD700">&#19982;&#20247;&#19981;&#21516;&#12290;</span>',
        why1:'&#30495;&#27491;&#20813;&#36153;&#12290;', why1d:'&#27809;&#26377;&#20184;&#36153;&#22681;&#12290;&#25152;&#26377;&#36164;&#28304;100%&#20813;&#36153;&#12290;',
        why2:'&#25945;&#24072;&#20026;&#25945;&#24072;&#25171;&#36896;', why2d:'&#27599;&#20010;&#28216;&#25103;&#37117;&#30001;&#39745;&#21271;&#20811;&#25945;&#24072;&#21019;&#24314;&#21644;&#27979;&#35797;&#12290;',
        why3:'2&#20998;&#38047;&#20934;&#22791;&#23601;&#32490;', why3d:'&#25214;&#21040;&#28216;&#25103;&#65292;&#38405;&#35835;&#35268;&#21017;&#65292;&#24320;&#22987;&#21543;&#12290;',
        slotTag:'<i data-lucide="sparkles" class="w-4 h-4"></i> &#29983;&#25104;&#22120;',
        slotTitle:'&#27809;&#26377;&#24819;&#27861;&#65311;<br><span style="color:#FF2A7A">&#25105;&#20204;&#26469;&#24110;&#20320;&#12290;</span>',
        slotSub:'&#28857;&#20987;GO&#65292;&#35753;&#39764;&#27861;&#21457;&#29983;&#12290;&#23436;&#32654;&#36866;&#21512;&#20320;&#30340;&#19979;&#19968;&#33410;&#35838;&#65281;',
        slotResult:'&#20320;&#30340;&#24403;&#21069;&#28216;&#25103;&#65306;', slotHow:'&#22914;&#20309;&#29609;',
        testTag:'<i data-lucide="message-circle" class="w-4 h-4"></i> &#35780;&#20215;',
        testTitle:'&#20182;&#20204;&#24590;&#20040;<br><span style="color:#8B5CF6">&#35828;&#12290;</span>',
        test1role:'&#20307;&#32946;&#25945;&#24072;, &#25289;&#29926;&#23572;', test1:'"&#25105;&#27599;&#21608;&#37117;&#29992;Zone Total Sport&#26469;&#35745;&#21010;&#25105;&#30340;&#35838;&#31243;&#12290;&#28216;&#25103;&#24211;&#26159;&#19968;&#24231;&#37329;&#30719;&#65281;"',
        test2role:'&#20307;&#32946;&#25945;&#24072;, &#39745;&#21271;&#20811;&#24066;', test2:'"&#24403;&#25105;&#27809;&#26377;&#28789;&#24863;&#26102;&#65292;&#28216;&#25103;&#29983;&#25104;&#22120;&#22826;&#26834;&#20102;&#12290;&#19968;&#38190;&#23601;&#26377;&#19968;&#20010;&#27963;&#21160;&#20934;&#22791;&#22909;&#20102;&#65281;"',
        test3role:'&#23454;&#20064;&#25945;&#24072;, &#33945;&#29305;&#21033;&#23572;', test3:'"&#23545;&#25105;&#30340;&#23454;&#20064;&#26469;&#35828;&#19981;&#21487;&#25110;&#32570;&#65281;&#25945;&#23398;&#21333;&#20803;&#19982;&#35838;&#31243;&#23545;&#40784;&#65292;&#26131;&#20110;&#35843;&#25972;&#12290;"',
        marqueeLabel:'&#28909;&#38376;&#28216;&#25103;',
        aluneTag:'<i data-lucide="rocket" class="w-4 h-4"></i> &#21363;&#23558;&#25512;&#20986;',
        aluneTitle:'&#21363;&#23558;&#21040;&#26469;<br><span class="gradient-text">Zone&#26032;&#21151;&#33021;!</span>',
        aluneSub:'&#20196;&#20154;&#20852;&#22859;&#30340;&#26032;&#21151;&#33021;&#21363;&#23558;&#25512;&#20986;&#65281;',
        aluneC1:'AI&#29983;&#25104;&#22120; v2', aluneD1:'2026&#24180;&#26149;&#23395;', aluneC1d:'&#31532;&#20108;&#29256;&#29983;&#25104;&#22120;&#65292;&#26356;&#22810;&#36873;&#39033;&#21644;&#20010;&#24615;&#21270;&#21151;&#33021;&#65281;',
        aluneC2:'&#31227;&#21160;&#24212;&#29992;', aluneD2:'2026&#24180;&#22799;&#23395;', aluneC2d:'&#30452;&#25509;&#20174;&#25163;&#26426;&#35775;&#38382;&#25152;&#26377;&#36164;&#28304;&#65292;&#21363;&#20351;&#22312;&#20307;&#32946;&#39302;&#65281;',
        aluneC3:'&#21327;&#20316;&#27169;&#24335;', aluneD3:'2026&#24180;&#31179;&#23395;', aluneC3d:'&#19982;&#39745;&#21271;&#20811;&#21508;&#22320;&#30340;&#20307;&#32946;&#25945;&#24072;&#20998;&#20139;&#21644;&#20849;&#21019;&#28216;&#25103;&#65281;',
        aluneC4:'&#25511;&#21046;&#38754;&#26495;', aluneD4:'2027&#24180;&#20908;&#23395;', aluneC4d:'&#19968;&#30446;&#20102;&#28982;&#22320;&#36319;&#36394;&#20320;&#30340;&#36827;&#24230;&#12289;&#26368;&#29233;&#28216;&#25103;&#21644;&#35838;&#31243;&#32479;&#35745;&#65281;',
        aluneCta:'&#24819;&#35201;&#35775;&#38382;&#25152;&#26377;&#36825;&#20123;&#21644;&#26356;&#22810;&#65311;',
        aluneBtn:'<i data-lucide="crown" class="w-5 h-5"></i> &#20813;&#36153;&#25104;&#20026;&#20250;&#21592;',
        iaTag:'<i data-lucide="sparkles" class="w-4 h-4"></i> &#26032;&#21151;&#33021;',
        iaTitle:'&#20307;&#32946;&#25945;&#32946;&#30340;&#26410;&#26469;<br><span style="color:#FF2A7A">&#24050;&#32463;&#21040;&#26469;&#65281;</span>',
        iaSub:'&#20154;&#24037;&#26234;&#33021;&#30331;&#38470;Zone&#12290;&#20934;&#22791;&#22909;&#20102;&#21527;&#65281;',
        iaBadge:'&#22826;&#26834;&#20102;&#65281;',
        iaCardTitle:'AI&#28216;&#25103;&#29983;&#25104;&#22120;',
        iaCardDesc:'&#25551;&#36848;&#20320;&#30340;&#24773;&#22659;&#12289;&#29677;&#32423;&#21644;&#30446;&#26631;&#8212;AI&#22312;&#20960;&#31186;&#38047;&#20869;&#21019;&#24314;&#23450;&#21046;&#28216;&#25103;&#12290;&#22826;&#31070;&#22855;&#20102;&#65281;',
        iaCardBtn:'<i data-lucide="zap" class="w-5 h-5"></i> &#21457;&#29616;AI&#29983;&#25104;&#22120;',
        donTitle:'&#25903;&#25345;<br><span style="color:#FFD700">Zone&#65281;</span>',
        donSub:'Zone Total Sport&#26159;100%&#20813;&#36153;&#30340;&#12290;&#23567;&#39069;&#25424;&#36192;&#24110;&#21161;&#25105;&#20204;&#32487;&#32493;&#21019;&#36896;&#20248;&#36136;&#20869;&#23481;&#12290;',
        donBtn1:'<i data-lucide="heart" class="w-5 h-5"></i> &#25424;&#36192;',
        donBtn2:'<i data-lucide="share-2" class="w-5 h-5"></i> &#20998;&#20139;&#32593;&#31449;',
        footerDesc:'&#39745;&#21271;&#20811;&#23567;&#23398;&#20307;&#32946;&#25945;&#24072;&#30340;&#20813;&#36153;&#36164;&#28304;&#24179;&#21488;&#12290;',
        footerNav:'&#23548;&#33322;', footerInfos:'&#20449;&#24687;',
        fAccueil:'&#39318;&#39029;', fJeux:'&#28216;&#25103;&#24211;', fSae:'&#25945;&#23398;&#21333;&#20803;', fBlogue:'&#21338;&#23458;', fContact:'&#32852;&#31995;',
        fAbout:'&#20851;&#20110;', fPrivacy:'&#38544;&#31169;&#25919;&#31574;', fDon:'&#25424;&#36192;', fTerms:'&#20351;&#29992;&#26465;&#27454;',
        copyright:'&#169; 2026 Zone Total Sport. &#29256;&#26435;&#25152;&#26377;&#12290;', madeWith:'&#29992; &#128155; &#22312;&#39745;&#21271;&#20811;&#21046;&#20316;',
        visitLabel:'&#35775;&#23458;&#65306;',
    }
};

function setLang(lang) {
    const t = i18nAll[lang]; if (!t) return;
    window.currentLang = lang;
    i18nAllMaps.forEach(([sel, key]) => {
        document.querySelectorAll(sel).forEach(el => { if (t[key] !== undefined) el.innerHTML = t[key]; });
    });
    if (window.populateSlot) window.populateSlot();
    lucide.createIcons();
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang === 'en' ? 'en' : 'fr-CA';
    window.parent.postMessage({ type: 'langChanged', lang: lang }, '*');
}
window.setLang = setLang;
</script>'''

# Combined CSS
combined_style = """
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; overflow-x: hidden; }
    body { font-family: 'Patrick Hand', cursive; font-size: 1.15rem; background-color: #ffffff; color: #1a1a2e; overflow-x: hidden; position: relative; }
    .section-cyan { background: #00E5FF; }
    .section-pink { background: #FF2A7A; color: #fff; }
    .section-gray { background: #F5F5F5; }
    .section-violet { background: #8B5CF6; color: #fff; }
    .section-yellow { background: #FFD700; }
    .section-dark { background: #0F0F2E; color: #fff; }
    .wave-divider { width: 100%; overflow: hidden; line-height: 0; position: relative; z-index: 2; }
    .wave-divider svg { display: block; width: 100%; height: 70px; }
    @media (max-width: 768px) { .wave-divider svg { height: 40px; } }
    .hero-title { font-family: 'Luckiest Guy', cursive; font-weight: 400; line-height: 1.1; letter-spacing: 0.04em; text-shadow: 3px 3px 0 rgba(0,0,0,0.12); }
    .gradient-text { background: linear-gradient(135deg, #FFD700, #FF2A7A, #8B5CF6); background-size: 300% 300%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: gradientShift 4s ease infinite; }
    @keyframes gradientShift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
    .floating-emoji { position: absolute; font-size: 2.5rem; pointer-events: none; will-change: transform; z-index: 1; }
    @media (max-width: 768px) { .floating-emoji { font-size: 1.5rem; } }
    .btn-primary { display: inline-flex; align-items: center; gap: 10px; padding: 16px 36px; border-radius: 12px; font-family: 'Luckiest Guy', cursive; font-weight: 400; font-size: 1.15rem; letter-spacing: 0.03em; border: none; cursor: pointer; position: relative; overflow: hidden; transition: transform 0.2s, box-shadow 0.3s; text-decoration: none; }
    .btn-primary:hover { transform: translateY(-2px); }
    .btn-primary.btn-cyan { background: linear-gradient(135deg, #00E5FF, #00B8D4); color: #0F0F2E; box-shadow: 0 8px 30px rgba(0,229,255,0.3); }
    .btn-primary.btn-dark { background: #0F0F2E; color: #fff; box-shadow: 0 8px 30px rgba(0,0,0,0.15); }
    .btn-primary.btn-yellow { background: linear-gradient(135deg, #FFD700, #FFA000); color: #0F0F2E; box-shadow: 0 8px 30px rgba(255,215,0,0.3); }
    .btn-primary.btn-pink { background: linear-gradient(135deg, #FF2A7A, #E91E63); color: #fff; box-shadow: 0 8px 30px rgba(255,42,122,0.3); }
    .btn-outline-dark { display: inline-flex; align-items: center; gap: 10px; padding: 16px 36px; border-radius: 12px; font-family: 'Luckiest Guy', cursive; font-weight: 400; font-size: 1.15rem; letter-spacing: 0.03em; background: transparent; border: 2px solid #0F0F2E; color: #0F0F2E; cursor: pointer; transition: background 0.3s, color 0.3s; }
    .btn-outline-dark:hover { background: #0F0F2E; color: #fff; }
    .magnetic-wrap { display: inline-block; position: relative; }
    .section-tag { display: inline-flex; align-items: center; gap: 6px; padding: 8px 18px; border-radius: 8px; font-size: 0.95rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; }
    @media (min-width: 1024px) { .stagger-grid > :nth-child(even) { transform: translateY(40px); } }
    .service-card { border-radius: 24px; padding: 40px 28px; position: relative; overflow: hidden; transition: transform 0.1s ease-out, box-shadow 0.3s; min-height: 320px; }
    .service-card:hover { box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
    .service-card .card-number { position: absolute; top: -10px; right: -5px; font-family: 'Luckiest Guy', cursive; font-size: 8rem; line-height: 1; opacity: 0.12; pointer-events: none; }
    .tilt-card { transform-style: preserve-3d; perspective: 800px; }
    .tilt-card-inner { transform-style: preserve-3d; transition: transform 0.1s ease-out; }
    .tilt-card-inner .tilt-icon { transform: translateZ(40px); }
    .tilt-card-inner .tilt-title { transform: translateZ(30px); }
    .tilt-card-inner .tilt-desc { transform: translateZ(20px); }
    .stat-number { font-family: 'Luckiest Guy', cursive; font-weight: 900; font-size: 3rem; line-height: 1; }
    @media (max-width: 768px) { .stat-number { font-size: 2rem; } }
    .nav-fixed { position: sticky; top: 0; left: 0; right: 0; z-index: 1000; transition: background 0.3s, box-shadow 0.3s; }
    .nav-fixed.scrolled { background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .nav-fixed.scrolled .nav-link { color: #1a1a2e !important; }
    .nav-fixed.scrolled .nav-link:hover { color: #FF2A7A !important; }
    .nav-fixed.scrolled .hamburger span { background: #1a1a2e; }
    .lang-btn { font-family: 'Luckiest Guy', cursive; font-size: 0.75rem; letter-spacing: 0.03em; border: 2px solid rgba(255,255,255,0.3); background: transparent; color: rgba(255,255,255,0.7); padding: 3px 8px; cursor: pointer; border-radius: 6px; transition: all 0.2s; }
    .lang-btn.active { background: #FFD700; color: #18181b; border-color: #FFD700; }
    .lang-btn:hover:not(.active) { border-color: #fff; color: #fff; }
    .nav-fixed.scrolled .lang-btn { border-color: rgba(0,0,0,0.2); color: rgba(0,0,0,0.5); }
    .nav-fixed.scrolled .lang-btn.active { background: #FFD700; color: #18181b; border-color: #FFD700; }
    .digital-clock { font-family: 'Luckiest Guy', cursive; font-size: 1.1rem; letter-spacing: 0.08em; background: #18181b; color: #00E5FF; padding: 6px 14px; border-radius: 10px; border: 2px solid rgba(0,229,255,0.3); text-shadow: 0 0 10px rgba(0,229,255,0.5); display: inline-flex; align-items: center; gap: 8px; min-width: 130px; justify-content: center; }
    #clockTime { font-variant-numeric: tabular-nums; display: inline-block; min-width: 95px; text-align: center; }
    .mobile-menu { position: fixed; inset: 0; background: rgba(255,255,255,0.97); backdrop-filter: blur(30px); z-index: 999; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; opacity: 0; pointer-events: none; transition: opacity 0.3s; }
    .mobile-menu.open { opacity: 1; pointer-events: all; }
    .mobile-menu a { font-family: 'Luckiest Guy', cursive; font-size: 1.8rem; color: #1a1a2e; text-decoration: none; letter-spacing: 0.04em; }
    .mobile-menu a:hover { color: #FF2A7A; }
    .hamburger { width: 32px; height: 24px; position: relative; cursor: pointer; display: none; }
    .hamburger span { display: block; position: absolute; height: 3px; width: 100%; background: #fff; border-radius: 3px; transition: 0.3s; }
    .hamburger span:nth-child(1) { top: 0; }
    .hamburger span:nth-child(2) { top: 10px; }
    .hamburger span:nth-child(3) { top: 20px; }
    .hamburger.active span:nth-child(1) { top: 10px; transform: rotate(45deg); }
    .hamburger.active span:nth-child(2) { opacity: 0; }
    .hamburger.active span:nth-child(3) { top: 10px; transform: rotate(-45deg); }
    @media (max-width: 768px) { .hamburger { display: block; } .nav-links { display: none !important; } }
    .icon-circle { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
    a { text-decoration: none; color: inherit; }
    ::selection { background: #00E5FF; color: #0F0F2E; }
    @media (max-width: 768px) { .hero-title { font-size: 2.4rem !important; } }
    .star-burst { position: absolute; pointer-events: none; z-index: 20; }
    @keyframes starFloat { 0% { transform: translate(0, 0) scale(1); opacity: 1; } 100% { transform: translate(var(--sx), var(--sy)) scale(0); opacity: 0; } }
    .marquee-track { display: flex; animation: marquee 40s linear infinite; width: max-content; }
    @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
    .marquee-big .marquee-track { animation-duration: 20s; }
    .slot-window { height: 80px; overflow: hidden; position: relative; border-radius: 16px; }
    .slot-strip { position: absolute; top: 0; left: 0; width: 100%; will-change: transform; }
    .slot-item { height: 80px; display: flex; align-items: center; justify-content: center; font-family: 'Luckiest Guy', cursive; font-weight: 900; font-size: 1.4rem; white-space: nowrap; color: #1a1a2e; }
    @keyframes glowPulse { 0%, 100% { box-shadow: 0 0 20px rgba(255,215,0,0.3); } 50% { box-shadow: 0 0 40px rgba(255,215,0,0.6); } }
    .glow-pulse { animation: glowPulse 3s ease-in-out infinite; }
    .confetti-piece { position: fixed; pointer-events: none; z-index: 99990; font-size: 1.6rem; will-change: transform, opacity; }
    .explosion-ring { position: absolute; border-radius: 50%; border: 3px solid; pointer-events: none; will-change: transform, opacity; }
    .testimonial-card { background: rgba(255,255,255,0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-radius: 24px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6); transition: transform 0.3s, box-shadow 0.3s; border-top: 4px solid; }
    .testimonial-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.1); }
    .alaune-scroll { display: flex; gap: 24px; overflow-x: auto; padding: 10px 4px 20px; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
    .alaune-scroll::-webkit-scrollbar { display: none; }
    .alaune-card { background: #fff; border-radius: 24px; box-shadow: 0 6px 24px rgba(0,0,0,0.1); overflow: hidden; transition: transform 0.25s, box-shadow 0.25s; cursor: pointer; min-width: 300px; max-width: 320px; flex-shrink: 0; scroll-snap-align: start; }
    .alaune-card:hover { transform: translateY(-8px); box-shadow: 0 16px 40px rgba(0,0,0,0.15); }
    .alaune-card-body { padding: 22px 24px 24px; }
    .alaune-card-title { font-family: 'Fredoka One', cursive; font-size: 1.35rem; color: #18181b; margin-bottom: 6px; line-height: 1.2; }
    .alaune-card-date { font-family: 'Patrick Hand', cursive; font-size: 0.95rem; color: #999; margin-bottom: 10px; }
    .alaune-card-desc { font-family: 'Patrick Hand', cursive; font-size: 1.05rem; color: #555; line-height: 1.4; margin-bottom: 14px; }
    .alaune-card-link { font-family: 'Fredoka One', cursive; font-size: 1.05rem; color: #18181b; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; transition: gap 0.2s; }
    .alaune-card-link:hover { gap: 12px; }
    @media (max-width: 768px) { .alaune-card { min-width: 270px; max-width: 280px; } }
    .ia-teaser-wrap { background: #00E5FF; position: relative; overflow: hidden; }
    .ia-teaser-card { background: #fff; border: 6px solid #18181b; border-radius: 24px; box-shadow: 10px 10px 0 #18181b; padding: 40px 32px; text-align: center; transform: rotate(-1deg); transition: transform 0.3s, box-shadow 0.3s; position: relative; overflow: visible; cursor: pointer; }
    .ia-teaser-card:hover { transform: rotate(0deg) scale(1.03); box-shadow: 14px 14px 0 #18181b; }
    .ia-teaser-sticker { position: absolute; top: -18px; right: -12px; background: #FF2A7A; color: #fff; font-family: 'Luckiest Guy', cursive; font-size: 0.7rem; letter-spacing: 0.1em; padding: 6px 16px; border-radius: 20px; border: 3px solid #18181b; box-shadow: 3px 3px 0 #18181b; transform: rotate(8deg); z-index: 5; }
    .ia-teaser-emoji { font-size: 4rem; display: block; margin-bottom: 16px; filter: drop-shadow(3px 3px 0 rgba(0,0,0,0.15)); }
    @media (max-width: 768px) { .ia-teaser-card { padding: 28px 20px; } }
    .sports-ticker-wrap { background: #18181b; border-top: 3px solid #00E5FF; position: relative; }
    .sports-tabs { display: flex; overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; border-bottom: 2px solid rgba(255,255,255,0.08); background: #111; }
    .sports-tabs::-webkit-scrollbar { display: none; }
    .sport-tab { padding: 8px 18px; font-family: 'Luckiest Guy', cursive; font-size: 0.75rem; letter-spacing: 0.06em; color: rgba(255,255,255,0.4); cursor: pointer; white-space: nowrap; border-bottom: 3px solid transparent; transition: all 0.2s; background: none; border-top: none; border-left: none; border-right: none; }
    .sport-tab:hover { color: rgba(255,255,255,0.7); }
    .sport-tab.active { color: #00E5FF; border-bottom-color: #00E5FF; }
    .scores-container { display: flex; overflow-x: auto; scrollbar-width: none; gap: 0; padding: 0; }
    .scores-container::-webkit-scrollbar { display: none; }
    .game-card { min-width: 200px; padding: 12px 16px; border-right: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
    .game-card:hover { background: rgba(255,255,255,0.03); }
    .game-team-row { display: flex; align-items: center; gap: 8px; font-family: 'Patrick Hand', cursive; font-size: 0.9rem; color: #fff; }
    .game-team-logo { width: 22px; height: 22px; object-fit: contain; }
    .game-team-name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .game-team-score { font-family: 'Luckiest Guy', cursive; font-size: 1rem; min-width: 24px; text-align: right; letter-spacing: 0.04em; }
    .game-team-row.winner .game-team-score { color: #00E5FF; }
    .game-status { font-family: 'Luckiest Guy', cursive; font-size: 0.6rem; letter-spacing: 0.06em; text-align: center; color: rgba(255,255,255,0.35); padding-top: 2px; }
    .game-status.live { color: #EF4444; animation: livePulse 1.5s infinite; }
    @keyframes livePulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
    .scores-loading { color: rgba(255,255,255,0.3); font-family: 'Patrick Hand', cursive; padding: 16px 20px; font-size: 0.9rem; }
    .scores-date-nav { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 6px 0; background: rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.06); }
    .scores-nav-btn { width: 32px; height: 32px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.15); background: transparent; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
    .scores-nav-btn:hover { background: rgba(0,229,255,0.2); border-color: #00E5FF; color: #00E5FF; }
    .scores-nav-btn:disabled { opacity: 0.2; cursor: not-allowed; }
    .scores-date-label { font-family: 'Luckiest Guy', cursive; font-size: 0.8rem; letter-spacing: 0.06em; color: #00E5FF; min-width: 160px; text-align: center; }
    .visit-counter { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 4px 14px; }
    .counter-digit { background: rgba(255,255,255,0.12); border-radius: 4px; padding: 2px 6px; font-family: 'Luckiest Guy', cursive; font-size: 0.9rem; color: #00E5FF; letter-spacing: 0.05em; }
    @keyframes aurora { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
    .aurora-footer::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #00E5FF, #FFD700, #FF2A7A, #8B5CF6, #00E5FF); background-size: 300% 100%; animation: aurora 6s linear infinite; }
    .nav-dock { position: fixed; right: 20px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; gap: 1rem; z-index: 900; padding: 10px; }
    .nav-icon-box { background: #fff; width: 3.2rem; height: 3.2rem; border: 3px solid #18181b; display: flex; align-items: center; justify-content: center; transition: all 0.2s cubic-bezier(0.175,0.885,0.32,1.275); box-shadow: 4px 4px 0px #18181b; border-radius: 10px; }
    .nav-item:hover .nav-icon-box { transform: scale(1.2) rotate(-5deg); background: #22D3EE; z-index: 60; }
    .nav-item.active .nav-icon-box { background: #FACC15; transform: scale(1.1); }
    .nav-label { transition: all 0.2s; opacity: 0; transform: translateX(10px) scale(0.8); pointer-events: none; position: absolute; right: 100%; top: 50%; margin-right: 12px; margin-top: -14px; z-index: 60; background: #18181b; color: #fff; padding: 4px 12px; border: 2px solid #fff; box-shadow: -4px 4px 0px rgba(0,0,0,0.2); font-family: 'Luckiest Guy', cursive; font-size: 0.9rem; white-space: nowrap; border-radius: 6px; }
    .nav-item:hover .nav-label { opacity: 1; transform: translateX(0) scale(1); }
    .comic-popup { background: #fff; border: 5px solid #18181b; box-shadow: 10px 10px 0px rgba(0,0,0,0.8); position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%) scale(1); z-index: 950; padding: 4rem 2rem 2rem; width: 90vw; max-width: 550px; height: auto; max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column; align-items: center; justify-content: center; animation: comicPopIn 0.3s cubic-bezier(0.175,0.885,0.32,1.275); border-radius: 16px; }
    @keyframes comicPopIn { from { transform: translate(-50%,-50%) scale(0.5); opacity: 0; } to { transform: translate(-50%,-50%) scale(1); opacity: 1; } }
    .comic-popup.hidden { display: none !important; }
    .comic-btn { transition: transform 0.1s, box-shadow 0.1s; cursor: pointer; border: 3px solid #18181b; box-shadow: 4px 4px 0px #18181b; border-radius: 8px; }
    .comic-btn:active { transform: translate(2px,2px); box-shadow: 2px 2px 0px #18181b; }
    .close-btn { position: absolute; top: 15px; right: 15px; width: 44px; height: 44px; background: #EF4444; border: 3px solid #18181b; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-family: 'Luckiest Guy', cursive; font-size: 1.3rem; cursor: pointer; box-shadow: 3px 3px 0px #18181b; transition: transform 0.1s; z-index: 60; }
    .close-btn:hover { transform: scale(1.1); }
    .comic-input { border: 3px solid #18181b; outline: none; font-family: 'Patrick Hand', cursive; padding: 0.5rem; font-size: 1.2rem; width: 100%; border-radius: 8px; }
    .comic-input:focus { background: #FEF08A; }
    .dice-container { perspective: 1000px; margin: 1rem 0 2rem; }
    .dice { width: 130px; height: 130px; position: relative; transform-style: preserve-3d; transition: transform 1s ease-out; cursor: pointer; }
    .face { position: absolute; width: 130px; height: 130px; background: #fff; border: 4px solid #18181b; display: flex; justify-content: center; align-items: center; font-size: 3.5rem; font-family: 'Luckiest Guy', cursive; border-radius: 12px; }
    .face:nth-child(1) { transform: translateZ(65px); }
    .face:nth-child(2) { transform: rotateY(180deg) translateZ(65px); }
    .face:nth-child(3) { transform: rotateY(90deg) translateZ(65px); }
    .face:nth-child(4) { transform: rotateY(-90deg) translateZ(65px); }
    .face:nth-child(5) { transform: rotateX(90deg) translateZ(65px); }
    .face:nth-child(6) { transform: rotateX(-90deg) translateZ(65px); }
    .window-controls { position: absolute; top: 15px; right: 15px; display: flex; gap: 8px; z-index: 60; }
    .win-btn { width: 36px; height: 36px; border: 3px solid #18181b; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 3px 3px 0px #18181b; transition: transform 0.1s; background: #fff; }
    .win-btn:hover { transform: scale(1.1); }
    .comic-popup.fullscreen { width: 100vw!important; height: 100vh!important; max-width: none!important; max-height: none!important; top: 0!important; left: 0!important; transform: none!important; border: none; border-radius: 0; z-index: 9990; padding: 0; background: #FACC15; }
    .comic-popup.fullscreen #period-countdown { font-size: 13vw!important; line-height: 1; font-family: 'Luckiest Guy', cursive!important; background: #fff; color: #18181b!important; border: 8px solid #18181b; padding: 3rem 5rem!important; box-shadow: 15px 15px 0px #18181b; transform: rotate(-2deg); max-width: 90vw; white-space: nowrap; }
    .comic-popup.fullscreen h2 { font-size: 4.5vw!important; margin-bottom: 3rem; background: #fff; color: #18181b; border: 4px solid #18181b; padding: 0.5rem 2rem; transform: rotate(1deg); white-space: nowrap; }
    .comic-popup.fullscreen .hide-fs { display: none; }
    .comic-popup.fullscreen .window-controls { top: 20px; right: 20px; }
    .comic-popup.mini { width: auto!important; max-width: none!important; height: auto!important; padding: 15px!important; top: 20px!important; right: 20px!important; left: auto!important; transform: none!important; box-shadow: 4px 4px 0px rgba(0,0,0,0.5); border-width: 3px; display: flex; align-items: center; justify-content: center; min-width: 150px; overflow: visible!important; border-radius: 12px; }
    .comic-popup.mini h2, .comic-popup.mini label, .comic-popup.mini input, .comic-popup.mini p, .comic-popup.mini .flex.gap-2, .comic-popup.mini .flex.gap-3 { display: none!important; }
    .comic-popup.mini .bg-cyan-200 { background: transparent!important; border: none!important; box-shadow: none!important; padding: 0!important; margin: 0!important; width: auto!important; }
    .comic-popup.mini .bg-black.text-green-400 { background: transparent!important; border: none!important; padding: 0!important; }
    .comic-popup.mini #period-countdown { font-size: 2.5rem!important; border: none; background: transparent; color: #18181b!important; padding: 0; display: block!important; line-height: 1; font-family: 'Luckiest Guy', cursive; }
    .comic-popup.mini .window-controls { top: -10px; right: -10px; transform: scale(0.5); transform-origin: top right; }
    .popup-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 940; }
    .popup-overlay.active { display: block; }
    @media (max-width: 768px) { .nav-dock { right: 10px; gap: 0.8rem; } .nav-icon-box { width: 2.8rem; height: 2.8rem; } .nav-label { display: none; } .comic-popup { width: 95vw; padding: 3rem 1.5rem 1.5rem; } }
    /* Reveal: visible immediately */
    .reveal { opacity: 1 !important; transform: translateY(0) !important; }
"""

combined = f"""<!DOCTYPE html>
<html lang="fr-CA">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zone Total Sport &mdash; Accueil</title>
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Boogaloo&family=Patrick+Hand&family=Fredoka+One&display=swap" rel="stylesheet">
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {{
            theme: {{
                extend: {{
                    colors: {{
                        cyan: {{ electric: '#00E5FF' }},
                        yellow: {{ sun: '#FFD700' }},
                        pink: {{ fuchsia: '#FF2A7A' }},
                        violet: {{ pop: '#8B5CF6' }},
                        dark: '#0F0F2E',
                    }},
                    fontFamily: {{
                        bangers: ['"Luckiest Guy"', 'cursive'],
                        boogaloo: ['Boogaloo', 'cursive'],
                        baloo: ['"Patrick Hand"', 'cursive'],
                        fredoka: ['"Fredoka One"', 'cursive'],
                    }},
                }}
            }}
        }}
    </script>
    <!-- GSAP + ScrollTrigger -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
{combined_style}
    </style>
</head>
<body>

<!-- ========================================== -->
<!-- ============ GROUP A: HERO =============== -->
<!-- ========================================== -->
{body_a_clean}

<!-- ========================================== -->
<!-- ============ GROUP B: CONTENT ============ -->
<!-- ========================================== -->
{body_b_clean}

<!-- ========================================== -->
<!-- ============ GROUP C: FOOTER ============= -->
<!-- ========================================== -->
{body_c_clean}

<!-- ========================================== -->
<!-- ====== UNIFIED i18n (all groups) ========= -->
<!-- ========================================== -->
{unified_i18n_script}

<!-- ========================================== -->
<!-- ============ COMIC TOOLS DOCK ============ -->
<!-- ========================================== -->
{body_d_clean}

</body>
</html>"""

out = os.path.join(BASE, 'accueil.html')
with open(out, 'w', encoding='utf-8') as f:
    f.write(combined)

print(f"Written: {out}")
print(f"Lines: {combined.count(chr(10))}")
print(f"Size: {len(combined.encode('utf-8'))/1024:.1f} KB")
