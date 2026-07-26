# Ticket — refaire l'en-tête d'`acrosport` sur l'hôte partagé

**Ouvert le** 26 juillet 2026 · **Hors chantier d'habillage** · **À traiter avant tout déploiement d'`acrosport`**

---

## Le problème

`apps/acrosport/` est la seule app du dépôt dont l'en-tête est **hors de portée
de toute règle CSS externe** :

```html
<header class="relative border-b-[8px] border-[#004A61]"
        style="background: radial-gradient(circle at 30% 20%, #00C4FF 0%, #0096…">
```

Le dégradé est en **style inline**. Aucune feuille de style ne peut le
surcharger sans `!important`, que le contrat d'habillage interdit hors du bloc
`@media print`. L'app est par ailleurs l'une des deux seules à ne charger
**aucun** CSS partagé — ni `shared/zts.css`, ni `zts-header.css`, ni
`zts-ultra.css` — et elle n'a pas l'hôte `data-zts-header`.

44 apps sur 46 portent cet hôte et reçoivent le header partagé injecté par
`zts.js`. `acrosport` et `studio-jeu` sont les exceptions ; `studio-jeu` se
règle par un simple repli de token (voir D17 bis), `acrosport` non.

## Décision prise

**`acrosport` est exclue des vagues d'habillage.** Elle n'est pas déployée —
un seul lien entrant dans tout le site — donc l'exclusion ne coûte rien.

**Aucun `!important`, jamais**, y compris à titre temporaire.

## Le correctif

Refaire son en-tête comme les 44 autres, avant son déploiement :

1. Remplacer le `<header>` maison par `<div data-zts-header></div>`.
2. Charger `shared/zts.css` et `shared/zts.js`.
3. Retirer le style inline et les classes Tailwind arbitraires
   (`border-b-[8px]`, `border-[#004A61]`).
4. Vérifier que le reste de l'app ne dépendait pas de la hauteur ou du fond de
   cet en-tête — elle a des `z-index` jusqu'à 2000 et trois appels au plein
   écran.

L'app pourra alors entrer dans une vague normale, en densité `travail`
(7 onglets, minuteur, dé, projection, impression) — voir sa fiche au prescan.

## À ne pas faire

Cibler le `<header>` d'`acrosport` depuis `assets/ztsh-shell.css`. Ce serait
une règle propre à une app dans un fichier partagé par 46, et elle ne pourrait
de toute façon pas battre le style inline.
