import React from 'react';
import { ShieldCheck, Zap, Snowflake, Clock, Phone, Sparkles } from 'lucide-react';
import type { DemoActivity } from '../../data/demoActivities';

interface ActivityAboutSectionProps {
  activity: DemoActivity;
}

export const ActivityAboutSection: React.FC<ActivityAboutSectionProps> = ({ activity }) => {
  return (
    <div className="activity-detail-card-panel">
      <h2 className="activity-detail-section-title">
        <ShieldCheck size={22} color="var(--color-primary)" aria-hidden="true" />
        <span>À propos de cette sortie</span>
      </h2>

      <p className="activity-detail-desc">
        {activity.description || activity.highlight}
      </p>

      {/* Équipements & Garanties vérifiées */}
      <div className="activity-detail-features-grid">
        <div className="activity-detail-feature-item">
          <div className="activity-detail-feature-icon">
            <Zap size={18} color="#059669" aria-hidden="true" />
          </div>
          <div>
            <div>Électricité garantie</div>
            <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>
              {activity.lightingActive ? 'Groupe secours actif' : 'Horaires réguliers'}
            </div>
          </div>
        </div>

        {activity.hasAirConditioning && (
          <div className="activity-detail-feature-item">
            <div className="activity-detail-feature-icon">
              <Snowflake size={18} color="#0284C7" aria-hidden="true" />
            </div>
            <div>
              <div>Climatisation</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Espace climatisé</div>
            </div>
          </div>
        )}

        <div className="activity-detail-feature-item">
          <div className="activity-detail-feature-icon">
            <Clock size={18} color="#7C3AED" aria-hidden="true" />
          </div>
          <div>
            <div>Horaires</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Ouvert tous les jours</div>
          </div>
        </div>

        {activity.directContact && (
          <div className="activity-detail-feature-item">
            <div className="activity-detail-feature-icon">
              <Phone size={18} color="#D97706" aria-hidden="true" />
            </div>
            <div>
              <div>Réservation directe</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Sans intermédiaire</div>
            </div>
          </div>
        )}
      </div>

      {activity.tags && activity.tags.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          {activity.tags.map((tag, idx) => (
            <span
              key={`tag-${idx}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(2, 132, 199, 0.08)',
                color: 'var(--color-primary)',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              <Sparkles size={12} aria-hidden="true" />
              <span>{tag}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
