import { useCallback, useEffect, useState } from 'react';
import { Activity, MessageSquare, RefreshCw, Store, Users } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { adminService, type AdminPlatformStats } from '../../services/adminService';

export function AdminOverviewTab() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<AdminPlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await adminService.getStats();
      setStats(response.stats ?? null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <div className="admin-panel-state" role="status">{t('admin.loading')}</div>;
  if (error) return <div className="admin-panel-state" role="alert"><p>{t('admin.loadError')}</p><button type="button" className="admin-secondary-button" onClick={() => void load()}><RefreshCw size={16} aria-hidden="true" />{t('admin.retry')}</button></div>;
  if (!stats) return <div className="admin-panel-state" role="status">{t('admin.unavailable')}</div>;

  const metrics = [
    { key: 'regularUsers', value: stats.users?.regularUsers, Icon: Users },
    { key: 'partners', value: stats.users?.partners, Icon: Store },
    { key: 'admins', value: stats.users?.admins, Icon: Users },
    { key: 'activities', value: stats.activities?.total, Icon: Activity },
    { key: 'pendingActivities', value: stats.activities?.pendingApproval, Icon: Activity },
    { key: 'reviews', value: stats.reviews?.total, Icon: MessageSquare },
  ];

  return (
    <div className="admin-overview">
      <div className="admin-metric-grid">
        {metrics.map(({ key, value, Icon }) => (
          <article className="admin-metric-card" key={key}>
            <span className="admin-title-icon"><Icon size={19} aria-hidden="true" /></span>
            <p>{t(`admin.metrics.${key}`)}</p>
            <strong>{value === undefined ? t('admin.unavailableShort') : value.toLocaleString()}</strong>
          </article>
        ))}
      </div>
      <section className="admin-city-card" aria-labelledby="admin-city-title">
        <h3 id="admin-city-title">{t('admin.activitiesByCity')}</h3>
        {stats.activities?.byCity?.length ? (
          <ul className="admin-city-list">{stats.activities.byCity.map((item) => <li key={item.city}><span>{item.city}</span><strong>{item.count.toLocaleString()}</strong></li>)}</ul>
        ) : <p className="admin-muted">{t('admin.noCityData')}</p>}
      </section>
    </div>
  );
}
