/**
 * Service d'Envoi d'Email Tfarhida (Resend API)
 * Utilise l'API HTTPS officielle de Resend avec template HTML officiel Brand Book
 * Intègre un fallback transparent pour le développement local si aucune clé n'est encore configurée
 */

export async function sendPartnerOtpEmail({ email, managerName, establishmentName, otpCode }) {
  const apiKey = process.env.RESEND_API_KEY;

  console.log(`\n======================================================`);
  console.log(`🔐 [OTP TFARHIDA] Code de sécurité généré pour ${email}`);
  console.log(`👉 Établissement : ${establishmentName} | Gérant : ${managerName}`);
  console.log(`👉 CODE OTP : [ ${otpCode} ] (Valable 10 minutes)`);
  console.log(`======================================================\n`);

  // Si aucune clé API n'est configurée, on s'arrête au log console sans planter
  if (!apiKey || apiKey === "re_test_dummy_key" || apiKey.trim() === "") {
    return {
      success: true,
      delivered: false,
      mode: "development_console",
      message: "Code OTP affiché dans la console locale (ajouter RESEND_API_KEY dans .env pour envoi réel)",
    };
  }

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
            Bonjour <strong>${managerName}</strong>,<br><br>
            Vous venez de configurer l'Espace Partenaire pour l'établissement <strong>« ${establishmentName} »</strong>.
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
      console.warn("[Resend Warning] Échec d'envoi d'email :", data);
      return { success: false, error: data.message || "Erreur Resend" };
    }

    return { success: true, delivered: true, id: data.id };
  } catch (err) {
    console.error("[Resend Error] Exception réseau :", err.message);
    return { success: false, error: err.message };
  }
}

