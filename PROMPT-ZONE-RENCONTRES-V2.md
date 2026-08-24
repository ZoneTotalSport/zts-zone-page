# PROMPT CLAUDE CODE — « Zone Rencontres » (v2, consolidé post-prescan)

Compte rendu de rencontres (comités, statutaires) : notes manuelles,
transcription micro, import Zoom/Teams/Meet, IA verbatim ou structurée,
classement par dossiers, envoi courriel — plus l'article de blog.

Ce document intègre les décisions prises après `PRESCAN-RENCONTRES.md`. Le
plan de vagues A→J et le périmètre exact des fichiers restent ceux du prescan
(§4 et §6). GO donné — lancer la vague A.

---

## 0. Environnement et discipline (non négociable)

1. **Worktree dédié `~/dev/zts-rencontres`** — une autre session travaille dans
   `~/dev/Remotion 2/wix-deploy/` (correctif des fuites du mur,
   `zts-lock-page.js`). Aucun code Rencontres dans le worktree principal :
   `git diff --stat` doit rester une preuve.
2. Commits atomiques, aucune suppression hors périmètre,
   `RENCONTRES-COMPLETE.md` à la fin.
3. Habillage purement additif : shell `ztsh` (fond marine + rayons), hôte
   `[data-zts-header]`, z-index du shell en 300-399, densité travail. Rejouer
   `_scripts/verifie-habillage.py` avant fusion.
4. Polices auto-hébergées `ZoneTotalSportZTSH` (`size-adjust:50%`) + Luckiest
   Guy. Aucun `<link>` Google Fonts.
5. App derrière le mur : `zts-gate.js` avant tout affichage. Ne PAS l'ajouter à
   `locked-whitelist.json`.
6. `dataStore.js` propre à l'app (patron par app, pas de fichier partagé) :
   créer `apps/rencontres/dataStore.js`, aucun appel Firestore codé en dur
   ailleurs.

---

## 1. Données — DÉCIDÉ

- Collection plate `rencontres/{id}` + champ `uid` (cohérent avec
  `performances`, `plans`, `inventaires`). Pas de sous-collection sous
  `users/{uid}` (refusée par les règles actuelles).
- Règles Firestore exigées :
  - `create` : `request.resource.data.uid == request.auth.uid`
  - `read`, `update`, `delete` : `resource.data.uid == request.auth.uid`
- **Déployer les règles depuis le worktree de la branche, jamais depuis
  `main`** (piège de juillet : `main` sans le bloc = anciennes règles
  republiées).
- Champs : titre, date, type (Comité/Statutaire/Autre), dossier,
  participants[], animateur, secrétaire, notesBrutes, transcription, sortieIA,
  actions[{quoi, qui, echeance, fait}], créé, modifié.

---

## 2. Emplacement et intégration

- Dossier : `apps/rencontres/`. App transversale : pas de `data-metier` sur
  `<body>`.
- **Menu** : une ligne dans `shared/zts-menu.js` (le mécanisme vivant ;
  `header.html` est mort, 0 chargeur). Entrée visible dans les 3 univers +
  Outils pédagogiques. Ne PAS toucher `METIERS[*].apps` (code mort,
  n'afficherait rien).
- **Accueil — DÉCIDÉ** : bande « Nouveautés » générique et sobre, une ligne,
  au-dessus des trois portes de `index.html`. Conçue réutilisable pour les
  prochaines apps (remplace la décision du 23 août qui écartait une section
  pour une seule app). Première entrée : Zone Rencontres. Clic → connecté :
  `/apps/rencontres/` ; anonyme : modale `ztsShowSignup` avec redirection
  post-auth vers l'app — invariant funnel
  `locked_view → locked_click_signup → signup_complete` et tracking GA4
  intacts.

---

## 3. Trois modes de capture

### A) Notes manuelles

- Éditeur simple : titres, listes, gras, cases à cocher. En-tête : titre, date,
  type, participants, animateur, secrétaire.
- Autosauvegarde locale (localStorage, ~10 s) + Firestore au blur/bouton. Un
  plantage ne perd jamais une rencontre. Notes manuelles fonctionnelles
  hors-ligne ; transcription = réseau requis (indicateur clair).

### B) Micro

- **Whisper est le chemin normal, pas un repli** : `webkitSpeechRecognition`
  n'existe ni sur Safari ni sur Firefox — sur Mac et iPhone, le mode B EST le
  mode C.
- **Interface adaptative — DÉCIDÉ** : détecter `webkitSpeechRecognition`.
  Présente → afficher « transcription en direct » (fr-CA, continuous,
  interimResults, texte à l'écran). Absente → afficher « transcription à la fin
  de l'enregistrement ». **Ne jamais parler de repli ou de limitation
  navigateur à l'utilisateur.**
- Dans tous les cas, MediaRecorder capte l'audio → transcription Whisper à
  l'arrêt (source de vérité).
- Boutons ▶ ⏸ ⏹, minuteur visible.
- Bandeau de consentement au premier enregistrement : « Assurez-vous d'informer
  les participants que la rencontre est enregistrée/transcrite. » (case
  « compris », mémorisée).

### C) Import Zoom / Teams / Google Meet

- Glisser-déposer `.mp3 .m4a .wav .mp4 .webm`.
- **Découpage côté navigateur — DÉCIDÉ, avec contrainte** : décoder puis
  rééchantillonner via `OfflineAudioContext` à **16 kHz mono AVANT
  segmentation** (règle la mémoire — 60 min stéréo 44,1 kHz peut dépasser 1 Go
  sur un portable d'école — et le poids d'upload). Segmenter (~5 min), envoyer
  les segments au worker qui n'orchestre que Whisper et recolle le texte dans
  l'ordre.
- Avertir l'utilisateur **au-delà de 90 minutes** détectées (durée + estimation
  avant lancement).
- Audio jamais stocké : transcrit puis jeté. Seul le texte vit dans Firestore.
  (R2 « garder 30 jours » = dette v2, documenter seulement.)

---

## 4. Worker et quotas — DÉCIDÉ

- Nouvelle route sur `api.zonetotalsport.ca`, modèle Workers AI Whisper
  (`@cf/openai/whisper` ou `whisper-large-v3-turbo` si dispo).
- Ajouter le binding Workers AI dans `wrangler.toml` — **les 3
  environnements**.
- **Quota en MINUTES d'audio, pas en requêtes** (sinon 90 min = 18 appels et un
  usager vide l'allocation du site). **Plafond quotidien par utilisateur,
  distinct de celui du générateur** — Rencontres ne doit jamais assécher le
  générateur ni l'inverse. Compteur KV, même mécanique.

---

## 5. Traitement IA (choix à chaque rencontre)

Via le worker IA existant (Haiku par défaut, toggle Sonnet) :

1. **Mot à mot** : verbatim nettoyé (ponctuation, paragraphes, hésitations
   retirées), aucune reformulation.
2. **Structuré** : Résumé (5-8 lignes) · Points discutés · Décisions prises ·
   Actions à faire (qui/quoi/échéance → cases à cocher) · Points reportés.
3. **« Résumer un point précis »** : sélection d'un passage → résumé de ce
   passage seul.

Résultat éditable avant classement/envoi ; l'original brut conservé en onglet.

---

## 6. Classement

- Dossiers **Comités** et **Statutaires** par défaut + création libre.
  Glisser-déposer entre dossiers ; renommer ; **supprimer un dossier = déplacer
  son contenu, jamais effacer des CR silencieusement**.
- Vue liste : tri par date, filtres dossier/type, recherche plein texte côté
  client (v1).

---

## 7. Envoi et export

- Courriel : destinataires (mémoriser les derniers), `mailto:` pré-rempli
  (sujet = titre + date). `mailto` tronque les longs corps → bouton jumeau
  « Copier le compte rendu ».
- **Export PDF — DÉCIDÉ** : reprendre le contournement local du patron
  `apps/inventaire/styles.css:912` (3 lignes dans la feuille de l'app, la page
  blanche à l'impression des 41 apps migrées). **Ne pas toucher au shell.**
  Plus export `.txt`/`.md` et `navigator.share` sur mobile.

---

## 8. `politique.html` — DÉCIDÉ

- Un paragraphe : audio transcrit puis détruit, texte stocké au compte de
  l'utilisateur seulement, responsabilité de l'utilisateur d'informer les
  participants.
- **Commit atomique séparé, annulable seul.** Même formulation reprise dans
  l'article de blog (§10.9).

---

## 9. Fonctions incluses v1 (validées)

1. Vue « Mes actions » : toutes les cases à cocher de toutes les rencontres,
   avec échéances.
2. Gabarits d'ordre du jour réutilisables (statutaire type, comité, rencontre
   parents…).
3. Chaînage des récurrentes : « créer la suite » recopie points reportés +
   actions non cochées.
4. Liste de présences cochable, réutilisable.
5. **Dette v2 (documenter, ne pas coder)** : rappels courriel via cron, audio R2
   30 jours, identification des locuteurs.

---

## 10. ARTICLE DE BLOG — format `catastrophes-ordinaires`

Ouvrir le fichier local `articles/catastrophes-ordinaires.html` et le prendre
comme **gabarit exact** : squelette HTML (head, meta, canonical, header,
`.article-body`, pied), ton, densité, encadrés/citations aux mêmes endroits
stratégiques, compteur `article_views`, demi-mur.

- Fichier : `articles/comptes-rendus-rencontres.html` (slug cohérent avec les
  existants). Carte dans `blog.html` + sitemap + canonical.
- **Un seul `.article-body` bien rempli** (leçons des fuites
  `un-jeu-trois-versions` / `50-jeunes-un-gymnase`). Bloc promo en
  `data-zts-toujours-visible` (promo seulement, jamais de contenu).
- H1 : « Les comptes rendus de rencontre sans y passer ta soirée ». Meta
  ~155 car. Mots-clés : compte rendu de réunion, procès-verbal, comité,
  rencontre statutaire, école, service de garde, camp de jour, transcription.
- Long et riche : **1500-2200 mots**, ton terrain, tutoiement ZTS, zéro jargon
  corporatif.

### Plan (11 sections)

1. **Accroche** — « Qui prend les notes ? » Silence. Le regard qui tombe sur
   toi. Tu écoutes à moitié, tu écris à moitié, tu rates les deux.
2. **Le vrai coût** — 60 min de rencontre = 45-90 min de retranscription ; un
   statutaire/semaine + un comité/mois ≈ 40-60 h par année scolaire ; coût
   caché : celui qui note ne participe pas, décisions floues qui reviennent
   trois rencontres plus tard.
3. **Les rencontres visées** — École : statutaires ÉPS, rencontres de cycle,
   comités (EHDAA, activités, cour d'école), direction, parents. SDG : réunions
   d'équipe, rencontres avec l'école, comités de parents. Camp : coordination,
   débriefs de semaine, pré-saison avec la municipalité.
4. **Trois façons de capturer** — à la main (autosauvegarde, rien ne se perd) ;
   au micro (l'ordi au centre de la table, tu participes) ; depuis
   Zoom/Teams/Meet (glisser l'enregistrement).
5. **Mot à mot ou structuré** — verbatim pour les PV officiels ; structuré
   (résumé, décisions, actions qui/quoi/quand, reportés) ; résumer un seul
   passage ; l'IA prépare, l'humain valide — toujours éditable.
6. **Classer, retrouver, chaîner** — dossiers, glisser-déposer, « c'était quand
   la décision sur les surveillances ? » en 10 secondes, « créer la suite » qui
   écrit l'ordre du jour du prochain statutaire tout seul.
7. **La vue « Mes actions » (argument massue)** — le compte rendu arrête d'être
   un document qu'on classe et oublie : c'est une liste qui te suit.
8. **Envoyer aux bonnes personnes** — courriel pré-rempli, copie un clic, PDF à
   joindre, partage mobile.
9. **Enregistrer les collègues : ce qu'il faut savoir** (section sérieuse) — on
   annonce l'enregistrement en début de rencontre, point ; rappel de
   consentement dans l'app ; audio transcrit puis détruit, texte dans TON compte
   (formulation identique à `politique.html`) ; rester « bonnes pratiques »,
   renvoyer aux politiques de l'employeur, ne pas jouer à l'avocat.
10. **Mini-FAQ** — iPad/iPhone ? (oui, transcription à la fin de
    l'enregistrement) · le québécois ? (oui, et ça s'édite) · durée de
    traitement ? (**mesurer au banc avant publication — aucun chiffre
    inventé**) · gratuit ? (compte ZTS requis, limite de minutes/jour dite
    honnêtement) · privé ? (visible par ton compte seulement).
11. **Conclusion + CTA** — « la prochaine fois que quelqu'un demande qui prend
    les notes, tu peux lever la main » → bouton vers `/apps/rencontres/`,
    funnel intact.

### Consignes

- Aucune promesse chiffrée non mesurée au banc.
- **Zéro apostrophe courbe ni guillemet français dans les titres rendus en
  police ZoneTotalSport** (glyphes absents du TTF).
- Commit de l'article séparé du code de l'app.
- Publication **après** la mise en prod de l'app.

---

## 11. Banc d'essai avant fusion

- `_scripts/verifie-habillage.py` PASS.
- Mic Chrome desktop (accents fr) · enregistrement sur navigateur sans
  `webkitSpeechRecognition` (libellé « à la fin », transcription Whisper OK) ·
  import m4a 60 min → 16 kHz mono → segments → texte recollé dans l'ordre ·
  avertissement >90 min · quota minutes décompté, plafond distinct du
  générateur · glisser-déposer entre dossiers · mailto + copie · export PDF non
  blanc · parcours anonyme : bande Nouveautés → signup → retour app, événements
  GA4 présents · règles Firestore : lecture croisée entre deux uid refusée ·
  console vide.
- `git diff --stat` limité au périmètre du §6 du prescan.
