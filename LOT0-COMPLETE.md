# LOT 0 — DÉMINAGE AVANT LE CHANTIER LOCKAGE

**État au 13 août 2026.** Référence : `AUDIT-CHANTIERS-2026-08.md`.
**LOT 0 CLOS.** Quatre commits sur `main`, tous déployés et vérifiés en production.

| Tâche | État | Commit |
|---|---|---|
| 1 — Trancher le diff auth non committé | **FAIT** | *(aucun — `git stash`)* |
| 2 — Retrait `getRedirectResult` | **FAIT, déployé, vérifié** | `0f9120c` |
| 3 — Patch newsletter d'urgence (Resend) | **FAIT, déployé, vérifié** | `a4dc20c` |
| 4 — CI : élargir les paths (D22) | **FAIT, vérifié par contrôle** | `8d51ea4` |
| 5 — Lire les 3 branches `claude/*` | **FAIT** — 1 fusionnée, 1 récupérée, 1 réservée | `ea9188a` |

> Le corps de ce document a été écrit **avant** les tâches 3 et 5. Les sections
> §3 et « Ce qui reste bloquant » ont été dépassées par les faits : voir
> **l'ADDENDA en fin de fichier**, qui fait foi. Le corps est conservé tel quel,
> il documente l'état de la décision au moment où elle a été prise.

---

## 1. Diff auth non committé — tranché, rien perdu

`firebase-auth.js` portait +428/−443 non committés : une V2 de la modale
d'inscription (écran d'argumentaire puis formulaire, fond flouté, `ztsShowWall`),
datée du 9 août par son en-tête, sans branche, sans stash, sans document.

**Décision de Joey : stash, et repartir de HEAD.** Trois raisons retenues : la
tâche 2 touchait les mêmes lignes ; la V2 aurait fait compter `locked_click_signup`
deux à trois fois, faussant la métrique même sur laquelle le LOT 1 se juge ; et
elle est inachevée (`ztsShowWall` n'a aucun appelant).

**Conservée en trois exemplaires**, ceinture et bretelles :

| Où | Quoi |
|---|---|
| `stash@{0}` — `v2-modal-2-etapes` | rejouable, vérifié par `git apply --check` |
| `~/PROJETS_CLAUDE/_sauvegardes/firebase-auth-V2-modal-2-etapes-2026-08-10.js` | le fichier complet |
| `~/PROJETS_CLAUDE/…-2026-08-10.diff` + `…-V2-BASE-COMMIT.txt` | le diff et son commit de base |

Fichier de travail ramené à HEAD, vérifié **au bit près** : `shasum` identique
(`21838ed6…`) entre le fichier local et `git show HEAD:firebase-auth.js`.

**Ce que la V2 apportait de bon, à ne pas perdre quand on la reprendra** : la
preuve sociale devient honnête (elle interroge le worker `zone-subscriber-count`,
qui répond `total: 335`, au lieu du « 2 300+ enseignants » codé en dur dans
HEAD), et les erreurs de connexion cessent d'afficher des messages Firebase
bruts. Ces deux gains-là sont indépendants de l'écran d'argumentaire et
mériteraient leur propre commit.

**Ce qu'il faudra corriger avant de la reprendre** : le double comptage du
funnel ; le `provider` passé par `zts-locked-fullscreen.js:107` et ignoré, qui
transforme « je clique Google » en trois clics ; `ztsShowWall` sans appelant, qui
enregistre un `ztsOnAuth` par appel sans jamais le retirer et court-circuite la
redirection `_protectedMode` ; et le « ~1 880 SAÉ » de l'écran 1, qui contredit
le standard du dépôt (1790 mesurées, « 1700+ » affiché ailleurs).

---

## 2. Retrait `getRedirectResult` — `0f9120c`

Échéance du 15 août tenue. `−67 / +10` sur deux fichiers.

### Trois corrections à l'énoncé initial

- **`firebase-auth.js:672-674`, branchement `isMobile` : n'existait plus.**
  Retiré par `310274d` le 8 août. Le fichier ne portait plus que le bloc
  `getRedirectResult`.
- **`aidons-nous/index.html:455-457` : n'existait plus non plus.** Aucun
  `signInWithRedirect` ni `getRedirectResult` dans ce fichier. Les lignes citées
  venaient de `FIX-AUTH-COMPTEURS-COMPLETE.md`, qui décrit l'état *avant*
  correctif. (La dette D21 — `select_account` manquant ligne 437 — reste ouverte.)
- **`shared/zts-gate.js` n'était pas « un repli `.catch()` ».** C'était le
  **même bloc déprécié**, avec le **même en-tête « RETRAIT PREVU LE 2026-08-15 »**.
  Il est parti aussi. Le vrai repli `.catch()`, conservé, est dans
  `apps/studio-jeu/admin-gate.js:110`.

### Effet de bord traité — option B retenue

`_signedOutAtLoad` n'était lu **qu'à un seul endroit dans chaque fichier**, à
l'intérieur des blocs retirés. `grep -rn "zts_signed_out"` sur tout le dépôt ne
renvoyait que les deux déclarations : aucun autre consommateur. Garder la
machinerie aurait laissé ~15 lignes écrites-jamais-lues qui *ressemblent* à une
garde de sécurité. Elle est partie avec le bloc, un commentaire à sa place
explique pourquoi et interdit de la réintroduire sans lecteur.

### Ce qui est conservé, volontairement

`apps/studio-jeu/admin-gate.js` garde son `signInWithRedirect` (repli sur
`auth/popup-blocked`, ligne 100) et le `getRedirectResult().catch()` qui en
récupère le retour (ligne 110). C'est le **seul rattrapage du mode de panne
Safari iOS** sur la porte admin.

### Grep de contrôle final — sur les fichiers servis en production

```
/firebase-auth.js     getRedirectResult | signInWithRedirect  → 0
/firebase-auth.js     zts_signed_out | markSignedOut | clearSignedOut  → 0
/shared/zts-gate.js   getRedirectResult | signInWithRedirect  → 0
/shared/zts-gate.js   zts_signed_out | markSignedOut | clearSignedOut  → 0

/apps/studio-jeu/admin-gate.js                                → 2   (conservé)
```

Dans le dépôt, il ne reste que trois **commentaires** qui nomment
`getRedirectResult` pour dire pourquoi il n'y est plus, plus `index-old.html`
(fichier mort, couvert par la 301 du CSV Cloudflare).

### Invariants recomptés HEAD → livré

`select_account` 1→1 · `signInWithPopup` 1→1 · `fireSignupComplete` 3→3 ·
`/bienvenue.html` 2→2 · `zts_signup_pending` 3→3 · `zts_signup_source` 4→4 ·
`ztsSetProtected` 1→1 · `_protectedMode` 6→6.
Seul `finaliserInscription` passe de 4 à 3 : le site retiré était celui du bloc
redirect ; les deux chemins vivants finalisent toujours
(courriel `:640`, Google popup `:656`).

### Tests joués

| Test | Résultat |
|---|---|
| `node --check` sur les deux fichiers | OK |
| Hook pre-commit (secrets + habillage + glyphes) | 0 bloquant, 4 avertissements **préexistants** (D23 sur `jeux`/`transitions`, enveloppe `studio-jeu`) |
| Déploiement | prod == repo au `shasum`, rebuild en 120 s |
| **Mur d'app gatée** — `/apps/educatifs/` anonyme | **PASSÉ** : mur affiché, `firebase.auth` prêt, 4 fonctions de l'API auth présentes, `zts_signed_out` = `null` |
| **Modale d'inscription** — ouverture | **PASSÉ** : overlay monté, 4 champs, boutons Google et submit liés |
| **Relais `signup_complete`** | **moitié vérifiée** — drapeau posé à la main puis `/bienvenue.html` : **consommé**. L'écriture Firestore n'a pas pu être observée : `bienvenue.html:131` redirige les anonymes vers `/`, et cette navigation tue l'écriture async. Artefact du test, pas défaut du flux — un vrai inscrit est authentifié en arrivant. |
| **Déconnexion sans session fantôme** | **NON JOUÉ** |

**Pourquoi le dernier test n'est pas joué** : je ne crée pas de compte et je ne
saisis pas de mot de passe. Sans session, il n'y a ni déconnexion à tester ni
inscription réelle à mener. C'est la même limite qu'au §2.2 de l'audit.

**À faire par Joey, sur un iPhone réel, en navigation privée :**

1. `/apps/educatifs/` → mur → « Continuer avec Google » → le popup doit
   **s'ouvrir** (le mode de panne iOS est un blocage silencieux) ;
2. arrivée sur `/bienvenue.html`, puis `signup_complete` dans **GA4 → Temps réel**
   et une ligne dans `conversionFunnel` ;
3. déconnexion → retour sur `/` → **recharger deux fois** : le « Salut, … » ne
   doit pas revenir. C'est le seul point que le drapeau retiré protégeait, donc
   la seule régression possible de ce commit.

---

## 3. Patch newsletter (Resend) — NON FAITE

Rappel de l'état, inchangé et **actif en production** :

```
curl -X POST https://zts-send-pdf.zts-ccd.workers.dev/ -d '{"email":"…"}'
→ {"ok":false,"error":"API key is invalid"}
```

`zts-newsletter.js` est chargé par `shared/zts.js:245-247` sur toutes les pages
de contenu (accueil, 3 hubs, blog, 25 articles, 1440 fiches de jeux ; exclut
`/apps/*`, `bienvenue`, `politique`, `login`, `teasing`, `promo`). À chaque
soumission : message d'erreur au visiteur, **courriel enregistré nulle part**, et
comme `markDone()` n'est jamais appelé, la modale **revient le harceler** à la
visite suivante.

Le correctif prévu — écriture dans une collection Firestore `newsletter_signups`
(création seule, format validé, pas de lecture publique), `markDone()` sur succès,
échec silencieux poli sinon — **reste entièrement à faire**, règles Firestore
comprises (déploiement depuis la bonne branche, piège documenté).

---

## 4. CI — `8d51ea4`

### D22 prouvée, pas déduite

```
b257195  fix(favicon) — 1441 fichiers dans jeux/ et scripts/
gh api …/actions/runs?head_sha=b257195  →  total_count: 0
```

Le commit qui a corrigé le favicon de 1440 pages est passé **sans aucun contrôle**.

Second effet, invisible dans le YAML : **GitHub évalue `paths` sur l'ensemble du
push, pas commit par commit.** `78b26d5` (un seul `.md` racine) a bien été
vérifié — parce qu'il voyageait avec `9a1d046`, qui touchait `assets/`. La
couverture dépendait donc du groupage des commits, pas de leur contenu.

**Le filtre est supprimé, pas élargi** — énumérer des chemins est ce qui a créé
le trou. Le workflow est renommé `Garde-fous du dépôt` : il ne vérifie plus que
l'habillage.

### D27 — trois motifs de `verifie-secrets.sh` n'ont jamais rien détecté

Découvert pendant le prescan. Le script faisait `grep -E -o "$pattern" "$file"
2>/dev/null`, **sans `--`** : les motifs commençant par une suite de tirets
étaient lus comme des options.

```
$ grep -E -o "<en-tête de clé privée, qui commence par cinq tirets>" fichier
grep: unrecognized option …          → sortie 2, avalée par 2>/dev/null
```

> Le motif n'est pas recopié en clair : ce fichier est balayé comme les autres.
> La démonstration complète, avec le littéral, vit dans
> `DETTE-TECHNIQUE-HABILLAGE.md` (D27), qui a sa ligne dans `EXCEPTIONS`.

**Une clé privée nue — `id_rsa`, un `.pem` — passait sans être vue.** Seul le cas
enveloppé en JSON restait couvert (ce motif-là commence par un guillemet), ce qui
a masqué le défaut : la fuite de compte de service GCP la plus courante étant
justement celle-là.

**Contre-épreuve jouée** : clé privée nue indexée → **ancien script sortie 0**
(aveugle), **nouveau script sortie 1** (refusé).

### Ce que le script gagne

- un mode **`--arbre`** — la CI n'a pas d'index, `git diff --cached` y renvoie le
  vide, et l'ancien script sortait alors en **0 sans avoir rien lu**. L'ajouter
  verbatim au workflow aurait donné une **étape verte qui ne vérifie rien** :
  exactement le mode de panne silencieux de D18 et D22 ;
- un **refus explicite** du mode indexé en CI (sortie 2) plutôt qu'un faux vert ;
- un **self-test** : chaque motif est essayé à vide au démarrage, une sortie ≥ 2
  arrête tout. Il ne couvre plus le `--` manquant (rendu impossible par
  construction) mais la moitié du risque qui reste — un motif malformé ajouté
  plus tard, qui échouerait pareillement en silence ;
- un balayage à **un grep par motif** et non par fichier : la version par fichier
  demandait ~20 000 processus et dépassait 5 minutes sur l'arbre complet.

### Huit essais joués avant commit, dans un dépôt bac à sable

| Cas | Attendu | Obtenu |
|---|---|---|
| Clé privée **nue** indexée | refus | sortie 1 ✓ |
| Même cas, **ancien** script | *(contre-épreuve)* | sortie 0 — aveugle ✓ |
| Clés `AIza` / `AKIA` inventées | refus | sortie 1 ✓ |
| Clé web Firebase **publique** | accepté | sortie 0 ✓ |
| Motif **malformé** (crochet non fermé) | self-test | sortie 2 ✓ |
| Index vide **en CI** | refus | sortie 2 ✓ |
| Index vide **hors CI** | sortie propre | sortie 0 ✓ |
| Arbre complet du vrai dépôt | propre | 2315 fichiers, sortie 0 ✓ |

### Trois exceptions, par couple fichier + valeur

Jamais sur le fichier seul : dispenser un fichier entier laisserait passer une
vraie clé collée dedans. `.githooks/README.md` cite le motif qu'il documente ;
`cf-worker/generateur/src/firestore.js:14` fait un `.replace()` qui retire
l'en-tête d'une clé lue dans une variable d'environnement ; et `D27` garde une
occurrence en clair sans laquelle sa démonstration ne montre plus rien.

> **Le hook a refusé ce commit au premier essai**, sur cette documentation même.
> Il fonctionne. La doc a été réécrite pour ne citer le motif qu'une fois.

### Contrôle sur branche jetable, avant de toucher `main`

1. Branche `ci/garde-fous-sans-filtre`, commit réel → workflow déclenché, **vert**.
   Étape secrets : `2315 fichier(s), mode arbre, 9 motifs` → `OK`, en **1,4 s**
   sur le runner (35 s sur le Mac).
2. **Contrôle décisif** — un commit **vide** : zéro fichier, donc zéro
   correspondance avec l'ancien filtre. Sous l'ancien `paths` il n'aurait
   déclenché **aucun** run. Sans filtre : **run déclenché, vert**.
3. Le commit réel a été porté sur `main` par `cherry-pick` — **sans** le commit
   de test (`git diff` entre les deux : vide). Branche jetable supprimée, locale
   et distante. CI verte sur `main`.

### Deux documents corrigés au passage

- **`CLAUDE.md`** affirmait « Aucun pre-commit hook réel installé » — faux depuis
  le 27 juillet (`core.hooksPath = .githooks`, et non `.git/hooks/`, d'où la
  confusion). Corrigé, avec la manip d'installation sur un poste neuf, **qui ne
  se fait pas toute seule**.
- **`DETTE-TECHNIQUE-HABILLAGE.md`** : D22 bis (réglée), D27 (motifs morts),
  D28 (429 d'`ipapi.co`, non corrigée).

### D28 — relevée pendant les essais, non corrigée

`telegram-notify.js:125` et `:166` appellent `https://ipapi.co/json/`, palier
gratuit, qui répond **429** sous chargements répétés — mes propres essais ont
suffi à déclencher la limite. C'est aujourd'hui la seule erreur console des pages
du site. Conséquence : les notifications de visite arrivent **sans pays ni
ville**, sans que rien ne le signale. Aucun impact visiteur. La bonne réponse à
terme est l'en-tête `CF-IPCountry`, que Cloudflare fournit gratuitement au Worker
`notify.zonetotalsport.ca` (qui répond 200).

---

## 5. Les trois branches `claude/*` du 9 juillet — lecture seule

**Les trois se fusionnent proprement** sur `main` (`git merge-tree` : aucun
conflit), malgré cinq semaines d'écart. Les deux qui touchent `shared/zts.js`
visent des régions différentes (ligne ~23 et ligne ~223) : elles ne se marchent
pas dessus non plus.

### `claude/zero-signups-diagnostic-d3619k` — 7 commits, **documentation seule**

`docs/DIAGNOSTIC-INSCRIPTIONS-2026-07.md`, 478 lignes. Deux des sept commits
s'annulent (retrait de `gym-ambiance.mp3` puis revert) : le diff net ne contient
que ce fichier.

**Contenu** : un arbre de décision TRAFIC / CONVERSION / BUG, et surtout un
**script `firebase-admin` prêt à l'emploi** qui produit les trois nombres du
tunnel (`locked_view` → `locked_click_signup` → `signup_complete`) sur 30 jours,
plus le compte Auth réel, plus `anonGenCount` comme proxy du trafic. La
collection `conversionFunnel` est `allow read: if false` : elle n'est lisible que
par le SDK Admin, donc ce script est **le seul moyen** d'obtenir ces chiffres.

**Ce qui est périmé** : le §3 liste 7 redirections de sous-domaines « pendantes ».
Elles sont **toutes fermées** — mon audit a vérifié 9/9 en 301. Le §1 et le §5
(script et arbre de décision) restent valides tels quels.

> **Verdict : RÉCUPÉRER le document.** C'est la pièce manquante pour mesurer le
> LOT 1 : sans ces trois nombres, on optimisera le lockage à l'aveugle. Exécuter
> le script demande une clé de compte de service que Joey seul peut exporter.

### `claude/fix-analytics-seo` — 3 commits, **toujours d'actualité**

Deux choses. D'abord `shared/zts.js` charge `analytics.js` partout, avec garde
anti-double-chargement différée à `DOMContentLoaded`. Ensuite `clip()` dans
`scripts/gen-jeux-fiches.js` coupe les méta-descriptions sur un mot entier, sans
casser un emoji en deux (garde sur les surrogates `0xD800-0xDBFF`).

**Vérifié aujourd'hui en production, le problème est intact** :

| Page | GA4 |
|---|---|
| `/` (accueil) | **absent** |
| `/ep.html` et les deux autres hubs | **absent** |
| Les **1440** fiches `/jeux/` | **absent** |
| `/blog.html`, 24 articles, 14 apps | présent |

L'accueil ne charge que `daily.js`, `firebase-auth.js`, `zts-funnel.js`,
`shared/zts-unlock.js`, `shared/zts.js`. **Les deux surfaces qui reçoivent le
trafic — la page d'entrée et les 1440 fiches SEO — sont aveugles à GA4.**

> **Verdict : RÉCUPÉRER, et tôt.** Sans GA4 sur ces pages, le LOT 1 sera
> invisible dans les rapports. Réserve : le correctif `clip()` ne prend effet
> qu'à la **régénération des 1440 fiches** — prévoir un commit de 1440 fichiers,
> et le passer par le hook (~35 s de balayage secrets).

### `claude/conversion-cta` — 2 commits, **récupérer l'idée, pas le code**

Un nouveau module `zts-jeux-cta.js` (137 lignes) pose un bandeau « Crée ton
compte » **permanent et non fermable** en bas des 1440 fiches de jeux, émet
`locked_view` / `locked_click_signup` avec `source: 'jeu'`, et disparaît pour les
connectés. C'est très exactement le voisin du LOT 1.4, et l'intention est juste :
les fiches n'ont aujourd'hui aucune invitation permanente à s'inscrire.

**Mais il ne peut pas être fusionné tel quel** — trois raisons, dont une sérieuse :

1. **`zts-jeux-cta.js:54` injecte un `@import` Google Fonts en JS**, tirant
   **Nunito**. Or `zts-newsletter.js:123` porte, depuis le 9 août, ce commentaire :

   > *« L'@IMPORT EST PARTI — 9 août. Il tirait Nunito, SORTIE DU SITE le 4 août
   > […] Injecté par JS, il avait échappé au balayage des polices du 8 août, qui
   > ne visait que les balises `<link>`. Il partait sur 26 pages. »*

   Fusionner cette branche **referait exactement ce qui vient d'être défait**,
   sur **1440 pages au lieu de 26**. La branche date du 9 juillet : son auteur ne
   pouvait pas le savoir. Aujourd'hui, si.
2. **« 328 profs » codé en dur**, deux fois. Le worker
   `zone-subscriber-count` répond `total: 335` et existe déjà — même famille de
   défaut que le « 2 300+ » de HEAD.
3. Il ajoute un sixième émetteur de `locked_click_signup`, à surveiller avec le
   double comptage relevé au §1.

> **Verdict : GARDER la branche comme cahier des charges, réécrire le module**
> pendant le LOT 1.4 — polices par les tokens locaux, preuve sociale par le
> worker, un seul tir d'événement par intention.

### Suppressions

**Aucune des trois ne doit être supprimée maintenant.** Elles portent du travail
non fusionné. À supprimer une fois le contenu récupéré, avec ton GO.
Les **12 branches déjà fusionnées** (0 commit d'avance, listées au §8.3 de
l'audit) restent supprimables sans perte — pas fait, pas demandé.

---

## Ce qui reste bloquant pour démarrer le LOT 1

| # | Blocage | Qui | Taille |
|---|---|---|---|
| 1 | **Test iPhone réel du tunnel** (§2) — `signup_complete` n'a toujours **jamais** été validé en conditions réelles, et c'est le seul point où `0f9120c` pourrait avoir régressé | **Joey** | 15 min |
| 2 | **Resend / newsletter** (§3) — fuite active : des courriels sont perdus à chaque soumission, sur ~1470 pages | à faire | petit |
| 3 | **GA4 absent de l'accueil et des 1440 fiches** (§5) — sans lui le LOT 1 ne se mesure pas dans GA4 | branche prête | petit |
| 4 | **Les trois nombres du tunnel** (§5) — `conversionFunnel` n'est lisible qu'au SDK Admin ; script prêt, **clé de compte de service requise** | **Joey** | 10 min |

Les points 1 et 4 ne dépendent que de toi. Les points 2 et 3 sont du travail
ordinaire, tous deux petits, tous deux à faire avant d'écrire une ligne de
lockage — sinon le LOT 1 se pilotera sans instruments.

**Rien d'autre ne bloque.** La CI couvre désormais la racine, où vit tout le
chantier lockage. L'échéance du 15 août est tenue. Le fichier d'authentification
servi sur ~1510 pages est propre, et sa V2 est en sûreté.

---

*LOT 0 clos le 13 août 2026 sur `main` @ `8d51ea4`, sauf la tâche 3.
Deux commits déployés et vérifiés en production. Aucune suppression de branche.*

---

# ADDENDA — 13 août 2026, suite du LOT 0

Quatre commits de plus. Tout est déployé et vérifié en production.

| Ajout | Commit |
|---|---|
| Tâche 3 — newsletter + règles Firestore | `a4dc20c` |
| Fusion `claude/fix-analytics-seo` | `ea9188a` |
| Récupération du diagnostic, §3 et §4 corrigés | *(ce commit)* |
| Versement des rapports au dépôt | *(ce commit)* |

## A. Tâche 3 — newsletter : une correction de mon propre constat

**Ce que j'avais écrit au §3 était faux sur un point** : « courriel enregistré
nulle part ». Vérifié avant d'écrire une ligne — `saveLead()` écrivait **déjà**
dans la collection `leads`, dont les règles étaient en place. Sonde en prod :
écriture anonyme acceptée, document `EuSp41vuVtTnhWBD5KXr`.

Créer une collection `newsletter_signups` comme prévu à l'énoncé aurait donc
**dédoublé `leads` et scindé l'export en deux endroits**. J'ai gardé `leads` et
je l'ai durcie. C'est le seul écart au brief, et il est là pour ça.

Le vrai défaut était ailleurs, et il était triple : le succès dépendait du
worker Resend débranché, donc **le visiteur voyait une erreur alors que son
courriel venait d'être enregistré**, `markDone()` n'était jamais appelé — d'où
le harcèlement à chaque visite — et la confirmation promettait un courriel qui
ne partait pas.

**Ce qui change** : `saveLead()` rend une promesse (garde de 6 s, le SDK
Firestore se charge à la demande sur les fiches de jeux) ; succès **et** échec
mènent au même écran et appellent tous deux `markDone()` ; l'échec reste visible
pour nous par `newsletter_save_failed` ; l'accès est donné **en clair dans la
modale** au lieu d'être promis par courriel, en FR et en EN.

Le principe qui a tranché les cas limites : *le visiteur a donné son courriel,
il obtient son accès. Que l'écriture aboutisse est notre problème, pas le sien —
le harceler à la visite suivante serait le punir d'un défaut qui n'est pas le sien.*

### Règles Firestore — déployées, avant/après vérifiés par sonde

`leads` gagne la validation de format demandée **et** `hasOnly` sur ses cinq
clés. Sans `hasOnly`, la collection acceptait en anonyme des documents de
n'importe quelle forme et de n'importe quelle taille : la fermer comptait plus
que valider le format.

Le piège des vieilles règles a été traité **par mesure, pas par confiance** :
une sonde portant un champ en trop a été **acceptée** avant déploiement — donc
les règles actives étaient bien celles du dépôt, aucune modification console à
écraser. Commit d'abord (`CLAUDE.md`), puis déploiement depuis un arbre
identique au commit.

Cinq sondes après déploiement :

| Sonde | Résultat |
|---|---|
| champ en trop | REFUSÉ ✓ |
| courriel sans `@` | REFUSÉ ✓ |
| courriel sans point | REFUSÉ ✓ |
| courriel avec espace | REFUSÉ ✓ |
| courriel valide | ACCEPTÉ ✓ |

### Bout en bout, sur une fiche de jeu en production

| Vérification | Résultat |
|---|---|
| Textes sans promesse de courriel | ✓ « Laisse ton courriel : l'accès s'ouvre tout de suite » |
| Confirmation | ✓ « Tes 90 cours t'attendent : » + lien vers `/apps/cours-maternelle/?token=DEMO2026` |
| `markDone()` posé | ✓ |
| Harcèlement stoppé | ✓ après rechargement, même un `ZTS_NEWSLETTER.open()` forcé ne rouvre rien |
| **Chemin d'échec** (Firestore cassé volontairement) | ✓ même écran, lien donné quand même, `markDone` posé, `newsletter_save_failed (panne simulee)` tracé |

## B. `claude/fix-analytics-seo` — fusionnée (`ea9188a`)

Compatibilité vérifiée **avant** fusion, pas supposée : aucun fichier commun
avec `0f9120c`, `8d51ea4` ni `a4dc20c`. Les deux régions de `shared/zts.js`
touchées par les branches `claude/*` ne se recouvrent pas (ligne ~26 ici,
~223 pour `conversion-cta`). `git merge-tree` : aucun conflit.

Vérifié en production après déploiement :

| Page | Avant | Après |
|---|---|---|
| `/` (accueil) | aucun GA4 | 1 balise, `gtag` chargé, `collect` émis |
| `/jeux/2-ball.html` | aucun GA4 | 1 balise, `gtag` chargé, `collect` émis |
| `/blog.html` (l'avait déjà en dur) | 1 balise | **1 balise** — la garde anti-doublon tient |

Le correctif `clip()` sur les méta-descriptions **n'a pas encore d'effet** : il
faut régénérer les 1440 fiches. Commit à part, non fait.

## C. Diagnostic récupéré, et corrigé là où il avait vieilli

`docs/DIAGNOSTIC-INSCRIPTIONS-2026-07.md`, avec un bandeau qui dit ce qui a
changé depuis le 8 juillet, et deux sections réécrites sur mesure réelle :

- **§3** : les 7 redirections « pendantes » sont fermées — **11/11 en 301**.
  L'énigme `gym` est résolue : il pointe vers `/apps/transitions/`, l'app avait
  été renommée et le sous-domaine était resté sur l'ancien nom.
- **§4** : les deux risques SEO sont **écartés**. Le `robots.txt` live est
  exactement celui du dépôt (`Allow: /`, aucun `Disallow: /`) — l'apex n'étant
  pas en proxy Cloudflare, aucun contenu managé ne peut se préfixer. Sitemaps 200.

Ce qui reste intégralement valide, et la raison de la récupération : le script
`firebase-admin` du §1 et l'arbre de décision du §5.

**Une remarque qui vaut pour la suite** : ce document soupçonnait deux causes
techniques, toutes deux fausses. La vraie cause candidate, qu'il ne pouvait pas
voir depuis son conteneur sans réseau, est que **les surfaces d'entrée
n'étaient pas mesurées du tout**. Corollaire à retenir avant de lire le moindre
rapport : **les chiffres GA4 antérieurs au 13 août 2026 ne sont pas comparables
à ceux d'après.**

## D. `claude/conversion-cta` — NON fusionnée, matière première du LOT 2

Décision de Joey. La branche reste en place, intacte.

**Ce qu'on garde** : l'idée. Un bandeau « Crée ton compte » permanent et non
fermable en bas des 1440 fiches — la surface SEO dominante n'a aujourd'hui
aucune invitation permanente à s'inscrire. Le module émet `locked_view` et
`locked_click_signup` avec `source: 'jeu'`, et disparaît pour les connectés.

**Ce qu'il faut réécrire avant de le poser** :

1. **`zts-jeux-cta.js:54` injecte un `@import` Google Fonts en JS**, tirant
   **Nunito**. Or `zts-newsletter.js:123` documente le retrait de ce même motif
   le 9 août : Nunito est sortie du site le 4 août, et l'`@import` injecté par
   JS avait échappé au balayage des polices du 8 août, qui ne visait que les
   `<link>`. Fusionner referait exactement ce qui vient d'être défait, sur
   **1440 pages au lieu de 26**. Les polices doivent venir des tokens locaux.
2. **« 328 profs » codé en dur**, deux fois. Le worker
   `zone-subscriber-count.zts-ccd.workers.dev` répond `total: 335` et existe
   déjà. Même famille de défaut que le « 2 300+ » de `firebase-auth.js`.
3. **Un seul tir d'événement par intention.** Ce module ajoute un sixième
   émetteur de `locked_click_signup` ; à croiser avec le double comptage relevé
   au §1 avant de brancher quoi que ce soit.

## E. Ménage à faire — traces de mes essais en production

Quatre documents de test dans `leads`, à supprimer par la console Firebase.
Tous portent le domaine `@zonetotalsport.invalid`, qui ne peut pas exister :

```
EuSp41vuVtTnhWBD5KXr   audit-lot0-test@zonetotalsport.invalid
l3ksfxUaB9sJMMTsIxLL   audit-lot0-sonde-avant@zonetotalsport.invalid
sIpB6v6VFbj9evO73nDE   audit-lot0-sonde-apres@zonetotalsport.invalid
(+ 1 doc)              audit-lot0-bout-en-bout@zonetotalsport.invalid
```

Filtre d'export : exclure `email` se terminant par `.invalid`.
Un cinquième essai (`audit-lot0-chemin-echec@…`) n'a **pas** été écrit — c'était
le test du chemin d'échec, Firestore était cassé volontairement.

## F. État des blocages du LOT 1

| # | Blocage | État |
|---|---|---|
| 1 | Test iPhone réel du tunnel | **ouvert — Joey**, 15 min |
| 2 | Resend / newsletter | **RÉGLÉ** (`a4dc20c`) |
| 3 | GA4 absent de l'accueil et des fiches | **RÉGLÉ** (`ea9188a`) |
| 4 | Les trois nombres du tunnel | **ouvert — Joey**, clé de compte de service |

**Il ne reste que les deux points qui ne dépendent que de toi.** Tout le reste
est en place : la CI couvre la racine, l'authentification est propre, les
courriels ne se perdent plus, et les surfaces d'entrée sont enfin mesurées.

Une précaution avant de lire les premiers chiffres : laisse **au moins une
semaine pleine** de données post-13 août avant de conclure quoi que ce soit du
funnel. Avant cette date, l'instrument ne regardait pas là où arrive le monde.
