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

## Vague B — les notes, et la survie au plantage (24 août 2026)

**Commits :** `9d99c3fe` (règles) · `0fe8128b` (app)

### Règles Firestore — non déployées

Deux blocs ajoutés à `firestore.rules`, +53 lignes, aucune ligne existante
touchée :

- `rencontres/{id}` — owner-only via le champ `uid`, patron `performances` /
  `plans` / `inventaires`. Décision 1.
- `rencontresDossiers/{uid}` — **extension de la décision 1, signalée.** Il
  faut un endroit où vit un dossier **vide** : celui que l'usager vient de
  créer et qui ne contient encore aucune rencontre. Le déduire du champ
  `dossier` des rencontres ne le permet pas — il disparaîtrait au
  rechargement. Un seul document par usager, dont l'identifiant **est** son
  `uid`, donc une règle plus stricte que l'autre : elle s'appuie sur
  l'identifiant et non sur un champ.

### Déploiement — FAIT le 24 août 2026

Déployé depuis `~/dev/zts-rencontres`, branche `app/rencontres`, jamais depuis
`main`. `firestore.rules compiled successfully` puis `released rules
firestore.rules to cloud.firestore`.

**Vérification préalable, avant d'envoyer quoi que ce soit.** Déployer des
règles remplace le ruleset **entier** de la production : une branche en retard
sur `main` republierait les anciennes règles des autres apps. C'est le piège
de juillet, nommé au §1 du cahier. Deux contrôles :

1. `git log $(git merge-base origin/main HEAD)..origin/main -- firestore.rules`
   → **vide**. Le fichier n'a pas bougé sur `main` depuis ma base.
2. `git diff origin/main -- firestore.rules`, commentaires et lignes vides
   retirés → **7 lignes, toutes en `+`**, exactement les deux blocs. Zéro
   suppression, zéro modification ailleurs.

### Vérification des règles déployées — 15 cas, 0 échec

Jouées contre le ruleset **déployé**, via l'API `firebaserules …:test` — celle
que le bac à sable de la console Firebase utilise. Elle simule un `uid`
arbitraire, donc aucun compte n'a été créé.

| Cas | Attendu | Résultat |
|---|---|---|
| A crée / relit / modifie / supprime **sa** rencontre | ALLOW | ✅ ×4 |
| B lit / modifie / supprime la rencontre de **A** | DENY | ✅ ×3 |
| B crée une rencontre **au nom de A** | DENY | ✅ |
| Anonyme lit / crée une rencontre | DENY | ✅ ×2 |
| A lit et écrit **ses** dossiers | ALLOW | ✅ ×2 |
| B lit / écrit les dossiers de **A** | DENY | ✅ ×2 |
| A écrit sous `users/A/rencontres/…` | DENY | ✅ |

**La lecture croisée entre deux `uid` est refusée dans les deux collections.**

Le dernier cas est la preuve du §2B du prescan : le chemin écarté,
`users/{uid}/rencontres/{id}`, est bien **refusé** même pour son propre
propriétaire. La décision 1 n'était pas une préférence de style — l'autre
chemin ne fonctionnait pas.

### L'app

`dataStore.js` (428 l.) est le seul fichier qui parle à Firestore ; `app.js`
ne connaît que `RencData.*`.

- Dossiers, liste triée par date, filtre par dossier.
- Éditeur de notes : titres, listes, gras, cases à cocher. Collage assaini.
- **Autosauvegarde locale toutes les 10 s**, écriture Firestore au blur d'un
  champ et au bouton. Écrire chez Firestore toutes les 10 s ferait 360
  écritures facturées pour un comité d'une heure.
- **Restauration après plantage** : le brouillon local porte son horodatage et
  gagne sur la copie serveur quand il est plus récent. Il n'est effacé
  qu'après une écriture réussie.
- Le brouillon d'une rencontre neuve **déménage** au premier enregistrement,
  sinon il ressuscite au chargement suivant comme un doublon.

`verifie-habillage.py` : 0 bloquant.

---

## Tour visuel des vagues A et B (24 août 2026)

Chrome, `http://localhost:8796`, 1280 px puis 375 px. **Commit `bf587060`.**

### Deux vrais défauts, corrigés

1. **Le bouton d'enregistrement mentait sur une rencontre neuve** — il
   affichait « ✓ Enregistré » dès l'ouverture d'une fiche vide. Vrai au sens
   technique, faux au sens de qui le lit : rien n'avait été écrit nulle part.
   Troisième état ajouté, `marqueNeutre()`.
2. **Le tiroir mobile s'ouvrait sous le chrome du site** — à 375 px, `z-index`
   45 le plaçait sous `.zts-header` (200), `.zts-topbar` (210) et le casier du
   shell (340). « Mes dossiers », le bouton de création et les deux dossiers
   étaient recouverts : tout ce pour quoi on ouvre le tiroir. Passé à **9400**,
   juste sous `.ztsm-mob` (9500), le tiroir mobile du site. La plage 300-399 du
   shell reste vide de notre côté.

### Deux fausses alertes, écartées à la mesure

Notées pour que personne ne les rouvre :

- Le tiroir *semblait* ne pas s'ouvrir. Les lectures tombaient pendant la
  transition de .22 s, et `getComputedStyle` rend alors la valeur interpolée.
  Transitions coupées : −316 px fermé, 0 ouvert, −316 refermé.
- Les accents *semblaient* manquer dans le titre en LuckiestGuy. Comparé au
  pixel sur canvas : « É » fait 1298 pixels contre 1150 pour « E », et son
  sommet monte de 17 px. L'accent est là — la capture à 800 px était trop
  petite.

### Vérifié

Mur affiché en anonyme · les deux jeux d'onglets (un seul panneau visible,
`aria-selected` cohérent) · tiroir à 375 px, aucun débordement horizontal ·
sous-titre du micro dans **les deux branches** (globales supprimées puis
`app.js` rejoué : « transcription à la fin », et le mot « repli » absent du
rendu) · polices servies depuis `/fonts/`, zéro requête Google · 12 commandes
désactivées nommant chacune sa vague.

**Console :** 3 erreurs, **aucune de l'app** — `zone-subscriber-count` (CORS,
origine `localhost`) et un 429 du même hôte. `apps/inventaire` sort les mêmes
sur ce serveur : c'est le chrome partagé, pas nous.

---

## Vague C — le micro (24 août 2026)

**Commit :** `2ce8e51b` · `transcription.js` (318 l.) + panneau + câblage.

Consentement mémorisé, `MediaRecorder` toujours actif, texte en direct quand
le navigateur le porte, minuteur, redémarrage sur `onend`.

### Ce qui a demandé le plus d'attention

- **Le format audio ne se devine pas.** Un `mimeType` non supporté passe à
  `MediaRecorder` sans erreur **et produit un fichier vide**. On interroge
  `isTypeSupported` (webm/opus, puis mp4/aac pour Safari) et on relit
  `recorder.mimeType`, que le navigateur a pu changer.
- **Tranches de 5 s, pas un seul bloc final.** Un onglet qui meurt à la 58e
  minute ne doit pas emporter 58 minutes d'audio.
- **Chrome coupe la reconnaissance vocale sur les silences**, et une rencontre
  *est* faite de silences. Relance sur `onend`, avec un compteur : six relances
  qui retombent aussitôt = elle ne repartira pas.
- **`stop()` sur un enregistreur en pause** ne déclenche pas toujours un
  dernier `ondataavailable` : on reprend une fraction de seconde avant
  d'arrêter. Et le flux est coupé piste par piste, sinon la pastille rouge de
  l'onglet reste allumée.

### Banc

Le micro est **bloqué dans le panneau de prévisualisation**. Le chemin refusé
est donc vérifié pour de vrai : message exact, boutons rendus à leur état.

Pour le reste, la **source — et elle seule** — a été remplacée par un flux
synthétique d'`AudioContext` : un vrai `MediaStream`, aucun périphérique, et
tout le chemin de production derrière.

| | |
|---|---|
| Démarrer | état `enregistre`, pastille allumée |
| 3 s | `00:03` |
| Pause 1,5 s | `00:03` — **le minuteur ne compte que l'enregistré** |
| Reprise | `00:05` |
| Terminer | état `arrêt`, pastille éteinte |
| Blob | **113 199 octets, `audio/webm;codecs=opus`, 5 s** — concorde |

**Restent à jouer sur une vraie machine** (§11) : la dictée en français avec
accents, et le redémarrage sur `onend` avec de vrais silences.

---

## Vague D — Whisper (24 août 2026)

**Commits :** `153b0e46` (worker) · `9d9e043a` (navigateur)

### Worker

- **Binding Workers AI dans les trois environnements.** Le bloc de tête ne
  suffit pas : `wrangler deploy --env production` ne le voit pas. Essai à blanc
  sur les trois → `env.AI  AI` chaque fois.
- **Quota en minutes d'audio**, `renc:{uid}:{jour}` dans KV, plafond
  `QUOTA_MINUTES_JOUR = 120`. **Séparé de celui du générateur** : clé, plafond
  et remise à zéro différents — ils ne peuvent pas se vider l'un l'autre.
- Débit **après** succès ; plafond vérifié **avant** l'appel.
- Corps en **WAV brut**, pas en JSON : 9,6 Mo par segment, +3,2 Mo si base64,
  sur un worker qui a 128 Mo.
- `whisper-large-v3-turbo` d'abord (il accepte l'indication de langue), repli
  automatique sur `@cf/openai/whisper`.

### Déployé le 24 août 2026 — version `d766b69d`

**Contrôle avant l'envoi.** `origin/main` n'avait pas touché à
`cf-worker/generateur/` depuis ma base ; le diff est **additif à 100 %** —
288 insertions, **0 suppression** — et ne contient que le binding AI, la route
Whisper et le quota en minutes.

### ⚠ Un défaut trouvé en éprouvant pour de vrai

`vad_filter: "true"` **entre guillemets** fait répondre 400 à Workers AI :
*Type mismatch of '/vad_filter', 'boolean' not in 'string'*. Comme l'échec du
modèle de tête est rattrapé par le repli — c'est son rôle — **chaque
transcription serait silencieusement partie sur `@cf/openai/whisper`**. Aucune
erreur à l'écran, aucune ligne en console : juste un modèle plus lent et sans
indication de langue, pour toujours.

Mesuré sur une phrase fr-CA de 9,4 s synthétisée en local (voix Amélie, fr_CA),
16 kHz mono 16 bits — le format exact que produit le client :

| | |
|---|---|
| **Dit** | Premier point à l'ordre du jour : l'horaire des surveillances de la cour pour la période trois. Marie-Ève s'occupe du gymnase, et François vérifie le matériel avant la récréation. |
| **turbo, `language:fr`** — 1 219 ms | …période **3**. Marie-Ève s'occupe du gymnase, et François vérifie le matériel… → **deux écarts**, le « : » en virgule et « trois » en 3 |
| **repli** — 5 928 ms | **Premiers points**… l'horaire des **surveillance**… **Marie-Eve Socut du** gymnase, et **François Verifi** le matériel… |

Quatre fois et demie plus lent, et les deux prénoms abîmés. L'indication de
langue n'était pas un détail de confort. **Corrigé** (`bb2a1361`) et redéployé.

`@cf/openai/whisper-large-v3-turbo` **est présent sur le compte** (vérifié à
`wrangler ai models`).

### Après le déploiement

- `GET /health` → 200, `zts-generateur 0.4.0 prod`.
- `POST /rencontres-transcription` **sans jeton** → **401**, `UNAUTHORIZED`.
- **Le générateur passe toujours** : une génération anonyme complète, modèle
  `claude-haiku-4-5`, et son quota mensuel répond `{scope:anon, used:2, max:3}`.
- **KV, namespace de production** : une seule clé, `anon:<ip>:2026-08` — celle
  du générateur. **Aucune clé `renc:`**, ce qui est juste : aucune
  transcription n'est encore passée par la route. Les deux compteurs vivent
  dans le même namespace mais dans des espaces de clés séparés.

> ⏳ **Le débit du quota en minutes n'est pas encore constaté en vrai.** La
> route exige un jeton Firebase, et je ne crée pas de compte. Il faut un jeton
> de Joey — sur `zonetotalsport.ca`, connecté, dans la console :
> ```js
> await firebase.auth().currentUser.getIdToken()
> ```
> Puis la clé se lit :
> ```
> wrangler kv key get "renc:<uid>:2026-08-24" --namespace-id 3f1ca3dec85e4472930beea526ff9273 --remote
> ```

### Navigateur — mesuré

WAV stéréo 44,1 kHz de 12 minutes (121 Mo) passé dans le vrai chemin :

| | |
|---|---|
| Après décodage | 1 canal, 16 000 Hz, 720 s |
| Mémoire | **242 Mo évités, 44 Mo occupés** |
| Segments | 298 + 300 + 122 s = **720 s, rien de perdu** |
| Taille des segments | 9,09 / 9,16 / 3,72 Mo — sous le plafond de 12 |
| Coupes | **8,02 s dans le cycle de 10 s** — dans le creux de silence |
| Temps | décodage 3,4 s, découpage 0,7 s |

La coupe au silence balaie 5 s de part et d'autre par fenêtres de 20 ms.
**Pas de chevauchement** : il ferait apparaître les mêmes mots deux fois, ce
qui se voit plus qu'une coupe nette.

Le micro et le fichier partagent le **même tuyau** : c'est ce qui rend le mode
micro identique sur Safari et sur Chrome.

---

## Vague E — les deux traitements IA (24 août 2026)

**Commit :** `ea187894` · **Déployé** le même jour, version `575922d7`.

Trois modes : `verbatim` (texte), `structure` (JSON normalisé), `passage`
(3-5 phrases). **Quatrième compteur, encore distinct** : `rencia:{uid}:{jour}`,
plafond 40/jour.

**Le mot à mot part par blocs.** 90 min ≈ 13 000 mots ≈ 18 000 jetons en
sortie : aucun plafond ne tient ça, et le demander rendrait un texte coupé au
milieu d'une phrase — la pire des sorties, parce qu'elle *a l'air* complète.
Découpage en blocs de ~1 500 mots, coupés sur une fin de phrase.

Éprouvé sur 12 000 mots : **8 blocs, 7 coupes sur 7 tombent sur une fin de
phrase, 0 mot perdu**, plus gros bloc 8 374 car. (plafond worker 24 000). Cas
limites tenus : vide, 3 mots, 3 000 mots sans ponctuation.

### Contrôle de déploiement

`origin/main` n'avait pas touché à `cf-worker/generateur/`. Diff **552
insertions, 0 suppression** : deux blocs de route + un import dans le point
d'entrée, trois variables et le binding `[ai]` dans les trois environnements,
et deux fichiers neufs. Rien d'autre.

### Appels témoins après déploiement

| | |
|---|---|
| `/health` | 200 — `zts-generateur 0.4.0 prod` |
| `/generate` | génération complète, `claude-haiku-4-5`, quota `{anon, 3/3}` |
| `/inventaire-vision` sans jeton | **401** — garde intacte |
| `/decodage` mauvaise origine | **403** |
| `/decodage` bonne origine | réponse réelle, `claude-sonnet-4-6` |
| `/rencontres-transcription` sans jeton | **401** |
| `/rencontres-ia` sans jeton | **401** |

**KV de production : deux clés, `anon:<ip>:2026-08` et `deco:<ip>:2026-08-25`.**
Les compteurs ne se touchent pas. Aucune clé `renc:` ni `rencia:` — juste,
puisque rien n'est encore passé par les routes authentifiées.

> ⚠ **J'ai consommé le 3ᵉ et dernier essai anonyme du générateur pour cette IP
> ce mois-ci** (`used: 3/3`). C'est le prix de l'appel témoin ; le compteur
> repart le 1er septembre.

---

## Banc d'essai authentifié (25 août 2026)

Joué avec un jeton Firebase fourni par Joey — **son compte personnel**
(`zts@hotmail.ca`, uid `HuhfoyPfTRbjA22Ee98MTCLo1m72`), pas un compte jetable.
Le jeton a été effacé du disque après les essais.

> ⚠ Cloudflare a d'abord répondu **1010** aux appels : sa vérification
> d'intégrité de navigateur refuse la signature de `python-urllib`. Les essais
> passent par `curl`, comme les appels témoins.

| Essai | Résultat |
|---|---|
| `devis` 9 s | `0.2` min demandées, 120 restantes, `suffisant: true` |
| **Segment audio réel** — WAV fr-CA 9,4 s, 16 kHz mono, 301 538 o | **`@cf/openai/whisper-large-v3-turbo`** en 2 726 ms |
| Texte rendu | « Premier point à l'ordre du jour, l'horaire des surveillances… Marie-Ève s'occupe du gymnase, et François vérifie le matériel avant la récréation. » |
| **IA mot à mot** | hésitations retirées (« euh », « fait que là », « pis »), ponctuation et paragraphes ajoutés, rien de reformulé |
| **IA structuré** | résumé, 4 points, 1 décision, 1 action avec responsable, 2 reportés |
| Quota minutes en KV | `renc:<uid>:2026-08-25` = **0.2** |
| Quota IA en KV | `rencia:<uid>:2026-08-25` = **2** |
| Écriture Firestore réelle | **200**, relecture **200** |
| Écriture au nom d'un autre `uid` | **403 `PERMISSION_DENIED`** |
| Sans jeton | **401** sur les deux routes |

Les quatre compteurs coexistent dans le même namespace sans se toucher :
`anon:` (générateur), `deco:` (décodage), `renc:` et `rencia:`.

**Ménage fait et vérifié** : le document d'essai est supprimé,
`rencontres/` rend **0 document** pour ce `uid`, et `rencontresDossiers/<uid>`
répond `NOT_FOUND` — je n'en ai jamais créé.

*Note : après suppression, une relecture rend **403** et non 404. C'est normal —
la règle de lecture s'appuie sur `resource.data.uid`, qui n'existe plus. Le 403
confirme la disparition.*

### ⚠ Un défaut que seule l'épreuve réelle pouvait montrer

Sur « réserve le gymnase **avant le 30 septembre** », le modèle a rendu
l'échéance **2024-09-30** — une date **passée**, dont il a inventé l'année
faute de savoir quand la rencontre avait lieu.

Ce n'est pas cosmétique : une échéance au passé arrive dans « Mes actions »
sous l'étiquette **en retard**, en rouge, en tête de liste. L'usager voit une
urgence qui n'existe pas, sur une action qu'il vient de créer.

**Deux verrous** (`59a988fe`, déployé en `19cc6c11`) : la date de la rencontre
part avec la demande et ancre la consigne, **et** le worker jette toute
échéance antérieure à la rencontre — la consigne guide le modèle, le filtre ne
lui fait pas confiance.

| Même extrait, même modèle | Échéance rendue |
|---|---|
| sans date — « avant le 30 septembre » | `2025-09-30` ❌ |
| sans date — « la semaine prochaine » | *(vide)* |
| avec `dateRencontre: 2026-08-25` — « avant le 30 septembre » | **`2026-09-30`** ✅ |
| avec `dateRencontre: 2026-08-25` — « la semaine prochaine » | **`2026-09-01`** ✅ |

L'ancrage ne corrige pas seulement l'année : il rend exploitables les dates
relatives, que le modèle laissait tomber faute de point de départ.

---

## `politique.html` — section 14 (25 août 2026)

Commit atomique, annulable seul. La formulation est **celle de la section 9 de
l'article, mot pour mot** — l'article dit s'aligner sur la politique, il faut
donc que les deux disent la même chose, sinon c'est l'article qui devient
menteur.

Une précision existe ici et pas dans l'article, parce que c'est sa place : la
transcription passe par un service d'IA hébergé par **Cloudflare**, le temps de
la conversion seulement. Une politique nomme son sous-traitant ; un article de
blogue n'a pas à le faire.

Ajoutée en **14**, pas insérée près de la « Conservation » : l'y insérer aurait
obligé à renuméroter six sections et six ancres, et les liens `#s8` à `#s13`
qui circulent ailleurs seraient tombés à côté.

---

## Banc d'essai du §11 — ce qui est joué

| Contrôle | Résultat |
|---|---|
| `verifie-habillage.py` | **0 bloquant** |
| `verifie-partage-articles.py` | **0 bloquant** sur 27 articles |
| `verifie-nouveautes.py` | **OK**, 10 mises en ligne |
| `verifie-glyphes-ztsh.py` | **OK** |
| `verifie-secrets.sh --arbre` | **OK**, 2 400 fichiers |
| Segment audio réel → Whisper | `whisper-large-v3-turbo`, 2 726 ms, texte fr-CA correct |
| Libellé « à la fin » sans `SpeechRecognition` | globales supprimées, `app.js` rejoué → libellé correct, mot « repli » absent |
| Quota minutes | `renc:<uid>` = **0.2** après 9,4 s |
| Quota IA | `rencia:<uid>` = **2** après deux traitements |
| Plafonds distincts | 4 clés KV coexistent : `anon:`, `deco:`, `renc:`, `rencia:` |
| Découpage 16 kHz mono | 12 min stéréo 44,1 kHz → **242 Mo évités**, 720 s recollés sans perte, coupes dans le silence |
| Avertissement > 90 min | affiché, **bouton toujours actif** — un avertissement qui bloque n'est plus un avertissement |
| Quota insuffisant | message distinct, **bouton désactivé** |
| Glisser-déposer entre dossiers | cible surlignée, écriture serveur, message d'état, filtre à jour |
| Recherche plein texte | « budget », mot enfoui dans les notes → la bonne rencontre, 14 cas 0 échec |
| `mailto` + copie | courriel ouvert, compte rendu complet au presse-papiers |
| **Export PDF non blanc** | règles `@media print` recopiées en écran : `html`, `body`, `.ztsh-page`, la fiche et le compte rendu **restent visibles** ; header, rail et barre d'outils disparaissent |
| Parcours anonyme jusqu'au mur | carte « Quoi de neuf » → `/apps/rencontres/` → mur affiché |
| Événements GA4 | `locked_view` et `locked_click_signup` émis |
| Règles Firestore | écriture 200, lecture croisée **403**, 15 cas au simulateur |
| Console | **aucune erreur de l'app** |
| `git diff --stat` | **25 fichiers, tous dans le périmètre du §6** |

### Deux défauts trouvés au banc, corrigés

- **« Durée détectée : 0 minute »** pour un enregistrement de 20 s. L'arrondi
  disait vrai et donnait tort : au moment où l'usager décide s'il lance, lire
  « 0 minute » fait douter que le fichier ait été lu. Devenu « moins d'une
  minute ».
- **L'échéance d'une action inventait son année** — voir le banc authentifié
  plus haut.

---

## Ce qui reste à faire, à la main — checklist

Trois essais que je ne peux pas jouer : il faut un vrai micro, un vrai
enregistrement de réunion, et un vrai compte. **Une action par ligne.** Coche à
mesure, et rapporte-moi ce que tu observes — surtout si ça diffère de ce qui
est écrit en italique.

### ⚠ D'abord : l'adresse, et pourquoi c'est celle-là

L'app n'est pas encore en production : les essais se font sur le serveur local,
déjà démarré.

> ## `http://localhost:8787/apps/rencontres/`

**Le port 8787 n'est pas un détail.** Le worker `api.zonetotalsport.ca`
n'autorise que trois origines pour les essais locaux — `localhost:8000`,
`localhost:8787` et leurs équivalents `127.0.0.1`. Depuis n'importe quel autre
port, il répond `access-control-allow-origin: https://zonetotalsport.ca` et le
navigateur **bloque l'appel avant même qu'il parte**.

Concrètement : sur un autre port, les essais 1 et 2 s'arrêteraient net à la
transcription, avec une erreur rouge en console et rien à l'écran. Vérifié le
25 août — depuis 8787, l'appel atteint le worker ; depuis 8796, non.

Si le serveur n'est plus là quand tu commences, dis-le-moi, je le relance.

### Essai 1 — La dictée québécoise (10 minutes)

*À faire sur un ordinateur, dans Chrome.*

1. Ouvre `http://localhost:8787/apps/rencontres/` et connecte-toi.
2. Clique **+ Nouvelle rencontre**.
3. Écris un titre : « Essai micro ».
4. Clique l'onglet **🎤 Micro**. → *Sous le mot « Micro », tu dois lire
   « transcription en direct ».*
5. Un encadré jaune apparaît. Coche **« J'ai compris, et j'informe les
   participants »**. → *L'encadré disparaît.*
6. Clique **▶ Démarrer**. Le navigateur demande le micro : accepte.
   → *Un point rouge clignote, le chronomètre part.*
7. **Parle une minute**, normalement, en québécois. Dis des prénoms avec
   accents (Marie-Ève, François, Josée) et une date (« avant le 30
   septembre »). **Fais deux pauses de dix secondes sans parler** — c'est le
   moment le plus important de l'essai.
   → *Le texte s'écrit à l'écran pendant que tu parles.*
8. Clique **⏸ Pause**, attends 15 secondes, clique **▶ Reprendre**.
   → *Le chronomètre s'arrête pendant la pause et repart après.*
9. Clique **⏹ Terminer**.
   → *L'app bascule sur l'onglet Importer et prépare la transcription.*
10. Attends que la barre de progression finisse, puis clique l'onglet
    **Original**.

**À me rapporter :** le texte obtenu, tel quel — copie-colle-le. Je veux voir
si les prénoms accentués passent, et **surtout si le texte continue après tes
deux silences** : c'est le redémarrage automatique que je n'ai pas pu éprouver.

### Essai 2 — Une vraie rencontre d'une heure (15 minutes, dont 10 d'attente)

*Il te faut un fichier audio d'une vraie réunion — un enregistrement Zoom ou
Teams, ou même un mémo vocal de ton téléphone. Une heure environ.*

1. Dans l'app, clique **+ Nouvelle rencontre**, puis l'onglet **📁 Importer**.
2. **Glisse ton fichier** dans le cadre pointillé.
   → *« Lecture du fichier… », puis « Découpage… ». Sur une heure d'audio, ça
   peut prendre 20 à 30 secondes — c'est ton ordinateur qui travaille.*
3. Un encadré blanc apparaît avec la durée détectée et le coût en minutes.
   → *La durée doit correspondre à la vraie longueur de ta réunion.*
   → *Si elle dépasse 90 minutes, un encadré jaune te prévient.*
4. **Note l'heure** et clique **Lancer la transcription**.
5. Laisse l'onglet ouvert et fais autre chose. → *La barre avance segment par
   segment, et le texte se remplit au fur et à mesure dans « Original ».*
6. Quand c'est fini, **note l'heure** de nouveau.

**À me rapporter :**
- la **durée du fichier** et le **temps que la transcription a pris** — c'est
  ce chiffre-là qui manque à la FAQ de l'article ;
- si le texte se **suit** d'un bout à l'autre, ou si tu vois des phrases
  coupées ou répétées entre deux morceaux ;
- le format de ton fichier (`.m4a`, `.mp3`, `.mp4`…) et s'il a été refusé.

*Ensuite, dans la même rencontre :* clique **🗂️ Structuré**, attends, et
regarde la section **Actions à faire**. → *Les échéances doivent être en 2026,
jamais dans le passé.* Rapporte-moi les actions produites.

### Essai 3 — Le tunnel d'inscription (5 minutes)

*À faire dans une fenêtre de navigation privée, pour être vraiment anonyme.*

1. Ouvre une **fenêtre privée** (⇧⌘N sur Mac, Ctrl+⇧+N sur Windows).
2. Va sur `http://localhost:8787/` — **pas** sur le vrai site : la carte
   n'y est pas encore.
3. Descends jusqu'à la section **« Quoi de neuf »**.
   → *La première carte doit être 📝 **Zone Rencontres**, datée du 25 août.*
4. Clique la carte.
   → *Tu arrives sur l'app, et le mur « Crée ton compte gratuit » s'affiche
   par-dessus.*
5. Crée un compte avec une adresse que tu contrôles (ou clique **Continuer
   avec Google**).
6. → *Le mur disparaît et l'app s'ouvre, sans que tu aies à recliquer.*
7. Clique **+ Nouvelle rencontre**, écris un titre, puis clique ailleurs.
   → *Le bouton 💾 passe de rose à « ✓ Enregistré ».*
8. **Recharge la page** (⌘R).
   → *Ta rencontre est toujours là, dans la liste de gauche.*

**À me rapporter :** si le mur s'est bien effacé tout seul après l'inscription,
et si la rencontre a survécu au rechargement. Ce sont les deux points où le
parcours peut casser.

### Si quelque chose cloche

Dans les trois essais : **fais une capture d'écran** et, si tu sais le faire,
ouvre la console (⌥⌘I, onglet *Console*) et copie-moi les lignes en rouge.
Sinon, décris simplement ce que tu vois — ça suffit.

---

## Dette v2 — décidée, non codée

**Garder l'audio en `IndexedDB` local quand le quota du jour ne suffit pas.**

Le cas : quelqu'un enregistre 38 minutes alors qu'il ne lui reste que 4 minutes
de quota. Aujourd'hui la rencontre et les notes sont enregistrées, le message
explique, et le bouton de transcription reste offert **tant que l'onglet vit**.
S'il ferme, l'audio est perdu — il faut réenregistrer.

Le faire survivre demanderait de l'écrire quelque part. **On ne le fait pas**,
et c'est délibéré : la section 14 de `politique.html` et la section 9 de
l'article promettent toutes deux que l'audio n'est jamais stocké. On ne casse
pas une promesse écrite pour un cas rare.

> ⚠ **Si cette dette est un jour levée, la section 14 de `politique.html` doit
> être réécrite avant** — et la section 9 de l'article avec elle, puisque les
> deux disent la même chose mot pour mot. Un stockage local reste un stockage :
> le dire autrement serait mentir par omission.

Les deux autres dettes du §9.5 du cahier restent inchangées : rappels d'actions
par courriel via cron, et identification des locuteurs.

---

## Ce qui reste ouvert, et qui n'appartient pas à ce chantier

- **L'angle mort de `zts-gate.js`** — le mur des apps n'émet aucun événement
  d'entonnoir, donc **26 apps sur 45 sont invisibles** dans les chiffres
  d'inscription. Chantier séparé décidé : `fix/gate-funnel`, après la mise en
  prod. À garder en tête en lisant les métriques du 28 août.
- **La source de `zts-notify`** est perdue — le dépôt porte la sortie
  d'esbuild rapatriée. Si elle réapparaît, c'est elle qu'il faut committer.
- **Les 41 apps migrées impriment une page blanche** — contourné localement
  ici et dans l'inventaire, jamais corrigé dans le shell.
- **`ipapi.co` refuse le CORS** depuis la production : les notifications du
  site n'ont plus de ville. Préexistant, sans rapport avec ce chantier.

---

## État de la branche

`app/rencontres`, worktree `~/dev/zts-rencontres`.

**29 commits · 25 fichiers · 7 107 insertions · 1 suppression** — et cette
suppression est la ligne du menu partagé qui a reçu une virgule pour accueillir
la suivante.

Vérifié : **aucun fichier hors du périmètre annoncé au §6 du prescan.**

### Déjà en production

- Règles Firestore, déployées et vérifiées en 15 cas.
- Worker `zts-generateur` version `19cc6c11` — routes Whisper et IA, binding
  Workers AI, quotas en minutes et en traitements.

### Reste à fusionner

Le reste de la branche : l'app, l'article, les quatre portes d'entrée, la
section de politique.
