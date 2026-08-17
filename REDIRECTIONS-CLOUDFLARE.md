# Redirections à poser dans Cloudflare

**Fichier prêt à importer : `redirections-cloudflare.csv`** — 12 lignes,
colonnes `source,destination,statut`. Cloudflare → **Rules → Bulk Redirects**
→ créer une liste → importer le CSV → créer la règle qui utilise la liste.

Chaque destination a été vérifiée le 9 août 2026 : les six cibles
(`/`, `/apps/agenda/`, `/apps/generateur/`, `/apps/transitions/`,
`/apps/jeux/`, `/apps/grille/`) répondent **200 sans aucun saut**.

**État au 9 août 2026 — liste `zts_sous_domaines_301` créée via l'API.**
Les 12 items sont dans la liste, la règle Bulk Redirect est active.

- **5 sous-domaines** (`generateur.`, `gym.`, `jeux.`, `agenda.`, `ia.`) :
  301 opérants. `generateur.`, `gym.` et `jeux.` arrivent en un seul saut.
  `agenda.` et `ia.` font encore 2 sauts : une ancienne Redirect Rule de zone
  (sans trailing slash) s'évalue avant la Bulk Redirect — à supprimer dans le
  dashboard (**Rules → Redirect Rules**) pour que la liste prenne le relais.
- **7 items de chemins** (`/apps-nhl/`, `/apps-nba/`, `/apps-fifa/`,
  `/apps/nhl-playoffs/`, `/apps/nba-playoffs/`, `/index-old.html`,
  `/teasing.html`) : **inopérants tant que `zonetotalsport.ca` est en DNS only**
  (pas de proxy Cloudflare sur le domaine principal). Les items sont prêts dans
  la liste — ils s'activeront le jour du chantier proxy orange (prérequis :
  SSL mode **Full**, pas Flexible, pour éviter les boucles de redirection).
  En attendant, ces pages restent en 200 (contenu mort, aucun lien n'y pointe).

### État au 17 août 2026 — bascule vers les règles de zone

**Ce qui a changé ce jour-là.** La liste `zts_sous_domaines_301` ne préservait
pas les sous-chemins : mesuré le matin, `jeux./app.js` et `generateur./app.js`
répondaient encore **200** et servaient la copie parallèle du site en
profondeur. Cocher « Subpath matching » sur les items n'a rien produit — et la
doc Cloudflare ne restreint aucun paramètre de Bulk Redirect selon le plan, ce
n'était donc pas une limite du gratuit.

La correction n'est pas passée par la liste mais par des **Redirect Rules de
zone**, éditables au tableau de bord sans jeton d'API. **Cinq règles** :

| Règle | Couvre |
|---|---|
| `souschemins-groupe` | les 7 sous-domaines dont le nom correspond au dossier d'app, par `substring(http.host, …)` |
| 3 règles wildcard | `jeux.` → `/apps/jeux/`, `generateur.` → `/apps/generateur/`, `gym.` → `/apps/transitions/` — leurs cibles ne se déduisent pas du nom |
| `ia` (conservée) | `ia.` → `/apps/generateur` |

Les vieilles règles de juillet sont **supprimées**. La liste
`zts_sous_domaines_301` reste en place mais ne sert plus que les racines
qu'elle matche encore ; les règles de zone couvrent tout le reste, sous-chemins
compris.

**Mesuré après la bascule — les 5 sous-domaines à cible explicite :**

| Sous-domaine | Racine | Sous-chemin | Query string |
|---|---|---|---|
| `jeux.` | 301 → `/apps/jeux/`, 1 saut | `/app.js` → `/apps/jeux/app.js` | conservée (`?lang=en`, `?v=2`) |
| `generateur.` | 301 → `/apps/generateur/`, 1 saut | `/app.js` → `/apps/generateur/app.js` | conservée |
| `gym.` | 301 → `/apps/transitions/`, 1 saut | `/index.html` → `/apps/transitions/index.html` | conservée |
| `agenda.` | 301 → `/apps/agenda/`, 1 saut | — | — |
| `ia.` | 301 → `/apps/generateur`, **2 sauts** | — | cible sans barre finale, défaut connu |

Les chemins profonds sont donc scellés : `jeux./data/jeux/opposition.json`
redirige au lieu de servir 16 Mo. C'était le dernier trou de la vague D.

### ⛔ RÉGRESSION OUVERTE — 7 sous-domaines redirigent vers des 404

**Mesuré le 17 août, après la bascule. Non corrigé à l'écriture de cette note.**

`souschemins-groupe` retire **un caractère de trop** au nom d'hôte :

| Sous-domaine | Cible produite | Cible attendue |
|---|---|---|
| `sae.` | `/apps/sa/` → **404** | `/apps/sae/` |
| `educatifs.` | `/apps/educatif/` → **404** | `/apps/educatifs/` |
| `musique.` | `/apps/musiqu/` → **404** | `/apps/musique/` |
| `suppleance.` | `/apps/suppleanc/` → **404** | `/apps/suppleance/` |
| `evaluation.` | `/apps/evaluatio/` → **404** | `/apps/evaluation/` |
| `tni.` | `/apps/tn/` → **404** | `/apps/tni/` |
| `grille.` | `/apps/grill/` → **404** | `/apps/grille/` |

Les 14 cibles ont été vérifiées une à une : les 7 tronquées répondent 404, les
7 correctes répondent 200. Le défaut touche aussi les sous-chemins
(`sae./app.js` → `/apps/sa/app.js`).

**Le correctif tient dans une constante.** `.zonetotalsport.ca` fait
**18 caractères**. Pour `sae.zonetotalsport.ca` (21 caractères), il faut garder
les 3 premiers, donc une fin de `substring` à `len(http.host) - 18`. La règle
utilise 19. Les trois règles wildcard ne sont pas concernées — elles portent
leur cible en clair, ce qui est aussi pourquoi elles n'ont jamais cassé.

**Pourquoi ça n'a pas été vu au contrôle.** Le contrôle a lu le *code de
statut* : les 12 répondent bien 301. Il n'a pas lu la *destination*. C'est
exactement ce que le bloc de vérification de fin de fichier attrape, à la
condition de le jouer en entier — le point 1 imprime la cible, pas seulement le
code, et le point 5 vérifie qu'aucune page vivante n'est tombée.

⚠ **Règle d'or n°3 : toute ancienne URL = redirection 301, jamais un 404.**
Une 301 vers un 404 la viole autant qu'un 404 direct — elle la maquille.

## Ce que contient le CSV

**Les 5 pages sportives retirées** — détail plus bas : `/apps-nhl/`,
`/apps-nba/`, `/apps-fifa/`, `/apps/nhl-playoffs/`, `/apps/nba-playoffs/` →
l'accueil, où vivent désormais les matchs du jour.

**Les 3 sous-domaines qui servaient encore l'app complète** — détail plus bas :
`generateur.`, `gym.`, `jeux.` → `/apps/generateur/`, `/apps/transitions/`,
`/apps/jeux/`.

**Deux sauts en trop à corriger.** `agenda.` et `ia.` redirigent déjà, mais
vers une cible **sans barre oblique finale** : GitHub Pages émet alors un
second 301 pour l'ajouter. Deux sauts au lieu d'un, à chaque visite. Ces deux
lignes **remplacent** les règles existantes, elles ne s'y ajoutent pas.

| Aujourd'hui | Après |
|---|---|
| `agenda.` → `/apps/agenda` → `/apps/agenda/` | `agenda.` → `/apps/agenda/` |
| `ia.` → `/apps/generateur` → `/apps/generateur/` | `ia.` → `/apps/generateur/` |

**Deux orphelins de la racine**, servis en 200, sans `noindex`, absents du
sitemap, et — vérifié par recherche de code, pas par balayage de liens —
récupérés par personne : `index-old.html` (494 Ko, l'ancienne home, dont le
canonique pointe déjà sur `/`) et `teasing.html`.

### Trois retraits — la recherche de liens m'avait trompé

`header.html`, `footer.html` et `login.html` figuraient dans une première
version de ce CSV parce qu'aucune page ne pointe vers eux. **Le critère était
faux** : ces fichiers ne sont pas liés, ils sont *récupérés par du code*.

| Fichier | Qui le récupère | Ligne | Conséquence d'une 301 |
|---|---|---|---|
| `header.html` | `includes.js` → `loadFragment(basePath + 'header.html', …)` | `includes.js:140` | l'en-tête n'est plus injecté |
| `footer.html` | `includes.js` → `loadFragment(basePath + 'footer.html', …)` | `includes.js:146` | le pied de page n'est plus injecté |
| `login.html` | `apps/performances/app.js` → `location.href = '/login.html?next=' + …` | `apps/performances/app.js:415` | la connexion casse, et `?next=` est perdu |

**Nuance importante, mesurée** : le header réellement injecté sur les
**1489 pages** portant `[data-zts-header]` n'est pas celui de la racine mais
`shared/header.html`. `shared/zts.js:198` appelle
`injectPartial('[data-zts-header]', 'header.html')`, et `injectPartial`
(`shared/zts.js:88-96`) construit son URL à partir du `src` de son propre
script — donc `/shared/header.html`. Le seul consommateur de la copie racine
est `includes.js`, qu'**aucune page ne charge aujourd'hui**.

Autrement dit : une 301 sur `/header.html` ne casserait rien *aujourd'hui*.
Elle casserait le jour où `includes.js` reprend du service — et la copie
racine, plus récente (6 juillet, 4 354 o) que `shared/header.html`
(4 juin, 1 563 o), a tout l'air d'être celle qu'on maintient. On ne redirige
pas un fragment vivant pour un gain d'indexation.

`promo.html` reste **volontairement absente** du CSV : elle figure au sitemap
et porte son propre canonique. Page vivante, pas orphelin.

## Pour les fragments : `X-Robots-Tag`, jamais une meta, jamais une 301

`header.html`, `footer.html` et `login.html` doivent continuer à répondre 200.
Ce qu'il faut, c'est qu'ils sortent de l'index — donc un en-tête HTTP, posé par
Cloudflare, qui ne touche pas au corps de la réponse.

**Rules → Transform Rules → Modify Response Header** :

- **Nom** : `noindex fragments et pages techniques`
- **Si** — expression personnalisée :

```
(http.request.uri.path in {"/header.html" "/footer.html" "/login.html"
                           "/shared/header.html" "/shared/footer.html"})
```

- **Alors** : *Set static* — nom `X-Robots-Tag`, valeur `noindex`

**Et surtout pas de `<meta name="robots" content="noindex">` dans
`header.html`.** Le fragment est injecté dans le DOM des 1489 pages ; Google
indexe le DOM rendu ; la balise désindexerait le site entier. C'est le piège
que cette règle contourne.

## Deux réglages à cocher dans la règle

1. **Correspondance des sous-chemins** sur les cinq pages sportives : les
   anciennes polices et images (`/apps-nhl/fonts/…`) doivent suivre. Sans
   cela, seule la page racine redirige.
2. **Conserver la chaîne de requête** : non. Les paramètres des anciennes apps
   n'ont aucun sens sur l'accueil.

## Ce qui n'est PAS dans le CSV, et pourquoi

**Les huit sous-domaines périmés de l'audit du 3 juillet redirigent déjà** —
re-vérifié le 9 août : `educatifs`, `evaluation`, `grille`, `musique`, `tni`,
`sae`, `suppleance`, `agenda` répondent tous 301 vers `/apps/<nom>/`. Seuls
`agenda` et `ia` traînent le défaut de barre oblique, corrigé ci-dessus.

⚠ **L'audit du 8 août se trompait sur deux points**, mesurés le 9 août :
`grille.` redirige bien (301, un seul saut) et la carte `/apps-fifa/` de
l'accueil est partie depuis le 4 août (`9c64b0a`). Restaient trois vrais
trous — `generateur.`, `gym.`, `jeux.` — traités ci-dessous.

**Les vieilles URLs Wix `/en/…`** répondent 404 aujourd'hui. Une ligne
`https://zonetotalsport.ca/en/` → `https://zonetotalsport.ca/`, avec
correspondance des sous-chemins, les rattraperait si les impressions GSC le
justifient encore. Non incluse faute de mesure.

---

## Détail : les cinq pages sportives

**Créé le 27 juillet 2026.** À faire par Joey dans le tableau de bord Cloudflare,
zone `zonetotalsport.ca` → **Rules → Redirect Rules**.

## Pourquoi

Cinq pages ont été retirées du site le 27 juillet 2026 :

| URL retirée | Ce qui la remplace |
|---|---|
| `/apps-nhl/` | section « Matchs du jour », bas de l'accueil |
| `/apps-nba/` | idem |
| `/apps-fifa/` | idem |
| `/apps/nhl-playoffs/` | idem |
| `/apps/nba-playoffs/` | idem |

Le dépôt est servi par **GitHub Pages**, qui ne sait pas répondre `301`. Chaque
URL garde donc une page-relais : `<meta http-equiv="refresh" content="0">` plus
un `<link rel="canonical">` vers l'accueil. Google traite ce couple comme une
redirection permanente, mais c'est un pis-aller : le navigateur charge une page
avant de repartir, et la redirection n'existe pas pour les robots qui ignorent
le HTML.

## La règle à créer

Une seule règle suffit pour les cinq.

- **Nom** : `301 pages sportives retirées`
- **Si** — expression personnalisée :

```
(http.request.uri.path in {"/apps-nhl/" "/apps-nba/" "/apps-fifa/" "/apps/nhl-playoffs/" "/apps/nba-playoffs/"})
or (starts_with(http.request.uri.path, "/apps-nhl/"))
or (starts_with(http.request.uri.path, "/apps-nba/"))
or (starts_with(http.request.uri.path, "/apps-fifa/"))
or (starts_with(http.request.uri.path, "/apps/nhl-playoffs/"))
or (starts_with(http.request.uri.path, "/apps/nba-playoffs/"))
```

- **Alors** : URL de destination statique `https://zonetotalsport.ca/`
- **Code** : `301` — permanent
- **Conserver la chaîne de requête** : non

Les `starts_with` couvrent les anciennes ressources (polices, images) que des
pages tierces pourraient encore appeler.

## Une fois la règle en ligne

1. Vérifier : `curl -sI https://zonetotalsport.ca/apps-nhl/ | head -3` doit
   renvoyer `HTTP/2 301` et un `location: https://zonetotalsport.ca/`.
2. Les cinq `index.html` de relais peuvent alors être supprimés du dépôt — la
   règle Cloudflare s'applique avant que la requête n'atteigne GitHub Pages.
   Tant que la règle n'est pas posée, **les garder** : sans elles, ce sont cinq
   404, ce que la règle d'or n°3 interdit.
3. Search Console : les deux URLs `/apps/nhl-playoffs/` et `/apps/nba-playoffs/`
   ont quitté le sitemap (87 → 85 URLs). `/apps-nhl/` et `/apps-nba/` n'y ont
   jamais figuré, mais elles étaient indexées (`index, follow`) — leur
   désindexation prendra quelques semaines.

---

## Détail : les trois sous-domaines qui servaient l'app complète

**Créé le 9 août 2026.** Mesuré le même jour, sans mur d'aucune sorte :

| Sous-domaine | Avant | Ce qu'il servait |
|---|---|---|
| `generateur.` | **200** | l'app Générateur IA en entier |
| `gym.` | **200** | « Gestion et Transition dans le Gymnase » en entier |
| `jeux.` | **200** | la SPA des 1439 jeux en entier |

Huit autres sous-domaines (`sae`, `educatifs`, `musique`, `suppleance`,
`evaluation`, `tni`, `grille`, `agenda`) répondaient déjà 301. Ces trois-là
étaient les derniers à servir une copie parallèle du site : deux URL pour un
même contenu, donc du contenu dupliqué pour Google et deux versions à
maintenir.

### Les cibles, et pourquoi `gym.` ne va pas vers `/apps/gym/`

`/apps/gym/` **n'existe pas** — vérifié, 404. L'app du gymnase vit sous
`/apps/transitions/`, et ce n'est pas une copie : c'est la **version
suivante**. Comparaison des deux DOM, 9 août 2026 :

| `gym.` — 5 onglets | `/apps/transitions/` |
|---|---|
| SIGNAUX — 8 cartes | Signaux Visuels — **14** cartes |
| CHRONO | Chrono Transition |
| ZONES | Zones Matériel |
| STAFF | Capitaines de Transition |
| GUIDE | 📖 Comment utiliser |
| Plan du Gymnase | Plan du Gymnase |
| — | **Trame Sonore** (absente de `gym.`) |

Mêmes fichiers audio de part et d'autre (`assis.mp3`, `cocus.mp3`,
`gameon.mp3`, `ranger.mp3`, ambiance gymnase). **Aucune fonction n'est perdue
à la redirection** — c'est ce qui autorise la 301 plutôt qu'une republication
de `gym.` sous `/apps/gym/`.

| Source | Destination | Code |
|---|---|---|
| `generateur.zonetotalsport.ca/` | `zonetotalsport.ca/apps/generateur/` | 301 |
| `gym.zonetotalsport.ca/` | `zonetotalsport.ca/apps/transitions/` | 301 |
| `jeux.zonetotalsport.ca/` | `zonetotalsport.ca/apps/jeux/` | 301 |

### Deux réglages, différents de ceux des pages sportives

1. **Correspondance des sous-chemins : oui.** Les arborescences se
   correspondent — `jeux./app.js` et `/apps/jeux/app.js` répondent 200 tous
   les deux, `gym./index.html` et `/apps/transitions/index.html` aussi. Sans
   ce réglage, tout lien profond retombe à la racine de l'app.
2. **Conserver la chaîne de requête : oui.** C'est l'inverse du choix fait
   pour les cinq pages sportives, et c'est voulu : `?lang=en`, `?lang=es`,
   `?lang=zh` figurent au `sitemap.xml` pour `jeux.`, et `shared/zts-menu.js`
   documente déjà (ligne 21) que les 301 existantes **jettent la query
   string** — `?cycle=2` s'y perd. Ne pas répéter le défaut sur les trois
   nouvelles.

### Les cartes du hub ÉP, corrigées en même temps

`ep.html` portait trois cartes vers les sous-domaines. Elles pointent
maintenant vers le domaine principal :

| Carte | Avant | Après |
|---|---|---|
| 🤖 Générateur SAÉ IA | `generateur.zonetotalsport.ca` | `/apps/generateur/` |
| 🎮 Banque de jeux | `jeux.zonetotalsport.ca` | `/apps/jeux/` |
| 🤸 App Gym | `gym.zonetotalsport.ca` | **carte retirée** |

La carte 🤸 « App Gym » **part** : une fois repointée, elle menait au même
`/apps/transitions/` que la carte 🧰 « Boîte à outils » déjà présente deux
lignes plus haut — deux cartes, une seule destination. C'est la carte 🧰 qui
reste, elle porte le titre réel de l'app, et sa description reprend les six
outils (règle d'or n°2, vocabulaire unifié). Pour revenir en arrière : garder
🤸 et retirer 🧰, une ligne dans chaque cas.

### Ce qui reste à faire après la pose — pas dans ce lot

- **`sitemap.xml`** déclare encore `generateur.`, `gym.` et `jeux.` en `<loc>`
  (lignes 123, 153, 159), plus les alternates `hreflang` de `jeux.`. Une fois
  la règle en ligne, ce sont des `<loc>` qui redirigent — avertissement GSC.
  Le même défaut existe déjà pour les huit sous-domaines redirigés depuis
  juillet : à traiter d'un coup, pas à la pièce.
- **~1400 fiches de jeux** (`jeux/*.html`, ligne 35 de chacune) et
  `shared/footer.html:45`, `service-de-garde.html:101`, `daily.js:655`,
  `sports-news.html:458,638` pointent encore vers `jeux.zonetotalsport.ca`.
  Elles continuent de fonctionner — un saut de plus, c'est tout. Le
  générateur `scripts/gen-jeux-fiches.js:176` doit être corrigé **avant** la
  prochaine régénération, sinon le lot repart avec l'ancienne URL.

---

# Les trois règles à saisir dans le tableau de bord

## a) Transform Rule — `X-Robots-Tag: noindex`

**Rules → Transform Rules → Modify Response Header → Create rule**

- **Nom** : `noindex fragments recuperes au runtime`
- **Si** — *Custom filter expression*, mode Edit expression :

```
(http.request.uri.path in {"/header.html" "/footer.html" "/login.html" "/shared/header.html" "/shared/footer.html"})
```

- **Alors** — *Set static* :
  - Header name : `X-Robots-Tag`
  - Value : `noindex`

Les cinq chemins continuent de répondre 200. Aucune modification du corps de
la réponse, donc rien n'est injecté dans le DOM des 1489 pages.

## b) Cache Rule — HTML hors cache, assets en cache

**Caching → Cache Rules → Create rule**

Deux règles, dans cet ordre. L'ordre compte : Cloudflare applique la première
qui correspond.

**Règle 1 — `HTML toujours frais`** (à placer en premier)

- **Si** :

```
(http.request.uri.path matches "\\.html$") or (http.request.uri.path matches "/$") or (http.request.uri.path eq "/")
```

- **Alors** :
  - Cache eligibility : **Bypass cache**

**Règle 2 — `Assets en cache`**

- **Si** :

```
(http.request.uri.path matches "\\.(css|js|png|jpg|jpeg|webp|svg|woff2?|ttf|mp3|json)$")
```

- **Alors** :
  - Cache eligibility : **Eligible for cache**
  - Edge TTL : *Ignore cache-control header and use this TTL* → **1 mois**
  - Browser TTL : *Respect origin* (GitHub Pages envoie `max-age=600`)

**Le piège que ça règle, et celui que ça laisse.** `index-BqzDoR3c.js` porte son
empreinte dans son nom : un nouveau build produit un nouveau nom, le cache ne
peut pas servir l'ancien. **`assets/ztsh-shell.css` n'a pas d'empreinte.** Avec
un Edge TTL d'un mois, une correction du shell pourrait mettre un mois à
apparaître. Deux façons de vivre avec :

- purger `assets/ztsh-shell.css` et `.js` à la main après chaque déploiement du
  shell (Caching → Configuration → Purge by URL) ;
- ou, mieux, leur donner une empreinte au nom le jour où le chantier se
  stabilise. Tant que le shell bouge toutes les semaines, la purge manuelle
  suffit — c'est deux URLs.

## c) Vérifications après coup — bloc copiable

```bash
# 1. Les 12 redirections repondent 301 vers la bonne cible
for u in apps-nhl apps-nba apps-fifa apps/nhl-playoffs apps/nba-playoffs index-old.html teasing.html; do
  printf "%-24s %s -> %s\n" "$u" \
    "$(curl -s -o /dev/null -w '%{http_code}' "https://zonetotalsport.ca/$u")" \
    "$(curl -s -o /dev/null -w '%{redirect_url}' "https://zonetotalsport.ca/$u")"
done
for s in agenda ia generateur gym jeux; do
  printf "%-24s %s -> %s\n" "$s." \
    "$(curl -s -o /dev/null -w '%{http_code}' "https://$s.zonetotalsport.ca/")" \
    "$(curl -s -o /dev/null -w '%{redirect_url}' "https://$s.zonetotalsport.ca/")"
done

# 1bis. Aucun sous-domaine ne sert plus une app en 200
for s in sae educatifs musique suppleance evaluation tni grille agenda ia generateur gym jeux; do
  c=$(curl -s -o /dev/null -w '%{http_code}' "https://$s.zonetotalsport.ca/")
  [ "$c" = "301" ] || [ "$c" = "302" ] && printf "%-12s %s ok\n" "$s." "$c" || printf "%-12s %s ALERTE : sert encore l app\n" "$s." "$c"
done

# 2. Un seul saut, jamais deux
for s in agenda ia generateur gym jeux; do
  curl -s -o /dev/null -w "$s : %{num_redirects} saut(s) -> %{url_effective}\n" -L "https://$s.zonetotalsport.ca/"
done

# 2bis. La query string survit sur les trois nouvelles
curl -s -o /dev/null -w 'jeux ?lang=en -> %{redirect_url}\n' "https://jeux.zonetotalsport.ca/?lang=en"

# 3. Les fragments repondent 200 AVEC le noindex, et rien d'autre ne le porte
for u in header.html footer.html login.html shared/header.html shared/footer.html; do
  printf "%-24s %s  %s\n" "/$u" \
    "$(curl -s -o /dev/null -w '%{http_code}' "https://zonetotalsport.ca/$u")" \
    "$(curl -sI "https://zonetotalsport.ca/$u" | grep -i x-robots-tag || echo 'PAS DE X-ROBOTS-TAG')"
done
curl -sI https://zonetotalsport.ca/ | grep -i x-robots-tag && echo 'ALERTE : la home porte le noindex' || echo 'home : pas de noindex, correct'

# 4. Le HTML n'est pas mis en cache, les assets le sont
curl -sI https://zonetotalsport.ca/ | grep -iE 'cf-cache-status|cache-control'
curl -sI https://zonetotalsport.ca/assets/ztsh-shell.css | grep -iE 'cf-cache-status|cache-control'

# 5. Aucune page vivante n'est partie a la redirection
for u in "" promo.html blog.html apps/jeux/ apps/sae/ apps/musique/ apps/suppleance/ apps/plan-b-meteo/; do
  printf "%-24s %s\n" "/$u" "$(curl -s -o /dev/null -w '%{http_code}' "https://zonetotalsport.ca/$u")"
done
```

Le point 5 est celui qu'on oublie : une expression trop large dans une Bulk
Redirect avale des pages vivantes. Il doit afficher **200 partout**.
