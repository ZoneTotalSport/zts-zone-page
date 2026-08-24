# PARTAGE DES ARTICLES — RAPPORT FINAL

**24 août 2026** · branche `partage/articles-social`, 8 commits, **non poussée**
`~/dev/Remotion 2/wix-deploy` — 30 fichiers, +1 087 / −557

---

## Ce qui est fait

Les 25 articles servent maintenant **un seul** bloc de partage, à six boutons,
et **les 25 rendent une carte d'aperçu complète** quand on colle leur lien dans
Facebook, Messenger, X ou un courriel.

| Contrôle | Avant | Après |
|---|:--:|:--:|
| `verifie-partage-articles.py` — bloquants | 23 | **0** |
| Cartes OG rendues sans défaut (parseur local) | — | **23/25** |
| Articles avec deux blocs de partage concurrents | 22 | **0** |
| Articles dont le bloc ne partage rien | 1 | **0** |
| Accès au partage natif du téléphone | 0 | **25** |
| `og:image` sous 1200×630 | 1 | **0** |
| Fichiers partagés modifiés | — | **0** |
| `verifie-habillage.py` | 0 bloquant | **0 bloquant** |

Les 2 cartes « avec défaut » ne sont pas des erreurs : voir §4.

---

## 1. Les huit commits

**`0140c45a` — `_scripts/verifie-partage-articles.py`.** Écrit en premier, pour
que les commits suivants aient quelque chose qui les juge. `verifie-habillage.py`
ne scanne que `apps/` : il serait resté vert même si tout le partage était cassé.
Le nouveau contrôle vérifie les cinq balises, l'existence et la taille de
l'image, la cohérence `og:url` / canonical / nom de fichier, et l'unicité du bloc
de partage. Il compte les **liens sharer**, pas les blocs : c'est le seul point
commun aux trois habillages qui coexistaient.

**`1a9e10d8` — `assets/zts-partage-article.js`.** 295 lignes. Il **reprend** les
cercles existants au lieu de les refaire : ajoute `navigator.share` en premier
cercle sur mobile, réinstalle WhatsApp, passe le titre à X et au courriel,
remplace `twitter.com/intent/tweet` par `x.com/intent/post`, et refait « Copier
le lien » avec un vrai toast et un repli. Aucun SDK, aucun script tiers.

**`18faf65f` — suppression du doublon.** 552 lignes retirées, zéro ajoutée,
22 articles.

**`fe7ff01f` — rustine sur l'image de `grands-jeux`.** Voir §3.

**`0cc54f57` — `un-jeu-trois-versions` partage enfin l'article.** Voir §2.

**`2f65c90e` — `og:image:width` / `og:image:height` sur les 25.** Sans elles,
Facebook doit télécharger l'image avant de savoir la dessiner : au **premier**
partage d'un lien — celui qui n'est pas encore dans son cache — la carte sort
souvent sans image. Le défaut ne se voit jamais quand on teste, seulement quand
un lecteur partage.

**`ec80ed29` — injection du script.** Une ligne par article, après
`zts-lock-page.js`. Rollback trivial : la retirer rend aux articles leurs cercles
d'origine, qui marchent toujours.

**`d01470ca` — `TICKET-FUITES-MUR-ARTICLES.md`.** Voir §5.

---

## 2. Le défaut le plus grave n'était pas celui du chantier

`un-jeu-trois-versions.html` affichait « Partager : » au-dessus de deux icônes
Facebook et Instagram qui pointaient vers **les profils de Zone Total Sport**. Un
lecteur qui cliquait pour envoyer l'article à un collègue atterrissait sur la
page d'accueil de Facebook.

C'est pire qu'un bloc absent : un bloc absent se voit. Celui-là avait l'air de
marcher. Il porte désormais les six mêmes boutons que les 24 autres, et plus
aucun lien vers un profil — vérifié au navigateur.

---

## 3. Décision 2 — la rustine Unsplash, et sa dette

`grands-jeux-exterieurs-camp-de-jour` pointait sur `logo-zts.png`, 900×289 : sous
le minimum de Facebook et au mauvais ratio. Sa carte affichait le logo du site en
petite vignette, ce qui ne dit rien de l'article.

C'est le seul des 25 sans aucune image locale — ses trois illustrations sont des
liens directs vers Unsplash. En attendant ton rendu, `og:image` pointe sur la
première de ces images, recadrée en `?w=1200&h=630&fit=crop`. **Vérifié : l'URL
répond 200 et sert bien du 1200×630.**

⚠ **La dette est réelle : la carte d'aperçu de ZTS dépend maintenant d'un serveur
tiers.** Si Unsplash change ou retire cette photo, l'aperçu casse en silence.
Elle est écrite en clair dans le fichier, juste au-dessus de la balise, et
`verifie-partage-articles.py` la signale à chaque passage — c'est le seul
avertissement restant sur les 25 articles, et il doit le rester jusqu'à l'arrivée
de l'image locale.

**Quand tu déposeras le rendu** dans
`articles/images/heroes/grands-jeux-exterieurs-camp-de-jour.jpg`, il faudra
remplacer les deux balises `og:image` / `twitter:image`, corriger
`og:image:width` / `og:image:height`, et retirer le commentaire de dette.

---

## 4. Les images : rien n'a été redimensionné

Conformément à la consigne. Les 25 `og:image` répondent, et 24 dépassent
1200×630. Deux méritent ton œil, pas une correction :

`avance-annee-scolaire.jpg` et `sae-course.jpg` font **1600×1600** — assez
grandes, mais carrées. Facebook recadre au centre en 1,91:1 et **perd 48 % de la
hauteur**. J'ai simulé les deux recadrages :

- **`sae-course`** survit très bien : les enfants qui courent tiennent
  entièrement dans le cadre, c'est même mieux cadré qu'en carré.
- **`avance-annee-scolaire`** perd le haut du crâne de l'enseignant et le titre
  « Physical education » du tableau. Le sujet reste lisible, le cadrage est
  moyen. Si tu veux le corriger, il faut une version en 1,91:1, pas un
  redimensionnement.

---

## 5. Les fuites du mur — diagnostiquées, chiffrées, NON corrigées

Tu as demandé un commit qui corrige les deux fuites. En cherchant à l'écrire,
j'en ai trouvé une **troisième**, et surtout que **les trois ont la même cause
unique : `zts-lock-page.js`**, que les garde-fous interdisent de toucher.

| Fuite | Article | Mesure, en anonyme |
|---|---|---|
| A — `contentContainer()` ne retient qu'un `.article-body` | `50-jeunes-un-gymnase` | **93 % du texte lisible** sans compte |
| B — aucun `.article-body`, `demiApercu()` sort | `un-jeu-trois-versions` | **100 % lisible** |
| C — `freeArticles` est inerte | les 3 articles publics | **murés quand même** (53 % sur `faire-bouger-enfants`) |

La fuite C va dans l'autre sens et personne ne l'avait vue : `init()` fait
`if (kind === 'article') { initArticleHalf(info); return; }` — le `return` tombe
**avant** tout appel à `loadWhitelist()`. Les branches `jeu` et `resource`
consultent bien la liste ; les articles, jamais. Trois slugs choisis comme appâts
SEO sont donc tronqués.

**Pourquoi je me suis arrêté.** J'ai mesuré ce que coûterait la seule correction
possible sans toucher au fichier gelé — poser `.article-body` sur les conteneurs
orphelins. Cette classe **porte le style** : sur `un-jeu-trois-versions`, les
citations passeraient de 17 à 31,2 px et les `h3` changeraient de police. Ce n'est
pas un diff minimal.

Le ticket porte le diagnostic, les trois sorties possibles et les valeurs à
revalider. **Ma recommandation : corriger la cause dans `zts-lock-page.js`**, ce
qui demande ta permission de lever le gel sur ce fichier.

---

## 6. Non-régression du mur — prouvée par comparaison directe

Tu as demandé de retester le mur en anonyme après le nettoyage. Je l'ai fait en
servant **`main` en parallèle** depuis un worktree sur un second port, et en
mesurant les mêmes articles des deux côtés. Mesure : mots visibles / mots totaux
des `p`, `h2`, `h3`, `li`, `blockquote` sous `article`, hors nav, pied de page et
CTA.

| Article | `main` | branche | Écart |
|---|:--:|:--:|:--:|
| `classes-difficiles-partie-1` | 3 423 / 10 718 — 32 % | 3 423 / 10 718 — 32 % | **aucun** |
| `50-jeunes-un-gymnase` | 6 311 / 6 796 — 93 % | 6 311 / 6 796 — 93 % | **aucun** |
| `grands-jeux-exterieurs-camp-de-jour` | 874 / 1 868 — 47 % | 874 / 1 868 — 47 % | **aucun** |

Identiques au mot près. **Les trois fuites préexistaient ; ce chantier n'en a
causé ni aggravé aucune.** Le worktree a été retiré après mesure.

⚠ **Précision de vocabulaire** : ce sont les **blocs de partage** doublés qui ont
été nettoyés, pas les **squelettes** doublés. Les 23 articles à deux `<article>`
empilés le sont toujours — c'est justement ce que le ticket §5 propose de traiter
à la racine.

---

## 7. Ce qui a été testé, et ce qui ne l'a pas été

**Testé au navigateur**, en anonyme, sur un article FR et un EN :
le script monte et injecte son CSS · les 5 cercles font 40 px et restent ronds ·
X part sur `x.com/intent/post` avec le titre · le courriel porte « À lire :
*titre* » · WhatsApp porte titre + URL · en `?lang=en` le titre lu est bien celui
du `<span lang="en">` du héros · deux `zts:langchange` d'affilée n'ajoutent aucun
doublon · `navigator.share` simulé : le bouton apparaît **en premier**, avant
Facebook, avec le bon titre et la bonne URL · le libellé de la pilule reste
intact après un clic, les quatre `<span lang>` survivent · le toast s'affiche à
`z-index` 100000, donc au-dessus du mur (99999) · `un-jeu-trois-versions` :
0 lien vers un profil.

**Cartes OG validées par parseur local** — 23/25 sans défaut, les 2 autres étant
les images carrées du §4. Aucun recours au débogueur Facebook, comme demandé.

⚠ **CE QUE JE N'AI PAS PU PROUVER : le chemin nominal de la copie.** Le
presse-papiers refuse l'écriture sous automatisation — `NotAllowedError`, y
compris appelé directement hors de mon code, en contexte sécurisé. C'est donc le
**repli** qui s'est déclenché, et le toast a dit vrai : « Copie impossible ». Le
code des deux chemins est en place et le repli est vérifié ; **la copie par un
vrai clic humain reste à confirmer à la main.**

---

## 8. À ta charge

1. **Le rendu local** pour `grands-jeux-exterieurs-camp-de-jour` (§3) — c'est la
   seule dette active.
2. **La décision sur `TICKET-FUITES-MUR-ARTICLES.md`** (§5) : lever le gel sur
   `zts-lock-page.js`, ou laisser deux articles ouverts à 93 % et 100 % et trois
   articles publics tronqués.
3. **Un clic humain sur « Copier le lien »**, pour clore le §7.
4. **Pousser la branche** — je ne l'ai pas fait.
5. Regarder `avance-annee-scolaire.jpg` recadré (§4), si le cadrage te dérange.

---

## 9. Dettes assumées et trouvailles hors périmètre

**Laissé en place pour garder le diff minimal :**
- `copyLink()` et son `#copyToast` restent définis dans 24 articles, sans plus
  aucun appelant ; la règle CSS `.share-btn` reste déclarée sans plus aucun
  porteur. Aucun effet à l'écran.

**Préexistant, vérifié sur `main`, non corrigé :**
- **23 articles jettent un `SyntaxError` à chaque chargement.** Leur script de
  commentaires écrit
  `list.innerHTML = '<p style="…font-family:var(--font-body, 'Quicksand'…` — des
  apostrophes imbriquées dans une chaîne déjà délimitée par des apostrophes. Le
  bloc de commentaires de ces pages ne peut pas fonctionner.
- `bienfaits-sport-enfants.html` porte un `</div>` sans ouverture à la ligne 244.
- `verifie-habillage.py` ne scanne que `apps/`. Il ne regardera jamais
  `articles/` — c'est pour ça que le nouveau script existe.
