import React, { useState, useEffect } from 'react';
import { 
  Shield, FileText, CheckSquare, Share2, Database, LayoutDashboard, 
  ExternalLink, HardDrive, Cpu, Terminal, Clock, ArrowLeft, BarChart3, Tag, Info,
  Menu, Landmark, MessageSquare, Heart, Link as LinkIcon, Check, Zap
} from 'lucide-react';
import { StatusReport } from './components/StatusReport';
import { ProjectManagerTab } from './components/ProjectManagerTab';
import { MarketingTab } from './components/MarketingTab';
import { TechnicalTab } from './components/TechnicalTab';
import { DataSimulatorTab } from './components/DataSimulatorTab';
import { PublicPortalView } from './components/PublicPortalView';
import { AboutView } from './components/AboutView';
import { NavigationDrawer, ActivePage } from './components/NavigationDrawer';
import { LoginModal } from './components/LoginModal';
import { WhistleblowerModal } from './components/WhistleblowerModal';
import { SupportModal } from './components/SupportModal';
import { PerformanceDiagnosticModal } from './components/PerformanceDiagnosticModal';
import { StateStatsView } from './components/StateStatsView';
import { DiscussionsView } from './components/DiscussionsView';
import { LandingView } from './components/LandingView';
import { FounderLoginGate } from './components/FounderLoginGate';
import { INITIAL_DB_STATS, INITIAL_ROADMAP_TASKS, INITIAL_BRANDS } from './data/mockData';
import { TaskItem, BrandItem } from './types';
import { formaTolu } from './utils/icelandicFormatters';
import { fetchPortalSettings, updatePortalSettings } from './services/api';

const STORAGE_KEY_TASKS = 'rikisgat_stjorn_tasks_v7';
const STORAGE_KEY_BRANDS = 'rikisgat_stjorn_brands_v2';
const STORAGE_KEY_BROAD_SEARCH = 'rikisgat_broad_search_enabled_v2';
const STORAGE_KEY_BROAD_SEARCH_YEARS = 'rikisgat_broad_search_years_enabled_v1';
const STORAGE_KEY_BROAD_SEARCH_MONTHS = 'rikisgat_broad_search_months_enabled_v1';
const STORAGE_KEY_FOUNDER = 'rikisgat_founder_session_v2';

// Greining á slóð (URL params & hash) fyrir beinar bakdyr og síður
function parsePageFromUrl(): { page: ActivePage; openSupport: boolean; openWhistleblower: boolean } {
  if (typeof window === 'undefined') {
    return { page: 'public', openSupport: false, openWhistleblower: false };
  }
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash.toLowerCase();

  const openSupport = params.has('styrkja') || hash === '#styrkja';
  const openWhistleblower = params.has('abending') || hash === '#abending';

  // Bakdyr beint inn á Innra Stjórnborð (?stjornbord, ?dashboard, ?bakdyr, ?admin, eða #stjornbord)
  if (
    params.has('stjornbord') ||
    params.has('dashboard') ||
    params.has('bakdyr') ||
    params.has('admin') ||
    params.get('view') === 'dashboard' ||
    hash === '#stjornbord' ||
    hash === '#dashboard' ||
    hash === '#bakdyr'
  ) {
    return { page: 'dashboard', openSupport, openWhistleblower };
  }

  if (params.get('view') === 'about' || hash === '#about' || hash === '#um') {
    return { page: 'about', openSupport, openWhistleblower };
  }
  if (params.get('view') === 'stats' || hash === '#stats' || hash === '#rikid') {
    return { page: 'stats', openSupport, openWhistleblower };
  }
  if (params.get('view') === 'discussions' || hash === '#discussions' || hash === '#tjatt') {
    return { page: 'discussions', openSupport, openWhistleblower };
  }
  if (params.get('view') === 'landing' || params.has('landing') || params.has('forsida') || hash === '#landing' || hash === '#forsida') {
    return { page: 'landing', openSupport, openWhistleblower };
  }

  return { page: 'public', openSupport, openWhistleblower };
}

export default function App() {
  const initialUrl = parsePageFromUrl();

  // Main view mode: 'dashboard' (Innra stjórnborð), 'public' (Forsíða), 'about' (Um Ríkisgát), 'stats' (Ríkið í tölum), or 'discussions' (Tjatt)
  const [viewMode, setViewMode] = useState<ActivePage>(initialUrl.page);
  const [copiedBackdoorLink, setCopiedBackdoorLink] = useState(false);

  // Navigation Drawer & Login Modal state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isWhistleblowerModalOpen, setIsWhistleblowerModalOpen] = useState(initialUrl.openWhistleblower);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(initialUrl.openSupport);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [whistleblowerData, setWhistleblowerData] = useState<{ institution?: string; supplier?: string; invoiceNumber?: string }>({});

  // Founder authentication state for Innra Stjórnborð
  const [founderUser, setFounderUser] = useState<{ name: string; email: string; role: string } | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FOUNDER);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // Hlusta á back/forward takka og hash breytingar í vafra
  useEffect(() => {
    const handlePopState = () => {
      const current = parsePageFromUrl();
      setViewMode(current.page);
      if (current.openSupport) setIsSupportModalOpen(true);
      if (current.openWhistleblower) setIsWhistleblowerModalOpen(true);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Samstilla slóð í vafra þegar skipt er um síðu (án þess að endurhlaða)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (viewMode === 'dashboard') {
          url.searchParams.set('stjornbord', '1');
          url.searchParams.delete('view');
          window.history.replaceState(null, '', url.pathname + url.search);
        } else if (viewMode === 'about') {
          url.searchParams.delete('stjornbord');
          url.searchParams.delete('dashboard');
          url.searchParams.delete('bakdyr');
          url.searchParams.set('view', 'about');
          window.history.replaceState(null, '', url.pathname + url.search);
        } else if (viewMode === 'stats') {
          url.searchParams.delete('stjornbord');
          url.searchParams.set('view', 'stats');
          window.history.replaceState(null, '', url.pathname + url.search);
        } else if (viewMode === 'discussions') {
          url.searchParams.delete('stjornbord');
          url.searchParams.set('view', 'discussions');
          window.history.replaceState(null, '', url.pathname + url.search);
        } else if (viewMode === 'landing') {
          url.searchParams.delete('stjornbord');
          url.searchParams.set('view', 'landing');
          window.history.replaceState(null, '', url.pathname + url.search);
        } else {
          // Public / Reikningar: halda slóð hreinni
          if (url.searchParams.has('stjornbord') || url.searchParams.get('view') === 'dashboard') {
            url.searchParams.delete('stjornbord');
            url.searchParams.delete('dashboard');
            url.searchParams.delete('bakdyr');
            url.searchParams.delete('view');
            const clean = url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '');
            window.history.replaceState(null, '', clean);
          }
        }
      }
    } catch (e) {
      console.error('Error updating history state', e);
    }
  }, [viewMode]);

  const handleOpenWhistleblower = (data?: { institution?: string; supplier?: string; invoiceNumber?: string }) => {
    setWhistleblowerData(data || {});
    setIsWhistleblowerModalOpen(true);
  };

  // Dashboard active tab
  const [activeDashboardTab, setActiveDashboardTab] = useState<'report' | 'tasks' | 'marketing' | 'tech' | 'simulator'>('report');

  // Broad search state controlled from Innra Stjórnborð -> Verkstjórn (aðskildir takkar fyrir ár og mánuð)
  // Sjálfgefið er slökkt (false) fyrir alla nýja vafrara og almenning
  const [broadSearchYearsEnabled, setBroadSearchYearsEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BROAD_SEARCH_YEARS);
      if (saved !== null) return JSON.parse(saved);
      const legacy = localStorage.getItem(STORAGE_KEY_BROAD_SEARCH);
      if (legacy !== null) return JSON.parse(legacy);
    } catch (e) {
      console.error('Failed to load broadSearchYearsEnabled', e);
    }
    return false;
  });

  const [broadSearchMonthsEnabled, setBroadSearchMonthsEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BROAD_SEARCH_MONTHS);
      if (saved !== null) return JSON.parse(saved);
      const legacy = localStorage.getItem(STORAGE_KEY_BROAD_SEARCH);
      if (legacy !== null) return JSON.parse(legacy);
    } catch (e) {
      console.error('Failed to load broadSearchMonthsEnabled', e);
    }
    return false;
  });

  // Sækja miðlægar stillingar frá vefþjóni (PostgreSQL) við ræsingu
  useEffect(() => {
    let isMounted = true;
    fetchPortalSettings().then(settings => {
      if (isMounted && settings) {
        setBroadSearchYearsEnabled(settings.broadSearchYears);
        setBroadSearchMonthsEnabled(settings.broadSearchMonths);
        try {
          localStorage.setItem(STORAGE_KEY_BROAD_SEARCH_YEARS, JSON.stringify(settings.broadSearchYears));
          localStorage.setItem(STORAGE_KEY_BROAD_SEARCH_MONTHS, JSON.stringify(settings.broadSearchMonths));
        } catch {
          // ignore
        }
      }
    });
    return () => { isMounted = false; };
  }, []);

  // Handlerar fyrir að kveikja/slökkva sem uppfæra bæði staðvært og miðlægt á netþjóni
  const handleToggleBroadSearchYears = (enabled: boolean) => {
    setBroadSearchYearsEnabled(enabled);
    try {
      localStorage.setItem(STORAGE_KEY_BROAD_SEARCH_YEARS, JSON.stringify(enabled));
    } catch {
      // ignore
    }
    updatePortalSettings({ broadSearchYears: enabled });
  };

  const handleToggleBroadSearchMonths = (enabled: boolean) => {
    setBroadSearchMonthsEnabled(enabled);
    try {
      localStorage.setItem(STORAGE_KEY_BROAD_SEARCH_MONTHS, JSON.stringify(enabled));
    } catch {
      // ignore
    }
    updatePortalSettings({ broadSearchMonths: enabled });
  };

  // Tasks state with localStorage persistence
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TASKS);
      if (saved) {
        const parsed: TaskItem[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map(t => t.id));
        const missing = INITIAL_ROADMAP_TASKS.filter(t => !existingIds.has(t.id));
        if (missing.length > 0) {
          return [...parsed, ...missing];
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to load tasks from localStorage', e);
    }
    return INITIAL_ROADMAP_TASKS;
  });

  // Brands state with localStorage persistence
  const [brands, setBrands] = useState<BrandItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BRANDS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load brands from localStorage', e);
    }
    return INITIAL_BRANDS;
  });

  // Save to localStorage when tasks change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks', e);
    }
  }, [tasks]);

  // Save to localStorage when brands change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BRANDS, JSON.stringify(brands));
    } catch (e) {
      console.error('Failed to save brands', e);
    }
  }, [brands]);

  // Task handlers
  const handleToggleTask = (taskId: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            status: t.status === 'completed' ? 'in_progress' : 'completed'
          };
        }
        return t;
      })
    );
  };

  const handleAddTask = (newTask: Omit<TaskItem, 'id'>) => {
    const id = `task-${Date.now()}`;
    setTasks(prev => [
      {
        id,
        ...newTask
      },
      ...prev
    ]);
  };

  const handleEditTask = (updatedTask: TaskItem) => {
    setTasks(prev => prev.map(t => (t.id === updatedTask.id ? updatedTask : t)));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Brand handlers
  const handleAddBrand = (newBrand: Omit<BrandItem, 'id' | 'createdAt'>) => {
    const id = `brand-${Date.now()}`;
    const brand: BrandItem = {
      id,
      ...newBrand,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setBrands(prev => [brand, ...prev]);
  };

  const handleSetPrimaryBrand = (brandId: string) => {
    setBrands(prev =>
      prev.map(b => ({
        ...b,
        status: b.id === brandId ? 'adal' : (b.status === 'adal' ? 'i_skodun' : b.status)
      }))
    );
  };

  const handleDeleteBrand = (brandId: string) => {
    setBrands(prev => prev.filter(b => b.id !== brandId));
  };

  const primaryBrand = brands.find(b => b.status === 'adal') || brands[0];

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 font-sans">
      {/* Navigation Drawer (Sliding menu from left) */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentPage={viewMode}
        onNavigate={setViewMode}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenWhistleblower={() => handleOpenWhistleblower()}
        onOpenSupport={() => setIsSupportModalOpen(true)}
        brandName={primaryBrand?.nafn || 'RÍKISGÁT'}
      />

      {/* User Login / Account Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        brandName={primaryBrand?.nafn || 'RíkisGát'}
      />

      {/* Whistleblower Tip Modal for state employees and citizens */}
      <WhistleblowerModal
        isOpen={isWhistleblowerModalOpen}
        onClose={() => setIsWhistleblowerModalOpen(false)}
        prefilledInstitution={whistleblowerData.institution}
        prefilledSupplier={whistleblowerData.supplier}
        prefilledInvoice={whistleblowerData.invoiceNumber}
      />

      {/* Support Us / Story & Bank Transfer Modal */}
      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />

      {/* Performance Diagnostic & Localhost Latency Modal */}
      <PerformanceDiagnosticModal
        isOpen={isPerformanceModalOpen}
        onClose={() => setIsPerformanceModalOpen(false)}
      />

      {/* Top Global Bar */}
      <nav className="bg-neutral-900 text-white border-b border-neutral-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hamburger Button (3 lines in top-left corner) */}
            <button
              id="open-nav-drawer-btn"
              onClick={() => setIsDrawerOpen(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-800 transition cursor-pointer -ml-1.5 focus:outline-none focus:ring-2 focus:ring-white/20"
              aria-label="Opna valmynd (3 strik)"
              title="Valmynd (síður, ríkið í tölum, um okkur og aðgangur)"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Brand Logo and Title */}
            <div 
              onClick={() => setViewMode('public')}
              className="flex items-center gap-2 font-black tracking-tight text-base sm:text-lg cursor-pointer select-none"
            >
              <span className="w-7 h-7 rounded bg-white text-neutral-900 flex items-center justify-center font-black text-sm">
                {primaryBrand ? primaryBrand.nafn.charAt(0) : 'R'}
              </span>
              <span>{primaryBrand ? primaryBrand.nafn.toUpperCase() : 'RÍKISGÁT'}</span>
            </div>

            {viewMode !== 'public' && viewMode !== 'landing' && (
              <span className="hidden md:inline-block text-[11px] font-mono text-neutral-400 border-l border-neutral-700 pl-3">
                PostgreSQL 18 ({formaTolu(INITIAL_DB_STATS.ar_2017_2025_fjoldi + INITIAL_DB_STATS.ar_2026_fjoldi)} reikningar)
              </span>
            )}

            {viewMode === 'landing' && (
              <span className="hidden sm:inline-block text-[11px] font-mono text-neutral-300 border-l border-neutral-700 pl-3 uppercase">
                Prufuferli / Lendingarsíða
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {viewMode !== 'public' && viewMode !== 'landing' && (
              <button
                type="button"
                onClick={() => setIsPerformanceModalOpen(true)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 cursor-pointer"
                title="Keyra hraðapróf og greina flöskuhálsa á localhost"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Hraðapróf</span>
              </button>
            )}

            {viewMode !== 'public' && (
              <button
                onClick={() => setViewMode('public')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Forsíða / Reikningar</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {viewMode === 'about' ? (
          <AboutView 
            onBackToPortal={() => setViewMode('public')} 
            onOpenDashboard={() => setViewMode('dashboard')} 
            onOpenSupport={() => setIsSupportModalOpen(true)}
          />
        ) : viewMode === 'stats' ? (
          <StateStatsView
            onBackToPortal={() => setViewMode('public')}
            onOpenDiscussions={() => setViewMode('discussions')}
          />
        ) : viewMode === 'discussions' ? (
          <DiscussionsView
            onBackToPortal={() => setViewMode('public')}
            onOpenStats={() => setViewMode('stats')}
          />
        ) : viewMode === 'landing' ? (
          <LandingView 
            onOpenApp={() => setViewMode('public')}
            onOpenLogin={() => setIsLoginModalOpen(true)}
          />
        ) : viewMode === 'public' ? (
          <PublicPortalView 
            onOpenDashboard={() => setViewMode('dashboard')} 
            onOpenAbout={() => setViewMode('about')}
            onOpenStats={() => setViewMode('stats')}
            onOpenLanding={() => setViewMode('landing')}
            onOpenWhistleblower={handleOpenWhistleblower}
            onOpenSupport={() => setIsSupportModalOpen(true)}
            onOpenPerformance={() => setIsPerformanceModalOpen(true)}
            broadSearchYearsEnabled={broadSearchYearsEnabled}
            broadSearchMonthsEnabled={broadSearchMonthsEnabled}
            broadSearchEnabled={broadSearchYearsEnabled || broadSearchMonthsEnabled}
          />
        ) : !founderUser ? (
          <FounderLoginGate 
            onSuccess={(founder) => {
              setFounderUser(founder);
              try {
                localStorage.setItem(STORAGE_KEY_FOUNDER, JSON.stringify(founder));
              } catch {}
            }}
            onBackToPortal={() => setViewMode('public')}
          />
        ) : (
          <div className="space-y-6">
            {/* Dashboard Sub-header */}
            <div className="bg-white border border-neutral-200 p-5 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-black tracking-tight text-neutral-900 uppercase">
                    🛡️ {primaryBrand?.nafn || 'RÍKISGÁT'} — Innra Stjórnborð
                  </h1>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    Skýjahýsing
                  </span>
                  <span className="bg-neutral-900 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1 font-mono shadow-2xs">
                    <Shield className="w-3 h-3 text-amber-400" />
                    <span>Stofnandi: {founderUser.name}</span>
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Stjórnstöð fyrir verkefnastjórnun, vörumerkjasafn, stöðuskýrslu og PostgreSQL innviði.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFounderUser(null);
                    try {
                      localStorage.removeItem(STORAGE_KEY_FOUNDER);
                    } catch {}
                    setViewMode('public');
                  }}
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Útskrá úr stjórnborði"
                >
                  <span>Útskrá stofnanda</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const backdoorUrl = `${window.location.origin}${window.location.pathname}?stjornbord`;
                    navigator.clipboard.writeText(backdoorUrl);
                    setCopiedBackdoorLink(true);
                    setTimeout(() => setCopiedBackdoorLink(false), 2500);
                  }}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-xl text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Afrita beinan bakdyratengil á þetta stjórnborð"
                >
                  {copiedBackdoorLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">✓ Afritað á klemmuspjald!</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-3.5 h-3.5 text-amber-700" />
                      <span>🔗 Bakdyr: ?stjornbord</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsPerformanceModalOpen(true)}
                  className="flex items-center gap-2 text-xs font-mono text-neutral-700 hover:text-neutral-950 bg-neutral-50 hover:bg-neutral-100 px-3 py-2 rounded-xl border border-neutral-200 transition cursor-pointer shadow-2xs"
                  title="Smelltu til að opna hraðapróf og flöskuhálsagreiningu á localhost"
                >
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>PostgreSQL: <strong>4,2 GiB</strong></span>
                  <span className="text-neutral-300">|</span>
                  <span className="text-amber-800 font-bold underline decoration-dotted">Hraðapróf</span>
                </button>
              </div>
            </div>

            {/* Dashboard Tabs Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-neutral-200">
              <button
                onClick={() => setActiveDashboardTab('report')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeDashboardTab === 'report'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-white text-neutral-700 hover:bg-neutral-200/70 border border-neutral-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>📑 Ítarleg Stöðuskýrsla</span>
              </button>

              <button
                onClick={() => setActiveDashboardTab('tasks')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeDashboardTab === 'tasks'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-white text-neutral-700 hover:bg-neutral-200/70 border border-neutral-200'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span>📋 Verkefnastjóri ({tasks.length})</span>
              </button>

              <button
                onClick={() => setActiveDashboardTab('marketing')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeDashboardTab === 'marketing'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-white text-neutral-700 hover:bg-neutral-200/70 border border-neutral-200'
                }`}
              >
                <Share2 className="w-4 h-4" />
                <span>📢 Markaðsstjórn, Vörumerki & Kannanir</span>
              </button>

              <button
                onClick={() => setActiveDashboardTab('tech')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeDashboardTab === 'tech'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-white text-neutral-700 hover:bg-neutral-200/70 border border-neutral-200'
                }`}
              >
                <Cpu className="w-4 h-4" />
                <span>⚡ Tæknilegir Innviðir & Möppur</span>
              </button>

              <button
                onClick={() => setActiveDashboardTab('simulator')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeDashboardTab === 'simulator'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-white text-neutral-700 hover:bg-neutral-200/70 border border-neutral-200'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>📊 Gagnagreining & Benchmark</span>
              </button>
            </div>

            {/* Active Tab View */}
            <div>
              {activeDashboardTab === 'report' && <StatusReport stats={INITIAL_DB_STATS} />}
              {activeDashboardTab === 'tasks' && (
                <ProjectManagerTab
                  tasks={tasks}
                  onToggleTask={handleToggleTask}
                  onAddTask={handleAddTask}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  broadSearchYearsEnabled={broadSearchYearsEnabled}
                  broadSearchMonthsEnabled={broadSearchMonthsEnabled}
                  onToggleBroadSearchYears={handleToggleBroadSearchYears}
                  onToggleBroadSearchMonths={handleToggleBroadSearchMonths}
                  broadSearchEnabled={broadSearchYearsEnabled || broadSearchMonthsEnabled}
                  onToggleBroadSearch={(val) => {
                    handleToggleBroadSearchYears(val);
                    handleToggleBroadSearchMonths(val);
                  }}
                />
              )}
              {activeDashboardTab === 'marketing' && (
                <MarketingTab
                  brands={brands}
                  onAddBrand={handleAddBrand}
                  onSetPrimaryBrand={handleSetPrimaryBrand}
                  onDeleteBrand={handleDeleteBrand}
                />
              )}
              {activeDashboardTab === 'tech' && <TechnicalTab stats={INITIAL_DB_STATS} />}
              {activeDashboardTab === 'simulator' && (
                <DataSimulatorTab 
                  stats={INITIAL_DB_STATS} 
                  broadSearchEnabled={broadSearchYearsEnabled || broadSearchMonthsEnabled}
                  onToggleBroadSearch={(val) => {
                    handleToggleBroadSearchYears(val);
                    handleToggleBroadSearchMonths(val);
                  }}
                  onOpenWhistleblower={handleOpenWhistleblower}
                />
              )}
            </div>
          </div>
        )}

        {viewMode !== 'public' && (
          <footer className="mt-12 pt-6 border-t border-neutral-300 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-600">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-neutral-800" />
              <span className="font-bold text-neutral-900">Ríkisgát</span>
              <span className="text-neutral-400">|</span>
              <span>Sjálfstætt borgaralegt eftirlit með opinberum útgjöldum Íslands</span>
            </div>
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap font-bold text-neutral-700">
              <button
                onClick={() => setViewMode('public')}
                className="hover:text-neutral-900 hover:underline cursor-pointer"
              >
                Forsíða / Reikningar
              </button>
              <button
                onClick={() => setViewMode('stats')}
                className={`hover:text-neutral-900 hover:underline flex items-center gap-1.5 cursor-pointer ${viewMode === 'stats' ? 'text-neutral-900 underline' : ''}`}
              >
                <Landmark className="w-3.5 h-3.5 text-neutral-700" />
                <span>Ríkið í tölum</span>
              </button>
              <button
                onClick={() => setViewMode('about')}
                className={`hover:text-neutral-900 hover:underline flex items-center gap-1.5 cursor-pointer ${viewMode === 'about' ? 'text-neutral-900 underline' : ''}`}
              >
                <Info className="w-3.5 h-3.5 text-neutral-700" />
                <span>Um Ríkisgát</span>
              </button>
              <button
                onClick={() => setIsSupportModalOpen(true)}
                className="hover:text-neutral-900 hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <Heart className="w-3.5 h-3.5 text-neutral-700" />
                <span>Viltu styrkja okkur?</span>
              </button>
              <button
                onClick={() => setViewMode('dashboard')}
                className={`text-neutral-500 hover:text-neutral-900 hover:underline cursor-pointer ${viewMode === 'dashboard' ? 'text-neutral-900 underline' : ''}`}
              >
                Innra Stjórnborð
              </button>
            </div>
          </footer>
        )}
      </main>
    </div>
  );
}
