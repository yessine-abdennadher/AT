import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../services/apiClient';
import { mapBackendToActivity, type BackendActivity } from '../services/activityApi';
import type { DemoActivity } from '../data/demoActivities';
import { AccountHeader, AccountNavTabs, FavoritesGrid } from '../components/account';
import '../styles/account-views.css';

export const FavoritesView: React.FC = () => {
  const navigate = useNavigate();
  const { user, status, openAuth, favoriteIds } = useAuth();
  const { t, language } = useLanguage();

  const [favorites, setFavorites] = useState<DemoActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    let alive = true;
    setLoading(true);
    setError('');

    apiRequest<{ activities?: BackendActivity[]; favorites?: BackendActivity[]; favoriteIds?: string[] }>(
      '/auth/favorites'
    )
      .then((payload) => {
        const records = payload.activities || payload.favorites || [];
        if (alive) {
          setFavorites(
            records
              .filter((record) => record.isApproved !== false)
              .map((record) => mapBackendToActivity(record, language))
          );
        }
      })
      .catch((cause) => {
        if (alive) setError(cause instanceof Error ? cause.message : t('account.loadError'));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [user, language, t, favoriteIds.length]);

  if (status === 'loading') {
    return (
      <main className="account-page-wrapper" aria-busy="true">
        <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-secondary)' }}>
          <Sparkles
            size={36}
            color="var(--color-primary)"
            style={{ animation: 'spin 2s linear infinite', margin: '0 auto 16px' }}
          />
          <p role="status" style={{ fontWeight: 700 }}>
            {t('auth.loading')}
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="account-page-wrapper">
        <div className="favorites-empty-state">
          <div className="favorites-empty-icon">
            <Lock size={32} />
          </div>
          <h1 className="favorites-empty-title">{t('nav.favorites')}</h1>
          <p className="favorites-empty-desc">{t('account.signInRequired')}</p>
          <button className="btn btn-primary" onClick={() => openAuth('login')}>
            {t('auth.login')}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="account-page-wrapper">
      <AccountHeader user={user} favoritesCount={favorites.length} />

      <AccountNavTabs activeTab="favorites" favoritesCount={favorites.length} />

      <FavoritesGrid
        favorites={favorites}
        loading={loading}
        error={error}
        onSelectActivity={(id) => navigate(`/activites/${encodeURIComponent(id)}`)}
      />
    </main>
  );
};
