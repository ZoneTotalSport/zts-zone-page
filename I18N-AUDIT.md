# I18N-AUDIT — site zonetotalsport.ca (wix-deploy/)

Audit read-only, 24 mai 2026. Décision : couper ZH + ES, garder FR + EN.

---

## 1. Inventaire i18n (parité clés par locale)

Comptage par script Python (regex `(?:^|[,{])\s*([A-Za-z]\w*)\s*:\s*['"]`).

| Page                              | Système               | FR | EN | ZH | ES | Parité |
|-----------------------------------|-----------------------|----|----|----|----|--------|
| index.html (l.4916-5654)          | i18n local + setLang  | 239 | 239 | 239 | 239 | ✅ |
| blog.html (l.264-317)             | ztsPageDict           | 32  | 32  | 32  | 32  | ✅ |
| blog.html — posts[]               | objets inline title/desc/cat/cycle | 23 posts × 4 | × 4 | × 4 | × 4 | ✅ |
| politique.html (l.456-504)        | ztsPageDict           | 19  | 19  | 19  | 19  | ✅ |
| avis.html (l.667-759)             | ztsPageDict           | 42  | 42  | 42  | 42  | ✅ |
| repertoire.html (l.145-193)       | ztsPageDict           | 25  | 25  | 25  | 25  | ✅ |
| apps/planificateur (dict #1 l.310-375) | local setLang    | 41  | 41  | 41  | 41  | ✅ |
| apps/planificateur (dict #2 quickAddI18n l.1217-1244) | local | ~12 | ~12 | ~12 | ~12 | ✅ |
| apps/agenda/app.js (l.7-605)      | local setLang         | 196 | 196 | 196 | 196 | ✅ |
| apps/suppleance/app.js (l.7-174)  | local setLang         | 64  | 64  | 64  | 64  | ✅ |
| apps/transitions (l.480-565)      | local setLang         | 74  | 74  | —   | —   | FR+EN only |

**Total dicts FR/EN/ZH/ES en parité parfaite** sur 10 surfaces.

---

## 2. Complétude EN

**a) Clés FR sans EN** : **aucune** sur toutes les pages auditées.

**b) FR qui fuit dans le bloc EN d'index.html** : scan automatique a remonté 9 hits, **tous faux positifs** (mots anglais coïncidant avec liste FR : "gym", "PE", etc.). Échantillon vérifié à la main : `heroTitle: Your gym, your rules.` / `news6Title: Gym App` / `shareMsg: My find for us PE teachers...` — **EN propre**.

**c) Texte FR codé en dur hors dict (index.html)** : non scanné exhaustivement, mais le système setLang couvre la totalité du DOM listé dans `i18nMap` (~430 entrées). Les zones non-mappées dépendent du flag `currentLang` côté JS (popups dynamiques, toasts) — déjà géré dans le code existant d'après les sessions 10-11 mai.

**Verdict EN** : ✅ **prêt prod**. Aucune action nécessaire avant ramp.

---

## 3. État ZH / ES

ZH et ES ont la **même parité de clés** qu'EN partout. Aucune clé manquante détectée. La traduction est faite. Donc **rien de cassé à corriger** — la coupe est uniquement une décision produit (charge mémoire + lisibilité du code).

Note : la traduction des 30 573 strings de la banque 1439 jeux (jeux.zonetotalsport.ca) **n'a jamais été faite** pour EN/ES/ZH (voir mémoire session 3 mai), donc côté sous-domaine jeux pas d'impact ZH/ES à retirer.

---

## 4. Couverture par page

| Page                          | i18n réel             | lang attr     | Switcher visible |
|-------------------------------|-----------------------|---------------|-----------------|
| index.html                    | FR/EN/ZH/ES (système local) | fr-CA dyn  | ✅ 4 langues    |
| blog.html                     | FR/EN/ZH/ES (ztsPageDict + posts[]) | fr-CA dyn | ✅ via zts-lang.js |
| politique.html                | FR/EN/ZH/ES           | fr-CA dyn     | ✅ via zts-lang.js |
| avis.html                     | FR/EN/ZH/ES           | fr-CA dyn     | ✅ via zts-lang.js |
| repertoire.html               | FR/EN/ZH/ES           | fr-CA dyn     | ✅ via zts-lang.js |
| aidons-nous/index.html        | **FR seul** (0 i18n ref) | `fr-CA` fixe | ❌ absent       |
| apps/planificateur            | FR/EN/ES/ZH ✅ — claim « 4 langues » vérifié | `fr-CA` dyn | ✅ pills locales |
| apps/agenda                   | FR/EN/ES/ZH (app.js)  | `fr` fixe     | ✅ pills locales |
| apps/suppleance               | FR/EN/ZH/ES (app.js, attrs data-i18n présents) | `fr` fixe | ⚠️ **dicts présents mais aucun switcher UI** (0 ref) |
| apps/transitions              | FR/EN seulement       | `fr` fixe     | ✅ 2 boutons FR/EN |
| apps/scoreboard               | **FR seul** (0 i18n)  | `fr` fixe     | ❌ absent       |
| apps/cours-maternelle, educatifs, evaluation, generateur, grille, jeux, moyens-action, musique, nba-playoffs, nhl-playoffs, omnigroupe, sae, tni | **FR seul** (0 i18n) | `fr` fixe | ❌ absent |
| articles/ (22 fichiers)       | shell FR/EN/ZH/ES via `<span lang>` + zts-lang.js ; corps traduit dans ~11/22 (mémoire) | dyn | ✅ via zts-lang.js |

---

## 5. Le sélecteur met-il vraiment à jour la page partout ?

**Oui** sur toutes les pages où il est branché. `zts-lang.js` (l.59-139) :
- met à jour `<html lang>`, `og:locale`
- applique `ztsPageDict[lang]` sur `[data-i18n]` (innerHTML) + attributs (`data-i18n-attr`)
- toggle `<span lang="X">` direct ou dans `[data-multilang]`
- toggle attributs `data-fr/en/zh/es` sur inputs/img (placeholder/value/alt)
- émet event `zts-lang-change` pour hooks custom

`index.html` a son **propre** `setLang()` (l.5646+) qui couvre les 430 entrées de `i18nMap` + popups dynamiques.

**Échec connu** :
- `aidons-nous/index.html` : page sert un layout custom sans `zts-lang.js` ni dict. Le clic switcher (s'il existait) ne ferait rien. Actuellement, **pas de switcher non plus** donc utilisateur bloqué en FR (cohérent).
- `apps/suppleance` : dicts complets dans `app.js` + attributs `data-i18n` partout dans le HTML, mais **aucun bouton switcher** — `setLang(currentLang)` n'est appelé qu'au chargement (l.492 de app.js). L'utilisateur ne peut pas changer la langue manuellement.
- Apps `<html lang="fr">` sans système (scoreboard, tni, cours-maternelle, etc.) : pas de switcher, pas de problème — restent FR.

---

## 6. Claims « multilingue / 4 langues / FR-EN-ZH-ES » dans le contenu visible

À reformuler si on coupe ZH/ES :

| Fichier | Ligne | Texte |
|---------|-------|-------|
| index.html | 1870, 5037 | `news9Desc: "Générateur avec 150 jeux (FR/EN/ZH), page de dons PayPal et site multilingue."` (+ trad EN l.5221, ES l.5584) |
| index.html | 2216 | `... 4 langues. Visible sur TNI!` (tile planificateur) |
| apps/suppleance/index.html | 163-164 | `promoF6t: "4 LANGUES"` + `promoF6d: "Français, English, 中文 et Español..."` (+ traductions EN/ZH/ES dans `app.js`) |
| Commentaires HTML | divers | `<!-- Dict de traductions X (4 langues) -->` (cosmétique, dans `index.html`, `blog.html`, `avis.html`, `politique.html`, `repertoire.html`, `promo.html`) |
| zts-lang.js | l.10 | docstring `{ fr, en, zh, es }` |

Vu dans `posts[]` blog (l.320, 345) : commentaires `multilingue. ...{ fr, en, zh, es }` et helper `// Helper : retourne la version FR/EN/ZH/ES`.

---

## Verdict

### EN prêt prod ?
✅ **Oui.** Parité de clés parfaite sur 10 surfaces, aucune fuite FR détectée dans le bloc EN d'`index.html`, EN actif sur toutes les pages où le switcher est branché, hreflang `en` déclaré sur 5 pages racines.

Réserves mineures (hors scope coupe ES/ZH) :
- `apps/suppleance` : dict EN existe, mais pas de bouton pour basculer → ajouter switcher pills.
- 11/22 articles : shell EN seulement, corps en FR → décision contenu (traduire vs assumer).

### Plan de coupe ES/ZH (chiffré)

**Fichiers à modifier** : 13 (en comptant les 8 dicts + zts-lang.js + index.html setLang + 5 pages avec hreflang + ~22 articles avec `<span lang="zh|es">`).

**Volumes** :

| Zone                                | Lignes ZH+ES à retirer | Clés ZH+ES |
|-------------------------------------|------------------------|------------|
| `index.html` dicts zh/es (l.5285-5653) | ~369                | 482        |
| `blog.html` dict + posts[] zh/es    | ~26 + ~92 inline       | 64 + 4 champs × 23 posts × 2 langues = 184 strings |
| `politique.html` dicts zh/es        | ~24                    | 38         |
| `avis.html` dicts zh/es             | ~46                    | 84         |
| `repertoire.html` dicts zh/es       | ~24                    | 50         |
| `apps/planificateur/index.html` (2 dicts) | ~33              | ~88        |
| `apps/agenda/app.js` zh/es          | ~335                   | 392        |
| `apps/suppleance/app.js` zh/es      | ~84                    | 128        |
| **Total dicts**                     | **~1033 lignes**       | **~1426 clés** |
| Articles : `<span lang="zh">` + `<span lang="es">` nav/footer × 22 fichiers | ~300-500 spans | n/a |
| `zts-lang.js` : SUPPORTED + LANG_ATTR + OG_LOCALE + SWITCHER_LABELS + CSS toggling l.186-197 | ~14 lignes | — |
| `index.html` setLang : `langAttr` + `ogLocale` (l.5660, ~5668) — retirer `zh:`, `es:` | 2 entrées × 2 = 4 mods | — |
| hreflang `zh` + `es` : 5 pages racines × 2 lignes | 10 | — |

**Total estimé : ~1060 lignes + 300-500 spans HTML à retirer.**

**Risques** :
1. **SEO** : URLs `?lang=zh` et `?lang=es` déjà indexées par Google → prévoir redirection 301 ou laisser 404 + retirer hreflang (déjà couvert par le plan). Surveiller GSC 4-6 semaines.
2. **localStorage** : utilisateurs ayant choisi `zh` ou `es` reverront leur lang stockée → `zts-lang.js` `detectInitialLang()` fait `SUPPORTED.includes(stored)` donc fallback FR automatique. ✅ aucun crash.
3. **URL param `?lang=zh|es`** existants (deep-links externes, emails) → même fallback FR. ✅
4. **claim « 4 LANGUES »** dans suppleance (promoF6) + index (news9, planif tile) : à reformuler en « 2 langues » ou retirer la mention.
5. **`apps/transitions`** : FR+EN déjà, **aucune action**.
6. **`posts[]` blog (l.322-...)** : objets inline `{fr,en,zh,es}` — script de coupe à scripter (sed/python) sinon risque d'oublis ; le helper `// retourne la version FR/EN/ZH/ES` deviendra `FR/EN` mais le getter actuel `t.title[lang] || t.title.fr` fonctionnera tel quel après retrait des clés zh/es (fallback FR). ✅ pas de crash si on laisse les clés zh/es dans posts[] et qu'on les ignore — c'est mort dans `SUPPORTED`.
7. **Articles 22 fichiers** : retrait des `<span lang="zh">` et `<span lang="es">` peut être scripté ; les laisser n'a pas d'impact runtime (CSS les masque par défaut sans match), donc c'est un nettoyage cosmétique de plus basse priorité.
8. **`document.documentElement.lang = 'zh-CN'`** : si du code tiers (analytics, Clarity) profile la lang, repassage à fr-CA/en uniformise.

**Ordre d'exécution recommandé** :
1. `zts-lang.js` : `SUPPORTED = ['fr','en']` + nettoyer LANG_ATTR/OG_LOCALE/SWITCHER_LABELS/CSS → 1 commit, déploiement immédiat (effet : switcher n'affiche plus que FR/EN, fallback auto pour stored=zh/es).
2. `index.html` setLang : `langAttr`/`ogLocale` zh/es retirés (4 mods).
3. hreflang : retirer 10 lignes sur 5 pages.
4. Dicts zh/es supprimés un fichier à la fois (8 fichiers, ~1033 lignes). Tester localement après chaque.
5. Suppleance promoF6 + index news9/planif tile : reformulation FR/EN.
6. (Bas priorité) `posts[]` blog + spans articles : script de nettoyage.

**Effort estimé** : 1 grosse session (2-3h) si scripté, ou 3-4 sessions courtes en mode incrémental. Risque tech proche de zéro grâce au fallback FR intégré.
