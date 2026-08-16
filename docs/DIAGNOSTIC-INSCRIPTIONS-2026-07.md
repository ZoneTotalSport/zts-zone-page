# DIAGNOSTIC — Zéro nouveaux inscrits (zonetotalsport.ca)

**Date** : 2026-07-08
**Mission** : READ-ONLY. Déterminer si le problème est **TRAFIC**, **CONVERSION** ou **REDIRECTS**.
**Projet Firebase** : `zone-total-sport` · **Auteur** : diagnostic automatisé (Claude Code)

> ⚠️ **Aucune correction n'a été faite.** Ce document est un diagnostic. Aucun write hors ce
> fichier, aucun deploy, aucun commit de code.

---

> ## 📌 Récupéré et mis à jour le 13 août 2026
>
> Ce document vivait sur la branche `claude/zero-signups-diagnostic-d3619k`,
> jamais fusionnée, écrite le 8 juillet dans un conteneur **sans réseau
> sortant** : son auteur n'a pu vérifier **aucune** de ses hypothèses en live.
> Toutes les sections marquées « à confirmer » l'ont été depuis, par mesure
> réelle. Ce qui a changé :
>
> | Section | Alors (8 juillet) | Maintenant (13 août) |
> |---|---|---|
> | §3 redirections | 7 sous-domaines « pendants » | **11/11 en 301** — section réécrite |
> | §3 `gym` | source inconnue, « la plus fragile » | résolu : → `/apps/transitions/` |
> | §4 robots.txt managé | risque de `Disallow: /` non vérifié | **écarté** — `Allow: /` confirmé live |
> | §4 sitemap | 11 hôtes peut-être en 404 | **écarté** — tous en 301, sitemaps 200 |
> | §6 action 🥉 | à faire | **faite** |
>
> **Ce qui reste entièrement valide, et pourquoi ce document a été récupéré :**
> le script `firebase-admin` du §1 et l'arbre de décision du §5. La collection
> `conversionFunnel` est `allow read: if false` — ce script est **le seul moyen**
> d'obtenir les trois nombres du tunnel. Il exige une clé de compte de service
> que Joey seul peut exporter. **C'est le dernier verrou du diagnostic.**
>
> **Un angle mort que ce document ne pouvait pas voir** : jusqu'au 13 août,
> GA4 était absent de l'accueil, des trois hubs et des 1440 fiches de jeux.
> Un « trafic nul » lu dans GA4 avant cette date ne prouvait rien — les
> rapports étaient vides par construction. Corrigé par `ea9188a`.
>
> Voir `AUDIT-CHANTIERS-2026-08.md` et `LOT0-COMPLETE.md`.

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
| 1. Vue du cadenas / CTA | `locked_view` (dont source `jeu`) | **123** | — |
| 2. Clic « créer un compte » | `locked_click_signup` | **11** | `view → click : 8,9 %` |
| 3. Inscription réelle | `signup_complete` | **4** | `click → signup : 36,4 %` |
| **Global compte** | | | **`view → signup : 3,3 %`** |
| **Tunnel COURRIEL (pop-up)** | | | |
| Vue pop-up | `newsletter_view` | **165** | — |
| Soumission | `newsletter_submit` | **2** | `view → submit : 1,2 %` |
| Lead confirmé | `newsletter_complete` | **2** | — |
| Bascule vers compte | `newsletter_to_signup` | **0** | — |
| Leads stockés | collection `leads` (30 j) | **5** | — |
| **Repères** | | | |
| Trafic générateur | `anonGenCount` (actifs 30 j) | **0** ⚠️ | collection vide — voir baseline |
| Comptes Auth (30 j) | `listUsers` créés < 30 j | **4** | = `signup_complete` ✅ |

*Valeurs mesurées le 16 août 2026 — voir « BASELINE PRÉ-LOCKAGE » ci-dessous.*

**Lecture croisée (le test décisif)** :
- `newsletter_view ≈ 0` **et** `locked_view ≈ 0` → **TRAFIC** (personne n'arrive, ou les scripts
  ne se déclenchent pas).
- `leads` **≫** `comptes Auth 30 j` → **CADRAGE** : on capte des courriels mais pas d'inscriptions
  → le levier B (rééquilibrage pop-up) est le bon.
- `locked_click_signup` / `newsletter_to_signup` **>** 0 mais `signup_complete ≈ 0` → **BUG du flux
  d'inscription** (priorité absolue avant toute optimisation).

---

## ✅ BASELINE PRÉ-LOCKAGE — 16 août 2026

**Mesure réelle du 16 août 2026, 16 h 19 (America/Toronto).** Script du §1 exécuté avec
une clé de compte de service, en **lecture seule** (aucun write Firestore). Fenêtre :
30 jours glissants, **17 juillet → 16 août 2026**. *Le « dernier verrou du diagnostic »
annoncé en tête de document est levé.*

### Les trois nombres du tunnel

| Étape | Événement | Volume 30 j | Taux |
|---|---|---:|---:|
| 1. Vue du cadenas / CTA | `locked_view` | **123** | — |
| 2. Clic « créer un compte » | `locked_click_signup` | **11** | view → click : **8,9 %** |
| 3. Inscription réelle | `signup_complete` | **4** | click → signup : **36,4 %** |
| **Global compte** | | | **view → signup : 3,3 %** |

`locked_view` par source (30 j) : `resource` 73 · `article` 32 · `hub` 12 · `menu` 4 ·
`jeu` 2. Les 4 `signup_complete` sont tous attribués à `popup`.

### Repères de la même passe

| Repère | Valeur |
|---|---|
| `conversionFunnel` — total documents | **1 174** (depuis l'origine) |
| Cumul historique | `locked_view` 722 · `locked_click_signup` 25 · `signup_complete` **4** |
| Tunnel courriel 30 j | `newsletter_view` 165 · `submit` 2 · `complete` 2 · `to_signup` 0 |
| Collection `leads` | 6 au total · **5** sur 30 j |
| `anonGenCount` | **0 document** ⚠️ |
| Firebase Auth | **337** comptes · **4** créés sur 30 j · dernier le **16 août 2026, 15 h 51 min 50 s** |

### Ce que la baseline tranche (arbre de décision du §5)

- `locked_view` = 123 ≠ 0 → ce **n'est pas** un problème de **TRAFIC** pur : le gate est vu.
- `locked_click_signup` = 11 **et** `signup_complete` = 4 → **le flux d'inscription n'est
  pas cassé**. L'hypothèse « **BUG TECHNIQUE** » du §5 est **écartée**.
- `auth_créés_30j` (4) = `signup_complete` 30 j (4) → **le comptage funnel est exact**,
  aucun décalage entre l'événement et la création de compte réelle.
- Le goulot réel est en **entrée de tunnel** : seulement **8,9 %** des vues de gate
  produisent un clic — et le volume absolu (123 vues en 30 j) reste le vrai plafond.
  Le verdict bascule sur **CADRAGE / CONVERSION** (§7).
- ⚠️ **`anonGenCount` est vide (0 document)** alors que le §1 la présente comme
  « excellent proxy du TRAFIC réel ». Soit `apps/generateur/zts-anon-fingerprint.js`
  n'écrit plus, soit la collection a été renommée. **Ce repère est inutilisable en
  l'état — à vérifier.**
- ⚠️ Auth = **337**, en dessous des « 350+ » communiqués (§2, réel supposé ≈ 390).
  À recouper avec la comm produit.

### Validation de bout en bout du 16 août 2026 (action 🥈 du §6)

Une **inscription-test réelle a été effectuée depuis un iPhone le 16 août 2026**. Elle
laisse une trace complète, datée et cohérente :

| Preuve | Valeur |
|---|---|
| Document `conversionFunnel` | `yLhnJPiKROqrYsm8gmox` |
| `event` | `signup_complete` |
| `timestamp` | **2026-08-16 15 h 51 min 52 s** (America/Toronto) · `2026-08-16T19:51:52.016Z` |
| `source` / `signup_source` | `auth` / `popup` |
| `path` | `/bienvenue.html` |
| Compte Auth correspondant | créé le **2026-08-16 à 15 h 51 min 50 s**, provider `password` |

Les deux horodatages sont à **2 secondes** l'un de l'autre : l'événement funnel suit bien
la création de compte réelle, sur appareil réel. Activité complète du 16 août :
`locked_view` 6 · `locked_click_signup` 3 · `locked_close` 2 · `newsletter_view` 5 ·
`newsletter_close` 1 · **`signup_complete` 1**.

> **Conclusion — l'action 🥈 du §6 (« vérifier et réparer le flux d'inscription de bout en
> bout ») est VALIDÉE en conditions réelles.** `signup_complete` se déclenche, il est
> daté, et il correspond à un compte Auth créé 2 secondes plus tôt. Il n'y a **pas** de
> bug du flux d'inscription. Le levier restant est le **cadrage** (§7) et le **volume
> d'entrée** dans le tunnel.

*Note : les documents `signup_complete` ne portent pas de champ `uid` (le schéma du §1 le
prévoyait) — l'attribution compte ↔ événement se fait donc par horodatage, pas par clé.*

---

## 2. FIREBASE AUTH

Couvert par le bloc `=== FIREBASE AUTH ===` du script (total, dernier compte, comptes < 30 j).
Le nombre attendu est cohérent avec la comm produit : le repo standardise **« 350+ »**
enseignants (`COHERENCE-V1-COMPLETE.md`, réel ≈ 390). Si `listUsers` renvoie un total très
inférieur à ~390, la base d'inscrits communiquée est surévaluée — à recouper.

**À remplir :** total = `____` · dernier compte = `____` · créés 30 j = `____`.

---

## 3. REDIRECTIONS SOUS-DOMAINES — ✅ RÉSOLU

> **Mise à jour du 13 août 2026.** Ce paragraphe décrivait 7 redirections
> « pendantes » au 8 juillet. **Elles sont toutes fermées.** Section réécrite
> avec les mesures réelles ; les commandes d'origine sont conservées plus bas
> pour pouvoir refaire le contrôle.

### Contexte (audit juillet 2026, `COHERENCE-V1-COMPLETE.md`)

Des sous-domaines étaient des **déploiements séparés**, non couverts par le lock
du dépôt principal (`zonetotalsport.ca/apps/*`). Règle d'or #3 du projet :
**« toute ancienne URL = redirection 301, jamais 404 »**.

`sitemap.xml` déclare 11 racines de sous-domaines. Le risque identifié — des
hôtes en 403/404 qui gaspillent le crawl budget — **ne s'est pas matérialisé**.

### Mesures live du 13 août 2026 — 11/11 en 301

```bash
for h in agenda educatifs evaluation grille musique tni gym jeux sae generateur suppleance; do
  printf "%-12s " "$h"
  curl -sI -o /dev/null -w "HTTP %{http_code}  ->  %{redirect_url}\n" \
    --max-time 15 "https://$h.zonetotalsport.ca/"
done
```

| Sous-domaine | HTTP | Location | Verdict |
|---|---|---|---|
| agenda | 301 | `/apps/agenda` | ✅ |
| educatifs | 301 | `/apps/educatifs/` | ✅ |
| evaluation | 301 | `/apps/evaluation/` | ✅ |
| grille | 301 | `/apps/grille/` | ✅ |
| musique | 301 | `/apps/musique/` | ✅ |
| tni | 301 | `/apps/tni/` | ✅ |
| **gym** | 301 | `/apps/transitions/` | ✅ **énigme résolue** |
| jeux | 301 | `/apps/jeux/` | ✅ |
| sae | 301 | `/apps/sae/` | ✅ |
| generateur | 301 | `/apps/generateur/` | ✅ |
| suppleance | 301 | `/apps/suppleance/` | ✅ |

**Trois choses ont changé depuis le 8 juillet :**

1. Les 7 redirections pendantes sont posées. Les commits `5578747` et `eb6e3c4`
   (9 août) ont fermé les trois derniers sous-domaines qui servaient l'app en
   entier, et corrigé les cartes du hub ÉP qui pointaient encore vers eux.
2. **`gym` n'était pas une source inconnue** : le §3 d'origine notait
   qu'aucun dossier `apps/gym/` n'existait. Il redirige vers
   `/apps/transitions/` — l'app avait été renommée, le sous-domaine était
   resté sur l'ancien nom.
3. `jeux` et `sae`, attendus en 200 au titre de la whitelist, sont **aussi en
   301** vers `/apps/…`. Le verrou ne vit plus sur le sous-domaine mais sur le
   chemin canonique : c'est la bonne architecture, et c'est ce qui rend le
   §7 (audit conversion) mesurable en un seul endroit.

⚠️ **Ce qui reste ouvert, et qui ne relève pas de cette section** : le domaine
apex n'est **pas** en proxy Cloudflare (`dig zonetotalsport.ca` → les quatre IP
de GitHub Pages, 185.199.10x.153). Les redirections de **chemins** de la liste
Bulk Redirect ne peuvent donc pas s'appliquer — seules les redirections de
sous-domaines fonctionnent, parce qu'elles se règlent au niveau DNS. Voir
`REDIRECTIONS-CLOUDFLARE.md`.


## 4. SANTÉ SEO DE BASE

### Ce qui a pu être vérifié statiquement (repo) — **sain**

| Contrôle | Résultat | Preuve |
|---|---|---|
| `robots.txt` | `User-agent: * / Allow: /` + 2 sitemaps déclarés | `robots.txt` |
| Meta `noindex` sur pages hub | **aucune** (index, ep, camps, sdg, blog, repertoire, avis, promo) | grep HTML |
| `<link rel="canonical">` | présent (ex. home → `https://zonetotalsport.ca/`) | `index.html`, `ep.html` |
| `sitemap.xml` | **87 URLs** + `sitemap-jeux.xml` = **1440 URLs** | comptage `<loc>` |
| `lastmod` sitemap principal | le plus récent = **2026-06-06** (un peu daté) | `sitemap.xml` |

### ~~Deux risques SEO à confirmer LIVE~~ — ✅ les deux écartés le 13 août 2026

1. ~~**robots.txt managé Cloudflare**~~ — **écarté.** Le `robots.txt` live est
   exactement celui du dépôt, sans préfixe managé :

   ```
   User-agent: *
   Allow: /

   Sitemap: https://zonetotalsport.ca/sitemap.xml
   Sitemap: https://zonetotalsport.ca/sitemap-jeux.xml
   ```

   **Aucun `Disallow: /`.** L'hypothèse « TRAFIC nul par désindexation » est
   donc morte. Raison de fond : l'apex n'est pas en proxy Cloudflare (§3), donc
   aucun contenu managé ne peut se préfixer à la réponse GitHub Pages. Les deux
   sitemaps répondent 200.
2. ~~**11 sous-domaines dans le sitemap**~~ — **écarté.** Les 11 répondent 301
   vers leur chemin canonique (§3). Aucun crawl gaspillé, aucun signal cassé.

> **Conséquence sur le verdict du §5** : la branche « TRAFIC » de l'arbre de
> décision perd ses deux causes techniques candidates. Si `locked_view ≈ 0`, il
> faudra chercher du côté de l'acquisition (positions, indexation réelle), pas
> d'un blocage de crawl.
>
> **Et un angle mort vient d'être fermé** : jusqu'au 13 août, GA4 était absent
> de l'accueil, des trois hubs et des 1440 fiches de jeux — donc de toutes les
> surfaces d'entrée. Un « trafic nul » lu dans GA4 avant cette date ne
> prouvait rien. Corrigé par la fusion de `claude/fix-analytics-seo`
> (commit `ea9188a`), vérifiée en prod. **Les chiffres GA4 antérieurs au
> 13 août 2026 ne sont pas comparables à ceux d'après.**

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

> **Mise à jour du 13 août 2026 — deux des trois actions sont faites.**
>
> - **Action 🥇** : la moitié `robots.txt` live est **faite** (§4, sain).
>   Reste le script du §1, qui exige une clé de compte de service — c'est
>   aujourd'hui **le dernier verrou du diagnostic**.
> - **Action 🥉** (7 redirects pendants) : **faite**, 11/11 en 301 (§3).
> - **Action 🥈** (flux d'inscription de bout en bout) : **toujours ouverte**,
>   et c'est la plus importante. `signup_complete` n'a jamais été validé en
>   conditions réelles sur un appareil réel. Voir `LOT0-COMPLETE.md`.
>
> **Ce que le LOT 0 a changé dans les hypothèses ci-dessus** — les deux causes
> techniques que ce document soupçonnait sont écartées, mais une troisième,
> qu'il ne pouvait pas voir depuis son conteneur sans réseau, a été trouvée :
> **les surfaces d'entrée n'étaient pas mesurées du tout**. Accueil, hubs et
> 1440 fiches n'avaient aucun GA4 jusqu'au 13 août. L'hypothèse « TRAFIC »
> ne pouvait donc être ni confirmée ni infirmée par les rapports GA4 —
> ils étaient vides par construction, pas par absence de visiteurs.

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
