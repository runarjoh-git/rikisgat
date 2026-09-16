import React, { useState, useMemo } from 'react';
import { 
  Layers, ChevronDown, ChevronUp, CheckSquare, Square, 
  Search, Calculator, Sparkles, Filter, X, Copy, Check, Info, ArrowUpRight
} from 'lucide-react';
import { DETAILED_MACRO_CATEGORIES, DetailedMacroCategory, SubcategoryItem } from '../data/categoryBreakdownData';
import { formaTolu, stuttTala } from '../utils/icelandicFormatters';

export const CategoryStreamlining: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  // Set af id-um sem eru valin
  const [selectedSubIds, setSelectedSubIds] = useState<Set<string>>(new Set());
  // Hvaða flokkar eru opnir (dropdown)
  const [expandedMacros, setExpandedMacros] = useState<Record<string, boolean>>({
    'Húsnæði & Almennur Rekstur': false,
    'Heilbrigði & Lyf': false
  });
  const [copiedSql, setCopiedSql] = useState(false);
  const [subSearchTerms, setSubSearchTerms] = useState<Record<string, string>>({});

  const toggleMacroDropdown = (macroName: string) => {
    setExpandedMacros(prev => ({
      ...prev,
      [macroName]: !prev[macroName]
    }));
  };

  const toggleSubcategory = (subId: string) => {
    setSelectedSubIds(prev => {
      const next = new Set(prev);
      if (next.has(subId)) {
        next.delete(subId);
      } else {
        next.add(subId);
      }
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

  // Útreikningur á völdum undirflokkum (Staðbundin leit & greining)
  const selectionSummary = useMemo(() => {
    if (selectedSubIds.size === 0) return null;

    let totalLines = 0;
    let totalAmount = 0;
    const selectedItems: { macroName: string; sub: SubcategoryItem }[] = [];

    DETAILED_MACRO_CATEGORIES.forEach(m => {
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
  }, [selectedSubIds]);

  // Síun á yfirflokkum eftir leit
  const filteredCategories = DETAILED_MACRO_CATEGORIES.filter(c => {
    const term = searchTerm.toLowerCase();
    const matchesMacro = c.name.toLowerCase().includes(term) || c.description.toLowerCase().includes(term);
    const matchesSubs = c.subcategories.some(s => s.name.toLowerCase().includes(term));
    return matchesMacro || matchesSubs;
  });

  const generateSqlForSelected = () => {
    if (!selectionSummary || selectionSummary.items.length === 0) return '';
    const names = selectionSummary.items.map(it => `'${it.sub.name.split(' (')[0]}'`).join(',\n    ');
    return `-- ============================================================
-- SÆKJA GÖGN FYRIR VALDA UNDIRFLOKKA (${selectionSummary.count} tegundir):
-- ============================================================
SELECT 
    f.tegund_heiti,
    tf.yfirflokkur,
    COUNT(*) AS fjoldi_reikninga,
    SUM(f.upphaed) AS samtals_upphaed,
    ROUND(AVG(f.upphaed)) AS medalupphaed
FROM fasteignir_reikningar f -- eða aðaltaflan þín
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

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-neutral-900 text-white p-6 rounded-xl border border-neutral-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Gagnvirk Staðbundin Leit & Flokkunarkerfi
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight mt-1">
              Straumlínulögun á 607 Bókhaldstegundum Ríkisins
            </h2>
            <p className="text-xs text-neutral-300 max-w-2xl mt-1 leading-relaxed">
              Öllum 18.167.314 reikningum hefur verið varpað í 12 yfirflokka. 
              Smelltu á <strong>„Inniheldur (X teg.)“</strong> til að fella niður dropdown lista, 
              haka við staka eða marga undirflokka og fá samstundis samanlagt verð, hlutfall (%) og línuútreikninga!
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {selectedSubIds.size > 0 && (
              <button
                onClick={clearAllSelections}
                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Hreinsa val ({selectedSubIds.size})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FIXED FLOATING / TOP CALCULATOR BAR IF ITEMS ARE SELECTED */}
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
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">95,86% flokkað nákvæmlega</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
          <div className="text-[11px] font-bold text-neutral-500 uppercase">Stærsti flokkurinn</div>
          <div className="text-2xl font-black text-sky-700 font-mono mt-1">Húsnæði & Rekstur</div>
          <div className="text-[11px] text-sky-700 font-medium mt-0.5">4,90M línur (26,96%)</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
          <div className="text-[11px] font-bold text-neutral-500 uppercase">Annað & Sérhæft</div>
          <div className="text-2xl font-black text-neutral-800 font-mono mt-1">Aðeins 4,14%</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Lækkaði úr 28,24% í 4,14%!</div>
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
              Niðurstöður úr töflunni <code>tegundir_flokkun</code> í PostgreSQL. Opnaðu hvern flokk til að skoða og velja undirflokka.
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Leita í flokkum eða undirheiti..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 w-64"
            />
          </div>
        </div>

        {/* Multi-segment progress bar */}
        <div className="w-full h-4 bg-neutral-100 rounded-full overflow-hidden flex border border-neutral-200">
          {DETAILED_MACRO_CATEGORIES.map((c) => (
            <div
              key={c.name}
              style={{ width: `${c.pct}%` }}
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
            const filteredSubs = c.subcategories.filter(s => s.name.toLowerCase().includes(subSearch));
            
            // Reikna hve margir eru valdir í þessum flokki
            const selectedInThisMacro = c.subcategories.filter(s => selectedSubIds.has(s.id)).length;
            const allSelectedInThisMacro = selectedInThisMacro === c.subcategories.length;

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
                      <span className="font-bold text-sm text-neutral-900 block leading-tight">{c.name}</span>
                      <span className="text-[11px] text-neutral-500 font-medium">Áætlað heildarverð: ~{stuttTala(c.totalAmountKr)}</span>
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

                {/* DROPDOWN TRIGGER BAR */}
                <div className="pt-2 border-t border-neutral-200/90 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
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

                    {selectedInThisMacro > 0 && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                        {selectedInThisMacro} af {c.subcategories.length} valið
                      </span>
                    )}
                  </div>

                  {/* PREVIEW PILLS (when collapsed) */}
                  {!isExpanded && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {c.subcategories.slice(0, 4).map(sub => (
                        <span 
                          key={sub.id}
                          onClick={() => toggleSubcategory(sub.id)}
                          className={`text-[10px] px-2 py-0.5 rounded border transition cursor-pointer ${
                            selectedSubIds.has(sub.id)
                              ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                              : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400 font-medium'
                          }`}
                          title="Smelltu til að velja í staðbundna leit"
                        >
                          {sub.name.split(' (')[0]} ({formaTolu(sub.lines)})
                        </span>
                      ))}
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
                        <div className="flex items-center gap-1 shrink-0">
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
                          return (
                            <div
                              key={sub.id}
                              onClick={() => toggleSubcategory(sub.id)}
                              className={`pt-1.5 first:pt-0 flex items-center justify-between gap-2 p-1.5 rounded-lg cursor-pointer transition ${
                                isSelected 
                                  ? 'bg-emerald-50 border border-emerald-300' 
                                  : 'hover:bg-neutral-50 border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="text-emerald-700 shrink-0">
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 fill-emerald-600 text-white" />
                                  ) : (
                                    <Square className="w-4 h-4 text-neutral-300" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-neutral-900 truncate">
                                    {sub.name}
                                  </div>
                                  <div className="text-[10px] text-neutral-500 flex items-center gap-2">
                                    <span>{formaTolu(sub.lines)} reikningar</span>
                                    <span>•</span>
                                    <span>~{stuttTala(sub.totalAmountKr)}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-xs font-mono font-bold text-neutral-800">
                                  {sub.pctOfMacro}%
                                </span>
                                <div className="text-[9px] text-neutral-400">af flokki</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-2 border-t border-neutral-100 text-[10px] text-neutral-500 flex items-center justify-between">
                        <span>Sýnir {filteredSubs.length} af {c.subcategories.length} tegundum</span>
                        <span className="font-medium text-emerald-700">Smelltu á línu til að haka við</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
