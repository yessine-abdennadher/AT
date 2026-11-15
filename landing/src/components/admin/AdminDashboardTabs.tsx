import { Activity, BarChart3, MessageSquare, Settings2, Store, Users } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export type AdminTabId = 'overview' | 'activities' | 'reviews' | 'users' | 'partners' | 'diagnostics';

const tabs: { id: AdminTabId; key: string; Icon: typeof BarChart3 }[] = [
  { id: 'overview', key: 'overview', Icon: BarChart3 },
  { id: 'activities', key: 'activities', Icon: Activity },
  { id: 'reviews', key: 'reviews', Icon: MessageSquare },
  { id: 'users', key: 'users', Icon: Users },
  { id: 'partners', key: 'partners', Icon: Store },
  { id: 'diagnostics', key: 'diagnostics', Icon: Settings2 },
];

export function AdminDashboardTabs({ activeTab, onChange }: { activeTab: AdminTabId; onChange: (tab: AdminTabId) => void }) {
  const { t } = useLanguage();
  return (
    <nav className="admin-tabs" aria-label={t('admin.tabsLabel')} role="tablist">
      {tabs.map(({ id, key, Icon }) => (
        <button key={id} type="button" role="tab" aria-selected={activeTab === id} aria-controls={`admin-panel-${id}`} id={`admin-tab-${id}`} className="admin-tab" onClick={() => onChange(id)}>
          <span className="admin-tab-icon"><Icon size={18} aria-hidden="true" /></span>
          <span>{t(`admin.tabs.${key}`)}</span>
        </button>
      ))}
    </nav>
  );
}
