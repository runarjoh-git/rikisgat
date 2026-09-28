import React, { useState, useMemo, useEffect } from 'react';
import { 
  Layers, ChevronDown, ChevronUp, CheckSquare, Square, 
  Search, Calculator, Sparkles, Filter, X, Copy, Check, Info, 
  ArrowUpRight, Table, ArrowLeftRight, RotateCcw, FileCode
} from 'lucide-react';
import { 
  DETAILED_MACRO_CATEGORIES, 
  DetailedMacroCategory, 
  SubcategoryItem,
  ALL_MACRO_NAMES 
} from '../data/categoryBreakdownData';
import { formaTolu, stuttTala } from '../utils/icelandicFormatters';
import { CategoryMappingTable } from './CategoryMappingTable';

export const CategoryStreamlining: React.FC = () => {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [tableFilterMacro, setTableFilterMacro] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Set af id-um sem eru valin í staðbundna reiknivél
  const [selectedSubIds, setSelectedSubIds] = useState<Set<string>>(new Set());
  
  // Hvaða flokkar eru opnir (dropdown) í kortasýn
  const [expandedMacros, setExpandedMacros] = useState<Record<string, boolean>>({
    'Matur & Veitingar': true,
    'Heilbrigði & Lyf': false,
    'Húsnæði & Almennur Rekstur': false
  });
  
  const [copiedSql, setCopiedSql] = useState(false);
  const [subSearchTerms, setSubSearchTerms] = useState<Record<string, string>>({});

  // Sérsniðnar tilfærslur (itemId -> currentMacro) vistaðar í localStorage
  const [customMappings, setCustomMappings] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('rikisgat_custom_category_mappings');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error('Villa við að sækja customMappings úr localStorage:', e);
      return {};
    }
  });

  const saveMappings = (next: Record<string, string>) => {
    setCustomMappings(next);
    try {
      localStorage.setItem('rikisgat_custom_category_mappings', JSON.stringify(next));
    } catch (e) {
      console.error('Villa við að vista customMappings í localStorage:', e);
    }
  };

  const handleUpdateMapping = (itemId: string, newMacro: string) => {
    const next = { ...customMappings, [itemId]: newMacro };
    saveMappings(next);
  };

  const handleBulkUpdateMappings = (itemIds: string[], newMacro: string) => {
    const next = { ...customMappings };
    itemIds.forEach(id => {
      next[id] = newMacro;
    });
    saveMappings(next);
  };

  const handleResetAllMappings = () => {
    saveMappings({});
  };

  const handleResetSingleMapping = (itemId: string) => {
    const next = { ...customMappings };
    delete next[itemId];
    saveMappings(next);
  };

  // Safna öllum upprunalegum undirtegundum
  const allSubcategoriesWithDefault = useMemo(() => {
    const list: { sub: SubcategoryItem; defaultMacro: string }[] = [];
    DETAILED_MACRO_CATEGORIES.forEach(m => {
      m.subcategories.forEach(s => {
        list.push({
          sub: s,
          defaultMacro: s.defaultMacro || m.name
        });
      });
    });
    return list;
  }, []);

  // Fjöldi tilfærðra tegunda
  const totalMovedCount = useMemo(() => {
    return allSubcategoriesWithDefault.filter(item => {
      const assigned = customMappings[item.sub.id] || item.defaultMacro;
      return assigned !== item.defaultMacro;
    }).length;
  }, [allSubcategoriesWithDefault, customMappings]);

  // Kvik endurreiknun á 12 yfirflokkunum miðað við virkar tilfærslur
  const dynamicMacroCategories = useMemo(() => {
    const totalDatabaseLines = 18167314;

    return DETAILED_MACRO_CATEGORIES.map(m => {
      // Finna allar undirtegundir sem eru núna flokkaðar undir þennan yfirflokk
      const currentSubs = allSubcategoriesWithDefault
        .filter(item => {
          const currentMacro = customMappings[item.sub.id] || item.defaultMacro;
          return currentMacro === m.name;
        })
        .map(item => item.sub);

      const count = currentSubs.length;
      const lines = currentSubs.reduce((acc, s) => acc + s.lines, 0);
      const totalAmountKr = currentSubs.reduce((acc, s) => acc + s.totalAmountKr, 0);
      const pct = Number(((lines / totalDatabaseLines) * 100).toFixed(2));

      // Endurreikna hlutfall af yfirflokki (pctOfMacro)
      const subcategoriesWithPcts = currentSubs.map(s => ({
        ...s,
        pctOfMacro: lines > 0 ? Number(((s.lines / lines) * 100).toFixed(1)) : 0
      }));

      // Athuga hvort einhverjum lið hefur verið bætt við eða tekinn út úr þessum flokki
      const hasCustomMoves = allSubcategoriesWithDefault.some(item => {
        const assigned = customMappings[item.sub.id] || item.defaultMacro;
        return (assigned === m.name && item.defaultMacro !== m.name) ||
               (assigned !== m.name && item.defaultMacro === m.name);
      });

      return {
        ...m,
        count,
        lines,
        totalAmountKr,
        pct,
        subcategories: subcategoriesWithPcts,
        hasCustomMoves
      };
    });
  }, [allSubcategoriesWithDefault, customMappings]);

  const toggleMacroDropdown = (macroName: string) => {
    setExpandedMacros(prev => ({
      ...prev,
      [macroName]: !prev[macroName]
    }));
  };

  const toggleSubcategory = (subId: string) => {
    setSelectedSubIds(prev => {
      const next = new Set(prev);
      if (next.has(subId)) next.delete(subId);
      else next.add(subId);
      return next;
    });
  };

  const selectAllInMacro = (macro: DetailedMacroCategory) => {
    setSelectedSubIds(prev => {
      const next = new Set(prev);
      macro.subcategories.forEach(sub => next.add(sub.id));
      return next;
    });
  };

  const clearMacroSelection = (macro: DetailedMacroCategory) => {
    setSelectedSubIds(prev => {
      const next = new Set(prev);
      macro.subcategories.forEach(sub => next.delete(sub.id));
      return next;
    });
  };

  const clearAllSelections = () => {
    setSelectedSubIds(new Set());
  };

  // Útreikningur á völdum undirflokkum (Staðbundin leit & reiknivél)
  const selectionSummary = useMemo(() => {
    if (selectedSubIds.size === 0) return null;

    let totalLines = 0;
    let totalAmount = 0;
    const selectedItems: { macroName: string; sub: SubcategoryItem }[] = [];

    dynamicMacroCategories.forEach(m => {
      m.subcategories.forEach(s => {
        if (selectedSubIds.has(s.id)) {
          totalLines += s.lines;
          totalAmount += s.totalAmountKr;
          selectedItems.push({ macroName: m.name, sub: s });
        }
      });
    });

    const totalDatabaseLines = 18167314;
    const totalDatabaseAmountEst = 1800000000000; // ~1.800 milljarðar kr.

    const pctOfAllLines = (totalLines / totalDatabaseLines) * 100;
    const pctOfAllAmount = (totalAmount / totalDatabaseAmountEst) * 100;
    const averageInvoice = totalLines > 0 ? Math.round(totalAmount / totalLines) : 0;

    return {
      count: selectedSubIds.size,
      totalLines,
      totalAmount,
      pctOfAllLines,
      pctOfAllAmount,
      averageInvoice,
      items: selectedItems
    };
  }, [selectedSubIds, dynamicMacroCategories]);

  // Síun á yfirflokkum eftir leit í kortasýn
  const filteredCategories = dynamicMacroCategories.filter(c => {
    const term = searchTerm.toLowerCase();
    const matchesMacro = c.name.toLowerCase().includes(term) || c.description.toLowerCase().includes(term);
    const matchesSubs = c.subcategories.some(s => 
      s.name.toLowerCase().includes(term) || (s.code && s.code.toLowerCase().includes(term))
    );
    return matchesMacro || matchesSubs;
  });

  const generateSqlForSelected = () => {
    if (!selectionSummary || selectionSummary.items.length === 0) return '';
    const names = selectionSummary.items.map(it => `'${it.sub.code || it.sub.name.split(' (')[0]}'`).join(',\n    ');
    return `-- ============================================================
-- SÆKJA GÖGN FYRIR VALDA UNDIRFLOKKA (${selectionSummary.count} tegundir):
-- ============================================================
SELECT 
    f.tegund_heiti,
    tf.yfirflokkur,
    COUNT(*) AS fjoldi_reikninga,
    SUM(f.upphaed) AS samtals_upphaed,
    ROUND(AVG(f.upphaed)) AS medalupphaed
FROM fasteignir_reikningar f -- eða aðaltaflan þín (reikningar)
JOIN tegundir_flokkun tf ON f.tegund_heiti = tf.tegund_heiti
WHERE f.tegund_heiti IN (
    ${names}
)
GROUP BY f.tegund_heiti, tf.yfirflokkur
ORDER BY samtals_upphaed DESC;`;
  };

  const copySelectionSql = () => {
    const sql = generateSqlForSelected();
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const openTableForMacro = (macroName: string) => {
    setTableFilterMacro(macroName);
    setViewMode('table');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Mode Selector */}
      <div className="bg-neutral-900 text-white p-6 rounded-xl border border-neutral-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Gagnvirk Staðbundin Leit &amp; Flokkunarkerfi
              </span>
              {totalMovedCount > 0 && (
                <span className="px-2 py-0.5 bg-amber-500 text-neutral-950 font-black text-[10px] rounded-full uppercase tracking-tight">
                  ⚡ {totalMovedCount} tegundir tilfærðar
                </span>
              )}
            </div>
            <h2 className="text-xl font-black tracking-tight mt-1">
              Straumlínulögun á 607 Bókhaldstegundum Ríkisins
            </h2>
            <p className="text-xs text-neutral-300 max-w-2xl mt-1 leading-relaxed">
              Öllum 18.167.314 reikningum hefur verið varpað í 12 yfirflokka. 
              Þú getur skoðað yfirlitsspjöldin eða smellt á <strong>„Tafla yfir allar tegundir“</strong> til að 
              færa staka liði (t.d. <em>Spítalamatur</em>) á milli stóru flokkanna 12 og sækja PostgreSQL SQL skriftu!
            </p>
          </div>

          {/* Sýnarhnappar (View Switcher) */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              onClick={() => { setViewMode('cards'); setTableFilterMacro(null); }}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                viewMode === 'cards'
                  ? 'bg-emerald-600 text-white shadow-emerald-900/30'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>🎴 Kortayfirlit (12 Flokkar)</span>
            </button>

            <button
              onClick={() => { setViewMode('table'); setTableFilterMacro('all'); }}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                viewMode === 'table'
                  ? 'bg-emerald-600 text-white shadow-emerald-900/30'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>📋 Tafla yfir allar tegundir &amp; Færa til</span>
              {totalMovedCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-400 text-neutral-950 font-mono text-[10px] rounded-full font-black">
                  {totalMovedCount}
                </span>
              )}
            </button>

            {selectedSubIds.size > 0 && (
              <button
                onClick={clearAllSelections}
                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ml-1"
              >
                <X className="w-3.5 h-3.5" /> Hreinsa val ({selectedSubIds.size})
              </button>
            )}
          </div>
        </div>

        {/* Informational Sub-banner if items are remapped */}
        {totalMovedCount > 0 && (
          <div className="bg-amber-950/60 border border-amber-500/40 rounded-lg p-3 text-xs text-amber-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Sérsniðin flokkun virk:</strong> {totalMovedCount} tegundir hafa verið færðar á milli flokka. 
                Allar samtölur og hlutföll hér fyrir neðan taka mið af nýju flokkuninni.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setViewMode('table')}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded font-bold text-[11px] cursor-pointer"
              >
                Skoða í töflu
              </button>
              <button
                onClick={handleResetAllMappings}
                className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-amber-200 rounded text-[11px] cursor-pointer"
              >
                Endurstilla allt
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TABLE VIEW: All categories and remapping */}
      {viewMode === 'table' ? (
        <CategoryMappingTable
          customMappings={customMappings}
          onUpdateMapping={handleUpdateMapping}
          onBulkUpdateMappings={handleBulkUpdateMappings}
          onResetAllMappings={handleResetAllMappings}
          onResetSingleMapping={handleResetSingleMapping}
          initialFilterMacro={tableFilterMacro}
          onClose={() => setViewMode('cards')}
        />
      ) : (
        /* CARDS VIEW */
        <>
          {/* FLOATING / TOP CALCULATOR BAR IF ITEMS ARE SELECTED */}
          {selectionSummary && (
            <div className="bg-emerald-900/95 border-2 border-emerald-500 text-white p-4 sm:p-5 rounded-xl shadow-lg transition-all space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-emerald-700/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-700 rounded-lg">
                    <Calculator className="w-5 h-5 text-emerald-200" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
                      Niðurstaða Staðbundinnar Leitar: {selectionSummary.count} undirflokkar valdir
                    </h3>
                    <p className="text-xs text-emerald-200">
                      Samanlögð gögn úr völdum flokkum reiknuð samstundis út frá gagnagrunninum.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copySelectionSql}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSql ? 'SQL afritað!' : 'Afrita SQL fyrir valið'}
                  </button>
                  <button
                    onClick={clearAllSelections}
                    className="p-1.5 text-emerald-300 hover:text-white rounded-lg hover:bg-emerald-800 transition cursor-pointer"
                    title="Hreinsa val"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Key Metric Blocks for Selection */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-emerald-800/60 p-3 rounded-lg border border-emerald-700/50">
                  <div className="text-[10px] uppercase font-bold text-emerald-300">Samanlagt Verð (Áætl.)</div>
                  <div className="text-lg sm:text-xl font-black font-mono text-white mt-0.5">
                    {stuttTala(selectionSummary.totalAmount)}
                  </div>
                  <div className="text-[10px] text-emerald-200 font-mono mt-0.5">
                    {formaTolu(selectionSummary.totalAmount)} kr.
                  </div>
                </div>

                <div className="bg-emerald-800/60 p-3 rounded-lg border border-emerald-700/50">
                  <div className="text-[10px] uppercase font-bold text-emerald-300">Fjöldi Reikninga / Lína</div>
                  <div className="text-lg sm:text-xl font-black font-mono text-emerald-100 mt-0.5">
                    {formaTolu(selectionSummary.totalLines)}
                  </div>
                  <div className="text-[10px] text-emerald-200 mt-0.5 font-medium">
                    af 18.167.314 línum samtals
                  </div>
                </div>

                <div className="bg-emerald-800/60 p-3 rounded-lg border border-emerald-700/50">
                  <div className="text-[10px] uppercase font-bold text-emerald-300">Hlutfall af Ríkisreikningum</div>
                  <div className="text-lg sm:text-xl font-black font-mono text-emerald-300 mt-0.5">
                    {selectionSummary.pctOfAllLines.toFixed(2).replace('.', ',')}%
                  </div>
                  <div className="text-[10px] text-emerald-200 mt-0.5">
                    {selectionSummary.pctOfAllAmount.toFixed(1).replace('.', ',')}% af áætluðu heildarverði
                  </div>
                </div>

                <div className="bg-emerald-800/60 p-3 rounded-lg border border-emerald-700/50">
                  <div className="text-[10px] uppercase font-bold text-emerald-300">Meðalreikningur</div>
                  <div className="text-lg sm:text-xl font-black font-mono text-white mt-0.5">
                    {formaTolu(selectionSummary.averageInvoice)} kr.
                  </div>
                  <div className="text-[10px] text-emerald-200 mt-0.5">á hvern reikning í úrtaki</div>
                </div>
              </div>

              {/* List of active pills with quick remove */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold text-emerald-300 mr-1">Virkt val:</span>
                {selectionSummary.items.map(({ macroName, sub }) => (
                  <span
                    key={sub.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-100 text-[11px] font-medium border border-emerald-600"
                  >
                    <span>{sub.name}</span>
                    <span className="text-emerald-300 font-mono text-[10px]">({formaTolu(sub.lines)})</span>
                    <button
                      onClick={() => toggleSubcategory(sub.id)}
                      className="hover:text-white ml-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
              <div className="text-[11px] font-bold text-neutral-500 uppercase">Upprunaleg heiti í DB</div>
              <div className="text-2xl font-black text-neutral-900 font-mono mt-1">607 tegundir</div>
              <div className="text-[11px] text-neutral-500 mt-0.5">Frá 2017 til 2026</div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
              <div className="text-[11px] font-bold text-neutral-500 uppercase">Aðalflokkar Ríkisgáttar</div>
              <div className="text-2xl font-black text-emerald-700 font-mono mt-1">12 yfirflokkar</div>
              <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                {totalMovedCount > 0 ? `⚡ ${totalMovedCount} liðir endurflokkaðir` : '95,86% flokkað nákvæmlega'}
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
              <div className="text-[11px] font-bold text-neutral-500 uppercase">Stærsti flokkurinn</div>
              <div className="text-2xl font-black text-sky-700 font-mono mt-1">Húsnæði &amp; Rekstur</div>
              <div className="text-[11px] text-sky-700 font-medium mt-0.5">
                {stuttTala(dynamicMacroCategories[0]?.lines || 4898773)} línur ({dynamicMacroCategories[0]?.pct || 26.96}%)
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
              <div className="text-[11px] font-bold text-neutral-500 uppercase">Flokkunarstjórnun</div>
              <button
                onClick={() => { setViewMode('table'); setTableFilterMacro('all'); }}
                className="w-full mt-1.5 py-1.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold flex items-center justify-between cursor-pointer transition shadow-xs"
              >
                <span>Opna flokkunartöflu</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
              </button>
              <div className="text-[10px] text-neutral-400 mt-1">
                Færa tegundir á milli flokka
              </div>
            </div>
          </div>

          {/* Visual Category Distribution */}
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                  <Layers className="w-4 h-4 text-neutral-700" />
                  Dreifing á 18.167.314 Reikningum á Yfirflokka
                </h3>
                <p className="text-xs text-neutral-500">
                  Niðurstöður úr töflunni <code>tegundir_flokkun</code> í PostgreSQL. Opnaðu hvern flokk eða smelltu á töflutakkann til að færa liði.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Leita í flokkum eða lykli..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 w-56"
                  />
                </div>
                <button
                  onClick={() => { setViewMode('table'); setTableFilterMacro('all'); }}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                >
                  <Table className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Skoða töflu</span>
                </button>
              </div>
            </div>

            {/* Multi-segment progress bar */}
            <div className="w-full h-4 bg-neutral-100 rounded-full overflow-hidden flex border border-neutral-200">
              {dynamicMacroCategories.map((c) => (
                <div
                  key={c.name}
                  style={{ width: `${Math.max(c.pct, 0.4)}%` }}
                  className={`${c.color} h-full transition-all duration-300 relative group cursor-pointer`}
                  title={`${c.name}: ${c.pct}% (${formaTolu(c.lines)} línur)`}
                  onClick={() => toggleMacroDropdown(c.name)}
                />
              ))}
            </div>

            {/* Grid of Macro Categories with Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {filteredCategories.map((c) => {
                const isExpanded = !!expandedMacros[c.name];
                const subSearch = (subSearchTerms[c.name] || '').toLowerCase();
                const filteredSubs = c.subcategories.filter(s => 
                  s.name.toLowerCase().includes(subSearch) || (s.code && s.code.toLowerCase().includes(subSearch))
                );
                
                // Reikna hve margir eru valdir í þessum flokki
                const selectedInThisMacro = c.subcategories.filter(s => selectedSubIds.has(s.id)).length;
                const allSelectedInThisMacro = c.subcategories.length > 0 && selectedInThisMacro === c.subcategories.length;

                return (
                  <div 
                    key={c.name} 
                    className={`p-4.5 rounded-xl border transition-all ${
                      selectedInThisMacro > 0 
                        ? 'bg-emerald-50/40 border-emerald-300 shadow-xs' 
                        : 'bg-neutral-50/70 border-neutral-200 hover:border-neutral-300'
                    } space-y-3`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-3.5 h-3.5 rounded-full ${c.color} shrink-0`} />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm text-neutral-900 block leading-tight">{c.name}</span>
                            {c.hasCustomMoves && (
                              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 rounded text-[9px] font-black uppercase tracking-tight">
                                ⚡ Breytt
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-neutral-500 font-medium">
                            Áætlað heildarverð: ~{stuttTala(c.totalAmountKr)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-black text-sm text-neutral-900">{c.pct}%</span>
                        <div className="text-[10px] text-neutral-500 font-mono">{formaTolu(c.lines)} línur</div>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {c.description}
                    </p>

                    {/* DROPDOWN & TABLE TRIGGER BAR */}
                    <div className="pt-2 border-t border-neutral-200/90 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleMacroDropdown(c.name)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                              isExpanded 
                                ? 'bg-neutral-900 text-white shadow-xs' 
                                : 'bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300'
                            }`}
                          >
                            <Layers className="w-3.5 h-3.5 text-emerald-400" />
                            <span>INNIHELDUR ({c.count} TEG.)</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => openTableForMacro(c.name)}
                            className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-900 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-neutral-200"
                            title={`Skoða töflu fyrir ${c.name} og færa tegundir`}
                          >
                            <Table className="w-3 h-3 text-neutral-500" />
                            <span>Skoða töflu</span>
                          </button>
                        </div>

                        {selectedInThisMacro > 0 && (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                            {selectedInThisMacro} af {c.subcategories.length} valið
                          </span>
                        )}
                      </div>

                      {/* PREVIEW PILLS (when collapsed) */}
                      {!isExpanded && (
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {c.subcategories.slice(0, 4).map(sub => {
                            const isMoved = (customMappings[sub.id] || sub.defaultMacro) !== sub.defaultMacro;
                            return (
                              <span 
                                key={sub.id}
                                onClick={() => toggleSubcategory(sub.id)}
                                className={`text-[10px] px-2 py-0.5 rounded border transition cursor-pointer flex items-center gap-1 ${
                                  selectedSubIds.has(sub.id)
                                    ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                                    : isMoved
                                      ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
                                      : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400 font-medium'
                                }`}
                                title="Smelltu til að velja í staðbundna leit"
                              >
                                {isMoved && <span>⚡</span>}
                                <span>{sub.name.split(' (')[0]}</span>
                                <span className="font-mono text-[9px] opacity-75">({formaTolu(sub.lines)})</span>
                              </span>
                            );
                          })}
                          {c.subcategories.length > 4 && (
                            <button
                              onClick={() => toggleMacroDropdown(c.name)}
                              className="text-[10px] text-neutral-500 hover:text-neutral-800 font-bold cursor-pointer ml-1"
                            >
                              +{c.subcategories.length - 4} fleiri...
                            </button>
                          )}
                        </div>
                      )}

                      {/* EXPANDED DROPDOWN LIST WITH CHECKBOXES */}
                      {isExpanded && (
                        <div className="mt-2 bg-white rounded-xl border border-neutral-300 shadow-sm p-3.5 space-y-3">
                          {/* Top actions in dropdown */}
                          <div className="flex items-center justify-between gap-2 pb-2 border-b border-neutral-200">
                            <div className="relative flex-1">
                              <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-neutral-400" />
                              <input
                                type="text"
                                placeholder={`Leita í ${c.name}...`}
                                value={subSearchTerms[c.name] || ''}
                                onChange={(e) => setSubSearchTerms(prev => ({ ...prev, [c.name]: e.target.value }))}
                                className="w-full pl-7 pr-2 py-1 text-[11px] bg-neutral-50 border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900"
                              />
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => openTableForMacro(c.name)}
                                className="text-[11px] font-bold text-neutral-700 hover:text-neutral-900 px-2 py-1 bg-neutral-100 hover:bg-neutral-200 rounded cursor-pointer flex items-center gap-1"
                                title="Færa liði úr þessum flokk"
                              >
                                <ArrowLeftRight className="w-3 h-3 text-neutral-500" />
                                <span>Færa liði</span>
                              </button>
                              <button
                                onClick={() => allSelectedInThisMacro ? clearMacroSelection(c) : selectAllInMacro(c)}
                                className="text-[11px] font-bold text-neutral-700 hover:text-neutral-900 px-2 py-1 bg-neutral-100 hover:bg-neutral-200 rounded cursor-pointer"
                              >
                                {allSelectedInThisMacro ? 'Afvelja alla' : 'Velja alla'}
                              </button>
                            </div>
                          </div>

                          {/* Scrollable list of subcategories */}
                          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 divide-y divide-neutral-100">
                            {filteredSubs.map((sub) => {
                              const isSelected = selectedSubIds.has(sub.id);
                              const isMoved = (customMappings[sub.id] || sub.defaultMacro) !== sub.defaultMacro;
                              const isSpecial = sub.code === 'spítalamatur' || sub.name.toLowerCase().includes('spítala');

                              return (
                                <div
                                  key={sub.id}
                                  className={`pt-1.5 first:pt-0 flex items-center justify-between gap-2 p-1.5 rounded-lg transition ${
                                    isSelected 
                                      ? 'bg-emerald-50 border border-emerald-300' 
                                      : isMoved
                                        ? 'bg-amber-50/70 border border-amber-200'
                                        : isSpecial
                                          ? 'bg-emerald-50/40 border border-emerald-200'
                                          : 'hover:bg-neutral-50 border border-transparent'
                                  }`}
                                >
                                  <div 
                                    onClick={() => toggleSubcategory(sub.id)}
                                    className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                                  >
                                    <div className="text-emerald-700 shrink-0">
                                      {isSelected ? (
                                        <CheckSquare className="w-4 h-4 fill-emerald-600 text-white" />
                                      ) : (
                                        <Square className="w-4 h-4 text-neutral-300" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-xs font-semibold text-neutral-900 truncate flex items-center gap-1.5">
                                        <span>{sub.name}</span>
                                        {sub.code && (
                                          <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-neutral-100 text-neutral-600">
                                            {sub.code}
                                          </span>
                                        )}
                                        {isMoved && (
                                          <span className="px-1 py-0.2 bg-amber-200 text-amber-900 rounded text-[9px] font-black uppercase">
                                            Tilfært
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-neutral-500 flex items-center gap-2">
                                        <span>{formaTolu(sub.lines)} reikningar</span>
                                        <span>•</span>
                                        <span>~{stuttTala(sub.totalAmountKr)}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <div className="text-right">
                                      <span className="text-xs font-mono font-bold text-neutral-800">
                                        {sub.pctOfMacro}%
                                      </span>
                                      <div className="text-[9px] text-neutral-400">af flokki</div>
                                    </div>

                                    {/* Quick move icon */}
                                    <button
                                      onClick={() => openTableForMacro(c.name)}
                                      className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded transition cursor-pointer"
                                      title="Færa þessa tegund í annan flokk"
                                    >
                                      <ArrowLeftRight className="w-3.5 h-3.5 text-neutral-500" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="pt-2 border-t border-neutral-100 text-[10px] text-neutral-500 flex items-center justify-between">
                            <span>Sýnir {filteredSubs.length} af {c.subcategories.length} tegundum</span>
                            <button
                              onClick={() => openTableForMacro(c.name)}
                              className="font-bold text-emerald-700 hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <span>Opna heildartöflu til að færa liði ➔</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
