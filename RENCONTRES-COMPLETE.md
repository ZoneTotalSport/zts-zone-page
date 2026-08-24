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

## Reste à la charge de Joey

- **Un slot de prévisualisation.** `preview_start` refuse — 5 serveurs pour ce
  dossier, tous appartenant à d'autres sessions. Le tour visuel de la vague A
  (mur en anonyme, deux jeux d'onglets, tiroir à 375 px, sous-titre du micro,
  console vide) n'a donc **pas** été fait. La vague A est commitée et vérifiée
  statiquement, **pas vue tourner**.
- **`PROMPT-ZONE-RENCONTRES-V2.md`** — le collage est arrivé vide. Le fichier
  n'a pas été recréé. §10 (brief de l'article) et §11 (banc d'essai) manquent.
- ~~Déployer les règles Firestore~~ — **fait le 24 août**, et vérifié en 15
  cas contre le ruleset déployé.
- **Je ne crée pas de compte.** Le tunnel anonyme → inscription → retour app
  reste à ta charge, comme les 4 tests de `LOT1-COMPLETE.md`.
- ~~Déployer `zts-generateur`~~ — **fait**, version `d766b69d`.
- ~~Confirmer `whisper-large-v3-turbo`~~ — **présent et éprouvé**.
- **Un jeton Firebase**, pour constater le débit du quota en minutes (voir
  vague D). Je ne crée pas de compte.
- **Le micro sur une vraie machine** : dictée fr-CA avec accents, et les
  silences d'une vraie rencontre pour éprouver le redémarrage sur `onend`.

---

## Trouvé au passage — HORS PÉRIMÈTRE, non corrigé

⚠ **Un jeton de bot Telegram est écrit en clair dans `telegram-notify.js`**
(ligne 9, `var BOT_TOKEN = '…'`). Le fichier est **commité** et servi en
JavaScript de navigateur sur les pages du site : n'importe quel visiteur peut
le lire dans la source et prendre la main sur le bot — envoyer des messages,
lire les mises à jour.

Repéré parce que le jeton apparaît **dans la console** quand l'appel échoue
(CORS sur `localhost`), sur `apps/inventaire` comme ailleurs.

`_scripts/verifie-secrets.sh` ne l'attrape pas : ses 9 motifs ne couvrent pas
la forme d'un jeton Telegram (`<chiffres>:<base64url>`).

Fichier partagé, hors du périmètre de ce chantier : **non corrigé**. La marche
à suivre est la même que pour n'importe quel secret publié — révoquer le jeton
auprès de `@BotFather`, le sortir du client (un Worker le porte, comme
`ANTHROPIC_API_KEY` pour `zts-generateur`), puis ajouter le motif au contrôle
de secrets. Décision de Joey.
