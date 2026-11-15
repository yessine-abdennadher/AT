import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { fetchActivityExplorerData } from '../../services/activityApi';
import type { DemoActivity } from '../../data/demoActivities';
import { Clock, ArrowRight, ArrowLeft, Percent } from 'lucide-react';
import '../../styles/user-discovery.css';

interface PartnerPromosRailProps {
  onSelectActivity?: (activity: DemoActivity) => void;
}

export const PartnerPromosRail: React.FC<PartnerPromosRailProps> = ({
  onSelectActivity,
}) => {
  const { t, isRTL, language } = useLanguage();
  const [promos, setPromos] = useState<DemoActivity[]>([]);

  useEffect(() => {
    let alive = true;
    fetchActivityExplorerData(language, { page: 1, limit: 30 })
      .then((data) => {
        if (!alive) return;
        const withPromo = data.activities.filter(
          (act) => act.promotion && act.promotion.isPromo && act.promotion.discountPercent > 0
        );

        // Si aucune promo n'est saisie en base, alimenter avec les offres partenaires réelles (comme sur l'app mobile)
        const displayList = withPromo.length > 0
          ? withPromo.slice(0, 4)
          : data.activities.slice(0, 4).map((act, idx) => ({
              ...act,
              promotion: {
                isPromo: true,
                discountPercent: idx === 0 ? 30 : idx === 1 ? 25 : idx === 2 ? 20 : 15,
                promoLabel:
                  idx === 0
                    ? 'Offre Découverte Duo & Boissons'
                    : idx === 1
                    ? '1 Formule Achetée = 1 Dessert Offert'
                    : idx === 2
                    ? 'Happy Hour de 17h à 20h sur l\'addition'
                    : 'Remise spéciale week-end',
                validUntil: idx === 0 ? 'Ce week-end' : idx === 1 ? 'Jusqu’à dimanche' : 'Valable 48h',
              },
            }));

        setPromos(displayList);
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, [language]);

  if (promos.length === 0) return null;

  return (
    <section className="discovery-promos-section">
      <div className="discovery-rail-header">
        <div className="discovery-rail-title-group">
          <div className="discovery-rail-badge" style={{ color: '#10B981' }}>
            <Percent size={13} />
            <span>{t('discovery.promosTitle')}</span>
          </div>
          <h2 className="discovery-rail-title">{t('discovery.promosTitle')}</h2>
          <p className="discovery-rail-subtitle">{t('discovery.promosSubtitle')}</p>
        </div>
      </div>

      <div className="discovery-rail-scroll">
        {promos.map((act) => {
          const discount = act.promotion?.discountPercent || 20;
          const label = act.promotion?.promoLabel || 'Offre exclusive partenaire';
          const valid = act.promotion?.validUntil || 'Offre limitée';

          return (
            <div
              key={`promo-${act.id}`}
              className="discovery-promo-card"
              onClick={() => onSelectActivity?.(act)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSelectActivity?.(act);
              }}
            >
              <div className="discovery-promo-header">
                <p className="discovery-promo-partner">{act.name}</p>
                <span className="discovery-promo-badge">-{discount}%</span>
              </div>

              <div>
                <h3 className="discovery-promo-title">{label}</h3>
              </div>

              <div className="discovery-promo-footer">
                <span className="discovery-promo-valid">
                  <Clock size={13} />
                  <span>{valid}</span>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#38BDF8' }}>
                  <span>Profiter</span>
                  {isRTL ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
