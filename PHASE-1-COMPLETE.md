# PHASE 1 — Corrections des incohérences (COMPLETE)
**Date :** 2026-06-11 · **Branche :** `fix/phase1-coherence` (depuis `feat/planif-cal-unifie`)
**Garde-fous respectés :** aucune logique métier touchée · aucun slug `/jeux/` renommé · `firestore.rules` non modifié · commits atomiques.

---

## Commits (dans l'ordre réel)
| # | Hash | Commit | Fichiers |
|---|---|---|---|
| A | `edab4e3` | fix(content): accents omnigroupe + 🏀 doublé + alt mascotte | index.html, apps/omnigroupe/index.html |
| B | `54c1f23` | fix(home): compteurs réels + count-up + abonnés live | index.html |
| C | `1522e36` | fix(home): standardiser '1400+ jeux' / '1700+ SAÉ' | index.html, repertoire.html |
| E | `5ce1676` | fix(meteo): seuils intérieur/extérieur v2 + raison dynamique | daily.js |
| D | `0924c4b` | fix(daily): date robuste + météo #menuJour dynamique | index.html, daily.js |
| J | `be61dd3` | fix(social-proof): une seule vérité '300+' + retrait mentions inventées | index.html, footer.html, zts-locked-fullscreen.js |
| H | `b86d637` | fix(worker): notify-worker robots.txt valide | cf-worker/notify-worker.js |

*(E commité avant D : D consomme la météo unifiée de E.)*

---

## Avant / Après
| Sujet | Avant | Après |
|---|---|---|
| Compteur Jeux | `data-target=500`, texte « 0 » | **1439** en dur + count-up |
| Compteur SAÉ | `150`, « 0 » | **1790** en dur + count-up |
| Compteur Pros | `2300`, « 0 » | **fetch live** (~329) via `zone-subscriber-count` worker, fallback **300+** |
| Chiffres jeux (prose) | +500 / 500+ / 150 mélangés | **1400+ jeux** partout (FR/EN + défaut ES/ZH) |
| Chiffres SAÉ (prose) | 150+ | **1700+** |
| Date du jour | « Dimanche 24 mai » figé | `new Date()` client-side, **script isolé** (résiste aux plantages JS) |
| Météo #menuJour | « Bruine 10°C → **EXTÉRIEUR** » en dur | **pilotée par daily.js** (source unique) |
| Météo (logique) | `rain>1` (rate la bruine), idéal dès 5°C | **précip>0 / code pluie-neige / <12°C ⇒ INTÉRIEUR** + raison « Bruine → on reste au gym » |
| Accents omnigroupe | ~30 lignes sans accents | corrigées (données JS intactes) |
| 🏀 NBA | doublé (`.ball` + `league-logo`) | un seul |
| alt mascotte | `alt=""` | descriptif |
| Preuve sociale | « Marie-Claude et 47 autres profs… » + 2300/350+/349 | « Rejoins les profs du Québec… » (sans chiffre/nom) + **300+** unique |
| notify robots.txt | ligne `OK` invalide (erreur GSC) | `User-agent: *\nDisallow: /` (à déployer) |

---

## Tests / non-régression
- **Syntaxe JS** : `daily.js`, `zts-locked-fullscreen.js`, `notify-worker.js` → équilibrage parenthèses/accolades OK (pas de runtime Node dispo localement → vérif par équilibrage + revue).
- **Données protégées** : `apps/omnigroupe` — `SOS_IMAGES`/`id:'materiel'` (JS) **non touchés** (accents bornés au modal de bienvenue).
- **i18n** : modifs de **valeurs** uniquement (aucune clé ajoutée/supprimée) → pas de clé manquante. daily.js = FR/EN/ZH (ES retombe sur FR, comportement pré-existant).
- **Logique intacte** : funnel signup, modal cadenas, auth, Firestore rules, worker generateur → **non modifiés**.
- **Slugs `/jeux/`** : aucun fichier renommé.
- ⚠️ **À valider en navigateur (Joey)** : pas de navigateur ici → confirmer visuellement que la home charge, compteurs s'animent, météo dynamique, /jeux/ + recherche OK, switch FR/EN/ES/ZH.

---

## Non fait / à suivre
- **F (Aucun jeu trouvé)** : **SKIP** — déjà `display:none` (apps/jeux/index.html:536), ne flashe pas. *(Observation : `#emptyState` n'est togglé par aucun JS → état vide jamais affiché ; latent, hors périmètre.)*
- **G (www→apex)** : **SKIP** — 301 déjà OK (Phase 0).
- **I (sitemaps sous-domaines)** : **REPORTÉ** — les robots/sitemaps de generateur/zone/api/compteur/ia sont servis par des **déploiements séparés (hors de ce repo)**. À corriger par déploiement (retirer la ligne `Sitemap:` 404 ou servir un vrai XML).
- **H — DÉPLOIEMENT REQUIS (Joey)** : `wrangler deploy` du notify-worker + **tester une notification Telegram** (non-régression webhook).
- **L (visiteurs réels footer)** : **non inclus dans ce lot** (hors ordre A→J). Nécessite une règle RTDB côté Firebase. À planifier séparément.
- **Étape 0 (bots IA Cloudflare)** : action manuelle dashboard, toujours disponible.

---

## Détail du compteur d'abonnés (commit B/J)
- API : `https://zone-subscriber-count.zts-ccd.workers.dev` → `{"total":329,...}`
- CORS confirmé pour `https://zonetotalsport.ca` (fetch OK depuis la home).
- Fallback statique **300+** (arrondi À LA BAISSE du réel ~329 — jamais vers le haut).
- Source unique : compteur home (dynamique) + toutes les mentions statiques (footer/cta) = « 300+ ».
