import React, { useState } from 'react';
import { HeroSection } from '../components/sections/HeroSection';
import { ActivityExplorer } from '../components/sections/ActivityExplorer';
import { BentoPillars } from '../components/sections/BentoPillars';
import { MobileAppShowcase } from '../components/sections/MobileAppShowcase';
import type { DemoActivity } from '../data/demoActivities';
import { useLanguage } from '../context/LanguageContext';
import { Building2, ArrowRight } from 'lucide-react';

interface ClientHomeViewProps {
  onExploreClick: () => void;
  onSelectActivity: (activity: DemoActivity) => void;
  onSwitchToPartner: () => void;
}

export const ClientHomeView: React.FC<ClientHomeViewProps> = ({
  onExploreClick,
  onSelectActivity,
  onSwitchToPartner,
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <>
      {/* 1. Accroche Principale Grand Public */}
      <HeroSection 
        onExploreClick={onExploreClick}
        onSearch={setSearchQuery}
        onSelectActivity={onSelectActivity}
      />

      {/* 2. Explorateur des Sorties & Activités Réelles */}
      <ActivityExplorer 
        onSelectActivity={onSelectActivity}
        searchQuery={searchQuery}
        onResetSearch={() => setSearchQuery('')}
      />

      {/* 3. Piliers d'Avantages Tfarhida */}
      <BentoPillars />

      {/* 4. Démonstrateur Application Mobile */}
      <MobileAppShowcase />

      {/* 5. Bannière discrète de transition vers l'Espace Établissements */}
      <section style={{ padding: '60px 0', backgroundColor: 'var(--bg-main)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div
            style={{
              background: 'linear-gradient(135deg, #0F172A 0%, #1A2849 100%)',
              borderRadius: 'var(--radius-xl)',
              padding: 'clamp(28px, 4vw, 42px)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '24px',
              boxShadow: 'var(--shadow-xl)',
              border: '1.5px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '10px', backgroundColor: 'rgba(2, 132, 199, 0.2)', padding: '4px 12px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(2, 132, 199, 0.35)', color: '#38BDF8', fontSize: '0.8rem', fontWeight: 700 }}>
                <Building2 size={14} />
                <span>{t('partnerPortal.businessBadge')}</span>
              </div>
              <h3 style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.75rem)', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>
                {t('partnerPortal.clientBannerTitle')}
              </h3>
              <p style={{ color: '#CBD5E1', fontSize: '0.95rem', maxWidth: '620px', lineHeight: 1.6 }}>
                {t('partnerPortal.clientBannerDesc')}
              </p>
            </div>

            <button
              onClick={onSwitchToPartner}
              className="btn btn-primary"
              style={{ padding: '14px 26px', fontSize: '0.95rem', fontWeight: 800, gap: '10px' }}
            >
              <span>{t('partnerPortal.clientBannerCta')}</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </>
  );
};
