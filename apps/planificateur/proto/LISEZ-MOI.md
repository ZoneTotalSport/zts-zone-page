# Proto G2 — Planificateur « simplicité »

Maquette de **validation visuelle**, pas du code de production. Rien n'est
branché sur Firestore : toute la saisie vit en `localStorage`, sous le préfixe
`protog2:`, et se jette en deux gestes (RÉGLAGES › MES DONNÉES › « Vider ma saisie »).

## ⚠ G3 — LA SIMPLIFICATION (29 août 2026) : trois onglets, une barre

Mandat de Joey : « qu'un enfant de 10 ans l'utilise sans aide. AUCUNE perte de
fonction — tout ce qui existe est conservé, seulement déplacé ou fusionné. »

**Tout ce qui suit s'ajoute au reste de ce document, et le corrige là où il
décrit encore cinq onglets ou une barre de buzzer.**

### La barre : les QUATRE horizons de temps, puis ⋯ PLUS

*(31 août — Joey : « mets de gros boutons visuels pour ma semaine, mon mois,
mon année, ma journée : je veux les voir ». Les cinq portes remplacent les
trois onglets du 29.)*

| Porte | Ce qu'on y fait |
|---|---|
| **📋 MA JOURNÉE** | Ses périodes, une carte chacune. Écran d'ouverture. |
| **🗓️ MA SEMAINE** | La grille. On y glisse ses groupes. |
| **📅 MON MOIS** | Le mois, jours-cycle et notes. |
| **📚 MON ANNÉE** | Une ligne par semaine : compétence · moyen d'action · activité. |
| **⋯ PLUS** | Calendrier scolaire · Mes groupes · Mon temps · Réglages · Partage · Vue coordonnateur · Mes autres outils |

⚠ **MON MOIS et MON ANNÉE étaient à TROIS touches** — ⋯ PLUS › CALENDRIER ›
VOIR PAR MOIS. Ce sont deux des quatre horizons du métier ; les ranger sous le
calendrier scolaire, qui n'est qu'un réglage d'année, était une erreur. Ils ont
leur porte, et un lien LATÉRAL « 📆 CALENDRIER SCOLAIRE » (plus un « ← » : on
n'en revient pas, on y va).
⚠ **Ils n'étaient peints QU'UNE FOIS**, au démarrage : maintenant qu'on peut y
aller à tout moment, ils se repeignent à l'arrivée, sinon on lit des jours-cycle
périmés.

**Chaque porte est un GROS bouton** — icône au-dessus de son nom, 84 px de
haut. On ne grossit que `#nav>button` : les ✕, ✎ et pastilles du reste de
l'app restent minuscules par dessein (piège n° 19 du journal).

⚠ **Le coin droit de la barre est UN SEUL BLOC** (`.nav-fin`) : `−`, `+`, puis
la roue dentelée. Séparés, la taille tenait sur la rangée et la roue débordait —
elle se retrouvait **seule sur une deuxième rangée**. Groupés, ils voyagent
ensemble et restent « complètement à droite » à toute largeur.
⚠ `margin-left:auto` exige que la barre reste en `flex` : en `grid`, `auto` ne
pousse rien.

### La taille — deux petits boutons, et rien d'autre

⚠ **TROISIÈME ÉTAT DE CETTE COMMANDE, ET C'EST LE BON.** Le 29 août, les quatre
paliers nommés (De près · En classe · 🏀 GYMNASE · 🏀 FOND DU GYMNASE) ont
remplacé le `− / 200 % / +` ; le 31, Joey les a vus et refusés : « je n'aime pas
les boutons pour afficher plus gros, enlève cela ; je veux juste un petit + et −
complètement à droite. »

Il ne reste donc que **deux petits boutons**, dans le coin droit de la barre,
qui parcourent l'échelle fine d'un cran par clic :
`100 · 120 · 145 · 170 · 200 · 230 · 260 · 300`.
Les huit crans ont toujours eu leur règle CSS — rien n'a été à rétablir.

⚠ **Le pourcentage ne s'affiche plus** : il vit dans l'info-bulle, avec la
distance de lecture (« actuellement 200 %, lisible du gymnase »). Deux petits
boutons ne doivent pas redevenir une barre de réglage — c'est tout l'intérêt de
les avoir remplacés.
⚠ Ils se **désactivent** aux deux bouts de l'échelle : un bouton qui ne fait
rien doit le dire.
⚠ Ils sont dans la BARRE, pas sur la grille : la taille vaut pour toute l'app,
et la ligne où vivaient les quatre paliers n'existait que sur MA SEMAINE.

La règle qui décide de la place d'une chose : **à quelle fréquence s'en sert-on ?**
Rien n'a été coupé : ⋯ PLUS mène aux sept écrans, chacun avec son « ← PLUS ».

### 31 août (suite) — la barre complète, et le calendrier qui s'importe

**La barre porte maintenant NEUF portes**, dans l'ordre du temps puis du reste :

📋 MA JOURNÉE · 🗓️ MA SEMAINE · 📅 MON MOIS · 📚 MON ANNÉE · 📆 MON CALENDRIER ·
🏅 MON PARASCOLAIRE · 🔗 MES AUTRES APPS *(menu déroulant)* · ⋯ PLUS · **⚙️** *(petite
case, poussée complètement à droite)*.

- **📤 Partager** a rejoint **l'en-tête**, en petit, à côté de l'horloge : ce
  n'est ni un horizon de temps ni un réglage.
- **MON TEMPS devient MON PARASCOLAIRE** — les heures faites en parascolaire.
- **🔗 MES AUTRES APPS est un menu**, pas un écran : quatre liens externes ne
  méritaient pas une page. `AUTRES_APPS` est écrite une fois, plus deux.
- **⋯ PLUS** ne garde que ce qui n'a pas de porte propre : Mes groupes et Vue
  coordonnateur.
- ⚠ **La barre doit rester en `flex`.** `margin-left:auto` ne pousse RIEN dans
  une grille : en `grid`, la roue n'était plus « complètement à droite », juste
  neuvième — et à 375 px les cinq colonnes réclamaient 496 px, elle sortait de
  l'écran de 33 px.

### Les onglets de groupes

Joey : « place tous les groupes en dessous de ma journée, ma semaine, etc. »

La palette a quitté MA SEMAINE pour **`#ongletsGr`, sous la barre, visible
partout** — c'est le seul sélecteur de groupe de l'app, il n'a pas à
disparaître selon l'écran. **Toutes ses fonctions sont intactes** : glisser dans
une case, ✎ personnaliser, le compte de cours de la semaine, et le clic qui
prend le groupe en main **et** le pose comme groupe courant.

⚠ **LE BISEAU À 45° A ÉTÉ ESSAYÉ PUIS ABANDONNÉ.** Joey, devant l'écran :
« non, les groupes ne sont pas en angle de 45 degrés ; on va à la place les
mettre dans ce style-là » — celui des boutons de la barre. Les onglets ont donc
la grammaire de tout le reste de l'app : coins arrondis, contour noir épais,
ombre dure — **en plus petit, et colorés selon le groupe**.

⚠ **La police est `--f-display` (ZoneTotalSport.ttf), qui ne porte que
145 glyphes.** Vérifié : chiffres, MAJUSCULES, minuscules et lettres accentuées
passent — donc `101`, `202`, `303-403`, `MATERNELLES`. Manquent le tiret
cadratin, l'apostrophe courbe et les guillemets français ; la pile de repli
(LuckiestGuy, Bangers) rattrape caractère par caractère. **Ne pas l'employer
ailleurs pour du texte courant.**

⚠ **Deux boutons de service ont quitté la ligne** — « ＋ NOUVEAU GROUPE » et
« 🎨 TOUTES DIFFÉRENTES ». Il ne reste qu'un **＋ complètement à droite**, qui
ouvre une petite fenêtre où l'on nomme le groupe **et** choisit sa couleur, avec
aperçu en direct : l'ancien bouton demandait le nom par `prompt()` et imposait
la couleur. 🎨 TOUTES DIFFÉRENTES n'est pas perdu — il rejoint la fenêtre de
personnalisation d'un groupe, à côté des couleurs, là où l'on se pose la
question.
⚠ `margin-left:auto` exige que la ligne reste en `flex`. Même piège que la roue
dentelée de la barre du haut.
⚠ **Deux liserés jaunes sur le même objet, c'est un seul signal.** Le liseré
JAUNE dit « c'est le groupe dans lequel j'écris » ; le groupe qu'on a EN MAIN,
en train de chercher sa case, porte un liseré **lime** — comme tout ce qui
attend un dépôt dans ce proto.
⚠ Les onglets **ne sont pas collants** : ils défilent avec la page. Trois barres
figées l'une sous l'autre mangeraient la moitié d'un téléphone.

### Le titre EST la commande — plus de bande jaune

Joey : « enlève la bande jaune et le mot AUJOURD'HUI dans le jaune ; garde
seulement “aujourd'hui lundi 31 août”, centre-le, et mets une flèche à sa droite
pour aller au mardi et une à sa gauche pour la journée d'avant. »

⚠ **La bande disait, en petit et sur fond jaune, la date que le titre annonçait
déjà en gros trente pixels plus bas** ; sa pastille de jour-cycle répétait la
ligne d'explication ; et son bouton AUJOURD'HUI restait allumé même quand on
ÉTAIT sur aujourd'hui — c'est-à-dire la plupart du temps.

Désormais : **◀ titre ▶**, centré, sur MA JOURNÉE comme sur MA SEMAINE. Le
retour — « ↩ REVENIR À AUJOURD'HUI », « ↩ REVENIR À CETTE SEMAINE » —
**n'apparaît que lorsqu'on s'est éloigné**. Un bouton qui ne sert à rien neuf
fois sur dix apprend à être ignoré.
⚠ L'en-tête de l'agenda a perdu son `<h2>Semaine du …</h2>` : le titre le disait
déjà, à trente pixels.

### MON CALENDRIER — l'import qui marche vraiment

Joey : « mon calendrier est le calendrier scolaire, donc on peut importer les
dates importantes ; ça se place automatiquement avec les journées pédagogiques,
les jours-cycle s'il y en a, les dates scolaires importantes ».

⚠ **Trois défauts empêchaient que ça marche :**

1. **Une semaine de relâche ne posait qu'un lundi.** Un `.ics` l'écrit en UN
   événement, `DTSTART` au lundi, `DTEND` au samedi ; on ne lisait que
   `DTSTART`. Les jours sont maintenant dépliés — et `DTEND` est **exclusif**
   pour une journée entière (RFC 5545), sinon on pose un jour de trop.
2. **Tout ce qui n'était ni congé, ni pédago, ni force majeure était JETÉ.**
   La rentrée, les bulletins, la rencontre de parents, la photo scolaire :
   comptés en « sans catégorie » et perdus. Ils deviennent la **note de leur
   journée** et s'affichent dans MON CALENDRIER **et** dans MON MOIS.
3. **Les jours-cycle n'étaient PAS recalculés après l'import.** C'est pourtant
   l'effet principal : une pédagogique décale tout ce qui suit. Rien ne bougeait
   jusqu'au prochain rechargement de la page.

Deux défauts de plus, trouvés au passage :
- ⚠ **Une journée avait DEUX notes qui s'ignoraient** — `caljour:<iso>` pour le
  calendrier, `ed:mn-<iso>` pour la case du mois. Une seule clé désormais
  (`ed:mn-`), les anciennes reprises par `migrerNotesDeJour()`.
- ⚠ **`rafraichirCycles()` gardait sur `#moisHote`, qui n'existe pas** — la
  grille s'appelle `#moisGrille`. MON MOIS n'a donc jamais été rafraîchi quand
  on changeait la longueur du cycle, et MON ANNÉE pas du tout. *Piège n° 17
  encore : un garde qui ne se déclenche jamais ressemble à un garde qui protège.*
- ⚠ **Les lignes d'un `.ics` se REPLIENT à 75 octets**, la suite commençant par
  une espace : sans dépliage, un `SUMMARY` long est tronqué au milieu d'un mot.
- ⚠ Le compte-rendu **annonçait comme « non reconnues » les dates qu'il venait
  de garder**. Il dit maintenant : journées posées · dates importantes notées ·
  jours-cycle recalculés · hors année.

L'import était offert à **deux endroits** (l'écran du calendrier et MES
DONNÉES). On garde celui du calendrier : c'est là qu'on voit le résultat se
poser.

### Une période = une CARTE, avec ses images

*(31 août — « au lieu que ce soit un rectangle mince, mets de la place pour
pouvoir afficher les images ». Joey accepte de défiler pour ça.)*

Trois colonnes : **QUAND** (période et heures, 30 px) · **le cours** (groupe,
activités, puces) · **ses images**. 206 px de haut au minimum.

⚠ **Les illustrations ne sont PAS une donnée nouvelle** : ce sont les `medias`
des étapes de la séance, ceux-là mêmes qu'on dépose dans la fiche de cours. La
journée les MONTRE, gros — c'est ce qu'un prof regarde en entrant au gymnase.
On peut aussi en lâcher une directement sur la bande : elle rejoint la première
étape du « pendant », qui naît si elle n'existe pas encore.

⚠ **La bande n'est pas DANS le bouton du cours** — un `<button>` dans un
`<button>` ne survit pas au navigateur (piège n° 13). C'est un frère, avec ses
propres gestes.

### Neuf doublons ramenés à un seul exemplaire

| Il y en avait deux | Il n'en reste qu'un |
|---|---|
| Barre jaune ◀ jour ▶ **et** ◀ semaine ▶ dans la grille | **Une barre contextuelle** : jour sur AUJOURD'HUI, semaine sur MA SEMAINE, cachée ailleurs |
| Menu « J'ÉCRIS DANS » **et** jetons colorés | **Les jetons.** Toucher un jeton pose `ctxGroupe` (le carnet a les siens) |
| − / 200 % / + sur la grille **et** 4 paliers dans RÉGLAGES | **Les 4 distances, sur la grille** — De près · En classe · 🏀 GYMNASE · 🏀 FOND DU GYMNASE |
| Barre de buzzer collée en bas de CHAQUE écran **et** section « Son du buzzer » | **Le buzzer dans la minuterie du tiroir 🎲 JEUX**, avec elle |
| « Mon plan de session » (Semaine 1…6, sans date) **et** la semaine affichée | **Une clé par semaine réelle** : `ed:sqw-<lundi>`. Les deux écrans écrivent dedans |
| Vue coordonnateur écrite **deux fois** (dont une morte, visant `#e-messages`) | **La version complète**, sur son écran, depuis ⋯ PLUS |
| « Mon horaire » (vivant) **et** « Horaire de l'école » (mort, clés `ed:hor-N` que rien ne relit) | **« 🕐 Mon horaire »**, celui qui alimente vraiment l'agenda |
| `nav2()` posait 4 boutons **effacés** par `barreEnMenus()` | La barre à trois onglets, seule source |
| Deux contrôles d'accès tournant **trop tôt** | Un seul, en fin de chargement, dans `proto-g3.js` |

### Ce qui a DÉMÉNAGÉ (rien n'est perdu)

- **▶ DÉMARRER LA SÉANCE** et **📺 MODE TABLEAU BLANC** : RÉGLAGES → 📋 AUJOURD'HUI.
  Ce sont les gestes du DÉBUT d'un cours, pas des réglages.
- **⭐ Comment je note** : RÉGLAGES → MES GROUPES, avec le carnet et les bulletins.
  Les trois répondent à la même question.
- **📤 Partager avec un collègue** : ressorti des RÉGLAGES, sa propre tuile.
  **💾 Mes données** y reste — sauvegarde, restauration, vidage.
- **🧹 Vider ma saisie** : bandeau → RÉGLAGES › MES DONNÉES, **en deux temps**
  (le 1ᵉʳ geste arme, le 2ᵉ efface, ça se désarme seul après 10 s).
- **👤 Pour qui est cette app** (les 3 métiers) : MA SEMAINE → RÉGLAGES.
- **🔗 Mes autres outils** : accueil → son écran, depuis ⋯ PLUS.

### Le bug bloquant, corrigé

« Touche une journée pour l'ouvrir » était écrit sous le titre et **ne faisait
rien** : le geste visait `e-journee`, un écran retiré ; le garde d'`allerA()`
renvoyait à l'accueil en remontant la page. Il existe maintenant un écran de
journée. **Toucher un en-tête de jour ouvre 📋 AUJOURD'HUI sur ce jour.**

### Règle des trois touches — mesurée, pas supposée

| Geste quotidien | Touches depuis l'ouverture |
|---|---|
| Écrire un cours | **1** (le cours du jour) — 2 pour un autre jour |
| Piger un jeu | **2** (🎲 JEUX · AJOUTER) |
| Partir la minuterie | **3** (🎲 JEUX · 10 · ▶ PARTIR) |

**6 éléments interactifs permanents** avant le contenu : 3 onglets + 3 boutons
de la barre contextuelle.

### Neuf défauts trouvés à l'audit et corrigés

1. **`[hidden]` ne cachait rien** sur un `display:flex`/`inline-flex` nommé —
   la barre restait visible sur RÉGLAGES, la pastille de jour-cycle survivait
   à `cy.hidden=true`. Une règle `[hidden]{display:none!important}` pour toute
   la famille. *(défaut antérieur pour la pastille)*
2. **`.ctx-barre{top:96px}`** — la hauteur d'un bandeau qui n'est plus collant.
   Bande de fond entre la nav et la barre, **titre recouvert au défilement**.
   La hauteur se MESURE (`--h-nav`, `calerLaBarre()`). *(antérieur)*
3. **`.zts-tete{z-index:200}` recouvrait le tiroir (80) et la fenêtre de séance
   (120)** : le chrono et ▶ PARTIR disparaissaient sous le logo. *(antérieur)*
4. **Le samedi ressemblait à un mardi** — six périodes vides un jour sans école.
   Une carte dit pourquoi et offre ▶ PROCHAIN JOUR DE CLASSE.
5. **Piège n° 18 payé une 2ᵉ fois** : à 200 % sur un iPad de 768 px, les media
   queries croient 768 pendant que le contenu en a 384 — ⋯ PLUS sortait de
   l'écran **sur une tablette**. On calcule la largeur EFFECTIVE et on la publie
   en `html[data-etroit="1"]`, qui remplace les media queries.
6. **La date passait SOUS sa pastille** sur téléphone (`nowrap` + `flex-shrink`,
   aucun débordement de page pour le signaler). `grouperLaDate()` les tient
   ensemble ; elles prennent leur rangée.
7. **La minuterie restait verte après avoir sonné** : `peindreMinuterie()` est
   appelée AVANT que `tourne` passe à false, et l'intervalle s'arrête juste
   après — le bouton affichait « ⏸ PAUSE » sur une minuterie finie. *(antérieur)*
8. **« ← PLUS » atterrissait au MILIEU de RÉGLAGES** : `barreLiens()` insère à
   `children[1]`, et d'autres fichiers insèrent après lui au même endroit.
   Remis en tête une fois tout le monde passé.
9. **La barre jaune faisait 405 px de haut** à 🏀 FOND DU GYMNASE sur tablette,
   figée en permanence. Sur peu de place, elle défile avec la page.

### Pièges laissés par ce chantier — ils reviendront

- ⚠ **`peindrePlanSession()` ne peut PAS être appelée depuis son IIFE** :
  `lundiPlan()` lit `agLundi`, `UN_JOUR`, `isoDe`, tous déclarés plus bas dans
  `proto-fusion.js`. Un `let`/`const` en zone morte n'est pas « undefined » —
  le lire LÈVE, et `typeof` lève aussi. C'est `proto-g3.js` qui l'appelle.
- ⚠ **Les jetons écoutent le clic sur le CONTENEUR, en capture.** Posé sur le
  jeton, l'écouteur tournerait après celui de `proto-seance.js`, qui repeint
  toute la palette : sur un noeud déjà détaché. (Piège n° 12, 2ᵉ fois.)
- ⚠ **Les trois boutons de la barre contextuelle sont des CLONES.**
  `barreContexte()` leur a posé des écouteurs « jour » qu'on ne peut pas
  retirer ; sans le clone, ◀ reculerait d'un jour ET d'une semaine.
- ⚠ **`innerWidth` vaut 0 pendant une réémulation de fenêtre.** Sans garde,
  l'app se croit sur un téléphone et y reste.
- ⚠ **Le buzzer a été vu JOUER (`play()` appelé, minuterie menée à zéro), pas
  ENTENDU.** Le point reste ouvert.

## Ouvrir

Servir la **racine du dépôt** (le proto appelle `/fonts/` et `/perso-*.png`),
puis ouvrir `/apps/planificateur/proto/`.

```
python3 -m http.server 8788
# → http://localhost:8788/apps/planificateur/proto/
```

## Ce qui a été RETIRÉ — cinq redondances, zéro fonction perdue

Joey trouvait l'app encore difficile à comprendre et m'a autorisé à retirer
les doublons. Cinq écrans ont disparu, aucune fonction avec :

| Retiré | Pourquoi ce n'était qu'un doublon |
|---|---|
| **Semaine** | L'accueil est la MÊME grille période × jour. Ses colonnes « Gr: » et « # cours » répétaient le contexte : la barre jaune dit déjà dans quel groupe on écrit, et chaque en-tête de jour porte son jour-cycle. |
| **Fiche de cours** | Trois blocs à remplir, alors que MA JOURNÉE en a déjà, avec les médias et les minuteries en plus. Son en-tête (Cours · cycles · début · durée) a migré en tête de MA JOURNÉE. |
| **Noter** | Une zone de texte libre — exactement le journal de bord de MES GROUPES, qui lui est daté et rattaché au groupe. |
| **Plan B** | Trois boutons qui ouvraient le tiroir des jeux avec un filtre. Le filtre est maintenant un bouton **dans** le tiroir. |
| **Cahier › Ma semaine** | L'accueil EST l'agenda de la semaine. Deux écrans pour la même vue. |

**L'écran ÉVALUATION** empilait aussi deux grilles sur les mêmes élèves —
les 3 compétences et les critères fins. Une bascule, une seule grille à la fois.

**22 écrans → 18. La barre : 7 portes, dont 4 en accès direct** — Ma semaine ·
Ma journée · Présences · Mon cahier, les quatre gestes d'une journée. Le reste
est rangé sous Évaluer · Calendrier · Plus.

## Le cahier de consignation — ce qui relie tout

**Une clé commune : le jour + le groupe.** La barre jaune du haut la montre en
permanence (« jeudi 27 août · j'écris dans 5A ») et la change. Tout ce qui
appartient à une séance se range dessous : présences, cotes, tests, blocs de la
journée, étoiles, banc de retrait.

L'écran **MON CAHIER** ne recopie rien — il **relit** cette clé et présente la
page du jour, réglure et marge comprises : ce que j'ai fait · qui était là ·
ce que j'ai noté · les tests · mon mot du jour. Chaque section a un bouton qui
ouvre l'écran d'où vient l'information. Une vue **MA SEMAINE** montre les cinq
jours d'un coup.

Conséquence directe : évaluer un groupe le range **à la bonne date et au bon
groupe**, sans rien ressaisir. Changer de jour ou de groupe change la page ;
revenir la retrouve intacte.

Une journée neuve démarre **vide**, avec une invitation — les blocs d'exemple ne
sont posés qu'une seule fois, à la toute première ouverture.

## La barre du haut — 6 portes, pas 21 boutons

Les écrans sont groupés par **ce qu'on y cherche** : Ma classe · Mon calendrier ·
Évaluer · Mes outils · Réglages, plus Accueil et Mon cahier en accès direct.
Chaque entrée porte son explication en une ligne. **Aucun écran n'est
injoignable** — vérifié à la recette.

Ce n'est pas le retour du bouton PLUS : l'accueil montre toujours toutes les
tuiles en toutes lettres.

## Quatre polices, et pas une de plus

| Police | Rôle |
|---|---|
| `ZoneTotalSport.ttf` | la marque et les titres de page |
| `LuckiestGuy` | titres de section, boutons, étiquettes |
| `IndieFlower` | **ce que l'utilisateur écrit** — tous les champs, et le cahier |
| `AnnieUseYourTelescope` | les notes et les phrases d'aide |

Le corps de texte prend la pile système : aucune police de corps n'est
auto-hébergée, c'est la doctrine « zéro Google Fonts » du site. Bangers et
Quicksand ont été retirées à la demande de Joey.

Poser la manuscrite sur les champs a un effet utile au-delà du décor : on
distingue d'un coup d'œil **ce que l'app affiche** de **ce que le prof a
inscrit**.

## Rien n'est caché

**Il n'y a pas de bouton « PLUS ».** Les 16 outils sont sur l'accueil, en
toutes lettres, et repris un par un dans la barre de navigation. C'est la
demande de Joey du 27 août : voir tous les boutons plutôt qu'un menu.

## Ce qu'il montre — 16 écrans

| # | Écran | Ce qu'on valide |
|---|-------|-----------------|
| 1 | **Accueil** | 6 grosses tuiles + les 3 personnages comme sélecteur de métier. La tuile 3 et le badge changent selon le métier (1274 · 970 · 177). |
| 2 | **Ma journée** | Blocs simples, glisser-déposer, case FAIT, minuterie et médias par bloc. |
| 3 | **Jeux** | Tiroir latéral, **filtres fermés par défaut**, cartes avec AJOUTER. |
| 4 | **Semaine** | Le gabarit papier : périodes 1-6 + heures, récréations, dîner, cases Gr/# cycle/Activité, samedi-dimanche-commentaires. |
| 5 | **Mois** | Romains en gros, journées spéciales colorées, boîtes Jour cycle + Note. |
| 6 | **Année** | 11 mini-calendriers + une ligne par semaine : Compétence / Moyen d'action / Activité. |
| 7 | **Mon cours** | Planification journalière : Cours, 1er/2e/3e cycle, Début, Durée, 3 blocs Titre/Descriptif/Durée + Illustration. |
| 8 | **Calendrier** | Août → juin, 7 catégories dans la légende, clic pour catégoriser, deuxième clic pour annuler. |
| 9 | **Mon temps** | Date/Activité/Temps, total calculé tout seul, `total − reconnu = de plus`, signatures. |
| 10 | **Évaluation** | Les 3 compétences du PFEQ en ÉPS, cotées A→E d'une touche. Reclic = on enlève. Compteur et moyenne de groupe en direct. |
| 11 | **Bulletin** | Une carte par élève, construite **depuis l'ÉVALUATION** : cotes, jauges, commentaire proposé selon le résultat le plus faible. Prêt à imprimer. |
| 12 | **Partage** | Quoi partager (8 cases), ce que le collègue peut faire (regarder / copier / modifier), lien, code à 8 caractères, aperçu de QR. |
| 13 | **Présences** | **Grosse photo, petit nom** — on reconnaît l'enfant au visage, pas au texte. Tap : attendu → présent → départ ; appui long = absent. **Parti ou absent, la photo ET le nom passent en noir et blanc.** Jour et heure de départ, « porté par » à l'arrivée, « parti avec » au départ avec garde hors-liste, humeur, message au parent, particularités, rapport à envoyer. |
| 14-16 | Plan B · Noter · Réglages | inchangés. |

## Les deux chaînes qui se recalculent seules

Le **CALENDRIER est la source unique des jours-cycle**. Marquer une journée y
recalcule d'un coup les romains du MOIS, ceux de l'ANNÉE et les compteurs
« N jours école » de chaque mois. Rien à ressaisir ailleurs.

Deuxième chaîne : **l'ÉVALUATION alimente le BULLETIN.** Une cote posée met à
jour la carte de l'élève, sa jauge et le commentaire proposé — le proposé suit
la compétence la plus faible, et un bouton le recopie dans le champ sans jamais
l'imposer. Rien à ressaisir.

Les compteurs mensuels reproduisent le gabarit papier sur **10 mois sur 11**.
Seul mai diffère (19 contre 18) : le pied de page du gabarit annonce
« 18 jours école / 2 journées pédagogiques » alors qu'aucune journée pédagogique
n'y est coloriée. Le proto affiche ce qu'il calcule, pas ce que le papier
affirme.

## Les trois pièges déjà payés, et comment ils sont tenus ici

1. **Contraste hérité du marine.** Un panneau à fond clair sans `color` hérite
   du texte clair posé sur le fond marine — ratio 1.1. Chaque `.pan`, `.bloc`,
   `.case`… déclare donc son encre. Mesuré : **1025 éléments, 0 sous 4.5:1.**
2. **Minuteries empilées.** Un seul `setInterval` global, une minuterie déjà
   partie refuse de repartir, et le décompte se calcule depuis un instant
   d'arrivée absolu, donc il ne dérive pas. Vérifié : cinq départs empilés,
   3:00 → 2:57 après 3,1 s.
3. **Saisie qui fige le décompte.** Tant que ça tourne, `verrou()` gèle les
   préréglages et met le champ en lecture seule. Vérifié : édition tentée
   pendant le décompte, le compte a continué (2:57 → 2:55).

## Police de marque

`ZoneTotalSport.ttf` est déclarée sous le nom **`ZoneTotalSportPROTO`** — un nom
distinct est obligatoire, « ZoneTotalSport » tout court entre en collision avec
les `@font-face` de `jeux`, `moyens-action`, `nhl-playoffs` et `studio-jeu`, qui
déclarent la même famille **sans** `size-adjust`. Et `size-adjust:50%` est
obligatoire : la police est dessinée à ~2,4× l'em.

Elle porte les **titres de page** et la marque « PROTO G2 », rien d'autre.
⚠ Elle a **douze trous** — `Ù Ÿ Æ Œ ÿ æ œ ’ « » — °` — et le navigateur bascule
**par caractère**. Elle ne touche donc jamais du texte saisi par l'utilisateur.
Les 14 titres du proto ont été vérifiés contre la table cmap : **tous couverts**.

## Sons

`son/buzzer-nba.mp3` (25 Ko) et `son/buzzer-arena.mp3` (49 Ko), tirés des
originaux des Téléchargements de Joey et allégés :

```
ffmpeg -vn -map_metadata -1 -ac 1 -ar 22050 -b:a 40k
```

Les originaux embarquaient une pochette : 522 Ko à eux deux, 73 Ko après.

**Non vérifié : personne n'a encore _entendu_ ces sons.** Le proto confirme
qu'ils se décodent et jouent jusqu'au bout (4,81 s et 9,69 s, sans erreur), pas
qu'ils sonnent juste.

## Les présences sont PORTÉES de l'app, pas inventées

L'écran reprend le modèle de `apps/planificateur/app.js` (`renderPresenceCard`,
`openDepartModal`) : statuts `attendu / present / parti / absent`, `heureArrivee`,
`heureDepart`, `arriveAvec`, `partiAvec`, `horsListe`, humeur de fin de journée,
message au parent, personnes autorisées, particularités. **Rien n'a été
simplifié au passage** — la première version du proto montrait un écran réduit
à 18 boutons vert/rouge, ce qui était une lacune de la maquette, pas une perte
dans l'app.

Ce qui n'y est pas : les photos réelles des enfants (le proto dessine une
pastille à initiales, qui se décolore comme une vraie photo) et l'envoi vers le
coordonnateur — ici le rapport est **copié dans le presse-papier**, rien ne part
sur le réseau.

## Ce qui n'est PAS réel dans le partage

Le lien, le code et le QR sont **produits localement, sans réseau**. Le code est
déterministe (pas de `Math.random`) pour ne pas changer à chaque repeinture :
seul le bouton NOUVEAU CODE le fait bouger. Le QR est un **aperçu** — un motif
déterministe avec ses trois marqueurs d'angle, pas un code lisible. Il montre la
place que le vrai prendra.

## Limite connue, volontairement reproduite

Les pièces jointes des blocs vivent en `localStorage`, comme dans l'app réelle.
Elles ne suivent pas d'un appareil à l'autre et un vidage de navigateur les
détruit. Le proto le dit tout haut quand la mémoire déborde — c'est le point le
plus lourd du `CONTRAT-FONCTIONNEL-FUSION-2026-08.md`.

## Composer la planification — 28 août

La planification n'est plus une liste figée : on choisit **ce qu'il y a
dedans**. Chaque étape porte une **pièce** (`PIECES`, dans `proto-seance.js`) —
`libre` est l'activité qu'on écrit soi-même, les six autres branchent l'étape
sur une porte de la séance.

Trois gestes, tous équivalents :

1. **Glisser** une pièce de la palette dans une phase (ARRIVÉE · PENDANT · FIN).
2. **Cocher** sa case sur la tuile de la porte, en haut du panneau ; **décocher**
   la retire — c'est la demande de Joey mot pour mot.
3. **Toucher** la pièce puis la phase, pour qui n'a pas de souris.

Les étapes se **glissent entre elles** pour changer d'ordre ou de phase. Toucher
une étape branchée ouvre sa porte ; son ✎ ouvre son titre, sa durée, ses images.
Une durée écrite sur la pièce **LE TEMPS** est celle que la minuterie prend
quand on la touche.

⚠ Les clés de `PIECES` sont **exactement** celles de `volet()`. `tests` est la
seule exception : ce n'est pas un volet mais l'écran `e-tests`. Renommer une clé
casse `ouvrirPiece()` sans un mot dans la console.

## L'en-tête de la séance — sa couleur, sa photo

Le bandeau de la séance porte les huit couleurs du groupe et un emplacement de
photo : on y **lâche une image** (l'enseignant·e, le groupe) et le ballon
disparaît. La même chose se lâche sur une pastille de la palette.

⚠ La couleur et la photo appartiennent au **groupe**, pas à la séance : posées
ici, elles changent aussi dans la palette et dans les cases de l'agenda. C'est
le but — reconnaître un groupe à un visage plutôt qu'à un ballon générique.

## Le portrait du groupe, les notes d'élèves et les suivis — 28 août

**Une 8ᵉ porte : 📔 PORTRAIT DU GROUPE.** Elle réunit tout ce qui a été
consigné pour ce groupe, toutes dates confondues — absences, oublis de linge,
cotes sous le maximum, mots de cours, notes d'élèves — plus le fil des périodes.

⚠ **Rien ne se saisit dans le portrait.** Il relit les séances déjà écrites et
les recompose. Ne pas le confondre avec le **dossier de MES GROUPES**, où le
prof saisit à la main des absences et des incidents : là-bas c'est de la
saisie, ici c'est du cumul. Les deux se complètent.

**Noter un élève** : le ✎ sur sa carte, dans PRÉSENCES (ou « ✎ NOTER » dans le
portrait). Une note par élève et par période — c'est le geste réel de quelqu'un
qui voit six groupes par jour. La note porte une case **⚑ à suivre**.

**Le suivi remonte tout seul.** Une note marquée « à suivre » s'affiche en tête
de **la prochaine séance de ce groupe** — pas de la période suivante dans la
journée : un prof d'ÉPS revoit 101 deux jours plus tard, c'est là que le rappel
sert. Le drapeau reste levé, séance après séance, jusqu'au ✔ RÉGLÉ. La note,
elle, reste au portrait pour toujours.

## Deux signaux distincts sur une porte, à ne pas confondre

| | Ce que ça veut dire | Effet |
|---|---|---|
| **☑ la case** (coin haut) | cette fonction est **dans la planification** | décocher la retire de la planification |
| **✕ le bouton rose** (coin bas) | cette fonction a **consigné quelque chose** ici | l'effacer jette ces données, la case ne bouge pas |

On peut vouloir garder les présences dans son cours **et** effacer celles
d'hier. C'est pour ça qu'il y a deux gestes.

**La couleur d'une porte ne dit qu'une chose** : cochée → cyan pâle ; pas
cochée → blanc. Le vert de « cette fonction a des données » a été neutralisé,
il brouillait le message ; cette information se lit désormais au ✕.

## L'évaluation ne colore rien d'avance

Une case d'échelle reste **vierge tant qu'on n'a pas cliqué**. La règle « tout
le monde part au maximum » reste vraie pour LIRE une cote absente — elle ne se
peint simplement plus.

⚠ Conséquence directe : **le maximum s'enregistre lui aussi** maintenant, sinon
un clic sur ++ n'aurait jamais de couleur. Compter les clés de `s.notes` compte
donc les élèves qui vont très bien. Ce qui est **sous** le maximum se compte
avec `cotesSousMax()` (`proto-portrait.js`). Un second clic sur le même palier
efface la cote.

## L'évaluation en une seule case — 28 août

Cinq boutons par élève **et** par critère débordaient de l'écran. Il n'en reste
**qu'un**, qui tourne d'un cran par clic :

```
vierge → ++ → + → +/- → - → -- → vierge
```

Chaque cran porte sa couleur. **Clic droit : on recule d'un cran** — sans lui,
revenir de « -- » à « ++ » obligerait à refaire tout le tour.

⚠ **Une légende est obligatoire au-dessus de la grille.** Une case vierge ne
raconte rien : sans la légende, personne ne devine qu'un deuxième clic donne
« + ». Elle se construit à partir de `facon().v`, donc elle suit le réglage
d'échelle et le nombre de niveaux.

## Personnaliser les critères

- **Un critère à moi** s'écrit directement au-dessus de la grille (Entrée ou
  « + AJOUTER »). Il est stocké `moi|<texte>` et son en-tête est **cliquable
  pour le renommer**, en pointillé.
- **Le ✕ d'un en-tête** retire la colonne et ses cotes.
- ⚠ **« ✎ CHANGER CE QUE J'ÉVALUE » vidait `evalCrits` avant d'ouvrir** : il
  fallait perdre sa grille pour avoir le droit de la retoucher. Il ouvre
  maintenant `choisirCriteres()`, qui recharge la liste existante.

⚠ **La clé d'une cote est `<élève>|<critère>` et le critère contient lui-même
des « | »** (`moi|texte`, `agir|10`, `1|2|3`). On coupe donc au **premier** `|`
seulement — partout où l'on retrouve les cotes d'une colonne.

## Plancher de lisibilité — 28 août

Joey, devant la grille d'évaluation : « grossis les écritures, c'est petit et
difficile à lire. » Les en-têtes tenaient en 12 px et les noms d'élèves en
16 px, dans une police manuscrite qui pardonne mal.

⚠ **Aucun texte du panneau de séance ne descend plus sous 15 px.** Toute règle
ajoutée à `proto-seance.css` doit respecter ce plancher. Le bloc « LISIBILITÉ »
en fin de fichier est la référence : la case de cote est à 23 px, le nom d'un
élève à 20 px, un en-tête de colonne à 15 px.

## Les manuscrites sont dessinées petit — `size-adjust`

Joey, 28 août : « grossis partout cette police, c'est encore un peu petit. »
La hauteur d'x d'AnnieUseYourTelescope est bien plus basse que celle d'une
police d'écran : à 17 px nominal, elle se lit comme du 13.

Corrigé **à la source**, dans les `@font-face` de `proto.css` :
`size-adjust:124%` pour AnnieTelescope, `112%` pour IndieFlower.

⚠ **C'est la bonne place pour ce réglage.** Gonfler règle par règle laisse
toujours un coin oublié et fausse ensuite toute comparaison de tailles : deux
règles écrites « 17 px » ne se liraient plus pareil selon la police. Ici, une
ligne, tout le proto suit, et les tailles écrites redeviennent honnêtes.

## Une couleur par groupe, sans fin — et les rayons de l'accueil

**Les couleurs.** L'ancien code faisait `PALETTE_COUL[n % 8]` : le 9ᵉ groupe
reprenait la couleur du 1ᵉʳ. Joey en avait neuf, avec deux paires identiques.

`couleurLibre()` sert d'abord les huit couleurs choisies à la main, tant qu'il
en reste une de libre. Ensuite elle **fabrique** : plus grand trou dans le
cercle des teintes déjà posées, on se place au milieu. Deux groupes n'ont donc
jamais la même couleur, et l'écart se resserre doucement au lieu de boucler.
Même principe pour les emoji (`emojiLibre()`, 20 pictogrammes).

- **🎨 TOUTES DIFFÉRENTES**, dans la palette, répare les groupes déjà créés du
  temps où l'on bouclait sur huit.
- Le **sélecteur natif** dans l'en-tête de séance et dans « personnaliser un
  groupe » donne le reste de l'infini — les huit pastilles ne sont qu'un
  raccourci.

**Le fond.** Le marine et la trame de points étaient déjà copiés du patron ;
il **manquait la troisième couche** — les rayons jaunes en rotation lente
(140 s), et ce sont eux qu'on remarque. Valeurs reprises telles quelles de
`html.ztsp-decor body::after` (`shared/zts-modele.css`).

⚠ Le proto **recopie** plutôt que d'importer `zts-modele.css` : c'est une
maquette autonome, charger tout le patron l'exposerait à des chocs de règles
qu'aucun de ses écrans n'a été conçu pour absorber.

## Le jour-cycle — en haut, dans la semaine, et vraiment réglable

**En haut, à côté de la date** (`#ctxCycle`, barre de contexte) : c'est la seule
barre qui suit l'utilisateur d'un écran à l'autre, et le jour-cycle est ce qu'un
prof cherche en premier le matin. Quand il n'y en a pas, la pastille dit
pourquoi — « JOURNÉE PÉDAGOGIQUE », « FIN DE SEMAINE ».

**Dans la semaine** : chaque en-tête de jour porte le sien, placé d'après le
calendrier scolaire — congés et journées pédagogiques ne consomment pas de
jour-cycle.

⚠ **Deux défauts corrigés en même temps** :
1. `recalculerCycles()` écrivait `ROM[i % 6]` en dur. Ni la longueur du cycle
   (2 à 10) ni le style (romains, chiffres, lettres, noms) réglés dans RÉGLAGES
   n'arrivaient jusqu'au calendrier. `libelleCycle()` est maintenant le seul
   endroit qui décide comment un jour-cycle s'écrit, et le décompte du mois le
   suit.
2. Les jours-cycle ne se calculaient qu'au **premier affichage du CALENDRIER**.
   Avant d'y être allé, l'agenda et la barre du haut n'avaient rien à montrer.
   Ils se calculent au démarrage, et `rafraichirCycles()` repeint tout dès
   qu'un réglage bouge.

## ⚠ L'année scolaire semée est DÉCALÉE, pas réelle

Le calendrier semé est le vrai calendrier CSSDHR **2025-2026**. Un proto ouvert
en août 2026 tombait donc sur une semaine postérieure à la fin de cette
année-là : aucun jour-cycle nulle part, et toute la mécanique avait l'air morte.

Les marques sont maintenant décalées d'un nombre entier de **semaines**
(364 jours par année) pour retomber sur l'année en cours. Les jours de la
semaine sont préservés, **les dates glissent d'un ou deux jours**.

⚠ **Ce n'est donc pas le vrai calendrier de l'année en cours.** L'écran
CALENDRIER le dit lui-même dès que le décalage est actif : c'est de la donnée de
démonstration, à corriger là.

## Combien de cours par groupe, dans la semaine affichée

Le chiffre sur une pastille de groupe. ⚠ Il compte la semaine **qui est à
l'écran**, pas la semaine courante — c'est celle que le prof regarde quand il se
pose la question.

## La grammaire du papier — `proto-papier.css`

Joey a montré ses trois gabarits imprimés et demandé « ce style partout ». Au
choix proposé, il a retenu : **garder le marine, prendre la mise en page**. Le
décor de zonetotalsport.ca ne bouge donc pas ; ce qui change vit à l'intérieur
des panneaux blancs :

1. les colonnes de jours alternent **jaune et cyan**, une couleur par jour ;
2. une case **à remplir** porte le pâle de sa colonne et un **pointillé** ;
3. une case **remplie** repasse en trait plein — le pointillé ne veut dire
   qu'une chose : il n'y a rien ici ;
4. chaque encadré porte un **bandeau de titre coloré** (`.pap-cadre`).

⚠ **`proto-papier.css` se charge en DERNIER.** Il surcharge des règles de
`proto-fusion.css` et de `proto.css` à spécificité égale : c'est l'ordre qui le
fait gagner. Le déplacer plus haut le rend silencieusement inopérant.

⚠ **`data-col` est posé en JS, pas déduit en `nth-child`.** Les rangées de pause
(récréation, dîner) occupent toute la largeur en un seul enfant : toute
arithmétique de position se décale dès la première récréation.

⚠ **Les catégories du calendrier sont redites après l'alternance.** Elles vivent
dans `proto.css`, plus haut : sans ce rappel, le pâle des colonnes recouvrirait
congés et pédagogiques — exactement l'information que le calendrier porte.

## Pleine largeur, iPhone et iPad

`.wrap` était bloqué à **1180 px** : sur un grand écran, un tiers de la place
restait vide pendant que la grille de la semaine se serrait. La marge suit
maintenant la largeur (`clamp`), et la modale monte à 1600 px.

⚠ **Sur iPhone, la semaine DÉFILE dans son cadre** au lieu d'être écrasée : à
375 px, cinq colonnes tomberaient sous 50 px chacune. La page, elle, ne défile
jamais de côté — vérifié à 375, 768 et 1440 px.

⚠ **44 px est le minimum tactile d'Apple** : cases de cote, crochets, ✕ et ✎ le
respectent sous 620 px. Et `@media(hover:none)` rend visible tout ce qui ne se
révélait qu'au survol — un doigt ne survole pas.

## Se lire de loin, dans un gymnase

Joey : « mets ça pour qu'on puisse voir de loin dans un gymnase, c'est très
compacté, peux-tu grossir le tout ? »

⚠ **LE RÉGLAGE DE ZOOM NE FAISAIT RIEN.** Il posait `font-size` en `em` sur
`.wrap`, alors que le proto écrit ses tailles **en pixels** d'un bout à l'autre :
changer le corps du parent ne bougeait pas une seule règle. Encore un réglage
qui tournait à vide, comme le style des jours-cycle.

Il agit maintenant par la propriété **`zoom`**, posée sur `body` — donc les
fenêtres et la barre de contexte, qui vivent hors de `.wrap`, suivent aussi.
Un `transform:scale()` ne conviendrait pas : il déforme sans redonner la
largeur, et la page déborderait de côté.

**Les quatre paliers se disent par la distance de lecture**, pas par un
adjectif : *De près · Un peu loin · 🏀 GYMNASE · 🏀 GYMNASE +*. **Le défaut part
à 120 %** — un prof lit son plan de loin, un ballon à la main ; « de près » est
l'exception.

⚠ **Les media queries ne voient pas le zoom.** À 170 % sur un iPad, la fenêtre
fait toujours 768 px pour le CSS alors que le contenu en occupe 1300. C'est
pourquoi `.agenda` défile dans son cadre **à toutes les tailles**, et plus
seulement sous 620 px.

⚠ **`zoom` piège tout calcul de position en pixels.** `placerMenu()` divise
désormais par le facteur : le rectangle rendu est déjà zoomé, et l'élément
qu'on positionne le remultiplierait. Aucun menu déroulant n'existe aujourd'hui,
mais le jour où l'un revient il tomberait à côté.

## 📝 PLANIFICATION DE LA SEMAINE — le geste du dimanche soir

Un bouton dans l'en-tête de l'agenda. Il ouvre **une seule page** où les deux ou
trois cours de la semaine affichée se suivent : un encadré par cours, en-tête à
la couleur du groupe, et une grande zone où l'on **écrit ce qu'on veut**, sans
structure imposée.

En enregistrant, chaque texte se pose sur son cours : il se lit **dans la case**
de la semaine, et un clic sur le cours **rouvre directement la planification**
— plus le dernier volet consulté.

Le texte s'appelle `s.plan`. Il vit **à côté** des étapes, qui restent
structurées : qui veut des étapes minutées les garde, qui veut écrire écrit.
Le même texte se modifie aux deux endroits — une seule vérité.

⚠ **On enregistre aussi à la sortie de chaque zone (`blur`)**, pas seulement au
bouton. Le bouton est ce qui a été demandé ; le `blur` est ce qui évite de
perdre vingt minutes d'écriture sur une fenêtre fermée par erreur.

## Lisible sur un TBI

⚠ **Le zoom ne suffisait pas, et c'est logique** : il grossit tout dans les mêmes
proportions, donc un texte déjà trop petit **par rapport à sa boîte** le reste.
Le bloc 6 de `proto-papier.css` corrige les proportions — le texte secondaire
(l'état d'une porte, la durée d'une étape) rattrape le texte principal.

⚠ **Plancher : plus rien sous 17 px.** Un TBI se regarde à trois mètres ; ce qui
passait à un bureau n'y passe pas. Et le zoom part maintenant à **145 %
(🏀 GYMNASE)**.

## Cinq polices, et aucune autre

Joey : « je veux mes polices de caractère seulement, pas d'autre genre : Annie,
Indie Flower, Bangers, Luckiest Guy et ZoneTotalSport.ttf. »

Les cinq sont chargées depuis `/fonts/` — **Bangers rejoint la maquette**. Tous
les `system-ui`, `Segoe UI`, `Helvetica`, `Arial` et `monospace` en repli ont
été retirés, y compris `--f-corps`, qui tenait encore le corps de texte de
toute l'app. Il ne reste que `cursive` en tout dernier recours : ce n'est pas
une police, c'est le filet du navigateur si un `.ttf` ne se charge pas.

⚠ **Les boutons et les champs n'héritent pas de la police** — c'est une règle du
navigateur, pas un oubli. Cinquante-cinq éléments retombaient sur Arial, dont
le ✎ de chaque groupe. `button, input, select, textarea, optgroup{font-family:
inherit}` les ramène tous.

⚠ **La pastille à initiales d'un élève ne peut pas porter ces polices.** Son SVG
part en `data:` dans un `<img>`, donc dans un document isolé, sans accès aux
`@font-face` de la page ; y embarquer le `.ttf` pèserait ~100 ko par élève. Deux
initiales dans une pastille de couleur — et une vraie photo la remplace dès
qu'il y en a une.

**Bangers porte ce qui se lit de loin** : nom du groupe, jour, période,
jour-cycle. Condensée et haute, elle donne les plus grandes lettres des cinq à
largeur égale.

## Le fond du gymnase

Paliers : *De près (100 %) · En classe (145 %) · 🏀 GYMNASE (200 %) ·
🏀 FOND DU GYMNASE (260 %)*. **Défaut : 200 %.**

⚠ **Le zoom se pose sur `<html>`, pas sur `<body>`** : une mise à l'échelle du
document appartient à la racine. Sur `body`, tout ce qui est `sticky` ou
`fixed` se raccroche à un conteneur qui n'est plus à l'échelle de la fenêtre.

⚠ **À 260 %, un écran de 1280 px n'offre plus que 492 px aux règles CSS.** Le
mot ZONE TOTAL SPORT, en `nowrap` avec un plancher de 30 px, faisait déborder
toute la page de côté. Il a maintenant le droit de rétrécir et de passer à la
ligne.

⚠ **À ces paliers, l'outil de capture du navigateur intégré ne rend pas la même
chose que la fenêtre réelle une fois la page défilée.** Ne pas conclure d'une
capture noire qu'il y a un trou dans la page — mesurer, et laisser l'écran de
Joey juger.

## De gros boutons, et le + / − sur la semaine

Joey : « je veux de gros boutons plaisants et faciles à naviguer ; tous les
boutons, les personnages, "Bonjour", c'est petit. Pour le menu semaine,
affiche-le avec un + pour zoomer et un − pour dézoomer. »

**Le + et le − sont SUR la semaine**, avec le pourcentage entre les deux. Aller
dans RÉGLAGES pour ajuster ce qu'on regarde en ce moment même n'a aucun sens.
Ils marchent sur une échelle fine — 100 · 120 · 145 · 170 · 200 · 230 · 260 ·
300 — dont les quatre paliers nommés de RÉGLAGES font partie ; les deux restent
d'accord.

⚠ **On ne grossit pas `button` en bloc.** Les ✕ d'une case, le ✎ d'un groupe,
les pastilles de couleur sont minuscules **par dessein** : à 52 px, elles
écraseraient la case qu'elles habitent. Seuls grossissent les boutons qui
portent un mot.

⚠ **`#nav > button` gagnait sur `.ecrans-nav button`.** Un sélecteur qui porte
un ID (1,0,1) l'emporte sur deux classes (0,1,1) **quel que soit l'ordre des
fichiers** : les boutons du menu restaient à 12,5 px pendant que
`proto-papier.css` en demandait 20. Leçon générale pour ce proto : vérifier
qu'une règle **gagne**, pas seulement qu'elle est écrite en dernier.

## L'en-tête d'un jour respire

Les trois informations se serraient sur deux lignes, la pastille collée à la
date. Chacune prend sa ligne : le **JOUR**, la **DATE**, puis ce que la journée
**EST** (jour-cycle, journée pédagogique) — c'est l'ordre dans lequel on les
cherche.

## ＋ PÉRIODE LIBRE

Un bouton dans l'en-tête de la semaine ajoute une ligne au tableau, pour ce que
l'horaire officiel ne prévoit pas — récupération, surveillance, une période de
planification. On lui donne son nom et ses heures ; elle apparaît en pointillé
dans le rail, pour se distinguer de l'horaire de l'école.

⚠ **Elle s'ajoute TOUJOURS À LA FIN, jamais au milieu.** Le numéro d'une période
est la clé sous laquelle les séances sont rangées (`se:<jour>:p<n>`) : en
insérer une au milieu renumérote toutes celles qui suivent, et les cours déjà
consignés se retrouveraient dans la mauvaise case. Pour la déplacer, il y a le
glisser-déposer de l'horaire dans RÉGLAGES — là, c'est un choix conscient.

⚠ **Défaut corrigé au passage : le rail disait toujours « Période N »**, même
quand le prof avait renommé sa ligne dans RÉGLAGES. Son nom ne se rendait pas
jusqu'à l'agenda.

## Revue de redondances — 28 août

Joey : « prends le temps de regarder toute l'app, j'ai l'impression qu'il y a des
redondances et/ou des choses qui se ressemblent ou sont pareilles. » Il avait
raison. Six trouvailles, toutes corrigées.

**1. Deux navigations, la première effacée par la seconde.** `ECRANS` fabriquait
seize boutons dans `#nav` ; `barreEnMenus()` faisait `innerHTML=''` juste après
et reposait les cinq portes. Les seize n'ont jamais été vus. **Huit de leurs
cibles n'existaient même plus.** `MENUS` est désormais la seule source.

**2. `e-journee` n'existe plus, et six endroits y envoyaient encore.** `allerA()`
se rabat sur l'accueil : toucher une case vide de la semaine **remontait la page
en haut** sans rien ouvrir. Une case vide met maintenant le curseur dans sa note.

**3. `dossierEleve()` et `ouvrirDossier()` étaient écrits deux fois** —
proto-annee.js et proto-dossiers.js. Le second gagnait (chargé après) ; les 55
lignes du premier ne tournaient plus depuis la refonte de MES GROUPES.

**4. `libelleCrit()` était écrit deux fois** — proto-fusion.js et proto-pfeq.js.
Celle de fusion aurait rendu « moi » pour tout critère écrit à la main.

**5. `toutesSeances()` était écrit deux fois — et c'était MOI, la veille.**
proto-portrait.js écrasait celle de proto-dossiers.js **et triait à l'envers** :
le dossier d'un élève listait ses absences de la plus ancienne à la plus
récente. Une seule définition subsiste ; le portrait remet dans l'ordre du
calendrier ce qu'il affiche. ⚠ C'est le piège des deux `const` du même nom, en
version fonction — et il s'est refermé sur moi.

**6. Les trois métiers ne changent qu'un nombre.** `poserMetier()` visait aussi
`#tuile3`, `#tuile3aide` et `#badgeJeux` — trois éléments des anciennes tuiles
d'accueil, remplacées par l'agenda. Ces lignes ne touchaient plus rien et
entretenaient l'illusion que le bouton faisait quelque chose.

⚠ **Ce qui n'est PAS un défaut, vérifié** : `e-partage` et `e-donnees` ne sont
plus des écrans, mais leur contenu est déplacé dans RÉGLAGES par
`regrouperReglages()` et **plus rien ne pointe vers eux**.

## La fiche de cours — le gabarit « Planification journalière » à l'écran

Joey, gabarit papier à l'appui : « selon le nombre de périodes dans l'horaire,
ça s'affiche comme ça pour chaque groupe ; lorsque c'est terminé ça s'affiche
automatiquement dans MA SEMAINE. »

L'écran **📝 PLANIFICATION DE LA SEMAINE** montre désormais **une fiche par
cours**, dans la forme de la feuille :

- **Cycle** (1er · 2e · 3e), **Début du cours** (repris de l'horaire de la
  période), **Durée totale** (calculée, elle se met à jour en écrivant) ;
- puis des blocs **Titre · Descriptif · Durée** à gauche, **Illustration** à
  droite — l'image se lâche directement dans le bloc.

⚠ **Ce n'est PAS un nouveau stockage.** Chaque bloc **EST** une étape de la
séance — celles que la planification affiche et que la minuterie lance. Écrire
ici, c'est écrire le cours : d'où le « ça s'affiche automatiquement dans MA
SEMAINE ». Il n'y a rien à recopier, c'est la même donnée vue autrement.

⚠ **Une ligne vide ne crée rien.** L'étape ne naît qu'au premier mot écrit —
sinon la séance se remplirait d'étapes fantômes que la planification et la
minuterie afficheraient pour rien.

⚠ **Toujours au moins trois blocs, et toujours un vide à la fin** — comme la
feuille. Une feuille sans ligne libre donne l'impression qu'on a fini alors
qu'on n'a pas commencé.
