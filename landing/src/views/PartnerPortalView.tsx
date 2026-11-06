import React from 'react';
import { PricingSection } from '../components/sections/PricingSection';
import { PartnerCtaSection } from '../components/sections/PartnerCtaSection';
import { useLanguage } from '../context/LanguageContext';
import { Building2, Sparkles, ArrowLeft, ArrowRight, HelpCircle } from 'lucide-react';

interface PartnerPortalViewProps {
  onSelectPlan: (plan: 'standard' | 'pro' | 'premium') => void;
  onOpenOnboarding: (plan?: 'standard' | 'pro' | 'premium') => void;
  onBackToClient: () => void;
}

export const PartnerPortalView: React.FC<PartnerPortalViewProps> = ({
  onSelectPlan,
  onOpenOnboarding,
  onBackToClient,
}) => {
  const { t, isRTL } = useLanguage();

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height) + 10px)' }}>
      {/* 1. Barre de retour vers le site Public */}
      <div style={{ backgroundColor: 'var(--color-pale-blue)', borderBottom: '1px solid var(--border-subtle)', padding: '10px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <button
            onClick={onBackToClient}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--color-primary)',
            }}
          >
            {isRTL ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
            <span>{t('partnerPortal.switchClient')}</span>
          </button>

          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {t('partnerPortal.portalSubtitle')}
          </span>
        </div>
      </div>

      {/* 2. Hero B2B Professionnel */}
      <section style={{ padding: '70px 0 60px', backgroundColor: 'var(--bg-main)' }}>
        <div className="container">
          <div style={{ maxWidth: '840px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-pale-blue)', border: '1px solid var(--border-strong)', color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '20px' }}>
              <Building2 size={16} />
              <span>{t('partnerPortal.heroBadge')}</span>
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)',
                lineHeight: 1.12,
                color: 'var(--color-navy)',
                letterSpacing: '-0.03em',
                marginBottom: '20px',
              }}
            >
              {t('partnerPortal.heroTitle')}
            </h1>

            <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '32px' }}>
              {t('partnerPortal.heroSubtitle')}
            </p>

            {/* Chiffres Clés & Garanties B2B */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '36px',
              }}
            >
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '18px', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--border-strong)', boxShadow: 'var(--shadow-sm)' }}>
                <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-primary)' }}>0%</span>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-navy)', marginTop: '4px' }}>{t('partnerPortal.zeroCommission')}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('partnerPortal.directWhatsappSub')}</p>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', padding: '18px', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--border-strong)', boxShadow: 'var(--shadow-sm)' }}>
                <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10B981' }}>200+</span>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-navy)', marginTop: '4px' }}>{t('partnerPortal.verifiedOutings')}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('partnerPortal.localAudienceSub')}</p>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', padding: '18px', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--border-strong)', boxShadow: 'var(--shadow-sm)' }}>
                <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-purple-signature)' }}>2 à 10</span>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-navy)', marginTop: '4px' }}>{t('partnerPortal.targetedPush')}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('partnerPortal.maxOpenSub')}</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <button
                onClick={() => onOpenOnboarding('pro')}
                className="btn btn-primary"
                style={{ padding: '14px 28px', fontSize: '1rem', fontWeight: 800 }}
              >
                <Sparkles size={18} />
                <span>{t('partnerPortal.ctaJoin')}</span>
              </button>

              <a
                href="#tarifs"
                className="btn btn-secondary"
                style={{ padding: '14px 24px', fontSize: '1rem' }}
              >
                <span>{t('partnerPortal.seeTarifs')}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Grille Tarifaire Complète & Calculateur Mensuel / Annuel */}
      <PricingSection onSelectPlan={onSelectPlan} />

      {/* 4. Section FAQ Spéciale Établissements */}
      <section style={{ padding: '80px 0', backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="container" style={{ maxWidth: '820px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span className="badge badge-primary" style={{ marginBottom: '10px' }}>
              <HelpCircle size={14} color="var(--color-primary)" />
              <span>{t('partnerPortal.transparency')}</span>
            </span>
            <h3 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 800, color: 'var(--color-navy)' }}>
              {t('partnerPortal.faqTitle')}
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '20px 24px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-strong)' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '8px' }}>
                {t('partnerPortal.faqCommissionQ')}
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {t('partnerPortal.faqCommissionA')}
              </p>
            </div>

            <div style={{ padding: '20px 24px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-strong)' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '8px' }}>
                {t('partnerPortal.faqPushQ')}
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {t('partnerPortal.faqPushA')}
              </p>
            </div>

            <div style={{ padding: '20px 24px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-strong)' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '8px' }}>
                {t('partnerPortal.faqApprovalQ')}
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {t('partnerPortal.faqApprovalA')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Section Contact & Assistance Établissements */}
      <PartnerCtaSection onOpenOnboarding={() => onOpenOnboarding('pro')} />
    </div>
  );
};
