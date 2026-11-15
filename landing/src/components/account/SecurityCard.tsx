import React from 'react';
import { ArrowRight, LogOut } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface SecurityCardProps {
  userEmail: string;
  onChangePassword: () => void;
  onLogout: () => void;
}

export const SecurityCard: React.FC<SecurityCardProps> = ({
  userEmail,
  onChangePassword,
  onLogout,
}) => {
  const { t } = useLanguage();

  return (
    <section className="security-content-card" aria-label="Sécurité et session">
      <div className="profile-card-header">
        <h2>Sécurité & Paramètres de Compte</h2>
        <p>Contrôlez vos identifiants, votre mot de passe et l'état de votre session.</p>
      </div>

      <div className="security-item">
        <div className="security-item-info">
          <h4>Protection du mot de passe</h4>
          <p>Votre mot de passe protège l'accès à vos favoris et à votre historique de signalements.</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onChangePassword}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <span>Changer le mot de passe</span>
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="security-item">
        <div className="security-item-info">
          <h4>Session active</h4>
          <p>
            Connecté en tant que <strong>{userEmail}</strong>
          </p>
        </div>
        <button
          type="button"
          className="btn"
          onClick={onLogout}
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: '#DC2626',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 700,
          }}
        >
          <LogOut size={16} aria-hidden="true" />
          <span>{t('auth.logout')}</span>
        </button>
      </div>
    </section>
  );
};
