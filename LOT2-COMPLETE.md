# LOT 2 CONVERSION — rapport final

**21 août 2026.** Quatre vagues, quatre arrêts, cinq PR.
Base au départ : `main` à `f362d89`. Prescan : `LOT2-PRESCAN.md`.

| Vague | PR | État |
|---|---|---|
| **A** — modale V2 en deux écrans | [#17](https://github.com/ZoneTotalSport/zts-zone-page/pull/17) | **fusionnée** (`b3e8195`), vérifiée en production |
| **B** — `lang()` unique, puis tunnel FR/EN | [#18](https://github.com/ZoneTotalSport/zts-zone-page/pull/18) | **fusionnée** (`682200d`) |
| **C** — partage | [#19](https://github.com/ZoneTotalSport/zts-zone-page/pull/19) | **fusionnée** (`ca35005`) |
| **D** — générateur + newsletter | #20 | **en attente de ton feu vert** |

---

## Ce que le LOT 2 a livré

### A — la modale d'inscription passe à deux écrans

Proposition de valeur, puis formulaire. Bouton retour, œil sur le mot de passe,
mot de passe oublié. Le stash « v2-modal-2-etapes » du 9 août a été repris
**morceau par morceau** : ses six hunks en conflit auraient réintroduit
`getRedirectResult` et `zts_signed_out`, retirés par le LOT 0 le 12 août.

**Preuve sociale vivante.** Le chiffre vient du worker `zone-subscriber-count`,
relu **à l'ouverture** et écrit dans le nœud quand la réponse arrive — le stash
ne le lisait qu'une fois, au chargement du script, et une modale ouverte avant
la réponse gardait le repli générique pour toujours.

**Google en deux clics au lieu de trois.** Le mur demandait « Continuer avec
Google » puis jetait le choix : `showModal` ne lisait que `opts.wall`. Le
fournisseur est maintenant honoré, et Google part **dans le même geste de
clic** — aucun `await` avant `signInWithPopup`, sinon la fenêtre est bloquée.

### B — une seule langue par page, et un tunnel bilingue

`ZTS.langue()` est la seule définition de « quelle langue voit ce visiteur ».
Trois modules en avaient chacun la leur.

Quatre surfaces sans aucune traduction sont passées en FR/EN : la modale, le
mur plein écran, le demi-mur des fiches, `/bienvenue.html`.

### C — « Fais connaître ZoneTotalSport »

Un composant, deux emplacements : le pied partagé et `/bienvenue.html` juste
après l'inscription. `navigator.share` quand il existe — bouton **caché**
sinon, plutôt qu'un clic inerte — copier le lien, Facebook, X.

### D — les essais gratuits, annoncés ailleurs

Trois surfaces : le mur, le demi-mur, une carte au pied. **Aucun bandeau
permanent sur les fiches** — le §D de `LOT0-COMPLETE.md` tient. Le nombre vient
de `window.ztsAnonLimit`, jamais d'un texte.

Et le pop-up newsletter ne dit plus « 328 profs » : il lit le worker, avec un
repli **sans chiffre** si celui-ci ne répond pas.

## Les défauts trouvés en chemin — ceux que personne n'avait demandés

| # | Défaut | Où | Vague |
|---|---|---|---|
| 1 | Un **cinquième émetteur** de `locked_click_signup` dans le stash : le double comptage retiré le 13 août serait revenu par la modale | `firebase-auth.js` | A |
| 2 | Un `<link>` **Google Fonts** injecté pour **Fredoka**, police morte depuis le 4 août — sur toutes les pages murées. Le motif que le §D interdit, déjà en production | `zts-locked-fullscreen.js` | B |
| 3 | 12 déclarations de polices mortes (Fredoka, Patrick Hand, Comic Neue) | 3 modules | B |
| 4 | Le mur annonçait « tes **2** essais » après le passage du plafond à 3 | `zts-locked-fullscreen.js` | B |
| 5 | `?lang=` ignoré par **les trois** `lang()` : un lien partagé en anglais servait le cadenas en français | 3 modules | B |
| 6 | « **328 profs** » codé en dur, FR et EN, dans le pop-up que voit tout visiteur | `zts-newsletter.js` | D |
| 7 | La pastille « Compte gratuit requis » collée à une phrase disant « sans créer de compte » | `zts-cadenas.js` | D |
| 8 | Le demi-mur bilingue au **chargement seulement** : figé si le visiteur changeait de langue | `zts-lock-page.js` | D |

Deux annonces de mon prescan se sont révélées **fausses**, et je les ai
corrigées plutôt que de les laisser vivre : la table d'erreurs n'a rien perdu à
la fusion du stash (14 entrées sur 14), et `font-patrick` pointait déjà sur une
police vivante — le vrai problème était Fredoka.

## Docs parasites — voir §6 de `LOT2-PRESCAN.md`

Deux documents de production créés par mes tests, **ineffaçables** :
`anonGenCount` id `3c09bbbd…b027a`, et un `conversionFunnel`
`signup_complete {path:'/blog.html', uid:null}`. À retrancher de toute
baseline. Depuis, **toute écriture Firestore est stubée pendant les tests** —
la règle est née du second.

## Ce qui reste ouvert

### À toi, au tableau de bord

1. **`ia.` fait toujours deux sauts.** La cible de la règle de zone n'a pas de
   barre finale, GitHub Pages en ajoute une. Un caractère. C'est le
   sous-domaine qui porte le nom que quelqu'un taperait pour trouver le
   générateur — donc le plus mal placé pour coûter un saut.
2. **Les deux documents parasites**, si tu veux les retirer par la console.
3. **Les 14 tests manuels** du §6 de `CHANTIER2-VERIFICATIONS.md` : A1-A4
   connecté, B1-B7 anonyme, C1-C2 iPhone, D1 ménage `leads`.

### Décisions de produit, pas de technique

4. **Le générateur est-il assez annoncé ?** Trois surfaces maintenant, mais
   toujours absent du menu de navigation. C'était hors périmètre ; ça se
   décide, ça ne se déduit pas.
5. **Le désaccord `freeResources`** : le générateur est badgé « compte gratuit
   requis » dans le menu et le pied alors qu'il offre 3 essais sans compte. La
   carte du §D en sort par une exception explicite ; les autres liens restent
   badgés. Corriger globalement veut dire toucher `locked-whitelist.json`, qui
   sert aussi à décider des murs — c'est un chantier, pas une retouche.
6. **Mesurer.** `genia_click` et `share_click` n'existaient pas avant
   aujourd'hui. Laisse une semaine pleine avant d'en conclure quoi que ce soit,
   comme le LOT 0 le recommandait pour le funnel.

### Dette repérée, non traitée

7. **`zts-newsletter.js` a une quatrième `lang()`**, hors des six unifiées en
   B1. Elle est correcte aujourd'hui, mais elle est la prochaine à diverger.
8. **Les 1440 fiches pointent encore vers `jeux.zonetotalsport.ca`** — un saut
   de plus, rien de cassé. `scripts/gen-jeux-fiches.js:176`, à corriger
   **avant** la prochaine régénération.

## Comment revenir en arrière

Chaque vague est une PR de fusion isolée : `git revert -m 1 <sha>` sur `b3e8195`
(A), `682200d` (B), `ca35005` (C) ou celle de D. Aucune ne touche aux données —
ni R2, ni Firestore, ni Cloudflare. Rien à redéployer à côté.
