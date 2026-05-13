# Contexte du projet — Zone Total Sport

## Identité
- **Site** : zonetotalsport.ca
- **Mission** : plateforme 100% gratuite de ressources ÉPS / Camps de jour / Service de garde
- **Stack** : GitHub Pages + Cloudflare + Firebase + Firestore
- **Style visuel** : Pop Art bûcheron — Patrick Hand, Schoolbell, Ben-Day dots, bleu-violet, offset shadows, dashed borders
- **Mascotte** : Mr. Root (bûcheron sportif)

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
