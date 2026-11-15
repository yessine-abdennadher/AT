import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { ChatConversation } from './ChatConversation';
import { KharjaBotOrb } from './KharjaBotOrb';
import '../../styles/floating-assistant.css';

export function FloatingAssistant({ openRequest = 0 }: { openRequest?: number }) {
  const { t } = useLanguage();
  const [localOpenRequest, setLocalOpenRequest] = useState(0);
  const [closedAtRequest, setClosedAtRequest] = useState(0);
  const currentRequest = Math.max(openRequest, localOpenRequest);
  const open = currentRequest > closedAtRequest;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputId = 'floating-assistant-message';

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setClosedAtRequest(currentRequest);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open, currentRequest]);

  return <aside className={`floating-assistant${open ? ' is-open' : ''}`}>
    {open && <div id="floating-assistant-dialog" className="floating-assistant-panel" role="dialog" aria-labelledby="floating-assistant-title">
      <header className="floating-assistant-header">
        <span className="floating-assistant-avatar" aria-hidden="true"><KharjaBotOrb size={42} /></span>
        <div><h2 id="floating-assistant-title">{t('nav.assistant')}</h2><p>{t('assistant.subtitle')}</p></div>
        <button className="floating-assistant-close" type="button" aria-label={t('assistant.close')} onClick={() => { setClosedAtRequest(currentRequest); triggerRef.current?.focus(); }}><X size={19} aria-hidden="true" /></button>
      </header>
      <ChatConversation inputId={inputId} autoFocus />
    </div>}
    <button
      ref={triggerRef}
      className="floating-assistant-trigger"
      type="button"
      aria-label={open ? t('assistant.close') : t('assistant.open')}
      aria-expanded={open}
      aria-controls={open ? 'floating-assistant-dialog' : undefined}
      onClick={() => open ? setClosedAtRequest(currentRequest) : setLocalOpenRequest((value) => Math.max(value, openRequest) + 1)}
    >
      {open ? <X size={25} aria-hidden="true" /> : <KharjaBotOrb size={66} />}
    </button>
  </aside>;
}
