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

## Reste à la charge de Joey

- **Un slot de prévisualisation.** `preview_start` refuse — 5 serveurs pour ce
  dossier, tous appartenant à d'autres sessions. Le tour visuel de la vague A
  (mur en anonyme, deux jeux d'onglets, tiroir à 375 px, sous-titre du micro,
  console vide) n'a donc **pas** été fait. La vague A est commitée et vérifiée
  statiquement, **pas vue tourner**.
- **`PROMPT-ZONE-RENCONTRES-V2.md`** — le collage est arrivé vide. Le fichier
  n'a pas été recréé. §10 (brief de l'article) et §11 (banc d'essai) manquent.
