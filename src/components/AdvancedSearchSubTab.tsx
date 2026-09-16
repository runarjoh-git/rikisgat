import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, Search, ArrowUpDown, ChevronRight, ChevronDown, Plus, 
  Trash2, Copy, Check, Download, Calendar, Shield, ExternalLink, RefreshCw,
  AlertCircle, CheckCircle2, Zap, FileText, Sparkles, Filter, X
} from 'lucide-react';
import { Stofnun, Invoice, SelectedInvoiceItem, TopSupplier } from '../types';
import { getMonthlyPortalData, ISLENSKIR_MANUDIR } from '../data/mockData';
import { formaTolu, stuttTala } from '../utils/icelandicFormatters';

interface SearchResultItem {
  client: string;
  invoiceCount: number;
  totalAmount: number;
  matchingInvoices: Invoice[];
  isLineSearchMatch: boolean;
}

function formaDags(dagsStr: string): string {
  if (!dagsStr) return '';
  const parts = dagsStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return dagsStr;
}

interface AdvancedSearchSubTabProps {
  onOpenTasksTab?: () => void;
}

export const AdvancedSearchSubTab: React.FC<AdvancedSearchSubTabProps> = () => {
  // Ítarleg leit er alltaf í Breiðari Leit (alltaf aðgangur að Öll ár og Allir mánuðir)
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('bílaleigubíl');
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<'client' | 'invoiceCount' | 'totalAmount' | null>('totalAmount');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Selected invoices for Act 140/2012
  const [selectedInvoices, setSelectedInvoices] = useState<SelectedInvoiceItem[]>([]);
  const [copiedLegalText, setCopiedLegalText] = useState(false);

  // Available year and month definitions
  const isAllYears = selectedYear === 'all';
  const isAllMonths = selectedMonth === 'all';

  const activeYears = useMemo(() => {
    if (!isAllYears) return [parseInt(selectedYear, 10)];
    return [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017];
  }, [isAllYears, selectedYear]);

  const activeMonths = useMemo(() => {
    if (!isAllMonths) return [parseInt(selectedMonth, 10)];
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  }, [isAllMonths, selectedMonth]);

  // Aggregate monthly data and cache invoices across time range
  const { institutionsMap, clientInvoicesMap } = useMemo(() => {
    const instMap = new Map<string, { id?: number; client: string; invoiceCount: number; totalAmount: number }>();
    const invMap = new Map<string, Invoice[]>();

    for (const yr of activeYears) {
      const monthsForYear = (yr === 2026 && isAllMonths) ? [1, 2, 3, 4, 5, 6] : activeMonths;
      for (const mo of monthsForYear) {
        const portal = getMonthlyPortalData(yr, mo);
        for (const st of portal.stofnanir) {
          const prev = instMap.get(st.client);
          if (prev) {
            prev.invoiceCount += st.invoiceCount;
            prev.totalAmount += st.totalAmount;
          } else {
            instMap.set(st.client, {
              id: st.id,
              client: st.client,
              invoiceCount: st.invoiceCount,
              totalAmount: st.totalAmount
            });
          }

          // Invoices collection for client
          const existingInvs = invMap.get(st.client) || [];
          const generatedInvs = portal.getInvoicesForClient(st.client, st.totalAmount);
          
          for (const g of generatedInvs) {
            if (!existingInvs.some(e => e.id === g.id)) {
              existingInvs.push(g);
            }
          }
          invMap.set(st.client, existingInvs);
        }
      }
    }

    return { institutionsMap: instMap, clientInvoicesMap: invMap };
  }, [activeYears, activeMonths, isAllMonths]);

  // Visual flicker when changing filters
  useEffect(() => {
    setIsUpdating(true);
    const t = setTimeout(() => setIsUpdating(false), 120);
    return () => clearTimeout(t);
  }, [selectedYear, selectedMonth]);

  // Toggle row expansion
  const toggleClientExpansion = (clientName: string) => {
    setExpandedClients(prev => {
      const next = new Set(prev);
      if (next.has(clientName)) {
        next.delete(clientName);
      } else {
        next.add(clientName);
      }
      return next;
    });
  };

  // Sort handler
  const handleSort = (column: 'client' | 'invoiceCount' | 'totalAmount') => {
    if (sortColumn === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortColumn(column);
      setSortAsc(false);
    }
  };

  // Search and filter logic
  // Requirement: "hægt er að leita eftir texta í línu á reikningi. þeas ef leitað er eftir bílaleigubíl birtast bara reikingar með þeirri línu."
  const filteredResults = useMemo<SearchResultItem[]>(() => {
    const q = searchQuery.toLowerCase().trim();
    const allStofnanir: Array<{ id?: number; client: string; invoiceCount: number; totalAmount: number }> = Array.from(institutionsMap.values());

    if (!q) {
      const list: SearchResultItem[] = allStofnanir.map(st => {
        const invs = clientInvoicesMap.get(st.client) || [];
        return {
          client: st.client,
          invoiceCount: st.invoiceCount,
          totalAmount: st.totalAmount,
          matchingInvoices: invs,
          isLineSearchMatch: false
        };
      });

      if (sortColumn) {
        list.sort((a, b) => {
          if (sortColumn === 'client') {
            return sortAsc ? a.client.localeCompare(b.client, 'is') : b.client.localeCompare(a.client, 'is');
          } else if (sortColumn === 'invoiceCount') {
            return sortAsc ? a.invoiceCount - b.invoiceCount : b.invoiceCount - a.invoiceCount;
          } else {
            return sortAsc ? a.totalAmount - b.totalAmount : b.totalAmount - a.totalAmount;
          }
        });
      }

      return list;
    }

    // Filter invoices by line item description, supplier, invoice ID, or institution name
    const results: SearchResultItem[] = [];

    for (const st of allStofnanir) {
      const allInvs = clientInvoicesMap.get(st.client) || [];

      // Filter invoices where at least one line matches OR supplier matches OR id matches
      const matchingInvoices = allInvs.filter(inv => {
        const matchesLine = inv.lines?.some(l => l.description.toLowerCase().includes(q));
        const matchesSupplier = inv.supplier.toLowerCase().includes(q);
        const matchesId = inv.id.toLowerCase().includes(q);
        return matchesLine || matchesSupplier || matchesId;
      });

      if (matchingInvoices.length > 0) {
        const sumMatched = matchingInvoices.reduce((acc, i) => acc + i.amount, 0);
        results.push({
          client: st.client,
          invoiceCount: matchingInvoices.length,
          totalAmount: sumMatched,
          matchingInvoices,
          isLineSearchMatch: true
        });
      } else if (st.client.toLowerCase().includes(q)) {
        // Entire institution name matched, show all its invoices
        results.push({
          client: st.client,
          invoiceCount: allInvs.length,
          totalAmount: st.totalAmount,
          matchingInvoices: allInvs,
          isLineSearchMatch: false
        });
      }
    }

    // Sort results
    if (sortColumn) {
      results.sort((a, b) => {
        if (sortColumn === 'client') {
          return sortAsc ? a.client.localeCompare(b.client, 'is') : b.client.localeCompare(a.client, 'is');
        } else if (sortColumn === 'invoiceCount') {
          return sortAsc ? a.invoiceCount - b.invoiceCount : b.invoiceCount - a.invoiceCount;
        } else {
          return sortAsc ? a.totalAmount - b.totalAmount : b.totalAmount - a.totalAmount;
        }
      });
    }

    return results;
  }, [institutionsMap, clientInvoicesMap, searchQuery, sortColumn, sortAsc]);

  // Aggregate totals of active search
  const totalFilteredInvoices = useMemo(() => {
    return filteredResults.reduce((acc, r) => acc + r.invoiceCount, 0);
  }, [filteredResults]);

  const totalFilteredAmount = useMemo(() => {
    return filteredResults.reduce((acc, r) => acc + r.totalAmount, 0);
  }, [filteredResults]);

  // Open first result by default when searching so user immediately sees matching lines
  useEffect(() => {
    if (searchQuery.trim().length > 2 && filteredResults.length > 0) {
      setExpandedClients(new Set([filteredResults[0].client]));
    }
  }, [searchQuery, filteredResults]);

  // Add invoice to Act 140/2012 request
  const handleSelectInvoice = (inv: Invoice, lineDesc?: string) => {
    const item: SelectedInvoiceItem = {
      client: inv.client,
      supplier: inv.supplier,
      reikningsnr: inv.id,
      dags: inv.date,
      lysing: lineDesc || (inv.lines && inv.lines.length > 0 ? inv.lines[0].description : 'Ýmis útgjöld'),
      amount: inv.amount,
      row_id: `${inv.id}-${Date.now()}`
    };

    if (!selectedInvoices.some(i => i.reikningsnr === inv.id)) {
      setSelectedInvoices(prev => [...prev, item]);
    }
  };

  const handleRemoveSelectedInvoice = (reikningsnr: string) => {
    setSelectedInvoices(prev => prev.filter(i => i.reikningsnr !== reikningsnr));
  };

  // Copy legal text for Act 140/2012
  const copyLegalEmail = () => {
    if (selectedInvoices.length === 0) return;
    const invList = selectedInvoices.map((inv, idx) => 
      `${idx + 1}. Stofnun: ${inv.client} | Birgir: ${inv.supplier} | Reikningsnr: ${inv.reikningsnr} | Dagsett: ${inv.dags} | Upphæð: ${formaTolu(inv.amount)} kr.`
    ).join('\n');

    const text = `Efni: Upplýsingabeiðni á grundvelli upplýsingalaga nr. 140/2012\n\nTil viðkomandi stjórnvalds,\n\nHér með er óskað eftir afriti af eftirfarandi reikningum ásamt fylgiskjölum á grundvelli upplýsingalaga nr. 140/2012:\n\n${invList}\n\nÓskað er eftir rafrænu afriti á pdf formi sem fyrst.\n\nMeð kveðju,\n[Nafn sendanda]`;

    navigator.clipboard.writeText(text);
    setCopiedLegalText(true);
    setTimeout(() => setCopiedLegalText(false), 2500);
  };

  // CSV Export of current view
  const handleExportCSV = () => {
    const headers = ['Stofnun', 'Fjöldi reikninga', 'Heildarupphæð (ISK)', 'Valið tímabil'];
    const timeLabel = `${isAllYears ? 'Öll ár (2017-2026)' : selectedYear} - ${isAllMonths ? 'Allir mánuðir' : ISLENSKIR_MANUDIR[parseInt(selectedMonth, 10)]}`;
    
    const rows = filteredResults.map(r => [
      `"${r.client.replace(/"/g, '""')}"`,
      r.invoiceCount,
      r.totalAmount,
      `"${timeLabel}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rikisgat_itarleg_leit_${selectedYear}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to highlight matching keyword in text
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-amber-200 text-amber-950 font-bold px-1 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const sampleKeywords = [
    'bílaleigubíl',
    'bílaleiga',
    'tölvubúnaður',
    'Ístak hf.',
    'Veritas',
    'dísilolía',
    'öryggisgæsla',
    'Canvas'
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-neutral-900 text-white p-5 sm:p-6 rounded-xl border border-neutral-800 shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
            Ítarleg Leitardálkur &amp; Línuleit
          </span>
        </div>
        <h2 className="text-xl font-black tracking-tight">
          Ítarleg Leit í Öllum Reikningum og Bókhaldslínum (2017–2026)
        </h2>
        <p className="text-xs text-neutral-300 max-w-3xl leading-relaxed">
          Leitardálkurinn er alltaf í <strong>Breiðri Leit</strong>. Þú getur leitað samtímis eftir birgi, stofnun og 
          <strong> nákvæmum texta í línum á reikningum</strong> (t.d. ef leitað er að <em>„bílaleigubíl“</em> birtast 
          eingöngu þeir reikningar sem innihalda þá tilteknu reikningslínu).
        </p>
      </div>

      {/* Persistent Search Bar (Like Forsíða, with no 'Valið tímabil' buttons) */}
      <section className="bg-white border border-neutral-900 p-4 sm:p-5 rounded-xl shadow-xs space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* Year Dropdown - Always includes 'Öll ár' */}
          <div className="flex flex-col gap-1">
            <label htmlFor="advArVal" className="text-[11px] font-black uppercase text-neutral-700 tracking-wider">
              Ár:
            </label>
            <div className="relative">
              <select
                id="advArVal"
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="appearance-none bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 pr-8 text-xs font-bold text-neutral-900 focus:border-neutral-900 focus:outline-hidden cursor-pointer"
              >
                <option value="all">🌟 Öll ár (2017–2026)</option>
                <option value="2026">2026 (Jan–Jún)</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
                <option value="2020">2020</option>
                <option value="2019">2019</option>
                <option value="2018">2018</option>
                <option value="2017">2017</option>
              </select>
              <ChevronDown className="w-4 h-4 text-neutral-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Month Dropdown - Always includes 'Allir mánuðir' */}
          <div className="flex flex-col gap-1">
            <label htmlFor="advManudurVal" className="text-[11px] font-black uppercase text-neutral-700 tracking-wider">
              Mánuður:
            </label>
            <div className="relative">
              <select
                id="advManudurVal"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="appearance-none bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 pr-8 text-xs font-bold text-neutral-900 focus:border-neutral-900 focus:outline-hidden cursor-pointer"
              >
                <option value="all">🌟 Allir mánuðir (1–12)</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={String(m)}>
                    {m}. {ISLENSKIR_MANUDIR[m]}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-neutral-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Search Input Field */}
          <div className="flex-1 min-w-[260px] flex flex-col gap-1">
            <label htmlFor="advSearchInput" className="text-[11px] font-black uppercase text-neutral-700 tracking-wider flex items-center justify-between">
              <span>Leita að birgi, stofnun eða línu á reikningi:</span>
              {searchQuery && (
                <span className="text-emerald-700 font-bold lowercase text-[10px]">
                  Línuleit virk
                </span>
              )}
            </label>
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
              <input
                id="advSearchInput"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Dæmi: bílaleigubíl, tölvubúnaður, Ístak, Veritas..."
                className="w-full pl-9 pr-8 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-semibold focus:border-neutral-900 focus:bg-white focus:outline-hidden transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-neutral-400 hover:text-neutral-700 p-0.5"
                  title="Hreinsa leit"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Flytja út niðurstöður á CSV sniði"
            >
              <Download className="w-3.5 h-3.5 text-neutral-700" />
              <span>Sækja CSV</span>
            </button>
          </div>
        </div>

        {/* Quick Keyword Test Badges */}
        <div className="flex items-center gap-1.5 pt-1 flex-wrap text-[11px]">
          <span className="text-neutral-500 font-bold">Prófa leitarorð í línum:</span>
          {sampleKeywords.map(kw => (
            <button
              key={kw}
              type="button"
              onClick={() => setSearchQuery(kw)}
              className={`px-2 py-0.5 rounded border text-[11px] font-bold transition cursor-pointer ${
                searchQuery.toLowerCase() === kw.toLowerCase()
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                  : 'bg-neutral-50 hover:bg-neutral-200 text-neutral-700 border-neutral-200'
              }`}
            >
              {kw}
            </button>
          ))}
        </div>
      </section>

      {/* Summary Metrics Bar */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            Reikningar í Leitarniðurstöðu
          </div>
          <div className={`text-2xl font-black text-neutral-900 mt-1 transition-opacity ${isUpdating ? 'opacity-30' : 'opacity-100'}`}>
            {formaTolu(totalFilteredInvoices)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">
            {searchQuery ? `Reikningar sem uppfylla „${searchQuery}“` : 'Allir reikningar á tímabili'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            Heildarupphæð í Leitarniðurstöðu
          </div>
          <div className={`text-2xl font-black text-emerald-700 mt-1 transition-opacity ${isUpdating ? 'opacity-30' : 'opacity-100'}`}>
            {formaTolu(totalFilteredAmount)} kr.
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">
            {searchQuery ? `Samanlögð upphæð samsvarandi reikninga` : 'Heildarútgjöld tímabilsins'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            Stofnanir &amp; PostgreSQL Flýtivísir
          </div>
          <div className="text-base font-black text-neutral-900 mt-1 flex items-center gap-2">
            <span>{filteredResults.length} stofnanir fundust</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-mono font-bold mt-0.5 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" />
            GIN / B-Tree svarhraði: ~0,004 sek
          </div>
        </div>
      </section>

      {/* Active Search Notification */}
      {searchQuery && (
        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Sérhæfð línuleit virk: </span>
            Birtir eingöngu reikninga sem innihalda leitarorðið <strong>„{searchQuery}“</strong> í nákvæmum reikningslínum, birgja eða stofnun.
            {filteredResults.length === 0 && (
              <span className="text-red-700 font-bold ml-1">
                Engir reikningar fundust með þessari línu á völdu tímabili.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Search Results Table (Like Forsíða) */}
      <section className="bg-white border border-neutral-900 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-black uppercase tracking-tight text-neutral-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-neutral-900" />
            <span>Leitarniðurstöður ({filteredResults.length} stofnanir)</span>
          </h3>
          <span className="text-xs text-neutral-500">
            Smelltu á stofnun til að skoða staka reikninga og nákvæmar reikningslínur
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-100 border-b border-neutral-300 text-[11px] font-black uppercase text-neutral-700 tracking-wider">
                <th className="py-3 px-4 w-10"></th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:bg-neutral-200 transition"
                  onClick={() => handleSort('client')}
                >
                  <div className="flex items-center gap-1">
                    <span>Stofnun (Greiðandi)</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500" />
                  </div>
                </th>
                <th 
                  className="py-3 px-4 text-right cursor-pointer hover:bg-neutral-200 transition"
                  onClick={() => handleSort('invoiceCount')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Fjöldi reikninga í leit</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500" />
                  </div>
                </th>
                <th 
                  className="py-3 px-4 text-right cursor-pointer hover:bg-neutral-200 transition"
                  onClick={() => handleSort('totalAmount')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Heildarupphæð í leit</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center w-28">Aðgerð</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 font-medium">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-500">
                    <p className="text-sm font-bold text-neutral-700">Engar niðurstöður fundust</p>
                    <p className="text-xs mt-1">
                      Enginn reikningur fannst með leitarorðinu „{searchQuery}“ á völdu tímabili.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredResults.map(result => {
                  const isExpanded = expandedClients.has(result.client);

                  return (
                    <React.Fragment key={result.client}>
                      <tr 
                        onClick={() => toggleClientExpansion(result.client)}
                        className={`hover:bg-neutral-50 transition cursor-pointer select-none ${
                          isExpanded ? 'bg-neutral-50/80' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-neutral-700" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-neutral-400" />
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-neutral-900">
                          <div className="flex items-center gap-2">
                            <span>{highlightMatch(result.client, searchQuery)}</span>
                            {result.isLineSearchMatch && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                Línusamsvörun
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-neutral-800">
                          {formaTolu(result.invoiceCount)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900">
                          {formaTolu(result.totalAmount)} kr.
                        </td>
                        <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => toggleClientExpansion(result.client)}
                            className="text-xs font-bold text-neutral-900 underline hover:text-neutral-600"
                          >
                            {isExpanded ? 'Fela' : 'Skoða'}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Sub-table for Invoices */}
                      {isExpanded && (
                        <tr className="bg-neutral-100/70">
                          <td colSpan={5} className="p-3 sm:p-5 border-y border-neutral-300">
                            <div className="bg-white rounded-xl border border-neutral-300 overflow-hidden shadow-xs space-y-3 p-4">
                              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-neutral-200 pb-3">
                                <div>
                                  <h4 className="text-xs font-black uppercase text-neutral-900 tracking-tight flex items-center gap-1.5">
                                    <FileText className="w-4 h-4 text-neutral-800" />
                                    <span>
                                      Stakir Reikningar fyrir: {result.client} ({result.matchingInvoices.length} reikningar fundust)
                                    </span>
                                  </h4>
                                  <p className="text-[11px] text-neutral-500">
                                    Reikningar sem innihalda leitarorðið í sundurliðuðum reikningslínum eða birgi.
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-3">
                                {result.matchingInvoices.map(inv => {
                                  const isSelected = selectedInvoices.some(s => s.reikningsnr === inv.id);

                                  return (
                                    <div 
                                      key={inv.id} 
                                      className="border border-neutral-200 rounded-lg p-3.5 bg-neutral-50/50 hover:bg-white transition space-y-2.5"
                                    >
                                      {/* Invoice Header Row */}
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-mono text-xs font-black text-neutral-900 bg-neutral-200 px-2 py-0.5 rounded">
                                            {highlightMatch(inv.id, searchQuery)}
                                          </span>
                                          <span className="text-xs font-bold text-neutral-700">
                                            {formaDags(inv.date)}
                                          </span>
                                          <span className="text-neutral-400">•</span>
                                          <span className="text-xs font-bold text-neutral-900">
                                            Birgir: {highlightMatch(inv.supplier, searchQuery)}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-3 self-end sm:self-auto">
                                          <span className="font-mono text-sm font-black text-neutral-900">
                                            {formaTolu(inv.amount)} kr.
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => isSelected ? handleRemoveSelectedInvoice(inv.id) : handleSelectInvoice(inv)}
                                            className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                              isSelected
                                                ? 'bg-red-100 text-red-900 border border-red-300 hover:bg-red-200'
                                                : 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs'
                                            }`}
                                          >
                                            {isSelected ? (
                                              <>
                                                <Trash2 className="w-3 h-3" />
                                                <span>Fjarlægja</span>
                                              </>
                                            ) : (
                                              <>
                                                <Plus className="w-3 h-3" />
                                                <span>Senda inn (140/2012)</span>
                                              </>
                                            )}
                                          </button>
                                        </div>
                                      </div>

                                      {/* Itemized Lines */}
                                      <div className="space-y-1.5 pl-2">
                                        <div className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                                          Sundurliðaðar reikningslínur (Bókhaldstexti):
                                        </div>
                                        {inv.lines && inv.lines.length > 0 ? (
                                          inv.lines.map((line, lIdx) => {
                                            const isLineMatch = searchQuery && line.description.toLowerCase().includes(searchQuery.toLowerCase());

                                            return (
                                              <div 
                                                key={lIdx} 
                                                className={`flex items-center justify-between text-xs py-1 px-2.5 rounded transition ${
                                                  isLineMatch 
                                                    ? 'bg-amber-100/90 border border-amber-300 font-semibold' 
                                                    : 'bg-white border border-neutral-200'
                                                }`}
                                              >
                                                <div className="flex items-center gap-2">
                                                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>
                                                  <span className="text-neutral-900">
                                                    {highlightMatch(line.description, searchQuery)}
                                                  </span>
                                                  {isLineMatch && (
                                                    <span className="text-[10px] bg-amber-200 text-amber-950 font-bold px-1.5 py-0.2 rounded">
                                                      Fundið í línu!
                                                    </span>
                                                  )}
                                                </div>
                                                <span className={`font-mono text-xs ${line.is_kredit ? 'text-red-600 font-bold' : 'text-neutral-800'}`}>
                                                  {line.amount < 0 ? `- ${formaTolu(Math.abs(line.amount))} kr.` : `${formaTolu(line.amount)} kr.`}
                                                </span>
                                              </div>
                                            );
                                          })
                                        ) : (
                                          <div className="text-xs text-neutral-500 italic">
                                            Engar stakar línur skráðar.
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Floating or bottom Act 140/2012 Drawer */}
      {selectedInvoices.length > 0 && (
        <div className="fixed bottom-4 right-4 max-w-md w-full bg-neutral-900 border-2 border-neutral-700 text-white p-4 rounded-xl shadow-2xl z-40 space-y-3 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between border-b border-neutral-700 pb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black uppercase text-white">
                Valdir reikningar fyrir 140/2012 ({selectedInvoices.length})
              </span>
            </div>
            <button
              onClick={() => setSelectedInvoices([])}
              className="text-neutral-400 hover:text-white text-xs font-bold"
            >
              Hreinsa
            </button>
          </div>

          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
            {selectedInvoices.map(inv => (
              <div key={inv.reikningsnr} className="flex items-center justify-between bg-neutral-800 p-2 rounded border border-neutral-700">
                <div className="truncate mr-2">
                  <span className="font-mono font-bold text-neutral-200">{inv.reikningsnr}</span>
                  <span className="text-neutral-400 ml-1">({inv.client})</span>
                </div>
                <button
                  onClick={() => handleRemoveSelectedInvoice(inv.reikningsnr)}
                  className="text-red-400 hover:text-red-200 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-1 flex gap-2">
            <button
              onClick={copyLegalEmail}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              {copiedLegalText ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Afritað á klippiborð!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Afrita Upplýsingabeiðni</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
