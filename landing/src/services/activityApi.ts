import type { DemoActivity } from '../data/demoActivities';
import { DEMO_ACTIVITIES } from '../data/demoActivities';

export interface BackendActivity {
  _id: string;
  name: string;
  nameAr?: string;
  nameFr?: string;
  nameEn?: string;
  category: string;
  city: string;
  locationName?: string;
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
  highlight?: string;
  tags?: string[];
  suitableFor?: string[];
}

export function mapBackendToActivity(item: BackendActivity): DemoActivity {
  const categoryLabels: Record<string, string> = {
    fun: 'Divertissement & Jeux',
    food: 'Cafés & Restos',
    outdoor: 'Plein Air & Mer',
    creative: 'Culture & Spectacles',
    sport: 'Sport & Fitness',
  };

  return {
    id: item._id,
    name: item.nameFr || item.name,
    nameAr: item.nameAr || '',
    city: item.city || 'Sfax',
    locationName: item.locationName || item.address || item.city,
    category: (['outdoor', 'creative', 'food', 'fun'].includes(item.category)
      ? item.category
      : 'fun') as DemoActivity['category'],
    categoryLabel: categoryLabels[item.category] || 'Sortie & Loisir',
    price: typeof item.price === 'number' ? item.price : 0,
    rating: typeof item.rating === 'number' && item.rating > 0 ? item.rating : 4.8,
    reviewCount: typeof item.reviewsCount === 'number' && item.reviewsCount > 0 ? item.reviewsCount : 24,
    imageUrl:
      item.imageUrl ||
      item.image ||
      'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&w=800&q=80',
    lightingActive: Boolean(item.hasPowerBackup || item.powerBackupMode),
    hasAirConditioning: Boolean(item.hasAirConditioning),
    directContact: true,
    highlight:
      item.highlight ||
      item.descriptionFr ||
      item.description ||
      'Expérience authentique vérifiée à découvrir.',
    description: item.descriptionFr || item.description || '',
    tags: Array.isArray(item.tags) && item.tags.length > 0 ? item.tags : ['Tfarhida', 'Vérifié'],
  };
}

export async function fetchLiveActivities(): Promise<{
  activities: DemoActivity[];
  isLive: boolean;
  total: number;
}> {
  const endpoints = ['/api/activities', 'http://127.0.0.1:5000/api/activities'];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.activities) && data.activities.length > 0) {
          return {
            activities: data.activities.map(mapBackendToActivity),
            isLive: true,
            total: data.total || data.activities.length,
          };
        }
      }
    } catch {
      // En cas d'erreur de connexion, essayer le prochain endpoint
    }
  }

  // Fallback sécurisé avec les données seedées
  return {
    activities: DEMO_ACTIVITIES,
    isLive: false,
    total: DEMO_ACTIVITIES.length,
  };
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
}

export async function fetchSearchSuggestions(query: string = ''): Promise<{
  suggestions: SearchSuggestion[];
  isLive: boolean;
}> {
  const endpoints = [
    `/api/activities/suggestions?q=${encodeURIComponent(query)}&limit=6`,
    `http://127.0.0.1:5000/api/activities/suggestions?q=${encodeURIComponent(query)}&limit=6`,
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          return {
            suggestions: data.suggestions.map((s: any) => ({
              id: s._id || s.id,
              name: s.name,
              nameAr: s.nameAr || '',
              city: s.city || 'Sfax',
              locationName: s.locationName || s.city,
              category: s.category || 'fun',
              price: typeof s.price === 'number' ? s.price : 0,
              rating: typeof s.rating === 'number' && s.rating > 0 ? s.rating : 4.8,
              imageUrl: s.imageUrl || 'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=400&q=80',
              powerBackupMode: Boolean(s.powerBackupMode),
              isPremium: Boolean(s.isPremium),
              partnerTier: s.partnerTier || 'standard',
            })),
            isLive: true,
          };
        }
      }
    } catch {
      // Continue to next endpoint
    }
  }

  // Fallback intelligent avec priorisation des établissements Premium
  const cleanQ = query.trim().toLowerCase();
  let filtered = DEMO_ACTIVITIES;
  if (cleanQ) {
    filtered = DEMO_ACTIVITIES.filter(
      (a) =>
        a.name.toLowerCase().includes(cleanQ) ||
        (a.nameAr && a.nameAr.includes(cleanQ)) ||
        a.category.toLowerCase().includes(cleanQ) ||
        a.city.toLowerCase().includes(cleanQ) ||
        a.tags.some((t) => t.toLowerCase().includes(cleanQ))
    );
  }

  return {
    suggestions: filtered.slice(0, 6).map((a, index) => ({
      id: a.id,
      name: a.name,
      nameAr: a.nameAr,
      city: a.city,
      locationName: a.locationName,
      category: a.category,
      price: a.price,
      rating: a.rating,
      imageUrl: a.imageUrl,
      powerBackupMode: a.lightingActive,
      isPremium: index < 2 || a.id.includes('mall') || a.id.includes('dar'),
      partnerTier: index < 2 ? 'premium' : 'standard',
    })),
    isLive: false,
  };
}
