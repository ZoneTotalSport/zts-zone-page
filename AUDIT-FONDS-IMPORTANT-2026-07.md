# Audit — fonds imposés en `!important`

**28 juillet 2026, avant la vague 2. Lecture seule : aucun fichier d'app touché.**

Commandé après l'aller-retour en production du 27 juillet sur `apps/jeux`, dont
le `body{background:#f8fafc!important}` a rendu le bandeau du shell gris sale.
La question : combien d'autres apps réservent la même surprise, et à quelle
vague.

**Réponse courte : trois, plus `jeux`. Aucune n'est dans la vague 2.**

---

## Ce sur quoi l'habillage compte, exactement

Le shell pose son fond **sur `<html>`**, pas sur `<body>` :

```css
html.ztsh-on { background-color: var(--ztsh-marine); background-image: … }
body.ztsh-on { background: transparent; }
```

Ce n'est pas un détail de style. Un fond opaque sur `body` place tout z-index
négatif de la page **derrière lui** — c'est le modèle d'empilement normal. Le
shell laisse donc `body` transparent pour ne masquer aucun décor qu'une app
poserait en z-index négatif.

Conséquence : ce qui dépend de la transparence de `body`, c'est

1. **le fond marine** — dégradé, trame de points, halo jaune ;
2. **les rayons** `.ztsh-rayons` — `position:fixed`, `z-index:-3`.

Ce qui n'en dépend **plus** :

3. **la barre du haut**. Elle était à `rgba(6,23,38,.66)` et empruntait donc sa
   teinte au fond de la page ; elle est à `.92` depuis le 27 juillet et porte la
   sienne. C'est le correctif qui a clos l'incident `jeux`.
4. **le casier, l'encourageur, la pause café** — fonds opaques en propre.

Autrement dit : sur une app qui impose son fond, **le chrome reste lisible, le
décor de fond disparaît**. L'app n'est ni cassée ni illisible ; elle est
simplement habillée à moitié.

---

## Ce que le balayage a trouvé

45 dossiers sous `apps/`, tous les `<style>` de page et tous les `.css` du
dossier de chaque app, plus les styles inline de `<html>`, de `<body>` et des
conteneurs de premier niveau.

### Les quatre cas réels

| App | Vague | Déclaration | Ce qui est perdu |
|---|---|---|---|
| `jeux` | **1, en production** | `<style>` — `body{background:#f8fafc!important}` | marine + rayons. Barre corrigée le 27 juillet. |
| `transitions` | 5 | `<style>` — `body{background:#f8f9fa!important}` et `body::before{…!important}` | marine + rayons |
| `planificateur` | 6 | `<style>` — `body.pv2{background:repeating-conic-gradient(…)!important}` | marine + rayons, **et la barre du haut** (voir ci-dessous) |
| `scoreboard` | hors chantier | `<style>` — `body{background-color:#E0F7FF!important}` | sans objet — build Vite, exclue |

**Aucune app de la vague 2** (les 22 gabarits) **n'est concernée.** Elles n'ont
ni CSS propre ni `!important` de fond : leur `<style>` inline ne fait que
quelques classes locales préfixées. La vague 3 (`colorier`, `musique`,
`moyens-action`, `performances`, `acrosport`) est nette elle aussi, et la
vague 4 (`agenda`, `grille`, `nba-playoffs`, `nhl-playoffs`) également.

### `planificateur` — le cas le plus lourd, et il ne s'agit pas que du fond

Six déclarations, dont deux qui vont **dans le sens du shell** :

```css
body.zts-embed          { background: transparent !important }
html:has(body.zts-embed){ background: transparent !important }
```

En mode intégré (iframe dans un hub), l'app se rend volontairement transparente.
Le shell n'y perd rien — mais le `html:has(…)` efface aussi le marine du shell.

Le vrai problème est ailleurs, et le balayage des fonds l'a mis au jour :

```css
body.pv2 [data-zts-header], body.pv2 .zts-subnav, … { display:none !important }
body.zts-embed [data-zts-header], …                { display:none !important }
```

**Dans ses deux modes modernes — `?v2=1` et le mode intégré — le planificateur
masque purement et simplement l'en-tête partagé.** Or le shell n'a pas de barre
à lui : il restyle `.zts-header`. Pas d'en-tête, pas de barre du haut.

À trancher avant de migrer cette app, pas pendant. Elle était déjà « risque 3
maximum, à placer en dernière vague ou à exclure » au prescan ; ceci s'ajoute au
dossier.

### Les cas bénins, listés pour que personne ne les re-signale

Ces `!important` sont sous `@media print`. Y forcer un fond blanc est l'usage
attendu — le shell fait exactement pareil.

`sae`, `suppleance`, `agenda`, `generateur`, `educatifs`, `journee-pedago`,
`planification`, `rallyes`, `olympiades`.

`transitions` a aussi `.record-toast{background:#fff!important}` : c'est une
notification passagère, pas une surface de page. Signalée par le garde-fou parce
qu'elle est enfant direct de `<body>` ; sans conséquence.

### Ce qui n'existe pas

**Aucune app n'impose de fond en `!important` sur `.zts-header`.** La barre du
haut n'est contestée nulle part — les seules règles `!important` qui la visent
sont des `display:none` d'impression, plus les deux du planificateur ci-dessus.

**Aucun `!important` de fond dans `shared/zts.css`, `shared/zts-header.css` ni
`zts-ultra.css`.** Les trois `!important` de fond de `zts-ultra.css` portent sur
`.pres-section`, `.pres-card` et `.pres-start-btn` — du contenu, pas une surface
de page.

---

## Le contrôle est maintenant dans le garde-fou

`_scripts/verifie-habillage.py`, **contrôle 6, en avertissement**, jamais
bloquant : l'app reste fonctionnelle, c'est une perte de décor, pas une panne.

```bash
python3 _scripts/verifie-habillage.py           # apps migrées — avertit si fond imposé
python3 _scripts/verifie-habillage.py --fonds   # les 45 apps, migrées ou non
```

Le mode `--fonds` est là pour ça : savoir **avant** une vague quelles apps
recouvriront le marine. Le contrôle 6 ordinaire ne voit que les apps déjà
migrées, ce qui serait trop tard.

Il regarde `html`, `body`, `:root`, `*`, les conteneurs de premier niveau et les
styles inline ; il ignore ce qui est sous `@media print` ; il suit les at-règles
imbriquées (`@supports`, `@media screen`). Cinq cas de test ont servi à le
vérifier, dont deux pièges : une liste de sélecteurs (`*, body, p`) et une règle
sous `@media screen` qui, elle, doit bien ressortir.

---

## Ce que je n'ai pas fait

Corriger quoi que ce soit. Les quatre déclarations restent en place : les
toucher changerait l'apparence d'apps en production, ce qui est une décision, pas
une conséquence de l'habillage. Elles rejoignent le registre de dette technique.
