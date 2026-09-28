import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, Search, ArrowUpDown, ChevronRight, ChevronDown, Plus, 
  Trash2, Copy, Check, Download, Calendar, Shield, ExternalLink, RefreshCw,
  AlertCircle, CheckCircle2, Globe2, Database, Mail, FileText, Scale, Info,
  ShieldAlert, Heart, Landmark, Zap
} from 'lucide-react';
import { Stofnun, Invoice, SelectedInvoiceItem, TopSupplier } from '../types';
import { getMonthlyPortalData, ISLENSKIR_MANUDIR } from '../data/mockData';
import { formaTolu, stuttTala, talaITexta, fjoldiITexta, formaDags } from '../utils/icelandicFormatters';
import * as apiService from '../services/api';
import type { 
  DbStatusResponse, OverviewApiResponse, RealInvoiceRow, InstitutionSuppliersApiResponse 
} from '../services/api';
import { DbConnectionModal } from './DbConnectionModal';

const checkDbStatus = apiService.checkDbStatus;
const fetchInstitutionsFromDb = apiService.fetchInstitutionsFromDb;
const fetchInvoicesFromDb = apiService.fetchInvoicesFromDb;
const fetchOverviewFromDb = apiService.fetchOverviewFromDb;
const fetchTopSuppliersFromDb = apiService.fetchTopSuppliersFromDb || (async (params: { year?: string; month?: string; period?: 'month' | 'year' | 'week' | 'day'; limit?: number }) => {
  const query = new URLSearchParams();
  if (params.year && params.year !== 'all') query.set('year', params.year);
  if (params.month && params.month !== 'all') query.set('month', params.month);
  if (params.period) query.set('period', params.period);
  if (params.limit) query.set('limit', String(params.limit));
  try {
    const res = await fetch(`/api/top-suppliers?${query.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return { source: 'mock', suppliers: [], error: err.message };
  }
});

// Resilient helper with direct fetch fallback
const fetchInstitutionSuppliersFromDb = apiService.fetchInstitutionSuppliersFromDb || (async (params: { client: string; year?: string; month?: string; search?: string }): Promise<InstitutionSuppliersApiResponse> => {
  const query = new URLSearchParams();
  query.set('client', params.client);
  if (params.year && params.year !== 'all') query.set('year', params.year);
  if (params.month && params.month !== 'all') query.set('month', params.month);
  if (params.search) query.set('search', params.search);
  try {
    const res = await fetch(`/api/institution-suppliers?${query.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return {
      source: 'mock',
      client: params.client,
      suppliers: [],
      error: err.message
    };
  }
});

const ALL_YEARS_LIST = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017'];
const ALL_MONTHS_NUMS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

interface PublicPortalViewProps {
  onOpenDashboard: () => void;
  onOpenAbout?: () => void;
  onOpenStats?: () => void;
  onOpenWhistleblower?: (invoiceData?: { institution?: string; supplier?: string; invoiceNumber?: string }) => void;
  onOpenSupport?: () => void;
  onOpenPerformance?: () => void;
  broadSearchYearsEnabled?: boolean;
  broadSearchMonthsEnabled?: boolean;
  broadSearchEnabled?: boolean;
}

export const PublicPortalView: React.FC<PublicPortalViewProps> = ({ 
  onOpenDashboard,
  onOpenAbout,
  onOpenStats,
  onOpenWhistleblower,
  onOpenSupport,
  onOpenPerformance,
  broadSearchYearsEnabled = true,
  broadSearchMonthsEnabled = true,
  broadSearchEnabled = true
}) => {
  // Leitarskilyrði eru tóm að sjálfgefnu: notandi velur ár og mánuð áður en listi birtist
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Expanded client rows (set of client names)
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

  // Sorting - null means keep the randomized/shuffled order per month/year (engin þvinguð röðun)
  const [sortColumn, setSortColumn] = useState<'client' | 'invoiceCount' | 'totalAmount' | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Simulated update feedback state
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // If broad search is disabled for year or month, make sure 'all' is reverted
  useEffect(() => {
    if (!broadSearchYearsEnabled && selectedYear === 'all') {
      setSelectedYear('');
    }
    if (!broadSearchMonthsEnabled && selectedMonth === 'all') {
      setSelectedMonth('');
    }
  }, [broadSearchYearsEnabled, broadSearchMonthsEnabled, selectedYear, selectedMonth]);

  // Trigger brief visual feedback when year or month changes, reset sort column so the new month's shuffle takes effect
  useEffect(() => {
    setIsUpdating(true);
    setSortColumn(null); // Return to month-specific randomized order when period changes
    const timer = setTimeout(() => setIsUpdating(false), 120);
    return () => clearTimeout(timer);
  }, [selectedYear, selectedMonth, broadSearchYearsEnabled, broadSearchMonthsEnabled]);

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
    // Ef hvorki ár né mánuður hefur verið valinn birtist ekkert
    if (!selectedYear || !selectedMonth) {
      return {
        year: 0,
        month: 0,
        monthName: '',
        isFutureOrUnpublished: false,
        stofnanir: [],
        topSuppliers: {
          month: { info: '', suppliers: [] },
          year: { info: '', suppliers: [] },
          week: { info: '', suppliers: [] },
          day: { info: '', suppliers: [] }
        },
        getInvoicesForClient: () => []
      };
    }

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
    // Halda óbreyttri/óflokkaðri röð (ekki þvinguð röðun eftir upphæð)

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
  // Per-supplier in-accordion search filters for filtering individual invoices/lines and invoice numbers
  const [supplierInvoiceFilters, setSupplierInvoiceFilters] = useState<Record<string, string>>({});

  // Real-time PostgreSQL database state and live query results
  const [dbStatus, setDbStatus] = useState<DbStatusResponse | null>(null);
  const [dbOverview, setDbOverview] = useState<OverviewApiResponse | null>(null);
  const [showDbModal, setShowDbModal] = useState(false);
  const [dbInstitutions, setDbInstitutions] = useState<Array<{ id: number; client: string; invoiceCount: number; lineCount?: number; totalAmount: number }> | null>(null);
  const [dbSearchInstitutions, setDbSearchInstitutions] = useState<Array<{ id: number; client: string; invoiceCount: number; lineCount?: number; totalAmount: number }> | null>(null);
  const [dbInvoicesCache, setDbInvoicesCache] = useState<Record<string, Invoice[]>>({});
  const [dbSearchResults, setDbSearchResults] = useState<RealInvoiceRow[] | null>(null);
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [isSearchingDb, setIsSearchingDb] = useState(false);

  // Grouped suppliers cache per institution: clientName -> Array<{ supplier: string; invoiceCount: number; lineCount?: number; totalAmount: number }>
  const [dbSuppliersCache, setDbSuppliersCache] = useState<Record<string, Array<{ supplier: string; invoiceCount: number; lineCount?: number; totalAmount: number }>>>({});
  const [loadingSuppliersForClient, setLoadingSuppliersForClient] = useState<Record<string, boolean>>({});

  // Expanded suppliers: Set of composite keys `${clientName}:::${supplierName}`
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());

  // Invoices cache per supplier: `${clientName}:::${supplierName}` -> Invoice[]
  const [supplierInvoicesCache, setSupplierInvoicesCache] = useState<Record<string, Invoice[]>>({});
  const [supplierLoadingInvoices, setSupplierLoadingInvoices] = useState<Record<string, boolean>>({});
  const [supplierVisibleLimits, setSupplierVisibleLimits] = useState<Record<string, number>>({});

  // Check DB status and overview on mount
  useEffect(() => {
    checkDbStatus().then(status => {
      setDbStatus(status);
      if (status.connected) {
        fetchOverviewFromDb().then(ov => {
          if (ov && ov.source === 'postgres') {
            setDbOverview(ov);
            // If user has not chosen a year or the year is not among available years, align to newest
            if (ov.availableYears && ov.availableYears.length > 0 && (!selectedYear || !ov.availableYears.includes(selectedYear))) {
              setSelectedYear(ov.availableYears[0]);
            }
          }
        });
      }
    });
  }, []);

  // Fetch institutions when year/month or connection status changes (only when both year and month are selected)
  useEffect(() => {
    if (dbStatus?.connected && selectedYear && selectedMonth) {
      setIsLoadingDb(true);
      setDbInvoicesCache({});
      setDbSuppliersCache({});
      setExpandedSuppliers(new Set());
      setSupplierInvoicesCache({});
      setSupplierVisibleLimits({});
      fetchInstitutionsFromDb(selectedYear, selectedMonth).then(res => {
        if (res.rows && res.rows.length > 0) {
          setDbInstitutions(res.rows);
        } else {
          // If no rows found in DB for this period, keep it empty instead of falling back to fake data!
          setDbInstitutions([]);
        }
      }).catch(() => {
        setDbInstitutions([]);
      }).finally(() => setIsLoadingDb(false));
    } else {
      setDbInstitutions(null);
      setIsLoadingDb(false);
    }
  }, [selectedYear, selectedMonth, dbStatus?.connected]);

  // Fetch suppliers list from PostgreSQL for expanded clients
  const fetchSuppliersForClient = async (clientName: string) => {
    if (dbSuppliersCache[clientName] !== undefined || loadingSuppliersForClient[clientName]) return;
    setLoadingSuppliersForClient(prev => ({ ...prev, [clientName]: true }));
    try {
      const res = await fetchInstitutionSuppliersFromDb({
        client: clientName,
        year: selectedYear,
        month: selectedMonth
      });
      setDbSuppliersCache(prev => ({ ...prev, [clientName]: res.suppliers || [] }));
    } catch {
      setDbSuppliersCache(prev => ({ ...prev, [clientName]: [] }));
    } finally {
      setLoadingSuppliersForClient(prev => ({ ...prev, [clientName]: false }));
    }
  };

  useEffect(() => {
    if (dbStatus?.connected && expandedClients.size > 0) {
      for (const clientName of expandedClients) {
        if (dbSuppliersCache[clientName] === undefined && !loadingSuppliersForClient[clientName]) {
          fetchSuppliersForClient(clientName);
        }
      }
    }
  }, [expandedClients, dbStatus?.connected, selectedYear, selectedMonth]);

  // Toggle supplier accordion and fetch initial 25 invoices sorted by date ASC (frá byrjun mánaðar)
  const toggleSupplierExpand = (clientName: string, supplierName: string, totalCount?: number) => {
    const key = `${clientName}:::${supplierName}`;
    const willExpand = !expandedSuppliers.has(key);
    setExpandedSuppliers(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });

    if (willExpand) {
      if (!supplierInvoicesCache[key] || supplierInvoicesCache[key].length === 0) {
        fetchInvoicesForSupplier(clientName, supplierName, 0, 25);
      }
      if (!supplierVisibleLimits[key]) {
        setSupplierVisibleLimits(prevLim => ({ ...prevLim, [key]: 25 }));
      }
    }
  };

  // Fetch invoices for a supplier (25 at a time, sorted ASC from beginning of month)
  const fetchInvoicesForSupplier = async (clientName: string, supplierName: string, offset: number = 0, limit: number = 25) => {
    const key = `${clientName}:::${supplierName}`;
    setSupplierLoadingInvoices(prev => ({ ...prev, [key]: true }));
    try {
      if (dbStatus?.connected) {
        const res = await fetchInvoicesFromDb({
          client: clientName,
          supplier: supplierName,
          year: selectedYear,
          month: selectedMonth,
          limit,
          offset,
          sort: 'asc' // Reikningunum er raðað eftir dags frá byrjun mánaðar
        });
        const newInvoices: Invoice[] = (res.rows || []).map(r => ({
          id: r.id,
          client: clientName,
          supplier: r.supplier || supplierName,
          amount: r.amount,
          date: formaDags(r.date, selectedYear),
          lines: (r.lines || []).map(l => ({
            description: l.description,
            amount: l.amount,
            is_kredit: l.is_kredit ?? (l.amount < 0)
          }))
        }));
        setSupplierInvoicesCache(prev => {
          const existing = offset > 0 ? (prev[key] || []) : [];
          if (offset === 0) {
            return {
              ...prev,
              [key]: newInvoices
            };
          }
          // Ekki sía eftir r.id (reikningsnúmeri) því sami reikningur (t.d. 0000481 hjá Suðurloft)
          // getur átt tugi bókhaldslína með sama reikningsnúmeri.
          const nextInvoices = [...existing.slice(0, offset), ...newInvoices];
          return {
            ...prev,
            [key]: nextInvoices
          };
        });
        // Tryggja að visibleLimits haldist í réttum takti við raunverulega sóttan fjölda
        setSupplierVisibleLimits(prev => {
          const currentVis = prev[key] || 25;
          const newTotalLoaded = offset + newInvoices.length;
          return {
            ...prev,
            [key]: Math.max(currentVis, newTotalLoaded)
          };
        });
      } else {
        // Fallback for mock/offline data
        const clientInvoices = monthlyData.getInvoicesForClient(clientName, 0);
        const supplierInvs = clientInvoices
          .filter(inv => inv.supplier.toLowerCase() === supplierName.toLowerCase())
          .sort((a, b) => (a.date > b.date ? 1 : -1));
        setSupplierInvoicesCache(prev => ({
          ...prev,
          [key]: supplierInvs
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSupplierLoadingInvoices(prev => ({ ...prev, [key]: false }));
    }
  };

  // Load next 25 invoices for a supplier
  const handleLoadMoreForSupplier = (clientName: string, supplierName: string, totalCount: number) => {
    const key = `${clientName}:::${supplierName}`;
    if (supplierLoadingInvoices[key]) return;

    const currentLimit = supplierVisibleLimits[key] || 25;
    const currentInvoices = supplierInvoicesCache[key] || [];
    const nextLimit = Math.min(currentLimit + 25, totalCount);

    if (dbStatus?.connected && currentInvoices.length < totalCount && currentInvoices.length < nextLimit) {
      fetchInvoicesForSupplier(clientName, supplierName, currentInvoices.length, 25);
    } else {
      setSupplierVisibleLimits(prev => ({ ...prev, [key]: nextLimit }));
    }
  };

  // Real-time PostgreSQL search when user types
  useEffect(() => {
    if (dbStatus?.connected && searchQuery.trim()) {
      setIsSearchingDb(true);
      const timer = setTimeout(() => {
        const queryTerm = searchQuery.trim();
        Promise.all([
          fetchInstitutionsFromDb(selectedYear, selectedMonth, queryTerm),
          fetchInvoicesFromDb({
            search: queryTerm,
            year: selectedYear,
            month: selectedMonth,
            limit: 100
          })
        ]).then(([instRes, invRes]) => {
          if (instRes && instRes.rows) {
            setDbSearchInstitutions(instRes.rows);
          } else {
            setDbSearchInstitutions([]);
          }
          if (invRes && invRes.rows) {
            setDbSearchResults(invRes.rows);
          } else {
            setDbSearchResults([]);
          }
        }).catch(() => {
          setDbSearchInstitutions([]);
          setDbSearchResults([]);
        }).finally(() => {
          setIsSearchingDb(false);
        });
      }, 250);
      return () => {
        clearTimeout(timer);
      };
    } else {
      setIsSearchingDb(false);
      setDbSearchInstitutions(null);
      setDbSearchResults(null);
    }
  }, [searchQuery, dbStatus?.connected, selectedYear, selectedMonth]);

  // Keep institutions closed by default even when searching, or when month/year changes, and reset local filter queries
  useEffect(() => {
    setExpandedClients(new Set());
    setClientFilterQueries({});
  }, [selectedYear, selectedMonth, searchQuery]);

  // Filtered and sorted clients based on active year and month
  const filteredClients = useMemo(() => {
    // Ekki birta neinn lista fyrr en notandi hefur valið bæði ár og mánuð
    if (!selectedYear || !selectedMonth) {
      return [];
    }

    const q = searchQuery.toLowerCase().trim();
    const baseStofnanir = dbStatus?.connected
      ? (dbInstitutions ?? [])
      : monthlyData.stofnanir;

    // 1. Ef leitað er í raunverulegum PostgreSQL gagnagrunni og við höfum fengið nákvæmar heildartölur úr /api/institutions?search=...
    if (dbStatus?.connected && q && dbSearchInstitutions !== null) {
      const results = dbSearchInstitutions.map(st => {
        const matchingSampleInvoices = (dbSearchResults || []).filter(
          inv => (inv.client || '').toLowerCase() === st.client.toLowerCase()
        ).map(inv => ({
          id: inv.id,
          client: inv.client || st.client,
          supplier: inv.supplier,
          amount: inv.amount,
          date: formaDags(inv.date, selectedYear),
          lines: (inv.lines || []).map(l => ({
            description: l.description,
            amount: l.amount,
            is_kredit: l.is_kredit ?? (l.amount < 0)
          }))
        }));

        return {
          client: st.client,
          invoiceCount: st.invoiceCount,
          lineCount: st.lineCount || st.invoiceCount,
          totalAmount: st.totalAmount,
          isInstitutionMatch: st.client.toLowerCase().includes(q),
          matchingInvoices: matchingSampleInvoices
        };
      });

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
        // Sjálfgefið raða eftir hæstu upphæð
        results.sort((a, b) => b.totalAmount - a.totalAmount);
      }

      return results;
    }

    if (!q) {
      let list = baseStofnanir.map(c => ({
        client: c.client,
        invoiceCount: c.invoiceCount,
        lineCount: 'lineCount' in c ? (c.lineCount || c.invoiceCount) : c.invoiceCount,
        totalAmount: c.totalAmount,
        isInstitutionMatch: false,
        matchingInvoices: dbInvoicesCache[c.client] || [],
      }));

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

    // When searching in mockData mode: calculate matching invoices and amounts specifically matching the search
    const results: Array<{
      client: string;
      invoiceCount: number;
      lineCount?: number;
      totalAmount: number;
      isInstitutionMatch: boolean;
      matchingInvoices: Invoice[];
    }> = [];

    for (const c of baseStofnanir) {
      const isClientMatch = c.client.toLowerCase().includes(q);
      const allInvoices = (dbInvoicesCache[c.client] && dbInvoicesCache[c.client].length > 0)
        ? dbInvoicesCache[c.client]
        : (dbStatus?.connected ? [] : monthlyData.getInvoicesForClient(c.client, c.totalAmount));

      if (isClientMatch) {
        // Entire institution matches search query
        results.push({
          client: c.client,
          invoiceCount: c.invoiceCount,
          lineCount: 'lineCount' in c ? (c.lineCount || c.invoiceCount) : c.invoiceCount,
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
            invoiceCount: new Set(matchedInvoices.map(i => i.id)).size,
            lineCount: matchedInvoices.length,
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
  }, [monthlyData, searchQuery, sortColumn, sortAsc, dbStatus?.connected, dbInstitutions, dbSearchInstitutions, dbSearchResults, dbInvoicesCache]);

  // Aggregate totals
  const totalAmount = useMemo(() => {
    return filteredClients.reduce((acc, c) => acc + c.totalAmount, 0);
  }, [filteredClients]);

  const totalInvoices = useMemo(() => {
    return filteredClients.reduce((acc, c) => acc + c.invoiceCount, 0);
  }, [filteredClients]);

  const totalLines = useMemo(() => {
    return filteredClients.reduce((acc, c) => acc + (c.lineCount ?? c.invoiceCount), 0);
  }, [filteredClients]);

  // Reikna síðustu greiðsludagsetningu úr raungögnum (úr dbOverview.maxDate)
  const { latestPaidInvoiceDate, latestMonthNameAndYear } = useMemo(() => {
    let formattedStr = '31. ágúst 2026';
    let monthYear = 'ágúst 2026';

    if (dbOverview?.maxDate) {
      const formatted = formaDags(dbOverview.maxDate);
      if (formatted) {
        const parts = formatted.split('-');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const mIdx = parseInt(parts[1], 10);
          const yr = parts[2];
          const mNames = ['', 'janúar', 'febrúar', 'mars', 'apríl', 'maí', 'júní', 'júlí', 'ágúst', 'september', 'október', 'nóvember', 'desember'];
          if (mNames[mIdx]) {
            formattedStr = `${day}. ${mNames[mIdx]} ${yr}`;
            monthYear = `${mNames[mIdx]} ${yr}`;
          } else {
            formattedStr = formatted;
            monthYear = yr;
          }
        }
      }
    }
    return { latestPaidInvoiceDate: formattedStr, latestMonthNameAndYear: monthYear };
  }, [dbOverview?.maxDate]);

  // Athuga hvort verið sé að sækja gögn úr gagnagrunni (við upphaf, leit eða breytingu á tímabili)
  const isDataLoading = Boolean(
    isLoadingDb ||
    isSearchingDb ||
    isUpdating ||
    (dbStatus === null && selectedYear && selectedMonth) ||
    (dbStatus?.connected && dbInstitutions === null && selectedYear && selectedMonth)
  );

  const toggleClientExpand = (clientName: string) => {
    const willExpand = !expandedClients.has(clientName);
    setExpandedClients(prev => {
      const next = new Set(prev);
      if (next.has(clientName)) {
        next.delete(clientName);
      } else {
        next.add(clientName);
      }
      return next;
    });

    if (willExpand && dbStatus?.connected && dbSuppliersCache[clientName] === undefined && !loadingSuppliersForClient[clientName]) {
      fetchSuppliersForClient(clientName);
    }
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
        dags: formaDags(inv.date, selectedYear),
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

  const handleClearSelectedInvoices = () => {
    setSelectedInvoices([]);
  };

  const emailMailtoUrl = useMemo(() => {
    if (selectedInvoices.length === 0) return '#';
    const selectedClients = Array.from(new Set(selectedInvoices.map(i => i.client))).join(', ');
    const subject = encodeURIComponent(`Upplýsingabeiðni skv. lögum nr. 140/2012 - ${selectedClients || 'Reikningar ríkisins'}`);
    const body = encodeURIComponent(legalPetitionText);
    return `mailto:?subject=${subject}&body=${body}`;
  }, [selectedInvoices, legalPetitionText]);

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
            {isLoadingDb && (
              <span className="text-[10px] text-neutral-500 font-mono flex items-center gap-1 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin text-neutral-400" /> Sæki nýjustu gögn...
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mt-1">
            Gegnsæi & Eftirlit með opinberum reikingum ríkisstjórna Íslands
          </p>
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
              <option value="">-- Veldu ár --</option>
              {broadSearchYearsEnabled && (
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
              <option value="">-- Veldu mánuð --</option>
              {broadSearchMonthsEnabled && (
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
            {broadSearchYearsEnabled && broadSearchMonthsEnabled && (
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
                    if (isAllMonths && !broadSearchMonthsEnabled) setSelectedMonth('1');
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
              <strong>Upplýsingar um nýjustu gögn:</strong> Síðustu greiddu reikningar í gagnagrunninum ná til <strong>{latestPaidInvoiceDate}</strong>. Eftir {latestMonthNameAndYear} hafa reikningar ekki verið gefnir út af Fjársýslunni enn sem komið er. Gögnin uppfærast sjálfkrafa um leið og nýir reikningar eru lesnir inn.
            </div>
          </div>
        )}
      </section>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Left Column: Tables & Shock Factor */}
        <section className="space-y-4">
          {!selectedYear || !selectedMonth ? (
            <div className="bg-white border-2 border-dashed border-neutral-300 rounded-xl p-10 sm:p-14 text-center shadow-xs">
              <div className="w-14 h-14 rounded-full bg-neutral-100 border border-neutral-300 flex items-center justify-center mx-auto mb-4 text-neutral-700">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-neutral-900 uppercase tracking-tight">
                Veldu ár og mánuð til að birta lista
              </h3>
              <p className="text-xs text-neutral-600 max-w-md mx-auto mt-2 leading-relaxed font-medium">
                Leitarskilyrði eru tóm að sjálfgefnu. Vinsamlegast veldu <strong>ár</strong> og <strong>mánuð</strong> í valmyndinni hér að ofan til að sækja og birta sundurliðaðan lista yfir stofnanir og reikninga.
              </p>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`bg-white border border-neutral-900 p-4 rounded-xl shadow-xs flex flex-col justify-start transition-opacity duration-150 ${isDataLoading ? 'ring-1 ring-neutral-300' : ''}`}>
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
                {isDataLoading ? (
                  <span className="text-[10px] font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded border border-neutral-300 flex items-center gap-1 font-mono">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin text-neutral-500" />
                    Sæki gögn...
                  </span>
                ) : searchQuery.trim() ? (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300">
                    Síað eftir leit
                  </span>
                ) : null}
              </div>
              <div className="mt-2 min-h-[58px] flex flex-col justify-center">
                {isDataLoading ? (
                  <div className="flex items-center gap-2.5 text-neutral-700 py-1">
                    <RefreshCw className="w-5 h-5 animate-spin text-neutral-800" />
                    <span className="text-base sm:text-lg font-bold font-mono text-neutral-800 tracking-tight">
                      Sæki gögn úr gagnagrunni...
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl sm:text-3xl font-black text-neutral-900 font-mono tracking-tight whitespace-nowrap">
                      {formaTolu(totalInvoices)}
                    </div>
                    <div className="mt-1 text-xs font-bold text-neutral-500">
                      {searchQuery.trim()
                        ? `reikningar sem passa við „${searchQuery.trim()}“ (${formaTolu(totalLines)} bókhaldslínur samtals)`
                        : `einkvæmir reikningar í völdu tímabili (${formaTolu(totalLines)} bókhaldslínur samtals)`}
                    </div>
                  </>
                )}
              </div>

              {/* Dashed divider matching the right card */}
              <div className="mt-3 pt-3 border-t border-dashed border-neutral-300 text-xs text-neutral-700 italic leading-relaxed">
                {isDataLoading ? (
                  <span className="text-neutral-400">🗣️ <em>„Sæki gögn úr gagnagrunni...“</em></span>
                ) : (
                  <span>🗣️ <em>„{fjoldiITexta(totalInvoices)}“</em></span>
                )}
              </div>
            </div>

            <div className={`bg-white border border-neutral-900 p-4 rounded-xl shadow-xs flex flex-col justify-start transition-opacity duration-150 ${isDataLoading ? 'ring-1 ring-neutral-300' : ''}`}>
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
                {isDataLoading ? (
                  <span className="text-[10px] font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded border border-neutral-300 flex items-center gap-1 font-mono">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin text-neutral-500" />
                    Sæki gögn...
                  </span>
                ) : searchQuery.trim() ? (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300">
                    Síað eftir leit
                  </span>
                ) : null}
              </div>
              <div className="mt-2 min-h-[58px] flex flex-col justify-center">
                {isDataLoading ? (
                  <div className="flex items-center gap-2.5 text-neutral-700 py-1">
                    <RefreshCw className="w-5 h-5 animate-spin text-neutral-800" />
                    <span className="text-base sm:text-lg font-bold font-mono text-neutral-800 tracking-tight">
                      Sæki gögn úr gagnagrunni...
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl sm:text-3xl font-black text-neutral-900 font-mono tracking-tight whitespace-nowrap overflow-x-auto">
                      {formaTolu(totalAmount)} kr.
                    </div>
                    <div className="mt-1 text-xs font-bold text-blue-700">
                      (~{stuttTala(totalAmount)})
                    </div>
                  </>
                )}
              </div>

              {/* The signature "Shock-factor" Icelandic spoken algorithm */}
              <div className="mt-3 pt-3 border-t border-dashed border-neutral-300 text-xs text-neutral-700 italic leading-relaxed">
                {isDataLoading ? (
                  <span className="text-neutral-400">🗣️ <em>„Sæki gögn úr gagnagrunni...“</em></span>
                ) : (
                  <span>🗣️ <em>„{talaITexta(totalAmount)}“</em></span>
                )}
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-neutral-900 rounded-xl overflow-hidden shadow-xs">
            {/* Contextual Table Header Bar with Excel / CSV export */}
            <div className="bg-neutral-50 px-3.5 py-2.5 border-b border-neutral-200 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-800">
                <span>Sundurliðun eftir stofnunum</span>
                <span className="text-[11px] font-normal text-neutral-500 font-mono">
                  ({formaTolu(filteredClients.length)} {filteredClients.length === 1 ? 'stofnun' : 'stofnanir'})
                </span>
              </div>
              <button
                onClick={handleExportCsv}
                disabled={filteredClients.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 hover:border-neutral-400 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Flytja út þennan lista yfir stofnanir og reikninga á CSV sniði fyrir Excel"
              >
                <Download className="w-3.5 h-3.5 text-neutral-600" />
                <span>Flytja út í Excel (CSV)</span>
              </button>
            </div>

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
                <tbody className="divide-y divide-neutral-200">
                  {isDataLoading ? (
                    <tr>
                      <td colSpan={3} className="p-12 text-center text-neutral-600 font-mono text-xs">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <RefreshCw className="w-6 h-6 animate-spin text-neutral-800" />
                          <span className="font-bold text-neutral-900 text-sm font-mono">
                            Sæki gögn úr gagnagrunni...
                          </span>
                          <span className="text-xs text-neutral-500 font-sans">
                            Sæki sundurliðað yfirlit yfir stofnanir og reikninga ({isAllYears ? 'Öll ár' : selectedYear} / {isAllMonths ? 'Allir mánuðir' : monthlyData.monthName})
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-neutral-500 text-xs">
                        Engar færslur fundust við leitina.
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client, idx) => {
                      const isExpanded = expandedClients.has(client.client);
                      const realInvoices = dbInvoicesCache[client.client];
                      // Invoices specifically for this client: prioritize real PostgreSQL cache, then search matches, and ONLY use fallback if DB is completely offline
                      const invoicesForClient = 'matchingInvoices' in client && client.matchingInvoices 
                        ? client.matchingInvoices 
                        : (realInvoices 
                            ? realInvoices 
                            : (dbStatus?.connected ? [] : monthlyData.getInvoicesForClient(client.client, client.totalAmount)));

                      // Samræming á tölum: Ef leitað er að birgi og nákvæmar heildartölur birgisins hafa verið sóttar úr gagnagrunni (dbSuppliersCache)
                      const matchingCachedSupplier = (searchQuery.trim() && !client.isInstitutionMatch && dbSuppliersCache[client.client])
                        ? dbSuppliersCache[client.client].find(s => s.supplier.toLowerCase().includes(searchQuery.toLowerCase().trim()))
                        : null;

                      const displayInvoiceCount = matchingCachedSupplier ? matchingCachedSupplier.invoiceCount : client.invoiceCount;
                      const displayLineCount = matchingCachedSupplier ? (matchingCachedSupplier.lineCount || matchingCachedSupplier.invoiceCount) : client.lineCount;
                      const displayTotalAmount = matchingCachedSupplier ? matchingCachedSupplier.totalAmount : client.totalAmount;

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
                              <span title={displayLineCount && displayLineCount !== displayInvoiceCount ? `${formaTolu(displayInvoiceCount)} reikningar (${formaTolu(displayLineCount)} línur í reikningum)` : `${formaTolu(displayInvoiceCount)} reikningar`}>
                                {formaTolu(displayInvoiceCount)}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-neutral-900">
                              {formaTolu(displayTotalAmount)} kr.
                            </td>
                          </tr>

                          {/* Expanded Suppliers & Invoices Hierarchy */}
                          {isExpanded && (() => {
                            const mainSearch = searchQuery.trim();
                            const mainSearchLower = mainSearch.toLowerCase();
                            const isClientNameMatch = Boolean(mainSearchLower && client.client.toLowerCase().includes(mainSearchLower));

                            // Athuga hvort notandi hafi handvirkt breytt síunni í skúffunni fyrir þessa stofnun
                            const hasUserOverriddenFilter = client.client in clientFilterQueries;

                            // Ef notandi hefur ekki breytt henni handvirkt og aðalleit er virk (sem er ekki heiti stofnunarinnar sjálfrar, t.d. birgirinn „Ístak“),
                            // þá er aðalleitin sjálfgefið notuð sem sía svo birgjalistinn þrengist strax að viðkomandi birgja.
                            const effectiveFilter = hasUserOverriddenFilter
                              ? (clientFilterQueries[client.client] || '')
                              : (!isClientNameMatch && mainSearch ? mainSearch : '');

                            const clientFilter = effectiveFilter.toLowerCase().trim();
                            const isAutoFilteredFromMain = !hasUserOverriddenFilter && !isClientNameMatch && Boolean(mainSearch);
                            const isDbLoadingSuppliers = Boolean(dbStatus?.connected && loadingSuppliersForClient[client.client]);

                            // Suppliers resolution: either real DB grouped list or fallback mapped from local invoices
                            let rawSuppliers: Array<{ supplier: string; invoiceCount: number; lineCount?: number; totalAmount: number }> = [];
                            if (dbSuppliersCache[client.client] && dbSuppliersCache[client.client].length > 0) {
                              rawSuppliers = dbSuppliersCache[client.client];
                            } else if (invoicesForClient && invoicesForClient.length > 0) {
                              const map = new Map<string, { supplier: string; invoiceCount: number; lineCount: number; totalAmount: number; invoiceIds: Set<string> }>();
                              for (const inv of invoicesForClient) {
                                const supName = inv.supplier || 'Ótilgreindur birgir';
                                const existing = map.get(supName);
                                if (!existing) {
                                  map.set(supName, {
                                    supplier: supName,
                                    invoiceCount: 1,
                                    lineCount: 1,
                                    totalAmount: inv.amount,
                                    invoiceIds: new Set([inv.id])
                                  });
                                } else {
                                  existing.invoiceIds.add(inv.id);
                                  existing.invoiceCount = existing.invoiceIds.size;
                                  existing.lineCount += 1;
                                  existing.totalAmount += inv.amount;
                                }
                              }
                              rawSuppliers = Array.from(map.values()).map(s => ({
                                supplier: s.supplier,
                                invoiceCount: s.invoiceCount,
                                lineCount: s.lineCount,
                                totalAmount: s.totalAmount
                              })).sort((a, b) => b.totalAmount - a.totalAmount);
                            } else if (dbSuppliersCache[client.client]) {
                              rawSuppliers = dbSuppliersCache[client.client];
                            }

                            // Birgjaheiti sem passa við reikninga í matchingInvoices (ef leitað var að vörulýsingu eða reikningsnúmeri)
                            const matchingInvoicesList = 'matchingInvoices' in client && client.matchingInvoices ? client.matchingInvoices : [];
                            const matchingSuppliersSet = new Set(matchingInvoicesList.map(i => i.supplier.toLowerCase()));

                            // Filter suppliers list by effective filter query
                            const displaySuppliers = clientFilter
                              ? rawSuppliers.filter(s => {
                                  const sLower = s.supplier.toLowerCase();
                                  return sLower.includes(clientFilter) || (isAutoFilteredFromMain && matchingSuppliersSet.has(sLower));
                                })
                              : rawSuppliers;

                            return (
                              <tr className="bg-neutral-50/80">
                                <td colSpan={3} className="p-4 pl-8 border-l-4 border-neutral-900">
                                  <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-2xs">
                                     {/* Sub-header with institution title and supplier filter */}
                                    <div className="bg-neutral-100 p-3 text-xs font-bold text-neutral-700 border-b border-neutral-200 flex flex-wrap justify-between items-center gap-2">
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                        <span>
                                          Birgjar hjá: <strong className="text-neutral-900">{client.client}</strong> ({isAllYears && isAllMonths ? 'Öll ár & allir mánuðir' : isAllYears ? `Öll ár (${monthlyData.monthName})` : isAllMonths ? `Allt árið ${selectedYear}` : `${monthlyData.monthName} ${selectedYear}`})
                                        </span>
                                        <span className="text-[11px] font-semibold text-neutral-600 bg-neutral-200 px-2 py-0.5 rounded-full font-mono">
                                          {displaySuppliers.length} {displaySuppliers.length === 1 ? 'birgir' : 'birgjar'}
                                          {rawSuppliers.length > displaySuppliers.length && ` (af ${rawSuppliers.length})`}
                                        </span>
                                        {isAutoFilteredFromMain && (
                                          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full border border-blue-200 font-bold">
                                            Síað eftir aðalleit: „{mainSearch}“
                                            <button
                                              onClick={e => {
                                                e.stopPropagation();
                                                setClientFilterQueries(prev => ({ ...prev, [client.client]: '' }));
                                              }}
                                              className="text-blue-700 hover:text-blue-950 underline font-sans cursor-pointer ml-0.5 font-normal"
                                              title="Sýna alla birgja stofnunarinnar"
                                            >
                                              (sýna alla {rawSuppliers.length})
                                            </button>
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <div className="relative flex items-center">
                                          <input
                                            type="text"
                                            placeholder={`🔍 Sía birgja hjá ${client.client.split(' ')[0]}...`}
                                            value={effectiveFilter}
                                            onChange={e => {
                                              e.stopPropagation();
                                              const val = e.target.value;
                                              setClientFilterQueries(prev => ({ ...prev, [client.client]: val }));
                                            }}
                                            onClick={e => e.stopPropagation()}
                                            className="bg-white border border-neutral-300 rounded px-2.5 py-1 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 w-48 sm:w-64 transition shadow-2xs"
                                          />
                                          {effectiveFilter && (
                                            <button
                                              onClick={e => {
                                                e.stopPropagation();
                                                setClientFilterQueries(prev => ({ ...prev, [client.client]: '' }));
                                              }}
                                              className="absolute right-2 text-neutral-400 hover:text-neutral-700 text-xs font-bold cursor-pointer"
                                              title="Hreinsa síu og sýna alla birgja"
                                            >
                                              ✕
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Suppliers Accordion List */}
                                    <div className="p-3 bg-neutral-50/50 space-y-2">
                                      {isDbLoadingSuppliers && rawSuppliers.length === 0 ? (
                                        <div className="p-8 text-center text-neutral-600 font-mono text-xs flex items-center justify-center gap-2">
                                          <RefreshCw className="w-4 h-4 animate-spin text-neutral-500" />
                                          <span>Sæki lista yfir birgja hjá {client.client} úr PostgreSQL...</span>
                                        </div>
                                      ) : displaySuppliers.length === 0 ? (
                                        <div className="p-6 text-center text-neutral-500 italic text-xs bg-white rounded border border-neutral-200">
                                          {clientFilter 
                                            ? `Engir birgjar fundust með leitarorðinu „${clientFilter}“.`
                                            : 'Engir birgjar fundust fyrir þetta tímabil.'}
                                        </div>
                                      ) : (
                                        displaySuppliers.map(sup => {
                                          const supKey = `${client.client}:::${sup.supplier}`;
                                          const isSupExpanded = expandedSuppliers.has(supKey);
                                          const supInvoices = supplierInvoicesCache[supKey] || [];
                                          const isSupLoading = Boolean(supplierLoadingInvoices[supKey]);

                                          // Heildarfjöldi bókhaldslína hjá birgi
                                          const totalLines = sup.lineCount !== undefined ? sup.lineCount : sup.invoiceCount;

                                          // Staðbundið síuorð fyrir línur / reikningsnúmer hjá birgi
                                          const lineFilter = (supplierInvoiceFilters[supKey] || '').trim().toLowerCase();

                                          // Sía línur og reikninga staðvært (client-side) svo notandi geti flokkað fljótt
                                          const filteredSupInvoices = lineFilter
                                            ? supInvoices.filter(inv => {
                                                const matchId = String(inv.id || '').toLowerCase().includes(lineFilter);
                                                const matchDate = String(inv.date || '').toLowerCase().includes(lineFilter);
                                                const matchLine = inv.lines?.some(l => 
                                                  String(l.description || '').toLowerCase().includes(lineFilter) ||
                                                  String(l.amount || '').includes(lineFilter)
                                                );
                                                return matchId || matchDate || matchLine;
                                              })
                                            : supInvoices;

                                          const visibleLimit = supplierVisibleLimits[supKey] || 25;
                                          const paginatedSupInvoices = filteredSupInvoices.slice(0, visibleLimit);

                                          // Fjöldi stakra reikninga (reikningsnúmera)
                                          const uniqueInvoicesInCache = supInvoices.length > 0 ? new Set(supInvoices.map(i => i.id)).size : 0;
                                          const actualInvoiceCount = (uniqueInvoicesInCache > 0 && uniqueInvoicesInCache < sup.invoiceCount)
                                            ? uniqueInvoicesInCache
                                            : sup.invoiceCount;

                                          const hasMoreInvoices = !lineFilter && visibleLimit < totalLines;

                                          return (
                                            <div 
                                              key={sup.supplier}
                                              className={`border rounded-lg overflow-hidden transition-all bg-white ${
                                                isSupExpanded ? 'border-neutral-400 shadow-xs ring-1 ring-neutral-300/60' : 'border-neutral-200 hover:border-neutral-300'
                                              }`}
                                            >
                                              {/* Supplier Toggle Header */}
                                              <div
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  toggleSupplierExpand(client.client, sup.supplier, totalLines);
                                                }}
                                                className={`p-3 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 select-none transition-colors ${
                                                  isSupExpanded ? 'bg-neutral-100/90 text-neutral-900 font-medium' : 'bg-white hover:bg-neutral-50'
                                                }`}
                                              >
                                                <div className="flex items-center gap-2.5">
                                                  <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold transition-all ${
                                                    isSupExpanded ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-700'
                                                  }`}>
                                                    {isSupExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                                  </span>
                                                  <span className="font-bold text-neutral-900 text-xs sm:text-sm">
                                                    {sup.supplier}
                                                  </span>
                                                  <span 
                                                    title={`${formaTolu(totalLines)} ${totalLines === 1 ? 'lína' : 'línur'} í reikningum`}
                                                    className="text-[11px] font-semibold text-neutral-600 bg-neutral-200/80 px-2 py-0.5 rounded-full font-mono inline-flex items-center gap-1"
                                                  >
                                                    <span>{formaTolu(actualInvoiceCount)} {actualInvoiceCount === 1 ? 'reikningur' : 'reikningar'}</span>
                                                    {totalLines > actualInvoiceCount && (
                                                      <span className="text-neutral-500 font-normal">({formaTolu(totalLines)} línur)</span>
                                                    )}
                                                  </span>
                                                </div>
                                                <div className="flex items-center justify-between sm:justify-end gap-3">
                                                  <span className="text-[11px] text-neutral-500 font-medium hidden md:inline">
                                                    {isSupExpanded ? 'Smelltu til að loka' : 'Smelltu til að skoða reikninga'}
                                                  </span>
                                                  <span className="text-right font-mono font-bold text-xs sm:text-sm text-neutral-900">
                                                    {formaTolu(sup.totalAmount)} kr.
                                                  </span>
                                                </div>
                                              </div>

                                              {/* Invoices List under Supplier */}
                                              {isSupExpanded && (
                                                <div className="p-3 border-t border-neutral-200 bg-white space-y-2.5">
                                                  {/* Fljótleg síun á línum og reikningsnúmerum fyrir birgi */}
                                                  <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-neutral-50 rounded border border-neutral-200 text-xs">
                                                    <div className="flex items-center gap-2">
                                                      <span className="font-bold text-neutral-700 text-[11px] uppercase tracking-wide">
                                                        Flokka línur hjá {sup.supplier}:
                                                      </span>
                                                      <div className="relative flex items-center">
                                                        <input
                                                          type="text"
                                                          placeholder="🔍 Sía vörulýsingu eða reikningsnúmer..."
                                                          value={supplierInvoiceFilters[supKey] || ''}
                                                          onChange={e => {
                                                            e.stopPropagation();
                                                            const val = e.target.value;
                                                            setSupplierInvoiceFilters(prev => ({ ...prev, [supKey]: val }));
                                                          }}
                                                          onClick={e => e.stopPropagation()}
                                                          className="bg-white border border-neutral-300 rounded px-2.5 py-1 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 w-52 sm:w-72 shadow-2xs"
                                                        />
                                                        {supplierInvoiceFilters[supKey] && (
                                                          <button
                                                            onClick={e => {
                                                              e.stopPropagation();
                                                              setSupplierInvoiceFilters(prev => ({ ...prev, [supKey]: '' }));
                                                            }}
                                                            className="absolute right-2 text-neutral-400 hover:text-neutral-700 text-xs font-bold cursor-pointer"
                                                            title="Hreinsa síu á línum"
                                                          >
                                                            ✕
                                                          </button>
                                                        )}
                                                      </div>
                                                    </div>
                                                    {lineFilter && (
                                                      <span className="text-[11px] font-mono text-neutral-600 bg-white px-2 py-0.5 rounded border border-neutral-200">
                                                        Fann {filteredSupInvoices.length} af {supInvoices.length} sóttum línum
                                                      </span>
                                                    )}
                                                  </div>

                                                  {isSupLoading && supInvoices.length === 0 ? (
                                                    <div className="p-6 text-center text-neutral-600 font-mono text-xs flex items-center justify-center gap-2">
                                                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-neutral-500" />
                                                      <span>Sæki reikninga fyrir {sup.supplier} (raðað eftir dags frá byrjun mánaðar)...</span>
                                                    </div>
                                                  ) : supInvoices.length === 0 ? (
                                                    <div className="p-4 text-center text-neutral-500 italic text-xs">
                                                      Engir reikningar fundust fyrir þennan birgi.
                                                    </div>
                                                  ) : filteredSupInvoices.length === 0 ? (
                                                    <div className="p-4 text-center text-neutral-500 italic text-xs bg-neutral-50 rounded border border-neutral-200">
                                                      Engar línur eða reikningsnúmer fundust með leitarorðinu „{lineFilter}“.
                                                      <button
                                                        onClick={() => setSupplierInvoiceFilters(prev => ({ ...prev, [supKey]: '' }))}
                                                        className="ml-2 text-neutral-800 font-bold underline cursor-pointer"
                                                      >
                                                        Hreinsa síu
                                                      </button>
                                                    </div>
                                                  ) : (
                                                    <>
                                                      <div className="overflow-x-auto">
                                                        <table className="w-full text-xs text-left border-collapse">
                                                          <thead>
                                                            <tr className="bg-neutral-50 text-neutral-600 border-b border-neutral-200 text-[11px] font-bold uppercase">
                                                              <th className="p-2 w-32" title="Greiðsludagsetning (dagsetning þegar greiðsla fór fram úr ríkissjóði, ekki útgáfudagur reiknings)">Greiðsludags.</th>
                                                              <th className="p-2 w-36">Reikningsnr.</th>
                                                              <th className="p-2">Skýring / Vörulýsing</th>
                                                              <th className="p-2 text-right">Upphæð / Beiðni</th>
                                                            </tr>
                                                          </thead>
                                                          <tbody className="divide-y divide-neutral-100">
                                                            {paginatedSupInvoices.map((inv, invIdx) => {
                                                              const isAlreadySelected = selectedInvoices.some(i => i.reikningsnr === inv.id);
                                                              const uniqueInvoiceKey = `${inv.id}-${invIdx}-${inv.date || ''}-${inv.amount || 0}`;
                                                              const hasMultipleLines = Boolean(inv.lines && inv.lines.length > 1);

                                                              return (
                                                                <React.Fragment key={uniqueInvoiceKey}>
                                                                  <tr className="hover:bg-neutral-50/80 transition-colors">
                                                                    <td className="p-2 font-mono text-neutral-600 whitespace-nowrap">
                                                                      {formaDags(inv.date, selectedYear)}
                                                                    </td>
                                                                    <td className="p-2 font-mono whitespace-nowrap">
                                                                      <span 
                                                                        className="font-bold text-neutral-800 hover:text-neutral-950 cursor-pointer bg-neutral-100 hover:bg-neutral-200 px-1.5 py-0.5 rounded transition text-[11px]"
                                                                        onClick={e => {
                                                                          e.stopPropagation();
                                                                          setSupplierInvoiceFilters(prev => ({ ...prev, [supKey]: String(inv.id) }));
                                                                        }}
                                                                        title="Smelltu til að flokka og sía einungis þetta reikningsnúmer"
                                                                      >
                                                                        {inv.id}
                                                                      </span>
                                                                      {hasMultipleLines && (
                                                                        <span 
                                                                          className="ml-1.5 text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded font-sans inline-block"
                                                                          title={`Reikningurinn inniheldur ${inv.lines.length} línur`}
                                                                        >
                                                                          {inv.lines.length} línur
                                                                        </span>
                                                                      )}
                                                                    </td>
                                                                    <td className="p-2 text-neutral-800">
                                                                      {inv.lines?.[0]?.description || 'Almennur rekstur'}
                                                                    </td>
                                                                    <td className="p-2 text-right font-mono font-bold text-neutral-900 whitespace-nowrap">
                                                                      {onOpenWhistleblower && (
                                                                        <button
                                                                          onClick={e => {
                                                                            e.stopPropagation();
                                                                            onOpenWhistleblower({
                                                                              institution: inv.client || client.client,
                                                                              supplier: inv.supplier || sup.supplier,
                                                                              invoiceNumber: String(inv.id)
                                                                            });
                                                                          }}
                                                                          className="p-1 text-amber-700 hover:text-amber-950 hover:bg-amber-100 rounded text-[10px] font-bold mr-1.5 transition cursor-pointer inline-flex items-center align-middle"
                                                                          title="Benda á þennan reikning (Trúnaðarábending ríkisstarfsmanns)"
                                                                        >
                                                                          <ShieldAlert className="w-3.5 h-3.5" />
                                                                        </button>
                                                                      )}
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

                                                                  {/* Accounting ledger sub-lines if available */}
                                                                  {hasMultipleLines && (
                                                                    <tr className="bg-neutral-50/40">
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
                                                            })}
                                                          </tbody>
                                                        </table>
                                                      </div>

                                                      {/* Pagination bar under supplier: 25 at a time, button to show next 25 */}
                                                      <div className="mt-2.5 pt-2.5 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                                                        <div className="text-neutral-600 flex items-center gap-1.5 font-mono">
                                                          <span>
                                                            {lineFilter ? (
                                                              <>Sýnir <strong className="text-neutral-900">{paginatedSupInvoices.length}</strong> af <strong className="text-neutral-900">{filteredSupInvoices.length}</strong> síuðum línum (af samtals {formaTolu(totalLines)} hjá {sup.supplier})</>
                                                            ) : (
                                                              <>Sýnir <strong className="text-neutral-900">{paginatedSupInvoices.length}</strong> af <strong className="text-neutral-900">{formaTolu(totalLines)}</strong> {totalLines === 1 ? 'línu' : 'línum'} í reikningum hjá {sup.supplier}</>
                                                            )}
                                                          </span>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                          {hasMoreInvoices && (
                                                            <button
                                                              onClick={e => {
                                                                e.stopPropagation();
                                                                handleLoadMoreForSupplier(client.client, sup.supplier, totalLines);
                                                              }}
                                                              disabled={isSupLoading}
                                                              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                                            >
                                                              {isSupLoading && <RefreshCw size={12} className="animate-spin" />}
                                                              Sýna næstu 25 línur ({Math.min(visibleLimit, totalLines)} af {formaTolu(totalLines)})
                                                            </button>
                                                          )}
                                                          {!hasMoreInvoices && !lineFilter && totalLines > 25 && (
                                                            <button
                                                              onClick={e => {
                                                                e.stopPropagation();
                                                                setSupplierVisibleLimits(prev => ({
                                                                  ...prev,
                                                                  [supKey]: 25
                                                                }));
                                                              }}
                                                              className="px-2.5 py-1 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-600 rounded text-xs font-semibold transition cursor-pointer"
                                                            >
                                                              Fella niður í 25
                                                            </button>
                                                          )}
                                                        </div>
                                                      </div>
                                                    </>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })
                                      )}
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
            </>
          )}
        </section>

        {/* Right Column: Sidebar Panels */}
        <aside className="space-y-5">
          {/* Information Request Builder (Upplýsingabeiðni skv. 140/2012) */}
          <div className="bg-white border-2 border-neutral-900 p-5 rounded-xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-tight text-neutral-900">
                    Upplýsingabeiðni
                  </h2>
                  <p className="text-[10px] text-neutral-500 font-medium">Skv. upplýsingalögum nr. 140/2012</p>
                </div>
              </div>
              <a
                href="https://www.althingi.is/lagas/nuna/2012140.html"
                target="_blank"
                rel="noopener noreferrer"
                title="Skoða Upplýsingalög nr. 140/2012 á vef Alþingis (opnast í nýjum glugga)"
                className="inline-flex items-center gap-1 text-[10px] bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 hover:border-neutral-400 px-2 py-0.5 rounded font-bold uppercase text-neutral-700 hover:text-neutral-900 transition-colors cursor-pointer"
              >
                <span>Lög 140/2012</span>
                <ExternalLink className="w-2.5 h-2.5 text-neutral-500" />
              </a>
            </div>

            {/* Context notice explaining hospital/procurement focus */}
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs text-neutral-700 space-y-2 leading-relaxed">
              <p className="font-bold text-neutral-900 flex items-center gap-1.5 text-[11px]">
                <span>💡</span>
                <span>Gagnsæi í ríkisrekstri</span>
              </p>
              <p className="text-[11px] text-neutral-600">
                Í flestum tilfellum tengjast stærstu birgjar ríkisins sjúkrahúsum og heilbrigðiskerfinu. Almenningur á lögvarinn rétt á að krefjast afrita af reikningum og fylgiskjölum frá öllum opinberum aðilum. En þetta vita allir — en hvar er þá restin af peningunum? Ekki vera föst í stærstu tölunum.
              </p>
              {onOpenWhistleblower && (
                <button
                  type="button"
                  onClick={() => onOpenWhistleblower()}
                  className="w-full mt-1.5 py-1.5 px-2.5 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 rounded-lg font-bold text-[11px] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                  <span>Ábendingar ríkisstarfsmanna (Trúnaðarmál / Bruðl)</span>
                </button>
              )}
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Smelltu á <strong>➕ Senda inn</strong> við hvaða reikning sem er í töflunni hér til hliðar til að setja hann í tilbúna kröfugerð (allt að 5 reikningar í hverri beiðni).
            </p>

            {/* Selected Invoices List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-black uppercase text-neutral-500 tracking-wider">
                <span>Valdir reikningar ({selectedInvoices.length}/5):</span>
                {selectedInvoices.length > 0 && (
                  <button
                    onClick={handleClearSelectedInvoices}
                    className="text-[10px] text-neutral-500 hover:text-red-700 font-semibold normal-case cursor-pointer underline"
                  >
                    Hreinsa allt
                  </button>
                )}
              </div>

              {selectedInvoices.length === 0 ? (
                <div className="p-4 bg-neutral-50 rounded-lg border border-dashed border-neutral-300 text-xs text-neutral-500 text-center space-y-1">
                  <div className="font-semibold text-neutral-700">Enginn reikningur valinn enn</div>
                  <div className="text-[11px] text-neutral-400">Smelltu á ➕ Senda inn hjá hvaða stofnun sem er til að bæta reikningi við.</div>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedInvoices.map(item => (
                    <div
                      key={item.reikningsnr}
                      className="bg-neutral-50 border border-neutral-200 p-2.5 rounded-lg flex items-start justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0 pr-1">
                        <div className="font-bold text-neutral-900 truncate" title={item.supplier}>
                          {item.supplier}
                        </div>
                        <div className="text-[10px] text-neutral-600 truncate">
                          {item.client}
                        </div>
                        <div className="text-neutral-500 text-[11px] font-mono mt-0.5">
                          {item.reikningsnr} • {item.dags} • <strong className="text-neutral-800">{formaTolu(item.amount)} kr.</strong>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveInvoiceFromRequest(item.reikningsnr)}
                        className="text-neutral-400 hover:text-red-600 p-1 cursor-pointer transition shrink-0"
                        title="Fjarlægja úr beiðni"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <div className="p-2 bg-neutral-100 rounded text-right font-mono text-[11px] text-neutral-700 font-bold">
                    Samtals: {formaTolu(selectedInvoices.reduce((sum, i) => sum + (i.amount || 0), 0))} kr.
                  </div>
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

              <a
                href={emailMailtoUrl}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 border border-neutral-900 ${
                  selectedInvoices.length === 0
                    ? 'bg-neutral-100 text-neutral-400 border-neutral-300 pointer-events-none cursor-not-allowed'
                    : 'bg-white hover:bg-neutral-100 text-neutral-900 cursor-pointer shadow-xs'
                }`}
              >
                <Mail className="w-4 h-4" /> Opna í tölvupósti
              </a>

              <details className="text-[11px] text-neutral-600 bg-neutral-50 p-2.5 rounded border border-neutral-200 cursor-pointer">
                <summary className="font-bold text-neutral-800 select-none flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Forskoða lögfræðilegan texta beiðninnar</span>
                </summary>
                <pre className="mt-2 whitespace-pre-wrap font-mono text-[10px] text-neutral-700 bg-white p-2.5 border border-neutral-200 rounded max-h-48 overflow-y-auto leading-relaxed">
                  {legalPetitionText}
                </pre>
              </details>


            </div>
          </div>
        </aside>
      </div>

      {/* Footer / Info bar */}
      <footer className="pt-6 pb-2 border-t border-neutral-300 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-600">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-neutral-800" />
          <span className="font-bold text-neutral-900">Ríkisgát</span>
          <span className="text-neutral-400">|</span>
          <span>Sjálfstætt borgaralegt eftirlit með opinberum útgjöldum Íslands</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap font-bold text-neutral-700">
          {onOpenStats && (
            <button
              onClick={onOpenStats}
              className="hover:text-neutral-900 hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <Landmark className="w-3.5 h-3.5 text-neutral-700" />
              <span>Ríkið í tölum</span>
            </button>
          )}
          {onOpenAbout && (
            <button
              onClick={onOpenAbout}
              className="hover:text-neutral-900 hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-neutral-700" />
              <span>Um Ríkisgát</span>
            </button>
          )}
          {onOpenSupport && (
            <button
              onClick={onOpenSupport}
              className="hover:text-neutral-900 hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 text-neutral-700" />
              <span>Viltu styrkja okkur?</span>
            </button>
          )}
          <button
            onClick={onOpenDashboard}
            className="text-neutral-500 hover:text-neutral-900 hover:underline cursor-pointer"
          >
            Innra Stjórnborð
          </button>
        </div>
      </footer>

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
