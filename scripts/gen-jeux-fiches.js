/**
 * Générateur de fiches SEO statiques — 1 page par jeu (programmatic SEO).
 * Source : apps/jeux/data/jeux-merged.json (1439 jeux).
 * Sortie : /jeux/<slug>.html + /jeux/index.html + sitemap-jeux.xml.
 *
 * Usage :
 *   node scripts/gen-jeux-fiches.js            # génère tout
 *   node scripts/gen-jeux-fiches.js --limit 1  # n'écrit que la 1re fiche (test)
 *   node scripts/gen-jeux-fiches.js --sample pfeq_1   # une fiche précise (stdout)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'apps/jeux/data/jeux-merged.json');
const OUTDIR = path.join(ROOT, 'jeux');
const BASE = 'https://zonetotalsport.ca';

const args = process.argv.slice(2);
const LIMIT = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1], 10) : Infinity;
const SAMPLE = args.includes('--sample') ? args[args.indexOf('--sample') + 1] : null;

// ---------- helpers ----------
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
}
function toList(v) {
  if (v == null || v === '') return [];
  if (Array.isArray(v)) return v.map(function (it) {
    if (it && typeof it === 'object') return it.fr || it.text || it.title || '';
    return String(it);
  }).filter(Boolean);
  if (typeof v === 'string') return [v];
  return [];
}
function str(v) { return (v == null) ? '' : String(v); }
function cap(s) { s = str(s).trim(); return s ? s.charAt(0) + s.slice(1).toLowerCase() : s; }
function clip(s, n) {
  s = str(s).replace(/\s+/g, ' ').trim();
  if (s.length <= n) return s;
  var cut = s.slice(0, n - 1);
  var sp = cut.lastIndexOf(' ');
  if (sp > n * 0.5) cut = cut.slice(0, sp);           // coupe sur un mot entier
  return cut.replace(/[\s,;:.\-–—]+$/, '') + '…';     // pas de mot tronqué ni ponctuation orpheline
}

// fond gymnase + voile, commun à toutes les pages /jeux/
const BODY_BG =
  "body{margin:0;font-family:'Quicksand',system-ui,sans-serif;min-height:100vh;" +
  "background:linear-gradient(rgba(255,255,255,.82),rgba(255,255,255,.82)),url('/gym-bg.jpg') center/cover fixed;}";

// ---------- rendu d'une fiche ----------
function buildPage(g, slug, related) {
  const nomTitre = cap(g.title);
  const but = str(g.but).trim();
  const cat = str(g.categoryName).trim();
  const icon = str(g.categoryIcon) || '🎮';
  const color = /^#[0-9a-fA-F]{3,6}$/.test(str(g.categoryColor)) ? g.categoryColor : '#00C4FF';
  const desc = clip(but || ('Comment jouer à ' + nomTitre + ' : règles, déroulement et variantes.'), 155);

  const facts = [];
  if (g.niveau) facts.push(['🎓', str(g.niveau)]);
  else if (g.ageMin) facts.push(['🎓', g.ageMin + (g.ageMax ? '–' + g.ageMax : '') + ' ans']);
  if (g.nbJoueursMin) facts.push(['👥', g.nbJoueursMin + (g.nbJoueursMax ? '–' + g.nbJoueursMax : '') + ' joueurs']);
  if (g.duree) facts.push(['⏱️', str(g.duree)]);
  if (g.espace) facts.push(['📍', str(g.espace)]);
  if (g.niveauActivite) facts.push(['🔥', str(g.niveauActivite)]);

  const materiel = toList(g.materiel), deroulement = toList(g.deroulement), variantes = toList(g.variantes);
  const securite = toList(g.consignesSecurite), adaptations = toList(g.adaptations);
  const reflexion = toList(g.questionsReflexion), erreurs = toList(g.erreursFrequentes), tags = toList(g.tags);

  function section(title, inner) { return inner ? '<section class="fiche-sec"><h2>' + esc(title) + '</h2>' + inner + '</section>' : ''; }
  function ul(items) { return items.length ? '<ul>' + items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>' : ''; }
  function ol(items) { return items.length ? '<ol>' + items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ol>' : ''; }
  function p(t) { return t ? '<p>' + esc(t) + '</p>' : ''; }

  // sommaire (TOC) des sections présentes
  const toc = [];
  if (materiel.length) toc.push(['mat', '🎒 Matériel']);
  if (deroulement.length) toc.push(['der', '▶️ Déroulement']);
  if (variantes.length) toc.push(['var', '🔄 Variantes']);
  if (securite.length) toc.push(['sec', '🛡️ Sécurité']);
  if (adaptations.length) toc.push(['ada', '♿ Adaptations']);

  const howto = {
    '@context': 'https://schema.org', '@type': 'HowTo', name: nomTitre, description: desc, inLanguage: 'fr-CA',
    step: deroulement.slice(0, 20).map(function (s, i) { return { '@type': 'HowToStep', position: i + 1, text: s.slice(0, 500) }; })
  };
  if (materiel.length) howto.supply = materiel.map(function (m) { return { '@type': 'HowToSupply', name: m.slice(0, 120) }; });
  const breadcrumb = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: BASE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Jeux', item: BASE + '/jeux/' },
      { '@type': 'ListItem', position: 3, name: nomTitre, item: BASE + '/jeux/' + slug + '.html' }
    ]
  };

  const relHtml = related.length ? section('🎯 Autres jeux ' + cat.toLowerCase(),
    '<div class="fiche-related">' + related.map(function (r) {
      return '<a href="/jeux/' + r.slug + '.html">' + esc(cap(r.title)) + '</a>';
    }).join('') + '</div>') : '';

  return '<!DOCTYPE html>\n<html lang="fr-CA">\n<head>\n' +
    '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>' + esc(nomTitre) + ' — règles et déroulement | Jeu d\'éducation physique</title>\n' +
    '<meta name="description" content="' + esc(desc) + '">\n' +
    '<link rel="canonical" href="' + BASE + '/jeux/' + slug + '.html">\n' +
    '<link rel="alternate" hreflang="fr" href="' + BASE + '/jeux/' + slug + '.html">\n' +
    '<link rel="alternate" hreflang="x-default" href="' + BASE + '/jeux/' + slug + '.html">\n' +
    '<meta property="og:title" content="' + esc(nomTitre) + ' — règles et déroulement">\n' +
    '<meta property="og:description" content="' + esc(desc) + '">\n' +
    '<meta property="og:type" content="article">\n<meta property="og:url" content="' + BASE + '/jeux/' + slug + '.html">\n' +
    '<meta property="og:image" content="' + BASE + '/logo-zts.png">\n<meta property="og:site_name" content="Zone Total Sport">\n<meta property="og:locale" content="fr_CA">\n' +
    '<meta name="twitter:card" content="summary_large_image">\n<link rel="icon" href="/favicon-bucheron.png">\n' +
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
    '<link href="https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Fredoka:wght@400;600;700&family=Quicksand:wght@500;700&display=swap" rel="stylesheet">\n' +
    '<link rel="stylesheet" href="/shared/zts.css">\n' +
    '<script type="application/ld+json">' + JSON.stringify(howto) + '</script>\n' +
    '<script type="application/ld+json">' + JSON.stringify(breadcrumb) + '</script>\n' +
    '<style>\n' + BODY_BG +
    '.fiche-wrap{max-width:1060px;margin:0 auto;padding:18px 16px 80px;}' +
    '.fiche-cols{columns:2;column-gap:16px;}' +
    '.fiche-cols>.fiche-sec{break-inside:avoid;-webkit-column-break-inside:avoid;}' +
    '@media(max-width:760px){.fiche-cols{columns:1;}}' +
    '.fiche-back{display:inline-flex;align-items:center;gap:6px;background:#FFD700;color:#0F0F2E;font-family:"Luckiest Guy",cursive;text-decoration:none;border:3px solid #0F0F2E;border-radius:999px;padding:8px 16px;box-shadow:3px 3px 0 #0F0F2E;margin:6px 0 16px;}' +
    '.fiche-back:active{transform:translate(2px,2px);box-shadow:1px 1px 0 #0F0F2E;}' +
    '.fiche-hero{position:relative;color:#fff;border:3px solid #0F0F2E;border-radius:26px;box-shadow:8px 8px 0 #0F0F2E;padding:30px 26px;margin-bottom:20px;overflow:hidden;background:linear-gradient(135deg,' + color + ',#0F0F2E);}' +
    '.fiche-cat{display:inline-block;background:rgba(255,255,255,.95);color:#0F0F2E;border-radius:999px;padding:5px 14px;font-weight:800;font-size:.85rem;}' +
    '.fiche-hero h1{font-family:"Luckiest Guy",cursive;font-size:clamp(28px,6vw,46px);line-height:1.04;margin:14px 0 10px;text-shadow:2px 2px 0 rgba(0,0,0,.25);}' +
    '.fiche-but{font-size:1.2rem;line-height:1.4;margin:0;opacity:.97;}' +
    '.fiche-facts{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px;}' +
    '.fiche-fact{background:rgba(255,255,255,.92);color:#0F0F2E;border-radius:12px;padding:7px 12px;font-size:.92rem;font-weight:700;}' +
    '.fiche-toc{display:flex;flex-wrap:wrap;gap:8px;background:rgba(255,255,255,.92);border:3px solid #0F0F2E;border-radius:16px;box-shadow:4px 4px 0 #0F0F2E;padding:12px 14px;margin-bottom:18px;}' +
    '.fiche-toc a{font-weight:700;text-decoration:none;color:#0F0F2E;background:#E0F7FF;border:2px solid #0F0F2E;border-radius:999px;padding:4px 12px;font-size:.9rem;}' +
    '.fiche-sec{background:rgba(255,255,255,.96);border:3px solid #0F0F2E;border-radius:20px;box-shadow:5px 5px 0 #0F0F2E;padding:20px 22px;margin-bottom:16px;scroll-margin-top:14px;}' +
    '.fiche-sec h2{font-family:"Luckiest Guy",cursive;font-size:1.45rem;color:' + color + ';-webkit-text-stroke:.4px #0F0F2E;margin:0 0 12px;letter-spacing:.4px;}' +
    '.fiche-sec p,.fiche-sec li{font-size:1.06rem;line-height:1.6;color:#1a2433;}' +
    '.fiche-sec ul,.fiche-sec ol{margin:0;padding-left:1.25em;}' +
    '.fiche-sec ol{counter-reset:s;list-style:none;padding:0;}' +
    '.fiche-sec ol>li{position:relative;padding:2px 0 12px 38px;margin-bottom:6px;}' +
    '.fiche-sec ol>li::before{counter-increment:s;content:counter(s);position:absolute;left:0;top:0;width:26px;height:26px;background:' + color + ';color:#fff;border:2px solid #0F0F2E;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:"Luckiest Guy",cursive;font-size:.85rem;}' +
    '.fiche-sec li{margin-bottom:7px;}' +
    '.fiche-tags{display:flex;flex-wrap:wrap;gap:8px;}' +
    '.fiche-tags span{background:#E0F7FF;border:2px solid #0F0F2E;border-radius:999px;padding:4px 12px;font-size:.85rem;font-weight:700;color:#0F0F2E;}' +
    '.fiche-cta{display:block;text-align:center;background:#FFD700;color:#0F0F2E;font-family:"Luckiest Guy",cursive;font-size:1.25rem;letter-spacing:.5px;text-decoration:none;border:3px solid #0F0F2E;border-radius:16px;box-shadow:5px 5px 0 #0F0F2E;padding:16px;margin:6px 0 18px;}' +
    '.fiche-cta:active{transform:translate(2px,2px);box-shadow:2px 2px 0 #0F0F2E;}' +
    '.fiche-related{display:flex;flex-wrap:wrap;gap:9px;}' +
    '.fiche-related a{background:#FFF3C4;border:2px solid #0F0F2E;border-radius:12px;padding:8px 13px;font-weight:700;text-decoration:none;color:#0F0F2E;box-shadow:2px 2px 0 #0F0F2E;}' +
    '@media(max-width:480px){.fiche-hero{box-shadow:5px 5px 0 #0F0F2E;padding:24px 18px;}.fiche-sec{padding:16px 16px;}}' +
    '</style>\n</head>\n<body>\n' +
    '<div data-zts-header></div>\n' +
    '<main class="fiche-wrap">\n' +
    '<a class="fiche-back" href="/jeux/">← Tous les jeux</a>\n' +
    '<header class="fiche-hero">' +
    '<span class="fiche-cat">' + esc(icon) + ' ' + esc(cat) + '</span>' +
    '<h1>' + esc(nomTitre) + '</h1>' +
    (but ? '<p class="fiche-but">' + esc(but) + '</p>' : '') +
    (facts.length ? '<div class="fiche-facts">' + facts.map(function (f) { return '<span class="fiche-fact">' + esc(f[0]) + ' ' + esc(f[1]) + '</span>'; }).join('') + '</div>' : '') +
    '</header>\n' +
    (toc.length > 1 ? '<nav class="fiche-toc">' + toc.map(function (x) { return '<a href="#' + x[0] + '">' + esc(x[1]) + '</a>'; }).join('') + '</nav>\n' : '') +
    // Déroulement : pleine largeur (contenu principal)
    (deroulement.length ? '<section class="fiche-sec" id="der"><h2>▶️ Déroulement</h2>' + ol(deroulement) + '</section>' : '') +
    // Sections courtes : 2 colonnes (masonry) pour éviter le scroll
    '<div class="fiche-cols">' +
    (materiel.length ? '<section class="fiche-sec" id="mat"><h2>🎒 Matériel</h2>' + ul(materiel) + '</section>' : '') +
    (g.disposition ? section('📐 Disposition', p(str(g.disposition))) : '') +
    (variantes.length ? '<section class="fiche-sec" id="var"><h2>🔄 Variantes</h2>' + ul(variantes) + '</section>' : '') +
    (securite.length ? '<section class="fiche-sec" id="sec"><h2>🛡️ Consignes de sécurité</h2>' + ul(securite) + '</section>' : '') +
    (adaptations.length ? '<section class="fiche-sec" id="ada"><h2>♿ Adaptations (inclusion)</h2>' + ul(adaptations) + '</section>' : '') +
    (g.roleEnseignant ? section('🧑‍🏫 Rôle de l\'enseignant', p(str(g.roleEnseignant))) : '') +
    (g.retourAuCalme ? section('🧘 Retour au calme', p(str(g.retourAuCalme))) : '') +
    section('💬 Questions de réflexion', ul(reflexion)) +
    section('⚠️ Erreurs fréquentes', ul(erreurs)) +
    (g.origine ? section('📖 Origine', p(str(g.origine))) : '') +
    (tags.length ? section('🏷️ Tags', '<div class="fiche-tags">' + tags.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>') : '') +
    '</div>\n' +
    '<a class="fiche-cta" href="https://jeux.zonetotalsport.ca">🎮 Voir les 1400+ jeux dans l\'app gratuite →</a>\n' +
    relHtml +
    '</main>\n<div data-zts-footer></div>\n' +
    '<script src="/shared/zts.js"></script>\n<script src="/firebase-auth.js" defer></script>\n<script src="/zts-funnel.js" defer></script>\n' +
    '</body>\n</html>\n';
}

// ---------- main ----------
const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const games = Array.isArray(raw) ? raw : (raw.jeux || raw.games || Object.values(raw).find(Array.isArray));

const used = {};
games.forEach(function (g) {
  let s = slugify(g.title) || ('jeu-' + g.id);
  if (used[s]) s = s + '-' + slugify(str(g.id));
  used[s] = true; g.__slug = s;
});
const byCat = {};
games.forEach(function (g) { (byCat[g.category] = byCat[g.category] || []).push(g); });

if (SAMPLE) {
  const g = games.find(function (x) { return str(x.id) === SAMPLE; }) || games[0];
  const rel = (byCat[g.category] || []).filter(function (x) { return x !== g; }).slice(0, 6).map(function (x) { return { slug: x.__slug, title: x.title }; });
  process.stdout.write(buildPage(g, g.__slug, rel)); process.exit(0);
}
if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });

let n = 0; const urls = [];
for (const g of games) {
  if (n >= LIMIT) break;
  const rel = (byCat[g.category] || []).filter(function (x) { return x !== g; }).slice(0, 6).map(function (x) { return { slug: x.__slug, title: x.title }; });
  fs.writeFileSync(path.join(OUTDIR, g.__slug + '.html'), buildPage(g, g.__slug, rel));
  urls.push(BASE + '/jeux/' + g.__slug + '.html'); n++;
}

// ---------- page index /jeux/ : tuiles carrées + popup de jeux ----------
if (LIMIT === Infinity) {
  const cats = Object.keys(byCat).sort(function (a, b) { return byCat[b].length - byCat[a].length; });

  // Tuiles carrées de catégories
  const tiles = cats.map(function (c) {
    const list = byCat[c];
    const icon = str(list[0].categoryIcon) || '🎮';
    const cname = str(list[0].categoryName) || c;
    return '<button class="cat-tile" data-cat="' + esc(c) + '"><span class="ic">' + esc(icon) + '</span>' +
      '<span class="nm">' + esc(cname) + '</span><span class="ct">' + list.length + ' jeux</span></button>';
  }).join('');

  // Packs cachés (liens réels = crawlables SEO) repris par le popup + la recherche
  const packs = cats.map(function (c) {
    const list = byCat[c];
    const icon = str(list[0].categoryIcon) || '🎮';
    const cname = str(list[0].categoryName) || c;
    const sq = list.map(function (g) {
      return '<a class="game-sq" href="/jeux/' + g.__slug + '.html" title="' + esc(clip(g.but, 120)) + '">' + esc(cap(g.title)) + '</a>';
    }).join('');
    return '<div class="cat-pack" data-cat="' + esc(c) + '" data-name="' + esc(icon + ' ' + cname) + '">' + sq + '</div>';
  }).join('');

  const idx = '<!DOCTYPE html>\n<html lang="fr-CA">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>1400+ jeux d\'éducation physique au primaire — règles et déroulement | Zone Total Sport</title>\n' +
    '<meta name="description" content="La plus grande banque de jeux d\'éducation physique au primaire : ' + games.length + ' jeux avec règles, déroulement, variantes et adaptations. Gratuit, aligné PFEQ.">\n' +
    '<link rel="canonical" href="' + BASE + '/jeux/">\n' +
    '<meta property="og:title" content="1400+ jeux d\'éducation physique au primaire">\n<meta property="og:description" content="Banque de ' + games.length + ' jeux ÉP avec règles complètes. Gratuit, aligné PFEQ.">\n' +
    '<meta property="og:image" content="' + BASE + '/logo-zts.png">\n<meta property="og:url" content="' + BASE + '/jeux/">\n<meta property="og:type" content="website">\n' +
    '<link rel="icon" href="/favicon-bucheron.png">\n' +
    '<link href="https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Fredoka:wght@400;600;700&family=Quicksand:wght@500;700&display=swap" rel="stylesheet">\n' +
    '<link rel="stylesheet" href="/shared/zts.css">\n' +
    '<style>' + BODY_BG +
    '.jx-wrap{max-width:1040px;margin:0 auto;padding:18px 16px 80px;}' +
    '.jx-hero{background:linear-gradient(160deg,#00C4FF,#004A61);color:#fff;border:3px solid #0F0F2E;border-radius:24px;box-shadow:7px 7px 0 #0F0F2E;padding:26px 22px;margin-bottom:16px;text-align:center;}' +
    '.jx-hero h1{font-family:"Luckiest Guy",cursive;font-size:clamp(26px,5vw,42px);margin:0 0 6px;text-shadow:2px 2px 0 rgba(0,0,0,.25);}' +
    '.jx-hero p{font-size:1.08rem;margin:0;opacity:.96;}' +
    '.jx-search{position:sticky;top:8px;z-index:10;margin-bottom:18px;}' +
    '.jx-search input{width:100%;box-sizing:border-box;padding:15px 18px;border:3px solid #0F0F2E;border-radius:16px;box-shadow:4px 4px 0 #0F0F2E;font-family:inherit;font-size:1.1rem;font-weight:700;background:#fff;color:#0F0F2E;}' +
    '.jx-search input:focus{outline:none;box-shadow:0 0 0 3px rgba(0,196,255,.6),4px 4px 0 #0F0F2E;}' +
    // grille de tuiles carrées
    '.cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:20px;}' +
    '.cat-tile{aspect-ratio:1;border:4px solid #0F0F2E;border-radius:26px;box-shadow:8px 8px 0 #0F0F2E;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;padding:16px;font-family:"Luckiest Guy",cursive;color:#0F0F2E;transition:transform .08s;}' +
    '.cat-tile:hover{transform:translateY(-4px);}.cat-tile:active{transform:translate(4px,4px);box-shadow:4px 4px 0 #0F0F2E;}' +
    '.cat-tile .ic{font-size:3.6rem;line-height:1;}' +
    '.cat-tile .nm{font-size:1.3rem;line-height:1.08;}' +
    '.cat-tile .ct{font-family:"Quicksand",sans-serif;font-weight:800;font-size:.9rem;background:#0F0F2E;color:#fff;border-radius:999px;padding:3px 13px;}' +
    '.cat-tile:nth-child(6n+1){background:#7FE7FF}.cat-tile:nth-child(6n+2){background:#FFE45C}.cat-tile:nth-child(6n+3){background:#FF9DC0}.cat-tile:nth-child(6n+4){background:#C9A8FF}.cat-tile:nth-child(6n+5){background:#AEE978}.cat-tile:nth-child(6n+6){background:#FFC279}' +
    // grille de carrés de jeux (popup + recherche)
    '.game-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(172px,1fr));gap:14px;}' +
    '.game-sq{aspect-ratio:1;border:4px solid #0F0F2E;border-radius:18px;box-shadow:5px 5px 0 #0F0F2E;display:flex;align-items:center;justify-content:center;text-align:center;padding:12px;font-family:"Fredoka",sans-serif;font-weight:700;font-size:1.02rem;line-height:1.18;color:#0F0F2E;text-decoration:none;transition:transform .08s;}' +
    '.game-sq:hover{transform:translateY(-2px);}.game-sq:active{transform:translate(2px,2px);box-shadow:2px 2px 0 #0F0F2E;}' +
    '.game-sq:nth-child(6n+1){background:#E0F7FF}.game-sq:nth-child(6n+2){background:#FFF6C9}.game-sq:nth-child(6n+3){background:#FFE0EC}.game-sq:nth-child(6n+4){background:#EFE2FF}.game-sq:nth-child(6n+5){background:#E6F9D8}.game-sq:nth-child(6n+6){background:#FFE9CC}' +
    '#jxpacks{display:none;}' +
    '#jxresults{margin-top:4px;}' +
    '.jx-none{display:none;color:#fff;text-align:center;font-weight:700;padding:20px;background:rgba(15,15,46,.5);border-radius:14px;}' +
    // popup
    '.jx-modal{position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;padding:14px;background:rgba(15,15,46,.74);}' +
    '.jx-modal.open{display:flex;}' +
    '.jx-modal-card{background:#fff;border:3px solid #0F0F2E;border-radius:24px;box-shadow:8px 8px 0 #0F0F2E;width:100%;max-width:920px;max-height:88vh;display:flex;flex-direction:column;overflow:hidden;}' +
    '.jx-modal-head{display:flex;align-items:center;gap:10px;padding:16px 18px;border-bottom:3px solid #0F0F2E;background:linear-gradient(160deg,#E0F7FF,#CFF3FF);}' +
    '.jx-modal-head h2{font-family:"Luckiest Guy",cursive;font-size:1.4rem;color:#0F0F2E;margin:0;flex:1;line-height:1.1;}' +
    '.jx-modal-x{width:40px;height:40px;border-radius:50%;border:3px solid #0F0F2E;background:#FF6B9D;color:#fff;font-size:1.4rem;cursor:pointer;box-shadow:2px 2px 0 #0F0F2E;line-height:1;}' +
    '.jx-modal-x:active{transform:translate(2px,2px);box-shadow:0 0 0 #0F0F2E;}' +
    '.jx-modal-body{overflow:auto;padding:16px;}' +
    '</style>\n</head>\n<body>\n<div data-zts-header></div>\n' +
    '<main class="jx-wrap">' +
    '<header class="jx-hero"><h1>🎮 ' + games.length + ' jeux d\'éducation physique</h1>' +
    '<p>Choisis une catégorie pour voir les jeux, ou cherche directement. Clique un jeu pour son explication complète.</p></header>' +
    '<div class="jx-search"><input id="jxq" type="search" placeholder="🔍 Rechercher un jeu (ex. ballon, drapeau, relais)…" aria-label="Rechercher un jeu"></div>' +
    '<div id="jxtiles" class="cat-grid">' + tiles + '</div>' +
    '<div id="jxresults" class="game-grid" hidden></div>' +
    '<p class="jx-none" id="jxnone">Aucun jeu trouvé. Essaie un autre mot.</p>' +
    '<div id="jxpacks">' + packs + '</div>' +
    '</main>\n' +
    '<div class="jx-modal" id="jxmodal"><div class="jx-modal-card">' +
    '<div class="jx-modal-head"><h2 id="jxmt"></h2><button class="jx-modal-x" id="jxmx" aria-label="Fermer">&times;</button></div>' +
    '<div class="jx-modal-body game-grid" id="jxmb"></div></div></div>\n' +
    '<div data-zts-footer></div>\n' +
    '<script>(function(){' +
    'var modal=document.getElementById("jxmodal"),mt=document.getElementById("jxmt"),mb=document.getElementById("jxmb");' +
    'var tiles=document.getElementById("jxtiles"),results=document.getElementById("jxresults"),none=document.getElementById("jxnone"),q=document.getElementById("jxq");' +
    'function open(cat){var p=document.querySelector(\'.cat-pack[data-cat="\'+cat.replace(/"/g,\'\')+\'"]\');if(!p)return;mt.textContent=p.getAttribute("data-name");mb.innerHTML=p.innerHTML;modal.classList.add("open");document.body.style.overflow="hidden";}' +
    'function close(){modal.classList.remove("open");document.body.style.overflow="";}' +
    'tiles.addEventListener("click",function(e){var t=e.target.closest(".cat-tile");if(t)open(t.getAttribute("data-cat"));});' +
    'document.getElementById("jxmx").addEventListener("click",close);' +
    'modal.addEventListener("click",function(e){if(e.target===modal)close();});' +
    'document.addEventListener("keydown",function(e){if(e.key==="Escape")close();});' +
    'var all=[].slice.call(document.querySelectorAll("#jxpacks .game-sq"));' +
    'q.addEventListener("input",function(){var v=q.value.toLowerCase().trim();' +
    'if(!v){results.hidden=true;results.innerHTML="";tiles.hidden=false;none.style.display="none";return;}' +
    'tiles.hidden=true;var m=all.filter(function(a){return a.textContent.toLowerCase().indexOf(v)>=0;});' +
    'results.innerHTML=m.slice(0,120).map(function(a){return a.outerHTML;}).join("");results.hidden=false;' +
    'none.style.display=m.length?"none":"block";});' +
    '})();</script>\n' +
    '<script src="/shared/zts.js"></script>\n<script src="/firebase-auth.js" defer></script>\n</body>\n</html>\n';
  fs.writeFileSync(path.join(OUTDIR, 'index.html'), idx);
  urls.unshift(BASE + '/jeux/');
}

const sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(function (u) { return '  <url><loc>' + u + '</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>'; }).join('\n') + '\n</urlset>\n';
fs.writeFileSync(path.join(ROOT, 'sitemap-jeux.xml'), sm);
console.log('Généré ' + n + ' fiches + index dans /jeux/ + sitemap-jeux.xml (' + urls.length + ' URLs)');
