import React from 'react';
import { MessageSquareText, Zap, ShieldCheck, Sparkles, Navigation, Users } from 'lucide-react';

export const BentoPillars: React.FC = () => {
  return (
    <section id="piliers" style={{ padding: '90px 0', backgroundColor: 'var(--bg-main)' }}>
      <div className="container">
        {/* Titre de section */}
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 52px' }}>
          <span className="badge badge-primary" style={{ marginBottom: '12px' }}>
            Pourquoi choisir Tfarhida (تفرهيدة) ?
          </span>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
              letterSpacing: '-0.02em',
              marginBottom: '16px',
            }}
          >
            Conçu sur-mesure pour les réalités de la Tunisie
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)' }}>
            L'assistant intelligent qui répond à la question culte : « شنوّة نعمل توّا؟ », vous évite les mauvaises surprises et vous connecte en direct aux gérants.
          </p>
        </div>

        {/* Grille Bento */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '24px',
          }}
        >
          {/* Carte 1 : Contact Direct & WhatsApp (Grand Format - 7 colonnes) */}
          <div
            style={{
              gridColumn: 'span 7',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              padding: '36px',
              border: '1.5px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '14px',
                  backgroundColor: 'var(--color-pale-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary)',
                  marginBottom: '20px',
                }}
              >
                <MessageSquareText size={26} />
              </div>
              <h3 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '12px', color: 'var(--color-navy)' }}>
                Réservation directe sans intermédiaire ni commission
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.975rem', lineHeight: 1.6, maxWidth: '480px' }}>
                Pas de paiement en ligne contraignant ni de commissions prélevées. Vous échangez directement sur WhatsApp ou appelez le lieu en un clic pour bloquer votre table, piste de bowling ou créneau d’activité.
              </p>
            </div>

            <div
              style={{
                marginTop: '28px',
                padding: '16px 20px',
                backgroundColor: 'var(--color-pale-blue-subtle)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(21, 94, 239, 0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <Navigation size={22} color="var(--color-primary)" />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-navy)' }}>
                Itinéraire GPS Google Maps intégré en 1 clic vers l'entrée exacte
              </span>
            </div>
          </div>

          {/* Carte 2 : Mode Électricité / Lumière (5 colonnes) */}
          <div
            style={{
              gridColumn: 'span 5',
              background: 'linear-gradient(145deg, #102A56 0%, #0F172A 100%)',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              padding: '36px',
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#34D399',
                  marginBottom: '20px',
                }}
              >
                <Zap size={26} />
              </div>
              <h3 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '12px', color: '#FFFFFF' }}>
                Veille Lumière & Courant en Direct
              </h3>
              <p style={{ color: '#CBD5E1', fontSize: '0.95rem', lineHeight: 1.6 }}>
                En cas de coupure de réseau dans un quartier, la communauté et les gérants signalent si l'établissement dispose d'un groupe électrogène ou reste pleinement opérationnel.
              </p>
            </div>

            <div
              style={{
                marginTop: '24px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '8px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.825rem',
                fontWeight: 700,
                color: '#6EE7B7',
              }}
            >
              <span>●</span> Signalements communautaires vérifiés
            </div>
          </div>

          {/* Carte 3 : Algorithme Recommandation Personnalisé (5 colonnes) */}
          <div
            style={{
              gridColumn: 'span 5',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              padding: '36px',
              border: '1.5px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '14px',
                  backgroundColor: 'var(--color-amber-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#D97706',
                  marginBottom: '20px',
                }}
              >
                <Sparkles size={26} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '12px', color: 'var(--color-navy)' }}>
                Assistant IA KharjaBot & Recommandations
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Discutez en Derja ou en Français avec l'Assistant Tfarhida. Indiquez votre budget en Dinars (ex: ≤ 20 DT), si vous êtes en couple ou entre amis : il vous trouve la sortie idéale en 3 secondes.
              </p>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge-primary">KharjaBot IA 🤖</span>
              <span className="badge badge-emerald">&le; 20 DT</span>
              <span className="badge badge-red">Derja & FR</span>
            </div>
          </div>

          {/* Carte 4 : Espace Pro & Partenaires Vérifiés (7 colonnes) */}
          <div
            style={{
              gridColumn: 'span 7',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              padding: '36px',
              border: '1.5px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(230, 57, 70, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-tunisian-red)',
                  marginBottom: '20px',
                }}
              >
                <ShieldCheck size={26} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '12px', color: 'var(--color-navy)' }}>
                Espace Partenaire Pro pour les établissements
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Les gérants disposent d'un tableau de bord dédié pour publier leurs promotions, mettre à jour leurs horaires réels, consulter les avis clients et booster leur visibilité auprès d'une audience locale ciblée.
              </p>
            </div>

            <div
              style={{
                marginTop: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: 'var(--color-navy)',
                fontSize: '0.875rem',
                fontWeight: 700,
              }}
            >
              <Users size={18} color="var(--color-primary)" />
              <span>Plus de 50 établissements déjà référencés à Sfax</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
