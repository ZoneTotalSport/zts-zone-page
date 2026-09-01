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
/* ⚠ UNE JOURNÉE AVAIT DEUX NOTES QUI S'IGNORAIENT. Le calendrier écrivait sous
   `caljour:<iso>`, la case de MON MOIS sous `ed:mn-<iso>` : on notait « sortie
   au parc » dans l'un, l'autre restait vide, et personne ne pouvait le deviner.
   Une seule clé désormais — `ed:mn-<iso>`, celle que `brancherEditables()`
   utilise déjà pour la case du mois. Les anciennes notes sont reprises. */
function cleNoteJour(iso){ return 'ed:mn-'+iso; }
function noteJour(iso){ return lire(cleNoteJour(iso), '') || ''; }
function poserNoteJour(iso, txt){ ecrire(cleNoteJour(iso), String(txt||'')); }
(function migrerNotesDeJour(){
  if (lire('notesJourMigre', false)) return;
  let n=0;
  Object.keys(localStorage).forEach(k=>{
    const m=/^protog2:caljour:(\d{4}-\d{2}-\d{2})$/.exec(k); if(!m) return;
    const v=lire('caljour:'+m[1], ''); if(!v) return;
    if (!noteJour(m[1])){ poserNoteJour(m[1], v); n++; }
  });
  ecrire('notesJourMigre', true);
  if (n) console.info('[proto] '+n+' note(s) de journée reprises sous la clé du mois.');
})();

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
  n.addEventListener('input',()=>{ poserNoteJour(iso, n.textContent);
    if (typeof peindreMois==='function') peindreMois(); });
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
      /* ⚠ LE COMPTE-RENDU DISAIT « NON RECONNUE(S) » CE QUI VENAIT D'ÊTRE GARDÉ.
         Les dates qui ne sont ni congé ni pédagogique ne sont plus jetées : ce
         sont les dates scolaires importantes, notées à leur journée. Les
         annoncer comme un échec faisait croire à une perte. */
      const bouts=[a.trouves.length+' journée(s) posée(s) au calendrier'];
      if (a.neuves)  bouts.push(a.neuves+' date(s) importante(s) notée(s)');
      if (a.cycles)  bouts.push(a.cycles+' jour(s)-cycle recalculé(s)');
      if (a.hors)    bouts.push(a.hors+' hors année scolaire');
      z.textContent='✔ '+f.name+' — '+bouts.join(' · ')+'.';
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

/* ═════════ E. L'HISTORIQUE D'UN ÉLÈVE — RETIRÉ ═════════
   ⚠ Ici vivaient `toutesLesSeances()`, `dossierEleve()` et `ouvrirDossier()`.
   Ils étaient MORTS : proto-dossiers.js définit les deux derniers sous les mêmes
   noms et se charge APRÈS ce fichier — ses versions gagnaient à tous les coups.
   Celles d'ici n'ont plus jamais tourné depuis que MES GROUPES a été refait en
   trois niveaux. Retirées plutôt que laissées dormantes : deux fonctions du même
   nom dans un projet, c'est un piège qui finit toujours par se refermer.
   Le dossier d'un élève vit désormais dans proto-dossiers.js, et lui seul. */

/* ═════════ F. PARTAGE + DONNÉES REJOIGNENT LES RÉGLAGES ═════════ */
/* ⚠ LE PARTAGE RESSORT DES RÉGLAGES. Il y était entré quand la barre n'avait
   que cinq portes et qu'il fallait bien le ranger quelque part ; ⋯ PLUS lui
   donne maintenant sa propre tuile, et « partager avec un collègue » n'est pas
   un réglage. MES DONNÉES reste dans les réglages : sauvegarde, restauration
   et vidage y sont à leur place. */
(function regrouperReglages(){
  const reg=$('#e-reglages'); if(!reg) return;
  [['e-donnees','💾 Mes données']].forEach(([id,titre])=>{
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
barreLiens('e-groupes', [['e-carnet','📊 CARNET DE NOTES'],['e-bulletin','🎓 BULLETINS']], '.pan');
barreLiens('e-calendrier', [['e-mois','📅 VOIR PAR MOIS'],['e-annee','📚 VOIR L’ANNÉE']]);
/* et le chemin du retour, depuis chacun.
   ⚠ LES SEPT ÉCRANS DE ⋯ PLUS EN ONT BESOIN EUX AUSSI : sans porte de retour,
   une tuile mène à un cul-de-sac dont on ne sort qu'en cherchant l'onglet. */
[['e-carnet','e-groupes','← MES GROUPES'],['e-bulletin','e-groupes','← MES GROUPES'],
 /* ⚠ PLUS DE « ← CALENDRIER » : MON MOIS et MON ANNÉE ont leur propre porte
    dans la barre, ils ne sont plus des sous-écrans du calendrier scolaire.
    Le lien reste, mais LATÉRAL — on va y régler ses congés, on n'en « revient »
    pas. */
 ['e-mois','e-calendrier','📆 CALENDRIER SCOLAIRE'],
 ['e-annee','e-calendrier','📆 CALENDRIER SCOLAIRE'],
 ['e-tests','e-aujourdhui','← AUJOURD’HUI'],
 ['e-evaluation','e-accueil','← MA SEMAINE'],['e-presences','e-accueil','← MA SEMAINE'],
 ['e-messages','e-accueil','← MA SEMAINE'],['e-jeux','e-accueil','← MA SEMAINE'],
 /* ⚠ SEULS LES ÉCRANS SANS PORTE PROPRE ONT BESOIN D'UN RETOUR. Le calendrier,
    le parascolaire et les réglages ont désormais leur bouton dans la barre :
    leur « ← PLUS » mentirait, il ne ramènerait pas d'où l'on vient. Le partage
    s'ouvre depuis l'en-tête ; sa porte de retour reste, elle est son seul
    chemin inverse. */
 ['e-groupes','e-plus','← PLUS'],['e-coordo','e-plus','← PLUS'],
 ['e-partage','e-aujourdhui','← MA JOURNÉE'],
].forEach(([de,vers,lab])=> barreLiens(de,[[vers,lab]]));

/* ⚠ PLUS DE CARTE « TESTS » DANS LA FICHE (G3-FICHE). Elle était voisine
   d'ÉVALUATION et disait le même geste : juger où en est l'élève. Les deux ont
   fusionné en une seule carte ÉVALUER, et l'écran des tests s'ouvre depuis son
   volet (proto-seance.js, volet('evaluation')). Rien n'est perdu : `e-tests`
   reste un écran à part entière, et la PIÈCE « UN TEST » reste dans la palette
   de la planification. */

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
/* ⚠ LA VUE COORDONNATEUR ÉTAIT ÉCRITE DEUX FOIS. Une version complète dans
   proto-fusion.js, qui ne tournait pas — elle visait `#e-messages`, un écran
   retiré — et cette version-ci, plus courte, refaite ici parce que l'autre
   semblait absente. On garde la complète, qui a maintenant son écran (⋯ PLUS
   › Vue coordonnateur), et ce bouton disparaît. Valider sa semaine reste ici :
   ça, c'est bien un geste de la semaine. */
(function validerDansLaSemaine(){
  const ecran=$('#e-accueil'); if(!ecran) return;
  const pan=el('div','pan pan--jaune');
  pan.innerHTML='<h2>✅ Ma semaine est prête</h2>'
    +'<p style="font-family:var(--f-note);font-size:17px;margin:0 0 10px">'
    +'Quand tout est planifié, ce bouton la marque terminée et prévient le coordonnateur.</p>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">'
    +'<button type="button" class="m-valider" id="valSem">✔ MA SEMAINE EST PRÊTE</button>'
    +'<span id="valEtat2" style="font-weight:800"></span></div>';
  ecran.appendChild(pan);
  const maj=()=>{
    const v=lire('semaineValidee',null);
    $('#valEtat2').textContent = v ? '✅ validée le '+v : '';
    $('#valSem').disabled=!!v;
  };
  $('#valSem').addEventListener('click',()=>{
    ecrire('semaineValidee', jourLisible(aujourdhuiISO())+' à '+maintenantHM()); maj(); });
  maj();
})();

/* contrôle final : plus aucun écran sans porte */
/* ⚠ LE CONTRÔLE A ÉTÉ DÉPLACÉ EN FIN DE CHARGEMENT (proto-g3.js). Ici, il
   tournait avant que la barre à trois onglets et les tuiles de ⋯ PLUS aient
   posé leurs `data-va` : il criait à l'orphelin sur des écrans parfaitement
   joignables, et on apprenait à ignorer son avertissement. */

/* l'heure de l'en-tête, comme sur le site */
(function horloge(){
  const n=document.querySelector('[data-heure]'); if(!n) return;
  const D=x=>String(x).padStart(2,'0');
  const tic=()=>{ const d=new Date(); n.textContent=D(d.getHours())+':'+D(d.getMinutes())+':'+D(d.getSeconds()); };
  tic(); setInterval(tic,1000);
})();
