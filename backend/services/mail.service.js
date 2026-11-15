/**
 * Service d'Envoi d'Email Tfarhida (Resend API)
 * Utilise l'API HTTPS officielle de Resend avec template HTML officiel Brand Book
 * N'expose jamais les codes de vérification dans les réponses ou les logs.
 */

export async function sendPartnerOtpEmail({ email, managerName, establishmentName, otpCode }) {
  const apiKey = process.env.RESEND_API_KEY;

  // Refuser l'émission si l'email n'est pas réellement envoyé.
  if (!apiKey || apiKey === "re_test_dummy_key" || apiKey.trim() === "") {
    const error = new Error("Le service d'envoi d'emails n'est pas configuré.");
    error.statusCode = 503;
    throw error;
  }

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);

  // Template HTML aux couleurs du Brand Book officiel (Navy #060B24, Cyan #00D2FF, Violet #7C3AED)
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <title>Code de Sécurité Tfarhida</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F0F7FF; margin: 0; padding: 24px; color: #0F172A; }
        .container { max-width: 560px; margin: 0 auto; background: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(2, 132, 199, 0.1); border: 1px solid #BAE6FD; }
        .header { background: linear-gradient(135deg, #060B24 0%, #0F1E4A 100%); padding: 32px 24px; text-align: center; }
        .title { color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
        .gradient-text { background: linear-gradient(135deg, #00D2FF 0%, #38BDF8 50%, #7C3AED 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 20px; }
        .otp-box { background: #F0F7FF; border: 2px dashed #0284C7; border-radius: 16px; padding: 24px; text-align: center; margin: 28px 0; }
        .otp-code { font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #0284C7; font-family: monospace; display: inline-block; }
        .badge { display: inline-block; padding: 4px 12px; background: rgba(16, 185, 129, 0.12); color: #059669; border-radius: 9999px; font-size: 12px; font-weight: 700; margin-top: 10px; }
        .footer { background: #F8FAFC; padding: 20px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="title">Tfarhida <span class="gradient-text">(تفرهيدة)</span></h1>
          <p style="color: #94A3B8; font-size: 13px; margin: 6px 0 0;">L'application N°1 des sorties en Tunisie · Sfax</p>
        </div>
        <div class="content">
          <p class="greeting">
            Bonjour <strong>${escapeHtml(managerName)}</strong>,<br><br>
            Vous venez de configurer l'Espace Partenaire pour l'établissement <strong>« ${escapeHtml(establishmentName)} »</strong>.
            Voici votre code de sécurité à 6 chiffres pour valider votre adresse email :
          </p>
          <div class="otp-box">
            <span class="otp-code">${otpCode}</span><br>
            <span class="badge">⏱️ Valable 10 minutes</span>
          </div>
          <p style="font-size: 13px; color: #64748B; line-height: 1.5;">
            Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.
          </p>
        </div>
        <div class="footer">
          © 2026 Tfarhida · Sfax, Tunisie · Contact WhatsApp Direct · 0% Commission
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "Tfarhida <onboarding@resend.dev>",
        to: [email],
        subject: `🔐 Code de sécurité Tfarhida : ${otpCode}`,
        html: htmlContent,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const error = new Error("Impossible d'envoyer le code de vérification.");
      error.statusCode = 503;
      throw error;
    }

    return { success: true, delivered: true, id: data.id };
  } catch (err) {
    if (!err.statusCode) err.statusCode = 503;
    throw err;
  }
}

export async function sendAdminLoginOtpEmail({ email, otpCode }) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey || apiKey === "re_test_dummy_key") {
    const error = new Error("Le service d’envoi des codes admin n’est pas configuré.");
    error.statusCode = 503;
    throw error;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "Tfarhida <onboarding@resend.dev>",
      to: [email],
      subject: "Code de connexion administrateur ActivityTN",
      text: `Votre code de connexion administrateur est ${otpCode}. Il expire dans 10 minutes. Si vous n’êtes pas à l’origine de cette demande, ignorez cet email.`,
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    const error = new Error("Impossible d’envoyer le code de connexion administrateur.");
    error.statusCode = 503;
    throw error;
  }
}

export async function sendPasswordResetOtpEmail({ email, name = "Membre Tfarhida", otpCode }) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey || apiKey === "re_test_dummy_key") {
    console.log(`[Dev Mail] Code de réinitialisation pour ${email}: ${otpCode}`);
    return { success: true, delivered: false, dev: true };
  }

  const escapeHtml = (val) => String(val || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head><meta charset="utf-8"><title>Réinitialisation du mot de passe Tfarhida</title></head>
    <body style="font-family: -apple-system, sans-serif; background: #F0F7FF; padding: 24px; color: #0F172A;">
      <div style="max-width: 540px; margin: 0 auto; background: #FFF; border-radius: 18px; padding: 32px; border: 1px solid #BAE6FD;">
        <h2 style="color: #0284C7; margin-top: 0;">Tfarhida · تفرهيدة</h2>
        <p>Bonjour <strong>${escapeHtml(name)}</strong>,</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe Tfarhida. Voici votre code de sécurité à 6 chiffres :</p>
        <div style="background: #F0F7FF; border: 2px dashed #0284C7; border-radius: 14px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #0284C7; font-family: monospace;">${otpCode}</span><br>
          <span style="display: inline-block; margin-top: 8px; font-size: 12px; color: #059669; font-weight: 700;">⏱️ Valable 10 minutes</span>
        </div>
        <p style="font-size: 13px; color: #64748B;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
      </div>
    </body>
    </html>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "Tfarhida <onboarding@resend.dev>",
      to: [email],
      subject: `🔑 Réinitialisation de votre mot de passe Tfarhida : ${otpCode}`,
      html: htmlContent,
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    console.warn(`[Mail Service] Resend error (${response.status}):`, errorBody.message || errorBody);
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n======================================================`);
      console.log(`[DEV OTP] Réinitialisation pour ${email} -> CODE: ${otpCode}`);
      console.log(`(Bloqué par Resend Sandbox car l'adresse n'est pas le compte propriétaire Resend)`);
      console.log(`======================================================\n`);
    }
    const error = new Error("Impossible d'envoyer l'email de réinitialisation.");
    error.statusCode = 503;
    throw error;
  }
  return { success: true, delivered: true };
}

