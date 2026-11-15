import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest, ApiError } from '../services/apiClient';
import {
  createActivityReview,
  fetchActivityReviews,
  mapBackendToActivity,
  type BackendActivity,
  type PublicReview,
} from '../services/activityApi';
import type { DemoActivity } from '../data/demoActivities';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import {
  ActivityDetailHero,
  ActivityAboutSection,
  ActivityMenuSection,
  ActivityEventsSection,
  ActivityLocationMap,
  ActivityReviewsSection,
  ActivityBookingSidebar,
  ActivitySuggestionsSection,
} from '../components/activity-detail';
import '../styles/activity-detail.css';

export function ActivityDetailView() {
  const { activityId = '' } = useParams();
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();
  const { user, openAuth } = useAuth();

  const [activity, setActivity] = useState<DemoActivity | null>(null);
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // État formulaire d'avis
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);

  // 1. Chargement de l'activité
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    apiRequest<{ activity: BackendActivity }>(`/activities/${encodeURIComponent(activityId)}`)
      .then(({ activity: result }) => {
        if (active) {
          setActivity(mapBackendToActivity(result, language));
          setError(false);
        }
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activityId, language]);

  // 2. Chargement des avis réels
  const loadReviews = async () => {
    try {
      const payload = await fetchActivityReviews(activityId);
      const list = payload.reviews || [];
      setReviews(list);
      if (list.length > 0) {
        setAverageRating(payload.averageRating || 0);
        setReviewsCount(payload.reviewsCount ?? payload.count ?? list.length);
      } else {
        setAverageRating(0);
        setReviewsCount(0);
      }
    } catch {
      // Pas d'avis encore enregistrés
    }
  };

  useEffect(() => {
    loadReviews();
  }, [activityId]);

  // 3. Soumission d'un avis client
  const submitReview = async (rating: number, comment: string) => {
    if (!user) {
      openAuth('login', () => submitReview(rating, comment));
      return;
    }

    setReviewBusy(true);
    setReviewError('');
    setReviewMessage('');

    try {
      await createActivityReview(activityId, rating, comment);
      setReviewMessage(t('reviews.pending'));
      await loadReviews();
      setTimeout(() => setReviewMessage(''), 5000);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        openAuth('login');
      } else {
        setReviewError(cause instanceof Error ? cause.message : t('reviews.submitError'));
      }
    } finally {
      setReviewBusy(false);
    }
  };

  if (error) {
    return (
      <main className="activity-detail-container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '12px' }}>
          {t('detail.unavailable')}
        </h1>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="activity-detail-back-btn"
          style={{ display: 'inline-flex', margin: '0 auto' }}
        >
          {isRTL ? <ArrowRight size={16} aria-hidden="true" /> : <ArrowLeft size={16} aria-hidden="true" />}
          <span>{t('detail.back')}</span>
        </button>
      </main>
    );
  }

  if (isLoading || !activity) {
    return (
      <main className="activity-detail-container" style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-primary)' }}>
          <Loader2 size={24} className="auth-spin" aria-hidden="true" />
          <span style={{ fontWeight: 700 }}>{t('auth.loading')}</span>
        </div>
      </main>
    );
  }

  return (
    <main className="activity-detail-container" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Hero visuel avec bouton retour et favori */}
      <ActivityDetailHero activity={activity} onBack={() => navigate(-1)} />

      {/* Grille principale : Contenu & Sidebar Sticky */}
      <div className="activity-detail-grid">
        {/* Colonne Principale (Gauche) */}
        <div className="activity-detail-main-col">
          {/* Présentation & Équipements */}
          <ActivityAboutSection activity={activity} />

          {/* Carte, Menu & Tarifs */}
          <ActivityMenuSection activity={activity} />

          {/* Événements & Soirées si disponibles */}
          {activity.events && activity.events.length > 0 && (
            <ActivityEventsSection events={activity.events} />
          )}

          {/* Section Carte Interactive & Itinéraire */}
          <ActivityLocationMap activity={activity} />

          {/* Section Avis, Notes & Commentaires Visiteurs */}
          <ActivityReviewsSection
            reviews={reviews}
            averageRating={averageRating}
            reviewsCount={reviewsCount}
            onSubmitReview={submitReview}
            isSubmitting={reviewBusy}
            submitMessage={reviewMessage}
            submitError={reviewError}
          />
        </div>

        {/* Colonne Latérale Sticky (Droite) : Réservation & Contact */}
        <ActivityBookingSidebar
          activity={activity}
          averageRating={averageRating}
          reviewsCount={reviewsCount}
        />
      </div>

      {/* Section Pleine Largeur : Sorties Similaires & Suggestions Intelligentes */}
      <ActivitySuggestionsSection currentActivity={activity} />
    </main>
  );
}
