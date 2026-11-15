import type { DemoActivity } from '../../data/demoActivities';

const TUNISIA_BOUNDS = { minLat: 30, maxLat: 38, minLng: 7, maxLng: 12 };
const LEGACY_DEFAULT = { latitude: 34.7406, longitude: 10.7603 };

export interface MapCity {
  slug?: string;
  name: string;
  nameFr?: string;
  nameAr?: string;
  nameEn?: string;
  coords?: { latitude?: number; longitude?: number };
}

export function hasVerifiedMapPoint(activity: DemoActivity) {
  const { latitude, longitude } = activity.coordinates || {};
  return activity.coordinatesVerified === true &&
    Number.isFinite(latitude) && Number.isFinite(longitude) &&
    (latitude as number) >= TUNISIA_BOUNDS.minLat && (latitude as number) <= TUNISIA_BOUNDS.maxLat &&
    (longitude as number) >= TUNISIA_BOUNDS.minLng && (longitude as number) <= TUNISIA_BOUNDS.maxLng &&
    !((latitude as number) === LEGACY_DEFAULT.latitude && (longitude as number) === LEGACY_DEFAULT.longitude);
}

const normalizeCity = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase();

export function groupUnverifiedActivitiesByCity(activities: DemoActivity[], cities: MapCity[]) {
  const groups = new Map<string, { city: MapCity; activities: DemoActivity[] }>();
  activities.filter((activity) => !hasVerifiedMapPoint(activity)).forEach((activity) => {
    const activityCity = normalizeCity(activity.city || '');
    const city = cities.find((candidate) => [candidate.name, candidate.nameFr, candidate.nameAr, candidate.nameEn]
      .some((name) => name && normalizeCity(name) === activityCity));
    const latitude = city?.coords?.latitude;
    const longitude = city?.coords?.longitude;
    if (!city || !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      (latitude as number) < TUNISIA_BOUNDS.minLat || (latitude as number) > TUNISIA_BOUNDS.maxLat ||
      (longitude as number) < TUNISIA_BOUNDS.minLng || (longitude as number) > TUNISIA_BOUNDS.maxLng) return;
    const key = city.slug || city.nameFr || city.name;
    const group = groups.get(key) || { city, activities: [] };
    group.activities.push(activity);
    groups.set(key, group);
  });
  return Array.from(groups.values());
}
