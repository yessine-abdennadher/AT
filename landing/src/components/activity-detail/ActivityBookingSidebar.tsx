import React from 'react';
import { Star, MessageCircle, Phone, ExternalLink, MapPin, Clock, Zap, ShieldCheck, Sparkles } from 'lucide-react';
import type { DemoActivity } from '../../data/demoActivities';
import { useLanguage } from '../../context/LanguageContext';

interface ActivityBookingSidebarProps {
  activity: DemoActivity;
  averageRating: number;
  reviewsCount: number;
}

export const ActivityBookingSidebar: React.FC<ActivityBookingSidebarProps> = ({
  activity,
  averageRating,
  reviewsCount,
}) => {
  const { t } = useLanguage();

  const cleanWhatsapp = (activity.whatsapp || '').replace(/[^0-9]/g, '');
  const cleanPhone = (activity.phone || '').trim();

  // Priorité aux avis réels reçus, avec repli sur la note officielle de l'activité
  const ratingValue = reviewsCount > 0 ? averageRating : (activity.rating || 0);
  const countValue = reviewsCount > 0 ? reviewsCount : (activity.reviewCount || 0);

  const mapsUrl =
    activity.coordinates?.latitude && activity.coordinates?.longitude
      ? `https://www.google.com/maps?q=${activity.coordinates.latitude},${activity.coordinates.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${activity.name} ${activity.locationName || activity.city}`
      )}`;

  return (
    <aside className="activity-detail-sidebar" aria-label="Réservation et contact">
      <div className="activity-detail-booking-card">
      

        {/* Prix & Note */}
        <div className="activity-detail-price-box">
          <div>
            {activity.price > 0 ? (
              <>
                <span className="activity-detail-price-amount">{activity.price} DT</span>
                <span className="activity-detail-price-label"> / personne</span>
              </>
            ) : (
              <span className="activity-detail-price-amount" style={{ color: 'var(--color-emerald, #10B981)', fontSize: '1.4rem' }}>
                Accès Libre
              </span>
            )}
          </div>

          {ratingValue > 0 ? (
            <div className="activity-detail-rating-pill">
              <Star size={15} fill="#D97706" color="#D97706" aria-hidden="true" />
              <span>{ratingValue.toFixed(1)}</span>
              {countValue > 0 && (
                <span style={{ fontSize: '0.8rem', opacity: 0.85, fontWeight: 600 }}>
                  ({countValue})
                </span>
              )}
            </div>
          ) : (
            <div
              className="activity-detail-rating-pill"
              style={{ background: 'rgba(2, 132, 199, 0.1)', color: 'var(--color-primary)' }}
            >
              <Sparkles size={14} aria-hidden="true" />
              <span>Nouveau lieu</span>
            </div>
          )}
        </div>

        {/* Actions de Contact Direct */}
        <div className="activity-detail-actions-list">
          {cleanWhatsapp && (
            <a
              href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
                `Bonjour, je souhaite réserver via Tfarhida : ${activity.name}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="activity-detail-btn-whatsapp"
            >
              <MessageCircle size={19} aria-hidden="true" />
              <span>Réserver sur WhatsApp</span>
            </a>
          )}

          {cleanPhone && (
            <a href={`tel:${cleanPhone}`} className="activity-detail-btn-phone">
              <Phone size={17} aria-hidden="true" />
              <span>
                {t('detail.call')} ({cleanPhone})
              </span>
            </a>
          )}

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="activity-detail-btn-phone"
            style={{ fontSize: '0.88rem' }}
          >
            <ExternalLink size={16} aria-hidden="true" />
            <span>Itinéraire Google Maps</span>
          </a>
        </div>

        {/* Informations pratiques */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            paddingTop: '14px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div className="activity-detail-info-row">
            <MapPin size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} aria-hidden="true" />
            <span>{activity.locationName || activity.city}</span>
          </div>

          <div className="activity-detail-info-row">
            <Clock size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} aria-hidden="true" />
            <span>Ouvert aujourd'hui</span>
          </div>

          {activity.lightingActive && (
            <div className="activity-detail-info-row" style={{ color: '#059669', fontWeight: 700 }}>
              <Zap size={16} color="#059669" style={{ flexShrink: 0 }} aria-hidden="true" />
              <span>Groupe secours électricité actif</span>
            </div>
          )}

          <div className="activity-detail-info-row" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <ShieldCheck size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} aria-hidden="true" />
            <span>Établissement vérifié Tfarhida</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
