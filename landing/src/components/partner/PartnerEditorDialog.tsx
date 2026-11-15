import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { partnerService, type PartnerActivity, type PartnerActivityInput } from '../../services/partnerService';

type EditorMode = 'activity' | 'promotion' | 'event';
type EditorValue = PartnerActivityInput | NonNullable<PartnerActivity['promotion']> | NonNullable<PartnerActivity['events']>[number];

interface Props {
  mode: EditorMode;
  activity: PartnerActivity | null;
  onClose: () => void;
  onSave: (value: EditorValue) => Promise<void>;
}

export function PartnerEditorDialog({ mode, activity, onClose, onSave }: Props) {
  const { t } = useLanguage();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  const set = (key: string, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    const node = dialogRef.current;
    if (node && !node.open) node.showModal();
    const defaults: Record<string, string | boolean> = mode === 'activity' ? {
      name: activity?.name || '', category: activity?.category || 'food', type: activity?.type || 'restaurant',
      city: activity?.city || '', address: activity?.address || '', mapsUrl: activity?.mapsUrl || '',
      price: String(activity?.price ?? 0), description: activity?.description || '', imageUrl: activity?.imageUrl || '',
      menuImageUrl: activity?.menuImageUrl || '', menuUrl: activity?.menuUrl || '',
      amenities: activity?.amenities?.join(', ') || '', phone: activity?.phone || '', whatsapp: activity?.whatsapp || '', instagram: activity?.instagram || '',
      openingTime: activity?.openingTime || '09:00', closingTime: activity?.closingTime || '23:00',
      openDays: activity?.openDays?.join(', ') || '', hasAirConditioning: Boolean(activity?.hasAirConditioning),
      hasPowerBackup: Boolean(activity?.hasPowerBackup),
    } : mode === 'promotion' ? {
      isPromo: activity?.promotion?.isPromo ?? true, promoType: activity?.promotion?.promoType || 'all',
      discountPercent: String(activity?.promotion?.discountPercent || 20), targetItem: activity?.promotion?.targetItem || '',
      promoLabel: activity?.promotion?.promoLabel || '', validUntil: activity?.promotion?.validUntil || '',
    } : {
      title: '', image: activity?.imageUrl || '', date: '', time: '', price: '0', description: '', category: 'music',
    };
    setForm(defaults);
    setError('');
    return () => { if (node?.open) node.close(); };
  }, [mode, activity]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      let payload: EditorValue;
      if (mode === 'activity') {
        payload = {
          ...form,
          name: String(form.name || '').trim(), category: String(form.category), type: String(form.type) as PartnerActivityInput['type'],
          city: String(form.city || '').trim(), address: String(form.address || '').trim(),
          locationName: String(form.address || form.city || '').trim(), mapsUrl: String(form.mapsUrl || '').trim(),
          price: Number(form.price) || 0, description: String(form.description || '').trim(), imageUrl: String(form.imageUrl || '').trim(),
          menuImageUrl: String(form.menuImageUrl || '').trim(), menuUrl: String(form.menuUrl || '').trim(),
          amenities: String(form.amenities || '').split(',').map((amenity) => amenity.trim()).filter(Boolean),
          phone: String(form.phone || '').trim(), whatsapp: String(form.whatsapp || '').trim(), instagram: String(form.instagram || '').trim().replace(/^@/, ''),
          openingTime: String(form.openingTime || ''), closingTime: String(form.closingTime || ''),
          openDays: String(form.openDays || '').split(',').map((day) => day.trim()).filter(Boolean),
          hasAirConditioning: Boolean(form.hasAirConditioning), hasPowerBackup: Boolean(form.hasPowerBackup),
        } as PartnerActivityInput;
        if (!payload.name || !payload.city || !payload.imageUrl || !payload.description) throw new Error(t('partnerDashboard.requiredFields'));
      } else if (mode === 'promotion') {
        payload = {
          isPromo: Boolean(form.isPromo), promoType: String(form.promoType) as 'all' | 'item',
          discountPercent: Math.min(100, Math.max(0, Number(form.discountPercent) || 0)), targetItem: String(form.targetItem || '').trim(),
          promoLabel: String(form.promoLabel || '').trim(), validUntil: String(form.validUntil || '').trim(),
        };
      } else {
        payload = {
          title: String(form.title || '').trim(), image: String(form.image || '').trim(), date: String(form.date || '').trim(),
          time: String(form.time || '').trim(), price: Number(form.price) || 0, description: String(form.description || '').trim(), category: String(form.category || 'music'),
        };
        if (!payload.title) throw new Error(t('partnerDashboard.eventTitleRequired'));
      }
      await onSave(payload);
      if (dialogRef.current?.open) dialogRef.current.close();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('partnerDashboard.saveError'));
    } finally { setBusy(false); }
  };

  const handleImage = async (key: string, file?: File) => {
    if (!file) return;
    setBusy(true); setError('');
    try { set(key, await partnerService.uploadImage(file, {
      invalidType: t('partnerDashboard.invalidImageType'), tooLarge: t('partnerDashboard.imageTooLarge'),
      readFailed: t('partnerDashboard.imageReadFailed'), invalidImage: t('partnerDashboard.invalidImage'),
    })); }
    catch (reason) { setError(reason instanceof Error ? reason.message : t('partnerDashboard.uploadError')); }
    finally { setBusy(false); }
  };

  const input = (key: string, label: string, type = 'text', required = false) => (
    <label className="partner-field" key={key}><span>{label}</span>{key === 'description' ?
      <textarea rows={4} value={String(form[key] ?? '')} required={required} onChange={(event) => set(key, event.target.value)} /> :
      <input type={type} value={String(form[key] ?? '')} required={required} onChange={(event) => set(key, event.target.value)} />}</label>
  );
  const select = (key: string, label: string, options: Array<[string, string]>) => (
    <label className="partner-field" key={key}><span>{label}</span><select value={String(form[key] || '')} onChange={(event) => set(key, event.target.value)}>
      {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
    </select></label>
  );

  return <dialog ref={dialogRef} className="partner-editor-dialog" onCancel={(event) => { event.preventDefault(); onClose(); }} onClose={onClose}>
    <form onSubmit={handleSubmit}>
      <header className="partner-dialog-heading"><div><p>{t('partnerDashboard.dialogEyebrow')}</p><h2>{t(`partnerDashboard.${mode}Title`)}</h2></div>
        <button type="button" className="partner-icon-button" aria-label={t('partnerDashboard.close')} onClick={onClose}>×</button></header>
      {mode === 'activity' && <>
        <div className="partner-form-grid">
          {input('name', t('partnerDashboard.name'), 'text', true)}
          {select('type', t('partnerDashboard.type'), [['restaurant', t('partnerDashboard.restaurant')], ['cafe', t('partnerDashboard.cafe')], ['activity', t('partnerDashboard.activityType')], ['other', t('partnerDashboard.other')]])}
          {select('category', t('partnerDashboard.category'), [['food', t('partnerDashboard.food')], ['fun', t('partnerDashboard.fun')], ['sport', t('partnerDashboard.sport')], ['outdoor', t('partnerDashboard.outdoor')], ['creative', t('partnerDashboard.creative')], ['couple', t('partnerDashboard.couple')], ['friends', t('partnerDashboard.friends')]])}
          {input('city', t('partnerDashboard.city'), 'text', true)}{input('address', t('partnerDashboard.address'))}
          {input('mapsUrl', t('partnerDashboard.mapsUrl'), 'url')}{input('price', t('partnerDashboard.price'), 'number')}
          {input('amenities', t('partnerDashboard.amenities'))}{input('menuUrl', t('partnerDashboard.menuUrl'), 'url')}
          {input('phone', t('partnerDashboard.phone'), 'tel')}{input('whatsapp', t('partnerDashboard.whatsapp'), 'tel')}
          {input('instagram', t('partnerDashboard.instagram'))}{input('openingTime', t('partnerDashboard.openingTime'), 'time')}
          {input('closingTime', t('partnerDashboard.closingTime'), 'time')}{input('openDays', t('partnerDashboard.openDays'))}
          {input('description', t('partnerDashboard.description'), 'text', true)}
          <label className="partner-field"><span>{t('partnerDashboard.photo')}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void handleImage('imageUrl', event.target.files?.[0])} />{Boolean(form.imageUrl) && <img className="partner-image-preview" src={String(form.imageUrl)} alt={t('partnerDashboard.photoPreview')} />}</label>
          <label className="partner-field"><span>{t('partnerDashboard.menuPhoto')}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void handleImage('menuImageUrl', event.target.files?.[0])} />{Boolean(form.menuImageUrl) && <img className="partner-image-preview" src={String(form.menuImageUrl)} alt={t('partnerDashboard.menuPhoto')} />}</label>
          <label className="partner-check"><input type="checkbox" checked={Boolean(form.hasAirConditioning)} onChange={(event) => set('hasAirConditioning', event.target.checked)} />{t('partnerDashboard.airConditioning')}</label>
          <label className="partner-check"><input type="checkbox" checked={Boolean(form.hasPowerBackup)} onChange={(event) => set('hasPowerBackup', event.target.checked)} />{t('partnerDashboard.generator')}</label>
        </div>
      </>}
      {mode === 'promotion' && <div className="partner-form-grid">
        {select('promoType', t('partnerDashboard.promoScope'), [['all', t('partnerDashboard.allBill')], ['item', t('partnerDashboard.oneItem')]])}
        {input('discountPercent', t('partnerDashboard.discount'), 'number')}
        {String(form.promoType) === 'item' && input('targetItem', t('partnerDashboard.targetItem'))}
        {input('promoLabel', t('partnerDashboard.promoLabel'), 'text', true)}{input('validUntil', t('partnerDashboard.validUntil'))}
        <label className="partner-check"><input type="checkbox" checked={Boolean(form.isPromo)} onChange={(event) => set('isPromo', event.target.checked)} />{t('partnerDashboard.promoActive')}</label>
      </div>}
      {mode === 'event' && <div className="partner-form-grid">
        {input('title', t('partnerDashboard.eventName'), 'text', true)}{input('date', t('partnerDashboard.eventDate'))}
        {input('time', t('partnerDashboard.eventTime'), 'time')}{input('price', t('partnerDashboard.eventPrice'), 'number')}
        {input('description', t('partnerDashboard.eventDescription'))}
        <label className="partner-field"><span>{t('partnerDashboard.eventPhoto')}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void handleImage('image', event.target.files?.[0])} />{Boolean(form.image) && <img className="partner-image-preview" src={String(form.image)} alt={t('partnerDashboard.photoPreview')} />}</label>
      </div>}
      {error && <p className="partner-form-error" role="alert">{error}</p>}
      <footer className="partner-dialog-actions"><button type="button" className="partner-secondary-button" onClick={onClose}>{t('partnerDashboard.cancel')}</button>
        <button type="submit" className="partner-primary-button" disabled={busy}>{busy ? t('partnerDashboard.saving') : t('partnerDashboard.save')}</button></footer>
    </form>
  </dialog>;
}

export type { EditorMode, EditorValue };
