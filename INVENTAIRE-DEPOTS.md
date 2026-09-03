# Inventaire des dépôts ZTS

**Dernière MAJ :** 2026-09-02

Où vit quoi, sur les deux Macs. Les chemins sont donnés en relatif à `~` —
Mac A est `/Users/admin`, Mac B est `/Users/zonetotalsport`.

## Dépôts

| Dépôt | Chemin local | GitHub | Visibilité | Rôle | Assets hors Git |
|---|---|---|---|---|---|
| **zts-zone-page** | `~/dev/Remotion 2/wix-deploy` (+ 9 worktrees `~/dev/zts-*`) | `ZoneTotalSport/zts-zone-page` | public | Le site et ses ~40 apps | images de fiches dans R2 (`img.zonetotalsport.ca`) |
| **BOS** | `~/dev/BOS` | `ZoneTotalSport/BOS` | privé | Business Operating System — état vivant du business (`Core/`), 10 skills. Fork de `yomidenzel/BOS` (MIT). | 3,9 Go → Drive `ZTS-Assets/BOS-Output/` |
| **remotion-videos** | `~/dev/remotion-videos` | `ZoneTotalSport/remotion-videos` | privé | Projet Remotion — 8 compositions vidéo | 115 Mo → Drive `ZTS-Assets/Remotion2/public-gros-fichiers/` |
| **banque-enfants** | `~/dev/banque-enfants` | `ZoneTotalSport/banque-enfants` | privé | PWA familiale « La Banque ». Chantier actif. | — |
| **zts-labo** | `~/dev/zts-labo` | `ZoneTotalSport/zts-labo` | privé | Fourre-tout : 10 mini-projets au statut **inconnu** + `_notes-remotion2/` | 25 Mo → Drive `ZTS-Assets/Remotion2/cours-maternelle-app-assets/` |
| **repertoire-jeux-eps** | `~/dev/Remotion 2/repertoire-jeux-eps` | `ZoneTotalSport/repertoire-jeux-eps` | public | 8,7 Go sur disque | — |
| **scoreboard-basketball** | `~/dev/Remotion 2/scoreboard-basketball` | `ZoneTotalSport/scoreboard-basketball` | privé | Tableau de pointage | — |
| **cap-prochain-voyage** | `~/dev/Remotion 2/cap-natashquan` | `ZoneTotalSport/cap-prochain-voyage` | privé | App voyage skoolie | — |
| **zts-subscriber-count** | `~/dev/Remotion 2/zone-subscribers` | `ZoneTotalSport/zts-subscriber-count` | privé | Compteur d'abonnés | — |
| **gym-transitions** | `~/dev/Remotion 2/gym-transitions` | `ZoneTotalSport/gym-transitions` | public | Transitions de gymnase | — |

Les autres dépôts `ZoneTotalSport/*` (app-jeux, app-sae, app-agenda…) n'ont pas
de clone permanent sur ces deux Macs.

## ⚠ Dossiers qui ne sont PAS des dépôts

| Chemin | Quoi |
|---|---|
| **`~/dev/Remotion 2/`** | **Dossier de clones, pas un dépôt.** Aucun `.git` à sa racine — **ne jamais y faire de `git init`**. Il ne contient plus que les 6 clones listés ci-dessus. Vidé le 2026-09-02 : son contenu propre est parti dans `remotion-videos`, `banque-enfants`, `zts-labo` et sur le Drive. |
| **`~/prive-zts/`** | **Données personnelles, hors de tout Git** (mode 700). Listes d'abonnés (349 adresses courriel) et un export Firebase Auth avec empreintes de mots de passe. Ne jamais versionner ni téléverser. |
| `~/Desktop/A-METTRE-DANS-DRIVE/` | Sas vers Google Drive `ZTS-Assets/`. Se vide à la main, puis se supprime. |
| `~/.claude/skills/bos-*` | 4 skills dérivés de `BOS`, hors Git. Se transportent par AirDrop — voir `BOS/SYNC-MAC-B.md`. |

## Dépendances npm

Depuis la PR #71, ce dépôt a un `package.json` à la racine pour les scripts
locaux (`scripts/gen-images-promo.mjs`, `gen-images-inventaire.mjs`) :
`@google/genai` et `sharp`. **`npm install` est à refaire dans chaque worktree**
qui utilise ces scripts, une fois `main` fusionné dans sa branche.

`node_modules/` est ignoré à la racine depuis la même PR — la règle n'existait
avant que pour `cf-worker/` et `apps/decodage/src/`.

La clé Gemini se lit dans `process.env.GEMINI_API_KEY` ; elle vit dans `.env`,
qui est ignoré et **ne se synchronise pas par Git** (AirDrop entre les Macs).

## Mac B — mise en place

```bash
git clone git@github.com:ZoneTotalSport/zts-zone-page.git      ~/dev/zts-zone-page
git clone git@github.com:ZoneTotalSport/BOS.git                ~/dev/BOS
git clone git@github.com:ZoneTotalSport/remotion-videos.git    ~/dev/remotion-videos
git clone git@github.com:ZoneTotalSport/banque-enfants.git     ~/dev/banque-enfants
git clone git@github.com:ZoneTotalSport/zts-labo.git           ~/dev/zts-labo
```

Puis : `npm install` dans `zts-zone-page` et `remotion-videos`, restauration de
`remotion-videos/public/` depuis le Drive (voir son `public/LISEZ-MOI.md`), et
les skills `bos-*` par AirDrop (voir `BOS/SYNC-MAC-B.md`).
