/* ==========================================================================
   LE PORTRAIT DU GROUPE — tout ce qu'on a consigné, réuni.
   Joey, 28 août : « toutes les évaluations, toutes les présences, tout le
   linge, notes etc. est contenu dans un bouton appelé portrait du groupe ».
   « Permet de noter certains élèves facilement à la période, et cela sera
   contenu dans portrait avec date. » « Si l'internaute a noté quelque chose à
   une période et qu'il faut un suivi, cela l'indique à la période suivante. »

   ⚠ CE FICHIER N'INVENTE AUCUNE DONNÉE. Il relit les séances déjà écrites
   (`protog2:se:<jour>:p<n>`) et les recompose. Une seule chose s'y ajoute :
   la NOTE D'ÉLÈVE, `s.notesEl[indexEleve] = {t, suivi, regle}` — une note par
   élève et par période, c'est le geste réel d'un prof qui en voit six par jour.

   ⚠ NE PAS CONFONDRE avec le dossier de MES GROUPES (`proto-dossiers.js`) :
   là-bas, le prof SAISIT à la main des absences et des incidents. Ici, rien ne
   se saisit — le portrait est le cumul automatique de ce qui a été fait en
   séance. Les deux se complètent, ils ne se doublent pas.
   ========================================================================== */
'use strict';

/* ═════════ relire toutes les séances écrites ═════════ */
function toutesSeances(){
  const out=[];
  for (let i=0;i<localStorage.length;i++){
    const brut=localStorage.key(i);
    if (!brut || brut.indexOf(P+'se:')!==0) continue;
    const cle=brut.slice(P.length);
    const m=/^se:(\d{4}-\d{2}-\d{2}):p(\d+)$/.exec(cle);
    if (!m) continue;
    const s=lire(cle,null); if(!s) continue;
    out.push({iso:m[1], per:+m[2], s});
  }
  /* le fil du groupe se lit dans l'ordre du calendrier */
  out.sort((a,b)=> a.iso===b.iso ? a.per-b.per : (a.iso<b.iso?-1:1));
  return out;
}
function seancesDuGroupe(grId){ return toutesSeances().filter(x=>x.s.gr===grId); }

/* Les cotes STRICTEMENT sous le maximum — les seules qui disent « à revoir ».
   ⚠ Depuis que rien n'est coloré d'avance, une cote au maximum s'enregistre
   comme les autres : compter les clés de `s.notes` compterait les élèves qui
   vont très bien. */
function cotesSousMax(s){
  const m = (typeof maxFacon==='function') ? maxFacon() : 100;
  return Object.keys(s.notes||{}).filter(k=> s.notes[k] < m);
}

/* Les suivis laissés AVANT cette séance-ci et jamais réglés.
   ⚠ « La période suivante » veut dire : la prochaine fois qu'on voit CE
   groupe — pas la période d'après dans la journée. Un prof d'ÉPS revoit 101
   deux jours plus tard ; c'est là que le rappel doit tomber. Le drapeau reste
   levé tant qu'on ne l'a pas réglé, donc il traverse autant de séances qu'il
   le faut. */
function suivisOuverts(grId, iso, per){
  const out=[];
  seancesDuGroupe(grId).forEach(x=>{
    if (x.iso>iso || (x.iso===iso && x.per>=per)) return;
    Object.keys(x.s.notesEl||{}).forEach(i=>{
      const n=x.s.notesEl[i];
      if (n && n.t && n.suivi && !n.regle) out.push({iso:x.iso, per:x.per, i:+i, n:n});
    });
  });
  return out;
}
function reglerSuivi(iso, per, i){
  const s=seanceDe(iso,per); if(!s||!s.notesEl||!s.notesEl[i]) return;
  s.notesEl[i].regle=true;
  ecrire(cleSeance(iso,per), s);
  peindreActionsSeance();
}

/* ═════════ le bandeau « à suivre », en tête de la séance ═════════ */
function peindreSuivis(){
  if (typeof seanceOuverte==='undefined' || !seanceOuverte) return;
  const {iso,per}=seanceOuverte; const s=seanceDe(iso,per); if(!s) return;
  const vieux=$('#seSuivis'); if (vieux) vieux.remove();
  const l=suivisOuverts(s.gr, iso, per); if(!l.length) return;
  const h=el('div','se-suivis'); h.id='seSuivis';
  h.appendChild(el('h4',null,'⚑ À SUIVRE — laissé la dernière fois ('+l.length+')'));
  l.forEach(x=>{
    const li=el('div','suivi');
    const im=document.createElement('img'); im.src=photoDe(x.i); im.alt='';
    li.appendChild(im);
    const t=el('div','txt');
    t.appendChild(el('b',null,ELEVES[x.i]));
    t.appendChild(el('div','quoi',x.n.t));
    t.appendChild(el('div','quand', jourLisible(x.iso)+' · période '+x.per));
    li.appendChild(t);
    const ok=el('button','mini mini--lime','✔ RÉGLÉ'); ok.type='button';
    ok.title='Ce suivi est fait — ne plus me le rappeler';
    ok.addEventListener('click',()=> reglerSuivi(x.iso,x.per,x.i));
    li.appendChild(ok);
    h.appendChild(li);
  });
  const act=$('#seActions'); if (act && act.parentNode) act.parentNode.insertBefore(h, act);
}

/* ═════════ noter un élève, à cette période ═════════ */
function noterEleve(i){
  const {iso,per}=seanceOuverte; const s=seanceDe(iso,per); if(!s) return;
  const n=(s.notesEl||{})[i] || {t:'', suivi:false, regle:false};
  const corps=ouvrirModale('Noter '+ELEVES[i]);
  corps.innerHTML=`
    <button type="button" class="mini" id="neRetour" style="margin-bottom:12px">← RETOUR À LA SÉANCE</button>
    <div class="ne-qui">
      <img id="neVisage" alt="">
      <div><b id="neNom"></b><div class="quand" id="neQuand"></div></div>
    </div>
    <div class="m-champ"><label class="m-lab" for="neTxt">Ce que je note sur lui ou elle, aujourd’hui</label>
      <textarea class="m-saisie" id="neTxt" rows="4"
        style="font-family:var(--f-note);font-size:18px"
        placeholder="Ex. : s’est blessé au poignet · a oublié son linge 3 fois · gros progrès au service"></textarea></div>
    <label class="ne-suivi" for="neSuivi">
      <input type="checkbox" id="neSuivi">
      <span><b>⚑ À suivre la prochaine fois</b>
      <small>La note s’affichera en haut de la prochaine séance de ce groupe, et y restera tant que tu ne l’auras pas marquée réglée.</small></span></label>
    <div class="m-pied">
      <button type="button" class="m-valider" id="neOk">✔ ENREGISTRER</button>
      <button type="button" class="mini mini--rose" id="neSup">🗑 EFFACER CETTE NOTE</button>
    </div>`;
  $('#neVisage').src=photoDe(i);
  $('#neNom').textContent=ELEVES[i];
  $('#neQuand').textContent=jourLisible(iso)+' · période '+per;
  $('#neTxt').value=n.t||'';
  $('#neSuivi').checked=!!n.suivi;
  const retour=()=>{ fermerModale(); ouvrirSeance(iso,per); };
  $('#neRetour').addEventListener('click', retour);
  $('#neOk').addEventListener('click',()=>{
    const t=$('#neTxt').value.trim();
    majSeanceSansRedessin(x=>{
      x.notesEl=x.notesEl||{};
      /* une note vidée s'efface : pas de coquille vide dans le portrait */
      if (!t) delete x.notesEl[i];
      else x.notesEl[i]={t:t, suivi:$('#neSuivi').checked, regle:false};
    });
    retour();
  });
  $('#neSup').addEventListener('click',()=>{
    if (!(n.t||'') || confirm('Effacer la note sur '+ELEVES[i]+' ?')){
      majSeanceSansRedessin(x=>{ if(x.notesEl) delete x.notesEl[i]; });
      retour();
    }
  });
}

/* ═════════ EFFACER CE QU'ON N'A PLUS BESOIN DE GARDER ═════════
   Joey : « si je pèse sur période, permet d'effacer par un X des fonctions que
   j'ai utilisées mais dont je n'ai plus besoin. »
   ⚠ Ce ✕ n'est PAS la case à cocher. La case dit si la fonction est DANS la
   planification ; le ✕ jette ce qu'elle a CONSIGNÉ pour cette période-là. On
   peut vouloir garder les présences dans son cours et effacer celles d'hier. */
const EFFACABLE = {
  cours:      {quoi:'toute la planification de cette période',
               plein:s=>(s.etapes||[]).some(e=>e.titre||e.desc||e.duree||(e.medias||[]).length||e.fait),
               vide:s=>{ const v=seanceVide(s.gr); s.etapes=v.etapes; s.seq=v.seq; }},
  minuterie:  {quoi:'le temps consigné', plein:s=>!!s.minuterie, vide:s=>{ s.minuterie=0; }},
  presences:  {quoi:'les présences et le linge',
               plein:s=>Object.keys(s.pres||{}).length>0, vide:s=>{ s.pres={}; }},
  evaluation: {quoi:'les critères et toutes les cotes',
               plein:s=>(s.evalCrits||[]).length>0 || Object.keys(s.notes||{}).length>0,
               vide:s=>{ s.evalCrits=[]; s.notes={}; }},
  message:    {quoi:'le mot sur ce cours',
               plein:s=>!!(s.message||'').trim(), vide:s=>{ s.message=''; }},
  portrait:   {quoi:'les notes d’élèves de cette période',
               plein:s=>Object.keys(s.notesEl||{}).length>0, vide:s=>{ s.notesEl={}; }},
};
function decorerEffacables(){
  if (typeof seanceOuverte==='undefined' || !seanceOuverte) return;
  const {iso,per}=seanceOuverte; const s=seanceDe(iso,per); if(!s) return;
  $$('.se-action[data-k]').forEach(b=>{
    const k=b.dataset.k, E=EFFACABLE[k];
    const vieux=b.querySelector('.se-vider'); if (vieux) vieux.remove();
    if (!E || !E.plein(s)) return;
    const x=el('button','se-vider','✕');
    x.setAttribute('role','button'); x.tabIndex=0;
    x.title='Effacer '+E.quoi;
    const jeter=ev=>{ ev.stopPropagation(); ev.preventDefault();
      if (!confirm('Effacer '+E.quoi+' ?\n\nCe qui a été consigné le '
                   +jourLisible(iso)+' à la période '+per+' sera perdu.')) return;
      majSeance(y=>E.vide(y));
    };
    x.addEventListener('click', jeter);
    x.addEventListener('keydown', ev=>{ if(ev.key===' '||ev.key==='Enter') jeter(ev); });
    /* le ✕ est posé en bas à droite : on creuse la place, sinon il s'assoit
       sur la dernière ligne de l'état. */
    b.style.paddingBottom='24px';
    b.appendChild(x);
  });
}

/* ═════════ LE VOLET PORTRAIT ═════════ */
function voletPortrait(d){
  const {iso,per}=seanceOuverte; const s=seanceDe(iso,per);
  const g=grpDe(s.gr);
  if (!g){ d.appendChild(el('div','cahier-vide','Ce groupe a été retiré ; son portrait est parti avec lui.')); return; }
  const hist=seancesDuGroupe(g.id);

  const aide=el('div','aide-un-mot');
  aide.innerHTML='<span class="emo">📔</span>Tout ce qui a été consigné pour <b>'+g.nom+'</b>, '
    +'période par période — présences, linge, cotes, mots et notes d’élèves. '
    +'<b>Rien ne s’écrit ici</b> : le portrait se remplit tout seul à mesure que tu travailles.';
  d.appendChild(aide);

  /* ── ce qu'on a cumulé, en un coup d'œil ── */
  const st={}; g.eleves.forEach(i=> st[i]={abs:0, sans:0, sous:0, notes:[]});
  let nCotes=0, nMots=0;
  hist.forEach(x=>{
    Object.keys(x.s.pres||{}).forEach(i=>{
      if(!st[i]) return;
      if (x.s.pres[i]==='absent') st[i].abs++;
      if (x.s.pres[i]==='sans')   st[i].sans++;
    });
    cotesSousMax(x.s).forEach(k=>{
      nCotes++; const i=k.split('|')[0]; if (st[i]) st[i].sous++;
    });
    if ((x.s.message||'').trim()) nMots++;
    Object.keys(x.s.notesEl||{}).forEach(i=>{
      const n=x.s.notesEl[i];
      if (st[i] && n && n.t) st[i].notes.push({t:n.t, suivi:n.suivi, regle:n.regle, iso:x.iso, per:x.per});
    });
  });
  const cpt=el('div','pres-compte');
  [['🗓 '+hist.length+' période'+(hist.length>1?'s':''),''],
   ['✗ '+Object.keys(st).reduce((a,i)=>a+st[i].abs,0)+' absence(s)','a'],
   ['🚫 '+Object.keys(st).reduce((a,i)=>a+st[i].sans,0)+' oubli(s) de linge','s'],
   ['📝 '+nCotes+' cote(s) sous le maximum',''],
   ['💬 '+nMots+' mot(s) de cours',''],
  ].forEach(([txt,cls])=> cpt.appendChild(el('span',cls,txt)));
  d.appendChild(cpt);

  /* ── les suivis encore ouverts, tous confondus ── */
  const ouverts=[];
  hist.forEach(x=> Object.keys(x.s.notesEl||{}).forEach(i=>{
    const n=x.s.notesEl[i];
    if (n && n.t && n.suivi && !n.regle) ouverts.push({iso:x.iso, per:x.per, i:+i, n:n});
  }));
  const bs=el('div','se-cours'); bs.style.marginBottom='12px';
  bs.appendChild(el('h4',null,'⚑ À SUIVRE ('+ouverts.length+')'));
  if (!ouverts.length) bs.appendChild(el('div','cahier-vide','Rien en attente. Tout est réglé.'));
  ouverts.forEach(x=>{
    const li=el('div','suivi');
    const im=document.createElement('img'); im.src=photoDe(x.i); im.alt=''; li.appendChild(im);
    const t=el('div','txt');
    t.appendChild(el('b',null,ELEVES[x.i]));
    t.appendChild(el('div','quoi',x.n.t));
    t.appendChild(el('div','quand', jourLisible(x.iso)+' · période '+x.per));
    li.appendChild(t);
    const ok=el('button','mini mini--lime','✔ RÉGLÉ'); ok.type='button';
    ok.addEventListener('click',()=>{ reglerSuivi(x.iso,x.per,x.i); volet('portrait'); });
    li.appendChild(ok);
    bs.appendChild(li);
  });
  d.appendChild(bs);

  /* ── les élèves, un par ligne ── */
  const be=el('div','se-cours'); be.style.marginBottom='12px';
  be.appendChild(el('h4',null,'👥 LES ÉLÈVES DE '+g.nom));
  const t=el('table','gril');
  const tb=el('tbody');
  const th=el('tr');
  ['Élève','Absences','Linge oublié','Cotes sous le max','Ce que j’ai noté',''].forEach(x=> th.appendChild(el('th',null,x)));
  tb.appendChild(th);
  g.eleves.forEach(i=>{
    const tr=el('tr'); const td=el('td','el');
    const v=el('div','visage');
    const im=document.createElement('img'); im.src=photoDe(i); im.alt='';
    v.appendChild(im); v.appendChild(el('b',null,ELEVES[i]));
    td.appendChild(v); tr.appendChild(td);
    tr.appendChild(el('td',null, String(st[i].abs)));
    tr.appendChild(el('td',null, String(st[i].sans)));
    tr.appendChild(el('td',null, String(st[i].sous)));
    const tn=el('td');
    if (!st[i].notes.length) tn.appendChild(el('span','cahier-vide','—'));
    st[i].notes.slice().reverse().forEach(n=>{
      const li=el('div','pt-note');
      li.appendChild(el('span','q', (n.suivi&&!n.regle?'⚑ ':'')+n.t));
      li.appendChild(el('span','d', jourLisible(n.iso)+' · p'+n.per));
      tn.appendChild(li);
    });
    tr.appendChild(tn);
    const ta=el('td');
    const b=el('button','mini','✎ NOTER'); b.type='button';
    b.title='Noter '+ELEVES[i]+' pour cette période';
    b.addEventListener('click',()=> noterEleve(i));
    ta.appendChild(b); tr.appendChild(ta);
    tb.appendChild(tr);
  });
  t.appendChild(tb);
  const env=el('div'); env.style.overflowX='auto'; env.appendChild(t);
  be.appendChild(env);
  d.appendChild(be);

  /* ── le fil des périodes, de la plus récente à la plus ancienne ── */
  const bp=el('div','se-cours');
  bp.appendChild(el('h4',null,'🗓 PÉRIODE PAR PÉRIODE'));
  if (!hist.length) bp.appendChild(el('div','cahier-vide','Aucune période encore consignée.'));
  hist.slice().reverse().forEach(x=>{
    const c=el('div','pt-per'+(x.iso===iso && x.per===per ? ' pt-per--ici' : ''));
    const q=el('div','quand', jourLisible(x.iso)+' · période '+x.per
              +(x.iso===iso && x.per===per ? ' · celle-ci' : ''));
    c.appendChild(q);
    const bouts=[];
    const pr=Object.keys(x.s.pres||{});
    const abs=pr.filter(i=>x.s.pres[i]==='absent').length;
    const sans=pr.filter(i=>x.s.pres[i]==='sans').length;
    if (pr.length) bouts.push('✅ '+(x.s.gr?((grpDe(x.s.gr)||{eleves:[]}).eleves.length-pr.length):0)
                              +' avec linge · '+sans+' sans · '+abs+' absent(s)');
    const act=(x.s.etapes||[]).filter(e=>e.phase==='pendant'&&e.titre).map(e=>e.titre);
    if (act.length) bouts.push('📋 '+act.join(' · '));
    if ((x.s.evalCrits||[]).length) bouts.push('📝 '+x.s.evalCrits.length+' critère(s) · '
                                    +Object.keys(x.s.notes||{}).length+' cote(s) posée(s) · '
                                    +cotesSousMax(x.s).length+' sous le maximum');
    if (x.s.minuterie) bouts.push('⏱️ '+mmss(x.s.minuterie));
    if ((x.s.message||'').trim()) bouts.push('💬 '+x.s.message.trim());
    const nn=Object.keys(x.s.notesEl||{}).length;
    if (nn) bouts.push('📌 '+nn+' note(s) d’élève');
    if (!bouts.length) bouts.push('Rien de consigné.');
    bouts.forEach(b=> c.appendChild(el('div','quoi',b)));
    bp.appendChild(c);
  });
  d.appendChild(bp);
}

/* ═════════ brancher le portrait sur la séance ═════════ */
(function brancherPortrait(){
  if (typeof volet !== 'function' || typeof peindreActionsSeance !== 'function') return;

  const _voletAvant = volet;
  volet = function(quoi){
    if (quoi==='portrait'){
      ecrire('seVolet','portrait');
      const d=$('#seDetail'); if(!d) return;
      d.innerHTML=''; voletPortrait(d); return;
    }
    _voletAvant(quoi);
  };

  const _actionsAvant = peindreActionsSeance;
  peindreActionsSeance = function(){
    _actionsAvant();
    const h=$('#seActions'); if(!h) return;
    const {iso,per}=seanceOuverte; const s=seanceDe(iso,per); if(!s) return;
    const hist=seancesDuGroupe(s.gr);
    const nn=hist.reduce((a,x)=>a+Object.keys(x.s.notesEl||{}).length,0);
    const b=el('button','se-action'); b.type='button'; b.dataset.k='portrait';
    b.innerHTML='<span class="emo">📔</span><span class="lab">PORTRAIT DU GROUPE</span><span class="etat"></span>';
    b.querySelector('.etat').textContent=hist.length+' période(s) · '+nn+' note(s) d’élève';
    b.addEventListener('click',()=> volet('portrait'));
    h.appendChild(b);
    peindreSuivis();
    decorerEffacables();
  };
})();
