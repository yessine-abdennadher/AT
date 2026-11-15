import { useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import type { AdminPartnerSummary } from '../../services/adminService';

function displayDate(value?: string | null) { return value ? new Date(value).toLocaleDateString() : '—'; }

export function AdminPartnerDetailsDialog({ partner, onClose }: { partner: AdminPartnerSummary | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { t } = useLanguage();
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (partner && !dialog.open) dialog.showModal();
    if (!partner && dialog.open) dialog.close();
  }, [partner]);
  return <dialog ref={dialogRef} className="admin-confirm-dialog admin-partner-dialog" aria-labelledby="admin-partner-title" onCancel={(event)=>{event.preventDefault();onClose();}} onClose={onClose}>
    {partner && <>
      <h2 id="admin-partner-title">{partner.establishmentName || partner.name}</h2>
      <dl className="admin-details-grid">
        <dt>{t('admin.partners.contact')}</dt><dd>{partner.name} · {partner.email}</dd>
        <dt>{t('admin.partners.location')}</dt><dd>{[partner.city,partner.phone].filter(Boolean).join(' · ') || '—'}</dd>
        <dt>{t('admin.partners.tier')}</dt><dd>{t('admin.partners.tiers.' + partner.partnerTier)}</dd>
        <dt>{t('admin.partners.subscriptionStatus')}</dt><dd>{partner.subscriptionStatus || t('admin.unavailableShort')}</dd>
        <dt>{t('admin.partners.subscriptionDates')}</dt><dd>{displayDate(partner.subscriptionStartedAt)} — {displayDate(partner.subscriptionExpiresAt)}</dd>
        <dt>{t('admin.partners.lastLogin')}</dt><dd>{displayDate(partner.lastLogin)}</dd>
        <dt>{t('admin.partners.lastUpdate')}</dt><dd>{displayDate(partner.lastActivityUpdate)}</dd>
        <dt>{t('admin.partners.activityCount')}</dt><dd>{partner.activityCount ?? t('admin.unavailableShort')}</dd>
      </dl>
      <h3>{t('admin.partners.activities')}</h3>
      {partner.activities?.length ? <ul className="admin-details-list">{partner.activities.map((activity,index)=><li key={String(activity.id || activity.name) + '-' + index}><strong>{String(activity.name || t('admin.unavailableShort'))}</strong><span>{String(activity.category || '')}{activity.isApproved === false ? ' · ' + t('admin.activities.pending') : ''}</span></li>)}</ul> : <p className="admin-muted">{t('admin.partners.noActivities')}</p>}
      <h3>{t('admin.partners.offers')}</h3>
      {partner.offers?.length ? <ul className="admin-details-list">{partner.offers.map((offer,index)=><li key={String(offer.activityId || offer.activityName) + '-' + index}><strong>{String(offer.promoLabel || offer.activityName || t('admin.unavailableShort'))}</strong><span>{String(offer.discountPercent ?? 0)}% · {String(offer.activityName || '')}</span></li>)}</ul> : <p className="admin-muted">{t('admin.partners.noOffers')}</p>}
      <div className="admin-dialog-actions"><button type="button" className="admin-secondary-button" onClick={onClose}>{t('admin.close')}</button></div>
    </>}
  </dialog>;
}
