# État de la mascotte — le prof d'ÉPS remplace le bûcheron

**Décision de Joey, 4 août 2026.** Le bûcheron (chemise à bretelles, bottes de
travail) cède la place au **prof d'éducation physique en bleu** : chandail cyan à
écusson ÉPS, sifflet, espadrilles. Référence : `shared/img/perso/perso_eps.png`.

Les images sont générées par la session **Cowork, avec nanobanana** — je ne peux
pas les dessiner. Chaque lot arrive dans `~/Downloads/`.

---

## Fait

| Lot | Contenu | Où |
|---|---|---|
| **Lot 2** | 14 poses + basketball, éducatifs, hockey | `apps/educatifs/img/mascots/` et copies |
| **Favicon** | généré depuis `perso_eps.png` en 140×180 | `/favicon.png`, servi aux **1442 pages** |
| **Lot 3** | **25 visuels, 73 fichiers** — 9 août | partout, voir plus bas |

### Le lot 3 — 9 août 2026. **LE CHANTIER MASCOTTE EST TERMINÉ.**

> **LES IMAGES EXISTAIENT DEPUIS LE 3-5 AOÛT. PERSONNE NE LE SAVAIT.**
> Ce document annonçait « il faut un lot 3 » et attendait une génération
> Cowork. Elle avait déjà eu lieu : les fichiers dormaient dans
> `~/PROJETS_CLAUDE/_to_delete/_regen_1785933213/`, réparti en `final/`,
> `final_lot3/`, `final_lot4/` et `final_lots56/`. **Un dossier dont le nom
> annonce une suppression.** On a failli les perdre en croyant qu'il fallait
> les refaire.
> **La leçon** : avant de commander une régénération d'assets, chercher sur le
> disque par le nom du fichier cible. `find ~ -name "<cible>-v2.png"` aurait
> répondu en une seconde.

Les 25 sont passés **aux dimensions exactes**, 73 fichiers au total (plusieurs
apps embarquent leur propre copie du même visuel). Zéro refus : chaque source
a été comparée à sa cible avant écriture.

Trois choses trouvées en chemin, qui expliquent pourquoi 25 et pas 26 :

- **`mr-root-thumbup` n'a pas besoin d'une version prof.** Il n'est appelé que
  depuis `index-old.html`, une page morte déjà couverte par les redirections
  301. Son fichier vit dans `apps/_archive/`. Le lot 3 est **complet à 25**,
  pas incomplet à 26.
- **Le time-out ne s'appelait pas `timeout-bucheron-v2`** mais
  `signal-timeout-v2.png`, dans `final_lots56/`. Même geste, mêmes 912×1169.
  Cherché par dimensions après avoir échoué par nom.
- **`apps/musique/img/bucheron-musique.png` (1824×2338, 2,7 Mo) n'est jamais
  servi.** L'app appelle `https://zonetotalsport.ca/bucheron-musique.png`,
  la copie racine, en URL absolue. Le fichier local est du poids mort — laissé
  en bûcheron faute d'une source à sa taille, et **candidat à la suppression**.

> **UNE EXCEPTION ASSUMÉE À LA RÈGLE DES DIMENSIONS ÉGALES —
> `apps/tni/img/bucheron-tni.png`.** La cible faisait 2500×2500 pour **4,4 Mo**,
> la source 600×600. La règle dit non. Elle a été outrepassée, et voici
> pourquoi : la règle existe pour que **la mise en page ne bouge pas**, or
> `.intro-mascot` fixe `height:180px` sans contrainte de largeur, et les deux
> images ont le **même rapport 1:1**. Mesuré au banc avant/après : rendu
> **180×180 dans les deux cas**, rapport 1.000. Rien ne bouge — et le fichier
> passe de 4,4 Mo à 348 Ko pour une image affichée à 180 px.
> **Ce qui compte n'est pas l'égalité des dimensions, c'est l'égalité du
> rapport quand le CSS pilote la taille.** Vérifier laquelle des deux
> s'applique avant de refuser un remplacement.

> **LES IMAGES ONT ÉTÉ COMMITÉES PAR UNE AUTRE SESSION, DANS `bbcdc49`.**
> Un second terminal travaillait sur le cadenassage des apps en parallèle ; son
> `git add -A` a emporté mes 73 images dans un commit intitulé
> « docs(redirections) ». Le contenu est intact — vérifié octet pour octet
> contre les sources, 73/73 identiques — mais l'historique est trompeur.
> Non réécrit **exprès** : on ne réécrit pas l'historique d'un dépôt où une
> autre session écrit au même moment.
> **La leçon** : à plusieurs sessions sur un dépôt, indexer par chemin explicite
> et ne jamais faire `git add -A`.

> **⚠ NE REMPLACER QU'À DIMENSIONS ÉGALES.** Une image de taille différente
> déplace la mise en page sans que rien ne le signale. Trois copies du lot 2 ont
> été refusées à ce titre (468×600 contre 390×500) et régénérées depuis la source
> à leur taille d'origine, pas écrasées.

> **LE FAVICON ÉTAIT CASSÉ, INDÉPENDAMMENT DE LA MASCOTTE.** 1440 pages
> déclaraient `<link rel="icon" href="/favicon-bucheron.png">` — fichier
> inexistant, 404 en production. Elles n'avaient donc **aucune** icône d'onglet.
> Corrigé le 4 août : toutes pointent `/favicon.png`, un nom neutre qu'il suffira
> de réécrire aux prochains changements de mascotte.

---

## ~~Ce qu'il reste — il faut un **lot 3**~~ — LIVRÉ LE 9 AOÛT

**La liste ci-dessous est conservée pour mémoire. Les 25 premiers sont faits ;
seul `mr-root-thumbup` reste en bûcheron, et c'est voulu — voir plus haut.**

Ce qui reste en bûcheron dans le dépôt, et pourquoi :

| Fichier | Pourquoi |
|---|---|
| `apps/_archive/…/mr-root-thumbup.png` | archive, appelé depuis une page morte |
| `apps/musique/img/bucheron-musique.png` | jamais servi, 2,7 Mo de poids mort |
| `apps/scoreboard/mr-root-scoreboard.png` | **une v2 existe** en 2500×3207, dimensions exactes, dans `final_lot4/` — mais le fichier n'est appelé nulle part. À traiter si l'app scoreboard revit |

Reste aussi **non exploité** dans `_regen_1785933213/` : 60 poses dans
`poses_v2/`, sept signaux de gymnase en 912×1169, des logos et des visuels
Facebook. Rien de tout ça n'est dans le dépôt. À regarder à part.

### La liste d'origine, pour mémoire

**26 visuels** encore en bûcheron. Par ordre d'impact :

| Visuel | Appels | Copies |
|---|---|---|
| `bucheron-salut.png` | 7 | 8 |
| `bucheron-hero.png` | 6 | 3 |
| `mr-root-bureau.png` | 5 | 1 |
| `bucheron-generateur.png` | 5 | 2 |
| `bucheron-tni.png` | 4 | 3 |
| `bucheron-jeux.png` | 3 | 1 |
| `bucheron-aidons-nous.png` | 3 | 1 |
| `bucheron-sae.png` | 2 | 1 |
| `bucheron-musique.png` | 2 | 2 |
| `bucheron-grille.png` | 2 | 1 |
| `bucheron-defi.png` | 2 | 5 |
| `bucheron-createur.png` | 2 | 6 |
| `bucheron-agenda.png` | 2 | 1 |
| `timeout-bucheron.png` | 1 | 1 |
| `mr-root-thumbup.png` | 1 | 0 |
| `mr-root-logo.png` | 1 | 1 |
| `bucheron-suppleance.png` | 1 | 1 |
| `bucheron-sports.png` | 1 | 1 |
| `bucheron-salut2.png` | 1 | 5 |
| `bucheron-pointer.png` | 1 | 7 |
| `bucheron-mes-sae.png` | 1 | 4 |
| `bucheron-lire.png` | 1 | 4 |
| `bucheron-hero-hover.png` | 1 | 1 |
| `bucheron-eval.png` | 1 | 1 |
| `bucheron-carnet.png` | 1 | 1 |
| `bucheron-banque.png` | 1 | 4 |

Les copies multiples sont normales : plusieurs apps embarquent leur propre
exemplaire du même visuel. Le script d'intégration les traite toutes d'un coup —
voir le commit `e245edc` pour la méthode.

## Comment intégrer un lot

1. Déposer les fichiers dans `~/Downloads/<nom-du-lot>/`, suffixés `-v2.png`.
2. Pour chaque image, chercher toutes les copies du même nom dans le dépôt.
3. **Ne copier que si les dimensions sont identiques.** Sinon régénérer à la
   bonne taille avec `sips -z <hauteur> <largeur>`.
4. Vérifier une image à l'œil après coup — les poses se ressemblent.
