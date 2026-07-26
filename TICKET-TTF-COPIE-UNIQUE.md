# Ticket — une seule copie de ZoneTotalSport.ttf

**Ouvert le** 26 juillet 2026 · **Hors chantier d'habillage** · **Racine commune de D5, D15 et du ticket glyphes**

---

## L'état actuel

**Quatre copies du fichier** :

| Chemin | Rôle |
|---|---|
| `/fonts/ZoneTotalSport.ttf` | la référence, utilisée par le shell |
| `apps/jeux/ZoneTotalSport.ttf` | copie locale |
| `apps/moyens-action/ZoneTotalSport.ttf` | copie locale |
| `apps/nhl-playoffs/fonts/ZoneTotalSport.ttf` | copie locale |

**Cinq déclarations `@font-face`**, dont plusieurs sans `size-adjust: 50%` :
`apps/generateur/`, `apps/moyens-action/`, `apps/nhl-playoffs/`,
`apps/studio-jeu/studio.css`, `apps/jeux/styles.css`.

## Ce que ça a déjà coûté

Le pilote de densité projection a montré le logo du header **rendu au double
de sa taille**, débordant largement du cadre. Cause : deux `@font-face` de la
même famille, l'un avec `size-adjust`, l'autre sans. Le navigateur n'a pas de
règle prévisible pour arbitrer.

Contourné en renommant la famille du shell en `ZoneTotalSportZTSH`. C'est un
contournement, pas un correctif : les cinq déclarations continuent de se
marcher dessus entre elles.

## Le correctif

1. Faire pointer les cinq déclarations sur `/fonts/ZoneTotalSport.ttf`, en
   chemin absolu.
2. Ajouter `size-adjust: 50%` partout — sans lui, la police rend à ~2,4× l'em
   (unitsPerEm 1024, bbox des capitales jusqu'à 2435).
3. Supprimer les trois copies locales.
4. Renommer la famille du shell de `ZoneTotalSportZTSH` vers
   `ZoneTotalSport`, la collision n'ayant plus lieu d'être.

Cinq diffs d'une à deux lignes, dans cinq fichiers d'app — **donc interdit par
le contrat d'habillage**, et à faire dans son propre passage avec une
vérification visuelle par app.

## Enchaînement recommandé

Ce ticket, puis `TICKET-GLYPHES-ZTS.md`. Faire dessiner les douze glyphes
manquants **après** la consolidation, pour n'avoir qu'un seul fichier à
remplacer au lieu de quatre.
