import React from 'react';
import { Heart, Compass, Sparkles, MapPin, Star, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { DemoActivity } from '../../data/demoActivities';
import { FavoriteButton } from '../ui/FavoriteButton';
import { useLanguage } from '../../context/LanguageContext';

interface FavoritesGridProps {
  favorites: DemoActivity[];
  loading: boolean;
  error?: string;
  onSelectActivity?: (activityId: string) => void;
}

export const FavoritesGrid: React.FC<FavoritesGridProps> = ({
  favorites,
  loading,
  error,
  onSelectActivity,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleCardClick = (activityId: string) => {
    if (onSelectActivity) {
      onSelectActivity(activityId);
    } else {
      navigate(`/activites/${encodeURIComponent(activityId)}`);
    }
  };

  return (
    <section aria-label="Mes sorties favorites">
      {error && (
        <div className="profile-alert profile-alert-error" role="alert" style={{ marginBottom: '24px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <Sparkles
            size={28}
            color="var(--color-primary)"
            style={{ animation: 'spin 2s linear infinite', margin: '0 auto 12px' }}
          />
          <p>{t('auth.loading')}</p>
        </div>
      ) : favorites.length === 0 ? (
        <div className="favorites-empty-state">
          <div className="favorites-empty-icon">
            <Heart size={32} />
          </div>
          <h2 className="favorites-empty-title">{t('account.emptyFavorites')}</h2>
          <p className="favorites-empty-desc">
            Retrouvez ici tous les cafés, restaurants, activités et loisirs que vous avez aimés en cliquant sur le cœur.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Compass size={18} aria-hidden="true" />
            <span>{t('nav.exploreOutings')}</span>
          </button>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map((activity) => (
            <article
              key={activity.id}
              className="favorite-card"
              onClick={() => handleCardClick(activity.id)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCardClick(activity.id);
              }}
              aria-label={`${activity.name} à ${activity.city}`}
            >
              <div className="favorite-card-media">
                <div className="favorite-card-heart">
                  <FavoriteButton activityId={activity.id} />
                </div>
                {activity.imageUrl ? (
                  <img
                    src={activity.imageUrl}
                    alt={activity.name}
                    className="favorite-card-img"
                    loading="lazy"
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      background: 'linear-gradient(135deg, #0284C7 0%, #060B24 100%)',
                    }}
                  >
                    <Compass size={40} opacity={0.6} />
                  </div>
                )}
                <span className="favorite-card-badge">
                  {activity.categoryLabel || activity.category}
                </span>
              </div>

              <div className="favorite-card-body">
                <h3 className="favorite-card-title">{activity.name}</h3>
                <div className="favorite-card-location">
                  <MapPin size={15} color="var(--color-primary)" aria-hidden="true" />
                  <span>{activity.locationName || activity.city}</span>
                </div>

                <div className="favorite-card-footer">
                  <div className="favorite-card-rating">
                    <Star size={16} fill="#F59E0B" color="#F59E0B" aria-hidden="true" />
                    <span>{activity.rating.toFixed(1)}</span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.8rem' }}>
                      ({activity.reviewCount})
                    </span>
                  </div>

                  {activity.price > 0 ? (
                    <div className="favorite-card-price">{activity.price} DT</div>
                  ) : (
                    <div className="favorite-card-price" style={{ color: 'var(--color-emerald, #10B981)' }}>
                      Accès Libre
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
