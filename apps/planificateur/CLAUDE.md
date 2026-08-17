# Planificateur Camp de jour — MVP

## Stack
- HTML statique sur GitHub Pages (`/apps/planificateur/`)
- Firebase compat SDK 10.14.0 (Auth + Firestore) — projet `zone-total-sport`
- Design system partage : `../../shared/zts.css` + `../../shared/zts.js`
- Auth : `/firebase-auth.js` (racine, pas de copie locale)
- `app.js` = module ES unique (SPA vanilla, event delegation)

## Schema Firestore (fige MVP)

```
organisations/{orgId}   { nom, coordoUid, dateDebut, dateFin, semaines:[{num,theme}] }
groupes/{groupeId}      { nom, orgId, animateurUid, theme }
enfants/{enfantId}      { prenom, nom, photoUrl, groupeId, personnesAutorisees:[{nom,lien}] }
grillesType/{id}        { groupeId, blocs:[{id,type,titre,debut,fin,ordre,ref?,plage?,lieu?}] }
journees/{journeeId}    { date, groupeId, blocs:[{id,type,titre,debut,fin,ordre,ref?,plage?,lieu?}] }
presences/{id}          { journeeId, groupeId, enfantId, statut, heureArrivee, heureDepart, partiAvec:{nom,lien}, horsListe, date, ts }
```

> **DECISION — Bibliotheque unifiee = JSON statique (PAS Firestore).**
> Le catalogue des 1439 jeux reste un **JSON statique servi par CDN** :
> `apps/jeux/data/jeux-merged.json` (schema reel camelCase + bilingue `…En`, champ `univers[]` ajoute).
> La collection Firestore `jeux/{jeuId}` initialement prevue est **ABANDONNEE**.
> Firestore ne garde que les **donnees vivantes** : blocs de planif, registre presence/depart, evaluations PFEQ.

> **REVISION — 17 aout 2026 (LOT 1, vague D). La decision ci-dessus TIENT ;
> seul le chemin d'acces change.**
> Les banques restent des **fichiers statiques** — elles cessent seulement
> d'etre servies **en clair**. Mesure : 112 Mo de banques structurees
> repondaient a un simple `curl` anonyme, dont `jeux-merged.json` (12 Mo,
> 1439 jeux). Le lockage est le pilier n°1 depuis le 10 aout, d'ou la revision.
>
> Ce qui change concretement pour cette app :
> - Le fichier a quitte l'arbre publie : `apps/jeux/data/jeux-merged.json`
>   n'existe plus. La source de verite est `_data/jeux-merged.json` (hors
>   Jekyll, donc non servi), publiee vers **R2** par
>   `_scripts/publie-banques-r2.sh` a chaque fusion sur `main`.
> - Le planificateur ne fait plus `fetch` d'un chemin de donnees. Il passe par
>   **`zts-banques.js`** (racine), qui appelle le Worker
>   `https://zts-jeux-data.zts-ccd.workers.dev` en deux portees :
>   `/<banque>/public.json` (anonyme, champs de liste) et
>   `/<banque>/full.json` (jeton Firebase valide, banque entiere).
>   `ZTSBanques.jeux()` demande `full` et se replie sur `public` faute de
>   jeton — le planificateur etant gate depuis la vague A, c'est `full` qui
>   sert en pratique.
> - Ce module existe pour **le jeton expire** : l'app reste ouverte des heures,
>   `getIdToken(false)` peut rendre un jeton perime, et sans reprise l'app
>   afficherait une banque VIDE a un membre legitime. Une seule reprise, avec
>   `getIdToken(true)`. Ne pas court-circuiter `zts-banques.js` par un `fetch`
>   direct : c'est ce cas-la qu'on perdrait.
> - Le `ref = slug` reste la cle stable. Rien du schema ne bouge.

- `journees.blocs` et `grillesType.blocs` = tableaux embarques (atomique).
- `presences` = collection separee (securite, requetee par jour ET enfant).
- Relations par ID. Un bloc activite pointe vers la bibliotheque via `ref = slug` (string),
  jamais une copie. ⚠️ Le `slug` est une **CLE STABLE IMMUABLE** (= nom de fichier des pages
  SEO `/jeux/<slug>.html`) : ne jamais renommer un slug sans migration.

## Types de blocs
- `garde` : plage (matin|soir) — ouvre le registre presences
- `activite` : titre + notes (ref optionnel pour lien biblio futur)
- `sortie` : lieu
- `repas` / `recre` / `transition` : titre + heures

## Index composites
- `presences` : enfantId + groupeId + ts
- `presences` : journeeId + groupeId + ts

## Fonctionnalites implementees

### Tranche 1 — Roster + Registre presence/departs
- Setup org + groupe
- CRUD enfants avec photo (resize canvas → data URL Firestore)
- Presences : tap = present, long press = absent, tap present = modal depart
- Depart : personnes autorisees, hors-liste avec warning + checkbox
- Historique par enfant (chronologique)
- Offline indicator (Firestore persistence)

### Tranche 2 — Editeur journee + Grille-type
- Vue journee : timeline ordonnee de blocs types
- CRUD blocs : ajout/edition/suppression via modal typee
- Reordonnement blocs : boutons haut/bas
- 6 types : garde, activite, sortie, repas, recreation, transition
- Bloc garde → lien vers registre presences
- Grille-type (gabarit) : ensemble de blocs reutilisable par groupe
- Application gabarit : a une date unique (avec garde-fou ecrasement)
- Application en lot : plage de dates (lun-ven), conflit sauter/remplacer/fusionner
- Tout offline (writes en file, sync au retour)

## Conventions
- `data-metier="camp"` sur `<body>` (palette orange).
- **Thème par métier (2026-07-05)** : `--metier-1`/`--metier-2`/`--metier-ink` pilotées par
  `body[data-metier]` — camp #FF6B00/#B026FF/blanc, ep #00E5FF/#1E90FF/#111,
  sdg #39FF14/#169B62/#111. AUCUN accent en dur : tout passe par `var(--metier-*)`
  (alphas via `color-mix`). Validé en navigateur sur les 3 métiers (bouton AJOUTER,
  chips, onglet actif, case du jour, flash BD ; 0 pilule 999px calculée, 0 erreur console).
- **Boutons = `.zts-action`** (+ `.zts-action--metier` locale = fond `--metier-1`,
  encre `--metier-ink` ; `--neutre` pour les secondaires). `zts-btn` réservé au header
  partagé injecté — ne pas en créer dans l'app. Pilules 999px interdites.
- Offline-first : persistence Firestore activee (`synchronizeTabs: true`).
- Pas de Tailwind — classes `zts-*` du design system + `p-*` app-specific.
- Pas de bundler — vanilla JS, ES modules.
- Event delegation via `data-action` + `handleAction()` switch.
- Modals : enfant, depart, bloc, appliquer (4 modals HTML fixes).

## Hors MVP (repousse)
- Selecteur biblio / jeux dans bloc activite (tranche 3)
- Tableau blanc plein ecran (tranche 3)
- Rappels securite sortie
- Import calendrier externe (iCal, Google Calendar)
- Carnet de competences PFEQ
- Lien SAE
- Jours-cycle
- Notifications push
