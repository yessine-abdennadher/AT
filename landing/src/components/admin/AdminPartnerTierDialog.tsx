import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import type { AdminPartnerSummary } from '../../services/adminService';

export function AdminPartnerTierDialog({ partner, busy, onClose, onConfirm }: { partner: AdminPartnerSummary | null; busy: boolean; onClose: () => void; onConfirm: (tier: AdminPartnerSummary['partnerTier']) => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [tier, setTier] = useState<AdminPartnerSummary['partnerTier']>('standard');
  const { t } = useLanguage();
  useEffect(() => { if (partner) setTier(partner.partnerTier); }, [partner]);
  useEffect(() => {
    const dialog=dialogRef.current; if(!dialog)return;
    if(partner&&!dialog.open)dialog.showModal();
    if(!partner&&dialog.open)dialog.close();
  },[partner]);
  return <dialog ref={dialogRef} className="admin-confirm-dialog" aria-labelledby="admin-tier-title" onCancel={(event)=>{event.preventDefault();onClose();}} onClose={onClose}>
    {partner && <><h2 id="admin-tier-title">{t('admin.partners.changeTier')}</h2><p>{partner.establishmentName || partner.name}</p><fieldset className="admin-tier-options"><legend>{t('admin.partners.tier')}</legend>{(['standard','pro','premium'] as const).map((value)=><label key={value}><input type="radio" name="partner-tier" value={value} checked={tier===value} onChange={()=>setTier(value)} />{t('admin.partners.tiers.' + value)}</label>)}</fieldset><div className="admin-dialog-actions"><button type="button" className="admin-secondary-button" onClick={onClose} disabled={busy}>{t('admin.cancel')}</button><button type="button" className="admin-primary-button" onClick={()=>onConfirm(tier)} disabled={busy}>{busy?t('admin.working'):t('admin.confirm')}</button></div></>}
  </dialog>;
}
