import { useState } from 'react';
import { DEMO_ACTIVITIES } from '../../data/demoActivities';
import type { DemoActivity } from '../../data/demoActivities';
import {
  Star,
  MessageCircle,
  MapPin,
  Zap,
  ExternalLink,
  Compass,
  Gamepad2,
  Coffee,
  Waves,
} from 'lucide-react';

interface ActivityExplorerProps {
  onSelectActivity?: (activity: DemoActivity) => void;
}

export const ActivityExplorer: React.FC<ActivityExplorerProps> = ({ onSelectActivity }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');

  const categories = [
    { key: 'all', label: 'Toutes les sorties', icon: Compass },
    { key: 'fun', label: 'Divertissement & Jeux', icon: Gamepad2 },
    { key: 'food', label: 'Cafés & Restos', icon: Coffee },
    { key: 'outdoor', label: 'Plein Air & Mer', icon: Waves },
    { key: 'creative', label: 'Culture & Spectacles', icon: Sparkles },
  ];

  const cities = [
    { key: 'all', label: 'Toutes les villes' },
    { key: 'Sfax', label: 'Sfax (Ville Active)' },
  ];

  const filtered = DEMO_ACTIVITIES.filter((act) => {
    const matchCat = activeCategory === 'all' || act.category === activeCategory;
    const matchCity = selectedCity === 'all' || act.city.includes(selectedCity);
    return matchCat && matchCity;
  });

  return (
    <section id="explorer" style={{ padding: '80px 0', backgroundColor: '#FFFFFF' }}>
      <div className="container">
        {/* En-tête de section */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 48px' }}>
          <span className="badge badge-primary" style={{ marginBottom: '12px' }}>
            Expériences Certifiées Tfarhida (تفرهيدة)
          </span>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
              letterSpacing: '-0.02em',
              marginBottom: '16px',
            }}
          >
            Explorez les meilleures sorties à Sfax & en Tunisie
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)' }}>
            Chaque lieu est vérifié par notre équipe. Réservez directement avec le gérant sur WhatsApp, sans intermédiaire ni commissions.
          </p>
        </div>

        {/* Barre de Filtres par Catégorie avec VRAIES icônes Lucide */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '16px',
          }}
        >
          {categories.map((cat) => {
            const IconComponent = cat.icon;
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  transition: 'all 0.2s ease',
                  backgroundColor: isActive ? 'var(--color-primary)' : 'var(--color-pale-blue-subtle)',
                  color: isActive ? '#FFFFFF' : 'var(--color-navy)',
                  border: isActive ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                  boxShadow: isActive ? '0 4px 12px rgba(2, 132, 199, 0.28)' : 'none',
                }}
              >
                <IconComponent size={16} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filtre par Ville avec icônes MapPin réelles */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '40px',
          }}
        >
          {cities.map((city) => {
            const isActive = selectedCity === city.key;
            return (
              <button
                key={city.key}
                onClick={() => setSelectedCity(city.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  backgroundColor: isActive ? 'var(--color-navy)' : 'transparent',
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--color-navy)' : '1px solid var(--border-subtle)',
                }}
              >
                <MapPin size={12} color={isActive ? '#38BDF8' : 'var(--color-primary)'} />
                <span>{city.label}</span>
              </button>
            );
          })}
        </div>

        {/* Grille des Cartes d'Activités */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '28px',
          }}
        >
          {filtered.map((activity) => (
            <div
              key={activity.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                border: '1.5px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
            >
              {/* Image & Badges Supérieurs */}
              <div style={{ position: 'relative', width: '100%', height: '210px', overflow: 'hidden' }}>
                <img
                  src={activity.imageUrl}
                  alt={activity.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.5s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                />

                {/* Badge Lumière / Veille électricité */}
                {activity.lightingActive && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: 'rgba(16, 185, 129, 0.95)',
                      color: '#FFFFFF',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    <Zap size={13} />
                    <span>Lumière active</span>
                  </div>
                )}

                {/* Prix Pill */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    backgroundColor: activity.price === 0 ? 'rgba(16, 185, 129, 0.95)' : 'rgba(11, 21, 40, 0.9)',
                    color: '#FFFFFF',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  {activity.price === 0 ? 'Accès Gratuit' : `${activity.price} DT`} {activity.price > 0 && <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>/pers</span>}
                </div>
              </div>

              {/* Contenu de la Carte */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                    <MapPin size={14} color="var(--color-primary)" />
                    <span>{activity.locationName || activity.city}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={15} color="#F59E0B" fill="#F59E0B" />
                    <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--color-navy)' }}>
                      {activity.rating}
                    </span>
                    <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      ({activity.reviewCount})
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <h3
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      color: 'var(--color-navy)',
                      lineHeight: 1.3,
                    }}
                  >
                    {activity.name}
                  </h3>
                  {activity.nameAr && (
                    <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-arabic)', color: 'var(--color-purple-signature)', fontWeight: 600 }}>
                      {activity.nameAr}
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '14px', flex: 1 }}>
                  {activity.highlight}
                </p>

                {/* Tags */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '18px' }}>
                  {activity.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--color-pale-blue-subtle)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Bouton Action Directe WhatsApp */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <a
                    href={`https://wa.me/21620000000?text=${encodeURIComponent(`Bonjour, je vous contacte depuis Tfarhida pour réserver : ${activity.name}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      fontSize: '0.85rem',
                      color: '#065F46',
                      borderColor: 'rgba(16, 185, 129, 0.3)',
                      backgroundColor: 'var(--color-emerald-light)',
                    }}
                  >
                    <MessageCircle size={16} color="#059669" />
                    <span>WhatsApp</span>
                  </a>

                  <button
                    onClick={() => onSelectActivity && onSelectActivity(activity)}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '10px 14px', fontSize: '0.85rem' }}
                  >
                    <span>Détails</span>
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
