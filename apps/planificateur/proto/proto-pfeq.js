/* ==========================================================================
   LE PROGRAMME DE FORMATION — l'arborescence complète, pour choisir ce qu'on
   évalue au lieu de le deviner.
   Joey, 28 août : « l'évaluation : mets tout ce qui est dans le programme de
   formation, les intentions pédagogiques, les thèmes importants, et ensuite
   des sous-thèmes à cliquer ; puis sélectionner comment on évalue (chiffre,
   ++/+/+-/-/--, etc.) et permettre d'écrire manuellement exactement ce qui
   sera évalué. Puis créer la liste avec cela. »

   Le parcours : compétence → son intention → ses thèmes → les sous-thèmes
   qu'on coche → ce qu'on ajoute à la main → l'échelle → la grille.

   Les sous-thèmes sont les 67 critères relevés dans apps/planificateur/app.js,
   regroupés sous les thèmes du programme. Les intentions sont celles du PFEQ
   en éducation physique et à la santé.
   ========================================================================== */
'use strict';

const PFEQ = [
  {
    id:'c1', nom:'C1 · Agir', couleur:'#00C2E8',
    titre:'Agir dans divers contextes de pratique d’activités physiques',
    intention:'Amener l’élève à exécuter des actions motrices efficaces, seul, '
             +'en planifiant sa démarche, en l’exécutant et en l’évaluant.',
    themes:[
      {nom:'🏃 Se déplacer', quoi:'locomotion et déplacements',
       sous:['Locomotion (courir, sauter, ramper)','Sauter (hauteur, longueur)','Rouler (roulade avant, arrière)',
             'Grimper et suspension','Esquiver et feinter','Agilité et changements de direction']},
      {nom:'🤾 Manipuler un objet', quoi:'ce qu’on fait avec un ballon, une raquette, un bâton',
       sous:['Manipulation d’objets','Lancer (précision, force, trajectoire)','Attraper (réception, amortissement)',
             'Frapper (pied, main, raquette, bâton)','Dribbler (ballon, rondelle)']},
      {nom:'🧘 Se tenir et se coordonner', quoi:'équilibre, posture, rythme',
       sous:['Équilibre et coordination','Posture et alignement','Rythme et tempo',
             'Enchaînement de mouvements','Latéralité (dominant / non-dominant)']},
      {nom:'🎯 Bien exécuter', quoi:'la qualité du geste',
       sous:['Exécution d’actions motrices','Application de principes liés à l’exécution',
             'Efficacité des actions motrices','Précision du geste technique']},
      {nom:'💪 Ses capacités', quoi:'ce que le corps peut donner',
       sous:['Puissance et force','Souplesse et flexibilité','Endurance cardiovasculaire',
             'Vitesse de réaction et d’exécution']},
      {nom:'🧠 Sa démarche', quoi:'planifier, faire, se relire',
       sous:['Planification de sa démarche','Évaluation de sa démarche','Respect des règles de sécurité']},
    ]
  },
  {
    id:'c2', nom:'C2 · Interagir', couleur:'#FFA200',
    titre:'Interagir dans divers contextes de pratique d’activités physiques',
    intention:'Amener l’élève à ajuster ses actions à celles de ses partenaires '
             +'et de ses adversaires, dans le respect de l’esprit sportif.',
    themes:[
      {nom:'🤝 Coopérer', quoi:'jouer avec les autres',
       sous:['Coopération avec les partenaires','Synchronisation des actions','Ajustement au partenaire',
             'Passe et réception en mouvement','Encouragement des pairs']},
      {nom:'⚔️ S’opposer', quoi:'jouer contre les autres',
       sous:['Opposition face aux adversaires','Ajustement à l’adversaire','Démarquage',
             'Feinte et diversion','Rôles offensifs','Rôles défensifs']},
      {nom:'💬 Communiquer', quoi:'se comprendre sans parler, et en parlant',
       sous:['Communication motrice','Lecture du jeu','Prise de décision rapide','Leadership dans l’équipe']},
      {nom:'🧭 Lire le jeu', quoi:'comprendre l’espace et le moment',
       sous:['Application de principes d’action','Occupation de l’espace de jeu']},
      {nom:'🏅 Esprit sportif', quoi:'comment on gagne et comment on perd',
       sous:['Respect des règles du jeu','Esprit sportif','Gestion des conflits',
             'Acceptation de la défaite','Célébration respectueuse']},
    ]
  },
  {
    id:'c3', nom:'C3 · Sain et actif', couleur:'#A3FF00',
    titre:'Adopter un mode de vie sain et actif',
    intention:'Amener l’élève à faire des choix éclairés pour sa santé et à '
             +'s’engager dans une pratique régulière d’activité physique.',
    themes:[
      {nom:'❤️ Sa condition physique', quoi:'où il en est, et ce qu’il en fait',
       sous:['Condition physique','Régularité de la pratique','Connaissance de ses limites',
             'Persévérance à l’effort']},
      {nom:'🥗 Ses habitudes', quoi:'ce qui se passe hors du gymnase',
       sous:['Habitudes de vie saines','Alimentation avant l’effort','Hydratation',
             'Sommeil et récupération','Hygiène et propreté']},
      {nom:'🛡️ La sécurité', quoi:'la sienne et celle des autres',
       sous:['Sécurité personnelle','Sécurité des autres','Échauffement adéquat','Retour au calme']},
      {nom:'🔥 Son engagement', quoi:'l’envie de bouger',
       sous:['Plaisir de bouger','Engagement hors du cours','Autonomie dans la pratique',
             'Choix d’activités variées','Gestion du stress']},
    ]
  },
];
/* clé stable d'un sous-thème : « c1|2|3 » = compétence, thème, sous-thème */
function clePfeq(ci,ti,si){ return PFEQ[ci].id+'|'+ti+'|'+si; }
function libellePfeq(cle){
  const [id,ti,si]=cle.split('|');
  const c=PFEQ.find(x=>x.id===id); if(!c) return cle;
  if (si===undefined) return c.nom;
  const t=c.themes[+ti]; if(!t) return cle;
  return t.sous[+si] || cle;
}
/* les critères écrits à la main portent le préfixe « moi| » */
function estAMoi(cle){ return String(cle).startsWith('moi|'); }
function libelleCrit(cle){
  if (estAMoi(cle)) return cle.slice(4);
  const p=String(cle).split('|');
  /* ancien format « agir|12 » des gabarits : on va le chercher dans CRITERES */
  if (p.length===2 && typeof CRITERES!=='undefined' && CRITERES[p[0]])
    return CRITERES[p[0]][+p[1]] || cle;
  if (p.length===3) return libellePfeq(cle);
  return cle;
}

/* ═════════ LE PARCOURS DE CONFIGURATION ═════════ */
function choisirCriteres(){
  const {iso,per}=seanceOuverte; const s=seanceDe(iso,per);
  let choisis=[...(s.evalCrits||[])];
  let ci=0, ti=0;

  const corps=ouvrirModale('Qu’est-ce que j’évalue ?');
  corps.innerHTML=`
    <div class="aide-un-mot"><span class="emo">1️⃣</span>
      Choisis la compétence, puis le thème, puis coche les sous-thèmes.
      Tu peux aussi écrire les tiens.</div>
    <div class="pf-comps" id="pfComps"></div>
    <div class="pf-intention" id="pfIntention"></div>
    <div class="pf-corps">
      <div class="pf-themes" id="pfThemes"></div>
      <div class="pf-sous" id="pfSous"></div>
    </div>
    <div class="m-champ" style="margin-top:14px">
      <span class="m-lab">2️⃣ Ou écris exactement ce que tu évalues</span>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <input class="m-saisie" id="pfMien" placeholder="Ex. : tient sa raquette du bon côté"
               style="flex:1;min-width:240px">
        <button type="button" class="mini mini--lime" id="pfAdd">+ AJOUTER</button>
      </div>
    </div>
    <div class="m-champ">
      <span class="m-lab">3️⃣ Comment je note — <span id="pfEch"></span></span>
      <div class="note-choix" id="pfFacons"></div>
    </div>
    <div class="m-champ">
      <span class="m-lab">Ma liste — <span id="pfCompte"></span></span>
      <div class="pf-liste" id="pfListe"></div>
    </div>
    <div class="m-pied">
      <button type="button" class="m-valider" id="pfOk">✔ CRÉER LA GRILLE</button>
      <button type="button" class="mini" data-fermer>ANNULER</button>
    </div>`;

  /* niveau 1 — les trois compétences */
  const hc=$('#pfComps');
  PFEQ.forEach((c,k)=>{
    const b=el('button','pf-comp'); b.type='button';
    b.style.background=c.couleur; b.style.color=encreSur(c.couleur);
    b.innerHTML='<b></b><small></small>';
    b.querySelector('b').textContent=c.nom;
    b.querySelector('small').textContent=c.titre;
    b.setAttribute('aria-pressed', String(k===ci));
    b.addEventListener('click',()=>{ ci=k; ti=0; peindreTout(); });
    hc.appendChild(b);
  });

  function peindreTout(){
    $$('#pfComps .pf-comp').forEach((b,k)=> b.setAttribute('aria-pressed', String(k===ci)));
    const c=PFEQ[ci];
    $('#pfIntention').innerHTML='<b>Intention pédagogique</b>'+c.intention;
    const ht=$('#pfThemes'); ht.innerHTML='';
    c.themes.forEach((t,k)=>{
      const nb=t.sous.filter((_,si)=> choisis.includes(clePfeq(ci,k,si))).length;
      const b=el('button','pf-theme'); b.type='button';
      b.innerHTML='<b></b><small></small>'+(nb?'<span class="pf-n">'+nb+'</span>':'');
      b.querySelector('b').textContent=t.nom;
      b.querySelector('small').textContent=t.quoi;
      b.setAttribute('aria-pressed', String(k===ti));
      b.addEventListener('click',()=>{ ti=k; peindreTout(); });
      ht.appendChild(b);
    });
    const hs=$('#pfSous'); hs.innerHTML='';
    const t=c.themes[ti];
    hs.appendChild(Object.assign(el('div','pf-sous-titre',t.nom+' — '+t.quoi),{}));
    t.sous.forEach((txt,si)=>{
      const cle=clePfeq(ci,ti,si);
      const l=el('label','pf-case');
      const x=document.createElement('input'); x.type='checkbox'; x.checked=choisis.includes(cle);
      x.addEventListener('change',()=>{
        if (x.checked){ if(!choisis.includes(cle)) choisis.push(cle); }
        else choisis=choisis.filter(y=>y!==cle);
        peindreTout();
      });
      l.appendChild(x); l.appendChild(el('span',null,txt));
      hs.appendChild(l);
    });
    peindreListe();
  }
  function peindreListe(){
    const h=$('#pfListe'); h.innerHTML='';
    $('#pfCompte').textContent = choisis.length
      ? choisis.length+' chose'+(choisis.length>1?'s':'')+' à évaluer'
      : 'rien pour l’instant';
    $('#pfOk').disabled = !choisis.length;
    choisis.forEach(cle=>{
      const p=el('div','pf-puce'+(estAMoi(cle)?' pf-puce--moi':''));
      p.appendChild(el('span',null, libelleCrit(cle)));
      const x=el('button',null,'✕'); x.type='button'; x.title='Retirer';
      x.addEventListener('click',()=>{ choisis=choisis.filter(y=>y!==cle); peindreTout(); });
      p.appendChild(x); h.appendChild(p);
    });
  }
  $('#pfAdd').addEventListener('click',()=>{
    const t=$('#pfMien').value.trim(); if(!t) return;
    const cle='moi|'+t;
    if (!choisis.includes(cle)) choisis.push(cle);
    $('#pfMien').value=''; peindreTout();
  });
  $('#pfMien').addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); $('#pfAdd').click(); }});

  /* niveau 3 — comment on note */
  const hf=$('#pfFacons');
  function peindreFacons(){
    hf.innerHTML='';
    $('#pfEch').textContent = nbNiveaux()+' niveaux';
    Object.entries(FACONS_META).forEach(([k,f])=>{
      const b=el('button'); b.type='button';
      b.innerHTML='<span></span><span class="note-apercu"></span>';
      b.children[0].textContent=f.lab;
      const avant=faconNom(); ecrire('facon',k);
      paliers().forEach(([sym])=> b.children[1].appendChild(el('span',null,sym)));
      ecrire('facon',avant);
      b.setAttribute('aria-pressed', String(k===faconNom()));
      b.addEventListener('click',()=>{ ecrire('facon',k); peindreFacons(); });
      hf.appendChild(b);
    });
    const moins=el('button','mini','− un niveau'); moins.type='button';
    const plus =el('button','mini','+ un niveau'); plus.type='button';
    moins.addEventListener('click',()=>{ ecrire('nbNiveaux',Math.max(NIVEAUX_MIN,nbNiveaux()-1)); peindreFacons(); });
    plus .addEventListener('click',()=>{ ecrire('nbNiveaux',Math.min(NIVEAUX_MAX,nbNiveaux()+1)); peindreFacons(); });
    hf.appendChild(moins); hf.appendChild(plus);
  }
  peindreFacons();

  $('#pfOk').addEventListener('click',()=>{
    const l=[...choisis];
    fermerModale(); ouvrirSeance(iso,per);
    majSeance(x=>x.evalCrits=l);
    volet('evaluation');
  });
  peindreTout();
}
