import React from 'react';
import { 
  Menu, X, Home, BarChart3, Info, MessageSquare, LogIn, Shield, 
  ExternalLink, ChevronRight, Database, CheckCircle2, Landmark, Sparkles,
  ShieldAlert, Heart, Globe
} from 'lucide-react';

export type ActivePage = 'public' | 'stats' | 'about' | 'discussions' | 'dashboard' | 'landing';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  onOpenLogin: () => void;
  onOpenWhistleblower?: () => void;
  onOpenSupport?: () => void;
  brandName?: string;
  isDbConnected?: boolean;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  currentPage,
  onNavigate,
  onOpenLogin,
  onOpenWhistleblower,
  onOpenSupport,
  brandName = 'RÍKISGÁT',
  isDbConnected = true
}) => {
  // Close drawer on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const navItems = [
    {
      id: 'public' as ActivePage,
      title: 'Forsíða / Reikningagátt',
      subtitle: 'Opnir reikningar ríkisins, stofnanir og birgjar',
      icon: Home,
      badge: 'Raungögn'
    },
    {
      id: 'stats' as ActivePage,
      title: 'Ríkið í tölum',
      subtitle: 'Starfsmannafjöldi, laun og heildarútgjöld',
      icon: Landmark,
      badge: 'Nýtt'
    },
    {
      id: 'discussions' as ActivePage,
      title: 'Tjatt & Umræður',
      subtitle: 'Rýni í reikninga, nefndir og opnar spurningar',
      icon: MessageSquare,
      badge: 'Hugmynd'
    },
    {
      id: 'about' as ActivePage,
      title: 'Um verkefnið',
      subtitle: 'Markmið, lögmæti, gagnsæi og opinn aðgangur',
      icon: Info,
    },
    {
      id: 'landing' as ActivePage,
      title: 'Forsíða rikisgat.is',
      subtitle: 'Kynning á verkefninu, skjaldamerki og stofnun Almenns félags',
      icon: Globe,
    }
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          id="nav-drawer-backdrop"
          onClick={onClose}
          className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-200"
        />
      )}

      {/* Drawer Panel */}
      <aside
        id="nav-drawer-panel"
        className={`fixed top-0 bottom-0 left-0 w-80 sm:w-96 bg-white z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out border-r border-neutral-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Icelandic flag accent mark */}
            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/20 flex-shrink-0 flex items-center justify-center bg-blue-900">
              {/* Stylized flag cross */}
              <div className="absolute inset-0 bg-[#02529C]"></div>
              <div className="absolute top-0 bottom-0 left-[30%] w-[18%] bg-white"></div>
              <div className="absolute left-0 right-0 top-[38%] h-[24%] bg-white"></div>
              <div className="absolute top-0 bottom-0 left-[34%] w-[10%] bg-[#DC1E35]"></div>
              <div className="absolute left-0 right-0 top-[43%] h-[14%] bg-[#DC1E35]"></div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-tight text-base">{brandName}</span>
                <span className="text-[10px] font-mono bg-blue-500/20 text-blue-200 px-1.5 py-0.5 rounded border border-blue-400/30">
                  Ísland
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">Gagnsæi í ríkisfjármálum</p>
            </div>
          </div>

          <button
            id="close-drawer-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Loka valmynd"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Database Status Pill */}
        <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-neutral-700 font-mono text-[11px]">
            <Database className="w-3.5 h-3.5 text-neutral-500" />
            <span>PostgreSQL 18:</span>
            {isDbConnected ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Tengt
              </span>
            ) : (
              <span className="text-amber-700">Öryggisnet (Mock)</span>
            )}
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">opnirreikningar.is</span>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1.5">
          <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-3 py-1">
            Aðalsíður
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                id={`drawer-nav-${item.id}`}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`w-full text-left p-3 rounded-xl transition flex items-start gap-3.5 cursor-pointer group border ${
                  isActive
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                    : 'bg-white hover:bg-neutral-100 text-neutral-800 border-transparent hover:border-neutral-200'
                }`}
              >
                <div className={`p-2 rounded-lg mt-0.5 flex-shrink-0 ${
                  isActive ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-700 group-hover:bg-neutral-200'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm leading-tight">{item.title}</span>
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                        isActive 
                          ? 'bg-neutral-700 text-neutral-200' 
                          : 'bg-neutral-200 text-neutral-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 leading-snug line-clamp-1 ${
                    isActive ? 'text-neutral-300' : 'text-neutral-500'
                  }`}>
                    {item.subtitle}
                  </p>
                </div>

                <ChevronRight className={`w-4 h-4 self-center transition-transform ${
                  isActive ? 'text-white' : 'text-neutral-400 group-hover:translate-x-0.5'
                }`} />
              </button>
            );
          })}

          {/* Internal / Admin Section */}
          <div className="pt-3 mt-3 border-t border-neutral-200 space-y-1">
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-3 py-1">
              Fyrir stjórnendur
            </div>
            <button
              id="drawer-nav-dashboard"
              onClick={() => {
                onNavigate('dashboard');
                onClose();
              }}
              className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-3 cursor-pointer group border ${
                currentPage === 'dashboard'
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-transparent'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${currentPage === 'dashboard' ? 'bg-neutral-800 text-amber-300' : 'bg-white text-neutral-600'}`}>
                <Shield className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs">Innra Stjórnborð</div>
                <div className="text-[10px] text-neutral-500 line-clamp-1">Beinn tengill: <code className="font-mono text-amber-800 font-bold">?stjornbord</code></div>
              </div>
              <span className="text-[9px] bg-neutral-200 text-neutral-700 font-mono px-1.5 py-0.5 rounded">
                Umsjón
              </span>
            </button>
          </div>
        </div>

        {/* User Account & Actions Section */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 space-y-2">
          {onOpenSupport && (
            <button
              id="drawer-open-support-btn"
              onClick={() => {
                onClose();
                onOpenSupport();
              }}
              className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-950 border border-rose-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
            >
              <Heart className="w-4 h-4 text-rose-600 fill-current" />
              <span>Viltu styrkja okkur? (Saga & Stofngögn)</span>
            </button>
          )}

          {onOpenWhistleblower && (
            <button
              id="drawer-open-whistleblower-btn"
              onClick={() => {
                onClose();
                onOpenWhistleblower();
              }}
              className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
            >
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>Ábendingar ríkisstarfsmanna (Trúnaður)</span>
            </button>
          )}

          <button
            id="drawer-open-login-btn"
            onClick={() => {
              onClose();
              onOpenLogin();
            }}
            className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
          >
            <LogIn className="w-4 h-4" />
            <span>Innskráning / Notendaaðgangur</span>
          </button>

          <p className="text-[11px] text-neutral-500 text-center leading-relaxed">
            Fyrir umræður, vistaðar færslur og minnispunkta
          </p>
        </div>

        {/* Drawer Footer */}
        <div className="p-3 bg-neutral-100 border-t border-neutral-200 text-center text-[10px] text-neutral-500 font-mono">
          RíkisGát v2.5 • Öll gögn eru opinber gögn
        </div>
      </aside>
    </>
  );
};
