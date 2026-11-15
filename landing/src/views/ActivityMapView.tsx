import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin, Search, ShieldCheck, Star } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { fetchAllMapActivities } from '../services/activityApi';
import type { DemoActivity } from '../data/demoActivities';
import { apiRequest } from '../services/apiClient';
import { ActivityMap } from '../components/map/ActivityMap';
import { groupUnverifiedActivitiesByCity, hasVerifiedMapPoint, type MapCity } from '../components/map/mapUtils';

export function ActivityMapView() {
  const { t, language } = useLanguage();
  const [activities, setActivities] = useState<DemoActivity[]>([]);
  const [cities, setCities] = useState<MapCity[]>([]);
  const [error, setError] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [search, setSearch] = useState('');
  useEffect(() => {
    let alive = true;
    fetchAllMapActivities(language).then((data) => { if (alive) setActivities(data); }).catch(() => { if (alive) setError(true); });
    apiRequest<{ cities?: MapCity[] }>('/cities').then((payload) => { if (alive) setCities(payload.cities || []); }).catch(() => { if (alive) setCities([]); });
    return () => { alive = false; };
  }, [language]);
  const locate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(({ coords }) => { setLocationDenied(false); setUserPosition([coords.latitude, coords.longitude]); }, () => setLocationDenied(true), { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 });
  };
  const located = activities.filter(hasVerifiedMapPoint);
  const approximateGroups = groupUnverifiedActivitiesByCity(activities, cities);
  const approximateCount = approximateGroups.reduce((count, group) => count + group.activities.length, 0);
  const mappedCount = located.length + approximateCount;
  const visibleActivities = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return activities;
    return activities.filter((activity) => [activity.name, activity.city, activity.locationName, activity.categoryLabel]
      .some((value) => value?.toLocaleLowerCase().includes(query)));
  }, [activities, search]);
  return <section className="public-page"><h1>{t('nav.map')}</h1>
    {error && <p role="alert">{t('explorer.apiError')}</p>}
    {locationDenied && <p role="status">{t('map.locationDenied')}</p>}
    <p>{t('map.locationNote')}</p><button className="btn btn-secondary" type="button" onClick={locate}>{t('map.locateMe')}</button>
    <p className="map-summary" role="status"><strong>{mappedCount}</strong> {t('map.activitiesOnMap')} · {located.length} {t('map.verifiedCount')} · {approximateCount} {t('map.cityGroupedCount')}</p>
    <div className="map-layout"><ActivityMap activities={activities} cities={cities} userPosition={userPosition} />
      <aside className="map-results" aria-label={t('map.listTitle')}>
        <div className="map-results-heading"><div><h2>{t('map.listTitle')}</h2><p>{visibleActivities.length} {t('map.listCount')}</p></div></div>
        <label className="map-results-search"><Search size={18} aria-hidden="true" /><span className="sr-only">{t('map.searchActivities')}</span>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('map.searchActivities')} />
        </label>
        <div className="map-results-cards">
          {visibleActivities.map((activity) => <Link className="map-result-card" to={`/activites/${encodeURIComponent(activity.id)}`} key={activity.id}>
            <span className="map-result-photo">
              {activity.imageUrl ? <img src={activity.imageUrl} alt={activity.name} loading="lazy" /> : <MapPin size={25} aria-hidden="true" />}
            </span>
            <span className="map-result-copy">
              <span className="map-result-topline">
                {activity.categoryLabel && <span className="map-result-category">{activity.categoryLabel}</span>}
                <span className={`map-location-badge${hasVerifiedMapPoint(activity) ? ' is-verified' : ' is-approximate'}`}>
                  {hasVerifiedMapPoint(activity) ? <ShieldCheck size={13} aria-hidden="true" /> : <MapPin size={13} aria-hidden="true" />}
                  {hasVerifiedMapPoint(activity) ? t('map.locationVerified') : t('map.locationUnverified')}
                </span>
              </span>
              <strong className="map-result-name">{activity.name}</strong>
              <span className="map-result-address">{activity.locationName ? `${activity.locationName} · ` : ''}{activity.city}</span>
              <span className="map-result-meta"><span>{activity.price} DT</span>{activity.reviewCount > 0 && <span><Star size={14} fill="currentColor" aria-hidden="true" />{activity.rating.toFixed(1)} ({activity.reviewCount})</span>}</span>
            </span>
            <ArrowUpRight className="map-result-arrow" size={17} aria-hidden="true" />
          </Link>)}
          {!visibleActivities.length && <p className="map-results-empty">{search ? t('map.noSearchResults') : t('map.noActivities')}</p>}
        </div>
      </aside>
    </div>
    {activities.length > mappedCount && <p role="status">{activities.length - mappedCount} {t('map.noCityCoordinates')}</p>}
    {located.length === 0 && approximateCount > 0 && <p role="status">{t('map.noVerifiedPoints')}</p>}
  </section>;
}
