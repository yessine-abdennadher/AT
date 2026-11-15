import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { MapPin, ExternalLink, Navigation } from 'lucide-react';
import type { DemoActivity } from '../../data/demoActivities';
import 'leaflet/dist/leaflet.css';

interface ActivityLocationMapProps {
  activity: DemoActivity;
}

const CITY_COORDINATES: Record<string, [number, number]> = {
  sfax: [34.7406, 10.7603],
  tunis: [36.8065, 10.1815],
  sousse: [35.8256, 10.6369],
  djerba: [33.8076, 10.8451],
  monastir: [35.7779, 10.8261],
  bizerte: [37.2744, 9.8739],
  nabeul: [36.4561, 10.7376],
  hammamet: [36.4000, 10.6167],
  mahdia: [35.5047, 11.0622],
  kairouan: [35.6781, 10.0963],
  ariana: [36.8665, 10.1647],
  'la marsa': [36.8782, 10.3247],
  tozeur: [33.9197, 8.1335],
  gabès: [33.8815, 10.0982],
  gabes: [33.8815, 10.0982],
  gafsa: [34.4250, 8.7842],
};

const customPinIcon = divIcon({
  className: 'activity-detail-map-pin',
  html: `<div class="pin-pulse"></div><div class="pin-dot"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 32],
});

export const ActivityLocationMap: React.FC<ActivityLocationMapProps> = ({ activity }) => {
  const normCity = (activity.city || 'sfax').trim().toLowerCase();
  const defaultCoords: [number, number] = CITY_COORDINATES[normCity] || [34.7406, 10.7603];

  const hasCoords =
    activity.coordinates?.latitude &&
    activity.coordinates?.longitude &&
    activity.coordinates.latitude >= 30 &&
    activity.coordinates.latitude <= 38;

  const position: [number, number] = hasCoords
    ? [activity.coordinates!.latitude!, activity.coordinates!.longitude!]
    : defaultCoords;

  const mapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${position[0]},${position[1]}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${activity.name} ${activity.locationName || activity.city}`
      )}`;

  return (
    <div className="activity-detail-card-panel">
      <h2 className="activity-detail-section-title">
        <MapPin size={22} color="var(--color-primary)" aria-hidden="true" />
        <span>Localisation & Itinéraire</span>
      </h2>

      <div className="activity-detail-map-wrapper">
        <MapContainer
          center={position}
          zoom={hasCoords ? 14 : 12}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} icon={customPinIcon}>
            <Popup>
              <strong>{activity.name}</strong>
              <br />
              <span>{activity.locationName || activity.city}</span>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      <div className="activity-detail-map-footer">
        <div className="activity-detail-map-address">
          <Navigation size={16} color="var(--color-primary)" aria-hidden="true" />
          <span>{activity.locationName || `${activity.name}, ${activity.city}`}</span>
        </div>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem',
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
          }}
        >
          <ExternalLink size={15} aria-hidden="true" />
          <span>Ouvrir l'itinéraire Google Maps</span>
        </a>
      </div>
    </div>
  );
};
