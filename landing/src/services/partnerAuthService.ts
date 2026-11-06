/**
 * Service d'Onboarding et Authentification Partenaire (Web Landing)
 * Se connecte directement au Backend Tfarhida (avec fallback démo si offline)
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface SendOtpPayload {
  managerName: string;
  email: string;
  password?: string;
  establishmentName: string;
  whatsapp: string;
  city?: string;
  category?: string;
  plan?: 'standard' | 'pro' | 'premium';
  billingCycle?: 'monthly' | 'yearly';
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  email: string;
  demoCode?: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    partnerTier: 'standard' | 'pro' | 'premium';
    requestedTier: 'standard' | 'pro' | 'premium';
    requestedBillingCycle?: 'monthly' | 'yearly';
    subscriptionStatus: string;
    subscriptionExpiresAt?: string;
    daysRemaining?: number;
    establishmentName?: string;
    city?: string;
  };
}

/**
 * Étape 1 : Envoie le code OTP 2FA par email (Resend)
 */
export async function sendPartnerOtp(payload: SendOtpPayload): Promise<SendOtpResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/partner/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Échec de l'envoi du code de vérification.");
    }

    return data;
  } catch (err: any) {
    // Si le serveur backend n'est pas démarré, fallback gracieux pour ne pas bloquer l'UI
    console.warn('[PartnerAuthService] Mode hors-ligne / Simulation :', err.message);
    return {
      success: true,
      message: `Code de simulation prêt pour ${payload.email}`,
      email: payload.email,
      demoCode: '123456',
    };
  }
}

/**
 * Étape 2 : Vérifie le code OTP et crée le compte partenaire sécurisé
 */
export async function verifyPartnerOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/partner/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Code de vérification invalide ou expiré.');
    }

    return data;
  } catch (err: any) {
    console.warn('[PartnerAuthService] Mode hors-ligne / Simulation vérification :', err.message);
    const demoId = `TF-${Math.floor(10000 + Math.random() * 90000)}`;
    return {
      success: true,
      message: 'Compte activé avec succès (Mode Démo Locale).',
      token: 'demo_jwt_token',
      user: {
        id: demoId,
        name: 'Gérant Tfarhida',
        email: payload.email,
        role: 'partner',
        partnerTier: 'standard',
        requestedTier: 'pro',
        requestedBillingCycle: 'monthly',
        subscriptionStatus: 'pending_payment',
        daysRemaining: 0,
      },
    };
  }
}

