# GRILLE-SORTIE-APP — la checklist qui clôt un pilier

> **Un pilier de la vague 2 n'est pas fini quand le code marche. Il est fini quand cette
> grille est verte, ligne par ligne, et que Joey a testé sur son téléphone.**
>
> Identique pour les 18 piliers. On ne l'adapte pas au pilier : si une ligne ne
> s'applique pas, on écrit *pourquoi* dans le rapport, on ne la retire pas.

Chaque livraison de pilier porte cette grille remplie, avec pour chaque ligne :
**OK / ÉCHEC / SANS OBJET + une phrase de preuve**. Une preuve est un fait observé —
un compte, un code HTTP, une capture — jamais « vérifié » tout court.

---

## 1. Mobile

Le téléphone est le terrain réel : gymnase, cour d'école, camp. Une app qui ne tient pas
dans une main ne sert pas.

- [ ] Aucun débordement horizontal à 360 px de large.
- [ ] Toute cible tactile fait au moins 44 × 44 px.
- [ ] Le texte reste lisible sans zoom ; rien sous 14 px.
- [ ] Les modales se ferment au pouce, sans viser une croix de 12 px.
- [ ] Testé en orientation portrait **et** paysage.

## 2. Aucune perte de données

La règle qui ne se négocie pas. Un utilisateur qui perd une planification ne revient pas.

- [ ] Ce que l'app écrivait avant, elle l'écrit encore — même clés, même forme.
- [ ] Les données déjà en place (localStorage, Firestore) sont lues sans migration
      destructrice ; en cas de changement de schéma, l'ancien format est encore accepté.
- [ ] Rien n'est supprimé sans confirmation explicite de l'utilisateur.
- [ ] **Vérifié en exécutant**, avec des données existantes, pas en relisant le code.

## 3. Mur correct

- [ ] Le mur appliqué est celui inscrit au `CATALOGUE-CIBLE.md` pour ce pilier —
      `libre`, `gate`, `lock` ou `cadenas`. Un seul, jamais deux.
- [ ] Une app `libre` reste ouverte à un visiteur anonyme ; ses items murés le restent.
- [ ] `locked-whitelist.json` est la source unique : aucun slug codé en dur ailleurs.
- [ ] Le tunnel émet ce qu'il doit émettre, ni plus ni moins.
- [ ] **Testé en navigation privée**, sans session — c'est le seul état qui dit la vérité.

## 4. Erreurs gérées

- [ ] Réseau coupé : l'app le dit, elle ne tourne pas dans le vide.
- [ ] Donnée absente ou champ vide : un état vide écrit en français, pas `undefined`.
- [ ] Une dépendance externe qui tombe (worker, CDN, police) dégrade sans page blanche.
- [ ] **Console propre** : zéro erreur rouge au chargement et au premier parcours.
- [ ] Aucun `404` dans l'onglet Réseau — y compris les assets discrets : favicon,
      police, image de mascotte.

## 5. Chargement

- [ ] Premier rendu utile en moins de 3 s sur une connexion mobile ordinaire.
- [ ] Aucune image au-delà de ses dimensions d'affichage réelles.
- [ ] Le contenu principal ne dépend pas d'un script tiers pour apparaître.
- [ ] Aucun CDN non épinglé : `@latest` est refusé, on épingle une version.

## 6. Charte marine / ztsh

- [ ] `shared/zts.css` **puis** `assets/ztsh-shell.css` — l'ordre inverse casse en silence.
- [ ] Polices : Luckiest Guy (titres), Bangers (étiquettes, boutons), ZoneTotalSport
      (signature), Quicksand (lecture). Rien d'autre.
- [ ] Boutons d'action en `.zts-action` ; les pilules `border-radius:999px` sont
      dépréciées, `.zts-btn` est gelé.
- [ ] Mascotte : le prof d'ÉPS en bleu. Plus aucun bûcheron.
- [ ] `verifie-habillage.py` et `verifie-glyphes-ztsh.py` au vert.

## 7. Dépendances vérifiées **par exécution**

> Un `grep` prouve qu'une chaîne existe dans un fichier. Il ne prouve pas qu'un chemin
> résout, qu'un script se charge, ni qu'une fonction s'exécute. Trois fois pendant la
> vague 1, un `grep` a fait conclure à un bogue qui n'existait pas — et une fois, à
> l'absence d'un bogue bien réel.

- [ ] Chaque lien interne modifié est **ouvert** ; on relève le code HTTP.
- [ ] Chaque asset déplacé est **appelé** ; on relève le code HTTP.
- [ ] Chaque relais créé est **suivi** jusqu'à sa destination.
- [ ] Aucun asset servi ne vit sous un dossier `_*` — `verifie-assets-jekyll.py` au vert.
- [ ] Les scripts qui lisent un fichier de données sont **lancés** au moins une fois.

## 8. Test de Joey sur téléphone

**La dernière ligne, et c'est lui qui la coche.** Aucun pilier n'est clos sans elle.

La livraison fournit **trois gestes précis à faire**, pas « teste l'app » :
un parcours nominal, un cas limite, et le geste que la modification a touché.

---

## Ce qui bloque une sortie

Un **ÉCHEC** sur les sections 2 (perte de données), 3 (mur) ou 4 (console propre) bloque.
Le reste se négocie contre une dette écrite, datée et inscrite au `CATALOGUE-CIBLE.md` —
jamais contre un « on verra ».

## Écritures de production pendant les tests

`firebaseConfig` pointe la **production**, même servi depuis `localhost`, et
`zts-funnel.js` écrit **au chargement**. Toute ouverture de page prod-like laisse une
trace dans le tunnel.

- [ ] Les écritures ont été **stubées** avant le premier chargement (recette dans
      `CLAUDE.md`), ou
- [ ] leur nombre exact est **déclaré** dans le rapport, daté, pour être soustrait des
      lectures.

Ce n'est pas une formalité : sept documents parasites le 28 août, deux de plus les 1er et
2 septembre. Sur un tunnel à faible trafic, ils deviennent indiscernables du vrai signal.
