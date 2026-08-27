# Proto G2 — Planificateur « simplicité »

Maquette de **validation visuelle**, pas du code de production. Rien n'est
branché sur Firestore : toute la saisie vit en `localStorage`, sous le préfixe
`protog2:`, et se jette d'un clic (bouton « Vider ma saisie » en haut à droite).

## Ouvrir

Servir la **racine du dépôt** (le proto appelle `/fonts/` et `/perso-*.png`),
puis ouvrir `/apps/planificateur/proto/`.

```
python3 -m http.server 8788
# → http://localhost:8788/apps/planificateur/proto/
```

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
| 13-16 | Présences · Plan B · Noter · Réglages | inchangés. |

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
