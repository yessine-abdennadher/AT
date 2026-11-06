import React, { useState } from 'react';
import {
  Check,
  Zap,
  ShieldCheck,
  Crown,
  BellRing,
  ArrowRight,
  ArrowLeft,
  Store,
  Star,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface PricingSectionProps {
  onSelectPlan: (plan: 'standard' | 'pro' | 'premium') => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan }) => {
  const { t, isRTL } = useLanguage();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section id="tarifs" style={{ padding: '100px 0', backgroundColor: 'var(--bg-main)', position: 'relative' }}>
      <div className="container">
        {/* ── En-tête de section Apple Keynote (Zéro badge encombrant) ── */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 52px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.4rem, 4.5vw, 3.4rem)',
              lineHeight: 1.15,
              fontWeight: 900,
              letterSpacing: '-0.035em',
              color: 'var(--color-navy)',
              marginBottom: '18px',
            }}
          >
            <span>Des tarifs clairs.</span>{' '}
            <span className="text-gradient-tfarhida">Zéro commission cachée.</span>
          </h2>

          <p
            style={{
              fontSize: '1.15rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
              maxWidth: '680px',
              margin: '0 auto',
            }}
          >
            {t('pricing.subtitle')}
          </p>

          {/* Switch Mensuel / Annuel iOS Segmented Control */}
          <div
            style={{
              marginTop: '32px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div className="pricing-toggle-wrap">
              <button
                type="button"
                className={`pricing-toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('monthly')}
              >
                {t('pricing.monthly')}
              </button>
              <button
                type="button"
                className={`pricing-toggle-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('yearly')}
              >
                {t('pricing.yearly')}
              </button>
            </div>

            {billingCycle === 'yearly' && (
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  backgroundColor: 'rgba(16, 185, 129, 0.14)',
                  color: '#059669',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)',
                }}
              >
                <Zap size={14} color="#059669" />
                <span>{t('pricing.yearlyDiscount')}</span>
              </span>
            )}
          </div>
        </div>

        {/* ── Grille des 3 Cartes de Tarifs Apple Monolith ─────────────── */}
        <div className="pricing-grid">
          {/* ══════════════════════════════════════════════════════════════
              CARTE 1 : Standard (0 DT) — Blanc Pur & Aluminium
             ══════════════════════════════════════════════════════════════ */}
          <div className="pricing-card">
            <div>
              {/* Eyebrow & Badge */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    color: 'var(--color-navy)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    textTransform: 'uppercase',
                  }}
                >
                  <Store size={18} color="#059669" />
                  <span>Standard</span>
                </span>
          
              </div>

              {/* Pitch */}
              <p
                style={{
                  fontSize: '0.925rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '26px',
                  lineHeight: 1.55,
                  minHeight: '44px',
                }}
              >
                L'essentiel pour référencer votre établissement, être visible sur Google Maps et recevoir des réservations directes.
              </p>

              {/* Chiffre Monumental Apple */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '28px' }}>
                <span
                  style={{
                    fontSize: 'clamp(3rem, 4.8vw, 3.8rem)',
                    fontWeight: 900,
                    lineHeight: 1,
                    letterSpacing: '-0.04em',
                    color: 'var(--color-navy)',
                  }}
                >
                  0 DT
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  {t('pricing.perMonth')}
                </span>
              </div>

              {/* Checklist Pure Apple (100% Positive, Zéro Croix) */}
              <div className="pricing-features-list">
                <div className="pricing-feature-row">
                  <div className="pricing-feature-icon-wrap">
                    <Check size={14} color="#059669" />
                  </div>
                  <span>Fiche établissement complète avec photos et horaires</span>
                </div>
                <div className="pricing-feature-row">
                  <div className="pricing-feature-icon-wrap">
                    <Check size={14} color="#059669" />
                  </div>
                  <span>Contact direct <strong>WhatsApp & Téléphone (0% commission)</strong></span>
                </div>
                <div className="pricing-feature-row">
                  <div className="pricing-feature-icon-wrap">
                    <Check size={14} color="#059669" />
                  </div>
                  <span>Statut Climatisation & Groupe électrogène en temps réel</span>
                </div>
                <div className="pricing-feature-row">
                  <div className="pricing-feature-icon-wrap">
                    <Check size={14} color="#059669" />
                  </div>
                  <span>Géolocalisation GPS & bouton itinéraire 1-clic</span>
                </div>
                <div className="pricing-feature-row">
                  <div className="pricing-feature-icon-wrap">
                    <Check size={14} color="#059669" />
                  </div>
                  <span>Consultation directe des avis clients certifiés</span>
                </div>
              </div>
            </div>

            {/* Bouton Pill Apple */}
            <button
              onClick={() => onSelectPlan('standard')}
              className="btn btn-secondary"
              style={{
                width: '100%',
                marginTop: '36px',
                padding: '15px 24px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 800,
                fontSize: '0.95rem',
              }}
            >
              <span>{t('pricing.ctaStandard')}</span>
              <ArrowIcon size={16} />
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              CARTE 2 : Tfarhida PRO (39 DT / 29 DT) — L'iPhone Pro au Centre
             ══════════════════════════════════════════════════════════════ */}
          <div className="pricing-card featured">
            {/* Badge Flottant Signature Apple */}
            <div
              style={{
                position: 'absolute',
                top: '-15px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 50%, #7C3AED 100%)',
                color: '#FFFFFF',
                padding: '5px 18px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.725rem',
                fontWeight: 900,
                letterSpacing: '0.06em',
                boxShadow: '0 8px 20px -4px rgba(2, 132, 199, 0.5)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              <Star size={12} fill="#FFFFFF" color="#FFFFFF" />
              <span>{t('pricing.popular')}</span>
            </div>

            <div>
              {/* Eyebrow & Recommandé */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    color: 'var(--color-navy)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    textTransform: 'uppercase',
                  }}
                >
                  <ShieldCheck size={18} color="var(--color-primary)" />
                  <span>Tfarhida PRO</span>
                </span>
             
              </div>

              {/* Pitch */}
              <p
                style={{
                  fontSize: '0.925rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '26px',
                  lineHeight: 1.55,
                  minHeight: '44px',
                }}
              >
                Pour les cafés, restaurants et loisirs voulant remplir leurs heures creuses et fidéliser une clientèle locale.
              </p>

              {/* Chiffre Monumental Dégradé Apple */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                <span
                  className="text-gradient-tfarhida"
                  style={{
                    fontSize: 'clamp(3.2rem, 5vw, 4.2rem)',
                    fontWeight: 900,
                    lineHeight: 1,
                    letterSpacing: '-0.04em',
                  }}
                >
                  {billingCycle === 'monthly' ? '39 DT' : '29 DT'}
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  {t('pricing.perMonth')}
                </span>
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '24px', fontWeight: 600 }}>
                {billingCycle === 'yearly' ? 'Facturé 350 DT/an (économisez 118 DT)' : 'Sans engagement, résiliable à tout moment'}
              </p>

              {/* Checklist Pure Apple */}
              <div className="pricing-features-list">
                <div className="pricing-feature-row" style={{ fontWeight: 700 }}>
                  <div className="pricing-feature-icon-wrap" style={{ backgroundColor: 'rgba(2, 132, 199, 0.15)' }}>
                    <Check size={14} color="var(--color-primary)" />
                  </div>
                  <span>Tous les avantages Standard inclus</span>
                </div>
                <div className="pricing-feature-row">
                  <div className="pricing-feature-icon-wrap">
                    <Check size={14} color="#059669" />
                  </div>
                  <span><strong>Promotions & Bons plans illimités</strong> (remises menus, offres)</span>
                </div>
                <div className="pricing-feature-row">
                  <div className="pricing-feature-icon-wrap">
                    <Check size={14} color="#059669" />
                  </div>
                  <span>Mise en avant sur le carrousel <strong>« Bons Plans du Moment »</strong></span>
                </div>
                <div className="pricing-feature-row">
                  <div className="pricing-feature-icon-wrap" style={{ backgroundColor: 'rgba(2, 132, 199, 0.15)' }}>
                    <BellRing size={14} color="var(--color-primary)" />
                  </div>
                  <span><strong>2 Notifications Push géolocalisées</strong> par mois</span>
                </div>
                <div className="pricing-feature-row">
                  <div className="pricing-feature-icon-wrap">
                    <Check size={14} color="#059669" />
                  </div>
                  <span>Badge officiel vérifié <strong>« Partenaire Pro Certifié »</strong></span>
                </div>
                <div className="pricing-feature-row">
                  <div className="pricing-feature-icon-wrap">
                    <Check size={14} color="#059669" />
                  </div>
                  <span>Statistiques complètes (Vues, Clics WhatsApp, Appels GPS)</span>
                </div>
              </div>
            </div>

            {/* Bouton Pill Apple Gradient */}
            <button
              onClick={() => onSelectPlan('pro')}
              className="btn btn-primary"
              style={{
                width: '100%',
                marginTop: '36px',
                padding: '16px 26px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 800,
                fontSize: '0.975rem',
                boxShadow: '0 10px 25px -4px rgba(2, 132, 199, 0.45)',
              }}
            >
              <span>{t('pricing.ctaPro')}</span>
              <ArrowIcon size={16} />
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              CARTE 3 : Premium VIP (89 DT / 69 DT) — Améthyste Royale
             ══════════════════════════════════════════════════════════════ */}
          <div className="pricing-card">
            <div>
              {/* Eyebrow & Badge VIP */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    color: 'var(--color-navy)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    textTransform: 'uppercase',
                  }}
                >
                  <Crown size={18} color="var(--color-purple-signature)" />
                  <span>PREMIUM VIP</span>
                </span>
       
              </div>

              {/* Pitch */}
              <p
                style={{
                  fontSize: '0.925rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '26px',
                  lineHeight: 1.55,
                  minHeight: '44px',
                }}
              >
                Pour les lounges, bowlings, complexes de loisirs et organisateurs de soirées ou spectacles à Sfax.
              </p>

              {/* Chiffre Monumental Dégradé Royal */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                <span
                  className="text-gradient-royal"
                  style={{
                    fontSize: 'clamp(3.2rem, 5vw, 4.2rem)',
                    fontWeight: 900,
                    lineHeight: 1,
                    letterSpacing: '-0.04em',
                  }}
                >
                  {billingCycle === 'monthly' ? '89 DT' : '69 DT'}
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  {t('pricing.perMonth')}
                </span>
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '24px', fontWeight: 600 }}>
                {billingCycle === 'yearly' ? 'Facturé 790 DT/an (économisez 278 DT)' : 'Accompagnement VIP dédié'}
              </p>

              {/* Checklist Pure Apple */}
              <div className="pricing-features-list">
                <div className="pricing-feature-row" style={{ fontWeight: 700 }}>
                  <div className="pricing-feature-icon-wrap" style={{ backgroundColor: 'rgba(124, 58, 237, 0.15)' }}>
                    <Check size={14} color="var(--color-purple-signature)" />
                  </div>
                  <span>Tous les avantages Pro inclus</span>
                </div>
                <div className="pricing-feature-row">
                  <div className="pricing-feature-icon-wrap" style={{ backgroundColor: 'rgba(124, 58, 237, 0.15)' }}>
                    <Crown size={14} color="var(--color-purple-signature)" />
                  </div>
                  <span><strong>Création illimitée de Soirées & Événements</strong> (DJ, Live)</span>
                </div>
                <div className="pricing-feature-row">
                  <div className="pricing-feature-icon-wrap">
                    <Check size={14} color="#059669" />
                  </div>
                  <span>Affichage <strong>prioritaire en tête de liste</strong> sur l'application</span>
                </div>
                <div className="pricing-feature-row">
                  <div className="pricing-feature-icon-wrap" style={{ backgroundColor: 'rgba(124, 58, 237, 0.15)' }}>
                    <BellRing size={14} color="var(--color-purple-signature)" />
                  </div>
                  <span><strong>10 Notifications Push ciblées</strong> par mois (Soirées & Promos)</span>
                </div>
                <div className="pricing-feature-row">
                  <div className="pricing-feature-icon-wrap">
                    <Check size={14} color="#059669" />
                  </div>
                  <span>Badge exclusif <strong>« Partenaire VIP Or »</strong></span>
                </div>
                <div className="pricing-feature-row">
                  <div className="pricing-feature-icon-wrap">
                    <Check size={14} color="#059669" />
                  </div>
                  <span>Ligne WhatsApp directe & Support prioritaire 7j/7</span>
                </div>
              </div>
            </div>

            {/* Bouton Pill Apple */}
            <button
              onClick={() => onSelectPlan('premium')}
              className="btn btn-secondary"
              style={{
                width: '100%',
                marginTop: '36px',
                padding: '15px 24px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 800,
                fontSize: '0.95rem',
              }}
            >
              <span>{t('pricing.ctaPremium')}</span>
              <ArrowIcon size={16} />
            </button>
          </div>
        </div>

        {/* ── Processus d'Onboarding en 4 Étapes Apple Edition ──────────── */}
        <div style={{ marginTop: '72px' }}>
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px' }}>
            <h3
              style={{
                fontSize: 'clamp(1.4rem, 2.4vw, 1.85rem)',
                fontWeight: 900,
                color: 'var(--color-navy)',
                letterSpacing: '-0.02em',
                marginBottom: '10px',
              }}
            >
              {t('pricing.onboardingTitle')}
            </h3>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {t('pricing.onboardingSubtitle')}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: '20px',
            }}
          >
            {/* Étape 1 */}
            <div className="pricing-step-card">
              <span className="pricing-step-watermark">01</span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-pale-blue)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '0.875rem',
                  marginBottom: '14px',
                }}
              >
                1
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '6px' }}>
                {t('pricing.step1Title')}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {t('pricing.step1Desc')}
              </p>
            </div>

            {/* Étape 2 */}
            <div className="pricing-step-card">
              <span className="pricing-step-watermark">02</span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(124, 58, 237, 0.12)',
                  color: 'var(--color-purple-signature)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '0.875rem',
                  marginBottom: '14px',
                }}
              >
                2
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '6px' }}>
                {t('pricing.step2Title')}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {t('pricing.step2Desc')}
              </p>
            </div>

            {/* Étape 3 */}
            <div className="pricing-step-card">
              <span className="pricing-step-watermark">03</span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '0.875rem',
                  marginBottom: '14px',
                }}
              >
                3
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '6px' }}>
                {t('pricing.step3Title')}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {t('pricing.step3Desc')}
              </p>
            </div>

            {/* Étape 4 */}
            <div className="pricing-step-card">
              <span className="pricing-step-watermark">04</span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '0.875rem',
                  marginBottom: '14px',
                }}
              >
                4
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '6px' }}>
                {t('pricing.step4Title')}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {t('pricing.step4Desc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
