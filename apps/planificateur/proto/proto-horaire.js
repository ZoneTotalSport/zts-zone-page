/* ==========================================================================
   MON HORAIRE — combien de périodes, et où sont les pauses.
   Joey, 28 août : « dans réglages, permets d'ajuster le nombre de périodes à
   la discrétion de l'internaute ; de plus, permets d'ajouter les récréations
   et le dîner. »
   L'horaire était figé dans le code (six périodes, deux récréations, un dîner,
   aux heures de SON école). Il devient une donnée : on ajoute, on retire, on
   réordonne, on écrit ses heures. L'agenda le relit.
   ========================================================================== */
'use strict';

const HORAIRE_DEFAUT = [
  {t:'p', nom:'Période 1', h:'8:00 à 8:50'},
  {t:'p', nom:'Période 2', h:'8:50 à 9:40'},
  {t:'r', nom:'Récréation', h:''},
  {t:'p', nom:'Période 3', h:'10:00 à 10:50'},
  {t:'p', nom:'Période 4', h:'10:50 à 11:40'},
  {t:'r', nom:'Dîner', h:''},
  {t:'p', nom:'Période 5', h:'13:05 à 13:55'},
  {t:'r', nom:'Récréation', h:''},
  {t:'p', nom:'Période 6', h:'14:15 à 15:05'},
];
function horaire(){ return lire('horaire', null) || HORAIRE_DEFAUT; }
function poserHoraire(l){
  /* les périodes se renumérotent toutes seules : le prof ne compte pas */
  let n=0;
  l.forEach(x=>{ if (x.t==='p'){ n++; if (/^Période \d+$/.test(x.nom)) x.nom='Période '+n; } });
  ecrire('horaire', l);
  peindreHoraire(); if (typeof peindreAgenda==='function') peindreAgenda();
}
/* le numéro de période d'une ligne — c'est lui qui sert de clé aux séances */
function numPeriode(l, i){
  let n=0; for (let k=0;k<=i;k++) if (l[k].t==='p') n++;
  return n;
}

function peindreHoraire(){
  const h=$('#horListe'); if(!h) return;
  const l=horaire(); h.innerHTML='';
  l.forEach((x,i)=>{
    const n=el('div','hor-ligne'+(x.t==='r'?' hor-ligne--pause':''));
    n.innerHTML='<span class="prise" draggable="true" title="Glisser pour replacer">⠿</span>'
      +'<span class="hor-quoi"></span>'
      +'<div class="hor-nom" contenteditable data-vide="Son nom"></div>'
      +'<div class="hor-h" contenteditable data-vide="ex. 8:00 à 8:50"></div>'
      +'<button type="button" class="mini mini--rose hor-sup" title="Retirer">✕</button>';
    n.querySelector('.hor-quoi').textContent = x.t==='p' ? '📘' : '🍎';
    const nom=n.querySelector('.hor-nom'), heu=n.querySelector('.hor-h');
    nom.textContent=x.nom; heu.textContent=x.h;
    const enr=()=>{ const q=horaire(); q[i].nom=nom.textContent.trim()||q[i].nom;
                    q[i].h=heu.textContent.trim(); ecrire('horaire',q);
                    if (typeof peindreAgenda==='function') peindreAgenda(); };
    [nom,heu].forEach(z=>{ z.addEventListener('blur',enr);
      z.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); z.blur(); } }); });
    n.querySelector('.hor-sup').addEventListener('click',()=>{
      const q=horaire();
      if (q[i].t==='p' && q.filter(y=>y.t==='p').length<=1){
        alert('Il faut au moins une période.'); return; }
      if (!confirm('Retirer « '+q[i].nom+' » ?')) return;
      q.splice(i,1); poserHoraire(q);
    });
    const prise=n.querySelector('.prise');
    prise.addEventListener('dragstart',e=>{ n.classList.add('drag');
      e.dataTransfer.setData('text/zts-hor', String(i)); e.dataTransfer.effectAllowed='move'; });
    prise.addEventListener('dragend',()=> n.classList.remove('drag'));
    n.addEventListener('dragover',e=>{
      if(![...(e.dataTransfer.types||[])].includes('text/zts-hor'))return;
      e.preventDefault(); n.classList.add('over'); });
    n.addEventListener('dragleave',()=> n.classList.remove('over'));
    n.addEventListener('drop',e=>{
      const k=parseInt(e.dataTransfer.getData('text/zts-hor'),10);
      if (isNaN(k)||k===i) return;
      e.preventDefault(); n.classList.remove('over');
      const q=horaire(); const [y]=q.splice(k,1); q.splice(i,0,y); poserHoraire(q);
    });
    h.appendChild(n);
  });
  const cpt=$('#horCompte');
  if (cpt) cpt.textContent = l.filter(x=>x.t==='p').length+' période(s) · '
    + l.filter(x=>x.t==='r').length+' pause(s)';
}

(function reglageHoraire(){
  const ecran=$('#e-reglages'); if(!ecran) return;
  const box=el('div','reg-section');
  box.innerHTML='<h3>🕐 Mon horaire</h3>'
    +'<p style="margin:0 0 10px;font-family:var(--f-note);font-size:17px">'
    +'Autant de périodes que tu veux, et les pauses où elles sont chez toi. '
    +'Glisse le ⠿ pour replacer. <b id="horCompte"></b></p>'
    +'<div class="hor-liste" id="horListe"></div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">'
    +'<button type="button" class="mini mini--lime" data-add="p">+ UNE PÉRIODE</button>'
    +'<button type="button" class="mini mini--jaune" data-add="r">+ UNE RÉCRÉATION</button>'
    +'<button type="button" class="mini mini--jaune" data-add="d">+ UN DÎNER</button>'
    +'<button type="button" class="mini" data-add="raz">↺ REPRENDRE L’HORAIRE DE BASE</button></div>';
  ecran.insertBefore(box, ecran.children[1] || null);
  box.addEventListener('click',e=>{
    const t=e.target.closest('[data-add]'); if(!t) return;
    const q=horaire();
    if (t.dataset.add==='raz'){ if(confirm('Reprendre l’horaire de base ?')) poserHoraire(HORAIRE_DEFAUT.map(x=>({...x}))); return; }
    if (t.dataset.add==='p') q.push({t:'p', nom:'Période', h:''});
    if (t.dataset.add==='r') q.push({t:'r', nom:'Récréation', h:''});
    if (t.dataset.add==='d') q.push({t:'r', nom:'Dîner', h:''});
    poserHoraire(q);
  });
  peindreHoraire();
})();

/* L'agenda appelle periodesAgenda() (proto-fusion.js), qui appelle horaire().
   Il suffit donc de le repeindre — poserHoraire() s'en charge. */
if (typeof peindreAgenda==='function') peindreAgenda();

/* ═════════ PARTAGER MON TEMPS TRAVAILLÉ ═════════
   Joey : « dans mon temps travaillé, permets de le partager à qui il le
   souhaite. » Trois chemins, parce qu'aucun ne marche partout : le courriel
   (le plus direct), la copie (quand le courriel n'est pas configuré), et le
   téléchargement en CSV (pour la direction qui veut un fichier). */
function rapportTemps(){
  const l=[];
  const an=lire('ed:t-annee','')||'—', ec=lire('ed:t-ecole','')||'—';
  l.push('MON TEMPS TRAVAILLÉ');
  l.push('Année : '+an+'   ·   École : '+ec);
  l.push('');
  let n=0;
  $$('#tempsCorps tr').forEach(tr=>{
    const c=[...tr.querySelectorAll('[contenteditable]')].map(x=>x.textContent.trim());
    if (!c[0] && !c[1] && !c[2]) return;
    n++; l.push('  • '+(c[0]||'—')+'   '+(c[1]||'—')+'   '+(c[2]||'—'));
  });
  if (!n) l.push('  (aucune ligne remplie)');
  l.push('');
  l.push('Temps total       : '+($('#tTotal')||{}).textContent);
  l.push('Temps reconnu     : '+($('#tReconnu')||{}).textContent);
  l.push('TOTAL (de plus)   : '+($('#tDePlus')||{}).textContent);
  const s1=lire('ed:t-sig1',''), s2=lire('ed:t-sig2','');
  if (s1 || s2){ l.push(''); l.push('Signature direction    : '+(s1||'—'));
                 l.push('Signature responsable  : '+(s2||'—')); }
  return l.join('\n');
}
(function partagerTemps(){
  const ecran=$('#e-temps'); if(!ecran) return;
  const box=el('div','pan pan--cyan');
  box.innerHTML='<h2>📤 Envoyer mon relevé</h2>'
    +'<p style="margin:0 0 10px;font-family:var(--f-note);font-size:17px">'
    +'À ta direction, à ton syndicat, à qui tu veux. Rien ne part sans que tu le décides.</p>'
    +'<div class="reg-ligne"><b>À qui&nbsp;?</b>'
    +'<input class="m-saisie" id="tpQui" placeholder="courriel de la personne" style="flex:1;min-width:200px"></div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">'
    +'<button type="button" class="mini mini--lime" id="tpMail">✉️ ENVOYER PAR COURRIEL</button>'
    +'<button type="button" class="mini" id="tpCopie">📋 COPIER LE RELEVÉ</button>'
    +'<button type="button" class="mini" id="tpCsv">📊 TÉLÉCHARGER EN CSV</button></div>'
    +'<pre class="pr-rapport" id="tpApercu" hidden></pre>';
  ecran.appendChild(box);

  $('#tpMail').addEventListener('click',()=>{
    const qui=$('#tpQui').value.trim();
    const suj='Mon temps travaillé — '+(lire('ed:t-annee','')||'');
    const url='mailto:'+encodeURIComponent(qui)+'?subject='+encodeURIComponent(suj)
             +'&body='+encodeURIComponent(rapportTemps());
    if (url.length > 1900){
      alert('Le relevé est trop long pour un courriel préparé automatiquement.\n'
           +'Utilise « COPIER LE RELEVÉ » et colle-le dans ton message.');
      return;
    }
    location.href=url;
  });
  $('#tpCopie').addEventListener('click', async ()=>{
    const t=rapportTemps();
    $('#tpApercu').hidden=false; $('#tpApercu').textContent=t;
    const b=$('#tpCopie');
    try { await navigator.clipboard.writeText(t); b.textContent='📋 COPIÉ — colle-le où tu veux'; }
    catch(e){ b.textContent='📋 COPIE REFUSÉE — sélectionne le texte ci-dessous'; }
    setTimeout(()=>b.textContent='📋 COPIER LE RELEVÉ', 2600);
  });
  $('#tpCsv').addEventListener('click',()=>{
    const ech=v=>'"'+String(v).replace(/"/g,'""')+'"';
    const l=[['Date','Activité','Temps']];
    $$('#tempsCorps tr').forEach(tr=>{
      const c=[...tr.querySelectorAll('[contenteditable]')].map(x=>x.textContent.trim());
      if (c[0]||c[1]||c[2]) l.push([c[0]||'',c[1]||'',c[2]||'']);
    });
    l.push([]); l.push(['Temps total', ($('#tTotal')||{}).textContent, '']);
    l.push(['Temps reconnu', ($('#tReconnu')||{}).textContent, '']);
    l.push(['Total de plus', ($('#tDePlus')||{}).textContent, '']);
    telecharger('mon-temps-'+aujourdhuiISO()+'.csv',
      '﻿'+l.map(r=>r.map(ech).join(';')).join('\n'), 'text/csv');
  });
})();
