# LOT 1 — VAGUE C : le mur descend de l'app vers l'item

**Fait le 17 août 2026.** Branche `lot1/vague-a-cadenas`. Rien en production.

## La règle 3-3-3-3

Quatre familles, trois items ouverts chacune. Les vagues précédentes ont posé
les trois premières colonnes ; celle-ci pose la quatrième et fait lire la
troisième aux deux SPA.

| Famille | Ouvert sans compte | Où c'est appliqué |
|---|---|---|
| Outils | `suppleance`, `musique`, `colorier` | `freeResources` → `zts-lock-page.js` |
| Articles | 3 slugs | `freeArticles` → `zts-lock.js` |
| Jeux | `1-2-3-soleil`, `ballon-chasseur-classique`, `le-jardin-cooperatif` | `freeItems.jeux` → fiches statiques **+ SPA (nouveau)** |
| SAÉ | **les 3 ci-dessous** | `freeItems.sae` → SPA (nouveau) |

## Ce qui change, en une phrase

**La liste reste ouverte, la fiche se ferme.** Les 1439 jeux et les 1880 SAÉ
restent navigables, filtrables et cherchables sans compte — c'est l'argument de
vente. Ouvrir une fiche demande un compte, sauf les trois vitrines de chaque
banque.

C'est pourquoi `jeux` et `sae` **restent dans `freeResources`**, définitivement.
Les en retirer murerait la liste elle-même. Le commentaire `_vitrines` de
`locked-whitelist.json` disait « le temps de la vague C » — il est corrigé : ce
n'était pas un sursis, c'est l'état final.

## Les trois SAÉ vitrine, et pourquoi celles-là

Critères : **complètes**, **une par cycle du primaire**, parmi les plus fortes.
La complétude est mesurée sur le **détail** (16 champs : `cours`,
`grille_evaluation`, `adaptations`, `english`, `criteres_evaluation`,
`variantes`, `interdisciplinarite`…), pas sur l'index allégé — c'est le détail
que le visiteur va lire.

| Cycle | SAÉ | Note | Cours | PFEQ |
|---|---|---|---|---|
| 1er primaire | **Dodgeball de la Caraïbe — Calypso Ball et rythme des îles** | 16/16 | 3 | C1 — Agir |
| 2e primaire | **Les Légendes du Basketball — Dans les Pas de Naismith** | 16/16 | 4 | C1 — Agir |
| 3e primaire | **Mon corps en mouvement — Initiation au circuit de stations** | 16/16 | 4 | C3 — Mode de vie |

**Ce qui a été écarté, et pourquoi.**

- **Le Ballon chasseur classique** (SAÉ) sort d'office : le *jeu* du même nom
  est déjà vitrine. Ouvrir deux fois le même contenu, c'est donner deux fois et
  montrer une fois.
- **Escrime moderne** (3e cycle, 16/16, **5 cours** — la mieux notée de tout le
  primaire) est écartée avec les autres SAÉ de duel, lutte et boxe : elles
  demandent du matériel de protection et une politique d'école sur le contact.
  Une vitrine doit pouvoir être jouée lundi matin par n'importe qui.
- **Ultimate Frisbee**, **La Crosse des Ancêtres**, **Ping-Pong des Champions**
  (toutes 16/16, 4 cours) : leur cycle déclaré est « 2e et 3e cycles ». Aucune
  ne donne un 3e cycle *net*, et le critère demandait un cycle par vitrine.

**Le troisième choix est délibérément le seul en C3.** Les deux premières sont
en C1 (agir). « Mon corps en mouvement » couvre le mode de vie sain et actif, et
ne demande que des cônes, des cerceaux et des cordes à sauter — c'est la vitrine
qu'un enseignant sans budget peut faire tourner tel quel.

**Vérifié :** les trois slugs sont uniques sur les 1880. Sept collisions de
slugs existent ailleurs dans la banque (`le-defi-des-cones`,
`les-champions-de-coordination`, `la-riviere-aux-crocodiles`, `defi-esquive`,
`la-danse-des-cerceaux` et deux autres) — aucune ne touche les vitrines, mais
c'est un ticket à ouvrir : deux SAÉ homonymes deviendraient vitrines ensemble.

## Le piège du slug

Le slug n'est **pas écrit dans les données** : le Worker le calcule avec
`slugify(titre)`. Renommer le titre d'une SAÉ vitrine casse donc la vitrine
**en silence** — l'item redevient verrouillé, sans erreur nulle part. Les trois
titres exacts sont recopiés dans `locked-whitelist.json` (`_freeItems_slug`)
pour qu'un renommage se remarque.

## Ce qu'il a fallu ajouter au Worker

Une SAÉ vitrine « ouverte » aurait été **vide**. La banque `sae` est la seule
dont le contenu ne vit pas dans sa propre source : `sae-all-light.json` ne porte
que l'index (664 o par item), la valeur est dans `sae-detail/<catégorie>.json`,
derrière jeton. Le visiteur aurait reçu une fiche ouverte et creuse.

`enrichirVitrines()` va donc chercher le détail des vitrines au moment de bâtir
la charge publique et le fusionne. Trois garde-fous :

1. **L'`id` est vérifié après coup.** `_idx` vient des données ; l'alignement a
   été vérifié sur les 1880 (aucun décalage), mais un décalage futur publierait
   **la mauvaise SAÉ en clair** — pire qu'une vitrine vide. En cas d'écart, on
   retombe sur une recherche par `id`.
2. **Un détail illisible ne fait pas tomber la banque** : l'item reste allégé.
3. **Une lecture R2 par catégorie portant une vitrine**, pas plus — trois au
   total, sur une réponse mise en cache 24 h au bord.

## Comment les SPA savent qu'un item est verrouillé

**Elles ne lisent pas la liste blanche.** Elles lisent **ce qu'elles ont reçu** :
un item sans aucun champ de contenu est verrouillé. `ZTSBanques.estVerrouille()`
(dans `zts-banques.js`, partagé par les deux).

Le client *pourrait* relire `locked-whitelist.json` et comparer les slugs. Ce
serait une deuxième source de vérité, désynchronisable de celle du Worker : le
jour où les deux divergent, l'app promet une fiche que la charge ne contient
pas. Le Worker reste seul juge.

⚠ **Ni `_vitrine` ni `_slug` ne servent de test.** Ils sont absents de la charge
`full` d'un membre, dont tous les items sont pourtant complets. Un test sur
`_vitrine` aurait muré la banque entière pour les membres.

Champs témoins retenus :

- **jeux** — `but`, `deroulement`, `materiel`, `disposition`
- **SAÉ** — `tache_complexe`, `cours`, `deroulement`, `materiel`.
  `tache_complexe` est dans la charge light d'un membre mais **hors de `liste`** ;
  `cours` n'arrive que par le détail fusionné d'une vitrine. Un anonyme devant
  une SAÉ ordinaire n'a ni l'un ni l'autre.

## Les deux portes dérobées fermées en même temps

Une fiche murée ne sert à rien si le même contenu sort par une autre porte.

1. **Jeu aléatoire** (`showRandomGame`) affichait `but` — une ligne vide pour
   1436 jeux sur 1439. Elle affiche maintenant une phrase explicite. Ce n'était
   pas une fuite, c'était pire à sa façon : ça ressemblait à une app cassée.
2. **« Ajouter à mon cours »** (SPA SAÉ) recopiait `criteres_evaluation` et
   `intentions_pedagogiques` dans le plan de cours, en passant par `loadDetail`.
   Un anonyme n'aurait pas eu la fiche mais aurait eu un slot à moitié rempli.
   Le mur s'affiche à la place. Les éducatifs (`_isEducatif`) ne viennent pas de
   la banque SAÉ et ne sont pas concernés.

## `locked_view` — tracé une fois, pas deux

`ztsShowLockedFullscreen` **émet déjà** `locked_view` avec `layer:'fullscreen'`.
`murItem()` ne réémet rien. Un second appel aurait compté deux vues pour une, et
faussé le seul tunnel qu'on mesure.

Le mur est **fermable** dans les deux SPA : on vient de dire au visiteur que la
liste est à lui, on ne le piège pas dessus.

## Un appel en moins

Une SAÉ vitrine arrive déjà complète. Sans garde-fou, `loadDetail()` aurait
quand même appelé `/sae/detail/…` — un 401 garanti, sur la seule fiche qu'on
veut ouvrir sans friction. `loadDetail` sort maintenant tout de suite si
`cours` est déjà là.

## Mesuré, pas supposé

**Rejoué sur les données réelles** (le code du Worker exécuté hors ligne sur
`_data/`, faux binding R2) :

| Banque | Items | Charge publique | Vitrines complètes | Fuites hors vitrine |
|---|---|---|---|---|
| jeux | 1439 | 502 Ko | 3 / 3 | **0** |
| SAÉ | 1880 | 755 Ko | 3 / 3 | **0** |

Item ordinaire côté SAÉ : 10 champs (`_slug`, `id`, `titre`, `cycle`, `niveau`,
les deux durées, `competence_pfeq`, `moyen_action`, `espace`). Côté jeux :
12 champs, aucun de contenu.

**Dans un navigateur, anonyme, sur la branche servie en local** (les vitrines
`sae` ne s'allument pas encore — le Worker lit la liste blanche de la
production, qui n'a pas `freeItems` avant la fusion ; les vitrines ont donc été
vérifiées par injection d'un item complet) :

| Vérification | Résultat |
|---|---|
| Liste jeux navigable sans compte | **1439 cartes** |
| Liste SAÉ navigable sans compte | **1880 SAÉ chargées** |
| Clic sur une carte ordinaire (les deux SPA) | **mur affiché, fiche jamais ouverte** |
| Mur fermable, défilement rendu | **oui**, liste intacte derrière |
| Item complet (vitrine simulée) | **fiche entière**, 6 sections, aucun mur |
| Appels réseau de la SPA SAÉ | **un seul** — `/sae/public.json`, aucun `/sae/detail/` |
| Jeu aléatoire verrouillé | phrase explicite, plus de ligne vide |

## À la fusion

- `freeItems.sae` arrive avec la branche : **les trois vitrines s'allument
  d'elles-mêmes**, le Worker lisant la liste blanche de la production.
- ⚠ **Le Worker doit être redéployé** (`enrichirVitrines` est nouveau). Sans ce
  déploiement, les trois SAÉ vitrine s'ouvriront **vides** — le pire des deux
  mondes. Le déploiement du Worker n'est pas en CI : c'est un `wrangler deploy`
  à la main depuis `cf-worker/jeux-data/`.
- Rejouer les vérifications du tableau ci-dessus sur la production, cette fois
  avec les vraies vitrines SAÉ.
