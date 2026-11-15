import { apiRequest } from './apiClient';
import { parseAdminMfaLogin, verifyAdminMfa as verifyMfaRequest } from './adminMfa.mjs';

export { AdminMfaRequiredError } from './adminMfa.mjs';

export interface AuthUser {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'user' | 'partner' | 'admin';
  city?: string;
  favoriteActivities?: string[];
  partnerTier?: 'standard' | 'pro' | 'premium';
  establishmentName?: string;
  subscriptionStatus?: string;
}

interface AuthResponse {
  success: boolean;
  user: AuthUser;
  mfaRequired?: boolean;
  challengeId?: string;
  maskedEmail?: string;
  message?: string;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthUser> {
    const result = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return parseAdminMfaLogin(result).user;
  },

  async verifyAdminMfa(challengeId: string, otp: string): Promise<AuthUser> {
    return verifyMfaRequest(challengeId, otp, apiRequest);
  },

  async register(name: string, email: string, password: string): Promise<AuthUser> {
    const result = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    return result.user;
  },

  async getMe(): Promise<AuthUser> {
    const result = await apiRequest<AuthResponse>('/auth/me');
    return result.user;
  },

  async refresh(): Promise<void> {
    await apiRequest('/auth/refresh', { method: 'POST', body: JSON.stringify({}) });
  },

  async logout(): Promise<void> {
    await apiRequest('/auth/logout', { method: 'POST', body: JSON.stringify({}) });
  },

  async updateProfile(updates: Pick<AuthUser, 'name' | 'city'>): Promise<AuthUser> {
    const result = await apiRequest<AuthResponse>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return result.user;
  },

  async getFavoriteIds(): Promise<string[]> {
    const result = await apiRequest<{ favoriteIds?: string[] }>('/auth/favorites');
    return result.favoriteIds || [];
  },

  async toggleFavorite(activityId: string): Promise<{ isFavorite: boolean }> {
    return apiRequest<{ isFavorite: boolean }>(`/activities/${encodeURIComponent(activityId)}/favorite`, { method: 'POST' });
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string; email: string; devOtp?: string }> {
    return apiRequest<{ success: boolean; message: string; email: string; devOtp?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async verifyResetOtp(payload: { email: string; otp: string }): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>('/auth/verify-reset-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async resetPassword(payload: { email: string; otp: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
