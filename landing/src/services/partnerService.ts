import { apiRequest } from './apiClient';

export type PartnerTier = 'standard' | 'pro' | 'premium';

export interface PartnerActivity {
  _id: string;
  name: string;
  category: string;
  type?: 'activity' | 'restaurant' | 'cafe' | 'other';
  city: string;
  address?: string;
  locationName?: string;
  mapsUrl?: string;
  price: number;
  description?: string;
  imageUrl?: string;
  menuImageUrl?: string;
  menuUrl?: string;
  instagram?: string;
  amenities?: string[];
  phone?: string;
  whatsapp?: string;
  rating?: number;
  reviewsCount?: number;
  isApproved?: boolean;
  hasPowerBackup?: boolean;
  powerBackupMode?: boolean;
  hasAirConditioning?: boolean;
  openingTime?: string;
  closingTime?: string;
  openDays?: string[];
  promotion?: {
    isPromo?: boolean;
    promoType?: 'all' | 'item';
    discountPercent?: number;
    targetItem?: string;
    promoLabel?: string;
    validUntil?: string;
  };
  events?: Array<{
    _id?: string;
    title: string;
    image?: string;
    date?: string;
    time?: string;
    description?: string;
    category?: string;
    price?: number;
  }>;
}

export type PartnerActivityInput = Omit<PartnerActivity, '_id' | 'rating' | 'reviewsCount' | 'isApproved' | 'promotion' | 'events'>;

export interface PartnerDashboardData {
  success: boolean;
  count: number;
  partnerTier?: PartnerTier;
  stats: {
    total: number;
    approved: number;
    pending: number;
    totalReviews: number;
    averageRating: number;
  };
  activities: PartnerActivity[];
}

async function uploadImage(file: File, messages: { invalidType: string; tooLarge: string; readFailed: string; invalidImage: string }): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error(messages.invalidType);
  }
  if (file.size > 5 * 1024 * 1024) throw new Error(messages.tooLarge);
  const image = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(messages.readFailed));
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error(messages.invalidImage));
    reader.readAsDataURL(file);
  });
  const response = await apiRequest<{ url: string }>('/upload/image', {
    method: 'POST',
    body: JSON.stringify({ image, folder: 'activities' }),
  });
  return response.url;
}

export const partnerService = {
  dashboard: () => apiRequest<PartnerDashboardData>('/activities/partner/my-activities'),
  systemStatus: () => apiRequest<{ electricityAlertActive: boolean }>('/activities/system-status'),
  createActivity: (input: PartnerActivityInput) => apiRequest<{ activity: PartnerActivity }>('/activities', {
    method: 'POST', body: JSON.stringify(input),
  }),
  updateActivity: (id: string, input: Partial<PartnerActivityInput>) => apiRequest<{ activity: PartnerActivity }>(`/activities/${encodeURIComponent(id)}`, {
    method: 'PUT', body: JSON.stringify(input),
  }),
  deleteActivity: (id: string) => apiRequest<{ success: boolean }>(`/activities/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  setPowerMode: (id: string, powerBackupMode: boolean) => apiRequest<{ activity: PartnerActivity }>(`/activities/partner/${encodeURIComponent(id)}/power-mode`, {
    method: 'PATCH', body: JSON.stringify({ powerBackupMode }),
  }),
  setPromotion: (id: string, input: NonNullable<PartnerActivity['promotion']>) => apiRequest<{ activity: PartnerActivity }>(`/activities/partner/${encodeURIComponent(id)}/promotion`, {
    method: 'PATCH', body: JSON.stringify(input),
  }),
  addEvent: (id: string, input: NonNullable<PartnerActivity['events']>[number]) => apiRequest<{ activity: PartnerActivity }>(`/activities/partner/${encodeURIComponent(id)}/events`, {
    method: 'POST', body: JSON.stringify(input),
  }),
  uploadImage,
};
