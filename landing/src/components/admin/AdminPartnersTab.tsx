import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, Store } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { adminService, type AdminPartnerSummary } from '../../services/adminService';
import { AdminPartnerDetailsDialog } from './AdminPartnerDetailsDialog';
import { AdminPartnerTierDialog } from './AdminPartnerTierDialog';

type PartnerFilter = 'all' | 'standard' | 'pro' | 'premium' | 'stale';

export function AdminPartnersTab() {
  const { t } = useLanguage();
  const [partners, setPartners] = useState<AdminPartnerSummary[] | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<PartnerFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [detailsPartner, setDetailsPartner] = useState<AdminPartnerSummary | null>(null);
  const [tierPartner, setTierPartner] = useState<AdminPartnerSummary | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try { const response=await adminService.getDiagnostics(); setPartners(Array.isArray(response.diagnostics?.partnersStatus)?response.diagnostics.partnersStatus:null); }
    catch { setError(true); }
    finally { setLoading(false); }
  },[]);
  useEffect(()=>{void load();},[load]);

  const visiblePartners = useMemo(() => (partners || []).filter((partner) => {
    const matchesSearch=[partner.name,partner.email,partner.establishmentName].some((value)=>value?.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
    const matchesFilter=filter==='all'||filter==='stale'?filter==='all'||Boolean(partner.hasStaleData):partner.partnerTier===filter;
    return matchesSearch&&matchesFilter;
  }),[partners,search,filter]);

  const changeTier = async (tier: AdminPartnerSummary['partnerTier']) => {
    if(!tierPartner)return;
    const target=tierPartner; setBusyId(target.id); setNotice('');
    try { await adminService.setPartnerTier(target.id,tier); setTierPartner(null); setNotice(t('admin.actionSuccess')); await load(); }
    catch { setNotice(t('admin.actionError')); }
    finally { setBusyId(null); }
  };

  return <div className="admin-list-module">
    <div className="admin-toolbar admin-partners-toolbar">
      <label className="admin-search-field"><span className="admin-sr-only">{t('admin.partners.search')}</span><Search size={17} aria-hidden="true"/><input type="search" value={search} placeholder={t('admin.partners.search')} onChange={(event)=>setSearch(event.target.value)}/></label>
      <label><span className="admin-sr-only">{t('admin.partners.filter')}</span><select value={filter} onChange={(event)=>setFilter(event.target.value as PartnerFilter)}><option value="all">{t('admin.partners.all')}</option><option value="standard">{t('admin.partners.tiers.standard')}</option><option value="pro">{t('admin.partners.tiers.pro')}</option><option value="premium">{t('admin.partners.tiers.premium')}</option><option value="stale">{t('admin.partners.stale')}</option></select></label>
      <span className="admin-result-count">{partners ? visiblePartners.length + ' / ' + partners.length : t('admin.unavailableShort')}</span>
    </div>
    {notice&&<p className="admin-notice" role="status">{notice}</p>}
    {loading?<p className="admin-panel-state" role="status">{t('admin.loading')}</p>
      :error?<div className="admin-panel-state" role="alert"><p>{t('admin.loadError')}</p><button className="admin-secondary-button" type="button" onClick={()=>void load()}><RefreshCw size={16} aria-hidden="true"/>{t('admin.retry')}</button></div>
        :partners===null?<p className="admin-panel-state" role="status">{t('admin.unavailable')}</p>
          :visiblePartners.length===0?<p className="admin-panel-state" role="status">{t('admin.partners.empty')}</p>
            :<div className="admin-record-list">{visiblePartners.map((partner)=><article className="admin-record-card" key={partner.id}>
              <span className="admin-title-icon"><Store aria-hidden="true"/></span>
              <div className="admin-record-main"><h3>{partner.establishmentName||partner.name}</h3><p>{partner.name} · {partner.email}{partner.city?' · '+partner.city:''}</p><span className="admin-status is-approved">{t('admin.partners.tiers.'+partner.partnerTier)}</span>{partner.hasStaleData&&<span className="admin-status is-pending">{t('admin.partners.stale')}</span>}<p>{t('admin.partners.activitiesCount')}: {partner.activityCount ?? t('admin.unavailableShort')} · {t('admin.partners.subscriptionStatus')}: {partner.subscriptionStatus||t('admin.unavailableShort')}</p></div>
              <div className="admin-record-actions"><button className="admin-secondary-button" type="button" onClick={()=>setDetailsPartner(partner)}>{t('admin.partners.viewDetails')}</button><button className="admin-secondary-button" type="button" disabled={busyId===partner.id} onClick={()=>setTierPartner(partner)}>{t('admin.partners.changeTier')}</button></div>
            </article>)}</div>}
    <AdminPartnerDetailsDialog partner={detailsPartner} onClose={()=>setDetailsPartner(null)}/>
    <AdminPartnerTierDialog partner={tierPartner} busy={Boolean(tierPartner&&busyId===tierPartner.id)} onClose={()=>setTierPartner(null)} onConfirm={(tier)=>void changeTier(tier)}/>
  </div>;
}
