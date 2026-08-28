/* ==========================================================================
   L'ANNÉE — calendrier qui s'écrit, historique des élèves, réglages regroupés.
   Joey, 28 août :
   · « calendrier pour cliquer sur une date et écrire s'il y a une journée
     spéciale, une statutaire, pédagogique — glisse-dépose le calendrier
     scolaire pour que ça s'incorpore » ;
   · « mes groupes pour configurer les images, le nombre de fois que l'élève a
     oublié son linge depuis le début de l'année avec les dates, les absences
     avec dates, les messages depuis le début de l'année » ;
   · « partage / réglages / mes données, mets-les ensemble ».
   ========================================================================== */
'use strict';

/* ═════════ D. LE CALENDRIER S'ÉCRIT ═════════ */
function noteJour(iso){ return lire('caljour:'+iso, ''); }

function ouvrirJour(iso){
  const corps=ouvrirModale(jourLisible(iso));
  corps.innerHTML=`
    <div class="aide-un-mot"><span class="emo">📆</span>
      Dis ce qu'est cette journée, et laisse-toi un mot si tu veux.</div>
    <div class="m-champ"><span class="m-lab">Cette journée est…</span>
      <div class="note-choix" id="cjTypes"></div></div>
    <div class="m-champ"><label class="m-lab" for="cjNote">Mon mot pour cette journée</label>
      <div class="desc" contenteditable id="cjNote" data-vide="Ex. : sortie au parc, apporter les dossards…"
           style="min-height:70px;border:3px solid var(--noir);border-radius:11px;padding:8px"></div></div>
    <div class="m-pied"><button type="button" class="m-valider" data-fermer>✔ C'EST NOTÉ</button></div>`;
  const h=$('#cjTypes');
  const choix=[['','🏫 Journée normale','les cours ont lieu']].concat(
    CATS.map(([id,lab,coul])=>[id, lab, '']));
  choix.forEach(([id,lab,quoi])=>{
    const b=el('button'); b.type='button';
    b.innerHTML='<span></span><small></small>';
    b.firstChild.textContent=lab; b.lastChild.textContent=quoi;
    b.setAttribute('aria-pressed', String((marques[iso]||'')===id));
    b.addEventListener('click',()=>{
      if (id) marques[iso]=id; else delete marques[iso];
      ecrire('cal', marques);
      $$('#cjTypes button').forEach(x=>x.setAttribute('aria-pressed','false'));
      b.setAttribute('aria-pressed','true');
      peindreCalendrier(); peindreMois(); peindreAnnee(); peindreAgenda();
    });
    h.appendChild(b);
  });
  const n=$('#cjNote'); n.textContent=noteJour(iso);
  n.addEventListener('input',()=> ecrire('caljour:'+iso, n.textContent));
}

/* le clic sur une case du calendrier ouvre la journée au lieu de peindre */
(function calendrierQuiSecrit(){
  const base=peindreCalendrier;
  window.peindreCalendrier=function(){
    base();
    $$('#calGrille .cal-mois td').forEach(td=>{
      if (td.classList.contains('hors')) return;
      const m=/(\d+)/.exec(td.textContent); if(!m) return;
      const boite=td.closest('.cal-mois');
      const t=boite.querySelector('h3').textContent;         // « Septembre 2025 »
      const mo=MOIS_FR.findIndex(x=>x.toLowerCase()===t.split(' ')[0].toLowerCase());
      const an=parseInt(t.split(' ')[1],10);
      if (mo<0 || !an) return;
      const iso=an+'-'+String(mo+1).padStart(2,'0')+'-'+String(+m[1]).padStart(2,'0');
      if (noteJour(iso)) td.style.boxShadow='inset 0 0 0 3px var(--orange)';
      const neuf=td.cloneNode(true);                          // on remplace le clic d'origine
      td.parentNode.replaceChild(neuf, td);
      neuf.title = jourLisible(iso) + (noteJour(iso) ? ' — '+noteJour(iso) : '');
      neuf.addEventListener('click', ()=> ouvrirJour(iso));
    });
  };
  peindreCalendrier();
})();

/* zone de dépôt du calendrier scolaire */
(function depotIcs(){
  const ecran=$('#e-calendrier'); if(!ecran) return;
  const z=el('div','jr-depot');
  z.id='calDepot';
  z.style.cssText='text-align:center;padding:18px;margin-bottom:14px;font-size:17px';
  z.textContent='＋ glisse ici le calendrier scolaire de ton centre de services (.ics) — ou touche pour le choisir';
  const avale=f=>{ const r=new FileReader();
    r.onload=()=>{ const a=appliquerIcs(String(r.result), f.name);
      z.textContent='✔ '+f.name+' — '+a.trouves.length+' journée(s) posée(s)'
        +(a.hors?', '+a.hors+' hors année':'')+(a.sansCat?', '+a.sansCat+' non reconnue(s)':'');
      peindreCalendrier(); };
    r.readAsText(f); };
  z.addEventListener('dragover', e=>{ if(![...(e.dataTransfer.types||[])].includes('Files'))return;
    e.preventDefault(); z.style.background='#F2FFE2'; });
  z.addEventListener('dragleave', ()=> z.style.background='');
  z.addEventListener('drop', e=>{ const f=[...(e.dataTransfer.files||[])][0]; if(!f)return;
    e.preventDefault(); z.style.background=''; avale(f); });
  z.addEventListener('click', ()=>{ const i=document.createElement('input'); i.type='file';
    i.accept='.ics,text/calendar'; i.addEventListener('change',()=>{ if(i.files[0]) avale(i.files[0]); }); i.click(); });
  ecran.insertBefore(z, ecran.querySelector('.pan'));
})();

/* ═════════ E. L'HISTORIQUE D'UN ÉLÈVE ═════════ */
function toutesLesSeances(){
  const out=[];
  Object.keys(localStorage).forEach(k=>{
    const m=/^protog2:se:(\d{4}-\d{2}-\d{2}):p(\d+)$/.exec(k);
    if (!m) return;
    try { out.push({iso:m[1], per:+m[2], s:JSON.parse(localStorage.getItem(k))}); } catch(e){}
  });
  return out.sort((a,b)=> a.iso===b.iso ? a.per-b.per : (a.iso<b.iso?1:-1));
}
function dossierEleve(i){
  const oublis=[], absences=[], mots=[];
  toutesLesSeances().forEach(({iso,per,s})=>{
    if (!s || !grpDe(s.gr)) return;
    if (!(grpDe(s.gr).eleves||[]).includes(i)) return;
    const et=(s.pres||{})[i];
    if (et==='sans')   oublis.push({iso,per,gr:grpDe(s.gr).nom});
    if (et==='absent') absences.push({iso,per,gr:grpDe(s.gr).nom});
    if ((s.message||'').trim()) mots.push({iso,per,gr:grpDe(s.gr).nom,txt:s.message.trim()});
  });
  return {oublis, absences, mots};
}
function ouvrirDossier(i){
  const d=dossierEleve(i);
  const corps=ouvrirModale(ELEVES[i]);
  corps.innerHTML=`
    <div class="se-tete" style="background:#F4FAFD;color:var(--ink)">
      <img class="img" alt="" src="${visageDe(i)}">
      <div><h3>${ELEVES[i]}</h3>
        <div class="quand">depuis le début de l'année</div></div>
    </div>
    <div class="pres-compte" style="margin-bottom:14px">
      <span class="s">🚫 ${d.oublis.length} oubli${d.oublis.length>1?'s':''} de linge</span>
      <span class="a">✗ ${d.absences.length} absence${d.absences.length>1?'s':''}</span>
      <span>💬 ${d.mots.length} mot${d.mots.length>1?'s':''}</span>
    </div>
    <div id="dosCorps"></div>`;
  const h=$('#dosCorps');
  const section=(titre, liste, rendu)=>{
    const box=el('div','se-cours'); box.style.marginBottom='12px';
    box.appendChild(el('h4',null,titre));
    if (!liste.length){ box.appendChild(el('div','cahier-vide','Rien à signaler. Tant mieux.')); }
    else liste.forEach(x=> box.appendChild(rendu(x)));
    h.appendChild(box);
  };
  const ligne=x=>{
    const n=el('div','hist-ligne');
    n.appendChild(el('b',null, jourLisible(x.iso)));
    n.appendChild(el('span',null,'période '+x.per+' · groupe '+x.gr));
    return n;
  };
  section('🚫 Oublis de linge ('+d.oublis.length+')', d.oublis, ligne);
  section('✗ Absences ('+d.absences.length+')', d.absences, ligne);
  section('💬 Ce que j’ai noté ('+d.mots.length+')', d.mots, x=>{
    const n=el('div','journal-entree');
    n.appendChild(el('div','quand', jourLisible(x.iso)+' · période '+x.per+' · groupe '+x.gr));
    n.appendChild(el('div',null,x.txt));
    return n;
  });
}

/* la liste des élèves, avec leurs compteurs, dans MES GROUPES */
(function dossiersDansGroupes(){
  const ecran=$('#e-groupes'); if(!ecran) return;
  const pan=el('div','pan');
  pan.innerHTML='<h2>🧑‍🤝‍🧑 Mes élèves — leur année</h2>'
    +'<p style="font-family:var(--f-note);font-size:17px;margin:0 0 12px">'
    +'Touche un élève : ses oublis de linge, ses absences et ce que tu as noté, avec les dates.</p>'
    +'<div class="pres-grille" id="dosGrille"></div>';
  ecran.insertBefore(pan, ecran.children[2] || null);
  window.peindreDossiers=function(){
    const h=$('#dosGrille'); if(!h) return; h.innerHTML='';
    ELEVES.forEach((nom,i)=>{
      const d=dossierEleve(i);
      const b=el('button','pres-el'); b.type='button';
      const im=document.createElement('img'); im.src=visageDe(i); im.alt=''; b.appendChild(im);
      b.appendChild(el('div','nom',nom));
      const e=el('div','etat');
      e.textContent = (d.oublis.length?'🚫'+d.oublis.length+' ':'')
                    + (d.absences.length?'✗'+d.absences.length+' ':'')
                    + (d.mots.length?'💬'+d.mots.length:'')
                    || '— rien à signaler';
      b.appendChild(e);
      b.title=nom+' — '+d.oublis.length+' oubli(s), '+d.absences.length+' absence(s), '+d.mots.length+' mot(s)';
      b.addEventListener('click',()=> ouvrirDossier(i));
      h.appendChild(b);
    });
  };
  peindreDossiers();
  const base=window.allerA;
  window.allerA=function(id){ base(id); if(id==='e-groupes') peindreDossiers(); };
})();

/* ═════════ F. PARTAGE + DONNÉES REJOIGNENT LES RÉGLAGES ═════════ */
(function regrouperReglages(){
  const reg=$('#e-reglages'); if(!reg) return;
  [['e-partage','📤 Partager avec un collègue'],
   ['e-donnees','💾 Mes données']].forEach(([id,titre])=>{
    const ec=document.getElementById(id); if(!ec) return;
    const box=el('div','reg-section');
    box.appendChild(el('h3',null,titre));
    /* on déplace le contenu tel quel : rien n'est réécrit, rien n'est perdu */
    [...ec.children].forEach(n=>{ if(!n.matches('h1.titre')) box.appendChild(n); });
    reg.appendChild(box);
    ec.remove();
  });
})();

/* ═════════ RIEN NE DOIT DEVENIR INJOIGNABLE ═════════
   Réduire la barre à cinq portes a coupé l'accès au carnet, au bulletin, aux
   tests, au mois et à l'année. Leurs fonctions n'ont pas disparu — il leur
   faut juste une porte au bon endroit :
   · le carnet et le bulletin regardent un GROUPE   → MES GROUPES
   · le mois et l'année regardent l'ANNÉE            → CALENDRIER
   · les tests se passent PENDANT un cours           → la séance */
function barreLiens(hoteId, liens, avant){
  const ec=document.getElementById(hoteId); if(!ec) return;
  const b=el('div'); b.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px';
  liens.forEach(([id,lab])=>{
    const x=el('button','mini',lab); x.type='button';
    x.dataset.va=id;                       /* traçable : le contrôle d'accès le voit */
    x.addEventListener('click',()=>allerA(id));
    b.appendChild(x);
  });
  ec.insertBefore(b, avant ? ec.querySelector(avant) : ec.children[1]);
}
barreLiens('e-groupes', [['e-carnet','📊 CARNET DE NOTES'],['e-bulletin','🎓 BULLETINS']]);
barreLiens('e-calendrier', [['e-mois','📅 VOIR PAR MOIS'],['e-annee','📚 VOIR L’ANNÉE']]);
/* et le chemin du retour, depuis chacun */
[['e-carnet','e-groupes','← MES GROUPES'],['e-bulletin','e-groupes','← MES GROUPES'],
 ['e-mois','e-calendrier','← CALENDRIER'],['e-annee','e-calendrier','← CALENDRIER'],
 ['e-tests','e-accueil','← MA SEMAINE'],['e-journee','e-accueil','← MA SEMAINE'],
 ['e-evaluation','e-accueil','← MA SEMAINE'],['e-presences','e-accueil','← MA SEMAINE'],
 ['e-messages','e-accueil','← MA SEMAINE'],['e-jeux','e-accueil','← MA SEMAINE'],
].forEach(([de,vers,lab])=> barreLiens(de,[[vers,lab]]));

/* les tests rejoignent la séance */
(function testsDansSeance(){
  if (typeof peindreActionsSeance !== 'function') return;
  const base=peindreActionsSeance;
  window.peindreActionsSeance=function(){
    base();
    const h=$('#seActions'); if(!h) return;
    if (h.querySelector('[data-tests]')) return;
    const b=el('button','se-action'); b.type='button'; b.dataset.tests='1';
    b.innerHTML='<span class="emo">🏃</span><span class="lab">TESTS</span>'
      +'<span class="etat">chrono, navette, Léger-Boucher</span>';
    b.addEventListener('click',()=>{ fermerModale(); allerA('e-tests'); });
    h.appendChild(b);
  };
})();

/* contrôle : aucun écran ne doit rester sans porte */
(function verifierAcces(){
  const joignables=new Set([...document.querySelectorAll('[data-va]')].map(b=>b.dataset.va));
  joignables.add('e-tests');                      // par la séance
  const orphelins=[...document.querySelectorAll('.ecran')]
    .map(s=>s.id)
    .filter(id=> !joignables.has(id) && !document.querySelector('#'+id+' button'));
  if (orphelins.length) console.warn('[proto] écrans sans porte :', orphelins);
})();

/* ═════════ VALIDER MA SEMAINE — depuis MA SEMAINE ═════════
   L'écran MESSAGES a été retiré : le mot sur un cours vit dans la séance.
   Restaient deux choses qui ne sont pas des messages de cours — valider sa
   semaine, et la vue coordonnateur. Elles trouvent leur place ici : on valide
   sa semaine depuis sa semaine. */
(function validerDansLaSemaine(){
  const ecran=$('#e-accueil'); if(!ecran) return;
  const pan=el('div','pan pan--jaune');
  pan.innerHTML='<h2>✅ Ma semaine est prête</h2>'
    +'<p style="font-family:var(--f-note);font-size:17px;margin:0 0 10px">'
    +'Quand tout est planifié, ce bouton la marque terminée et prévient le coordonnateur.</p>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">'
    +'<button type="button" class="m-valider" id="valSem">✔ MA SEMAINE EST PRÊTE</button>'
    +'<button type="button" class="mini" id="coordoSem">👑 VUE COORDONNATEUR</button>'
    +'<span id="valEtat2" style="font-weight:800"></span></div>'
    +'<div id="coordoVue2" style="margin-top:12px"></div>';
  ecran.appendChild(pan);
  const maj=()=>{
    const v=lire('semaineValidee',null);
    $('#valEtat2').textContent = v ? '✅ validée le '+v : '';
    $('#valSem').disabled=!!v;
  };
  $('#valSem').addEventListener('click',()=>{
    ecrire('semaineValidee', jourLisible(aujourdhuiISO())+' à '+maintenantHM()); maj(); });
  $('#coordoSem').addEventListener('click',()=>{
    const on=!lire('coordo2',false); ecrire('coordo2',on);
    const v=$('#coordoVue2'); v.innerHTML='';
    $('#coordoSem').textContent = on ? '↩ REVENIR À MA VUE' : '👑 VUE COORDONNATEUR';
    if (!on) return;
    [['Joey — 5A', lire('semaineValidee',null)],['Sophie — 4B','jeudi 27 août'],
     ['Marc — 6A',null],['Ana — 3A',null]].forEach(([nom,quand])=>{
      const d=el('div','hist-ligne');
      d.appendChild(el('b',null,nom));
      d.appendChild(el('span',null, quand ? '✅ semaine validée le '+quand : '⏳ pas encore validée'));
      v.appendChild(d);
    });
  });
  maj();
})();

/* contrôle final : plus aucun écran sans porte */
(function controleAcces(){
  const cibles=new Set([...document.querySelectorAll('[data-va]')].map(b=>b.dataset.va));
  cibles.add('e-tests');
  const orphelins=[...document.querySelectorAll('.ecran')].map(s=>s.id).filter(id=>!cibles.has(id));
  if (orphelins.length) console.warn('[proto] écrans sans porte :', orphelins);
  else console.info('[proto] tous les écrans ont une porte.');
})();

/* l'heure de l'en-tête, comme sur le site */
(function horloge(){
  const n=document.querySelector('[data-heure]'); if(!n) return;
  const D=x=>String(x).padStart(2,'0');
  const tic=()=>{ const d=new Date(); n.textContent=D(d.getHours())+':'+D(d.getMinutes())+':'+D(d.getSeconds()); };
  tic(); setInterval(tic,1000);
})();
