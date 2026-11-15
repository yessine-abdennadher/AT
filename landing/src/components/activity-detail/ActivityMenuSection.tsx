import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Coffee,
  Ticket,
  Sparkles,
  Crown,
  Award,
  BookOpen,
  X,
  ChevronLeft,
  ChevronRight,
  Tag,
  Flame,
} from 'lucide-react';
import type { DemoActivity, ActivityMenuItem } from '../../data/demoActivities';
import { useLanguage } from '../../context/LanguageContext';

interface ActivityMenuSectionProps {
  activity: DemoActivity;
}

export const ActivityMenuSection: React.FC<ActivityMenuSectionProps> = ({ activity }) => {
  const { language, isRTL } = useLanguage();
  const menuData = activity.menu;

  const isFoodType =
    activity.type === 'restaurant' ||
    activity.type === 'cafe' ||
    activity.category === 'food';

  const isPremium = activity.partnerTier === 'premium' || activity.isFeatured;
  const isPro = activity.partnerTier === 'pro';
  const isStandard = !isPremium && !isPro;

  // Sections du menu disponibles
  const sections = menuData?.sections || [];
  const [activeSectionId, setActiveSectionId] = useState<string>(
    sections[0]?.id || ''
  );

  // Visionneuse de photos du menu papier
  const menuPhotos = menuData?.images || [];
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  // Synchronisation si les sections changent
  useEffect(() => {
    if (sections.length > 0 && !sections.some((s) => s.id === activeSectionId)) {
      setActiveSectionId(sections[0].id);
    }
  }, [sections, activeSectionId]);

  // Verrouillage du scroll quand la visionneuse photo est ouverte
  useEffect(() => {
    if (isPhotoModalOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsPhotoModalOpen(false);
        if (e.key === 'ArrowRight') {
          if (isRTL) prevPhoto();
          else nextPhoto();
        }
        if (e.key === 'ArrowLeft') {
          if (isRTL) nextPhoto();
          else prevPhoto();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isPhotoModalOpen, isRTL, menuPhotos.length]);

  const nextPhoto = () => {
    setPhotoIndex((prev) => (prev + 1) % menuPhotos.length);
  };

  const prevPhoto = () => {
    setPhotoIndex((prev) => (prev - 1 + menuPhotos.length) % menuPhotos.length);
  };

  // Si aucun menu n'est renseigné
  if (!menuData || sections.length === 0) {
    return null;
  }

  // Section active sélectionnée
  const currentSection =
    sections.find((s) => s.id === activeSectionId) || sections[0];

  // Plats vedettes / Signatures pour les comptes Premium
  const signatureItems: ActivityMenuItem[] = [];
  if (isPremium) {
    sections.forEach((sec) => {
      sec.items.forEach((item) => {
        if ((item.isSignature || item.isSpecialty) && signatureItems.length < 3) {
          signatureItems.push(item);
        }
      });
    });
    // Si aucun marqué explicitement signature, prendre les 2 premiers items populaires
    if (signatureItems.length === 0) {
      sections.forEach((sec) => {
        sec.items.forEach((item) => {
          if (item.isPopular && signatureItems.length < 2) {
            signatureItems.push(item);
          }
        });
      });
    }
  }

  const sectionIcon = (iconName?: string) => {
    switch (iconName) {
      case 'coffee':
        return <Coffee size={16} aria-hidden="true" />;
      case 'ticket':
        return <Ticket size={16} aria-hidden="true" />;
      case 'sparkles':
        return <Sparkles size={16} aria-hidden="true" />;
      default:
        return <Utensils size={16} aria-hidden="true" />;
    }
  };

  const titleText = isFoodType
    ? language === 'ar'
      ? 'القائمة والمأكولات'
      : 'Carte & Menu'
    : language === 'ar'
    ? 'الباقات والأسعار'
    : 'Formules & Tarifs';

  const subtitleText = isFoodType
    ? language === 'ar'
      ? 'اكتشف الأطباق والمشروبات والحلويات المتوفرة لدى المكان'
      : 'Découvrez les spécialités, boissons et douceurs préparées par l’établissement.'
    : language === 'ar'
    ? 'تفاصيل العروض والباقات والأنشطة المتوفرة للحجز'
      : 'Consultez les détails des packs, sessions et tarifs disponibles.';

  return (
    <section className="activity-detail-section activity-menu-section" aria-label={titleText}>
      {/* En-tête de la section */}
      <div className="activity-menu-header">
        <div className="activity-menu-header-titles">
          <div className="activity-menu-eyebrow">
            {isFoodType ? (
              <Utensils size={14} aria-hidden="true" />
            ) : (
              <Ticket size={14} aria-hidden="true" />
            )}
            <span>
              {isFoodType
                ? language === 'ar'
                  ? 'قائمة الطعام'
                  : 'Dégustation & Carte'
                : language === 'ar'
                ? 'العروض الرسمية'
                : 'Grille Tarifaire'}
            </span>
          </div>
          <h2 className="activity-detail-section-title" style={{ margin: '4px 0 6px' }}>
            {titleText}
          </h2>
          <p className="activity-menu-subtitle">{subtitleText}</p>
        </div>

        {/* Bouton pour visionner la carte physique (Pro & Premium) */}
        {!isStandard && menuPhotos.length > 0 && (
          <button
            type="button"
            className="activity-menu-photo-btn"
            onClick={() => {
              setPhotoIndex(0);
              setIsPhotoModalOpen(true);
            }}
            aria-label="Consulter la carte papier"
          >
            <BookOpen size={16} aria-hidden="true" />
            <span>
              {language === 'ar'
                ? `مشاهدة المنيو المصور (${menuPhotos.length})`
                : `Voir la carte photo (${menuPhotos.length})`}
            </span>
          </button>
        )}
      </div>

      {/* VITRINE HÉROÏQUE : Spécialités Signatures (Exclusivité Compte Premium) */}
      {isPremium && signatureItems.length > 0 && (
        <div className="activity-menu-signature-showcase">
          <div className="activity-menu-signature-badge-top">
            <Crown size={14} aria-hidden="true" />
            <span>
              {language === 'ar' ? 'توصيات الشيف المميزة' : 'Les Signatures du Chef'}
            </span>
          </div>

          <div className="activity-menu-signature-grid">
            {signatureItems.map((item) => (
              <div key={`sig-${item.id}`} className="activity-menu-signature-card">
                {item.imageUrl && (
                  <div className="activity-menu-signature-img-box">
                    <img
                      src={item.imageUrl}
                      alt={language === 'ar' && item.nameAr ? item.nameAr : item.name}
                      className="activity-menu-signature-img"
                      loading="lazy"
                    />
                    <span className="activity-menu-signature-tag">
                      <Sparkles size={11} aria-hidden="true" />
                      <span>{item.badge || (language === 'ar' ? 'مميز' : 'Signature')}</span>
                    </span>
                  </div>
                )}
                <div className="activity-menu-signature-info">
                  <div className="activity-menu-signature-title-row">
                    <h4 className="activity-menu-signature-name">
                      {language === 'ar' && item.nameAr ? item.nameAr : item.name}
                    </h4>
                    <div className="activity-menu-price-tag">
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="activity-menu-original-price">
                          {item.originalPrice} DT
                        </span>
                      )}
                      <span className="activity-menu-final-price">{item.price} DT</span>
                    </div>
                  </div>
                  <p className="activity-menu-signature-desc">
                    {language === 'ar' && item.descriptionAr
                      ? item.descriptionAr
                      : item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sélecteur d'onglets de catégories */}
      {sections.length > 1 && (
        <div className="activity-menu-tabs-wrapper" role="tablist" aria-label="Catégories du menu">
          <div className="activity-menu-tabs">
            {sections.map((sec) => {
              const isActive = sec.id === currentSection.id;
              const title =
                language === 'ar' && sec.titleAr ? sec.titleAr : sec.title;

              return (
                <button
                  key={sec.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`activity-menu-tab-btn ${isActive ? 'is-active' : ''}`}
                  onClick={() => setActiveSectionId(sec.id)}
                >
                  {sectionIcon(sec.icon)}
                  <span>{title}</span>
                  <span className="activity-menu-tab-count">{sec.items.length}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* RENDU DES ARTICLES */}
      {isStandard ? (
        /* MODE STANDARD : Présentation textuelle sobre et très soignée style brasserie épurée */
        <div className="activity-menu-standard-list">
          {currentSection.items.map((item) => (
            <div key={item.id} className="activity-menu-standard-row">
              <div className="activity-menu-standard-details">
                <div className="activity-menu-standard-top">
                  <span className="activity-menu-standard-name">
                    {language === 'ar' && item.nameAr ? item.nameAr : item.name}
                  </span>
                  <span className="activity-menu-standard-dots" aria-hidden="true" />
                  <span className="activity-menu-standard-price">{item.price} DT</span>
                </div>
                {item.description && (
                  <p className="activity-menu-standard-desc">
                    {language === 'ar' && item.descriptionAr
                      ? item.descriptionAr
                      : item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* MODE PRO & PREMIUM : Cartes interactives modernes avec photos HD et badges */
        <div className="activity-menu-cards-grid">
          {currentSection.items.map((item) => (
            <article key={item.id} className="activity-menu-item-card">
              {item.imageUrl ? (
                <div className="activity-menu-card-media">
                  <img
                    src={item.imageUrl}
                    alt={language === 'ar' && item.nameAr ? item.nameAr : item.name}
                    className="activity-menu-card-img"
                    loading="lazy"
                  />
                  {item.badge && (
                    <span className="activity-menu-custom-badge">
                      <Tag size={10} aria-hidden="true" />
                      <span>{item.badge}</span>
                    </span>
                  )}
                  {item.isPopular && !item.badge && (
                    <span className="activity-menu-popular-badge">
                      <Flame size={10} aria-hidden="true" />
                      <span>{language === 'ar' ? 'الأكثر طلباً' : 'Populaire'}</span>
                    </span>
                  )}
                  {item.isSpecialty && !item.badge && (
                    <span className="activity-menu-specialty-badge">
                      <Award size={10} aria-hidden="true" />
                      <span>{language === 'ar' ? 'خاص' : 'Spécialité'}</span>
                    </span>
                  )}
                </div>
              ) : (
                <div className="activity-menu-card-no-img" />
              )}

              <div className="activity-menu-card-body">
                <div className="activity-menu-card-title-row">
                  <h3 className="activity-menu-card-name">
                    {language === 'ar' && item.nameAr ? item.nameAr : item.name}
                  </h3>
                  <div className="activity-menu-card-price-box">
                    {item.originalPrice && item.originalPrice > item.price && (
                      <span className="activity-menu-original-price">
                        {item.originalPrice} DT
                      </span>
                    )}
                    <span className="activity-menu-card-price">{item.price} DT</span>
                  </div>
                </div>

                {item.description && (
                  <p className="activity-menu-card-desc">
                    {language === 'ar' && item.descriptionAr
                      ? item.descriptionAr
                      : item.description}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* MODAL LIGHTBOX PLEIN ÉCRAN : Visionneuse de la carte physique */}
      {isPhotoModalOpen && menuPhotos.length > 0 && (
        <div
          className="activity-menu-modal-backdrop"
          onClick={() => setIsPhotoModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Visionneuse de la carte papier"
        >
          <div
            className="activity-menu-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Barre de contrôle supérieure */}
            <div className="activity-menu-modal-header">
              <span className="activity-menu-modal-counter">
                {language === 'ar'
                  ? `صفحة ${photoIndex + 1} من ${menuPhotos.length}`
                  : `Page ${photoIndex + 1} sur ${menuPhotos.length}`}
              </span>
              <button
                type="button"
                className="activity-menu-modal-close-btn"
                onClick={() => setIsPhotoModalOpen(false)}
                aria-label="Fermer la visionneuse"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            {/* Image courante du menu */}
            <div className="activity-menu-modal-body">
              <img
                src={menuPhotos[photoIndex]}
                alt={`Page ${photoIndex + 1}`}
                className="activity-menu-modal-img"
              />

              {menuPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    className="activity-menu-modal-nav-btn prev"
                    onClick={isRTL ? nextPhoto : prevPhoto}
                    aria-label="Page précédente"
                  >
                    {isRTL ? (
                      <ChevronRight size={24} aria-hidden="true" />
                    ) : (
                      <ChevronLeft size={24} aria-hidden="true" />
                    )}
                  </button>
                  <button
                    type="button"
                    className="activity-menu-modal-nav-btn next"
                    onClick={isRTL ? prevPhoto : nextPhoto}
                    aria-label="Page suivante"
                  >
                    {isRTL ? (
                      <ChevronLeft size={24} aria-hidden="true" />
                    ) : (
                      <ChevronRight size={24} aria-hidden="true" />
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
