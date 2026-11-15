import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { KharjaBotOrb } from '../chat/KharjaBotOrb';
import { Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import '../../styles/animated-glow-btn.css';

interface AnimatedGlowRecommendationButtonProps {
  className?: string;
  onClick?: () => void;
}

export const AnimatedGlowRecommendationButton: React.FC<AnimatedGlowRecommendationButtonProps> = ({
  className = '',
  onClick,
}) => {
  const { t, isRTL } = useLanguage();

  return (
    <Link
      to="/recommandations"
      className={`glow-rec-wrapper ${className}`}
      onClick={onClick}
      aria-label={t('discovery.glowBtnTitle')}
    >
      <div className="glow-rec-container">
        {/* Balayage lumineux Cyber Shimmer */}
        <div className="glow-rec-shimmer" aria-hidden="true" />

        {/* Partie Gauche : Orbe & Textes */}
        <div className="glow-rec-left">
          <div className="glow-rec-orb-box" aria-hidden="true">
            <div className="glow-rec-orb-inner">
              <KharjaBotOrb size={46} />
            </div>
          </div>

          <div>
            <div className="glow-rec-badge">
              <Sparkles size={12} />
              <span>{t('discovery.glowBtnBadge')}</span>
            </div>
            <h3 className="glow-rec-title">
              {t('discovery.glowBtnTitle')}{' '}
              <span className="glow-rec-title-highlight">360°</span>
            </h3>
            <p className="glow-rec-subtitle">
              {t('discovery.glowBtnSubtitle')}
            </p>
          </div>
        </div>

        {/* Partie Droite : Bouton d'action interactif */}
        <div className="glow-rec-cta-box">
          <span className="glow-rec-cta-btn">
            <span>{t('discovery.glowBtnAction')}</span>
            {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
          </span>
        </div>
      </div>
    </Link>
  );
};
