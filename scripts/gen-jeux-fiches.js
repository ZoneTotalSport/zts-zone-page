/**
 * Générateur de fiches SEO statiques — 1 page par jeu (programmatic SEO).
 * Source : apps/jeux/data/jeux-merged.json (1439 jeux).
 * Sortie : /jeux/<slug>.html + sitemap-jeux.xml.
 *
 * Usage :
 *   node scripts/gen-jeux-fiches.js            # génère tout
 *   node scripts/gen-jeux-fiches.js --limit 1  # n'écrit que la 1re fiche (test)
 *   node scripts/gen-jeux-fiches.js --sample pfeq_1   # une fiche précise (stdout, pas d'écriture)
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
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function slugify(s) {
  return String(s || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
}
// Champ -> tableau de strings propres (gère array, array d'objets {fr,en}, string)
function toList(v) {
  if (v == null || v === '') return [];
  if (Array.isArray(v)) {
    return v.map(function (it) {
      if (it && typeof it === 'object') return it.fr || it.text || it.title || '';
      return String(it);
    }).filter(Boolean);
  }
  if (typeof v === 'string') return [v];
  return [];
}
function str(v) { return (v == null) ? '' : String(v); }

// ---------- rendu d'une fiche ----------
function buildPage(g, slug, related) {
  const nom = str(g.title).trim();
  const nomTitre = nom.charAt(0) + nom.slice(1).toLowerCase();
  const but = str(g.but).trim();
  const cat = str(g.categoryName).trim();
  const icon = str(g.categoryIcon) || '🎮';
  const desc = (but || ('Comment jouer à ' + nomTitre + ' : règles, déroulement et variantes.'))
    .replace(/\s+/g, ' ').slice(0, 155);

  const facts = [];
  if (g.niveau) facts.push(['🎓 Niveau', str(g.niveau)]);
  else if (g.ageMin) facts.push(['🎓 Âge', g.ageMin + (g.ageMax ? '–' + g.ageMax : '') + ' ans']);
  if (g.nbJoueursMin) facts.push(['👥 Joueurs', g.nbJoueursMin + (g.nbJoueursMax ? '–' + g.nbJoueursMax : '')]);
  if (g.duree) facts.push(['⏱️ Durée', str(g.duree)]);
  if (g.espace) facts.push(['📍 Espace', str(g.espace)]);
  if (g.niveauActivite) facts.push(['🔥 Intensité', str(g.niveauActivite)]);

  const materiel = toList(g.materiel);
  const deroulement = toList(g.deroulement);
  const variantes = toList(g.variantes);
  const securite = toList(g.consignesSecurite);
  const adaptations = toList(g.adaptations);
  const reflexion = toList(g.questionsReflexion);
  const erreurs = toList(g.erreursFrequentes);
  const tags = toList(g.tags);

  function section(title, inner) {
    if (!inner) return '';
    return '<section class="fiche-sec"><h2>' + esc(title) + '</h2>' + inner + '</section>';
  }
  function ul(items) {
    if (!items.length) return '';
    return '<ul>' + items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>';
  }
  function ol(items) {
    if (!items.length) return '';
    return '<ol>' + items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ol>';
  }
  function p(txt) { return txt ? '<p>' + esc(txt) + '</p>' : ''; }

  // JSON-LD HowTo (étapes = déroulement)
  const howto = {
    '@context': 'https://schema.org', '@type': 'HowTo',
    name: nomTitre, description: desc,
    inLanguage: 'fr-CA',
    step: deroulement.slice(0, 20).map(function (s, i) {
      return { '@type': 'HowToStep', position: i + 1, text: s.slice(0, 500) };
    })
  };
  if (materiel.length) howto.supply = materiel.map(function (m) { return { '@type': 'HowToSupply', name: m.slice(0, 120) }; });
  const breadcrumb = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: BASE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Jeux', item: BASE + '/jeux/' },
      { '@type': 'ListItem', position: 3, name: nomTitre, item: BASE + '/jeux/' + slug + '.html' }
    ]
  };

  const relHtml = related.length
    ? '<section class="fiche-sec"><h2>Autres jeux ' + esc(cat.toLowerCase()) + '</h2><div class="fiche-related">' +
      related.map(function (r) {
        return '<a href="/jeux/' + r.slug + '.html">' + esc(r.title.charAt(0) + r.title.slice(1).toLowerCase()) + '</a>';
      }).join('') + '</div></section>'
    : '';

  return '<!DOCTYPE html>\n<html lang="fr-CA">\n<head>\n' +
    '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>' + esc(nomTitre) + ' — règles et déroulement | Jeu d\'éducation physique</title>\n' +
    '<meta name="description" content="' + esc(desc) + '">\n' +
    '<link rel="canonical" href="' + BASE + '/jeux/' + slug + '.html">\n' +
    '<link rel="alternate" hreflang="fr" href="' + BASE + '/jeux/' + slug + '.html">\n' +
    '<link rel="alternate" hreflang="x-default" href="' + BASE + '/jeux/' + slug + '.html">\n' +
    '<meta property="og:title" content="' + esc(nomTitre) + ' — règles et déroulement">\n' +
    '<meta property="og:description" content="' + esc(desc) + '">\n' +
    '<meta property="og:type" content="article">\n' +
    '<meta property="og:url" content="' + BASE + '/jeux/' + slug + '.html">\n' +
    '<meta property="og:image" content="' + BASE + '/logo-zts.png">\n' +
    '<meta property="og:site_name" content="Zone Total Sport">\n' +
    '<meta property="og:locale" content="fr_CA">\n' +
    '<meta name="twitter:card" content="summary_large_image">\n' +
    '<link rel="icon" href="/favicon-bucheron.png">\n' +
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
    '<link href="https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Fredoka:wght@400;600;700&family=Quicksand:wght@500;700&display=swap" rel="stylesheet">\n' +
    '<link rel="stylesheet" href="/shared/zts.css">\n' +
    '<script type="application/ld+json">' + JSON.stringify(howto) + '</script>\n' +
    '<script type="application/ld+json">' + JSON.stringify(breadcrumb) + '</script>\n' +
    '<style>\n' +
    'body{background:#0F0F2E;color:#1a1a2e;margin:0;font-family:"Quicksand",system-ui,sans-serif;}\n' +
    '.fiche-wrap{max-width:820px;margin:0 auto;padding:24px 18px 80px;}\n' +
    '.fiche-crumb{font-size:.9rem;color:#9fd8ff;margin:8px 0 18px;}\n' +
    '.fiche-crumb a{color:#9fd8ff;text-decoration:none;}\n' +
    '.fiche-head{background:linear-gradient(160deg,#E0F7FF,#CFF3FF);border:3px solid #0F0F2E;border-radius:24px;box-shadow:7px 7px 0 #0F0F2E;padding:26px 24px;margin-bottom:22px;}\n' +
    '.fiche-cat{display:inline-block;background:#FFD700;border:2px solid #0F0F2E;border-radius:999px;padding:5px 14px;font-weight:700;font-size:.85rem;box-shadow:2px 2px 0 #0F0F2E;}\n' +
    '.fiche-head h1{font-family:"Luckiest Guy",cursive;font-size:clamp(28px,6vw,44px);line-height:1.05;margin:14px 0 10px;color:#0F0F2E;}\n' +
    '.fiche-but{font-size:1.2rem;color:#1a2540;margin:0;}\n' +
    '.fiche-facts{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px;}\n' +
    '.fiche-fact{background:#fff;border:2px solid #0F0F2E;border-radius:12px;padding:7px 12px;font-size:.92rem;font-weight:600;}\n' +
    '.fiche-fact b{color:#0077a3;}\n' +
    '.fiche-sec{background:#fff;border:3px solid #0F0F2E;border-radius:20px;box-shadow:5px 5px 0 #0F0F2E;padding:22px 22px;margin-bottom:18px;}\n' +
    '.fiche-sec h2{font-family:"Luckiest Guy",cursive;font-size:1.5rem;color:#0F0F2E;margin:0 0 12px;letter-spacing:.5px;}\n' +
    '.fiche-sec p,.fiche-sec li{font-size:1.06rem;line-height:1.6;color:#243;}\n' +
    '.fiche-sec ul,.fiche-sec ol{margin:0;padding-left:1.3em;}\n' +
    '.fiche-sec li{margin-bottom:7px;}\n' +
    '.fiche-tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;}\n' +
    '.fiche-tags span{background:#E0F7FF;border:2px solid #0F0F2E;border-radius:999px;padding:4px 12px;font-size:.85rem;font-weight:600;}\n' +
    '.fiche-cta{display:block;text-align:center;background:linear-gradient(135deg,#00E5FF,#0096C7);color:#0F0F2E;font-family:"Luckiest Guy",cursive;font-size:1.3rem;letter-spacing:1px;text-decoration:none;border:3px solid #0F0F2E;border-radius:16px;box-shadow:5px 5px 0 #0F0F2E;padding:18px;margin:8px 0 22px;}\n' +
    '.fiche-related{display:flex;flex-wrap:wrap;gap:10px;}\n' +
    '.fiche-related a{background:#FFF3C4;border:2px solid #0F0F2E;border-radius:12px;padding:9px 14px;font-weight:700;text-decoration:none;color:#0F0F2E;box-shadow:2px 2px 0 #0F0F2E;}\n' +
    '</style>\n</head>\n<body>\n' +
    '<div data-zts-header></div>\n' +
    '<main class="fiche-wrap">\n' +
    '<nav class="fiche-crumb"><a href="/">Accueil</a> › <a href="/jeux/">Jeux</a> › ' + esc(nomTitre) + '</nav>\n' +
    '<header class="fiche-head">\n' +
    '<span class="fiche-cat">' + esc(icon) + ' ' + esc(cat) + '</span>\n' +
    '<h1>' + esc(nomTitre) + '</h1>\n' +
    (but ? '<p class="fiche-but">' + esc(but) + '</p>' : '') +
    (facts.length ? '<div class="fiche-facts">' + facts.map(function (f) { return '<span class="fiche-fact"><b>' + esc(f[0]) + ' :</b> ' + esc(f[1]) + '</span>'; }).join('') + '</div>' : '') +
    '</header>\n' +
    section('🎒 Matériel', ul(materiel)) +
    (g.disposition ? section('📐 Disposition', p(str(g.disposition))) : '') +
    section('▶️ Déroulement', ol(deroulement)) +
    section('🔄 Variantes', ul(variantes)) +
    section('🛡️ Consignes de sécurité', ul(securite)) +
    section('♿ Adaptations (inclusion)', ul(adaptations)) +
    (g.roleEnseignant ? section('🧑‍🏫 Rôle de l\'enseignant', p(str(g.roleEnseignant))) : '') +
    (g.retourAuCalme ? section('🧘 Retour au calme', p(str(g.retourAuCalme))) : '') +
    section('💬 Questions de réflexion', ul(reflexion)) +
    section('⚠️ Erreurs fréquentes', ul(erreurs)) +
    (g.origine ? section('📖 Origine', p(str(g.origine))) : '') +
    '<a class="fiche-cta" href="https://jeux.zonetotalsport.ca">🎮 Voir les 1400+ jeux dans l\'app gratuite →</a>\n' +
    (tags.length ? '<section class="fiche-sec"><h2>Tags</h2><div class="fiche-tags">' + tags.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div></section>' : '') +
    relHtml +
    '</main>\n' +
    '<div data-zts-footer></div>\n' +
    '<script src="/shared/zts.js"></script>\n' +
    '<script src="/firebase-auth.js" defer></script>\n' +
    '<script src="/zts-funnel.js" defer></script>\n' +
    '</body>\n</html>\n';
}

// ---------- main ----------
const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const games = Array.isArray(raw) ? raw : (raw.jeux || raw.games || Object.values(raw).find(Array.isArray));

// slugs uniques
const used = {};
games.forEach(function (g) {
  let s = slugify(g.title) || ('jeu-' + g.id);
  if (used[s]) s = s + '-' + slugify(str(g.id));
  used[s] = true;
  g.__slug = s;
});

// index par catégorie pour "related"
const byCat = {};
games.forEach(function (g) { (byCat[g.category] = byCat[g.category] || []).push(g); });

if (SAMPLE) {
  const g = games.find(function (x) { return str(x.id) === SAMPLE; }) || games[0];
  const rel = (byCat[g.category] || []).filter(function (x) { return x !== g; }).slice(0, 6)
    .map(function (x) { return { slug: x.__slug, title: x.title }; });
  process.stdout.write(buildPage(g, g.__slug, rel));
  process.exit(0);
}

if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });

let n = 0;
const urls = [];
for (const g of games) {
  if (n >= LIMIT) break;
  const rel = (byCat[g.category] || []).filter(function (x) { return x !== g; }).slice(0, 6)
    .map(function (x) { return { slug: x.__slug, title: x.title }; });
  fs.writeFileSync(path.join(OUTDIR, g.__slug + '.html'), buildPage(g, g.__slug, rel));
  urls.push(BASE + '/jeux/' + g.__slug + '.html');
  n++;
}

// ---------- page index /jeux/ (hub par catégorie, maillage interne) ----------
if (LIMIT === Infinity) {
  const cats = Object.keys(byCat).sort(function (a, b) { return byCat[b].length - byCat[a].length; });
  let body = '';
  cats.forEach(function (c) {
    const list = byCat[c];
    const icon = str(list[0].categoryIcon) || '🎮';
    const cname = str(list[0].categoryName) || c;
    body += '<section class="jx-cat"><h2>' + esc(icon + ' ' + cname) + ' <span>(' + list.length + ')</span></h2><div class="jx-grid">' +
      list.map(function (g) {
        const t = g.title.charAt(0) + g.title.slice(1).toLowerCase();
        return '<a href="/jeux/' + g.__slug + '.html">' + esc(t) + '</a>';
      }).join('') + '</div></section>';
  });
  const idx = '<!DOCTYPE html>\n<html lang="fr-CA">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>1400+ jeux d\'éducation physique au primaire — règles et déroulement | Zone Total Sport</title>\n' +
    '<meta name="description" content="La plus grande banque de jeux d\'éducation physique au primaire : ' + games.length + ' jeux avec règles, déroulement, variantes et adaptations. Gratuit, aligné PFEQ.">\n' +
    '<link rel="canonical" href="' + BASE + '/jeux/">\n' +
    '<meta property="og:title" content="1400+ jeux d\'éducation physique au primaire">\n' +
    '<meta property="og:description" content="Banque de ' + games.length + ' jeux ÉP avec règles complètes. Gratuit, aligné PFEQ.">\n' +
    '<meta property="og:image" content="' + BASE + '/logo-zts.png">\n<meta property="og:url" content="' + BASE + '/jeux/">\n<meta property="og:type" content="website">\n' +
    '<link rel="icon" href="/favicon-bucheron.png">\n' +
    '<link href="https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Fredoka:wght@400;600;700&family=Quicksand:wght@500;700&display=swap" rel="stylesheet">\n' +
    '<link rel="stylesheet" href="/shared/zts.css">\n' +
    '<style>body{background:#0F0F2E;margin:0;font-family:"Quicksand",system-ui,sans-serif;}' +
    '.jx-wrap{max-width:1000px;margin:0 auto;padding:24px 18px 80px;}' +
    '.jx-hero{background:linear-gradient(160deg,#E0F7FF,#CFF3FF);border:3px solid #0F0F2E;border-radius:24px;box-shadow:7px 7px 0 #0F0F2E;padding:28px 24px;margin-bottom:24px;text-align:center;}' +
    '.jx-hero h1{font-family:"Luckiest Guy",cursive;font-size:clamp(26px,5vw,40px);color:#0F0F2E;margin:0 0 8px;}' +
    '.jx-hero p{font-size:1.1rem;color:#1a2540;margin:0;}' +
    '.jx-cat{background:#fff;border:3px solid #0F0F2E;border-radius:18px;box-shadow:5px 5px 0 #0F0F2E;padding:18px 20px;margin-bottom:16px;}' +
    '.jx-cat h2{font-family:"Luckiest Guy",cursive;font-size:1.4rem;color:#0F0F2E;margin:0 0 12px;}' +
    '.jx-cat h2 span{color:#0077a3;font-size:1rem;}' +
    '.jx-grid{display:flex;flex-wrap:wrap;gap:8px;}' +
    '.jx-grid a{background:#FFF3C4;border:2px solid #0F0F2E;border-radius:10px;padding:7px 12px;font-size:.92rem;font-weight:600;text-decoration:none;color:#0F0F2E;}' +
    '.jx-grid a:hover{background:#FFD700;}</style>\n</head>\n<body>\n<div data-zts-header></div>\n' +
    '<main class="jx-wrap"><header class="jx-hero"><h1>🎮 ' + games.length + ' jeux d\'éducation physique</h1>' +
    '<p>Règles, déroulement, variantes et adaptations — gratuit, aligné PFEQ. Clique un jeu pour la fiche complète.</p></header>\n' +
    body + '</main>\n<div data-zts-footer></div>\n<script src="/shared/zts.js"></script>\n<script src="/firebase-auth.js" defer></script>\n</body>\n</html>\n';
  fs.writeFileSync(path.join(OUTDIR, 'index.html'), idx);
  urls.unshift(BASE + '/jeux/');
}

// sitemap dédié
const sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(function (u) { return '  <url><loc>' + u + '</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>'; }).join('\n') +
  '\n</urlset>\n';
fs.writeFileSync(path.join(ROOT, 'sitemap-jeux.xml'), sm);

console.log('Généré ' + n + ' fiches + index dans /jeux/ + sitemap-jeux.xml (' + urls.length + ' URLs)');
