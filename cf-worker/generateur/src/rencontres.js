/**
 * rencontres.js — transcription audio pour /apps/rencontres/.
 *
 * CE QUE CE MODULE FAIT, ET CE QU'IL NE FAIT PAS
 *
 *   il fait      appeler Whisper sur un segment deja pret, debiter les
 *                minutes, rendre le texte.
 *   il ne fait   PAS decoder, PAS reechantillonner, PAS decouper. Tout ca vit
 *                dans le navigateur (apps/rencontres/transcription.js).
 *
 * POURQUOI LE DECOUPAGE N'EST PAS ICI. Un Worker Cloudflare est borne en TEMPS
 * PROCESSEUR, pas en temps d'attente. Le reste de ce worker n'a jamais frole
 * la limite parce qu'il ne fait qu'attendre Anthropic — de l'entree-sortie.
 * Decoder un .m4a de 60 minutes, le reechantillonner et le decouper, c'est du
 * CALCUL, et c'est la seule partie du travail que le navigateur fait mieux :
 * le fichier est deja dans sa memoire, il a un processeur qui ne facture rien,
 * et l'audio ne traverse pas le reseau deux fois. Decision du 24 aout 2026,
 * §3C du cahier v2.
 *
 * FORMAT ATTENDU. Le client envoie du WAV 16 kHz mono 16 bits, en CORPS BRUT
 * et non en base64 : un segment de 5 minutes pese 9,6 Mo tel quel et 12,8 Mo
 * une fois encode. Sur un worker borne a 128 Mo de memoire, la difference
 * n'est pas cosmetique. Les metadonnees passent donc par la query string.
 *
 * L'AUDIO N'EST JAMAIS STOCKE. Il entre, il est transcrit, il sort de la
 * memoire avec la requete. Rien n'est ecrit dans R2 ni ailleurs. Le §9.5 du
 * cahier garde « conserver l'audio 30 jours » en dette v2, non codee.
 */

import { readTranscriptionQuota, debitTranscription } from "./quota.js";

/* Modele de tete, et son repli.
   `whisper-large-v3-turbo` accepte une INDICATION DE LANGUE, ce que
   `@cf/openai/whisper` ne fait pas. Sur du francais quebecois plein de noms
   propres d'ecoles, ca change le resultat. On l'essaie d'abord ; si le compte
   ne l'a pas, on retombe sur l'autre sans que l'usager voie la difference.
   L'un prend du base64, l'autre un tableau d'octets : deux entrees, deux
   sorties, normalisees plus bas. */
const MODELE_TETE = "@cf/openai/whisper-large-v3-turbo";
const MODELE_REPLI = "@cf/openai/whisper";

/* 5 minutes de WAV 16 kHz mono 16 bits = 9 600 044 octets. On accepte 12 Mo
   pour laisser passer un segment un peu plus long sans etre une porte ouverte. */
const MAX_SEGMENT = 12 * 1024 * 1024;

/* Au-dela, on previent : c'est long, ca prendra du temps et ca mange le quota
   du jour. On ne REFUSE pas — c'est le plafond en minutes qui refuse, et lui
   seul. Un avertissement qui bloque n'est plus un avertissement. */
const SECONDES_AVERTISSEMENT = 90 * 60;

function base64(buf) {
  const octets = new Uint8Array(buf);
  let s = "";
  // Par tranches : String.fromCharCode.apply sur 9 Mo d'un coup depasse la
  // taille maximale de la pile d'appels.
  const PAS = 0x8000;
  for (let i = 0; i < octets.length; i += PAS) {
    s += String.fromCharCode.apply(null, octets.subarray(i, i + PAS));
  }
  return btoa(s);
}

/** Ramene les deux formes de reponse de Whisper a une chaine. */
function texteDe(sortie) {
  if (!sortie) return "";
  if (typeof sortie === "string") return sortie;
  if (typeof sortie.text === "string") return sortie.text;
  if (sortie.result) return texteDe(sortie.result);
  return "";
}

async function transcris(env, buf, langue) {
  if (!env.AI || typeof env.AI.run !== "function") {
    const e = new Error("Workers AI n'est pas relié à ce worker");
    e.code = "AI_ABSENT";
    throw e;
  }

  // 1 — le modele de tete, avec l'indication de langue.
  try {
    const sortie = await env.AI.run(MODELE_TETE, {
      audio: base64(buf),
      task: "transcribe",
      language: langue === "en" ? "en" : "fr",
      vad_filter: "true",
    });
    const t = texteDe(sortie);
    if (t) return { texte: t, modele: MODELE_TETE };
  } catch (e) {
    console.warn("[rencontres] modele de tete indisponible:", e?.message || e);
  }

  // 2 — le repli, qui prend un tableau d'octets.
  const sortie = await env.AI.run(MODELE_REPLI, {
    audio: [...new Uint8Array(buf)],
  });
  return { texte: texteDe(sortie), modele: MODELE_REPLI };
}

/**
 * @param {Request} request
 * @param {object} env
 * @param {(code, message, status, extra) => Response} err  fabrique d'erreur du worker
 * @param {(body, status) => Response} json                  fabrique de reponse du worker
 * @param {(request, env) => Promise<{uid}|null>} verifie    verification du jeton Firebase
 */
export async function handleRencontres(request, env, { err, json, verifie }) {
  const identite = await verifie(request, env);
  if (!identite?.uid) return err("UNAUTHORIZED", "Connexion requise", 401);
  const uid = identite.uid;

  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "devis";

  /* ── DEVIS ────────────────────────────────────────────────────────────
     Avant de lancer quoi que ce soit : combien de minutes, combien il en
     reste, et est-ce que ca tient. Le client affiche la duree detectee et
     l'etat du quota AVANT que l'usager n'appuie — exigence du §3C. */
  if (action === "devis") {
    let corps;
    try { corps = await request.json(); }
    catch { return err("INVALID_INPUT", "Body JSON malformé"); }

    const secondes = Math.max(0, Math.round(Number(corps?.secondes) || 0));
    const minutes = Math.ceil(secondes / 6) / 10;
    const q = await readTranscriptionQuota(env, uid);

    return json({
      ok: true,
      secondes,
      minutesDemandees: minutes,
      minutesRestantes: q.restant,
      plafondJour: q.max,
      suffisant: minutes <= q.restant,
      // Le client dit quoi faire de ces deux-la ; le worker ne fait que les
      // constater.
      longue: secondes > SECONDES_AVERTISSEMENT,
      seuilAvertissementSecondes: SECONDES_AVERTISSEMENT,
    });
  }

  /* ── SEGMENT ──────────────────────────────────────────────────────── */
  if (action !== "segment") return err("INVALID_INPUT", "action inconnue");

  const secondes = Math.max(0, Math.round(Number(url.searchParams.get("secondes")) || 0));
  const index = Math.max(0, Math.round(Number(url.searchParams.get("index")) || 0));
  const langue = url.searchParams.get("lang") === "en" ? "en" : "fr";

  // Le plafond est verifie AVANT l'appel : depasser puis facturer serait le
  // pire des deux mondes.
  const avant = await readTranscriptionQuota(env, uid);
  const coutMinutes = Math.ceil(secondes / 6) / 10;
  if (coutMinutes > avant.restant) {
    return err(
      "QUOTA_MINUTES",
      `Plafond quotidien atteint : ${avant.max} minutes de transcription par jour. Il en reste ${avant.restant}. Le compteur repart demain.`,
      429,
      { minutesRestantes: avant.restant, plafondJour: avant.max }
    );
  }

  const buf = await request.arrayBuffer();
  if (!buf || buf.byteLength < 1024) return err("INVALID_INPUT", "segment audio vide");
  if (buf.byteLength > MAX_SEGMENT) {
    return err("INVALID_INPUT", "segment trop lourd (découpe plus court)", 413);
  }

  let resultat;
  try {
    resultat = await transcris(env, buf, langue);
  } catch (e) {
    if (e.code === "AI_ABSENT") return err("CONFIG_MISSING", e.message, 500);
    return err("AI_ERROR", "Transcription impossible : " + (e?.message || e), 502);
  }

  // On ne debite QU'APRES un succes : un segment qui echoue ne coute rien.
  const apres = await debitTranscription(env, uid, secondes);

  return json({
    ok: true,
    index,
    texte: resultat.texte,
    modele: resultat.modele,
    minutesRestantes: apres.restant,
    plafondJour: apres.max,
  });
}
