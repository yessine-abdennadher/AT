import type { DemoActivity } from '../data/demoActivities';
import { apiRequest } from './apiClient';

export interface BackendActivity {
  _id: string;
  id?: string;
  name: string;
  nameAr?: string;
  nameFr?: string;
  nameEn?: string;
  category: string;
  type?: DemoActivity['type'];
  city: string;
  cityFr?: string;
  cityAr?: string;
  cityEn?: string;
  locationName?: string;
  locationNameFr?: string;
  address?: string;
  price: number;
  currency?: string;
  rating: number;
  reviewsCount?: number;
  imageUrl?: string;
  image?: string;
  hasPowerBackup?: boolean;
  powerBackupMode?: boolean;
  hasAirConditioning?: boolean;
  isOpenNow?: boolean;
  phone?: string;
  whatsapp?: string;
  description?: string;
  descriptionAr?: string;
  descriptionFr?: string;
  descriptionEn?: string;
  locationNameAr?: string;
  locationNameEn?: string;
  highlight?: string;
  badgeFr?: string;
  promotion?: DemoActivity['promotion'];
  events?: DemoActivity['events'];
  tags?: string[];
  suitableFor?: string[];
  coordinates?: { latitude?: number; longitude?: number };
  coordinatesVerified?: boolean;
  isApproved?: boolean;
  isFeatured?: boolean;
  partnerTier?: 'standard' | 'pro' | 'premium';
  menu?: DemoActivity['menu'];
  createdBy?: {
    partnerTier?: 'standard' | 'pro' | 'premium';
    subscriptionStatus?: string;
    role?: string;
  };
}

export function mapBackendToActivity(item: BackendActivity, language = 'fr'): DemoActivity {
  const categoryLabels: Record<string, string> = {
    fun: 'Divertissement & Jeux',
    food: 'Cafés & Restos',
    outdoor: 'Plein Air & Mer',
    creative: 'Culture & Spectacles',
    sport: 'Sport & Fitness',
  };

  const ownerTier = item.createdBy?.partnerTier || item.partnerTier || 'standard';
  const subStatus = item.createdBy?.subscriptionStatus;
  const isSubActive = !subStatus || subStatus === 'active' || item.createdBy?.role === 'admin';
  const effectiveTier = isSubActive ? ownerTier : 'standard';

  return {
    id: item._id || item.id || '',
    name: language === 'ar' ? item.nameAr || item.name : language === 'en' ? item.nameEn || item.name : item.nameFr || item.name,
    nameAr: item.nameAr || '',
    city: language === 'ar' ? item.cityAr || item.city : language === 'en' ? item.cityEn || item.city : item.cityFr || item.city || '',
    locationName: language === 'ar' ? item.locationNameAr || item.locationName || item.address : language === 'en' ? item.locationNameEn || item.locationName || item.address : item.locationNameFr || item.locationName || item.address || item.cityFr || item.city,
    category: (['outdoor', 'creative', 'food', 'fun', 'sport', 'couple', 'friends'].includes(item.category)
      ? item.category
      : 'fun') as DemoActivity['category'],
    type: item.type,
    categoryLabel: categoryLabels[item.category] || 'Sortie & Loisir',
    price: typeof item.price === 'number' ? item.price : 0,
    rating: typeof item.rating === 'number' ? item.rating : 0,
    reviewCount: typeof item.reviewsCount === 'number' ? item.reviewsCount : 0,
    imageUrl: item.imageUrl || item.image || '',
    lightingActive: Boolean(item.hasPowerBackup || item.powerBackupMode),
    hasAirConditioning: Boolean(item.hasAirConditioning),
    directContact: Boolean(item.phone || item.whatsapp),
    phone: item.phone,
    whatsapp: item.whatsapp,
    highlight: item.highlight || (language === 'ar' ? item.descriptionAr : language === 'en' ? item.descriptionEn : item.descriptionFr) || item.description || item.badgeFr || '',
    description: (language === 'ar' ? item.descriptionAr : language === 'en' ? item.descriptionEn : item.descriptionFr) || item.description || '',
    tags: Array.isArray(item.tags) ? item.tags : [],
    promotion: item.promotion,
    events: item.events,
    coordinates: item.coordinates,
    coordinatesVerified: item.coordinatesVerified === true,
    partnerTier: effectiveTier,
    isFeatured: Boolean(item.isFeatured),
    menu: item.menu,
  };
}

export interface ExplorerOption {
  value: string;
  label: string;
}

interface BackendTaxonomyItem {
  slug: string;
  name?: string;
  nameFr?: string;
  nameAr?: string;
  nameEn?: string;
  isActive?: boolean;
}

function localizedOptions(items: BackendTaxonomyItem[], language: string): ExplorerOption[] {
  return items
    .filter((item) => item.isActive !== false)
    .map((item) => ({
      value: item.slug,
      label: language === 'ar' ? item.nameAr || item.name || item.slug
        : language === 'en' ? item.nameEn || item.name || item.slug
          : item.nameFr || item.name || item.slug,
    }));
}

export interface ActivityExplorerFilters {
  city?: string;
  category?: string;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function fetchActivityExplorerData(language = 'fr', filters: ActivityExplorerFilters = {}): Promise<{
  activities: DemoActivity[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  categories: ExplorerOption[];
  cities: ExplorerOption[];
}> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const params = new URLSearchParams({ page: String(filters.page || 1), limit: String(filters.limit || 20) });
    if (filters.city) params.set('city', filters.city);
    if (filters.category) params.set('category', filters.category);
    if (filters.type) params.set('type', filters.type);
    if (filters.search?.trim()) params.set('search', filters.search.trim());
    const [activityResult, categoryResult, cityResult] = await Promise.allSettled([
      apiRequest<{ activities?: BackendActivity[]; total?: number; page?: number; totalPages?: number; hasMore?: boolean }>(`/activities?${params}`, { signal: controller.signal }),
      apiRequest<{ categories?: BackendTaxonomyItem[] }>('/categories', { signal: controller.signal }),
      apiRequest<{ cities?: BackendTaxonomyItem[] }>('/cities?activeOnly=true', { signal: controller.signal }),
    ]);
    if (activityResult.status === 'rejected') throw activityResult.reason;

    const payload = activityResult.value;
    if (!Array.isArray(payload.activities)) throw new Error('La réponse activités de l’API est invalide.');
    const activities = payload.activities.map((activity) => mapBackendToActivity(activity, language));
    const categories = categoryResult.status === 'fulfilled'
      ? localizedOptions(categoryResult.value.categories || [], language)
      : [];
    const cities = cityResult.status === 'fulfilled'
      ? (cityResult.value.cities || []).filter((city) => city.isActive !== false).map((city) => ({
        value: city.nameFr || city.name || city.slug,
        label: language === 'ar' ? city.nameAr || city.name || city.slug
          : language === 'en' ? city.nameEn || city.name || city.slug
            : city.nameFr || city.name || city.slug,
      }))
      : [];

    return {
      activities,
      total: payload.total ?? activities.length,
      page: payload.page ?? filters.page ?? 1,
      totalPages: payload.totalPages ?? 1,
      hasMore: payload.hasMore ?? false,
      categories: categories.length ? categories : Array.from(new Set(activities.map((activity) => activity.category)))
        .map((value) => ({ value, label: value })),
      cities: cities.length ? cities : Array.from(new Set(activities.map((activity) => activity.city).filter(Boolean)))
        .map((value) => ({ value, label: value })),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchAllMapActivities(language = 'fr'): Promise<DemoActivity[]> {
  const collected: DemoActivity[] = [];
  let page = 1;
  let hasMore = true;
  while (hasMore && page <= 10) {
    const result = await fetchActivityExplorerData(language, { page, limit: 100 });
    collected.push(...result.activities);
    hasMore = result.hasMore;
    page = result.page + 1;
  }
  return collected;
}

export interface SearchSuggestion {
  id: string;
  name: string;
  nameAr?: string;
  city: string;
  locationName?: string;
  category: string;
  price: number;
  rating: number;
  imageUrl: string;
  powerBackupMode: boolean;
  isPremium: boolean;
  partnerTier?: string;
  type?: DemoActivity['type'];
}

export async function fetchActivityById(activityId: string): Promise<DemoActivity> {
  const payload = await apiRequest<{ activity: BackendActivity }>(`/activities/${encodeURIComponent(activityId)}`);
  return mapBackendToActivity(payload.activity);
}

export interface PublicReview {
  _id: string;
  rating: number;
  comment: string;
  user?: { name?: string };
  userName?: string;
  userAvatar?: string;
  createdAt?: string;
  reactions?: Array<{ user?: string; type?: string }>;
}

export async function fetchActivityReviews(activityId: string) {
  return apiRequest<{ reviews: PublicReview[]; averageRating: number; reviewsCount: number; count: number }>(`/activities/${encodeURIComponent(activityId)}/reviews`);
}

export async function createActivityReview(activityId: string, rating: number, comment: string) {
  return apiRequest<{ pending: boolean; averageRating: number; reviewsCount: number }>(`/activities/${encodeURIComponent(activityId)}/reviews`, {
    method: 'POST', body: JSON.stringify({ rating, comment }),
  });
}

export async function fetchSearchSuggestions(query: string = ''): Promise<{
  suggestions: SearchSuggestion[];
  isLive: boolean;
}> {
  try {
    const result = await apiRequest<{ suggestions?: Array<Partial<SearchSuggestion> & { _id?: string }> }>(`/activities/suggestions?q=${encodeURIComponent(query)}&limit=6`);
    return {
      suggestions: (result.suggestions || []).map((item) => ({
        id: item._id || item.id || '',
        name: item.name || '',
        nameAr: item.nameAr,
        city: item.city || '',
        locationName: item.locationName,
        category: item.category || '',
        price: typeof item.price === 'number' ? item.price : 0,
        rating: typeof item.rating === 'number' ? item.rating : 0,
        imageUrl: item.imageUrl || '',
        powerBackupMode: Boolean(item.powerBackupMode),
        isPremium: Boolean(item.isPremium),
        partnerTier: item.partnerTier,
        type: item.type,
      })),
      isLive: true,
    };
  } catch {
    return { suggestions: [], isLive: false };
  }
}
