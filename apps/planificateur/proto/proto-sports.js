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

/* ═════════ LES TRENTE SPORTS ═════════
   ⚠ LES SLUGS SONT DES NOMS DE FICHIERS, DONC DES CLÉS STABLES. Un groupe
   enregistre `sport:'hockey-cosom'` dans sa fiche ; renommer un slug rendrait
   muette la carte de tous les groupes qui l'avaient choisi. Même règle que le
   `slug` de la bibliothèque de jeux (voir CLAUDE.md).
   ⚠ L'ORDRE EST CELUI DU SÉLECTEUR, et il n'est pas alphabétique : les seize
   sports de GYMNASE d'abord — c'est là qu'un prof d'ÉPS au primaire passe ses
   journées —, puis le PLATEAU et la cour d'école, puis ce qui se fait HORS LES
   MURS. Athlétisme ferme la liste parce que c'est le DÉFAUT : on le trouve
   sans le chercher, en bout de grille, toujours à la même place.
   ⚠ TROIS ÉMOJIS SE RÉPÈTENT (🏃 pour athlétisme et jeux de poursuite) et ce
   n'est pas grave : depuis l'extension à trente, le sélecteur montre la VRAIE
   IMAGE de chaque sport. L'émoji n'est plus qu'un repli — pour l'infobulle et
   pour la tuile dont la photo n'a pas encore chargé. */
const SPORTS = [
  /* ── gymnase ── */
  ['basket',            '🏀', 'Basketball'],
  ['volley',            '🏐', 'Volleyball'],
  ['badminton',         '🏸', 'Badminton'],
  ['tennis-de-table',   '🏓', 'Tennis de table'],
  ['hockey-cosom',      '🏒', 'Hockey cosom'],
  ['handball',          '🤾', 'Handball'],
  ['kin-ball',          '🎈', 'Kin-ball'],
  ['tchoukball',        '🥎', 'Tchoukball'],
  ['gymnastique',       '🤸', 'Gymnastique'],
  ['escalade',          '🧗', 'Escalade'],
  ['danse',             '💃', 'Danse'],
  ['cirque',            '🤹', 'Cirque'],
  ['yoga',              '🧘', 'Yoga'],
  ['parachute',         '🪂', 'Parachute'],
  ['corde-a-sauter',    '🪢', 'Corde à sauter'],
  ['jeux-poursuite',    '🏃', 'Jeux de poursuite'],
  /* ── plateau et cour d'école ── */
  ['soccer',            '⚽', 'Soccer'],
  ['baseball',          '⚾', 'Baseball'],
  ['crosse',            '🥍', 'Crosse'],
  ['ultimate',          '🥏', 'Ultimate'],
  ['pickleball',        '🎾', 'Pickleball'],
  ['disque-golf',       '⛳', 'Disque-golf'],
  ['velo',              '🚲', 'Vélo'],
  /* ── hors les murs ── */
  ['natation',          '🏊', 'Natation'],
  ['patinage',          '⛸️', 'Patinage'],
  ['ski-de-fond',       '🎿', 'Ski de fond'],
  ['raquette',          '🥾', 'Raquette'],
  ['course-orientation','🧭', "Course d'orientation"],
  ['plein-air',         '🌲', 'Plein air'],
  ['athletisme',        '🏃', 'Athlétisme'],
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

/* ═════════ CHAQUE GROUPE ARRIVE AVEC SON SPORT ═════════
   Joey, 3 septembre : « c'est toi qui vas attribuer ça au groupe, dans le fond
   aléatoirement. » Sans ça, les six groupes d'une journée retombaient TOUS sur
   athlétisme : six cartes identiques, et l'image cessait d'aider à reconnaître
   son groupe — c'est-à-dire tout ce qu'on lui demande.

   ⚠ « ALÉATOIREMENT » VEUT DIRE « DISTINCT », PAS « AU HASARD ». Un vrai tirage
   donnerait deux fois le même sport un jour sur trois, et le prof verrait deux
   cartes jumelles sans comprendre pourquoi. On prend donc le premier sport
   ENCORE LIBRE, exactement comme `couleurLibre()` et `emojiLibre()` le font
   déjà pour la couleur et l'émoji (proto-seance.js) — même patron, même raison.
   Trente sports pour une poignée de groupes : la liste ne s'épuise jamais en
   pratique, et le modulo n'est là que par acquit de conscience. */
function sportLibre(liste){
  const pris=new Set((liste||[]).map(g=>g.sport).filter(Boolean));
  const dispo=SPORTS.find(s=>!pris.has(s[0]));
  return dispo ? dispo[0] : SPORTS[(liste||[]).length % SPORTS.length][0];
}


/* ═════════ LE DÉGRADÉ ═════════
   La couleur du groupe reste ce qui identifie le groupe de loin ; l'image ne
   fait que la meubler. D'où le sens du dégradé : OPAQUE À GAUCHE, où vivent les
   pastilles et le titre, LÉGER À DROITE, où l'image respire.
   ⚠ LE DÉGRADÉ EST DANS `background-image`, EMPILÉ AU-DESSUS DE LA PHOTO, et
   non en pseudo-élément. Un `::before` en `position:absolute` aurait demandé un
   `z-index` sur chaque enfant de la carte pour ne pas les recouvrir — le titre
   est un `contenteditable`, on ne l'enterre pas sous un calque. Deux couches
   dans une seule propriété : rien à empiler, rien à remonter.
   ⚠ LA FONCTION QUI POSE CE FOND EST `poserFondDeGroupe()`, PLUS BAS, et les
   TROIS écrans l'appellent — carte de MA JOURNÉE, case de MA SEMAINE, pastille
   de MON MOIS. C'est là qu'est l'uniformité que Joey demande, et non dans trois
   réglages qu'il faudrait tenir d'accord à la main. */
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
    /* la carte est la plus grande des trois surfaces : c'est elle qui laisse le
       plus de place à l'image (85 % de couleur à gauche, 25 % à droite). */
    poserFondDeGroupe(b, g, url, .85, .25);
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
    /* ⚠ LES FONDS AVANT LES ÉMOJIS. Les deux touchent la même case ; poser le
       fond réécrit `style.backgroundImage`, jamais les enfants, donc l'ordre
       n'a pas d'incidence — mais on garde le fond d'abord pour que la marque
       soit toujours la DERNIÈRE chose posée sur une case, comme sur la carte. */
    window.peindreAgenda = peindreAgenda = function(){
      base(); sportsSurLaSemaine(); emojisSurLaSemaine();
    };
  }
  if (typeof peindreMois==='function'){
    const base=peindreMois;
    window.peindreMois = peindreMois = function(){ base(); emojisSurLeMois(); };
  }
})();

/* ═════════ LE SPORT ET LE TITULAIRE SE CHOISISSENT AVEC LA COULEUR ═════════
   Joey, 3 septembre : « en haut, on choisit sa couleur, puis en même temps,
   mets un autre bouton, choisir son sport. »

   ⚠ ILS ÉTAIENT DANS LE PORTRAIT, ET C'ÉTAIT LA MAUVAISE PORTE. Joey : « tu as
   mis trente images dans la section “la carte de 202”. Ce n'est pas ce que je
   veux. » Il avait raison sur le fond : le portrait est un RELEVÉ — présences,
   cotes, notes d'élèves, période par période, et son propre bandeau dit « rien
   ne s'écrit ici ». Un sélecteur de trente tuiles y contredisait la promesse du
   volet et repoussait le fil des périodes de plusieurs écrans.
   Ils rejoignent donc « Personnaliser ce groupe » (`modifierGroupe`), où vivent
   déjà le nom, la couleur, l'image et les élèves. Une seule fenêtre pour tout
   ce qui EST le groupe ; le portrait ne fait plus que raconter ce qu'il a vécu.

   ⚠ ON SE GREFFE SUR `modifierGroupe`, ON NE LA RÉÉCRIT PAS — même patron que
   partout dans ce fichier. Elle reste intacte dans proto-seance.js. */

/* Les deux champs, posés dans la fenêtre de personnalisation. `etat` est
   l'objet de STAGING : on n'écrit rien tant que ✔ ENREGISTRER n'est pas touché,
   exactement comme les variables `coul`, `emo`, `img` et `eleves` de la
   fonction d'origine. C'est ce qui fait qu'ANNULER annule vraiment. */
function champsSportEtTitulaire(g, etat){
  const frag=document.createDocumentFragment();

  /* ── le titulaire ── */
  const ch=el('div','m-champ');
  ch.appendChild(el('span','m-lab','Titulaire du groupe'));
  const inp=document.createElement('input');
  inp.className='m-saisie'; inp.id='gTitulaire';
  inp.value=etat.titulaire;
  inp.placeholder='Ex. : Mme Tremblay — laisse vide pour ne rien afficher';
  inp.title='Son nom s’affiche dans une pastille sur la carte du groupe';
  inp.addEventListener('input',()=> etat.titulaire=inp.value);
  ch.appendChild(inp);
  frag.appendChild(ch);

  /* ── le sport : une grille de tuiles, pas une liste de mots ──
     ⚠ À NEUF SPORTS, UN NOM SUFFISAIT ; À TRENTE, NON. « Tchoukball » et
     « Kin-ball » ne disent rien à qui ne les a jamais vus, et trente lignes de
     texte se lisent une par une. Chaque tuile montre L'IMAGE que le groupe
     portera : on choisit ce qu'on voit, pas ce qu'on décode.

     ⚠ CHARGEMENT À LA DEMANDE, ET C'EST UNE EXIGENCE, PAS UNE OPTIMISATION.
     Trente images à 20–108 ko font 1,4 Mo ; les charger toutes à l'ouverture
     d'une fenêtre de réglage, sur le réseau d'une école, serait indéfendable.
       · `loading="lazy"` — le navigateur ne demande une vignette que lorsqu'elle
         approche de son conteneur de défilement ;
       · `decoding="async"` — le décodage ne bloque pas la peinture ;
       · la grille est BORNÉE ET DÉFILE (proto-papier.css), et c'est CE
         `max-height` qui fait marcher le `lazy` : sans borne, les trente tuiles
         seraient « à l'écran » d'un coup et partiraient ensemble.
     ⚠ AUCUN PRÉCHARGEMENT NULLE PART. Une carte, une case de semaine, une
     pastille de mois ne demandent QUE le sport de LEUR groupe — une `url()`
     unique dans leur `background-image`, jamais une liste. Et la vignette est
     LE MÊME FICHIER que ces fonds : dès qu'un groupe l'a choisi, il est en
     cache, et le sport courant s'affiche sans une requête de plus. */
  const cs=el('div','m-champ');
  cs.appendChild(el('span','m-lab','Son sport — l’image de fond du groupe ('+SPORTS.length+' au choix)'));
  const grille=el('div','pt-sports');
  SPORTS.forEach(([slug,emo,nom])=>{
    const b=el('button','pt-sport'); b.type='button';
    b.setAttribute('aria-pressed', String(slug===etat.sport));

    const vue=el('span','pt-sport-vue');
    /* l'émoji reste DERRIÈRE la vignette : il tient la place le temps du
       chargement, et il reste visible si le fichier venait à manquer. */
    vue.appendChild(el('span','pt-sport-emo', emo));
    const im=document.createElement('img');
    im.className='pt-sport-img';
    im.loading='lazy'; im.decoding='async';
    im.src=SPORTS_DOSSIER + slug + '.webp';
    im.alt='';
    /* une image absente ne laisse pas de cadre cassé : on la retire et l'émoji
       reprend la tuile. Le sélecteur reste utilisable sur un lot incomplet. */
    im.addEventListener('error', ()=> im.remove());
    vue.appendChild(im);
    b.appendChild(vue);

    b.appendChild(el('span','pt-sport-nom', nom));
    b.title = nom + (slug===SPORT_DEFAUT ? ' — le sport par défaut' : '');
    b.addEventListener('click', ev=>{
      ev.preventDefault();
      etat.sport=slug;
      [...grille.children].forEach(x=> x.setAttribute('aria-pressed','false'));
      b.setAttribute('aria-pressed','true');
    });
    grille.appendChild(b);
  });
  cs.appendChild(grille);
  frag.appendChild(cs);
  return frag;
}

(function apparenceDansPersonnaliser(){
  if (typeof modifierGroupe !== 'function') return;
  const base = modifierGroupe;
  window.modifierGroupe = modifierGroupe = function(id){
    base(id);
    const g = (typeof grpDe==='function') ? grpDe(id) : null;
    if (!g) return;
    const corps = $('#modaleCorps'); if (!corps) return;
    const etat = {sport: sportDuGroupe(g), titulaire: (g.titulaire||'')};

    /* ⚠ APRÈS « Son image », AVANT « Ses élèves ». L'ordre de la fenêtre suit
       ce qu'on voit sur la carte, du plus gros au plus fin : la couleur, puis
       l'image du groupe, puis son sport, puis qui l'enseigne. La liste des
       élèves ferme, comme avant — c'est la plus longue. */
    const eleves = corps.querySelector('#gEleves');
    const ancre = eleves ? eleves.closest('.m-champ') : null;
    const champs = champsSportEtTitulaire(g, etat);
    if (ancre && ancre.parentNode) ancre.parentNode.insertBefore(champs, ancre);
    else corps.appendChild(champs);

    /* ⚠ ON COMMET EN PHASE DE CAPTURE, SUR UN ANCÊTRE. La fonction d'origine a
       son propre écouteur sur `#gOk`, qui termine par `fermerModale()` — donc
       vide `#modaleCorps`. Un écouteur ajouté sur `#gOk` lui-même ne servirait
       à rien : sur l'élément CIBLE, capture et bulle partent dans l'ordre
       d'INSCRIPTION, pas dans l'ordre des phases, et le nôtre passerait après
       la fermeture. Sur un ancêtre, la capture précède la cible : on écrit nos
       deux champs, puis la fonction d'origine relit `GRP()` — qui les contient
       déjà — et pose le reste. Aucun des deux n'écrase l'autre. */
    corps.addEventListener('click', ev=>{
      if (!ev.target.closest('#gOk')) return;
      const l=GRP(), x=l.find(y=>y.id===id); if(!x) return;
      x.sport = sportValide(etat.sport) || SPORT_DEFAUT;
      x.titulaire = etat.titulaire.trim();
      poserGRP(l);
    }, true);
  };
})();

/* ═════════ LE MÊME SPORT PARTOUT — SEMAINE ET MOIS ═════════
   Joey : « dans ma semaine, si admettons c'est marqué 202 dans le jeudi, je
   veux aussi l'image. Dans mon mois, les boutons rectangles un petit peu plus
   gros, puis mets l'image aussi. On va essayer de garder une uniformité. »

   ⚠ UNE SEULE FONCTION POSE LE FOND, ET LES TROIS ÉCRANS L'APPELLENT. La carte
   de MA JOURNÉE, la case de MA SEMAINE et la pastille de MON MOIS partagent
   `fondDeGroupe()` : même dégradé, même sens, même image. C'est là qu'est
   l'uniformité demandée — pas dans trois réglages qu'il faudrait tenir
   d'accord à la main.
   ⚠ LE DÉGRADÉ EST PLUS OPAQUE SUR LES PETITES SURFACES. Sur une pastille de
   mois, un numéro de groupe se lit sur 30 px de haut : à 25 % de couleur, la
   photo passe à travers le chiffre. L'opacité est donc un paramètre, et non une
   constante — 85→25 % sur la carte, 92→55 % sur la case, 95→70 % sur la
   pastille. Plus c'est petit, plus la couleur reprend la main : l'image devient
   une texture qui rappelle le sport, et le numéro reste le sujet. */
function fondDeGroupe(g, urlImage, aGauche, aDroite){
  const c=g.coul;
  return 'linear-gradient(100deg, ' + melange(c,aGauche) + ' 0%, '
       + melange(c,(aGauche+aDroite)/2) + ' 45%, ' + melange(c,aDroite) + ' 100%), '
       + 'url("' + urlImage + '")';
}
function poserFondDeGroupe(n, g, urlImage, aGauche, aDroite){
  n.style.backgroundImage = fondDeGroupe(g, urlImage, aGauche, aDroite);
  n.style.backgroundSize = 'auto, cover';
  n.style.backgroundPosition = 'center, center right';
  n.style.backgroundRepeat = 'no-repeat, no-repeat';
}

/* ── MA SEMAINE : la case du cours ──
   ⚠ ON DÉCORE APRÈS COUP, DEPUIS NOTRE ENVELOPPE DE `peindreAgenda`. Les cases
   sont bâties par l'enveloppe que proto-seance.js pose sur ce même peintre ;
   la nôtre étant la dernière chargée, elle passe en dernier et trouve les
   boutons déjà là, avec leur `data-iso` et leur `data-per`. */
function sportsSurLaSemaine(){
  $$('#agendaHote .ag-case[data-iso][data-per] .ag-seance').forEach(b=>{
    const c=b.closest('.ag-case');
    const s=seanceDe(c.dataset.iso, +c.dataset.per); if(!s) return;
    const g=grpDe(s.gr); if(!g) return;
    const illus=(typeof vignetteDuCours==='function') ? vignetteDuCours(s) : null;
    poserFondDeGroupe(b, g, illus ? illus.data : imageDuSport(g), .92, .55);
    b.classList.add('ag-seance--image');
  });
}

/* ── MON MOIS : la pastille du groupe ── */
(function sportSurLesPastilles(){
  if (typeof pastilleSeance !== 'function') return;
  const base = pastilleSeance;
  window.pastilleSeance = pastilleSeance = function(iso, per, s, avecPeriode){
    const b = base(iso, per, s, avecPeriode);
    if (!b) return b;
    const g = grpDe(s && s.gr); if (!g) return b;
    const illus=(typeof vignetteDuCours==='function') ? vignetteDuCours(s) : null;
    poserFondDeGroupe(b, g, illus ? illus.data : imageDuSport(g), .95, .70);
    b.classList.add('gr-pastille--image');
    b.title = b.title + ' Sport : ' + nomDuSport(g) + '.';
    return b;
  };
})();

/* ══════════════════════════════════════════════════════════════════════════
   LE RATTRAPAGE DES ANCIENS GROUPES — EN DERNIER, ET SOUS FILET (v169)
   Il donne un sport aux groupes créés avant ce lot : sans lui, ils
   s'afficheraient tous en athlétisme, ce que « chaque groupe arrive avec son
   sport » doit écarter. Une seule fois, avec un drapeau — un prof qui a CHOISI
   athlétisme pour son 202 doit le garder.

   ⚠ IL ÉTAIT EN TÊTE DE FICHIER, ET C'ÉTAIT UN DÉFAUT GRAVE. Joey, 3 septembre :
   « la carte 202 reste rose plein, sans image ni pastille. » Placé avant les
   quatre greffes — `carteDuGroupe`, `peindreAgenda`/`peindreMois`,
   `modifierGroupe`, `pastilleSeance` —, la moindre exception levée par ce
   rattrapage arrêtait le script AVANT elles. Aucune greffe ne s'installait, et
   la carte retombait sur son rendu d'origine : fond plat, numéro sans pastille,
   émoji au lieu de l'image. Le reste de l'app continuait normalement, donc rien
   ne signalait la panne. Ce sont exactement les symptômes rapportés, et je ne
   les avais pas reproduits parce que MES données ne faisaient pas lever
   l'exception — c'est tout l'intérêt de ne pas dépendre de la chance.

   DEUX VERROUS PLUTÔT QU'UN :
     1. IL PASSE EN DERNIER. Une migration de données ne doit jamais précéder ce
        qui fait marcher l'affichage ; si elle échoue, l'écran doit tenir debout.
     2. IL EST SOUS `try`. Une donnée biscornue — un trou dans le tableau des
        groupes, une entrée nulle — ne peut plus rien emporter, et elle se
        SIGNALE au lieu de disparaître en silence.
   ⚠ ET IL NE POSE SON DRAPEAU QU'EN CAS DE SUCCÈS : un rattrapage interrompu
   doit pouvoir se rejouer au prochain chargement, pas se croire fait. */
(function sportPourLesAnciensGroupes(){
  try {
    if (lire('sportsSemes', false)) return;
    if (typeof GRP !== 'function' || typeof poserGRP !== 'function') return;
    const l = GRP();
    if (!Array.isArray(l) || !l.length) return;   /* rien à semer, et rien à marquer */
    let n = 0;
    l.forEach(g => {
      if (!g || typeof g !== 'object') return;    /* une entrée nulle ne fait plus tomber le lot */
      if (!sportValide(g.sport)){ g.sport = sportLibre(l); n++; }
    });
    if (n) poserGRP(l);
    ecrire('sportsSemes', true);
  } catch (e) {
    /* ⚠ ON PARLE. Le silence est ce qui a coûté deux allers-retours : la carte
       était fausse et la console vide. */
    console.error('[proto-sports] le rattrapage des sports a échoué — '
                + 'les greffes d\'affichage, elles, sont posées.', e);
  }
})();

/* ═════════ DIRE SI LES GREFFES SONT EN PLACE ═════════
   ⚠ UN SEUL ENDROIT À REGARDER QUAND LA CARTE N'A PAS SON IMAGE. Sans ça, la
   seule façon de savoir si ce fichier a fini de s'exécuter était de comparer
   des captures d'écran. `window.protoSportsEtat()` répond en une ligne, depuis
   n'importe quelle console. */
window.protoSportsEtat = function(){
  const g = (typeof GRP==='function' ? GRP() : []);
  return {
    fichierTerminé: true,
    sports: (typeof SPORTS!=='undefined' ? SPORTS.length : 'ABSENT'),
    greffes: {
      carte:       typeof carteDuGroupe==='function'  && /poserFondDeGroupe/.test(String(carteDuGroupe)),
      semaine:     typeof peindreAgenda==='function'  && /sportsSurLaSemaine/.test(String(peindreAgenda)),
      mois:        typeof peindreMois==='function'    && /emojisSurLeMois/.test(String(peindreMois)),
      personnaliser: typeof modifierGroupe==='function' && /champsSportEtTitulaire/.test(String(modifierGroupe)),
      pastilles:   typeof pastilleSeance==='function' && /poserFondDeGroupe/.test(String(pastilleSeance)),
    },
    rattrapageFait: lire('sportsSemes', false),
    groupes: g.map(x => ({nom:x && x.nom, sport:(x && x.sport) || 'AUCUN',
                          coul:x && x.coul, aUneImage: !!(x && x.img)})),
  };
};
console.log('[proto-sports] greffes posées — `protoSportsEtat()` pour le détail.');
