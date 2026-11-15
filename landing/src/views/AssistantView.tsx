import { useOutletContext } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export function AssistantView() {
  const { t } = useLanguage();
  const { openAssistant } = useOutletContext<{ openAssistant: () => void }>();
  return <section className="public-page assistant-page"><h1>{t('nav.assistant')}</h1>
    <p>{t('assistant.pageIntro')}</p>
    <button type="button" className="btn btn-primary" onClick={openAssistant}>{t('assistant.open')}</button>
  </section>;
}
