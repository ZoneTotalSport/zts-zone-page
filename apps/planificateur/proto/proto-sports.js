/* ==========================================================================
   LES IMAGES DE SPORT SUR LA CARTE DU GROUPE (3 septembre, v164)
   Joey : la carte du groupe porte une IMAGE de sport, pleine carte, avec la
   couleur du groupe en dégradé par-dessus — opaque à gauche, légère à droite.
   Le numéro du groupe et le nom du titulaire vivent chacun dans une petite
   pastille blanche. Le sport se choisit dans le portrait du groupe.

   ⚠ CE FICHIER NE RÉÉCRIT RIEN — IL SE GREFFE. `carteDuGroupe` (proto-g3.js) et
   `voletPortrait` (proto-portrait.js) sont enveloppées, jamais remplacées :
   on appelle l'originale, puis on décore ce qu'elle a rendu. C'est le patron
   déjà en place pour `peindreAgenda` et `peindreMois` (proto-g3.js §6 bis), et
   il a la même raison d'être ici : le jour où ce lot se retire, il suffit
   d'ôter ce fichier et sa balise, et la carte de v162 revient intacte.

   ⚠ CHARGÉ EN DERNIER, ET CE N'EST PAS INDIFFÉRENT. proto-g3.js enveloppe déjà
   `peindreAgenda` et `peindreMois` ; nos calques doivent s'appliquer APRÈS les
   siens, donc notre balise vient après la sienne dans index.html.
   ========================================================================== */
'use strict';

/* ═════════ LES NEUF SPORTS ═════════
   ⚠ LES SLUGS SONT DES NOMS DE FICHIERS, DONC DES CLÉS STABLES. Un groupe
   enregistre `sport:'hockey-cosom'` dans sa fiche ; renommer un slug rendrait
   muette la carte de tous les groupes qui l'avaient choisi. Même règle que le
   `slug` de la bibliothèque de jeux (voir CLAUDE.md).
   ⚠ L'ORDRE EST CELUI DU SÉLECTEUR, et il n'est pas alphabétique : les sports
   de gymnase d'abord — c'est là qu'un prof d'ÉPS au primaire passe ses
   journées — puis l'extérieur. Athlétisme ferme la liste parce que c'est le
   DÉFAUT : on le trouve sans le chercher. */
const SPORTS = [
  ['basket',          '🏀', 'Basketball'],
  ['volley',          '🏐', 'Volleyball'],
  ['badminton',       '🏸', 'Badminton'],
  ['tennis-de-table', '🏓', 'Tennis de table'],
  ['hockey-cosom',    '🏒', 'Hockey cosom'],
  ['soccer',          '⚽', 'Soccer'],
  ['baseball',        '⚾', 'Baseball'],
  ['crosse',          '🥍', 'Crosse'],
  ['athletisme',      '🏃', 'Athlétisme'],
];
const SPORT_DEFAUT = 'athletisme';
const SPORTS_DOSSIER = 'img/sports/';

function sportValide(slug){
  return SPORTS.some(s=>s[0]===slug) ? slug : null;
}
/* ⚠ MÊME DISCIPLINE QUE POUR `protog2:zoom` : ce qui vient du stockage est
   validé, et une valeur inconnue retombe sur le défaut au lieu de demander au
   navigateur un fichier qui n'existe pas — une image cassée sur la carte est
   plus laide qu'un athlétisme par défaut. */
function sportDuGroupe(g){
  return sportValide(g && g.sport) || SPORT_DEFAUT;
}
function imageDuSport(g){
  return SPORTS_DOSSIER + sportDuGroupe(g) + '.webp';
}
function nomDuSport(g){
  const s=SPORTS.find(x=>x[0]===sportDuGroupe(g));
  return s ? s[2] : '';
}

/* ═════════ LE DÉGRADÉ ═════════
   La couleur du groupe reste ce qui identifie la carte de loin ; l'image ne
   fait que la meubler. D'où le sens du dégradé : OPAQUE À GAUCHE (85 %), où
   vivent les pastilles et le titre, LÉGER À DROITE (25 %), où l'image respire.
   ⚠ LE DÉGRADÉ EST DANS `background-image`, EMPILÉ AU-DESSUS DE LA PHOTO, et
   non en pseudo-élément. Un `::before` en `position:absolute` aurait demandé un
   `z-index` sur chaque enfant de la carte pour ne pas les recouvrir — le titre
   est un `contenteditable`, on ne l'enterre pas sous un calque. Deux couches
   dans une seule propriété : rien à empiler, rien à remonter. */
function fondDeCarte(g, urlImage){
  const c=g.coul;
  return 'linear-gradient(100deg, ' + melange(c,.85) + ' 0%, '
       + melange(c,.62) + ' 38%, ' + melange(c,.25) + ' 100%), '
       + 'url("' + urlImage + '")';
}
/* `color-mix` ferait la même chose, mais la couleur d'un groupe peut être
   n'importe quel `#rrggbb` choisi au sélecteur : on convertit à la main plutôt
   que de dépendre du support de `color-mix` sur l'iPad de l'école. */
function melange(hex, alpha){
  const n=parseInt(String(hex||'#9E9E9E').slice(1),16);
  return 'rgba(' + ((n>>16)&255) + ',' + ((n>>8)&255) + ',' + (n&255) + ',' + alpha + ')';
}

/* ═════════ LES ÉMOJIS DE PÉRIODE ═════════
   Joey : une petite case par période, un mini-sélecteur, et l'émoji choisi se
   répète sur MA SEMAINE et MON MOIS.

   ⚠ CLÉ PAR DATE ET PÉRIODE, PAS PAR GROUPE. « 🚌 » dit qu'il y a une sortie
   CE mardi à la 3e période ; changer le groupe de la case ne doit pas emporter
   l'autobus avec lui. Le motif `protog2:emo:<jour>:p<n>` ne croise pas celui
   des séances (`protog2:se:<jour>:p<n>`) que balaie `toutesSeances()` — vérifié :
   son gabarit exige `se:` juste après le préfixe. */
const EMOJIS_PERIODE = ['🎉','🏆','📸','🎂','🚌','🩺','⭐','❌'];
function cleEmoji(iso, per){ return 'emo:'+iso+':p'+per; }
function emojiDe(iso, per){
  const v=lire(cleEmoji(iso,per), '');
  return EMOJIS_PERIODE.indexOf(v) >= 0 ? v : '';
}
function poserEmoji(iso, per, e){
  if (e) ecrire(cleEmoji(iso,per), e);
  else localStorage.removeItem('protog2:'+cleEmoji(iso,per));
  if (typeof peindreAujourdhui==='function') peindreAujourdhui();
  if (typeof peindreAgenda==='function') peindreAgenda();
  if (typeof peindreMois==='function') peindreMois();
}

/* le mini-sélecteur : les huit, plus « effacer ». Rien de plus — c'est une
   pastille de rappel, pas un clavier d'émojis. */
function ouvrirChoixEmoji(iso, per, ancre){
  $$('.emo-choix').forEach(x=>x.remove());
  const actuel=emojiDe(iso,per);
  const boite=el('div','emo-choix');
  boite.setAttribute('role','dialog');
  boite.setAttribute('aria-label','Marquer la période '+per);
  EMOJIS_PERIODE.forEach(e=>{
    const b=el('button','emo-opt',e); b.type='button';
    b.setAttribute('aria-pressed', String(e===actuel));
    b.title='Marquer cette période — '+e;
    b.addEventListener('click', ev=>{ ev.stopPropagation();
      poserEmoji(iso, per, e===actuel ? '' : e); boite.remove(); });
    boite.appendChild(b);
  });
  const vider=el('button','emo-opt emo-opt--vider','effacer'); vider.type='button';
  vider.title='Retirer la marque de cette période';
  vider.disabled = !actuel;
  vider.addEventListener('click', ev=>{ ev.stopPropagation();
    poserEmoji(iso, per, ''); boite.remove(); });
  boite.appendChild(vider);
  /* ⚠ ON ARRÊTE LA PROPAGATION SUR LA BOÎTE ELLE-MÊME. Elle vit dans la carte,
     qui ouvre le portrait au clic : sans ça, choisir un émoji ouvrirait aussi
     le portrait du groupe par-dessus. */
  boite.addEventListener('click', ev=> ev.stopPropagation());
  ancre.appendChild(boite);
  const dehors = ev=>{ if (!boite.contains(ev.target)){ boite.remove();
    document.removeEventListener('click', dehors, true); } };
  setTimeout(()=> document.addEventListener('click', dehors, true), 0);
}

/* la petite case, dans le coin de la carte */
function caseEmoji(iso, per){
  const e=emojiDe(iso,per);
  const enveloppe=el('div','emo-case-hote');
  const b=el('button','emo-case'+(e?' emo-case--mise':''), e || '＋'); b.type='button';
  b.title = e ? 'Marque de cette période : '+e+' — toucher pour changer'
              : 'Marquer cette période (sortie, photo, fête, absence…)';
  b.setAttribute('aria-label', b.title);
  b.addEventListener('click', ev=>{ ev.stopPropagation(); ev.preventDefault();
    ouvrirChoixEmoji(iso, per, enveloppe); });
  enveloppe.appendChild(b);
  return enveloppe;
}

/* ═════════ LA CARTE — ON ENVELOPPE, ON NE RÉÉCRIT PAS ═════════ */
(function habillerLaCarte(){
  if (typeof carteDuGroupe !== 'function') return;
  const base = carteDuGroupe;
  window.carteDuGroupe = carteDuGroupe = function(iso, per, s, g){
    const b = base(iso, per, s, g);
    if (!b) return b;

    /* ── le fond : l'illustration de la feuille d'abord, le sport ensuite ──
       ⚠ PRIORITÉ À L'ILLUSTRATION (arbitrage de Joey, 3 septembre). Ce que le
       prof a mis dans son cours parle mieux de ce cours-là qu'une image de
       catalogue. Le sport est le fond PAR DÉFAUT, pas le fond imposé. */
    const illus = (typeof vignetteDuCours==='function') ? vignetteDuCours(s) : null;
    const url = illus ? illus.data : imageDuSport(g);
    b.classList.add('auj-cours--image');
    b.style.backgroundImage = fondDeCarte(g, url);
    b.style.backgroundSize = 'auto, cover';
    b.style.backgroundPosition = 'center, center right';
    b.style.backgroundRepeat = 'no-repeat, no-repeat';
    b.title = 'Voir le groupe ' + g.nom
            + (illus ? ' — fond : l’illustration de son cours' : ' — ' + nomDuSport(g));

    /* ── la vignette ne redouble plus le fond ──
       ⚠ RIEN N'EST RETIRÉ : `vignetteDuCours()` et `.crs-vue` restent entiers,
       et la vignette s'affiche toujours quand le fond est l'image du SPORT.
       Elle disparaît seulement quand elle montrerait, à 78 px, exactement ce
       que la carte porte déjà en pleine largeur. */
    if (illus){
      const v=b.querySelector('.crs-vue');
      if (v) v.hidden = true;
    }

    /* ── les pastilles : le numéro, puis le titulaire ──
       ⚠ DES PASTILLES, JAMAIS UN BANDEAU (consigne de Joey). Chacune est une
       plaque blanche compacte qui n'occupe que ses mots. Le fond est blanc et
       l'encre `--ink` (#0C1720) : le contraste vaut 17:1, donc bien au-delà des
       4,5:1 exigés — et il ne dépend PAS de la couleur du groupe, qui peut être
       n'importe quoi depuis le sélecteur libre. C'est tout l'intérêt de sortir
       ces deux mots du dégradé.
       ⚠ LE NUMÉRO EXISTAIT DÉJÀ dans `.gr .num` : on ne le duplique pas, on
       enveloppe celui qui est là. Deux numéros sur une carte, c'est un numéro
       qui finit par mentir. */
    const num = b.querySelector('.gr .num');
    if (num) num.classList.add('gr-pastille-num');

    const tit = (g.titulaire||'').trim();
    if (tit){
      const t=el('span','gr-pastille-tit', tit);
      t.title='Titulaire du groupe '+g.nom;
      const tete=b.querySelector('.gr');
      if (tete) tete.appendChild(t);
    }

    /* ── la case émoji, dans le coin ── */
    b.appendChild(caseEmoji(iso, per));
    return b;
  };
})();

/* ═════════ LE CALQUE D'ÉMOJIS SUR MA SEMAINE ET MON MOIS ═════════
   ⚠ ADDITIF, ET POSÉ APRÈS. Les deux écrans se repeignent entièrement à chaque
   visite : se greffer avant, c'est se faire balayer au premier rafraîchissement.
   Même avertissement que `groupesDansLesDeuxVues()` (proto-g3.js §6 bis). */
function emojisSurLaSemaine(){
  $$('#agendaHote .ag-case[data-iso][data-per]').forEach(c=>{
    const e=emojiDe(c.dataset.iso, +c.dataset.per);
    const vieux=c.querySelector('.emo-calque'); if (vieux) vieux.remove();
    if (!e) return;
    const z=el('span','emo-calque', e);
    z.title='Période marquée '+e;
    c.appendChild(z);
  });
}
function emojisSurLeMois(){
  $$('#moisGrille .mois-case[data-iso]').forEach(c=>{
    const iso=c.dataset.iso;
    const vieux=c.querySelector('.emo-calque-jour'); if (vieux) vieux.remove();
    /* ⚠ ON PASSE PAR `periodesAgenda()`, PAS PAR UN BALAYAGE DE CLÉS. Une
       période marquée sur une journée jamais consignée existe quand même : la
       marque est une donnée du CALENDRIER, pas de la séance. */
    const marques=(typeof periodesAgenda==='function' ? periodesAgenda() : [])
      .filter(p=>!p.pause)
      .map(p=>({per:p.n, e:emojiDe(iso, p.n)}))
      .filter(x=>x.e);
    if (!marques.length) return;
    const z=el('div','emo-calque-jour');
    marques.forEach(({per,e})=>{
      const s=el('span','emo-jour', e);
      s.title='Période '+per+' — '+e;
      z.appendChild(s);
    });
    const note=c.querySelector('.note');
    c.insertBefore(z, note || null);
  });
}
(function emojisDansLesDeuxVues(){
  if (typeof peindreAgenda==='function'){
    const base=peindreAgenda;
    window.peindreAgenda = peindreAgenda = function(){ base(); emojisSurLaSemaine(); };
  }
  if (typeof peindreMois==='function'){
    const base=peindreMois;
    window.peindreMois = peindreMois = function(){ base(); emojisSurLeMois(); };
  }
})();

/* ═════════ LE SPORT ET LE TITULAIRE SE CHOISISSENT DANS LE PORTRAIT ═════════
   ⚠ POURQUOI LÀ ET PAS DANS `modifierGroupe` (le ✎ de MES GROUPES) : c'est la
   carte du groupe qui ouvre le portrait, et c'est la carte qu'on vient
   d'habiller. On règle l'apparence là où on la voit. Le ✎ garde ses réglages —
   nom, couleur, image, élèves — rien ne lui est retiré. */
function blocApparenceDuGroupe(g){
  const box=el('div','se-cours pt-apparence');
  box.appendChild(el('h4',null,'🖼 LA CARTE DE '+g.nom));
  const dit=el('div','pt-apparence-dit');
  dit.textContent='Ce que la case de ce groupe montre dans MA JOURNÉE : '
    + 'son sport en image de fond, et le nom de son titulaire.';
  box.appendChild(dit);

  /* ── le titulaire ── */
  const ch=el('label','m-champ pt-champ');
  ch.appendChild(el('span','m-lab','Titulaire du groupe'));
  const inp=document.createElement('input');
  inp.className='m-saisie'; inp.id='ptTitulaire';
  inp.value=(g.titulaire||'');
  inp.placeholder='Ex. : Mme Tremblay — laisse vide pour ne rien afficher';
  /* ⚠ ÉCRITURE À LA SORTIE DU CHAMP, PAS À CHAQUE TOUCHE. `poserGRP` écrit tout
     le tableau des groupes en localStorage ; le faire à chaque frappe, c'est
     une écriture par lettre. La pastille se masque d'elle-même si le champ est
     vide — d'où le repère qui le dit dans l'invite. */
  const enregistrer=()=>{
    const l=GRP(), x=l.find(y=>y.id===g.id); if(!x) return;
    const v=inp.value.trim();
    if ((x.titulaire||'')===v) return;
    x.titulaire=v; poserGRP(l);
    if (typeof peindreAujourdhui==='function') peindreAujourdhui();
    if (typeof peindrePalette==='function') peindrePalette();
  };
  inp.addEventListener('blur', enregistrer);
  inp.addEventListener('keydown', ev=>{ if(ev.key==='Enter'){ ev.preventDefault(); inp.blur(); } });
  ch.appendChild(inp);
  box.appendChild(ch);

  /* ── le sport ── */
  const cs=el('div','m-champ pt-champ');
  cs.appendChild(el('span','m-lab','Son sport — l’image de fond de la carte'));
  const grille=el('div','pt-sports');
  const courant=sportDuGroupe(g);
  SPORTS.forEach(([slug,emo,nom])=>{
    const b=el('button','pt-sport'); b.type='button';
    b.setAttribute('aria-pressed', String(slug===courant));
    b.appendChild(el('span','pt-sport-emo', emo));
    b.appendChild(el('span','pt-sport-nom', nom));
    b.title = nom + (slug===SPORT_DEFAUT ? ' — le sport par défaut' : '');
    b.addEventListener('click',()=>{
      const l=GRP(), x=l.find(y=>y.id===g.id); if(!x) return;
      x.sport=slug; poserGRP(l);
      if (typeof peindreAujourdhui==='function') peindreAujourdhui();
      volet('portrait');
    });
    grille.appendChild(b);
  });
  cs.appendChild(grille);
  box.appendChild(cs);
  return box;
}

(function apparenceDansLePortrait(){
  if (typeof voletPortrait !== 'function') return;
  const base = voletPortrait;
  window.voletPortrait = voletPortrait = function(d){
    base(d);
    if (typeof seanceOuverte==='undefined' || !seanceOuverte) return;
    const {iso,per}=seanceOuverte; const s=seanceDe(iso,per); if(!s) return;
    const g=grpDe(s.gr); if(!g) return;
    /* ⚠ EN TÊTE DU VOLET, JUSTE APRÈS LA CONSIGNE. Le portrait est un long fil
       chronologique : posé en bas, ce réglage ne serait jamais trouvé. Il vient
       donc après le mot d'explication et avant les cumuls. */
    const aide=d.querySelector('.aide-un-mot');
    d.insertBefore(blocApparenceDuGroupe(g), aide ? aide.nextSibling : d.firstChild);
  };
})();
