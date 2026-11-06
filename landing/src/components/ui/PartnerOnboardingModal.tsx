import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Building,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  Clock,
  RefreshCw,
  Check,
  Store,
  Crown,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sendPartnerOtp, verifyPartnerOtp } from '../../services/partnerAuthService';

interface PartnerOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlan?: 'standard' | 'pro' | 'premium';
  onCompleted?: (partnerData: any) => void;
}

export const PartnerOnboardingModal: React.FC<PartnerOnboardingModalProps> = ({
  isOpen,
  onClose,
  initialPlan = 'pro',
  onCompleted,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [plan, setPlan] = useState<'standard' | 'pro' | 'premium'>(initialPlan);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [partnerId, setPartnerId] = useState<string>('');
  const [demoCode, setDemoCode] = useState<string>('123456');

  const [formData, setFormData] = useState({
    managerName: '',
    email: '',
    password: '',
    establishmentName: '',
    whatsapp: '',
    city: 'Sfax',
    category: 'cafe',
  });

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState<number>(60);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Synchroniser le plan initial à l'ouverture
  useEffect(() => {
    if (initialPlan) setPlan(initialPlan);
  }, [initialPlan]);

  // Compte à rebours pour l'OTP 2FA
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === 2 && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, otpTimer]);

  // Verrouillage du scroll arrière-plan et touche Échap
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Gestion des saisies du formulaire
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMsg('');
  };

  // Étape 1 : Validation formulaire & Appel API réel (Envoi OTP)
  const handleSubmitStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.establishmentName.trim()) {
      setErrorMsg('Veuillez renseigner le nom de votre établissement.');
      return;
    }
    if (!formData.managerName.trim()) {
      setErrorMsg('Veuillez renseigner le nom du gérant.');
      return;
    }
    if (!formData.whatsapp.trim()) {
      setErrorMsg('Veuillez renseigner un numéro WhatsApp valide pour les réservations directes.');
      return;
    }
    if (!formData.email.includes('@')) {
      setErrorMsg('Veuillez renseigner un email professionnel valide.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setErrorMsg('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await sendPartnerOtp({
        managerName: formData.managerName,
        email: formData.email,
        password: formData.password,
        establishmentName: formData.establishmentName,
        whatsapp: formData.whatsapp,
        city: formData.city,
        category: formData.category,
        plan,
        billingCycle,
      });

      if (res.demoCode) {
        setDemoCode(res.demoCode);
      }

      setStep(2);
      setOtpTimer(60);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'envoi du code de vérification.");
    } finally {
      setIsLoading(false);
    }
  };

  // Étape 2 : Gestion de la saisie OTP
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const digits = pastedData.split('');
    const newOtp = [...otp];
    digits.forEach((digit, idx) => {
      if (idx < 6) newOtp[idx] = digit;
    });
    setOtp(newOtp);
    const nextIndex = Math.min(digits.length, 5);
    otpInputsRef.current[nextIndex]?.focus();
  };

  // Remplissage rapide 1-clic pour tester sans friction
  const handleAutoFillOtp = () => {
    const digits = demoCode.split('').slice(0, 6);
    setOtp(digits);
    setErrorMsg('');
    setTimeout(() => {
      otpInputsRef.current[5]?.focus();
    }, 50);
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      setErrorMsg('Veuillez saisir les 6 chiffres du code de confirmation.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await verifyPartnerOtp({
        email: formData.email,
        otp: code,
      });

      if (res.user?.id) {
        setPartnerId(res.user.id);
      }

      setStep(3);
    } catch (err: any) {
      setErrorMsg(err.message || "Code incorrect ou expiré.");
    } finally {
      setIsLoading(false);
    }
  };

  // Étape 3 -> Étape 4 : Finalisation du workflow
  const handleCompleteWorkflow = () => {
    const generatedId = `TF-${Math.floor(10000 + Math.random() * 90000)}`;
    setPartnerId(generatedId);

    const partnerSession = {
      id: generatedId,
      establishmentName: formData.establishmentName,
      managerName: formData.managerName,
      email: formData.email,
      whatsapp: formData.whatsapp.replace(/[^0-9+]/g, ''),
      city: formData.city,
      category: formData.category,
      plan,
      status: 'active_verified',
      registeredAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem('tfarhida_partner_session', JSON.stringify(partnerSession));
    } catch (e) {
      console.warn('LocalStorage non disponible', e);
    }

    if (onCompleted) {
      onCompleted(partnerSession);
    }

    confetti({
      particleCount: 110,
      spread: 85,
      origin: { y: 0.55 },
      colors: ['#00D2FF', '#2563EB', '#7C3AED', '#10B981', '#F59E0B'],
    });

    setStep(4);
  };

  // Lien WhatsApp d'accélération
  const adminWhatsAppUrl = `https://wa.me/21650000000?text=${encodeURIComponent(
    `Bonjour l'équipe Tfarhida, je viens d'enregistrer l'établissement "${formData.establishmentName}" à ${formData.city} (Formule ${plan.toUpperCase()}). Pouvez-vous valider ma fiche ? Merci !`
  )}`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 10, 28, 0.8)',
        backdropFilter: 'blur(12px)',
        zIndex: 2500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      {/* ── Conteneur Modal Apple Sheet (Scrollbar 100% Invisible) ────── */}
      <div
        className="modal-no-scrollbar"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '28px',
          maxWidth: '580px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 60px -15px rgba(2, 132, 199, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
          border: '1.5px solid var(--border-strong)',
          position: 'relative',
          padding: 'clamp(24px, 3.5vw, 32px)',
          animation: 'fadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton de Fermeture Épuré */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-main)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <X size={16} />
        </button>

        {/* ── Stepper Apple : 4 Puces Numérotées avec Connecteur Fin ───── */}
        <div style={{ marginBottom: '22px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
              maxWidth: '460px',
              margin: '0 auto',
            }}
          >
            {/* Ligne de fond fine */}
            <div
              style={{
                position: 'absolute',
                top: '13px',
                left: '20px',
                right: '20px',
                height: '2px',
                backgroundColor: 'var(--border-subtle)',
                zIndex: 0,
              }}
            />
            {/* Ligne active en dégradé */}
            <div
              style={{
                position: 'absolute',
                top: '13px',
                left: '20px',
                width: `${((step - 1) / 3) * 88}%`,
                height: '2px',
                background: 'linear-gradient(135deg, #00D2FF 0%, #2563EB 50%, #7C3AED 100%)',
                zIndex: 1,
                transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />

            {[
              { num: 1, label: 'Compte' },
              { num: 2, label: 'Code 2FA' },
              { num: 3, label: 'Validation' },
              { num: 4, label: 'Prêt' },
            ].map(({ num, label }) => {
              const isActive = step === num;
              const isDone = step > num;
              return (
                <div
                  key={num}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: isDone
                        ? '#059669'
                        : isActive
                        ? 'var(--color-primary)'
                        : 'var(--bg-card)',
                      border: isActive
                        ? '2px solid var(--color-primary)'
                        : isDone
                        ? '2px solid #059669'
                        : '2px solid var(--border-strong)',
                      color: isDone || isActive ? '#FFFFFF' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      boxShadow: isActive ? '0 0 10px rgba(2, 132, 199, 0.4)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {isDone ? <Check size={13} color="#FFFFFF" /> : num}
                  </div>
                  <span
                    style={{
                      fontSize: '0.725rem',
                      fontWeight: isActive || isDone ? 800 : 600,
                      color: isDone ? '#059669' : isActive ? 'var(--color-navy)' : 'var(--text-muted)',
                    }}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Message d'Erreur si besoin */}
        {errorMsg && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#DC2626',
              fontSize: '0.825rem',
              fontWeight: 700,
              marginBottom: '14px',
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            ÉTAPE 1 : FORMULAIRE EN BLOCS GROUPÉS STYLE RÉGLAGES IOS
           ══════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.35rem',
                  fontWeight: 900,
                  color: 'var(--color-navy)',
                  letterSpacing: '-0.025em',
                  marginBottom: '3px',
                }}
              >
                Créer votre Espace Partenaire
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Remplissez vos tables sans intermédiaire et développez votre clientèle locale.
              </p>
            </div>

            {/* Sélecteur de Forfait 3 Cartes Épurées Apple */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { key: 'standard', name: 'Standard', price: '0 DT', icon: Store, tag: 'Gratuit' },
                  { key: 'pro', name: 'Pro', price: billingCycle === 'yearly' ? '31 DT' : '39 DT', icon: ShieldCheck, tag: 'Recommandé' },
                  { key: 'premium', name: 'VIP', price: billingCycle === 'yearly' ? '71 DT' : '89 DT', icon: Crown, tag: 'Événements' },
                ].map((tier) => {
                  const isSel = plan === tier.key;
                  const IconComponent = tier.icon;
                  return (
                    <button
                      key={tier.key}
                      type="button"
                      onClick={() => setPlan(tier.key as any)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '14px',
                        border: isSel ? '2px solid var(--color-primary)' : '1px solid var(--border-strong)',
                        backgroundColor: isSel ? 'var(--color-pale-blue)' : 'var(--bg-main)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '3px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSel ? '0 4px 12px rgba(2, 132, 199, 0.15)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <IconComponent size={14} color={isSel ? 'var(--color-primary)' : 'var(--text-muted)'} />
                        <span style={{ fontSize: '0.825rem', fontWeight: 800, color: isSel ? 'var(--color-primary)' : 'var(--color-navy)' }}>
                          {tier.name}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 900, color: isSel ? 'var(--color-primary)' : 'var(--text-secondary)' }}>
                        {tier.price}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Toggle Cycle de facturation Mensuel / Annuel */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  style={{
                    padding: '4px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: billingCycle === 'monthly' ? 'var(--color-primary)' : 'var(--border-subtle)',
                    backgroundColor: billingCycle === 'monthly' ? 'var(--color-primary)' : 'transparent',
                    color: billingCycle === 'monthly' ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  Mensuel
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  style={{
                    padding: '4px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: billingCycle === 'yearly' ? 'var(--color-primary)' : 'var(--border-subtle)',
                    backgroundColor: billingCycle === 'yearly' ? 'var(--color-primary)' : 'transparent',
                    color: billingCycle === 'yearly' ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  Annuel (-20%)
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitStep1} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* ── Bloc Groupé 1 : Votre Établissement (Style iOS) ─────── */}
              <div
                style={{
                  backgroundColor: 'var(--bg-main)',
                  borderRadius: '16px',
                  border: '1px solid var(--border-subtle)',
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Building size={14} color="var(--color-primary)" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.06em', color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                    1. Votre Établissement
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Nom de l'établissement (ex: Bowling Mall of Sfax)"
                      value={formData.establishmentName}
                      onChange={(e) => handleInputChange('establishmentName', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-strong)',
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <select
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 10px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-strong)',
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                      }}
                    >
                      <option value="Sfax">Sfax (Pilote)</option>
                      <option value="Tunis">Grand Tunis</option>
                      <option value="Sousse">Sousse</option>
                      <option value="Djerba">Djerba</option>
                    </select>

                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 10px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-strong)',
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                      }}
                    >
                      <option value="cafe">Café & Salon de thé</option>
                      <option value="fun">Loisirs (Bowling, Karting)</option>
                      <option value="food">Restaurant & Lounge</option>
                      <option value="outdoor">Plein air & Sorties Mer</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ── Bloc Groupé 2 : Contact Direct WhatsApp ─────────────── */}
              <div
                style={{
                  backgroundColor: 'var(--bg-main)',
                  borderRadius: '16px',
                  border: '1px solid var(--border-subtle)',
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Phone size={14} color="#059669" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.06em', color: '#059669', textTransform: 'uppercase' }}>
                    2. Contact & Réservations WhatsApp
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    required
                    placeholder="Nom du Gérant"
                    value={formData.managerName}
                    onChange={(e) => handleInputChange('managerName', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-strong)',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                    }}
                  />

                  <input
                    type="tel"
                    required
                    placeholder="WhatsApp : +216 20 000 000"
                    value={formData.whatsapp}
                    onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-strong)',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                    }}
                  />
                </div>
              </div>

              {/* ── Bloc Groupé 3 : Sécurité & Connexion ───────────────── */}
              <div
                style={{
                  backgroundColor: 'var(--bg-main)',
                  borderRadius: '16px',
                  border: '1px solid var(--border-subtle)',
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Lock size={14} color="var(--color-navy)" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.06em', color: 'var(--color-navy)', textTransform: 'uppercase' }}>
                    3. Identifiants de Connexion
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="email"
                    required
                    placeholder="Email professionnel"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-strong)',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                    }}
                  />

                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Mot de passe (min. 6 car.)"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 34px 9px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-strong)',
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '8px',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        border: 'none',
                        background: 'none',
                      }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Bouton de Soumission */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  marginTop: '6px',
                  padding: '14px 20px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 800,
                  fontSize: '0.925rem',
                  boxShadow: '0 8px 20px -4px rgba(2, 132, 199, 0.4)',
                  opacity: isLoading ? 0.7 : 1,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                }}
              >
                <span>{isLoading ? 'Envoi en cours...' : 'Continuer vers le code 2FA'}</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            ÉTAPE 2 : DOUBLE AUTHENTIFICATION EMAIL (2FA OTP)
           ══════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '18px',
                backgroundColor: 'rgba(2, 132, 199, 0.12)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
              }}
            >
              <Mail size={26} />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--color-navy)', letterSpacing: '-0.02em', marginBottom: '6px' }}>
              Vérification Email (Code 2FA)
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 14px', lineHeight: 1.55 }}>
              Nous avons envoyé un code de sécurité à 6 chiffres à :<br />
              <strong style={{ color: 'var(--color-primary)' }}>{formData.email}</strong>
            </p>

            {/* Bouton d'auto-remplissage rapide en 1 clic */}
            <button
              type="button"
              onClick={handleAutoFillOtp}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                backgroundColor: 'rgba(2, 132, 199, 0.08)',
                border: '1px dashed var(--color-primary)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                color: 'var(--color-primary)',
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: '12px',
              }}
            >
              <span>Code démo reçu : <strong>{demoCode}</strong> (Cliquer pour remplir)</span>
            </button>

            {/* Saisie OTP 6 chiffres */}
            <div className="otp-container" onPaste={handleOtpPaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputsRef.current[idx] = el;
                  }}
                  type="text"
                  maxLength={1}
                  className="otp-box"
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            {/* Minuteur & Renvoi */}
            <div style={{ marginTop: '12px', marginBottom: '24px', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              {otpTimer > 0 ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} />
                  <span>Renvoyer un nouveau code dans <strong>{otpTimer}s</strong></span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setOtpTimer(60)}
                  style={{
                    color: 'var(--color-primary)',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <RefreshCw size={14} />
                  <span>Renvoyer un code par email</span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '13px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}
              >
                <ArrowLeft size={16} />
                <span>Modifier</span>
              </button>

              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={isLoading}
                className="btn btn-primary"
                style={{
                  flex: 2,
                  padding: '13px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 800,
                  opacity: isLoading ? 0.7 : 1,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                }}
              >
                <span>{isLoading ? 'Vérification...' : 'Vérifier et continuer'}</span>
                <CheckCircle2 size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            ÉTAPE 3 : APPROBATION ADMINISTRATIVE & WHATSAPP
           ══════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '18px',
                backgroundColor: 'rgba(245, 158, 11, 0.14)',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
              }}
            >
              <ShieldCheck size={28} />
            </div>

            <span
              style={{
                fontSize: '0.725rem',
                fontWeight: 900,
                letterSpacing: '0.06em',
                padding: '4px 14px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: '#B45309',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'inline-block',
                marginBottom: '10px',
              }}
            >
              DOSSIER VÉRIFIÉ · ACTIVATION EN COURS
            </span>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--color-navy)', letterSpacing: '-0.02em', marginBottom: '8px' }}>
              Validation de l'établissement
            </h3>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '460px', margin: '0 auto 18px' }}>
              Email et coordonnées certifiés pour <strong>« {formData.establishmentName} »</strong>. Votre fiche est prête pour publication immédiate.
            </p>

            {/* Encart d'Assistance Directe WhatsApp */}
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1.5px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '18px',
                padding: '16px 18px',
                marginBottom: '22px',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <MessageCircle size={18} color="#059669" />
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#065F46' }}>
                  Validation prioritaire en 5 minutes
                </h4>
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>
                Envoyez un message direct à l'administration Tfarhida sur WhatsApp pour confirmer l'ouverture et activer vos créneaux.
              </p>

              <a
                href={adminWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '10px 16px',
                  backgroundColor: '#059669',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                }}
              >
                <MessageCircle size={16} />
                <span>Confirmer via WhatsApp Admin</span>
              </a>
            </div>

            <button
              type="button"
              onClick={handleCompleteWorkflow}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px 22px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 800,
                fontSize: '0.95rem',
              }}
            >
              <span>Finaliser & Activer mon Espace</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            ÉTAPE 4 : CONFIRMATION & ESPACE PRÊT (Succès Complet)
           ══════════════════════════════════════════════════════════════ */}
        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '20px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)',
              }}
            >
              <CheckCircle2 size={34} />
            </div>

            <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--color-navy)', letterSpacing: '-0.02em', marginBottom: '6px' }}>
              Félicitations, vous êtes Partenaire !
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Votre compte professionnel a été créé avec succès sur le réseau Tfarhida.
            </p>

            {/* Récapitulatif Badge Haute Précision */}
            <div
              style={{
                backgroundColor: 'var(--bg-main)',
                borderRadius: '18px',
                padding: '16px 18px',
                textAlign: 'left',
                border: '1px solid var(--border-subtle)',
                marginBottom: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '9px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Identifiant Partenaire :</span>
                <strong style={{ color: 'var(--color-primary)', fontFamily: 'monospace', fontWeight: 900 }}>
                  {partnerId || 'TF-84920'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Établissement :</span>
                <strong style={{ color: 'var(--color-navy)' }}>{formData.establishmentName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Ville active :</span>
                <strong style={{ color: 'var(--color-navy)' }}>{formData.city} (Tunisie)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Formule souscrite :</span>
                <strong style={{ color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                  Pack {plan}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Commission prélevée :</span>
                <strong style={{ color: '#059669' }}>0% à vie</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px 22px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 800,
                fontSize: '0.95rem',
              }}
            >
              <span>Terminer & Accéder à mon Espace</span>
              <Sparkles size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
