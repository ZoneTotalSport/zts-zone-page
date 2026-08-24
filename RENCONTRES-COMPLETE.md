# ZONE RENCONTRES — journal de chantier

**Branche :** `app/rencontres` · **Worktree :** `~/dev/zts-rencontres`
**Base :** `2b4be0b9` · **Prescan et décisions :** `PRESCAN-RENCONTRES.md`

Ce document se remplit vague par vague. Il porte ce qui a été livré, ce qui a
été vérifié, et ce qui reste à la charge de Joey.

---

## Pourquoi un worktree séparé

Une session parallèle éditait `zts-lock-page.js` dans
`~/dev/Remotion 2/wix-deploy/` au moment du prescan. Elle a depuis fusionné
la PR #26 (`fix/fuites-mur-articles`, 3 commits) dans `main`. Dans un arbre de
travail partagé, les deux chantiers auraient produit un `git status` commun et
`git diff --stat` aurait cessé d'être une preuve de périmètre.

---

## Vague A — la coquille (24 août 2026)

**Commit :** `afa53391` · **Portée :** 3 fichiers neufs, `apps/rencontres/`,
aucune ligne hors du dossier.

- `index.html` — deux colonnes (rail dossiers/liste, fiche), en-tête à six
  champs, trois onglets de capture, deux onglets de sortie, barre d'outils.
- `styles.css` — tokens de l'app, tiroir sous 900 px, bloc d'impression.
- `app.js` — onglets, tiroir, menu ⋯, état réseau, détection vocale.

**Habillage.** `verifie-habillage.py apps/rencontres` → `OK`, 0 bloquant.
Ordre de chargement conforme, `ZTSShell.monter({densite:'travail'})`,
`<div class="ztsh-page">` en place, aucun fond posé sur `html`, `body` ou
l'enveloppe.

**Polices.** Zéro `@font-face`, zéro `<link>` Google, zéro `rem`, zéro
`!important` hors `@media print`. LuckiestGuy et ZoneTotalSportZTSH sont
réutilisées depuis les feuilles chargées plus haut.

**Décision 3 déjà à l'écran.** L'onglet micro porte un sous-titre —
« transcription en direct » ou « transcription à la fin » selon le navigateur.
Le mot « repli » ne paraît nulle part dans l'interface.

**Impression.** Contournement local en trois lignes (`html.ztsh-on`,
`body.ztsh-on`, `.ztsh-page` rendus à `display:block`), le shell reste intact.

> ⚠ `verifie-habillage.py` signale `DIFF : 286 lignes ajoutées, au-delà des 30
> du contrat` sur `apps/rencontres` — attendu et non bloquant : ce contrat vise
> les **migrations** d'apps existantes, une app neuve le déclenche par
> construction.

---

## Vague B — les notes, et la survie au plantage (24 août 2026)

**Commits :** `9d99c3fe` (règles) · `0fe8128b` (app)

### Règles Firestore — non déployées

Deux blocs ajoutés à `firestore.rules`, +53 lignes, aucune ligne existante
touchée :

- `rencontres/{id}` — owner-only via le champ `uid`, patron `performances` /
  `plans` / `inventaires`. Décision 1.
- `rencontresDossiers/{uid}` — **extension de la décision 1, signalée.** Il
  faut un endroit où vit un dossier **vide** : celui que l'usager vient de
  créer et qui ne contient encore aucune rencontre. Le déduire du champ
  `dossier` des rencontres ne le permet pas — il disparaîtrait au
  rechargement. Un seul document par usager, dont l'identifiant **est** son
  `uid`, donc une règle plus stricte que l'autre : elle s'appuie sur
  l'identifiant et non sur un champ.

> ⚠ **Le déploiement reste à faire, depuis ce worktree et jamais depuis
> `main`.** Il demande le compte de Joey :
> ```
> firebase deploy --only firestore:rules
> ```

### L'app

`dataStore.js` (428 l.) est le seul fichier qui parle à Firestore ; `app.js`
ne connaît que `RencData.*`.

- Dossiers, liste triée par date, filtre par dossier.
- Éditeur de notes : titres, listes, gras, cases à cocher. Collage assaini.
- **Autosauvegarde locale toutes les 10 s**, écriture Firestore au blur d'un
  champ et au bouton. Écrire chez Firestore toutes les 10 s ferait 360
  écritures facturées pour un comité d'une heure.
- **Restauration après plantage** : le brouillon local porte son horodatage et
  gagne sur la copie serveur quand il est plus récent. Il n'est effacé
  qu'après une écriture réussie.
- Le brouillon d'une rencontre neuve **déménage** au premier enregistrement,
  sinon il ressuscite au chargement suivant comme un doublon.

`verifie-habillage.py` : 0 bloquant.

---

## Reste à la charge de Joey

- **Un slot de prévisualisation.** `preview_start` refuse — 5 serveurs pour ce
  dossier, tous appartenant à d'autres sessions. Le tour visuel de la vague A
  (mur en anonyme, deux jeux d'onglets, tiroir à 375 px, sous-titre du micro,
  console vide) n'a donc **pas** été fait. La vague A est commitée et vérifiée
  statiquement, **pas vue tourner**.
- **`PROMPT-ZONE-RENCONTRES-V2.md`** — le collage est arrivé vide. Le fichier
  n'a pas été recréé. §10 (brief de l'article) et §11 (banc d'essai) manquent.
- **Déployer les règles Firestore** (voir vague B). Tant que ce n'est pas
  fait, l'app écrit dans le vide : chaque enregistrement renverra
  `permission-denied`, et les notes resteront dans le brouillon local.
- **Je ne crée pas de compte.** Le tunnel anonyme → inscription → retour app
  reste à ta charge, comme les 4 tests de `LOT1-COMPLETE.md`.
