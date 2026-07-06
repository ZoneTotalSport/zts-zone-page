/**
 * ZTS Notify-Coordo Worker
 * ────────────────────────
 * Quand un animateur VALIDE un plan de semaine dans le moteur Planificateur,
 * le client appelle ce worker pour envoyer un courriel au coordonnateur de l'org.
 *
 * Sécurité (anti-spam) :
 *  - L'appelant DOIT présenter un Firebase ID token valide (Authorization: Bearer).
 *  - Le destinataire (courriel du coordo) n'est PAS fourni par le client : il est
 *    résolu CÔTÉ SERVEUR en lisant le doc `organisations/{orgId}` via l'API REST
 *    Firestore AVEC LE TOKEN DE L'APPELANT. Les règles Firestore garantissent que
 *    seul un membre autorisé de l'org peut lire ce doc → impossible d'envoyer un
 *    courriel à une adresse arbitraire.
 *
 * Body POST (JSON) : { orgId, weekStart, groupeNom?, link? }
 * Réponse : { ok:true, sent:"coordo@…" } | { error, code }
 *
 * Secrets/vars :
 *  - RESEND_API_KEY        (secret)  clé Resend
 *  - FIREBASE_PROJECT_ID   (var)     "zone-total-sport"
 *  - ALLOWED_ORIGINS       (var)     liste CSV d'origines autorisées (CORS)
 */

import { verifyIdToken, extractBearer } from "./auth.js";

const FROM_EMAIL = "Zone Total Sport <noreply@zonetotalsport.ca>";

function corsHeaders(origin, env) {
  const allowed = (env.ALLOWED_ORIGINS || "")
    .split(",").map(s => s.trim()).filter(Boolean);
  const ok = origin && (allowed.length === 0 || allowed.includes(origin));
  return {
    "Access-Control-Allow-Origin": ok ? origin : (allowed[0] || "https://zonetotalsport.ca"),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  };
}

function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json", ...cors },
  });
}

/** Lit organisations/{orgId} via Firestore REST avec le token de l'appelant. */
async function readOrg(orgId, idToken, projectId) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/organisations/${encodeURIComponent(orgId)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` } });
  if (res.status === 403) return { error: "forbidden" };
  if (res.status === 404) return { error: "not_found" };
  if (!res.ok) return { error: "firestore_" + res.status };
  const doc = await res.json();
  const f = doc.fields || {};
  return {
    coordoEmail: f.coordoEmail?.stringValue || "",
    nom: f.nom?.stringValue || "",
  };
}

function esc(s) {
  return String(s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function buildHtml({ orgNom, groupeNom, weekStart, animateurEmail, link }) {
  const semaine = esc(weekStart || "");
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#19C3FF;font-family:system-ui,Segoe UI,sans-serif;color:#0a0a0a">
  <div style="max-width:520px;margin:0 auto;padding:28px 18px">
    <div style="background:#fff;border:4px solid #0a0a0a;border-radius:22px;box-shadow:8px 8px 0 #0a0a0a;padding:26px 22px">
      <h1 style="margin:0 0 6px;font-size:26px;color:#0a0a0a">✅ Un plan est prêt</h1>
      <p style="font-size:17px;line-height:1.5;margin:14px 0">
        ${groupeNom ? `Le groupe <b>${esc(groupeNom)}</b> a` : "Un animateur a"} validé sa
        <b>planification de la semaine du ${semaine}</b>${orgNom ? ` (${esc(orgNom)})` : ""}.
      </p>
      ${animateurEmail ? `<p style="font-size:14px;color:#555;margin:0 0 18px">Validé par ${esc(animateurEmail)}</p>` : ""}
      ${link ? `<p style="margin:22px 0 6px"><a href="${esc(link)}" style="display:inline-block;background:#F2FF00;color:#0a0a0a;font-weight:800;text-decoration:none;padding:13px 22px;border:3px solid #0a0a0a;border-radius:14px;box-shadow:4px 4px 0 #0a0a0a">Voir le plan →</a></p>` : ""}
      <p style="font-size:13px;color:#888;margin:22px 0 0">Zone Total Sport — notification automatique</p>
    </div>
  </div>
</body></html>`;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin, env);

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405, cors);

    // 1) Authentification obligatoire.
    const verified = await verifyIdToken(request, env);
    if (!verified) return json({ error: "Authentification requise", code: "UNAUTHENTICATED" }, 401, cors);
    const idToken = extractBearer(request);

    // 2) Body.
    let body;
    try { body = await request.json(); }
    catch { return json({ error: "JSON invalide", code: "BAD_JSON" }, 400, cors); }
    const { orgId, weekStart, groupeNom, link } = body || {};
    if (!orgId) return json({ error: "orgId manquant", code: "MISSING_ORG" }, 400, cors);

    // 3) Résolution serveur du courriel coordo (token de l'appelant → règles Firestore).
    const org = await readOrg(orgId, idToken, env.FIREBASE_PROJECT_ID);
    if (org.error === "forbidden") return json({ error: "Accès refusé à cette organisation", code: "FORBIDDEN" }, 403, cors);
    if (org.error === "not_found") return json({ error: "Organisation introuvable", code: "ORG_NOT_FOUND" }, 404, cors);
    if (org.error) return json({ error: "Lecture Firestore échouée", code: org.error.toUpperCase() }, 502, cors);
    if (!org.coordoEmail || !org.coordoEmail.includes("@")) {
      return json({ error: "Aucun courriel de coordonnateur sur cette org", code: "NO_COORDO_EMAIL" }, 422, cors);
    }

    // 4) Envoi Resend.
    const apiKey = env.RESEND_API_KEY;
    if (!apiKey) return json({ error: "RESEND_API_KEY manquante", code: "CONFIG_MISSING" }, 500, cors);

    const html = buildHtml({
      orgNom: org.nom, groupeNom, weekStart,
      animateurEmail: verified.email, link,
    });
    const subject = `✅ Plan prêt — ${groupeNom ? groupeNom + " · " : ""}semaine du ${weekStart || ""}`;

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: org.coordoEmail,
          reply_to: verified.email || undefined,
          subject,
          html,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        console.error("[notify-coordo] Resend échec", res.status, txt);
        return json({ error: "Envoi courriel échoué", code: "RESEND_" + res.status }, 502, cors);
      }
    } catch (e) {
      console.error("[notify-coordo] Resend exception", e?.message || e);
      return json({ error: "Envoi courriel échoué", code: "RESEND_EXCEPTION" }, 502, cors);
    }

    return json({ ok: true, sent: org.coordoEmail }, 200, cors);
  },
};
