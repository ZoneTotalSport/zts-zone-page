import { useState, useEffect, useRef } from "react";
import { C, Carte, BoutonCyan, champStyle, URL_API } from "./ui.jsx";
import BANQUE from "./questions-poids.json";

/* ═══════════ PERTE DE POIDS — LE DÉCLIC ÉMOTIONNEL ═══════════
   8e onglet de « Zone — Décodage du corps ». Ce n'est pas une huitième
   école de décodage : c'est un parcours transversal qui pioche dans les
   sept approches déjà présentes dans l'app.

   LA BANQUE DE QUESTIONS EST DANS questions-poids.json, pas ici.
   Ce fichier n'est que l'interface. Pour ajouter, retirer ou reformuler
   une question, ou pour changer l'ordre des 21 jours, on touche au JSON —
   jamais au code. Chaque question porte un `id` STABLE : c'est lui la clé
   de sauvegarde. Renommer un id casse les réponses déjà écrites; en
   ajouter un ne casse rien.

   GARDE-FOUS STRUCTURELS — à ne pas contourner en modifiant ce fichier :
   · ZÉRO CHIFFRE de corps. Aucun champ de poids, d'IMC, de poids cible, de
     calories, de tour de taille, de mesure. Le seul nombre du module est le
     curseur de résonance 0-10, qui mesure un ressenti, pas un corps.
   · ZÉRO PLAN ALIMENTAIRE. Aucune diète, aucun jeûne, aucune restriction,
     aucun aliment à éviter, aucun exercice prescrit — ni ici, ni dans la
     réponse de l'IA (voir SYSTEM_POIDS, côté worker).
   · AUCUN JUGEMENT CORPOREL dans les textes d'interface.
   · FILET TROUBLES ALIMENTAIRES ET VIOLENCES : encart de ressources sur
     l'accueil du module, et consignes d'arrêt dans le prompt système.
═══════════════════════════════════════════════════════════════════ */

/* Habillage par axe — la couleur et l'émoji ne sont pas des données de
   contenu, ils restent ici. Un axe inconnu retombe sur du cyan. */
const HABILLAGE = {
  temps: { emoji: "🕰️", couleur: C.cyan },
  protection: { emoji: "🛡️", couleur: C.lime },
  manque: { emoji: "🍯", couleur: C.orange },
  morceau: { emoji: "🎣", couleur: C.rose },
  territoire: { emoji: "🗺️", couleur: C.jaune },
  regard: { emoji: "👁️", couleur: C.cyan },
  identite: { emoji: "🎭", couleur: C.lime },
  loyautes: { emoji: "🌳", couleur: C.orange },
  revolte: { emoji: "⛓️", couleur: C.rose },
  benefices: { emoji: "🎁", couleur: C.jaune },
  corps: { emoji: "🫂", couleur: C.cyan },
  retention: { emoji: "🪢", couleur: C.lime },
};

export const AXES = [...BANQUE.axes]
  .sort((a, b) => (a.numero || 0) - (b.numero || 0))
  .map(a => ({ ...a, ...(HABILLAGE[a.id] || { emoji: "•", couleur: C.cyan }) }));

/* Le corpus : toutes les questions, à plat, retrouvables par id. */
export const CORPUS = AXES.flatMap(a => a.questions.map(q => ({
  ...q, axe: a.id, axeTitre: a.titre, emoji: a.emoji, couleur: a.couleur,
})));
const PAR_ID = new Map(CORPUS.map(q => [q.id, q]));

/* Le fil des 21 jours vient du JSON. Un id inconnu est ignoré plutôt que
   de faire planter l'écran — le fil est alors juste plus court. */
export const FIL_21 = (BANQUE.parcours_21_jours || [])
  .map(id => PAR_ID.get(id))
  .filter(Boolean);

/* ─────────────── PERSISTANCE ───────────────
   Même mécanisme que le reste de l'app (window.storage, shim localStorage
   préfixe ztsdeco:). Préfixe `poids:` distinct de `decodage:` pour que
   l'écran Historique, qui liste `decodage:`, ne récupère pas les
   brouillons. Les lectures IA, elles, sont écrites en `decodage:` pour
   apparaître dans l'historique commun. */
const CLE_QUESTIONNAIRE = "poids:questionnaire";
const CLE_PARCOURS = "poids:parcours";
const VERSION_STOCKAGE = 2;

/* ── Migration v1 → v2 ──
   La v1 sauvegardait sous des clés POSITIONNELLES (`axe:index`), calculées
   depuis un tableau écrit en dur dans le code. La v2 sauvegarde sous les
   `id` du JSON. Sans cette table, trois choses se seraient perdues en
   silence :
     · deux axes ont changé de nom  (douceur → manque, habite → corps);
     · l'axe `regard` a reçu une question INSÉRÉE en 2e position, donc les
       réponses 2 et 3 de la v1 glissent vers regard-3 et regard-4 — un
       décalage naïf de +1 les aurait collées sous la mauvaise question;
     · le journal des 21 jours était rangé par NUMÉRO DE JOUR, et l'ordre
       des jours a changé : rangé par id, il suit sa question. */
const MIGRATION_V1 = {
  "temps:0": "temps-1", "temps:1": "temps-2", "temps:2": "temps-3",
  "protection:0": "protection-1", "protection:1": "protection-2", "protection:2": "protection-3",
  "douceur:0": "manque-1", "douceur:1": "manque-2", "douceur:2": "manque-3",
  "morceau:0": "morceau-1", "morceau:1": "morceau-2",
  "territoire:0": "territoire-1", "territoire:1": "territoire-2",
  "regard:0": "regard-1", "regard:1": "regard-3", "regard:2": "regard-4",
  "identite:0": "identite-1", "identite:1": "identite-2",
  "loyautes:0": "loyautes-1", "loyautes:1": "loyautes-2", "loyautes:2": "loyautes-3",
  "revolte:0": "revolte-1", "revolte:1": "revolte-2", "revolte:2": "revolte-3",
  "benefices:0": "benefices-1", "benefices:1": "benefices-2", "benefices:2": "benefices-3",
  "habite:0": "corps-1", "habite:1": "corps-2", "habite:2": "corps-3",
  "retention:0": "retention-1", "retention:1": "retention-2",
};
const MIGRATION_AXES_V1 = { douceur: "manque", habite: "corps" };
/* L'ancien fil des 21 jours, dans l'ordre où il était calculé : question 1
   des 12 axes, puis question 2 des 9 premiers. */
const FIL_V1 = [
  "temps:0", "protection:0", "douceur:0", "morceau:0", "territoire:0", "regard:0",
  "identite:0", "loyautes:0", "revolte:0", "benefices:0", "habite:0", "retention:0",
  "temps:1", "protection:1", "douceur:1", "morceau:1", "territoire:1", "regard:1",
  "identite:1", "loyautes:1", "revolte:1",
];

function migrerQuestionnaire(brut) {
  if (!brut) return { reponses: {}, scores: {}, axe: 0, v: VERSION_STOCKAGE };
  if (brut.v === VERSION_STOCKAGE) {
    return { reponses: brut.reponses || {}, scores: brut.scores || {}, axe: brut.axe || 0, v: VERSION_STOCKAGE };
  }
  const reponses = {};
  for (const [cle, texte] of Object.entries(brut.reponses || {})) {
    const id = MIGRATION_V1[cle] || (PAR_ID.has(cle) ? cle : null);
    if (id) reponses[id] = texte;
  }
  const scores = {};
  for (const [axe, n] of Object.entries(brut.scores || {})) {
    scores[MIGRATION_AXES_V1[axe] || axe] = n;
  }
  return { reponses, scores, axe: 0, v: VERSION_STOCKAGE };
}

function migrerParcours(brut) {
  if (!brut) return { notes: {}, v: VERSION_STOCKAGE };
  if (brut.v === VERSION_STOCKAGE) return { notes: brut.notes || {}, v: VERSION_STOCKAGE };
  const notes = {};
  for (const [jour, texte] of Object.entries(brut.jours || {})) {
    const ancienneCle = FIL_V1[Number(jour)];
    const id = ancienneCle && MIGRATION_V1[ancienneCle];
    if (id) notes[id] = texte;
  }
  return { notes, v: VERSION_STOCKAGE };
}

async function lire(cle) {
  try {
    const r = await window.storage.get(cle);
    return r?.value ? JSON.parse(r.value) : null;
  } catch (e) { return null; }
}
async function ecrire(cle, valeur) {
  try { await window.storage.set(cle, JSON.stringify(valeur)); } catch (e) { /* best-effort */ }
}

/* Sauvegarde continue, temporisée : on écrit 500 ms après la dernière
   frappe plutôt qu'à chaque caractère. `pret` évite d'écraser le disque
   avec l'état vide avant que le chargement initial soit terminé. */
function useSauvegardeContinue(cle, valeur, pret) {
  const minuterie = useRef(null);
  useEffect(() => {
    if (!pret) return;
    clearTimeout(minuterie.current);
    minuterie.current = setTimeout(() => { ecrire(cle, valeur); }, 500);
    return () => clearTimeout(minuterie.current);
  }, [cle, valeur, pret]);
}

/* ─────────────── ENCARTS DE SÉCURITÉ ─────────────── */
function Avertissement() {
  return (
    <Carte couleur={C.jaune} style={{ background: "#FFFDF0" }}>
      <div className="zts-titre" style={{ fontSize: 18, color: C.marine, marginBottom: 6 }}>⚠️ À LIRE AVANT D'ENTRER</div>
      <p style={{ margin: "0 0 8px", lineHeight: 1.55, fontWeight: 700 }}>
        Ce module est une approche complémentaire de réflexion personnelle. Il n'a
        aucune valeur diagnostique ni thérapeutique et ne remplace pas un suivi médical.
      </p>
      <p style={{ margin: "0 0 8px", lineHeight: 1.55 }}>
        Un surpoids peut avoir des causes médicales — thyroïde, médication, syndrome
        hormonal, apnée du sommeil, entre autres. Ces causes-là relèvent d'un médecin,
        pas d'un questionnaire.
      </p>
      <p style={{ margin: 0, lineHeight: 1.55 }}>
        Ici, on ne mesure rien : pas de poids, pas de chiffres, pas de courbe. On ne
        donne ni diète, ni programme d'exercice. On explore ce que ton vécu raconte.
      </p>
    </Carte>
  );
}

function Ressources() {
  return (
    <Carte couleur={C.rose} style={{ background: "#FFF4F9" }}>
      <div className="zts-titre" style={{ fontSize: 17, color: C.rose, marginBottom: 6 }}>💗 SI ÇA DEVIENT LOURD</div>
      <p style={{ margin: "0 0 8px", lineHeight: 1.55 }}>
        Si ton rapport à la nourriture ou à ton corps te fait souffrir — restriction,
        crises, compensation, pensées qui tournent en boucle — ces gens-là sont formés
        pour ça, et c'est gratuit :
      </p>
      <p style={{ margin: "4px 0", fontWeight: 800 }}>
        📞 ANEB Québec — 1&nbsp;800&nbsp;630-0907<br />
        <span style={{ fontWeight: 600, fontSize: 14 }}>Ligne d'écoute troubles alimentaires, 7 jours sur 7 · anebquebec.com</span>
      </p>
      <p style={{ margin: "4px 0", fontWeight: 800 }}>
        📞 Info-Social — 811, option 2<br />
        <span style={{ fontWeight: 600, fontSize: 14 }}>Intervenant psychosocial, 24 h sur 24</span>
      </p>
      <p style={{ margin: "4px 0", fontWeight: 800 }}>
        📞 Prévention du suicide — 988<br />
        <span style={{ fontWeight: 600, fontSize: 14 }}>Appel ou texto, gratuit, 24 h sur 24</span>
      </p>
      <p style={{ margin: "4px 0", fontWeight: 800 }}>
        📞 SOS violence conjugale — 1&nbsp;800&nbsp;363-9010<br />
        <span style={{ fontWeight: 600, fontSize: 14 }}>24 h sur 24 · et 1 888 933-9007 pour les agressions sexuelles</span>
      </p>
      <p style={{ margin: "8px 0 0", lineHeight: 1.5, fontSize: 14 }}>
        Pour l'alimentation elle-même : une nutritionniste (Ordre des diététistes-nutritionnistes
        du Québec) ou ton médecin.
      </p>
    </Carte>
  );
}

/* ─────────────── TITRE D'ÉCRAN ─────────────── */
function Titre({ children, taille = 26 }) {
  return (
    <div className="zts-titre" style={{
      fontSize: taille, color: C.blanc, textShadow: "2px 2px 0 #000",
      margin: "4px 0 12px", textAlign: "center", lineHeight: 1.15,
    }}>{children}</div>
  );
}

/* ─────────────── ACCUEIL DU MODULE ─────────────── */
function AccueilPoids({ aller, avancement }) {
  const { axesRepondus, notesDeposees } = avancement;
  return (
    <div>
      <div style={{ textAlign: "center", padding: "10px 6px 14px" }}>
        <div style={{ fontSize: 44 }}>⚖️</div>
        <div className="zts-titre" style={{ fontSize: 30, color: C.blanc, textShadow: `3px 3px 0 ${C.marineFonce}`, lineHeight: 1.15 }}>
          LE DÉCLIC<br />ÉMOTIONNEL
        </div>
        <p style={{ margin: "10px auto 0", maxWidth: 440, fontSize: 15.5, color: "#dff4ff", fontWeight: 600, lineHeight: 1.5 }}>
          Un parcours de questions sur ce que le poids protège, remplace ou retient.
          Il traverse les approches déjà dans l'app — il n'en ajoute pas une huitième.
        </p>
      </div>

      <Avertissement />

      <Carte couleur={C.cyan} style={{ cursor: "pointer" }}>
        <div onClick={() => aller("questionnaire")}>
          <div className="zts-titre" style={{ fontSize: 20, color: C.marine }}>🧭 LE QUESTIONNAIRE DU DÉCLIC</div>
          <p style={{ margin: "6px 0 0", lineHeight: 1.5 }}>
            {CORPUS.length} questions sur {AXES.length} axes, un écran à la fois. Tu peux
            sortir quand tu veux : tes réponses restent là où tu les as laissées.
          </p>
          {axesRepondus > 0 && (
            <p style={{ margin: "8px 0 0", fontWeight: 800, color: "#0a7fa0", fontSize: 14 }}>
              ↩︎ Reprendre — {axesRepondus} axe{axesRepondus > 1 ? "s" : ""} déjà entamé{axesRepondus > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </Carte>

      <Carte couleur={C.lime} style={{ cursor: "pointer" }}>
        <div onClick={() => aller("parcours")}>
          <div className="zts-titre" style={{ fontSize: 20, color: C.marine }}>📅 UNE QUESTION PAR JOUR</div>
          <p style={{ margin: "6px 0 0", lineHeight: 1.5 }}>
            Une seule question tirée du corpus, et de la place pour écrire. Vingt et un
            jours, sans série à ne pas briser : juste un fil.
          </p>
          {notesDeposees > 0 && (
            <p style={{ margin: "8px 0 0", fontWeight: 800, color: "#4a7a00", fontSize: 14 }}>
              ↩︎ Reprendre — {notesDeposees} note{notesDeposees > 1 ? "s" : ""} déposée{notesDeposees > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </Carte>

      {axesRepondus > 0 && (
        <Carte couleur={C.orange} style={{ cursor: "pointer" }}>
          <div onClick={() => aller("synthese")}>
            <div className="zts-titre" style={{ fontSize: 20, color: C.marine }}>🔎 CE QUI RESSORT</div>
            <p style={{ margin: "6px 0 0", lineHeight: 1.5 }}>
              La synthèse de ce que tu as déjà écrit, et la lecture croisée par les
              sept approches si tu la demandes.
            </p>
          </div>
        </Carte>
      )}

      <Ressources />
    </div>
  );
}

/* ─────────────── LE QUESTIONNAIRE ─────────────── */
function Curseur({ valeur, onChange, couleur }) {
  const etiquettes = ["pas du tout", "un peu", "moyennement", "pas mal", "beaucoup", "énormément"];
  const mot = etiquettes[Math.min(etiquettes.length - 1, Math.round(valeur / 2))];
  return (
    <div style={{ marginTop: 4 }}>
      <label htmlFor="resonance" style={{ display: "block", fontWeight: 800, color: C.marine, marginBottom: 6 }}>
        À quel point ça résonne ?
      </label>
      <input
        id="resonance" type="range" min={0} max={10} step={1} value={valeur}
        onChange={e => onChange(Number(e.target.value))}
        aria-valuetext={`${valeur} sur 10 — ${mot}`}
        style={{ width: "100%", accentColor: couleur, height: 32, cursor: "pointer" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 13.5, color: "#5b7396" }}>
        <span>0</span>
        <span style={{ color: C.marine, fontWeight: 800 }}>{valeur} — {mot}</span>
        <span>10</span>
      </div>
    </div>
  );
}

function Questionnaire({ etat, setEtat, aller }) {
  const [i, setI] = useState(() => Math.min(etat.axe || 0, AXES.length - 1));
  const hautRef = useRef(null);
  const axe = AXES[i];

  useEffect(() => { hautRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [i]);
  useEffect(() => { setEtat(e => ({ ...e, axe: i })); }, [i]);

  const majReponse = (id, texte) => setEtat(e => ({ ...e, reponses: { ...e.reponses, [id]: texte } }));
  const majScore = (n) => setEtat(e => ({ ...e, scores: { ...e.scores, [axe.id]: n } }));

  const score = etat.scores[axe.id] ?? 0;
  const dernier = i === AXES.length - 1;

  return (
    <div>
      <div ref={hautRef} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, height: 10, background: "rgba(255,255,255,.18)", borderRadius: 999, overflow: "hidden", border: `2px solid ${C.marineFonce}` }}>
          <div style={{ width: `${((i + 1) / AXES.length) * 100}%`, height: "100%", background: axe.couleur, transition: "width .25s" }} />
        </div>
        <span style={{ color: "#dff4ff", fontWeight: 800, fontSize: 13, whiteSpace: "nowrap" }}>Axe {i + 1} / {AXES.length}</span>
      </div>

      <Carte couleur={axe.couleur}>
        <div className="zts-titre" style={{ fontSize: 21, color: C.marine, marginBottom: 4 }}>
          {axe.emoji} {axe.titre.toUpperCase()}
        </div>
        <p style={{ margin: "0 0 14px", fontSize: 14.5, fontWeight: 700, color: "#5b7396", lineHeight: 1.45 }}>{axe.cadrage}</p>

        {axe.questions.map(q => (
          <div key={q.id} style={{ marginBottom: 14 }}>
            <label htmlFor={`q-${q.id}`} style={{ display: "block", fontWeight: 800, color: C.marine, marginBottom: q.aide ? 2 : 6, lineHeight: 1.4 }}>{q.texte}</label>
            {q.aide && (
              <p style={{ margin: "0 0 6px", fontSize: 13.5, fontWeight: 600, color: "#5b7396", lineHeight: 1.4 }}>{q.aide}</p>
            )}
            <textarea
              id={`q-${q.id}`} rows={3} value={etat.reponses[q.id] || ""}
              onChange={e => majReponse(q.id, e.target.value)}
              placeholder="Dans tes mots, sans te censurer…"
              style={champStyle}
            />
          </div>
        ))}

        <div style={{ borderTop: `2px dashed ${axe.couleur}`, paddingTop: 12, marginTop: 4 }}>
          <Curseur valeur={score} onChange={majScore} couleur={axe.couleur} />
        </div>
      </Carte>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <BoutonCyan onClick={() => setI(n => Math.max(0, n - 1))} disabled={i === 0}
          style={{ flex: "1 1 45%", fontSize: 15, background: i === 0 ? "#9fd7e8" : C.cyan, cursor: i === 0 ? "default" : "pointer" }}>
          ← PRÉCÉDENT
        </BoutonCyan>
        {dernier ? (
          <BoutonCyan onClick={() => aller("synthese")} style={{ flex: "1 1 45%", fontSize: 15, background: C.lime }}>
            VOIR CE QUI RESSORT →
          </BoutonCyan>
        ) : (
          <BoutonCyan onClick={() => setI(n => Math.min(AXES.length - 1, n + 1))} style={{ flex: "1 1 45%", fontSize: 15 }}>
            SUIVANT →
          </BoutonCyan>
        )}
        <BoutonCyan onClick={() => aller("accueil")} style={{ flex: "1 1 100%", fontSize: 14, background: C.orange }}>
          ENREGISTRER ET SORTIR
        </BoutonCyan>
      </div>
      <p style={{ color: "#bfe9ff", fontWeight: 700, fontSize: 13, textAlign: "center", margin: "0 0 12px" }}>
        Tout est enregistré au fur et à mesure. Sortir ne perd rien.
      </p>
    </div>
  );
}

/* ─────────────── SYNTHÈSE ─────────────── */
function ecrits(etat, axe) {
  return axe.questions
    .map(q => ({ q: q.texte, r: (etat.reponses[q.id] || "").trim() }))
    .filter(x => x.r);
}

function classement(etat) {
  return AXES
    .map((a, rang) => ({
      axe: a,
      score: etat.scores[a.id] ?? 0,
      mots: ecrits(etat, a).reduce((n, x) => n + x.r.length, 0),
      rang,
    }))
    .sort((x, y) => (y.score - x.score) || (y.mots - x.mots) || (x.rang - y.rang));
}

function Synthese({ etat, aller }) {
  const range = classement(etat);
  const touche = range.filter(x => x.score > 0 || x.mots > 0);
  const trois = range.filter(x => x.score > 0).slice(0, 3);
  const parEcrit = range.filter(x => x.mots > 0).slice(0, 3);
  const retenus = trois.length ? trois : parEcrit;

  if (!touche.length) {
    return (
      <div>
        <Titre>🔎 CE QUI RESSORT</Titre>
        <Carte couleur={C.cyan}>
          <p style={{ margin: 0, lineHeight: 1.55 }}>
            Rien n'est encore écrit. Fais un tour du questionnaire, même partiel — la
            synthèse se construit à partir de ce que tu déposes, pas de ce que l'app suppose.
          </p>
        </Carte>
        <BoutonCyan onClick={() => aller("questionnaire")} style={{ width: "100%" }}>ALLER AU QUESTIONNAIRE</BoutonCyan>
      </div>
    );
  }

  return (
    <div>
      <Titre>🔎 CE QUI RESSORT</Titre>

      <Carte couleur={C.cyan}>
        <p style={{ margin: 0, lineHeight: 1.55, fontWeight: 700 }}>
          Ce ne sont pas des conclusions, et surtout pas un verdict. Ce sont les endroits
          où ça a bougé le plus fort quand tu as répondu. Des questions à continuer de porter.
        </p>
        {!trois.length && (
          <p style={{ margin: "8px 0 0", lineHeight: 1.5, fontSize: 14, color: "#5b7396", fontWeight: 700 }}>
            Tu n'as pas encore bougé les curseurs de résonance : voici plutôt les axes
            où tu as le plus écrit.
          </p>
        )}
      </Carte>

      {retenus.map((x, k) => {
        const rep = ecrits(etat, x.axe);
        return (
          <Carte key={x.axe.id} couleur={x.axe.couleur}>
            <div className="zts-titre" style={{ fontSize: 19, color: C.marine, marginBottom: 6 }}>
              {["①", "②", "③"][k]} {x.axe.emoji} {x.axe.titre.toUpperCase()}
            </div>
            <p style={{ margin: "0 0 10px", lineHeight: 1.55, fontWeight: 700 }}>
              Ce qui ressort le plus fort chez toi, c'est {x.axe.titre.toLowerCase()}
              {x.score > 0 ? ` (résonance ${x.score}/10)` : ""}. Voici les questions à continuer de porter.
            </p>
            {x.axe.questions.map(q => (
              <p key={q.id} style={{ margin: "6px 0", lineHeight: 1.5 }}>
                <b style={{ color: "#d68500" }}>·</b> {q.texte}
              </p>
            ))}
            {rep.length > 0 && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: `2px dashed ${x.axe.couleur}` }}>
                <div style={{ fontWeight: 800, color: "#5b7396", fontSize: 13.5, marginBottom: 4 }}>CE QUE TU AS ÉCRIT</div>
                {rep.map((r, j) => (
                  <p key={j} style={{ margin: "4px 0", lineHeight: 1.5, fontSize: 14.5, fontStyle: "italic" }}>« {r.r} »</p>
                ))}
              </div>
            )}
          </Carte>
        );
      })}

      <BoutonCyan onClick={() => aller("ia")} style={{ width: "100%", background: C.lime, marginBottom: 10 }}>
        🔍 LECTURE CROISÉE PAR LES 7 APPROCHES
      </BoutonCyan>
      <BoutonCyan onClick={() => aller("questionnaire")} style={{ width: "100%", background: C.orange, fontSize: 15, marginBottom: 16 }}>
        RETOURNER AU QUESTIONNAIRE
      </BoutonCyan>
    </div>
  );
}

/* ─────────────── LECTURE CROISÉE PAR L'IA ─────────────── */
function messagePoids(etat) {
  const range = classement(etat);
  const lignes = ["Parcours « perte de poids — le déclic émotionnel ». Voici mes réponses, axe par axe.\n"];
  for (const a of AXES) {
    const rep = ecrits(etat, a);
    const score = etat.scores[a.id] ?? 0;
    if (!rep.length && !score) continue;
    lignes.push(`\n## ${a.titre} — résonance ${score}/10`);
    for (const r of rep) lignes.push(`Q : ${r.q}\nR : ${r.r}`);
  }
  const forts = range.filter(x => x.score > 0).slice(0, 3).map(x => x.axe.titre);
  if (forts.length) lignes.push(`\nLes axes qui résonnent le plus fort chez moi : ${forts.join(", ")}.`);
  return lignes.join("\n");
}

function LectureIA({ etat, aller }) {
  const [chargement, setChargement] = useState(false);
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState(null);
  const hautRef = useRef(null);

  useEffect(() => { hautRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [resultat, chargement]);

  const demander = async () => {
    if (chargement) return;
    setChargement(true); setErreur(null);
    const contenu = messagePoids(etat);
    let ok = false;
    for (let essai = 0; essai < 2 && !ok; essai++) {
      try {
        const res = await fetch(URL_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "poids", max_tokens: 8000, messages: [{ role: "user", content: contenu }] }),
        });
        const data = await res.json();
        const brut = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
        const debut = brut.indexOf("{"), fin = brut.lastIndexOf("}");
        if (debut === -1 || fin === -1) throw new Error("pas de JSON");
        const json = JSON.parse(brut.slice(debut, fin + 1));
        setResultat(json);
        /* Écrit dans l'historique commun de l'app (préfixe decodage:), au même
           format que les sessions de décodage — un seul système d'historique. */
        const id = Date.now();
        await ecrire(`decodage:${id}`, {
          id, date: new Date().toISOString(),
          symptome: "Parcours poids — le déclic émotionnel",
          echanges: [{ quand: new Date().toISOString(), demande: "Lecture croisée du parcours", interpelle: [], resultat: json }],
        });
        ok = true;
      } catch (e) {
        if (essai === 1) setErreur("La lecture n'a pas abouti — réessaie.");
      }
    }
    setChargement(false);
  };

  if (chargement) {
    return (
      <div style={{ textAlign: "center", paddingTop: 60 }}>
        <div style={{ fontSize: 50 }}>⚖️</div>
        <div className="zts-titre" style={{ fontSize: 24, color: C.jaune, textShadow: "2px 2px 0 #000" }}>JE RELIS TES RÉPONSES…</div>
        <p style={{ color: "#bfe9ff", fontWeight: 700 }}>Les sept approches se penchent sur ce que tu as écrit ✍️</p>
      </div>
    );
  }

  if (!resultat) {
    return (
      <div>
        <Titre>🔍 LECTURE CROISÉE</Titre>
        <Carte couleur={C.cyan}>
          <p style={{ margin: "0 0 10px", lineHeight: 1.55 }}>
            Tes réponses et tes résonances vont être relues par les approches déjà dans
            l'app : Hamer et Sabbah pour le conflit biologique, Martel et Rainville pour
            l'émotionnel, la médecine chinoise pour la rate-estomac et l'humidité,
            Dr&nbsp;Sebi pour le terrain.
          </p>
          <p style={{ margin: "0 0 10px", lineHeight: 1.55, fontWeight: 700 }}>
            Tout sera formulé en hypothèses, et ça se terminera par trois questions —
            pas par des conseils. Aucune recommandation alimentaire ou sportive ne sera
            donnée ici.
          </p>
          <BoutonCyan onClick={demander} style={{ width: "100%" }}>DEMANDER LA LECTURE</BoutonCyan>
          {erreur && <p style={{ color: C.rose, fontWeight: 700, marginTop: 8 }}>{erreur}</p>}
        </Carte>
        <BoutonCyan onClick={() => aller("synthese")} style={{ width: "100%", background: C.orange, fontSize: 15, marginBottom: 16 }}>
          RETOUR À LA SYNTHÈSE
        </BoutonCyan>
      </div>
    );
  }

  /* Filet de sécurité : quand l'IA nomme une détresse, un comportement
     alimentaire à risque ou des violences subies, elle arrête le décodage.
     On n'affiche alors que son message et les ressources — pas de lecture,
     pas de pistes. */
  if (resultat.alerte) {
    return (
      <div>
        <div ref={hautRef} />
        <Titre taille={22}>💗 ON S'ARRÊTE ICI</Titre>
        <Carte couleur={C.rose} style={{ background: "#FFF4F9" }}>
          <p style={{ margin: 0, lineHeight: 1.6, fontWeight: 700, fontSize: 16 }}>{resultat.alerte}</p>
        </Carte>
        <Ressources />
        <BoutonCyan onClick={() => aller("accueil")} style={{ width: "100%", background: C.orange, fontSize: 15 }}>
          RETOUR AU MODULE
        </BoutonCyan>
      </div>
    );
  }

  return (
    <div>
      <div ref={hautRef} />
      <Titre>🔍 LECTURE CROISÉE</Titre>

      {resultat.intro && (
        <Carte couleur={C.cyan}><p style={{ margin: 0, fontWeight: 700, lineHeight: 1.55 }}>{resultat.intro}</p></Carte>
      )}

      {resultat.lectures?.map((l, i) => (
        <Carte key={i} couleur={[C.cyan, C.lime, C.rose, C.orange, C.jaune][i % 5]}>
          <div className="zts-titre" style={{ fontSize: 17, color: C.marine, marginBottom: 4 }}>{l.emoji} {l.approche?.toUpperCase()}</div>
          <p style={{ margin: 0, lineHeight: 1.55 }}>{l.texte}</p>
        </Carte>
      ))}

      {resultat.pistes?.length > 0 && (
        <Carte couleur={C.lime}>
          <div className="zts-titre" style={{ fontSize: 18, color: C.marine, marginBottom: 6 }}>🧵 LES FILS À TIRER</div>
          {resultat.pistes.map((p, i) => (
            <p key={i} style={{ margin: "6px 0", lineHeight: 1.5 }}><b style={{ color: "#4a7a00" }}>·</b> {p}</p>
          ))}
        </Carte>
      )}

      {resultat.questions?.length > 0 && (
        <Carte couleur={C.jaune}>
          <div className="zts-titre" style={{ fontSize: 18, color: C.marine, marginBottom: 6 }}>💭 LES TROIS QUESTIONS À PORTER</div>
          {resultat.questions.map((q, i) => (
            <p key={i} style={{ margin: "6px 0", lineHeight: 1.5 }}><b style={{ color: "#d68500" }}>{i + 1}.</b> {q}</p>
          ))}
        </Carte>
      )}

      <BoutonCyan onClick={() => aller("parcours")} style={{ width: "100%", background: C.lime, marginBottom: 10 }}>
        📅 CONTINUER AVEC UNE QUESTION PAR JOUR
      </BoutonCyan>
      <BoutonCyan onClick={() => aller("accueil")} style={{ width: "100%", background: C.orange, fontSize: 15, marginBottom: 16 }}>
        RETOUR AU MODULE
      </BoutonCyan>
    </div>
  );
}

/* ─────────────── LE FIL DES 21 JOURS ─────────────── */
function Parcours({ etat, setEtat, aller }) {
  const premierVide = FIL_21.findIndex(q => !(etat.notes[q.id] || "").trim());
  const [jour, setJour] = useState(() => (premierVide === -1 ? 0 : premierVide));
  const [liste, setListe] = useState(false);
  const q = FIL_21[jour];
  const deposees = FIL_21.filter(x => (etat.notes[x.id] || "").trim()).length;
  /* Le fil vient du JSON et peut changer. Une note écrite sur une question
     sortie du fil reste en mémoire : on la ressort ici plutôt que de la
     laisser injoignable. */
  const dansLeFil = new Set(FIL_21.map(x => x.id));
  const horsFil = Object.entries(etat.notes)
    .filter(([id, texte]) => texte.trim() && !dansLeFil.has(id) && PAR_ID.has(id))
    .map(([id, texte]) => ({ q: PAR_ID.get(id), texte }));

  const majNote = (texte) => setEtat(e => ({ ...e, notes: { ...e.notes, [q.id]: texte } }));

  if (!q) {
    return (
      <div>
        <Titre taille={24}>📅 UNE QUESTION PAR JOUR</Titre>
        <Carte couleur={C.cyan}><p style={{ margin: 0 }}>Le fil des 21 jours est vide — vérifie `parcours_21_jours` dans questions-poids.json.</p></Carte>
        <BoutonCyan onClick={() => aller("accueil")} style={{ width: "100%", background: C.orange }}>RETOUR AU MODULE</BoutonCyan>
      </div>
    );
  }

  return (
    <div>
      <Titre taille={24}>📅 UNE QUESTION PAR JOUR</Titre>

      <p style={{ color: "#bfe9ff", fontWeight: 700, fontSize: 13.5, textAlign: "center", margin: "0 0 12px", lineHeight: 1.5 }}>
        {deposees === 0
          ? `${FIL_21.length} questions, une par jour. Aucun compte à tenir, aucune série à ne pas briser.`
          : `${deposees} note${deposees > 1 ? "s" : ""} déposée${deposees > 1 ? "s" : ""}. Reprends quand ça te convient — sauter un jour ne casse rien.`}
      </p>

      <Carte couleur={q.couleur}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
          <div className="zts-titre" style={{ fontSize: 19, color: C.marine }}>JOUR {jour + 1}</div>
          <span style={{ fontWeight: 800, fontSize: 13, color: "#5b7396" }}>{q.emoji} {q.axeTitre}</span>
        </div>
        <label htmlFor="journal" style={{ display: "block", fontWeight: 800, color: C.marine, marginBottom: q.aide ? 2 : 10, lineHeight: 1.45, fontSize: 16 }}>
          {q.texte}
        </label>
        {q.aide && (
          <p style={{ margin: "0 0 10px", fontSize: 13.5, fontWeight: 600, color: "#5b7396", lineHeight: 1.4 }}>{q.aide}</p>
        )}
        <textarea id="journal" rows={6} value={etat.notes[q.id] || ""} onChange={e => majNote(e.target.value)}
          placeholder="Ton journal du jour — personne d'autre ne le lit." style={champStyle} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          <BoutonCyan onClick={() => setJour(n => Math.max(0, n - 1))} disabled={jour === 0}
            style={{ flex: "1 1 45%", fontSize: 14, background: jour === 0 ? "#9fd7e8" : C.cyan, cursor: jour === 0 ? "default" : "pointer" }}>
            {jour === 0 ? "← PREMIER JOUR" : `← JOUR ${jour}`}
          </BoutonCyan>
          <BoutonCyan onClick={() => setJour(n => Math.min(FIL_21.length - 1, n + 1))} disabled={jour === FIL_21.length - 1}
            style={{ flex: "1 1 45%", fontSize: 14, background: jour === FIL_21.length - 1 ? "#9fd7e8" : C.cyan, cursor: jour === FIL_21.length - 1 ? "default" : "pointer" }}>
            {jour === FIL_21.length - 1 ? "DERNIER JOUR →" : `JOUR ${jour + 2} →`}
          </BoutonCyan>
        </div>
      </Carte>

      <BoutonCyan onClick={() => setListe(v => !v)} style={{ width: "100%", fontSize: 15, background: C.jaune, marginBottom: 12 }}>
        {liste ? "MASQUER LE FIL" : "VOIR TOUT LE FIL"}
      </BoutonCyan>

      {liste && (
        <Carte couleur={C.cyan}>
          {FIL_21.map((x, i) => {
            const ecrit = (etat.notes[x.id] || "").trim();
            return (
              <div key={x.id} onClick={() => { setJour(i); setListe(false); }}
                style={{
                  padding: "8px 6px", cursor: "pointer", borderBottom: i < FIL_21.length - 1 ? "2px dashed #dceef6" : "none",
                  background: i === jour ? "#FFFDE0" : "transparent",
                }}>
                <div style={{ fontWeight: 800, color: C.marine, fontSize: 14 }}>
                  {ecrit ? "🖊️" : "○"} Jour {i + 1} · {x.emoji} {x.axeTitre}
                </div>
                <div style={{ fontSize: 13.5, color: "#5b7396", fontWeight: 600, lineHeight: 1.4 }}>{x.texte}</div>
              </div>
            );
          })}
        </Carte>
      )}

      {horsFil.length > 0 && (
        <Carte couleur={C.orange}>
          <div className="zts-titre" style={{ fontSize: 17, color: C.marine, marginBottom: 4 }}>🗒️ GARDÉ HORS DU FIL</div>
          <p style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "#5b7396", lineHeight: 1.45 }}>
            Des notes écrites sur des questions qui ne sont plus dans le fil des
            {" "}{FIL_21.length} jours. Rien n'est effacé — elles sont juste ici.
          </p>
          {horsFil.map(({ q, texte }) => (
            <div key={q.id} style={{ marginBottom: 10, paddingLeft: 10, borderLeft: `4px solid ${q.couleur}` }}>
              <div style={{ fontWeight: 800, color: C.marine, fontSize: 14, lineHeight: 1.4 }}>{q.emoji} {q.texte}</div>
              <p style={{ margin: "4px 0 0", lineHeight: 1.5, fontSize: 14.5, fontStyle: "italic" }}>« {texte} »</p>
            </div>
          ))}
        </Carte>
      )}

      <BoutonCyan onClick={() => aller("accueil")} style={{ width: "100%", background: C.orange, fontSize: 15, marginBottom: 16 }}>
        RETOUR AU MODULE
      </BoutonCyan>
    </div>
  );
}

/* ─────────────── COMPOSANT PRINCIPAL DU MODULE ─────────────── */
export default function PerteDePoids() {
  const [vue, setVue] = useState("accueil");
  const [pret, setPret] = useState(false);
  const [questionnaire, setQuestionnaire] = useState({ reponses: {}, scores: {}, axe: 0, v: VERSION_STOCKAGE });
  const [parcours, setParcours] = useState({ notes: {}, v: VERSION_STOCKAGE });

  useEffect(() => {
    (async () => {
      setQuestionnaire(migrerQuestionnaire(await lire(CLE_QUESTIONNAIRE)));
      setParcours(migrerParcours(await lire(CLE_PARCOURS)));
      setPret(true);
    })();
  }, []);

  useSauvegardeContinue(CLE_QUESTIONNAIRE, questionnaire, pret);
  useSauvegardeContinue(CLE_PARCOURS, parcours, pret);

  if (!pret) {
    return <p style={{ color: "#bfe9ff", fontWeight: 700, textAlign: "center", paddingTop: 30 }}>Chargement…</p>;
  }

  const avancement = {
    axesRepondus: AXES.filter(a => ecrits(questionnaire, a).length || (questionnaire.scores[a.id] ?? 0) > 0).length,
    notesDeposees: Object.values(parcours.notes).filter(t => (t || "").trim()).length,
  };

  return (
    <div>
      {vue === "accueil" && <AccueilPoids aller={setVue} avancement={avancement} />}
      {vue === "questionnaire" && <Questionnaire etat={questionnaire} setEtat={setQuestionnaire} aller={setVue} />}
      {vue === "synthese" && <Synthese etat={questionnaire} aller={setVue} />}
      {vue === "ia" && <LectureIA etat={questionnaire} aller={setVue} />}
      {vue === "parcours" && <Parcours etat={parcours} setEtat={setParcours} aller={setVue} />}
    </div>
  );
}
