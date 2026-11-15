import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Search, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { adminService, type AdminUserRow } from '../../services/adminService';
import { ConfirmAdminActionDialog } from './ConfirmAdminActionDialog';

const PAGE_SIZE = 20;
type UserAction = { user: AdminUserRow; kind: 'status'; isActive: boolean } | { user: AdminUserRow; kind: 'role'; role: AdminUserRow['role'] };
const formatText = (value: string, values: Record<string, string | number>) => Object.entries(values).reduce((text, [key, item]) => text.replaceAll('{{' + key + '}}', String(item)), value);

export function AdminUsersTab() {
  const { user: currentUser } = useAuth();
  const { t, isRTL } = useLanguage();
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [pendingAction, setPendingAction] = useState<UserAction | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const result = await adminService.getUsers({ page, limit: PAGE_SIZE, search: search.trim() || undefined, role: role === 'all' ? undefined : role, status: status === 'all' ? undefined : status === 'active' ? 'true' : 'false' });
      setRows(result.users || []); setTotal(result.total); setTotalPages(Math.max(1, result.totalPages || 1));
    } catch { setError(true); } finally { setLoading(false); }
  }, [page, role, search, status]);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, search ? 300 : 0); return () => window.clearTimeout(timer); }, [load, search]);
  const runAction = async () => {
    if (!pendingAction) return;
    const action = pendingAction; setBusyId(action.user._id); setNotice('');
    try {
      if (action.kind === 'status') await adminService.setUserStatus(action.user._id, action.isActive);
      else await adminService.setUserRole(action.user._id, action.role);
      setPendingAction(null); setNotice(t('admin.actionSuccess')); await load();
    } catch { setNotice(t('admin.actionError')); } finally { setBusyId(null); }
  };
  const actionTitle = pendingAction?.kind === 'status' ? t(pendingAction.isActive ? 'admin.users.activateTitle' : 'admin.users.suspendTitle') : t('admin.users.roleTitle');
  const actionDescription = pendingAction?.kind === 'status'
    ? formatText(t(pendingAction.isActive ? 'admin.users.activateDescription' : 'admin.users.suspendDescription'), { name: pendingAction.user.name })
    : pendingAction ? formatText(t('admin.users.roleDescription'), { name: pendingAction.user.name, role: t('admin.users.roles.' + pendingAction.role) }) : '';
  return (
    <div className="admin-list-module">
      <div className="admin-toolbar admin-users-toolbar">
        <label className="admin-search-field"><span className="admin-sr-only">{t('admin.users.search')}</span><Search size={17} aria-hidden="true" /><input type="search" value={search} placeholder={t('admin.users.search')} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></label>
        <label><span className="admin-sr-only">{t('admin.users.roleFilter')}</span><select value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }}><option value="all">{t('admin.users.allRoles')}</option>{(['user','partner','admin'] as const).map((item)=><option key={item} value={item}>{t('admin.users.roles.' + item)}</option>)}</select></label>
        <label><span className="admin-sr-only">{t('admin.users.statusFilter')}</span><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="all">{t('admin.users.allStatuses')}</option><option value="active">{t('admin.users.active')}</option><option value="inactive">{t('admin.users.suspended')}</option></select></label>
        <span className="admin-result-count">{formatText(t('admin.resultsCount'), { count: total })}</span>
      </div>
      {notice && <p className="admin-notice" role="status">{notice}</p>}
      {loading ? <p className="admin-panel-state" role="status">{t('admin.loading')}</p>
        : error ? <div className="admin-panel-state" role="alert"><p>{t('admin.loadError')}</p><button className="admin-secondary-button" type="button" onClick={() => void load()}><RefreshCw size={16} aria-hidden="true" />{t('admin.retry')}</button></div>
          : rows.length === 0 ? <p className="admin-panel-state" role="status">{t('admin.users.empty')}</p>
            : <div className="admin-record-list">{rows.map((row) => {
              const self = row._id === currentUser?.id || row._id === currentUser?._id;
              return <article className="admin-record-card" key={row._id}>
                <span className="admin-title-icon"><UserRound aria-hidden="true" /></span>
                <div className="admin-record-main"><h3>{row.name}</h3><p>{row.email}{row.city ? ' · ' + row.city : ''}</p><span className={'admin-status ' + (row.isActive ? 'is-approved' : 'is-pending')}>{row.isActive ? t('admin.users.active') : t('admin.users.suspended')}</span><span className="admin-role-label">{t('admin.users.roles.' + row.role)}</span></div>
                <div className="admin-record-actions">
                  <label className="admin-inline-select"><span>{t('admin.users.changeRole')}</span><select aria-label={t('admin.users.changeRole') + ' : ' + row.name} value={row.role} disabled={self || busyId === row._id} onChange={(event) => setPendingAction({ user: row, kind: 'role', role: event.target.value as AdminUserRow['role'] })}>{(['user','partner','admin'] as const).map((item)=><option key={item} value={item}>{t('admin.users.roles.' + item)}</option>)}</select></label>
                  <button type="button" className="admin-secondary-button" disabled={self || busyId === row._id} onClick={() => setPendingAction({ user: row, kind: 'status', isActive: !row.isActive })}>{row.isActive ? t('admin.users.suspend') : t('admin.users.activate')}</button>
                  {self && <span className="admin-muted">{t('admin.users.currentAdmin')}</span>}
                </div>
              </article>;
            })}</div>}
      {!loading && !error && <nav className="admin-pagination" aria-label={t('admin.pagination')}><button className="admin-secondary-button" type="button" onClick={() => setPage((value)=>Math.max(1,value-1))} disabled={page <= 1}>{isRTL ? <ChevronRight aria-hidden="true"/> : <ChevronLeft aria-hidden="true"/>}{t('admin.previous')}</button><span>{formatText(t('admin.pageOf'),{page,totalPages})}</span><button className="admin-secondary-button" type="button" onClick={() => setPage((value)=>Math.min(totalPages,value+1))} disabled={page >= totalPages}>{t('admin.next')}{isRTL ? <ChevronLeft aria-hidden="true"/> : <ChevronRight aria-hidden="true"/>}</button></nav>}
      <ConfirmAdminActionDialog open={Boolean(pendingAction)} title={actionTitle} description={actionDescription} onCancel={()=>setPendingAction(null)} onConfirm={()=>void runAction()} busy={Boolean(pendingAction && busyId === pendingAction.user._id)} />
    </div>
  );
}
