import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getRecommendations } from '../../services/recommendationService';
import { mapBackendToActivity } from '../../services/activityApi';
import type { DemoActivity } from '../../data/demoActivities';
import { Sparkles, MapPin, Star, ArrowRight, ArrowLeft } from 'lucide-react';
import { FavoriteButton } from '../ui/FavoriteButton';
import '../../styles/user-discovery.css';

interface PersonalizedRecommendationsRailProps {
  onSelectActivity?: (activity: DemoActivity) => void;
}

export const PersonalizedRecommendationsRail: React.FC<PersonalizedRecommendationsRailProps> = ({
  onSelectActivity,
}) => {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const [recommendations, setRecommendations] = useState<DemoActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const fetchRecs = async () => {
      try {
        setLoading(true);
        const cityFilter = user?.city ? { city: user.city } : {};
        const payload = await getRecommendations(cityFilter, 'rating', 1);
        if (alive && payload.activities?.length) {
          const mapped = payload.activities.slice(0, 4).map((item) => mapBackendToActivity(item));
          setRecommendations(mapped);
        }
      } catch {
        // Fallback discret en cas d'erreur réseau
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchRecs();
    return () => {
      alive = false;
    };
  }, [user?.city]);

  if (loading || recommendations.length === 0) {
    return null; // N'affiche rien si pas de recommandations chargées
  }

  return (
    <section className="discovery-rail-section">
      <div className="discovery-rail-header">
        <div className="discovery-rail-title-group">
          <div className="discovery-rail-badge">
            <Sparkles size={13} />
            <span>{t('discovery.forYouTitle')}</span>
          </div>
          <h2 className="discovery-rail-title">{t('discovery.forYouTitle')}</h2>
          <p className="discovery-rail-subtitle">{t('discovery.forYouSubtitle')}</p>
        </div>

        <Link to="/recommandations" className="discovery-rail-link">
          <span>{t('discovery.seeAllRecommendations')}</span>
          {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
        </Link>
      </div>

      <div className="discovery-rail-scroll">
        {recommendations.map((activity, index) => {
          // Score de compatibilité simulé pour la recommandation
          const matchPercent = 95 - index * 3;

          return (
            <div
              key={activity.id}
              className="discovery-card-item"
              onClick={() => onSelectActivity?.(activity)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSelectActivity?.(activity);
              }}
            >
              <div className="discovery-card-img-box">
                <img
                  src={activity.imageUrl || '/hero-poster.jpg'}
                  alt={activity.name}
                  className="discovery-card-img"
                  loading="lazy"
                />
                <span className="discovery-card-category-badge">{activity.category}</span>
                <span className="discovery-card-match-badge">
                  <Sparkles size={11} />
                  <span>{matchPercent}% Match</span>
                </span>
                <FavoriteButton activityId={activity.id} />
              </div>

              <div className="discovery-card-body">
                <h3 className="discovery-card-title">{activity.name}</h3>

                <div className="discovery-card-meta">
                  <span className="discovery-card-location">
                    <MapPin size={13} />
                    <span>{activity.city}</span>
                  </span>
                  <span className="discovery-card-rating">
                    <Star size={13} fill="#F59E0B" color="#F59E0B" />
                    <span>{activity.rating.toFixed(1)}</span>
                  </span>
                </div>

                <div className="discovery-card-footer">
                  <span className="discovery-card-price">{activity.price} DT</span>
                  <span className="discovery-card-btn">
                    <span>Voir détails</span>
                    {isRTL ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
