import React, { useState, useMemo } from 'react';
import { 
  Table, Search, ArrowRight, ArrowLeftRight, Check, Copy, 
  RotateCcw, Download, Sparkles, Filter, CheckSquare, Square, 
  ChevronRight, Info, AlertCircle, FileCode, CheckCircle2,
  X, Layers
} from 'lucide-react';
import { 
  DETAILED_MACRO_CATEGORIES, 
  ALL_MACRO_NAMES, 
  MACRO_COLORS, 
  MACRO_BADGES, 
  SubcategoryItem,
  MacroCategoryName
} from '../data/categoryBreakdownData';
import { formaTolu, stuttTala } from '../utils/icelandicFormatters';

export interface FlatCategoryItemWithMacro extends SubcategoryItem {
  currentMacro: string;
  defaultMacro: string;
  isMoved: boolean;
}

interface CategoryMappingTableProps {
  customMappings: Record<string, string>; // item.id -> currentMacro
  onUpdateMapping: (itemId: string, newMacro: string) => void;
  onBulkUpdateMappings: (itemIds: string[], newMacro: string) => void;
  onResetAllMappings: () => void;
  onResetSingleMapping: (itemId: string) => void;
  initialFilterMacro?: string | null;
  onClose?: () => void;
}

export const CategoryMappingTable: React.FC<CategoryMappingTableProps> = ({
  customMappings,
  onUpdateMapping,
  onBulkUpdateMappings,
  onResetAllMappings,
  onResetSingleMapping,
  initialFilterMacro = null,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMacroFilter, setSelectedMacroFilter] = useState<string>(initialFilterMacro || 'all');
  const [filterOnlyMoved, setFilterOnlyMoved] = useState<boolean>(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [bulkTargetMacro, setBulkTargetMacro] = useState<string>('Heilbrigði & Lyf');
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [showSqlModal, setShowSqlModal] = useState<boolean>(false);
  const [sortField, setSortField] = useState<'name' | 'lines' | 'amount' | 'macro'>('lines');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Flatten all items across all 12 categories and calculate their current macro category
  const allItems: FlatCategoryItemWithMacro[] = useMemo(() => {
    const list: FlatCategoryItemWithMacro[] = [];
    DETAILED_MACRO_CATEGORIES.forEach(m => {
      m.subcategories.forEach(sub => {
        const currentMacro = customMappings[sub.id] || sub.defaultMacro || m.name;
        const defaultMacro = sub.defaultMacro || m.name;
        list.push({
          ...sub,
          currentMacro,
          defaultMacro,
          isMoved: currentMacro !== defaultMacro
        });
      });
    });
    return list;
  }, [customMappings]);

  // Statistics
  const totalMovedCount = useMemo(() => {
    return allItems.filter(it => it.isMoved).length;
  }, [allItems]);

  // Count items per current category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_MACRO_NAMES.forEach(m => { counts[m] = 0; });
    allItems.forEach(it => {
      counts[it.currentMacro] = (counts[it.currentMacro] || 0) + 1;
    });
    return counts;
  }, [allItems]);

  // Filtering
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      // Macro filter
      if (selectedMacroFilter !== 'all' && item.currentMacro !== selectedMacroFilter) {
        return false;
      }
      // Moved only
      if (filterOnlyMoved && !item.isMoved) {
        return false;
      }
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCode = (item.code || '').toLowerCase().includes(q);
        const matchesMacro = item.currentMacro.toLowerCase().includes(q);
        const matchesDefault = item.defaultMacro.toLowerCase().includes(q);
        return matchesName || matchesCode || matchesMacro || matchesDefault;
      }
      return true;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name, 'is');
      else if (sortField === 'lines') cmp = a.lines - b.lines;
      else if (sortField === 'amount') cmp = a.totalAmountKr - b.totalAmountKr;
      else if (sortField === 'macro') cmp = a.currentMacro.localeCompare(b.currentMacro, 'is');
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [allItems, selectedMacroFilter, filterOnlyMoved, searchTerm, sortField, sortDirection]);

  // Checkbox selection
  const allFilteredSelected = filteredItems.length > 0 && filteredItems.every(it => selectedItemIds.has(it.id));
  const someFilteredSelected = filteredItems.some(it => selectedItemIds.has(it.id));

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedItemIds(prev => {
        const next = new Set(prev);
        filteredItems.forEach(it => next.delete(it.id));
        return next;
      });
    } else {
      setSelectedItemIds(prev => {
        const next = new Set(prev);
        filteredItems.forEach(it => next.add(it.id));
        return next;
      });
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkMove = () => {
    if (selectedItemIds.size === 0) return;
    const ids = Array.from(selectedItemIds);
    onBulkUpdateMappings(ids, bulkTargetMacro);
    showToast(`Færði ${ids.length} tegundir í „${bulkTargetMacro}“!`);
    setSelectedItemIds(new Set());
  };

  const handleSingleMove = (itemId: string, itemName: string, newMacro: string) => {
    onUpdateMapping(itemId, newMacro);
    showToast(`„${itemName.split(' (')[0]}“ fært í „${newMacro}“`);
  };

  const handleResetSingle = (itemId: string, itemName: string) => {
    onResetSingleMapping(itemId);
    showToast(`Endurstillti „${itemName.split(' (')[0]}“ í upprunalegan flokk`);
  };

  // Generate SQL Script
  const generateSqlScript = () => {
    const movedItems = allItems.filter(it => it.isMoved);
    if (movedItems.length === 0) {
      return `-- Engar tegundir hafa verið færðar til ennþá.
-- Veldu flokk í fellilistanum 'Færa í flokk' til að búa til SQL uppfærsluskriftu.

-- Dæmi um tilfærslu á 'spítalamatur':
UPDATE tegundir_flokkun 
SET yfirflokkur = 'Heilbrigði & Lyf' 
WHERE tegund_heiti = 'spítalamatur';`;
    }

    const updates = movedItems.map(it => {
      const codeOrName = it.code || it.name.split(' (')[0];
      return `UPDATE tegundir_flokkun \nSET yfirflokkur = '${it.currentMacro}' \nWHERE tegund_heiti = '${codeOrName}' OR tegund_heiti ILIKE '%${it.code || codeOrName}%'; -- var í ${it.defaultMacro}`;
    }).join('\n\n');

    return `-- ============================================================================
-- UPPFÆRSLA Á TEGUNDIR_FLOKKUN Í POSTGRESQL (RÍKISGÁT)
-- Fjöldi tilfærðra tegunda: ${movedItems.length}
-- Keyrið þessa skriftu í Query Tool í pgAdmin 4 á gagnagrunninum 'rikisgat'
-- ============================================================================

BEGIN;

${updates}

-- Athuga stöðu eftir uppfærslu:
SELECT yfirflokkur, COUNT(*) AS fjoldi_tegunda
FROM tegundir_flokkun
GROUP BY yfirflokkur
ORDER BY fjoldi_tegunda DESC;

COMMIT;`;
  };

  const copySql = () => {
    const sql = generateSqlScript();
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
    showToast('SQL skrifta afrituð á klippispjald!');
  };

  const downloadSql = () => {
    const sql = generateSqlScript();
    const blob = new Blob([sql], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `02_uppfaera_tegundir_flokkun_${new Date().toISOString().slice(0,10)}.sql`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('02_uppfaera_tegundir_flokkun.sql skrá sótt!');
  };

  const downloadCsv = () => {
    const headers = ['Bókhaldslykill', 'Heiti', 'Núverandi_Yfirflokkur', 'Upprunalegur_Yfirflokkur', 'Er_Breytt', 'Fjoldi_Lina', 'Samtals_Upphaed_Kr', 'Medal_Reikningur_Kr'];
    const rows = allItems.map(it => [
      `"${it.code || ''}"`,
      `"${it.name.replace(/"/g, '""')}"`,
      `"${it.currentMacro}"`,
      `"${it.defaultMacro}"`,
      it.isMoved ? 'JÁ' : 'NEI',
      it.lines,
      it.totalAmountKr,
      it.averageInvoiceKr
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rikisgat_tegundir_flokkun_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV skrá sótt með öllum tegundum!');
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-neutral-700 flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP BAR / CONTROLS */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-neutral-900 text-white rounded-lg">
                <Table className="w-4 h-4" />
              </span>
              <h3 className="text-base font-black text-neutral-900 tracking-tight">
                Heildartafla yfir allar reikningstegundir &amp; Flokkunarstjórnun
              </h3>
            </div>
            <p className="text-xs text-neutral-500 mt-1 max-w-3xl">
              Hér getur þú skoðað allar tegundir og lykla í bókhaldinu, leitað (t.d. að <strong>spítalamatur</strong>), 
              og fært einstaka liði yfir í aðra af 12 aðalflokkunum. Allar samtölur og hlutföll uppfærast samstundis og 
              hægt er að sækja tilbúna SQL skriftu fyrir PostgreSQL.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={copySql}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Afrita SQL fyrir flokkun"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{copiedSql ? 'SQL afritað!' : 'Afrita SQL skriftu'}</span>
            </button>

            <button
              onClick={() => setShowSqlModal(!showSqlModal)}
              className="px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Skoða SQL skriftu"
            >
              <FileCode className="w-3.5 h-3.5 text-blue-600" />
              <span>Skoða SQL</span>
            </button>

            <button
              onClick={downloadCsv}
              className="px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Flytja út í Excel / CSV"
            >
              <Download className="w-3.5 h-3.5 text-neutral-600" />
              <span>CSV útflutningur</span>
            </button>

            {totalMovedCount > 0 && (
              <button
                onClick={() => {
                  if (confirm(`Ertu viss um að vilja afturkalla allar ${totalMovedCount} tilfærslur og fara aftur í sjálfgefna flokkun?`)) {
                    onResetAllMappings();
                    showToast('Allar tilfærslur voru endurstilltar.');
                  }
                }}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Afturkalla allar breytingar"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                <span>Endurstilla allt ({totalMovedCount})</span>
              </button>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition cursor-pointer"
                title="Loka töflu"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* SQL Script Viewer Panel */}
        {showSqlModal && (
          <div className="bg-neutral-900 text-neutral-100 p-4 rounded-xl border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-emerald-400">
                  PostgreSQL Skrifta: 02_uppfaera_tegundir_flokkun.sql ({totalMovedCount} tilfærðar tegundir)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadSql}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  Sækja .sql
                </button>
                <button
                  onClick={copySql}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  Afrita
                </button>
                <button
                  onClick={() => setShowSqlModal(false)}
                  className="text-neutral-400 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <pre className="text-[11px] font-mono p-3 bg-neutral-950 rounded-lg overflow-x-auto text-emerald-300 max-h-56 leading-relaxed">
              {generateSqlScript()}
            </pre>
            <p className="text-[10px] text-neutral-400">
              💡 Afritaðu þessa skriftu og keyrðu í pgAdmin til að vista nýju flokkunina beint í töflunni <code>tegundir_flokkun</code>.
            </p>
          </div>
        )}

        {/* SEARCH AND FILTER BAR */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-neutral-100">
          {/* Search box */}
          <div className="md:col-span-5 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Leita eftir heiti, lykli (t.d. spítalamatur, lyf, bílaleiga)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown Filter */}
          <div className="md:col-span-4">
            <select
              value={selectedMacroFilter}
              onChange={(e) => setSelectedMacroFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 font-medium text-neutral-800"
            >
              <option value="all">Sýna alla 12 yfirflokkana ({allItems.length} tegundir)</option>
              {ALL_MACRO_NAMES.map(m => (
                <option key={m} value={m}>
                  {m} ({categoryCounts[m] || 0} tegundir)
                </option>
              ))}
            </select>
          </div>

          {/* Moved Only Toggle */}
          <div className="md:col-span-3 flex items-center justify-end gap-2">
            <button
              onClick={() => setFilterOnlyMoved(!filterOnlyMoved)}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                filterOnlyMoved 
                  ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                  : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${filterOnlyMoved ? 'text-amber-600' : 'text-neutral-400'}`} />
              <span>Aðeins tilfært ({totalMovedCount})</span>
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <button
            onClick={() => setSelectedMacroFilter('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
              selectedMacroFilter === 'all'
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
            }`}
          >
            Allir flokkar ({allItems.length})
          </button>
          {ALL_MACRO_NAMES.map(m => {
            const isSelected = selectedMacroFilter === m;
            const count = categoryCounts[m] || 0;
            const colorClass = MACRO_COLORS[m] || 'bg-neutral-600';
            return (
              <button
                key={m}
                onClick={() => setSelectedMacroFilter(m)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                  isSelected
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${colorClass}`} />
                <span>{m}</span>
                <span className={`text-[10px] font-mono px-1 rounded ${isSelected ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* BULK ACTION BAR (when items are selected via checkbox) */}
      {selectedItemIds.size > 0 && (
        <div className="bg-neutral-900 text-white p-3.5 rounded-xl border border-neutral-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-500 text-neutral-950 font-black text-xs rounded-md">
              {selectedItemIds.size}
            </span>
            <span className="text-xs font-bold">tegundir valdar til hópaðgerðar</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-300">Færa valdar í:</span>
            <select
              value={bulkTargetMacro}
              onChange={(e) => setBulkTargetMacro(e.target.value)}
              className="py-1 px-2.5 text-xs bg-neutral-800 border border-neutral-700 rounded-lg text-white font-medium focus:outline-none"
            >
              {ALL_MACRO_NAMES.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <button
              onClick={handleBulkMove}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              Framkvæma tilfærslu
            </button>
            <button
              onClick={() => setSelectedItemIds(new Set())}
              className="px-2 py-1 text-neutral-400 hover:text-white text-xs cursor-pointer"
            >
              Hreinsa
            </button>
          </div>
        </div>
      )}

      {/* MAIN DATA TABLE */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-neutral-100 border-b border-neutral-200 text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                <th className="p-3 w-10 text-center">
                  <button
                    onClick={toggleSelectAllFiltered}
                    className="cursor-pointer text-neutral-500 hover:text-neutral-900"
                    title={allFilteredSelected ? 'Afvelja allar' : 'Velja allar í síu'}
                  >
                    {allFilteredSelected ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : someFilteredSelected ? (
                      <div className="w-4 h-4 border-2 border-emerald-600 bg-emerald-100 rounded-xs" />
                    ) : (
                      <Square className="w-4 h-4 text-neutral-400" />
                    )}
                  </button>
                </th>
                <th 
                  className="p-3 cursor-pointer hover:bg-neutral-200/70 transition"
                  onClick={() => {
                    if (sortField === 'name') setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                    else { setSortField('name'); setSortDirection('asc'); }
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span>Tegundarheiti &amp; Bókhaldslykill</span>
                    {sortField === 'name' && <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                  </div>
                </th>
                <th 
                  className="p-3 cursor-pointer hover:bg-neutral-200/70 transition"
                  onClick={() => {
                    if (sortField === 'macro') setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                    else { setSortField('macro'); setSortDirection('asc'); }
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span>Núverandi Yfirflokkur</span>
                    {sortField === 'macro' && <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                  </div>
                </th>
                <th 
                  className="p-3 text-right cursor-pointer hover:bg-neutral-200/70 transition"
                  onClick={() => {
                    if (sortField === 'lines') setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                    else { setSortField('lines'); setSortDirection('desc'); }
                  }}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Fjöldi Lína</span>
                    {sortField === 'lines' && <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                  </div>
                </th>
                <th 
                  className="p-3 text-right cursor-pointer hover:bg-neutral-200/70 transition"
                  onClick={() => {
                    if (sortField === 'amount') setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                    else { setSortField('amount'); setSortDirection('desc'); }
                  }}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Áætl. Upphæð</span>
                    {sortField === 'amount' && <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                  </div>
                </th>
                <th className="p-3 text-right">Meðalreikningur</th>
                <th className="p-3 text-center min-w-[210px]">
                  Færa í annan flokk (Aðgerð)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500">
                    <div className="max-w-md mx-auto space-y-2">
                      <p className="text-sm font-bold text-neutral-700">Engar tegundir fundust með leitarskilyrðum</p>
                      <p className="text-xs text-neutral-500">
                        Prófaðu að breyta leitarorði eða velja „Allir flokkar“.
                      </p>
                      <button
                        onClick={() => { setSearchTerm(''); setSelectedMacroFilter('all'); setFilterOnlyMoved(false); }}
                        className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 rounded text-xs font-bold text-neutral-700"
                      >
                        Hreinsa allar síur
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = selectedItemIds.has(item.id);
                  const isSpecial = item.code === 'spítalamatur' || item.name.toLowerCase().includes('spítala');
                  const macroBadge = MACRO_BADGES[item.currentMacro] || 'bg-neutral-100 text-neutral-800 border-neutral-200';
                  const macroDot = MACRO_COLORS[item.currentMacro] || 'bg-neutral-600';

                  return (
                    <tr 
                      key={item.id}
                      className={`hover:bg-neutral-50/90 transition ${
                        item.isMoved 
                          ? 'bg-amber-50/40 font-medium' 
                          : isSpecial 
                            ? 'bg-emerald-50/30' 
                            : ''
                      } ${isSelected ? 'bg-emerald-50/70' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => toggleSelectItem(item.id)}
                          className="cursor-pointer text-neutral-400 hover:text-neutral-700"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-neutral-300" />
                          )}
                        </button>
                      </td>

                      {/* Name & Code */}
                      <td className="p-3">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-neutral-900">
                              {item.name}
                            </span>
                            {item.code && (
                              <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-bold ${
                                isSpecial 
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                  : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                              }`}>
                                lykill: {item.code}
                              </span>
                            )}
                            {item.isMoved && (
                              <span className="px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded text-[9px] font-black uppercase tracking-tight">
                                Breytt flokkun
                              </span>
                            )}
                          </div>
                          {item.isMoved && (
                            <div className="text-[10px] text-amber-800 flex items-center gap-1 mt-0.5">
                              <span>Upprunalega:</span>
                              <span className="font-semibold underline">{item.defaultMacro}</span>
                              <button
                                onClick={() => handleResetSingle(item.id, item.name)}
                                className="ml-1 text-amber-700 hover:text-amber-950 underline font-bold cursor-pointer"
                                title="Afturkalla í upprunalegan flokk"
                              >
                                [Afturkalla]
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Current Macro */}
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${macroBadge}`}>
                          <span className={`w-2 h-2 rounded-full ${macroDot}`} />
                          <span>{item.currentMacro}</span>
                        </span>
                      </td>

                      {/* Lines */}
                      <td className="p-3 text-right">
                        <span className="font-mono font-bold text-neutral-900">
                          {formaTolu(item.lines)}
                        </span>
                        <div className="text-[10px] text-neutral-400">
                          {((item.lines / 18167314) * 100).toFixed(2)}% af heild
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="p-3 text-right">
                        <span className="font-mono font-bold text-neutral-900">
                          ~{stuttTala(item.totalAmountKr)}
                        </span>
                        <div className="text-[10px] text-neutral-400 font-mono">
                          {formaTolu(item.totalAmountKr)} kr.
                        </div>
                      </td>

                      {/* Average */}
                      <td className="p-3 text-right font-mono text-neutral-700">
                        {formaTolu(item.averageInvoiceKr)} kr.
                      </td>

                      {/* Actions: Move to Another Category */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <select
                            value={item.currentMacro}
                            onChange={(e) => handleSingleMove(item.id, item.name, e.target.value)}
                            className={`py-1 px-2 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-neutral-900 font-medium cursor-pointer transition ${
                              item.isMoved 
                                ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold' 
                                : 'bg-white border-neutral-300 text-neutral-800 hover:border-neutral-400'
                            }`}
                          >
                            {ALL_MACRO_NAMES.map(m => (
                              <option key={m} value={m}>
                                {m} {m === item.defaultMacro ? ' (sjálfgefið)' : ''}
                              </option>
                            ))}
                          </select>

                          {item.isMoved && (
                            <button
                              onClick={() => handleResetSingle(item.id, item.name)}
                              className="p-1 text-neutral-400 hover:text-amber-700 rounded hover:bg-neutral-100 transition cursor-pointer"
                              title="Endurstilla í sjálfgefið"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="p-3 bg-neutral-50 border-t border-neutral-200 text-xs text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Sýnir <strong className="text-neutral-800">{filteredItems.length}</strong> af <strong className="text-neutral-800">{allItems.length}</strong> bókhaldstegundum
            {totalMovedCount > 0 && (
              <span className="ml-2 font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                ⚡ {totalMovedCount} tegundir hafa verið færðar
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-neutral-400">
              Breytingar vistast sjálfkrafa í vafranum (localStorage).
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
