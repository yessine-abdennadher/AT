import React from 'react';
import { Music, Calendar, Clock } from 'lucide-react';
import type { DemoActivity } from '../../data/demoActivities';

interface ActivityEventsSectionProps {
  events: NonNullable<DemoActivity['events']>;
}

export const ActivityEventsSection: React.FC<ActivityEventsSectionProps> = ({ events }) => {
  if (!events || events.length === 0) return null;

  return (
    <div className="activity-detail-card-panel" style={{ border: '1.5px solid rgba(124, 58, 237, 0.3)' }}>
      <h2 className="activity-detail-section-title" style={{ color: '#7C3AED' }}>
        <Music size={22} aria-hidden="true" />
        <span>Événements & Soirées à venir</span>
      </h2>

      <div style={{ display: 'grid', gap: '14px' }}>
        {events.map((evt, idx) => (
          <div
            key={`detail-evt-${idx}`}
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-main)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800 }}>{evt.title}</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} aria-hidden="true" />
                  <span>{evt.date}</span>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} aria-hidden="true" />
                  <span>{evt.time}</span>
                </span>
              </p>
              {evt.description && (
                <p style={{ margin: '8px 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {evt.description}
                </p>
              )}
            </div>
            <span style={{ fontWeight: 800, color: '#7C3AED', fontSize: '1rem' }}>
              {evt.price === 0 ? 'Entrée libre' : `${evt.price} DT`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
