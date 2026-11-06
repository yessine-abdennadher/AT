import React from 'react';
import { Sparkles, Star, Wifi, Battery, Signal } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const MobileAppShowcase: React.FC = () => {
  const { t, isRTL } = useLanguage();

  return (
    <section
      id="app-mobile"
      style={{
        padding: '90px 0',
        backgroundColor: 'var(--bg-main)',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        width: '100%',
        maxWidth: '100%',
        position: 'relative',
      }}
    >
      <div className="container" style={{ width: '100%', maxWidth: 'var(--max-width-container)' }}>
        {/* ── Grande Carte Monolithique Apple Pro (Bleu Royal & Cyan Vibrant Tfarhida) ── */}
        <div
          className="app-fever-banner"
          style={{
            position: 'relative',
            background: 'linear-gradient(135deg, #0284C7 0%, #1D4ED8 50%, #312E81 100%)',
            borderRadius: '32px',
            overflow: 'hidden',
            boxShadow: '0 30px 70px -15px rgba(29, 78, 216, 0.42), 0 10px 30px -8px rgba(2, 132, 199, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            color: '#FFFFFF',
          }}
        >
          {/* Lueur d'ambiance Cyan satin & Violet subtil */}
          <div
            style={{
              position: 'absolute',
              top: '-100px',
              right: isRTL ? 'auto' : '-100px',
              left: isRTL ? '-100px' : 'auto',
              width: '500px',
              height: '500px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.22) 0%, rgba(56, 189, 248, 0.25) 50%, transparent 75%)',
              filter: 'blur(65px)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-120px',
              left: isRTL ? 'auto' : '-100px',
              right: isRTL ? '-100px' : 'auto',
              width: '450px',
              height: '450px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
              filter: 'blur(60px)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
              alignItems: 'center',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Colonne Gauche : Titre Épuré Apple, Description, QR Code & Stores */}
            <div
              style={{
                padding: 'clamp(32px, 5vw, 64px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(2rem, 3.6vw, 3rem)',
                  fontWeight: 900,
                  lineHeight: 1.15,
                  letterSpacing: '-0.035em',
                  color: '#FFFFFF',
                  marginBottom: '16px',
                  maxWidth: '520px',
                }}
              >
                <span>{t('appBanner.titlePart1')}</span>{' '}
                <span
                  style={{
                    background: 'linear-gradient(90deg, #FFFFFF 0%, #7DD3FC 60%, #BAE6FD 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {t('appBanner.titlePart2')}
                </span>
              </h2>

              <p
                style={{
                  fontSize: 'clamp(0.95rem, 1.2vw, 1.05rem)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  lineHeight: 1.65,
                  maxWidth: '460px',
                  marginBottom: '32px',
                }}
              >
                {t('appBanner.subtitle')}
              </p>

              {/* Bloc QR Code + Badges Stores Apple */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  flexWrap: 'wrap',
                }}
              >
                {/* Boîte QR Code Épurée */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '20px',
                      padding: '12px',
                      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.22)',
                      border: '1px solid rgba(255, 255, 255, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {/* SVG QR Code vectoriel haute fidélité */}
                    <svg
                      width="95"
                      height="95"
                      viewBox="0 0 100 100"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ display: 'block' }}
                      aria-label="QR Code Tfarhida"
                    >
                      <rect width="100" height="100" rx="8" fill="#FFFFFF" />
                      <rect x="8" y="8" width="28" height="28" rx="4" fill="#0F2042" />
                      <rect x="12" y="12" width="20" height="20" rx="2" fill="#FFFFFF" />
                      <rect x="16" y="16" width="12" height="12" rx="2" fill="#0284C7" />

                      <rect x="64" y="8" width="28" height="28" rx="4" fill="#0F2042" />
                      <rect x="68" y="12" width="20" height="20" rx="2" fill="#FFFFFF" />
                      <rect x="72" y="16" width="12" height="12" rx="2" fill="#0284C7" />

                      <rect x="8" y="64" width="28" height="28" rx="4" fill="#0F2042" />
                      <rect x="12" y="68" width="20" height="20" rx="2" fill="#FFFFFF" />
                      <rect x="16" y="72" width="12" height="12" rx="2" fill="#0284C7" />

                      <rect x="42" y="10" width="6" height="6" rx="1.5" fill="#0F2042" />
                      <rect x="52" y="10" width="6" height="6" rx="1.5" fill="#0F2042" />
                      <rect x="42" y="20" width="6" height="6" rx="1.5" fill="#0284C7" />
                      <rect x="52" y="24" width="6" height="6" rx="1.5" fill="#0F2042" />
                      <rect x="42" y="32" width="6" height="6" rx="1.5" fill="#0F2042" />

                      <rect x="10" y="42" width="6" height="6" rx="1.5" fill="#0F2042" />
                      <rect x="20" y="44" width="6" height="6" rx="1.5" fill="#0284C7" />
                      <rect x="30" y="42" width="6" height="6" rx="1.5" fill="#0F2042" />
                      <rect x="42" y="44" width="16" height="14" rx="3" fill="#0284C7" />
                      <rect x="64" y="42" width="6" height="6" rx="1.5" fill="#0F2042" />
                      <rect x="74" y="44" width="6" height="6" rx="1.5" fill="#0284C7" />
                      <rect x="84" y="42" width="6" height="6" rx="1.5" fill="#0F2042" />

                      <rect x="42" y="64" width="6" height="6" rx="1.5" fill="#0F2042" />
                      <rect x="52" y="68" width="6" height="6" rx="1.5" fill="#0284C7" />
                      <rect x="42" y="76" width="6" height="6" rx="1.5" fill="#0F2042" />
                      <rect x="52" y="82" width="6" height="6" rx="1.5" fill="#0F2042" />

                      <rect x="64" y="64" width="6" height="6" rx="1.5" fill="#0284C7" />
                      <rect x="74" y="64" width="6" height="6" rx="1.5" fill="#0F2042" />
                      <rect x="84" y="68" width="6" height="6" rx="1.5" fill="#0F2042" />
                      <rect x="68" y="76" width="6" height="6" rx="1.5" fill="#0F2042" />
                      <rect x="78" y="76" width="12" height="6" rx="1.5" fill="#0284C7" />
                      <rect x="64" y="86" width="10" height="6" rx="1.5" fill="#0F2042" />
                      <rect x="80" y="86" width="10" height="6" rx="1.5" fill="#0F2042" />
                    </svg>
                  </div>
                  <span
                    style={{
                      marginTop: '10px',
                      fontSize: '0.725rem',
                      fontWeight: 800,
                      color: '#FFFFFF',
                      letterSpacing: '0.04em',
                      textAlign: 'center',
                      textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    }}
                  >
                    {t('appBanner.scanQr')}
                  </span>
                </div>

                {/* Boutons Officiels Google Play (Apple Pro Black Satin) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
                  {/* Google Play */}
                  <a
                    href="#download-android"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      backgroundColor: 'rgba(15, 23, 42, 0.88)',
                      backdropFilter: 'blur(10px)',
                      color: '#FFFFFF',
                      padding: '11px 20px',
                      borderRadius: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.22)',
                      boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.3)',
                      textDecoration: 'none',
                      transition: 'all 0.25s ease',
                      minWidth: '185px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.98)';
                      e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(0, 0, 0, 0.5), 0 0 14px rgba(255, 255, 255, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.88)';
                      e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(0, 0, 0, 0.3)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.22)';
                    }}
                  >
                    <svg width="22" height="24" viewBox="0 0 512 512">
                      <path fill="#00E676" d="M12.1 23.3L275.9 256 12.1 488.7c-5.7-4.4-9.1-11.3-9.1-19V42.3c0-7.7 3.4-14.6 9.1-19z" />
                      <path fill="#FFD600" d="M375.3 169.5L275.9 256l99.4 86.5 61.1-34.9c17.5-10 27.6-27.7 27.6-47.6s-10.1-37.6-27.6-47.6l-61.1-32.9z" />
                      <path fill="#00B0FF" d="M12.1 23.3l363.2 146.2L275.9 256 12.1 23.3z" />
                      <path fill="#FF3D00" d="M12.1 488.7L275.9 256l99.4 86.5L12.1 488.7z" />
                    </svg>
                    <div>
                      <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', lineHeight: 1, color: '#94A3B8' }}>
                        {t('appBanner.getGooglePlay')}
                      </p>
                      <p style={{ fontSize: '0.975rem', fontWeight: 800, lineHeight: 1.15, color: '#FFFFFF' }}>
                        {t('appBanner.googlePlay')}
                      </p>
                    </div>
                  </a>
                </div>
              </div>
            </div>

            {/* Colonne Droite : Maquette iPhone Pro Réaliste */}
            <div
              className="app-phone-container"
              style={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                paddingTop: '32px',
                paddingRight: isRTL ? '0' : '28px',
                paddingLeft: isRTL ? '28px' : '0',
                overflow: 'hidden',
                maxHeight: '510px',
              }}
            >
              {/* Châssis iPhone avec écran de l'application Tfarhida */}
              <div
                style={{
                  width: '320px',
                  maxWidth: '92%',
                  backgroundColor: '#0F172A',
                  borderRadius: '42px 42px 0 0',
                  padding: '10px 10px 0 10px',
                  boxShadow: '0 30px 70px -15px rgba(0, 0, 0, 0.45), 0 0 0 1.5px rgba(255, 255, 255, 0.2)',
                  border: '3px solid rgba(255, 255, 255, 0.25)',
                  borderBottom: 'none',
                  transform: 'rotate(-2deg) translateY(6px)',
                  transformOrigin: 'top center',
                  transition: 'transform 0.3s ease',
                }}
              >
                {/* Écran Blanc Interne */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '30px 30px 0 0',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    color: '#0F172A',
                    minHeight: '470px',
                  }}
                >
                  {/* Status Bar iPhone (9:41, icons) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 18px 4px 18px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#0F172A',
                    }}
                  >
                    <span>9:41</span>
                    {/* Dynamic Island */}
                    <div
                      style={{
                        width: '74px',
                        height: '16px',
                        backgroundColor: '#0F172A',
                        borderRadius: '10px',
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Signal size={12} color="#0F172A" />
                      <Wifi size={12} color="#0F172A" />
                      <Battery size={13} color="#0F172A" />
                    </div>
                  </div>

                  {/* Header App : Brand Logo + Points Badge */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        className="text-gradient-tfarhida"
                        style={{
                          fontSize: '1.3rem',
                          fontFamily: 'var(--font-display)',
                          fontWeight: 900,
                          letterSpacing: '-0.03em',
                        }}
                      >
                        tfarhida
                      </span>
                    </div>

                    {/* Badge Club Points */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: '#FEF3C7',
                        border: '1px solid #FCD34D',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.725rem',
                        fontWeight: 800,
                        color: '#92400E',
                      }}
                    >
                      <Star size={11} fill="#F59E0B" color="#F59E0B" />
                      <span>300</span>
                    </div>
                  </div>

                  {/* Titre : Top Expériences */}
                  <div style={{ padding: '6px 16px 10px' }}>
                    <h3
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 900,
                        color: '#0F172A',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {t('appBanner.topTitle')}
                    </h3>
                  </div>

                  {/* Cartes Expériences avec Grands Chiffres 1, 2, 3 superposés */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      padding: '0 16px',
                      overflowX: 'hidden',
                    }}
                  >
                    {/* Carte 1 : Bubble Planet & Jeux */}
                    <div
                      style={{
                        position: 'relative',
                        flex: '0 0 120px',
                        height: '145px',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    >
                      <img
                        src="https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=300&q=80"
                        alt="Bowling & Jeux"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)',
                        }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '-4px',
                          left: '4px',
                          fontFamily: 'var(--font-display)',
                          fontSize: '3.6rem',
                          fontWeight: 900,
                          lineHeight: 1,
                          color: '#FFFFFF',
                          textShadow: '0 2px 8px rgba(0,0,0,0.8), -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                          userSelect: 'none',
                        }}
                      >
                        1
                      </span>
                    </div>

                    {/* Carte 2 : Aventure & Loisirs */}
                    <div
                      style={{
                        position: 'relative',
                        flex: '0 0 120px',
                        height: '145px',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    >
                      <img
                        src="https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=300&q=80"
                        alt="Aventure & Karting"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)',
                        }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '-4px',
                          left: '4px',
                          fontFamily: 'var(--font-display)',
                          fontSize: '3.6rem',
                          fontWeight: 900,
                          lineHeight: 1,
                          color: '#FFFFFF',
                          textShadow: '0 2px 8px rgba(0,0,0,0.8), -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                          userSelect: 'none',
                        }}
                      >
                        2
                      </span>
                    </div>

                    {/* Carte 3 : Concerts & Soirées */}
                    <div
                      style={{
                        position: 'relative',
                        flex: '0 0 80px',
                        height: '145px',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        opacity: 0.85,
                      }}
                    >
                      <img
                        src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=200&q=80"
                        alt="Concerts & Soirées"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '-4px',
                          left: '4px',
                          fontFamily: 'var(--font-display)',
                          fontSize: '3.6rem',
                          fontWeight: 900,
                          lineHeight: 1,
                          color: '#FFFFFF',
                          textShadow: '0 2px 8px rgba(0,0,0,0.8), -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                          userSelect: 'none',
                        }}
                      >
                        3
                      </span>
                    </div>
                  </div>

                  {/* Section Inférieure : Musique live & Cafés */}
                  <div style={{ padding: '14px 16px 6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>
                        {t('appBanner.candlelight')}
                      </h4>
                      <span style={{ fontSize: '0.725rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                        {t('appBanner.seeAll')}
                      </span>
                    </div>

                    <div
                      style={{
                        height: '68px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <img
                        src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80"
                        alt="Ambiance live"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(6, 11, 36, 0.45)',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 12px',
                        }}
                      >
                        <span style={{ fontSize: '0.725rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Sparkles size={13} color="#FDE047" />
                          <span>{t('appBanner.liveMusic')}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MobileAppShowcase;
