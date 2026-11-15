import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ActivityModal } from '../components/ui/ActivityModal';
import { AuthModal } from '../components/ui/AuthModal';
import { IOSInstallPrompt } from '../components/ui/IOSInstallPrompt';
import { PartnerOnboardingModal } from '../components/ui/PartnerOnboardingModal';
import { ClientHomeView } from '../views/ClientHomeView';
import { PartnerPortalView } from '../views/PartnerPortalView';
import { ActivityDetailView } from '../views/ActivityDetailView';
import { FavoritesView } from '../views/FavoritesView';
import { ProfileView } from '../views/ProfileView';
import { ActivityMapView } from '../views/ActivityMapView';
import { RecommendationsView } from '../views/RecommendationsView';
import { AssistantView } from '../views/AssistantView';
import { PartnerDashboardView } from '../views/PartnerDashboardView';
import { AdminDashboardView } from '../views/AdminDashboardView';
import { FloatingAssistant } from '../components/chat/FloatingAssistant';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import type { DemoActivity } from '../data/demoActivities';

function PartnerDashboardRoute() {
  const { user, status, openAuth } = useAuth();
  const { t } = useLanguage();
  if (status === 'loading') return <section className="partner-access"><p>{t('partnerDashboard.loading')}</p></section>;
  if (user?.role !== 'partner') return <section className="partner-access">
    <div className="partner-access-card"><Building2 aria-hidden="true" size={28} /><h1>{t('partnerDashboard.accessTitle')}</h1><p>{t('partnerDashboard.accessDescription')}</p>
      {user ? <Link className="partner-primary-button" to="/partenaire">{t('partnerDashboard.partnerPage')}</Link> : <button className="partner-primary-button" onClick={() => openAuth('login')}>{t('partnerDashboard.login')}</button>}
    </div>
  </section>;
  return <PartnerDashboardView />;
}

gsap.registerPlugin(ScrollTrigger);

function SiteLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { openAuth, reloadUser } = useAuth();
  const [selectedActivity, setSelectedActivity] = useState<DemoActivity | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'pro' | 'premium'>('pro');
  const [assistantOpenRequest, setAssistantOpenRequest] = useState(0);
  const mainRef = useRef<HTMLDivElement>(null);
  const isPartnerView = location.pathname.startsWith('/partenaire');

  useEffect(() => {
    if (window.location.hash === '#/partenaire') navigate('/partenaire', { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('main section').forEach((section) => {
        gsap.from(section, { opacity: 0.92, y: 12, duration: 0.35, ease: 'power2.out', scrollTrigger: { trigger: section, start: 'top 88%', toggleActions: 'play none none none' } });
      });
    }, mainRef);
    return () => ctx.revert();
  }, [location.pathname]);

  const handleSwitchView = (view: 'client' | 'partner') => navigate(view === 'partner' ? '/partenaire' : '/');
  const handleExplore = () => {
    if (isPartnerView) navigate('/#explorer');
    else document.getElementById('explorer')?.scrollIntoView({ behavior: 'smooth' });
  };
  const handleSelectPlan = (plan: 'standard' | 'pro' | 'premium') => {
    setSelectedPlan(plan);
    setIsOnboardingOpen(true);
  };

  return (
    <div ref={mainRef} className="site-shell">
      <Navbar
        isPartnerView={isPartnerView}
        onToggleView={handleSwitchView}
        onOpenApp={handleExplore}
        onOpenProModal={() => handleSelectPlan('pro')}
        onOpenAuth={() => openAuth('login')}
      />
      <main className="site-main">
        <Outlet context={{ setSelectedActivity, handleExplore, handleSelectPlan, handleSwitchView, openAssistant: () => setAssistantOpenRequest((value) => value + 1) }} />
      </main>
      <Footer onSwitchView={handleSwitchView} />
      <ActivityModal activity={selectedActivity} onClose={() => setSelectedActivity(null)} />
      <PartnerOnboardingModal isOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} initialPlan={selectedPlan} onCompleted={() => {
        setIsOnboardingOpen(false);
        void reloadUser().then((partner) => { if (partner?.role === 'partner') navigate('/partenaire/espace'); });
      }} />
      <AuthModal />
      <IOSInstallPrompt />
      <FloatingAssistant openRequest={assistantOpenRequest} />
    </div>
  );
}

function HomeRoute() {
  const { handleExplore, handleSwitchView } = useOutletContext<{
    setSelectedActivity: (activity: DemoActivity) => void;
    handleExplore: () => void;
    handleSwitchView: (view: 'client' | 'partner') => void;
  }>();
  const navigate = useNavigate();
  return (
    <ClientHomeView
      onExploreClick={handleExplore}
      onSelectActivity={(activity) => navigate(`/activites/${encodeURIComponent(activity.id)}`)}
      onSwitchToPartner={() => handleSwitchView('partner')}
    />
  );
}

function PartnerRoute() {
  const { handleSelectPlan, handleSwitchView } = useOutletContext<{
    handleSelectPlan: (plan: 'standard' | 'pro' | 'premium') => void;
    handleSwitchView: (view: 'client' | 'partner') => void;
  }>();
  return <PartnerPortalView onSelectPlan={handleSelectPlan} onOpenOnboarding={(plan) => handleSelectPlan(plan || 'pro')} onBackToClient={() => handleSwitchView('client')} />;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/partenaire" element={<PartnerRoute />} />
          <Route path="/partenaire/espace" element={<PartnerDashboardRoute />} />
          <Route path="/admin" element={<AdminDashboardView />} />
          <Route path="/activites/:activityId" element={<ActivityDetailView />} />
          <Route path="/favoris" element={<FavoritesView />} />
          <Route path="/profil" element={<ProfileView />} />
          <Route path="/carte" element={<ActivityMapView />} />
          <Route path="/recommandations" element={<RecommendationsView />} />
          <Route path="/assistant" element={<AssistantView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
