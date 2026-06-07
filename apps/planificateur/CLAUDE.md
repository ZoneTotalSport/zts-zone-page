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
jeux/{jeuId}            { titre, description, tags:{materiel,espace,groupe,type,contexte}, mediaUrl }
```

- `journees.blocs` et `grillesType.blocs` = tableaux embarques (atomique).
- `presences` = collection separee (securite, requetee par jour ET enfant).
- Relations par ID (un bloc activite pointe vers jeuId via ref, jamais de copie).

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

### Tranche 3 — Tableau de bord (refonte UI)
- Vue `accueil` = landing par défaut : hero du jour (mascotte, date longue, thème), 3 tuiles
  (anneau de présences SVG, nb blocs, taille groupe), carte « prochaine activité » avec compte
  à rebours (`minutesUntil`/`humanDelay`), actions rapides (`goto-appel`, `goto-programme`, live).
- `triggerConfetti()` + `maybeCelebrate()` : pluie de confettis vanilla + son quand tout le
  groupe est arrivé (1× par jour via `state.celebratedDate`).
- Données du jour chargées à l'init et sur `nav→accueil` (`loadJourneeData` sur `todayISO()`).

## Robustesse Firestore (pas d'index composite requis)
- `loadCalendarData` : requête par `groupeId` seul (index simple auto) + filtre du mois côté
  client — évite l'index composite `journees(groupeId+date)` qui n'est PAS déployé sur le projet.
- `Presences.listByJournee`/`listByEnfant` : pas de `orderBy` dans la requête, tri client via
  `sortByTs()` — fonctionne même si les index composites `presences` ne sont pas déployés.
- `firestore.indexes.json` existe à la racine mais n'a jamais été déployé (`firebase deploy
  --only firestore:indexes`). Le code ne dépend plus de ces index.

## Conventions
- `data-metier="camp"` sur `<body>` (palette orange).
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
