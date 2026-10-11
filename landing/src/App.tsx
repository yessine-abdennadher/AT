import { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/layout/Navbar';
import { HeroSection } from './components/sections/HeroSection';
import { ActivityExplorer } from './components/sections/ActivityExplorer';
import { BentoPillars } from './components/sections/BentoPillars';
import { MobileAppShowcase } from './components/sections/MobileAppShowcase';
import { PartnerCtaSection } from './components/sections/PartnerCtaSection';
import { Footer } from './components/layout/Footer';
import { ActivityModal } from './components/ui/ActivityModal';
import type { DemoActivity } from './data/demoActivities';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function App() {
  const [selectedActivity, setSelectedActivity] = useState<DemoActivity | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Vérifier prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Animation douce des sections au scroll
      gsap.utils.toArray<HTMLElement>('section').forEach((section) => {
        gsap.from(section, {
          opacity: 0.85,
          y: 20,
          duration: 0.6,
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
  }, []);

  const handleOpenApp = () => {
    const explorerEl = document.getElementById('explorer');
    if (explorerEl) {
      explorerEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div ref={mainRef} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Navigation Fixe */}
      <Navbar onOpenApp={handleOpenApp} />

      {/* 2. Contenu Principal */}
      <main style={{ flex: 1 }}>
        <HeroSection onExploreClick={handleOpenApp} />
        <ActivityExplorer onSelectActivity={setSelectedActivity} />
        <BentoPillars />
        <MobileAppShowcase />
        <PartnerCtaSection />
      </main>

      {/* 3. Pied de Page */}
      <Footer />

      {/* 4. Modal d'Activité Interactive */}
      <ActivityModal
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
      />
    </div>
  );
}

export default App;
