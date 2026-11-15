import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, CalendarDays, Check, CircleAlert, Clock3, Eye, MapPin, Pencil, Plus, Power, RefreshCw, Star, Tag, Trash2, Utensils, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { partnerService, type PartnerActivity, type PartnerActivityInput, type PartnerDashboardData, type PartnerTier } from '../services/partnerService';
import { PartnerEditorDialog, type EditorMode, type EditorValue } from '../components/partner/PartnerEditorDialog';
import '../styles/partner-dashboard.css';

export function PartnerDashboardView() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [data, setData] = useState<PartnerDashboardData | null>(null);
  const [electricityAlertActive, setElectricityAlertActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [editor, setEditor] = useState<{ mode: EditorMode; activity: PartnerActivity | null } | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const dashboard = await partnerService.dashboard();
      setData(dashboard);
      const status = await partnerService.systemStatus().catch(() => ({ electricityAlertActive: false }));
      setElectricityAlertActive(Boolean(status.electricityAlertActive));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('partnerDashboard.loadError'));
    }
  }, [t]);

  useEffect(() => { void load().finally(() => setLoading(false)); }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  };

  const tier: PartnerTier = data?.partnerTier || user?.partnerTier || 'standard';
  const isPro = tier === 'pro' || tier === 'premium';
  const isPremium = tier === 'premium';
  const activities = data?.activities || [];
  const visibleActivities = activities.filter((activity) => filter === 'all' || (filter === 'approved' ? activity.isApproved : !activity.isApproved));

  const saveEditor = async (value: EditorValue) => {
    if (!editor) return;
    if (editor.mode === 'activity') {
      const input = value as PartnerActivityInput;
      if (editor.activity) await partnerService.updateActivity(editor.activity._id, input);
      else await partnerService.createActivity(input);
    } else if (editor.mode === 'promotion' && editor.activity) {
      await partnerService.setPromotion(editor.activity._id, value as NonNullable<PartnerActivity['promotion']>);
    } else if (editor.mode === 'event' && editor.activity) {
      await partnerService.addEvent(editor.activity._id, value as NonNullable<PartnerActivity['events']>[number]);
    }
    setEditor(null);
    await load();
  };

  const deleteActivity = async (activity: PartnerActivity) => {
    if (!window.confirm(t('partnerDashboard.confirmDelete').replace('{name}', activity.name))) return;
    try { await partnerService.deleteActivity(activity._id); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : t('partnerDashboard.saveError')); }
  };

  const togglePower = async (activity: PartnerActivity) => {
    try { await partnerService.setPowerMode(activity._id, activity.powerBackupMode === false); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : t('partnerDashboard.saveError')); }
  };

  return <section className="partner-dashboard page-enter">
    <div className="partner-dashboard-topline"><Link to="/partenaire" className="partner-back-link">{t('partnerDashboard.backToPartner')}</Link>
      <button className="partner-refresh-button" onClick={() => void refresh()} disabled={refreshing} aria-label={t('partnerDashboard.refresh')}><RefreshCw size={16} className={refreshing ? 'is-spinning' : ''} />{t('partnerDashboard.refresh')}</button>
    </div>
    <header className="partner-dashboard-hero">
      <div className="partner-dashboard-identity"><span className="partner-dashboard-icon"><Building2 size={25} /></span><div>
        <p className="partner-dashboard-eyebrow">{t('partnerDashboard.eyebrow')}</p>
        <h1>{user?.establishmentName || t('partnerDashboard.title')}</h1>
        <p>{user?.name} <span aria-hidden="true">·</span> {user?.email}</p>
      </div></div>
      <span className={`partner-tier-badge tier-${tier}`}>{t(`partnerDashboard.tier.${tier}`)}</span>
    </header>

    <div className="partner-tier-notice"><div><strong>{t('partnerDashboard.tierSummaryTitle')} · {t(`partnerDashboard.tier.${tier}`)}</strong>
      <p>{tier === 'standard' ? t('partnerDashboard.standardBenefits') : tier === 'pro' ? t('partnerDashboard.proBenefits') : t('partnerDashboard.premiumBenefits')}</p></div>
      {!isPremium && <button className="partner-secondary-button" onClick={() => navigate('/partenaire#tarifs')}>{t('partnerDashboard.seePlans')}</button>}
    </div>

    {data && <div className="partner-kpi-grid" aria-label={t('partnerDashboard.metrics')}>
      <article className="partner-kpi"><span><Building2 size={17} /></span><strong>{data.stats.total}</strong><p>{t('partnerDashboard.establishments')}</p></article>
      <article className="partner-kpi"><span className="success"><Check size={17} /></span><strong>{data.stats.approved}</strong><p>{t('partnerDashboard.online')}</p></article>
      <article className="partner-kpi"><span className="pending"><Clock3 size={17} /></span><strong>{data.stats.pending}</strong><p>{t('partnerDashboard.pending')}</p></article>
      <article className="partner-kpi"><span className="rating"><Star size={17} /></span><strong>{data.stats.totalReviews}</strong><p>{t('partnerDashboard.reviews')}</p></article>
    </div>}

    <div className="partner-list-heading"><div><p className="partner-dashboard-eyebrow">{t('partnerDashboard.management')}</p><h2>{t('partnerDashboard.yourPlaces')}</h2></div>
      <button className="partner-primary-button" onClick={() => setEditor({ mode: 'activity', activity: null })}><Plus size={17} />{t('partnerDashboard.addPlace')}</button>
    </div>

    {error && <div className="partner-error-banner" role="alert"><CircleAlert size={18} /><span>{error}</span><button onClick={() => setError('')} aria-label={t('partnerDashboard.dismiss')}><X size={16} /></button></div>}
    {loading ? <div className="partner-loading"><span className="partner-spinner" />{t('partnerDashboard.loading')}</div> : error && !data ? <div className="partner-empty-state"><CircleAlert size={28} /><h2>{t('partnerDashboard.couldNotLoad')}</h2><button className="partner-primary-button" onClick={() => void refresh()}>{t('partnerDashboard.retry')}</button></div> : <>
      <div className="partner-filter-row" role="group" aria-label={t('partnerDashboard.filterActivities')}>
        {(['all', 'approved', 'pending'] as const).map((key) => <button key={key} className={filter === key ? 'active' : ''} onClick={() => setFilter(key)} aria-pressed={filter === key}>{t(`partnerDashboard.filter.${key}`)}</button>)}
      </div>
      {visibleActivities.length === 0 ? <div className="partner-empty-state"><Utensils size={30} /><h2>{activities.length ? t('partnerDashboard.noFilteredPlaces') : t('partnerDashboard.noPlaces')}</h2>
        <p>{activities.length ? t('partnerDashboard.changeFilter') : t('partnerDashboard.addFirstPlace')}</p>{activities.length === 0 && <button className="partner-primary-button" onClick={() => setEditor({ mode: 'activity', activity: null })}><Plus size={16} />{t('partnerDashboard.addPlace')}</button>}</div> :
        <div className="partner-activity-grid">{visibleActivities.map((activity) => <article className="partner-activity-card" key={activity._id}>
          <div className="partner-activity-cover">{activity.imageUrl ? <img src={activity.imageUrl} alt={activity.name} loading="lazy" /> : <span><Building2 size={28} /></span>}
            <span className={`partner-status ${activity.isApproved ? 'approved' : 'pending'}`}>{activity.isApproved ? t('partnerDashboard.statusOnline') : t('partnerDashboard.statusPending')}</span></div>
          <div className="partner-activity-content"><div className="partner-activity-title"><div><h3>{activity.name}</h3><p><MapPin size={14} />{[activity.city, activity.address].filter(Boolean).join(' · ')}</p></div>
            <strong>{activity.price} DT</strong></div>
            <p className="partner-activity-description">{activity.description || t('partnerDashboard.noDescription')}</p>
            <div className="partner-activity-meta"><span><Star size={14} />{activity.reviewsCount ? `${activity.rating || 0} (${activity.reviewsCount})` : t('partnerDashboard.noReviews')}</span>
              <span>{activity.openingTime || '09:00'} – {activity.closingTime || '23:00'}</span></div>
            {activity.promotion?.isPromo && <div className="partner-card-promo"><Tag size={15} /><span>{activity.promotion.promoLabel} · −{activity.promotion.discountPercent}%</span></div>}
            {activity.events?.map((event, index) => <div className="partner-card-event" key={event._id || `${activity._id}-${index}`}><CalendarDays size={15} /><span>{event.title}{event.date ? ` · ${event.date}` : ''}</span></div>)}
            <div className="partner-card-actions">
              <button className="partner-secondary-button" onClick={() => setEditor({ mode: 'activity', activity })}><Pencil size={15} />{t('partnerDashboard.edit')}</button>
              {isPro && <button className="partner-secondary-button" onClick={() => setEditor({ mode: 'promotion', activity })}><Tag size={15} />{t('partnerDashboard.promotion')}</button>}
              {isPremium && <button className="partner-secondary-button" onClick={() => setEditor({ mode: 'event', activity })}><CalendarDays size={15} />{t('partnerDashboard.event')}</button>}
              <button className="partner-danger-button" onClick={() => void deleteActivity(activity)} aria-label={`${t('partnerDashboard.delete')} ${activity.name}`}><Trash2 size={16} /></button>
            </div>
            {electricityAlertActive && <div className="partner-power-row"><span><Power size={15} />{t('partnerDashboard.powerMode')}</span><button type="button" role="switch" aria-checked={activity.powerBackupMode !== false} className={`partner-switch ${activity.powerBackupMode !== false ? 'on' : ''}`} onClick={() => void togglePower(activity)} aria-label={t('partnerDashboard.powerMode')}><i /></button></div>}
          </div>
        </article>)}</div>}
    </>}
    <p className="partner-moderation-note"><Eye size={15} />{t('partnerDashboard.moderationNote')}</p>
    {editor && <PartnerEditorDialog key={`${editor.mode}-${editor.activity?._id || 'new'}`} mode={editor.mode} activity={editor.activity} onClose={() => setEditor(null)} onSave={saveEditor} />}
  </section>;
}
