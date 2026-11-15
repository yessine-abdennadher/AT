import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AccountHeader, AccountNavTabs, ProfileForm, SecurityCard } from '../components/account';
import '../styles/account-views.css';

export const ProfileView: React.FC = () => {
  const navigate = useNavigate();
  const { user, status, openAuth, saveProfile, favoriteIds, signOut } = useAuth();
  const { t } = useLanguage();
  const [profileSubTab, setProfileSubTab] = useState<'profile' | 'security'>('profile');

  if (status === 'loading') {
    return (
      <main className="account-page-wrapper" aria-busy="true">
        <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-secondary)' }}>
          <Sparkles
            size={36}
            color="var(--color-primary)"
            style={{ animation: 'spin 2s linear infinite', margin: '0 auto 16px' }}
          />
          <p role="status" style={{ fontWeight: 700 }}>
            {t('auth.loading')}
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="account-page-wrapper">
        <div className="favorites-empty-state">
          <div className="favorites-empty-icon">
            <Lock size={32} />
          </div>
          <h1 className="favorites-empty-title">{t('nav.profile')}</h1>
          <p className="favorites-empty-desc">{t('account.signInRequired')}</p>
          <button className="btn btn-primary" onClick={() => openAuth('login')}>
            {t('auth.login')}
          </button>
        </div>
      </main>
    );
  }

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleTabChange = (tab: 'favorites' | 'profile' | 'security') => {
    if (tab === 'favorites') {
      navigate('/favoris');
    } else {
      setProfileSubTab(tab);
    }
  };

  return (
    <main className="account-page-wrapper">
      <AccountHeader user={user} favoritesCount={favoriteIds.length} />

      <AccountNavTabs
        activeTab={profileSubTab}
        favoritesCount={favoriteIds.length}
        onTabChange={handleTabChange}
      />

      {profileSubTab === 'profile' ? (
        <ProfileForm user={user} onSave={saveProfile} />
      ) : (
        <SecurityCard
          userEmail={user.email}
          onChangePassword={() => openAuth('login')}
          onLogout={handleLogout}
        />
      )}
    </main>
  );
};
