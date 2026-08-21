# Chantier 2 — vérifications post-LOT 1

**21 août 2026.** Les §1 et §2 sont en **lecture seule**. Le §3 se termine par
**un test qui écrit en production**, joué avec l'accord de Joey : une génération
anonyme réelle, qui a créé un document **ineffaçable** dans `anonGenCount`. Le
§7 livre trois greffes de code.

R2 et Cloudflare n'ont pas été touchés.

---

## 1. Prod == dépôt — CONFORME

GitHub Pages a construit `36d047a`, qui est exactement `origin/main`
(`gh api …/pages/builds/latest` → `"commit": "36d047a…", "status": "built"`).

Le numéro de commit ne prouve pourtant que l'intention. J'ai donc comparé les
**octets servis** aux octets du dépôt, en SHA-256 :

| Lot | Fichiers | Identiques | Différents |
|---|---|---|---|
| Ciblé (chrome, gates, 5 apps, pages racine) | 19 | **19** | 0 |
| Échantillon déterministe (1 sur 37 des 2159 fichiers publiables) | 59 | **56** | 0 |
| **Total** | **78** | **75** | **0** |

Les 3 non-servis sont attendus et corrects :

- `apps/_archive/…` ×2 → **404**. Jekyll exclut les dossiers préfixés `_`.
  C'est le même mécanisme qui garde `_data/` hors de l'arbre publié, donc
  ce 404 est la preuve que le verrou de la vague D tient.
- `.wrangler/cache/wrangler-account.json` → **404**. Voir §5, défaut trouvé.

**Non-régression des verrous LOT 1**, remesurée aujourd'hui :

| Route | Attendu | Mesuré |
|---|---|---|
| `/jeux/full.json`, `/sae/full.json`, `/moyens-action/full.json` | 401 | **401** ×3 |
| `/sae/detail/adresse_individuel.json`, `/collectifs.json` | 401 | **401** ×2 |
| `/planification/ep-1er.json`, `/camp.json` | 401 | **401** ×2 |
| `/jeux/public.json`, `/sae/public.json` | 200 | **200** ×2 |
| 4 anciennes URL de banque sur le dépôt | 404 | **404** ×4 |

Une nuance sur la forme, pas sur le fond : `LOT1-COMPLETE.md` écrit la route
protégée `/sae/detail/…`, ce qui se lit comme un slug de SAÉ. Le Worker attend
un **nom de fichier** (`/sae/detail/adresse_individuel.json`). Un slug renvoie
404 « route » sans jamais regarder le jeton. Aucune fuite — mais quelqu'un qui
retesterait au slug conclurait « 404 au lieu de 401 » et croirait à une
régression. J'ai perdu deux mesures là-dessus.

## 2. Les 12 sous-domaines — 11 CONFORMES, `ia.` TOUJOURS À 2 SAUTS

Destination lue **et** redirection suivie jusqu'au bout, comme l'exige
`REDIRECTIONS-CLOUDFLARE.md` (une 301 vers un 404 maquille la panne) :

| Sous-domaine | 301 vers | Fin de course | Sauts |
|---|---|---|---|
| `sae.` `educatifs.` `musique.` `suppleance.` `evaluation.` `tni.` `grille.` | `/apps/<nom>/` | 200 | **1** |
| `agenda.` | `/apps/agenda/` | 200 | **1** |
| `generateur.` | `/apps/generateur/` | 200 | **1** |
| `gym.` | `/apps/transitions/` | 200 | **1** |
| `jeux.` | `/apps/jeux/` | 200 | **1** |
| `ia.` | `/apps/generateur` | 200 | **2** |

**La barre finale de `ia.` n'a pas été corrigée au tableau de bord.** La règle
de zone vise toujours `/apps/generateur` sans `/`, GitHub Pages émet un second
301 pour l'ajouter. C'est le seul défaut restant, inchangé depuis le 17 août,
et il t'appartient (Rules → Redirect Rules, un caractère).

## 3. `anonGenCount` — la chaîne est SAINE, la rupture est en amont

0 document, confirmé par requête de liste : `db.collection('anonGenCount')
.limit(50).get()` → `size: 0`, sans erreur.

J'ai testé la chaîne maillon par maillon, en production, sans rien écrire :

| Maillon | Résultat |
|---|---|
| `zts-anon-fingerprint.js` chargé sur la page | **oui** (`index.html:380`) |
| `ztsAnonIncrement` / `GetCount` / `CheckBlocked` exposés | **oui**, les 3 |
| SDK Firebase + `firestore-compat` chargés | **oui**, `firebase.apps.length === 1` |
| Empreinte calculée | **oui** — `3c09bbbd…b027a`, mise en cache |
| Lecture Firestore | **OK en 49 ms**, `ztsAnonGetCount()` → `0` |
| Règles déployées == règles du dépôt | **oui**, vérifié bloc par bloc |
| Appel d'écriture présent dans le code servi | **oui**, `app.js:305` |
| Le générateur est-il muré pour l'anonyme ? | **non**, bouton actif, aucun mur |
| Worker `api.zonetotalsport.ca` | **`/health` 200**, `v0.4.0 prod`, CORS OK |

La vérification des règles mérite un mot, parce qu'elle exclut l'hypothèse la
plus probable a priori. J'ai envoyé **une écriture volontairement invalide**
(`count: 42`, là où la règle exige `count == 1`) : refusée en
`permission-denied`, donc aucun document créé. Puis quatre lectures témoins :
`anonGenCount` passe (`read: true`), `userQuotas`, `conversionFunnel` et une
collection inexistante sont refusées. Les règles en production se comportent
exactement comme `firestore.rules` du dépôt — **elles ne sont pas la cause**.

**Où ça casse.** L'écriture est le seul maillon non testé, et elle n'est
appelée qu'à **une** condition : `app.js:303-306`, sur le chemin de succès de
`generate()`, après que le Worker a renvoyé `ok: true`. Tous les autres chemins
(`429 QUOTA_EXCEEDED`, `401 ANON_LIMIT`, `!resp.ok`, `AbortError` à 35 s)
sortent **avant** `incAnonCount()`. Conclusion : depuis le 18 mai 2026
(`0040430`), **aucune génération anonyme n'est allée jusqu'au succès** — ou
alors aucune n'a été tentée.

Trois candidats, par ordre de vraisemblance, non départagés :

1. **Le quota anonyme du Worker est par IP, pas par empreinte.** Derrière le
   NAT d'une école, quelques visiteurs épuisent le quota du mois et tous les
   suivants prennent un 429 — donc jamais de succès, donc jamais d'écriture.
   L'empreinte, censée être le compteur fin, ne sert alors jamais.
2. Le trafic anonyme sur `/apps/generateur/` est simplement nul ou quasi nul.
3. Un échec systématique du Worker sur le chemin anonyme.

### VERDICT DU TEST — la chaîne fonctionne, de bout en bout

Test joué le 21 août, avec ton accord, en anonyme sur la production.
Bannière de témoins **refusée** d'abord, puis parcours réel : sélection
type/univers, contexte saisi, clic sur GÉNÉRER.

**Réponse du Worker — `POST https://api.zonetotalsport.ca/generate` → `200`**

```json
{"ok":true,"type":"jeu","univers":"eps",
 "modele_utilise":"claude-haiku-4-5-20251001",
 "tokens":{"input":770,"output":786},
 "generationId":null,
 "quota":{"scope":"anon","used":1,"max":3,"month_key":"2026-08"}}
```

Pas de 429, pas de 401. La fiche s'est affichée (*Les Gardiens des Zones*),
aucun mur, aucune erreur.

**Document créé dans `anonGenCount`** — ce qui n'était jamais arrivé :

| Champ | Valeur |
|---|---|
| id | `3c09bbbd68c9…b027a` (l'empreinte) |
| `count` | **1** |
| `firstSeen` / `lastSeen` | 2026-08-21 11:41:43 UTC |
| Taille de la collection | **1** (elle était à 0) |

**Ce document est permanent** — `allow delete: if false`. Il est à moi, pas
à un vrai visiteur : à retirer si un jour tu comptes les empreintes réelles.

**Ce que le verdict change.** Mon hypothèse la plus probable — le quota par IP
épuisé — est **réfutée** : le Worker répond `used: 1, max: 3` pour cette IP,
donc le compteur anonyme partait de zéro et rien ne bloquait. Les maillons
sont tous fonctionnels, y compris l'écriture Firestore et la règle `create`.

Il ne reste que l'explication ordinaire : **en trois mois, aucun visiteur
anonyme n'est allé jusqu'à une génération réussie.** Soit le trafic anonyme du
générateur est nul, soit ceux qui l'utilisent sont connectés — auquel cas
`incAnonCount()` est sauté et le quota part dans `userQuotas`. Ce n'est pas une
panne : c'est un chiffre d'usage, et il est mauvais.

**Le vrai défaut est qu'on ne pouvait pas le savoir.** Un zéro silencieux et une
panne d'écriture muette se ressemblaient trait pour trait, et il a fallu jouer
une génération à la main pour les distinguer. C'est ce que corrige la greffe
(b) plus bas.

**Un désaccord de plafonds, découvert par le test.** Le Worker accorde **3**
essais anonymes par IP et par mois ; le mur client tombe à **2**
(`ANON_LIMIT`). Le troisième essai que le serveur autorise n'est donc jamais
atteignable. Conformément à ta consigne, **le Worker n'est pas touché ici** —
c'est un point de conversion, il mérite son chantier.

## 4. Défaut collatéral — le compteur affiché ment (cosmétique)

`/apps/generateur/` affiche **« Tu peux générer 3 fois sans inscription »**
alors que `ANON_LIMIT === 2` dans le `app.js` servi, et que
`window.ztsAnonLimit === 2`.

Cause : `app.js` est en `defer`, donc `init()` — et son `updateQuotaHint()` —
s'exécute **avant** `DOMContentLoaded`. L'i18n de la page s'enregistre sur
`DOMContentLoaded` et réapplique ensuite `data-i18n="quota_default"`, dont la
valeur figée est « 3 fois ». La traduction écrase systématiquement le nombre
calculé.

Aucun rapport avec `anonGenCount` — le vrai blocage à 2 essais est asynchrone
et fonctionne. Mais le visiteur lit un chiffre faux, et le mur tombe un essai
plus tôt que promis.

## 5. Défaut collatéral — un identifiant Cloudflare versionné en dépôt public

`.wrangler/cache/wrangler-account.json` est **suivi par git**, dans un dépôt
**public**, depuis `ff9c082`. Il contient l'`account.id` Cloudflare et le nom
du compte.

Ce n'est **pas un secret** — un identifiant de compte apparaît dans les URL du
tableau de bord et ne donne aucun accès sans jeton. Ce n'est donc pas une
urgence. C'est du cache d'outil qui n'a rien à faire dans l'historique.

`.gitignore` couvre `cf-worker/.wrangler/` et `cf-worker/**/.wrangler/`, mais
**pas la racine** — d'où le passage. Correctif : ajouter `.wrangler/`,
`git rm --cached`. Hors périmètre lecture seule, non fait.

## 6. Tests manuels qui te restent

### A — Connecté, avec un compte gratuit réel (je ne crée pas de compte)

| # | Test | Résultat attendu, précisément |
|---|---|---|
| A1 | `/apps/jeux/` — ouvrir 5 fiches au hasard, **hors** des 3 vitrines | Les 5 s'ouvrent **entières**. Aucun mur, aucune section masquée. Un seul refus = le jeton ne passe pas sur `/jeux/full.json`. |
| A2 | `/apps/sae/` — ouvrir une SAÉ ordinaire (ex. *La Grande Famille des Balles*) | Fiche entière **avec ses cours** — le bloc « cours » n'est pas vide. C'est `/sae/detail/<fichier>.json`, qui répond 401 à l'anonyme. Fiche sans cours = le repli du Worker sert la version publique. |
| A3 | `/apps/planificateur/` | Aucun mur. La bibliothèque se remplit : **1439 jeux**. Un nombre inférieur = chargement partiel. |
| A4 | **Jeton expiré** : planificateur ouvert **> 1 h**, puis naviguer | La banque **se recharge** après rafraîchissement silencieux du jeton. Interdit : **banque vide sans message**. Acceptable : brève attente, ou message explicite. |

### B — Anonyme, navigation privée (fenêtre neuve, jamais connectée)

| # | Test | Résultat attendu, précisément |
|---|---|---|
| B1 | `/apps/jeux/` liste | **1439 cartes**, navigable sans compte. |
| B2 | Jeu ordinaire (*Ballon chasseur royal*) | **Mur affiché**, fiche jamais ouverte derrière. |
| B3 | Jeu vitrine (*1-2-3 Soleil*) | Fiche **entière**, 7 sections, aucun mur. |
| B4 | `/apps/sae/` liste puis SAÉ vitrine (*Les Légendes du Basketball*) | Liste **1880 SAÉ** ; la vitrine s'ouvre entière **avec ses cours** ; une SAÉ ordinaire donne le mur. |
| B5 | `/apps/planificateur/` | Mur **non fermable**, défilement bloqué, texte « réservée aux membres gratuits ». |
| B6 | Inscription depuis un mur | Après création : arrivée sur **`/bienvenue.html`** (drapeau `sessionStorage`). Pas la page d'accueil. |
| B7 | `/apps/generateur/` — générer 3 fois de suite | Essais 1 et 2 passent ; le **3e** déclenche le mur plein écran. ✅ **Joué le 21 août** — voir §3. Reste à confirmer le mur au 3e essai, que le test n'a pas poussé jusque-là. |

### C — iPhone, connecté (le tunnel du LOT 0, jamais joué)

| # | Test | Résultat attendu, précisément |
|---|---|---|
| C1 | Connexion Google sur iPhone, Safari | Le retour se fait **dans l'app**, session active. `getRedirectResult` a été retiré au LOT 0 : c'est ce chemin-là qui n'a jamais été vérifié sur iOS. |
| C2 | Après connexion, rejouer **A1 à A4** sur mobile | Mêmes attendus. Le point sensible est A4 : iOS suspend les onglets, le rafraîchissement du jeton se joue au réveil. |

### D — Ménage Firestore (console Firebase, 2 min)

| # | Test | Attendu |
|---|---|---|
| D1 | Collection `leads` | Supprimer les **4 documents de test** en `@zonetotalsport.invalid` (reste du LOT 0). |

---

## 7. Greffes livrées sur la même branche

| Commit | Objet |
|---|---|
| `12fac9d` | Le compteur affiche la limite qui bloque vraiment |
| `7c870b5` | Les deux replis de `zts-anon-fingerprint.js` ne sont plus muets |
| `c2c2e0f` | `.wrangler/` sort du suivi, à la racine aussi |

### (a) Le compteur — le conflit `defer` / `DOMContentLoaded`, réglé au bon endroit

Le point d'accroche existait **déjà** : l'i18n de `index.html` appelle
`window.ztsGenApplyI18n()` après chaque rendu, précisément pour rendre la main
aux textes calculés. `app.js` ne l'avait jamais défini. Il l'est maintenant.

Rien n'est neutralisé : l'i18n continue de traduire tout ce qui est figé, puis
`app.js` recalcule ce qui se calcule. Le noeud `#quotaHint` perd son
`data-i18n` — un noeud dont le contenu est un **nombre** ne peut pas porter une
traduction figée. Effet de bord réparé au passage : le changement de langue
laissait l'indice de contexte et le compteur en français.

Le plafond vient d'`ANON_LIMIT`, plus du Worker ; le nombre déjà consommé vient
du Worker, plus fiable que `localStorage`.

**Mécanisme vérifié sur la page de production**, avant/après :

| Étape | Texte de `#quotaHint` |
|---|---|
| Valeur calculée par `app.js` | `Tu peux générer 2 fois sans inscription (1/3 utilisés).` |
| Après un passage de l'i18n — **défaut reproduit** | `Tu peux générer 3 fois sans inscription.` |
| Après retrait de `data-i18n`, i18n rejouée — **correctif** | `Tu peux générer 2 fois sans inscription.` |

Et `window.ztsGenApplyI18n` vaut bien `undefined` en production : le contrat
n'existait que d'un côté.

**Ce qui n'est PAS fait, et pourquoi.** Les trois littéraux « 3 » de
`index.html` (la valeur d'attente du `<p>` et les deux `quota_default`) restent
en place. Les modifier retire des lignes d'app, ce que le contrôle d'habillage
bloque hors de ses exceptions — et `_scripts/verifie-habillage.py` dit
lui-même, en toutes lettres, de ne pas les élargir sans décision. J'ai donc
laissé la décision. Sans effet visible après le premier rendu, `app.js`
réécrivant le noeud ; reste la fenêtre avant l'exécution du script, où « 3 »
s'affiche encore. **Un mot de toi et je les change avec `--no-verify`.**

### (b) Les replis muets

`console.error` avec l'erreur d'origine, plus un événement `conversionFunnel`
(`anon_fp_error`, avec la phase — `lecture` ou `ecriture`). La console est le
canal qui ne dépend de rien ; l'événement Firestore est un *best effort*, il
tombera avec Firestore — d'où les deux. Le repli sur `localStorage` ne change
pas : un visiteur n'a pas à subir une panne de compteur.

### (c) `.wrangler/`

`git rm --cached` — le fichier reste sur le disque, c'est le cache de travail
de wrangler. `.gitignore` passe à `.wrangler/` + `**/.wrangler/`, qui vaut
partout et plus seulement sous `cf-worker/`. **Pas de réécriture d'historique**,
conformément à la décision « fuite archiviste acceptée » de la vague D.

## Ce que je n'ai pas fait, et pourquoi

- **La barre finale de `ia.`** — tableau de bord Cloudflare, pas de jeton d'API,
  et les actions dashboard te reviennent.
- **Le désaccord des plafonds 3 (Worker) / 2 (client)** — ta consigne : chantier
  propre, ça touche un point de conversion.
- **Les trois littéraux « 3 » de `index.html`** — le contrôle d'habillage les
  protège, et il demande une décision plutôt qu'une exception de plus.
