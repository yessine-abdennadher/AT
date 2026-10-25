import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, PhoneCall, ChevronDown, MapPin } from 'lucide-react';

interface NavbarProps {
  onOpenApp?: () => void;
  onSelectCity?: (city: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenApp, onSelectCity }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Sfax (Actif)');
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setCityMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cities = ['Sfax (Actif)', 'Tunis', 'Sousse', 'Djerba'];

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--nav-height)',
        zIndex: 1000,
        backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
        backdropFilter: isScrolled ? 'blur(12px)' : 'none',
        borderBottom: isScrolled ? '1px solid var(--border-subtle)' : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}
    >
      <div
        className="container"
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo & Identité Tfarhida */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src="/Logo.png"
            alt="Tfarhida Logo"
            style={{
              width: '44px',
              height: '44px',
              objectFit: 'contain',
              borderRadius: '12px',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)',
              backgroundColor: '#FFFFFF',
              padding: '3px',
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'var(--color-navy)',
                }}
              >
                Tfarhida<span style={{ color: 'var(--color-primary)' }}>.tn</span>
              </span>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-arabic)',
                  fontWeight: 700,
                  color: 'var(--color-purple-signature)',
                  backgroundColor: 'var(--color-pale-purple)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                تفرهيدة
              </span>
            </div>
            <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1 }}>
              شنوّة نعمل توّا؟ · Guide sorties Tunisie
            </p>
          </div>
        </div>

        {/* Liens de Navigation Desktop */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '28px',
          }}
          className="desktop-nav"
        >
          <a
            href="#explorer"
            style={{
              fontSize: '0.925rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Explorer les sorties
          </a>

          <a
            href="#piliers"
            style={{
              fontSize: '0.925rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Avantages
          </a>

          <a
            href="#partenaires"
            style={{
              fontSize: '0.925rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Espace Pro
          </a>

          {/* Sélecteur de ville interactif */}
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setCityMenuOpen(!cityMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-pale-blue)',
                color: 'var(--color-primary)',
                fontSize: '0.825rem',
                fontWeight: 700,
                border: '1px solid var(--border-accent)',
              }}
            >
              <MapPin size={13} color="var(--color-primary)" />
              <span>{selectedCity}</span>
              <ChevronDown size={14} />
            </button>

            {cityMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-lg)',
                  border: '1px solid var(--border-subtle)',
                  padding: '6px',
                  minWidth: '160px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                {cities.map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      setSelectedCity(city);
                      setCityMenuOpen(false);
                      if (onSelectCity) onSelectCity(city);
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: selectedCity === city ? 700 : 500,
                      color: selectedCity === city ? 'var(--color-primary)' : 'var(--text-secondary)',
                      backgroundColor: selectedCity === city ? 'var(--color-pale-blue)' : 'transparent',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={12} color={selectedCity === city ? 'var(--color-primary)' : 'var(--text-muted)'} />
                      <span>{city}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Boutons d'Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a
            href="tel:+21674000000"
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.875rem' }}
          >
            <PhoneCall size={16} />
            <span>Assistance</span>
          </a>

          <button
            onClick={onOpenApp}
            className="btn btn-primary"
            style={{ padding: '9px 20px', fontSize: '0.875rem' }}
          >
            <Sparkles size={16} />
            <span>Ouvrir Tfarhida</span>
          </button>
        </div>
      </div>
    </header>
  );
};
