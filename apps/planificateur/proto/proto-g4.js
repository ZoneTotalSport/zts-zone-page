/* ==========================================================================
   MON HORAIRE — l'horaire est le PATRON, la semaine en est le tirage.

   Joey, 31 août : « on va ajouter mon horaire, on va glisser-déposer les
   groupes dans l'horaire, et lorsque c'est placé dans mon horaire, tout dans
   ma journée, ma semaine, mon mois se place automatiquement — donc les numéros
   de groupe en haut ne serviront à rien. »

   ⚠ IL A MIS LE DOIGT SUR LE DÉFAUT DE FOND DU MODÈLE. Jusqu'ici, une séance
   n'existait que si on avait glissé un groupe dans SA case, ce jeudi-là. Un
   horaire d'ÉPS ne change pas de l'année : il fallait donc refaire le même
   geste 36 fois par groupe et par période. Personne ne fait ça.

   L'horaire devient un PATRON — (jour × période) → groupe — posé une fois.
   Chaque journée d'école le tire : `seanceDe()` rend la séance du patron
   quand rien n'est consigné à cette date. RIEN N'EST ÉCRIT tant que le prof
   n'écrit pas : la séance est virtuelle, et le premier mot la matérialise.
   C'est ce qui permet de poser un horaire pour l'année sans remplir le
   stockage de 1 400 séances vides.

   ⚠ TROIS RÈGLES QUI TIENNENT TOUT :
   1. **Ce qui est consigné gagne sur le patron.** Un remplacement, un échange,
      un groupe posé à la main ce jour-là passe devant — sinon le patron
      écraserait l'exception, et l'exception est justement ce qu'on note.
   2. **Retirer un cours tiré du patron pose une EXCEPTION**, pas un vide :
      sans ça, le patron le remettrait à la seconde suivante et le ✕ semblerait
      cassé. C'est la clé `seSaut:<iso>:p<n>`.
   3. **Un jour sans jour-cycle ne tire rien.** Congés, pédagogiques et fins de
      semaine n'ont pas de cours, quel que soit le patron.
   ========================================================================== */
'use strict';

const HOR_MODES = {
  cycle:   {lab:'Jours-cycle',        quoi:'Jour 1, Jour 2… — l’horaire suit le cycle de l’école'},
  semaine: {lab:'Jours de la semaine', quoi:'Lundi à vendredi — l’horaire est le même chaque semaine'},
};
function horModeActuel(){ return lire('horMode','cycle')==='semaine' ? 'semaine' : 'cycle'; }
function horGrilleLire(){ return lire('horGrille', {}) || {}; }
function horGrilleEcrire(g){ ecrire('horGrille', g); }

/* Les colonnes du patron, dans le mode courant. */
function horColonnes(){
  if (horModeActuel()==='semaine')
    return [1,2,3,4,5].map(j=>({cle:'d'+j, lab:JOURS_FR[j].toUpperCase()}));
  const n=(typeof longueurCycle==='function') ? longueurCycle() : 6;
  return Array.from({length:n},(_,i)=>({cle:'c'+i, lab:'JOUR '+libelleCycle(i)}));
}
/* La colonne dans laquelle tombe une date réelle.
   ⚠ On exige `cycles[iso]` DANS LES DEUX MODES : c'est la seule chose qui dise
   « il y a école ce jour-là ». Sans ça, un horaire hebdomadaire aurait posé des
   cours pendant la relâche. */
function horColonneDe(iso){
  if (!cycles[iso]) return null;
  if (horModeActuel()==='semaine'){
    const j=dateDeIso(iso).getDay();
    return (j>=1 && j<=5) ? 'd'+j : null;
  }
  const i=cyclesI[iso];
  return (i===undefined) ? null : 'c'+i;
}
function horGroupeDe(iso, per){
  const col=horColonneDe(iso); if (!col) return null;
  const id=horGrilleLire()[col+'|'+per];
  return (id && grpDe(id)) ? id : null;
}
const cleSaut = (iso,per)=> 'seSaut:'+iso+':p'+per;

/* ═════════ LE TIRAGE ═════════
   ⚠ `seanceDe()` est appelée partout — l'agenda, la journée, le mois, le plan
   de la semaine, le portrait. On l'enveloppe UNE fois, ici, et tous ces écrans
   se remplissent sans qu'aucun ne sache que l'horaire existe. */
const _seanceConsignee = seanceDe;
seanceDe = window.seanceDe = function(iso, per){
  const s=_seanceConsignee(iso, per);
  if (s) return s;                                  /* règle 1 : le consigné gagne */
  if (lire(cleSaut(iso,per), false)) return null;   /* règle 2 : l'exception tient */
  const gr=horGroupeDe(iso, per);                   /* règle 3 : incluse dans horColonneDe */
  if (!gr) return null;
  return seanceVide(gr);                            /* virtuelle : rien n'est écrit */
};
/* ⚠ PAS DE DRAPEAU SUR L'OBJET. Une première version posait `duPatron:true`
   dessus — et le drapeau se retrouvait ÉCRIT dans le stockage à la première
   modification, sur une séance qui n'avait plus rien de virtuelle. La question
   se pose au stockage, pas à l'objet. */
function seanceDuPatron(iso, per){
  return !_seanceConsignee(iso, per) && !!horGroupeDe(iso, per);
}
/* ⚠ Retirer un cours TIRÉ du patron n'efface rien — il n'y a rien à effacer.
   Sans marque d'exception, le ✕ paraissait sans effet : la case se revidait
   puis se reremplissait dans la même repeinture. */
const _poserConsignee = poserSeance;
poserSeance = window.poserSeance = function(iso, per, s){
  if (s) { try{ localStorage.removeItem(P+cleSaut(iso,per)); }catch(e){} }
  else if (horGroupeDe(iso,per)) ecrire(cleSaut(iso,per), true);
  _poserConsignee(iso, per, s);
};

/* ═════════ L'ÉCRAN ═════════ */
function peindreHoraire(){
  const h=$('#horHote'); if(!h) return;
  if (typeof GRP!=='function' || typeof horaire!=='function') return;
  h.innerHTML='';

  /* le mode : cycle ou semaine */
  const mo=el('div','pan pan--cyan');
  mo.innerHTML='<h2>Mon horaire tourne sur…</h2><div class="note-choix" id="horModes"></div>';
  h.appendChild(mo);
  const hm=$('#horModes');
  Object.entries(HOR_MODES).forEach(([k,m])=>{
    const b=el('button'); b.type='button';
    b.innerHTML='<span></span><small></small>';
    b.firstChild.textContent=m.lab; b.lastChild.textContent=m.quoi;
    b.setAttribute('aria-pressed', String(k===horModeActuel()));
    b.addEventListener('click',()=>{
      if (k===horModeActuel()) return;
      /* ⚠ Les clés de colonnes changent de forme (c0… ↔ d1…) : le patron
         écrit dans un mode ne veut plus rien dire dans l'autre. On prévient
         au lieu de le perdre en silence. */
      const n=Object.keys(horGrilleLire()).length;
      if (n && !confirm('Ton horaire a '+n+' case(s) remplie(s).\n\n'
        +'Les colonnes ne sont pas les mêmes dans les deux modes : elles seront vidées.\n\nContinuer ?')) return;
      ecrire('horMode', k); horGrilleEcrire({});
      peindreHoraire(); rafraichirToutLHoraire();
    });
    hm.appendChild(b);
  });

  /* la palette des groupes — elle a quitté la barre du haut pour vivre ICI,
     à côté de la grille où on les dépose */
  const pal=el('div','pan');
  pal.innerHTML='<h2>Mes groupes</h2>'
    +'<p style="margin:0 0 10px;font-weight:700">Glisse un groupe dans une case, ou touche-le puis touche la case.</p>'
    +'<div class="palette onglets-gr" id="horPalette"></div>';
  h.appendChild(pal);

  /* la grille du patron */
  const cols=horColonnes();
  const boite=el('div','pan');
  boite.innerHTML='<h2>Le patron de la semaine</h2>'
    +'<p style="margin:0 0 10px;font-weight:700">Posé une fois, il remplit MA JOURNÉE, MA SEMAINE et MON MOIS '
    +'pour toute l’année. Ce que tu écris un jour précis passe toujours devant.</p>';
  const g=el('div','hor-grille');
  g.style.gridTemplateColumns='minmax(120px,180px) repeat('+cols.length+',minmax(90px,1fr))';
  g.appendChild(el('div','hor-coin'));
  cols.forEach(c=> g.appendChild(el('div','hor-tete', c.lab)));

  const lignes=horaire();
  lignes.forEach((x,i)=>{
    if (x.t==='r'){
      g.appendChild(Object.assign(el('div','hor-pause', x.nom+(x.h?' · '+x.h:'')),{}));
      return;
    }
    const per=numPeriode(lignes,i);
    const lab=el('div','hor-per', x.nom || ('Période '+per));
    if (x.h) lab.appendChild(el('small',null,x.h));
    g.appendChild(lab);
    cols.forEach(c=>{
      const cle=c.cle+'|'+per;
      const cel=el('div','hor-case'); cel.dataset.cle=cle;
      const id=horGrilleLire()[cle];
      const gr=id && grpDe(id);
      if (gr){
        cel.classList.add('hor-case--plein');
        const b=el('div','hor-gr');
        b.style.background=gr.coul; b.style.color=encreSur(gr.coul);
        b.textContent=(gr.img?'':gr.emo+' ')+gr.nom;
        cel.appendChild(b);
        const x2=el('button','hor-vider','✕'); x2.type='button';
        x2.title='Retirer '+gr.nom+' de cette case du patron';
        x2.addEventListener('click', ev=>{ ev.stopPropagation();
          const t=horGrilleLire(); delete t[cle]; horGrilleEcrire(t);
          peindreHoraire(); rafraichirToutLHoraire(); });
        cel.appendChild(x2);
      } else cel.appendChild(el('span','rien','—'));

      const poser=idg=>{
        const t=horGrilleLire(); t[cle]=idg; horGrilleEcrire(t);
        peindreHoraire(); rafraichirToutLHoraire();
      };
      cel.addEventListener('dragover', ev=>{
        if (![...(ev.dataTransfer.types||[])].includes('text/zts-groupe')) return;
        ev.preventDefault(); cel.classList.add('survol'); });
      cel.addEventListener('dragleave', ()=> cel.classList.remove('survol'));
      cel.addEventListener('drop', ev=>{
        const idg=ev.dataTransfer.getData('text/zts-groupe'); if(!idg) return;
        ev.preventDefault(); ev.stopPropagation(); cel.classList.remove('survol');
        poser(idg); });
      cel.addEventListener('click', ()=>{
        if (grpEnMain){ const idg=grpEnMain; grpEnMain=null; poser(idg); }
      });
      g.appendChild(cel);
    });
  });
  boite.appendChild(g);
  h.appendChild(boite);

  const compte=Object.keys(horGrilleLire()).length;
  const res=el('div','aide-un-mot');
  res.innerHTML= compte
    ? '<span class="emo">✅</span><b>'+compte+' case(s) au patron.</b> Tes journées se remplissent toutes seules.'
    : '<span class="emo">👆</span>Ton patron est vide : glisse un premier groupe dans une case, '
      +'et regarde MA SEMAINE se remplir.';
  h.appendChild(res);

  peindrePalette();
}

/* Tout ce qui lit les séances doit se repeindre quand le patron change. */
function rafraichirToutLHoraire(){
  if (typeof peindreAgenda==='function')     peindreAgenda();
  if (typeof peindreAujourdhui==='function') peindreAujourdhui();
  if (typeof peindreMois==='function'  && $('#moisGrille')) peindreMois();
  if (typeof peindreAnnee==='function' && $('#anneeHote'))  peindreAnnee();
}

/* ═════════ CHOISIR UN GROUPE SANS PALETTE ═════════
   ⚠ La palette a quitté la barre du haut : MA SEMAINE n'a plus de source à
   glisser. Une case vide ouvre donc un choix — c'est le chemin des EXCEPTIONS
   (un échange, un remplacement), le patron s'occupant du reste. */
function choisirGroupePourCase(iso, per, apres){
  const corps=ouvrirModale('Quel groupe, le '+jourLisible(iso)+' ?');
  corps.innerHTML='<div class="aide-un-mot"><span class="emo">↔️</span>'
    +'Ceci pose une <b>exception</b> pour cette date seulement. '
    +'Pour l’horaire de toute l’année, va dans <b>🕐 MON HORAIRE</b>.</div>'
    +'<div class="palette onglets-gr" id="cgListe"></div>'
    +'<div class="m-pied"><button type="button" class="mini" data-va="e-horaire" id="cgHor">🕐 MON HORAIRE</button>'
    +'<button type="button" class="mini mini--rose" data-fermer>ANNULER</button></div>';
  const h=$('#cgListe');
  GRP().forEach(g=>{
    const b=el('button','pastille-gr'); b.type='button';
    b.style.background=g.coul; b.style.color=encreSur(g.coul);
    b.textContent=(g.img?'':g.emo+' ')+g.nom;
    b.addEventListener('click',()=>{
      poserSeance(iso, per, seanceVide(g.id));
      fermerModale(); if (apres) apres();
    });
    h.appendChild(b);
  });
  $('#cgHor').addEventListener('click',()=>{ fermerModale(); allerA('e-horaire'); });
}

/* ═════════ LA PALETTE DÉMÉNAGE ═════════
   Elle vivait sous la barre du haut ; Joey : « les numéros de groupe en haut
   ne serviront à rien ». Elle vit maintenant DANS l'horaire, à côté des cases
   où on la dépose. Le carnet de notes garde ses propres jetons, et MES GROUPES
   son ✎ : rien de ce qu'elle portait n'est perdu. */
(function paletteDansLHoraire(){
  const vieux=$('#ongletsGr');
  if (vieux) vieux.remove();
})();

(function departHoraire(){
  const baseAller=window.allerA;
  window.allerA = allerA = function(id){
    baseAller(id);
    if (id==='e-horaire') peindreHoraire();
  };
  if (lire('ecran','')==='e-horaire') peindreHoraire();
})();

/* le patron peut changer sans qu'on soit sur son écran (longueur du cycle,
   horaire des périodes) : on repeint ce qui en dépend au retour */
(function horaireSuitLesPeriodes(){
  if (typeof poserHoraire!=='function') return;
  const base=poserHoraire;
  window.poserHoraire = poserHoraire = function(l){
    base(l);
    if ($('#horHote') && lire('ecran','')==='e-horaire') peindreHoraire();
  };
})();
