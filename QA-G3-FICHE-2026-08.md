# RAPPORT QA — G3-FICHE et addenda G3-FICHE-2

**Périmètre** : la fiche de cours du proto (`apps/planificateur/proto/`) — les
7 items de G3-FICHE et les 5 sections de l'addenda G3-FICHE-2.
**Version testée** : `?v=154`, branche `proto/g2`, commit `8fe5a25e`.
**Méthode** : émulation navigateur, mesures DOM et styles calculés, parcours
scriptés. Aucune mesure prise sur une capture d'écran — voir les limites.

> ⛔ **CE RAPPORT NE CLÔT PAS G3-FICHE.** Trois gestes tactiles ne sont pas
> testables par émulation ; ils restent **à vérifier par Joey**, et ne sont pas
> comptés comme validés. Voir la section dédiée.

---

## Les 12 angles

| # | Angle | Verdict | Preuve |
|---|---|---|---|
| 1 | **Fonctionnel — mode PLANIFIER** | ✅ | 3 cartes : LA PLANIFICATION · JEUX · ÉVALUER. PRÉSENCES absente, comme voulu |
| 2 | **Fonctionnel — mode EN SÉANCE** | ✅ | PRÉSENCES · LA PLANIFICATION · JEUX + « 📝 ÉVALUER » en secondaire ; en-tête « ● en cours depuis 6 min » |
| 3 | **Bascule de mode** | ✅ | `live` posé → `data-mode=seance` sans rechargement ; `live` retiré → retour à `planif` et aux 3 cartes. Aller-retour joué 2 fois |
| 4 | **Mode « suivre »** | ✅ | 2 étapes listées, 2 boutons ⏱, cases à cocher présentes ; la palette et les phases éditables n'y sont pas |
| 5 | **Plein écran + retour** | ✅ | ouverture : `#seActions` masqué, 1 seul ◀ RETOUR ; retour : 3 cartes réaffichées, `#seDetail` vidé |
| 6 | **Entrées hostiles** | ✅ | message de **616 caractères** avec accents (É à û ç) et guillemets : enregistré entier, la ligne ne déborde pas (`scrollWidth ≤ clientWidth`), la page non plus |
| 7 | **Double / triple clic** | ✅ | 3 clics rapides sur une carte → 1 seul écran, 1 seul ◀ RETOUR, aucun doublon |
| 8 | **Persistance** | ✅ | après rechargement complet : message de 616 caractères intact, ligne réaffichée, consigne restée repliée (`aideCompose`) |
| 9 | **Responsive** | ⚠ partiel | 1440 px : pas de débordement, plus petit texte utile **17 px**. 768 px au chargement : `data-etroit=1`, pas de débordement. **320 et 375 px non testés** — voir L-2 |
| 10 | **Contraste sur marine** | ✅ | porte de barre **6,48:1** · ligne du mot **18,12:1** · carte **18,12:1** · consigne **17,69:1**. Tous au-dessus de 4,5:1 (AA) |
| 11 | **Console propre** | ✅ | écouteur `error` + `unhandledrejection` posé, parcours complet rejoué : **0 erreur**. Seule erreur résiduelle : CORS sur `zone-subscriber-count` (compteur d'abonnés, préexistant, sans rapport) |
| 12 | **Non-régression des acquis (§1.2)** | ✅ | 9 portes présentes · tiroir JEUX · minuterie du tiroir · 3 boutons de buzzer · barre DÉMARRER/TBI sur MA JOURNÉE · 7 outils du rail intacts |

---

## Défauts trouvés

**F-01 — `const` réassignée, la rangée de cartes restait vide.** *(corrigé,
commit `8fe5a25e`)*
`peindreTeteSeance` réassignait `const par` vers le tiroir 🎨 :
« Assignment to constant variable » tuait la fonction et **aucune carte n'était
créée**. Symptôme trompeur — le mode était juste, le bouton 🎨 présent, la
rangée vide. Passé en `let`.

**F-02 — le bouton d'effacement n'était jamais posé.** *(corrigé, commit
`df39bf21`)*
`finirVolet` était déclaré en bas de `volet()`, après des blocs qui se terminent
par `return` : jamais atteint pour « message », « présences » ni « cours ».
Appelé à la main, `boutonEffacer('message')` retournait pourtant le bon bouton —
la fonction marchait, elle n'était pas appelée. Programmé en tête de fonction.

**F-03 — débordement horizontal à 768 px après redimensionnement.**
**NON REPRODUCTIBLE au chargement — artefact d'outil.**
Après un redimensionnement à 768 px, le document mesurait 1146 px pour une
fenêtre de 768. Cause : **mon émulation n'émet pas l'événement `resize`**, donc
`calerLaBarre()` ne se rejouait pas. Un appel manuel corrige aussitôt
(`data-etroit=1`, document à 768). **Au chargement direct à 768 px, aucun
débordement.** Le vrai navigateur émet `resize` ; le code y est branché
(`window.addEventListener('resize', calerLaBarre)`).

---

## Correspondance avant / après — les 8 cartes d'origine

> **Comptage réglé le 31 août** : la fiche portait **8 cartes**, pas 9 —
> Planification, Minuterie, Présences, Jeux, Message, Évaluation, Tests,
> Portrait. Six venaient de `act[]` (proto-seance.js), TESTS de proto-annee.js
> et PORTRAIT DU GROUPE de proto-portrait.js. La « neuvième » était une erreur
> de comptage, confirmée par Joey ; il n'y en a jamais eu.

| Carte d'origine | Après | Fonction perdue ? |
|---|---|---|
| **LA PLANIFICATION** | carte, dans les deux modes — composition en PLANIFIER, **suivre** en SÉANCE | non |
| **MINUTERIE** | **supprimée** → le coin ⏱ de chaque étape, qui *lance* la minuterie du tiroir au lieu de consigner un nombre | non — gain |
| **PRÉSENCES** | carte, **mode EN SÉANCE seulement** | non — masquée quand elle n'a pas de sens |
| **JEUX** | carte, dans les deux modes | non |
| **MESSAGE** | **supprimée** → ligne « 💬 Un mot sur ce cours… » sous l'en-tête, lisible sans ouvrir | non |
| **ÉVALUATION** | renommée **ÉVALUER** ; carte en PLANIFIER, bouton secondaire en SÉANCE | non |
| **TESTS** | **fusionnée dans ÉVALUER** ; l'écran `e-tests` s'ouvre par un bouton du volet | non — écran intact |
| **PORTRAIT DU GROUPE** | **supprimée** → on touche le nom du groupe dans l'en-tête (`role=button`, clavier compris) | non — `volet('portrait')` inchangé |

**Pièces de la palette** : `LE TEMPS` retirée (le temps vit dans l'étape) ; les
six autres inchangées. Une séance déjà composée portant `piece:'minuterie'`
retombe sur « libre » et **garde son titre et sa durée**.

**Coins de carte** : le ✕ d'effacement quitte le coin ; le coin ne porte plus
que ☐/☑. Effacer devient un bouton nommé en bas du volet — vérifié :
« ✕ EFFACER LE MOT SUR CE COURS ».

---

## ⚠ À VÉRIFIER PAR JOEY — tactile réel

**Ces trois gestes ne sont pas validés. Ils ne peuvent pas l'être par
émulation : un clic scripté n'est pas un doigt.**

1. **Glisser une pièce de la palette dans une phase, au doigt.** Le
   glisser-déposer du proto repose sur les événements `dragstart` / `drop`,
   qu'un navigateur tactile n'émet pas de la même façon. Le repli « toucher la
   pièce, puis toucher la phase » existe dans le code — c'est lui qu'il faut
   éprouver sur tablette.
2. **Toucher le ⏱ au coin d'une étape.** Le coin fait environ 28 px de haut et
   contient deux cibles côte à côte (le champ de durée et le ▶). À la souris
   c'est net ; au pouce, la question est de savoir si l'on atteint le ▶ sans
   ouvrir le champ.
3. **Zones de frappe des cartes.** Les cartes sont grandes, mais elles portent
   des cibles secondaires (la case ☐ du coin). Il faut confirmer qu'on ouvre la
   carte sans cocher la case par mégarde, et l'inverse.

**Parcours à jouer sur la tablette** : ouvrir une période → LA PLANIFICATION →
glisser UN JEU dans « Pendant la période » → écrire une durée dans le coin de
l'étape → toucher ▶ → revenir → démarrer la séance depuis MA JOURNÉE → vérifier
que la fiche passe en mode suivre → cocher une étape.

---

## Limites de ce rapport

**L-1 — aucune conclusion tirée d'une capture d'écran.** Le panneau du
navigateur intégré ne peint pas quand il est masqué : les captures reviennent
vides et ne prouvent rien. Tous les verdicts ci-dessus reposent sur des mesures
DOM et des styles calculés.

**L-2 — 320 et 375 px n'ont pas pu être testés.** L'émulation ne descend pas
sous ~460 px de largeur réelle : une demande de 320 px a rendu `innerWidth`
1128. Les largeurs réellement éprouvées sont **768** et **1440**, plus **459**
lors de la vérification de la barre de navigation.

**L-3 — Safari iOS non testé.** Aucun navigateur WebKit disponible ici.

**L-4 — le parcours « enfant de 10 ans » est vérifié dans sa structure, pas dans
son ressenti.** Les gestes sont au bon nombre (ouvrir une période = 1 tap,
composer = 1 tap, revenir = 1 tap) et le prochain geste est toujours visible à
l'écran. Mais qu'un enfant de 10 ans s'en sorte **sans aide**, cela s'observe,
cela ne se mesure pas.

---

## Verdict

Les 7 items de G3-FICHE et les 5 sections de l'addenda sont **livrés et
vérifiés par émulation**. Deux défauts trouvés et corrigés en cours de route
(F-01, F-02), un troisième écarté comme artefact d'outil (F-03).

**G3-FICHE reste OUVERT** jusqu'à ce que Joey ait joué les trois gestes tactiles
ci-dessus sur sa tablette et confirmé.

---
---

# COMPLÉMENT QA — les cinq captures du 31 août

**Version testée** : `?v=161`, commit de la passe : voir le dernier commit de
`proto/g2`. Même méthode : mesures DOM, aucune conclusion tirée d'une capture.

Cinq demandes livrées après le premier rapport, plus deux ajouts (A et B).

## Zones changées et leur verdict

| Zone | Verdict | Preuve |
|---|---|---|
| **Menu 🔗 MES AUTRES APPS** | ✅ | 7 outils (Dé, Roue, Chrono, Minuteur, Équipes, Message, Mon école) + séparateur + 4 apps du site. 0 outil resté sur MA JOURNÉE |
| **Porte 🕐 MON HORAIRE** | ✅ | 9 portes dans l'ordre voulu, juste après MON CALENDRIER. ⋯ PLUS ne garde que Mes groupes et Vue coordonnateur |
| **Barre à 768 px** | ✅ | `data-etroit=1`, la barre ne défile pas (`scrollWidth = clientWidth`), la page ne déborde pas |
| **Feuille « Planification journalière »** | ✅ | bandeau à 5 champs, 3 boutons de cycle, un bloc par activité avec Titre · Descriptif · Illustration · Durée, ▶ par bloc |
| **Feuille — persistance** | ✅ | Semaine « 3 », Cours « Basketball », cycle « 2e », titre de bloc « Passes en mouvement », durée 12 min : **tout survit au rechargement**, et la Durée calculée du bandeau affiche « 12 min » |
| **LA PLANIFICATION = la feuille seule** | ✅ | ordre réel : ◀ RETOUR → `.feuille` → `.feuille-enmots` (repliée) → pied. **0 consigne, 0 palette, 0 badge** |
| **Écran de composition supprimé** | ✅ | ~9000 caractères retirés du fichier ; `peindrePlanification` n'existe plus |
| **Case du groupe — 6 fonctions** | ✅ | Présences · Linge · Mot · Évaluation · Voir la planification · Démarrer la séance |
| **Crochets d'usage** | ✅ | 2 crochets allumés sur des données de test ; ils suivent l'état réel de la séance |
| **Menu des gabarits** | ✅ | 4 gabarits + « Mes propres critères », déroulés sous le bouton, sans écran intermédiaire |
| **Libellés qui suivent l'état** | ✅ | hors séance : « Voir la planification » + « Démarrer la séance ». En séance : « Suivre mon cours » + « Arrêter la séance ». Retour à l'état initial vérifié |
| **`liveOu`** | ✅ | la séance appartient à une case (`2026-09-01|1`), pas à la journée |
| **Zone d'illustrations retirée de la case** | ✅ | 0 `.auj-illus` ; les images vivent dans les blocs de la feuille |
| **Lien « l'année se règle dans 🕐 MON HORAIRE »** | ✅ | cliquable, ouvre la porte |
| **Console** | ✅ | écouteur `error` + `unhandledrejection`, parcours Présences → Mot → fermeture : **0 erreur** |
| **Non-régression** | ✅ | tiroir JEUX, minuterie, 3 boutons de buzzer intacts à 768 px |

## Ce qui n'a pas changé de statut

Les **trois gestes tactiles** restent **à vérifier par Joey** et ne sont
toujours pas comptés comme validés. Ils portent maintenant sur des cibles
différentes — c'est la feuille et la case du groupe qu'il faut éprouver au
doigt, plus la palette de pièces qui n'existe plus :

1. **Les six boutons de la case du groupe**, serrés sur une ligne : les
   atteindre au pouce sans ouvrir le cours par mégarde (la case entière est
   cliquable juste au-dessus).
2. **Le menu des gabarits d'évaluation** : il s'ouvre sous le bouton et se
   referme au second tap ; à confirmer qu'il ne se ferme pas tout seul sur
   tablette.
3. **Les champs de la feuille** : les zones `contenteditable` du bandeau et des
   blocs, et le champ de durée à côté du ▶.

## Limites inchangées

**L-2** — 320 et 375 px toujours non testables ; largeurs réellement éprouvées :
**768** et **1440**.
**L-3** — Safari iOS non testé.
**L-5 (nouvelle)** — après un redimensionnement de fenêtre, l'émulation n'émet
pas d'événement `resize` : `data-etroit` reste sur sa valeur précédente jusqu'au
prochain chargement. C'est l'artefact déjà consigné en **F-03** ; il fausse
uniquement les mesures prises après un `resize`, pas celles prises après un
chargement. Toutes les valeurs de ce complément sont relevées après chargement.

## Verdict

Les cinq captures et les deux ajouts sont **livrés et vérifiés par émulation**.
Aucun défaut nouveau. **La fiche est FIGÉE jusqu'au lot A1** : plus aucune
modification de `apps/planificateur/proto/` sans nouvelle demande de Joey.

---
---

# COMPLÉMENT QA — le lot CASE-DU-GROUPE + FEUILLE (2 septembre)

**Versions testées** : `?v=162` (case du groupe) puis `?v=163` (feuille en
grand + crochet). Branche `proto/g2`, worktree dédié servi sur le port 8789.
Même méthode : mesures DOM et styles calculés, **aucune conclusion tirée d'une
capture** — la limite **L-1** tient toujours, le panneau revient marine uni.

⚠ **Toutes les largeurs de ce complément sont EFFECTIVES** — largeur de fenêtre
÷ zoom. Le proto tourne sous `html{zoom}` (2 par défaut) : « 768 px » se
mesure donc dans une fenêtre de 1536 px. `getBoundingClientRect()` rend du
pixel zoomé, `getComputedStyle()` du pixel de mise en page ; les deux sont
ramenés ici en pixels de mise en page.

---

## 1. La case période — le défaut de v161, mesuré puis corrigé

La case tenait sur **trois** colonnes depuis que la troisième portait la bande
d'illustrations. Cette bande est partie le 31 août ; les six boutons ont pris
sa place, et une colonne de 300 px les a rangés en colonne verticale.

| Mesure (px de mise en page) | v161 | v162 à 768 · 840 · 1024 |
|---|---|---|
| pistes de la grille | `210px 0px 300px` | `140px 1fr` |
| `.quand` | **420** (débordait sa piste de 210) | **140 · 140 · 140** |
| `.auj-cours` | **68 × 633** — écrasé | **510 · 576 · 754**, pleine largeur |
| `.auj-fonc` | 615 × 633, **en colonne à droite** | même largeur que la carte, **en dessous** |
| les 6 boutons | 6 lignes = une colonne | **2 lignes** aux trois largeurs |
| largeur du document | **1167** pour une fenêtre de 1024 | = la fenêtre, **aucun débordement** |

Vérifié aussi à **384 px effectifs** (`data-etroit=1`) : une seule colonne, dans
l'ordre `QUAND` → carte → boutons, sans débordement.

## 2. La carte du groupe — contenu et gestes

| Point | Verdict | Preuve |
|---|---|---|
| Emoji du sport très gros | ✅ | 40 px de mise en page — 80 px à l'écran au zoom courant |
| Numéro du groupe énorme, Luckiest Guy | ✅ | 46 px, famille calculée `LuckiestGuy` — 92 px à l'écran |
| Titre du cours du jour | ✅ | champ à 22 px, invite `Nomme ton cours…` mesurée dans le `::before` |
| Ligne d'infos | ✅ | « 6 élèves · 4 activités · 33 min en tout » — la durée est calculée, pas saisie |
| Vignette de l'illustration | ✅ | présente quand une activité porte une image, absente sinon |
| « 🔴 en cours · X min » | ✅ | mesuré **« 🔴 en cours · 7 min »** sur une séance démarrée 7 min plus tôt |
| La prochaine activité | ✅ | **« ➡️ Relais navette, 10 min »** — la première non cochée, dans l'ordre des phases |
| Rien d'autre | ✅ | `.puces` : **0** dans le DOM |
| La case voisine, hors séance | ✅ | aucun `.crs-live` |
| Titre ↔ champ « Cours » de la feuille | ✅ | écrit dans la carte → lu dans la feuille ; écrit dans la feuille → lu dans la carte. **Une seule donnée**, `s.feuille.cours` |
| Toucher le titre n'ouvre rien | ✅ | `seVolet` inchangé, aucune fiche ouverte |
| Toucher ailleurs → portrait | ✅ | `seVolet='portrait'`, et `#seDetail` affiche « Tout ce qui a été consigné pour 101… » |
| Au clavier | ✅ | `Entrée` sur la carte ouvre le portrait ; `role=button`, `tabindex=0` |
| Infobulle | ✅ | **« Voir le groupe 101 »** |

## 3. La feuille en grand (v163)

Demande dictée : « tout est trop petit, on ne voit pas les cycles ».
**« En grand » = des tailles, pas du plein écran** : la structure de l'addenda
§5 est intacte — ordre réel mesuré aux trois largeurs :
`◀ RETOUR` → `.feuille` → `.feuille-enmots`.

| Élément | Avant | Après | Rapport |
|---|---|---|---|
| Titre de la feuille | 26 px | **34 px** | 1,31× |
| Étiquettes de champ | 13 px | **18 px** | 1,38× |
| **Champs de saisie du bandeau** | 17 px | **23 px** | **1,35×** ✅ (cible ≥ 1,3×) |
| Titre d'un bloc | 17 px | **28 px** | 1,65× |
| Libellé de phase (Luckiest Guy) | 14 px | **24 px** | 1,71× |
| Champ Durée | 16 px | **24 px** | 1,50× |
| Bouton ▶ de l'étape | 13 px | **20 px** | 1,54× |
| Total du bandeau | 19 px | **26 px** | 1,37× |

**Les cycles** — c'était le point de départ de la demande. Les trois cases sont
devenues des plaques de **146 × 56 px** de mise en page (soit **292 × 112 px à
l'écran**), texte à 22 px, aux trois largeurs. Bascule vérifiée :
un clic sur « 3e cycle » écrit `feuille.cycle='3e'` et `aria-pressed` passe à
`false · false · true`.

**Les blocs d'activité**, cible « la largeur et une bonne part de la hauteur
d'un écran de tablette » :

| Largeur effective | Bloc | Descriptif | Illustration | Débordement |
|---|---|---|---|---|
| **768** | 644 × 560 | 293 × 270 | 293 × 270 | aucun |
| **840** | 716 × 560 | 329 × 270 | 329 × 270 | aucun |
| **1024** | 900 × 560 | 421 × 270 | 421 × 270 | aucun |
| **384** (étroit) | 279 × 695 | pleine largeur | 235 × 170 | aucun |

À 384 px la hauteur imposée de 560 px tombe et le corps passe sur une colonne :
le descriptif et l'illustration l'un sous l'autre dépassent déjà cette hauteur,
et l'imposer aurait laissé du vide en haut de chaque bloc. **Les tailles de
police, elles, sont conservées** — c'est là qu'était la demande.

## 4. Le crochet de « 📋 Voir la planification » (v163)

Il testait `titre || desc`. Or **deux des trois étapes semées portent déjà un
titre** — « Arrivée » et « Fin du cours » : le crochet était donc allumé sur une
séance neuve, avant toute saisie. Il ne disait plus rien.

La règle vit maintenant dans `planificationSaisie()`, **écrite juste à côté de
la semence** pour que les deux ne divergent pas.

| Cas | Attendu | Mesuré |
|---|---|---|
| Séance neuve (les 3 étapes semées) | éteint | **éteint** ✅ *(v162 : allumé)* |
| Un titre saisi | allumé | **allumé** ✅ |
| Une durée seule | allumé | **allumé** ✅ *(l'ancien test la ratait)* |
| Un descriptif seul | allumé | **allumé** ✅ |
| Des espaces seulement | éteint | **éteint** ✅ |

## 5. Correspondance avant / après — ce que la carte portait

| Avant (v161) | Après (v162-163) | Fonction perdue ? |
|---|---|---|
| Le nom du groupe, 32 px, à côté de l'emoji | **le numéro à 46 px en Luckiest Guy**, l'emoji à 40 px | non — c'est la demande |
| `.quoi` : les titres des étapes « pendant », ou `s.plan`, ou « rien d'écrit — touche pour planifier » | **le titre du cours, écrit sur place**, invite « Nomme ton cours… » | non — remplacé par une donnée qu'on peut modifier là où on la lit. Les titres d'étapes restent lisibles dans la feuille et, en séance, dans « ➡️ prochaine activité » |
| `.puces` **✔ faits/total** | **« X activités »** dans la ligne d'infos, et la progression se lit dans la feuille | non |
| `.puces` **✅ présences** | **le crochet ✓ du bouton ✅ Présences** | non |
| `.puces` **📝 notes** | **le crochet ✓ du bouton 📝 Évaluation** | non |
| `.puces` **⏱️ minuterie** | **la durée totale** dans la ligne d'infos, et le ▶ de chaque étape dans la feuille | non |
| Clic sur la carte → **fiche, volet Présences** | clic → **portrait du groupe** ; les présences ont leur propre bouton ✅ juste en dessous | non — un geste de moins pour les présences |
| Infobulle « Ouvrir le cours du groupe 101 » | **« Voir le groupe 101 »** | non |
| `.auj-cours` = `<button>` | `<div role="button" tabindex="0">` | non — clavier vérifié |

**Deux règles CSS deviennent orphelines** : `.auj-cours .quoi` et
`.auj-cours .puces`. Elles sont **laissées en place, volontairement** — les
retirer sortirait du périmètre de ce lot, et Joey peut vouloir revoir les puces.
Elles ne s'appliquent à rien et ne coûtent rien.

## 6. Non-régression et console

| Point | Verdict |
|---|---|
| 9 portes de la barre | ✅ 8 boutons + le menu 🔗 MES AUTRES APPS |
| Tiroir JEUX, minuterie, buzzers | ✅ intacts |
| ◀ RETOUR de la feuille | ✅ vide bien `#seDetail` |
| Persistance du cycle et des champs | ✅ écrits dans `s.feuille`, relus au rechargement |
| Console | ✅ écouteurs `error` + `unhandledrejection`, parcours complet : **0 erreur** |

## 7. Deux pièges payés dans ce lot — à ne pas repayer

**`vw` est un mensonge sous `html{zoom}`.** Les unités `vw` se calculent sur la
fenêtre NON zoomée : un premier jet en `clamp(…vw…)` sortait le numéro du groupe
à 151 px à l'écran. **Écrire les tailles du proto en pixels**, que le zoom
grossit comme le reste.

**`[contenteditable]{font-size:20px}` de proto-papier.css gagne sur `.fch-z`.**
Même spécificité (0-1-0), et proto-papier.css est la **dernière** feuille
chargée : les champs restaient à 20 px au lieu de 23. Nommer le parent
(`.feuille .fch-z`) plutôt que déménager la règle. C'est le piège déjà consigné
au bas de proto-papier.css, rencontré une deuxième fois.

## 8. Limites — inchangées

**L-1** — aucune conclusion tirée d'une capture : le panneau ne peint pas quand
il est masqué, les captures reviennent marine uni.
**L-2** — 320 et 375 px toujours non testables ; largeurs réellement éprouvées
ici : **384, 768, 840 et 1024 px effectifs**.
**L-3** — Safari iOS non testé.
**L-5** — mesures prises après chargement, jamais après un `resize`.

## 9. Verdict et statut

Les cinq points du lot sont **livrés et vérifiés par émulation**. Un défaut
trouvé et corrigé en cours de route : en mode étroit, ne libérer que `.quand`
de sa rangée la faisait passer **sous** les boutons, au bas de la case — les
trois enfants repassent maintenant en `grid-row:auto` ensemble.

**La fiche et la case du groupe sont FIGÉES jusqu'au lot A1.** Plus aucune
modification de `apps/planificateur/proto/` sans nouvelle demande de Joey.

**G3-FICHE reste OUVERT** : les gestes tactiles ne sont toujours pas validés, et
ce lot en ajoute. À éprouver au doigt sur la tablette :

1. **Le titre du cours dans la carte** — écrire dedans sans ouvrir le portrait,
   et ouvrir le portrait sans tomber dans le champ. C'est le geste neuf le plus
   exposé du lot : deux cibles superposées dans le même rectangle.
2. **Les six boutons de la case**, maintenant sur deux lignes sous la carte.
3. **Les trois plaques de cycle** — 292 × 112 px à l'écran, elles devraient
   enfin se frapper du pouce ; c'est à confirmer.
4. **Les champs de la feuille** agrandis, et le champ de durée à côté du ▶.
