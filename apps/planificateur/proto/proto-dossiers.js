/* ==========================================================================
   MES GROUPES — trois niveaux, et rien d'autre.
   Joey, 28 août : « on voit tous les groupes en haut, je clique sur le bouton
   du groupe, là on voit les élèves ; si on clique sur l'image de l'élève, on
   voit s'afficher le nombre de fois absent avec les dates, le linge d'éducation
   physique quand il manque son linge et les dates, s'il a eu quelque chose dans
   le gymnase l'impliquant, etc. »

   Groupes → élèves → dossier. Un geste par niveau.
   Tout est RELU des séances : aucune de ces dates n'est saisie deux fois.
   ========================================================================== */
'use strict';

let mgGroupe = lire('mgGroupe', null);

function toutesSeances(){
  const out=[];
  Object.keys(localStorage).forEach(k=>{
    const m=/^protog2:se:(\d{4}-\d{2}-\d{2}):p(\d+)$/.exec(k);
    if (!m) return;
    try { out.push({iso:m[1], per:+m[2], s:JSON.parse(localStorage.getItem(k))}); } catch(e){}
  });
  return out.sort((a,b)=> a.iso===b.iso ? b.per-a.per : (a.iso<b.iso?1:-1));
}
/* Ce qu'on sait d'un élève, reconstruit depuis les séances. */
function dossierEleve(i){
  const absences=[], oublis=[], mots=[];
  toutesSeances().forEach(({iso,per,s})=>{
    const g=grpDe(s && s.gr); if(!g || !(g.eleves||[]).includes(i)) return;
    const et=(s.pres||{})[i];
    if (et==='absent') absences.push({iso,per,gr:g.nom});
    if (et==='sans')   oublis.push({iso,per,gr:g.nom});
    if ((s.message||'').trim()) mots.push({iso,per,gr:g.nom,txt:s.message.trim()});
  });
  const notes=lire('eleveNotes:'+i, []);      /* ce que le prof note sur LUI */
  return {absences, oublis, mots, notes};
}

/* ── niveau 1 : les groupes ── */
function peindreMesGroupes(){
  const h=$('#mgGroupes'); if(!h) return;
  if (!mgGroupe && GRP()[0]) mgGroupe=GRP()[0].id;
  h.innerHTML='';
  GRP().forEach(g=>{
    const b=el('div','grp-puce');
    b.style.background=g.coul; b.style.color=encreSur(g.coul);
    b.setAttribute('aria-current', String(g.id===mgGroupe));
    if (g.id!==mgGroupe) b.style.opacity='.6';
    const nom=el('span',null,(g.img?'':g.emo+' ')+g.nom);
    nom.style.cursor='pointer';
    nom.addEventListener('click',()=>{ mgGroupe=g.id; ecrire('mgGroupe',g.id);
      peindreMesGroupes(); peindreMesEleves(); });
    if (g.img){ const im=document.createElement('img'); im.src=g.img; im.alt='';
      im.style.cssText='width:24px;height:24px;border-radius:6px;border:2px solid var(--noir);object-fit:cover';
      b.appendChild(im); }
    b.appendChild(nom);
    const m=el('button',null,'✎'); m.type='button'; m.title='Personnaliser ce groupe';
    m.addEventListener('click',e=>{ e.stopPropagation(); modifierGroupe(g.id); });
    b.appendChild(m);
    h.appendChild(b);
  });
  const plus=el('button','mini mini--lime','+ NOUVEAU GROUPE'); plus.type='button';
  plus.addEventListener('click',()=>{
    const nom=prompt('Nom du groupe :','301'); if(!nom) return;
    const l=GRP();
    l.push({id:'g'+Date.now().toString(36), nom:nom.trim(),
            coul:couleurLibre(l), emo:emojiLibre(l), img:'',
            eleves:[]});
    poserGRP(l); peindreMesGroupes(); peindrePalette();
  });
  h.appendChild(plus);
}

/* ── niveau 2 : les élèves du groupe ── */
function peindreMesEleves(){
  const h=$('#mgEleves'); if(!h) return;
  const g=grpDe(mgGroupe);
  const t=$('#mgTitre');
  if (!g){ if(t) t.textContent='Les élèves'; h.innerHTML=''; return; }
  if (t) t.textContent='Groupe '+g.nom+' — '+g.eleves.length+' élève'+(g.eleves.length>1?'s':'');
  h.innerHTML='';
  if (!g.eleves.length){
    h.appendChild(el('div','aide-un-mot','👆 Ce groupe n’a pas encore d’élèves. Touche le ✎ à côté de son nom pour en ajouter.'));
    return;
  }
  g.eleves.forEach(i=>{
    const d=dossierEleve(i);
    const b=el('button','pres-el'); b.type='button';
    const im=document.createElement('img'); im.src=visageDe(i); im.alt=''; b.appendChild(im);
    b.appendChild(el('div','nom', ELEVES[i]));
    const e=el('div','etat');
    const bouts=[];
    if (d.absences.length) bouts.push('✗'+d.absences.length);
    if (d.oublis.length)   bouts.push('🚫'+d.oublis.length);
    if (d.notes.length)    bouts.push('📝'+d.notes.length);
    e.textContent = bouts.length ? bouts.join(' ') : '— rien à signaler';
    b.appendChild(e);
    b.title=ELEVES[i]+' — '+d.absences.length+' absence(s), '+d.oublis.length+' oubli(s) de linge';
    b.addEventListener('click',()=> ouvrirDossier(i));
    h.appendChild(b);
  });
}

/* ── niveau 3 : le dossier de l'élève ── */
function ouvrirDossier(i){
  const d=dossierEleve(i);
  const g=grpDe(mgGroupe)||{nom:'?',coul:'#9E9E9E'};
  const corps=ouvrirModale(ELEVES[i]);
  corps.innerHTML=`
    <div class="se-tete" id="doTete">
      <img class="img" alt="" src="${visageDe(i)}">
      <div><h3>${ELEVES[i]}</h3>
        <div class="quand">groupe ${g.nom} · depuis le début de l'année</div></div>
    </div>
    <div class="pres-compte" style="margin-bottom:14px">
      <span class="a">✗ ${d.absences.length} absence${d.absences.length>1?'s':''}</span>
      <span class="s">🚫 ${d.oublis.length} oubli${d.oublis.length>1?'s':''} de linge</span>
      <span>📝 ${d.notes.length} note${d.notes.length>1?'s':''}</span>
      <span>💬 ${d.mots.length} mot${d.mots.length>1?'s':''} sur le cours</span>
    </div>
    <div class="m-champ">
      <span class="m-lab">Il s'est passé quelque chose au gymnase&nbsp;?</span>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <input class="m-saisie" id="doNote" placeholder="Ex. : s'est tordu la cheville au ballon chasseur"
               style="flex:1;min-width:220px">
        <button type="button" class="mini mini--lime" id="doAdd">+ NOTER</button>
      </div>
    </div>
    <div id="doCorps"></div>`;
  const tete=$('#doTete'); tete.style.background=g.coul; tete.style.color=encreSur(g.coul);

  $('#doAdd').addEventListener('click',()=>{
    const t=$('#doNote').value.trim(); if(!t) return;
    const l=lire('eleveNotes:'+i, []);
    l.push({iso:aujourdhuiISO(), h:maintenantHM(), txt:t});
    ecrire('eleveNotes:'+i, l); $('#doNote').value='';
    fermerModale(); ouvrirDossier(i); peindreMesEleves();
  });
  $('#doNote').addEventListener('keydown',e=>{ if(e.key==='Enter') $('#doAdd').click(); });

  const h=$('#doCorps');
  const section=(titre, liste, rendu)=>{
    const box=el('div','se-cours'); box.style.marginBottom='12px';
    box.appendChild(el('h4',null,titre));
    if (!liste.length) box.appendChild(el('div','cahier-vide','Rien à signaler. Tant mieux.'));
    else liste.forEach(x=> box.appendChild(rendu(x)));
    h.appendChild(box);
  };
  const dateEtLieu=x=>{
    const n=el('div','hist-ligne');
    n.appendChild(el('b',null, jourLisible(x.iso)));
    n.appendChild(el('span',null,'période '+x.per+' · groupe '+x.gr));
    return n;
  };
  section('✗ Absences ('+d.absences.length+')', d.absences, dateEtLieu);
  section('🚫 Oublis de linge d’éducation physique ('+d.oublis.length+')', d.oublis, dateEtLieu);
  section('📝 Ce qui lui est arrivé ('+d.notes.length+')', d.notes, x=>{
    const n=el('div','journal-entree');
    n.appendChild(el('div','quand', jourLisible(x.iso)+' · '+x.h));
    n.appendChild(el('div',null, x.txt));
    const sup=el('button','mini mini--rose','✕'); sup.type='button'; sup.style.marginTop='6px';
    sup.addEventListener('click',()=>{
      const l=lire('eleveNotes:'+i,[]);
      const k=l.findIndex(y=>y.iso===x.iso&&y.h===x.h&&y.txt===x.txt);
      if (k>=0) l.splice(k,1);
      ecrire('eleveNotes:'+i,l); fermerModale(); ouvrirDossier(i); peindreMesEleves();
    });
    n.appendChild(sup);
    return n;
  });
  section('💬 Mots notés sur ses cours ('+d.mots.length+')', d.mots, x=>{
    const n=el('div','journal-entree');
    n.appendChild(el('div','quand', jourLisible(x.iso)+' · période '+x.per+' · groupe '+x.gr));
    n.appendChild(el('div',null, x.txt));
    return n;
  });
}

(function departDossiers(){
  peindreMesGroupes(); peindreMesEleves();
  const base=window.allerA;
  window.allerA=function(id){ base(id);
    if (id==='e-groupes'){ peindreMesGroupes(); peindreMesEleves(); } };
})();
