# RAPPORT QA — pilier Jeux, vague 2 PR B

> `GRILLE-SORTIE-APP.md` remplie ligne par ligne. Chaque preuve est un fait observé —
> un compte, un code, une exécution. Jamais « vérifié » tout court.
>
> 2026-09-02 · branche `vague-2/jeux-ui`

---

## 1. Mobile — 🟡 partiel

| | |
|---|---|
| Débordement horizontal à 360 px | ✅ La rangée de collections passe en **une colonne** sous 600 px (`@media`), la grille de jeux avait déjà ses paliers. |
| Cibles tactiles ≥ 44 × 44 | ✅ `.card-partage` et `.zc-carte` portent `min-height:44px` / `min-width:44px` explicites. |
| Texte ≥ 14 px | 🟡 `.zc-intro-carte` est à **13,5 px** — sous le seuil de la grille. Assumé : c'est une ligne de contexte secondaire sous un titre à 19 px, pas du texte de lecture. À trancher au test. |
| Modales fermables au pouce | ✅ Inchangé, non touché par cette PR. |
| Portrait **et** paysage | ❌ **Non vérifié** — pas de téléphone ici. C'est la ligne 8, celle de Joey. |

## 2. Aucune perte de données — ✅

- `localStorage` : les clés `eps-favorites`, `eps-theme`, `eps-lang` sont lues et écrites
  comme avant. **Aucune migration**, aucun changement de forme.
- Le nouvel état (`activeUnivers`, `activeAge`, `activeCollection`, `collections`) vit **en
  mémoire seulement** — rien n'est persisté, donc rien ne peut être corrompu.
- ⚠️ **Les favoris ne fonctionnaient pas du tout avant cette PR** (voir §4). Les favoris
  déjà enregistrés dans `localStorage` sont intacts et redeviennent utilisables.

## 3. Mur correct — ✅

| | |
|---|---|
| Mur conforme au contrat | ✅ `apps/jeux` reste **libre** (whitelist), fiches murées par item. |
| Un seul mur | ✅ `zts-lock-page.js` seul, inchangé. |
| `locked-whitelist.json` | ✅ **Non modifié** — `git diff` vide. |
| Aucune ligne de mur touchée | ✅ `git diff main..HEAD -- apps/jeux/index.html` ne contient aucune ligne `zts-lock`, `freeItems` ou `whitelist`. |
| La fiche statique garde son verrou | ✅ Vérifié sur une ancienne (`1-2-3-soleil.html`) **et une nouvelle** (`statues-musicales.html`) : 1 × `zts-lock-page.js` chacune. |
| Testé sans session | 🟡 Le harnais tourne sans session, mais **en Node, pas en navigation privée**. Ligne à refaire au test de Joey. |

## 4. Erreurs gérées — ✅, et **deux bogues préexistants corrigés**

### 🐞 Les favoris et l'impression étaient cassés sur les 1540 jeux

```js
onclick="toggleFavorite(${game.id})"     →  toggleFavorite(pfeq_1)
```

Les ids sont des **chaînes** (`pfeq_1`, `TRAD_078`), interpolées **sans guillemets**.
Chaque clic sur une étoile ou sur « Imprimer » levait une `ReferenceError`. Trois appels,
trois lignes corrigées. Ce n'est pas une régression de cette PR : c'était là avant, sur un
pilier, et la grille interdit de livrer avec une console rouge.

### 🐞 Le filtre « Cycle scolaire » ne filtrait rien

Quatre boutons qui se cochaient, et dans le code : `// Keep all games`. **Un filtre qui
ment est pire qu'un filtre absent.** Remplacé par le filtre **Âge**, avec de vraies bornes.

### Le reste

- **Collections indisponibles** : `chargerCollections()` attrape l'échec, journalise un
  `console.warn` et rend une rangée vide. **Exécuté** : `[jeux] collections indisponibles :
  hors ligne` — la grille des 1540 jeux reste entièrement fonctionnelle.
- **Partage** : `navigator.share` → `clipboard` → `prompt`. Le troisième repli existe parce
  qu'en vue intégrée iOS le presse-papiers est refusé sans erreur utile, et **un bouton qui
  ne fait rien est pire qu'un bouton qui montre le lien**. `AbortError` (l'utilisateur
  annule le partage) est distingué d'un vrai échec.
- **Aucun 404** : les 1540 jeux ont leur fiche statique. Les 101 nouveaux en manquaient —
  `scripts/gen-jeux-fiches.js` relancé, **101 fichiers créés, les 1439 autres inchangés
  au bit près**.

## 5. Chargement — ✅

- `assets/collections-jeux.json` pèse **7,8 Ko**, chargé **après** le rendu de la grille.
- Aucune image ajoutée, aucune police ajoutée.
- ⚠️ **Dette préexistante, non corrigée ici** : `apps/jeux/index.html` charge
  `https://unpkg.com/lucide@latest` — CDN **non épinglé**, ce que la grille §5 refuse.
  Hors périmètre de cette PR ; à inscrire.

## 6. Charte marine / ztsh — ✅

- Ordre CSS respecté, non modifié.
- Polices : **Luckiest Guy** (titres de collection), **Bangers** (compteurs, toast, boutons),
  **Quicksand** (intros). Rien d'autre.
- Bordures 3 px noires, ombres BD décalées, `translate` au survol. **Aucune pilule 999 px**
  sur une action.
- `verifie-habillage.py` : **0 bloquant**. `verifie-glyphes-ztsh.py` : OK.

## 7. Dépendances vérifiées **par exécution** — ✅

Le vrai `apps/jeux/app.js` a été chargé dans un faux DOM et `applyFilters()` appelée sur
les **1540 jeux réels**. Ce n'est pas une copie de la logique : c'est le fichier livré.

| Filtre | Résultat |
|---|---|
| Âge 5 / 7 / 9 / 11 | 951 / 1062 / 1244 / 1338 — **les 767 jeux sans âge passent les quatre**, règle tenue |
| Univers eps / sdg / camps | 1261 / 155 / 960 |
| Durée ≤15 / 15-20 / 20-30 / 30+ | 316 / 1249 / 125 / 93 |
| Matériel, 10 catégories | de 123 (Parachute) à 529 (Ballons) — **aucun chip vide** |
| Collections, 14 | de 4 (Rallyes) à 448 (Plan B météo) — **tous concordent avec `assets/collections-jeux.json`** |
| Croisement réel : SDG + 7 ans + Sans matériel | **68 jeux** |
| Croisement : collection jeux-calmes + SDG | **46 jeux** |

**Un écart apparent, expliqué et vérifié.** La somme des quatre paliers de durée fait 1783
pour 1540 jeux distincts. Ce n'est pas un chevauchement de bornes : **81 jeux n'ont pas de
durée** et passent donc les quatre paliers — 3 × 81 = 243, exactement l'écart. Même chose
côté matériel : « Ballons » rend 529 au lieu des 418 du rapport, parce que **111 jeux n'ont
pas de `materielCat`** et passent aussi. C'est la règle « absent laisse passer », appliquée
partout, pas seulement à l'âge.

Autres vérifications par exécution :

- Les **10 chips de matériel** correspondent exactement aux 10 valeurs de `materielCat`
  présentes au catalogue — aucune orpheline d'un côté ni de l'autre.
- Le slug de la SPA rend la bonne fiche : **1439/1439** vérifiés avant régénération,
  1540/1540 après.
- `_scripts/verifie-assets-jekyll.py` : **1651 pages**, aucun asset sous un `_*`.

## 8. Test de Joey sur téléphone — ❌ **à faire**

Trois gestes, dans cet ordre :

1. **Nominal** — ouvre `/apps/jeux/`, touche la carte **Jeux calmes** (164 jeux), puis le
   chip **Service de garde**. Tu dois tomber à **46 jeux**.
2. **Cas limite** — touche **Plan B météo** (448 jeux). Le panneau de filtres doit
   **s'ouvrir tout seul** avec le bandeau jaune, parce que 448 dépasse le seuil de 200.
3. **Ce que la PR a touché** — ouvre un jeu, touche **🔗 Partager** : la feuille de partage
   iOS doit s'ouvrir. Puis **📄 Voir la fiche complète** : tu dois arriver sur
   `/jeux/<slug>.html`. Et touche une **étoile** — elle marche pour la première fois.

---

## Ce qui bloque, ce qui ne bloque pas

**Rien ne bloque.** Aucun échec sur les sections 2 (données), 3 (mur) ou 4 (console).

**Trois dettes**, à inscrire au `TABLEAU-DE-BORD.md` :

| Dette | Gravité |
|---|---|
| `unpkg.com/lucide@latest` non épinglé dans `apps/jeux` | moyenne — préexistante |
| `.zc-intro-carte` à 13,5 px, sous le seuil de 14 px de la grille | faible |
| Portrait/paysage et navigation privée non vérifiés — pas de téléphone ici | à lever par le test de Joey |

## Écritures de production

**Aucune.** Toute la QA a tourné en Node, sur le fichier de données du dépôt. Aucune page
prod-like n'a été chargée, donc **aucun document écrit dans le tunnel Firestore** pour
cette PR.
