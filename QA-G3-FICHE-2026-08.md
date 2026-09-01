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
