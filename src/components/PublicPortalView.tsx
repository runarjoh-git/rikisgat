import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, Search, ArrowUpDown, ChevronRight, ChevronDown, Plus, 
  Trash2, Copy, Check, Download, Calendar, Shield, ExternalLink, RefreshCw,
  AlertCircle, CheckCircle2, Globe2, Database
} from 'lucide-react';
import { Stofnun, Invoice, SelectedInvoiceItem, TopSupplier } from '../types';
import { getMonthlyPortalData, ISLENSKIR_MANUDIR } from '../data/mockData';
import { formaTolu, stuttTala, talaITexta, fjoldiITexta } from '../utils/icelandicFormatters';
import { DbStatusResponse, checkDbStatus, fetchInstitutionsFromDb, fetchInvoicesFromDb, fetchOverviewFromDb, OverviewApiResponse, RealInvoiceRow } from '../services/api';
import { DbConnectionModal } from './DbConnectionModal';

const ALL_YEARS_LIST = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017'];
const ALL_MONTHS_NUMS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

interface PublicPortalViewProps {
  onOpenDashboard: () => void;
  broadSearchEnabled?: boolean;
}

export const PublicPortalView: React.FC<PublicPortalViewProps> = ({ 
  onOpenDashboard,
  broadSearchEnabled = false
}) => {
  const [selectedYear, setSelectedYear] = useState<string>('2025');
  const [selectedMonth, setSelectedMonth] = useState<string>('1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePeriod, setActivePeriod] = useState<'year' | 'month' | 'week' | 'day'>('month');
  
  // Expanded client rows (set of client names)
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

  // Sorting - null means keep the randomized/shuffled order per month/year
  const [sortColumn, setSortColumn] = useState<'client' | 'invoiceCount' | 'totalAmount' | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Simulated update feedback state
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // If broad search is disabled, make sure 'all' is reverted to valid defaults
  useEffect(() => {
    if (!broadSearchEnabled) {
      if (selectedYear === 'all') setSelectedYear('2025');
      if (selectedMonth === 'all') setSelectedMonth('1');
    }
  }, [broadSearchEnabled, selectedYear, selectedMonth]);

  // Trigger brief visual feedback when year or month changes, reset sort column so the new month's shuffle takes effect
  useEffect(() => {
    setIsUpdating(true);
    setSortColumn(null); // Return to month-specific randomized order when period changes
    const timer = setTimeout(() => setIsUpdating(false), 120);
    return () => clearTimeout(timer);
  }, [selectedYear, selectedMonth, broadSearchEnabled]);

  // Is "All years" and/or "All months" selected?
  const isAllYears = selectedYear === 'all';
  const isAllMonths = selectedMonth === 'all';

  // Compute the years and months to iterate over
  const activeYears = useMemo(() => {
    if (isAllYears) return ALL_YEARS_LIST;
    return [selectedYear];
  }, [isAllYears, selectedYear]);

  const activeMonths = useMemo(() => {
    if (isAllMonths) return ALL_MONTHS_NUMS;
    return [selectedMonth];
  }, [isAllMonths, selectedMonth]);

  // Dynamically generated portal data: aggregated across all active years & months
  const monthlyData = useMemo(() => {
    // If standard single year & single month, use getMonthlyPortalData directly
    if (!isAllYears && !isAllMonths) {
      return getMonthlyPortalData(selectedYear, selectedMonth);
    }

    // Otherwise aggregate across combinations
    const clientTotalsMap = new Map<string, { id: number; client: string; invoiceCount: number; totalAmount: number }>();
    const clientInvoicesMap = new Map<string, Invoice[]>();

    let totalSum = 0;
    let anyFuture = false;

    for (const yr of activeYears) {
      for (const mo of activeMonths) {
        const d = getMonthlyPortalData(yr, mo);
        if (d.isFutureOrUnpublished) anyFuture = true;

        for (const st of d.stofnanir) {
          totalSum += st.totalAmount;
          const current = clientTotalsMap.get(st.client);
          if (!current) {
            clientTotalsMap.set(st.client, {
              id: st.id,
              client: st.client,
              invoiceCount: st.invoiceCount,
              totalAmount: st.totalAmount
            });
          } else {
            current.invoiceCount += st.invoiceCount;
            current.totalAmount += st.totalAmount;
          }

          // Accumulate sample invoices
          const invs = d.getInvoicesForClient(st.client, st.totalAmount);
          const existingInvs = clientInvoicesMap.get(st.client) || [];
          if (existingInvs.length < 60) {
            const combined = [...existingInvs];
            for (const inv of invs) {
              if (!combined.some(c => c.id === inv.id) && combined.length < 60) {
                combined.push(inv);
              }
            }
            clientInvoicesMap.set(st.client, combined);
          }
        }
      }
    }

    const aggregatedStofnanir = Array.from(clientTotalsMap.values());

    // Sort institutions by totalAmount descending by default
    aggregatedStofnanir.sort((a, b) => b.totalAmount - a.totalAmount);

    let labelMonthName = 'Allir mánuðir';
    if (!isAllMonths) {
      labelMonthName = ISLENSKIR_MANUDIR[Number(selectedMonth)] || `Mánuður ${selectedMonth}`;
    }

    let topSuppliersYearInfo = 'Topp birgjar';
    if (isAllYears && isAllMonths) topSuppliersYearInfo = 'Topp 5 birgjar allra ára (2017–2026)';
    else if (isAllYears) topSuppliersYearInfo = `Topp 5 birgjar í ${labelMonthName} á öllum árum (2017–2026)`;
    else if (isAllMonths) topSuppliersYearInfo = `Topp 5 birgjar alls ársins ${selectedYear}`;
    else topSuppliersYearInfo = `Topp 5 birgjar í ${labelMonthName} ${selectedYear}`;

    return {
      year: isAllYears ? 0 : Number(selectedYear),
      month: isAllMonths ? 0 : Number(selectedMonth),
      monthName: labelMonthName,
      isFutureOrUnpublished: anyFuture && !isAllYears,
      stofnanir: aggregatedStofnanir,
      topSuppliers: {
        month: {
          info: topSuppliersYearInfo,
          suppliers: [
            { supplier: 'Veritas heildsala hf.', total: Math.round(totalSum * 0.082) },
            { supplier: 'Ístak hf.', total: Math.round(totalSum * 0.075) },
            { supplier: 'Origo hf.', total: Math.round(totalSum * 0.041) },
            { supplier: 'Advania Ísland ehf.', total: Math.round(totalSum * 0.036) },
            { supplier: 'Olíuverzlun Íslands hf.', total: Math.round(totalSum * 0.029) }
          ]
        },
        year: {
          info: topSuppliersYearInfo,
          suppliers: [
            { supplier: 'Ístak hf.', total: Math.round(totalSum * 0.078) },
            { supplier: 'Veritas heildsala hf.', total: Math.round(totalSum * 0.075) },
            { supplier: 'Advania Ísland ehf.', total: Math.round(totalSum * 0.041) },
            { supplier: 'Origo hf.', total: Math.round(totalSum * 0.038) },
            { supplier: 'Olíuverzlun Íslands hf.', total: Math.round(totalSum * 0.031) }
          ]
        },
        week: {
          info: 'Hæstu birgjar (meðalvika)',
          suppliers: [
            { supplier: 'Ístak hf.', total: Math.round(totalSum * 0.025) },
            { supplier: 'Veritas heildsala hf.', total: Math.round(totalSum * 0.022) },
            { supplier: 'Origo hf.', total: Math.round(totalSum * 0.014) },
            { supplier: 'Advania Ísland ehf.', total: Math.round(totalSum * 0.012) },
            { supplier: 'Skeljungur hf.', total: Math.round(totalSum * 0.009) }
          ]
        },
        day: {
          info: 'Hæstu birgjar (meðaldagur)',
          suppliers: [
            { supplier: 'Veritas heildsala hf.', total: Math.round(totalSum * 0.015) },
            { supplier: 'Ístak hf.', total: Math.round(totalSum * 0.013) },
            { supplier: 'Origo hf.', total: Math.round(totalSum * 0.008) },
            { supplier: 'Skeljungur hf.', total: Math.round(totalSum * 0.006) },
            { supplier: 'Advania Ísland ehf.', total: Math.round(totalSum * 0.005) }
          ]
        }
      },
      getInvoicesForClient: (clientName: string, clientTotal?: number) => {
        const stored = clientInvoicesMap.get(clientName);
        if (stored && stored.length > 0) return stored;
        const refYear = isAllYears ? '2025' : selectedYear;
        const refMonth = isAllMonths ? '1' : selectedMonth;
        return getMonthlyPortalData(refYear, refMonth).getInvoicesForClient(clientName, clientTotal);
      }
    };
  }, [isAllYears, isAllMonths, selectedYear, selectedMonth, activeYears, activeMonths]);

  // Dynamic quick-year list in the requested order:
  // Ef valið er 2024 Júní: [2025, 2024, 2023, 2022] (1 ár upp og 2-3 niður, samtals 4 ár í röð frá hæsta til lægsta)
  // Ef valið er nýjasta árið (2026): [2026, 2025, 2024, 2023] (árinu sem er og 3 fyrri ár)
  const quickYears = useMemo(() => {
    const currentYear = isAllYears ? 2025 : (parseInt(selectedYear, 10) || 2025);
    const MAX_YEAR = 2026;
    const MIN_YEAR = 2017;

    let targetYears: number[] = [];

    if (currentYear >= MAX_YEAR) {
      targetYears = [2026, 2025, 2024, 2023];
    } else {
      const upYear = currentYear + 1;
      targetYears = [upYear, currentYear, currentYear - 1, currentYear - 2];
      
      // Tryggja að engin tala fari undir MIN_YEAR
      targetYears = targetYears.map(y => Math.max(MIN_YEAR, y));
      // Taka einstök gildi ef komið er á endimörk
      targetYears = Array.from(new Set(targetYears));
      while (targetYears.length < 4 && Math.max(...targetYears) < MAX_YEAR) {
        targetYears.unshift(Math.max(...targetYears) + 1);
      }
    }

    return targetYears.filter(y => y >= MIN_YEAR && y <= MAX_YEAR);
  }, [selectedYear, isAllYears]);

  // Selected invoices for Act 140/2012 - starts empty by default
  const [selectedInvoices, setSelectedInvoices] = useState<SelectedInvoiceItem[]>([]);
  const [copiedLegalText, setCopiedLegalText] = useState(false);

  // Per-client in-drawer search filters and display limits
  const [clientFilterQueries, setClientFilterQueries] = useState<Record<string, string>>({});
  const [clientVisibleLimits, setClientVisibleLimits] = useState<Record<string, number>>({});

  // Real-time PostgreSQL database state and live query results
  const [dbStatus, setDbStatus] = useState<DbStatusResponse | null>(null);
  const [dbOverview, setDbOverview] = useState<OverviewApiResponse | null>(null);
  const [showDbModal, setShowDbModal] = useState(false);
  const [dbInstitutions, setDbInstitutions] = useState<Array<{ id: number; client: string; invoiceCount: number; totalAmount: number }> | null>(null);
  const [dbInvoicesCache, setDbInvoicesCache] = useState<Record<string, Invoice[]>>({});
  const [dbSearchResults, setDbSearchResults] = useState<RealInvoiceRow[] | null>(null);
  const [isLoadingDb, setIsLoadingDb] = useState(false);

  // Check DB status and overview on mount
  useEffect(() => {
    checkDbStatus().then(status => {
      setDbStatus(status);
      if (status.connected) {
        fetchOverviewFromDb().then(ov => {
          if (ov && ov.source === 'postgres') {
            setDbOverview(ov);
            // If the selected year is not among available years (e.g. 2026), default to newest real year
            if (ov.availableYears && ov.availableYears.length > 0 && !ov.availableYears.includes(selectedYear)) {
              setSelectedYear(ov.availableYears[0]);
            }
          }
        });
      }
    });
  }, []);

  // Fetch institutions when year/month or connection status changes
  useEffect(() => {
    if (dbStatus?.connected) {
      setIsLoadingDb(true);
      fetchInstitutionsFromDb(selectedYear, selectedMonth).then(res => {
        if (res.rows && res.rows.length > 0) {
          setDbInstitutions(res.rows);
        } else {
          // If no rows found in DB for this period (e.g. 2026 has 0 records), keep it empty instead of falling back to fake data!
          setDbInstitutions([]);
        }
      }).catch(() => {
        setDbInstitutions([]);
      }).finally(() => setIsLoadingDb(false));
    } else {
      setDbInstitutions(null);
    }
  }, [selectedYear, selectedMonth, dbStatus?.connected]);

  // Fetch real invoices from PostgreSQL for expanded clients
  useEffect(() => {
    if (dbStatus?.connected && expandedClients.size > 0) {
      for (const clientName of expandedClients) {
        if (!dbInvoicesCache[clientName]) {
          fetchInvoicesFromDb({
            client: clientName,
            year: selectedYear,
            month: selectedMonth,
            limit: 150
          }).then(res => {
            if (res.rows && res.rows.length > 0) {
              setDbInvoicesCache(prev => ({
                ...prev,
                [clientName]: res.rows.map(r => ({
                  id: r.id,
                  client: clientName,
                  supplier: r.supplier,
                  amount: r.amount,
                  date: r.date,
                  lines: (r.lines || []).map(l => ({
                    description: l.description,
                    amount: l.amount,
                    is_kredit: l.is_kredit ?? (l.amount < 0)
                  }))
                }))
              }));
            }
          });
        }
      }
    }
  }, [expandedClients, dbStatus?.connected, selectedYear, selectedMonth, dbInvoicesCache]);

  // Real-time PostgreSQL search when user types
  useEffect(() => {
    if (dbStatus?.connected && searchQuery.trim()) {
      const timer = setTimeout(() => {
        fetchInvoicesFromDb({
          search: searchQuery.trim(),
          year: selectedYear,
          month: selectedMonth,
          limit: 200
        }).then(res => {
          if (res.rows) {
            setDbSearchResults(res.rows);
          }
        });
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setDbSearchResults(null);
    }
  }, [searchQuery, dbStatus?.connected, selectedYear, selectedMonth]);

  // Keep institutions closed by default even when searching, or when month/year changes
  useEffect(() => {
    setExpandedClients(new Set());
  }, [selectedYear, selectedMonth, searchQuery]);

  // Filtered and sorted clients based on active year and month
  const filteredClients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const baseStofnanir = dbStatus?.connected
      ? (dbInstitutions ?? [])
      : monthlyData.stofnanir;

    // If PostgreSQL is connected and returned search results for this query, use real records!
    if (dbStatus?.connected && q && dbSearchResults && dbSearchResults.length > 0) {
      const clientMap = new Map<string, Invoice[]>();
      for (const inv of dbSearchResults) {
        const cName = inv.client || 'Ótilgreind stofnun';
        const list = clientMap.get(cName) || [];
        list.push({
          id: inv.id,
          client: cName,
          supplier: inv.supplier,
          amount: inv.amount,
          date: inv.date,
          lines: (inv.lines || []).map(l => ({
            description: l.description,
            amount: l.amount,
            is_kredit: l.is_kredit ?? (l.amount < 0)
          }))
        });
        clientMap.set(cName, list);
      }

      const results: Array<{
        client: string;
        invoiceCount: number;
        totalAmount: number;
        isInstitutionMatch: boolean;
        matchingInvoices: Invoice[];
      }> = [];

      for (const [cName, invs] of clientMap.entries()) {
        const total = invs.reduce((sum, i) => sum + i.amount, 0);
        results.push({
          client: cName,
          invoiceCount: invs.length,
          totalAmount: total,
          isInstitutionMatch: cName.toLowerCase().includes(q),
          matchingInvoices: invs
        });
      }

      if (sortColumn) {
        results.sort((a, b) => {
          if (sortColumn === 'client') {
            return sortAsc ? a.client.localeCompare(b.client, 'is') : b.client.localeCompare(a.client, 'is');
          } else {
            const valA = a[sortColumn];
            const valB = b[sortColumn];
            return sortAsc ? valA - valB : valB - valA;
          }
        });
      } else {
        results.sort((a, b) => b.totalAmount - a.totalAmount);
      }

      return results;
    }

    if (!q) {
      let list = [...baseStofnanir];

      // Sort if user has explicitly clicked a column header
      if (sortColumn) {
        list.sort((a, b) => {
          if (sortColumn === 'client') {
            return sortAsc ? a.client.localeCompare(b.client, 'is') : b.client.localeCompare(a.client, 'is');
          } else {
            const valA = a[sortColumn];
            const valB = b[sortColumn];
            return sortAsc ? valA - valB : valB - valA;
          }
        });
      }

      return list;
    }

    // When searching: calculate matching invoices and amounts specifically matching the search
    const results: Array<{
      client: string;
      invoiceCount: number;
      totalAmount: number;
      isInstitutionMatch: boolean;
      matchingInvoices: Invoice[];
    }> = [];

    for (const c of baseStofnanir) {
      const isClientMatch = c.client.toLowerCase().includes(q);
      const allInvoices = (dbInvoicesCache[c.client] && dbInvoicesCache[c.client].length > 0)
        ? dbInvoicesCache[c.client]
        : monthlyData.getInvoicesForClient(c.client, c.totalAmount);

      if (isClientMatch) {
        // Entire institution matches search query
        results.push({
          client: c.client,
          invoiceCount: c.invoiceCount,
          totalAmount: c.totalAmount,
          isInstitutionMatch: true,
          matchingInvoices: allInvoices,
        });
      } else {
        // Check if individual suppliers or invoices match within this institution
        const matchedInvoices = allInvoices.filter(inv =>
          inv.supplier.toLowerCase().includes(q) ||
          inv.id.toLowerCase().includes(q) ||
          inv.lines?.some(l => l.description.toLowerCase().includes(q))
        );

        if (matchedInvoices.length > 0) {
          const matchedAmount = matchedInvoices.reduce((sum, inv) => sum + inv.amount, 0);
          results.push({
            client: c.client,
            invoiceCount: matchedInvoices.length,
            totalAmount: matchedAmount,
            isInstitutionMatch: false,
            matchingInvoices: matchedInvoices,
          });
        }
      }
    }

    // Sort search results
    if (sortColumn) {
      results.sort((a, b) => {
        if (sortColumn === 'client') {
          return sortAsc ? a.client.localeCompare(b.client, 'is') : b.client.localeCompare(a.client, 'is');
        } else {
          const valA = a[sortColumn];
          const valB = b[sortColumn];
          return sortAsc ? valA - valB : valB - valA;
        }
      });
    }

    return results;
  }, [monthlyData, searchQuery, sortColumn, sortAsc, dbStatus?.connected, dbInstitutions, dbSearchResults, dbInvoicesCache]);

  // Aggregate totals
  const totalAmount = useMemo(() => {
    return filteredClients.reduce((acc, c) => acc + c.totalAmount, 0);
  }, [filteredClients]);

  const totalInvoices = useMemo(() => {
    return filteredClients.reduce((acc, c) => acc + c.invoiceCount, 0);
  }, [filteredClients]);

  const toggleClientExpand = (clientName: string) => {
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

  const handleSort = (col: 'client' | 'invoiceCount' | 'totalAmount') => {
    if (sortColumn === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortColumn(col);
      setSortAsc(col === 'client');
    }
  };

  const handleAddInvoiceToRequest = (inv: Invoice, firstDesc: string) => {
    if (selectedInvoices.length >= 5) {
      alert('Þú getur valið að hámarki 5 reikninga í eina upplýsingabeiðni.');
      return;
    }
    if (selectedInvoices.some(i => i.reikningsnr === inv.id)) {
      alert('Þessi reikningur er þegar á listanum.');
      return;
    }

    const allDesc = inv.lines ? inv.lines.map(l => l.description).join(', ') : firstDesc;
    setSelectedInvoices(prev => [
      ...prev,
      {
        client: inv.client,
        supplier: inv.supplier,
        reikningsnr: inv.id,
        dags: inv.date,
        lysing: allDesc,
        amount: inv.amount
      }
    ]);
  };

  const handleRemoveInvoiceFromRequest = (reikningsnr: string) => {
    setSelectedInvoices(prev => prev.filter(i => i.reikningsnr !== reikningsnr));
  };

  // Generate legal petition text (Act 140/2012)
  const legalPetitionText = useMemo(() => {
    const selectedClients = Array.from(new Set(selectedInvoices.map(i => i.client))).join(', ');
    const now = new Date();
    const dagsIDag = `${now.getDate()}. ${ISLENSKIR_MANUDIR[now.getMonth() + 1] || 'mánuði'} ${now.getFullYear()}`;

    let texti = `Efni: Upplýsingabeiðni á grundvelli upplýsingalaga nr. 140/2012\n`;
    texti += `Til: ${selectedClients || 'Viðkomandi stofnunar'}\n`;
    texti += `Dags: ${dagsIDag}\n\n`;
    texti += `Hér með er óskað eftir afriti af eftirtöldum reikningum og fylgiskjölum þeirra á grundvelli 9. gr. upplýsingalaga nr. 140/2012 um aðgang almennings að upplýsingum um ráðstöfun opinberra fjármuna:\n\n`;

    if (selectedInvoices.length === 0) {
      texti += `[Enginn reikningur valinn enn]\n`;
    } else {
      selectedInvoices.forEach((inv, i) => {
        texti += `${i + 1}. Reikningsnúmer: ${inv.reikningsnr}\n`;
        texti += `   - Kaupandi (Stofnun): ${inv.client}\n`;
        texti += `   - Birgir: ${inv.supplier}\n`;
        texti += `   - Dagsetning reiknings: ${inv.dags}\n`;
        texti += `   - Upphæð: ${formaTolu(inv.amount)} kr.\n`;
        texti += `   - Bókaður texti/lýsing: ${inv.lysing}\n\n`;
      });
    }

    texti += `Óskað er eftir að gögnin verði afhent á rafrænu formi svo fljótt sem verða má, sbr. 17. gr. laganna.\n\nVirðingarfyllst,\n[Nafn sendanda]\n[Kennitala/Netfang]`;
    return texti;
  }, [selectedInvoices]);

  const copyLegalText = () => {
    navigator.clipboard.writeText(legalPetitionText).then(() => {
      setCopiedLegalText(true);
      setTimeout(() => setCopiedLegalText(false), 2000);
    });
  };

  const handleExportCsv = () => {
    const headers = ['Kaupandi', 'Fjoldi_reikninga', 'Heildarupphaed_ISK', 'Ar', 'Manudur'];
    const rows = filteredClients.map(c => [
      `"${c.client.replace(/"/g, '""')}"`,
      c.invoiceCount,
      c.totalAmount,
      isAllYears ? 'Oll_ar' : selectedYear,
      isAllMonths ? 'Allir_manudir' : selectedMonth
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const yearPart = isAllYears ? 'oll-ar' : selectedYear;
    const monthPart = isAllMonths ? 'allir-manudir' : `m${selectedMonth}`;
    link.setAttribute('download', `rikisgat-${yearPart}-${monthPart}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const topSuppliersData = monthlyData.topSuppliers[activePeriod];

  return (
    <div className="space-y-6">
      {/* Header for Public View */}
      <header className="bg-white border-2 border-neutral-900 p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900">
              RÍKISGÁT
            </h1>
            <span className="bg-neutral-100 text-neutral-800 text-[11px] font-bold px-2 py-0.5 rounded border border-neutral-300 uppercase">
              Forsíða / Almenningsviðmót
            </span>
            <button
              onClick={() => setShowDbModal(true)}
              className={`text-[11px] font-mono font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 transition cursor-pointer ${
                dbStatus?.connected
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              }`}
              title="Smelltu til að opna PostgreSQL gagnagrunnstengingu"
            >
              <Database className={`w-3.5 h-3.5 ${dbStatus?.connected ? 'text-emerald-600' : 'text-amber-600'}`} />
              <span>
                {dbStatus?.connected
                  ? `PostgreSQL: Tengt (${dbStatus.totalRows?.toLocaleString('is-IS')} færslur)`
                  : 'PostgreSQL: Ótengt (Smella til að tengja)'}
              </span>
            </button>
            {isLoadingDb && (
              <span className="text-[10px] text-neutral-500 font-mono flex items-center gap-1 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin text-neutral-400" /> Sæki gögn úr PostgreSQL...
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mt-0.5">
            Gegnsæi & Eftirlit með opinberum útgjöldum Íslands
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenDashboard}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            🛡️ Fara í Innra Stjórnborð
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-white hover:bg-neutral-100 text-neutral-900 rounded-lg text-xs font-bold transition border border-neutral-900 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Sækja CSV
          </button>
        </div>
      </header>

      {/* Controls / Filter Bar */}
      <section className="bg-white border border-neutral-900 p-4 sm:p-5 rounded-xl shadow-xs space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="arVal" className="text-[11px] font-black uppercase text-neutral-700 tracking-wider">
              Ár:
            </label>
            <select
              id="arVal"
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="p-2 border border-neutral-900 rounded text-sm font-semibold bg-white cursor-pointer outline-none focus:ring-2 focus:ring-neutral-900"
            >
              {broadSearchEnabled && (
                <option value="all">🌟 Öll ár (2017–2026)</option>
              )}
              {['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017'].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="manudurVal" className="text-[11px] font-black uppercase text-neutral-700 tracking-wider">
              Mánuður:
            </label>
            <select
              id="manudurVal"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="p-2 border border-neutral-900 rounded text-sm font-semibold bg-white cursor-pointer outline-none focus:ring-2 focus:ring-neutral-900"
            >
              {broadSearchEnabled && (
                <option value="all">🌟 Allir mánuðir (1–12)</option>
              )}
              {[
                { m: '1', n: 'Janúar' },
                { m: '2', n: 'Febrúar' },
                { m: '3', n: 'Mars' },
                { m: '4', n: 'Apríl' },
                { m: '5', n: 'Maí' },
                { m: '6', n: 'Júní' },
                { m: '7', n: 'Júlí' },
                { m: '8', n: 'Ágúst' },
                { m: '9', n: 'September' },
                { m: '10', n: 'Október' },
                { m: '11', n: 'Nóvember' },
                { m: '12', n: 'Desember' },
              ].map(({ m, n }) => (
                <option key={m} value={m}>{n}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[260px] flex flex-col gap-1">
            <label htmlFor="leitInntak" className="text-[11px] font-black uppercase text-neutral-700 tracking-wider">
              {isAllYears && isAllMonths
                ? 'Leit í öllum gagnagrunninum (Birgir eða Stofnun):'
                : isAllYears
                ? `Leit í öllum árum á ${monthlyData.monthName} (Birgir eða Stofnun):`
                : isAllMonths
                ? `Leit á öllu árinu ${selectedYear} (Birgir eða Stofnun):`
                : `Leit í völdum mánuði (Birgir eða Stofnun):`}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="leitInntak"
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="t.d. Landspítali, Ístak, Origo..."
                  className="w-full p-2 pl-3 border border-neutral-900 rounded text-sm outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-3 py-2 bg-white text-neutral-900 border border-neutral-900 rounded text-xs font-bold hover:bg-neutral-100 transition cursor-pointer"
                >
                  Hreinsa
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Year Comparison buttons in the exact same style as 'Valið tímabil' */}
        <div className="pt-2.5 border-t border-neutral-200 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 font-bold text-neutral-900">
            <Calendar className="w-3.5 h-3.5 text-neutral-700" />
            <span>Valið tímabil:</span>
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            {broadSearchEnabled && (
              <button
                onClick={() => {
                  setSelectedYear('all');
                  setSelectedMonth('all');
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs ${
                  isAllYears && isAllMonths
                    ? 'bg-neutral-900 text-white border border-neutral-900 ring-2 ring-neutral-900/20'
                    : 'bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 active:scale-95'
                }`}
                title="Leita í öllum árum og öllum mánuðum"
              >
                <span>🌟 Allur grunnur</span>
              </button>
            )}

            {quickYears.map(yr => {
              const isSelected = !isAllYears && String(yr) === selectedYear;
              return (
                <button
                  key={yr}
                  onClick={() => {
                    setSelectedYear(String(yr));
                    if (isAllMonths && !broadSearchEnabled) setSelectedMonth('1');
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs ${
                    isSelected
                      ? 'bg-neutral-900 text-white border border-neutral-900 ring-2 ring-neutral-900/20'
                      : 'bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 active:scale-95'
                  }`}
                  title={`Skoða ${monthlyData.monthName} ${yr}`}
                >
                  <span>{isAllMonths ? `Heilt ár ${yr}` : `${monthlyData.monthName} ${yr}`}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notice if 2026 late month is chosen */}
        {monthlyData.isFutureOrUnpublished && (
          <div className="bg-amber-50 border border-amber-300 p-3 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong>Athugið varðandi nýjustu gögn:</strong> Opinber birting á opnirreikningar.is náði til 30. júní 2026 við síðustu innlestur. Fyrir {monthlyData.monthName.toLowerCase()} {selectedYear} sýnir kerfið vísitöluleg viðmiðunargögn sem uppfærast sjálfkrafa um leið og Fjársýslan gefur út nýjan CSV pakka.
            </div>
          </div>
        )}
      </section>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Left Column: Tables & Shock Factor */}
        <section className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`bg-white border border-neutral-900 p-4 rounded-xl shadow-xs flex flex-col justify-start transition-opacity duration-150 ${isUpdating ? 'opacity-50' : 'opacity-100'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-black uppercase text-neutral-500 tracking-wider">
                  {searchQuery.trim() 
                    ? 'Fjöldi reikninga í leit' 
                    : isAllYears && isAllMonths
                    ? 'Fjöldi reikninga (Öll ár & Allir mánuðir)'
                    : isAllYears
                    ? `Fjöldi reikninga (Öll ár í ${monthlyData.monthName})`
                    : isAllMonths
                    ? `Fjöldi reikninga (Allt árið ${selectedYear})`
                    : `Fjöldi reikninga í ${monthlyData.monthName.toLowerCase()} ${selectedYear}`}
                </span>
                {searchQuery.trim() && (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300">
                    Síað eftir leit
                  </span>
                )}
              </div>
              <div className="mt-2">
                <div className="text-2xl sm:text-3xl font-black text-neutral-900 font-mono tracking-tight whitespace-nowrap">
                  {formaTolu(totalInvoices)}
                </div>
                <div className="mt-1 text-xs font-bold text-neutral-500">
                  {searchQuery.trim()
                    ? `reikningar sem passa við „${searchQuery.trim()}“ (${isAllYears ? 'Öll ár' : selectedYear} / ${isAllMonths ? 'Allir mánuðir' : monthlyData.monthName})`
                    : `skráðir reikningar í völdu tímabili (af 18,17M heild)`}
                </div>
              </div>

              {/* Dashed divider matching the right card */}
              <div className="mt-3 pt-3 border-t border-dashed border-neutral-300 text-xs text-neutral-700 italic leading-relaxed">
                🗣️ <em>„{fjoldiITexta(totalInvoices)}“</em>
              </div>
            </div>

            <div className={`bg-white border border-neutral-900 p-4 rounded-xl shadow-xs flex flex-col justify-start transition-opacity duration-150 ${isUpdating ? 'opacity-50' : 'opacity-100'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-black uppercase text-neutral-500 tracking-wider">
                  {searchQuery.trim() 
                    ? 'Heildarupphæð í leit' 
                    : isAllYears && isAllMonths
                    ? 'Heildarupphæð (Öll ár & Allir mánuðir)'
                    : isAllYears
                    ? `Heildarupphæð (Öll ár í ${monthlyData.monthName})`
                    : isAllMonths
                    ? `Heildarupphæð (Allt árið ${selectedYear})`
                    : `Heildarupphæð í ${monthlyData.monthName.toLowerCase()} ${selectedYear}`}
                </span>
                {searchQuery.trim() && (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300">
                    Síað eftir leit
                  </span>
                )}
              </div>
              <div className="mt-2">
                <div className="text-2xl sm:text-3xl font-black text-neutral-900 font-mono tracking-tight whitespace-nowrap overflow-x-auto">
                  {formaTolu(totalAmount)} kr.
                </div>
                <div className="mt-1 text-xs font-bold text-blue-700">
                  (~{stuttTala(totalAmount)})
                </div>
              </div>

              {/* The signature "Shock-factor" Icelandic spoken algorithm */}
              <div className="mt-3 pt-3 border-t border-dashed border-neutral-300 text-xs text-neutral-700 italic leading-relaxed">
                🗣️ <em>„{talaITexta(totalAmount)}“</em>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-neutral-900 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-neutral-100 border-b-2 border-neutral-900 select-none text-[11px] font-black uppercase tracking-wider text-neutral-800">
                    <th
                      onClick={() => handleSort('client')}
                      className={`p-3.5 cursor-pointer transition ${sortColumn === 'client' ? 'bg-neutral-200 text-black' : 'hover:bg-neutral-200'}`}
                      title="Smelltu til að raða eftir nafni"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>🏛️ Kaupandi (Stofnun)</span>
                        <ArrowUpDown className={`w-3.5 h-3.5 ${sortColumn === 'client' ? 'text-black font-black' : 'text-neutral-500'}`} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('invoiceCount')}
                      className={`p-3.5 text-center w-36 cursor-pointer transition ${sortColumn === 'invoiceCount' ? 'bg-neutral-200 text-black' : 'hover:bg-neutral-200'}`}
                      title="Smelltu til að raða eftir fjölda reikninga"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>🧾 Fjöldi</span>
                        <ArrowUpDown className={`w-3.5 h-3.5 ${sortColumn === 'invoiceCount' ? 'text-black font-black' : 'text-neutral-500'}`} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('totalAmount')}
                      className={`p-3.5 text-right w-48 cursor-pointer transition ${sortColumn === 'totalAmount' ? 'bg-neutral-200 text-black' : 'hover:bg-neutral-200'}`}
                      title="Smelltu til að raða eftir heildarupphæð"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>💰 Heildarupphæð</span>
                        <ArrowUpDown className={`w-3.5 h-3.5 ${sortColumn === 'totalAmount' ? 'text-black font-black' : 'text-neutral-500'}`} />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-neutral-200 transition-opacity duration-150 ${isUpdating ? 'opacity-50' : 'opacity-100'}`}>
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-neutral-500 text-xs">
                        Engar færslur fundust við leitina.
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client, idx) => {
                      const isExpanded = expandedClients.has(client.client);
                      // Invoices specifically for this client in the chosen year and month (or matching subset if searching)
                      const invoicesForClient = 'matchingInvoices' in client && client.matchingInvoices 
                        ? client.matchingInvoices 
                        : monthlyData.getInvoicesForClient(client.client, client.totalAmount);

                      return (
                        <React.Fragment key={client.client}>
                          <tr
                            onClick={() => toggleClientExpand(client.client)}
                            className={`cursor-pointer transition-colors ${
                              isExpanded ? 'bg-blue-50/70' : 'hover:bg-neutral-50'
                            }`}
                          >
                            <td className="p-3 font-semibold text-neutral-900 flex items-center gap-2.5">
                              <span
                                className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold transition-all ${
                                  isExpanded ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-white'
                                }`}
                              >
                                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                              </span>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                <span>{client.client}</span>
                                {searchQuery.trim() && !client.client.toLowerCase().includes(searchQuery.toLowerCase().trim()) && (
                                  <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-bold border border-blue-200">
                                    birgir/reikningur passar
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-center font-mono text-neutral-700">
                              {formaTolu(client.invoiceCount)}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-neutral-900">
                              {formaTolu(client.totalAmount)} kr.
                            </td>
                          </tr>

                          {/* Expanded Sub-table */}
                          {isExpanded && (() => {
                            const clientFilter = (clientFilterQueries[client.client] || '').toLowerCase().trim();
                            const rawInvoices = invoicesForClient;
                            const displayInvoices = clientFilter
                              ? rawInvoices.filter(inv =>
                                  inv.supplier.toLowerCase().includes(clientFilter) ||
                                  inv.id.toLowerCase().includes(clientFilter) ||
                                  inv.lines?.some(l => l.description.toLowerCase().includes(clientFilter))
                                )
                              : rawInvoices;

                            const limit = clientVisibleLimits[client.client] || 25;
                            const isSearchActive = Boolean(clientFilter || searchQuery.trim());
                            const paginatedInvoices = isSearchActive ? displayInvoices : displayInvoices.slice(0, limit);
                            const hasMore = !isSearchActive && paginatedInvoices.length < displayInvoices.length;

                            return (
                            <tr className="bg-neutral-50/80">
                              <td colSpan={3} className="p-4 pl-8 border-l-4 border-neutral-900">
                                <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-2xs">
                                  <div className="bg-neutral-100 p-2.5 text-xs font-bold text-neutral-700 border-b border-neutral-200 flex flex-wrap justify-between items-center gap-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                      <span>
                                        Sundurliðaðir reikningar hjá: <strong>{client.client}</strong> ({isAllYears && isAllMonths ? 'Öll ár & allir mánuðir' : isAllYears ? `Öll ár (${monthlyData.monthName})` : isAllMonths ? `Allt árið ${selectedYear}` : `${monthlyData.monthName} ${selectedYear}`})
                                      </span>
                                      <span className="text-[11px] font-normal text-neutral-500">
                                        ({paginatedInvoices.length} af {displayInvoices.length} birtir)
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      <div className="relative flex items-center">
                                        <input
                                          type="text"
                                          placeholder={`🔍 Sía innan ${client.client.split(' ')[0]}...`}
                                          value={clientFilterQueries[client.client] || ''}
                                          onChange={e => {
                                            e.stopPropagation();
                                            const val = e.target.value;
                                            setClientFilterQueries(prev => ({ ...prev, [client.client]: val }));
                                          }}
                                          onClick={e => e.stopPropagation()}
                                          className="bg-white border border-neutral-300 rounded px-2.5 py-1 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 w-44 sm:w-56 transition shadow-2xs"
                                        />
                                        {clientFilterQueries[client.client] && (
                                          <button
                                            onClick={e => {
                                              e.stopPropagation();
                                              setClientFilterQueries(prev => ({ ...prev, [client.client]: '' }));
                                            }}
                                            className="absolute right-2 text-neutral-400 hover:text-neutral-700 text-xs font-bold cursor-pointer"
                                            title="Hreinsa síu"
                                          >
                                            ✕
                                          </button>
                                        )}
                                      </div>
                                      <span className="hidden md:inline text-neutral-500 font-normal text-[11px]">
                                        Smelltu á ➕ Senda inn til að hefja upplýsingabeiðni
                                      </span>
                                    </div>
                                  </div>

                                  <table className="w-full text-xs text-left border-collapse">
                                    <thead>
                                      <tr className="bg-neutral-50 text-neutral-600 border-b border-neutral-200 text-[11px] font-bold uppercase">
                                        <th className="p-2">Dags.</th>
                                        <th className="p-2">Birgir</th>
                                        <th className="p-2">Reikningsnr.</th>
                                        <th className="p-2 text-right">Upphæð / Beiðni</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200">
                                      {paginatedInvoices.length === 0 ? (
                                        <tr>
                                          <td colSpan={4} className="p-4 text-center text-neutral-500 italic">
                                            Engir reikningar fundust með síunni „{clientFilter}“.
                                          </td>
                                        </tr>
                                      ) : (
                                        paginatedInvoices.map(inv => {
                                          const isAlreadySelected = selectedInvoices.some(i => i.reikningsnr === inv.id);
                                          const q = searchQuery.toLowerCase().trim();
                                          const isSupplierMatch = Boolean(q && (
                                            inv.supplier.toLowerCase().includes(q) || 
                                            inv.id.toLowerCase().includes(q) || 
                                            inv.lines?.some(l => l.description.toLowerCase().includes(q))
                                          ));
                                          return (
                                            <React.Fragment key={inv.id}>
                                              <tr className={isSupplierMatch ? 'bg-amber-50/80 hover:bg-amber-100/70' : 'hover:bg-neutral-50/80'}>
                                                <td className="p-2 font-mono text-neutral-600">{inv.date}</td>
                                                <td className="p-2 font-bold text-neutral-900">
                                                  <span>{inv.supplier}</span>
                                                  {isSupplierMatch && (
                                                    <span className="ml-1.5 text-[9px] font-bold bg-amber-200 text-amber-900 px-1 py-0.2 rounded">
                                                      passar við leit
                                                    </span>
                                                  )}
                                                </td>
                                                <td className="p-2 font-mono text-neutral-500">{inv.id}</td>
                                                <td className="p-2 text-right font-mono font-bold text-neutral-900">
                                                  {isAlreadySelected ? (
                                                    <span className="text-emerald-700 font-bold text-[11px] mr-2">
                                                      [EFTIRSPURN VIRK ⏳]
                                                    </span>
                                                  ) : (
                                                    <button
                                                      onClick={e => {
                                                        e.stopPropagation();
                                                        handleAddInvoiceToRequest(inv, inv.lines?.[0]?.description || '');
                                                      }}
                                                      className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-[10px] font-bold mr-2 transition cursor-pointer"
                                                      title="Bæta við upplýsingabeiðni skv. upplýsingalögum"
                                                    >
                                                      ➕ Senda inn
                                                    </button>
                                                  )}
                                                  <span>{formaTolu(inv.amount)} kr.</span>
                                                </td>
                                              </tr>

                                              {/* Accounting ledger lines */}
                                              {inv.lines && inv.lines.length > 0 && (
                                                <tr className="bg-neutral-50/50">
                                                  <td colSpan={4} className="p-2 pl-6 text-[11px] text-neutral-600">
                                                    <ul className="list-disc pl-4 space-y-0.5">
                                                      {inv.lines.map((l, lIdx) => (
                                                        <li key={lIdx} className={l.is_kredit ? 'line-through text-neutral-400' : ''}>
                                                          <span>{l.description}</span> — <strong className="font-mono">{formaTolu(l.amount)} kr.</strong>
                                                          {l.is_kredit && <span className="text-red-600 ml-1 font-bold">(Kreditfært)</span>}
                                                        </li>
                                                      ))}
                                                    </ul>
                                                  </td>
                                                </tr>
                                              )}
                                            </React.Fragment>
                                          );
                                        })
                                      )}
                                    </tbody>
                                  </table>

                                  {/* Table footer with pagination controls and counts */}
                                  <div className="bg-neutral-50 p-2.5 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                                    <div className="text-neutral-600 flex items-center gap-1.5 flex-wrap">
                                      <span>
                                        Sýnir <strong className="text-neutral-900 font-mono">{paginatedInvoices.length}</strong> af <strong className="text-neutral-900 font-mono">{displayInvoices.length}</strong> sundurliðuðum reikningum
                                      </span>
                                      <span className="text-neutral-400">
                                        • Alls {formaTolu(client.invoiceCount)} skráðar færslur í heildargagnagrunni
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {hasMore && (
                                        <>
                                          <button
                                            onClick={e => {
                                              e.stopPropagation();
                                              setClientVisibleLimits(prev => ({
                                                ...prev,
                                                [client.client]: (prev[client.client] || 25) + 25
                                              }));
                                            }}
                                            className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-semibold transition cursor-pointer"
                                          >
                                            Sýna fleiri (+25)
                                          </button>
                                          <button
                                            onClick={e => {
                                              e.stopPropagation();
                                              setClientVisibleLimits(prev => ({
                                                ...prev,
                                                [client.client]: displayInvoices.length
                                              }));
                                            }}
                                            className="px-2.5 py-1 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 rounded text-xs font-semibold transition cursor-pointer"
                                          >
                                            Sýna alla ({displayInvoices.length})
                                          </button>
                                        </>
                                      )}
                                      {!hasMore && displayInvoices.length > 25 && !isSearchActive && (
                                        <button
                                          onClick={e => {
                                            e.stopPropagation();
                                            setClientVisibleLimits(prev => ({
                                              ...prev,
                                              [client.client]: 25
                                            }));
                                          }}
                                          className="px-2.5 py-1 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-600 rounded text-xs font-semibold transition cursor-pointer"
                                        >
                                          Sýna færri (25)
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                            );
                          })()}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Right Column: Sidebar Panels */}
        <aside className="space-y-5">
          {/* Top Suppliers Panel */}
          <div className="bg-white border border-neutral-900 p-5 rounded-xl shadow-xs space-y-3">
            <h2 className="text-sm font-black uppercase tracking-tight text-neutral-900 border-b border-neutral-200 pb-2 flex items-center justify-between">
              <span>🏆 Stærstu Birgjar</span>
              <span className="text-[10px] text-neutral-500 font-normal">Topp 5</span>
            </h2>

            {/* Period selector tabs */}
            <div className="grid grid-cols-4 gap-1">
              {(['year', 'month', 'week', 'day'] as const).map(p => {
                const labels: Record<string, string> = {
                  year: 'Ár',
                  month: 'Mánuður',
                  week: 'Vika',
                  day: 'Dagur'
                };
                return (
                  <button
                    key={p}
                    onClick={() => setActivePeriod(p)}
                    className={`py-1.5 text-xs font-bold border border-neutral-900 transition cursor-pointer text-center ${
                      activePeriod === p ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-900 hover:bg-neutral-100'
                    }`}
                  >
                    {labels[p]}
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] text-neutral-600 italic font-semibold">
              📌 {topSuppliersData.info}
            </div>

            <ol className="divide-y divide-neutral-100 text-xs space-y-1">
              {topSuppliersData.suppliers.map((b, bIdx) => (
                <li key={b.supplier} className="pt-2 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-neutral-100 text-neutral-800 font-mono font-bold text-[10px] flex items-center justify-center border border-neutral-300">
                      {bIdx + 1}
                    </span>
                    <span className="font-semibold text-neutral-900">{b.supplier}</span>
                  </div>
                  <span className="font-mono font-bold text-neutral-800 text-[11px]">
                    {stuttTala(b.total)}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Information Request Builder (Upplýsingabeiðni skv. 140/2012) */}
          <div className="bg-white border border-neutral-900 p-5 rounded-xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <h2 className="text-sm font-black uppercase tracking-tight text-neutral-900 flex items-center gap-1.5">
                <span>⚖️ Upplýsingabeiðni</span>
              </h2>
              <span className="text-[10px] bg-neutral-100 border border-neutral-300 px-2 py-0.5 rounded font-bold uppercase text-neutral-700">
                Lög 140/2012
              </span>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Veldu allt að 5 reikninga með því að smella á <strong>➕ Senda inn</strong> í töflunni hér til hliðar til að búa til tilbúna lagalega beiðni um sundurliðun.
            </p>

            {/* Selected Invoices List */}
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase text-neutral-500 tracking-wider">
                Valdir reikningar ({selectedInvoices.length}/5):
              </span>

              {selectedInvoices.length === 0 ? (
                <div className="p-3 bg-neutral-50 rounded border border-dashed border-neutral-300 text-xs text-neutral-400 text-center">
                  Enginn reikningur valinn. Smelltu á ➕ Senda inn hjá hvaða stofnun sem er.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedInvoices.map(item => (
                    <div
                      key={item.reikningsnr}
                      className="bg-neutral-50 border border-neutral-200 p-2.5 rounded-lg flex items-start justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="font-bold text-neutral-900">{item.supplier}</div>
                        <div className="text-neutral-500 text-[11px] font-mono">
                          {item.reikningsnr} • {item.dags} • {formaTolu(item.amount)} kr.
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveInvoiceFromRequest(item.reikningsnr)}
                        className="text-red-600 hover:text-red-800 p-1 cursor-pointer"
                        title="Fjarlægja"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions for petition */}
            <div className="pt-2 border-t border-neutral-200 space-y-2">
              <button
                onClick={copyLegalText}
                disabled={selectedInvoices.length === 0}
                className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                  selectedInvoices.length === 0
                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    : copiedLegalText
                    ? 'bg-emerald-600 text-white'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                }`}
              >
                {copiedLegalText ? (
                  <>
                    <Check className="w-4 h-4" /> Afritað á klippiborð!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Afrita tilbúna kröfugerð (140/2012)
                  </>
                )}
              </button>

              <details className="text-[11px] text-neutral-600 bg-neutral-50 p-2.5 rounded border border-neutral-200 cursor-pointer">
                <summary className="font-bold text-neutral-800 select-none">
                  Forskoða lögfræðilegan texta beiðninnar
                </summary>
                <pre className="mt-2 whitespace-pre-wrap font-mono text-[10px] text-neutral-700 bg-white p-2 border border-neutral-200 rounded max-h-40 overflow-y-auto">
                  {legalPetitionText}
                </pre>
              </details>
            </div>
          </div>
        </aside>
      </div>

      {/* PostgreSQL connection modal */}
      <DbConnectionModal
        isOpen={showDbModal}
        onClose={() => setShowDbModal(false)}
        status={dbStatus}
        onStatusChange={(newStatus) => {
          setDbStatus(newStatus);
          if (newStatus.connected) {
            setIsLoadingDb(true);
            fetchInstitutionsFromDb(selectedYear, selectedMonth).then(res => {
              if (res.rows && res.rows.length > 0) {
                setDbInstitutions(res.rows);
              }
            }).finally(() => setIsLoadingDb(false));
          }
        }}
      />
    </div>
  );
};
