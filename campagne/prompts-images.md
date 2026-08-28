# Les 32 prompts d'images promo
**Source machine : `_data/prompts-promo-social.json`.** C'est ce fichier-là que lit
le script — celui-ci est sa version lisible. **Modifier le JSON, pas ce document**,
sinon les deux divergent en silence.
**27 carrés** (1080×1080) + **5 stories** (1080×1920) = **32 images**.
Sortie : `promo/<slug>-carre.webp` et `promo/<slug>-story.webp`.
---

## Comment les générer
```bash
export GEMINI_API_KEY=...        # requis sauf en essai à blanc
npm i @google/genai sharp
```
Depuis **la racine du dépôt** :
| Commande | Effet |
|---|---|
| `node scripts/gen-images-promo.mjs --seches --lot1` | affiche le plan, n'appelle rien |
| `node scripts/gen-images-promo.mjs` | **une seule image**, puis arrêt pour validation |
| `node scripts/gen-images-promo.mjs --lot1` | les **14 prioritaires** (9 carrés + 5 stories) |
| `node scripts/gen-images-promo.mjs --slug=color-run` | une image précise |
| `node scripts/gen-images-promo.mjs --tout` | les 32 |
| `--force` | régénère même si le fichier existe |

> **Ne pas lancer `--tout` avant d'avoir validé la première.** Le script s'arrête
> volontairement après une image : ouvre-la et vérifie les trois règles de la série —
> photoréaliste, **aucun texte**, **aucune mascotte**. Il est idempotent et reprenable :
> une image déjà présente est sautée, un échec n'arrête pas le lot.

**Ordre conseillé pour mardi** : `--lot1` couvre les 4 premières semaines de
publication et les 5 stories. Le lot 2 attend la lecture de fin septembre.

---

## LOT 1 — les 14 prioritaires (à générer avant mardi)

Règle du lot : les **3 appâts SEO libres à 100 %** + les 2 meilleurs articles par univers.

### 01 — `faire-bouger-enfants` · carre 1080x1080
**Faire bouger les enfants au primaire : 10 leviers**  
Univers : ÉPS, service de garde  ·  ★ **appât SEO**  
Fichier : `promo/faire-bouger-enfants-carre.webp`  ·  [article](https://zonetotalsport.ca/articles/faire-bouger-enfants.html)

> Un groupe d'élèves du primaire en pleine course dans un corridor d'école transformé en parcours actif, cônes et marelle collée au sol, un enseignant d'éducation physique en survêtement qui pointe la prochaine station; mouvement flou léger sur les jambes, énergie de milieu de journée. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

### 02 — `comportements-perturbateurs` · carre 1080x1080
**Comportements perturbateurs en EPS : que faire ?**  
Univers : ÉPS  ·  ★ **appât SEO**  
Fichier : `promo/comportements-perturbateurs-carre.webp`  ·  [article](https://zonetotalsport.ca/articles/comportements-perturbateurs.html)

> Dans un gymnase d'école, un enseignant d'éducation physique accroupi à hauteur d'un élève un peu à l'écart du groupe, main calme sur le genou, pendant que le reste de la classe attend assise en demi-cercle au fond; lumière de fenêtres hautes, ambiance de désamorçage plutôt que de sanction. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

### 03 — `catastrophes-ordinaires` · carre 1080x1080
**Vomi, guêpes et alarme de feu : le guide des catastrophes ordinaires**  
Univers : ÉPS, camp de jour, service de garde  ·  ★ **appât SEO**  
Fichier : `promo/catastrophes-ordinaires-carre.webp`  ·  [article](https://zonetotalsport.ca/articles/catastrophes-ordinaires.html)

> Couloir d'école pendant une évacuation improvisée : un éducateur guide une file d'enfants en maillot enroulés dans des serviettes vers la sortie, seau et cônes de signalisation au sol derrière eux; scène réaliste, légèrement chaotique mais maîtrisée. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

### 04 — `grands-jeux-exterieurs-camp-de-jour` · carre 1080x1080
**20 grands jeux extérieurs pour camp de jour**  
Univers : camp de jour  
Fichier : `promo/grands-jeux-exterieurs-camp-de-jour-carre.webp`  ·  [article](https://zonetotalsport.ca/articles/grands-jeux-exterieurs-camp-de-jour.html)

> Grand jeu extérieur de camp de jour en plein soleil : une trentaine d'enfants en dossards de couleur courent vers un drapeau planté au centre d'un terrain gazonné, animateurs en t-shirt de camp qui arbitrent en périphérie, ballons et cerceaux éparpillés. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

### 05 — `un-jeu-trois-versions` · carre 1080x1080
**Jeux inclusifs : un seul jeu, trois versions**  
Univers : service de garde, ÉPS, camp de jour  
Fichier : `promo/un-jeu-trois-versions-carre.webp`  ·  [article](https://zonetotalsport.ca/articles/un-jeu-trois-versions.html)

> Jeu de ballon dans un gymnase où trois enfants jouent le même jeu avec des règles différentes : un enfant en fauteuil roulant sport au cœur de l'action, un autre dans une zone marquée au ruban, un troisième en course; tout le monde dans le même jeu, personne à l'écart. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

### 06 — `50-jeunes-un-gymnase` · carre 1080x1080
**Grands groupes en gymnase : 21 stratégies EPS**  
Univers : ÉPS, camp de jour, service de garde  
Fichier : `promo/50-jeunes-un-gymnase-carre.webp`  ·  [article](https://zonetotalsport.ca/articles/50-jeunes-un-gymnase.html)

> Plan large en plongée d'un gymnase d'école bondé : une cinquantaine d'enfants répartis en quatre ateliers délimités par des cônes et des tapis, deux adultes qui circulent entre les zones; sensation de densité organisée, lignes de terrain visibles au sol. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

### 07 — `jeux-course-1er-cycle` · carre 1080x1080
**Jeux de course pour le 1er cycle : 12 idées EPS**  
Univers : ÉPS  
Fichier : `promo/jeux-course-1er-cycle-carre.webp`  ·  [article](https://zonetotalsport.ca/articles/jeux-course-1er-cycle.html)

> Élèves de 1re et 2e année en course dans un gymnase, entre deux rangées de cônes, un enseignant accroupi au sol qui donne le signal de départ avec la main; petits corps en plein élan, sourires, tapis bleus au fond. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

### 08 — `courbe-plaisir-jeu` · carre 1080x1080
**Courbe du plaisir : combien de temps un jeu en EPS**  
Univers : camp de jour, ÉPS  
Fichier : `promo/courbe-plaisir-jeu-carre.webp`  ·  [article](https://zonetotalsport.ca/articles/courbe-plaisir-jeu.html)

> Sur un terrain de camp de jour, la moitié d'un groupe encore à fond dans un jeu de poursuite pendant que trois enfants s'assoient dans l'herbe en retrait, animateur au centre qui regarde sa montre; le moment exact où un jeu commence à s'essouffler. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

### 09 — `inventaire-materiel-sans-effort` · carre 1080x1080
**Inventaire du matériel sportif : la méthode éclair**  
Univers : service de garde, ÉPS, camp de jour  
Fichier : `promo/inventaire-materiel-sans-effort-carre.webp`  ·  [article](https://zonetotalsport.ca/articles/inventaire-materiel-sans-effort.html)

> Local de rangement sportif en cours de réorganisation : bacs transparents étiquetés par couleur alignés sur des tablettes, ballons triés par famille, une éducatrice en service de garde qui scanne un bac avec un téléphone; avant/après visible dans le même cadre. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

---

### Les 5 stories (1080×1920)

Cadrage vertical : sujet dans le tiers médian, **haut et bas laissés vides** pour le
texte ajouté à la publication.

### 10 — `faire-bouger-enfants` · story 1080x1920
**Faire bouger les enfants au primaire : 10 leviers**  
Univers : ÉPS, service de garde  ·  ★ **appât SEO**  
Fichier : `promo/faire-bouger-enfants-story.webp`  ·  [article](https://zonetotalsport.ca/articles/faire-bouger-enfants.html)

> Un groupe d'élèves du primaire en pleine course dans un corridor d'école transformé en parcours actif, cônes et marelle collée au sol, un enseignant d'éducation physique en survêtement qui pointe la prochaine station; mouvement flou léger sur les jambes, énergie de milieu de journée. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité. Cadrage vertical 9:16 pensé pour une story : sujet centré dans le tiers médian, espace vide en haut et en bas pour laisser passer le texte ajouté à la publication.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

### 11 — `comportements-perturbateurs` · story 1080x1920
**Comportements perturbateurs en EPS : que faire ?**  
Univers : ÉPS  ·  ★ **appât SEO**  
Fichier : `promo/comportements-perturbateurs-story.webp`  ·  [article](https://zonetotalsport.ca/articles/comportements-perturbateurs.html)

> Dans un gymnase d'école, un enseignant d'éducation physique accroupi à hauteur d'un élève un peu à l'écart du groupe, main calme sur le genou, pendant que le reste de la classe attend assise en demi-cercle au fond; lumière de fenêtres hautes, ambiance de désamorçage plutôt que de sanction. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité. Cadrage vertical 9:16 pensé pour une story : sujet centré dans le tiers médian, espace vide en haut et en bas pour laisser passer le texte ajouté à la publication.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

### 12 — `catastrophes-ordinaires` · story 1080x1920
**Vomi, guêpes et alarme de feu : le guide des catastrophes ordinaires**  
Univers : ÉPS, camp de jour, service de garde  ·  ★ **appât SEO**  
Fichier : `promo/catastrophes-ordinaires-story.webp`  ·  [article](https://zonetotalsport.ca/articles/catastrophes-ordinaires.html)

> Couloir d'école pendant une évacuation improvisée : un éducateur guide une file d'enfants en maillot enroulés dans des serviettes vers la sortie, seau et cônes de signalisation au sol derrière eux; scène réaliste, légèrement chaotique mais maîtrisée. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité. Cadrage vertical 9:16 pensé pour une story : sujet centré dans le tiers médian, espace vide en haut et en bas pour laisser passer le texte ajouté à la publication.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

### 13 — `grands-jeux-exterieurs-camp-de-jour` · story 1080x1920
**20 grands jeux extérieurs pour camp de jour**  
Univers : camp de jour  
Fichier : `promo/grands-jeux-exterieurs-camp-de-jour-story.webp`  ·  [article](https://zonetotalsport.ca/articles/grands-jeux-exterieurs-camp-de-jour.html)

> Grand jeu extérieur de camp de jour en plein soleil : une trentaine d'enfants en dossards de couleur courent vers un drapeau planté au centre d'un terrain gazonné, animateurs en t-shirt de camp qui arbitrent en périphérie, ballons et cerceaux éparpillés. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité. Cadrage vertical 9:16 pensé pour une story : sujet centré dans le tiers médian, espace vide en haut et en bas pour laisser passer le texte ajouté à la publication.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

### 14 — `un-jeu-trois-versions` · story 1080x1920
**Jeux inclusifs : un seul jeu, trois versions**  
Univers : service de garde, ÉPS, camp de jour  
Fichier : `promo/un-jeu-trois-versions-story.webp`  ·  [article](https://zonetotalsport.ca/articles/un-jeu-trois-versions.html)

> Jeu de ballon dans un gymnase où trois enfants jouent le même jeu avec des règles différentes : un enfant en fauteuil roulant sport au cœur de l'action, un autre dans une zone marquée au ruban, un troisième en course; tout le monde dans le même jeu, personne à l'écart. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité. Cadrage vertical 9:16 pensé pour une story : sujet centré dans le tiers médian, espace vide en haut et en bas pour laisser passer le texte ajouté à la publication.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

---

## LOT 2 — les 18 autres (après la lecture de fin septembre)

### 15 — `color-run` · carre 1080x1080
**Color Run à l'école : guide complet d'organisation**  
Univers : camp de jour, ÉPS  
Fichier : `promo/color-run-carre.webp`  ·  [article](https://zonetotalsport.ca/articles/color-run.html)

> Course colorée dans la cour d'école : des enfants en t-shirt blanc traversent un nuage de poudre rose et jaune, bénévoles de chaque côté du corridor, banderoles neutres sans texte; lumière de fin d'avant-midi, mouvement figé dans la poudre. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

### 16 — `respect-eps` · carre 1080x1080
**Respect en EPS : installer une culture saine**  
Univers : ÉPS  
Fichier : `promo/respect-eps-carre.webp`  ·  [article](https://zonetotalsport.ca/articles/respect-eps.html)

> Début de cours d'éducation physique : les élèves assis en cercle parfait sur les lignes du gymnase, l'enseignant debout au centre qui écoute un élève qui lève la main; calme inhabituel, lumière douce, rituel d'ouverture. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

### 17 — `eleves-cotes-eps` · carre 1080x1080
**Élèves cotés en EPS : adapter ses cours**  
Univers : ÉPS  
Fichier : `promo/eleves-cotes-eps-carre.webp`  ·  [article](https://zonetotalsport.ca/articles/eleves-cotes-eps.html)

> Atelier d'éducation physique adapté : un enseignant montre un geste au ralenti à un élève avec une limitation motrice pendant que deux camarades s'exercent à côté avec le même matériel; aucune séparation visible entre les enfants. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

### 18 — `classes-difficiles-partie-1` · carre 1080x1080
**Classes difficiles en EPS : poser le cadre (1/3)**  
Univers : ÉPS  
Fichier : `promo/classes-difficiles-partie-1-carre.webp`  ·  [article](https://zonetotalsport.ca/articles/classes-difficiles-partie-1.html)

> Première minute d'un cours d'éducation physique : l'enseignant, dos à la caméra, fait face à un groupe debout sur la ligne du fond du gymnase, tableau blanc portatif avec pictogrammes de routines à côté de lui; tension du premier contact. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

### 19 — `classes-difficiles-partie-2` · carre 1080x1080
**Classes difficiles en EPS : stratégies (2/3)**  
Univers : ÉPS  
Fichier : `promo/classes-difficiles-partie-2-carre.webp`  ·  [article](https://zonetotalsport.ca/articles/classes-difficiles-partie-2.html)

> Transition en plein cours : deux élèves rangent des ballons dans un chariot pendant que le reste du groupe se déplace en file vers un nouvel atelier, l'enseignant lève une main en signal d'arrêt; instant de bascule où tout peut déraper. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

### 20 — `classes-difficiles-partie-3` · carre 1080x1080
**Classes difficiles en EPS : durer (3/3)**  
Univers : ÉPS  
Fichier : `promo/classes-difficiles-partie-3-carre.webp`  ·  [article](https://zonetotalsport.ca/articles/classes-difficiles-partie-3.html)

> Fin de journée dans un gymnase vide : un enseignant d'éducation physique assis sur un banc, ballons rangés derrière lui, regard tourné vers les fenêtres; fatigue tranquille, lumière rasante de fin d'après-midi. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

### 21 — `nawatobi` · carre 1080x1080
**Nawatobi : corde à sauter japonaise en gymnase**  
Univers : ÉPS  
Fichier : `promo/nawatobi-carre.webp`  ·  [article](https://zonetotalsport.ca/articles/nawatobi.html)

> Démonstration de saut à la corde japonaise dans un gymnase : trois enfants sautent en synchronisme sur un tremplin pendant que deux camarades tournent la corde longue, groupe assis en arc de cercle qui regarde; corde en mouvement floue. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

### 22 — `foobaskill` · carre 1080x1080
**Foobaskill : sport hybride soccer-basket en EPS**  
Univers : ÉPS  
Fichier : `promo/foobaskill-carre.webp`  ·  [article](https://zonetotalsport.ca/articles/foobaskill.html)

> Match hybride soccer-basketball dans un gymnase : moitié gauche avec un ballon au pied vers un but, moitié droite avec un tir au panier, ligne médiane marquée au ruban, dossards de deux couleurs; les deux disciplines dans le même cadre. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

### 23 — `sae-course` · carre 1080x1080
**SAÉ course primaire : situation prête à utiliser**  
Univers : ÉPS  
Fichier : `promo/sae-course-carre.webp`  ·  [article](https://zonetotalsport.ca/articles/sae-course.html)

> Séance de course structurée à l'extérieur d'une école : des élèves courent sur une piste tracée à la craie sur l'asphalte, un enseignant avec un chronomètre et une planchette d'observation, cônes numérotés sans chiffres lisibles. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

### 24 — `systeme-emulation-dollar` · carre 1080x1080
**Système d'émulation par dollars en classe**  
Univers : ÉPS  
Fichier : `promo/systeme-emulation-dollar-carre.webp`  ·  [article](https://zonetotalsport.ca/articles/systeme-emulation-dollar.html)

> Tableau d'émulation dans un gymnase : un mur avec des pochettes de tissu par équipe et des jetons de couleur, un enseignant qui dépose un jeton pendant que deux élèves observent, cordes à sauter et ballons au premier plan flous. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

### 25 — `systeme-emulation-dollars-ecole` · carre 1080x1080
**Émulation par dollars à l'échelle de l'école**  
Univers : ÉPS  
Fichier : `promo/systeme-emulation-dollars-ecole-carre.webp`  ·  [article](https://zonetotalsport.ca/articles/systeme-emulation-dollars-ecole.html)

> Assemblée d'école dans un gymnase : plusieurs classes assises par groupes de couleur, deux enseignants debout devant un grand tableau de progression collective en tissu; ambiance de projet d'équipe-école. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

### 26 — `bienfaits-sport-enfants` · carre 1080x1080
**Bienfaits du sport pour les enfants : guide EPS**  
Univers : ÉPS  
Fichier : `promo/bienfaits-sport-enfants-carre.webp`  ·  [article](https://zonetotalsport.ca/articles/bienfaits-sport-enfants.html)

> Cour d'école à la récréation, plan large : enfants qui courent, grimpent, sautent à la corde et jouent au ballon en même temps, arbres et clôture en arrière-plan; vitalité collective d'une école primaire québécoise. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

### 27 — `syndrome-gymnase` · carre 1080x1080
**Syndrome du gymnase : repérer l'épuisement EPS**  
Univers : ÉPS  
Fichier : `promo/syndrome-gymnase-carre.webp`  ·  [article](https://zonetotalsport.ca/articles/syndrome-gymnase.html)

> Gymnase en fin de journée, lumière basse : un enseignant d'éducation physique appuyé contre un mur de ballons rangés, sifflet autour du cou, épaules tombantes; silence après le bruit, aucune présence d'élève. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

### 28 — `harcelement-enseignants` · carre 1080x1080
**Harcèlement envers les enseignants : agir**  
Univers : ÉPS  
Fichier : `promo/harcelement-enseignants-carre.webp`  ·  [article](https://zonetotalsport.ca/articles/harcelement-enseignants.html)

> Corridor d'école désert vu de loin : une enseignante debout près de son local, dossiers sous le bras, regard vers le sol; lumière froide de néons, cadrage sobre et respectueux, aucune scène de conflit visible. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

### 29 — `suppleance-ecoles` · carre 1080x1080
**Suppléance en école : guide pratique terrain**  
Univers : ÉPS  
Fichier : `promo/suppleance-ecoles-carre.webp`  ·  [article](https://zonetotalsport.ca/articles/suppleance-ecoles.html)

> Suppléant qui entre dans un gymnase inconnu : un adulte avec un sac de sport et une feuille de route à la main, groupe d'élèves déjà assis au fond qui l'observe; premier contact, matériel non déballé. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

### 30 — `comptes-rendus-rencontres` · carre 1080x1080
**Les comptes rendus de rencontre sans y passer ta soirée**  
Univers : ÉPS, service de garde  
Fichier : `promo/comptes-rendus-rencontres-carre.webp`  ·  [article](https://zonetotalsport.ca/articles/comptes-rendus-rencontres.html)

> Petite salle de réunion d'école après les classes : quatre membres du personnel autour d'une table, un téléphone posé au centre en mode enregistrement, cahiers et café; fin de journée, éclairage chaud. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

### 31 — `rentree-scolaire` · carre 1080x1080
**Rentrée scolaire en EPS : guide de démarrage**  
Univers : ÉPS  
Fichier : `promo/rentree-scolaire-carre.webp`  ·  [article](https://zonetotalsport.ca/articles/rentree-scolaire.html)

> Premier cours de l'année dans un gymnase fraîchement ciré : élèves debout sur des marques de couleur au sol, enseignant qui montre le signal de regroupement, matériel encore emballé sur un chariot au fond. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

### 32 — `avance-annee-scolaire` · carre 1080x1080
**Préparer l'année scolaire en EPS : checklist d'été**  
Univers : ÉPS  
Fichier : `promo/avance-annee-scolaire-carre.webp`  ·  [article](https://zonetotalsport.ca/articles/avance-annee-scolaire.html)

> Gymnase de fin d'année en juin : ballons dégonflés triés en piles, chariot à moitié vide, un enseignant qui prend des notes sur une planchette devant les tablettes de rangement; lumière d'été par les fenêtres hautes. Photographie documentaire réaliste, lumière naturelle, couleurs franches et saturées, grain fin, faible profondeur de champ. AUCUN texte, AUCUN logo, AUCUN chiffre visible dans l'image. Aucune mascotte, aucun personnage illustré, aucun rendu 3D ou cartoon. Enfants photographiés de dos, de trois quarts ou en plan large — pas de visage net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Vêtements de sport ordinaires d'école québécoise, rien de commandité.

*À éviter* : texte, lettrage, sous-titres, filigrane, logo, marque, mascotte, illustration, cartoon, rendu 3D, visage net d'enfant au premier plan, mains déformées, adultes en tenue de bureau, matériel de sport professionnel neuf

---

## Règles de la série, à ne pas perdre en cours de route

- **Aucun texte, aucun logo, aucun chiffre** dans l'image : le texte vit dans le post.
- **Aucune mascotte, aucune illustration, aucun rendu 3D.** Photographie documentaire
  seulement — la série doit rester cohérente avec celle de l'article inventaire.
- **Aucun visage net d'enfant au premier plan.** De dos, de trois quarts, ou en plan large.
- Diversité réaliste des origines, des morphologies et des habiletés.
- Vêtements de sport ordinaires d'école québécoise, **rien de commandité**.
- ⚠️ Surveiller le poids : le script alerte au-delà de **400 ko** par image.
