import React, { useState } from 'react';
import { Building2, CheckCircle2, Send } from 'lucide-react';
import confetti from 'canvas-confetti';

export const PartnerCtaSection: React.FC = () => {
  const [establishmentName, setEstablishmentName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!establishmentName || !phone) return;

    confetti({
      particleCount: 80,
      spread: 80,
      origin: { y: 0.8 },
      colors: ['#155EEF', '#E63946', '#10B981'],
    });

    setSubmitted(true);
  };

  return (
    <section
      id="partenaires"
      style={{
        padding: '90px 0',
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid var(--border-subtle)',
      }}
    >
      <div className="container">
        <div
          style={{
            background: 'linear-gradient(135deg, #102A56 0%, #1E1B4B 100%)',
            borderRadius: 'var(--radius-xl)',
            padding: 'clamp(36px, 6vw, 64px)',
            color: '#FFFFFF',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          {/* Décoration d'arrière-plan */}
          <div
            style={{
              position: 'absolute',
              top: '-100px',
              right: '-100px',
              width: '350px',
              height: '350px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(21, 94, 239, 0.4) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '48px',
              alignItems: 'center',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Colonne Gauche : Pitch Partenaire */}
            <div>
              <div style={{ marginBottom: '16px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(21, 94, 239, 0.25)',
                    border: '1px solid rgba(21, 94, 239, 0.4)',
                    color: '#93C5FD',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                  }}
                >
                  <Building2 size={15} />
                  Espace Professionnel & Gérants
                </span>
              </div>

              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                  color: '#FFFFFF',
                  lineHeight: 1.15,
                  marginBottom: '20px',
                }}
              >
                Boostez la fréquentation de votre établissement.
              </h2>

              <p
                style={{
                  fontSize: '1.05rem',
                  color: '#CBD5E1',
                  lineHeight: 1.6,
                  marginBottom: '28px',
                }}
              >
                Vous gérez un bowling, café, escape room, restaurant ou club nautique en Tunisie ? Référencez votre activité, recevez des réservations directes sur WhatsApp et gagnez en visibilité dès aujourd'hui.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={18} color="#34D399" />
                  <span style={{ fontSize: '0.95rem', color: '#E2E8F0' }}>Inscription gratuite durant la phase de lancement</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={18} color="#34D399" />
                  <span style={{ fontSize: '0.95rem', color: '#E2E8F0' }}>Contact direct clients sans intermédiaire ni commission</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={18} color="#34D399" />
                  <span style={{ fontSize: '0.95rem', color: '#E2E8F0' }}>Tableau de bord Pro avec statistiques de clics en temps réel</span>
                </div>
              </div>
            </div>

            {/* Colonne Droite : Formulaire d'intérêt rapide */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(16px)',
                padding: '32px',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              {submitted ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      color: '#34D399',
                    }}
                  >
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 style={{ color: '#FFFFFF', fontSize: '1.35rem', marginBottom: '8px' }}>
                    Demande transmise avec succès !
                  </h3>
                  <p style={{ color: '#94A3B8', fontSize: '0.95rem' }}>
                    Notre équipe locale à Sfax vous contactera sous 24h ouvrées pour valider et activer votre profil Partenaire Pro.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <h3 style={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 700 }}>
                    Rejoindre le réseau Win Pro
                  </h3>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#CBD5E1', marginBottom: '6px' }}>
                      Nom de l'établissement / Activité
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Bowling Mall of Sfax, Café Diwan..."
                      value={establishmentName}
                      onChange={(e) => setEstablishmentName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#FFFFFF',
                        fontSize: '0.95rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#CBD5E1', marginBottom: '6px' }}>
                      Numéro de téléphone / WhatsApp professionnel
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+216 20 000 000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#FFFFFF',
                        fontSize: '0.95rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '13px',
                      fontSize: '1rem',
                      fontWeight: 700,
                      marginTop: '6px',
                    }}
                  >
                    <Send size={18} />
                    <span>Créer mon profil partenaire</span>
                  </button>

                  <p style={{ fontSize: '0.75rem', color: '#94A3B8', textAlign: 'center' }}>
                    Aucune carte bancaire requise · Activation vérifiée par notre équipe
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
