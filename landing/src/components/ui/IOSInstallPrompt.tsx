import { useEffect, useState } from 'react';
import { Plus, Share2, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import './ios-install-prompt.css';

const DISMISSAL_KEY = 'tfarhida-ios-install-dismissed-until';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function IOSInstallPrompt() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    const isAppleMobile = /iPhone|iPad|iPod/i.test(userAgent) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    const isSafari = /Safari/i.test(userAgent) &&
      !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|Chrome|Android/i.test(userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (!isAppleMobile || !isSafari || isStandalone) return;

    try {
      const dismissedUntil = Number(window.localStorage.getItem(DISMISSAL_KEY) || 0);
      if (dismissedUntil > Date.now()) return;
    } catch {
      // Afficher l’aide si le stockage local est indisponible.
    }

    setVisible(true);
  }, []);

  const dismissForSevenDays = () => {
    try {
      window.localStorage.setItem(DISMISSAL_KEY, String(Date.now() + SEVEN_DAYS_MS));
    } catch {
      // La fermeture immédiate reste disponible même sans stockage local.
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside className="ios-install-prompt" aria-labelledby="ios-install-title" role="region">
      <button
        type="button"
        className="ios-install-prompt__close"
        onClick={() => setVisible(false)}
        aria-label={t('iosInstall.close')}
      >
        <X size={19} aria-hidden="true" />
      </button>
      <div className="ios-install-prompt__content">
        <div className="ios-install-prompt__icon" aria-hidden="true">T</div>
        <div className="ios-install-prompt__copy">
          <h2 id="ios-install-title">{t('iosInstall.title')}</h2>
          <p>{t('iosInstall.subtitle')}</p>
          <ol className="ios-install-prompt__steps">
            <li><Share2 size={17} aria-hidden="true" /><span>{t('iosInstall.stepShare')}</span></li>
            <li><Plus size={17} aria-hidden="true" /><span>{t('iosInstall.stepHome')}</span></li>
          </ol>
          <button type="button" className="ios-install-prompt__dismiss" onClick={dismissForSevenDays}>
            {t('iosInstall.dismissSevenDays')}
          </button>
        </div>
      </div>
    </aside>
  );
}
