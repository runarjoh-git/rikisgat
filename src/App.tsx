import React, { useState, useEffect } from 'react';
import { 
  Shield, FileText, CheckSquare, Share2, Database, LayoutDashboard, 
  ExternalLink, HardDrive, Cpu, Terminal, Clock, ArrowLeft, BarChart3, Tag
} from 'lucide-react';
import { StatusReport } from './components/StatusReport';
import { ProjectManagerTab } from './components/ProjectManagerTab';
import { MarketingTab } from './components/MarketingTab';
import { TechnicalTab } from './components/TechnicalTab';
import { DataSimulatorTab } from './components/DataSimulatorTab';
import { PublicPortalView } from './components/PublicPortalView';
import { INITIAL_DB_STATS, INITIAL_ROADMAP_TASKS, INITIAL_BRANDS } from './data/mockData';
import { TaskItem, BrandItem } from './types';
import { formaTolu } from './utils/icelandicFormatters';

const STORAGE_KEY_TASKS = 'rikisgat_stjorn_tasks_v6';
const STORAGE_KEY_BRANDS = 'rikisgat_stjorn_brands_v2';
const STORAGE_KEY_BROAD_SEARCH = 'rikisgat_broad_search_enabled_v2';

export default function App() {
  // Main view mode: 'dashboard' (Innra stjórnborð) or 'public' (Forsíða)
  const [viewMode, setViewMode] = useState<'dashboard' | 'public'>('public');

  // Dashboard active tab
  const [activeDashboardTab, setActiveDashboardTab] = useState<'report' | 'tasks' | 'marketing' | 'tech' | 'simulator'>('report');

  // Broad search (Öll ár & Allir mánuðir) state controlled from Innra Stjórnborð -> Gagnagreining & Benchmark
  const [broadSearchEnabled, setBroadSearchEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BROAD_SEARCH);
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load broadSearchEnabled', e);
    }
    return false;
  });

  // Save broad search setting
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BROAD_SEARCH, JSON.stringify(broadSearchEnabled));
    } catch (e) {
      console.error('Failed to save broadSearchEnabled', e);
    }
  }, [broadSearchEnabled]);

  // Tasks state with localStorage persistence
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TASKS);
      if (saved) return JSON.parse(saved);
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
      {/* Top Global Bar */}
      <nav className="bg-neutral-900 text-white border-b border-neutral-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-black tracking-tight text-lg">
              <span className="w-7 h-7 rounded bg-white text-neutral-900 flex items-center justify-center font-black text-sm">
                {primaryBrand ? primaryBrand.nafn.charAt(0) : 'R'}
              </span>
              <span>{primaryBrand ? primaryBrand.nafn.toUpperCase() : 'RÍKISGÁT'}</span>
            </div>
            <span className="hidden sm:inline-block text-[11px] font-mono text-neutral-400 border-l border-neutral-700 pl-3">
              PostgreSQL 18 ({formaTolu(INITIAL_DB_STATS.ar_2017_2025_fjoldi + INITIAL_DB_STATS.ar_2026_fjoldi)} reikningar)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('dashboard')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'dashboard'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Innra Stjórnborð</span>
            </button>

            <button
              onClick={() => setViewMode('public')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'public'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Almenningsvefur (Forsíða)</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {viewMode === 'public' ? (
          <PublicPortalView 
            onOpenDashboard={() => setViewMode('dashboard')} 
            broadSearchEnabled={broadSearchEnabled}
          />
        ) : (
          <div className="space-y-6">
            {/* Dashboard Sub-header */}
            <div className="bg-white border border-neutral-200 p-5 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight text-neutral-900 uppercase">
                    🛡️ {primaryBrand?.nafn || 'RÍKISGÁT'} — Innra Stjórnborð
                  </h1>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    Skýjahýsing
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Stjórnstöð fyrir verkefnastjórnun, vörumerkjasafn, stöðuskýrslu og PostgreSQL innviði.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-neutral-600 bg-neutral-50 px-3 py-2 rounded-xl border border-neutral-200">
                <HardDrive className="w-4 h-4 text-neutral-500" />
                <span>PostgreSQL: <strong>4,2 GiB</strong></span>
                <span className="text-neutral-300">|</span>
                <span>Svarhraði: <strong>0,005s</strong></span>
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
                <span>📢 Markaðsstjórn & Vörumerki ({brands.length})</span>
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
                  broadSearchEnabled={broadSearchEnabled}
                  onToggleBroadSearch={setBroadSearchEnabled}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
