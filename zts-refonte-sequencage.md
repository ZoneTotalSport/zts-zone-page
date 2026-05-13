# Zone Total Sport — Plan de refonte (5 fusions)

**Auteur du plan** : Joey Racine + Claude (stratège)
**Exécutant** : Claude Code en terminal
**Date** : 13 mai 2026
**Objectif global** : passer de 27 entités floues à 9 piliers clairs.

---

## Principes de design (à respecter dans CHAQUE fusion)

1. **Une seule action principale par écran** — pas de pop-ups concurrents.
2. **Vocabulaire unifié** — plus jamais le mot « boîte à outils » dans 4 endroits différents.
3. **3 univers visibles partout** : ÉPS / Camps / SDG. Chaque outil est étiqueté avec un ou plusieurs univers.
4. **Style visuel Pop Art / Bûcheron** — Patrick Hand, Schoolbell, Ben-Day dots, bleu-violet, offset shadows, dashed borders. Aucune dérive.
5. **PWA-ready** — chaque app doit fonctionner hors ligne quand pertinent.
6. **Aucune destruction** — toute ancienne URL doit rediriger (301) vers la nouvelle pour ne pas perdre le SEO.

---

## FUSION #5 — Le grand ménage (½ journée)

### Décisions prises

| Avant | Après |
|---|---|
| Carte « Ma Suppléance » dans modal Ressources | Devient une **section /bibliotheque/suppleance** dans Bibliothèque (Fusion #2). En attendant : déplacée dans le footer. |
| Carte « Répertoire mondial » dans modal Ressources | Déplacée dans le **footer** sous « Ressources externes ». |
| Carte « Terrain sportif » | Déplacée dans le **footer** temporairement. Sera intégrée à Zone Gym lors de Fusion #4. |

### Actions concrètes

- Retirer 3 cartes du modal « Ressources » (Suppléance, Répertoire, Terrain).
- Ajouter une section footer « Ressources externes & spécialisées » avec liens vers les 3 pages existantes (ne PAS supprimer les pages, juste déplacer les liens).
- Le modal Ressources passe de 15 cartes à 12 cartes.
- Vérifier que les pages individuelles /suppleance, /repertoire, /terrain répondent toujours.

---

## FUSION #1 — Générateur IA unifié (1-2 jours)

### Décision tranchée

**Un seul Générateur IA** à `/generateur` avec un sélecteur en haut :
- Type de contenu : Jeu / SAÉ / Éducatif
- Univers : ÉPS / Camps / SDG
- Champ texte « contexte »
- Bouton GO

### Mapping des contenus générés selon le type

| Type | Champs générés |
|---|---|
| **Jeu** | titre, durée, matériel, but, règles, variantes, sécurité |
| **SAÉ** | titre, niveau, compétence PFEQ, déroulement, évaluation |
| **Éducatif** | titre, habileté ciblée, progression, critères de réussite |

### Mapping des prompts IA selon l'univers

| Univers | Adapter le prompt système avec... |
|---|---|
| ÉPS | « contexte gymnase scolaire, classes de 25-30 élèves, alignement PFEQ » |
| Camps | « contexte plein air ou gymnase, groupes de 30-100 jeunes, focus animation et plaisir » |
| SDG | « contexte petit local ou cour, groupes mixtes 5-12 ans, durée courte (15-30 min) » |

### Actions concrètes

- Créer /generateur/index.html (unifié).
- Migrer la logique des 2 générateurs existants vers une fonction unique genererContenu(type, univers, contexte).
- Setup redirections 301 : anciennes URLs vers /generateur?type=jeu et /generateur?type=sae.
- Mettre à jour le modal Ressources : 2 cartes générateur fusionnées en 1.
- Tracker dans Firestore : type_genere et univers_genere.

---

## FUSION #2 — Bibliothèque unifiée (1-2 semaines)

### Décision tranchée

**Une seule Bibliothèque** à `/bibliotheque` avec filtres :
- Type : Jeux / Éducatifs / SAÉ
- Univers : ÉPS / Camps / SDG
- Recherche fulltext

### Schéma JSON standard d'une fiche


```json
{
  "id": "ballon-chasseur-cosmique",
  "type": "jeu",
  "univers": ["eps", "camps"],
  "titre": "Ballon-Chasseur Cosmique",
  "slug": "ballon-chasseur-cosmique",
  "niveaux": ["primaire-2e-cycle", "primaire-3e-cycle"],
  "duree_min": 20,
  "duree_max": 40,
  "nb_joueurs": "20-30",
  "espace": "gymnase",
  "materiel": ["ballons mousse x6", "cônes x10", "dossards x10"],
  "but": "Éliminer l'équipe adverse...",
  "regles": "...",
  "variantes": ["mode zombie", "mode protection"],
  "securite": "Ballons mousse uniquement, zones tampons.",
  "image_principale": "/img/jeux/xxx.png",
  "video_short_url": "https://youtube.com/shorts/xxx",
  "video_longue_url": "https://youtube.com/watch?v=xxx",
  "pdf_url": "/pdf/jeux/xxx.pdf",
  "competence_pfeq": "C1",
  "date_publication": "2026-05-15",
  "tags": ["coopération", "vitesse", "stratégie"]
}
```



### Composant React unique `<FicheContenu>`

Un seul composant qui reçoit l'objet JSON et adapte le rendu selon le type (jeu/SAÉ/éducatif). Capture email si user pas inscrit pour télécharger le PDF.

### Actions concrètes

- Créer le schéma JSON pour les fiches (Firestore collection).
- Migrer les +500 jeux existants vers le nouveau schéma.
- Créer composant React <FicheContenu>.
- Créer page /bibliotheque avec filtres + recherche fulltext.
- Créer route dynamique /bibliotheque/[slug].
- Retirer 3 cartes du modal (Banque Jeux, Éducatifs, SAÉ) → 1 carte « Bibliothèque ».
- Redirections 301.

---

## FUSION #3 — Planificateur unifié (1 semaine)

### Décision tranchée

**Un seul Planificateur** à `/planificateur` avec 2 modes :

| Mode | Usage | Anciennement |
|---|---|---|
| **Mode Année** | Calendrier scolaire complet, 3-7 périodes | Planificateur ÉPS |
| **Mode Cycle** | Horaire cycle 5-10 jours, multi-spécialistes | Grille Horaire |

L'**Agenda** disparaît comme entité séparée → onglet « Mes événements » dans le Planificateur.

### Actions concrètes

- Refondre l'UI avec toggle « Mode Année / Mode Cycle ».
- Fusionner les bases de données (merger collections Firestore).
- Migrer les utilisateurs existants.
- Retirer 2 cartes du modal → 1 carte « Planificateur ».
- Redirections 301.

---

## FUSION #4 — Zone Gym (2-3 semaines, le gros chantier)

### Décision tranchée

**Une seule PWA** à `/zonegym` qui contient TOUT le temps-réel.

### Ce qui est absorbé

- Intervention Groupe (60 jeux + SOS + planificateur de séance)
- Boîte à Outils Transitions (signaux, chrono, zones, capitaines, trame, plan)
- App Gym (transitions, signaux visuels, minuteurs, routines)
- Musique (devient un onglet)
- Terrain sportif (devient onglet « Dessin terrain »)
- Mini-outils flottants (Dé, Roue, Chrono, Timer, Équipes, Message)

### Ce qui reste séparé (justifié)

- **Scoreboard** (cas d'usage différent : compétition formelle)
- **TNI** (usage classe complète, pas juste gym)
- **Carnet de notes** (évaluation, donnée sensible)

### Actions concrètes

- Audit fonctionnel des 3 apps existantes (lister TOUTES les fonctions).
- Architecture PWA unifiée (React + IndexedDB pour hors-ligne).
- Migration progressive : garder les anciennes apps live pendant la construction.
- Tests utilisateurs avec 5 profs avant lancement public.
- Bascule + redirections 301 + annonce.

---

## Tableau de séquençage final

| Semaine | Fusion | Effort | Livrable |
|---|---|---|---|
| 1 (½ jour) | **#5** Grand ménage | 🟢 ½ jour | Modal allégé à 12 cartes |
| 1-2 | **#1** Générateur IA | 🟡 1-2 jours | /generateur unifié |
| 3-4 | **#2** Bibliothèque | 🔴 1-2 sem | /bibliotheque + <FicheContenu> |
| 5 | Pause production vidéo | — | 5-10 vidéos Clique-Explique-Joue |
| 6-7 | **#3** Planificateur | 🟡 1 sem | /planificateur unifié |
| 8-10 | **#4** Zone Gym | 🔴 2-3 sem | /zonegym PWA |

---

## Architecture finale du site (vision cible)


```
zonetotalsport.ca/
│
├── /                      → Hero 3 univers + jeu vedette + scores widget
│
├── /eps/                  → Univers ÉPS (vue filtrée)
├── /camps/                → Univers Camps (vue filtrée)
├── /sdg/                  → Univers Service de Garde (vue filtrée)
│
├── /generateur            → Générateur IA (jeux/SAÉ/éducatifs)
├── /bibliotheque          → Bibliothèque (jeux/SAÉ/éducatifs filtrables)
│   └── /bibliotheque/[slug]   (fiche individuelle)
├── /planificateur         → Planificateur (modes Année + Cycle)
├── /zonegym               → Zone Gym PWA (temps-réel)
├── /scoreboard            → Tableau Indicateur (reste séparé)
├── /tni                   → Tableau Blanc Numérique (reste séparé)
├── /carnet                → Carnet de notes (reste séparé)
├── /maternelle            → Aimant email 90 cours (reste séparé)
│
├── /blog                  → Articles
├── /communaute            → Aidons-nous (forum)
└── /a-propos              → Joey + Mr. Root
```


---

## Règles de non-régression

- Aucune URL existante ne retourne 404 (toutes redirigées 301).
- Le site charge en moins de 2 secondes (mobile 4G).
- Le PWA fonctionne hors-ligne pour les outils marqués comme tels.
- Aucune régression de SEO sur les pages indexées.
- Style Pop Art bûcheron cohérent partout.
- Les 3 univers (ÉPS/Camps/SDG) sont visibles depuis l'accueil.

---

## Apps satellites — état actuel des dossiers locaux

Les apps individuelles vivent dans ~/PROJETS_CLAUDE/. À terme, plusieurs seront fusionnées :

- app-generateur-sae + sae-generator → fusionnés dans /generateur (Fusion #1)
- app-jeux + app-educatifs + app-sae → fusionnés dans /bibliotheque (Fusion #2)
- app-agenda + app-grille-horaire → fusionnés dans /planificateur (Fusion #3)
- gym-transitions + app-musique → fusionnés dans /zonegym (Fusion #4)

Restent indépendants : app-tni, app-evaluation, app-suppleance (cette dernière devient une section dans /bibliotheque).
