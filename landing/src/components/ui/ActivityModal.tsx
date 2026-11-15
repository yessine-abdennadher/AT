import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { DemoActivity } from '../../data/demoActivities';
import { X, Star, MapPin, Zap, MessageCircle, Phone, Snowflake, Lightbulb } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { FavoriteButton } from './FavoriteButton';

interface ActivityModalProps {
  activity: DemoActivity | null;
  onClose: () => void;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({ activity, onClose }) => {
  const { t, isRTL } = useLanguage();

  // Verrouillage du défilement de l'arrière-plan et fermeture par touche Échap
  useEffect(() => {
    if (!activity) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activity, onClose]);

  if (!activity) return null;

  const phoneTarget = activity.phone;
  const whatsappTarget = (activity.whatsapp || '').replace(/[^0-9]/g, '');
  const promotionExpiry = activity.promotion?.validUntil ? Date.parse(activity.promotion.validUntil) : Number.NaN;
  const hasActivePromotion = Boolean(activity.promotion?.isPromo && activity.promotion.discountPercent > 0 &&
    (!activity.promotion.validUntil || Number.isNaN(promotionExpiry) || promotionExpiry >= Date.now()));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="no-scrollbar"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-xl)',
          border: '1.5px solid var(--border-strong)',
          position: 'relative',
          animation: 'fadeIn 0.2s ease',
          direction: isRTL ? 'rtl' : 'ltr',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton Favori */}
        <FavoriteButton
          activityId={activity.id}
          style={{
            position: 'absolute',
            top: '14px',
            left: isRTL ? 'auto' : '14px',
            right: isRTL ? '14px' : 'auto',
            zIndex: 10,
          }}
        />

        {/* Bouton Fermer */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '14px',
            right: isRTL ? 'auto' : '14px',
            left: isRTL ? '14px' : 'auto',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
          aria-label="Fermer"
        >
          <X size={20} />
        </button>

        {/* Image Principale */}
        <div style={{ position: 'relative', height: '240px', width: '100%' }}>
          <img
            src={activity.imageUrl}
            alt={activity.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: isRTL ? 'auto' : '12px',
              right: isRTL ? '12px' : 'auto',
              backgroundColor: 'rgba(16, 42, 86, 0.9)',
              color: '#FFFFFF',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 800,
            }}
          >
            {activity.categoryLabel}
          </div>

          {hasActivePromotion && (
            <div className="activity-promotion-badge activity-promotion-badge--details">
              <span>-{activity.promotion?.discountPercent}%</span>
              <span>{activity.promotion?.promoLabel || t('explorer.promotion')}</span>
            </div>
          )}
        </div>

        {/* Contenu */}
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <MapPin size={16} color="var(--color-primary)" />
              <span>{activity.locationName || activity.city}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {activity.reviewCount > 0 ? (
                <>
                  <Star size={18} color="#F59E0B" fill="#F59E0B" />
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-navy)' }}>
                    {activity.rating.toFixed(1)}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    ({activity.reviewCount} {t('modal.certifiedReviews')})
                  </span>
                </>
              ) : <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('explorer.newActivity')}</span>}
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-navy)', lineHeight: 1.25 }}>
              {isRTL && activity.nameAr ? activity.nameAr : activity.name}
            </h3>
            {isRTL && activity.name && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {activity.name}
              </span>
            )}
            {!isRTL && activity.nameAr && (
              <span style={{ fontSize: '0.9rem', fontFamily: 'var(--font-arabic)', color: 'var(--color-purple-signature)', fontWeight: 600 }}>
                {activity.nameAr}
              </span>
            )}
          </div>

          {/* Prix & Tarif */}
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                color: 'var(--color-primary)',
                backgroundColor: 'var(--color-pale-blue)',
                padding: '4px 12px',
                borderRadius: '8px',
              }}
            >
              {activity.price === 0 ? t('modal.freeAccess') : `${activity.price} DT ${t('explorer.perPerson')}`}
            </span>
            {activity.hasAirConditioning && (
              <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Snowflake size={13} color="var(--color-primary)" />
                <span>{t('modal.airConditioned')}</span>
              </span>
            )}
          </div>

          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
            {activity.description || activity.highlight}
          </p>

          {/* Électricité / Lumière vérifiée */}
          <div
            style={{
              backgroundColor: activity.lightingActive ? 'var(--color-emerald-light)' : 'var(--bg-main)',
              border: activity.lightingActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '24px',
            }}
          >
            <Zap size={20} color={activity.lightingActive ? '#059669' : '#64748B'} />
            <div style={{ fontSize: '0.85rem', color: activity.lightingActive ? '#065F46' : 'var(--text-secondary)', fontWeight: 600 }}>
              {activity.lightingActive ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Lightbulb size={14} color="#059669" />
                  <span>{t('modal.lightConfirmed')}</span>
                </span>
              ) : (
                <span>{t('modal.regularHours')}</span>
              )}
            </div>
          </div>

          {/* Boutons d'Action Directe */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {whatsappTarget && <a
              href={`https://wa.me/${whatsappTarget}?text=${encodeURIComponent(`Bonjour, je souhaite réserver via Tfarhida : ${activity.name}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ flex: '1 1 200px', padding: '12px 18px', backgroundColor: '#059669' }}
            >
              <MessageCircle size={18} />
              <span>{t('modal.bookWhatsapp')}</span>
            </a>}

            {phoneTarget && <a
              href={`tel:${phoneTarget}`}
              className="btn btn-secondary"
              style={{ flex: '1 1 120px', padding: '12px 18px' }}
            >
              <Phone size={18} />
              <span>{t('modal.call')}</span>
            </a>}
          </div>
          <Link to={`/activites/${encodeURIComponent(activity.id)}`} onClick={onClose} className="btn btn-secondary" style={{ display: 'inline-flex', marginTop: '12px', minHeight: '44px', alignItems: 'center' }}>
            {t('detail.fullPage')}
          </Link>
        </div>
      </div>
    </div>
  );
};
