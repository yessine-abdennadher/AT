export class AdminMfaRequiredError extends Error {
  constructor(challenge) {
    super('Une vérification administrateur est requise.');
    this.name = 'AdminMfaRequiredError';
    this.challenge = challenge;
  }
}

export function parseAdminMfaLogin(result) {
  if (result?.mfaRequired) {
    if (typeof result.challengeId !== 'string' || !result.challengeId.trim()) {
      throw new Error('Réponse MFA invalide : challengeId manquant.');
    }
    throw new AdminMfaRequiredError({
      challengeId: result.challengeId,
      maskedEmail: typeof result.maskedEmail === 'string' ? result.maskedEmail : '',
    });
  }
  return { user: result?.user };
}

export async function verifyAdminMfa(challengeId, otp, request) {
  const result = await request('/auth/admin/mfa/verify', {
    method: 'POST',
    body: JSON.stringify({ challengeId, otp }),
  });
  if (!result?.user) throw new Error('Réponse de vérification administrateur invalide.');
  return result.user;
}
