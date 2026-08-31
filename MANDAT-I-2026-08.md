# MANDAT I — Planificateur ZTS
### Fonctions humaines + couche IA + journal syndical + parascolaire

**Dépôt** `ZoneTotalSport/zts-zone-page` · **App** `apps/planificateur/` · **Reçu le** 31 août 2026
**État** : ⏸ **EN ATTENTE — Phase 0 (prescan) pas commencée.** Aucune ligne de code
écrite pour ce mandat. Conversation interrompue par Joey, à reprendre ailleurs.

---

## ⚠ PRINCIPE DIRECTEUR — ON NE TOUCHE À RIEN

Tout ce mandat est **ADDITIF**. Chaque fonction existante du §1 reste exactement
telle quelle : même code, même comportement, même donnée, même place.
**Si une fonction nouvelle semble exiger de modifier une fonction existante :
s'arrêter et demander. Ne pas décider seul.**

Une seule exception, décidée par Joey : « Mon temps travaillé » est rebaptisé
**MON PARASCOLAIRE** et devient le socle du lot D (§6 bis). Ses champs, ses
calculs et ses signatures restent intacts ; on construit autour.

---

## 0. Rôle et skills

Développeur senior fullstack de zonetotalsport.ca, appliquant le skill maître
**zone-total-sport** en tout temps, ses trois volets à la fois :

- **Testeur QA** — audit obligatoire (12 angles, rapport F-xx classé par gravité,
  bloquants et majeurs corrigés AVANT livraison, test de sortie). Sur toute
  modification : re-tester au minimum la zone touchée + fonctionnel, persistance,
  erreurs, console.
- **Stratégiste de catalogue** — aucune fonction dupliquée : avant de créer un
  écran, vérifier qu'il n'existe pas déjà dans le Planificateur, le Carnet EPS,
  Studio Jeu ou l'app quiz. **Brancher plutôt que recréer.**
- **Directeur artistique** — charte marine actuelle (`shared/zts.css`,
  `assets/ztsh-shell.css`) : bordures `3px solid #1A1A2E`, ombres dures
  `4px 4px 0 #1A1A2E`, cartes papier `#FFFEF7` sur marine, accent par métier
  (ÉPS cyan `#00E5FF` / SDG lime `#39FF14` / camps orange `#FF6B00`),
  Luckiest Guy + Quicksand auto-hébergées. **Jaune et lime jamais en texte
  courant. Zéro Pop Art, zéro bûcheron.**

**Stack** : GitHub · Cloudflare Pages + Workers + R2 · Firebase Auth + Firestore.
Code commenté en français, prêt à commit.

---

## 1. ACQUIS — inventaire de l'existant (INTOUCHABLE)

Tout ce qui suit est fait, en prod ou validé. **À lire pour s'y greffer, pas pour
l'améliorer. Toute régression sur une de ces lignes = bloquant.**

### 1.1 Architecture et décisions gelées

- **Scénario B verrouillé** : un seul moteur calendrier nuagique muré par le
  Cadenas (le Planificateur) + un Agenda public léger comme aimant SEO. Le
  Planificateur absorbe Planification, Agenda et Carnet EPS.
- **v2 est le défaut** depuis le 9 juillet (`state.v2 = !params.has('v1')`) ;
  `?embed=1` est un mécanisme distinct. **Ne pas y toucher.**
- **D24 tranché définitivement** : en-tête ZTS complet sur le Planificateur, même
  mise en page que l'accueil (PR #49 — retrait du masquage `body.pv2` sur
  l'en-tête + correctif du `padding:16px` qui écrasait la réserve du header).
- **Directive non négociable « enfant de 10 ans »** : gros boutons picto + un mot,
  le moins de texte possible, rien enlevé (l'avancé rangé sous PLUS), divulgation
  progressive, **règle des 3 taps**, filtres fermés par défaut.
- **Les 3 métiers se différencient uniquement par le personnage**
  (`perso-ep.png` défaut / `perso-sdg.png` / `perso-camp.png`, servis à la
  racine) — le personnage EST le bouton, aucun émoji nu ni mot pour changer de
  métier.
- **Polices** : Luckiest Guy à contour noir pour les titres, Quicksand pour le
  corps. Charte marine actuelle partout (les gabarits papier en cyan/jaune sont
  une STRUCTURE, pas une palette).
- **Règle « aucun troisième état »** : toute donnée vit en Firestore ou dans le
  pont d'export, **jamais en localStorage seul**. La config école `v2-cyc-style`
  y entre.
- **Principe du registre d'export** (annexe A de `AUDIT-CARNET-EPS-2026-08.md`) :
  « le registre classe, il n'exclut jamais » (bloc `unknown` accepté).
- **Vocabulaire des tags GELÉ** : `ageMin`/`ageMax` en nombres, `niveau` conservé
  si la source le donne, `dureeMin` en minutes (paliers dérivés à l'affichage),
  `energie` calme/modere/actif, `moment`
  accueil/diner/sieste/depart/fin-de-journee/soir, `fonction`
  rassemblement/transition/echauffement/retour-au-calme, `theme` = univers
  narratifs, `meteo` = « conçu pour » optionnel, `materiel`
  aucun/leger/specifique (specifique ⇒ `materiel[]` rempli), `espace` 3 valeurs
  + `lieu` optionnel. Mapping énigmes : question→but, réponse→deroulement.
- **`pfeq`/`niveau` vides dans les mini-banques = CORRECT** en attendant le
  jugement de Joey. **E3** (durées des 6 familles camps) en attente de Joey.
  Ne pas les remplir d'office.

### 1.2 En prod dans `main` (Planificateur)

- Onglets PLANIFICATION / GROUPE / ÉVALUATION ; calendrier mensuel ; **vue Jour à
  l'ouverture** (PR #47) ; grille vue Jour PÉRIODE/HEURE · GROUPE · DÉROULEMENT ·
  FAIT ✓ ; dock en tuiles ; fond sunburst ZTS ; **mode TBI** (persistance
  localStorage, zoom 1.4×).
- Bouton standard `.zts-action` (mandat A).
- **Tiroir JEUX** (overlay) depuis la vue Jour, tuile 🎲 JEUX ; **badge dynamique
  par univers (camps 970 / sdg 177 / eps 1274)** ; libellés à contraste 17.06
  (PR #47).
- **Banque** : catalogue **1439 jeux** via Worker R2 — `public.json` (12 champs,
  sans `univers`, sauf les 3 vitrines entières) aux anonymes, `full.json` (R2
  brut, 1439 avec univers) aux connectés ; pipeline
  `_scripts/publie-banques-r2.sh` appelé par la CI à chaque fusion. **Toute mesure
  du Worker précise la portée (public/full) et l'état de connexion.**
- **Mini-banques** : 61 camps (schéma migré), 64 sdg (45 nouvelles + 19 partagées
  `univers:["camps","sdg"]`, PR #45), 41 eps (9 doublons écartés, PR #46).
  Multi-univers par construction, zéro doublon avec `jeux-merged.json`.
- **`dataStore.js`** : promesse `sourcesBrutes()` mutualisée (1 appel Worker pour
  3 univers), non-régression prouvée sur les 1439. **Ne pas le restructurer.**
- **360 cours ÉP complets** dans `_data/planification/ep-*.json` + `sdg.json`
  (21 champs dont `pfeq`) — contenu propre du Planificateur, distinct de la
  mini-banque (les cours = séances, la mini-banque = tiroir).
- Menu PLANIFICATIONS du header réduit à un item, `app:'planificateur'` (PR #37).
- **Glisser-déposer / collage** de fichiers PNG/JPEG/PDF/MP3/MP4 dans les cases,
  réduction auto des images, plafond 2,5 Mo — **DEUX mécanismes distincts**
  (`app-v2.js` et `semaine-grid.js`). ⚠ **Dette consignée** : les octets vivent en
  localStorage (Firestore garde le nom) ; chantier prioritaire séparé = étendre le
  pont d'export aux pièces jointes des deux mécanismes. **Ne pas le faire dans ce
  mandat ; s'y brancher quand il sera livré.**
- **`CONTRAT-FONCTIONNEL-FUSION-2026-08.md`** : ~114 actions du Planificateur +
  fonctions fines du Carnet, chacune avec destination, **aucune ligne à
  abandonner**.
- Branche `feat/biblio-camp-seed` supprimée (ancêtre de main, tout le travail
  camps est en prod).

### 1.3 Carnet EPS (`apps/evaluation/`) — VERROUILLÉ

- Bundle React 19, 7 vues, tout local (clés `carneteps-*`, photos en IndexedDB
  `carneteps-photos-db`), Léger-Boucher 21 paliers, langues fr/en/es/ru/zh
  (réduites à FR/EN à la fusion), **source Vite définitivement introuvable**,
  `app.js` V1 = doc lisible du modèle.
- **Pont d'export `carnet-export.js`** (PR #41, vanilla, chargé par index.html) :
  contrat `version`/`exportedAt`/`source:"carnet-eps"`/`appVersion`, 18 clés +
  photos, fidélité au bit près, clés V1 gardées sous `legacy`, bug
  `colormeanings`/`color-meanings` géré. Garde d'affichage corrigée et bouton
  repositionné (PR #44).
- **Plus aucun écrit sur `apps/evaluation/`.** Dettes acceptées : 3 404 d'images
  du mur, chevauchement résiduel du bouton avec les commandes flottantes. Le
  Carnet sera absorbé dans l'onglet ÉVALUATION via ce pont — **autre chantier**.

### 1.4 Prototype `apps/planificateur/proto/` (hors app réelle, données factices)

- Écran d'ouverture 6 tuiles : 🎲 JEUX · ✅ PRÉSENCES · 📋 MA JOURNÉE (→ MES COURS
  en ÉPS) · 🌧️ PLAN B · ⭐ NOTER · ⋯ PLUS ; tout tient sans défiler ; changement de
  métier par personnages seuls ; sous PLUS : Musique et Coloriage en BIENTÔT.
- Vues SEMAINE / MOIS / ANNÉE, navigation JOUR/SEMAINE/MOIS/ANNÉE — calquées sur
  les 4 gabarits papier de Joey.
- 147 champs éditables persistants au rechargement, cerclage jaune des cases
  remplies.
- **G2-SUITE** (3 gabarits papier supplémentaires) : blocs « Planification
  journalière », **Mon temps travaillé** (Date/Activité/Temps, total − temps
  reconnu, signatures direction/responsable), Calendrier scolaire ; médias dans
  les blocs ; cocher les jeux faits ; minuterie par jeu préremplie avec
  `dureeMin`, buzzer d'aréna à zéro (2 MP3 fournis).
- ⚠ **L'état décrit ici (« 5 onglets », « G2-SIMPLIFICATION en cours ») est
  DÉPASSÉ** — voir le §« ÉTAT RÉEL DU PROTO » en fin de document.
- **Règle de méthode** : plus jamais de maquette en texte ; prototype HTML
  cliquable, **validation VISUELLE de Joey avant toute implémentation dans l'app
  réelle**.

### 1.5 Autres apps qui touchent ce mandat (à brancher, pas à dupliquer)

- **Studio Jeu** (`apps/studio-jeu/`) : éditeur visuel de documents et vidéos
  d'explication de jeux depuis le catalogue.
- **App quiz sportif** : banque de questions + pipeline d'illustrations Gemini.
- **Cadenas** : paliers et murs de conversion ; l'IA s'y accroche, elle ne crée
  pas de mur parallèle.
- **zts-notify** : Worker Telegram existant, modèle de déploiement/secrets/CORS
  pour tout nouveau Worker.

---

## 2. Règles non négociables

1. **On ne touche à rien** (voir §1). Habillage et fonctions additifs ; rollback
   d'une fonction = retirer une ligne.
2. ⚠ **ABROGÉE LE 31 AOÛT — voir §10.1 pour le texte qui fait foi.**
   ~~**Enfant de 10 ans.** Chaque nouvelle fonction = un gros bouton (picto + un
   mot) dans un écran existant, ou une entrée sous PLUS. **Aucun nouvel onglet
   aux 3 de G2. Maximum 3 nouvelles entrées sous PLUS.**~~
   Le principe « enfant de 10 ans » reste entier ; seule la limite d'onglets et
   d'entrées PLUS tombe.
3. **L'IA est UN bouton « ✨ ».** Dans le tiroir JEUX (sur une fiche), dans MA
   SEMAINE (case vide ou séance) et sur la tuile PLAN B. **Jamais d'écran « IA »,
   jamais de champ de prompt libre visible par défaut.**
4. **Aucun troisième état.** Toute donnée nouvelle vit en Firestore OU dans le
   pont d'export.
5. **Rien n'est perdu.** Le contrat fonctionnel gagne une ligne par action
   ajoutée ; aucune ligne existante n'est modifiée.
6. **Ancrage sur le catalogue.** L'IA reçoit toujours des fiches réelles
   (catalogue + cours ÉP) comme contexte et **cite lesquelles elle a utilisées**.
   Sans fiche pertinente, elle le dit.
7. **Aucune donnée d'élève ni du journal syndical ne sort vers l'IA.**
   Restrictions médicales, allergies, PI, notes, comportement, incidents : jamais
   dans une requête. `{{prenom}}` remplacé côté client **APRÈS** la réponse.
8. **Clé API jamais côté client.** Tout appel IA passe par un Worker qui vérifie
   le jeton Firebase, le palier Cadenas et un quota par usager.
9. **Prescan lecture seule d'abord, STOP**, puis un lot = une branche = une PR.
   Recette prod connectée après chaque merge. **Tout s'ajoute d'abord au proto ;
   implémentation réelle après validation VISUELLE de Joey.**
10. **Statut de chantier tenu** (OUVERT / EN COURS / EN ATTENTE DE JOEY / CLOS)
    dans le rapport de chaque lot.

---

## 3. Phase 0 — Prescan (lecture seule) → `PRESCAN-MANDAT-I-2026-08.md`

Sans écrire une ligne de code applicatif, produire :

0. **Vérification des acquis** : confirmer ligne par ligne le §1 contre le dépôt
   réel (fichier, ligne, état). **Toute divergence est signalée, pas corrigée.**
1. **Canal courriel** : existe-t-il un envoi côté serveur (Worker, Firebase
   Extension, service tiers) ? Sinon, option la plus simple et son coût — ça
   décide la v1 ou v2 de C4.
2. **Carte de l'existant** pour chaque fonction des lots A, B et C : existe /
   partiel / absent, avec fichier et ligne. En particulier : fiche élève héritée
   du Carnet (trombinoscope, comportement), ce que `v2-cyc-style` et RÉGLAGES
   offrent, ce que la tuile PLAN B fait aujourd'hui, l'état de l'impression
   (`@media print`) par vue, évaluations datées dans le modèle.
3. **Modèle de données Firestore actuel** (collections, documents, champs) pour
   greffer les schémas du §7 sans casser le pont d'export.
4. **Inventaire des Workers** (zts-notify, Worker R2) : déploiement, secrets,
   CORS — `zts-ia` les imite.
5. **Fréquences réelles** de `pfeq`, `niveau`, `materiel`, `espace` dans les 1439
   + 360 cours, taille moyenne d'une fiche : dimensionne le contexte IA.
6. **Coût estimé par appel IA** pour chaque fonction du lot B, proposition de
   quota par palier Cadenas.
7. **Plan de placement UX** : pour chaque fonction, l'écran (AUJOURD'HUI / MA
   SEMAINE / PLUS / tiroir JEUX) et le bouton exact.
8. **MON TEMPS aujourd'hui** : ce que l'écran « Mon temps travaillé » du proto
   fait exactement (champs, calcul total − reconnu, signatures, persistance), et
   comment les vues MA SEMAINE / MOIS traitent les soirs et les fins de semaine
   (rien, bande « Soir », cases fermées ?) — ça décide comment les événements
   parascolaires s'affichent **sans toucher aux grilles existantes**.
9. **Risques et questions à trancher**, avec recommandation par défaut.

**STOP. Attendre le GO de Joey sur le prescan.**

---

## 4. Lot A — Fonctions humaines (inspirées de l'Agenda de l'enseignant)

**Ordre imposé : A1 et A2 d'abord, puis le lot C, puis le lot D, puis A3-A7.**

### A1 — Dossier de remplacement 1 clic (PLUS → 🧑‍🏫 REMPLAÇANT)
PDF A4 dérivé de la journée ou de la semaine planifiée : horaire (périodes,
heures, récréation, dîner), groupes avec effectif et local, déroulement de chaque
séance depuis MA SEMAINE (jeux épinglés avec règles courtes), consignes de
sécurité et emplacement du matériel (champ libre de RÉGLAGES rempli une fois),
plan B du jour, contacts école. **Rien à stocker.** Bouton « Préparer pour
demain » + choix aujourd'hui / demain / la semaine. Charte, personnage du métier
en en-tête, **lisible en noir et blanc**.

### A2 — Fiche élève sécurité (MES GROUPES → élève → 🩺)
Étend la fiche existante (ou héritée du Carnet) : restrictions médicales,
allergies, PI (oui/non + note), anniversaire, besoins particuliers (menu : aucun
/ accompagnement / adaptation / autre). **Picto ⚠️** sur l'élève dans PRÉSENCES et
le trombinoscope quand une restriction ou allergie existe — **détail masqué en
mode TBI**. Champs dans le pont d'export et règles Firestore par usager.
**Jamais envoyés à l'IA.**

### A3 — Évaluations sur le calendrier
Une évaluation planifiée dans ÉVALUATION apparaît dans MOIS et MA SEMAINE avec
son picto, rappel « évaluation dans 7 jours » sur AUJOURD'HUI. Si le modèle n'a
pas d'évaluations datées, les ajouter au schéma **sans dupliquer le Carnet**.

### A4 — Objectifs de l'année + bilan de période (PLUS → 🎯 MES OBJECTIFS)
Zones texte par groupe et par période (selon RÉGLAGES), cases à cocher pour les
objectifs. Un écran, défilement vertical.

### A5 — Impression A4 sélective
Chaque vue (AUJOURD'HUI, MA SEMAINE, MOIS, ANNÉE, liste de groupe, fiche élève
**sans données médicales**, objectifs) s'imprime proprement : `@media print`
dédié, marges, en-tête ZTS discret, pas de marine plein fond, pas de boutons.
Bouton 🖨️ dans le coin de chaque vue. **Purement additif : aucune règle CSS écran
modifiée.**

### A6 — Banque de messages v1 (PLUS → ✉️ MESSAGES)
JSON statique **≥ 60 messages** typés par métier et situation (ÉPS : tenue de gym,
blessure mineure, sortie, félicitations, comportement, fin d'étape ; SDG :
parents, retard, matériel ; camps : rappel, sortie, objets perdus). Copie en un
tap, `{{prenom}}` depuis la liste du groupe.

### A7 — Modèles familles
Trois gabarits à la charte exportés en PDF : diplôme (olympiades / défi /
persévérance), autorisation de sortie (camps, zone signature), mot de bienvenue.
**Si Studio Jeu peut les produire, brancher plutôt que dupliquer.**

---

## 5. Lot B — Couche IA (inspirée de Chalkie)

### B0 — Worker `zts-ia` (prérequis)
- Endpoint POST `/generer` avec `{ action, contexte, options }`. Actions : `sae`,
  `remix`, `planb`, `etiqueter`, `tbi`, `message`, `quiz`.
- Vérifie le jeton Firebase, lit le palier Cadenas, applique un **quota mensuel**
  (compteur Firestore), **429 clair** au dépassement.
- **Ancrage** : charge `full.json` + cours ÉP depuis R2, filtre par tags (univers,
  niveau, espace, materiel, dureeMin), joint les **N fiches** les plus pertinentes
  au prompt système (N du prescan). Prompt système : français québécois,
  vocabulaire PFEQ (C1-C2-C3 ÉPS, PDA), structure imposée, **sortie JSON strict
  validée par schéma**.
- Journal de coût (tokens, action, palier), **jamais le contenu**. Cache 24 h par
  empreinte.
- **Tests** : jeton invalide, palier insuffisant, quota dépassé, JSON invalide du
  modèle (retry 1 fois puis erreur propre), R2 indisponible.

### B1 — Générer une SAÉ et la poser sur le calendrier (MA SEMAINE → case vide → ✨)
**4 choix max** (thème ou sport · cycle/niveau · nombre de cours · durée), le
reste déduit de RÉGLAGES et du métier. N séances (échauffement / principale /
retour au calme, matériel, sécurité, différenciation, critères PFEQ) ancrées sur
des fiches citées. Aperçu, puis « Poser sur mon calendrier » remplit les N
prochains créneaux du groupe ; **chaque séance reste une case normale.**
Camps : « semaine thème » → 5 journées.

### B2 — Remix d'un jeu (tiroir JEUX → fiche → ✨)
Boutons prédéfinis : plus jeune · plus vieux · plus grand groupe · sans matériel ·
dehors/dedans. Variante au schéma gelé, `source:"remix"`, `origine:<id>`.
Épinglable ; **jamais écrite dans le catalogue.**

### B3 — Plan B adaptatif (tuile PLAN B → ✨)
Régénère la séance du jour pour classe / cour / gymnase partagé en gardant
l'objectif PFEQ, priorité aux fiches `espace` compatibles. Remplacement en un tap,
originale conservée dans l'historique de la case. **Le comportement actuel de la
tuile reste le défaut.**

### B4 — Étiquetage PFEQ / niveau (PLUS → outil admin, Joey seulement)
Passe par lot sur les fiches où `pfeq` ou `niveau` sont vides (**41 ÉPS d'abord**).
Propose ; Joey valide ligne par ligne ou par famille ; export JSON prêt pour la
mini-banque. **Rien n'est écrit automatiquement dans les banques.**

### B5 — Fiche TBI de la séance (AUJOURD'HUI → séance → 📺)
Page plein écran densité projection : titre Luckiest Guy, 3-5 consignes en gros,
picto matériel, minuterie existante branchée sur `dureeMin`. **Réutiliser le
moteur de Studio Jeu s'il sait déjà le faire.**

### B6 — Messages IA (PLUS → MESSAGES → ✨)
« Adapter » un message de A6 : ton (chaleureux / neutre / ferme), longueur (court
/ normal), canal (courriel / mot papier). **Aucune donnée d'élève envoyée.**

### B7 — Passerelle quiz (dernier, si l'app quiz est stable)
Depuis une séance : « 5 questions » → JSON au format de l'app quiz, ouverture avec
import. **Contrat JSON dans un fichier partagé avant de coder.**

---

## 6. Lot C — MON SYNDICAT : journal des incidents au travail

Indépendant du lot B. **Priorité : juste après A1-A2.** Journal factuel, jour
après jour, de ce qui arrive au travail (harcèlement, intimidation, violence
verbale ou physique, menace, agression par un élève, un parent, un collègue ou la
direction, accident de travail), envoyable au syndicat en tout temps.

### C1 — Placement
- **PLUS → 🛡️ MON SYNDICAT** (journal + envoi + réglages).
- **Bouton rapide 🛡️ SIGNALER sur AUJOURD'HUI** : 3 taps (type · qui · une
  phrase), entrée créée horodatée, détails complétés plus tard. Discret, **masqué
  en mode TBI**.

### C2 — Fiche d'incident
Date et heure (défaut maintenant) · lieu (gymnase, cour, corridor, classe, autre)
· type (harcèlement psychologique, intimidation, violence verbale, menace,
violence physique, agression par élève, agression par parent, conflit avec
collègue, conflit avec direction, accident de travail, autre) · personnes
impliquées (rôle élève/parent/collègue/direction/autre + nom ou initiales) ·
témoins · description factuelle (gabarit « ce qui s'est passé / ce que j'ai fait /
ce qui a suivi ») · conséquences (aucune / blessure / arrêt de travail /
déclaration CNESST / rencontre direction) · suivi daté (une ligne par étape) ·
pièces jointes via le mécanisme de médias existant (donc dans le pont d'export) ·
statut (ouvert / en suivi / clos).

### C3 — Intégrité (valeur de preuve)
- `creeLe` = **horodatage serveur Firestore**, non modifiable.
- Toute modification **crée une version** ; historique consultable
  (« modifié le … »).
- Suppression : **double confirmation**, passage en `archivee` ; purge réelle
  seulement depuis RÉGLAGES avec **saisie du mot « SUPPRIMER »**.
- Compteur visible : « 14 incidents cette année · 3 ouverts ».

### C4 — Envoi au syndicat
- **RÉGLAGES du module** : courriel du syndicat (+ copie optionnelle), nom du
  délégué, numéro de membre (facultatif), signature, école.
- **Envoyer maintenant** : PDF sobre (densité travail, noir et blanc lisible) avec
  chronologie filtrée (aujourd'hui / cette semaine / depuis le dernier envoi /
  tout / un incident) + courriel prérempli (`mailto:`, objet « Suivi incidents —
  <école> — <période> », résumé en corps) + PDF téléchargé à joindre.
  **v1 : zéro serveur.**
- **v2** (si le prescan trouve un canal courriel serveur simple) : envoi direct
  avec pièce jointe, journal des envois, rappel optionnel « incidents non envoyés
  depuis 7 jours » sur AUJOURD'HUI.
- Chaque envoi marque les incidents couverts (`envoyeLe`).

### C5 — Cloisonnement strict
**Jamais** dans le dossier de remplacement, **jamais** dans les impressions
générales, **jamais** en mode TBI, **jamais** à l'IA. Collection Firestore
distincte, propriétaire seul. Filtres (type, personne, période) fermés par défaut.

### C6 — Ce que le module ne fait PAS
Pas de conseil juridique, pas de qualification automatique, pas de partage entre
usagers. Texte court dans RÉGLAGES : **outil de documentation personnelle** à
transmettre au syndicat, à la direction ou à la CNESST selon le cas.

---

## 6 bis. Lot D — MON PARASCOLAIRE : heures, cahier illustré, calendrier de saison

Joey anime des activités parascolaires (équipes, tournois, soirs et fins de
semaine). Ces heures sont une **tâche reconnue** et doivent être comptabilisées,
documentées et **prouvables**. Ce lot rebaptise « Mon temps travaillé » en
**MON PARASCOLAIRE** (seule exception à « on ne touche à rien ») et construit
autour.

### D1 — Placement
- **PLUS → 🏆 MON PARASCOLAIRE**, remplace l'entrée MON TEMPS. Écran d'ouverture :
  mes activités (cartes), prochain événement, compteur d'heures de l'année.
  Enfant de 10 ans : **4 gros boutons** — 📅 SAISON · 📓 CAHIER · ⏱️ MES HEURES ·
  👥 MON ÉQUIPE.
- Sur **AUJOURD'HUI** : carte « Ce soir / cette fin de semaine » quand un
  événement parascolaire tombe dans les 48 h (lieu, heure, quoi apporter).
  **Rien si aucun.**
- Dans **MOIS** : les événements parascolaires apparaissent avec un picto distinct
  (🏆 partie, 🏅 tournoi, 🏃 pratique) **sans modifier les cases-jours existantes**
  (calque additif). Dans **MA SEMAINE** : une bande « Après l'école » sous la
  période 6 **si le prescan confirme qu'elle s'ajoute sans toucher à la grille
  Périodes 1-6** ; sinon, badge dans l'en-tête du jour seulement.

### D2 — Activités (une carte par activité)
Nom, sport ou discipline, saison (dates début/fin), catégorie (niveau/cycle, mixte
ou non), lieu habituel, horaire récurrent des pratiques (jours + heure),
entraîneur(s), couleur d'accent, statut (à venir / en cours / terminée). Une
activité peut être **archivée**, jamais supprimée sans double confirmation.

### D3 — Mon équipe
Liste de joueurs tirée des groupes existants (tous groupes confondus, une case par
élève) + joueurs hors groupes saisis à la main. Par joueur : numéro de chandail,
poste, autorisation parentale reçue (case), frais payés (case, montant optionnel),
**picto ⚠️ hérité de A2** (restrictions/allergies — détail masqué en TBI).
Présences aux pratiques et aux parties **par le même mécanisme que PRÉSENCES**.
Impression de la liste d'équipe (A5) et de l'autorisation de sortie (A7)
préremplies.

### D4 — Calendrier de saison
Événements : **pratique** (générés depuis l'horaire récurrent, modifiables un à
un), **partie** (adversaire, domicile/visiteur, lieu, heure de départ et de
match), **tournoi** (lieu, jours multiples, horaire), **autre** (réunion de
parents, photo d'équipe). Champs communs : transport (autobus / parents / à pied),
quoi apporter, notes, résultat (pointage libre, saisi après coup). Vue liste
chronologique + injection dans MOIS/MA SEMAINE (D1). **Export .ics** de la saison
et **PDF « Horaire de saison »** à remettre aux parents (charte, une page).
**Un événement coché « fait » génère automatiquement une ligne d'heures (D6).**

### D5 — Cahier pédagogique illustré
Une page par séance (pratique ou partie), créée **en un tap** depuis l'événement :
objectif de la séance · exercices dans l'ordre — épinglés depuis le tiroir JEUX
(1439 + mini-banques + remix B2) ou saisis à la main — chacun avec durée,
illustration (image de la fiche, photo, dessin de Studio Jeu ou image générée par
le pipeline existant), consignes courtes · « ce qui a bien été » / « à
retravailler » · photos de la séance (mécanisme de médias existant, donc pont
d'export) · joueurs absents (hérité de D3) · cases « fait » par exercice +
minuterie existante par exercice.
**Export PDF « Cahier de saison »** : toutes les pages de l'activité, illustrées,
chronologiques — **c'est le portfolio à montrer à la direction ou à joindre à la
reconnaissance des heures.**
Avec ✨ (lot B) : « proposer une pratique » ancrée sur le catalogue, même contrat
que B1 mais pour une séance parascolaire.

### D6 — Mes heures (l'ancien « Mon temps travaillé », INTACT)
Le tableau Date / Activité / Temps, le calcul **Temps total − Temps reconnu** et
les **signatures direction/responsable** restent **exactement tels quels**.
Ajouts autour : lignes générées automatiquement par les événements « faits »
(durée réelle, incluant déplacement si coché), lignes manuelles toujours
possibles, filtre par activité et par période, total par activité, **PDF « Relevé
d'heures » signé** (page existante) avec en annexe optionnelle l'horaire de saison
et le cahier. Rappel discret sur AUJOURD'HUI le dernier vendredi de chaque mois :
« X h à faire signer ».

### D7 — Communication et fin de saison
- Messages parascolaires ajoutés à la banque A6 (partie annulée, rappel de
  tournoi, transport, résultat, félicitations), adaptables par B6.
- **Fin de saison en un tap** : diplômes A7 pour toute l'équipe (prénom +
  activité), bilan de saison (3 zones texte), archivage de l'activité,
  statistiques simples (pratiques faites, parties jouées, présence moyenne, heures
  totales).
- Si l'app **Zone Inventaire** existe en prod : bouton « prêt de chandails » qui y
  renvoie avec la liste des numéros ; sinon, simple case « chandail remis /
  rendu » par joueur.

### D8 — Cloisonnement
Les données d'équipe suivent les mêmes règles que les élèves (A2, règle 7) : rien
vers l'IA **sauf le contenu pédagogique du cahier** (exercices, objectifs —
**jamais les noms**). Les heures et le cahier sont exportés par le pont d'export.

---

## 7. Schémas de données (extensions Firestore, à confirmer au prescan)

```json
// eleve (extension — champs AJOUTÉS, aucun champ existant renommé)
{ "restrictions": "", "allergies": "", "pi": { "actif": false, "note": "" },
  "anniversaire": "MM-JJ", "besoins": "aucun|accompagnement|adaptation|autre" }

// evaluation (si absent du modèle)
{ "id": "", "groupeId": "", "date": "AAAA-MM-JJ", "titre": "", "competence": "C1|C2|C3", "type": "" }

// objectifs
{ "annee": "2026-2027", "groupeId": "", "objectifs": [ { "texte": "", "fait": false } ],
  "bilans": { "P1": "", "P2": "", "P3": "" } }

// seance générée (réponse IA validée par schéma)
{ "titre": "", "duree": 60, "pfeq": [], "niveau": "", "echauffement": {}, "principale": {},
  "retourAuCalme": {}, "materiel": [], "securite": [], "differenciation": {},
  "evaluation": [], "sources": [ "id-fiche-1", "id-fiche-2" ], "genereLe": "" }

// journal IA
{ "uid": "", "action": "", "tokensIn": 0, "tokensOut": 0, "palier": "", "date": "" }

// incident (collection privée `incidents`, propriétaire seul)
{ "id": "", "creeLe": "<serverTimestamp>", "dateEvenement": "AAAA-MM-JJ", "heure": "HH:MM",
  "lieu": "", "type": "", "impliques": [ { "role": "eleve|parent|collegue|direction|autre", "nom": "" } ],
  "temoins": [ "" ], "description": "", "consequences": [ "" ],
  "suivi": [ { "date": "", "texte": "" } ], "pieces": [ "<id-media>" ],
  "statut": "ouvert|suivi|clos", "archivee": false, "envoyeLe": null,
  "versions": [ { "modifieLe": "", "instantane": {} } ] }

// réglages syndicat (sous-document de l'usager)
{ "courriel": "", "copie": "", "delegue": "", "membre": "", "signature": "", "ecole": "" }

// activite parascolaire
{ "id": "", "nom": "", "sport": "", "debut": "AAAA-MM-JJ", "fin": "AAAA-MM-JJ", "categorie": "",
  "lieu": "", "recurrence": [ { "jour": 1, "heure": "15:30", "duree": 60 } ], "entraineurs": [ "" ],
  "accent": "", "statut": "avenir|encours|terminee", "archivee": false }

// joueur (sous-collection de l'activité)
{ "eleveId": null, "nom": "", "numero": "", "poste": "", "autorisation": false,
  "fraisPayes": false, "fraisMontant": null, "chandail": "remis|rendu|null" }

// evenement parascolaire
{ "id": "", "activiteId": "", "type": "pratique|partie|tournoi|autre", "date": "AAAA-MM-JJ",
  "heure": "HH:MM", "fin": "HH:MM", "lieu": "", "adversaire": "", "domicile": true,
  "transport": "autobus|parents|pied", "apporter": "", "notes": "", "resultat": "",
  "fait": false, "presences": { "<joueurId>": true }, "cahierId": null }

// page de cahier
{ "id": "", "evenementId": "", "objectif": "", "exercices": [ { "source": "catalogue|remix|manuel",
  "ref": "", "titre": "", "duree": 10, "illustration": "<id-media>", "consignes": "", "fait": false } ],
  "bienAlle": "", "aRetravailler": "", "photos": [ "<id-media>" ] }

// ligne d'heures (structure EXISTANTE de « Mon temps travaillé », champs ajoutés seulement)
{ "date": "", "activite": "", "temps": 0, "reconnu": 0,
  "evenementId": null, "activiteId": null, "auto": false }
```

**Tout nouveau champ entre dans le registre du pont d'export (classer, jamais
exclure).**

---

## 8. Livraison de chaque lot

1. Branche `mandat-i/<sous-lot>` → **PR en français** : quoi, où, **captures
   375 px + desktop**, et la **liste des fichiers existants touchés avec
   justification** (idéalement : aucun, seulement des ajouts).
2. **Rapport QA condensé** (F-xx, bilan chiffré, verdict). Angles minimum :
   fonctionnel, entrées hostiles (accents, textes longs, double-clic),
   persistance (Firestore + pont), erreurs (réseau coupé, Worker 500, quota),
   responsive 320/375/768/1440, Safari iOS, contraste sur marine, console propre
   — **plus une recette de non-régression sur les acquis du §1 concernés** (tiroir
   JEUX et ses badges 970/177/1274, vue Jour à l'ouverture, en-tête complet,
   glisser-déposer, minuterie, mode TBI, calcul total − reconnu et signatures de
   Mon temps travaillé).
3. `CONTRAT-FONCTIONNEL-FUSION-2026-08.md` mis à jour **par ajout seulement**.
4. **Recette prod connectée** en étapes que Joey refait en 30 secondes.
5. Bloc statut : `Mandat I-<x> — <statut> — reste : …`.

---

## 9. Questions à trancher au prescan (recommandation ; Joey tranche)

1. Palier Cadenas qui débloque l'IA et quota mensuel par palier.
2. N fiches de contexte par action (pertinence / coût).
3. Restrictions médicales : dans la collection élève migrée du Carnet, ou
   sous-document séparé avec règles Firestore plus strictes ?
4. Modèles familles : Studio Jeu ou gabarits HTML → PDF dans le Planificateur ?
5. Ordre définitif : A1-A2 → C → D → A3-A7 → B, ou C et D en worktrees parallèles
   dès le GO ?
6. Journal syndical : `mailto:` + PDF (v1) suffit au départ, ou attendre le canal
   serveur ?
7. Parascolaire : bande « Après l'école » dans MA SEMAINE (si additive) ou badge
   seulement ? Et les événements parascolaires comptent-ils dans le compteur
   d'heures automatiquement (D6) ou seulement sur confirmation ?

---
---

# ⚠ ÉTAT RÉEL DU PROTO AU 31 AOÛT 2026 (à lire avant le prescan)

Le §1.4 décrit le proto tel qu'il était **avant** le chantier G2/G3/G4 des 29-31
août. Voici l'état réel, sur la branche **`proto/g2`**, dossier
`apps/planificateur/proto/` — **quatorze commits d'avance sur `origin/proto/g2`,
tous NON POUSSÉS.**

**Le §1.4 du mandat est donc périmé sur plusieurs points. Le prescan doit partir
de CE document, pas du §1.4.**

## La barre : neuf portes, plus trois onglets
📋 MA JOURNÉE · 🗓️ MA SEMAINE · 📅 MON MOIS · 📚 MON ANNÉE · 📆 MON CALENDRIER ·
🏅 MON PARASCOLAIRE · 🔗 MES AUTRES APPS (menu déroulant) · ⋯ PLUS · ⚙️ (roue, à
l'extrême droite). 📤 Partager est dans l'en-tête.

✅ **TRANCHÉ le 31 août (§10.1)** : la barre existante fait foi, le Mandat I
n'ajoute AUCUNE porte (seule exception : le bouton 🛡️ SIGNALER du lot C sur
MA JOURNÉE). Le nombre de portes est un chantier UX reporté APRÈS le Mandat I.

⚠ **MON PARASCOLAIRE EXISTE DÉJÀ** comme porte de la barre (l'ancien « Mon temps
travaillé » renommé, contenu intact). Le lot D s'y greffe — **D1 est déjà fait et
D6 est l'écran actuel tel quel** (§10.3).

## ⚠ Le modèle a changé : l'horaire est le PATRON (commit `ff16ee0a`)
C'est le changement le plus important. Une séance n'existait que si on avait
glissé un groupe dans SA case, ce jeudi-là — 36 gestes par groupe et par période
pour un horaire qui ne change pas de l'année.

**🕐 MON HORAIRE** (sous ⋯ PLUS) est une grille périodes × jours où l'on dépose
les groupes **une fois**. `horGrille` = `{'<col>|<per>': groupeId}`,
`horMode` = `cycle` (défaut) ou `semaine`, colonnes `c0…cN` ou `d1…d5`.
**`seanceDe()` est ENVELOPPÉE (`proto-g4.js`)** : elle tire la séance du patron
quand rien n'est consigné à cette date.

**RIEN N'EST ÉCRIT tant que le prof n'écrit pas** — la séance est virtuelle, le
premier mot la matérialise. Mesuré : 11 cases au patron → 10 cours dans une
semaine, **zéro écriture**.

**Les trois règles, à ne jamais casser :**
1. **Ce qui est consigné gagne sur le patron** (l'exception est ce qu'on note).
2. **Retirer un cours du patron pose une EXCEPTION** `seSaut:<iso>:p<n>`, pas un
   vide — sinon le patron le remet dans la même repeinture.
3. **Un jour sans jour-cycle ne tire rien**, dans les DEUX modes — sinon un
   horaire hebdomadaire poserait des cours pendant la relâche.

⚠ **`seancesDuJour()` ne peut plus scanner les clés** : une séance peut exister
sans avoir jamais été écrite. Passer par `seanceDe()`. Le dossier d'élève, lui,
garde son balayage de clés — absences et notes n'existent que sur des séances
réellement consignées.

## Autres changements majeurs depuis le §1.4
- **La séance = jour × période × groupe** (`se:<iso>:p<n>`), avec **huit portes** :
  planification · minuterie · présences · jeux · message · évaluation · tests ·
  portrait du groupe. **Elle s'ouvre sur les PRÉSENCES** (option B choisie par
  Joey le 31 août).
- **La bande de groupes a quitté le haut de la page.** La palette vit dans
  🕐 MON HORAIRE. Toucher un onglet de groupe **ouvre le groupe** (élèves, cours
  du jour, ✎) partout sauf sur MA SEMAINE et MON HORAIRE, où il se prend en main.
- **La boîte à outils du site est en tête de MA JOURNÉE** : les 7 outils du rail
  flottant de l'accueil (🎲 Dé · 🎡 Roue · ⏱️ Chrono · ⏲️ Minuteur · 👥 Équipes ·
  📝 Message · 🏫 Mon école). ⚠ **Chrono ouvre l'écran TESTS et Minuteur ouvre le
  tiroir** — ne PAS réécrire un deuxième chronomètre.
- **▶ DÉMARRER LA SÉANCE et 📺 MODE TABLEAU BLANC** sont dans la **fenêtre de
  séance** (troisième adresse).
- **Plus de bande jaune de contexte** : le titre EST la commande (◀ titre ▶), et
  le « ↩ REVENIR À… » n'apparaît que lorsqu'on s'est éloigné. Le `− / +` de taille
  est **sous la date**, en deux exemplaires (par CLASSE, jamais par `id`).
- **MON MOIS et MON ANNÉE montrent les groupes** (pastille par cours / compte par
  semaine) — ils ne les connaissaient pas du tout avant.
- **L'import `.ics` du calendrier scolaire marche vraiment** : semaines dépliées
  (`DTEND` exclusif), dates importantes gardées en NOTE au lieu d'être jetées,
  **jours-cycle recalculés** après l'import.
- **Vider ma saisie** est dans RÉGLAGES › MES DONNÉES, en deux gestes.

## ⚠ Pièges payés à ne pas repayer
Le fichier `apps/planificateur/proto/LISEZ-MOI.md` porte le journal complet —
**le lire en entier avant de toucher au proto.** Les plus coûteux :
- Le navigateur sert `index.html` **et** les .js/.css depuis son cache : les
  ressources portent un `?v=` (**129** au 31 août), la PAGE se recharge en ⌘⇧R ou
  avec `?frais=N`.
- `[hidden]` ne cache rien dès qu'une règle d'auteur nomme un `display`.
- Piège n° 18, payé DEUX fois : `zoom` sur `<html>` divise la place réelle mais
  les `@media` lisent la largeur de la FENÊTRE. On calcule la largeur effective et
  on la publie en `html[data-etroit="1"]`.
- `margin-left:auto` ne pousse rien dans une grille (la barre doit rester `flex`).
- Un repli qui fabrique ce qu'on vient d'enlever n'est pas un filet, c'est une
  fuite (la palette se recréait au-dessus de l'agenda).
- Pas de drapeau d'état sur un objet qui sera écrit : il se retrouve dans le
  stockage.

## Comment ouvrir le proto
Servir la **racine du dépôt** (il appelle `/fonts/` et `/perso-*.png`) :
```
python3 -m http.server 8788
# → http://localhost:8788/apps/planificateur/proto/?frais=1
```
Entrée `zts-proto` dans `~/.claude/launch.json`. ⚠ Le serveur meurt avec la
session — le relancer, ce n'est pas une panne.

## ⚠ Ce qui attend Joey (avant le prescan)
1. **Valider visuellement le proto** dans son état actuel — bloqué tant que le
   **bug P0 d'affichage au scroll** n'est pas réglé (G3-STABILISATION, §10.5).
2. ~~Trancher la contradiction du §2.2~~ — **TRANCHÉ le 31 août, voir §10.1.**
3. ~~Pousser ou non les 14 commits~~ — **POUSSÉ le 31 août**, `origin/proto/g2`
   est à jour ; règle permanente au §10.4.
4. Les points en attente d'avant : **E3** (durées des 61 camps, 9ᵉ rappel), les
   **3 métiers** (doivent-ils vraiment différer ?), le **buzzer jamais ENTENDU**
   (vu jouer, `play()` appelé — le son reste à confirmer).

---

## 10. AMENDEMENTS — 31 août 2026 (tranchés par Joey, font foi sur le texte ci-dessus)

### 10.1 §2.2 REMPLACÉ (contradiction réglée)
L'ancienne règle « aucun nouvel onglet aux 3 de G2, maximum 3 entrées sous PLUS » est abrogée. Nouvelle règle 2 :
« La barre de navigation existante du proto fait foi. Le Mandat I n'ajoute AUCUNE porte à la barre. Tout ce que le mandat crée (lots A, B, C, D) se range sous PLUS ou s'intègre à une porte existante — seule exception : le bouton rapide 🛡️ SIGNALER sur MA JOURNÉE, prévu au lot C. Le nombre de portes lui-même est un chantier UX distinct, reporté APRÈS la livraison du Mandat I : aucune session ne le rouvre pendant. »

### 10.2 §1.4 PÉRIMÉ — l'« ÉTAT RÉEL DU PROTO AU 31 AOÛT » fait foi
Le §1.4 décrit le proto d'avant les trois jours de chantier G3. En cas de conflit entre le §1.4 et la section « ÉTAT RÉEL DU PROTO AU 31 AOÛT » de ce fichier, l'état réel gagne, toujours. Table de correspondance minimale :
- « AUJOURD'HUI » dans ce mandat = la porte 📋 MA JOURNÉE actuelle.
- « les 3 onglets de G2 », « l'écran 6 tuiles », « la tuile PLAN B » = leurs équivalents actuels (PLAN B vit dans le tiroir JEUX).
- Le prescan §3.7 (plan de placement UX) livre la table de correspondance COMPLÈTE vocabulaire-du-mandat → portes-réelles avant tout code; toute ambiguïté de placement se règle là, pas en improvisant.

### 10.3 Lot D — greffé, pas créé
MON PARASCOLAIRE existe déjà comme porte de la barre (l'ancien « Mon temps travaillé » renommé, contenu intact). Conséquences :
- D1 « remplace l'entrée MON TEMPS » : DÉJÀ FAIT, ne pas refaire.
- D6 « Mes heures » = l'écran actuel (tableau Date/Activité/Temps, calcul total − reconnu, signatures, envoi courriel/copie/CSV), exactement tel quel; les ajouts D6 se construisent autour.
- Les sous-lots D2 à D5 et D7-D8 s'ajoutent DANS cette porte existante.

### 10.4 Git — obligatoire avant la Phase 0
- Pousser immédiatement les 14 commits locaux de proto/g2 (origin est resté à 627f7242). GitHub identique au local avant toute Phase 0.
- Règle permanente pour ce mandat : pousser après chaque lot fusionné; jamais plus de 3 commits d'avance sur origin.

### 10.5 Coordination inter-sessions
- La Phase 0 (lecture seule) peut démarrer dès que les 14 commits sont poussés.
- AUCUN code des lots avant que les mandats G3-STABILISATION (bug P0 d'affichage au scroll + build G3 réellement servi sur localhost) et G3-FICHE (fiche de cours en 2 modes) soient CLOS : le P0 rend toute validation visuelle de Joey impossible, et la fiche de cours est un point d'ancrage des lots A et B.
- Une seule session code à la fois sur proto/g2. Au départ de toute session : git status; s'il y a des fichiers modifiés qu'elle n'a pas écrits elle-même → STOP et rapport à Joey.
- Les « pièges » se réfèrent par TITRE, jamais par numéro (les numérotations divergent entre sessions).
