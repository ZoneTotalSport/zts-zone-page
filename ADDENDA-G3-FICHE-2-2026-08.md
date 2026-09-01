# ADDENDA G3-FICHE-2 — l'écran LA PLANIFICATION

Reçu de Joey le 31 août 2026, consigné ici pour que la prochaine session n'ait
pas à le redemander. **Livré** — voir `QA-G3-FICHE-2026-08.md`.

---

## Constat d'origine (capture de Joey à l'appui)

Toucher la carte LA PLANIFICATION ouvrait l'écran de composition **sous** la
rangée de cartes, qui restait affichée. L'écran ajoutait une palette de pièces
(Activité, Le temps, Présences, Un jeu, Évaluation, Un mot, Un test) qui
**répétait 5 des cartes du haut**. La minuterie existait en **trois langages** :
carte MINUTERIE, pièce LE TEMPS, « durée à toi » par étape. Trop chargé — un
enfant de 10 ans doit composer son cours sans se demander pourquoi la même chose
existe à deux ou trois places.

> **Comptage** : la fiche portait **8 cartes** — Planification, Minuterie,
> Présences, Jeux, Message, Évaluation, Tests, Portrait. (Un premier état de ce
> document parlait de neuf : erreur de comptage, corrigée le 31 août.)

---

## §1 — PLEIN ÉCRAN, PAS EMPILÉ

Toucher LA PLANIFICATION **remplace** le contenu de la fiche : la rangée de
cartes disparaît, l'écran de composition prend toute la place, avec un bouton
**◀ RETOUR** clair en haut. Une seule chose à l'écran à la fois. Même principe
pour toute carte qui ouvre un écran.

## §2 — UN SEUL LANGAGE : LES PIÈCES

Dans l'écran de composition, les pièces de la palette sont **la** seule
représentation de Présences, Jeu, Évaluation, Mot, Test. Aucune carte doublon
visible. La palette garde : **ACTIVITÉ · UN JEU · PRÉSENCES · ÉVALUATION ·
UN MOT · UN TEST**.

## §3 — MINUTERIE : DANS LE COIN DE CHAQUE ÉTAPE

- Supprimer la **carte MINUTERIE** de la fiche.
- Supprimer la **pièce LE TEMPS** de la palette — elle ne représente rien qu'une
  étape n'ait déjà.
- Chaque étape posée porte dans son coin un petit **⏱** : champ de durée
  (l'ancien « durée à toi ») + bouton **PARTIR** qui lance la minuterie du
  tiroir Jeux préremplie avec cette durée, buzzer inclus.
- Même patron que le coin de bloc de l'image du groupe dans la période : petit,
  dans le coin, toujours à la même place.

## §4 — CONSIGNE DÉGRAISSÉE

Le paragraphe jaune « Compose ton cours : glisse une pièce… » devient **une
seule ligne** (« Glisse une pièce dans une phase »), le reste sous un **ⓘ**.
Affiché en entier la **première fois seulement**.

## §5 — HIÉRARCHIE DE L'ÉCRAN (ordre vertical)

◀ RETOUR + titre du cours → **MA PLANIFICATION EN MOTS** (repliée en une ligne
si vide) → la **palette** de pièces → les **phases** (Arrivée / Pendant la
période / Fin). Les badges « Durées à remplir » et « 0/3 terminée » se collent
aux phases, pas entre la palette et le texte.

---

## Règles

- **Aucune fonction perdue** : tout ce que les pièces et les cartes faisaient
  reste faisable ; liste de correspondance avant/après au rapport QA.
- **Test enfant de 10 ans** : écran ouvert = une question (« quoi mettre dans
  mon cours ? »), une réponse (la palette), un geste (glisser).
- **Charte marine.** QA complet : composer un cours complet au doigt sur
  tablette, durées, minuterie par étape, retour, persistance.

---

## Ce qui a été livré

Les cinq sections, commit `575e3279`, ressources `?v=149`. Vérifié par
émulation ; **les gestes tactiles restent à confirmer par Joey** — voir la
section « À VÉRIFIER PAR JOEY » de `QA-G3-FICHE-2026-08.md`.

Deux écarts assumés par rapport au texte, tous deux documentés dans le code :

1. **Le §2 est obtenu par le §1**, pas par une suppression de cartes : les
   cartes ne sont plus visibles pendant la composition, donc les doublons
   disparaissent sans rien retirer à la fiche.
2. **« Coche-la dans les cases du haut »** a quitté la consigne, puisque les
   cartes sont masquées à ce moment-là. Le geste existe toujours
   (`decorerPortes` pose les cases sur les cartes), il n'est simplement plus
   mentionné là où il n'est pas praticable.
