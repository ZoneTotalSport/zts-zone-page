# SPEC — Bilinguisme FR/EN d'une app ZTS (Tier 1, texte d'interface)

Objectif : rendre une app FR-only entièrement bilingue FR/EN, **sans casser** le
layout, le JS, ni la logique. FR reste la langue par défaut.

## Mécanisme (déjà en place, à réutiliser)
- `shared/zts.js` est chargé par l'app. Il expose `ZTS.getLang()` (`'fr'`|`'en'`),
  lit `?lang=` dans l'URL, et émet les événements `zts:ready` et `zts:langchange`.
- Le toggle FR/EN vit dans le header partagé (injecté). Pas besoin d'en ajouter un.

## Pattern de référence (app déjà bilingue : `apps/brise-glace/index.html`)
Deux cas selon le texte :

### A) Texte statique dans le HTML
Ajoute `data-i18n="cle"` (ou `data-i18n-ph="cle"` pour un placeholder) sur l'élément,
garde le texte FR comme contenu par défaut, puis dans un dico inline applique l'EN.

```html
<h1 data-i18n="title">Mon titre FR</h1>
<input data-i18n-ph="searchPh" placeholder="Rechercher…">
```

```js
const I18N = {
  fr: { title:"Mon titre FR", searchPh:"Rechercher…" },
  en: { title:"My EN title",  searchPh:"Search…" }
};
function applyI18n(){
  const d = I18N[ZTS.getLang()] || I18N.fr;
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const k=el.getAttribute('data-i18n'); if(d[k]!=null) el.textContent=d[k];
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el=>{
    const k=el.getAttribute('data-i18n-ph'); if(d[k]!=null) el.placeholder=d[k];
  });
}
document.addEventListener('zts:ready', applyI18n);
document.addEventListener('zts:langchange', applyI18n);
```

### B) Texte généré par JS (cartes, modales, listes depuis un tableau de données)
Mets le FR et l'EN DANS les objets de données et choisis selon la langue, exactement
comme brise-glace :
```js
const ITEMS = [
  { id:'x', icon:'🎤', fr:{n:'Nom FR', d:'Desc FR'}, en:{n:'EN name', d:'EN desc'} }
];
const lang = ZTS.getLang();
card.innerHTML = `<b>${item[lang].n}</b><p>${item[lang].d}</p>`;
```
Et un dico de labels `LBL={fr:{…},en:{…}}` avec `L()=LBL[ZTS.getLang()]`.
Re-render sur `zts:langchange`.

## Règles strictes
1. **NE traduis PAS** les gros fichiers de données externes (`data/*.json`,
   `data.json`, `games-data.js` volumineux) → c'est le Tier 2, traité à part.
   Traduis uniquement le **texte d'interface** : titres, sous-titres, intros,
   boutons, labels, filtres, placeholders, messages d'état, libellés de modales,
   onglets, légendes, textes d'aide, et les **petits** tableaux de données inline.
2. Anglais naturel, registre pédagogique (profs d'ÉPS, animateurs camps, éducatrices
   SDG). Pas de traduction mot-à-mot. "Brise-glace"→"Ice-breaker", "Jeux calmes"→
   "Calm games", "Échauffement"→"Warm-up", "SAÉ"→garde "SAÉ" (terme PFEQ) etc.
3. Garde le FR identique au texte actuel (ne réécris pas le FR).
4. Ne change pas les classes CSS, IDs, structure DOM, noms de fonctions, ni la logique.
5. Émojis/icônes : conserve-les.
6. Le `<html lang>` peut rester `fr-CA` (zts.js le bascule à `en` dynamiquement).

## Auto-vérification avant de finir (OBLIGATOIRE)
- Chaque clé présente dans `I18N.fr` existe aussi dans `I18N.en` (et inverse).
- Chaque `data-i18n="k"` du HTML a une clé `k` dans le dico.
- Le JS reste valide (pas d'apostrophe non échappée dans les chaînes : `l\'`).
- `node --check` si un .js séparé est modifié ; sinon relis le `<script>`.
- Rends compte : nb de chaînes UI traduites + ce qui reste en FR (données Tier 2).
