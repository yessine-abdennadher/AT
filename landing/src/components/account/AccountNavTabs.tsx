import React from 'react';
import { Heart, User, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

interface AccountNavTabsProps {
  activeTab: 'favorites' | 'profile' | 'security';
  favoritesCount: number;
  onTabChange?: (tab: 'favorites' | 'profile' | 'security') => void;
}

export const AccountNavTabs: React.FC<AccountNavTabsProps> = ({
  activeTab,
  favoritesCount,
  onTabChange,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSelect = (tab: 'favorites' | 'profile' | 'security') => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      if (tab === 'favorites') navigate('/favoris');
      else if (tab === 'profile') navigate('/profil');
    }
  };

  return (
    <nav className="account-nav-tabs" aria-label="Navigation du compte">
      <button
        type="button"
        className={`account-tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
        onClick={() => handleSelect('favorites')}
        aria-selected={activeTab === 'favorites'}
      >
        <Heart size={18} aria-hidden="true" />
        <span>{t('nav.favorites')}</span>
        <span className="account-tab-counter">{favoritesCount}</span>
      </button>

      <button
        type="button"
        className={`account-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
        onClick={() => handleSelect('profile')}
        aria-selected={activeTab === 'profile'}
      >
        <User size={18} aria-hidden="true" />
        <span>{t('nav.profile')}</span>
      </button>

      <button
        type="button"
        className={`account-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
        onClick={() => handleSelect('security')}
        aria-selected={activeTab === 'security'}
      >
        <Lock size={18} aria-hidden="true" />
        <span>Sécurité & Compte</span>
      </button>
    </nav>
  );
};
