import React from 'react';
import { Mail, ShieldCheck } from 'lucide-react';
import type { AuthUser } from '../../services/authService';
import { useLanguage } from '../../context/LanguageContext';

interface AccountHeaderProps {
  user: AuthUser;
  favoritesCount: number;
}

export const AccountHeader: React.FC<AccountHeaderProps> = ({ user, favoritesCount }) => {
  const { t } = useLanguage();

  const userInitials = (user.name || 'U')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const roleLabel =
    user.role === 'partner'
      ? 'Partenaire Officiel'
      : user.role === 'admin'
      ? 'Administrateur'
      : 'Membre Explorateur';

  return (
    <section className="account-header-card" aria-label="Profil utilisateur">
      <div className="account-user-meta">
        <div className="account-avatar" aria-hidden="true">
          {userInitials}
        </div>
        <div className="account-user-info">
          <h1>{user.name}</h1>
          <div className="account-user-email">
            <Mail size={15} color="var(--text-muted)" aria-hidden="true" />
            <span>{user.email}</span>
          </div>
          <span className="account-role-badge">
            <ShieldCheck size={14} aria-hidden="true" />
            {roleLabel}
          </span>
        </div>
      </div>

      <div className="account-header-stats">
        <div className="account-stat-pill">
          <span className="account-stat-value">{favoritesCount}</span>
          <span className="account-stat-label">{t('nav.favorites')}</span>
        </div>
        <div className="account-stat-pill">
          <span className="account-stat-value">{user.city || 'Sfax'}</span>
          <span className="account-stat-label">Ville active</span>
        </div>
      </div>
    </section>
  );
};
