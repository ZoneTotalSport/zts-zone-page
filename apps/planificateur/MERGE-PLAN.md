# Convergence Planif — Fusion #3 (plan de référence)

> Statut : **décisions verrouillées 2026-06-21**. Doc de référence, pas de code tant que chaque phase n'est pas lancée.
> Apps concernées : `apps/planificateur/` (moteur), `apps/agenda/`, `apps/planification/`.

## 1. Décisions verrouillées (Joey, 2026-06-21)

### Architecture : pas de merge littéral — un seul moteur qui absorbe
- **Planificateur = LE moteur unifié** (Firestore + auth + présences + dashboard + éditeur journée + bascule Jour/Semaine/Mois). On l'**enrichit**, on ne le fusionne pas.
- **Planification** → sa banque (ÉP 360 cours, Camp 7 sem × 3 groupes, SDG 200 jours) se **seed** dans le moteur via le sélecteur biblio. Standalone → **archivé après stabilisation**.
- **Agenda** → 2 niveaux :
  1. vue calendrier daté **ÉP dans le moteur** (gated/pro) ;
  2. version **allégée PUBLIQUE** (localStorage, sans login) = **aimant SEO**, qui partage `zts-core.css` + composants du moteur (jamais un 2e codebase).

### Conversion : SCÉNARIO B (verrouillé)
- Moteur gated cloud + Agenda public allégé.
- Principe : **un OUTIL est gratuit à l'usage (local)** ; on paie pour **persistance cloud + multi-appareil + banque riche**. Le **CONTENU** (90 cours, banque) reste **gaté fort**.
- Même logique que le Générateur IA (essais anonymes → gate).
- ⚠️ **NE PAS gater l'outil à l'entrée** → tuerait le SEO/funnel.

### Calendrier : un seul moteur de blocs/dates
- Le moteur de calendrier vit **uniquement dans le Planificateur**. Agenda et Planification **ne gardent pas le leur**. Redondance supprimée.

### Seed biblio = pattern réutilisable
- Camp seedé en été (Phase 3). ÉP + SDG en septembre via **le même code**, re-seed avec d'autres données. Construire le pattern **une fois**.

### Mesure
- `conversionFunnel` (Firestore, **pas GA4**). Ajouter `locked_view` / `locked_click_signup` / `signup_complete` sur l'Agenda public → preuve chiffrée que l'aimant convertit.

## 2. Défauts techniques retenus (sauf objection)
- **i18n** : FR/EN partout (triage i18n-apps complet en août). Agenda garde son FR/EN/ZH/ES.
- **Présences OFF pour ÉP** (ÉP = calendrier + cours ; pas de logique sécurité/départs).
- **Sans index composite Firestore** (filtres côté client — index non déployés, contournement déjà en place).
- **Migration localStorage → Firestore** : best-effort au 1er login (aucune perte si non migré).
- **Mode anonyme local du moteur** : **reporté en août** (Phase 3 reste sur le moteur gated actuel).

## 3. Schéma Firestore unifié (extension de l'existant)
| Collection | Rôle |
|---|---|
| `espaces/{id}` | `{nom, metier:ep\|camp\|sdg, ownerUid, dateDebut, dateFin, config}` (généralise *organisations*) |
| `groupes/{id}` | `{espaceId, metier, nom, niveau(ÉP)\|age(camp), theme}` |
| `enfants/{id}` | roster camp/SDG (présences) |
| `journees/{id}` | `{date, groupeId, metier, blocs[]}` |
| `presences/{id}` | pointage + sécurité (camp/SDG) |
| `gabarits/{id}` | `{groupeId, metier, portee:journee\|semaine\|cycle, blocs[]}` (renomme *grillesType*) |
| `evenements/{id}` | `{ownerUid, date, titre, type, couleur}` + notes (migré d'agenda) |
| `perso/{id}` | `{ownerUid, refBanque, metier, overrides, favori}` (migré de planification) |

Banques **hors Firestore** (JSON statique, lecture seule) : `data/ep-{maternelle,1er,2e,3e}.json`, `camp.json`, `sdg.json` + réfs `apps/jeux/data/jeux-merged.json` (1439) et `apps/sae/data/` (1880).

## 4. Architecture applicative cible (`apps/planificateur/`)
```
index.html      coquille + design system + i18n + gate
app.js          routeur d'état
modules/
  metier.js     sélecteur ÉP/Camp/SDG            (de planification)
  banque.js     loader banques + filtres + favoris + fiche   (de planification)  ← Phase 3
  calendrier.js vues Année(mois)/Semaine/Jour     (de agenda + planificateur)
  journee.js    blocs typés d'une journée         (de planificateur)
  execution.js  présences/départs/sécurité + dashboard  (de planificateur)
  evenements.js événements + notes                (de agenda)
  gabarit.js    journée/semaine/cycle-type        (de planificateur)
  data.js       CRUD Firestore + loader banques + offline
```

## 5. Séquence
- **ÉTÉ (chemin critique camp) — rien ne passe devant** : **Phase 3** = sélecteur biblio + **seed Camp**.
- **AOÛT** : coquille Agenda public + Design System (3 thèmes univers) + triage i18n-apps + **mode anonyme local** du moteur.
- **SEPTEMBRE** : fast-follow ÉP/SDG (re-seed via le même pattern + vue calendrier daté ÉP).

## 6. Phase 3 — détail (à coder en premier)
1. **`banque.js`** : normalise `data/camp.json` (7 sem × 3 groupes) + réfs jeux/SAÉ → **fiche commune filtrable par tags** (`MODELE-DONNEES.md`). = le pattern réutilisable (re-seed ÉP/SDG plus tard avec d'autres sources).
2. **Sélecteur biblio** branché sur le bloc `activité` (et la journée) : rechercher dans la banque Camp → insérer comme **`ref`** (champ déjà au schéma, lien sans copie) + titre/durée.
3. **Mesure** : poser `locked_view` / `locked_click_signup` / `signup_complete` aux points de gate.

## Slice « Rôles + Coordonnateur + Sauvegarde cloud » (décidé 2026-06-21)
Décisions : développé **dans le moteur** · coordo = **accès direct temps réel** (pas d'email) · **règles Firestore déployées quand prêt**.
Séquence atomique :
1. **Rôle animateur/coordonnateur** : choix à l'inscription (`organisations.coordoUid` pour coordo, `groupes.animateurUid` pour animateur) + badge + bascule. `state.role`.
2. **Tableau de bord coordonnateur** : liste des groupes de l'`orgId` (`Groupes.listByOrg`) → par groupe, accès **lecture seule** aux présences (arrivée/heure, départ/avec qui/heure, drapeau hors-liste) + planif.
3. **Arrivée — avec qui** (optionnel) : ajouter `arriveAvec` au flux d'arrivée si voulu (aujourd'hui l'arrivée = heure seule).
4. **Sauvegarde cloud de la vue Semaine** : porter `semaine.html` (périodes/heures + Groupe/Activité + médias) dans le moteur, persistée Firestore (au lieu de localStorage). PDF = impression navigateur.
5. **firestore.rules** : rôle coordo (read journees+presences de son orgId) / animateur (read/write ses groupes). Préparer, **déployer quand testé**.
6. **Médias** : prototype = data URL ; cible moteur = sélecteur biblio (réfs jeux/SAÉ) + Firebase Storage pour fichiers lourds.

## Réutilisation (rien réinventé)
- **planificateur** → Firestore/offline, présences/sécurité, éditeur blocs, gabarit, dashboard, fluo, save/reset.
- **agenda** → rendu mensuel/hebdo/séquentiel/notes, banque objectifs PFEQ, i18n 4 langues.
- **planification** → sélecteur métier, loaders banques + filtres, favoris, dupliquer, impression/PDF.
