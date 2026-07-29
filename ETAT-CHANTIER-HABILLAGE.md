# État du chantier d'habillage — reprise

**Dernière mise à jour** : 29 juillet 2026, palier d) livré — `suppleance` a
son personnage. Il ne reste que `jeux`.
**Dépôt** : `ZoneTotalSport/zts-zone-page` → `/Users/admin/dev/Remotion 2/wix-deploy/`

---

## En production, déjà déployé

### Vague 1 — trois apps habillées, en ligne depuis le 27 juillet

`main` @ `326c379`. Build Pages passé, `Verifie l'habillage` au vert.

| App | Densité | Vérifié en production |
|---|---|---|
| `/apps/jeux/` | travail | shell monté, rail en ruban, bandeau marine |
| `/apps/sae/` | travail | shell monté, `ztsh-encouragements.js` non téléchargé |
| `/apps/musique/` | vitrine | shell monté, encourageur et pause café présents |

Console propre sur les trois. **C'est le premier habillage visible du public.**

**Un défaut est apparu à la mise en ligne, et a été corrigé dans la foulée**
(`326c379`) : la barre du haut était à `rgba(6,23,38,.66)` et empruntait donc sa
teinte au fond de la page. Sur `sae` et `musique` ce fond est le marine du
shell — aucune différence. Sur `jeux`, `apps/jeux/index.html:49` impose
`body{background:#f8fafc!important}`, que le shell n'a le droit ni de contrer
(pas de `!important` hors impression) ni de modifier (contrat des 6 lignes) :
le bandeau y était gris sale. Opacité portée à `.92`, la barre porte désormais
sa propre teinte.

**Leçon pour les vagues suivantes** : tout effet du shell qui repose sur la
transparence est à la merci d'un `!important` dans l'app. À vérifier app par
app, en production et pas seulement en local.

### Fondation (rappel, 26 juillet)

`3d90121`, poussé, rendu de production rigoureusement inchangé — vérifié par
empreinte avant/après sur `/`, `/apps/plan-b-meteo/` et `/apps/suppleance/`.
Les trois fichiers du shell sont passés de 404 à 200, servis en gzip.

## Branches

```
main                      ← fondation + garde-fous, POUSSÉ, en production
├── shell/fondation       ← identique à main, conservée comme base
├── pilote/plan-b-meteo   ← vitrine,    24/24 PASS
├── pilote/nhl-playoffs   ← ABANDONNÉE — l'app est supprimée du site
├── pilote/suppleance     ← travail,    29/29 PASS
└── vague/1-whitelist     ← FUSIONNÉE dans main le 27 juillet
```

**Les trois branches `pilote/*` ont été créées avant le commit `549a143`
(repli `--metier`).** Les rebaser sur `main` avant de les fusionner.

## Ce qui reste à faire, dans l'ordre

### 1. ~~Terminer la vague 1~~ — FAIT le 27 juillet

`vague/1-whitelist` contient quatre apps migrées, 6 lignes de diff chacune,
`verifie-habillage.py` et `verifie-glyphes-ztsh.py` au vert. Les quatre sont
maintenant rejouées avec la liste fonctionnelle du prescan :

| App | Densité | Tests |
|---|---|---|
| `jeux` | travail | **15/15 PASS** |
| `sae` | travail | **PASS** |
| `nba-playoffs` | projection | **PASS, puis retirée** — voir ci-dessous |
| `musique` | vitrine | **PASS** |

**`nba-playoffs` a été retirée de la vague avant la fusion.** L'app est
supprimée du site par la branche `feat/matchs-du-jour` (décision du 27 juillet :
les trois apps sportives cèdent la place aux matchs du jour, en bas de
l'accueil). Son habillage était donc du travail mort : le fusionner aurait posé
un conflit modifie/supprime pour rien. Son fichier est revenu à la version de
`main`, les tests restent consignés ici pour mémoire.

Même raison pour **`pilote/nhl-playoffs`** (16/16 PASS) : branche à abandonner,
pas à fusionner.

Ce qui a été vérifié sur les trois nouvelles, au-delà du montage du shell :

- **`sae`** — 1880 SAÉ chargées, 12 `<select>` présents, filtre cycle (671
  résultats pour le 2ᵉ cycle), recherche en direct, état vide, modale ouverte
  au clic **et** au clavier (`Enter`), `_currentModalSAE` peuplé, `Escape`
  ferme, favori persistant (`favoris-sae`), filtre Favoris, `handleModalCours`
  (toast, z 9999, passe au-dessus du rail), console sans erreur.
- **`musique`** — Commencer, 3 champs, lecture d'une playlist (iframe YouTube
  non recouverte par le rail), URL collée + **JOUER**, `Enter` valide,
  `zts_my_playlist` persistée, encourageur (clic sur Mr Root → nouveau
  message), pause café (**zéro requête réseau**, repli local seul),
  bascule FR/EN du header.
- **`nba-playoffs`** — densité projection : **aucun chrome injecté**, 3 nœuds
  `ztsh-` seulement, `ztsh-encouragements.js` **non téléchargé**. `.zoom-controls`
  libre à droite, zoom +/−/↺ et `zts_nba_zoom` persisté, raccourcis
  `Cmd +/0`, 3 onglets, modale de série + `Escape`, données API chargées.

Trois constats sortis de ces tests, aucun n'est un blocage :

1. **Le banc d'essai ne sait pas envoyer une vraie touche `Enter`** : l'action
   clavier de l'outil arrive avec `e.key === ''`. Toute vérification d'un
   raccourci doit passer par un `KeyboardEvent` synthétique. Ne pas conclure
   « le raccourci est cassé » sur la foi d'une frappe de l'outil.
2. **`sae` masque le header partagé** dès qu'on quitte l'écran d'accueil
   (`.zts-header.hidden` + `.hidden{display:none}` de son `style.css`).
   Comportement antérieur au chantier, vérifié identique sur `main`.
3. **La bulle de l'encourageur dit « Clique-moi encore → » mais la cible
   cliquable est Mr Root**, pas la bulle. Rien ne casse ; à revoir dans une
   passe d'ergonomie, pas ici.

Méthode de comparaison utilisée, réutilisable : copier le fichier de `main`
à côté de celui de la branche (`git show main:apps/X/index.html >
apps/X/zz-base.html`), le servir, rejouer le même geste, supprimer la copie.
La profondeur relative est conservée, donc tous les `../../` résolvent.

### 2. ~~Fusionner la vague 1~~ — FAIT le 27 juillet

`vague/1-whitelist` est dans `main`, poussée, build Pages au vert, trois apps
vérifiées en production. **Restent à fusionner : `pilote/plan-b-meteo` et
`pilote/suppleance`**, après rebasage sur `main` (elles précèdent `549a143`).
`pilote/nhl-playoffs` est abandonnée.

### 3. Vagues suivantes

Ordre du prescan, amendé : les six apps de la whitelist d'abord (faites), puis
les 22 gabarits, puis les apps custom par risque croissant.

`acrosport` est **exclue** — voir `TICKET-ACROSPORT-ENTETE.md`.
`evaluation` et `scoreboard` sont **exclues** — builds Vite, source absente
pour la première.

## Comment tester une app

Le serveur de test doit désactiver le cache, sinon le navigateur sert
d'anciennes versions des assets et fausse tout :

```bash
python3 - <<'EOF' &
import http.server, functools, sys
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control','no-store, no-cache, must-revalidate')
        super().end_headers()
    def log_message(self,*a): pass
http.server.ThreadingHTTPServer(('127.0.0.1',8913),
    functools.partial(H, directory='.')).serve_forever()
EOF
```

Cinq pièges déjà rencontrés, à ne pas re-diagnostiquer :

- **Le banc rapporte un viewport de 0×0** quand le JS tourne pendant que
  l'onglet est en arrière-plan. Toute géométrie mesurée dans cet état est
  fausse : le personnage sort à 0 px de large et les gardes ne se posent pas.
  Deux parades. Une **sonde armée** — un `setInterval` qui attend
  `innerWidth > 0`, fait son travail, dépose le résultat dans une variable —
  puis un screenshot qui ramène l'onglet au premier plan, et on relit la
  variable. Ou, pour un **chargement naturel observable**, une **iframe**
  dimensionnée à la main pointant sur la page à tester : elle charge
  normalement, à la bonne taille, et on l'inspecte depuis le parent.
  Sans ça, on conclut « le personnage est absent en production » alors qu'il
  est là. C'est arrivé au palier c).
- **Une iframe posée hors écran ne déclenche pas le chargement paresseux.**
  L'image du personnage porte `loading="lazy"` : dans une iframe en
  `left:-9999px` elle ne se charge jamais et la sonde rapporte
  `imageChargee: false`. Ce n'est pas un défaut de production. Poser l'iframe
  **dans** la vue — `left:0; opacity:.01; z-index:-1` — et l'image se charge.
  Vu au palier d).
- **La copie de comparaison ne marche pas sur une app gardée.**
  `git show main:apps/X/index.html > apps/X/zz-base.html` donne une page qui
  **échappe au portillon** — `zts-lock-page.js` ne reconnaît pas le nom de
  fichier. Supprimer la copie immédiatement, et ne jamais s'en servir comme
  d'un accès.

- **Le cache du navigateur** survit à `no-store` sur les sous-ressources déjà
  chargées. Changer de port force un rechargement propre.
- **Les animations CSS ne se jouent pas** quand `document.visibilityState`
  vaut `hidden` — c'est le cas pendant l'exécution de JS via l'outil. Un
  screenshot remet l'onglet au premier plan.
- **Les dictionnaires i18n se chargent en asynchrone.** Attendre 600 ms avant
  de vérifier une traduction.

## Points en attente d'une décision

- **D13** — texte blanc sur rose, 3,87 pour un seuil de 4,5. Défaut antérieur,
  atténué par le chantier. Correctif = encre foncée sur le rose, donc une
  passe d'accessibilité dédiée après les vagues.
- ~~**Bug de déconnexion**~~ — **résolu le 28 juillet par une autre session**
  (PR #7). Cause : `.zts-header > *` donnait `z-index:1` à chaque enfant du
  header, le bloc titre passait donc au-dessus de la nav et interceptait le clic
  sur « Déconnexion ». Corrigé par `z-index:2` sur `.zts-header__nav`, dans
  `shared/zts.css` et `shared/zts-header.css`. Sans rapport avec le shell, et
  sans interaction avec son échelle 300–399 : tout se joue dans le contexte
  d'empilement du header.
- **`TICKET-TTF-COPIE-UNIQUE.md`** puis **`TICKET-GLYPHES-ZTS.md`**, dans cet
  ordre.

## POINT DE REPRISE — 29 juillet, après le palier d)

### Là où on s'arrête exactement

**Le prochain geste est le palier e), le dernier** : `jeux`, seule app de
densité `travail` encore sans personnage. `musique` et `plan-b-meteo` sont en
`vitrine`, le personnage y est actif par défaut : rien à activer.

**Attention sur `jeux`** : elle cumule `fondSurEnveloppe: true` et un fond
imposé en `!important` (D23). Deux mécanismes sur la même app. Si le
personnage y pose problème, isoler lequel des deux avant de conclure.

### ~~Palier d)~~ — FAIT le 29 juillet

`suppleance` (`045a714`), un mot de diff, poussée, build vert, **vérifiée en
production**. Choisie avant `jeux` précisément pour garder les causes
séparables.

| Cas | Garde | Résultat |
|---|---|---|
| desktop 1280×720, tel quel | aucune | perso x=900→1184, rien n'occupe le coin |
| après clic | — | 100 messages, bulle ouverte, perso s'élargit à x=776 |
| coin saturé 420×600 | — | **personnage effacé**, gardes remises à zéro |
| retour au normal | basse 74 px | personnage revenu |
| mobile 375×812 | basse 203 px | perso y=497→597, casier en ruban y=663→796, chevauchement 0 |

Recensement des éléments fixes, aux deux tailles : `#loading-screen` 100 % de
la vue → ignoré comme voile ; `header` 40 % → compte mais ne coupe pas la zone ;
`#ztsCookieBanner` 11 % en desktop, 25 % en mobile → compte, et c'est lui qui
pose la garde en mobile. **Aucun bouton flottant d'app** : c'est la différence
avec `sae` et `educatifs`.

**Production, chargement naturel à 1280×800** : personnage présent, image
`perso-ep-264.png` chargée à 264 px, perso x=900→1184, chevauchement 0 avec le
casier, `ztsh-encouragements.js` non téléchargé au chargement.

### ~~Palier c)~~ — FAIT le 29 juillet, en deux temps

**Le point de reprise se trompait** : il annonçait `educatifs` comme un simple
« un mot de diff ». L'app **n'avait jamais été habillée** — aucune trace de
`ztsh` ni de `ZTSShell.monter` dedans. Vérifier avant de promettre un palier.

**Temps 1** (`5dcdd0c`) — les six lignes du contrat, densité `travail`, **sans
encourageur**. **Temps 2** (`26ff6c6`) — le mot en plus. Deux mises en ligne,
deux causes séparables.

Prescan : `body` porte `background-color:#f5f5dc` **sans `!important`** → pas
de `fondSurEnveloppe`. L'app charge `zts-ultra.css` puis `shared/zts-header.css`
→ le CSS du shell vient après, vérifié dans `document.styleSheets`.

Mesures du temps 2, aire de chevauchement calculée et non estimée :

| Cas | Garde | Résultat |
|---|---|---|
| desktop 1280×720, tel quel | aucune | perso s'arrête à x=1184, `.cours-fab` à x=1190 |
| après clic | — | banque chargée, 100 messages, bulle ouverte ; perso s'élargit à x=776, chevauchement 0 |
| coin saturé 420×600 | — | **personnage effacé**, gardes remises à zéro |
| retour au normal | basse 74 px | personnage revenu, chevauchement 0 |
| mobile 375×812 | basse 203 px | perso y=497→597, `.cours-fab` y=742→796 |

**Portillon vérifié à chaque mesure** : `#zts-locked-fullscreen` intact à
z-index 99998, pleine largeur, ses trois boutons répondent au clic, défilement
bloqué. Le shell plafonne à 350. Rien n'est affaibli.

**Production, chargement naturel à 1280×800** : personnage présent, image
chargée, perso x=900→1184, `.cours-fab` x=1190→1252, **chevauchement 0**,
`ztsh-encouragements.js` non téléchargé au chargement, console propre.

**Limite** : `educatifs` est derrière le portillon (D14). Sans compte réel, la
liste fonctionnelle — cartes, filtres, modale, `.cours-fab` réellement cliqué —
n'a pas été déroulée. Les mesures portent sur le montage, l'ordre des feuilles,
la géométrie et le verrou. **Le bouton flottant existe et est mesurable dans le
DOM même verrouillé** : c'est ce qui rend le test de collision possible malgré
le portillon.

### ~~Palier a)~~ et ~~palier b)~~ — FAITS le 29 juillet

**a)** Garde générique du personnage (`0ca4f8b`), poussée. Détection par
géométrie, pas par liste de classes : on regarde ce qui coupe réellement le
rectangle du personnage. Assez de place → on décale ; pas assez → **le shell
s'efface**. Les voiles plein cadre (>60 % de la vue) sont ignorés.

**b)** `encourageur: true` sur `apps/sae/` seule (`7ce1087`), poussée, build
Pages au vert, **vérifiée en production**. Un seul mot change dans les six
lignes du contrat. La densité reste `travail` : le personnage est **silencieux
au chargement**, la banque de 100 messages (9,3 Ko) n'arrive qu'au premier clic.

Ce que le banc a mesuré, quatre cas, la garde aux commandes :

| Cas | Garde posée | Résultat |
|---|---|---|
| desktop 1280×720, sans bandeau | aucune | perso s'arrête à x=1176, `.cours-fab` commence à x=1182 |
| desktop 1280×720, bandeau cookies | basse 74 px | perso remonte au-dessus du bandeau |
| mobile 375×812, sans bandeau | droite 70 px | perso s'arrête à x=293, `.cours-fab` à x=305 |
| mobile 375×812, bandeau (203 px, 25 % de la vue) | basse 203 px | perso de y=497 à 597, bandeau à partir de 609 ; les trois boutons du bandeau restent cliquables |
| coin saturé 420×600 | — | **personnage effacé**, gardes remises à zéro |
| retour au normal | basse 74 px | personnage revenu, aucun chevauchement |

Vérifié aussi : clic → banque chargée (100 messages), message affiché, bulle
ouverte, **toujours aucun chevauchement bulle déployée**. `sae` intacte
(12 `<select>`, 30 cartes, console sans erreur). En production : personnage
présent, casier présent, densité `travail`, `ztsh-encouragements.js` **non
téléchargé au chargement**, console propre.

**Le bandeau de cookies est un bloqueur légitime**, découvert au banc : à 25 %
de la vue il passe sous le seuil des 60 %, la garde le prend donc en compte et
soulève le personnage. C'est le bon comportement.

**Limite connue, acceptée** : les gardes sont mesurées au montage puis **une
fois** après chargement complet. Si le bandeau de cookies est fermé ensuite, la
garde reste posée jusqu'au rechargement et le personnage est un peu haut.
Cosmétique. Un observateur permanent sur 46 apps coûterait plus que ça ne
rapporte. **Si on veut la fermer un jour** (décision de Joey, 29 juillet,
basse priorité) : un seul re-mesurage déclenché sur le clic d'acceptation du
bandeau suffit. Pas d'observateur permanent.

### Ce qui s'est passé le 29 juillet, dans l'ordre

1. Poussé : calque de fond fixe, webp 264 px, silence hors vitrine,
   effacement, garde basse `.ztg-out`, rapport d'erreur de `monter()`.
2. **Régression trouvée en production sur `sae`** : `.cours-fab` (54×54,
   z-index 1000) recouvrait 2916 px² du personnage sur 11815, un quart.
3. **Retour arrière** : `encourageur` remis à `false` en `travail` et
   `projection`. Les cinq apps sont revenues à leur état d'avant.
4. Garde générique écrite et validée au banc sur `sae`.

### La leçon, à ne pas réapprendre

Le prescan avait listé les six boutons flottants. La garde `.ztg-out` et
l'effacement ont été écrits ; **la garde des boutons flottants a été oubliée**.
Un prescan qui repère un risque ne vaut que si chaque ligne devient du code ou
une décision écrite. Cocher le prescan ne suffit pas.

### État de la production

**Six** apps habillées et saines : `jeux`, `sae`, `musique`, `plan-b-meteo`,
`suppleance`, `educatifs`. Personnage actif sur **cinq** : `musique` et
`plan-b-meteo` par la densité `vitrine`, `sae` (palier b), `educatifs`
(palier c), `suppleance` (palier d). **Reste `jeux`, et c'est tout.**
`main` poussé à `045a714`, build vert, `Verifie l'habillage` au vert (seul
avertissement : `jeux`, D23, antérieur).

### Ce qui attend, dans l'ordre

1. **Palier c) puis d)** de la garde du personnage — `educatifs` d'abord.
2. **Banc `tni`** — avant d'activer le fond marine en densité `projection`.
   `tni` pose un `#gymBg` fixe à 15 % d'opacité ; le marine passerait au
   travers, le `<canvas>` du tableau garde son blanc. À voir tourner.
3. **L'accueil** — `index.html` n'a jamais reçu l'habillage. **Toujours
   bloqué**, mais on sait enfin où chercher. `_maquettes/` est vide. La
   maquette de référence (md5 `fc6e6551ee6b97770b6f9b61aa9814b8`) reste
   introuvable. **Trois versions voisines dorment à la corbeille**, toutes
   titrées « ZTS — Direction C · WOW + personnages » :

   | Fichier | Empreinte | Taille | Heure (25 juillet) |
   |---|---|---|---|
   | `zts-final-marine.html` | `e23eeddb…` | 37,0 Ko | 9:00 |
   | `zts-final-marine_1.html` | `5394bc1c…` | 37,3 Ko | 9:08 |
   | `zts-final-marine_2.html` | `f10e09bc…` | 42,0 Ko | 9:12 |

   **Aucune ne correspond à l'empreinte consignée.** Ce sont des itérations
   successives, pas la version retenue. Joey doit dire laquelle fait foi — ou
   retrouver la bonne — avant qu'on touche à l'accueil. Ne rien reproduire de
   mémoire, et ne pas choisir à sa place : trois candidates valent zéro
   certitude.
4. **Temps 2** — suppression des apps sportives, après que Joey ait posé les
   9 redirections (`redirections-cloudflare.csv`) et que je les aie vérifiées.
5. **Vague 2** — 22 gabarits, protocole allégé décrit plus bas.

## Deux mécanismes décidés le 28 juillet

### `fondSurEnveloppe` — récupérer le marine sous un fond imposé

Quatre apps imposent leur fond de page en `!important` (D23). Le marine du
shell, posé sur `<html>`, est alors recouvert, et les rayons avec.

**Le repli fonctionne, vérifié au banc.** `.ztsh-page` est un enfant de
`<body>`, donc peinte **après** le fond de body : y poser le marine le fait
réapparaître, sans `!important` et sans toucher au fichier de l'app.

Deux conditions, toutes deux vérifiées :

| Piège | Réponse | Preuve |
|---|---|---|
| L'enveloppe doit couvrir toute la hauteur | `min-height: 100vh` | mesuré à 1003 px sur un écran de 1003 px |
| Le fond ne doit pas avaler un décor que l'app pose en z-index négatif | `isolation: isolate` | contre-épreuve : le même décor disparaît sans elle |

`isolation: isolate` n'est pas cosmétique. Sans elle, un `z-index:-1` posé dans
l'enveloppe se résout dans le contexte d'empilement de la racine et passe
**derrière** le fond de l'enveloppe — on aurait échangé une disparition contre
une autre. Avec elle, l'enveloppe devient le contexte de référence : les
z-index négatifs de l'app se placent au-dessus de son fond, sous son contenu.
Les rayons suivent le même chemin, par `::before` plutôt que par un nœud fixe,
qui lui passerait sous l'enveloppe.

Le banc d'essai a comparé trois cas côte à côte — avec isolation, sans, et sans
le fond du tout. Il n'est pas conservé au dépôt : la recette tient en dix
lignes, elle est ici.

**Ce que ça rapporte, honnêtement** : le marine réapparaît **là où l'app ne
peint pas**. Sur `jeux`, dont chaque section porte son propre fond, ce sont les
gouttières et les marges — un gain réel mais modeste. Sur une app au fond plus
nu, ce sera davantage. La bande du header, elle, reste hors de l'enveloppe :
`.ztsh-page` s'ouvre après l'hôte `[data-zts-header]`, les 317 px du haut
gardent le fond de l'app.

**Option réservée**, jamais automatique : `fondSurEnveloppe: true`. Appliquée à
`jeux` (en production). À poser sur `transitions` à la vague 5 et sur
`planificateur` si elle est migrée. Jamais sur les autres : sans fond imposé,
le marine de `<html>` fait déjà le travail, et l'enveloppe n'a pas à porter un
fond de plus.

### Une app, deux densités selon son mode — le premier cas

**`planificateur` masque l'en-tête partagé** en `?v2=1` et en mode intégré
(D24). Ce n'est pas un défaut : c'est une surface de travail, et l'app a décidé
de rendre le haut de page à son contenu.

**On respecte l'intention de l'app.** Lui réimposer une barre changerait son
comportement, ce que le contrat interdit. Donc :

| Mode | Densité | Ce que le shell apporte |
|---|---|---|
| `?v2=1` et mode intégré | `projection` | les tokens seuls — aucun chrome, aucun fond |
| mode normal | `travail` | barre, casier en ruban, pas d'encourageur |

La densité se décide **au moment du montage**, dans les six lignes du contrat :

```html
<script>ZTSShell.monter({
  densite: (document.body.classList.contains('pv2') ||
            document.body.classList.contains('zts-embed')) ? 'projection' : 'travail'
});</script>
```

C'est le premier cas du genre et il y en aura d'autres — `cours-maternelle` a
son mode TBI, `tni` et `studio-jeu` leur plein écran. La règle générale :
**quand une app se réorganise elle-même pour une tâche, le shell descend d'un
cran de densité au lieu de discuter.**

## Vague 2 — protocole allégé, sous condition stricte

Décidé le 29 juillet. Rejouer 22 listes fonctionnelles complètes sur des
gabarits identiques n'apprend rien ; l'allègement se paie par une condition
qui, si elle tombe, fait tomber l'allègement avec elle.

**Densité : `vitrine` pour les 22.** Ce sont des banques de contenu qu'on
consulte, pas des outils qu'on pilote pendant un cours.

| Lot | Apps | Protocole |
|---|---|---|
| Les 6 variantes | `journee-pedago`, `olympiades`, `rallyes`, `noms-de-clans`, `chansons-camp`, `roue-responsabilites` | **rejeu complet** |
| 2 gabarits tirés au sort | parmi les 17 identiques | **rejeu complet** |
| Les 15 autres | le reste des identiques | chargement, filtre, modale, console |

**LA CONDITION.** Si le diff d'un seul des 17 n'est pas rigoureusement
identique aux autres, **celui-là repasse en rejeu complet**. Le diff identique
est ce qui justifie l'allègement ; sans lui, il n'y a plus d'argument.

Vérification, à lancer après la migration des 17 :

```bash
for a in <les 17 slugs>; do
  printf "%-22s %s\n" "$a" "$(git diff main -- apps/$a/index.html | grep '^+' | grep -v '^+++' | md5)"
done | sort -k2 | uniq -c -f1
```

Une seule empreinte pour les 17 : l'allègement tient. Deux empreintes ou plus :
les divergents repassent au rejeu complet.

Points d'attention, tirés du prescan :

- `olympiades` — l'état est en mémoire et se perd au rechargement. **C'est le
  comportement actuel, à ne pas « corriger ».**
- `journee-pedago`, `olympiades`, `rallyes` — impriment la page courante ; la
  règle `@media print` du shell doit être vérifiée sur au moins une des trois.
- `noms-de-clans` — ni modale ni recherche : la liste commune ne s'applique pas.
- Les 24 portent `.ztg-out` : rejouer une liste complète **demande un compte
  réel** (D14). À planifier avec Joey pour les 8 rejeux complets.
- Aucune n'impose de fond en `!important` : la vague 2 est propre de ce côté.
- `planification` ferme la marche, après les 22.

## Ce qu'il ne faut jamais faire

- Ajouter un contournement du portillon dans `zts-gate.js` ou
  `zts-lock-page.js`, même temporairement.
- Utiliser `!important` hors du bloc `@media print`.
- Rebaser les tokens de **dimension** (`--fs-*`, `--r-*`, `--space-*`). Seuls
  les tokens d'**identité** se rebasent.
- Charger `assets/ztsh-shell.css` **avant** `shared/zts.css`,
  `zts-header.css` ou `zts-ultra.css` — la panne serait silencieuse.
- Modifier un fichier d'app au-delà des 6 lignes du contrat.
