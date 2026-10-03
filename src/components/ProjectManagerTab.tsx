import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Clock, Calendar, Plus, Filter, CheckSquare, Square, 
  Tag, AlertCircle, Trash2, Edit3, Database, Code, Copy, Check, 
  Download, Sparkles, User, ArrowUpDown, ChevronRight, X, Laptop, FileCode, CheckCheck, RefreshCw,
  Mail, Search, Upload, ExternalLink, ShieldCheck, HelpCircle, SlidersHorizontal, FileSpreadsheet
} from 'lucide-react';
import { TaskItem, LocalhostFileUpdate, StofnunEmailItem } from '../types';
import { INITIAL_LOCALHOST_UPDATES, INITIAL_STOFNANIR_EMAILS } from '../data/mockData';
import { ExcelImportSubTab } from './ExcelImportSubTab';
import { AccessManagementSubTab } from './AccessManagementSubTab';
import { GamificationManagementSubTab } from './GamificationManagementSubTab';

const STORAGE_KEY_LOCALHOST_UPDATES = 'rikisgat_localhost_updates_v5';
const STORAGE_KEY_STOFNANIR_EMAILS = 'rikisgat_stofnanir_emails_v1';

interface ProjectManagerTabProps {
  tasks: TaskItem[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (newTask: Omit<TaskItem, 'id'>) => void;
  onDeleteTask?: (taskId: string) => void;
  onEditTask?: (task: TaskItem) => void;
  broadSearchYearsEnabled?: boolean;
  broadSearchMonthsEnabled?: boolean;
  onToggleBroadSearchYears?: (enabled: boolean) => void;
  onToggleBroadSearchMonths?: (enabled: boolean) => void;
  broadSearchEnabled?: boolean;
  onToggleBroadSearch?: (enabled: boolean) => void;
}

export const ProjectManagerTab: React.FC<ProjectManagerTabProps> = ({ 
  tasks, 
  onToggleTask, 
  onAddTask,
  onDeleteTask,
  onEditTask,
  broadSearchYearsEnabled = true,
  broadSearchMonthsEnabled = true,
  onToggleBroadSearchYears,
  onToggleBroadSearchMonths,
  broadSearchEnabled = false,
  onToggleBroadSearch
}) => {
  // Subpage navigation under Verkefnastjóri
  const [activeSubPage, setActiveSubPage] = useState<'tasks' | 'import' | 'emails' | 'access' | 'gamification'>('tasks');

  const [filterMilestone, setFilterMilestone] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [activeScriptTab, setActiveScriptTab] = useState<'postgres' | 'verification' | 'backup' | 'cloud'>('postgres');
  const [copiedSql, setCopiedSql] = useState(false);

  // Stofnanir & Tölvupóstar (Eftirlit og stjórnun) state
  const [stofnanirEmails, setStofnanirEmails] = useState<StofnunEmailItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STOFNANIR_EMAILS);
      if (saved) {
        const parsed: StofnunEmailItem[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map(p => p.id));
        const missing = INITIAL_STOFNANIR_EMAILS.filter(item => !existingIds.has(item.id));
        if (missing.length > 0) {
          return [...parsed, ...missing];
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to load stofnanir emails from localStorage', e);
    }
    return INITIAL_STOFNANIR_EMAILS;
  });

  const [emailFilterStatus, setEmailFilterStatus] = useState<'all' | 'missing' | 'verified'>('missing');
  const [emailSearch, setEmailSearch] = useState('');
  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
  const [tempEmailValue, setTempEmailValue] = useState('');
  const [tempRaduneytiValue, setTempRaduneytiValue] = useState('');
  const [showAddInstModal, setShowAddInstModal] = useState(false);
  const [newInstName, setNewInstName] = useState('');
  const [newInstEmail, setNewInstEmail] = useState('');
  const [newInstRaduneyti, setNewInstRaduneyti] = useState('');

  // Vista stofnanirEmails í localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STOFNANIR_EMAILS, JSON.stringify(stofnanirEmails));
    } catch (e) {
      console.error('Failed to save stofnanir emails', e);
    }
  }, [stofnanirEmails]);

  const handleUpdateEmail = (id: string, email: string, raduneyti?: string) => {
    const trimmed = email.trim();
    setStofnanirEmails(prev => prev.map(item => {
      if (item.id !== id) return item;
      return {
        ...item,
        email: trimmed,
        raduneyti: raduneyti !== undefined ? raduneyti.trim() : item.raduneyti,
        status: trimmed ? 'verified' : 'missing',
        updatedAt: new Date().toISOString().split('T')[0]
      };
    }));
    setEditingEmailId(null);
  };

  const handleAddInstitutionEmail = () => {
    if (!newInstName.trim()) return;
    const newItem: StofnunEmailItem = {
      id: `inst-custom-${Date.now()}`,
      name: newInstName.trim(),
      email: newInstEmail.trim(),
      raduneyti: newInstRaduneyti.trim() || 'Óskráð ráðuneyti',
      status: newInstEmail.trim() ? 'verified' : 'missing',
      source: 'manual',
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setStofnanirEmails(prev => [newItem, ...prev]);
    setNewInstName('');
    setNewInstEmail('');
    setNewInstRaduneyti('');
    setShowAddInstModal(false);
  };

  const handleExportMissingCsv = () => {
    const missing = stofnanirEmails.filter(i => !i.email || i.status === 'missing');
    const header = 'Stofnun;Ráðuneyti;Staða;Tölvupóstur\n';
    const rows = missing.map(i => `"${i.name}";"${i.raduneyti || ''}";"Vantar tölvupóst";""`).join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `stofnanir_vantar_tolvupost_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetStofnanir = () => {
    if (confirm('Viltu endurstilla listann yfir stofnanir og tölvupósta?')) {
      setStofnanirEmails(INITIAL_STOFNANIR_EMAILS);
    }
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
# SKÝJAHÝSING Í FYRSTA SKIPTI: HETZNER CLOUD CAX21 + COOLIFY
# Staðsetning: Helsinki, Finnland (hel1) eða Falkenstein, Þýskaland (fsn1)
# Server gerð: CAX21 (Ampere Altra ARM64, 4 vCPU, 8 GB RAM, 80 GB NVMe SSD)
# Verð: ~€6,00 á mánuði (~900 kr. án vsk)
# ============================================================

# ------------------------------------------------------------
# SKREF 1: STOFNA ÞJÓN HJÁ HETZNER CLOUD
# ------------------------------------------------------------
# 1. Farðu á https://console.hetzner.cloud og skráðu þig inn.
# 2. Smelltu á "+ Add Server":
#    - Location: Helsinki (hel1) [eða Falkenstein (fsn1)]
#    - Image: Ubuntu 24.04 LTS
#    - Type: Arm64 -> CAX21 (4 vCPU, 8 GB RAM, 80 GB NVMe)
#    - SSH Keys: Bættu við þínum opinbera SSH lykli (id_ed25519.pub)
#    - Name: rikisgat-prod
# 3. Smelltu á "Create & Buy Now". Eftir ~10 sekúndur færðu fasta IP-tölu!

# ------------------------------------------------------------
# SKREF 2: TENGJAST MEÐ SSH OG SETJA UPP COOLIFY (EINKA-PAAS)
# ------------------------------------------------------------
# Tengstu þjóninum úr PowerShell eða Terminal:
ssh root@<IP_TALA_THJONS>

# Keyrðu eina opinberu uppsetningarskipun Coolify:
curl -fsSL https://coolify.io/install.sh | bash

# Þegar uppsetningu lýkur (tekur ~2-3 mínútur) opnarðu í vafra:
# http://<IP_TALA_THJONS>:8000
# Þar býrðu til aðalnotanda og lykilorð fyrir Coolify stjórnborðið þitt.

# ------------------------------------------------------------
# SKREF 3: POSTGRESQL 18 GAGNAGRUNNUR Í COOLIFY
# ------------------------------------------------------------
# 1. Inni í Coolify: Smelltu á "Projects" -> "Production" -> "+ New Resource".
# 2. Veldu "PostgreSQL" (Standalone eða Docker).
# 3. Sláðu inn:
#    - Database Name: rikisgat
#    - User: postgres (eða rikisgat_user)
#    - Password: <VELDU_STERKT_LYKILORÐ>
# 4. Vegna þess að CAX21 hefur 8 GB RAM, stilltu Postgres stillingar í Coolify:
#    shared_buffers = '2GB'
#    effective_cache_size = '6GB'
#    work_mem = '64MB'
# 5. Kveiktu á "Automated Backups" (Sjálfvirk dagleg afritun).

# ------------------------------------------------------------
# SKREF 4: FLYTJA GÖGN ÚR D: DRÍFI Á FARTÖLVU YFIR Á HETZNER
# ------------------------------------------------------------
# Á fartölvunni þinni (í PowerShell eða cmd):
# Taktu ferskt afrit af staðbundna grunninum:
"D:\\PostgreSQL\\bin\\pg_dump.exe" -Fc -U postgres -d rikisgat -f "D:\\afrit_rikisgat\\rikisgat_prod.dump"

# Sendu afritið yfir á Hetzner þjóninn með SCP:
scp "D:\\afrit_rikisgat\\rikisgat_prod.dump" root@<IP_TALA_THJONS>:/root/

# Inni á Hetzner þjóninum: Endurheimtu inn í nýja grunninn:
# (Coolify sýnir rétta innri/ytri gátt og tengistreng)
pg_restore -U postgres -d rikisgat -v /root/rikisgat_prod.dump

# ------------------------------------------------------------
# SKREF 5: TENGJA RÍKISGÁT GITHUB REPO VIÐ COOLIFY (GIT PUSH)
# ------------------------------------------------------------
# 1. Inni í Coolify: Smelltu á "+ New Resource" -> "Public/Private Repository".
# 2. Tengdu GitHub reikninginn þinn og veldu Ríkisgát verkefnið.
# 3. Stilltu:
#    - Build Pack: Nixpacks (greinir Node.js sjálfkrafa)
#    - Build Command: npm run build
#    - Start Command: npm run start
#    - Port: 3000
# 4. Umhverfisbreytur (Environment Variables) í Coolify:
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://postgres:LYKILORD@postgres:5432/rikisgat

# 5. Núna þarftu aldrei aftur að nota FTP!
#    Hvert "git push" á GitHub byggir vefinn sjálfkrafa á 60 sekúndum!

# ------------------------------------------------------------
# SKREF 6: TENGJA LÉN (RIKISGAT.IS) OG VIRKJA ÓKEYPIS SSL
# ------------------------------------------------------------
# 1. Í Coolify viðmótinu við Ríkisgát:
#    Sláðu inn Domains: https://rikisgat.is, https://www.rikisgat.is
# 2. Hjá ISNIC eða nafnaþjóni:
#    Búðu til A færslu fyrir @ og www sem bendir á IP tölu Hetzner þjónsins.
# 3. Coolify sækir og endurnýjar sjálfvirkt Let's Encrypt SSL vottorð (HTTPS).`;

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
      {/* Undirsíður undir Verkefnastjóra (Subpage Navigation) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveSubPage('tasks')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubPage === 'tasks'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>📋 Verkefnaáætlun & Framvinda ({tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveSubPage('import')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubPage === 'import'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
          <span>📂 Gagnainnlestur (Excel / CSV)</span>
          <span className="bg-emerald-100 text-emerald-900 text-[10px] px-1.5 py-0.5 rounded font-bold">Nýtt</span>
        </button>

        <button
          onClick={() => setActiveSubPage('emails')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubPage === 'emails'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>📬 Stofnanir & Tölvupóstar ({stofnanirEmails.length})</span>
        </button>

        <button
          onClick={() => setActiveSubPage('access')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubPage === 'access'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          <span>🛡️ Stofnendur & Prufuaðgangar</span>
          <span className="bg-amber-100 text-amber-900 text-[10px] px-1.5 py-0.5 rounded font-bold">Lokað</span>
        </button>

        <button
          onClick={() => setActiveSubPage('gamification')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubPage === 'gamification'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>🎮 Borgaraleikir & Gagnavitund</span>
          <span className="bg-emerald-100 text-emerald-900 text-[10px] px-1.5 py-0.5 rounded font-bold">Nýtt</span>
        </button>
      </div>

      {/* SUBPAGE: Borgaraleikir & Gagnavitund (Gamification) */}
      {activeSubPage === 'gamification' && (
        <GamificationManagementSubTab />
      )}

      {/* SUBPAGE 0: Stofnendur & Prufuaðgangar */}
      {activeSubPage === 'access' && (
        <AccessManagementSubTab />
      )}

      {/* SUBPAGE 1: Gagnainnlestur & Skráaskoðun (Excel / CSV innlestur í PostgreSQL) */}
      {activeSubPage === 'import' && (
        <ExcelImportSubTab />
      )}

      {/* SUBPAGE 2: Verkefnaáætlun & Framvinda */}
      {activeSubPage === 'tasks' && (
        <>
          {/* Stjórntæki fyrir forsíðu: Breiðari leit á forsíðu (Af / Á fyrir ár og mánuð) */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-neutral-900 shadow-xs space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-neutral-900" />
                <h2 className="text-sm font-black uppercase tracking-tight text-neutral-900">
                  Stjórntæki fyrir forsíðu: Breiðari leit á forsíðu (Af / Á)
                </h2>
              </div>
              <p className="text-xs text-neutral-600 max-w-3xl leading-relaxed">
                Stýrir því hvort almenningsvefurinn (forsíðan) bjóði upp á valkosti fyrir öll ár eða alla mánuði í síum. Sé slökkt á rofa takmarkast forsíðan sjálfkrafa við hefðbundna leit í stökum árum eða mánuðum.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Takki 1: Breiðari leit fyrir ÁR */}
              <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/70">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-neutral-900 uppercase">
                      1. Breiðari leit fyrir ár
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      broadSearchYearsEnabled 
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                        : 'bg-neutral-100 text-neutral-600 border-neutral-300'
                    }`}>
                      {broadSearchYearsEnabled ? 'Á (Virk)' : 'Af (Óvirk)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-snug">
                    Býður upp á <strong>„🌟 Öll ár (2017–2026)“</strong> í ársfellilistanum á forsíðu.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={broadSearchYearsEnabled}
                  onClick={() => onToggleBroadSearchYears && onToggleBroadSearchYears(!broadSearchYearsEnabled)}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    broadSearchYearsEnabled ? 'bg-neutral-900' : 'bg-neutral-300'
                  }`}
                  title="Kveikja eða slökkva á „Öll ár“ á forsíðu"
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      broadSearchYearsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Takki 2: Breiðari leit fyrir MÁNUÐI */}
              <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/70">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-neutral-900 uppercase">
                      2. Breiðari leit fyrir mánuð
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      broadSearchMonthsEnabled 
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                        : 'bg-neutral-100 text-neutral-600 border-neutral-300'
                    }`}>
                      {broadSearchMonthsEnabled ? 'Á (Virk)' : 'Af (Óvirk)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-snug">
                    Býður upp á <strong>„🌟 Allir mánuðir (1–12)“</strong> í mánaðarfellilistanum á forsíðu.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={broadSearchMonthsEnabled}
                  onClick={() => onToggleBroadSearchMonths && onToggleBroadSearchMonths(!broadSearchMonthsEnabled)}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    broadSearchMonthsEnabled ? 'bg-neutral-900' : 'bg-neutral-300'
                  }`}
                  title="Kveikja eða slökkva á „Allir mánuðir“ á forsíðu"
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      broadSearchMonthsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

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
            <option value="M1">M1: Grunnur & PostgreSQL 18</option>
            <option value="M2">M2: Ótengd vinna & Lögfræði</option>
            <option value="M3">M3: Hetzner Cloud (CAX21) & Coolify</option>
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
      </>
      )}

      {/* SUBPAGE 3: Stofnanir & Tölvupóstar (Eftirlit og stjórnun) */}
      {(activeSubPage === 'emails' || activeSubPage === 'tasks') && (
      <div className="bg-white rounded-xl border border-neutral-900 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-neutral-900" />
              <h3 className="text-sm font-black uppercase tracking-tight text-neutral-900">
                Stofnanir & Tölvupóstar (Upplýsingalög nr. 140/2012)
              </h3>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                stofnanirEmails.filter(i => !i.email || i.status === 'missing').length > 0
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-emerald-100 text-emerald-900 border-emerald-300'
              }`}>
                {stofnanirEmails.filter(i => !i.email || i.status === 'missing').length} vantar tölvupóst
              </span>
            </div>
            <p className="text-xs text-neutral-600 mt-1">
              Hér er yfirlit yfir allar stofnanir, tilheyrandi ráðuneyti og opinber tölvupóstföng fyrir fyrirspurnir og gagnabeiðnir. Hægt er að skrá og uppfæra tölvupósta beint eða sækja lista yfir þær stofnanir sem vantar.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={handleExportMissingCsv}
              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-neutral-300"
              title="Sækja CSV skrá yfir stofnanir sem vantar tölvupóstfang til að greina og fylla út"
            >
              <Download className="w-3.5 h-3.5 text-neutral-700" />
              <span>Sækja CSV ({stofnanirEmails.filter(i => !i.email || i.status === 'missing').length})</span>
            </button>

            <button
              onClick={() => setShowAddInstModal(true)}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bæta við stofnun</span>
            </button>

            <button
              onClick={handleResetStofnanir}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded transition cursor-pointer border border-neutral-200"
              title="Endurstilla lista í sjálfgefnar stofnanir"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Leitar- og síustika */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={emailSearch}
              onChange={e => setEmailSearch(e.target.value)}
              placeholder="Leita eftir heiti stofnunar eða ráðuneytis..."
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
            {emailSearch && (
              <button
                onClick={() => setEmailSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded border border-neutral-200 shrink-0 text-xs font-semibold">
            <button
              onClick={() => setEmailFilterStatus('missing')}
              className={`px-2.5 py-1 rounded transition ${
                emailFilterStatus === 'missing' 
                  ? 'bg-white text-neutral-900 font-bold shadow-xs' 
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Vantar ({stofnanirEmails.filter(i => !i.email || i.status === 'missing').length})
            </button>
            <button
              onClick={() => setEmailFilterStatus('verified')}
              className={`px-2.5 py-1 rounded transition ${
                emailFilterStatus === 'verified' 
                  ? 'bg-white text-neutral-900 font-bold shadow-xs' 
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Skráð ({stofnanirEmails.filter(i => i.email && i.status !== 'missing').length})
            </button>
            <button
              onClick={() => setEmailFilterStatus('all')}
              className={`px-2.5 py-1 rounded transition ${
                emailFilterStatus === 'all' 
                  ? 'bg-white text-neutral-900 font-bold shadow-xs' 
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Allt ({stofnanirEmails.length})
            </button>
          </div>
        </div>

        {/* Tafla yfir stofnanir */}
        {(() => {
          const filtered = stofnanirEmails.filter(item => {
            const isMissing = !item.email || item.status === 'missing';
            if (emailFilterStatus === 'missing' && !isMissing) return false;
            if (emailFilterStatus === 'verified' && isMissing) return false;
            if (emailSearch.trim()) {
              const q = emailSearch.toLowerCase();
              return item.name.toLowerCase().includes(q) || (item.raduneyti && item.raduneyti.toLowerCase().includes(q)) || (item.email && item.email.toLowerCase().includes(q));
            }
            return true;
          });

          if (filtered.length === 0) {
            return (
              <div className="py-8 px-4 text-center bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-600 text-xs">
                <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
                <div className="font-bold text-neutral-900">
                  {emailFilterStatus === 'missing' ? 'Engar stofnanir á lista vanta tölvupóst!' : 'Engar stofnanir fundust með þessum leitarskilyrðum.'}
                </div>
              </div>
            );
          }

          return (
            <div className="border border-neutral-200 rounded-lg overflow-hidden divide-y divide-neutral-100 max-h-[420px] overflow-y-auto">
              {filtered.map(item => {
                const isMissing = !item.email || item.status === 'missing';
                const isEditing = editingEmailId === item.id;

                return (
                  <div
                    key={item.id}
                    className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-neutral-50/80 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-xs text-neutral-900">
                          {item.name}
                        </span>
                        {item.raduneyti && (
                          <span className="text-[10px] font-medium bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded border border-neutral-200">
                            {item.raduneyti}
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                          isMissing
                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                            : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        }`}>
                          {isMissing ? 'Vantar netfang' : 'Skráð'}
                        </span>
                      </div>

                      {isEditing ? (
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="email"
                            value={tempEmailValue}
                            onChange={e => setTempEmailValue(e.target.value)}
                            placeholder="fyrirspurnir@stofnun.is"
                            className="text-xs px-2 py-1 border border-neutral-300 rounded focus:ring-1 focus:ring-neutral-900 focus:outline-none flex-1 max-w-xs"
                            autoFocus
                          />
                          <input
                            type="text"
                            value={tempRaduneytiValue}
                            onChange={e => setTempRaduneytiValue(e.target.value)}
                            placeholder="Ráðuneyti..."
                            className="text-xs px-2 py-1 border border-neutral-300 rounded focus:ring-1 focus:ring-neutral-900 focus:outline-none flex-1 max-w-xs"
                          />
                          <button
                            onClick={() => handleUpdateEmail(item.id, tempEmailValue, tempRaduneytiValue)}
                            className="px-2.5 py-1 bg-neutral-900 text-white rounded text-xs font-bold hover:bg-neutral-800"
                          >
                            Vista
                          </button>
                          <button
                            onClick={() => setEditingEmailId(null)}
                            className="px-2.5 py-1 bg-neutral-100 text-neutral-700 rounded text-xs font-medium hover:bg-neutral-200"
                          >
                            Hætta við
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          {item.email ? (
                            <a
                              href={`mailto:${item.email}`}
                              className="text-xs font-mono text-neutral-800 hover:text-neutral-950 underline decoration-neutral-300"
                            >
                              {item.email}
                            </a>
                          ) : (
                            <span className="text-xs text-amber-700 italic">
                              Ekkert tölvupóstfang skráð
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => {
                            setEditingEmailId(item.id);
                            setTempEmailValue(item.email || '');
                            setTempRaduneytiValue(item.raduneyti || '');
                          }}
                          className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded text-xs font-medium flex items-center gap-1 transition border border-neutral-200 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3 text-neutral-600" />
                          <span>{item.email ? 'Breyta' : 'Skrá netfang'}</span>
                        </button>
                        {item.email && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.email || '');
                            }}
                            className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded transition cursor-pointer"
                            title="Afrita netfang"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setStofnanirEmails(prev => prev.filter(i => i.id !== item.id));
                          }}
                          className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                          title="Fjarlægja af lista"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
      )}

      {/* Modal: Bæta við nýrri stofnun */}
      {showAddInstModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-neutral-200 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <h3 className="text-base font-black text-neutral-900 uppercase tracking-tight">
                Bæta við stofnun
              </h3>
              <button
                onClick={() => setShowAddInstModal(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Heiti stofnunar *
                </label>
                <input
                  type="text"
                  value={newInstName}
                  onChange={e => setNewInstName(e.target.value)}
                  placeholder="t.d. Rannsóknamiðstöð Íslands"
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Ráðuneyti
                </label>
                <input
                  type="text"
                  value={newInstRaduneyti}
                  onChange={e => setNewInstRaduneyti(e.target.value)}
                  placeholder="t.d. Háskóla-, iðnaðar- og nýsköpunarráðuneytið"
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Tölvupóstfang fyrir fyrirspurnir
                </label>
                <input
                  type="email"
                  value={newInstEmail}
                  onChange={e => setNewInstEmail(e.target.value)}
                  placeholder="t.d. postur@stofnun.is (má vera tómt ef vantar)"
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                onClick={() => setShowAddInstModal(false)}
                className="px-4 py-2 border border-neutral-200 text-neutral-700 rounded text-xs font-bold hover:bg-neutral-50"
              >
                Hætta við
              </button>
              <button
                onClick={handleAddInstitutionEmail}
                disabled={!newInstName.trim()}
                className="px-4 py-2 bg-neutral-900 text-white rounded text-xs font-bold hover:bg-neutral-800 disabled:opacity-50"
              >
                Vista stofnun
              </button>
            </div>
          </div>
        </div>
      )}

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
                    <option value="M1">M1: Grunnur & PostgreSQL 18</option>
                    <option value="M2">M2: Ótengd vinna & Lögfræði</option>
                    <option value="M3">M3: Hetzner Cloud (CAX21) & Coolify</option>
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
                <span>☁️ Hetzner CAX21 & Coolify (.env)</span>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 bg-neutral-900 p-4 rounded-lg text-neutral-200 font-mono text-xs">
              <pre className="whitespace-pre-wrap">{getCurrentScriptContent()}</pre>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-neutral-100">
              <span className="text-[11px] text-neutral-500 font-medium">
                {activeScriptTab === 'postgres' && 'Keyrðu í pgAdmin 4 fyrir leifturhraða'}
                {activeScriptTab === 'backup' && 'Taktu afrit á harða diskinn áður en farið er á ferðalag'}
                {activeScriptTab === 'cloud' && 'Hetzner CAX21 (Finnland/Þýskaland) með Coolify: Git push uppfærir á 60 sekúndum'}
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
