import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ArrowRight,
  ArrowLeft,
  Star,
  MapPin,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLanguage } from '../../context/LanguageContext';
import { fetchSearchSuggestions, type SearchSuggestion } from '../../services/activityApi';
import { DEMO_ACTIVITIES, type DemoActivity } from '../../data/demoActivities';
import heroVideo from '../../assets/1030.mp4';
import heroPoster from '../../assets/hero-video-poster.jpg';

interface HeroSectionProps {
  onSearch?: (query: string) => void;
  onExploreClick?: () => void;
  onSelectActivity?: (activity: DemoActivity) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSearch,
  onExploreClick,
  onSelectActivity,
}) => {
  const { t, isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Charger les suggestions dynamiques (au clic ou lors de la frappe avec debounce)
  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    const handler = setTimeout(() => {
      fetchSearchSuggestions(searchQuery)
        .then((res) => {
          setSuggestions(res.suggestions);
          setActiveIndex(-1);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 200);

    return () => clearTimeout(handler);
  }, [searchQuery, isOpen]);

  // Fermer le dropdown si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerConfetti = (queryToSearch?: string) => {
    const q = queryToSearch !== undefined ? queryToSearch : searchQuery;
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#0284C7', '#38BDF8', '#FF4B5C', '#10B981'],
    });
    setIsOpen(false);
    if (onSearch) onSearch(q);
    if (onExploreClick) onExploreClick();

    // Défilement fluide vers la section Explorer
    const explorerEl = document.getElementById('explorer');
    if (explorerEl) {
      explorerEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.name);
    setIsOpen(false);
    triggerConfetti(suggestion.name);

    if (onSelectActivity) {
      const matched = DEMO_ACTIVITIES.find((a) => a.id === suggestion.id);
      if (matched) {
        onSelectActivity(matched);
      } else {
        onSelectActivity({
          id: suggestion.id,
          name: suggestion.name,
          nameAr: suggestion.nameAr,
          city: suggestion.city,
          locationName: suggestion.locationName,
          category: (['fun', 'food', 'outdoor', 'creative'].includes(suggestion.category)
            ? suggestion.category
            : 'fun') as any,
          categoryLabel: 'Sortie Tfarhida',
          price: suggestion.price,
          rating: suggestion.rating,
          reviewCount: 42,
          imageUrl: suggestion.imageUrl,
          lightingActive: suggestion.powerBackupMode,
          directContact: true,
          highlight: suggestion.name,
          tags: ['Tfarhida', 'Vérifié'],
        });
      }
    }
  };

  return (
    <section
      style={{
        paddingTop: 'calc(var(--nav-height) + 40px)',
        paddingBottom: '80px',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '620px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* ── Vidéo d'Arrière-Plan Cinématographique (Mairie de Sfax) ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        <video
          src={heroVideo}
          poster={heroPoster}
          autoPlay
          muted
          loop
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 40%',
            transform: 'scale(1.04)',
          }}
        />

        {/* Voile Supérieur Sombre & Lisibilité Titre (s'estompe délicatement avant la barque) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(7, 13, 24, 0.72) 0%, rgba(7, 13, 24, 0.42) 32%, rgba(7, 13, 24, 0.12) 55%, transparent 72%)',
          }}
        />

        {/* Protection latérale du texte (laisse l'eau et la barque à droite 100% cristallines) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: isRTL ? 'auto' : 0,
            right: isRTL ? 0 : 'auto',
            width: '58%',
            background: isRTL
              ? 'linear-gradient(270deg, rgba(7, 13, 24, 0.45) 0%, transparent 100%)'
              : 'linear-gradient(90deg, rgba(7, 13, 24, 0.45) 0%, transparent 100%)',
          }}
        />

        {/* Lueur Cyan d'ambiance */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: isRTL ? 'auto' : '10%',
            right: isRTL ? '10%' : 'auto',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(2, 132, 199, 0.22) 0%, transparent 70%)',
            filter: 'blur(75px)',
          }}
        />

        {/* Fondu vers le fond du site uniquement sur les derniers 28% en bas */}
        <div className="hero-bottom-fade" />
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            alignItems: 'center',
            gap: '40px',
            width: '100%',
            maxWidth: '100%',
          }}
        >
          {/* Colonne Gauche : Proposition de Valeur Directe & Recherche Guidée */}
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.3rem, 4.8vw, 3.6rem)',
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                marginBottom: '16px',
                color: '#FFFFFF',
                textShadow: '0 2px 12px rgba(0, 0, 0, 0.4)',
              }}
            >
              {t('hero.titlePart1')}
              <span
                style={{
                  background: 'linear-gradient(135deg, #38BDF8 0%, #60A5FA 50%, #A78BFA 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {t('hero.titlePart2')}
              </span>
            </h1>

            <p
              style={{
                fontSize: '1.1rem',
                color: 'rgba(255, 255, 255, 0.92)',
                lineHeight: 1.6,
                maxWidth: '560px',
                marginBottom: '26px',
                textShadow: '0 1px 4px rgba(0, 0, 0, 0.5)',
              }}
            >
              {t('hero.subtitle')}
            </p>

            {/* Barre de Recherche Spacieuse avec Dropdown de Suggestions Backend */}
            <div
              ref={searchContainerRef}
              style={{ position: 'relative', maxWidth: '540px', marginBottom: '18px' }}
            >
              <div
                className="hero-search-bar"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--bg-card)',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-xl)',
                  boxShadow: isOpen
                    ? '0 16px 36px rgba(2, 132, 199, 0.35)'
                    : '0 16px 40px -10px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                  border: isOpen ? '1.5px solid var(--color-primary)' : '1.5px solid rgba(255, 255, 255, 0.4)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, paddingLeft: isRTL ? '0' : '10px', paddingRight: isRTL ? '10px' : '0' }}>
                  <Search size={20} color="var(--color-primary)" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (!isOpen) setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={t('hero.searchPlaceholder')}
                    style={{
                      border: 'none',
                      outline: 'none',
                      backgroundColor: 'transparent',
                      width: '100%',
                      fontSize: '0.925rem',
                      color: 'var(--text-primary)',
                      fontFamily: 'inherit',
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        if (!isOpen) {
                          setIsOpen(true);
                        } else {
                          setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
                        }
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        if (isOpen) {
                          setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
                        }
                      } else if (e.key === 'Enter') {
                        if (isOpen && activeIndex >= 0 && suggestions[activeIndex]) {
                          e.preventDefault();
                          handleSelectSuggestion(suggestions[activeIndex]);
                        } else {
                          triggerConfetti();
                        }
                      } else if (e.key === 'Escape') {
                        setIsOpen(false);
                        setActiveIndex(-1);
                      }
                    }}
                  />
                </div>

                <button
                  onClick={() => triggerConfetti()}
                  className="btn btn-primary"
                  style={{ padding: '12px 22px', borderRadius: 'var(--radius-lg)', fontWeight: 700, gap: '6px' }}
                >
                  <span>{t('hero.searchCta')}</span>
                  {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                </button>
              </div>

              {/* Dropdown de Suggestions Flottant */}
              {isOpen && (
                <div
                  className="no-scrollbar"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '20px',
                    border: '1.5px solid var(--border-strong)',
                    boxShadow: '0 20px 48px -8px rgba(0, 0, 0, 0.22)',
                    maxHeight: '390px',
                    overflowY: 'auto',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  {/* État de chargement */}
                  {isLoading ? (
                    <div style={{ padding: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <Loader2 size={18} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
                      <span>{t('hero.suggestionsLoading')}</span>
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {t('hero.suggestionsEmpty')}
                    </div>
                  ) : (
                    <div>
                      {suggestions.map((item, index) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelectSuggestion(item)}
                          style={{
                            padding: '10px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease',
                            borderBottom: '1px solid var(--border-subtle)',
                            backgroundColor: activeIndex === index ? 'var(--color-pale-blue)' : 'transparent',
                          }}
                          onMouseEnter={(e) => {
                            setActiveIndex(index);
                            e.currentTarget.style.backgroundColor = 'var(--color-pale-blue-subtle)';
                          }}
                          onMouseLeave={(e) => {
                            if (activeIndex !== index) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          {/* Miniature + Titre + Ville */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                            />
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-navy)', lineHeight: 1.2 }}>
                                {isRTL && item.nameAr ? item.nameAr : item.name}
                              </h4>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <MapPin size={11} color="var(--color-primary)" />
                                <span>{item.locationName || item.city}</span>
                              </p>
                            </div>
                          </div>

                          {/* Note + Prix */}
                          <div style={{ textAlign: isRTL ? 'left' : 'right', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: isRTL ? 'flex-start' : 'flex-end' }}>
                              <Star size={11} fill="#F59E0B" color="#F59E0B" />
                              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-navy)' }}>
                                {item.rating.toFixed(1)}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                              {item.price > 0 ? `${item.price} DT` : t('explorer.freeAccess')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pied de liste : Découvrir toutes les sorties */}
                  <div
                    onClick={() => triggerConfetti()}
                    style={{
                      padding: '11px 16px',
                      backgroundColor: 'var(--bg-main)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      borderTop: '1px solid var(--border-subtle)',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-pale-blue)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-main)')}
                  >
                    <span>{t('hero.suggestionsSeeAll')}</span>
                    {isRTL ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Colonne Droite : Showcase Produit Vivant (Vraies Cartes de Sorties) */}
          <div
            className="hero-orb-col"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '100%',
              minHeight: '460px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Halo lumineux d'ambiance */}
            <div
              style={{
                position: 'absolute',
                width: '380px',
                maxWidth: '100%',
                height: '380px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(2, 132, 199, 0.25) 0%, rgba(124, 58, 237, 0.12) 50%, transparent 75%)',
                filter: 'blur(50px)',
                zIndex: 0,
              }}
            />

         

        

   
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
