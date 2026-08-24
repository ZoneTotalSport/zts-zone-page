À appliquer sur `zts-lock-page.js` à la publication de l'article inventaire, composition déjà validée en bac à sable (`FIX-FUITES-MUR-COMPLETE.md`).

```bash
git apply _patches/lockpatch-toujours-visible/toujours-visible.patch
```

⚠ C'est un **diff**, pas une copie du fichier. La version qui dormait dans
`_to_delete/lockpatch/` était un `zts-lock-page.js` complet **d'avant** le
correctif des fuites du mur (PR #26) : la copier par-dessus aurait annulé ce
correctif sans que rien ne le signale. Ce patch-ci se pose sur le fichier
courant et échoue bruyamment s'il ne colle plus.

⚠ L'article qui s'en sert — `inventaire-materiel-sans-effort.html` — dort
toujours dans `_to_delete/livraison-article-inventaire/`, n'a jamais été
commité, et répond 404 en production.
