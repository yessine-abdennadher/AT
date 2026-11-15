import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, MapPin, Star, Compass, Zap, Tag, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import type { DemoActivity } from '../../data/demoActivities';
import { fetchActivityExplorerData } from '../../services/activityApi';
import { useLanguage } from '../../context/LanguageContext';
import { FavoriteButton } from '../ui/FavoriteButton';

interface ActivitySuggestionsSectionProps {
  currentActivity: DemoActivity;
}

const normalizeStr = (val?: string) =>
  (val || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const isPromoValid = (activity: DemoActivity): boolean => {
  if (!activity.promotion?.isPromo || activity.promotion.discountPercent <= 0) return false;
  if (!activity.promotion.validUntil) return true;
  const expiry = Date.parse(activity.promotion.validUntil);
  return Number.isNaN(expiry) || expiry >= Date.now();
};

/**
 * Algorithme Hybride Intelligent Tfarhida :
 * 1. Ancrage Géographique Souverain : Même Ville = +200 pts (inviolable par une autre ville)
 * 2. Pertinence Thématique & Budget : Même Catégorie (+25), Même Type (+10), Budget proche (+10) = max +45 pts
 * 3. Boost Abonnement Partenaire : Premium / Featured (+35 pts), Pro (+20 pts), Standard (+0 pt)
 * 4. Qualité & Preuve Sociale : Note x 3 (+15 max) + Volume d'avis (+5 max) = max +20 pts
 * 5. Dynamisme Temps Réel : Promo active (+10), Soirée Live (+6), Secours électrique (+4) = max +20 pts
 */
export function computeSuggestionScore(current: DemoActivity, candidate: DemoActivity): number {
  let score = 0;

  // 1. Pilier Géographique Souverain (+200 pts)
  const sameCity =
    Boolean(current.city && candidate.city) &&
    normalizeStr(current.city) === normalizeStr(candidate.city);
  if (sameCity) {
    score += 200;
  }

  // 2. Pilier Pertinence Thématique & Budget (max +45 pts)
  if (candidate.category === current.category) {
    score += 25;
  }
  if (current.type && candidate.type && candidate.type === current.type) {
    score += 10;
  }
  if (Math.abs((candidate.price || 0) - (current.price || 0)) <= 15) {
    score += 10;
  }

  // 3. Pilier Abonnement Partenaire (max +35 pts)
  if (candidate.partnerTier === 'premium' || candidate.isFeatured) {
    score += 35;
  } else if (candidate.partnerTier === 'pro') {
    score += 20;
  }

  // 4. Pilier Qualité & Preuve Sociale (max +20 pts)
  const ratingScore = Math.min(15, (candidate.rating || 0) * 3);
  const reviewsBonus = Math.min(5, Math.log10((candidate.reviewCount || 0) + 1) * 2.5);
  score += ratingScore + reviewsBonus;

  // 5. Pilier Dynamisme Live (max +20 pts)
  if (isPromoValid(candidate)) {
    score += 10;
  }
  if (candidate.events && candidate.events.length > 0) {
    score += 6;
  }
  if (candidate.lightingActive) {
    score += 4;
  }

  return score;
}

export const ActivitySuggestionsSection: React.FC<ActivitySuggestionsSectionProps> = ({
  currentActivity,
}) => {
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const [suggestions, setSuggestions] = useState<DemoActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Référence pour le carrousel balayable
  const railRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const checkScrollState = useCallback(() => {
    const el = railRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = Math.max(0, scrollWidth - clientWidth - 4);

    if (maxScroll <= 2) {
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }

    if (isRTL) {
      const abs = Math.abs(scrollLeft);
      setCanScrollPrev(abs < maxScroll);
      setCanScrollNext(abs > 4);
    } else {
      setCanScrollPrev(scrollLeft > 4);
      setCanScrollNext(scrollLeft < maxScroll);
    }
  }, [isRTL]);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    fetchActivityExplorerData(language, { limit: 50 })
      .then((data) => {
        if (!alive) return;
        // Garde-fou strict : Exclure systématiquement l'activité courante
        const candidates = (data.activities || []).filter(
          (item) => item.id && item.id !== currentActivity.id
        );

        // Sélection des 8-10 meilleures suggestions pour le rail balayable
        const ranked = candidates
          .map((item) => ({
            item,
            score: computeSuggestionScore(currentActivity, item),
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 10)
          .map((entry) => entry.item);

        setSuggestions(ranked);
      })
      .catch(() => {
        if (alive) setSuggestions([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [currentActivity, language]);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;

    checkScrollState();
    el.addEventListener('scroll', checkScrollState, { passive: true });
    window.addEventListener('resize', checkScrollState);

    return () => {
      el.removeEventListener('scroll', checkScrollState);
      window.removeEventListener('resize', checkScrollState);
    };
  }, [checkScrollState, suggestions, loading]);

  const handleScroll = (direction: 'prev' | 'next') => {
    const el = railRef.current;
    if (!el) return;

    // Défilement par saut de 2 cartes (~600px ou 75% du viewport)
    const cardStep = Math.max(300, el.clientWidth * 0.72);
    const sign = direction === 'next' ? 1 : -1;
    const scrollDistance = (isRTL ? -1 : 1) * sign * cardStep;

    el.scrollBy({ left: scrollDistance, behavior: 'smooth' });
  };

  if (!loading && suggestions.length === 0) {
    return null;
  }

  const handleOpenSuggestion = (activityId: string) => {
    navigate(`/activites/${encodeURIComponent(activityId)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="activity-suggestions-section" aria-label="Sorties similaires recommandées">
      <div className="activity-suggestions-header">
        <div className="activity-suggestions-header-left">
          <div className="activity-suggestions-eyebrow">
            <Sparkles size={14} aria-hidden="true" />
            <span>Sélection Intelligente Tfarhida</span>
          </div>
          <h2 className="activity-suggestions-title">
            Vous aimerez aussi à {currentActivity.city || 'proximité'}
          </h2>
          <p className="activity-suggestions-subtitle">
            Des adresses vérifiées dans votre ville, sélectionnées selon vos goûts et nos partenaires privilégiés.
          </p>
        </div>

        {/* Contrôles de défilement Desktop style Airbnb / GetYourGuide */}
        <div className="activity-suggestions-nav-btns" aria-label="Navigation suggestions">
          <button
            type="button"
            className="activity-suggestions-nav-btn"
            onClick={() => handleScroll('prev')}
            disabled={!canScrollPrev}
            aria-label={isRTL ? 'Suivant' : 'Précédent'}
            title={isRTL ? 'Suivant' : 'Précédent'}
          >
            {isRTL ? <ChevronRight size={18} aria-hidden="true" /> : <ChevronLeft size={18} aria-hidden="true" />}
          </button>
          <button
            type="button"
            className="activity-suggestions-nav-btn"
            onClick={() => handleScroll('next')}
            disabled={!canScrollNext}
            aria-label={isRTL ? 'Précédent' : 'Suivant'}
            title={isRTL ? 'Précédent' : 'Suivant'}
          >
            {isRTL ? <ChevronLeft size={18} aria-hidden="true" /> : <ChevronRight size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div
        className="activity-suggestions-rail"
        ref={railRef}
        role="region"
        aria-label="Carrousel de suggestions"
        tabIndex={0}
      >
        {loading ? (
          [1, 2, 3, 4].map((skeleton) => (
            <div key={skeleton} className="activity-suggestion-skeleton" />
          ))
        ) : (
          suggestions.map((item) => {
            const isPremium = item.partnerTier === 'premium' || item.isFeatured;
            const isPro = item.partnerTier === 'pro';
            const hasPromo = isPromoValid(item);

            return (
              <article
                key={item.id}
                className={`activity-suggestion-card ${isPremium ? 'is-premium-card' : ''}`}
                onClick={() => handleOpenSuggestion(item.id)}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenSuggestion(item.id);
                  }
                }}
                aria-label={`${item.name} à ${item.city}`}
              >
                <div className="activity-suggestion-media">
                  <FavoriteButton activityId={item.id} />

                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="activity-suggestion-img"
                      loading="lazy"
                    />
                  ) : (
                    <div className="activity-suggestion-fallback">
                      <Compass size={36} opacity={0.6} aria-hidden="true" />
                    </div>
                  )}

                  {/* Badges Haut-Gauche : Partenaire Premium / Pro ou Promo */}
                  <div className="activity-suggestion-top-badges">
                    {isPremium && (
                      <span className="activity-suggestion-tier-badge premium">
                        <Award size={12} aria-hidden="true" />
                        <span>Recommandé</span>
                      </span>
                    )}
                    {!isPremium && isPro && (
                      <span className="activity-suggestion-tier-badge pro">
                        <Sparkles size={11} aria-hidden="true" />
                        <span>Sélection Pro</span>
                      </span>
                    )}
                    {hasPromo && (
                      <span className="activity-suggestion-promo-badge">
                        <Tag size={11} aria-hidden="true" />
                        <span>-{item.promotion?.discountPercent}%</span>
                      </span>
                    )}
                  </div>

                  {/* Badge Catégorie Bas-Gauche */}
                  <span className="activity-suggestion-cat-badge">
                    {item.categoryLabel || item.category}
                  </span>

                  {/* Garantie Électricité Live */}
                  {item.lightingActive && (
                    <span className="activity-suggestion-power-pill" title="Groupe secours électrique actif">
                      <Zap size={12} fill="#FFFFFF" color="#FFFFFF" aria-hidden="true" />
                    </span>
                  )}
                </div>

                <div className="activity-suggestion-body">
                  <h3 className="activity-suggestion-name">{item.name}</h3>

                  <div className="activity-suggestion-location">
                    <MapPin size={14} color="var(--color-primary)" aria-hidden="true" />
                    <span>{item.locationName || item.city}</span>
                  </div>

                  <div className="activity-suggestion-footer">
                    <div className="activity-suggestion-rating">
                      <Star size={15} fill="#F59E0B" color="#F59E0B" aria-hidden="true" />
                      <span>{item.rating > 0 ? item.rating.toFixed(1) : 'Nouveau'}</span>
                      {item.reviewCount > 0 && (
                        <span className="activity-suggestion-reviews-count">({item.reviewCount})</span>
                      )}
                    </div>

                    <div className="activity-suggestion-price">
                      {item.price > 0 ? (
                        <>
                          <span>{item.price} DT</span>
                          <small> /pers</small>
                        </>
                      ) : (
                        <span style={{ color: 'var(--color-emerald, #10B981)' }}>Gratuit</span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
};
