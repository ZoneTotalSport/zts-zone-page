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
  snap.forEach(d => {
    const e = d.get('event') || 'unknown';
    counts[e] = (counts[e] || 0) + 1;
    if (e === 'signup_complete') {
      const s = d.get('signup_source') || d.get('source') || 'direct';
      bySource[s] = (bySource[s] || 0) + 1;
    }
  });

  const V  = counts['locked_view']        || 0;
  const C  = counts['locked_click_signup']|| 0;
  const S  = counts['signup_complete']    || 0;
  const pct = (a, b) => b ? ((a / b) * 100).toFixed(1) + '%' : 'n/a';

  console.log(`\n=== FUNNEL conversionFunnel (${DAYS} derniers jours) ===`);
  console.log('Événements bruts :', counts);
  console.log(`\nlocked_view .............. ${V}`);
  console.log(`locked_click_signup ...... ${C}   (view→click : ${pct(C, V)})`);
  console.log(`signup_complete .......... ${S}   (click→signup : ${pct(S, C)})`);
  console.log(`Conversion globale view→signup : ${pct(S, V)}`);
  console.log('Attribution des signups :', bySource);

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

  // ---- TÂCHE 2 : Firebase Auth ----
  let users = 0, last = null;
  let page = await admin.auth().listUsers(1000);
  const scan = u => {
    users++;
    const t = u.metadata.creationTime ? new Date(u.metadata.creationTime) : null;
    if (t && (!last || t > last)) last = t;
  };
  page.users.forEach(scan);
  while (page.pageToken) { page = await admin.auth().listUsers(1000, page.pageToken); page.users.forEach(scan); }
  const newLast30 = []; // recompte rapide des comptes < 30 j
  let n30 = 0;
  let p2 = await admin.auth().listUsers(1000);
  const scan30 = u => { const t = u.metadata.creationTime && new Date(u.metadata.creationTime); if (t && t >= since) n30++; };
  p2.users.forEach(scan30);
  while (p2.pageToken) { p2 = await admin.auth().listUsers(1000, p2.pageToken); p2.users.forEach(scan30); }

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
| 1. Vue du cadenas | `locked_view` | `____` | — |
| 2. Clic « créer un compte » | `locked_click_signup` | `____` | `view → click : ___ %` |
| 3. Inscription réelle | `signup_complete` | `____` | `click → signup : ___ %` |
| **Global** | | | **`view → signup : ___ %`** |
| Trafic générateur | `anonGenCount` (actifs 30 j) | `____` | — |
| Comptes Auth (30 j) | `listUsers` créés < 30 j | `____` | (doit ≈ `signup_complete`) |

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

### Annexe — fichiers clés inspectés
`zts-funnel.js` · `firebase-auth.js` · `apps/generateur/zts-anon-fingerprint.js` ·
`firestore.rules` · `robots.txt` · `sitemap.xml` · `sitemap-jeux.xml` ·
`COHERENCE-V1-COMPLETE.md` · `CLAUDE.md` · pages hub (`index.html`, `ep.html`, `camps-de-jour.html`,
`service-de-garde.html`, `blog.html`, `repertoire.html`).
