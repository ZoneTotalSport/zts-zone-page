/**
 * app-v2.js — Nouvelle coquille du Planificateur (Mandat D1, Phase A)
 * Référence absolue : docs/maquette-planif-v2.html (validée par Joey).
 *
 * Feature-flag : /apps/planificateur/?v2=1 → cette coquille.
 * Sans le flag : l'ancien flux est intact (zéro régression camps).
 *
 * PRINCIPE : le MOTEUR ne change pas. Ce fichier n'a AUCUN accès Firestore
 * direct — il consomme les API d'app.js (Journees, Groupes, Presences,
 * Evaluations…), dataStore.js et tiroir-jeux.js, et WRAPPE les vues v1
 * (semaine, évaluation, roster, gabarit, historique) dans la nouvelle
 * enveloppe. Script classique chargé APRÈS app.js (globals partagés).
 */

const V2 = (() => {

  // ── Thème par métier (décision verrouillée D1 : ÉPS = cyan #2FC6F5 + jaune #FFF200) ──
  const PAL = {
    ep:   { m1:'#2FC6F5', m2:'#FFF200', ink:'#111', unit:'élèves',  logo:'ZONE PLANIF' },
    camp: { m1:'#FF6B00', m2:'#B026FF', ink:'#fff', unit:'jeunes',  logo:'ZONE PLANIF' },
    sdg:  { m1:'#39FF14', m2:'#169B62', ink:'#111', unit:'enfants', logo:'ZONE PLANIF' },
  };
  const ROM = ['I','II','III','IV','V','VI'];

  const S = {
    subOpen: true,          // sous-rangée Planification dépliée
    gpanelOpen: false,      // panneau Groupes
    groupes: [],            // tous les groupes de l'animateur (année courante)
    annee: null,            // année scolaire active (addendum)
    annees: [],             // années connues
    editGroupe: null,       // id du groupe en renommage inline
    resume: null,           // données du résumé de date (cache dernier clic)
    timer: null,            // minuterie de bloc {blocId, end, int}
    clip: null,             // bloc copié {titre, ref, notes} — collable dans les trous
  };

  function metier() { return document.body.dataset.metier || state.hubMetier || 'camp'; }
  function pal() { return PAL[metier()] || PAL.camp; }
  function unit() { return pal().unit; }

  // Année par défaut (addendum) : camps = ete-AAAA ; ÉPS/SDG = année scolaire (bascule 1er juillet)
  function anneeCourante() {
    const d = new Date(), y = d.getFullYear(), m = d.getMonth();
    if (metier() === 'camp') return 'ete-' + y;
    return (m >= 6) ? `${y}-${y + 1}` : `${y - 1}-${y}`;
  }

  function applyTheme() {
    // inline sur <body> : gagne sur la règle CSS body.pv2{--m1:…} (défaut ÉPS)
    const p = pal(), r = document.body.style;
    r.setProperty('--m1', p.m1); r.setProperty('--m2', p.m2); r.setProperty('--mtxt', p.ink);
    // aligne aussi les variables v1 (le tiroir Jeux, les modals existants suivent)
    r.setProperty('--metier-1', p.m1); r.setProperty('--metier-2', p.m2); r.setProperty('--metier-ink', p.ink);
  }

  // toast (la maquette en a un ; app.js n'en fournit pas)
  function toast(msg) {
    let b = document.getElementById('v2-toast');
    if (!b) { b = document.createElement('div'); b.id = 'v2-toast'; document.body.appendChild(b); }
    b.innerHTML = `<div class="pv2-toast-in">${msg}</div>`;
    clearTimeout(b._t); b._t = setTimeout(() => { b.innerHTML = ''; }, 2800);
  }

  // ── COQUILLE ─────────────────────────────────────────────
  function renderShell() {
    applyTheme();
    document.body.classList.add('pv2');
    if (localStorage.getItem('planif_tbi') === '1') document.body.classList.add('tbi');
    const v = state.view;
    const sub = (id, label, view) =>
      `<button class="zts-action pv2-act sm ${v === view ? 'prim' : ''}" data-action="v2-view" data-view="${view}" id="${id}">${label}</button>`;
    return `
    <div class="pv2-app">
      <div class="pv2-topbar">
        <div class="pv2-logo">${pal().logo}</div>
        <button class="zts-action pv2-act ${S.subOpen ? 'prim' : ''}" data-action="v2-tog-planif">📅 PLANIFICATION</button>
        <button class="zts-action pv2-act ${S.gpanelOpen ? 'prim' : ''}" data-action="v2-tog-groupes">👥 GROUPE</button>
        <button class="zts-action pv2-act ${v === 'evaluation' ? 'prim' : ''}" data-action="v2-view" data-view="evaluation">📋 ÉVALUATION</button>
        <div class="pv2-metier">
          <button class="zts-action pv2-act sm ${metier() === 'camp' ? 'prim' : ''}" data-action="v2-metier" data-m="camp" title="Camps">🏕️</button>
          <button class="zts-action pv2-act sm ${metier() === 'ep' ? 'prim' : ''}" data-action="v2-metier" data-m="ep" title="ÉPS">⚽</button>
          <button class="zts-action pv2-act sm ${metier() === 'sdg' ? 'prim' : ''}" data-action="v2-metier" data-m="sdg" title="SDG">🧩</button>
        </div>
      </div>
      <div class="pv2-subrow ${S.subOpen ? 'on' : ''}">
        ${sub('sb-jour', '☀️ Jour', 'journee')}
        ${sub('sb-sem', '📋 Semaine', 'semaine')}
        ${sub('sb-mois', '📅 Mois', 'mois')}
        ${sub('sb-seq', '🎯 Séquentielle', 'seq')}
        ${sub('sb-an', '🗓️ Annuelle', 'annuelle')}
        <span style="flex:1"></span>
        <button class="zts-action pv2-act sm" data-action="v2-import-ics">📥 Importer calendrier</button>
        <button class="zts-action pv2-act sm" data-action="v2-pdf">🖨️ PDF</button>
      </div>
      <div class="pv2-body">
        <div class="pv2-main">${route()}</div>
        <div class="pv2-gpanel ${S.gpanelOpen ? 'on' : ''}">${renderGPanel()}</div>
      </div>
    </div>
    <button class="zts-action pv2-tbibtn" data-action="v2-tbi">🖥️ Mode TBI</button>`;
  }

  // ── ROUTAGE : vues v2 + vues v1 wrappées (merge, zéro perte) ──
  function route() {
    switch (state.view) {
      case 'mois':        return renderMois();
      case 'journee':     return renderJourV2();
      case 'semaine':     return `<div class="p-card" id="semaine-grid-root"></div>`;   // composant v1 monté en post()
      case 'evaluation':  return renderEvalV2();                                         // carnet iDoceo (moteur v1)
      case 'roster':      return renderRoster();                                         // vue v1
      case 'gabarit':     return renderGabarit();                                        // vue v1
      case 'historique':  return renderHistorique();                                     // vue v1
      case 'live':        return renderLive();                                           // vue v1
      case 'seq':         return stubSheet('Planification séquentielle', 'Phase B — gabarit TITRE + 6 cours alternés jaune/cyan.');
      case 'annuelle':    return stubSheet('Ma planification annuelle', 'Phase B — semaines alignées avec barres Activité/Compétence.');
      case 'calendrier':  return renderMois();                                           // l'ancien calendrier pointe sur le mensuel v2
      default:            return renderMois();
    }
  }

  function stubSheet(titre, note) {
    return `<div class="pv2-sheet"><div class="pv2-sheettitle"><span class="c">${titre}</span></div>
      <div class="pv2-empty">🚧 ${note}</div></div>`;
  }

  function post() {
    if (state.view === 'semaine') mountSemaineGrid();
  }

  // ── MENSUEL (page principale — gabarit imprimable maquette) ──
  const MOIS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  // Semaines Lun-Ven du mois courant (state.calYear/calMonth du moteur)
  function moisSemaines(y, m) {
    const weeks = []; let cur = [];
    const last = new Date(y, m + 1, 0).getDate();
    for (let d = 1; d <= last; d++) {
      const dow = new Date(y, m, d).getDay();       // 0=dim … 6=sam
      if (dow === 0 || dow === 6) continue;
      if (dow === 1 && cur.length) { weeks.push(cur); cur = []; }
      while (cur.length < dow - 1) cur.push(null);  // trous en début de semaine
      cur.push(d);
    }
    if (cur.length) { while (cur.length < 5) cur.push(null); weeks.push(cur); }
    weeks.forEach(w => { while (w.length < 5) w.push(null); });
    return weeks;
  }

  function renderMois() {
    const y = state.calYear, m = state.calMonth;
    const weeks = moisSemaines(y, m);
    const today = todayISO();
    let h = `<div class="pv2-sheet">
      <div class="pv2-sheettitle">
        <button class="zts-action pv2-act sm" data-action="v2-mois-nav" data-d="-1">◀</button>
        <span class="c">${MOIS_FR[m]}</span> <span class="y">${y}</span>
        <button class="zts-action pv2-act sm" data-action="v2-mois-nav" data-d="1">▶</button>
      </div>
      <div class="pv2-mgrid">`;
    ['Lundi','Mardi','Mercredi','Jeudi','Vendredi'].forEach((d, i) =>
      h += `<div class="pv2-mh ${i % 2 === 0 ? 'y' : 'c'}">${d}</div>`);
    let cyc = 0;
    weeks.forEach(w => w.forEach((d, col) => {
      if (d === null) { h += `<div></div>`; return; }
      const iso = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      const isToday = iso === today;
      const has = state.calDatesWithBlocs && state.calDatesWithBlocs.has(iso);
      h += `<div class="pv2-mcell ${col % 2 === 0 ? 'y' : 'c'} ${isToday ? 'today' : ''}" data-action="v2-daysum" data-date="${iso}">
        <span class="num">${d}</span><span class="cyc">${ROM[cyc % 6]}</span>
        ${has ? '<span class="pv2-dotplan" title="Journée planifiée">●</span>' : ''}
      </div>`;
      cyc++;
    }));
    h += `</div>
      <p class="pv2-note">💡 Clique une <b>date</b> : présences du jour + évaluations. Jours-cycle <span style="color:#F5820D;font-family:'Bangers',cursive;">I-VI</span> (recalés par « 📥 Importer » — Phase B). ● = journée planifiée.</p>
    </div>`;
    return h;
  }

  // ── RÉSUMÉ DE DATE (clic sur une case du mensuel) ────────
  async function openDaySum(dateISO) {
    const box = document.getElementById('v2-daysum');
    const body = box.querySelector('[data-ds-body]');
    box.querySelector('[data-ds-title]').textContent = '📆 ' + formatDateLong(dateISO);
    box.dataset.date = dateISO;
    body.innerHTML = `<div class="pv2-empty" style="margin:12px">⏳ Chargement…</div>`;
    box.classList.add('open'); document.getElementById('v2-backdrop').classList.add('open');

    // Présences réelles PAR GROUPE (tous les groupes actifs de l'année) + évals du jour
    const groupes = S.groupes.length ? S.groupes : (state.groupe ? [state.groupe] : []);
    const pres = [], evals = [];
    for (const g of groupes) {
      try {
        const j = await Journees.getByGroupeAndDate(g.id, dateISO);
        if (j) {
          const ps = await Presences.listByJournee(j.id, g.id);
          if (ps.length) {
            const nb = ps.filter(p => p.statut === 'present' || p.statut === 'parti').length;
            const abs = ps.filter(p => p.statut === 'absent');
            const enfants = await Enfants.listByGroupe(g.id);
            const nom = id => { const e = enfants.find(x => x.id === id); return e ? e.prenom : '?'; };
            pres.push({ g: g.nom, txt: `${nb}/${enfants.length}${abs.length ? ' (abs : ' + abs.map(a => nom(a.enfantId)).join(', ') + ')' : ''}` });
          }
        }
        const evs = await Evaluations.listByDate(g.id, dateISO);
        if (evs.length) {
          const crits = [...new Set(evs.map(e => (PFEQ_LABEL[e.critereId] || {}).label || e.critereId))];
          evals.push({ g: g.nom, txt: crits.join(', ') + ` (${evs.length} cote${evs.length > 1 ? 's' : ''})` });
        }
      } catch (e) { console.warn('[V2] daysum', g.nom, e); }
    }
    body.innerHTML = `
      <div class="pv2-sumline"><b>PRÉSENCES DU JOUR</b><br>
        ${pres.length ? pres.map(p => `<span class="pv2-pill">${esc(p.g)} : ${esc(p.txt)}</span>`).join('') : `<span class="pv2-mute">Aucune présence prise ce jour.</span>`}</div>
      <div class="pv2-sumline"><b>ÉVALUATIONS</b><br>
        ${evals.length ? evals.map(e => `📋 <b style="color:#111">${esc(e.g)}</b> · <span class="pv2-pill">${esc(e.txt)}</span>`).join('<br>') : `<span class="pv2-mute">Aucune évaluation ce jour.</span>`}</div>`;
  }

  function closeOverlays() {
    document.getElementById('v2-daysum')?.classList.remove('open');
    document.getElementById('v2-backdrop')?.classList.remove('open');
  }

  // ── VUE JOUR v2 : grille PÉRIODE | GROUPE | DÉROULEMENT | FAIT ✓ ──
  function renderJourV2() {
    const isToday = state.currentDate === todayISO();
    const blocs = [...state.journeeBlocs].sort((a, b) => a.ordre - b.ordre);
    const gnom = state.groupe ? state.groupe.nom : '—';
    let h = `<div class="pv2-dayhead">
      <button class="zts-action pv2-act sm" data-action="prev-date">◀</button>
      <b class="pv2-daytitle">${isToday ? "Aujourd'hui" : formatDateLong(state.currentDate)} — ${esc(gnom)}</b>
      <button class="zts-action pv2-act sm" data-action="next-date">▶</button>
      ${blocs.length ? `<button class="zts-action pv2-act sm" data-action="start-live">▶ En direct</button>` : ''}
    </div>`;
    h += `<div class="pv2-drow pv2-dhead">
      <div class="pv2-dcell">PÉRIODE</div><div class="pv2-dcell">GROUPE</div>
      <div class="pv2-dcell">DÉROULEMENT</div><div class="pv2-dcell">FAIT ✓</div></div>`;

    // rangées blocs + trous intercalés par heure (trous → tiroir Jeux OU coller)
    const rows = blocs.map((b, i) => {
      const t = BLOC_TYPES[b.type] || BLOC_TYPES.activite;
      const timerOn = S.timer && S.timer.blocId === b.id;
      const heures = timerOn
        ? `<span class="pv2-countdown" data-v2-countdown>${fmtMMSS(S.timer.end - Date.now())}</span>`
        : ((b.debut || b.fin) ? `${b.debut || '?'}<br>${b.fin || '?'}` : (b.plage === 'matin' ? 'AM' : b.plage === 'soir' ? 'PM' : '—'));
      return { tMin: hmToMin(b.debut), html: `<div class="pv2-drow" data-bloc-id="${b.id}">
        <div class="pv2-dcell pv2-time ${timerOn ? 'pv2-timing' : ''}">${heures}</div>
        <div class="pv2-dcell"><span class="pv2-tag">${esc(gnom)}</span></div>
        <div class="pv2-dcell pv2-derou">
          <span class="pv2-btag" style="background:${t.color}">${t.icon}</span>
          <span class="pv2-ed" contenteditable data-v2-edit-bloc="${b.id}">${esc(b.titre || '')}</span>
          ${b.type === 'garde' ? `<button class="zts-action pv2-act sm" data-action="open-presences-modal">📋 Présences</button>` : ''}
          <span class="pv2-rowtools">
            <button class="pv2-tool ${timerOn ? 'on' : ''}" data-action="v2-timer" data-bloc-id="${b.id}" title="${timerOn ? 'Arrêter la minuterie' : 'Minuterie de ce bloc'}">⏱</button>
            <button class="pv2-tool" data-action="v2-copy" data-bloc-id="${b.id}" title="Copier ce bloc (coller dans un trou)">📄</button>
          </span>
        </div>
        <div class="pv2-dcell pv2-fait ${b.done ? 'ok' : ''}" data-action="v2-tog-fait" data-bloc-id="${b.id}">${b.done ? '✓' : ''}</div>
      </div>` };
    });
    const trous = (typeof PlanifData !== 'undefined') ? PlanifData.trousJournee(blocs) : [];
    for (const t of trous) {
      const lbl = `${t.debut.replace(':', ' h ')} → ${t.fin.replace(':', ' h ')}`;
      const inner = S.clip
        ? `＋ ${lbl} — libre&nbsp;
           <button class="zts-action pv2-act sm prim" data-action="v2-paste" data-debut="${t.debut}" data-fin="${t.fin}">📋 Coller « ${esc(S.clip.titre.slice(0, 24))} »</button>
           <button class="zts-action pv2-act sm" data-action="tiroir-trou" data-debut="${t.debut}" data-fin="${t.fin}">🎲 Tiroir</button>`
        : `＋ ${lbl} — libre · toucher pour ouvrir le tiroir Jeux 🎲`;
      const row = { tMin: hmToMin(t.debut), html: `<div class="pv2-hole" ${S.clip ? '' : `data-action="tiroir-trou" data-debut="${t.debut}" data-fin="${t.fin}"`}>${inner}</div>` };
      const idx = rows.findIndex(c => c.tMin != null && row.tMin != null && c.tMin >= hmToMin(t.fin));
      if (idx === -1) rows.push(row); else rows.splice(idx, 0, row);
    }
    h += rows.map(r => r.html).join('') || `<div class="pv2-empty">Aucun bloc — clique un trou ou le tiroir JEUX 🎲</div>`;
    h += `<div style="display:flex;gap:8px;justify-content:center;margin-top:10px;flex-wrap:wrap">
      <button class="zts-action pv2-act sm" data-action="add-bloc" data-context="journee">+ Ajouter un bloc</button>
      ${S.clip ? `<button class="zts-action pv2-act sm" data-action="v2-clip-cancel">✕ Terminer le collage (« ${esc(S.clip.titre.slice(0, 18))} »)</button>` : ''}
    </div>`;

    // ── Tuiles tiroirs (sous la journée SEULEMENT) ──
    h += `<div class="pv2-dock"><h6>MES TIROIRS</h6><div class="pv2-dgrid">
      <div class="pv2-mod" data-action="open-tiroir-jeux" style="background-image:radial-gradient(circle at 30% 25%, rgba(255,255,255,.35) 0 8%, transparent 9%), linear-gradient(135deg, var(--m1), var(--m2));"><span class="pv2-mbadge">970</span><div class="mico">🎲</div><div class="mlabel">JEUX</div></div>
      <div class="pv2-mod" data-action="open-presences-modal" style="background-image:linear-gradient(135deg,#2ecc71,#169B62);"><div class="mico">✅</div><div class="mlabel">PRÉSENCES</div></div>
      <div class="pv2-mod" data-action="v2-planb" style="background-image:linear-gradient(160deg,#5dade2,#1E3A5F);"><div class="mico">🌧️</div><div class="mlabel">PLAN B</div></div>
      <div class="pv2-mod" data-action="v2-stub" data-msg="🎵 Musique : minuteur + ambiance — prochain tiroir sur ce gabarit" style="background-image:linear-gradient(135deg,#B026FF,#6C1FA8);"><div class="mico">🎵</div><div class="mlabel">MUSIQUE</div></div>
      <div class="pv2-mod" data-action="v2-stub" data-msg="🖍️ Coloriage : pages IA — à activer (worker colorier)" style="background-image:linear-gradient(135deg,#FFD166,#FF8C42);"><div class="mico">🖍️</div><div class="mlabel">COLORIAGE</div></div>
      <div class="pv2-mod" data-action="v2-stub" data-msg="＋ Prochains tiroirs, même gabarit (image de fond supportée)" style="background-image:repeating-linear-gradient(45deg,#f3f3f3 0 10px,#e6e6e6 10px 20px);"><div class="mico" style="color:#999">＋</div><div class="mlabel" style="color:#999">BIENTÔT</div></div>
    </div></div>`;
    return h;
  }

  // ── Minuterie par bloc (⏱) + copier/coller de période (📄→📋) ──
  function fmtMMSS(ms) {
    const s = Math.max(0, Math.round(ms / 1000));
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  function stopTimer(silencieux) {
    if (S.timer) { clearInterval(S.timer.int); S.timer = null; }
    if (!silencieux) render0();
  }

  function startTimer(blocId) {
    if (S.timer && S.timer.blocId === blocId) { stopTimer(); toast('⏱ Minuterie arrêtée.'); return; }
    stopTimer(true);
    const b = state.journeeBlocs.find(x => x.id === blocId); if (!b) return;
    let mins = null;
    const d = hmToMin(b.debut), f = hmToMin(b.fin);
    if (d != null && f != null && f > d) mins = f - d;
    if (mins == null) {
      const r = prompt('Minuterie (minutes) :', '10'); if (r === null) return;
      mins = Math.max(1, Math.min(180, parseInt(r) || 10));
    }
    S.timer = { blocId, end: Date.now() + mins * 60000, int: null };
    S.timer.int = setInterval(() => {
      const left = S.timer.end - Date.now();
      const el = document.querySelector('[data-v2-countdown]');
      if (el) el.textContent = fmtMMSS(left);
      if (left <= 0) {
        stopTimer(true);
        try { playDoneSound(); } catch (e) {}
        toast('⏱ Temps écoulé — « ' + esc(b.titre || 'bloc') + ' »!');
        const node = document.querySelector(`[data-bloc-id="${blocId}"]`);
        if (node) { node.classList.add('p-bloc--flash'); node.addEventListener('animationend', () => node.classList.remove('p-bloc--flash'), { once: true }); }
        render0();
      }
    }, 500);
    render0();
    toast('⏱ ' + mins + ' min — go!');
  }

  function copyBloc(blocId) {
    const b = state.journeeBlocs.find(x => x.id === blocId); if (!b) return;
    const d = hmToMin(b.debut), f = hmToMin(b.fin);
    S.clip = { titre: b.titre || '', ref: b.ref || '', notes: b.notes || '',
      duree: (d != null && f != null && f > d) ? (f - d) : 45 };   // durée d'origine (45 min par défaut)
    render0();
    toast('📄 « ' + (b.titre || 'bloc') + ' » copié — touche un trou pour le coller (autant de fois que tu veux).');
  }

  async function pasteClip(creneau) {
    if (!S.clip) return;
    // le collage garde la DURÉE du bloc copié, plafonnée à la taille du trou
    const d = hmToMin(creneau.debut), f = hmToMin(creneau.fin);
    if (d != null && f != null) {
      const fin = Math.min(d + (S.clip.duree || 45), f);
      creneau = { debut: creneau.debut, fin: String(Math.floor(fin / 60)).padStart(2, '0') + ':' + String(fin % 60).padStart(2, '0') };
    }
    const idInsere = await PlanifData.insererJeu({ titre: S.clip.titre, ref: S.clip.ref }, creneau);
    if (S.clip.notes) {
      const blocs = state.journeeBlocs.map(b => b.id === idInsere ? { ...b, notes: S.clip.notes } : b);
      await Journees.update(state.journeeId, { blocs });
      state.journeeBlocs = blocs;
    }
    render0();
    requestAnimationFrame(() => {
      const node = document.querySelector(`[data-bloc-id="${idInsere}"]`);
      if (node) { node.classList.add('p-bloc--flash'); node.addEventListener('animationend', () => node.classList.remove('p-bloc--flash'), { once: true }); }
    });
    toast('📋 Collé à ' + creneau.debut.replace(':', ' h ') + ' — encore un trou? Re-colle!');
  }

  async function togFait(blocId) {
    const blocs = state.journeeBlocs.map(b => b.id === blocId ? { ...b, done: !b.done } : b);
    await Journees.update(state.journeeId, { blocs });
    state.journeeBlocs = blocs;
    render0();
  }

  async function saveBlocTitre(blocId, titre) {
    const blocs = state.journeeBlocs.map(b => b.id === blocId ? { ...b, titre } : b);
    await Journees.update(state.journeeId, { blocs });
    state.journeeBlocs = blocs;
  }

  // ── CARNET D'ÉVALUATION (façon iDoceo, sur le moteur EvalConfig/Evaluations) ──
  // Tout se crée D'ICI : élèves (ajout rapide), colonnes (modal PFEQ existant), cotes (tap).
  const EV_COLORS = { A:'#7BE495', B:'#D3F09A', C:'#FFD37A', D:'#FF9B9B', E:'#FF7B7B',
    '++':'#7BE495', '+':'#D3F09A', '±':'#FFD37A', '-':'#FF9B9B', '--':'#FF7B7B',
    '🟢':'#7BE495', '🟡':'#FFD37A', '🔴':'#FF9B9B', '🟣':'#E0B3FF' };

  function renderEvalV2() {
    const date = state.evalDate || todayISO();
    const cols = state.evalCols || [];
    const gnom = state.groupe ? state.groupe.nom : '—';
    const annee = S.annee || anneeCourante();
    const gs = S.groupes.filter(g => (g.annee || anneeCourante()) === annee && g.statut !== 'archive');

    let h = `<div class="pv2-sheet">
      <div class="pv2-sheettitle"><span class="c">Carnet</span> <span class="y">d'évaluation</span> — <span style="color:#F5820D">${esc(gnom)}</span></div>
      <div class="pv2-evtabs">
        ${gs.map(g => `<button class="zts-action pv2-act sm ${g.id === state.groupeId ? 'prim' : ''}" data-action="v2-ev-groupe" data-gid="${g.id}">👥 ${esc(g.nom)}</button>`).join('')}
        <span style="flex:1"></span>
        <button class="zts-action pv2-act sm" data-action="eval-prev">◀</button>
        <span class="pv2-evdate">${date === todayISO() ? "Aujourd'hui" : formatDateFR(date)}</span>
        <button class="zts-action pv2-act sm" data-action="eval-next">▶</button>
        <button class="zts-action pv2-act sm prim" data-action="eval-add-col">＋ Critère</button>
      </div>`;

    if (!state.enfants.length) {
      h += `<div class="pv2-empty">Aucun ${unit().slice(0, -1)} dans « ${esc(gnom)} » — ajoute-les juste en dessous 👇 (prénom + Entrée, un à la fois).</div>`;
    } else if (!cols.length) {
      h += `<div class="pv2-empty">Choisis ce que tu évalues : <b>＋ Critère</b> ➜ compétence PFEQ + type de cote (A-E, /10, %, couleurs…).<br>Ensuite : <b>1 tap sur une case = cote suivante</b>. Zéro paperasse.</div>`;
    } else {
      h += `<div class="pv2-evwrap"><table class="pv2-evtable"><tr><th class="n">${unit().toUpperCase().slice(0, -1)}</th>`;
      cols.forEach((c, i) => {
        const cr = PFEQ_LABEL[c.critereId]; const tt = COTE_TYPES[c.type];
        h += `<th><span>${esc(cr ? cr.label : c.critereId)}</span>
          <small>${tt ? tt.label : c.type}${(c.type === 'number' && c.total) ? ' /' + c.total : ''}</small>
          <button class="pv2-evx" data-action="eval-del-col" data-i="${i}" title="Retirer">✕</button></th>`;
      });
      h += `</tr>`;
      state.enfants.forEach(e => {
        h += `<tr><td class="pv2-evname">${esc(e.prenom)}</td>`;
        cols.forEach((c, i) => {
          const v = (state.evalMap || {})[e.id + '__' + c.critereId] || '';
          const bg = EV_COLORS[v] || (v ? '#E2F7FE' : '#fff');
          h += `<td class="pv2-evcell" style="background:${bg}" data-action="eval-cell" data-eid="${e.id}" data-i="${i}">${esc(v) || '—'}</td>`;
        });
        h += `</tr>`;
      });
      h += `</table></div>
      <div class="pv2-evlegend">👆 <b>1 tap = cote suivante</b> (revient à — au bout du cycle) · % et /total ouvrent une saisie</div>`;
      h += renderPortraitV2(cols);
    }

    // Ajout rapide d'élèves — toujours visible (iDoceo : tout se crée depuis le carnet)
    h += `<div class="pv2-evadd">
      <input class="p-input" id="pv2-new-eleve" placeholder="＋ Prénom d'un ${unit().slice(0, -1)}… (Entrée = ajouter)" maxlength="30">
      <button class="zts-action zts-action--metier pv2-act sm" data-action="v2-ev-add-eleve">Ajouter</button>
    </div></div>`;
    return h;
  }

  // Portrait de groupe : distribution des cotes par colonne + compteur X/N évalués
  function renderPortraitV2(cols) {
    const N = state.enfants.length;
    let h = `<div class="pv2-portrait">`;
    cols.forEach(c => {
      const tt = COTE_TYPES[c.type];
      const cr = PFEQ_LABEL[c.critereId];
      const counts = {}; let done = 0;
      state.enfants.forEach(e => {
        const v = (state.evalMap || {})[e.id + '__' + c.critereId] || '';
        if (v) { done++; counts[v] = (counts[v] || 0) + 1; }
      });
      let bar = '';
      if (tt && tt.cycle) {
        tt.cycle.filter(v => v && counts[v]).forEach(v => {
          bar += `<div style="flex:${counts[v]};background:${EV_COLORS[v] || '#E2F7FE'}">${esc(v)}${counts[v] > 1 ? '×' + counts[v] : ''}</div>`;
        });
      } else if (done) {
        bar += `<div style="flex:${done};background:#B6E8F5">${done} noté${done > 1 ? 's' : ''}</div>`;
      }
      if (N - done > 0) bar += `<div style="flex:${N - done};background:#f0f0f0;color:#999">${N - done} à faire</div>`;
      h += `<div class="pv2-pcard"><h6>${esc(cr ? cr.label : c.critereId)}</h6>
        <div class="pv2-pbar">${bar || '<div style="flex:1;background:#f0f0f0;color:#999">—</div>'}</div>
        <div class="pv2-pmeta">${done}/${N} évalués</div></div>`;
    });
    return h + `</div>`;
  }

  async function evAddEleve() {
    const inp = document.getElementById('pv2-new-eleve');
    const prenom = (inp?.value || '').trim();
    if (!prenom) { inp?.focus(); return; }
    await Enfants.create({ prenom, nom: '', groupeId: state.groupeId });
    state.enfants = await Enfants.listByGroupe(state.groupeId);
    state.enfants.sort((a, b) => a.prenom.localeCompare(b.prenom));
    render0();
    requestAnimationFrame(() => { const i = document.getElementById('pv2-new-eleve'); if (i) i.focus(); });
    toast('🧒 ' + prenom + ' ajouté à ' + (state.groupe ? state.groupe.nom : '') + '!');
  }

  // ── PANNEAU GROUPES (+ CRUD + année — addendum) ──────────
  function renderGPanel() {
    const annee = S.annee || anneeCourante();
    const lecture = annee !== anneeCourante();
    const opts = [...new Set([anneeCourante(), ...S.annees])];
    let h = `<h6>MES GROUPES</h6>
      <select class="p-select pv2-annee" data-action-change="v2-annee">
        ${opts.map(a => `<option value="${a}" ${a === annee ? 'selected' : ''}>${a}${a === anneeCourante() ? ' (courante)' : ''}</option>`).join('')}
      </select>
      ${lecture ? `<div class="pv2-lecture">🔒 Année passée — lecture seule</div>` : ''}`;
    const gs = S.groupes.filter(g => (g.annee || anneeCourante()) === annee && g.statut !== 'archive');
    h += gs.map(g => {
      const on = state.groupeId === g.id;
      const nomHtml = S.editGroupe === g.id
        ? `<input class="p-input pv2-gedit" data-v2-gname="${g.id}" value="${esc(g.nom)}" maxlength="24">`
        : `👥 ${esc(g.nom)}`;
      return `<div class="pv2-gitem ${on ? 'on' : ''}">
        <div class="pv2-gname" data-action="v2-g-toggle" data-gid="${g.id}">${nomHtml}</div>
        <div class="pv2-gopts" ${on ? '' : 'hidden'}>
          <div class="pv2-gopt" data-action="v2-g-presence" data-gid="${g.id}">✅ Présence</div>
          <div class="pv2-gopt" data-action="v2-stub" data-msg="👕 Linge : liste cochable par ${unit()} — Phase B">👕 Linge</div>
          <div class="pv2-gopt" data-action="v2-g-eval" data-gid="${g.id}">📋 Évaluation</div>
          <div class="pv2-gopt" data-action="v2-view" data-view="roster">🧒 ${unit().charAt(0).toUpperCase() + unit().slice(1)}</div>
          <div class="pv2-gopt" data-action="v2-view" data-view="gabarit">📐 Journée type</div>
          ${lecture ? '' : `<div class="pv2-gcfg">
            <span data-action="v2-g-rename" data-gid="${g.id}">✏️ Renommer</span> ·
            <span data-action="v2-g-archive" data-gid="${g.id}">🗄️ Archiver</span></div>`}
        </div>
      </div>`;
    }).join('') || `<div class="pv2-mute" style="padding:8px">Aucun groupe pour ${annee}.</div>`;
    if (!lecture) h += `<button class="zts-action zts-action--metier pv2-act sm" style="width:100%;margin-top:6px" data-action="v2-g-add">＋ Ajouter un groupe</button>`;
    h += `<button class="zts-action pv2-act sm" style="width:100%;margin-top:6px" data-action="v2-export-json">💾 Exporter l'année (JSON)</button>`;
    return h;
  }

  async function loadGroupes() {
    if (!state.user) return;
    try {
      S.groupes = await Groupes.listByAnimateur(state.user.uid);
      S.annees = [...new Set(S.groupes.map(g => g.annee || anneeCourante()))];
      if (!S.annee) S.annee = anneeCourante();
    } catch (e) { console.warn('[V2] loadGroupes', e); }
  }

  async function addGroupe() {
    const nom = prompt('Nom du groupe (court : « 101 », « Renards »…)');
    if (!nom || !nom.trim()) return;
    const id = await Groupes.create({ nom: nom.trim(), orgId: state.orgId, animateurUid: state.user.uid, metier: metier() });
    await Groupes.update(id, { annee: anneeCourante(), statut: 'actif' });
    await loadGroupes(); render0();
    toast('👥 Groupe « ' + nom.trim() + ' » créé!');
  }

  async function switchGroupe(gid) {
    state.groupeId = gid; localStorage.setItem(LS.groupeId, gid);
    const g = S.groupes.find(x => x.id === gid); if (g) { state.groupe = g; state.orgId = g.orgId; }
    await loadGroupeData(); await loadJourneeData();
    if (state.view === 'mois' || state.view === 'calendrier') await loadCalendarData();
    render0();
  }

  // ── EXPORT JSON (addendum — ceinture de sécurité locale) ──
  async function exportJSON() {
    toast('💾 Préparation de l\'export…');
    const annee = S.annee || anneeCourante();
    const gs = S.groupes.filter(g => (g.annee || anneeCourante()) === annee);
    const dump = { app: 'zts-planificateur', version: 2, annee, exporte: new Date().toISOString(), groupes: [] };
    for (const g of gs) {
      const item = { groupe: g, enfants: [], journees: [], evaluations: [] };
      try {
        item.enfants = await Enfants.listByGroupe(g.id);
        const db = await getDb();
        const js = await db.collection('journees').where('groupeId', '==', g.id).get();
        item.journees = js.docs.map(d => ({ id: d.id, ...d.data() }));
        const es = await db.collection('evaluations').where('groupeId', '==', g.id).get();
        item.evaluations = es.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (e) { console.warn('[V2] export', g.nom, e); }
      dump.groupes.push(item);
    }
    const blob = new Blob([JSON.stringify(dump, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `zts-planificateur-${annee}.json`;
    a.click(); URL.revokeObjectURL(a.href);
    toast('💾 Export ' + annee + ' téléchargé (' + dump.groupes.length + ' groupe(s)). Drive : Phase B.');
  }

  // ── ACTIONS (routées depuis handleAction d'app.js) ───────
  async function handle(action, ds) {
    switch (action) {
      case 'v2-view':
        state.view = ds.view;
        if (ds.view === 'mois') await loadCalendarData();
        if (ds.view === 'journee') await loadJourneeData();
        if (ds.view === 'evaluation') { if (!S.groupes.length) await loadGroupes(); await loadEvalData(); }
        render0(); return;
      case 'v2-tog-planif': S.subOpen = !S.subOpen; render0(); return;
      case 'v2-tog-groupes': S.gpanelOpen = !S.gpanelOpen; if (S.gpanelOpen) await loadGroupes(); render0(); return;
      case 'v2-metier':
        document.body.dataset.metier = ds.m; state.hubMetier = ds.m;
        S.annee = null;   // l'année courante dépend du métier (ete-AAAA vs AAAA-AAAA+1)
        applyTheme(); render0(); return;
      case 'v2-mois-nav': {
        let m = state.calMonth + parseInt(ds.d, 10), y = state.calYear;
        if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
        state.calMonth = m; state.calYear = y;
        await loadCalendarData(); render0(); return;
      }
      case 'v2-daysum': openDaySum(ds.date); return;
      case 'v2-close-daysum': closeOverlays(); return;
      case 'v2-open-jour': {
        const date = document.getElementById('v2-daysum')?.dataset.date;
        closeOverlays();
        if (date) state.currentDate = date;
        state.view = 'journee'; await loadJourneeData(); render0(); return;
      }
      case 'v2-tog-fait': togFait(ds.blocId); return;
      case 'v2-tbi': {
        const on = document.body.classList.toggle('tbi');
        localStorage.setItem('planif_tbi', on ? '1' : '0');
        toast(on ? '🖥️ Mode TBI activé!' : 'Mode normal'); return;
      }
      case 'v2-planb':
        TiroirJeux._T.filtres.lieu = 'interieur'; TiroirJeux._T.filtres.sansMateriel = true;
        TiroirJeux.openForCreneau(PlanifData.premierTrou(state.journeeBlocs));
        toast('🌧️ Plan B : biblio filtrée intérieur + sans matériel'); return;
      case 'v2-import-ics': toast('📥 Import .ics (congés/pédagos + recalage des jours-cycle) — Phase B.'); return;
      case 'v2-pdf': toast('🖨️ Export PDF : la vue devient ton imprimable pré-rempli — backlog.'); return;
      case 'v2-stub': toast(ds.msg || 'Bientôt!'); return;
      case 'v2-g-toggle':
        if (S.editGroupe) return;
        if (state.groupeId === ds.gid) { render0(); return; }
        await switchGroupe(ds.gid); return;
      case 'v2-g-add': addGroupe(); return;
      case 'v2-g-rename': S.editGroupe = ds.gid; render0();
        requestAnimationFrame(() => document.querySelector(`[data-v2-gname="${ds.gid}"]`)?.focus()); return;
      case 'v2-g-archive':
        if (!confirm('Archiver ce groupe? Ses présences et évaluations restent consultables (aucune suppression).')) return;
        await Groupes.update(ds.gid, { statut: 'archive' });
        await loadGroupes(); render0(); toast('🗄️ Groupe archivé.'); return;
      case 'v2-g-presence':
        if (state.groupeId !== ds.gid) await switchGroupe(ds.gid);
        openPresencesModal(); return;
      case 'v2-g-eval':
        if (state.groupeId !== ds.gid) await switchGroupe(ds.gid);
        state.view = 'evaluation';
        if (typeof loadEvalData === 'function') { try { await loadEvalData(); } catch (e) {} }
        render0(); return;
      case 'v2-export-json': exportJSON(); return;
      case 'v2-ev-add-eleve': evAddEleve(); return;
      case 'v2-timer': startTimer(ds.blocId); return;
      case 'v2-copy': copyBloc(ds.blocId); return;
      case 'v2-paste': pasteClip({ debut: ds.debut, fin: ds.fin }); return;
      case 'v2-clip-cancel': S.clip = null; render0(); toast('Collage terminé.'); return;
      case 'v2-ev-groupe':
        if (state.groupeId !== ds.gid) {
          const keep = state.view;
          await switchGroupe(ds.gid);
          state.view = keep; await loadEvalData(); render0();
        }
        return;
    }
  }

  // rerender : TOUJOURS via le render() global d'app.js (hooké v2) — un seul flux
  function render0() { window.render(); }

  // ── Écouteurs propres à v2 (inline edit + overlays hors #app-root) ──
  function wire() {
    document.addEventListener('focusout', async (e) => {
      const ed = e.target.closest?.('[data-v2-edit-bloc]');
      if (ed) { await saveBlocTitre(ed.dataset.v2EditBloc, ed.textContent.trim()); return; }
      const gn = e.target.closest?.('[data-v2-gname]');
      if (gn) {
        const nom = gn.value.trim(); const gid = gn.dataset.v2Gname;
        S.editGroupe = null;
        if (nom) { await Groupes.update(gid, { nom }); await loadGroupes(); if (state.groupe && state.groupeId === gid) state.groupe.nom = nom; }
        window.render(); return;
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.closest?.('[data-v2-gname]')) { e.preventDefault(); e.target.blur(); }
      if (e.key === 'Enter' && e.target.closest?.('[data-v2-edit-bloc]')) { e.preventDefault(); e.target.blur(); }
      if (e.key === 'Enter' && e.target.id === 'pv2-new-eleve') { e.preventDefault(); evAddEleve(); }
      if (e.key === 'Escape') closeOverlays();
    });
    document.addEventListener('change', (e) => {
      if (e.target.matches('.pv2-annee')) { S.annee = e.target.value; window.render(); }
    });
    // overlays v2 (résumé de date) — hors #app-root
    document.getElementById('v2-backdrop')?.addEventListener('click', closeOverlays);
    document.getElementById('v2-daysum')?.addEventListener('click', (e) => {
      const a = e.target.closest('[data-action]');
      if (a) handleAction(a.dataset.action, a.dataset);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();

  return { render: renderShell, post, handle, loadGroupes, toast, get S() { return S; } };
})();
