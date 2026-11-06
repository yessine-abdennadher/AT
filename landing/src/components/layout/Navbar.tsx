import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Sun, Moon, Globe, Menu, X, Building2, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage, type Language } from '../../context/LanguageContext';

interface NavbarProps {
  isPartnerView?: boolean;
  onToggleView: (view: 'client' | 'partner') => void;
  onOpenApp?: () => void;
  onOpenProModal?: () => void;
  onSelectCity?: (city: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isPartnerView = false,
  onToggleView,
  onOpenProModal,
}) => {
  const { toggleTheme, isDark } = useTheme();
  const { language, setLanguage, t, isRTL } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages: { code: Language; label: string; badge: string }[] = [
    { code: 'fr', label: 'Français', badge: 'FR' },
    { code: 'ar', label: 'العربية', badge: 'AR' },
    { code: 'en', label: 'English', badge: 'EN' },
  ];

  // Sur le Hero Vidéo : Transparent cinématographique uniquement en Mode Sombre (la vidéo traverse la navbar).
  // En Mode Clair : Navbar en blanc satiné dépoli pour une netteté et un contraste impeccables.
  const isHeroActive = !isPartnerView && !isScrolled && isDark;

  return (
    <header className={`site-header ${isHeroActive ? 'on-hero' : 'scrolled'}`}>
      <div className="container navbar-inner">
        {/* 1. Marque & Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onToggleView('client');
            }}
            className="navbar-brand"
          >
            {language === 'ar' ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                <img
                  src="/Logo.png"
                  alt="Tfarhida Logo"
                  className="navbar-brand-logo"
                  style={{ height: '34px', width: 'auto' }}
                />
                <span className="navbar-brand-title">
                  {t('brand.name')}
                  {isPartnerView && (
                    <span className="navbar-brand-domain"> Business</span>
                  )}
                </span>
              </div>
            ) : (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <img
                  src={isDark ? '/logo-full-white.png' : '/logo-full.png'}
                  alt="Tfarhida"
                  className="navbar-brand-logo-full"
                />
                {isPartnerView && (
                  <span className="navbar-brand-domain"> Business</span>
                )}
              </div>
            )}
          </a>
        </div>

        {/* 2. Liens Centraux Desktop (Adaptés selon la vue Client vs Partenaire) */}
        {!isPartnerView ? (
          <nav className="navbar-links">
            <a href="#explorer" className="navbar-link">
              {t('nav.explore')}
            </a>

            <a href="#piliers" className="navbar-link">
              {t('nav.advantages')}
            </a>

            <button
              type="button"
              onClick={() => onToggleView('partner')}
              className="navbar-link navbar-link-partner"
            >
              <Building2 size={16} />
              <span>{t('partnerPortal.switchPartner')}</span>
            </button>
          </nav>
        ) : (
          <nav className="navbar-links">
            <a href="#tarifs" className="navbar-link">
              {t('nav.pricing')}
            </a>

            <button
              type="button"
              onClick={() => onToggleView('client')}
              className="navbar-link navbar-link-partner"
            >
              {isRTL ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
              <span>{t('partnerPortal.switchClient')}</span>
            </button>
          </nav>
        )}

        {/* 3. Contrôles de Droite (Ville, Langue, Thème, CTA) */}
        <div className="navbar-actions">
      
          {/* Sélecteur de Langue (FR / AR / EN) */}
          <div ref={langMenuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => {
                setLangMenuOpen(!langMenuOpen);
              }}
              className="nav-pill-btn"
              title="Changer de langue"
              aria-label="Changer de langue"
            >
              <Globe size={14} className="nav-btn-icon" />
              <span>{language.toUpperCase()}</span>
              <ChevronDown size={13} className="nav-chevron-icon" />
            </button>

            {langMenuOpen && (
              <div className="nav-dropdown-menu">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setLanguage(l.code);
                      setLangMenuOpen(false);
                    }}
                    className={`nav-dropdown-item ${language === l.code ? 'active' : ''}`}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 5px', borderRadius: '4px', backgroundColor: 'var(--color-pale-blue)', color: 'var(--color-primary)' }}>{l.badge}</span>
                      <span>{l.label}</span>
                    </span>
                    {language === l.code && <Check size={14} color="var(--color-primary)" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bouton Thème Sombre / Clair */}
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title={isDark ? t('theme.lightMode') : t('theme.darkMode')}
            aria-label={t('theme.switch')}
          >
            {isDark ? (
              <Sun size={18} className="theme-icon-sun" />
            ) : (
              <Moon size={18} className="theme-icon-moon" />
            )}
          </button>

          {/* Bouton CTA Partenaire (affiché uniquement sur la vue Partenaire) */}
          {isPartnerView && (
            <button
              type="button"
              onClick={onOpenProModal}
              className="btn btn-primary nav-cta-btn"
            >
              <Building2 size={16} />
              <span>{t('nav.registerSteps')}</span>
            </button>
          )}
          

          {/* Bouton Menu Mobile */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-btn"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* 4. Tiroir Mobile Responsive */}
      <div className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        {!isPartnerView ? (
          <>
            <a
              href="#explorer"
              className="navbar-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.explore')}
            </a>
            <a
              href="#piliers"
              className="navbar-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.advantages')}
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onToggleView('partner');
              }}
              className="navbar-link"
              style={{ textAlign: isRTL ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', fontWeight: 700 }}
            >
              <Building2 size={16} color="var(--color-primary)" />
              <span>{t('partnerPortal.switchPartner')}</span>
            </button>
          </>
        ) : (
          <>
            <a
              href="#tarifs"
              className="navbar-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.pricing')}
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onToggleView('client');
              }}
              className="navbar-link"
              style={{ textAlign: isRTL ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {isRTL ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
              <span>{t('partnerPortal.switchClient')}</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};
