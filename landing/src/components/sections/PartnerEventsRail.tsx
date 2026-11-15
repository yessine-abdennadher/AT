import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { fetchActivityExplorerData } from '../../services/activityApi';
import type { DemoActivity } from '../../data/demoActivities';
import { Calendar, Music, ArrowRight, ArrowLeft } from 'lucide-react';
import '../../styles/user-discovery.css';

interface PartnerEventsRailProps {
  onSelectActivity?: (activity: DemoActivity) => void;
}

interface ActivityEventDisplay {
  activity: DemoActivity;
  title: string;
  image: string;
  date: string;
  time: string;
  price: number;
  description: string;
}

export const PartnerEventsRail: React.FC<PartnerEventsRailProps> = ({
  onSelectActivity,
}) => {
  const { t, isRTL, language } = useLanguage();
  const [eventsList, setEventsList] = useState<ActivityEventDisplay[]>([]);

  useEffect(() => {
    let alive = true;
    fetchActivityExplorerData(language, { page: 1, limit: 30 })
      .then((data) => {
        if (!alive) return;
        const eventsFound: ActivityEventDisplay[] = [];

        data.activities.forEach((act) => {
          if (act.events && act.events.length > 0) {
            act.events.forEach((evt) => {
              eventsFound.push({
                activity: act,
                title: evt.title,
                image: evt.image || act.imageUrl,
                date: evt.date || 'Ce week-end',
                time: evt.time || '20:30',
                price: evt.price || 0,
                description: evt.description || act.highlight,
              });
            });
          }
        });

        // Si aucun événement n'est saisi en base, alimenter avec les soirées réelles (comme sur l'app mobile)
        if (eventsFound.length === 0) {
          const sample = data.activities.slice(0, 4);
          const demoEvents = [
            {
              title: 'Live Acoustique & Guitare',
              image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
              date: 'Vendredi 21:00',
              time: '21:00',
              price: 0,
              description: 'Ambiance intimiste à la bougie, musique acoustique live et cocktails signature.',
            },
            {
              title: 'Jazz & Saxophone Night',
              image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=800&q=80',
              date: 'Samedi 20:30',
              time: '20:30',
              price: 20,
              description: 'Une soirée envoûtante avec le quartet jazz de Sfax et dîner aux chandelles.',
            },
            {
              title: 'Stand-up Comedy & Rires',
              image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
              date: 'Dimanche 19:30',
              time: '19:30',
              price: 15,
              description: 'Rires et bonne humeur avec les meilleurs humoristes de la scène tunisienne.',
            },
            {
              title: 'Veillée Luth & Ambiance Orientale',
              image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80',
              date: 'Ce jeudi 21:00',
              time: '21:00',
              price: 0,
              description: 'Mélodies traditionnelles au luth et thés aux pignons dans un cadre féérique.',
            },
          ];

          sample.forEach((act, idx) => {
            const demo = demoEvents[idx % demoEvents.length];
            eventsFound.push({
              activity: act,
              title: demo.title,
              image: demo.image,
              date: demo.date,
              time: demo.time,
              price: demo.price,
              description: demo.description,
            });
          });
        }

        setEventsList(eventsFound.slice(0, 4));
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, [language]);

  if (eventsList.length === 0) return null;

  return (
    <section className="discovery-events-section">
      <div className="discovery-rail-header">
        <div className="discovery-rail-title-group">
          <div className="discovery-rail-badge" style={{ color: '#7C3AED' }}>
            <Music size={13} />
            <span>{t('discovery.eventsTitle')}</span>
          </div>
          <h2 className="discovery-rail-title">{t('discovery.eventsTitle')}</h2>
          <p className="discovery-rail-subtitle">{t('discovery.eventsSubtitle')}</p>
        </div>
      </div>

      <div className="discovery-rail-scroll">
        {eventsList.map((item, idx) => {
          return (
            <div
              key={`event-${idx}`}
              className="discovery-event-card"
              onClick={() => onSelectActivity?.(item.activity)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSelectActivity?.(item.activity);
              }}
            >
              <div className="discovery-event-img-box">
                <img
                  src={item.image}
                  alt={item.title}
                  className="discovery-event-img"
                  loading="lazy"
                />
                <span className="discovery-event-date-badge">
                  <Calendar size={12} />
                  <span>{item.date}</span>
                </span>
                <span className="discovery-event-live-badge">
                  <Music size={11} />
                  <span>Live</span>
                </span>
              </div>

              <div className="discovery-event-body">
                <p className="discovery-event-partner">{item.activity.name}</p>
                <h3 className="discovery-event-title">{item.title}</h3>
                <p className="discovery-event-desc">{item.description}</p>

                <div className="discovery-event-footer">
                  <span className="discovery-event-price">
                    {item.price === 0 ? t('discovery.freeEntry') : `${item.price} DT`}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    <span>Réserver</span>
                    {isRTL ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
