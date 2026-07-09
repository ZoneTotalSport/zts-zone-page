# DIAGNOSTIC — Zéro nouveaux inscrits (zonetotalsport.ca)

**Date** : 2026-07-08
**Mission** : READ-ONLY. Déterminer si le problème est **TRAFIC**, **CONVERSION** ou **REDIRECTS**.
**Projet Firebase** : `zone-total-sport` · **Auteur** : diagnostic automatisé (Claude Code)

> ⚠️ **Aucune correction n'a été faite.** Ce document est un diagnostic. Aucun write hors ce
> fichier, aucun deploy, aucun commit de code.

---

## 0. Contrainte d'environnement (à lire en premier)

Ce diagnostic a tourné dans un conteneur **sans accès réseau sortant** vers le web public et
**sans identifiants Firebase** :

| Ce qui a pu être fait ICI | Ce qui doit être fait par Joey (commandes fournies plus bas) |
|---|---|
| Analyse statique du repo (robots.txt, sitemap, HTML, meta, funnel client, règles Firestore) | Interroger Firestore `conversionFunnel` / `anonGenCount` (**tâche 1**) |
| Cartographie du funnel et des sous-domaines à tester | Compter les utilisateurs Firebase Auth (**tâche 2**) |
| Rédaction du script `firebase-admin` prêt à l'emploi | `curl -sI` des 8 sous-domaines (**tâche 3**) |
| Lecture des signaux SEO présents dans le repo | `curl -sI` live des pages hub (**tâche 4**) |

Détail technique : l'egress proxy renvoie **403 (policy denial)** sur `curl` ET sur `WebFetch`
pour `zonetotalsport.ca` et tous les sous-domaines (`example.com`, `google.com` aussi bloqués).
Il n'y a ni `firebase` CLI, ni `gcloud`, ni service-account JSON dans le conteneur.

**Conséquence** : les deux sources qui trancheraient TRAFIC vs CONVERSION — le funnel Firestore
et le compte Auth — n'ont **pas pu être lues ici**. Le script ci-dessous les produit en < 1 min.
Le reste du rapport pose le cadre de décision et les hypothèses classées par vraisemblance à
partir des preuves statiques.

---

## 1. FUNNEL FIRESTORE — script à exécuter

La collection `conversionFunnel` est **`allow read: if false`** côté client
(`firestore.rules:39`) : elle n'est lisible **que via le SDK Admin** (qui contourne les règles).
Impossible depuis un navigateur ou un client anonyme — c'est voulu (analytics interne).

### Schéma réel des documents (source : `zts-funnel.js`)

`conversionFunnel/{autoId}` : `event`, `source`, `slug`, `layer`, `provider`, `uid`, `path`,
`timestamp` (serverTimestamp).
Événements émis : `locked_view`, `locked_click_signup`, `locked_click_login`, `locked_close`,
`signup_complete`.

- `signup_complete` : émis **une seule fois par création RÉELLE de compte** (garde `isNewUser`,
  voir `firebase-auth.js:575`). C'est donc un proxy fiable des inscriptions.
- `anonGenCount/{fingerprint}` : `count`, `fingerprint`, `firstSeen`, `lastSeen`
  (`apps/generateur/zts-anon-fingerprint.js`). 1 doc = 1 visiteur anonyme du générateur =
  **excellent proxy du TRAFIC réel** sur l'outil-phare.

### Script `firebase-admin` (couvre TÂCHE 1 + TÂCHE 2)

Enregistrer sous `diagnostic-funnel.js`, à la racine, avec un service-account JSON
(`serviceAccountKey.json`) exporté depuis Firebase Console → Paramètres → Comptes de service.

```js
// diagnostic-funnel.js  —  node diagnostic-funnel.js
// npm i firebase-admin@12
const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

const DAYS = 30;
const since = new Date(Date.now() - DAYS * 864e5);

(async () => {
  // ---- TÂCHE 1a : funnel conversionFunnel (30 j) ----
  const snap = await db.collection('conversionFunnel')
    .where('timestamp', '>=', since).get();

  const counts = {};
  const bySource = {};
  const viewBySrc = {};   // locked_view par source (hub / jeu / article / resource)
  snap.forEach(d => {
    const e = d.get('event') || 'unknown';
    counts[e] = (counts[e] || 0) + 1;
    if (e === 'signup_complete') {
      const s = d.get('signup_source') || d.get('source') || 'direct';
      bySource[s] = (bySource[s] || 0) + 1;
    }
    if (e === 'locked_view') {
      const s = d.get('source') || '?';
      viewBySrc[s] = (viewBySrc[s] || 0) + 1;
    }
  });

  const V  = counts['locked_view']        || 0;
  const C  = counts['locked_click_signup']|| 0;
  const S  = counts['signup_complete']    || 0;
  const pct = (a, b) => b ? ((a / b) * 100).toFixed(1) + '%' : 'n/a';

  console.log(`\n=== FUNNEL conversionFunnel (${DAYS} derniers jours) ===`);
  console.log('Événements bruts :', counts);
  console.log(`\nlocked_view .............. ${V}`);
  console.log('  détail par source ......', viewBySrc, '  // "jeu" apparaît une fois le CTA fiches en prod');
  console.log(`locked_click_signup ...... ${C}   (view→click : ${pct(C, V)})`);
  console.log(`signup_complete .......... ${S}   (click→signup : ${pct(S, C)})`);
  console.log(`Conversion globale view→signup : ${pct(S, V)}`);
  console.log('Attribution des signups :', bySource);

  // ---- TÂCHE 1c : tunnel COURRIEL (pop-up newsletter) ----
  const NV  = counts['newsletter_view']       || 0;
  const NS  = counts['newsletter_submit']     || 0;
  const NC  = counts['newsletter_complete']   || 0;   // leads confirmés (email envoyé)
  const N2S = counts['newsletter_to_signup']  || 0;   // a cliqué « créer un compte »
  console.log(`\n=== TUNNEL COURRIEL (pop-up newsletter) ===`);
  console.log(`newsletter_view ......... ${NV}`);
  console.log(`newsletter_submit ....... ${NS}   (view→submit : ${pct(NS, NV)})`);
  console.log(`newsletter_complete ..... ${NC}   (leads confirmés)`);
  console.log(`newsletter_to_signup .... ${N2S}   (bascule vers compte : ${pct(N2S, NV)})`);

  // ---- TÂCHE 1d : collection leads (copie exportable des courriels) ----
  let leadsCount = 0;
  try {
    const lq = await db.collection('leads').where('ts', '>=', since).get();
    leadsCount = lq.size;
  } catch (e) { console.warn('leads: lecture impossible', e.message); }
  console.log(`\n=== LEADS COURRIEL (collection leads, ${DAYS}j) ===`);
  console.log(`Leads récents : ${leadsCount}`);

  // ---- TÂCHE 1b : trafic générateur (fingerprints anonymes récents) ----
  // anonGenCount n'a pas de champ date filtrable par lastSeen indexé garanti :
  // on lit tout puis on filtre en mémoire (collection petite).
  const anon = await db.collection('anonGenCount').get();
  let recent = 0, total = anon.size, sumGen = 0;
  anon.forEach(d => {
    sumGen += (d.get('count') || 0);
    const ls = d.get('lastSeen');
    if (ls && ls.toDate && ls.toDate() >= since) recent++;
  });
  console.log(`\n=== TRAFIC GÉNÉRATEUR (anonGenCount) ===`);
  console.log(`Fingerprints anonymes — total : ${total} · actifs ${DAYS}j : ${recent}`);
  console.log(`Générations anonymes cumulées : ${sumGen}`);

  // ---- TÂCHE 2 : Firebase Auth (une seule passe paginée) ----
  let users = 0, last = null, n30 = 0;
  let page = await admin.auth().listUsers(1000);
  const scan = u => {
    users++;
    const t = u.metadata.creationTime ? new Date(u.metadata.creationTime) : null;
    if (t) {
      if (!last || t > last) last = t;   // dernier compte créé
      if (t >= since) n30++;             // comptes < 30 j
    }
  };
  page.users.forEach(scan);
  while (page.pageToken) { page = await admin.auth().listUsers(1000, page.pageToken); page.users.forEach(scan); }

  console.log(`\n=== FIREBASE AUTH ===`);
  console.log(`Utilisateurs total : ${users}`);
  console.log(`Dernier compte créé : ${last ? last.toISOString() : 'aucun'}`);
  console.log(`Comptes créés sur ${DAYS}j : ${n30}`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
```

Alternative sans SDK pour l'Auth uniquement (si `firebase` CLI installé + `firebase login`) :

```bash
firebase auth:export users.json --project zone-total-sport
# puis : nombre total
jq '.users | length' users.json
# dernier compte créé
jq -r '.users | max_by(.createdAt|tonumber) | (.createdAt|tonumber/1000 | todate)' users.json
```

### Tableau du funnel (à remplir avec la sortie du script)

| Étape | Événement | Volume 30 j | Taux vers l'étape suivante |
|---|---|---:|---:|
| **Tunnel COMPTE (gate/CTA)** | | | |
| 1. Vue du cadenas / CTA | `locked_view` (dont source `jeu`) | `____` | — |
| 2. Clic « créer un compte » | `locked_click_signup` | `____` | `view → click : ___ %` |
| 3. Inscription réelle | `signup_complete` | `____` | `click → signup : ___ %` |
| **Global compte** | | | **`view → signup : ___ %`** |
| **Tunnel COURRIEL (pop-up)** | | | |
| Vue pop-up | `newsletter_view` | `____` | — |
| Soumission | `newsletter_submit` | `____` | `view → submit : ___ %` |
| Lead confirmé | `newsletter_complete` | `____` | — |
| Bascule vers compte | `newsletter_to_signup` | `____` | — |
| Leads stockés | collection `leads` (30 j) | `____` | — |
| **Repères** | | | |
| Trafic générateur | `anonGenCount` (actifs 30 j) | `____` | — |
| Comptes Auth (30 j) | `listUsers` créés < 30 j | `____` | (doit ≈ `signup_complete`) |

**Lecture croisée (le test décisif)** :
- `newsletter_view ≈ 0` **et** `locked_view ≈ 0` → **TRAFIC** (personne n'arrive, ou les scripts
  ne se déclenchent pas).
- `leads` **≫** `comptes Auth 30 j` → **CADRAGE** : on capte des courriels mais pas d'inscriptions
  → le levier B (rééquilibrage pop-up) est le bon.
- `locked_click_signup` / `newsletter_to_signup` **>** 0 mais `signup_complete ≈ 0` → **BUG du flux
  d'inscription** (priorité absolue avant toute optimisation).

---

## 2. FIREBASE AUTH

Couvert par le bloc `=== FIREBASE AUTH ===` du script (total, dernier compte, comptes < 30 j).
Le nombre attendu est cohérent avec la comm produit : le repo standardise **« 350+ »**
enseignants (`COHERENCE-V1-COMPLETE.md`, réel ≈ 390). Si `listUsers` renvoie un total très
inférieur à ~390, la base d'inscrits communiquée est surévaluée — à recouper.

**À remplir :** total = `____` · dernier compte = `____` · créés 30 j = `____`.

---

## 3. REDIRECTIONS SOUS-DOMAINES

### Contexte (audit juillet 2026, `COHERENCE-V1-COMPLETE.md`)

L'audit a identifié des sous-domaines qui sont des **déploiements séparés** non couverts par le
lock du repo principal (`zonetotalsport.ca/apps/*`). Règle d'or #3 du projet :
**« toute ancienne URL = redirection 301, jamais 404 »**.

⚠️ **Découverte SEO liée** : `sitemap.xml` déclare **11 racines de sous-domaines à indexer**
par Google (`agenda`, `educatifs`, `evaluation`, `generateur`, `grille`, `gym`, `jeux`,
`musique`, `sae`, `suppleance`, `tni`). Si ces hôtes renvoient 403/404/erreur, on **gaspille du
crawl budget** et on envoie des signaux cassés — voir §4.

### Les 8 sous-domaines de l'audit + statut attendu

| # | Sous-domaine | Attendu | Statut repo (COHERENCE) |
|---|---|---|---|
| 1 | `agenda.zonetotalsport.ca` | 301 / lock | **redéploiement requis — pendant** |
| 2 | `educatifs.zonetotalsport.ca` | 301 / lock | **redéploiement requis — pendant** |
| 3 | `evaluation.zonetotalsport.ca` | 301 / lock | **redéploiement requis — pendant** |
| 4 | `grille.zonetotalsport.ca` | 301 / lock | **redéploiement requis — pendant** |
| 5 | `musique.zonetotalsport.ca` | 301 / lock | **redéploiement requis — pendant** |
| 6 | `tni.zonetotalsport.ca` | 301 / lock | **redéploiement requis — pendant** |
| 7 | `gym.zonetotalsport.ca` | 301 / lock | **pendant — aucun dossier `apps/gym/`, source à identifier** |
| 8 | `jeux.zonetotalsport.ca` | 200 (whitelist) | OK — reste libre (attendu) |

→ **7 redirects pendants** = lignes 1 à 7. La #7 (`gym`) est la plus fragile : l'audit note
qu'**aucun dossier `apps/gym/` n'existe** dans le repo, donc la source du sous-domaine est
inconnue. `sae.zonetotalsport.ca` (whitelist, comme `jeux`) et `generateur` / `suppleance`
sont aussi dans le sitemap et méritent le même `curl`.

### Commandes à exécuter (TÂCHE 3)

```bash
for h in agenda educatifs evaluation grille musique tni gym jeux sae generateur suppleance; do
  printf "%-12s " "$h"
  curl -sI -o /dev/null -w "HTTP %{http_code}  ->  %{redirect_url}\n" \
    --max-time 15 "https://$h.zonetotalsport.ca/"
done
```

| Sous-domaine | HTTP (à remplir) | Location (à remplir) | Verdict |
|---|---|---|---|
| agenda | `___` | `___` | `___` |
| educatifs | `___` | `___` | `___` |
| evaluation | `___` | `___` | `___` |
| grille | `___` | `___` | `___` |
| musique | `___` | `___` | `___` |
| tni | `___` | `___` | `___` |
| gym | `___` | `___` | `___` |
| jeux | `___` | `___` | `___` (attendu 200) |

**Interprétation** : `301` avec `Location` propre = OK · `404` = viole la règle d'or #3 (perte
SEO) · `403`/`5xx` = hôte cassé · `200` sur un sous-domaine censé être verrouillé = **le gate
d'inscription ne s'affiche pas** → fuite de conversion (voir §5).

---

## 4. SANTÉ SEO DE BASE

### Ce qui a pu être vérifié statiquement (repo) — **sain**

| Contrôle | Résultat | Preuve |
|---|---|---|
| `robots.txt` | `User-agent: * / Allow: /` + 2 sitemaps déclarés | `robots.txt` |
| Meta `noindex` sur pages hub | **aucune** (index, ep, camps, sdg, blog, repertoire, avis, promo) | grep HTML |
| `<link rel="canonical">` | présent (ex. home → `https://zonetotalsport.ca/`) | `index.html`, `ep.html` |
| `sitemap.xml` | **87 URLs** + `sitemap-jeux.xml` = **1440 URLs** | comptage `<loc>` |
| `lastmod` sitemap principal | le plus récent = **2026-06-06** (un peu daté) | `sitemap.xml` |

### ⚠️ Deux risques SEO à confirmer LIVE

1. **robots.txt managé Cloudflare** : `CLAUDE.md` documente que Cloudflare peut **préfixer un
   robots.txt managé** à la réponse GitHub Pages. Il faut vérifier que la version LIVE ne
   contient pas un `Disallow: /` qui masquerait le `Allow: /` du repo. Un `Disallow: /` actif
   = **cause de TRAFIC nul** (désindexation).
2. **11 sous-domaines dans le sitemap** (§3) : s'ils sont 403/404, Google les déréférence et
   gaspille le crawl.

### Commandes à exécuter (TÂCHE 4)

```bash
# Codes + header X-Robots-Tag sur home + hubs
for u in "" ep.html camps-de-jour.html service-de-garde.html blog.html repertoire.html; do
  printf "%-28s " "/$u"
  curl -sI --max-time 15 "https://zonetotalsport.ca/$u" \
    | awk 'BEGIN{c="";x="none"} /^HTTP/{c=$2} tolower($0)~/x-robots-tag/{x=$0} END{printf "HTTP %s | %s\n", c, x}'
done

# robots.txt LIVE (vérifier qu'il n'y a PAS de Disallow: /)
curl -s --max-time 15 https://zonetotalsport.ca/robots.txt

# sitemaps accessibles
curl -sI -o /dev/null -w "sitemap.xml : %{http_code}\n"      --max-time 15 https://zonetotalsport.ca/sitemap.xml
curl -sI -o /dev/null -w "sitemap-jeux.xml : %{http_code}\n" --max-time 15 https://zonetotalsport.ca/sitemap-jeux.xml
```

---

## 5. VERDICT

### Le verdict définitif dépend de 3 nombres (à produire via §1)

Zéro inscrit est un signal **extrême** : même une conversion médiocre laisse un filet. « Zéro »
oriente vers un **blocage binaire** (un maillon à 0), pas une simple friction. L'arbre de
décision, basé sur les volumes du funnel :

```
locked_view ≈ 0  ────────────────────────────►  TRAFIC
  (personne n'atteint le gate)                   (ou le gate ne se déclenche pas)
        │
        ▼ (locked_view élevé)
locked_click_signup ≈ 0  ───────────────────►  CONVERSION
  (gate vu, personne ne clique)                  (CTA faible / gate mal calibré)
        │
        ▼ (clics élevés)
signup_complete ≈ 0  ───────────────────────►  BUG TECHNIQUE
  (clics mais 0 compte)                          (flux Auth cassé : popup, domaine
                                                  autorisé Firebase, provider)
```

Recoupement TRAFIC via `anonGenCount` :
- `anonGenCount` **actifs 30 j ≈ 0** → confirme **TRAFIC** (le site ne reçoit personne).
- `anonGenCount` **élevé mais `locked_view` ≈ 0** → le trafic existe mais **n'est jamais mis
  face à un gate** → problème **REDIRECTS / gate** (le générateur est ouvert par choix, et si
  les 7 sous-domaines pendants servent du contenu en 200 sans lock, le visiteur consomme tout
  sans jamais devoir s'inscrire).

### Hypothèse principale (au vu des preuves statiques disponibles)

**La plus probable = REDIRECTS/CONVERSION avant TRAFIC**, sous réserve des chiffres :

- Les signaux SEO statiques sont **sains** (robots Allow, pas de noindex, sitemaps, canonicals).
  Rien dans le repo ne suggère une désindexation — *sauf* le risque #1 (robots managé Cloudflare)
  qui reste à confirmer live et qui, s'il porte un `Disallow: /`, ferait basculer le verdict en
  **TRAFIC** immédiatement.
- L'audit de juillet montre **7 sous-domaines non verrouillés/non redirigés** encore pendants.
  Combinés au générateur volontairement ouvert, ils créent des **chemins où le visiteur obtient
  la valeur sans jamais rencontrer le gate d'inscription** → conversion structurellement bridée.
- `signup_complete` ne se déclenchant que sur `isNewUser`, un flux Auth partiellement cassé
  (domaine non autorisé sur un sous-domaine, popup bloqué) produirait « zéro » sans erreur visible.

**À trancher dès que le script §1 a tourné.** Si `signup_complete` > 0 mais Auth = 0 → bug de
comptage ; si les deux = 0 avec `locked_view` > 0 → conversion/technique ; si tout = 0 avec
`anonGenCount` = 0 → trafic.

---

## 6. TOP 3 ACTIONS RECOMMANDÉES (par impact)

### 🥇 1 — Faire tourner le script §1 + `curl` robots.txt live (30 min, débloque le diagnostic)
C'est le prérequis : les 3 nombres (`locked_view`, `signup_complete`, Auth total/dernier compte)
+ le contenu **live** de `robots.txt` tranchent TRAFIC vs CONVERSION vs REDIRECTS de façon
certaine. Tout le reste est spéculatif sans eux. **Impact : décisif.**

### 🥈 2 — Vérifier et réparer le flux d'inscription de bout en bout
Tester en navigation privée un `signup` réel (email + Google) depuis la home **et** depuis un
sous-domaine. Vérifier dans Firebase Console → Authentication → Settings que **tous les
sous-domaines** (`*.zonetotalsport.ca` utilisés) sont dans les **domaines autorisés** (un
domaine manquant casse `signInWithPopup`/`getRedirectResult` silencieusement — cohérent avec un
« zéro » net). **Impact : élevé si le funnel montre clics > 0, signups = 0.**

### 🥉 3 — Résorber les 7 redirects pendants + assainir le sitemap
Verrouiller/rediriger (301) les 7 sous-domaines de l'audit (`agenda`, `educatifs`, `evaluation`,
`grille`, `musique`, `tni`, `gym`) et **retirer du `sitemap.xml` les racines de sous-domaines qui
ne servent pas de contenu indexable** (ou les faire répondre 200 avec gate). Élucider la source
de `gym` (aucun dossier `apps/gym/`). **Impact : moyen-élevé — ferme les fuites de conversion et
récupère du crawl budget.**

---

## 7. AUDIT CONVERSION — chemins de consommation gratuite (analyse du code)

> Complément READ-ONLY : « comment les visiteurs arrivent et consomment gratuitement les
> outils ». Basé 100 % sur le code du repo (aucun réseau requis), donc factuel et vérifiable.

### 7.1 Par où arrive le trafic (surfaces indexées)

| Surface | Volume (sitemaps) | Rôle |
|---|---:|---|
| **Pages de jeux** `jeux/*.html` | **1 440 URLs** (`sitemap-jeux.xml`) | **surface SEO dominante** (longue traîne) |
| Pages principales / hubs / articles | 87 URLs (`sitemap.xml`) | home + univers + blog |
| Racines de sous-domaines | 11 URLs | apps externes |

→ L'écrasante majorité des atterrissages organiques se fait sur des **fiches de jeux
individuelles**, pas sur la home.

### 7.2 Ce que voit vraiment un visiteur d'une fiche jeu (correctif)

> ⚠️ **Correctif d'une première version de cet audit.** `shared/zts.js` charge
> **dynamiquement `zts-newsletter.js` sur tout le site** (sauf `/apps/*`), donc **les 1 440
> fiches jeux reçoivent bien un pop-up de capture courriel** (« 90 cours gratuits »), déclenché
> par exit-intent / 50 % de scroll / 35 s. Ce n'est donc **pas** un « trou noir » total. Voici
> l'état réel :

| Élément | Présent sur les fiches jeux ? | Détail |
|---|---|---|
| Verrou / cadenas | ❌ Non (voulu) | fiches = SEO bait, whitelist `jeux` libre |
| **Pop-up capture courriel** | ✅ **Oui** | `zts-newsletter.js` via `zts.js` (exit-intent/scroll/35 s) |
| Événements funnel | ✅ **Oui** mais `newsletter_*` | `newsletter_view/submit/complete/to_signup`, **pas** `locked_view` |
| **CTA inline persistant** (compte) | ❌ **Non** | seulement 7 fiches / 1 440 contiennent « inscri » |

**La vraie faille est plus subtile — et cohérente avec « des leads mais zéro *compte* »** :

1. Le pop-up est **une seule touche**, **fermable** et **plafonnée 10 jours** (`DISMISS_DAYS`),
   sautée pour les connectés. Un visiteur pressé le ferme → plus rien.
2. Son **action principale = capture courriel** (→ Firestore `leads` + email Resend). La
   **création de compte Firebase** (`ztsShowSignup`) n'est que le **bouton secondaire souligné**.
   → On optimise la **liste courriel**, **pas** les **inscriptions** (« abonnés »). D'où
   possiblement `leads > 0` mais **comptes Auth ≈ 0**.
3. **Aucun CTA inline permanent** en bas de fiche : une fois le pop-up fermé, la fiche n'invite
   plus jamais à créer un compte.

**Conséquence funnel** : le trafic des fiches jeux **est** partiellement instrumenté, mais via
les événements **`newsletter_*`** — que le tableau du §1 **ne comptait pas**. Il faut donc aussi
tallier `newsletter_view/submit/complete/to_signup` et **comparer les comptes Auth (§2) au
nombre de `leads`** : si `leads ≫ comptes`, le problème est le **cadrage courriel-d'abord**, pas
le trafic.

### 7.3 Là où le gate existe (surfaces à faible trafic d'entrée)

- **Home / hubs** (`#gridActive`, `shared/zts-unlock.js`) : 1re app gratuite, reste 🔒, émet
  `locked_view` (source `hub`).
- **Pages d'apps** (`/apps/*`, `zts-lock-page.js`) : verrou plein écran dur (non-whitelist).
- **Articles** (`zts-lock-page.js`) : demi-aperçu 50 % + CTA (bon mécanisme).
- **Whitelist 100 % libre** (`locked-whitelist.json`) : `jeux, sae, nba-playoffs, nhl-playoffs,
  suppleance, musique` + 2 articles.

### 7.4 Aggravants secondaires

- **Header partagé** : n'expose que **« Connexion »** (membres existants), **aucun CTA
  « Créer un compte gratuit »** pour les nouveaux visiteurs.
- **7 sous-domaines non verrouillés** (§3) : apps entières consommables gratis, hors funnel.
- **Générateur** ouvert volontairement (limite anonyme `anonGenCount`) — friction faible.

### 7.5 Verdict de l'audit conversion (corrigé)

La machine SEO (1 440 fiches jeux) **attire** bien et **est** reliée au tunnel via le **pop-up
courriel** — mais ce tunnel est calibré pour la **liste courriel**, pas pour les **inscriptions
de compte**, et il repose sur **une seule touche fermable/plafonnée**. Le levier n'est donc pas
« il n'y a rien », mais « **le cadrage pousse le courriel, pas le compte, et il n'y a aucun CTA
compte permanent** ». Reste à confirmer par les nombres (§1 + `leads`) : si `leads ≫ comptes
Auth`, c'est bien un problème de **cadrage/CTA** ; si `newsletter_view ≈ 0`, alors c'est le
**trafic** (ou le pop-up ne se déclenche pas).

### 7.6 Actions conversion (par impact)

1. **Ajouter un CTA compte inline permanent en bas de fiche jeu** (non-fermable, non plafonné,
   complémentaire du pop-up) : « Crée ton compte gratuit — débloque X », qui appelle
   `ztsShowSignup` et émet un événement funnel dédié. Comble le manque n°3 du §7.2 sur l'immense
   surface des 1 440 fiches.
2. **Rééquilibrer le pop-up** : donner à « créer mon compte » une place ≥ à la capture courriel
   (ou A/B tester), pour convertir en **abonnés** et pas seulement en **leads**.
3. **Mesurer d'abord** (script §1 élargi aux `newsletter_*` + collection `leads` + §2) pour
   confirmer le cadrage vs le trafic, puis **fermer les 7 sous-domaines** pendants (§3).

### Annexe conversion — fichiers inspectés
`locked-whitelist.json` · `zts-lock.js` · `zts-lock-page.js` · `shared/zts-unlock.js` ·
`shared/zts.js` · `header.html` · `zts-newsletter.js` · échantillon `jeux/*.html`
(`tchoukball`, `le-crocodile`, `poissons-et-pecheur`, `harpastum`, `kin-ball`) ·
`sitemap.xml` · `sitemap-jeux.xml`.

---

### Annexe — fichiers clés inspectés
`zts-funnel.js` · `firebase-auth.js` · `apps/generateur/zts-anon-fingerprint.js` ·
`firestore.rules` · `robots.txt` · `sitemap.xml` · `sitemap-jeux.xml` ·
`COHERENCE-V1-COMPLETE.md` · `CLAUDE.md` · pages hub (`index.html`, `ep.html`, `camps-de-jour.html`,
`service-de-garde.html`, `blog.html`, `repertoire.html`).
