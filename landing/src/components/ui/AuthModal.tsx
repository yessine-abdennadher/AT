import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  KeyRound,
  MessageCircle,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { authService, AdminMfaRequiredError } from '../../services/authService';
import '../../styles/auth-modal.css';

type ExtendedAuthMode = 'login' | 'register' | 'forgot' | 'admin-mfa';
type ForgotStep = 'email' | 'verify' | 'reset';

export function AuthModal() {
  const { authModalOpen, authMode, closeAuth, signIn, completeAdminMfa, signUp } = useAuth();
  const { t, isRTL } = useLanguage();

  const [mode, setMode] = useState<ExtendedAuthMode>(authMode);
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [adminChallenge, setAdminChallenge] = useState<{ challengeId: string; maskedEmail: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successText, setSuccessText] = useState('');

  const dialogRef = useRef<HTMLElement>(null);

  // Synchronisation avec le mode d'ouverture (login ou register)
  useEffect(() => {
    setMode(authMode);
    setForgotStep('email');
    setError('');
    setInfoMessage('');
    setIsSuccess(false);
  }, [authMode, authModalOpen]);

  // Verrouillage du scroll sur body & gestion du focus / Escape
  useEffect(() => {
    if (!authModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const trigger = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLElement>('input')?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeAuth();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const items = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), a:not(:disabled)'
        )
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', onKeyDown);
      trigger?.focus();
    };
  }, [authModalOpen, closeAuth]);

  if (!authModalOpen) return null;

  // Calcul du score de solidité du mot de passe (12 caractères requis)
  const passwordToCheck = mode === 'forgot' ? newPassword : password;
  const passwordLength = passwordToCheck.length;
  const passwordProgress = Math.min(100, Math.round((passwordLength / 12) * 100));
  const isPasswordSecure = passwordLength >= 12;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setInfoMessage('');
    setBusy(true);

    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
        setSuccessText(t('auth.loginTitle'));
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setPassword('');
        }, 650);
      } else if (mode === 'admin-mfa') {
        if (!adminChallenge || !/^\d{6}$/.test(otp)) {
          setError(t('auth.adminMfaInvalidCode'));
          return;
        }
        await completeAdminMfa(adminChallenge.challengeId, otp);
        setOtp('');
      } else if (mode === 'register') {
        if (!isPasswordSecure) {
          setError(t('auth.passwordHint'));
          setBusy(false);
          return;
        }
        await signUp(name.trim(), email.trim(), password);
        setSuccessText(t('auth.registerTitle'));
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setPassword('');
        }, 650);
      } else if (mode === 'forgot') {
        if (forgotStep === 'email') {
          // Étape 1 : Demande de code OTP par email
          const res = await authService.forgotPassword(email.trim());
          if (res.devOtp) {
            setOtp(res.devOtp);
            setInfoMessage(`${res.message} [Code démo : ${res.devOtp}]`);
          } else {
            setInfoMessage(res.message || t('auth.codeSentSuccess'));
          }
          setForgotStep('verify');
        } else if (forgotStep === 'verify') {
          // Étape 2 : Vérification du code OTP
          if (!otp.trim() || otp.trim().length !== 6) {
            setError(t('auth.otpLabel'));
            setBusy(false);
            return;
          }
          const res = await authService.verifyResetOtp({
            email: email.trim(),
            otp: otp.trim(),
          });
          setInfoMessage(res.message);
          setForgotStep('reset');
        } else if (forgotStep === 'reset') {
          // Étape 3 : Saisie et enregistrement du nouveau mot de passe
          if (!isPasswordSecure) {
            setError(t('auth.passwordHint'));
            setBusy(false);
            return;
          }
          if (newPassword !== confirmPassword) {
            setError(t('auth.passwordMismatch'));
            setBusy(false);
            return;
          }
          const res = await authService.resetPassword({
            email: email.trim(),
            otp: otp.trim(),
            newPassword: newPassword,
          });
          setSuccessText(res.message || t('auth.passwordResetSuccess'));
          setIsSuccess(true);
          setTimeout(() => {
            setIsSuccess(false);
            setMode('login');
            setForgotStep('email');
            setPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setOtp('');
            setInfoMessage(t('auth.passwordResetSuccess'));
          }, 850);
        }
      }
    } catch (cause) {
      if (cause instanceof AdminMfaRequiredError) {
        setAdminChallenge(cause.challenge);
        setOtp('');
        setMode('admin-mfa');
        setError('');
      } else {
        setError(cause instanceof Error ? cause.message : t('auth.genericError'));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email.trim()) return;
    setError('');
    setBusy(true);
    try {
      const res = await authService.forgotPassword(email.trim());
      if (res.devOtp) {
        setOtp(res.devOtp);
        setInfoMessage(`${res.message} [Code démo : ${res.devOtp}]`);
      } else {
        setInfoMessage(res.message || t('auth.codeSentSuccess'));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('auth.genericError'));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleClick = () => {
    setError('');
    setInfoMessage(t('auth.forgotPasswordAlert'));
  };

  return (
    <div
      className="auth-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeAuth();
      }}
    >
      <section
        ref={dialogRef}
        className="auth-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Écran de Succès Festif et Instantané */}
        {isSuccess && (
          <div className="auth-success-overlay" role="status">
            <div className="auth-success-badge">
              <CheckCircle2 size={40} className="auth-success-check" />
            </div>
            <h3>{successText}</h3>
            <p>Tfarhida · تفرهيدة</p>
          </div>
        )}

        {/* Bouton de Fermeture accessible */}
        <button
          className="auth-close"
          type="button"
          onClick={closeAuth}
          aria-label={t('auth.close')}
          title={t('auth.close')}
        >
          <X size={18} />
        </button>

        {/* 1. En-tête avec le VRAI Logo Officiel Tfarhida */}
        <div className="auth-header">
          <div className="auth-logo-badge">
            <img src="/Logo.png" alt="Tfarhida Logo" className="auth-real-logo" />
          </div>
          <p className="auth-eyebrow">Tfarhida · تفرهيدة</p>
          <h2 id="auth-title">
            {mode === 'admin-mfa'
              ? t('auth.adminMfaTitle')
              : mode === 'login'
              ? t('auth.loginTitle')
              : mode === 'register'
              ? t('auth.registerTitle')
              : forgotStep === 'email'
              ? t('auth.forgotTitle')
              : forgotStep === 'verify'
              ? t('auth.verifyTitle')
              : t('auth.resetTitle')}
          </h2>
          <p className="auth-subtitle">
            {mode === 'admin-mfa'
              ? t('auth.adminMfaSubtitle')
              : mode === 'login'
              ? t('auth.loginSubtitle')
              : mode === 'register'
              ? t('auth.registerSubtitle')
              : forgotStep === 'email'
              ? t('auth.forgotSubtitle')
              : forgotStep === 'verify'
              ? t('auth.verifySubtitle')
              : t('auth.resetSubtitle')}
          </p>
        </div>

        {/* 2. Onglets Segmentés (uniquement sur login / register) */}
        {mode !== 'forgot' && mode !== 'admin-mfa' && (
          <div className="auth-tabs" role="tablist" aria-label={t('auth.switchMode')}>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => {
                setMode('login');
                setError('');
                setInfoMessage('');
              }}
            >
              {t('auth.login')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              onClick={() => {
                setMode('register');
                setError('');
                setInfoMessage('');
              }}
            >
              {t('auth.register')}
            </button>
          </div>
        )}

        {/* 3. Bouton Social 1-Clic Google (uniquement sur login / register) */}
        {mode !== 'forgot' && mode !== 'admin-mfa' && (
          <>
            <button
              type="button"
              className="auth-social-btn"
              onClick={handleGoogleClick}
              aria-label={t('auth.continueWithGoogle')}
            >
              <svg className="auth-google-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{t('auth.continueWithGoogle')}</span>
            </button>

            {/* Séparateur élégant */}
            <div className="auth-divider">
              <span>{t('auth.orDivider')}</span>
            </div>
          </>
        )}

        {/* 4. Formulaire Principal */}
        <form onSubmit={submit} className="auth-form" noValidate>
          {/* Mode Inscription : Champ Nom */}
          {mode === 'register' && (
            <div className="auth-field auth-field-animated">
              <label htmlFor="auth-name" className="auth-label">
                {t('auth.name')}
              </label>
              <div className="auth-input-box">
                <User size={17} className="auth-input-icon" />
                <input
                  id="auth-name"
                  type="text"
                  autoComplete="name"
                  required
                  minLength={2}
                  value={name}
                  placeholder={t('auth.namePlaceholder')}
                  onChange={(event) => setName(event.target.value)}
                  className="auth-input"
                />
              </div>
            </div>
          )}

          {/* Champ Email (Connexion, Inscription ou Étape 1 de Mot de Passe Oublié) */}
          {(mode !== 'forgot' || forgotStep === 'email') && (
            <div className="auth-field">
              <label htmlFor="auth-email" className="auth-label">
                {t('auth.email')}
              </label>
              <div className="auth-input-box">
                <Mail size={17} className="auth-input-icon" />
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  placeholder={t('auth.emailPlaceholder')}
                  onChange={(event) => setEmail(event.target.value)}
                  className="auth-input"
                />
              </div>
            </div>
          )}

          {/* Mode Connexion : Champ Mot de Passe avec lien "Mot de passe oublié ?" */}
          {mode === 'login' && (
            <div className="auth-field">
              <div className="auth-label-row">
                <label htmlFor="auth-password" className="auth-label">
                  {t('auth.password')}
                </label>
                <button
                  type="button"
                  className="auth-forgot-link"
                  onClick={() => {
                    setMode('forgot');
                    setForgotStep('email');
                    setError('');
                    setInfoMessage('');
                  }}
                >
                  {t('auth.forgotPassword')}
                </button>
              </div>

              <div className="auth-input-box">
                <Lock size={17} className="auth-input-icon" />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  placeholder={t('auth.passwordPlaceholder')}
                  onChange={(event) => setPassword(event.target.value)}
                  className="auth-input auth-input-password"
                />
                <button
                  type="button"
                  className="auth-toggle-pwd"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  title={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
          )}

          {mode === 'admin-mfa' && (
            <div className="auth-field auth-field-animated">
              {adminChallenge?.maskedEmail && <p className="auth-subtitle">{adminChallenge.maskedEmail}</p>}
              <label htmlFor="admin-mfa-otp" className="auth-label">{t('auth.adminMfaCode')}</label>
              <div className="auth-input-box">
                <KeyRound size={17} className="auth-input-icon" aria-hidden="true" />
                <input
                  id="admin-mfa-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  className="auth-input"
                  aria-describedby="admin-mfa-help"
                />
              </div>
              <p id="admin-mfa-help">{t('auth.adminMfaHelp')}</p>
              <button type="button" className="auth-link-btn" onClick={() => { setMode('login'); setAdminChallenge(null); setOtp(''); setError(''); }}>
                {t('auth.adminMfaBack')}
              </button>
            </div>
          )}

          {/* Mode Inscription : Champ Mot de Passe avec Jauge */}
          {mode === 'register' && (
            <div className="auth-field">
              <label htmlFor="auth-reg-password" className="auth-label">
                {t('auth.password')}
              </label>
              <div className="auth-input-box">
                <Lock size={17} className="auth-input-icon" />
                <input
                  id="auth-reg-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={12}
                  value={password}
                  placeholder={t('auth.passwordPlaceholder')}
                  onChange={(event) => setPassword(event.target.value)}
                  className="auth-input auth-input-password"
                />
                <button
                  type="button"
                  className="auth-toggle-pwd"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  title={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {passwordLength > 0 && (
                <div className="auth-password-strength">
                  <div className="auth-strength-track">
                    <div
                      className={`auth-strength-bar ${
                        isPasswordSecure ? 'secure' : passwordLength >= 8 ? 'medium' : 'weak'
                      }`}
                      style={{ width: `${passwordProgress}%` }}
                    />
                  </div>
                  <span className="auth-strength-text">
                    {isPasswordSecure ? t('auth.passwordSecure') : `${passwordLength}/12 — ${t('auth.passwordHint')}`}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Mode Mot de Passe Oublié : Étape 2 (Saisie du Code OTP uniquement) */}
          {mode === 'forgot' && forgotStep === 'verify' && (
            <div className="auth-field-animated" style={{ display: 'grid', gap: '1rem' }}>
              <div className="auth-email-target-box">
                <div className="auth-email-target-row">
                  <Mail size={15} color="var(--color-primary)" />
                  <span className="auth-email-target-text">{email}</span>
                </div>
                <button
                  type="button"
                  className="auth-link-btn"
                  onClick={() => {
                    setForgotStep('email');
                    setError('');
                  }}
                >
                  Modifier
                </button>
              </div>

              <div className="auth-field">
                <label htmlFor="auth-otp" className="auth-label">
                  {t('auth.otpLabel')}
                </label>
                <div className="auth-input-box">
                  <KeyRound size={17} className="auth-input-icon" />
                  <input
                    id="auth-otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    value={otp}
                    placeholder={t('auth.otpPlaceholder')}
                    onChange={(event) => setOtp(event.target.value.replace(/[^0-9]/g, ''))}
                    className="auth-input"
                    style={{ letterSpacing: '6px', fontWeight: '800', textAlign: 'center' }}
                  />
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '-0.25rem' }}>
                <button
                  type="button"
                  className="auth-link-btn"
                  onClick={handleResendOtp}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
                >
                  <RotateCcw size={13} />
                  <span>{t('auth.resendOtpBtn')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Mode Mot de Passe Oublié : Étape 3 (Saisie du Nouveau Mot de Passe + Confirmation) */}
          {mode === 'forgot' && forgotStep === 'reset' && (
            <div className="auth-field-animated" style={{ display: 'grid', gap: '1rem' }}>
              <div className="auth-field">
                <label htmlFor="auth-new-password" className="auth-label">
                  {t('auth.newPasswordLabel')}
                </label>
                <div className="auth-input-box">
                  <Lock size={17} className="auth-input-icon" />
                  <input
                    id="auth-new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={12}
                    value={newPassword}
                    placeholder={t('auth.passwordPlaceholder')}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="auth-input auth-input-password"
                  />
                  <button
                    type="button"
                    className="auth-toggle-pwd"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    title={showNewPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  >
                    {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                {passwordLength > 0 && (
                  <div className="auth-password-strength">
                    <div className="auth-strength-track">
                      <div
                        className={`auth-strength-bar ${
                          isPasswordSecure ? 'secure' : passwordLength >= 8 ? 'medium' : 'weak'
                        }`}
                        style={{ width: `${passwordProgress}%` }}
                      />
                    </div>
                    <span className="auth-strength-text">
                      {isPasswordSecure ? t('auth.passwordSecure') : `${passwordLength}/12 — ${t('auth.passwordHint')}`}
                    </span>
                  </div>
                )}
              </div>

              <div className="auth-field">
                <label htmlFor="auth-confirm-password" className="auth-label">
                  {t('auth.confirmPasswordLabel')}
                </label>
                <div className="auth-input-box">
                  <Lock size={17} className="auth-input-icon" />
                  <input
                    id="auth-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={12}
                    value={confirmPassword}
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="auth-input auth-input-password"
                  />
                  <button
                    type="button"
                    className="auth-toggle-pwd"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    title={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  >
                    {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Encart de Réassurance (Inscription) */}
          {mode === 'register' && (
            <div className="auth-benefits-box auth-field-animated">
              <div className="auth-benefit-item">
                <CheckCircle2 size={14} className="auth-benefit-check" />
                <span>{t('auth.benefit1')}</span>
              </div>
              <div className="auth-benefit-item">
                <CheckCircle2 size={14} className="auth-benefit-check" />
                <span>{t('auth.benefit2')}</span>
              </div>
              <div className="auth-benefit-item">
                <CheckCircle2 size={14} className="auth-benefit-check" />
                <span>{t('auth.benefit3')}</span>
              </div>
            </div>
          )}

          {/* Notification d'Information */}
          {infoMessage && (
            <div className="auth-info-box" role="status">
              <AlertCircle size={16} />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Message d'Erreur Visuel et Accessible */}
          {error && (
            <div className="auth-error-box" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Bouton de Soumission Principal */}
          <button className="auth-submit-btn" type="submit" disabled={busy}>
            {busy ? (
              <span className="auth-btn-loading">
                <Loader2 size={18} className="auth-spin" />
                <span>{t('auth.working')}</span>
              </span>
            ) : (
              <span className="auth-btn-content">
                <span>
                  {mode === 'admin-mfa'
                    ? t('auth.adminMfaVerify')
                    : mode === 'login'
                    ? t('auth.login')
                    : mode === 'register'
                    ? t('auth.createAccount')
                    : forgotStep === 'email'
                    ? t('auth.sendOtpBtn')
                    : forgotStep === 'verify'
                    ? t('auth.verifyOtpBtn')
                    : t('auth.resetPasswordBtn')}
                </span>
                {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
              </span>
            )}
          </button>
        </form>

        {/* 5. Pied de Modal Alterné & Assistance */}
        <div className="auth-footer">
          {mode === 'admin-mfa' ? null : mode === 'login' ? (
            <p className="auth-footer-text">
              {t('auth.noAccount')}{' '}
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => {
                  setMode('register');
                  setError('');
                  setInfoMessage('');
                }}
              >
                {t('auth.createFreeAccount')}
              </button>
            </p>
          ) : mode === 'register' ? (
            <p className="auth-footer-text">
              {t('auth.haveAccount')}{' '}
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setInfoMessage('');
                }}
              >
                {t('auth.signInLink')}
              </button>
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '0.6rem', textAlign: 'center' }}>
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => {
                  setMode('login');
                  setForgotStep('email');
                  setError('');
                  setInfoMessage('');
                }}
              >
                ← {t('auth.backToLogin')}
              </button>
              <a
                href="https://wa.me/21620000000?text=Bonjour%20Tfarhida,%20j'ai%20besoin%20d'aide%20pour%20mon%20compte"
                target="_blank"
                rel="noopener noreferrer"
                className="auth-whatsapp-link"
              >
                <MessageCircle size={15} />
                <span>{t('auth.whatsappHelp')}</span>
              </a>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
