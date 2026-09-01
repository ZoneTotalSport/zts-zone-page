# RAPPORT DE MÉTRIQUES — post-lockage

**Date de lecture** : 28 août 2026, 15 h 30 EDT
**Fenêtre étudiée** : 17 → 28 août 2026 inclus (12 jours)
**Mode** : LECTURE SEULE. Aucune écriture Firestore, aucun déploiement, aucun commit de code.
**Sources** : SDK Admin Firebase (`conversionFunnel`, `anonGenCount`, `leads`, `analyticsDaily`,
`article_views`), Firebase Auth (354 comptes paginés), dépôt `zts-zone-page`.
**Fuseau** : toutes les dates sont en EDT (UTC−4), heure du Québec.

> ## 📌 ADDENDA DU 28 AOÛT, SOIRÉE — lire avant de citer un chiffre
>
> Le corps du rapport est conservé tel quel : il dit ce qui a été mesuré le
> 28 août au matin. Cet addenda dit ce qui l'a vérifié, et ce qui l'a dépassé.
> **En cas de désaccord, l'addenda fait foi.** Il est écrit au moment de la PR
> `fix/attribution-funnel`, dont il documente les prérequis de mesure.
>
> | Point | Statut |
> |---|---|
> | Le « 15/17 » du §2.3 | **CONFIRMÉ** — la requête n'avait aucun filtre sur `path`. Détail au §7.1 |
> | Méthode de comptage | **FIGÉE** au §7.2, à reprendre telle quelle fin septembre |
> | Répartition par `signup_source` | **NON COMPARABLE** avant / après le 1er septembre — §7.3 |
> | Les deux propriétés GA4 du §4.1 | **TRANCHÉ** — `G-C2L5PD388L` fait foi. §7.4 |
> | Prérequis GA4 / Search Console | **ÉNUMÉRÉS** au §7.5, action Joey |
> | Hypothèse du `path` d'app (LOT 4) | **RÉFUTÉE PAR LA DONNÉE** — §7.6 |
> | 3 documents parasites de plus | **CRÉÉS PAR MES PROPRES TESTS** le 28 août au soir — §7.7 |


> ⚠️ **Portée et état de connexion** — exigence de la discipline de recette ZTS.
> Aucun chiffre de ce rapport ne vient du Worker `zts-jeux-data` ni d'un
> navigateur : tout vient du SDK Admin, qui contourne les règles Firestore et
> lit la donnée **entière**, indépendamment de tout état de connexion. Le mur
> ne transforme rien ici. Les seuls chiffres affectés par une portée sont ceux
> du volet 4, signalés à leur place.

---

## RÉSUMÉ EN UNE PAGE

| Question | Réponse mesurée |
|---|---|
| Le lockage a-t-il cassé la conversion ? | **Non.** click→signup passe de **36,4 % à 57,7 %** |
| Le taux view→click a-t-il chuté (8,7 % → 3,5 %) ? | **Artefact.** Le dénominateur a changé de nature — voir §1.3 |
| Combien de nouveaux comptes ? | **17** en 12 jours (**9,9/semaine**), contre 1,8/semaine avant |
| Le tracking capte-t-il tout ? | **Non — 15/17.** Deux comptes réels sans `signup_complete` |
| **Les nouveaux reviennent-ils ?** | **1 sur 17 (6 %) est revenu après 72 h.** 3/17 (18 %) après 24 h |
| Les anciens sont-ils revenus ? | **6/33 organiques (18 %).** Import Wix : **2/304 (1 %)** |
| Le pic est-il la rentrée ? | **Oui, en partie** — et une part du 26 août est robotique (§4.3) |
| `share_click` | **2**, les deux le 21 août à 1 min d'écart = la recette. **0 usage réel** |
| `genia_click` | **0** sur toute l'histoire de la collection |
| Provenance GA4 / Search Console | **Non mesurable** — les deux API sont désactivées sur le projet GCP |

---

# VOLET 1 — LE TUNNEL, 17-28 AOÛT

## 1.1 Chiffres bruts

Collection `conversionFunnel` : **2230 documents** au total, du 18 mai au 28 août.
**1 document parasite exclu** : `signup_complete` du 21 août 08 h 43, `path:"/blog.html"`,
`uid:null` — le faux signup écrit par le test de l'invariant du tunnel (LOT2-PRESCAN §6).

### Événements par jour (fenêtre)

| Jour | `locked_view` | `locked_click_signup` | `locked_click_login` | `locked_close` | `signup_complete` |
|---|---:|---:|---:|---:|---:|
| 17 août | 19 | 1 | 1 | 2 | 0 |
| 18 août | 17 | 1 | 0 | 1 | 0 |
| 19 août | 24 | 1 | 0 | 0 | 1 |
| 20 août | 21 | 2 | 0 | 0 | 2 |
| 21 août | 46 | 2 | 0 | 1 | 1 *(+1 parasite exclu)* |
| 22 août | 22 | 3 | 0 | 0 | 1 |
| 23 août | 48 | 1 | 0 | 0 | 2 |
| 24 août | 86 | 2 | 0 | 0 | 2 |
| 25 août | 161 | 3 | 1 | 1 | 1 |
| 26 août | 234 | 6 | 0 | 0 | 5 |
| 27 août | 45 | 4 | 1 | 2 | 1 |
| 28 août *(partiel)* | 25 | 0 | 0 | 1 | 0 |
| **TOTAL** | **748** | **26** | **3** | **8** | **15** |

### Les trois nombres, et la baseline

| Mesure | **17-28 août** (12 j) | **Baseline 30 j au 16 août** | **5-16 août** (12 j, même durée) |
|---|---:|---:|---:|
| `locked_view` | 748 (62,3/j) | 126 (4,2/j) | 65 (5,4/j) |
| `locked_click_signup` | 26 | 11 | 10 |
| `signup_complete` | 15 | 4 | 3 |
| **view → click** | **3,5 %** | **8,7 %** | 15,4 % |
| **click → signup** | **57,7 %** | **36,4 %** | 30,0 % |
| **view → signup** | **2,0 %** | 3,2 % | 4,6 % |
| **inscriptions / semaine** | **8,8** | 0,9 | 1,8 |

> La baseline du brief (8,9 % / 36,4 %) est retrouvée à la fenêtre **30 jours au 16 août** :
> V=126, C=11, S=4 → **8,7 %** et **36,4 %**. L'écart de 0,2 pt sur le premier taux vient
> d'une borne de fuseau. Le second est identique au dixième. La baseline est confirmée.

## 1.2 Ventilation par `source`

| `source` | `layer` | vues | clics | v→c |
|---|---|---:|---:|---:|
| `menu` | `cadenas` | 277 | **0 — impossible par conception** | — |
| `resource` | `fullscreen` | 160 | *(voir ci-dessous)* | — |
| `article` | *(aucun)* | 103 | 0 | 0 % |
| `jeu` | *(aucun)* | 89 | 6 | 6,7 % |
| `app` | `gate` | 69 | 1 | 1,4 % |
| `hub` | *(aucun)* | 35 | 1 | 2,9 % |
| `jeux` | `fullscreen` | 9 | — | — |
| `sae` | `fullscreen` | 6 | — | — |
| `fullscreen` | — | **0** | **18** | — |

**Cette table ne se lit pas ligne par ligne, et c'est le point le plus important du rapport.**
Le mur plein écran émet sa **vue** sous la source de la page (`resource`, `jeux`, `sae`) avec
`layer:'fullscreen'`, mais son **clic** sous `source:'fullscreen'`
(`zts-locked-fullscreen.js:224` contre `:191`). Vue et clic sont donc dans deux lignes
différentes. Recomposé par surface réelle :

| Surface | vues | clics | v→c | baseline 30 j |
|---|---:|---:|---:|---:|
| **Mur plein écran** (`layer:fullscreen`) | 176 | 18 | **10,2 %** | 73 → 10 = **13,7 %** |
| **Mur en page** (article, jeu, hub) | 226 | 7 | **3,1 %** | 48 → 1 = 2,1 % |
| **Gate d'app** (`layer:gate`, Rencontres) | 69 | 1 | **1,4 %** | n'existait pas |
| **Cadenas du menu** (`layer:cadenas`) | 277 | **0** | **n/a** | 5 → 0 |
| **TOTAL** | **748** | **26** | 3,5 % | 126 → 11 = 8,7 % |

## 1.3 Pourquoi 8,7 % → 3,5 % ne veut rien dire

Trois raisons cumulées, toutes vérifiées dans le code :

1. **`zts-cadenas.js` émet `locked_view {source:'menu'}` une fois par session et
   n'émet aucun `locked_click_signup` — délibérément** (commentaire explicite,
   `zts-cadenas.js:26`). Ces **277 vues** sont un compteur de sessions déguisé en vue de mur.
   Elles ne peuvent, par construction, jamais produire un clic. Elles pèsent **37 % du
   dénominateur** de la fenêtre, contre 4 % dans la baseline.
2. **Le LOT 1 a instrumenté quatre surfaces neuves** — `menu`, `app`, `jeu`, `jeux`, `sae`
   n'existaient pas comme émetteurs avant août. Le dénominateur ne mesure plus la même chose.
3. **Le trafic a monté** (§4.2), donc les vues montent plus vite que les clics même à
   qualité constante.

**Hors cadenas du menu**, la comparaison redevient honnête :
**471 vues → 26 clics = 5,5 %** contre **121 → 11 = 9,1 %** en baseline.
Le mur plein écran seul : **10,2 % contre 13,7 %**. Un tassement réel mais modeste, sur des
effectifs (10 et 18 clics) où l'intervalle de confiance couvre l'écart entier.

## 1.4 Les autres événements de la fenêtre

| Événement | 17-28 août | 5-16 août | Tout avant le 17 |
|---|---:|---:|---:|
| `share_click` | **2** | 0 | 0 |
| `genia_click` | **0** | 0 | **0** |
| `newsletter_view` | 171 | 72 | 270 |
| `newsletter_submit` | 3 (**1,8 %** des vues) | 1 | 3 |
| `newsletter_complete` | 3 | 1 | 3 |
| `newsletter_to_signup` | 1 | 0 | 1 |
| `newsletter_close` | 61 | 33 | 133 |
| `newsletter_open_gift` | 3 | 0 | 0 |

**`share_click` — les deux clics sont la recette, pas des visiteurs.**
21 août 09 h 21 et 09 h 22, `source:'footer'`, `path:'/ep.html'` : deux clics à une minute
d'écart sur la même page, le matin de la fusion de la vague C. **Usage réel : zéro.**

**`genia_click` — zéro sur toute l'histoire de la collection**, alors que trois émetteurs
existent en code (`zts-lock-page.js:259`, `zts-locked-fullscreen.js:244`, `zts-genia.js:85`).
Deux lectures possibles, **non départagées ici** : personne ne clique, ou le code n'atteint
pas la production. Départager demande une recette **connectée** en navigateur — hors périmètre
de cette lecture. Ne pas conclure avant.

**`leads`** : 9 documents au total, dont **4 en `@zonetotalsport.invalid`** — les documents de
test du LOT 0 (ménage D1) **sont toujours là**. Leads réels dans la fenêtre : **3**
(outlook.com le 22, gmail.com le 24, live.be le 27).

## VERDICT — VOLET 1

> **Le lockage n'a pas cassé la conversion : il l'a améliorée.** Le seul taux comparable
> d'un bout à l'autre — **click→signup, 36,4 % → 57,7 %** — monte de 21 points. Les gens
> qui cliquent « créer un compte » vont maintenant au bout six fois sur dix.
>
> **Le taux view→click de 3,5 % est un faux signal.** 37 % du dénominateur est un compteur
> de sessions (`menu`) incapable d'émettre un clic. Hors ce bruit : 5,5 % contre 9,1 %.
> Le mur plein écran, seule surface mesurée avant *et* après à l'identique, passe de
> 13,7 % à 10,2 % — un tassement dans le bruit statistique de 10 et 18 clics.
>
> **Le volume, lui, a été multiplié par 5** : 8,8 inscriptions/semaine contre 0,9 dans la
> baseline de 30 jours. C'est le vrai changement, et il est massif.
>
> **`share_click` et `genia_click` sont morts-nés** : 2 clics de recette et 0 clic. Deux
> fonctionnalités livrées au LOT 2 qui, à ce jour, ne produisent **aucune** donnée.

---

# VOLET 2 — LES NOUVEAUX COMPTES

## 2.1 Chiffres bruts

**354 comptes** dans Firebase Auth au 28 août, 15 h 30.

| Cohorte | n |
|---|---:|
| Import Wix du **28 mars 2026** | **304** *(le brief en annonçait 305)* |
| Organiques créés **avant** le 17 août | 33 |
| Organiques créés **depuis** le 17 août | **17** |
| Comptes `@zonetotalsport.invalid` | **0** |
| Comptes désactivés | 0 |

> **Écart signalé** : je compte **304** comptes datés du 28 mars, pas 305. Providers de
> l'import : 295 `password`, 9 `google.com`. Aucun compte n'est daté du 27 ou du 29 mars,
> donc l'écart n'est pas un effet de fuseau. Soit un compte a été supprimé depuis, soit le
> 305 comptait un compte hors import. Sans impact sur la suite : la cohorte étudiée est
> définie par exclusion de cette date.

**Le cumul au 16 août donne exactement 337 comptes** — le chiffre du brief est confirmé au
compte près.

## 2.2 Répartition par jour et par provider

| Jour | comptes | `password` | `google.com` |
|---|---:|---:|---:|
| 17 août | 0 | — | — |
| 18 août | 0 | — | — |
| 19 août | 1 | 1 | 0 |
| 20 août | 2 | 1 | 1 |
| 21 août | 0 | — | — |
| 22 août | 1 | 1 | 0 |
| 23 août | 2 | 1 | 1 |
| 24 août | 2 | 0 | 2 |
| 25 août | 1 | 0 | 1 |
| **26 août** | **6** | 4 | 2 |
| 27 août | 2 | 1 | 1 |
| 28 août *(partiel)* | 0 | — | — |
| **TOTAL** | **17** | **9 (53 %)** | **8 (47 %)** |

Le partage password/Google est presque parfait. Sur les 33 organiques d'avant :
22 `password`, 9 `google.com`, 2 sans provider. **Google gagne du terrain** — 47 % contre
27 % avant, ce qui est cohérent avec le chemin Google raccourci de la vague A.

## 2.3 Le tracking capte-t-il tous les comptes ?

Appariement compte Auth ↔ `signup_complete` à ±10 minutes :

| Compte Auth créé | provider | `signup_complete` | `uid` tracé | `signup_source` |
|---|---|---|---|---|
| 19 août 09 h 31 | password | ✔ 09 h 31 | non | `direct` |
| 20 août 09 h 32 | password | ✔ 09 h 32 | **oui** | `popup` |
| 20 août 09 h 42 | google | ✔ 09 h 42 | non | `popup` |
| 22 août 15 h 11 | password | ✔ 15 h 11 | non | `popup` |
| 23 août 17 h 21 | password | ✔ 17 h 21 | non | `newsletter_popup` |
| 23 août 22 h 05 | google | ✔ 22 h 05 | non | `popup` |
| 24 août 13 h 54 | google | ✔ 13 h 54 | non | `popup` |
| 24 août 14 h 59 | google | ✔ 14 h 59 | **oui** | `popup` |
| 25 août 12 h 42 | google | ✔ 12 h 42 | **oui** | `popup` |
| 26 août 02 h 43 | password | ✔ 02 h 43 | **oui** | `direct` |
| 26 août 02 h 48 | google | ✔ 02 h 48 | non | `popup` |
| 26 août 11 h 51 | password | ✔ 11 h 51 | non | `popup` |
| 26 août 12 h 52 | password | ✔ 12 h 52 | non | `direct` |
| **26 août 18 h 01** | password | **✘ AUCUN** | — | — |
| 26 août 22 h 14 | google | ✔ 22 h 14 | **oui** | `popup` |
| **27 août 04 h 57** | google | **✘ AUCUN** | — | — |
| 27 août 11 h 23 | password | ✔ 11 h 23 | **oui** | `popup` |

- **15 comptes sur 17 sont tracés = 88 %.** Deux trous.
- **Aucun `signup_complete` orphelin** : le tracking ne sur-compte jamais. La garde
  `isNewUser` (`firebase-auth.js:575`) tient. Le proxy est fiable **dans le sens qui compte** :
  un `signup_complete` = une vraie inscription.
- **Le trou du 27 août 04 h 57 est le plus coûteux.** Deux minutes avant, à 04 h 55, il y a
  un `locked_click_signup` `source:'jeu'`, `slug:'le-mouton-perdu'`. C'est **la seule
  inscription de la fenêtre attribuable à une fiche de jeu** — 1440 pages SEO, le principal
  actif de trafic organique du site — et c'est justement celle que le tracking a ratée.
- `signup_source` : `popup` 11, `direct` 3, `newsletter_popup` 1.
- **`uid` n'est renseigné que dans 6 des 15 documents** (aucun avant le 20 août). Le champ
  a été câblé en cours de route. **Toute analyse de cohorte par `uid` sur Firestore seul est
  donc impossible sur cette fenêtre** — c'est Auth qui fait foi, et c'est ce qui est fait ici.

## VERDICT — VOLET 2

> **17 comptes en 12 jours, soit 9,9/semaine.** Le rythme de la baseline était de
> 0,9/semaine sur 30 jours et 1,8/semaine sur les 12 jours précédant le lockage.
> **Le lockage a multiplié le rythme d'inscription par 5 à 11 selon la référence.**
>
> **Le tracking a un trou de 12 %** (2 comptes sur 17), et il ne sur-compte jamais.
> Un chiffre Firestore de `signup_complete` est donc un **plancher**, pas une mesure.
>
> **La moitié des inscriptions passe par Google** (47 %), contre 27 % chez les organiques
> antérieurs. Le raccourci Google de la vague A porte.
>
> ⚠️ Les 4 documents `leads` en `@zonetotalsport.invalid` du LOT 0 **n'ont toujours pas été
> supprimés** (tâche D1). Aucun impact sur les comptes Auth — Auth en est propre — mais ils
> polluent toute lecture future de `leads`.

---

# VOLET 3 — LE RETOUR

**C'est le volet qui décide si le reste vaut quelque chose.**

## 3.1 La lecture demandée : `lastLoginAt` contre `createdAt`

| Compte créé | dernière connexion | écart | provider |
|---|---|---:|---|
| 19 août 09 h 31 | 19 août 09 h 31 | 0,0 h | password |
| 20 août 09 h 32 | 20 août 09 h 32 | 0,0 h | password |
| 20 août 09 h 42 | 20 août 09 h 42 | 0,0 h | google |
| 22 août 15 h 11 | 22 août 15 h 11 | 0,0 h | password |
| 23 août 17 h 21 | 23 août 17 h 21 | 0,0 h | password |
| 23 août 22 h 05 | 23 août 22 h 05 | 0,0 h | google |
| 24 août 13 h 54 | 24 août 13 h 54 | 0,0 h | google |
| 24 août 14 h 59 | 24 août 14 h 59 | 0,0 h | google |
| 25 août 12 h 42 | 25 août 12 h 42 | 0,0 h | google |
| 26 août 02 h 43 | 26 août 02 h 43 | 0,0 h | password |
| 26 août 02 h 48 | 26 août 02 h 48 | 0,0 h | google |
| 26 août 11 h 51 | 26 août 11 h 51 | 0,0 h | password |
| 26 août 12 h 52 | 26 août 12 h 52 | 0,0 h | password |
| **26 août 18 h 01** | **27 août 12 h 49** | **18,8 h** | password |
| 26 août 22 h 14 | 26 août 22 h 14 | 0,0 h | google |
| 27 août 04 h 57 | 27 août 04 h 57 | 0,0 h | google |
| 27 août 11 h 23 | 27 août 11 h 23 | 0,0 h | password |

**Écart > 24 h : 0 / 17 (0 %). Écart > 72 h : 0 / 17 (0 %).**

Seize comptes sur dix-sept ont `lastLoginAt` **exactement égal** à `createdAt`.

## 3.2 Pourquoi ce zéro est faux — et la mesure qui le corrige

La réserve annoncée dans le brief est réelle, mais elle joue **dans le sens qui rend le zéro
trompeur** : `lastLoginAt` n'avance que sur une **authentification explicite**. Une session
Firebase persiste ; le visiteur qui revient trois jours plus tard est déjà connecté et ne
se réauthentifie **jamais**. Son `lastLoginAt` reste figé à la création, à vie.

Firebase Auth expose un troisième horodatage que le script d'origine n'utilisait pas :
**`lastRefreshTime`** — le dernier renouvellement de jeton d'identité. Il avance à chaque
retour d'une session vivante. **C'est lui le signal de retour.**

La preuve que les deux champs divergent est dans la cohorte ancienne : un compte créé le
20 avril a `lastLoginAt` figé au **20 avril**… et `lastRefreshTime` au **26 août 22 h 36**.
Ce compte est revenu quatre mois plus tard, et `lastLoginAt` ne le dit pas.

| Compte créé | dernier renouvellement | écart | provider |
|---|---|---:|---|
| 19 août 09 h 31 | 19 août 09 h 31 | 0,0 h | password |
| 20 août 09 h 32 | 20 août 11 h 57 | 2,4 h | password |
| 20 août 09 h 42 | 20 août 09 h 42 | 0,0 h | google |
| **22 août 15 h 11** | **27 août 12 h 09** | **117,0 h** | password |
| 23 août 17 h 21 | 23 août 17 h 21 | 0,0 h | password |
| 23 août 22 h 05 | 23 août 22 h 05 | 0,0 h | google |
| 24 août 13 h 54 | 24 août 13 h 54 | 0,0 h | google |
| **24 août 14 h 59** | **27 août 09 h 07** | **66,1 h** | google |
| 25 août 12 h 42 | 25 août 12 h 42 | 0,0 h | google |
| 26 août 02 h 43 | 26 août 02 h 43 | 0,0 h | password |
| 26 août 02 h 48 | 26 août 02 h 48 | 0,0 h | google |
| 26 août 11 h 51 | 26 août 15 h 39 | 3,8 h | password |
| 26 août 12 h 52 | 26 août 12 h 52 | 0,0 h | password |
| **26 août 18 h 01** | **27 août 12 h 49** | **18,8 h** | password |
| 26 août 22 h 14 | 26 août 22 h 14 | 0,0 h | google |
| 27 août 04 h 57 | 27 août 04 h 57 | 0,0 h | google |
| **27 août 11 h 23** | **28 août 14 h 58** | **27,6 h** | password |

**Écart > 24 h : 3 / 17 = 18 %. Écart > 72 h : 1 / 17 = 6 %.**

Les écarts de 2,4 h et 3,8 h ne sont **pas** des retours : Firebase renouvelle le jeton
environ toutes les heures tant qu'un onglet reste ouvert. Le seuil de 24 h les écarte
correctement.

**Correction pour la maturité des comptes** — cinq des dix-sept ont moins de 48 h
d'existence et n'ont pas encore eu l'occasion de revenir. Sur les **9 comptes créés le
25 août ou avant** (donc ≥ 72 h d'ancienneté) :

- **> 24 h : 2 / 9 = 22 %**
- **> 72 h : 1 / 9 = 11 %**

## 3.3 Les anciens : sont-ils revenus depuis le lockage ?

| Cohorte | n | retour (`lastRefreshTime` ≥ 17 août) | reconnexion explicite |
|---|---:|---:|---:|
| Organiques créés avant le 17 août | 33 | **6 (18 %)** | 2 |
| **Import Wix du 28 mars** | **304** | **2 (1 %)** | 2 |
| Tous comptes confondus | 354 | 25 (7 %) | 21 |

Les six revenants organiques :

| créé | revenu (renouvellement) | dernière connexion explicite |
|---|---|---|
| 16 juin | 18 août 03 h 27 | 16 juin |
| 19 avril | 21 août 09 h 32 | **21 août** *(reconnexion réelle)* |
| 2 juillet | 23 août 20 h 17 | 19 juillet |
| 7 juin | 25 août 09 h 19 | 16 juin |
| 20 avril | 26 août 22 h 36 | 20 avril |
| 15 juillet | 28 août 14 h 47 | **26 août** *(reconnexion réelle)* |

## VERDICT — VOLET 3

> **La question du brief était : 9 inscriptions/semaine avec zéro retour, ou avec 40 % de
> retour ? La réponse est : ni l'un ni l'autre. C'est 9,9/semaine avec ~20 % de retour.**
>
> Lu sur `lastLoginAt` seul, le résultat aurait été **0 %** — et c'eût été la mauvaise
> conclusion, prise sur le mauvais champ. Lu sur `lastRefreshTime`, **3 des 17 nouveaux
> comptes (18 %) sont revenus après plus de 24 h, 1 après plus de 72 h.** Ramené aux seuls
> comptes assez vieux pour avoir pu revenir : **22 % à 24 h, 11 % à 72 h.**
>
> **Ce n'est pas zéro, et ce n'est pas 40 %.** C'est un produit qui retient environ un
> inscrit sur cinq à court terme, et environ un sur dix à une semaine. Assez pour que le
> volume vaille la peine d'être poursuivi ; pas assez pour que la rétention soit résolue.
>
> **Le signal le plus dur du rapport est ailleurs : l'import Wix est mort.**
> **2 comptes sur 304 (1 %)** ont donné signe de vie depuis le 17 août. Ces 304 comptes
> forment 86 % de la base et ne valent, en pratique, rien. Les deux chiffres de « preuve
> sociale » du site (340 / 328 codés en dur) reposent sur eux : **ils annoncent une
> communauté dont 86 % est inerte.**
>
> **Réserve, à ne pas escamoter** : `lastRefreshTime` est un **signal fort, pas une preuve**.
> Il peut avancer sans intention — un onglet laissé ouvert, un SDK qui renouvelle en fond.
> Le seuil de 24 h écarte l'essentiel de ce bruit mais pas sa totalité. À l'inverse il ne
> peut pas **sur**-estimer un compte qui n'est jamais revenu : un jeton ne se renouvelle
> pas tout seul dans un navigateur fermé. **Les 3/17 sont donc un plafond crédible, et
> le 0/17 de `lastLoginAt` un plancher faux.** La mesure certaine demanderait un événement
> de session applicatif, qui n'existe pas aujourd'hui.

---

# VOLET 4 — PROVENANCE

## 4.1 GA4 et Search Console : non mesurables en lecture seule

Testé avec le compte de service `firebase-adminsdk-fbsvc@zone-total-sport` :

| API | Résultat |
|---|---|
| Google Analytics Admin API | **403** — API non activée sur le projet GCP `681359040455` |
| Google Search Console API | **403** — API non activée sur le projet GCP `681359040455` |

Rendre ces données lisibles demande **trois écritures de configuration** — activer les deux
API sur le projet Google Cloud, puis ajouter le compte de service comme lecteur dans GA4 et
comme utilisateur délégué dans Search Console. **Toutes trois sortent du mandat de lecture
seule et n'ont pas été faites.** Le volet 4 reste donc ouvert.

> ⚠️ **Découvert au passage : le site porte DEUX propriétés GA4 distinctes.**
> `G-09S9R1HJ94` (Firebase, dans `firebase-auth.js:21`, `shared/zts-gate.js:20`,
> `fiches/zts-fiches-firebase.js:55`) et `G-C2L5PD388L` (`analytics.js:9`). Deux propriétés
> qui reçoivent des sous-ensembles différents des pages. **Avant d'ouvrir GA4, il faut
> savoir laquelle est la bonne** — sinon la première lecture donnera un chiffre faux et
> personne ne le saura. À trancher avant d'activer quoi que ce soit.

## 4.2 Substitut mesuré : `analyticsDaily`

`analyticsDaily` est la seule série de fréquentation du site — un document par jour,
incrémenté par le Worker `notify` à chaque visite, sur toutes les pages via le shell partagé
(`shared/zts.js:19`). **70 jours sans trou**, du 18 juin au 28 août.

| Fenêtre | visites | par jour |
|---|---:|---:|
| **17-28 août** (12 j) | **1061** | **88,4** |
| 5-16 août (12 j) | 815 | 67,9 |
| Juillet (30 j) | 2170 | 72,3 |

**+30 % de trafic** dans la fenêtre post-lockage contre les 12 jours précédents.

Détail des cinq derniers jours, qui portent le pic :

| Jour | visites | vues murées | comptes créés |
|---|---:|---:|---:|
| 24 août | 62 | 86 | 2 |
| 25 août | 163 | 161 | 1 |
| **26 août** | **347** | **234** | **6** |
| 27 août | 131 | 45 | 2 |
| 28 août *(partiel)* | 52 | 25 | 0 |

**`analyticsDaily` ne porte aucune dimension de provenance.** Il ne peut pas répondre
« organique, direct ou social » — seulement « combien ».

## 4.3 Une part du pic du 26 août est robotique

Le pic ne se lit pas au comptant. Deux traces concordantes :

- **26 août, 13 h 57 → 14 h 08** : **87 vues murées en 12 minutes**, dont quatre minutes
  consécutives à exactement 10 vues (14 h 02, 03, 04, 05). Une cadence plate et régulière.
- **Sur les 33 documents `article_views`, 21 ont leur dernière vue entre 13 h 59 et 14 h 05
  le même jour** — un balayage séquentiel de presque tout le blogue en six minutes.

C'est la signature d'un **crawler**, pas d'un lecteur. Sans les journaux serveur (Cloudflare)
on ne peut ni l'identifier ni le soustraire proprement, mais **une part notable des 347
visites du 26 août n'est pas humaine**. Les 6 comptes créés ce jour-là, eux, sont réels —
ils sont dans Auth.

## 4.4 `anonGenCount` : le proxy de trafic est mort

La collection ne contient **qu'un seul document** : l'empreinte `3c09bbbd68c9…`, `count:1`,
`firstSeen` = `lastSeen` = **21 août 11 h 41** — exactement le document parasite que le brief
demandait d'exclure.

**Après exclusion : zéro visiteur anonyme du générateur enregistré, sur toute l'histoire de
la collection.** Le « excellent proxy du trafic réel » du diagnostic de juillet ne mesure
plus rien. Cohérent avec un mur désormais posé sur `/apps/generateur/` — la fenêtre contient
un `locked_click_signup` `source:'fullscreen'` sur cette page le 24 août. **À rapprocher de
la décision de la vague D**, qui voulait justement que le générateur reste utilisable sans
compte (`data-zts-cad="non"`). Le compteur anonyme et le mur ne racontent pas la même
histoire ; **ce point mérite une vérification connectée à part.**

## VERDICT — VOLET 4

> **La provenance reste inconnue.** GA4 et Search Console sont hors d'atteinte sans trois
> modifications de configuration exclues du mandat. Le rapport ne peut ni confirmer ni
> infirmer que la rentrée explique le volume **par le canal**.
>
> **Ce que le trafic dit quand même : +30 %** (88,4 visites/jour contre 67,9), avec un pic
> net les 25-26-27 août — **et 6 des 17 inscriptions de la fenêtre le seul 26 août**, soit
> 35 % du total en un jour. La forme est celle d'une rentrée. Elle **n'est pas prouvée**
> par une source de trafic, seulement par la date et la courbe.
>
> ⚠️ **Le pic du 26 est partiellement robotique** : 87 vues murées en 12 minutes et
> 21 articles balayés en 6 minutes. Ne pas citer les 347 visites du 26 août comme un
> chiffre d'audience.

---

# CE QUE JE FERAIS ENSUITE

Rien de tout ceci n'a été fait — le mandat était en lecture seule.

1. **Trancher entre les deux propriétés GA4** (§4.1) avant d'activer la moindre API. Une
   lecture faite sur la mauvaise propriété serait indétectable.
2. **Réparer le trou de tracking de 12 %** (§2.3), en priorité sur le chemin des fiches de
   jeu — la seule inscription venue de l'actif SEO principal est celle qui a été perdue.
3. **Câbler `uid` systématiquement** sur `signup_complete`. Sans lui, aucune cohorte ne se
   suit dans Firestore ; il n'est présent que dans 6 documents sur 15.
4. **Instrumenter un événement de session** (« retour d'un membre connecté »). C'est la
   seule façon de transformer le 18 % du volet 3 en mesure plutôt qu'en signal fort.
5. **Décider du sort des 304 comptes Wix** (§3.3, 1 % de vivants). Tant qu'ils comptent
   dans la preuve sociale, celle-ci annonce une communauté qui n'existe pas.
6. **Vérifier, connecté, si `genia_click` est mort ou muet** (§1.4) — et si le générateur
   est muré contre la décision de la vague D (§4.4).
7. **Supprimer les 4 documents `leads` de test** en `@zonetotalsport.invalid` (tâche D1 du
   LOT 0, toujours ouverte).

---

## MÉTHODE ET RÉSERVES

**Ce qui a été lu** : `conversionFunnel` (2230 docs, intégralité), `anonGenCount` (1),
`leads` (9), `analyticsDaily` (70), `article_views` (33), Firebase Auth (354 comptes,
pagination complète). Aucune requête filtrée côté serveur — tout a été rapatrié puis filtré
en mémoire, pour que les bornes de fenêtre soient vérifiables.

**Exclusions appliquées**, conformément au brief :
- `signup_complete` du 21 août 08 h 43, `path:"/blog.html"`, `uid:null` — 1 document ;
- `anonGenCount` empreinte `3c09bbbd…` du 21 août — 1 document, qui était la collection entière ;
- les 304 comptes du 28 mars, exclus de toute cohorte organique ;
- 0 compte Auth en `@zonetotalsport.invalid` à exclure (mais 4 documents `leads`, signalés).

**Réserves**
- `lastRefreshTime` est un **signal fort, pas une preuve** (§3.2). Il ne peut pas surestimer
  un compte jamais revenu, mais il peut compter un onglet oublié.
- Le 28 août est un **jour partiel** (lecture à 15 h 30). Les taux journaliers de ce jour
  sont sous-estimés ; les taux de fenêtre le sont marginalement.
- Les effectifs sont **petits** : 26 clics, 15 signups, 17 comptes. Un écart de 2 unités
  déplace un taux de plusieurs points. Aucun test de significativité n'est possible ici, et
  aucun n'est revendiqué.
- Le volet 4 est **incomplet par contrainte de mandat**, pas par absence de donnée.

**Tout export local produit pour ce rapport a été supprimé.**

---

# 7. ADDENDA DU 28 AOÛT AU SOIR — prérequis de la lecture de fin septembre

Écrit pendant la PR `fix/attribution-funnel`. Tout ce qui suit est de la lecture
seule sur la donnée de production, sauf le §7.7 qui avoue une écriture.

## 7.1 Le « 15/17 » du §2.3 : vérifié, il tient

**La requête littérale qui a produit ce chiffre**, reprise telle quelle du script
de lecture du matin :

```python
SC = [e for e in ev if e['event'] == 'signup_complete'
                    and dt(e['ts']) >= datetime(2026, 8, 17, tzinfo=EDT)]
SC = [e for e in SC if not (e['path'] == '/blog.html' and e['uid'] is None)]
```

**Il n'y avait aucun filtre sur `path == '/bienvenue.html'`.** Le seul test sur
`path` est celui qui écarte le doc parasite, et il est conjoint à `uid is None` :
il ne peut retirer que ce document-là. La crainte du LOT 0 — une baseline
sous-comptée — ne se réalise pas.

**Recomptage sans le moindre filtre sur `path`**, fenêtre 17 → 28 août :

| Mesure | n |
|---|---:|
| `signup_complete` bruts, **aucun filtre** | **16** |
| dont parasite (`path:'/blog.html'` + `uid:null`) | 1 |
| **NET** | **15** |
| Comptes Auth créés sur la même fenêtre (hors import Wix) | **17** |
| **RATIO** | **15 / 17 = 88 %** |

**Le ratio est inchangé.** Et la vérification qui tranche vraiment : sur les
**20 `signup_complete` de toute l'histoire de la collection**, la répartition
des `path` est `/bienvenue.html` × 19 et `/blog.html` × 1. **Aucun document ne
porte un `path` d'app ni de fiche.** Filtrer sur `/bienvenue.html` aurait donné
15 lui aussi — écart nul.

> **Conséquence** : le trou de tracking est bien de 2 comptes, pas moins. Les
> deux inscriptions manquantes n'ont **aucun** document Firestore, ni au bon
> `path` ni à un autre. La baseline du §2.3 n'a pas à être corrigée.

## 7.2 Méthode de comptage, FIGÉE — à reprendre telle quelle fin septembre

> **Compter les documents de `conversionFunnel` où `event == 'signup_complete'`
> sur la fenêtre, sans aucun filtre sur `path`, moins le seul document parasite
> nommé : celui du 21 août 08 h 43, reconnaissable à `path == '/blog.html'` ET
> `uid == null`.**

Trois pièges à ne pas rejouer :

1. **Un seul document parasite vit dans `conversionFunnel`.** L'empreinte
   `3c09bbbd…` du 21 août est dans **`anonGenCount`**, une autre collection.
   Retrancher 2 d'un comptage de `conversionFunnel` fausserait le total d'une
   unité.
2. **Ne jamais filtrer sur `path`** pour compter des inscriptions. Le champ dit
   où le document a été écrit, pas d'où vient l'inscription.
3. **Le comptage Firestore est un plancher, pas une mesure.** Il ne sur-compte
   jamais (garde `isNewUser`), mais il rate. C'est Auth qui donne le vrai total.

## 7.3 ⚠️ La répartition par `signup_source` n'est pas comparable d'une fenêtre à l'autre

**À écrire noir sur blanc dans la lecture de fin septembre.**

La PR `fix/attribution-funnel` fait apparaître deux valeurs qui n'existaient pas :
`demi_mur_jeu` et `demi_mur_article`. Elles ne viennent pas de nulle part —
**elles viennent du seau `direct`**, où toutes les conversions de fiches et
d'articles tombaient faute de flag.

> Le seau `direct` va se vider au profit des deux nouveaux. **Ce n'est pas un
> changement de comportement des visiteurs, c'est le correctif qui opère.**
> Les répartitions par `signup_source` d'avant et d'après le 1er septembre ne
> se comparent pas. **Seul le total se compare.**

Répartition de référence, fenêtre 17-28 août (avant correctif) :
`popup` 11 · `direct` 3 · `newsletter_popup` 1.

## 7.4 GA4 : la propriété est tranchée

Le §4.1 posait la question, la voici réglée. **`G-C2L5PD388L` est la seule
propriété alimentée** — un seul `config` au `dataLayer`, un seul script
`gtag/js`, via `analytics.js` injecté par le chrome partagé.

**`G-09S9R1HJ94` est inerte** : il n'existe que comme `measurementId` dans des
blocs `firebaseConfig`, et le dépôt ne contient **aucun** `analytics-compat`,
**aucun** `firebase.analytics()`, **aucun** `getAnalytics()`. `initFirebase()`
charge `app-compat`, `auth-compat` et `database-compat`, rien d'autre.

**Résultat des greps demandés au LOT 2**, sur tout le dépôt :

| Motif | Occurrences |
|---|---|
| `G-09S9R1HJ94` | **3** — `firebase-auth.js:21`, `shared/zts-gate.js:20`, `fiches/zts-fiches-firebase.js:55` |
| `analytics-compat` | **0** |
| `getAnalytics` | **0** |
| `firebase.analytics()` | **0** |
| `G-C2L5PD388L` | 2 — `analytics.js:3` et `:9` |

> **Le brief n'en attendait qu'une, il y en avait trois.** N'en commenter qu'une
> aurait été pire que n'en commenter aucune : le lecteur suivant en aurait
> conclu que les deux autres étaient les vraies. Les trois sont commentées, avec
> la raison sur place, dans trois commits distincts (fichiers partagés).

⏳ **Action Joey** : archiver la propriété morte dans la console GA4. La
renommer `[INACTIF] Firebase — ne pas utiliser` suffit.

## 7.5 Prérequis GA4 / Search Console — action Joey, avant toute lecture

Le 403 du §4.1 ne se règle pas d'un seul geste. Il y a **deux barrières**, et la
seconde est celle qu'on oublie.

**Côté Google Cloud** — projet `zone-total-sport` → APIs & Services → Library :

1. Activer **Google Analytics Data API** — c'est elle qui lit les rapports.
   C'est vraisemblablement son absence qui a produit le 403.
2. Activer **Google Analytics Admin API** — configuration seulement.
3. Activer **Google Search Console API**.

**Côté produit** — sinon deuxième 403, et c'est le piège :

4. GA4 → Admin → **Property Access Management de `G-C2L5PD388L`** (pas l'autre)
   → ajouter le compte de service en **Viewer**.
5. Search Console → Paramètres → Utilisateurs et autorisations → ajouter le même
   compte de service en **Lecteur intégral**. **Search Console ne partage rien
   avec GCP par défaut.**
6. Vérifier que la propriété Search Console est celle **du domaine**
   (`zonetotalsport.ca`) et non d'un préfixe d'URL — sinon les sous-domaines
   d'apps sortent des rapports.

**Test de sortie** : une requête Data API qui renvoie 200 **avec des lignes**.
Un 200 vide ne prouve rien.

## 7.6 LOT 4 — la redirection concurrente ne se produit pas

**Question posée** : après une inscription réussie, `closeModal()` est-il atteint,
et sa redirection concurrente peut-elle écraser le `window.location.href =
'/bienvenue.html'` de `finaliserInscription()` ?

**Réponse : non.** Lecture des six sites d'appel de `closeModal()` dans
`firebase-auth.js` :

| Site | Contexte | Sur le chemin d'une inscription ? |
|---|---|---|
| `:570` | clic sur la croix de fermeture | non — pose `locked_close` |
| `:575` | clic sur le fond de l'overlay | non — pose `locked_close` |
| `:707` | touche Échap (`_escHandler`) | non, et inerte en `_wallMode` |
| `:750` | **connexion** réussie | non — compte existant |
| `:791` | `finaliserInscription()`, branche `else` | non — compte existant |
| `ztsShowWall` | rappel `ztsOnAuth` | **non** — retire l'overlay à la main, sans passer par `closeModal()` |

La branche `isNew` de `finaliserInscription()` ne l'appelle pas :

```js
if (isNew) {
  ...
  fireSignupComplete(method);            // synchrone
  window.location.href = '/bienvenue.html';   // et rien après
}
```

**La donnée confirme la lecture de code** : sur les 20 `signup_complete` de
l'histoire de la collection, **aucun** ne porte un `path` d'app (§7.1). Si la
redirection concurrente l'emportait, il en existerait.

> **Verdict : aucun code à changer.** La décision de Joey — `/bienvenue.html`
> gagne — est **déjà** ce que fait le code. Le lien « continuer vers [l'app] »
> sur la page de bienvenue reste une amélioration souhaitable, mais c'est un
> chantier d'expérience, pas un correctif : il n'y a rien à réparer.
>
> **Et donc les 2 inscriptions manquantes restent inexpliquées par cette piste.**
> Le candidat le plus vraisemblable est ailleurs : `consumePendingSignup()`
> consomme le flag **avant** que l'écriture parte (`removeItem` synchrone, puis
> `waitFb().then(...)`). Un visiteur qui quitte `/bienvenue.html` pendant que le
> SDK Firestore se charge perd son document — le flag, lui, est déjà brûlé.
> Observé en test : sur une page qui se ferme trop vite, le flag disparaît et
> aucune écriture ne part. **Non corrigé, hors périmètre de cette PR.**

## 7.7 ⚠️ Trois documents parasites de plus, écrits par mes propres tests

**À soustraire de la lecture de fin septembre.** Le 28 août au soir, avant que le
stub d'écriture soit en place, trois chargements de page ont écrit pour de vrai
dans `conversionFunnel` — les pages de test tournaient sur `localhost`, mais
`firebaseConfig` pointe sur le projet de **production** :

| Horodatage (UTC) | Événement | `source` | `path` |
|---|---|---|---|
| 2026-08-28 19:53:47 | `locked_view` | `menu` | `/` |
| 2026-08-28 19:54:22 | `newsletter_view` | `unknown` | `/` |
| 2026-08-28 19:54:58 | `locked_view` | `article` (slug `respect-eps`) | `/articles/respect-eps.html` |

**Aucun n'est un `signup_complete`** — la règle du LOT 2 sur les faux signups
n'est pas enfreinte, et le comptage du §7.2 n'est pas touché. Mais le
`locked_view` du 28 août est gonflé de **3** et celui de `respect-eps` de **1**.

**Ce qui s'est passé, pour que ça ne se reproduise pas** : `zts-funnel.js` écrit
au **chargement** de la page (`locked_view` sur observation du mur), pas
seulement au clic. Stubber `window.ztsTrackFunnel` depuis la console arrive
toujours trop tard. **Le stub doit être posé dans le fichier servi, avant le
premier chargement** — c'est ce qui a été fait ensuite, et plus une seule
écriture n'est partie (vérifié : 2240 documents avant et après la suite des
tests).

**Aucun compte Auth n'a été créé** : 354 avant, 354 après. Le stub de
`createUserWithEmailAndPassword` a tenu sur les six parcours d'inscription joués.

### Deux documents de plus, à la vérification de production (20 h 21)

Après la fusion de #53, la recette de production demandée par Joey a coûté
**deux documents supplémentaires**, pour la même raison exactement :

| Horodatage (UTC) | Événement | `source` | Cause |
|---|---|---|---|
| 2026-08-28 20:21:43 | `locked_view` | `menu` | chargement de `/articles/color-run.html` |
| 2026-08-28 20:21:43 | `locked_view` | `article` (slug `color-run`) | idem |

**La page de fiche, elle, n'a rien écrit** : le stub de `ztsTrackFunnel` a été
posé avant que l'observateur du mur ne déclenche, et le `locked_view` de
`le-mouton-perdu` a été intercepté au lieu d'être écrit. La différence entre les
deux pages tient à quelques centaines de millisecondes — **ce qui confirme, s'il
le fallait, qu'un stub posé depuis la console est une course qu'on perd une fois
sur deux.** En production, où le fichier servi n'est pas modifiable, c'est le
seul levier disponible : il faut compter avec 1 à 2 `locked_view` par page
visitée en recette.

**Total des documents parasites écrits par la recette du 28 août : 5.**
Trois au §7.7 (19 h 53 → 19 h 54), deux ici (20 h 21). **Aucun n'est un
`signup_complete`** — le comptage du §7.2 reste intact, seul `locked_view` du
28 août est gonflé.

> ⚠️ **Deux autres documents, à 20 h 18 h 36 et 20 h 19 h 10** (`locked_view`
> `menu` puis `article`/`respect-eps`), ne sont **pas attribuables avec
> certitude**. Ils tombent pendant la fusion de #53, alors qu'aucun navigateur
> n'était piloté et que le serveur local était arrêté. L'hypothèse la plus
> simple est un vrai visiteur sur un article réel — à 88 visites/jour, deux vues
> en vingt minutes est le rythme attendu. **Ils ne sont donc pas comptés comme
> parasites, mais ils sont signalés :** en cas de doute sur le 28 août, les
> écarter change le total de 2.

## 7.8 Ce que la PR change, et les deux découvertes qu'elle a forcées

**Découverte 1 — les trois « appâts SEO » ne sont pas murés, et c'est voulu.**
`faire-bouger-enfants`, `comportements-perturbateurs` et
`catastrophes-ordinaires` sont dans `freeArticles` de `locked-whitelist.json` :
`zts-lock-page.js` leur appelle `revealAll()`. **Vérifié au navigateur sur
`faire-bouger-enfants` : 0 bloc masqué, aucun CTA.** Il n'y a donc rien à
attribuer sur eux — le critère d'acceptation qui demandait de tester l'un des
trois est **inapplicable par construction**. Les tests ont porté sur quatre
articles réellement murés à la place.

**Découverte 2 — il y avait un QUATRIÈME émetteur, et c'est le plus lu.**
`articles/50-jeunes-un-gymnase.html:1126` porte son propre CTA en ligne
(`showTab` sur un onglet derrière le mur) : il appelle `ztsShowSignup()` sans
passer par `zts-lock-page.js`, donc le correctif ne l'atteignait pas. C'est le
**premier des 27 articles** au compteur `article_views` (31 vues) et l'un de
ceux que la campagne va marteler. Corrigé dans son propre commit.

**Les cinq nombres de fin septembre, état des prérequis :**

| # | Nombre | Instrument | Prêt ? |
|---|---|---|---|
| 1 | Inscriptions / semaine | `conversionFunnel`, méthode du §7.2 | ✅ |
| 2 | % de retour à 72 h | `lastRefreshTime` | ✅ déjà acquis |
| 3 | Conversion par fiche | `signup_source == 'demi_mur_jeu'` + `slug` | ✅ après fusion |
| 4 | **Conversion par article** | `signup_source == 'demi_mur_article'` + `slug` | ✅ après fusion |
| 5 | Taux d'acceptation de la bannière | GA4 Data API | ⏳ **bloqué sur le §7.5** |

**Sur le nombre 5, une précision qui change son rôle** : `analytics.js` pose un
Consent Mode v2 en `denied` par défaut, `analytics_storage` compris. Tant qu'un
visiteur n'accepte pas, GA4 n'a pas d'identité stable et son attribution de
source est dégradée. **Si l'acceptation est basse, `conversionFunnel` est la
source de vérité pour la provenance** — il est écrit côté Firestore,
indépendamment du consentement analytique — **et GA4 ne sert plus qu'au trafic.**
C'est précisément pourquoi la chaîne du LOT 1 devait être solide : c'est la
seule qui mesure tout le monde.

## 7.9 ⚠️ Retour arrière : ce qui se révoque, et ce qui ne se révoque pas

Les commits de cette PR n'ont pas le même coût d'annulation.

- **Les trois commits GA4** (`measurementId` commenté) : annulables sans effet.
  Ils ne changent aucun comportement — la propriété était déjà inerte.
- **Les quatre commits d'attribution** : **leur annulation a un effet visible sur
  les données.** Elle remet toutes les conversions de fiches et d'articles dans
  le seau `direct`, et le nombre 4 redevient aveugle.

> **Ne pas révoquer le LOT 1 « pour tester » pendant que la campagne tourne.**
> Un aller-retour de quelques jours creuse un trou dans la seule série qui doit
> dire lesquels des 27 articles méritent un frère — et ce trou ne se rattrape
> pas après coup.
