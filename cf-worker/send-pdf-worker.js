/**
 * ZTS Send-PDF Worker — envoie le lead magnet par email via Resend
 *
 * Deploy : Cloudflare Dashboard > Workers & Pages > Create Worker
 * Route  : zonetotalsport.ca/api/send-pdf
 * Secret : RESEND_API_KEY (Settings > Variables > Add)
 *
 * Body POST attendu (JSON) :
 *   { email: "prof@ecole.ca", name: "Marie", lang: "fr", pdf: "30-cours-maternelle" }
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const PDF_BASE_URL = 'https://zonetotalsport.ca/assets/pdf';
const FROM_EMAIL = 'Zone Total Sport <noreply@zonetotalsport.ca>';

// Email templates per language
const TEMPLATES = {
  fr: {
    subject: 'Ton acces — 90 cours interactifs maternelle',
    heading: 'Ton acces est pret!',
    intro: (name) => `Salut${name ? ' ' + name : ''}! Merci de faire partie de la Zone. Voici ton acces a l'app web complete :`,
    btnText: 'Acceder a l\'app',
    footer: '90 cours interactifs cle en main pour la maternelle — par Joey, Zone Total Sport.',
    ps: 'P.S. — Garde ce courriel : le lien fonctionne sur ordi, tablette et iPhone. Partage-le a un collegue!',
  },
  en: {
    subject: 'Your access — 90 interactive kindergarten lessons',
    heading: 'Your access is ready!',
    intro: (name) => `Hi${name ? ' ' + name : ''}! Thanks for joining the Zone. Here is your access to the full web app:`,
    btnText: 'Open the app',
    footer: '90 interactive ready-to-use kindergarten lessons — by Joey, Zone Total Sport.',
    ps: 'P.S. — Save this email: the link works on desktop, tablet, and iPhone. Share with a colleague!',
  },
  es: {
    subject: 'Tu acceso — 90 clases interactivas preescolar',
    heading: 'Tu acceso esta listo!',
    intro: (name) => `Hola${name ? ' ' + name : ''}! Gracias por unirte a la Zone. Aqui tienes tu acceso a la app web:`,
    btnText: 'Abrir la app',
    footer: '90 clases interactivas listas para preescolar — por Joey, Zone Total Sport.',
    ps: 'P.S. — Guarda este correo: el enlace funciona en compu, tablet e iPhone. Comparte!',
  },
  zh: {
    subject: '你的访问 — 90节互动幼儿园课程',
    heading: '你的访问已准备好!',
    intro: (name) => `你好${name ? ' ' + name : ''}! 感谢加入Zone。这是你的网页应用访问:`,
    btnText: '打开应用',
    footer: '90节互动即用幼儿园课程 — Joey, Zone Total Sport.',
    ps: 'P.S. — 保存此邮件：链接适用于电脑、平板和iPhone。',
  },
};

const APP_URL = 'https://zonetotalsport.ca/apps/cours-maternelle/?token=DEMO2026';

function buildEmailHtml(t, pdfUrl) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#18181b,#1e1b4b);padding:40px 40px 30px;text-align:center">
  <div style="font-size:14px;color:#00E5FF;font-weight:700;letter-spacing:2px;margin-bottom:12px">ZONE TOTAL SPORT</div>
  <h1 style="margin:0;color:#fff;font-size:28px;line-height:1.2">${t.heading}</h1>
</td></tr>

<!-- Body -->
<tr><td style="padding:40px">
  <p style="font-size:16px;line-height:1.6;color:#374151;margin:0 0 24px">${t.intro}</p>

  <!-- CTA Button -->
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 32px">
    <a href="${pdfUrl}" style="display:inline-block;background:linear-gradient(135deg,#FFD700,#FFA500);color:#18181b;font-weight:800;font-size:18px;padding:16px 40px;border-radius:16px;text-decoration:none;box-shadow:0 4px 16px rgba(255,215,0,0.3)">${t.btnText}</a>
  </td></tr></table>

  <p style="font-size:14px;color:#6b7280;line-height:1.5;margin:0 0 16px">${t.footer}</p>
  <p style="font-size:13px;color:#9ca3af;line-height:1.5;margin:0;font-style:italic">${t.ps}</p>
</td></tr>

<!-- Footer -->
<tr><td style="background:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb">
  <p style="margin:0;font-size:12px;color:#9ca3af">zonetotalsport.ca</p>
</td></tr>

</table>
</td></tr></table>
</body></html>`;
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ ok: false, error: 'POST only' }), {
        status: 405, headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

    let data = {};
    try { data = await request.json(); } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

    const email = (data.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid email' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

    const name = (data.name || '').split(' ')[0].slice(0, 50);
    const lang = ['fr', 'en', 'es', 'zh'].includes(data.lang) ? data.lang : 'fr';
    const targetUrl = data.appUrl || APP_URL;

    const t = TEMPLATES[lang] || TEMPLATES.fr;
    const html = buildEmailHtml({
      heading: t.heading,
      intro: t.intro(name),
      btnText: t.btnText,
      footer: t.footer,
      ps: t.ps,
    }, targetUrl);

    // Send via Resend API
    const apiKey = env.RESEND_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing API key' }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [email],
          subject: t.subject,
          html: html,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        return new Response(JSON.stringify({ ok: false, error: result.message || 'Resend error' }), {
          status: res.status, headers: { 'Content-Type': 'application/json', ...CORS },
        });
      }

      return new Response(JSON.stringify({ ok: true, id: result.id }), {
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: 'Network error' }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }
  },
};
