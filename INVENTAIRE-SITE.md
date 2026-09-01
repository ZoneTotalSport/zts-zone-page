# INVENTAIRE-SITE — Chantier SITE IMPECCABLE, vague 0

> **Portée** : dépôt `zts-zone-page` (`~/dev/Remotion 2/wix-deploy/`), branche `origin/main`
> au commit `4f3e78a0`. Prod : zonetotalsport.ca.
> **Nature** : lecture seule. On recense, on ne juge pas. Aucune recommandation, aucune
> fusion, aucune correction dans cette vague — les colonnes « chevauche avec » et la
> section 6 ne contiennent que des **faits bruts** et des rapprochements à vue de nez,
> pas des décisions.
> **Date** : 2026-09-01.

---

## 1. Apps

49 dossiers actifs dans `apps/` + 2 dossiers dans `apps/_archive/`.

**Légende des colonnes**
- *Mur* : `zts-gate.js` = mur d'inscription du gabarit partagé ; `lock-page` =
  `zts-lock-page.js` + `zts-locked-fullscreen.js` ; `cadenas` = `zts-cadenas.js` ;
  `LIBRE (whitelist)` = slug présent dans `locked-whitelist.json` → `freeResources`.
- *ztsh* : l'app charge `assets/ztsh-shell.css` + `ztsh-shell.js` (habillage coquille).
- *Liens entrants* : nombre de pages/articles/partiels du dépôt qui pointent vers l'app
  (hors ses propres fichiers). Sources comptées : les 19 HTML racine, les 27 articles, les
  49 `apps/*/index.html`, `shared/header.html`, `shared/footer.html`, `header.html`,
  `footer.html`, `shared/zts-menu.js`, `shared/nouveautes.json`, `fiches/index.html`.

### 1.1 — La famille du « gabarit partagé » (23 apps)

Toutes portent en tête de fichier le commentaire `<!-- App — … Gabarit partagé. -->`,
tiennent en **un seul `index.html`**, chargent `shared/zts.css` + `assets/ztsh-shell.css`
+ `shared/zts.js` + `shared/zts-gate.js`, n'écrivent **aucune donnée**, et embarquent leur
contenu dans un tableau JS `const GAMES = […]` en dur, bilingue FR/EN.

| Nom | Chemin | Fonction | Public | Items en dur | État | Mur | ztsh | CSS | Données | Deps | Chevauche avec (à vue de nez) | Liens entrants |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| activites-duree | apps/activites-duree/ | Activités filtrées par durée disponible | SDG | 9 | prod | zts-gate | oui | zts.css, ztsh-shell.css | aucune | Google Fonts | jeux-rapides, jeux | 1 (service-de-garde.html) |
| bricolages | apps/bricolages/ | Bricolages sans préparation | SDG | 8 | prod | zts-gate | oui | zts.css, ztsh-shell.css | aucune | Google Fonts | journee-pedago, colorier | 1 (service-de-garde.html) |
| brise-glace | apps/brise-glace/ | Jeux pour se connaître en début de groupe | Camp | 8 | prod | zts-gate | oui | zts.css, ztsh-shell.css | aucune | Google Fonts | jeux-rapides, grands-jeux | 1 (camps-de-jour.html) |
| chansons-camp | apps/chansons-camp/ | Chansons et cris de ralliement de camp | Camp | 10 | prod | zts-gate | oui | zts.css, ztsh-shell.css | aucune | Google Fonts | comptines, veillee-feu-de-camp, musique | 1 (camps-de-jour.html) |
| comptines | apps/comptines/ | Comptines et chansons pour les tout-petits | ÉPS (commentaire) / SDG (contenu) | 8 | prod | zts-gate | oui | zts.css, ztsh-shell.css | aucune | Google Fonts | chansons-camp, musique | 1 (ep.html) |
| echauffements | apps/echauffements/ | Banque d'échauffements dynamiques | ÉPS | 8 | prod | zts-gate | oui | zts.css, ztsh-shell.css | aucune | Google Fonts | jeux-rapides, educatifs | 1 (ep.html) |
| enigmes | apps/enigmes/ | Énigmes et devinettes | transversal | 10 | prod | zts-gate | oui | zts.css, ztsh-shell.css | aucune | Google Fonts | rallyes, jeux-calmes | 1 (ep.html) |
| grands-jeux | apps/grands-jeux/ | Grands jeux thématiques de camp | Camp | 8 | prod | zts-gate | oui | zts.css, ztsh-shell.css | aucune | Google Fonts | olympiades, rallyes, jeux-par-theme | 1 (camps-de-jour.html) |
| intervention-groupe | apps/intervention-groupe/ | SOS crise + jeux inclusifs, gestion de groupe | ÉPS | 8 | prod | zts-gate | oui | zts.css, ztsh-shell.css | aucune | Google Fonts | **omnigroupe**, sos-conflits | 1 (ep.html) |
| jeux-calmes | apps/jeux-calmes/ | Jeux calmes, retour au calme | SDG | 8 | prod | zts-gate | oui | zts.css, ztsh-shell.css | aucune | Google Fonts | transitions, enigmes | 1 (service-de-garde.html) |
| jeux-eau | apps/jeux-eau/ | Jeux d'eau, journées chaudes | Camp | 8 | prod | zts-gate | oui | zts.css, ztsh-shell.css | aucune | Google Fonts | grands-jeux, plan-b-meteo | 1 (camps-de-jour.html) |
| jeux-par-theme | apps/jeux-par-theme/ | Jeux classés par thème/intention | Camp | 8 | prod | zts-gate | oui | zts.css, ztsh-shell.css | aucune | Google Fonts | jeux, grands-jeux | 1 (camps-de-jour.html) |
| jeux-rapides | apps/jeux-rapides/ | Jeux courts sans matériel | SDG | 10 | prod | zts-gate | oui | zts.css, ztsh-shell.css | aucune | Google Fonts | activites-duree, brise-glace, transitions | 1 (service-de-garde.html) |
| journee-pedago | apps/journee-pedago/ | Constructeur de journée pédagogique | SDG | 7 | prod | zts-gate | oui | zts.css, ztsh-shell.css | aucune | Google Fonts | bricolages, plan-b-pluie | 1 (service-de-garde.html) |
| noms-de-clans | apps/noms-de-clans/ | Générateur de noms d'équipes/clans | Camp | 0 (générateur) | prod | zts-gate | oui | zts.css, ztsh-shell.css | aucune | Google Fonts | olympiades | 1 (camps-de-jour.html) |
| olympiades | apps/olympiades/ | Pointage inter-équipes pour olympiades/tournois | Camp | 2 | prod | zts-gate | oui | zts.css, ztsh-shell.css | aucune | Google Fonts | **olympiades-scolaires**, scoreboard, noms-de-clans | 1 (camps-de-jour.html) |
| olympiades-scolaires | apps/olympiades-scolaires/ | Épreuves & organisation d'olympiades scolaires | ÉPS | 8 | prod | zts-gate | oui | zts.css, ztsh-shell.css | aucune | Google Fonts | **olympiades**, grands-jeux | 1 (ep.html) |
| plan-b-meteo | apps/plan-b-meteo/ | Activités de rechange quand l'extérieur tombe | ÉPS | 10 | prod | zts-gate | oui | zts.css, ztsh-shell.css | aucune | Google Fonts | **plan-b-pluie** | 1 (ep.html) |
| plan-b-pluie | apps/plan-b-pluie/ | Jeux intérieurs les jours de pluie | SDG | 8 | prod | zts-gate | oui | zts.css, ztsh-shell.css | aucune | Google Fonts | **plan-b-meteo**, journee-pedago | 1 (service-de-garde.html) |
| rallyes | apps/rallyes/ | Rallyes et chasses au trésor | Camp | 4 | prod | zts-gate | oui | zts.css, ztsh-shell.css | aucune | Google Fonts | enigmes, grands-jeux | 1 (camps-de-jour.html) |
| roue-responsabilites | apps/roue-responsabilites/ | Roue de tâches + minuteur de routines | SDG | 0 (roue) | prod | zts-gate | oui | zts.css, ztsh-shell.css | aucune | Google Fonts | transitions, omnigroupe | 1 (service-de-garde.html) |
| sos-conflits | apps/sos-conflits/ | Stratégies de résolution de conflits | SDG | 6 | prod | zts-gate | oui | zts.css, ztsh-shell.css | aucune | Google Fonts | **intervention-groupe**, omnigroupe | 1 (service-de-garde.html) |
| veillee-feu-de-camp | apps/veillee-feu-de-camp/ | Veillées, sketchs, feux de camp | Camp | 8 | prod | zts-gate | oui | zts.css, ztsh-shell.css | aucune | Google Fonts | chansons-camp, grands-jeux | 1 (camps-de-jour.html) |

### 1.2 — Les apps hors gabarit (26 apps)

| Nom | Chemin | Fonction | Public | État | Mur | ztsh | CSS chargé | Données | Deps externes | Chevauche avec (à vue de nez) | Liens entrants |
|---|---|---|---|---|---|---|---|---|---|---|---|
| agenda | apps/agenda/ | Agenda scolaire / planificateur d'éducateur physique | ÉPS | prod | lock-page | oui | zts-header.css, ztsh-shell.css | localStorage + Firestore | Google Fonts, Tailwind CDN, www.zonetotalsport.ca | planificateur, grille, planification | 1 (ep.html) |
| code-oreille | apps/code-oreille/ | 14 fiches d'imprévus (vomi, guêpes, alarme) hors ligne | ÉPS/Camp/SDG (non listée dans les 3 univers) | prod | lock-page | **non** | **aucun** (styles inline + Tailwind) | localStorage + Firestore | Google Fonts, Tailwind CDN | intervention-groupe, omnigroupe, sos-conflits | 2 (articles/catastrophes-ordinaires.html, shared/nouveautes.json) |
| colorier | apps/colorier/ | Génère, colorie en ligne et imprime des pages à colorier | ÉPS/Camp/SDG | prod | **LIBRE (whitelist)** | oui | zts-header.css, zts-ultra.css, ztsh-shell.css | Firestore | Google Fonts, `zts-colorier.zts-ccd.workers.dev` | bricolages | 4 |
| cours-maternelle | apps/cours-maternelle/ | 90 cours d'ÉPS clés en main pour la maternelle | ÉPS + SDG | prod | lock-page | oui | zts-header.css, ztsh-shell.css | localStorage + Firestore | Google Fonts | planificateur, sae, educatifs | 7 |
| decodage | apps/decodage/ | Sens émotionnel des symptômes (7 approches) | **aucun univers** — hors mission ÉPS/Camp/SDG | prod (hors sitemap) | cadenas | **non** | **aucun** | localStorage + Firestore | Firebase SDK, api.zonetotalsport.ca | — | 2 (apps/studio-jeu, shared/nouveautes.json) |
| educatifs | apps/educatifs/ | Éducatifs et progressions techniques par sport | ÉPS | prod | lock-page | oui | zts-header.css, zts-ultra.css, ztsh-shell.css | localStorage + Firestore | Google Fonts, Tailwind CDN | sae, jeux, echauffements | **29** (dont 25 articles) |
| evaluation | apps/evaluation/ | Carnet d'évaluation PFEQ (notes, observations) | ÉPS | prod | lock-page | **non** | zts-ultra.css | localStorage + Firestore | Google Fonts, Tailwind CDN | performances, moyens-action | 6 |
| generateur | apps/generateur/ | Génération IA de jeux / SAÉ / éducatifs | ÉPS | prod (Fusion #1 shippée) | lock-page | oui | zts-header.css, zts-ultra.css, ztsh-shell.css | localStorage + Firestore | Firebase SDK, api.zonetotalsport.ca, Google Fonts | jeux, sae, educatifs | 3 |
| grille | apps/grille/ | Grille horaire (périodes, groupes, locaux) | ÉPS/Camp/SDG | prod | lock-page | oui | zts-header.css, zts-ultra.css, ztsh-shell.css, zts-modele.css | localStorage + Firestore | — | agenda, planificateur | 5 |
| inventaire | apps/inventaire/ | Inventaire du matériel par photo, reconnu par l'IA | ÉPS/Camp/SDG | prod | zts-gate | oui | zts.css, ztsh-shell.css | localStorage + sessionStorage + Firestore | Firebase SDK, api.zonetotalsport.ca | — | 6 |
| jeux | apps/jeux/ | Répertoire de 1439 jeux, filtrable | ÉPS | prod | **LIBRE (whitelist)** — fiches murées | oui | zts-header.css, ztsh-shell.css | localStorage + Firestore | Google Fonts, Tailwind CDN | sae, educatifs, jeux-par-theme, fiches/ | 4 |
| moyens-action | apps/moyens-action/ | Calendrier des moyens d'action PFEQ | ÉPS (aucun univers ne la liste) | prod | lock-page | oui | zts-header.css, ztsh-shell.css | Firestore | Google Fonts, Tailwind CDN, jeux.zonetotalsport.ca | planificateur, planification, evaluation | 6 (dont 6 articles) |
| musique | apps/musique/ | Playlists musicales pour les cours | ÉPS/Camp/SDG | prod | **LIBRE (whitelist)** | oui | zts-header.css, zts-ultra.css, ztsh-shell.css | localStorage + Firestore | Google Fonts, Tailwind CDN | chansons-camp, comptines, transitions | 6 |
| nba-playoffs | apps/nba-playoffs/ | — « Page retirée » | — | **abandonné** (redirigé 301 → `/`) | aucun | non | aucun | aucune | — | apps-nba/, sports-news.html | **0** |
| nhl-playoffs | apps/nhl-playoffs/ | — « Page retirée » | — | **abandonné** (redirigé 301 → `/`) | aucun | non | aucun | aucune | — | apps-nhl/, sports-news.html | **0** |
| omnigroupe | apps/omnigroupe/ | « Couteau suisse » : minuteur, équipes, séquenceur, dessin | ÉPS (aucun univers ne la liste) | prod | lock-page | oui | zts-header.css, ztsh-shell.css | localStorage + Firestore | Tailwind CDN | **intervention-groupe** (titre `<title>` identique), sos-conflits, transitions, tni | 1 (articles/50-jeunes-un-gymnase.html) |
| performances | apps/performances/ | Filmer les performances élèves → Drive, classées PFEQ | ÉPS | prod | zts-gate **+** lock-page (les deux) | oui | zts.css, ztsh-shell.css | localStorage + sessionStorage + Firestore | Firebase SDK, Google Fonts | evaluation | 2 |
| planificateur | apps/planificateur/ | Planificateur quotidien / annuel (calendrier central) | ÉPS/Camp/SDG | prod | lock-page | **non** | zts.css, zts-modele.css | localStorage + Firestore | Firebase SDK, Google Fonts, coordo.zonetotalsport.ca, educatifs.zonetotalsport.ca | **planification**, agenda, grille, moyens-action | 8 |
| planification | apps/planification/ | « Squelette de validation » du modèle de données de planification | aucun univers | **prototype** (déclaré tel quel en tête de fichier) | zts-gate | oui | zts.css, ztsh-shell.css | localStorage | Google Fonts | **planificateur**, moyens-action, agenda | 1 (shared/footer.html) |
| rencontres | apps/rencontres/ | Comptes rendus de rencontre (notes, dictée, dépôt) | ÉPS/Camp/SDG | prod | zts-gate **+** lock-page | oui | zts.css, ztsh-shell.css | localStorage + Firestore | Firebase SDK, api.zonetotalsport.ca | — | 5 |
| sae | apps/sae/ | Banque de SAÉ PFEQ (~1880) | ÉPS | prod | **LIBRE (whitelist)** — fiches murées | oui | zts-header.css, zts-ultra.css, ztsh-shell.css | localStorage + Firestore | Google Fonts, Tailwind CDN | jeux, educatifs, generateur | **26** (dont 23 articles) |
| scoreboard | apps/scoreboard/ | Tableau de pointage TNI (basket, hockey, football) | ÉPS/Camp/SDG | prod | lock-page | **non** | zts-header.css, zts-ultra.css | localStorage + Firestore | Google Fonts | olympiades, tni | 6 |
| studio-jeu | apps/studio-jeu/ | Éditeur visuel de mises en scène sur terrain, export PNG/PDF | aucun univers | prod (**hors sitemap**) | cadenas | oui | ztsh-shell.css seul | localStorage + Firestore | Firebase SDK, Google Fonts | tni, fiches/ | 3 (footer.html, shared/footer.html, shared/nouveautes.json) |
| suppleance | apps/suppleance/ | Planificateur pour suppléants en ÉPS | ÉPS | prod | **LIBRE (whitelist)** | oui | zts-header.css, zts-ultra.css, ztsh-shell.css | localStorage + Firestore | Google Fonts, Tailwind CDN, www.zonetotalsport.ca | planificateur, agenda | 4 |
| tni | apps/tni/ | Tableau blanc numérique interactif | ÉPS/Camp/SDG | prod | lock-page | oui | zts-header.css, zts-ultra.css, ztsh-shell.css | localStorage + Firestore | Google Fonts | studio-jeu, omnigroupe, scoreboard | 4 |
| transitions | apps/transitions/ | Outils de transition au gymnase | ÉPS/Camp/SDG | prod | lock-page | oui | zts-header.css, zts-ultra.css, ztsh-shell.css | localStorage + Firestore | Google Fonts, Tailwind CDN | jeux-calmes, roue-responsabilites, omnigroupe, musique | 6 |

### 1.3 — Archives et outils hors `apps/`

| Nom | Chemin | Fonction | Public | État | Mur | ztsh | Données | Liens entrants |
|---|---|---|---|---|---|---|---|---|
| generateur-legacy-2026-05 | apps/_archive/generateur-legacy-2026-05/ | Ancien générateur SAÉ (+ `mockup-fiche.html`) | ÉPS | **archivé** | lock-page (hérité) | non | localStorage + Firestore | 0 |
| planificateur-eps-legacy | apps/_archive/planificateur-eps-legacy/ | Ancien planificateur pédagogique | ÉPS | **archivé** | lock-page (hérité) | non | localStorage + Firestore | 0 |
| fiches (public) | fiches/ | Lecteur de fiches de jeu (`index.html` + `fiche.html`), alimenté par `jeux-merged.json` via Firebase | ÉPS | prod | non vérifié | non | Firestore | lié depuis apps/jeux |
| fiches (admin) | admin/fiches/ | Éditeur de fiches | interne | prod (non listé au sitemap) | non vérifié | non | Firestore | 0 |
| entrainement | entrainement/ | PWA personnelle « T25 + Dig Deeper » (manifest + icônes) | **personnel, hors mission** | prod (hors sitemap) | aucun | non | non vérifié | 0 |
| aidons-nous | aidons-nous/ + aidons-nous.html | Page « Aidons-nous » (45 Ko) + une redirection de 465 o à la racine | transversal | prod (au sitemap) | non vérifié | non | non vérifié | — |
| apps-nba / apps-nhl / apps-fifa | apps-nba/, apps-nhl/, apps-fifa/ | Trois « Page retirée » de 1728 o | — | **abandonné** (301 → `/`) | aucun | non | aucune | 0 |
| campagne | campagne/posts-campagne.html | Les 81 posts de la campagne sociale (86 Ko) + 4 fichiers de travail | interne | outil interne | aucun | non | aucune | 0 |
| docs/maquette-planif-v2 | docs/maquette-planif-v2.html | Maquette v2 du planificateur (41 Ko) | interne | **maquette** | aucun | non | aucune | 0 |
| wix/ | wix/ | 16 fichiers HTML de l'ancienne intégration Wix | — | **héritage mort** | aucun | non | aucune | 0 |

---

## 2. Pages hors apps

### 2.1 — Racine

| Page | Rôle | État | Anomalies visibles |
|---|---|---|---|
| index.html | Accueil (199 940 o) | prod | Ne lie que 11 des 49 apps. N'appelle pas `analytics.js` (0 occurrence de `gtag` **et** 0 de `analytics.js`) — le GA4 `G-C2L5PD388L` vit dans `analytics.js`, non chargé ici. **Absent du sitemap** en tant que `/index.html` (présent sous la forme `/`). |
| blog.html | Index du blog (58 Ko) | prod | Liste des articles dans un tableau JS inline `const POSTS` — la duplication de source dont `shared/nouveautes.json` se plaint explicitement dans son `_lisezmoi`. |
| blog-avant.html | Version antérieure du blog (20 Ko) | **résidu** | Hors sitemap, aucun lien entrant. |
| bienvenue.html | Page d'arrivée post-inscription (aimant email) | prod | Hors sitemap (volontaire ?). Rebondit vers `/` pour un visiteur non authentifié (documenté dans CLAUDE.md). |
| login.html | Connexion | prod | Hors sitemap. |
| ep.html | Hub univers **ÉPS** | prod (sitemap) | Lie **24** apps. |
| camps-de-jour.html | Hub univers **Camp** | prod (sitemap) | Lie **18** apps. |
| service-de-garde.html | Hub univers **SDG** | prod (sitemap) | Lie **18** apps. |
| repertoire.html | Répertoire mondial de jeux (28 Ko) | prod (sitemap) | **Ne contient aucun lien `apps/…`** — le répertoire ne pointe pas vers `apps/jeux`. |
| avis.html | Collecte d'avis (56 Ko) | prod (sitemap) | — |
| politique.html | Politique de confidentialité (38 Ko) | prod (sitemap) | **Seule page légale du site.** Référence `zone.zonetotalsport.ca`. |
| promo.html | Page promo (16 Ko) | prod (sitemap) | — |
| sports-news.html | Flux d'actualités sportives (175 Ko) | prod (sitemap) | Hors mission ÉPS/Camp/SDG. Grand nombre d'URL construites en JS (`${…}`). |
| teasing.html | « Page retirée » | **abandonné** | 301 → `/`. |
| index-old.html | « Page retirée » | **abandonné** | 301 → `/`. |
| article-template.html | Gabarit d'article (23 Ko) | outil interne | Contient `{{TITLE}}`, `{{IMAGE_URL}}` — normal, mais le fichier est servi tel quel à la racine du site. |
| header.html / footer.html | Partiels injectés par `includes.js` | prod | `footer.html` pèse **207 Ko** (le plus gros HTML du dépôt après index.html). Doublonne avec `shared/header.html` / `shared/footer.html`. |
| aidons-nous.html | Redirection de 465 o vers `aidons-nous/` | prod | — |

**Pages légales** : `politique.html` existe. **Aucune** page de conditions d'utilisation,
de mentions légales, ni de politique de témoins distincte.

**Page 404** : **aucune**. Pas de `404.html` à la racine, et `firebase.json` ne déclare
que le bloc `firestore` (pas de `hosting`) — l'hébergement est GitHub Pages, qui sert
donc sa page 404 générique.

**Pages-relais / redirections** : `redirections-cloudflare.csv` déclare 12 redirections
301 (5 pages retirées + 6 sous-domaines + `index-old`).

### 2.2 — Sous-domaines

| Sous-domaine | Statut déclaré | Où il apparaît |
|---|---|---|
| jeux.zonetotalsport.ca | 301 → `/apps/jeux/` | 1488 occurrences dans le dépôt (fiches de jeux) |
| agenda / generateur / ia / gym | 301 (csv) : agenda→apps/agenda, generateur & ia→apps/generateur, **gym→apps/transitions** | csv + sitemap |
| educatifs / evaluation / musique / sae / suppleance / tni | présents comme `<loc>` **absolus dans sitemap.xml** | sitemap.xml |
| api.zonetotalsport.ca | Worker de génération IA (Fusion #1) | generateur, decodage, inventaire, rencontres |
| notify.zonetotalsport.ca | Worker de notification | 4 occurrences |
| zone.zonetotalsport.ca | non vérifié | politique.html, wix/ |
| www / img / coordo / planificateur / nhl | non vérifié | dispersé |

⚠️ **Fait brut** : le sitemap contient **10 URL de sous-domaines** (`agenda.`, `educatifs.`,
`evaluation.`, `generateur.`, `gym.`, `jeux.`, `musique.`, `sae.`, `suppleance.`, `tni.`)
alors que le csv de redirections en déclare 6 comme 301 vers des chemins `/apps/…`.

### 2.3 — Le reste de la racine

`_data/`, `_patches/`, `_scripts/`, `scripts/`, `shared/`, `assets/`, `fonts/`, `jeux/`
(1440 fichiers), `articles/`, `cf-worker/`, `content/` (1 seul `.md`), `docs/`, `wix/`,
`admin/`, `entrainement/`, `campagne/`, `fiches/`, `apps-*` — plus **deux fichiers MP3**
de 8,3 Mo et 6,8 Mo, six visuels `fb-*` (dont trois `.jpg` de 960 627 o exactement),
`gym-bg.jpg` (513 Ko) et une trentaine de `.md` de chantier à la racine.

---

## 3. Articles de blog

27 articles dans `articles/`, **tous les 27 présents au sitemap**. Tous chargent
`article-views.js` (compteur Firestore `article_views`).

| Titre | Fichier | Date | Public(s) | Apps liées dans le corps | CTA vers une app | Images | `.article-body` | Vues |
|---|---|---|---|---|---|---|---|---|
| Grands groupes en gymnase : 21 stratégies EPS | 50-jeunes-un-gymnase.html | 2026-04-29 | ÉPS | educatifs, omnigroupe, sae | oui | 4 (dossier au nom espacé, cf. §6) | **4** | non vérifié |
| Préparer l'année scolaire en EPS | avance-annee-scolaire.html | 2025-01-15 | ÉPS | educatifs, planificateur, sae | oui | 0 | 2 | non vérifié |
| Bienfaits du sport pour les enfants | bienfaits-sport-enfants.html | 2025-01-15 | ÉPS, SDG | cours-maternelle, educatifs, sae | oui | 3 | 2 | non vérifié |
| Vomi, guêpes et alarme de feu | catastrophes-ordinaires.html | 2026-07-29 | ÉPS, Camp, SDG | code-oreille, educatifs, jeux | oui | 8 | 2 | non vérifié |
| Classes difficiles (1/3) — poser le cadre | classes-difficiles-partie-1.html | 2025-01-15 | ÉPS | educatifs, moyens-action, sae | oui | 0 | 2 | non vérifié |
| Classes difficiles (2/3) — stratégies | classes-difficiles-partie-2.html | 2025-01-15 | ÉPS | educatifs, sae, transitions | oui | 0 | 2 | non vérifié |
| Classes difficiles (3/3) — durer | classes-difficiles-partie-3.html | 2025-01-15 | ÉPS | educatifs, sae, scoreboard | oui | 0 | 2 | non vérifié |
| Color Run à l'école | color-run.html | 2025-01-15 | ÉPS, Camp | educatifs, sae | oui | 3 | 2 | non vérifié |
| Comportements perturbateurs en EPS | comportements-perturbateurs.html | 2025-01-15 | ÉPS | educatifs, moyens-action, sae | oui | 3 | 2 | non vérifié |
| Comptes rendus de rencontre | comptes-rendus-rencontres.html | 2026-08-25 | ÉPS, Camp, SDG | educatifs, rencontres | oui | 0 | 2 | non vérifié |
| Courbe du plaisir : durée d'un jeu | courbe-plaisir-jeu.html | 2025-01-15 | ÉPS | educatifs, sae | oui | 2 | 2 | non vérifié |
| Élèves cotés en EPS | eleves-cotes-eps.html | 2025-01-15 | ÉPS | educatifs, moyens-action, sae | oui | 0 | 2 | non vérifié |
| Faire bouger les enfants : 10 leviers | faire-bouger-enfants.html | 2025-01-15 | ÉPS | educatifs, sae | oui | 0 | 2 | non vérifié |
| Foobaskill : sport hybride | foobaskill.html | 2025-01-15 | ÉPS | educatifs, sae | oui | 3 | 2 | non vérifié |
| 20 grands jeux extérieurs pour camp de jour | grands-jeux-exterieurs-camp-de-jour.html | 2026-06-06 | Camp | **aucune** | oui (générique) | 3 | **1** | non vérifié |
| Harcèlement envers les enseignants | harcelement-enseignants.html | 2025-01-15 | ÉPS | cours-maternelle, educatifs, sae | oui | 3 | 2 | non vérifié |
| Inventaire du matériel : méthode éclair | inventaire-materiel-sans-effort.html | 2026-08-23 | ÉPS, Camp, SDG | educatifs, inventaire, sae | oui | 8 (.webp) | 2 | non vérifié |
| Jeux de course 1er cycle : 12 idées | jeux-course-1er-cycle.html | 2025-01-15 | ÉPS | educatifs, sae | oui | 3 | 2 | non vérifié |
| Nawatobi : corde à sauter japonaise | nawatobi.html | 2025-01-15 | ÉPS | educatifs, sae | oui | 3 | 2 | non vérifié |
| Rentrée scolaire en EPS | rentree-scolaire.html | 2025-01-15 | ÉPS | educatifs, planificateur, sae | oui | 0 | 2 | non vérifié |
| Respect en EPS | respect-eps.html | 2025-01-15 | ÉPS | educatifs, moyens-action, sae | oui | 2 | 2 | non vérifié |
| SAÉ course primaire | sae-course.html | 2025-01-15 | ÉPS | educatifs, planificateur, sae | oui | 0 | 2 | non vérifié |
| Suppléance en école | suppleance-ecoles.html | 2025-01-15 | ÉPS | educatifs, sae, suppleance | oui | 3 | 2 | non vérifié |
| Syndrome du gymnase | syndrome-gymnase.html | 2025-01-15 | ÉPS | educatifs, sae, transitions | oui | 5 | 2 | non vérifié |
| Émulation par dollars en classe | systeme-emulation-dollar.html | 2025-01-15 | ÉPS | educatifs, moyens-action, sae | oui | 2 | 2 | non vérifié |
| Émulation par dollars à l'échelle de l'école | systeme-emulation-dollars-ecole.html | 2025-01-15 | ÉPS | educatifs, moyens-action, sae | oui | 0 | 2 | non vérifié |
| Un seul jeu, trois versions | un-jeu-trois-versions.html | 2026-04-29 | ÉPS, Camp, SDG | **aucune** | oui (générique) | 5 | **0** | non vérifié |

**Notes factuelles sur la colonne images** : aucune image de mascotte **bûcheron** dans le
corps des articles, **sauf une** — `articles/images/timeout-bucheron.png` dans
`syndrome-gymnase.html`. Les autres visuels sont des illustrations d'article, pas des
mascottes ; leur conformité à la charte marine actuelle **n'a pas été jugée visuellement**
dans cette vague (voir §7).

**Notes sur `.article-body`** : la norme du gabarit est **2 balises** (`<div>` imbriqués).
Trois écarts : `50-jeunes-un-gymnase.html` (**4**), `grands-jeux-exterieurs-camp-de-jour.html`
(**1**), `un-jeu-trois-versions.html` (**0** — cet article utilise une structure Tailwind
`zts-prose` complètement différente, avec un `<article class="lg:col-span-8 …">`).

**Vues (`article_views`)** : **non vérifié** — la collection Firestore n'est pas lisible
depuis le dépôt et aucun export n'existe dans le repo.

---

## 4. Matrice article → apps

Colonne de gauche : ce qui est lié **aujourd'hui** dans le corps. Colonne de droite : apps
du catalogue qui traitent du même sujet et **ne sont pas liées**. Aucune décision ici.

| Article | Apps liées aujourd'hui | Apps du catalogue sur le même sujet, non liées |
|---|---|---|
| 50-jeunes-un-gymnase | educatifs, omnigroupe, sae | intervention-groupe, transitions, jeux, jeux-rapides, scoreboard, tni |
| avance-annee-scolaire | educatifs, planificateur, sae | agenda, grille, moyens-action, planification, cours-maternelle |
| bienfaits-sport-enfants | cours-maternelle, educatifs, sae | jeux, generateur, performances |
| catastrophes-ordinaires | code-oreille, educatifs, jeux | intervention-groupe, sos-conflits, omnigroupe, plan-b-meteo, plan-b-pluie |
| classes-difficiles-1 | educatifs, moyens-action, sae | intervention-groupe, omnigroupe, sos-conflits, transitions, evaluation |
| classes-difficiles-2 | educatifs, sae, transitions | intervention-groupe, omnigroupe, jeux-calmes, roue-responsabilites, musique |
| classes-difficiles-3 | educatifs, sae, scoreboard | evaluation, performances, moyens-action, tni |
| color-run | educatifs, sae | olympiades, olympiades-scolaires, grands-jeux, rallyes, noms-de-clans |
| comportements-perturbateurs | educatifs, moyens-action, sae | intervention-groupe, sos-conflits, omnigroupe, transitions |
| comptes-rendus-rencontres | educatifs, rencontres | grille, agenda, inventaire |
| courbe-plaisir-jeu | educatifs, sae | jeux, jeux-rapides, activites-duree, jeux-par-theme, transitions |
| eleves-cotes-eps | educatifs, moyens-action, sae | evaluation, performances, generateur, intervention-groupe |
| faire-bouger-enfants | educatifs, sae | jeux, jeux-rapides, echauffements, cours-maternelle, transitions |
| foobaskill | educatifs, sae | jeux, generateur, scoreboard, studio-jeu |
| grands-jeux-exterieurs-camp-de-jour | **aucune** | grands-jeux, jeux-par-theme, rallyes, olympiades, jeux-eau, noms-de-clans, veillee-feu-de-camp, brise-glace, jeux |
| harcelement-enseignants | cours-maternelle, educatifs, sae | rencontres, sos-conflits |
| inventaire-materiel-sans-effort | educatifs, inventaire, sae | grille, planificateur |
| jeux-course-1er-cycle | educatifs, sae | jeux, jeux-rapides, echauffements, cours-maternelle, generateur |
| nawatobi | educatifs, sae | jeux, generateur, studio-jeu |
| rentree-scolaire | educatifs, planificateur, sae | agenda, grille, moyens-action, suppleance, inventaire, cours-maternelle |
| respect-eps | educatifs, moyens-action, sae | sos-conflits, intervention-groupe, omnigroupe |
| sae-course | educatifs, planificateur, sae | jeux, generateur, moyens-action, evaluation |
| suppleance-ecoles | educatifs, sae, suppleance | jeux, jeux-rapides, plan-b-meteo, grille, code-oreille |
| syndrome-gymnase | educatifs, sae, transitions | jeux-calmes, musique, roue-responsabilites, intervention-groupe, omnigroupe |
| systeme-emulation-dollar | educatifs, moyens-action, sae | evaluation, roue-responsabilites, omnigroupe |
| systeme-emulation-dollars-ecole | educatifs, moyens-action, sae | evaluation, roue-responsabilites, rencontres |
| un-jeu-trois-versions | **aucune** | jeux, generateur, jeux-par-theme, activites-duree, sae, educatifs, studio-jeu |

**Fait brut sur la distribution** : `educatifs` est lié depuis **25 articles sur 27** et
`sae` depuis **23 sur 27** — les deux sont présents dans le pied d'article générique. En
retirant ces deux-là, **12 articles sur 27 ne lient plus aucune app**.

---

## 5. Catalogue de jeux

**Fichier maître** : `_data/jeux-merged.json` — 12 026 449 o (11,5 Mo).

- **1439 jeux**, structure : un tableau JSON racine (pas d'enveloppe).
- **58 champs distincts** : `id`, `title`/`titleEn`, `category`, `categoryName`,
  `categoryIcon`, `categoryColor`, `but`/`butEn`, `intentionsC1`/`C2`/`C3`,
  `transversales`/`transversalesEn`, `materiel`/`materielEn`, `disposition`/`dispositionEn`,
  `duree`/`dureeEn`, `dureeMin`, `deroulement`/`deroulementEn`, `variantes`/`variantesEn`,
  `origine`/`origineEn`, `ageMin`, `ageMax`, `nbJoueursMin`, `nbJoueursMax`,
  `espace`/`espaceEn`, `niveauActivite`/`niveauActiviteEn`, `niveau`/`niveauEn`,
  `consignesSecurite`/`…En`, `adaptations`/`…En`, `roleEnseignant`/`…En`,
  `retourAuCalme`/`…En`, `questionsReflexion`/`…En`, `progression`/`…En`,
  `erreursFrequentes`/`…En`, `noms_alternatifs`/`…En`, `tags`, `_source`, `_uid`,
  `univers`, `secondaire`.
- **18 catégories**. **`_source`** : 991 jeux marqués `1040`, 448 marqués `449`.
- **0 titre en double** (comparaison normalisée, insensible à la casse).
- Certains champs ne sont pas présents sur les 1439 entrées (`_uid`, `univers`,
  `secondaire`, et les variantes `…En` des champs longs sont partielles).

**Apps et scripts qui le consomment** (9 points d'entrée) :
`cf-worker/jeux-data/src/worker.js`, `_scripts/zts-seed-sections.js`,
`_scripts/publie-banques-r2.sh`, `fiches/zts-fiches-firebase.js`, `fiches/index.html`,
`scripts/seed-univers.py`, `scripts/gen-jeux-fiches.js`, `apps/planificateur/dataStore.js`,
`apps/planificateur/data/_generate-mini-banques.js`.

**Copies / dérivés dans le dépôt** :

| Fichier | Taille | Contenu |
|---|---|---|
| `_data/jeux-merged.json` | 11,5 Mo | **source**, 1439 jeux, 58 champs |
| `apps/studio-jeu/data/jeux-index.json` | 893 Ko | **1439 jeux**, extrait allégé (mêmes `id`, champs réduits) — dérivé, pas une copie littérale |
| `jeux/` (1440 fichiers HTML) | — | fiches statiques pré-générées, 1 par jeu + `index.html` |
| `apps/planificateur/data/mini-banques.json` | — | mini-banques extraites, avec `_doublons-sdg.md` à côté |

⚠️ `DOUBLONS-EXTRACTION.md` et `apps/planificateur/data/_generate-mini-banques.js`
référencent le chemin **`apps/jeux/data/jeux-merged.json`**. Ce fichier **n'existe plus** :
`apps/jeux/data/` ne contient que `EXEMPLE_GOLD_STANDARD_v2.json`,
`SCHEMA_OFFICIEL_v2.md` et `validate_schema_v2.js`. La documentation pointe un chemin mort.

**SAÉ** : `_data/sae-all-light.json` + `_data/sae-detail/` (les ~1880 SAÉ annoncées ne sont
pas dans `jeux-merged.json`).

---

## 6. Signaux (faits bruts, sans avis)

### 6.1 — Apps qui semblent faire la même chose

| Groupe | Preuve textuelle |
|---|---|
| **intervention-groupe** + **omnigroupe** | `<title>` de `omnigroupe` = « **Intervention Groupe** — Le couteau suisse… » ; `<title>` de `intervention-groupe` = « Intervention Groupe — Zone Total Sport ». Les deux descriptions listent « minuteur, équipes, … dessin ». |
| **plan-b-meteo** + **plan-b-pluie** | Même fonction (activités de repli intérieur), publics déclarés différents (ÉPS vs SDG), 10 et 8 items en dur. |
| **olympiades** + **olympiades-scolaires** | Camp vs ÉPS ; l'une fait le pointage inter-équipes, l'autre les épreuves. Nom quasi identique. |
| **planificateur** + **planification** + **agenda** + **grille** + **moyens-action** | Cinq apps de planification ÉPS. `planification` se déclare « squelette de validation » ; `planificateur` porte son propre `CLAUDE.md` et un `MERGE-PLAN.md`. |
| **jeux** + **jeux-par-theme** + **jeux-rapides** + **jeux-calmes** + **activites-duree** | Une banque de 1439 jeux + quatre listes de 8 à 10 items en dur qui en sont des découpes thématiques. `DOUBLONS-EXTRACTION.md` documente déjà 12 doublons de titres entre les mini-banques et le catalogue. |
| **chansons-camp** + **comptines** + **musique** | Trois entrées « chanson/musique », publics Camp / ÉPS-SDG / transversal. |
| **evaluation** + **performances** | Carnet PFEQ vs captation vidéo classée PFEQ ; `performances` lie `evaluation`. |
| **tni** + **studio-jeu** + **scoreboard** | Trois surfaces d'affichage/dessin pour tableau numérique. |
| **sos-conflits** + **intervention-groupe** + **omnigroupe** + **code-oreille** | Quatre apps de gestion d'incident/conflit/imprévu. |
| **grands-jeux** + **rallyes** + **olympiades** + **veillee-feu-de-camp** | Quatre banques d'animation de camp, 4 à 8 items chacune. |
| **jeux** + **sae** + **educatifs** + **generateur** | Trois banques de contenu pédagogique + un générateur qui produit les trois. |
| **fiches/** + **apps/jeux** + **jeux/** | Trois lecteurs pour le même catalogue : SPA filtrable, lecteur de fiche dynamique, 1440 fiches statiques. |

### 6.2 — Apps sans aucun lien entrant

| App | Détail |
|---|---|
| `apps/nba-playoffs` | 0 lien, hors sitemap, contenu « Page retirée » |
| `apps/nhl-playoffs` | 0 lien, hors sitemap, contenu « Page retirée » |
| `apps/_archive/generateur-legacy-2026-05` | 0 lien |
| `apps/_archive/planificateur-eps-legacy` | 0 lien |
| `apps-nba/`, `apps-nhl/`, `apps-fifa/` | 0 lien chacun |
| `admin/fiches/`, `entrainement/`, `campagne/`, `docs/maquette-planif-v2.html`, `wix/` (16 fichiers) | 0 lien |

**Apps à un seul lien entrant** (23 des 23 apps du gabarit partagé, plus `agenda` et
`omnigroupe`) : chacune n'est atteignable que depuis **une** page — son hub d'univers.
Aucune n'est liée depuis `index.html`. **38 des 49 apps sont absentes de l'accueil.**

**Apps hors sitemap mais vivantes** : `apps/decodage`, `apps/studio-jeu`.

### 6.3 — Articles sans aucun lien vers une app

- `grands-jeux-exterieurs-camp-de-jour.html` — 0 lien `apps/…`, alors que 9 apps de camp
  traitent le sujet.
- `un-jeu-trois-versions.html` — 0 lien `apps/…`, et 0 `.article-body` (structure hors gabarit).

En excluant les liens de pied de page génériques vers `educatifs` et `sae` :
**12 articles sur 27** ne pointent vers aucune app.

### 6.4 — Fichiers dupliqués

**Par contenu identique (md5 vérifié sur tous les `.js`, `.css`, `.ttf`, `.woff*` du dépôt,
hors `.git`)** : **14 groupes**, **49 fichiers concernés**, **35 copies excédentaires**.

| Fichier | Copies | Emplacements |
|---|---|---|
| `zts-landing.css` (`1c461afd…`) | **8** | apps/agenda, educatifs, evaluation, jeux, musique, sae, suppleance, tni |
| `zts-landing.js` (`f43b97b7…`) | **8** | mêmes 8 apps |
| `zts-landing.css` (`e5242e55…`, **autre version**) | **4** | apps/scoreboard, apps/transitions, _archive/generateur-legacy, _archive/planificateur-eps-legacy |
| `zts-landing.js` (`0d589b74…`, **autre version**) | **4** | mêmes 4 |
| `i18n.js` (identiques) | **5** | apps/educatifs, evaluation, jeux, musique, sae |
| `LuckiestGuy-Regular.ttf` (`79188087…`) | **3** | fonts/, apps/cours-maternelle/, apps/omnigroupe/ |
| `ZoneTotalSport.ttf` (`d3b34bad…`) | **3** | fonts/, apps/moyens-action/, apps/jeux/ |
| `Bangers-Regular.ttf` (`d78984da…`) | **2** | fonts/, apps/jeux/ |
| `zts-ultra.css` (`2fd1d308…`) | **2** | racine, apps/generateur/ |
| `auth.js` | **2** | cf-worker/generateur/src/, cf-worker/jeux-data/src/ |
| `TheGirlNextDoor-Regular.ttf` | **2** | apps/cours-maternelle/, apps/omnigroupe/ |
| `SwankyandMooMoo-Regular.ttf` | **2** | apps/cours-maternelle/, apps/omnigroupe/ |
| `LoveYaLikeASister-Regular.ttf` | **2** | apps/cours-maternelle/, apps/omnigroupe/ |
| `GloriaHallelujah-Regular.ttf` | **2** | apps/cours-maternelle/, apps/omnigroupe/ |

⚠️ Il existe **deux versions divergentes** de `zts-landing.js` et `zts-landing.css`
(hash différent) déployées sur deux groupes d'apps distincts.

⚠️ Les quatre polices `TheGirlNextDoor`, `SwankyandMooMoo`, `LoveYaLikeASister` et
`GloriaHallelujah` sont hors de la liste des quatre polices retenues par `CLAUDE.md`
(Luckiest Guy, Bangers, ZoneTotalSport, Quicksand) ; `SwankyandMooMoo` y est explicitement
citée comme « sortie du site ». Elles sont présentes en double dans `cours-maternelle` et
`omnigroupe`, et **absentes de `fonts/`**.

**`firebase-auth.js`** : **une seule copie** (racine, 49 191 o). Pas de doublon — le
`TICKET-TTF-COPIE-UNIQUE.md` du dépôt traite le sujet voisin des polices.

**Noms de fichiers en double sans identité de contenu** : `app.js` × 16, `style.css` × 8,
`i18n.js` × 7, `translations.js` × 5, `styles.css` × 5, `auth.js` × 4, `worker.js` × 3,
`dataStore.js` × 3, `sw.js` × 2, `admin-gate.js` × 2. À vérifier au cas par cas.

**Partiels en double** : `header.html`/`footer.html` existent **à la racine** et dans
`shared/`. Le `footer.html` racine pèse 207 Ko.

**Visuels** : `fb-post-hd.jpg`, `fb-post-v2.jpg`, `fb-post-visual.jpg` font **exactement
960 627 o** chacun — trois noms, une taille identique.

### 6.5 — Référencé mais inexistant (liens morts internes)

Sur l'ensemble des 19 HTML racine + 27 articles + 49 `apps/*/index.html` + les partiels,
en écartant les gabarits (`${…}`, `{{…}}`) et les URL externes :

| Cible morte | Référencée depuis |
|---|---|
| `apps/jeux/favicon.png` | `apps/jeux/index.html` |
| `shared/img/perso` (dossier sans `index.html`, référencé comme lien) | `apps/grille/index.html` |

**Deux liens morts seulement.** Les 93 `<loc>` du sitemap pointent tous vers un fichier
existant (0 manquant).

**Chemin mort dans la documentation** : `apps/jeux/data/jeux-merged.json`, cité par
`DOUBLONS-EXTRACTION.md` et `apps/planificateur/data/_generate-mini-banques.js`.

**Nommage fragile (pas mort, mais à un caractère près)** : le dossier
`articles/images/Images article 50 jeunes gymnase ` porte un **espace final** dans son nom
et contient quatre fichiers à espaces et fautes de frappe (`imge 3Transitions…`,
`image 1 article blig 50…`). Les URL fonctionnent (encodées `%20`), y compris depuis
`catastrophes-ordinaires.html` qui emprunte une image à cet article.

### 6.6 — Autres faits bruts relevés au passage

- `apps/performances` charge **à la fois** `zts-gate.js` et `zts-lock-page.js` +
  `zts-locked-fullscreen.js`. Idem pour `apps/rencontres` (`zts-gate.js` + `zts-lock-page.js`).
  Deux systèmes de mur sur la même page.
- **Quatre apps ne chargent aucun CSS partagé ZTS** : `code-oreille` et `decodage` (aucun),
  `evaluation` (`zts-ultra.css` seul), `scoreboard` (`zts-header.css` + `zts-ultra.css`,
  sans `ztsh-shell.css`).
- **Cinq apps sans habillage `ztsh`** : `code-oreille`, `decodage`, `evaluation`,
  `planificateur`, `scoreboard`.
- **Tailwind CDN** est chargé par 10 apps ; les 23 apps du gabarit partagé n'en chargent aucune.
- `apps/decodage` (décodage émotionnel des symptômes selon Hamer, Sabbah, etc.) et
  `entrainement/` (PWA T25 personnelle) et `sports-news.html` sont **hors des trois publics
  déclarés** dans `CLAUDE.md`.
- `index.html` ne charge pas `analytics.js` : le GA4 `G-C2L5PD388L` n'est pas déclenché sur
  l'accueil telle que le fichier se lit aujourd'hui.
- `shared/nouveautes.json` documente lui-même, dans son `_lisezmoi`, que **les apps n'ont
  aucune date nulle part** dans le dépôt.
- `git` : la branche locale `main` est **4 commits derrière `origin/main`** (`d03d6fd9`
  vs `4f3e78a0`). L'inventaire a été fait sur `origin/main`.
- `.gitignore` de 1237 o ; hook `pre-commit` actif via `core.hooksPath = .githooks`.

---

## 7. Limites de l'inventaire

Ce qui **n'a pas** pu être vérifié, et pourquoi :

1. **Vues d'articles (`article_views`)** — collection Firestore. Aucun accès aux données
   depuis le dépôt, aucun export commité. **Non vérifié** pour les 27 articles.
2. **GA4 / trafic réel** — aucun accès à la propriété `G-C2L5PD388L`. Impossible de dire
   quelles apps sont réellement utilisées. Les colonnes « liens entrants » mesurent le
   **maillage du code**, pas la fréquentation. **Non vérifié.**
3. **Firestore en général** — nombre de comptes, de générations, de planifications
   enregistrées, contenu des collections. **Non vérifié.**
4. **Conformité visuelle des images à la charte marine** — jugée uniquement sur les **noms
   de fichiers** (recherche de « bucheron »). Aucune image n'a été ouverte ni comparée
   visuellement. Le statut « conforme / bûcheron / autre » de la §3 est donc **partiel** :
   seul `timeout-bucheron.png` est identifiable par son nom.
5. **Rendu en production** — aucune page n'a été chargée dans un navigateur. Une app peut
   être cassée à l'exécution sans que la lecture du code le montre. Interdiction volontaire :
   `CLAUDE.md` rappelle que toute ouverture de page prod-like **écrit dans Firestore**.
6. **Sous-domaines actifs** — l'état réel de `zone.`, `www.`, `img.`, `coordo.`,
   `planificateur.`, `nhl.`, `notify.` n'est pas vérifiable depuis le dépôt. Seuls les 12
   redirections de `redirections-cloudflare.csv` sont documentées. **Non vérifié.**
7. **Règles Cloudflare / Workers en production** — le dépôt contient `cf-worker/` mais l'état
   déployé (versions, routes actives) n'a pas été interrogé. `cf-worker/notif-stats/` est
   signalé non commité dans `CLAUDE.md`. **Non vérifié.**
8. **`_maquettes/`** — dossier cité dans le mandat, **inexistant** dans le dépôt. La maquette
   trouvée est `docs/maquette-planif-v2.html`.
9. **`AUDIT-SITE-2026-07.md`** — cité dans le mandat, **inexistant**. Documents d'audit
   effectivement présents : `AUDIT-CHANTIERS-2026-08.md`, `AUDIT-CARNET-EPS-2026-08.md`,
   `AUDIT-OUTILS-EPS-2026-07.md`, `AUDIT-FONDS-IMPORTANT-2026-07.md`. `PRESCAN-APPS-2026-07.md`
   et `zts-refonte-sequencage.md` existent bien.
10. **`FUSION-*-COMPLETE`** — seul `FUSION-1-COMPLETE.md` existe (Générateur IA, shippé le
    18 mai 2026). Les fusions #2 à #4 annoncées dans `zts-refonte-sequencage.md` n'ont pas
    de document de clôture.
11. **Contenu des 1440 fiches `jeux/*.html`** — non parcouru une par une (volume).
    Seul le fichier maître `_data/jeux-merged.json` a été analysé.
12. **Contenu des ~1880 SAÉ** — `_data/sae-all-light.json` + `_data/sae-detail/` non
    dénombrés en détail dans cette vague.
13. **Publics des apps** — déduits de deux sources factuelles : le commentaire
    `<!-- App — … (Public). Gabarit partagé. -->` en tête des 23 mini-apps, et l'appartenance
    aux hubs `ep.html` / `camps-de-jour.html` / `service-de-garde.html`. Six apps ne sont
    dans aucun hub (`code-oreille`, `decodage`, `moyens-action`, `omnigroupe`, `planification`,
    `studio-jeu`) : leur public est déduit de leur description, pas d'une déclaration.

---

## Décompte

| | |
|---|---|
| **Apps** | **49** dans `apps/` (23 sur le gabarit partagé + 26 hors gabarit) + **2** archivées + **10** outils/sections hors `apps/` |
| **Pages hors apps** | **19** HTML à la racine (dont 2 partiels et 3 « Page retirée ») + **9** pages en sous-dossiers (`fiches/` ×2, `admin/fiches/`, `entrainement/`, `aidons-nous/`, `apps-nba/`, `apps-nhl/`, `apps-fifa/`, `campagne/`) + **16** fichiers `wix/` hérités |
| **Articles** | **27**, tous au sitemap |
| **Paires / groupes de chevauchement apparent** | **12** groupes recensés au §6.1, couvrant **34 apps distinctes** |
| **Liens morts internes** | **2** (`apps/jeux/favicon.png`, `shared/img/perso`) + **1** chemin mort en documentation (`apps/jeux/data/jeux-merged.json`) |

**Autres compteurs** : 93 URL au sitemap · 1439 jeux · 1440 fiches statiques ·
18 catégories · 58 champs · 12 redirections 301 déclarées · 14 groupes de fichiers
strictement identiques (49 fichiers, 35 copies excédentaires) · 38 des 49 apps absentes
de l'accueil · 6 apps dans aucun hub d'univers.

---

*Vague 0 — inventaire seul. Aucune recommandation, aucune fusion, aucune correction.*
