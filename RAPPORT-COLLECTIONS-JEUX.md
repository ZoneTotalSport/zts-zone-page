# RAPPORT-COLLECTIONS-JEUX — vague 2, PR A

> Généré par `_scripts/extrait-collections-jeux.js` le 2026-09-02.
> Relançable : même entrée, même sortie.

## Décompte

| | |
|---|---|
| Items extraits des 14 apps | **113** |
| Doublons du catalogue | **19** |
| Inédits ajoutés au catalogue | **94** |
| Catalogue | 1439 → **1533** jeux |
| Jeux portant au moins une collection | **111** |

## Par collection

| Collection | Extraits | Doublons | Inédits | Jeux étiquetés |
|---|---|---|---|---|
| 🎭 Jeux par thème | 8 | 1 | 7 | **8** |
| ⚡ Jeux rapides | 10 | 4 | 6 | **10** |
| 🧘 Jeux calmes | 8 | 0 | 8 | **8** |
| ⏳ Activités par durée | 9 | 0 | 9 | **9** |
| 🔥 Échauffements | 8 | 1 | 7 | **8** |
| 🧩 Énigmes & devinettes | 10 | 1 | 9 | **9** |
| ⛅ Plan B météo | 8 | 1 | 7 | **8** |
| 🌧️ Plan B jours de pluie | 8 | 0 | 8 | **8** |
| 😄 Brise-glace | 8 | 1 | 7 | **8** |
| 🏴 Grands jeux | 8 | 3 | 5 | **8** |
| 💦 Jeux d'eau | 8 | 0 | 8 | **8** |
| 🗺️ Rallyes & chasses au trésor | 4 | 0 | 4 | **4** |
| 🔥 Veillée & feu de camp | 8 | 1 | 7 | **8** |
| 🥇 Olympiades scolaires | 8 | 6 | 2 | **8** |

## ⚠ Ce que ces chiffres veulent dire pour la PR B

Une collection compte **entre 4 et 10 jeux**, sur un catalogue de 1533.
C'est le contenu réel des mini-apps, ni plus ni moins : l'étiquette n'est posée
que sur ce que la source contenait vraiment — les inédits, et les jeux du
catalogue que ses doublons désignaient. **Rien n'a été étiqueté au jugé.**

Une rangée de 8 jeux, c'est une rangée honnête, pas une rangée vide. Mais si la
PR B les présente comme « la » collection de jeux calmes du site, elle promet
plus que ce qu'il y a derrière — alors que le catalogue contient sûrement des
dizaines d'autres jeux calmes, simplement jamais étiquetés comme tels.

Deux sorties, et c'est un choix de Joey, pas du script :

1. **Garder tel quel** — la collection est une sélection, courte et assumée.
2. **Élargir par règle** — poser aussi l'étiquette selon un critère du catalogue
   (durée courte → jeux rapides, catégorie → grands jeux…). Déterministe, mais
   c'est une règle par collection, à écrire et à arbitrer une par une.


## Doublons écartés

> L'item extrait n'entre pas au catalogue. Le jeu qu'il désigne reçoit
> l'étiquette de la collection : il en fait bien partie.

### Jeux par thème — 1

| Item extrait | ≈ Jeu du catalogue | id | Règle |
|---|---|---|---|
| La queue du dragon | Attraper la queue du dragon | `AAO_005` | inclusion de titre (0.79) |

### Jeux rapides — 4

| Item extrait | ≈ Jeu du catalogue | id | Règle |
|---|---|---|---|
| Statues musicales | STATUES MUSICALES COOPÉRATIVES | `pfeq_122` | inclusion de titre (0.75) |
| Le nœud humain | LE NŒUD HUMAIN | `pfeq_120` | titre identique (1) |
| Salade de fruits | La Salade de Fruits | `PRESC_030` | ratio >= 0.90 (0.93) |
| Le miroir | Le Miroir | `COOP_002` | titre identique (1) |

### Échauffements — 1

| Item extrait | ≈ Jeu du catalogue | id | Règle |
|---|---|---|---|
| Hélicoptères | HÉLICOPTÈRES (HELICOPTERS) | `pfeq_411` | ratio >= 0.84 + mot « helicopteres » (0.88) |

### Énigmes & devinettes — 1

| Item extrait | ≈ Jeu du catalogue | id | Règle |
|---|---|---|---|
| Devinette du gym | Devinette du gym | `COLL_enigmes_03` | titre identique (1) |

### Plan B météo — 1

| Item extrait | ≈ Jeu du catalogue | id | Règle |
|---|---|---|---|
| Yoga des animaux | Le Yoga des Animaux | `PRESC_011` | ratio >= 0.90 (0.91) |

### Brise-glace — 1

| Item extrait | ≈ Jeu du catalogue | id | Règle |
|---|---|---|---|
| Le nœud humain | LE NŒUD HUMAIN | `pfeq_120` | titre identique (1) |

### Grands jeux — 3

| Item extrait | ≈ Jeu du catalogue | id | Règle |
|---|---|---|---|
| Capture du drapeau | Capture du drapeau 4 bases | `MO1_010` | inclusion de titre (0.81) |
| Poule, renard, vipère | POULE-RENARD-VIPÈRE AVEC BALLON | `pfeq_187` | inclusion de titre (0.76) |
| Le volcan | LE VOLCAN | `pfeq_146` | titre identique (1) |

### Veillée & feu de camp — 1

| Item extrait | ≈ Jeu du catalogue | id | Règle |
|---|---|---|---|
| Téléphone arabe | LE TÉLÉPHONE ARABE PHYSIQUE | `pfeq_145` | inclusion de titre (0.78) |

### Olympiades scolaires — 6

| Item extrait | ≈ Jeu du catalogue | id | Règle |
|---|---|---|---|
| Saut en longueur | Grand Saut en Longueur | `OLYM_002` | inclusion de titre (0.83) |
| Lancer de précision | Kolap (Lancer de précision polynésien) | `AAO_056` | inclusion de titre (0.73) |
| Course en sac | Le Carreras de Sacos (Course en sac — Amérique du Sud) | `AM-EU-042` | inclusion de titre (0.49) |
| Saut en hauteur (élastique) | Saut en hauteur | `IND_005` | inclusion de titre (0.73) |
| Lancer dans le cerceau | Le Lancé dans le Cerceau | `PRESC_024` | ratio >= 0.90 (0.97) |
| Tir à la corde | Kéo Co (Tir à la corde vietnamien) | `AAO_050` | inclusion de titre (0.63) |

