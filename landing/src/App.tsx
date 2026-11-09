import { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ClientHomeView } from './views/ClientHomeView';
import { PartnerPortalView } from './views/PartnerPortalView';
import { ActivityModal } from './components/ui/ActivityModal';
import { PartnerOnboardingModal } from './components/ui/PartnerOnboardingModal';
import type { DemoActivity } from './data/demoActivities';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function App() {
  const [selectedActivity, setSelectedActivity] = useState<DemoActivity | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'pro' | 'premium'>('pro');
  
  // Gestion de la séparation d'interface Client (Sorties) vs Partenaire (B2B Établissements)
  const [currentView, setCurrentView] = useState<'client' | 'partner'>(() => {
    return window.location.hash === '#/partenaire' ? 'partner' : 'client';
  });

  const mainRef = useRef<HTMLDivElement>(null);

  // Synchronisation avec l'historique du navigateur (boutons précédent/suivant)
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#/partenaire') {
        setCurrentView('partner');
      } else {
        setCurrentView('client');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Déclencher les animations GSAP au changement de vue ou de contenu
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('section').forEach((section) => {
        gsap.from(section, {
          opacity: 0.88,
          y: 18,
          duration: 0.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        });
      });
    }, mainRef);

    return () => ctx.revert();
  }, [currentView]);

  const handleSwitchView = (newView: 'client' | 'partner') => {
    setCurrentView(newView);
    if (newView === 'partner') {
      window.location.hash = '#/partenaire';
    } else {
      window.location.hash = '#/';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenApp = () => {
    if (currentView !== 'client') {
      handleSwitchView('client');
      setTimeout(() => {
        const explorerEl = document.getElementById('explorer');
        if (explorerEl) explorerEl.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }
    const explorerEl = document.getElementById('explorer');
    if (explorerEl) {
      explorerEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectPlan = (plan: 'standard' | 'pro' | 'premium') => {
    setSelectedPlan(plan);
    setIsOnboardingOpen(true);
  };

  return (
    <div ref={mainRef} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Barre de navigation principale (s'adapte intelligemment selon la vue) */}
      <Navbar
        isPartnerView={currentView === 'partner'}
        onToggleView={handleSwitchView}
        onOpenApp={handleOpenApp}
        onOpenProModal={() => handleSelectPlan('pro')}
      />

      {/* 2. Contenu Séparé selon le profil : Client Grand Public OU Portail Partenaire */}
      <main style={{ flex: 1 }}>
        {currentView === 'client' ? (
          <ClientHomeView
            onExploreClick={handleOpenApp}
            onSelectActivity={setSelectedActivity}
            onSwitchToPartner={() => handleSwitchView('partner')}
          />
        ) : (
          <PartnerPortalView
            onSelectPlan={handleSelectPlan}
            onOpenOnboarding={(plan) => handleSelectPlan(plan || 'pro')}
            onBackToClient={() => handleSwitchView('client')}
          />
        )}
      </main>

      {/* 3. Pied de page unifié */}
      <Footer onSwitchView={handleSwitchView} />

      {/* 4. Modal de détail d'activité */}
      <ActivityModal
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
      />

      {/* 5. Modal d'Onboarding Partenaire (4 Étapes avec vérification OTP 2FA & Validation Modérateur) */}
      <PartnerOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        initialPlan={selectedPlan}
        onCompleted={() => setIsOnboardingOpen(false)}
      />
    </div>
  );
}

export default App;
