import { apiRequest } from './apiClient';
import type { BackendActivity } from './activityApi';

export interface RecommendationFilters {
  city?: string;
  category?: string;
  type?: string;
  budgetMax?: number;
  situation?: 'hot' | 'rain' | 'powercut' | 'open_now' | 'surprise_me' | 'night';
  group?: string;
}

export async function getRecommendations(filters: RecommendationFilters, sortBy: 'rating' | 'price' | 'distance', page = 1) {
  const result = await apiRequest<{ activities?: BackendActivity[]; page?: number; hasMore?: boolean }>('/activities/recommendations', {
    method: 'POST', body: JSON.stringify({ filters, sortBy, page, limit: 20 }),
  });
  return { activities: result.activities || [], page: result.page || page, hasMore: Boolean(result.hasMore) };
}
