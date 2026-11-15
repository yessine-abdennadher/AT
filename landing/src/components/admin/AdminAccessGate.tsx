import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { isAdminRole } from '../../services/adminAccess.mjs';

export function AdminAccessGate({ children }: { children: React.ReactNode }) {
  const { user, status, openAuth } = useAuth();
  const { t } = useLanguage();

  if (status === 'loading') return <section className="admin-access" aria-live="polite"><p>{t('admin.checkingAccess')}</p></section>;
  if (!user) return (
    <section className="admin-access">
      <div className="admin-access-card"><span className="admin-title-icon"><ShieldCheck aria-hidden="true" /></span><h1>{t('admin.loginRequiredTitle')}</h1><p>{t('admin.loginRequiredDescription')}</p><button className="admin-primary-button" type="button" onClick={() => openAuth('login')}>{t('auth.login')}</button></div>
    </section>
  );
  if (!isAdminRole(user.role)) return (
    <section className="admin-access">
      <div className="admin-access-card"><span className="admin-title-icon"><ShieldCheck aria-hidden="true" /></span><h1>{t('admin.deniedTitle')}</h1><p>{t('admin.deniedDescription')}</p></div>
    </section>
  );
  return <>{children}</>;
}
