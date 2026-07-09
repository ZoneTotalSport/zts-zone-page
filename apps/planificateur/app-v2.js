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

  const S = {
    subOpen: true,          // sous-rangée Planification dépliée
    gpanelOpen: false,      // panneau Groupes
    groupes: [],            // tous les groupes de l'animateur (année courante)
    annee: null,            // année scolaire active (addendum)
    annees: [],             // années connues
    editGroupe: null,       // id du groupe en renommage inline
    resume: null,           // données du résumé de date (cache dernier clic)
    timer: null,            // minuterie de bloc {blocId, end, int}
    clip: null,             // case copiée {titre, ref, notes, type, attachments…} — collable trous + cases
    weekStart: null,        // lundi ISO de la vue Semaine
    weekDays: null,         // [{date, blocs}] × 5 — cache de la semaine affichée
    cfgOpen: false,         // panneau de config des jours-cycle (vue Mois)
    planKey: null,          // cache plans (groupe__année) — invalide au switch groupe/année
    planSeq: null,          // doc 'seq'      { sequences:[{id,titre,cours:[{date,texte}]}] }
    planAn: null,           // doc 'annuelle' { weeks:{ '<lundi ISO>':{act,comp} } }
    seqIdx: 0,              // séquence affichée
    anYM: null,             // mois affiché de l'annuelle 'YYYY-MM'
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
      case 'semaine':     return renderSemaineV2();                                     // aperçu des journées planifiées (mêmes données que le Jour)
      case 'evaluation':  return renderEvalV2();                                         // carnet iDoceo (moteur v1)
      case 'roster':      return renderRoster();                                         // vue v1
      case 'gabarit':     return renderGabarit();                                        // vue v1
      case 'historique':  return renderHistorique();                                     // vue v1
      case 'live':        return renderLive();                                           // vue v1
      case 'seq':         return renderSeq();
      case 'annuelle':    return renderAnnuelle();
      case 'calendrier':  return renderMois();                                           // l'ancien calendrier pointe sur le mensuel v2
      default:            return renderMois();
    }
  }

  function stubSheet(titre, note) {
    return `<div class="pv2-sheet"><div class="pv2-sheettitle"><span class="c">${titre}</span></div>
      <div class="pv2-empty">🚧 ${note}</div></div>`;
  }

  function post() {
    // Plus de montage semaine-grid en v2 : la vue Semaine est native (renderSemaineV2).
  }

  // ── VUE SEMAINE v2 : aperçu des 5 journées planifiées (source unique = journees/blocs) ──
  // Planifier au Jour ⇒ visible ici ET au ● du Calendrier (même donnée). Toucher un jour l'ouvre.
  function weekMonday(iso) { return isoAdd(iso, -((isoDow(iso) + 6) % 7)); }

  async function loadWeekV2() {
    const base = S.weekStart || weekMonday(state.currentDate || todayISO());
    S.weekStart = base;
    const days = [];
    for (let i = 0; i < 5; i++) {
      const date = isoAdd(base, i);
      let blocs = [];
      try { const j = await Journees.getByGroupeAndDate(state.groupeId, date); if (j) blocs = j.blocs || []; } catch (e) { console.warn('[V2] week', date, e); }
      blocs = blocs.slice().sort((a, b) => (hmToMin(a.debut) ?? 9e9) - (hmToMin(b.debut) ?? 9e9));
      days.push({ date, blocs });
    }
    S.weekDays = days;
  }

  function renderSemaineV2() {
    const days = S.weekDays || [];
    const JN = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
    const today = todayISO();
    const gnom = state.groupe ? state.groupe.nom : '—';
    let h = `<div class="pv2-sheet pv2-print pv2-wsheet">
      <img class="pv2-wmascotte" src="img/mascotte-${metier()}.png" alt="" aria-hidden="true">
      <div class="pv2-sheettitle">
        <button class="zts-action pv2-act sm" data-action="v2-sem-nav" data-d="-1">◀</button>
        <span class="c">Semaine</span> <span class="y">du ${S.weekStart ? formatDateFR(S.weekStart) : ''}</span>
        <button class="zts-action pv2-act sm" data-action="v2-sem-nav" data-d="1">▶</button>
        <span style="font-size:15px;color:var(--pv2-gold);font-family:var(--font-fun);font-weight:700">· ${esc(gnom)}</span>
      </div>
      <div class="pv2-wgrid">`;
    days.forEach((day, i) => {
      const isToday = day.date === today;
      const dd = +day.date.slice(8);
      const sd = SCHOOL.days[day.date];
      const off = !isSchoolDay(day.date);
      h += `<div class="pv2-wday ${isToday ? 'today' : ''} ${off ? 'off ' + (sd ? sd.type : '') : ''}">
        <div class="pv2-wdhd ${i % 2 ? 'c' : 'y'}" data-action="v2-open-day" data-date="${day.date}">
          <span>${JN[i]}</span><span class="pv2-wdnum">${dd}</span>
        </div>
        <div class="pv2-wdbody" data-action="v2-open-day" data-date="${day.date}">`;
      if (off) {
        h += `<div class="pv2-wspecial ${sd ? sd.type : ''}">${sd && sd.type === 'pedago' ? '📎 Pédago' : '🎉 Congé'}${sd && sd.label ? '<br><small>' + esc(sd.label) + '</small>' : ''}</div>`;
      } else if (day.blocs.length) {
        h += day.blocs.map(b => {
          const t = BLOC_TYPES[b.type] || BLOC_TYPES.activite;
          const hr = (b.debut || b.fin) ? `<span class="pv2-wbh">${esc(b.debut || '')}${b.fin ? '–' + esc(b.fin) : ''}</span>` : '';
          const titre = (b.titre || '').split('\n')[0] || t.label;
          return `<div class="pv2-wb ${b.done ? 'done' : ''}"><span class="pv2-wbi" style="background:${t.color}">${t.icon}</span><span class="pv2-wbt">${esc(titre)}</span>${hr}</div>`;
        }).join('');
      } else {
        h += `<div class="pv2-wempty">＋ Planifier</div>`;
      }
      h += `</div></div>`;
    });
    h += `</div>
      <p class="pv2-note">💡 Aperçu de tes <b>journées planifiées</b>. Touche un jour pour l'ouvrir et l'éditer au <b>Jour</b> — ce que tu planifies apparaît ici, au Jour, et au ● du <b>Calendrier</b> (une seule et même donnée).</p>
    </div>`;
    return h;
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

  // ── CALENDRIER SCOLAIRE : jours spéciaux (congé/pédago/spécial) + jours-cycle I-VI ──
  // Données locales (par enseignant) : { anchor:{date,jour}, days:{ISO:{type,label}} }.
  // Un congé/pédago N'AVANCE PAS le cycle ; un jour « spécial » reste un jour d'école.
  let SCHOOL = schoolLoad();
  function schoolLoad() { try { return JSON.parse(localStorage.getItem('pv2school') || 'null') || { anchor: null, days: {} }; } catch (e) { return { anchor: null, days: {} }; } }
  function schoolSave() { try { localStorage.setItem('pv2school', JSON.stringify(SCHOOL)); } catch (e) {} }
  function isoAdd(iso, n) { const [y, m, d] = iso.split('-').map(Number); const dt = new Date(y, m - 1, d + n); return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0'); }
  function isoDow(iso) { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).getDay(); }
  function schoolAnchor() {
    if (SCHOOL.anchor && SCHOOL.anchor.date) return SCHOOL.anchor;
    // défaut : 1er jour de semaine dès le 1er août de l'année scolaire = jour 1 (corrigeable en 1 clic)
    const an = S.annee || anneeCourante();
    const y = an.startsWith('ete-') ? +an.slice(4) : +an.split('-')[0];
    let d = y + '-08-01'; while (isoDow(d) === 0 || isoDow(d) === 6) d = isoAdd(d, 1);
    SCHOOL.anchor = { date: d, jour: 1 };
    return SCHOOL.anchor;
  }
  function isSchoolDay(iso) { const dw = isoDow(iso); if (dw === 0 || dw === 6) return false; const sd = SCHOOL.days[iso]; return !(sd && (sd.type === 'conge' || sd.type === 'pedago')); }
  // Nombre net de jours d'école entre deux dates (signé) — sert au calcul du cycle.
  function schoolDelta(fromISO, toISO) { if (fromISO === toISO) return 0; let n = 0, cur = fromISO, g = 0; const dir = toISO > fromISO ? 1 : -1; while (cur !== toISO && g++ < 4000) { cur = isoAdd(cur, dir); if (isSchoolDay(cur)) n += dir; } return n; }
  // Configuration du cycle : longueur + affichage (romains/chiffres/lettres/couleurs/perso).
  const CYC_PAL = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#B983FF', '#FF9F45', '#00C9A7', '#F97B8B', '#845EC2', '#2CD3E1', '#FFC75F', '#C34A36'];
  function cycleCfg() {
    if (!SCHOOL.cycle) SCHOOL.cycle = { len: 6, style: 'roman', labels: [] };
    if (!(SCHOOL.cycle.len >= 1)) SCHOOL.cycle.len = 6;
    return SCHOOL.cycle;
  }
  function cycleLen() { return Math.max(1, Math.min(12, cycleCfg().len)); }
  function toRoman(n) { const m = [['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]]; let r = ''; for (const [s, v] of m) while (n >= v) { r += s; n -= v; } return r; }
  function cycleLabel(idx) {   // idx 0-based
    const c = cycleCfg();
    if (c.style === 'custom' && (c.labels || [])[idx]) return c.labels[idx];
    if (c.style === 'num') return String(idx + 1);
    if (c.style === 'alpha') return String.fromCharCode(65 + (idx % 26));
    if (c.style === 'color') return '';
    return toRoman(idx + 1);
  }
  function cycleColor(idx) { return cycleCfg().style === 'color' ? CYC_PAL[idx % CYC_PAL.length] : null; }
  function cycleIdx(iso) { if (!isSchoolDay(iso)) return null; const a = schoolAnchor(); const L = cycleLen(); return (((a.jour - 1 + schoolDelta(a.date, iso)) % L) + L) % L; }  // 0-based

  // Import .ics : classe chaque événement (congé/pédago/spécial) par mots-clés.
  function classifyDay(summary) {
    const s = (summary || '').toLowerCase();
    if (/cong[ée]|f[ée]ri[ée]|vacance|rel[âa]che|ferm[ée]|holiday|break/.test(s)) return 'conge';
    if (/p[ée]dago|journ[ée]e profess|ped\.|professional dev|p\.p\./.test(s)) return 'pedago';
    return 'special';
  }
  function parseIcs(txt) {
    const lines = txt.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/);
    const pd = v => { const m = v.match(/(\d{4})(\d{2})(\d{2})/); return m ? `${m[1]}-${m[2]}-${m[3]}` : null; };
    let cur = null, count = 0;
    for (const ln of lines) {
      if (ln === 'BEGIN:VEVENT') { cur = {}; continue; }
      if (ln === 'END:VEVENT') {
        if (cur && cur.start) {
          const type = classifyDay(cur.summary);
          const end = (cur.end && cur.end > cur.start) ? cur.end : isoAdd(cur.start, 1);   // DTEND all-day = exclusif
          let d = cur.start, g = 0;
          while (d < end && g++ < 400) { SCHOOL.days[d] = { type, label: (cur.summary || '').slice(0, 60) }; count++; d = isoAdd(d, 1); }
        }
        cur = null; continue;
      }
      if (!cur) continue;
      const up = ln.toUpperCase();
      if (up.startsWith('SUMMARY')) cur.summary = ln.slice(ln.indexOf(':') + 1).trim();
      else if (up.startsWith('DTSTART')) cur.start = pd(ln);
      else if (up.startsWith('DTEND')) cur.end = pd(ln);
    }
    return count;
  }
  function importIcs() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.ics,text/calendar';
    inp.onchange = async () => {
      const f = inp.files[0]; if (!f) return;
      try {
        const n = parseIcs(await f.text());
        schoolSave(); render0();
        toast(n ? `📥 ${n} jour(s) importé(s) — congés/pédagos retirés du cycle, jours spéciaux marqués.` : '⚠️ Aucun événement trouvé dans ce fichier .ics.');
      } catch (e) { toast('⚠️ Fichier illisible : ' + (e.message || e)); }
    };
    inp.click();
  }
  function setCycle(iso) {
    const cur = cycleIdx(iso);
    const r = prompt('Ce jour est le jour-cycle (1 à 6) :', String((cur == null ? 0 : cur) + 1));
    if (r === null) return;
    const j = Math.max(1, Math.min(6, parseInt(r) || 1));
    SCHOOL.anchor = { date: iso, jour: j }; schoolSave();
    render0(); toast('🔢 Jours-cycle recalés — tout le calendrier s\'est ajusté automatiquement.');
  }
  function clearSchool() {
    if (!confirm('Effacer le calendrier scolaire importé (congés, pédagos, jours spéciaux)?')) return;
    SCHOOL = { anchor: SCHOOL.anchor, days: {} }; schoolSave(); render0();
    toast('🗑️ Jours spéciaux effacés (le calage des jours-cycle est conservé).');
  }
  // Édition manuelle d'un jour : type (congé/pédago/spécial/normal) + titre/note libre.
  function setDay(iso, patch) {
    const cur = SCHOOL.days[iso] || {};
    const type = ('type' in patch) ? patch.type : (cur.type || '');
    const label = ('label' in patch) ? patch.label : (cur.label || '');
    if (!type && !String(label).trim()) delete SCHOOL.days[iso];
    else SCHOOL.days[iso] = { type: type || '', label: String(label).trim() };
    schoolSave();
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
    let cyc = null;   // index 0-based du prochain jour d'école (calé une fois sur l'ancre)
    weeks.forEach(w => w.forEach((d, col) => {
      if (d === null) { h += `<div></div>`; return; }
      const iso = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      const isToday = iso === today;
      const has = state.calDatesWithBlocs && state.calDatesWithBlocs.has(iso);
      const sd = SCHOOL.days[iso];
      if (!isSchoolDay(iso)) {                       // congé / pédago : pas de jour-cycle, badge coloré
        h += `<div class="pv2-mcell off ${sd ? sd.type : ''} ${isToday ? 'today' : ''}" data-action="v2-daysum" data-date="${iso}">
          <span class="num">${d}</span>
          <span class="pv2-cbadge ${sd ? sd.type : ''}">${sd && sd.type === 'pedago' ? 'PÉDAGO' : 'CONGÉ'}</span>
          ${sd && sd.label ? `<span class="pv2-clabel">${esc(sd.label)}</span>` : ''}
        </div>`;
        return;
      }
      if (cyc === null) cyc = cycleIdx(iso);          // 1 seul calcul (marche depuis l'ancre)
      const isSpec = sd && sd.type === 'special';
      const lbl = sd && sd.label;
      const col2 = cycleColor(cyc);
      const cycHtml = col2
        ? `<span class="cyc cyc-color" data-action="v2-cycle-set" data-date="${iso}" title="Corriger le jour-cycle" style="background:${col2}"></span>`
        : `<span class="cyc" data-action="v2-cycle-set" data-date="${iso}" title="Corriger le jour-cycle (tout se recale)">${esc(cycleLabel(cyc))}</span>`;
      h += `<div class="pv2-mcell ${col % 2 === 0 ? 'y' : 'c'} ${isToday ? 'today' : ''} ${isSpec ? 'special' : ''}" data-action="v2-daysum" data-date="${iso}">
        <span class="num">${d}</span>
        ${cycHtml}
        ${lbl ? `<span class="pv2-clabel ${isSpec ? 'special' : ''}">${esc(sd.label)}</span>` : ''}
        ${has ? '<span class="pv2-dotplan" title="Journée planifiée">●</span>' : ''}
      </div>`;
      cyc = (cyc + 1) % cycleLen();
    }));
    const nbSpec = Object.keys(SCHOOL.days).length;
    h += `</div>
      <div class="pv2-note">💡 Clique une <b>date</b> pour tout éditer (congé/pédago/spécial, note, jour-cycle) · touche un <b style="color:var(--pv2-gold);font-family:var(--font-bang)">jour-cycle</b> pour le corriger → tout se recale · « 📥 Importer » ajoute le calendrier scolaire.
        <button class="zts-action pv2-act sm" style="margin-left:8px" data-action="v2-cyc-cfg">⚙️ Configurer les jours-cycle</button>
        ${nbSpec ? `<button class="zts-action pv2-act sm" style="margin-left:6px" data-action="v2-cal-clear">🗑️ Effacer les ${nbSpec} jour(s) importé(s)</button>` : ''}
      </div>
      ${S.cfgOpen ? renderCycCfg() : ''}
    </div>`;
    return h;
  }

  // Panneau de configuration du cycle (longueur + affichage)
  function renderCycCfg() {
    const c = cycleCfg(), L = cycleLen();
    const styles = [['roman', 'I II III'], ['num', '1 2 3'], ['alpha', 'A B C'], ['color', '🎨 Couleurs'], ['custom', '✏️ Perso']];
    let h = `<div class="pv2-cfg">
      <div class="pv2-cfgrow"><b>Nombre de jours&nbsp;:</b>
        <button class="pv2-cycbtn" data-action="v2-cyc-len" data-d="-1">−</button>
        <b class="pv2-cfglen">${L}</b>
        <button class="pv2-cycbtn" data-action="v2-cyc-len" data-d="1">＋</button>
        <span class="pv2-mute" style="font-size:12px">(ex. 1 à ${L})</span>
      </div>
      <div class="pv2-cfgrow"><b>Affichage&nbsp;:</b>
        ${styles.map(([s, lbl]) => `<button class="zts-action pv2-act sm ${c.style === s ? 'prim' : ''}" data-action="v2-cyc-style" data-s="${s}">${lbl}</button>`).join('')}
      </div>`;
    // aperçu
    h += `<div class="pv2-cfgrow"><b>Aperçu&nbsp;:</b> ${Array.from({ length: L }, (_, i) => {
      const col = cycleColor(i);
      return col ? `<span class="pv2-cycprev" style="background:${col}"></span>` : `<span class="pv2-cycprev txt">${esc(cycleLabel(i) || '·')}</span>`;
    }).join('')}</div>`;
    if (c.style === 'custom') {
      h += `<div class="pv2-cfgrow" style="align-items:flex-start"><b>Noms&nbsp;:</b>
        <div class="pv2-cfgnames">${Array.from({ length: L }, (_, i) =>
        `<input class="p-input pv2-cycname" data-cyc-name="${i}" value="${esc((c.labels || [])[i] || '')}" placeholder="Jour ${i + 1}" maxlength="8">`).join('')}</div></div>`;
    }
    h += `<div class="pv2-cfgrow"><button class="zts-action pv2-act sm" data-action="v2-cyc-cfg">✅ Fermer</button></div></div>`;
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
    // ── Éditeur du jour (tout est modifiable à la main) ──
    const sdCur = SCHOOL.days[dateISO] || { type: '', label: '' };
    const curType = sdCur.type || 'normal';
    const weekend = isoDow(dateISO) === 0 || isoDow(dateISO) === 6;
    const cyc = cycleIdx(dateISO);
    const typeBtn = (t, ico, lbl) => `<button class="zts-action pv2-act sm ${curType === (t || 'normal') ? 'prim' : ''}" data-action="v2-day-type" data-date="${dateISO}" data-t="${t}">${ico} ${lbl}</button>`;
    const editor = `
      <div class="pv2-sumline"><b>CE JOUR — TOUT MODIFIABLE</b>
        <div class="pv2-daytypes">
          ${typeBtn('', '📘', 'Normal')}${typeBtn('conge', '🎉', 'Congé')}${typeBtn('pedago', '📎', 'Pédago')}${typeBtn('special', '⭐', 'Spécial')}
        </div>
        <input class="p-input pv2-daynote" data-day-note="${dateISO}" placeholder="＋ Ajouter un titre / une note (sortie, photo scolaire, rappel…)" value="${esc(sdCur.label || '')}" maxlength="70">
        ${weekend ? '' : `<div class="pv2-daycyc">Jour-cycle&nbsp;: ${Array.from({ length: cycleLen() }, (_, i) => { const col = cycleColor(i); return `<button class="pv2-cycbtn ${cyc === i ? 'on' : ''}" data-action="v2-cycle-pick" data-date="${dateISO}" data-j="${i + 1}" ${col ? `style="background:${col};color:#fff;min-width:26px"` : ''}>${esc(cycleLabel(i) || (i + 1))}</button>`; }).join('')}</div>`}
      </div>`;
    body.innerHTML = editor + `
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
        <div class="pv2-dcell pv2-derou" data-drop-bloc="${b.id}">
          <span class="pv2-btag" style="background:${t.color}">${t.icon}</span>
          <div class="pv2-ed" contenteditable data-v2-edit-bloc="${b.id}">${esc(b.titre || '')}</div>
          ${b.type === 'garde' ? `<button class="zts-action pv2-act sm" data-action="open-presences-modal">📋 Présences</button>` : ''}
          <span class="pv2-rowtools">
            <button class="pv2-tool ${timerOn ? 'on' : ''}" data-action="v2-timer" data-bloc-id="${b.id}" title="${timerOn ? 'Arrêter la minuterie' : 'Minuterie de ce bloc'}">⏱</button>
            <button class="pv2-tool" data-action="v2-copy" data-bloc-id="${b.id}" title="Copier toute la case (texte + médias) — coller dans un trou ou une autre case">📄</button>
            ${S.clip ? `<button class="pv2-tool" data-action="v2-paste-into" data-bloc-id="${b.id}" title="Coller ici « ${esc(clipTitre())} » (remplace le contenu de la case)">📋</button>` : ''}
          </span>
          ${mediaChips(b)}
        </div>
        <div class="pv2-dcell pv2-fait ${b.done ? 'ok' : ''}" data-action="v2-tog-fait" data-bloc-id="${b.id}">${b.done ? '✓' : ''}</div>
      </div>` };
    });
    const trous = (typeof PlanifData !== 'undefined') ? PlanifData.trousJournee(blocs) : [];
    for (const t of trous) {
      const lbl = `${t.debut.replace(':', ' h ')} → ${t.fin.replace(':', ' h ')}`;
      const inner = S.clip
        ? `＋ ${lbl} — libre&nbsp;
           <button class="zts-action pv2-act sm prim" data-action="v2-paste" data-debut="${t.debut}" data-fin="${t.fin}">📋 Coller « ${esc(clipTitre().slice(0, 24))} »</button>
           <button class="zts-action pv2-act sm" data-action="tiroir-trou" data-debut="${t.debut}" data-fin="${t.fin}">🎲 Tiroir</button>`
        : `＋ ${lbl} — libre · toucher pour ouvrir le tiroir Jeux 🎲`;
      const row = { tMin: hmToMin(t.debut), html: `<div class="pv2-hole" ${S.clip ? '' : `data-action="tiroir-trou" data-debut="${t.debut}" data-fin="${t.fin}"`}>${inner}</div>` };
      const idx = rows.findIndex(c => c.tMin != null && row.tMin != null && c.tMin >= hmToMin(t.fin));
      if (idx === -1) rows.push(row); else rows.splice(idx, 0, row);
    }
    h += rows.map(r => r.html).join('') || `<div class="pv2-empty">Aucun bloc — clique un trou ou le tiroir JEUX 🎲</div>`;
    h += `<div style="display:flex;gap:8px;justify-content:center;margin-top:10px;flex-wrap:wrap">
      <button class="zts-action pv2-act sm" data-action="add-bloc" data-context="journee">+ Ajouter un bloc</button>
      ${S.clip ? `<button class="zts-action pv2-act sm" data-action="v2-clip-cancel">✕ Terminer le collage (« ${esc(clipTitre().slice(0, 18))} »)</button>` : ''}
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
        toast('⏱ Temps écoulé — « ' + esc((b.titre || 'bloc').split('\n')[0]) + ' »!');
        const node = document.querySelector(`[data-bloc-id="${blocId}"]`);
        if (node) { node.classList.add('p-bloc--flash'); node.addEventListener('animationend', () => node.classList.remove('p-bloc--flash'), { once: true }); }
        render0();
      }
    }, 500);
    render0();
    toast('⏱ ' + mins + ' min — go!');
  }

  // ── Médias de case (glisser-déposer / coller) ─────────────
  // DÉCISION (même que la vue Semaine) : les octets (data URL) ne vont JAMAIS
  // dans Firestore (doc journees limité à 1 Mo). Firestore garde {name,type,local:true},
  // le miroir localStorage (clé par journée) garde les données.
  const MAX_FILE = 2.6 * 1024 * 1024;
  function mKey() { return 'pv2media_' + (state.journeeId || 'x'); }
  function mAll() { try { return JSON.parse(localStorage.getItem(mKey()) || '{}'); } catch (e) { return {}; } }
  function mGet(blocId, name) { return mAll()[blocId + '|' + name] || null; }
  function mSet(blocId, name, data) {
    const m = mAll(); m[blocId + '|' + name] = data;
    try { localStorage.setItem(mKey(), JSON.stringify(m)); return true; }
    catch (e) { toast('⚠️ Mémoire locale pleine — retire un média lourd avant d\'en ajouter.'); return false; }
  }
  function mDel(blocId, name) {
    const m = mAll(); delete m[blocId + '|' + name];
    try { localStorage.setItem(mKey(), JSON.stringify(m)); } catch (e) {}
  }
  function mediaData(blocId, a) { return a.data || mGet(blocId, a.name); }
  function kindOf(mime) {
    if (!mime) return 'file';
    if (mime.startsWith('image/')) return 'img';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    if (mime === 'application/pdf') return 'pdf';
    return 'file';
  }

  function shrinkImage(dataURL) {
    return new Promise(res => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 1400 / img.width);
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', .82));
      };
      img.onerror = () => res(dataURL);
      img.src = dataURL;
    });
  }
  function readMedia(f) {
    return new Promise(res => {
      const r = new FileReader();
      r.onload = async () => {
        let data = r.result;
        if (f.type.startsWith('image/') && f.size > 300 * 1024) data = await shrinkImage(data);
        res({ name: f.name || 'media', type: f.type || '', data });
      };
      r.readAsDataURL(f);
    });
  }

  async function saveBlocAttachments(blocId, at) {
    const blocs = state.journeeBlocs.map(x => x.id === blocId ? { ...x, attachments: at } : x);
    await Journees.update(state.journeeId, { blocs });
    state.journeeBlocs = blocs;
  }

  async function addMediasToBloc(blocId, files) {
    const b = state.journeeBlocs.find(x => x.id === blocId); if (!b || !files.length) return;
    const at = [...(b.attachments || [])]; let skip = 0, add = 0;
    for (const f of files) {
      if (f.size > MAX_FILE && !f.type.startsWith('image/')) { skip++; continue; }
      const m = await readMedia(f);
      let name = m.name, n = 2;                       // nom unique = clé du miroir
      while (at.some(x => x.name === name)) name = m.name + ' (' + (n++) + ')';
      if (!mSet(blocId, name, m.data)) break;
      at.push({ name, type: m.type, local: true }); add++;
    }
    if (!add && !skip) return;
    if (add) await saveBlocAttachments(blocId, at);
    render0();
    toast(skip
      ? '⚠️ ' + skip + ' fichier(s) > 2,5 Mo ignoré(s)' + (add ? ' — le reste est dans la case 📎' : '.')
      : '📎 Ajouté dans la case!');
  }

  async function removeMedia(blocId, idx) {
    const b = state.journeeBlocs.find(x => x.id === blocId); if (!b) return;
    const at = [...(b.attachments || [])];
    const [a] = at.splice(idx, 1);
    if (a && a.local) mDel(blocId, a.name);
    await saveBlocAttachments(blocId, at);
    render0();
  }

  // chips uniformes dans la case (mise en page jamais cassée : rangée dédiée pleine largeur)
  function mediaChips(b) {
    const at = b.attachments || []; if (!at.length) return '';
    return `<div class="pv2-medias">` + at.map((a, i) => {
      const k = kindOf(a.type), d = mediaData(b.id, a);
      const inner = (k === 'img' && d)
        ? `<img src="${d}" alt="${esc(a.name)}">`
        : `${attachIcon(a.type || '')} <span class="nm">${esc(a.name)}</span>`;
      return `<span class="pv2-media" data-action="v2-media-view" data-bloc-id="${b.id}" data-idx="${i}" title="${esc(a.name)}">${inner}<b class="rm" data-action="v2-media-rm" data-bloc-id="${b.id}" data-idx="${i}" title="Retirer">✕</b></span>`;
    }).join('') + `</div>`;
  }

  function openMediaView(blocId, idx) {
    const b = state.journeeBlocs.find(x => x.id === blocId);
    const a = b?.attachments?.[idx]; if (!a) return;
    const d = mediaData(blocId, a);
    if (!d) { toast('⚠️ Média enregistré sur un autre appareil — re-glisse le fichier ici pour le revoir.'); return; }
    const k = kindOf(a.type);
    const box = document.getElementById('v2-daysum');
    box.querySelector('[data-ds-title]').textContent = attachIcon(a.type || '') + ' ' + a.name;
    box.querySelector('[data-ds-body]').innerHTML = `<div class="pv2-mview">` +
      (k === 'img' ? `<img src="${d}">`
      : k === 'pdf' ? `<iframe src="${d}"></iframe>`
      : k === 'video' ? `<video src="${d}" controls autoplay></video>`
      : k === 'audio' ? `<audio src="${d}" controls></audio>`
      : `<a class="zts-action" href="${d}" download="${esc(a.name)}">💾 Télécharger ${esc(a.name)}</a>`) + `</div>`;
    box.classList.add('open'); document.getElementById('v2-backdrop').classList.add('open');
  }

  // texte échappé (glissé sur une case) → ajouté à la fin du déroulement
  async function appendTextToBloc(blocId, txt) {
    const b = state.journeeBlocs.find(x => x.id === blocId); if (!b || !txt.trim()) return;
    await saveBlocTitre(blocId, (b.titre ? b.titre + '\n' : '') + txt.trim());
    render0();
  }

  function clipTitre() { return (S.clip?.titre || 'bloc').split('\n')[0]; }

  function copyBloc(blocId) {
    const b = state.journeeBlocs.find(x => x.id === blocId); if (!b) return;
    const d = hmToMin(b.debut), f = hmToMin(b.fin);
    S.clip = { titre: b.titre || '', ref: b.ref || '', notes: b.notes || '',
      type: b.type, font: b.font, customColor: b.customColor,
      attachments: (b.attachments || []).map(a => ({ name: a.name, type: a.type, data: mediaData(b.id, a) })),
      duree: (d != null && f != null && f > d) ? (f - d) : 45 };   // durée d'origine (45 min par défaut)
    render0();
    toast('📄 « ' + clipTitre() + ' » copié (texte + médias) — touche un trou OU le 📋 d\'une autre case.');
  }

  // applique TOUT le presse-papier (texte, notes, style, médias) au bloc cible
  async function applyClip(blocId) {
    const at = [];
    for (const a of (S.clip.attachments || [])) {
      if (a.data && !mSet(blocId, a.name, a.data)) break;
      at.push({ name: a.name, type: a.type, local: !!a.data });
    }
    const blocs = state.journeeBlocs.map(x => x.id === blocId
      ? { ...x, titre: S.clip.titre, ref: S.clip.ref || x.ref || null, notes: S.clip.notes,
          font: S.clip.font || x.font, customColor: S.clip.customColor || x.customColor,
          attachments: at } : x);
    await Journees.update(state.journeeId, { blocs });
    state.journeeBlocs = blocs;
  }

  async function pasteIntoBloc(blocId) {
    if (!S.clip) return;
    const b = state.journeeBlocs.find(x => x.id === blocId); if (!b) return;
    if ((b.titre || (b.attachments || []).length) &&
        !confirm('Remplacer le contenu de cette case par « ' + clipTitre() + ' » (texte + médias)?')) return;
    await applyClip(blocId);
    render0();
    toast('📋 Case remplacée par « ' + clipTitre() + ' »!');
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
    await applyClip(idInsere);
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

  // ── PLANS SÉQUENTIELLE + ANNUELLE (maquette D1 — gabarits éditables) ──
  function newSequence() {
    return { id: 's' + Date.now().toString(36) + Math.floor(Math.random() * 1e4),
      titre: '', cours: Array.from({ length: 6 }, () => ({ date: '', texte: '' })) };
  }
  function planCleCourante() { return state.groupeId + '__' + (S.annee || anneeCourante()); }

  async function loadPlansV2(force) {
    const key = planCleCourante();
    if (!force && S.planKey === key && S.planSeq && S.planAn) return;
    const annee = S.annee || anneeCourante();
    let seq = null, an = null;
    try { seq = await Plans.get(state.groupeId, annee, 'seq'); } catch (e) { console.warn('[V2] plans seq', e); }
    try { an = await Plans.get(state.groupeId, annee, 'annuelle'); } catch (e) { console.warn('[V2] plans annuelle', e); }
    S.planSeq = (seq && seq.sequences && seq.sequences.length) ? seq : { sequences: [newSequence()] };
    S.planAn = (an && an.weeks) ? an : { weeks: {} };
    S.planKey = key;
    if (S.seqIdx >= S.planSeq.sequences.length) S.seqIdx = 0;
    const mois = anMoisListe(annee);
    if (!S.anYM || !mois.includes(S.anYM)) {
      const now = new Date();
      const cur = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
      S.anYM = mois.includes(cur) ? cur : mois[0];
    }
  }

  function savePlanSeq() {
    Plans.save(state.groupeId, S.planKey.split('__')[1], 'seq', { sequences: S.planSeq.sequences })
      .catch(e => { console.warn('[V2] save seq', e); toast('⚠️ Sauvegarde séquentielle impossible : ' + (e.message || e)); });
  }
  function savePlanAn() {
    Plans.save(state.groupeId, S.planKey.split('__')[1], 'annuelle', { weeks: S.planAn.weeks })
      .catch(e => { console.warn('[V2] save annuelle', e); toast('⚠️ Sauvegarde annuelle impossible : ' + (e.message || e)); });
  }

  // Mois de l'année scolaire : ÉPS/SDG sept→juin, camps juin→août
  function anMoisListe(annee) {
    const out = [];
    const push = (y, m) => out.push(y + '-' + String(m + 1).padStart(2, '0'));
    if (annee.startsWith('ete-')) { const y = +annee.slice(4); [5, 6, 7].forEach(m => push(y, m)); }
    else { const y1 = +annee.split('-')[0]; for (let m = 8; m <= 11; m++) push(y1, m); for (let m = 0; m <= 5; m++) push(y1 + 1, m); }
    return out;
  }
  function lundiISO(y, m, d) {
    const dt = new Date(y, m, d);
    dt.setDate(dt.getDate() - (dt.getDay() + 6) % 7);   // recule au lundi
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
  }
  function planPrete() {
    if (S.planKey === planCleCourante()) return true;
    loadPlansV2().then(render0);            // groupe/année a changé pendant la vue → recharge
    return false;
  }

  function renderSeq() {
    if (!planPrete()) return `<div class="pv2-sheet"><div class="pv2-empty">⏳ Chargement…</div></div>`;
    const seqs = S.planSeq.sequences;
    const sq = seqs[S.seqIdx] || seqs[0];
    let h = `<div class="pv2-sheet pv2-print">
      <div class="pv2-sheettitle"><span class="c">Planification</span> <span class="y">séquentielle</span></div>
      <div class="pv2-sqtabs">
        ${seqs.map((s, i) => `<button class="zts-action pv2-act sm ${i === S.seqIdx ? 'prim' : ''}" data-action="v2-sq-tab" data-i="${i}">${esc((s.titre || 'Séquence ' + (i + 1)).split('\n')[0].slice(0, 22))}</button>`).join('')}
        <button class="zts-action pv2-act sm" data-action="v2-sq-new" title="Nouvelle feuille de séquence">＋ Séquence</button>
        ${seqs.length > 1 ? `<button class="zts-action pv2-act sm" data-action="v2-sq-del" title="Supprimer cette feuille">🗑️</button>` : ''}
      </div>
      <div class="pv2-sqtitle"><b>TITRE :</b>
        <span class="pv2-sqed" contenteditable data-sq-titre placeholder="SAÉ Volleyball — 3e cycle">${esc(sq.titre)}</span></div>
      <div class="pv2-sqgrid">`;
    sq.cours.forEach((c, i) => {
      const alt = i % 2 === 0 ? 'alt-y' : 'alt-c';
      h += `<div class="pv2-sq">
        <h5>Cours ${i + 1}</h5>
        <div class="pv2-sqdate ${alt}"><b>Date :</b> <span class="pv2-sqed" contenteditable data-sq-date="${i}">${esc(c.date)}</span></div>
        <div class="pv2-sqbox ${alt} pv2-sqed" contenteditable data-sq-texte="${i}">${esc(c.texte)}</div>
      </div>`;
    });
    h += `</div>
      <div class="pv2-sqadd">
        <button class="zts-action pv2-act sm" data-action="v2-sq-add-cours">＋ Ajouter un cours</button>
        ${sq.cours.length > 1 ? `<button class="zts-action pv2-act sm" data-action="v2-sq-del-cours">− Retirer le dernier</button>` : ''}
      </div>
      <p class="pv2-note">💾 Tout se sauvegarde tout seul quand tu quittes une case. 🖨️ PDF = la feuille affichée s'imprime telle quelle.</p>
    </div>`;
    return h;
  }

  function renderAnnuelle() {
    if (!planPrete()) return `<div class="pv2-sheet"><div class="pv2-empty">⏳ Chargement…</div></div>`;
    const annee = S.planKey.split('__')[1];
    const mois = anMoisListe(annee);
    const idx = mois.indexOf(S.anYM);
    const [y, m1] = S.anYM.split('-').map(Number);
    const weeks = moisSemaines(y, m1 - 1);
    let h = `<div class="pv2-sheet pv2-print">
      <div class="pv2-sheettitle">
        <button class="zts-action pv2-act sm" data-action="v2-an-nav" data-d="-1" ${idx <= 0 ? 'disabled' : ''}>◀</button>
        <span class="y">Ma planification</span> <span class="c">annuelle</span> — <span style="color:var(--pv2-gold)">${MOIS_FR[m1 - 1]} ${y}</span>
        <button class="zts-action pv2-act sm" data-action="v2-an-nav" data-d="1" ${idx >= mois.length - 1 ? 'disabled' : ''}>▶</button>
      </div>
      <div class="pv2-anhead"><div class="pv2-anhdays">
        ${['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'].map((j, i) => `<div class="pv2-anhd ${i % 2 === 0 ? 'c' : 'y'}">${j}</div>`).join('')}
      </div></div>`;
    weeks.forEach(w => {
      const premier = w.find(d => d !== null);
      if (premier == null) return;
      const wk = lundiISO(y, m1 - 1, premier);
      const v = S.planAn.weeks[wk] || { act: '', comp: '' };
      h += `<div class="pv2-anweek">
        <div class="pv2-andays">${w.map(d => d === null
          ? `<div class="pv2-and off"></div>`
          : `<div class="pv2-and ${d % 2 ? 'yl' : 'cy'}">${d}</div>`).join('')}</div>
        <span class="pv2-anarr">➜</span>
        <div class="pv2-anbar">
          <b class="la">ACTIVITÉ :</b><span class="pv2-sqed ed" contenteditable data-an-act="${wk}">${esc(v.act)}</span>
          <b class="lc">COMPÉTENCE :</b><span class="pv2-sqed ed" contenteditable data-an-comp="${wk}">${esc(v.comp)}</span>
        </div>
      </div>`;
    });
    h += `<p class="pv2-note">💡 1 ligne = 1 semaine. Écris l'<b>activité</b> (ex. SAÉ Volleyball 1-2) et la <b>compétence</b> (Agir / Interagir / Santé). Sauvegarde automatique, navigation ◀ ▶ sur les ${mois.length} mois de l'année ${annee}.</p>
    </div>`;
    return h;
  }

  // saisies des plans (focusout délégué depuis wire())
  async function planFocusOut(el) {
    const txt = (el.innerText || '').replace(/\u00a0/g, ' ').trim();
    if (el.hasAttribute('data-sq-titre')) {
      S.planSeq.sequences[S.seqIdx].titre = txt; savePlanSeq(); return true;
    }
    if (el.hasAttribute('data-sq-date')) {
      S.planSeq.sequences[S.seqIdx].cours[+el.dataset.sqDate].date = txt; savePlanSeq(); return true;
    }
    if (el.hasAttribute('data-sq-texte')) {
      S.planSeq.sequences[S.seqIdx].cours[+el.dataset.sqTexte].texte = txt; savePlanSeq(); return true;
    }
    if (el.hasAttribute('data-an-act') || el.hasAttribute('data-an-comp')) {
      const wk = el.dataset.anAct || el.dataset.anComp;
      const v = S.planAn.weeks[wk] || { act: '', comp: '' };
      if (el.hasAttribute('data-an-act')) v.act = txt; else v.comp = txt;
      S.planAn.weeks[wk] = v; savePlanAn(); return true;
    }
    return false;
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
      <div class="pv2-sheettitle"><span class="c">Carnet</span> <span class="y">d'évaluation</span> — <span style="color:var(--pv2-gold)">${esc(gnom)}</span></div>
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
        <div class="pv2-ghead">
          <div class="pv2-gname" data-action="v2-g-toggle" data-gid="${g.id}">${nomHtml}</div>
          ${lecture ? '' : `<div class="pv2-growbtns">
            <button class="pv2-gbtn" data-action="v2-g-rename" data-gid="${g.id}" title="Renommer / changer le numéro">✏️</button>
            <button class="pv2-gbtn del" data-action="v2-g-delete" data-gid="${g.id}" title="Supprimer ce groupe">✕</button>
          </div>`}
        </div>
        <div class="pv2-gopts" ${on ? '' : 'hidden'}>
          <div class="pv2-gopt" data-action="v2-g-presence" data-gid="${g.id}">✅ Présence</div>
          <div class="pv2-gopt" data-action="v2-stub" data-msg="👕 Linge : liste cochable par ${unit()} — Phase B">👕 Linge</div>
          <div class="pv2-gopt" data-action="v2-g-eval" data-gid="${g.id}">📋 Évaluation</div>
          <div class="pv2-gopt" data-action="v2-view" data-view="roster">🧒 ${unit().charAt(0).toUpperCase() + unit().slice(1)}</div>
          <div class="pv2-gopt" data-action="v2-view" data-view="gabarit">📐 Journée type</div>
          ${lecture ? '' : `<div class="pv2-gcfg">
            <span data-action="v2-g-archive" data-gid="${g.id}">🗄️ Archiver (garder l'historique)</span></div>`}
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
        if (ds.view === 'seq' || ds.view === 'annuelle') await loadPlansV2();
        if (ds.view === 'semaine') await loadWeekV2();
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
      case 'v2-import-ics': importIcs(); return;
      case 'v2-cycle-set': setCycle(ds.date); return;
      case 'v2-cal-clear': clearSchool(); return;
      case 'v2-day-type': setDay(ds.date, { type: ds.t }); render0(); openDaySum(ds.date); return;
      case 'v2-cycle-pick': SCHOOL.anchor = { date: ds.date, jour: parseInt(ds.j, 10) }; schoolSave(); render0(); openDaySum(ds.date); toast('🔢 Jours-cycle recalés — tout s\'ajuste automatiquement.'); return;
      case 'v2-cyc-cfg': S.cfgOpen = !S.cfgOpen; render0(); return;
      case 'v2-cyc-len': {
        const c = cycleCfg();
        c.len = Math.max(1, Math.min(12, cycleLen() + parseInt(ds.d, 10)));
        if (SCHOOL.anchor && SCHOOL.anchor.jour > c.len) SCHOOL.anchor.jour = c.len;   // recale l'ancre si hors borne
        schoolSave(); render0(); return;
      }
      case 'v2-cyc-style': cycleCfg().style = ds.s; schoolSave(); render0(); return;
      case 'v2-sem-nav': S.weekStart = isoAdd(S.weekStart || weekMonday(state.currentDate || todayISO()), parseInt(ds.d, 10) * 7); await loadWeekV2(); render0(); return;
      case 'v2-open-day': state.currentDate = ds.date; state.view = 'journee'; await loadJourneeData(); render0(); return;
      case 'v2-pdf': window.print(); return;
      case 'v2-an-nav': {
        const mois = anMoisListe(S.planKey.split('__')[1]);
        const i = mois.indexOf(S.anYM) + parseInt(ds.d, 10);
        if (i >= 0 && i < mois.length) { S.anYM = mois[i]; render0(); }
        return;
      }
      case 'v2-sq-tab': S.seqIdx = +ds.i; render0(); return;
      case 'v2-sq-new':
        S.planSeq.sequences.push(newSequence());
        S.seqIdx = S.planSeq.sequences.length - 1;
        savePlanSeq(); render0(); toast('＋ Nouvelle feuille de séquence!'); return;
      case 'v2-sq-del': {
        const sq = S.planSeq.sequences[S.seqIdx];
        if (!confirm('Supprimer la feuille « ' + ((sq.titre || 'Séquence ' + (S.seqIdx + 1)).split('\n')[0]) + ' »?')) return;
        S.planSeq.sequences.splice(S.seqIdx, 1);
        S.seqIdx = Math.max(0, S.seqIdx - 1);
        savePlanSeq(); render0(); toast('🗑️ Feuille supprimée.'); return;
      }
      case 'v2-sq-add-cours':
        S.planSeq.sequences[S.seqIdx].cours.push({ date: '', texte: '' });
        savePlanSeq(); render0(); return;
      case 'v2-sq-del-cours': {
        const cours = S.planSeq.sequences[S.seqIdx].cours;
        const dernier = cours[cours.length - 1];
        if ((dernier.date || dernier.texte) && !confirm('Le dernier cours contient du texte — le retirer quand même?')) return;
        cours.pop(); savePlanSeq(); render0(); return;
      }
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
      case 'v2-g-delete': {
        const g = S.groupes.find(x => x.id === ds.gid); if (!g) return;
        if (!confirm('Supprimer définitivement le groupe « ' + g.nom + ' »?\n\nSes présences et évaluations ne seront plus accessibles.\n(Astuce : « Archiver » garde tout l\'historique.)')) return;
        try { await Groupes.remove(ds.gid); } catch (e) { toast('⚠️ Suppression impossible : ' + (e.message || e)); return; }
        await loadGroupes();
        if (state.groupeId === ds.gid) {
          const next = (S.groupes || []).find(x => x.statut !== 'archive');
          if (next) { await switchGroupe(next.id); toast('🗑️ « ' + g.nom + ' » supprimé.'); return; }
          state.groupeId = null; state.groupe = null; try { localStorage.removeItem(LS.groupeId); } catch (e) {}
        }
        render0(); toast('🗑️ Groupe « ' + g.nom + ' » supprimé.'); return;
      }
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
      case 'v2-paste-into': pasteIntoBloc(ds.blocId); return;
      case 'v2-media-view': openMediaView(ds.blocId, +ds.idx); return;
      case 'v2-media-rm': removeMedia(ds.blocId, +ds.idx); return;
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
      // innerText (pas textContent) : préserve les sauts de ligne du contenteditable
      if (ed) { await saveBlocTitre(ed.dataset.v2EditBloc, (ed.innerText || '').replace(/\u00a0/g, ' ').trim()); return; }
      const pl = e.target.closest?.('.pv2-sqed');
      if (pl && await planFocusOut(pl)) return;
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
      // Enter DANS la case = nouvelle ligne (la case grandit), pas de blur
      if (e.key === 'Enter' && e.target.closest?.('[data-v2-edit-bloc]')) { e.preventDefault(); document.execCommand('insertLineBreak'); }
      if (e.key === 'Escape' && e.target.closest?.('[data-v2-edit-bloc]')) { e.target.blur(); }
      // plans : boîte de cours = multi-lignes ; titre/date/activité/compétence = 1 ligne (Enter = terminé)
      if (e.key === 'Enter' && e.target.closest?.('[data-sq-texte]')) { e.preventDefault(); document.execCommand('insertLineBreak'); }
      else if (e.key === 'Enter' && e.target.closest?.('.pv2-sqed')) { e.preventDefault(); e.target.blur(); }
      if (e.key === 'Escape' && e.target.closest?.('.pv2-sqed')) { e.target.blur(); }
      if (e.key === 'Enter' && e.target.id === 'pv2-new-eleve') { e.preventDefault(); evAddEleve(); }
      if (e.key === 'Escape') closeOverlays();
    });
    // Coller DANS la case : fichiers (images/PDF/vidéos) → chips médias ; texte → texte brut
    // (jamais de HTML riche : la mise en page de la case reste intacte)
    document.addEventListener('paste', (e) => {
      const ed = e.target.closest?.('[data-v2-edit-bloc]');
      if (!ed) return;
      const files = [...(e.clipboardData?.files || [])];
      e.preventDefault();
      if (files.length) { addMediasToBloc(ed.dataset.v2EditBloc, files); return; }
      const txt = e.clipboardData?.getData('text/plain') || '';
      if (txt) document.execCommand('insertText', false, txt);
    });
    // Glisser-déposer N'IMPORTE OÙ sur la case DÉROULEMENT : fichiers → médias, texte → ajouté
    document.addEventListener('dragover', (e) => {
      const c = e.target.closest?.('[data-drop-bloc]');
      if (c) { e.preventDefault(); c.classList.add('pv2-dropon'); }
    });
    document.addEventListener('dragleave', (e) => {
      const c = e.target.closest?.('[data-drop-bloc]');
      if (c && !c.contains(e.relatedTarget)) c.classList.remove('pv2-dropon');
    });
    document.addEventListener('drop', (e) => {
      const c = e.target.closest?.('[data-drop-bloc]');
      if (!c) return;
      e.preventDefault(); c.classList.remove('pv2-dropon');
      const files = [...(e.dataTransfer?.files || [])];
      if (files.length) { addMediasToBloc(c.dataset.dropBloc, files); return; }
      const txt = e.dataTransfer?.getData('text/plain') || '';
      if (txt) appendTextToBloc(c.dataset.dropBloc, txt);
    });
    document.addEventListener('change', (e) => {
      if (e.target.matches('.pv2-annee')) { S.annee = e.target.value; window.render(); }
    });
    // noms personnalisés des jours-cycle (config)
    document.addEventListener('input', (e) => {
      const n = e.target.closest?.('[data-cyc-name]');
      if (n) { const c = cycleCfg(); c.labels = c.labels || []; c.labels[+n.dataset.cycName] = n.value; schoolSave(); }
    });
    // overlays v2 (résumé de date) — hors #app-root
    document.getElementById('v2-backdrop')?.addEventListener('click', closeOverlays);
    document.getElementById('v2-daysum')?.addEventListener('click', (e) => {
      const a = e.target.closest('[data-action]');
      if (a) handleAction(a.dataset.action, a.dataset);
    });
    // note/titre d'un jour saisie dans le résumé de date → sauvegarde + maj calendrier
    document.getElementById('v2-daysum')?.addEventListener('change', (e) => {
      const n = e.target.closest('[data-day-note]');
      if (n) { setDay(n.dataset.dayNote, { label: n.value }); render0(); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();

  return { render: renderShell, post, handle, loadGroupes, toast, get S() { return S; } };
})();
