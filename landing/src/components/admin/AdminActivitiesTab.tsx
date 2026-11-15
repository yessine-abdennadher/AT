import { useCallback, useEffect, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, RefreshCw, Star, Trash2, TrendingUp } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { adminService, type AdminActivityRow } from '../../services/adminService';
import { ConfirmAdminActionDialog } from './ConfirmAdminActionDialog';

type ActivityFilter = 'all' | 'pending' | 'approved';
const PAGE_SIZE = 20;
const formatText = (value: string, values: Record<string, string | number>) => Object.entries(values).reduce((text, [key, item]) => text.replaceAll(`{{${key}}}`, String(item)), value);

export function AdminActivitiesTab() {
  const { t, isRTL } = useLanguage();
  const [rows, setRows] = useState<AdminActivityRow[]>([]);
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminActivityRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const result = await adminService.getActivities({ status: filter === 'all' ? undefined : filter, page, limit: PAGE_SIZE });
      setRows(result.activities || []); setTotal(result.total); setTotalPages(Math.max(1, result.totalPages || 1));
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [filter, page]);
  useEffect(() => { void load(); }, [load]);

  const run = async (row: AdminActivityRow, action: () => Promise<unknown>) => {
    setBusyId(row._id); setNotice('');
    try { await action(); setNotice(t('admin.actionSuccess')); await load(); }
    catch { setNotice(t('admin.actionError')); }
    finally { setBusyId(null); }
  };

  return (
    <div className="admin-list-module">
      <div className="admin-toolbar">
        <label className="admin-filter-label" htmlFor="admin-activity-filter">{t('admin.activities.filterLabel')}</label>
        <select id="admin-activity-filter" value={filter} onChange={(event) => { setFilter(event.target.value as ActivityFilter); setPage(1); }}>
          <option value="all">{t('admin.activities.all')}</option><option value="pending">{t('admin.activities.pending')}</option><option value="approved">{t('admin.activities.approved')}</option>
        </select>
        <span className="admin-result-count">{formatText(t('admin.resultsCount'), { count: total })}</span>
      </div>
      {notice && <p className="admin-notice" role="status">{notice}</p>}
      {loading ? <p className="admin-panel-state" role="status">{t('admin.loading')}</p>
        : error ? <div className="admin-panel-state" role="alert"><p>{t('admin.loadError')}</p><button className="admin-secondary-button" type="button" onClick={() => void load()}><RefreshCw size={16} aria-hidden="true" />{t('admin.retry')}</button></div>
          : rows.length === 0 ? <p className="admin-panel-state" role="status">{t('admin.activities.empty')}</p>
            : <div className="admin-record-list">{rows.map((row) => (
              <article className="admin-record-card" key={row._id}>
                {row.imageUrl && <img className="admin-record-image" src={row.imageUrl} alt="" loading="lazy" />}
                <div className="admin-record-main"><h3>{row.name}</h3><p>{[row.city, row.category, row.createdBy?.establishmentName || row.createdBy?.name].filter(Boolean).join(' · ')}</p><span className={`admin-status ${row.isApproved ? 'is-approved' : 'is-pending'}`}>{row.isApproved ? t('admin.activities.approved') : t('admin.activities.pending')}</span></div>
                <div className="admin-record-actions">
                  <button type="button" className="admin-secondary-button" disabled={busyId === row._id} onClick={() => void run(row, () => adminService.setActivityApproval(row._id, !row.isApproved))}><Check size={16} aria-hidden="true" />{row.isApproved ? t('admin.activities.suspend') : t('admin.activities.approve')}</button>
                  <button type="button" className="admin-secondary-button" disabled={busyId === row._id} aria-label={`${t('admin.activities.featured')} : ${row.name}`} aria-pressed={Boolean(row.isFeatured)} onClick={() => void run(row, () => adminService.toggleActivityHighlight(row._id, 'isFeatured'))}><Star size={16} aria-hidden="true" />{t('admin.activities.featured')}</button>
                  <button type="button" className="admin-secondary-button" disabled={busyId === row._id} aria-label={`${t('admin.activities.popular')} : ${row.name}`} aria-pressed={Boolean(row.isPopular)} onClick={() => void run(row, () => adminService.toggleActivityHighlight(row._id, 'isPopular'))}><TrendingUp size={16} aria-hidden="true" />{t('admin.activities.popular')}</button>
                  <button type="button" className="admin-danger-button" disabled={busyId === row._id} aria-label={`${t('admin.activities.delete')} : ${row.name}`} onClick={() => setDeleteTarget(row)}><Trash2 size={16} aria-hidden="true" />{t('admin.activities.delete')}</button>
                </div>
              </article>
            ))}</div>}
      {!loading && !error && <nav className="admin-pagination" aria-label={t('admin.pagination')}><button className="admin-secondary-button" type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1}>{isRTL ? <ChevronRight aria-hidden="true" /> : <ChevronLeft aria-hidden="true" />}{t('admin.previous')}</button><span>{formatText(t('admin.pageOf'), { page, totalPages })}</span><button className="admin-secondary-button" type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages}>{t('admin.next')}{isRTL ? <ChevronLeft aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}</button></nav>}
      <ConfirmAdminActionDialog open={Boolean(deleteTarget)} title={t('admin.activities.deleteTitle')} description={formatText(t('admin.activities.deleteDescription'), { name: deleteTarget?.name || '' })} onCancel={() => setDeleteTarget(null)} onConfirm={() => { if (!deleteTarget) return; void run(deleteTarget, () => adminService.deleteActivity(deleteTarget._id)).then(() => setDeleteTarget(null)); }} busy={busyId === deleteTarget?._id} />
    </div>
  );
}
