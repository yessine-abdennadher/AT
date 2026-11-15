import React, { useState, useEffect, type FormEvent } from 'react';
import { User, Mail, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import type { AuthUser } from '../../services/authService';
import { TUNISIAN_CITIES } from '../../data/cities';
import { useLanguage } from '../../context/LanguageContext';

interface ProfileFormProps {
  user: AuthUser;
  onSave: (updates: { name: string; city: string }) => Promise<void>;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ user, onSave }) => {
  const { t } = useLanguage();
  const [name, setName] = useState(user.name || '');
  const [city, setCity] = useState(user.city || 'Sfax');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    setName(user.name || '');
    setCity(user.city || 'Sfax');
  }, [user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError('');
    setSaveSuccess('');
    setIsSaving(true);
    try {
      await onSave({ name: name.trim(), city: city.trim() });
      setSaveSuccess(t('account.profileSaved'));
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : t('account.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="profile-content-card" aria-label="Paramètres de profil">
      <div className="profile-card-header">
        <h2>{t('nav.profile')}</h2>
        <p>Gérez vos informations personnelles et vos préférences de recommandation.</p>
      </div>

      <form onSubmit={handleSubmit} className="profile-form-grid">
        {saveSuccess && (
          <div className="profile-alert profile-alert-success" role="status">
            <CheckCircle2 size={18} />
            <span>{saveSuccess}</span>
          </div>
        )}

        {saveError && (
          <div className="profile-alert profile-alert-error" role="alert">
            <AlertCircle size={18} />
            <span>{saveError}</span>
          </div>
        )}

        <div className="profile-field-group">
          <label htmlFor="account-name" className="profile-field-label">
            <User size={16} color="var(--color-primary)" aria-hidden="true" />
            <span>{t('auth.name')}</span>
          </label>
          <div className="profile-input-wrapper">
            <User size={18} className="profile-input-icon" aria-hidden="true" />
            <input
              id="account-name"
              type="text"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="profile-input-control"
              placeholder="Votre nom complet"
            />
          </div>
        </div>

        <div className="profile-field-group">
          <label htmlFor="account-email" className="profile-field-label">
            <Mail size={16} color="var(--color-primary)" aria-hidden="true" />
            <span>{t('auth.email')}</span>
          </label>
          <div className="profile-input-wrapper">
            <Mail size={18} className="profile-input-icon" aria-hidden="true" />
            <input
              id="account-email"
              type="email"
              disabled
              value={user.email}
              className="profile-input-control"
              title="L'adresse email est le garant de votre compte et ne peut pas être changée ici."
            />
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Adresse vérifiée liée à votre compte Tfarhida.
          </span>
        </div>

        <div className="profile-field-group">
          <label htmlFor="account-city" className="profile-field-label">
            <MapPin size={16} color="var(--color-primary)" aria-hidden="true" />
            <span>{t('account.preferredCity')}</span>
          </label>
          <div className="profile-input-wrapper">
            <MapPin size={18} className="profile-input-icon" aria-hidden="true" />
            <select
              id="account-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="profile-input-control profile-city-select"
            >
              {TUNISIAN_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Cette ville personnalise les suggestions en page d'accueil et les réponses de KharjaBot.
          </span>
        </div>

        <div className="profile-actions-bar">
          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary"
            style={{ minWidth: '160px' }}
          >
            {isSaving ? t('auth.working') : t('account.save')}
          </button>
        </div>
      </form>
    </section>
  );
};
