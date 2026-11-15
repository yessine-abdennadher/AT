import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ApiError } from '../../services/apiClient';

interface FavoriteButtonProps {
  activityId: string;
  className?: string;
  style?: React.CSSProperties;
}

export function FavoriteButton({ activityId, className = '', style }: FavoriteButtonProps) {
  const { user, favoriteIds, openAuth, toggleFavorite } = useAuth();
  const { t } = useLanguage();
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const active = favoriteIds.includes(activityId);

  const onClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setError(false);

    if (!user) {
      openAuth('login', async () => {
        await toggleFavorite(activityId);
      });
      return;
    }

    setBusy(true);
    try {
      await toggleFavorite(activityId);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        openAuth('login', async () => {
          await toggleFavorite(activityId);
        });
      } else {
        setError(true);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`favorite-button ${active ? 'is-active' : ''} ${className}`}
        style={style}
        aria-pressed={active}
        aria-busy={busy}
        disabled={busy}
        aria-label={active ? t('favorite.remove') : t('favorite.add')}
        onClick={onClick}
      >
        <Heart
          size={18}
          className="favorite-heart-icon"
          fill={active ? '#EF4444' : 'rgba(15, 23, 42, 0.45)'}
          color={active ? '#EF4444' : '#FFFFFF'}
          strokeWidth={active ? 2.5 : 2}
          aria-hidden="true"
        />
      </button>
      {error && <span className="sr-only" role="status">{t('account.loadError')}</span>}
    </>
  );
}
