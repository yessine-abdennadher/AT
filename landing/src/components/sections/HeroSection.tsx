import React, { Suspense, lazy } from 'react';
import { Search, MapPin, Zap, ArrowRight, ShieldCheck, Star, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

const DiscoveryOrbCanvas = lazy(() =>
  import('../3d/DiscoveryOrbCanvas').then((m) => ({ default: m.DiscoveryOrbCanvas }))
);

interface HeroSectionProps {
  onSearch?: (query: string) => void;
  onExploreClick?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExploreClick }) => {
  const triggerConfetti = () => {
    confetti({
      particleCount: 65,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#0284C7', '#38BDF8', '#FF4B5C', '#10B981'],
    });
    if (onExploreClick) onExploreClick();
  };

  return (
    <section
      style={{
        paddingTop: 'calc(var(--nav-height) + 40px)',
        paddingBottom: '80px',
        position: 'relative',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse 75% 50% at 50% -10%, rgba(2, 132, 199, 0.16), transparent)',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            alignItems: 'center',
            gap: '48px',
          }}
        >
          {/* Colonne Gauche : Narration & Accroche Tfarhida */}
          <div>
            <div style={{ marginBottom: '18px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <span className="badge badge-primary">
                <Sparkles size={14} color="var(--color-primary)" />
                <span>Tfarhida (تفرهيدة) · L'app N°1 des sorties en Tunisie</span>
              </span>
              <span
                style={{
                  fontSize: '0.825rem',
                  fontFamily: 'var(--font-arabic)',
                  fontWeight: 700,
                  color: 'var(--color-purple-signature)',
                  backgroundColor: 'var(--color-pale-purple)',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(124, 58, 237, 0.2)',
                }}
              >
                شنوّة نعمل توّا؟ ⚡
              </span>
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.5rem, 5vw, 3.85rem)',
                lineHeight: 1.08,
                letterSpacing: '-0.03em',
                marginBottom: '20px',
                color: 'var(--color-navy)',
              }}
            >
              L’art de sortir et de s’évader en{' '}
              <span
                style={{
                  background: 'var(--color-primary-gradient)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Tunisie.
              </span>
            </h1>

            <p
              style={{
                fontSize: '1.125rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.65,
                maxWidth: '540px',
                marginBottom: '28px',
              }}
            >
              Trouvez votre prochaine <strong>sortie</strong> selon votre budget en Dinars (DT), votre temps et vos envies : bowling, cafés historiques, sorties mer et espaces climatisés, avec <strong>contact direct WhatsApp</strong> et vérification de la lumière en direct.
            </p>

            {/* Barre de Recherche Interactive */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#FFFFFF',
                padding: '8px 12px',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-lg)',
                border: '1.5px solid var(--border-subtle)',
                maxWidth: '520px',
                marginBottom: '36px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, paddingLeft: '8px' }}>
                <Search size={20} color="var(--color-primary)" />
                <input
                  type="text"
                  placeholder="Quelle sortie recherchez-vous ? (Bowling, Café...)"
                  style={{
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    fontSize: '0.95rem',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') triggerConfetti();
                  }}
                />
              </div>

              <button
                onClick={triggerConfetti}
                className="btn btn-primary"
                style={{ padding: '11px 22px', borderRadius: 'var(--radius-lg)' }}
              >
                <span>Explorer</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Métriques de Confiance */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                flexWrap: 'wrap',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-pale-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)',
                  }}
                >
                  <MapPin size={18} />
                </div>
                <div>
                  <p style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-navy)', lineHeight: 1 }}>
                    200+
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sorties vérifiées</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-emerald-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#059669',
                  }}
                >
                  <Zap size={18} />
                </div>
                <div>
                  <p style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-navy)', lineHeight: 1 }}>
                    100% Direct
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Zéro commission</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-amber-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#D97706',
                  }}
                >
                  <Star size={18} />
                </div>
                <div>
                  <p style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-navy)', lineHeight: 1 }}>
                    4.9 / 5
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avis certifiés</p>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne Droite : Orbe 3D Tfarhida Isolé */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              minHeight: '440px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Effet d'arrière-plan lumineux */}
            <div
              style={{
                position: 'absolute',
                width: '340px',
                height: '340px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(2, 132, 199, 0.3) 0%, rgba(56, 189, 248, 0.15) 50%, transparent 80%)',
                filter: 'blur(45px)',
                zIndex: 0,
              }}
            />

            {/* Badges flottants */}
            <div
              style={{
                position: 'absolute',
                top: '12%',
                left: '2%',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                padding: '8px 14px',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                zIndex: 2,
              }}
            >
              <ShieldCheck size={18} color="var(--color-primary)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                Partenaires certifiés Sfax
              </span>
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: '10%',
                right: '4%',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                padding: '8px 14px',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                zIndex: 2,
              }}
            >
              <Zap size={18} color="#059669" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#065F46' }}>
                Lumière active en temps réel
              </span>
            </div>

            {/* Scène 3D Lazy-Loaded */}
            <Suspense
              fallback={
                <div
                  style={{
                    width: '280px',
                    height: '280px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #0284C7 0%, #0B1528 80%)',
                    boxShadow: 'var(--shadow-glow)',
                    animation: 'pulse 2s infinite',
                  }}
                />
              }
            >
              <DiscoveryOrbCanvas />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
};
