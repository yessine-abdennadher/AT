import { useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';

export function ConfirmAdminActionDialog({ open, title, description, onCancel, onConfirm, busy = false }: {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { t } = useLanguage();
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={dialogRef} className="admin-confirm-dialog" aria-labelledby="admin-confirm-title" onCancel={(event) => { event.preventDefault(); onCancel(); }} onClose={onCancel}>
      <h2 id="admin-confirm-title">{title}</h2>
      <p>{description}</p>
      <div className="admin-dialog-actions">
        <button type="button" className="admin-secondary-button" onClick={onCancel} disabled={busy}>{t('admin.cancel')}</button>
        <button type="button" className="admin-danger-button" onClick={onConfirm} disabled={busy}>{busy ? t('admin.working') : t('admin.confirm')}</button>
      </div>
    </dialog>
  );
}
