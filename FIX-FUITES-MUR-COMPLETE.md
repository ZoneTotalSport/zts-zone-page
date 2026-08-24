# FIX — Fuites du mur d'inscription sur les articles

**24 août 2026** · branche `fix/fuites-mur-articles`, basée sur `main` à jour
(`2b4be0b9`, après fusion de la PR #25) · **1 commit, non poussée**
Un seul fichier touché : **`zts-lock-page.js`**, +90 / −25.

---

## Le tableau avant/après

Mesure en anonyme, `main` servi en parallèle depuis un worktree sur un second
port. On compte les mots des `p`, `h2`, `h3`, `li`, `blockquote` sous `article`,
hors `nav`, pied de page et blocs de CTA, et on compare le total au sous-total
non masqué par `.zts-half-hidden`.

| Cas | Article | Avant | Après | Attendu | |
|---|---|:--:|:--:|:--:|:--:|
| **a** | `classes-difficiles-partie-1` — témoin | 3 416 / 10 711 · **32 %** | 3 416 / 10 711 · **32 %** | identique | ✅ |
| **a′** | `grands-jeux-exterieurs-camp-de-jour` — 2ᵉ témoin | 874 / 1 868 · **47 %** | 874 / 1 868 · **47 %** | identique | ✅ |
| **b** | `faire-bouger-enfants` — liste blanche | 4 815 / 9 010 · **53 %** | 9 010 / 9 010 · **100 %** | 100 % | ✅ |
| **b′** | `comportements-perturbateurs` — liste blanche | murée | **100 %** | 100 % | ✅ |
| **b″** | `catastrophes-ordinaires` — liste blanche | murée | **100 %** | 100 % | ✅ |
| **c** | `un-jeu-trois-versions` | 6 607 / 6 607 · **100 %** | 2 195 / 6 607 · **33 %** | muré | ✅ |
| **d** | section `data-zts-toujours-visible` | *n'existe pas dans `main`* | **reste visible hors-mur** | non-régression | ⚠ voir §3 |
| — | `50-jeunes-un-gymnase` | 6 311 / 6 796 · **93 %** | 6 173 / 6 793 · **91 %** | ~50 % | ❌ **§4** |

Les deux témoins sont identiques **au mot près**. Un seul `.zts-half-cta` par page
dans tous les cas.

---

## 1. Les trois changements

**`contentContainer()` → `contentContainers()`.** Ne retenait qu'un
`.article-body`, le plus rempli, et laissait les autres entièrement visibles.
Retourne maintenant la liste ; `applyHalf()` coupe sur l'ensemble concaténé, dans
l'ordre du document. Un article qui gagnera demain un squelette de plus sera
couvert sans qu'on y touche.

Elle rend `null` et non `[]` quand elle ne trouve rien : `demiApercu()` teste la
valeur, et un tableau vide est vrai en JavaScript — il passerait le garde et
couperait dans le vide.

**Repli `.zts-inc`.** Pour les articles sans aucun `.article-body`.

> Poser la classe `.article-body` sur ces conteneurs aurait été plus court et
> **faux** : cette classe porte le style. Mesuré sur `un-jeu-trois-versions` —
> les citations passeraient de 17 à 31,2 px et les `h3` changeraient de police.
> C'est au verrou de connaître les deux structures, pas aux articles de se
> déguiser pour lui plaire.

**`init()` consulte `loadWhitelist()`.** Le `return` tombait avant tout appel à la
liste. Même ordre que la branche `jeu` juste dessous, et pour la même raison : on
**coupe d'abord, on vérifie ensuite** — attendre le réseau montrerait l'article
entier à un anonyme pendant tout l'aller-retour. Couper puis révéler une vitrine
est le moindre mal : on montre moins, puis plus, jamais l'inverse.

**Un détail qui comptait :** le CTA se pose désormais dans le parent **réel** du
premier enfant masqué, et non dans `containers[0]`. Avec plusieurs squelettes, la
coupure tombe souvent dans le deuxième ou le troisième — le CTA se serait affiché
loin du point de coupure.

---

## 2. Ce que la liste blanche donne maintenant

Les trois articles de `freeArticles` sont **entiers** : `faire-bouger-enfants`
(9 010 mots), `comportements-perturbateurs` (9 757), `catastrophes-ordinaires`
(4 070). Aucun mur, aucun élément masqué.

C'était le défaut le plus contraire à l'intention : trois slugs choisis comme
appâts SEO, tronqués depuis leur mise en liste blanche.

---

## 3. Cas (d) — le mécanisme n'existe pas dans `main`

⚠ **`data-zts-toujours-visible` n'est nulle part dans le dépôt suivi.** Il vit
uniquement dans `_to_delete/lockpatch/zts-lock-page.js`, et l'article qui s'en
sert — `inventaire-materiel-sans-effort.html` — est dans
`_to_delete/livraison-article-inventaire/`.

Vérifié : `git ls-files _to_delete/` renvoie **0 fichier**, aucun commit n'a
jamais touché ce dossier, et
`https://zonetotalsport.ca/articles/inventaire-materiel-sans-effort.html`
répond **404**. Ce travail n'a jamais été livré.

Il n'y a donc pas de non-régression à mesurer : le mécanisme n'est pas là.

**Ce que j'ai fait à la place**, parce que mon correctif touche exactement la
fonction que ce patch modifie — `applyHalf()` — et que les deux doivent pouvoir
se composer : j'ai monté un bac à sable, appliqué le patch
`data-zts-toujours-visible` **par-dessus** mon correctif, copié l'article
inventaire dans `articles/`, et servi le tout sur un port neuf.

> **Résultat : 5 blocs exemptés, 0 masqué, 0 invisible.** La section « La solution
> gagnante : Zone Inventaire » reste visible, le mur est bien posé **avant** elle,
> 1 seul CTA, 37 % de l'article visible.

La composition tient, et elle est triviale — deux lignes dans la boucle des
enfants :

```js
if (enfants[i].classList.contains('zts-half-cta')) continue;
if (enfants[i].hasAttribute('data-zts-toujours-visible')) continue;
kids.push(enfants[i]);
```

**Le bac à sable a été entièrement retiré** : `zts-lock-page.js` restauré depuis
une copie prise avant le test, article supprimé de `articles/`. Vérifié : 0
occurrence de `toujours-visible` dans le fichier commité.

---

## 4. Ce que ce correctif NE règle PAS

Le ticket annonçait `50-jeunes-un-gymnase` de 93 % à ~50 %. **Il reste à 91 %.**
Cette promesse était fausse et je la corrige ici.

La cause n'est pas dans `zts-lock-page.js` : **81 % du texte de cet article —
5 524 mots — vit hors de TOUT conteneur**, dans des blocs frères de
`.article-body` (`bg-white rounded-2xl shadow-xl`, la section interactive des
21 stratégies). Énumérer les conteneurs ne peut rien pour du contenu qui n'est
dans aucun.

J'ai scanné les 25 articles avec un parseur HTML pour savoir si le cas est isolé :

| Article | Texte hors conteneur |
|---|:--:|
| `50-jeunes-un-gymnase` | **81 %** |
| les 24 autres | **≤ 1 %** |

C'est le seul. Le correctif est donc **structurel et propre à cet article** : il
faut que son contenu rentre dans un `.article-body`. Et ce déplacement changerait
la typographie de la section interactive — même problème de style que celui décrit
au §1. À traiter séparément, sur cet article seul.

**En attendant, `50-jeunes-un-gymnase` reste lisible à 91 % sans compte.**

---

## 5. Détail méthodologique — un piège qui a failli fausser le test

Le premier passage de mesure a donné `faire-bouger-enfants` inchangé à 53 %, ce
qui suggérait que le correctif ne marchait pas. Vérification faite, la cause était
ailleurs : le navigateur servait `zts-lock-page.js` **depuis son cache**
(`transferSize: 0` dans `performance.getEntriesByType('resource')`), alors que le
fichier sur le serveur était bien à jour.

Toutes les mesures « après » ont donc été refaites **sur une origine neuve** — un
port jamais visité — avec vérification que le JS venait bien du réseau
(`transferSize: 22 174 o`). C'est le chiffre publié au tableau du §0.

À retenir pour les prochains tests de ce fichier : changer de port, pas seulement
recharger.

---

## 6. Ce qui reste à faire

1. **Ton GO pour pousser cette branche** — je ne l'ai pas fait, comme demandé.
2. **`50-jeunes-un-gymnase`** (§4) — correctif structurel séparé, sur cet article.
3. **Le travail « article inventaire + `data-zts-toujours-visible` »** dort dans
   `_to_delete/`, jamais commité, article 404 en prod (§3). À livrer ou à
   abandonner explicitement — la composition avec ce correctif est prouvée.
4. **Après déploiement**, revérifier en prod que les trois articles de la liste
   blanche s'affichent bien entiers.

`verifie-habillage.py` : 0 bloquant, 4 avertissements — inchangé.
`verifie-partage-articles.py` : 0 bloquant, 1 avertissement (dette Unsplash).
