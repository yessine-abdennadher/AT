import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Search,
  X,
  MapPinned,
  Sparkles,
  Zap,
  Users,
  Moon,
  Coffee,
  Utensils,
  Gamepad2,
  Compass,
} from 'lucide-react';
import { AnimatedGlowRecommendationButton } from '../ui/AnimatedGlowRecommendationButton';
import '../../styles/user-discovery.css';

export type DiscoveryMood = 'all' | 'openNow' | 'family' | 'tonight' | 'cafe' | 'food' | 'fun';

interface UserDiscoveryHeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeMood: DiscoveryMood;
  onSelectMood: (mood: DiscoveryMood) => void;
}

export const UserDiscoveryHero: React.FC<UserDiscoveryHeroProps> = ({
  searchQuery,
  onSearchChange,
  activeMood,
  onSelectMood,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Détermination de la salutation selon l'heure locale
  const greeting = useMemo(() => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) return t('discovery.greetingMorning');
    if (currentHour < 18) return t('discovery.greetingAfternoon');
    return t('discovery.greetingEvening');
  }, [t]);

  const isEvening = useMemo(() => {
    const hour = new Date().getHours();
    return hour >= 18;
  }, []);

  const firstName = user?.name ? user.name.split(' ')[0] : '';
  const city = user?.city?.trim() || t('nav.cityActive');

  const subtitle = isEvening
    ? t('discovery.subheadingEvening').replace('{city}', city)
    : t('discovery.subheading').replace('{city}', city);

  const moods: { id: DiscoveryMood; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: t('discovery.moods.all'), icon: <Compass size={15} /> },
    { id: 'openNow', label: t('discovery.moods.openNow'), icon: <Zap size={15} /> },
    { id: 'family', label: t('discovery.moods.family'), icon: <Users size={15} /> },
    { id: 'tonight', label: t('discovery.moods.tonight'), icon: <Moon size={15} /> },
    { id: 'cafe', label: t('discovery.moods.cafe'), icon: <Coffee size={15} /> },
    { id: 'food', label: t('discovery.moods.food'), icon: <Utensils size={15} /> },
    { id: 'fun', label: t('discovery.moods.fun'), icon: <Gamepad2 size={15} /> },
  ];

  return (
    <section className="discovery-hero">
      <div className="discovery-hero-content">
        {/* 1. Salutation Personnalisée */}
        <div className="discovery-greeting-box">
          <div>
            <div className="discovery-badge">
              <Sparkles size={14} />
              <span>{t('brand.name')} · {city}</span>
            </div>
            <h1 className="discovery-title">
              {greeting} <span className="discovery-title-user">{firstName}</span>
            </h1>
            <p className="discovery-subtitle">{subtitle}</p>
          </div>

          {/* Raccourcis Rapides vers Carte & Assistant IA */}
          <div className="discovery-quick-actions">
            <Link to="/carte" className="discovery-action-pill" title={t('discovery.viewMap')}>
              <MapPinned size={16} />
              <span>{t('discovery.viewMap')}</span>
            </Link>
            <Link to="/assistant" className="discovery-action-pill assistant-pill" title={t('discovery.askAssistant')}>
              <Sparkles size={16} />
              <span>{t('discovery.askAssistant')}</span>
            </Link>
          </div>
        </div>

        {/* 2. Barre de Recherche Directe */}
        <div className="discovery-search-wrapper">
          <div className="discovery-search-box">
            <Search size={18} className="discovery-search-icon" />
            <input
              type="text"
              className="discovery-search-input"
              placeholder={t('discovery.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label={t('discovery.searchPlaceholder')}
            />
            {searchQuery && (
              <button
                type="button"
                className="discovery-search-clear"
                onClick={() => onSearchChange('')}
                aria-label="Effacer"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* 3. Bouton Signature Recommandation IA 360° (Miroir App Mobile) */}
        <AnimatedGlowRecommendationButton />

        {/* 4. Filtres d'Ambiance Express */}
        <div className="discovery-moods-container" role="tablist" aria-label="Filtres d'ambiance">
          {moods.map((mood) => (
            <button
              key={mood.id}
              type="button"
              role="tab"
              aria-selected={activeMood === mood.id}
              className={`discovery-mood-pill ${activeMood === mood.id ? 'active' : ''}`}
              onClick={() => onSelectMood(mood.id)}
            >
              {mood.icon}
              <span>{mood.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
