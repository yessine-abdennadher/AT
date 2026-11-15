import { useCallback, useEffect, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, RefreshCw, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { adminService, type AdminReviewRow } from '../../services/adminService';

const PAGE_SIZE = 20;
const formatText = (value: string, values: Record<string, string | number>) => Object.entries(values).reduce((text, [key, item]) => text.replaceAll(`{{${key}}}`, String(item)), value);

export function AdminReviewsTab() {
  const { t, isRTL } = useLanguage();
  const [rows, setRows] = useState<AdminReviewRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const result = await adminService.getReviews({ status: 'pending', page, limit: PAGE_SIZE });
      setRows(result.reviews || []); setTotal(result.total); setTotalPages(Math.max(1, result.totalPages || 1));
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [page]);
  useEffect(() => { void load(); }, [load]);

  const moderate = async (row: AdminReviewRow, status: 'approved' | 'rejected') => {
    setBusyId(row._id); setNotice('');
    try { await adminService.setReviewStatus(row._id, status); setNotice(t('admin.actionSuccess')); await load(); }
    catch { setNotice(t('admin.actionError')); }
    finally { setBusyId(null); }
  };

  return (
    <div className="admin-list-module">
      <div className="admin-toolbar"><p>{t('admin.reviews.pendingDescription')}</p><span className="admin-result-count">{formatText(t('admin.resultsCount'), { count: total })}</span></div>
      {notice && <p className="admin-notice" role="status">{notice}</p>}
      {loading ? <p className="admin-panel-state" role="status">{t('admin.loading')}</p>
        : error ? <div className="admin-panel-state" role="alert"><p>{t('admin.loadError')}</p><button className="admin-secondary-button" type="button" onClick={() => void load()}><RefreshCw size={16} aria-hidden="true" />{t('admin.retry')}</button></div>
          : rows.length === 0 ? <p className="admin-panel-state" role="status">{t('admin.reviews.empty')}</p>
            : <div className="admin-record-list">{rows.map((row) => (
              <article className="admin-record-card admin-review-card" key={row._id}>
                <div className="admin-record-main"><h3>{row.activity?.name || t('admin.reviews.unknownActivity')}</h3><p>{row.userName || t('admin.reviews.anonymous')} · {formatText(t('admin.reviews.rating'), { rating: row.rating })}</p><p className="admin-review-comment">{row.comment}</p>{row.createdAt && <time dateTime={row.createdAt}>{new Date(row.createdAt).toLocaleDateString()}</time>}</div>
                <div className="admin-record-actions"><button type="button" className="admin-secondary-button" disabled={busyId === row._id} onClick={() => void moderate(row, 'approved')}><Check size={16} aria-hidden="true" />{t('admin.reviews.approve')}</button><button type="button" className="admin-danger-button" disabled={busyId === row._id} onClick={() => void moderate(row, 'rejected')}><X size={16} aria-hidden="true" />{t('admin.reviews.reject')}</button></div>
              </article>
            ))}</div>}
      {!loading && !error && <nav className="admin-pagination" aria-label={t('admin.pagination')}><button className="admin-secondary-button" type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1}>{isRTL ? <ChevronRight aria-hidden="true" /> : <ChevronLeft aria-hidden="true" />}{t('admin.previous')}</button><span>{formatText(t('admin.pageOf'), { page, totalPages })}</span><button className="admin-secondary-button" type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages}>{t('admin.next')}{isRTL ? <ChevronLeft aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}</button></nav>}
    </div>
  );
}
