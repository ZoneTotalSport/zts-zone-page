# Cap Prochain Voyage — plan S1→S6 et modèle de données

App compagnon de voyage skoolie, issue de « Cap Natashquan »
(`cap-natashquan.pages.dev`). Cloudflare Pages + Firestore/Firebase Auth,
même projet Firebase que le reste de l'écosystème (`zone-total-sport`).

> ⚠️ **Le code de l'app ne vit pas dans ce dépôt.** Il est sur le Mac, dans
> `~/PROJETS_CLAUDE/`, comme les autres apps satellites. Ce dépôt ne porte que
> ce qui lui appartient : les **règles Firestore** (source de vérité unique du
> projet Firebase) et les **index**. À pousser sur GitHub pour être travaillé
> par Claude Code sur le web.

## Ce qui est livré ici

- `firestore.rules` — bloc `voyages` + `expenses`.
- `firestore.indexes.json` — trois index (voir plus bas).

Déploiement des règles : **commit d'abord**, jamais de modification par la
console sans rapatriement immédiat.

## Modèle de données

```
voyages/{voyageId}
  { uid, titre,
    depart:      { nom, lat, lng },   // défaut : Saint-Jean-sur-Richelieu
    destination: { nom, lat, lng },
    dateDebut, dateFin,
    statut: 'actif' | 'termine',
    distanceKm, distanceSource: 'auto' | 'odo',
    odoDepart, odoArrivee,
    creeLe }

voyages/{voyageId}/expenses/{id}
  { uid, voyageId, montant (positif), categorie, description,
    date, kmAuMoment?, source: 'ia' | 'manuel', creeLe }
```

`uid` est **dénormalisé dans chaque dépense**, pour deux raisons :

1. La règle n'a aucun `get()` à payer sur le voyage parent.
2. L'écran comparatif lit toutes les dépenses d'un coup par requête
   `collectionGroup('expenses')` — or **une règle imbriquée sous
   `/voyages/{voyageId}` ne s'applique pas aux requêtes collectionGroup**.
   D'où le motif récursif `/{path=**}/expenses/{expenseId}` dans les règles.

Catégories (figées côté code, pas en base) :
`gaz ⛽` · `epicerie 🛒` · `restos 🍔` · `activites 🎡` · `dodo 🏕️` ·
`bus 🔧` · `autre 📦`.

## Index

| Collection | Portée | Champs | Sert à |
|---|---|---|---|
| `voyages` | collection | `uid` ↑, `dateDebut` ↓ | liste des voyages du compte |
| `expenses` | collection | `voyageId` ↑, `date` ↓ | dépenses d'un voyage |
| `expenses` | **collection group** | `uid` ↑, `date` ↓ | comparatif inter-voyages |

## Les six chantiers

**S1 — Rebrand + liste de voyages.** `manifest.webmanifest` (`name`,
`short_name`), `<title>`, en-tête, écran d'accueil, icônes portant du texte.
**Bumper le nom de cache dans `sw.js`** : sans ça les appareils déjà installés
gardent l'ancien shell et le rebrand ne sort jamais. Ne **pas** renommer le
projet Cloudflare Pages — ça changerait l'URL ; l'identifiant technique est un
chemin, pas un nom d'affichage (même règle que `budget/root-famille`).
Migration : au premier lancement, l'itinéraire hérité devient le voyage
« Cap Natashquan ». Fiches de lieux et spots dodo restent des données
statiques partagées — un voyage y réfère, il ne les possède pas.

**S2 — Dépenses.** Modèle ci-dessus. Règles et index livrés.

**S3 — Saisie rapide.** Deux étages, régex d'abord : un parseur local
(montant + table de mots-clés) traite « épicerie 85$ » et « diesel 120 » hors
ligne et à coût nul ; l'IA n'est appelée que sur les phrases ambiguës ou
riches (« musée Mingan 40$ pour la famille »). Route `/voyage/parse` **ajoutée
au worker `zts-budget`** (`budget-api.zonetotalsport.ca`) : vérification JWT
Firebase, clé Anthropic et liste blanche CORS déjà en place, rien à
provisionner. Haiku 4.5 (`claude-haiku-4-5-20251001`), prompt « JSON strict,
sans markdown » dans le style de `worker/src/prompts.js`, retour
`{montant, categorie, description, confiance}`. Validation côté client
(`montant` numérique > 0, `categorie` dans l'énum) ; sinon formulaire manuel
pré-rempli. Jamais d'échec silencieux. Hors ligne : file d'attente locale,
envoi à la reconnexion.

**S4 — Kilométrage.** Distance calculée au moment où départ/destination sont
fixés et **mise en cache sur le doc voyage** ; recalcul si la destination
change. Repli haversine × 1,25 si le routing ne répond pas. Dès que
`odoDepart` et `odoArrivee` sont saisis, ils priment
(`distanceKm = odoArrivee − odoDepart`, `distanceSource='odo'`). Affichage :
`$/km` total, `$/km` gaz seul, et `$/100 km` — l'unité dans laquelle un
skoolie se raisonne.

**S5 — Stats.** Reprise de `donutSVG()` de Zone Budget (SVG maison, aucune
lib) + barres par catégorie, mêmes couleurs, Bangers/Quicksand. Par voyage :
total, répartition, `$/km`, `$/jour` (bornes incluses). Comparatif : tableau
par `collectionGroup('expenses')`, une ligne par voyage.

**S6 — Synchro vers Zone Budget.** « Terminer le voyage » → `statut='termine'`
+ **une** transaction dans `budget/root-famille/transactions`, **id
déterministe `voyage-{voyageId}`** pour qu'une reclôture mette à jour au lieu
de dupliquer :
`{type:'depense', montant: total, commercant: titre, categorieId:'skoolie',
date: dateFin, note: dates, source:'voyage', voyageId}`. La catégorie
`skoolie` est créée dans `config/main` si absente. Côté Budget : badge 🚌,
lecture seule (le chemin d'édition du détail du jour refuse ces lignes).

⚠️ **Point de vigilance S6** : les règles `budget/root-famille` exigent que
l'uid qui écrit soit membre. Si l'app voyage tourne sous un compte non-membre,
l'écriture est refusée et la synchro doit passer par le worker (service
account) plutôt que par le client.
