# CONTRAT FONCTIONNEL — fusion Planificateur + Carnet EPS

**Date : 2026-08-26 · Mandat H · LECTURE SEULE.** Aucun fichier applicatif
touché ; ce document est le seul écrit.

**Objet :** la liste vérifiable de tout ce que les deux applications font
aujourd'hui, pour que la refonte parte d'un contrat et non d'une impression.

> **Règle qui gouverne tout le document :** *on cache, on ne supprime pas.*
> Aucune ligne n'est marquée « à abandonner ». Les fonctions qui n'ont pas leur
> place sur un écran d'ouverture vont **sous PLUS** ou **dans les réglages**.

---

# 0. LE POINT QUI COMMANDE LA FUSION — les pièces jointes

Joey demandait l'état réel du glisser-déposer. **Il existe, il est plus riche
qu'annoncé, et ses données sont en danger.**

## 0.1 Ce qui fonctionne aujourd'hui

| Capacité | Où | Détail constaté |
|---|---|---|
| **Glisser-déposer de fichiers** | `app-v2.js:1297-1313` | Sur toute case `[data-drop-bloc]` (le DÉROULEMENT d'un bloc). Surbrillance au survol (`pv2-dropon`) |
| **Glisser-déposer de texte** | `app-v2.js:1311` | Un texte lâché s'ajoute au bloc (`appendTextToBloc`) |
| **Coller (Ctrl+V) des fichiers** | `app-v2.js:1290` | Le presse-papier accepte aussi les fichiers, pas seulement du texte |
| **Sélecteur de fichiers** | `semaine-grid.js:468`, `app.js:1347` | `accept` : PNG, JPEG, **PDF**, MP3/MPEG, **MP4**, multiple |
| **Réduction automatique des images** | `app-v2.js:619` | Au-delà de 300 Ko : redimensionnées à 1400 px, JPEG qualité 0,82 |
| **Consulter / retirer une pièce jointe** | `v2-media-view`, `v2-media-rm`, `view-attachment`, `remove-attachment` | |
| **Photo d'élève** | `app.js:1159-1179` | `accept="image/*"`, redimensionnée (`resizePhoto`) |

**Types réellement acceptés : images, PDF, audio MP3, vidéo MP4.** Plafond
**2,5 Mo** par fichier — sauf les images, qui passent outre puisqu'elles sont
réduites avant stockage.

## 0.2 ⚠️ Où vivent les octets — le vrai sujet

Le code le dit lui-même (`app-v2.js:592-595`) :

> *« Les octets (data URL) ne vont JAMAIS dans Firestore (doc journees limité à
> 1 Mo). Firestore garde `{name, type, local:true}`, le miroir localStorage
> (clé par journée) garde les données. »*

```
Firestore  journees/<id>.blocs[].attachments[]  →  { name, type, local:true }
localStorage  pv2media_<journeeId>              →  { "blocId|nom": "data:...base64" }
```

**Trois conséquences, toutes à traiter avant la fusion :**

1. **Les pièces jointes ne suivent pas l'utilisateur d'un appareil à l'autre.**
   Firestore synchronise le *nom* du fichier ; les octets restent sur le poste
   où le dépôt a eu lieu. Un prof qui ouvre sa journée sur l'iPad de l'école
   voit la pièce jointe listée et **vide**.
2. **Un vidage de navigateur détruit les fichiers** sans que rien ne le signale :
   la liste Firestore, elle, survit. L'écart entre les deux est silencieux.
3. **Elles rejoignent le pont d'export** (mandat A-bis, `carnet-export.js`) : ce
   sont des données locales, non sauvegardées ailleurs, exactement comme les
   photos du Carnet l'étaient. **Aucune migration n'est possible sans passer par
   le poste de l'utilisateur.**

> **À vérifier avant la fusion, non fait ici (lecture seule) :** que fait l'UI
> quand `mGet` renvoie `null` — pièce jointe annoncée mais absente ? Un message
> clair, ou un lien mort ?

## 0.3 Deuxième stockage de médias, distinct

`semaine-grid.js:468-473` a **son propre** mécanisme (`editMedias`, `MAX_FILE`
2,6 Mo, `readAsDataURL`) pour la vue Semaine. Deux chemins de code pour la même
idée — à unifier à la fusion, sous peine de migrer l'un et d'oublier l'autre.

---

# 1. PLANIFICATEUR — inventaire (H1)

`apps/planificateur/` · **114 actions distinctes** relevées dans le balisage.
Source lisible (non minifiée).

## 1.1 Vues et navigation

| Fonction | Où | Données |
|---|---|---|
| Vue **Jour** (journée en blocs) | `app-v2.js renderJourV2` | Firestore `journees` |
| Vue **Semaine** | `renderSemaineV2` + `semaine-grid.js` | idem |
| Vue **Mois** (calendrier + jours-cycle) | `renderMois` | Firestore + `localStorage` config école |
| Vue **Séquentielle** (plan de session) | `v2-sq-*` | Firestore |
| Vue **Annuelle** | `v2-an-nav` | Firestore |
| Vue **Évaluation** | `eval-*`, `v2-ev-*` | Firestore `evaluations`, `evalConfig` |
| Vue **Roster** / groupes | `roster`, `v2-g-*` | Firestore `groupes`, `enfants` |
| **Historique** | `historique`, `select-history-enfant` | Firestore |
| **Live** (séance en direct) | `start-live`, `stop-live`, `live-complete` | Firestore |
| **Coordo** (vue coordonnateur) | `enter-coordo`, `exit-coordo`, `coordo-prev/next` | Firestore `organisations` |

## 1.2 Blocs de journée

Ajouter · éditer · supprimer · **monter/descendre** (`move-bloc-up/down`) ·
**copier/coller** (`v2-copy`, `v2-paste`, `v2-paste-into`, `v2-clip-cancel`) ·
**couleur** (`select-bloc-color`) · **police** (`select-bloc-font`) ·
**type** (`select-bloc-type`) · **minuterie** (`v2-timer`) ·
**cocher fait** (`v2-tog-fait`) · **pièces jointes** (§0).

## 1.3 Jours-cycle et calendrier scolaire

| Fonction | Où | Données |
|---|---|---|
| Cycle de N jours | `v2-cyc-len` | `localStorage` (config école) |
| **Style d'affichage du cycle** | `v2-cyc-style` | idem — *voir §5, demande de Joey* |
| **Noms personnalisés** des jours-cycle | `[data-cyc-name]`, `schoolSave()` | idem |
| Poser/retirer un jour-cycle sur une date | `v2-cycle-pick`, `v2-cycle-set` | Firestore |
| **Type de journée** (congé, pédago, spécial) | `v2-day-type` | Firestore |
| Note et titre du jour | `[data-day-note]` | Firestore |
| Résumé d'une date | `v2-daysum`, `v2-open-day` | — |
| **Import de calendrier `.ics`** | `v2-import-ics`, `app-v2.js:259-291` | Analyse `VEVENT`/`DTSTART`, **classe congé/pédago/spécial par mots-clés** |
| Vider le calendrier | `v2-cal-clear` | Firestore |

## 1.4 Gabarits, groupes, présences

**Gabarits** (`gabarit`, `appliquer-gabarit`, `apply-single`, `apply-batch`) —
journée/semaine/cycle-type appliqués à un ou plusieurs jours. C'est la
duplication de semaines demandée au mandat.

**Groupes** : ajouter, renommer, archiver, supprimer, basculer
(`v2-g-add/rename/archive/delete/toggle`), présence et évaluation par groupe.

**Enfants** : ajouter, éditer, supprimer, **photo**, personnes autorisées
(`add-autorise`, `remove-autorise`), particularités, note.

**Présences** : pointage au tap (`tap-presence`), **appui long = absent**,
humeur (`select-humeur`), départs (`confirm-depart`), arrivée en cycle
(`cycle-arrive`), modal présences.

**Messages / coordo** : boîte, fils, envoi (`msg-inbox`, `open-thread`,
`send-message`), **valider la semaine + notifier le coordo**
(`valider-semaine` → Worker `notify-coordo`).

## 1.5 Sortie, affichage, divers

| Fonction | Où | Note |
|---|---|---|
| **Impression** | `v2-pdf` → `window.print()` ; `@media print` dans `index.html:740` et `semaine-grid.js:170` | Pas de génération PDF : c'est l'impression navigateur |
| **Export JSON de l'année** | `v2-export-json` | Fichier téléchargé |
| **Mode TBI** | `v2-tbi` | `localStorage planif_tbi`, classe `body.tbi` |
| **Mode intégré** | `?embed=1` | Masque le chrome, rapporte sa hauteur au parent (`postMessage`) |
| **Métier** (ÉPS/camp/SDG) | `v2-metier`, `?metier=` | `body[data-metier]` |
| **Tiroir Jeux** | `open-tiroir-jeux`, `tiroir-trou`, `tiroir-fill-bloc` | Banque 147 fiches + catalogue 1439 |
| **Plan B** | `v2-planb` | |
| **Raccourcis clavier** | `app-v2.js:1273-1281`, `semaine-grid.js:450` | Entrée valide / saut de ligne selon le champ ; Échap ferme |
| **i18n FR/EN** | `semaine-grid.js:215-226` | |

**Hors-ligne : rien.** Aucun service worker, aucun manifeste. L'app exige le
réseau (Firestore). Le seul « local » est le miroir de médias et la config école.

---

# 2. CARNET EPS — inventaire (H2)

Bundle React minifié `assets/index-BqzDoR3c.js` ; `app.js` (V1 vanilla) sert de
documentation lisible. Détail complet : `AUDIT-CARNET-EPS-2026-08.md`.

## 2.1 Les 7 vues

`dashboard` · `classes` · `evaluate` · `planning` · `reports` · `games` ·
`settings`.

## 2.2 Fonctions fines

| Fonction | Détail constaté | Données |
|---|---|---|
| **PFEQ 3 compétences** | `agir` (27 critères) · `interagir` (18) · `sante` (17) + `custom_` | `carneteps-pfeq`, `-custom` |
| **Multi-échelles** | 4 modes — couleurs, lettres, chiffres, symboles — ramenés à un barème /100 par pas de 20 | `carneteps-evallabels`, `-evalcolors` |
| **Max 5 critères simultanés** | Contrainte dure du code | — |
| **Présences photo** | Clic sur la photo = présent/absent/retard | `carneteps-attendance` + **IndexedDB `carneteps-photos-db`** |
| **Trombinoscope** | Photos redimensionnées à 400 px | IndexedDB |
| **Émulation** | Étoiles et points par élève | localStorage |
| **Tenue sportive** | T-shirt / short / souliers | localStorage |
| **Chrono & laps** | Chronométrage par tour | état de session |
| **Test Léger-Boucher** | **Table de 21 paliers en dur**, 4 mesures par élève (`leger_palier`, `_distance`, `_navette`, `_vitesse`) | `carneteps-data` |
| **Course navette** | `navette_laps` en JSON | idem |
| **Régulation** | Banc de retrait avec minuterie | `carneteps-conflicts-<groupId>` |
| **Rapports & bulletins** | Absences, retards, moyennes, statut complet/incomplet | calculé |
| **Export CSV** | 6 points d'appel | téléchargement |
| **Sauvegarde / restauration JSON** | Réparée par `carnet-export.js` (mandat A-bis) | §4 |
| **Planificateur d'horaire** | Grille jour × période | `carneteps-schedule` |
| **Banque de jeux locale** | Jeux perso de l'enseignant | `carneteps-games` |
| **Journal de bord** | Par groupe | localStorage |
| **Dates des étapes** | 4 étapes | `carneteps-etape-dates` |
| **Zoom** | Réglage d'affichage | `carneteps-zoom` |
| **5 langues** | fr · en · es · **ru** · zh | `carneteps-lang` |

**Hors-ligne : pas une PWA.** Aucun service worker. « Hors-ligne » sur la
landing veut dire *données sur ton appareil*.

---

# 3. CROISEMENT AVEC LE PROTO G2 (H3)

Le proto est une **maquette à 7 écrans**. La colonne « destination » est une
proposition, pas une décision.

| Fonctionnalité | Dans le proto ? | Destination proposée |
|---|---|---|
| **Tiroir Jeux** | ✅ écran JEUX | Écran visible — tuile 🎲 |
| **Présences** | ✅ tuile | Écran visible — tuile ✅ |
| Présences photo (trombinoscope) | ❌ | Dans l'écran Présences |
| Humeur, départs, personnes autorisées | ❌ | Dans l'écran Présences |
| **Journée en blocs** | ✅ écran MA JOURNÉE | Écran visible — tuile 📋 |
| Copier / coller un bloc | ❌ | Dans MA JOURNÉE (appui long sur un bloc) |
| Couleur / police / type de bloc | ❌ | Dans l'édition d'un bloc |
| Minuterie de bloc | ❌ | Dans l'édition d'un bloc |
| Cocher « fait » | ❌ | MA JOURNÉE, sur le bloc |
| **Pièces jointes (glisser-déposer)** | ❌ | **MA JOURNÉE — la case reste une zone de dépôt.** Fonction à préserver telle quelle (§0) |
| **Plan B** | ✅ tuile | Écran visible — tuile 🌧️ |
| **Évaluation / Noter** | ✅ tuile ⭐ | Écran visible |
| PFEQ, multi-échelles, 5 critères | ❌ | Dans l'écran Noter |
| Léger-Boucher, course navette | ❌ | Dans Noter → **Tests physiques** |
| Chrono & laps | ❌ | Sous PLUS, ou dans MA JOURNÉE |
| Régulation (banc de retrait) | ❌ | Sous PLUS |
| Émulation, tenue sportive | ❌ | Dans Présences |
| **Vue Semaine** | ✅ calquée sur le gabarit | Sous PLUS → Voir autrement |
| **Vue Mois + jours-cycle** | ✅ calquée sur le gabarit | Sous PLUS → Voir autrement |
| **Vue Année** | ✅ calquée sur le gabarit | Sous PLUS → Voir autrement |
| Vue Séquentielle (plan de session) | ❌ | Sous PLUS → Mon groupe |
| Historique | ❌ | Sous PLUS |
| Live (séance en direct) | ❌ | MA JOURNÉE (bouton démarrer) |
| Coordo | ❌ | Réglages — rôle |
| Messages / valider la semaine | ❌ | Sous PLUS |
| **Gabarits** (journée/semaine/cycle-type) | ❌ | Sous PLUS → Mon groupe |
| **Import `.ics`** | ❌ | Sous PLUS → Imprimer et partager |
| **Impression** | ❌ | Sous PLUS → Imprimer et partager |
| **Export JSON / CSV** | ❌ | Réglages → Données |
| Sauvegarde-restauration | ❌ | Réglages → Données |
| **Mode TBI** | ❌ | Réglages, ou bouton dans MA JOURNÉE |
| Mode intégré `?embed=1` | ❌ | Conservé tel quel (paramètre d'URL) |
| **Métier** (3 personnages) | ✅ personnages cliquables | Écran d'ouverture |
| Groupes : ajouter/renommer/archiver | ❌ | Sous PLUS → Mes groupes |
| Journal de bord | ❌ | Dans Mes groupes |
| Banque de jeux perso | ❌ | Dans le tiroir Jeux |
| Dates des étapes | ❌ | Réglages |
| Zoom | ❌ | Réglages |
| Langues | ❌ | Réglages — **FR/EN à la fusion** (décision consignée) |
| Musique, Coloriage | ⏳ sous PLUS, badge BIENTÔT | Sous PLUS |

**Compte : 7 fonctions sur ~45 sont dans le proto.** C'est normal — le proto
juge l'allure et le parcours, pas la couverture. Le tableau ci-dessus est le
contrat : **chaque ligne a une destination, aucune n'est perdue.**

---

# 4. FONCTIONS DONT LES DONNÉES IMPOSENT UNE MIGRATION

| Données | Où elles vivent | Risque | Traitement |
|---|---|---|---|
| **Pièces jointes des blocs** | `localStorage pv2media_<journeeId>` | 🔴 Perdues au changement d'appareil ou au vidage du navigateur. Firestore garde le nom → **écart silencieux** | **Rejoignent le pont d'export.** Même nature que les photos du Carnet |
| **Médias de la vue Semaine** | second mécanisme, `semaine-grid.js` | 🔴 Même risque, **et facile à oublier** puisque c'est un autre chemin de code | À unifier avant migration |
| **Photos d'élèves (Carnet)** | IndexedDB `carneteps-photos-db` | 🟠 Traité — `carnet-export.js` les exporte depuis A-bis | Fait |
| **Tout `carneteps-*`** | localStorage | 🟠 Traité par le pont | Fait |
| **Config école (jours-cycle)** | `localStorage` | 🟠 Noms personnalisés, longueur et style du cycle : perdus au changement d'appareil | À porter en Firestore, ou à inclure à l'export |
| **`planif_tbi`, `planif_role`, `pv2school`** | `localStorage` | 🟢 Préférences, perte tolérable | À déclarer |

> **Règle qui découle de cet inventaire :** toute donnée en `localStorage` ou
> IndexedDB est invisible du serveur. Avant de toucher à la fusion, elle doit
> soit passer en Firestore, soit entrer dans le pont d'export. **Rien ne doit
> rester dans un troisième état.**

---

# 5. DEMANDE DE JOEY EN COURS DE MANDAT — jours-cycle

Reçue pendant l'inventaire, à traiter **sur le proto** :

- **Chiffres et lettres** pour les jours-cycle, en plus des chiffres romains
- **Calendriers scolaires**
- **Images** pour les journées spéciales

**Constat utile :** l'action `v2-cyc-style` **existe déjà** dans le
Planificateur, ainsi que les noms personnalisés (`[data-cyc-name]`) et la
longueur de cycle (`v2-cyc-len`). Il faudra vérifier quels styles sont déjà
offerts avant d'en ajouter — la fonction n'est peut-être qu'à élargir, pas à
créer.

Traité au tour suivant, sur le proto.

---

# 6. CE QUE CE DOCUMENT NE COUVRE PAS

- **Le comportement réel de chaque fonction** n'a pas été exercé : inventaire
  par lecture de code, pas par usage. Les fonctions sont *présentes*, leur bon
  fonctionnement n'est pas attesté ici.
- **Le Carnet est un bundle minifié** : l'inventaire fin s'appuie sur les
  chaînes extraites et sur la V1 vanilla. Une fonction sans chaîne visible a pu
  m'échapper.
- **Aucune priorisation** : le contrat dit ce qui existe et où ça irait, pas
  dans quel ordre le faire.
