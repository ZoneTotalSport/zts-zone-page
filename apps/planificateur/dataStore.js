/**
 * dataStore.js — couche données du Planificateur (Phase 3, biblio camp)
 *
 * 1) Banque camps : catalogue 1439 (Worker zts-jeux-data, /jeux/full.json) +
 *    mini-banques (data/mini-banques.json), fusionnés à la lecture,
 *    filtrés univers "camps", normalisés en fiche tiroir.
 * 2) Écritures journée : TOUT passe par ici (Journees.* de app.js),
 *    jamais de Firestore direct depuis l'UI du tiroir.
 *
 * Clés stables : catalogue = `id` (pfeq_*, SANS_*, …) — le champ `slug`
 * n'existe pas encore dans jeux-merged.json ; mini-banques = `slug` (mb-*).
 * `ref` d'un bloc activité = cette clé.
 *
 * Script classique (pas un module) : chargé AVANT app.js ; les références
 * à Journees/state se résolvent à l'appel, pas au chargement.
 */

const PlanifData = (() => {

  // La banque vient du Worker depuis le 2026-08-17 (LOT 1 vague D). L'app est
  // gatee depuis la vague A : ses utilisateurs sont connectes, donc full.json.
  // ZTSBanques gere le jeton expire — un planificateur laisse ouvert tout un
  // apres-midi presenterait sinon un jeton perime et afficherait une banque
  // VIDE a un membre legitime.
  const CATALOGUE_VIA_WORKER = true;
  const MINIBANQUES_URL = 'data/mini-banques.json';

  const _caches = {};        // banque normalisée, par univers
  let _brut = null;          // sources brutes : un seul fetch pour TOUS les univers

  // ── Normalisation ────────────────────────────────────────

  // "Gymnase ou Extérieur" → {interieur:true, exterieur:true} ; vide → les deux (inclusif)
  function lieuFlags(espace) {
    const s = (espace || '').toLowerCase();
    if (!s || /partout/.test(s)) return { interieur: true, exterieur: true };
    const ext = /(ext[ée]rieur|terrain|parc|bois[ée]|plage|cour|nature)/.test(s);
    const int_ = /(gymnase|int[ée]rieur|salle|local|classe)/.test(s);
    return { interieur: int_ || !ext, exterieur: ext || !int_ };
  }

  // Élevé/Très élevé/actif/haute → defoulement ; Faible/calme/douce → calme ; sinon null (matche tout)
  function energieNorm(v) {
    const s = (v || '').toLowerCase();
    if (/(très élevé|tres eleve|élevé|eleve|actif|haute)/.test(s)) return 'defoulement';
    if (/(faible|calme|douce)/.test(s)) return 'calme';
    return null;
  }

  function parseAgeTag(tag) { // '5-7' → [5,7]
    const m = /^(\d+)\s*-\s*(\d+)$/.exec(tag || '');
    return m ? [+m[1], +m[2]] : [null, null];
  }

  function fromCatalogue(j) {
    const lieu = lieuFlags(j.espace);
    const mat = j.materiel || [];
    return {
      ref: j.id,
      titre: j.title || '',
      ageMin: j.ageMin ?? null, ageMax: j.ageMax ?? null,
      energie: energieNorm(j.niveauActivite),
      interieur: lieu.interieur, exterieur: lieu.exterieur,
      sansMateriel: mat.length === 0 || j.category === 'sans-materiel',
      nbJoueurs: (j.nbJoueursMin || j.nbJoueursMax)
        ? `${j.nbJoueursMin ?? '?'}–${j.nbJoueursMax ?? '?'}` : '',
      duree: j.dureeMin ? `${j.dureeMin} min` : (j.duree || ''),
      dureeMin: j.dureeMin || null,
      materielCourt: mat.length ? String(mat[0]).split('(')[0].trim() : 'Aucun',
      icon: j.categoryIcon || '🎲',
      source: 'catalogue',
    };
  }

  /* Depuis le seed SDG, la banque porte des NOMBRES : `ageMin`/`ageMax` et
     `dureeMin` sont des champs de premier niveau, plus des chaînes rangées
     dans `tags` ('5-7', '~45 min'). On lit les nombres quand ils sont là et
     on retombe sur l'ancien format sinon : une banque servie depuis un cache
     de navigateur peut encore être l'ancienne. */
  function fromMiniBanque(e) {
    const t = e.tags || {};
    const lieu = lieuFlags(t.espace);
    const [a1, a2] = (e.ageMin != null || e.ageMax != null)
      ? [e.ageMin ?? null, e.ageMax ?? null]
      : parseAgeTag(t.age);
    const dmin = (typeof e.dureeMin === 'number') ? e.dureeMin : null;
    return {
      ref: e.slug,
      titre: e.title || '',
      ageMin: a1, ageMax: a2,
      energie: energieNorm(t.energie),
      interieur: lieu.interieur, exterieur: lieu.exterieur,
      sansMateriel: t.materiel === 'aucun',
      nbJoueurs: '',
      duree: dmin ? `${dmin} min` : (e.duree || ''),
      dureeMin: dmin,
      materielCourt: (e.materiel && e.materiel[0]) ? String(e.materiel[0]).split(',')[0] : 'Aucun',
      icon: e.icon || '🎯',
      source: e.source || 'mini-banque',
    };
  }

  // ── Chargement fusionné (lazy, 1 fois) ───────────────────

  /* Un univers = un cache. `loadBanqueCamp()` reste exposé : le tiroir et
     d'éventuels appels tiers continuent de marcher sans modification. */
  /* Les sources brutes sont les MÊMES pour tous les univers — seul le filtre
     change. Les charger une fois pour toutes évite de retélécharger le
     catalogue et le fichier de mini-banques à chaque univers consulté. */
  function sourcesBrutes() {
    if (_brut) return _brut;
    _brut = Promise.all([
      // ZTSBanques rend deja du JSON analyse (et a gere le jeton expire) :
      // pas de `.ok` ni de `.json()` a enchainer ici, contrairement a un fetch.
      window.ZTSBanques.jeux(),
      fetch(MINIBANQUES_URL).then(r => { if (!r.ok) throw new Error('mini-banques ' + r.status); return r.json(); }),
    ]).catch(err => { _brut = null; throw err; });
    return _brut;
  }

  function loadBanque(univers) {
    const u = univers || 'camps';
    if (_caches[u]) return _caches[u];
    _caches[u] = sourcesBrutes().then(([cat, mb]) => {
      const items = [
        ...cat.filter(j => (j.univers || []).includes(u)).map(fromCatalogue),
        ...mb.filter(e => (e.univers || []).includes(u)).map(fromMiniBanque),
      ].filter(x => x.ref && x.titre);
      items.sort((a, b) => a.titre.localeCompare(b.titre, 'fr'));
      return items;
    }).catch(err => { _caches[u] = null; throw err; });
    return _caches[u];
  }

  function loadBanqueCamp() { return loadBanque('camps'); }

  // ── Filtres (inconnu = matche tout : ne jamais cacher du contenu) ──

  const AGE_TRANCHES = { '4-5': [4, 5], '6-8': [6, 8], '9-12': [9, 12] };

  function filterBanque(items, f) {
    const q = (f.q || '').trim().toLowerCase();
    return items.filter(x => {
      if (f.age && AGE_TRANCHES[f.age]) {
        const [lo, hi] = AGE_TRANCHES[f.age];
        if (x.ageMin != null && x.ageMax != null && (x.ageMax < lo || x.ageMin > hi)) return false;
      }
      if (f.energie && x.energie && x.energie !== f.energie) return false;
      if (f.lieu === 'interieur' && !x.interieur) return false;
      if (f.lieu === 'exterieur' && !x.exterieur) return false;
      if (f.sansMateriel && !x.sansMateriel) return false;
      if (q && !x.titre.toLowerCase().includes(q)) return false;
      return true;
    });
  }

  // ── Horaire : trous et insertion ─────────────────────────

  const JOUR_DEBUT = '09:00', JOUR_FIN = '16:00', TROU_MIN = 15;

  function toMin(h) { const m = /^(\d{1,2})[:h](\d{2})$/.exec(h || ''); return m ? (+m[1]) * 60 + (+m[2]) : null; }
  function toHM(min) { return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0'); }

  // Trous libres de la journée (entre blocs horodatés, bornes 9h-16h)
  function trousJournee(blocs) {
    const timed = blocs.filter(b => toMin(b.debut) != null && toMin(b.fin) != null)
      .map(b => ({ d: toMin(b.debut), f: toMin(b.fin) }))
      .sort((a, b) => a.d - b.d);
    const trous = [];
    let cur = toMin(JOUR_DEBUT);
    for (const t of timed) {
      if (t.d - cur >= TROU_MIN) trous.push({ debut: toHM(cur), fin: toHM(t.d) });
      cur = Math.max(cur, t.f);
    }
    if (toMin(JOUR_FIN) - cur >= TROU_MIN) trous.push({ debut: toHM(cur), fin: JOUR_FIN });
    return trous;
  }

  // Premier trou libre ; journée vide → 09:00, pleine → après le dernier bloc
  function premierTrou(blocs) {
    const trous = trousJournee(blocs);
    if (trous.length) {
      const t = trous[0];
      const fin = Math.min(toMin(t.debut) + 45, toMin(t.fin));
      return { debut: t.debut, fin: toHM(fin) };
    }
    const fins = blocs.map(b => toMin(b.fin)).filter(v => v != null);
    const start = fins.length ? Math.max(...fins) : toMin(JOUR_DEBUT);
    return { debut: toHM(start), fin: toHM(start + 45) };
  }

  // ── Écritures (via Journees de app.js — jamais Firestore direct) ──

  // Insère un jeu comme nouveau bloc activité au créneau donné.
  async function insererJeu(jeu, creneau) {
    const bloc = {
      id: blocId(), type: 'activite', titre: jeu.titre, ref: jeu.ref,
      debut: creneau.debut, fin: creneau.fin, ordre: 0, notes: '',
    };
    const blocs = [...state.journeeBlocs, bloc];
    blocs.sort((a, b) => (toMin(a.debut) ?? 9e9) - (toMin(b.debut) ?? 9e9));
    blocs.forEach((b, i) => { b.ordre = i; });
    await Journees.update(state.journeeId, { blocs });
    state.journeeBlocs = blocs;
    return bloc.id;
  }

  // Remplit un bloc activité existant (vide) avec un jeu — garde ses heures.
  async function remplirBloc(jeu, blocIdCible) {
    const blocs = state.journeeBlocs.map(b =>
      b.id === blocIdCible ? { ...b, titre: jeu.titre, ref: jeu.ref } : b);
    await Journees.update(state.journeeId, { blocs });
    state.journeeBlocs = blocs;
    return blocIdCible;
  }

  return { loadBanque, loadBanqueCamp, filterBanque, trousJournee, premierTrou, insererJeu, remplirBloc, AGE_TRANCHES };
})();
