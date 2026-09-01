/* ==========================================================================
   LA SÉANCE — jour × période × groupe.
   ⚠ CORRECTION DE MODÈLE. Le proto rangeait tout sous (jour + groupe), donc
   UN groupe par jour. Un prof d'ÉPS voit six groupes dans une journée, un par
   période : le contexte « groupe du jour » ne pouvait pas marcher pour lui.
   La clé devient (jour + période) et le groupe est POSÉ dedans, par
   glisser-déposer. Tout ce qui appartient à ce cours — le jeu choisi avec ses
   explications et ses images, la minuterie, les présences, l'évaluation — se
   range sous cette clé, et nulle part ailleurs.
   ========================================================================== */
'use strict';

function cleNoteCase(iso, per){ return 'agnote:'+iso+':p'+per; }
const PALETTE_COUL = ['#00C2E8','#FFA200','#A3FF00','#FF0061','#8B5CF6','#25D8C0','#FFC107','#FF6B00'];
const PALETTE_EMO  = ['🏀','⚽','🏐','🏸','🤾','🎾','🥍','🏓',
                      '🏈','⚾','🥏','🏒','🏑','🤸','🏊','🚴','🤺','🥋','🧗','🤼'];

/* ═════ UNE COULEUR DIFFÉRENTE PAR GROUPE, SANS FIN ═════
   Joey, 28 août : « mets encore plus de couleurs, une couleur différente par
   groupe — il existe une infinité de couleurs. » Il avait neuf groupes et deux
   paires identiques : l'ancien code faisait `PALETTE_COUL[n % 8]`, donc le 9ᵉ
   groupe reprenait la couleur du 1ᵉʳ.
   Les huit couleurs choisies à la main passent d'abord, tant qu'il en reste
   une de libre. Ensuite on FABRIQUE : on cherche le plus grand trou dans le
   cercle des teintes déjà posées et on se place en plein milieu. Deux groupes
   n'ont donc jamais la même couleur, et l'écart se resserre doucement au lieu
   de boucler. */
function teinteDe(hex){
  const m=/^#([0-9a-fA-F]{6})$/.exec(String(hex||'')); if(!m) return null;
  const n=parseInt(m[1],16), r=(n>>16)/255, v=((n>>8)&255)/255, b=(n&255)/255;
  const max=Math.max(r,v,b), min=Math.min(r,v,b), d=max-min;
  if (!d) return null;                       /* un gris n'a pas de teinte */
  let h = (max===r) ? ((v-b)/d)%6 : (max===v) ? (b-r)/d+2 : (r-v)/d+4;
  h*=60; return (h%360+360)%360;
}
function hslHex(h,s,l){
  s/=100; l/=100;
  const k=n=>(n+h/30)%12, a=s*Math.min(l,1-l);
  const f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));
  return '#'+[f(0),f(8),f(4)].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('');
}
function couleurLibre(liste){
  const prises=new Set((liste||[]).map(g=>String(g.coul||'').toUpperCase()));
  const dispo=PALETTE_COUL.find(c=>!prises.has(c.toUpperCase()));
  if (dispo) return dispo;                   /* les huit d'abord */
  const h=(liste||[]).map(g=>teinteDe(g.coul)).filter(x=>x!==null).sort((a,b)=>a-b);
  if (!h.length) return PALETTE_COUL[0];
  let milieu=h[0]+180, plusGrand=-1;
  for (let i=0;i<h.length;i++){
    const a=h[i], b=(i+1<h.length) ? h[i+1] : h[0]+360;
    if (b-a > plusGrand){ plusGrand=b-a; milieu=a+(b-a)/2; }
  }
  const t=((milieu%360)+360)%360;
  /* La clarté suit la teinte : un jaune pur à 56 % éblouit, un bleu à 56 %
     s'assombrit trop. On les rapproche de la vivacité des huit d'origine. */
  const clarte = (t>40 && t<75) ? 50 : (t>200 && t<280) ? 62 : 56;
  return hslHex(t, 92, clarte);
}
function emojiLibre(liste){
  const pris=new Set((liste||[]).map(g=>g.emo));
  return PALETTE_EMO.find(e=>!pris.has(e)) || PALETTE_EMO[(liste||[]).length % PALETTE_EMO.length];
}
/* Rendre toutes les couleurs distinctes d'un coup — pour les groupes déjà
   créés du temps où l'on bouclait sur huit. */
function couleursToutesDifferentes(){
  const l=GRP(); const vues=new Set(), emos=new Set(); let n=0;
  l.forEach(g=>{
    const c=String(g.coul||'').toUpperCase();
    if (!c || vues.has(c)){ g.coul=couleurLibre(l); n++; }
    vues.add(String(g.coul).toUpperCase());
    if (!g.img){
      if (emos.has(g.emo)) g.emo=emojiLibre(l);
      emos.add(g.emo);
    }
  });
  poserGRP(l); peindreAgenda();
  if (seanceOuverte && $('#modale') && !$('#modale').hidden && $('#seTete')) peindreTeteSeance();
  alert(n ? n+' groupe(s) ont reçu une couleur bien à eux.' : 'Chaque groupe avait déjà sa couleur.');
}

/* Chaque groupe a sa couleur, son image, et SES élèves. */
function GRP(){
  const d = lire('grp2', null);
  if (d) return d;
  const base = [
    {id:'g1', nom:'101', coul:'#00C2E8', emo:'🏀', img:'', eleves:[0,1,2,3,4,5]},
    {id:'g2', nom:'102', coul:'#FFA200', emo:'⚽', img:'', eleves:[6,7,8,9,10,11]},
    {id:'g3', nom:'201', coul:'#A3FF00', emo:'🏐', img:'', eleves:[12,13,14,15,16,17]},
    {id:'g4', nom:'202', coul:'#FF0061', emo:'🏸', img:'', eleves:[0,6,12,1,7,13]},
  ];
  ecrire('grp2', base); return base;
}
function grpDe(id){ return GRP().find(g=>g.id===id) || null; }
function poserGRP(l){ ecrire('grp2', l); }

/* ── la séance : une case de l'agenda ── */
function cleSeance(iso, per){ return 'se:'+iso+':p'+per; }
function seanceDe(iso, per){
  return lire(cleSeance(iso,per), null);
}
function poserSeance(iso, per, s){
  if (s) ecrire(cleSeance(iso,per), s);
  else { try{ localStorage.removeItem(P+cleSeance(iso,per)); }catch(e){} }
  peindreAgenda();
}
/* Une séance neuve part de la structure d'une vraie planification :
   ARRIVÉE → ce qu'on fait pendant → FIN DU COURS. */
function seanceVide(grId){
  /* ⚠ AUCUNE DURÉE IMPOSÉE. Joey : « le temps, c'est à la discrétion de
     l'internaute ». Les étapes naissent sans durée ; il met la sienne. */
  return {gr:grId, minuterie:0, pres:{}, evalCrits:[], notes:{}, seq:0, etapes:[
    {id:1, phase:'arrivee', piece:'libre', titre:'Arrivée',      desc:'', duree:0, medias:[], fait:false},
    {id:2, phase:'pendant', piece:'libre', titre:'',             desc:'', duree:0, medias:[], fait:false},
    {id:3, phase:'fin',     piece:'libre', titre:'Fin du cours', desc:'', duree:0, medias:[], fait:false},
  ]};
}
const PHASES = [
  ['arrivee','🚪 ARRIVÉE',       'Ce qu’on fait en entrant'],
  ['pendant','🏃 PENDANT LA PÉRIODE','Les activités, dans l’ordre'],
  ['fin',    '🏁 FIN DU COURS',  'Le retour au calme, le rangement'],
];

/* ═════ LES PIÈCES — ce qu'on met DANS la planification ═════
   Joey, 28 août : « permet de choisir ce qui est dans la planification — genre
   évaluation, glisser-déposer le temps, etc. » et « permet d'enlever des
   éléments en décochant ».
   Chaque étape porte donc une `piece`. `libre` est l'activité écrite à la main ;
   les autres BRANCHENT l'étape sur une porte de la séance — la toucher pendant
   le cours ouvre cette porte. Deux gestes pour composer, pas un :
   on GLISSE une pièce dans une phase, ou on COCHE sa case en haut ; on la
   décoche pour l'enlever.
   ⚠ Les clés sont EXACTEMENT celles de `volet()` — 'minuterie', 'presences',
   'jeux', 'evaluation', 'message' — sauf 'tests', qui n'est pas un volet mais
   un écran ('e-tests'), et 'libre', qui n'ouvre rien. Renommer une clé casse
   `ouvrirPiece()` en silence. */
const PIECES = {
  libre:      {emo:'✏️', lab:'ACTIVITÉ',   titre:'',                     quoi:'À écrire soi-même',        ph:'pendant'},
  presences:  {emo:'✅', lab:'PRÉSENCES',  titre:'Prendre les présences', quoi:'Qui est là, qui a son linge', ph:'arrivee'},
  jeux:       {emo:'🎲', lab:'UN JEU',     titre:'Un jeu',               quoi:'Pigé dans la banque',       ph:'pendant'},
  evaluation: {emo:'📝', lab:'ÉVALUATION', titre:'Évaluer',              quoi:'Les critères, la grille',    ph:'pendant'},
  message:    {emo:'💬', lab:'UN MOT',     titre:'Un mot sur le cours',  quoi:'Ce qu’on retient',           ph:'fin'},
  tests:      {emo:'🏃', lab:'UN TEST',    titre:'Un test',              quoi:'Navette, Léger-Boucher',     ph:'pendant'},
};
/* ⚠ PAS DE PIÈCE « LE TEMPS » (addenda G3-FICHE-2, §3). Le temps existait en
   TROIS langages : la carte MINUTERIE de la fiche, cette pièce, et la durée de
   chaque étape. Une pièce « temps » ne représente rien qu'une étape n'ait déjà —
   toute étape a une durée. Il reste UN seul endroit : le coin ⏱ de l'étape.
   ⚠ Les séances déjà composées qui portent `piece:'minuterie'` ne cassent pas :
   `pieceDe()` retombe sur 'libre', l'étape garde son titre et sa durée. */
const ORDRE_PIECES = ['libre','presences','jeux','evaluation','message','tests'];
function pieceDe(e){ return (e && e.piece && PIECES[e.piece]) ? e.piece : 'libre'; }
let pieceEnMain = null;

/* ── l'image d'un élève : sa photo, ou sa pastille à initiales ── */
function visageDe(i){ return photoDe(i); }

/* ═════════ combien de fois chaque groupe est-il dans le PATRON ═════════
   ⚠ CE COMPTE MENTAIT DEPUIS QUE LA PALETTE A DÉMÉNAGÉ. Il regardait la
   semaine AFFICHÉE dans MA SEMAINE — ce qui avait du sens tant que la palette
   vivait au-dessus de cet agenda. Depuis qu'elle est dans 🕐 MON HORAIRE, le
   prof glisse un groupe dans le patron et attend de voir SON compte à lui
   monter ; or un groupe posé en JOUR 6 n'apparaît pas forcément dans la
   semaine que MA SEMAINE montre au même moment. Résultat : un chiffre pour
   certains groupes, rien pour d'autres, sans qu'aucune règle ne l'explique.
   On compte donc les cases du patron — ce qui est SOUS les yeux. */
function coursDuPatron(){
  const n={};
  if (typeof horGrilleLire !== 'function') return n;
  Object.values(horGrilleLire()).forEach(id=>{ if(id) n[id]=(n[id]||0)+1; });
  return n;
}

/* ═════════ AJOUTER UNE PÉRIODE LIBRE À MA SEMAINE ═════════
   Joey, 28 août : « permets d'ajouter une période libre dans le tableau ma
   semaine. » Une ligne de plus, pour ce que l'horaire officiel ne prévoit pas —
   récupération, surveillance, une période de planification.

   ⚠ ELLE S'AJOUTE TOUJOURS À LA FIN, jamais au milieu. Le NUMÉRO d'une période
   est la clé sous laquelle les séances sont rangées (`se:<jour>:p<n>`) : en
   insérer une au milieu renumérote toutes celles qui suivent, et les cours déjà
   consignés se retrouveraient dans la mauvaise case. Pour la déplacer, il y a
   le glisser-déposer de l'horaire, dans RÉGLAGES — et là, c'est un choix
   conscient. */
function ajouterPeriodeLibre(){
  if (typeof horaire !== 'function'){ alert('L’horaire n’est pas disponible.'); return; }
  const nom=prompt('Nom de cette ligne :','Période libre'); if (nom===null) return;
  const h=prompt('Ses heures, si tu veux (facultatif) :',''); if (h===null) return;
  const l=horaire();
  l.push({t:'p', nom:(nom.trim()||'Période libre'), h:h.trim(), libre:true});
  poserHoraire(l);   /* repeint l'horaire ET l'agenda */
}

/* ═════════ PLANIFIER TOUTE LA SEMAINE D'UN SEUL ÉCRAN ═════════
   Joey, 28 août : « mets un bouton planification de la semaine ; lorsqu'on
   pèse dessus, ça affiche les 2 ou 3 cours de la semaine, l'enseignant peut
   écrire ce qu'il veut en détail ; quand c'est fini d'écrire on sauvegarde et
   les cours se placent dans l'affichage semaine ; l'enseignant clique dessus,
   la planification est affichée automatiquement. »

   C'est le geste du dimanche soir : on ne veut pas ouvrir six fenêtres, on veut
   UNE page où l'on écrit ses trois cours à la suite, comme sur la feuille
   papier. Le texte s'appelle `s.plan` — libre, sans structure imposée, à côté
   des étapes qui, elles, restent structurées. Les deux cohabitent : celui qui
   veut des étapes minutées les garde, celui qui veut écrire écrit.

   ⚠ ON ENREGISTRE AUSSI À LA SORTIE DE CHAQUE ZONE, pas seulement au bouton.
   Le bouton est ce que Joey a demandé ; le `blur` est ce qui évite de perdre
   vingt minutes d'écriture sur une fenêtre fermée par erreur. */
function coursDeLaSemaineListe(){
  const out=[];
  if (typeof agLundi==='undefined' || !agLundi) return out;
  const jours=[];
  for (let i=0;i<5;i++) jours.push(isoDe(new Date(dateDeIso(agLundi).getTime()+i*UN_JOUR)));
  periodesAgenda().filter(p=>!p.pause).forEach(p=>{
    jours.forEach(j=>{ const se=seanceDe(j,p.n); if (se) out.push({iso:j, per:p.n, s:se}); });
  });
  out.sort((a,b)=> a.iso===b.iso ? a.per-b.per : (a.iso<b.iso?-1:1));
  return out;
}
function ecrirePlan(iso, per, txt){
  const se=seanceDe(iso, per); if(!se) return;
  se.plan=String(txt||'').trim();
  ecrire(cleSeance(iso, per), se);
}
function planSemaine(){
  const liste=coursDeLaSemaineListe();
  const corps=ouvrirModale('Planification de la semaine du '+jourLisible(agLundi));
  corps.innerHTML='';
  const aide=el('div','aide-un-mot');
  aide.innerHTML='<span class="emo">\u270D\ufe0f</span>Une fiche par cours de la semaine, '
    +'<b>dans la forme de ton gabarit papier</b>. Ce que tu écris ici est le cours lui-même : '
    +'il apparaît aussitôt dans <b>MA SEMAINE</b>, et un clic sur la case le rouvre.';
  corps.appendChild(aide);

  if (!liste.length){
    corps.appendChild(el('div','cahier-vide',
      'Aucun cours dans cette semaine. Glisse d’abord un groupe dans une case de l’agenda : '
      +'c’est ce qui crée un cours.'));
    const f=el('button','mini','← RETOUR À MA SEMAINE'); f.type='button';
    f.addEventListener('click',()=>{ fermerModale(); allerA('e-accueil'); });
    corps.appendChild(f);
    return;
  }

  const hote=el('div');
  liste.forEach(x=> hote.appendChild(ficheDeCours(x.iso, x.per)));
  corps.appendChild(hote);

  const pied=el('div','ps-pied');
  const ok=el('button','m-valider','✔ TERMINÉ — VOIR MA SEMAINE'); ok.type='button';
  ok.addEventListener('click',()=>{ fermerModale(); peindreAgenda(); allerA('e-accueil'); });
  const fermer=el('button','mini','FERMER'); fermer.type='button';
  fermer.addEventListener('click',()=> fermerModale());
  pied.appendChild(ok); pied.appendChild(fermer);
  pied.appendChild(el('span','cahier-vide', liste.length+' cours cette semaine'));
  corps.appendChild(pied);
}

/* ═════════ UNE FICHE DE COURS, DANS LA FORME DU GABARIT PAPIER ═════════
   Joey, 28 août, gabarit « Planification journalière » à l'appui : « selon le
   nombre de périodes dans l'horaire, ça s'affiche comme ça pour chaque groupe ;
   lorsque c'est terminé ça s'affiche automatiquement dans MA SEMAINE. »

   La feuille dit : Cours · cycle · début · durée, puis des blocs
   Titre / Descriptif / Durée / Illustration. On la reproduit à l'écran.

   ⚠ CE N'EST PAS UN NOUVEAU STOCKAGE. Chaque bloc EST une étape de la séance,
   celles-là mêmes que la planification affiche et que la minuterie lance. Écrire
   ici, c'est écrire le cours — d'où le « ça s'affiche automatiquement dans MA
   SEMAINE » : il n'y a rien à recopier, c'est la même donnée vue autrement.
   ⚠ `blur` ENREGISTRE, comme partout ailleurs dans ce proto : on ne perd pas
   vingt minutes d'écriture sur une fenêtre fermée par erreur.
   ⚠ La feuille montre TROIS blocs. On en montre au moins trois, et toujours un
   de libre à la fin : une feuille qui n'a plus de ligne vide donne l'impression
   qu'on a fini alors qu'on n'a pas commencé. */
const CYCLES_SCO = ['1er cycle','2e cycle','3e cycle'];

function heureDeLaPeriode(per){
  const p=(periodesAgenda()||[]).find(x=>x.n===per);
  return p ? (p.h||'') : '';
}
function ficheDeCours(iso, per){
  const s=seanceDe(iso,per);
  const g=grpDe(s.gr) || {nom:'Groupe retiré', coul:'#9E9E9E', emo:'❓', img:'', eleves:[]};
  const c=el('div','pap-cadre fiche');

  /* ── l'en-tête : le groupe, le jour, la période ── */
  const h=el('h4');
  h.style.background=g.coul; h.style.color=encreSur(g.coul);
  const qui=el('span','qui');
  if (g.img){ const im=document.createElement('img'); im.src=g.img; im.alt=''; qui.appendChild(im); }
  else qui.appendChild(el('span',null,g.emo));
  qui.appendChild(el('b',null,g.nom));
  h.appendChild(qui);
  h.appendChild(el('span',null, jourLisible(iso)+' · période '+per+' · '+(g.eleves||[]).length+' élèves'));
  c.appendChild(h);

  /* ── la bande « Cours · cycle · début · durée » ── */
  const bande=el('div','fiche-bande');

  const bcyc=el('div','fiche-champ');
  bcyc.appendChild(el('span','lab','Cycle'));
  const zc=el('div','fiche-cycles');
  CYCLES_SCO.forEach((nom,i)=>{
    const b=el('button','cyc-case'); b.type='button';
    const pris=!!((s.cycles||[])[i]);
    b.textContent=(pris?'☑ ':'☐ ')+nom;
    b.setAttribute('aria-pressed', String(pris));
    b.addEventListener('click',()=>{
      const se=seanceDe(iso,per); se.cycles=se.cycles||[false,false,false];
      se.cycles[i]=!se.cycles[i]; ecrire(cleSeance(iso,per), se);
      const on=se.cycles[i];
      b.textContent=(on?'☑ ':'☐ ')+nom; b.setAttribute('aria-pressed', String(on));
    });
    zc.appendChild(b);
  });
  bcyc.appendChild(zc); bande.appendChild(bcyc);

  const bdeb=el('div','fiche-champ');
  bdeb.appendChild(el('span','lab','Début du cours'));
  const deb=document.createElement('input');
  deb.className='m-saisie'; deb.value=s.debut || heureDeLaPeriode(per);
  deb.placeholder='ex. 8:00';
  deb.addEventListener('change',()=>{ const se=seanceDe(iso,per);
    se.debut=deb.value.trim(); ecrire(cleSeance(iso,per), se); });
  bdeb.appendChild(deb); bande.appendChild(bdeb);

  const bdur=el('div','fiche-champ');
  bdur.appendChild(el('span','lab','Durée totale'));
  const tot=el('div','fiche-total');
  const majTotal=()=>{ const se=seanceDe(iso,per);
    const m=Math.round((se.etapes||[]).reduce((a,e)=>a+(e.duree||0),0)/60);
    tot.textContent = m ? m+' min' : '— '; };
  majTotal();
  bdur.appendChild(tot); bande.appendChild(bdur);
  c.appendChild(bande);

  /* ── les blocs : Titre · Descriptif · Durée · Illustration ── */
  const zone=el('div','fiche-blocs');
  const redessine=()=>{
    zone.innerHTML='';
    const se=seanceDe(iso,per);
    const blocs=(se.etapes||[]).filter(e=>e.phase==='pendant');
    const n=Math.max(3, blocs.length+1);
    for (let k=0;k<n;k++) zone.appendChild(blocFiche(iso, per, blocs[k]||null, majTotal, redessine));
    const plus=el('button','mini mini--lime','＋ AJOUTER UN BLOC'); plus.type='button';
    plus.addEventListener('click',()=>{
      const y=seanceDe(iso,per);
      const nid=Math.max(0,...(y.etapes||[]).map(z=>z.id))+1;
      const der=y.etapes.map(z=>z.phase).lastIndexOf('pendant');
      y.etapes.splice(der+1,0,{id:nid,phase:'pendant',piece:'libre',titre:'',desc:'',
                               duree:0,medias:[],fait:false});
      ecrire(cleSeance(iso,per), y); redessine();
    });
    zone.appendChild(plus);
  };
  redessine();
  c.appendChild(zone);
  return c;
}

/* Un bloc. `et` vaut null pour une ligne encore vide : l'étape ne naît qu'au
   premier mot écrit — sinon la séance se remplirait d'étapes fantômes que la
   planification et la minuterie afficheraient pour rien. */
function blocFiche(iso, per, et, majTotal, redessine){
  const b=el('div','fiche-bloc');
  const gauche=el('div','fiche-g');
  const droite=el('div','fiche-d');

  const naitre=()=>{
    if (et) return et;
    const y=seanceDe(iso,per);
    const nid=Math.max(0,...(y.etapes||[]).map(z=>z.id))+1;
    const der=y.etapes.map(z=>z.phase).lastIndexOf('pendant');
    const neuf={id:nid,phase:'pendant',piece:'libre',titre:'',desc:'',duree:0,medias:[],fait:false};
    y.etapes.splice(der+1,0,neuf); ecrire(cleSeance(iso,per), y);
    et=neuf; return et;
  };
  const enregistre=(f)=>{ const y=seanceDe(iso,per); const z=etapeDe(y, naitre().id);
    if(!z) return; f(z); ecrire(cleSeance(iso,per), y); majTotal(); };

  const ct=el('div','fiche-champ');
  ct.appendChild(el('span','lab','Titre'));
  const ti=document.createElement('input'); ti.className='m-saisie';
  ti.value=(et&&et.titre)||''; ti.placeholder='Le nom de l’activité';
  ti.addEventListener('change',()=> enregistre(z=> z.titre=ti.value.trim()));
  ct.appendChild(ti); gauche.appendChild(ct);

  const cd=el('div','fiche-champ');
  cd.appendChild(el('span','lab','Descriptif'));
  const de=document.createElement('textarea'); de.className='m-saisie'; de.rows=5;
  de.value=(et&&et.desc)||''; de.placeholder='Explique-le comme à un remplaçant…';
  de.addEventListener('change',()=> enregistre(z=> z.desc=de.value));
  cd.appendChild(de); gauche.appendChild(cd);

  const cu=el('div','fiche-champ fiche-duree');
  cu.appendChild(el('span','lab','Durée'));
  const du=document.createElement('input'); du.className='m-saisie'; du.type='number';
  du.min=0; du.max=240; du.placeholder='min';
  du.value=(et&&et.duree)?Math.round(et.duree/60):'';
  du.addEventListener('change',()=> enregistre(z=> z.duree=Math.max(0,(parseInt(du.value,10)||0)*60)));
  cu.appendChild(du); gauche.appendChild(cu);

  const ci=el('div','fiche-champ');
  ci.appendChild(el('span','lab','Illustration'));
  const vig=el('div','fiche-vig');
  ((et&&et.medias)||[]).forEach((m,k)=>{
    const f=document.createElement('figure');
    if (m.type==='image'&&m.data) f.innerHTML='<img alt="" src="'+m.data+'">';
    else f.innerHTML='<div class="doc">'+(m.type==='pdf'?'📄':m.type==='video'?'🎬':'🖼️')+'</div>';
    const x=el('button','etape-sup','✕'); x.type='button'; x.title='Retirer';
    x.addEventListener('click',()=>{ enregistre(z=> z.medias.splice(k,1)); redessine(); });
    f.appendChild(x); vig.appendChild(f);
  });
  const dep=el('div','fiche-depot','＋ glisse une image ici — ou touche');
  const avale=fs=>{ if(!fs.length) return;
    const id=naitre().id;
    fs.forEach(f=> avaleFichierEtape(id, f, ()=>{ majTotal(); redessine(); })); };
  dep.addEventListener('dragover', ev=>{
    if ([...(ev.dataTransfer.types||[])].indexOf('Files')<0) return;
    ev.preventDefault(); ev.stopPropagation(); dep.classList.add('survol'); });
  dep.addEventListener('dragleave', ()=> dep.classList.remove('survol'));
  dep.addEventListener('drop', ev=>{
    ev.preventDefault(); ev.stopPropagation(); dep.classList.remove('survol');
    avale([...(ev.dataTransfer.files||[])]); });
  dep.addEventListener('click',()=>{
    const i=document.createElement('input'); i.type='file';
    i.accept='image/*,video/*,application/pdf'; i.multiple=true;
    i.addEventListener('change',()=> avale([...i.files]));
    i.click(); });
  ci.appendChild(vig); ci.appendChild(dep); droite.appendChild(ci);

  if (et){
    const sup=el('button','mini mini--rose','🗑 RETIRER CE BLOC'); sup.type='button';
    sup.addEventListener('click',()=>{
      if (!confirm('Retirer « '+(et.titre||'ce bloc')+' » ?')) return;
      const y=seanceDe(iso,per); y.etapes=y.etapes.filter(z=>z.id!==et.id);
      ecrire(cleSeance(iso,per), y); majTotal(); redessine();
    });
    droite.appendChild(sup);
  }

  b.appendChild(gauche); b.appendChild(droite);
  return b;
}

/* ═════════ la palette de groupes, au-dessus de l'agenda ═════════ */
function peindrePalette(){
  /* ⚠ LA PALETTE A QUITTÉ MA SEMAINE POUR LA BARRE DU HAUT. Joey, 31 août :
     « place tous les groupes en dessous de ma journée, ma semaine, etc. » Elle
     s'appelle `#ongletsGr` et vit sous la nav, visible partout : c'est le seul
     sélecteur de groupe de l'app, il n'a pas à disparaître selon l'écran.
     Le repli sur l'ancien emplacement reste : si le noeud n'existe pas, la
     palette se replace au-dessus de l'agenda comme avant. */
  /* ⚠ LA PALETTE N'A PLUS QU'UN SEUL HÔTE : `#horPalette`, dans 🕐 MON HORAIRE.
     Le repli d'antan la RECRÉAIT au-dessus de l'agenda dès qu'elle ne trouvait
     pas son conteneur — elle est donc réapparue sur MA SEMAINE à la seconde où
     on l'a retirée du haut de la page. Un repli qui fabrique ce qu'on vient
     d'enlever n'est pas un filet, c'est une fuite. Si l'hôte n'est pas à
     l'écran, on ne peint rien. */
  const h=$('#horPalette');
  if (!h) return;
  h.innerHTML='';
  /* ⚠ LA CONSIGNE ÉTAIT ÉCRITE DEUX FOIS SUR MA SEMAINE : ici, au-dessus des
     onglets, et juste dessous en sous-titre de l'écran. Elle ne vit plus qu'à
     un endroit — le sous-titre — et chaque onglet garde la sienne en
     info-bulle. */
  const compte=coursDuPatron();
  GRP().forEach(g=>{
    const b=el('div','pastille-gr'); b.draggable=true; b.dataset.gr=g.id;
    b.style.background=g.coul; b.style.color=encreSur(g.coul);
    /* l'intercalaire de cahier : sa languette prend la couleur du groupe */
    b.style.setProperty('--gr-coul', g.coul);
    if (g.img){ const im=document.createElement('img'); im.className='img'; im.src=g.img; im.alt=''; b.appendChild(im); }
    else b.appendChild(el('span','img',g.emo));
    b.appendChild(el('span',null,g.nom));
    const nb=compte[g.id]||0;
    /* ⚠ ON AFFICHE AUSSI LE ZÉRO. Un badge qui n'apparaît que parfois se lit
       comme un défaut — c'est exactement ce que Joey a vu. Une pastille grise
       à 0 dit « ce groupe n'est nulle part dans ton horaire », ce qui est une
       information, et non un silence. */
    const c=el('span','pastille-nb'+(nb?'':' pastille-nb--zero'), String(nb));
    c.title = nb ? nb+' case(s) dans ton horaire' : 'Ce groupe n’est pas encore dans ton horaire';
    b.appendChild(c);
    b.title=g.nom+' — '+g.eleves.length+' élèves · '
      +(nb ? nb+' case(s) dans ton horaire' : 'pas encore dans ton horaire')
      +'. Glisse-moi dans une case.';
    const m=el('button','modif','✎'); m.type='button'; m.title='Personnaliser ce groupe';
    m.addEventListener('click', e=>{ e.stopPropagation(); modifierGroupe(g.id); });
    b.appendChild(m);
    b.addEventListener('dragstart', e=>{
      b.classList.add('drag');
      e.dataTransfer.setData('text/zts-groupe', g.id);
      e.dataTransfer.effectAllowed='copy';
    });
    b.addEventListener('dragend', ()=> b.classList.remove('drag'));
    photoDeposable(b, g.id);   /* lâcher une photo dessus l'habille aussi */
    /* Sans souris : on touche le groupe, puis la case. */
    b.addEventListener('click', ()=>{
      grpEnMain = (grpEnMain===g.id) ? null : g.id;
      peindrePalette(); peindreAgenda();
    });
    /* ⚠ DEUX SIGNAUX JAUNES SUR LE MÊME OBJET, C'EST UN SEUL SIGNAL. Le
       liseré JAUNE dit « c'est le groupe dans lequel j'écris » ; celui-ci dit
       « je l'ai en main, je cherche une case » — un geste en cours, pas un
       état. Il est donc LIME, comme tout ce qui attend un dépôt dans ce proto. */
    if (grpEnMain===g.id) b.style.boxShadow='4px 4px 0 var(--noir), 0 0 0 4px var(--lime)';
    h.appendChild(b);
  });
  /* ⚠ DEUX BOUTONS DE SERVICE ONT QUITTÉ LA LIGNE DES ONGLETS. Joey : « à la
     place du bouton nouveau groupe et du bouton toutes différentes, enlève-les
     et mets juste un plus complètement à droite de cette ligne. »
     · ＋ ouvre une petite fenêtre où l'on nomme le groupe ET on choisit sa
       couleur, au lieu d'un `prompt()` qui n'en offrait aucune.
     · 🎨 TOUTES DIFFÉRENTES n'est pas perdu : il rejoint la fenêtre de
       personnalisation d'un groupe, à côté des couleurs — c'est là qu'on se
       pose la question. */
  const plus=el('button','onglet-plus','＋'); plus.type='button';
  plus.title='Ajouter un groupe — tu choisis son nom et sa couleur';
  plus.setAttribute('aria-label','Ajouter un groupe');
  plus.addEventListener('click', nouveauGroupe);
  h.appendChild(plus);
  if (grpEnMain){
    const a=el('span',null,'👆 touche une case pour y poser '+grpDe(grpEnMain).nom);
    a.style.cssText='font-family:var(--f-note);font-size:16px;color:var(--jaune)';
    h.appendChild(a);
  }
}
let grpEnMain = null;

/* Encre lisible sur une couleur de groupe.
   ⚠ Un simple seuil de luminance ne suffit pas : le rose #FF0061 tombait du
   côté « sombre » et recevait du blanc, à 3.87 seulement. On calcule les deux
   ratios et on garde le meilleur — et s'il reste sous 4.5, on fonce l'encre
   jusqu'à ce qu'elle passe. */
function encreSur(hex){
  const c={r:parseInt(hex.slice(1,3),16),g:parseInt(hex.slice(3,5),16),b:parseInt(hex.slice(5,7),16)};
  const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};
  const L=.2126*f(c.r)+.7152*f(c.g)+.0722*f(c.b);
  const ratio=l2=>{const a=Math.max(L,l2)+.05, b=Math.min(L,l2)+.05; return a/b;};
  const blanc=ratio(1), noir=ratio(0);
  if (noir>=blanc) return '#0C1720';
  if (blanc>=4.5)  return '#FFFFFF';
  /* ni l'un ni l'autre ne passe en blanc : on assombrit une teinte de la
     couleur elle-même jusqu'à franchir 4.5 — l'encre reste dans la famille. */
  for (let k=0.34; k>=0; k-=0.04){
    const t={r:Math.round(c.r*k), g:Math.round(c.g*k), b:Math.round(c.b*k)};
    const Lt=.2126*f(t.r)+.7152*f(t.g)+.0722*f(t.b);
    if ((Math.max(L,Lt)+.05)/(Math.min(L,Lt)+.05) >= 4.5)
      return '#'+[t.r,t.g,t.b].map(v=>v.toString(16).padStart(2,'0')).join('');
  }
  return '#0C1720';
}

/* ═════ AJOUTER UN GROUPE — nom ET couleur, du même geste ═════
   L'ancien bouton demandait le nom par `prompt()` et attribuait la couleur
   tout seul ; il fallait ensuite rouvrir le groupe pour la changer. Ici, on
   voit la couleur qu'on choisit pendant qu'on écrit le nom. */
function nouveauGroupe(){
  const corps=ouvrirModale('Nouveau groupe');
  const propose=couleurLibre(GRP());
  corps.innerHTML=`
    <div class="m-champ"><label class="m-lab" for="ngNom">Son nom</label>
      <input class="m-saisie" id="ngNom" placeholder="Ex. : 301" value=""></div>
    <div class="m-champ"><span class="m-lab">Sa couleur</span>
      <div class="m-personnes" id="ngCouls"></div></div>
    <div class="m-champ"><span class="m-lab">Aperçu</span>
      <div class="onglets-gr" style="padding:0"><span class="pastille-gr" id="ngApercu"></span></div></div>
    <div class="m-pied">
      <button type="button" class="m-valider" id="ngOk">✔ AJOUTER</button>
      <button type="button" class="mini" data-fermer>ANNULER</button>
    </div>`;
  let coul=propose;
  const apercu=$('#ngApercu');
  const majApercu=()=>{
    apercu.style.background=coul; apercu.style.color=encreSur(coul);
    apercu.textContent=($('#ngNom').value.trim()||'Nouveau groupe');
  };
  const hc=$('#ngCouls');
  PALETTE_COUL.forEach(c=>{
    const b=el('button','m-personne','●'); b.type='button';
    b.style.background=c; b.style.color=encreSur(c); b.style.minWidth='42px';
    b.setAttribute('aria-pressed', String(c===coul));
    b.addEventListener('click',()=>{ coul=c;
      [...hc.children].forEach(x=>{ if(x.setAttribute) x.setAttribute('aria-pressed','false'); });
      b.setAttribute('aria-pressed','true'); majApercu(); });
    hc.appendChild(b);
  });
  const libre=document.createElement('input');
  libre.type='color'; libre.className='m-personne'; libre.value=coul;
  libre.style.cssText='min-width:46px;height:34px;padding:2px;cursor:pointer';
  libre.title='N’importe quelle autre couleur';
  libre.addEventListener('input',()=>{ coul=libre.value;
    [...hc.children].forEach(x=>{ if(x.setAttribute) x.setAttribute('aria-pressed','false'); });
    majApercu(); });
  hc.appendChild(libre);
  $('#ngNom').addEventListener('input', majApercu);
  majApercu();
  $('#ngOk').addEventListener('click',()=>{
    const nom=$('#ngNom').value.trim();
    if (!nom){ $('#ngNom').focus(); return; }      /* un groupe sans nom ne se retrouve pas */
    const l=GRP();
    l.push({id:'g'+(l.length+1)+'_'+l.length, nom:nom,
            coul:coul, emo:emojiLibre(l), img:'',
            eleves:ELEVES.map((x,i)=>i).slice(0,6)});
    poserGRP(l); fermerModale(); peindrePalette(); peindreAgenda();
  });
  $('#ngNom').focus();
}

function modifierGroupe(id){
  const g=grpDe(id); if(!g) return;
  const corps=ouvrirModale('Personnaliser '+g.nom);
  corps.innerHTML=`
    <div class="m-champ"><label class="m-lab" for="gNom">Nom du groupe</label>
      <input class="m-saisie" id="gNom" value="${g.nom}"></div>
    <div class="m-champ"><span class="m-lab">Sa couleur</span><div class="m-personnes" id="gCouls"></div></div>
    <div class="m-champ"><span class="m-lab">Son image</span><div class="m-personnes" id="gEmos"></div>
      <button type="button" class="mini" id="gPhoto" style="margin-top:6px">📷 UTILISER UNE PHOTO</button>
      <button type="button" class="mini mini--jaune" id="gArc" style="margin-top:6px"
              title="Donner une couleur bien à lui à chaque groupe qui en partage une">🎨 TOUTES DIFFÉRENTES</button></div>
    <div class="m-champ"><span class="m-lab">Ses élèves (${g.eleves.length})</span>
      <div class="m-personnes" id="gEleves"></div></div>
    <div class="m-pied">
      <button type="button" class="m-valider" id="gOk">✔ ENREGISTRER</button>
      <button type="button" class="mini" data-fermer>ANNULER</button>
      <button type="button" class="mini mini--rose" id="gSup">🗑 SUPPRIMER</button>
    </div>`;
  let coul=g.coul, emo=g.emo, img=g.img, eleves=[...g.eleves];
  const hc=$('#gCouls');
  PALETTE_COUL.forEach(c=>{
    const b=el('button','m-personne'); b.type='button'; b.style.background=c; b.style.minWidth='42px';
    b.style.color=encreSur(c); b.textContent='●';
    b.setAttribute('aria-pressed',String(c===coul));
    b.addEventListener('click',()=>{ coul=c; [...hc.children].forEach(x=>x.setAttribute('aria-pressed','false')); b.setAttribute('aria-pressed','true'); });
    hc.appendChild(b);
  });
  const libre=document.createElement('input');
  libre.type='color'; libre.className='m-personne'; libre.value=coul;
  libre.style.cssText='min-width:46px;height:34px;padding:2px;cursor:pointer';
  libre.title='N’importe quelle autre couleur';
  libre.addEventListener('input',()=>{ coul=libre.value;
    [...hc.children].forEach(x=>{ if(x.setAttribute) x.setAttribute('aria-pressed','false'); }); });
  hc.appendChild(libre);
  const he=$('#gEmos');
  PALETTE_EMO.forEach(e=>{
    const b=el('button','m-personne',e); b.type='button'; b.style.fontSize='19px';
    b.setAttribute('aria-pressed',String(e===emo && !img));
    b.addEventListener('click',()=>{ emo=e; img=''; [...he.children].forEach(x=>x.setAttribute('aria-pressed','false')); b.setAttribute('aria-pressed','true'); });
    he.appendChild(b);
  });
  $('#gPhoto').addEventListener('click',()=>{
    const i=document.createElement('input'); i.type='file'; i.accept='image/*';
    i.addEventListener('change',()=>{ const f=i.files[0]; if(!f) return;
      reduireImage(f,240,.8).then(d=>{ img=d; $('#gPhoto').textContent='📷 PHOTO CHOISIE ✓';
        [...he.children].forEach(x=>x.setAttribute('aria-pressed','false')); }); });
    i.click();
  });
  const hel=$('#gEleves');
  ELEVES.forEach((nom,i)=>{
    const b=el('button','m-personne',nom); b.type='button';
    b.setAttribute('aria-pressed',String(eleves.includes(i)));
    b.addEventListener('click',()=>{
      const k=eleves.indexOf(i); if(k>=0) eleves.splice(k,1); else eleves.push(i);
      b.setAttribute('aria-pressed',String(eleves.includes(i)));
    });
    hel.appendChild(b);
  });
  $('#gOk').addEventListener('click',()=>{
    const l=GRP(); const x=l.find(y=>y.id===id);
    x.nom=$('#gNom').value.trim()||x.nom; x.coul=coul; x.emo=emo; x.img=img;
    x.eleves=eleves.sort((a,b)=>a-b);
    poserGRP(l); fermerModale(); peindrePalette(); peindreAgenda();
  });
  $('#gArc').addEventListener('click', ()=>{ fermerModale(); couleursToutesDifferentes(); });
  $('#gSup').addEventListener('click',()=>{
    if(!confirm('Supprimer le groupe '+g.nom+' ? Les séances déjà posées le garderont.')) return;
    poserGRP(GRP().filter(y=>y.id!==id)); fermerModale(); peindrePalette(); peindreAgenda();
  });
}

/* ═════════ le panneau de séance ═════════ */
let seanceOuverte = null;   // {iso, per}

function ouvrirSeance(iso, per){
  const s=seanceDe(iso,per); if(!s) return;
  const g=grpDe(s.gr) || {nom:'Groupe retiré', coul:'#9E9E9E', emo:'❓', img:'', eleves:[]};
  seanceOuverte={iso,per};
  const corps=ouvrirModale('Période '+per);
  corps.innerHTML=`
    <div class="se-tete" id="seTete">
      <button type="button" class="se-photo" id="sePhoto"></button>
      <div class="se-qui"><h3></h3><div class="quand"></div></div>
      <div class="se-parure" id="seParure"></div>
    </div>
    <div class="se-mot" id="seMot"></div>
    <div class="se-actions" id="seActions"></div>
    <div id="seDetail"></div>`;
  /* ⚠ « DÉMARRER LA SÉANCE » et « MODE TABLEAU BLANC » NE SONT PLUS ICI.
     Ils y avaient été amenés le 31 août ; Joey les a fait retirer le même jour,
     l'écran d'une période étant devenu trop chargé. Ils ne sont PAS supprimés
     pour autant — ils reprennent leur place sur MA JOURNÉE, dans la ligne
     d'outils (`#aujActions`, proto-g3.js). Le mode tableau blanc est un acquis
     du §1.2 du mandat : il ne doit jamais disparaître du proto. */
  peindreTeteSeance();
  ligneMessage();
  peindreActionsSeance();
}

/* ═════ L'EN-TÊTE DE LA SÉANCE — sa couleur, sa photo ═════
   Joey, 28 août : « dans le header, choix couleur ou choix photos ; et à la
   place d'un ballon, glisser-déposer une image de l'enseignant·e, pour
   faciliter la navigation des groupes. »
   ⚠ La couleur et la photo appartiennent au GROUPE, pas à la séance : changées
   ici, elles changent AUSSI dans la palette et dans les cases de l'agenda.
   C'est exactement le but — on reconnaît son groupe à un visage, pas à un
   ballon générique. */
/* ⚠ UN SEUL ÉTAT, UN SEUL BOUTON (G3-FICHE). Le mode de la fiche n'a pas son
   commutateur : il se LIT sur « la séance est-elle démarrée ? », l'état qu'écrit
   le bouton DÉMARRER / ARRÊTER LA SÉANCE de MA JOURNÉE (`liveEtTbi`,
   proto-fusion.js, clé `live`). Deux boutons pour un seul état, c'est deux
   vérités qui finissent par diverger. */
function seanceEnCours(){ return !!lire('live', null); }
function modeSeance(){ return seanceEnCours() ? 'seance' : 'planif'; }

/* Repeint la fiche quand la séance démarre ou s'arrête pendant qu'elle est
   ouverte : le passage d'un mode à l'autre doit être instantané, pas au
   prochain aller-retour. Appelée par `liveEtTbi` (proto-fusion.js). */
function majModeSeance(){
  if (typeof seanceOuverte==='undefined' || !seanceOuverte) return;
  const m=$('#modale'); if (!m || m.hidden) return;
  peindreTeteSeance();
  peindreActionsSeance();
}
window.majModeSeance = majModeSeance;

function peindreTeteSeance(){
  if (typeof seanceOuverte==='undefined' || !seanceOuverte) return;
  const {iso,per}=seanceOuverte; const s=seanceDe(iso,per); if(!s) return;
  const g=grpDe(s.gr);
  const tete=$('#seTete'); if(!tete) return;
  const coul = g ? g.coul : '#9E9E9E';
  tete.style.background=coul; tete.style.color=encreSur(coul);
  tete.querySelector('h3').textContent = g ? 'Groupe '+g.nom : 'Groupe retiré';
  /* ⚠ L'EN-TÊTE DIT LE MODE. Sans ça, rien à l'écran ne distingue « je prépare
     ce cours » de « je suis en train de le donner » — et les deux fiches n'ont
     pas les mêmes cartes. Le compteur de minutes vient du même état `live`. */
  const debut=lire('live', null);
  const enCours = debut ? ' · ● en cours depuis '+Math.floor((Date.now()-debut)/60000)+' min' : '';
  tete.querySelector('.quand').textContent =
    jourLisible(iso)+' · période '+per+' · '+((g&&g.eleves.length)||0)+' élèves'+enCours;
  tete.dataset.mode = modeSeance();

  /* ⚠ L'EN-TÊTE EST LA PORTE DU PORTRAIT (G3-FICHE). Une carte « PORTRAIT DU
     GROUPE » de plus dans la rangée disait la même chose que le nom du groupe
     écrit juste au-dessus. On touche le groupe pour voir son portrait. */
  const qui=tete.querySelector('.se-qui');
  if (qui && !qui.dataset.porte){
    qui.dataset.porte='1';
    qui.setAttribute('role','button'); qui.tabIndex=0;
    qui.title='Voir le portrait du groupe — tout ce qui a été consigné';
    const ouvrir=()=>{ if (typeof volet==='function') volet('portrait'); };
    qui.addEventListener('click', ouvrir);
    qui.addEventListener('keydown', ev=>{ if(ev.key==='Enter'||ev.key===' '){ ev.preventDefault(); ouvrir(); } });
  }

  /* ⚠ ON REMPLACE LE BOUTON, on ne le vide pas. `peindreTeteSeance()` est
     rappelée à chaque changement de couleur ou de photo : rebrancher `click`
     sur le MÊME noeud empilait les écouteurs, et le sélecteur de fichier
     s'ouvrait deux fois, puis trois. Un clone sans enfant ne garde rien. */
  const vieux=$('#sePhoto'); const ph=vieux.cloneNode(false);
  vieux.replaceWith(ph);
  ph.className='se-photo'+((g&&g.img)?'':' vide');
  if (g && g.img){ const im=document.createElement('img'); im.src=g.img; im.alt=''; ph.appendChild(im); }
  else ph.appendChild(el('span','emo', g?g.emo:'❓'));
  /* `let`, pas `const` : la cible bascule vers le tiroir 🎨 quelques lignes
     plus bas, une fois le bouton d'ouverture posé dans l'en-tête. */
  let par=$('#seParure'); par.innerHTML='';
  if (!g){ ph.title='Ce groupe a été retiré.'; return; }

  ph.title='Glisse ici une photo de l’enseignant·e ou du groupe — ou touche pour la choisir.';
  ph.addEventListener('click', ()=> choisirPhotoGroupe(g.id));
  photoDeposable(ph, g.id);

  /* ⚠ LES PASTILLES SORTENT DE L'EN-TÊTE (G3-FICHE). Neuf pastilles, un
     sélecteur de couleur et un bouton photo occupaient une bande entière de la
     fiche, au-dessus du cours — pour un réglage qu'on touche une fois par
     année. Elles vivent derrière 🎨, au même endroit, à un tap. */
  const bascule=el('button','se-coul se-coul--ouvre','🎨'); bascule.type='button';
  bascule.title='Changer la couleur ou la photo du groupe';
  bascule.setAttribute('aria-expanded','false');
  par.appendChild(bascule);
  const tiroirCoul=el('div','se-parure-tiroir'); tiroirCoul.hidden=true;
  bascule.addEventListener('click',()=>{
    tiroirCoul.hidden=!tiroirCoul.hidden;
    bascule.setAttribute('aria-expanded', String(!tiroirCoul.hidden));
  });
  par.appendChild(tiroirCoul);
  par=tiroirCoul;   /* tout ce qui suit se range dans le tiroir */

  par.appendChild(el('span','se-parure-lab','SA COULEUR'));
  PALETTE_COUL.forEach(c=>{
    const b=el('button','se-coul'); b.type='button'; b.style.background=c;
    b.setAttribute('aria-pressed', String(c===g.coul));
    b.title='Mettre le groupe '+g.nom+' de cette couleur';
    b.addEventListener('click', ()=> majGroupe(g.id, x=>x.coul=c));
    par.appendChild(b);
  });
  /* ⚠ « Il existe une infinité de couleurs » : les huit pastilles ne sont
     qu'un raccourci. Le sélecteur natif donne le reste. */
  const libre=document.createElement('input');
  libre.type='color'; libre.className='se-coul se-coul--libre'; libre.value=g.coul;
  libre.title='N’importe quelle autre couleur';
  libre.addEventListener('input', ()=> majGroupe(g.id, x=>x.coul=libre.value));
  par.appendChild(libre);
  const ph2=el('button','se-coul se-coul--photo', g.img?'✕':'📷'); ph2.type='button';
  ph2.title = g.img ? 'Retirer la photo et revenir à l’image' : 'Choisir une photo';
  ph2.addEventListener('click', ()=> g.img ? majGroupe(g.id, x=>x.img='') : choisirPhotoGroupe(g.id));
  par.appendChild(ph2);
}
/* Écrire sur un groupe, et le répercuter PARTOUT où il se montre. */
function majGroupe(id, f){
  const l=GRP(); const g=l.find(x=>x.id===id); if(!g) return;
  f(g); poserGRP(l);
  peindreAgenda();                      /* repeint aussi la palette */
  if (seanceOuverte && $('#modale') && !$('#modale').hidden) peindreTeteSeance();
}
function choisirPhotoGroupe(id){
  const i=document.createElement('input'); i.type='file'; i.accept='image/*';
  i.addEventListener('change',()=>{ const f=i.files[0]; if(f) avalePhotoGroupe(id,f); });
  i.click();
}
function avalePhotoGroupe(id, f){
  if (!/^image\//.test(f.type||'')){ alert('« '+f.name+' » n’est pas une image.'); return; }
  /* 240 px de côté : la même taille que les photos choisies dans MES GROUPES —
     assez pour une pastille, assez petit pour tenir dans localStorage. */
  reduireImage(f,240,.8).then(d=> majGroupe(id, g=>g.img=d))
                        .catch(()=> alert('Impossible de lire « '+f.name+' ».'));
}
/* Une zone où l'on peut LÂCHER la photo d'un groupe. */
function photoDeposable(n, id){
  n.addEventListener('dragover', ev=>{
    if ([...(ev.dataTransfer.types||[])].indexOf('Files')<0) return;
    ev.preventDefault(); ev.stopPropagation(); n.classList.add('survol'); });
  n.addEventListener('dragleave', ()=> n.classList.remove('survol'));
  n.addEventListener('drop', ev=>{
    const f=(ev.dataTransfer.files||[])[0]; if(!f) return;
    ev.preventDefault(); ev.stopPropagation(); n.classList.remove('survol');
    avalePhotoGroupe(id, f); });
}
function majSeance(f){
  const {iso,per}=seanceOuverte; const s=seanceDe(iso,per); f(s);
  ecrire(cleSeance(iso,per), s); peindreAgenda(); peindreActionsSeance();
}
function peindreActionsSeance(){
  const {iso,per}=seanceOuverte; const s=seanceDe(iso,per);
  const g=grpDe(s.gr)||{eleves:[]};
  const h=$('#seActions'); if(!h) return; h.innerHTML='';
  const nPres=Object.values(s.pres||{});
  const act=[
    /* L'état lit les ÉTAPES : `s.jeu` était l'ancien modèle, d'avant la
       planification en arrivée / pendant / fin. */
    {k:'cours', emo:'📋', lab:'LA PLANIFICATION',
     etat: (function(){
       const e=(s.etapes||[]); const nommees=e.filter(x=>x.titre);
       if (!nommees.length) return 'à remplir';
       const act=e.filter(x=>x.phase==='pendant'&&x.titre).map(x=>x.titre);
       const tot=Math.round(e.reduce((a,x)=>a+(x.duree||0),0)/60);
       return (act.length?act.join(' · '):'arrivée et fin seulement')
              +' — '+tot+' min · '+e.filter(x=>x.fait).length+'/'+e.length+' fait';
     })(),
     faite: (s.etapes||[]).some(x=>x.phase==='pendant'&&x.titre)},
    {k:'presences', emo:'✅', lab:'PRÉSENCES',
     etat: nPres.length ? nPres.filter(x=>x==='linge').length+' avec linge · '
           +nPres.filter(x=>x==='sans').length+' sans · '+nPres.filter(x=>x==='absent').length+' absents'
         : 'pas encore prises',
     faite: nPres.length>0},
    {k:'jeux', emo:'🎲', lab:'JEUX',
     etat:'piger dans la banque',
     faite:false},
    /* ⚠ PAS DE CARTE « MESSAGE » (G3-FICHE). Un mot sur le cours n'est pas une
       destination : c'est une ligne qu'on lit d'un coup d'œil et qu'on touche
       pour écrire. Elle vit sous l'en-tête — voir `ligneMessage()`. */
    {k:'evaluation', emo:'📝', lab:'ÉVALUER',
     /* « posée(s) », pas « à revoir » : une cote au maximum s'enregistre
        depuis que rien n'est coloré d'avance. Ce qui est SOUS le maximum se
        compte avec `cotesSousMax()`, dans le portrait. */
     /* ⚠ ÉVALUER RÉUNIT L'ÉVALUATION ET LES TESTS (G3-FICHE). C'était deux
        cartes voisines pour un seul geste : juger où en est l'élève. Les tests
        restent entiers, ils s'ouvrent depuis le volet. */
     etat: (s.evalCrits||[]).length
        ? (s.evalCrits.length+' critère(s) · '+Object.keys(s.notes||{}).length+' cote(s) posée(s)')
        : 'critères, cotes, tests',
     faite: (s.evalCrits||[]).length>0},
  ];
  /* ⚠ CHAQUE MODE SA RANGÉE (G3-FICHE) :
       ✏️ PLANIFIER  → LA PLANIFICATION · JEUX · ÉVALUER
          PRÉSENCES est masquée : on ne prend pas les présences la veille.
       ▶ EN SÉANCE  → PRÉSENCES · LA PLANIFICATION (mode suivre) · JEUX
          ÉVALUER descend en bouton secondaire : poser une cote en plein cours
          arrive, mais c'est rare — ce n'est pas une carte pleine.
     Rien n'est supprimé : ce qui n'est pas en carte reste joignable. */
  const mode=modeSeance();
  const enCarte = mode==='seance'
    ? ['presences','cours','jeux']
    : ['cours','jeux','evaluation'];
  const secondaires = mode==='seance' ? ['evaluation'] : [];
  const parCle={}; act.forEach(a=> parCle[a.k]=a);
  const acte = enCarte.map(k=>parCle[k]).filter(Boolean);

  acte.forEach(a=>{
    const b=el('button','se-action'+(a.faite?' faite':'')); b.type='button';
    b.dataset.k=a.k;
    b.innerHTML='<span class="emo"></span><span class="lab"></span><span class="etat"></span>';
    b.querySelector('.emo').textContent=a.emo;
    b.querySelector('.lab').textContent=a.lab;
    b.querySelector('.etat').textContent=a.etat;
    b.addEventListener('click',()=>volet(a.k));
    h.appendChild(b);
  });

  /* les boutons secondaires : nommés, joignables, mais pas au premier rang */
  secondaires.map(k=>parCle[k]).filter(Boolean).forEach(a=>{
    const b=el('button','mini se-secondaire'); b.type='button';
    b.dataset.k=a.k;
    b.textContent=a.emo+' '+a.lab;
    b.title=a.lab+' — '+a.etat;
    b.addEventListener('click',()=>volet(a.k));
    h.appendChild(b);
  });

  /* ⚠ Le volet retenu peut ne plus avoir sa carte après un changement de mode
     (PRÉSENCES en planification, par exemple) : on retombe alors sur le cours. */
  const retenu=lire('seVolet','cours');
  const joignable = enCarte.indexOf(retenu)>=0 || secondaires.indexOf(retenu)>=0
                    || retenu==='portrait' || retenu==='message';
  volet(joignable ? retenu : 'cours');
  decorerPortes();
}

/* Le mot sur le cours, en une ligne discrète sous l'en-tête (G3-FICHE) : on le
   LIT sans ouvrir quoi que ce soit, on le touche pour l'écrire. */
function ligneMessage(){
  const h=$('#seMot'); if(!h) return;
  const {iso,per}=seanceOuverte; const s=seanceDe(iso,per); if(!s) return;
  h.innerHTML='';
  const txt=(s.message||'').trim();
  const b=el('button','se-mot-btn'+(txt?'':' se-mot-btn--vide')); b.type='button';
  b.innerHTML='<span class="emo">💬</span><span class="t"></span>';
  b.querySelector('.t').textContent = txt || 'Un mot sur ce cours…';
  b.title = txt ? 'Modifier le mot sur ce cours' : 'Écrire un mot sur ce cours';
  b.addEventListener('click',()=> volet('message'));
  h.appendChild(b);
}

function volet(quoi){
  ecrire('seVolet', quoi);
  const {iso,per}=seanceOuverte; const s=seanceDe(iso,per);
  const g=grpDe(s.gr)||{eleves:[]};
  const d=$('#seDetail'); if(!d) return; d.innerHTML='';

  /* ⚠ LE BOUTON D'EFFACEMENT VIT ICI, plus dans le coin des cartes (G3-FICHE).
     ⚠ ET IL EST PROGRAMMÉ EN TÊTE DE FONCTION, PAS EN BAS : chaque volet se
     termine par son propre `return`, si bien qu'un `setTimeout` placé plus bas
     n'était jamais atteint pour « message », « présences » ni « cours ». Le
     minuteur à 0 ms s'exécute après la peinture synchrone du volet, donc le
     pied se pose bien en dernier, quel que soit le chemin pris. */
  const finirVolet = ()=>{
    if (typeof boutonEffacer!=='function') return;
    const b=boutonEffacer(quoi); if (!b) return;
    const pied=el('div','se-pied'); pied.appendChild(b); d.appendChild(pied);
  };
  setTimeout(finirVolet, 0);

  if (quoi==='cours' && modeSeance()==='seance'){
    /* ⚠ PENDANT LA SÉANCE, ON NE COMPOSE PLUS : ON SUIT (G3-FICHE).
       L'écran de composition — palette, phases, glisser-déposer — est l'outil du
       dimanche soir. En plein cours, on veut la liste de ce qu'on a prévu, dans
       l'ordre, cochable d'un doigt, avec le ⏱ de chaque étape à portée. Les
       cartes restent affichées : suivre son cours n'est pas une destination
       dont il faut revenir. */
    peindreSuivre(d, s, iso, per);
    return;
  }

  if (quoi==='cours'){
    /* ⚠ PLEIN ÉCRAN, PAS EMPILÉ (addenda G3-FICHE-2, §1). La rangée des neuf
       cartes reste affichée sous l'écran de composition : on y retrouvait
       PRÉSENCES, JEUX, ÉVALUATION, UN MOT et UN TEST une deuxième fois, en plus
       des pièces de la palette. Une seule chose à l'écran à la fois. */
    const cartes=$('#seActions'); if (cartes) cartes.hidden=true;
    peindrePlanification(d, s, iso, per);
    return;
  }

  if (quoi==='jeux'){
    cibleSeance={iso,per};
    fermerModale(); ouvrirTiroir(null); return;
  }

  if (quoi==='message'){
    const box=el('div','se-cours');
    box.innerHTML='<h4>💬 Un mot sur ce cours</h4>'
      +'<p style="font-family:var(--f-note);font-size:17px;margin:0 0 10px">'
      +'Ce que tu écris ici reste attaché au groupe et à la date. On le retrouve '
      +'dans MES GROUPES, avec toute l’année.</p>'
      +'<div class="desc" contenteditable id="seMsg" data-vide="Ex. : beau travail d’équipe aujourd’hui…" '
      +'style="min-height:90px"></div>';
    d.appendChild(box);
    const z=$('#seMsg'); z.textContent=s.message||'';
    z.addEventListener('input',()=> majSeanceSansRedessin(x=>x.message=z.textContent));
    z.addEventListener('blur',()=> peindreActionsSeance());
    return;
  }

  if (quoi==='minuterie'){
    const box=el('div','se-cours');
    box.innerHTML='<h4>⏱️ Minuterie de ce cours</h4>'
      +'<p style="font-family:var(--f-note);font-size:17px;margin:0 0 10px">'
      +'Écris le temps que tu veux — <b>7</b>, <b>2:30</b>, <b>1h30</b>. Les chiffres à côté ne sont que des raccourcis. '
      +'Il est <b>consigné pour le groupe '+(grpDe(s.gr)||{nom:'?'}).nom+'</b>, à cette période.</p>'
      +'<div class="minuterie" data-verrou="0" id="seMin"><span class="chrono">0:00</span>'
      +'<input class="saisie" value="0:00" aria-label="Combien de temps" title="Écris ce que tu veux : 7, 2:30, 1h30">'
      +'<button type="button" class="mini mini--lime" data-go>▶ PARTIR</button>'
      +'<span class="presets">'
      +'<button type="button" class="mini" data-set="300">5</button>'
      +'<button type="button" class="mini" data-set="600">10</button>'
      +'<button type="button" class="mini" data-set="900">15</button>'
      +'<button type="button" class="mini" data-set="1200">20</button></span></div>';
    d.appendChild(box);
    const id='seance-'+iso+'-'+per;
    if (!minuteries.has(id)) minuteries.set(id,{finA:0,reste:s.minuterie||0,tourne:false,noeud:$('#seMin')});
    else minuteries.get(id).noeud=$('#seMin');
    peindreMinuterie(id); verrou(id,false);
    box.addEventListener('click',e=>{
      const t=e.target.closest('button'); if(!t) return;
      const m=minuteries.get(id);
      if (t.dataset.go!==undefined){
        if (m.tourne){ m.tourne=false; verrou(id,false); }
        else if (m.reste>0){ m.finA=Date.now()+m.reste*1000; m.tourne=true; verrou(id,true); demarrerHorloge(); }
        peindreMinuterie(id);
      } else if (t.dataset.set!==undefined){
        poserTemps(id, +t.dataset.set);
        majSeance(x=>x.minuterie=minuteries.get(id).reste);
      }
    });
    const sai=box.querySelector('.saisie');
    sai.addEventListener('change',()=>{ const v=lireDuree(sai.value);
      if(v===null){ sai.value=mmss(minuteries.get(id).reste); return; }
      poserTemps(id,v); majSeance(x=>x.minuterie=minuteries.get(id).reste); });
    sai.value=mmss(minuteries.get(id).reste);
    return;
  }

  if (quoi==='presences'){
    /* ⚠ TOUT LE MONDE A SON LINGE PAR DÉFAUT. `pres` ne garde que les
       EXCEPTIONS : un élève absent de la table a son linge. C'est le geste
       réel d'un prof — il pointe ceux qui manquent, pas les autres. */
    const ETATS=[['linge','👕','a son linge'],['sans','🚫','pas de linge'],['absent','✗','absent']];
    const cpt={linge:0,sans:0,absent:0};
    g.eleves.forEach(i=>{ cpt[(s.pres||{})[i]||'linge']++; });
    const c=el('div','pres-compte');
    c.innerHTML='<span class="l"></span><span class="s"></span><span class="a"></span>';
    c.children[0].textContent='👕 '+cpt.linge+' avec linge';
    c.children[1].textContent='🚫 '+cpt.sans+' sans linge';
    c.children[2].textContent='✗ '+cpt.absent+' absent'+(cpt.absent>1?'s':'');
    d.appendChild(c);
    /* consigne repliée (G3-FICHE) : une ligne, le reste sous le ⓘ */
    d.appendChild(aideRepliee('👕',
      'Touche seulement ceux qui manquent.',
      'Une fois pour « pas de linge », deux fois pour « absent ». Le <b>✎</b> '
      +'d’une carte note l’élève pour cette période — la note se range dans le '
      +'portrait du groupe.', 'aideLinge'));
    const tout=el('button','mini','↺ TOUT LE MONDE A SON LINGE'); tout.type='button';
    tout.style.marginBottom='10px';
    tout.addEventListener('click',()=>{ majSeance(x=>x.pres={}); volet('presences'); });
    d.appendChild(tout);
    const gr=el('div','pres-grille');
    g.eleves.forEach(i=>{
      const et=(s.pres||{})[i]||'linge';
      const b=el('button','pres-el pres-el--'+et); b.type='button';
      const im=document.createElement('img'); im.src=visageDe(i); im.alt='';
      b.appendChild(im);
      b.appendChild(el('div','nom', ELEVES[i]));
      const e=ETATS.find(x=>x[0]===et);
      b.appendChild(el('div','etat', e[1]+' '+e[2]));
      b.title=ELEVES[i]+' — '+e[2];
      b.addEventListener('click',()=>{
        const ordre=['linge','sans','absent'];
        const k=ordre.indexOf(et);
        majSeance(x=>{ x.pres=x.pres||{}; const n=ordre[(k+1)%3];
          if (n==='linge') delete x.pres[i]; else x.pres[i]=n; });
        volet('presences');
      });
      /* ✎ noter CET élève, à CETTE période. La note file au PORTRAIT, et si
         elle est marquée « à suivre », elle remonte d'elle-même à la prochaine
         séance du groupe. Le bouton est un frère de la carte, pas un enfant :
         un <button> dans un <button> ne survit pas au navigateur. */
      const cel=el('div','pres-case'); cel.appendChild(b);
      const nte=(s.notesEl||{})[i];
      const no=el('button','pres-note'+(nte?' pres-note--pleine':''),
                  nte ? ((nte.suivi&&!nte.regle) ? '⚑' : '📌') : '✎');
      no.type='button';
      no.title = nte ? ELEVES[i]+' — '+nte.t : 'Noter '+ELEVES[i]+' pour cette période';
      no.addEventListener('click', ev=>{ ev.stopPropagation();
        if (typeof noterEleve==='function') noterEleve(i); });
      cel.appendChild(no);
      gr.appendChild(cel);
    });
    d.appendChild(gr);
    return;
  }

  if (quoi==='evaluation'){
    /* ⚠ LES TESTS SONT ICI (G3-FICHE) : ÉVALUER a absorbé la carte TESTS, mais
       l'écran `e-tests` est intact — il s'ouvre par ce bouton. C'est le même
       geste, juger où en est l'élève ; ce n'était pas deux destinations. */
    const versTests=el('button','mini mini--lime','🏃 LES TESTS — chrono, navette, Léger-Boucher');
    versTests.type='button'; versTests.style.marginBottom='12px';
    versTests.title='Ouvrir l’écran des tests';
    versTests.addEventListener('click',()=>{ fermerModale(); allerA('e-tests'); });
    d.appendChild(versTests);

    const crits=s.evalCrits||[];
    if (!crits.length){
      const aide=el('div','aide-un-mot');
      aide.innerHTML='<span class="emo">📝</span>Choisis d’abord <b>ce que tu évalues</b> aujourd’hui. Un gabarit, ou tes propres critères.';
      d.appendChild(aide);
      d.appendChild(gabarits());
      return;
    }
    const bar=el('div','ev-bar');
    const chg=el('button','mini','✎ CHANGER CE QUE J’ÉVALUE'); chg.type='button';
    /* ⚠ CE BOUTON VIDAIT `evalCrits` AVANT D'OUVRIR le choix : il fallait
       perdre sa grille pour avoir le droit de la retoucher. `choisirCriteres()`
       recharge la liste existante — on ouvre dessus, sans rien jeter. */
    chg.addEventListener('click',()=> choisirCriteres());
    bar.appendChild(chg);
    /* écrire un critère à soi sans quitter la grille */
    const champ=document.createElement('input');
    champ.className='m-saisie ev-mien';
    champ.placeholder='Un critère à moi… (Entrée pour ajouter)';
    champ.setAttribute('aria-label','Écrire un critère à moi');
    const add=el('button','mini mini--lime','+ AJOUTER'); add.type='button';
    const poser=()=>{ const v=champ.value.trim(); if(!v) return;
      majSeance(x=>{ x.evalCrits=[...(x.evalCrits||[]), 'moi|'+v]; });
      volet('evaluation'); };
    add.addEventListener('click', poser);
    champ.addEventListener('keydown', ev=>{ if(ev.key==='Enter'){ ev.preventDefault(); poser(); } });
    bar.appendChild(champ); bar.appendChild(add);
    d.appendChild(bar);

    const ech={v: facon().v};
    /* ⚠ SANS LÉGENDE, UNE CASE VIERGE NE DIT PAS CE QU'ELLE CACHE. La grille
       n'a plus qu'une case par croisement : l'ordre du tour doit être écrit
       quelque part, sinon personne ne devine qu'un deuxième clic donne « + ». */
    const leg=el('div','ev-legende');
    leg.appendChild(el('span','l','Un clic à la fois :'));
    ech.v.forEach(([sym,lab,val])=>{
      const q=el('span','p',sym); q.style.background=teinteVal(val);
      q.title=lab+' ('+val+'/100)';
      leg.appendChild(q);
    });
    const rien=el('span','p p--vide','∅'); rien.title='Rien de noté';
    leg.appendChild(rien);
    leg.appendChild(el('span','l','puis on recommence. Clic droit : reculer.'));
    d.appendChild(leg);

    const t=el('table','gril');
    const th=el('tr'); th.appendChild(el('th',null,'Élève'));
    crits.forEach(c=>{
      const h=el('th');
      const amoi = String(c).indexOf('moi|')===0;
      const lab=el('span','ti'+(amoi?' ti--mien':''), libelleCrit(c));
      if (amoi){
        lab.title='Renommer ce critère';
        lab.addEventListener('click',()=>{
          const v=prompt('Renommer ce critère :', libelleCrit(c)); if(v===null) return;
          const nv=v.trim(); if(!nv || nv===libelleCrit(c)) return;
          majSeance(y=>{
            y.evalCrits=(y.evalCrits||[]).map(z=> z===c ? 'moi|'+nv : z);
            /* ⚠ la clé d'une cote est `<élève>|<critère>` et le critère
               contient LUI-MÊME des « | ». On coupe au PREMIER seulement. */
            Object.keys(y.notes||{}).forEach(kk=>{
              const coupe=kk.indexOf('|');
              if (kk.slice(coupe+1)===c){
                y.notes[kk.slice(0,coupe)+'|moi|'+nv]=y.notes[kk];
                delete y.notes[kk];
              }});
          });
          volet('evaluation');
        });
      }
      h.appendChild(lab);
      const x=el('button','th-x','✕'); x.type='button';
      x.title='Retirer « '+libelleCrit(c)+' » de la grille';
      x.addEventListener('click',()=>{
        if(!confirm('Retirer « '+libelleCrit(c)+' » ?\n\nLes cotes de cette colonne seront perdues.')) return;
        majSeance(y=>{
          y.evalCrits=(y.evalCrits||[]).filter(z=>z!==c);
          Object.keys(y.notes||{}).forEach(kk=>{
            if (kk.slice(kk.indexOf('|')+1)===c) delete y.notes[kk]; });
        });
        volet('evaluation');
      });
      h.appendChild(x);
      th.appendChild(h);
    });
    const tb=el('tbody'); tb.appendChild(th);
    g.eleves.forEach(i=>{
      const tr=el('tr'); const td=el('td','el');
      const v=el('div','visage');
      const im=document.createElement('img'); im.src=visageDe(i); im.alt='';
      v.appendChild(im); v.appendChild(el('b',null,ELEVES[i]));
      td.appendChild(v); tr.appendChild(td);
      /* ═════ UNE SEULE CASE, QUI TOURNE ═════
         Joey, 28 août : « pour économiser de la place, permets de peser sur la
         petite case et les symboles apparaissent avec la bonne couleur : un
         premier clic et ++ apparaît, on repèse et ça affiche + avec l'autre
         vert, etc. »
         Cinq boutons par élève ET par critère mangeaient toute la largeur ; il
         n'en reste qu'un. Le tour : vierge → ++ → + → +/- → - → -- → vierge.
         ⚠ RIEN N'EST COLORÉ TANT QU'ON N'A PAS CLIQUÉ. La règle « tout le monde
         part au maximum » reste vraie pour LIRE une cote absente — elle ne se
         peint simplement plus d'avance.
         ⚠ Le clic droit RECULE d'un cran : sans lui, revenir de « -- » à « ++ »
         obligerait à refaire tout le tour. */
      crits.forEach(cle=>{
        const c=el('td');
        const k=i+'|'+cle;
        const cote=(s.notes||{})[k];
        const idx=(cote===undefined) ? -1 : ech.v.findIndex(x=>x[2]===cote);
        const b=el('button','ech-cycle'+(idx<0?' ech-cycle--vide':'')); b.type='button';
        b.textContent = idx>=0 ? ech.v[idx][0] : '';
        if (idx>=0) b.style.background=teinteVal(ech.v[idx][2]);
        b.title=ELEVES[i]+' — '+libelleCrit(cle)+' — '
                +(idx>=0 ? (ech.v[idx][1]||ech.v[idx][0])+' ('+ech.v[idx][2]+'/100)' : 'rien de noté')
                +'. Touche pour le cran suivant, clic droit pour reculer.';
        b.setAttribute('aria-label', b.title);
        const tourner=dir=>{
          const n=ech.v.length;
          let j=idx+dir;
          if (j>=n)  j=-1;          // après le dernier cran, la case se vide
          if (j<-1)  j=n-1;         // et en reculant depuis le vide, on repart de la fin
          majSeance(x=>{ x.notes=x.notes||{};
            if (j<0) delete x.notes[k]; else x.notes[k]=ech.v[j][2]; });
          volet('evaluation');
        };
        b.addEventListener('click',()=> tourner(1));
        b.addEventListener('contextmenu', ev=>{ ev.preventDefault(); tourner(-1); });
        c.appendChild(b); tr.appendChild(c);
      });
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    const enveloppe=el('div'); enveloppe.style.overflowX='auto'; enveloppe.appendChild(t);
    d.appendChild(enveloppe);
    return;
  }
}

/* ── les gabarits d'évaluation, réutilisables ── */
const GABARITS = [
  {nom:'🏀 Sport collectif', quoi:'Passe · démarquage · esprit sportif',
   crits:['agir|10','interagir|13','interagir|5']},
  {nom:'🤸 Habiletés motrices', quoi:'Équilibre · locomotion · manipulation',
   crits:['agir|5','agir|6','agir|7']},
  {nom:'❤️ Mode de vie sain', quoi:'Échauffement · effort · plaisir de bouger',
   crits:['sante|5','sante|12','sante|16']},
  {nom:'🤝 Travail d’équipe', quoi:'Coopération · rôles · encouragement',
   crits:['interagir|0','interagir|9','interagir|19']},
];
function gabarits(){
  const h=el('div');
  const g=el('div','ev-gab');
  GABARITS.forEach(x=>{
    const b=el('button'); b.type='button';
    b.innerHTML='<span></span><small></small>';
    b.firstChild.textContent=x.nom; b.lastChild.textContent=x.quoi;
    b.addEventListener('click',()=>{ majSeance(s=>s.evalCrits=[...x.crits]); volet('evaluation'); });
    g.appendChild(b);
  });
  h.appendChild(g);
  const perso=el('button','mini mini--jaune','✎ CHOISIR MES PROPRES CRITÈRES'); perso.type='button';
  perso.addEventListener('click',()=>choisirCriteres());
  h.appendChild(perso);
  return h;
}
/* `choisirCriteres()` est réécrit dans proto-pfeq.js : le parcours complet
   du Programme de formation, compétence → intention → thème → sous-thèmes. */

/* ── piger un jeu POUR une séance ── */
let cibleSeance = null;


/* ═════════ LA PLANIFICATION — arrivée · pendant · fin ═════════
   Joey : « arrivée (lien cliquable qui explique quoi faire) + durée, ensuite
   durant la période d'autres liens cliquables — titre de l'activité, ça
   s'affiche avec images et durée, avec crochet quand terminé — et fin du
   cours, même chose. »
   Chaque étape est donc un LIEN : on le touche, son détail s'ouvre. */
function etapeDe(s, id){ return (s.etapes||[]).find(e=>e.id===id); }

/* ── poser, déplacer, retirer une pièce ── */

/* Les séances d'avant ce chantier n'ont pas de `piece` : on la pose sans rien
   perdre. Appelé au rendu ET sur la copie enregistrée — `seanceDe()` rend un
   objet neuf à chaque appel, muter celui du rendu n'écrit rien. */
function migrerPieces(s){
  let bouge=false;
  (s.etapes||[]).forEach(e=>{ if(!e.piece){ e.piece='libre'; bouge=true; } });
  return bouge;
}
/* Où atterrit une pièce quand la phase visée est vide ? Pas au tout début :
   on respecte l'ordre ARRIVÉE → PENDANT → FIN. */
function finDePhase(etapes, ph){
  const der=etapes.map(e=>e.phase).lastIndexOf(ph);
  if (der>=0) return der+1;
  const rang=PHASES.findIndex(x=>x[0]===ph);
  for (let i=0;i<etapes.length;i++)
    if (PHASES.findIndex(x=>x[0]===etapes[i].phase) > rang) return i;
  return etapes.length;
}
function placerEtape(x, et, ph, avantId){
  let j = (avantId!=null) ? x.etapes.findIndex(y=>y.id===avantId) : -1;
  if (j<0) j = finDePhase(x.etapes, ph);
  et.phase=ph; x.etapes.splice(j,0,et);
}
function ajouterPiece(k, ph, avantId){
  const P=PIECES[k]||PIECES.libre;
  majSeance(x=>{
    const nid=Math.max(0,...x.etapes.map(y=>y.id))+1;
    placerEtape(x, {id:nid, phase:ph, piece:k, titre:P.titre||'', desc:'',
                    duree:0, medias:[], fait:false}, ph, avantId);
  });
}
function deplacerEtape(id, ph, avantId){
  if (id===avantId) return;
  majSeance(x=>{
    const i=x.etapes.findIndex(y=>y.id===id); if(i<0) return;
    const [et]=x.etapes.splice(i,1);
    placerEtape(x, et, ph, avantId);
  });
}
function etapesDeLaPiece(s, k){ return (s.etapes||[]).filter(e=>pieceDe(e)===k); }
/* Une étape où quelque chose a été écrit ne s'en va pas sans qu'on le demande. */
function etapeRemplie(e){ return !!(e.desc || (e.medias||[]).length || e.duree || e.fait); }
function retirerEtape(id){
  const {iso,per}=seanceOuverte; const s=seanceDe(iso,per);
  const e=etapeDe(s,id); if(!e) return;
  if (etapeRemplie(e) && !confirm('Retirer « '+(e.titre||PIECES[pieceDe(e)].lab)+' » de la planification ?')) return;
  majSeance(x=>x.etapes=x.etapes.filter(y=>y.id!==id));
}
/* Cocher la case d'une porte pose sa pièce ; la décocher la retire. */
function basculerPiece(k){
  const {iso,per}=seanceOuverte; const s=seanceDe(iso,per);
  const dedans=etapesDeLaPiece(s,k);
  if (!dedans.length){ ajouterPiece(k, PIECES[k].ph, null); return; }
  if (dedans.some(etapeRemplie)
      && !confirm('Retirer '+PIECES[k].lab+' de la planification ? Ce qui y est écrit sera effacé.')) return;
  const ids=dedans.map(e=>e.id);
  majSeance(x=>x.etapes=x.etapes.filter(y=>ids.indexOf(y.id)<0));
}
/* Toucher une étape branchée ouvre SA porte. */
function ouvrirPiece(k, id){
  const {iso,per}=seanceOuverte;
  if (k==='tests'){ fermerModale(); allerA('e-tests'); return; }
  if (k==='minuterie'){
    /* la durée écrite sur l'étape devient celle de la minuterie — c'est tout
       l'intérêt de glisser LE TEMPS à un endroit précis du cours. */
    const e=etapeDe(seanceDe(iso,per), id);
    if (e && e.duree){
      majSeanceSansRedessin(x=>x.minuterie=e.duree);
      volet('minuterie');
      const mid='seance-'+iso+'-'+per;
      if (minuteries.has(mid)) poserTemps(mid, e.duree);
      return;
    }
  }
  volet(k);
}
/* Le même dépôt sert aux deux gestes : poser une pièce neuve, ou déplacer une
   étape déjà là. `avantId` null = à la fin de la phase. */
function accepterDepot(n, ph, avantId, surEtape){
  /* Trois choses peuvent tomber ici : une pièce neuve, une étape qu'on déplace,
     et — sur une étape seulement — des FICHIERS. Joey : « si je mets une image
     dans planification, peut-on voir l'image ? » Oui : on la lâche sur l'étape,
     et sa vignette s'affiche dans la planification même. */
  const bon=t=>{ const l=[...(t||[])];
    return l.indexOf('text/zts-piece')>=0 || l.indexOf('text/zts-etape')>=0
        || (surEtape!=null && l.indexOf('Files')>=0); };
  n.addEventListener('dragover', ev=>{ if(!bon(ev.dataTransfer.types)) return;
    ev.preventDefault(); ev.stopPropagation(); n.classList.add('survol'); });
  n.addEventListener('dragleave', ()=> n.classList.remove('survol'));
  n.addEventListener('drop', ev=>{
    if(!bon(ev.dataTransfer.types)) return;
    ev.preventDefault(); ev.stopPropagation(); n.classList.remove('survol');
    const fs=[...(ev.dataTransfer.files||[])];
    if (surEtape!=null && fs.length){
      fs.forEach(f=> avaleFichierEtape(surEtape, f, ()=>volet('cours')));
      return;
    }
    const k=ev.dataTransfer.getData('text/zts-piece');
    if (k){ pieceEnMain=null; ajouterPiece(k, ph, avantId); return; }
    const id=parseInt(ev.dataTransfer.getData('text/zts-etape'),10);
    if (id) deplacerEtape(id, ph, avantId);
  });
}

/* ═════ COCHER CE QUI ENTRE DANS LA PLANIFICATION ═════
   Les cases de la séance portent une case à cocher : cochée, la pièce est dans
   la planification ; décochée, elle n'y est pas. Idempotent — TESTS est ajouté
   après coup par proto-annee.js, qui rappelle cette fonction. */
function decorerPortes(){
  if (typeof seanceOuverte==='undefined' || !seanceOuverte) return;
  const {iso,per}=seanceOuverte; const s=seanceDe(iso,per); if(!s) return;
  $$('.se-action[data-k]').forEach(b=>{
    const k=b.dataset.k; if (k==='cours' || !PIECES[k]) return;
    const dedans=etapesDeLaPiece(s,k).length>0;
    let c=b.querySelector('.se-case');
    if (!c){
      c=el('span','se-case'); c.setAttribute('role','checkbox'); c.tabIndex=0;
      const bascule=ev=>{ ev.stopPropagation(); ev.preventDefault(); basculerPiece(k); };
      c.addEventListener('click', bascule);
      c.addEventListener('keydown', ev=>{ if(ev.key===' '||ev.key==='Enter') bascule(ev); });
      b.appendChild(c);
    }
    c.textContent = dedans ? '☑' : '☐';
    c.setAttribute('aria-checked', String(dedans));
    c.title = (dedans?'Retirer ':'Mettre ')+PIECES[k].lab+(dedans?' de':' dans')+' la planification';
    b.classList.toggle('dans-plan', dedans);
  });
}

/* Une consigne = une ligne + un ⓘ. Dépliée la première fois seulement, puis
   repliée : on lit une consigne une fois. Même patron partout (G3-FICHE §4). */
function aideRepliee(emo, ligne, detailHtml, cle){
  const premiere = !lire(cle, false);
  const box=el('div','aide-un-mot');
  const l=el('div','aide-ligne');
  l.innerHTML='<span class="emo">'+emo+'</span><b>'+ligne+'</b>';
  const plus=el('button','aide-plus','ⓘ'); plus.type='button';
  plus.title='En savoir plus'; plus.setAttribute('aria-expanded', String(premiere));
  l.appendChild(plus); box.appendChild(l);
  const det=el('div','aide-detail'); det.innerHTML=detailHtml; det.hidden=!premiere;
  box.appendChild(det);
  plus.addEventListener('click',()=>{ det.hidden=!det.hidden;
    plus.setAttribute('aria-expanded', String(!det.hidden)); });
  if (premiere) ecrire(cle, true);
  return box;
}

/* LE DÉROULEMENT, PENDANT LE COURS. Mêmes étapes, mêmes durées, même case à
   cocher que dans la composition — mais rien à glisser et rien à ranger : on
   lit, on coche, on lance le temps. */
function peindreSuivre(d, s, iso, per){
  d.appendChild(aideRepliee('▶', 'Coche ce qui est fait.',
    'Le ⏱ de chaque étape lance la minuterie du tiroir Jeux avec sa durée. '
    +'Pour changer le cours lui-même, arrête la séance : la fiche revient en '
    +'mode planification.', 'aideSuivre'));

  const etapes=(s.etapes||[]).filter(e=> e.titre || pieceDe(e)!=='libre');
  if (!etapes.length){
    d.appendChild(el('div','cahier-vide',
      'Rien n’a été composé pour ce cours. Arrête la séance pour le préparer.'));
    return;
  }
  const total=etapes.reduce((a,e)=>a+(e.duree||0),0);
  const faits=etapes.filter(e=>e.fait).length;
  const cpt=el('div','pres-compte pres-compte--colle');
  cpt.innerHTML='<span></span><span class="l"></span>';
  cpt.children[0].textContent = total ? '⏱️ '+Math.round(total/60)+' min prévues' : '⏱️ sans durée';
  cpt.children[1].textContent='✔ '+faits+' / '+etapes.length+' fait'+(faits>1?'s':'');
  d.appendChild(cpt);

  PHASES.forEach(([ph,lab])=>{
    const liste=etapes.filter(e=>e.phase===ph);
    if (!liste.length) return;
    const box=el('div','se-cours plan-phase'); box.style.marginBottom='12px';
    box.appendChild(el('h4',null,lab));
    liste.forEach(e=>{
      const k=pieceDe(e), P=PIECES[k];
      const l=el('div','etape etape--suivre'+(e.fait?' etape--faite':''));
      const chk=el('button','etape-chk', e.fait?'✔':'○'); chk.type='button';
      chk.title=e.fait?'Pas encore fait':'C’est fait';
      chk.addEventListener('click',()=> majSeance(x=>{ const y=etapeDe(x,e.id); y.fait=!y.fait; }));
      l.appendChild(chk);

      const t=el('div','etape-suivre-t');
      t.appendChild(el('b',null,(k!=='libre'?P.emo+' ':'')+(e.titre || (k!=='libre'?P.lab:'(sans titre)'))));
      if (e.duree) t.appendChild(el('small',null,Math.round(e.duree/60)+' min'));
      l.appendChild(t);

      const go=el('button','etape-go etape-go--suivre','⏱ '+(e.duree?Math.round(e.duree/60)+' min':'—'));
      go.type='button'; go.title='Lancer cette durée dans la minuterie du tiroir Jeux';
      go.addEventListener('click',()=> lancerMinuterieEtape(e));
      l.appendChild(go);
      box.appendChild(l);
    });
    d.appendChild(box);
  });
}

/* Referme l'écran de composition et rend la main aux cartes du cours. Une seule
   porte de sortie, toujours au même endroit — c'est ce que « plein écran » veut
   dire : on ne quitte pas un écran en devinant où cliquer. */
/* Lance la durée d'une étape dans LA minuterie du tiroir Jeux — celle qui porte
   déjà le buzzer et les raccourcis. On n'en fabrique pas une deuxième : c'est
   tout l'objet de l'addenda §3, un seul langage pour le temps. */
function lancerMinuterieEtape(e){
  const sec = e && e.duree ? e.duree : 0;
  if (!sec){
    alert('Écris d’abord une durée dans le coin de cette étape (7, 2:30, 1h30…).');
    return;
  }
  fermerModale();
  ouvrirTiroir(null);
  const m = minuteries.get('tiroir');
  if (!m) return;
  poserTemps('tiroir', sec);
  m.finA = Date.now() + sec*1000; m.tourne = true;
  verrou('tiroir', true); demarrerHorloge(); peindreMinuterie('tiroir');
}

function fermerPlanification(){
  const cartes=$('#seActions'); if (cartes) cartes.hidden=false;
  const d=$('#seDetail'); if (d) d.innerHTML='';
  ecrire('seVolet', null);
}

function peindrePlanification(d, s, iso, per){
  if (!s.etapes){ majSeance(x=>{ const v=seanceVide(x.gr); x.etapes=v.etapes; x.seq=v.seq; }); return; }
  if (migrerPieces(s)) majSeanceSansRedessin(x=>migrerPieces(x));
  const total=(s.etapes||[]).reduce((a,e)=>a+(e.duree||0),0);
  const faits=(s.etapes||[]).filter(e=>e.fait).length;

  /* ── ◀ RETOUR : la seule sortie, et elle est en haut (addenda §1 et §5) ── */
  const retour=el('button','mini mini--jaune plan-retour');
  retour.type='button'; retour.textContent='◀ RETOUR';
  retour.title='Revenir aux cartes du cours';
  retour.addEventListener('click', fermerPlanification);
  d.appendChild(retour);

  /* ── la consigne, dégraissée (addenda §4) ──
     Une ligne, le reste sous un ⓘ. Elle s'affiche en entier la PREMIÈRE fois
     seulement : un enfant de 10 ans lit une consigne une fois, pas à chaque
     ouverture d'écran. */
  const premiere = !lire('aideCompose', false);
  const chapeau=el('div','aide-un-mot');
  const ligne=el('div','aide-ligne');
  ligne.innerHTML='<span class="emo">👆</span><b>Glisse une pièce dans une phase.</b>';
  const plus=el('button','aide-plus'); plus.type='button';
  plus.setAttribute('aria-expanded', String(premiere));
  plus.textContent='ⓘ'; plus.title='En savoir plus';
  ligne.appendChild(plus);
  chapeau.appendChild(ligne);
  const detail=el('div','aide-detail');
  detail.innerHTML='Une étape se glisse pour changer de place, se touche pour '
    +'s’ouvrir. Pour enlever une pièce, ouvre-la et touche ✕.';
  detail.hidden = !premiere;
  chapeau.appendChild(detail);
  plus.addEventListener('click', ()=>{
    detail.hidden = !detail.hidden;
    plus.setAttribute('aria-expanded', String(!detail.hidden));
  });
  if (premiere) ecrire('aideCompose', true);
  d.appendChild(chapeau);

  /* Ce que le prof a écrit pour ce cours, modifiable ici aussi. Le même texte
     qu'à l'écran « planification de la semaine » — une seule vérité. */
  const libre=el('div','pap-cadre pap-cadre--jaune');
  libre.style.marginBottom='12px';
  libre.appendChild(el('h4',null,'✍️ MA PLANIFICATION, EN MOTS'));
  const z=el('div','ps-zone'); z.contentEditable='true';
  z.dataset.vide='Écris ici ce que tu veux pour ce cours…';
  z.textContent=s.plan||'';
  z.addEventListener('blur',()=> ecrirePlan(iso, per, z.textContent));
  libre.appendChild(z);
  d.appendChild(libre);

  const pal=el('div','plan-palette');
  ORDRE_PIECES.forEach(k=>{
    const P=PIECES[k], n=etapesDeLaPiece(s,k).length;
    const c=el('div','plan-piece'+(pieceEnMain===k?' plan-piece--main':'')+(n?' plan-piece--dedans':''));
    c.draggable=true; c.dataset.piece=k;
    c.innerHTML='<span class="emo"></span><b></b><small></small>';
    c.querySelector('.emo').textContent=P.emo;
    c.querySelector('b').textContent=P.lab+(n>1?' ×'+n:'');
    c.querySelector('small').textContent=P.quoi;
    c.title=P.lab+' — glisse-moi dans une phase, ou touche-moi puis touche la phase.';
    c.addEventListener('dragstart', ev=>{ c.classList.add('drag');
      ev.dataTransfer.setData('text/zts-piece',k); ev.dataTransfer.effectAllowed='copy'; });
    c.addEventListener('dragend', ()=> c.classList.remove('drag'));
    /* sans souris : on touche la pièce, puis la phase. */
    c.addEventListener('click', ()=>{ pieceEnMain=(pieceEnMain===k)?null:k; volet('cours'); });
    pal.appendChild(c);
  });
  d.appendChild(pal);

  /* ⚠ COLLÉ AUX PHASES, pas flottant entre la palette et le texte (addenda §5) */
  const cpt=el('div','pres-compte pres-compte--colle');
  cpt.innerHTML='<span></span><span class="l"></span>';
  cpt.children[0].textContent = total ? '⏱️ '+Math.round(total/60)+' min au total' : '⏱️ durées à remplir';
  cpt.children[1].textContent='✔ '+faits+' / '+s.etapes.length+' terminée'+(faits>1?'s':'');
  d.appendChild(cpt);

  PHASES.forEach(([ph,lab,quoi])=>{
    const box=el('div','se-cours plan-phase'); box.style.marginBottom='12px';
    box.appendChild(el('h4',null,lab));
    const sq=el('div'); sq.style.cssText='font-family:var(--f-note);font-size:15px;color:var(--ink-soft);margin:-4px 0 8px';
    sq.textContent=quoi; box.appendChild(sq);
    accepterDepot(box, ph, null);

    const liste=s.etapes.filter(e=>e.phase===ph);
    if (!liste.length) box.appendChild(el('div','cahier-vide','Rien pour l’instant.'));
    liste.forEach(e=>{
      const k=pieceDe(e), P=PIECES[k];
      const l=el('div','etape'+(e.fait?' etape--faite':'')+(k!=='libre'?' etape--piece':''));
      l.draggable=true; l.dataset.et=e.id;
      l.addEventListener('dragstart', ev=>{ l.classList.add('drag');
        ev.dataTransfer.setData('text/zts-etape',String(e.id)); ev.dataTransfer.effectAllowed='move'; });
      l.addEventListener('dragend', ()=> l.classList.remove('drag'));
      accepterDepot(l, ph, e.id, e.id);

      const chk=el('button','etape-chk', e.fait?'✔':'○'); chk.type='button';
      chk.title=e.fait?'Marquer non terminée':'Marquer terminée';
      chk.addEventListener('click', ev=>{ ev.stopPropagation();
        majSeance(x=>{ const y=etapeDe(x,e.id); y.fait=!y.fait; }); });
      l.appendChild(chk);

      const lien=el('button','etape-lien'); lien.type='button';
      lien.innerHTML='<span class="ti"></span><span class="du"></span>';
      lien.querySelector('.ti').textContent=(k!=='libre' ? P.emo+' ' : '')
        + (e.titre || (k!=='libre' ? P.lab : '(sans titre — touche pour le nommer)'));
      lien.querySelector('.du').textContent=(e.duree ? Math.round(e.duree/60)+' min'
                                             : (k==='libre' ? 'durée à toi' : P.quoi))
        + ((e.medias||[]).length ? ' · 🖼️ '+e.medias.length : '');
      /* ── LE COIN ⏱ DE L'ÉTAPE (addenda §3) ──
         Un seul endroit pour le temps, toujours à la même place : le coin de la
         pièce, comme l'image du groupe dans la période. Le champ accepte ce
         qu'on veut y écrire — 7, 2:30, 1h30 — et ▶ lance la minuterie du tiroir
         Jeux, buzzer compris, préremplie avec cette durée. */
      const coin=el('div','etape-coin');
      const dur=document.createElement('input');
      dur.className='etape-duree'; dur.type='text';
      dur.value = e.duree ? Math.round(e.duree/60)+'' : '';
      dur.placeholder='min'; dur.title='Combien de temps ? 7, 2:30, 1h30';
      dur.setAttribute('aria-label','Durée de l’étape en minutes');
      dur.addEventListener('click', ev=> ev.stopPropagation());
      dur.addEventListener('change', ()=>{
        const sec=lireDuree(dur.value);
        majSeance(x=>{ const y=etapeDe(x,e.id); y.duree=sec; });
      });
      coin.appendChild(dur);
      const go=el('button','etape-go','▶'); go.type='button';
      go.title='Lancer cette durée dans la minuterie du tiroir Jeux';
      go.setAttribute('aria-label','Partir la minuterie');
      go.addEventListener('click', ev=>{ ev.stopPropagation(); lancerMinuterieEtape(e); });
      coin.appendChild(go);
      l.appendChild(coin);

      /* ⚠ LES IMAGES SE VOIENT ICI, pas seulement dans le détail de l'étape.
         Une planification illustrée ne sert à rien si l'illustration est à un
         clic de distance : c'est la feuille qu'on regarde en donnant le cours. */
      if ((e.medias||[]).length){
        const vig=el('span','vig');
        e.medias.slice(0,6).forEach(m=>{
          if (m.type==='image' && m.data){
            const im=document.createElement('img'); im.src=m.data; im.alt=m.nom||''; vig.appendChild(im);
          } else {
            const d=el('span','doc', m.type==='pdf'?'📄':m.type==='video'?'🎬':'🖼️');
            d.title=m.nom||''; vig.appendChild(d);
          }
        });
        if ((e.medias||[]).length>6) vig.appendChild(el('span','doc','+'+((e.medias.length)-6)));
        lien.appendChild(vig);
      }
      lien.title = ((k==='libre') ? 'Ouvrir cette activité' : 'Ouvrir ' + P.lab.toLowerCase())
                 + ' — ou lâche une image dessus';
      lien.addEventListener('click', ()=> (k==='libre') ? ouvrirEtape(e.id) : ouvrirPiece(k, e.id));
      l.appendChild(lien);

      if (k!=='libre'){
        const reg=el('button','etape-reg','✎'); reg.type='button';
        reg.title='Son titre, son explication, sa durée, ses images';
        reg.addEventListener('click', ev=>{ ev.stopPropagation(); ouvrirEtape(e.id); });
        l.appendChild(reg);
      }
      const sup=el('button','etape-sup','✕'); sup.type='button'; sup.title='Retirer de la planification';
      sup.addEventListener('click', ev=>{ ev.stopPropagation(); retirerEtape(e.id); });
      l.appendChild(sup);
      box.appendChild(l);
    });

    const dep=el('div','plan-depot'+(pieceEnMain?' plan-depot--pret':''));
    dep.textContent = pieceEnMain ? '👆 touche ici pour poser '+PIECES[pieceEnMain].lab
                                  : '＋ glisse une pièce ici';
    accepterDepot(dep, ph, null);
    dep.addEventListener('click', ()=>{ if(!pieceEnMain) return;
      const k=pieceEnMain; pieceEnMain=null; ajouterPiece(k, ph, null); });
    box.appendChild(dep);
    d.appendChild(box);
  });
}

/* ── le détail d'une étape, en second niveau de la modale ── */
function ouvrirEtape(id){
  const {iso,per}=seanceOuverte; const s=seanceDe(iso,per);
  const e=etapeDe(s,id); if(!e) return;
  const g=grpDe(s.gr)||{nom:'?'};
  const corps=ouvrirModale(e.titre || 'Activité');
  corps.innerHTML=`
    <button type="button" class="mini" id="etRetour" style="margin-bottom:12px">← RETOUR À LA PLANIFICATION</button>
    <div class="m-champ"><label class="m-lab" for="etTitre">Titre</label>
      <input class="m-saisie" id="etTitre" value=""></div>
    <div class="m-champ"><label class="m-lab" for="etDesc">Ce qu’on fait — explique-le comme à un remplaçant</label>
      <textarea class="m-saisie" id="etDesc" rows="4" style="font-family:var(--f-main);font-size:17px"></textarea></div>
    <div class="m-champ"><label class="m-lab" for="etDuree">Combien de temps ? (à ta discrétion)</label>
      <input class="m-saisie" id="etDuree" type="number" min="0" max="240" placeholder="minutes" style="width:130px"></div>
    <div class="m-champ"><span class="m-lab">Illustrations — glisse-les ici</span>
      <div class="se-illus" id="etIllus"></div>
      <div class="jr-depot" id="etDepot" style="margin-top:8px;text-align:center;padding:14px">
        ＋ glisse une image, une vidéo ou un PDF — ou touche ici</div></div>
    <div class="m-pied">
      <button type="button" class="m-valider" id="etFait"></button>
      <button type="button" class="mini mini--jaune" id="etMin">⏱️ LANCER CETTE DURÉE</button>
    </div>`;
  $('#etTitre').value=e.titre||'';
  $('#etDesc').value=e.desc||'';
  $('#etDuree').value = e.duree ? Math.round(e.duree/60) : '';
  const enregistre=()=> majSeanceSansRedessin(x=>{ const y=etapeDe(x,id);
    y.titre=$('#etTitre').value.trim(); y.desc=$('#etDesc').value;
    y.duree=Math.max(0,(parseInt($('#etDuree').value,10)||0)*60); });
  ['#etTitre','#etDesc','#etDuree'].forEach(k=> $(k).addEventListener('change', enregistre));
  const majFait=()=>{ const y=etapeDe(seanceDe(iso,per),id);
    $('#etFait').textContent = y.fait ? '✔ TERMINÉE — annuler' : '✔ MARQUER TERMINÉE';
    $('#etFait').style.background = y.fait ? '#DDE4E8' : ''; };
  $('#etFait').addEventListener('click',()=>{ enregistre();
    majSeanceSansRedessin(x=>{ const y=etapeDe(x,id); y.fait=!y.fait; }); majFait(); peindreAgenda(); });
  majFait();
  $('#etMin').addEventListener('click',()=>{ enregistre();
    majSeanceSansRedessin(x=>x.minuterie=etapeDe(x,id).duree);
    fermerModale(); ouvrirSeance(iso,per); volet('minuterie');
    const mid='seance-'+iso+'-'+per; const m=minuteries.get(mid);
    if (m){ poserTemps(mid, seanceDe(iso,per).minuterie); }
  });
  $('#etRetour').addEventListener('click',()=>{ enregistre(); fermerModale(); ouvrirSeance(iso,per); volet('cours'); });
  const zone=$('#etDepot');
  zone.addEventListener('dragover', ev=>{ if(![...(ev.dataTransfer.types||[])].includes('Files'))return;
    ev.preventDefault(); zone.style.background='#F2FFE2'; });
  zone.addEventListener('dragleave', ()=> zone.style.background='');
  zone.addEventListener('drop', ev=>{
    const fs=[...(ev.dataTransfer.files||[])]; if(!fs.length) return;
    ev.preventDefault(); zone.style.background=''; enregistre();
    fs.forEach(f=>avaleFichierEtape(id,f));
  });
  zone.addEventListener('click',()=>{
    enregistre();
    const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*,video/*,application/pdf';
    inp.addEventListener('change',()=>{ const f=inp.files[0]; if(!f) return;
      const pousse=data=> { majSeanceSansRedessin(x=>{ const y=etapeDe(x,id); y.medias=y.medias||[];
          y.medias.push({type:f.type.startsWith('video')?'video':f.type.startsWith('image')?'image':'pdf',nom:f.name,data}); });
        peindreIllus(id); };
      if (f.type.startsWith('image')) reduireImage(f,1400,.82).then(pousse).catch(()=>pousse(null));
      else if (f.size < 2.5*1024*1024){ const r=new FileReader(); r.onload=()=>pousse(r.result); r.readAsDataURL(f); }
      else { alert('« '+f.name+' » dépasse 2,5 Mo — seul le nom sera gardé.'); pousse(null); }
    });
    inp.click();
  });
  peindreIllus(id);
}
function peindreIllus(id){
  const {iso,per}=seanceOuverte;
  const e=etapeDe(seanceDe(iso,per), id); const h=$('#etIllus'); if(!h||!e) return;
  h.innerHTML='';
  (e.medias||[]).forEach((m,k)=>{
    const f=document.createElement('figure');
    if (m.type==='image'&&m.data) f.innerHTML='<img alt="" src="'+m.data+'">';
    else if (m.type==='video'&&m.data) f.innerHTML='<video src="'+m.data+'" muted controls></video>';
    else f.innerHTML='<div class="doc">'+(m.type==='pdf'?'📄':m.type==='video'?'🎬':'🖼️')+'</div>';
    const c=document.createElement('figcaption'); c.textContent=m.nom; f.appendChild(c);
    const x=el('button','etape-sup','✕'); x.type='button'; x.style.cssText='width:100%;border-radius:0';
    x.addEventListener('click',()=>{ majSeanceSansRedessin(y=>{ etapeDe(y,id).medias.splice(k,1); }); peindreIllus(id); });
    f.appendChild(x);
    h.appendChild(f);
  });
  if (!(e.medias||[]).length) h.appendChild(el('div','cahier-vide','Aucune illustration pour l’instant.'));
}
/* Écrit sans reconstruire l'écran — sinon on perdrait le focus en pleine saisie. */
function majSeanceSansRedessin(f){
  const {iso,per}=seanceOuverte; const s=seanceDe(iso,per); f(s);
  ecrire(cleSeance(iso,per), s);
}

/* ═════════ L'AGENDA ACCUEILLE LES SÉANCES ═════════ */
const _agendaBase = peindreAgenda;
peindreAgenda = function(){
  _agendaBase();
  peindrePalette();
  const tete=$('#agendaHote .agenda-tete');
  /* ⚠ LES QUATRE BOUTONS DE TAILLE ONT ÉTÉ RETIRÉS D'ICI. Joey, 31 août :
     « je n'aime pas les boutons pour afficher plus gros, enlève cela ; je veux
     juste un petit + et − complètement à droite. »
     Ils sont remplacés par deux petits boutons dans la BARRE DU HAUT, juste
     avant la roue dentelée — la taille vaut pour toute l'app, pas seulement
     pour la semaine, et cette ligne-ci n'existe que sur MA SEMAINE. */
  if (tete && !tete.querySelector('[data-libre]')){
    const b=el('button','mini','＋ PÉRIODE LIBRE'); b.type='button'; b.dataset.libre='1';
    b.title='Ajouter une ligne à ma semaine — récupération, surveillance, ce que je veux';
    b.addEventListener('click', ajouterPeriodeLibre);
    tete.appendChild(b);
  }
  if (tete && !tete.querySelector('[data-plansem]')){
    /* ⚠ IL S'APPELAIT « PLANIFICATION DE LA SEMAINE », À DIX CENTIMÈTRES DE
       « Cette semaine, j'enseigne… » : deux noms presque identiques pour deux
       choses différentes — une ligne de session d'un côté, les fiches détaillées
       de chaque cours de l'autre. Il dit maintenant ce qu'il fait. */
    const b=el('button','mini mini--lime','📝 ÉCRIRE MES COURS, UN PAR UN');
    b.type='button'; b.dataset.plansem='1';
    b.title='La fiche complète de chaque cours de la semaine, à la suite';
    b.addEventListener('click', planSemaine);
    tete.appendChild(b);
  }
  const g=$('#agendaHote .agenda-grille'); if(!g) return;
  const jours=[]; for(let i=0;i<5;i++) jours.push(isoDe(new Date(dateDeIso(agLundi).getTime()+i*UN_JOUR)));
  /* ⚠ `data-col` est posé ICI, pas déduit en CSS. Les rangées de pause
     occupent toute la largeur en un seul enfant : toute arithmétique
     `nth-child` se décale dès la première récréation. Voir proto-papier.css. */
  $$('.ag-jour', g).forEach((n,i)=> n.dataset.col=i);
  const cases=$$('.ag-case', g);
  let k=0;
  periodesAgenda().filter(p=>!p.pause).forEach(p=>{
    jours.forEach(iso=>{
      const c=cases[k++]; if(!c) return;
      c.dataset.iso=iso; c.dataset.per=p.n;
      const s=seanceDe(iso,p.n);
      c.innerHTML='';
      c.dataset.col=jours.indexOf(iso);
      c.classList.toggle('ag-case--plein', !!s);
      if (s){
        const gr=grpDe(s.gr)||{nom:'?',coul:'#9E9E9E',emo:'❓',img:''};
        const b=el('button','ag-seance'); b.type='button';
        b.style.background=gr.coul; b.style.color=encreSur(gr.coul);
        const tete=el('div','gr');
        if (gr.img){ const im=document.createElement('img'); im.className='img'; im.src=gr.img; im.alt=''; tete.appendChild(im); }
        else tete.appendChild(el('span','img',gr.emo));
        tete.appendChild(el('span',null,gr.nom));
        b.appendChild(tete);
        const et=(s.etapes||[]).filter(e=>e.phase==='pendant'&&e.titre);
        b.appendChild(el('span','cours', et.length ? et.map(e=>e.titre).join(' · ') : 'planification'));
        /* ce que le prof a écrit se lit DANS la case, pas seulement dedans */
        if ((s.plan||'').trim()) b.appendChild(el('span','plan', s.plan.trim()));
        const pu=el('div','puces');
        const faits=(s.etapes||[]).filter(e=>e.fait).length, tot=(s.etapes||[]).length;
        if (tot) pu.appendChild(el('span',null,'✔ '+faits+'/'+tot));
        const np=Object.values(s.pres||{}).length;
        if (np) pu.appendChild(el('span',null,'✅ '+np));
        if ((s.evalCrits||[]).length) pu.appendChild(el('span',null,'📝 '+Object.keys(s.notes||{}).length));
        if (s.minuterie) pu.appendChild(el('span',null,'⏱️'));
        if (pu.children.length) b.appendChild(pu);
        b.title='Groupe '+gr.nom+' — '+jourLisible(iso)+', période '+p.n;
        /* ⚠ ON OUVRE SUR LES ÉLÈVES, PLUS SUR LA PLANIFICATION. Joey, 31 août :
           « les groupes, une fois placés dans l'app, servent à afficher les
           élèves du groupe, prendre les présences, évaluer, prendre des notes
           sur un élève. » Le 28, c'était la planification qu'il voulait voir
           d'abord — mais la planification s'écrit le dimanche soir, tandis que
           les présences se prennent six fois par jour. Les huit portes restent
           là, à un doigt ; c'est le PREMIER écran qui change. */
        b.addEventListener('click', ev=>{ ev.stopPropagation();
          ecrire('seVolet','presences'); ouvrirSeance(iso,p.n); });
        c.appendChild(b);
        const x=el('button','ag-vider','✕'); x.type='button';
        /* ⚠ DEUX CAS, DEUX PHRASES. Une séance tirée de l'horaire n'a rien de
           consigné à effacer : lui annoncer une perte serait un mensonge, et
           ferait renoncer un prof qui veut seulement annuler un cours. */
        const duPatron = (typeof seanceDuPatron==='function') && seanceDuPatron(iso,p.n);
        x.title = duPatron ? 'Annuler ce cours, pour cette date seulement'
                           : 'Retirer ce groupe de la case';
        x.addEventListener('click', ev=>{ ev.stopPropagation();
          const q = duPatron
            ? 'Annuler le cours de '+gr.nom+' le '+jourLisible(iso)+' ?\n\n'
              +'Ton horaire n’est pas touché : les autres dates gardent ce cours.'
            : 'Retirer '+gr.nom+' de cette case ? Ce qui y est consigné sera effacé.';
          if(!confirm(q)) return;
          poserSeance(iso,p.n,null); });
        c.appendChild(x);
      } else {
        /* ⚠ LA PALETTE A QUITTÉ LE HAUT DE LA PAGE (proto-g4.js) : il n'y a
           plus de groupe à glisser depuis MA SEMAINE. La case vide offre donc
           le choix elle-même — c'est le chemin des EXCEPTIONS, l'année se
           réglant dans MON HORAIRE. */
        const plus=el('button','ag-plus','＋'); plus.type='button';
        plus.title='Poser un groupe ici, pour cette date seulement';
        plus.addEventListener('click', ev=>{ ev.stopPropagation();
          if (typeof choisirGroupePourCase==='function') choisirGroupePourCase(iso, p.n, peindreAgenda); });
        c.appendChild(plus);
        /* MON CAHIER a été retiré : la case elle-même s'écrit. */
        const n=el('div','ag-note'); n.contentEditable='true';
        n.dataset.vide='—'; n.dataset.k=cleNoteCase(iso,p.n);
        n.textContent=lire('ed:'+n.dataset.k,'')||'';
        n.addEventListener('click',e=>e.stopPropagation());
        n.addEventListener('input',()=>ecrire('ed:'+n.dataset.k, n.textContent));
        c.appendChild(n);
      }
      /* déposer un groupe */
      c.addEventListener('dragover', e=>{
        if (![...(e.dataTransfer.types||[])].includes('text/zts-groupe')) return;
        e.preventDefault(); c.classList.add('survol');
      });
      c.addEventListener('dragleave', ()=> c.classList.remove('survol'));
      c.addEventListener('drop', e=>{
        const id=e.dataTransfer.getData('text/zts-groupe'); if(!id) return;
        e.preventDefault(); e.stopPropagation(); c.classList.remove('survol');
        poserSeance(iso,p.n, seanceVide(id));
      });
      /* sans souris : groupe en main puis clic sur la case */
      c.addEventListener('click', ()=>{
        if (grpEnMain && !seanceDe(iso,p.n)){
          poserSeance(iso,p.n, seanceVide(grpEnMain));
          grpEnMain=null; peindrePalette();
        } else if (!seanceDe(iso,p.n)){
          /* ⚠ CECI ENVOYAIT VERS `e-journee`, un écran retiré : `allerA()` se
             rabattait sur l'accueil et REMONTAIT LA PAGE EN HAUT. Toucher une
             case vide donnait donc l'impression que l'app perdait sa place.
             La case porte déjà de quoi écrire — on y met le curseur. */
          /* ⚠ `poserContexte()` REPEINT L'AGENDA : la case qu'on vient de
             toucher n'existe déjà plus quand la ligne suivante s'exécute, et
             mettre le curseur dedans le posait sur un noeud détaché — aucun
             effet, aucune erreur. On va chercher la case NEUVE. */
          poserContexte(iso);
          const frais=$('.ag-case[data-iso="'+iso+'"][data-per="'+p.n+'"] .ag-note');
          if (frais) frais.focus();
        }
      });
    });
  });
};

/* ═════════ PIGER UN JEU POUR UNE SÉANCE ═════════
   Le tiroir sert déjà à remplir MA JOURNÉE. Quand il est ouvert DEPUIS une
   séance, AJOUTER pose le jeu comme activité de cette séance — avec son
   titre, son explication et sa durée — puis rouvre la planification. */
(function jeuVersSeance(){
  const hote=$('#listeJeux'); if(!hote) return;
  hote.addEventListener('click', e=>{
    const b=e.target.closest('button'); if(!b || !cibleSeance) return;
    if (!/AJOUTER/.test(b.textContent)) return;
    e.stopPropagation();
    const carte=b.closest('.carte-jeu');
    const nom=carte.querySelector('h3').textContent;
    const j=JEUX.find(x=>x.n===nom); if(!j) return;
    const {iso,per}=cibleSeance; cibleSeance=null;
    const s=seanceDe(iso,per); if(!s){ fermerTiroir(); return; }
    /* la première activité vide accueille le jeu ; sinon on en ajoute une */
    const vide=(s.etapes||[]).find(x=>pieceDe(x)==='jeux' && !x.desc)
             || (s.etapes||[]).find(x=>x.phase==='pendant' && !x.titre);
    if (vide){ vide.piece='jeux'; vide.titre=j.n; vide.desc=j.d; vide.duree=(j.t||15)*60; }
    else {
      const nid=Math.max(0,...s.etapes.map(y=>y.id))+1;
      const k=s.etapes.map(y=>y.phase).lastIndexOf('pendant');
      s.etapes.splice(k+1,0,{id:nid,phase:'pendant',piece:'jeux',titre:j.n,desc:j.d,duree:(j.t||15)*60,medias:[],fait:false});
    }
    ecrire(cleSeance(iso,per), s);
    fermerTiroir(); peindreAgenda(); allerA('e-accueil');
    ouvrirSeance(iso,per); volet('cours');
  }, true);
})();

/* ⚠ LES JOURS-CYCLE SE CALCULENT ICI, AU DÉMARRAGE. Ils ne se remplissaient
   qu'au premier affichage du CALENDRIER : avant d'y être allé, l'agenda et la
   barre du haut n'avaient rien à montrer. C'est le calendrier scolaire
   (`marques`) qui décide — congés et journées pédagogiques ne consomment pas
   de jour-cycle. Appelé ici parce que STYLES_CYCLE, dans proto-fusion.js,
   existe enfin : le style choisi est donc respecté dès la première peinture. */
recalculerCycles();
peindreCtxBarre();   /* GRP() existe maintenant */
peindrePalette();
peindreAgenda();


/* Dépôt d'images sur une étape — même chemin que le sélecteur de fichier. */
function avaleFichierEtape(id, f, apres){
  const type = f.type.startsWith('video/') ? 'video' : f.type.startsWith('image/') ? 'image' : 'pdf';
  const pousse = data => { majSeanceSansRedessin(x=>{ const y=etapeDe(x,id); y.medias=y.medias||[];
      y.medias.push({type, nom:f.name, data}); });
    if (apres) apres(); else peindreIllus(id); };
  if (type==='image') reduireImage(f,1400,.82).then(pousse).catch(()=>pousse(null));
  else if (f.size < 2.5*1024*1024){ const r=new FileReader(); r.onload=()=>pousse(r.result); r.readAsDataURL(f); }
  else { alert('« '+f.name+' » dépasse 2,5 Mo — seul le nom sera gardé.'); pousse(null); }
}
