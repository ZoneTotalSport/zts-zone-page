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
  minuterie:  {emo:'⏱️', lab:'LE TEMPS',   titre:'Le temps',             quoi:'Une durée qu’on lance',      ph:'pendant'},
  presences:  {emo:'✅', lab:'PRÉSENCES',  titre:'Prendre les présences', quoi:'Qui est là, qui a son linge', ph:'arrivee'},
  jeux:       {emo:'🎲', lab:'UN JEU',     titre:'Un jeu',               quoi:'Pigé dans la banque',       ph:'pendant'},
  evaluation: {emo:'📝', lab:'ÉVALUATION', titre:'Évaluer',              quoi:'Les critères, la grille',    ph:'pendant'},
  message:    {emo:'💬', lab:'UN MOT',     titre:'Un mot sur le cours',  quoi:'Ce qu’on retient',           ph:'fin'},
  tests:      {emo:'🏃', lab:'UN TEST',    titre:'Un test',              quoi:'Navette, Léger-Boucher',     ph:'pendant'},
};
const ORDRE_PIECES = ['libre','minuterie','presences','jeux','evaluation','message','tests'];
function pieceDe(e){ return (e && e.piece && PIECES[e.piece]) ? e.piece : 'libre'; }
let pieceEnMain = null;

/* ── l'image d'un élève : sa photo, ou sa pastille à initiales ── */
function visageDe(i){ return photoDe(i); }

/* ═════════ la palette de groupes, au-dessus de l'agenda ═════════ */
function peindrePalette(){
  let h=$('#palette');
  if (!h){
    const hote=$('#agendaHote'); if(!hote) return;
    const p=el('div','palette'); p.id='palette';
    hote.parentNode.insertBefore(p, hote);
    h=p;
  }
  h.innerHTML='';
  const q=el('div','quoi','Glisse un groupe dans une case de l’agenda. Un clic dessus ensuite ouvre tout le cours.');
  h.appendChild(q);
  GRP().forEach(g=>{
    const b=el('div','pastille-gr'); b.draggable=true; b.dataset.gr=g.id;
    b.style.background=g.coul; b.style.color=encreSur(g.coul);
    if (g.img){ const im=document.createElement('img'); im.className='img'; im.src=g.img; im.alt=''; b.appendChild(im); }
    else b.appendChild(el('span','img',g.emo));
    b.appendChild(el('span',null,g.nom));
    b.title=g.nom+' — '+g.eleves.length+' élèves. Glisse-moi dans l’agenda.';
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
    if (grpEnMain===g.id) b.style.boxShadow='3px 3px 0 var(--noir), 0 0 0 4px var(--jaune)';
    h.appendChild(b);
  });
  const plus=el('button','mini mini--lime','+ NOUVEAU GROUPE'); plus.type='button';
  plus.addEventListener('click', ()=>{
    const nom=prompt('Nom du groupe :','301'); if(!nom) return;
    const l=GRP();
    l.push({id:'g'+(l.length+1)+'_'+l.length, nom:nom.trim(),
            coul:couleurLibre(l), emo:emojiLibre(l), img:'',
            eleves:ELEVES.map((x,i)=>i).slice(0,6)});
    poserGRP(l); peindrePalette();
  });
  h.appendChild(plus);
  const arc=el('button','mini mini--jaune','🎨 TOUTES DIFFÉRENTES'); arc.type='button';
  arc.title='Donner une couleur bien à lui à chaque groupe qui en partage une';
  arc.addEventListener('click', couleursToutesDifferentes);
  h.appendChild(arc);
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

function modifierGroupe(id){
  const g=grpDe(id); if(!g) return;
  const corps=ouvrirModale('Personnaliser '+g.nom);
  corps.innerHTML=`
    <div class="m-champ"><label class="m-lab" for="gNom">Nom du groupe</label>
      <input class="m-saisie" id="gNom" value="${g.nom}"></div>
    <div class="m-champ"><span class="m-lab">Sa couleur</span><div class="m-personnes" id="gCouls"></div></div>
    <div class="m-champ"><span class="m-lab">Son image</span><div class="m-personnes" id="gEmos"></div>
      <button type="button" class="mini" id="gPhoto" style="margin-top:6px">📷 UTILISER UNE PHOTO</button></div>
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
    <div class="se-actions" id="seActions"></div>
    <div id="seDetail"></div>`;
  peindreTeteSeance();
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
function peindreTeteSeance(){
  if (typeof seanceOuverte==='undefined' || !seanceOuverte) return;
  const {iso,per}=seanceOuverte; const s=seanceDe(iso,per); if(!s) return;
  const g=grpDe(s.gr);
  const tete=$('#seTete'); if(!tete) return;
  const coul = g ? g.coul : '#9E9E9E';
  tete.style.background=coul; tete.style.color=encreSur(coul);
  tete.querySelector('h3').textContent = g ? 'Groupe '+g.nom : 'Groupe retiré';
  tete.querySelector('.quand').textContent =
    jourLisible(iso)+' · période '+per+' · '+((g&&g.eleves.length)||0)+' élèves';

  /* ⚠ ON REMPLACE LE BOUTON, on ne le vide pas. `peindreTeteSeance()` est
     rappelée à chaque changement de couleur ou de photo : rebrancher `click`
     sur le MÊME noeud empilait les écouteurs, et le sélecteur de fichier
     s'ouvrait deux fois, puis trois. Un clone sans enfant ne garde rien. */
  const vieux=$('#sePhoto'); const ph=vieux.cloneNode(false);
  vieux.replaceWith(ph);
  ph.className='se-photo'+((g&&g.img)?'':' vide');
  if (g && g.img){ const im=document.createElement('img'); im.src=g.img; im.alt=''; ph.appendChild(im); }
  else ph.appendChild(el('span','emo', g?g.emo:'❓'));
  const par=$('#seParure'); par.innerHTML='';
  if (!g){ ph.title='Ce groupe a été retiré.'; return; }

  ph.title='Glisse ici une photo de l’enseignant·e ou du groupe — ou touche pour la choisir.';
  ph.addEventListener('click', ()=> choisirPhotoGroupe(g.id));
  photoDeposable(ph, g.id);

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
    {k:'minuterie', emo:'⏱️', lab:'MINUTERIE',
     etat: s.minuterie ? mmss(s.minuterie)+' consignées' : 'aucune',
     faite: !!s.minuterie},
    {k:'presences', emo:'✅', lab:'PRÉSENCES',
     etat: nPres.length ? nPres.filter(x=>x==='linge').length+' avec linge · '
           +nPres.filter(x=>x==='sans').length+' sans · '+nPres.filter(x=>x==='absent').length+' absents'
         : 'pas encore prises',
     faite: nPres.length>0},
    {k:'jeux', emo:'🎲', lab:'JEUX',
     etat:'piger dans la banque',
     faite:false},
    {k:'message', emo:'💬', lab:'MESSAGE',
     etat: (s.message||'').trim() ? s.message.slice(0,34) : 'rien à signaler',
     faite: !!(s.message||'').trim()},
    {k:'evaluation', emo:'📝', lab:'ÉVALUATION',
     /* « posée(s) », pas « à revoir » : une cote au maximum s'enregistre
        depuis que rien n'est coloré d'avance. Ce qui est SOUS le maximum se
        compte avec `cotesSousMax()`, dans le portrait. */
     etat: (s.evalCrits||[]).length
        ? (s.evalCrits.length+' critère(s) · '+Object.keys(s.notes||{}).length+' cote(s) posée(s)')
        : 'rien de configuré',
     faite: (s.evalCrits||[]).length>0},
  ];
  act.forEach(a=>{
    const b=el('button','se-action'+(a.faite?' faite':'')); b.type='button';
    b.dataset.k=a.k;
    b.innerHTML='<span class="emo"></span><span class="lab"></span><span class="etat"></span>';
    b.querySelector('.emo').textContent=a.emo;
    b.querySelector('.lab').textContent=a.lab;
    b.querySelector('.etat').textContent=a.etat;
    b.addEventListener('click',()=>volet(a.k));
    h.appendChild(b);
  });
  volet(lire('seVolet','cours'));
  decorerPortes();
}

function volet(quoi){
  ecrire('seVolet', quoi);
  const {iso,per}=seanceOuverte; const s=seanceDe(iso,per);
  const g=grpDe(s.gr)||{eleves:[]};
  const d=$('#seDetail'); if(!d) return; d.innerHTML='';

  if (quoi==='cours'){ peindrePlanification(d, s, iso, per); return; }

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
    const aide=el('div','aide-un-mot');
    aide.innerHTML='<span class="emo">👕</span>Tout le monde a son linge. <b>Touche seulement ceux qui manquent</b> : '
      +'une fois pour « pas de linge », deux fois pour « absent ». '
      +'Le <b>✎</b> d’une carte note l’élève pour cette période — la note se range dans le portrait du groupe.';
    d.appendChild(aide);
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
function accepterDepot(n, ph, avantId){
  const bon=t=>{ const l=[...(t||[])];
    return l.indexOf('text/zts-piece')>=0 || l.indexOf('text/zts-etape')>=0; };
  n.addEventListener('dragover', ev=>{ if(!bon(ev.dataTransfer.types)) return;
    ev.preventDefault(); ev.stopPropagation(); n.classList.add('survol'); });
  n.addEventListener('dragleave', ()=> n.classList.remove('survol'));
  n.addEventListener('drop', ev=>{
    if(!bon(ev.dataTransfer.types)) return;
    ev.preventDefault(); ev.stopPropagation(); n.classList.remove('survol');
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

function peindrePlanification(d, s, iso, per){
  if (!s.etapes){ majSeance(x=>{ const v=seanceVide(x.gr); x.etapes=v.etapes; x.seq=v.seq; }); return; }
  if (migrerPieces(s)) majSeanceSansRedessin(x=>migrerPieces(x));
  const total=(s.etapes||[]).reduce((a,e)=>a+(e.duree||0),0);
  const faits=(s.etapes||[]).filter(e=>e.fait).length;

  const chapeau=el('div','aide-un-mot');
  chapeau.innerHTML='<span class="emo">👆</span>Compose ton cours : <b>glisse une pièce</b> dans une phase, '
    +'ou <b>coche-la</b> dans les cases du haut — <b>décoche</b> pour l’enlever. '
    +'Une étape se glisse pour changer de place, se touche pour s’ouvrir.';
  d.appendChild(chapeau);

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

  const cpt=el('div','pres-compte');
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
      accepterDepot(l, ph, e.id);

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
      lien.title = (k==='libre') ? 'Ouvrir cette activité' : 'Ouvrir ' + P.lab.toLowerCase();
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
  const g=$('#agendaHote .agenda-grille'); if(!g) return;
  const jours=[]; for(let i=0;i<5;i++) jours.push(isoDe(new Date(dateDeIso(agLundi).getTime()+i*UN_JOUR)));
  const cases=$$('.ag-case', g);
  let k=0;
  periodesAgenda().filter(p=>!p.pause).forEach(p=>{
    jours.forEach(iso=>{
      const c=cases[k++]; if(!c) return;
      c.dataset.iso=iso; c.dataset.per=p.n;
      const s=seanceDe(iso,p.n);
      c.innerHTML='';
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
        const pu=el('div','puces');
        const faits=(s.etapes||[]).filter(e=>e.fait).length, tot=(s.etapes||[]).length;
        if (tot) pu.appendChild(el('span',null,'✔ '+faits+'/'+tot));
        const np=Object.values(s.pres||{}).length;
        if (np) pu.appendChild(el('span',null,'✅ '+np));
        if ((s.evalCrits||[]).length) pu.appendChild(el('span',null,'📝 '+Object.keys(s.notes||{}).length));
        if (s.minuterie) pu.appendChild(el('span',null,'⏱️'));
        if (pu.children.length) b.appendChild(pu);
        b.title='Groupe '+gr.nom+' — '+jourLisible(iso)+', période '+p.n;
        b.addEventListener('click', ev=>{ ev.stopPropagation(); ouvrirSeance(iso,p.n); });
        c.appendChild(b);
        const x=el('button','ag-vider','✕'); x.type='button'; x.title='Retirer ce groupe de la case';
        x.addEventListener('click', ev=>{ ev.stopPropagation();
          if(!confirm('Retirer '+gr.nom+' de cette case ? Ce qui y est consigné sera effacé.')) return;
          poserSeance(iso,p.n,null); });
        c.appendChild(x);
      } else {
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
          poserContexte(iso); allerA('e-journee');
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

peindreCtxBarre();   /* GRP() existe maintenant */
peindrePalette();
peindreAgenda();


/* Dépôt d'images sur une étape — même chemin que le sélecteur de fichier. */
function avaleFichierEtape(id, f){
  const type = f.type.startsWith('video/') ? 'video' : f.type.startsWith('image/') ? 'image' : 'pdf';
  const pousse = data => { majSeanceSansRedessin(x=>{ const y=etapeDe(x,id); y.medias=y.medias||[];
      y.medias.push({type, nom:f.name, data}); }); peindreIllus(id); };
  if (type==='image') reduireImage(f,1400,.82).then(pousse).catch(()=>pousse(null));
  else if (f.size < 2.5*1024*1024){ const r=new FileReader(); r.onload=()=>pousse(r.result); r.readAsDataURL(f); }
  else { alert('« '+f.name+' » dépasse 2,5 Mo — seul le nom sera gardé.'); pousse(null); }
}
