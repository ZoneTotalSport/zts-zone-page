# Ticket — dessiner les 12 glyphes manquants de ZoneTotalSport.ttf

**Ouvert le** 26 juillet 2026 · **Hors chantier d'habillage** · **Priorité : moyenne, coût faible**

---

## Le problème

`/fonts/ZoneTotalSport.ttf` couvre 145 caractères. Douze manquent, et le navigateur
bascule de police **par caractère** — un titre se retrouve donc à cheval sur
ZoneTotalSport et Luckiest Guy en plein milieu d'un mot.

### Ponctuation — le vrai problème

| Glyphe | Code | Cas typique |
|---|---|---|
| `’` | U+2019 | **« L’ÉCOLE »** — apostrophe typographique |
| `«` `»` | U+00AB / U+00BB | citations en titre |
| `—` | U+2014 | incises |
| `°` | U+00B0 | « 18°C » |

L'apostrophe est le cas critique. La **droite** `'` (U+0027) est couverte, la
**courbe** `’` ne l'est pas — et c'est la courbe que produit la correction
automatique de la plupart des éditeurs de texte. La différence est invisible
dans le code source, et visible immédiatement à l'écran.

### Lettres

`Ù` `Ÿ` `Æ` `Œ` `ÿ` `æ` `œ`

Plus rares. « OÙ » et « CŒUR » sont les deux cas réalistes dans des titres ZTS.

*(Hors français, il manque aussi `Á Ã Å Ì Í Ñ Ò Ó Õ Ú Ý á ã å ì í ñ ò ó õ ý`
et `< > | ~`. Pas prioritaires — le site est francophone.)*

## Le contournement en place

`_scripts/verifie-glyphes-ztsh.py` scanne tout `.ztsh-titre` :

- **ponctuation → bloquant**, code de sortie 1 ;
- **lettres → avertissement**, code de sortie 0.

Plus une règle de rédaction documentée en tête de `assets/ztsh-shell.css` §2 :
apostrophe droite, guillemets droits, tiret simple, « degrés » écrit en toutes
lettres, ligatures en deux lettres.

Ça tient, mais ça impose une contrainte d'écriture permanente à Joey pour un
défaut de police qui se corrige une fois.

## Le correctif

Dessiner les douze glyphes dans la police source, réexporter le TTF, remplacer
`/fonts/ZoneTotalSport.ttf`.

Dépôts mentionnés par Joey : **`police-de-caract-re`** et **`font`**.

Les accentuées existent déjà pour la plupart (`À Â Ä Ç È É Ê Ë Î Ï Ô Ö Û Ü`),
donc `Ù` et `Ÿ` se composent depuis `U` et `Y` avec les accents existants. `Œ`
et `Æ` demandent un vrai dessin. La ponctuation est géométrique et rapide.

### Vérifier après coup

```bash
python3 _scripts/verifie-glyphes-ztsh.py
```

Le script relit le TTF au démarrage et signale de lui-même que la couverture a
changé. Il reste alors à vider `BLOQUANTS` et `AVERTIS` en tête du fichier, et
à retirer la règle de rédaction de `assets/ztsh-shell.css` §2.

## Attention en remplaçant le fichier

Trois copies du même TTF existent ailleurs dans le dépôt et devront être
remplacées aussi, ou mieux, supprimées au profit de la copie racine — voir
**D5** dans `DETTE-TECHNIQUE-HABILLAGE.md` :

- `apps/jeux/ZoneTotalSport.ttf`
- `apps/moyens-action/ZoneTotalSport.ttf`
- `apps/nhl-playoffs/fonts/ZoneTotalSport.ttf`

Et ne pas toucher au `size-adjust: 50%` : la police est dessinée à ~2,4× l'em
(unitsPerEm 1024, bbox des capitales jusqu'à 2435). Les nouveaux glyphes
doivent respecter la même échelle, sinon ils rendront deux fois trop petits.
