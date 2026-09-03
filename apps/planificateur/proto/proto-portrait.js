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

/* ═════════ relire toutes les séances écrites ═════════
   ⚠ J'AVAIS ÉCRIT ICI UNE SECONDE `toutesSeances()`, alors que proto-dossiers.js
   en définissait déjà une. Ce fichier étant chargé APRÈS, la mienne écrasait la
   sienne en silence — et elle triait dans l'ordre INVERSE. Le dossier d'un élève
   de MES GROUPES listait donc ses absences du plus ancien au plus récent au lieu
   du contraire, sans qu'aucune erreur ne le signale.
   Une seule définition subsiste, celle de proto-dossiers.js, dans SON ordre
   (le plus récent d'abord). Le portrait remet dans l'ordre du calendrier ce
   qu'il affiche, puisque c'est un fil chronologique. C'est exactement le piège
   des deux `const` du même nom, en version fonction. */
function seancesDuGroupe(grId){
  return toutesSeances()
    .filter(x=> x.s && x.s.gr===grId)
    .sort((a,b)=> a.iso===b.iso ? a.per-b.per : (a.iso<b.iso?-1:1));
}

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
  /* ⚠ DEUX ENTRÉES DEPUIS QUE LES DEUX ÉCRANS SONT SÉPARÉS. Effacer les
     présences ne doit pas emporter le linge, ni l'inverse : ce sont deux
     consignations distinctes, et le bouton d'un écran ne parle que de lui. */
  presences:  {quoi:'les absences de cette période',
               plein:s=>Object.values(s.pres||{}).some(v=>v==='absent'),
               vide:s=>{ Object.keys(s.pres||{}).forEach(i=>{
                 if (s.pres[i]==='absent') delete s.pres[i]; }); }},
  linge:      {quoi:'les pièces de linge manquantes',
               plein:s=>Object.keys(s.linge||{}).length>0,
               vide:s=>{ s.linge={};
                 Object.keys(s.pres||{}).forEach(i=>{
                   if (s.pres[i]==='sans') delete s.pres[i]; }); }},
  evaluation: {quoi:'les critères et toutes les cotes',
               plein:s=>(s.evalCrits||[]).length>0 || Object.keys(s.notes||{}).length>0,
               vide:s=>{ s.evalCrits=[]; s.notes={}; }},
  message:    {quoi:'le mot sur ce cours',
               plein:s=>!!(s.message||'').trim(), vide:s=>{ s.message=''; }},
  portrait:   {quoi:'les notes d’élèves de cette période',
               plein:s=>Object.keys(s.notesEl||{}).length>0, vide:s=>{ s.notesEl={}; }},
};
/* ⚠ UN SEUL LANGAGE DANS LE COIN D'UNE CARTE (G3-FICHE). Le coin portait DEUX
   symboles selon les cartes : ☐/☑ (« est-ce dans ma planification ? », posé par
   `decorerPortes`) et ✕ (« effacer ce qui est consigné »). Deux gestes opposés
   au même endroit, dont un destructeur — pour un enfant de 10 ans, c'est un
   piège. Le coin ne garde que ☐/☑ ; effacer devient un bouton nommé, en bas du
   volet concerné, là où l'on voit ce qu'on s'apprête à perdre.
   Cette fonction ne fait plus que NETTOYER les ✕ d'une version antérieure. */
function decorerEffacables(){
  $$('.se-action .se-vider').forEach(x=> x.remove());
}

/* Le bouton d'effacement, à poser en bas d'un volet. `null` si rien à effacer. */
function boutonEffacer(k){
  if (typeof seanceOuverte==='undefined' || !seanceOuverte) return null;
  const {iso,per}=seanceOuverte; const s=seanceDe(iso,per); if(!s) return null;
  const E=EFFACABLE[k]; if (!E || !E.plein(s)) return null;
  const b=el('button','mini mini--rose se-effacer','✕ EFFACER '+E.quoi.toUpperCase());
  b.type='button'; b.title='Effacer '+E.quoi;
  b.addEventListener('click',()=>{
    if (!confirm('Effacer '+E.quoi+' ?\n\nCe qui a été consigné le '
                 +jourLisible(iso)+' à la période '+per+' sera perdu.')) return;
    majSeance(y=>E.vide(y));
  });
  return b;
}
window.boutonEffacer = boutonEffacer;

/* ═════════ LE VOLET PORTRAIT ═════════ */
function voletPortrait(d){
  const {iso,per}=seanceOuverte; const s=seanceDe(iso,per);
  const g=grpDe(s.gr);
  if (!g){ d.appendChild(el('div','cahier-vide','Ce groupe a été retiré ; son portrait est parti avec lui.')); return; }
  const hist=seancesDuGroupe(g.id);

  /* ══════════════════════════════════════════════════════════════════════
     ZONE 1 — L'EN-TÊTE DU GROUPE (3 septembre, v167)
     Joey : « la page empile deux choses — en haut la carte de la période, en
     dessous le vrai portrait. Elle ne dit pas une seule chose. »

     ⚠ NI DATE, NI PÉRIODE, NI TUILES DE FONCTION. Elles restent sur la carte
     de MA JOURNÉE, là où l'on travaille une période. Le portrait, lui, regarde
     un GROUPE sur toute son année : y afficher « jeudi 3 septembre · période 1 »
     donnait à lire une date au moment précis où l'on veut en oublier une.
     Elles ne sont pas supprimées : les blocs `#seTete`, `#seMot` et `#seActions`
     sont simplement MASQUÉS par l'enveloppe de `volet()`, au bas de ce fichier,
     et réapparaissent dans tous les autres volets.

     ⚠ LE FOND PASSE PAR `poserFondDeGroupe()`, la même fonction que la carte de
     MA JOURNÉE, la case de MA SEMAINE et la pastille de MON MOIS. C'est le
     quatrième écran à s'en servir, et c'est tout l'objet de cette fonction :
     un groupe se reconnaît au même dégradé et à la même image, partout.
     Opacités 88→30 % — entre celles de la carte (85→25) et de la case de
     semaine (92→55) : l'en-tête est large, l'image a la place de respirer.

     ⚠ LA PORTE « couleur ou photo » VIVAIT DANS `#seParure`, QUI PART AVEC
     `#seTete`. Rien n'est perdu, au contraire : le bouton « Personnaliser »
     ouvre `modifierGroupe()`, qui porte la couleur, la photo, ET le sport et le
     titulaire depuis v165. Une porte de plus qu'avant, pas une de moins. */
  const tete=el('div','pt-tete');
  if (typeof poserFondDeGroupe==='function' && typeof imageDuSport==='function'){
    poserFondDeGroupe(tete, g, imageDuSport(g), .88, .30);
  } else {
    tete.style.background=g.coul;                 /* proto-sports.js absent */
  }
  tete.style.color=encreSur(g.coul);

  const ident=el('div','pt-tete-ident');
  /* ⚠ PASTILLES BLANCHES À ENCRE `--ink`, jamais l'encre du groupe : 17:1 de
     contraste, et surtout INDÉPENDANT de `g.coul`, qui peut être n'importe quel
     `#rrggbb` venu du sélecteur libre. Même règle que sur la carte. */
  ident.appendChild(el('span','pt-tete-num', g.nom));
  const tit=(g.titulaire||'').trim();
  if (tit){
    const pt=el('span','pt-tete-tit', tit);
    pt.title='Titulaire du groupe '+g.nom;
    ident.appendChild(pt);
  }
  tete.appendChild(ident);

  const nEl=(g.eleves||[]).length;
  tete.appendChild(el('div','pt-tete-nb', nEl+' élève'+(nEl>1?'s':'')));

  const perso=el('button','mini pt-tete-perso','✎ PERSONNALISER'); perso.type='button';
  perso.title='Le nom, la couleur, l’image, le sport, le titulaire et les élèves de '+g.nom;
  /* ⚠ ON REFERME LA FICHE AVANT D'OUVRIR L'AUTRE FENÊTRE : les deux passent par
     `ouvrirModale()`, qui écrase `#modaleCorps`. Sans le `fermerModale()`, la
     séance resterait « ouverte » dans `seanceOuverte` au-dessus d'un DOM qui ne
     lui appartient plus. */
  perso.addEventListener('click',()=>{ const id=g.id; fermerModale(); modifierGroupe(id); });
  tete.appendChild(perso);
  d.appendChild(tete);

  /* ── la note explicative, repliée derrière un ⓘ ──
     ⚠ MÊME PATRON QUE LA LIGNE DE CONSIGNE DE LA FEUILLE (`aideRepliee`,
     proto-seance.js) : dépliée la toute première fois, repliée ensuite. On lit
     une consigne une fois ; la garder ouverte à chaque visite repoussait le
     tableau des élèves — ce qu'on vient vraiment voir — sous le premier écran. */
  if (typeof aideRepliee==='function'){
    d.appendChild(aideRepliee('📔', 'Le portrait de '+g.nom+' se remplit tout seul',
      'Tout ce qui a été consigné pour <b>'+g.nom+'</b>, période par période — '
      +'présences, linge, cotes, mots et notes d’élèves. <b>Rien ne s’écrit ici</b> : '
      +'le portrait se remplit à mesure que tu travailles dans tes séances.',
      'aidePortrait'));
  }

  /* ── ce qu'on a cumulé, en un coup d'œil ── */
  /* ⚠ ON RETIENT LES DATES, PLUS SEULEMENT DES COMPTEURS. Joey, 3 septembre :
     « mes attentes sont de me dire l'historique des élèves étant absent, QUAND,
     et quand l'élève n'avait pas son linge — souliers, short, t-shirt. »
     « 3 absences » ne permet pas de répondre à un parent ; « les 8, 15 et
     22 septembre » oui. Rien n'est calculé en plus : on parcourait déjà toutes
     les séances pour incrémenter `abs` et `sans`, on garde simplement ce qu'on
     avait sous la main au lieu de le jeter. */
  const st={}; g.eleves.forEach(i=> st[i]={abs:0, sans:0, sous:0, notes:[],
                                            quandAbs:[], quandSans:[]});
  let nCotes=0, nMots=0;
  hist.forEach(x=>{
    Object.keys(x.s.pres||{}).forEach(i=>{
      if(!st[i]) return;
      if (x.s.pres[i]==='absent'){ st[i].abs++; st[i].quandAbs.push({iso:x.iso, per:x.per}); }
      if (x.s.pres[i]==='sans'){
        st[i].sans++;
        /* les pièces manquantes de CE jour-là — vide pour une séance d'avant le
           détail par pièce, et la date reste alors seule, ce qui est honnête */
        const pieces=(typeof lingeDe==='function') ? lingeDe(x.s, i) : [];
        st[i].quandSans.push({iso:x.iso, per:x.per, pieces:pieces});
      }
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
  /* ⚠ LES CINQ COMPTEURS NE SONT PLUS EN TÊTE — ILS DESCENDENT EN PIED DE
     TABLEAU. Joey : « les 5 compteurs deviennent une ligne de totaux. » Posés en
     haut, ils repoussaient le tableau des élèves sous le premier écran alors
     qu'ils ne font que TOTALISER ses colonnes : la ligne de totaux est leur
     place naturelle, sous ce qu'ils additionnent.
     ⚠ AUCUN CHIFFRE NE CHANGE, ET AUCUNE DONNÉE N'EST TOUCHÉE. Les cinq sont
     RELUS des séances (`hist`, `st`, `nCotes`, `nMots`, calculés juste au-dessus
     et inchangés) ; seul le moment où on les dessine se déplace. `totaux` est
     donc une fonction, appelée plus bas quand le tableau existe.
     ⚠ CLASSE PROPRE, PAS `.pres-compte` : la même classe sert au dossier
     d'élève (proto-dossiers.js) et à la fiche de séance. La retoucher pour le
     pied d'un tableau déplacerait deux écrans qui n'ont rien demandé. */
  const totaux = ()=>[
    ['🗓', hist.length, 'période'+(hist.length>1?'s':''), ''],
    ['✗',  Object.keys(st).reduce((a,i)=>a+st[i].abs,0),  'absence(s)', 'a'],
    ['🚫', Object.keys(st).reduce((a,i)=>a+st[i].sans,0), 'oubli(s) de linge', 's'],
    ['📝', nCotes, 'cote(s) à revoir', ''],
    ['💬', nMots,  'mot(s) de cours',  ''],
  ];

  /* ── les suivis encore ouverts, tous confondus ── */
  const ouverts=[];
  hist.forEach(x=> Object.keys(x.s.notesEl||{}).forEach(i=>{
    const n=x.s.notesEl[i];
    if (n && n.t && n.suivi && !n.regle) ouverts.push({iso:x.iso, per:x.per, i:+i, n:n});
  }));
  /* ⚠ LE BLOC N'APPARAÎT QUE S'IL Y A QUELQUE CHOSE À SUIVRE. Joey : « sinon
     rien. » Il affichait « ⚑ À SUIVRE (0) — Rien en attente. Tout est réglé »,
     soit deux lignes et un cadre pour dire qu'il n'y a rien à dire, juste
     au-dessus du tableau qu'on vient consulter. Un drapeau qui se lève quand
     tout va bien, on cesse de le regarder — et le jour où il compte, on ne le
     voit plus. L'information n'est pas perdue : quand le compte est à zéro, il
     n'y a rien à perdre. */
  const bs=el('div','se-cours'); bs.style.marginBottom='12px';
  bs.appendChild(el('h4',null,'⚑ À SUIVRE ('+ouverts.length+')'));
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
  if (ouverts.length) d.appendChild(bs);

  /* ── les élèves, un par ligne ── */
  const be=el('div','se-cours'); be.style.marginBottom='12px';
  be.appendChild(el('h4',null,'👥 LES ÉLÈVES DE '+g.nom));
  const dit=el('div');
  dit.style.cssText='font-family:var(--f-note);font-size:16px;color:var(--ink-soft);margin:-4px 0 9px;line-height:1.25';
  dit.textContent='Le cumul de toutes les périodes de ce groupe. « À revoir » compte '
    +'les fois où tu as donné autre chose que le meilleur niveau.';
  be.appendChild(dit);
  const t=el('table','gril');
  const tb=el('tbody');
  const th=el('tr');
  /* ⚠ « Cotes sous le max » ne voulait rien dire pour personne — Joey : « c'est
     quoi au juste, ça ? » C'est du vocabulaire de programmeur. Chaque colonne
     porte maintenant un nom qu'on lit sans traduire, et son explication en
     infobulle. */
  [['Élève',''],
   ['Absences','Combien de fois cet élève a été marqué absent, et à quelles dates'],
   ['Linge oublié','Combien de fois il ou elle est arrivé sans son linge, à quelles dates, et quelle pièce manquait'],
   ['À revoir','Combien de fois tu lui as donné autre chose que le meilleur niveau, tous critères et toutes périodes confondus'],
   ['Ce que j’ai noté','Tes notes écrites sur cet élève, avec leur date'],
   ['','']].forEach(([x,quoi])=>{
    const h=el('th',null,x);
    if (quoi) h.title=quoi;
    th.appendChild(h);
  });
  tb.appendChild(th);
  g.eleves.forEach(i=>{
    const tr=el('tr'); const td=el('td','el');
    const v=el('div','visage');
    const im=document.createElement('img'); im.src=photoDe(i); im.alt='';
    v.appendChild(im); v.appendChild(el('b',null,ELEVES[i]));
    td.appendChild(v); tr.appendChild(td);
    /* ── Absences : le compte, puis les dates ──
       ⚠ LES PLUS RÉCENTES D'ABORD, et bornées à quatre avec un « +n ». Un élève
       absent douze fois ferait une colonne de douze lignes qui écrase la
       rangée ; les quatre dernières répondent à la question qu'on se pose
       vraiment, et le fil complet est deux blocs plus bas. */
    const cellDates=(n, liste, rendu)=>{
      const td=el('td','pt-quand');
      td.appendChild(el('div','pt-quand-n', String(n)));
      if (!n) return td;
      const rec=liste.slice().reverse();
      rec.slice(0,4).forEach(x=> td.appendChild(rendu(x)));
      if (rec.length>4) td.appendChild(el('div','pt-quand-plus','+'+(rec.length-4)+' autre(s)'));
      return td;
    };
    tr.appendChild(cellDates(st[i].abs, st[i].quandAbs, x=>{
      const d=el('div','pt-quand-l');
      d.textContent=jourLisible(x.iso)+' · p'+x.per;
      return d;
    }));
    tr.appendChild(cellDates(st[i].sans, st[i].quandSans, x=>{
      const d=el('div','pt-quand-l');
      d.appendChild(el('span','pt-quand-d', jourLisible(x.iso)+' · p'+x.per));
      if (x.pieces.length){
        const q=el('span','pt-quand-p',
          x.pieces.map(k=>{ const P=(typeof PIECES_LINGE!=='undefined'
            ? PIECES_LINGE.find(y=>y[0]===k) : null); return P ? P[1]+' '+P[2] : k; }).join(' · '));
        q.title='Ce qui manquait ce jour-là';
        d.appendChild(q);
      }
      return d;
    }));
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
  /* ── LA LIGNE DE TOTAUX, en pied de tableau ──
     ⚠ DANS UN VRAI `<tfoot>`, PAS DANS UNE DIV POSÉE DESSOUS. Le tableau défile
     horizontalement (`overflowX` juste en dessous) : une ligne de totaux hors
     du tableau resterait immobile pendant que les colonnes glissent sous elle,
     et un total finirait sous la mauvaise colonne. Dans le tableau, elle glisse
     avec lui.
     ⚠ ELLE OCCUPE TOUTE LA LARGEUR EN UNE SEULE CELLULE (`colspan`), et ce
     n'est pas un renoncement : trois des cinq compteurs — périodes, cotes à
     revoir, mots de cours — ne totalisent AUCUNE colonne du tableau. Les poser
     sous « Absences » ou « Linge oublié » ferait lire des chiffres qui ne s'y
     rapportent pas. Ce sont les totaux DU GROUPE, pas ceux des colonnes. */
  /* ⚠ LE CORPS AVANT LE PIED, ET IL AVAIT DISPARU. En insérant le `<tfoot>`
     des totaux j'ai emporté le `t.appendChild(tb)` qui le précédait : le
     tableau ne portait plus que sa ligne de totaux, sans en-tête ni élèves —
     et sans la moindre erreur, puisqu'un `<tbody>` détaché reste un objet
     parfaitement valide. Mesuré dans le navigateur : 1 `tr`, 1 `td`,
     0 visage, pour un groupe de 6. */
  t.appendChild(tb);

  const pied=el('tfoot');
  const trT=el('tr','pt-totaux');
  const tdT=el('td'); tdT.colSpan=6;
  const zone=el('div','pt-totaux-zone');
  zone.appendChild(el('span','pt-totaux-lab','EN TOUT'));
  totaux().forEach(([emo,n,mot,cls])=>{
    const sp=el('span','pt-total'+(cls?' pt-total--'+cls:''));
    sp.appendChild(el('b',null, emo+' '+n));
    sp.appendChild(el('span',null, ' '+mot));
    zone.appendChild(sp);
  });
  tdT.appendChild(zone); trT.appendChild(tdT); pied.appendChild(trT);
  t.appendChild(pied);

  const env=el('div'); env.style.overflowX='auto'; env.appendChild(t);
  /* ⚠ UN GROUPE SANS ÉLÈVES NE DOIT PAS RENDRE UN TABLEAU VIDE. Il n'en disait
     rien : une ligne d'en-tête, une ligne de totaux à zéro, et le prof devant
     une grille sans savoir si son groupe est vide ou si l'app a échoué. La
     porte est nommée, et c'est la même que celle de l'en-tête. */
  if (!g.eleves.length){
    const vide=el('div','cahier-vide pt-vide');
    vide.textContent='Ce groupe n’a pas encore d’élèves. ';
    const b=el('button','mini','✎ EN AJOUTER'); b.type='button';
    b.title='Ouvrir « Personnaliser » pour choisir les élèves de '+g.nom;
    b.addEventListener('click',()=>{ const id=g.id; fermerModale(); modifierGroupe(id); });
    vide.appendChild(b);
    be.appendChild(vide);
  }
  be.appendChild(env);
  d.appendChild(be);

  /* ── le fil des périodes, de la plus récente à la plus ancienne ── */
  /* ⚠ REPLIÉ PAR DÉFAUT, ET C'EST LE PLUS LONG BLOC DE L'ÉCRAN. Une année de
     cours fait des dizaines de cartes ; déplié, il enterrait tout ce qui le
     précède. Joey : « replié par défaut, un tap ouvre, compteur N périodes sur
     la ligne repliée. »
     ⚠ UN `<details>`, PAS UN BOUTON ET UNE CLASSE. Le navigateur sait déjà
     ouvrir et fermer, au clavier comme au doigt, et l'annonce aux lecteurs
     d'écran ; le patron est déjà celui de « ✍️ Ma planification, en mots » au
     bas de la feuille. Rien n'est perdu : tout l'historique est là, à un tap.
     ⚠ IL N'EST PAS `open` MÊME QUAND IL EST VIDE : « 0 période » sur la ligne
     repliée dit déjà tout ce qu'il y a à savoir, sans rien ouvrir. */
  const bp=el('details','se-cours pt-fil');
  const som=document.createElement('summary');
  som.className='pt-fil-som';
  som.appendChild(el('span','pt-fil-titre','🗓 PÉRIODE PAR PÉRIODE'));
  som.appendChild(el('span','pt-fil-n', hist.length+' période'+(hist.length>1?'s':'')));
  bp.appendChild(som);
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
                                    +cotesSousMax(x.s).length+' à revoir');
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

  /* ⚠ LA CARTE DE PÉRIODE SE RETIRE DANS LE PORTRAIT, ET REVIENT PARTOUT
     AILLEURS (3 septembre, v167). `ouvrirSeance()` pose quatre blocs dans la
     fenêtre : `#seTete` (photo, nom, DATE ET PÉRIODE), `#seMot`, `#seActions`
     (les tuiles LA PLANIFICATION / JEUX / ÉVALUER) et `#seDetail`, qui seul
     porte le volet. Le portrait n'écrivait donc que le dernier, et héritait des
     trois autres — d'où l'empilement que Joey décrit.
     On les MASQUE, on ne les supprime pas : `hidden`, exactement comme
     `volet('cours')` le fait déjà pour `#seActions` en plein écran.
     ⚠ `#seSuivis` AUSSI, et ce n'est pas un oubli inversé : `peindreSuivis()`
     insère ce bandeau AVANT `#seActions`, si bien qu'il survivrait au masquage
     des trois autres et ferait DOUBLON avec le bloc « À suivre » du portrait,
     à deux centimètres de distance.
     ⚠ ON RÉ-AFFICHE AVANT D'APPELER LA SUITE, jamais après : `volet('cours')`
     re-masque `#seActions` de son côté, et il doit avoir le dernier mot. */
  /* ⚠ LES TROIS TUILES NE PARAISSENT PLUS DANS AUCUN VOLET (3 sept, v170).
     Joey : « dans TOUS les volets ouverts depuis la carte, masquer les 3 tuiles
     LA PLANIFICATION / JEUX / ÉVALUER. Elles restent sur la carte de
     MA JOURNÉE, leur seule place. »
     Elles ne servaient qu'à naviguer d'un volet à l'autre — or on arrive
     TOUJOURS ici par l'un des six boutons de la case du groupe, qui font déjà
     ce travail. Les garder, c'était offrir deux navigations pour un seul
     besoin, et occuper le haut de chaque écran avec la porte qu'on vient de
     franchir.
     ⚠ MASQUÉES, JAMAIS RETIRÉES : `hidden`, comme le portrait le fait depuis
     v167. `peindreActionsSeance()` continue de les peindre — leurs crochets,
     leurs états, le menu des gabarits d'évaluation restent calculés et prêts.
     Rétablir la rangée tient en une ligne ici.
     ⚠ `#seTete` ET `#seMot` RESTENT dans les volets ordinaires : l'en-tête dit
     de quel groupe et de quelle période on parle — c'est le contexte de ce
     qu'on est en train de saisir. Seul le PORTRAIT les masque aussi, parce
     qu'il regarde le groupe sur toute l'année et porte son propre en-tête. */
  function poserLeHaut(quoi){
    const portrait = (quoi === 'portrait');
    ['#seTete', '#seMot', '#seSuivis'].forEach(sel=>{
      const n=$(sel); if (n) n.hidden = portrait;
    });
    /* les tuiles : masquées dans TOUS les volets, portrait compris */
    const a=$('#seActions'); if (a) a.hidden = true;
  }
  const _voletAvant = volet;
  volet = function(quoi){
    if (quoi==='portrait'){
      ecrire('seVolet','portrait');
      const d=$('#seDetail'); if(!d) return;
      poserLeHaut('portrait');
      /* ⚠ LE TITRE DE LA FENÊTRE DISAIT « Période 1 ». Le portrait regarde un
         GROUPE sur toute son année : annoncer une période au-dessus de son
         historique complet, c'est nommer la fenêtre d'après ce qu'elle ne
         montre plus. Il redevient « Période N » dans tous les autres volets,
         juste en dessous. */
      const s=seanceDe(seanceOuverte.iso, seanceOuverte.per);
      const g=s && grpDe(s.gr);
      const t=$('#modaleTitre');
      if (t) t.textContent = g ? ('Portrait de '+g.nom) : 'Portrait du groupe';
      d.innerHTML=''; voletPortrait(d); return;
    }
    poserLeHaut(quoi);
    const t=$('#modaleTitre');
    if (t && seanceOuverte) t.textContent = 'Période '+seanceOuverte.per;
    _voletAvant(quoi);
  };

  const _actionsAvant = peindreActionsSeance;
  peindreActionsSeance = function(){
    _actionsAvant();
    const h=$('#seActions'); if(!h) return;
    const {iso,per}=seanceOuverte; const s=seanceDe(iso,per); if(!s) return;
    const hist=seancesDuGroupe(s.gr);
    const nn=hist.reduce((a,x)=>a+Object.keys(x.s.notesEl||{}).length,0);
    /* ⚠ PLUS DE CARTE « PORTRAIT DU GROUPE » (G3-FICHE) : on touche le nom du
       groupe dans l'en-tête de la fiche, qui est déjà écrit là. La carte
       répétait ce que l'en-tête disait. `volet('portrait')` est inchangé.
       (`hist` et `nn` restent calculés : ils servent aux suivis ci-dessous.) */
    peindreSuivis();
    decorerEffacables();
    /* ⚠ ON REMASQUE APRÈS COUP, ET C'EST OBLIGATOIRE. `peindreSuivis()` vient
       de CRÉER `#seSuivis` : il n'existait pas encore quand `volet('portrait')`
       a masqué la carte de période, et il revenait donc à l'écran par-dessus
       l'en-tête du groupe — le doublon exact qu'on cherchait à éviter, à deux
       centimètres du bloc « À suivre » du portrait. Mesuré avant correctif :
       `#seTete`, `#seMot` et `#seActions` masqués, `#seSuivis` visible.
       Un seul appel suffit, et il vaut pour les quatre : c'est l'état du volet
       courant qui décide, pas l'endroit d'où l'on vient. */
    poserLeHaut(lire('seVolet',''));
  };
})();
