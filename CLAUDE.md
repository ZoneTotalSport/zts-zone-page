# Contexte du projet — Zone Total Sport

## Emplacement du dépôt
- **Chemin de travail** : `~/dev/Remotion 2/wix-deploy/`
- **Déplacé du Bureau le 29 juillet 2026.** Le Bureau est synchronisé par
  iCloud, qui a fait disparaître le dossier de travail une minute pendant une
  opération. `git fsck` a d'ailleurs trouvé 82 fichiers parasites dans
  `.git/objects/` — des doublons « … 2 » et des `tmp_obj_*` laissés par la
  synchronisation. Nettoyés le 29 juillet, dépôt intègre.
- **Ne jamais remettre un dépôt git sous iCloud** : la synchronisation duplique
  et verrouille des fichiers de `.git/` pendant que git écrit dedans.

## Identité
- **Site** : zonetotalsport.ca
- **Mission** : plateforme 100% gratuite de ressources ÉPS / Camps de jour / Service de garde
- **Stack** : GitHub Pages + Cloudflare + Firebase + Firestore
- **Style visuel** : Pop Art bûcheron — Patrick Hand, Schoolbell, Ben-Day dots, bleu-violet, offset shadows, dashed borders
- **Mascotte** : Mr. Root (bûcheron sportif)

## Design — boutons (décision verrouillée 2026-07-05)
- **`.zts-action`** (shared/zts.css) = standard **OBLIGATOIRE pour tout nouveau bouton
  d'action** : rectangle courbé (border 3px #111, radius 10px), ombre BD décalée
  `4px 4px 0 #111`, Bangers, hover `translate(-2px,-2px)` / active `translate(2px,2px)`.
  Variantes de fond : `.zts-action--camps` (#FF6B00, texte blanc), `.zts-action--eps`
  (#00E5FF, texte #111), `.zts-action--sdg` (#39FF14, texte #111), `.zts-action--neutre`
  (blanc, texte #111). Bangers doit être chargée par la page (Google Fonts).
- **`.zts-btn`** = legacy du header partagé (1489 pages), **GELÉ** : ne pas modifier,
  ne pas réutiliser dans du nouveau code. Migration prévue au chantier harmonisation.
- Les **pilules `border-radius:999px` sont dépréciées** pour les boutons d'action.

## Firebase — règles Firestore (source de vérité)
- **`firestore.rules` du repo = source de vérité UNIQUE** (projet `zone-total-sport`).
- Tout déploiement de règles passe par un **commit d'abord**.
- **Jamais de modification via console sans rapatriement immédiat** dans le repo.
- Rapatriement du 5 juil 2026 (`f88abfa`) : repo aligné sur le ruleset actif du 2 juil
  (bloc `budget/*` + slice semaines/messages/évaluations déjà commité les 23-26 juin).

## Audience
Trois corps de métier visés équitablement :
1. **ÉPS** — Enseignants éducation physique primaire (Québec, alignement PFEQ)
2. **Camps** — Animateurs de camps de jour
3. **SDG** — Éducatrices de service de garde

## Architecture cible (post-refonte)
9 piliers principaux :
- /generateur (IA — jeux/SAÉ/éducatifs)
- /bibliotheque (jeux + SAÉ + éducatifs unifiés)
- /planificateur (année + cycle)
- /zonegym (PWA temps-réel)
- /scoreboard
- /tni
- /carnet
- /maternelle (aimant email)
- 3 vues univers : /eps, /camps, /sdg

## Règles d'or
1. Une seule action principale par écran (pas de pop-ups concurrents)
2. Vocabulaire unifié — plus jamais "boîte à outils" en 4 endroits différents
3. Toute ancienne URL = redirection 301 (jamais 404)
4. Style Pop Art bûcheron cohérent partout
5. PWA hors-ligne quand pertinent

## Workflow Joey
- Stratégie sur claude.ai (Opus)
- Exécution avec Claude Code en terminal
- Plan de refonte détaillé dans zts-refonte-sequencage.md

## Apps satellites (dossiers séparés sur le Mac)
Les apps individuelles vivent dans ~/PROJETS_CLAUDE/. À terme, plusieurs seront 
fusionnées (voir zts-refonte-sequencage.md, Fusions #1 à #4).

## Repos GitHub liés au projet
- **zts-zone-page** (CE REPO) = le site live zonetotalsport.ca (GitHub Pages actif)
- **zonetotalsport.ca** = ancien repo SPA, désactivé, conservé pour référence future. 
  Aucun déploiement actif. Code potentiellement réutilisable pour Fusion #2.

## Livraisons
### Phase 1 — Cohérence du site (livrée le 2026-06-12)
- 9 commits fusionnés en fast-forward dans `main` et poussés (origin/main @ `ddf6f4e`).
- Contenu : compteurs réels (1439 jeux / 1790 SAÉ + count-up), '1400+ jeux' / '1700+ SAÉ'
  standardisés, météo dynamique #menuJour, date du jour robuste, preuve sociale '300+'
  unifiée, accents/emoji corrigés, toggle calendrier Jour/Semaine/Mois du planificateur.
- Vérifié en prod : '1400+ jeux' visible sur la home après rebuild GitHub Pages.
- ✅ Worker `zts-notify` (handler `/robots.txt`, commit `b86d637`) : **déployé via wrangler
  CLI le 2026-06-12** (version `a3b2dc01`). `notify.zonetotalsport.ca/robots.txt` renvoie
  désormais un robots.txt valide avec `User-agent: * / Disallow: /` — l'ancienne ligne
  invalide `OK` (erreur critique GSC) a disparu.
- ⚠️ Cloudflare sert un **robots.txt managé** sur la zone (« Managed content », bloc
  content-signals + Disallow anti-bots IA) qui se **préfixe** à la réponse du Worker. Résultat
  valide mais avec deux groupes `User-agent: *` (managé `Allow:/` puis worker `Disallow:/`).
  Pour un `Disallow:/` propre et unique : désactiver le robots.txt managé sur la zone (optionnel).
- Branche `fix/phase1-coherence` supprimée (fusionnée, jamais poussée sur le remote).

## État des branches (2026-06-12)
- `main` = production, synchro avec origin.
- `feat/i18n-apps` : **-28 commits / +1** vs origin/main → diverge fortement.
  **À traiter isolément** (rebase/merge dédié), ne pas laisser dériver davantage.
- `v2-merge` : -56 commits, branche morte conservée pour référence.
- `feat/biblio-camp-seed` (+2), `feat/planif-cal-unifie` (+1) : chantiers en attente.

## Dette technique
- **Aucun pre-commit hook réel installé** (`.git/hooks/pre-commit` absent). Le scan de
  secrets est manuel pour l'instant — mettre en place un hook (ex. gitleaks) plus tard.
- **Toolchain Node installé le 2026-06-12** : Node v24.16.0 + npm + wrangler 4.100.0 sous
  `~/.local/node` (espace utilisateur, sans sudo/Homebrew). `wrangler login` OAuth fonctionnel
  (compte `zts@hotmail.ca`). Les workers `cf-worker/*` sont désormais déployables en CLI :
  `export PATH="$HOME/.local/node/bin:$PATH"` puis `wrangler deploy` depuis le dossier du worker.
  Le `~/.local/node/bin` n'est pas encore dans le PATH du shell par défaut (à ajouter au `~/.zshrc`).
- Dossier `cf-worker/notif-stats/` non-suivi (non commité) — à inspecter au prochain sprint.
