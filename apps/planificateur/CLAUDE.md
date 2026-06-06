# Planificateur Camp de jour — MVP

## Stack
- HTML statique sur GitHub Pages (`/apps/planificateur/`)
- Firebase compat SDK 10.14.0 (Auth + Firestore) — projet `zone-total-sport`
- Design system partagé : `../../shared/zts.css` + `../../shared/zts.js`
- Auth : `/firebase-auth.js` (racine, pas de copie locale)
- `app.js` = module ES unique (helpers CRUD + smoke test)

## Schema Firestore (figé MVP)

```
organisations/{orgId}   { nom, coordoUid, dateDebut, dateFin, semaines:[{num,theme}] }
groupes/{groupeId}      { nom, orgId, animateurUid, theme }
enfants/{enfantId}      { prenom, nom, photoUrl, groupeId, personnesAutorisees:[{nom,lien}] }
grillesType/{id}        { groupeId, blocs:[{id,type,titre,debut,fin,ordre,ref?,plage?,lieu?}] }
journees/{journeeId}    { date, groupeId, blocs:[{id,type,titre,debut,fin,ordre,ref?,plage?,lieu?}] }
presences/{id}          { journeeId, groupeId, enfantId, statut, heureArrivee, heureDepart, partiAvec:{nom,lien}, ts }
jeux/{jeuId}            { titre, description, tags:{materiel,espace,groupe,type,contexte}, mediaUrl }
```

- `journees.blocs` et `grillesType.blocs` = tableaux embarqués (atomique).
- `presences` = collection séparée (sécurité, requêtée par jour ET enfant).
- Relations par ID (un bloc activité pointe vers jeuId, jamais de copie).

## Index composites
- `presences` : enfantId + ts
- `presences` : journeeId + ts

## Conventions
- `data-metier="camp"` sur `<body>` (palette orange).
- Offline-first : persistence Firestore activée (`synchronizeTabs: true`).
- Pas de Tailwind — classes `zts-*` du design system uniquement.
- Pas de bundler — vanilla JS, ES modules.

## Scope MVP
- Scaffold + CRUD helpers + règles Firestore + index + offline + smoke test.
- Étape 2 : écrans UI (calendrier, grille, présences, départs).

## Hors MVP (repoussé)
- Import calendrier externe (iCal, Google Calendar)
- Carnet de compétences PFEQ
- Lien SAÉ
- Jours-cycle
- Notifications push
