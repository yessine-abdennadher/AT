import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { DemoActivity } from '../../data/demoActivities';
import { fetchActivityExplorerData, type ExplorerOption } from '../../services/activityApi';
import { useLanguage } from '../../context/LanguageContext';
import '../../styles/activity-explorer.css';
import { FavoriteButton } from '../ui/FavoriteButton';
import {
  Star,
  MessageCircle,
  MapPin,
  Zap,
  ArrowRight,
  ArrowLeft,
  Compass,
  Gamepad2,
  Coffee,
  Waves,
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  Utensils,
  Dumbbell,
  Tag,
  Phone,
} from 'lucide-react';

type ActivityCategoryFilter = 'all' | 'fun' | 'restaurant' | 'cafe' | 'sport' | 'outdoor' | 'creative';

const isPromotionActive = (activity: DemoActivity): boolean => {
  const promotion = activity.promotion;
  if (!promotion?.isPromo || promotion.discountPercent <= 0) return false;
  if (!promotion.validUntil) return true;
  const expiry = Date.parse(promotion.validUntil);
  return Number.isNaN(expiry) || expiry >= Date.now();
};

interface ActivityExplorerProps {
  onSelectActivity?: (activity: DemoActivity) => void;
  searchQuery?: string;
  onResetSearch?: () => void;
}

export const ActivityExplorer: React.FC<ActivityExplorerProps> = ({
  onSelectActivity,
  searchQuery = '',
  onResetSearch,
}) => {
  const { t, isRTL, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activities, setActivities] = useState<DemoActivity[]>([]);
  const [availableCategories, setAvailableCategories] = useState<ExplorerOption[]>([]);
  const [cities, setCities] = useState<ExplorerOption[]>([]);
  const [totalActivities, setTotalActivities] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [activeCategory, setActiveCategory] = useState<ActivityCategoryFilter>((searchParams.get('category') as ActivityCategoryFilter) || 'all');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || 'all');
  const [localSearch, setLocalSearch] = useState(searchParams.get('search') || '');
  const [loadedPage, setLoadedPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const requestVersion = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery) setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.clientWidth;
      const scrollAmount = direction === 'left' ? -containerWidth * 0.75 : containerWidth * 0.75;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    activeCategory === 'all' ? next.delete('category') : next.set('category', activeCategory);
    selectedCity === 'all' ? next.delete('city') : next.set('city', selectedCity);
    localSearch.trim() ? next.set('search', localSearch.trim()) : next.delete('search');
    setSearchParams(next, { replace: true });
  }, [activeCategory, selectedCity, localSearch]);

  const filters = () => ({
    ...(selectedCity !== 'all' ? { city: selectedCity } : {}),
    ...(activeCategory === 'restaurant' || activeCategory === 'cafe' ? { type: activeCategory } : {}),
    ...(activeCategory !== 'all' && activeCategory !== 'restaurant' && activeCategory !== 'cafe' ? { category: activeCategory } : {}),
    ...(localSearch.trim() ? { search: localSearch.trim() } : {}),
  });

  useEffect(() => {
    let alive = true;
    const requestId = ++requestVersion.current;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setLoadingMore(false);
      setLoadError(false);
      setActivities([]);
      fetchActivityExplorerData(language, { ...filters(), page: 1, limit: 20 })
        .then((data) => {
          if (!alive || requestId !== requestVersion.current) return;
          setActivities(data.activities);
          setAvailableCategories(data.categories);
          setCities(data.cities);
          setTotalActivities(data.total);
          setLoadedPage(data.page);
          setHasMore(data.hasMore);
        })
        .catch(() => { if (alive && requestId === requestVersion.current) setLoadError(true); })
        .finally(() => { if (alive && requestId === requestVersion.current) setLoading(false); });
    }, localSearch.trim() ? 250 : 0);
    return () => { alive = false; window.clearTimeout(timer); };
  }, [language, reloadVersion, activeCategory, selectedCity, localSearch]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    const requestId = requestVersion.current;
    setLoadingMore(true);
    try {
      const data = await fetchActivityExplorerData(language, { ...filters(), page: loadedPage + 1, limit: 20 });
      if (requestId !== requestVersion.current) return;
      setActivities((current) => [...current, ...data.activities]);
      setLoadedPage(data.page);
      setHasMore(data.hasMore);
    } catch { if (requestId === requestVersion.current) setLoadError(true); }
    finally { if (requestId === requestVersion.current) setLoadingMore(false); }
  };

  // Catégories inspirées du Store Apple
  const availableSlugs = new Set(availableCategories.map((category) => category.value));
  const hasFood = availableSlugs.has('food') || activities.some((activity) => activity.category === 'food');
  const categories: { key: ActivityCategoryFilter; label: string; icon: typeof Compass }[] = [
    { key: 'all', label: t('explorer.catAll'), icon: Compass },
    ...(availableSlugs.has('fun') || activities.some((activity) => activity.category === 'fun')
      ? [{ key: 'fun' as const, label: t('explorer.catFun'), icon: Gamepad2 }] : []),
    ...(hasFood ? [
      { key: 'restaurant' as const, label: t('explorer.catRestaurant'), icon: Utensils },
      { key: 'cafe' as const, label: t('explorer.catCafe'), icon: Coffee },
    ] : []),
    ...(availableSlugs.has('sport') || activities.some((activity) => activity.category === 'sport')
      ? [{ key: 'sport' as const, label: t('explorer.catSport'), icon: Dumbbell }] : []),
    ...(availableSlugs.has('outdoor') ? [{ key: 'outdoor' as const, label: t('explorer.catOutdoor'), icon: Waves }] : []),
    ...(availableSlugs.has('creative') ? [{ key: 'creative' as const, label: t('explorer.catCreative'), icon: Sparkles }] : []),
  ];

  const filtered = activities;

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section id="explorer" style={{ padding: '96px 0', backgroundColor: 'var(--bg-main)', position: 'relative' }}>
      <div className="container">
        {/* ── En-tête Apple Keynote (Zéro badge technique, direct & aéré) ── */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 48px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.4rem, 4.5vw, 3.4rem)',
              lineHeight: 1.15,
              fontWeight: 900,
              letterSpacing: '-0.035em',
              color: 'var(--color-navy)',
              marginBottom: '16px',
            }}
          >
            <span>Explorez les sorties.</span>{' '}
            <span className="text-gradient-tfarhida">À vivre maintenant.</span>
          </h2>
          <p
            style={{
              fontSize: '1.15rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
              maxWidth: '620px',
              margin: '0 auto',
            }}
          >
            Adresses vérifiées sur le terrain, contact direct avec les gérants et statut en temps réel.
          </p>
        </div>

        <div className="activity-explorer-filters">
          <label className="activity-explorer-search">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">{t('explorer.searchPlaceholder')}</span>
            <input
              type="search"
              value={localSearch}
              onChange={(event) => setLocalSearch(event.target.value)}
              placeholder={t('explorer.searchPlaceholder')}
              aria-label={t('explorer.searchPlaceholder')}
            />
          </label>
          <label className="activity-explorer-city">
            <MapPin size={17} aria-hidden="true" />
            <span className="sr-only">{t('explorer.cityFilter')}</span>
            <select
              value={selectedCity}
              onChange={(event) => setSelectedCity(event.target.value)}
              aria-label={t('explorer.cityFilter')}
            >
              <option value="all">{t('explorer.allCities')}</option>
              {cities.map((city) => <option key={city.value} value={city.value}>{city.label}</option>)}
            </select>
          </label>
        </div>

        {/* ── Segmented Control iOS Apple Signature Gradient ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '44px',
            overflowX: 'auto',
            paddingBottom: '8px',
          }}
          className="no-scrollbar"
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-strong)',
              padding: '6px',
              borderRadius: 'var(--radius-full)',
              boxShadow: '0 8px 24px -6px rgba(2, 132, 199, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
            }}
          >
            {categories.map((cat) => {
              const IconComponent = cat.icon;
              const isActive = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveCategory(cat.key)}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--color-pale-blue)';
                      e.currentTarget.style.color = 'var(--color-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 22px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.875rem',
                    fontWeight: 800,
                    letterSpacing: '-0.01em',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    background: isActive
                      ? 'linear-gradient(135deg, #0284C7 0%, #2563EB 50%, #7C3AED 100%)'
                      : 'transparent',
                    color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 6px 18px -3px rgba(2, 132, 199, 0.45)' : 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <IconComponent size={15} color={isActive ? '#FFFFFF' : 'var(--color-primary)'} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* État de chargement élégant */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '64px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <Loader2 size={36} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.95rem' }}>
              Chargement des meilleures adresses...
            </p>
          </div>
        )}

        {/* État vide si aucun résultat pour ce filtre */}
        {!loading && loadError && (
          <div className="activity-explorer-error" role="alert">
            <h3>{t('explorer.offlineTitle')}</h3>
            <p>{t('explorer.offlineSubtitle')}</p>
            <button type="button" className="btn btn-secondary" onClick={() => setReloadVersion((version) => version + 1)}>
              {t('explorer.retry')}
            </button>
          </div>
        )}

        {!loading && !loadError && filtered.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '56px 24px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '28px',
              border: '1.5px dashed var(--border-strong)',
              maxWidth: '520px',
              margin: '0 auto',
            }}
          >
            <Compass size={40} color="var(--color-primary)" style={{ margin: '0 auto 14px' }} />
            <h4 style={{ fontSize: '1.2rem', color: 'var(--color-navy)', marginBottom: '8px', fontWeight: 800 }}>
              {t('explorer.emptyTitle')}
            </h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
              {t('explorer.emptySubtitle')}
            </p>
            <button
              onClick={() => {
                setActiveCategory('all');
                setSelectedCity('all');
                setLocalSearch('');
                if (onResetSearch) onResetSearch();
              }}
              className="btn btn-secondary"
              style={{ padding: '10px 20px', borderRadius: 'var(--radius-full)', fontWeight: 800, fontSize: '0.875rem' }}
            >
              {t('explorer.resetFilters')}
            </button>
          </div>
        )}

        {/* ── Contrôles de Navigation Carrousel Discrets & Haut de Gamme ── */}
        {!loading && filtered.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '22px',
              padding: '0 4px',
            }}
          >
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              {filtered.length} / {totalActivities} adresses
            </span>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handleScroll('left')}
                aria-label="Défiler à gauche"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-strong)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-navy)',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.2s ease',
                }}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={() => handleScroll('right')}
                aria-label="Défiler à droite"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-strong)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-navy)',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.2s ease',
                }}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* ── Carrousel Apple Media Cards (3 par vue, fluide et tactile) ── */}
        {!loading && (
          <div
            ref={scrollContainerRef}
            className="no-scrollbar"
            style={{
              display: 'flex',
              gap: '24px',
              overflowX: 'auto',
              overflowY: 'hidden',
              scrollSnapType: 'x mandatory',
              paddingBottom: '24px',
              paddingTop: '4px',
              paddingLeft: '4px',
              paddingRight: '4px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {filtered.map((activity) => (
              <div
                key={activity.id}
                className="activity-card-item"
                role="button"
                tabIndex={0}
                aria-label={`${t('detail.open')}: ${activity.name}`}
                onClick={() => onSelectActivity && onSelectActivity(activity)}
                onKeyDown={(event) => {
                  if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    onSelectActivity?.(activity);
                  }
                }}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '26px',
                  overflow: 'hidden',
                  border: '1px solid rgba(2, 132, 199, 0.15)',
                  boxShadow: '0 12px 30px -10px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, border-color 0.25s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 25px 45px -12px rgba(2, 132, 199, 0.18)';
                  e.currentTarget.style.borderColor = 'var(--color-primary-light)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 12px 30px -10px rgba(0, 0, 0, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(2, 132, 199, 0.15)';
                }}
              >
                {/* ── Média Immersif Apple (Photo avec dégradé d'ombre) ── */}
                <div style={{ position: 'relative', width: '100%', height: '230px', overflow: 'hidden' }}>
                  {activity.imageUrl && <img
                    src={activity.imageUrl}
                    alt={activity.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  />}

                  {/* Voile sombre cinématographique en bas de photo */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, transparent 40%, rgba(6,11,36,0.65) 100%)',
                      pointerEvents: 'none',
                    }}
                  />

                  {/* Bouton Cœur Favori Interactif (Top-Right Apple Glass) */}
                  <FavoriteButton activityId={activity.id} />

                  {/* Badge Statut Live (Flou Gaussien Apple Glass) */}
                  {activity.lightingActive && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        backgroundColor: 'rgba(16, 185, 129, 0.88)',
                        color: '#FFFFFF',
                        padding: '5px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.725rem',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        backdropFilter: 'blur(12px)',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                        zIndex: 3,
                      }}
                    >
                      <Zap size={12} fill="#FFFFFF" color="#FFFFFF" />
                      <span>{t('explorer.liveLight')}</span>
                    </div>
                  )}

                  {isPromotionActive(activity) && (
                    <div className="activity-promotion-badge" style={{ zIndex: 3 }}>
                      <Tag size={13} aria-hidden="true" />
                      <span>-{activity.promotion?.discountPercent}%</span>
                    </div>
                  )}

                  {/* Note Avis Certifiés Flottante (Bas-Gauche) */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      left: '12px',
                      backgroundColor: 'rgba(6, 11, 36, 0.75)',
                      backdropFilter: 'blur(10px)',
                      color: '#FFFFFF',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      zIndex: 3,
                    }}
                  >
                    {activity.reviewCount > 0 ? (
                      <><Star size={12} color="#F59E0B" fill="#F59E0B" /><span>{activity.rating.toFixed(1)} · {activity.reviewCount}</span></>
                    ) : <span>{t('explorer.newActivity')}</span>}
                  </div>

                  {/* Pastille Prix Apple Liquid Glass (Bas-Droite) */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '12px',
                      backgroundColor: activity.price === 0 ? 'rgba(16, 185, 129, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                      color: activity.price === 0 ? '#FFFFFF' : 'var(--color-navy)',
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.85rem',
                      fontWeight: 900,
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                      backdropFilter: 'blur(8px)',
                      zIndex: 3,
                    }}
                  >
                    {activity.price === 0 ? 'Gratuit' : `${activity.price} DT`}
                    {activity.price > 0 && <span style={{ fontSize: '0.725rem', fontWeight: 600, opacity: 0.8 }}> /pers</span>}
                  </div>
                </div>

                {/* ── Contenu & Typographie Épurée ── */}
                <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {/* Localisation */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '0.825rem', fontWeight: 700, marginBottom: '6px' }}>
                    <MapPin size={13} color="var(--color-primary)" />
                    <span>{activity.locationName || activity.city}</span>
                  </div>

                  {/* Titre & Sous-titre Arabe */}
                  <div style={{ marginBottom: '8px' }}>
                    <h3
                      style={{
                        fontSize: '1.2rem',
                        fontWeight: 900,
                        color: 'var(--color-navy)',
                        lineHeight: 1.25,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {activity.name}
                    </h3>
                    {activity.nameAr && (
                      <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-arabic)', color: 'var(--color-purple-signature)', fontWeight: 700 }}>
                        {activity.nameAr}
                      </span>
                    )}
                  </div>

                  {/* Description courte & fluide */}
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.55,
                      marginBottom: '16px',
                      flex: 1,
                    }}
                  >
                    {activity.highlight}
                  </p>

                  {/* Actions : WhatsApp Direct Satiné */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      paddingTop: '14px',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {activity.whatsapp && <a
                      href={`https://wa.me/${activity.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour, je vous contacte depuis Tfarhida pour réserver : ${activity.name}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '11px 16px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'rgba(37, 211, 102, 0.12)',
                        color: '#15803D',
                        border: '1px solid rgba(37, 211, 102, 0.3)',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        textDecoration: 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MessageCircle size={11} color="#FFFFFF" />
                      </div>
                      <span>WhatsApp Direct</span>
                    </a>}

                    {activity.phone && <a className="activity-phone-link" href={`tel:${activity.phone}`} aria-label={`${t('detail.call')}: ${activity.name}`}><Phone size={16} />{t('detail.call')}</a>}

                    <button
                      type="button"
                      onClick={() => onSelectActivity && onSelectActivity(activity)}
                      style={{
                        padding: '11px 16px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--bg-main)',
                        color: 'var(--color-navy)',
                        border: '1px solid var(--border-strong)',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <span>Voir</span>
                      <ArrowIcon size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && !loadError && hasMore && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => void loadMore()} disabled={loadingMore}>
              {loadingMore ? t('explorer.loadingMore') : t('explorer.loadMore')}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
