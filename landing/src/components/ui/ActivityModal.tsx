import React from 'react';
import type { DemoActivity } from '../../data/demoActivities';
import { X, Star, MapPin, Zap, MessageCircle, Phone } from 'lucide-react';

interface ActivityModalProps {
  activity: DemoActivity | null;
  onClose: () => void;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({ activity, onClose }) => {
  if (!activity) return null;

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
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          maxWidth: '560px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xl)',
          position: 'relative',
          animation: 'fadeIn 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton Fermer */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
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
              left: '12px',
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
        </div>

        {/* Contenu */}
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <MapPin size={16} color="var(--color-primary)" />
              <span>{activity.city}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Star size={18} color="#F59E0B" fill="#F59E0B" />
              <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-navy)' }}>
                {activity.rating}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                ({activity.reviewCount} avis)
              </span>
            </div>
          </div>

          <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '10px' }}>
            {activity.name}
          </h3>

          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
            {activity.highlight}. Établissement vérifié avec engagement de service de qualité supérieure et accueil chaleureux.
          </p>

          {/* Électricité / Lumière vérifiée */}
          <div
            style={{
              backgroundColor: 'var(--color-emerald-light)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '24px',
            }}
          >
            <Zap size={20} color="#059669" />
            <div style={{ fontSize: '0.85rem', color: '#065F46', fontWeight: 600 }}>
              Électricité active & confirmée par les gérants ce jour
            </div>
          </div>

          {/* Boutons d'Action Directe */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <a
              href={`https://wa.me/21620000000?text=${encodeURIComponent(`Bonjour, je souhaite réserver via Win : ${activity.name}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ flex: 1, padding: '12px 18px', backgroundColor: '#059669' }}
            >
              <MessageCircle size={18} />
              <span>Réserver par WhatsApp</span>
            </a>

            <a
              href="tel:+21674000000"
              className="btn btn-secondary"
              style={{ padding: '12px 18px' }}
            >
              <Phone size={18} />
              <span>Appeler</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
