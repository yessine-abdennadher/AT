import { apiRequest } from './apiClient';

export interface AdminPlatformStats {
  users?: { total?: number; regularUsers?: number; partners?: number; admins?: number };
  activities?: { total?: number; pendingApproval?: number; byCity?: Array<{ city: string; count: number }> };
  reviews?: { total?: number };
}

export interface AdminActivityRow {
  _id: string;
  name: string;
  city?: string;
  category?: string;
  imageUrl?: string;
  isApproved?: boolean;
  isFeatured?: boolean;
  isPopular?: boolean;
  rating?: number;
  createdBy?: { _id?: string; name?: string; email?: string; establishmentName?: string };
}

export interface AdminReviewRow {
  _id: string;
  userName?: string;
  comment: string;
  rating: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
  activity?: { _id?: string; name?: string; isApproved?: boolean };
}

export interface AdminUserRow {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'partner' | 'admin';
  city?: string;
  isActive?: boolean;
  createdAt?: string;
  lastLogin?: string;
  establishmentName?: string;
  partnerTier?: 'standard' | 'pro' | 'premium';
}

export interface AdminPartnerSummary {
  id: string;
  name: string;
  email: string;
  establishmentName?: string;
  partnerTier: 'standard' | 'pro' | 'premium';
  requestedTier?: string;
  requestedBillingCycle?: string;
  subscriptionStatus?: string;
  subscriptionStartedAt?: string;
  subscriptionExpiresAt?: string | null;
  lastLogin?: string;
  lastActivityUpdate?: string;
  createdAt?: string;
  activityCount?: number;
  isInactive?: boolean;
  hasStaleData?: boolean;
  city?: string;
  phone?: string;
  isActive?: boolean;
  activities?: Array<Record<string, unknown>>;
  offers?: Array<Record<string, unknown>>;
}

export interface AdminDiagnostics {
  electricityAlertActive?: boolean;
  telemetry?: { totalSessions?: number; screenViews?: Array<{ screenName: string; count: number }>; dailySessions?: Array<{ date: string; count: number }> };
  partnersStatus?: AdminPartnerSummary[];
}

export interface AdminPageParams {
  page?: number;
  limit?: number;
  status?: string;
  role?: string;
  search?: string;
}

const queryString = (params: AdminPageParams) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') query.set(key, String(value)); });
  return query.size ? `?${query.toString()}` : '';
};

export const adminService = {
  async getStats() { return apiRequest<{ success: boolean; stats: AdminPlatformStats }>('/admin/stats'); },
  async getActivities(params: AdminPageParams = {}) { return apiRequest<{ success: boolean; activities: AdminActivityRow[]; total: number; page: number; totalPages: number }>(`/admin/activities${queryString(params)}`); },
  async getReviews(params: AdminPageParams = {}) { return apiRequest<{ success: boolean; reviews: AdminReviewRow[]; total: number; page: number; totalPages: number }>(`/admin/reviews${queryString(params)}`); },
  async getUsers(params: AdminPageParams = {}) { return apiRequest<{ success: boolean; users: AdminUserRow[]; total: number; page: number; totalPages: number }>(`/admin/users${queryString(params)}`); },
  async getDiagnostics() { return apiRequest<{ success: boolean; diagnostics: AdminDiagnostics }>('/admin/diagnostics'); },
  async setElectricityMode(active: boolean) { return apiRequest<{ success: boolean; electricityAlertActive: boolean }>('/admin/electricity-mode', { method: 'PATCH', body: JSON.stringify({ active }) }); },
  async setUserStatus(id: string, isActive: boolean) { return apiRequest<{ success: boolean; user: AdminUserRow }>(`/admin/users/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }); },
  async setUserRole(id: string, role: AdminUserRow['role']) { return apiRequest<{ success: boolean; user: AdminUserRow }>(`/admin/users/${encodeURIComponent(id)}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }); },
  async setActivityApproval(id: string, isApproved: boolean) { return apiRequest<{ success: boolean; activity: AdminActivityRow }>(`/admin/activities/${encodeURIComponent(id)}/approve`, { method: 'PATCH', body: JSON.stringify({ isApproved }) }); },
  async toggleActivityHighlight(id: string, field: 'isFeatured' | 'isPopular') { return apiRequest<{ success: boolean; activity: AdminActivityRow }>(`/admin/activities/${encodeURIComponent(id)}/highlight`, { method: 'PATCH', body: JSON.stringify({ field }) }); },
  async deleteActivity(id: string) { return apiRequest<{ success: boolean }>(`/admin/activities/${encodeURIComponent(id)}`, { method: 'DELETE' }); },
  async setReviewStatus(id: string, status: 'approved' | 'rejected') { return apiRequest<{ success: boolean; review: AdminReviewRow }>(`/admin/reviews/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); },
  async setPartnerTier(id: string, tier: AdminPartnerSummary['partnerTier']) { return apiRequest<{ success: boolean; partner: AdminPartnerSummary }>(`/admin/partners/${encodeURIComponent(id)}/tier`, { method: 'PATCH', body: JSON.stringify({ tier }) }); },
};
