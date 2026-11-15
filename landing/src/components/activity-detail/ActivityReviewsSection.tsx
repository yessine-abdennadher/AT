import React, { useState, useMemo, type FormEvent } from 'react';
import {
  Star,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  PenSquare,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import type { PublicReview } from '../../services/activityApi';
import { useLanguage } from '../../context/LanguageContext';

interface ActivityReviewsSectionProps {
  reviews: PublicReview[];
  averageRating: number;
  reviewsCount: number;
  onSubmitReview: (rating: number, comment: string) => Promise<void>;
  isSubmitting: boolean;
  submitMessage: string;
  submitError: string;
}

type FilterType = 'all' | 'recent' | 'top';

const RATING_LABELS: Record<number, string> = {
  5: 'Exceptionnel',
  4: 'Très bien',
  3: 'Correct / Moyen',
  2: 'Décevant',
  1: 'À éviter',
};

export const ActivityReviewsSection: React.FC<ActivityReviewsSectionProps> = ({
  reviews,
  averageRating,
  reviewsCount,
  onSubmitReview,
  isSubmitting,
  submitMessage,
  submitError,
}) => {
  const { t, language } = useLanguage();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [visibleLimit, setVisibleLimit] = useState(3);

  // 1. Calcul de la répartition des notes (Breakdown)
  const breakdown = useMemo(() => {
    const total = reviews.length;
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const rounded = Math.min(5, Math.max(1, Math.round(r.rating)));
      counts[rounded] = (counts[rounded] || 0) + 1;
    });

    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: counts[star],
      percent: total > 0 ? Math.round((counts[star] / total) * 100) : 0,
    }));
  }, [reviews]);

  // 2. Filtrage & Tri des avis
  const filteredReviews = useMemo(() => {
    let result = [...reviews];
    if (activeFilter === 'recent') {
      result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (activeFilter === 'top') {
      result = result.filter((r) => Math.round(r.rating) >= 4);
      result.sort((a, b) => b.rating - a.rating);
    }
    return result;
  }, [reviews, activeFilter]);

  const displayedReviews = filteredReviews.slice(0, visibleLimit);
  const hasMore = filteredReviews.length > visibleLimit;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!comment.trim()) return;
    await onSubmitReview(rating, comment.trim());
    setComment('');
  };

  return (
    <div className="activity-detail-card-panel" id="section-avis">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
        <h2 className="activity-detail-section-title" style={{ margin: 0 }}>
          <Star size={22} color="#F59E0B" aria-hidden="true" />
          <span>{t('reviews.title')}</span>
        </h2>

        {/* Bouton CTA d'en-tête : Laisser un avis */}
        <button
          type="button"
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="btn btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            fontSize: '0.88rem',
            borderRadius: 'var(--radius-full)',
          }}
          aria-expanded={isFormOpen}
        >
          {isFormOpen ? <X size={16} aria-hidden="true" /> : <PenSquare size={16} aria-hidden="true" />}
          <span>{isFormOpen ? 'Fermer le formulaire' : 'Donner mon avis'}</span>
        </button>
      </div>

      <div className="activity-detail-reviews-wrapper">
        {/* En-tête : Score Global + Barres de Répartition */}
        <div className="activity-detail-reviews-header">
          <div className="activity-detail-reviews-stats">
            <div className="activity-detail-reviews-big-score">
              <span>{reviewsCount > 0 ? averageRating.toFixed(1) : '0.0'}</span>
              <span className="activity-detail-reviews-big-star">★</span>
            </div>
            <div>
              <div className="activity-detail-reviews-subtext">
                {reviewsCount > 0
                  ? `${reviewsCount} ${t('reviews.count')} certifiés`
                  : t('reviews.empty')}
              </div>
              <div style={{ display: 'flex', gap: '3px', color: '#F59E0B', marginTop: '4px' }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={15}
                    fill={s <= Math.round(averageRating) ? '#F59E0B' : 'transparent'}
                    color="#F59E0B"
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Barres de répartition (5★ à 1★) */}
          {reviews.length > 0 && (
            <div className="activity-detail-rating-breakdown" aria-label="Répartition des notes">
              {breakdown.map(({ star, count, percent }) => (
                <div key={star} className="activity-detail-breakdown-row">
                  <span style={{ minWidth: '22px', fontWeight: 700 }}>{star} ★</span>
                  <div className="activity-detail-breakdown-bar-bg">
                    <div
                      className="activity-detail-breakdown-bar-fill"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="activity-detail-breakdown-percent">{percent}%</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({count})</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Volet Formulaire de Dépôt d'Avis (Directement accessible) */}
        {isFormOpen && (
          <div className="activity-detail-review-form-box" style={{ animation: 'fadeIn 0.25s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 className="activity-detail-form-title" style={{ margin: 0 }}>
                Votre avis d'explorateur
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Sélecteur d'étoiles interactif avec libellé dynamique */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                <div className="activity-detail-star-selector" style={{ margin: 0 }}>
                  {[1, 2, 3, 4, 5].map((s) => {
                    const filled = (hoverRating || rating) >= s;
                    return (
                      <button
                        key={s}
                        type="button"
                        className={`activity-detail-star-btn ${filled ? 'active' : ''}`}
                        onClick={() => setRating(s)}
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(0)}
                        aria-label={`${s} étoiles sur 5`}
                      >
                        <Star
                          size={24}
                          fill={filled ? '#F59E0B' : 'transparent'}
                          color="#F59E0B"
                          aria-hidden="true"
                        />
                      </button>
                    );
                  })}
                </div>

                <span
                  style={{
                    fontWeight: 800,
                    color: '#F59E0B',
                    fontSize: '0.95rem',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(245, 158, 11, 0.1)',
                  }}
                >
                  {RATING_LABELS[hoverRating || rating]} ({hoverRating || rating}/5)
                </span>
              </div>

              <textarea
                className="activity-detail-textarea"
                placeholder="Partagez votre expérience réelle (accueil, ambiance, propreté, rapport qualité/prix, conseils pour les prochains visiteurs...)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                minLength={3}
                maxLength={1000}
                style={{ minHeight: '110px' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '-10px', marginBottom: '16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>Minimum 3 caractères</span>
                <span>{comment.length} / 1000</span>
              </div>

              {submitMessage && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#059669',
                    marginBottom: '14px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(16, 185, 129, 0.1)',
                  }}
                  role="status"
                >
                  <CheckCircle2 size={16} aria-hidden="true" />
                  <span>{submitMessage}</span>
                </div>
              )}

              {submitError && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#E11D48',
                    marginBottom: '14px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(225, 29, 72, 0.1)',
                  }}
                  role="alert"
                >
                  <AlertCircle size={16} aria-hidden="true" />
                  <span>{submitError}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: '10px 18px', borderRadius: 'var(--radius-full)', fontSize: '0.9rem' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="activity-detail-submit-review-btn"
                  disabled={isSubmitting || !comment.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="auth-spin" aria-hidden="true" />
                      <span>{t('auth.working')}</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} aria-hidden="true" />
                      <span>Publier mon avis</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Barre de Filtres de tri rapides */}
        {reviews.length > 0 && (
          <div className="activity-detail-reviews-filters" role="group" aria-label="Filtrer les avis">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, marginInlineEnd: '6px' }}>
              <SlidersHorizontal size={14} aria-hidden="true" />
              <span>Trier par :</span>
            </span>

            <button
              type="button"
              className={`activity-detail-filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              Tous ({reviews.length})
            </button>

            <button
              type="button"
              className={`activity-detail-filter-pill ${activeFilter === 'recent' ? 'active' : ''}`}
              onClick={() => setActiveFilter('recent')}
            >
              Plus récents
            </button>

            <button
              type="button"
              className={`activity-detail-filter-pill ${activeFilter === 'top' ? 'active' : ''}`}
              onClick={() => setActiveFilter('top')}
            >
              Excellents (4★ & 5★)
            </button>
          </div>
        )}

        {/* Liste des Avis Clients */}
        {reviews.length > 0 ? (
          <div className="activity-detail-reviews-list">
            {displayedReviews.map((rev) => {
              const authorName = rev.userName || rev.user?.name || t('reviews.member');
              const initial = authorName.charAt(0).toUpperCase();

              return (
                <div key={rev._id} className="activity-detail-review-card">
                  <div className="activity-detail-review-top">
                    <div className="activity-detail-review-author">
                      <div className="activity-detail-review-avatar" aria-hidden="true">
                        {initial}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <p className="activity-detail-review-name">{authorName}</p>
                          <span className="activity-detail-verified-badge">
                            <CheckCircle2 size={12} aria-hidden="true" />
                            <span>Visite vérifiée</span>
                          </span>
                        </div>
                        <span className="activity-detail-review-date">
                          {rev.createdAt
                            ? new Date(rev.createdAt).toLocaleDateString(language, { year: 'numeric', month: 'long', day: 'numeric' })
                            : 'Récemment'}
                        </span>
                      </div>
                    </div>

                    <div className="activity-detail-review-stars">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          fill={s <= rev.rating ? '#F59E0B' : 'transparent'}
                          color="#F59E0B"
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  </div>

                  <p className="activity-detail-review-text">{rev.comment}</p>
                </div>
              );
            })}

            {/* Bouton d'affichage progressif "Voir plus" / "Réduire" */}
            {hasMore ? (
              <button
                type="button"
                onClick={() => setVisibleLimit((curr) => curr + 4)}
                className="activity-detail-show-more-btn"
              >
                <ChevronDown size={17} aria-hidden="true" />
                <span>Afficher plus d'avis ({filteredReviews.length - visibleLimit} restants)</span>
              </button>
            ) : filteredReviews.length > 3 && (
              <button
                type="button"
                onClick={() => setVisibleLimit(3)}
                className="activity-detail-show-more-btn"
                style={{ width: 'fit-content', margin: '8px auto 0' }}
              >
                <ChevronUp size={17} aria-hidden="true" />
                <span>Réduire les avis</span>
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              padding: '36px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.92rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              background: 'var(--bg-main)',
              borderRadius: 'var(--radius-lg)',
              border: '1.5px dashed var(--border-subtle)',
            }}
          >
            <MessageSquare size={32} color="var(--color-primary)" opacity={0.7} aria-hidden="true" />
            <span style={{ fontWeight: 600 }}>Soyez le premier voyageur à partager votre retour d'expérience !</span>
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="btn btn-primary"
              style={{ marginTop: '6px', padding: '8px 18px', borderRadius: 'var(--radius-full)', fontSize: '0.85rem' }}
            >
              Écrire le premier avis
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
