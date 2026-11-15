import React from 'react';
import { ArrowLeft, ArrowRight, MapPin, Tag, Music } from 'lucide-react';
import type { DemoActivity } from '../../data/demoActivities';
import { FavoriteButton } from '../ui/FavoriteButton';
import { useLanguage } from '../../context/LanguageContext';

interface ActivityDetailHeroProps {
  activity: DemoActivity;
  onBack: () => void;
}

export const ActivityDetailHero: React.FC<ActivityDetailHeroProps> = ({ activity, onBack }) => {
  const { t, isRTL } = useLanguage();
  const hasPromo = Boolean(activity.promotion?.isPromo && activity.promotion.discountPercent > 0);
  const hasEvents = Boolean(activity.events && activity.events.length > 0);

  return (
    <>
      {/* 1. Barre de navigation & retour */}
      <div className="activity-detail-back-bar">
        <button
          type="button"
          onClick={onBack}
          className="activity-detail-back-btn"
          aria-label={t('detail.back')}
        >
          {isRTL ? <ArrowRight size={16} aria-hidden="true" /> : <ArrowLeft size={16} aria-hidden="true" />}
          <span>{t('detail.back')}</span>
        </button>

        <FavoriteButton activityId={activity.id} />
      </div>

      {/* 2. Hero Média Immersif */}
      <div className="activity-detail-hero-box">
        <img
          src={activity.imageUrl || '/hero-poster.jpg'}
          alt={activity.name}
          className="activity-detail-hero-img"
        />

        <div className="activity-detail-hero-overlay">
          <div className="activity-detail-hero-top">
            <div className="activity-detail-badges-row">
              <span className="activity-detail-hero-badge">
                {activity.categoryLabel}
              </span>

              {hasPromo && (
                <span className="activity-detail-hero-badge promo-badge">
                  <Tag size={12} aria-hidden="true" />
                  <span>-{activity.promotion?.discountPercent}% Promo</span>
                </span>
              )}

              {hasEvents && (
                <span className="activity-detail-hero-badge live-badge">
                  <Music size={12} aria-hidden="true" />
                  <span>Soirée Live</span>
                </span>
              )}
            </div>
          </div>

          <div className="activity-detail-hero-bottom">
            <h1 className="activity-detail-hero-title">{activity.name}</h1>
            {activity.nameAr && (
              <span
                style={{
                  fontSize: '1.25rem',
                  fontFamily: 'var(--font-arabic)',
                  color: 'var(--color-cyan-glow, #38BDF8)',
                  fontWeight: 800,
                }}
              >
                {activity.nameAr}
              </span>
            )}
            <div className="activity-detail-hero-location">
              <MapPin size={16} color="var(--color-cyan-glow, #38BDF8)" aria-hidden="true" />
              <span>{activity.locationName || activity.city}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
