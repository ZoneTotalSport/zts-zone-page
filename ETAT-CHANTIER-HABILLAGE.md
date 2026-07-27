# État du chantier d'habillage — reprise

**Dernière mise à jour** : 27 juillet 2026, vague 1 testée au complet.
**Dépôt** : `ZoneTotalSport/zts-zone-page` → `/Users/admin/Desktop/Remotion 2/wix-deploy/`

---

## En production, déjà déployé

`main` a été fusionné et poussé (`3d90121`). Le build GitHub Pages est passé
en 113 s, sans erreur.

**Le rendu de la production est rigoureusement inchangé** — vérifié par
empreinte avant/après sur trois pages :

| Page | Avant | Après | Identique |
|---|---|---|---|
| `/` | 212 130 o · `11dee7f6` | 212 130 o · `11dee7f6` | oui |
| `/apps/plan-b-meteo/` | 13 631 o · `cf078bed` | 13 631 o · `cf078bed` | oui |
| `/apps/suppleance/` | 17 590 o · `8801bea1` | 17 590 o · `8801bea1` | oui |

Les trois fichiers du shell sont passés de 404 à 200, servis en gzip.
Aucune page n'appelle `ZTSShell.monter()` sur `main` : le shell est livré mais
dormant, ce qui est exactement son contrat.

## Branches

```
main                      ← fondation + garde-fous, POUSSÉ, en production
├── shell/fondation       ← identique à main, conservée comme base
├── pilote/plan-b-meteo   ← vitrine,    24/24 PASS
├── pilote/nhl-playoffs   ← projection, 16/16 PASS
├── pilote/suppleance     ← travail,    29/29 PASS
└── vague/1-whitelist     ← 4 apps, 4/4 testées, prête à fusionner
```

**Les trois branches `pilote/*` ont été créées avant le commit `549a143`
(repli `--metier`).** Les rebaser sur `main` avant de les fusionner.

## Ce qui reste à faire, dans l'ordre

### 1. ~~Terminer la vague 1~~ — FAIT le 27 juillet

`vague/1-whitelist` contient quatre apps migrées, 6 lignes de diff chacune,
`verifie-habillage.py` et `verifie-glyphes-ztsh.py` au vert. Les quatre sont
maintenant rejouées avec la liste fonctionnelle du prescan :

| App | Densité | Tests |
|---|---|---|
| `jeux` | travail | **15/15 PASS** |
| `sae` | travail | **PASS** |
| `nba-playoffs` | projection | **PASS, puis retirée** — voir ci-dessous |
| `musique` | vitrine | **PASS** |

**`nba-playoffs` a été retirée de la vague avant la fusion.** L'app est
supprimée du site par la branche `feat/matchs-du-jour` (décision du 27 juillet :
les trois apps sportives cèdent la place aux matchs du jour, en bas de
l'accueil). Son habillage était donc du travail mort : le fusionner aurait posé
un conflit modifie/supprime pour rien. Son fichier est revenu à la version de
`main`, les tests restent consignés ici pour mémoire.

Même raison pour **`pilote/nhl-playoffs`** (16/16 PASS) : branche à abandonner,
pas à fusionner.

Ce qui a été vérifié sur les trois nouvelles, au-delà du montage du shell :

- **`sae`** — 1880 SAÉ chargées, 12 `<select>` présents, filtre cycle (671
  résultats pour le 2ᵉ cycle), recherche en direct, état vide, modale ouverte
  au clic **et** au clavier (`Enter`), `_currentModalSAE` peuplé, `Escape`
  ferme, favori persistant (`favoris-sae`), filtre Favoris, `handleModalCours`
  (toast, z 9999, passe au-dessus du rail), console sans erreur.
- **`musique`** — Commencer, 3 champs, lecture d'une playlist (iframe YouTube
  non recouverte par le rail), URL collée + **JOUER**, `Enter` valide,
  `zts_my_playlist` persistée, encourageur (clic sur Mr Root → nouveau
  message), pause café (**zéro requête réseau**, repli local seul),
  bascule FR/EN du header.
- **`nba-playoffs`** — densité projection : **aucun chrome injecté**, 3 nœuds
  `ztsh-` seulement, `ztsh-encouragements.js` **non téléchargé**. `.zoom-controls`
  libre à droite, zoom +/−/↺ et `zts_nba_zoom` persisté, raccourcis
  `Cmd +/0`, 3 onglets, modale de série + `Escape`, données API chargées.

Trois constats sortis de ces tests, aucun n'est un blocage :

1. **Le banc d'essai ne sait pas envoyer une vraie touche `Enter`** : l'action
   clavier de l'outil arrive avec `e.key === ''`. Toute vérification d'un
   raccourci doit passer par un `KeyboardEvent` synthétique. Ne pas conclure
   « le raccourci est cassé » sur la foi d'une frappe de l'outil.
2. **`sae` masque le header partagé** dès qu'on quitte l'écran d'accueil
   (`.zts-header.hidden` + `.hidden{display:none}` de son `style.css`).
   Comportement antérieur au chantier, vérifié identique sur `main`.
3. **La bulle de l'encourageur dit « Clique-moi encore → » mais la cible
   cliquable est Mr Root**, pas la bulle. Rien ne casse ; à revoir dans une
   passe d'ergonomie, pas ici.

Méthode de comparaison utilisée, réutilisable : copier le fichier de `main`
à côté de celui de la branche (`git show main:apps/X/index.html >
apps/X/zz-base.html`), le servir, rejouer le même geste, supprimer la copie.
La profondeur relative est conservée, donc tous les `../../` résolvent.

### 2. Fusionner les pilotes et la vague 1 dans `main`

Après rebasage, et après vérification que le build Pages passe.

### 3. Vagues suivantes

Ordre du prescan, amendé : les six apps de la whitelist d'abord (faites), puis
les 22 gabarits, puis les apps custom par risque croissant.

`acrosport` est **exclue** — voir `TICKET-ACROSPORT-ENTETE.md`.
`evaluation` et `scoreboard` sont **exclues** — builds Vite, source absente
pour la première.

## Comment tester une app

Le serveur de test doit désactiver le cache, sinon le navigateur sert
d'anciennes versions des assets et fausse tout :

```bash
python3 - <<'EOF' &
import http.server, functools, sys
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control','no-store, no-cache, must-revalidate')
        super().end_headers()
    def log_message(self,*a): pass
http.server.ThreadingHTTPServer(('127.0.0.1',8913),
    functools.partial(H, directory='.')).serve_forever()
EOF
```

Trois pièges déjà rencontrés, à ne pas re-diagnostiquer :

- **Le cache du navigateur** survit à `no-store` sur les sous-ressources déjà
  chargées. Changer de port force un rechargement propre.
- **Les animations CSS ne se jouent pas** quand `document.visibilityState`
  vaut `hidden` — c'est le cas pendant l'exécution de JS via l'outil. Un
  screenshot remet l'onglet au premier plan.
- **Les dictionnaires i18n se chargent en asynchrone.** Attendre 600 ms avant
  de vérifier une traduction.

## Points en attente d'une décision

- **D13** — texte blanc sur rose, 3,87 pour un seuil de 4,5. Défaut antérieur,
  atténué par le chantier. Correctif = encre foncée sur le rose, donc une
  passe d'accessibilité dédiée après les vagues.
- **Bug de déconnexion** — à observer dans une vraie session. Demande une
  connexion de Joey sur une app hors whitelist, console ouverte.
- **`TICKET-TTF-COPIE-UNIQUE.md`** puis **`TICKET-GLYPHES-ZTS.md`**, dans cet
  ordre.

## Ce qu'il ne faut jamais faire

- Ajouter un contournement du portillon dans `zts-gate.js` ou
  `zts-lock-page.js`, même temporairement.
- Utiliser `!important` hors du bloc `@media print`.
- Rebaser les tokens de **dimension** (`--fs-*`, `--r-*`, `--space-*`). Seuls
  les tokens d'**identité** se rebasent.
- Charger `assets/ztsh-shell.css` **avant** `shared/zts.css`,
  `zts-header.css` ou `zts-ultra.css` — la panne serait silencieuse.
- Modifier un fichier d'app au-delà des 6 lignes du contrat.
