# PRESCAN — MANDAT I (Planificateur ZTS)

**Phase 0, LECTURE SEULE. Aucune ligne de code applicatif écrite.**

---

## ⚠ EN TÊTE : LES DEUX CONSIGNES DE JOEY

**1. Le scan porte sur un SHA précis.**

| | |
|---|---|
| **Branche** | `proto/g2` |
| **SHA scanné** | **`8ce14d5c`** (= `origin/proto/g2`, local et distant identiques) |
| **Date du scan** | 31 août 2026 |
| **Arbre de travail** | `apps/planificateur/` **propre** — `git status` ne montre aucun fichier suivi modifié sous ce chemin au moment du scan |

**REVALIDATION OBLIGATOIRE.** Les mandats **G3-STABILISATION** (bug P0
d'affichage au scroll, build G3 réellement servi) et **G3-FICHE** (fiche de cours
en 2 modes) touchent les mêmes fichiers. Quand les deux seront CLOS, **rejouer ce
prescan sur le diff, pas sur tout le dépôt** :

```bash
git diff --stat 8ce14d5c..HEAD -- apps/planificateur/
```

Chaque section ci-dessous porte un **bloc « À REVALIDER »** qui nomme les
fichiers dont un changement invaliderait ses conclusions. Si le diff ne touche
aucun de ces fichiers, la section tient telle quelle.

**2. Aucun commit sauf ce fichier.** La Phase 0 ne produit **que**
`PRESCAN-MANDAT-I-2026-08.md`. Aucun autre fichier n'est créé, modifié ou
supprimé. Aucune branche, aucune PR.

---

## 0. Vérification des acquis (§1) contre le dépôt réel

Confirmé sauf mention contraire. **Les divergences sont signalées, pas corrigées.**

### 0.1 Confirmés

| Acquis (§1) | Vérification | État |
|---|---|---|
| Catalogue **1439 jeux** | `_data/jeux-merged.json` = 1439 objets | ✅ |
| **360 cours ÉP**, 21 champs dont `pfeq` | `ep-{maternelle,1er,2e,3e}.json` = 4 × 90 = 360 ; 21 clés sur les 90 fiches vérifiées | ✅ |
| Mini-banques **61 camps / 64 sdg / 41 eps** | `apps/planificateur/data/mini-banques.json` = **147 documents** : 42 camps + 45 sdg + 41 eps + **19 partagés** `["camps","sdg"]`. 42+19 = 61 ✓ · 45+19 = 64 ✓ · 41 ✓ | ✅ (147 docs, pas 166 — les 19 partagés comptent double par construction) |
| **Badges par univers camps 970 / sdg 177 / eps 1274** | Catalogue seul : camps 909, sdg 113, eps 1233. Écarts = **61 / 64 / 41**, exactement les mini-banques. Le badge = catalogue + mini-banque | ✅ (et la preuve arithmétique est propre) |
| `dataStore.js` promesse mutualisée | `apps/planificateur/dataStore.js` (218 l.) | ✅ intact |
| **`pfeq`/`niveau` vides dans les mini-banques = CORRECT** | 0/147 sur les deux champs | ✅ conforme |
| Deux mécanismes de médias distincts | `app-v2.js` et `semaine-grid.js` | ✅ |
| Worker R2 sans référence au dépôt | `cf-worker/jeux-data/wrangler.toml` : aucun `GITHUB_REF`/`GITHUB_REPO` | ✅ |

### 0.2 DIVERGENCES — signalées, non corrigées

**D-1. `sdg.json` n'est pas une banque de cours.** Le §1.2 écrit
« 360 cours ÉP complets dans `_data/planification/ep-*.json` **+ `sdg.json`** ».
En réalité `sdg.json` contient **200 JOURNÉES** de service de garde, de structure
totalement différente : `{jour, semaine, jourSem, label, theme, blocs:{matin:{plage,items[]},…}}`.
Aucun champ commun avec les cours ÉP (pas de `pfeq`, pas de `niveau`, pas de
`materiel`). **Conséquence pour le lot B** : l'ancrage IA ne peut pas traiter les
560 fichiers comme un corpus homogène. Deux corpus, deux gabarits de contexte.

**D-2. Le vocabulaire des tags « GELÉ » (§1.1) ne décrit PAS le catalogue.**
Le §1.1 gèle `materiel` = aucun/leger/specifique, `espace` = 3 valeurs,
`energie` = calme/modere/actif. Mesuré sur les 1439 :

| Champ | Rempli | Réalité |
|---|---|---|
| `materiel` | 1414/1439 (98 %) | **texte libre** — « Tapis de sol,sifflet », « Dossard pour le(s) chat(s) », « 1 grand parachute »… |
| `espace` | 953/1439 (66 %) | **texte libre** — « Gymnase », « Gymnase ou Extérieur », « Gymnase / Extérieur », « Gymnase ou terrain extérieur » (quatre écritures de la même chose) |
| `energie` | **0/1439** | le champ **n'existe pas** dans le catalogue |
| `pfeq` | **0/1439** | le champ **n'existe pas** — voir D-3 |
| `niveau` | 1003/1439 (70 %) | texte libre, ~40 valeurs distinctes |
| `dureeMin` | 1439/1439 | ✅ numérique et exploitable (15 = 1165, 10 = 194, 20 = 41) |
| `ageMin` | 718/1439 (50 %) | ✅ numérique |
| `univers` | 1439/1439 | ✅ tableau propre |

Le vocabulaire gelé s'applique aux **mini-banques** (via `tags`), pas au
catalogue. **C'est le risque n° 1 du lot B** — voir §9, R-1.

**D-3. Le catalogue A une couche PFEQ, sous un autre nom.** `pfeq` est absent,
mais `intentionsC1`, `intentionsC2`, `intentionsC3` sont remplis sur **1439/1439**
(texte rédigé, ex. « Exécuter des actions motrices (lancer, esquiver, attraper) »).
**B4 (étiquetage PFEQ) ne part donc pas de zéro** : il normalise un texte
existant vers `["C1","C2","C3"]`, il n'invente pas. À dire à Joey avant de coder
B4 — ça change complètement le coût et le risque de la passe.

**D-4. Le §1.4 est périmé** — déjà acté par l'amendement §10.2. La table de
correspondance complète est au §7 ci-dessous.

### À REVALIDER
`_data/jeux-merged.json` · `_data/planification/*.json` ·
`apps/planificateur/data/mini-banques.json` · `apps/planificateur/dataStore.js`

---

## 1. Canal courriel — **IL EXISTE, ET IL EST DÉPLOYÉ**

**Réponse directe : oui. C4 peut viser la v2 dès la v1, sans nouveau service.**

### 1.1 Ce qui existe

| Worker | Fichier | Route | Auth | État |
|---|---|---|---|---|
| **`zts-notify-coordo`** | `cf-worker/notify-coordo/src/notify-coordo-worker.js` | `coordo.zonetotalsport.ca` (custom domain) | **jeton Firebase `Authorization: Bearer`** | **DÉPLOYÉ** — `GET https://coordo.zonetotalsport.ca/` répond **405** (Method Not Allowed = le Worker est là et n'accepte que POST) |
| `zts-send-pdf` | `cf-worker/send-pdf-worker.js` | `zonetotalsport.ca/api/send-pdf` | aucune (CORS `*`) | déployé au tableau de bord, pas de `wrangler.toml` au dépôt |

Les deux passent par **Resend**, secret `RESEND_API_KEY`, domaine d'envoi
`noreply@zonetotalsport.ca` **déjà vérifié**.

### 1.2 Pourquoi `zts-notify-coordo` est le bon modèle pour C4

Sa règle de sécurité est exactement celle qu'exige un journal d'incidents :
**le destinataire n'est jamais fourni par le client.** Le Worker lit
`organisations/{orgId}` dans Firestore avec le jeton de l'appelant. Pas de
vecteur de spam vers une adresse arbitraire.

**⚠ Pour C4, cette règle se retourne contre nous** : le courriel du syndicat est
saisi par l'enseignant dans les RÉGLAGES du module (§C4) — donc **fourni par le
client**. Recommandation au §9, R-4.

### 1.3 Coût
Resend : palier gratuit 3 000 courriels/mois, 100/jour. Le volume C4 (quelques
envois par enseignant par an) tient **très largement** dans le gratuit. **Aucun
coût nouveau.**

### 1.4 Ce qui reste à trancher
La **pièce jointe PDF**. `zts-notify-coordo` envoie du HTML sans pièce jointe.
Resend accepte les pièces jointes en base64 dans le même appel — l'ajout est
mineur, mais **le PDF doit être fabriqué côté client puis téléversé au Worker**
(le Worker n'a pas de moteur PDF). Voir §9, R-4.

### À REVALIDER
`cf-worker/notify-coordo/**` · `cf-worker/send-pdf-worker.js`
(Le test HTTP est à rejouer : un Worker peut être retiré entre deux scans.)

---

## 2. Carte de l'existant — lots A, B, C

Légende : **EXISTE** · **PARTIEL** · **ABSENT**

### 2.1 Lot A

| Fonction | État | Où | Note |
|---|---|---|---|
| A1 dossier de remplacement | **ABSENT** | — | Aucune trace. Tout est à construire, mais **sans stockage** (§A1) : c'est une vue d'impression sur des données déjà là |
| A1 · consignes sécurité / emplacement matériel (champ RÉGLAGES) | **ABSENT** | RÉGLAGES du proto = `apps/planificateur/proto/index.html:427`, rempli par 3 modules (`proto-fusion.js:537`, `proto-horaire.js:84`, `proto-annee.js:138`) | Le champ libre n'existe pas ; l'écran d'accueil, oui |
| A2 fiche élève sécurité | **PARTIEL** | `apps/planificateur/app.js:206` — liste de particularités avec `{k:'allergie', label:'Allergie', emoji:'🥜'}` ; `app.js:389` mini-badges sous le nom ; `app.js:1172` champ `noteParticuliere` (« allergie exacte, médication, déclencheur ») | **Le mécanisme de picto existe déjà.** A2 ajoute des champs (`restrictions`, `pi`, `anniversaire`, `besoins`) et le **masquage TBI**, qui lui est absent |
| A3 évaluations sur le calendrier | **PARTIEL** | collection `evaluations` lue en `app-v2.js:1106` (`where('groupeId','==',…)`) | **Aucune date** dans le modèle actuel — le champ est à ajouter (le §A3 l'anticipait) |
| A4 objectifs de l'année | **ABSENT** | — | |
| A5 impression A4 sélective | **PARTIEL** | `apps/planificateur/index.html:740` (`@media print` global, masque topbar/dock/tabs) ; `semaine-grid.js:170` ; `proto.css:492` | **Un seul bloc print pour toute l'app**, pas un par vue. Le §A5 (« aucune règle CSS écran modifiée ») est tenable : on ajoute des blocs, on ne touche pas l'existant. ⚠ Voir R-5 : le shell casse l'impression sur les 41 apps migrées — le Planificateur **n'est pas** dans ce lot (il ne monte pas le shell), donc il est épargné |
| A6 banque de messages | **ABSENT (JSON)** / **EXISTE (canal)** | collection `messages` + règles `firestore.rules:167` (coordo ↔ animateur, `delete: if false`) | Le canal de messagerie existe ; **la banque de ≥ 60 messages typés n'existe pas** |
| A7 modèles familles | **À BRANCHER** | `apps/studio-jeu/` | Non ouvert dans ce prescan — à trancher, voir §9 Q-3 |

### 2.2 Lot B

| Fonction | État | Note |
|---|---|---|
| B0 Worker `zts-ia` | **LE MODÈLE EXISTE, PRESQUE COMPLET** | **`cf-worker/generateur/`** fait déjà 90 % de B0 : jeton Firebase, `FIREBASE_PROJECT_ID`, **quotas** (`QUOTA_FREE_MONTH=10`, `QUOTA_ANON_MONTH=3`, `QUOTA_IA_JOUR=40`), **KV `ANON_QUOTA`**, trois environnements (défaut/dev/production), route `api.zonetotalsport.ca`, secret `ANTHROPIC_API_KEY`. **Recommandation forte au §9, R-2 : ne pas créer un second Worker** |
| B1 générer une SAÉ | **ABSENT** dans le Planificateur / **EXISTE ailleurs** | `zts-generateur` génère déjà des SAÉ (app `sae-generator`). Le contrat de sortie est à récupérer, pas à réinventer |
| B2 remix d'un jeu | **ABSENT** | Le tiroir JEUX et la fiche existent (`tiroir-jeux.js`, tiroir du proto à `index.html:434`) — le bouton ✨ a où se poser |
| B3 plan B adaptatif | **LE POINT D'ANCRAGE A DÉMÉNAGÉ** | ⚠ **La « tuile PLAN B » du §5 n'existe plus.** Dans le proto, PLAN B est un **bouton dans le tiroir JEUX** (`proto-fusion.js:1522-1533`, bouton `#tiroirPlanB`), qui **filtre** les jeux. Dans l'app réelle, `v2-planb` est encore une tuile du dock (`app-v2.js:544`, action `app-v2.js:1156`). **Deux comportements différents selon la cible** — voir §7 |
| B4 étiquetage PFEQ | **PARTIEL — plus facile que prévu** | Voir D-3 : `intentionsC1/C2/C3` sont remplis à 100 % |
| B5 fiche TBI | **PARTIEL** | Mode TBI existe (`index.html:750`, `body.pv2.tbi{zoom:1.4}`) ; minuterie + `dureeMin` existent dans le tiroir du proto (`index.html:436-460`, presets 5/10/15/20, buzzer NBA/aréna/silencieux avec volume) |
| B6 messages IA | **ABSENT** (dépend de A6) | |
| B7 passerelle quiz | **NON SONDÉ** | Hors périmètre du prescan (le §B7 le met en dernier, « si l'app quiz est stable ») |

### 2.3 Lot C

**Tout est ABSENT.** Aucune collection, aucun écran, aucun bouton. C'est la
bonne nouvelle du lot C : **rien à ne pas casser**. Les points d'accroche :

- **`🛡️ SIGNALER` sur MA JOURNÉE** : l'écran a un conteneur d'actions **déjà
  prévu et vide**, `<div class="auj-actions" id="aujActions">`
  (`proto/index.html:66`) — le bouton s'y ajoute sans toucher la mise en page.
  **C'est la seule porte que l'amendement §10.1 autorise à ajouter.**
- **Horodatage serveur (C3)** : `FieldValue.serverTimestamp()` est disponible
  (SDK Firestore déjà chargé).
- **Pièces jointes (C2)** : les deux mécanismes de médias existent — **mais voir
  R-3, ils écrivent les octets en localStorage.**

### À REVALIDER
`apps/planificateur/app.js` · `app-v2.js` · `index.html` · `semaine-grid.js` ·
`tiroir-jeux.js` · `proto/index.html` · `proto/proto-fusion.js`

---

## 3. Modèle de données Firestore actuel

### 3.1 Collections existantes (`firestore.rules`)

**Du Planificateur** : `organisations` (80) · `groupes` (91) · `enfants` (109) ·
`grillesType` (121) · `journees` (130) · `presences` (142) · `semaines` (154) ·
`messages` (167) · `evalConfig` (183) · `evaluations` (189) · `jeux` (198) ·
`users` (225).

**D'autres apps, à ne pas toucher** : `userQuotas` · `anonGenCount` ·
`conversionFunnel` · `leads` · `performances` · `plans` · `inventaires` ·
`inventaireItems` · `rencontres` · `rencontresDossiers` · `budget` · `familles` ·
`article_views` · `sections` · `fiches`.

### 3.2 Le patron de sécurité, à copier tel quel

Toutes les collections du Planificateur suivent **le même patron** :

```
allow read:            isAnimateurOfGroupe(resource.data.groupeId)
                    || isCoordoOfGroupe(resource.data.groupeId)
allow create:          isAnimateurOfGroupe(request.resource.data.groupeId)
allow update, delete:  isAnimateurOfGroupe(resource.data.groupeId)
```

**⚠ Ce patron est le mauvais pour le lot C.** Il donne la lecture au
coordonnateur de l'organisation. Le §C5 exige « collection distincte,
**propriétaire seul** ». Le patron à copier pour `incidents` est celui de
**`performances`** (`firestore.rules:234`) ou de **`users`** (`:225`), qui sont
`request.auth.uid == …` — owner-only, sans coordo. **Ne pas copier-coller le
patron des groupes.**

### 3.3 Greffe des schémas du §7

| Schéma §7 | Greffe | Risque |
|---|---|---|
| extension `eleve` | champs **ajoutés** à `enfants` | ⚠ **Les règles actuelles laissent le coordo LIRE `enfants`.** Les restrictions médicales de A2 deviendraient donc lisibles par le coordonnateur. **Décision requise** — §9, Q-1 |
| `incidents` | **nouvelle collection**, patron owner-only (3.2) | aucun ; rien n'existe |
| parascolaire (activités, équipe, événements, heures) | **nouvelles collections** | attention à `groupeId` : une activité parascolaire **traverse les groupes** (§D3 « tous groupes confondus »). Le patron `isAnimateurOfGroupe` ne s'applique pas — owner-only également |
| `evaluations` + date (A3) | champ ajouté | aucun champ existant renommé |

### 3.4 Pont d'export
`carnet-export.js` (PR #41) définit le contrat
`version`/`exportedAt`/`source`/`appVersion`. Les champs nouveaux s'y ajoutent
sous leur propre clé — **le principe du registre (« il classe, il n'exclut
jamais », bloc `unknown`) garantit qu'un ajout ne casse pas un import ancien.**

### À REVALIDER
`firestore.rules` · `firestore.indexes.json` · `apps/evaluation/carnet-export.js`

---

## 4. Inventaire des Workers

| Worker | Route | Bindings | Secrets | Déploiement | Sonde HTTP |
|---|---|---|---|---|---|
| `zts-notify` | `notify.zonetotalsport.ca` + `zonetotalsport.ca/api/notify*` + **cron `0 13 * * *`** | — | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `NTFY_TOPIC`, `FIREBASE_SERVICE_ACCOUNT`, `TEST_KEY` | `wrangler deploy` | **200** |
| `zts-generateur` | `api.zonetotalsport.ca` (env `production`) | KV `ANON_QUOTA`, **Workers AI** (`[ai]`) | `ANTHROPIC_API_KEY`, `FIREBASE_SERVICE_ACCOUNT` | `wrangler deploy --env production` | 404 sur `/` (normal : routes nommées) |
| `zts-jeux-data` | (non déclarée au fichier) | R2 `zts-banques` | — | CI, `_scripts/publie-banques-r2.sh` | — |
| `zts-fiches-img` | `img.zonetotalsport.ca`, `workers_dev = false` | R2 `zts-fiches` | — | `wrangler deploy` | 404 sur `/` (normal) |
| `zts-notify-coordo` | `coordo.zonetotalsport.ca` | — | `RESEND_API_KEY` | `wrangler deploy` | **405 → en ligne** |

### ⚠ Les trois pièges de déploiement, relevés dans le dépôt même

1. **`wrangler deploy` ALIGNE le remote sur le fichier, il ne fusionne pas.**
   Documenté en toutes lettres dans `cf-worker/wrangler.toml` : une route de zone
   et un cron posés au tableau de bord ont failli être **effacés** par un
   déploiement. Tout nouveau Worker déclare **toutes** ses routes et ses crons au
   fichier, sinon il les perd.
2. **Le binding doit exister dans les TROIS environnements.** Écrit dans
   `cf-worker/generateur/wrangler.toml` : `--env production` **ne voit pas** le
   bloc de tête.
3. **`workers_dev = false`.** `zts-fiches-img` ferme explicitement la porte
   `*.workers.dev` — deux hôtes pour la même ressource, dont un hors des règles
   de la zone. `zts-ia` doit faire pareil.

### CORS
Modèle explicite dans `cf-worker/notify-coordo/wrangler.toml` :
`ALLOWED_ORIGINS = "https://zonetotalsport.ca,https://www.zonetotalsport.ca,http://localhost:8765,http://localhost:8012"`.
⚠ **Le proto est servi sur le port 8788** (`python3 -m http.server 8788`) — il
n'est dans aucune liste. À ajouter, ou à servir sur 8765.

### À REVALIDER
`cf-worker/**/wrangler.toml` (+ rejouer les sondes HTTP)

---

## 5. Fréquences réelles et dimensionnement du contexte IA

### 5.1 Ce sur quoi on peut filtrer (mesuré sur les 1439)

| Filtre du §B0 | Utilisable ? | Détail |
|---|---|---|
| `univers` | ✅ **oui** | 100 % rempli, tableau normalisé |
| `dureeMin` | ✅ **oui** | 100 %, numérique |
| `ageMin`/`ageMax` | 🟡 **à moitié** | 50 % rempli |
| `niveau` | 🟡 **non fiable** | 70 %, ~40 libellés libres |
| `espace` | ❌ **non, en l'état** | 66 %, quatre écritures pour « gymnase ou dehors » |
| `materiel` | ❌ **non, en l'état** | 98 % rempli mais **texte libre** — impossible de filtrer « sans matériel » de façon fiable (« Aucun matériel requis » = 67, « Aucun » = 25, et le reste énumère) |

**Le filtre par tags du §B0 ne peut pas être écrit tel quel.** Voir R-1.

### 5.2 Taille des fiches — le vrai chiffre

| Corpus | Taille moyenne | ≈ tokens |
|---|---|---|
| Fiche de jeu **complète** (39 champs, dont 4 en anglais) | **8 167 o** | **~2 400** |
| Fiche de jeu **élaguée** (17 champs utiles au prompt) | **1 511 o** | **~444** |
| Cours ÉP complet | 3 446 o | ~1 013 |
| Fiche mini-banque | 767 o | ~225 |

**Joindre des fiches entières est exclu** : 8 fiches pleines = ~19 200 tokens de
contexte par appel, dont la moitié est de l'anglais (`titleEn`, `butEn`,
`deroulementEn`, `variantesEn`) et des métadonnées d'affichage
(`categoryIcon`, `categoryColor`) qui n'apprennent rien au modèle.

### 5.3 **N recommandé : 8 fiches élaguées** (~3 555 tokens)

| N | Contexte fiches |
|---|---|
| 5 | ~2 222 tokens |
| **8** | **~3 555 tokens** |
| 12 | ~5 333 tokens |
| 20 | ~8 888 tokens |

8 donne au modèle de quoi choisir et citer sans noyer la consigne. Champs à
garder : `id`, `title`, `but`, `materiel`, `duree`, `dureeMin`, `espace`,
`niveau`, `ageMin`, `ageMax`, `nbJoueursMin`, `nbJoueursMax`, `deroulement`,
`intentionsC1/C2/C3`, `consignesSecurite`. **Tout le reste est retiré**, en
particulier les 4 champs anglais.

### À REVALIDER
`_data/jeux-merged.json` · `_data/planification/*.json`

---

## 6. Coût par appel IA et quotas

### 6.1 Tarifs (par million de tokens, API Anthropic)

| Modèle | Entrée | Sortie |
|---|---|---|
| Claude Haiku 4.5 (`claude-haiku-4-5`) | 1,00 $ | 5,00 $ |
| Claude Sonnet 5 (`claude-sonnet-5`) | 2,00 $ | 10,00 $ |
| Claude Opus 5 (`claude-opus-5`) | 5,00 $ | 25,00 $ |

Lecture de cache ≈ **0,1 ×** l'entrée · écriture de cache ≈ 1,25 ×.
`zts-generateur` tourne aujourd'hui sur `claude-haiku-4-5-20251001` par défaut.

### 6.2 Coût estimé par action (entrée = système + 8 fiches élaguées)

| Action | Entrée | Sortie | **Haiku 4.5** | **Sonnet 5** |
|---|---|---|---|---|
| **B1** SAÉ (N séances) | ~6 000 | ~2 500 | **1,9 ¢** | 3,7 ¢ |
| **B2** remix d'un jeu | ~3 200 | ~800 | **0,7 ¢** | 1,4 ¢ |
| **B3** plan B | ~3 500 | ~1 200 | **1,0 ¢** | 1,9 ¢ |
| **B4** étiquetage (lot de 10) | ~5 200 | ~600 | **0,8 ¢** | 1,6 ¢ |
| **B5** fiche TBI | ~1 500 | ~400 | **0,4 ¢** | 0,7 ¢ |
| **B6** message adapté | ~700 | ~300 | **0,2 ¢** | 0,4 ¢ |

**Avec cache sur le prompt système + les fiches stables**, l'entrée retombe à
~0,1 × : B1 passe de 1,9 ¢ à **~1,3 ¢**. Le gain vient surtout de la sortie, qui
ne se cache pas.

### 6.3 Quotas proposés par palier Cadenas

Alignés sur ceux de `zts-generateur`, pour ne pas inventer une deuxième échelle :

| Palier | Quota mensuel proposé | Coût plafond / usager / mois (Haiku) |
|---|---|---|
| Anonyme | **0** (l'IA est derrière le mur) | 0 $ |
| Gratuit connecté | **10 générations** | ~0,19 $ |
| Payant | **150 générations** | ~2,85 $ |
| Joey (admin, B4) | illimité, journalisé | — |

Compteur **mensuel** en Firestore (le §B0 le demande) — mais **`userQuotas`
existe déjà** (`firestore.rules:9`) : à réutiliser plutôt qu'à dupliquer.

### À REVALIDER
`cf-worker/generateur/wrangler.toml` (les valeurs de quota y sont la référence)

---

## 7. Plan de placement UX + **table de correspondance complète** (§10.2)

### 7.1 La barre réelle, au SHA scanné

`proto-fusion.js:1095-1105` — **9 portes**, dans cet ordre :

| # | Icône | Nom | Écran |
|---|---|---|---|
| 1 | 📋 | MA JOURNÉE | `e-aujourdhui` |
| 2 | 🗓️ | MA SEMAINE | `e-accueil` |
| 3 | 📅 | MON MOIS | `e-mois` |
| 4 | 📚 | MON ANNÉE | `e-annee` |
| 5 | 📆 | MON CALENDRIER | `e-calendrier` |
| 6 | 🏅 | **MON PARASCOLAIRE** | `e-temps` |
| 7 | 🔗 | MES AUTRES APPS | menu déroulant (4 liens externes) |
| 8 | ⋯ | PLUS | `e-plus` |
| 9 | ⚙️ | (roue) | `e-reglages` |

**⋯ PLUS ne contient que TROIS tuiles** (`proto/index.html:113-123`) :
🕐 Mon horaire (`e-horaire`) · 👥 Mes groupes (`e-groupes`) · 👑 Vue
coordonnateur (`e-coordo`).

> ⚠ Le §1.4 parlait de « 7 tuiles sous PLUS » ; c'était vrai avant le chantier
> G3/G4. **Il y a donc de la place sous PLUS** — l'amendement §10.1 y range tout
> le mandat, et l'écran ne débordera pas.

### 7.2 TABLE DE CORRESPONDANCE — vocabulaire du mandat → réalité

**Aucune session ne devine un placement. Cette table fait foi.**

| Le mandat dit… | La réalité au SHA `8ce14d5c` | Preuve |
|---|---|---|
| « AUJOURD'HUI » | porte **📋 MA JOURNÉE**, écran `e-aujourdhui` | `proto-fusion.js:1096` |
| « MA SEMAINE » | porte **🗓️ MA SEMAINE**, écran `e-accueil` (⚠ l'id ne correspond pas au nom) | `:1097` |
| « MOIS » | porte **📅 MON MOIS**, `e-mois` | `:1098` |
| « les 3 onglets de G2 » | **n'existent plus** — 9 portes | `:1095-1105` |
| « l'écran 6 tuiles » | **n'existe plus** — l'accueil est devenu la semaine | `proto-fusion.js:1360-1364` |
| « la tuile PLAN B » | **bouton `#tiroirPlanB` DANS le tiroir JEUX** (proto) · **tuile du dock `v2-planb`** (app réelle) | `proto-fusion.js:1522` · `app-v2.js:544` |
| « PLUS → 🧑‍🏫 REMPLAÇANT » (A1) | 4ᵉ tuile de `e-plus` | `proto/index.html:113` |
| « PLUS → 🎯 MES OBJECTIFS » (A4) | 5ᵉ tuile de `e-plus` | idem |
| « PLUS → ✉️ MESSAGES » (A6) | 6ᵉ tuile de `e-plus` | idem |
| « PLUS → 🛡️ MON SYNDICAT » (C1) | 7ᵉ tuile de `e-plus` | idem |
| « bouton 🛡️ SIGNALER sur AUJOURD'HUI » (C1) | dans `<div class="auj-actions" id="aujActions">`, **conteneur existant et vide** | `proto/index.html:66` |
| « PLUS → 🏆 MON PARASCOLAIRE » (D1) | **NON — c'est la porte 6 de la barre**, déjà là. D1 est **fait** | `proto-fusion.js:1101` |
| « MES GROUPES → élève » (A2) | `e-groupes`, atteint par PLUS → 👥 Mes groupes | `proto/index.html:116` |
| « RÉGLAGES » | roue ⚙️ de la barre, `e-reglages`, garni par 3 modules | `:1130` · `proto-fusion.js:537`, `proto-horaire.js:84`, `proto-annee.js:138` |
| « tiroir JEUX » | `<aside id="tiroir">`, minuterie + buzzer + recherche + PLAN B | `proto/index.html:434-462` |
| « mode TBI » | `body.pv2.tbi{zoom:1.4}` (app réelle) | `apps/planificateur/index.html:750` |
| « Mon temps travaillé » | écran `e-temps`, **titré « Mon parascolaire »** | `proto/index.html:195` |

### 7.3 Placement proposé, fonction par fonction (conforme au §10.1)

**Aucune porte ajoutée à la barre. Une seule exception, prévue au mandat.**

| Fonction | Placement | Geste |
|---|---|---|
| A1 remplaçant | **PLUS** → nouvelle tuile 🧑‍🏫 | 2 taps |
| A2 fiche sécurité | **dans** `e-groupes` → élève → bouton 🩺 | 3 taps |
| A3 évaluations datées | **aucun écran neuf** — picto dans MON MOIS et MA SEMAINE | 0 |
| A4 objectifs | **PLUS** → tuile 🎯 | 2 taps |
| A5 impression | bouton 🖨️ **dans le coin de chaque vue existante** | 1 tap |
| A6 messages | **PLUS** → tuile ✉️ | 2 taps |
| A7 modèles familles | **dans** A1/A4, pas d'écran propre | — |
| B1 SAÉ | ✨ sur une case vide de **MA SEMAINE** | 1 tap |
| B2 remix | ✨ sur la fiche **du tiroir JEUX** | 1 tap |
| B3 plan B | ✨ **à côté du bouton `#tiroirPlanB`** (⚠ pas « sur la tuile ») | 1 tap |
| B4 étiquetage | **PLUS** → tuile admin, visible pour Joey seulement | 2 taps |
| B5 fiche TBI | 📺 sur la séance ouverte depuis **MA JOURNÉE** | 1 tap |
| B6 messages IA | ✨ **dans** l'écran A6 | 1 tap |
| **C1 SIGNALER** | **`#aujActions` de MA JOURNÉE — SEULE porte ajoutée** | 1 tap |
| C1 journal | **PLUS** → tuile 🛡️ | 2 taps |
| D2-D8 | **dans la porte 🏅 MON PARASCOLAIRE existante** | 1 tap |

**Compte final sous PLUS : 3 tuiles existantes + 5 ajoutées = 8.** Sous la règle
abrogée (max 3), c'était impossible ; sous le §10.1, c'est le rangement prévu.

### À REVALIDER
`proto/index.html` · `proto/proto-fusion.js` · `apps/planificateur/app-v2.js`
(⚠ **G3-FICHE touchera la fiche de cours, donc les lignes B5 et « séance » de
cette table.**)

---

## 8. MON TEMPS aujourd'hui, et le sort des soirs et des fins de semaine

### 8.1 Ce que l'écran fait exactement (`proto/index.html:195-224`)

**Champs d'en-tête** : `t-annee` (défaut « 2025-2026 ») · `t-ecole` (défaut
« Riverside »).
**Tableau** `#tempsCorps` : Date (22 %) · Activité · Temps (20 %). Bouton
« + AJOUTER UNE LIGNE » (`#addTemps`).
**Saisie du temps tolérante** : « 90 », « 1:30 » et « 1h30 » sont acceptés
(`lireMinutes()`, `proto.js:652`).
**Calcul** : `#tTotal` (somme, auto) **−** `#tReconnu` (`t-reconnu`, saisi)
**=** `#tDePlus` — les trois en `0:00`.
**Signatures** : `t-sig1` « Signature direction » · `t-sig2` « Signature
responsable ».
**Partage** : `proto-horaire.js:157` construit un `mailto:` avec pour objet
« Mon temps travaillé — <année> ».

**Persistance** : `localStorage`, préfixe `P`, via `lire()`/`ecrire()`
(`proto.js:27-28`), avec une alerte de quota (`proto.js:36`) qui **nomme
elle-même la dette** : « les médias vivent en localStorage et ne suivent pas
l'utilisateur ». **C'est un proto : aucune écriture serveur, nulle part.**

**⚠ Le titre affiché est déjà « Mon parascolaire »**, pas « Mon temps
travaillé ». D1 est fait, y compris à l'écran.

### 8.2 **La question du §D1 est tranchée : OUI, la bande s'ajoute sans toucher la grille**

C'est le point le plus important de ce prescan pour le lot D.

La vue MA SEMAINE se construit en **deux conteneurs distincts**
(`proto-fusion.js:1440-1490`) :

1. **`g`** — la grille CSS : colonne des périodes × 5 jours. Les périodes
   viennent de `periodesAgenda()` (`:1370`), qui lit l'horaire-patron ; les
   pauses (récréation, dîner) y sont des cellules `ag-pause`.
2. **`bas`** — `<div class="agenda-bas">`, **hors de la grille**, ajouté après
   elle. Il contient **déjà** trois blocs : **Samedi** (`ag-sam-<iso>`) ·
   **Dimanche** (`ag-dim-<iso>`) · **Commentaires** (`ag-com-<lundi>`), chacun
   `contenteditable` avec `data-k`.

**Conséquence** : une bande « Après l'école » s'ajoute **dans `bas`**, à côté de
Samedi et Dimanche. Elle ne touche **aucune** ligne, colonne ou règle de la
grille Périodes 1-6. Le repli « badge dans l'en-tête du jour » du §D1 **n'est pas
nécessaire.**

Mieux : **les fins de semaine sont déjà des cases éditables datées** — les
événements parascolaires du samedi et du dimanche (§D4 : parties, tournois) ont
déjà leur emplacement, avec la bonne clé ISO.

### 8.3 Les soirs
**Aucune notion de soirée** dans la grille : `periodesAgenda()` s'arrête à la
période 6 (défaut « 14:15 à 15:05 »). Un événement de 18 h n'a **aucune case**.
D'où la bande « Après l'école » — qui devient le seul emplacement possible, et
qui existe déjà en creux dans `bas`.

**⚠ Un congé de fin de semaine est ignoré par le calendrier** :
`proto-fusion.js:342`, `if (j===0 || j===6) return;` — « un congé de fin de
semaine ne dit rien ». À connaître avant de brancher les événements de fin de
semaine sur le calendrier scolaire.

### À REVALIDER
`proto/index.html` (bloc `e-temps`) · `proto/proto-fusion.js` (`agenda-bas`) ·
`proto/proto-horaire.js` · `proto/proto.js` (`lire`/`ecrire`/`lireMinutes`)

---

## 9. Risques et questions à trancher

> ✅ **JOEY A TRANCHÉ LE 31 AOÛT.** R-1, R-2, R-3, R-4, Q-1 (volet règles), Q-6 et
> Q-7 sont réglés — décisions au **§11 du mandat**, résumées sous chaque entrée
> ci-dessous. Les recommandations d'origine sont conservées telles quelles : elles
> disent *pourquoi* la décision a été prise.

### Risques

**R-1 — Le filtre par tags du §B0 ne peut pas être écrit tel quel. (ÉLEVÉ)** ✅ **TRANCHÉ — §11.5** : filtres stricts sur `univers`/`dureeMin`/`ageMin`, couche PFEQ par `intentionsC1/C2/C3`, `espace`/`materiel` en **correspondance texte normalisée**. B4 devient une normalisation de l'existant.
`espace` et `materiel` sont du texte libre non normalisé (§5.1), `energie` et
`pfeq` n'existent pas dans le catalogue.
*Recommandation par défaut* : **filtrer sur ce qui est fiable** — `univers`
(100 %), `dureeMin` (100 %), `ageMin/Max` (50 %) — et passer `espace`/`materiel`
au modèle **comme texte**, dans les fiches élaguées, en le laissant juger. Ne
**pas** lancer une normalisation du catalogue dans ce mandat : c'est un chantier
de données, pas une fonction, et le §1 gèle le catalogue.

**R-2 — Créer `zts-ia` en second Worker duplique `zts-generateur`. (ÉLEVÉ)** ✅ **TRANCHÉ — §11.1** : **un seul Worker**, on étend `cf-worker/generateur/`. Trois conditions : routes existantes intactes (recette de non-régression en PR), **compteur de quota IA distinct**, nom du Worker inchangé.
`cf-worker/generateur/` a déjà jeton Firebase, quotas, KV, trois environnements,
route de production et clé API. Un second Worker = une seconde clé à faire
tourner, un second quota qui ignore le premier, deux journaux de coût.
*Recommandation par défaut* : **ajouter les 7 actions du §B0 à `zts-generateur`**
sous un chemin `/planificateur/*`, et garder le nom `zts-ia` comme **alias de
route** si Joey y tient. Décision à lui, mais la duplication doit être un choix
conscient. **Attention** : cela fait porter une nouvelle charge à un Worker
**déjà en production** pour le générateur de SAÉ et la transcription — donc
`--env dev` d'abord, et jamais de `deploy` sans `--env` (piège n° 1 du §4).

**R-3 — Les pièces jointes d'incident (C2) tomberaient dans la dette localStorage. (ÉLEVÉ)** ✅ **TRANCHÉ — §11.3** : téléversement **R2** sur le Worker existant, jeton Firebase, chemin cloisonné par `uid`, lecture authentifiée. Le chantier général des pièces jointes reste séparé et **n'est pas un prérequis**.
Le §C2 dit « pièces jointes via le mécanisme de médias existant ». Or ce
mécanisme **écrit les octets en localStorage** (Firestore ne garde que le nom) —
dette explicitement consignée au §1.2 et **hors périmètre de ce mandat**. Une
photo de blessure qui disparaît quand le navigateur vide son stockage, dans un
module « à valeur de preuve », est une contradiction.
*Recommandation par défaut* : **v1 sans pièce jointe**, avec un mot clair à
l'écran ; les pièces jointes attendent le chantier du pont d'export. Sinon,
router les pièces d'incident vers **R2** (le Worker `zts-fiches-img` est le
modèle : jeton Firebase + bucket privé).

**R-4 — Le destinataire de C4 est saisi par l'usager, contrairement au patron du Worker. (MOYEN)** ✅ **TRANCHÉ — §11.4** : C4 vise **la v2**, et le courriel du syndicat est **lu côté serveur** dans les réglages Firestore de l'usager. Jamais dans le corps de la requête.
`zts-notify-coordo` ne laisse **jamais** le client fournir l'adresse (§1.2). Le
courriel du syndicat, lui, est saisi dans les RÉGLAGES.
*Recommandation par défaut* : **v1 en `mailto:` comme le mandat le prévoit**
(zéro serveur, zéro risque de relais ouvert). Pour la v2, ne pas copier
`notify-coordo` tel quel : l'adresse doit être **lue dans le document Firestore
de l'usager** (écrit par lui, lu par le Worker avec son jeton), jamais reçue dans
le corps de la requête — sinon le Worker devient un relais de courriel anonyme.

**R-5 — L'impression est cassée sur les 41 apps migrées ; le Planificateur y échappe. (FAIBLE ici)**
Le `@media print` du shell masque `html`, `body` et `.ztsh-page`. Le
Planificateur **ne monte pas le shell** (le proto le dit à `proto.css:489`) et a
son propre bloc print (`index.html:740`). **A5 n'hérite donc pas du défaut** —
mais toute page du mandat servie via le shell le retrouverait.

**R-6 — L'origine `localhost:8788` n'est dans aucune liste CORS. (FAIBLE)**
Voir §4. Un appel IA depuis le proto échouera en développement tant que le port
n'est pas ajouté (ou le proto servi sur 8765).

### Les 7 questions du §9 — recommandation par défaut

| # | Question | Recommandation |
|---|---|---|
| Q-1 | Palier Cadenas pour l'IA | ⏳ chiffres à confirmer : **gratuit connecté = 10/mois**, anonyme = 0 — mais **compteur distinct** de ceux du générateur (§11.1). ✅ **Le volet « règles de `enfants` » est TRANCHÉ (§11.2)** : sous-document privé `enfants/{id}/prive/sante`, coordonnateur exclu |
| Q-2 | N fiches de contexte | **8 fiches élaguées** (~3 555 tokens) — §5.3 |
| Q-3 | Studio Jeu ou HTML→PDF | **HTML→PDF (impression navigateur)** pour A1/A5/C4/D4/D6 : aucune dépendance, imprimable en noir et blanc, et A5 en a besoin de toute façon. Studio Jeu reste pour A7 (diplômes illustrés), **s'il sait déjà le faire** — non vérifié dans ce prescan |
| Q-4 | Ordre des lots | **Celui du mandat** : A1-A2 → C → D → A3-A7 → B. ⚠ **Mais B0 (le Worker) conditionne tout le lot B** : le trancher tôt (R-2), même si le code vient plus tard |
| Q-5 | `mailto:` v1 ou canal serveur | ✅ **TRANCHÉ §11.4 — v2 dès le départ.** R-4 est réglé par la lecture serveur du destinataire, donc la raison d'attendre tombe |
| Q-6 | Bande « Après l'école » ou badge | ✅ **TRANCHÉ — BANDE.** Le §8.2 le démontre : `agenda-bas` est hors grille et contient déjà Samedi/Dimanche |
| Q-7 | Où vivent les restrictions médicales | ✅ **TRANCHÉ §11.2 — sous-document privé** `enfants/{id}/prive/sante`, propriétaire seul, coordonnateur exclu. Le picto ⚠️ se calcule côté client depuis ce sous-document, donc il n'apparaît que pour l'enseignant |

---

## ⛔ STOP — attente du GO de Joey

Conformément au §3 du mandat et à l'amendement §10.5 :

- **Aucun code des lots** avant la clôture de **G3-STABILISATION** et **G3-FICHE**.
- ✅ **Joey a tranché le 31 août** (§11 du mandat) : un seul Worker, sous-document
  privé pour la santé, R2 pour les pièces d'incident, C4 en v2 à destinataire
  serveur, ancrage IA sur les champs fiables. **Les trois décisions qui
  bloquaient du code sont levées.**
- ⏳ **Restent ouvertes** : les chiffres de quota (Q-1), N fiches (Q-2, recommandé
  8), Studio Jeu ou HTML→PDF (Q-4), l'ordre des lots (Q-5), et si un événement
  « fait » génère une ligne d'heures automatiquement (Q-7, second volet).
