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

## Ce qui a été RETIRÉ — cinq redondances, zéro fonction perdue

Joey trouvait l'app encore difficile à comprendre et m'a autorisé à retirer
les doublons. Cinq écrans ont disparu, aucune fonction avec :

| Retiré | Pourquoi ce n'était qu'un doublon |
|---|---|
| **Semaine** | L'accueil est la MÊME grille période × jour. Ses colonnes « Gr: » et « # cours » répétaient le contexte : la barre jaune dit déjà dans quel groupe on écrit, et chaque en-tête de jour porte son jour-cycle. |
| **Fiche de cours** | Trois blocs à remplir, alors que MA JOURNÉE en a déjà, avec les médias et les minuteries en plus. Son en-tête (Cours · cycles · début · durée) a migré en tête de MA JOURNÉE. |
| **Noter** | Une zone de texte libre — exactement le journal de bord de MES GROUPES, qui lui est daté et rattaché au groupe. |
| **Plan B** | Trois boutons qui ouvraient le tiroir des jeux avec un filtre. Le filtre est maintenant un bouton **dans** le tiroir. |
| **Cahier › Ma semaine** | L'accueil EST l'agenda de la semaine. Deux écrans pour la même vue. |

**L'écran ÉVALUATION** empilait aussi deux grilles sur les mêmes élèves —
les 3 compétences et les critères fins. Une bascule, une seule grille à la fois.

**22 écrans → 18. La barre : 7 portes, dont 4 en accès direct** — Ma semaine ·
Ma journée · Présences · Mon cahier, les quatre gestes d'une journée. Le reste
est rangé sous Évaluer · Calendrier · Plus.

## Le cahier de consignation — ce qui relie tout

**Une clé commune : le jour + le groupe.** La barre jaune du haut la montre en
permanence (« jeudi 27 août · j'écris dans 5A ») et la change. Tout ce qui
appartient à une séance se range dessous : présences, cotes, tests, blocs de la
journée, étoiles, banc de retrait.

L'écran **MON CAHIER** ne recopie rien — il **relit** cette clé et présente la
page du jour, réglure et marge comprises : ce que j'ai fait · qui était là ·
ce que j'ai noté · les tests · mon mot du jour. Chaque section a un bouton qui
ouvre l'écran d'où vient l'information. Une vue **MA SEMAINE** montre les cinq
jours d'un coup.

Conséquence directe : évaluer un groupe le range **à la bonne date et au bon
groupe**, sans rien ressaisir. Changer de jour ou de groupe change la page ;
revenir la retrouve intacte.

Une journée neuve démarre **vide**, avec une invitation — les blocs d'exemple ne
sont posés qu'une seule fois, à la toute première ouverture.

## La barre du haut — 6 portes, pas 21 boutons

Les écrans sont groupés par **ce qu'on y cherche** : Ma classe · Mon calendrier ·
Évaluer · Mes outils · Réglages, plus Accueil et Mon cahier en accès direct.
Chaque entrée porte son explication en une ligne. **Aucun écran n'est
injoignable** — vérifié à la recette.

Ce n'est pas le retour du bouton PLUS : l'accueil montre toujours toutes les
tuiles en toutes lettres.

## Quatre polices, et pas une de plus

| Police | Rôle |
|---|---|
| `ZoneTotalSport.ttf` | la marque et les titres de page |
| `LuckiestGuy` | titres de section, boutons, étiquettes |
| `IndieFlower` | **ce que l'utilisateur écrit** — tous les champs, et le cahier |
| `AnnieUseYourTelescope` | les notes et les phrases d'aide |

Le corps de texte prend la pile système : aucune police de corps n'est
auto-hébergée, c'est la doctrine « zéro Google Fonts » du site. Bangers et
Quicksand ont été retirées à la demande de Joey.

Poser la manuscrite sur les champs a un effet utile au-delà du décor : on
distingue d'un coup d'œil **ce que l'app affiche** de **ce que le prof a
inscrit**.

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
| 13 | **Présences** | **Grosse photo, petit nom** — on reconnaît l'enfant au visage, pas au texte. Tap : attendu → présent → départ ; appui long = absent. **Parti ou absent, la photo ET le nom passent en noir et blanc.** Jour et heure de départ, « porté par » à l'arrivée, « parti avec » au départ avec garde hors-liste, humeur, message au parent, particularités, rapport à envoyer. |
| 14-16 | Plan B · Noter · Réglages | inchangés. |

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

## Les présences sont PORTÉES de l'app, pas inventées

L'écran reprend le modèle de `apps/planificateur/app.js` (`renderPresenceCard`,
`openDepartModal`) : statuts `attendu / present / parti / absent`, `heureArrivee`,
`heureDepart`, `arriveAvec`, `partiAvec`, `horsListe`, humeur de fin de journée,
message au parent, personnes autorisées, particularités. **Rien n'a été
simplifié au passage** — la première version du proto montrait un écran réduit
à 18 boutons vert/rouge, ce qui était une lacune de la maquette, pas une perte
dans l'app.

Ce qui n'y est pas : les photos réelles des enfants (le proto dessine une
pastille à initiales, qui se décolore comme une vraie photo) et l'envoi vers le
coordonnateur — ici le rapport est **copié dans le presse-papier**, rien ne part
sur le réseau.

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

## Composer la planification — 28 août

La planification n'est plus une liste figée : on choisit **ce qu'il y a
dedans**. Chaque étape porte une **pièce** (`PIECES`, dans `proto-seance.js`) —
`libre` est l'activité qu'on écrit soi-même, les six autres branchent l'étape
sur une porte de la séance.

Trois gestes, tous équivalents :

1. **Glisser** une pièce de la palette dans une phase (ARRIVÉE · PENDANT · FIN).
2. **Cocher** sa case sur la tuile de la porte, en haut du panneau ; **décocher**
   la retire — c'est la demande de Joey mot pour mot.
3. **Toucher** la pièce puis la phase, pour qui n'a pas de souris.

Les étapes se **glissent entre elles** pour changer d'ordre ou de phase. Toucher
une étape branchée ouvre sa porte ; son ✎ ouvre son titre, sa durée, ses images.
Une durée écrite sur la pièce **LE TEMPS** est celle que la minuterie prend
quand on la touche.

⚠ Les clés de `PIECES` sont **exactement** celles de `volet()`. `tests` est la
seule exception : ce n'est pas un volet mais l'écran `e-tests`. Renommer une clé
casse `ouvrirPiece()` sans un mot dans la console.

## L'en-tête de la séance — sa couleur, sa photo

Le bandeau de la séance porte les huit couleurs du groupe et un emplacement de
photo : on y **lâche une image** (l'enseignant·e, le groupe) et le ballon
disparaît. La même chose se lâche sur une pastille de la palette.

⚠ La couleur et la photo appartiennent au **groupe**, pas à la séance : posées
ici, elles changent aussi dans la palette et dans les cases de l'agenda. C'est
le but — reconnaître un groupe à un visage plutôt qu'à un ballon générique.

## Le portrait du groupe, les notes d'élèves et les suivis — 28 août

**Une 8ᵉ porte : 📔 PORTRAIT DU GROUPE.** Elle réunit tout ce qui a été
consigné pour ce groupe, toutes dates confondues — absences, oublis de linge,
cotes sous le maximum, mots de cours, notes d'élèves — plus le fil des périodes.

⚠ **Rien ne se saisit dans le portrait.** Il relit les séances déjà écrites et
les recompose. Ne pas le confondre avec le **dossier de MES GROUPES**, où le
prof saisit à la main des absences et des incidents : là-bas c'est de la
saisie, ici c'est du cumul. Les deux se complètent.

**Noter un élève** : le ✎ sur sa carte, dans PRÉSENCES (ou « ✎ NOTER » dans le
portrait). Une note par élève et par période — c'est le geste réel de quelqu'un
qui voit six groupes par jour. La note porte une case **⚑ à suivre**.

**Le suivi remonte tout seul.** Une note marquée « à suivre » s'affiche en tête
de **la prochaine séance de ce groupe** — pas de la période suivante dans la
journée : un prof d'ÉPS revoit 101 deux jours plus tard, c'est là que le rappel
sert. Le drapeau reste levé, séance après séance, jusqu'au ✔ RÉGLÉ. La note,
elle, reste au portrait pour toujours.

## Deux signaux distincts sur une porte, à ne pas confondre

| | Ce que ça veut dire | Effet |
|---|---|---|
| **☑ la case** (coin haut) | cette fonction est **dans la planification** | décocher la retire de la planification |
| **✕ le bouton rose** (coin bas) | cette fonction a **consigné quelque chose** ici | l'effacer jette ces données, la case ne bouge pas |

On peut vouloir garder les présences dans son cours **et** effacer celles
d'hier. C'est pour ça qu'il y a deux gestes.

**La couleur d'une porte ne dit qu'une chose** : cochée → cyan pâle ; pas
cochée → blanc. Le vert de « cette fonction a des données » a été neutralisé,
il brouillait le message ; cette information se lit désormais au ✕.

## L'évaluation ne colore rien d'avance

Une case d'échelle reste **vierge tant qu'on n'a pas cliqué**. La règle « tout
le monde part au maximum » reste vraie pour LIRE une cote absente — elle ne se
peint simplement plus.

⚠ Conséquence directe : **le maximum s'enregistre lui aussi** maintenant, sinon
un clic sur ++ n'aurait jamais de couleur. Compter les clés de `s.notes` compte
donc les élèves qui vont très bien. Ce qui est **sous** le maximum se compte
avec `cotesSousMax()` (`proto-portrait.js`). Un second clic sur le même palier
efface la cote.

## L'évaluation en une seule case — 28 août

Cinq boutons par élève **et** par critère débordaient de l'écran. Il n'en reste
**qu'un**, qui tourne d'un cran par clic :

```
vierge → ++ → + → +/- → - → -- → vierge
```

Chaque cran porte sa couleur. **Clic droit : on recule d'un cran** — sans lui,
revenir de « -- » à « ++ » obligerait à refaire tout le tour.

⚠ **Une légende est obligatoire au-dessus de la grille.** Une case vierge ne
raconte rien : sans la légende, personne ne devine qu'un deuxième clic donne
« + ». Elle se construit à partir de `facon().v`, donc elle suit le réglage
d'échelle et le nombre de niveaux.

## Personnaliser les critères

- **Un critère à moi** s'écrit directement au-dessus de la grille (Entrée ou
  « + AJOUTER »). Il est stocké `moi|<texte>` et son en-tête est **cliquable
  pour le renommer**, en pointillé.
- **Le ✕ d'un en-tête** retire la colonne et ses cotes.
- ⚠ **« ✎ CHANGER CE QUE J'ÉVALUE » vidait `evalCrits` avant d'ouvrir** : il
  fallait perdre sa grille pour avoir le droit de la retoucher. Il ouvre
  maintenant `choisirCriteres()`, qui recharge la liste existante.

⚠ **La clé d'une cote est `<élève>|<critère>` et le critère contient lui-même
des « | »** (`moi|texte`, `agir|10`, `1|2|3`). On coupe donc au **premier** `|`
seulement — partout où l'on retrouve les cotes d'une colonne.
