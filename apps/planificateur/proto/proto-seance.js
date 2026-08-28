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
const PALETTE_EMO  = ['🏀','⚽','🏐','🏸','🤾','🎾','🥍','🏓'];

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
    {id:1, phase:'arrivee', titre:'Arrivée',      desc:'', duree:0, medias:[], fait:false},
    {id:2, phase:'pendant', titre:'',             desc:'', duree:0, medias:[], fait:false},
    {id:3, phase:'fin',     titre:'Fin du cours', desc:'', duree:0, medias:[], fait:false},
  ]};
}
const PHASES = [
  ['arrivee','🚪 ARRIVÉE',       'Ce qu’on fait en entrant'],
  ['pendant','🏃 PENDANT LA PÉRIODE','Les activités, dans l’ordre'],
  ['fin',    '🏁 FIN DU COURS',  'Le retour au calme, le rangement'],
];

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
            coul:PALETTE_COUL[l.length % PALETTE_COUL.length],
            emo:PALETTE_EMO[l.length % PALETTE_EMO.length], img:'',
            eleves:ELEVES.map((x,i)=>i).slice(0,6)});
    poserGRP(l); peindrePalette();
  });
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
      <span class="img"></span>
      <div><h3></h3><div class="quand"></div></div>
    </div>
    <div class="se-actions" id="seActions"></div>
    <div id="seDetail"></div>`;
  const tete=$('#seTete');
  tete.style.background=g.coul; tete.style.color=encreSur(g.coul);
  if (g.img){ const im=document.createElement('img'); im.className='img'; im.src=g.img; im.alt='';
              tete.replaceChild(im, tete.querySelector('.img')); }
  else tete.querySelector('.img').textContent=g.emo;
  tete.querySelector('h3').textContent='Groupe '+g.nom;
  tete.querySelector('.quand').textContent=jourLisible(iso)+' · période '+per+' · '+g.eleves.length+' élèves';
  peindreActionsSeance();
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
     etat: (s.evalCrits||[]).length
        ? (s.evalCrits.length+' critère(s) · '+Object.keys(s.notes||{}).length+' à revoir')
        : 'rien de configuré',
     faite: (s.evalCrits||[]).length>0},
  ];
  act.forEach(a=>{
    const b=el('button','se-action'+(a.faite?' faite':'')); b.type='button';
    b.innerHTML='<span class="emo"></span><span class="lab"></span><span class="etat"></span>';
    b.querySelector('.emo').textContent=a.emo;
    b.querySelector('.lab').textContent=a.lab;
    b.querySelector('.etat').textContent=a.etat;
    b.addEventListener('click',()=>volet(a.k));
    h.appendChild(b);
  });
  volet(lire('seVolet','cours'));
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
      +'une fois pour « pas de linge », deux fois pour « absent ».';
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
      gr.appendChild(b);
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
    const bar=el('div'); bar.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px';
    const chg=el('button','mini','✎ CHANGER CE QUE J’ÉVALUE'); chg.type='button';
    chg.addEventListener('click',()=>{ majSeance(x=>x.evalCrits=[]); volet('evaluation'); });
    bar.appendChild(chg); d.appendChild(bar);
    /* ⚠ TOUT LE MONDE PART AU MAXIMUM. Une case sans note affiche le meilleur
       symbole : le prof ne descend que ceux qui doivent l'être, il ne coche
       pas 30 élèves pour dire qu'ils vont bien. */
    const ech={v: facon().v};
    const t=el('table','gril');
    const th=el('tr'); th.appendChild(el('th',null,'Élève'));
    crits.forEach(c=> th.appendChild(el('th',null, libelleCrit(c))));
    const tb=el('tbody'); tb.appendChild(th);
    g.eleves.forEach(i=>{
      const tr=el('tr'); const td=el('td','el');
      const v=el('div','visage');
      const im=document.createElement('img'); im.src=visageDe(i); im.alt='';
      v.appendChild(im); v.appendChild(el('b',null,ELEVES[i]));
      td.appendChild(v); tr.appendChild(td);
      crits.forEach(cle=>{
        const c=el('td'); const grp=el('div','cotes');
        ech.v.forEach(([sym,lab,val])=>{
          const b=el('button','ech-case',sym); b.type='button';
          const actuel=(s.notes||{})[i+'|'+cle] !== undefined
                       ? (s.notes||{})[i+'|'+cle] : maxFacon();
          b.setAttribute('aria-pressed', String(actuel===val));
          if (actuel===val) b.style.background=teinteVal(val);
          b.title=ELEVES[i]+' — '+libelleCrit(cle)+(lab?' — '+lab:'')+' ('+val+'/100)';
          b.addEventListener('click',()=>{
            majSeance(x=>{ x.notes=x.notes||{}; const k=i+'|'+cle;
              if (val===maxFacon()) delete x.notes[k];   // au max = rien à consigner
              else x.notes[k]=val; });
            volet('evaluation');
          });
          grp.appendChild(b);
        });
        c.appendChild(grp); tr.appendChild(c);
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
function choisirCriteres(){
  const {iso,per}=seanceOuverte; const s=seanceDe(iso,per);
  let choisis=new Set(s.evalCrits||[]);
  const corps=ouvrirModale('Qu’est-ce que j’évalue ?');
  corps.innerHTML='<div class="aide-un-mot"><span class="emo">✋</span>Cinq critères au maximum — au-delà, la grille devient illisible en plein gymnase.</div>'
    +'<div class="crit-cols" id="chCols"></div>'
    +'<div class="m-pied"><button type="button" class="m-valider" id="chOk">✔ UTILISER CES CRITÈRES</button>'
    +'<button type="button" class="mini" data-fermer>ANNULER</button></div>';
  const h=$('#chCols');
  Object.entries(CRITERES).forEach(([k,liste])=>{
    const col=el('div','crit-col '+COMPS_META[k].cls);
    col.appendChild(el('h3',null,COMPS_META[k].lab));
    const box=el('div','crit-liste');
    liste.forEach((txt,i)=>{
      const cle=k+'|'+i; const l=el('label');
      const c=document.createElement('input'); c.type='checkbox'; c.checked=choisis.has(cle);
      c.addEventListener('change',()=>{
        if (c.checked){ if(choisis.size>=MAX_CRITERES){ c.checked=false; return; } choisis.add(cle); }
        else choisis.delete(cle);
      });
      l.appendChild(c); l.appendChild(el('span',null,txt)); box.appendChild(l);
    });
    col.appendChild(box); h.appendChild(col);
  });
  $('#chOk').addEventListener('click',()=>{
    const l=[...choisis];
    fermerModale();
    ouvrirSeance(iso,per);
    majSeance(x=>x.evalCrits=l);
    volet('evaluation');
  });
}

/* ── piger un jeu POUR une séance ── */
let cibleSeance = null;


/* ═════════ LA PLANIFICATION — arrivée · pendant · fin ═════════
   Joey : « arrivée (lien cliquable qui explique quoi faire) + durée, ensuite
   durant la période d'autres liens cliquables — titre de l'activité, ça
   s'affiche avec images et durée, avec crochet quand terminé — et fin du
   cours, même chose. »
   Chaque étape est donc un LIEN : on le touche, son détail s'ouvre. */
function etapeDe(s, id){ return (s.etapes||[]).find(e=>e.id===id); }

function peindrePlanification(d, s, iso, per){
  if (!s.etapes){ majSeance(x=>{ const v=seanceVide(x.gr); x.etapes=v.etapes; x.seq=v.seq; }); return; }
  const total=(s.etapes||[]).reduce((a,e)=>a+(e.duree||0),0);
  const faits=(s.etapes||[]).filter(e=>e.fait).length;

  const chapeau=el('div','aide-un-mot');
  chapeau.innerHTML='<span class="emo">👆</span>Touche une étape pour l’ouvrir : son explication, ses images, sa durée. '
    +'Coche-la quand c’est fait.';
  d.appendChild(chapeau);

  const cpt=el('div','pres-compte');
  cpt.innerHTML='<span></span><span class="l"></span>';
  cpt.children[0].textContent = total ? '⏱️ '+Math.round(total/60)+' min au total' : '⏱️ durées à remplir';
  cpt.children[1].textContent='✔ '+faits+' / '+s.etapes.length+' terminée'+(faits>1?'s':'');
  d.appendChild(cpt);

  PHASES.forEach(([ph,lab,quoi])=>{
    const box=el('div','se-cours'); box.style.marginBottom='12px';
    const t=el('h4',null,lab); box.appendChild(t);
    const sq=el('div'); sq.style.cssText='font-family:var(--f-note);font-size:15px;color:var(--ink-soft);margin:-4px 0 8px';
    sq.textContent=quoi; box.appendChild(sq);

    const liste=s.etapes.filter(e=>e.phase===ph);
    if (!liste.length) box.appendChild(el('div','cahier-vide','Rien pour l’instant.'));
    liste.forEach(e=>{
      const l=el('div','etape'+(e.fait?' etape--faite':''));
      const chk=el('button','etape-chk', e.fait?'✔':'○'); chk.type='button';
      chk.title=e.fait?'Marquer non terminée':'Marquer terminée';
      chk.addEventListener('click',ev=>{ ev.stopPropagation();
        majSeance(x=>{ const y=etapeDe(x,e.id); y.fait=!y.fait; }); volet('cours'); });
      const lien=el('button','etape-lien'); lien.type='button';
      lien.innerHTML='<span class="ti"></span><span class="du"></span>';
      lien.querySelector('.ti').textContent = e.titre || '(sans titre — touche pour le nommer)';
      lien.querySelector('.du').textContent = (e.duree ? Math.round(e.duree/60)+' min' : 'durée à toi')
        + ((e.medias||[]).length ? ' · 🖼️ '+e.medias.length : '');
      lien.addEventListener('click',()=> ouvrirEtape(e.id));
      l.appendChild(chk); l.appendChild(lien);
      if (ph==='pendant'){
        const x=el('button','etape-sup','✕'); x.type='button'; x.title='Retirer cette activité';
        x.addEventListener('click',ev=>{ ev.stopPropagation();
          if(!confirm('Retirer « '+(e.titre||'cette activité')+' » ?')) return;
          majSeance(y=>y.etapes=y.etapes.filter(z=>z.id!==e.id)); volet('cours'); });
        l.appendChild(x);
      }
      box.appendChild(l);
    });

    if (ph==='pendant'){
      const bar=el('div'); bar.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:9px';
      const pige=el('button','mini mini--lime','🎲 PIGER UN JEU'); pige.type='button';
      pige.addEventListener('click',()=>{ cibleSeance={iso,per}; fermerModale(); ouvrirTiroir(null); allerA('e-jeux'); });
      const add=el('button','mini','+ AUTRE ACTIVITÉ'); add.type='button';
      add.addEventListener('click',()=>{
        majSeance(x=>{ x.seq=(x.seq||0)+1;
          const nid=Math.max(0,...x.etapes.map(y=>y.id))+1;
          const k=x.etapes.map(y=>y.phase).lastIndexOf('pendant');
          x.etapes.splice(k+1,0,{id:nid,phase:'pendant',titre:'',desc:'',duree:0,medias:[],fait:false}); });
        volet('cours');
      });
      bar.appendChild(pige); bar.appendChild(add); box.appendChild(bar);
    }
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
    const vide=(s.etapes||[]).find(x=>x.phase==='pendant' && !x.titre);
    if (vide){ vide.titre=j.n; vide.desc=j.d; vide.duree=(j.t||15)*60; }
    else {
      const nid=Math.max(0,...s.etapes.map(y=>y.id))+1;
      const k=s.etapes.map(y=>y.phase).lastIndexOf('pendant');
      s.etapes.splice(k+1,0,{id:nid,phase:'pendant',titre:j.n,desc:j.d,duree:(j.t||15)*60,medias:[],fait:false});
    }
    ecrire(cleSeance(iso,per), s);
    fermerTiroir(); peindreAgenda(); allerA('e-accueil');
    ouvrirSeance(iso,per); volet('cours');
  }, true);
})();

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
