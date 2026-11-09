/**
 * Service d'Onboarding et Authentification Partenaire (Web Landing)
 * Se connecte directement au Backend Tfarhida; vérification obligatoire en ligne.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface SendOtpPayload {
  managerName: string;
  email: string;
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
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
  password: string;
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

export type VerifiedPartner = VerifyOtpResponse['user'];

/**
 * Étape 1 : Envoie le code OTP 2FA par email (Resend)
 */
export async function sendPartnerOtp(payload: SendOtpPayload): Promise<SendOtpResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/partner/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Échec de l'envoi du code de vérification.");
  }
  return data;
}

/**
 * Étape 2 : Vérifie le code OTP et crée le compte partenaire sécurisé
 */
export async function verifyPartnerOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/partner/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Code de vérification invalide ou expiré.');
  }
  return data;
}

