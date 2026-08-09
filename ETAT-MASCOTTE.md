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

## Ce qu'il reste — il faut un **lot 3**

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
