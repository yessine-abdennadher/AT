import { useState } from 'react';
import { AdminAccessGate } from '../components/admin/AdminAccessGate';
import { AdminDashboardTabs, type AdminTabId } from '../components/admin/AdminDashboardTabs';
import { AdminOverviewTab } from '../components/admin/AdminOverviewTab';
import { AdminActivitiesTab } from '../components/admin/AdminActivitiesTab';
import { AdminReviewsTab } from '../components/admin/AdminReviewsTab';
import { AdminUsersTab } from '../components/admin/AdminUsersTab';
import { AdminPartnersTab } from '../components/admin/AdminPartnersTab';
import { useLanguage } from '../context/LanguageContext';
import '../styles/admin-dashboard.css';

export function AdminDashboardView() {
  const [activeTab, setActiveTab] = useState<AdminTabId>('overview');
  const { t } = useLanguage();
  return (
    <AdminAccessGate>
      <section className="admin-dashboard" aria-labelledby="admin-dashboard-title">
        <header className="admin-dashboard-header">
          <span className="admin-title-icon"><span aria-hidden="true">A</span></span>
          <div><p className="admin-eyebrow">Tfarhida</p><h1 id="admin-dashboard-title">{t('admin.title')}</h1><p>{t('admin.subtitle')}</p></div>
        </header>
        <AdminDashboardTabs activeTab={activeTab} onChange={setActiveTab} />
        <section className="admin-panel" role="tabpanel" id={`admin-panel-${activeTab}`} aria-labelledby={`admin-tab-${activeTab}`} tabIndex={0}>
          <h2>{t(`admin.tabs.${activeTab}`)}</h2>
          {activeTab === 'overview' ? <AdminOverviewTab /> : activeTab === 'activities' ? <AdminActivitiesTab /> : activeTab === 'reviews' ? <AdminReviewsTab /> : activeTab === 'users' ? <AdminUsersTab /> : activeTab === 'partners' ? <AdminPartnersTab /> : <p>{t('admin.moduleLoadingSoon')}</p>}
        </section>
      </section>
    </AdminAccessGate>
  );
}
