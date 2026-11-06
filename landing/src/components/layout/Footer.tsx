import React from 'react';
import { Mail, Phone, Zap, Building2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

const InstagramIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const LinkedinIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

interface FooterProps {
  onSwitchView?: (view: 'client' | 'partner') => void;
}

export const Footer: React.FC<FooterProps> = ({ onSwitchView }) => {
  const { t, isRTL } = useLanguage();
  const { isDark } = useTheme();
  return (
    <footer className="site-footer">
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '40px',
            marginBottom: '48px',
          }}
        >
          {/* Colonne 1 : Marque Tfarhida & Réseaux Sociaux */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              {isRTL ? (
                <>
                  <img
                    src="/Logo.png"
                    alt="Tfarhida Logo"
                    style={{
                      height: '34px',
                      width: 'auto',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 2px 6px rgba(0, 210, 255, 0.25))',
                    }}
                  />
                  <span style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--color-navy)' }}>
                    {t('brand.name')}
                  </span>
                </>
              ) : (
                <img
                  src={isDark ? '/logo-full-white.png' : '/logo-full.png'}
                  alt="Tfarhida"
                  style={{
                    height: '32px',
                    width: 'auto',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 2px 6px rgba(0, 210, 255, 0.22))',
                  }}
                />
              )}
              <span
                style={{
                  fontSize: '0.8rem',
                  fontFamily: isRTL ? 'var(--font-arabic)' : 'inherit',
                  fontWeight: 700,
                  color: 'var(--color-purple-signature)',
                  backgroundColor: 'var(--color-pale-purple)',
                  padding: '2px 8px',
                  borderRadius: '8px',
                }}
              >
                {t('brand.taglineShort')}
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--footer-text)', marginBottom: '20px' }}>
              {t('footer.tagline')}
            </p>

            {/* Réseaux Sociaux Officiels */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram Tfarhida"
                className="footer-social-link"
              >
                <InstagramIcon size={18} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook Tfarhida"
                className="footer-social-link"
              >
                <FacebookIcon size={18} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn Tfarhida"
                className="footer-social-link"
              >
                <LinkedinIcon size={18} />
              </a>
            </div>
          </div>

          {/* Colonne 2 : Villes & Régions */}
          <div>
            <h4 className="footer-heading">{t('footer.citiesTitle')}</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem' }}>
              <li>
                <a
                  href="#explorer"
                  className="footer-link"
                  style={{ fontWeight: 700, color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Zap size={14} color="var(--color-primary)" />
                  <span>{t('footer.sfaxActive')}</span>
                </a>
              </li>
              <li>
                <span style={{ color: 'var(--footer-subtext)', fontSize: '0.85rem' }}>
                  Grand Tunis ({t('footer.comingSoon')})
                </span>
              </li>
              <li>
                <span style={{ color: 'var(--footer-subtext)', fontSize: '0.85rem' }}>
                  Sousse & Sahel ({t('footer.comingSoon')})
                </span>
              </li>
              <li>
                <span style={{ color: 'var(--footer-subtext)', fontSize: '0.85rem' }}>
                  Djerba & Sud ({t('footer.comingSoon')})
                </span>
              </li>
            </ul>
          </div>

          {/* Colonne 3 : Navigation Rapide */}
          <div>
            <h4 className="footer-heading">{t('footer.navTitle')}</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem' }}>
              <li>
                <a href="#explorer" className="footer-link">
                  {t('footer.navExplore')}
                </a>
              </li>
              <li>
                <a href="#piliers" className="footer-link">
                  {t('footer.navAdvantages')}
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSwitchView ? onSwitchView('partner') : (window.location.hash = '#/partenaire')}
                  className="footer-link"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'inherit', color: 'var(--color-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Building2 size={15} color="var(--color-primary)" />
                  <span>{t('footer.navPartners')}</span>
                </button>
              </li>
              <li>
                <a href="tel:+21674000000" className="footer-link">
                  {t('footer.support')}
                </a>
              </li>
            </ul>
          </div>

          {/* Colonne 4 : Contact Direct */}
          <div>
            <h4 className="footer-heading">{t('footer.contactTitle')}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.875rem' }}>
              <a
                href="mailto:contact@tfarhida.tn"
                className="footer-link"
                style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <Mail size={16} color="var(--color-primary)" />
                <span>contact@tfarhida.tn</span>
              </a>
              <a
                href="tel:+21674000000"
                className="footer-link"
                style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <Phone size={16} color="var(--color-primary)" />
                <span>+216 74 000 000</span>
              </a>
            </div>
          </div>
        </div>

        {/* Ligne inférieure de Copyright */}
        <div className="footer-bottom-line">
          <p>© {new Date().getFullYear()} {t('brand.name')}. {t('footer.rights')}</p>
          <p>{t('footer.designedFor')}</p>
        </div>
      </div>
    </footer>
  );
};
