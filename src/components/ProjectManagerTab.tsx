import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Clock, Calendar, Plus, Filter, CheckSquare, Square, 
  Tag, AlertCircle, Trash2, Edit3, Database, Code, Copy, Check, 
  Download, Sparkles, User, ArrowUpDown, ChevronRight, X, Laptop, FileCode, CheckCheck, RefreshCw
} from 'lucide-react';
import { TaskItem, LocalhostFileUpdate } from '../types';
import { INITIAL_LOCALHOST_UPDATES } from '../data/mockData';

const STORAGE_KEY_LOCALHOST_UPDATES = 'rikisgat_localhost_updates_v2';

interface ProjectManagerTabProps {
  tasks: TaskItem[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (newTask: Omit<TaskItem, 'id'>) => void;
  onDeleteTask?: (taskId: string) => void;
  onEditTask?: (task: TaskItem) => void;
}

export const ProjectManagerTab: React.FC<ProjectManagerTabProps> = ({ 
  tasks, 
  onToggleTask, 
  onAddTask,
  onDeleteTask,
  onEditTask
}) => {
  const [filterMilestone, setFilterMilestone] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [activeScriptTab, setActiveScriptTab] = useState<'postgres' | 'verification' | 'backup' | 'cloud'>('postgres');
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedFilePath, setCopiedFilePath] = useState<string | null>(null);
  const [copiedAllPaths, setCopiedAllPaths] = useState(false);

  // Localhost updates tracking state with automatic merging of new items
  const [localhostUpdates, setLocalhostUpdates] = useState<LocalhostFileUpdate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOCALHOST_UPDATES);
      if (saved) {
        const parsed: LocalhostFileUpdate[] = JSON.parse(saved);
        // Merge any updates from INITIAL_LOCALHOST_UPDATES that are missing
        const existingIds = new Set(parsed.map(p => p.id));
        const missing = INITIAL_LOCALHOST_UPDATES.filter(item => !existingIds.has(item.id));
        if (missing.length > 0) {
          return [...parsed, ...missing];
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to load localhost updates from localStorage', e);
    }
    return INITIAL_LOCALHOST_UPDATES;
  });

  // Save localhost updates to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOCALHOST_UPDATES, JSON.stringify(localhostUpdates));
    } catch (e) {
      console.error('Failed to save localhost updates', e);
    }
  }, [localhostUpdates]);

  const handleRemoveLocalhostUpdate = (id: string) => {
    setLocalhostUpdates(prev => prev.filter(u => u.id !== id));
  };

  const handleResetLocalhostUpdates = () => {
    setLocalhostUpdates(INITIAL_LOCALHOST_UPDATES);
  };

  const handleCopyFilePath = (filePath: string) => {
    navigator.clipboard.writeText(filePath).then(() => {
      setCopiedFilePath(filePath);
      setTimeout(() => setCopiedFilePath(null), 1800);
    });
  };

  const handleCopyAllPaths = () => {
    const text = localhostUpdates.map(u => u.filePath).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopiedAllPaths(true);
      setTimeout(() => setCopiedAllPaths(false), 2000);
    });
  };

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newMilestone, setNewMilestone] = useState<'M1' | 'M2' | 'M3' | 'M4'>('M3');
  const [newCategory, setNewCategory] = useState<TaskItem['category']>('Rekstur');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [newDeadline, setNewDeadline] = useState('2026-09-18');
  const [newAssignee, setNewAssignee] = useState('Rúnar');

  const filteredTasks = tasks.filter(t => {
    if (filterMilestone !== 'all' && t.milestone !== filterMilestone) return false;
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q);
    }
    return true;
  });

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const futureCount = tasks.filter(t => t.status === 'future').length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask({
      title: newTitle.trim(),
      desc: newDesc.trim(),
      milestone: newMilestone,
      category: newCategory,
      priority: newPriority,
      status: 'in_progress',
      deadline: newDeadline || undefined,
      assignee: newAssignee || 'Rúnar',
      createdAt: new Date().toISOString().split('T')[0]
    });
    setNewTitle('');
    setNewDesc('');
    setShowAddModal(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !onEditTask) return;
    onEditTask(editingTask);
    setEditingTask(null);
  };

  const postgresScript = `-- ============================================================
-- POSTGRESQL 18: FLÝTIVÍSAR OG TÖFLUR (Gagnagrunnur: rikisgat)
-- Keyrt í pgAdmin 4 (Query Tool) eða psql
-- ============================================================

-- 1. Flýtivísar (Composite Indexes) fyrir <0,005s afköst á 18M línum:
CREATE INDEX IF NOT EXISTS idx_reikningar_dags ON reikningar(dags);
CREATE INDEX IF NOT EXISTS idx_reikningar_stofnun ON reikningar(stofnun);
CREATE INDEX IF NOT EXISTS idx_reikningar_birgir ON reikningar(birgir);
CREATE INDEX IF NOT EXISTS idx_reikningar_dags_stofnun ON reikningar(dags, stofnun);

-- 2. Tafla fyrir verkefnastjórnun í RíkisGát (PostgreSQL 18):
CREATE TABLE IF NOT EXISTS stjorn_verkefni (
    id SERIAL PRIMARY KEY,
    milestone VARCHAR(10) NOT NULL DEFAULT 'M3',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'Rekstur',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    deadline DATE NULL,
    assignee VARCHAR(100) DEFAULT 'Rúnar',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stjorn_milestone ON stjorn_verkefni(milestone);
CREATE INDEX IF NOT EXISTS idx_stjorn_status ON stjorn_verkefni(status);`;

  const backupScript = `:: ============================================================
:: STAÐBUNDIÐ AFRIT ÁN INTERNETS (Fartölva / D: Drif)
:: Vista sem: D:\\afrit_rikisgat\\backup.bat
:: ============================================================
@echo off
set TIMESTAMP=%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_DIR=D:\\afrit_rikisgat
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo [1/2] Tekur staðbundið afrit af PostgreSQL 18 grunninum 'rikisgat'...
"D:\\PostgreSQL\\bin\\pg_dump.exe" -U postgres -h localhost -p 5432 -F c -b -v -f "%BACKUP_DIR%\\rikisgat_%TIMESTAMP%.dump" rikisgat

echo [2/2] Afritun lokið! Skrá: %BACKUP_DIR%\\rikisgat_%TIMESTAMP%.dump
echo Nú geturðu ferðast og unnið án nettengingar með nýjustu gögnin.
pause

:: ============================================================
:: TIL AÐ ENDURHEIMTA AFRIT (Restore) EF ÞARF:
:: "D:\\PostgreSQL\\bin\\pg_restore.exe" -U postgres -h localhost -d rikisgat -v "%BACKUP_DIR%\\rikisgat_xxxx.dump"
:: ============================================================`;

  const cloudScript = `# ============================================================
# SKÝJAHÝSING Í FYRSTA SKIPTI (Node.js + PostgreSQL)
# Staðbundin slóð: D:\\minn-vefthjonn\\minn-server
# ============================================================

# 1. HVERNIG SKÝJAHÝSING LEYSIR FTP AF HÓLMI:
# - Gamli mátinn: Tengjast með FTP/FileZilla og hlaða skrám handvirkt upp.
# - Nýi skýjamátinn: 
#     a) Þú vinnur á fartölvunni í D:\\minn-vefthjonn\\minn-server (með eða án nets).
#     b) Þegar þú ert með net keyrir þú í þeirri möppu:
#          git commit -am "Ný útgáfa af RíkisGát"
#          git push
#     c) Skýjahýsingin (t.d. Render, Railway eða Hetzner) hleður sjálfkrafa
#        niður nýja kóðanum og ræsir vefinn á 60 sekúndum.
#     d) Engin handvirk FTP mistök, engar hálfkláraðar skrár!

# 2. UMHVERFISBREYTUR (D:\\minn-vefthjonn\\minn-server\\.env):

# Á FARTÖLVU (Offline / Localhost á D: drifi):
DATABASE_URL=postgresql://postgres:DITT_LYKILORD@localhost:5432/rikisgat
PORT=3000
NODE_ENV=development

# Í SKÝINU (Production):
# DATABASE_URL=postgresql://rikisgat_user:LEYNORÐ_Í_SKÝI@db.provider.com:5432/rikisgat?sslmode=require
# PORT=3000
# NODE_ENV=production`;

  const verificationScript = `-- ============================================================
-- ATHUGA HVORT RÍKISGÁT SÉ MEÐ ALLT Í POSTGRESQL 18:
-- ============================================================

-- 1. Athuga fjölda raða í öllum töflum:
SELECT 'reikningar' AS tafla, COUNT(*) AS fjoldi FROM reikningar
UNION ALL
SELECT 'birgjar', COUNT(*) FROM birgjar
UNION ALL
SELECT 'stofnanir', COUNT(*) FROM stofnanir;

-- 2. Athuga tímabil og heildartölur:
SELECT 
    MIN(dags) AS elsti_dags,
    MAX(dags) AS nyjasti_dags,
    COUNT(*) AS samtals_reikningar,
    COUNT(DISTINCT stofnun_id) AS virkar_stofnanir,
    COUNT(DISTINCT birgi_id) AS virkir_birgjar
FROM reikningar;

-- 3. Fjöldi og sundurliðun eftir tegund reiknings (tegund):
SELECT 
    COALESCE(tegund, 'Óskilgreint') AS tegund_reiknings,
    COUNT(*) AS fjoldi_linur,
    ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER ()), 2) AS hlutfall_prosent
FROM reikningar
GROUP BY tegund
ORDER BY fjoldi_linur DESC;

-- 4. Athuga hvort einhverjir reikningar vanti stofnun eða birgi:
SELECT COUNT(*) AS vantar_stofnun FROM reikningar r LEFT JOIN stofnanir s ON r.stofnun_id = s.id WHERE s.id IS NULL;
SELECT COUNT(*) AS vantar_birgi FROM reikningar r LEFT JOIN birgjar b ON r.birgi_id = b.id WHERE b.id IS NULL;`;

  const getCurrentScriptContent = () => {
    if (activeScriptTab === 'postgres') return postgresScript;
    if (activeScriptTab === 'verification') return verificationScript;
    if (activeScriptTab === 'backup') return backupScript;
    return cloudScript;
  };

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(getCurrentScriptContent()).then(() => {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    });
  };

  const getStatusBadge = (status: TaskItem['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="bg-neutral-800 text-neutral-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Klárað
          </span>
        );
      case 'in_progress':
        return (
          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-700 animate-pulse" /> Í vinnslu
          </span>
        );
      case 'future':
        return (
          <span className="bg-neutral-100 text-neutral-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
            Framtíð
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-neutral-900 tracking-tight uppercase">
                📋 Verkefnastjóri & Framvinda (Roadmap)
              </h2>
              <span className="bg-neutral-900 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                PostgreSQL 18 & Skýjahýsing
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Hér er verkefnaáætlun RíkisGát: flutningur yfir í skýjahýsingu, Node.js + PostgreSQL 18, og örugg staðbundin afritun fyrir ótengda vinnu.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setShowSqlModal(true)}
              className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-neutral-300"
              title="Skoða PostgreSQL skriftur, afritun án nets og skýjauppsetningu"
            >
              <Database className="w-3.5 h-3.5 text-neutral-700" />
              <span>🐘 Postgres, Ský & Afrit (Scripts)</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Bæta við verkefni
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-neutral-100">
          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
            <span className="text-[10px] font-bold text-neutral-500 uppercase">Heildarfjöldi</span>
            <div className="text-lg font-black text-neutral-900 mt-0.5">{tasks.length} verkefni</div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
            <span className="text-[10px] font-bold text-emerald-700 uppercase">Klárað</span>
            <div className="text-lg font-black text-emerald-800 mt-0.5">{completedCount} ({progressPct}%)</div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
            <span className="text-[10px] font-bold text-amber-700 uppercase">Í vinnslu</span>
            <div className="text-lg font-black text-amber-800 mt-0.5">{inProgressCount} verkefni</div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
            <span className="text-[10px] font-bold text-neutral-500 uppercase">Framtíðaráform</span>
            <div className="text-lg font-black text-neutral-700 mt-0.5">{futureCount} verkefni</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-neutral-900 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 uppercase mr-1">
            <Filter className="w-3.5 h-3.5" /> Sía:
          </div>

          <select
            value={filterMilestone}
            onChange={e => setFilterMilestone(e.target.value)}
            className="p-1.5 bg-neutral-50 border border-neutral-300 rounded text-xs font-semibold"
          >
            <option value="all">Öll áföng (M1–M4)</option>
            <option value="M1">M1: Grunnur & MySQL</option>
            <option value="M2">M2: Lögfræði & Gögn</option>
            <option value="M3">M3: 1984.is Hýsing</option>
            <option value="M4">M4: Sjálfvirkni & Styrkir</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="p-1.5 bg-neutral-50 border border-neutral-300 rounded text-xs font-semibold"
          >
            <option value="all">Allar stöður</option>
            <option value="in_progress">Í vinnslu</option>
            <option value="completed">Klárað</option>
            <option value="future">Framtíð</option>
          </select>

          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="p-1.5 bg-neutral-50 border border-neutral-300 rounded text-xs font-semibold"
          >
            <option value="all">Allir flokkar</option>
            <option value="Rekstur">Rekstur</option>
            <option value="Gagnagrunnur">Gagnagrunnur</option>
            <option value="Bakendi">Bakendi</option>
            <option value="Framendi">Framendi</option>
            <option value="Markaðssetning">Markaðssetning</option>
            <option value="Lögfræði">Lögfræði</option>
          </select>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Leita í verkefnum..."
          className="p-1.5 px-3 bg-neutral-50 border border-neutral-300 rounded text-xs outline-none focus:ring-1 focus:ring-neutral-900 w-full sm:w-56"
        />
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-xl border border-neutral-200 text-neutral-500 text-xs">
            Engin verkefni fundust sem passa við síuna.
          </div>
        ) : (
          filteredTasks.map(task => {
            const isDone = task.status === 'completed';
            return (
              <div
                key={task.id}
                className={`p-4 rounded-xl border transition flex items-start justify-between gap-3.5 bg-white ${
                  isDone ? 'border-neutral-200 opacity-80 hover:opacity-100' : 'border-neutral-300 hover:border-neutral-400 shadow-xs'
                }`}
              >
                <div 
                  onClick={() => onToggleTask(task.id)}
                  className="flex items-start gap-3 cursor-pointer flex-1 min-w-0"
                >
                  <button
                    type="button"
                    className="mt-0.5 text-neutral-900 hover:text-neutral-700 focus:outline-hidden"
                  >
                    {isDone ? (
                      <CheckSquare className="w-5 h-5 text-neutral-900" />
                    ) : (
                      <Square className="w-5 h-5 text-neutral-400" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">
                        {task.milestone}
                      </span>
                      <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded">
                        {task.category}
                      </span>
                      {getStatusBadge(task.status)}
                      {task.priority === 'high' && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                          Háforgangur
                        </span>
                      )}
                      {task.deadline && (
                        <span className="text-[10px] text-neutral-500 flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-neutral-400" /> {task.deadline}
                        </span>
                      )}
                    </div>

                    <h4 className={`text-sm font-bold ${isDone ? 'line-through text-neutral-400' : 'text-neutral-900'}`}>
                      {task.title}
                    </h4>
                    <p className={`text-xs mt-1 leading-relaxed ${isDone ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      {task.desc}
                    </p>
                  </div>
                </div>

                {/* Edit / Delete actions */}
                <div className="flex items-center gap-1 shrink-0 pt-0.5">
                  {onEditTask && (
                    <button
                      onClick={() => setEditingTask(task)}
                      className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded transition cursor-pointer"
                      title="Breyta verkefni"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onDeleteTask && (
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                      title="Eyða verkefni"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Localhost Updates Tracking Card (Vantar að uppfæra á localhost) */}
      <div className="bg-white rounded-xl border border-neutral-900 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-neutral-900" />
              <h3 className="text-sm font-black uppercase tracking-tight text-neutral-900">
                Vantar að uppfæra á localhost
              </h3>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                localhostUpdates.length > 0
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-emerald-100 text-emerald-900 border-emerald-300'
              }`}>
                {localhostUpdates.length} {localhostUpdates.length === 1 ? 'skrá' : 'skrár'}
              </span>
            </div>
            <p className="text-xs text-neutral-600 mt-1">
              Listi yfir skrár sem hafa breyst í kóðanum. Þú getur afritað slóðirnar, uppfært skrárnar á tölvunni þinni og smellt á ruslafötuna eða merkt sem lokið til að taka þær af listanum.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {localhostUpdates.length > 0 && (
              <button
                onClick={handleCopyAllPaths}
                className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-neutral-300"
                title="Afrita lista yfir allar skráarslóðir til að líma í skipanalínu eða ritil"
              >
                {copiedAllPaths ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Allar slóðir afritaðar!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-neutral-700" />
                    <span>Afrita allar slóðir ({localhostUpdates.length})</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleResetLocalhostUpdates}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Samstilla við nýjasta kóða í AI Studio (hlaða öllum 6 uppfærðum skrám inn)"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Samstilla við AI Studio ({INITIAL_LOCALHOST_UPDATES.length} skrár)</span>
            </button>

            {localhostUpdates.length > 0 && (
              <button
                onClick={() => setLocalhostUpdates([])}
                className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-neutral-300"
                title="Hreinsa allar skrár af listanum"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Merkja allt klárað</span>
              </button>
            )}
          </div>
        </div>

        {localhostUpdates.length === 0 ? (
          <div className="py-6 px-4 text-center bg-emerald-50/50 rounded-xl border border-emerald-200 text-emerald-800 text-xs">
            <div className="font-bold text-sm flex items-center justify-center gap-1.5 text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Allt uppfært á localhost!</span>
            </div>
            <p className="mt-1 text-emerald-700 text-[11px]">
              Engar óafgreiddar skrár bíða uppfærslu á vélbúnaði þínum. Nýjar skrár munu bætast sjálfkrafa hér við næstu breytingar.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg overflow-hidden">
            {localhostUpdates.map(upd => (
              <div
                key={upd.id}
                className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-neutral-50/80 transition"
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <FileCode className="w-4 h-4 text-neutral-700 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-neutral-900 break-all bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                        {upd.filePath}
                      </span>
                      {upd.versionLabel && (
                        <span className="text-[10px] font-bold bg-neutral-900 text-white px-1.5 py-0.2 rounded">
                          {upd.versionLabel}
                        </span>
                      )}
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {upd.updatedAt}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                      {upd.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => handleCopyFilePath(upd.filePath)}
                    className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-neutral-200"
                    title="Afrita skráarslóð í klemmuspjald"
                  >
                    {copiedFilePath === upd.filePath ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Afritað!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-neutral-600" />
                        <span>Afrita slóð</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleRemoveLocalhostUpdate(upd.id)}
                    className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer border border-transparent hover:border-red-200"
                    title="Eyða af lista (búið að uppfæra á localhost)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-neutral-200 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <h3 className="text-base font-black text-neutral-900 uppercase tracking-tight">
                Bæta við nýju verkefni í töflu
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-neutral-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Titill verkþáttar:</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded focus:border-neutral-900 outline-none text-sm"
                  placeholder="t.d. Kaupa og stilla SSL á 1984.is..."
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">Nánari lýsing:</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded focus:border-neutral-900 outline-none text-xs"
                  placeholder="Hvað þarf að gera og hvernig er árangur mældur..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Áfangi (Milestone):</label>
                  <select
                    value={newMilestone}
                    onChange={e => setNewMilestone(e.target.value as any)}
                    className="w-full p-2 border border-neutral-300 rounded font-semibold"
                  >
                    <option value="M1">M1: Grunnur & MySQL</option>
                    <option value="M2">M2: Lögfræði & Gögn</option>
                    <option value="M3">M3: 1984.is Hýsing</option>
                    <option value="M4">M4: Sjálfvirkni & Styrkir</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Flokkur:</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full p-2 border border-neutral-300 rounded font-semibold"
                  >
                    <option value="Rekstur">Rekstur</option>
                    <option value="Gagnagrunnur">Gagnagrunnur</option>
                    <option value="Bakendi">Bakendi</option>
                    <option value="Framendi">Framendi</option>
                    <option value="Markaðssetning">Markaðssetning</option>
                    <option value="Lögfræði">Lögfræði</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Forgangur:</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as any)}
                    className="w-full p-2 border border-neutral-300 rounded font-semibold"
                  >
                    <option value="high">Háforgangur (Klára núna)</option>
                    <option value="medium">Miðlungs forgangur</option>
                    <option value="low">Lágur forgangur</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Áætluð lokadagsetning:</label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={e => setNewDeadline(e.target.value)}
                    className="w-full p-2 border border-neutral-300 rounded font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded font-bold cursor-pointer"
                >
                  Hætta við
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded font-bold cursor-pointer"
                >
                  Vista í töflu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && onEditTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-neutral-200 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <h3 className="text-base font-black text-neutral-900 uppercase tracking-tight">
                Breyta verkefni
              </h3>
              <button onClick={() => setEditingTask(null)} className="text-neutral-400 hover:text-neutral-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Titill:</label>
                <input
                  type="text"
                  required
                  value={editingTask.title}
                  onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full p-2 border border-neutral-300 rounded focus:border-neutral-900 outline-none text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">Lýsing:</label>
                <textarea
                  rows={3}
                  value={editingTask.desc}
                  onChange={e => setEditingTask({ ...editingTask, desc: e.target.value })}
                  className="w-full p-2 border border-neutral-300 rounded focus:border-neutral-900 outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Staða:</label>
                  <select
                    value={editingTask.status}
                    onChange={e => setEditingTask({ ...editingTask, status: e.target.value as any })}
                    className="w-full p-2 border border-neutral-300 rounded font-semibold"
                  >
                    <option value="in_progress">Í vinnslu</option>
                    <option value="completed">Klárað</option>
                    <option value="future">Framtíð</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Forgangur:</label>
                  <select
                    value={editingTask.priority || 'medium'}
                    onChange={e => setEditingTask({ ...editingTask, priority: e.target.value as any })}
                    className="w-full p-2 border border-neutral-300 rounded font-semibold"
                  >
                    <option value="high">Hár</option>
                    <option value="medium">Miðlungs</option>
                    <option value="low">Lágur</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded font-bold cursor-pointer"
                >
                  Hætta við
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded font-bold cursor-pointer"
                >
                  Vista breytingar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PostgreSQL, Offline Backup & Cloud Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 border border-neutral-200 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-base font-black text-neutral-900 uppercase tracking-tight flex items-center gap-2">
                  <Database className="w-4 h-4 text-neutral-800" />
                  Gagnagrunnur, Skýjahýsing & Staðbundið Afrit
                </h3>
                <p className="text-xs text-neutral-500">
                  Tilbúnar skriftur fyrir PostgreSQL 18, sjálfvirka afritun án nets og skýjadreifingu með Git.
                </p>
              </div>
              <button onClick={() => setShowSqlModal(false)} className="text-neutral-400 hover:text-neutral-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveScriptTab('verification')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeScriptTab === 'verification' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                <span>🔍 Athuga Gagnagrunn (Staðfesting)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveScriptTab('postgres')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeScriptTab === 'postgres' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                <span>🐘 PostgreSQL 18 (Vísar)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveScriptTab('backup')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeScriptTab === 'backup' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                <span>💾 Staðbundið Afrit (pg_dump)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveScriptTab('cloud')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeScriptTab === 'cloud' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                <span>☁️ Skýjahýsing & Git (.env)</span>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 bg-neutral-900 p-4 rounded-lg text-neutral-200 font-mono text-xs">
              <pre className="whitespace-pre-wrap">{getCurrentScriptContent()}</pre>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-neutral-100">
              <span className="text-[11px] text-neutral-500 font-medium">
                {activeScriptTab === 'postgres' && 'Keyrðu í pgAdmin 4 fyrir leifturhraða'}
                {activeScriptTab === 'backup' && 'Taktu afrit á harða diskinn áður en farið er á ferðalag'}
                {activeScriptTab === 'cloud' && 'Git push uppfærir vefinn sjálfkrafa í skýinu án FTP'}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={copySqlToClipboard}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copiedSql ? 'Afritað!' : 'Afrita skriftu'}
                </button>
                <button
                  onClick={() => setShowSqlModal(false)}
                  className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-xs font-bold cursor-pointer"
                >
                  Loka
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
