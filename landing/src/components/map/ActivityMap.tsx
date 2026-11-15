import { divIcon } from 'leaflet';
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { DemoActivity } from '../../data/demoActivities';
import { useLanguage } from '../../context/LanguageContext';
import { groupUnverifiedActivitiesByCity, hasVerifiedMapPoint, type MapCity } from './mapUtils';
import 'leaflet/dist/leaflet.css';
import '../../styles/activity-map.css';

function Recenter({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => { if (position) map.setView(position, 13); }, [map, position]);
  return null;
}

function FitMapPoints({ points, userPosition }: { points: [number, number][]; userPosition: [number, number] | null }) {
  const map = useMap();
  const pointKey = points.map(([latitude, longitude]) => `${latitude},${longitude}`).join('|');
  useEffect(() => {
    if (userPosition || !points.length) return;
    if (points.length === 1) map.setView(points[0], 11);
    else map.fitBounds(points, { padding: [28, 28], maxZoom: 11 });
  // pointKey captures coordinate changes without refitting on each render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, pointKey, userPosition]);
  return null;
}

export function ActivityMap({ activities, cities, userPosition }: { activities: DemoActivity[]; cities: MapCity[]; userPosition: [number, number] | null }) {
  const { t, language } = useLanguage();
  const exactActivities = activities.filter(hasVerifiedMapPoint);
  const approximateGroups = groupUnverifiedActivitiesByCity(activities, cities);
  const points: [number, number][] = [
    ...exactActivities.map((activity) => [activity.coordinates!.latitude!, activity.coordinates!.longitude!] as [number, number]),
    ...approximateGroups.map(({ city }) => [city.coords!.latitude!, city.coords!.longitude!] as [number, number]),
  ];

  return <MapContainer className="activity-map" center={userPosition || [34.1, 9.5]} zoom={userPosition ? 12 : 6} scrollWheelZoom>
    <Recenter position={userPosition} />
    <FitMapPoints points={points} userPosition={userPosition} />
    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    {exactActivities.map((activity) => <CircleMarker key={activity.id} center={[activity.coordinates!.latitude!, activity.coordinates!.longitude!]} radius={9} pathOptions={{ color: '#0284C7', fillColor: '#38BDF8', fillOpacity: 0.95 }}>
      <Popup>
        {activity.imageUrl && <img className="map-popup-image" src={activity.imageUrl} alt={activity.name} loading="lazy" />}
        <strong>{activity.name}</strong><br />{activity.city}<br /><span className="map-pin-caption">{t('map.locationVerified')}</span><br /><Link to={`/activites/${encodeURIComponent(activity.id)}`}>{t('detail.fullPage')}</Link>
      </Popup>
    </CircleMarker>)}
    {approximateGroups.map(({ city, activities: cityActivities }) => {
      const center: [number, number] = [city.coords!.latitude!, city.coords!.longitude!];
      const label = language === 'ar' ? city.nameAr || city.name : language === 'en' ? city.nameEn || city.name : city.nameFr || city.name;
      const icon = divIcon({
        className: 'map-city-count-icon',
        html: `<span>${cityActivities.length}</span>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });
      return <Marker key={`city-${city.name}`} position={center} icon={icon} title={`${cityActivities.length} · ${label}`} alt={`${cityActivities.length} ${t('map.cityActivities')}`}>
        <Popup>
          <strong>{label}</strong><br />
          <span className="map-pin-caption">{t('map.cityApproximate')}</span>
          <ul className="map-city-popup-list">
            {cityActivities.map((activity) => <li key={activity.id}>
              <Link to={`/activites/${encodeURIComponent(activity.id)}`}>
                {activity.imageUrl && <img className="map-city-popup-image" src={activity.imageUrl} alt="" loading="lazy" />}
                <span>{activity.name}</span>
              </Link>
            </li>)}
          </ul>
        </Popup>
      </Marker>;
    })}
  </MapContainer>;
}
