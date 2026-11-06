import React, { useState } from 'react';
import {
  MessageCircle,
  Zap,
  Wind,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const BentoPillars: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [selectedBudgetTier, setSelectedBudgetTier] = useState<number>(2);

  return (
    <section
      id="piliers"
      style={{
        padding: '110px 0 100px',
        backgroundColor: 'var(--bg-main)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Halo radial d'ambiance Apple feutré au centre pour la profondeur */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '900px',
          height: '500px',
          background: 'radial-gradient(circle at 50% 15%, rgba(2, 132, 199, 0.12) 0%, rgba(124, 58, 237, 0.05) 50%, transparent 75%)',
          filter: 'blur(55px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* ── En-tête de Section Apple Keynote ─────────────────────────── */}
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 64px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.4rem, 4.8vw, 3.6rem)',
              lineHeight: 1.12,
              fontWeight: 900,
              letterSpacing: '-0.035em',
              color: 'var(--color-navy)',
              marginBottom: '18px',
            }}
          >
            <span>{t('pillars.title')}</span>{' '}
            <span className="text-gradient-tfarhida">
              {t('pillars.titleHighlight')}
            </span>
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
            {t('pillars.subtitle')}
          </p>
        </div>

        {/* ── Grille Bento Monolithique Apple Edition ──────────────────── */}
        <div className="bento-grid">
          {/* ══════════════════════════════════════════════════════════════
              CARTE 01 : 0% Commission (7 colonnes) — Apple Monolith
             ══════════════════════════════════════════════════════════════ */}
          <div
            className="bento-col-7 bento-card-modern"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '28px',
              padding: 'clamp(30px, 4.5vw, 48px)',
              border: '1px solid rgba(2, 132, 199, 0.2)',
              boxShadow: '0 20px 45px -15px rgba(2, 132, 199, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div>
              {/* Sur-titre Eyebrow Apple */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    color: 'var(--color-primary)',
                    textTransform: 'uppercase',
                  }}
                >
                  01 — {t('pillars.c1Tag')}
                </span>

               
              </div>

              {/* Grand Chiffre Monumental Apple */}
              <div
                className="text-gradient-tfarhida"
                style={{
                  fontSize: 'clamp(3.8rem, 6.5vw, 5.2rem)',
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: '-0.04em',
                  marginBottom: '14px',
                }}
              >
                {t('pillars.c1Big')}
              </div>

              {/* Titre Percutant Apple */}
              <h3
                style={{
                  fontSize: 'clamp(1.4rem, 2.2vw, 1.75rem)',
                  fontWeight: 900,
                  lineHeight: 1.25,
                  letterSpacing: '-0.02em',
                  color: 'var(--color-navy)',
                  marginBottom: '12px',
                }}
              >
                {t('pillars.c1Headline')}
              </h3>

              {/* Body fluide et aéré */}
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '1rem',
                  lineHeight: 1.65,
                  maxWidth: '490px',
                  marginBottom: '32px',
                }}
              >
                {t('pillars.c1Desc')}
              </p>
            </div>

            {/* Bouton Pill Apple avec Pastille Verte WhatsApp */}
            <div>
              <a
                href="#explorer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 26px',
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 50%, #7C3AED 100%)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  boxShadow: '0 8px 20px -4px rgba(2, 132, 199, 0.4)',
                  transition: 'transform 0.2s ease, opacity 0.2s ease',
                  marginBottom: '8px',
                }}
              >
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageCircle size={14} color="#FFFFFF" />
                </div>
                <span>{t('pillars.c1Cta')}</span>
                {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
              </a>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('pillars.c1Sub')}
              </p>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              CARTE 02 : 100% Confort en Direct (5 colonnes) — Apple Pro Obsidian
             ══════════════════════════════════════════════════════════════ */}
          <div
            className="bento-col-5 bento-card-modern"
            style={{
              background: 'linear-gradient(145deg, #09142C 0%, #050A1C 100%)',
              color: '#FFFFFF',
              borderRadius: '28px',
              padding: 'clamp(30px, 4.5vw, 48px)',
              border: '1px solid rgba(0, 210, 255, 0.35)',
              boxShadow: '0 25px 50px -12px rgba(6, 11, 36, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Lueur feutrée cyan dans le coin */}
            <div
              style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(0, 210, 255, 0.3) 0%, transparent 70%)',
                filter: 'blur(40px)',
                pointerEvents: 'none',
              }}
            />

            <div>
              {/* Sur-titre Eyebrow & Radar Live */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    color: '#38BDF8',
                    textTransform: 'uppercase',
                  }}
                >
                  02 — {t('pillars.c2Tag')}
                </span>

           
              </div>

              {/* Grand Chiffre Monumental Apple */}
              <div
                className="text-gradient-emerald"
                style={{
                  fontSize: 'clamp(3.8rem, 6.5vw, 5.2rem)',
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: '-0.04em',
                  marginBottom: '14px',
                }}
              >
                {t('pillars.c2Big')}
              </div>

              {/* Titre Percutant Apple */}
              <h3
                style={{
                  fontSize: 'clamp(1.4rem, 2.2vw, 1.75rem)',
                  fontWeight: 900,
                  lineHeight: 1.25,
                  letterSpacing: '-0.02em',
                  color: '#FFFFFF',
                  marginBottom: '12px',
                }}
              >
                {t('pillars.c2Headline')}
              </h3>

              {/* Body fluide et aéré */}
              <p
                style={{
                  color: '#CBD5E1',
                  fontSize: '1rem',
                  lineHeight: 1.65,
                  marginBottom: '32px',
                }}
              >
                {t('pillars.c2Desc')}
              </p>
            </div>

            {/* Triplet de Statuts Apple Purity (Zéro boîte grise !) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '4px', backgroundColor: '#10B981', boxShadow: '0 0 8px #10B981' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#34D399' }}>Ouvert</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wind size={15} color="#38BDF8" />
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#E0F2FE' }}>Climatisé</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={15} color="#FDE047" />
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#FDE047' }}>Énergie OK</span>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              CARTE 03 : 10 DT Budget Intelligent (5 colonnes) — Apple Monolith
             ══════════════════════════════════════════════════════════════ */}
          <div
            className="bento-col-5 bento-card-modern"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '28px',
              padding: 'clamp(30px, 4.5vw, 48px)',
              border: '1px solid rgba(2, 132, 199, 0.2)',
              boxShadow: '0 20px 45px -15px rgba(2, 132, 199, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div>
              {/* Sur-titre Eyebrow & Badge KharjaBot */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    color: '#D97706',
                    textTransform: 'uppercase',
                  }}
                >
                  03 — {t('pillars.c3Tag')}
                </span>

            
              </div>

              {/* Grand Chiffre Monumental Apple */}
              <div
                className="text-gradient-amber"
                style={{
                  fontSize: 'clamp(3.8rem, 6.5vw, 5.2rem)',
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: '-0.04em',
                  marginBottom: '14px',
                }}
              >
                {t('pillars.c3Big')}
              </div>

              {/* Titre Percutant Apple */}
              <h3
                style={{
                  fontSize: 'clamp(1.4rem, 2.2vw, 1.75rem)',
                  fontWeight: 900,
                  lineHeight: 1.25,
                  letterSpacing: '-0.02em',
                  color: 'var(--color-navy)',
                  marginBottom: '12px',
                }}
              >
                {t('pillars.c3Headline')}
              </h3>

              {/* Body fluide et aéré */}
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '1rem',
                  lineHeight: 1.65,
                  marginBottom: '28px',
                }}
              >
                {t('pillars.c3Desc')}
              </p>
            </div>

            {/* Sélecteur de Tranches de Budget Segmenté Apple */}
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '6px',
                  backgroundColor: 'var(--bg-main)',
                  padding: '5px',
                  borderRadius: '14px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedBudgetTier(1)}
                  style={{
                    padding: '9px 4px',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    textAlign: 'center',
                    border: 'none',
                    backgroundColor: selectedBudgetTier === 1 ? 'var(--bg-card)' : 'transparent',
                    color: selectedBudgetTier === 1 ? 'var(--color-primary)' : 'var(--text-muted)',
                    boxShadow: selectedBudgetTier === 1 ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {t('pillars.c3Tier1')}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBudgetTier(2)}
                  style={{
                    padding: '9px 4px',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    textAlign: 'center',
                    border: 'none',
                    backgroundColor: selectedBudgetTier === 2 ? 'var(--bg-card)' : 'transparent',
                    color: selectedBudgetTier === 2 ? 'var(--color-primary)' : 'var(--text-muted)',
                    boxShadow: selectedBudgetTier === 2 ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {t('pillars.c3Tier2')}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBudgetTier(3)}
                  style={{
                    padding: '9px 4px',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    textAlign: 'center',
                    border: 'none',
                    backgroundColor: selectedBudgetTier === 3 ? 'var(--bg-card)' : 'transparent',
                    color: selectedBudgetTier === 3 ? 'var(--color-primary)' : 'var(--text-muted)',
                    boxShadow: selectedBudgetTier === 3 ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {t('pillars.c3Tier3')}
                </button>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              CARTE 04 : 50+ Adresses Auditées (7 colonnes) — Apple Monolith
             ══════════════════════════════════════════════════════════════ */}
          <div
            className="bento-col-7 bento-card-modern"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '28px',
              padding: 'clamp(30px, 4.5vw, 48px)',
              border: '1px solid rgba(2, 132, 199, 0.2)',
              boxShadow: '0 20px 45px -15px rgba(2, 132, 199, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div>
              {/* Sur-titre Eyebrow & Sfax Pilote */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    color: 'var(--color-royal-blue)',
                    textTransform: 'uppercase',
                  }}
                >
                  04 — {t('pillars.c4Tag')}
                </span>

             
              </div>

              {/* Grand Chiffre Monumental Apple */}
              <div
                className="text-gradient-royal"
                style={{
                  fontSize: 'clamp(3.8rem, 6.5vw, 5.2rem)',
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: '-0.04em',
                  marginBottom: '14px',
                }}
              >
                {t('pillars.c4Big')}
              </div>

              {/* Titre Percutant Apple */}
              <h3
                style={{
                  fontSize: 'clamp(1.4rem, 2.2vw, 1.75rem)',
                  fontWeight: 900,
                  lineHeight: 1.25,
                  letterSpacing: '-0.02em',
                  color: 'var(--color-navy)',
                  marginBottom: '12px',
                }}
              >
                {t('pillars.c4Headline')}
              </h3>

              {/* Body fluide et aéré */}
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '1rem',
                  lineHeight: 1.65,
                  maxWidth: '520px',
                  marginBottom: '32px',
                }}
              >
                {t('pillars.c4Desc')}
              </p>
            </div>

            {/* Social Proof Bar : Vignettes Réelles + Macaron Apple */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
                paddingTop: '18px',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <img
                    src="https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=80&q=80"
                    alt="Mall of Sfax"
                    style={{ width: '38px', height: '38px', borderRadius: '50%', border: '2.5px solid var(--bg-card)', objectFit: 'cover' }}
                  />
                  <img
                    src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=80&q=80"
                    alt="Salon de thé"
                    style={{ width: '38px', height: '38px', borderRadius: '50%', border: '2.5px solid var(--bg-card)', objectFit: 'cover', marginLeft: isRTL ? '0' : '-10px', marginRight: isRTL ? '-10px' : '0' }}
                  />
                  <img
                    src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=80&q=80"
                    alt="Restaurant"
                    style={{ width: '38px', height: '38px', borderRadius: '50%', border: '2.5px solid var(--bg-card)', objectFit: 'cover', marginLeft: isRTL ? '0' : '-10px', marginRight: isRTL ? '-10px' : '0' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-navy)', fontSize: '0.85rem', fontWeight: 800 }}>
                  <ShieldCheck size={16} color="var(--color-primary)" />
                  <span>Audit physique à Sfax</span>
                </div>
              </div>

         
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BentoPillars;
