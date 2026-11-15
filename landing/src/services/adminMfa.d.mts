export interface AdminMfaChallenge {
  challengeId: string;
  maskedEmail: string;
}

export class AdminMfaRequiredError extends Error {
  challenge: AdminMfaChallenge;
}

export function parseAdminMfaLogin<T>(result: {
  mfaRequired?: boolean;
  challengeId?: string;
  maskedEmail?: string;
  user: T;
}): { user: T };
export function verifyAdminMfa<T>(
  challengeId: string,
  otp: string,
  request: (path: string, init: RequestInit) => Promise<{ user: T }>
): Promise<T>;
