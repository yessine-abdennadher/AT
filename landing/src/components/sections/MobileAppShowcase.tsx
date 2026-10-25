import React from 'react';
import { Smartphone, Bell, Flame, Compass, Heart, ArrowUpRight, Check } from 'lucide-react';

export const MobileAppShowcase: React.FC = () => {
  return (
    <section style={{ padding: '90px 0', backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            alignItems: 'center',
            gap: '56px',
          }}
        >
          {/* Colonne Gauche : Maquette Smartphone Réaliste */}
          <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
            {/* Halo lumineux arrière */}
            <div
              style={{
                position: 'absolute',
                width: '320px',
                height: '480px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(2, 132, 199, 0.25) 0%, rgba(56, 189, 248, 0.12) 70%, transparent)',
                filter: 'blur(50px)',
                zIndex: 0,
              }}
            />

            {/* Châssis Smartphone */}
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                width: '300px',
                height: '610px',
                backgroundColor: '#070D18',
                borderRadius: '44px',
                padding: '12px',
                boxShadow: '0 25px 50px -12px rgba(2, 132, 199, 0.35)',
                border: '4px solid #1E293B',
              }}
            >
              {/* Écran interne */}
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#F0F7FF',
                  borderRadius: '34px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Dynamic Island / Notch */}
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px' }}>
                  <div
                    style={{
                      width: '90px',
                      height: '20px',
                      backgroundColor: '#070D18',
                      borderRadius: '12px',
                    }}
                  />
                </div>

                {/* En-tête de l'application Tfarhida */}
                <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 800 }}>Tfarhida</p>
                      <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-arabic)', color: 'var(--color-purple-signature)', fontWeight: 700 }}>تفرهيدة</span>
                    </div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-navy)' }}>
                      شنوّة نعمل توّا؟ ⚡
                    </h4>
                  </div>
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-pale-blue)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-primary)',
                      position: 'relative',
                    }}
                  >
                    <Bell size={18} />
                    <span
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-tunisian-red)',
                      }}
                    />
                  </div>
                </div>

                {/* Carte Mise en Avant In-App */}
                <div style={{ padding: '0 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div
                    style={{
                      borderRadius: '16px',
                      overflow: 'hidden',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.06)',
                      border: '1px solid #BAE6FD',
                    }}
                  >
                    <img
                      src="https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=400&q=80"
                      alt="Bowling Sfax"
                      style={{ width: '100%', height: '110px', objectFit: 'cover' }}
                    />
                    <div style={{ padding: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <Flame size={14} color="#E11D48" />
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#E11D48' }}>
                          Sortie phare Tfarhida
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-navy)' }}>
                        Bowling Mall of Sfax
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#64748B' }}>25 DT · 💡 Lumière garantie</p>
                    </div>
                  </div>

                  {/* Notification In-App Démonstration */}
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--color-pale-blue)',
                      border: '1px solid rgba(2, 132, 199, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        flexShrink: 0,
                      }}
                    >
                      <Bell size={14} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                        Nouvelle sortie disponible !
                      </p>
                      <p style={{ fontSize: '0.675rem', color: '#475569' }}>Escape Room vient d'ouvrir</p>
                    </div>
                  </div>
                </div>

                {/* Barre de navigation basse */}
                <div
                  style={{
                    padding: '12px 20px',
                    backgroundColor: '#FFFFFF',
                    borderTop: '1px solid #BAE6FD',
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: '#94A3B8',
                  }}
                >
                  <Compass size={20} color="var(--color-primary)" />
                  <Heart size={20} />
                  <Bell size={20} />
                </div>
              </div>
            </div>
          </div>

          {/* Colonne Droite : Explication de l'application */}
          <div>
            <span className="badge badge-primary" style={{ marginBottom: '14px' }}>
              <Smartphone size={14} />
              Application Mobile & Web
            </span>

            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                marginBottom: '20px',
              }}
            >
              Toutes les sorties de Tunisie directement dans votre poche.
            </h2>

            <p
              style={{
                fontSize: '1.05rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.65,
                marginBottom: '32px',
              }}
            >
              <strong>Tfarhida (تفرهيدة)</strong> a été conçue pour être ultra réactive et accessible aussi bien sur smartphone que sur ordinateur. Enregistrez vos favoris, recevez des alertes en temps réel sur les nouveaux événements et découvrez les perles rares de votre région.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-pale-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '2px',
                    flexShrink: 0,
                  }}
                >
                  <Check size={18} strokeWidth={2.5} color="var(--color-primary)" />
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                    Disponibilité instantanée
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Pas de téléchargement obligatoire : fonctionne directement dans n'importe quel navigateur mobile ou via l'application native.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-emerald-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '2px',
                    flexShrink: 0,
                  }}
                >
                  <Check size={18} strokeWidth={2.5} color="#059669" />
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                    Centre de notifications réactif
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Recevez les annonces d'offres promotionnelles et les confirmations d'ouverture en direct.
                  </p>
                </div>
              </div>
            </div>

            <a
              href="#explorer"
              className="btn btn-primary"
              style={{ padding: '14px 28px', fontSize: '1rem' }}
            >
              <span>Tester la démo Tfarhida</span>
              <ArrowUpRight size={18} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
